// ---------------------------------------------------------------------------
// store.js — application state, local persistence, and optional cloud sync
// ---------------------------------------------------------------------------
import { SEED_RECIPES } from '../data/recipes.js';
import { uid, nowISO, ymd, weekStartOf } from './util.js';

const LS_KEY = 'recime.state.v1';
const LS_SETTINGS = 'recime.settings.v1';

export const FREQUENCIES = [
  { id: 'every-week', label: 'Eat every week!', emoji: '🔁', color: '#2f9e6b' },
  { id: 'every-month', label: 'Once a month', emoji: '📅', color: '#3b7dd8' },
  { id: 'now-and-then', label: 'Now and then', emoji: '🌙', color: '#8a6bcf' },
  { id: 'special', label: 'Special occasion', emoji: '✨', color: '#cf8a3b' },
  { id: 'never-again', label: 'Never again', emoji: '🚫', color: '#b04a4a' },
];

export const AISLES = [
  'Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery', 'Deli',
  'Canned & Jarred', 'Dry Goods & Pasta', 'Condiments & Sauces',
  'Spices & Baking', 'Frozen', 'Beverages', 'Household', 'Other',
];

// The order you actually walk a ShopRite/Acme: perimeter first, then center
// aisles, frozen last so nothing melts in the cart.
export const AISLE_ORDER = [
  'Produce', 'Bakery', 'Deli', 'Meat & Seafood', 'Dairy & Eggs',
  'Dry Goods & Pasta', 'Canned & Jarred', 'Condiments & Sauces',
  'Spices & Baking', 'Beverages', 'Household', 'Other', 'Frozen',
];

export const AISLE_META = {
  'Produce': { emoji: '🥬', color: '#4a9e5c' },
  'Meat & Seafood': { emoji: '🥩', color: '#b8555f' },
  'Dairy & Eggs': { emoji: '🥛', color: '#5b8dd0' },
  'Bakery': { emoji: '🥖', color: '#c98f4a' },
  'Deli': { emoji: '🧀', color: '#c9a84a' },
  'Canned & Jarred': { emoji: '🥫', color: '#9a7a52' },
  'Dry Goods & Pasta': { emoji: '🍝', color: '#a8894a' },
  'Condiments & Sauces': { emoji: '🧴', color: '#7a8a52' },
  'Spices & Baking': { emoji: '🧂', color: '#a06a8a' },
  'Frozen': { emoji: '🧊', color: '#5aa8c9' },
  'Beverages': { emoji: '🧃', color: '#6a7ac9' },
  'Household': { emoji: '🧻', color: '#8a8a8a' },
  'Other': { emoji: '🛒', color: '#7a7a7a' },
};

// How much a person actually eats, relative to one adult portion. Cooking for
// two adults and a four-year-old is not cooking for three.
export const APPETITE = [
  { maxAge: 3, share: 0.35, label: 'toddler' },
  { maxAge: 8, share: 0.6, label: 'young child' },
  { maxAge: 12, share: 0.8, label: 'child' },
  { maxAge: 17, share: 1.1, label: 'teenager' },
  { maxAge: 999, share: 1, label: 'adult' },
];

export const EATING_TYPES = [
  { id: 'everything', label: 'Eats everything', emoji: '\ud83d\ude0b', tolerance: 1 },
  { id: 'kind-of-picky', label: 'Kind of picky', emoji: '\ud83d\ude10', tolerance: 0.6 },
  { id: 'very-picky', label: 'Very picky', emoji: '\ud83d\ude1f', tolerance: 0.25 },
];

export function eatingType(id) {
  return EATING_TYPES.find((e) => e.id === id) || EATING_TYPES[0];
}

/** Age from a date of birth, so it stays correct as they grow. */
export function ageOf(person) {
  if (!person) return null;
  if (person.dob) {
    const [y, m, d] = String(person.dob).split('-').map(Number);
    if (y) {
      const now = new Date();
      let age = now.getFullYear() - y;
      const hadBirthday = (now.getMonth() + 1) > m || ((now.getMonth() + 1) === m && now.getDate() >= (d || 1));
      if (!hadBirthday) age -= 1;
      return age;
    }
  }
  return person.age != null ? Number(person.age) : null;
}

/** Days until their next birthday — used to nudge when tastes should shift. */
export function daysToBirthday(person) {
  if (!person || !person.dob) return null;
  const [, m, d] = String(person.dob).split('-').map(Number);
  if (!m) return null;
  const now = new Date();
  let next = new Date(now.getFullYear(), m - 1, d || 1);
  if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) next = new Date(now.getFullYear() + 1, m - 1, d || 1);
  return Math.round((next - now) / 86400000);
}

export function appetiteShare(person) {
  if (!person) return 1;
  if (person.type === 'adult') return 1;
  const age = ageOf(person);
  if (age == null || !isFinite(age)) return 0.7;
  return (APPETITE.find((a) => age <= a.maxAge) || APPETITE[APPETITE.length - 1]).share;
}

/**
 * Standing rules for where things come from. Written once, applied to every
 * list from then on — which is the only version of this anyone keeps up with.
 *
 * `kind` is 'aisle' (matches the grocery category) or 'keyword' (matches the
 * item name). `minQty`/`minUnit` let a rule fire only above a size threshold,
 * which is what makes "big packs of chicken go to Costco" expressible.
 */
export const DEFAULT_STORE_RULES = [
  { id: 'r-paper', kind: 'keyword', match: 'toilet paper, paper towel, napkin, paper plate, trash bag, foil, parchment, plastic wrap, dish soap, laundry', store: 'costco', dest: 'instacart', label: 'Paper goods & household' },
  { id: 'r-bulkmeat', kind: 'keyword', match: 'chicken breast, chicken thigh, ground beef, ground turkey, salmon', minQty: 3, minUnit: 'lb', store: 'costco', dest: 'instacart', label: 'Meat, 3 lb and up' },
  { id: 'r-pantry-bulk', kind: 'keyword', match: 'extra-virgin olive oil, brown rice, jasmine rice, basmati rice, rolled oats, coffee, almonds, walnuts, cashews, peanut butter, honey, maple syrup, parmesan cheese', store: 'costco', dest: 'instacart', label: 'Bulk pantry staples' },
  { id: 'r-frozen-bulk', kind: 'keyword', match: 'frozen berries, frozen edamame, frozen peas, frozen corn, frozen shrimp', store: 'costco', dest: 'instacart', label: 'Frozen in bulk' },
  { id: 'r-produce', kind: 'aisle', match: 'Produce', store: 'shoprite', dest: 'in-person', label: 'Produce — pick it yourself' },
  { id: 'r-bakery', kind: 'aisle', match: 'Bakery', store: 'shoprite', dest: 'in-person', label: 'Bakery' },
];

// What people said about a meal after eating it.
export const VERDICTS = [
  { id: 'loved', label: 'Loved it', emoji: '\ud83d\ude0d', score: 2 },
  { id: 'ate', label: 'Ate it', emoji: '\ud83d\udc4d', score: 1 },
  { id: 'picked', label: 'Picked at it', emoji: '\ud83d\ude10', score: -0.5 },
  { id: 'refused', label: 'Would not eat it', emoji: '\ud83d\udc4e', score: -2 },
  { id: 'absent', label: "Wasn't eating", emoji: '\u2014', score: 0 },
];

export function verdictOf(id) { return VERDICTS.find((v) => v.id === id); }

/** Collapse a list of sittings down to "what each person thought most recently". */
export function latestVerdictMap(sittings) {
  const out = {};
  for (const sit of (sittings || []).slice().sort((a, b) => String(a.at).localeCompare(String(b.at)))) {
    for (const [pid, vid] of Object.entries(sit.verdicts || {})) out[pid] = { verdict: vid, at: sit.at };
  }
  return out;
}

/**
 * Recipes saved before we tracked sittings carry a single flat verdict map.
 * Fold it into one historical sitting so nothing anyone told the app is lost.
 */
function migrateSittings(r) {
  if (Array.isArray(r.sittings) && r.sittings.length) return r.sittings;
  const v = r.verdicts;
  if (!v || !Object.keys(v).length) return Array.isArray(r.sittings) ? r.sittings : [];
  const verdicts = {};
  let at = r.lastCookedAt || r.updatedAt || nowISO();
  for (const [pid, entry] of Object.entries(v)) {
    const vid = typeof entry === 'string' ? entry : entry && entry.verdict;
    if (vid) verdicts[pid] = vid;
    if (entry && entry.at) at = entry.at;
  }
  return Object.keys(verdicts).length ? [{ id: 'sit-legacy-' + r.id, at, verdicts, note: '' }] : [];
}

export const DESTINATIONS = [
  { id: 'instacart', label: 'Instacart', short: 'Cart', emoji: '🚚' },
  { id: 'in-person', label: 'In person', short: 'Store', emoji: '🛒' },
  { id: 'have', label: 'Already have', short: 'Have', emoji: '✅' },
];

const DEFAULT_SETTINGS = {
  household: '',
  syncUrl: '',
  syncKey: '',
  displayName: '',
  stores: [
    { id: 'shoprite', name: 'ShopRite', slug: 'shoprite', primary: true },
    { id: 'acme', name: 'Acme', slug: 'acme-markets', primary: false },
    { id: 'costco', name: 'Costco', slug: 'costco', primary: false },
  ],
  defaultStore: 'shoprite',
  defaultDest: 'in-person',
  instacartKey: '',
  aiKey: '',
  planDays: 7,
  planMeals: ['dinner'],
  householdSize: 2,          // kept in sync with the roster below
  people: [
    { id: 'p-eric', name: 'Eric', type: 'adult', age: null, eating: 'everything' },
    { id: 'p-dale', name: 'Dale', type: 'adult', age: null, eating: 'everything' },
    // Ages as told to us; no birthdays yet, so the app flags them for a date.
    { id: 'p-jaxon', name: 'Jaxon', type: 'child', age: 10, dob: '', dobNeeded: true, eating: 'everything' },
    { id: 'p-jett', name: 'Jett', type: 'child', age: 7, dob: '', dobNeeded: true, eating: 'everything' },
    { id: 'p-jace', name: 'Jace', type: 'child', age: 2, dob: '', dobNeeded: true, eating: 'everything' },
  ],
  peopleSeeded: false,
  dietPrefs: [],
  cartNotes: '',
  storeRules: [],            // seeded on first run — see DEFAULT_STORE_RULES
  storeRulesSeeded: false,
  lastSeenRecipesAt: '',
  notifyEnabled: false,
  circles: [],               // recipe-only sharing with friends and family
  weeknightMaxMinutes: 40,
  theme: 'dark',
  showPrices: true,
};

// Starter recipes get back-dated timestamps in curated order, so "recently
// added" shows them the way they were curated and anything you add lands on top.
function seedDate(i) {
  return new Date(Date.UTC(2026, 0, 1, 0, 0, 0) + (SEED_RECIPES.length - i) * 60000).toISOString();
}

function blankState() {
  return {
    version: 1,
    recipes: {},     // id -> recipe
    plans: {},       // weekStart(ymd) -> plan
    shopping: {},    // id -> shopping item
    pantry: {},      // key -> {key, name, addedAt}
    chat: [],        // chat transcript
    nudges: {},      // id -> { recipeId, from, to, note, at, seen }
    meta: { seeded: false, createdAt: nowISO() },
  };
}

// ---------------------------------------------------------------------------

class Store {
  constructor() {
    this.state = blankState();
    this.settings = { ...DEFAULT_SETTINGS };
    this.listeners = new Set();
    this.dirty = new Set();      // ids pending push to cloud
    this.syncStatus = 'off';     // off | ok | syncing | error
    this.syncMessage = '';
    this.lastPull = null;
    this._saveTimer = null;
  }

  // --- lifecycle -----------------------------------------------------------
  load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) this.state = Object.assign(blankState(), JSON.parse(raw));
    } catch (e) { console.warn('state load failed', e); }
    try {
      const raw = localStorage.getItem(LS_SETTINGS);
      if (raw) this.settings = Object.assign({ ...DEFAULT_SETTINGS }, JSON.parse(raw));
    } catch (e) { console.warn('settings load failed', e); }

    if (!this.state.meta.seeded) this.seed();
    // Backfill any seed recipes added in a later version of the app.
    else this.topUpSeeds();

    if (!this.settings.household) {
      this.settings.household = 'home-' + Math.random().toString(36).slice(2, 8);
      this.saveSettings();
    }
    this.migrateSettings();
    this.migrateRecipes();
    return this;
  }

  /**
   * Fold any recipe still carrying the old flat verdict map into the sitting
   * history. Runs once per device; after that there's nothing left to fold.
   */
  migrateRecipes() {
    let touched = 0;
    for (const r of Object.values(this.state.recipes || {})) {
      if (Array.isArray(r.sittings)) continue;
      r.sittings = migrateSittings(r);
      if (r.sittings.length) r.verdicts = latestVerdictMap(r.sittings);
      touched++;
    }
    if (touched) this.save();
    return touched;
  }

  /**
   * Saved settings win over defaults, which means a device that has been
   * running a while never sees anything new we add. Backfill the additive
   * bits without touching anything the household has customised.
   */
  migrateSettings() {
    let changed = false;

    // New default stores (Costco, etc.) should appear for existing installs.
    const stores = Array.isArray(this.settings.stores) ? this.settings.stores : [];
    for (const def of DEFAULT_SETTINGS.stores) {
      if (!stores.some((s) => s.id === def.id)) { stores.push({ ...def }); changed = true; }
    }
    if (changed) this.settings.stores = stores;

    // Seed the standing store rules the first time, keeping only the ones
    // that point at a store this household actually has.
    // Seed once. The default is an empty array, so "is it an array" isn't
    // enough to tell "never set up" from "deliberately cleared" — hence the flag.
    if (!Array.isArray(this.settings.storeRules)
        || (!this.settings.storeRules.length && !this.settings.storeRulesSeeded)) {
      const have = new Set((this.settings.stores || []).map((x) => x.id));
      this.settings.storeRules = DEFAULT_STORE_RULES
        .filter((r) => have.has(r.store))
        .map((r) => ({ ...r, enabled: true }));
      this.settings.storeRulesSeeded = true;
      changed = true;
    }

    // The household roster replaced a flat headcount.
    if (!Array.isArray(this.settings.people) || !this.settings.people.length) {
      this.settings.people = DEFAULT_SETTINGS.people.map((p) => ({ ...p }));
      this.settings.peopleSeeded = true;
      changed = true;
    } else if (!this.settings.peopleSeeded) {
      // An install that predates the kids being added. Backfill anyone we know
      // about who isn't on the roster yet — once only, so a person you delete
      // stays deleted.
      const have = new Set(this.settings.people.map((p) => p.id));
      for (const def of DEFAULT_SETTINGS.people) {
        if (!have.has(def.id)) { this.settings.people.push({ ...def }); changed = true; }
      }
      this.settings.peopleSeeded = true;
      changed = true;
    }
    const derived = this.householdServings();
    if (this.settings.householdSize !== derived) { this.settings.householdSize = derived; changed = true; }

    if (changed) this.saveSettings();
    return changed;
  }

  seed() {
    SEED_RECIPES.forEach((r, i) => {
      this.state.recipes[r.id] = this.normaliseRecipe({ ...r, createdAt: seedDate(i) });
    });
    this.state.meta.seeded = true;
    this.state.meta.seedCount = SEED_RECIPES.length;
    this.save();
  }

  topUpSeeds() {
    let added = 0;
    SEED_RECIPES.forEach((r, i) => {
      if (!this.state.recipes[r.id] && !this.state.meta['removed:' + r.id]) {
        this.state.recipes[r.id] = this.normaliseRecipe({ ...r, createdAt: seedDate(i) });
        added++;
      }
    });
    if (added) this.save();
    this.backfillSeeds();
  }

  /**
   * Bring already-installed copies up to date when a starter recipe gains
   * something new (photos, corrected text) — without ever clobbering an edit
   * or a photo you took yourself.
   */
  backfillSeeds() {
    let touched = 0;
    for (const seed of SEED_RECIPES) {
      const cur = this.state.recipes[seed.id];
      if (!cur || cur.deleted || !cur.seed) continue;

      const ownPhoto = typeof cur.image === 'string' && (cur.image.startsWith('data:') || cur.imageCredit?.credit === 'Our photo');
      if (seed.image && !ownPhoto && cur.image !== seed.image) {
        cur.image = seed.image;
        cur.imageCredit = seed.imageCredit || null;
        cur.updatedAt = nowISO();
        this.markDirty('recipe', cur.id);
        touched++;
      }
    }
    if (touched) { this.save(); }
    return touched;
  }

  normaliseRecipe(r) {
    return Object.assign({
      id: r.id || uid('rcp'),
      title: 'Untitled recipe',
      description: '',
      cuisine: 'Other',
      mealType: 'dinner',
      servings: 4,
      prepMinutes: 0,
      cookMinutes: 0,
      difficulty: 'easy',
      tags: [],
      ingredients: [],
      steps: [],
      nutritionPerServing: null,
      healthNotes: '',
      sourceInspiration: '',
      sourceUrl: '',
      image: '',
      favorite: false,
      rating: 0,
      frequency: '',
      notes: '',
      cookedCount: 0,
      lastCookedAt: '',
      sittings: [],       // one entry per time we actually made it — see recordSitting
      addedBy: this.settings?.displayName || '',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      deleted: false,
      healthyOf: '',      // id of the recipe this is a healthy remix of
      remixId: '',        // id of the healthy remix generated from this recipe
    }, r, { sittings: migrateSittings(r) });
  }

  // --- persistence ---------------------------------------------------------
  save() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(this.state)); }
      catch (e) { console.warn('save failed (quota?)', e); }
    }, 120);
  }

  saveNow() {
    clearTimeout(this._saveTimer);
    try { localStorage.setItem(LS_KEY, JSON.stringify(this.state)); } catch (e) { /* ignore */ }
  }

  saveSettings() {
    try { localStorage.setItem(LS_SETTINGS, JSON.stringify(this.settings)); } catch (e) { /* ignore */ }
  }

  // --- reactivity ----------------------------------------------------------
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(reason = '') { for (const fn of this.listeners) { try { fn(reason); } catch (e) { console.error(e); } } }

  commit(kind, id, reason = '') {
    this.markDirty(kind, id);
    this.save();
    this.emit(reason || kind);
    schedulePush(this);
  }

  markDirty(kind, id) { if (id) this.dirty.add(kind + ':' + id); }

  // --- recipes -------------------------------------------------------------
  allRecipes() {
    return Object.values(this.state.recipes).filter((r) => !r.deleted);
  }

  recipe(id) { return this.state.recipes[id]; }

  addRecipe(data) {
    const r = this.normaliseRecipe({
      ...data,
      id: data.id || uid('rcp'),
      addedBy: data.addedBy || this.settings.displayName || '',
      createdAt: nowISO(), updatedAt: nowISO(),
    });
    this.state.recipes[r.id] = r;
    this.commit('recipe', r.id, 'recipe:add');
    return r;
  }

  updateRecipe(id, patch) {
    const r = this.state.recipes[id];
    if (!r) return null;
    Object.assign(r, patch, { updatedAt: nowISO() });
    this.commit('recipe', id, 'recipe:update');
    return r;
  }

  deleteRecipe(id) {
    const r = this.state.recipes[id];
    if (!r) return;
    r.deleted = true; r.updatedAt = nowISO();
    if (r.seed) this.state.meta['removed:' + id] = true;
    this.commit('recipe', id, 'recipe:delete');
  }

  toggleFavorite(id) {
    const r = this.state.recipes[id];
    if (!r) return;
    r.favorite = !r.favorite; r.updatedAt = nowISO();
    this.commit('recipe', id, 'recipe:favorite');
  }

  setRating(id, n) {
    const r = this.state.recipes[id];
    if (!r) return;
    r.rating = r.rating === n ? 0 : n;
    r.updatedAt = nowISO();
    this.commit('recipe', id, 'recipe:rating');
  }

  setFrequency(id, f) {
    const r = this.state.recipes[id];
    if (!r) return;
    r.frequency = r.frequency === f ? '' : f;
    r.updatedAt = nowISO();
    this.commit('recipe', id, 'recipe:frequency');
  }

  markCooked(id) {
    const r = this.state.recipes[id];
    if (!r) return;
    r.cookedCount = (r.cookedCount || 0) + 1;
    r.lastCookedAt = nowISO();
    r.updatedAt = nowISO();
    this.commit('recipe', id, 'recipe:cooked');
  }

  // --- plans ---------------------------------------------------------------
  currentWeekKey() { return ymd(weekStartOf(new Date())); }

  plan(weekKey) { return this.state.plans[weekKey]; }

  savePlan(plan) {
    plan.updatedAt = nowISO();
    this.state.plans[plan.weekStart] = plan;
    this.commit('plan', plan.weekStart, 'plan:save');
    return plan;
  }

  // --- shopping ------------------------------------------------------------
  shoppingItems() {
    return Object.values(this.state.shopping).filter((i) => !i.deleted);
  }

  putShoppingItem(item) {
    item.updatedAt = nowISO();
    this.state.shopping[item.id] = item;
    this.commit('shop', item.id, 'shopping:put');
    return item;
  }

  updateShoppingItem(id, patch) {
    const it = this.state.shopping[id];
    if (!it) return;
    Object.assign(it, patch, { updatedAt: nowISO() });
    this.commit('shop', id, 'shopping:update');
    return it;
  }

  removeShoppingItem(id) {
    const it = this.state.shopping[id];
    if (!it) return;
    it.deleted = true; it.updatedAt = nowISO();
    this.commit('shop', id, 'shopping:remove');
  }

  clearShopping(onlyChecked = false) {
    for (const it of this.shoppingItems()) {
      if (onlyChecked && !it.checked) continue;
      it.deleted = true; it.updatedAt = nowISO();
      this.markDirty('shop', it.id);
    }
    this.save(); this.emit('shopping:clear'); schedulePush(this);
  }

  // --- pantry --------------------------------------------------------------
  pantryList() { return Object.values(this.state.pantry).filter((p) => !p.deleted); }

  addPantry(name) {
    const key = String(name).toLowerCase().trim();
    if (!key) return;
    this.state.pantry[key] = { key, name: String(name).trim(), addedAt: nowISO(), deleted: false };
    this.commit('pantry', key, 'pantry:add');
  }

  removePantry(key) {
    const p = this.state.pantry[key];
    if (!p) return;
    p.deleted = true; p.updatedAt = nowISO();
    this.commit('pantry', key, 'pantry:remove');
  }

  // --- what's new ----------------------------------------------------------
  // "New" means added by someone else, or shared into a circle, since this
  // device last looked. Your own additions are never new to you.
  newRecipes() {
    const since = this.settings.lastSeenRecipesAt || this.state.meta.createdAt || '';
    const me = (this.settings.displayName || '').toLowerCase();
    return this.allRecipes().filter((r) => {
      if (r.seed) return false;
      if ((r.createdAt || '') <= since) return false;
      const by = (r.addedBy || r.sharedFrom?.by || '').toLowerCase();
      return !me || by !== me;
    }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  markRecipesSeen() {
    this.settings.lastSeenRecipesAt = nowISO();
    this.saveSettings();
    this.emit('seen');
  }

  // --- nudges ("you should look at this one") ------------------------------
  nudges() {
    return Object.values(this.state.nudges || {})
      .filter((n) => !n.seen && n.to !== (this.settings.displayName || ''))
      .sort((a, b) => (b.at || '').localeCompare(a.at || ''));
  }

  inboxNudges() {
    const me = (this.settings.displayName || '').toLowerCase();
    return Object.values(this.state.nudges || {})
      .filter((n) => !n.seen && (!n.to || n.to.toLowerCase() === me) && (n.from || '').toLowerCase() !== me)
      .sort((a, b) => (b.at || '').localeCompare(a.at || ''));
  }

  sendNudge(recipeId, to, note) {
    const id = uid('ndg');
    this.state.nudges = this.state.nudges || {};
    this.state.nudges[id] = {
      id, recipeId, to: to || '', note: note || '',
      from: this.settings.displayName || 'someone',
      at: nowISO(), seen: false, updatedAt: nowISO(),
    };
    this.commit('nudge', id, 'nudge:send');
    return id;
  }

  dismissNudge(id) {
    const n = this.state.nudges?.[id];
    if (!n) return;
    n.seen = true; n.updatedAt = nowISO();
    this.commit('nudge', id, 'nudge:seen');
  }

  // --- sharing circles -----------------------------------------------------
  // A circle shares RECIPES ONLY. Plans, shopping lists and pantry never leave
  // your own household — that's the whole point of keeping them separate.
  circles() {
    const c = this.settings.circles;
    return Array.isArray(c) ? c : [];
  }

  saveCircles(list) {
    this.settings.circles = list;
    this.saveSettings();
    this.emit('circles');
  }

  /** Recipes this household is willing to publish to its circles. */
  shareableRecipes() {
    return this.allRecipes().filter((r) => !r.private && !r.sharedFrom);
  }

  // --- store rules ---------------------------------------------------------
  storeRules() {
    const r = this.settings.storeRules;
    return Array.isArray(r) ? r : [];
  }

  saveStoreRules(list) {
    this.settings.storeRules = list;
    this.saveSettings();
    this.emit('storeRules');
  }

  // --- who we're feeding ---------------------------------------------------
  people() {
    const p = this.settings.people;
    return Array.isArray(p) && p.length ? p : DEFAULT_SETTINGS.people;
  }

  adults() { return this.people().filter((p) => p.type === 'adult'); }
  children() { return this.people().filter((p) => p.type === 'child'); }

  /** Portions to actually cook, rounded to something sane for a recipe. */
  householdServings() {
    const total = this.people().reduce((sum, p) => sum + appetiteShare(p), 0);
    return Math.max(1, Math.round(total * 2) / 2);
  }

  savePeople(list) {
    this.settings.people = list;
    this.settings.householdSize = this.householdServings();
    this.saveSettings();
    this.emit('people');
  }

  // --- who ate it ----------------------------------------------------------
  // --- Who ate it, every time we've made it --------------------------------
  //
  // One meal cooked on one night is a "sitting". Each sitting stores what
  // every person made of it. Keeping them all — rather than only the last —
  // is what lets the app say "Jett has eaten this twice out of three" instead
  // of the much less useful "Jett didn't eat it".

  sittings(recipeId) {
    const r = this.state.recipes[recipeId];
    return r ? (r.sittings || []).slice().sort((a, b) => String(a.at).localeCompare(String(b.at))) : [];
  }

  latestSitting(recipeId) {
    const all = this.sittings(recipeId);
    return all.length ? all[all.length - 1] : null;
  }

  /**
   * Start a fresh sitting for tonight, or hand back the one already open.
   * "Already open" means we logged one within the last six hours — long
   * enough to cover leftovers and second helpings, short enough that
   * Thursday never gets folded into Tuesday.
   */
  openSitting(recipeId) {
    const last = this.latestSitting(recipeId);
    if (last) {
      const age = Date.now() - new Date(last.at).getTime();
      if (age >= 0 && age < 6 * 3600 * 1000) return last;
    }
    return null;
  }

  /** Create or update one sitting. `map` is { personId: verdictId }. */
  recordSitting(recipeId, map, opts = {}) {
    const r = this.state.recipes[recipeId];
    if (!r) return null;
    r.sittings = Array.isArray(r.sittings) ? r.sittings : [];

    const clean = {};
    for (const [pid, vid] of Object.entries(map || {})) if (vid && verdictOf(vid)) clean[pid] = vid;

    let sitting;
    if (opts.id) {
      sitting = r.sittings.find((x) => x.id === opts.id);
      if (!sitting) return null;
      sitting.verdicts = clean;
      if (opts.at) sitting.at = opts.at;
      if (opts.note !== undefined) sitting.note = opts.note;
    } else {
      sitting = { id: uid('sit'), at: opts.at || nowISO(), verdicts: clean, note: opts.note || '' };
      r.sittings.push(sitting);
    }

    // An empty sitting is noise — drop it rather than leaving a blank row.
    r.sittings = r.sittings.filter((x) => Object.keys(x.verdicts || {}).length);
    r.verdicts = latestVerdictMap(r.sittings);
    r.updatedAt = nowISO();
    this.commit('recipe', recipeId, 'recipe:verdict');
    return sitting;
  }

  deleteSitting(recipeId, sittingId) {
    const r = this.state.recipes[recipeId];
    if (!r || !Array.isArray(r.sittings)) return;
    r.sittings = r.sittings.filter((x) => x.id !== sittingId);
    r.verdicts = latestVerdictMap(r.sittings);
    r.updatedAt = nowISO();
    this.commit('recipe', recipeId, 'recipe:verdict');
  }

  /**
   * Set one person's verdict on one sitting. Used by the tap-a-chip sheet,
   * which saves as you go rather than making you remember to hit Save.
   */
  setVerdict(recipeId, personId, verdictId, sittingId) {
    const r = this.state.recipes[recipeId];
    if (!r) return null;
    const target = sittingId
      ? (r.sittings || []).find((x) => x.id === sittingId)
      : this.latestSitting(recipeId);
    const map = { ...(target ? target.verdicts : {}) };
    if (!verdictId) delete map[personId]; else map[personId] = verdictId;
    return this.recordSitting(recipeId, map, target ? { id: target.id } : {});
  }

  /**
   * How the most recent sitting went down. Returns null when nobody has
   * weighed in yet. `times` says how many sittings are on record, so the UI
   * can say "last time" honestly rather than implying it's the only time.
   */
  familyVerdict(recipe) {
    if (!recipe) return null;
    const last = (recipe.sittings || []).slice().sort((a, b) => String(a.at).localeCompare(String(b.at))).pop();
    const v = last ? last.verdicts : {};
    const people = this.people();
    const rows = people
      .map((p) => ({ person: p, v: v[p.id] && verdictOf(v[p.id]) }))
      .filter((x) => x.v && x.v.id !== 'absent');
    if (!rows.length) return null;
    const kids = rows.filter((x) => x.person.type === 'child');
    const happy = rows.filter((x) => x.v.score > 0).length;
    const raw = rows.reduce((sum, x) => sum + x.v.score, 0) / rows.length;
    return {
      rows,
      at: last.at,
      sittingId: last.id,
      times: (recipe.sittings || []).length,
      score: raw,
      wholeFamily: rows.length === people.length && rows.every((x) => x.v.score > 0),
      kidsAte: kids.length > 0 && kids.every((x) => x.v.score > 0),
      kidsCount: kids.length,
      happy,
      total: rows.length,
    };
  }

  /**
   * "Everyone ate it" for filtering and badges. True if the last sitting went
   * down clean, or if the running record says it always does — a night when
   * someone was out shouldn't quietly drop a proven meal off the list.
   */
  everyoneAte(recipe) {
    const fam = this.familyVerdict(recipe);
    if (fam && fam.wholeFamily) return true;
    const rec = this.familyRecord(recipe);
    return !!(rec && rec.reliable);
  }

  /**
   * The long view: every sitting rolled up per person. This is what the
   * planner should lean on, because one bad night with a tired seven-year-old
   * shouldn't retire a meal everyone normally eats.
   */
  familyRecord(recipe) {
    if (!recipe) return null;
    const sittings = (recipe.sittings || []).slice().sort((a, b) => String(a.at).localeCompare(String(b.at)));
    if (!sittings.length) return null;
    const people = this.people();

    const rows = people.map((p) => {
      const marks = sittings
        .map((sit) => ({ at: sit.at, v: verdictOf(sit.verdicts[p.id]) }))
        .filter((m) => m.v);
      const served = marks.filter((m) => m.v.id !== 'absent');
      const ate = served.filter((m) => m.v.score > 0);
      const avg = served.length ? served.reduce((t, m) => t + m.v.score, 0) / served.length : null;

      // Are they coming round to it? Compare the last two against the rest.
      let trend = 0;
      if (served.length >= 3) {
        const recent = served.slice(-2);
        const earlier = served.slice(0, -2);
        const rAvg = recent.reduce((t, m) => t + m.v.score, 0) / recent.length;
        const eAvg = earlier.reduce((t, m) => t + m.v.score, 0) / earlier.length;
        if (rAvg - eAvg >= 0.75) trend = 1;
        else if (eAvg - rAvg >= 0.75) trend = -1;
      }
      return { person: p, marks, served: served.length, ate: ate.length, avg, trend, last: served.length ? served[served.length - 1].v : null };
    }).filter((x) => x.marks.length);

    const scored = rows.filter((x) => x.avg != null);
    const kids = scored.filter((x) => x.person.type === 'child');
    return {
      times: sittings.length,
      sittings,
      rows,
      firstAt: sittings[0].at,
      lastAt: sittings[sittings.length - 1].at,
      score: scored.length ? scored.reduce((t, x) => t + x.avg, 0) / scored.length : 0,
      // "Reliable" = everyone who was at the table ate it, every single time.
      reliable: sittings.length >= 2 && scored.length > 0 && scored.every((x) => x.ate === x.served && x.served > 0),
      kidsScore: kids.length ? kids.reduce((t, x) => t + x.avg, 0) / kids.length : null,
      kidsCount: kids.length,
    };
  }

  // --- settings ------------------------------------------------------------
  setSetting(k, v) {
    this.settings[k] = v;
    this.saveSettings();
    this.emit('settings');
  }

  // --- export / import -----------------------------------------------------
  exportJSON() {
    return JSON.stringify({ state: this.state, settings: { ...this.settings, syncKey: '', aiKey: '', instacartKey: '' } }, null, 2);
  }

  importJSON(text, { merge = true } = {}) {
    const data = JSON.parse(text);
    if (!data.state) throw new Error('That file does not look like a ReciMe backup.');
    if (!merge) this.state = blankState();
    for (const kind of ['recipes', 'plans', 'shopping', 'pantry']) {
      const incoming = data.state[kind] || {};
      for (const [k, v] of Object.entries(incoming)) {
        const cur = this.state[kind][k];
        if (!cur || (v.updatedAt || '') > (cur.updatedAt || '')) this.state[kind][k] = v;
      }
    }
    this.state.meta.seeded = true;
    this.saveNow();
    this.emit('import');
  }
}

// ---------------------------------------------------------------------------
// Cloud sync — plain PostgREST calls against Supabase, no SDK needed.
// One table, one row per record, last-write-wins on updated_at.
// ---------------------------------------------------------------------------

const KIND_TO_SLICE = { recipe: 'recipes', plan: 'plans', shop: 'shopping', pantry: 'pantry', nudge: 'nudges' };
const SLICE_TO_KIND = { recipes: 'recipe', plans: 'plan', shopping: 'shop', pantry: 'pantry', nudges: 'nudge' };

let pushTimer = null;
function schedulePush(store) {
  if (!store.settings.syncUrl || !store.settings.syncKey) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => pushDirty(store), 900);
}

function restHeaders(s) {
  return {
    'apikey': s.settings.syncKey,
    'Authorization': 'Bearer ' + s.settings.syncKey,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=minimal',
  };
}

function restBase(s) {
  return String(s.settings.syncUrl || '').replace(/\/+$/, '') + '/rest/v1/recime_items';
}

/**
 * Publish shareable recipes into each circle. Deliberately narrow: only
 * `kind: 'recipe'`, only recipes not marked private, and never anything to do
 * with plans or shopping.
 */
export async function pushToCircles(store, recipeIds) {
  const circles = store.circles();
  if (!circles.length || !store.settings.syncUrl || !store.settings.syncKey) return;
  const ids = recipeIds && recipeIds.length ? recipeIds : store.shareableRecipes().map((r) => r.id);
  if (!ids.length) return;

  const rows = [];
  for (const c of circles) {
    if (c.mode === 'pull-only') continue;
    for (const id of ids) {
      const r = store.state.recipes[id];
      if (!r || r.private || r.sharedFrom) continue;
      rows.push({
        household: c.code,
        kind: 'recipe',
        item_id: id,
        data: { ...r, sharedBy: store.settings.displayName || 'someone', sharedFromHousehold: store.settings.household },
        updated_at: r.updatedAt || nowISO(),
        deleted: !!r.deleted,
      });
    }
  }
  if (!rows.length) return;
  try {
    await fetch(restBase(store) + '?on_conflict=household,kind,item_id', {
      method: 'POST', headers: restHeaders(store), body: JSON.stringify(rows),
    });
  } catch (e) { console.warn('circle push failed', e); }
}

/** Pull recipes shared by others into the library, tagged with who shared them. */
export async function pullFromCircles(store) {
  const circles = store.circles();
  if (!circles.length || !store.settings.syncUrl || !store.settings.syncKey) return 0;
  let changed = 0;
  for (const c of circles) {
    if (c.mode === 'push-only') continue;
    try {
      const url = `${restBase(store)}?select=*&household=eq.${encodeURIComponent(c.code)}&kind=eq.recipe&order=updated_at.desc&limit=800`;
      const res = await fetch(url, {
        headers: { apikey: store.settings.syncKey, Authorization: 'Bearer ' + store.settings.syncKey },
      });
      if (!res.ok) continue;
      for (const row of await res.json()) {
        const incoming = row.data || {};
        // Never re-import our own recipes back in as "shared".
        if (incoming.sharedFromHousehold === store.settings.household) continue;
        const localId = 'shared-' + c.id + '-' + row.item_id;
        const cur = store.state.recipes[localId];
        if (cur && (cur.updatedAt || '') >= (incoming.updatedAt || row.updated_at || '')) continue;
        store.state.recipes[localId] = {
          ...incoming,
          id: localId,
          seed: false,
          sharedFrom: { circleId: c.id, circleName: c.name, by: incoming.sharedBy || '' },
          // Their ratings and habits are theirs, not ours.
          favorite: cur?.favorite || false,
          rating: cur?.rating || 0,
          frequency: cur?.frequency || '',
          cookedCount: cur?.cookedCount || 0,
          verdicts: cur?.verdicts || {},
          notes: cur?.notes || '',
        };
        changed++;
      }
    } catch (e) { console.warn('circle pull failed', e); }
  }
  if (changed) { store.saveNow(); store.emit('circles:changed'); }
  return changed;
}

export async function pushDirty(store) {
  if (!store.settings.syncUrl || !store.settings.syncKey) return;
  const ids = Array.from(store.dirty);
  if (!ids.length) return;
  const rows = [];
  for (const key of ids) {
    const [kind, ...rest] = key.split(':');
    const id = rest.join(':');
    const slice = KIND_TO_SLICE[kind];
    if (!slice) continue;
    const data = store.state[slice][id];
    if (!data) continue;
    rows.push({
      household: store.settings.household,
      kind,
      item_id: id,
      data,
      updated_at: data.updatedAt || nowISO(),
      deleted: !!data.deleted,
    });
  }
  if (!rows.length) { store.dirty.clear(); return; }
  store.syncStatus = 'syncing'; store.emit('sync');
  try {
    const res = await fetch(restBase(store) + '?on_conflict=household,kind,item_id', {
      method: 'POST', headers: restHeaders(store), body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 200));
    const recipeIds = rows.filter((r) => r.kind === 'recipe').map((r) => r.item_id);
    store.dirty.clear();
    store.syncStatus = 'ok'; store.syncMessage = ''; store.emit('sync');
    if (recipeIds.length) pushToCircles(store, recipeIds);
  } catch (e) {
    store.syncStatus = 'error'; store.syncMessage = String(e.message || e); store.emit('sync');
  }
}

export async function pullRemote(store) {
  if (!store.settings.syncUrl || !store.settings.syncKey) return;
  store.syncStatus = 'syncing'; store.emit('sync');
  try {
    const since = store.lastPull ? `&updated_at=gt.${encodeURIComponent(store.lastPull)}` : '';
    const url = `${restBase(store)}?select=*&household=eq.${encodeURIComponent(store.settings.household)}${since}&order=updated_at.asc&limit=5000`;
    const res = await fetch(url, {
      headers: { apikey: store.settings.syncKey, Authorization: 'Bearer ' + store.settings.syncKey },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 200));
    const rows = await res.json();
    let changed = 0, newest = store.lastPull;
    for (const row of rows) {
      const slice = KIND_TO_SLICE[row.kind];
      if (!slice) continue;
      const cur = store.state[slice][row.item_id];
      const incoming = row.data || {};
      if (!cur || (incoming.updatedAt || row.updated_at || '') > (cur.updatedAt || '')) {
        store.state[slice][row.item_id] = incoming;
        changed++;
      }
      if (!newest || row.updated_at > newest) newest = row.updated_at;
    }
    store.lastPull = newest;
    if (changed) { store.saveNow(); store.emit('sync:changed'); }
    store.syncStatus = 'ok'; store.syncMessage = ''; store.emit('sync');
    return changed;
  } catch (e) {
    store.syncStatus = 'error'; store.syncMessage = String(e.message || e); store.emit('sync');
    return 0;
  }
}

let pollTimer = null;
export function startSync(store) {
  stopSync();
  if (!store.settings.syncUrl || !store.settings.syncKey) { store.syncStatus = 'off'; store.emit('sync'); return; }
  const tick = () => {
    if (document.visibilityState !== 'visible') return;
    pullRemote(store);
    pullFromCircles(store);
  };
  tick();
  pollTimer = setInterval(tick, 20000);
  document.addEventListener('visibilitychange', tick);
}

export function stopSync() { if (pollTimer) clearInterval(pollTimer); pollTimer = null; }

export const store = new Store();
export default store;
