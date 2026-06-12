import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus, CalendarDays, Users, LayoutGrid, Mail, Check, Trash2, Pencil,
  Download, Upload, X, ChevronLeft, ChevronRight, Search, Sparkles,
  CheckCircle2, Circle, Clock, FolderOpen, AlertCircle, LogOut, Send, ShieldCheck,
  LayoutDashboard, GanttChartSquare, ChevronDown, ChevronUp, Settings, TrendingUp, Flame, Sun, Moon, Monitor, RefreshCw, Minus, RotateCcw, Bell, MessageSquare, Table
} from "lucide-react";
import MailView from "./MailView.jsx";
import { SEED_DATA, SEED_GANTT } from "./seedData.js";
import { SEED_TRACKER, EMAIL_DIR } from "./trackerData.js";
import { apiLoad, apiSave } from "./trackerApi.js";

/* ================================================================ *
 *  Cadence — dark team dashboard
 *  Home · Gantt · Board · Calendar · Team · Outlook email
 * ================================================================ */

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap');

.cad * { box-sizing:border-box; margin:0; padding:0; }
.cad {
  --bg:#0B1524; --panel:#11223A; --panel2:#172E4B; --raise:#1E3A5C;
  --line:#26456B; --line2:#345A85; --ink:#E9EFF7; --muted:#90A2BC; --dim:#5F7596;
  --primary:#E03A3E; --primary-d:#C42F33; --teal:#4FA8E8; --amber:#3E86C9; --slate:#6E83A2; --done:#33B36B;
  font-family:'Outfit',sans-serif; color:var(--ink); min-height:100vh; width:100%;
  background:
    radial-gradient(1100px 520px at 88% -8%, rgba(224,58,62,.12) 0%, transparent 55%),
    radial-gradient(900px 500px at -6% 108%, rgba(79,168,232,.10) 0%, transparent 52%),
    var(--bg);
}
.cad ::-webkit-scrollbar { width:10px; height:10px; }
.cad ::-webkit-scrollbar-thumb { background:var(--line2); border-radius:99px; border:2px solid transparent; background-clip:padding-box; }
.gantt-scroll.nobar { scrollbar-width:none; }
.gantt-scroll.nobar::-webkit-scrollbar { width:0; height:0; display:none; }

/* ---- top bar ---- */
.bar { position:sticky; top:0; z-index:30; display:flex; align-items:center; gap:14px;
  padding:12px 22px; background:rgba(14,19,27,.82); backdrop-filter:blur(12px); border-bottom:1px solid var(--line); }
.prof { position:relative; }
.prof-btn { display:flex; align-items:center; gap:10px; background:var(--panel); border:1px solid var(--line);
  border-radius:13px; padding:6px 10px 6px 7px; cursor:pointer; transition:.15s; }
.prof-btn:hover { border-color:var(--line2); background:var(--panel2); }
.av { border-radius:9px; display:grid; place-items:center; color:#fff; font-weight:700; flex-shrink:0; }
.prof-btn .av { width:32px; height:32px; font-size:12px; }
.prof-name { font-size:13.5px; font-weight:600; line-height:1.1; text-align:left; }
.prof-mail { font-size:11px; color:var(--muted); line-height:1.2; }
.menu { position:absolute; top:54px; left:0; width:248px; background:var(--panel2); border:1px solid var(--line2);
  border-radius:15px; padding:7px; box-shadow:0 22px 50px rgba(0,0,0,.5); animation:drop .16s ease; z-index:40; }
@keyframes drop { from{opacity:0; transform:translateY(-6px);} to{opacity:1; transform:none;} }
.menu-lbl { font-size:10.5px; font-weight:700; color:var(--dim); text-transform:uppercase; letter-spacing:.7px; padding:8px 11px 5px; }
.menu-i { display:flex; align-items:center; gap:11px; width:100%; border:none; background:transparent; color:var(--ink);
  font-family:'Outfit'; font-size:14px; font-weight:500; padding:9px 11px; border-radius:10px; cursor:pointer; text-align:left; }
.menu-i:hover { background:var(--raise); }
.menu-i.on { color:var(--primary); }
.menu-i svg { color:var(--muted); }
.menu-i.on svg { color:var(--primary); }
.menu-sep { height:1px; background:var(--line); margin:6px 4px; }

.tabs { display:flex; gap:3px; background:var(--panel); border:1px solid var(--line); border-radius:13px; padding:4px; }
.tab { display:flex; align-items:center; gap:7px; border:none; background:transparent; cursor:pointer;
  font-family:'Outfit'; font-size:13.5px; font-weight:600; color:var(--muted); padding:8px 13px; border-radius:9px; transition:.15s; white-space:nowrap; }
.tab:hover { color:var(--ink); }
.tab.on { background:var(--primary); color:#fff; box-shadow:0 3px 10px rgba(255,107,69,.3); }
.bar-sp { flex:1; }
.brand-min { display:flex; align-items:center; gap:9px; }
.brand-min .bm { width:30px; height:30px; border-radius:9px; background:var(--primary); display:grid; place-items:center; color:#fff; }
.brand-min b { font-family:'Fraunces'; font-size:18px; font-weight:600; letter-spacing:-.3px; }

/* ---- layout ---- */
.main { max-width:1120px; margin:0 auto; padding:26px 22px 90px; }
.head { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:14px; margin-bottom:22px; }
.h-title { font-family:'Fraunces'; font-size:30px; font-weight:600; letter-spacing:-.6px; line-height:1; }
.h-sub { color:var(--muted); font-size:14px; margin-top:7px; }

/* ---- buttons ---- */
.btn { display:inline-flex; align-items:center; gap:7px; cursor:pointer; font-family:'Outfit'; font-size:13.5px;
  font-weight:600; border-radius:11px; padding:9px 14px; border:1px solid var(--line); background:var(--panel); color:var(--ink); transition:.15s; }
.btn:hover { border-color:var(--line2); background:var(--panel2); transform:translateY(-1px); }
.btn-pri { background:var(--primary); color:#fff; border-color:var(--primary); box-shadow:0 4px 14px rgba(255,107,69,.28); }
.btn-pri:hover { background:var(--primary-d); border-color:var(--primary-d); }
.btn-sm { padding:6px 10px; font-size:12.5px; border-radius:9px; }
.btn-ghost { background:transparent; border-color:transparent; }
.btn-ghost:hover { background:var(--panel2); border-color:var(--line); }
.icon-btn { display:grid; place-items:center; width:32px; height:32px; padding:0; }

/* ---- panels / cards ---- */
.panel { background:var(--panel); border:1px solid var(--line); border-radius:18px; padding:18px; }
.panel-h { display:flex; align-items:center; gap:9px; font-weight:700; font-size:14px; margin-bottom:14px; }
.panel-h .pic { width:28px; height:28px; border-radius:9px; display:grid; place-items:center; flex-shrink:0; }
.panel-h .more { margin-left:auto; font-size:12.5px; color:var(--muted); font-weight:600; }
.grid-2 { display:grid; grid-template-columns:1.5fr 1fr; gap:16px; }
@media (max-width:820px){ .grid-2{ grid-template-columns:1fr; } }

/* stat cards */
.stats { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; margin-bottom:18px; }
@media (max-width:720px){ .stats{ grid-template-columns:repeat(2,1fr);} }
.stat { background:var(--panel); border:1px solid var(--line); border-radius:16px; padding:16px; position:relative; overflow:hidden; }
.stat .si { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; margin-bottom:12px; }
.stat .sv { font-family:'Fraunces'; font-size:30px; font-weight:600; line-height:1; }
.stat .sl { font-size:12px; color:var(--muted); margin-top:5px; font-weight:500; }

/* due list / generic rows */
.row-i { display:flex; align-items:center; gap:11px; padding:11px 12px; border-radius:12px; cursor:pointer; transition:.12s; }
.row-i:hover { background:var(--panel2); }
.row-dot { width:9px; height:9px; border-radius:99px; flex-shrink:0; }
.row-t { font-size:14px; font-weight:600; flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row-meta { font-size:12px; color:var(--muted); display:flex; align-items:center; gap:6px; }
.bar-mini { height:7px; border-radius:99px; background:var(--raise); overflow:hidden; }
.bar-mini > i { display:block; height:100%; border-radius:99px; background:linear-gradient(90deg,var(--done),#57d18c); transition:width .5s cubic-bezier(.2,.8,.2,1); }
.prog-row { margin-bottom:15px; }
.prog-row:last-child { margin-bottom:0; }
.prog-top { display:flex; align-items:center; gap:8px; margin-bottom:7px; font-size:13.5px; font-weight:600; }
.prog-top .pct { margin-left:auto; color:var(--muted); font-size:12px; }
.empty-sm { color:var(--muted); font-size:13px; text-align:center; padding:18px 0; }

/* chips */
.chip { display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:600; border-radius:99px; padding:3px 9px; }
.chip-person { color:#fff; }
.chip-proj { background:var(--raise); color:var(--ink); border:1px solid var(--line2); }
.chip-due { background:var(--raise); border:1px solid var(--line); color:var(--muted); }
.chip-due.over { background:rgba(240,83,42,.16); border-color:rgba(240,83,42,.4); color:#ff9472; }
.chip .av { width:18px; height:18px; font-size:9px; }

/* board */
.cols { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
@media (max-width:760px){ .cols{ grid-template-columns:1fr; } }
.col { background:var(--panel); border:1px solid var(--line); border-radius:18px; padding:12px; min-height:120px; }
.col-h { display:flex; align-items:center; gap:8px; padding:4px 6px 12px; font-weight:700; font-size:14px; }
.col-h .dot { width:10px; height:10px; border-radius:99px; }
.col-h .ct { margin-left:auto; color:var(--muted); font-size:12.5px; font-weight:600; background:var(--raise); border:1px solid var(--line); border-radius:99px; padding:1px 9px; }
.card { background:var(--panel2); border:1px solid var(--line); border-radius:14px; padding:13px; margin-bottom:11px; animation:rise .4s both; }
@keyframes rise { from{opacity:0; transform:translateY(8px);} to{opacity:1; transform:none;} }
.card.done { opacity:.55; }
.card.done .card-t { text-decoration:line-through; }
.card-top { display:flex; align-items:flex-start; gap:9px; }
.card-t { font-weight:600; font-size:15px; line-height:1.25; flex:1; }
.card-notes { font-size:13px; color:var(--muted); margin-top:5px; line-height:1.4; }
.card-meta { display:flex; align-items:center; gap:7px; flex-wrap:wrap; margin-top:11px; }
.pri { width:8px; height:8px; border-radius:99px; flex-shrink:0; margin-top:6px; }
.card-actions { display:flex; gap:4px; margin-top:10px; padding-top:10px; border-top:1px solid var(--line); }
.tick { cursor:pointer; background:none; border:none; color:var(--slate); display:grid; place-items:center; padding:2px; }
.tick.on { color:var(--done); }

/* team */
.team-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(248px,1fr)); gap:13px; }
.person { background:var(--panel); border:1px solid var(--line); border-radius:16px; padding:15px; display:flex; gap:12px; align-items:center; }
.person .pa { width:46px; height:46px; border-radius:13px; display:grid; place-items:center; color:#fff; font-weight:700; font-size:17px; flex-shrink:0; }
.person .pn { font-weight:600; font-size:15.5px; }
.person .pr { font-size:12.5px; color:var(--muted); }
.person .pe { font-size:12px; color:var(--dim); margin-top:2px; word-break:break-all; }
.sec-h { font-family:'Fraunces'; font-size:19px; font-weight:600; margin:22px 0 12px; display:flex; align-items:center; gap:9px; }
.proj-row { display:flex; align-items:center; gap:11px; background:var(--panel); border:1px solid var(--line); border-radius:13px; padding:11px 14px; margin-bottom:9px; flex-wrap:wrap; }
.proj-row .pd { width:13px; height:13px; border-radius:5px; flex-shrink:0; }

/* calendar */
.cal-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.cal-m { font-family:'Fraunces'; font-size:21px; font-weight:600; }
.cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; }
.cal-dow { text-align:center; font-size:11px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; padding-bottom:4px; }
.cal-cell { background:var(--panel); border:1px solid var(--line); border-radius:11px; min-height:84px; padding:7px; cursor:pointer; transition:.12s; }
.cal-cell:hover { border-color:var(--primary); }
.cal-cell.blank { background:transparent; border:none; cursor:default; }
.cal-cell.today { border-color:var(--primary); box-shadow:inset 0 0 0 1px var(--primary); }
.cal-num { font-size:12.5px; font-weight:600; color:var(--muted); }
.cal-cell.today .cal-num { color:var(--primary); }
.cal-ev { font-size:10.5px; font-weight:600; color:#fff; border-radius:6px; padding:2px 5px; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cal-ev.done { opacity:.5; text-decoration:line-through; }

/* gantt */
.gantt-wrap { background:var(--panel); border:1px solid var(--line); border-radius:18px; padding:16px; overflow:hidden; }
.gantt-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; gap:10px; flex-wrap:wrap; }
.gantt-scroll { overflow-x:auto; padding-bottom:6px; }
.gantt-grid { position:relative; }
.gantt-axis { display:flex; margin-left:200px; border-bottom:1px solid var(--line); }
.gantt-day { flex:0 0 auto; text-align:center; font-size:10.5px; color:var(--muted); padding:2px 0 8px; border-left:1px solid var(--line); }
.gantt-day.wknd { color:var(--dim); background:rgba(255,255,255,.012); }
.gantt-day.today { color:var(--primary); font-weight:700; }
.gantt-grp { font-size:11px; font-weight:700; color:var(--dim); text-transform:uppercase; letter-spacing:.6px; padding:14px 0 6px; }
.gantt-row { display:flex; align-items:center; height:46px; position:relative; }
.gantt-lbl { width:200px; flex:0 0 200px; font-size:13px; font-weight:600; padding-right:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; position:sticky; left:0; z-index:6; background:var(--panel); border-right:1px solid var(--line); align-self:stretch; display:flex; align-items:center; }
.gantt-track { position:relative; flex:1; height:100%; }
.gantt-bar { position:absolute; top:11px; height:24px; border-radius:7px; display:flex; align-items:center; padding:0 8px;
  font-size:11px; font-weight:600; color:#fff; cursor:pointer; overflow:hidden; white-space:nowrap; transition:.12s; box-shadow:0 2px 6px rgba(0,0,0,.3); }
.gantt-bar:hover { filter:brightness(1.12); top:6px; height:24px; }
.gantt-bar.done { opacity:.5; }
.gantt-now { position:absolute; top:0; bottom:0; width:2px; background:var(--primary); z-index:5; }
.gantt-now::after { content:''; position:absolute; top:-4px; left:-3px; width:8px; height:8px; border-radius:99px; background:var(--primary); }

/* modal */
.ov { position:fixed; inset:0; background:rgba(6,9,14,.66); backdrop-filter:blur(4px); display:grid; place-items:center; padding:18px; z-index:60; animation:fade .2s; }
@keyframes fade { from{opacity:0} to{opacity:1} }
.modal { background:var(--panel2); border:1px solid var(--line2); border-radius:22px; width:100%; max-width:470px; padding:22px; box-shadow:0 30px 70px rgba(0,0,0,.6); animation:pop .25s cubic-bezier(.2,.9,.3,1.2); max-height:90vh; overflow:auto; }
@keyframes pop { from{opacity:0; transform:scale(.96) translateY(10px)} to{opacity:1; transform:none} }
.modal-h { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.modal-h h2 { font-family:'Fraunces'; font-size:21px; font-weight:600; }
.fld { margin-bottom:13px; }
.fld label { display:block; font-size:12px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px; }
.fld input, .fld textarea, .fld select { width:100%; min-width:0; font-family:'Outfit'; font-size:14px; color:var(--ink);
  border:1px solid var(--line2); border-radius:11px; padding:10px 12px; background:var(--bg); outline:none; }
.fld input::placeholder, .fld textarea::placeholder { color:var(--dim); }
.fld input:focus, .fld textarea:focus, .fld select:focus { border-color:var(--primary); }
.cad input[type="date"] { cursor:pointer; }
.cad input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(.7); opacity:.85; cursor:pointer; margin-left:2px; }
.cad.light input[type="date"]::-webkit-calendar-picker-indicator { filter:none; }
.row2 input[type="date"] { font-size:12.5px; padding:9px 8px; }
.fld textarea { resize:vertical; min-height:62px; }
.row2 { display:grid; grid-template-columns:1fr 1fr; gap:11px; }
.row2 > * { min-width:0; }
.pri-pick, .mode-pick { display:flex; gap:7px; }
.pri-pick button, .mode-pick button { flex:1; border:1px solid var(--line2); background:var(--bg); border-radius:10px; padding:9px; font-family:'Outfit'; font-weight:600; font-size:13px; cursor:pointer; color:var(--ink); display:flex; align-items:center; justify-content:center; gap:6px; }
.pri-pick button.on, .mode-pick button.on { border-color:var(--primary); background:var(--primary); color:#fff; }
.swatches { display:flex; gap:7px; flex-wrap:wrap; }
.swatch { width:28px; height:28px; border-radius:9px; cursor:pointer; border:2px solid transparent; }
.swatch.on { border-color:#fff; transform:scale(1.08); }
.rcp { border:1px solid var(--line2); border-radius:12px; max-height:210px; overflow:auto; background:var(--bg); }
.rcp-row { display:flex; align-items:center; gap:10px; padding:9px 12px; border-bottom:1px solid var(--line); cursor:pointer; }
.rcp-row:last-child { border-bottom:none; }
.rcp-row:hover { background:var(--panel); }
.rcp-box { width:18px; height:18px; border-radius:5px; border:2px solid var(--line2); display:grid; place-items:center; flex-shrink:0; color:#fff; }
.rcp-box.on { background:var(--done); border-color:var(--done); }
.rcp-av { width:26px; height:26px; border-radius:8px; display:grid; place-items:center; color:#fff; font-weight:700; font-size:10px; flex-shrink:0; }
.rcp-name { font-size:13.5px; font-weight:600; line-height:1.15; }
.rcp-role { font-size:11.5px; color:var(--muted); }
.from-line { font-size:12.5px; color:var(--muted); background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:9px 12px; margin-bottom:14px; display:flex; align-items:center; gap:8px; }
.from-line b { color:var(--ink); font-weight:600; }
.foot-note { font-size:12px; color:var(--muted); display:flex; align-items:center; justify-content:center; gap:6px; text-align:center; }

/* sign in */
.login { min-height:100vh; display:grid; place-items:center; padding:24px; }
.login-card { background:var(--panel); border:1px solid var(--line); border-radius:24px; padding:34px 30px; width:100%; max-width:400px; box-shadow:0 30px 70px rgba(0,0,0,.5); text-align:center; animation:pop .3s cubic-bezier(.2,.9,.3,1.2); }
.login-mark { width:54px; height:54px; border-radius:16px; background:var(--primary); display:grid; place-items:center; color:#fff; margin:0 auto 16px; box-shadow:0 8px 22px rgba(255,107,69,.36); }
.login h1 { font-family:'Fraunces'; font-size:27px; font-weight:600; letter-spacing:-.5px; }
.login p { color:var(--muted); font-size:14px; margin-top:6px; margin-bottom:24px; }
.ms-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:11px; background:var(--ink); color:#16202e; border:none; border-radius:12px; padding:13px; font-family:'Outfit'; font-weight:700; font-size:15px; cursor:pointer; transition:.15s; }
.ms-btn:hover { transform:translateY(-1px); box-shadow:0 8px 18px rgba(0,0,0,.4); }
.ms-logo { width:19px; height:19px; display:grid; grid-template-columns:1fr 1fr; gap:2px; }
.ms-logo span { display:block; border-radius:1px; }
.login-foot { margin-top:18px; font-size:12px; color:var(--muted); display:flex; align-items:center; justify-content:center; gap:6px; }
.demo-tag { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:var(--amber); background:rgba(232,165,60,.12); border:1px solid rgba(232,165,60,.3); border-radius:99px; padding:4px 11px; margin-bottom:20px; text-transform:uppercase; letter-spacing:.5px; }
.rem { display:flex; align-items:center; gap:9px; font-size:13px; color:var(--muted); cursor:pointer; margin:4px 0 16px; user-select:none; }
.rem .rb { width:18px; height:18px; border-radius:5px; border:2px solid var(--line2); display:grid; place-items:center; color:#fff; }
.rem .rb.on { background:var(--teal); border-color:var(--teal); }

/* theme-safe sign-in button */
.ms-btn { background:var(--panel2); color:var(--ink); border:1px solid var(--line2); }

/* twilight theme */
.cad.twilight {
  --bg:#1C1B2E; --panel:#252340; --panel2:#2E2B50; --raise:#373462;
  --line:#423E6E; --line2:#554F8A; --ink:#E4DEFF; --muted:#9B94CC; --dim:#6B6399;
  --primary:#E03A3E; --primary-d:#C42F33; --teal:#7B8FE8; --amber:#8B7FD4; --slate:#7B74A8; --done:#3DBD7A;
  background:
    radial-gradient(1100px 520px at 88% -8%, rgba(224,58,62,.10) 0%, transparent 55%),
    radial-gradient(900px 500px at -6% 108%, rgba(123,143,232,.12) 0%, transparent 52%),
    var(--bg);
}
.cad.twilight .bar { background:rgba(28,27,46,.85); }

/* light theme */
.cad.light {
  --bg:#EEF2F8; --panel:#FFFFFF; --panel2:#F6F9FD; --raise:#EDF1F8;
  --line:#DBE3EF; --line2:#C4D0E2; --ink:#16243A; --muted:#566884; --dim:#93A0B5;
  --primary:#E03A3E; --primary-d:#C42F33; --teal:#2E80C2; --amber:#2E6FB0; --slate:#7686A0; --done:#2BA45F;
  background:
    radial-gradient(1100px 520px at 88% -8%, rgba(224,58,62,.07) 0%, transparent 55%),
    radial-gradient(900px 500px at -6% 108%, rgba(46,128,194,.10) 0%, transparent 52%),
    var(--bg);
}
.cad.light .bar { background:rgba(238,242,248,.85); }

/* note popover */
.note-pop { width:250px; background:var(--panel2); border:1px solid var(--line2); border-radius:14px; padding:12px; box-shadow:0 20px 50px rgba(0,0,0,.45); z-index:80; }
.note-pop h5 { font-size:13.5px; font-weight:700; margin-bottom:4px; }
.note-pop .desc { font-size:12px; color:var(--muted); margin-bottom:8px; line-height:1.45; }
.note-row { font-size:12.5px; padding:7px 0; border-top:1px solid var(--line); display:flex; gap:8px; align-items:flex-start; }
.note-row .by { color:var(--muted); font-size:10.5px; white-space:nowrap; }
.note-add { display:flex; gap:6px; margin-top:9px; }
.note-add input { flex:1; font-family:'Outfit'; font-size:12.5px; color:var(--ink); border:1px solid var(--line2); border-radius:9px; padding:7px 9px; background:var(--bg); outline:none; }
@keyframes conff { to { transform:translateY(108vh) rotate(720deg); opacity:.15; } }
.toast { position:fixed; top:90px; left:50%; transform:translateX(-50%); z-index:210; background:var(--panel2); border:1px solid var(--line2); border-radius:16px; padding:16px 22px; box-shadow:0 24px 60px rgba(0,0,0,.5); font-family:'Fraunces'; font-size:18px; font-weight:600; display:flex; align-items:center; gap:10px; animation:pop .3s cubic-bezier(.2,.9,.3,1.2); }
.pres { display:flex; align-items:center; }
.pres .dotwrap { position:relative; }
.pres .sdot { position:absolute; bottom:-1px; right:-1px; width:9px; height:9px; border-radius:99px; border:2px solid var(--panel); }
.pres-menu { position:absolute; right:0; top:42px; width:230px; background:var(--panel2); border:1px solid var(--line2); border-radius:14px; padding:8px; box-shadow:0 20px 50px rgba(0,0,0,.5); z-index:50; }
.pres-row { display:flex; align-items:center; gap:9px; padding:7px 9px; font-size:13px; }
.navarrow { position:absolute; top:46%; transform:translateY(-50%); z-index:15; width:30px; height:30px; border-radius:99px; border:1px solid var(--line2); background:var(--panel2); color:var(--muted); display:grid; place-items:center; cursor:pointer; opacity:.5; box-shadow:0 4px 14px rgba(0,0,0,.28); }
.navarrow:hover { opacity:1; color:var(--ink); }
`;

const PALETTE = ["#E03A3E","#4FA8E8","#33B36B","#E8A53C","#9A6BF0","#E0734A","#2E80C2","#C56BD6","#5FD18C","#EC6A9C","#1E5F9E","#F0C04A"];
const STORE_KEY = "cadence:data:v2";
const USER_KEY = "cadence:user:v1";

const uid = () => Math.random().toString(36).slice(2, 9);
const todayISO = () => new Date().toISOString().slice(0, 10);
const initials = (n) => (n || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
const MS = 86400000;
const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const dayDiff = (a, b) => Math.round((Date.parse(b + "T00:00:00") - Date.parse(a + "T00:00:00")) / MS);
function fmtDue(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
const isOverdue = (iso, status) => iso && status !== "done" && iso < todayISO();

const COLUMNS = [
  { id: "todo", label: "To do", dot: "#7686A0" },
  { id: "doing", label: "In progress", dot: "#E8A53C" },
  { id: "done", label: "Done", dot: "#33B36B" },
];
const PRIO = { low: "#7686A0", med: "#E8A53C", high: "#FF6B45" };
const NAV = [
  { id: "home", label: "Home", Icon: LayoutDashboard },
  { id: "tracker", label: "Tracker", Icon: Table },
  { id: "gantt", label: "Gantt", Icon: GanttChartSquare },
  { id: "alerts", label: "Inbox", Icon: Bell },
  { id: "calendar", label: "Calendar", Icon: CalendarDays },
  { id: "team", label: "Team", Icon: Users },
  { id: "mail", label: "Mail", Icon: Mail },
];

/* ---------- storage (browser localStorage) ---------- */
function loadData() { try { const v = localStorage.getItem(STORE_KEY); if (v) return JSON.parse(v); } catch (e) {} return null; }
function saveData(d) { try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) {} }
function loadUser() { try { const v = localStorage.getItem(USER_KEY); if (v) return JSON.parse(v); } catch (e) {} return null; }
function saveUser(u) { try { u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY); } catch (e) {} }

function download(name, text, type) {
  const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const SAMPLE = {
  people: [
    { id: "p1", name: "Maya Chen", role: "Designer", email: "maya@rtmec.com", color: PALETTE[1] },
    { id: "p2", name: "Devon Brooks", role: "Developer", email: "devon@rtmec.com", color: PALETTE[3] },
    { id: "p3", name: "Sara Lopez", role: "Project Lead", email: "sara@rtmec.com", color: PALETTE[4] },
  ],
  projects: [
    { id: "j1", name: "Website Refresh", color: PALETTE[0] },
    { id: "j2", name: "Q3 Launch", color: PALETTE[2] },
  ],
  tasks: [
    { id: uid(), title: "Draft new homepage layout", notes: "Hero + 3 sections", projectId: "j1", assigneeId: "p1", status: "doing", start: addDays(todayISO(), -2), due: addDays(todayISO(), 3), priority: "high", createdAt: Date.now() },
    { id: uid(), title: "Set up staging server", notes: "", projectId: "j1", assigneeId: "p2", status: "todo", start: addDays(todayISO(), 1), due: addDays(todayISO(), 6), priority: "med", createdAt: Date.now() },
    { id: uid(), title: "Approve final copy", notes: "Waiting on legal", projectId: "j2", assigneeId: "p3", status: "todo", start: addDays(todayISO(), 4), due: addDays(todayISO(), 9), priority: "low", createdAt: Date.now() },
    { id: uid(), title: "Kickoff meeting notes", notes: "", projectId: "j2", assigneeId: "p3", status: "done", start: addDays(todayISO(), -6), due: addDays(todayISO(), -4), priority: "med", createdAt: Date.now() },
  ],
};

export default function App() {
  const [data, setData] = useState({ people: [], projects: [], tasks: [] });
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem("cadence:theme") || "dark"; } catch (e) { return "dark"; } });
  const effLight = theme === "light";
  const rootCls = "cad" + (theme !== "dark" ? " " + theme : "");
  const cycleTheme = () => setTheme(t => { const n = t === "dark" ? "twilight" : t === "twilight" ? "light" : "dark"; try { localStorage.setItem("cadence:theme", n); } catch (e) {} return n; });
  const ThemeIcon = theme === "light" ? Sun : theme === "twilight" ? Sparkles : Moon;
  const [profileOpen, setProfileOpen] = useState(false);
  const updateUser = (patch) => { setUser(u => { const n = { ...u, ...patch }; saveUser(n); return n; }); };
  const [gantt, setGantt] = useState(() => loadGantt() || gSample());
  useEffect(() => { saveGantt(gantt); }, [gantt]);
  const [ganttGoto, setGanttGoto] = useState(null);
  const gotoGantt = (pid) => { if (pid) bumpOpen(pid); setGanttGoto(pid || null); setView("gantt"); };
  const [notif, setNotif] = useState(loadNotif);
  useEffect(() => { saveNotif(notif); }, [notif]);
  const [contacts, setContacts] = useState(loadContacts);
  useEffect(() => { saveContacts(contacts); }, [contacts]);
  const [compose, setCompose] = useState(null);
  const openComposer = (ids, source) => { const subj = source ? `[${source.group ? `${source.project} — ${source.group}` : (source.project || "Cadence")}] ` : ""; setCompose({ ids: [...new Set(ids)], subject: subj, body: "", picking: false, groupName: "", source: source || null }); };
  const [view, setView] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const [fPerson, setFPerson] = useState("all");
  const [fProject, setFProject] = useState("all");
  const [taskModal, setTaskModal] = useState(null);
  const [personModal, setPersonModal] = useState(null);
  const [projectModal, setProjectModal] = useState(null);
  const [teamEmail, setTeamEmail] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const d = loadData();
    if (d && (d.people || d.tasks)) setData({ people: d.people || [], projects: d.projects || [], tasks: d.tasks || [] });
    else setData(SEED_DATA);
    const u = loadUser(); if (u) setUser(u);
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) saveData(data); }, [data, loaded]);

  const signIn = (u) => { setUser(u); saveUser(u); setView("home"); };
  const signOut = () => { setUser(null); saveUser(null); setMenuOpen(false); };

  const personById = (id) => data.people.find(p => p.id === id);
  const projectById = (id) => data.projects.find(p => p.id === id);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return data.tasks.filter(t => {
      if (fPerson !== "all" && t.assigneeId !== fPerson) return false;
      if (fProject !== "all" && t.projectId !== fProject) return false;
      if (ql && !(`${t.title} ${t.notes || ""}`.toLowerCase().includes(ql))) return false;
      return true;
    });
  }, [data.tasks, q, fPerson, fProject]);

  /* mutations */
  const upsertTask = (t) => setData(d => ({ ...d, tasks: d.tasks.some(x => x.id === t.id) ? d.tasks.map(x => x.id === t.id ? t : x) : [...d.tasks, t] }));
  const delTask = (id) => setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }));
  const cycleStatus = (t) => { const o = ["todo", "doing", "done"]; upsertTask({ ...t, status: o[(o.indexOf(t.status) + 1) % 3] }); };
  const upsertPerson = (p) => setData(d => ({ ...d, people: d.people.some(x => x.id === p.id) ? d.people.map(x => x.id === p.id ? p : x) : [...d.people, p] }));
  const delPerson = (id) => setData(d => ({ ...d, people: d.people.filter(p => p.id !== id) }));
  const upsertProject = (p) => setData(d => ({ ...d, projects: d.projects.some(x => x.id === p.id) ? d.projects.map(x => x.id === p.id ? p : x) : [...d.projects, p] }));
  const delProject = (id) => setData(d => ({ ...d, projects: d.projects.filter(p => p.id !== id) }));

  /* email */
  const emailTask = (t) => {
    const person = personById(t.assigneeId), proj = projectById(t.projectId);
    const subject = `${proj ? "[" + proj.name + "] " : ""}${t.title}`;
    const lines = [`Hi ${person ? person.name.split(" ")[0] : ""},`, "", `Quick note about: ${t.title}`, proj ? `Project: ${proj.name}` : "", t.due ? `Due: ${fmtDue(t.due)}` : "", t.notes ? `\n${t.notes}` : "", "", "Thanks!"].filter(Boolean);
    window.open(`https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(person?.email || "")}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  };
  const projectMembers = (projectId) => {
    const ids = new Set(data.tasks.filter(t => t.projectId === projectId).map(t => t.assigneeId));
    return data.people.filter(p => ids.has(p.id));
  };
  const sendTeamEmail = ({ toEmails, ccEmails, subject, body }) => {
    const u = new URLSearchParams();
    if (toEmails?.length) u.set("to", toEmails.join(","));
    if (ccEmails?.length) u.set("cc", ccEmails.join(","));
    if (subject) u.set("subject", subject);
    if (body) u.set("body", body);
    window.open(`https://outlook.office.com/mail/deeplink/compose?${u.toString()}`, "_blank");
  };

  /* export / import */
  const exportJSON = () => download(`cadence-backup-${todayISO()}.json`, JSON.stringify(data, null, 2), "application/json");
  const exportCSV = () => {
    const head = ["Task", "Project", "Assignee", "Role", "Status", "Start", "Due", "Priority", "Notes"];
    const rows = data.tasks.map(t => { const p = personById(t.assigneeId), j = projectById(t.projectId); return [t.title, j?.name || "", p?.name || "", p?.role || "", t.status, t.start || "", t.due || "", t.priority, t.notes || ""]; });
    download(`cadence-tasks-${todayISO()}.csv`, [head, ...rows].map(r => r.map(csvCell).join(",")).join("\n"), "text/csv");
  };
  const importJSON = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); setData({ people: d.people || [], projects: d.projects || [], tasks: d.tasks || [] }); } catch { alert("Could not read that backup file."); } };
    r.readAsText(file); e.target.value = "";
  };

  const newTask = (preset = {}) => setTaskModal({ id: uid(), title: "", notes: "", projectId: data.projects[0]?.id || "", assigneeId: data.people[0]?.id || "", status: "todo", start: "", due: "", priority: "med", createdAt: Date.now(), _new: true, ...preset });

  if (!loaded) return <div className={rootCls}><style dangerouslySetInnerHTML={{ __html: css }} /></div>;
  if (!user) return <div className={rootCls}><style dangerouslySetInnerHTML={{ __html: css }} /><LoginScreen onSignIn={signIn} /></div>;

  const ctx = { data, filtered, personById, projectById, projectMembers,
    setTaskModal, newTask, cycleStatus, delTask, emailTask, setTeamEmail,
    setPersonModal, setProjectModal, delPerson, delProject,
    q, setQ, fPerson, setFPerson, fProject, setFProject, setView, user,
    openProfile: () => setProfileOpen(true), updateUser,
    gantt, setGantt, ganttGoto, gotoGantt, clearGanttGoto: () => setGanttGoto(null),
    notif, setNotif,
    contacts, setContacts, openComposer,
    effLight, theme,
    loadSample: () => setData(SAMPLE) };

  const unreadCount = buildNotifs(gantt).filter(n => !notif.read.includes(n.id) && !notif.removed.includes(n.id)).length;
  const presence = user.presence || "auto";
  const online = presence !== "offline";

  return (
    <div className={rootCls} style={user.bg ? { background: `radial-gradient(1200px 760px at 50% -6%, ${user.bg} 0%, transparent 62%), radial-gradient(1000px 700px at 100% 102%, ${user.bg} 0%, transparent 58%), var(--bg)` } : undefined}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* top bar */}
      <div className="bar" onClick={() => menuOpen && setMenuOpen(false)}>
        <div className="prof" onClick={e => e.stopPropagation()}>
          <button className="prof-btn" onClick={() => setMenuOpen(o => !o)}>
            <span style={{ position: "relative", display: "inline-flex" }}>
              <UserAv u={user} size={32} />
              <span style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: 99, background: online ? "#33B36B" : "#E03A3E", border: "2px solid var(--panel)" }} />
            </span>
            <span>
              <span className="prof-name">{user.name}</span>
              <span className="prof-mail">{user.email}</span>
            </span>
            <ChevronDown size={16} color="var(--muted)" />
          </button>
          {menuOpen && (
            <div className="menu">
              <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", gap: 10 }}>
                <UserAv u={user} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="prof-name">{user.name}</div>
                  <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, color: online ? "var(--done)" : "var(--primary)", fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: online ? "#33B36B" : "#E03A3E" }} />{online ? "Online" : "Offline"}</div>
                </div>
              </div>
              <div className="menu-sep" />
              <div className="menu-lbl">Set status</div>
              <button className={`menu-i ${presence === "auto" ? "on" : ""}`} onClick={() => { updateUser({ presence: "auto" }); setMenuOpen(false); }}><Monitor size={17} />Auto — online while you're here</button>
              <button className={`menu-i ${presence === "online" ? "on" : ""}`} onClick={() => { updateUser({ presence: "online" }); setMenuOpen(false); }}><span style={{ width: 17, display: "grid", placeItems: "center" }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "#33B36B" }} /></span>Online</button>
              <button className={`menu-i ${presence === "offline" ? "on" : ""}`} onClick={() => { updateUser({ presence: "offline" }); setMenuOpen(false); }}><span style={{ width: 17, display: "grid", placeItems: "center" }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "#E03A3E" }} /></span>Offline</button>
              <div className="menu-sep" />
              <button className="menu-i" onClick={signOut}><LogOut size={17} />Sign out</button>
            </div>
          )}
        </div>

        <div className="tabs">
          {NAV.map(n => (
            <button key={n.id} className={`tab ${view === n.id ? "on" : ""}`} onClick={() => setView(n.id)} style={{ position: "relative" }}>
              <n.Icon size={15} />{n.label}
              {n.id === "alerts" && unreadCount > 0 && <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 99, background: "var(--primary)", color: "#fff", fontSize: 10, fontWeight: 800, display: "grid", placeItems: "center", border: "2px solid var(--panel)" }}>{unreadCount}</span>}
            </button>
          ))}
        </div>
        <div className="bar-sp" />
        <button className="btn icon-btn" onClick={cycleTheme} title={`Theme: ${theme}`}><ThemeIcon size={16} /></button>
        <div className="brand-min"><span className="bm"><LayoutGrid size={17} /></span><b>Cadence</b></div>
        <input ref={fileRef} type="file" accept="application/json" onChange={importJSON} style={{ display: "none" }} />
      </div>

      <div className="main">
        {view === "home" && <HomeView ctx={ctx} />}
        {view === "tracker" && <TrackerView ctx={ctx} />}
        {view === "gantt" && <GanttView ctx={ctx} />}
        {view === "alerts" && <NotificationsView ctx={ctx} />}
        {view === "calendar" && <CalendarView ctx={ctx} />}
        {view === "team" && <TeamView ctx={ctx} />}
        {view === "mail" && <MailView />}
      </div>

      {taskModal && (
        <TaskModal task={taskModal} people={data.people} projects={data.projects}
          onClose={() => setTaskModal(null)} onSave={(t) => { upsertTask(t); setTaskModal(null); }}
          onDelete={taskModal._new ? null : () => { delTask(taskModal.id); setTaskModal(null); }} />
      )}
      {personModal && <PersonModal person={personModal} onClose={() => setPersonModal(null)} onSave={(p) => { upsertPerson(p); setPersonModal(null); }} />}
      {projectModal && <ProjectModal project={projectModal} onClose={() => setProjectModal(null)} onSave={(p) => { upsertProject(p); setProjectModal(null); }} />}
      {profileOpen && <ProfileModal user={user} onClose={() => setProfileOpen(false)} onSave={updateUser} />}
      {teamEmail && <TeamEmailModal project={teamEmail} members={projectMembers(teamEmail.id)} fromUser={user} onClose={() => setTeamEmail(null)} onSend={(p) => { sendTeamEmail(p); setTeamEmail(null); }} />}
      {compose && <EmailComposerModal ctx={ctx} compose={compose} setCompose={setCompose} />}
    </div>
  );
}

/* ---------------- Home dashboard ---------------- */
function HomeView({ ctx }) {
  const { user, setView, gotoGantt } = ctx;
  const gd = ctx.gantt;
  const today = todayISO();
  const projects = gd.projects.filter(p => !p.deleted);
  const gComplete = (g) => g.members.length > 0 && g.members.every(m => m.done);
  const allTasks = [];
  projects.forEach(p => p.groups.forEach(g => allTasks.push({ g, p })));
  const projDone = (p) => !!p.done;
  const projOverdue = (p) => p.due && p.due < today && !p.done;
  const taskOverdue = ({ g }) => !gComplete(g) && g.end && g.end < today;

  const opens = loadOpens();
  const ranked = [...projects].sort((a, b) => (opens[b.id] || 0) - (opens[a.id] || 0));

  const [drill, setDrill] = useState(null);
  const [winMode, setWinMode] = useState("days");
  const [ppA, setPpA] = useState(() => ranked[0]?.id || "");
  const [ppB, setPpB] = useState(() => ranked[1]?.id || ranked[0]?.id || "");
  const [wlProj, setWlProj] = useState(() => ranked[0]?.id || "");

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const cards = [
    { key: "total", label: "Total", color: "var(--slate)", I: LayoutGrid, projList: projects, taskList: allTasks },
    { key: "inprogress", label: "In progress", color: "var(--amber)", I: Clock, projList: projects.filter(p => !projDone(p)), taskList: allTasks.filter(t => !gComplete(t.g)) },
    { key: "completed", label: "Completed", color: "var(--done)", I: CheckCircle2, projList: projects.filter(projDone), taskList: allTasks.filter(t => gComplete(t.g)) },
    { key: "overdue", label: "Overdue", color: "var(--primary)", I: Flame, projList: projects.filter(projOverdue), taskList: allTasks.filter(taskOverdue) },
  ];
  const activeCard = drill ? cards.find(c => c.key === drill.card) : null;

  if (projects.length === 0) {
    return (
      <div className="panel" style={{ textAlign: "center", padding: "54px 24px" }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--panel2)", border: "1px solid var(--line)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}><Sparkles size={28} color="var(--primary)" /></div>
        <div className="h-title" style={{ fontSize: 23 }}>{greet}, {user.name.split(" ")[0]}.</div>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "8px 0 18px" }}>No projects yet — head to the Gantt chart to create your first one.</p>
        <button className="btn btn-pri" onClick={() => setView("gantt")}><GanttChartSquare size={16} />Open the Gantt</button>
      </div>
    );
  }

  const cut = winMode === "days" ? addDays(today, 7) : winMode === "month" ? addDays(today, 31) : addDays(today, 365);
  const upcoming = [];
  allTasks.forEach(({ g, p }) => { if (g.end && g.end >= today && g.end <= cut && !gComplete(g)) upcoming.push({ type: "task", date: g.end, name: g.name, sub: p.name, pid: p.id }); });
  projects.forEach(p => { if (p.due && p.due >= today && p.due <= cut && !p.done) upcoming.push({ type: "project", date: p.due, name: p.name, sub: "Project due", pid: p.id }); });
  upcoming.sort((a, b) => a.date.localeCompare(b.date));

  const progressOf = (p) => {
    if (!p) return { pct: 0, gd: 0, gt: 0 };
    let tot = 0, done = 0; p.groups.forEach(g => { tot += g.members.length; done += g.members.filter(m => m.done).length; });
    const gt = p.groups.length, gdone = p.groups.filter(gComplete).length;
    return { pct: tot ? Math.round(done / tot * 100) : 0, gd: gdone, gt };
  };

  const topProj = projects.find(p => p.id === wlProj) || ranked[0];
  const workMembers = (() => {
    if (!topProj) return [];
    const map = {};
    topProj.groups.forEach(g => g.members.forEach(m => { if (!map[m.id]) map[m.id] = { ...m, todo: 0 }; if (!m.done) map[m.id].todo += 1; }));
    return Object.values(map).sort((a, b) => b.todo - a.todo);
  })();

  const ProjRow = ({ p }) => { const r = remaining(p.due, Date.now()); return (
    <div className="row-i" onClick={() => gotoGantt(p.id)}>
      <span className="row-dot" style={{ background: p.color }} />
      <span className="row-t">{p.name}{p.done ? " ✓" : ""}</span>
      <span className="row-meta">
        <span className="chip" style={{ background: ROLE_C[p.myRole] + "22", color: ROLE_C[p.myRole], textTransform: "capitalize" }}>{p.myRole}</span>
        {p.due && <span className={`chip chip-due ${(r && (r.past || r.soon) && !p.done) ? "over" : ""}`}>{fmtDue(p.due)}</span>}
      </span>
    </div>
  ); };
  const TaskRow = ({ t }) => { const c = gComplete(t.g); const over = !c && t.g.end && t.g.end < today; return (
    <div className="row-i" onClick={() => gotoGantt(t.p.id)}>
      <span className="row-dot" style={{ background: t.g.color || t.p.color }} />
      <span className="row-t">{t.g.name}{c ? " ✓" : ""}</span>
      <span className="row-meta">
        <span className="chip chip-proj">{t.p.name}</span>
        {t.g.end && <span className={`chip chip-due ${over ? "over" : ""}`}>{fmtDue(t.g.end)}</span>}
      </span>
    </div>
  ); };

  return (
    <>
      <div className="head">
        <div>
          <div className="h-title">{greet}, {user.name.split(" ")[0]}.</div>
          <div className="h-sub">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · here's where things stand.</div>
        </div>
      </div>

      <div className="stats">
        {cards.map(c => (
          <div className="stat" key={c.key} style={{ padding: 0, overflow: "hidden", display: "block" }}>
            <div onClick={() => setDrill(drill && drill.card === c.key && drill.kind === "project" ? null : { card: c.key, kind: "project" })}
              style={{ padding: "13px 14px 10px", cursor: "pointer", background: drill && drill.card === c.key && drill.kind === "project" ? "var(--raise)" : "transparent" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="si" style={{ background: c.color + "22", width: 30, height: 30 }}><c.I size={16} color={c.color} /></span><span className="sl" style={{ margin: 0 }}>{c.label}</span></div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 6 }}><span className="sv" style={{ color: c.color, fontSize: 26 }}>{c.projList.length}</span><span className="sl" style={{ margin: 0 }}>projects</span></div>
            </div>
            <div onClick={() => setDrill(drill && drill.card === c.key && drill.kind === "task" ? null : { card: c.key, kind: "task" })}
              style={{ padding: "9px 14px 12px", cursor: "pointer", borderTop: "1px solid var(--line)", background: drill && drill.card === c.key && drill.kind === "task" ? "var(--raise)" : "transparent" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}><span className="sv" style={{ color: "var(--ink)", fontSize: 21 }}>{c.taskList.length}</span><span className="sl" style={{ margin: 0 }}>tasks</span></div>
            </div>
          </div>
        ))}
      </div>

      {drill && activeCard && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-h">
            <span className="pic" style={{ background: activeCard.color + "22" }}><activeCard.I size={16} color={activeCard.color} /></span>
            {activeCard.label} · {drill.kind === "project" ? "projects" : "tasks"}
            <span className="more" style={{ cursor: "pointer" }} onClick={() => setDrill(null)}>close ✕</span>
          </div>
          {drill.kind === "project"
            ? (activeCard.projList.length === 0 ? <div className="empty-sm">Nothing here.</div> : activeCard.projList.map(p => <ProjRow key={p.id} p={p} />))
            : (activeCard.taskList.length === 0 ? <div className="empty-sm">Nothing here.</div> : activeCard.taskList.map(t => <TaskRow key={t.g.id} t={t} />))}
          <div className="foot-note" style={{ justifyContent: "flex-start", marginTop: 8 }}><Sparkles size={12} />Click any row to open it in the Gantt.</div>
        </div>
      )}

      <div className="grid-2">
        <div className="panel">
          <div className="panel-h">
            <span className="pic" style={{ background: "rgba(255,107,69,.16)" }}><CalendarDays size={16} color="var(--primary)" /></span>Coming up
            <span style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              {[["days", "7 days"], ["month", "Month"], ["year", "Year"]].map(([m, lbl]) => (
                <button key={m} className="btn btn-sm" onClick={() => setWinMode(m)} style={{ padding: "4px 9px", ...(winMode === m ? { background: "var(--teal)", borderColor: "var(--teal)", color: "#fff" } : {}) }}>{lbl}</button>
              ))}
            </span>
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--muted)", margin: "0 0 8px 2px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--teal)" }} />task</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--primary)" }} />project</span>
          </div>
          {upcoming.length === 0 ? <div className="empty-sm">Nothing due in this window. 🎉</div> :
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {upcoming.map((u, i) => (
                <div className="row-i" key={i} onClick={() => gotoGantt(u.pid)}>
                  <span className="row-dot" style={{ background: u.type === "task" ? "var(--teal)" : "var(--primary)" }} />
                  <span className="row-t">{u.name}</span>
                  <span className="row-meta"><span className="chip chip-proj">{u.sub}</span><span className="chip chip-due">{fmtDue(u.date)}</span></span>
                </div>
              ))}
            </div>}
        </div>

        <div className="panel">
          <div className="panel-h"><span className="pic" style={{ background: "rgba(52,203,166,.16)" }}><TrendingUp size={16} color="var(--teal)" /></span>Project progress</div>
          {[[ppA, setPpA], [ppB, setPpB]].map(([val, setVal], idx) => {
            const p = projects.find(x => x.id === val); const pr = progressOf(p);
            return (
              <div key={idx} style={{ marginBottom: 14 }}>
                <select className="btn btn-sm" style={{ width: "100%", marginBottom: 7 }} value={val} onChange={e => setVal(e.target.value)}>
                  <option value="">Pick a project…</option>
                  {projects.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
                {p && (
                  <div className="prog-row">
                    <div className="prog-top"><span className="row-dot" style={{ background: p.color }} />{p.name}<span className="pct">{pr.pct}% · {pr.gd}/{pr.gt} groups</span></div>
                    <div className="bar-mini"><i style={{ width: pr.pct + "%", background: p.color }} /></div>
                  </div>
                )}
              </div>
            );
          })}
          <div className="foot-note" style={{ justifyContent: "flex-start" }}><Sparkles size={12} />Auto-set to your most-opened projects. Pick any two.</div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-h"><span className="pic" style={{ background: "rgba(91,141,239,.16)" }}><Users size={16} color="#5B8DEF" /></span>Team workload
          <select className="btn btn-sm" style={{ marginLeft: "auto" }} value={topProj ? topProj.id : ""} onChange={e => setWlProj(e.target.value)}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {!topProj || workMembers.length === 0 ? <div className="empty-sm">No one assigned in your top project yet.</div> :
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
            {workMembers.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 12 }}>
                <MemberAv m={{ ...m, done: false }} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.name.split(" ")[0]}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{m.todo} to finish</div>
                </div>
                <span style={{ fontFamily: "Fraunces", fontSize: 19, fontWeight: 600, color: m.todo ? "var(--ink)" : "var(--dim)" }}>{m.todo}</span>
              </div>
            ))}
          </div>}
      </div>
    </>
  );
}

/* ---------------- Gantt (project picker -> timeline -> sign-off) ---------------- */
const GKEY = "cadence:gantt:v3";
const OKEY = "cadence:opens:v1";
function loadGantt() { try { const v = localStorage.getItem(GKEY); if (v) return JSON.parse(v); } catch (e) {} return null; }
function saveGantt(g) { try { localStorage.setItem(GKEY, JSON.stringify(g)); } catch (e) {} }
function loadOpens() { try { const v = localStorage.getItem(OKEY); if (v) return JSON.parse(v); } catch (e) {} return {}; }
function bumpOpen(pid) { try { const o = loadOpens(); o[pid] = (o[pid] || 0) + 1; localStorage.setItem(OKEY, JSON.stringify(o)); } catch (e) {} }
const CKEY = "cadence:contacts:v1";
function loadContacts() { try { const v = localStorage.getItem(CKEY); if (v) return JSON.parse(v); } catch (e) {} return { info: {}, groups: [] }; }
function saveContacts(c) { try { localStorage.setItem(CKEY, JSON.stringify(c)); } catch (e) {} }
const DISCIPLINES = ["Civil", "Electrical", "Mechanical", "Structural", "Plumbing", "Architecture", "Survey", "Project Management", "Safety", "Estimating", "Superintendent"];
const BIOS = ["Dependable on site, quick to sign off.", "Detail-driven; keeps the crew on schedule.", "Veteran hand — calm under deadline pressure.", "Strong communicator, rarely misses a hand-off.", "Problem-solver who keeps things moving.", "Steady worker, sharp on quality checks.", "Knows the plans cold, flags issues early.", "Reliable closer — finishes what they start."];
function previewBio(p) {
  let h = 0; const s = (p && (p.id || p.name)) || ""; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const base = BIOS[h % BIOS.length];
  return p && p.discipline ? `${p.discipline} specialist. ${base}` : base;
}
const NKEY = "cadence:notif:v1";
function loadNotif() { try { const v = localStorage.getItem(NKEY); if (v) return JSON.parse(v); } catch (e) {} return { read: [], removed: [] }; }
function saveNotif(n) { try { localStorage.setItem(NKEY, JSON.stringify(n)); } catch (e) {} }
const NICON = { flame: Flame, alert: AlertCircle, clock: Clock, msg: MessageSquare, mail: Mail, plus: Plus, cal: CalendarDays };
function buildNotifs(gd) {
  const today = todayISO();
  const gC = (g) => g.members.length > 0 && g.members.every(m => m.done);
  const out = [];
  gd.projects.filter(p => !p.deleted).forEach(p => {
    const role = p.myRole;
    if (p.invited) out.push({ id: p.id + "inv", kind: "alert", color: "var(--teal)", icon: "mail", title: `You're invited to ${p.name}`, sub: `As ${p.invitedAs || "editor"} · open it to join`, pid: p.id });
    if (role !== "viewer" && p.due && !p.done) {
      const dleft = dayDiff(today, p.due);
      if (dleft < 0) out.push({ id: p.id + "po", kind: "alert", color: "var(--primary)", icon: "flame", title: `${p.name} is overdue and not finished`, sub: `Was due ${fmtDue(p.due)}`, pid: p.id });
      else if (dleft <= 1) out.push({ id: p.id + "pd", kind: "alert", color: "var(--primary)", icon: "alert", title: `${p.name} is due ${dleft === 0 ? "today" : "tomorrow"} and isn't done`, sub: "Heads up — time to wrap it up.", pid: p.id });
      else if (dleft <= 3) out.push({ id: p.id + "ps", kind: "alert", color: "var(--amber)", icon: "clock", title: `${p.name} is due in ${dleft} days`, sub: `Due ${fmtDue(p.due)}`, pid: p.id });
    }
    p.groups.forEach(g => {
      const overdue = !gC(g) && g.end && g.end < today;
      if (overdue && role !== "viewer") {
        out.push({ id: g.id + "go", kind: "alert", color: "var(--primary)", icon: "alert", title: `${g.name} is overdue`, sub: `${p.name} · was due ${fmtDue(g.end)}`, pid: p.id });
        if (role === "owner") g.members.filter(m => !m.done).forEach(m => out.push({ id: g.id + m.id + "b", kind: "alert", color: "var(--primary)", icon: "flame", title: `${m.name} has fallen behind`, sub: `Hasn't signed off on ${g.name} · ${p.name}`, pid: p.id }));
      }
      if (role !== "viewer") (g.notes || []).forEach((n, i) => out.push({ id: g.id + "n" + i, kind: "activity", color: "var(--teal)", icon: "msg", title: `New comment on ${g.name}`, sub: `"${n.text}" — ${n.by} · ${p.name}`, pid: p.id }));
    });
  });
  const firstProj = gd.projects.find(p => !p.deleted);
  const someName = (() => { for (const p of gd.projects) for (const g of p.groups) if (g.members[0]) return g.members[0].name; return "A teammate"; })();
  if (firstProj) {
    out.push({ id: "dem-email", kind: "activity", color: "var(--teal)", icon: "mail", title: `New email from ${someName}`, sub: `"Quick question about ${firstProj.name}"`, pid: firstProj.id, demo: true });
    out.push({ id: "dem-task", kind: "activity", color: "var(--slate)", icon: "plus", title: `New task added to ${firstProj.name}`, sub: `${someName} created a group`, pid: firstProj.id, demo: true });
    out.push({ id: "dem-date", kind: "activity", color: "var(--amber)", icon: "cal", title: `A task date changed in ${firstProj.name}`, sub: "A group was extended by 3 days", pid: firstProj.id, demo: true });
  }
  return out;
}
function gSample() {
  const t = todayISO();
  return { projects: [
    { id: uid(), name: "Clovers", color: "#E03A3E", due: addDays(t, 16), start: addDays(t, -12), myRole: "owner", code: "CLV24", codeCadence: "month", cascade: false, groups: [
      { id: uid(), name: "Survey", color: "#4FA8E8", desc: "Topographic survey & site boundaries.", start: addDays(t, -12), end: addDays(t, -6), members: [{ id: uid(), name: "Maya Chen", color: "#4FA8E8", done: true }, { id: uid(), name: "Sara Lopez", color: "#9A6BF0", done: true }] },
      { id: uid(), name: "Civil", color: "#E8A53C", desc: "Grading, drainage, foundation prep.", start: addDays(t, -5), end: addDays(t, 2), members: [{ id: uid(), name: "Devon Brooks", color: "#2E80C2", done: false }, { id: uid(), name: "Maya Chen", color: "#4FA8E8", done: true }] },
      { id: uid(), name: "Electrical", color: "#5FD18C", desc: "Rough-in and panel install.", start: addDays(t, 3), end: addDays(t, 9), members: [{ id: uid(), name: "Sara Lopez", color: "#9A6BF0", done: false }] },
    ]},
    { id: uid(), name: "Walmart Remodel", color: "#4FA8E8", due: addDays(t, 78), start: addDays(t, 6), myRole: "editor", code: "WMR78", codeCadence: "month", cascade: false, groups: [
      { id: uid(), name: "Demo", color: "#E0734A", desc: "Interior demolition.", start: addDays(t, 6), end: addDays(t, 16), members: [{ id: uid(), name: "Devon Brooks", color: "#2E80C2", done: false }] },
      { id: uid(), name: "Framing", color: "#C56BD6", desc: "Steel stud framing.", start: addDays(t, 17), end: addDays(t, 38), members: [{ id: uid(), name: "Maya Chen", color: "#4FA8E8", done: false }] },
    ]},
  ] };
}
const ZOOM = { week: { colw: 26 }, month: { colw: 11 }, year: { colw: 4.6 } };
function monthBands(rangeStart, totalDays) {
  const bands = []; let i = 0;
  while (i < totalDays) {
    const d = new Date(addDays(rangeStart, i) + "T00:00:00"); const y = d.getFullYear(), m = d.getMonth();
    let j = i; while (j < totalDays) { const dj = new Date(addDays(rangeStart, j) + "T00:00:00"); if (dj.getFullYear() !== y || dj.getMonth() !== m) break; j++; }
    bands.push({ start: i, end: j, long: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }), short: d.toLocaleDateString(undefined, { month: "short" }) });
    i = j;
  }
  return bands;
}
function dayTicks(rangeStart, totalDays, zoom) {
  const out = [];
  if (zoom === "week") { for (let i = 0; i < totalDays; i++) { const d = new Date(addDays(rangeStart, i) + "T00:00:00"); out.push({ i, label: d.getDate() }); } }
  else if (zoom === "month") { for (let i = 0; i < totalDays; i++) { const d = new Date(addDays(rangeStart, i) + "T00:00:00"); const dn = d.getDate(); if (dn === 1 || dn % 5 === 0) out.push({ i, label: dn }); } }
  return out;
}
function GanttAxis({ rangeStart, totalDays, ppd, zoom, today, LBL }) {
  const bands = monthBands(rangeStart, totalDays);
  const ticks = dayTicks(rangeStart, totalDays, zoom);
  const tIdx = dayDiff(rangeStart, today);
  return (
    <div style={{ display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: LBL, flexShrink: 0, position: "sticky", left: 0, zIndex: 2, background: "var(--panel)", alignSelf: "stretch", borderRight: "1px solid var(--line)" }} />
      <div style={{ position: "relative", width: totalDays * ppd, minWidth: totalDays * ppd, height: 42 }}>
        {bands.map(b => { const w = (b.end - b.start) * ppd; const small = w < 86; return (
          <div key={b.start} style={{ position: "absolute", left: b.start * ppd, width: w, top: 2, height: 17, borderBottom: "1px solid var(--line2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "Fraunces", fontWeight: 600, fontSize: small ? 11 : 13, color: "var(--muted)", whiteSpace: "nowrap", padding: "0 6px", background: "var(--bg)" }}>{small ? b.short : b.long}</span>
          </div>
        ); })}
        {ticks.map(t => <span key={t.i} style={{ position: "absolute", left: t.i * ppd, top: 24, fontSize: 10, color: "var(--dim)", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>{t.label}</span>)}
        {tIdx >= 0 && tIdx < totalDays && <span style={{ position: "absolute", left: tIdx * ppd, top: 21, height: 21, width: 2, background: "var(--teal)", opacity: .4, transform: "translateX(-50%)", borderRadius: 2 }} title="Today" />}
      </div>
    </div>
  );
}
function reschedule(groups, opts) {
  const cascade = !!(opts && opts.cascade);
  const today = todayISO();
  const sorted = [...groups].filter(g => g.start || g.end).sort((a, b) => (a.start || a.end).localeCompare(b.start || b.end));
  const push = {};
  const isComplete = (g) => g.members.length > 0 && g.members.every(m => m.done);
  if (cascade) {
    for (let i = 0; i < sorted.length; i++) {
      const g = sorted[i];
      if (isComplete(g)) continue; // finished groups don't push
      const adjEnd = g.end ? addDays(g.end, push[g.id] || 0) : null;
      const behindBy = (adjEnd && adjEnd < today) ? dayDiff(adjEnd, today) : 0;
      if (behindBy <= 0) continue;
      for (let j = i + 1; j < sorted.length; j++) {
        const t = sorted[j];
        if (isComplete(t)) continue; // don't move finished groups
        const aff = g.affects; // undefined = affect all later, array = only those
        if (aff === undefined || aff.includes(t.id)) push[t.id] = (push[t.id] || 0) + behindBy;
      }
    }
  }
  return sorted.map(g => {
    const complete = isComplete(g);
    const sh = push[g.id] || 0;
    const adjStart = g.start ? addDays(g.start, sh) : null;
    const adjEnd = g.end ? addDays(g.end, sh) : null;
    const behind = !complete && !!adjEnd && adjEnd < today;
    return { ...g, adjStart, adjEnd, complete, behind, slipped: sh > 0 };
  });
}
function remaining(dueISO, nowMs) {
  if (!dueISO) return null;
  const due = new Date(dueISO + "T23:59:59").getTime();
  let diff = due - nowMs; const past = diff < 0; diff = Math.abs(diff);
  const sec = Math.floor(diff / 1000), min = Math.floor(sec / 60), hr = Math.floor(min / 60), day = Math.floor(hr / 24);
  let txt;
  if (day >= 60) txt = `${Math.round(day / 30)} months`;
  else if (day >= 14) txt = `${Math.floor(day / 7)} weeks`;
  else if (day >= 2) txt = `${day} days`;
  else if (hr >= 1) txt = `${hr}h ${min % 60}m`;
  else if (min >= 1) txt = `${min}m ${sec % 60}s`;
  else txt = `${sec}s`;
  return { txt, past, soon: !past && diff < 5 * 86400000 };
}
const ROLE_C = { owner: "#E03A3E", editor: "#4FA8E8", viewer: "#6E83A2" };
const genCode = () => Math.random().toString(36).slice(2, 7).toUpperCase();
const BG_PRESETS = [
  { name: "None", css: "" },
  { name: "Red", css: "rgba(224,58,62,.30)" },
  { name: "Blue", css: "rgba(79,168,232,.30)" },
  { name: "Green", css: "rgba(51,179,107,.30)" },
  { name: "Purple", css: "rgba(154,107,240,.30)" },
  { name: "Amber", css: "rgba(232,165,60,.30)" },
];
function UserAv({ u, size = 32 }) {
  if (u && u.avatar) return <span style={{ width: size, height: size, borderRadius: 9, backgroundImage: `url(${u.avatar})`, backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0, display: "inline-block" }} />;
  return <span className="av" style={{ width: size, height: size, fontSize: size * 0.38, borderRadius: 9, background: (u && u.color) || "#6E83A2" }}>{initials((u && u.name) || "You")}</span>;
}
function Confetti() {
  const cols = ["#E03A3E", "#4FA8E8", "#33B36B", "#E8A53C", "#9A6BF0"];
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200, overflow: "hidden" }}>
      {Array.from({ length: 90 }).map((_, i) => {
        const l = Math.random() * 100, d = 0.7 + Math.random() * 0.9, delay = Math.random() * 0.3, sz = 6 + Math.random() * 8;
        return <span key={i} style={{ position: "absolute", left: l + "%", top: "-12px", width: sz, height: sz * 0.6, background: cols[i % cols.length], borderRadius: 2, transform: `rotate(${Math.random() * 360}deg)`, animation: `conff ${d}s ${delay}s ease-in forwards` }} />;
      })}
    </div>
  );
}

function MemberAv({ m, size = 20 }) {
  return (
    <span style={{ position: "relative", width: size, height: size, borderRadius: 99, background: m.color, display: "inline-grid", placeItems: "center", fontSize: size * 0.4, fontWeight: 700, color: "#fff", flexShrink: 0, overflow: "hidden" }}>
      {initials(m.name)}
      {m.done && <span style={{ position: "absolute", left: "-12%", top: "47%", width: "124%", height: Math.max(2, size * 0.11), background: "#33B36B", transform: "rotate(-45deg)" }} />}
    </span>
  );
}

function GanttView({ ctx }) {
  const { data, user } = ctx;
  const team = data.people;
  const gd = ctx.gantt;
  const setGd = ctx.setGantt;
  const gdRef = useRef(gd);
  useEffect(() => { gdRef.current = gd; }, [gd]);
  const [history, setHistory] = useState([]);
  const canUndo = history.length > 0;
  const undo = () => { if (!history.length) return; const prev = history[history.length - 1]; setHistory(h => h.slice(0, -1)); setGd(g => ({ ...g, projects: prev })); };
  const [openId, setOpenId] = useState(null);
  const [edit, setEdit] = useState(null);
  useEffect(() => { if (ctx.ganttGoto) { setOpenId(ctx.ganttGoto); setWhoFilter("all"); setEdit(null); ctx.clearGanttGoto(); } }, [ctx.ganttGoto]);
  const [zoom, setZoom] = useState("week");
  const [invite, setInvite] = useState(null);
  const [pickSearch, setPickSearch] = useState("");
  const [colorFor, setColorFor] = useState(null);
  const [whoFilter, setWhoFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [joinCode, setJoinCode] = useState("");
  const [joinErr, setJoinErr] = useState("");
  const [joined, setJoined] = useState(null);
  const [presOpen, setPresOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [purgeArm, setPurgeArm] = useState(null);
  const [adjOpen, setAdjOpen] = useState(false);
  const [adjDelta, setAdjDelta] = useState(0);
  const [adjMode, setAdjMode] = useState("none");
  const [adjSel, setAdjSel] = useState([]);
  const [mvStart, setMvStart] = useState(false);
  const [mvEnd, setMvEnd] = useState(true);
  const [cascOpen, setCascOpen] = useState(false);
  const [cascPick, setCascPick] = useState(null);
  const [cascSel, setCascSel] = useState([]);
  useEffect(() => { setAdjOpen(false); setAdjDelta(0); setAdjMode("none"); setAdjSel([]); setMvStart(false); setMvEnd(true); }, [edit && edit.gid]);
  const regenCode = (pid) => patchProject(pid, { code: genCode() });
  const completeProject = (pid, val) => patchProject(pid, { done: val });
  const softDelete = (pid) => patchProject(pid, { deleted: true, deletedAt: Date.now() });
  const restoreProject = (pid) => patchProject(pid, { deleted: false, deletedAt: null });
  const purgeProject = (pid) => setProjects(ps => ps.filter(p => p.id !== pid));
  const tryJoin = () => { const c = joinCode.trim().toUpperCase(); const hit = gd.projects.find(p => (p.code||"").toUpperCase() === c); if (!c) return; if (hit) { setJoinErr(""); setJoinCode(""); setJoined(hit.name); setTimeout(() => setJoined(null), 2600); bumpOpen(hit.id); setOpenId(hit.id); setWhoFilter("all"); } else { setJoinErr("No project with that code (demo)."); } };
  const [hoverGid, setHoverGid] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [dragTip, setDragTip] = useState(null);
  const [barTip, setBarTip] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const hoverTimer = useRef(null);
  const justDragged = useRef(false);
  const dragging = useRef(false);
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const [sx, setSx] = useState({ l: 0, w: 1, c: 1 });
  const syncScroll = () => { const el = scrollRef.current; if (el) setSx({ l: el.scrollLeft, w: el.scrollWidth, c: el.clientWidth }); };
  useEffect(() => { syncScroll(); });
  const dragBar = (clientX) => { const t = trackRef.current, el = scrollRef.current; if (!t || !el) return; const r = t.getBoundingClientRect(); const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width)); el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth); };
  const startBarDrag = (e) => { e.preventDefault(); dragBar(e.clientX); const move = (ev) => dragBar(ev.clientX); const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); }; window.addEventListener("mousemove", move); window.addEventListener("mouseup", up); };
  const openHover = (gid, pos) => { if (dragging.current) return; clearTimeout(hoverTimer.current); if (pos) setHoverPos(pos); setHoverGid(gid); };
  const closeHover = () => { hoverTimer.current = setTimeout(() => setHoverGid(null), 180); };
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    const onWheel = (e) => {
      const canX = el.scrollWidth > el.clientWidth + 1, canY = el.scrollHeight > el.clientHeight + 1;
      if (e.deltaX) { if (canX) { e.preventDefault(); el.scrollLeft += e.deltaX; } return; }
      if (e.shiftKey && canX) { e.preventDefault(); el.scrollLeft += e.deltaY; return; }
      const overChart = (e.clientX - el.getBoundingClientRect().left) > LBL; // right of the labels = chart
      if (overChart && canX) {
        const atStart = el.scrollLeft <= 0, atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
        if (!((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd))) { e.preventDefault(); el.scrollLeft += e.deltaY; return; }
      }
      if (canY) { e.preventDefault(); el.scrollTop += e.deltaY; } // labels area, or chart at its edge → vertical
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { const cutoff = Date.now() - 30 * 86400000; setGd(g => { const keep = g.projects.filter(p => !(p.deleted && p.deletedAt && p.deletedAt < cutoff)); return keep.length === g.projects.length ? g : { ...g, projects: keep }; }); }, []);
  useEffect(() => { if (!openId) return; const p = gdRef.current.projects.find(x => x.id === openId); if (p && p.invited) setGd(g => ({ ...g, projects: g.projects.map(x => x.id === openId ? { ...x, invited: false } : x) })); }, [openId]);

  const setProjects = (fn) => { setHistory(h => [...h.slice(-29), gdRef.current.projects]); setGd(g => ({ ...g, projects: fn(g.projects) })); };
  const patchProject = (pid, patch) => setProjects(ps => ps.map(p => p.id === pid ? { ...p, ...patch } : p));
  const patchGroup = (pid, gid, fn) => setProjects(ps => ps.map(p => p.id !== pid ? p : { ...p, groups: p.groups.map(gr => gr.id === gid ? fn(gr) : gr) }));
  const addProject = () => { const id = uid(); setProjects(ps => [...ps, { id, name: "New project", color: PALETTE[ps.length % PALETTE.length], due: addDays(todayISO(), 30), start: todayISO(), myRole: "owner", code: genCode(), codeCadence: "month", cascade: false, groups: [] }]); setOpenId(id); setEdit({ pid: id }); };
  const delProject = (pid) => { setProjects(ps => ps.filter(p => p.id !== pid)); setEdit(null); setOpenId(null); };
  const addGroup = (pid) => { const id = uid(); const p = gdRef.current.projects.find(x => x.id === pid); const used = new Set((p ? p.groups : []).map(g => g.color)); const color = PALETTE.find(c => !used.has(c)) || PALETTE[(p ? p.groups.length : 0) % PALETTE.length]; setProjects(ps => ps.map(x => x.id !== pid ? x : { ...x, groups: [...x.groups, { id, name: "New group", color, desc: "", start: todayISO(), end: addDays(todayISO(), 5), members: [] }] })); setEdit({ pid, gid: id }); };
  const delGroup = (pid, gid) => { const p = gdRef.current.projects.find(x => x.id === pid); let next = { pid }; if (p) { const idx = p.groups.findIndex(g => g.id === gid); const remaining = p.groups.filter(g => g.id !== gid); if (remaining.length) next = { pid, gid: remaining[Math.max(0, idx - 1)].id }; } setProjects(ps => ps.map(x => x.id !== pid ? x : { ...x, groups: x.groups.filter(g => g.id !== gid) })); setEdit(next); };
  const toggleMember = (pid, gid, mid) => patchGroup(pid, gid, gr => ({ ...gr, members: gr.members.map(m => m.id === mid ? { ...m, done: !m.done } : m) }));
  const addMember = (pid, gid, person) => patchGroup(pid, gid, gr => gr.members.some(m => m.id === person.id) ? gr : ({ ...gr, members: [...gr.members, { id: person.id, name: person.name, color: person.color, done: false }] }));
  const removeMember = (pid, gid, mid) => patchGroup(pid, gid, gr => ({ ...gr, members: gr.members.filter(m => m.id !== mid) }));
  const setMemberColor = (pid, gid, mid, color) => patchGroup(pid, gid, gr => ({ ...gr, members: gr.members.map(m => m.id === mid ? { ...m, color } : m) }));
  const addNote = (pid, gid, text) => { if (!text.trim()) return; patchGroup(pid, gid, gr => ({ ...gr, notes: [...(gr.notes || []), { id: uid(), by: user.name, text: text.trim() }] })); setNoteDraft(""); };
  const delNote = (pid, gid, nid) => patchGroup(pid, gid, gr => ({ ...gr, notes: (gr.notes || []).filter(n => n.id !== nid) }));
  const saveNote = (pid, gid, nid, text) => { patchGroup(pid, gid, gr => ({ ...gr, notes: (gr.notes || []).map(n => n.id === nid ? { ...n, text } : n) })); setEditId(null); };
  const applyAdjust = (pid, gid) => {
    const delta = adjDelta;
    if (delta === 0 || (!mvStart && !mvEnd)) { setAdjOpen(false); return; }
    const p = gdRef.current.projects.find(x => x.id === pid);
    const pStart = (p && p.start) || todayISO();
    const affected = adjMode === "all" ? (p ? p.groups.filter(g => g.id !== gid).map(g => g.id) : []) : adjMode === "choose" ? adjSel : [];
    setProjects(ps => ps.map(pp => pp.id !== pid ? pp : ({ ...pp, groups: pp.groups.map(g => {
      if (g.id === gid) {
        let ns = g.start, ne = g.end;
        if (mvStart && ns) { ns = addDays(ns, delta); if (ns < pStart) ns = pStart; }
        if (mvEnd && ne) ne = addDays(ne, delta);
        if (ns && ne && ne < ns) ne = ns;
        return { ...g, start: ns, end: ne };
      }
      if (affected.includes(g.id)) return { ...g, start: g.start ? addDays(g.start, delta) : g.start, end: g.end ? addDays(g.end, delta) : g.end };
      return g;
    }) })));
    setAdjOpen(false); setAdjDelta(0); setAdjMode("none"); setAdjSel([]); setMvStart(false); setMvEnd(true);
  };

  /* ---------- picker ---------- */
  if (openId !== "__all__" && openId !== "__trash__" && (!openId || !gd.projects.find(p => p.id === openId))) {
    return (
      <>
        <div className="head">
          <div><div className="h-title">Which project today?</div><div className="h-sub">Pick a project to open its timeline.</div></div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={joinCode} onChange={e => { setJoinCode(e.target.value); setJoinErr(""); }} onKeyDown={e => e.key === "Enter" && tryJoin()} placeholder="Join with a code" style={{ width: 130, fontFamily: "Outfit", fontSize: 13, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 10, padding: "8px 11px", background: "var(--panel)", outline: "none", textTransform: "uppercase" }} />
                <button className="btn" onClick={tryJoin}>Join</button>
              </div>
              <div style={{ fontSize: 10.5, color: joinErr ? "var(--primary)" : "var(--dim)", marginTop: 3, textAlign: "center" }}>{joinErr || "demo · try CLV24"}</div>
            </div>
            {gd.projects.some(p => p.deleted) && <button className="btn" onClick={() => setOpenId("__trash__")}><Trash2 size={15} />Trash ({gd.projects.filter(p => p.deleted).length})</button>}
            <button className="btn btn-pri" onClick={addProject}><Plus size={16} />New project</button>
          </div>
        </div>
        {joined && <Confetti />}
        {joined && <div className="toast">🎉 Successfully joined "{joined}"</div>}
        {gd.projects.filter(p => !p.deleted).length > 0 && (
          <div style={{ position: "relative", maxWidth: 320, marginBottom: 14 }}>
            <Search size={15} style={{ position: "absolute", left: 11, top: 10, color: "var(--dim)" }} />
            <input value={pickSearch} onChange={e => setPickSearch(e.target.value)} placeholder="Search projects…" style={{ width: "100%", paddingLeft: 34, fontFamily: "Outfit", fontSize: 13.5, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 11, padding: "9px 12px 9px 34px", background: "var(--panel)", outline: "none" }} />
          </div>
        )}
        {gd.projects.filter(p => !p.deleted).length >= 2 && !pickSearch.trim() && (
          <div className="panel" style={{ cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, borderLeft: "3px solid var(--teal)" }} onClick={() => setOpenId("__all__")}>
            <GanttChartSquare size={22} color="var(--teal)" />
            <div><div style={{ fontFamily: "Fraunces", fontSize: 18, fontWeight: 600 }}>All projects overview</div><div style={{ fontSize: 12.5, color: "var(--muted)" }}>Every project on one big timeline, by due date.</div></div>
            <ChevronRight size={18} style={{ marginLeft: "auto", color: "var(--muted)" }} />
          </div>
        )}
        {(() => { const pickList = gd.projects.filter(p => !p.deleted && (!pickSearch.trim() || p.name.toLowerCase().includes(pickSearch.trim().toLowerCase()))); return (
          gd.projects.filter(p => !p.deleted).length === 0 ? <div className="empty-sm" style={{ padding: 40 }}>No projects yet — create your first one.</div> :
          pickList.length === 0 ? <div className="empty-sm" style={{ padding: 30 }}>No projects match "{pickSearch}".</div> :
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 14 }}>
            {pickList.map(p => {
              const rem = remaining(p.due, now);
              const total = p.groups.length, done = p.groups.filter(g => g.members.length > 0 && g.members.every(m => m.done)).length;
              return (
                <div key={p.id} className="panel" style={{ position: "relative", borderTop: `3px solid ${p.color}`, paddingBottom: 12, ...(p.invited ? { boxShadow: "0 0 0 2px var(--teal)" } : {}) }}>
                  {p.invited && <div style={{ position: "absolute", top: -10, left: 12, zIndex: 4, background: "var(--teal)", color: "#06121e", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 99, boxShadow: "0 3px 10px rgba(0,0,0,.3)" }}>Invited! · {p.invitedAs || "editor"}</div>}
                  {p.done && <div style={{ position: "absolute", inset: 0, background: "rgba(51,179,107,.16)", border: "2px solid var(--done)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, pointerEvents: "none" }}><span style={{ fontFamily: "Fraunces", fontSize: 21, fontWeight: 700, color: "var(--done)", display: "flex", gap: 8, alignItems: "center" }}><CheckCircle2 size={23} />Completed</span></div>}
                  <div style={{ cursor: "pointer" }} onClick={() => { bumpOpen(p.id); setOpenId(p.id); setEdit(null); setWhoFilter("all"); }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 4, background: p.color }} />
                      <span style={{ fontFamily: "Fraunces", fontSize: 19, fontWeight: 600 }}>{p.name}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: ROLE_C[p.myRole], background: ROLE_C[p.myRole] + "22", border: `1px solid ${ROLE_C[p.myRole]}55`, borderRadius: 99, padding: "2px 9px", textTransform: "capitalize" }}>{p.myRole}</span>
                    </div>
                    <div style={{ fontSize: 13, color: (p.due && (rem.past || rem.soon)) ? "var(--primary)" : "var(--muted)", fontWeight: 600 }}>{p.due ? (rem.past ? `Overdue by ${rem.txt}` : `${rem.txt} left`) : "No due date"}</div>
                    <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{done}/{total} groups complete</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end", position: "relative", zIndex: 3 }}>
                    <button className="btn" onClick={(e) => { e.stopPropagation(); completeProject(p.id, !p.done); }} style={{ padding: "9px 14px", fontSize: 13.5, ...(p.done ? { color: "var(--done)", borderColor: "var(--done)" } : {}) }} title={p.done ? "Mark not complete" : "Mark complete"}><Check size={16} />{p.done ? "Completed" : "Complete"}</button>
                    <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); setConfirmDel(p); }} style={{ padding: "9px 13px", color: "#ff8a8c" }} title="Delete project"><X size={19} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        ); })()}
        {confirmDel && (
          <div className="ov" onClick={() => setConfirmDel(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 390 }}>
              <div className="modal-h"><h2>Delete project?</h2><button className="btn btn-ghost icon-btn" onClick={() => setConfirmDel(null)}><X size={18} /></button></div>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5, margin: "0 0 18px" }}>"{confirmDel.name}" will move to Trash. You can restore it within <b style={{ color: "var(--ink)" }}>30 days</b> — after that it's removed for everyone, for good.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn" style={{ flex: 1, justifyContent: "center", padding: "13px" }} onClick={() => setConfirmDel(null)}>Cancel</button>
                <button className="btn" style={{ flex: 1, justifyContent: "center", padding: "13px", background: "var(--primary)", borderColor: "var(--primary)", color: "#fff" }} onClick={() => { softDelete(confirmDel.id); setConfirmDel(null); }}><Trash2 size={16} />Move to trash</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ---------- trash ---------- */
  if (openId === "__trash__") {
    const del = gd.projects.filter(p => p.deleted);
    return (
      <>
        <div className="head">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-sm" onClick={() => setOpenId(null)}><ChevronLeft size={15} />Projects</button>
            <div><div className="h-title">Trash</div><div className="h-sub">Deleted projects are kept for 30 days, then removed for good.</div></div>
          </div>
        </div>
        {del.length === 0 ? <div className="empty-sm" style={{ padding: 40 }}>Trash is empty.</div> :
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
            {del.map(p => {
              const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - (p.deletedAt || Date.now())) / 86400000));
              const armed = purgeArm === p.id;
              return (
                <div key={p.id} className="panel" style={{ borderTop: `3px solid ${p.color}`, opacity: .92 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 4, background: p.color }} />
                    <span style={{ fontFamily: "Fraunces", fontSize: 19, fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: daysLeft <= 5 ? "var(--primary)" : "var(--muted)", fontWeight: 600 }}>Deleted · {daysLeft} {daysLeft === 1 ? "day" : "days"} left to restore</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button className="btn" style={{ flex: 1, justifyContent: "center", padding: "10px" }} onClick={() => { restoreProject(p.id); setPurgeArm(null); }}><RefreshCw size={15} />Restore</button>
                    <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", padding: "10px", color: "#ff8a8c", borderColor: armed ? "#ff8a8c" : undefined }} onClick={() => { if (armed) { purgeProject(p.id); setPurgeArm(null); } else setPurgeArm(p.id); }}><Trash2 size={15} />{armed ? "Tap to confirm" : "Delete forever"}</button>
                  </div>
                </div>
              );
            })}
          </div>}
      </>
    );
  }

  /* ---------- all-projects overview (read-only) ---------- */
  if (openId === "__all__") {
    const Z2 = ZOOM[zoom];
    const list = gd.projects.filter(p => !p.deleted && (roleFilter === "all" || p.myRole === roleFilter));
    const spanOf = (p) => {
      const dd = []; const sc = reschedule(p.groups, { cascade: p.cascade === true });
      if (p.start) dd.push(p.start);
      p.groups.forEach(g => { if (g.start) dd.push(g.start); });
      sc.forEach(g => { if (g.adjEnd) dd.push(g.adjEnd); });
      if (p.due) dd.push(p.due);
      dd.push(todayISO()); dd.sort();
      return { s: dd[0], e: p.due || dd[dd.length - 1], behind: sc.some(g => g.slipped) };
    };
    const rowsData = list.map(p => ({ p, ...spanOf(p) })).sort((a, b) => (a.e || "").localeCompare(b.e || ""));
    const all = []; rowsData.forEach(r => { all.push(r.s); all.push(r.e); }); all.push(todayISO()); all.sort();
    const rs = addDays(all[0] || todayISO(), -2), re = addDays(all[all.length - 1] || todayISO(), 3);
    const td = Math.max(7, dayDiff(rs, re) + 1);
    const ds2 = Array.from({ length: td }, (_, i) => addDays(rs, i));
    const tIdx = dayDiff(rs, todayISO());
    const LBL2 = 180;
    const mLabel = (() => { const a = new Date(rs + "T00:00:00"), b = new Date(re + "T00:00:00"); return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear() ? a.toLocaleDateString(undefined, { month: "long", year: "numeric" }) : `${a.toLocaleDateString(undefined, { month: "short" })} – ${b.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`; })();
    return (
      <>
        <div className="head">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-sm" onClick={() => setOpenId(null)}><ChevronLeft size={15} />Projects</button>
            <div><div className="h-title">All projects</div><div className="h-sub">Each project by its due date. Read-only.</div></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select className="btn" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} title="Filter by your role">
              <option value="all">All roles</option><option value="owner">Owner</option><option value="editor">Editor</option><option value="viewer">Viewer</option>
            </select>
            <select className="btn" value={zoom} onChange={e => setZoom(e.target.value)}>
              <option value="week">Range: Week</option><option value="month">Range: Month</option><option value="year">Range: Year</option>
            </select>
            {zoom === "year" && (() => { const ys = new Date(rs + "T00:00:00").getFullYear(), ye = new Date(re + "T00:00:00").getFullYear(); if (ye <= ys) return null; const yrs = []; for (let y = ys; y <= ye; y++) yrs.push(y); return (
              <select className="btn btn-sm" defaultValue="all" onChange={e => { const el = scrollRef.current; if (!el) return; if (e.target.value === "all") el.scrollTo({ left: 0, behavior: "smooth" }); else el.scrollTo({ left: Math.max(0, dayDiff(rs, `${e.target.value}-01-01`) * Z2.colw), behavior: "smooth" }); }} title="Jump to a year">
                <option value="all">Show all</option>{yrs.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            ); })()}
          </div>
        </div>
        <div className="gantt-wrap" style={{ position: "relative" }}>
          <button className="navarrow" onClick={() => { const el = scrollRef.current; if (el) el.scrollBy({ left: -el.clientWidth * 0.7, behavior: "smooth" }); }} style={{ left: 6 }} title="Back"><ChevronLeft size={18} /></button>
          <button className="navarrow" onClick={() => { const el = scrollRef.current; if (el) el.scrollBy({ left: el.clientWidth * 0.7, behavior: "smooth" }); }} style={{ right: 6 }} title="Forward"><ChevronRight size={18} /></button>
          <div className="gantt-scroll" ref={scrollRef}>
            <div className="gantt-grid" style={{ minWidth: LBL2 + td * Z2.colw }}>
              <GanttAxis rangeStart={rs} totalDays={td} ppd={Z2.colw} zoom={zoom} today={todayISO()} LBL={LBL2} />
              <div style={{ position: "relative", minHeight: Math.max(5, rowsData.length) * 64 }}>
                {tIdx >= 0 && tIdx < td && <div style={{ position: "absolute", top: 0, bottom: 0, left: LBL2 + tIdx * Z2.colw + Z2.colw / 2, width: 2, background: "var(--teal)", zIndex: 4 }} />}
                {rowsData.map(r => {
                  const sIdx = dayDiff(rs, r.s), w = (dayDiff(r.s, r.e) + 1) * Z2.colw;
                  return (
                    <div className="gantt-row" key={r.p.id} style={{ height: 64 }}>
                      <div className="gantt-lbl" style={{ width: LBL2, flexBasis: LBL2, display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 99, background: ROLE_C[r.p.myRole], flexShrink: 0 }} title={r.p.myRole} />{r.p.name}
                      </div>
                      <div className="gantt-track">
                        <div className="gantt-bar" style={{ left: Math.max(0, sIdx) * Z2.colw, width: Math.max(10, w - 2), background: r.p.color, top: 16, height: 32, fontSize: 13.5, cursor: "default" }} title={`${r.p.name} · due ${fmtDue(r.p.due)}`}>
                          {w > 80 && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.p.name}{r.p.done ? " ✓" : ""}</span>}
                          {r.behind && <span style={{ marginLeft: "auto", flexShrink: 0 }}><Flame size={13} /></span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {rowsData.length === 0 && <div className="empty-sm" style={{ padding: 30 }}>No projects match that role.</div>}
              </div>
            </div>
          </div>
          <div className="foot-note" style={{ marginTop: 12, justifyContent: "flex-start" }}><Sparkles size={12} /> Your projects by due date · sort with the role filter. Light-blue line = today.</div>
        </div>
      </>
    );
  }

  /* ---------- timeline ---------- */
  const proj = gd.projects.find(p => p.id === openId);
  const role = proj.myRole;
  const isOwner = role === "owner";
  const canOpen = role !== "viewer";          // open editor, sign off, add people, edit desc/member color
  const rem = remaining(proj.due, now);
  const Z = ZOOM[zoom];
  const projMembers = (() => { const seen = {}; const out = []; proj.groups.forEach(g => g.members.forEach(m => { if (!seen[m.id]) { seen[m.id] = 1; out.push(m); } })); return out; })();

  const schedFull = reschedule(proj.groups, { cascade: proj.cascade === true });
  const behind = schedFull.some(g => g.behind);
  const sched = (whoFilter !== "all") ? schedFull.filter(g => g.members.some(m => m.id === whoFilter)) : schedFull;

  const today = todayISO();
  const projStart = proj.start || (proj.groups.reduce((m, g) => (g.start && (!m || g.start < m)) ? g.start : m, null)) || today;
  const ds = [projStart, today];
  sched.forEach(g => { if (g.adjEnd) ds.push(g.adjEnd); if (g.end) ds.push(g.end); });
  if (proj.due) ds.push(proj.due);
  ds.sort();
  const rangeStart = addDays(projStart < ds[0] ? projStart : ds[0], -2);
  const rangeEnd = addDays(ds[ds.length - 1], 3);
  const totalDays = Math.min(4000, Math.max(7, dayDiff(rangeStart, rangeEnd) + 1 || 7));
  const days = Array.from({ length: totalDays }, (_, i) => addDays(rangeStart, i));
  const todayIdx = dayDiff(rangeStart, today);
  const dueIdx = proj.due ? dayDiff(rangeStart, proj.due) : -1;
  const LBL = 180, ROWH = 46;
  const rows = (whoFilter !== "all") ? Math.max(1, sched.length) : Math.max(6, sched.length);
  const emptyRows = Math.max(0, rows - sched.length);
  const trackH = rows * ROWH;

  const editTarget = edit ? (() => { const p = gd.projects.find(x => x.id === edit.pid); if (!p) return null; return { p, g: edit.gid ? p.groups.find(x => x.id === edit.gid) : null }; })() : null;
  const setRole = (r) => patchProject(proj.id, { myRole: r });
  const startDrag = (e, g) => {
    if (!isOwner) return;
    e.preventDefault();
    dragging.current = true; clearTimeout(hoverTimer.current); setHoverGid(null);
    setHistory(h => [...h.slice(-29), gdRef.current.projects]);
    const colw = ZOOM[zoom].colw, startX = e.clientX, oS = g.start, oE = g.end, gid = g.id, pid = proj.id;
    const floorDelta = oS ? dayDiff(oS, projStart) : -99999; // start can't go before project start
    let last = 0, moved = false;
    setDragTip({ x: e.clientX, y: e.clientY, s: oS, e: oE });
    const move = (ev) => {
      let delta = Math.round((ev.clientX - startX) / colw);
      if (delta < floorDelta) delta = floorDelta;
      const ns = oS ? addDays(oS, delta) : oS, ne = oE ? addDays(oE, delta) : oE;
      setDragTip({ x: ev.clientX, y: ev.clientY, s: ns, e: ne });
      if (delta === last) return;
      last = delta; if (delta !== 0) moved = true;
      setGd(gg => ({ ...gg, projects: gg.projects.map(p => p.id !== pid ? p : { ...p, groups: p.groups.map(gr => gr.id !== gid ? gr : { ...gr, start: ns, end: ne }) }) }));
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); dragging.current = false; setDragTip(null); if (moved) { justDragged.current = true; setTimeout(() => { justDragged.current = false; }, 60); } };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  };
  const scrollChart = (dir) => { const el = scrollRef.current; if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" }); };
  const yearsInRange = (() => { const out = []; const ys = new Date(rangeStart + "T00:00:00").getFullYear(), ye = new Date(rangeEnd + "T00:00:00").getFullYear(); for (let y = ys; y <= ye; y++) out.push(y); return out; })();
  const jumpYear = (y) => { const el = scrollRef.current; if (!el) return; if (y === "all") { el.scrollTo({ left: 0, behavior: "smooth" }); return; } el.scrollTo({ left: Math.max(0, dayDiff(rangeStart, `${y}-01-01`) * Z.colw), behavior: "smooth" }); };
  const scrollToToday = () => { const el = scrollRef.current; if (!el) return; const x = LBL + todayIdx * Z.colw + Z.colw / 2 - el.clientWidth / 2; el.scrollTo({ left: Math.max(0, x), behavior: "smooth" }); };
  const exportGantt = () => {
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const ppd = 24;
    const starts = sched.map(g => g.adjStart).filter(Boolean);
    const ends = sched.map(g => g.adjEnd).filter(Boolean);
    let exStart = proj.start || today; starts.forEach(s => { if (s < exStart) exStart = s; });
    let exEnd = proj.due || today; ends.forEach(e => { if (e > exEnd) exEnd = e; });
    exStart = addDays(exStart, -2); exEnd = addDays(exEnd, 2);
    const tot = Math.max(1, dayDiff(exStart, exEnd) + 1), W = tot * ppd;
    const tIdx = dayDiff(exStart, today), dIdx = proj.due ? dayDiff(exStart, proj.due) : -1;
    const allM = sched.reduce((a, g) => a + g.members.length, 0);
    const doneM = sched.reduce((a, g) => a + g.members.filter(m => m.done).length, 0);
    const grpDone = sched.filter(g => g.complete).length;
    const pct = allM ? Math.round(doneM / allM * 100) : (sched.length ? Math.round(grpDone / sched.length * 100) : 0);
    const months = monthBands(exStart, tot).map(b => `<div class="mb" style="left:${b.start * ppd}px;width:${(b.end - b.start) * ppd}px">${esc(b.long)}</div>`).join("");
    const rows = sched.map(g => {
      const s = g.adjStart, e = g.adjEnd; const left = s ? dayDiff(exStart, s) * ppd : 0; const w = (s && e) ? (dayDiff(s, e) + 1) * ppd : ppd;
      const done = g.members.filter(m => m.done).length; const color = g.complete ? "#33B36B" : (g.color || proj.color);
      const who = g.members.map(m => esc(m.name) + (m.done ? " \u2713" : "")).join(", ") || "\u2014";
      return `<div class="row"><div class="lbl"><b>${esc(g.name)}</b><span class="sub">${fmtDue(s)}\u2013${fmtDue(e)} \u00b7 ${done}/${g.members.length} signed off \u00b7 ${who}</span></div><div class="track"><div class="bar" style="left:${left}px;width:${Math.max(8, w - 2)}px;background:${color}">${esc(g.name)}</div></div></div>`;
    }).join("");
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(proj.name)} \u2014 Gantt</title>
<style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;margin:0;background:#0E131B;color:#E8EDF4;padding:28px}
h1{font-size:23px;margin:0 0 4px}.meta{color:#9AA7B8;font-size:13px;margin-bottom:8px}
.prog{height:9px;background:#243042;border-radius:99px;max-width:420px;margin-bottom:20px;overflow:hidden}.prog>i{display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,#33B36B,#57d18c)}
.scroll{overflow-x:auto;border:1px solid #243042;border-radius:14px;padding:14px;background:#141B26}
.axis{position:relative;height:22px;margin-left:240px;width:${W}px;border-bottom:1px solid #2A3647}.mb{position:absolute;top:0;font-size:12px;color:#9AA7B8;border-left:1px solid #2A3647;padding-left:6px;font-weight:600;white-space:nowrap}
.body{position:relative;margin-top:6px}
.row{display:flex;align-items:center;height:44px}
.lbl{width:240px;flex:0 0 240px;padding-right:12px;font-size:13px;display:flex;flex-direction:column;gap:2px}
.lbl .sub{color:#9AA7B8;font-size:10.5px;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.track{position:relative;flex:1;height:100%}
.bar{position:absolute;top:10px;height:23px;border-radius:6px;color:#fff;font-size:11px;font-weight:600;display:flex;align-items:center;padding:0 8px;overflow:hidden;white-space:nowrap;box-shadow:0 2px 5px rgba(0,0,0,.3)}
.foot{color:#6B7888;font-size:11px;margin-top:14px}@media print{body{background:#fff;color:#000}.scroll{border-color:#ccc;background:#fff}}</style></head>
<body><h1>${esc(proj.name)}</h1><div class="meta">${proj.due ? "Due " + fmtDue(proj.due) + " \u00b7 " : ""}${sched.length} groups \u00b7 ${pct}% complete \u00b7 exported ${fmtDue(today)} from Cadence</div>
<div class="prog"><i></i></div>
<div class="scroll"><div class="axis">${months}</div><div class="body" style="width:${240 + W}px">
${tIdx >= 0 && tIdx < tot ? `<div style="position:absolute;left:${240 + tIdx * ppd + ppd / 2}px;top:0;bottom:0;width:2px;background:#4FA8E8;z-index:2"></div>` : ""}
${dIdx >= 0 ? `<div style="position:absolute;left:${240 + dIdx * ppd + ppd / 2}px;top:0;bottom:0;border-left:2px dashed #E03A3E;z-index:2"></div>` : ""}
${rows}</div></div>
<div class="foot">Blue line = today, red dashed = project due. Use your browser's Print \u2192 Save as PDF to keep a copy.</div></body></html>`;
    const w = window.open("", "_blank");
    if (w && w.document) { w.document.open(); w.document.write(html); w.document.close(); }
    else { const b = new Blob([html], { type: "text/html" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `${proj.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}-gantt.html`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1500); }
  };

  return (
    <>
      {dragTip && <div style={{ position: "fixed", left: dragTip.x + 14, top: dragTip.y - 14, zIndex: 90, pointerEvents: "none", background: "var(--ink)", color: "var(--bg)", fontSize: 11.5, fontWeight: 700, padding: "4px 8px", borderRadius: 7, whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(0,0,0,.3)" }}>{fmtDue(dragTip.s)}{dragTip.e ? ` → ${fmtDue(dragTip.e)}` : ""}</div>}
      {barTip && <div style={{ position: "fixed", left: barTip.x, top: barTip.y - 10, transform: "translate(-50%,-100%)", zIndex: 95, pointerEvents: "none", background: "var(--panel2)", border: "1px solid var(--line2)", borderRadius: 11, padding: "9px 12px", boxShadow: "0 12px 32px rgba(0,0,0,.45)", maxWidth: 280 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 800, color: barTip.color, marginBottom: barTip.items.length ? 5 : 0 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: barTip.color }} />{barTip.title}</div>
        {barTip.items.length > 0 ? <div style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.5 }}>{barTip.items.join(", ")}</div> : <div style={{ fontSize: 11.5, color: "var(--dim)" }}>Nothing here.</div>}
      </div>}
      {invite && (
        <div className="ov" onClick={() => setInvite(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-h"><h2>Invite to {proj.name}</h2><button className="btn btn-ghost icon-btn" onClick={() => setInvite(null)}><X size={18} /></button></div>
            <div className="fld"><label>Their email</label><input type="email" value={invite.email} onChange={e => setInvite(v => ({ ...v, email: e.target.value }))} placeholder="name@company.com" autoFocus /></div>
            <div className="fld"><label>Role</label>
              <div className="mode-pick">
                <button className={invite.role === "editor" ? "on" : ""} onClick={() => setInvite(v => ({ ...v, role: "editor" }))}>Editor</button>
                <button className={invite.role === "viewer" ? "on" : ""} onClick={() => setInvite(v => ({ ...v, role: "viewer" }))}>Viewer</button>
                <button className={invite.role === "owner" ? "on" : ""} onClick={() => setInvite(v => ({ ...v, role: "owner" }))}>Owner</button>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 6 }}>Editors can add people, sign off, and edit descriptions. Viewers can only look. Owners can do everything.</div>
            </div>
            <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} disabled={!invite.email.trim()} onClick={() => { patchProject(proj.id, { invited: true, invitedAs: invite.role, invitedEmail: invite.email.trim() }); setInvite(null); }}><Send size={15} />Send invite</button>
            <div className="login-foot" style={{ marginTop: 10 }}>They'll get an invite in their Inbox and a highlighted "Invited!" tag on the project until they open it. Real invites send by email once accounts are on — for now this previews how it looks.</div>
          </div>
        </div>
      )}
      <div className="head">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button className="btn btn-sm" onClick={() => { setOpenId(null); setEdit(null); }}><ChevronLeft size={15} />Projects</button>
          <div>
            <div className="h-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>{proj.name}
              {behind && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", background: "rgba(224,58,62,.16)", border: "1px solid #E03A3E55", borderRadius: 99, padding: "3px 9px" }}><Flame size={11} style={{ verticalAlign: "-1px" }} /> behind</span>}
            </div>
            <div className="h-sub">{proj.due ? <span style={{ color: (rem.past || rem.soon) ? "var(--primary)" : "var(--muted)", fontWeight: 600 }}>{rem.past ? `Overdue by ${rem.txt}` : `${rem.txt} left`} · due {fmtDue(proj.due)}</span> : "No due date set"}</div>
            {(() => {
              const N = sched.length;
              const done = sched.filter(g => g.complete);
              const late = sched.filter(g => !g.complete && g.behind);
              const remain = sched.filter(g => !g.complete && !g.behind);
              const pct = N ? Math.round(done.length / N * 100) : 0;
              const ends = sched.map(g => g.adjEnd).filter(Boolean);
              const newEnd = ends.length ? ends.reduce((a, b) => b > a ? b : a) : proj.due;
              const isLate = proj.due && newEnd && newEnd > proj.due;
              const w = (arr) => N ? (arr.length / N * 100) : 0;
              const names = (arr) => arr.map(g => g.name);
              const daysLate = isLate ? dayDiff(proj.due, newEnd) : 0;
              const seg = (title, color, arr) => ({
                onMouseEnter: (e) => setBarTip({ x: e.clientX, y: e.currentTarget.getBoundingClientRect().top, title: `${title} (${arr.length})`, color, items: names(arr) }),
                onMouseMove: (e) => setBarTip(t => t ? { ...t, x: e.clientX } : t),
                onMouseLeave: () => setBarTip(null),
              });
              return (
                <div style={{ marginTop: 8, maxWidth: 380 }}>
                  <div style={{ display: "flex", height: 9, background: "var(--raise)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--line)" }}>
                    {done.length > 0 && <div {...seg("Completed", "var(--done)", done)} style={{ width: w(done) + "%", background: "var(--done)", cursor: "default" }} />}
                    {remain.length > 0 && <div {...seg("Still to do", "var(--muted)", remain)} style={{ width: w(remain) + "%", background: "var(--line2)", cursor: "default" }} />}
                    {late.length > 0 && <div {...seg("Behind — holding things up", "var(--primary)", late)} style={{ width: w(late) + "%", background: "var(--primary)", cursor: "default" }} />}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "var(--muted)" }}>
                    <span style={{ fontWeight: 700 }}>{done.length}/{N} groups · {pct}%</span>
                    {N === 0 ? null : isLate
                      ? <span style={{ color: "var(--primary)", fontWeight: 700 }}>expected {fmtDue(newEnd)} · {daysLate}d late</span>
                      : <span>expected {fmtDue(newEnd)}</span>}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {canOpen && proj.codeCadence !== "off" && <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--teal)", background: "rgba(79,168,232,.14)", border: "1px solid #4FA8E855", borderRadius: 8, padding: "4px 9px", letterSpacing: "1px" }} title="Invite code (demo)">#{proj.code}</span>}
              <span style={{ fontSize: 12, fontWeight: 700, color: ROLE_C[role], background: ROLE_C[role] + "22", border: `1px solid ${ROLE_C[role]}55`, borderRadius: 99, padding: "5px 12px", textTransform: "capitalize" }}>You're {role}</span>
              {/* demo presence: your avatar, hover for everyone */}
              <div className="pres dotwrap" style={{ position: "relative" }} onMouseEnter={() => setPresOpen(true)} onMouseLeave={() => setPresOpen(false)}>
                <div style={{ position: "relative", cursor: "default" }}>
                  <UserAv u={user} size={32} />
                  <span className="sdot" style={{ background: (user.presence === "offline") ? "#E03A3E" : "#33B36B" }} />
                </div>
                {presOpen && (
                  <div className="pres-menu">
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: ".5px", padding: "4px 9px 6px" }}>On this project · demo</div>
                    <div className="pres-row"><div className="dotwrap" style={{ position: "relative" }}><UserAv u={user} size={26} /><span className="sdot" style={{ background: (user.presence === "offline") ? "#E03A3E" : "#33B36B" }} /></div><span style={{ flex: 1 }}>{user.name} (you)</span></div>
                    {projMembers.map((m, i) => { const st = ["#33B36B", "#E8A53C", "#E03A3E"][i % 3]; return (
                      <div className="pres-row" key={m.id}><div className="dotwrap" style={{ position: "relative" }}><MemberAv m={{ ...m, done: false }} size={26} /><span className="sdot" style={{ background: st }} /></div><span style={{ flex: 1 }}>{m.name}</span></div>
                    ); })}
                    <div style={{ fontSize: 10, color: "var(--dim)", padding: "6px 9px 2px", display: "flex", gap: 10 }}><span>🟢 online</span><span>🟡 idle</span><span>🔴 off</span></div>
                  </div>
                )}
              </div>
            </div>
            <select className="btn btn-sm" value={role} onChange={e => setRole(e.target.value)} title="Demo: view as a different role">
              <option value="owner">view as Owner</option><option value="editor">view as Editor</option><option value="viewer">view as Viewer</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <select className="btn" value={zoom} onChange={e => setZoom(e.target.value)} title="Time range">
          <option value="week">Range: Week</option><option value="month">Range: Month</option><option value="year">Range: Year</option>
        </select>
        {zoom === "year" && yearsInRange.length > 1 && (
          <select className="btn btn-sm" defaultValue="all" onChange={e => jumpYear(e.target.value)} title="Jump to a year">
            <option value="all">Show all</option>
            {yearsInRange.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        <select className="btn" value={whoFilter} onChange={e => setWhoFilter(e.target.value)} title="Who's on this project">
          <option value="all">Everyone on this project</option>
          {projMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button className="btn" onClick={scrollToToday} title="Jump to today"><CalendarDays size={14} />Today</button>
        <button className="btn" onClick={exportGantt} title="Save this Gantt chart as a file"><Download size={14} />Export</button>
        {canOpen && (
          <div style={{ position: "relative" }}>
            <button className="btn" onClick={() => { setCascPick(null); setCascOpen(o => !o); }} title="What happens when a group runs late">
              <Flame size={14} color={proj.cascade === true ? "var(--primary)" : "var(--dim)"} />Late-push: {proj.cascade === true ? "On" : "Off"}<ChevronDown size={13} />
            </button>
            {cascOpen && (() => {
              const ruled = proj.groups.filter(g => g.affects !== undefined);
              const pickG = cascPick ? proj.groups.find(g => g.id === cascPick) : null;
              const nm = (id) => proj.groups.find(g => g.id === id)?.name || "?";
              return (
                <div style={{ position: "absolute", top: 42, left: 0, zIndex: 40, width: 290, background: "var(--panel2)", border: "1px solid var(--line2)", borderRadius: 14, padding: 12, boxShadow: "0 20px 50px rgba(0,0,0,.5)" }}>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.4, marginBottom: 10 }}>When a group runs late, later groups get pushed back the same number of days (shown as a dotted "original plan").</div>
                  <label className="btn" style={{ width: "100%", justifyContent: "space-between", cursor: isOwner ? "pointer" : "default" }} onClick={() => isOwner && patchProject(proj.id, { cascade: !(proj.cascade === true) })}>
                    <span>Auto-push late groups</span>
                    <span className="rcp-box" style={{ width: 18, height: 18, ...(proj.cascade === true ? { background: "var(--primary)", borderColor: "var(--primary)" } : {}) }}>{proj.cascade === true && <Check size={12} />}</span>
                  </label>

                  {proj.cascade === true && isOwner && !pickG && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", margin: "13px 0 6px" }}>Set what each group pushes</div>
                      <div style={{ fontSize: 10.5, color: "var(--dim)", marginBottom: 6 }}>Click a group to choose which others it pushes when it's late. Default = pushes all later groups.</div>
                      <div style={{ maxHeight: 150, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: 6 }}>
                        {proj.groups.length === 0 && <div className="empty-sm" style={{ padding: "6px 0" }}>No groups yet.</div>}
                        {proj.groups.map(g => { const custom = g.affects !== undefined; return (
                          <div key={g.id} onClick={() => { setCascPick(g.id); setCascSel(g.affects || []); }} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 6px", cursor: "pointer", borderRadius: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color || proj.color }} />
                            <span style={{ flex: 1, fontSize: 13 }}>{g.name}</span>
                            <span style={{ fontSize: 10.5, color: custom ? "var(--teal)" : "var(--dim)", fontWeight: custom ? 700 : 500 }}>{custom ? (g.affects.length ? `pushes ${g.affects.length}` : "pushes none") : "pushes all"}</span>
                            <ChevronRight size={13} color="var(--dim)" />
                          </div>
                        ); })}
                      </div>
                      {ruled.length > 0 && (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", margin: "13px 0 6px" }}>Saved rules</div>
                          {ruled.map(g => (
                            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 12 }}>
                              <span onClick={() => { setCascPick(g.id); setCascSel(g.affects || []); }} style={{ flex: 1, cursor: "pointer", fontWeight: 600, color: "var(--teal)" }}>{g.name}</span>
                              <span style={{ color: "var(--dim)", fontSize: 11 }}>{g.affects.length ? `→ ${g.affects.map(nm).join(", ")}` : "→ pushes none"}</span>
                              <button className="btn btn-ghost icon-btn" style={{ width: 22, height: 22 }} title="Remove rule" onClick={() => patchGroup(proj.id, g.id, gr => { const { affects, ...rest } = gr; return rest; })}><X size={12} /></button>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}

                  {proj.cascade === true && isOwner && pickG && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "13px 0 6px" }}>
                        <button className="btn btn-ghost icon-btn" style={{ width: 24, height: 24 }} onClick={() => setCascPick(null)}><ChevronLeft size={14} /></button>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>When <span style={{ color: "var(--teal)" }}>{pickG.name}</span> is late, push:</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--dim)", marginBottom: 6 }}>Pick groups, or save with none = it won't move anyone.</div>
                      <div style={{ maxHeight: 150, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: 6 }}>
                        {proj.groups.filter(g => g.id !== pickG.id).map(g => { const on = cascSel.includes(g.id); return (
                          <div key={g.id} onClick={() => setCascSel(s => on ? s.filter(x => x !== g.id) : [...s, g.id])} style={{ display: "flex", alignItems: "center", gap: 9, padding: 6, cursor: "pointer", borderRadius: 8, background: on ? "var(--raise)" : "transparent" }}>
                            <span className="rcp-box" style={{ width: 16, height: 16, ...(on ? { background: "var(--teal)", borderColor: "var(--teal)" } : {}) }}>{on && <Check size={11} />}</span>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color || proj.color }} />
                            <span style={{ fontSize: 13 }}>{g.name}</span>
                          </div>
                        ); })}
                        {proj.groups.length <= 1 && <div className="empty-sm" style={{ padding: "6px 0" }}>No other groups.</div>}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button className="btn btn-pri btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => { patchGroup(proj.id, pickG.id, gr => ({ ...gr, affects: cascSel })); setCascPick(null); }}><Check size={14} />Save</button>
                        <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => { patchGroup(proj.id, pickG.id, gr => { const { affects, ...rest } = gr; return rest; }); setCascPick(null); }}>Use default (all)</button>
                      </div>
                    </>
                  )}
                  {!isOwner && <div style={{ fontSize: 10.5, color: "var(--dim)", marginTop: 8 }}>Only the owner can change this.</div>}
                </div>
              );
            })()}
          </div>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn" onClick={undo} disabled={!canUndo} style={{ opacity: canUndo ? 1 : .4, cursor: canUndo ? "pointer" : "default" }}><RotateCcw size={14} />Undo</button>
        {isOwner && <button className="btn" onClick={() => setInvite({ email: "", role: "editor" })}><Plus size={14} />Invite</button>}
      </div>
      {whoFilter !== "all" && (
        <div className="foot-note" style={{ justifyContent: "flex-start", marginBottom: 10 }}>
          Showing only {projMembers.find(m => m.id === whoFilter)?.name || ""}'s groups.
          <button className="btn btn-ghost btn-sm" onClick={() => setWhoFilter("all")} style={{ marginLeft: 8 }}>show all</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div className="gantt-wrap" style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <button className="navarrow" onClick={() => scrollChart(-1)} style={{ left: LBL + 22 }} title="Back"><ChevronLeft size={18} /></button>
          <button className="navarrow" onClick={() => scrollChart(1)} style={{ right: 6 }} title="Forward"><ChevronRight size={18} /></button>
          <div className="gantt-scroll nobar" ref={scrollRef} onScroll={syncScroll} style={{ maxHeight: "62vh", overflow: "auto" }}>
            <div className="gantt-grid" style={{ minWidth: LBL + totalDays * Z.colw }}>
              <div style={{ position: "sticky", top: 0, zIndex: 7, background: "var(--panel)" }}>
                <GanttAxis rangeStart={rangeStart} totalDays={totalDays} ppd={Z.colw} zoom={zoom} today={today} LBL={LBL} />
              </div>
              <div style={{ position: "relative", minHeight: trackH }}>
                {/* horizontal row grid (behind) */}
                <div style={{ position: "absolute", left: LBL, top: 0, bottom: 0, width: totalDays * Z.colw, zIndex: 0, pointerEvents: "none", backgroundImage: `repeating-linear-gradient(to bottom, var(--line) 0 1px, transparent 1px ${ROWH}px)`, opacity: .35 }} />
                {/* vertical day grid (above bars so it's continuous) */}
                <div style={{ position: "absolute", left: LBL, top: 0, bottom: 0, width: totalDays * Z.colw, zIndex: 3, pointerEvents: "none", backgroundImage: `repeating-linear-gradient(to right, var(--line) 0 1px, transparent 1px ${(zoom === "week" ? 1 : zoom === "month" ? 7 : 30) * Z.colw}px)`, opacity: .28 }} />
                {todayIdx >= 0 && todayIdx < totalDays && (
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: LBL + todayIdx * Z.colw + Z.colw / 2, width: 2, background: "var(--teal)", zIndex: 4 }}>
                    <span style={{ position: "absolute", top: -1, left: 4, fontSize: 9, fontWeight: 800, color: "var(--teal)", background: "var(--panel)", padding: "0 4px", borderRadius: 4, whiteSpace: "nowrap" }}>today</span>
                  </div>
                )}
                {/* project due line (red) */}
                {dueIdx >= 0 && dueIdx < totalDays && (
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: LBL + dueIdx * Z.colw + Z.colw / 2, width: 0, borderLeft: "2px dashed var(--primary)", zIndex: 4 }}>
                    <span style={{ position: "absolute", top: -16, left: 4, fontSize: 9.5, fontWeight: 700, color: "var(--primary)", whiteSpace: "nowrap" }}>due</span>
                  </div>
                )}
                {sched.map(g => {
                  const gColor = g.color || proj.color;
                  const r = g.adjStart && g.adjEnd ? { s: g.adjStart < g.adjEnd ? g.adjStart : g.adjEnd, e: g.adjEnd > g.adjStart ? g.adjEnd : g.adjStart } : null;
                  const startIdx = r ? dayDiff(rangeStart, r.s) : 0;
                  const span = r ? dayDiff(r.s, r.e) + 1 : 0;
                  const vis = r && startIdx + span > 0 && startIdx < totalDays;
                  let ghost = null;
                  if (g.slipped && g.start && g.end) { const gs = dayDiff(rangeStart, g.start); ghost = { l: gs, w: dayDiff(g.start, g.end) + 1 }; }
                  const doneCount = g.members.filter(m => m.done).length;
                  const wide = span * Z.colw;
                  const tip = `${g.name}${g.desc ? " — " + g.desc : ""}\n${fmtDue(r ? r.s : g.start)}–${fmtDue(r ? r.e : g.end)} · ${doneCount}/${g.members.length} signed off`;
                  return (
                    <div className="gantt-row" key={g.id}>
                      <div className="gantt-lbl" style={{ width: LBL, flexBasis: LBL }} title={tip}>{g.name}</div>
                      <div className="gantt-track">
                        {ghost && <div style={{ position: "absolute", top: 13, left: ghost.l * Z.colw, width: Math.max(2, ghost.w * Z.colw - 2), height: 20, borderRadius: 5, border: `1px dashed ${gColor}`, opacity: .5 }} />}
                        {vis && (
                          <div className={`gantt-bar ${g.complete ? "done" : ""}`} style={{ left: startIdx * Z.colw, width: Math.max(6, wide - 2), background: g.complete ? "var(--done)" : gColor, opacity: 1, gap: 4, cursor: isOwner ? "grab" : (canOpen ? "pointer" : "default") }}
                            onMouseDown={(e) => startDrag(e, g)}
                            onClick={() => { if (justDragged.current) return; if (canOpen) setEdit({ pid: proj.id, gid: g.id }); }}
                            onMouseEnter={(e) => { const rr = e.currentTarget.getBoundingClientRect(); openHover(g.id, { x: rr.left, y: rr.bottom }); }}
                            onMouseLeave={closeHover}>
                            {wide > 60 && g.members.slice(0, 3).map(m => <MemberAv key={m.id} m={m} size={16} />)}
                            {wide > 90 && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}{g.complete ? " ✓" : ""}</span>}
                            {(g.notes && g.notes.length > 0) && <span style={{ marginLeft: "auto", width: 9, height: 9, borderRadius: 99, background: "#fff", boxShadow: "0 0 0 2px rgba(0,0,0,.22)", flexShrink: 0 }} />}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {Array.from({ length: emptyRows }).map((_, i) => (
                  <div className="gantt-row" key={"e" + i}>
                    <div className="gantt-lbl" style={{ width: LBL, flexBasis: LBL, color: "var(--dim)", fontWeight: 400 }}>{sched.length === 0 && i === 0 ? "— no groups yet —" : ""}</div>
                    <div className="gantt-track" style={{ borderTop: "1px dashed var(--line)", opacity: .35 }} />
                  </div>
                ))}
                {hoverGid && (() => {
                  const hg = proj.groups.find(x => x.id === hoverGid);
                  if (!hg) return null;
                  const notes = hg.notes || [];
                  const px = Math.max(8, Math.min(hoverPos.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 262));
                  return (
                    <div className="note-pop" style={{ position: "fixed", left: px, top: hoverPos.y + 6 }} onMouseEnter={() => openHover(hg.id)} onMouseLeave={closeHover}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h5 style={{ flex: 1, margin: 0 }}>{hg.name}</h5>
                        <button className="btn btn-ghost btn-sm" title="Email this group" style={{ flexShrink: 0 }} onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); ctx.openComposer(hg.members.map(m => m.id), { project: proj.name, group: hg.name }); }} disabled={hg.members.length === 0}><Mail size={13} />Email</button>
                      </div>
                      {hg.desc && <div className="desc">{hg.desc}</div>}
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: ".6px" }}>People</div>
                      {hg.members.length === 0 ? <div className="note-row" style={{ color: "var(--dim)", borderTop: "none" }}>No one assigned.</div> : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "6px 0 9px" }}>
                          {hg.members.map(m => (
                            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5 }}>
                              <MemberAv m={m} size={20} />
                              <span style={{ color: m.done ? "var(--muted)" : "var(--ink)", textDecoration: m.done ? "line-through" : "none" }}>{m.name}</span>
                              <button className="btn btn-ghost icon-btn" title={`Email ${m.name}`} style={{ width: 22, height: 22, padding: 0, flexShrink: 0 }} onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); ctx.openComposer([m.id], { project: proj.name, group: hg.name }); }}><Mail size={12} /></button>
                              <span style={{ flex: 1 }} />
                              {m.done && <span style={{ fontSize: 10.5, color: "var(--done)", fontWeight: 700 }}>signed off</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: ".6px" }}>Notes</div>
                      {notes.length === 0 && <div className="note-row" style={{ color: "var(--dim)", borderTop: "none" }}>No notes yet.</div>}
                      {notes.map(n => editId === n.id ? (
                        <div className="note-row" key={n.id}>
                          <input style={{ flex: 1, fontFamily: "Outfit", fontSize: 12.5, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 8, padding: "5px 7px", background: "var(--bg)" }} value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => e.key === "Enter" && saveNote(proj.id, hg.id, n.id, editText)} autoFocus />
                          <button className="btn btn-sm" onClick={() => saveNote(proj.id, hg.id, n.id, editText)}><Check size={13} /></button>
                        </div>
                      ) : (
                        <div className="note-row" key={n.id}>
                          <div style={{ flex: 1 }}>{n.text}<div className="by">— {n.by}</div></div>
                          {canOpen && <button className="btn btn-ghost icon-btn" style={{ width: 24, height: 24 }} onClick={() => { setEditId(n.id); setEditText(n.text); }}><Pencil size={12} /></button>}
                          {canOpen && <button className="btn btn-ghost icon-btn" style={{ width: 24, height: 24 }} onClick={() => delNote(proj.id, hg.id, n.id)}><X size={12} /></button>}
                        </div>
                      ))}
                      {canOpen ? (
                        <>
                          <div className="note-add">
                            <input placeholder="Add a note…" value={noteDraft} onChange={e => setNoteDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote(proj.id, hg.id, noteDraft)} />
                            <button className="btn btn-pri btn-sm" onClick={() => addNote(proj.id, hg.id, noteDraft)}><Plus size={14} /></button>
                          </div>
                          <div className="by" style={{ marginTop: 6, color: "var(--muted)", fontSize: 10.5 }}>Posting as {user.name}</div>
                        </>
                      ) : <div className="by" style={{ marginTop: 6, color: "var(--muted)", fontSize: 10.5 }}>View only</div>}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
          {sx.w > sx.c + 2 && (
            <div ref={trackRef} onMouseDown={startBarDrag} style={{ marginLeft: LBL, marginTop: 8, height: 9, background: "var(--raise)", borderRadius: 99, position: "relative", cursor: "pointer" }}>
              <div style={{ position: "absolute", top: 0, height: 9, borderRadius: 99, background: "var(--line2)", width: Math.max(8, sx.c / sx.w * 100) + "%", left: (sx.l / sx.w * 100) + "%", cursor: "grab" }} />
            </div>
          )}
          <div className="foot-note" style={{ marginTop: 12, justifyContent: "flex-start" }}><Sparkles size={12} /> Hover a bar for its description. Light-blue line = today, red dashed = project due. Bars turn green when everyone's signed off.</div>
          {isOwner && (
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
              <button className="btn" onClick={() => setEdit({ pid: proj.id })}><Pencil size={14} />Project</button>
              <button className="btn btn-pri" onClick={() => addGroup(proj.id)}><Plus size={16} />Group</button>
            </div>
          )}
        </div>

        {editTarget && canOpen && (
          <div style={{ width: 310, flexShrink: 0, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 18, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}><Pencil size={15} color="var(--muted)" />{editTarget.g ? "Edit group" : "Edit project"}</div>
              <button className="btn btn-ghost icon-btn" onClick={() => setEdit(null)}><X size={16} /></button>
            </div>
            {!isOwner && <div className="foot-note" style={{ justifyContent: "flex-start", textAlign: "left", marginBottom: 12, color: "var(--amber)" }}><AlertCircle size={12} />As editor you can add people & edit descriptions. The rest is owner-only.</div>}
            {!editTarget.g ? (
              <>
                <div className="fld"><label>Project name</label><input disabled={!isOwner} value={editTarget.p.name} onChange={e => patchProject(editTarget.p.id, { name: e.target.value })} /></div>
                <div className="row2">
                  <div className="fld"><label>Start date</label><input type="date" disabled={!isOwner} value={editTarget.p.start || ""} onKeyDown={e => e.preventDefault()} onMouseDown={e => { e.preventDefault(); try { e.currentTarget.showPicker && e.currentTarget.showPicker(); } catch (_) {} }} onChange={e => patchProject(editTarget.p.id, { start: e.target.value })} /></div>
                  <div className="fld"><label>Due date</label><input type="date" disabled={!isOwner} value={editTarget.p.due || ""} onKeyDown={e => e.preventDefault()} onMouseDown={e => { e.preventDefault(); try { e.currentTarget.showPicker && e.currentTarget.showPicker(); } catch (_) {} }} onChange={e => patchProject(editTarget.p.id, { due: e.target.value })} /></div>
                </div>
                <div style={{ fontSize: 10.5, color: "var(--dim)", marginTop: -4, marginBottom: 10 }}>Start date is the earliest point on the chart — groups can't be dragged before it.</div>
                <div className="fld"><label>Color</label><div className="swatches" style={{ opacity: isOwner ? 1 : .4 }}>
                  {PALETTE.map(c => <span key={c} className={`swatch ${editTarget.p.color === c ? "on" : ""}`} style={{ background: c }} onClick={() => isOwner && patchProject(editTarget.p.id, { color: c })} />)}
                  {isOwner && <label className="swatch" title="Pick any color" style={{ display: "grid", placeItems: "center", background: "var(--raise)", border: "1px dashed var(--line2)", cursor: "pointer", position: "relative" }}>
                    <Plus size={13} color="var(--muted)" />
                    <input type="color" value={editTarget.p.color || "#4FA8E8"} onChange={e => patchProject(editTarget.p.id, { color: e.target.value })} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                  </label>}
                </div></div>
                <div style={{ marginTop: 8, padding: 11, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 7 }}>Invite code <span style={{ color: "var(--dim)", fontWeight: 600 }}>· demo</span></div>
                  {editTarget.p.codeCadence === "off" ? (
                    <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Joining is off — no one can join with a code.</div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "Fraunces", fontSize: 22, fontWeight: 600, letterSpacing: "2px", color: "var(--teal)" }}>{editTarget.p.code}</span>
                      {isOwner && <button className="btn btn-ghost icon-btn" title="Regenerate" onClick={() => regenCode(editTarget.p.id)}><RefreshCw size={14} /></button>}
                    </div>
                  )}
                  {isOwner && (
                    <div style={{ marginTop: 8 }}>
                      <label style={{ fontSize: 11, color: "var(--dim)" }}>Auto-refresh code</label>
                      <select className="btn btn-sm" style={{ width: "100%", marginTop: 4 }} value={editTarget.p.codeCadence || "never"} onChange={e => patchProject(editTarget.p.id, { codeCadence: e.target.value })}>
                        <option value="week">Every week</option><option value="month">Every month</option><option value="year">Every year</option><option value="never">Never</option><option value="off">Off — no joining</option>
                      </select>
                    </div>
                  )}
                  <div style={{ fontSize: 10.5, color: "var(--dim)", marginTop: 7 }}>People who enter this code join as editors. (Real joining turns on with accounts.)</div>
                </div>
                <div className="foot-note" style={{ justifyContent: "flex-start", marginTop: 12 }}>Add or delete groups from the timeline (the <b style={{ color: "var(--ink)", margin: "0 3px" }}>+ Group</b> button). Delete the whole project from the project card.</div>
              </>
            ) : (
              <>
                <div className="fld"><label>Group name {!isOwner && "(owner only)"}</label><input disabled={!isOwner} value={editTarget.g.name} onChange={e => patchGroup(editTarget.p.id, editTarget.g.id, gr => ({ ...gr, name: e.target.value }))} /></div>
                <div className="fld"><label>Description (shows on hover)</label><textarea value={editTarget.g.desc || ""} onChange={e => patchGroup(editTarget.p.id, editTarget.g.id, gr => ({ ...gr, desc: e.target.value }))} placeholder="What this group is doing…" /></div>
                <div className="row2">
                  <div className="fld"><label>Start</label><input type="date" disabled={!isOwner} value={editTarget.g.start || ""} onKeyDown={e => e.preventDefault()} onMouseDown={e => { e.preventDefault(); try { e.currentTarget.showPicker && e.currentTarget.showPicker(); } catch (_) {} }} onChange={e => patchGroup(editTarget.p.id, editTarget.g.id, gr => ({ ...gr, start: e.target.value }))} /></div>
                  <div className="fld"><label>End</label><input type="date" disabled={!isOwner} value={editTarget.g.end || ""} onKeyDown={e => e.preventDefault()} onMouseDown={e => { e.preventDefault(); try { e.currentTarget.showPicker && e.currentTarget.showPicker(); } catch (_) {} }} onChange={e => patchGroup(editTarget.p.id, editTarget.g.id, gr => ({ ...gr, end: e.target.value }))} /></div>
                </div>
                {isOwner && <div className="fld"><label>Group color</label><div className="swatches">
                  {PALETTE.map(c => <span key={c} className={`swatch ${(editTarget.g.color || editTarget.p.color) === c ? "on" : ""}`} style={{ background: c }} onClick={() => patchGroup(editTarget.p.id, editTarget.g.id, gr => ({ ...gr, color: c }))} />)}
                  <label className="swatch" title="Pick any color" style={{ display: "grid", placeItems: "center", background: "var(--raise)", border: "1px dashed var(--line2)", cursor: "pointer", position: "relative" }}>
                    <Plus size={13} color="var(--muted)" />
                    <input type="color" value={editTarget.g.color || editTarget.p.color || "#4FA8E8"} onChange={e => patchGroup(editTarget.p.id, editTarget.g.id, gr => ({ ...gr, color: e.target.value }))} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                  </label>
                </div></div>}
                {isOwner && (
                  <div style={{ marginTop: 4 }}>
                    <button className="btn" style={{ width: "100%", justifyContent: "space-between" }} onClick={() => { setAdjOpen(o => !o); setAdjDelta(0); setAdjMode("none"); setAdjSel([]); setMvStart(false); setMvEnd(true); }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7 }}><Clock size={14} />Add / remove days</span>
                      <ChevronDown size={14} style={{ transform: adjOpen ? "rotate(180deg)" : "none", transition: ".15s" }} />
                    </button>
                    {adjOpen && (
                      <div style={{ marginTop: 8, padding: 11, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                          <button className="btn btn-ghost icon-btn" onClick={() => setAdjDelta(d => d - 1)}><Minus size={16} /></button>
                          <span style={{ fontFamily: "Fraunces", fontSize: 19, fontWeight: 600, minWidth: 92, textAlign: "center" }}>{adjDelta > 0 ? `+${adjDelta}` : adjDelta} {Math.abs(adjDelta) === 1 ? "day" : "days"}</span>
                          <button className="btn btn-ghost icon-btn" onClick={() => setAdjDelta(d => d + 1)}><Plus size={16} /></button>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          <label className="btn btn-sm" style={{ flex: 1, justifyContent: "center", cursor: "pointer", gap: 7, ...(mvStart ? { borderColor: "var(--teal)", color: "var(--teal)" } : {}) }} onClick={() => setMvStart(v => !v)}>
                            <span className="rcp-box" style={{ width: 15, height: 15, ...(mvStart ? { background: "var(--teal)", borderColor: "var(--teal)" } : {}) }}>{mvStart && <Check size={10} />}</span>Move start
                          </label>
                          <label className="btn btn-sm" style={{ flex: 1, justifyContent: "center", cursor: "pointer", gap: 7, ...(mvEnd ? { borderColor: "var(--teal)", color: "var(--teal)" } : {}) }} onClick={() => setMvEnd(v => !v)}>
                            <span className="rcp-box" style={{ width: 15, height: 15, ...(mvEnd ? { background: "var(--teal)", borderColor: "var(--teal)" } : {}) }}>{mvEnd && <Check size={10} />}</span>Move end
                          </label>
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--dim)", marginTop: 6 }}>{mvStart && !mvEnd ? "Starts earlier/later, end stays — changes length." : !mvStart && mvEnd ? "End moves, start stays — changes length." : mvStart && mvEnd ? "Whole group slides, same length." : "Pick what the days move."}</div>
                        <div className="fld" style={{ marginTop: 10, marginBottom: 0 }}>
                          <label>Also shift other groups</label>
                          <select className="btn btn-sm" style={{ width: "100%" }} value={adjMode} onChange={e => setAdjMode(e.target.value)}>
                            <option value="none">Don't move others</option>
                            <option value="all">All other groups</option>
                            <option value="choose">Choose specific groups…</option>
                          </select>
                        </div>
                        {adjMode === "choose" && (
                          <div style={{ maxHeight: 138, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: 6, marginTop: 8 }}>
                            {editTarget.p.groups.filter(g => g.id !== editTarget.g.id).map(g => { const on = adjSel.includes(g.id); return (
                              <div key={g.id} onClick={() => setAdjSel(s => on ? s.filter(x => x !== g.id) : [...s, g.id])} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px", cursor: "pointer", borderRadius: 8, background: on ? "var(--raise)" : "transparent" }}>
                                <span className="rcp-box" style={{ width: 16, height: 16, ...(on ? { background: "var(--teal)", borderColor: "var(--teal)" } : {}) }}>{on && <Check size={11} />}</span>
                                <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color || editTarget.p.color }} />
                                <span style={{ fontSize: 13 }}>{g.name}</span>
                              </div>
                            ); })}
                            {editTarget.p.groups.length <= 1 && <div className="empty-sm" style={{ padding: "6px 0" }}>No other groups.</div>}
                          </div>
                        )}
                        <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={() => applyAdjust(editTarget.p.id, editTarget.g.id)}><Check size={15} />Save</button>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", margin: "10px 0 8px" }}>Members & sign-off</div>
                {editTarget.g.members.length === 0 && <div className="empty-sm" style={{ padding: "6px 0" }}>No one assigned yet.</div>}
                {editTarget.g.members.map(m => (
                  <div key={m.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0" }}>
                      <span className="rcp-box" style={{ cursor: "pointer", ...(m.done ? { background: "var(--done)", borderColor: "var(--done)" } : {}) }} onClick={() => toggleMember(editTarget.p.id, editTarget.g.id, m.id)}>{m.done && <Check size={12} />}</span>
                      <span style={{ cursor: "pointer" }} onClick={() => setColorFor(colorFor === m.id ? null : m.id)} title="Change color"><MemberAv m={m} size={26} /></span>
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, textDecoration: m.done ? "line-through" : "none", color: m.done ? "var(--muted)" : "var(--ink)" }}>{m.name}</span>
                      <button className="btn btn-ghost icon-btn" onClick={() => removeMember(editTarget.p.id, editTarget.g.id, m.id)}><X size={14} /></button>
                    </div>
                    {colorFor === m.id && (
                      <div className="swatches" style={{ padding: "4px 0 8px 35px" }}>{PALETTE.map(c => <span key={c} className={`swatch ${m.color === c ? "on" : ""}`} style={{ width: 22, height: 22, background: c }} onClick={() => { setMemberColor(editTarget.p.id, editTarget.g.id, m.id, c); setColorFor(null); }} />)}</div>
                    )}
                  </div>
                ))}
                <select className="btn" style={{ width: "100%", marginTop: 8 }} value="" onChange={e => { const person = team.find(t => t.id === e.target.value); if (person) addMember(editTarget.p.id, editTarget.g.id, person); }}>
                  <option value="">{team.length ? "+ Assign someone…" : "Add people in the Team tab first"}</option>
                  {team.filter(t => !editTarget.g.members.some(m => m.id === t.id)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {isOwner && <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 10, color: "#ff8a8c" }} onClick={() => delGroup(editTarget.p.id, editTarget.g.id)}><Trash2 size={14} />Delete group</button>}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ---------------- Board ---------------- */
/* ---------------- Notifications / Inbox ---------------- */
function NotificationsView({ ctx }) {
  const { gantt: gd, gotoGantt, notif, setNotif } = ctx;
  const all = buildNotifs(gd);
  const isRead = (id) => notif.read.includes(id);
  const isRemoved = (id) => notif.removed.includes(id);
  const live = all.filter(n => !isRemoved(n.id));
  const unread = live.filter(n => !isRead(n.id));
  const readList = live.filter(n => isRead(n.id));
  const alerts = unread.filter(n => n.kind === "alert");
  const activity = unread.filter(n => n.kind === "activity");

  const markRead = (id) => setNotif(s => ({ ...s, read: [...new Set([...s.read, id])] }));
  const unreadAgain = (id) => setNotif(s => ({ ...s, read: s.read.filter(x => x !== id) }));
  const remove = (id) => setNotif(s => ({ read: s.read.filter(x => x !== id), removed: [...new Set([...s.removed, id])] }));
  const markAll = () => setNotif(s => ({ ...s, read: [...new Set([...s.read, ...unread.map(n => n.id)])] }));
  const [iq, setIq] = useState("");
  const ql = iq.trim().toLowerCase();
  const hits = ql ? live.filter(n => (n.title + " " + n.sub).toLowerCase().includes(ql)) : [];
  const snippet = (text) => {
    const i = text.toLowerCase().indexOf(ql); if (i < 0) return text;
    const from = Math.max(0, i - 22), to = Math.min(text.length, i + ql.length + 26);
    return [from > 0 ? "…" : "", text.slice(from, i), <mark key="m" style={{ background: "rgba(232,165,60,.4)", color: "var(--ink)", borderRadius: 3, padding: "0 2px" }}>{text.slice(i, i + ql.length)}</mark>, text.slice(i + ql.length, to), to < text.length ? "…" : ""];
  };

  const Row = ({ n, read }) => { const Icon = NICON[n.icon] || Bell; return (
    <div className="row-i" style={{ alignItems: "flex-start" }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, background: n.color + "22", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1, opacity: read ? .6 : 1 }}><Icon size={16} color={n.color} /></span>
      <div style={{ flex: 1, minWidth: 0, cursor: "pointer", opacity: read ? .7 : 1 }} onClick={() => gotoGantt(n.pid)}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{n.title}{n.demo && <span style={{ fontSize: 10, color: "var(--dim)", fontWeight: 500, marginLeft: 6 }}>demo</span>}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{n.sub}</div>
      </div>
      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
        {read
          ? <button className="btn btn-ghost icon-btn" title="Bring back to unread" onClick={() => unreadAgain(n.id)}><RotateCcw size={14} /></button>
          : <button className="btn btn-ghost icon-btn" title="Mark read" onClick={() => markRead(n.id)}><Check size={15} /></button>}
        <button className="btn btn-ghost icon-btn" title="Remove" onClick={() => remove(n.id)}><X size={14} /></button>
      </div>
    </div>
  ); };

  return (
    <>
      <div className="head">
        <div><div className="h-title">Inbox</div><div className="h-sub">Alerts and activity from your projects — tuned to your role.</div></div>
        {unread.length > 0 && !ql && <button className="btn btn-sm" onClick={markAll}><Check size={14} />Mark all read</button>}
      </div>

      <div style={{ position: "relative", maxWidth: 340, marginBottom: 14 }}>
        <Search size={15} style={{ position: "absolute", left: 11, top: 10, color: "var(--dim)" }} />
        <input value={iq} onChange={e => setIq(e.target.value)} placeholder="Search notifications by keyword…" style={{ width: "100%", paddingLeft: 34, fontFamily: "Outfit", fontSize: 13.5, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 11, padding: "9px 12px 9px 34px", background: "var(--panel)", outline: "none" }} />
      </div>

      {ql ? (
        <div className="panel">
          <div className="panel-h"><span className="pic" style={{ background: "rgba(232,165,60,.16)" }}><Search size={15} color="var(--amber)" /></span>Results for "{iq}"{hits.length > 0 && <span className="more">{hits.length}</span>}</div>
          {hits.length === 0 ? <div className="empty-sm">No notifications mention "{iq}".</div> : hits.map(n => { const Icon = NICON[n.icon] || Bell; return (
            <div className="row-i" key={n.id} style={{ alignItems: "flex-start", cursor: "pointer" }} onClick={() => gotoGantt(n.pid)}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: n.color + "22", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}><Icon size={16} color={n.color} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{snippet(n.title)}{isRead(n.id) && <span style={{ fontSize: 10, color: "var(--dim)", fontWeight: 500, marginLeft: 6 }}>read</span>}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{snippet(n.sub)}</div>
              </div>
              <ChevronRight size={15} color="var(--dim)" style={{ marginTop: 6 }} />
            </div>
          ); })}
        </div>
      ) : (<>
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-h"><span className="pic" style={{ background: "rgba(224,58,62,.16)" }}><AlertCircle size={16} color="var(--primary)" /></span>Needs attention{alerts.length > 0 && <span className="more">{alerts.length}</span>}</div>
        {alerts.length === 0 ? <div className="empty-sm">All clear — nothing behind or due right now. 🎉</div> : alerts.map(n => <Row key={n.id} n={n} />)}
      </div>

      <div className="panel">
        <div className="panel-h"><span className="pic" style={{ background: "rgba(79,168,232,.16)" }}><Bell size={16} color="var(--teal)" /></span>Activity{activity.length > 0 && <span className="more">{activity.length}</span>}</div>
        {activity.length === 0 ? <div className="empty-sm">Nothing new.</div> : activity.map(n => <Row key={n.id} n={n} />)}
      </div>
      </>)}

      {readList.length > 0 && (
        <details style={{ marginTop: 14 }}>
          <summary style={{ cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--muted)", padding: "4px 2px" }}>Read notifications ({readList.length})</summary>
          <div className="panel" style={{ marginTop: 8 }}>
            {readList.map(n => <Row key={n.id} n={n} read />)}
          </div>
        </details>
      )}

      <div className="foot-note" style={{ justifyContent: "flex-start", marginTop: 12 }}><Sparkles size={12} />You only see what affects you — owners get "fell behind" alerts, editors get their own deadline warnings, viewers stay quiet. Live alerts (new messages, emails) turn on with the backend.</div>
    </>
  );
}

function BoardView({ ctx }) {
  const { data, filtered, personById, projectById, q, setQ, fPerson, setFPerson, fProject, setFProject,
    newTask, cycleStatus, setTaskModal, delTask, emailTask, setView } = ctx;
  const doneCount = filtered.filter(t => t.status === "done").length;
  const pct = filtered.length ? Math.round(doneCount / filtered.length * 100) : 0;

  if (data.people.length === 0 && data.tasks.length === 0) {
    return (
      <div className="panel" style={{ textAlign: "center", padding: "54px 24px" }}>
        <div className="h-title" style={{ fontSize: 22 }}>Your board is empty</div>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "8px 0 18px" }}>Add people in the Team tab, then start adding tasks.</p>
        <button className="btn btn-pri" onClick={() => setView("team")}><Plus size={16} />Set up the team</button>
      </div>
    );
  }

  return (
    <>
      <div className="head">
        <div><div className="h-title">Board</div><div className="h-sub">{pct}% complete · {filtered.length} tasks shown</div></div>
        <button className="btn btn-pri" onClick={() => newTask()}><Plus size={16} />New task</button>
      </div>

      <div className="cad-tools" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 11, padding: "8px 12px", flex: 1, minWidth: 200 }}>
          <Search size={16} color="var(--muted)" />
          <input placeholder="Search tasks…" value={q} onChange={e => setQ(e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontFamily: "Outfit", fontSize: 14, width: "100%", color: "var(--ink)" }} />
        </div>
        <select className="btn" value={fPerson} onChange={e => setFPerson(e.target.value)}>
          <option value="all">Everyone</option>
          {data.people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="btn" value={fProject} onChange={e => setFProject(e.target.value)}>
          <option value="all">All projects</option>
          {data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="cols">
        {COLUMNS.map(col => {
          const items = filtered.filter(t => t.status === col.id);
          return (
            <div className="col" key={col.id}>
              <div className="col-h"><span className="dot" style={{ background: col.dot }} />{col.label}<span className="ct">{items.length}</span></div>
              {items.map((t, i) => (
                <TaskCard key={t.id} t={t} i={i} person={personById(t.assigneeId)} project={projectById(t.projectId)}
                  onTick={() => cycleStatus(t)} onEdit={() => setTaskModal(t)} onDel={() => delTask(t.id)} onEmail={() => emailTask(t)} />
              ))}
              {items.length === 0 && <div style={{ fontSize: 12.5, color: "var(--dim)", textAlign: "center", padding: "14px 0" }}>—</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- Team ---------------- */
function DisciplineField({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const q = (value || "").toLowerCase();
  const opts = q ? DISCIPLINES.filter(d => d.toLowerCase().includes(q)) : DISCIPLINES;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input value={value || ""} onClick={() => setOpen(true)} onFocus={() => setOpen(true)} onChange={e => { onChange(e.target.value); setOpen(true); }} placeholder={placeholder || "Click to pick, or type your own"} />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "var(--panel2)", border: "1px solid var(--line2)", borderRadius: 11, boxShadow: "0 14px 36px rgba(0,0,0,.4)", zIndex: 40, maxHeight: 220, overflowY: "auto", padding: 5 }}>
          {opts.length === 0 ? <div style={{ padding: "8px 10px", fontSize: 12.5, color: "var(--dim)" }}>Press enter to use "{value}"</div> :
            opts.map(d => <div key={d} onClick={() => { onChange(d); setOpen(false); }} style={{ padding: "8px 10px", fontSize: 13.5, borderRadius: 8, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "var(--raise)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{d}</div>)}
        </div>
      )}
    </div>
  );
}
function TeamView({ ctx }) {
  const { user, openProfile, updateUser, openComposer } = ctx;
  const gd = ctx.gantt;
  const data = ctx.data;
  const contacts = ctx.contacts;
  const setContacts = ctx.setContacts;
  const [q, setQ] = useState("");
  const [gq, setGq] = useState("");
  const [pq, setPq] = useState("");
  const [openPerson, setOpenPerson] = useState(null);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const gComplete = (g) => g.members.length > 0 && g.members.every(m => m.done);

  // build contact book from everyone who's been on a project with you
  const peopleMap = {};
  gd.projects.filter(p => !p.deleted).forEach(p => p.groups.forEach(g => g.members.forEach(m => {
    if (!peopleMap[m.id]) peopleMap[m.id] = { id: m.id, name: m.name, color: m.color, projects: new Set() };
    peopleMap[m.id].projects.add(p.name);
  })));
  data.people.forEach(pp => { if (peopleMap[pp.id]) { peopleMap[pp.id].email = pp.email; peopleMap[pp.id].role = pp.role; } });
  Object.values(peopleMap).forEach(p => { const info = contacts.info[p.id] || {}; p.nickname = info.nickname || ""; if (info.email) p.email = info.email; if (info.discipline) p.discipline = info.discipline; });
  const people = Object.values(peopleMap).sort((a, b) => a.name.localeCompare(b.name));
  const byId = (id) => people.find(p => p.id === id);
  const ql = q.trim().toLowerCase();
  const shown = ql ? people.filter(p => p.name.toLowerCase().includes(ql) || (p.nickname || "").toLowerCase().includes(ql)) : people;

  const saveInfo = (id, patch) => setContacts(c => ({ ...c, info: { ...c.info, [id]: { ...(c.info[id] || {}), ...patch } } }));
  const delGroup = (gid) => setContacts(c => ({ ...c, groups: c.groups.filter(g => g.id !== gid) }));

  return (
    <>
      <div className="head">
        <div><div className="h-title">Team</div><div className="h-sub">You, and everyone you've worked with.</div></div>
      </div>

      <div className="sec-h"><Users size={18} />You</div>
      <div className="panel" style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={openProfile}>
          <UserAv u={user} size={52} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: "Fraunces", fontSize: 19, fontWeight: 600 }}>{user.name}{user.discipline ? <span style={{ fontFamily: "Outfit", fontSize: 12.5, fontWeight: 700, color: "var(--teal)", background: "rgba(79,168,232,.16)", borderRadius: 99, padding: "2px 10px", marginLeft: 9 }}>{user.discipline}</span> : null}</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{user.email}</div>
            {user.about ? <div style={{ fontSize: 13, color: "var(--ink)", marginTop: 5, lineHeight: 1.4 }}>{user.about}</div> : <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 5 }}>Add an "about" so your team knows who you are.</div>}
          </div>
          <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); openProfile(); }}><Pencil size={13} />Edit profile</button>
        </div>
        <div className="fld" style={{ marginTop: 12, marginBottom: 0, maxWidth: 320 }}>
          <label>What you do (click to pick, or type your own)</label>
          <DisciplineField value={user.discipline} onChange={v => updateUser({ discipline: v })} placeholder="e.g. Civil, Electrical…" />
        </div>
      </div>

      {contacts.groups.length > 0 && (
        <>
          <div className="sec-h"><Mail size={18} />Saved groups</div>
          <div style={{ position: "relative", maxWidth: 280, marginBottom: 10 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 9, color: "var(--dim)" }} />
            <input value={gq} onChange={e => setGq(e.target.value)} placeholder="Search saved groups…" style={{ width: "100%", paddingLeft: 30, fontFamily: "Outfit", fontSize: 13, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 9, padding: "7px 10px 7px 30px", background: "var(--panel)", outline: "none" }} />
          </div>
          <div className="team-grid" style={{ marginBottom: 8 }}>
            {contacts.groups.filter(g => !gq.trim() || g.name.toLowerCase().includes(gq.trim().toLowerCase())).map(g => {
              const src = g.source ? (g.source.group ? `${g.source.project} · ${g.source.group}` : g.source.project ? `${g.source.project} · team` : "") : "";
              return (
                <div className="person" key={g.id}>
                  <div className="pa" style={{ background: "var(--teal)" }}><Users size={18} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pn">{g.name}</div>
                    {src ? <div className="pr" style={{ color: "var(--teal)" }}>{src}</div> : <div className="pr">{g.memberIds.length} people</div>}
                    <div className="pe" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{g.memberIds.map(id => byId(id)?.name.split(" ")[0]).filter(Boolean).join(", ")}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button className="btn btn-ghost icon-btn" title="Email this group" onClick={() => openComposer(g.memberIds, g.source)}><Mail size={15} /></button>
                    <button className="btn btn-ghost icon-btn" onClick={() => delGroup(g.id)}><Trash2 size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="sec-h" style={{ cursor: "pointer", userSelect: "none" }} onClick={() => { setPeopleOpen(v => !v); setQ(""); }}>
        <Users size={18} />All People<span style={{ marginLeft: "auto", fontSize: 12, color: "var(--dim)", fontWeight: 500 }}>{peopleOpen ? "▲" : "▼"}</span>
      </div>
      {peopleOpen && (
        <div style={{ position: "relative", maxWidth: 280, marginBottom: 10 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 9, color: "var(--dim)" }} />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search people…" style={{ width: "100%", fontFamily: "Outfit", fontSize: 13, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 9, padding: "7px 10px 7px 30px", background: "var(--panel)", outline: "none" }} />
        </div>
      )}
      {peopleOpen && (people.length === 0 ? <div className="empty-sm">No one yet — once people are added to your projects' groups, they'll show up here.</div> :
        shown.length === 0 ? <div className="empty-sm">No one matches "{q}".</div> :
        <div className="team-grid">
          {shown.map(p => (
            <div className="person" key={p.id} style={{ cursor: "pointer" }} onClick={() => setOpenPerson(p.id)}>
              <div className="pa" style={{ background: p.color }}>{initials(p.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pn">{p.name}{p.nickname ? <span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", marginLeft: 6 }}>({p.nickname})</span> : null}</div>
                <div className="pr">{p.discipline || p.role || "—"}</div>
                <div className="pe">{p.email || "no email yet"}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{[...p.projects].slice(0, 2).join(", ")}{p.projects.size > 2 ? "…" : ""}</div>
              </div>
              <button className="btn btn-ghost icon-btn" title="Email" onClick={(e) => { e.stopPropagation(); openComposer([p.id]); }}><Mail size={15} /></button>
            </div>
          ))}
        </div>)}

      <div className="sec-h"><FolderOpen size={18} />Projects</div>
      <div className="panel">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 9, color: "var(--dim)" }} />
            <input value={pq} onChange={e => setPq(e.target.value)} placeholder="Search projects or groups…" style={{ width: "100%", paddingLeft: 30, fontFamily: "Outfit", fontSize: 13, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 9, padding: "7px 10px 7px 30px", background: "var(--bg)", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--primary)" }} />project</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--teal)" }} />task</span>
          </div>
        </div>
        {(() => {
          const pql = pq.trim().toLowerCase();
          const rows = gd.projects.filter(p => !p.deleted && !p.done).map(p => {
            const incomplete = p.groups.filter(g => !gComplete(g));
            const nameMatch = !pql || p.name.toLowerCase().includes(pql);
            const groups = pql ? incomplete.filter(g => nameMatch || g.name.toLowerCase().includes(pql)) : incomplete;
            return { p, groups, nameMatch };
          }).filter(r => !pql || r.nameMatch || r.groups.length > 0);
          if (rows.length === 0) return <div className="empty-sm">{pql ? `Nothing matches "${pq}".` : "No open projects — everything's done. 🎉"}</div>;
          const projMembers = (p) => { const seen = {}; const out = []; p.groups.forEach(g => g.members.forEach(m => { if (!seen[m.id]) { seen[m.id] = 1; out.push(m.id); } })); return out; };
          return (
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {rows.map(({ p, groups }) => (
                <div key={p.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 4px" }}>
                    <span style={{ width: 11, height: 11, borderRadius: 99, background: "var(--primary)", flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 14.5, cursor: "pointer" }} onClick={() => gotoGantt(p.id)}>{p.name}</span>
                    {p.due && <span className="chip chip-due">{fmtDue(p.due)}</span>}
                    <button className="btn btn-sm" style={{ marginLeft: "auto" }} onClick={() => openComposer(projMembers(p), { project: p.name })}><Mail size={13} />Email team</button>
                  </div>
                  {groups.length === 0 ? <div style={{ fontSize: 12, color: "var(--dim)", padding: "2px 0 4px 24px" }}>All groups signed off.</div> :
                    groups.map(g => (
                      <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 4px 5px 24px" }}>
                        <span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--teal)", flexShrink: 0 }} />
                        <span style={{ fontSize: 13.5, cursor: "pointer" }} onClick={() => gotoGantt(p.id)}>{g.name}</span>
                        {g.end && <span className="chip chip-due">{fmtDue(g.end)}</span>}
                        <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{g.members.filter(m => m.done).length}/{g.members.length} signed off</span>
                        <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => openComposer(g.members.map(m => m.id), { project: p.name, group: g.name })} disabled={g.members.length === 0}><Mail size={12} />Email group</button>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--muted)", padding: "4px 2px" }}>Need a group you're not on? Email any group</summary>
        <div className="panel" style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 8 }}>Every group across all projects — reach out even if you're not part of it.</div>
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {(() => {
              const pql = pq.trim().toLowerCase();
              const all = [];
              gd.projects.filter(p => !p.deleted).forEach(p => p.groups.forEach(g => {
                if (!pql || p.name.toLowerCase().includes(pql) || g.name.toLowerCase().includes(pql)) all.push({ p, g });
              }));
              if (all.length === 0) return <div className="empty-sm">No groups found.</div>;
              return all.map(({ p, g }) => (
                <div key={p.id + g.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 4px" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: g.color || p.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5 }}><span style={{ color: "var(--muted)" }}>{p.name}</span> · {g.name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--dim)" }}>{g.members.length} {g.members.length === 1 ? "person" : "people"}</span>
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => openComposer(g.members.map(m => m.id), { project: p.name, group: g.name })} disabled={g.members.length === 0}><Mail size={12} />Email</button>
                </div>
              ));
            })()}
          </div>
        </div>
      </details>

      {openPerson && (() => { const p = byId(openPerson); if (!p) return null; return (
        <div className="ov" onClick={() => setOpenPerson(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-h"><h2>Profile</h2><button className="btn btn-ghost icon-btn" onClick={() => setOpenPerson(null)}><X size={18} /></button></div>
            <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 14 }}>
              <span className="av" style={{ width: 52, height: 52, fontSize: 19, background: p.color }}>{initials(p.name)}</span>
              <div><div style={{ fontFamily: "Fraunces", fontSize: 20, fontWeight: 600 }}>{p.name}{p.nickname ? <span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)", marginLeft: 7 }}>({p.nickname})</span> : null}</div><div style={{ fontSize: 12.5, color: "var(--muted)" }}>{[...p.projects].join(", ")}</div></div>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--dim)", fontStyle: "italic", marginBottom: 12, lineHeight: 1.4 }}>{previewBio(p)} <span style={{ fontSize: 10.5, fontStyle: "normal" }}>(preview)</span></div>
            <div className="fld"><label>Nickname</label><input value={p.nickname || ""} onChange={e => saveInfo(p.id, { nickname: e.target.value })} placeholder="What you call them" /></div>
            <div className="fld"><label>Email</label><input value={p.email || ""} onChange={e => saveInfo(p.id, { email: e.target.value })} placeholder="name@company.com" /></div>
            <div className="fld"><label>Discipline</label><DisciplineField value={p.discipline} onChange={v => saveInfo(p.id, { discipline: v })} placeholder="e.g. Electrical" /></div>
            <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={() => { openComposer([p.id]); setOpenPerson(null); }}><Mail size={16} />Email {p.name.split(" ")[0]}</button>
          </div>
        </div>
      ); })()}
    </>
  );
}

/* ---------------- Shared email composer ---------------- */
function EmailComposerModal({ ctx, compose, setCompose }) {
  const { user, gantt: gd, data, contacts, setContacts } = ctx;
  const [pickQ, setPickQ] = useState("");
  const [img, setImg] = useState(null);
  const [imgName, setImgName] = useState("");
  const [hint, setHint] = useState("");
  const imgRef = useRef(null);
  const peopleMap = {};
  gd.projects.filter(p => !p.deleted).forEach(p => p.groups.forEach(g => g.members.forEach(m => { if (!peopleMap[m.id]) peopleMap[m.id] = { id: m.id, name: m.name, color: m.color }; })));
  data.people.forEach(pp => { if (peopleMap[pp.id]) peopleMap[pp.id].email = peopleMap[pp.id].email || pp.email; });
  Object.values(peopleMap).forEach(p => { const info = contacts.info[p.id] || {}; p.nickname = info.nickname || ""; if (info.email) p.email = info.email; });
  const people = Object.values(peopleMap).sort((a, b) => a.name.localeCompare(b.name));
  const byId = (id) => people.find(p => p.id === id);
  const close = () => setCompose(null);
  const addRecipient = (id) => setCompose(c => ({ ...c, ids: c.ids.includes(id) ? c.ids : [...c.ids, id], picking: false }));
  const removeRecipient = (id) => setCompose(c => ({ ...c, ids: c.ids.filter(x => x !== id) }));
  const pickImg = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; if (f.size > 4 * 1024 * 1024) { alert("Please choose an image under ~4 MB."); return; } const r = new FileReader(); r.onload = () => { setImg(r.result); setImgName(f.name); }; r.readAsDataURL(f); };
  const downloadImg = () => { if (!img) return; const a = document.createElement("a"); a.href = img; a.download = imgName || "image.png"; document.body.appendChild(a); a.click(); a.remove(); };
  const copyImg = async () => { try { const blob = await (await fetch(img)).blob(); await navigator.clipboard.write([new window.ClipboardItem({ [blob.type]: blob })]); return true; } catch (e) { return false; } };
  const openOutlook = async (web) => {
    const emails = compose.ids.map(byId).filter(p => p && p.email).map(p => p.email);
    if (!emails.length) { alert("None of these people have an email saved. Add one from their profile in Team."); return; }
    let body = compose.body || "";
    if (img) {
      const copied = await copyImg();
      body += (body ? "\n\n" : "") + (copied ? "[Image copied to your clipboard — press Ctrl+V (⌘V on Mac) in the email to paste it in.]" : "[Attach the image from Cadence — use Download, then attach it in the email.]");
      setHint(copied ? "Image copied — paste it into the email with Ctrl+V (⌘V)." : "Couldn't auto-copy — tap Download and attach it in the email.");
    }
    if (web) {
      const u = new URLSearchParams(); u.set("to", emails.join(",")); if (compose.subject) u.set("subject", compose.subject); if (body) u.set("body", body);
      window.open(`https://outlook.office.com/mail/deeplink/compose?${u.toString()}`, "_blank");
    } else {
      window.location.href = `mailto:${emails.join(",")}?subject=${encodeURIComponent(compose.subject || "")}&body=${encodeURIComponent(body)}`;
    }
  };
  const saveGroup = () => { const name = (compose.groupName || "").trim(); if (!name || compose.ids.length === 0) return; setContacts(c => ({ ...c, groups: [...c.groups, { id: uid(), name, memberIds: compose.ids, source: compose.source || null }] })); setCompose(c => ({ ...c, groupName: "", saved: true })); };
  const srcLabel = compose.source ? (compose.source.group ? `${compose.source.project} · ${compose.source.group}` : compose.source.project ? `${compose.source.project} · team` : "") : "";

  return (
    <div className="ov" onClick={close}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h2>New email{srcLabel ? <span style={{ fontFamily: "Outfit", fontSize: 12.5, fontWeight: 600, color: "var(--teal)", marginLeft: 8 }}>{srcLabel}</span> : null}</h2><button className="btn btn-ghost icon-btn" onClick={close}><X size={18} /></button></div>
        <div className="from-line"><Mail size={14} /> Sending from <b>{user.email}</b> — always from you.</div>
        <div className="fld">
          <label>To</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {compose.ids.map(id => { const p = byId(id); if (!p) return null; return (
              <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--raise)", border: "1px solid var(--line2)", borderRadius: 99, padding: "4px 8px 4px 5px", fontSize: 12.5 }}>
                <span className="av" style={{ width: 18, height: 18, fontSize: 8, background: p.color }}>{initials(p.name)}</span>{p.nickname || p.name.split(" ")[0]}
                <X size={12} style={{ cursor: "pointer" }} onClick={() => removeRecipient(id)} />
              </span>
            ); })}
            <button className="btn btn-sm" onClick={() => setCompose(c => ({ ...c, picking: !c.picking }))}><Plus size={13} />Add another</button>
          </div>
        </div>
        {compose.picking && (
          <div style={{ marginBottom: 13 }}>
            <div style={{ position: "relative", marginBottom: 6 }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: 8, color: "var(--dim)" }} />
              <input autoFocus value={pickQ} onChange={e => setPickQ(e.target.value)} placeholder="Search people…" style={{ width: "100%", paddingLeft: 28, fontFamily: "Outfit", fontSize: 12.5, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 8, padding: "6px 9px 6px 28px", background: "var(--bg)", outline: "none" }} />
            </div>
            <div className="rcp" style={{ maxHeight: 170, overflowY: "auto" }}>
              {people.filter(p => !compose.ids.includes(p.id) && (!pickQ.trim() || p.name.toLowerCase().includes(pickQ.trim().toLowerCase()) || (p.nickname || "").toLowerCase().includes(pickQ.trim().toLowerCase()))).map(p => (
                <div className="rcp-row" key={p.id} onClick={() => addRecipient(p.id)}>
                  <span className="rcp-av" style={{ background: p.color }}>{initials(p.name)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}><div className="rcp-name">{p.name}{p.nickname ? ` (${p.nickname})` : ""}</div><div className="rcp-role">{p.email || "no email"}</div></div>
                  <Plus size={15} color="var(--muted)" />
                </div>
              ))}
              {people.filter(p => !compose.ids.includes(p.id)).length === 0 && <div className="empty-sm" style={{ padding: 8 }}>Everyone's added.</div>}
            </div>
          </div>
        )}
        <div className="fld"><label>Subject</label><input value={compose.subject} onChange={e => setCompose(c => ({ ...c, subject: e.target.value }))} placeholder="Subject" /></div>
        <div className="fld"><label>Message</label><textarea value={compose.body} onChange={e => setCompose(c => ({ ...c, body: e.target.value }))} placeholder="Write your message…" /></div>
        <div className="fld" style={{ marginBottom: 8 }}>
          <label>Image (optional)</label>
          {img ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={img} alt="" style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line2)" }} />
              <span style={{ fontSize: 12.5, color: "var(--muted)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{imgName}</span>
              <button className="btn btn-sm" onClick={downloadImg}><Download size={13} />Download</button>
              <button className="btn btn-ghost icon-btn" onClick={() => { setImg(null); setImgName(""); setHint(""); }}><X size={15} /></button>
            </div>
          ) : (
            <button className="btn btn-sm" onClick={() => imgRef.current && imgRef.current.click()}><Plus size={13} />Attach image</button>
          )}
          <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={pickImg} />
        </div>
        {hint && <div style={{ fontSize: 11.5, color: "var(--teal)", marginBottom: 8 }}>{hint}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-pri" style={{ flex: 1, justifyContent: "center" }} onClick={() => openOutlook(true)}><Send size={16} />Open in Outlook (web)</button>
          <button className="btn" onClick={() => openOutlook(false)} title="Open your desktop mail app (Outlook, etc.)"><Mail size={15} />Mail app</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          <input value={compose.groupName} onChange={e => setCompose(c => ({ ...c, groupName: e.target.value, saved: false }))} placeholder="Name this group to save it" style={{ flex: 1, fontFamily: "Outfit", fontSize: 13, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 9, padding: "8px 10px", background: "var(--bg)", outline: "none" }} />
          <button className="btn" onClick={saveGroup}>{compose.saved ? <><Check size={14} />Saved</> : <><Users size={14} />Save group</>}</button>
        </div>
        <div className="login-foot" style={{ marginTop: 10 }}>Outlook opens with everyone, the subject, and your message filled in. Images can't auto-attach through the link yet, so they're copied to your clipboard to paste in (or download &amp; attach) — true attachments send automatically with the backend.</div>
      </div>
    </div>
  );
}

/* ---------------- Task card ---------------- */
function TaskCard({ t, i, person, project, onTick, onEdit, onDel, onEmail }) {
  const over = isOverdue(t.due, t.status);
  return (
    <div className={`card ${t.status === "done" ? "done" : ""}`} style={{ animationDelay: `${i * 40}ms` }}>
      <div className="card-top">
        <span className="pri" style={{ background: PRIO[t.priority] }} />
        <div className="card-t">{t.title}</div>
        <button className={`tick ${t.status === "done" ? "on" : ""}`} onClick={onTick} title="Change status">
          {t.status === "done" ? <CheckCircle2 size={20} /> : t.status === "doing" ? <Clock size={20} /> : <Circle size={20} />}
        </button>
      </div>
      {t.notes && <div className="card-notes">{t.notes}</div>}
      <div className="card-meta">
        {person && <span className="chip chip-person" style={{ background: person.color }}><span className="av" style={{ background: "rgba(255,255,255,.25)" }}>{initials(person.name)}</span>{person.name.split(" ")[0]}</span>}
        {project && <span className="chip chip-proj">{project.name}</span>}
        {t.due && <span className={`chip chip-due ${over ? "over" : ""}`}>{over ? <AlertCircle size={12} /> : <CalendarDays size={12} />}{fmtDue(t.due)}</span>}
      </div>
      <div className="card-actions">
        <button className="btn btn-ghost btn-sm" onClick={onEmail} title="Email assignee via Outlook"><Mail size={14} />Email</button>
        <button className="btn btn-ghost btn-sm" onClick={onEdit}><Pencil size={14} /></button>
        <button className="btn btn-ghost btn-sm" onClick={onDel} style={{ marginLeft: "auto" }}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

/* ---------------- Calendar ---------------- */
const CALKEY = "cadence:caldnotes:v1";
function loadCalNotes() { try { const v = localStorage.getItem(CALKEY); if (v) return JSON.parse(v); } catch (e) {} return {}; }
function saveCalNotes(n) { try { localStorage.setItem(CALKEY, JSON.stringify(n)); } catch (e) {} }
/* ---------------- Tracker (Excel-style sheet) ---------------- */
const TRACKER_KEY = "cadence:tracker:v2";
const SHEETS_KEY = "cadence:tracker:sheets:v1";
const DEFAULT_SHEETS = [
  { id: "main", label: "All Projects" },
  { id: "culvers", label: "Culvers" },
  { id: "aldi", label: "Aldi" },
  { id: "costco", label: "Costco" },
];
function loadSheets() { try { const v = localStorage.getItem(SHEETS_KEY); if (v) return JSON.parse(v); } catch (e) {} return DEFAULT_SHEETS; }
function saveSheets(s) { try { localStorage.setItem(SHEETS_KEY, JSON.stringify(s)); } catch (e) {} }
function sheetKey(id) { return id === "main" ? TRACKER_KEY : `cadence:tracker:sheet:${id}`; }
function loadTracker(id = "main") { try { const v = localStorage.getItem(sheetKey(id)); if (v) { const p = JSON.parse(v); return Array.isArray(p) ? { rows: p } : p; } } catch (e) {} return null; }
function saveTracker(d, id = "main") { try { localStorage.setItem(sheetKey(id), JSON.stringify(d)); } catch (e) {} }
const TRACKER_BLOCK = new Set(["SEATTLE", "DALLAS", "IOWA", "OTHERS", "COM-1"]);
const trackerEmailFor = (name) => {
  const parts = String(name || "").trim().split(/\s+/).map(p => p.replace(/[^A-Za-z]/g, "")).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length >= 2) return `${parts[0].toLowerCase()}.${parts[parts.length - 1].toLowerCase()}@rtmec.com`;
  return `${parts[0].toLowerCase()}@rtmec.com`;
};
const rowEmails = (r) => {
  const out = [];
  ["pm", "ml", "me", "pe", "ee", "fp"].forEach(k => String(r[k] || "").split(/\n| and /).forEach(part => {
    const nm = part.trim(); if (!nm) return;
    const e = trackerEmailFor(nm); if (e && !out.includes(e)) out.push(e);
  }));
  return out;
};
const ALL_NAMES = Object.keys(EMAIL_DIR).map(k => k.replace(/\b\w/g, c => c.toUpperCase()));

function RoleCell({ value, onSave, effLight, theme }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [sugIdx, setSugIdx] = useState(-1);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const taRef = useRef(null);
  const pickingRef = useRef(false);

  const names = String(value || "").split(/\n| and /).map(s => s.trim()).filter(Boolean);

  const commit = (text) => {
    setEditing(false);
    setSuggestions([]);
    onSave(text.split(/\n/).map(s => s.trim()).filter(Boolean).join("\n"));
  };

  // Get the last partial word on the last line to drive suggestions
  const getLastWord = (text) => {
    const lastLine = text.split("\n").pop() || "";
    return lastLine.trim();
  };

  const handleChange = (e) => {
    const text = e.target.value;
    setDraft(text);
    const word = getLastWord(text);
    if (word.length >= 1) {
      const wl = word.toLowerCase();
      const matches = ALL_NAMES.filter(n => n.toLowerCase().includes(wl)).slice(0, 8);
      if (taRef.current) {
        const r = taRef.current.getBoundingClientRect();
        setDropPos({ top: r.bottom, left: r.left });
      }
      setSuggestions(matches);
      setSugIdx(-1);
    } else {
      setSuggestions([]);
    }
  };

  const pickSuggestion = (name) => {
    const lines = draft.split("\n");
    lines[lines.length - 1] = name;
    const next = lines.join("\n");
    setDraft(next);
    setSuggestions([]);
    setSugIdx(-1);
    taRef.current?.focus();
  };

  const handleKey = (e) => {
    if (suggestions.length === 0) {
      if (e.key === "Escape") commit(draft);
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setSugIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSugIdx(i => Math.max(i - 1, -1)); }
    else if ((e.key === "Enter" || e.key === "Tab") && sugIdx >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[sugIdx]);
    } else if (e.key === "Escape") {
      setSuggestions([]);
    }
  };

  if (editing) {
    return (
      <div style={{ position: "relative" }}>
        <textarea ref={taRef} className="trk-role-edit" autoFocus rows={Math.max(1, draft.split("\n").length)}
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKey}
          onBlur={() => { if (!pickingRef.current) commit(draft); }} />
        {suggestions.length > 0 && createPortal(
          <div style={{ position: "fixed", top: dropPos.top, left: dropPos.left, zIndex: 9999, background: theme === "light" ? "#fff" : theme === "twilight" ? "#2E2B50" : "#172E4B", border: `1px solid ${theme === "light" ? "#c0cad8" : theme === "twilight" ? "#423E6E" : "#26456B"}`, borderRadius: 8, boxShadow: "0 8px 28px rgba(0,0,0,.35)", minWidth: 220, overflow: "hidden" }}>
            {suggestions.map((s, i) => (
              <div key={s} data-suggestion="1" tabIndex={-1}
                onMouseDown={e => { e.preventDefault(); pickingRef.current = true; pickSuggestion(s); setTimeout(() => { pickingRef.current = false; }, 100); }}
                style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", background: i === sugIdx ? "#E03A3E" : "transparent", color: i === sugIdx ? "#fff" : theme === "light" ? "#1b2330" : "#E4DEFF", fontFamily: "Outfit", fontWeight: 500 }}>
                {s}
              </div>
            ))}
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className="trk-role" onDoubleClick={() => { setDraft(names.join("\n")); setEditing(true); }} title="Double-click to edit">
      {names.length === 0 ? <span style={{ color: "#b9c1cd", paddingLeft: 8 }}>—</span> :
        names.map((n, i) => { const e = trackerEmailFor(n); return <div key={i}>{e ? <a href={"mailto:" + e} onClick={ev => ev.stopPropagation()}>{n}</a> : <span>{n}</span>}</div>; })}
    </div>
  );
}
const TRACKER_COLS = [
  { key: "projectName", label: "Project Name", w: 250, sticky: true },
  { key: "rowNumber", label: "Row #", w: 60 },
  { key: "internalLocation", label: "Internal Location", w: 130 },
  { key: "mepCentralHost", label: "MEP Central Host", w: 150 },
  { key: "vantagepoint", label: "Vantagepoint #", w: 130 },
  { key: "client", label: "Client", w: 190 },
  { key: "pm", label: "PM", w: 150 },
  { key: "ml", label: "ML", w: 150 },
  { key: "me", label: "ME", w: 170 },
  { key: "pe", label: "PE", w: 170 },
  { key: "ee", label: "EE", w: 170 },
  { key: "fp", label: "FP", w: 150 },
  { key: "statusNotes", label: "Status Notes", w: 200 },
  { key: "dueDates", label: "Due Dates", w: 100 },
  { key: "bidPermitDate", label: "Bid/Permit Date", w: 120 },
  { key: "bidPermitNote", label: "Bid/Permit Note", w: 150 },
  { key: "qaqc", label: "QAQC", w: 90 },
  { key: "stamp", label: "Stamp", w: 110 },
  { key: "stage", label: "Stage", w: 170 },
];
function TrackerView({ ctx }) {
  const { effLight, theme } = ctx;
  const [sheets, setSheets] = useState(() => loadSheets());
  const [activeSheet, setActiveSheet] = useState("main");
  const [renamingSheet, setRenamingSheet] = useState(null);

  const switchSheet = (id) => {
    // save current sheet before switching
    setActiveSheet(id);
  };

  const addSheet = () => {
    const label = window.prompt("Sheet name:");
    if (!label || !label.trim()) return;
    const id = "sheet_" + uid();
    const next = [...sheets, { id, label: label.trim() }];
    setSheets(next);
    saveSheets(next);
    setActiveSheet(id);
  };

  const deleteSheet = (id) => {
    if (sheets.length <= 1) { alert("Can't delete the last sheet."); return; }
    if (!window.confirm(`Delete sheet "${sheets.find(s => s.id === id)?.label}"?`)) return;
    try { localStorage.removeItem(sheetKey(id)); } catch (e) {}
    const next = sheets.filter(s => s.id !== id);
    setSheets(next);
    saveSheets(next);
    if (activeSheet === id) setActiveSheet(next[0].id);
  };

  const renameSheet = (id, label) => {
    const next = sheets.map(s => s.id === id ? { ...s, label } : s);
    setSheets(next);
    saveSheets(next);
    setRenamingSheet(null);
  };

  const [data, setData] = useState(() => {
    const s = loadTracker(activeSheet);
    const rs = (s && s.rows) || (activeSheet === "main" ? SEED_TRACKER : []);
    return rs.map((r, i) => r._id ? r : { ...r, _id: "r" + (r.rowNumber || i) });
  });
  const [cols, setCols] = useState(() => { const s = loadTracker(activeSheet); return ((s && s.cols) || TRACKER_COLS).filter(c => c.key !== "rowNumber"); });
  const [statuses, setStatuses] = useState(() => { const s = loadTracker(activeSheet); if (s && s.statuses) return s.statuses; const rs = (s && s.rows) || SEED_TRACKER; return Array.from(new Set(rs.map(r => r.stage).filter(Boolean))); });

  // Reload data when sheet changes
  useEffect(() => {
    const s = loadTracker(activeSheet);
    const rs = (s && s.rows) || (activeSheet === "main" ? SEED_TRACKER : []);
    setData(rs.map((r, i) => r._id ? r : { ...r, _id: "r" + (r.rowNumber || i) }));
    setCols((s && s.cols) ? s.cols.filter(c => c.key !== "rowNumber") : TRACKER_COLS.filter(c => c.key !== "rowNumber"));
    setStatuses(s && s.statuses ? s.statuses : Array.from(new Set(rs.map(r => r.stage).filter(Boolean))));
  }, [activeSheet]);
  const apiOk = useRef(false);
  const curV = useRef(0);
  const lastSave = useRef(0);
  const applyingRemote = useRef(false);
  const buildDoc = () => ({ rows: data.map(r => ({ ...r, emails: rowEmails(r) })), cols, statuses });
  // Load from the shared DB on open, then poll for others' changes (near real-time).
  useEffect(() => {
    let timer, cancelled = false;
    (async () => {
      try {
        const doc = await apiLoad();
        apiOk.current = true;
        if (doc && doc.rows) {
          applyingRemote.current = true;
          setData(doc.rows.map((r, i) => r._id ? r : { ...r, _id: "r" + (r.rowNumber || i) }));
          if (doc.cols) setCols(doc.cols);
          if (doc.statuses) setStatuses(doc.statuses);
          curV.current = doc.v || 0;
        } else {
          const res = await apiSave(buildDoc()); if (res && res.v) curV.current = res.v;
        }
      } catch (e) { apiOk.current = false; }
      if (cancelled) return;
      timer = setInterval(async () => {
        if (!apiOk.current) return;
        try {
          const doc = await apiLoad();
          if (doc && doc.v > curV.current && Date.now() - lastSave.current > 2500) {
            applyingRemote.current = true;
            setData((doc.rows || []).map((r, i) => r._id ? r : { ...r, _id: "r" + (r.rowNumber || i) }));
            if (doc.cols) setCols(doc.cols);
            if (doc.statuses) setStatuses(doc.statuses);
            curV.current = doc.v;
          }
        } catch (e) {}
      }, 7000);
    })();
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, []);
  // Persist: local cache always; push to the DB (debounced) unless we just applied a remote change.
  useEffect(() => {
    saveTracker({ cols, rows: data, statuses }, activeSheet);
    if (applyingRemote.current) { applyingRemote.current = false; return; }
    if (!apiOk.current) return;
    const t = setTimeout(async () => {
      try { const res = await apiSave(buildDoc()); lastSave.current = Date.now(); if (res && res.v) curV.current = res.v; } catch (e) {}
    }, 700);
    return () => clearTimeout(t);
  }, [cols, data, statuses]);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("all");
  const [person, setPerson] = useState("all");
  const [personDropOpen, setPersonDropOpen] = useState(false);
  const [personSearch, setPersonSearch] = useState("");
  const personDropRef = useRef(null);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const ROLE_KEYS = ["pm", "ml", "me", "pe", "ee", "fp"];
  const namesIn = (r) => ROLE_KEYS.flatMap(k => String(r[k] || "").split(/\n| and /).map(s => s.trim()).filter(s => s && !TRACKER_BLOCK.has(s.toUpperCase())));
  const people = ["all", ...Array.from(new Set(data.flatMap(namesIn))).sort()];
  const ql = q.trim().toLowerCase();
  const rows = data.filter(r => {
    if (stage !== "all" && r.stage !== stage) return false;
    if (person !== "all" && !namesIn(r).includes(person)) return false;
    if (ql && !(`${r.projectName} ${r.client} ${r.vantagepoint} ${r.pm} ${r.ml} ${r.me} ${r.pe} ${r.ee} ${r.fp}`.toLowerCase().includes(ql))) return false;
    return true;
  });
  const STATUS_PALETTE = ["#E03A3E", "#E8A53C", "#33B36B", "#4FA8E8", "#9A6BF0", "#E0734A", "#2E80C2", "#C56BD6"];
  const statusColor = (s) => { const i = statuses.indexOf(s); return i >= 0 ? STATUS_PALETTE[i % STATUS_PALETTE.length] : "#7686A0"; };
  const update = (id, key, value) => setData(ds => ds.map(r => r._id === id ? { ...r, [key]: value } : r));
  const setStatus = (id, val) => { if (val === "__new") { const n = window.prompt("New status name:"); if (!n || !n.trim()) return; const nm = n.trim(); setStatuses(ss => ss.includes(nm) ? ss : [...ss, nm]); update(id, "stage", nm); return; } update(id, "stage", val); };
  const addRow = () => setData(ds => [{ _id: "r" + uid() }, ...ds]);
  const delRow = (id) => setData(ds => ds.filter(r => r._id !== id));
  const dropOnRow = (targetId) => { setData(ds => { if (!dragId || dragId === targetId) return ds; const from = ds.findIndex(r => r._id === dragId); const to = ds.findIndex(r => r._id === targetId); if (from < 0 || to < 0) return ds; const c = [...ds]; const [m] = c.splice(from, 1); c.splice(to, 0, m); return c; }); setDragId(null); setOverId(null); };
  const moveRow = (id, dir) => setData(ds => {
    const vis = ds.filter(r => rows.some(x => x._id === r._id));
    const vi = vis.findIndex(r => r._id === id); const tgt = vis[vi + dir]; if (!tgt) return ds;
    const a = ds.findIndex(r => r._id === id), b = ds.findIndex(r => r._id === tgt._id);
    const c = [...ds]; [c[a], c[b]] = [c[b], c[a]]; return c;
  });
  const [showColSettings, setShowColSettings] = useState(false);
  const [hiddenCols, setHiddenCols] = useState(() => { try { const v = localStorage.getItem("cadence:tracker:hidden"); return v ? JSON.parse(v) : []; } catch { return []; } });
  const toggleCol = (key) => setHiddenCols(prev => { const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]; localStorage.setItem("cadence:tracker:hidden", JSON.stringify(next)); return next; });
  const visibleCols = cols.filter(c => !hiddenCols.includes(c.key));
  useEffect(() => {
    if (!personDropOpen) return;
    const handler = (e) => { if (personDropRef.current && !personDropRef.current.contains(e.target)) setPersonDropOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [personDropOpen]);

  const addCol = () => { const label = window.prompt("New column name:"); if (!label || !label.trim()) return; setCols(cs => [...cs, { key: "c_" + uid(), label: label.trim(), w: 150 }]); };
  const delCol = (key) => { if (!window.confirm("Delete this column?")) return; setCols(cs => cs.filter(c => c.key !== key)); };
  const moveCol = (key, dir) => setCols(cs => { const i = cs.findIndex(c => c.key === key); const j = i + dir; if (j < 0 || j >= cs.length) return cs; const c = [...cs]; [c[i], c[j]] = [c[j], c[i]]; return c; });
  const startResize = (e, key, startW) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX; let raf = 0, latest = startW;
    const onMove = (ev) => { latest = Math.max(50, startW + (ev.clientX - startX)); if (!raf) raf = requestAnimationFrame(() => { raf = 0; setCols(cs => cs.map(c => c.key === key ? { ...c, w: latest } : c)); }); };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); if (raf) cancelAnimationFrame(raf); setCols(cs => cs.map(c => c.key === key ? { ...c, w: latest } : c)); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };
  const emailTeam = (row) => {
    const em = rowEmails(row);
    if (!em.length) return;
    const u = new URLSearchParams();
    u.set("to", em.join(","));
    u.set("subject", `[${row.projectName}] `);
    window.open(`https://outlook.office.com/mail/deeplink/compose?${u.toString()}`, "_blank");
  };
  const GUT = 46;
  const cell = { border: "1px solid var(--line)", padding: "5px 8px", fontSize: 12.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", background: "var(--panel)" };
  const headc = { ...cell, background: "var(--panel2)", fontWeight: 700, color: "var(--ink)", position: "sticky", top: 0, zIndex: 3 };
  const colBtn = { border: "none", background: "transparent", cursor: "pointer", color: "var(--muted)", fontSize: 14, fontWeight: 700, lineHeight: 1, padding: "0 1px" };
  const actBtn = { border: "none", background: "transparent", cursor: "pointer", color: "var(--muted)", display: "inline-grid", placeItems: "center", padding: 2 };
  return (
    <>
      <div className="head">
        <div><div className="h-title">Tracker</div><div className="h-sub">Your COM project tracker — every project and assignment, like the sheet.</div></div>
      </div>
      {/* Sheet tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 0, flexWrap: "wrap", borderBottom: "2px solid var(--line)", paddingBottom: 0, justifyContent: "flex-start" }}>
        {sheets.map(s => (
          <div key={s.id} style={{ position: "relative", display: "flex", alignItems: "center" }}>
            {renamingSheet === s.id ? (
              <input autoFocus defaultValue={s.label}
                onBlur={e => renameSheet(s.id, e.target.value.trim() || s.label)}
                onKeyDown={e => { if (e.key === "Enter") renameSheet(s.id, e.target.value.trim() || s.label); if (e.key === "Escape") setRenamingSheet(null); }}
                style={{ fontFamily: "Outfit", fontSize: 15, fontWeight: 600, border: "1px solid var(--teal)", borderRadius: "8px 8px 0 0", padding: "9px 14px", background: "var(--panel2)", color: "var(--ink)", outline: "none", width: 140 }} />
            ) : (
              <button onDoubleClick={() => setRenamingSheet(s.id)} onClick={() => switchSheet(s.id)}
                style={{ fontFamily: "Outfit", fontSize: 15, fontWeight: 600, border: "none", borderRadius: "8px 8px 0 0", padding: "10px 20px", cursor: "pointer", background: activeSheet === s.id ? "var(--panel)" : "var(--panel2)", color: activeSheet === s.id ? "var(--ink)" : "var(--muted)", borderBottom: activeSheet === s.id ? "2px solid var(--primary)" : "2px solid transparent", marginBottom: -2, transition: ".12s" }}>
                {s.label}
              </button>
            )}
            {activeSheet === s.id && sheets.length > 1 && (
              <button onClick={() => deleteSheet(s.id)} title="Delete sheet" style={{ position: "absolute", right: 4, top: 6, background: "none", border: "none", cursor: "pointer", color: "var(--dim)", fontSize: 14, lineHeight: 1, padding: "0 2px" }}>×</button>
            )}
          </div>
        ))}
        <button onClick={addSheet} title="Add sheet" style={{ fontFamily: "Outfit", fontSize: 15, fontWeight: 700, border: "none", borderRadius: "8px 8px 0 0", padding: "10px 16px", cursor: "pointer", background: "transparent", color: "var(--muted)", marginBottom: -2, transition: ".12s" }}>+ New Sheet</button>
      </div>

      <div className="panel" style={{ padding: 12, width: "96vw", maxWidth: "96vw", marginLeft: "calc(-48vw + 50%)", borderTopLeftRadius: 0 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search project, client, person, VP#…"
              style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 10, border: "1px solid var(--line2)", background: "var(--bg)", color: "var(--ink)", fontFamily: "Outfit", fontSize: 14, outline: "none" }} />
          </div>
          <select className="btn" value={stage} onChange={e => setStage(e.target.value)}>
            <option value="all">All statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div ref={personDropRef} style={{ position: "relative" }}>
            <button className="btn" onClick={() => { setPersonDropOpen(v => !v); setPersonSearch(""); }}
              style={{ minWidth: 130, justifyContent: "space-between", gap: 8 }}>
              <span>{person === "all" ? "All people" : person}</span>
              <ChevronDown size={13} />
            </button>
            {personDropOpen && createPortal(
              (() => {
                const bg     = theme === "light" ? "#fff"     : theme === "twilight" ? "#2E2B50" : "#172E4B";
                const bg2    = theme === "light" ? "#F6F9FD"  : theme === "twilight" ? "#252340" : "#11223A";
                const border = theme === "light" ? "#C4D0E2"  : theme === "twilight" ? "#423E6E" : "#26456B";
                const ink    = theme === "light" ? "#16243A"  : theme === "twilight" ? "#E4DEFF" : "#E9EFF7";
                const muted  = theme === "light" ? "#566884"  : theme === "twilight" ? "#9B94CC" : "#90A2BC";
                const hover  = theme === "light" ? "#EDF1F8"  : theme === "twilight" ? "#373462" : "#1E3A5C";
                const accent = "#E03A3E";
                return (
                  <div onMouseDown={e => e.stopPropagation()}
                    style={{ position: "fixed", top: (personDropRef.current?.getBoundingClientRect().bottom ?? 0) + 4, left: personDropRef.current?.getBoundingClientRect().left ?? 0, zIndex: 9999, background: bg, border: `1px solid ${border}`, borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,.35)", width: 220, overflow: "hidden" }}>
                    <div style={{ padding: "8px 8px 4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, background: bg2, border: `1px solid ${border}`, borderRadius: 7, padding: "5px 9px" }}>
                        <Search size={13} style={{ color: muted, flexShrink: 0 }} />
                        <input autoFocus value={personSearch} onChange={e => setPersonSearch(e.target.value)}
                          placeholder="Search people…"
                          style={{ background: "none", border: "none", outline: "none", fontFamily: "Outfit", fontSize: 13, color: ink, width: "100%" }} />
                      </div>
                    </div>
                    <div style={{ maxHeight: 240, overflowY: "auto", padding: "4px 6px 8px" }}>
                      {people
                        .filter(s => s === "all" || s.toLowerCase().includes(personSearch.toLowerCase()))
                        .map(s => (
                          <div key={s} onClick={() => { setPerson(s); setPersonDropOpen(false); setPersonSearch(""); }}
                            style={{ padding: "7px 10px", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: s === person ? 700 : 400, color: s === person ? accent : ink, background: s === person ? hover : "transparent" }}
                            onMouseEnter={e => e.currentTarget.style.background = hover}
                            onMouseLeave={e => e.currentTarget.style.background = s === person ? hover : "transparent"}>
                            {s === "all" ? "All people" : s}
                          </div>
                        ))}
                      {people.filter(s => s === "all" || s.toLowerCase().includes(personSearch.toLowerCase())).length === 0 &&
                        <div style={{ padding: "8px 10px", fontSize: 13, color: muted }}>No match</div>}
                    </div>
                  </div>
                );
              })(),
              document.body
            )}
          </div>
          <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{rows.length} of {data.length} projects</span>
          <div style={{ flex: 1 }} />
          <button className="btn btn-sm" onClick={addRow}><Plus size={14} />Row</button>
          <button className="btn btn-sm" onClick={addCol}><Plus size={14} />Column</button>
          <div style={{ position: "relative" }}>
            <button className="btn btn-sm" onClick={() => setShowColSettings(v => !v)} title="Show/hide columns" style={{ gap: 6 }}>
              <Settings size={14} />{hiddenCols.length > 0 && <span style={{ background: "var(--primary)", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 5px" }}>{hiddenCols.length}</span>}Columns
            </button>
            {showColSettings && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50, background: "var(--panel2)", border: "1px solid var(--line2)", borderRadius: 14, padding: "10px 12px", minWidth: 200, boxShadow: "0 16px 40px rgba(0,0,0,.45)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 8 }}>Show / Hide Columns</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 320, overflowY: "auto" }}>
                  {cols.map(c => (
                    <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", padding: "5px 6px", borderRadius: 8, background: hiddenCols.includes(c.key) ? "transparent" : "var(--raise)" }}>
                      <input type="checkbox" checked={!hiddenCols.includes(c.key)} onChange={() => toggleCol(c.key)} style={{ accentColor: "var(--primary)", width: 14, height: 14, cursor: "pointer" }} />
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: hiddenCols.includes(c.key) ? "var(--dim)" : "var(--ink)" }}>{c.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--line)", display: "flex", gap: 6 }}>
                  <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center", fontSize: 12 }} onClick={() => setHiddenCols([]) || localStorage.removeItem("cadence:tracker:hidden")}>Show all</button>
                  <button className="btn btn-sm" style={{ fontSize: 12 }} onClick={() => setShowColSettings(false)}>Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <style>{`.trk-table input{width:100%;box-sizing:border-box;border:none;background:transparent;font-family:'Outfit';font-size:12.5px;color:var(--ink);padding:5px 8px;outline:none;}
.trk-table input:focus{background:var(--raise);box-shadow:inset 0 0 0 2px var(--teal);border-radius:2px;}
.trk-table select.trk-status{width:100%;box-sizing:border-box;border:none;font-family:'Outfit';font-size:12px;font-weight:600;padding:5px 6px;outline:none;cursor:pointer;border-radius:2px;}
.trk-gut{cursor:grab;}
.trk-role{padding:4px 8px;line-height:1.55;cursor:default;min-height:26px;}
.trk-role a{color:var(--teal);text-decoration:none;}
.trk-role a:hover{text-decoration:underline;}
.trk-table textarea.trk-role-edit{width:100%;box-sizing:border-box;border:none;background:var(--raise);box-shadow:inset 0 0 0 2px var(--teal);font-family:'Outfit';font-size:12.5px;color:var(--ink);padding:4px 8px;outline:none;resize:vertical;line-height:1.55;}`}</style>
        <div style={{ overflow: "auto", maxHeight: "84vh", border: "1px solid var(--line)", borderRadius: 8 }}>
          <table className="trk-table" style={{ borderCollapse: "collapse", width: "max-content", minWidth: "100%", background: "var(--panel)" }}>
            <thead>
              <tr>
                <th style={{ ...headc, width: GUT, minWidth: GUT, left: 0, zIndex: 6, background: "var(--raise)" }}></th>
                {visibleCols.map((c, ci) => (
                  <th key={c.key} style={{ ...headc, width: c.w, minWidth: c.w, ...(c.sticky ? { left: GUT, zIndex: 5 } : {}) }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, paddingRight: 6 }}>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</span>
                      <button title="Move left" onClick={() => moveCol(c.key, -1)} disabled={ci === 0} style={colBtn}>‹</button>
                      <button title="Move right" onClick={() => moveCol(c.key, 1)} disabled={ci === visibleCols.length - 1} style={colBtn}>›</button>
                    </div>
                    <div onMouseDown={e => startResize(e, c.key, c.w)} title="Drag to resize column" style={{ position: "absolute", top: 0, right: 0, width: 6, height: "100%", cursor: "col-resize", userSelect: "none" }} />
                  </th>
                ))}
                <th style={{ ...headc, width: 64, minWidth: 64 }}>Email</th>
                <th style={{ ...headc, width: 96, minWidth: 96 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => {
                const em = rowEmails(r);
                return (
                <tr key={r._id || ri}
                  onDragOver={e => { if (dragId) { e.preventDefault(); if (overId !== r._id) setOverId(r._id); } }}
                  onDrop={e => { e.preventDefault(); dropOnRow(r._id); }}
                  style={{ opacity: dragId === r._id ? 0.4 : 1, boxShadow: overId === r._id && dragId && dragId !== r._id ? "inset 0 2px 0 #2563c9" : "none" }}>
                  <td className="trk-gut" draggable onDragStart={() => setDragId(r._id)} onDragEnd={() => { setDragId(null); setOverId(null); }} title="Drag to reorder"
                    style={{ ...cell, width: GUT, minWidth: GUT, position: "sticky", left: 0, zIndex: 1, background: "var(--panel2)", color: "var(--muted)", textAlign: "center", fontSize: 11.5, fontWeight: 600, userSelect: "none" }}>{ri + 1}</td>
                  {visibleCols.map(c => {
                    const isRole = ROLE_KEYS.includes(c.key);
                    return (
                    <td key={c.key} style={{ ...cell, width: c.w, minWidth: c.w, maxWidth: c.w, padding: 0, verticalAlign: isRole ? "top" : "middle", whiteSpace: isRole ? "normal" : "nowrap", fontWeight: c.key === "projectName" ? 600 : 400, ...(c.sticky ? { position: "sticky", left: GUT, zIndex: 1, background: "var(--panel)" } : {}) }}>
                      {isRole ? (
                        <RoleCell value={r[c.key]} onSave={v => update(r._id, c.key, v)} effLight={effLight} theme={theme} />
                      ) : c.key === "stage" ? (
                        <select className="trk-status" value={r.stage || ""} onChange={e => setStatus(r._id, e.target.value)}
                          style={{ color: r.stage ? statusColor(r.stage) : "#9aa6b6", background: r.stage ? statusColor(r.stage) + "1f" : "transparent" }}>
                          <option value="">—</option>
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                          <option value="__new">➕ New status…</option>
                        </select>
                      ) : (
                        <input key={r._id + "-" + c.key} defaultValue={r[c.key]} title={r[c.key]} style={{ fontWeight: c.key === "projectName" ? 600 : 400 }}
                          onBlur={e => { if (e.target.value !== (r[c.key] ?? "")) update(r._id, c.key, e.target.value); }} />
                      )}
                    </td>
                    );
                  })}
                  <td style={{ ...cell, textAlign: "center", width: 64, minWidth: 64 }}>
                    <button title={em.length ? `Email team (${em.length})` : "No team emails"} disabled={!em.length}
                      onClick={() => emailTeam(r)}
                      style={{ border: "none", background: "transparent", cursor: em.length ? "pointer" : "not-allowed", color: em.length ? "#2563c9" : "#c2c8d0", display: "grid", placeItems: "center", width: "100%" }}>
                      <Mail size={15} />
                    </button>
                  </td>
                  <td style={{ ...cell, width: 96, minWidth: 96, textAlign: "center", padding: "2px 4px" }}>
                    <button title="Move up" onClick={() => moveRow(r._id, -1)} style={actBtn}><ChevronUp size={15} /></button>
                    <button title="Move down" onClick={() => moveRow(r._id, 1)} style={actBtn}><ChevronDown size={15} /></button>
                    <button title="Delete row" onClick={() => { if (window.confirm("Delete this row?")) delRow(r._id); }} style={{ ...actBtn, color: "#c0392b" }}><Trash2 size={14} /></button>
                  </td>
                </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={cols.length + 3} style={{ ...cell, textAlign: "center", padding: 24, color: "#777" }}>No projects match.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="foot-note" style={{ marginTop: 10, justifyContent: "flex-start" }}><Mail size={12} /> Names link to email (click to send); double-click a role cell to edit (one name per line) · drag the row number to reorder · "Row" adds to the top · Stage is a status dropdown.</div>
      </div>
    </>
  );
}

function CalendarView({ ctx }) {
  const gd = ctx.gantt;
  const gotoGantt = ctx.gotoGantt;
  const gComplete = (g) => g.members.length > 0 && g.members.every(m => m.done);
  const [cur, setCur] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [notes, setNotes] = useState(loadCalNotes);
  useEffect(() => { saveCalNotes(notes); }, [notes]);
  const [dayOpen, setDayOpen] = useState(null);

  const first = new Date(cur.y, cur.m, 1);
  const startDow = first.getDay();
  const days = new Date(cur.y, cur.m + 1, 0).getDate();
  const today = todayISO();
  const monthName = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const byDay = {};
  const add = (iso, ev) => { if (!iso) return; (byDay[iso] = byDay[iso] || []).push(ev); };
  gd.projects.filter(p => !p.deleted).forEach(p => {
    add(p.due, { type: "project", label: p.name, color: "var(--primary)", pid: p.id, done: !!p.done });
    p.groups.forEach(g => add(g.end, { type: "task", label: g.name, color: "var(--teal)", pid: p.id, done: gComplete(g) }));
  });

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const SIZE = { S: 10.5, M: 12.5, L: 15 };
  const setNote = (iso, patch) => setNotes(n => ({ ...n, [iso]: { text: "", size: "M", ...(n[iso] || {}), ...patch } }));
  const delNote = (iso) => setNotes(n => { const c = { ...n }; delete c[iso]; return c; });

  return (
    <>
      <div className="head"><div><div className="h-title">Calendar</div><div className="h-sub">Project & task due dates, by day. Click a day to leave a note.</div></div>
        <div style={{ display: "flex", gap: 12, fontSize: 11.5, color: "var(--muted)", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--primary)" }} />project due</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--teal)" }} />task due</span>
        </div>
      </div>
      <div className="panel">
        <div className="cal-head">
          <div className="cal-m">{monthName}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn icon-btn" onClick={() => setCur(c => { const m = c.m - 1; return m < 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m }; })}><ChevronLeft size={17} /></button>
            <button className="btn btn-sm" onClick={() => { const d = new Date(); setCur({ y: d.getFullYear(), m: d.getMonth() }); }}>Today</button>
            <button className="btn icon-btn" onClick={() => setCur(c => { const m = c.m + 1; return m > 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m }; })}><ChevronRight size={17} /></button>
          </div>
        </div>
        <div className="cal-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div className="cal-dow" key={d}>{d}</div>)}
          {cells.map((d, i) => {
            if (d === null) return <div className="cal-cell blank" key={"b" + i} />;
            const iso = `${cur.y}-${String(cur.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const evs = byDay[iso] || [];
            const note = notes[iso];
            return (
              <div className={`cal-cell ${iso === today ? "today" : ""}`} key={iso} onClick={() => setDayOpen(iso)} style={{ cursor: "pointer" }}>
                <div className="cal-num">{d}</div>
                {evs.slice(0, 3).map((ev, j) => (
                  <div className={`cal-ev ${ev.done ? "done" : ""}`} key={j} style={{ background: ev.color }} title={`Open ${ev.label} in Gantt`}
                    onClick={(e) => { e.stopPropagation(); gotoGantt(ev.pid); }}>{ev.label}</div>
                ))}
                {evs.length > 3 && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>+{evs.length - 3} more</div>}
                {note && note.text && <div style={{ marginTop: 3, background: "rgba(232,165,60,.16)", border: "1px solid rgba(232,165,60,.3)", borderRadius: 6, padding: "3px 5px", fontSize: SIZE[note.size] || 12.5, color: "var(--ink)", lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{note.text}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {dayOpen && (() => {
        const note = notes[dayOpen] || { text: "", size: "M" };
        const dateLabel = new Date(dayOpen + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
        const evs = byDay[dayOpen] || [];
        return (
          <div className="ov" onClick={() => setDayOpen(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-h"><h2>{dateLabel}</h2><button className="btn btn-ghost icon-btn" onClick={() => setDayOpen(null)}><X size={18} /></button></div>
              {evs.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Due this day</div>
                  {evs.map((ev, j) => (
                    <div key={j} className="row-i" style={{ padding: "6px 4px" }} onClick={() => { gotoGantt(ev.pid); setDayOpen(null); }}>
                      <span style={{ width: 9, height: 9, borderRadius: 99, background: ev.color }} />
                      <span style={{ flex: 1, fontSize: 13.5, textDecoration: ev.done ? "line-through" : "none", color: ev.done ? "var(--muted)" : "var(--ink)" }}>{ev.label} <span style={{ fontSize: 11, color: "var(--dim)" }}>· {ev.type}</span></span>
                      <ChevronRight size={15} color="var(--dim)" />
                    </div>
                  ))}
                </div>
              )}
              <div className="fld">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ marginBottom: 0 }}>Note</label>
                  <div className="mode-pick" style={{ gap: 2 }}>
                    {["S", "M", "L"].map(s => <button key={s} className={(note.size || "M") === s ? "on" : ""} onClick={() => setNote(dayOpen, { size: s })}>{s}</button>)}
                  </div>
                </div>
                <textarea value={note.text} onChange={e => setNote(dayOpen, { text: e.target.value })} placeholder="Write a quick note for this day…" style={{ fontSize: SIZE[note.size] || 12.5, minHeight: 90, resize: "vertical" }} autoFocus />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-pri" style={{ flex: 1, justifyContent: "center" }} onClick={() => setDayOpen(null)}><Check size={15} />Done</button>
                {notes[dayOpen] && <button className="btn" onClick={() => { delNote(dayOpen); setDayOpen(null); }}><Trash2 size={15} />Delete note</button>}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

/* ---------------- Task modal ---------------- */
function TaskModal({ task, people, projects, onClose, onSave, onDelete }) {
  const [f, setF] = useState(task);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const save = () => { if (!f.title.trim()) return; const { _new, ...rest } = f; onSave(rest); };
  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h2>{task._new ? "New task" : "Edit task"}</h2><button className="btn btn-ghost icon-btn" onClick={onClose}><X size={18} /></button></div>
        <div className="fld"><label>Task</label><input autoFocus value={f.title} onChange={e => set("title", e.target.value)} placeholder="What needs doing?" /></div>
        <div className="fld"><label>Notes</label><textarea value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional details…" /></div>
        <div className="row2">
          <div className="fld"><label>Assignee</label><select value={f.assigneeId} onChange={e => set("assigneeId", e.target.value)}><option value="">Unassigned</option>{people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="fld"><label>Project</label><select value={f.projectId} onChange={e => set("projectId", e.target.value)}><option value="">None</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        </div>
        <div className="row2">
          <div className="fld"><label>Start date</label><input type="date" value={f.start || ""} onChange={e => set("start", e.target.value)} /></div>
          <div className="fld"><label>Due date</label><input type="date" value={f.due || ""} onChange={e => set("due", e.target.value)} /></div>
        </div>
        <div className="row2">
          <div className="fld"><label>Status</label><select value={f.status} onChange={e => set("status", e.target.value)}><option value="todo">To do</option><option value="doing">In progress</option><option value="done">Done</option></select></div>
          <div className="fld"><label>Priority</label>
            <div className="pri-pick">
              {["low", "med", "high"].map(p => <button key={p} className={f.priority === p ? "on" : ""} onClick={() => set("priority", p)}><span style={{ width: 8, height: 8, borderRadius: 99, background: PRIO[p], display: "inline-block" }} />{p}</button>)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn btn-pri" style={{ flex: 1, justifyContent: "center" }} onClick={save}><Check size={16} />Save</button>
          {onDelete && <button className="btn" onClick={onDelete}><Trash2 size={15} /></button>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Person modal ---------------- */
function PersonModal({ person, onClose, onSave }) {
  const [f, setF] = useState(person);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const save = () => { if (!f.name.trim()) return; const { _new, ...rest } = f; onSave(rest); };
  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h2>{person._new ? "Add person" : "Edit person"}</h2><button className="btn btn-ghost icon-btn" onClick={onClose}><X size={18} /></button></div>
        <div className="fld"><label>Name</label><input autoFocus value={f.name} onChange={e => set("name", e.target.value)} placeholder="Full name" /></div>
        <div className="fld"><label>Role</label><input value={f.role} onChange={e => set("role", e.target.value)} placeholder="e.g. Designer, Lead, Developer" /></div>
        <div className="fld"><label>Email (for Outlook)</label><input value={f.email} onChange={e => set("email", e.target.value)} placeholder="name@rtmec.com" /></div>
        <div className="fld"><label>Color</label><div className="swatches">{PALETTE.map(c => <span key={c} className={`swatch ${f.color === c ? "on" : ""}`} style={{ background: c }} onClick={() => set("color", c)} />)}</div></div>
        <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} onClick={save}><Check size={16} />Save</button>
      </div>
    </div>
  );
}

/* ---------------- Project modal ---------------- */
function ProjectModal({ project, onClose, onSave }) {
  const [f, setF] = useState(project);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const save = () => { if (!f.name.trim()) return; const { _new, ...rest } = f; onSave(rest); };
  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h2>{project._new ? "Add project" : "Edit project"}</h2><button className="btn btn-ghost icon-btn" onClick={onClose}><X size={18} /></button></div>
        <div className="fld"><label>Project name</label><input autoFocus value={f.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Website Refresh" /></div>
        <div className="fld"><label>Color</label><div className="swatches">{PALETTE.map(c => <span key={c} className={`swatch ${f.color === c ? "on" : ""}`} style={{ background: c }} onClick={() => set("color", c)} />)}</div></div>
        <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} onClick={save}><Check size={16} />Save</button>
      </div>
    </div>
  );
}

function ProfileModal({ user, onClose, onSave }) {
  const [about, setAbout] = useState(user.about || "");
  const [color, setColor] = useState(user.color || "#6E83A2");
  const [avatar, setAvatar] = useState(user.avatar || null);
  const [bg, setBg] = useState(user.bg || "");
  const [email, setEmail] = useState(user.email || "");
  const fileRef = useRef(null);
  const pickPhoto = (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) { alert("Please choose an image under ~1.5 MB."); return; }
    const r = new FileReader(); r.onload = () => { setAvatar(r.result); onSave({ avatar: r.result }); }; r.readAsDataURL(file);
  };
  const preview = { name: user.name, color, avatar };
  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h2>Your profile</h2><button className="btn btn-ghost icon-btn" onClick={onClose}><X size={18} /></button></div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <UserAv u={preview} size={64} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button className="btn btn-sm" onClick={() => fileRef.current && fileRef.current.click()}><Plus size={13} />Upload photo</button>
            {avatar && <button className="btn btn-ghost btn-sm" style={{ color: "#ff8a8c" }} onClick={() => { setAvatar(null); onSave({ avatar: null }); }}><X size={13} />Remove photo</button>}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={pickPhoto} />
          </div>
        </div>
        {!avatar && <div className="fld"><label>Avatar color</label><div className="swatches">{["#6E83A2", ...PALETTE].map(c => <span key={c} className={`swatch ${color === c ? "on" : ""}`} style={{ background: c }} onClick={() => { setColor(c); onSave({ color: c }); }} />)}</div></div>}
        <div className="fld"><label>Email (set from your login — change it if you like)</label><input value={email} onChange={e => { setEmail(e.target.value); onSave({ email: e.target.value.trim() }); }} placeholder="you@company.com" /></div>
        <div className="fld"><label>About you</label><textarea value={about} onChange={e => { setAbout(e.target.value); onSave({ about: e.target.value }); }} placeholder="Role, what you handle, anything your team should know…" /></div>
        <div className="fld"><label>App background color</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {BG_PRESETS.map(p => (
              <button key={p.name} className="btn btn-sm" onClick={() => { setBg(p.css); onSave({ bg: p.css }); }} style={{ borderColor: bg === p.css ? "var(--teal)" : "var(--line2)", color: bg === p.css ? "var(--teal)" : "var(--muted)" }}>
                <span style={{ width: 13, height: 13, borderRadius: 4, background: p.css || "var(--line2)", border: "1px solid var(--line2)" }} />{p.name}
              </button>
            ))}
          </div>
        </div>
        <div className="login-foot" style={{ marginBottom: 8 }}>Changes save automatically.</div>
        <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}><Check size={16} />Done</button>
      </div>
    </div>
  );
}

/* ---------------- Sign in ---------------- */
function MicrosoftLogo() {
  return (<span className="ms-logo"><span style={{ background: "#F25022" }} /><span style={{ background: "#7FBA00" }} /><span style={{ background: "#00A4EF" }} /><span style={{ background: "#FFB900" }} /></span>);
}
function LoginScreen({ onSignIn }) {
  const [step, setStep] = useState("start");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [remember, setRemember] = useState(true);
  const finish = () => {
    const display = name.trim() || (email.split("@")[0] || "You").replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    onSignIn({ name: display, email: email.trim() || "you@rtmec.com" });
  };
  return (
    <div className="login">
      <div className="login-card">
        <span className="demo-tag"><ShieldCheck size={13} />Preview sign-in</span>
        <div className="login-mark"><LayoutGrid size={26} /></div>
        <h1>Cadence</h1>
        <p>Sign in with your rtmec Microsoft account to continue.</p>
        {step === "start" ? (
          <>
            <button className="ms-btn" onClick={() => setStep("account")}><MicrosoftLogo /> Sign in with Microsoft</button>
            <div className="login-foot"><ShieldCheck size={13} /> Only @rtmec.com accounts — no separate password.</div>
          </>
        ) : (
          <div style={{ textAlign: "left" }}>
            <div className="fld"><label>Work email</label><input autoFocus type="email" placeholder="you@rtmec.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && finish()} /></div>
            <div className="fld"><label>Your name</label><input placeholder="First Last" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && finish()} /></div>
            <div className="rem" onClick={() => setRemember(r => !r)}><span className={`rb ${remember ? "on" : ""}`}>{remember && <Check size={12} />}</span>Remember me on this device</div>
            <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={finish}><Check size={16} /> Continue</button>
            <div className="login-foot" style={{ marginTop: 14 }}>In the live version this is the real Microsoft login — it fills in automatically.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Email the whole team ---------------- */
function TeamEmailModal({ project, members, fromUser, onClose, onSend }) {
  const withEmail = members.filter(m => m.email);
  const [selected, setSelected] = useState(() => new Set(withEmail.map(m => m.id)));
  const [mode, setMode] = useState("to");
  const [subject, setSubject] = useState(`[${project.name}] `);
  const [body, setBody] = useState("");
  const toggle = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOn = selected.size === withEmail.length && withEmail.length > 0;
  const send = () => {
    const emails = withEmail.filter(m => selected.has(m.id)).map(m => m.email);
    if (!emails.length) return;
    onSend({ toEmails: mode === "to" ? emails : [], ccEmails: mode === "cc" ? emails : [], subject, body });
  };
  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h2>Email team — {project.name}</h2><button className="btn btn-ghost icon-btn" onClick={onClose}><X size={18} /></button></div>
        <div className="from-line"><Mail size={14} /> Sending from <b>{fromUser?.email}</b> — always from you, never anyone else.</div>
        {withEmail.length === 0 ? (
          <div className="empty-sm" style={{ paddingBottom: 16 }}>Nobody on this project has an email saved yet. Add emails in the Team tab first.</div>
        ) : (
          <>
            <div className="fld" style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ marginBottom: 0 }}>Recipients</label>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(allOn ? new Set() : new Set(withEmail.map(m => m.id)))}>{allOn ? "Clear all" : "Select all"}</button>
              </div>
            </div>
            <div className="rcp" style={{ marginBottom: 13 }}>
              {withEmail.map(m => {
                const on = selected.has(m.id);
                return (
                  <div className="rcp-row" key={m.id} onClick={() => toggle(m.id)}>
                    <span className={`rcp-box ${on ? "on" : ""}`}>{on && <Check size={12} />}</span>
                    <span className="rcp-av" style={{ background: m.color }}>{initials(m.name)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}><div className="rcp-name">{m.name}</div><div className="rcp-role">{m.role || "—"} · {m.email}</div></div>
                  </div>
                );
              })}
            </div>
            <div className="fld"><label>Add everyone selected to</label>
              <div className="mode-pick">
                <button className={mode === "to" ? "on" : ""} onClick={() => setMode("to")}>To</button>
                <button className={mode === "cc" ? "on" : ""} onClick={() => setMode("cc")}>CC</button>
              </div>
            </div>
            <div className="fld"><label>Subject</label><input value={subject} onChange={e => setSubject(e.target.value)} /></div>
            <div className="fld"><label>Message</label><textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your update…" /></div>
            <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={send}><Send size={16} /> Open in Outlook — {selected.size} {selected.size === 1 ? "person" : "people"}</button>
            <div className="login-foot" style={{ marginTop: 12 }}>Opens an Outlook email with everyone filled in. The live version sends it silently.</div>
          </>
        )}
      </div>
    </div>
  );
}
