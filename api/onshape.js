// Vercel serverless function — proxies OnShape API calls server-side to avoid CORS.
// GET  /api/onshape?path=/parts/d/...              → transparent proxy
// POST /api/onshape { action: 'evalFeatureScript' } → maps entity IDs to partIds via FS

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

  const authHeader = 'Basic ' + Buffer.from(`${osKey}:${osSecret}`).toString('base64');
  const baseHeaders = {
    'Authorization': authHeader,
    'Accept':        'application/json',
    'Content-Type':  'application/json',
  };

  // ── POST: evalFeatureScript — maps B-rep entity IDs to partIds ─────────────
  if (method === 'POST') {
    const { action } = req.body || {};

    if (action === 'evalFeatureScript') {
      const { docId, wvmType, wvmId, elementId, entityIds } = req.body;
      if (!docId || !wvmId || !elementId || !Array.isArray(entityIds) || !entityIds.length) {
        return res.status(400).json({ error: 'Missing fields for evalFeatureScript' });
      }

      const wvm = wvmType === 'v' ? 'v' : 'w';
      const fsUrl = `https://cad.onshape.com/api/v6/partstudios/d/${docId}/${wvm}/${wvmId}/e/${elementId}/featurescript`;

      // FeatureScript: use qOwnerPart + qTransient to resolve face/edge entity IDs
      // to the part that owns them. partId(context, entity) returns the string ID
      // that matches the partId field in the /parts REST API response (e.g. "JFD").
      //
      // The queries param arrives as a map — queries["ids"] is our array of selectionId strings.
      // We iterate, resolve each to its owner part, and collect unique partIds.
      const fsScript = `function(context is Context, queries) {
  var result = [];
  var seen = {};
  for (var eid in queries["ids"]) {
    try {
      var ownerQuery = qOwnerPart(qTransient(eid));
      for (var part in evaluateQuery(context, ownerQuery)) {
        var pid = partId(context, part);
        if (seen[pid] != true) {
          seen[pid] = true;
          result = append(result, pid);
        }
      }
    } catch {}
  }
  return result;
}`;

      const fsPayload = {
        script: fsScript,
        queries: [{ key: 'ids', value: entityIds }]
      };

      let rawText = '';
      try {
        const fsResp = await fetch(fsUrl, {
          method: 'POST',
          headers: baseHeaders,
          body: JSON.stringify(fsPayload)
        });

        rawText = await fsResp.text();
        console.log('[onshape proxy] FS status:', fsResp.status, '| body:', rawText.substring(0, 600));

        if (!fsResp.ok) {
          return res.status(500).json({
            error: `FS endpoint returned HTTP ${fsResp.status}`,
            detail: rawText.substring(0, 600)
          });
        }

        let fsData;
        try { fsData = JSON.parse(rawText); }
        catch(e) { return res.status(500).json({ error: 'FS response not JSON', detail: rawText.substring(0, 400) }); }

        console.log('[onshape proxy] FS parsed result:', JSON.stringify(fsData?.result).substring(0, 400));

        // Response shape: { result: { type: "array", value: [ {type:"string", value:"JFD"}, ... ] } }
        let partIds = [];
        const resultVal = fsData?.result?.value ?? fsData?.result?.items ?? [];
        partIds = resultVal
          .map(v => typeof v === 'string' ? v : (v?.value ?? ''))
          .filter(s => s && s.length > 0);
        partIds = [...new Set(partIds)];

        return res.json({ ok: true, partIds, raw: fsData });

      } catch (err) {
        return res.status(500).json({
          error: 'FeatureScript eval threw: ' + err.message,
          detail: rawText.substring(0, 400)
        });
      }
    }

    // Other POST actions — transparent proxy (e.g. translation requests)
    const { path } = req.query;
    if (!path) return res.status(400).json({ error: 'Missing path param for POST proxy' });
    const upstreamUrl = `https://cad.onshape.com/api/v6${path}`;
    try {
      const upstream = await fetch(upstreamUrl, { method: 'POST', headers: baseHeaders, body: JSON.stringify(req.body) });
      const data = await upstream.json();
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── GET: transparent proxy ─────────────────────────────────────────────────
  const { path } = req.query;
  if (!path) return res.status(400).json({ error: 'Missing path param' });
  const upstreamUrl = `https://cad.onshape.com/api/v6${path}`;

  try {
    const upstream = await fetch(upstreamUrl, { method: 'GET', headers: baseHeaders });
    const contentType = upstream.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);
    res.status(upstream.status);

    if (contentType.includes('application/json')) {
      return res.json(await upstream.json());
    } else {
      return res.send(Buffer.from(await upstream.arrayBuffer()));
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
