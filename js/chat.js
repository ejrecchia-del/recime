// ---------------------------------------------------------------------------
// chat.js — "what am I in the mood for" and "what can I make with what I have"
//
// Runs entirely offline against your own library. If you add an AI key in
// Settings it upgrades to a real model call, but everything below works
// without one.
// ---------------------------------------------------------------------------
import { normName, totalMinutes, uniq, fmtAmount } from './util.js';
import { featuresOf } from './suggest.js';

const CUISINES = ['american', 'italian', 'mexican', 'mediterranean', 'greek', 'thai', 'chinese', 'japanese', 'korean', 'indian', 'middle eastern'];

const MOODS = [
  { id: 'comfort', re: /comfort|cozy|cosy|hearty|warming|warm me|filling|stick to your ribs|hug|rainy|cold night|indulgent/, tags: ['comfort-food'], bias: { hearty: 2, slow: 1 }, say: 'something cozy' },
  { id: 'light', re: /light|fresh|clean|healthy|lean|summery|refreshing|not heavy|reset|detox/, tags: [], bias: { light: 3, veg: 1 }, say: 'something light' },
  { id: 'quick', re: /quick|fast|easy|weeknight|no time|in a hurry|15 min|20 min|30 min|lazy|minimal effort|simple/, tags: ['30-minute'], bias: { fast: 3 }, say: 'something quick' },
  { id: 'spicy', re: /spicy|hot|heat|fiery|kick|chili|chilli/, flavors: ['spicy'], say: 'something with heat' },
  { id: 'protein', re: /protein|gains|bulk|post[- ]?workout|macro/, tags: ['high-protein'], say: 'something high in protein' },
  { id: 'lowcarb', re: /low[- ]?carb|keto|no carbs|cut carbs/, tags: ['low-carb'], say: 'something low-carb' },
  { id: 'cheap', re: /cheap|budget|inexpensive|save money|affordable/, bias: { cheap: 2 }, say: 'something budget-friendly' },
  { id: 'impress', re: /impress|date night|guests|dinner party|special|fancy|celebrate|anniversary/, bias: { slow: 2, hard: 1 }, say: 'something worth showing off' },
  { id: 'mealprep', re: /meal ?prep|batch|leftovers|make ahead|freeze|lunches/, tags: ['meal-prep', 'freezer-friendly'], say: 'something that meal-preps well' },
  { id: 'onepot', re: /one ?pot|one ?pan|sheet ?pan|minimal cleanup|no dishes|lazy cleanup/, tags: ['one-pot', 'sheet-pan'], say: 'something with barely any cleanup' },
  { id: 'kids', re: /kid|child|picky|toddler|family friendly/, tags: ['kid-friendly'], say: 'something kid-friendly' },
  { id: 'veg', re: /vegetarian|meatless|no meat|veggie|plant[- ]based/, tags: ['vegetarian'], say: 'something vegetarian' },
  { id: 'vegan', re: /vegan|dairy[- ]free/, tags: ['vegan'], say: 'something vegan' },
  { id: 'gf', re: /gluten[- ]?free|celiac|coeliac/, tags: ['gluten-free'], say: 'something gluten-free' },
  { id: 'grill', re: /grill|bbq|barbecue|outdoor/, say: 'something for the grill' },
  { id: 'soup', re: /soup|stew|chili|broth|brothy/, say: 'something brothy' },
];

const PROTEIN_WORDS = [
  ['chicken', /\bchicken\b/], ['beef', /\bbeef\b|steak|burger/], ['pork', /\bpork\b|bacon|sausage/],
  ['turkey', /\bturkey\b/], ['salmon', /\bsalmon\b/], ['fish', /\bfish\b|\bcod\b|tilapia|halibut/],
  ['shrimp', /\bshrimp\b|prawn/], ['egg', /\begg\b|\beggs\b/], ['tofu', /\btofu\b|tempeh/],
  ['legume', /\bbeans?\b|lentil|chickpea/],
];

const MEALS = [
  ['breakfast', /breakfast|brunch|morning/], ['lunch', /lunch|midday/],
  ['dinner', /dinner|supper|tonight|evening|main/], ['snack', /snack|appetizer|app\b|nibble/],
  ['dessert', /dessert|sweet|treat|pudding/],
];

export function parseQuery(text) {
  const t = ' ' + String(text || '').toLowerCase() + ' ';
  const q = {
    raw: text, moods: [], tags: [], flavors: [], cuisines: [], proteins: [],
    mealType: null, maxMinutes: null, exclude: [], pantry: [], pantryMode: false,
    intent: 'find', bias: {},
  };

  // Explicit time constraints: "under 30 minutes", "in 20"
  const timeM = t.match(/(?:under|less than|within|in|max|<)\s*(\d{1,3})\s*(?:min|minute)/);
  if (timeM) q.maxMinutes = Number(timeM[1]);
  else if (/\b(\d{2})[- ]minute\b/.test(t)) q.maxMinutes = Number(t.match(/\b(\d{2})[- ]minute\b/)[1]);

  for (const m of MOODS) {
    if (m.re.test(t)) {
      q.moods.push(m);
      if (m.tags) q.tags.push(...m.tags);
      if (m.flavors) q.flavors.push(...m.flavors);
      if (m.bias) Object.assign(q.bias, m.bias);
    }
  }
  for (const c of CUISINES) if (t.includes(c)) q.cuisines.push(c);
  if (/\bmexican|taco|burrito|enchilada|quesadilla\b/.test(t)) q.cuisines.push('mexican');
  if (/\bitalian|pasta|risotto\b/.test(t)) q.cuisines.push('italian');
  if (/\basian\b/.test(t)) q.cuisines.push('thai', 'chinese', 'japanese', 'korean');

  for (const [name, re] of PROTEIN_WORDS) if (re.test(t)) q.proteins.push(name);
  for (const [name, re] of MEALS) if (re.test(t)) { q.mealType = name; break; }

  // "no mushrooms", "without cilantro", "hate olives"
  const exRe = /\b(?:no|without|hold the|skip the|avoid|hate|allergic to|can't eat|cant eat)\s+([a-z][a-z\s]{2,24}?)(?=[,.;]|\band\b|\bor\b|$)/g;
  let m2;
  while ((m2 = exRe.exec(t))) q.exclude.push(normName(m2[1]));

  // Pantry: "I have chicken, rice and broccoli" / "what can I make with X"
  if (/\b(i have|i've got|ive got|in my fridge|in the fridge|in my pantry|using|with just|what can i make|whats in|what's in|use up|leftover)\b/.test(t)) {
    q.pantryMode = true;
    const after = t.split(/\b(?:i have|i've got|ive got|make with|made with|using|with just|use up|in my fridge|in the fridge|in my pantry|leftover)\b/).pop();
    q.pantry = splitItems(after);
  }

  if (/\b(plan|week|meal plan|menu)\b/.test(t) && /\b(make|build|create|generate|plan)\b/.test(t)) q.intent = 'plan';
  if (/\b(add|put).*(list|cart)\b/.test(t)) q.intent = 'addToList';
  if (/\b(surprise|random|anything|whatever|you pick|you choose|dealer'?s choice)\b/.test(t)) q.intent = 'surprise';

  q.tags = uniq(q.tags); q.cuisines = uniq(q.cuisines); q.proteins = uniq(q.proteins);
  return q;
}

function splitItems(s) {
  return String(s || '')
    .split(/,| and | & |\+|\band\b|\/|\bplus\b/)
    .map((x) => normName(x.replace(/\b(some|a|an|the|left ?over|bit of|couple|few|lot of|bunch of|only|just|in the fridge|at home|left)\b/g, '')))
    .map((x) => x.trim())
    .filter((x) => x.length > 2 && x.length < 30);
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

const PANTRY_FREEBIES = new Set([
  'salt', 'kosher salt', 'black pepper', 'pepper', 'water', 'olive oil', 'extra-virgin olive oil',
  'extra virgin olive oil', 'oil', 'sugar', 'flour', 'all-purpose flour', 'baking soda',
  'baking powder', 'vanilla extract', 'cooking spray',
]);

export function pantryMatch(recipe, pantryKeys) {
  const have = [], missing = [];
  for (const ing of recipe.ingredients || []) {
    const n = normName(ing.item);
    const free = PANTRY_FREEBIES.has(n);
    const hit = free || pantryKeys.some((p) => n.includes(p) || p.includes(n));
    if (hit) have.push(ing); else missing.push(ing);
  }
  const core = (recipe.ingredients || []).filter((i) => !PANTRY_FREEBIES.has(normName(i.item)));
  const coreMissing = missing.filter((i) => !PANTRY_FREEBIES.has(normName(i.item)));
  return {
    have, missing, coreMissing,
    pct: core.length ? Math.round(((core.length - coreMissing.length) / core.length) * 100) : 100,
  };
}

export function searchRecipes(recipes, q, { limit = 12 } = {}) {
  const pantryKeys = q.pantry.map(normName).filter(Boolean);
  const results = [];

  for (const r of recipes) {
    if (r.frequency === 'never-again') continue;
    const feats = featuresOf(r);
    const hay = (r.title + ' ' + r.description + ' ' + (r.tags || []).join(' ') + ' ' +
      (r.ingredients || []).map((i) => i.item).join(' ')).toLowerCase();

    // hard filters
    if (q.mealType && r.mealType !== q.mealType) continue;
    if (q.maxMinutes && totalMinutes(r) > q.maxMinutes) continue;
    if (q.exclude.some((x) => x && hay.includes(x))) continue;
    for (const t of q.tags) {
      if (['vegetarian', 'vegan', 'gluten-free', 'low-carb'].includes(t) && !(r.tags || []).includes(t)) {
        // dietary tags are hard requirements
        if (!(t === 'vegetarian' && (r.tags || []).includes('vegan'))) { r.__skip = true; }
      }
    }
    if (r.__skip) { delete r.__skip; continue; }

    let s = 0;
    for (const t of q.tags) if ((r.tags || []).includes(t)) s += 2.5;
    for (const c of q.cuisines) if ((r.cuisine || '').toLowerCase() === c) s += 3;
    for (const p of q.proteins) if (feats.has('protein:' + p) || hay.includes(p)) s += 3;
    for (const f of q.flavors) if (feats.has('flavor:' + f)) s += 2;

    const mins = totalMinutes(r);
    if (q.bias.fast) s += mins <= 30 ? q.bias.fast : mins <= 45 ? 0.5 : -1.5;
    if (q.bias.slow) s += mins > 45 ? q.bias.slow : 0;
    if (q.bias.light) s += (r.nutritionPerServing?.calories || 600) <= 480 ? q.bias.light : -1;
    if (q.bias.hearty) s += (r.nutritionPerServing?.calories || 400) >= 550 ? q.bias.hearty : 0;
    if (q.bias.veg) s += (r.ingredients || []).filter((i) => i.category === 'Produce').length * 0.3;
    if (q.bias.hard) s += r.difficulty === 'hard' ? 1.5 : r.difficulty === 'medium' ? 0.7 : 0;

    // free-text keyword hits from whatever's left of the query
    const words = String(q.raw || '').toLowerCase().match(/[a-z]{4,}/g) || [];
    for (const w of words) {
      if (STOPWORDS.has(w)) continue;
      if (r.title.toLowerCase().includes(w)) s += 2.2;
      else if (hay.includes(w)) s += 0.7;
    }

    let pm = null;
    if (q.pantryMode && pantryKeys.length) {
      pm = pantryMatch(r, pantryKeys);
      s += (pm.pct / 100) * 9;
      s -= pm.coreMissing.length * 0.9;
      if (pm.coreMissing.length === 0) s += 4;
    }

    // gentle nudge toward things you already like
    if (r.favorite) s += 0.8;
    if (r.rating >= 4) s += 0.6;
    if (r.frequency === 'every-week') s += 0.5;

    if (s > 0) results.push({ recipe: r, score: s, pantry: pm });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

const STOPWORDS = new Set(['what', 'want', 'like', 'make', 'have', 'some', 'something', 'anything', 'good', 'best', 'give', 'show', 'find', 'looking', 'mood', 'tonight', 'dinner', 'recipe', 'recipes', 'meal', 'need', 'with', 'that', 'this', 'from', 'your', 'about', 'would', 'could', 'please', 'really', 'maybe', 'think', 'know', 'help', 'idea', 'ideas']);

// ---------------------------------------------------------------------------
// Response text
// ---------------------------------------------------------------------------

export function describeQuery(q, count) {
  const bits = [];
  if (q.pantryMode && q.pantry.length) {
    return count
      ? `With ${humanList(q.pantry.slice(0, 6))}${q.pantry.length > 6 ? ' and the rest' : ''}, here's what's within reach:`
      : `I couldn't find anything that leans on ${humanList(q.pantry.slice(0, 4))}. Try naming a protein or a vegetable and I'll look again.`;
  }
  if (q.moods.length) bits.push(q.moods.map((m) => m.say).join(', '));
  if (q.cuisines.length) bits.push(q.cuisines.join(' or ') + ' food');
  if (q.proteins.length) bits.push('with ' + humanList(q.proteins));
  if (q.maxMinutes) bits.push('in under ' + q.maxMinutes + ' minutes');
  if (q.exclude.length) bits.push('no ' + humanList(q.exclude));

  if (!count) {
    return bits.length
      ? `Nothing in your library matches ${bits.join(', ')} right now. Want me to loosen one of those?`
      : `I didn't catch what you're after. Try something like "quick chicken dinner", "cozy and vegetarian", or "I have eggs, spinach and feta".`;
  }
  if (!bits.length) return `Here's what stood out:`;
  return `Looking for ${bits.join(', ')} — these fit:`;
}

function humanList(arr) {
  const a = arr.filter(Boolean);
  if (!a.length) return '';
  if (a.length === 1) return a[0];
  if (a.length === 2) return a[0] + ' and ' + a[1];
  return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
}

export const SUGGESTED_PROMPTS = [
  'Something quick with chicken',
  'Cozy and vegetarian',
  'I have eggs, spinach and feta',
  'Light dinner under 30 minutes',
  'High protein, no shellfish',
  'What should we make tonight?',
  'Something spicy for the weekend',
  'Meal prep lunches',
];

// ---------------------------------------------------------------------------
// Optional AI upgrade
// ---------------------------------------------------------------------------

export async function aiChat(messages, recipes, settings) {
  if (!settings.aiKey || !settings.syncUrl) return null;
  const catalog = recipes.slice(0, 220).map((r) => ({
    id: r.id, title: r.title, cuisine: r.cuisine, meal: r.mealType,
    minutes: totalMinutes(r), tags: r.tags,
    key: (r.ingredients || []).slice(0, 8).map((i) => i.item),
    rating: r.rating, favorite: r.favorite,
  }));
  const url = String(settings.syncUrl).replace(/\/+$/, '') + '/functions/v1/recime-ai';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + settings.syncKey },
    body: JSON.stringify({ messages, catalog }),
  });
  if (!res.ok) throw new Error('AI request failed: ' + res.status);
  return res.json();
}
