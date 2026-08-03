export const PRICE_META = {"researched": "2026-08", "stores": ["ShopRite", "Acme"], "region": "Morris County, NJ (North Jersey / NY metro)", "notes": "Everyday (non-promo) shelf prices for ShopRite/Acme-class supermarkets in Morris County NJ, Aug 2026. Originally anchored on Fairfield County CT; both sit in the same high-cost NY-metro band, so the figures carry across within a few percent. Anchored to BLS/FRED Northeast Census Region average price series (ground beef $6.93/lb May-2026; boneless chicken breast $3.92/lb Apr-2026; butter $3.82-4.22/lb; cheddar $5.96/lb; whole milk $4.14/gal; eggs $2.25/doz US avg Apr-2026) plus USDA AMS Northeast retail-ad survey (Jul 2026) for produce, and USDA ERS Food Price Outlook 2026 (all food +3.2%, food-at-home +2.8%, beef/veal +7.5%, eggs -30.4%, fresh vegetables +7.7%, fresh fruit +2.0%). BLS averages blend sale and shelf prices, so shelf prices here run modestly above BLS; a further ~5-8% Fairfield County cost-of-living uplift is applied. Confidence: high = directly anchored to a 2026 BLS/USDA series or observed ShopRite/Acme listing; medium = Northeast supermarket norm interpolated from category data; low = wide brand/size variance or thin public pricing. Beef is the standout inflation story (+70% since 2021, still climbing); eggs have fallen sharply off their 2025 avian-flu peak. Sale/circular prices commonly run 25-40% below these figures."};
export const PRICES = {"banana":{"unitPrice":0.79,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"high"},"apple":{"unitPrice":2.49,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"high"},"granny smith apple":{"unitPrice":2.49,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"honeycrisp apple":{"unitPrice":2.99,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"high"},"orange":{"unitPrice":1.79,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"navel orange":{"unitPrice":1.79,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"clementine":{"unitPrice":6.99,"per":"bag","aisle":"Produce","packSize":"3 lb bag","confidence":"medium"},"grapefruit":{"unitPrice":1.99,"per":"each","aisle":"Produce","packSize":"each","confidence":"medium"},"lemon":{"unitPrice":0.89,"per":"each","aisle":"Produce","packSize":"each","confidence":"high"},"lime":{"unitPrice":0.69,"per":"each","aisle":"Produce","packSize":"each","confidence":"high"},"avocado":{"unitPrice":1.99,"per":"each","aisle":"Produce","packSize":"each (Hass)","confidence":"high"},"strawberries":{"unitPrice":4.29,"per":"package","aisle":"Produce","packSize":"1 lb package","confidence":"high"},"blueberries":{"unitPrice":4.49,"per":"pint","aisle":"Produce","packSize":"1 pint / 11 oz","confidence":"high"},"raspberries":{"unitPrice":4.99,"per":"package","aisle":"Produce","packSize":"6 oz package","confidence":"medium"},"blackberries":{"unitPrice":4.49,"per":"package","aisle":"Produce","packSize":"6 oz package","confidence":"medium"},"grapes":{"unitPrice":3.29,"per":"lb","aisle":"Produce","packSize":"per lb (red seedless)","confidence":"high"},"cherries":{"unitPrice":5.49,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"high"},"watermelon":{"unitPrice":7.99,"per":"each","aisle":"Produce","packSize":"whole seedless","confidence":"medium"},"cantaloupe":{"unitPrice":4.49,"per":"each","aisle":"Produce","packSize":"each","confidence":"medium"},"honeydew":{"unitPrice":5.49,"per":"each","aisle":"Produce","packSize":"each","confidence":"low"},"pineapple":{"unitPrice":4.99,"per":"each","aisle":"Produce","packSize":"whole","confidence":"medium"},"mango":{"unitPrice":1.99,"per":"each","aisle":"Produce","packSize":"each","confidence":"medium"},"peach":{"unitPrice":2.99,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"nectarine":{"unitPrice":2.99,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"low"},"pear":{"unitPrice":2.49,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"plum":{"unitPrice":2.99,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"low"},"kiwi":{"unitPrice":0.79,"per":"each","aisle":"Produce","packSize":"each","confidence":"medium"},"cranberries":{"unitPrice":3.49,"per":"bag","aisle":"Produce","packSize":"12 oz bag","confidence":"low"},"potato":{"unitPrice":1.29,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"high"},"russet potato":{"unitPrice":5.99,"per":"bag","aisle":"Produce","packSize":"5 lb bag","confidence":"high"},"yukon gold potato":{"unitPrice":1.79,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"red potato":{"unitPrice":1.69,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"sweet potato":{"unitPrice":1.79,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"high"},"onion":{"unitPrice":1.49,"per":"lb","aisle":"Produce","packSize":"per lb (yellow)","confidence":"high"},"yellow onion":{"unitPrice":1.49,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"high"},"red onion":{"unitPrice":1.89,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"sweet onion":{"unitPrice":1.79,"per":"lb","aisle":"Produce","packSize":"per lb (Vidalia)","confidence":"medium"},"shallot":{"unitPrice":4.99,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"garlic":{"unitPrice":1.09,"per":"each","aisle":"Produce","packSize":"per head","confidence":"high"},"ginger":{"unitPrice":4.99,"per":"lb","aisle":"Produce","packSize":"per lb (fresh root)","confidence":"medium"},"scallion":{"unitPrice":1.49,"per":"bunch","aisle":"Produce","packSize":"1 bunch (green onions)","confidence":"high"},"leek":{"unitPrice":3.29,"per":"bunch","aisle":"Produce","packSize":"1 bunch","confidence":"medium"},"celery":{"unitPrice":3.29,"per":"each","aisle":"Produce","packSize":"1 stalk/head","confidence":"high"},"carrot":{"unitPrice":2.49,"per":"bag","aisle":"Produce","packSize":"2 lb bag whole","confidence":"high"},"baby carrots":{"unitPrice":1.99,"per":"bag","aisle":"Produce","packSize":"1 lb bag","confidence":"high"},"broccoli":{"unitPrice":2.99,"per":"bunch","aisle":"Produce","packSize":"1 bunch / crown","confidence":"high"},"cauliflower":{"unitPrice":4.49,"per":"each","aisle":"Produce","packSize":"whole head","confidence":"medium"},"cabbage":{"unitPrice":0.99,"per":"lb","aisle":"Produce","packSize":"per lb (green)","confidence":"high"},"napa cabbage":{"unitPrice":1.99,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"low"},"brussels sprouts":{"unitPrice":3.99,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"asparagus":{"unitPrice":4.99,"per":"lb","aisle":"Produce","packSize":"per lb / bunch","confidence":"medium"},"green beans":{"unitPrice":2.99,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"zucchini":{"unitPrice":2.29,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"yellow squash":{"unitPrice":2.29,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"butternut squash":{"unitPrice":1.99,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"acorn squash":{"unitPrice":1.79,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"low"},"spaghetti squash":{"unitPrice":1.79,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"low"},"eggplant":{"unitPrice":2.49,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"bell pepper":{"unitPrice":1.99,"per":"each","aisle":"Produce","packSize":"each (green)","confidence":"high"},"red bell pepper":{"unitPrice":2.79,"per":"each","aisle":"Produce","packSize":"each","confidence":"high"},"poblano pepper":{"unitPrice":3.49,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"low"},"jalapeno":{"unitPrice":3.99,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},"serrano pepper":{"unitPrice":4.29,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"low"},"tomato":{"unitPrice":2.79,"per":"lb","aisle":"Produce","packSize":"per lb (vine)","confidence":"high"},"roma tomato":{"unitPrice":2.29,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"high"},"cherry tomato":{"unitPrice":4.29,"per":"pint","aisle":"Produce","packSize":"1 pint","confidence":"high"},"grape tomato":{"unitPrice":3.99,"per":"pint","aisle":"Produce","packSize":"1 pint","confidence":"medium"},"cucumber":{"unitPrice":1.29,"per":"each","aisle":"Produce","packSize":"each","confidence":"high"},"english cucumber":{"unitPrice":2.49,"per":"each","aisle":"Produce","packSize":"each, wrapped","confidence":"medium"},"romaine lettuce":{"unitPrice":2.99,"per":"each","aisle":"Produce","packSize":"1 head","confidence":"high"},"iceberg lettuce":{"unitPrice":2.79,"per":"each","aisle":"Produce","packSize":"1 head","confidence":"high"},"spinach":{"unitPrice":4.49,"per":"bag","aisle":"Produce","packSize":"10 oz bag/clamshell","confidence":"medium"},"baby spinach":{"unitPrice":4.49,"per":"bag","aisle":"Produce","packSize":"10 oz clamshell","confidence":"medium"},"kale":{"unitPrice":3.29,"per":"bunch","aisle":"Produce","packSize":"1 bunch","confidence":"medium"},"arugula":{"unitPrice":4.49,"per":"package","aisle":"Produce","packSize":"5 oz clamshell","confidence":"medium"},"spring mix":{"unitPrice":4.99,"per":"package","aisle":"Produce","packSize":"5 oz clamshell","confidence":"medium"},"coleslaw mix":{"unitPrice":2.99,"per":"bag","aisle":"Produce","packSize":"14 oz bag","confidence":"low"},"swiss chard":{"unitPrice":3.49,"per":"bunch","aisle":"Produce","packSize":"1 bunch","confidence":"low"},"collard greens":{"unitPrice":2.99,"per":"bunch","aisle":"Produce","packSize":"1 bunch","confidence":"low"},"bok choy":{"unitPrice":2.49,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"low"},"mushroom":{"unitPrice":3.49,"per":"package","aisle":"Produce","packSize":"8 oz white button","confidence":"high"},"cremini mushroom":{"unitPrice":3.99,"per":"package","aisle":"Produce","packSize":"8 oz baby bella","confidence":"medium"},"portobello mushroom":{"unitPrice":4.99,"per":"package","aisle":"Produce","packSize":"6 oz, 2 caps","confidence":"low"},"shiitake mushroom":{"unitPrice":5.99,"per":"package","aisle":"Produce","packSize":"4 oz","confidence":"low"},"corn":{"unitPrice":0.89,"per":"each","aisle":"Produce","packSize":"1 ear sweet corn","confidence":"high"},"radish":{"unitPrice":2.29,"per":"bunch","aisle":"Produce","packSize":"1 bunch","confidence":"low"},"beet":{"unitPrice":3.29,"per":"bunch","aisle":"Produce","packSize":"1 bunch","confidence":"low"},"parsnip":{"unitPrice":2.99,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"low"},"turnip":{"unitPrice":2.29,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"low"},"snow peas":{"unitPrice":4.99,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"low"},"sugar snap peas":{"unitPrice":4.99,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"low"},"cilantro":{"unitPrice":1.29,"per":"bunch","aisle":"Produce","packSize":"1 bunch","confidence":"high"},"parsley":{"unitPrice":1.29,"per":"bunch","aisle":"Produce","packSize":"1 bunch","confidence":"high"},"fresh basil":{"unitPrice":3.49,"per":"package","aisle":"Produce","packSize":"0.75 oz clamshell","confidence":"medium"},"fresh mint":{"unitPrice":3.29,"per":"package","aisle":"Produce","packSize":"0.75 oz clamshell","confidence":"medium"},"fresh rosemary":{"unitPrice":3.29,"per":"package","aisle":"Produce","packSize":"0.75 oz clamshell","confidence":"medium"},"fresh thyme":{"unitPrice":3.29,"per":"package","aisle":"Produce","packSize":"0.75 oz clamshell","confidence":"medium"},"fresh dill":{"unitPrice":3.29,"per":"package","aisle":"Produce","packSize":"0.75 oz clamshell","confidence":"medium"},"fresh sage":{"unitPrice":3.29,"per":"package","aisle":"Produce","packSize":"0.75 oz clamshell","confidence":"low"},"chicken breast":{"unitPrice":4.49,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, boneless skinless","confidence":"high"},"chicken thighs":{"unitPrice":3.29,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, bone-in","confidence":"high"},"boneless skinless chicken thighs":{"unitPrice":4.29,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb","confidence":"high"},"chicken drumsticks":{"unitPrice":2.49,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb","confidence":"medium"},"chicken wings":{"unitPrice":4.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb","confidence":"medium"},"whole chicken":{"unitPrice":2.29,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, whole fryer","confidence":"high"},"ground chicken":{"unitPrice":5.49,"per":"lb","aisle":"Meat & Seafood","packSize":"1 lb package","confidence":"medium"},"rotisserie chicken":{"unitPrice":8.99,"per":"each","aisle":"Meat & Seafood","packSize":"each, hot deli","confidence":"medium"},"chicken tenders":{"unitPrice":5.29,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb","confidence":"medium"},"ground turkey":{"unitPrice":5.49,"per":"lb","aisle":"Meat & Seafood","packSize":"1 lb package, 93/7","confidence":"medium"},"turkey breast":{"unitPrice":6.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb","confidence":"low"},"ground beef":{"unitPrice":6.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, 80/20","confidence":"high"},"lean ground beef":{"unitPrice":8.49,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, 90/10","confidence":"high"},"ground sirloin":{"unitPrice":8.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb","confidence":"medium"},"chuck roast":{"unitPrice":7.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb","confidence":"medium"},"stew beef":{"unitPrice":8.49,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, cubed","confidence":"medium"},"sirloin steak":{"unitPrice":11.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, top sirloin","confidence":"medium"},"ribeye steak":{"unitPrice":17.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb","confidence":"medium"},"strip steak":{"unitPrice":15.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, NY strip","confidence":"medium"},"flank steak":{"unitPrice":13.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb","confidence":"medium"},"skirt steak":{"unitPrice":15.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb","confidence":"low"},"brisket":{"unitPrice":9.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, flat cut","confidence":"low"},"short ribs":{"unitPrice":11.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, bone-in","confidence":"low"},"pork chops":{"unitPrice":4.49,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, bone-in loin","confidence":"high"},"pork tenderloin":{"unitPrice":5.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb","confidence":"medium"},"pork shoulder":{"unitPrice":3.49,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, Boston butt","confidence":"medium"},"pork ribs":{"unitPrice":5.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, baby back","confidence":"low"},"ground pork":{"unitPrice":5.49,"per":"lb","aisle":"Meat & Seafood","packSize":"1 lb package","confidence":"medium"},"bacon":{"unitPrice":7.49,"per":"package","aisle":"Meat & Seafood","packSize":"12 oz package","confidence":"high"},"pancetta":{"unitPrice":5.99,"per":"package","aisle":"Meat & Seafood","packSize":"4 oz diced","confidence":"low"},"prosciutto":{"unitPrice":7.99,"per":"package","aisle":"Meat & Seafood","packSize":"4 oz sliced","confidence":"low"},"italian sausage":{"unitPrice":5.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, sweet or hot links","confidence":"medium"},"breakfast sausage":{"unitPrice":5.99,"per":"package","aisle":"Meat & Seafood","packSize":"12 oz roll/links","confidence":"medium"},"chorizo":{"unitPrice":6.49,"per":"package","aisle":"Meat & Seafood","packSize":"12 oz","confidence":"low"},"kielbasa":{"unitPrice":5.99,"per":"package","aisle":"Meat & Seafood","packSize":"14 oz rope","confidence":"low"},"hot dogs":{"unitPrice":6.49,"per":"package","aisle":"Meat & Seafood","packSize":"1 lb, 8 ct","confidence":"medium"},"ham":{"unitPrice":6.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, deli sliced","confidence":"medium"},"deli turkey":{"unitPrice":10.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, deli sliced","confidence":"medium"},"salami":{"unitPrice":6.49,"per":"package","aisle":"Meat & Seafood","packSize":"8 oz sliced","confidence":"low"},"pepperoni":{"unitPrice":4.99,"per":"package","aisle":"Meat & Seafood","packSize":"6 oz sliced","confidence":"medium"},"lamb chops":{"unitPrice":16.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, loin chops","confidence":"low"},"ground lamb":{"unitPrice":10.99,"per":"lb","aisle":"Meat & Seafood","packSize":"1 lb package","confidence":"low"},"salmon":{"unitPrice":13.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, Atlantic fillet","confidence":"high"},"shrimp":{"unitPrice":11.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, 26/30 raw","confidence":"high"},"cod":{"unitPrice":12.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, fillet","confidence":"medium"},"haddock":{"unitPrice":13.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, fillet","confidence":"medium"},"tilapia":{"unitPrice":8.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, fillet","confidence":"medium"},"flounder":{"unitPrice":12.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, fillet","confidence":"low"},"tuna steak":{"unitPrice":16.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, ahi","confidence":"low"},"scallops":{"unitPrice":24.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, sea scallops","confidence":"low"},"mussels":{"unitPrice":5.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, live","confidence":"low"},"clams":{"unitPrice":7.99,"per":"lb","aisle":"Meat & Seafood","packSize":"per lb, littleneck","confidence":"low"},"crab meat":{"unitPrice":14.99,"per":"package","aisle":"Meat & Seafood","packSize":"8 oz lump, refrigerated","confidence":"low"},"lobster tail":{"unitPrice":12.99,"per":"each","aisle":"Meat & Seafood","packSize":"4-5 oz tail","confidence":"low"},"milk":{"unitPrice":4.69,"per":"gallon","aisle":"Dairy & Eggs","packSize":"1 gallon whole","confidence":"high"},"whole milk":{"unitPrice":4.69,"per":"gallon","aisle":"Dairy & Eggs","packSize":"1 gallon","confidence":"high"},"2% milk":{"unitPrice":4.59,"per":"gallon","aisle":"Dairy & Eggs","packSize":"1 gallon","confidence":"high"},"skim milk":{"unitPrice":4.49,"per":"gallon","aisle":"Dairy & Eggs","packSize":"1 gallon","confidence":"high"},"half and half":{"unitPrice":4.29,"per":"quart","aisle":"Dairy & Eggs","packSize":"1 quart","confidence":"medium"},"heavy cream":{"unitPrice":5.49,"per":"pint","aisle":"Dairy & Eggs","packSize":"1 pint / 16 oz","confidence":"high"},"buttermilk":{"unitPrice":3.99,"per":"quart","aisle":"Dairy & Eggs","packSize":"1 quart","confidence":"medium"},"butter":{"unitPrice":4.99,"per":"lb","aisle":"Dairy & Eggs","packSize":"1 lb, 4 sticks salted","confidence":"high"},"unsalted butter":{"unitPrice":5.29,"per":"lb","aisle":"Dairy & Eggs","packSize":"1 lb, 4 sticks","confidence":"high"},"margarine":{"unitPrice":4.29,"per":"package","aisle":"Dairy & Eggs","packSize":"15 oz tub","confidence":"low"},"egg":{"unitPrice":3.29,"per":"dozen","aisle":"Dairy & Eggs","packSize":"1 dozen large Grade A","confidence":"high"},"large egg":{"unitPrice":3.29,"per":"dozen","aisle":"Dairy & Eggs","packSize":"1 dozen","confidence":"high"},"egg white":{"unitPrice":4.99,"per":"carton","aisle":"Dairy & Eggs","packSize":"16 oz liquid carton","confidence":"low"},"cream cheese":{"unitPrice":3.99,"per":"package","aisle":"Dairy & Eggs","packSize":"8 oz brick","confidence":"high"},"sour cream":{"unitPrice":3.29,"per":"container","aisle":"Dairy & Eggs","packSize":"16 oz tub","confidence":"high"},"greek yogurt":{"unitPrice":6.49,"per":"container","aisle":"Dairy & Eggs","packSize":"32 oz plain tub","confidence":"medium"},"yogurt":{"unitPrice":1.39,"per":"container","aisle":"Dairy & Eggs","packSize":"5.3 oz single cup","confidence":"medium"},"cottage cheese":{"unitPrice":4.49,"per":"container","aisle":"Dairy & Eggs","packSize":"16 oz tub","confidence":"medium"},"cheddar cheese":{"unitPrice":4.29,"per":"package","aisle":"Dairy & Eggs","packSize":"8 oz block","confidence":"high"},"shredded cheese":{"unitPrice":4.29,"per":"bag","aisle":"Dairy & Eggs","packSize":"8 oz bag","confidence":"high"},"mozzarella":{"unitPrice":4.29,"per":"package","aisle":"Dairy & Eggs","packSize":"8 oz shredded/block","confidence":"high"},"fresh mozzarella":{"unitPrice":5.99,"per":"package","aisle":"Dairy & Eggs","packSize":"8 oz ball in water","confidence":"medium"},"parmesan cheese":{"unitPrice":7.49,"per":"package","aisle":"Dairy & Eggs","packSize":"8 oz wedge/grated","confidence":"medium"},"ricotta":{"unitPrice":4.99,"per":"container","aisle":"Dairy & Eggs","packSize":"15 oz tub","confidence":"medium"},"feta":{"unitPrice":4.99,"per":"package","aisle":"Dairy & Eggs","packSize":"6-8 oz crumbled/block","confidence":"medium"},"goat cheese":{"unitPrice":5.49,"per":"package","aisle":"Dairy & Eggs","packSize":"4 oz log","confidence":"medium"},"swiss cheese":{"unitPrice":5.49,"per":"package","aisle":"Dairy & Eggs","packSize":"8 oz sliced","confidence":"medium"},"provolone":{"unitPrice":5.49,"per":"package","aisle":"Dairy & Eggs","packSize":"8 oz sliced","confidence":"low"},"american cheese":{"unitPrice":4.99,"per":"package","aisle":"Dairy & Eggs","packSize":"12 oz singles","confidence":"medium"},"blue cheese":{"unitPrice":5.99,"per":"package","aisle":"Dairy & Eggs","packSize":"5 oz crumbled","confidence":"low"},"whipped cream":{"unitPrice":4.79,"per":"can","aisle":"Dairy & Eggs","packSize":"13 oz aerosol","confidence":"low"},"oat milk":{"unitPrice":4.99,"per":"carton","aisle":"Dairy & Eggs","packSize":"64 oz carton","confidence":"medium"},"almond milk":{"unitPrice":4.29,"per":"carton","aisle":"Dairy & Eggs","packSize":"64 oz carton","confidence":"medium"},"soy milk":{"unitPrice":4.29,"per":"carton","aisle":"Dairy & Eggs","packSize":"64 oz carton","confidence":"low"},"bread":{"unitPrice":3.99,"per":"loaf","aisle":"Bakery","packSize":"20 oz loaf sandwich bread","confidence":"high"},"white bread":{"unitPrice":3.49,"per":"loaf","aisle":"Bakery","packSize":"20 oz loaf","confidence":"high"},"whole wheat bread":{"unitPrice":4.29,"per":"loaf","aisle":"Bakery","packSize":"20 oz loaf","confidence":"high"},"sourdough bread":{"unitPrice":5.49,"per":"loaf","aisle":"Bakery","packSize":"24 oz bakery loaf","confidence":"medium"},"italian bread":{"unitPrice":3.99,"per":"loaf","aisle":"Bakery","packSize":"16 oz bakery loaf","confidence":"medium"},"baguette":{"unitPrice":3.79,"per":"each","aisle":"Bakery","packSize":"each, bakery","confidence":"medium"},"bagel":{"unitPrice":5.29,"per":"package","aisle":"Bakery","packSize":"6 ct package","confidence":"medium"},"english muffin":{"unitPrice":4.29,"per":"package","aisle":"Bakery","packSize":"6 ct package","confidence":"medium"},"hamburger bun":{"unitPrice":3.99,"per":"package","aisle":"Bakery","packSize":"8 ct package","confidence":"medium"},"hot dog bun":{"unitPrice":3.99,"per":"package","aisle":"Bakery","packSize":"8 ct package","confidence":"medium"},"dinner roll":{"unitPrice":4.29,"per":"package","aisle":"Bakery","packSize":"12 ct package","confidence":"low"},"tortilla":{"unitPrice":4.29,"per":"package","aisle":"Bakery","packSize":"10 ct flour, 8 in","confidence":"medium"},"flour tortilla":{"unitPrice":4.29,"per":"package","aisle":"Bakery","packSize":"10 ct, 8 in","confidence":"medium"},"corn tortilla":{"unitPrice":3.49,"per":"package","aisle":"Bakery","packSize":"30 ct, 6 in","confidence":"medium"},"pita bread":{"unitPrice":3.99,"per":"package","aisle":"Bakery","packSize":"6 ct package","confidence":"low"},"naan":{"unitPrice":4.99,"per":"package","aisle":"Bakery","packSize":"4 ct package","confidence":"low"},"croissant":{"unitPrice":5.49,"per":"package","aisle":"Bakery","packSize":"4 ct bakery","confidence":"low"},"pizza dough":{"unitPrice":3.49,"per":"package","aisle":"Bakery","packSize":"16 oz ball, refrigerated","confidence":"medium"},"frozen peas":{"unitPrice":2.49,"per":"bag","aisle":"Frozen","packSize":"12-16 oz bag","confidence":"high"},"frozen corn":{"unitPrice":2.49,"per":"bag","aisle":"Frozen","packSize":"12-16 oz bag","confidence":"high"},"frozen broccoli":{"unitPrice":2.99,"per":"bag","aisle":"Frozen","packSize":"12 oz bag","confidence":"medium"},"frozen spinach":{"unitPrice":2.29,"per":"package","aisle":"Frozen","packSize":"10 oz box chopped","confidence":"medium"},"frozen green beans":{"unitPrice":2.49,"per":"bag","aisle":"Frozen","packSize":"12 oz bag","confidence":"medium"},"frozen mixed vegetables":{"unitPrice":2.79,"per":"bag","aisle":"Frozen","packSize":"16 oz bag","confidence":"medium"},"frozen edamame":{"unitPrice":3.49,"per":"bag","aisle":"Frozen","packSize":"12 oz bag","confidence":"low"},"frozen berries":{"unitPrice":5.49,"per":"bag","aisle":"Frozen","packSize":"12 oz mixed berry bag","confidence":"medium"},"frozen strawberries":{"unitPrice":4.99,"per":"bag","aisle":"Frozen","packSize":"16 oz bag","confidence":"medium"},"frozen blueberries":{"unitPrice":5.99,"per":"bag","aisle":"Frozen","packSize":"16 oz bag","confidence":"medium"},"frozen mango":{"unitPrice":4.99,"per":"bag","aisle":"Frozen","packSize":"16 oz bag","confidence":"low"},"frozen french fries":{"unitPrice":4.49,"per":"bag","aisle":"Frozen","packSize":"26-32 oz bag","confidence":"medium"},"frozen tater tots":{"unitPrice":4.79,"per":"bag","aisle":"Frozen","packSize":"32 oz bag","confidence":"low"},"frozen pizza":{"unitPrice":7.99,"per":"each","aisle":"Frozen","packSize":"each, ~20 oz","confidence":"medium"},"frozen waffles":{"unitPrice":4.29,"per":"box","aisle":"Frozen","packSize":"10 ct box","confidence":"medium"},"frozen shrimp":{"unitPrice":11.99,"per":"bag","aisle":"Frozen","packSize":"1 lb bag, raw 31/40","confidence":"medium"},"frozen fish fillets":{"unitPrice":10.99,"per":"bag","aisle":"Frozen","packSize":"1 lb bag","confidence":"low"},"frozen chicken nuggets":{"unitPrice":9.99,"per":"bag","aisle":"Frozen","packSize":"24-29 oz bag","confidence":"low"},"frozen dumplings":{"unitPrice":7.99,"per":"bag","aisle":"Frozen","packSize":"16-24 oz bag","confidence":"low"},"ice cream":{"unitPrice":6.99,"per":"container","aisle":"Frozen","packSize":"48 oz tub","confidence":"medium"},"puff pastry":{"unitPrice":6.99,"per":"box","aisle":"Frozen","packSize":"17.3 oz, 2 sheets","confidence":"low"},"frozen pie crust":{"unitPrice":4.99,"per":"box","aisle":"Frozen","packSize":"2 ct shells","confidence":"low"},"canned tomatoes":{"unitPrice":2.29,"per":"can","aisle":"Canned & Jarred","packSize":"28 oz can whole peeled","confidence":"high"},"diced tomatoes":{"unitPrice":1.79,"per":"can","aisle":"Canned & Jarred","packSize":"14.5 oz can","confidence":"high"},"crushed tomatoes":{"unitPrice":2.49,"per":"can","aisle":"Canned & Jarred","packSize":"28 oz can","confidence":"high"},"tomato paste":{"unitPrice":1.29,"per":"can","aisle":"Canned & Jarred","packSize":"6 oz can","confidence":"high"},"tomato sauce":{"unitPrice":1.49,"per":"can","aisle":"Canned & Jarred","packSize":"15 oz can","confidence":"high"},"canned beans":{"unitPrice":1.79,"per":"can","aisle":"Canned & Jarred","packSize":"15.5 oz can","confidence":"high"},"black beans":{"unitPrice":1.79,"per":"can","aisle":"Canned & Jarred","packSize":"15.5 oz can","confidence":"high"},"chickpeas":{"unitPrice":1.79,"per":"can","aisle":"Canned & Jarred","packSize":"15.5 oz can","confidence":"high"},"kidney beans":{"unitPrice":1.79,"per":"can","aisle":"Canned & Jarred","packSize":"15.5 oz can","confidence":"high"},"cannellini beans":{"unitPrice":1.99,"per":"can","aisle":"Canned & Jarred","packSize":"15.5 oz can","confidence":"medium"},"pinto beans":{"unitPrice":1.69,"per":"can","aisle":"Canned & Jarred","packSize":"15.5 oz can","confidence":"medium"},"refried beans":{"unitPrice":2.29,"per":"can","aisle":"Canned & Jarred","packSize":"16 oz can","confidence":"low"},"canned corn":{"unitPrice":1.49,"per":"can","aisle":"Canned & Jarred","packSize":"15 oz can","confidence":"high"},"canned green beans":{"unitPrice":1.49,"per":"can","aisle":"Canned & Jarred","packSize":"14.5 oz can","confidence":"medium"},"canned tuna":{"unitPrice":2.29,"per":"can","aisle":"Canned & Jarred","packSize":"5 oz can in water","confidence":"high"},"canned salmon":{"unitPrice":4.99,"per":"can","aisle":"Canned & Jarred","packSize":"6 oz can","confidence":"low"},"sardines":{"unitPrice":3.29,"per":"can","aisle":"Canned & Jarred","packSize":"3.75 oz tin","confidence":"low"},"anchovies":{"unitPrice":3.99,"per":"can","aisle":"Canned & Jarred","packSize":"2 oz tin","confidence":"low"},"chicken broth":{"unitPrice":3.49,"per":"carton","aisle":"Canned & Jarred","packSize":"32 oz carton","confidence":"high"},"beef broth":{"unitPrice":3.49,"per":"carton","aisle":"Canned & Jarred","packSize":"32 oz carton","confidence":"medium"},"vegetable broth":{"unitPrice":3.49,"per":"carton","aisle":"Canned & Jarred","packSize":"32 oz carton","confidence":"medium"},"coconut milk":{"unitPrice":2.99,"per":"can","aisle":"Canned & Jarred","packSize":"13.5 oz can","confidence":"medium"},"canned pumpkin":{"unitPrice":3.29,"per":"can","aisle":"Canned & Jarred","packSize":"15 oz can","confidence":"medium"},"applesauce":{"unitPrice":3.49,"per":"jar","aisle":"Canned & Jarred","packSize":"24 oz jar","confidence":"low"},"olives":{"unitPrice":4.49,"per":"jar","aisle":"Canned & Jarred","packSize":"10 oz jar","confidence":"medium"},"pickles":{"unitPrice":4.49,"per":"jar","aisle":"Canned & Jarred","packSize":"24 oz jar dill spears","confidence":"medium"},"capers":{"unitPrice":3.99,"per":"jar","aisle":"Canned & Jarred","packSize":"3.5 oz jar","confidence":"medium"},"roasted red peppers":{"unitPrice":4.29,"per":"jar","aisle":"Canned & Jarred","packSize":"12 oz jar","confidence":"medium"},"artichoke hearts":{"unitPrice":4.29,"per":"can","aisle":"Canned & Jarred","packSize":"14 oz can","confidence":"medium"},"sun-dried tomatoes":{"unitPrice":5.49,"per":"jar","aisle":"Canned & Jarred","packSize":"8 oz jar in oil","confidence":"low"},"peanut butter":{"unitPrice":4.99,"per":"jar","aisle":"Canned & Jarred","packSize":"16 oz jar","confidence":"high"},"jam":{"unitPrice":4.49,"per":"jar","aisle":"Canned & Jarred","packSize":"12-18 oz jar","confidence":"medium"},"honey":{"unitPrice":8.99,"per":"jar","aisle":"Canned & Jarred","packSize":"12 oz bear/jar","confidence":"medium"},"maple syrup":{"unitPrice":13.99,"per":"bottle","aisle":"Canned & Jarred","packSize":"12 oz pure","confidence":"medium"},"pasta sauce":{"unitPrice":3.99,"per":"jar","aisle":"Canned & Jarred","packSize":"24 oz jar marinara","confidence":"high"},"salsa":{"unitPrice":4.29,"per":"jar","aisle":"Canned & Jarred","packSize":"16 oz jar","confidence":"medium"},"pasta":{"unitPrice":2.29,"per":"box","aisle":"Dry Goods & Pasta","packSize":"1 lb box","confidence":"high"},"spaghetti":{"unitPrice":2.29,"per":"box","aisle":"Dry Goods & Pasta","packSize":"1 lb box","confidence":"high"},"penne":{"unitPrice":2.29,"per":"box","aisle":"Dry Goods & Pasta","packSize":"1 lb box","confidence":"high"},"rigatoni":{"unitPrice":2.29,"per":"box","aisle":"Dry Goods & Pasta","packSize":"1 lb box","confidence":"medium"},"macaroni":{"unitPrice":2.19,"per":"box","aisle":"Dry Goods & Pasta","packSize":"1 lb box elbows","confidence":"high"},"lasagna noodles":{"unitPrice":3.29,"per":"box","aisle":"Dry Goods & Pasta","packSize":"1 lb box","confidence":"medium"},"egg noodles":{"unitPrice":3.29,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"12 oz bag","confidence":"medium"},"orzo":{"unitPrice":2.99,"per":"box","aisle":"Dry Goods & Pasta","packSize":"1 lb box","confidence":"medium"},"couscous":{"unitPrice":3.49,"per":"box","aisle":"Dry Goods & Pasta","packSize":"10 oz box","confidence":"low"},"rice noodles":{"unitPrice":3.79,"per":"package","aisle":"Dry Goods & Pasta","packSize":"14 oz package","confidence":"low"},"ramen":{"unitPrice":0.89,"per":"package","aisle":"Dry Goods & Pasta","packSize":"3 oz single pack","confidence":"medium"},"rice":{"unitPrice":4.49,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"2 lb bag long grain white","confidence":"high"},"white rice":{"unitPrice":4.49,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"2 lb bag","confidence":"high"},"brown rice":{"unitPrice":4.99,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"2 lb bag","confidence":"medium"},"jasmine rice":{"unitPrice":6.99,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"2 lb bag","confidence":"medium"},"basmati rice":{"unitPrice":7.49,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"2 lb bag","confidence":"medium"},"arborio rice":{"unitPrice":5.99,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"16 oz bag","confidence":"low"},"quinoa":{"unitPrice":6.99,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"16 oz bag","confidence":"medium"},"farro":{"unitPrice":5.49,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"16 oz bag","confidence":"low"},"barley":{"unitPrice":3.49,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"16 oz bag pearled","confidence":"low"},"lentils":{"unitPrice":2.99,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"16 oz bag dried","confidence":"medium"},"dried beans":{"unitPrice":2.49,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"16 oz bag","confidence":"medium"},"split peas":{"unitPrice":2.49,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"16 oz bag","confidence":"low"},"oats":{"unitPrice":5.49,"per":"canister","aisle":"Dry Goods & Pasta","packSize":"42 oz old-fashioned","confidence":"high"},"steel cut oats":{"unitPrice":6.49,"per":"canister","aisle":"Dry Goods & Pasta","packSize":"30 oz canister","confidence":"medium"},"cereal":{"unitPrice":5.49,"per":"box","aisle":"Dry Goods & Pasta","packSize":"12-18 oz box","confidence":"high"},"granola":{"unitPrice":6.49,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"12 oz bag","confidence":"medium"},"breadcrumbs":{"unitPrice":3.29,"per":"canister","aisle":"Dry Goods & Pasta","packSize":"15 oz canister","confidence":"medium"},"panko":{"unitPrice":3.99,"per":"box","aisle":"Dry Goods & Pasta","packSize":"8 oz box","confidence":"medium"},"cornmeal":{"unitPrice":3.79,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"24 oz bag","confidence":"low"},"tortilla chips":{"unitPrice":4.99,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"11-13 oz bag","confidence":"medium"},"potato chips":{"unitPrice":4.99,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"8 oz bag","confidence":"medium"},"crackers":{"unitPrice":4.79,"per":"box","aisle":"Dry Goods & Pasta","packSize":"13.7 oz box","confidence":"medium"},"pretzels":{"unitPrice":3.99,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"16 oz bag","confidence":"low"},"popcorn":{"unitPrice":4.99,"per":"box","aisle":"Dry Goods & Pasta","packSize":"6 ct microwave box","confidence":"low"},"almonds":{"unitPrice":9.49,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"16 oz bag raw","confidence":"medium"},"walnuts":{"unitPrice":9.99,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"16 oz bag halves","confidence":"medium"},"pecans":{"unitPrice":11.99,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"16 oz bag","confidence":"low"},"cashews":{"unitPrice":10.49,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"16 oz bag","confidence":"medium"},"peanuts":{"unitPrice":4.99,"per":"jar","aisle":"Dry Goods & Pasta","packSize":"16 oz jar roasted","confidence":"medium"},"pistachios":{"unitPrice":10.99,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"16 oz bag","confidence":"low"},"pine nuts":{"unitPrice":13.99,"per":"package","aisle":"Dry Goods & Pasta","packSize":"4 oz package","confidence":"low"},"sunflower seeds":{"unitPrice":3.99,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"8 oz bag","confidence":"low"},"sesame seeds":{"unitPrice":4.49,"per":"jar","aisle":"Dry Goods & Pasta","packSize":"3.5 oz jar","confidence":"low"},"chia seeds":{"unitPrice":6.99,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"12 oz bag","confidence":"low"},"flaxseed":{"unitPrice":5.49,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"16 oz ground","confidence":"low"},"raisins":{"unitPrice":4.49,"per":"canister","aisle":"Dry Goods & Pasta","packSize":"20 oz canister","confidence":"medium"},"dried cranberries":{"unitPrice":4.29,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"12 oz bag","confidence":"medium"},"dates":{"unitPrice":7.49,"per":"package","aisle":"Dry Goods & Pasta","packSize":"16 oz pitted Medjool","confidence":"low"},"salt":{"unitPrice":1.59,"per":"canister","aisle":"Spices & Baking","packSize":"26 oz iodized","confidence":"high"},"kosher salt":{"unitPrice":4.49,"per":"box","aisle":"Spices & Baking","packSize":"3 lb box","confidence":"medium"},"sea salt":{"unitPrice":4.99,"per":"canister","aisle":"Spices & Baking","packSize":"17.6 oz","confidence":"low"},"black pepper":{"unitPrice":5.99,"per":"jar","aisle":"Spices & Baking","packSize":"4 oz ground","confidence":"high"},"garlic powder":{"unitPrice":4.29,"per":"jar","aisle":"Spices & Baking","packSize":"3 oz jar","confidence":"medium"},"onion powder":{"unitPrice":4.29,"per":"jar","aisle":"Spices & Baking","packSize":"2.6 oz jar","confidence":"medium"},"paprika":{"unitPrice":4.49,"per":"jar","aisle":"Spices & Baking","packSize":"2.1 oz jar","confidence":"medium"},"smoked paprika":{"unitPrice":5.29,"per":"jar","aisle":"Spices & Baking","packSize":"1.9 oz jar","confidence":"medium"},"cumin":{"unitPrice":4.49,"per":"jar","aisle":"Spices & Baking","packSize":"1.5 oz ground","confidence":"medium"},"chili powder":{"unitPrice":4.29,"per":"jar","aisle":"Spices & Baking","packSize":"2.5 oz jar","confidence":"medium"},"cayenne pepper":{"unitPrice":4.29,"per":"jar","aisle":"Spices & Baking","packSize":"1.75 oz jar","confidence":"medium"},"red pepper flakes":{"unitPrice":4.29,"per":"jar","aisle":"Spices & Baking","packSize":"1.5 oz jar","confidence":"medium"},"dried oregano":{"unitPrice":3.99,"per":"jar","aisle":"Spices & Baking","packSize":"0.75 oz jar","confidence":"medium"},"dried basil":{"unitPrice":3.99,"per":"jar","aisle":"Spices & Baking","packSize":"0.62 oz jar","confidence":"medium"},"dried thyme":{"unitPrice":4.49,"per":"jar","aisle":"Spices & Baking","packSize":"0.75 oz jar","confidence":"medium"},"dried rosemary":{"unitPrice":4.49,"per":"jar","aisle":"Spices & Baking","packSize":"0.75 oz jar","confidence":"medium"},"dried sage":{"unitPrice":4.29,"per":"jar","aisle":"Spices & Baking","packSize":"0.5 oz jar","confidence":"low"},"bay leaves":{"unitPrice":4.29,"per":"jar","aisle":"Spices & Baking","packSize":"0.12 oz jar","confidence":"medium"},"cinnamon":{"unitPrice":4.79,"per":"jar","aisle":"Spices & Baking","packSize":"2.37 oz ground","confidence":"high"},"nutmeg":{"unitPrice":6.49,"per":"jar","aisle":"Spices & Baking","packSize":"1.1 oz ground","confidence":"medium"},"ground ginger":{"unitPrice":4.79,"per":"jar","aisle":"Spices & Baking","packSize":"1.5 oz jar","confidence":"medium"},"turmeric":{"unitPrice":4.79,"per":"jar","aisle":"Spices & Baking","packSize":"1.6 oz ground","confidence":"medium"},"curry powder":{"unitPrice":4.99,"per":"jar","aisle":"Spices & Baking","packSize":"1.75 oz jar","confidence":"medium"},"coriander":{"unitPrice":4.49,"per":"jar","aisle":"Spices & Baking","packSize":"1.25 oz ground","confidence":"low"},"cardamom":{"unitPrice":9.99,"per":"jar","aisle":"Spices & Baking","packSize":"1.75 oz ground","confidence":"low"},"cloves":{"unitPrice":5.99,"per":"jar","aisle":"Spices & Baking","packSize":"0.9 oz ground","confidence":"low"},"allspice":{"unitPrice":5.29,"per":"jar","aisle":"Spices & Baking","packSize":"0.9 oz ground","confidence":"low"},"italian seasoning":{"unitPrice":4.29,"per":"jar","aisle":"Spices & Baking","packSize":"0.75 oz jar","confidence":"medium"},"taco seasoning":{"unitPrice":1.69,"per":"package","aisle":"Spices & Baking","packSize":"1 oz packet","confidence":"medium"},"everything bagel seasoning":{"unitPrice":4.49,"per":"jar","aisle":"Spices & Baking","packSize":"2.3 oz jar","confidence":"low"},"chinese five spice":{"unitPrice":5.49,"per":"jar","aisle":"Spices & Baking","packSize":"1.75 oz jar","confidence":"low"},"vanilla extract":{"unitPrice":13.99,"per":"bottle","aisle":"Spices & Baking","packSize":"2 oz pure","confidence":"medium"},"almond extract":{"unitPrice":5.99,"per":"bottle","aisle":"Spices & Baking","packSize":"1 oz bottle","confidence":"low"},"baking soda":{"unitPrice":1.59,"per":"box","aisle":"Spices & Baking","packSize":"16 oz box","confidence":"high"},"baking powder":{"unitPrice":3.29,"per":"canister","aisle":"Spices & Baking","packSize":"8.1 oz canister","confidence":"medium"},"yeast":{"unitPrice":3.49,"per":"package","aisle":"Spices & Baking","packSize":"3 ct 1/4 oz packets","confidence":"medium"},"flour":{"unitPrice":4.49,"per":"bag","aisle":"Spices & Baking","packSize":"5 lb all-purpose","confidence":"high"},"bread flour":{"unitPrice":5.49,"per":"bag","aisle":"Spices & Baking","packSize":"5 lb bag","confidence":"medium"},"whole wheat flour":{"unitPrice":4.99,"per":"bag","aisle":"Spices & Baking","packSize":"5 lb bag","confidence":"medium"},"almond flour":{"unitPrice":12.99,"per":"bag","aisle":"Spices & Baking","packSize":"16 oz bag","confidence":"low"},"sugar":{"unitPrice":4.49,"per":"bag","aisle":"Spices & Baking","packSize":"4 lb granulated","confidence":"high"},"brown sugar":{"unitPrice":3.29,"per":"bag","aisle":"Spices & Baking","packSize":"2 lb bag","confidence":"high"},"powdered sugar":{"unitPrice":3.29,"per":"bag","aisle":"Spices & Baking","packSize":"2 lb confectioners","confidence":"medium"},"cornstarch":{"unitPrice":2.79,"per":"box","aisle":"Spices & Baking","packSize":"16 oz box","confidence":"medium"},"cocoa powder":{"unitPrice":5.99,"per":"canister","aisle":"Spices & Baking","packSize":"8 oz unsweetened","confidence":"medium"},"chocolate chips":{"unitPrice":4.79,"per":"bag","aisle":"Spices & Baking","packSize":"12 oz semisweet","confidence":"high"},"baking chocolate":{"unitPrice":5.49,"per":"box","aisle":"Spices & Baking","packSize":"4 oz unsweetened bar","confidence":"low"},"molasses":{"unitPrice":5.29,"per":"bottle","aisle":"Spices & Baking","packSize":"12 oz bottle","confidence":"low"},"corn syrup":{"unitPrice":4.49,"per":"bottle","aisle":"Spices & Baking","packSize":"16 oz bottle","confidence":"low"},"sweetened condensed milk":{"unitPrice":3.49,"per":"can","aisle":"Spices & Baking","packSize":"14 oz can","confidence":"medium"},"evaporated milk":{"unitPrice":2.49,"per":"can","aisle":"Spices & Baking","packSize":"12 oz can","confidence":"medium"},"shredded coconut":{"unitPrice":3.99,"per":"bag","aisle":"Spices & Baking","packSize":"14 oz sweetened","confidence":"low"},"marshmallow":{"unitPrice":3.29,"per":"bag","aisle":"Spices & Baking","packSize":"16 oz bag","confidence":"low"},"olive oil":{"unitPrice":13.99,"per":"bottle","aisle":"Condiments & Sauces","packSize":"17 oz / 500 ml extra virgin","confidence":"medium"},"extra virgin olive oil":{"unitPrice":13.99,"per":"bottle","aisle":"Condiments & Sauces","packSize":"17 oz / 500 ml","confidence":"medium"},"vegetable oil":{"unitPrice":5.99,"per":"bottle","aisle":"Condiments & Sauces","packSize":"48 oz bottle","confidence":"high"},"canola oil":{"unitPrice":5.99,"per":"bottle","aisle":"Condiments & Sauces","packSize":"48 oz bottle","confidence":"high"},"avocado oil":{"unitPrice":12.99,"per":"bottle","aisle":"Condiments & Sauces","packSize":"16.9 oz bottle","confidence":"low"},"coconut oil":{"unitPrice":8.99,"per":"jar","aisle":"Condiments & Sauces","packSize":"14 oz jar","confidence":"low"},"sesame oil":{"unitPrice":5.99,"per":"bottle","aisle":"Condiments & Sauces","packSize":"5 oz toasted","confidence":"medium"},"cooking spray":{"unitPrice":4.99,"per":"can","aisle":"Condiments & Sauces","packSize":"6 oz aerosol","confidence":"medium"},"vinegar":{"unitPrice":2.99,"per":"bottle","aisle":"Condiments & Sauces","packSize":"32 oz white distilled","confidence":"high"},"apple cider vinegar":{"unitPrice":3.99,"per":"bottle","aisle":"Condiments & Sauces","packSize":"16 oz bottle","confidence":"medium"},"balsamic vinegar":{"unitPrice":5.99,"per":"bottle","aisle":"Condiments & Sauces","packSize":"16.9 oz bottle","confidence":"medium"},"red wine vinegar":{"unitPrice":3.99,"per":"bottle","aisle":"Condiments & Sauces","packSize":"16 oz bottle","confidence":"medium"},"rice vinegar":{"unitPrice":3.49,"per":"bottle","aisle":"Condiments & Sauces","packSize":"12 oz bottle","confidence":"medium"},"ketchup":{"unitPrice":4.49,"per":"bottle","aisle":"Condiments & Sauces","packSize":"20 oz bottle","confidence":"high"},"mustard":{"unitPrice":2.99,"per":"bottle","aisle":"Condiments & Sauces","packSize":"14 oz yellow","confidence":"high"},"dijon mustard":{"unitPrice":4.29,"per":"jar","aisle":"Condiments & Sauces","packSize":"12 oz jar","confidence":"medium"},"mayonnaise":{"unitPrice":6.99,"per":"jar","aisle":"Condiments & Sauces","packSize":"30 oz jar","confidence":"high"},"ranch dressing":{"unitPrice":4.79,"per":"bottle","aisle":"Condiments & Sauces","packSize":"16 oz bottle","confidence":"medium"},"italian dressing":{"unitPrice":3.99,"per":"bottle","aisle":"Condiments & Sauces","packSize":"16 oz bottle","confidence":"medium"},"caesar dressing":{"unitPrice":4.79,"per":"bottle","aisle":"Condiments & Sauces","packSize":"16 oz bottle","confidence":"medium"},"bbq sauce":{"unitPrice":3.99,"per":"bottle","aisle":"Condiments & Sauces","packSize":"18 oz bottle","confidence":"medium"},"hot sauce":{"unitPrice":3.79,"per":"bottle","aisle":"Condiments & Sauces","packSize":"5 oz bottle","confidence":"medium"},"sriracha":{"unitPrice":5.49,"per":"bottle","aisle":"Condiments & Sauces","packSize":"17 oz bottle","confidence":"medium"},"soy sauce":{"unitPrice":4.29,"per":"bottle","aisle":"Condiments & Sauces","packSize":"15 oz bottle","confidence":"high"},"tamari":{"unitPrice":5.49,"per":"bottle","aisle":"Condiments & Sauces","packSize":"10 oz bottle","confidence":"low"},"teriyaki sauce":{"unitPrice":4.29,"per":"bottle","aisle":"Condiments & Sauces","packSize":"10 oz bottle","confidence":"low"},"fish sauce":{"unitPrice":4.99,"per":"bottle","aisle":"Condiments & Sauces","packSize":"8.5 oz bottle","confidence":"low"},"oyster sauce":{"unitPrice":4.49,"per":"bottle","aisle":"Condiments & Sauces","packSize":"9 oz bottle","confidence":"low"},"hoisin sauce":{"unitPrice":4.49,"per":"bottle","aisle":"Condiments & Sauces","packSize":"8.5 oz bottle","confidence":"low"},"worcestershire sauce":{"unitPrice":4.49,"per":"bottle","aisle":"Condiments & Sauces","packSize":"10 oz bottle","confidence":"medium"},"tahini":{"unitPrice":7.99,"per":"jar","aisle":"Condiments & Sauces","packSize":"16 oz jar","confidence":"low"},"pesto":{"unitPrice":5.99,"per":"jar","aisle":"Condiments & Sauces","packSize":"6.7 oz jar","confidence":"medium"},"hummus":{"unitPrice":4.99,"per":"container","aisle":"Condiments & Sauces","packSize":"10 oz tub","confidence":"medium"},"guacamole":{"unitPrice":5.49,"per":"container","aisle":"Condiments & Sauces","packSize":"10 oz tub","confidence":"low"},"horseradish":{"unitPrice":3.49,"per":"jar","aisle":"Condiments & Sauces","packSize":"6 oz jar prepared","confidence":"low"},"relish":{"unitPrice":3.29,"per":"jar","aisle":"Condiments & Sauces","packSize":"10 oz jar","confidence":"low"},"cocktail sauce":{"unitPrice":3.99,"per":"jar","aisle":"Condiments & Sauces","packSize":"12 oz jar","confidence":"low"},"coffee":{"unitPrice":13.99,"per":"bag","aisle":"Beverages","packSize":"12 oz ground","confidence":"high"},"ground coffee":{"unitPrice":13.99,"per":"bag","aisle":"Beverages","packSize":"12 oz bag","confidence":"high"},"coffee beans":{"unitPrice":14.99,"per":"bag","aisle":"Beverages","packSize":"12 oz whole bean","confidence":"medium"},"instant coffee":{"unitPrice":9.49,"per":"jar","aisle":"Beverages","packSize":"8 oz jar","confidence":"low"},"k-cups":{"unitPrice":15.99,"per":"box","aisle":"Beverages","packSize":"24 ct box","confidence":"medium"},"tea":{"unitPrice":4.99,"per":"box","aisle":"Beverages","packSize":"20 ct black tea bags","confidence":"medium"},"green tea":{"unitPrice":5.49,"per":"box","aisle":"Beverages","packSize":"20 ct bags","confidence":"medium"},"herbal tea":{"unitPrice":5.49,"per":"box","aisle":"Beverages","packSize":"20 ct bags","confidence":"low"},"orange juice":{"unitPrice":5.99,"per":"carton","aisle":"Beverages","packSize":"52 oz carton, not from concentrate","confidence":"high"},"apple juice":{"unitPrice":4.49,"per":"bottle","aisle":"Beverages","packSize":"64 oz bottle","confidence":"medium"},"cranberry juice":{"unitPrice":5.29,"per":"bottle","aisle":"Beverages","packSize":"64 oz bottle","confidence":"medium"},"lemonade":{"unitPrice":3.99,"per":"carton","aisle":"Beverages","packSize":"59 oz carton","confidence":"low"},"soda":{"unitPrice":9.49,"per":"package","aisle":"Beverages","packSize":"12 pk 12 oz cans","confidence":"medium"},"seltzer":{"unitPrice":6.49,"per":"package","aisle":"Beverages","packSize":"12 pk 12 oz cans","confidence":"medium"},"sparkling water":{"unitPrice":6.49,"per":"package","aisle":"Beverages","packSize":"12 pk 12 oz cans","confidence":"medium"},"bottled water":{"unitPrice":5.99,"per":"package","aisle":"Beverages","packSize":"24 pk 16.9 oz","confidence":"medium"},"coconut water":{"unitPrice":4.49,"per":"carton","aisle":"Beverages","packSize":"33.8 oz carton","confidence":"low"},"kombucha":{"unitPrice":4.49,"per":"bottle","aisle":"Beverages","packSize":"16 oz bottle","confidence":"low"},"sports drink":{"unitPrice":8.49,"per":"package","aisle":"Beverages","packSize":"8 pk 20 oz","confidence":"low"},"red wine":{"unitPrice":14.99,"per":"bottle","aisle":"Beverages","packSize":"750 ml (CT liquor/wine dept)","confidence":"low"},"white wine":{"unitPrice":14.99,"per":"bottle","aisle":"Beverages","packSize":"750 ml (CT liquor/wine dept)","confidence":"low"},"cooking wine":{"unitPrice":4.49,"per":"bottle","aisle":"Beverages","packSize":"12.7 oz bottle","confidence":"low"},"beer":{"unitPrice":12.99,"per":"package","aisle":"Beverages","packSize":"6 pk 12 oz bottles","confidence":"low"}};

// Items the main survey missed that our recipes actually call for.
// Same 2026 Fairfield County ShopRite/Acme basis.
export const PRICE_SUPPLEMENT = {
  "sweet potato": {"unitPrice":1.79,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},
  "yukon gold potato": {"unitPrice":1.99,"per":"lb","aisle":"Produce","packSize":"per lb","confidence":"medium"},
  "baby potato": {"unitPrice":3.99,"per":"bag","aisle":"Produce","packSize":"1.5 lb bag","confidence":"medium"},
  "cherry tomato": {"unitPrice":4.29,"per":"pint","aisle":"Produce","packSize":"1 pint","confidence":"medium"},
  "grape tomato": {"unitPrice":4.29,"per":"pint","aisle":"Produce","packSize":"1 pint","confidence":"medium"},
  "broccolini": {"unitPrice":3.99,"per":"bunch","aisle":"Produce","packSize":"1 bunch","confidence":"low"},
  "chive": {"unitPrice":2.99,"per":"package","aisle":"Produce","packSize":"0.75 oz clamshell","confidence":"low"},
  "garam masala": {"unitPrice":5.49,"per":"jar","aisle":"Spices & Baking","packSize":"1.9 oz jar","confidence":"medium"},
  "italian herb blend": {"unitPrice":3.99,"per":"jar","aisle":"Spices & Baking","packSize":"0.75 oz jar","confidence":"medium"},
  "italian seasoning": {"unitPrice":3.99,"per":"jar","aisle":"Spices & Baking","packSize":"0.75 oz jar","confidence":"medium"},
  "harissa paste": {"unitPrice":6.49,"per":"jar","aisle":"Condiments & Sauces","packSize":"6 oz jar","confidence":"low"},
  "marinara sauce": {"unitPrice":4.29,"per":"jar","aisle":"Canned & Jarred","packSize":"24 oz jar","confidence":"high"},
  "pasta sauce": {"unitPrice":4.29,"per":"jar","aisle":"Canned & Jarred","packSize":"24 oz jar","confidence":"high"},
  "chipotle in adobo": {"unitPrice":2.49,"per":"can","aisle":"Canned & Jarred","packSize":"7 oz can","confidence":"medium"},
  "enchilada sauce": {"unitPrice":3.29,"per":"can","aisle":"Canned & Jarred","packSize":"10 oz can","confidence":"medium"},
  "kimchi": {"unitPrice":7.99,"per":"jar","aisle":"Produce","packSize":"16 oz jar","confidence":"low"},
  "red curry paste": {"unitPrice":4.79,"per":"jar","aisle":"Condiments & Sauces","packSize":"4 oz jar","confidence":"medium"},
  "green curry paste": {"unitPrice":4.79,"per":"jar","aisle":"Condiments & Sauces","packSize":"4 oz jar","confidence":"medium"},
  "tofu": {"unitPrice":3.29,"per":"package","aisle":"Produce","packSize":"14 oz block","confidence":"high"},
  "extra-firm tofu": {"unitPrice":3.29,"per":"package","aisle":"Produce","packSize":"14 oz block","confidence":"high"},
  "tempeh": {"unitPrice":4.29,"per":"package","aisle":"Produce","packSize":"8 oz","confidence":"medium"},
  "soba noodle": {"unitPrice":4.99,"per":"package","aisle":"Dry Goods & Pasta","packSize":"9.5 oz","confidence":"low"},
  "miso paste": {"unitPrice":6.49,"per":"tub","aisle":"Condiments & Sauces","packSize":"14 oz tub","confidence":"medium"},
  "mirin": {"unitPrice":4.99,"per":"bottle","aisle":"Condiments & Sauces","packSize":"10 oz bottle","confidence":"low"},
  "gochujang": {"unitPrice":6.99,"per":"tub","aisle":"Condiments & Sauces","packSize":"17.6 oz tub","confidence":"medium"},
  "parmesan rind": {"unitPrice":3.49,"per":"each","aisle":"Dairy & Eggs","packSize":"rind piece","confidence":"low"},
  "dark chocolate chunk": {"unitPrice":4.99,"per":"bag","aisle":"Spices & Baking","packSize":"10 oz bag","confidence":"medium"},
  "chickpea flour": {"unitPrice":5.49,"per":"bag","aisle":"Dry Goods & Pasta","packSize":"16 oz bag","confidence":"low"},
  "pomegranate molasses": {"unitPrice":7.49,"per":"bottle","aisle":"Condiments & Sauces","packSize":"10 oz bottle","confidence":"low"},
  "sumac": {"unitPrice":5.99,"per":"jar","aisle":"Spices & Baking","packSize":"2 oz jar","confidence":"low"},
  "zaatar": {"unitPrice":6.49,"per":"jar","aisle":"Spices & Baking","packSize":"2 oz jar","confidence":"low"},
  "labneh": {"unitPrice":5.99,"per":"tub","aisle":"Dairy & Eggs","packSize":"16 oz tub","confidence":"low"},
};
Object.assign(PRICES, PRICE_SUPPLEMENT);

// Second round of recipes brought new ingredients with them.
export const PRICE_SUPPLEMENT_2 = {
 "lemongrass": {
  "unitPrice": 3.49,
  "per": "each",
  "aisle": "Produce",
  "packSize": "1 stalk",
  "confidence": "low"
 },
 "thai chile": {
  "unitPrice": 2.99,
  "per": "package",
  "aisle": "Produce",
  "packSize": "2 oz",
  "confidence": "low"
 },
 "serrano chile": {
  "unitPrice": 0.39,
  "per": "each",
  "aisle": "Produce",
  "packSize": "each",
  "confidence": "medium"
 },
 "scotch bonnet pepper": {
  "unitPrice": 0.59,
  "per": "each",
  "aisle": "Produce",
  "packSize": "each",
  "confidence": "low"
 },
 "chili crisp": {
  "unitPrice": 7.99,
  "per": "jar",
  "aisle": "Condiments & Sauces",
  "packSize": "6 oz jar",
  "confidence": "medium"
 },
 "za'atar": {
  "unitPrice": 5.99,
  "per": "jar",
  "aisle": "Spices & Baking",
  "packSize": "2 oz jar",
  "confidence": "low"
 },
 "za'atar seasoning": {
  "unitPrice": 5.99,
  "per": "jar",
  "aisle": "Spices & Baking",
  "packSize": "2 oz jar",
  "confidence": "low"
 },
 "herbes de provence": {
  "unitPrice": 4.49,
  "per": "jar",
  "aisle": "Spices & Baking",
  "packSize": "0.7 oz jar",
  "confidence": "low"
 },
 "sichuan peppercorn": {
  "unitPrice": 6.49,
  "per": "jar",
  "aisle": "Spices & Baking",
  "packSize": "1.5 oz jar",
  "confidence": "low"
 },
 "shaoxing wine": {
  "unitPrice": 4.99,
  "per": "bottle",
  "aisle": "Condiments & Sauces",
  "packSize": "12 oz bottle",
  "confidence": "low"
 },
 "dry sherry": {
  "unitPrice": 8.99,
  "per": "bottle",
  "aisle": "Beverages",
  "packSize": "750 ml",
  "confidence": "low"
 },
 "fennel bulb": {
  "unitPrice": 2.99,
  "per": "each",
  "aisle": "Produce",
  "packSize": "each",
  "confidence": "medium"
 },
 "fennel": {
  "unitPrice": 2.99,
  "per": "each",
  "aisle": "Produce",
  "packSize": "each",
  "confidence": "medium"
 },
 "delicata squash": {
  "unitPrice": 2.49,
  "per": "each",
  "aisle": "Produce",
  "packSize": "each",
  "confidence": "medium"
 },
 "butternut squash": {
  "unitPrice": 3.99,
  "per": "each",
  "aisle": "Produce",
  "packSize": "2 lb",
  "confidence": "high"
 },
 "halloumi": {
  "unitPrice": 6.99,
  "per": "package",
  "aisle": "Dairy & Eggs",
  "packSize": "8 oz",
  "confidence": "medium"
 },
 "cotija": {
  "unitPrice": 4.99,
  "per": "package",
  "aisle": "Dairy & Eggs",
  "packSize": "10 oz",
  "confidence": "medium"
 },
 "cotija cheese": {
  "unitPrice": 4.99,
  "per": "package",
  "aisle": "Dairy & Eggs",
  "packSize": "10 oz",
  "confidence": "medium"
 },
 "goat cheese": {
  "unitPrice": 4.49,
  "per": "package",
  "aisle": "Dairy & Eggs",
  "packSize": "4 oz log",
  "confidence": "high"
 },
 "sharp cheddar": {
  "unitPrice": 5.99,
  "per": "package",
  "aisle": "Dairy & Eggs",
  "packSize": "8 oz block",
  "confidence": "high"
 },
 "bulgur": {
  "unitPrice": 3.49,
  "per": "bag",
  "aisle": "Dry Goods & Pasta",
  "packSize": "16 oz bag",
  "confidence": "medium"
 },
 "coarse bulgur": {
  "unitPrice": 3.49,
  "per": "bag",
  "aisle": "Dry Goods & Pasta",
  "packSize": "16 oz bag",
  "confidence": "medium"
 },
 "whole-wheat ziti": {
  "unitPrice": 2.49,
  "per": "box",
  "aisle": "Dry Goods & Pasta",
  "packSize": "16 oz box",
  "confidence": "high"
 },
 "whole-wheat linguine": {
  "unitPrice": 2.49,
  "per": "box",
  "aisle": "Dry Goods & Pasta",
  "packSize": "16 oz box",
  "confidence": "high"
 },
 "whole-wheat noodle": {
  "unitPrice": 2.99,
  "per": "box",
  "aisle": "Dry Goods & Pasta",
  "packSize": "12 oz box",
  "confidence": "medium"
 },
 "flatbread": {
  "unitPrice": 4.49,
  "per": "package",
  "aisle": "Bakery",
  "packSize": "6 ct",
  "confidence": "medium"
 },
 "whole-wheat flatbread": {
  "unitPrice": 4.49,
  "per": "package",
  "aisle": "Bakery",
  "packSize": "6 ct",
  "confidence": "medium"
 },
 "gnocchi": {
  "unitPrice": 3.29,
  "per": "package",
  "aisle": "Dry Goods & Pasta",
  "packSize": "16 oz",
  "confidence": "high"
 },
 "green chile": {
  "unitPrice": 1.79,
  "per": "can",
  "aisle": "Canned & Jarred",
  "packSize": "4 oz can",
  "confidence": "high"
 },
 "diced green chile": {
  "unitPrice": 1.79,
  "per": "can",
  "aisle": "Canned & Jarred",
  "packSize": "4 oz can",
  "confidence": "high"
 },
 "dried apricot": {
  "unitPrice": 5.49,
  "per": "bag",
  "aisle": "Dry Goods & Pasta",
  "packSize": "6 oz bag",
  "confidence": "medium"
 },
 "romaine heart": {
  "unitPrice": 3.99,
  "per": "package",
  "aisle": "Produce",
  "packSize": "3 ct",
  "confidence": "high"
 },
 "pepperoncini": {
  "unitPrice": 3.29,
  "per": "jar",
  "aisle": "Canned & Jarred",
  "packSize": "16 oz jar",
  "confidence": "medium"
 },
 "tarragon": {
  "unitPrice": 2.99,
  "per": "package",
  "aisle": "Produce",
  "packSize": "0.75 oz",
  "confidence": "low"
 },
 "shiitake mushroom": {
  "unitPrice": 4.49,
  "per": "package",
  "aisle": "Produce",
  "packSize": "4 oz",
  "confidence": "medium"
 },
 "bok choy": {
  "unitPrice": 2.79,
  "per": "bunch",
  "aisle": "Produce",
  "packSize": "bunch",
  "confidence": "medium"
 },
 "scallop": {
  "unitPrice": 17.99,
  "per": "lb",
  "aisle": "Meat & Seafood",
  "packSize": "per lb",
  "confidence": "medium"
 },
 "sea scallop": {
  "unitPrice": 17.99,
  "per": "lb",
  "aisle": "Meat & Seafood",
  "packSize": "per lb",
  "confidence": "medium"
 },
 "cottage cheese": {
  "unitPrice": 4.29,
  "per": "tub",
  "aisle": "Dairy & Eggs",
  "packSize": "16 oz tub",
  "confidence": "high"
 },
 "ricotta": {
  "unitPrice": 4.79,
  "per": "tub",
  "aisle": "Dairy & Eggs",
  "packSize": "15 oz tub",
  "confidence": "high"
 },
 "mango": {
  "unitPrice": 1.49,
  "per": "each",
  "aisle": "Produce",
  "packSize": "each",
  "confidence": "high"
 },
 "assorted raw vegetable": {
  "unitPrice": 5.99,
  "per": "package",
  "aisle": "Produce",
  "packSize": "veggie tray",
  "confidence": "low"
 }
};
Object.assign(PRICES, PRICE_SUPPLEMENT_2);

// Third round — the family/component-meal recipes.
export const PRICE_SUPPLEMENT_3 = {
 "neutral oil": {
  "unitPrice": 5.49,
  "per": "bottle",
  "aisle": "Condiments & Sauces",
  "packSize": "48 oz bottle",
  "confidence": "high"
 },
 "monterey jack": {
  "unitPrice": 5.49,
  "per": "package",
  "aisle": "Dairy & Eggs",
  "packSize": "8 oz block",
  "confidence": "high"
 },
 "shredded monterey jack": {
  "unitPrice": 5.49,
  "per": "package",
  "aisle": "Dairy & Eggs",
  "packSize": "8 oz bag",
  "confidence": "high"
 },
 "barbecue sauce": {
  "unitPrice": 3.49,
  "per": "bottle",
  "aisle": "Condiments & Sauces",
  "packSize": "18 oz bottle",
  "confidence": "high"
 },
 "buffalo sauce": {
  "unitPrice": 4.29,
  "per": "bottle",
  "aisle": "Condiments & Sauces",
  "packSize": "12 oz bottle",
  "confidence": "medium"
 },
 "slider roll": {
  "unitPrice": 4.49,
  "per": "package",
  "aisle": "Bakery",
  "packSize": "12 ct",
  "confidence": "high"
 },
 "soft slider roll": {
  "unitPrice": 4.49,
  "per": "package",
  "aisle": "Bakery",
  "packSize": "12 ct",
  "confidence": "high"
 },
 "pappardelle": {
  "unitPrice": 3.99,
  "per": "box",
  "aisle": "Dry Goods & Pasta",
  "packSize": "8.8 oz box",
  "confidence": "medium"
 },
 "lo mein noodle": {
  "unitPrice": 3.49,
  "per": "package",
  "aisle": "Dry Goods & Pasta",
  "packSize": "14 oz",
  "confidence": "medium"
 },
 "cheddar slice": {
  "unitPrice": 4.29,
  "per": "package",
  "aisle": "Dairy & Eggs",
  "packSize": "8 oz sliced",
  "confidence": "high"
 },
 "chili flake": {
  "unitPrice": 4.49,
  "per": "jar",
  "aisle": "Spices & Baking",
  "packSize": "1.5 oz jar",
  "confidence": "high"
 },
 "chili crisp": {
  "unitPrice": 7.99,
  "per": "jar",
  "aisle": "Condiments & Sauces",
  "packSize": "6 oz jar",
  "confidence": "medium"
 },
 "sunflower butter": {
  "unitPrice": 6.49,
  "per": "jar",
  "aisle": "Condiments & Sauces",
  "packSize": "16 oz jar",
  "confidence": "medium"
 },
 "pickled onion": {
  "unitPrice": 5.49,
  "per": "jar",
  "aisle": "Canned & Jarred",
  "packSize": "16 oz jar",
  "confidence": "low"
 },
 "english muffin": {
  "unitPrice": 3.79,
  "per": "package",
  "aisle": "Bakery",
  "packSize": "6 ct",
  "confidence": "high"
 },
 "pita bread": {
  "unitPrice": 3.49,
  "per": "package",
  "aisle": "Bakery",
  "packSize": "6 ct",
  "confidence": "high"
 },
 "rice noodle": {
  "unitPrice": 3.29,
  "per": "package",
  "aisle": "Dry Goods & Pasta",
  "packSize": "14 oz",
  "confidence": "medium"
 },
 "ramen noodle": {
  "unitPrice": 3.99,
  "per": "package",
  "aisle": "Dry Goods & Pasta",
  "packSize": "4 servings",
  "confidence": "medium"
 },
 "snap pea": {
  "unitPrice": 3.99,
  "per": "package",
  "aisle": "Produce",
  "packSize": "8 oz",
  "confidence": "high"
 },
 "ground lamb": {
  "unitPrice": 9.99,
  "per": "lb",
  "aisle": "Meat & Seafood",
  "packSize": "per lb",
  "confidence": "medium"
 }
};
Object.assign(PRICES, PRICE_SUPPLEMENT_3);

// --- Supplement 4: baking aisle, freezer pops and the make-with-kids shelf.
// Same basis as the rest: everyday shelf prices, ShopRite/Acme, Fairfield County,
// August 2026. Added when the dessert and kid-project recipes went in.
export const PRICE_SUPPLEMENT_4 = {
 "caramel sauce": {
  "unitPrice": 4.49,
  "per": "jar",
  "aisle": "Condiments & Sauces",
  "packSize": "12 oz jar",
  "confidence": "medium"
 },
 "hot fudge sauce": {
  "unitPrice": 4.79,
  "per": "jar",
  "aisle": "Condiments & Sauces",
  "packSize": "11.75 oz jar",
  "confidence": "medium"
 },
 "cookie butter spread": {
  "unitPrice": 4.99,
  "per": "jar",
  "aisle": "Condiments & Sauces",
  "packSize": "14.1 oz jar",
  "confidence": "medium"
 },
 "strawberry jam": {
  "unitPrice": 4.49,
  "per": "jar",
  "aisle": "Condiments & Sauces",
  "packSize": "18 oz jar",
  "confidence": "medium"
 },
 "apricot jam": {
  "unitPrice": 4.99,
  "per": "jar",
  "aisle": "Condiments & Sauces",
  "packSize": "18 oz jar",
  "confidence": "medium"
 },
 "pizza sauce": {
  "unitPrice": 2.99,
  "per": "jar",
  "aisle": "Canned & Jarred",
  "packSize": "14 oz jar",
  "confidence": "medium"
 },
 "maraschino cherries": {
  "unitPrice": 3.99,
  "per": "jar",
  "aisle": "Canned & Jarred",
  "packSize": "10 oz jar",
  "confidence": "medium"
 },
 "mandarin orange": {
  "unitPrice": 1.99,
  "per": "can",
  "aisle": "Canned & Jarred",
  "packSize": "15 oz can",
  "confidence": "medium"
 },
 "cream of tartar": {
  "unitPrice": 4.99,
  "per": "jar",
  "aisle": "Spices & Baking",
  "packSize": "1.5 oz jar",
  "confidence": "medium"
 },
 "gel food coloring": {
  "unitPrice": 6.99,
  "per": "package",
  "aisle": "Spices & Baking",
  "packSize": "4 ct set",
  "confidence": "medium"
 },
 "meringue powder": {
  "unitPrice": 9.99,
  "per": "container",
  "aisle": "Spices & Baking",
  "packSize": "8 oz container",
  "confidence": "medium"
 },
 "rainbow sprinkles": {
  "unitPrice": 3.49,
  "per": "container",
  "aisle": "Spices & Baking",
  "packSize": "3.2 oz container",
  "confidence": "medium"
 },
 "sprinkles": {
  "unitPrice": 3.49,
  "per": "container",
  "aisle": "Spices & Baking",
  "packSize": "3.2 oz container",
  "confidence": "medium"
 },
 "nonpareils": {
  "unitPrice": 3.49,
  "per": "container",
  "aisle": "Spices & Baking",
  "packSize": "3.2 oz container",
  "confidence": "medium"
 },
 "white chocolate": {
  "unitPrice": 3.79,
  "per": "bar",
  "aisle": "Spices & Baking",
  "packSize": "4 oz bar",
  "confidence": "medium"
 },
 "milk chocolate": {
  "unitPrice": 3.29,
  "per": "bar",
  "aisle": "Spices & Baking",
  "packSize": "4.4 oz bar",
  "confidence": "medium"
 },
 "turbinado sugar": {
  "unitPrice": 4.29,
  "per": "box",
  "aisle": "Spices & Baking",
  "packSize": "24 oz box",
  "confidence": "medium"
 },
 "pretzel salt": {
  "unitPrice": 4.49,
  "per": "container",
  "aisle": "Spices & Baking",
  "packSize": "4 oz container",
  "confidence": "medium"
 },
 "speculoos cookies": {
  "unitPrice": 4.99,
  "per": "package",
  "aisle": "Dry Goods & Pasta",
  "packSize": "8.8 oz package",
  "confidence": "medium"
 },
 "vanilla wafer cookies": {
  "unitPrice": 4.49,
  "per": "box",
  "aisle": "Dry Goods & Pasta",
  "packSize": "11 oz box",
  "confidence": "medium"
 },
 "graham cracker": {
  "unitPrice": 5.29,
  "per": "box",
  "aisle": "Dry Goods & Pasta",
  "packSize": "14.4 oz box",
  "confidence": "medium"
 },
 "graham cracker crumbs": {
  "unitPrice": 4.79,
  "per": "box",
  "aisle": "Dry Goods & Pasta",
  "packSize": "13.5 oz box",
  "confidence": "medium"
 },
 "pretzel rods": {
  "unitPrice": 3.99,
  "per": "bag",
  "aisle": "Dry Goods & Pasta",
  "packSize": "12 oz bag",
  "confidence": "medium"
 },
 "crisp rice cereal": {
  "unitPrice": 4.99,
  "per": "box",
  "aisle": "Dry Goods & Pasta",
  "packSize": "12 oz box",
  "confidence": "medium"
 },
 "refrigerated biscuit dough": {
  "unitPrice": 3.29,
  "per": "can",
  "aisle": "Dairy & Eggs",
  "packSize": "16.3 oz can",
  "confidence": "medium"
 },
 "refrigerated sugar cookie dough": {
  "unitPrice": 5.29,
  "per": "package",
  "aisle": "Dairy & Eggs",
  "packSize": "16 oz package",
  "confidence": "medium"
 },
 "refrigerated pie crust": {
  "unitPrice": 4.99,
  "per": "box",
  "aisle": "Dairy & Eggs",
  "packSize": "2 ct box",
  "confidence": "medium"
 },
 "vanilla greek yogurt": {
  "unitPrice": 6.49,
  "per": "container",
  "aisle": "Dairy & Eggs",
  "packSize": "32 oz container",
  "confidence": "medium"
 },
 "green grape": {
  "unitPrice": 3.29,
  "per": "lb",
  "aisle": "Produce",
  "packSize": "per lb",
  "confidence": "medium"
 },
 "wooden skewers": {
  "unitPrice": 2.99,
  "per": "package",
  "aisle": "Other",
  "packSize": "100 ct package",
  "confidence": "medium"
 },
 "coconut sugar": {
  "unitPrice": 6.49,
  "per": "bag",
  "aisle": "Spices & Baking",
  "packSize": "16 oz bag",
  "confidence": "medium"
 },
 "medjool dates": {
  "unitPrice": 7.99,
  "per": "package",
  "aisle": "Produce",
  "packSize": "16 oz package",
  "confidence": "medium"
 }
};
Object.assign(PRICES, PRICE_SUPPLEMENT_4);
