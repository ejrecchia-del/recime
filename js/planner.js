// ---------------------------------------------------------------------------
// planner.js — builds a week of meals that doesn't feel repetitive
// ---------------------------------------------------------------------------
import { buildProfile, scoreRecipe, featuresOf, explain, familySignal, kidFriendlyGuess } from './suggest.js';
import { ymd, weekStartOf, addDays, totalMinutes, nowISO, uid, DAY_SHORT } from './util.js';

const PROTEIN_OF = (r) => {
  const f = featuresOf(r);
  for (const x of f) if (x.startsWith('protein:')) return x.slice(8);
  return 'none';
};
const CUISINE_OF = (r) => r.cuisine || 'Other';

/** Was this cooked or planned recently enough that it'd feel repetitive? */
function recencyPenalty(r, recentIds, weeksAgo) {
  let p = 0;
  const idx = recentIds.indexOf(r.id);
  if (idx >= 0) p -= 6 - Math.min(4, weeksAgo[idx] || 0);
  if (r.lastCookedAt) {
    const days = (Date.now() - new Date(r.lastCookedAt).getTime()) / 86400000;
    if (days < 10) p -= 4; else if (days < 21) p -= 1.5;
  }
  return p;
}

/**
 * Generate a week plan.
 * @param recipes    all non-deleted recipes
 * @param opts       { weekStart, days, meals, servings, weeknightMax, dietPrefs,
 *                     lockedSlots, recentIds, seedRandom }
 */
export function generatePlan(recipes, opts = {}) {
  const weekStart = opts.weekStart || ymd(weekStartOf(new Date()));
  const days = opts.days || 7;
  const meals = opts.meals && opts.meals.length ? opts.meals : ['dinner'];
  const servings = opts.servings || 2;
  const weeknightMax = opts.weeknightMax || 40;
  const dietPrefs = opts.dietPrefs || [];
  const locked = opts.lockedSlots || [];
  const recentIds = opts.recentIds || [];
  const weeksAgo = opts.weeksAgo || [];

  const profile = buildProfile(recipes);

  const slots = [];
  for (let d = 0; d < days; d++) {
    for (const meal of meals) {
      const date = ymd(addDays(new Date(weekStart + 'T12:00:00'), d));
      // Locked picks and skipped meals survive a regenerate untouched.
      const existing = locked.find((s) => s.date === date && s.meal === meal && (s.locked || s.skipped));
      slots.push(existing
        ? { ...existing }
        : { id: uid('slot'), date, meal, dayIndex: d, recipeId: '', servings, locked: false, skipped: false });
    }
  }

  const used = new Set(slots.filter((s) => s.recipeId).map((s) => s.recipeId));
  const usedProteins = [];
  const usedCuisines = [];

  // Anything marked "eat every week" gets first claim on a slot.
  const mustHave = recipes.filter((r) => r.frequency === 'every-week' && !used.has(r.id));

  for (const slot of slots) {
    if (slot.recipeId || slot.skipped) continue;
    const dow = new Date(slot.date + 'T12:00:00').getDay(); // 0 Sun
    const isWeeknight = dow >= 1 && dow <= 4;

    const pool = recipes.filter((r) => {
      if (used.has(r.id)) return false;
      if (r.frequency === 'never-again') return false;
      if (r.mealType !== slot.meal) return false;
      if (!matchesDiet(r, dietPrefs)) return false;
      return true;
    });
    if (!pool.length) continue;

    const scored = pool.map((r) => {
      let s = scoreRecipe(r, profile) * 2;
      // Weeknights want speed; weekends can take their time.
      const mins = totalMinutes(r);
      if (isWeeknight) {
        if (mins <= weeknightMax) s += 2.5;
        else s -= (mins - weeknightMax) / 12;
      } else if (mins > 45) s += 0.8;

      // Variety: don't repeat a protein or cuisine back to back
      const p = PROTEIN_OF(r), c = CUISINE_OF(r);
      const pCount = usedProteins.filter((x) => x === p).length;
      const cCount = usedCuisines.filter((x) => x === c).length;
      s -= pCount * 2.2;
      s -= cCount * 1.6;
      if (usedProteins[usedProteins.length - 1] === p) s -= 2;

      // Meals the whole table ate are the whole point — weight them heavily,
      // and lean on the kid guess for anything nobody has tried yet.
      const fam = familySignal(r);
      if (fam) s += fam * 2.5;
      else s += kidFriendlyGuess(r) * 0.8;

      // Favorites and high ratings deserve to actually show up
      if (r.favorite) s += 1.6;
      if (r.rating >= 4) s += r.rating - 3;
      if (r.frequency === 'every-week') s += 5;
      if (r.frequency === 'every-month') s += 1;

      s += recencyPenalty(r, recentIds, weeksAgo);
      s += (hashJitter(r.id + slot.date) - 0.5) * 1.2; // keeps regenerate interesting
      return { r, s };
    });

    // A must-have that fits this slot type wins outright
    const must = mustHave.find((m) => m.mealType === slot.meal && !used.has(m.id) && (!isWeeknight || totalMinutes(m) <= weeknightMax + 20));
    let pick;
    if (must) { pick = must; mustHave.splice(mustHave.indexOf(must), 1); }
    else { scored.sort((a, b) => b.s - a.s); pick = scored[0]?.r; }
    if (!pick) continue;

    slot.recipeId = pick.id;
    slot.title = pick.title;
    slot.servings = servings;
    slot.reasons = explain(pick, profile, 2);
    used.add(pick.id);
    usedProteins.push(PROTEIN_OF(pick));
    usedCuisines.push(CUISINE_OF(pick));
  }

  return {
    weekStart,
    days,
    meals,
    servings,
    status: 'draft',
    slots,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
}

/** Swap one slot for a different recipe, respecting everything else. */
export function reroll(plan, slotId, recipes, opts = {}) {
  const slot = plan.slots.find((s) => s.id === slotId);
  if (!slot) return plan;
  if (slot.skipped) { slot.skipped = false; slot.skipReason = ''; slot.skipNote = ''; }
  const profile = buildProfile(recipes);
  const used = new Set(plan.slots.filter((s) => s.id !== slotId && s.recipeId).map((s) => s.recipeId));
  const rejected = new Set(slot.rejected || []);
  if (slot.recipeId) rejected.add(slot.recipeId);

  const dow = new Date(slot.date + 'T12:00:00').getDay();
  const isWeeknight = dow >= 1 && dow <= 4;
  const weeknightMax = opts.weeknightMax || 40;

  const pool = recipes.filter((r) => !used.has(r.id) && !rejected.has(r.id)
    && r.mealType === slot.meal && r.frequency !== 'never-again'
    && matchesDiet(r, opts.dietPrefs || []));

  if (!pool.length) { slot.rejected = []; return plan; }

  const scored = pool.map((r) => {
    let s = scoreRecipe(r, profile) * 2;
    const mins = totalMinutes(r);
    if (isWeeknight && mins <= weeknightMax) s += 2;
    if (r.favorite) s += 1.4;
    if (r.rating >= 4) s += 1;
    const fam = familySignal(r);
    s += fam ? fam * 2 : kidFriendlyGuess(r) * 0.8;
    s += (hashJitter(r.id + Date.now()) - 0.5) * 2;
    return { r, s };
  }).sort((a, b) => b.s - a.s);

  const pick = scored[0].r;
  slot.recipeId = pick.id;
  slot.title = pick.title;
  slot.reasons = explain(pick, profile, 2);
  slot.rejected = Array.from(rejected).slice(-12);
  slot.servings = slot.servings || opts.servings || 2;
  plan.updatedAt = nowISO();
  return plan;
}

function matchesDiet(r, prefs) {
  if (!prefs || !prefs.length) return true;
  const tags = new Set(r.tags || []);
  for (const p of prefs) {
    if (p === 'vegetarian' && !tags.has('vegetarian') && !tags.has('vegan')) return false;
    if (p === 'vegan' && !tags.has('vegan')) return false;
    if (p === 'gluten-free' && !tags.has('gluten-free')) return false;
    if (p === 'low-carb' && !tags.has('low-carb')) return false;
    if (p === 'high-protein' && !tags.has('high-protein')) return false;
    if (p === 'no-pork' && /pork|bacon|ham|prosciutto|chorizo/i.test(JSON.stringify(r.ingredients || []))) return false;
    if (p === 'no-shellfish' && /shrimp|prawn|scallop|crab|lobster|mussel|clam/i.test(JSON.stringify(r.ingredients || []))) return false;
  }
  return true;
}

function hashJitter(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

export const SKIP_REASONS = [
  { id: 'eating-out', label: 'Eating out', emoji: '\ud83c\udf7d\ufe0f' },
  { id: 'takeout', label: 'Takeout', emoji: '\ud83e\udd61' },
  { id: 'leftovers', label: 'Leftovers', emoji: '\ud83e\udd61' },
  { id: 'away', label: 'Away from home', emoji: '\u2708\ufe0f' },
  { id: 'other', label: 'Skip this one', emoji: '\u2013' },
];

export function skipReasonOf(id) {
  return SKIP_REASONS.find((r) => r.id === id) || SKIP_REASONS[SKIP_REASONS.length - 1];
}

/** Mark a slot as "we're not cooking this one". Keeps it out of the list. */
export function skipSlot(plan, slotId, reason, note = '') {
  const slot = plan.slots.find((s) => s.id === slotId);
  if (!slot) return plan;
  slot.skipped = true;
  slot.skipReason = reason || 'other';
  slot.skipNote = note;
  slot.recipeId = '';
  slot.title = '';
  slot.reasons = [];
  plan.updatedAt = nowISO();
  return plan;
}

export function unskipSlot(plan, slotId) {
  const slot = plan.slots.find((s) => s.id === slotId);
  if (!slot) return plan;
  slot.skipped = false;
  slot.skipReason = '';
  slot.skipNote = '';
  plan.updatedAt = nowISO();
  return plan;
}

/** Skip every meal on a given date (a whole day away). */
export function skipDay(plan, date, reason, note = '') {
  for (const s of plan.slots) {
    if (s.date === date) skipSlot(plan, s.id, reason, note);
  }
  plan.updatedAt = nowISO();
  return plan;
}

export function unskipDay(plan, date) {
  for (const s of plan.slots) if (s.date === date) unskipSlot(plan, s.id);
  return plan;
}

export function planSummary(plan, recipeById) {
  const filled = plan.slots.filter((s) => s.recipeId);
  const skipped = plan.slots.filter((s) => s.skipped);
  const kcal = filled.map((s) => recipeById(s.recipeId)?.nutritionPerServing?.calories).filter(Boolean);
  const mins = filled.map((s) => totalMinutes(recipeById(s.recipeId) || {})).filter(Boolean);
  return {
    filled: filled.length,
    skipped: skipped.length,
    cookable: plan.slots.length - skipped.length,
    total: plan.slots.length,
    avgCalories: kcal.length ? Math.round(kcal.reduce((a, b) => a + b, 0) / kcal.length) : null,
    avgMinutes: mins.length ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : null,
    cuisines: Array.from(new Set(filled.map((s) => recipeById(s.recipeId)?.cuisine).filter(Boolean))),
  };
}

export function slotLabel(slot) {
  const d = new Date(slot.date + 'T12:00:00');
  return DAY_SHORT[d.getDay()];
}

export function slotDateLabel(slot) {
  const d = new Date(slot.date + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}
