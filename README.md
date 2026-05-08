# Manufacturing Pipeline

An OnShape right-panel extension for FRC teams that lets students select parts directly in a Part Studio and submit them to a manufacturing queue. Parts are tracked through production on a kanban board with statuses, assignments, STEP file export, and thumbnails.

Built by [FRC 6328 Mechanical Advantage](https://www.littletonrobotics.org) and released as open-source for any FRC team to self-host.

## Features

- **Select parts in OnShape** — click any part in a Part Studio to populate fields automatically
- **Auto-detection** — material, thickness, part type, and powder coat color are read from part geometry and appearance
- **STEP export** — automatically exports and attaches a STEP file when a card enters CAM/slicing statuses
- **Kanban board** — track parts through fully configurable workflow statuses with drag-and-drop
- **List view** — sortable table view with filters for project, machine, material, assignee
- **Google auth** — board sign-in restricted to your team's Google Workspace domain
- **Fully configurable** — one file (`config.js`) controls every team-specific setting

## Quick Start

See **[SETUP.md](SETUP.md)** for the complete deployment guide.

The short version:
1. Fork this repo
2. Deploy to Vercel, add Neon (database) and Blob (file storage) integrations
3. Run `schema.sql` in the Neon SQL editor
4. Create a Google OAuth client and add OnShape API keys as Vercel env vars
5. Edit `config.js` with your team's values and redeploy
6. Register the right-panel extension at [dev-portal.onshape.com](https://dev-portal.onshape.com)

## Configuration

All team-specific settings live in [`config.js`](config.js):

| Setting | Description |
|---|---|
| `teamNumber` / `teamName` | Shown in the panel header |
| `googleAllowedDomain` | Restricts board sign-in to your Google Workspace domain |
| `googleClientId` | Google OAuth 2.0 client ID |
| `boardUrl` | Link from the panel to your deployed board |
| `assignees` | Dropdown options for "Assigned To" |
| `projects` / `machines` / `materials` / `thicknesses` / `partTypes` / `finishes` | All dropdown and pill options |
| `statuses` | Kanban columns with custom colors |
| `stepStatuses` | Statuses that trigger automatic STEP export |
| `powderCoatColors` | Hex colors for finish auto-detection |
| `materialMap` | Maps OnShape material names to your material labels |

## Stack

- **Hosting:** Vercel (serverless functions + static)
- **Database:** Neon (serverless Postgres)
- **File storage:** Vercel Blob
- **OnShape auth:** API key pair (server-side proxy)
- **Board auth:** Google Sign-In (restricted to team domain)

## License

MIT
