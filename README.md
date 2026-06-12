# findemo

`findemo` is now wired to use a server-side AI endpoint instead of calling Anthropic directly from browser JavaScript.

## AI refresh deployment

GitHub Pages can still host the static dashboard UI, but it cannot securely serve live AI refresh requests because repository secrets are not exposed to client-side code. The dashboard now expects a same-origin server-side endpoint at `/api/ai`.

This repository includes a Vercel-compatible serverless function at `api/ai.js` that:

- reads `GROK_API` on the server
- sends prompts to `https://api.x.ai/v1/chat/completions`
- returns only the generated text to the browser

### Required server-side environment variables

- `GROK_API` — required xAI/Grok API key
- `GROK_MODEL` — optional model override (defaults to `grok-3-mini`)

### Recommended hosting change

To keep the AI refresh secure and working, deploy the repo on a host that supports both static files and serverless functions (for example Vercel) and set `GROK_API` there with the same secret value you currently keep in GitHub as `GROK_API`.

If you keep the site on pure GitHub Pages without a server runtime, the dashboard will still load, but AI actions will show a clear configuration error until `/api/ai` is available.

## Lightweight validation

Run the server-side checks with:

```bash
npm test
```
