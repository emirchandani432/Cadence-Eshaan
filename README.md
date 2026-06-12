# Cadence — Team Planner

A simple shared planner: a board, a calendar, team roles, and quick Outlook email
(including emailing a whole project team from your own account).

This is the **prototype** build. It runs fully on your machine and can deploy to
Vercel so you can show it to people. Two pieces are still "demo" until the
Microsoft side is set up (see "What's real vs. demo" below).



## What's real vs. demo

**Real and working now:**
- The board, calendar, team/roles, projects, due dates, status, search, filters
- Export to CSV and JSON, and restore from a JSON backup
- Data saved in your browser (localStorage) so it persists between visits

**Demo until the Microsoft step is done:**
- **Login** — right now "Sign in with Microsoft" asks you to type your email/name.
  The live version replaces this screen with the real Microsoft login, which needs
  a one-time app registration in your company's Microsoft 365 (an admin does this).
- **Sending email** — the email buttons currently *open* an Outlook compose window
  with everyone filled in. Once the app is registered, this becomes a true
  one-click silent send through Microsoft Graph, from the signed-in person's mailbox.
- **Shared data** — localStorage is per-browser. For everyone to see the same board,
  this gets swapped for a small shared database (free options exist) when you go live.

---

## Files

- `src/App.jsx` — the whole app (one file)
- `src/main.jsx` — starts the app
- `index.html` — the page it loads into
- `package.json` / `vite.config.js` — project setup
