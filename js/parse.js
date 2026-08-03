// ---------------------------------------------------------------------------
// parse.js — getting a recipe *into* the app
//
// Three routes, in order of preference:
//   1. A URL, sent to the Supabase Edge Function, which fetches the page
//      server-side and reads schema.org Recipe JSON-LD. Works for basically
//      every real recipe site, plus video captions.
//   2. Pasted raw text, parsed locally with heuristics. Always available.
//   3. Manual entry.
// ---------------------------------------------------------------------------
import { normUnit, normName, uid, nowISO, titleCase } from './util.js';

const UNIT_WORDS = 'cups?|c\\.|pcs?|pieces?|tablespoons?|tbsps?|tbs|tbsp|teaspoons?|tsps?|tsp|ounces?|oz|pounds?|lbs?|lb|grams?|g|kilograms?|kg|milliliters?|ml|liters?|liters?|l|pints?|quarts?|qt|gallons?|gal|cloves?|cans?|jars?|bunches|bunch|heads?|stalks?|sprigs?|slices?|packages?|pkg|bags?|boxes|box|loaves|loaf|ears?|fillets?|pinch(?:es)?|dash(?:es)?|handfuls?|sticks?';

const FRACTIONS = { '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75, '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8, '⅙': 1 / 6, '⅚': 5 / 6, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875 };

export function parseQuantity(s) {
  let t = String(s || '').trim();
  if (!t) return null;
  for (const [g, v] of Object.entries(FRACTIONS)) {
    t = t.replace(new RegExp(g, 'g'), ' ' + v + ' ');
  }
  t = t.replace(/\s+/g, ' ').trim();
  // "1 1/2" or "1-1/2"
  const mixed = t.match(/^(\d+)[\s-]+(\d+)\s*\/\s*(\d+)/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = t.match(/^(\d+)\s*\/\s*(\d+)/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  // "1 0.5" produced by the vulgar-fraction replacement above
  const two = t.match(/^(\d+)\s+(0?\.\d+)/);
  if (two) return Number(two[1]) + Number(two[2]);
  const range = t.match(/^(\d*\.?\d+)\s*(?:-|–|to)\s*(\d*\.?\d+)/);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;
  const plain = t.match(/^(\d*\.?\d+)/);
  if (plain) return Number(plain[1]);
  return null;
}

const CATEGORY_RULES = [
  // A few names sit in more than one rule below — broth reads as "chicken",
  // salt and pepper reads as "pepper". These run first so the obvious answer
  // wins over the accidental one.
  ['Canned & Jarred', /\b(broth|stock|bouillon)\b/i],
  ['Spices & Baking', /^(salt|pepper|salt and pepper|black pepper|kosher salt|sea salt|white pepper|salt & pepper)$/i],
  ['Condiments & Sauces', /\b(olive oil|vegetable oil|canola oil|avocado oil|sesame oil|coconut oil|neutral oil)\b/i],
  ['Produce', /lettuce|spinach|kale|arugula|romaine|cabbage|carrot|celery|onion|shallot|scallion|green onion|garlic|ginger|potato|sweet potato|tomato|cucumber|pepper|jalape|zucchini|squash|broccoli|cauliflower|mushroom|asparagus|green bean|pea\b|corn\b|avocado|lemon|lime|orange|apple|banana|berry|berries|grape|melon|mango|pineapple|peach|pear|herb|basil|cilantro|parsley|mint|dill|rosemary|thyme|sage|chive|leek|radish|beet|turnip|eggplant|brussels|bok choy|fennel|artichoke|salad|sprout|lettuce|plantain|date|fig|pomegranate|cranberr/i],
  ['Meat & Seafood', /chicken|beef|steak|pork|bacon|sausage|turkey|lamb|veal|ground |salmon|tuna|cod|tilapia|halibut|shrimp|prawn|scallop|crab|lobster|mussel|clam|fish|anchov|chorizo|prosciutto|pancetta|brisket|ribs?\b|tenderloin|cutlet|thigh|breast|drumstick/i],
  ['Dairy & Eggs', /milk|cream|butter|cheese|yogurt|yoghurt|egg|sour cream|half.and.half|ricotta|mozzarella|parmesan|feta|cheddar|cottage cheese|mascarpone|kefir|ghee|buttermilk/i],
  ['Bakery', /bread|bun|roll|bagel|tortilla|pita|naan|baguette|croissant|english muffin|brioche|focaccia|crust/i],
  ['Frozen', /frozen|ice cream|popsicle|puff pastry|phyllo/i],
  ['Canned & Jarred', /canned|can of|jar|tomato paste|tomato sauce|crushed tomato|diced tomato|coconut milk|broth|stock|beans?\b|chickpea|lentil.*can|olive|caper|artichoke heart|roasted red pepper|pickle|salsa|tuna.*can|pumpkin puree|applesauce/i],
  ['Dry Goods & Pasta', /pasta|spaghetti|penne|rigatoni|linguine|fettuccine|orzo|macaroni|noodle|rice\b|quinoa|farro|barley|couscous|oats?|granola|cereal|flour|lentils?|dried bean|panko|breadcrumb|cornmeal|polenta|tortilla chip|cracker|nut\b|almond|walnut|pecan|cashew|pistachio|peanut|seed|chia|flax|raisin|dried/i],
  ['Condiments & Sauces', /oil\b|vinegar|soy sauce|tamari|fish sauce|worcestershire|mustard|ketchup|mayonnaise|mayo|hot sauce|sriracha|bbq|barbecue|hoisin|teriyaki|tahini|hummus|pesto|dressing|syrup|honey|jam|jelly|peanut butter|almond butter|miso|gochujang|harissa|curry paste|salsa|marinara/i],
  ['Spices & Baking', /salt|pepper\b|cumin|paprika|coriander|turmeric|cinnamon|nutmeg|clove\b|cardamom|chili powder|cayenne|oregano|thyme|basil.*dried|bay lea|garlic powder|onion powder|italian seasoning|za'?atar|sumac|garam masala|curry powder|vanilla|baking powder|baking soda|yeast|sugar|cocoa|chocolate chip|corn ?starch|gelatin|extract|food coloring|sesame seed|red pepper flake|everything bagel/i],
  ['Beverages', /water|juice|soda|wine|beer|coffee|tea\b|broth.*carton|sparkling|kombucha/i],
];

export function guessCategory(name) {
  const n = String(name).toLowerCase();
  for (const [cat, re] of CATEGORY_RULES) if (re.test(n)) return cat;
  return 'Other';
}

/** Parse one ingredient line like "1 1/2 lbs boneless chicken thighs, trimmed" */
/**
 * Social-video captions write ingredients backwards: "Tomatoes – 800 g" rather
 * than "800 g tomatoes". Flip those round before the normal parser sees them,
 * and handle the amount-free ones ("Salt and pepper – to taste") as notes.
 */
const AMOUNTLESS = /^(to taste|for garnish|for serving|as needed|optional|to serve|for (?:the )?\w+(?:\s+\w+){0,3})$/i;

export function flipReversedIngredient(line) {
  const t = String(line || '').trim();
  // Already starts with a number? Then it's written the usual way round.
  if (/^[-•*·▢□◻☐\s]*(\d|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/.test(t)) return t;
  const m = t.match(/^(.{2,60}?)\s+[–—]\s+(.+)$/) || t.match(/^(.{2,60}?)\s+-\s+(.+)$/);
  if (!m) return t;
  const name = m[1].trim().replace(/[:,]$/, '');
  const amount = m[2].trim();
  if (!name || /\d/.test(name)) return t;

  // "Salt and pepper – to taste" / "Butter – for spreading on bread"
  const bare = amount.replace(/[.;]$/, '');
  if (AMOUNTLESS.test(bare)) return name + ', ' + bare.toLowerCase();

  // "800 g, quartered" -> "800 g tomatoes, quartered"
  const q = amount.match(/^((?:\d*\.?\d+\s*(?:-|–|to)\s*)?\d*\.?\d+|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])\s*([a-z]+\.?)?\s*(.*)$/i);
  if (!q) return t;
  const qty = q[1];
  const maybeUnit = (q[2] || '').replace(/\.$/, '');
  const rest = (q[3] || '').replace(/^[,;]\s*/, '').trim();
  const isUnit = maybeUnit && new RegExp('^(' + UNIT_WORDS + ')$', 'i').test(maybeUnit);
  const head = [qty, isUnit ? maybeUnit : '', name].filter(Boolean).join(' ');
  const tailBits = [isUnit ? '' : maybeUnit, rest].filter(Boolean).join(' ').trim();
  return tailBits ? head + ', ' + tailBits : head;
}

export function parseIngredientLine(line) {
  let t = flipReversedIngredient(String(line || '').replace(/^[-•*·▢□◻☐\s]+/, '').trim());
  if (!t) return null;
  t = t.replace(/\s+/g, ' ');

  let notes = '';
  const commaSplit = t.match(/^(.*?),\s*(.+)$/);
  if (commaSplit && /^(chopped|minced|diced|sliced|shredded|grated|melted|softened|divided|drained|rinsed|trimmed|peeled|halved|quartered|cubed|julienned|torn|packed|to taste|for serving|for garnish|optional|plus more|room temperature|thinly sliced|finely chopped|roughly chopped|crushed|beaten|separated|at room temperature|for spreading[^,]*|for the [a-z ]+|for dusting|for rolling|for frying|for brushing|as needed|to serve)/i.test(commaSplit[2])) {
    t = commaSplit[1]; notes = commaSplit[2];
  }

  // Order matters: mixed numbers must be tried before a bare integer, or
  // "1½ cups flour" parses as 1 and leaves "½ cups" glued to the name.
  const VF = '½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞';
  const qtyRe = new RegExp(
    '^((?:\\d+\\s*[' + VF + '])'                        // 1½
    + '|(?:\\d+[\\s-]+\\d+\\s*\\/\\s*\\d+)'             // 1 1/2
    + '|(?:\\d+\\s*\\/\\s*\\d+)'                         // 1/2
    + '|(?:\\d*\\.?\\d+\\s*(?:-|–|to)\\s*\\d*\\.?\\d+)'  // 2-3
    + '|(?:\\d*\\.?\\d+)'                                // 2  /  1.5
    + '|[' + VF + '])\\s*');
  const qm = t.match(qtyRe);
  let quantity = null;
  if (qm) { quantity = parseQuantity(qm[1]); t = t.slice(qm[0].length); }

  let unit = '';
  const um = t.match(new RegExp('^(' + UNIT_WORDS + ')\\b\\.?\\s*', 'i'));
  if (um) { unit = normUnit(um[1]); t = t.slice(um[0].length); }

  // "(14.5 oz) can" style
  const paren = t.match(/^\(([^)]*)\)\s*/);
  if (paren && !unit) { t = t.slice(paren[0].length); }

  const um2 = t.match(new RegExp('^(' + UNIT_WORDS + ')\\b\\.?\\s*(?:of\\s+)?', 'i'));
  if (!unit && um2) { unit = normUnit(um2[1]); t = t.slice(um2[0].length); }

  t = t.replace(/^of\s+/i, '').trim();
  if (!t) return null;

  if (!notes) {
    const trailing = t.match(/^(.*?)\s*[,(]\s*(chopped|minced|diced|sliced|optional|divided|to taste|plus more[^)]*)\)?$/i);
    if (trailing) { t = trailing[1]; notes = trailing[2]; }
  }

  return {
    quantity: quantity == null ? 1 : Math.round(quantity * 1000) / 1000,
    unit,
    item: t.replace(/\s+/g, ' ').trim(),
    notes: notes.trim(),
    category: guessCategory(t),
  };
}

const STEP_SPLIT = /(?:\n\s*\n|\n(?=\s*(?:step\s*\d|\d+[.)]\s))|\n)/i;

/**
 * Captions arrive as a wall of text: "Ingredients (for 4 servings): Tomatoes –
 * 800 g, quartered Sweet bell peppers – 2 ..." — headings inline, every
 * ingredient on the same line. Break it back into the shape a parser can read.
 */
export function unwrapCaption(raw) {
  let t = String(raw || '').replace(/\r/g, '');

  // Put every heading on its own line, dropping any "(for 4 servings)" aside.
  t = t.replace(/(^|[\s.!?])(ingredients?|instructions?|directions?|method|steps?|preparation|you will need|what you need)\s*(?:\([^)]*\))?\s*:/gi,
    (_m, pre, word) => pre + '\n' + word + ':\n');

  // A numbered run of steps on one line -> one step per line.
  t = t.replace(/\s+(?=\d{1,2}[.)]\s+[A-Z])/g, '\n');

  return t.split('\n').map((l) => l.trim()).join('\n');
}

/**
 * One line holding several "Name – amount" ingredients gets cut before each
 * capitalised name that is followed by a dash. Anything without that shape is
 * handed back untouched.
 */
export function splitRunOnIngredients(line) {
  const t = String(line || '').trim();
  if (t.length < 40) return [t];
  const marker = /[A-Z][A-Za-z'’()./-]*(?:\s+[A-Za-z'’()./-]+){0,4}\s+[–—]\s+/g;
  const hits = [...t.matchAll(marker)];
  if (hits.length < 2) return [t];
  const out = [];
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].index;
    const end = i + 1 < hits.length ? hits[i + 1].index : t.length;
    const piece = t.slice(start, end).trim().replace(/[,;]$/, '');
    if (piece) out.push(piece);
  }
  return out.length ? out : [t];
}

/**
 * A method pasted as one paragraph is one wall of text on the recipe page.
 * Break a long step into sentences so "Heat a large Dutch oven… Add onion…
 * Simmer for 1 hour." becomes the six steps it actually is.
 *
 * Careful about full stops that aren't sentence ends: decimals, temperatures,
 * and the usual abbreviations.
 */
export function explodeStep(step) {
  const t = String(step || '').trim();
  if (t.length < 160) return [t];

  const guarded = t
    .replace(/(\d)\.(\d)/g, '$1\u0001$2')                       // 1.5
    .replace(/\b(approx|approximately|tbsp|tsp|oz|lb|min|hr|no|vs|etc|Dr|Mr|Mrs|St)\./gi, '$1\u0001')
    .replace(/\b([A-Z])\./g, '$1\u0001');                        // initials

  const parts = guarded
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((x) => x.replace(/\u0001/g, '.').trim())
    .filter(Boolean);

  if (parts.length < 3) return [t];

  // Glue orphan fragments onto the sentence before them — "Simmer." on its own
  // is not a step.
  const out = [];
  for (const p of parts) {
    if (out.length && (p.length < 28 || /^(then|and|stir|serve|season)\b/i.test(p) && p.length < 45)) {
      out[out.length - 1] += ' ' + p;
    } else {
      out.push(p);
    }
  }
  return out.length > 1 ? out : [t];
}

export function parseRecipeText(text, hint = {}) {
  const raw = unwrapCaption(text);
  const lines = raw.split('\n').map((l) => l.trim());

  let title = hint.title || '';
  let ingStart = -1, stepStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].toLowerCase().replace(/[^a-z ]/g, '').trim();
    if (ingStart < 0 && /^(ingredients?|you will need|what you need|shopping list)$/.test(l)) ingStart = i + 1;
    else if (stepStart < 0 && /^(instructions?|directions?|method|steps?|preparation|how to make it?|to make)$/.test(l)) stepStart = i + 1;
  }

  if (!title) {
    for (const l of lines) {
      if (l && l.length > 3 && l.length < 90 && !/^https?:/i.test(l)) { title = l.replace(/[#*]/g, '').trim(); break; }
    }
  }

  let ingLines = [], stepLines = [];
  if (ingStart >= 0) {
    const end = stepStart > ingStart ? stepStart - 1 : lines.length;
    ingLines = lines.slice(ingStart, end).filter(Boolean);
  }
  if (stepStart >= 0) stepLines = lines.slice(stepStart).filter(Boolean);

  // No headings — guess by shape. Ingredient lines are short and start with a number.
  if (!ingLines.length && !stepLines.length) {
    for (const l of lines) {
      if (!l) continue;
      if (l === title) continue;
      const looksIngredient = /^[-•*·▢□]?\s*(\d|[½⅓⅔¼¾⅛⅜⅝⅞])/.test(l) && l.length < 110 && !/\.\s/.test(l);
      if (looksIngredient) ingLines.push(l);
      else if (l.length > 40) stepLines.push(l);
    }
  }

  const ingredients = ingLines
    .flatMap(splitRunOnIngredients)
    .map(parseIngredientLine)
    .filter(Boolean);
  const steps = stepLines
    .map((s) => s.replace(/^\s*(?:step\s*)?\d+[.):]?\s*/i, '').replace(/^[-•*]\s*/, '').trim())
    .filter((s) => s.length > 8)
    .flatMap(explodeStep);

  const servM = raw.match(/(?:serves|servings?|yield)[:\s]*(\d{1,2})/i)
    || raw.match(/(?:for\s+)?(\d{1,2})\s*(?:servings?|portions|people)/i);
  const prepM = raw.match(/prep(?:\s*time)?[:\s]*(\d{1,3})/i);
  const cookM = raw.match(/cook(?:ing)?(?:\s*time)?[:\s]*(\d{1,3})/i);
  const totM = raw.match(/total(?:\s*time)?[:\s]*(\d{1,3})/i);

  return {
    title: tidyCaptionTitle(title) || 'Imported recipe',
    description: hint.description || '',
    servings: servM ? Number(servM[1]) : 4,
    prepMinutes: prepM ? Number(prepM[1]) : 0,
    cookMinutes: cookM ? Number(cookM[1]) : (totM ? Number(totM[1]) : 0),
    ingredients,
    steps,
    cuisine: hint.cuisine || guessCuisine(raw),
    mealType: hint.mealType || guessMealType(title + ' ' + raw),
    tags: autoTags({ title, ingredients, steps, text: raw }),
    sourceUrl: hint.sourceUrl || '',
    image: hint.image || '',
  };
}

export function guessCuisine(text) {
  const t = String(text).toLowerCase();
  const rules = [
    ['Mexican', /taco|salsa|enchilada|burrito|tortilla|chipotle|cotija|queso|adobo|carnitas|elote/],
    ['Italian', /pasta|risotto|parmesan|marinara|pancetta|pesto|prosciutto|gnocchi|polenta|caprese|\bragu\b/],
    ['Thai', /thai|fish sauce|lemongrass|coconut milk.*curry|red curry|green curry|pad /],
    ['Chinese', /soy sauce.*ginger|hoisin|szechuan|sichuan|stir[- ]fry|wok|oyster sauce|bok choy/],
    ['Japanese', /miso|mirin|dashi|soba|teriyaki|panko.*japanese|sushi|nori/],
    ['Korean', /gochujang|kimchi|bulgogi|korean|gochugaru/],
    ['Indian', /garam masala|turmeric|curry powder|tikka|paneer|naan|dal\b|chana|ghee|cardamom/],
    ['Middle Eastern', /tahini|za'?atar|sumac|harissa|falafel|shawarma|labneh|pomegranate molasses/],
    ['Greek', /feta|tzatziki|kalamata|oregano.*lemon|souvlaki|phyllo/],
    ['Mediterranean', /olive oil.*lemon.*herb|chickpea.*olive|mediterranean/],
  ];
  for (const [c, re] of rules) if (re.test(t)) return c;
  return 'American';
}

export function guessMealType(text) {
  const t = String(text).toLowerCase();
  // Savoury mains are checked first and the dessert words carry word
  // boundaries — without them "pieces of tomato" matched /pie/ and a tomato
  // soup came in filed as dessert.
  if (/\b(soup|stew|chili|chowder|bisque|curry|roast|casserole|stir[- ]fry|pasta|risotto|tacos?|burgers?)\b/.test(t)) {
    return /\b(soup|salad|sandwich|wrap)\b/.test(t) && /\blunch\b/.test(t) ? 'lunch' : 'dinner';
  }
  if (/\b(pancakes?|waffles?|oatmeal|overnight oats|granola|smoothie|omelets?|frittata|breakfast|brunch|muffins?|scones?|french toast|shakshuka|egg bake)\b/.test(t)) return 'breakfast';
  if (/\b(cakes?|cookies?|brownies?|pies?|dessert|ice cream|pudding|tarts?|bark|truffles?|frosting|popsicles?|cupcakes?)\b/.test(t)) return 'dessert';
  if (/\b(snack|dip|hummus|energy bites?|trail mix|popcorn|chips|appetizer)\b/.test(t)) return 'snack';
  if (/\b(salad|sandwich|wrap|bento|meal prep bowl)\b/.test(t)) return 'lunch';
  return 'dinner';
}

export function autoTags({ title = '', ingredients = [], steps = [], text = '' }) {
  const hay = (title + ' ' + text + ' ' + steps.join(' ') + ' ' + ingredients.map((i) => i.item).join(' ')).toLowerCase();
  const tags = new Set();
  if (/sheet ?pan|one ?pan|baking sheet/.test(hay)) tags.add('sheet-pan');
  if (/one ?pot|dutch oven|skillet.*everything|single pot/.test(hay)) tags.add('one-pot');
  if (/slow ?cooker|crock ?pot/.test(hay)) tags.add('slow-cooker');
  if (/instant ?pot|pressure ?cooker/.test(hay)) tags.add('instant-pot');
  if (/air ?fry/.test(hay)) tags.add('30-minute');

  const meaty = /chicken|beef|pork|turkey|lamb|bacon|sausage|fish|salmon|shrimp|anchov|gelatin/.test(
    ingredients.map((i) => i.item).join(' ').toLowerCase());
  const dairy = /milk|cheese|butter|yogurt|cream|egg|honey/.test(
    ingredients.map((i) => i.item).join(' ').toLowerCase());
  if (!meaty) { tags.add('vegetarian'); if (!dairy) tags.add('vegan'); }

  if (!/flour|bread|pasta|soy sauce|barley|couscous|panko|breadcrumb|tortilla|cracker|beer/.test(
    ingredients.map((i) => i.item).join(' ').toLowerCase())) tags.add('gluten-free');

  if (/freeze|freezer/.test(hay)) tags.add('freezer-friendly');
  if (/meal ?prep|make ahead|lunches/.test(hay)) tags.add('meal-prep');

  // What kind of dish is it? The starter recipes carry these by hand; without
  // this, an imported soup never picked up the soup tag and went missing from
  // the filter.
  const t = (title + ' ' + steps.join(' ')).toLowerCase();
  if (/\b(soup|stew|chowder|chili|bisque|broth[- ]based|ramen|pho)\b/.test(t)
      || /\b(simmer|ladle)\b.*\b(bowls?)\b/.test(t)) tags.add('soup');
  if (/\bsalad\b/.test(t)) tags.add('salad');
  if (/\b(pasta|spaghetti|penne|rigatoni|linguine|fettuccine|lasagna|orzo|gnocchi|noodles?)\b/.test(t)) tags.add('pasta');
  if (/\b(grill|grilled|barbecue|bbq)\b/.test(t)) tags.add('grill');
  if (/\b(curry|masala|tikka)\b/.test(t)) tags.add('curry');
  if (/\b(taco|burrito|quesadilla|enchilada|fajita)\b/.test(t)) tags.add('tacos');
  if (/\b(sandwich|burger|wrap|panini|melt)\b/.test(t)) tags.add('sandwich');
  if (/\b(no[- ]bake)\b/.test(t)) tags.add('no-bake');
  if (/\b(bake|baked|oven|bread|dough)\b/.test(t) && /\b(cake|cookie|brownie|muffin|loaf|bread|pie|tart|bun|roll)\b/.test(t)) tags.add('baking');

  const mins = (String(text).match(/(\d{1,3})\s*min/g) || []).map((x) => parseInt(x, 10));
  if (mins.length && Math.max(...mins) <= 30) tags.add('30-minute');

  return Array.from(tags).slice(0, 6);
}

export function estimateNutrition(recipe) {
  // Rough per-ingredient energy density, keyed by keyword. Deliberately coarse
  // — it's a ballpark so the cards aren't empty, and it's labeled as such.
  const DENSITY = [
    [/oil|butter|ghee|lard|shortening/, { kcalPerTsp: 40, fat: 4.6 }],
    [/sugar|honey|maple|syrup/, { kcalPerTsp: 16, carbs: 4.2 }],
    [/flour|breadcrumb|panko|oats|rice|quinoa|pasta|couscous|farro|barley/, { kcalPerCup: 620, carbs: 130, protein: 18 }],
    [/cheese|parmesan|cheddar|mozzarella|feta/, { kcalPerOz: 105, fat: 8, protein: 7 }],
    [/cream|half.and.half/, { kcalPerCup: 810, fat: 88 }],
    [/milk|yogurt|buttermilk|kefir/, { kcalPerCup: 130, protein: 9, carbs: 12, fat: 5 }],
    [/chicken|turkey|pork|beef|lamb|steak/, { kcalPerOz: 55, protein: 7, fat: 3 }],
    [/salmon|tuna|cod|fish|shrimp|scallop/, { kcalPerOz: 42, protein: 6, fat: 2 }],
    [/bacon|sausage|chorizo/, { kcalPerOz: 110, protein: 6, fat: 9 }],
    [/egg/, { kcalPerEach: 72, protein: 6, fat: 5 }],
    [/nut|almond|walnut|pecan|cashew|peanut butter|tahini/, { kcalPerOz: 170, fat: 15, protein: 6 }],
    [/bean|lentil|chickpea/, { kcalPerCup: 230, protein: 15, carbs: 40, fiber: 15 }],
    [/potato|sweet potato/, { kcalPerOz: 26, carbs: 6, fiber: 0.8 }],
    [/avocado/, { kcalPerEach: 240, fat: 22, fiber: 10 }],
    [/tomato|onion|pepper|carrot|celery|zucchini|broccoli|cauliflower|spinach|kale|cabbage|mushroom|cucumber|green bean|asparagus/, { kcalPerOz: 8, carbs: 1.6, fiber: 0.7 }],
    [/bread|tortilla|bun|pita|naan/, { kcalPerEach: 130, carbs: 24, protein: 4 }],
  ];
  let kcal = 0, protein = 0, carbs = 0, fat = 0, fiber = 0, sodium = 0;
  for (const ing of recipe.ingredients || []) {
    const n = String(ing.item).toLowerCase();
    const q = Number(ing.quantity) || 1;
    const u = normUnit(ing.unit);
    for (const [re, d] of DENSITY) {
      if (!re.test(n)) continue;
      let mult = 0;
      if (d.kcalPerTsp) mult = u === 'tbsp' ? q * 3 : u === 'cup' ? q * 48 : q;
      else if (d.kcalPerCup) mult = u === 'cup' ? q : u === 'oz' ? q / 6 : u === 'lb' ? q * 2.5 : q;
      else if (d.kcalPerOz) mult = u === 'lb' ? q * 16 : u === 'oz' ? q : q * 4;
      else if (d.kcalPerEach) mult = q;
      const base = d.kcalPerTsp || d.kcalPerCup || d.kcalPerOz || d.kcalPerEach || 0;
      kcal += base * mult / (d.kcalPerTsp ? 1 : 1);
      protein += (d.protein || 0) * mult / (d.kcalPerCup ? 1 : 1);
      carbs += (d.carbs || 0) * mult;
      fat += (d.fat || 0) * mult;
      fiber += (d.fiber || 0) * mult;
      break;
    }
    if (/salt|soy sauce|broth|stock|bouillon/.test(n)) sodium += 500 * q;
  }
  const s = Math.max(1, recipe.servings || 4);
  const clampN = (x) => Math.max(0, Math.round(x / s));
  return {
    calories: Math.max(80, clampN(kcal)),
    protein: clampN(protein), carbs: clampN(carbs), fat: clampN(fat),
    fiber: clampN(fiber), sodium: clampN(sodium),
    estimated: true,
  };
}

// ---------------------------------------------------------------------------
// Remote import
// ---------------------------------------------------------------------------

export function isVideoUrl(url) {
  return /tiktok\.com|instagram\.com\/(reel|p|tv)|youtube\.com\/(watch|shorts)|youtu\.be|facebook\.com\/(reel|watch)/i.test(String(url));
}

/**
 * Ask the backend for a stock photo of a dish. Returns a few candidates so the
 * first one can be used straight away and the rest offered as alternatives.
 */
export async function findPhotos(query, settings) {
  const base = String(settings.syncUrl || '').replace(/\/+$/, '');
  if (!base || !settings.syncKey) return null;
  try {
    const res = await fetch(base + '/functions/v1/parse-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + settings.syncKey, apikey: settings.syncKey },
      body: JSON.stringify({ photo: query }),
    });
    if (!res.ok) return null;
    const b = await res.json();
    return (b.photos && b.photos.length) ? b : null;
  } catch (e) { return null; }
}

export async function importFromUrl(url, settings) {
  const base = String(settings.syncUrl || '').replace(/\/+$/, '');
  if (!base || !settings.syncKey) {
    const e = new Error('needs-backend');
    e.code = 'needs-backend';
    throw e;
  }
  const res = await fetch(base + '/functions/v1/parse-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + settings.syncKey, apikey: settings.syncKey },
    body: JSON.stringify({ url, ai: !!settings.aiKey }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const e = new Error(body.error || ('Import failed (' + res.status + ')'));
    e.code = body.code || 'http-' + res.status;
    e.partial = body.partial;
    throw e;
  }
  // The server may hand back raw caption text instead of a structured recipe —
  // social captions in particular are easier to read here than on the server.
  if (!body.recipe && body.caption) {
    const meta = body.meta || {};
    const parsed = parseRecipeText(body.caption, {
      title: cleanTitle(meta['og:title'] || meta.title || '', url),
      image: meta['og:image'] || meta.image || '',
      sourceUrl: url,
    });
    if (!(parsed.ingredients || []).length) {
      const e = new Error('I could read the post but could not pick a recipe out of it. The caption is in your clipboard shape — tap Paste it in and drop it there.');
      e.code = 'no-recipe';
      e.caption = body.caption;
      throw e;
    }
    return normaliseImported(parsed, url);
  }

  return normaliseImported(body.recipe, url);
}

export function normaliseImported(r, url) {
  const out = {
    title: cleanTitle(r.title, url),
    description: (r.description || '').slice(0, 240),
    servings: Number(r.servings) || 4,
    prepMinutes: Number(r.prepMinutes) || 0,
    cookMinutes: Number(r.cookMinutes) || 0,
    cuisine: r.cuisine || guessCuisine(JSON.stringify(r)),
    mealType: r.mealType || guessMealType((r.title || '') + ' ' + JSON.stringify(r.ingredients || [])),
    difficulty: r.difficulty || 'easy',
    image: r.image || '',
    sourceUrl: url || r.sourceUrl || '',
    sourceInspiration: cleanAuthor(r.author) ? 'From ' + cleanAuthor(r.author) : (url ? hostOf(url) : ''),
    steps: (r.steps || []).map((s) => String(s).trim()).filter(Boolean),
    ingredients: [],
    tags: [],
    nutritionPerServing: r.nutritionPerServing || null,
  };
  for (const ing of r.ingredients || []) {
    if (typeof ing === 'string') {
      const p = parseIngredientLine(ing);
      if (p) out.ingredients.push(p);
    } else if (ing && ing.item) {
      out.ingredients.push({
        quantity: Number(ing.quantity) || 1,
        unit: normUnit(ing.unit || ''),
        item: ing.item,
        notes: ing.notes || '',
        category: ing.category || guessCategory(ing.item),
      });
    }
  }
  // A few sites publish several recipes in one blob; when that happens the
  // import comes back enormous. Keep it, but say so — the review screen lets
  // you delete the extra lines before saving.
  if (out.ingredients.length > 28 || out.steps.length > 25) {
    out.oversized = true;
  }
  out.tags = autoTags({ title: out.title, ingredients: out.ingredients, steps: out.steps, text: JSON.stringify(r) });
  if (!out.nutritionPerServing && out.ingredients.length) out.nutritionPerServing = estimateNutrition(out);
  return out;
}

/** Recipe sites tack their name onto the <title>: "Chana Masala - Love and Lemons". */
/** "Tomato soup with cheese toast – my fav fall combo 🍅" -> "Tomato soup with cheese toast" */
export function tidyCaptionTitle(t) {
  let s = String(t || '').trim();
  s = s.replace(/\s*[–—]\s*(my|our|the best|so good|easy|quick|this is)\b.*$/i, '');
  s = s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2190}-\u{21FF}]/gu, '');
  s = s.replace(/\s*#\w+/g, '').replace(/\s{2,}/g, ' ').trim();
  s = s.replace(/[\s\-–—:,.]+$/, '').trim();
  return s || String(t || '').trim();
}

export function cleanTitle(t, url) {
  let s = String(t || '').trim();
  if (!s) return 'Imported recipe';
  const host = hostOf(url).replace(/^www\./, '').split('.')[0];
  const parts = s.split(/\s+[|\u2013\u2014\u00b7]\s+|\s+-\s+/);
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    const squash = (x) => x.toLowerCase().replace(/[^a-z]/g, '');
    // Drop the trailing chunk only if it looks like the site's own name
    if (squash(last).includes(squash(host).slice(0, 6)) || squash(host).includes(squash(last).slice(0, 6))
        || /^(recipe|recipes|food|kitchen|blog)$/i.test(last.trim())) {
      s = parts.slice(0, -1).join(' - ').trim();
    }
  }
  s = s.replace(/\s*\((?:easy|quick|best|simple|healthy)\)\s*$/i, '');
  return s.slice(0, 120) || 'Imported recipe';
}

/** JSON-LD authors arrive as strings, objects, or arrays of objects. */
export function cleanAuthor(a) {
  if (!a) return '';
  if (typeof a === 'string') {
    if (/^\[object/.test(a) || a.length > 60) return '';
    return a.trim();
  }
  if (Array.isArray(a)) return cleanAuthor(a[0]);
  if (typeof a === 'object') return cleanAuthor(a.name);
  return '';
}

export function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
}

/** Pull a URL out of shared text — Android often puts the link in `text`. */
export function extractUrl(s) {
  const m = String(s || '').match(/https?:\/\/[^\s"'<>)]+/);
  return m ? m[0] : '';
}
