# Setup Guide

This guide walks through deploying Manufacturing Pipeline for your FRC team from scratch. It takes about 30–45 minutes.

## Prerequisites

- A GitHub account
- A [Vercel](https://vercel.com) account (free tier is fine)
- A [Google Cloud](https://console.cloud.google.com) account
- An OnShape account with API access

---

## Step 1 — Fork and Deploy to Vercel

1. Fork this repository to your GitHub account or organization.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your fork.
3. Leave all build settings as defaults and click **Deploy**.

Your app will be live at `https://YOUR_APP.vercel.app`. Note this URL — you'll need it in several later steps.

---

## Step 2 — Add Neon Database

1. In the Vercel dashboard, go to your project → **Storage** → **Create Database** → **Neon**.
2. Follow the prompts to create a Postgres database. Vercel will automatically add `DATABASE_URL` as an environment variable.
3. Once created, open the Neon dashboard → your project → **SQL Editor**.
4. Paste the contents of [`schema.sql`](schema.sql) and click **Run**. This creates the `cards` table.

---

## Step 3 — Add Vercel Blob Storage

1. In the Vercel dashboard → **Storage** → **Create Database** → **Blob**.
2. Follow the prompts. Vercel will automatically add `BLOB_READ_WRITE_TOKEN` as an environment variable.

---

## Step 4 — OnShape API Keys

1. Log in to [cad.onshape.com](https://cad.onshape.com).
2. Go to **My Account** (top-right avatar) → **API Keys** → **Create New API Key**.
3. Copy the **Access Key** and **Secret Key**.
4. In the Vercel dashboard → your project → **Settings** → **Environment Variables**, add:
   - `ONSHAPE_ACCESS_KEY` → your access key
   - `ONSHAPE_SECRET_KEY` → your secret key
5. Mark both as **Sensitive**.

---

## Step 5 — Google OAuth Setup

The manufacturing board requires Google Sign-In restricted to your team's domain.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a new project (e.g. "Manufacturing Pipeline").
2. Navigate to **APIs & Services** → **OAuth consent screen**.
   - User type: **Internal** (if your team uses Google Workspace) or **External**.
   - Fill in app name, support email, and developer contact. No scopes needed.
3. Navigate to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**.
   - Application type: **Web application**
   - Authorized JavaScript origins: `https://YOUR_APP.vercel.app`
   - No redirect URIs needed.
4. Copy the **Client ID** (looks like `123456789-abc....apps.googleusercontent.com`).
5. In Vercel → **Environment Variables**, add:
   - `GOOGLE_ALLOWED_DOMAIN` → your team's Google Workspace domain (e.g. `frc1234.org`). If your team doesn't have a custom domain, use `gmail.com`.
   - `GOOGLE_CLIENT_ID` → the client ID you just copied.

> **Note:** `GOOGLE_ALLOWED_DOMAIN` restricts which accounts can sign in. Only Google accounts ending in `@yourteam.org` will be accepted. This is enforced server-side.

---

## Step 6 — Edit config.js

Open `config.js` in your fork and fill in your team's values. The fields that **must** be updated:

```js
teamNumber: '1234',               // your team number
teamName:   'My FRC Team',        // your team name

googleAllowedDomain: 'yourteam.org',   // matches GOOGLE_ALLOWED_DOMAIN above
googleClientId: '123456789-abc....apps.googleusercontent.com',  // from Step 5

boardUrl: 'https://YOUR_APP.vercel.app/board',  // your Vercel URL

assignees: [                       // everyone who might be assigned parts
  'Student Name',
  'Mentor Name',
],
```

The rest of the file — projects, machines, materials, statuses, etc. — can be customized to match your team's workflow. Commit and push; Vercel will redeploy automatically.

---

## Step 7 — Register the OnShape Right-Panel Extension

1. Go to [dev-portal.onshape.com](https://dev-portal.onshape.com) → **OAuth Applications** or **Extensions** → **Create new extension**.
2. Fill in:
   - **Name:** Manufacturing Pipeline (or whatever you like)
   - **Type:** Right panel
   - **Action URL:**
     ```
     https://YOUR_APP.vercel.app/onshape-panel?documentId={$documentId}&workspaceId={$workspaceId}&elementId={$elementId}&selectedPartIds={$selectedPartIds}
     ```
3. Save. The panel will appear inside OnShape on Part Studios.

> OnShape may require a short review period before the extension is active.

---

## Step 8 — Redeploy and Test

1. In Vercel → **Deployments** → trigger a new deployment (or just push a commit) so all environment variables take effect.
2. Open `https://YOUR_APP.vercel.app/board` — you should see the Google Sign-In screen.
3. Sign in with your team domain account.
4. Open OnShape, navigate to a Part Studio, and the panel should load in the right sidebar.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon connection string (auto-added by Vercel integration) |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob token (auto-added by Vercel integration) |
| `ONSHAPE_ACCESS_KEY` | Yes | OnShape API access key |
| `ONSHAPE_SECRET_KEY` | Yes | OnShape API secret key |
| `GOOGLE_ALLOWED_DOMAIN` | Yes | Google Workspace domain for board sign-in |
| `GOOGLE_CLIENT_ID` | Recommended | Google OAuth client ID (tightens token verification) |

> Mark `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `ONSHAPE_ACCESS_KEY`, and `ONSHAPE_SECRET_KEY` as **Sensitive** in Vercel to hide their values from anyone with dashboard access.

---

## Troubleshooting

**Board shows "Authentication required" after signing in**
- Make sure `GOOGLE_ALLOWED_DOMAIN` matches the domain of the account you're signing in with.
- If you just added env vars, trigger a fresh Vercel deployment.

**OnShape panel shows a blank page or CORS error**
- Check that `ONSHAPE_ACCESS_KEY` and `ONSHAPE_SECRET_KEY` are set correctly in Vercel.

**Cards aren't saving**
- Confirm you ran `schema.sql` in the Neon SQL editor and the `cards` table exists.

**Google Sign-In button doesn't appear**
- Make sure your Vercel deployment URL is listed under Authorized JavaScript Origins in your Google Cloud OAuth client.
