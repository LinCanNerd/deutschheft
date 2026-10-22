/* Deutschheft app: state & storage, sessions, views, Claude features. Depends on content.js and engine.js. */
(function () {
  "use strict";
  const E = window.DH_ENGINE, C = E.C, esc = E.esc;
  const LS_KEY = "deutschheft:v1";
  const $ = (sel) => document.querySelector(sel);
  const main = $("#main");

  // ---------- icons ----------
  const svg = (p, fill) => `<svg class="icon" viewBox="0 0 24 24" fill="${fill ? "currentColor" : "none"}" stroke="${fill ? "none" : "currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I = {
    home: svg('<rect x="4.5" y="3" width="15" height="18" rx="2"/><path d="M8.5 3v18M12 8h4.5M12 12h4.5"/>'),
    path: svg('<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7.5a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H16"/>'),
    cards: svg('<rect x="3" y="7" width="13" height="14" rx="2"/><path d="M7 3h11a2 2 0 0 1 2 2v12"/>'),
    write: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    medal: svg('<circle cx="12" cy="9" r="5.5"/><path d="M8.6 13.4 7 21l5-2.6 5 2.6-1.6-7.6"/>'),
    flame: svg('<path d="M12 22c4.1 0 7-2.9 7-7 0-4.6-3.6-7.2-4.4-11.5C12 5 10.3 7.6 10.5 10.4 9.3 9.8 8.6 8.5 8.4 7 6.3 9 5 11.8 5 15c0 4.1 2.9 7 7 7z"/>', true),
    close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    sparkle: svg('<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7"/>'),
  };
  const sayBtn = (t) => `<button class="icon-btn" data-act="say" data-say="${esc(t)}" aria-label="Listen" title="Listen"><span class="i-say"></span></button>`;

  const WD = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const WD2 = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const MON = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  // ---------- state ----------
  let S = null, CAT = null;
  const UI = { view: "home", lessonU: 1, lessonA: null, q: "", fu: "all", fs: "all", session: null, summary: null, drawer: null, write: null, wres: null, askQ: "", askOut: null };
  const RT = { db: null, refs: null, sample: null, sync: "connecting", syncMsg: "", ctl: null, lastInput: null };
  // Inside Claude the page is framed with window.claude; the offline desktop build runs without it.
  const IN_CLAUDE = !!(window.claude && typeof window.claude.use === "function");
  const CLAUDE_URL = "https://claude.ai/artifact/BFzYLpAtdphhvZ32DZzzzD";

  function freshState() {
    const t = Date.now();
    return {
      v: 1, updatedAt: 0, cards: {}, custom: [],
      prof: {
        xp: 0, created: t, started: { 1: t }, read: {}, days: {}, newDay: { d: "", n: 0 }, concepts: {}, mistakes: [], badges: {}, writing: [], bosses: {},
        stats: { sessions: 0, answers: 0, correct: 0, genderOk: 0, bestCombo: 0, perfect: 0, writes: 0, bossWins: 0, early: 0, night: 0 },
        settings: { newPerDay: 8, sessionLen: 15, goal: 60, autoSay: true, strictCaps: false },
      },
    };
  }
  function normalize(st) {
    const f = freshState();
    if (!st || typeof st !== "object") return f;
    const out = { v: 1, updatedAt: +st.updatedAt || 0, cards: st.cards && typeof st.cards === "object" ? st.cards : {}, custom: Array.isArray(st.custom) ? st.custom : [] };
    const p = Object.assign(f.prof, st.prof && typeof st.prof === "object" ? st.prof : {});
    p.stats = Object.assign(freshState().prof.stats, p.stats || {});
    p.settings = Object.assign(freshState().prof.settings, p.settings || {});
    for (const k of ["days", "concepts", "badges", "bosses", "started", "read"]) if (!p[k] || typeof p[k] !== "object" || Array.isArray(p[k])) p[k] = {};
    for (const k of ["mistakes", "writing"]) if (!Array.isArray(p[k])) p[k] = [];
    if (!Object.keys(p.started).length) p.started[1] = Date.now();
    if (!p.newDay || typeof p.newDay !== "object") p.newDay = { d: "", n: 0 };
    p.xp = +p.xp || 0;
    out.prof = p;
    return out;
  }
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const hasProgress = (st) => st.prof.xp > 0 || Object.keys(st.cards).length > 0 || st.custom.length > 0;

  // ---------- storage: the Claude account database when available, this browser otherwise ----------
  const Store = {
    dirty: new Set(), timer: null, busy: false,
    loadLocal() { try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } },
    saveLocal() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* storage may be blocked */ } },
    touch(...parts) {
      S.updatedAt = Date.now();
      pruneOld();
      this.saveLocal();
      FileSave.schedule();
      parts.forEach((p) => this.dirty.add(p));
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), 1500);
    },
    payload(part) {
      return part === "cards" ? { cards: S.cards, updatedAt: S.updatedAt } : { prof: S.prof, custom: S.custom, updatedAt: S.updatedAt };
    },
    async flush() {
      if (RT.sync !== "cloud" || !RT.refs || this.busy || !this.dirty.size) return;
      this.busy = true;
      let part = null;
      try {
        while (this.dirty.size) {
          part = [...this.dirty][0];
          this.dirty.delete(part);
          await RT.refs[part].set(clone(this.payload(part)));
        }
        RT.syncMsg = "";
      } catch (e) {
        const code = e && e.code;
        if (code === "quota_exceeded") { RT.sync = "local"; RT.syncMsg = "Your account storage for this page is full, so progress is saved in this browser only."; }
        else if (["invalid_argument", "not_granted", "revoked", "capability_disabled", "capability_removed"].includes(code)) {
          RT.sync = "local"; RT.syncMsg = "This page can't save to your account here, so progress is saved in this browser only.";
        } else {
          if (part) this.dirty.add(part);
          RT.syncMsg = "Couldn't reach your account just now. Retrying.";
          setTimeout(() => this.flush(), 8000 + Math.random() * 4000);
        }
        renderTop();
      } finally { this.busy = false; }
    },
  };
  function pruneOld() {
    const keys = Object.keys(S.prof.days).sort();
    if (keys.length > 420) for (const k of keys.slice(0, keys.length - 420)) delete S.prof.days[k];
    if (S.prof.mistakes.length > 40) S.prof.mistakes.length = 40;
    if (S.prof.writing.length > 12) S.prof.writing.length = 12;
  }
  // ---------- local files: an auto-saved progress file (File System Access API) and backup files ----------
  const IDB = {
    open() {
      return new Promise((res, rej) => {
        const r = indexedDB.open("deutschheft", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("kv");
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    },
    async run(mode, fn) {
      try {
        const db = await this.open();
        return await new Promise((res, rej) => { const req = fn(db.transaction("kv", mode).objectStore("kv")); req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
      } catch (e) { return null; }
    },
    get: (k) => IDB.run("readonly", (s) => s.get(k)),
    set: (k, v) => IDB.run("readwrite", (s) => s.put(v, k)),
    del: (k) => IDB.run("readwrite", (s) => s.delete(k)),
  };
  const FILE_TYPES = [{ description: "Deutschheft progress", accept: { "application/json": [".json"] } }];
  function parseBackup(text) {
    try {
      const d = JSON.parse(text);
      return d && typeof d === "object" && d.prof && d.cards ? d : null;
    } catch (e) { return null; }
  }
  // state: none | on (writing after every change) | ask (needs permission again) | missing (file moved or deleted)
  const FileSave = {
    ok: !IN_CLAUDE && typeof window.showSaveFilePicker === "function" && typeof indexedDB !== "undefined",
    handle: null, state: "none", last: 0, busy: false, again: false, timer: null,
    async init() {
      if (!this.ok) return;
      const h = await IDB.get("saveFile");
      if (!h) return;
      this.handle = h;
      let p = "prompt";
      try { p = await h.queryPermission({ mode: "readwrite" }); } catch (e) { /* treat as prompt */ }
      this.state = p === "granted" ? "on" : "ask";
      if (this.state === "on") await this.pull();
      safeRender();
    },
    // Combine the file with this app's progress (it may hold work saved from another computer through a synced folder),
    // then write the result back so both have everything.
    async pull() {
      try {
        const data = parseBackup(await (await this.handle.getFile()).text());
        if (data) {
          const merged = normalize(E.mergeStates(S, normalize(data)));
          if (E.progressKey(merged) !== E.progressKey(S)) {
            S = merged;
            rebuild();
            Store.saveLocal();
            toast(`Added progress from ${this.handle.name}.`);
          }
        }
        this.schedule(0);
      } catch (e) {
        this.state = e && e.name === "NotFoundError" ? "missing" : "ask";
      }
    },
    async choose() {
      try {
        const h = await window.showSaveFilePicker({ suggestedName: "deutschheft-progress.json", startIn: "documents", types: FILE_TYPES });
        this.handle = h; this.state = "on";
        await IDB.set("saveFile", h);
        await this.write();
        toast(`Saving to ${h.name} after every answer.`);
      } catch (e) { if (!e || e.name !== "AbortError") toast("Couldn't use that file. Try another location."); }
      render();
    },
    async open() {
      try {
        const [h] = await window.showOpenFilePicker({ types: FILE_TYPES, multiple: false });
        const data = parseBackup(await (await h.getFile()).text());
        if (!data) { toast("That file isn't a Deutschheft save file."); return; }
        offerReplace(data, h.name, h);
      } catch (e) { if (!e || e.name !== "AbortError") toast("Couldn't open that file."); }
    },
    async adopt(h) {
      let p = "prompt";
      try { p = await h.requestPermission({ mode: "readwrite" }); } catch (e) { /* stays prompt */ }
      this.handle = h; this.state = p === "granted" ? "on" : "ask";
      await IDB.set("saveFile", h);
      if (this.state === "on") await this.write();
    },
    async reconnect() {
      if (!this.handle) return;
      try {
        const p = await this.handle.requestPermission({ mode: "readwrite" });
        if (p === "granted") { this.state = "on"; await this.pull(); await this.write(); toast(`Saving to ${this.handle.name} again.`); }
      } catch (e) { this.state = "missing"; }
      render();
    },
    async forget() {
      await IDB.del("saveFile");
      this.handle = null; this.state = "none";
      toast("Stopped saving to the file. Your progress is still kept in the app.");
      render();
    },
    schedule(ms = 1200) {
      if (this.state !== "on") return;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.write(), ms);
    },
    async write() {
      if (this.state !== "on" || !this.handle) return;
      if (this.busy) { this.again = true; return; }
      this.busy = true;
      try {
        const w = await this.handle.createWritable();
        await w.write(JSON.stringify(S, null, 1));
        await w.close();
        this.last = Date.now();
      } catch (e) {
        this.state = e && e.name === "NotFoundError" ? "missing" : "ask";
        renderTop();
      } finally {
        this.busy = false;
        if (this.again) { this.again = false; this.schedule(300); }
      }
    },
  };
  function offerReplace(data, source, handle) {
    if (!hasProgress(S)) { applyState(data, handle, "replace"); toast(`Loaded ${source}.`); return; }
    UI.drawer = { type: "replace", data, source, handle };
    renderDrawer();
  }
  // merge: keep both sides' progress. replace: this data wins, here and wherever else this account or file is used.
  async function applyState(data, handle, mode) {
    if (mode === "merge") {
      // the learner asked for both, so an earlier reset here doesn't filter the file out
      const incoming = normalize(data);
      if (S.prof.resetAt) incoming.prof.resetAt = Math.max(+incoming.prof.resetAt || 0, S.prof.resetAt);
      S = normalize(E.mergeStates(S, incoming));
    } else {
      S = normalize(data);
      if (hasProgress(S)) S.prof.resetAt = Date.now();
    }
    rebuild();
    UI.write = null; UI.wres = null; UI.summary = null;
    Store.touch("cards", "profile");
    if (handle) await FileSave.adopt(handle);
    render();
  }
  async function exportFile() {
    const name = `deutschheft-backup-${todayK()}.json`, txt = JSON.stringify(S, null, 1);
    if (IN_CLAUDE) {
      let dl = null;
      try { dl = await window.claude.use("downloads"); } catch (e) { dl = null; }
      if (!dl) { UI.drawer = { type: "backup" }; renderDrawer(); return; }
      try { await dl.save({ filename: name, data: txt }); toast("Backup file saved."); }
      catch (e) { if (!e || e.code !== "declined") { UI.drawer = { type: "backup" }; renderDrawer(); } }
      return;
    }
    const url = URL.createObjectURL(new Blob([txt], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast(`Downloaded ${name}.`);
  }

  async function initCloud() {
    const cl = window.claude;
    if (!cl || typeof cl.use !== "function") { RT.sync = "local"; RT.syncMsg = "Saved on this computer."; renderTop(); return; }
    let db = null, user = null, sample = null;
    try { [db, user, sample] = await Promise.all([cl.use("db"), cl.use("user"), cl.use("sample")]); } catch (e) { /* treat as absent */ }
    RT.sample = sample || null;
    try {
      const uid = user ? await user.id() : null;
      if (!db || !uid) { RT.sync = "local"; RT.syncMsg = "Sign in to Claude to keep progress across devices. For now it's saved in this browser."; safeRender(); return; }
      RT.db = db;
      RT.refs = { cards: db.doc(`data/users/${uid}/cards`), profile: db.doc(`data/users/${uid}/profile`) };
      const [c, p] = await Promise.all([RT.refs.cards.get(), RT.refs.profile.get()]);
      const cd = c.exists ? c.data() : null, pd = p.exists ? p.data() : null;
      const remoteT = Math.max(cd ? +cd.updatedAt || 0 : 0, pd ? +pd.updatedAt || 0 : 0);
      RT.sync = "cloud";
      if (cd || pd) {
        // combine the account copy with this browser's copy; save back whatever the account was missing
        const remote = normalize(clone({ updatedAt: remoteT, cards: cd ? cd.cards : {}, prof: pd ? pd.prof : null, custom: pd ? pd.custom : [] }));
        const merged = normalize(E.mergeStates(S, remote));
        const key = E.progressKey(merged);
        if (key !== E.progressKey(S)) { S = merged; rebuild(); Store.saveLocal(); }
        if (key !== E.progressKey(remote)) Store.touch("cards", "profile");
      } else if (hasProgress(S)) {
        Store.dirty.add("cards"); Store.dirty.add("profile"); Store.flush();
      }
    } catch (e) {
      RT.sync = "local"; RT.syncMsg = "Couldn't load your account data, so progress is saved in this browser.";
    }
    safeRender();
  }

  // ---------- speech ----------
  const Speech = {
    ok: typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined",
    voice: null,
    init() {
      if (!this.ok) { document.body.classList.add("no-speech"); return; }
      const pickVoice = () => {
        try {
          const vs = speechSynthesis.getVoices();
          this.voice = vs.find((v) => /^de[-_]DE/i.test(v.lang)) || vs.find((v) => /^de/i.test(v.lang)) || null;
        } catch (e) { this.voice = null; }
      };
      pickVoice();
      try { speechSynthesis.addEventListener("voiceschanged", pickVoice); } catch (e) { /* older browsers */ }
    },
    hasVoice() { return !!this.voice; },
    say(t) {
      if (!this.ok || !t) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(t);
        u.lang = "de-DE";
        if (this.voice) u.voice = this.voice;
        u.rate = 0.88;
        speechSynthesis.speak(u);
      } catch (e) { /* ignore */ }
    },
  };

  // ---------- derived data ----------
  const todayK = () => E.dayKey(Date.now());
  const dayRec = (k = todayK()) => S.prof.days[k] || (S.prof.days[k] = { xp: 0, n: 0, ok: 0 });
  const todayXP = () => (S.prof.days[todayK()] || {}).xp || 0;
  const newToday = () => (S.prof.newDay.d === todayK() ? S.prof.newDay.n : 0);
  function streak() {
    const has = (d) => ((S.prof.days[E.dayKey(d.getTime())] || {}).xp || 0) > 0;
    const cur = new Date(); cur.setHours(12, 0, 0, 0);
    if (!has(cur)) cur.setDate(cur.getDate() - 1);
    let n = 0;
    while (has(cur)) { n++; cur.setDate(cur.getDate() - 1); }
    return n;
  }
  function started() {
    const s = new Set([0]);
    for (const k of Object.keys(S.prof.started)) s.add(+k);
    return s;
  }
  const ctx = () => ({ cat: CAT, state: S.cards, started: started(), prof: S.prof, voice: Speech.hasVoice() });
  const rebuild = () => { CAT = E.buildCatalog(S.custom); };
  function learnedWords() {
    let n = 0;
    for (const [id, st] of Object.entries(S.cards)) if ((id[0] === "v" || id[0] === "c") && st && (st.s === "review" || st.s === "relearn")) n++;
    return n;
  }
  const xpFor = (L) => 50 * L * (L - 1);
  function level(xp) {
    let L = 1;
    while (xp >= xpFor(L + 1)) L++;
    const rank = L < 5 ? ["Lehrling", "Apprentice"] : L < 12 ? ["Geselle", "Journeyman"] : L < 25 ? ["Meister", "Master"] : ["Obermeister", "Guild master"];
    return { L, cur: xp - xpFor(L), need: xpFor(L + 1) - xpFor(L), rank };
  }
  function unitStats(u) {
    const ids = CAT.byUnit[u] || [];
    let m = 0, seen = 0;
    for (const id of ids) { const st = S.cards[id]; m += E.mastery(st); if (st && st.s !== "new") seen++; }
    return { total: ids.length, seen, mastery: ids.length ? m / ids.length : 0, words: ids.filter((i) => i[0] === "v").length, skills: ids.filter((i) => i[0] === "s").length };
  }
  function correctPlain(ex) {
    if (ex.kind === "type") return ex.noun ? ex.noun.art + " " + ex.noun.word : ex.accepts[0];
    return ex.sayAfter || ex.answer || "";
  }
  const stripHtml = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
  function relDue(st) {
    if (!st || st.s === "new") return "—";
    if (st.sus) return "paused";
    const d = Math.round((E.dayStart(st.d) - E.dayStart(Date.now())) / E.DAY);
    if (st.d <= Date.now()) return "due now";
    return d <= 0 ? "later today" : d === 1 ? "tomorrow" : `in ${d} days`;
  }

  // ---------- badges ----------
  const BADGES = [
    { id: "first", de: "Erste Schritte", en: "Finish your first session", s: "1", test: (p) => p.stats.sessions >= 1 },
    { id: "w10", de: "Wortsammler", en: "Learn 10 words", s: "10", test: () => learnedWords() >= 10 },
    { id: "w50", de: "Wortschatz", en: "Learn 50 words", s: "50", test: () => learnedWords() >= 50 },
    { id: "w150", de: "Schatzmeister", en: "Learn 150 words", s: "150", test: () => learnedWords() >= 150 },
    { id: "s3", de: "Dranbleiber", en: "Study 3 days in a row", s: "3T", test: () => streak() >= 3 },
    { id: "s7", de: "Wochenwerk", en: "7-day streak", s: "7T", test: () => streak() >= 7 },
    { id: "s30", de: "Monatsmeister", en: "30-day streak", s: "30T", test: () => streak() >= 30 },
    { id: "gender", de: "Der-Die-Das-Detektiv", en: "Get 50 genders right", s: "DDD", test: (p) => p.stats.genderOk >= 50 },
    { id: "perfect", de: "Fehlerfrei", en: "A session of 10+ answers with no mistake", s: "1,0", test: (p) => p.stats.perfect >= 1 },
    { id: "combo", de: "Im Fluss", en: "15 right in a row", s: "15×", test: (p) => p.stats.bestCombo >= 15 },
    { id: "boss", de: "Schwachstelle besiegt", en: "Beat a weak-spot drill", s: "!", test: (p) => p.stats.bossWins >= 1 },
    { id: "writer", de: "Schreiberling", en: "Get 5 texts checked", s: "✎", test: (p) => p.stats.writes >= 5 },
    { id: "early", de: "Frühaufsteher", en: "Study before 7 am", s: "6:59", test: (p) => !!p.stats.early },
    { id: "night", de: "Nachteule", en: "Study after 10 pm", s: "22h", test: (p) => !!p.stats.night },
    { id: "units", de: "Pfadfinder", en: "Start 4 units", s: "IV", test: (p) => Object.keys(p.started).length >= 4 },
  ];
  function checkBadges() {
    const got = [];
    for (const b of BADGES) if (!S.prof.badges[b.id] && b.test(S.prof)) { S.prof.badges[b.id] = Date.now(); got.push(b); }
    return got;
  }
  const stamp = (b, locked) => `<div class="badge ${locked ? "locked" : ""}"><div class="stamp" aria-hidden="true">${esc(b.s)}</div><div class="bn">${esc(b.de)}</div><div class="be">${esc(b.en)}</div></div>`;
  // A Fehlerheft line: correction mark, question, your answer → the right one, how often, and a link to the rule
  const mistRow = (m, ruleLink) => `<div class="mist"><span class="mm">${esc(m.m || "f")}</span><div><div class="mq">${esc(m.q)}${m.n > 1 ? ` <span class="mn" title="Missed ${m.n} times">×${m.n}</span>` : ""}</div>` +
    `<div class="ma">${m.a ? `<s>${esc(m.a)}</s> → ` : ""}<b>${esc(m.c)}</b>${ruleLink && m.k && C.CONCEPTS[m.k] ? ` <button class="link" data-act="lesson" data-u="${C.CONCEPTS[m.k].u}" data-a="${esc(C.CONCEPTS[m.k].a)}">rule</button>` : ""}</div></div></div>`;

  // ---------- rendering ----------
  const TABS = [["home", "Today", I.home], ["path", "Path", I.path], ["cards", "Cards", I.cards], ["write", "Write", I.write], ["profile", "Progress", I.medal]];
  function renderNav() {
    const cur = UI.view === "lesson" ? "path" : UI.view === "summary" ? "home" : UI.view;
    const h = TABS.map(([v, l, ic]) => `<button class="tab" data-act="nav" data-v="${v}" ${cur === v ? 'aria-current="page"' : ""}>${ic}<span>${l}</span></button>`).join("");
    $("#tabs").innerHTML = h;
    $("#bottomnav").innerHTML = h;
  }
  function ring(val, goal, size, stroke, label) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r, f = Math.min(1, goal ? val / goal : 0);
    return `<svg viewBox="0 0 ${size} ${size}" class="${size > 40 ? "goal-ring" : "ring-mini"}" role="img" aria-label="${esc(label)}">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" style="fill:none;stroke:var(--heat-0)" stroke-width="${stroke}"/>` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" style="fill:none;stroke:${f >= 1 ? "var(--das)" : "var(--accent)"}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>` +
      (size > 40 ? `<text x="50%" y="47%" text-anchor="middle" dominant-baseline="middle" font-size="${size * 0.24}">${val}</text><text x="50%" y="68%" text-anchor="middle" font-size="${size * 0.12}" style="fill:var(--ink-3)">of ${goal} XP</text>` : "") + `</svg>`;
  }
  function renderTop() {
    if (!S) return;
    const st = streak(), lv = level(S.prof.xp), g = S.prof.settings.goal, tx = todayXP();
    $("#topstats").innerHTML =
      `<span class="stat stat-flame ${st ? "" : "off"}" title="${st} day streak">${I.flame}<span class="tnum">${st}</span></span>` +
      `<span class="stat" title="Today: ${tx} of ${g} XP">${ring(tx, g, 26, 4, `Today ${tx} of ${g} XP`)}<span class="tnum">${tx}</span></span>` +
      `<span class="stat stat-level" title="${lv.rank[1]}, level ${lv.L}">${esc(lv.rank[0])} · ${lv.L}</span>`;
  }
  function render() {
    if (!S) return;
    document.body.classList.toggle("in-session", UI.view === "session");
    renderNav();
    renderTop();
    let h = "";
    try {
      switch (UI.view) {
        case "path": h = viewPath(); break;
        case "lesson": h = viewLesson(); break;
        case "cards": h = viewCards(); break;
        case "write": h = viewWrite(); break;
        case "profile": h = viewProfile(); break;
        case "session": h = viewSession(); break;
        case "summary": h = viewSummary(); break;
        default: h = viewHome();
      }
    } catch (e) {
      console.error(e);
      h = `<div class="sheet pad stack"><h2>Something went wrong on this page</h2><p class="muted">${esc(e.message)}</p><button class="btn" data-act="nav" data-v="home">Back to today</button></div>`;
    }
    main.innerHTML = h;
    renderDrawer();
    afterRender();
  }
  // Re-render after async events without wiping something the learner is typing.
  function safeRender() {
    const a = document.activeElement;
    if (a && main.contains(a) && (a.tagName === "INPUT" || a.tagName === "TEXTAREA") && a.value) { renderTop(); return; }
    render();
  }
  function afterRender() {
    if (UI.view === "session" && UI.session) {
      const s = UI.session;
      const focusEl = s.phase === "feedback" || s.phase === "intro" ? $("#go") : $("#ans") || $("#b0");
      if (focusEl) focusEl.focus({ preventScroll: s.phase === "feedback" });
    }
    if (UI.view === "lesson" && UI.lessonA) {
      const el = document.getElementById("sec-" + UI.lessonA);
      UI.lessonA = null;
      if (el) {
        el.scrollIntoView({ block: "start" });
        el.classList.add("flash");
        setTimeout(() => el.classList.remove("flash"), 1600);
      }
    }
  }
  let toastT = null;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.textContent = ""; }, 3200);
  }
  const umlKeys = () => `<div class="uml" aria-label="Special letters">${["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"].map((c) => `<button type="button" data-act="uml" data-ch="${c}" tabindex="-1">${c}</button>`).join("")}</div>`;

  // ---------- home ----------
  function heatmap(weeks) {
    const goal = S.prof.settings.goal;
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const dow = (today.getDay() + 6) % 7;
    const start = new Date(today); start.setDate(today.getDate() - dow - (weeks - 1) * 7);
    let cells = "";
    for (let w = 0; w < weeks; w++) for (let d = 0; d < 7; d++) {
      const dt = new Date(start); dt.setDate(start.getDate() + w * 7 + d);
      if (dt > today) { cells += `<i class="future"></i>`; continue; }
      const xp = (S.prof.days[E.dayKey(dt.getTime())] || {}).xp || 0;
      const l = xp === 0 ? 0 : xp < goal * 0.5 ? 1 : xp < goal ? 2 : xp < goal * 2 ? 3 : 4;
      const isToday = dt.toDateString() === today.toDateString();
      cells += `<i class="l${l}${isToday ? " today" : ""}" title="${WD2[dt.getDay()]} ${dt.getDate()}.${dt.getMonth() + 1}.: ${xp} XP"></i>`;
    }
    return `<div class="heat" role="img" aria-label="Daily XP for the last ${weeks} weeks">${cells}</div>` +
      `<div class="heat-legend"><span>Less</span>${[0, 1, 2, 3, 4].map((l) => `<i class="l${l}"></i>`).join("")}<span>More</span><span style="margin-left:auto">Darkest = ${goal * 2}+ XP</span></div>`;
  }
  function nextStep() {
    const ups = [...started()].filter((u) => u > 0);
    const maxU = Math.max(...ups);
    if (!S.prof.read[maxU]) return { kind: "read", u: maxU };
    if (E.newCards(ctx()).length === 0 && maxU < C.UNITS.length) return { kind: "unit", u: maxU + 1 };
    return null;
  }
  function viewHome() {
    const t = Date.now(), cx = ctx();
    const plan = E.buildDaily(cx, S.prof.settings, newToday(), t);
    const n = plan.items.length, k = plan.counts;
    const d = new Date();
    const mins = Math.max(1, Math.round((k.review * 12 + k.fresh * 34 + k.weak * 15) / 60));
    const weak = E.weakList(S.prof);
    const ns = nextStep();
    const lv = level(S.prof.xp);
    const g = S.prof.settings.goal, tx = todayXP(), st = streak();
    // new cards from a unit whose lesson is still unread: the rule comes first
    const lessonFirst = n && k.fresh && ns && ns.kind === "read";
    let hero;
    if (n) {
      const LU = lessonFirst ? C.UNITS[ns.u - 1] : null;
      hero = `<h1><em>${n}</em> to practise</h1>
        <div class="counts">
          ${k.review ? `<span class="count"><b>${k.review}</b> reviews</span>` : ""}
          ${k.fresh ? `<span class="count new"><b>${k.fresh}</b> new</span>` : ""}
          ${k.weak ? `<span class="count weak"><b>${k.weak}</b> weak-spot drills</span>` : ""}
        </div>
        ${lessonFirst ? `<p class="muted small">Today's new cards come from Unit ${ns.u}. Its ${LU.min}-minute lesson explains the rules first.</p>
        <div class="hero-actions"><button class="btn btn-primary btn-lg" data-act="lesson" data-u="${ns.u}">Read lesson ${ns.u} first ${I.arrow}</button><button class="btn" data-act="start">Start practice</button><span class="muted small">practice: about ${mins} min</span></div>` :
        `<div class="hero-actions"><button class="btn btn-primary btn-lg" data-act="start">Start practice ${I.arrow}</button><span class="muted small">about ${mins} min</span></div>`}`;
    } else {
      const fresh = E.newCards(cx).length;
      hero = `<h1>All caught up</h1><p class="muted">Nothing is due right now. Cards come back on their own schedule, so come back tomorrow. Or keep going:</p>
        <div class="hero-actions">
          ${fresh ? `<button class="btn btn-primary" data-act="more-new">Learn ${Math.min(5, fresh)} more new cards</button>` : ""}
          <button class="btn" data-act="extra">Extra practice</button>
          <button class="btn" data-act="nav" data-v="write">${I.write} Write with Claude</button>
        </div>`;
    }
    const fs = FileSave.state;
    const fileBanner = fs !== "ask" && fs !== "missing" ? "" :
      `<section class="sheet next-step"><div class="ns-text"><h3>${fs === "ask" ? "Reconnect your save file" : "Your save file has moved"}</h3><p class="muted small">${fs === "ask" ?
        `The app needs your permission again to keep <b>${esc(FileSave.handle.name)}</b> up to date. Your progress is safe in the app meanwhile.` :
        `Couldn't find <b>${esc(FileSave.handle ? FileSave.handle.name : "your save file")}</b>. Choose where to save from now on.`}</p></div>
        <button class="btn btn-accent" data-act="${fs === "ask" ? "file-reconnect" : "file-choose"}">${fs === "ask" ? "Reconnect" : "Choose a save file"}</button></section>`;
    const nsHtml = !ns || lessonFirst ? "" : ns.kind === "read" ?
      `<section class="sheet next-step"><div class="ns-text"><h3>Read the Unit ${ns.u} lesson first</h3><p class="muted small">${esc(C.UNITS[ns.u - 1].de)}: ${esc(C.UNITS[ns.u - 1].en)}. About ${C.UNITS[ns.u - 1].min} minutes. Every exercise links back to it.</p></div><button class="btn btn-accent" data-act="lesson" data-u="${ns.u}">Read lesson ${ns.u}</button></section>` :
      `<section class="sheet next-step"><div class="ns-text"><h3>Ready for Unit ${ns.u}: ${esc(C.UNITS[ns.u - 1].de)}</h3><p class="muted small">You've met every card in the units you started. Next: ${esc(C.UNITS[ns.u - 1].en)}.</p></div><button class="btn" data-act="lesson" data-u="${ns.u}">Read lesson</button><button class="btn btn-accent" data-act="unit-start" data-u="${ns.u}">Start Unit ${ns.u}</button></section>`;
    const how = S.prof.stats.sessions ? "" : `<section class="how">
      <div class="sheet how-step"><span class="hn">1</span><h3>Learn the rule</h3><p>Each unit opens with a short lesson. You see why before you drill.</p></div>
      <div class="sheet how-step"><span class="hn">2</span><h3>Practise with reasons</h3><p>Every answer is explained, with the rule, a table and a link to the lesson. Claude can explain further.</p></div>
      <div class="sheet how-step"><span class="hn">3</span><h3>Your gaps get drilled</h3><p>Spaced repetition brings each card back just before you'd forget it. Grammar points you miss become weak spots with their own drills.</p></div>
    </section>`;
    const weakHtml = weak.length ? `<div class="weak-list">${weak.slice(0, 4).map((w) => `<div class="weak-item">
        <span class="wl">${esc(w.label)}</span>
        <span class="wm"><span class="bar red"><i style="width:${Math.round(w.acc * 100)}%"></i></span>${Math.round(w.acc * 100)}% of the last ${Math.min(10, w.h.length)}</span>
        <button class="btn btn-sm" data-act="drill" data-c="${esc(w.id)}">Drill 10</button></div>`).join("")}</div>` :
      `<div class="empty">No weak spots yet. When a grammar point drops below 75% over your last few tries, it shows up here with a drill.</div>`;
    const mist = S.prof.mistakes.slice(0, 6);
    const mistHtml = mist.length ? `<div class="mist-list">${mist.map((m) => mistRow(m, false)).join("")}</div>` :
      `<div class="empty">Your mistakes collect here with their corrections, like a Fehlerheft (mistakes notebook).</div>`;
    const units = C.UNITS.map((U) => {
      const us = unitStats(U.u), on = started().has(U.u);
      return `<button class="unit-mini ${on ? "" : "locked"}" data-act="lesson" data-u="${U.u}"><span class="un">${String(U.u).padStart(2, "0")}</span><span class="ut">${esc(U.de)}<small>${esc(U.en)}</small></span><span class="bar green"><i style="width:${Math.round(us.mastery * 100)}%"></i></span></button>`;
    }).join("");
    return `<div class="home">
      <section class="hero">
        <div class="sheet hero-main">
          <div class="hero-date"><span class="de">${WD[d.getDay()]}, ${d.getDate()}. ${MON[d.getMonth()]}</span><span class="eyebrow">Heute · today</span></div>
          ${hero}
        </div>
        <div class="hero-side">
          <div class="sheet goal">${ring(tx, g, 92, 9, `Today ${tx} of ${g} XP`)}<div><h3>${tx >= g ? "Goal reached" : "Daily goal"}</h3><p>${tx >= g ? "Tagesziel erreicht. Anything more is a bonus." : `${g - tx} XP to go today.`}</p><p>${I.flame.replace('class="icon"', 'class="icon" style="color:var(--red);vertical-align:-3px;width:16px;height:16px"')} ${st} day${st === 1 ? "" : "s"} in a row</p></div></div>
          <div class="sheet rank"><div class="rank-name"><h3>${esc(lv.rank[0])} · Stufe ${lv.L}</h3><span>${esc(lv.rank[1])}</span></div><div class="bar"><i style="width:${Math.round((lv.cur / lv.need) * 100)}%"></i></div><span class="muted small tnum">${lv.cur} / ${lv.need} XP to level ${lv.L + 1}</span></div>
        </div>
      </section>
      ${fileBanner}
      ${nsHtml}
      ${how}
      <div class="cols">
        <div class="stack">
          <section class="sheet pad"><div class="card-h"><h2>Weak spots <small>Schwachstellen</small></h2></div>${weakHtml}</section>
          <section class="sheet pad"><div class="card-h"><h2>Recent mistakes <small>Fehlerheft</small></h2></div>${mistHtml}</section>
        </div>
        <div class="stack">
          <section class="sheet pad"><div class="card-h"><h2>Your path <small>Lernpfad</small></h2><button class="link" data-act="nav" data-v="path">All units</button></div><div class="units-mini">${units}</div></section>
          <section class="sheet pad"><div class="card-h"><h2>Activity</h2><span class="muted small">last 15 weeks</span></div>${heatmap(15)}</section>
        </div>
      </div>
    </div>`;
  }

  // ---------- path & lessons ----------
  function viewPath() {
    const st = started();
    const rows = C.UNITS.map((U) => {
      const us = unitStats(U.u), on = st.has(U.u);
      const pct = Math.round(us.mastery * 100);
      const status = !on ? "Not started" : pct >= 90 ? "Mastered" : `${us.seen} of ${us.total} cards met`;
      return `<article class="sheet unit ${on ? "started" : ""}">
        <div class="unit-n">${String(U.u).padStart(2, "0")}</div>
        <div><h3>${esc(U.de)}<small>${esc(U.en)}</small></h3>
          <div class="unit-meta"><span class="bar green"><i style="width:${pct}%"></i></span><span>${status}</span><span>${us.words} words · ${us.skills} grammar skills</span>${S.prof.read[U.u] ? `<span>${I.check} lesson read</span>` : ""}</div></div>
        <div class="unit-actions">
          <button class="btn ${on ? "" : "btn-accent"}" data-act="lesson" data-u="${U.u}">Read lesson · ${U.min} min</button>
          ${on ? `<button class="btn" data-act="extra" data-u="${U.u}">Practise</button>` : `<button class="btn" data-act="unit-start" data-u="${U.u}">Start unit</button>`}
          ${us.seen < us.total ? `<button class="btn btn-ghost btn-sm" data-act="unit-known" data-u="${U.u}">I know this</button>` : ""}
        </div>
      </article>`;
    }).join("");
    return `<div class="stack">
      <div class="section-h"><div><div class="eyebrow">Lernpfad · A1</div><h1 style="font-size:var(--t-2xl)">Your path</h1></div></div>
      <p class="muted prose">Each unit starts with a short lesson that explains the grammar. Start a unit and its new cards join your daily practice, a few at a time. Already know a unit? Mark it as known and its cards come back once for a quick check instead.</p>
      <div class="path">${rows}</div></div>`;
  }
  function viewLesson() {
    const U = C.UNITS.find((x) => x.u === UI.lessonU) || C.UNITS[0];
    const on = started().has(U.u);
    const toc = U.lesson.map((s) => `<button data-act="toc" data-a="${s.id}">${esc(s.h)}</button>`).join("");
    const secs = U.lesson.map((s) => `<section class="lesson-sec prose" id="sec-${s.id}"><h2>${esc(s.h)}</h2>${s.html}</section>`).join("");
    const nextU = C.UNITS.find((x) => x.u === U.u + 1);
    return `<div class="lesson">
      <nav class="lesson-toc" aria-label="Sections"><button data-act="nav" data-v="path">← All units</button>${toc}</nav>
      <article class="sheet lesson-body">
        <div class="eyebrow">Unit ${U.u} · ${U.min} min read</div>
        <h1>${esc(U.de)}</h1>
        <p class="lede">${esc(U.en)}. Tap any German with a speaker to hear it.</p>
        ${secs}
        <div class="lesson-foot">
          <div class="row">
            ${on ? `<button class="btn btn-primary" data-act="start">Practise now ${I.arrow}</button><span class="muted small">This unit is part of your daily practice.</span>` :
              `<button class="btn btn-accent" data-act="unit-start" data-u="${U.u}">Start Unit ${U.u}</button><span class="muted small">Its cards join your daily practice.</span>`}
          </div>
          ${RT.sample ? `<div class="ask-box"><div class="claude-label">${I.sparkle} Ask Claude about this lesson</div>
            <textarea id="askq" rows="2" placeholder="e.g. Why is it 'den Apfel' but 'die Banane'?">${esc(UI.askQ)}</textarea>
            <div class="row"><button class="btn btn-claude" data-act="lesson-ask" data-u="${U.u}">Ask</button><button class="btn btn-ghost btn-sm" data-act="claude-stop" hidden id="ask-stop">Stop</button></div>
            <div class="claude-out" id="askout">${UI.askOut && UI.askOut.u === U.u ? md(UI.askOut.text) : ""}</div></div>` : ""}
          ${nextU ? `<button class="link" data-act="lesson" data-u="${nextU.u}">Next lesson: Unit ${nextU.u} · ${esc(nextU.de)} →</button>` : ""}
        </div>
      </article></div>`;
  }

  // ---------- sessions ----------
  function startSession(mode, opts = {}) {
    const t = Date.now(), cx = ctx();
    let items = [];
    if (mode === "daily") items = E.buildDaily(cx, S.prof.settings, newToday(), t).items;
    else if (mode === "extra") items = E.buildExtra(cx, opts.unit == null ? null : opts.unit, 12);
    else if (mode === "drill") items = E.buildDrill(opts.concept, 10);
    else if (mode === "new") items = E.newCards(cx).slice(0, 5).map((id) => ({ k: "card", id, isNew: true }));
    if (!items.length) {
      toast(mode === "extra" ? "Nothing to practise here yet. Start the unit: its cards join your daily practice first." : "Nothing to practise right now.");
      return;
    }
    UI.session = { mode, concept: opts.concept || null, unit: opts.unit == null ? null : opts.unit, items, base: items.length, pos: 0, xp: 0, combo: 0, maxCombo: 0,
      answered: 0, correct: 0, wrong: 0, almost: 0, requeues: 0, introduced: [], results: [], started: t };
    UI.view = "session";
    UI.drawer = null;
    prepare();
    if (UI.session) render();
    window.scrollTo(0, 0);
  }
  function prepare() {
    const s = UI.session;
    let ex = null;
    while (s.pos < s.items.length) {
      const it = s.items[s.pos];
      try {
        if (it.k === "card") {
          const card = CAT.cards.get(it.id), st = S.cards[it.id];
          if (card && !(st && st.sus)) ex = E.exerciseForCard(card, st, ctx());
        } else ex = E.exerciseForConcept(it.c, ctx());
      } catch (e) { console.error(e); ex = null; }
      if (ex) break;
      s.items.splice(s.pos, 1);
    }
    if (!ex) { finishSession(); return; }
    Object.assign(s, { ex, res: null, phase: ex.kind === "intro" ? "intro" : "ask", tiles: [], input: null, chosen: null, grade: null, pendingXp: 0, easy: false, claude: null });
    if (ex.sayFirst && ex.say) setTimeout(() => Speech.say(ex.say), 250);
    else if (ex.kind === "intro" && ex.say && S.prof.settings.autoSay) setTimeout(() => Speech.say(ex.say), 250);
  }
  const comboMult = (c) => (c >= 10 ? 2 : c >= 5 ? 1.5 : 1);
  function xpGain(s, verdict) {
    if (verdict === "wrong") return 0;
    const c = verdict === "correct" ? s.combo + 1 : 0;
    return Math.round((s.ex.xp || 5) * (verdict === "almost" ? 0.5 : 1) * comboMult(c));
  }
  function afterCheck() {
    const s = UI.session, r = s.res;
    s.phase = "feedback";
    s.grade = r.verdict === "correct" ? "good" : r.verdict === "almost" ? "hard" : "again";
    s.pendingXp = xpGain(s, r.verdict);
    if (S.prof.settings.autoSay && s.ex.sayAfter) Speech.say(s.ex.sayAfter);
    render();
  }
  function checkNow() {
    const s = UI.session, ex = s.ex;
    if (!s || s.phase !== "ask") return;
    let val;
    if (ex.kind === "type") {
      val = ($("#ans") || {}).value || "";
      if (!val.trim()) { nudge("#ans"); return; }
    } else if (ex.kind === "cloze") {
      val = ex.blanks.map((_, i) => ($("#b" + i) || {}).value || "");
      const empty = val.findIndex((v) => !v.trim());
      if (empty >= 0) { nudge("#b" + empty); return; }
    } else if (ex.kind === "order") {
      if (s.tiles.length !== ex.tiles.length) return;
      val = s.tiles.map((i) => ex.tiles[i]);
    } else return;
    s.input = val;
    s.res = E.check(ex, val, { strictCaps: S.prof.settings.strictCaps });
    afterCheck();
  }
  function nudge(sel) {
    const el = $(sel);
    if (el) { el.focus(); el.placeholder = "Type an answer, or press “I don't know”"; }
  }
  function pickOpt(i) {
    const s = UI.session;
    if (!s || s.phase !== "ask" || !s.ex.options || !s.ex.options[i]) return;
    s.chosen = i;
    s.input = s.ex.options[i].v;
    s.res = E.check(s.ex, s.input);
    afterCheck();
  }
  function dontKnow() {
    const s = UI.session;
    if (!s || s.phase !== "ask") return;
    const cr = {};
    if (!s.ex.noun) for (const c of s.ex.concepts || []) if (c !== "umlaut") cr[c] = false;
    s.res = { verdict: "wrong", notes: [], cr, user: "", mark: s.ex.mark || "W", gaveUp: true };
    afterCheck();
  }
  // The grammar point a wrong answer actually missed, for the "rule" link. A forgotten word has none.
  function failedConcept(ex, r) {
    const missed = (ex.concepts || []).filter((c) => r.cr && r.cr[c] === false && C.CONCEPTS[c]);
    return missed.find((c) => !c.startsWith("gr:") && c !== "cap" && c !== "umlaut") || missed[0] || null;
  }
  // One entry per card (or per question for grammar drills), counting repeats instead of listing them again.
  const mistakeKey = (it, ex) => (it.k === "card" ? it.id : stripHtml(ex.plain || ex.title) + "|" + correctPlain(ex));
  function logMistake(it, ex, r) {
    const key = mistakeKey(it, ex);
    const i = S.prof.mistakes.findIndex((m) => m.key === key);
    const prev = i >= 0 ? S.prof.mistakes.splice(i, 1)[0] : null;
    S.prof.mistakes.unshift({ t: Date.now(), key, n: (prev ? prev.n || 1 : 0) + 1, q: stripHtml(ex.plain || ex.title), a: r.gaveUp ? "" : String(r.user || ""), c: correctPlain(ex), k: failedConcept(ex, r), m: r.mark || "f" });
    if (S.prof.mistakes.length > 40) S.prof.mistakes.length = 40;
  }
  function keepFlags(prev, next) {
    if (prev && prev.sus) next.sus = 1;
    return next;
  }
  function commit(introGrade) {
    const s = UI.session;
    if (!s) return;
    const ex = s.ex, it = s.items[s.pos], t = Date.now();
    if (ex.kind === "intro" ? s.phase !== "intro" : s.phase !== "feedback") return;
    let grade = ex.kind === "intro" ? introGrade || "good" : s.grade, xp = 0;
    if (it.k === "card" && ex.card) {
      const prev = S.cards[it.id];
      const wasNew = !prev || prev.s === "new";
      if (it.extra && !wasNew) {
        if (grade === "again") S.cards[it.id] = keepFlags(prev, E.schedule(prev, "again", t).c);
        else S.cards[it.id] = Object.assign({}, prev, { t });
      } else {
        const out = E.schedule(prev, grade, t);
        S.cards[it.id] = keepFlags(prev, out.c);
        if (out.requeue && s.requeues < Math.max(12, s.base * 1.5)) {
          s.items.splice(Math.min(s.items.length, s.pos + 1 + out.requeue), 0, { k: "card", id: it.id });
          s.requeues++;
        }
        if (wasNew) {
          if (S.prof.newDay.d !== todayK()) S.prof.newDay = { d: todayK(), n: 0 };
          S.prof.newDay.n++;
          s.introduced.push(it.id);
        }
      }
    }
    if (ex.kind === "intro") xp = 2;
    else {
      const r = s.res, ok = r.verdict === "correct";
      for (const [c, v] of Object.entries(r.cr || {})) E.recordConcept(S.prof, c, !!v, t);
      xp = s.pendingXp || 0;
      s.combo = ok ? s.combo + 1 : 0;
      s.maxCombo = Math.max(s.maxCombo, s.combo);
      const p = S.prof.stats;
      p.answers++;
      if (ok) p.correct++;
      if (ok && (ex.kind === "gender" || (ex.noun && r.cr.gender))) p.genderOk++;
      p.bestCombo = Math.max(p.bestCombo, s.combo);
      s.answered++;
      if (ok) s.correct++; else if (r.verdict === "wrong") s.wrong++; else s.almost++;
      if (!ok) logMistake(it, ex, r);
      s.results.push({ v: r.verdict, key: mistakeKey(it, ex), q: stripHtml(ex.plain || ex.title), a: r.gaveUp ? "" : String(r.user || ""), c: correctPlain(ex), k: failedConcept(ex, r), m: r.mark });
      const day = dayRec(); day.n++; if (ok) day.ok++;
    }
    s.xp += xp; S.prof.xp += xp; dayRec().xp += xp;
    Store.touch("cards", "profile");
    s.pos++;
    if (s.pos >= s.items.length) { finishSession(); return; }
    prepare();
    if (UI.session) render();
    window.scrollTo(0, 0);
  }
  function finishSession() {
    const s = UI.session;
    if (!s) return;
    const p = S.prof, t = Date.now();
    if (s.answered || s.introduced.length) p.stats.sessions++;
    if (s.answered >= 10 && !s.wrong && !s.almost) p.stats.perfect++;
    const h = new Date().getHours();
    if (s.answered) { if (h < 7) p.stats.early = 1; if (h >= 22) p.stats.night = 1; }
    let bonus = 0, drillWon = false;
    if (s.mode === "drill" && s.answered >= 8 && s.correct >= Math.ceil(s.answered * 0.8)) {
      drillWon = true; p.stats.bossWins++; p.bosses[s.concept] = t; bonus = 30;
    }
    s.xp += bonus; p.xp += bonus; if (bonus) dayRec().xp += bonus;
    const newBadges = checkBadges();
    UI.summary = Object.assign({}, s, { ex: null, res: null, bonus, drillWon, newBadges });
    UI.session = null;
    UI.view = "summary";
    Store.touch("cards", "profile");
    render();
    window.scrollTo(0, 0);
  }
  function quitSession() {
    const s = UI.session;
    if (!s) return;
    if (!s.answered && !s.introduced.length) { UI.session = null; UI.view = "home"; render(); return; }
    finishSession();
  }

  function clockSvg(h, m) {
    const pt = (deg, len) => {
      const a = ((deg - 90) * Math.PI) / 180;
      return [(50 + Math.cos(a) * len).toFixed(1), (50 + Math.sin(a) * len).toFixed(1)];
    };
    let ticks = "";
    for (let i = 0; i < 12; i++) {
      const [x1, y1] = pt(i * 30, i % 3 ? 40 : 36), [x2, y2] = pt(i * 30, 44);
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:var(--ink-3)" stroke-width="${i % 3 ? 1.5 : 2.5}" stroke-linecap="round"/>`;
    }
    const [hx, hy] = pt((h % 12) * 30 + m * 0.5, 24), [mx, my] = pt(m * 6, 36);
    return `<svg class="clock" viewBox="0 0 100 100" role="img" aria-label="Clock showing ${h}:${String(m).padStart(2, "0")}">
      <circle cx="50" cy="50" r="47" style="fill:var(--sheet);stroke:var(--ink)" stroke-width="2.5"/>${ticks}
      <line x1="50" y1="50" x2="${hx}" y2="${hy}" style="stroke:var(--ink)" stroke-width="5" stroke-linecap="round"/>
      <line x1="50" y1="50" x2="${mx}" y2="${my}" style="stroke:var(--accent)" stroke-width="3" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="3.5" style="fill:var(--ink)"/></svg>`;
  }
  function diffHtml(a, b) {
    if (!a) return `<span class="muted">(no answer)</span>`;
    if (E.lev(a.toLowerCase(), b.toLowerCase()) > Math.max(3, b.length * 0.6)) return `<span class="d-del">${esc(a)}</span>`;
    return E.diff(a, b).map((p) => (p.t === "same" ? esc(p.s) : p.t === "del" ? `<span class="d-del">${esc(p.s)}</span>` : `<span class="d-ins">${esc(p.s)}</span>`)).join("");
  }
  function youRow(s) {
    const ex = s.ex, r = s.res;
    let h;
    if (ex.kind === "type") h = diffHtml(r.user, correctPlain(ex));
    else if (ex.kind === "cloze") {
      let k = 0;
      h = ex.parts.map((p) => {
        if (p !== null) return esc(p);
        const i = k++, st = (r.blankRes || [])[i];
        return st === "correct" ? `<b>${esc(s.input[i])}</b>` : `<span class="d-del">${esc(s.input[i])}</span> <span class="d-ins">${esc(ex.blanks[i].accepts[0])}</span>`;
      }).join("");
    } else if (ex.kind === "order") h = `<span class="d-del">${esc(r.user)}</span>`;
    else h = `<span class="d-del">${esc(stripHtml((ex.options[s.chosen] || {}).html || r.user))}</span>`;
    return `<div class="fb-row"><span class="lbl">You</span><span class="diff">${h}</span></div>`;
  }
  const MARKS = { Gr: "grammar", R: "spelling", W: "vocabulary", Sb: "word order", f: "mistake" };
  function marginMark(s) {
    if (s.phase !== "feedback") return "";
    if (s.res.verdict === "correct") return `<svg class="mmark ok" viewBox="0 0 40 40" width="44" height="44" aria-label="Correct" role="img"><path d="M6 22 L15 31 L35 7" fill="none" style="stroke:var(--green)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const m = s.res.mark || "f";
    return `<span class="mmark" aria-label="${MARKS[m] || "mistake"}">${esc(m)}</span><span class="mmark-k">${MARKS[m] || ""}</span>`;
  }
  function feedbackHtml(s) {
    const ex = s.ex, r = s.res, v = r.verdict, it = s.items[s.pos];
    const W = { correct: ["Richtig!", "Correct"], almost: ["Fast!", "Almost: counts as hard"], wrong: r.gaveUp ? ["Kein Problem.", "Here's how it works"] : ["Nicht ganz.", "Not quite"] }[v];
    const learning = it.k === "card" && S.cards[it.id] && S.cards[it.id].s !== "review";
    let rows = "";
    if (v !== "correct" && !r.gaveUp) rows += youRow(s);
    rows += `<div class="fb-row"><span class="lbl">${v === "correct" ? "Answer" : "Correct"}</span><span class="ans">${ex.solution || ex.correctHtml || esc(correctPlain(ex))}${ex.sayAfter ? " " + sayBtn(ex.sayAfter) : ""}</span></div>`;
    const notes = r.notes && r.notes.length ? `<ul class="fb-notes">${r.notes.map((n) => `<li>${n}</li>`).join("")}</ul>` : "";
    let why = "";
    try { why = ex.explain ? ex.explain(r) : ""; } catch (e) { why = ""; }
    const canOverride = (ex.kind === "type" || ex.kind === "cloze") && v !== "correct" && !r.gaveUp;
    const canEasy = v === "correct" && it.k === "card" && !it.extra && ex.card;
    return `<div class="fb fb-${v}">
      <div class="fb-verdict"><span class="fb-word">${W[0]}</span><span class="fb-en">${W[1]}</span>${s.pendingXp ? `<span class="fb-xp xp-pop">+${s.pendingXp} XP</span>` : ""}</div>
      <div class="fb-rows">${rows}</div>${notes}
      ${why ? `<details class="why" ${v !== "correct" || learning ? "open" : ""}><summary>Why?</summary><div class="why-body">${why}</div></details>` : ""}
      <div class="claude-why" id="cw" ${s.claude ? "" : "hidden"}>${s.claude ? `<div class="claude-label">${I.sparkle} Claude</div><div class="claude-out">${md(s.claude)}</div>` : ""}</div>
      <div class="fb-actions">
        ${RT.sample ? `<button class="btn btn-claude btn-sm" data-act="askwhy">${I.sparkle} Ask Claude why</button>` : ""}
        ${canOverride ? `<button class="btn btn-ghost btn-sm" data-act="override" title="Your answer was also correct">I was right</button>` : ""}
        ${canEasy ? `<button class="btn btn-ghost btn-sm" data-act="easy" aria-pressed="${s.easy}">${s.easy ? I.check + " Too easy" : "Too easy"}</button>` : ""}
        <span class="spacer"></span>
        <button class="btn btn-primary" data-act="next" id="go">Next ${I.arrow}</button>
      </div></div>`;
  }
  function viewSession() {
    const s = UI.session, ex = s.ex, it = s.items[s.pos];
    const st = it.k === "card" ? S.cards[it.id] : null;
    const chip = it.k === "concept" ? `<span class="chip chip-weak">${it.drill ? "Drill" : "Weak spot"}</span>` :
      it.extra ? `<span class="chip">Extra practice</span>` : !st || st.s === "new" ? `<span class="chip chip-new">New</span>` :
        st.s !== "review" ? `<span class="chip chip-learning">Learning</span>` : `<span class="chip">Review</span>`;
    const pct = Math.round((s.pos / s.items.length) * 100);
    const fb = s.phase === "feedback";
    const vcls = fb ? "v-" + s.res.verdict : "";
    let body = "";
    const promptBlock = () => `<div class="ex-prompt">${ex.kind === "clock" ? `<div class="clock-wrap">${clockSvg(ex.clock.h, ex.clock.m)}${ex.prompt}</div>` : ex.prompt}` +
      `${ex.say && ex.kind !== "type" ? sayBtn(ex.say) : ""}${ex.sub ? `<div class="ex-sub">${esc(ex.sub)}</div>` : ""}</div>`;
    const askActions = (checkBtn) => fb ? "" : `<div class="ex-actions">${checkBtn ? `<button class="btn btn-primary" data-act="check" ${checkBtn === "off" ? "disabled" : ""}>Check</button>` : ""}<button class="btn btn-ghost" data-act="dontknow">I don't know</button><span class="spacer"></span><span class="kbd-hint">${checkBtn ? "Enter = check" : `Keys 1–${(ex.options || []).length}`}</span></div>`;
    if (ex.kind === "intro") {
      body = `<div>${ex.html}</div><div class="intro-actions"><button class="btn btn-primary btn-lg" data-act="intro-ok" id="go">Got it ${I.arrow}</button>${it.k === "card" && !it.extra ? `<button class="btn btn-ghost" data-act="intro-known">I already know this</button>` : ""}</div>`;
    } else if (ex.kind === "choice" || ex.kind === "gender" || ex.kind === "clock") {
      const opts = ex.options.map((o, i) => {
        let cls = o.cls || "";
        if (fb) { if (o.v === ex.answer) cls += " o-correct"; else if (i === s.chosen) cls += " o-wrong"; }
        return `<button class="opt ${cls}" data-act="pick" data-i="${i}" ${fb ? "disabled" : ""}><span class="k">${i + 1}</span><span>${o.html}</span></button>`;
      }).join("");
      body = promptBlock() + `<div class="opts ${ex.kind === "gender" ? "opts-gender" : ""}">${opts}</div>` + askActions(false);
    } else if (ex.kind === "type") {
      const attrs = `id="ans" lang="de" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Your answer" ${fb ? "disabled" : ""}`;
      // whole sentences get a box that wraps; Enter still checks the answer
      const field = ex.long ? `<textarea ${attrs} class="ans-input ans-long ${vcls}" rows="2" placeholder="Type the sentence here">${fb ? esc(s.input || "") : ""}</textarea>` :
        `<input ${attrs} class="ans-input ${vcls}" type="text" inputmode="${ex.inputMode || "text"}" placeholder="Type here" value="${fb ? esc(s.input || "") : ""}">`;
      body = `<div class="ex-prompt">${ex.prompt}${ex.sub ? `<div class="ex-sub">${esc(ex.sub)}</div>` : ""}</div>
        <div class="ans-line">${field}${fb || ex.inputMode === "numeric" ? "" : umlKeys()}</div>` + askActions(true);
    } else if (ex.kind === "cloze") {
      let k = 0;
      const sent = ex.parts.map((p) => {
        if (p !== null) return esc(p);
        const i = k++, w = Math.max(3, ex.blanks[i].accepts[0].length + 1);
        const st2 = fb && s.res.blankRes ? "b-" + s.res.blankRes[i] : "";
        return `<input id="b${i}" class="${st2}" style="width:${w + 1}ch" type="text" lang="de" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Gap ${i + 1}" value="${fb ? esc((s.input || [])[i] || "") : ""}" ${fb ? "disabled" : ""}>`;
      }).join("");
      body = (ex.prompt ? promptBlock() : "") + `<div class="cloze">${sent}</div>${ex.hints && ex.hints.length ? `<div class="hints">${ex.hints.map((h) => `<span class="hint">${esc(h)}</span>`).join("")}</div>` : ""}${fb ? "" : umlKeys()}` + askActions(true);
    } else if (ex.kind === "order") {
      const placed = s.tiles.map((ti, pos) => `<button class="tile" data-act="untile" data-i="${pos}" ${fb ? "disabled" : ""}>${esc(ex.tiles[ti])}</button>`).join("");
      const bank = ex.tiles.map((t, i) => (s.tiles.includes(i) ? "" : `<button class="tile" data-act="tile" data-i="${i}">${esc(t)}</button>`)).join("");
      body = promptBlock() + `<div class="tiles-line ${vcls}" aria-label="Your sentence">${placed || `<span class="ph">Tap the words in order</span>`}<span class="punct">${esc(ex.punct)}</span></div>` +
        (fb ? "" : `<div class="tiles-bank">${bank}</div>`) +
        (fb ? "" : `<div class="ex-actions"><button class="btn btn-primary" data-act="check" ${s.tiles.length === ex.tiles.length ? "" : "disabled"}>Check</button>${s.tiles.length ? `<button class="btn btn-ghost" data-act="tiles-clear">Clear</button>` : ""}<button class="btn btn-ghost" data-act="dontknow">I don't know</button><span class="spacer"></span><span class="kbd-hint">Backspace = undo</span></div>`);
    }
    return `<div class="sess">
      <div class="sess-top">
        <button class="icon-btn" data-act="quit" aria-label="End session" title="End session">${I.close}</button>
        <div class="prog" role="progressbar" aria-label="Session progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>
        <div class="sess-stat"><span class="combo ${s.combo >= 5 ? "hot" : ""}">${s.combo >= 3 ? `${s.combo} in a row${comboMult(s.combo) > 1 ? " · ×" + comboMult(s.combo) : ""}` : `${s.pos + 1} / ${s.items.length}`}</span><span>${s.xp} XP</span></div>
      </div>
      <article class="sheet ex-sheet">
        <div class="ex-main">
          <div class="ex-eyebrow"><span class="eyebrow">${esc(ex.tag || "")}</span>${chip}</div>
          <h2 class="ex-title">${esc(ex.title)}</h2>
          ${body}
          ${fb ? feedbackHtml(s) : ""}
        </div>
        <div class="ex-margin" aria-live="polite">${marginMark(s)}</div>
      </article></div>`;
  }
  const NOTE = (acc) => (acc >= 0.92 ? ["1", "sehr gut"] : acc >= 0.81 ? ["2", "gut"] : acc >= 0.67 ? ["3", "befriedigend"] : acc >= 0.5 ? ["4", "ausreichend"] : acc >= 0.3 ? ["5", "mangelhaft"] : ["6", "ungenügend"]);
  function viewSummary() {
    const s = UI.summary;
    if (!s) return viewHome();
    const acc = s.answered ? s.correct / s.answered : 1;
    const note = NOTE(acc);
    const conceptLabel = s.concept && C.CONCEPTS[s.concept] ? C.CONCEPTS[s.concept].label : "";
    const title = s.mode === "drill" ? (s.drillWon ? "Weak spot beaten" : "Not beaten yet") : "Session done";
    const sub = s.mode === "drill" ? (s.drillWon ? `${esc(conceptLabel)}: ${s.correct} of ${s.answered}. +30 XP bonus.` : `${esc(conceptLabel)}: ${s.correct} of ${s.answered}. You need 8 of 10. Read the explanations below, then try again.`) :
      `${s.introduced.length ? `${s.introduced.length} new card${s.introduced.length === 1 ? "" : "s"} met. ` : ""}Your answers are saved, and each card is scheduled for its next review.`;
    const plan = E.buildDaily(ctx(), S.prof.settings, newToday(), Date.now());
    // one row per card: the latest wrong answer, and how often it was missed
    const mist = [], byKey = new Map();
    for (const r of s.results) {
      if (r.v === "correct") continue;
      const g = byKey.get(r.key);
      if (g) Object.assign(g, r, { n: g.n + 1 });
      else { const row = Object.assign({ n: 1 }, r); byKey.set(r.key, row); mist.push(row); }
    }
    const newWords = s.introduced.map((id) => CAT.cards.get(id)).filter(Boolean);
    const weak = E.weakList(S.prof).slice(0, 2);
    return `<div class="summary">
      <section class="sheet sum-head">
        ${s.answered ? `<span class="hand" title="German school grades run from 1 (best) to 6">Note ${note[0]} · ${note[1]}</span>` : ""}
        <h1>${title}</h1><p class="muted">${sub}</p>
        <div class="tiles4">
          <div class="kpi"><b>${s.answered}</b><span>answers</span></div>
          <div class="kpi"><b>${Math.round(acc * 100)}%</b><span>correct</span></div>
          <div class="kpi"><b>+${s.xp}</b><span>XP</span></div>
          <div class="kpi"><b>${s.maxCombo}</b><span>best run</span></div>
        </div>
        ${s.newBadges && s.newBadges.length ? `<div><div class="eyebrow" style="margin:8px 0">New badge${s.newBadges.length > 1 ? "s" : ""}</div><div class="badges">${s.newBadges.map((b) => stamp(b)).join("")}</div></div>` : ""}
        <div class="row" style="margin-top:6px">
          <button class="btn btn-primary" data-act="nav" data-v="home">Back to today</button>
          ${plan.items.length ? `<button class="btn" data-act="start">Keep going (${plan.items.length})</button>` : ""}
          ${s.mode === "drill" && !s.drillWon ? `<button class="btn" data-act="drill" data-c="${esc(s.concept)}">Try the drill again</button>` : ""}
          ${s.mode !== "drill" && weak[0] ? `<button class="btn" data-act="drill" data-c="${esc(weak[0].id)}">Drill: ${esc(weak[0].label)}</button>` : ""}
        </div>
      </section>
      ${mist.length ? `<section class="sheet pad"><div class="card-h"><h2>Look at these again</h2><span class="muted small">They'll come back soon</span></div><div class="mist-list">${mist.map((m) => mistRow(m, true)).join("")}</div></section>` : ""}
      ${newWords.length ? `<section class="sheet pad"><div class="card-h"><h2>New today</h2></div><div class="chips">${newWords.map((c) => c.kind === "v" ? `<button class="chip" data-act="card" data-id="${esc(c.id)}"><span class="${c.e.t === "n" ? "g-" + (c.e.plOnly ? "pl" : c.e.art) : ""}">${esc(c.e.de)}</span></button>` : `<button class="chip chip-new" data-act="card" data-id="${esc(c.id)}">${esc(c.sk.title)}</button>`).join("")}</div></section>` : ""}
    </div>`;
  }

  // ---------- cards browser ----------
  function cardMatches(card, q) {
    if (!q) return true;
    const hay = card.kind === "v" ? `${card.e.de} ${card.e.en}` : `${card.sk.title} ${card.sk.id}`;
    return hay.toLowerCase().includes(q) || E.translit(hay.toLowerCase()).includes(q);
  }
  function filteredCards() {
    const q = UI.q.trim().toLowerCase();
    return CAT.order.map((id) => CAT.cards.get(id)).filter((card) => {
      if (UI.fu !== "all" && String(card.u) !== UI.fu) return false;
      const st = S.cards[card.id];
      if (UI.fs !== "all") {
        if (UI.fs === "leech" ? !(st && st.l >= 3) : UI.fs === "suspended" ? !(st && st.sus) : E.statusOf(st) !== UI.fs || (st && st.sus)) return false;
      }
      return cardMatches(card, q);
    });
  }
  function deckRows() {
    const list = filteredCards();
    if (!list.length) return `<div class="empty">No cards match. Try another filter, or add your own card.</div>`;
    const head = `<div class="deck-row deck-head"><span>German</span><span>English</span><span>Unit</span><span>Status</span><span>Next</span></div>`;
    return head + list.map((card) => {
      const st = S.cards[card.id], status = st && st.sus ? "suspended" : E.statusOf(st);
      const de = card.kind === "v" ? `<span class="${card.e.t === "n" ? "g-" + (card.e.plOnly ? "pl" : card.e.art) : ""}">${esc(card.e.de)}</span>` : `${esc(card.sk.title)}`;
      const en = card.kind === "v" ? esc(card.e.en) : `<span class="muted">grammar skill</span>`;
      return `<button class="deck-row" data-act="card" data-id="${esc(card.id)}"><span class="dd">${de}</span><span class="de">${en}</span><span class="du">${card.u ? card.u : "mine"}</span><span class="ds"><span class="chip chip-${status}">${status}${st && st.l >= 3 ? " · tricky" : ""}</span></span><span class="dn">${relDue(st)}</span></button>`;
    }).join("");
  }
  function statusCounts() {
    const c = { new: 0, learning: 0, young: 0, mature: 0 };
    for (const id of CAT.order) { const st = S.cards[id]; if (st && st.sus) continue; c[E.statusOf(st)]++; }
    return `<span class="chip chip-new">${c.new} new</span><span class="chip chip-learning">${c.learning} learning</span><span class="chip chip-young">${c.young} young</span><span class="chip chip-mature">${c.mature} mature (21+ days)</span>`;
  }
  function viewCards() {
    const units = C.UNITS.map((U) => `<option value="${U.u}" ${UI.fu === String(U.u) ? "selected" : ""}>Unit ${U.u} · ${esc(U.de)}</option>`).join("");
    const sts = [["all", "Any status"], ["new", "New"], ["learning", "Learning"], ["young", "Young"], ["mature", "Mature"], ["leech", "Tricky (3+ lapses)"], ["suspended", "Paused"]]
      .map(([v, l]) => `<option value="${v}" ${UI.fs === v ? "selected" : ""}>${l}</option>`).join("");
    return `<div class="stack">
      <div class="section-h"><div><div class="eyebrow">Karten</div><h1 style="font-size:var(--t-2xl)">Your cards</h1></div><button class="btn btn-accent" data-act="add-card">${I.plus} Add a card</button></div>
      <p class="muted prose">Every word and grammar skill is a card with its own review schedule, as in Anki. Open a card to see its explanation, pause it, or reset it. Your own cards go straight into your daily practice.</p>
      <div class="status-sum" id="scount">${statusCounts()}</div>
      <section class="sheet">
        <div class="toolbar pad" style="margin:0;padding-bottom:12px">
          <input type="search" id="cq" class="search" placeholder="Search German or English" value="${esc(UI.q)}" aria-label="Search cards">
          <select id="fu" aria-label="Unit"><option value="all">All units</option><option value="0" ${UI.fu === "0" ? "selected" : ""}>My cards</option>${units}</select>
          <select id="fs" aria-label="Status">${sts}</select>
        </div>
        <div class="deck" id="deck">${deckRows()}</div>
      </section></div>`;
  }
  function refreshDeck() {
    const d = $("#deck");
    if (d) d.innerHTML = deckRows();
  }

  // ---------- writing coach ----------
  function newTask() {
    const ups = [...started()].filter((u) => u > 0).sort((a, b) => a - b);
    const u = Math.random() < 0.6 ? ups[ups.length - 1] : E.pick(ups);
    const task = C.WRITE.find((w) => w.u === u) || C.WRITE[0];
    const ids = (CAT.byUnit[u] || []).filter((id) => id[0] === "v");
    const seen = ids.filter((id) => S.cards[id] && S.cards[id].s !== "new");
    const pool = seen.length >= 4 ? seen : ids;
    const words = E.shuffle(pool).slice(0, 5).map((id) => CAT.cards.get(id).e).filter((e) => e.t !== "p");
    const weak = E.weakList(S.prof)[0];
    UI.write = { u, task: task.task, words: words.map((e) => ({ de: e.de, t: e.t, art: e.art, pl: e.plOnly })), weak: weak ? weak.label : null, text: (UI.write && UI.write.text) || "" };
    UI.wres = null;
  }
  function viewWrite() {
    if (!UI.write) newTask();
    const w = UI.write;
    const words = w.words.map((x) => `<span class="chip"><span class="${x.t === "n" ? "g-" + (x.pl ? "pl" : x.art) : ""}">${esc(x.de)}</span></span>`).join("");
    const journal = S.prof.writing.length ? `<div class="journal">${S.prof.writing.slice(0, 6).map((j) => `<div class="journal-item"><div class="row"><b>${new Date(j.t).toLocaleDateString("de-DE")}</b><span class="chip ${j.n ? "chip-weak" : "chip-young"}">${j.n ? j.n + " fix" + (j.n === 1 ? "" : "es") : "no mistakes"}</span></div><p>${esc(j.corrected.slice(0, 160))}${j.corrected.length > 160 ? "…" : ""}</p></div>`).join("")}</div>` :
      `<div class="empty">Your checked texts are kept here.</div>`;
    return `<div class="stack">
      <div class="section-h"><div><div class="eyebrow">Schreibwerkstatt</div><h1 style="font-size:var(--t-2xl)">Write with Claude</h1></div></div>
      <div class="write">
        <div class="stack">
          <section class="sheet task">
            <div class="eyebrow">Task · Unit ${w.u}</div>
            <h1>${esc(w.task)}</h1>
            ${words ? `<div class="stack" style="gap:6px"><span class="muted small">Try to use some of these:</span><div class="chips">${words}</div></div>` : ""}
            ${w.weak ? `<p class="small"><b>Your weak spot:</b> ${esc(w.weak)}. Try to use it once.</p>` : ""}
            <textarea id="wtext" class="write-area" lang="de" spellcheck="false" placeholder="Schreib hier … (write here)" aria-label="Your text">${esc(w.text)}</textarea>
            ${umlKeys()}
            <div class="row">
              ${RT.sample ? `<button class="btn btn-accent" data-act="write-check">${I.sparkle} Check my German</button><button class="btn btn-ghost btn-sm" data-act="claude-stop" id="w-stop" hidden>Stop</button>` :
                `<button class="btn btn-accent" data-act="write-copy">${I.sparkle} Copy for Claude</button>`}
              <button class="btn" data-act="write-new">New task</button>
            </div>
            ${RT.sample ? "" : `<p class="muted small">${IN_CLAUDE ? "Claude isn't available in this view right now." : `Feedback from Claude isn't built into this offline app. You can also write in <a href="${CLAUDE_URL}" target="_blank" rel="noopener">the Claude version of Deutschheft</a>, where it is.`}
              <b>Copy for Claude</b> copies your text with the task and the teacher's instructions. Paste it into a chat at <a href="https://claude.ai/new" target="_blank" rel="noopener">claude.ai</a> to get it corrected and explained.</p>`}
          </section>
          <section class="sheet pad wres" id="wres" ${UI.wres ? "" : "hidden"}>${UI.wres ? writeResultHtml(UI.wres) : ""}</section>
        </div>
        <aside class="stack">
          <section class="sheet pad"><div class="card-h"><h2>How it works</h2></div><p class="small muted">Claude corrects only real mistakes and explains each one in plain English. ${RT.sample ? "Each mistake is tagged with a grammar point, and those feed your weak spots, so your writing decides what you drill next." : "In the Claude version each mistake also feeds your weak spots, so your writing decides what you drill next."}</p></section>
          <section class="sheet pad"><div class="card-h"><h2>Journal</h2></div>${journal}</section>
        </aside>
      </div></div>`;
  }
  function wordDiff(a, b) {
    const A = a.split(/\s+/).filter(Boolean), B = b.split(/\s+/).filter(Boolean);
    const m = A.length, n = B.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const out = [];
    let i = 0, j = 0;
    while (i < m && j < n) {
      if (A[i] === B[j]) { out.push(esc(A[i])); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push(`<span class="d-del">${esc(A[i])}</span>`); i++; }
      else { out.push(`<span class="d-ins">${esc(B[j])}</span>`); j++; }
    }
    while (i < m) out.push(`<span class="d-del">${esc(A[i++])}</span>`);
    while (j < n) out.push(`<span class="d-ins">${esc(B[j++])}</span>`);
    return out.join(" ");
  }
  function writeResultHtml(r) {
    if (r.thinking) return `<div class="claude-label">${I.sparkle} Claude</div><p class="thinking">Claude is reading your text…</p>`;
    if (r.error) return `<p class="form-err">${esc(r.error)}</p>`;
    const verdict = { perfect: "Sehr gut!", good: "Gut!", needs_work: "Weiter üben!" }[r.verdict] || "Gut!";
    const ms = (r.mistakes || []).map((m) => {
      const k = C.CONCEPTS[m.concept];
      return `<div class="wm-item"><div class="wx"><s>${esc(m.wrong)}</s> → <b>${esc(m.right)}</b></div><div class="small">${esc(m.explanation)}</div>${k ? `<div class="row"><span class="chip">${esc(k.label)}</span><button class="link" data-act="drill" data-c="${esc(m.concept)}">Drill this</button></div>` : ""}</div>`;
    }).join("");
    return `<span class="verdict-pill">${verdict}</span>
      ${r.praise ? `<p>${esc(r.praise)}</p>` : ""}
      <div><div class="eyebrow" style="margin-bottom:6px">Corrected</div><div class="corrected">${wordDiff(r.original, r.corrected)}</div></div>
      ${ms ? `<div class="wm-list">${ms}</div>` : `<p class="muted">No mistakes found.</p>`}
      ${r.tip ? `<div class="tip"><span class="tip-k">Next</span><div>${esc(r.tip)}</div></div>` : ""}
      <p class="muted small">+${r.xp} XP</p>`;
  }
  async function checkWriting() {
    const text = (($("#wtext") || {}).value || "").trim();
    if (text.length < 6) { toast("Write a sentence or two first."); return; }
    if (!RT.sample) return;
    UI.write.text = text;
    const concepts = Object.entries(C.CONCEPTS).filter(([id]) => !id.startsWith("gr:")).map(([id, k]) => `${id}: ${k.label}`).join("\n");
    const prompt = `You are a patient, precise German teacher. Your student is an English speaker at level A1.

Task they were given: ${UI.write.task}
Their text:
"""
${text.slice(0, 3000)}
"""

Check the text. Fix only real errors (grammar, spelling, capitalisation, noun gender, case, word order, wrong word). Keep their meaning and their simple style; do not rewrite for elegance.

Reply with only a JSON object:
{"corrected": "the full corrected text", "verdict": "perfect" | "good" | "needs_work", "mistakes": [{"wrong": "the wrong words exactly as written", "right": "the corrected words", "explanation": "one or two plain English sentences an A1 learner understands", "concept": "one id from the list below, or other"}], "praise": "one short sentence about something they did well", "tip": "one short, concrete next step"}
At most 8 mistakes. If the text is not German, return an empty mistakes list and say so in tip.

Concept ids:
${concepts}`;
    const ctl = new AbortController();
    RT.ctl = ctl;
    UI.wres = { thinking: true };
    const box = $("#wres");
    if (box) { box.hidden = false; box.innerHTML = writeResultHtml(UI.wres); }
    const stop = $("#w-stop"); if (stop) stop.hidden = false;
    try {
      const out = await RT.sample.json(prompt, { signal: ctl.signal });
      if (!out || typeof out.corrected !== "string") throw { code: "invalid_json" };
      const mistakes = Array.isArray(out.mistakes) ? out.mistakes.filter((m) => m && m.wrong != null && m.right != null).slice(0, 8).map((m) => ({
        wrong: String(m.wrong), right: String(m.right), explanation: String(m.explanation || ""), concept: C.CONCEPTS[m.concept] ? String(m.concept) : "other" })) : [];
      const t = Date.now();
      for (const m of mistakes) if (C.CONCEPTS[m.concept]) E.recordConcept(S.prof, m.concept, false, t);
      const xp = 20 + (mistakes.length ? 0 : 10);
      S.prof.xp += xp; dayRec().xp += xp; S.prof.stats.writes++;
      S.prof.writing.unshift({ t, task: UI.write.task, text, corrected: out.corrected, n: mistakes.length });
      checkBadges();
      Store.touch("profile");
      UI.wres = { original: text, corrected: out.corrected, verdict: out.verdict, mistakes, praise: out.praise ? String(out.praise) : "", tip: out.tip ? String(out.tip) : "", xp };
    } catch (e) {
      UI.wres = { error: sampleErr(e) };
    } finally { RT.ctl = null; }
    if (UI.view === "write") render();
  }

  // The same check as "Check my German", phrased for pasting into a normal Claude chat.
  function writingPromptForChat(text) {
    return `You are a patient, precise German teacher. I'm an English speaker learning German at level A1.

My task: ${UI.write.task}

My text:
"""
${text}
"""

Please check it. Fix only real errors (grammar, spelling, capital letters, noun gender, case, word order, wrong word). Keep my meaning and my simple style; don't rewrite it to sound more elegant.

Reply with:
1. My text, corrected.
2. Each mistake as "wrong → right", with one or two plain-English sentences explaining the rule.
3. One thing I did well, and one concrete tip for next time.`;
  }
  function copyText(text, done, drawer) {
    const fallback = () => { UI.drawer = drawer; renderDrawer(); };
    try { navigator.clipboard.writeText(text).then(() => toast(done), fallback); } catch (e) { fallback(); }
  }

  // ---------- Claude helpers ----------
  function md(t) {
    const lines = esc(t).split(/\n/);
    let html = "", inList = false;
    const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<i>$2</i>");
    for (const raw of lines) {
      const li = /^\s*(?:[-•*]|\d+[.)])\s+(.*)$/.exec(raw);
      if (li) { if (!inList) { html += "<ul>"; inList = true; } html += `<li>${inline(li[1])}</li>`; continue; }
      if (inList) { html += "</ul>"; inList = false; }
      if (raw.trim()) html += `<p>${inline(raw.replace(/^#+\s*/, ""))}</p>`;
    }
    return html + (inList ? "</ul>" : "");
  }
  function sampleErr(e) {
    const code = e && e.code;
    if (code === "cancelled") return "Stopped.";
    if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(code)) {
      RT.sample = null;
      setTimeout(safeRender, 0);
      return "Claude isn't available for this page, so the Claude buttons are hidden for now.";
    }
    if (code === "rate_limited") return "Claude is busy or you've reached a usage limit. Try again in a little while.";
    if (code === "session_expired") return "Your Claude session expired. Sign in again to use it.";
    if (code === "invalid_json") return "Claude's answer came back in an unexpected format. Try again.";
    if (code === "refused") return "Claude couldn't answer that. Try rephrasing.";
    return "Couldn't reach Claude just now. Try again.";
  }
  async function streamInto(el, prompt, opts, onDone) {
    if (!RT.sample || !el) return;
    if (RT.ctl) RT.ctl.abort();
    const ctl = new AbortController();
    RT.ctl = ctl;
    el.hidden = false;
    el.innerHTML = `<div class="claude-label">${I.sparkle} Claude</div><p class="thinking">Thinking…</p>`;
    let text = "";
    try {
      const res = await RT.sample(prompt, Object.assign({ signal: ctl.signal, onText: (u) => { text = u.text; el.innerHTML = `<div class="claude-label">${I.sparkle} Claude</div><div class="claude-out">${md(text)}</div>`; } }, opts));
      text = res.text;
      if (onDone) onDone(text);
    } catch (e) {
      el.innerHTML = `<div class="claude-label">${I.sparkle} Claude</div>${e && e.text ? `<div class="claude-out">${md(e.text)}</div>` : ""}<p class="muted small">${esc(sampleErr(e))}</p>`;
    } finally { if (RT.ctl === ctl) RT.ctl = null; }
  }
  function askWhy() {
    const s = UI.session;
    if (!s || !s.res) return;
    const ex = s.ex, r = s.res;
    let expl = "";
    try { expl = stripHtml(ex.explain ? ex.explain(r) : "").slice(0, 1400); } catch (e) { expl = ""; }
    const prompt = `You are a friendly, precise German teacher. An English-speaking A1 learner is using a study app and wants to understand this exercise better.

Exercise: ${ex.title}
Prompt: ${stripHtml(ex.plain || "")}
Their answer: ${r.gaveUp ? "(they said they didn't know)" : r.user || "(empty)"}
Correct answer: ${correctPlain(ex)}
The app's explanation: ${expl}

Explain in plain English why the correct answer is right${r.verdict === "correct" ? "" : ", and what their answer suggests they should watch out for"}. Stay under 120 words. Then give 2 new short example sentences that use the same rule, as "German — English". Use **bold** for the German words that matter. No greeting, no preamble.`;
    streamInto($("#cw"), prompt, { modelTier: "quick" }, (text) => { if (UI.session === s) s.claude = text; });
  }
  function askLesson(u) {
    const q = (($("#askq") || {}).value || "").trim();
    if (!q) { toast("Type a question first."); return; }
    UI.askQ = q;
    const U = C.UNITS.find((x) => x.u === u);
    const lessonText = U.lesson.map((s) => s.h + ": " + stripHtml(s.html)).join("\n").slice(0, 6000);
    const prompt = `You are a friendly German teacher helping an English-speaking A1 learner. They are reading this lesson (Unit ${u}: ${U.de}, ${U.en}):

${lessonText}

Their question: ${q}

Answer in plain English in under 170 words, with 1–3 short German examples written as "German — English". Use **bold** for the German words that matter. If the question goes beyond A1, answer simply and say it comes later.`;
    const stop = $("#ask-stop"); if (stop) stop.hidden = false;
    streamInto($("#askout"), prompt, {}, (text) => { UI.askOut = { u, text }; if (stop) stop.hidden = true; });
  }
  function mnemonic(id) {
    const card = CAT.cards.get(id);
    if (!card || card.kind !== "v") return;
    const e = card.e;
    const colour = { der: "blue (der, masculine)", die: "red (die, feminine)", das: "green (das, neuter)" }[e.art];
    const prompt = `Give one vivid, memorable mnemonic (max 45 words) to help an English speaker remember the German ${e.t === "n" ? "noun" : "word"} "${e.de}", meaning "${e.en}".${e.t === "n" && colour ? ` It must also lock in the article: picture the scene in ${colour}.` : ""} Reply with only the mnemonic.`;
    streamInto($("#mn"), prompt, { modelTier: "quick" });
  }

  // ---------- profile ----------
  function forecast() {
    const t0 = E.dayStart(Date.now()), nowT = Date.now();
    const counts = new Array(7).fill(0);
    for (const st of Object.values(S.cards)) {
      if (!st || st.sus || st.s === "new") continue;
      const idx = st.d <= nowT ? 0 : Math.floor((E.dayStart(st.d) - t0) / E.DAY);
      if (idx >= 0 && idx < 7) counts[idx]++;
    }
    const max = Math.max(1, ...counts);
    const day = new Date();
    return `<div class="fc" role="img" aria-label="Cards due over the next 7 days: ${counts.join(", ")}">${counts.map((c, i) => {
      const d = new Date(day); d.setDate(day.getDate() + i);
      return `<div class="fc-col" title="${i ? WD[d.getDay()] : "Heute"}: ${c} card${c === 1 ? "" : "s"} due"><span class="fc-n">${c}</span><div class="fc-bar ${c ? "" : "zero"}" style="height:${Math.round((c / max) * 82)}%"></div><span class="fc-d">${i ? WD2[d.getDay()] : "heute"}</span></div>`;
    }).join("")}</div>`;
  }
  function viewProfile() {
    const p = S.prof, lv = level(p.xp), set = p.settings;
    const acc = p.stats.answers ? Math.round((p.stats.correct / p.stats.answers) * 100) : 0;
    // a point needs a few tries before its accuracy means anything (weak spots use the same threshold)
    const enough = (c) => c.h.length >= 4;
    const cl = E.conceptList(p).sort((a, b) => enough(b) - enough(a) || (enough(a) ? a.acc - b.acc : 0) || b.n - a.n);
    const opt = (k, vals, labels) => vals.map((v, i) => `<option value="${v}" ${set[k] === v ? "selected" : ""}>${labels ? labels[i] : v}</option>`).join("");
    const syncTxt = RT.sync === "cloud" ? "Saved to your Claude account. Open this page on any device to continue." : RT.sync === "connecting" ? "Connecting to your account…" : RT.syncMsg || "Saved in this browser only.";
    return `<div class="profile">
      <div class="section-h"><div><div class="eyebrow">Fortschritt</div><h1 style="font-size:var(--t-2xl)">Your progress</h1></div></div>
      <section class="sheet pad stack">
        <div class="rank-name"><h2 style="font-size:var(--t-xl)">${esc(lv.rank[0])} · Stufe ${lv.L}</h2><span class="muted">${esc(lv.rank[1])}</span></div>
        <div class="bar"><i style="width:${Math.round((lv.cur / lv.need) * 100)}%"></i></div>
        <p class="muted small">${lv.cur} / ${lv.need} XP to level ${lv.L + 1}. Ranks follow the old German craft guilds: Lehrling (apprentice) → Geselle (journeyman, level 5) → Meister (level 12) → Obermeister (level 25).</p>
      </section>
      <div class="kpis">
        <div class="kpi"><b>${streak()}</b><span>day streak</span></div>
        <div class="kpi"><b>${p.xp}</b><span>total XP</span></div>
        <div class="kpi"><b>${learnedWords()}</b><span>words learned</span></div>
        <div class="kpi"><b>${acc}%</b><span>all-time accuracy</span></div>
      </div>
      <div class="cols">
        <section class="sheet pad"><div class="card-h"><h2>Activity</h2><span class="muted small">daily XP, last 26 weeks</span></div>${heatmap(26)}</section>
        <section class="sheet pad"><div class="card-h"><h2>Coming up</h2><span class="muted small">cards due, next 7 days</span></div>${forecast()}</section>
      </div>
      <section class="sheet pad"><div class="card-h"><h2>Grammar points</h2><span class="muted small">accuracy over your last 10 tries</span></div>
        ${cl.length ? `<div class="tbl-wrap"><table class="ctable"><thead><tr><th>Grammar point</th><th>Accuracy</th><th>Tries</th><th></th></tr></thead><tbody>${cl.map((c) => `<tr><td>${esc(c.label)}</td><td class="tnum">${enough(c) ? `<span class="bar ${c.acc < 0.75 ? "red" : "green"}"><i style="width:${Math.round(c.acc * 100)}%"></i></span>${Math.round(c.acc * 100)}%` : `<span class="muted small">needs ${4 - c.h.length} more ${4 - c.h.length === 1 ? "try" : "tries"}</span>`}</td><td class="tnum">${c.n}</td><td><button class="btn btn-sm" data-act="drill" data-c="${esc(c.id)}">Drill</button></td></tr>`).join("")}</tbody></table></div>` :
          `<div class="empty">Each grammar point you practise shows up here with its accuracy.</div>`}
      </section>
      <section class="sheet pad"><div class="card-h"><h2>Badges <small>Abzeichen</small></h2><span class="muted small">${Object.keys(p.badges).length} of ${BADGES.length}</span></div>
        <div class="badges">${BADGES.map((b) => stamp(b, !p.badges[b.id])).join("")}</div></section>
      <section class="sheet pad stack"><div class="card-h"><h2>Settings</h2></div>
        <div class="settings">
          <div class="field"><label for="set-new">New cards per day</label><select id="set-new" data-set="newPerDay">${opt("newPerDay", [3, 5, 8, 12, 20])}</select><span class="help">Fewer new cards means fewer reviews later.</span></div>
          <div class="field"><label for="set-len">Session length</label><select id="set-len" data-set="sessionLen">${opt("sessionLen", [10, 15, 25, 40], ["10 cards", "15 cards", "25 cards", "40 cards"])}</select><span class="help">Cards you miss come back within the session too.</span></div>
          <div class="field"><label for="set-goal">Daily goal</label><select id="set-goal" data-set="goal">${opt("goal", [30, 60, 100, 150], ["30 XP · relaxed", "60 XP · regular", "100 XP · serious", "150 XP · intense"])}</select></div>
          <div class="stack" style="gap:10px">
            <label class="check"><input type="checkbox" data-set="autoSay" ${set.autoSay ? "checked" : ""}><span>Read German answers aloud${Speech.ok ? (Speech.hasVoice() ? "" : " <span class=\"muted small\">(no German voice found on this device; a default voice is used)</span>") : " <span class=\"muted small\">(not supported in this browser)</span>"}</span></label>
            <label class="check"><input type="checkbox" data-set="strictCaps" ${set.strictCaps ? "checked" : ""}><span>Strict capitals: a lowercase noun counts as a slip</span></label>
          </div>
        </div>
      </section>
      ${dataSection(syncTxt)}
    </div>`;
  }
  function dataSection(syncTxt) {
    const f = FileSave, nm = f.handle ? esc(f.handle.name) : "";
    const h3 = (t) => `<h3 style="font-size:var(--t-md)">${t}</h3>`;
    let fileRow = "";
    if (f.state === "on") fileRow = `<p>Saving to <b>${nm}</b> after every answer${f.last ? `, last at ${new Date(f.last).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` : ""}.</p>
      <div class="row"><button class="btn btn-sm" data-act="file-choose">Use another file…</button><button class="btn btn-sm btn-ghost" data-act="file-forget">Stop saving to the file</button></div>`;
    else if (f.state === "ask") fileRow = `<p>The app needs your permission again to keep <b>${nm}</b> up to date.</p><div class="row"><button class="btn btn-accent btn-sm" data-act="file-reconnect">Reconnect</button><button class="btn btn-sm btn-ghost" data-act="file-forget">Stop saving to the file</button></div>`;
    else if (f.state === "missing") fileRow = `<p>Couldn't find <b>${nm}</b>. It may have been moved or deleted.</p><div class="row"><button class="btn btn-accent btn-sm" data-act="file-choose">Choose a save file…</button><button class="btn btn-sm" data-act="file-open">Open a save file…</button></div>`;
    else fileRow = `<p class="small muted">Keep your progress in a JSON file on your computer, for example in a synced folder. The app updates it after every answer. When it starts, it adds anything new in the file, such as progress saved from another computer.</p>
      <div class="row"><button class="btn btn-accent btn-sm" data-act="file-choose">Choose a save file…</button><button class="btn btn-sm" data-act="file-open">Open an existing save file…</button></div>`;
    const other = IN_CLAUDE ? "the desktop app" : `<a href="${CLAUDE_URL}" target="_blank" rel="noopener">the Claude version</a>`;
    return `<section class="sheet pad stack"><div class="card-h"><h2>Your data</h2><span class="row small"><span class="sync-dot ${RT.sync === "cloud" || f.state === "on" ? "on" : ""}"></span>${esc(syncTxt)}</span></div>
      ${f.ok ? `<div class="stack" style="gap:8px">${h3("Save file")}${fileRow}</div>` : ""}
      <div class="stack" style="gap:8px">${h3("Backups")}
        <p class="small muted">A backup file holds everything: card schedules, XP, badges and your own cards. Use one to move your progress to ${other} and back. When you load one, you can combine it with the progress here, so studying in both places loses nothing.</p>
        <div class="row"><button class="btn btn-sm" data-act="export-file">${IN_CLAUDE ? "Save" : "Download"} backup file</button><button class="btn btn-sm" data-act="import-file">Load backup file…</button><button class="btn btn-sm btn-ghost" data-act="backup-copy">Copy as text</button><button class="btn btn-sm btn-ghost" data-act="restore-open">Paste text</button><input type="file" id="imp" accept=".json,application/json" hidden></div>
      </div>
      <div class="row"><span style="flex:1"></span><button class="btn btn-ghost btn-danger btn-sm" data-act="reset-open">Reset all progress</button></div>
    </section>`;
  }

  // ---------- drawer ----------
  function renderDrawer() {
    const host = $("#drawer");
    const d = UI.drawer;
    if (!d) { host.innerHTML = ""; return; }
    let body = "";
    if (d.type === "card") body = drawerCard(d);
    else if (d.type === "form") body = drawerForm(d);
    else if (d.type === "known") {
      const U = C.UNITS[d.u - 1], us = unitStats(d.u);
      body = `<div class="drawer-h"><h2>Mark Unit ${d.u} as known?</h2>${closeBtn()}</div>
        <p>${us.total - us.seen} cards from <b>${esc(U.de)}</b> will skip the beginner steps and come back once for a check over the next few days. Get one wrong then and it goes back to learning.</p>
        <div class="row"><button class="btn btn-primary" data-act="unit-known-yes" data-u="${d.u}">Mark as known</button><button class="btn" data-act="drawer-close">Cancel</button></div>`;
    } else if (d.type === "reset") {
      body = `<div class="drawer-h"><h2>Reset all progress?</h2>${closeBtn()}</div><div class="confirm"><p>This deletes your card schedules, XP, streak, badges and your own cards${RT.sync === "cloud" ? " from your account and this browser" : FileSave.state === "on" ? " from this app and your save file" : " from this app"}. Copy a backup first if you might want them back.</p>
        <div class="row"><button class="btn btn-danger" data-act="reset-yes">Delete everything</button><button class="btn" data-act="drawer-close">Cancel</button></div></div>`;
    } else if (d.type === "restore") {
      body = `<div class="drawer-h"><h2>Restore from backup</h2>${closeBtn()}</div><div class="field"><label for="restore-text">Paste a backup copied from this page</label><textarea id="restore-text" rows="8"></textarea></div>
        ${d.err ? `<p class="form-err">${esc(d.err)}</p>` : ""}<div class="row"><button class="btn btn-primary" data-act="restore-yes">Restore</button><button class="btn" data-act="drawer-close">Cancel</button></div>`;
    } else if (d.type === "replace") {
      const when = +d.data.updatedAt ? new Date(+d.data.updatedAt).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" }) : "an unknown date";
      body = `<div class="drawer-h"><h2>Load ${esc(d.source)}?</h2>${closeBtn()}</div>
        <p><b>${esc(d.source)}</b> has ${+d.data.prof.xp || 0} XP and was last saved ${esc(when)}. This app has ${S.prof.xp} XP.</p>
        <div class="stack" style="gap:10px">
          <div><button class="btn btn-primary" data-act="load-merge">Combine both</button><p class="small muted" style="margin-top:6px">Recommended. Each card keeps its most recent review from either side, XP from both is added up, and nothing is lost.</p></div>
          <div class="confirm"><p class="small">Replace throws away the progress in this app and keeps only what's in ${esc(d.source)}.</p><div class="row"><button class="btn btn-danger" data-act="load-replace">Replace this app's progress</button><button class="btn" data-act="drawer-close">Cancel</button></div></div>
        </div>`;
    } else if (d.type === "backup") {
      body = `<div class="drawer-h"><h2>Your backup</h2>${closeBtn()}</div><p class="small muted">Copying wasn't allowed here. Select all of the text below and copy it yourself.</p><textarea id="backup-text" rows="12" readonly>${esc(JSON.stringify(S))}</textarea>`;
    } else if (d.type === "copy") {
      body = `<div class="drawer-h"><h2>${esc(d.title)}</h2>${closeBtn()}</div><p class="small muted">${esc(d.help)}</p><textarea id="copy-text" rows="16" readonly>${esc(d.text)}</textarea>`;
    } else if (d.type === "lesson") {
      const U = C.UNITS.find((x) => x.u === d.u);
      const sec = U && (U.lesson.find((s) => s.id === d.a) || U.lesson[0]);
      body = `<div class="drawer-h"><div><div class="eyebrow">Unit ${U.u} · ${esc(U.de)}</div><h2>${esc(sec.h)}</h2></div>${closeBtn()}</div><div class="prose">${sec.html}</div><p class="muted small">Your session is still open. Close this to continue.</p>`;
    }
    host.innerHTML = `<div class="scrim" data-act="scrim"><div class="drawer" role="dialog" aria-modal="true">${body}</div></div>`;
    const f = host.querySelector("input, textarea, select");
    if (f && d.type !== "card") f.focus();
    if (f && (d.type === "copy" || d.type === "backup")) f.select();
  }
  const closeBtn = () => `<button class="icon-btn" data-act="drawer-close" aria-label="Close">${I.close}</button>`;
  function drawerCard(d) {
    const card = CAT.cards.get(d.id);
    if (!card) return `<div class="drawer-h"><h2>Card not found</h2>${closeBtn()}</div>`;
    const st = S.cards[card.id];
    const status = st && st.sus ? "paused" : E.statusOf(st);
    const body = card.kind === "v" ? E.explainWord(card.e) : `<div class="wc"><div class="wc-head"><span class="wc-de">${esc(card.sk.title)}</span></div><div class="skill-sum">${card.sk.sum}</div>${E.lessonLink(card.sk.concepts[0])}</div>`;
    return `<div class="drawer-h"><span class="eyebrow">${card.u ? "Unit " + card.u : "My card"} · ${card.kind === "v" ? "word" : "grammar skill"}</span>${closeBtn()}</div>
      ${body}
      <dl class="dl">
        <dt>Status</dt><dd><span class="chip chip-${status === "paused" ? "suspended" : status}">${status}</span></dd>
        <dt>Next review</dt><dd>${relDue(st)}</dd>
        <dt>Interval</dt><dd>${st && st.s === "review" ? st.i + " day" + (st.i === 1 ? "" : "s") : "—"}</dd>
        <dt>Ease</dt><dd>${st && st.s !== "new" ? Math.round(st.e * 100) + "%" : "—"}</dd>
        <dt>Reviews</dt><dd>${st ? st.r : 0}</dd>
        <dt>Lapses</dt><dd>${st ? st.l : 0}${st && st.l >= 3 ? " · tricky card" : ""}</dd>
      </dl>
      <div class="row">
        ${RT.sample && card.kind === "v" ? `<button class="btn btn-claude btn-sm" data-act="mnemonic" data-id="${esc(card.id)}">${I.sparkle} Memory hook</button>` : ""}
        <button class="btn btn-sm" data-act="suspend" data-id="${esc(card.id)}">${st && st.sus ? "Resume" : "Pause"}</button>
        ${st && st.s !== "new" ? `<button class="btn btn-sm btn-ghost" data-act="reset-card" data-id="${esc(card.id)}">Reset progress</button>` : ""}
        ${card.u === 0 ? `<button class="btn btn-sm" data-act="edit-card" data-id="${esc(card.id)}">Edit</button><button class="btn btn-sm btn-ghost btn-danger" data-act="del-card" data-id="${esc(card.id)}">${d.confirmDel ? "Delete for good" : "Delete"}</button>` : ""}
      </div>
      <div class="claude-why" id="mn" hidden></div>`;
  }
  function drawerForm(d) {
    const c = d.id ? S.custom.find((x) => x.id === d.id) || {} : {};
    const v = (k, dflt = "") => esc(d.vals ? d.vals[k] || "" : c[k] || dflt);
    const t = d.vals ? d.vals.t : c.t || "n";
    const ex = c.ex || [];
    return `<div class="drawer-h"><h2>${d.id ? "Edit card" : "Add a card"}</h2>${closeBtn()}</div>
      <p class="small muted">Add any word you meet. It joins your daily practice right away and is reviewed like every other card.</p>
      <div class="field"><label for="f-t">Type</label><select id="f-t">${[["n", "Noun"], ["v", "Verb"], ["w", "Other word"], ["p", "Phrase"]].map(([k, l]) => `<option value="${k}" ${t === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <div class="field"><label for="f-de">German</label><input type="text" id="f-de" lang="de" autocomplete="off" spellcheck="false" value="${v("de")}" placeholder="der Schreibtisch"><span class="help">Nouns need their article: der, die or das.</span></div>
      ${umlKeys()}
      <div class="field"><label for="f-en">English</label><input type="text" id="f-en" autocomplete="off" value="${v("en")}" placeholder="desk"></div>
      <div class="field"><label for="f-pl">Plural code (nouns, optional)</label><input type="text" id="f-pl" autocomplete="off" value="${v("pl")}" placeholder="-e, ¨-e, -n, -en, -s, - …"><span class="help">Dictionary style: der Schreibtisch, -e → die Schreibtische.</span></div>
      <div class="field"><label for="f-note">Note (optional)</label><input type="text" id="f-note" autocomplete="off" value="${v("note")}"></div>
      <div class="grid2"><div class="field"><label for="f-ex">Example (German)</label><input type="text" id="f-ex" lang="de" autocomplete="off" value="${esc(d.vals ? d.vals.ex : ex[0] || "")}"></div><div class="field"><label for="f-exen">Example (English)</label><input type="text" id="f-exen" autocomplete="off" value="${esc(d.vals ? d.vals.exen : ex[1] || "")}"></div></div>
      ${d.err ? `<p class="form-err">${esc(d.err)}</p>` : ""}
      <div class="row"><button class="btn btn-primary" data-act="save-card">${d.id ? "Save" : "Add card"}</button><button class="btn" data-act="drawer-close">Cancel</button></div>`;
  }
  function saveCard() {
    const d = UI.drawer;
    const val = (id) => E.normSpace(($(id) || {}).value || "");
    const vals = { t: ($("#f-t") || {}).value || "n", de: val("#f-de"), en: val("#f-en"), pl: val("#f-pl"), note: val("#f-note"), ex: val("#f-ex"), exen: val("#f-exen") };
    let err = "";
    if (!vals.de || !vals.en) err = "Fill in both the German and the English.";
    else if (vals.t === "n" && !/^(der|die|das) \S/.test(vals.de)) err = "Start the noun with its article, for example: der Schreibtisch.";
    else if (vals.t === "n" && !/^(der|die|das) [A-ZÄÖÜ]/.test(vals.de)) err = "German nouns start with a capital letter: der Schreibtisch.";
    else if (vals.pl && vals.t === "n" && !/^(-|¨|¨?-(e|er|n|en|nen|s|se)|\/|=\S+)$/.test(vals.pl)) err = "Use a plural code like -e, ¨-e, -er, -n, -en, -s, or - (no change).";
    if (err) { UI.drawer = Object.assign({}, d, { vals, err }); renderDrawer(); return; }
    const entry = { t: vals.t, de: vals.de, en: vals.en, pl: vals.t === "n" && vals.pl ? vals.pl : null, note: vals.note || null, ex: vals.ex ? [vals.ex, vals.exen] : null };
    if (d.id) Object.assign(S.custom.find((x) => x.id === d.id) || {}, entry);
    else S.custom.unshift(Object.assign({ id: "c:" + Date.now().toString(36) }, entry));
    rebuild();
    Store.touch("profile");
    UI.drawer = null;
    toast(d.id ? "Card saved." : "Card added. It's in your next session.");
    render();
  }

  // ---------- actions ----------
  const ACTIONS = {
    nav: (el) => { UI.view = el.dataset.v; UI.drawer = null; if (UI.view === "write" && !UI.write) newTask(); render(); window.scrollTo(0, 0); },
    start: () => startSession("daily"),
    "more-new": () => startSession("new"),
    extra: (el) => startSession("extra", { unit: el.dataset.u ? +el.dataset.u : null }),
    drill: (el) => startSession("drill", { concept: el.dataset.c }),
    lesson: (el) => {
      const u = +el.dataset.u, a = el.dataset.a || null;
      if (UI.view === "session") { UI.drawer = { type: "lesson", u, a }; renderDrawer(); return; }
      UI.view = "lesson"; UI.lessonU = u; UI.lessonA = a; UI.drawer = null;
      if (!S.prof.read[u]) { S.prof.read[u] = Date.now(); Store.touch("profile"); }
      render();
      if (!a) window.scrollTo(0, 0);
    },
    toc: (el) => { const s = document.getElementById("sec-" + el.dataset.a); if (s) s.scrollIntoView({ behavior: "smooth", block: "start" }); },
    "unit-start": (el) => {
      const u = +el.dataset.u;
      if (!S.prof.started[u]) { S.prof.started[u] = Date.now(); checkBadges(); Store.touch("profile"); }
      toast(`Unit ${u} started. Its new cards come in your daily practice.`);
      render();
    },
    "unit-known": (el) => { UI.drawer = { type: "known", u: +el.dataset.u }; renderDrawer(); },
    "unit-known-yes": (el) => {
      const u = +el.dataset.u, t = Date.now();
      for (const id of CAT.byUnit[u] || []) {
        const st = S.cards[id];
        if (!st || st.s === "new") S.cards[id] = Object.assign(E.blankState(), { s: "review", i: 3, r: 1, d: E.dueAt(t, 1 + E.rnd(5)), t });
      }
      S.prof.started[u] = S.prof.started[u] || t;
      Store.touch("cards", "profile");
      UI.drawer = null;
      toast(`Unit ${u} marked as known. Its cards come back for a check soon.`);
      render();
    },
    say: () => {},
    pick: (el) => pickOpt(+el.dataset.i),
    check: () => checkNow(),
    dontknow: () => dontKnow(),
    next: () => commit(),
    "intro-ok": () => commit("good"),
    "intro-known": () => commit("known"),
    override: () => {
      const s = UI.session;
      if (!s || !s.res) return;
      s.res.verdict = "correct"; s.res.overridden = true;
      s.res.notes = ["Marked as correct. It counts as remembered."];
      for (const k in s.res.cr) s.res.cr[k] = true;
      s.grade = "good"; s.pendingXp = xpGain(s, "correct");
      render();
    },
    easy: () => { const s = UI.session; if (!s) return; s.easy = !s.easy; s.grade = s.easy ? "easy" : "good"; render(); },
    askwhy: () => askWhy(),
    "claude-stop": () => { if (RT.ctl) RT.ctl.abort(); },
    tile: (el) => { const s = UI.session; if (!s || s.phase !== "ask") return; s.tiles.push(+el.dataset.i); render(); },
    untile: (el) => { const s = UI.session; if (!s || s.phase !== "ask") return; s.tiles.splice(+el.dataset.i, 1); render(); },
    "tiles-clear": () => { const s = UI.session; if (s) { s.tiles = []; render(); } },
    uml: (el, ev) => {
      let target = RT.lastInput && document.body.contains(RT.lastInput) && !RT.lastInput.disabled ? RT.lastInput : null;
      if (!target) target = document.querySelector("#drawer input[type=text], .ans-input:not([disabled]), .cloze input:not([disabled]), #wtext");
      if (!target) return;
      const ch = ev.shiftKey ? el.dataset.ch.toUpperCase() : el.dataset.ch;
      const a = target.selectionStart != null ? target.selectionStart : target.value.length, b = target.selectionEnd != null ? target.selectionEnd : a;
      target.value = target.value.slice(0, a) + ch + target.value.slice(b);
      target.focus();
      try { target.setSelectionRange(a + ch.length, a + ch.length); } catch (e) { /* number inputs */ }
      target.dispatchEvent(new Event("input", { bubbles: true }));
    },
    quit: () => quitSession(),
    card: (el) => { UI.drawer = { type: "card", id: el.dataset.id }; renderDrawer(); },
    scrim: (el, ev) => { if (ev.target === el) { UI.drawer = null; renderDrawer(); } },
    "drawer-close": () => { UI.drawer = null; renderDrawer(); },
    suspend: (el) => {
      const id = el.dataset.id, st = S.cards[id] || (S.cards[id] = E.blankState());
      if (st.sus) delete st.sus; else st.sus = 1;
      Store.touch("cards");
      toast(st.sus ? "Card paused. It won't come up until you resume it." : "Card resumed.");
      if (UI.view === "cards") { refreshDeck(); const sc = $("#scount"); if (sc) sc.innerHTML = statusCounts(); }
      renderDrawer();
    },
    "reset-card": (el) => {
      const id = el.dataset.id, sus = S.cards[id] && S.cards[id].sus;
      delete S.cards[id];
      if (sus) S.cards[id] = Object.assign(E.blankState(), { sus: 1 });
      Store.touch("cards");
      toast("Progress reset. The card starts again as new.");
      if (UI.view === "cards") refreshDeck();
      renderDrawer();
    },
    mnemonic: (el) => mnemonic(el.dataset.id),
    "add-card": () => { UI.drawer = { type: "form" }; renderDrawer(); },
    "edit-card": (el) => { UI.drawer = { type: "form", id: el.dataset.id }; renderDrawer(); },
    "save-card": () => saveCard(),
    "del-card": (el) => {
      const id = el.dataset.id;
      if (!UI.drawer.confirmDel) { UI.drawer = Object.assign({}, UI.drawer, { confirmDel: true }); renderDrawer(); return; }
      S.custom = S.custom.filter((c) => c.id !== id);
      delete S.cards[id];
      rebuild();
      Store.touch("cards", "profile");
      UI.drawer = null;
      toast("Card deleted.");
      render();
    },
    "write-new": () => { if (UI.write) UI.write.text = ""; newTask(); render(); },
    "write-check": () => checkWriting(),
    "write-copy": () => {
      const text = (($("#wtext") || {}).value || "").trim();
      if (text.length < 6) { toast("Write a sentence or two first."); return; }
      UI.write.text = text;
      const prompt = writingPromptForChat(text);
      copyText(prompt, "Copied. Paste it into a chat at claude.ai.",
        { type: "copy", title: "Paste this into Claude", help: "Copying wasn't allowed here. Select all of the text below, copy it, and paste it into a chat at claude.ai.", text: prompt });
    },
    "lesson-ask": (el) => askLesson(+el.dataset.u),
    "backup-copy": () => copyText(JSON.stringify(S), "Backup copied. Paste it somewhere safe.", { type: "backup" }),
    "restore-open": () => { UI.drawer = { type: "restore" }; renderDrawer(); },
    "export-file": () => exportFile(),
    "import-file": () => { const i = $("#imp"); if (i) i.click(); },
    "load-merge": async () => {
      const d = UI.drawer;
      if (!d || d.type !== "replace") return;
      UI.drawer = null;
      await applyState(d.data, d.handle, "merge");
      toast(`Combined ${d.source} with your progress.`);
    },
    "load-replace": async () => {
      const d = UI.drawer;
      if (!d || d.type !== "replace") return;
      UI.drawer = null;
      await applyState(d.data, d.handle, "replace");
      toast(`Loaded ${d.source}.`);
    },
    "file-choose": () => FileSave.choose(),
    "file-open": () => FileSave.open(),
    "file-reconnect": () => FileSave.reconnect(),
    "file-forget": () => FileSave.forget(),
    "restore-yes": () => {
      let parsed = null;
      try { parsed = JSON.parse((($("#restore-text") || {}).value || "").trim()); } catch (e) { parsed = null; }
      if (!parsed || typeof parsed !== "object" || !parsed.prof || !parsed.cards) { UI.drawer = { type: "restore", err: "That doesn't look like a backup from this page. Copy it again with “Copy as text”." }; renderDrawer(); return; }
      offerReplace(parsed, "the pasted backup", null);
    },
    "reset-open": () => { UI.drawer = { type: "reset" }; renderDrawer(); },
    "reset-yes": () => {
      S = freshState();
      S.prof.resetAt = S.prof.created; // so another device's older copy can't bring the old progress back
      rebuild();
      Store.touch("cards", "profile");
      UI.drawer = null; UI.write = null; UI.wres = null; UI.summary = null;
      toast("All progress reset.");
      UI.view = "home";
      render();
    },
  };

  document.addEventListener("click", (ev) => {
    const sayEl = ev.target.closest("[data-say]");
    if (sayEl) Speech.say(sayEl.dataset.say);
    const el = ev.target.closest("[data-act]");
    if (!el || el.disabled) return;
    const fn = ACTIONS[el.dataset.act];
    if (fn) fn(el, ev);
  });
  // keep focus in the answer box when tapping the umlaut keys
  document.addEventListener("mousedown", (ev) => { if (ev.target.closest(".uml button")) ev.preventDefault(); });
  document.addEventListener("focusin", (ev) => {
    const t = ev.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA") && t.type !== "checkbox" && t.type !== "search") RT.lastInput = t;
  });
  document.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t.id === "cq") { UI.q = t.value; refreshDeck(); }
    else if (t.id === "wtext" && UI.write) UI.write.text = t.value;
    else if (t.id === "askq") UI.askQ = t.value;
  });
  document.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t.dataset && t.dataset.set) {
      const k = t.dataset.set;
      S.prof.settings[k] = t.type === "checkbox" ? t.checked : +t.value;
      Store.touch("profile");
      renderTop();
      toast("Setting saved.");
    } else if (t.id === "fu") { UI.fu = t.value; refreshDeck(); }
    else if (t.id === "fs") { UI.fs = t.value; refreshDeck(); }
    else if (t.id === "imp" && t.files && t.files[0]) {
      const file = t.files[0];
      file.text().then((txt) => {
        const d = parseBackup(txt);
        if (!d) toast("That file isn't a Deutschheft backup.");
        else offerReplace(d, file.name, null);
      }, () => toast("Couldn't read that file."));
      t.value = "";
    }
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && UI.drawer) { UI.drawer = null; renderDrawer(); return; }
    const sayEl = ev.target.closest && ev.target.closest(".say[data-say]");
    if (sayEl && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); Speech.say(sayEl.dataset.say); return; }
    if (UI.view !== "session" || !UI.session || UI.drawer) return;
    const s = UI.session, ex = s.ex, tag = ev.target.tagName;
    const inText = tag === "INPUT" || tag === "TEXTAREA";
    if (ev.key === "Enter" && !ev.shiftKey && !ev.isComposing) {
      if (tag === "BUTTON") return;
      ev.preventDefault();
      if (s.phase === "feedback") commit();
      else if (s.phase === "intro") commit("good");
      else if (ex.kind === "type" || ex.kind === "cloze" || ex.kind === "order") checkNow();
      return;
    }
    if (s.phase === "ask" && !inText && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
      if (["choice", "gender", "clock"].includes(ex.kind)) {
        const k = parseInt(ev.key, 10);
        if (k >= 1 && k <= ex.options.length) { ev.preventDefault(); pickOpt(k - 1); }
      } else if (ex.kind === "order" && ev.key === "Backspace" && s.tiles.length) { ev.preventDefault(); s.tiles.pop(); render(); }
    }
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { Store.flush(); FileSave.write(); } });

  // ---------- boot ----------
  function snapshot() {
    const s = UI.session;
    return {
      view: UI.view === "session" || UI.view === "summary" ? (s ? "session" : "home") : UI.view, lessonU: UI.lessonU,
      session: s ? Object.assign({}, s, { ex: null, res: null, claude: null }) : null,
    };
  }
  function start(data) {
    Speech.init();
    S = normalize(Store.loadLocal());
    rebuild();
    const d = data || {};
    if (d.view && d.view !== "session") { UI.view = d.view; UI.lessonU = d.lessonU || 1; }
    if (d.session && d.session.items) {
      UI.session = d.session; UI.view = "session";
      try { prepare(); } catch (e) { UI.session = null; UI.view = "home"; }
    }
    render();
    initCloud();
    if (!IN_CLAUDE) {
      // ask the browser not to evict this app's storage, then reconnect the save file if one was chosen
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* optional */ }
      FileSave.init();
    }
    try { if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(snapshot); } catch (e) { /* not in a viewer */ }
  }
  const hot = window.claude && window.claude.hot;
  if (hot && typeof hot.ready === "function") hot.ready(start);
  else start((hot && hot.data) || {});
})();
