const express = require('express');
const { handler } = require('./api/ai');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://dragonkrakow.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.all('/api/ai', (req, res) => handler(req, res));

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'findemo-ai' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`findemo-ai listening on ${port}`);
});
