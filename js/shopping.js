// ---------------------------------------------------------------------------
// shopping.js — turn a week of meals into a real, priced, aisle-sorted list
// ---------------------------------------------------------------------------
import { PRICES, PRICE_META } from '../data/prices.js';
import { normName, productName, normUnit, toBase, fromBase, unitClass, uid, nowISO, fmtAmount, fmtQty as fmtQtyPlain, titleCase } from './util.js';
import store, { AISLE_ORDER, AISLE_META } from './store.js';

export { PRICE_META };

// The price table is keyed by natural names ("green beans", "strawberries")
// while ingredients get normalised ("green bean", "strawberry"). Index both
// forms once so lookups line up in either direction.
const PRICE_INDEX = (() => {
  const idx = new Map();
  for (const [k, v] of Object.entries(PRICES)) {
    const entry = { key: k, ...v };
    for (const form of [k, productName(k), normName(k)]) {
      if (form && !idx.has(form)) idx.set(form, entry);
    }
  }
  return idx;
})();
const PRICE_KEYS = Array.from(PRICE_INDEX.keys()).sort((a, b) => b.length - a.length);

export function priceLookup(name) {
  const raw = String(name || '').toLowerCase().trim();
  const prod = productName(name);   // keeps "crushed", "canned", "shredded"
  const n = normName(name);         // strips them, for a looser second pass
  if (PRICE_INDEX.has(raw)) return PRICE_INDEX.get(raw);
  if (PRICE_INDEX.has(prod)) return PRICE_INDEX.get(prod);
  if (PRICE_INDEX.has(n)) return PRICE_INDEX.get(n);

  // most specific product-name match first
  for (const k of PRICE_KEYS) {
    if (k.length < 5) continue;
    if (prod === k || prod.startsWith(k + ' ') || prod.endsWith(' ' + k) || prod.includes(' ' + k + ' ')) {
      return { ...PRICE_INDEX.get(k), fuzzy: true };
    }
  }

  // the ingredient name contains a known key: "cod fillet" -> "cod"
  for (const k of PRICE_KEYS) {
    if (k.length < 3) continue;
    if (n === k || n.startsWith(k + ' ') || n.endsWith(' ' + k) || n.includes(' ' + k + ' ')) {
      return { ...PRICE_INDEX.get(k), fuzzy: true };
    }
  }
  // drop leading adjectives: "baby yukon gold potato" -> "yukon gold potato" -> ...
  const words = n.split(' ').filter(Boolean);
  for (let i = 1; i < words.length; i++) {
    const tail = words.slice(i).join(' ');
    if (PRICE_INDEX.has(tail)) return { ...PRICE_INDEX.get(tail), fuzzy: true };
  }
  // a known key contains the ingredient: "parmesan" -> "parmesan cheese"
  if (n.length >= 4) {
    for (const k of PRICE_KEYS) {
      if (k.startsWith(n + ' ') || k.endsWith(' ' + n)) return { ...PRICE_INDEX.get(k), fuzzy: true };
    }
  }
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i];
    if (w.length >= 3 && PRICE_INDEX.has(w)) return { ...PRICE_INDEX.get(w), fuzzy: true };
  }
  return null;
}

// How much of a purchase unit does `qty unit` represent?
// Returns a multiplier of the priced pack, e.g. 0.5 lb of a $4.49/lb item = 0.5.
function packsNeeded(qty, unit, price) {
  const per = String(price.per || '').toLowerCase();
  const cls = unitClass(unit);
  const { v } = toBase(qty, unit);

  if (per === 'lb') {
    if (cls === 'weight') return v / 16;                 // base oz -> lb
    if (cls === 'count') return Math.max(0.25, v * 0.35); // ~1/3 lb per whole item
    if (cls === 'volume') return (v / 48) * 0.5;          // ~1/2 lb per cup, rough
  }
  if (per === 'oz') {
    if (cls === 'weight') return v;
    if (cls === 'volume') return v / 6;                   // tsp -> fl oz
    return Math.max(1, v * 4);
  }
  if (per === 'dozen') {
    if (cls === 'count') return v / 12;
    return 1;
  }
  if (['each', 'bunch', 'head', 'clove', 'ear'].includes(per)) {
    if (cls === 'count') {
      const u = normUnit(unit);
      if (u === 'clove' && per !== 'clove') return v / 9;       // a head holds ~9 cloves
      if (per === 'bunch') return v / 6;                        // a bunch is ~6 stems
      if (per === 'head' && u !== 'head') return v / 4;
      return v;
    }
    if (cls === 'volume' && per === 'bunch') return (v / 3) / 24;  // a bunch chops down to ~1.5 cups
    if (cls === 'weight') return Math.max(1, v / 6);
    if (cls === 'volume') return Math.max(1, v / 48);
  }
  if (['can', 'jar', 'bottle', 'bag', 'box', 'package', 'loaf', 'pint', 'quart', 'gallon', 'container', 'tub'].includes(per)) {
    // "6 corn tortillas" is a fraction of one package, not six packages
    if (cls === 'count') {
      const perPack = { package: 10, bag: 10, box: 10, loaf: 18, can: 1, jar: 1, bottle: 1, container: 1, tub: 1, pint: 1, quart: 1, gallon: 1 }[per] || 1;
      return v / perPack;
    }
    // Assume a typical pack holds roughly this much
    const packBase = { can: 90, jar: 96, bottle: 100, bag: 200, box: 200, package: 160, loaf: 20, pint: 96, quart: 192, gallon: 768, container: 96, tub: 96 }[per] || 100;
    if (cls === 'volume') return v / packBase;
    if (cls === 'weight') return v / (packBase / 6);
  }
  return 1;
}

// Pantry staples you buy once and use for months — don't charge full price
// for 1 tsp of cumin every single week.
const STAPLE_AISLES = new Set(['Spices & Baking', 'Condiments & Sauces']);

const DISCRETE = new Set(['each', 'bunch', 'head', 'can', 'jar', 'bottle', 'bag', 'box', 'package', 'loaf', 'dozen', 'pint', 'quart', 'gallon', 'container', 'tub', 'ear', 'clove']);

export function estimateCost(item) {
  const p = item.price || priceLookup(item.name);
  if (!p) return { cost: null, price: null, packs: null };
  let packs = packsNeeded(item.quantity, item.unit, p);
  if (!isFinite(packs) || packs <= 0) packs = 1;

  const per = String(p.per || '').toLowerCase();
  const aisle = item.category || p.aisle || 'Other';
  const staple = STAPLE_AISLES.has(aisle);

  let billed, buyQty;
  if (per === 'lb' || per === 'oz') {
    // Sold by weight — you pay for what you take, but nobody buys 0.02 lb.
    const floor = per === 'lb' ? 0.25 : 2;
    billed = Math.max(floor, Math.round(packs * 100) / 100);
    buyQty = billed;
  } else if (staple && packs < 1) {
    // You buy the whole jar, but it lasts months — charge a fair share of it
    // so one teaspoon of cumin doesn't read as a $5 line item.
    billed = Math.max(0.15, Math.min(1, packs));
    buyQty = 1;
  } else {
    billed = Math.max(1, Math.ceil(packs - 0.001));
    buyQty = billed;
  }

  const cost = Math.round(billed * p.unitPrice * 100) / 100;
  return {
    cost, price: p, packs, billed,
    staple: staple && packs < 1,
    buyQty, buyUnit: per,
    discrete: DISCRETE.has(per),
  };
}

/**
 * What you actually put in the cart, in the units the store sells it in.
 * "12 cloves garlic" becomes "2 heads"; "10 tbsp cilantro" becomes "1 bunch".
 */
export function buyAmount(item) {
  if (item.buyQty == null || !item.buyUnit) return fmtAmount(item.quantity, item.unit);
  const u = item.buyUnit;
  if (u === 'each') return fmtAmount(item.buyQty, '');
  return fmtAmount(item.buyQty, u);
}

/** The recipe-side amount, shown as a secondary hint when it differs. */
export function needAmount(item) {
  const a = fmtAmount(item.quantity, item.unit);
  // Countable items have no unit word — "2½" alone is ambiguous next to "3 lemons"
  return /[a-z]/i.test(a) ? a : a + '\u00d7';
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

/**
 * @param entries [{ recipe, servings }]
 * @returns array of merged line items
 */
/**
 * Things that come out of a tap or a freezer tray. A recipe calling for water
 * shouldn't put a case of seltzer in the cart, which is exactly what a fuzzy
 * price match will do if we let it.
 */
const NOT_SHOPPED = new Set([
  'water', 'warm water', 'hot water', 'cold water', 'boiling water', 'ice water',
  'tap water', 'filtered water', 'ice', 'ice cubes', 'crushed ice',
]);

export function isNotShopped(name) {
  return NOT_SHOPPED.has(String(name || '').toLowerCase().trim());
}

export function aggregateIngredients(entries) {
  const bucket = new Map();

  for (const { recipe, servings } of entries) {
    const scale = (servings || recipe.servings || 4) / (recipe.servings || 4);
    for (const ing of recipe.ingredients || []) {
      const key = normName(ing.item);
      if (!key) continue;
      if (isNotShopped(ing.item) || isNotShopped(key)) continue;
      const cls = unitClass(ing.unit);
      const bk = key + '|' + cls;
      const qty = (Number(ing.quantity) || 0) * scale;
      const { v } = toBase(qty, ing.unit);
      if (!bucket.has(bk)) {
        bucket.set(bk, {
          key, cls,
          name: ing.item,
          displayName: cleanDisplayName(ing.item),
          category: ing.category || 'Other',
          baseQty: 0,
          preferUnit: normUnit(ing.unit),
          notes: new Set(),
          from: [],
        });
      }
      const b = bucket.get(bk);
      b.baseQty += v;
      if (ing.notes) b.notes.add(ing.notes);
      b.from.push({ recipeId: recipe.id, title: recipe.title, qty, unit: ing.unit });
      // Prefer the shortest ingredient name as the display name
      if (ing.item.length < b.name.length) { b.name = ing.item; b.displayName = cleanDisplayName(ing.item); }
    }
  }

  const out = [];
  for (const b of bucket.values()) {
    const { quantity, unit } = fromBase(b.baseQty, b.cls, b.preferUnit);
    const price = priceLookup(b.name);
    const category = normaliseAisle(price?.aisle || b.category);
    const item = {
      id: uid('shp'),
      key: b.key,
      name: b.displayName,
      rawName: b.name,
      category,
      quantity: Math.round(quantity * 1000) / 1000,
      unit,
      notes: Array.from(b.notes).filter(Boolean).slice(0, 2).join(', '),
      from: b.from,
      have: false,
      checked: false,
      dest: '',
      store: '',
      manual: false,
      deleted: false,
      updatedAt: nowISO(),
    };
    applyPricing(item);
    out.push(item);
  }
  return sortForStore(out);
}

/** Does `term` appear in `hay` as a whole word or phrase? */
function phraseHit(hay, term) {
  if (!hay || !term) return false;
  if (hay === term) return true;
  return (' ' + hay + ' ').includes(' ' + term + ' ')
    || hay.startsWith(term + ' ')
    || hay.endsWith(' ' + term);
}

/**
 * Apply the household's standing store rules to one item.
 * A rule never overrides something assigned by hand — `pinned` wins.
 */
export function applyStoreRules(item, rules) {
  if (item.pinned || item.have) return item;
  const list = (rules || store.storeRules()).filter((r) => r.enabled !== false);
  const name = productName(item.name);
  const nameLoose = normName(item.name);

  for (const rule of list) {
    let hit = false;
    if (rule.kind === 'aisle') {
      hit = String(rule.match).toLowerCase() === String(item.category || '').toLowerCase();
    } else {
      // Whole-phrase matching only. Plain substring matching sends corn
      // tortillas and rice vinegar to the bulk-corn and bulk-rice rules.
      const terms = String(rule.match || '').split(',').map((t) => productName(t)).filter(Boolean);
      hit = terms.some((t) => phraseHit(name, t) || phraseHit(nameLoose, t));
    }
    if (!hit) continue;

    // Size threshold — "big packs go to Costco" only fires on big packs.
    if (rule.minQty) {
      const want = toBase(Number(rule.minQty) || 0, rule.minUnit || 'lb');
      const got = toBase(Number(item.quantity) || 0, item.unit);
      if (got.cls !== want.cls || got.v < want.v) continue;
    }

    item.dest = rule.dest || item.dest || '';
    item.store = rule.store || '';
    item.ruleId = rule.id;
    return item;
  }
  return item;
}

/** Recompute cost + purchase units on an item, in place. */
export function applyPricing(item) {
  const est = estimateCost(item);
  item.estCost = est.cost;
  item.priceInfo = est.price
    ? { unitPrice: est.price.unitPrice, per: est.price.per, packSize: est.price.packSize, confidence: est.price.confidence, fuzzy: !!est.price.fuzzy }
    : null;
  item.staple = !!est.staple;
  item.buyQty = est.buyQty ?? null;
  item.buyUnit = est.buyUnit || '';
  return item;
}

function cleanDisplayName(s) {
  let t = String(s || '').replace(/\s+/g, ' ').trim();
  t = t.replace(/^(a|an|the)\s+/i, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function normaliseAisle(a) {
  if (!a) return 'Other';
  const hit = AISLE_ORDER.find((x) => x.toLowerCase() === String(a).toLowerCase());
  return hit || 'Other';
}

export function sortForStore(items) {
  return items.slice().sort((a, b) => {
    const ai = AISLE_ORDER.indexOf(a.category), bi = AISLE_ORDER.indexOf(b.category);
    if (ai !== bi) return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    return a.name.localeCompare(b.name);
  });
}

export function groupByAisle(items) {
  const groups = new Map();
  for (const a of AISLE_ORDER) groups.set(a, []);
  for (const it of items) {
    const a = groups.has(it.category) ? it.category : 'Other';
    groups.get(a).push(it);
  }
  const out = [];
  for (const [aisle, list] of groups) {
    if (!list.length) continue;
    out.push({ aisle, meta: AISLE_META[aisle] || AISLE_META.Other, items: list.sort((x, y) => x.name.localeCompare(y.name)) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------

export function totals(items) {
  let all = 0, buying = 0, have = 0, checked = 0, remaining = 0, unpriced = 0;
  const byDest = {};
  for (const it of items) {
    const c = it.overridePrice != null ? Number(it.overridePrice) : (it.estCost || 0);
    if (it.estCost == null && it.overridePrice == null) unpriced++;
    all += c;
    if (it.have) { have += c; continue; }
    buying += c;
    const d = it.dest || 'unassigned';
    byDest[d] = (byDest[d] || 0) + c;
    if (it.checked) checked += c; else remaining += c;
  }
  const round = (n) => Math.round(n * 100) / 100;
  return {
    all: round(all), buying: round(buying), have: round(have),
    checked: round(checked), remaining: round(remaining),
    byDest: Object.fromEntries(Object.entries(byDest).map(([k, v]) => [k, round(v)])),
    unpriced,
    count: items.length,
    buyCount: items.filter((i) => !i.have).length,
    checkedCount: items.filter((i) => !i.have && i.checked).length,
  };
}

// ---------------------------------------------------------------------------
// Destination helpers ("Instacart from ShopRite" vs "grab it in person")
// ---------------------------------------------------------------------------

export function destKey(dest, storeId) {
  if (!dest || dest === 'have') return dest || '';
  return dest + ':' + (storeId || '');
}

export function parseDest(k) {
  if (!k) return { dest: '', store: '' };
  const [dest, store] = String(k).split(':');
  return { dest, store: store || '' };
}

export function destLabel(item, stores) {
  if (item.have) return 'Already have';
  if (!item.dest) return 'Unassigned';
  const st = stores.find((s) => s.id === item.store);
  const where = st ? st.name : '';
  if (item.dest === 'instacart') return where ? `Instacart · ${where}` : 'Instacart';
  if (item.dest === 'in-person') return where ? `In person · ${where}` : 'In person';
  return item.dest;
}

// ---------------------------------------------------------------------------
// Instacart links
// ---------------------------------------------------------------------------

export function instacartSearchUrl(name, storeSlug) {
  const q = encodeURIComponent(String(name).replace(/\([^)]*\)/g, '').trim());
  if (storeSlug) return `https://www.instacart.com/store/${encodeURIComponent(storeSlug)}/s?k=${q}`;
  return `https://www.instacart.com/store/s?k=${q}`;
}

export function instacartStorefrontUrl(storeSlug) {
  return `https://www.instacart.com/store/${encodeURIComponent(storeSlug || '')}/storefront`;
}

/** Payload for the official Instacart "create shopping list page" endpoint. */
export function instacartListPayload(items, title, linkbackUrl) {
  return {
    title: title || 'ReciMe shopping list',
    link_type: 'shopping_list',
    expires_in: 30,
    line_items: items.map((it) => ({
      name: stripToProduct(it.name),
      display_text: `${fmtAmount(it.quantity, it.unit)} ${it.name}`.trim(),
      line_item_measurements: [{ quantity: Math.max(1, Math.round((it.quantity || 1) * 100) / 100), unit: normUnit(it.unit) || 'each' }],
      filters: {},
    })),
    landing_page_configuration: {
      partner_linkback_url: linkbackUrl || location.origin,
      enable_pantry_items: true,
    },
  };
}

function stripToProduct(name) {
  return String(name).replace(/\([^)]*\)/g, '').replace(/,.*$/, '').trim();
}

// ---------------------------------------------------------------------------
// Plain-text export (for texting the list, or handing to Claude)
// ---------------------------------------------------------------------------

export function listAsText(items, { includeHave = false, stores = [], title = 'Shopping list' } = {}) {
  const lines = [title, '='.repeat(title.length), ''];
  const groups = groupByAisle(items.filter((i) => includeHave || !i.have));
  for (const g of groups) {
    lines.push(`${g.meta.emoji} ${g.aisle.toUpperCase()}`);
    for (const it of g.items) {
      const tick = it.checked ? '[x]' : '[ ]';
      const amt = buyAmount(it);
      const need = needAmount(it);
      const cost = it.estCost != null ? `  (~$${it.estCost.toFixed(2)})` : '';
      const dest = it.dest ? `  <${destLabel(it, stores)}>` : '';
      lines.push(`  ${tick} ${amt} ${it.name}${amt !== need ? ` — need ${need}` : ''}${cost}${dest}`);
    }
    lines.push('');
  }
  const t = totals(items);
  lines.push(`Items to buy: ${t.buyCount}`);
  lines.push(`Estimated total: $${t.buying.toFixed(2)}`);
  if (t.have > 0) lines.push(`Saved by 'already have': $${t.have.toFixed(2)}`);
  return lines.join('\n');
}

/** Compact JSON payload for handing the list to Claude to build a cart. */
export function claudeHandoffPayload(items, plan, stores) {
  const buy = items.filter((i) => !i.have && i.dest !== 'have');
  return {
    kind: 'recime.cart-request',
    version: 1,
    requestedAt: nowISO(),
    stores: stores.map((s) => ({ name: s.name, instacartSlug: s.slug })),
    preferences: {
      lean: 'organic where the price difference is reasonable',
      optimise: 'lowest total across the fewest stores',
      notes: (store.settings.cartNotes || '').trim(),
    },
    storeRules: store.storeRules().filter((r) => r.enabled !== false).map((r) => ({
      what: r.label || r.match, store: (store.settings.stores.find((x) => x.id === r.store) || {}).name || r.store,
      how: r.dest === 'instacart' ? 'Instacart' : 'in person',
    })),
    week: plan ? plan.weekStart : null,
    meals: plan ? plan.slots.filter((s) => s.recipeId).map((s) => s.title || s.recipeId) : [],
    items: buy.map((i) => ({
      name: i.name,
      quantity: i.buyQty != null ? i.buyQty : i.quantity,
      unit: i.buyUnit || i.unit,
      recipeAmount: `${fmtQtyPlain(i.quantity)} ${i.unit}`.trim(),
      aisle: i.category,
      preferredDestination: i.dest ? destLabel(i, stores) : 'either',
      pinnedByHand: !!i.pinned,
      estimatedPrice: i.estCost,
    })),
    estimatedTotal: totals(buy).buying,
  };
}
