// Image proxy: lets the page print covers as halftones and save the poster as an image
// (browsers block drawing images from other sites otherwise). Only music/Discord image hosts.
const ALLOWED = /^(?:[a-z0-9-]+\.)*(dzcdn\.net|scdn\.co|spotifycdn\.com|ytimg\.com|sndcdn\.com|discordapp\.com|discordapp\.net|mzstatic\.com|deezer\.com|ggpht\.com|googleusercontent\.com)$/i;
module.exports = async (req, res) => {
  try {
    const u = new URL(String(req.query?.u || ""));
    if (u.protocol !== "https:" || !ALLOWED.test(u.hostname)) return res.status(400).end();
    const r = await fetch(u, { headers: { "User-Agent": "EncoreWrapped/1.0" } });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !/^image\//.test(type)) return res.status(404).end();
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 6_000_000) return res.status(413).end();
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    return res.status(200).send(buf);
  } catch { return res.status(400).end(); }
};
