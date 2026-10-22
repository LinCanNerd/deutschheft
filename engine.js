/* Deutschheft engine: grammar helpers, answer checking, spaced repetition, exercise generators.
   Pure logic, no DOM. Exposes globalThis.DH_ENGINE (and module.exports under Node for tests). */
(function (root) {
  "use strict";
  const C = root.DH_CONTENT;
  const DAY = 86400000;

  // ---------- utils ----------
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function weighted(pairs) {
    const total = pairs.reduce((s, p) => s + p[1], 0);
    let x = Math.random() * total;
    for (const [v, w] of pairs) if ((x -= w) < 0) return v;
    return pairs[pairs.length - 1][0];
  }
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const pad = (n) => String(n).padStart(2, "0");
  function slug(s) {
    return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function dayKey(ts) {
    const d = new Date(ts);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function dayStart(ts) {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  // Cards become due at 4 am on the target day, like Anki's day boundary.
  const dueAt = (now, days) => dayStart(now) + Math.round(days) * DAY + 4 * 3600000;
  const say = (t, label) => `<span class="say" role="button" tabindex="0" data-say="${esc(t)}">${label != null ? label : esc(t)}</span>`;
  const gchip = (art, word) => `<span class="g g-${art}">${esc(art)} ${esc(word)}</span>`;
  const G_LABEL = { der: "masculine (der)", die: "feminine (die)", das: "neuter (das)", pl: "plural (die)" };

  // ---------- nouns ----------
  function nounParts(de) {
    const m = /^(der|die|das) (.+)$/.exec(de);
    return m ? { art: m[1], word: m[2] } : { art: null, word: de };
  }
  // Put an umlaut on the last a/o/u (or au) of the word: Haus → Häus, Apfel → Äpfel.
  function umlautize(w) {
    const map = { a: "ä", o: "ö", u: "ü", A: "Ä", O: "Ö", U: "Ü" };
    for (let i = w.length - 1; i >= 0; i--) {
      const ch = w[i];
      if (!map[ch]) continue;
      if ((ch === "u" || ch === "U") && i > 0 && (w[i - 1] === "a" || w[i - 1] === "A")) return w.slice(0, i - 1) + map[w[i - 1]] + w.slice(i);
      return w.slice(0, i) + map[ch] + w.slice(i + 1);
    }
    return w;
  }
  function pluralOf(e, code) {
    const pl = code || e.pl;
    if (!pl || pl === "/") return null;
    if (pl === "pl") return e.word;
    if (pl[0] === "=") return pl.slice(1);
    let base = e.word, c = pl;
    if (c[0] === "¨") { base = umlautize(base); c = c.slice(1); }
    if (c === "" || c === "-") return base;
    return base + c.replace(/^-/, "");
  }
  const PL_DESC = { "-e": "add -e", "¨-e": "umlaut + -e", "-er": "add -er", "¨-er": "umlaut + -er", "-n": "add -n", "-en": "add -en",
    "-nen": "add -nen", "-s": "add -s", "-se": "add -se", "-": "no change", "¨": "umlaut only" };
  function pluralWhy(e) {
    const pl = e.pl, art = e.art, w = e.word;
    if (pl[0] === "=") return "An irregular Latin plural: -um becomes -en (Museum → Museen).";
    if (pl === "-nen") return "Women's job and role words in -in always double the n: -innen.";
    if (pl === "-s") return "Loanwords and nouns ending in a vowel like -o, -a, -y usually take -s.";
    if (pl === "-se") return "Nouns ending in -s double it before -e: der Bus → die Busse.";
    if (art === "die" && (pl === "-n" || pl === "-en")) return "Feminine nouns almost always take -n or -en in the plural.";
    if (art === "die") return "Unusual for a feminine noun (most take -n/-en), so this one is worth learning by heart.";
    if (/(er|el|en)$/.test(w) && (pl === "-" || pl === "¨"))
      return "Masculine and neuter nouns ending in -er, -el or -en usually don't add anything" + (pl === "¨" ? ", but this one gets an umlaut." : ".");
    if (art === "der" && (pl === "-e" || pl === "¨-e")) return "Typical for masculine nouns: -e" + (pl === "¨-e" ? ", often with an umlaut." : ".");
    if (art === "das" && (pl === "-er" || pl === "¨-er")) return "Typical for short neuter nouns: -er, with an umlaut when the vowel can take one.";
    if (art === "das" && pl === "-e") return "Many neuter nouns take -e.";
    if (art === "der" && (pl === "-n" || pl === "-en")) return "Masculine nouns for people often take -(e)n: der Student → die Studenten.";
    return "This plural doesn't follow the main tendencies, so learn it together with the noun.";
  }

  // ---------- verbs ----------
  const P_LABEL = ["ich", "du", "er / sie / es", "wir", "ihr", "sie / Sie"];
  function replaceLast(s, a, b) {
    const i = s.lastIndexOf(a);
    return i < 0 ? s : s.slice(0, i) + b + s.slice(i + a.length);
  }
  function verbInfo(v) {
    const sep = v.sep || "";
    const base = sep ? v.de.slice(sep.length) : v.de;
    const stem = base.endsWith("en") ? base.slice(0, -2) : base.slice(0, -1);
    if (v.f) return { forms: v.f.slice(), cls: v.k === "mod" ? "mod" : v.k ? "stem" : "irr", stem, base, sep };
    const needE = /[td]$/.test(stem) || /[bcdfgkpqstvwxyzß][mn]$/.test(stem);
    const sEnd = /(s|ß|z|x)$/.test(stem);
    let st2 = stem;
    if (v.k === "e>i") st2 = replaceLast(stem, "e", "i");
    else if (v.k === "e>ie") st2 = replaceLast(stem, "e", "ie");
    else if (v.k === "a>ä") st2 = replaceLast(stem, "a", "ä");
    else if (v.k === "au>äu") st2 = replaceLast(stem, "au", "äu");
    const changed = st2 !== stem;
    let du, er;
    if (changed) {
      du = st2 + (/(s|ß|z|x)$/.test(st2) ? "t" : "st");
      er = st2 + (/t$/.test(st2) ? "" : "t");
    } else {
      du = stem + (needE ? "est" : sEnd ? "t" : "st");
      er = stem + (needE ? "et" : "t");
    }
    const forms = [stem + "e", du, er, base, stem + (needE ? "et" : "t"), base];
    return { forms, cls: changed ? "stem" : needE ? "et" : sEnd ? "s" : "reg", stem, st2, base, sep };
  }
  function ppInfo(v) {
    if (!v.pp) return null;
    let cls;
    if (/ieren$/.test(v.de)) cls = "ieren";
    else if (v.sep) cls = "sep";
    else if (!v.pp.startsWith("ge") && /^(be|ver|er|ent|emp|zer)/.test(v.de)) cls = "insep";
    else if (v.pp.endsWith("t")) cls = "weak";
    else cls = "strong";
    return { pp: v.pp, aux: v.aux === "s" ? "sein" : "haben", cls };
  }
  const HABEN = ["habe", "hast", "hat", "haben", "habt", "haben"];
  const SEIN = ["bin", "bist", "ist", "sind", "seid", "sind"];
  function conceptForVerb(v) {
    const cls = v.info.cls;
    if (v.de === "sein") return "sein";
    if (v.de === "haben") return "haben";
    return { reg: "conj:reg", et: "conj:et", s: "conj:s", stem: "conj:stem", mod: "conj:modal" }[cls] || "conj:reg";
  }
  function classNote(v, p) {
    const i = v.info;
    const sepNote = i.sep ? ` Separable: in a sentence the prefix <b>${esc(i.sep)}</b> goes to the end (ich ${esc(i.forms[0])} … ${esc(i.sep)}).` : "";
    switch (i.cls) {
      case "reg": return `<p>Regular: stem <b>${esc(i.stem)}</b> + the ending.${sepNote}</p>`;
      case "et": return `<p>The stem <b>${esc(i.stem)}</b> ends in ${/[td]$/.test(i.stem) ? "-t or -d" : "a consonant + n"}, so du, er/sie/es and ihr get an extra <b>-e-</b>: du ${esc(i.forms[1])}, er ${esc(i.forms[2])}.${sepNote}</p>`;
      case "s": return `<p>The stem <b>${esc(i.stem)}</b> already ends in an s-sound, so du only adds <b>-t</b>: du ${esc(i.forms[1])} (not ${esc(i.stem)}st).${sepNote}</p>`;
      case "stem":
        return `<p>Vowel change in <b>du</b> and <b>er/sie/es</b> only: du ${esc(i.forms[1])}, er ${esc(i.forms[2])}.` +
          (p != null && p !== 1 && p !== 2 ? ` Here the person is ${P_LABEL[p]}, so there's <b>no change</b>.` : "") + `${sepNote}</p>`;
      case "mod": return `<p>Modal-type verb: ich and er/sie/es are identical, with no ending (ich ${esc(i.forms[0])}, er ${esc(i.forms[2])}).</p>`;
      default: return `<p>Irregular: learn all six forms by heart.</p>`;
    }
  }
  function conjTable(v, hl, custom) {
    const i = v.info;
    const rows = i.forms.map((f, k) => {
      let shown = esc(f);
      if (!v.f && f.startsWith(i.stem) && f !== i.base) shown = esc(i.stem) + "<mark>" + esc(f.slice(i.stem.length)) + "</mark>";
      else if (!v.f && f !== i.base) shown = "<mark>" + esc(f) + "</mark>";
      if (i.sep) shown += " … " + esc(i.sep);
      return `<tr class="${k === hl ? "hl" : ""}"><th scope="row">${P_LABEL[k]}</th><td>${shown}</td></tr>`;
    });
    return custom ? "" : `<div class="tbl-wrap"><table class="tbl conj"><thead><tr><th></th><th>${esc(v.de)}</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  }

  // ---------- numbers & time ----------
  const ONES = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf", "dreizehn",
    "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
  const TENS = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];
  function num2de(n) {
    if (n < 20) return ONES[n];
    if (n < 100) {
      const t = Math.floor(n / 10), u = n % 10;
      return u ? (u === 1 ? "ein" : ONES[u]) + "und" + TENS[t] : TENS[t];
    }
    const h = Math.floor(n / 100), r = n % 100;
    return (h === 1 ? "hundert" : ONES[h] + "hundert") + (r ? num2de(r) : "");
  }
  function numWhy(n) {
    const notes = [];
    const under = n % 100;
    if (n >= 100) notes.push(`Hundreds first: ${Math.floor(n / 100) === 1 ? "(ein)hundert" : ONES[Math.floor(n / 100)] + " + hundert"}, then the rest, all in one word.`);
    if (under >= 21 && under % 10) {
      const u = under % 10, t = Math.floor(under / 10);
      notes.push(`Ones before tens: <b>${u === 1 ? "ein" : ONES[u]}</b> + und + <b>${TENS[t]}</b> (${u} and ${t * 10}).`);
      if (u === 1) notes.push("eins drops its s before und: einundzwanzig.");
    } else if (under >= 13 && under <= 19) notes.push(`13–19 are ones + zehn: ${ONES[under - 10]} + zehn.`);
    else if (under > 0 && under < 13 && n < 100) notes.push("0–12 are their own words: learn them by heart.");
    const t = Math.floor(under / 10), u = under % 10;
    if (under === 16 || under === 17 || t === 6 || t === 7) notes.push("sechs and sieben get shortened: sechzehn, siebzehn, sechzig, siebzig.");
    if (t === 3) notes.push("30 is dreißig, spelled with ß and -ßig (not -zig).");
    if (u === 6 && t > 1) notes.push("But the ones keep their full form: sechsund…, siebenund….");
    return notes.map((x) => `<p>${x}</p>`).join("");
  }
  const HW = ["zwölf", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf"];
  const hw = (h) => HW[((h % 12) + 12) % 12];
  function timeDe(h, m) {
    const nx = hw(h + 1);
    switch (m) {
      case 0: return (((h % 12) + 12) % 12 === 1 ? "ein" : hw(h)) + " Uhr";
      case 5: return "fünf nach " + hw(h);
      case 10: return "zehn nach " + hw(h);
      case 15: return "Viertel nach " + hw(h);
      case 20: return "zwanzig nach " + hw(h);
      case 25: return "fünf vor halb " + nx;
      case 30: return "halb " + nx;
      case 35: return "fünf nach halb " + nx;
      case 40: return "zwanzig vor " + nx;
      case 45: return "Viertel vor " + nx;
      case 50: return "zehn vor " + nx;
      default: return "fünf vor " + nx;
    }
  }
  function timeWhy(h, m) {
    const H = ((h - 1) % 12) + 1, N = (H % 12) + 1;
    const official = `<p>Officially (timetables, radio) you can also say <b>${esc(hw(h) === "eins" ? "ein" : hw(h))} Uhr ${m ? esc(num2de(m)) : ""}</b>.</p>`;
    let p;
    if (m === 30) p = `<b>halb ${hw(h + 1)}</b> means 'half (of the way) to ${N}'. German counts toward the <b>next</b> hour, so ${H}:30 is halb ${hw(h + 1)}, not halb ${hw(h)}.`;
    else if (m === 25 || m === 35) p = `${H}:${pad(m)} is five minutes ${m === 25 ? "before" : "after"} half: <b>fünf ${m === 25 ? "vor" : "nach"} halb ${hw(h + 1)}</b>. Remember halb ${hw(h + 1)} = ${H}:30.`;
    else if (m === 15) p = `<b>Viertel nach</b> = quarter past. ${H}:15 = Viertel nach ${hw(h)}.`;
    else if (m === 45) p = `<b>Viertel vor</b> = quarter to, like English. ${H}:45 = Viertel vor ${hw(h + 1)}.`;
    else if (m === 0) p = `Full hours: <b>${H} Uhr</b>. Note that 1:00 is <b>ein Uhr</b> (no s).`;
    else if (m < 30) p = `<b>nach</b> = past/after: ${m} minutes after ${H}.`;
    else p = `<b>vor</b> = to/before: ${60 - m} minutes to ${N}.`;
    return `<p>${p}</p>` + official;
  }

  // ---------- answer checking ----------
  const normSpace = (s) => String(s == null ? "" : s).normalize("NFC").replace(/[’‘`´]/g, "'").replace(/\s+/g, " ").trim();
  const stripPunct = (s) => s.replace(/[.,!?;:¿¡"„“”«»…]/g, "").replace(/\s+/g, " ").trim();
  const translit = (s) => s.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue").replace(/ß/g, "ss");
  const deUml = (s) => s.replace(/[äÄ]/g, "a").replace(/[öÖ]/g, "o").replace(/[üÜ]/g, "u").replace(/ß/g, "ss");
  const hasUml = (s) => /[äöüÄÖÜß]/.test(s);
  function lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m || !n) return m || n;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  const RANK = { exact: 6, case: 5, translit: 4, umlaut: 2, typo: 1, none: 0 };
  function matchLevel(input, target) {
    const a = stripPunct(normSpace(input)), b = stripPunct(normSpace(target));
    if (!a) return { lvl: "none", target };
    if (a === b) return { lvl: "exact", target };
    const al = a.toLowerCase(), bl = b.toLowerCase();
    if (al === bl) return { lvl: "case", target };
    if (translit(al) === translit(bl)) return { lvl: "translit", target };
    if (deUml(al) === deUml(bl)) return { lvl: "umlaut", target };
    const d = lev(translit(al), translit(bl));
    const L = bl.length, tol = L <= 3 ? 0 : L <= 6 ? 1 : L <= 14 ? 2 : 3;
    return d <= tol ? { lvl: "typo", d, target } : { lvl: "none", d, target };
  }
  function bestMatch(input, targets) {
    let best = { lvl: "none", d: 99, target: targets[0] };
    for (const t of targets) {
      const m = matchLevel(input, t);
      if (RANK[m.lvl] > RANK[best.lvl] || (RANK[m.lvl] === RANK[best.lvl] && (m.d || 0) < (best.d || 99))) best = m;
    }
    return best;
  }
  function newRes(ex, user) {
    const cr = {};
    for (const c of ex.concepts || []) cr[c] = true;
    return { verdict: "wrong", notes: [], cr, user, mark: null };
  }
  function failAll(res) {
    for (const c of Object.keys(res.cr)) res.cr[c] = false;
    delete res.cr.umlaut; // a word that wasn't recalled says nothing about umlauts
  }
  function applyLevel(res, m, opts = {}) {
    if (m.lvl === "exact" || m.lvl === "case") res.verdict = "correct";
    else if (m.lvl === "translit") {
      res.verdict = "correct";
      res.notes.push(`ae / oe / ue / ss are accepted. The real spelling is <b>${esc(m.target)}</b>.`);
    } else if (m.lvl === "umlaut" && !opts.strict) {
      res.verdict = "almost"; res.mark = "R"; res.cr.umlaut = false;
      res.notes.push(`Watch the umlauts and ß: <b>${esc(m.target)}</b>.`);
    } else if (m.lvl === "typo" && !opts.strict) {
      res.verdict = "almost"; res.mark = "R";
      res.notes.push(`A small spelling slip. It's <b>${esc(m.target)}</b>.`);
    } else {
      res.verdict = "wrong";
      failAll(res);
    }
    if (res.verdict === "correct" && hasUml(m.target) && !("umlaut" in res.cr) && m.lvl !== "translit") res.cr.umlaut = true;
  }
  function checkType(ex, raw, opts = {}) {
    const res = newRes(ex, normSpace(raw));
    if (!res.user) { res.blank = true; failAll(res); return res; }
    if (ex.noun) return checkNoun(ex, res, opts);
    const m = bestMatch(res.user, ex.accepts);
    applyLevel(res, m, { strict: ex.strict });
    if (res.verdict === "wrong") res.mark = ex.mark || "W";
    if (ex.diagnose && res.verdict !== "correct") ex.diagnose([res.user], res);
    return res;
  }
  function checkNoun(ex, res, opts) {
    const n = ex.noun;
    const mm = /^(der|die|das)\s+(.+)$/i.exec(res.user);
    const uArt = mm ? mm[1].toLowerCase() : null;
    const uWord = mm ? mm[2] : res.user;
    const m = bestMatch(uWord, [n.word]);
    const plM = n.plural && n.plural !== n.word ? matchLevel(uWord, n.plural) : null;
    if (m.lvl === "none" || (plM && RANK[plM.lvl] >= RANK.translit)) {
      if (plM && plM.lvl !== "none") res.notes.push(`That's the plural. The singular is <b>${esc(n.art + " " + n.word)}</b>.`);
      res.verdict = "wrong"; res.mark = "W";
      res.cr = {}; // the word wasn't recalled, so this says nothing about gender or spelling
      return res;
    }
    if ("gender" in res.cr) res.cr.gender = uArt === n.art;
    if (n.rule && "gr:" + n.rule in res.cr) res.cr["gr:" + n.rule] = uArt === n.art;
    if (/^[a-zäöüß]/.test(uWord)) {
      res.cr.cap = false;
      res.notes.push(`Nouns always start with a capital letter: <b>${esc(n.word)}</b>.`);
    } else res.cr.cap = true;
    if (!uArt) {
      res.verdict = "almost"; res.mark = "Gr";
      res.notes.unshift(`Add the article: <b>${esc(n.art + " " + n.word)}</b>. Learn every noun with der, die or das.`);
      return res;
    }
    if (uArt !== n.art) {
      res.verdict = "wrong"; res.mark = "Gr"; res.genderWrong = true;
      res.notes.unshift(`Right word, wrong article. It's <b>${esc(n.art + " " + n.word)}</b>.`);
      return res;
    }
    const keepCap = res.cr.cap;
    applyLevel(res, m, {});
    if (res.verdict === "wrong") return res;
    res.cr.cap = keepCap;
    if (!keepCap && opts.strictCaps && res.verdict === "correct") { res.verdict = "almost"; res.mark = "R"; }
    return res;
  }
  function checkCloze(ex, vals) {
    const res = newRes(ex, vals.map((v) => normSpace(v)).join(" … "));
    let worst = "correct";
    res.blankRes = ex.blanks.map((b, i) => {
      const m = bestMatch(vals[i] || "", b.accepts);
      let st;
      if (m.lvl === "exact" || m.lvl === "case" || m.lvl === "translit") st = "correct";
      else if (!b.strict && !ex.strict && (m.lvl === "umlaut" || m.lvl === "typo")) st = "almost";
      else st = "wrong";
      if (st === "wrong") worst = "wrong";
      else if (st === "almost" && worst === "correct") worst = "almost";
      return st;
    });
    res.verdict = worst;
    if (worst === "wrong") { failAll(res); res.mark = ex.mark || "Gr"; }
    if (worst === "almost") { res.mark = "R"; res.notes.push("Nearly: check the spelling."); }
    if (ex.diagnose && worst !== "correct") ex.diagnose(vals.map(normSpace), res);
    return res;
  }
  function checkChoice(ex, val) {
    const res = newRes(ex, String(val));
    res.verdict = val === ex.answer ? "correct" : "wrong";
    if (res.verdict === "wrong") { failAll(res); res.mark = ex.mark || "Gr"; }
    if (ex.diagnose && res.verdict === "wrong") ex.diagnose([val], res);
    return res;
  }
  function checkOrder(ex, chunks) {
    const res = newRes(ex, chunks.join(" ") + ex.punct);
    const canon = ex.orders[0];
    if (ex.orders.some((o) => o.join("|") === chunks.join("|"))) { res.verdict = "correct"; return res; }
    const last = canon.length - 1;
    const sameFrame = chunks[0] === canon[0] && chunks[1] === canon[1] && (!ex.bracket || chunks[last] === canon[last]);
    if (sameFrame && chunks.length === canon.length) {
      res.verdict = "almost"; res.mark = "Sb";
      res.notes.push("The verb positions are right. Only the middle is in an unusual order: German usually puts the time first, then the rest.");
      return res;
    }
    res.verdict = "wrong"; res.mark = "Sb"; failAll(res);
    return res;
  }
  function check(ex, input, opts) {
    switch (ex.kind) {
      case "type": return checkType(ex, input, opts);
      case "cloze": return checkCloze(ex, input);
      case "order": return checkOrder(ex, input);
      default: return checkChoice(ex, input);
    }
  }
  // Character diff for the red-pen display: [{t: "same"|"del"|"ins", s}]
  function diff(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--)
      dp[i][j] = a[i].toLowerCase() === b[j].toLowerCase() ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const out = [];
    const push = (t, s) => { if (out.length && out[out.length - 1].t === t) out[out.length - 1].s += s; else out.push({ t, s }); };
    let i = 0, j = 0;
    while (i < m && j < n) {
      if (a[i].toLowerCase() === b[j].toLowerCase() && a[i] === b[j]) { push("same", a[i]); i++; j++; }
      else if (a[i].toLowerCase() === b[j].toLowerCase()) { push("del", a[i]); push("ins", b[j]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { push("del", a[i]); i++; }
      else { push("ins", b[j]); j++; }
    }
    while (i < m) push("del", a[i++]);
    while (j < n) push("ins", b[j++]);
    return out;
  }

  // ---------- spaced repetition (SM-2 with in-session learning steps) ----------
  const blankState = () => ({ s: "new", st: 0, i: 0, e: 2.5, r: 0, l: 0, d: 0, t: 0 });
  // grade: again | hard | good | easy. Returns {c: new state, requeue: positions later in this session, or null}
  // Learning and relearning both have two steps: step 0 is asked as recognition, step 1 as production.
  function schedule(prev, grade, now) {
    const c = Object.assign(blankState(), prev || {});
    c.t = now;
    if (c.s === "new") {
      if (grade === "known") { c.s = "review"; c.i = 4; c.r = 1; c.d = dueAt(now, 4); return { c, requeue: null }; }
      c.s = "learn"; c.st = 0; c.d = now;
      return { c, requeue: 3 };
    }
    if (c.s === "learn" || c.s === "relearn") {
      if (grade === "again") { c.st = 0; c.d = now; return { c, requeue: 3 }; }
      if (grade === "hard") { c.d = now; return { c, requeue: 4 }; }
      if (grade === "easy" || c.st >= 1) {
        if (c.s === "relearn") { c.s = "review"; c.d = dueAt(now, c.i); return { c, requeue: null }; }
        c.s = "review"; c.i = grade === "easy" ? 4 : 1; c.r = 1; c.d = dueAt(now, c.i);
        return { c, requeue: null };
      }
      c.st = 1; c.d = now;
      return { c, requeue: 5 };
    }
    if (grade === "again") {
      c.l++; c.e = Math.max(1.3, c.e - 0.2); c.i = Math.max(1, Math.round(c.i * 0.4)); c.s = "relearn"; c.st = 0; c.d = now;
      return { c, requeue: 4 };
    }
    let ni;
    if (grade === "hard") { ni = Math.max(c.i + 1, c.i * 1.2); c.e = Math.max(1.3, c.e - 0.15); }
    else if (grade === "easy") { ni = Math.max(c.i + 2, c.i * c.e * 1.3); c.e += 0.15; }
    else ni = Math.max(c.i + 1, c.i * c.e);
    if (ni >= 3) ni *= 0.95 + Math.random() * 0.1;
    c.i = Math.min(365, Math.round(ni)); c.r++; c.d = dueAt(now, c.i);
    return { c, requeue: null };
  }
  function statusOf(c) {
    if (!c || c.s === "new") return "new";
    if (c.sus) return "suspended";
    if (c.s === "learn" || c.s === "relearn") return "learning";
    return c.i >= 21 ? "mature" : "young";
  }
  function mastery(c) {
    if (!c || c.s === "new") return 0;
    if (c.s === "learn") return 0.1;
    if (c.s === "relearn") return 0.25;
    return c.i >= 21 ? 1 : c.i >= 10 ? 0.8 : c.i >= 4 ? 0.6 : 0.4;
  }

  // ---------- catalog ----------
  function enrich(e) {
    if (e.t === "n") {
      const p = nounParts(e.de);
      e.art = p.art; e.word = p.word;
      if (!e.art) { e.t = "w"; return e; }
      e.plOnly = e.pl === "pl" || e.r === "pl";
      e.gk = e.plOnly ? "pl" : e.art;
      e.plural = pluralOf(e);
      e.cats = new Set(String(e.c || "").split(/\s+/).filter(Boolean));
    } else if (e.t === "v") {
      e.info = verbInfo(e);
      e.ppi = ppInfo(e);
    }
    e.gap = contextTarget(e);
    return e;
  }
  const VOCAB = C.V.map((e) => enrich(Object.assign({}, e, { id: "v:" + slug(e.de) })));
  const DEMO = C.DEMO.map((e) => enrich(Object.assign({}, e)));
  const NOUNS = VOCAB.filter((e) => e.t === "n");
  const VERBS = VOCAB.filter((e) => e.t === "v");
  const SKILL_BY_ID = Object.fromEntries(C.SKILLS.map((s) => [s.id, s]));

  function customEntry(cc) {
    const e = { t: cc.t, de: normSpace(cc.de), en: normSpace(cc.en), note: cc.note, ex: cc.ex && cc.ex[0] ? cc.ex : null, pl: cc.pl || null, custom: 1, id: cc.id, u: 0 };
    if (e.t === "n" && !/^(der|die|das) /.test(e.de)) e.t = "w";
    return enrich(e);
  }
  function buildCatalog(custom) {
    const cards = new Map(), order = [], byUnit = {};
    const add = (card) => { cards.set(card.id, card); order.push(card.id); (byUnit[card.u] = byUnit[card.u] || []).push(card.id); };
    for (const cc of custom || []) add({ id: cc.id, kind: "v", u: 0, e: customEntry(cc) });
    for (const U of C.UNITS) {
      const vocab = VOCAB.filter((e) => e.u === U.u);
      const skills = C.SKILLS.filter((s) => s.u === U.u);
      const slots = skills.map((_, k) => Math.min(vocab.length, 3 + Math.floor((k * vocab.length) / (skills.length + 1))));
      let k = 0;
      vocab.forEach((e, i) => {
        while (k < skills.length && slots[k] <= i) { add({ id: "s:" + skills[k].id, kind: "s", u: U.u, sk: skills[k] }); k++; }
        add({ id: e.id, kind: "v", u: U.u, e });
      });
      while (k < skills.length) { add({ id: "s:" + skills[k].id, kind: "s", u: U.u, sk: skills[k] }); k++; }
    }
    return { cards, order, byUnit, entries: [...cards.values()].filter((c) => c.kind === "v").map((c) => c.e) };
  }

  // ---------- explanations shared by exercises ----------
  function ruleBox(n) {
    const r = n.r && C.RULES[n.r];
    if (!r) return `<div class="rule rule-none"><span class="rule-tag">no rule</span><div>No reliable rule for this one. Learn it as a unit, <b>${esc(n.art + " " + n.word)}</b>, and picture it in its colour.</div></div>`;
    let extra = "";
    if (n.r === "comp" && n.b) extra = ` Last part: <b>${esc(n.b)}</b> → <b>${esc(n.art + " " + n.word)}</b>.`;
    if (n.r === "sex") extra = ` ${esc(n.word)} → ${n.art === "der" ? "male → der" : "female → die"}.`;
    return `<div class="rule rule-${r.g || n.art}"><span class="rule-tag">${esc(r.tag)}</span><div>${r.text}${extra} <span class="rule-ex">${esc(r.ex)}</span></div></div>`;
  }
  function explainWord(e, opts = {}) {
    let h = `<div class="wc">`;
    const deCls = e.t === "n" ? `g-${e.plOnly ? "pl" : e.art}` : "";
    h += `<div class="wc-head"><span class="wc-de ${deCls}">${esc(e.de)}</span>${say(e.de, '<span class="i-say" aria-label="Listen"></span>')}<span class="wc-en">${esc(e.en)}</span></div>`;
    if (e.t === "n") {
      if (e.plOnly) h += `<div class="wc-row"><span class="k">Plural only</span><span>no singular form</span></div>`;
      else if (e.plural) h += `<div class="wc-row"><span class="k">Plural</span><span>die ${esc(e.plural)} <span class="code">${esc(e.pl)}</span></span></div>`;
      else if (e.pl === "/") h += `<div class="wc-row"><span class="k">Plural</span><span>usually none (uncountable)</span></div>`;
      h += ruleBox(e);
    } else if (e.t === "v") {
      if (!e.custom) h += conjTable(e, opts.hl) + classNote(e, opts.hl);
      if (e.ppi) h += `<div class="wc-row"><span class="k">Perfekt</span><span>${e.ppi.aux === "sein" ? "ist" : "hat"} ${esc(e.pp)}</span></div>`;
    }
    if (e.note) h += `<p class="note">${esc(e.note)}</p>`;
    if (e.ex && e.ex[0]) h += `<div class="wc-ex">${say(e.ex[0])}<span class="en">${esc(e.ex[1] || "")}</span></div>`;
    return h + `</div>`;
  }
  const ART = {
    nom: { def: { der: "der", die: "die", das: "das", pl: "die" }, indef: { der: "ein", die: "eine", das: "ein", pl: "" }, neg: { der: "kein", die: "keine", das: "kein", pl: "keine" } },
    acc: { def: { der: "den", die: "die", das: "das", pl: "die" }, indef: { der: "einen", die: "eine", das: "ein", pl: "" }, neg: { der: "keinen", die: "keine", das: "kein", pl: "keine" } },
    dat: { def: { der: "dem", die: "der", das: "dem", pl: "den" }, indef: { der: "einem", die: "einer", das: "einem", pl: "" }, neg: { der: "keinem", die: "keiner", das: "keinem", pl: "keinen" } },
  };
  const POSS_END = { nom: { der: "", die: "e", das: "", pl: "e" }, acc: { der: "en", die: "e", das: "", pl: "e" }, dat: { der: "em", die: "er", das: "em", pl: "en" } };
  function possForm(stem, cas, gk) {
    const end = POSS_END[cas][gk];
    if (!end) return stem;
    return (stem.toLowerCase() === "euer" ? stem.slice(0, 2) + "r" : stem) + end;
  }
  const CASE_LABEL = { nom: "Nominativ", acc: "Akkusativ", dat: "Dativ" };
  function artTable(cas, type, gk) {
    const cols = ["der", "die", "das", "pl"];
    const forms = (c) => cols.map((g) => (type === "poss" ? possForm("mein", c, g) : ART[c][type][g]) || "–");
    const row = (c) => `<tr class="${c === cas ? "hl-row" : ""}"><th scope="row">${CASE_LABEL[c]}</th>${forms(c).map((f, i) =>
      `<td class="${c === cas && cols[i] === gk ? "hl" : ""}">${esc(f)}</td>`).join("")}</tr>`;
    return `<div class="tbl-wrap"><table class="tbl arts"><thead><tr><th></th><th class="g-der">der</th><th class="g-die">die</th><th class="g-das">das</th><th class="g-pl">plural</th></tr></thead><tbody>${row("nom")}${cas !== "nom" ? row(cas) : ""}</tbody></table></div>`;
  }
  function lessonLink(concept) {
    const k = C.CONCEPTS[concept];
    if (!k) return "";
    const U = C.UNITS.find((x) => x.u === k.u);
    return `<button class="link" data-act="lesson" data-u="${k.u}" data-a="${esc(k.a)}">Read more: Unit ${k.u} · ${esc(U ? U.de : "")}</button>`;
  }
  function filledSentence(parts, answers) {
    let k = 0;
    return parts.map((p) => (p === null ? `<mark>${esc(answers[k++])}</mark>` : esc(p))).join("");
  }
  const plainSentence = (parts, answers) => { let k = 0; return parts.map((p) => (p === null ? answers[k++] : p)).join(""); };

  // ---------- generator helpers ----------
  const has = (n, ...cats) => cats.some((c) => n.cats && n.cats.has(c));
  const countable = (n) => !n.m && !n.plOnly && !n.demo;
  function prefer(list, ctx, min = 4) {
    const pref = list.filter((e) => e.custom || (ctx.started && ctx.started.has(e.u)));
    return pref.length >= min ? pref : list;
  }
  const SUBJ = [
    { s: "ich", p: 0 }, { s: "du", p: 1 }, { s: "er", p: 2, en: "he" }, { s: "sie", p: 2, en: "she" }, { s: "wir", p: 3 },
    { s: "ihr", p: 4, en: "you, plural" }, { s: "sie", p: 5, en: "they" }, { s: "Sie", p: 5, en: "you, polite" },
    { s: "Paul", p: 2, as: "er" }, { s: "Anna", p: 2, as: "sie" }, { s: "Tom und Lisa", p: 5, as: "sie (they)" }, { s: "das Kind", p: 2, as: "es", key: "kind" },
  ];
  function pickSubject(prefP, avoid = "") {
    const low = avoid.toLowerCase();
    let pool = SUBJ.filter((s) => !(s.as && low.includes((s.key || s.s).toLowerCase())));
    if (prefP && Math.random() < 0.7) pool = pool.filter((s) => prefP.includes(s.p));
    return pick(pool);
  }
  const subjHint = (sj) => (sj.en ? `${sj.s} = ${sj.en}` : null);
  const subjWho = (sj) => (sj.as ? `<b>${esc(sj.s)}</b> = ${esc(sj.as)}, so you need the <b>${P_LABEL[sj.p]}</b> form.` : `The subject is <b>${esc(sj.s)}</b>${sj.en ? ` (${esc(sj.en)})` : ""}, so you need the <b>${P_LABEL[sj.p]}</b> form.`);
  const label = (c) => (C.CONCEPTS[c] ? C.CONCEPTS[c].label : c);

  // ---------- vocabulary exercises ----------
  function vocabIntro(card) {
    const e = card.e;
    return { kind: "intro", card: card.id, tag: "Vocabulary", title: "New " + typeLabel(e).toLowerCase(), concepts: [], xp: 2, html: explainWord(e), say: e.de, plain: e.de };
  }
  function typeLabel(e) {
    return { n: "Noun", v: "Verb", w: "Word", p: "Phrase" }[e.t] || "Word";
  }
  function recogEx(card, ctx) {
    const e = card.e;
    const others = shuffle(ctx.cat.entries.filter((x) => x !== e && x.t === e.t && x.en !== e.en));
    const same = others.filter((x) => x.u === e.u);
    const dis = [...new Set([...same, ...others].map((x) => x.en))].slice(0, 3);
    const opts = shuffle([e.en, ...dis]).map((v) => ({ v, html: esc(v) }));
    return {
      kind: "choice", card: card.id, tag: typeLabel(e), title: "What does it mean?", concepts: [], xp: 5, mark: "W",
      prompt: `<span class="big-de ${e.t === "n" ? "g-" + (e.plOnly ? "pl" : e.art) : ""}">${esc(e.de)}</span>`, say: e.de, sayFirst: true,
      options: opts, answer: e.en, correctHtml: `${esc(e.de)} = <b>${esc(e.en)}</b>`, plain: `${e.de} = ?`,
      explain: () => explainWord(e),
    };
  }
  // Where the word itself appears in its example sentence, so the sentence can become a gap exercise.
  // (function declarations: the catalog calls these while the module is still loading)
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function contextTarget(e) {
    if (!e.ex || !e.ex[0] || e.t === "p" || e.sep) return null;
    const cands = e.t === "n" ? [e.word, e.plural] : e.t === "v" ? [...e.info.forms, e.de, e.pp] : [e.de];
    for (const c of [...new Set(cands.filter(Boolean))].sort((a, b) => b.length - a.length)) {
      const m = new RegExp(`(^|[^\\p{L}])(${escRe(c)})(?![\\p{L}])`, "iu").exec(e.ex[0]);
      if (m) {
        const word = m[2];
        return { i: m.index + m[1].length, word, plural: e.t === "n" && e.plural !== e.word && word.toLowerCase() === String(e.plural).toLowerCase() };
      }
    }
    return null;
  }
  function contextEx(card) {
    const e = card.e, T = e.gap, s = e.ex[0];
    const parts = [s.slice(0, T.i), null, s.slice(T.i + T.word.length)];
    const lw = T.word.toLowerCase();
    const isVerb = e.t === "v";
    const kind = e.t === "n" ? (T.plural ? "noun, plural" : "noun") : isVerb ? (lw === e.de ? "verb" : "verb, in the right form") : typeLabel(e).toLowerCase();
    let formNote = "";
    if (isVerb && lw === String(e.pp).toLowerCase()) formNote = `<b>${esc(T.word)}</b> is the past participle of ${esc(e.de)} (Perfekt).`;
    else if (isVerb && lw === e.de) formNote = `<b>${esc(T.word)}</b> looks like the infinitive. It's also the wir and sie / Sie form.`;
    else if (isVerb) {
      const who = e.info.forms.map((f, k) => (f.toLowerCase() === lw ? P_LABEL[k] : null)).filter(Boolean);
      if (who.length) formNote = `<b>${esc(T.word)}</b> is the <b>${who.join(" and ")}</b> form of ${esc(e.de)}.`;
    } else if (T.plural) formNote = `The sentence needs the plural: <b>${esc(T.word)}</b>.`;
    return {
      kind: "cloze", card: card.id, tag: typeLabel(e), title: "Complete the sentence", concepts: hasUml(T.word) ? ["umlaut"] : [], xp: 9, parts,
      prompt: `<span class="sent sent-a">${esc(e.ex[1] || "")}</span>`, blanks: [{ accepts: [T.word, ...(e.alt || [])], strict: isVerb }], hints: [kind],
      solution: filledSentence(parts, [T.word]), sayAfter: s, plain: plainSentence(parts, ["___"]), mark: "W",
      diagnose: (vals, res) => {
        const u = (vals[0] || "").toLowerCase();
        if (isVerb && u !== lw && [...e.info.forms, e.de, e.pp].some((f) => f && f.toLowerCase() === u)) {
          res.mark = "Gr";
          res.notes.push(`Right verb, wrong form. ${formNote}`);
        } else if (e.t === "n" && e.plural && e.plural !== e.word && [e.word, e.plural].some((f) => f.toLowerCase() === u)) {
          res.mark = "Gr";
          res.notes = [T.plural ? `That's the singular. The sentence needs the plural: <b>${esc(T.word)}</b>.` : `That's the plural. The sentence needs the singular: <b>${esc(T.word)}</b>.`];
        }
      },
      explain: () => (formNote ? `<p>${formNote}</p>` : "") + explainWord(e),
    };
  }
  function dictEx(card) {
    const e = card.e, de = e.ex[0];
    return {
      kind: "type", card: card.id, tag: typeLabel(e), title: "Listen and write the sentence", concepts: [], xp: 12, long: true,
      prompt: `<button class="btn btn-say-big" data-act="say" data-say="${esc(de)}"><span class="i-say"></span> Play again</button>`,
      sub: "Write the whole sentence", say: de, sayFirst: true, sayAfter: de, accepts: [de], mark: "R",
      correctHtml: esc(de), plain: `(listening) ${de}`,
      explain: () => explainWord(e),
    };
  }
  function nounConcepts(e) {
    const cs = ["gender", "cap"];
    if (e.r && C.RULES[e.r]) cs.push("gr:" + e.r);
    return cs;
  }
  function produceEx(card, ctx, listen) {
    const e = card.e;
    const isN = e.t === "n";
    const hint = isN ? (e.plOnly ? "noun, plural only: include die" : "noun: include der, die or das") : e.t === "v" ? "verb: the infinitive" : "";
    const ex = {
      kind: "type", card: card.id, tag: typeLabel(e), concepts: isN ? nounConcepts(e) : [], xp: listen ? 12 : 10,
      title: listen ? "Listen and type what you hear" : "Type it in German",
      prompt: listen ? `<button class="btn btn-say-big" data-act="say" data-say="${esc(e.de)}"><span class="i-say"></span> Play again</button>` : `<span class="big-en">${esc(e.en)}</span>`,
      sub: listen ? "" : hint, say: listen ? e.de : null, sayFirst: !!listen, sayAfter: e.de,
      accepts: [e.de, ...(e.alt || [])],
      noun: isN ? { art: e.art, word: e.word, plural: e.plural, rule: e.r && C.RULES[e.r] ? e.r : null } : null,
      correctHtml: `<span class="${isN ? "g-" + (e.plOnly ? "pl" : e.art) : ""}">${esc(e.de)}</span>`, plain: listen ? `(listening) ${e.de}` : `${e.en} → ?`,
      explain: () => explainWord(e) + (listen ? `<p class="note">Meaning: ${esc(e.en)}</p>` : ""),
    };
    if (hasUml(e.de)) ex.concepts.push("umlaut");
    return ex;
  }
  function genderEx(n, cardId, why) {
    const isDemo = !!n.demo;
    const concepts = ["gender"];
    if (n.r && C.RULES[n.r] && n.r !== "pl") concepts.push("gr:" + n.r);
    return {
      kind: "gender", card: cardId || null, tag: "Gender", title: isDemo ? "New word: guess the gender from its ending" : "der, die or das?",
      concepts, xp: 5, prompt: `<span class="big-de">${esc(n.word)}</span>`, sub: n.en, say: null, sayAfter: n.de,
      options: ["der", "die", "das"].map((v) => ({ v, html: v, cls: "g-" + v })), answer: n.art,
      correctHtml: gchip(n.art, n.word), plain: `___ ${n.word} (${n.en})`, mark: "Gr",
      explain: () => (isDemo ? `<p>You haven't studied <b>${esc(n.word)}</b> (${esc(n.en)}). That's the point: the rule lets you get it right anyway.</p>` : "") + ruleBox(n) + (why || ""),
    };
  }

  // ---------- grammar generators ----------
  function genGender(ctx, rule) {
    let pool;
    if (rule) pool = [...NOUNS, ...DEMO].filter((n) => n.r === rule && !n.plOnly);
    else {
      const seen = NOUNS.filter((n) => !n.plOnly && ctx.state[n.id] && ctx.state[n.id].s !== "new");
      const ruled = DEMO;
      pool = Math.random() < 0.55 && seen.length >= 4 ? seen : Math.random() < 0.6 ? ruled : prefer(NOUNS.filter((n) => !n.plOnly && n.r), ctx);
    }
    if (!pool.length) pool = NOUNS.filter((n) => !n.plOnly);
    return genderEx(pick(pool));
  }
  function genPlural(ctx) {
    const pool = prefer(NOUNS.filter((n) => n.plural && !n.plOnly && !n.px), ctx);
    const n = pick(pool);
    const codes = ["-e", "¨-e", "-er", "¨-er", "-n", "-en", "-s", "-"];
    const seen = new Set([n.plural]);
    const dis = [];
    for (const c of shuffle(codes)) {
      const f = pluralOf(n, c);
      if (!f || seen.has(f) || /een$|enen$|ss?s$/.test(f)) continue;
      seen.add(f); dis.push(f);
      if (dis.length === 3) break;
    }
    return {
      kind: "choice", tag: "Plural", title: "Choose the plural", concepts: ["plural"], xp: 6,
      prompt: `<span class="big-de g-${n.art}">${esc(n.de)}</span> <span class="arrow">→</span> <span class="big-de g-pl">die …</span>`, sub: n.en,
      options: shuffle([n.plural, ...dis]).map((v) => ({ v, html: "die " + esc(v) })), answer: n.plural, sayAfter: "die " + n.plural,
      correctHtml: `die ${esc(n.plural)} <span class="code">${esc(n.pl)}</span>`, plain: `${n.de} → plural?`, mark: "Gr",
      explain: () => `<p><b>${esc(n.de)}</b> → <b>die ${esc(n.plural)}</b> (${esc(PL_DESC[n.pl] || "irregular")}).</p><p>${pluralWhy(n)}</p><p>In the plural the article is always <b>die</b>.</p>` + lessonLink("plural"),
    };
  }
  function genSein(ctx) {
    const sj = pickSubject();
    const comp = pick(["müde", "krank", "in Berlin", "zu Hause", "sehr nett", "aus Spanien"]);
    const form = SEIN[sj.p];
    const parts = [cap(sj.s) + " ", null, " " + comp + "."];
    return {
      kind: "cloze", tag: label("sein"), title: "Fill in sein", concepts: ["sein"], xp: 8, parts,
      blanks: [{ accepts: [form] }], strict: true, hints: ["sein", subjHint(sj)].filter(Boolean),
      solution: filledSentence(parts, [form]), sayAfter: plainSentence(parts, [form]), plain: plainSentence(parts, ["___"]),
      explain: () => `<p>${subjWho(sj)}</p>` +
        `<div class="tbl-wrap"><table class="tbl conj"><thead><tr><th></th><th>sein</th></tr></thead><tbody>${SEIN.map((f, k) =>
          `<tr class="${k === sj.p ? "hl" : ""}"><th scope="row">${P_LABEL[k]}</th><td>${f}</td></tr>`).join("")}</tbody></table></div>` +
        `<p>Chant it: bin, bist, ist — sind, seid, sind.</p>` + lessonLink("sein"),
    };
  }
  const PEOPLE = [
    ["Anna und ich", 3, "wir", "you and another person together = <b>wir</b> (we)."],
    ["Mein Bruder und ich", 3, "wir", "someone + ich = <b>wir</b> (we)."],
    ["Du und Paul", 4, "ihr", "du + another person = <b>ihr</b> (you, plural)."],
    ["Paul und Lisa", 5, "sie", "two other people = <b>sie</b> (they)."],
    ["Die Kinder", 5, "sie", "several people = <b>sie</b> (they)."],
    ["Herr Weber", 2, "er", "a man = <b>er</b>."],
    ["Frau Schmidt", 2, "sie", "a woman = <b>sie</b>."],
    ["Lisa", 2, "sie", "a woman = <b>sie</b>."],
    ["Das Mädchen", 2, "es", "das Mädchen is grammatically neuter (-chen), so the pronoun is <b>es</b>. Grammar beats biology."],
    ["Der Junge", 2, "er", "der Junge is masculine = <b>er</b>."],
  ];
  function genPron(ctx) {
    if (Math.random() < 0.45) {
      const [who, p, ans, why] = pick(PEOPLE);
      const comp = pick(["in Köln", "müde", "zu Hause"]);
      const opts = shuffle([ans, ...shuffle(["ich", "du", "er", "sie", "es", "wir", "ihr"].filter((x) => x !== ans)).slice(0, 3)]);
      return {
        kind: "choice", tag: label("pron"), title: "Which pronoun replaces it?", concepts: ["pron"], xp: 5,
        prompt: `<span class="sent">${esc(who)} ${SEIN[p]} ${esc(comp)}.</span><span class="arrow">→</span><span class="sent">___ ${SEIN[p]} ${esc(comp)}.</span>`,
        options: opts.map((v) => ({ v, html: v })), answer: ans, correctHtml: `${esc(cap(ans))} ${SEIN[p]} ${esc(comp)}.`, plain: `${who} → ?`,
        explain: () => `<p>${esc(who)}: ${why}</p><p>The verb agrees too: ${SEIN[p]}.</p>` + lessonLink("pron"),
      };
    }
    const pool = prefer(NOUNS.filter((n) => !n.plOnly && has(n, "thing", "home", "animal", "person", "eat")), ctx);
    const n = pick(pool);
    const plural = n.plural && Math.random() < 0.25;
    const adj = pick(["neu", "groß", "klein", "schön", "alt"]);
    const subj = plural ? `Die ${n.plural} sind` : `${cap(n.art)} ${n.word} ist`;
    const ans = plural ? "sie" : { der: "er", die: "sie", das: "es" }[n.art];
    return {
      kind: "choice", tag: label("pron"), title: "Which pronoun replaces it?", concepts: ["pron", "gender"], xp: 5,
      prompt: `<span class="sent">${esc(subj)} ${adj}.</span><span class="arrow">→</span><span class="sent">___ ${plural ? "sind" : "ist"} ${adj}.</span>`,
      options: ["er", "sie", "es"].map((v) => ({ v, html: v })), answer: ans, correctHtml: `${cap(ans)} ${plural ? "sind" : "ist"} ${adj}.`, plain: `${subj} ${adj} → ?`,
      explain: () => (plural ? `<p>Plural nouns are replaced by <b>sie</b> (they).</p>` :
        `<p>Things and people take the pronoun of their gender: ${gchip(n.art, n.word)} → <b>${ans}</b>. In English it's just 'it'.</p>` + ruleBox(n)) + lessonLink("pron"),
    };
  }
  function genConj(ctx, classes, only) {
    let pool = VERBS.filter((v) => v.c && !v.nc && !v.sep && classes.includes(v.info.cls) && (!only || only.includes(v.de)));
    if (!pool.length) pool = VERBS.filter((v) => v.c && !v.nc && !v.sep && v.info.cls === "reg");
    const v = pick(prefer(pool, ctx, 2));
    const sj = pickSubject(v.info.cls === "stem" ? [1, 2] : null, v.c);
    const form = v.info.forms[sj.p];
    const concept = conceptForVerb(v);
    const parts = [cap(sj.s) + " ", null, " " + v.c + "."];
    return {
      kind: "cloze", tag: label(concept), title: "Conjugate the verb", concepts: [concept], xp: 8, parts,
      blanks: [{ accepts: [form] }], strict: true, hints: [v.de, subjHint(sj)].filter(Boolean),
      solution: filledSentence(parts, [form]), sayAfter: plainSentence(parts, [form]), plain: plainSentence(parts, ["___"]) + ` (${v.de})`,
      diagnose: (vals, res) => {
        const u = (vals[0] || "").toLowerCase();
        const k = v.info.forms.findIndex((f) => f.toLowerCase() === u);
        if (k >= 0 && k !== sj.p) res.notes.push(`<b>${esc(vals[0])}</b> is the ${P_LABEL[k]} form. You need ${P_LABEL[sj.p]}.`);
        else if (v.info.cls === "stem" && v.info.stem + (v.info.forms[sj.p].slice(v.info.st2.length)) === u)
          res.notes.push(`Right ending, but the vowel changes for ${P_LABEL[sj.p]}: <b>${esc(form)}</b>.`);
      },
      explain: () => `<p>${subjWho(sj)}</p>` + classNote(v, sj.p) + conjTable(v, sj.p) + lessonLink(concept),
    };
  }
  function genSep(ctx) {
    const v = pick(prefer(VERBS.filter((x) => x.sep && x.c), ctx, 2));
    const sj = pickSubject(null, v.c);
    const form = v.info.forms[sj.p];
    const parts = [cap(sj.s) + " ", null, " " + v.c + " ", null, "."];
    return {
      kind: "cloze", tag: label("sep"), title: "Split the separable verb", concepts: ["sep"], xp: 10, parts,
      blanks: [{ accepts: [form] }, { accepts: [v.sep] }], strict: true, hints: [v.de, subjHint(sj)].filter(Boolean),
      solution: filledSentence(parts, [form, v.sep]), sayAfter: plainSentence(parts, [form, v.sep]), plain: plainSentence(parts, ["___", "___"]) + ` (${v.de})`,
      mark: "Sb",
      explain: () => `<p><b>${esc(v.de)}</b> = <b>${esc(v.sep)}</b> + ${esc(v.info.base)}. The conjugated part goes to position 2, the prefix to the very end.</p>` +
        bracketDiagram([cap(sj.s), form, v.c, v.sep + "."], true) + `<p>${subjWho(sj)}</p>` + (v.info.cls === "stem" ? classNote(v, sj.p) : "") + lessonLink("sep"),
    };
  }
  const OWNERS = [
    { o: "ich", st: "mein", en: "my" }, { o: "du", st: "dein", en: "your" }, { o: "er", st: "sein", en: "his" }, { o: "sie", st: "ihr", en: "her" },
    { o: "wir", st: "unser", en: "our" }, { o: "ihr", st: "euer", en: "your, plural" }, { o: "sie", st: "ihr", en: "their" }, { o: "Sie", st: "Ihr", en: "your, polite" },
  ];
  function genPoss(ctx) {
    const pool = prefer(NOUNS.filter((n) => !n.m && has(n, "fam", "thing", "animal", "home")), ctx);
    const n = pick(pool);
    const ow = pick(OWNERS);
    const form = possForm(ow.st, "nom", n.gk);
    const parts = [n.plOnly ? "Das sind " : "Das ist ", null, " " + n.word + "."];
    return {
      kind: "cloze", tag: label("poss"), title: "Fill in the possessive", concepts: ["poss"], xp: 8, parts,
      blanks: [{ accepts: [form] }], strict: true, hints: [`${ow.o} → ${ow.en}`, n.en],
      solution: filledSentence(parts, [form]), sayAfter: plainSentence(parts, [form]), plain: plainSentence(parts, ["___"]) + ` (${ow.en})`,
      diagnose: (vals, res) => {
        const u = (vals[0] || "").toLowerCase();
        const stems = OWNERS.map((o) => o.st.toLowerCase());
        if (u.startsWith(ow.st.toLowerCase().slice(0, 3)) || u === ow.st.toLowerCase()) res.notes.push(`Right owner word, wrong ending: ${esc(n.word)} is ${G_LABEL[n.gk]}.`);
        else if (stems.some((s) => u.startsWith(s.slice(0, 3)))) res.notes.push(`That's a different owner. ${esc(ow.o)} → <b>${esc(ow.st)}</b>.`);
      },
      explain: () => `<p>Owner <b>${esc(ow.o)}</b> (${esc(ow.en)}) → <b>${esc(ow.st)}</b>. Noun ${gchip(n.plOnly ? "die" : n.art, n.word)} is ${G_LABEL[n.gk]}` +
        `${POSS_END.nom[n.gk] ? ", so it gets <b>-e</b>" : ", so no ending"}: <mark>${esc(form)}</mark>.</p>` +
        (ow.st === "euer" && POSS_END.nom[n.gk] ? `<p>euer drops its middle e when an ending is added: eure.</p>` : "") + lessonLink("poss"),
    };
  }
  function genEin(ctx) {
    const pool = prefer(NOUNS.filter((n) => countable(n) && has(n, "thing", "home", "animal", "eat", "fam")), ctx);
    const n = pick(pool);
    const neg = Math.random() < 0.35;
    const form = ART.nom[neg ? "neg" : "indef"][n.gk];
    const parts = [neg ? "Nein, das ist " : "Das ist ", null, " " + n.word + "."];
    return {
      kind: "cloze", tag: label("ein"), title: neg ? "Say it's not one" : "Fill in 'a'", concepts: ["ein", "gender"], xp: 7, parts,
      blanks: [{ accepts: [form] }], strict: true, hints: [neg ? "no / not a" : "a", n.en],
      solution: filledSentence(parts, [form]), sayAfter: plainSentence(parts, [form]), plain: plainSentence(parts, ["___"]),
      diagnose: (vals, res) => { res.cr.ein = true; res.notes.push(`${esc(n.word)} is ${G_LABEL[n.gk]}: ${esc(n.de)}.`); },
      explain: () => `<p>${gchip(n.art, n.word)} is ${G_LABEL[n.gk]}, so: <mark>${esc(form)}</mark> ${esc(n.word)}. ${neg ? "kein" : "ein"} for der and das, ${neg ? "keine" : "eine"} for die.</p>` + ruleBox(n) + lessonLink("ein"),
    };
  }

  // Case templates. {X} = article + noun. hint words describe the article without giving away the gender.
  const ACC_T = [
    { s: "Ich habe {X}.", type: "indef", cas: "acc", v: "haben", q: "I have what?", pool: (n) => countable(n) && !n.wk && has(n, "fam", "animal", "thing") },
    { s: "Ich kaufe {X}.", type: "indef", cas: "acc", v: "kaufen", q: "I buy what?", pool: (n) => countable(n) && has(n, "eat", "thing") && !/Rechnung|Speisekarte|Schlüssel/.test(n.de) },
    { s: "Wir brauchen {X}.", type: "indef", cas: "acc", v: "brauchen", q: "we need what?", pool: (n) => countable(n) && has(n, "home", "thing") && !/Rechnung|Speisekarte/.test(n.de) },
    { s: "Ich suche {X}.", type: "def", cas: "acc", v: "suchen", q: "I'm looking for what?", pool: (n) => !n.plOnly && !n.demo && has(n, "thing", "place") },
    { s: "Siehst du {X}?", type: "def", cas: "acc", v: "sehen", q: "you see what?", pool: (n) => !n.plOnly && !n.wk && !n.demo && has(n, "person", "animal", "thing", "place", "trans") },
    { s: "Ich möchte {X}, bitte.", type: "indef", cas: "acc", v: "möchten", q: "I'd like what?", pool: (n) => has(n, "cafe") },
    { s: "Ich esse {X}.", type: "indef", cas: "acc", v: "essen", q: "I eat what?", pool: (n) => has(n, "eat") },
    { s: "Ich habe {X}.", type: "neg", cas: "acc", v: "haben", q: "I have what?", pool: (n) => (countable(n) && has(n, "thing", "animal")) || /Zeit|Hunger|Durst|Lust|Geld|Geschwister/.test(n.de) },
    { s: "Er trinkt {X}.", type: "neg", cas: "acc", v: "trinken", q: "he drinks what?", pool: (n) => has(n, "drink") },
    { s: "Ich nehme {X}.", type: "def", cas: "acc", v: "nehmen", q: "I'll have what?", pool: (n) => has(n, "cafe") },
    { s: "Das ist {X}.", type: "indef", cas: "nom", why: "After <b>sein</b> (ist) there's no accusative: both sides are nominative.", pool: (n) => countable(n) && has(n, "thing", "home", "animal", "eat") },
    { s: "{X} ist neu.", type: "def", cas: "nom", why: "The noun is the <b>subject</b> (what is new?), so it's nominative.", pool: (n) => countable(n) && has(n, "thing", "home") },
    { s: "{X} ist sehr nett.", type: "def", cas: "nom", why: "The noun is the <b>subject</b> (who is nice?), so it's nominative.", pool: (n) => !n.plOnly && !n.demo && has(n, "person") },
    { s: "{X} kostet zehn Euro.", type: "def", cas: "nom", why: "The noun is the <b>subject</b> (what costs ten euros?), so it's nominative.", pool: (n) => countable(n) && has(n, "thing") && !/Rechnung|Speisekarte/.test(n.de) },
  ];
  const DAT_T = [
    { s: "Ich fahre mit {X}.", type: "def", prep: "mit", pool: (n) => has(n, "trans") },
    { s: "Ich spreche mit {X}.", type: "def", prep: "mit", pool: (n) => has(n, "person") && !n.wk && !n.plOnly },
    { s: "Ich gehe {Z}.", type: "zu", prep: "zu", pool: (n) => has(n, "zu") },
    { s: "Ich bin {I}.", type: "in", prep: "in", pool: (n) => has(n, "in") },
    { s: "Ich wohne bei {X}.", type: "poss", prep: "bei", pool: (n) => has(n, "fam") && (n.plOnly ? n.word !== "Geschwister" : has(n, "person")) && n.word !== "Baby" && n.word !== "Kind" },
    { s: "Das Geschenk ist von {X}.", type: "poss", prep: "von", pool: (n) => has(n, "fam") && has(n, "person") && !n.plOnly },
    { s: "Ich komme aus {X}.", type: "def", prep: "aus", pool: (n) => has(n, "in") && has(n, "place") },
  ];
  const HINT_WORD = { def: "the", indef: "a", neg: "no", poss: "my", zu: "to the", in: "in the" };
  const PREP_WHY = {
    mit: "<b>mit</b> always takes the dative.", zu: "<b>zu</b> always takes the dative, and zu + dem = <b>zum</b>, zu + der = <b>zur</b>.",
    in: "<b>in</b> + dative answers 'where?' (wo?). in + dem = <b>im</b>.", bei: "<b>bei</b> always takes the dative (bei meinem Bruder = at my brother's).",
    von: "<b>von</b> always takes the dative.", aus: "<b>aus</b> always takes the dative.",
    für: "<b>für</b> (for) always takes the accusative.", ohne: "<b>ohne</b> (without) always takes the accusative.",
  };
  const ACCP_T = [
    { s: "Das Geschenk ist für {X}.", type: "poss", prep: "für", pool: (n) => has(n, "fam") && n.word !== "Familie" },
    { s: "Ich koche heute für {X}.", type: "poss", prep: "für", pool: (n) => has(n, "fam") },
    { s: "Ich kaufe ein Buch für {X}.", type: "def", prep: "für", pool: (n) => has(n, "person") && !has(n, "fam") && !n.wk && !n.plOnly },
    { s: "Ich gehe nie ohne {X} aus dem Haus.", type: "poss", prep: "ohne", pool: (n) => /^(Schlüssel|Tasche|Handy|Jacke|Mantel|Mütze|Regenschirm|Brille|Uhr)$/.test(n.word) },
    { s: "Ich fahre ohne {X} in den Urlaub.", type: "poss", prep: "ohne", pool: (n) => has(n, "fam") && has(n, "person") && n.word !== "Baby" },
  ];
  const ESG_WHY = "<b>es gibt</b> (there is, there are) is always followed by the <b>accusative</b>.";
  const inTown = (n) => countable(n) && has(n, "place") && has(n, "zu", "in") && !/^(Stadt|Land|Zentrum|Wohnung|Haus|Zimmer|Küche|Bad|Straße)$/.test(n.word);
  const ESG_T = [
    { s: "Gibt es hier {X}?", type: "indef", why: ESG_WHY, pool: inTown },
    { s: "In meiner Straße gibt es {X}.", type: "indef", why: ESG_WHY, pool: inTown },
    { s: "Hier gibt es {X}.", type: "neg", why: ESG_WHY, pool: inTown },
    { s: "Zu Hause gibt es {X} mehr.", type: "neg", why: ESG_WHY + " kein … mehr = no … left.", pool: (n) => has(n, "food", "drink") && !n.px && !/essen$|Frühstück/.test(n.word) },
  ];
  function caseForm(cas, type, gk) {
    if (type === "poss") return possForm("mein", cas, gk);
    if (type === "zu") return gk === "die" ? "zur" : "zum";
    if (type === "in") return gk === "die" ? "in der" : "im";
    return ART[cas][type][gk];
  }
  function caseEx(ctx, t, cas, concept = cas === "dat" ? "dat" : "acc") {
    const pool = prefer(NOUNS.filter((n) => !n.demo && t.pool(n)), ctx, 3);
    const n = pick(pool);
    const form = caseForm(cas, t.type, n.gk);
    const atStart = t.s.startsWith("{");
    const [pre, post] = t.s.split(/\{[XZI]\}/);
    const parts = [pre, null, " " + n.word + post];
    const shownForm = atStart ? cap(form) : form;
    const nomForm = t.type === "poss" ? possForm("mein", "nom", n.gk) : t.type === "zu" || t.type === "in" ? ART.nom.def[n.gk] : ART.nom[t.type][n.gk];
    const tableType = t.type === "zu" || t.type === "in" ? "def" : t.type;
    return {
      kind: "cloze", tag: label(concept), title: cas === "dat" ? "Dative: fill in the gap" : "Fill in the article", concepts: [concept, "gender"], xp: 8, parts,
      blanks: [{ accepts: [form] }], strict: true, hints: [HINT_WORD[t.type], n.en],
      solution: filledSentence(parts, [shownForm]), sayAfter: plainSentence(parts, [shownForm]), plain: plainSentence(parts, ["___"]) + ` (${HINT_WORD[t.type]})`,
      diagnose: (vals, res) => {
        const u = (vals[0] || "").toLowerCase().trim();
        const nomRight = (t.type === "zu" || t.type === "in") ? null : (t.type === "poss" ? possForm("mein", "nom", n.gk) : ART.nom[t.type][n.gk]);
        const sameCaseOther = ["der", "die", "das", "pl"].filter((g) => g !== n.gk && caseForm(cas, t.type, g).toLowerCase() === u);
        if (cas !== "nom" && nomRight && u === nomRight.toLowerCase() && nomRight !== form) {
          res.notes.push(`<b>${esc(vals[0])}</b> is the nominative. Here you need the ${CASE_LABEL[cas]}.`);
          res.cr.gender = true;
        } else if (sameCaseOther.length) {
          res.notes.push(`<b>${esc(vals[0])}</b> would be right for a ${G_LABEL[sameCaseOther[0]].split(" ")[0]} noun, but it's <b>${esc(n.de)}</b>.`);
          res.cr[concept] = true; res.cr.gender = false;
        } else if (cas === "nom" && ["acc", "dat"].some((c) => caseForm(c, t.type, n.gk).toLowerCase() === u)) {
          res.notes.push(`That's not the nominative. ${t.why}`);
          res.cr.gender = true;
        }
      },
      explain: () => {
        const why = t.why || (t.prep ? PREP_WHY[t.prep] : `<b>${esc(t.v)}</b> takes a direct object (<i>${esc(t.q)}</i>), so the noun is in the <b>accusative</b>.`);
        let change;
        if (cas === "nom") change = `Nominative is the basic form: <mark>${esc(form)}</mark>.`;
        else if (cas === "acc") change = n.gk === "der" ? `Masculine is the only gender that changes in the accusative: ${esc(nomForm)} → <mark>${esc(form)}</mark>.` :
          `${cap(G_LABEL[n.gk].split(" ")[0])} nouns don't change in the accusative, so it stays <mark>${esc(form)}</mark>.`;
        else change = `Dative ${G_LABEL[n.gk].split(" ")[0]}: ${esc(nomForm)} → <mark>${esc(form)}</mark>.` +
          (t.type === "zu" ? ` (zu + ${n.gk === "die" ? "der" : "dem"} = ${form})` : t.type === "in" && n.gk !== "die" ? " (in + dem = im)" : "") +
          (n.gk === "die" ? " The feminine die becomes der: that der is not masculine!" : "");
        return `<p>${why}</p><p>${gchip(n.plOnly ? "die" : n.art, n.word)} is ${G_LABEL[n.gk]}. ${change}</p>` + artTable(cas, tableType, n.gk) + lessonLink(concept);
      },
    };
  }
  function genAccFixed(ctx) {
    const t = Math.random() < 0.72 ? pick(ACC_T.filter((x) => x.cas === "acc")) : pick(ACC_T.filter((x) => x.cas === "nom"));
    return caseEx(ctx, t, t.cas);
  }
  const genDat = (ctx) => caseEx(ctx, pick(DAT_T), "dat");

  function genNeg(ctx) {
    const OPTS = ["nicht", "kein", "keine", "keinen"];
    const kind = pick(["kAcc", "kNom", "kDrink", "nAdj", "nVerb", "nPlace", "nDef", "nPoss"]);
    let sent, ans, why, n;
    if (kind === "kAcc" || kind === "kNom" || kind === "kDrink") {
      const t = kind === "kDrink" ? { pool: (x) => has(x, "drink") } : kind === "kAcc" ? ACC_T[7] : { pool: (x) => countable(x) && has(x, "thing", "home") };
      n = pick(prefer(NOUNS.filter((x) => !x.demo && t.pool(x)), ctx, 3));
      const cas = kind === "kNom" ? "nom" : "acc";
      ans = ART[cas].neg[n.gk];
      sent = kind === "kNom" ? `Das ist ___ ${n.word}.` : kind === "kDrink" ? `Ich trinke ___ ${n.word}.` : `Ich habe ___ ${n.word}.`;
      why = `${esc(n.word)} would have <b>${n.m || n.plOnly ? "no article" : "ein"}</b> in the positive sentence, so you negate it with <b>kein</b>. ` +
        `${gchip(n.plOnly ? "die" : n.art, n.word)} is ${G_LABEL[n.gk]}, ${CASE_LABEL[cas]}: <mark>${ans}</mark>.`;
    } else {
      ans = "nicht";
      if (kind === "nAdj") {
        n = pick(prefer(NOUNS.filter((x) => countable(x) && has(x, "thing", "home")), ctx));
        const adj = pick(["neu", "teuer", "groß", "alt", "kaputt"]);
        sent = `${cap(n.art)} ${n.word} ist ___ ${adj}.`; why = `You're negating an adjective (<b>${adj}</b>), so it's <b>nicht</b>.`;
      } else if (kind === "nVerb") {
        const v = pick(VERBS.filter((x) => ["kommen", "arbeiten", "kochen", "tanzen", "schwimmen"].includes(x.de)));
        const sj = pickSubject();
        sent = `${cap(sj.s)} ${v.info.forms[sj.p]} heute ___.`; why = `You're negating the verb (the action itself), so it's <b>nicht</b>, at the end.`;
      } else if (kind === "nPlace") {
        sent = `Ich wohne ___ in ${pick(["Berlin", "Wien", "Hamburg"])}.`; why = `You're negating a place, so it's <b>nicht</b>, right before it.`;
      } else if (kind === "nDef") {
        n = pick(prefer(NOUNS.filter((x) => !x.plOnly && !x.demo && has(x, "thing", "trans")), ctx));
        sent = `Das ist ___ ${n.art} ${n.word}.`; why = `The noun has <b>${n.art}</b> (a definite article). kein only replaces ein or no article, so here it's <b>nicht</b>.`;
      } else {
        n = pick(prefer(NOUNS.filter((x) => !x.plOnly && !x.demo && has(x, "thing", "fam")), ctx));
        sent = `Das ist ___ ${possForm("mein", "nom", n.gk)} ${n.word}.`; why = `The noun has a possessive (<b>mein</b>), so it's <b>nicht</b>. kein only replaces ein or no article.`;
      }
    }
    return {
      kind: "choice", tag: label("neg"), title: "nicht or kein?", concepts: ["neg"], xp: 6, prompt: `<span class="sent">${esc(sent)}</span>`,
      options: OPTS.map((v) => ({ v, html: v })), answer: ans, correctHtml: esc(sent.replace("___", ans)), sayAfter: sent.replace("___", ans), plain: sent,
      diagnose: (vals, res) => {
        if (ans !== "nicht" && vals[0] !== "nicht") { res.cr.neg = true; res.notes.push(`kein is right, but the ending isn't: ${esc(n.word)} is ${G_LABEL[n.gk]}.`); }
      },
      explain: () => `<p>${why}</p>` + lessonLink("neg"),
    };
  }
  function genNum(ctx) {
    const r = Math.random();
    const n = r < 0.3 ? rnd(21) : r < 0.85 ? 21 + rnd(79) : 100 + rnd(900);
    const word = num2de(n);
    const mode = ctx.voice && Math.random() < 0.2 ? "listen" : Math.random() < 0.55 ? "n2w" : "w2n";
    const accepts = mode === "n2w" ? [word, ...(n >= 100 && n < 200 ? ["ein" + word] : [])] : [String(n)];
    return {
      kind: "type", tag: label("num"), concepts: ["num"], xp: 8, strict: mode !== "n2w",
      title: mode === "n2w" ? "Write the number in German" : mode === "w2n" ? "Write it in digits" : "Listen and write the digits",
      prompt: mode === "n2w" ? `<span class="big-num">${n}</span>` : mode === "w2n" ? `<span class="big-de">${word}</span>` :
        `<button class="btn btn-say-big" data-act="say" data-say="${n}"><span class="i-say"></span> Play again</button>`,
      say: mode === "listen" ? String(n) : null, sayFirst: mode === "listen", sayAfter: word, accepts, inputMode: mode === "n2w" ? "text" : "numeric",
      correctHtml: `${n} = <b>${word}</b>`, plain: mode === "n2w" ? String(n) : word, mark: "R",
      explain: () => numWhy(n) + lessonLink("num"),
    };
  }
  function genTime() {
    const h = 1 + rnd(12), m = pick([0, 5, 10, 15, 20, 25, 30, 30, 30, 35, 40, 45, 45, 50, 55]);
    const ans = timeDe(h, m);
    const cands = [];
    if (m === 30) cands.push("halb " + hw(h));
    if (m === 15) cands.push("Viertel vor " + hw(h));
    if (m === 45) cands.push("Viertel nach " + hw(h + 1), "Viertel vor " + hw(h));
    if (m === 25 || m === 35) cands.push(timeDe(h - 1, m), timeDe(h, m === 25 ? 35 : 25));
    cands.push(timeDe(h - 1, m), timeDe(h + 1, m), timeDe(h, (m + 30) % 60), timeDe(h, (m + 15) % 60));
    const dis = [...new Set(cands)].filter((x) => x !== ans).slice(0, 3);
    return {
      kind: "clock", tag: label("time"), title: "What time is it? (everyday German)", concepts: ["time"], xp: 6, clock: { h, m },
      prompt: `<span class="big-num">${h}:${pad(m)}</span>`, options: shuffle([ans, ...dis]).map((v) => ({ v, html: esc(v) })), answer: ans,
      correctHtml: `${h}:${pad(m)} = <b>${esc(ans)}</b>`, sayAfter: "Es ist " + ans, plain: `${h}:${pad(m)}`,
      explain: () => timeWhy(h, m) + lessonLink("time"),
    };
  }
  const WWORDS = ["Wer", "Was", "Wo", "Woher", "Wohin", "Wann", "Wie", "Wie viel", "Wie viele", "Warum"];
  const SEP_PREF = ["an", "auf", "ein", "mit", "fern", "aus", "zu"];
  function bracketDiagram(cells, bracket, yesNo) {
    const labels = yesNo ? ["Verb", "Subject", "Rest"] : bracket ? ["Position 1", "Verb", "Middle", "End"] : ["Position 1", "Verb", "Rest"];
    const roles = yesNo ? ["v", "x", "x"] : bracket ? ["x", "v", "x", "e"] : ["x", "v", "x"];
    return `<div class="tbl-wrap"><table class="brk"><thead><tr>${labels.map((l, i) => `<th class="r-${roles[i]}">${l}</th>`).join("")}</tr></thead><tbody><tr>${cells
      .map((c, i) => `<td class="r-${roles[i]}">${esc(c)}</td>`).join("")}</tr></tbody></table></div>`;
  }
  function genOrder(ctx, key) {
    const [en, chunkStr, punct] = pick(C.ORDER[key]);
    const chunks = chunkStr.split("|");
    const yesNo = punct === "?" && !WWORDS.includes(chunks[0]);
    const last = chunks[chunks.length - 1];
    const bracket = key === "sep" || key === "modal-order" || key === "perf-order" || SEP_PREF.includes(last);
    let tiles = shuffle(chunks);
    for (let i = 0; i < 5 && tiles.join("|") === chunkStr; i++) tiles = shuffle(chunks);
    const concept = key;
    const sentence = cap(chunks.join(" ")) + punct;
    const hint = yesNo ? "Yes/no question: no question word" : `Start with: ${chunks[0]}`;
    const verb = yesNo ? chunks[0] : chunks[1];
    const cells = yesNo ? [chunks[0], chunks[1], chunks.slice(2).join(" ") + punct] :
      bracket ? [chunks[0], chunks[1], chunks.slice(2, -1).join(" "), last + punct] : [chunks[0], chunks[1], chunks.slice(2).join(" ") + punct];
    const rule = {
      v2: chunks[0].toLowerCase() === chunks[2]?.toLowerCase() ? "" : `The conjugated verb <b>${esc(verb)}</b> must be element number 2. ` +
        (["Ich", "Du", "Er", "Sie", "Wir", "Ihr", "Paul", "Anna"].includes(chunks[0]) ? "Here the subject takes position 1." : `<b>${esc(chunks[0])}</b> takes position 1, so the subject moves right behind the verb.`),
      sep: `The verb <b>${esc(verb)}</b> sits in position 2 and its prefix <b>${esc(last)}</b> closes the sentence.`,
      "modal-order": yesNo ? `In a yes/no question the modal <b>${esc(verb)}</b> comes first; the infinitive <b>${esc(last)}</b> still goes to the end.` :
        `The modal <b>${esc(verb)}</b> is in position 2, the infinitive <b>${esc(last)}</b> goes to the end.`,
      "perf-order": yesNo ? `In a yes/no question <b>${esc(verb)}</b> comes first; the participle <b>${esc(last)}</b> still goes to the end.` :
        `<b>${esc(verb)}</b> (haben/sein) is in position 2, the participle <b>${esc(last)}</b> goes to the very end.`,
      "q-order": yesNo ? `There's no question word, so the verb <b>${esc(verb)}</b> comes first.` : `W-word first (<b>${esc(chunks[0])}</b>), then the verb, then the subject.`,
    }[key];
    const explain = () => `<p>${rule}</p>` + bracketDiagram(cells, bracket && !yesNo, yesNo) + lessonLink(concept);
    // once the tiles are easy, ask for the whole sentence typed out more often
    const acc = conceptAcc(ctx.prof, concept);
    if (Math.random() < (acc != null && acc >= 0.75 ? 0.5 : 0.15)) {
      const words = (s) => stripPunct(normSpace(s)).toLowerCase().split(" ").sort().join(" ");
      return {
        kind: "type", tag: label(concept), title: "Write it in German", concepts: [concept], xp: 14, long: true, prompt: `<span class="big-en">${esc(en)}</span>`,
        sub: hint, accepts: [sentence], correctHtml: esc(sentence), sayAfter: sentence, plain: en, mark: "Sb",
        diagnose: (vals, res) => { if (res.verdict === "wrong" && words(vals[0]) === words(sentence)) res.notes.push("All the right words, but not in the right order."); },
        explain,
      };
    }
    return {
      kind: "order", tag: label(concept), title: "Build the sentence", concepts: [concept], xp: 12, prompt: `<span class="big-en">${esc(en)}</span>`,
      sub: hint, tiles, orders: [chunks], punct, bracket, correctHtml: esc(sentence), sayAfter: sentence, plain: en, mark: "Sb",
      explain,
    };
  }
  function genWq() {
    const [q, a, ans, gives] = pick(C.WQ);
    const groups = [["Wo", "Woher", "Wohin"], ["Wer", "Was"], ["Wie", "Wie viel", "Wie viele"], ["Wann", "Warum"]];
    const g0 = groups.find((g) => g.includes(ans)) || [];
    const dis = [...shuffle(g0.filter((x) => x !== ans)), ...shuffle(WWORDS.filter((x) => x !== ans && !g0.includes(x)))].slice(0, 3);
    const MEAN = { Wer: "who", Was: "what", Wo: "where", Woher: "where from", Wohin: "where to", Wann: "when", Wie: "how", "Wie viel": "how much", "Wie viele": "how many", Warum: "why" };
    return {
      kind: "choice", tag: label("wq"), title: "Which question word?", concepts: ["wq"], xp: 5,
      prompt: `<span class="sent">${esc(q)}</span><span class="sent sent-a">— ${esc(a)}</span>`,
      options: shuffle([ans, ...dis]).map((v) => ({ v, html: v })), answer: ans, correctHtml: esc(q.replace("___", ans)), sayAfter: q.replace("___", ans), plain: `${q} — ${a}`,
      diagnose: (vals, res) => res.notes.push(`<b>${esc(vals[0])}</b> = ${MEAN[vals[0]] || ""}.`),
      explain: () => `<p>The answer gives ${esc(gives)}, so the question word is <b>${esc(ans)}</b> (${MEAN[ans]}).</p>` + lessonLink("wq"),
    };
  }
  function genAux(ctx) {
    const v = pick(prefer(VERBS.filter((x) => x.ppi && x.c && !x.np), ctx, 3));
    const sj = pickSubject(null, v.c);
    const hf = HABEN[sj.p], sf = SEIN[sj.p];
    const ans = v.ppi.aux === "sein" ? sf : hf;
    const sent = `${cap(sj.s)} ___ ${v.c} ${v.pp}.`;
    let why;
    if (v.ppi.aux === "sein") why = v.de === "sein" || v.de === "bleiben" ? `<b>${v.de}</b> always forms the Perfekt with sein.` :
      v.de === "aufstehen" ? `<b>aufstehen</b> is a change of state (lying → standing), so it takes sein.` : `<b>${v.de}</b> is movement from A to B, so it takes <b>sein</b>.`;
    else why = `<b>${v.de}</b> is not a movement from A to B or a change of state, so it takes <b>haben</b>, like most verbs.`;
    return {
      kind: "choice", tag: label("aux"), title: "haben or sein?", concepts: ["aux"], xp: 6, prompt: `<span class="sent">${esc(sent)}</span>`,
      sub: `${v.de} → ${v.pp}`, options: [hf, sf].map((x) => ({ v: x, html: x })), answer: ans, correctHtml: esc(sent.replace("___", ans)), sayAfter: sent.replace("___", ans), plain: sent,
      explain: () => `<p>${why}</p><p>Perfekt: <b>${v.ppi.aux === "sein" ? "ist" : "hat"} ${esc(v.pp)}</b>.</p>` + lessonLink("aux"),
    };
  }
  const PP_WHY = {
    weak: (v) => `<b>${v.de}</b> is regular: ge + ${esc(v.info.stem)} + ${/[td]$/.test(v.info.stem) ? "et (extra e after t/d)" : "t"} → <b>${esc(v.pp)}</b>.`,
    strong: (v) => `<b>${v.de}</b> is irregular: ge- … -en, here <b>${esc(v.pp)}</b>. Irregular participles have to be learned, like English eat → eaten.`,
    ieren: (v) => `Verbs ending in <b>-ieren</b> never take ge-: <b>${esc(v.pp)}</b>.`,
    insep: (v) => `Verbs starting with <b>be-, ver-, er-</b> never take ge-: <b>${esc(v.pp)}</b>.`,
    sep: (v) => `Separable verb: ge goes between the prefix and the verb: ${esc(v.sep)} + ${esc(v.pp.slice(v.sep.length))} → <b>${esc(v.pp)}</b>.`,
  };
  function genPP(ctx) {
    const v = pick(prefer(VERBS.filter((x) => x.ppi && x.c && !x.np && x.de !== "sein"), ctx, 3));
    const sj = pickSubject(null, v.c);
    const aux = (v.ppi.aux === "sein" ? SEIN : HABEN)[sj.p];
    const parts = [`${cap(sj.s)} ${aux} ${v.c} `, null, "."];
    return {
      kind: "cloze", tag: label("pp"), title: "Form the past participle", concepts: ["pp"], xp: 9, parts,
      blanks: [{ accepts: [v.pp] }], strict: true, hints: [v.de],
      solution: filledSentence(parts, [v.pp]), sayAfter: plainSentence(parts, [v.pp]), plain: plainSentence(parts, ["___"]) + ` (${v.de})`, mark: "Gr",
      diagnose: (vals, res) => {
        const u = (vals[0] || "").toLowerCase();
        if (/^ge/.test(u) && ["ieren", "insep"].includes(v.ppi.cls)) res.notes.push("No ge- for this verb.");
        else if (v.ppi.cls === "strong" && /t$/.test(u)) res.notes.push("This one is irregular: it ends in -en, not -t.");
        else if (v.ppi.cls === "sep" && /^ge/.test(u)) res.notes.push(`For separable verbs ge goes in the middle: ${esc(v.pp)}.`);
      },
      explain: () => `<p>${PP_WHY[v.ppi.cls](v)}</p><p>Auxiliary: ${v.ppi.aux} (${v.ppi.aux === "sein" ? "movement or change of state" : "most verbs"}).</p>` + lessonLink("pp"),
    };
  }
  const genAkkPrep = (ctx) => caseEx(ctx, pick(ACCP_T), "acc", "akkprep");
  const genEsGibt = (ctx) => caseEx(ctx, pick(ESG_T), "acc", "esgibt");

  // ---------- imperative ----------
  const IMP_WHO = [{ p: "du", who: "a friend (du)" }, { p: "ihr", who: "two friends (ihr)" }, { p: "Sie", who: "someone politely (Sie)" }];
  // [du, ihr, Sie] forms: du = stem (vowel change kept, umlaut dropped, -e after t/d/consonant+n), ihr = ihr-form, Sie = infinitive
  function impForms(v) {
    if (v.imp) return v.imp;
    const i = v.info;
    const du = v.k === "e>i" || v.k === "e>ie" ? i.st2 : i.cls === "et" ? i.stem + "e" : i.stem;
    return [du, i.forms[4], i.base];
  }
  function genImp() {
    const [vde, rest, en] = pick(C.IMP);
    const v = VERBS.find((x) => x.de === vde);
    const who = weighted([[0, 0.45], [1, 0.2], [2, 0.35]]);
    const forms = impForms(v), form = forms[who], i = v.info;
    const mid = (who === 2 ? " Sie" : "") + (rest ? " " + rest : "");
    const parts = v.sep ? [null, mid + " ", null, "!"] : [null, mid + "!"];
    const answers = v.sep ? [cap(form), v.sep] : [cap(form)];
    // the older du-form with -e (Komme!, Schlafe gut!) is still correct, except after a vowel change
    const alt = who === 0 && !v.imp && v.k !== "e>i" && v.k !== "e>ie" && i.cls !== "et" ? [form + "e"] : [];
    const blanks = [{ accepts: [form, ...alt] }, ...(v.sep ? [{ accepts: [v.sep] }] : [])];
    const vowel = v.k === "e>i" || v.k === "e>ie", umlaut = v.k === "a>ä" || v.k === "au>äu";
    return {
      kind: "cloze", tag: label("imp"), title: "Tell them what to do", concepts: ["imp"], xp: 9, parts,
      prompt: `<span class="big-en">${esc(cap(en))}!</span>`, sub: `Talking to ${IMP_WHO[who].who}`,
      blanks, strict: true, hints: [v.de, IMP_WHO[who].p],
      solution: filledSentence(parts, answers), sayAfter: plainSentence(parts, answers), plain: `${cap(en)}! (${IMP_WHO[who].p}, ${v.de})`, mark: "Gr",
      diagnose: (vals, res) => {
        const u = (vals[0] || "").toLowerCase();
        if (who === 0 && u === i.forms[1].toLowerCase()) res.notes.push(`That's the normal du-form. The imperative drops du and the -st: <b>${esc(cap(form))}!</b>`);
        else if (who === 0 && vowel && u === i.stem.toLowerCase()) res.notes.push(`This verb changes e to i${v.k === "e>ie" ? "e" : ""} for du, and the imperative keeps it: <b>${esc(cap(form))}!</b>`);
        else if (who === 0 && umlaut && i.st2 && u === i.st2.toLowerCase()) res.notes.push(`The imperative drops the umlaut: <b>${esc(cap(form))}!</b>`);
        else if (who === 0 && i.cls === "et" && u === i.stem.toLowerCase()) res.notes.push(`The stem ends in -t, -d or -n, so it needs an extra -e: <b>${esc(cap(form))}!</b>`);
        else if (who === 0 && u === forms[2].toLowerCase()) res.notes.push(`That's the Sie form. For du use the short form: <b>${esc(cap(form))}!</b>`);
        else if (who !== 0 && u === forms[0].toLowerCase()) res.notes.push(`That's the du form. ${who === 1 ? "For ihr use the ihr-form" : "For Sie use the infinitive"}: <b>${esc(cap(form))}</b>.`);
      },
      explain: () => {
        const rule = who === 1 ? `For <b>ihr</b>, take the ihr-form without ihr: ihr ${esc(i.forms[4])} → <mark>${esc(cap(forms[1]))}!</mark>` :
          who === 2 ? `For <b>Sie</b>, take the infinitive and put Sie straight after it: <mark>${esc(cap(forms[2]))} Sie</mark> …!` :
          v.de === "sein" ? `sein is irregular: <mark>Sei</mark> …!` :
          vowel ? `For <b>du</b>, take the du-form without du and -st. This verb changes e to i${v.k === "e>ie" ? "e" : ""}, and the imperative keeps it: du ${esc(i.forms[1])} → <mark>${esc(cap(form))}!</mark>` :
          umlaut ? `For <b>du</b>, use the stem. The umlaut of du ${esc(i.forms[1])} disappears: <mark>${esc(cap(form))}!</mark>` :
          i.cls === "et" ? `For <b>du</b>, use the stem. It ends in -t, -d or -n, so it gets an extra -e: <mark>${esc(cap(form))}!</mark>` :
          `For <b>du</b>, take the du-form without du and -st: du ${esc(i.forms[1])} → <mark>${esc(cap(form))}!</mark>`;
        const rows = IMP_WHO.map((w, k) => `<tr class="${k === who ? "hl" : ""}"><th scope="row">${w.p}</th><td>${esc(cap(forms[k]))}${k === 2 ? " Sie" : ""}${v.sep ? " … " + esc(v.sep) : ""}!</td></tr>`).join("");
        return `<p>${rule}</p><div class="tbl-wrap"><table class="tbl conj"><thead><tr><th></th><th>${esc(v.de)}</th></tr></thead><tbody>${rows}</tbody></table></div>` +
          (v.sep ? `<p>Separable verb: the prefix <b>${esc(v.sep)}</b> still goes to the end.</p>` : "") + lessonLink("imp");
      },
    };
  }

  // ---------- pronouns in the accusative and dative ----------
  const PRON_CASES = [
    { p: "ich", en: "I", acc: "mich", dat: "mir" }, { p: "du", en: "you", acc: "dich", dat: "dir" }, { p: "er", en: "he", acc: "ihn", dat: "ihm" },
    { p: "sie", en: "she", acc: "sie", dat: "ihr" }, { p: "wir", en: "we", acc: "uns", dat: "uns" }, { p: "ihr", en: "you, plural", acc: "euch", dat: "euch" },
    { p: "Sie", en: "you, polite", acc: "Sie", dat: "Ihnen" },
  ];
  // not: persons that would clash with the sentence's subject or with addressing someone as du
  const PERS_T = [
    { s: "Kannst du {P} helfen?", cas: "dat", not: ["du", "Sie"], why: "<b>helfen</b> takes the dative: you help <i>to</i> someone." },
    { s: "Wie geht es {P}?", cas: "dat", not: ["ich", "wir"], why: "<b>Wie geht es …?</b> takes the dative: literally 'How does it go for you?'" },
    { s: "Die Jacke gefällt {P}.", cas: "dat", not: [], why: "<b>gefallen</b> takes the dative: the person who likes something is in the dative." },
    { s: "{P} tut der Kopf weh.", cas: "dat", not: [], why: "<b>wehtun</b> takes the dative: literally 'the head hurts to me'." },
    { s: "Das Buch gehört {P}.", cas: "dat", not: [], why: "<b>gehören</b> takes the dative: Das gehört mir = That's mine." },
    { s: "Ich fahre mit {P} nach Berlin.", cas: "dat", not: ["ich"], why: "<b>mit</b> always takes the dative." },
    { s: "Ich rufe {P} morgen an.", cas: "acc", not: ["ich"], why: "<b>anrufen</b> takes a direct object (call whom?), so it's accusative." },
    { s: "Siehst du {P}?", cas: "acc", not: ["du", "Sie"], why: "<b>sehen</b> takes a direct object (see whom?), so it's accusative." },
    { s: "Ich besuche {P} am Sonntag.", cas: "acc", not: ["ich"], why: "<b>besuchen</b> takes a direct object (visit whom?), so it's accusative." },
    { s: "Das Geschenk ist für {P}.", cas: "acc", not: [], why: "<b>für</b> always takes the accusative." },
    { s: "Wir warten auf {P}.", cas: "acc", not: ["wir"], why: "<b>warten auf</b> takes the accusative." },
  ];
  const CASE_NAME = { acc: "accusative", dat: "dative" };
  function genPersPron() {
    const t = pick(PERS_T);
    const pc = pick(PRON_CASES.filter((x) => !t.not.includes(x.p)));
    const form = pc[t.cas];
    const [pre, post] = t.s.split("{P}");
    const parts = [pre, null, post];
    const shown = pre ? form : cap(form);
    const table = `<div class="tbl-wrap"><table class="tbl arts"><thead><tr><th></th><th>Nominativ</th><th>Akkusativ</th><th>Dativ</th></tr></thead><tbody>${PRON_CASES.map((x) =>
      `<tr class="${x === pc ? "hl-row" : ""}"><th scope="row">${esc(x.en)}</th><td>${esc(x.p)}</td>${["acc", "dat"].map((c) =>
        `<td class="${x === pc && c === t.cas ? "hl" : ""}">${esc(x[c])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    return {
      kind: "cloze", tag: label("perspron"), title: "Which pronoun?", concepts: ["perspron"], xp: 8, parts,
      blanks: [{ accepts: [form] }], strict: true, hints: [`${pc.p} = ${pc.en}`],
      solution: filledSentence(parts, [shown]), sayAfter: plainSentence(parts, [shown]), plain: plainSentence(parts, ["___"]) + ` (${pc.p})`, mark: "Gr",
      diagnose: (vals, res) => {
        const u = (vals[0] || "").toLowerCase();
        const other = t.cas === "acc" ? pc.dat : pc.acc;
        const same = PRON_CASES.find((x) => x !== pc && x[t.cas].toLowerCase() === u);
        if (u === other.toLowerCase() && other.toLowerCase() !== form.toLowerCase()) res.notes.push(`<b>${esc(vals[0])}</b> is the ${CASE_NAME[t.cas === "acc" ? "dat" : "acc"]}. Here you need the ${CASE_NAME[t.cas]}.`);
        else if (u === pc.p.toLowerCase()) res.notes.push(`<b>${esc(vals[0])}</b> is the subject form. As an object, ${esc(pc.p)} changes.`);
        else if (same) res.notes.push(`<b>${esc(vals[0])}</b> is the ${CASE_NAME[t.cas]} of ${esc(same.p)}. You need ${esc(pc.p)}.`);
      },
      explain: () => `<p>${t.why}</p><p>${esc(pc.p)} in the ${CASE_NAME[t.cas]}: <mark>${esc(form)}</mark>.</p>` + table + lessonLink("perspron"),
    };
  }

  // ---------- war and hatte ----------
  const WAR = ["war", "warst", "war", "waren", "wart", "waren"];
  const HATTE = ["hatte", "hattest", "hatte", "hatten", "hattet", "hatten"];
  function genPraet() {
    const isSein = Math.random() < 0.5;
    const sj = pickSubject();
    const comp = pick(isSein ? ["gestern krank", "letzte Woche in Wien", "am Wochenende zu Hause", "gestern sehr müde", "im Urlaub am Meer"] :
      ["gestern keine Zeit", "letzte Woche Urlaub", "am Montag einen Termin", "gestern Kopfschmerzen", "am Samstag eine Party"]);
    const forms = isSein ? WAR : HATTE, form = forms[sj.p], inf = isSein ? "sein" : "haben";
    const parts = [cap(sj.s) + " ", null, " " + comp + "."];
    const who = (u) => forms.map((f, k) => (f === u ? P_LABEL[k] : null)).filter(Boolean).join(" and ");
    return {
      kind: "cloze", tag: label("praet"), title: `${inf} in the past`, concepts: ["praet"], xp: 8, parts,
      blanks: [{ accepts: [form] }], strict: true, hints: [`${inf}, past`, subjHint(sj)].filter(Boolean),
      solution: filledSentence(parts, [form]), sayAfter: plainSentence(parts, [form]), plain: plainSentence(parts, ["___"]) + ` (${inf}, past)`, mark: "Gr",
      diagnose: (vals, res) => {
        const u = (vals[0] || "").toLowerCase();
        if ((isSein ? SEIN : HABEN).includes(u)) res.notes.push(`<b>${esc(vals[0])}</b> is the present tense. For the past: <b>${esc(form)}</b>.`);
        else if (forms.includes(u)) res.notes.push(`<b>${esc(vals[0])}</b> is the ${who(u)} form. You need ${P_LABEL[sj.p]}.`);
        else if ((isSein ? HATTE : WAR).includes(u)) res.notes.push(`That's ${isSein ? "haben" : "sein"}. This sentence needs ${inf}.`);
      },
      explain: () => `<p>${subjWho(sj)}</p><div class="tbl-wrap"><table class="tbl conj"><thead><tr><th></th><th>${inf} (past)</th></tr></thead><tbody>${forms.map((f, k) =>
        `<tr class="${k === sj.p ? "hl" : ""}"><th scope="row">${P_LABEL[k]}</th><td>${f}</td></tr>`).join("")}</tbody></table></div>` +
        `<p>ich and er/sie/es are the same, with no ending: ich ${forms[0]}, er ${forms[2]}.</p>` + lessonLink("praet"),
    };
  }

  // ---------- dates ----------
  const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const ordinalStem = (n) => (n === 1 ? "erst" : n === 3 ? "dritt" : n === 7 ? "siebt" : n === 8 ? "acht" : num2de(n) + (n < 20 ? "t" : "st"));
  function genDates() {
    const m = rnd(12), d = 1 + rnd(MONTH_DAYS[m]), M = MONTHS[m];
    const mode = pick(["der", "am", "am"]);
    const stem = ordinalStem(d), form = stem + (mode === "der" ? "e" : "en");
    const parts = mode === "der" ? ["Heute ist der ", null, ` ${M}.`] : pick([["Mein Geburtstag ist am ", null, ` ${M}.`], ["Der Kurs fängt am ", null, ` ${M} an.`]]);
    const irregular = { 1: "1. is erste, not einste", 3: "3. is dritte, not dreite", 7: "7. is siebte: the -en of sieben drops", 8: "8. is achte, with one t" }[d];
    return {
      kind: "cloze", tag: label("dates"), title: "Say the date", concepts: ["dates"], xp: 8, parts,
      prompt: `<span class="big-de">${d}. ${M}</span>`, blanks: [{ accepts: [form] }], strict: true, hints: [`${d}.`],
      solution: filledSentence(parts, [form]), sayAfter: plainSentence(parts, [form]), plain: plainSentence(parts, ["___"]) + ` (${d}.)`, mark: "Gr",
      diagnose: (vals, res) => {
        const u = (vals[0] || "").toLowerCase();
        if (u === stem + (mode === "der" ? "en" : "e")) res.notes.push(mode === "der" ? "After der the ending is -e: der dritte." : "After am the ending is -en: am dritten.");
        else if (u === num2de(d) || u === String(d)) res.notes.push(`Dates use the ordinal number (first, second, third…): ${d}. = <b>${esc(form)}</b>.`);
        else if (irregular) res.notes.push(cap(irregular) + ".");
        else if (d >= 20 && u.startsWith(num2de(d) + "t")) res.notes.push("From 20 on the ordinal adds -st: zwanzigste, einundzwanzigste.");
      },
      explain: () => `<p>${d}. = <b>${esc(stem)}-</b>: ${d < 20 ? "1 to 19 add -t" : "from 20 on add -st"}${irregular ? ` (${irregular})` : ""}.</p>` +
        `<p>${mode === "der" ? "After <b>der</b> (the date is …) the ending is <b>-e</b>" : "After <b>am</b> (on …) the ending is <b>-en</b>"}: <mark>${esc(form)}</mark>.</p>` +
        `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>der …</th><th>am …</th></tr></thead><tbody><tr class="hl"><th scope="row">${d}.</th><td>der ${esc(stem)}e</td><td>am ${esc(stem)}en</td></tr></tbody></table></div>` + lessonLink("dates"),
    };
  }

  // ---------- und, aber, oder, denn ----------
  const KONJ_MEAN = { und: "and", aber: "but", oder: "or", denn: "because" };
  const KONJ_GIVES = { und: "something extra", aber: "a contrast", oder: "another possibility", denn: "the reason" };
  function genKonj() {
    const [a, k, clause, en] = pick(C.KONJ);
    const [S, V, R] = clause.split("|");
    const good = `${S} ${V} ${R}`, full = `${a} ${k} ${good}.`;
    const diagram = `<div class="tbl-wrap"><table class="brk"><thead><tr><th class="r-x">Position 0</th><th class="r-x">Position 1</th><th class="r-v">Verb</th><th class="r-x">Rest</th></tr></thead>` +
      `<tbody><tr><td class="r-x">${esc(k)}</td><td class="r-x">${esc(S)}</td><td class="r-v">${esc(V)}</td><td class="r-x">${esc(R)}.</td></tr></tbody></table></div>`;
    if (Math.random() < 0.55) {
      const sent = `${a} ___ ${good}.`;
      return {
        kind: "choice", tag: label("konj"), title: "Which linking word?", concepts: ["konj"], xp: 6, prompt: `<span class="sent">${esc(sent)}</span>`, sub: en,
        options: ["und", "aber", "oder", "denn"].map((v) => ({ v, html: v })), answer: k, correctHtml: esc(full), sayAfter: full, plain: sent, mark: "W",
        diagnose: (vals, res) => res.notes.push(`<b>${esc(vals[0])}</b> = ${KONJ_MEAN[vals[0]] || ""}.`),
        explain: () => `<p>The second part gives ${KONJ_GIVES[k]}, so it's <b>${k}</b> (${KONJ_MEAN[k]}).</p>` + diagram +
          `<p>After ${k} the word order stays normal: subject, then the verb.</p>` + lessonLink("konj"),
      };
    }
    const opts = [good, `${V} ${S} ${R}`, `${S} ${R} ${V}`];
    return {
      kind: "choice", tag: label("konj"), title: `What comes after ${k}?`, concepts: ["konj"], xp: 6, prompt: `<span class="sent">${esc(a)} ${esc(k)} …</span>`, sub: en,
      options: shuffle(opts).map((v) => ({ v, html: esc(v) + "." })), answer: good, correctHtml: esc(full), sayAfter: full, plain: `${a} ${k} …`, mark: "Sb",
      diagnose: (vals, res) => {
        if (vals[0] === opts[1]) res.notes.push(`The verb doesn't move to the front: ${esc(k)} sits in position 0 and doesn't count.`);
        else res.notes.push(`The verb doesn't go to the end after ${esc(k)}. (It does after weil, another word for because, which comes at A2.)`);
      },
      explain: () => `<p><b>${esc(k)}</b> sits in position 0: it links the sentences but doesn't count. After it comes a normal sentence: position 1, then the verb.</p>` + diagram + lessonLink("konj"),
    };
  }

  function genFromVocab(ctx, filter) {
    const seen = ctx.cat.order.map((id) => ctx.cat.cards.get(id)).filter((c) => c.kind === "v" && filter(c.e) && ctx.state[c.id] && ctx.state[c.id].s !== "new");
    const pool = seen.length ? seen : ctx.cat.order.map((id) => ctx.cat.cards.get(id)).filter((c) => c.kind === "v" && filter(c.e));
    return produceEx(pick(pool), ctx);
  }

  function exerciseForConcept(concept, ctx) {
    if (concept.startsWith("gr:")) return genGender(ctx, concept.slice(3));
    switch (concept) {
      case "sein": return genSein(ctx);
      case "pron": return genPron(ctx);
      case "conj:reg": return genConj(ctx, ["reg"]);
      case "conj:et": return genConj(ctx, ["et"]);
      case "conj:s": return genConj(ctx, ["s"]);
      case "conj:stem": return genConj(ctx, ["stem"]);
      case "conj:modal": return genConj(ctx, ["mod"]);
      case "haben": return genConj(ctx, ["irr"], ["haben"]);
      case "gender": return genGender(ctx, null);
      case "plural": return genPlural(ctx);
      case "ein": return genEin(ctx);
      case "poss": return genPoss(ctx);
      case "acc": return genAccFixed(ctx);
      case "dat": return genDat(ctx);
      case "neg": return genNeg(ctx);
      case "num": return genNum(ctx);
      case "time": return genTime(ctx);
      case "wq": return genWq(ctx);
      case "aux": return genAux(ctx);
      case "pp": return genPP(ctx);
      case "akkprep": return genAkkPrep(ctx);
      case "esgibt": return genEsGibt(ctx);
      case "imp": return genImp(ctx);
      case "perspron": return genPersPron(ctx);
      case "praet": return genPraet(ctx);
      case "dates": return genDates(ctx);
      case "konj": return genKonj(ctx);
      case "sep": return Math.random() < 0.5 ? genSep(ctx) : genOrder(ctx, "sep");
      case "v2": case "modal-order": case "q-order": case "perf-order": return genOrder(ctx, concept);
      case "cap": return genFromVocab(ctx, (e) => e.t === "n");
      case "umlaut": return genFromVocab(ctx, (e) => hasUml(e.de));
      default: return genGender(ctx, null);
    }
  }
  function conceptAcc(prof, c) {
    const s = prof && prof.concepts && prof.concepts[c];
    if (!s || s.h.length < 3) return null;
    return [...s.h.slice(-10)].filter((x) => x === "1").length / Math.min(10, s.h.length);
  }
  function exerciseForSkill(sk, ctx) {
    let concept;
    if (sk.id === "conj") concept = weighted([["conj:reg", 0.5], ["conj:et", 0.3], ["conj:s", 0.2]]);
    else if (sk.concepts.length === 1) concept = sk.concepts[0];
    else concept = weighted(sk.concepts.map((c) => [c, 1.5 - (conceptAcc(ctx.prof, c) ?? 0.75)]));
    const ex = exerciseForConcept(concept, ctx);
    if (sk.id === "moechten" && concept === "conj:modal") return genConj(ctx, ["mod"], ctx.started.has(9) ? null : ["möchten", "mögen"]);
    return ex;
  }
  function skillIntro(card) {
    const sk = card.sk;
    const U = C.UNITS.find((u) => u.u === sk.u);
    return {
      kind: "intro", card: card.id, tag: "Grammar", title: "New grammar skill", concepts: [], xp: 2, plain: sk.title,
      html: `<div class="wc wc-skill"><div class="wc-head"><span class="wc-de">${esc(sk.title)}</span></div><div class="skill-sum">${sk.sum}</div>` +
        `<button class="link" data-act="lesson" data-u="${sk.u}" data-a="${esc(sk.a)}">Full explanation: Unit ${sk.u} · ${esc(U.de)}</button></div>`,
    };
  }
  function exerciseForCard(card, st, ctx) {
    if (card.kind === "s") {
      if (!st || st.s === "new") return skillIntro(card);
      return Object.assign(exerciseForSkill(card.sk, ctx), { card: card.id });
    }
    const e = card.e;
    if (!st || st.s === "new") return vocabIntro(card);
    let mode;
    // after a miss the card steps back to recognition before it's asked as production again
    if (st.s === "learn" || st.s === "relearn") mode = st.st === 0 ? "recog" : "produce";
    else {
      const pairs = [["produce", e.gap ? 0.5 : 0.65], ["recog", 0.1]];
      if (e.gap) pairs.push(["context", 0.15]);
      if (ctx.voice) pairs.push(["listen", 0.15]);
      if (e.t === "n" && !e.plOnly) pairs.push(["gender", 0.12]);
      mode = weighted(pairs);
    }
    if (mode === "recog") return recogEx(card, ctx);
    if (mode === "context") return contextEx(card);
    if (mode === "listen") return e.ex && e.ex[0] && Math.random() < 0.4 ? dictEx(card) : produceEx(card, ctx, true);
    if (mode === "gender") return genderEx(e, card.id);
    return produceEx(card, ctx);
  }

  // ---------- concept stats & sessions ----------
  function recordConcept(prof, c, ok, now) {
    const s = prof.concepts[c] || (prof.concepts[c] = { h: "", n: 0, k: 0 });
    s.h = (s.h + (ok ? "1" : "0")).slice(-12);
    s.n++; if (ok) s.k++; s.t = now;
  }
  function conceptList(prof) {
    return Object.entries(prof.concepts || {}).filter(([id]) => C.CONCEPTS[id]).map(([id, s]) => {
      const recent = s.h.slice(-10);
      const acc = recent.length ? [...recent].filter((x) => x === "1").length / recent.length : 1;
      return { id, label: C.CONCEPTS[id].label, acc, n: s.n, h: s.h, score: (1 - acc) * Math.min(1, s.h.length / 8) };
    });
  }
  const weakList = (prof) => conceptList(prof).filter((c) => c.h.length >= 4 && c.acc < 0.75).sort((a, b) => b.score - a.score);
  function dueCards(ctx, now) {
    const due = [];
    for (const id of ctx.cat.order) {
      const st = ctx.state[id];
      if (st && !st.sus && st.s !== "new" && st.d <= now) due.push(id);
    }
    const rank = (id) => (ctx.state[id].s === "review" ? 1 : 0);
    return due.sort((a, b) => rank(a) - rank(b) || ctx.state[a].d - ctx.state[b].d);
  }
  function newCards(ctx) {
    return ctx.cat.order.filter((id) => {
      const st = ctx.state[id];
      return (!st || st.s === "new") && !(st && st.sus) && ctx.started.has(ctx.cat.cards.get(id).u);
    });
  }
  function buildDaily(ctx, settings, newToday, now) {
    const N = settings.sessionLen;
    const due = dueCards(ctx, now);
    const fresh = newCards(ctx);
    const newLeft = Math.max(0, settings.newPerDay - newToday);
    const nNew = Math.min(newLeft, fresh.length, Math.max(N - due.length, Math.ceil(N / 5)));
    const reviews = due.slice(0, Math.max(0, N - nNew));
    const weak = weakList(ctx.prof).slice(0, 2);
    const nWeak = weak.length ? Math.min(Math.ceil(N * 0.2), weak.length * 2) : 0;
    let items = reviews.map((id) => ({ k: "card", id }));
    const news = fresh.slice(0, nNew).map((id) => ({ k: "card", id, isNew: true }));
    // spread new cards evenly among the reviews
    news.forEach((it, i) => {
      const pos = Math.min(items.length, Math.round(((i + 1) * (items.length + news.length)) / (news.length + 1)) - 1);
      items.splice(Math.max(0, pos), 0, it);
    });
    for (let i = 0; i < nWeak; i++) {
      const c = weak[i % weak.length].id;
      items.splice(Math.min(items.length, 2 + rnd(Math.max(1, items.length - 1))), 0, { k: "concept", c, weak: true });
    }
    return { items, counts: { review: reviews.length, fresh: news.length, weak: nWeak, dueTotal: due.length, newAvail: Math.min(newLeft, fresh.length) } };
  }
  function buildExtra(ctx, unit, n) {
    const seen = ctx.cat.order.filter((id) => {
      const st = ctx.state[id];
      return st && !st.sus && st.s !== "new" && (unit == null || ctx.cat.cards.get(id).u === unit);
    });
    const sorted = seen.sort((a, b) => ctx.state[a].e - ctx.state[b].e || ctx.state[a].d - ctx.state[b].d);
    const top = shuffle(sorted.slice(0, n * 2)).slice(0, n);
    return top.map((id) => ({ k: "card", id, extra: true }));
  }
  const buildDrill = (concept, n) => Array.from({ length: n }, () => ({ k: "concept", c: concept, drill: true }));

  // ---------- combining progress from two places ----------
  // Joins two saved states (this app and a backup, a save file or the account copy). Each card keeps its most recent
  // review, XP and answers are added up day by day, and lists are joined. prof.resetAt marks a reset or a full
  // replace: the side that made it is kept whole, and anything the other side recorded before it is dropped.
  function mergeStates(a, b) {
    a = JSON.parse(JSON.stringify(a)); b = JSON.parse(JSON.stringify(b));
    const R = Math.max(+a.prof.resetAt || 0, +b.prof.resetAt || 0);
    const stale = (x) => (+x.prof.resetAt || 0) < R;
    if (stale(a) && (+a.updatedAt || 0) < R) return b;
    if (stale(b) && (+b.updatedAt || 0) < R) return a;
    const resetDay = R ? dayKey(R) : "";
    for (const x of [a, b]) {
      if (!stale(x)) continue;
      for (const [id, st] of Object.entries(x.cards)) if (!st || (+st.t || 0) < R) delete x.cards[id];
      const p = x.prof;
      for (const k of Object.keys(p.days)) if (k < resetDay) delete p.days[k];
      for (const key of ["started", "read", "badges", "bosses"]) for (const [k, t] of Object.entries(p[key])) if (+t < R) delete p[key][k];
      p.mistakes = p.mistakes.filter((m) => m.t >= R);
      p.writing = p.writing.filter((w) => w.t >= R);
      for (const [c, s] of Object.entries(p.concepts)) if ((+s.t || 0) < R) delete p.concepts[c];
      // its totals included the dropped history, so rebuild them from the days that are left
      const ds = Object.values(p.days);
      for (const k of Object.keys(p.stats)) p.stats[k] = 0;
      p.xp = ds.reduce((s, d) => s + (d.xp || 0), 0);
      p.stats.answers = ds.reduce((s, d) => s + (d.n || 0), 0);
      p.stats.correct = ds.reduce((s, d) => s + (d.ok || 0), 0);
    }
    const newer = (+a.updatedAt || 0) >= (+b.updatedAt || 0) ? a : b, older = newer === a ? b : a;
    const pa = a.prof, pb = b.prof;
    const cards = Object.assign({}, older.cards);
    for (const [id, st] of Object.entries(newer.cards)) if (!cards[id] || (+st.t || 0) >= (+cards[id].t || 0)) cards[id] = st;
    const custom = [...newer.custom];
    for (const c of older.custom) if (!custom.some((x) => x.id === c.id)) custom.push(c);
    // XP and answer counts: start from the side with more XP and add what the other side earned on each day beyond it
    const base = (+pa.xp || 0) >= (+pb.xp || 0) ? pa : pb, other = base === pa ? pb : pa;
    let xp = +base.xp || 0, answers = +base.stats.answers || 0, correct = +base.stats.correct || 0;
    const days = Object.assign({}, other.days);
    for (const [k, d] of Object.entries(base.days)) {
      const o = other.days[k] || { xp: 0, n: 0, ok: 0 };
      xp += Math.max(0, (o.xp || 0) - (d.xp || 0)); answers += Math.max(0, (o.n || 0) - (d.n || 0)); correct += Math.max(0, (o.ok || 0) - (d.ok || 0));
      days[k] = { xp: Math.max(d.xp || 0, o.xp || 0), n: Math.max(d.n || 0, o.n || 0), ok: Math.max(d.ok || 0, o.ok || 0) };
    }
    for (const [k, o] of Object.entries(other.days)) if (!base.days[k]) { xp += o.xp || 0; answers += o.n || 0; correct += o.ok || 0; }
    const stats = {};
    for (const k of new Set([...Object.keys(pa.stats), ...Object.keys(pb.stats)])) stats[k] = Math.max(+pa.stats[k] || 0, +pb.stats[k] || 0);
    Object.assign(stats, { answers, correct });
    const union = (x, y, pickT) => { const out = Object.assign({}, x); for (const [k, t] of Object.entries(y)) out[k] = k in out ? pickT(+out[k], +t) : t; return out; };
    const concepts = Object.assign({}, older.prof.concepts);
    for (const [c, s] of Object.entries(newer.prof.concepts)) if (!concepts[c] || (+s.t || 0) >= (+concepts[c].t || 0)) concepts[c] = s;
    const byKey = (list, key, n) => {
      const seen = new Set(), out = [];
      for (const it of [...list].sort((x, y) => y.t - x.t)) { const k = key(it); if (!seen.has(k)) { seen.add(k); out.push(it); } }
      return out.slice(0, n);
    };
    const nd = pa.newDay.d === pb.newDay.d ? { d: pa.newDay.d, n: Math.max(pa.newDay.n, pb.newDay.n) } : pa.newDay.d > pb.newDay.d ? pa.newDay : pb.newDay;
    const prof = Object.assign({}, newer.prof, {
      xp, stats, days, concepts, newDay: nd, created: Math.min(+pa.created || Date.now(), +pb.created || Date.now()),
      started: union(pa.started, pb.started, Math.min), read: union(pa.read, pb.read, Math.min),
      badges: union(pa.badges, pb.badges, Math.min), bosses: union(pa.bosses, pb.bosses, Math.max),
      mistakes: byKey([...pa.mistakes, ...pb.mistakes], (m) => m.t + "|" + m.q, 40),
      writing: byKey([...pa.writing, ...pb.writing], (w) => String(w.t), 12),
      resetAt: R || undefined,
    });
    if (!prof.resetAt) delete prof.resetAt;
    return { v: 1, updatedAt: Math.max(+a.updatedAt || 0, +b.updatedAt || 0), cards, custom, prof };
  }
  // A stable fingerprint of everything that counts as progress, to tell whether a merge changed anything.
  function progressKey(st) {
    const norm = (x) => (Array.isArray(x) ? x.map(norm) : x && typeof x === "object" ? Object.keys(x).sort().reduce((o, k) => ((o[k] = norm(x[k])), o), {}) : x);
    return JSON.stringify(norm({ cards: st.cards, custom: st.custom, prof: st.prof }));
  }

  root.DH_ENGINE = {
    DAY, C, VOCAB, NOUNS, VERBS, DEMO, SKILL_BY_ID, ART, P_LABEL,
    esc, cap, pick, shuffle, slug, dayKey, dayStart, dueAt, say, gchip, rnd,
    nounParts, umlautize, pluralOf, verbInfo, ppInfo, num2de, timeDe, possForm,
    matchLevel, bestMatch, check, diff, lev, translit, normSpace,
    schedule, statusOf, mastery, blankState, buildCatalog, customEntry, explainWord, ruleBox, lessonLink,
    exerciseForCard, exerciseForConcept, recordConcept, conceptList, weakList, conceptAcc, dueCards, newCards, buildDaily, buildExtra, buildDrill,
    mergeStates, progressKey,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.DH_ENGINE;
})(typeof window !== "undefined" ? window : globalThis);
