// Encore Wrapped — store and read Wrapped stories
//   POST /api/wrapped   (Authorization: Bearer <WRAPPED_SECRET>)  body = wrapped JSON  -> { id }
//   GET  /api/wrapped?id=<id>                                                         -> wrapped JSON
// Storage: Upstash Redis (Vercel → Storage → Upstash). Either env naming works.
const crypto = require("crypto");
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SECRET = process.env.WRAPPED_SECRET || "";
const TTL = 90 * 24 * 3600; // links work for 90 days

async function redis(cmd) {
  const r = await fetch(REDIS_URL, { method: "POST", headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error(`Redis ${r.status}`);
  return (await r.json()).result;
}
const safeEq = (a, b) => { const A = Buffer.from(String(a)), B = Buffer.from(String(b)); return A.length === B.length && crypto.timingSafeEqual(A, B); };

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const id = String(req.query?.id || "");
      if (id === "demo") return res.status(200).json(require("./demo.json"));
      if (!/^[A-Za-z0-9]{8,16}$/.test(id)) return res.status(400).json({ error: "That link isn't valid." });
      if (!REDIS_URL) return res.status(503).json({ error: "Storage isn't connected yet." });
      const raw = await redis(["GET", `ew:${id}`]);
      if (!raw) return res.status(404).json({ error: "This Wrapped has expired or never existed. Run /wrapped in Discord to make a new one." });
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.status(200).send(raw);
    }
    if (req.method === "POST") {
      const auth = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!SECRET || !safeEq(auth, SECRET)) return res.status(401).json({ error: "Wrong secret." });
      if (!REDIS_URL) return res.status(503).json({ error: "Storage isn't connected yet." });
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
      if (!body || body.v !== 1) return res.status(400).json({ error: "Bad data." });
      const raw = JSON.stringify(body);
      if (raw.length > 200_000) return res.status(413).json({ error: "Too big." });
      const id = crypto.randomBytes(9).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 10).padEnd(10, "x");
      await redis(["SET", `ew:${id}`, raw, "EX", String(TTL)]);
      return res.status(200).json({ id });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
};
