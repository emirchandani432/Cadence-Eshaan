# Cadence — Project Guide for Claude

## What this project is
Cadence is a dark-themed React team dashboard for RTM Engineering Consultants (rtmec.com).
It is a single-page app built with React + Vite, deployed on Vercel, with a Neon PostgreSQL database for shared tracker data.

**GitHub repo:** https://github.com/emirchandani432/Cadence-Eshaan
**Local folder:** `/Users/eshaan/Developer/Cadence-Eshaan`

---

## Tech stack
- **React 18** + **Vite** (no TypeScript)
- **lucide-react** for icons
- **@neondatabase/serverless** for the Postgres backend
- **No CSS files** — all styles are inline JS objects or a large CSS string inside `App.jsx`
- **No routing library** — views are toggled with a `view` state string

---

## File structure
```
src/
  App.jsx          — entire frontend (3000+ lines), all views in one file
  MailView.jsx     — Outlook Mail tab (Microsoft Graph API)
  main.jsx         — React entry point
  seedData.js      — default project/gantt seed data
  trackerData.js   — SEED_TRACKER rows + EMAIL_DIR (team name→email map)
  trackerApi.js    — fetch helpers for /api/tracker (apiLoad, apiSave)
api/
  tracker.js       — Vercel serverless: GET/POST tracker doc to Neon DB
  projects.js      — Vercel serverless: returns project list + team emails
public/
  outlook-callback.html  — OAuth popup callback for Outlook sign-in
```

---

## How to push changes to GitHub
After editing any file, run in terminal from the project folder:
```bash
git add .
git commit -m "describe the change"
git push
```
Vercel auto-deploys on every push (takes ~1 minute).

---

## Key architectural patterns

### CSS variables & theming
The app has **3 themes**: dark (default), twilight, light.
- Dark CSS vars are defined on `.cad` class in the big `css` string at the top of `App.jsx`
- Light overrides are on `.cad.light`
- Twilight overrides are on `.cad.twilight`
- `rootCls` is set to `"cad"`, `"cad light"`, or `"cad twilight"` based on `theme` state
- Theme cycles: dark → twilight → light → dark
- **IMPORTANT:** Any UI rendered via `createPortal()` (dropdowns, autocomplete) is outside the `.cad` div, so CSS variables don't work there. Use hardcoded hex colors based on the `theme` state:
  - dark: bg `#172E4B`, border `#26456B`, text `#E9EFF7`
  - twilight: bg `#2E2B50`, border `#423E6E`, text `#E4DEFF`
  - light: bg `#fff`, border `#c0cad8`, text `#1b2330`

### Navigation
`NAV` array drives the tab bar. Views are rendered with `{view === "x" && <XView ctx={ctx} />}`.
Current views: `home`, `tracker`, `gantt`, `alerts`, `calendar`, `team`, `mail`.

### ctx object
Almost all state lives in the main `App` component and is passed down as a `ctx` object. When adding new state that child views need, add it to the `ctx` object near line 456.

### Tracker (spreadsheet)
- **Multi-sheet:** Each sheet has its own localStorage key via `sheetKey(id)`. The main sheet uses `TRACKER_KEY = "cadence:tracker:v2"`. Others use `cadence:tracker:sheet:<id>`.
- **Sheets list** stored in `cadence:tracker:sheets:v1`.
- **Shared DB sync:** The main sheet syncs to Neon via `apiLoad()`/`apiSave()` every 7 seconds. Other sheets are localStorage only.
- **Columns:** Defined in `TRACKER_COLS`. Hidden columns stored in `cadence:tracker:hidden`.
- **Role columns** (PM, ML, ME, PE, EE, FP): use `RoleCell` component with name autocomplete from `EMAIL_DIR`.
- **Autocomplete dropdown** uses `createPortal` to escape table overflow. Uses `pickingRef` to prevent blur from closing dropdown before click registers.
- **People filter dropdown** is a custom searchable dropdown (not a `<select>`), also uses `createPortal`.

### Team directory
`EMAIL_DIR` in `src/trackerData.js` maps lowercase full names to `@rtmec.com` emails.
`ALL_NAMES` (derived from EMAIL_DIR) drives the role cell autocomplete.
Current team: Aaron Burch, Andrew Gustafson, Byshop Williams, Claire Palmer, Dan King, David Piluski, Gabriel Ferguson, Habiba Watfa, Hope Huenecke, James Barnickel, Jessica Sembdner, Jimmy Yakubov, John Wolfe, Madison Huschak, Matthew DeLeo, Sophia Crew, Alex Babusci.

### Outlook Mail (MailView.jsx)
- Uses Microsoft Graph API with implicit OAuth flow (popup window)
- Requires `VITE_AZURE_CLIENT_ID` in a `.env` file
- Token stored in `sessionStorage` as `cad_outlook_auth`
- Reads Inbox, Sent, Drafts via `/me/mailFolders/<folder>/messages`

### Backend / database
- Neon PostgreSQL, connection string in `DATABASE_URL` environment variable (set in Vercel)
- Single table: `tracker_doc(id int, doc jsonb, v bigint)`
- Only the main "All Projects" sheet syncs to the DB — other sheets are browser-local only

---

## Common tasks

### Add a new nav tab
1. Import icon from lucide-react
2. Add `{ id: "myview", label: "Label", Icon: MyIcon }` to `NAV` array (~line 300)
3. Add `{view === "myview" && <MyView ctx={ctx} />}` in the main render (~line 520)
4. Create the `function MyView({ ctx }) { ... }` component

### Add a new tracker column
Add to `TRACKER_COLS` array (~line 2435):
```js
{ key: "mykey", label: "My Column", w: 150 }
```

### Add a person to the team directory
In `src/trackerData.js`, add to `EMAIL_DIR`:
```js
"first last": "first.last@rtmec.com",
```

### Edit tracker sheet tabs
Sheet tabs UI starts at the `{/* Sheet tabs */}` comment in `TrackerView`.
Default sheets are in `DEFAULT_SHEETS` constant near the `TRACKER_KEY` definition.

---

## Environment variables needed
| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | Vercel project settings | Neon PostgreSQL connection string |
| `VITE_AZURE_CLIENT_ID` | `.env` file in project root | Outlook OAuth app ID |

---

## Important style rules
- All colors use CSS variables (`var(--ink)`, `var(--panel)`, etc.) EXCEPT inside portals
- Portal dropdowns need hardcoded hex colors — check theme state and pick correct set
- The tracker table uses a light-colored cell style; these must also respect theme using CSS vars
- Don't use TypeScript, don't add external libraries without asking
- Keep everything in `App.jsx` unless it's a large standalone view (like `MailView.jsx`)
