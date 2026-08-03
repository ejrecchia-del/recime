// ---------------------------------------------------------------------------
// views/plan.js — the suggested week: approve it, reroll it, or swap it yourself
// ---------------------------------------------------------------------------
import store from '../store.js';
import { el, on, artHtml, artStyle, toast, sheet, confirmSheet, emptyState, copyText, $, thumbUrl } from '../ui.js';
import { esc, ymd, weekStartOf, addDays, parseYmd, prettyDate, DAY_SHORT, fmtMinutes, totalMinutes, recipeArt } from '../util.js';
import { generatePlan, reroll, planSummary, slotDateLabel, skipSlot, unskipSlot, skipDay, unskipDay, SKIP_REASONS, skipReasonOf } from '../planner.js';
import { buildListFromPlan } from './shop.js';
import { planWine, wineListItems, wineHandoffPayload, caseMath, CASE_TIERS } from '../wine.js';

let viewWeek = null;

function mealThumb(r) {
  return r.image
    ? `<img data-src="${esc(thumbUrl(r.image, 300))}" alt="" decoding="async" class="lazy" onerror="this.replaceWith(document.createTextNode('${recipeArt(r).emoji}'))">`
    : recipeArt(r).emoji;
}

export default function renderPlan() {
  const nav = window.__recimeNav;
  const weekKey = viewWeek || ymd(weekStartOf(new Date()));
  const plan = store.plan(weekKey);
  const root = el(`<div class="screen"></div>`);

  const start = parseYmd(weekKey);
  const end = addDays(start, 6);
  const isThisWeek = weekKey === ymd(weekStartOf(new Date()));

  root.appendChild(el(`<div class="topbar">
    <div class="topbar-row">
      <button class="btn icon ghost" data-a="prevweek" aria-label="Previous week">‹</button>
      <div class="grow center">
        <h1 style="font-size:19px">${isThisWeek ? 'This week' : prettyDate(start)}</h1>
        <div class="sub">${prettyDate(start)} – ${prettyDate(end)}</div>
      </div>
      <button class="btn icon ghost" data-a="nextweek" aria-label="Next week">›</button>
    </div>
  </div>`));

  if (!plan) {
    root.appendChild(el(emptyState('🗓️', 'No plan for this week yet',
      'I\'ll put together seven dinners based on what you two have rated and favorited. You can swap anything before approving.',
      `<button class="btn primary" data-a="generate">✨ Suggest a week</button>
       <div style="margin-top:10px"><button class="btn sm ghost" data-a="blank">Start an empty week</button></div>`)));
    wire(root, weekKey, plan);
    return root;
  }

  const sum = planSummary(plan, (id) => store.recipe(id));

  if (plan.status === 'approved') {
    root.appendChild(el(`<div class="banner good">✅ Approved. ${sum.filled} meal${sum.filled === 1 ? '' : 's'} planned${sum.skipped ? `, ${sum.skipped} skipped` : ''}.
      <button class="btn xs" style="margin-left:6px" data-a="list">Build shopping list</button></div>`));
  } else {
    root.appendChild(el(`<div class="banner info">Draft plan — swap anything you don't like, then approve it.</div>`));
  }

  // --- the days ------------------------------------------------------------
  const todayKey = ymd(new Date());
  const wrap = el(`<div class="card" style="margin:12px 16px;border-radius:14px;overflow:hidden"></div>`);
  for (const slot of plan.slots) {
    const r = slot.recipeId ? store.recipe(slot.recipeId) : null;
    const d = parseYmd(slot.date);
    wrap.appendChild(el(`<div class="dayrow ${slot.date === todayKey ? 'today' : ''}">
      <div class="d">
        <div class="dw">${DAY_SHORT[d.getDay()]}</div>
        <div class="dn">${d.getDate()}</div>
      </div>
      ${slot.guests ? `<span class="guestpill">+${slot.guests}</span>` : ''}
      ${slot.skipped
        ? `<div class="mealart skipped">${skipReasonOf(slot.skipReason).emoji}</div>
           <div class="grow" data-unskip="${esc(slot.id)}" style="min-width:0">
             <div class="mealname skipname">${esc(skipReasonOf(slot.skipReason).label)}</div>
             <div class="tiny dim">${slot.skipNote ? esc(slot.skipNote) + ' · ' : ''}not cooking — tap to undo</div>
           </div>
           <button class="btn xs ghost" data-swap="${esc(slot.id)}" title="Plan something after all">＋</button>`
        : r
        ? `<div class="mealart" style="${artStyle(r)}">${mealThumb(r)}</div>
           <div class="grow" data-open="${esc(r.id)}" style="min-width:0">
             <div class="mealname">${esc(r.title)}</div>
             <div class="tiny dim">${fmtMinutes(totalMinutes(r))}${r.nutritionPerServing?.calories ? ` · ${r.nutritionPerServing.calories} cal` : ''}${slot.reasons?.length ? ` · ${esc(slot.reasons[0])}` : ''}</div>
           </div>
           <button class="btn xs ghost" data-reroll="${esc(slot.id)}" title="Suggest another">🔄</button>
           <button class="btn xs ghost" data-swap="${esc(slot.id)}" title="Pick myself or skip">⇄</button>`
        : `<div class="mealart" style="background:var(--bg-3)">＋</div>
           <div class="grow empty" data-swap="${esc(slot.id)}">Nothing planned — tap to pick or skip</div>`}
    </div>`));
  }
  root.appendChild(wrap);

  // --- summary -------------------------------------------------------------
  if (sum.filled) {
    root.appendChild(el(`<div class="pad">
      <div class="card pad">
        <div class="kv"><span class="k">Meals planned</span><span class="v">${sum.filled} of ${sum.cookable}</span></div>
        ${sum.skipped ? `<div class="kv"><span class="k">Skipped</span><span class="v">${sum.skipped} (out / away)</span></div>` : ''}
        ${sum.avgCalories ? `<div class="kv"><span class="k">Average per serving</span><span class="v">${sum.avgCalories} cal</span></div>` : ''}
        ${sum.avgMinutes ? `<div class="kv"><span class="k">Average cook time</span><span class="v">${fmtMinutes(sum.avgMinutes)}</span></div>` : ''}
        <div class="kv"><span class="k">Variety</span><span class="v">${sum.cuisines.length} cuisines</span></div>
      </div>
    </div>`));
  }

  // --- wine ----------------------------------------------------------------
  if (store.settings.wineEnabled !== false) {
    const entries = plan.slots
      .filter((sl) => sl.recipeId && !sl.skipped)
      .map((sl) => ({ recipe: store.recipe(sl.recipeId), day: slotDateLabel(sl) }))
      .filter((e) => e.recipe);
    if (entries.length >= 2) {
      const wp = planWine(entries, {
        bottles: store.settings.wineBottles || 12,
        targetPerBottle: store.settings.wineTargetPerBottle || 12,
      });
      const cols = Object.entries(wp.colours)
        .map(([c, n]) => `${n} ${c === 'rose' ? 'rosé' : c}`).join(' · ');
      root.appendChild(el(`<div class="pad" style="padding-top:2px">
        <div class="sechead" style="padding:0 0 7px">Wine for this week<span class="line"></span></div>
        <div class="card pad" style="margin:0" data-a="wine" style="cursor:pointer">
          <div class="row-between">
            <div><div style="font-weight:700">🍷 ${wp.bottles} bottles — ${esc(cols)}</div>
              <div class="tiny dim">${esc(wp.tier.label)} · about $${wp.math.net.toFixed(0)} after the discount</div></div>
            <span class="dim">›</span>
          </div>
        </div>
      </div>`));
    }
  }

  // --- actions -------------------------------------------------------------
  root.appendChild(el(`<div class="pad stack">
    ${plan.status === 'approved'
      ? `<button class="btn primary block" data-a="list">🛒 Build the shopping list</button>
         <button class="btn block" data-a="unapprove">Reopen for edits</button>`
      : `<button class="btn primary block" data-a="approve">✓ Approve this week</button>
         <button class="btn block" data-a="regenerate">✨ Suggest a different week</button>`}
    <button class="btn block" data-a="skipdays">🗓️ Skip days we're out</button>
    <button class="btn block ghost small" data-a="clear">Clear this week</button>
  </div>`));

  wire(root, weekKey, plan);
  return root;
}

function wire(root, weekKey, plan) {
  const nav = window.__recimeNav;

  on(root, 'click', '[data-a="prevweek"]', () => { viewWeek = ymd(addDays(parseYmd(weekKey), -7)); nav.render(); });
  on(root, 'click', '[data-a="nextweek"]', () => { viewWeek = ymd(addDays(parseYmd(weekKey), 7)); nav.render(); });
  on(root, 'click', '[data-open]', (e, t) => nav.openRecipe(t.dataset.open));

  on(root, 'click', '[data-a="generate"], [data-a="regenerate"]', () => {
    const p = generatePlan(store.allRecipes(), {
      weekStart: weekKey,
      days: store.settings.planDays || 7,
      meals: store.settings.planMeals || ['dinner'],
      servings: store.householdServings(),
      weeknightMax: store.settings.weeknightMaxMinutes || 40,
      dietPrefs: store.settings.dietPrefs || [],
      lockedSlots: plan ? plan.slots.filter((s) => s.locked || s.skipped) : [],
      recentIds: recentPlanned(weekKey),
    });
    store.savePlan(p);
    toast('Here\'s a week — swap anything you like');
  });

  on(root, 'click', '[data-a="blank"]', () => {
    const p = generatePlan([], { weekStart: weekKey, days: store.settings.planDays || 7, meals: store.settings.planMeals || ['dinner'], servings: store.householdServings() });
    store.savePlan(p);
  });

  on(root, 'click', '[data-reroll]', (e, t) => {
    const p = store.plan(weekKey);
    reroll(p, t.dataset.reroll, store.allRecipes(), {
      weeknightMax: store.settings.weeknightMaxMinutes,
      dietPrefs: store.settings.dietPrefs,
    });
    store.savePlan(p);
  });

  on(root, 'click', '[data-swap]', (e, t) => openPicker(weekKey, t.dataset.swap));

  on(root, 'click', '[data-unskip]', (e, t) => {
    const p = store.plan(weekKey);
    unskipSlot(p, t.dataset.unskip);
    store.savePlan(p);
    toast('Back on the menu');
  });

  on(root, 'click', '[data-a="skipdays"]', () => openSkipDays(weekKey));

  on(root, 'click', '[data-a="approve"]', () => {
    const p = store.plan(weekKey);
    p.status = 'approved';
    store.savePlan(p);
    toast('Approved 🎉');
    setTimeout(() => askBuildList(weekKey), 350);
  });

  on(root, 'click', '[data-a="unapprove"]', () => {
    const p = store.plan(weekKey); p.status = 'draft'; store.savePlan(p);
  });

  on(root, 'click', '[data-a="list"]', () => buildListFromPlan(weekKey, { navigate: true }));
  on(root, 'click', '[data-a="wine"]', () => openWine(weekKey));

  on(root, 'click', '[data-a="clear"]', async () => {
    if (await confirmSheet('Clear this week?', 'The plan will be emptied. Your recipes are untouched.', { danger: true, okLabel: 'Clear' })) {
      delete store.state.plans[weekKey];
      store.commit('plan', weekKey, 'plan:clear');
    }
  });
}

/**
 * The wine run. Styles first (that's the useful bit), then the case maths,
 * then a hand-off if you want real bottles found for you.
 */
export function openWine(weekKey) {
  const plan = store.plan(weekKey);
  if (!plan) return;
  const entries = plan.slots
    .filter((sl) => sl.recipeId && !sl.skipped)
    .map((sl) => ({ recipe: store.recipe(sl.recipeId), day: slotDateLabel(sl) }))
    .filter((e) => e.recipe);

  let bottles = store.settings.wineBottles || 12;
  let target = store.settings.wineTargetPerBottle || 12;

  const draw = () => {
    const wp = planWine(entries, { bottles, targetPerBottle: target });
    const m = wp.math;
    return `<div class="pad stack">
      <div class="field"><label>How many bottles?</label>
        <div class="segment" id="wb">
          ${[6, 12, 18].map((n) => `<button data-b="${n}" class="${bottles === n ? 'on' : ''}">${n}</button>`).join('')}
        </div>
        <div class="tiny dim">${esc(wp.tier.label)} — ${esc(wp.tier.note)}</div></div>

      <div class="banner good" style="margin:0">
        <b>$${wp.shelfCeiling.toFixed(2)} is your shelf ceiling.</b>
        With ${Math.round(wp.tier.discount * 100)}% off, a bottle at that price costs you
        $${target.toFixed(2)} — so you can reach past your usual $${target} tag and still hit it.
        ${m.nextTier ? `<div style="margin-top:6px">📌 ${m.nextTier.need} more bottle${m.nextTier.need === 1 ? '' : 's'} and the discount goes from ${Math.round(wp.tier.discount * 100)}% to ${Math.round(m.nextTier.discount * 100)}%.</div>` : ''}
      </div>

      <div>
        <div class="small muted" style="margin-bottom:7px">What to buy</div>
        <div class="card">
          ${wp.buy.map((b) => `<div class="lrow">
            <div class="thumb" style="background:var(--bg-3);font-size:17px">${b.style.colour === 'white' ? '🥂' : b.style.colour === 'rose' ? '🌸' : b.style.colour === 'sparkling' ? '🍾' : b.style.colour === 'sweet' ? '🍯' : '🍷'}</div>
            <div class="grow" style="min-width:0">
              <div style="font-weight:650">${b.bottles} × ${esc(b.style.name)}</div>
              <div class="tiny dim">${esc(b.style.notes)} · ${esc(b.style.abv)}</div>
              <div class="tiny" style="color:var(--accent-2)">Look for: ${esc(b.style.look)}</div>
            </div></div>`).join('')}
        </div>
      </div>

      <div>
        <div class="small muted" style="margin-bottom:7px">Which night</div>
        <div class="card">
          ${wp.perNight.map((n) => `<div class="lrow">
            <div class="grow" style="min-width:0">
              <div style="font-weight:600" class="truncate">${esc(n.day || '')} — ${esc(n.recipe.title)}</div>
              <div class="tiny dim">${n.pairing.picks.map((x) => esc(x.style.name)).join(' · ')}</div>
              <div class="tiny dim" style="opacity:.75">${esc((n.pairing.picks[0] || {}).why || '')}</div>
            </div></div>`).join('')}
        </div>
      </div>

      <div class="kv"><span class="k">On the shelf</span><span class="v">$${m.gross.toFixed(2)}</span></div>
      <div class="kv"><span class="k">${Math.round(wp.tier.discount * 100)}% case discount</span><span class="v" style="color:var(--accent-2)">−$${m.saved.toFixed(2)}</span></div>
      <div class="kv"><span class="k"><b>What you pay</b></span><span class="v"><b>$${m.net.toFixed(2)}</b> · $${m.perBottle.toFixed(2)}/bottle</span></div>

      <button class="btn primary block" data-a="tolist">🛒 Add the wine run to my list</button>
      <button class="btn block" data-a="handoff">🤖 Have Claude find the actual bottles</button>
      <p class="tiny dim" style="margin:0">The discount is in-person only, so this is routed as a trip to
        ${esc((store.settings.stores.find((x) => x.id === store.settings.wineStore) || {}).name || 'the wine shop')} rather than a delivery.</p>
    </div>`;
  };

  const sh = sheet('🍷 Wine for this week', draw(), {
    onMount(root, close) {
      const rerender = () => { root.querySelector('.sheet-body').innerHTML = draw(); };
      on(root, 'click', '#wb button', (e, t) => {
        bottles = Number(t.dataset.b);
        store.setSetting('wineBottles', bottles);
        rerender();
      });
      on(root, 'click', '[data-a="tolist"]', async () => {
        const wp = planWine(entries, { bottles, targetPerBottle: target });
        for (const it of wineListItems(wp, store.settings.wineStore)) store.putShoppingItem(it);
        // Anything marked "Every order" rides along without being asked for.
        const standing = store.alwaysWines();
        if (standing.length) {
          const { addWineToList } = await import('./wine.js');
          for (const w of standing) addWineToList(w);
        }
        close();
        toast(`${wp.bottles} bottles added${standing.length ? ` · ${standing.length} standing` : ''}`, 'ok');
        window.__recimeNav.go('shop', { top: true });
      });
      on(root, 'click', '[data-a="handoff"]', () => {
        const wp = planWine(entries, { bottles, targetPerBottle: target });
        const payload = wineHandoffPayload(wp, store.settings);
        const text = [
          'Find me wine for this week.',
          '',
          `Budget: $${payload.budget.targetPerBottleAfterDiscount} a bottle AFTER the case discount.`,
          `Shelf ceiling: $${payload.budget.shelfCeiling} (${payload.budget.caseTier.label}).`,
          payload.budget.note,
          '',
          'Styles and counts:',
          ...payload.buy.map((b) => `  ${b.bottles} × ${b.style} — ${b.lookFor} (${b.tastesLike})`),
          '',
          'Meals they need to go with:',
          ...payload.forMeals.map((f) => `  ${f.day} ${f.meal} → ${f.styles.join(', ')}`),
          '',
          'For each bottle I want: producer, vintage, region, shelf price, ABV, one line on how it tastes,',
          'and which night it is for. Stay at or under the shelf ceiling. Flag anything on a deeper',
          'promotion worth breaking the pattern for.',
          '',
          JSON.stringify(payload, null, 2),
        ].join('\n');
        copyText(text);
        toast('Copied — paste it to Claude', 'ok');
      });
    },
  });
  return sh;
}

function askBuildList(weekKey) {
  sheet('Shopping list', `<div class="pad stack">
    <p class="muted" style="margin:0">Want me to turn this week into a grocery list? I'll merge duplicate ingredients, sort it by aisle and price it out.</p>
    <button class="btn primary block" data-a="yes">🛒 Build the list</button>
    <button class="btn block" data-a="no">Not yet</button>
  </div>`, {
    onMount(root, close) {
      on(root, 'click', '[data-a="yes"]', () => { close(); buildListFromPlan(weekKey, { navigate: true }); });
      on(root, 'click', '[data-a="no"]', close);
    },
  });
}

function openSkipDays(weekKey) {
  const plan = store.plan(weekKey);
  if (!plan) return;
  const dates = Array.from(new Set(plan.slots.map((x) => x.date)));

  const body = `<div class="pad stack">
    <p class="small muted" style="margin:0">Tap any day you won't be cooking — going out, travelling, eating at someone else's. Skipped meals are left off the shopping list.</p>
    <div class="stack" style="gap:8px">
      ${dates.map((d) => {
        const daySlots = plan.slots.filter((x) => x.date === d);
        const allSkipped = daySlots.every((x) => x.skipped);
        const some = daySlots.some((x) => x.skipped);
        const dt = parseYmd(d);
        return `<button class="btn block ${allSkipped ? 'primary' : ''}" data-day="${d}" style="justify-content:space-between">
          <span>${DAY_SHORT[dt.getDay()]} ${dt.getDate()}</span>
          <span class="small ${allSkipped ? '' : 'dim'}">${allSkipped ? 'Skipped' : some ? 'Partly skipped' : 'Cooking'}</span>
        </button>`;
      }).join('')}
    </div>
    <div class="small muted">Reason for the next day you tap</div>
    <div class="chips wrap" style="padding:0" id="skipwhy">
      ${SKIP_REASONS.map((rz, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-why="${rz.id}">${rz.emoji} ${rz.label}</button>`).join('')}
    </div>
    <button class="btn block ghost small" data-a="done">Done</button>
  </div>`;

  sheet('Skip days', body, {
    onMount(root, close) {
      let why = SKIP_REASONS[0].id;
      on(root, 'click', '[data-why]', (e, t) => {
        why = t.dataset.why;
        for (const c of root.querySelectorAll('#skipwhy .chip')) c.classList.toggle('on', c.dataset.why === why);
      });
      on(root, 'click', '[data-day]', (e, t) => {
        const d = t.dataset.day;
        const p = store.plan(weekKey);
        const daySlots = p.slots.filter((x) => x.date === d);
        if (daySlots.every((x) => x.skipped)) unskipDay(p, d);
        else skipDay(p, d, why);
        store.savePlan(p);
        close();
        openSkipDays(weekKey);
      });
      on(root, 'click', '[data-a="done"]', close);
    },
  });
}

function recentPlanned(weekKey) {
  const ids = [];
  for (let w = 1; w <= 3; w++) {
    const k = ymd(addDays(parseYmd(weekKey), -7 * w));
    const p = store.plan(k);
    if (p) for (const s of p.slots) if (s.recipeId) ids.push(s.recipeId);
  }
  return ids;
}

// ---------------------------------------------------------------------------

function openPicker(weekKey, slotId) {
  const plan = store.plan(weekKey);
  const slot = plan.slots.find((s) => s.id === slotId);
  const all = store.allRecipes().filter((r) => r.frequency !== 'never-again');
  const used = new Set(plan.slots.filter((s) => s.id !== slotId && s.recipeId).map((s) => s.recipeId));

  const base = store.householdServings();
  const body = `<div class="pad" style="padding-bottom:6px">
      <div class="row-between" style="margin-bottom:12px">
        <div>
          <div style="font-weight:650">\ud83d\udc65 Extra people</div>
          <div class="tiny dim" id="gsum">Cooking for ${slot?.servings || base}</div>
        </div>
        <div class="qtystep">
          <button data-g="-1">\u2212</button>
          <div class="v" id="gval">${slot?.guests || 0} guest${(slot?.guests || 0) === 1 ? '' : 's'}</div>
          <button data-g="1">\uff0b</button>
        </div>
      </div>
      <div class="small muted" style="margin-bottom:8px">Not cooking this one?</div>
      <div class="chips wrap" style="padding:0;margin-bottom:12px">
        ${SKIP_REASONS.map((rz) => `<button class="chip" data-skip="${rz.id}">${rz.emoji} ${rz.label}</button>`).join('')}
      </div>
      <div class="search"><span class="dim">🔍</span><input id="pq" placeholder="Search your recipes" autocomplete="off"></div>
    </div>
    <div id="plist"></div>`;

  sheet(slot ? slotDateLabel(slot) : 'Pick a meal', body, {
    onMount(root, close) {
      const listEl = $('#plist', root);
      const q = $('#pq', root);

      // Company for dinner: bump this one day's portions without touching the rest
      on(root, 'click', '[data-g]', (e, t) => {
        const p2 = store.plan(weekKey);
        const sl = p2.slots.find((x) => x.id === slotId);
        sl.guests = Math.max(0, Math.min(20, (sl.guests || 0) + Number(t.dataset.g)));
        sl.servings = Math.round((base + sl.guests) * 2) / 2;
        store.savePlan(p2);
        $('#gval', root).textContent = `${sl.guests} guest${sl.guests === 1 ? '' : 's'}`;
        $('#gsum', root).textContent = `Cooking for ${sl.servings}`;
      });
      const draw = () => {
        const term = q.value.toLowerCase();
        let list = all;
        if (term) list = list.filter((r) => r.title.toLowerCase().includes(term)
          || (r.ingredients || []).some((i) => i.item.toLowerCase().includes(term)));
        else list = list.filter((r) => r.mealType === (slot?.meal || 'dinner'));
        list = list.slice().sort((a, b) => (b.favorite - a.favorite) || ((b.rating || 0) - (a.rating || 0)) || a.title.localeCompare(b.title));
        listEl.innerHTML = list.slice(0, 60).map((r) => `<div class="lrow" data-pick="${esc(r.id)}">
          <div class="thumb" style="${artStyle(r)}">${mealThumb(r)}</div>
          <div class="grow"><div style="font-weight:600;font-size:14.5px">${esc(r.title)}</div>
            <div class="tiny dim">${fmtMinutes(totalMinutes(r))}${used.has(r.id) ? ' · already this week' : ''}${r.favorite ? ' · ❤️' : ''}</div></div>
          <span class="dim">›</span></div>`).join('') || '<div class="empty-state small">Nothing matches.</div>';
      };
      q.addEventListener('input', draw);
      draw();
      on(root, 'click', '[data-pick]', (e, t) => {
        const r = store.recipe(t.dataset.pick);
        slot.recipeId = r.id; slot.title = r.title; slot.reasons = [];
        slot.skipped = false; slot.skipReason = ''; slot.skipNote = '';
        store.savePlan(plan);
        close();
      });
      on(root, 'click', '[data-skip]', (e, t) => {
        skipSlot(plan, slotId, t.dataset.skip);
        store.savePlan(plan);
        close();
        toast('Skipped — left off the shopping list');
      });
    },
  });
}

// ---------------------------------------------------------------------------

export function addRecipeToPlan(recipe, servings) {
  const weekKey = ymd(weekStartOf(new Date()));
  let plan = store.plan(weekKey);
  if (!plan) {
    plan = generatePlan([], { weekStart: weekKey, days: 7, meals: store.settings.planMeals || ['dinner'], servings: servings || store.householdServings() });
    store.savePlan(plan);
  }
  const body = `<div class="pad stack">
    ${plan.slots.map((s) => {
      const cur = s.recipeId ? store.recipe(s.recipeId) : null;
      return `<button class="btn block" data-slot="${esc(s.id)}" style="justify-content:space-between">
        <span>${esc(slotDateLabel(s))}</span>
        <span class="dim small truncate" style="max-width:45%">${cur ? esc(cur.title) : 'free'}</span></button>`;
    }).join('')}
  </div>`;
  sheet('Add to which day?', body, {
    onMount(root, close) {
      on(root, 'click', '[data-slot]', (e, t) => {
        const s = plan.slots.find((x) => x.id === t.dataset.slot);
        s.recipeId = recipe.id; s.title = recipe.title; s.servings = servings || s.servings; s.reasons = [];
        store.savePlan(plan);
        close();
        toast('Added to ' + slotDateLabel(s), 'ok');
      });
    },
  });
}
