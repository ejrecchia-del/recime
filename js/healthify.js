// ---------------------------------------------------------------------------
// healthify.js — turns a recipe into a lighter "remix" without wrecking it
//
// The engine is a rule table. Each rule matches an ingredient by regex, swaps
// in a healthier stand-in, optionally scales the amount, and carries an
// estimate of what that swap saves per base-unit so we can re-estimate the
// nutrition panel. Estimates are labeled as estimates in the UI.
// ---------------------------------------------------------------------------
import { normUnit, toBase, uid, nowISO } from './util.js';

// savings are per base unit of the ORIGINAL ingredient
// volume base = 1 tsp, weight base = 1 oz, count base = 1 item
const RULES = [
  // --- Fats & dairy --------------------------------------------------------
  {
    id: 'heavy-cream', match: /heavy (whipping )?cream|double cream/i,
    to: 'evaporated 2% milk', factor: 1, why: 'Same silky body, a fraction of the saturated fat.',
    save: { kcal: 34, fat: 3.9, satfat: 2.4, sodium: 0 },
  },
  {
    id: 'half-and-half', match: /half[- ]and[- ]half/i,
    to: 'unsweetened oat milk + 1 tsp cornstarch', factor: 1, why: 'Keeps the creaminess, drops the dairy fat.',
    save: { kcal: 16, fat: 1.6, satfat: 1, sodium: 0 },
  },
  {
    id: 'sour-cream', match: /sour cream|creme fraiche|crème fraîche/i,
    to: 'plain nonfat Greek yogurt', factor: 1, why: 'Tangier, and roughly triple the protein.',
    save: { kcal: 12, fat: 1.7, satfat: 1.1, sodium: 0 },
  },
  {
    id: 'mayo', match: /\bmayonnaise\b|\bmayo\b/i,
    to: 'Greek yogurt whisked with a squeeze of lemon', factor: 0.85, why: 'Cuts about 80% of the fat and keeps the creaminess.',
    save: { kcal: 88, fat: 10, satfat: 1.5, sodium: 20 },
  },
  {
    id: 'cream-cheese', match: /cream cheese/i,
    to: 'Neufchâtel or whipped low-fat cottage cheese', factor: 1, why: 'A third less fat, same spread.',
    save: { kcal: 12, fat: 1.5, satfat: 0.9, sodium: 0 },
  },
  {
    id: 'butter-bake', match: /\bbutter\b/i, context: /bake|cake|bread|muffin|cookie|batter|dough/i,
    to: 'unsweetened applesauce (half) + olive oil (half)', factor: 0.75, why: 'Keeps crumbs moist with far less saturated fat.',
    save: { kcal: 120, fat: 15, satfat: 9, sodium: 20 },
  },
  {
    id: 'butter', match: /\bbutter\b/i,
    to: 'extra-virgin olive oil', factor: 0.75, why: 'Swaps saturated fat for monounsaturated, and you need less of it.',
    save: { kcal: 30, fat: 2, satfat: 6, sodium: 25 },
  },
  {
    id: 'veg-oil', match: /vegetable oil|canola oil|corn oil|shortening|lard/i,
    to: 'extra-virgin olive oil or avocado oil', factor: 0.8, why: 'Better fat profile, and a light hand is plenty.',
    save: { kcal: 24, fat: 2.7, satfat: 0.5, sodium: 0 },
  },
  {
    id: 'coconut-milk', match: /(full[- ]fat )?coconut milk|coconut cream/i,
    to: 'light coconut milk', factor: 1, why: 'Same aroma, about half the fat.',
    save: { kcal: 20, fat: 2.1, satfat: 1.9, sodium: 0 },
  },
  {
    id: 'cheese', match: /(cheddar|mozzarella|monterey jack|colby|gruyere|gruyère|swiss|provolone|pepper jack)( cheese)?/i,
    to: 'sharp reduced-fat $1 (use a little less — sharper flavor goes further)', factor: 0.75, why: 'Sharper cheese means you notice it at 3/4 the amount.',
    save: { kcal: 28, fat: 2.3, satfat: 1.5, sodium: 45 },
  },
  {
    id: 'condensed-soup', match: /(cream of \w+ soup|condensed \w+ soup)/i,
    to: 'blended cauliflower with low-sodium stock', factor: 1, why: 'Kills a big hit of sodium and processed fat.',
    save: { kcal: 8, fat: 0.5, satfat: 0.2, sodium: 120 },
  },
  {
    id: 'sweetened-condensed', match: /sweetened condensed milk/i,
    to: 'date paste thinned with milk', factor: 0.8, why: 'Natural sweetness plus fiber instead of straight sugar.',
    save: { kcal: 40, fat: 1, satfat: 0.7, sodium: 5 },
  },
  {
    id: 'whipped-topping', match: /whipped topping|cool whip|whipped cream/i,
    to: 'Greek yogurt whipped with a little vanilla and maple', factor: 1, why: 'Protein instead of hydrogenated oil.',
    save: { kcal: 20, fat: 2, satfat: 1.8, sodium: 2 },
  },

  // --- Proteins ------------------------------------------------------------
  {
    id: 'ground-beef', match: /ground beef|ground chuck|80\/20|hamburger meat/i,
    to: '93% lean ground beef or ground turkey', factor: 1, why: 'Same volume, roughly half the fat.',
    save: { kcal: 22, fat: 2.5, satfat: 1.1, sodium: 0 },
  },
  {
    id: 'bacon', match: /\bbacon\b/i, exclude: /turkey bacon|canadian bacon/i,
    to: 'center-cut bacon or turkey bacon', factor: 0.6, why: 'Fewer slices, crumbled, still tastes like bacon.',
    save: { kcal: 45, fat: 4.2, satfat: 1.4, sodium: 90 },
  },
  {
    id: 'sausage', match: /(italian |pork |breakfast )?sausage/i, exclude: /chicken sausage|turkey sausage/i,
    to: 'lean chicken or turkey sausage', factor: 1, why: 'Same seasoning, much less fat.',
    save: { kcal: 25, fat: 2.8, satfat: 1.1, sodium: 40 },
  },
  {
    id: 'chicken-skin', match: /(bone[- ]in|skin[- ]on).*(chicken|thigh|breast)|chicken (thigh|breast).*(skin[- ]on)/i,
    to: 'boneless skinless chicken thighs', factor: 1, why: 'Losing the skin drops most of the saturated fat.',
    save: { kcal: 20, fat: 2.2, satfat: 0.7, sodium: 0 },
  },
  {
    id: 'pork-belly', match: /pork belly|pork shoulder|pork butt/i,
    to: 'pork tenderloin', factor: 1, why: 'One of the leanest cuts there is.',
    save: { kcal: 40, fat: 4.5, satfat: 1.6, sodium: 0 },
  },
  {
    id: 'ribeye', match: /ribeye|rib eye|short rib|brisket|new york strip/i,
    to: 'sirloin or flank steak', factor: 1, why: 'Still beefy, noticeably leaner.',
    save: { kcal: 25, fat: 3, satfat: 1.3, sodium: 0 },
  },

  // --- Grains & starches ---------------------------------------------------
  {
    id: 'white-rice', match: /white rice|jasmine rice|basmati rice|long[- ]grain rice|\brice\b/i,
    exclude: /brown rice|wild rice|cauliflower rice|rice vinegar|rice wine|rice paper|rice noodle/i,
    to: 'brown rice, or half rice + half riced cauliflower', factor: 1, why: 'More fiber, slower on your blood sugar.',
    save: { kcal: 2, fat: 0, satfat: 0, sodium: 0 }, fiberAdd: 0.4,
  },
  {
    id: 'pasta', match: /\b(spaghetti|penne|rigatoni|linguine|fettuccine|orzo|macaroni|pasta|noodles)\b/i,
    exclude: /whole[- ]wheat|chickpea|lentil|soba|zucchini|shirataki/i,
    to: 'whole-wheat or chickpea $1', factor: 1, why: 'Three to four times the fiber and real protein.',
    save: { kcal: 0, fat: 0, satfat: 0, sodium: 0 }, fiberAdd: 0.9, proteinAdd: 0.6,
  },
  {
    id: 'ap-flour', match: /all[- ]purpose flour|white flour|\bplain flour\b/i,
    to: 'white whole-wheat flour', factor: 1, why: 'Bakes almost identically, with the bran left in.',
    save: { kcal: 0, fat: 0, satfat: 0, sodium: 0 }, fiberAdd: 1.1,
  },
  {
    id: 'breadcrumbs', match: /(panko|bread ?crumbs)/i, exclude: /whole[- ]wheat/i,
    to: 'whole-wheat panko (or crushed toasted oats)', factor: 1, why: 'Same crunch, more fiber.',
    save: { kcal: 0, fat: 0, satfat: 0, sodium: 15 }, fiberAdd: 0.5,
  },
  {
    id: 'white-bread', match: /white bread|hamburger bun|hot dog bun|sandwich bread|\bbun\b|flour tortilla/i,
    exclude: /whole[- ]wheat|whole[- ]grain|sprouted|corn tortilla/i,
    to: 'whole-grain or sprouted-grain version', factor: 1, why: 'Fiber keeps you full past 3pm.',
    save: { kcal: 10, fat: 0.3, satfat: 0.1, sodium: 30 }, fiberAdd: 1.5,
  },
  {
    id: 'potato', match: /russet potato|white potato|\bpotatoes?\b/i,
    exclude: /sweet potato|baby|yukon|red potato/i,
    to: 'sweet potatoes (or leave the skins on)', factor: 1, why: 'More fiber, vitamin A, and a lower glycemic hit.',
    save: { kcal: 0, fat: 0, satfat: 0, sodium: 0 }, fiberAdd: 0.3,
  },

  // --- Sugar ---------------------------------------------------------------
  {
    id: 'white-sugar', match: /granulated sugar|white sugar|\bsugar\b/i,
    exclude: /coconut sugar|brown sugar|powdered|sugar[- ]free|date sugar|sugar snap/i,
    to: 'maple syrup or honey (use about 2/3)', factor: 0.65, why: 'Sweeter by volume, so less goes in.',
    save: { kcal: 6, fat: 0, satfat: 0, sodium: 0 },
  },
  {
    id: 'brown-sugar', match: /brown sugar|turbinado/i,
    to: 'coconut sugar or date sugar', factor: 0.75, why: 'A gentler glycemic curve, same caramel note.',
    save: { kcal: 4, fat: 0, satfat: 0, sodium: 0 },
  },
  {
    id: 'powdered-sugar', match: /(powdered|confectioners?) sugar/i,
    to: 'a light dusting — cut the amount in half', factor: 0.5, why: 'Purely decorative sugar is the easiest to cut.',
    save: { kcal: 12, fat: 0, satfat: 0, sodium: 0 },
  },
  {
    id: 'syrup-fruit', match: /in heavy syrup|packed in syrup/i,
    to: 'packed in juice or water, no sugar added', factor: 1, why: 'Removes added sugar for free.',
    save: { kcal: 8, fat: 0, satfat: 0, sodium: 0 },
  },
  {
    id: 'soda-juice', match: /\b(soda|cola|fruit juice concentrate)\b/i,
    exclude: /baking soda|club soda|soda water/i,
    to: 'sparkling water with citrus, or unsweetened juice', factor: 1, why: 'Liquid sugar is the easiest calorie to skip.',
    save: { kcal: 8, fat: 0, satfat: 0, sodium: 2 },
  },

  // --- Sodium & sauces -----------------------------------------------------
  {
    id: 'soy-sauce', match: /soy sauce|shoyu/i, exclude: /low[- ]sodium|reduced[- ]sodium|tamari/i,
    to: 'low-sodium tamari or coconut aminos', factor: 0.85, why: 'Roughly 40% less sodium, same savory depth.',
    save: { kcal: 1, fat: 0, satfat: 0, sodium: 230 },
  },
  {
    id: 'broth', match: /(chicken|beef|vegetable) (broth|stock)/i, exclude: /low[- ]sodium|no[- ]salt/i,
    to: 'low-sodium $1 $2', factor: 1, why: 'You control the salt instead of the carton doing it.',
    save: { kcal: 0, fat: 0, satfat: 0, sodium: 35 },
  },
  {
    id: 'canned-beans', match: /canned (black beans|chickpeas|kidney beans|cannellini|pinto beans|white beans)|\b(black beans|chickpeas|garbanzo|kidney beans|cannellini beans|pinto beans)\b/i,
    exclude: /no[- ]salt|low[- ]sodium|dried/i,
    to: 'no-salt-added $1, drained and rinsed well', factor: 1, why: 'Rinsing alone removes up to 40% of the sodium.',
    save: { kcal: 0, fat: 0, satfat: 0, sodium: 90 },
  },
  {
    id: 'salt', match: /^(kosher |sea |table |fine )?salt$/i,
    to: 'salt (cut by a quarter) + a squeeze of lemon or splash of vinegar', factor: 0.75, why: 'Acid makes food read as saltier than it is.',
    save: { kcal: 0, fat: 0, satfat: 0, sodium: 580 },
  },
  {
    id: 'ranch', match: /ranch dressing|caesar dressing|thousand island|blue cheese dressing|creamy dressing/i,
    to: 'Greek yogurt ranch (yogurt, lemon, garlic, dill)', factor: 1, why: 'Most of the fat in a salad comes from the dressing.',
    save: { kcal: 55, fat: 6, satfat: 1, sodium: 60 },
  },
  {
    id: 'bbq-ketchup', match: /barbecue sauce|bbq sauce|ketchup|teriyaki sauce|sweet chili sauce|hoisin/i,
    to: 'no-sugar-added $1 (or thin tomato paste with vinegar and smoked paprika)', factor: 0.85, why: 'These are mostly sugar and salt by weight.',
    save: { kcal: 10, fat: 0, satfat: 0, sodium: 90 },
  },

  // --- Technique-adjacent --------------------------------------------------
  {
    id: 'fried-onion', match: /fried onion|crispy fried|tater tot|frozen fries|onion ring/i,
    to: 'oven-roasted or air-fried version', factor: 1, why: 'Same crunch without the fryer oil.',
    save: { kcal: 30, fat: 3.4, satfat: 0.8, sodium: 40 },
  },
  {
    id: 'puff-pastry', match: /puff pastry|croissant dough|pie crust|biscuit dough/i,
    to: 'phyllo brushed lightly with olive oil', factor: 1, why: 'Shatteringly crisp with a fraction of the butter.',
    save: { kcal: 35, fat: 3.5, satfat: 1.8, sodium: 25 },
  },
];

// Extra vegetables we can suggest bulking a dish out with
const VEG_BOOSTS = [
  'a few big handfuls of baby spinach, stirred in at the end',
  'a diced zucchini added with the onion',
  'a cup of frozen peas, added in the last 3 minutes',
  'sliced mushrooms browned with the aromatics',
  'shredded carrot folded into the sauce',
  'a head of broccoli, cut small and roasted alongside',
  'a can of no-salt-added white beans for fiber and protein',
];

function ruleApplies(rule, ingredient, recipeText, opts = {}) {
  const name = String(ingredient.item || '');
  const notes = String(ingredient.notes || '');
  if (rule.exclude && rule.exclude.test(name)) return false;
  if (!rule.match.test(name)) return false;
  if (rule.context && !rule.context.test(recipeText)) return false;

  if (opts.sweet) {
    // Salt in a cake is a flavour ingredient measured in half-teaspoons, not a
    // sodium problem. Telling someone to cut it and add lemon is bad advice.
    if (rule.id === 'salt' && (opts.sodium || 0) < 600) return false;
    // Butter bound for a frosting or a laminated dough cannot be replaced with
    // applesauce. It just can't.
    if (/butter/i.test(name) && /frosting|buttercream|icing|glaze|topping|for rolling|laminat/i.test(notes)) return false;
    if (/butter/i.test(name) && rule.id === 'butter-bake' && /cold/i.test(notes)) return false;
    // Straight olive oil belongs in a vinaigrette, not in a cinnamon-roll
    // filling. In anything sweet, the baking swap is the only butter swap.
    if (rule.id === 'butter' && /butter/i.test(name)) return false;
  }
  return true;
}

function applyTemplate(tpl, name, match) {
  return tpl.replace(/\$(\d)/g, (_, n) => (match && match[Number(n)] ? match[Number(n)] : '').toLowerCase()).replace(/\s+/g, ' ').trim();
}

/**
 * Produce a healthier variant of a recipe.
 * Returns { recipe, swaps[], notes[], deltas } — recipe is NOT saved.
 */
export function healthify(src, opts = {}) {
  const recipeText = [src.title, src.description, ...(src.steps || [])].join(' ');
  const isSweet = ['dessert'].includes(src.mealType)
    || /cake|cookie|brownie|muffin|pie|pudding|frosting|popsicle|ice cream|pretzel|roll|tart|crisp|bar\b/i.test(src.title || '')
    || (src.tags || []).includes('dessert');
  const ruleOpts = { sweet: isSweet, sodium: src.nutritionPerServing?.sodium || 0 };
  const swaps = [];
  const notes = [];
  const seen = new Set();

  const ingredients = (src.ingredients || []).map((ing) => {
    const copy = { ...ing };
    for (const rule of RULES) {
      if (seen.has(rule.id + '|' + ing.item)) continue;
      if (!ruleApplies(rule, ing, recipeText, ruleOpts)) continue;
      const m = String(ing.item).match(rule.match);
      const newName = applyTemplate(rule.to, ing.item, m);
      const oldQty = Number(ing.quantity) || 0;
      const newQty = rule.factor != null ? cookRound(oldQty * rule.factor) : oldQty;
      swaps.push({
        ruleId: rule.id,
        from: `${ing.quantity ? ing.quantity : ''} ${ing.unit || ''} ${ing.item}`.trim(),
        fromItem: ing.item, fromQty: oldQty, fromUnit: ing.unit,
        to: newName, toQty: newQty, toUnit: ing.unit,
        why: rule.why,
        save: rule.save || {}, fiberAdd: rule.fiberAdd || 0, proteinAdd: rule.proteinAdd || 0,
      });
      copy.item = newName;
      copy.quantity = newQty;
      copy.swapped = true;
      copy.originalItem = ing.item;
      seen.add(rule.id + '|' + ing.item);
      break; // one swap per ingredient
    }
    return copy;
  });

  // --- estimate the nutrition change ---------------------------------------
  const servings = Math.max(1, src.servings || 4);
  let dK = 0, dF = 0, dSat = 0, dNa = 0, dFib = 0, dP = 0;
  for (const s of swaps) {
    const { v, cls } = toBase(s.fromQty || 0, s.fromUnit);
    // The save figures below are written per TABLESPOON of a liquid or
    // spoonable ingredient, per OUNCE of a weighed one, and per item for
    // countables. toBase() hands back teaspoons for volume, so a cup of butter
    // arrives as 48 — scaling on that directly overstated the saving threefold
    // and was producing "1 g of fat" cookies.
    const scale = cls === 'volume' ? v / 3
      : cls === 'weight' ? v
      : Math.max(1, v);
    dK += (s.save.kcal || 0) * scale;
    dF += (s.save.fat || 0) * scale;
    dSat += (s.save.satfat || 0) * scale;
    dNa += (s.save.sodium || 0) * scale;
    dFib += (s.fiberAdd || 0) * scale;
    dP += (s.proteinAdd || 0) * scale;
  }

  const base = src.nutritionPerServing || null;
  let nutrition = null;
  if (base) {
    const per = (x) => x / servings;
    nutrition = {
      calories: Math.max(60, Math.round(base.calories - per(dK))),
      protein: Math.round((base.protein || 0) + per(dP)),
      carbs: Math.round(base.carbs || 0),
      fat: Math.max(1, Math.round((base.fat || 0) - per(dF))),
      fiber: Math.round((base.fiber || 0) + per(dFib)),
      sodium: Math.max(40, Math.round((base.sodium || 0) - per(dNa))),
    };
    // Sanity floors. Ingredient swaps improve a recipe; they don't transform a
    // brownie into a salad, and a remix that claims otherwise isn't credible.
    const kFloor = Math.round(base.calories * 0.6);
    if (nutrition.calories < kFloor) nutrition.calories = kFloor;
    const fFloor = Math.max(1, Math.round((base.fat || 0) * 0.4));
    if (nutrition.fat < fFloor) nutrition.fat = fFloor;
    const naFloor = Math.max(40, Math.round((base.sodium || 0) * 0.5));
    if (nutrition.sodium < naFloor) nutrition.sodium = naFloor;
    // Carbs move too when the sweetener is cut — the old code held them fixed,
    // which made the panel read oddly next to a big calorie drop.
    const sweetCut = swaps.some((x) => /sugar|syrup|sweeten/i.test(x.fromItem));
    if (sweetCut) nutrition.carbs = Math.round((base.carbs || 0) * 0.88);
  }

  // --- technique notes -----------------------------------------------------
  const stepText = (src.steps || []).join(' ').toLowerCase();
  if (/deep[- ]fry|deep fried|fry in .*(oil|inches)|submerge/.test(stepText)) {
    notes.push('Air-fry at 400°F or roast on a rack at 425°F instead of deep-frying — you keep the crust and lose most of the oil.');
  }
  if (/pan[- ]?fry|sear|sauté|saute/.test(stepText)) {
    notes.push('Use a good nonstick or well-seasoned cast iron and a spray of oil rather than a free pour.');
  }
  // Salt advice belongs on dinner, not on a cake with half a teaspoon in it.
  if (!isSweet && (/\bsalt\b/.test(stepText) || (src.nutritionPerServing?.sodium || 0) > 700)) {
    notes.push('Season at the end rather than at every stage — you will use noticeably less salt for the same result.');
  }
  // isSweet already knows what this is; the old ad-hoc regex here missed
  // cinnamon rolls and cheerfully suggested adding frozen peas to them.
  const savory = !isSweet && !['dessert', 'snack'].includes(src.mealType);
  const vegCount = (src.ingredients || []).filter((i) => i.category === 'Produce').length;
  if (savory && vegCount < 3) {
    const pick = VEG_BOOSTS[(src.title || '').length % VEG_BOOSTS.length];
    notes.push('Bulk it out with ' + pick + ' — more volume for the same calories.');
  }
  if (savory && (src.nutritionPerServing?.fiber || 0) < 6) {
    notes.push('Serving this over a whole grain (farro, barley, brown rice) adds several grams of fiber per plate.');
  }
  if (!savory) {
    const baked = /cake|cookie|brownie|muffin|bread|pie|tart|crisp|buckle|roll|bar\b|scone|pretzel/i.test(src.title || '');
    const frozen = /popsicle|pop\b|ice cream|frozen|sorbet|nice cream/i.test(src.title || '')
      || (src.tags || []).includes('frozen');
    if (baked) {
      notes.push('Cut the sugar by a quarter before you change anything else. In most bakes it is the change nobody notices, and it is the one that matters most.');
      notes.push('Swapping a third of the flour for oat flour or white whole-wheat adds fiber and keeps it moist for longer.');
      notes.push('Bake it in a smaller pan or a smaller scoop. Portion size moves the numbers further than any ingredient swap will.');
    } else if (frozen) {
      notes.push('Ripe fruit is the sweetener here — a spotty banana or a genuinely ripe peach means you can drop the honey entirely.');
      notes.push('Blending in Greek yogurt instead of cream adds protein and keeps it from freezing rock hard.');
    } else {
      notes.push('Cut the sweetener by a third and taste before adding more back. Most desserts are built sweeter than they need to be.');
      notes.push('Serving it with fresh fruit on the side stretches the same portion further.');
    }
  }
  if (!swaps.length) {
    notes.unshift('This one is already in good shape — there was nothing obvious to swap out. The notes below are the only gains left.');
  }

  // --- steps get the swapped names substituted in --------------------------
  const steps = (src.steps || []).map((step) => {
    let out = step;
    for (const s of swaps) {
      const re = new RegExp('\\b' + s.fromItem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
      out = out.replace(re, s.to.replace(/\s*\(.*?\)\s*/g, ' ').trim());
    }
    return out;
  });

  const recipe = {
    ...src,
    id: uid('rcp'),
    title: healthyTitle(src.title),
    description: src.description,
    ingredients,
    steps,
    nutritionPerServing: nutrition,
    tags: Array.from(new Set([...(src.tags || []), 'healthy-remix'])),
    healthNotes: src.healthNotes,
    healthyOf: src.id,
    seed: false,
    favorite: false,
    rating: 0,
    frequency: '',
    cookedCount: 0,
    lastCookedAt: '',
    createdAt: nowISO(),
    updatedAt: nowISO(),
    remixMeta: {
      swaps: swaps.map((s) => ({ from: s.fromItem, to: s.to, why: s.why })),
      notes,
      savedPerServing: base ? {
        calories: Math.round(base.calories - (nutrition?.calories || base.calories)),
        fat: Math.round((base.fat || 0) - (nutrition?.fat || 0)),
        sodium: Math.round((base.sodium || 0) - (nutrition?.sodium || 0)),
      } : null,
    },
  };

  return { recipe, swaps, notes, base, nutrition };
}

/** Snap to an amount a measuring spoon can actually hit. */
function cookRound(q) {
  if (!isFinite(q) || q <= 0) return q;
  if (q < 3) return Math.round(q * 8) / 8;      // nearest eighth
  if (q < 10) return Math.round(q * 4) / 4;     // nearest quarter
  return Math.round(q * 2) / 2;
}

function healthyTitle(t) {
  const s = String(t || 'Recipe');
  if (/lighter|healthier|remix|skinny/i.test(s)) return s;
  return s + ' (Healthier Remix)';
}

export function countPossibleSwaps(src) {
  const recipeText = [src.title, src.description, ...(src.steps || [])].join(' ');
  let n = 0;
  for (const ing of src.ingredients || []) {
    for (const rule of RULES) {
      if (ruleApplies(rule, ing, recipeText)) { n++; break; }
    }
  }
  return n;
}
