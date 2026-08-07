# ReciMe — setup

## It's already live

**177 recipes, all with photos.**

**https://ejrecchia-del.github.io/recime/**

Hosted on GitHub Pages from **github.com/ejrecchia-del/recime**, public, and
working. Skip to Step 2.

Everything here is a plain folder of files — nothing to compile, no
dependencies. Updates go straight into that repo and are live about a minute
later. GitHub Pages has no deploy limit and no card on file, which is why we
moved off Netlify: its free plan allows 20 deploys a month and we ran through
them in one afternoon.

**If you already added the old Netlify address to a phone, remove it and add
this one instead** — a browser keeps its data per web address, so the new one
starts fresh and needs the three sync values entered again (Step 3).

---

## Step 1 — (already done) Put it online

The app needs to live at an `https://` address so your phones can reach it.

1. Go to **https://app.netlify.com/drop** and sign in (free — GitHub or email).
   Signing in first matters: anonymous drops get password-protected.
2. Drag the whole **ReciMe** folder onto the page.
3. You'll get a URL like `https://something-random-1234.netlify.app`.
   Under **Site configuration → Change site name**, rename it to something you
   can type, e.g. `recchia-recipes`.

That URL is now your app. To update it later, drag the folder onto the same
site's **Deploys** tab.

> Cloudflare Pages and Vercel work identically if you prefer them. Avoid
> GitHub Pages — it serves from a subfolder, which breaks the offline mode.

---

## Step 2 — Add it to your phone

**iPhone:** open the URL in **Safari** (it must be Safari) → tap the Share
button → **Add to Home Screen** → Add.

**Android:** Chrome will offer **Install app**, or use ⋮ → **Add to Home
screen**.

**Mac:** Safari → File → **Add to Dock**.

Once installed it runs full screen, works with no signal, and keeps its data
permanently. Do this on both your phone and Dale's.

---

## Step 3 — Shared sync (the backend is already built — you just enter 3 values)

I've already created the Supabase project, the table, and the security
policies, and verified they work by writing and reading real data through the
API. Nothing is left to build. You just point each phone at it.

**Enter these on your phone, then the same three on Dale's:**

Open ReciMe → **More** → **Set up shared sync**

| Field | Value |
|---|---|
| Project URL | `https://ukgzopqcibomrbxahhhx.supabase.co` |
| Anon / publishable key | `sb_publishable_KSzxTlkfm2WxCrYsetYQsw_RPYUhYQp` |
| Household code | `recchia-kitchen` |
| Your name | Eric (or Dale, on hers) |

Tap **Save and connect**. The dot next to it turns green and says Synced.

The household code is what pairs your two phones — it must be **typed
identically on both**. The key is the publishable one, safe to put in an app;
it is not the secret key.

Once you're connected, **More → Invite her** writes out a message with all of
it filled in, ready to text.

### Won't the free project go to sleep?

Only after seven straight days with zero activity. Two people cooking weekly
never hit that — and I've also set up a task on my side that pings it every
Tuesday and Saturday, so it will not pause at all. If it ever did: nothing is
lost, both phones keep working offline, and it's one click to resume.

---

## Company for dinner

On the Plan tab, tap the **⇄** button on any day. At the top is an **Extra
people** stepper — bump it and that one meal scales up. The day shows a badge,
the shopping list buys more of only that meal's ingredients, and every other
night stays at your normal portions.

---

## Sharing recipes with friends

**More → Sharing recipes with friends → Start or join a circle.**

A circle shares **recipes only**. Your meal plan, shopping list and pantry
never leave your household — friends see the food, not your groceries. Their
ratings stay theirs and yours stay yours, so a recipe they love shows up in
your library neutral, waiting for your own verdict.

You get a circle code. Anyone who enters the same code is in. Send it with the
**Copy the invite** button, which writes out the install steps too.

**Three directions:** *Two-way* (the usual), *Share out* (publish yours without
pulling theirs in), *Receive* (the reverse).

**Keeping something back:** open any recipe → **⋯** → **Keep this one private**.
It stays out of every circle. Shared-in recipes show a 👥 badge and there's a
**Shared with us** filter on the Recipes tab.

Leaving a circle removes their recipes from your library.

### Who gets invited, and how

You invite people — there's no open directory and nothing is discoverable.
**More → Sharing recipes with friends → Start or join a circle** creates the
circle and gives you a code. **Copy the invite** puts a message on your
clipboard with the app link, the code, and the "add to home screen" steps, so
you can text it to whoever you want. They install the app, tap *Join a circle*,
paste the code, and they're in. Removing a circle on your side cuts the
connection immediately.

---

## Who added what, and telling someone about a recipe

Every recipe you save now records **who added it**. It shows on the recipe page
under the title — "Added by Eric", or "From Dale's kitchen · shared by the
Recchia circle" for one that came in from a circle. The 177 starter recipes are
unattributed on purpose.

**New since you last looked** — when Dale (or anyone in a circle) adds
something, the Recipes tab grows a badge and a strip at the top listing what's
arrived. Tap **Mark seen** to clear it.

**Nudging someone** — open a recipe → **⋯ → Send to someone**. Pick a person,
add a line like "this Thursday?", and it lands in their app as an inbox item
with a notification. It's the "you'd like this" button, not a share — the
recipe is already shared; the nudge is you pointing at it.

---

## Desserts, and making things with the kids

38 desserts, and they are not all virtuous. Brown butter chocolate chunk
cookies, molten lava cakes, tres leches, monkey bread, churros, a funfetti
sheet cake — these are written as the real thing on purpose, because the
**🌿 Make a healthier version** button exists and it *keeps both*. Tap it on
any recipe and you get a side-by-side of what would change and why; hit save
and the lighter version lands in your library as its own recipe, linked to the
original in both directions. Neither one overwrites the other, ever.

There are also 6 desserts that start out light — chocolate avocado mousse,
almond flour cookies, chia parfaits, date brownie bites, baked stuffed apples,
banana nice cream — for the nights you'd rather not do the swap dance.

### Jobs for the kids

40 of the new recipes carry a **Jobs for the kids** block naming what Jaxon,
Jett and Jace can each actually do — not "let them help" but "Jett rubs the
cold butter into the oat topping, Jaxon runs the peeler, Jace scatters the
chocolate chips." It only shows when there are children on your roster.

Filter the Recipes tab by **make with kids** (36 recipes), **popsicle** (5),
**no-bake** (15) or **dessert**.

The popsicles: strawberry banana yogurt, watermelon lime, proper fudgesicles,
orange creamsicle, and a rainbow layered one that's a whole rainy-Saturday
project. Plus frozen yogurt dots and ice cream in a bag, which is a physics
lesson that ends in dessert.

The bigger projects: soft pretzels, cut-out sugar cookies for decorating,
homemade pop-tarts, mini fruit pizzas, chocolate-dipped pretzel rods, cinnamon
rolls you assemble Saturday night and bake Sunday morning, and a Friday night
pizza dough with a toppings bar — one dough, six different dinners, and the
picky one builds cheese-only without anyone commenting.

---

## Notifications — what actually works

**More → Notifications → Turn on notifications** asks the browser for
permission. Once granted you get an alert when a new recipe or a nudge arrives.

The honest limitation: these are **local** notifications. They fire when the
app is open, or warm in the background — which on an iPhone means it's been
installed to the home screen and you've used it recently. If the app has been
fully closed for a day, the alert appears the next time you open it rather than
arriving out of nowhere.

True out-of-nowhere push (the kind Messages gets) needs the Web Push API plus a
server key pair, which I can add to your Supabase project on request. It's
maybe twenty minutes of work; I left it out because everything else here runs
with no moving parts.

---

## Where things come from (store rules)

**More → Where things come from.** Standing rules that route every list
automatically, so you're not assigning fifty items by hand every week.

Seeded for you, all editable or switchable off:

| Rule | Goes to |
|---|---|
| Paper goods & household — toilet paper, towels, trash bags, foil | Costco (Instacart) |
| Meat, 3 lb and up — chicken, ground beef, salmon | Costco (Instacart) |
| Bulk pantry staples — olive oil, brown rice, oats, coffee, nuts, parmesan | Costco (Instacart) |
| Frozen in bulk — berries, peas, edamame, shrimp | Costco (Instacart) |
| Produce | ShopRite, in person |
| Bakery | ShopRite, in person |

A rule matches either **whole aisles** or **words in the item name**, and can
carry a **size threshold** — that's what makes "chicken only goes to Costco when
it's 3 lb or more" work. Matching is whole-phrase, so a rule for *frozen corn*
won't drag corn tortillas along with it.

**Three layers, in order of precedence:**

1. **Anything you set by hand on the list wins.** Tap an item, choose a store,
   and it's pinned — rules stop touching it.
2. **Rules** route everything else, every time a list is built.
3. **Notes** cover one-offs. The box at the bottom of that screen (and on the
   Hand off to Claude sheet) is free text — "we're out of coffee, grab whatever's
   on sale" — and it rides along with the list, overriding the rest.

**Menu → Re-apply store rules** re-routes an existing list after you change a
rule. Pinned items are left alone.

### A note on Costco through Instacart

You don't need a membership — but non-member prices run roughly 13–15% above
in-warehouse, on top of service fees. That's why the default rules only send
genuinely bulk items there, and why the handoff prompt tells Claude the same
thing. If you use Costco heavily, a $65 Gold Star membership pays for itself.

---

## Who we're cooking for

**More → Who we're cooking for.** Already loaded: you, Dale, Jaxon, Jett and
Jace. For children you give a **date of birth** rather than an age, so portions
and what's age-appropriate move on their own as they grow — Jace stops being a
toddler in the app's eyes without you touching anything. Set how each child
eats — *eats everything*, *kind of picky*, or *very picky* — plus anything they
flatly refuse. (Those three are still on the default *eats everything*; set
them when you get a minute and the planner sharpens up immediately.)

Two things follow from this:

**Portions get honest.** Two adults and a six-year-old is 2.6 portions, not 3.
Plans and shopping lists scale to the real number instead of over-buying.

**The app learns to cook one meal.** After you finish a recipe in cook mode it
asks how each person got on with it — loved it, ate it, picked at it, wouldn't
eat it, or wasn't there. That's the single most useful thing you can tell it.
Recipes everyone ate get a **👪 all ate** badge, there's an **Everyone ate it**
filter on the Recipes tab, and the weekly planner leans hard toward those and
away from the ones the kids refused. Before anyone's eaten anything it makes an
educated guess — familiar formats score well, heat and strong flavors score
badly — weighted by how picky your kids actually are.

### Who ate it — kept for every time you make it

Every recipe has a **Who ate it** section. Each night you make something is
its own entry, so nothing overwrites anything: make a dish four times and you
get four records, not one.

Once there are two or more, a **Track record** appears — a row per person with
a colored bar for each time (green ate, amber picked at it, red refused, grey
wasn't there) and a plain count: *ate it 2 of 3*. If someone's coming round to
a dish, it says so — the app compares the last two times against the earlier
ones and flags **↗ coming round to it** or **↘ going off it**.

The buttons on that block:

- **Update last time** — fix what you logged tonight.
- **＋ Made it again** — start a new entry.
- **See every time we made it** — the full list, each one editable or
  removable, with the optional note you left ("less spice next time").

Logging right after cook mode does the obvious thing: within six hours it
keeps adding to tonight's entry rather than starting a second one, so seconds
and leftovers don't turn into a phantom extra night.

The planner reads the whole history, not the last night. Recent nights count
for more, but the earlier ones still count — one bad Tuesday with a tired
seven-year-old doesn't retire a meal everyone normally eats — and a dish
that's landed well several times gets a small extra nudge for being a safe
bet. A recipe that's gone down clean every single time picks up a
**🎯 Reliable** tag.

**One dinner for five.** 45 of the recipes are written for a family table, and
39 of those are *component* meals — the thing goes on the table in parts so
each person builds their own plate. Those recipes carry a **Feeding everyone**
block: how to serve it so nobody needs a separate meal, and a line specifically
for Jace with the food-safety cut ("quarter every cherry tomato lengthwise,
never whole or halved crosswise"). The toddler note uses whichever child is
actually youngest, by name.

Stores now include **Costco** alongside ShopRite and Acme.

---
## Skipping days you're out

Tap **🗓️ Skip days we're out** on the Plan tab, pick a reason (eating out,
takeout, leftovers, away), then tap any days you won't be cooking. Or tap the
⇄ button on a single meal and choose a reason there.

Skipped meals show as struck-through on the plan and are **left off the
shopping list entirely** — so a Friday date night doesn't put Friday's
ingredients in your cart. Tap a skipped day again to put it back.

---

## Photos

The 177 starter recipes come with food photography (Pexels, free to use). A
recipe you import from a link picks up that page's photo automatically.

To use your own: open a recipe → **📷 Add a photo** → pick from your camera
roll. It's resized and compressed before saving so it doesn't eat your
storage. Your own photo is never overwritten by an app update.

---

## Step 4 — Sharing a recipe into the app

### Android
Nothing to do. Once installed, ReciMe appears in the share sheet. Share any
recipe link to it and it opens ready to save.

### iPhone
Apple doesn't let web apps into the share sheet, so you make a Shortcut that
stands in for one. Five minutes, once. The app walks you through it under
**More → Set up "Share → ReciMe" on iPhone**, but here it is in full:

1. Open the **Shortcuts** app → tap **＋**.
2. Add a **Text** action. Type your app URL followed by `?url=` — e.g.
   `https://recchia-recipes.netlify.app/?url=`
3. Tap right at the end of that text and insert the **Shortcut Input**
   variable, so it sits immediately after the `=`.
4. Add an **Open URLs** action below it, with that Text as its input.
5. Tap the shortcut's name at the top → **Details** → turn on
   **Show in Share Sheet**.
6. Under **Share Sheet Types**, untick everything except **URLs** and
   **Safari web pages**.
7. Name it **Save to ReciMe**. Done.

Now in Safari, TikTok, or Instagram: Share → scroll down → **Save to ReciMe**.

One quirk to expect: it opens in Safari rather than the installed app. Apple
provides no way around that. Because both are pointed at the same synced
account, the recipe still lands in your library and appears in the installed
app moments later.

You can send the finished Shortcut to Dale: in Shortcuts, tap ⋯ on it →
Share → **Copy iCloud Link** → text it to her. She taps it and taps Get
Shortcut.

---

## Step 5 — The recipe-link parser (DONE — deployed and tested)

The `parse-recipe` function is live at
`https://ukgzopqcibomrbxahhhx.supabase.co/functions/v1/parse-recipe`.

**How importing actually behaves.** Paste a recipe page's URL into the Add
screen and tap *Get the recipe*. Most food blogs publish machine-readable
recipe data, and those import in one tap — title, ingredients, steps, photo and
nutrition, all filled in. Tested working: Skinnytaste, Love and Lemons, Half
Baked Harvest, and most independent blogs.

**Some sites block it.** AllRecipes, EatingWell and Serious Eats — all owned by
Dotdash Meredith — sit behind bot protection that refuses any server. When that
happens the app tells you plainly and gives you an *Open the page* button and a
*Paste it in* button. Open the page, select the recipe (just the ingredients
and steps — you don't need to be careful, the parser skips the chatter), copy,
and paste. About ten seconds.

You never have to guess which is which: just paste the link first. If it works,
you're done in one tap. If it doesn't, the app hands you the fallback.

### Video links (TikTok / Instagram / YouTube)

The function reads the caption or description, which usually has the whole
recipe. For messier ones you can add an AI pass:

1. Get an Anthropic API key from **https://console.anthropic.com** (pay per
   use — a recipe costs well under a cent).
2. Supabase → **Edge Functions** → **Secrets** → add `ANTHROPIC_API_KEY`.
3. In ReciMe: **More → AI recipe reading & chat** → paste the key.

Optionally also deploy `supabase/recime-ai.ts` the same way, named `recime-ai`
— that upgrades the **Ask** tab to answer with a real model. Ask works without
it; it just uses the built-in matcher.

---
## About Instacart

**Sign-ups reopened.** Instacart's Developer Platform now hands out API keys
self-serve, so the one-tap path is live. Four steps, once:

1. **Get a key.** Sign in at `dashboard.instacart.com` → **API Keys** →
   **Create New API Key**. Pick **Production** — a Development key only builds
   sandbox pages that can't be shopped. Copy it immediately; the dashboard
   won't show it in full again.
2. **Deploy the function.** In Supabase → **Edge Functions** → *Deploy a new
   function* → *Via Editor*, name it exactly `instacart-list`, paste the
   contents of `supabase/instacart-list.ts`, deploy.
3. **Add the secret.** On that function, add `INSTACART_API_KEY` and paste the
   key there. **Not** into the app. The key stays on your backend, so it never
   sits in a phone's storage and never travels anywhere you can't see.
   Optional extras: `INSTACART_ENV=dev` to point at the sandbox while you're
   testing, `INSTACART_RETAILER_KEY` to always land on one store.
4. **Switch it on.** Settings → *Keys and backends* → **Instacart cart
   building** → toggle on, then tap **Test the connection**. It asks Instacart
   which stores deliver to your postcode — the cheapest possible call — and
   tells you what came back.

### What that turns on

- **Shopping tab → Send to Instacart → Build an Instacart list page.** Your
  whole week becomes one shoppable page, in the quantities you'd actually buy
  ("12 cloves garlic" goes over as 2 heads, not 12 cloves). Staples come
  through as pantry items you can untick rather than re-buy.
- **Any recipe → Shop these ingredients on Instacart.** One recipe, its method
  and its whole ingredient list, at whatever servings you have on screen.
  Scaled to 8 on the detail page, it goes over scaled to 8.
- **Settings → Stores → Find stores near {postcode}.** Asks Instacart which
  retailers actually deliver to you and adds the ones you tick, with their
  real retailer keys. This is also the answer for anyone in a circle who lives
  somewhere else: they set their own postcode and get their own stores.

Units are translated on the way out. Instacart only accepts a fixed
vocabulary, and a single unrecognised unit gets a line item rejected — so
cloves, sprigs, stalks, slices and pinches all go over as "each", which is
what you're buying anyway.

### The paths that need no key

Still there, still work:

- **Open a search per item** — walk the list one item at a time.
- **Copy the list** for Instacart's own "Add items" box.
- **Hand off to Claude** — copies your list with shopping instructions
  (compare stores, lean organic where the premium is reasonable, don't place
  the order, report back). Paste into a Claude session with browser access.

**On the automated version you asked about** — Claude searching Instacart,
picking the best store, building the cart and pinging you when it's ready:
that's still a scheduled Claude task rather than an app feature, because it
needs a logged-in browser. The official API builds the page; it doesn't place
the order. Say the word and I'll set it up as a recurring Sunday task.

---

## Everyday use

- **Recipes** — search, filter, ★ favorite, rate 1–5. Long-press a card for
  quick rating and "Eat every week!". The **Because you liked** row learns from
  your ratings and favorites.
- **Any recipe → 🌿 Make a healthier version** — swaps ingredients, explains
  each change, estimates the nutrition difference, and saves as a *second*
  recipe so you keep both.
- **▶ Start cooking** — one step at a time in big type, screen stays awake,
  shows the ingredients for that step, and turns "bake for 25 minutes" into a
  tappable timer. Swipe or tap to advance.
- **Ask** — "something cozy and vegetarian", "quick chicken, no shellfish", or
  "I have eggs, spinach and feta" and it ranks what you can actually make and
  lists what's missing. Add regulars under 🧺 My pantry.
- **Plan** — suggests a week from your ratings, balancing protein and cuisine
  and keeping weeknights short. 🔄 rerolls one night, ⇄ lets you pick. Approve
  it and it offers to build the list.
- **Shopping** — merged, aisle-sorted in the order you actually walk the store
  (produce first, frozen last), priced per item with a running total. 🏠 marks
  something you already have and takes it off the list. Each item can be routed
  to Instacart or in-person, per store, and the totals split accordingly.
  **At the store** mode hides what you already have; **Organize** shows
  everything.

## Notes on the numbers

Prices are everyday shelf prices for ShopRite/Acme-class supermarkets in
Fairfield County, gathered August 2026 from BLS/FRED Northeast series and USDA
retail-ad data. Sale prices commonly run 25–40% lower, so treat the total as a
ceiling. Spices and condiments are billed as a fraction of the jar, since one
teaspoon of cumin isn't a $5 line item.

Nutrition on the starter recipes is estimated per serving. Nutrition on
imported recipes comes from the source when it publishes it, otherwise it's a
rough calculation and labeled as one.

## Your data

It lives in your browser's storage on each device, and in your own Supabase
project if you set up sync. Nothing goes anywhere else. **More → Export a
backup** writes a JSON file you can keep.

Free Supabase projects pause after a week of no activity — normal use keeps it
awake, but if you're away for two weeks, open the Supabase dashboard once and
hit Resume. Your data is untouched.
