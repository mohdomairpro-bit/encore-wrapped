# Encore Wrapped

Year-in-music story pages for the Encore Discord bot.

- `wrapped.html` — the story (served at `/w/<id>`)
- `api/wrapped.js` — stores/reads Wrapped data in Upstash Redis
- `api/img.js` — image proxy (halftone prints + "Save image")
- `/w/demo` — example with made-up data

Environment variables (Vercel → Settings → Environment Variables):
- `WRAPPED_SECRET` — any long random string; put the same one in the bot as `WRAPPED_SECRET`
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` — added automatically when you connect Upstash in Vercel → Storage
