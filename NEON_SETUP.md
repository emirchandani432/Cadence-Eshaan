# Connecting the tracker + email relay through Neon (live)

This replaces the earlier Supabase plan. The website now reads/writes a shared
tracker in your Neon database through two small API routes, and Power Automate
reads the same data.

## What was added to the project
- `api/tracker.js` — serverless route: GET returns the whole tracker doc, POST saves it.
- `api/projects.js` — serverless route: returns a clean project list + team_emails (for Power Automate).
- `src/trackerApi.js` — frontend helper that calls those routes.
- `src/App.jsx` — the Tracker now loads from the API on open, saves edits back
  (debounced), and polls every 7s for others' changes. If the API isn't reachable
  (e.g. local `npm run dev`), it falls back to browser storage.
- `package.json` — added `@neondatabase/serverless`.

## Deploy it
1. **Rotate your Neon password** first — the old one was shared in chat. In Neon:
   Roles → reset password. Vercel's integration updates `DATABASE_URL` automatically.
2. Confirm `DATABASE_URL` exists in Vercel: Project → Settings → Environment Variables.
3. Push:
   ```
   git add .
   git commit -m "Live tracker via Neon API + website wiring"
   git push
   ```
   Vercel installs the Neon driver and deploys the `/api` functions automatically.
4. The `tracker_doc` table is **created automatically** on the first API call, and
   the first time the site loads it seeds the table with the current tracker.
5. Verify: open `https://YOUR-SITE.vercel.app/api/projects` in a browser — you should
   see a JSON list of projects, each with `team_emails`.

## Point Power Automate at it
Replace the old SharePoint "Get items" step; everything else stays.

1. **Trigger** — When a new email arrives in a shared mailbox (V2).
2. **HTTP** — GET `https://YOUR-SITE.vercel.app/api/projects` (no auth needed for now).
3. **Parse JSON** on the body. Sample to generate schema:
   `[{"id":1,"name":"X","vantagepoint":"Y","client":"Z","stage":"S","team_emails":"a@x.com,b@x.com"}]`
4. **Select** — From = Parse JSON output; Map (single text):
   `concat(item()?['id'], ': ', item()?['name'], ' (', item()?['vantagepoint'], ')')`
5. **Compose** — `join(body('Select'), decodeUriComponent('%0A'))`
6. **Run a prompt** (Match Project Email): ProjectList = Compose; EmailSubject =
   trigger Subject; EmailSnippet = trigger Body Preview.
7. **Parse JSON** on the prompt → `{ "id": <number/string>, "confidence": <number> }`
8. **Condition** — confidence >= 70 AND id is not empty.
   - **If yes:**
     - **Filter array** — From = the step-3 Parse JSON output; keep where
       `item()?['id']` is equal to the matched `id`.
     - **Send an email (V2)** — To = `first(body('Filter_array'))?['team_emails']`
       (the comma list works as the To field). Subject/Body = trigger. Reply To =
       trigger From; carry attachments.
   - **If no:** email yourself a "couldn't match" notice with the subject + sender.

Now every edit in the website lands in Neon within ~1 second, and the next email
the flow processes matches against the current data and relays to the right team.

## Important notes
- **Security (beta):** `/api/tracker` and `/api/projects` are currently OPEN — anyone
  with the URL can read or write the tracker. Fine for a private beta; add sign-in
  (auth) before wider rollout. Ask Claude when ready.
- **"Real-time"** here means the site refetches every ~7 seconds (Neon has no live
  push). Good enough for a small team; true push is a later upgrade.
- The earlier `cadence-supabase/` files are superseded — you can ignore/delete them.
