# Cadence — Team Planner

A simple shared planner: a board, a calendar, team roles, and quick Outlook email
(including emailing a whole project team from your own account).

This is the **prototype** build. It runs fully on your machine and can deploy to
Vercel so you can show it to people. Two pieces are still "demo" until the
Microsoft side is set up (see "What's real vs. demo" below).

---

## Run it on your computer

You need **Node.js** installed first (https://nodejs.org — pick the "LTS" version).
To check if you already have it, open a terminal and type: `node -v`

Then, in this folder:

```bash
npm install      # downloads the pieces it needs (one time)
npm run dev      # starts it locally
```

The terminal will print a link like `http://localhost:5173` — open that in your
browser and you'll see the app.

To stop it, press `Ctrl + C` in the terminal.

> In Visual Studio you can open this folder and use the built-in terminal
> (View → Terminal) to run the two commands above. A React web app like this is
> driven from the terminal, not the green "run" button.

---

## Put it on Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, click **Add New → Project**, pick that repository.
3. Vercel auto-detects Vite. Leave the defaults and click **Deploy**.

That's it — Vercel gives you a live link. (Reminder: the free Hobby plan is for
personal/testing use; move it to the company's Pro plan for real rollout.)

---

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


## Link: https://cadence-eshaan.vercel.app/
