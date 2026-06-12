'use strict';

const GROK_ENDPOINT = 'https://api.x.ai/v1/chat/completions';
const DEFAULT_MODEL = 'grok-3-mini';
const SYSTEM_PROMPT = 'Sei un analista finanziario. Rispondi sempre in italiano in modo chiaro, concreto e conciso.';

function sendJson(res, statusCode, payload) {
  if (typeof res.status === 'function') {
    res.status(statusCode);
    return res.json(payload);
  }
  res.statusCode = statusCode;
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Allow', 'POST, OPTIONS');
  }
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) return JSON.parse(req.body);
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function extractText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        return part?.text || '';
      })
      .join('')
      .trim();
  }
  return '';
}

async function requestGrok(prompt, { apiKey, model = DEFAULT_MODEL, fetchImpl = fetch } = {}) {
  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error('Server AI non configurato. Imposta la variabile GROK_API nel deploy server-side.');
  }
  const response = await fetchImpl(GROK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]
    })
  });

  const rawBody = await response.text();
  let payload = {};
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      payload = {};
    }
  }

  if (!response.ok) {
    const detail = payload?.error?.message || payload?.error || rawBody || `HTTP ${response.status}`;
    throw new Error(`Servizio AI non disponibile: ${detail}`);
  }

  const text = extractText(payload);
  if (!text) throw new Error('La risposta AI è vuota.');
  return { text, model: payload.model || model };
}

async function handler(req, res, { env = process.env, fetchImpl = fetch } = {}) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Usa POST /api/ai per richiedere una nuova analisi.' });
  }

  if (!env.GROK_API) {
    return sendJson(res, 500, { error: 'Server AI non configurato. Imposta la variabile GROK_API nel deploy server-side.' });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    return sendJson(res, 400, { error: 'Richiesta AI non valida. Aggiorna la pagina e riprova.' });
  }

  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    return sendJson(res, 400, { error: 'Prompt mancante. Riprova dal pannello AI.' });
  }

  try {
    const result = await requestGrok(prompt, {
      apiKey: env.GROK_API,
      model: env.GROK_MODEL || DEFAULT_MODEL,
      fetchImpl
    });
    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, 502, { error: error.message || 'Errore AI inatteso.' });
  }
}

module.exports = function vercelHandler(req, res) {
  return handler(req, res);
};

module.exports.handler = handler;
module.exports.requestGrok = requestGrok;
module.exports.extractText = extractText;
