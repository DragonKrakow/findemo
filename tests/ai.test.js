'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');

const { handler, extractText } = require('../api/ai');

function createStreamRequest({ method = 'POST', body, bodyObject } = {}) {
  const stream = Readable.from(body ? [body] : []);
  stream.method = method;
  if (bodyObject !== undefined) stream.body = bodyObject;
  return stream;
}

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(chunk = '') {
      this.body += chunk;
    }
  };
}

test('extractText handles string and structured responses', () => {
  assert.equal(extractText({ choices: [{ message: { content: 'ciao' } }] }), 'ciao');
  assert.equal(
    extractText({ choices: [{ message: { content: [{ text: 'ciao ' }, { text: 'mondo' }] } }] }),
    'ciao mondo'
  );
});

test('handler rejects unsupported methods', async () => {
  const req = createStreamRequest({ method: 'GET' });
  const res = createResponse();

  await handler(req, res, { env: { GROK_API: 'secret' } });

  assert.equal(res.statusCode, 405);
  assert.match(res.body, /POST \/api\/ai/);
});

test('handler requires GROK_API', async () => {
  const req = createStreamRequest({ bodyObject: { prompt: 'Ciao' } });
  const res = createResponse();

  await handler(req, res, { env: {} });

  assert.equal(res.statusCode, 500);
  assert.match(res.body, /GROK_API/);
});

test('handler validates prompt', async () => {
  const req = createStreamRequest({ bodyObject: {} });
  const res = createResponse();

  await handler(req, res, { env: { GROK_API: 'secret' } });

  assert.equal(res.statusCode, 400);
  assert.match(res.body, /Prompt mancante/);
});

test('handler proxies successful Grok responses', async () => {
  const req = createStreamRequest({ bodyObject: { prompt: 'Analizza il mercato' } });
  const res = createResponse();

  await handler(req, res, {
    env: { GROK_API: 'secret', GROK_MODEL: 'grok-test' },
    fetchImpl: async (url, options) => {
      assert.equal(url, 'https://api.x.ai/v1/chat/completions');
      assert.equal(options.headers.Authorization, 'Bearer ' + 'secret');
      const payload = JSON.parse(options.body);
      assert.equal(payload.model, 'grok-test');
      assert.equal(payload.messages[1].content, 'Analizza il mercato');
      return {
        ok: true,
        text: async () => JSON.stringify({
          model: 'grok-test',
          choices: [{ message: { content: 'Analisi aggiornata' } }]
        })
      };
    }
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), { model: 'grok-test', text: 'Analisi aggiornata' });
});

test('handler surfaces upstream failures clearly', async () => {
  const req = createStreamRequest({ bodyObject: { prompt: 'Analizza il rischio' } });
  const res = createResponse();

  await handler(req, res, {
    env: { GROK_API: 'secret' },
    fetchImpl: async () => ({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: { message: 'Invalid API key' } })
    })
  });

  assert.equal(res.statusCode, 502);
  assert.match(res.body, /Invalid API key/);
});
