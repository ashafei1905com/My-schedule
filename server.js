import { setupLiveApiProxy } from './live-api-proxy.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import worker from './worker.js';
import dotenv from 'dotenv';
import { Headers, Request, Response, fetch } from 'undici';

// Optional: polyfill global fetch API items if missing, but Node 22 has them.
// We explicitly use undici for Request/Response to ensure compatibility with Cloudflare workers syntax.
globalThis.Request = Request;
globalThis.Response = Response;
globalThis.Headers = Headers;
globalThis.fetch = fetch;


const realKey = process.env.GEMINI_API_KEY;
dotenv.config();
if (realKey && realKey !== 'MY_GEMINI_API_KEY') {
  process.env.GEMINI_API_KEY = realKey;
}


const app = express();
const PORT = 3000;

// Mock D1 Database to replace Cloudflare D1
class MockD1 {
  constructor() {
    this.subscriptions = [];
    this.reminders = [];
    this.idCounter = 1;
  }
  prepare(sql) {
    return new MockStatement(this, sql);
  }
  async batch(statements) {
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  }
}

class MockStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.params = [];
  }
  bind(...args) {
    this.params = args;
    return this;
  }
  async run() {
    if (this.sql.includes('INSERT INTO push_subscriptions')) {
      const [user_uid, endpoint, p256dh, auth, created_at] = this.params;
      this.db.subscriptions = this.db.subscriptions.filter(s => s.endpoint !== endpoint);
      this.db.subscriptions.push({ user_uid, endpoint, p256dh, auth, created_at });
    } else if (this.sql.includes('INSERT INTO scheduled_reminders')) {
      const [user_uid, task_id, task_name, reminder_type, fire_date, fire_time, fired, created_at] = this.params;
      this.db.reminders.push({ id: this.db.idCounter++, user_uid, task_id, task_name, reminder_type, fire_date, fire_time, fired, created_at });
    } else if (this.sql.includes('DELETE FROM scheduled_reminders')) {
      const [uid, d] = this.params;
      this.db.reminders = this.db.reminders.filter(r => !(r.user_uid === uid && r.fire_date === d && r.fired === 0));
    } else if (this.sql.includes('DELETE FROM push_subscriptions')) {
      const [endpoint] = this.params;
      this.db.subscriptions = this.db.subscriptions.filter(s => s.endpoint !== endpoint);
    } else if (this.sql.includes('UPDATE scheduled_reminders')) {
      const [id] = this.params;
      const rem = this.db.reminders.find(r => r.id === id);
      if (rem) rem.fired = 1;
    }
    return { success: true };
  }
  async all() {
    if (this.sql.includes('SELECT * FROM scheduled_reminders')) {
      const [date, time, lookbackTime] = this.params;
      const results = this.db.reminders.filter(r => r.fire_date === date && r.fire_time <= time && r.fire_time >= lookbackTime && r.fired === 0);
      return { results };
    }
    return { results: [] };
  }
  async first() {
    if (this.sql.includes('SELECT * FROM push_subscriptions')) {
      const [uid] = this.params;
      const sorted = this.db.subscriptions.filter(s => s.user_uid === uid).sort((a, b) => b.created_at - a.created_at);
      return sorted[0] || null;
    }
    return null;
  }
}

const mockDB = new MockD1();

// Construct the environment for the Worker
console.log("SERVER ENV KEY: ", process.env.GEMINI_API_KEY);

import fsSync from 'fs';
let manualKey = '';
try {
  const envContent = fsSync.readFileSync('.env', 'utf8');
  const m = envContent.match(/GEMINI_API_KEY=(.*)/);
  if (m) manualKey = m[1].trim();
} catch(e){}

const workerEnv = {
  GEMINI_API_KEY: manualKey || process.env.GEMINI_API_KEY || '',

  USDA_API_KEY: process.env.USDA_API_KEY || 'DEMO_KEY',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || 'BKgn0lwYCrrfdSIX6PSaaR34nEO1g9FkZ9V3mlZmBAWY_fE7LcbI4osZ9CP8tQsfU1R5vLbg4S0GhNL3QiIOSnQ',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || 'TymR3ybbOYYxfxbBSP4E_DEDJbqd5ZOP1knkU-5rvwE',
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || 'mailto:ashafei1905@gmail.com',
  ALLOWED_ORIGIN: '', // Disable origin check in dev
  DB: mockDB,
};

// Express middleware to parse text/json as raw buffer so we can pass it to Request
app.use(express.raw({ type: '*/*', limit: '50mb' }));

// Forward API requests to the Cloudflare Worker module
app.use('/api', async (req, res) => {
  await forwardToWorker(req, res);
});
app.post('/', async (req, res) => {
  await forwardToWorker(req, res);
});

async function forwardToWorker(req, res) {
  try {
    const url = `http://${req.headers.host}${req.originalUrl}`;
    const init = {
      method: req.method,
      headers: req.headers,
    };
    if (req.method !== 'GET' && req.method !== 'HEAD' && Buffer.isBuffer(req.body) && req.body.length > 0) {
      init.body = req.body;
    }
    const request = new Request(url, init);
    const response = await worker.fetch(request, workerEnv);
    
    // Copy headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.status(response.status);
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('Error forwarding to worker:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}

// Serve static assets from the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));

// Fallback to index.html for SPA
app.get('*all', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Periodic execution of scheduled cron (runs every 60s)
setInterval(() => {
  console.log('Running cron trigger scheduled()');
  const event = { cron: '* * * * *', type: 'cron' };
  const ctx = {
    waitUntil: (promise) => promise.catch(err => console.error('Cron error:', err))
  };
  if (typeof worker.scheduled === 'function') {
    worker.scheduled(event, workerEnv, ctx).catch(err => console.error('Cron invocation failed:', err));
  }
}, 60000);

const httpServer = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://0.0.0.0:${PORT}`);
});
setupLiveApiProxy(httpServer);
