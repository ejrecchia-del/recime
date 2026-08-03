// ---------------------------------------------------------------------------
// suggest.js — learns what you two actually like, and finds more of it
//
// Every recipe becomes a bag of features (cuisine, tags, protein, key
// ingredients, time bucket). Your ratings, favorites and "eat every week"
// marks give each feature a weight. Candidate recipes are scored against that
// profile. No server, no model — it just works offline.
// ---------------------------------------------------------------------------
import { normName, totalMinutes, uniq } from './util.js';
import store, { verdictOf, eatingType } from './store.js';

const PROTEINS = [
  ['chicken', /chicken|poultry/], ['beef', /\bbeef\b|steak|sirloin|brisket|bulgogi|chuck/],
  ['pork', /\bpork\b|bacon|ham |prosciutto|chorizo/], ['turkey', /turkey/],
  ['salmon', /salmon/], ['whitefish', /\bcod\b|halibut|tilapia|haddock|sea bass|snapper/],
  ['shrimp', /shrimp|prawn/], ['other-seafood', /scallop|mussel|clam|crab|lobster|tuna|squid/],
  ['egg', /\beggs?\b/], ['tofu', /tofu|tempeh|seitan/],
  ['legume', /lentil|chickpea|black bean|white bean|cannellini|kidney bean|pinto|garbanzo|edamame/],
  ['dairy-veg', /paneer|halloumi|ricotta|cottage cheese/],
];

const FLAVOURS = [
  ['spicy', /chili|chipotle|jalapeno|jalapeño|sriracha|harissa|cayenne|gochujang|curry paste|red pepper flake|hot sauce|arbol|serrano/],
  ['garlicky', /garlic/], ['citrus', /lemon|lime|orange zest/],
  ['herby', /basil|cilantro|parsley|dill|mint|oregano|thyme|rosemary|sage/],
  ['creamy', /cream|yogurt|coconut milk|cheese|butter|tahini/],
  ['smoky', /smoked paprika|chipotle|smoked|bbq|barbecue/],
  ['umami', /soy sauce|tamari|miso|fish sauce|parmesan|mushroom|anchovy|worcestershire/],
  ['sweet-savory', /honey|maple|brown sugar|hoisin|teriyaki/],
  ['tomato', /tomato|marinara|passata/],
  ['cheesy', /mozzarella|cheddar|parmesan|feta|cotija|gruyere/],
];

const TIME_BUCKETS = [
  ['fast', (m) => m <= 30], ['medium', (m) => m > 30 && m <= 55], ['slow', (m) => m > 55],
];

export function featuresOf(r) {
  const f = new Set();
  f.add('cuisine:' + (r.cuisine || 'Other'));
  f.add('meal:' + (r.mealType || 'dinner'));
  f.add('difficulty:' + (r.difficulty || 'easy'));
  for (const t of r.tags || []) f.add('tag:' + t);

  const ingText = (r.ingredients || []).map((i) => i.item).join(' | ').toLowerCase();
  const allText = (r.title + ' ' + r.description + ' ' + ingText).toLowerCase();

  for (const [name, re] of PROTEINS) if (re.test(allText)) f.add('protein:' + name);
  for (const [name, re] of FLAVOURS) if (re.test(allText)) f.add('flavor:' + name);

  const mins = totalMinutes(r);
  for (const [name, test] of TIME_BUCKETS) if (test(mins)) f.add('time:' + name);

  // A handful of headline ingredients, so "we love anything with feta" works.
  for (const ing of r.ingredients || []) {
    const n = normName(ing.item);
    if (!n || n.length < 3) continue;
    if (COMMON.has(n)) continue;
    f.add('ing:' + n);
  }

  const cals = r.nutritionPerServing?.calories;
  if (cals) f.add(cals <= 450 ? 'cal:light' : cals <= 650 ? 'cal:medium' : 'cal:hearty');
  const prot = r.nutritionPerServing?.protein;
  if (prot && prot >= 30) f.add('nutri:high-protein');
  return f;
}

// Ingredients so common they carry no signal about taste
const COMMON = new Set([
  'salt', 'kosher salt', 'black pepper', 'pepper', 'water', 'olive oil',
  'extra-virgin olive oil', 'extra virgin olive oil', 'oil', 'sugar', 'flour',
  'all-purpose flour', 'baking soda', 'baking powder', 'garlic', 'onion',
  'yellow onion', 'butter', 'egg',
]);

/**
 * How the table actually reacted, weighted so a picky kid clearing their plate
 * counts for more than an adult being polite about it.
 */
export function familySignal(r) {
  if (!r) return 0;
  let people = [];
  try { people = store.people(); } catch (e) { people = []; }

  // Every time we've made it, not just the most recent night. One bad Tuesday
  // with a tired seven-year-old shouldn't retire a meal everyone normally eats.
  const sittings = Array.isArray(r.sittings) && r.sittings.length
    ? r.sittings
    : (r.verdicts && Object.keys(r.verdicts).length
      ? [{ verdicts: Object.fromEntries(Object.entries(r.verdicts).map(([k, e]) => [k, e && e.verdict])) }]
      : []);
  if (!sittings.length) return 0;

  let total = 0, n = 0;
  for (const p of people) {
    const scores = [];
    for (const sit of sittings) {
      const verdict = verdictOf((sit.verdicts || {})[p.id]);
      if (!verdict || verdict.id === 'absent') continue;
      scores.push(verdict.score);
    }
    if (!scores.length) continue;
    // Recent nights matter more, but the earlier ones still count — that's the
    // whole point of keeping them.
    let weighted = 0, wsum = 0;
    scores.forEach((sc, i) => {
      const w = 1 + i * 0.4;
      weighted += sc * w; wsum += w;
    });
    const avg = weighted / wsum;

    // A very picky eater eating something is worth a lot; refusing it is
    // expected and shouldn't damn the recipe as hard.
    const tol = eatingType(p.eating).tolerance;
    const weight = p.type === 'child' ? (avg > 0 ? 2 / Math.max(0.25, tol) * 0.5 : 1.2) : 1;
    total += avg * weight;
    n++;
  }
  if (!n) return 0;

  const base = total / n;
  // Something that's landed well more than once is a safer bet than something
  // that landed well once. Small, capped nudge — it shouldn't swamp the score.
  const repeats = sittings.length - 1;
  if (base > 0 && repeats > 0) return base * (1 + Math.min(0.3, repeats * 0.1));
  return base;
}

// How strongly a recipe's own signals feed the profile
function affinity(r) {
  let a = 0;
  if (r.rating) a += (r.rating - 3) * 1.2;         // 5★ -> +2.4, 1★ -> -2.4
  a += familySignal(r) * 1.5;                      // what people actually ate
  if (r.favorite) a += 2;
  if (r.frequency === 'every-week') a += 3;
  if (r.frequency === 'every-month') a += 1.4;
  if (r.frequency === 'now-and-then') a += 0.4;
  if (r.frequency === 'special') a += 0.6;
  if (r.frequency === 'never-again') a -= 5;
  a += Math.min(2, (r.cookedCount || 0) * 0.5);
  return a;
}

export function buildProfile(recipes) {
  const weights = new Map();
  let signalCount = 0;
  for (const r of recipes) {
    const a = affinity(r);
    if (a === 0) continue;
    signalCount++;
    const feats = featuresOf(r);
    const norm = 1 / Math.sqrt(Math.max(4, feats.size));
    for (const f of feats) weights.set(f, (weights.get(f) || 0) + a * norm);
  }
  // Squash so one obsessively-loved recipe doesn't dominate everything
  for (const [k, v] of weights) weights.set(k, Math.sign(v) * Math.sqrt(Math.abs(v)));
  return { weights, signalCount };
}

export function scoreRecipe(r, profile) {
  const feats = featuresOf(r);
  let s = 0;
  for (const f of feats) {
    const w = profile.weights.get(f);
    if (w) s += w;
  }
  return s / Math.sqrt(Math.max(4, feats.size));
}

/** Why did we suggest this? Returns the two or three strongest matches. */
export function explain(r, profile, max = 3) {
  const feats = featuresOf(r);
  const hits = [];
  for (const f of feats) {
    const w = profile.weights.get(f) || 0;
    if (w > 0.25) hits.push([f, w]);
  }
  hits.sort((a, b) => b[1] - a[1]);
  return hits.slice(0, max).map(([f]) => prettyFeature(f)).filter(Boolean);
}

function prettyFeature(f) {
  const [kind, val] = f.split(':');
  switch (kind) {
    case 'cuisine': return `${val} food`;
    case 'tag': return val.replace(/-/g, ' ');
    case 'protein': return val.replace(/-/g, ' ');
    case 'flavor': return val.replace(/-/g, ' ') + ' flavors';
    case 'time': return val === 'fast' ? 'quick to make' : val === 'slow' ? 'weekend cooking' : '';
    case 'ing': return val;
    case 'cal': return val === 'light' ? 'lighter plates' : val === 'hearty' ? 'hearty plates' : '';
    case 'nutri': return 'high protein';
    default: return '';
  }
}

/**
 * Recipes you should try next.
 * Excludes ones you've already rated/favorited — those aren't discoveries.
 */
export function suggestions(recipes, { limit = 12, mealType = null, excludeIds = [] } = {}) {
  const profile = buildProfile(recipes);
  const skip = new Set(excludeIds);
  const pool = recipes.filter((r) => {
    if (skip.has(r.id)) return false;
    if (r.frequency === 'never-again') return false;
    if (mealType && r.mealType !== mealType) return false;
    return !r.rating && !r.favorite && !r.cookedCount && !(r.verdicts && Object.keys(r.verdicts).length);
  });
  if (!profile.signalCount) {
    // Cold start: lead with the well-rounded, quick, high-protein ones.
    return pool
      .map((r) => ({ recipe: r, score: coldScore(r), reasons: ['a good place to start'] }))
      .sort((a, b) => b.score - a.score).slice(0, limit);
  }
  return pool
    .map((r) => ({ recipe: r, score: scoreRecipe(r, profile), reasons: explain(r, profile) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function coldScore(r) {
  let s = 0;
  s += kidFriendlyGuess(r) * 2;
  const m = totalMinutes(r);
  if (m <= 30) s += 2; else if (m <= 45) s += 1;
  if ((r.nutritionPerServing?.protein || 0) >= 28) s += 1.5;
  if ((r.nutritionPerServing?.fiber || 0) >= 8) s += 1;
  if ((r.tags || []).includes('kid-friendly')) s += 0.5;
  if (r.mealType === 'dinner') s += 1;
  if (r.difficulty === 'easy') s += 0.8;
  return s;
}

/**
 * Before anyone has eaten anything, guess how a child will take to a dish.
 * Crude, but better than nothing: familiar formats score well, aggressive
 * heat and strong funk score badly.
 */
export function kidFriendlyGuess(r) {
  let kids = [];
  try { kids = store.children(); } catch (e) { kids = []; }
  if (!kids.length) return 0;

  const hay = (r.title + ' ' + r.description + ' ' +
    (r.ingredients || []).map((i) => i.item).join(' ')).toLowerCase();
  let s = 0;

  if ((r.tags || []).includes('kid-friendly')) s += 2;
  if (/pasta|spaghetti|ziti|mac|pizza|quesadilla|taco|meatball|chicken tender|nugget|burger|grilled cheese|pancake|waffle|rice bowl|noodle/.test(hay)) s += 1.5;
  if (/cheese|butter|cream|yogurt|honey|maple/.test(hay)) s += 0.5;

  // Things that reliably end a small person's interest in dinner
  if (/spicy|chili|chipotle|jalape|harissa|sriracha|gochujang|cayenne|curry paste|arbol|serrano|scotch bonnet/.test(hay)) s -= 1.6;
  if (/anchov|olive|caper|blue cheese|feta|goat cheese|mushroom|eggplant|brussels|kale|fish sauce|miso|kimchi|tofu/.test(hay)) s -= 0.8;
  if (/salmon|cod|shrimp|scallop|mussel|tuna/.test(hay)) s -= 0.5;

  // Anything a child can take apart and eat their own way tends to win
  if (/bowl|wrap|taco|skewer|build.your.own|sheet.pan/.test(hay)) s += 0.6;

  // Weight by how picky the household actually is
  const picky = kids.reduce((acc, k) => acc + (1 - eatingType(k.eating).tolerance), 0) / kids.length;
  return s * (0.5 + picky);
}

/** "More like this" for a single recipe. */
export function similarTo(target, recipes, limit = 6) {
  const tf = featuresOf(target);
  const scored = [];
  for (const r of recipes) {
    if (r.id === target.id || r.deleted) continue;
    if (r.healthyOf === target.id || target.healthyOf === r.id) continue;
    const rf = featuresOf(r);
    let inter = 0;
    for (const f of rf) if (tf.has(f)) inter += weightOfFeature(f);
    const denom = Math.sqrt(tf.size * rf.size) || 1;
    const score = inter / denom;
    if (score > 0) scored.push({ recipe: r, score, shared: sharedLabels(tf, rf) });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

function weightOfFeature(f) {
  if (f.startsWith('protein:')) return 2.5;
  if (f.startsWith('cuisine:')) return 2.2;
  if (f.startsWith('flavor:')) return 1.6;
  if (f.startsWith('tag:')) return 1.2;
  if (f.startsWith('ing:')) return 1;
  if (f.startsWith('time:')) return 0.7;
  return 0.5;
}

function sharedLabels(a, b) {
  const out = [];
  for (const f of a) if (b.has(f)) { const p = prettyFeature(f); if (p) out.push(p); }
  return uniq(out).slice(0, 3);
}

/** A short human sentence describing the household's taste. */
export function profileSummary(recipes) {
  const profile = buildProfile(recipes);
  if (profile.signalCount < 3) return '';
  const top = Array.from(profile.weights.entries())
    .filter(([k, v]) => v > 0.4 && !k.startsWith('meal:') && !k.startsWith('difficulty:'))
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([k]) => prettyFeature(k)).filter(Boolean);
  if (!top.length) return '';
  return 'You two lean toward ' + listSentence(uniq(top)) + '.';
}

function listSentence(arr) {
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return arr[0] + ' and ' + arr[1];
  return arr.slice(0, -1).join(', ') + ', and ' + arr[arr.length - 1];
}
