// All app CSS lives in this one template string (was the top of App.jsx).
export const css = `
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
