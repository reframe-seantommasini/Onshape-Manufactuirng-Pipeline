// ─────────────────────────────────────────────────────────────────────────────
// Manufacturing Pipeline — Team Configuration
//
// Edit this file to customize the app for your FRC team. All values here are
// loaded by both the OnShape panel and the manufacturing board.
//
// Setup checklist:
//   1. Fork the repo and deploy to Vercel
//   2. In Vercel dashboard → Storage: add Neon (database) + Blob (file storage)
//   3. Add OnShape API keys as Vercel env vars (ONSHAPE_ACCESS_KEY, ONSHAPE_SECRET_KEY)
//   4. Create a Google Cloud project, enable Google Identity, add OAuth credentials
//      → https://console.cloud.google.com → APIs & Services → Credentials
//   5. Fill in this file and redeploy
//   6. Register your right-panel extension at https://dev-portal.onshape.com
//      Action URL: https://YOUR_VERCEL_URL.vercel.app/onshape-panel?documentId={$documentId}&workspaceId={$workspaceId}&elementId={$elementId}&selectedPartIds={$selectedPartIds}
// ─────────────────────────────────────────────────────────────────────────────

const TEAM_CONFIG = {

  // ── Team Identity ───────────────────────────────────────────────────────────
  teamNumber: '6328',
  teamName:   'Mechanical Advantage',

  // ── Theme ───────────────────────────────────────────────────────────────────
  // Accent color used for active pills, primary buttons, and highlights.
  // Any valid CSS color works: '#3b82f6', 'hsl(217,91%,60%)', etc.
  accentColor: '#446ce3',

  // ── Google Auth ─────────────────────────────────────────────────────────────
  // Only accounts from this domain can sign in to the board.
  // Use your team's Google Workspace domain (e.g. 'frc1234.org').
  // If your team doesn't have a custom domain, use 'gmail.com' to allow any Google account.
  googleAllowedDomain: 'littletonrobotics.org',

  // Client ID from Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client
  // Set Authorized JavaScript Origins to your Vercel URL (e.g. https://yourapp.vercel.app)
  googleClientId: '266562169349-u5skq8phqr2v51e8jj4k1ji1g4odu5hj.apps.googleusercontent.com',

  // ── URLs ────────────────────────────────────────────────────────────────────
  // Full URL to your deployed board — used in the OnShape panel "Board ↗" link.
  boardUrl: 'https://slack-list-onshape-integration.vercel.app/board',

  // ── Projects ────────────────────────────────────────────────────────────────
  // Shown as pills in the panel and as filter options in the board.
  projects: ['Dev Bot', 'Prototype', 'Comp Bot', 'Spare', 'Off-Season', 'Other'],

  // ── Machines ────────────────────────────────────────────────────────────────
  // Manufacturing machines available to your team.
  machines: ['CNC Router', 'CNC Mill', 'Lathe', '3D Printer', 'Laser Cutter', 'Chop Saw', 'Mill', 'Other'],

  // ── Materials ───────────────────────────────────────────────────────────────
  materials: ['Aluminum', 'Polycarb', 'PLA+', 'Steel (Mild)', 'Carbon Fiber', 'SRPP', 'Other'],

  // ── Stock Thicknesses ───────────────────────────────────────────────────────
  thicknesses: ['1/16 in', '1/8 in', '3/16 in', '1/4 in', '3/8 in', '1/2 in', '0.09 in', 'Other'],

  // ── Part Types ──────────────────────────────────────────────────────────────
  partTypes: ['Plate', 'Sheet Metal', 'Hex Shaft', 'Round Shaft', 'Billet', 'Tube 1×1in', 'Tube 1×2in', 'Tube 2×2in', 'Other'],

  // ── Finishes ────────────────────────────────────────────────────────────────
  // List all finish options. Names here must match powderCoatColors keys below
  // for color auto-detection to work.
  finishes: ['None', 'Black', 'Blue', 'Yellow', 'Pink', 'Other'],

  // ── Workflow Statuses ───────────────────────────────────────────────────────
  // Each status becomes a kanban column. Color is the column dot and card accent.
  // The board renders columns in this order.
  statuses: [
    { id: 'Needs Drawing',          color: '#a78bfa' },
    { id: 'Needs CAM',              color: '#60a5fa' },
    { id: 'Needs Slicing',          color: '#34d399' },
    { id: 'In Progress',            color: '#fbbf24' },
    { id: 'Ready for Saw',          color: '#f97316' },
    { id: 'Ready for Lathe',        color: '#e879f9' },
    { id: 'Ready for Mill',         color: '#818cf8' },
    { id: 'Ready for CNC Mill',     color: '#22d3ee' },
    { id: 'Ready for CNC Router',   color: '#4ade80' },
    { id: 'Ready for 3D Printer',   color: '#fb923c' },
    { id: 'Ready for Laser Cutter', color: '#f43f5e' },
    { id: 'Needs Powder Coat',      color: '#c084fc' },
    { id: 'Done',                   color: '#86efac' },
  ],

  // ── Statuses that trigger STEP export ───────────────────────────────────────
  // When a card is submitted with one of these statuses, a STEP file is
  // automatically exported from OnShape and attached to the card.
  stepStatuses: ['Needs CAM', 'Needs Slicing'],

  // ── Statuses that require a PDF drawing ─────────────────────────────────────
  // Submitting with one of these statuses prompts the student to attach a PDF.
  pdfStatuses: ['Ready for Lathe', 'Ready for Mill', 'Ready for CNC Mill'],

  // ── Powder Coat Color Detection ─────────────────────────────────────────────
  // Maps finish label → the exact hex color used in OnShape.
  // When a part's appearance color closely matches one of these, the finish
  // field is auto-populated. Leave empty ({}) to disable auto-detection.
  powderCoatColors: {
    'Blue':   '#003DB9',
    'Black':  '#404040',
    'Yellow': '#FACB43',
    'Pink':   '#FF6ECD',
  },

  // ── Material Auto-Detection ─────────────────────────────────────────────────
  // Maps OnShape material displayName substrings (case-insensitive) to material labels.
  // First match wins — put more specific strings before general ones.
  materialMap: [
    { match: '6061-t6',            label: 'Aluminum'     },
    { match: 'aluminum',           label: 'Aluminum'     },
    { match: 'polycarbonate',      label: 'Polycarb'     },
    { match: 'polycarb',           label: 'Polycarb'     },
    { match: 'carbon fiber epoxy', label: 'Carbon Fiber' },
    { match: 'carbon fiber',       label: 'Carbon Fiber' },
    { match: 'carbon',             label: 'Carbon Fiber' },
    { match: 'pla+',               label: 'PLA+'         },
    { match: 'pla',                label: 'PLA+'         },
    { match: 'steel',              label: 'Steel (Mild)' },
    { match: 'srpp',               label: 'SRPP'         },
    { match: 'polypropylene',      label: 'SRPP'         },
  ],

  // Density-based fallback for custom materials where the displayName won't match above.
  // OnShape stores density in kg/m³. (PLA+ custom: team uses 19 kg/m³.)
  materialDensityMap: [
    { label: 'PLA+', densityKgM3: 19, toleranceKgM3: 0.5 },
  ],

  // ── Plate Thickness Detection ───────────────────────────────────────────────
  // Known flat-stock thicknesses in inches. The smallest bounding-box dimension
  // is compared against these values within PLATE_TOLERANCE_IN (±0.005").
  plateThicknesses: [
    { label: '1/16 in', value: 0.0625  },
    { label: '0.09 in', value: 0.09    },
    { label: '1/8 in',  value: 0.125   },
    { label: '3/16 in', value: 0.1875  },
    { label: '1/4 in',  value: 0.25    },
  ],

  // ── Tube Cross-Section Detection ────────────────────────────────────────────
  // d1 × d2 outer dimensions in inches (d1 ≤ d2).
  tubeCrossSections: [
    { label: 'Tube 1×1in', d1: 1.0, d2: 1.0 },
    { label: 'Tube 1×2in', d1: 1.0, d2: 2.0 },
    { label: 'Tube 2×2in', d1: 2.0, d2: 2.0 },
  ],
  // Known wall thicknesses to snap to after solving from end-cap area.
  tubeWallThicknesses: [
    { label: '1/16 in', value: 0.0625 },
    { label: '0.09 in', value: 0.09   },
    { label: '1/8 in',  value: 0.125  },
  ],

  // ── Hex Shaft Detection ─────────────────────────────────────────────────────
  // F2F = flat-to-flat distance; c2c_sharp/rounded = corner-to-corner for sharp vs filleted hex.
  hexShaftProfiles: [
    { diameter: '1/2 in', f2f: 0.500, c2c_sharp: 0.577, c2c_rounded: 0.541 },
    { diameter: '3/8 in', f2f: 0.375, c2c_sharp: 0.433, c2c_rounded: 0.404 },
  ],

  // ── Round Shaft Detection ───────────────────────────────────────────────────
  roundShaftDiameters: [
    { diameter: '1/2 in', value: 0.500 },
    { diameter: '3/8 in', value: 0.375 },
  ],

  // ── Materials That Never Get Powder Coated ──────────────────────────────────
  // Finish auto-detection is skipped for these materials.
  noFinishMaterials: ['PLA+', 'Polycarb', 'SRPP', 'Carbon Fiber'],

};
