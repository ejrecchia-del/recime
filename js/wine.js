// ---------------------------------------------------------------------------
// wine.js — what to drink with the week, and what a case actually costs
//
// Two jobs, kept apart on purpose:
//
//   1. PAIRING. Given the approved week, work out which *styles* of wine to
//      buy and which night each is for. This is offline, deterministic and
//      instant — no network, nothing to break. Classic pairing logic: match
//      acid to acid, weight to weight, and let sweetness handle heat.
//
//   2. THE CASE. Total Wine's discount is in-person only — 10% at six bottles,
//      15-20% at twelve — so the maths matter more than the browsing. The
//      target here is an *effective* price per bottle after the discount,
//      which means a $15 shelf tag can still land inside a $12 budget.
//
// Specific bottles are researched by hand-off, not guessed at here.
// ---------------------------------------------------------------------------
import { uid, nowISO } from './util.js';

// --- Case discount ----------------------------------------------------------
// Eric's stores: 10% off six, 15-20% off twelve. We assume the conservative
// 15% for twelve so the estimate never flatters itself.
export const CASE_TIERS = [
  { bottles: 12, discount: 0.15, label: 'Case of 12', note: '15–20% off — assume 15% until the receipt says otherwise' },
  { bottles: 6, discount: 0.10, label: 'Six bottles', note: '10% off' },
  { bottles: 0, discount: 0, label: 'Single bottles', note: 'no discount' },
];

export function tierFor(bottles) {
  return CASE_TIERS.find((t) => bottles >= t.bottles) || CASE_TIERS[CASE_TIERS.length - 1];
}

/**
 * What can I pay on the shelf and still hit my per-bottle target?
 * At 15% off, a $12 target lets you reach for a $14 bottle.
 */
export function shelfCeiling(targetPerBottle, bottles) {
  const t = tierFor(bottles);
  const ceiling = targetPerBottle / (1 - t.discount);
  return { tier: t, ceiling: Math.round(ceiling * 100) / 100 };
}

export function caseMath(bottles, avgShelfPrice) {
  const t = tierFor(bottles);
  const gross = bottles * avgShelfPrice;
  const net = gross * (1 - t.discount);
  const next = CASE_TIERS.filter((x) => x.bottles > bottles).sort((a, b) => a.bottles - b.bottles)[0];
  return {
    tier: t,
    bottles,
    gross: Math.round(gross * 100) / 100,
    net: Math.round(net * 100) / 100,
    saved: Math.round((gross - net) * 100) / 100,
    perBottle: bottles ? Math.round((net / bottles) * 100) / 100 : 0,
    // "Two more bottles and the discount goes from 10% to 15%" — the single
    // most useful thing this can tell you while you're standing in the aisle.
    nextTier: next ? { ...next, need: next.bottles - bottles } : null,
  };
}

// --- Wine styles ------------------------------------------------------------
// Body/acid/tannin/sweet are 1-5. `look` is what to actually scan the shelf
// for; producers are examples that turn up almost everywhere, not a shopping
// list — the hand-off finds what's on the shelf that week.
export const STYLES = [
  // --- Reds, light to bold
  { id: 'pinot-noir', name: 'Pinot Noir', colour: 'red', body: 2, acid: 4, tannin: 2, sweet: 1,
    abv: '12.5–14%', notes: 'cherry, mushroom, tea leaf',
    look: 'Willamette, Sonoma Coast, Burgundy village, or Chilean Casablanca for value',
    value: 'Chile and Romania punch far above the price here' },
  { id: 'gamay', name: 'Gamay / Beaujolais', colour: 'red', body: 2, acid: 4, tannin: 2, sweet: 1,
    abv: '12–13%', notes: 'raspberry, violet, crushed rock',
    look: 'Beaujolais-Villages or a named cru like Morgon',
    value: 'One of the best cheap reds in any shop' },
  { id: 'sangiovese', name: 'Sangiovese / Chianti', colour: 'red', body: 3, acid: 5, tannin: 3, sweet: 1,
    abv: '13–14%', notes: 'sour cherry, dried herb, leather',
    look: 'Chianti Classico, Rosso di Montalcino',
    value: 'The tomato wine. Acid in the glass meets acid on the plate' },
  { id: 'barbera', name: 'Barbera', colour: 'red', body: 3, acid: 5, tannin: 2, sweet: 1,
    abv: '13–14.5%', notes: 'black cherry, liquorice, no grip',
    look: 'Barbera d\'Asti or d\'Alba',
    value: 'High acid, low tannin — friendlier than Chianti with tomato' },
  { id: 'montepulciano', name: 'Montepulciano d\'Abruzzo', colour: 'red', body: 3, acid: 4, tannin: 3, sweet: 1,
    abv: '13%', notes: 'plum, black pepper, dried fig',
    look: 'anything from Abruzzo',
    value: 'The reliable $10 red. Pizza, pasta, weeknights' },
  { id: 'grenache', name: 'Grenache / Garnacha', colour: 'red', body: 3, acid: 3, tannin: 2, sweet: 1,
    abv: '14–15%', notes: 'strawberry, white pepper, warm spice',
    look: 'Spanish Garnacha, Côtes du Rhône',
    value: 'Spain sells this for eleven dollars and it drinks like twenty' },
  { id: 'rioja', name: 'Rioja / Tempranillo', colour: 'red', body: 3, acid: 4, tannin: 3, sweet: 1,
    abv: '13.5–14%', notes: 'red plum, vanilla, dill from the oak',
    look: 'Crianza is the value sweet spot; Reserva if you want more',
    value: 'Crianza at $12–14 is one of wine\'s great bargains' },
  { id: 'malbec', name: 'Malbec', colour: 'red', body: 4, acid: 3, tannin: 3, sweet: 1,
    abv: '13.5–14.5%', notes: 'blackberry, cocoa, soft edges',
    look: 'Mendoza, especially Uco Valley',
    value: 'Hard to buy a bad one under $15' },
  { id: 'zinfandel', name: 'Zinfandel', colour: 'red', body: 4, acid: 3, tannin: 3, sweet: 2,
    abv: '14–15.5%', notes: 'bramble fruit, sweet spice, a little jammy',
    look: 'Lodi or Dry Creek old vine',
    value: 'The barbecue wine. Handles smoke and sweet glaze' },
  { id: 'syrah', name: 'Syrah / Shiraz', colour: 'red', body: 4, acid: 3, tannin: 4, sweet: 1,
    abv: '13.5–15%', notes: 'black pepper, olive, smoked meat',
    look: 'Northern Rhône for pepper, Barossa for power',
    value: 'Chile and Washington are the value plays' },
  { id: 'cabernet', name: 'Cabernet Sauvignon', colour: 'red', body: 5, acid: 3, tannin: 5, sweet: 1,
    abv: '13.5–15%', notes: 'blackcurrant, cedar, firm grip',
    look: 'Paso Robles, Columbia Valley, Chilean Maipo',
    value: 'Under $15 look to Chile; California gets thin at that price' },
  { id: 'nebbiolo', name: 'Nebbiolo', colour: 'red', body: 3, acid: 5, tannin: 5, sweet: 1,
    abv: '14%', notes: 'rose, tar, dried cherry',
    look: 'Langhe Nebbiolo is the affordable door in',
    value: 'A special-occasion grape; rarely good under $18' },

  // --- Whites, crisp to rich
  { id: 'muscadet', name: 'Muscadet', colour: 'white', body: 1, acid: 5, tannin: 1, sweet: 1,
    abv: '11.5–12%', notes: 'lemon, sea salt, oyster shell',
    look: 'Sèvre et Maine sur lie',
    value: 'Shellfish wine. Almost always under $15' },
  { id: 'sauvignon-blanc', name: 'Sauvignon Blanc', colour: 'white', body: 2, acid: 5, tannin: 1, sweet: 1,
    abv: '12.5–13.5%', notes: 'grapefruit, cut grass, gooseberry',
    look: 'Marlborough for punch, Loire for restraint',
    value: 'Chile and South Africa are the value versions' },
  { id: 'gruner', name: 'Grüner Veltliner', colour: 'white', body: 2, acid: 5, tannin: 1, sweet: 1,
    abv: '12–13%', notes: 'green apple, white pepper, celery leaf',
    look: 'Austrian, often in a litre bottle',
    value: 'The litre bottles are the best value in the shop' },
  { id: 'albarino', name: 'Albariño', colour: 'white', body: 2, acid: 5, tannin: 1, sweet: 1,
    abv: '12.5–13%', notes: 'nectarine, lime zest, saline finish',
    look: 'Rías Baixas',
    value: 'Rarely disappointing at $13–16' },
  { id: 'vermentino', name: 'Vermentino', colour: 'white', body: 2, acid: 4, tannin: 1, sweet: 1,
    abv: '12.5–13%', notes: 'pear, almond skin, herb',
    look: 'Sardinia or Tuscan coast',
    value: 'Underpriced because nobody can pronounce it' },
  { id: 'pinot-grigio', name: 'Pinot Grigio', colour: 'white', body: 2, acid: 4, tannin: 1, sweet: 1,
    abv: '12–13%', notes: 'pear, lemon, quiet',
    look: 'Alto Adige or Friuli if you want it to taste of something',
    value: 'The cheap ones are watery; spend $13+ or skip it' },
  { id: 'riesling-dry', name: 'Dry Riesling', colour: 'white', body: 2, acid: 5, tannin: 1, sweet: 1,
    abv: '11–12.5%', notes: 'lime, slate, jasmine',
    look: 'Alsace, Clare Valley, Finger Lakes',
    value: 'Wildly underpriced for the quality' },
  { id: 'riesling-offdry', name: 'Off-dry Riesling', colour: 'white', body: 2, acid: 5, tannin: 1, sweet: 3,
    abv: '9–11%', notes: 'peach, honeysuckle, a whisper of sugar',
    look: 'German Kabinett, or Washington State',
    value: 'The one wine that beats chilli heat. Low alcohol too' },
  { id: 'chenin', name: 'Chenin Blanc', colour: 'white', body: 3, acid: 4, tannin: 1, sweet: 2,
    abv: '12–13.5%', notes: 'quince, wet wool, honey',
    look: 'South African, or Vouvray from the Loire',
    value: 'South Africa at $12 is remarkable' },
  { id: 'chardonnay-unoaked', name: 'Unoaked Chardonnay', colour: 'white', body: 3, acid: 4, tannin: 1, sweet: 1,
    abv: '12.5–13.5%', notes: 'apple, hazelnut, chalk',
    look: 'Chablis, Mâcon, or anything labelled unoaked',
    value: 'Mâcon-Villages is the affordable Chablis' },
  { id: 'chardonnay-oaked', name: 'Oaked Chardonnay', colour: 'white', body: 4, acid: 3, tannin: 1, sweet: 1,
    abv: '13.5–14.5%', notes: 'baked apple, butter, vanilla, toast',
    look: 'Sonoma, Central Coast',
    value: 'The cream-sauce wine' },
  { id: 'gewurz', name: 'Gewürztraminer', colour: 'white', body: 3, acid: 3, tannin: 1, sweet: 3,
    abv: '13–14%', notes: 'lychee, rose, ginger',
    look: 'Alsace',
    value: 'Curry wine. Nothing else does that job as well' },

  // --- Rosé, sparkling, sweet
  { id: 'rose-dry', name: 'Dry Rosé', colour: 'rose', body: 2, acid: 4, tannin: 1, sweet: 1,
    abv: '12–13%', notes: 'strawberry, citrus peel, dry finish',
    look: 'Provence for elegance, Spanish rosado for fruit',
    value: 'Spanish and Portuguese rosé at $10–12 is the value' },
  { id: 'prosecco', name: 'Prosecco', colour: 'sparkling', body: 2, acid: 4, tannin: 1, sweet: 2,
    abv: '11%', notes: 'green apple, pear, soft bubble',
    look: 'Extra Dry is slightly sweeter than Brut, confusingly',
    value: 'The everyday bubble. $12–15' },
  { id: 'cava', name: 'Cava', colour: 'sparkling', body: 2, acid: 5, tannin: 1, sweet: 1,
    abv: '11.5–12%', notes: 'lemon, bread crust, fine bead',
    look: 'Brut or Brut Nature, Reserva if you see it',
    value: 'Champagne method at a third of the price' },
  { id: 'moscato', name: 'Moscato d\'Asti', colour: 'sweet', body: 1, acid: 4, tannin: 1, sweet: 5,
    abv: '5–6%', notes: 'orange blossom, peach, gentle fizz',
    look: 'Asti, Piedmont',
    value: 'Dessert wine that is barely alcoholic — good with fruit puddings' },
  { id: 'port', name: 'Tawny Port', colour: 'sweet', body: 5, acid: 3, tannin: 3, sweet: 5,
    abv: '19–20%', notes: 'walnut, caramel, dried fig',
    look: '10 Year Tawny',
    value: 'Keeps a month open. Chocolate desserts, cheese' },
];

export function styleOf(id) { return STYLES.find((s) => s.id === id); }

// --- Pairing ----------------------------------------------------------------
// Each rule looks at the dish and, if it matches, proposes styles in order of
// confidence. Rules are checked top to bottom and the first three distinct
// styles win, so put the sharpest rules first.
const RULES = [
  { id: 'dessert-choc', why: 'Chocolate wants something sweeter than itself, or it tastes sour.',
    test: (d) => d.meal === 'dessert' && /chocolate|brownie|fudge|cocoa/.test(d.hay),
    styles: ['port', 'zinfandel'] },
  { id: 'dessert-fruit', why: 'Fruit puddings go with a light, sweet, low-alcohol fizz.',
    test: (d) => d.meal === 'dessert',
    styles: ['moscato', 'prosecco', 'port'] },

  { id: 'spicy-fish', why: 'Heat needs a little sweetness, and fish needs the wine to stay light.',
    test: (d) => d.spicy && d.protein === 'fish',
    styles: ['riesling-offdry', 'gruner', 'rose-dry'] },
  { id: 'spicy', why: 'A touch of sugar and low alcohol cool the heat; tannin and alcohol amplify it.',
    test: (d) => d.spicy,
    styles: ['riesling-offdry', 'gewurz', 'gamay'] },
  { id: 'curry', why: 'Aromatic spice needs an aromatic wine — Alsace was built for this.',
    test: (d) => /curry|masala|tikka|korma|coconut milk|thai|lemongrass/.test(d.hay),
    styles: ['gewurz', 'riesling-offdry', 'gruner'] },

  { id: 'tomato', why: 'Tomato is acidic. A low-acid wine tastes flat beside it, so match acid with acid.',
    test: (d) => d.tomato,
    styles: ['sangiovese', 'barbera', 'montepulciano'] },

  // Fish is judged before anything that keys off the word "grill", or a
  // grilled salmon ends up with a Zinfandel.
  { id: 'oily-fish', why: 'Salmon has enough weight for a light red — and Pinot has the acid to cut it.',
    test: (d) => /\b(salmon|tuna|mackerel|sardine|trout)\b/.test(d.ings),
    styles: ['pinot-noir', 'rose-dry', 'chardonnay-unoaked'] },
  { id: 'shellfish', why: 'Briny food, briny wine. Nothing oaked anywhere near it.',
    test: (d) => /\b(shrimp|prawn|scallop|clam|mussel|crab|lobster|oyster)\b/.test(d.ings),
    styles: ['muscadet', 'albarino', 'cava'] },
  { id: 'white-fish', why: 'Delicate fish gets steamrollered by anything heavy.',
    test: (d) => d.protein === 'fish',
    styles: ['albarino', 'vermentino', 'sauvignon-blanc'] },

  { id: 'chili', why: 'Chilli is sweet, smoky and a bit spicy at once — it wants juicy fruit, not grip.',
    test: (d) => /\bchill?i\b/.test(d.title) && d.meal !== 'dessert',
    styles: ['grenache', 'zinfandel', 'rose-dry'] },

  // "Grilled cheese" is not barbecue. Require actual meat on the fire.
  { id: 'bbq', why: 'Smoke and sweet glaze need bramble fruit and a bit of warmth.',
    test: (d) => ['beef', 'pork', 'lamb', 'chicken'].includes(d.protein)
      && /\b(barbecue|bbq|grilled|grill|smoked|smoky|charred|pulled pork|brisket)\b/.test(d.hay)
      && !/grilled cheese/.test(d.hay),
    styles: ['zinfandel', 'syrah', 'malbec'] },

  { id: 'red-meat', why: 'Tannin binds to fat and protein. Big meat, big grip.',
    test: (d) => d.protein === 'beef' || d.protein === 'lamb',
    styles: ['cabernet', 'malbec', 'syrah'] },

  { id: 'cream', why: 'Richness likes either matching weight or acid to cut it. Oak matches.',
    test: (d) => d.creamy,
    styles: ['chardonnay-oaked', 'chenin', 'chardonnay-unoaked'] },

  { id: 'mushroom', why: 'Earth to earth — the classic Pinot pairing.',
    test: (d) => /mushroom|truffle|lentil|farro|barley/.test(d.hay),
    styles: ['pinot-noir', 'nebbiolo', 'gamay'] },

  { id: 'pork', why: 'Pork sits between white and red meat, so a light red or a rich white both work.',
    test: (d) => d.protein === 'pork',
    styles: ['pinot-noir', 'grenache', 'chenin'] },

  { id: 'mexican', why: 'Bright fruit and gentle tannin beside chilli, lime and cumin.',
    test: (d) => /taco|burrito|enchilada|fajita|carnitas|chipotle|salsa|black bean/.test(d.hay),
    styles: ['grenache', 'rose-dry', 'zinfandel'] },

  { id: 'roast-chicken', why: 'The most forgiving thing on the table. Almost anything mid-weight works.',
    test: (d) => d.protein === 'chicken' && /roast|bake|sheet.?pan|braise/.test(d.hay),
    styles: ['chardonnay-unoaked', 'pinot-noir', 'grenache'] },
  { id: 'chicken', why: 'Light meat, medium weight, keep the tannin down.',
    test: (d) => d.protein === 'chicken',
    styles: ['pinot-noir', 'chardonnay-unoaked', 'rose-dry'] },

  { id: 'green-veg', why: 'Green, herbal food wants a green, herbal wine.',
    test: (d) => d.veg && /asparagus|pea|spinach|kale|broccoli|herb|pesto|green bean|zucchini/.test(d.hay),
    styles: ['sauvignon-blanc', 'gruner', 'vermentino'] },
  { id: 'veg', why: 'Vegetable-led food does better with acid than with tannin.',
    test: (d) => d.veg,
    styles: ['gruner', 'gamay', 'vermentino'] },

  { id: 'pasta-cream', why: 'Weight for weight.',
    test: (d) => d.pasta && d.creamy, styles: ['chardonnay-oaked', 'chardonnay-unoaked'] },
  { id: 'pasta', why: 'Italian food, Italian wine — it is a cliché because it works.',
    test: (d) => d.pasta, styles: ['sangiovese', 'barbera', 'vermentino'] },

  { id: 'brunch', why: 'Eggs are hard on wine; bubbles are the reliable answer.',
    test: (d) => d.meal === 'breakfast', styles: ['prosecco', 'cava', 'rose-dry'] },

  { id: 'default', why: 'A safe middle: enough acid for most food, not enough tannin to fight it.',
    test: () => true, styles: ['grenache', 'chardonnay-unoaked', 'rose-dry'] },
];

/** Boil a recipe down to the handful of things that actually drive a pairing. */
export function dishProfile(recipe) {
  const ings = (recipe.ingredients || []).map((i) => String(i.item).toLowerCase()).join(' ');
  const hay = [recipe.title, recipe.description, (recipe.tags || []).join(' '), ings, (recipe.steps || []).join(' ')]
    .join(' ').toLowerCase();

  let protein = 'none';
  if (/\b(beef|steak|brisket|short rib|ground beef)\b/.test(ings)) protein = 'beef';
  else if (/\b(lamb)\b/.test(ings)) protein = 'lamb';
  else if (/\b(pork|bacon|sausage|chorizo|ham|prosciutto|pancetta)\b/.test(ings)) protein = 'pork';
  else if (/\b(chicken|turkey|duck)\b/.test(ings)) protein = 'chicken';
  else if (/\b(salmon|tuna|cod|halibut|tilapia|shrimp|prawn|scallop|crab|clam|mussel|fish)\b/.test(ings)) protein = 'fish';

  return {
    hay,
    ings,
    title: String(recipe.title || '').toLowerCase(),
    meal: recipe.mealType || 'dinner',
    protein,
    veg: protein === 'none',
    // No trailing \b — "crushed tomatoes" must match as readily as "tomato".
    tomato: /\b(tomato|marinara|passata|pizza sauce|sun-dried tomato)/.test(ings),
    creamy: /\b(cream|heavy cream|creme fraiche|mascarpone|butter sauce|alfredo|cheese sauce|coconut milk)\b/.test(ings)
      || /\bcreamy\b/.test(hay),
    spicy: /\b(chipotle|jalapeno|serrano|habanero|sriracha|gochujang|harissa|cayenne|chili flake|red pepper flake|hot sauce|curry paste|doubanjiang|chili bean|chili oil|chili garlic|chili crisp|szechuan|sichuan peppercorn)\b/.test(ings)
      || /\b(spicy|fiery|hot and numbing)\b/.test(hay),
    pasta: /\b(pasta|spaghetti|penne|rigatoni|linguine|orzo|lasagna|gnocchi|risotto)\b/.test(ings),
  };
}

/** Up to three styles for one dish, best first, each with the reason. */
export function pairRecipe(recipe, { max = 3 } = {}) {
  const d = dishProfile(recipe);
  const picked = [];
  const why = [];
  for (const rule of RULES) {
    if (picked.length >= max) break;
    let ok = false;
    try { ok = rule.test(d); } catch { ok = false; }
    if (!ok) continue;
    for (const s of rule.styles) {
      if (picked.length >= max) break;
      if (picked.includes(s)) continue;
      picked.push(s);
      why.push({ style: s, why: rule.why, rule: rule.id });
    }
  }
  return {
    recipe,
    profile: d,
    picks: picked.map((id) => ({ style: styleOf(id), why: (why.find((w) => w.style === id) || {}).why })),
  };
}

/**
 * The week's wine run. Groups the nights by the style they want, so you buy
 * three bottles of one thing rather than seven bottles of seven things.
 */
export function planWine(entries, { bottles = 12, targetPerBottle = 12 } = {}) {
  const perNight = entries
    .filter((e) => e.recipe && e.recipe.mealType !== 'dessert')
    .map((e) => ({ ...e, pairing: pairRecipe(e.recipe) }));

  // Score every style by how often it's the first choice across the week.
  const score = new Map();
  for (const n of perNight) {
    n.pairing.picks.forEach((p, i) => {
      if (!p.style) return;
      const w = i === 0 ? 3 : i === 1 ? 1.5 : 0.75;
      score.set(p.style.id, (score.get(p.style.id) || 0) + w);
    });
  }

  const ranked = [...score.entries()]
    .map(([id, s]) => ({ style: styleOf(id), score: s }))
    .filter((x) => x.style)
    .sort((a, b) => b.score - a.score);

  // Spread the bottles across the top styles, weighted by score, but never
  // more than 4 of any one thing — variety is half the point of a case.
  const total = ranked.reduce((t, r) => t + r.score, 0) || 1;
  const buy = [];
  let left = bottles;
  for (const r of ranked) {
    if (left <= 0) break;
    let n = Math.round((r.score / total) * bottles);
    n = Math.max(1, Math.min(4, n, left));
    buy.push({ style: r.style, bottles: n });
    left -= n;
  }
  // Anything left over tops up the best-scoring styles.
  let i = 0;
  while (left > 0 && buy.length) {
    if (buy[i % buy.length].bottles < 4) { buy[i % buy.length].bottles++; left--; }
    else if (buy.every((b) => b.bottles >= 4)) break;
    i++;
  }

  const { tier, ceiling } = shelfCeiling(targetPerBottle, bottles);
  const colours = buy.reduce((acc, b) => {
    acc[b.style.colour] = (acc[b.style.colour] || 0) + b.bottles;
    return acc;
  }, {});

  return {
    perNight,
    buy,
    bottles: buy.reduce((t, b) => t + b.bottles, 0),
    colours,
    tier,
    shelfCeiling: ceiling,
    targetPerBottle,
    math: caseMath(buy.reduce((t, b) => t + b.bottles, 0), Math.min(ceiling, targetPerBottle / (1 - tier.discount))),
  };
}

/** Turn the plan into shopping-list rows, routed in person. */
export function wineListItems(winePlan, storeId) {
  return winePlan.buy.map((b) => ({
    id: uid('shop'),
    key: 'wine ' + b.style.id,
    name: b.style.name,
    displayName: b.style.name,
    quantity: b.bottles,
    unit: 'bottle',
    category: 'Wine & Beer',
    dest: 'in-person',
    store: storeId || '',
    wine: { styleId: b.style.id, look: b.style.look, notes: b.style.notes, abv: b.style.abv },
    estCost: Math.round(b.bottles * winePlan.shelfCeiling * (1 - winePlan.tier.discount) * 100) / 100,
    priceInfo: { unitPrice: winePlan.shelfCeiling, per: 'bottle', confidence: 'target', note: 'your target, not a quote' },
    have: false, checked: false, manual: false, pinned: false,
    createdAt: nowISO(), updatedAt: nowISO(), deleted: false,
  }));
}

/** Everything Claude needs to go and find actual bottles. */
export function wineHandoffPayload(winePlan, settings) {
  return {
    task: 'find-wine',
    when: nowISO(),
    store: (settings.stores || []).find((s) => s.wine) || null,
    budget: {
      targetPerBottleAfterDiscount: winePlan.targetPerBottle,
      shelfCeiling: winePlan.shelfCeiling,
      caseTier: winePlan.tier,
      note: 'Case discount is in person only — 10% at 6 bottles, 15–20% at 12.',
    },
    buy: winePlan.buy.map((b) => ({
      style: b.style.name,
      bottles: b.bottles,
      lookFor: b.style.look,
      tastesLike: b.style.notes,
      typicalAbv: b.style.abv,
      valueNote: b.style.value,
    })),
    forMeals: winePlan.perNight.map((n) => ({
      day: n.day || '',
      meal: n.recipe.title,
      styles: n.pairing.picks.map((p) => p.style && p.style.name).filter(Boolean),
    })),
    wants: [
      'Real bottles on the shelf this week, not a generic recommendation.',
      'Producer, vintage, region, shelf price, ABV, and a one-line taste note for each.',
      'Stay at or under the shelf ceiling so the post-discount price hits the target.',
      'Flag anything on a deeper promotion worth breaking the pattern for.',
    ],
  };
}
