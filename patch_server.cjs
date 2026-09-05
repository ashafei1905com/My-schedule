const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const target = `// Forward API requests to the Cloudflare Worker module
app.use('/api', async (req, res) => {
  await forwardToWorker(req, res);
});`;

const replacement = `// Forward API requests to the Cloudflare Worker module
app.use('/api', async (req, res) => {
  await forwardToWorker(req, res);
});

app.post('/', async (req, res) => {
  await forwardToWorker(req, res);
});`;

code = code.replace(target, replacement);
fs.writeFileSync('server.js', code);
console.log('Restored app.post(/)');
