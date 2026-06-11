// Vercel serverless function: project list + team emails for Power Automate.
// Reads the same tracker doc the website writes, returns a clean array.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const RECOGNIZED = ["Aaron Burch", "Andrew Gustafson", "Byshop Williams", "Claire Palmer",
  "Dan King", "David Piluski", "Gabriel Ferguson", "Habiba Watfa", "Hope Huenecke",
  "James Barnickel", "Jessica Sembdner", "Jimmy Yakubov", "John Wolfe", "Madison Huschak",
  "Matthew DeLeo", "Sophia Crew", "Alex Babusci"];
const EMAIL_DIR = Object.fromEntries(RECOGNIZED.map(n => {
  const p = n.split(" ");
  return [n.toLowerCase(), `${p[0].toLowerCase()}.${p[p.length - 1].toLowerCase()}@rtmec.com`];
}));
function teamEmails(r) {
  const out = [];
  ["pm", "ml", "me", "pe", "ee", "fp"].forEach(k =>
    String(r[k] || "").split(/\n| and /).forEach(part => {
      const e = EMAIL_DIR[part.trim().toLowerCase()];
      if (e && !out.includes(e)) out.push(e);
    }));
  return out;
}

export default async function handler(req, res) {
  try {
    const rows = await sql`select doc from tracker_doc where id = 1`;
    const doc = rows.length ? rows[0].doc : { rows: [] };
    const projects = (doc.rows || []).map(r => ({
      id: r.rowNumber || r._id || "",
      name: r.projectName || "",
      vantagepoint: r.vantagepoint || "",
      client: r.client || "",
      stage: r.stage || "",
      team_emails: teamEmails(r).join(",")
    }));
    return res.status(200).json(projects);
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
}
