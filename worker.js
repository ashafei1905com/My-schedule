// Cloudflare Worker — AI proxy for جدول عبدالله
//
// Uses Groq's free API (https://groq.com) instead of a paid provider — genuinely free,
// no credit card, no expiry, and Groq's standard terms do not use your API data to
// train their models (unlike some other free-tier providers). Model is an open-weight
// model (Llama 3.3 70B), not a frontier proprietary model — real capability tradeoff
// for zero cost, made explicitly at Abdullah's request.
//
// This Worker exists SOLELY so the Groq API key never appears in the browser or in the
// public GitHub repo. The static site calls THIS Worker; this Worker (running on
// Cloudflare's servers, not in anyone's browser) calls Groq with the real key, which is
// stored as a Cloudflare secret, never in this source file.
//
// Setup:
//   1. Paste this into the Cloudflare Worker editor, deploy.
//   2. Settings -> Variables and Secrets -> add secret GROQ_API_KEY = gsk_...
//      (get one free, no card, at console.groq.com)
//   3. Replace ALLOWED_ORIGIN below with your actual GitHub Pages URL.
//   4. Copy the Worker's URL (shown after deploy, like https://xxx.workers.dev) into
//      index.html where indicated (AI_WORKER_URL constant).

const ALLOWED_ORIGIN = 'https://ashafei1905com.github.io';
const MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 600; // keeps each reply short — matters more here since free-tier daily request/token budgets are finite

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const origin = request.headers.get('Origin') || '';
    if (ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) {
      return json({ error: 'Origin not allowed' }, 403);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const { messages, system } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'messages array required' }, 400);
    }
    // Hard cap conversation length sent per call — keeps token usage bounded against
    // Groq's free-tier daily token limit regardless of how long AI_CHAT has grown.
    const trimmedMessages = messages.slice(-20);

    // Groq's chat/completions endpoint is OpenAI-format: a flat messages array with
    // role "system"/"user"/"assistant" — the system prompt is a message, not a
    // separate top-level field like Anthropic's API.
    const groqMessages = system
      ? [{ role: 'system', content: system }, ...trimmedMessages]
      : trimmedMessages;

    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          max_completion_tokens: MAX_TOKENS,
          messages: groqMessages
        })
      });

      const data = await groqRes.json();
      if (!groqRes.ok) {
        return json({ error: data?.error?.message || 'Groq API error' }, groqRes.status);
      }

      const text = data?.choices?.[0]?.message?.content || '';
      return json({ text });
    } catch (e) {
      return json({ error: 'Upstream request failed: ' + e.message }, 502);
    }
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}