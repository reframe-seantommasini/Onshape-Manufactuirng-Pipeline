# FRC 6328 Manufacturing Pipeline — Claude Code Context

## Project Overview
A manufacturing pipeline for FRC Team 6328 (Littleton Robotics). Students select parts in OnShape CAD, submit manufacturing cards via a right-panel extension, and track those parts through production stages on a custom kanban board.

**Long-term goal: Release as an official public OnShape App Store app for all FRC teams.**
This will require OAuth2 migration (currently using API key auth), a SETUP.md, and cleanup for public release.

**Live:** slack-list-onshape-integration.vercel.app  
**Repo:** github.com/reframe-seantommasini/Slack-List-Onshape-Integration (private for now)  
**Team domain:** @littletonrobotics.org

---

## Stack

```
onshape-panel/
  index.html          — OnShape right-panel extension (v1.83)
board/
  index.html          — Kanban board frontend (v2.15)
api/
  onshape.js          — Vercel serverless proxy for OnShape REST API
  board.js            — Vercel serverless proxy for Neon DB + Vercel Blob
  slack.js            — Vercel serverless proxy for Slack API (mostly unused now)
package.json          — deps: @neondatabase/serverless, @vercel/blob
vercel.json           — function config + root redirect to /onshape-panel
```

**Hosting:** Vercel (auto-deploy from GitHub)  
**Database:** Neon (serverless Postgres), `DATABASE_URL` env var  
**File storage:** Vercel Blob (public store), `BLOB_READ_WRITE_TOKEN` env var  
**OnShape auth:** API key (`ONSHAPE_ACCESS_KEY` / `ONSHAPE_SECRET_KEY`) — needs OAuth2 for App Store  
**Board auth:** Google Sign-In (frontend GSI), restricted to @littletonrobotics.org  

---

## Neon DB — `cards` Table Schema

| Column | Type | Notes |
|---|---|---|
| id | text PK | auto-generated |
| name | text | part name |
| status | text | kanban column |
| project | text | |
| machine | text | |
| material | text | |
| thickness | text | stored as "1/2 in" |
| part_type | text | "Tube 1×1in" etc. |
| quantity | integer | |
| finish | text | |
| assigned_to | text | |
| cad_link | text | |
| notes | text | |
| step_file_url | text | Vercel Blob public URL |
| step_file_name | text | `.step` or `.dxf` — determines button label |
| pdf_file_url | text | Vercel Blob public URL |
| pdf_file_name | text | |
| thumbnail_url | text | Vercel Blob public URL — PNG render of part |
| part_id | text | OnShape partId |
| submitted_by | text | email address |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated via trigger |
| is_critical | boolean | NOT NULL DEFAULT false |

---

## OnShape Panel (v1.83) — Key Features

- Lives in OnShape as a right-panel extension
- Students select a part in the Part Studio, panel auto-detects:
  - **Part type** (Plate, Tube 1×1/1×2/2×2, Hex Shaft, Round Shaft) via single FeatureScript call
  - **Sheet Metal** via `isFlattenedBody` from `/parts` API
  - **Material** from OnShape displayName + density fallback
  - **Thickness** from bounding box geometry
  - **Powder coat color** from part appearance
- Submission modal shows a **rendered part thumbnail** (fetched from OnShape `shadedviews`)
- On submit: card created in Neon → STEP exported → thumbnail uploaded to Blob → card updated
- **"Board ↗"** link in tab bar opens the kanban board in a new tab
- STEP export for "Needs CAM" / "Needs Slicing" statuses
- DXF export is **disabled** (`needsDxf = false`) — OnShape translation API doesn't support planar face DXF cleanly
- PDF upload for lathe/mill statuses
- Mark as Critical toggle
- Student name persisted in localStorage

### OnShape Action URL
```
https://slack-list-onshape-integration.vercel.app/onshape-panel?documentId={$documentId}&workspaceId={$workspaceId}&elementId={$elementId}&v=183
```
Bump `?v=` after every panel deploy for cache-busting.

### Key OnShape API endpoints used
- `GET /parts/d/{did}/{wvm}/{wvmid}/e/{eid}` — parts list, `isFlattenedBody`
- `GET /partstudios/.../bodydetails?includeVertices=true` — face→part map
- `POST /partstudios/.../featurescript` — single combined geometry call (bbox + end cap area)
- `GET /parts/d/{did}/{wvm}/{wvmid}/e/{eid}/partid/{pid}/shadedviews?outputHeight=220&outputWidth=440&pixelSize=0&viewMatrix=...` — part thumbnail (**must use `/parts/` path, not `/partstudios/`** — path-based partid guarantees single part render)
- `POST /partstudios/.../translations` — STEP export
- `GET /translations/{id}` — poll at 3s intervals
- `GET /documents/.../externaldata/{id}` — download STEP bytes

---

## Board (v2.15) — Key Features

- 13 kanban status columns with drag-and-drop
- List/table view grouped by status, collapsible
- Filters: Project, Machine, Material, Thickness, Assignee, Search
- New Card / Edit / Detail modals
- Detail modal shows part thumbnail (if present)
- STEP/DXF download buttons (label determined by file extension)
- Critical cards: red ribbon on kanban, red left border + "⚑ Critical" badge in list view, floated to top of column
- 30s background poll, only re-renders if data changed
- Google OAuth restricted to @littletonrobotics.org

---

## api/board.js Actions
- `GET` → getCards
- `createCard` — includes thumbnail_url
- `updateCard` — includes thumbnail_url; coerces quantity empty string → null
- `moveCard`
- `deleteCard` — deletes STEP + PDF + thumbnail blobs
- `uploadStep` → `step-files/{cardId}/`
- `uploadPdf` → `pdf-files/{cardId}/`
- `uploadThumbnail` → `thumbnails/{cardId}/`

---

## Critical Coding Patterns

- **Version bump every file, every time** — panel and board track separate versions
- **Full file output** — always deliver complete copy-pasteable files, not diffs
- **JS syntax check before output** — extract all `<script>` blocks via Python regex, concat, run `node --check /tmp/check.js`
- **Use Python for patch scripts**, not Node.js inline — Node interprets `${...}` template literals at parse time when embedded in strings
- **Sanity check after patching** — print list of `(label, bool)` tuples with ✓/✗

### Syntax check pattern
```python
import re, subprocess
html = open('index.html').read()
scripts = re.findall(r'<script(?:[^>]*)>(.*?)</script>', html, re.DOTALL)
open('/tmp/check.js', 'w').write('\n'.join(scripts))
r = subprocess.run(['node', '--check', '/tmp/check.js'], capture_output=True, text=True)
print('RC:', r.returncode, r.stderr or 'clean')
```

---

## Known Issues

- **DXF export disabled** — `needsDxf = false` hardcoded. Sheet metal flat pattern (`sheetMetalFlat: true`) implemented but unverified.
- **Sheet metal auto-detection unverified** — `isFlattenedBody` logic not yet confirmed on a real sheet metal part.
- **Existing cards have no thumbnail** — `thumbnail_url` null for cards submitted before thumbnail feature was added.
- **`includeVertices=true`** on bodydetails call — `bodyBounds` is populated but never read anywhere. Dead weight, could be removed.

---

## Feature Backlog

- Due dates + overdue red tint
- Card comments log
- Assigned-to-me filter
- Status change history / timestamps
- Bulk status move
- Material inventory tracker
- Weekly Slack digest
- QR code per card for shop floor
- DXF auto-export (blocked on OnShape API)
- OAuth2 migration (required for App Store / public release)
- SETUP.md for self-hosting / public release
- Batch STEP export (ZIP)
- 2D nesting + DXF export (Phase 2)
- Browser-based CAM (Phase 3)

---

## Gotchas & Learnings

- **Thumbnail endpoint** — `/parts/.../partid/{pid}/shadedviews` is correct. `/partstudios/` with `partId` or `partIds` query params renders the whole Part Studio.
- **Quantity coercion** — empty string `""` → Postgres integer error. Always: `u.quantity === '' ? null : parseInt(u.quantity, 10)`
- **Finish inconsistency** — panel stores `"Blue"`, manual entry stores `"Powder Coat — Blue"`. Board strips prefix before color matching.
- **Blob must be public** — `put()` with `access: 'public'`
- **Base64** — use 8KB chunk loop, never `btoa(String.fromCharCode(...largeArray))`
- **submitted_by** — panel sends as both `student` and `submittedBy`; board.js reads `c.submittedBy || c.student`
- **Local card patch** — always preserve `submitted_by`, `created_at`, `is_critical`, `thumbnail_url` when patching `allCards[]` after edit
- **OnShape postMessage** — `applicationInit` must fire after URL param parsing. `keepAlive` heartbeat every 25s. Target origin: `https://cad.onshape.com`
- **Polling interval** — 3000ms (not 1500ms) to reduce API consumption on OnShape EDU plan
