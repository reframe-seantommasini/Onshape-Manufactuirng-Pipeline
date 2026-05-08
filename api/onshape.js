// Vercel serverless function — proxies OnShape API calls server-side to avoid CORS.
// All GET requests: /api/onshape?path=/partstudios/d/.../bodydetails  → transparent proxy
// POST requests:    /api/onshape?path=/partstudios/d/.../translations  → transparent proxy
//
// Key endpoint used for face->part resolution:
//   GET /partstudios/d/{did}/{wvm}/{wvmid}/e/{eid}/bodydetails
//   Returns every body with its face IDs. Face IDs match the selectionId values
//   that OnShape sends in SELECTION postMessages, giving us the face->body bridge.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const method = req.method;
  if (method !== 'GET' && method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const osKey    = process.env.ONSHAPE_ACCESS_KEY;
  const osSecret = process.env.ONSHAPE_SECRET_KEY;
  if (!osKey || !osSecret) {
    return res.status(500).json({ error: 'OnShape credentials not configured on server' });
  }

  const { path } = req.query;
  if (!path) return res.status(400).json({ error: 'Missing path param' });

  // ── Path allowlist ──────────────────────────────────────────────────────────
  // Only proxy the specific OnShape API paths this app actually uses.
  // Without this, the proxy would forward requests to any OnShape endpoint
  // (documents list, user account, other teams' data, etc.) using the team's credentials.
  const ALLOWED_PATHS = [
    // Part list for a Part Studio
    /^\/parts\/d\/[^/?]+\/[wv]\/[^/?]+\/e\/[^/?]+(\?.*)?$/,
    // Part shaded-view thumbnail
    /^\/parts\/d\/[^/?]+\/[wv]\/[^/?]+\/e\/[^/?]+\/partid\/[^/?]+\/shadedviews(\?.*)?$/,
    // Body details (face→body map for selection resolution)
    /^\/partstudios\/d\/[^/?]+\/[wv]\/[^/?]+\/e\/[^/?]+\/bodydetails(\?.*)?$/,
    // FeatureScript evaluation (bounding-box geometry detection)
    /^\/partstudios\/d\/[^/?]+\/[wv]\/[^/?]+\/e\/[^/?]+\/featurescript(\?.*)?$/,
    // Translation request (STEP / DXF export)
    /^\/partstudios\/d\/[^/?]+\/[wv]\/[^/?]+\/e\/[^/?]+\/translations(\?.*)?$/,
    // Translation status poll
    /^\/translations\/[^/?]+(\?.*)?$/,
    // Translated file download (external data)
    /^\/documents\/d\/[^/?]+\/externaldata\/[^/?]+(\?.*)?$/,
  ];
  if (!ALLOWED_PATHS.some(re => re.test(path))) {
    return res.status(403).json({ error: 'Path not permitted' });
  }
  // ───────────────────────────────────────────────────────────────────────────

  const upstreamUrl = `https://cad.onshape.com/api/v6${path}`;
  const headers = {
    'Authorization': 'Basic ' + Buffer.from(`${osKey}:${osSecret}`).toString('base64'),
    'Accept':        'application/json',
    'Content-Type':  'application/json',
  };

  try {
    const body = method === 'POST' ? JSON.stringify(req.body) : undefined;
    const upstream = await fetch(upstreamUrl, { method, headers, body });

    const contentType = upstream.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);
    res.status(upstream.status);

    if (contentType.includes('application/json')) {
      return res.json(await upstream.json());
    } else {
      // Binary passthrough for STEP file downloads
      return res.send(Buffer.from(await upstream.arrayBuffer()));
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
