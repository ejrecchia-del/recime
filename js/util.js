// ---------------------------------------------------------------------------
// util.js — small helpers used everywhere
// ---------------------------------------------------------------------------

export function uid(prefix = 'r') {
  return prefix + '-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function nowISO() { return new Date().toISOString(); }

export function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function attr(s) { return esc(s); }

export function debounce(fn, ms = 250) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// --- Fractions -------------------------------------------------------------
// Turns 0.333 into ⅓, 1.5 into 1½ — cooking amounts should never read "0.3 cups".
const VULGAR = [
  [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'],
  [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'],
];

export function fmtQty(n) {
  if (n == null || isNaN(n)) return '';
  if (n === 0) return '0';
  const neg = n < 0; n = Math.abs(n);
  // Large amounts: no need for eighths
  if (n >= 10) return (neg ? '-' : '') + String(Math.round(n * 10) / 10);
  const whole = Math.floor(n + 1e-9);
  let frac = n - whole;
  if (frac < 0.045) return (neg ? '-' : '') + String(whole || 0);
  let best = null, bestErr = Infinity;
  for (const [v, g] of VULGAR) {
    const e = Math.abs(frac - v);
    if (e < bestErr) { bestErr = e; best = [v, g]; }
  }
  if (bestErr > 0.06) {
    // No clean fraction — show at most 2 decimals
    const r = Math.round(n * 100) / 100;
    return (neg ? '-' : '') + String(r);
  }
  if (Math.abs(frac - 1) < 0.045) return (neg ? '-' : '') + String(whole + 1);
  return (neg ? '-' : '') + (whole ? whole + best[1] : best[1]);
}

export function money(n) {
  if (n == null || isNaN(n)) return '—';
  return '$' + n.toFixed(2);
}

export function money0(n) {
  if (n == null || isNaN(n)) return '—';
  return '$' + (Math.round(n * 100) / 100).toFixed(2);
}

// --- Units -----------------------------------------------------------------
// Base units: 'tsp' for volume, 'oz' for weight, 'ct' for countables.
export const VOLUME = { tsp: 1, teaspoon: 1, tbsp: 3, tablespoon: 3, floz: 6, cup: 48, pint: 96, quart: 192, gallon: 768, ml: 0.202884, l: 202.884, liter: 202.884 };
export const WEIGHT = { oz: 1, ounce: 1, lb: 16, pound: 16, g: 0.035274, kg: 35.274, gram: 0.035274 };
export const COUNT = { '': 1, whole: 1, each: 1, ct: 1, clove: 1, can: 1, jar: 1, bunch: 1, head: 1, stalk: 1, sprig: 1, slice: 1, package: 1, bag: 1, box: 1, loaf: 1, ear: 1, fillet: 1, breast: 1, thigh: 1, link: 1, pinch: 1, dash: 1, handful: 1 };

export function unitClass(u) {
  const k = normUnit(u);
  if (k in VOLUME) return 'volume';
  if (k in WEIGHT) return 'weight';
  return 'count';
}

export function normUnit(u) {
  let s = String(u || '').toLowerCase().trim().replace(/\./g, '');
  s = s.replace(/^fl\s*oz$/, 'floz').replace(/\s+/g, '');
  const map = {
    teaspoons: 'tsp', teaspoon: 'tsp', tsps: 'tsp', ts: 'tsp',
    tablespoons: 'tbsp', tablespoon: 'tbsp', tbsps: 'tbsp', tbs: 'tbsp', tb: 'tbsp',
    cups: 'cup', c: 'cup', ounces: 'oz', ounce: 'oz', pounds: 'lb', pound: 'lb', lbs: 'lb',
    grams: 'g', gram: 'g', kilograms: 'kg', kilogram: 'kg', milliliters: 'ml', milliliter: 'ml',
    liters: 'l', liter: 'l', liters: 'l', cloves: 'clove', cans: 'can', jars: 'jar',
    bunches: 'bunch', heads: 'head', stalks: 'stalk', sprigs: 'sprig', slices: 'slice',
    packages: 'package', pkg: 'package', bags: 'bag', boxes: 'box', loaves: 'loaf',
    ears: 'ear', fillets: 'fillet', pinches: 'pinch', quarts: 'quart', qt: 'quart',
    pints: 'pint', pt: 'pint', gallons: 'gallon', gal: 'gallon', wholes: 'whole',
    pc: 'whole', pcs: 'whole', piece: 'whole', pieces: 'whole',
  };
  return map[s] || s;
}

export function toBase(qty, unit) {
  const u = normUnit(unit);
  if (u in VOLUME) return { v: qty * VOLUME[u], cls: 'volume' };
  if (u in WEIGHT) return { v: qty * WEIGHT[u], cls: 'weight' };
  return { v: qty, cls: 'count', unit: u };
}

// Render a base-unit amount back into the friendliest unit for a human.
export function fromBase(v, cls, preferUnit) {
  if (cls === 'volume') {
    if (v >= 192) return { quantity: v / 192, unit: 'quart' };
    if (v >= 48) return { quantity: v / 48, unit: 'cup' };
    if (v >= 3) return { quantity: v / 3, unit: 'tbsp' };
    return { quantity: v, unit: 'tsp' };
  }
  if (cls === 'weight') {
    if (v >= 16) return { quantity: v / 16, unit: 'lb' };
    return { quantity: v, unit: 'oz' };
  }
  return { quantity: v, unit: preferUnit || '' };
}

export function unitLabel(unit, qty) {
  const u = normUnit(unit);
  if (!u || u === 'whole' || u === 'each' || u === 'ct') return '';
  const plural = qty > 1.0001;
  const irregular = { clove: 'cloves', can: 'cans', jar: 'jars', bunch: 'bunches', head: 'heads', stalk: 'stalks', sprig: 'sprigs', slice: 'slices', package: 'packages', bag: 'bags', box: 'boxes', loaf: 'loaves', ear: 'ears', fillet: 'fillets', pinch: 'pinches', cup: 'cups', quart: 'quarts', pint: 'pints', gallon: 'gallons', dash: 'dashes', handful: 'handfuls', link: 'links', breast: 'breasts', thigh: 'thighs' };
  if (plural && irregular[u]) return irregular[u];
  return u;
}

export function fmtAmount(qty, unit) {
  const q = fmtQty(qty);
  const u = unitLabel(unit, qty);
  return u ? `${q} ${u}` : q;
}

// --- Ingredient name normalisation ----------------------------------------
const DESCRIPTORS = /\b(finely|roughly|coarsely|freshly|thinly|thickly|lightly|well|very|about|approximately|plus more|to taste|for serving|for garnish|optional|divided|drained(?: and rinsed)?|rinsed|chopped|minced|diced|sliced|shredded|grated|crushed|ground(?= )|trimmed|peeled|seeded|halved|quartered|cubed|julienned|torn|packed|melted|softened|room temperature|cooked|uncooked|raw|large|medium|small|extra[- ]large|jumbo|ripe|fresh|frozen|canned|dried|whole)\b/g;

// Light clean-up that keeps words which change *which product you buy*
// ("crushed tomatoes" is a can; "tomatoes" are loose in produce).
const SOFT_DESCRIPTORS = /\b(finely|roughly|coarsely|freshly|thinly|thickly|lightly|well|very|about|approximately|plus more|to taste|for serving|for garnish|optional|divided|trimmed|peeled|halved|quartered|cubed|julienned|torn|packed|softened|room temperature|large|medium|small|extra[- ]large|jumbo|ripe)\b/g;

export function productName(s) {
  let t = String(s || '').toLowerCase();
  t = t.replace(/\([^)]*\)/g, ' ').replace(/,.*$/, ' ');
  t = t.replace(SOFT_DESCRIPTORS, ' ');
  t = t.replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  return t.split(' ').map(singular).join(' ').trim();
}

export function normName(s) {
  let t = String(s || '').toLowerCase();
  t = t.replace(/\([^)]*\)/g, ' ');
  t = t.replace(/,.*$/, ' ');
  t = t.replace(DESCRIPTORS, ' ');
  t = t.replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  return t.split(' ').map(singular).join(' ').trim();
}

/** Crude but adequate English singulariser for grocery words. */
export function singular(w) {
  if (!w || w.length < 3) return w;
  if (/(ss|us|is|ous)$/.test(w)) return w;              // molasses, hummus, chives->chive handled below
  if (/ies$/.test(w) && w.length > 4) return w.slice(0, -3) + 'y';   // berries -> berry
  if (/oes$/.test(w) && w.length > 4) return w.slice(0, -2);         // potatoes -> potato
  if (/(ches|shes|xes|zes|sses)$/.test(w)) return w.slice(0, -2);    // peaches -> peach
  const VES = { loaves: 'loaf', leaves: 'leaf', halves: 'half', knives: 'knife', shelves: 'shelf' };
  if (VES[w]) return VES[w];                                          // (olives stays olive)
  if (/s$/.test(w) && w.length > 3) return w.slice(0, -1);           // eggs -> egg
  return w;
}

export function titleCase(s) {
  return String(s || '').replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1));
}

export function pctDelta(a, b) {
  if (!a) return 0;
  return Math.round(((b - a) / a) * 100);
}

// --- Dates -----------------------------------------------------------------
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ymd(d) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

export function parseYmd(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Monday-start week containing `d`
export function weekStartOf(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // 0 = Monday
  x.setDate(x.getDate() - dow);
  return x;
}

export function addDays(d, n) {
  const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x;
}

export function prettyDate(d) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function relTime(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  const d = Math.floor(diff / 86400);
  if (d < 30) return d + 'd ago';
  return new Date(iso).toLocaleDateString();
}

// --- Deterministic art for recipes without a photo -------------------------
const EMOJI_RULES = [
  [/taco|tortilla|enchilada|burrito|quesadilla/, '🌮'], [/pizza/, '🍕'],
  [/salmon|cod|fish|tuna|halibut|tilapia/, '🐟'], [/shrimp|prawn/, '🍤'],
  [/chicken|poultry/, '🍗'], [/beef|steak|bulgogi|brisket|burger/, '🥩'],
  [/pork|bacon|ham/, '🥓'], [/turkey/, '🦃'],
  [/pasta|spaghetti|orzo|noodle|soba|lasagna|penne/, '🍝'],
  [/soup|stew|chili|broth|bisque/, '🍲'], [/curry|masala|tikka|korma/, '🍛'],
  [/salad|slaw|greens/, '🥗'], [/egg|shakshuka|omelet|frittata|scramble/, '🍳'],
  [/pancake|waffle|french toast/, '🥞'], [/oat|granola|porridge|muesli/, '🥣'],
  [/rice|grain bowl|bowl|farro|quinoa/, '🍚'], [/sandwich|wrap|burger|sub/, '🥪'],
  [/bread|muffin|scone|biscuit|loaf/, '🍞'], [/chocolate|cake|cookie|brownie|dessert|bark/, '🍫'],
  [/banana/, '🍌'], [/apple/, '🍎'], [/tofu|tempeh|vegan/, '🌱'],
  [/bean|lentil|chickpea|falafel|hummus/, '🫘'], [/potato/, '🥔'],
  [/broccoli|vegetable|veggie|veg/, '🥦'], [/smoothie|shake|juice/, '🥤'],
  [/stir[- ]?fry|wok/, '🥡'], [/kebab|souvlaki|shawarma|skewer/, '🍢'],
  [/cheese|feta|parmesan/, '🧀'], [/yogurt|parfait/, '🍨'],
];

export function recipeEmoji(r) {
  const hay = ((r.title || '') + ' ' + (r.description || '')).toLowerCase();
  for (const [re, e] of EMOJI_RULES) if (re.test(hay)) return e;
  const byMeal = { breakfast: '🍳', lunch: '🥗', dinner: '🍽️', side: '🥕', snack: '🥨', dessert: '🍰' };
  return byMeal[r.mealType] || '🍽️';
}

const PALETTES = [
  ['#2f6d4f', '#7fbf7a'], ['#7a4a2b', '#d9a066'], ['#3b4f7d', '#8fa7d9'],
  ['#6d2f4f', '#c97fa8'], ['#4f6d2f', '#a8c97f'], ['#7d5a3b', '#d9c08f'],
  ['#2f5f6d', '#7fbcc9'], ['#5a2f6d', '#a87fc9'], ['#6d5a2f', '#c9bb7f'],
  ['#6d3b2f', '#c98f7f'],
];

export function recipeArt(r) {
  let h = 0; const s = r.id || r.title || '';
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const [a, b] = PALETTES[h % PALETTES.length];
  return { a, b, emoji: recipeEmoji(r), angle: 120 + (h % 120) };
}

// --- Misc ------------------------------------------------------------------
export function uniq(arr) { return Array.from(new Set(arr)); }

export function groupBy(arr, fn) {
  const m = new Map();
  for (const x of arr) {
    const k = fn(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
}

export function sum(arr, fn = (x) => x) { return arr.reduce((a, x) => a + (fn(x) || 0), 0); }

export function sortBy(arr, fn, dir = 1) {
  return arr.slice().sort((a, b) => {
    const x = fn(a), y = fn(b);
    if (x < y) return -1 * dir; if (x > y) return 1 * dir; return 0;
  });
}

export function totalMinutes(r) { return (r.prepMinutes || 0) + (r.cookMinutes || 0); }

export function fmtMinutes(m) {
  if (!m) return '—';
  if (m < 60) return m + ' min';
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}
