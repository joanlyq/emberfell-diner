"use strict";
/* Emberfell Diner — vanilla JS, no build step. */

// ---------- tiny helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseIso = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseIso(s); d.setDate(d.getDate() + n); return iso(d); };
const today = () => iso(new Date());
const daysFrom = (s) => Math.round((parseIso(s) - parseIso(today())) / 864e5);
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const fmtDay = (s) => { const d = parseIso(s); return { dow: DOW[(d.getDay() + 6) % 7], day: d.getDate(), mon: d.toLocaleString("en", { month: "short" }) }; };
function mondayOf(s) { const d = parseIso(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); }
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2200); }

// ---------- ingredient language ----------
const ALIAS = {
  // Aussie / UK names
  meatballs: "丸子", meatball: "丸子", "fish balls": "鱼丸", soba: "荞麦面", kimchi: "泡菜", "glass noodles": "粉丝", "vermicelli": "粉丝", basil: "罗勒", "thai basil": "九层塔", "bay leaves": "香叶", "bay leaf": "香叶", rosemary: "迷迭香", "lemon grass": "香茅", lemongrass: "香茅", "black fungus": "木耳", "wood ear": "木耳", "shiitake": "香菇", "dried shiitake": "香菇", seaweed: "紫菜", "century egg": "皮蛋", "salted duck egg": "咸鸭蛋",
  broccoli: "西兰花", broccolini: "西兰花", "chicken maryland": "鸡腿", "chicken leg": "鸡腿", "chicken legs": "鸡腿", drumstick: "鸡腿", drumsticks: "鸡腿",
  prawn: "虾", prawns: "虾", "green prawns": "虾", "king prawns": "虾", "tiger prawns": "虾", shrimp: "虾",
  capsicum: "青椒", "red capsicum": "彩椒", zucchini: "西葫芦", courgette: "西葫芦", eggplant: "茄子", aubergine: "茄子",
  coriander: "香菜", cilantro: "香菜", "snow peas": "荷兰豆", shallots: "葱", "beef mince": "牛肉末", "pork mince": "猪肉末", mince: "肉末",
  egg: "鸡蛋", eggs: "鸡蛋", chicken: "鸡肉", "chicken breast": "鸡胸肉", "chicken thigh": "鸡腿", "chicken thighs": "鸡腿",
  "chicken wings": "鸡翅", "chicken wing": "鸡翅", "chicken feet": "鸡爪", "whole chicken": "整鸡", duck: "鸭",
  pork: "猪肉", "pork belly": "五花肉", "pork mince": "猪肉末", "minced pork": "猪肉末", "ground pork": "猪肉末",
  "pork loin": "里脊", ribs: "排骨", "pork ribs": "排骨", beef: "牛肉", "beef brisket": "牛腩", "beef mince": "牛肉末",
  lamb: "羊肉", fish: "鱼", salmon: "三文鱼", shrimp: "虾", prawn: "虾", prawns: "虾", squid: "鱿鱼", crab: "蟹",
  clams: "花甲", scallops: "扇贝", tofu: "豆腐", "firm tofu": "老豆腐", "silken tofu": "嫩豆腐",
  potato: "土豆", potatoes: "土豆", tomato: "番茄", tomatoes: "番茄", onion: "洋葱", onions: "洋葱", garlic: "蒜",
  ginger: "姜", "spring onion": "葱", scallion: "葱", scallions: "葱", "green onion": "葱", leek: "大葱",
  carrot: "胡萝卜", carrots: "胡萝卜", cabbage: "包菜", "napa cabbage": "大白菜", "chinese cabbage": "大白菜",
  broccoli: "西兰花", cauliflower: "花菜", eggplant: "茄子", aubergine: "茄子", cucumber: "黄瓜",
  capsicum: "青椒", "green pepper": "青椒", "bell pepper": "彩椒", "red capsicum": "彩椒", chili: "辣椒", chilli: "辣椒",
  "dried chili": "干辣椒", "dried chilli": "干辣椒", mushroom: "蘑菇", mushrooms: "蘑菇", shiitake: "香菇",
  enoki: "金针菇", "wood ear": "木耳", spinach: "菠菜", lettuce: "生菜", celery: "芹菜", corn: "玉米",
  rice: "米饭", "cooked rice": "米饭", noodles: "面条", flour: "面粉", milk: "牛奶", butter: "黄油", cheese: "奶酪",
  cream: "淡奶油", yogurt: "酸奶", lemon: "柠檬", lime: "青柠", "bean sprouts": "豆芽", "winter melon": "冬瓜",
  pumpkin: "南瓜", zucchini: "西葫芦", courgette: "西葫芦", "bok choy": "青菜", "pak choy": "青菜", "choy sum": "菜心",
  coriander: "香菜", cilantro: "香菜", "soy sauce": "生抽", "light soy sauce": "生抽", "dark soy sauce": "老抽",
  "oyster sauce": "蚝油", "sesame oil": "香油", vinegar: "醋", "black vinegar": "香醋", sugar: "糖", salt: "盐",
  "cooking wine": "料酒", "shaoxing wine": "料酒", starch: "淀粉", cornstarch: "淀粉", cornflour: "淀粉", oil: "食用油",
  sausage: "香肠", "chinese sausage": "腊肠", bacon: "培根", ham: "火腿", "rice cake": "年糕", dumplings: "饺子",
  bread: "面包", beer: "啤酒", cola: "可乐", "chili bean paste": "豆瓣酱", doubanjiang: "豆瓣酱", ketchup: "番茄酱",
  "tomato sauce": "番茄酱", "star anise": "八角", "bay leaf": "香叶", "bay leaves": "香叶", "sichuan pepper": "花椒",
  cinnamon: "桂皮", "lotus root": "莲藕", yam: "山药", okra: "秋葵", peas: "豌豆", "green beans": "四季豆",
  kelp: "海带", seaweed: "紫菜", "sweet potato": "红薯", apple: "苹果", mango: "芒果", banana: "香蕉",
  avocado: "牛油果", tuna: "金枪鱼", "white pepper": "白胡椒粉", "black pepper": "黑胡椒", cumin: "孜然",
  sesame: "芝麻", peanuts: "花生", peanut: "花生", radish: "白萝卜", daikon: "白萝卜", "glass noodles": "粉丝",
  "vermicelli": "粉丝", "spaghetti": "意面", pasta: "意面", honey: "蜂蜜", chives: "韭菜", "garlic chives": "韭菜",
  "chicken stock": "鸡汤", stock: "高汤", "fish sauce": "鱼露", "five spice": "五香粉", "msg": "味精",
};
const ZH2EN = {}; for (const [en, zh] of Object.entries(ALIAS)) if (!ZH2EN[zh]) ZH2EN[zh] = en;
const GROUPS = [
  ["鸡肉", ["鸡肉", "鸡腿", "鸡胸", "鸡胸肉", "鸡翅", "鸡翅中", "鸡块", "三黄鸡", "鸡腿肉", "整鸡", "土鸡", "鸡全腿", "琵琶腿"]],
  ["猪肉", ["猪肉", "五花肉", "猪里脊", "里脊", "里脊肉", "肉末", "猪肉末", "肉馅", "猪肉馅", "瘦肉", "梅花肉", "前腿肉", "后腿肉", "猪绞肉"]],
  ["牛肉", ["牛肉", "牛腩", "牛里脊", "肥牛", "牛肉片", "牛肉末", "牛腱子"]],
  ["蒜", ["蒜", "大蒜", "蒜瓣", "蒜头", "蒜末", "蒜蓉", "蒜子"]],
  ["姜", ["姜", "生姜", "姜片", "老姜", "姜末", "姜丝"]],
  ["葱", ["葱", "小葱", "香葱", "葱花", "葱段", "葱白"]],
  ["番茄", ["番茄", "西红柿"]],
  ["糖", ["糖", "白糖", "白砂糖", "绵白糖", "细砂糖"]],
  ["盐", ["盐", "食盐", "食用盐"]],
  ["食用油", ["油", "食用油", "植物油", "食用植物油", "花生油", "玉米油", "菜籽油"]],
  ["生抽", ["生抽", "酱油", "生抽酱油", "老抽", "味极鲜"]],
  ["醋", ["醋", "香醋", "陈醋", "白醋", "米醋"]],
  ["淀粉", ["淀粉", "生粉", "玉米淀粉", "土豆淀粉"]],
  ["水", ["水", "清水", "开水", "温水", "冷水", "冰水", "热水"]],
  ["西兰花", ["西兰花", "西蓝花", "绿花菜", "青花菜", "西兰花苗"]],
  ["花菜", ["花菜", "菜花", "花椰菜", "白花菜"]],
  ["鸡蛋", ["鸡蛋", "蛋", "土鸡蛋", "蛋黄", "蛋清", "蛋白"]],
  ["米饭", ["米饭", "大米", "剩米饭", "隔夜饭", "白米饭"]],
  ["虾", ["虾", "鲜虾", "大虾", "虾仁", "基围虾", "明虾"]],
  ["辣椒", ["辣椒", "小米椒", "小米辣", "红辣椒", "朝天椒", "线椒"]],
  ["青椒", ["青椒", "青辣椒", "尖椒"]],
  ["大白菜", ["大白菜", "白菜"]],
  ["青菜", ["青菜", "小白菜", "上海青", "油菜"]],
  ["胡椒粉", ["胡椒粉", "白胡椒粉", "白胡椒", "胡椒"]],
  ["鸡精", ["鸡精", "味精", "鸡粉"]],
  ["香油", ["香油", "芝麻油"]],
  ["豆腐", ["豆腐", "老豆腐", "嫩豆腐", "北豆腐", "南豆腐"]],
  ["土豆", ["土豆", "马铃薯"]],
  ["面条", ["面条", "挂面", "手擀面", "鸡蛋面", "拉面", "乌冬面"]],
  ["黑胡椒", ["黑胡椒", "黑胡椒粉", "黑椒碎", "黑椒粉", "黑胡椒碎"]],
  ["蘑菇", ["蘑菇", "口蘑", "白蘑菇", "平菇", "蟹味菇", "香菇"]],
];
const GROUP_OF = {}; for (const [k, ms] of GROUPS) for (const m of ms) GROUP_OF[m] = k;
function canon(n) {
  n = String(n || "").trim().toLowerCase();
  if (!n) return "";
  const mine = WORDS[n]?.by === "you" && WORDS[n].t;
  if (mine && HAS_ZH.test(mine)) n = mine;
  else if (ALIAS[n]) n = ALIAS[n];
  else if (n.endsWith("s") && ALIAS[n.slice(0, -1)]) n = ALIAS[n.slice(0, -1)];
  else if (!HAS_ZH.test(n) && WORDS[n]?.t && HAS_ZH.test(WORDS[n].t)) n = WORDS[n].t;
  if (GROUP_OF[n]) return GROUP_OF[n];
  for (const [k, ms] of GROUPS) if (ms.some((m) => m.length >= 2 && n.includes(m))) return k;
  return n;
}
const same = (a, b) => a === b || (a.length >= 2 && b.includes(a)) || (b.length >= 2 && a.includes(b));
// Auto translations (data/words.json): your edits win, then built-in ALIAS, then MyMemory.
let WORDS = {};
const HAS_ZH = /[\u4e00-\u9fff]/, HAS_EN = /[a-z]/i;
const word = (n) => { const w = WORDS[String(n).trim().toLowerCase()]; return w && w.t ? w : null; };
function translationOf(n) {
  n = String(n || "").trim(); const l = n.toLowerCase();
  if (HAS_ZH.test(n) && HAS_EN.test(n)) return "";            // already bilingual, e.g. "wombok白菜"
  const mine = word(n); if (mine && mine.by === "you") return mine.t;
  if (HAS_EN.test(n)) return ALIAS[l] || (l.endsWith("s") && ALIAS[l.slice(0, -1)]) || word(n)?.t || "";
  return ZH2EN[n] || word(n)?.t || ZH2EN[canon(n)] || "";
}
// One format everywhere: "English · 中文" (or "中文 · English" when the language picker is Chinese).
// Mixed names you typed ("wombok白菜", "satay sauce沙爹酱") are split and re-joined the same way.
function splitName(n) {
  n = String(n || "").trim();
  const zh = (n.match(/[\u4e00-\u9fff]+/g) || []).join("");
  const en = n.replace(/[\u4e00-\u9fff]+/g, " ").replace(/[·•|/,，、]+|\s[-–—]\s/g, " ").replace(/\s+/g, " ").trim();
  return { en, zh };
}
function label(n) {
  let { en, zh } = splitName(n);
  if (en && !zh) { const t = translationOf(en); if (HAS_ZH.test(t)) zh = t; }
  else if (zh && !en) { const t = translationOf(zh); if (t && !HAS_ZH.test(t)) en = t; }
  if (!en || !zh) return en || zh;
  return LANG.startsWith("zh") ? `${zh} · ${en}` : `${en} · ${zh}`;
}
async function autoTranslate() {
  const names = [...new Set([...DB.pantry.map((p) => p.name), ...DB.shopping.map((s) => s.item || s.name)])]
    .filter((n) => n && n.length <= 60 && !(HAS_ZH.test(n) && HAS_EN.test(n)) && !translationOf(n) && !(n.trim().toLowerCase() in WORDS));
  if (autoTranslate.busy || !names.length) return;
  autoTranslate.busy = true;
  let got = 0, fails = 0;
  for (const n of names) {
    try { const r = await fetch("/api/word?q=" + encodeURIComponent(n)); if (r.ok) { WORDS[n.trim().toLowerCase()] = await r.json(); got++; } else fails++; } catch { fails++; }
    if (fails >= 3) break;  // offline / service down: try again next visit
    if (got % 8 === 0 && $("#modal").hidden) render();
  }
  autoTranslate.busy = false;
  if (got && $("#modal").hidden) render();
}

const DEFAULT_SETTINGS = {
  cookDays: [0, 1, 2, 3, 6], servings: 4, dishesPerMeal: 1, maxStars: 4,
  stores: ["Supermarket", "Greengrocer", "Butcher", "Fishmonger", "Pet store", "Hardware store", "Online"],
  // which shop each kind of item goes to (rename/reassign in Settings → Where you shop)
  storeRoles: { produce: "Greengrocer", meat: "Butcher", seafood: "Fishmonger", pets: "Pet store", hardware: "Hardware store" },
  staples: ["盐", "糖", "食用油", "生抽", "料酒", "醋", "淀粉", "水", "鸡精", "胡椒粉", "香油", "蚝油", "冰糖", "冰块", "黑胡椒"],
};
const DINNER_CATS = { main: ["Meat", "Seafood", "Staple"], side: ["Veg", "Soup"], any: ["Meat", "Seafood", "Staple", "Veg"] };
const DRY_WORDS = ["米", "面", "粉", "油", "酱", "醋", "糖", "盐", "料酒", "干", "罐头", "八角", "花椒", "桂皮", "香叶", "蒜", "洋葱", "土豆", "红薯"];

// ---------- language ----------
const LANGS = { "zh-CN": "中文 (原文)", "en-US": "English", "zh-TW": "繁體中文", "ja-JP": "日本語", "ko-KR": "한국어", "vi-VN": "Tiếng Việt",
  "th-TH": "ไทย", "id-ID": "Bahasa Indonesia", "de-DE": "Deutsch", "fr-FR": "Français", "es-ES": "Español", "it-IT": "Italiano",
  "pt-BR": "Português", "ru-RU": "Русский", "nl-NL": "Nederlands", "pl-PL": "Polski", "tr-TR": "Türkçe", "ar-SA": "العربية", "hi-IN": "हिन्दी" };
let LANG = (() => { try { return localStorage.getItem("lang") || "en-US"; } catch { return "en-US"; } })();
const dispName = (r) => (LANG.startsWith("en") && r.en ? r.en : r.name);
const subName = (r) => (LANG.startsWith("en") && r.en ? r.name : "");
function aiurUrl(r) { return r.aid ? `https://howtocook.aiursoft.com/Culture/Set?culture=${LANG}&returnUrl=${encodeURIComponent("/Recipes/Detail/" + r.aid)}` : r.url; }

// tiny markdown → html (input is HowToCook text; everything escaped first)
function md(src) {
  const inline = (t) => esc(t)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, a, u) => /^(\/repo\/|https:\/\/)/.test(u) ? `<img src="${u}" alt="${a}" loading="lazy">` : "")
    .replace(/\[([^\]]*)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>");
  const out = []; let list = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of String(src || "").split("\n")) {
    const l = raw.trim();
    let m;
    if (!l) { close(); continue; }
    if ((m = l.match(/^(#{2,4})\s+(.*)/))) { close(); out.push(`<h4>${inline(m[2])}</h4>`); continue; }
    if ((m = l.match(/^\d+[.、)]\s*(.*)/))) { if (list !== "ol") { close(); out.push("<ol>"); list = "ol"; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    if ((m = l.match(/^[-*+]\s+(.*)/))) { if (list !== "ul") { close(); out.push("<ul>"); list = "ul"; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    if (/^\|/.test(l)) { if (/^\|\s*:?-/.test(l)) continue; close(); out.push(`<div class="small">${inline(l.replace(/\|/g, " · ").replace(/^ · | · $/g, ""))}</div>`); continue; }
    close(); out.push(`<p>${inline(l)}</p>`);
  }
  close();
  return out.join("");
}
async function fillSteps(r, original) {
  const box = $("#steps"); if (!box) return;
  const local = () => md(r.steps || r.desc || "");
  if (original || LANG === "zh-CN" || !r.aid) {
    box.innerHTML = local() || `<p class="muted">No steps saved. <a href="${esc(r.url)}" target="_blank" rel="noopener">Open source ↗</a></p>`;
    if (!original && LANG !== "zh-CN" && !r.aid && !r.custom) box.insertAdjacentHTML("afterbegin", `<p class="small muted">No ${esc(LANGS[LANG])} version of this one yet — showing original.</p>`);
    return;
  }
  box.innerHTML = `<p class="muted">Loading ${esc(LANGS[LANG])}…</p>`;
  try {
    const res = await fetch(`/api/translate?id=${encodeURIComponent(r.id)}&lang=${LANG}`);
    if (!res.ok) throw new Error((await res.json()).error);
    const { html } = await res.json();
    if ($("#steps") !== box) return;
    box.innerHTML = html; // server already sanitised
    box.querySelector("h1")?.remove(); // title + photo already shown above
    if (r.img) box.querySelector("img")?.closest("p")?.remove();
  } catch (e) {
    box.innerHTML = `<p class="small muted">Translation unavailable (${esc(e.message)}) — showing original.</p>` + local();
  }
}

// ---------- state ----------
let DB = null, BASE = [], RECIPES = [], BYID = {}, TAB = "week";
const ui = { store: "", q: "", cat: "", prot: "", stars: "", kcal: "", ing: "", quick: "", rail: false, sort: "match", limit: 40 };
const S = () => Object.assign({}, DEFAULT_SETTINGS, DB.settings);

async function load() {
  const [db, rec, words] = await Promise.all([fetch("/api/db").then((r) => r.json()), BASE.length ? BASE : fetch("/api/recipes").then((r) => r.json()),
    fetch("/api/words").then((r) => r.json()).catch(() => ({}))]);
  DB = db; BASE = rec; WORDS = words;
  RECIPES = BASE.concat(DB.custom.map((c) => ({ ...c, custom: true })));
  BYID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
  for (const r of RECIPES) for (const i of r.ings) i.k = canon(i.n);
  seedLocMemory();
}
async function save(...sections) {
  if ((sections.includes("plan") || sections.includes("pantry")) && !sections.includes("shopping")) { syncShopping(); sections.push("shopping"); }
  for (const s of sections) {
    const res = await fetch("/api/db/" + s, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(DB[s]) });
    if (!res.ok) { toast("Save failed — is the server running?"); return; }
  }
  if (sections.includes("custom")) await load();
}

// ---------- pantry matching ----------
function pantryItems() { return DB.pantry.map((p) => ({ ...p, k: canon(p.name), left: p.exp ? daysFrom(p.exp) : null })); }
function stapleSet() { return new Set(S().staples.map(canon)); }
function findItem(k, items) { return items.find((p) => same(p.k, k)); }
function analyze(r, items = pantryItems(), staples = stapleSet()) {
  const swaps = DB.notes[r.id]?.swaps || {};
  const ings = [];
  for (const i of r.ings) {
    if (i.n in swaps) { if (swaps[i.n]) ings.push({ n: swaps[i.n], k: canon(swaps[i.n]), opt: i.opt, swapped: i.n }); continue; }
    ings.push(i);
  }
  const out = { have: [], missing: [], staple: [], optional: [], ings };
  for (const i of ings) {
    const isStaple = [...staples].some((s) => s === i.k);
    const item = findItem(i.k, items);
    const row = { ...i, item };
    if (isStaple) out.staple.push(row);
    else if (i.opt) out.optional.push(row);
    else (item ? out.have : out.missing).push(row);
  }
  const ess = out.have.length + out.missing.length;
  out.cov = ess ? out.have.length / ess : 0;
  out.ess = ess;
  return out;
}

// ---------- recipe notes ----------
function isFav(id) { return (DB.settings.favs || []).includes(id); }
function noteOf(id) { return DB.notes[id] || { cooks: [] }; }
function avgRating(id) { const c = noteOf(id).cooks.filter((x) => x.rating); return c.length ? c.reduce((a, x) => a + x.rating, 0) / c.length : null; }
function lastCooked(id) { const c = noteOf(id).cooks; return c.length ? c[c.length - 1].date : null; }
const hidden = (id) => noteOf(id).again === "no";

// ---------- planner ----------
function currentWeek() {
  if (!DB.plan.weekOf) DB.plan = { weekOf: mondayOf(today()), days: {}, seed: 1 };
  return DB.plan;
}
function score(r, ctx) {
  const a = analyze(r, ctx.items, ctx.staples);
  // coverage, scaled down for trivial recipes (1-2 real ingredients) so dinners are proper meals
  let s = a.ess ? a.cov * Math.min(1, a.ess / 4) + Math.min(a.have.length, 6) * 0.05 : 0;
  for (const h of a.have) {
    if (ctx.reserved.has(h.item.id)) { s -= 0.35 / (a.ess || 1); continue; }
    if (h.item.left !== null && h.item.left <= 3) s += 0.3;
    else if (h.item.left !== null && h.item.left <= 7) s += 0.1;
  }
  s -= a.missing.length * 0.04;
  const avg = avgRating(r.id); if (avg) s += (avg - 3) * 0.1;
  if (isFav(r.id)) s += 0.15;
  if (noteOf(r.id).lunch === "great") s += 0.05;
  const lc = lastCooked(r.id); if (lc && daysFrom(lc) > -14) s -= 0.5;
  s -= (ctx.proteins[r.protein] || 0) * 0.2;
  s += ctx.rand() * 0.25;
  return { s, a };
}
function rank(slot, ctx, exclude) {
  const st = S();
  const cats = DINNER_CATS[slot];
  return RECIPES.filter((r) => cats.includes(r.cat) && !exclude.has(r.id) && !hidden(r.id) && (!r.stars || r.stars <= st.maxStars) && r.ings.length >= 3)
    .map((r) => ({ r, ...score(r, ctx) })).sort((x, y) => y.s - x.s);
}
function planCtx(seed, skipDate) {
  const ctx = { items: pantryItems(), staples: stapleSet(), reserved: new Set(), proteins: {}, rand: rng(seed) };
  const plan = currentWeek();
  for (const [d, day] of Object.entries(plan.days)) {
    if (d === skipDate) continue;
    for (const id of day.dishes) { const r = BYID[id]; if (!r) continue; reserve(r, ctx); }
  }
  return ctx;
}
function reserve(r, ctx) {
  ctx.proteins[r.protein] = (ctx.proteins[r.protein] || 0) + 1;
  for (const h of analyze(r, ctx.items, ctx.staples).have) ctx.reserved.add(h.item.id);
}
function slotsFor() { return S().dishesPerMeal === 2 ? ["main", "side"] : ["any"]; }
function generate(reshuffle) {
  const plan = currentWeek(), st = S();
  if (reshuffle) plan.seed = (plan.seed || 1) + 1;
  const wkEnd = addDays(plan.weekOf, 6);  // only reshuffle the week on screen; other weeks keep their dinners
  for (const d of Object.keys(plan.days)) if (d >= plan.weekOf && d <= wkEnd && !plan.days[d].locked && !plan.days[d].cooked) delete plan.days[d];
  const ctx = planCtx(plan.seed);
  const used = new Set(Object.values(plan.days).flatMap((d) => d.dishes));
  for (let i = 0; i < 7; i++) {
    const date = addDays(plan.weekOf, i);
    if (!st.cookDays.includes(i) || plan.days[date] || daysFrom(date) < 0) continue; // never plan the past
    const dishes = [];
    for (const slot of slotsFor()) {
      const best = rank(slot, ctx, used)[0];
      if (!best) continue;
      dishes.push(best.r.id); used.add(best.r.id); reserve(best.r, ctx);
    }
    plan.days[date] = { dishes, servings: st.servings, locked: false, cooked: false };
  }
  save("plan");
}
function swapDish(date, idx) {
  const plan = currentWeek(), day = plan.days[date];
  const ctx = planCtx(Date.now() % 1e9, date);
  day.dishes.forEach((id, j) => { if (j !== idx && BYID[id]) reserve(BYID[id], ctx); });
  const exclude = new Set(Object.values(plan.days).flatMap((d) => d.dishes));
  const cur = BYID[day.dishes[idx]];
  const slot = S().dishesPerMeal === 2 ? (cur && DINNER_CATS.side.includes(cur.cat) ? "side" : "main") : "any";
  const pick = rank(slot, ctx, exclude).slice(0, 5);
  if (!pick.length) return toast("No other match");
  day.dishes[idx] = pick[Math.floor(Math.random() * pick.length)].r.id;
  save("plan"); render();
}

// ---------- shopping ----------
// ---------- shopping list (kept in sync with the plan) ----------
// Plan lines are rebuilt whenever the plan or pantry changes; your own lines and ticked lines are never touched.
function upcomingDays() {
  const plan = currentWeek();
  return Object.keys(plan.days).filter((d) => daysFrom(d) >= 0 && !plan.days[d].cooked && plan.days[d].dishes.length).sort();
}
function shopDays() { const skip = new Set(DB.plan.shopSkip || []); return upcomingDays().filter((d) => !skip.has(d)); }
const fmtQ = (q) => (q >= 20 ? Math.round(q / 5) * 5 : Math.round(q * 10) / 10);
function amountFor(r, ing, f) {
  const row = (r.table || []).find(([n]) => n && (n.includes(ing.n) || same(canon(n), ing.k)));
  if (!row) return null;
  const q = parseFloat(String(row[1]).split(/[-–~]/).pop());
  if (!q) return null;
  const unit = (String(row[2]).trim().match(/^[a-zA-Z]+|^[^\s0-9a-zA-Z，。,、；;:：（(]{1,2}/) || [""])[0];
  return { q: q * f, unit };
}
function aisle(name) {
  const n = String(name).toLowerCase(), both = `${n} ${canon(n)}`;
  if (HOUSEHOLD.test(n)) return "🧻 Household";
  if (PET_SHOP.test(n)) return "🐾 Pets";
  if (HARDWARE.test(n) && !/seeds?$|sesame|chia/.test(n)) return "🔧 Hardware & garden";
  if (RAW_PROTEIN.test(both) && !NOT_RAW.test(both)) return "🥩 Meat & seafood";
  if (/milk|yog|cheese|butter|cream|egg|tofu|奶|乳|酪|蛋(?!糕)|豆腐/.test(both)) return "🥛 Dairy, eggs & tofu";
  if (LOC_RULES.freezer.test(n)) return "❄️ Frozen";
  if (/stock|sauce|paste|powder|canned|tinned|dried|粉|酱|干|罐头/.test(both)) return "🥫 Pantry";
  if (/banana|apple|pear|orange|mandarin|lemon|lime|berr|grape|mango|kiwi|peach|plum|nectarine|apricot|cherr|melon|avocado|pineapple|papaya|lychee|onion|garlic|potato|pumpkin|ginger|水果|香蕉|苹果|梨|橙|柠檬|葡萄|芒果|桃|西瓜|牛油果|洋葱|蒜|土豆|红薯|南瓜|姜/.test(both)) return "🥬 Fruit & veg";
  if (HERBS.test(both) || LOC_RULES.fridge.test(both)) return "🥬 Fruit & veg";
  if (LOC_RULES.pantry.test(both) || DRY_WORDS.some((w) => canon(n).includes(w))) return "🥫 Pantry";
  return "🛒 Other";
}
const AISLES = ["🥬 Fruit & veg", "🥩 Meat & seafood", "🥛 Dairy, eggs & tofu", "❄️ Frozen", "🥫 Pantry", "🧻 Household", "🐾 Pets", "🔧 Hardware & garden", "🛒 Other"];
const HOUSEHOLD = /toilet|tissue|paper towel|kitchen towel|napkin|detergent|dishwash|dish ?soap|laundry|softener|bin bag|garbage bag|rubbish bag|cling ?wrap|glad ?wrap|foil|baking paper|zip ?lock|sponge|scourer|shampoo|conditioner|body ?wash|toothpaste|toothbrush|floss|soap|deodorant|razor|nappies|wipes|cleaner|bleach|spray and wipe|hand ?wash|sunscreen|tampons|pads|cotton/i;
const PET_SHOP = /pet food|cat food|dog food|kibble|kitty litter|cat litter|litter|flea|tick treatment|wormer|worming|heartworm|dog treats?|cat treats?|chews?|pet premix|premix|taurine|pet shampoo|poo bags|scratching|collar|leash/i;
const HARDWARE = /potting mix|soil|mulch|fertili[sz]er|seedlings?|plants?\b|hose|screws?|nails?|paint|light ?bulbs?|batter(y|ies)|duct tape|glue|bbq gas|gas bottle|extension cord|garden|pots?\b|snail bait|weed/i;
const SEAFOOD = /fish|salmon|barramundi|snapper|cod\b|tuna|prawn|shrimp|squid|calamari|octopus|mussel|clam|scallop|crab|lobster|bug\b|oysters?(?! sauce)|鱼|虾|蟹|贝|蛤|鱿|海鲜|蚝(?!油)/i;
// Which shop? 1) where you moved it before  2) rules  3) first store in your list.
function guessStore(name) {
  const st = S().stores, n = String(name).trim().toLowerCase(), mem = DB.settings.storeMemory || {};
  const has = (x) => (st.includes(x) ? x : null);
  if (mem[n] && st.includes(mem[n])) return mem[n];
  const both = `${n} ${canon(n)}`, a = aisle(name);
  const role = (k) => has(S().storeRoles?.[k]) || st[0];
  if (a === "🔧 Hardware & garden") return role("hardware");
  if (a === "🐾 Pets") return role("pets");
  if (a === "🥩 Meat & seafood") return SEAFOOD.test(both) ? role("seafood") : role("meat");
  if (a === "🥬 Fruit & veg") return role("produce");
  return st[0];
}
const storeOf = (s) => (s.store && S().stores.includes(s.store) ? s.store : guessStore(s.item || s.name));
// What the chosen days need: missing things to buy + pantry things that several dishes lean on.
function shopNeeds() {
  const plan = currentWeek(), items = pantryItems(), staples = stapleSet();
  const buy = new Map(), shared = new Map();
  for (const date of shopDays()) {
    const day = plan.days[date], when = fmtDay(date).dow;
    for (const id of day.dishes) {
      const r = BYID[id]; if (!r) continue;
      const f = (day.servings || S().servings) / (noteOf(id).makes || r.serves || 2);
      const a = analyze(r, items, staples);
      for (const m of a.missing) {
        const key = [...buy.keys()].find((k) => same(k, m.k)) || m.k;
        const e = buy.get(key) || { name: m.n, k: m.k, amt: {}, for: [] };
        const am = amountFor(r, m, f); if (am) e.amt[am.unit] = (e.amt[am.unit] || 0) + am.q;
        e.for.push(`${when} ${dispName(r)}`); buy.set(key, e);
      }
      for (const h of a.have) {
        if (h.item.loc === "herbs") continue;
        const e = shared.get(h.item.id) || { item: h.item, for: [] }, tag = `${when} ${dispName(r)}`;
        if (!e.for.includes(tag)) e.for.push(tag); shared.set(h.item.id, e);
      }
    }
  }
  return { buy: [...buy.values()], shared: [...shared.values()].filter((e) => e.for.length > 1) };
}
function syncShopping() {
  if (!DB || !DB.plan) return { n: 0, pn: 0 };
  const dismissed = new Set(DB.plan.shopDismiss || []);
  const keep = DB.shopping.filter((s) => !s.plan || s.done);       // yours + already bought
  const kept = keep.filter((s) => !s.pet).map((s) => canon(s.item || s.name));
  const { buy } = shopNeeds();
  let n = 0;
  for (const e of buy) {
    if (dismissed.has(e.k) || kept.some((k) => same(k, e.k))) continue;
    const amt = Object.entries(e.amt).map(([u, q]) => `${fmtQ(q)}${u ? " " + u : ""}`).join(" + ");
    keep.push({ id: uid(), name: e.name, amt, done: false, for: e.for.join(", "), plan: true, k: e.k }); n++;
  }
  DB.shopping = keep;
  const due = petsDueThisWeek().filter((p) => { const d = petDue(p); return d === null || shopDays().length === 0 || d <= daysFrom(shopDays().slice(-1)[0]); });
  const pn = due.length ? addPetShopping(due) : 0;  // pet lines you added by hand stay
  return { n, pn };
}
function rebuildShopping() {
  DB.plan.shopDismiss = [];
  const { n, pn } = syncShopping();
  save("shopping", "plan"); render();
  toast(n || pn ? `${n} to buy for dinners${pn ? ` + ${pn} for pet batches` : ""}` : "Nothing missing 🎉");
}
function viewShopping() {
  const shop = DB.shopping, up = upcomingDays(), on = new Set(shopDays()), stores = S().stores;
  const { shared } = shopNeeds();
  const byStore = {};
  for (const x of shop) (byStore[storeOf(x)] ||= []).push(x);
  const aisleOf = (x) => (x.pet ? "🐾 Pets" : aisle(x.item || x.name));
  const shown = ui.store && byStore[ui.store] ? [ui.store] : stores.filter((st) => byStore[st]);
  const line = (x) => `<div class="list-item"><input type="checkbox" data-act="shoptick" data-id="${x.id}" ${x.done ? "checked" : ""}>
      <span class="grow ${x.done ? "done" : ""}"><span class="small" title="${esc(aisleOf(x))}">${aisleOf(x).split(" ")[0]}</span> ${esc(label(x.name))}${x.amt ? ` <b class="small">≈ ${esc(x.amt)}</b>` : ""} ${x.for ? `<span class="small muted">· ${esc(x.for)}</span>` : ""}</span>
      <select class="mv" data-act="shopstore" data-id="${x.id}" title="Buy at">${stores.map((st) => `<option ${storeOf(x) === st ? "selected" : ""}>${esc(st)}</option>`).join("")}</select>
      <button class="btn ghost sm" data-act="shoprm" data-id="${x.id}">✕</button></div>`;
  const left = (st) => (byStore[st] || []).filter((x) => !x.done).length;
  return `<div class="card"><div class="row spread"><h3>🛒 Shopping list</h3>
    <div class="row"><button class="btn sm" data-act="shopbuild" title="Rebuild from plan (brings back lines you removed)">↻ Refresh</button>
    <button class="btn sm" data-act="shopmove" ${shop.some((x) => x.done) ? "" : "disabled"}>Bought → pantry</button>
    <button class="btn sm" data-act="shopcopy">Copy</button>
    <button class="btn ghost sm" data-act="shopclear">Clear</button></div></div>
    <form class="row" data-form="shopadd" style="margin:8px 0"><input name="n" class="grow" placeholder="Add anything — toilet paper, cat litter, potting mix…" list="inglist">
      <select name="store"><option value="">Auto shop</option>${stores.map((st) => `<option>${esc(st)}</option>`).join("")}</select><button class="btn primary">Add</button></form>
    ${up.length ? `<div class="row small" style="margin:6px 0"><span class="muted">Dinners this shop covers:</span>${up.map((d) => `<button class="chip pick ${on.has(d) ? "on" : ""}" data-act="shopday" data-d="${d}">${fmtDay(d).dow} ${fmtDay(d).day}</button>`).join("")}</div>` : `<p class="small muted">Plan some dinners and their missing ingredients appear here by themselves.</p>`}
    ${shop.length ? `<div class="row small" style="margin:6px 0 4px"><span class="muted">Shopping at:</span>
      <button class="chip pick ${ui.store ? "" : "on"}" data-act="shopfilter" data-v="">All</button>
      ${stores.filter((st) => byStore[st]).map((st) => `<button class="chip pick ${ui.store === st ? "on" : ""}" data-act="shopfilter" data-v="${esc(st)}">${esc(st)} <span class="n">${left(st)}</span></button>`).join("")}</div>` : ""}
    ${shown.map((st) => `<div class="loc">🏬 ${esc(st)} (${left(st)})</div>${byStore[st].slice().sort((p, q) => p.done - q.done || AISLES.indexOf(aisleOf(p)) - AISLES.indexOf(aisleOf(q))).map(line).join("")}`).join("")}
    ${shop.length ? "" : `<p class="muted small">${up.length ? "You have everything for these dinners 🎉" : "Nothing to buy."}</p>`}
    ${shared.length ? `<details style="margin-top:10px"><summary class="small">⚖️ Check you have enough (${shared.length}) — used by more than one dinner</summary>
      ${shared.map((e) => `<div class="list-item small"><span class="grow">${esc(label(e.item.name))}${e.item.qty ? ` <span class="muted">· have ${esc(e.item.qty)}</span>` : ""} <span class="muted">· ${esc(e.for.join(", "))}</span></span>
        <button class="btn sm" data-act="shopaddname" data-v="${esc(e.item.name)}">+ buy more</button></div>`).join("")}</details>` : ""}
  </div>`;
}
function shopSummary() {
  const open = DB.shopping.filter((x) => !x.done), plan = open.filter((x) => x.plan).length;
  return `<div class="card row spread"><span>🛒 <b>${open.length}</b> to buy${plan ? ` · ${plan} for planned dinners` : ""}</span><button class="btn sm" data-act="tab" data-v="shop">Open shopping list →</button></div>`;
}
function viewShop() { return `<h2>Shopping</h2>${viewShopping()}${datalist()}`; }
// Where does it live? 1) what you taught it  2) word rules  3) fridge.
const LOCS = { fridge: "🧊 Fridge", freezer: "❄️ Freezer", pantry: "🥫 Pantry", herbs: "🌿 Herbs & garden" };
const HERBS = /basil|bay lea|spring onion|green onion|scallion|chives|parsley|coriander|cilantro|mint|rosemary|thyme|oregano|sage|dill|tarragon|lemon ?grass|curry lea|kaffir|makrut|lime lea|perilla|shiso|shallots?$|罗勒|九层塔|香叶|月桂|葱(?!头)|香菜|芫荽|薄荷|迷迭香|百里香|紫苏|香茅|韭菜|芹菜叶/i;
const LOC_RULES = {
  freezer: /\bfrozen\b|\bice cream\b|\bice\b|dumplings?|gyoza|wontons?|\bpastry\b|puff pastry|fish fingers|nuggets|冻|冰淇淋|雪糕|饺子|馄饨|汤圆|冰块/i,
  fridge: /fresh|milk|yog(h)?urt|cheese|butter|cream|egg|tofu|chicken|pork|beef|lamb|mince|bacon|ham|sausage|fish|salmon|prawn|shrimp|squid|mussel|crab|lettuce|spinach|bok choy|choy|kale|broccoli|cauliflower|cabbage|celery|zucchini|cucumber|capsicum|carrot|mushroom|bean ?sprouts|herbs?|coriander|parsley|basil|spring onion|shallot|berries|grapes|kimchi|leftover|鲜|奶|蛋|豆腐|肉|鸡|鸭|鱼|虾|蟹|贝|菜|菇|笋|芹|黄瓜|胡萝卜|豆芽|香菜|葱/i,
  pantry: /\brice\b|pasta|spaghetti|noodles|flour|sugar|salt|\boil\b|vinegar|sauce|soy|stock|\bcans?\b|tinned|\btins?\b|canned|beans|lentils|chickpeas|oats|cereal|bread|crackers|biscuits|nuts|seeds|honey|jam|peanut butter|tea|coffee|cocoa|spices?|pepper|cumin|paprika|cinnamon|star anise|bay lea|onions?|garlic|potato|sweet potato|pumpkin|banana|tomato paste|米|面|粉|油|酱|醋|糖|盐|料酒|干|罐头|八角|花椒|桂皮|香叶|蒜|洋葱|土豆|红薯|豆瓣|茶|咖啡/i,
};
// Raw meat / fish / seafood: freezer for keeping, fridge only if you'll cook it within a few days.
const RAW_PROTEIN = /chicken|pork|beef|lamb|mince|steak|ribs|fillet|duck|turkey|fish|salmon|barramundi|snapper|cod|tuna steak|prawn|shrimp|squid|calamari|octopus|mussel|clam|scallop|crab|lobster|meatball|肉|鸡(?!蛋|精|粉)|鸭(?!蛋)|鱼|虾|蟹|贝|蛤|鱿|排骨|丸子|牛|羊|猪(?!油)/i;
const NOT_RAW = /milk|yog|cheese|butter|cream|avocado|奶|乳|酪|牛油果|egg|stock|broth|sauce|powder|bouillon|floss|jerky|canned|tinned|蛋|汤|酱|粉|精|松|干/i;
function guessLoc(name, exp) {
  const n = name.trim().toLowerCase(), mem = DB.settings.locMemory || {};
  const zh = canon(n), both = `${n} ${zh}`;
  const raw = RAW_PROTEIN.test(both) && !NOT_RAW.test(both);
  const soon = exp && daysFrom(exp) <= 4;
  if (raw && soon) return "fridge";            // cooking it this week
  if (mem[n]) return mem[n];
  if (LOC_RULES.freezer.test(n)) return "freezer";
  if (HERBS.test(both) && !/sauce|paste|powder|oil|洋葱|酱|粉|油/.test(both)) return "herbs";
  if (/stock|sauce|paste|powder|canned|tinned|\bcans?\b|dried|coconut (milk|cream)|椰浆|^(brown |red |white )?onions?$|garlic|potato|pumpkin|粉|酱|干|罐头|洋葱|蒜|土豆|红薯/.test(both) && !/spring onion|green onion|chives|fresh|韭/.test(n)) return "pantry";
  if (raw) return "freezer";
  if (LOC_RULES.fridge.test(both)) return "fridge";
  if (LOC_RULES.pantry.test(both) || DRY_WORDS.some((w) => zh.includes(w))) return "pantry";
  return "fridge";
}
// One-time: learn the spots you chose by hand. The old auto-place only knew pantry/fridge,
// so anything that differs from what it would have picked was your decision.
function seedLocMemory() {
  if (DB.settings.locSeeded) return;
  const oldAuto = (name) => (DRY_WORDS.some((w) => canon(name).includes(w)) ? "pantry" : "fridge");
  const mem = { ...(DB.settings.locMemory || {}) };
  for (const p of DB.pantry) { const k = p.name.trim().toLowerCase(); if (!mem[k] && p.loc !== oldAuto(p.name)) mem[k] = p.loc; }
  DB.settings.locMemory = mem; DB.settings.locSeeded = true; save("settings");
}
function learnLoc(name, loc) { DB.settings.locMemory = { ...(DB.settings.locMemory || {}), [name.trim().toLowerCase()]: loc }; return save("settings"); }

// ---------- views ----------
function render() {
  $$("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === TAB));
  const v = $("#view");
  v.innerHTML = ({ week: viewWeek, pantry: viewPantry, shop: viewShop, recipes: viewRecipes, pets: viewPets, settings: viewSettings })[TAB]();
}

function dueBanners() {
  const out = [];
  const soon = pantryItems().filter((p) => p.left !== null && p.left <= 2).sort((a, b) => a.left - b.left);
  if (soon.length) out.push(`<div class="banner warn"><b>Use soon:</b> ${soon.map((p) => `<span class="chip ${p.left < 0 ? "bad" : "warn"}">${esc(label(p.name))} · ${p.left < 0 ? "expired" : p.left === 0 ? "today" : p.left + "d"}</span>`).join(" ")}</div>`);
  const wk = DB.plan && currentWeek();
  for (const [off, when] of [[0, "today"], [1, "tomorrow"]]) {
    const day = wk?.days?.[addDays(today(), off)]; if (!day || day.cooked) continue;
    for (const id of day.dishes) {
      const r = BYID[id]; if (!r) continue;
      const frozen = [...new Set(analyze(r).have.filter((h) => h.item.loc === "freezer" && !DB.pantry.some((q) => q.loc !== "freezer" && same(canon(q.name), h.item.k))).map((h) => h.item.name))];
      if (frozen.length) out.push(`<div class="banner info">❄️ <b>${off ? "Thaw tonight" : "Thaw now"}</b> for ${when}'s ${esc(dispName(r))}: ${frozen.map((n) => `<span class="chip">${esc(label(n))}</span>`).join(" ")} — move to the fridge.</div>`);
    }
  }
  for (const p of DB.pets) {
    const due = petDue(p);
    if (due !== null && due <= 2) out.push(`<div class="banner info">🐾 <b>${esc(p.name)}</b>'s food batch ${due < 0 ? `overdue by ${-due}d` : due === 0 ? "due today" : `due in ${due}d`}. <button class="btn sm" data-act="tab" data-v="pets">Plan batch</button></div>`);
  }
  return out.join("");
}

function viewWeek() {
  const plan = currentWeek();
  const st = S();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(plan.weekOf, i), f = fmtDay(date), day = plan.days[date];
    const isToday = date === today();
    if (!day) {
      const prev = plan.days[addDays(date, -1)];
      const left = prev && prev.servings > 2 ? `Leftovers: ${esc(prev.dishes.map((id) => BYID[id]?.name).join(" + "))}` : "No cooking — leftovers, freezer or eat out";
      days.push(`<div class="card day off" data-day="${date}"><div class="d"><span class="small muted">${f.dow}</span><b>${f.day}</b></div><div class="row spread"><span class="muted">${left}</span><button class="btn sm" data-act="addcook" data-d="${date}">+ Cook</button></div></div>`);
      continue;
    }
    const dishes = day.dishes.map((id, j) => {
      const r = BYID[id];
      if (!r) return `<div class="dish muted">Recipe removed</div>`;
      const a = analyze(r);
      return `<div class="dish">
        <div class="row spread"><span class="name" data-act="open" data-id="${esc(id)}">${isFav(id) ? `<span class="favmark">♥</span> ` : ""}${esc(dispName(r))}</span>
          <span class="row">${day.cooked ? "" : `<button class="btn ghost sm" data-act="swap" data-d="${date}" data-i="${j}" title="Swap">↻ swap</button>`}
          <a class="btn ghost sm" href="${esc(aiurUrl(r) || "#")}" target="_blank" rel="noopener">recipe ↗</a></span></div>
        <div class="row small muted">${esc(r.cat)} · ${esc(r.protein)}${r.stars ? " · " + "★".repeat(r.stars) : ""}
          · have ${a.have.length}/${a.ess}${a.missing.length ? ` · need: ${a.missing.slice(0, 4).map((m) => esc(label(m.n))).join(", ")}${a.missing.length > 4 ? "…" : ""}` : " ✓"}</div>
      </div>`;
    }).join("");
    const lunch = day.servings > 2 ? `<span class="chip plain">→ ${day.servings - 2} lunch portion${day.servings - 2 > 1 ? "s" : ""} for ${fmtDay(addDays(date, 1)).dow}</span>` : "";
    const movable = !day.cooked && daysFrom(date) >= 0;
    days.push(`<div class="card day ${isToday ? "today" : ""}" data-day="${date}" style="${isToday ? "border-color:var(--accent)" : ""}">
      <div class="d"><span class="small muted">${f.dow}</span><b>${f.day}</b>${isToday ? `<span class="chip">today</span>` : ""}
        ${movable ? `<span class="grip" data-drag="${date}" title="Drag onto another day to swap">⠿</span>` : ""}</div>
      <div>${dishes}
        <div class="row" style="margin-top:8px">
          <select data-act="servings" data-d="${date}" title="Servings">${[2, 3, 4, 5, 6].map((n) => `<option ${n === day.servings ? "selected" : ""} value="${n}">${n} serves</option>`).join("")}</select>
          ${lunch}
          ${day.cooked ? `<span class="chip good">✓ cooked</span>` : `
            <button class="btn sm" data-act="lock" data-d="${date}">${day.locked ? "🔒 locked" : "🔓 lock"}</button>
            <button class="btn sm primary" data-act="cooked" data-d="${date}">Cooked it</button>`}
          <button class="btn ghost sm" data-act="rmday" data-d="${date}" title="Remove">✕</button>
        </div></div></div>`);
  }
  const shop = DB.shopping;
  const nextWeek = daysFrom(addDays(plan.weekOf, 6)) < 0;
  return `${dueBanners()}
  <div class="row spread"><h2>Week of ${fmtDay(plan.weekOf).day} ${fmtDay(plan.weekOf).mon}</h2>
    <div class="row">
      <button class="btn" data-act="weeknav" data-v="-7">‹</button><button class="btn" data-act="weeknav" data-v="7">›</button>
      <button class="btn primary" data-act="gen">${Object.keys(plan.days).length ? "↻ Reshuffle" : "✨ Suggest week"}</button>
    </div></div>
  ${nextWeek ? `<div class="banner info">This week is over. <button class="btn sm" data-act="weeknav" data-v="7">Start next week</button></div>` : ""}
  ${!DB.pantry.length ? `<div class="banner info">Tip: add what's in your fridge &amp; pantry first — suggestions use up what you have (expiring items first). <button class="btn sm" data-act="tab" data-v="pantry">Add food</button></div>` : ""}
  <p class="small muted">Cooking ${st.cookDays.length} nights · ${st.servings} serves each (2 dinner + ${st.servings - 2} lunch) · locked &amp; cooked days stay put on reshuffle · drag ⠿ onto another day to swap.</p>
  ${days.join("")}
  ${DB.pets.length ? `<div class="card"><div class="row spread"><h3>🐾 Pet batches</h3><button class="btn sm" data-act="tab" data-v="pets">Change</button></div>
    ${DB.pets.map((p) => { const b = batchFor(p), d = petDue(p), when = d === null ? "first batch — any day" : d < 0 ? `overdue ${-d}d` : d === 0 ? "today" : `${fmtDay(addDays(today(), d)).dow} ${fmtDay(addDays(today(), d)).day}`;
      const thisWeek = petsDueThisWeek().includes(p);
      return `<div class="list-item"><span class="grow">${p.species === "cat" ? "🐱" : "🐶"} <b>${esc(p.name)}</b> · ${esc(b?.r.name || "no recipe")} · ${b ? Math.round(b.total / 100) / 10 + " kg batch" : ""}</span>
        <span class="chip ${thisWeek ? "warn" : "plain"}">${thisWeek ? "cook: " : "next: "}${esc(when)}</span>
        ${b ? `<span class="small muted">${Math.round(petCoverage(b.r) * 100)}% in stock</span>` : ""}</div>`; }).join("")}
    <p class="small muted">Batches due within your shopping days are added to the list automatically.</p></div>` : ""}
  ${shopSummary()}
  ${datalist()}`;
}

let _dl = "";
function datalist() {
  if (!_dl) {
    const names = new Set(Object.keys(ALIAS));
    for (const r of BASE) for (const i of r.ings) names.add(i.n);
    _dl = `<datalist id="inglist">${[...names].map((n) => `<option value="${esc(n)}">`).join("")}</datalist>`;
  }
  return _dl;
}

function viewPantry() {
  const items = pantryItems();
  const groups = LOCS;
  const sec = Object.entries(groups).map(([loc, title]) => {
    const list = items.filter((p) => p.loc === loc).sort((a, b) => (a.left ?? 999) - (b.left ?? 999) || a.name.localeCompare(b.name));
    return `<div class="loc">${title} (${list.length})</div>` + (list.map((p) => `<div class="list-item">
      <span class="grow"><b>${esc(label(p.name))}</b> ${p.qty ? `<span class="muted small">· ${esc(p.qty)}</span>` : ""}</span>
      ${p.left === null ? "" : `<span class="chip ${p.left < 0 ? "bad" : p.left <= 2 ? "warn" : "plain"}">${p.left < 0 ? "expired" : p.left === 0 ? "today" : p.left + "d left"}</span>`}
      <select class="mv" data-act="pmove" data-id="${p.id}" title="Move to">${Object.entries(LOCS).map(([v, t]) => `<option value="${v}" ${p.loc === v ? "selected" : ""}>${t}</option>`).join("")}</select>
      <button class="btn ghost sm" data-act="pedit" data-id="${p.id}">edit</button>
      <button class="btn ghost sm" data-act="prm" data-id="${p.id}">✕</button></div>`).join("") || `<p class="small muted">Nothing here.</p>`);
  }).join("");
  return `${dueBanners()}<h2>Fridge &amp; pantry</h2>
  <div class="card"><form data-form="padd">
    <div class="row"><input name="n" class="grow" placeholder="e.g. eggs, 鸡腿, tomato" list="inglist" required autocomplete="off">
      <select name="loc"><option value="auto">Auto place</option>${Object.entries(LOCS).map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select></div>
    <div class="row" style="margin-top:8px"><input name="qty" placeholder="Amount (optional)" style="width:140px">
      <label class="small muted">Use by <input type="date" name="exp"></label>
      <span class="chips">${[2, 4, 7].map((d) => `<button type="button" class="chip pick" data-act="expset" data-v="${d}">+${d}d</button>`).join("")}</span>
      <span class="grow"></span><button class="btn primary">Add</button></div>
    <p class="small muted">English or 中文 both work. Separate several with commas: <i>eggs, tomato, 豆腐</i>. Seasonings like salt, soy sauce, oil are assumed (edit in Settings).</p>
  </form></div>
  <div class="row spread"><span class="muted small">${items.length} items</span><button class="btn" data-act="cooknow">What can I cook now? →</button></div>
  <div class="card">${sec}</div>${datalist()}`;
}

const TIPS = [[1, "How to decide what to eat"], [3, "Kitchen preparation"], [20, "Using a knife"], [8, "Learning to cook"], [10, "Stir-fry & pan-fry"],
  [11, "Blanching"], [17, "Steaming"], [13, "Cold dishes"], [15, "Pickles"], [9, "Deodorizing (fishy smells)"], [7, "Judging oil temperature"],
  [5, "Caramelization"], [6, "Auxiliary ingredients"], [12, "Microwave"], [16, "Air fryer"], [14, "Pressure cooker"], [18, "Food safety"],
  [19, "Washing dishes"], [4, "Advanced terms"]];
const tipUrl = (n) => `https://howtocook.aiursoft.com/Culture/Set?culture=${LANG}&returnUrl=${encodeURIComponent("/Tips/Detail/" + n)}`;
const KCAL = { low: ["Light (<300 kcal)", (k) => k && k < 300], mid: ["Medium (300–700)", (k) => k >= 300 && k <= 700], high: ["Hearty (>700)", (k) => k > 700] };
const QUICK = { fav: "♥ Favorites", ready: "✓ Can make now", cooked: "Cooked before", mine: "My own recipes", hidden: "Hidden" };
function railLink(key, val, text, n) {
  const on = ui[key] === val;
  return `<button class="rl ${on ? "on" : ""}" data-act="rail" data-k="${key}" data-v="${esc(on ? "" : val)}"><span>${text}</span>${n != null ? `<span class="n">${n}</span>` : ""}</button>`;
}
function viewRecipes() {
  const items = pantryItems(), staples = stapleSet();
  const q = ui.q.trim().toLowerCase(), qk = canon(q);
  const all = RECIPES.map((r) => ({ r, a: analyze(r, items, staples) }));
  const visible = all.filter((x) => !hidden(x.r.id));
  const quickTest = { fav: (x) => isFav(x.r.id), ready: (x) => x.a.ess && x.a.cov >= 0.6, cooked: (x) => noteOf(x.r.id).cooks.length > 0, mine: (x) => x.r.custom, hidden: (x) => hidden(x.r.id) };
  let list = ui.quick === "hidden" ? all.filter(quickTest.hidden) : visible;
  if (ui.quick && ui.quick !== "hidden") list = list.filter(quickTest[ui.quick]);
  if (ui.cat) list = list.filter((x) => x.r.cat === ui.cat);
  if (ui.prot) list = list.filter((x) => x.r.protein === ui.prot);
  if (ui.stars !== "") list = list.filter((x) => String(x.r.stars || 0) === ui.stars);
  if (ui.kcal) list = list.filter((x) => KCAL[ui.kcal][1](x.r.kcal));
  if (ui.ing) { const k = canon(ui.ing); list = list.filter((x) => x.r.ings.some((i) => same(canon(i.n), k))); }
  if (q) list = list.filter((x) => x.r.name.toLowerCase().includes(q) || (x.r.en || "").toLowerCase().includes(q) || x.r.ings.some((i) => same(i.k, qk)) || (x.r.desc || "").includes(q));
  const m = (x) => x.a.cov * Math.min(1, x.a.ess / 4) + x.a.have.length * 0.05;
  const sorts = {
    match: (x, y) => m(y) - m(x) || x.a.missing.length - y.a.missing.length,
    fav: (x, y) => isFav(y.r.id) - isFav(x.r.id) || m(y) - m(x),
    easy: (x, y) => (x.r.stars || 9) - (y.r.stars || 9),
    rated: (x, y) => (avgRating(y.r.id) || 0) - (avgRating(x.r.id) || 0),
    cooked: (x, y) => noteOf(y.r.id).cooks.length - noteOf(x.r.id).cooks.length,
    kcalAsc: (x, y) => (x.r.kcal || 1e9) - (y.r.kcal || 1e9),
    kcalDesc: (x, y) => (y.r.kcal || 0) - (x.r.kcal || 0),
    name: (x, y) => dispName(x.r).localeCompare(dispName(y.r), LANG.slice(0, 2)),
  };
  list.sort(sorts[ui.sort] || sorts.match);
  const count = (f) => visible.filter(f).length;
  const cats = ["Meat", "Veg", "Seafood", "Soup", "Staple", "Breakfast", "Dessert", "Drink", "Sauce", "Semi-prepared"];
  const prots = ["Chicken", "Pork", "Beef", "Lamb", "Seafood", "Tofu/Egg", "Veg"];
  const pantryNames = [...new Set(DB.pantry.map((p) => p.name))].sort();
  const active = ["quick", "cat", "prot", "stars", "kcal", "ing"].filter((k) => ui[k] !== "");
  const rail = `<aside class="rail card ${ui.rail ? "open" : ""}">
    <div class="rh">Quick</div>
    ${Object.entries(QUICK).map(([k, t]) => railLink("quick", k, t, k === "hidden" ? all.filter(quickTest.hidden).length : count(quickTest[k]))).join("")}
    <div class="rh">Category</div>${cats.map((c) => railLink("cat", c, c, count((x) => x.r.cat === c))).join("")}
    <div class="rh">Main protein</div>${prots.map((c) => railLink("prot", c, c, count((x) => x.r.protein === c))).join("")}
    <div class="rh">Difficulty</div>${[1, 2, 3, 4, 5].map((n) => railLink("stars", String(n), "★".repeat(n) + `<span class="dim">${"★".repeat(5 - n)}</span>`, count((x) => x.r.stars === n))).join("")}
    <div class="rh">Calories</div>${Object.entries(KCAL).map(([k, [t, f]]) => railLink("kcal", k, t, count((x) => f(x.r.kcal)))).join("")}
    ${pantryNames.length ? `<div class="rh">Uses what I have</div>${pantryNames.map((n) => { const k = canon(n); return railLink("ing", n, esc(label(n)), count((x) => x.r.ings.some((i) => same(canon(i.n), k)))); }).join("")}` : ""}
    <div class="rh">Kitchen tips ↗</div>${TIPS.map(([n, t]) => `<a class="rl" href="${esc(tipUrl(n))}" target="_blank" rel="noopener">${t}</a>`).join("")}
  </aside>`;
  return `<div class="row spread"><h2>Recipes</h2><button class="btn primary" data-act="newrecipe">+ Add recipe (link, video or text)</button></div>
  <div class="card row">
    <button class="btn railbtn" data-act="railtoggle">☰ Filters${active.length ? ` (${active.length})` : ""}</button>
    <input id="rq" class="grow" placeholder="Search name or ingredient (egg / 鸡蛋)" value="${esc(ui.q)}" list="inglist">
    <select id="rsort">${Object.entries({ match: "Best pantry match", fav: "Favorites first", rated: "My top rated", cooked: "Most cooked", easy: "Easiest", kcalAsc: "Lowest calories", kcalDesc: "Highest calories", name: "Name" }).map(([k, v]) => `<option value="${k}" ${ui.sort === k ? "selected" : ""}>${v}</option>`).join("")}</select>
  </div>
  <div class="rwrap">${rail}<div>
  <p class="small muted">${list.length} recipes${active.length ? ` · ${active.map((k) => `<span class="chip">${esc(k === "quick" ? QUICK[ui.quick] : k === "kcal" ? KCAL[ui.kcal][0] : k === "stars" ? "★".repeat(+ui.stars) || "no rating" : k === "ing" ? label(ui.ing) : ui[k])} <button data-act="rail" data-k="${k}" data-v="">×</button></span>`).join(" ")} <button class="btn ghost sm" data-act="railclear">clear</button>` : ""} · source: <a href="https://github.com/Anduin2017/HowToCook" target="_blank" rel="noopener">HowToCook</a></p>
  <div class="grid">${list.slice(0, ui.limit).map(({ r, a }) => {
    const avg = avgRating(r.id), n = noteOf(r.id).cooks.length, fav = isFav(r.id);
    return `<div class="card r-card ${fav ? "fav" : ""}" data-act="open" data-id="${esc(r.id)}">
      ${r.img ? `<img class="thumb" src="${esc(r.img)}" alt="" loading="lazy">` : ""}
      <button class="heart ${fav ? "on" : ""} ${r.img ? "over" : ""}" data-act="fav" data-id="${esc(r.id)}" title="${fav ? "Remove from favorites" : "Add to favorites"}">${fav ? "♥" : "♡"}</button>
      <div class="row spread"><span class="t">${esc(dispName(r))}${subName(r) ? ` <span class="small muted">${esc(subName(r))}</span>` : ""}</span>${r.custom ? `<span class="chip good">mine</span>` : ""}</div>
      <div class="small muted">${esc(r.cat)} · ${esc(r.protein)}${r.stars ? " · " + "★".repeat(r.stars) : ""}${r.kcal ? ` · ${r.kcal} kcal` : ""}${avg ? ` · ⭐${avg.toFixed(1)} (${n}×)` : ""}</div>
      <div class="bar" style="margin:8px 0 4px"><i style="width:${Math.round(a.cov * 100)}%"></i></div>
      <div class="small muted">${a.ess ? `have ${a.have.length}/${a.ess}` : "no main ingredients listed"}${a.missing.length ? " · need " + a.missing.slice(0, 3).map((m) => esc(label(m.n))).join(", ") + (a.missing.length > 3 ? "…" : "") : ""}</div>
    </div>`;
  }).join("")}</div>
  ${list.length > ui.limit ? `<p style="text-align:center"><button class="btn" data-act="more">Show more</button></p>` : ""}</div></div>${datalist()}`;
}

// ---------- recipe detail ----------
function scaleQty(q, f) {
  if (f === 1 || !q) return q;
  return String(q).replace(/(\d+(?:\.\d+)?)(?:\/(\d+))?/g, (_, a, b) => {
    let v = (b ? a / b : +a) * f;
    return v >= 20 ? String(Math.round(v)) : String(Math.round(v * 10) / 10);
  });
}
function openRecipe(id, target) {
  const r = BYID[id]; if (!r) return;
  const n = noteOf(id), st = S();
  const base = n.makes || r.serves || 2;
  const want = target || st.servings;
  const f = want / base;
  const a = analyze(r);
  const ingRow = (i, cls, tag) => `<span class="chip ${cls}" title="${esc(tag)}">${esc(label(i.n))}${i.swapped ? ` <s class="small">${esc(i.swapped)}</s>` : ""}</span>`;
  const cooks = n.cooks.slice().reverse();
  const planDays = Object.keys(currentWeek().days).sort();
  openModal(`
    <div class="small muted">${esc(r.cat)} · ${esc(r.protein)}${r.stars ? " · difficulty " + "★".repeat(r.stars) : ""}${r.kcal ? ` · ~${r.kcal} kcal` : ""}</div>
    ${r.img ? `<img class="hero" src="${esc(r.img)}" alt="">` : ""}
    <h2 style="margin:4px 0 2px">${esc(dispName(r))}</h2>${subName(r) ? `<div class="muted">${esc(subName(r))}</div>` : ""}
    ${r.desc && (LANG === "zh-CN" || r.custom) ? `<p class="muted">${esc(r.desc)}</p>` : ""}
    <div class="row" style="margin-top:8px">${r.url ? `<a class="btn primary" href="${esc(aiurUrl(r))}" target="_blank" rel="noopener">${r.aid ? "Open on HowToCook site ↗" : "Open full recipe ↗"}</a>` : ""}
      ${r.aid ? `<a class="btn ghost sm" href="${esc(r.url)}" target="_blank" rel="noopener">GitHub source ↗</a>` : ""}
      <button class="btn ${isFav(id) ? "favbtn" : ""}" data-act="fav" data-id="${esc(id)}" data-m="1">${isFav(id) ? "♥ Favorite" : "♡ Favorite"}</button>
      <button class="btn" data-act="update" data-id="${esc(id)}">✏️ Update this recipe</button>
      ${r.custom ? `<button class="btn" data-act="editcustom" data-id="${esc(id)}">Edit</button><button class="btn ghost" data-act="delcustom" data-id="${esc(id)}">Delete</button>` : ""}</div>
    ${n.cooks.length || n.tips?.length || Object.keys(n.swaps || {}).length ? `<div class="mine">
      <b>Your version</b>${avgRating(id) ? ` · ⭐ ${avgRating(id).toFixed(1)}` : ""} · cooked ${n.cooks.length}×${n.lunch ? ` · leftovers: ${esc(n.lunch)}` : ""}${n.again ? ` · again: ${esc(n.again)}` : ""}
      ${Object.keys(n.swaps || {}).length ? `<div class="small">Swaps: ${Object.entries(n.swaps).map(([k, v]) => `${esc(k)} → ${v ? esc(v) : "<i>skip</i>"}`).join(" · ")}</div>` : ""}
      ${(n.tips || []).length ? `<ul class="small" style="margin:6px 0 0;padding-left:18px">${n.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
    </div>` : ""}
    <h3 style="margin-top:14px">Ingredients vs your kitchen</h3>
    <div class="chips">${a.have.map((i) => ingRow(i, "good", "in stock")).join("")}${a.missing.map((i) => ingRow(i, "bad", "need to buy")).join("")}${a.optional.map((i) => ingRow(i, "plain", "optional")).join("")}${a.staple.map((i) => ingRow(i, "plain", "staple")).join("")}</div>
    <p class="small muted">green = have · red = buy · grey = optional/staples</p>
    ${a.missing.length ? `<button class="btn sm" data-act="addmissing" data-id="${esc(id)}">Add ${a.missing.length} missing to shopping</button>` : ""}
    ${r.table?.length ? `<h3 style="margin-top:14px">Amounts</h3>
      <div class="row small"><span>Scale to</span>${[1, 2, 3, 4, 6].map((s) => `<button class="chip pick ${s === want ? "on" : ""}" data-act="scale" data-id="${esc(id)}" data-v="${s}">${s}</button>`).join("")}
      <span class="muted">base ≈ ${base} serve${base > 1 ? "s" : ""}${n.makes ? " (from your log)" : r.serves ? "" : " (guessed)"}</span></div>
      <table style="margin-top:6px"><tr><th>Ingredient</th><th>Amount ×${Math.round(f * 100) / 100}</th></tr>
      ${r.table.map(([nm, q, u]) => `<tr><td>${esc(nm)}</td><td>${esc(scaleQty(q, f))} ${esc(u)}</td></tr>`).join("")}</table>` : ""}
    <div class="row spread" style="margin-top:14px"><h3 style="margin:0">Steps</h3>
      ${LANG !== "zh-CN" && r.aid ? `<span class="row"><button class="chip pick" data-act="steps" data-id="${esc(id)}" data-v="tr">${esc(LANGS[LANG])}</button><button class="chip pick" data-act="steps" data-id="${esc(id)}" data-v="orig">原文</button></span>` : ""}</div>
    <div id="steps" class="md"></div>
    <h3 style="margin-top:14px">Plan it</h3>
    <div class="row">${[0, 1, 2, 3, 4, 5, 6].map((i) => { const d = addDays(currentWeek().weekOf, i); return `<button class="chip pick ${planDays.includes(d) ? "" : ""}" data-act="plancook" data-id="${esc(id)}" data-d="${d}">${fmtDay(d).dow} ${fmtDay(d).day}${currentWeek().days[d] ? " +" : ""}</button>`; }).join("")}</div>
    ${cooks.length ? `<h3 style="margin-top:14px">Cook log</h3>${cooks.map((c) => `<div class="small list-item"><span class="grow">${esc(c.date)} · ${c.rating ? "⭐".repeat(c.rating) : ""} ${c.taste?.length ? "· " + esc(c.taste.join(", ")) : ""} ${c.notes ? "· " + esc(c.notes) : ""}</span></div>`).join("")}` : ""}
  `);
  fillSteps(r);
}

// ---------- wizard engine ----------
function wizard({ title, steps, answers = {}, onDone }) {
  let i = 0;
  const vis = () => steps.filter((s) => !s.when || s.when(answers));
  const opts = (s) => (typeof s.options === "function" ? s.options(answers) : s.options) || [];
  function draw() {
    const vs = vis(), s = vs[i];
    const val = answers[s.id] ?? (s.default ? s.default(answers) : undefined);
    let body = "";
    if (s.type === "choice") body = `<div class="chips">${opts(s).map((o) => `<button class="chip pick ${val === o.v ? "on" : ""}" data-w="pick" data-v="${esc(o.v)}">${esc(o.l)}</button>`).join("")}</div>`;
    if (s.type === "multi") body = `<div class="chips">${opts(s).map((o) => `<button class="chip pick ${(val || []).includes(o.v) ? "on" : ""}" data-w="toggle" data-v="${esc(o.v)}">${esc(o.l)}</button>`).join("")}</div>`;
    if (s.type === "text") body = s.long ? `<textarea id="wv" placeholder="${esc(s.ph || "")}">${esc(val || "")}</textarea>` : `<input id="wv" style="width:100%" placeholder="${esc(s.ph || "")}" value="${esc(val || "")}" ${s.list ? 'list="inglist"' : ""}>`;
    if (s.type === "number") body = `<div class="row"><input id="wv" type="number" step="${s.step || 1}" min="0" value="${esc(val ?? "")}" style="width:120px"> <span class="muted">${esc(s.unit || "")}</span></div>
      ${s.quick ? `<div class="chips" style="margin-top:8px">${s.quick.map((q) => `<button class="chip pick ${+val === q ? "on" : ""}" data-w="num" data-v="${q}">${q}</button>`).join("")}</div>` : ""}`;
    if (s.type === "stars") body = `<div class="stars">${[1, 2, 3, 4, 5].map((n) => `<button data-w="pick" data-v="${n}" class="${val >= n ? "on" : ""}">★</button>`).join("")}</div>`;
    if (s.type === "checks") body = opts(s).map((o) => `<label class="list-item"><input type="checkbox" class="wc" value="${esc(o.v)}" ${(val || []).includes(o.v) ? "checked" : ""}><span class="grow">${esc(o.l)}</span></label>`).join("") || `<p class="muted">Nothing to pick.</p>`;
    if (s.type === "swaps") body = opts(s).map((o) => { const cur = (val || {})[o.v]; return `<div class="list-item"><label class="grow"><input type="checkbox" class="ws" value="${esc(o.v)}" ${cur !== undefined ? "checked" : ""}> ${esc(label(o.v))}</label>
      <input class="wsr" data-for="${esc(o.v)}" placeholder="used instead (blank = skipped)" value="${esc(cur || "")}" list="inglist" style="width:52%"></div>`; }).join("");
    if (s.type === "date") body = `<input id="wv" type="date" value="${esc(val || today())}">`;
    $("#modalBody").innerHTML = `<div class="wiz-step">${esc(title)} · ${i + 1} of ${vs.length}</div>
      <div class="wiz-q">${esc(typeof s.q === "function" ? s.q(answers) : s.q)}</div>
      ${s.help ? `<div class="muted small">${esc(typeof s.help === "function" ? s.help(answers) : s.help)}</div>` : ""}
      <div class="wiz-body">${body}</div>
      <div class="row spread"><button class="btn" data-w="back" ${i ? "" : "disabled"}>Back</button>
        <span class="row">${s.optional !== false ? `<button class="btn ghost" data-w="skip">Skip</button>` : ""}
        <button class="btn primary" data-w="next">${i === vs.length - 1 ? "Save" : "Next"}</button></span></div>${datalist()}`;
    const inp = $("#wv"); if (inp) { inp.focus(); inp.onkeydown = (e) => { if (e.key === "Enter" && inp.tagName === "INPUT") { e.preventDefault(); next(); } }; }
  }
  function collect() {
    const s = vis()[i];
    if (["text", "date"].includes(s.type)) answers[s.id] = $("#wv").value.trim();
    if (s.type === "number") answers[s.id] = $("#wv").value === "" ? undefined : +$("#wv").value;
    if (s.type === "checks") answers[s.id] = $$(".wc").filter((c) => c.checked).map((c) => c.value);
    if (s.type === "swaps") { const o = {}; $$(".ws").forEach((c) => { if (c.checked) o[c.value] = $(`.wsr[data-for="${CSS.escape(c.value)}"]`).value.trim(); }); answers[s.id] = o; }
  }
  function next() {
    collect();
    const s = vis()[i];
    if (s.optional === false && (answers[s.id] === undefined || answers[s.id] === "")) return toast("Please answer this one");
    if (i < vis().length - 1) { i++; draw(); } else { closeModal(); onDone(answers); }
  }
  $("#modalBody").oninput = (e) => { // typing a replacement ticks the row
    if (e.target.classList.contains("wsr")) { const c = $(`.ws[value="${CSS.escape(e.target.dataset.for)}"]`); if (c) c.checked = true; }
  };
  $("#modalBody").onclick = (e) => {
    const b = e.target.closest("[data-w]"); if (!b) return;
    const s = vis()[i], w = b.dataset.w;
    if (w === "back") { collect(); i--; draw(); }
    if (w === "skip") { delete answers[s.id]; if (i < vis().length - 1) { i++; draw(); } else { closeModal(); onDone(answers); } }
    if (w === "next") next();
    if (w === "pick") { answers[s.id] = s.type === "stars" ? +b.dataset.v : b.dataset.v; draw(); if (s.auto !== false) setTimeout(next, 120); }
    if (w === "toggle") { const arr = new Set(answers[s.id] || []); arr.has(b.dataset.v) ? arr.delete(b.dataset.v) : arr.add(b.dataset.v); answers[s.id] = [...arr]; draw(); }
    if (w === "num") { answers[s.id] = +b.dataset.v; draw(); }
  };
  $("#modal").hidden = false; draw();
}

// ---------- "update a recipe" interview ----------
const TASTE = [["perfect", "Perfect as is"], ["salty", "Too salty"], ["bland", "Too bland"], ["sweet", "Too sweet"], ["spicy", "Too spicy"], ["mild", "Not spicy enough"], ["oily", "Too oily"], ["dry", "Dry / overcooked"], ["raw", "Undercooked"], ["long", "Took too long"]];
const TASTE_FIX = { salty: "Cut salt/soy sauce ~25%", bland: "Add ~25% more seasoning, taste before serving", sweet: "Halve the sugar", spicy: "Use half the chili", mild: "Add more chili / 花椒", oily: "Use ~⅓ less oil", dry: "Shorten cook time, check earlier", raw: "Cook a few minutes longer / smaller pieces", long: "Prep ahead (chop / marinate the night before)" };
function updateRecipe(id, planDate) {
  const r = BYID[id]; if (!r) return;
  const pantryUsed = (x) => {
    const items = pantryItems(), sw = x.swaps || noteOf(id).swaps || {}, out = [];
    for (const i of r.ings) {
      const n = i.n in sw ? sw[i.n] : i.n; if (!n) continue;
      const it = findItem(canon(n), items); if (it && !out.includes(it)) out.push(it);
    }
    return out.filter((it) => !stapleSet().has(it.k) && it.loc !== "herbs");
  };
  const servedDefault = planDate ? currentWeek().days[planDate]?.servings : S().servings;
  wizard({
    title: `Update · ${r.name}`,
    steps: [
      { id: "date", type: "date", q: "When did you cook it?", optional: false },
      { id: "followed", type: "choice", q: "Did you follow the recipe as written?", optional: false,
        options: [{ v: "exact", l: "Yes, exactly" }, { v: "small", l: "Mostly — small changes" }, { v: "big", l: "Changed a lot" }] },
      { id: "swaps", type: "swaps", q: "Which ingredients did you swap or skip?", help: "Tick each one you changed. Write what you used instead, or leave blank if you left it out. Future suggestions will use your version.",
        when: (x) => x.followed && x.followed !== "exact", options: () => r.ings.map((i) => ({ v: i.n })), default: () => ({ ...(noteOf(id).swaps || {}) }) },
      { id: "added", type: "text", q: "Did you add anything that isn't in the recipe?", ph: "e.g. mushrooms, a splash of black vinegar", when: (x) => x.followed && x.followed !== "exact", list: true },
      { id: "method", type: "text", long: true, q: "Did amounts, heat or timing change?", ph: "e.g. halved the sugar; simmered 40 min instead of 30; air-fried 200°C 15 min", when: (x) => x.followed && x.followed !== "exact" },
      { id: "makes", type: "number", q: "How many servings did it make?", help: "Adult portions. We learn this to scale amounts for 2–4 next time.", quick: [1, 2, 3, 4, 5, 6], unit: "serves", default: () => servedDefault },
      { id: "taste", type: "multi", q: "How was the taste?", help: "Pick all that apply.", options: TASTE.map(([v, l]) => ({ v, l })) },
      { id: "fix", type: "text", long: true, q: "What should we do differently next time?", help: "Pre-filled from your answers — edit freely. Saved as a tip on the recipe.",
        when: (x) => (x.taste || []).some((t) => t !== "perfect"), default: (x) => (x.taste || []).filter((t) => TASTE_FIX[t]).map((t) => TASTE_FIX[t]).join("; ") },
      { id: "lunch", type: "choice", q: "How were the leftovers as next-day lunch?", options: [{ v: "great", l: "Great — still good" }, { v: "ok", l: "OK" }, { v: "poor", l: "Didn't keep well" }, { v: "none", l: "No leftovers / didn't try" }] },
      { id: "rating", type: "stars", q: "Overall rating?" },
      { id: "again", type: "choice", q: "Cook it again?", options: [{ v: "often", l: "Yes — put it in rotation" }, { v: "sometimes", l: "Sometimes" }, { v: "no", l: "No — stop suggesting it" }] },
      { id: "used", type: "checks", q: "Did it use up any of these? Tick to remove from pantry.", options: (x) => pantryUsed(x).map((p) => ({ v: p.id, l: `${label(p.name)}${p.qty ? " · " + p.qty : ""} (${p.loc})` })), when: (x) => pantryUsed(x).length > 0 },
      { id: "notes", type: "text", long: true, q: "Anything else to remember?", ph: "Who liked it, what to serve with it, where to buy…" },
    ],
    onDone: async (x) => {
      const n = DB.notes[id] || { cooks: [] };
      n.cooks = n.cooks || [];
      n.cooks.push({ date: x.date || today(), followed: x.followed, makes: x.makes, taste: (x.taste || []).map((t) => TASTE.find((y) => y[0] === t)?.[1] || t), rating: x.rating, notes: x.notes || "", lunch: x.lunch });
      if (x.swaps) { n.swaps = {}; for (const [k, v] of Object.entries(x.swaps)) n.swaps[k] = v; }
      if (x.added) for (const s of x.added.split(/[,，、]/).map((s) => s.trim()).filter(Boolean)) { n.tips = n.tips || []; n.tips.push(`Add: ${s}`); }
      n.tips = n.tips || [];
      if (x.method) n.tips.push(x.method);
      if (x.fix) n.tips.push(x.fix);
      n.tips = [...new Set(n.tips)].slice(-12);
      if (x.makes && x.followed === "exact") n.makes = x.makes;
      if (x.lunch && x.lunch !== "none") n.lunch = x.lunch;
      if (x.again) n.again = x.again;
      DB.notes[id] = n;
      const sects = ["notes"];
      if (x.used?.length) { DB.pantry = DB.pantry.filter((p) => !x.used.includes(p.id)); sects.push("pantry"); }
      if (planDate && currentWeek().days[planDate]) { currentWeek().days[planDate].cooked = true; sects.push("plan"); }
      await save(...sects); render(); toast("Recipe updated ✓");
    },
  });
}
// ---------- add a recipe: paste a link / video / text → draft → check → save ----------
const CATS = ["Meat", "Seafood", "Veg", "Soup", "Staple", "Breakfast", "Dessert", "Drink", "Sauce"];
const PROTS = ["Chicken", "Pork", "Beef", "Lamb", "Seafood", "Tofu/Egg", "Veg"];
async function newRecipe(prefill = "") {
  openModal(`<h2>Add a recipe</h2>
    <p class="small muted">Paste a recipe website link, a video link (YouTube, Bilibili, TikTok, Instagram…), or the recipe text itself. You check everything before it's saved.</p>
    <textarea id="impSrc" rows="5" placeholder="https://www.recipetineats.com/…   or   https://youtu.be/…   or paste the recipe text">${esc(prefill)}</textarea>
    <div id="impStatus" class="small muted" style="margin:6px 0 10px">Checking the AI helper…</div>
    <div class="row"><button class="btn primary" data-act="impgo">Import</button><button class="btn" data-act="impblank">Type it myself</button></div>`);
  $("#impSrc").focus();
  try {
    const st = await fetch("/api/import/status").then((r) => r.json());
    const el = $("#impStatus"); if (!el) return;
    el.innerHTML = st.ai ? `✓ AI helper ready (${esc(st.model)}, runs on the Mac) — links, videos and pasted text all work.`
      : `AI helper is off — recipe websites still work; videos and pasted text need Ollama running on the Mac.`;
  } catch { }
  if (prefill) importGo();
}
async function importGo() {
  const src = $("#impSrc")?.value.trim(); if (!src) return toast("Paste a link or text first");
  const btn = $('[data-act="impgo"]'), el = $("#impStatus");
  btn.disabled = true;
  const isVid = /youtu|bilibili|b23\.tv|tiktok|douyin|instagram|xhslink|xiaohongshu|vimeo|fb\.watch|facebook/i.test(src);
  const t0 = Date.now();
  const tick = setInterval(() => { if (el) el.textContent = `Reading ${isVid ? "the video's description and captions" : /^https?:/.test(src) ? "the page" : "your text"}… ${Math.round((Date.now() - t0) / 1000)}s (AI can take up to a minute)`; }, 500);
  try {
    const res = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ src }) });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Import failed");
    draftForm(d);
  } catch (e) {
    if ($("#impStatus")) { el.innerHTML = `<span style="color:var(--bad)">${esc(e.message)}</span>`; btn.disabled = false; }
  } finally { clearInterval(tick); }
}
const blankIng = () => ({ en: "", zh: "", qty: "", unit: "", optional: false, seasoning: false });
function draftFromCustom(c) {
  return { edit: c.id, name_en: c.en || c.name, name_zh: c.en ? c.name : "", category: c.cat, protein: c.protein, difficulty: c.stars, serves: c.serves || 0,
    summary: c.desc, img: c.img || "", url: c.url || "", steps: c.stepList || [],
    ingredients: c.ingList || c.ings.map((i) => ({ ...blankIng(), en: label(i.n).split(" · ")[0], zh: HAS_ZH.test(i.n) ? i.n : "", optional: i.opt })) };
}
function ingRowHtml(i) {
  return `<tr class="ingrow"><td><input data-f="qty" value="${esc(i.qty)}" style="width:52px"></td><td><input data-f="unit" value="${esc(i.unit)}" style="width:58px"></td>
    <td><input data-f="en" value="${esc(i.en)}" placeholder="English"></td><td><input data-f="zh" value="${esc(i.zh)}" placeholder="中文"></td>
    <td><label title="Cupboard seasoning (salt, oil, soy…) — doesn't count as missing"><input type="checkbox" data-f="seasoning" ${i.seasoning ? "checked" : ""}>🧂</label>
    <label title="Optional"><input type="checkbox" data-f="optional" ${i.optional ? "checked" : ""}>opt</label></td>
    <td><button class="btn ghost sm" data-act="ingrm">✕</button></td></tr>`;
}
function draftForm(d) {
  const sel = (id, opts, v) => `<select id="${id}">${opts.map((o) => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  const via = d.via ? `<div class="banner ${d.ai ? "good" : "info"} small">Read from the ${esc(d.via)}${d.ai ? " and tidied by the AI helper" : " (AI helper off — names not translated, check the guesses)"}. Check it over, then save.</div>` : "";
  openModal(`<h2>${d.edit ? "Edit recipe" : "Check the recipe"}</h2>${via}
    <div class="row"><input id="dEn" class="grow" placeholder="Name (English)" value="${esc(d.name_en)}"><input id="dZh" class="grow" placeholder="名字（中文）" value="${esc(d.name_zh)}"></div>
    <div class="row" style="margin-top:8px">${sel("dCat", CATS, d.category || "Meat")} ${sel("dProt", PROTS, d.protein || "Veg")}
      <select id="dStars">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${n === (d.difficulty || 2) ? "selected" : ""}>${"★".repeat(n)}</option>`).join("")}</select>
      <label class="small">Serves <input id="dServes" type="number" min="1" max="20" value="${d.serves || ""}" placeholder="?" style="width:60px"></label></div>
    <div class="row" style="margin-top:8px;align-items:flex-start">${d.img ? `<img id="dImgPrev" src="${esc(d.img)}" alt="" style="width:96px;height:72px;object-fit:cover;border-radius:8px">` : ""}
      <textarea id="dDesc" class="grow" rows="2" placeholder="One-line description">${esc(d.summary)}</textarea></div>
    <input type="hidden" id="dImg" value="${esc(d.img)}">
    <h3 style="margin-top:14px">Ingredients</h3>
    <p class="small muted">Amounts are for the servings above and scale on the shopping list. 🧂 = cupboard seasoning, opt = optional.</p>
    <div style="overflow-x:auto"><table id="dIngs"><tr><th>Qty</th><th>Unit</th><th>English</th><th>中文</th><th></th><th></th></tr>
      ${(d.ingredients.length ? d.ingredients : [blankIng()]).map(ingRowHtml).join("")}</table></div>
    <button class="btn sm" data-act="ingadd" style="margin-top:6px">+ Ingredient</button>
    <h3 style="margin-top:14px">Steps <span class="small muted">(one per line)</span></h3>
    <textarea id="dSteps" rows="8">${esc((d.steps || []).join("\n"))}</textarea>
    <input id="dUrl" type="url" placeholder="Source link (optional)" value="${esc(d.url)}" style="width:100%;margin-top:8px">
    <div class="row" style="margin-top:14px"><button class="btn primary" data-act="draftsave" data-edit="${esc(d.edit || "")}">${d.edit ? "Save changes" : "Save to my recipes"}</button>
      ${d.edit ? "" : `<button class="btn ghost" data-act="newrecipe">← Start over</button>`}</div>`);
}
async function draftSave(editId) {
  const v = (id) => $("#" + id).value.trim();
  const ingList = [...document.querySelectorAll("#dIngs .ingrow")].map((tr) => {
    const o = {}; tr.querySelectorAll("[data-f]").forEach((f) => (o[f.dataset.f] = f.type === "checkbox" ? f.checked : f.value.trim())); return o;
  }).filter((i) => i.en || i.zh);
  const en = v("dEn"), zh = v("dZh");
  if (!en && !zh) return toast("Give it a name");
  if (!ingList.length) return toast("Add at least one ingredient");
  const stepList = $("#dSteps").value.split("\n").map((s) => s.replace(/^\s*(\d+[.)、]|[-*•])\s*/, "").trim()).filter(Boolean);
  const c = {
    id: editId || "custom:" + uid(), name: zh || en, en: zh && en ? en : "", url: v("dUrl"), cat: v("dCat"), protein: v("dProt"),
    stars: +v("dStars") || 2, serves: +v("dServes") || null, desc: v("dDesc"), img: v("dImg"), kcal: null,
    ings: ingList.map((i) => ({ n: i.zh || ALIAS[i.en.toLowerCase()] || i.en, opt: i.optional || i.seasoning })),
    table: ingList.filter((i) => i.qty || i.unit).map((i) => [i.en || i.zh, i.qty, i.unit]),
    steps: stepList.map((s, k) => `${k + 1}. ${s}`).join("\n"), ingList, stepList,
  };
  const at = DB.custom.findIndex((x) => x.id === c.id);
  if (at >= 0) DB.custom[at] = c; else DB.custom.push(c);
  await save("custom"); closeModal(); render(); openRecipe(c.id);
  toast(editId ? "Saved" : "Added to your recipes");
}

// ---------- pets ----------
const ALLERGEN_KEYS = { chicken: ["chicken_"], beef: ["beef_"], turkey: ["turkey_"], fish: ["salmon", "fish_oil"] };
function petRecipes(p) {
  const bad = (p.allergies || []).flatMap((a) => ALLERGEN_KEYS[a] || []);
  return PET_RECIPES.filter((r) => r.species === p.species && !Object.keys(r.parts).some((k) => bad.some((b) => k.startsWith(b))));
}
function kcal100(r) { return Object.entries(r.parts).reduce((s, [k, pct]) => s + (pct / 100) * PET_ING[k].kcal, 0); }
function petKcal(p) { return p.kcal || Math.round(70 * Math.pow(p.kg || 1, 0.75) * (PET_FACTORS[p.species][p.factor] || 1)); }
function petDue(p) { return p.lastBatch ? daysFrom(addDays(p.lastBatch, p.days || 7)) : null; }
function batchFor(p) {
  const r = PET_RECIPES.find((x) => x.id === p.recipe) || petRecipes(p)[0];
  if (!r) return null;
  const k = petKcal(p), per100 = kcal100(r), gDay = (k / per100) * 100, days = p.days || 7;
  const total = gDay * days;
  return { r, k, per100, gDay, gMeal: gDay / (p.meals || 2), total, kTotal: k * days, rows: Object.entries(r.parts).map(([key, pct]) => ({ key, ...PET_ING[key], g: Math.round((pct / 100) * total / 5) * 5 })) };
}
// share of the batch (by weight) already in the fridge/pantry
function petCoverage(r, items = pantryItems()) {
  const st = stapleSet();
  return Object.entries(r.parts).reduce((t, [k, pct]) => { const c = canon(PET_ING[k].zh); return t + (findItem(c, items) || st.has(c) ? pct : 0); }, 0) / 100;
}
// pick next batch: different protein from last time, then whatever uses most of what you already have
function nextPetRecipe(p, justCooked) {
  const list = petRecipes(p); if (list.length < 2) return list[0]?.id;
  const last = PET_RECIPES.find((r) => r.id === justCooked);
  const items = pantryItems();
  const cands = list.filter((r) => r.id !== justCooked).map((r, i) => ({ r, s: (r.protein !== last?.protein ? 1 : 0) + petCoverage(r, items) - i * 0.01 }));
  return cands.sort((a, b) => b.s - a.s)[0].r.id;
}
// pets whose batch falls due on or before the end of the planned week
function petsDueThisWeek() {
  const end = daysFrom(addDays(currentWeek().weekOf, 6));
  return DB.pets.filter((p) => { const d = petDue(p); return d === null || d <= end; });
}
// combined grams across all due pets, minus what's in the pantry
function petShoppingNeeds(pets = petsDueThisWeek()) {
  const items = pantryItems(), staples = stapleSet(), need = {};
  for (const p of pets) {
    const b = batchFor(p); if (!b) continue;
    for (const row of b.rows) {
      if (findItem(canon(row.zh), items) || staples.has(canon(row.zh))) continue;
      need[row.key] = need[row.key] || { zh: row.zh, en: row.en, g: 0, who: [] };
      need[row.key].g += row.g; need[row.key].who.push(p.name);
    }
  }
  return Object.values(need);
}
function addPetShopping(pets) {
  DB.shopping = DB.shopping.filter((s) => !s.pet); // replace old pet lines with fresh amounts
  const needs = petShoppingNeeds(pets);
  for (const n of needs) DB.shopping.push({ id: uid(), name: `${n.en} ${n.zh}`, amt: `${n.g} g`, item: n.zh, done: false, for: `🐾 ${n.who.join(" + ")}`, pet: true });
  return needs.length;
}

function viewPets() {
  const toxic = pantryItems().filter((it) => [...PET_TOXIC.both, ...PET_TOXIC.cat].some((t) => it.name.toLowerCase().includes(t) || it.k.includes(t)));
  const cards = DB.pets.map((p) => {
    const b = batchFor(p), due = petDue(p);
    if (!b) return `<div class="card">No recipe fits ${esc(p.name)}'s allergies.</div>`;
    return `<div class="card">
      <div class="row spread"><h3>${p.species === "cat" ? "🐱" : "🐶"} ${esc(p.name)}</h3>
        <span class="row"><button class="btn sm" data-act="petedit" data-id="${p.id}">Edit</button><button class="btn sm primary" data-act="petcooked" data-id="${p.id}">Cooked a batch</button></span></div>
      <div class="small muted">${p.kg} kg · ${esc(p.factor)} · ~${b.k} kcal/day${p.kcal ? " (vet-set)" : ""} · every ${p.days} days · ${p.meals} meal${p.meals > 1 ? "s" : ""}/day
        ${p.lastBatch ? ` · last batch ${esc(p.lastBatch)} → ${due < 0 ? `<b style="color:var(--bad)">overdue ${-due}d</b>` : due === 0 ? "<b>due today</b>" : `next in ${due}d`}` : " · no batch logged yet"}</div>
      <div class="row" style="margin:10px 0"><label class="small">Recipe</label>
        <select data-act="petrecipe" data-id="${p.id}">${petRecipes(p).map((r) => `<option value="${r.id}" ${r.id === b.r.id ? "selected" : ""}>${esc(r.name)}</option>`).join("")}</select>
        <label class="small"><input type="checkbox" data-act="petrotate" data-id="${p.id}" ${p.rotate ? "checked" : ""}> rotate each batch</label></div>
      <div class="row"><span class="chip ${petCoverage(b.r) >= 0.6 ? "good" : "plain"}">${Math.round(petCoverage(b.r) * 100)}% in stock</span><span class="chip good">${Math.round(b.gDay)} g / day</span><span class="chip">${Math.round(b.gMeal)} g / meal</span><span class="chip plain">batch ${Math.round(b.total / 10) * 10} g · ${Math.round(b.kTotal)} kcal</span><span class="chip plain">${Math.round(b.per100)} kcal/100g</span></div>
      <table style="margin-top:10px"><tr><th>Ingredient (${p.days}-day batch)</th><th>Grams</th><th></th></tr>
        ${b.rows.map((x) => `<tr><td>${esc(label(`${x.en} ${x.zh}`))}</td><td>${x.g} g</td><td class="small">${findItem(canon(x.zh), pantryItems()) ? "✓ have" : ""}</td></tr>`).join("")}
        <tr><td colspan="3"><b>+ Complete vitamin–mineral premix for home-made ${p.species} food</b> — dose by label for <b>${Math.round(b.kTotal)} kcal</b> / ${Math.round(b.total)} g.
          ${p.species === "cat" ? " Must include <b>taurine</b> &amp; calcium." : " Must include calcium."}</td></tr></table>
      <details style="margin-top:8px"><summary class="small">Method</summary><p class="small">${esc(b.r.method)}</p></details>
    </div>`;
  }).join("");
  const log = DB.petLog.slice(-8).reverse();
  return `${dueBanners()}<div class="row spread"><h2>Pet batch cooking</h2><span class="row">
    ${DB.pets.length ? `<button class="btn" data-act="petshop">Add batch to shopping</button>` : ""}<button class="btn primary" data-act="petnew">+ Add pet</button></span></div>
  <div class="banner warn small"><b>Read first.</b> Home-cooked food is only complete when you add a vitamin–mineral premix designed for it
    (e.g. Balance IT, Alnutrin, EZcomplete — or what your vet prescribes). Meat + veg alone lacks calcium, and for cats taurine — deficiency causes heart disease.
    Calories here start from RER = 70×kg<sup>0.75</sup>; weigh your pet every batch and adjust. Ask your vet to check the recipe, especially for kittens/puppies, kidney issues or pregnancy.
    Never use onion, garlic, leek, chives, grapes/raisins, chocolate, xylitol, alcohol, cooked bones or salty sauces.</div>
  ${toxic.length ? `<div class="banner info small">In your kitchen, keep away from pets: ${toxic.map((t) => `<span class="chip bad">${esc(label(t.name))}</span>`).join(" ")}</div>` : ""}
  <p class="small muted">Recipes: 3 dog + 3 cat templates built into this app (pets.js), following common home-cooked structure — dogs ~45% meat/organ, ~35% starch, veg + oil; cats ~90% meat/heart/liver, low carb. Calories use USDA averages. Rotation: after each batch, the next one switches protein and prefers what's already in your fridge &amp; pantry. Not vet-formulated.</p>
  ${cards || `<div class="card"><p>No pets yet. Add your cat and dog — I'll ask a few questions to work out daily calories and a batch size.</p></div>`}
  <div class="card small"><h3>Batch tips</h3><ul style="padding-left:18px;margin:0">
    <li>Cool fast, portion into daily containers. Fridge ≤ 3 days, freeze the rest; thaw next day's portion in the fridge.</li>
    <li>Switching from commercial food? Mix in over 7 days (25% → 50% → 75% → 100%).</li>
    <li>Rotate proteins between batches; fish no more than every other batch for cats.</li>
    <li>Weigh pets every batch — losing or gaining &gt;2% a week means adjust calories.</li></ul></div>
  ${log.length ? `<div class="card"><h3>Log</h3>${log.map((l) => `<div class="small list-item"><span class="grow">${esc(l.date)} · ${esc(DB.pets.find((p) => p.id === l.pet)?.name || "?")} · ${esc(PET_RECIPES.find((r) => r.id === l.recipe)?.name || "")} ${l.kg ? `· ${l.kg} kg` : ""} ${l.appetite ? `· ate: ${esc(l.appetite)}` : ""} ${l.tummy ? `· tummy: ${esc(l.tummy)}` : ""}</span></div>`).join("")}</div>` : ""}`;
}
function petWizard(existing) {
  const p = existing ? { ...existing } : null;
  wizard({
    title: p ? `Edit ${p.name}` : "New pet",
    answers: p ? { species: p.species, name: p.name, kg: p.kg, fixed: p.factor === "intact" ? "no" : "yes", stage: p.stage || "adult", shape: p.shape || "ideal", allergies: p.allergies || [], days: String(p.days || 7), meals: String(p.meals || 2), kcal: p.kcal } : {},
    steps: [
      { id: "species", type: "choice", q: "Cat or dog?", optional: false, options: [{ v: "cat", l: "🐱 Cat" }, { v: "dog", l: "🐶 Dog" }] },
      { id: "name", type: "text", q: (x) => `What's your ${x.species}'s name?`, optional: false },
      { id: "kg", type: "number", step: 0.1, q: (x) => `How much does ${x.name || "they"} weigh?`, unit: "kg", optional: false, help: "Use a recent weigh-in. This drives the portion size." },
      { id: "fixed", type: "choice", q: "Desexed (neutered / spayed)?", options: [{ v: "yes", l: "Yes" }, { v: "no", l: "No" }] },
      { id: "stage", type: "choice", q: "Life stage?", options: (x) => [{ v: "young", l: x.species === "cat" ? "Kitten (< 1 yr)" : "Puppy (< 1 yr)" }, { v: "adult", l: "Adult" }, { v: "senior", l: "Senior / low activity" }] },
      { id: "shape", type: "choice", q: "Body shape right now?", help: "Ribs easy to feel with a light fat cover + visible waist = ideal.", options: [{ v: "thin", l: "Too thin" }, { v: "ideal", l: "Ideal" }, { v: "over", l: "Overweight" }] },
      { id: "allergies", type: "multi", q: "Any proteins to avoid?", help: "Allergies or dislikes. Recipes with these are hidden.", options: [{ v: "chicken", l: "Chicken" }, { v: "beef", l: "Beef" }, { v: "turkey", l: "Turkey" }, { v: "fish", l: "Fish" }] },
      { id: "days", type: "choice", q: "How often will you batch cook?", options: [{ v: "7", l: "Every week" }, { v: "14", l: "Every 2 weeks" }] },
      { id: "meals", type: "choice", q: "Meals per day?", options: [{ v: "1", l: "1" }, { v: "2", l: "2" }, { v: "3", l: "3" }] },
      { id: "kcal", type: "number", q: "Has your vet given a daily calorie target?", unit: "kcal/day", help: "Optional — leave blank to calculate from weight." },
    ],
    onDone: async (x) => {
      const factor = x.stage === "young" ? (x.species === "cat" ? "kitten" : "puppy") : x.shape === "over" ? "lose" : x.shape === "thin" ? "gain" : x.stage === "senior" ? "inactive" : x.fixed === "no" ? "intact" : "neutered";
      const pet = { id: p?.id || uid(), name: x.name, species: x.species, kg: +x.kg, factor, stage: x.stage, shape: x.shape, allergies: x.allergies || [],
        days: +(x.days || 7), meals: +(x.meals || 2), kcal: x.kcal || null, recipe: p?.recipe, rotate: p?.rotate ?? true, lastBatch: p?.lastBatch || "" };
      if (!petRecipes(pet).some((r) => r.id === pet.recipe)) pet.recipe = petRecipes(pet)[0]?.id;
      DB.pets = DB.pets.filter((q) => q.id !== pet.id).concat(pet);
      await save("pets"); render(); toast(`${pet.name} saved`);
    },
  });
}
function petCooked(p) {
  const prev = DB.petLog.filter((l) => l.pet === p.id).length > 0;
  wizard({
    title: `${p.name} · batch cooked`,
    steps: [
      { id: "date", type: "date", q: "When did you cook it?" },
      { id: "recipe", type: "choice", q: "Which recipe did you make?", options: petRecipes(p).map((r) => ({ v: r.id, l: r.name })), default: () => p.recipe },
      { id: "appetite", type: "choice", q: "How did they eat the last batch?", when: () => prev, options: [{ v: "loved", l: "Loved it" }, { v: "ok", l: "Ate it fine" }, { v: "picky", l: "Picky / left some" }, { v: "refused", l: "Refused" }] },
      { id: "tummy", type: "choice", q: "Any tummy trouble?", when: () => prev, options: [{ v: "none", l: "None" }, { v: "soft", l: "Soft stool" }, { v: "vomit", l: "Vomiting" }, { v: "constip", l: "Constipated" }] },
      { id: "kg", type: "number", step: 0.1, q: `${p.name}'s weight today?`, unit: "kg", default: () => p.kg, help: "Portions update from this." },
    ],
    onDone: async (x) => {
      p.lastBatch = x.date || today();
      if (x.kg) p.kg = x.kg;
      const list = petRecipes(p).map((r) => r.id);
      const cooked = x.recipe || p.recipe;
      if (p.rotate && list.length > 1) p.recipe = nextPetRecipe(p, cooked);
      if (x.appetite === "refused" || x.appetite === "picky") p.rotate = true;
      DB.petLog.push({ date: p.lastBatch, pet: p.id, recipe: cooked, kg: x.kg, appetite: x.appetite, tummy: x.tummy });
      const prevKg = DB.petLog.filter((l) => l.pet === p.id && l.kg).slice(-2);
      await save("pets", "petLog"); render();
      let msg = `Logged. Next batch in ${p.days} days.`;
      if (x.tummy && x.tummy !== "none") msg = "Logged. Tummy upset: slow the switch (mix with old food) — if it lasts >2 days or vomiting repeats, see your vet.";
      else if (prevKg.length === 2 && Math.abs(prevKg[1].kg - prevKg[0].kg) / prevKg[0].kg > 0.03) msg = `Weight changed ${(((prevKg[1].kg - prevKg[0].kg) / prevKg[0].kg) * 100).toFixed(1)}% — portions recalculated. Check in with your vet if unplanned.`;
      openModal(`<h3>Saved</h3><p>${esc(msg)}</p><button class="btn primary" data-act="close">OK</button>`);
    },
  });
}

// ---------- settings ----------
function viewSettings() {
  const st = S();
  const hiddenList = Object.entries(DB.notes).filter(([, n]) => n.again === "no");
  return `<h2>Settings</h2>
  <div class="card"><h3>Which nights do you cook?</h3>
    <div class="chips">${DOW.map((d, i) => `<button class="chip pick ${st.cookDays.includes(i) ? "on" : ""}" data-act="cookday" data-v="${i}">${d}</button>`).join("")}</div>
    <p class="small muted">Other nights show leftovers.</p>
    <h3 style="margin-top:14px">Default servings per cook</h3>
    <div class="chips">${[2, 3, 4].map((n) => `<button class="chip pick ${st.servings === n ? "on" : ""}" data-act="set" data-k="servings" data-v="${n}">${n} — ${n === 2 ? "dinner only" : `dinner + ${n - 2} lunch`}</button>`).join("")}</div>
    <h3 style="margin-top:14px">Dishes per dinner</h3>
    <div class="chips">${[[1, "One dish"], [2, "Main + veg/soup side"]].map(([n, l]) => `<button class="chip pick ${st.dishesPerMeal === n ? "on" : ""}" data-act="set" data-k="dishesPerMeal" data-v="${n}">${l}</button>`).join("")}</div>
    <h3 style="margin-top:14px">Hardest recipe to suggest</h3>
    <div class="chips">${[2, 3, 4, 5].map((n) => `<button class="chip pick ${st.maxStars === n ? "on" : ""}" data-act="set" data-k="maxStars" data-v="${n}">${"★".repeat(n)}</button>`).join("")}</div>
  </div>
  <div class="card"><h3>Where you shop</h3><p class="small muted">Shopping list groups by these. ★ first one gets anything unrecognised. Move an item to another shop once and it remembers.</p>
    <div class="chips">${st.stores.map((x, i) => `<span class="chip">${i ? `<button data-act="storeup" data-v="${esc(x)}" title="Move up">↑</button>` : "★"} ${esc(x)}<button data-act="storerm" data-v="${esc(x)}">×</button></span>`).join("")}</div>
    <div class="kv" style="margin-top:10px">${[["produce", "Fruit & veg"], ["meat", "Meat"], ["seafood", "Seafood"], ["pets", "Pet stuff"], ["hardware", "Hardware & garden"]].map(([k, t]) => `<label class="small">${t} from</label><select data-act="storerole" data-k="${k}">${st.stores.map((x) => `<option ${(st.storeRoles || {})[k] === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>`).join("")}</div>
    <form class="row" data-form="storeadd" style="margin-top:8px"><input name="n" placeholder="Add a shop (e.g. Aldi)"><button class="btn">Add</button></form></div>
  <div class="card"><h3>Always in the cupboard</h3><p class="small muted">Treated as "have" — never put on the shopping list.</p>
    <div class="chips">${st.staples.map((s) => `<span class="chip">${esc(label(s))}<button data-act="staplerm" data-v="${esc(s)}">×</button></span>`).join("")}</div>
    <form class="row" data-form="stapleadd" style="margin-top:8px"><input name="n" placeholder="Add staple (e.g. 豆瓣酱)" list="inglist"><button class="btn">Add</button></form></div>
  <div class="card"><h3>Hidden recipes</h3>${hiddenList.map(([id]) => `<div class="list-item"><span class="grow">${esc(BYID[id]?.name || id)}</span><button class="btn sm" data-act="unhide" data-id="${esc(id)}">Unhide</button></div>`).join("") || `<p class="small muted">None. Answer "No" to "cook it again?" to hide one.</p>`}</div>
  <div class="card"><h3>Data</h3><p class="small muted">Everything is saved on the computer running the server (data/db.json) so both phones see the same plan.</p>
    <div class="row"><a class="btn" href="/api/db" download="kitchen-backup.json">Download backup</a></div>
    <p class="small muted">Recipes: ${BASE.length} from HowToCook. Refresh them by running <code>./update_recipes.sh</code> on the server.</p></div>
  ${datalist()}`;
}

// ---------- modal ----------
function openModal(html) { $("#modalBody").onclick = null; $("#modalBody").innerHTML = html; $("#modal").hidden = false; }
function closeModal() { $("#modal").hidden = true; $("#modalBody").innerHTML = ""; }
$("#modal .x").onclick = closeModal;
$("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

// ---------- drag a day onto another day to swap ----------
function swapDays(a, b) {
  const plan = currentWeek(), A = plan.days[a], B = plan.days[b];
  if (!A || a === b || A.cooked || B?.cooked || daysFrom(b) < 0) return false;
  plan.days[b] = A; A.locked = true; // you placed it by hand → reshuffle keeps it
  if (B) { plan.days[a] = B; B.locked = true; } else delete plan.days[a];
  return true;
}
let DRAG = null;
document.addEventListener("pointerdown", (e) => {
  const g = e.target.closest("[data-drag]"); if (!g || e.button > 0) return;
  e.preventDefault();
  const card = g.closest("[data-day]");
  DRAG = { from: g.dataset.drag, card, y0: e.clientY, s0: window.scrollY, over: null };
  card.classList.add("dragging"); g.setPointerCapture(e.pointerId);
});
document.addEventListener("pointermove", (e) => {
  if (!DRAG) return;
  if (e.clientY < 90) window.scrollBy(0, -12); else if (e.clientY > innerHeight - 60) window.scrollBy(0, 12);
  DRAG.card.style.transform = `translateY(${e.clientY - DRAG.y0 + window.scrollY - DRAG.s0}px)`;
  const tgt = document.elementsFromPoint(e.clientX, e.clientY).map((el) => el.closest("[data-day]")).find((el) => el && el !== DRAG.card);
  const ok = tgt && daysFrom(tgt.dataset.day) >= 0 && !tgt.querySelector(".chip.good") ? tgt : null;
  if (DRAG.over !== ok) { DRAG.over?.classList.remove("dropon"); ok?.classList.add("dropon"); DRAG.over = ok; }
});
function endDrag() {
  if (!DRAG) return;
  const { from, over, card } = DRAG; DRAG = null;
  card.classList.remove("dragging"); card.style.transform = ""; over?.classList.remove("dropon");
  if (over && swapDays(from, over.dataset.day)) {
    save("plan"); render();
    toast(`Swapped ${fmtDay(from).dow} ↔ ${fmtDay(over.dataset.day).dow} (both locked)`);
  }
}
document.addEventListener("pointerup", endDrag);
document.addEventListener("pointercancel", endDrag);

// ---------- events ----------
document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-act]"); if (!t) return;
  if (t.tagName === "SELECT" || (t.tagName === "INPUT" && t.type === "checkbox")) return;
  const { act, id, d, v } = t.dataset;
  const plan = DB && currentWeek();
  switch (act) {
    case "tab": TAB = v; closeModal(); render(); break;
    case "gen": generate(Object.keys(plan.days).length > 0); render(); break;
    case "swap": swapDish(d, +t.dataset.i); break;
    case "lock": plan.days[d].locked = !plan.days[d].locked; save("plan"); render(); break;
    case "rmday": delete plan.days[d]; save("plan"); render(); break;
    case "addcook": {
      const ctx = planCtx(Date.now() % 1e9); const used = new Set(Object.values(plan.days).flatMap((x) => x.dishes));
      const dishes = slotsFor().map((s) => { const b = rank(s, ctx, used)[0]; if (b) { used.add(b.r.id); reserve(b.r, ctx); } return b?.r.id; }).filter(Boolean);
      plan.days[d] = { dishes, servings: S().servings, locked: false, cooked: false }; save("plan"); render(); break;
    }
    case "cooked": {
      const ids = plan.days[d].dishes;
      if (ids.length === 1) updateRecipe(ids[0], d);
      else openModal(`<h3>Which dish do you want to update?</h3>${ids.map((x) => `<button class="btn" style="display:block;margin:6px 0" data-act="update" data-id="${esc(x)}" data-d="${d}">${esc(BYID[x]?.name)}</button>`).join("")}`);
      break;
    }
    case "weeknav": plan.weekOf = addDays(plan.weekOf, +v); plan.days = Object.fromEntries(Object.entries(plan.days).filter(([k]) => k >= addDays(plan.weekOf, -7))); save("plan"); render(); break;
    case "open": openRecipe(id); break;
    case "scale": openRecipe(id, +v); break;
    case "steps": fillSteps(BYID[id], v === "orig"); break;
    case "update": closeModal(); updateRecipe(id, d); break;
    case "close": closeModal(); break;
    case "plancook": {
      const day = plan.days[d];
      if (day) { if (!day.dishes.includes(id)) day.dishes.push(id); day.locked = true; }
      else plan.days[d] = { dishes: [id], servings: S().servings, locked: true, cooked: false };
      await save("plan"); closeModal(); render(); toast(`Planned for ${fmtDay(d).dow} 🔒`); break;
    }
    case "addmissing": {
      const r = BYID[id]; let n = 0;
      for (const m of analyze(r).missing) if (!DB.shopping.some((s) => same(canon(s.name), m.k))) { DB.shopping.push({ id: uid(), name: m.n, done: false, for: r.name }); n++; }
      await save("shopping"); toast(`Added ${n} to shopping`); break;
    }
    case "delcustom": if (confirm("Delete this recipe?")) { DB.custom = DB.custom.filter((c) => c.id !== id); await save("custom"); closeModal(); render(); } break;
    case "newrecipe": newRecipe(); break;
    case "impgo": importGo(); break;
    case "impblank": draftForm({ name_en: "", name_zh: "", ingredients: [], steps: [], summary: "", img: "", url: /^https?:/.test($("#impSrc")?.value.trim()) ? $("#impSrc").value.trim() : "" }); break;
    case "ingadd": $("#dIngs").insertAdjacentHTML("beforeend", ingRowHtml(blankIng())); $("#dIngs .ingrow:last-child input").focus(); break;
    case "ingrm": t.closest("tr").remove(); break;
    case "draftsave": draftSave(t.dataset.edit); break;
    case "editcustom": draftForm(draftFromCustom(DB.custom.find((c) => c.id === id))); break;
    case "more": ui.limit += 40; render(); break;
    case "rail": ui[t.dataset.k] = v || ""; ui.limit = 40; render(); break;
    case "railclear": Object.assign(ui, { quick: "", cat: "", prot: "", stars: "", kcal: "", ing: "", limit: 40 }); render(); break;
    case "railtoggle": ui.rail = !ui.rail; render(); break;
    case "fav": {
      e.stopPropagation();
      const f = new Set(DB.settings.favs || []); f.has(id) ? f.delete(id) : f.add(id);
      DB.settings.favs = [...f]; await save("settings"); toast(f.has(id) ? "♥ Added to favorites" : "Removed from favorites");
      render(); if (t.dataset.m) openRecipe(id); break;
    }
    case "cooknow": ui.sort = "match"; ui.q = ""; Object.assign(ui, { quick: "ready", cat: "", prot: "", stars: "", kcal: "", ing: "" }); TAB = "recipes"; render(); break;
    case "shopbuild": rebuildShopping(); break;
    case "shoprm": {
      const s = DB.shopping.find((x) => x.id === id);
      if (s?.plan) DB.plan.shopDismiss = [...new Set([...(DB.plan.shopDismiss || []), s.k])];  // don't re-add on next sync
      DB.shopping = DB.shopping.filter((x) => x.id !== id); save("shopping", "plan"); render(); break;
    }
    case "shopday": {
      const skip = new Set(DB.plan.shopSkip || []); skip.has(d) ? skip.delete(d) : skip.add(d);
      DB.plan.shopSkip = [...skip]; await save("plan"); render(); break;
    }
    case "shopfilter": ui.store = v || ""; render(); break;
    case "storerm": if (S().stores.length > 1) { DB.settings.stores = S().stores.filter((x) => x !== v); if (ui.store === v) ui.store = ""; await save("settings"); render(); } break;
    case "storeup": { const a = S().stores.slice(), i = a.indexOf(v); if (i > 0) { [a[i - 1], a[i]] = [a[i], a[i - 1]]; DB.settings.stores = a; await save("settings"); render(); } break; }
    case "shopaddname": DB.shopping.push({ id: uid(), name: v, done: false, for: "top-up" }); await save("shopping"); render(); toast(`Added ${v}`); break;
    case "shopclear": if (confirm("Clear the shopping list?")) { DB.shopping = []; save("shopping"); render(); } break;
    case "shopcopy": {
      const open = DB.shopping.filter((x) => !x.done && (!ui.store || storeOf(x) === ui.store)), g = {};
      for (const x of open) (g[storeOf(x)] ||= []).push(x);
      const txt = S().stores.filter((st) => g[st]).map((st) => `🏬 ${st}\n` + g[st].map((x) => `• ${label(x.name)}${x.amt ? ` (≈ ${x.amt})` : ""}`).join("\n")).join("\n\n");
      try { await navigator.clipboard.writeText(txt); toast("Copied"); } catch { openModal(`<h3>Shopping list</h3><textarea style="min-height:240px">${esc(txt)}</textarea>`); }
      break;
    }
    case "shopmove": {
      const done = DB.shopping.filter((s) => s.done);
      for (const s of done) DB.pantry.push({ id: uid(), name: s.item || s.name, loc: guessLoc(s.item || s.name), qty: "", exp: "", added: today() });
      DB.shopping = DB.shopping.filter((s) => !s.done);
      await save("pantry", "shopping"); render(); toast(`${done.length} moved to pantry`); break;
    }
    case "prm": DB.pantry = DB.pantry.filter((p) => p.id !== id); save("pantry"); render(); break;
    case "pedit": {
      const p = DB.pantry.find((x) => x.id === id);
      openModal(`<h3>Edit ${esc(p.name)}</h3><form data-form="pedit" data-id="${p.id}">
        <div class="kv"><label>Name</label><input name="n" value="${esc(p.name)}" list="inglist">
        <label>Where</label><select name="loc">${Object.entries(LOCS).map(([l, t]) => `<option value="${l}" ${p.loc === l ? "selected" : ""}>${t}</option>`).join("")}</select>
        <label>Amount</label><input name="qty" value="${esc(p.qty || "")}">
        <label>Use by</label><input type="date" name="exp" value="${esc(p.exp || "")}">
        <label>${HAS_ZH.test(p.name) ? "English" : "中文"}</label><input name="tr" value="${esc(translationOf(p.name))}" placeholder="${HAS_ZH.test(p.name) ? "e.g. pickled mustard greens" : "例：鸡腿"}"></div>
        <p class="small muted">Translation fills in automatically. Fix it here if it's wrong — the app uses it to match recipes.</p>
        <p><button class="btn primary">Save</button></p></form>${datalist()}`); break;
    }
    case "expset": { const f = t.closest("form"); f.exp.value = addDays(today(), +v); break; }
    case "petnew": petWizard(); break;
    case "petedit": petWizard(DB.pets.find((p) => p.id === id)); break;
    case "petcooked": petCooked(DB.pets.find((p) => p.id === id)); break;
    case "petshop": { const n = addPetShopping(DB.pets); await save("shopping"); toast(`${n} pet items on the shopping list`); break; }
    case "cookday": { const st = S(); const i = +v; const s = new Set(st.cookDays); s.has(i) ? s.delete(i) : s.add(i); DB.settings.cookDays = [...s].sort(); save("settings"); render(); break; }
    case "set": DB.settings[t.dataset.k] = +v; save("settings"); render(); break;
    case "staplerm": DB.settings.staples = S().staples.filter((s) => s !== v); save("settings"); render(); break;
    case "unhide": delete DB.notes[id].again; save("notes"); render(); break;
  }
});
document.addEventListener("change", async (e) => {
  const t = e.target;
  if (t.id === "rsort") { ui.sort = t.value; render(); }
  const { act, id, d } = t.dataset || {};
  if (act === "servings") { currentWeek().days[d].servings = +t.value; save("plan"); render(); }
  if (act === "storerole") { DB.settings.storeRoles = { ...S().storeRoles, [t.dataset.k]: t.value }; await save("settings"); render(); }
  if (act === "shopstore") {
    const x = DB.shopping.find((y) => y.id === id); x.store = t.value;
    DB.settings.storeMemory = { ...(DB.settings.storeMemory || {}), [String(x.item || x.name).trim().toLowerCase()]: t.value };
    await save("shopping", "settings"); render(); toast(`${x.name} → ${t.value} from now on`);
  }
  if (act === "shoptick") { const s = DB.shopping.find((x) => x.id === id); s.done = t.checked; save("shopping"); render(); }
  if (act === "pmove") { const p = DB.pantry.find((x) => x.id === id); p.loc = t.value; learnLoc(p.name, t.value); await save("pantry"); render(); toast(`Got it — ${p.name} goes in the ${t.value} from now on`); }
  if (act === "petrecipe") { DB.pets.find((p) => p.id === id).recipe = t.value; save("pets"); render(); }
  if (act === "petrotate") { DB.pets.find((p) => p.id === id).rotate = t.checked; save("pets"); }
});
let qTimer;
document.addEventListener("input", (e) => {
  if (e.target.id !== "rq") return;
  clearTimeout(qTimer);
  qTimer = setTimeout(() => { ui.q = e.target.value; ui.limit = 40; render(); const el = $("#rq"); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }, 250);
});
document.addEventListener("submit", async (e) => {
  const f = e.target.closest("[data-form]"); if (!f) return;
  e.preventDefault();
  const kind = f.dataset.form;
  if (kind === "padd") {
    const names = f.n.value.split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean);
    const placed = [];
    for (const n of names) {
      const loc = f.loc.value === "auto" ? guessLoc(n, f.exp.value) : f.loc.value;
      if (f.loc.value !== "auto") learnLoc(n, loc);
      placed.push(`${n} → ${loc}`);
      DB.pantry.push({ id: uid(), name: n, loc, qty: names.length === 1 ? f.qty.value.trim() : "", exp: f.exp.value || "", added: today() });
    }
    await save("pantry"); render(); toast(placed.join(" · ")); autoTranslate(); $("[data-form=padd] input[name=n]")?.focus();
  }
  if (kind === "pedit") {
    const p = DB.pantry.find((x) => x.id === f.dataset.id);
    if (f.loc.value !== p.loc) learnLoc(f.n.value.trim() || p.name, f.loc.value);
    Object.assign(p, { name: f.n.value.trim() || p.name, loc: f.loc.value, qty: f.qty.value.trim(), exp: f.exp.value });
    const tr = f.tr.value.trim();
    if (tr !== translationOf(p.name)) {
      await fetch("/api/word", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: p.name, t: tr }) });
      WORDS[p.name.trim().toLowerCase()] = { t: tr, by: "you" };
    }
    await save("pantry"); closeModal(); render();
  }
  if (kind === "shopadd" && f.n.value.trim()) {
    const names = f.n.value.split(/[,，、\n]/).map((x) => x.trim()).filter(Boolean), st = f.store.value;
    for (const n of names) {
      DB.shopping.push({ id: uid(), name: n, done: false, ...(st ? { store: st } : {}) });  // auto shop is worked out live, so better rules apply later
      if (st) DB.settings.storeMemory = { ...(DB.settings.storeMemory || {}), [n.toLowerCase()]: st };
    }
    await save("shopping", ...(st ? ["settings"] : [])); render(); toast(names.map((n) => `${n} → ${storeOf(DB.shopping.find((x) => x.name === n))}`).join(" · "));
    $("[data-form=shopadd] input[name=n]")?.focus(); autoTranslate();
  }
  if (kind === "storeadd" && f.n.value.trim()) { DB.settings.stores = [...new Set([...S().stores, f.n.value.trim()])]; await save("settings"); render(); }
  if (kind === "stapleadd" && f.n.value.trim()) { DB.settings.staples = [...new Set([...S().staples, f.n.value.trim()])]; await save("settings"); render(); }
});
$("#lang").innerHTML = Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === LANG ? "selected" : ""}>${v}</option>`).join("");
$("#lang").onchange = (e) => { LANG = e.target.value; try { localStorage.setItem("lang", LANG); } catch {} render(); };
$("#tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; TAB = b.dataset.tab; render(); window.scrollTo(0, 0); });
// another phone may have changed things — refresh when tab regains focus (unless a dialog is open)
document.addEventListener("visibilitychange", async () => { if (!document.hidden && $("#modal").hidden) { await load(); render(); } });

load().then(() => {
  render(); autoTranslate();
  // iPhone share sheet / bookmarklet: /?add=<link or text> opens the import box ready to go
  const add = new URLSearchParams(location.search).get("add");
  if (add) { history.replaceState(null, "", location.pathname); TAB = "recipes"; render(); newRecipe(add); }
}).catch((err) => { $("#view").innerHTML = `<p class="pad">Could not load: ${esc(err.message)}</p>`; });
