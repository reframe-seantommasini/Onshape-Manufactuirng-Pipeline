// Vercel serverless function — proxies all Slack API calls server-side.
// Slack token never touches the browser or the public repo.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const slackToken   = process.env.SLACK_TOKEN;
  const slackChannel = process.env.SLACK_CHANNEL;
  if (!slackToken || !slackChannel) {
    return res.status(500).json({ error: 'Slack credentials not configured on server' });
  }

  const { action, payload } = req.body;

  try {
    if (action === 'postMessage') {
      // Post the manufacturing card to Slack
      const p = payload;
      const fields = [
        ['Project', p.project],
        ['Status', p.status||'Not set'],
        ['Machine', p.machine||'TBD'], ['Material', p.material||'TBD'],
        ['Thickness', p.thickness||'TBD'], ['Type of Part', p.partType||'TBD'],
        ['Quantity', p.qty], ['Finish', p.finish||'None'],
        ['Assigned To', p.student||'Unassigned'],
        ['CAD Link', p.cadLink ? `<${p.cadLink}|Open in OnShape>` : 'N/A'],
        ['Part File', p.fileName||'None attached']
      ];
      const body = {
        channel: slackChannel,
        text: `🔧 NEW MANUFACTURING CARD: ${p.name}`,
        blocks: [
          { type:'header', text:{ type:'plain_text', text:`🔧 ${p.name}`, emoji:true } },
          { type:'section', fields: fields.slice(0,8).map(([k,v])=>({ type:'mrkdwn', text:`*${k}*\n${v}` })) },
          { type:'section', fields: fields.slice(8).map(([k,v])=>({ type:'mrkdwn', text:`*${k}*\n${v}` })) },
          ...(p.notes ? [{ type:'section', text:{ type:'mrkdwn', text:`*Notes*\n${p.notes}` } }] : []),
          { type:'divider' }
        ]
      };
      const resp = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+slackToken },
        body: JSON.stringify(body)
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || 'Slack error');
      return res.json({ ok: true });

    } else if (action === 'getUploadURL') {
      // Step A of file upload: get upload URL
      const resp = await fetch('https://slack.com/api/files.getUploadURLExternal', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+slackToken },
        body: JSON.stringify({ filename: payload.filename, length: payload.length })
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error);
      return res.json({ ok: true, upload_url: data.upload_url, file_id: data.file_id });

    } else if (action === 'completeUpload') {
      // Step C of file upload: complete and share to channel
      const resp = await fetch('https://slack.com/api/files.completeUploadExternal', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+slackToken },
        body: JSON.stringify({
          files: [{ id: payload.file_id, title: payload.title }],
          channel_id: slackChannel
        })
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error);
      return res.json({ ok: true });

    } else if (action === 'addListItem') {
      // Add a manufacturing card row to the Slack List.
      // Column IDs and option IDs discovered via getListSchema on 2026-03-21.
      const LIST_ID = 'F09T4DXL3L5';

      // --- Column IDs ---
      const COL_NAME        = 'Col09SSDZMJHM'; // rich_text  — Part name
      const COL_PROJECT     = 'Col09SSDZTDST'; // select     — Project
      const COL_MACHINE     = 'Col09T1FJ289Z'; // select     — Machine Type
      const COL_PART_TYPE   = 'Col09T1FJ4P99'; // select     — Part Type
      const COL_QTY         = 'Col09T4DXS9E1'; // number     — Quantity
      const COL_CAD_LINK    = 'Col09T5RRT1FY'; // rich_text  — Link to CAD
      const COL_ASSIGNEE    = 'Col09T7T75G9Y'; // user       — Assignee
      const COL_MATERIAL    = 'Col09T7T790N6'; // select     — Material & Thickness
      const COL_FINISH      = 'Col09TBEF46N8'; // select     — Finish
      const COL_STATUS      = 'Col09U26V5LE4'; // select     — Select (status)
      const COL_ATTACHMENT  = 'Col09U26V8Q48'; // attachment — Drawing/Part File
      const COL_NOTES       = 'Col09TLQC8G9F'; // rich_text  — Details or Notes
      // COL_SUBMITTED_BY (Col09T5RRMVK8) and COL_DATE_SUBMITTED (Col09TBEF0E04) are auto-filled

      // --- Option IDs: Project ---
      const PROJECT_OPTS = {
        'Dev Bot':          'Opt7L5A1DYV', // using Comp Bot ID as placeholder — see note
        'Prototype':        'Opt8FGSDRSA',
        'Comp Bot':         'Opt7L5A1DYV',
        'Spare':            'OptY8K9J0UX',
        'Off-Season':       'OptZ7BKNFZV',
        'Kitbot':           'OptP6FO92CK',
        // 'Shop Improvement', 'Robot Cart', '2020 Turret' — IDs not yet observed in data
      };

      // --- Option IDs: Machine Type ---
      const MACHINE_OPTS = {
        'CNC Router':  'OptVU1N66GK',
        'Lathe':       'OptWWAG8QCN',
        'CNC Mill':    'OptCYALA6IJ',
        'Mill':        'OptL1IZAYBZ',
        '3D Printer':  'OptVYDGOJV7',
        'Chop Saw':    'OptAT903MBL',
        // 'Laser' ID not yet observed
      };

      // --- Option IDs: Part Type ---
      const PART_TYPE_OPTS = {
        'Plate':        'OptVTTRUKMD', // "Sheet/Plate" in list
        'Hex Shaft':    'Opt9YD9VBQQ', // confirm — "Cylindrical Shaft" may be this
        'Round Shaft':  'Opt9YD9VBQQ', // same column option, confirm
        'Tube 1x1in':   'Opt5POFQV4D',
        'Billet':       'OptZ0BEJFZJ',
        // Tube 1x2, 2x2, 3x1, 0.5x1 — IDs not yet observed
      };

      // --- Option IDs: Material & Thickness ---
      const MATERIAL_OPTS = {
        'Aluminum':  'OptMG7575FE',
        'Steel':     'OptYCP8F9MG',
        'SRPP':      'OptOMIMONEM',
        // Polycarb, PLA+, Nylon CF, Nylon GF, thicknesses — IDs not yet observed
      };

      // --- Option IDs: Finish ---
      const FINISH_OPTS = {
        'None':   'OptTX86VLIY',
        'Black':  'OptXSUN6AGU',
        'Blue':   'OptHTBDGBXM',
        // Yellow, Pink — IDs not yet observed
      };

      // --- Option IDs: Status (Select column) ---
      // Default new cards to "Needs CAM" status
      const STATUS_NEEDS_CAM = 'Opt0GUMMV0G';

      const p = payload;

      // Helper: build a rich_text field value
      const richText = (text) => ([{
        type: 'rich_text',
        elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text }] }]
      }]);

      // Helper: build a rich_text link field value
      const richLink = (url, text) => ([{
        type: 'rich_text',
        elements: [{ type: 'rich_text_section', elements: [{ type: 'link', url, text }] }]
      }]);

      const fields = [];

      // Name (required)
      fields.push({ column_id: COL_NAME, rich_text: richText(p.name || 'Unnamed Part') });

      // Project
      const projectId = PROJECT_OPTS[p.project];
      if (projectId) fields.push({ column_id: COL_PROJECT, select: [projectId] });

      // Machine Type
      const machineId = MACHINE_OPTS[p.machine];
      if (machineId) fields.push({ column_id: COL_MACHINE, select: [machineId] });

      // Part Type
      const partTypeId = PART_TYPE_OPTS[p.partType];
      if (partTypeId) fields.push({ column_id: COL_PART_TYPE, select: [partTypeId] });

      // Quantity
      if (p.qty) fields.push({ column_id: COL_QTY, number: [parseInt(p.qty, 10)] });

      // CAD Link
      if (p.cadLink) fields.push({ column_id: COL_CAD_LINK, rich_text: richLink(p.cadLink, p.name || p.cadLink) });

      // Material & Thickness
      const materialId = MATERIAL_OPTS[p.material];
      if (materialId) fields.push({ column_id: COL_MATERIAL, select: [materialId] });

      // Finish
      const finishId = FINISH_OPTS[p.finish] || FINISH_OPTS['None'];
      fields.push({ column_id: COL_FINISH, select: [finishId] });

      // Status — default to Needs CAM for new submissions
      fields.push({ column_id: COL_STATUS, select: [STATUS_NEEDS_CAM] });

      // Notes
      if (p.notes) fields.push({ column_id: COL_NOTES, rich_text: richText(p.notes) });

      // Attachment (STEP file ID from completeUpload)
      if (p.fileId) fields.push({ column_id: COL_ATTACHMENT, attachment: [p.fileId] });

      const resp = await fetch('https://slack.com/api/slackLists.items.create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + slackToken },
        body: JSON.stringify({ list_id: LIST_ID, initial_fields: fields })
      });
      const data = await resp.json();
      if (!data.ok) {
        console.error("[addListItem] Slack error:", JSON.stringify(data));
        throw new Error("Slack Lists error: " + (data.error || JSON.stringify(data)));
      }
      return res.json({ ok: true, item_id: data.item?.id });

    } else if (action === 'getListSchema') {
      // Temporary helper — fetches existing items to discover column_id + select option IDs.
      // Remove this action once column mapping is wired up.
      const listId = process.env.SLACK_LIST_ID || 'F09T4DXL3L5';
      const resp = await fetch('https://slack.com/api/slackLists.items.list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + slackToken },
        body: JSON.stringify({ list_id: listId, limit: payload?.limit || 50 })
      });
      const data = await resp.json();
      return res.json(data);

    } else {
      return res.status(400).json({ error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
