// ---------------------------------------------------------------------------
// views/detail.js — one recipe: scale it, rate it, lighten it, cook it
// ---------------------------------------------------------------------------
import store, { FREQUENCIES, VERDICTS, verdictOf, ageOf as storeAgeOf } from '../store.js';
import { el, on, artHtml, artStyle, toast, sheet, confirmSheet, copyText, $ } from '../ui.js';
import { esc, fmtAmount, fmtQty, fmtMinutes, totalMinutes, pctDelta, relTime, recipeArt } from '../util.js';
import { healthify, countPossibleSwaps } from '../healthify.js';
import { similarTo } from '../suggest.js';
import { openCookMode } from './cook.js';
import { addRecipeToList } from './shop.js';
import { addRecipeToPlan } from './plan.js';
import { openEditSheet } from './import.js';
import { hostOf } from '../parse.js';

export default function renderDetail(r) {
  const nav = window.__recimeNav;
  const root = el(`<div class="screen"></div>`);
  const scale = r.__scale || r.servings || 4;
  const factor = scale / (r.servings || 4);

  // --- hero ----------------------------------------------------------------
  root.appendChild(el(`<div class="hero" style="${heroStyle(r)}">
    ${r.image
      ? `<span class="artemoji">${heroEmoji(r)}</span><img src="${esc(r.image)}" alt="" decoding="async" onerror="this.remove()">`
      : heroEmoji(r)}
    <button class="back" data-a="back" aria-label="Back">‹</button>
    <div class="acts">
      <button data-a="fav" aria-label="Favorite">${r.favorite ? '❤️' : '🤍'}</button>
      <button data-a="more" aria-label="More">⋯</button>
    </div>
  </div>`));

  // --- title block ---------------------------------------------------------
  const freq = FREQUENCIES.find((x) => x.id === r.frequency);
  root.appendChild(el(`<div class="pad">
    <h1 style="margin:0 0 6px;font-size:25px;letter-spacing:-.6px;line-height:1.2">${esc(r.title)}</h1>
    ${r.description ? `<p class="muted" style="margin:0 0 10px;font-size:14.5px;line-height:1.5">${esc(r.description)}</p>` : ''}
    <div class="chips wrap" style="padding:0;gap:6px;margin-bottom:12px">
      ${r.cuisine ? `<span class="tag">${esc(r.cuisine)}</span>` : ''}
      ${totalMinutes(r) ? `<span class="tag">⏱ ${fmtMinutes(totalMinutes(r))}</span>` : ''}
      <span class="tag">${esc(r.mealType)}</span>
      ${freq ? `<span class="tag gold">${freq.emoji} ${esc(freq.label)}</span>` : ''}
      ${(r.tags || []).map((t) => `<span class="tag ${t === 'healthy-remix' ? 'accent' : ''}">${esc(t.replace(/-/g, ' '))}</span>`).join('')}
    </div>
    <div class="row-between">
      <div class="ratebar" data-rate>
        ${[1, 2, 3, 4, 5].map((n) => `<button class="${(r.rating || 0) >= n ? 'on' : ''}" data-star="${n}">★</button>`).join('')}
      </div>
      <button class="btn primary" data-a="cook">▶ Start cooking</button>
    </div>
    ${r.cookedCount ? `<div class="tiny dim" style="margin-top:8px">Cooked ${r.cookedCount}×${r.lastCookedAt ? ' · last ' + relTime(r.lastCookedAt) : ''}</div>` : ''}
  </div>`));

  if (r.sharedFrom) {
    root.appendChild(el(`<div class="banner info">\ud83d\udc65 Shared with you${r.sharedFrom.by ? ' by ' + esc(r.sharedFrom.by) : ''}${r.sharedFrom.circleName ? ' in ' + esc(r.sharedFrom.circleName) : ''}. Rate it, plan it and shop it like any other \u2014 your changes stay yours.</div>`));
  } else if (r.private) {
    root.appendChild(el('<div class="banner warn">\ud83d\udd12 Private \u2014 kept out of your recipe circles.</div>'));
  }

  // --- healthy remix banner ------------------------------------------------
  if (r.healthyOf) {
    const orig = store.recipe(r.healthyOf);
    root.appendChild(el(`<div class="banner good">
      🌿 <b>Healthier remix.</b> ${orig ? `Based on <a href="#" data-goto="${esc(orig.id)}">${esc(orig.title)}</a>.` : ''}
      ${r.remixMeta?.savedPerServing ? ` Roughly ${r.remixMeta.savedPerServing.calories} fewer calories and ${r.remixMeta.savedPerServing.sodium}mg less sodium per serving (estimated).` : ''}
    </div>`));
    if (r.remixMeta?.swaps?.length) {
      root.appendChild(el(`<div class="pad" style="padding-top:0"><details>
        <summary class="small muted" style="cursor:pointer;padding:6px 0">What changed (${r.remixMeta.swaps.length} swap${r.remixMeta.swaps.length === 1 ? '' : 's'})</summary>
        <div class="stack" style="margin-top:9px">
          ${r.remixMeta.swaps.map((s) => `<div class="swapcard"><div class="from">${esc(s.from)}</div>
            <div class="to">→ ${esc(s.to)}</div><div class="why">${esc(s.why)}</div></div>`).join('')}
          ${(r.remixMeta.notes || []).map((n) => `<div class="swapcard"><div class="why" style="margin:0">💡 ${esc(n)}</div></div>`).join('')}
        </div></details></div>`));
    }
  } else {
    const swaps = countPossibleSwaps(r);
    const existing = r.remixId && store.recipe(r.remixId) && !store.recipe(r.remixId).deleted ? store.recipe(r.remixId) : null;
    root.appendChild(el(`<div class="pad" style="padding-top:0">
      ${existing
        ? `<button class="btn block" data-goto="${esc(existing.id)}">🌿 Open the healthier version</button>`
        : `<button class="btn block" data-a="healthify">🌿 Make a healthier version${swaps ? ` <span class="dim tiny">(${swaps} swap${swaps === 1 ? '' : 's'} available)</span>` : ''}</button>`}
    </div>`));
  }

  // --- feeding the whole table ---------------------------------------------
  if (r.familyStrategy || r.toddlerServing) {
    const kids = store.children();
    const toddler = kids.find((k) => {
      const a = k.dob || k.age != null ? (k.dob ? new Date().getFullYear() - Number(String(k.dob).slice(0, 4)) : Number(k.age)) : null;
      return a != null && a <= 3;
    });
    root.appendChild(el(`<div class="pad" style="padding-top:2px">
      <div class="sechead" style="padding:0 0 7px">Feeding everyone<span class="line"></span></div>
      ${r.familyStrategy ? `<div class="banner good" style="margin:0 0 8px">\ud83d\udc6a <b>One pot, everyone's plate.</b> ${esc(r.familyStrategy)}</div>` : ''}
      ${r.toddlerServing ? `<div class="banner ${toddler ? 'warn' : 'info'}" style="margin:0">\ud83c\udf7c <b>For ${toddler ? esc(toddler.name) : 'a toddler'}:</b> ${esc(r.toddlerServing)}</div>` : ''}
    </div>`));
  }

  // --- what the kids can actually do ---------------------------------------
  if (r.kidJobs && store.children().length) {
    root.appendChild(el(`<div class="pad" style="padding-top:2px">
      <div class="sechead" style="padding:0 0 7px">Jobs for the kids<span class="line"></span></div>
      <div class="banner info" style="margin:0">\ud83e\uddd2 ${esc(r.kidJobs)}</div>
    </div>`));
  }

  // --- who ate it, and how it's gone over time ------------------------------
  // Every recipe gets this, not only the family-table ones — knowing that Dale
  // loves something and you're lukewarm on it is just as useful.
  root.appendChild(el(`<div class="pad" style="padding-top:2px">
    <div class="sechead" style="padding:0 0 7px">Who ate it<span class="line"></span></div>
    ${familyBlock(r)}
  </div>`));

  // --- nutrition -----------------------------------------------------------
  const n = r.nutritionPerServing;
  if (n) {
    const base = r.healthyOf ? store.recipe(r.healthyOf)?.nutritionPerServing : null;
    root.appendChild(el(`<div class="pad" style="padding-top:2px">
      <div class="sechead" style="padding:0 0 7px">Per serving${n.estimated ? ' <span class="tiny dim" style="text-transform:none;letter-spacing:0">· estimated</span>' : ''}<span class="line"></span></div>
      <div class="nutri">
        ${nutriCell('cal', n.calories, base?.calories, '')}
        ${nutriCell('protein', n.protein, base?.protein, 'g', true)}
        ${nutriCell('carbs', n.carbs, base?.carbs, 'g')}
        ${nutriCell('fat', n.fat, base?.fat, 'g')}
        ${nutriCell('fiber', n.fiber, base?.fiber, 'g', true)}
        ${nutriCell('sodium', n.sodium, base?.sodium, 'mg')}
      </div>
      ${r.healthNotes ? `<div class="small muted" style="margin-top:10px">💚 ${esc(r.healthNotes)}</div>` : ''}
    </div>`));
  }

  // --- ingredients ---------------------------------------------------------
  const ing = el(`<div class="pad" style="padding-top:4px">
    <div class="row-between" style="margin-bottom:8px">
      <div class="sechead" style="padding:0">Ingredients<span class="line" style="display:none"></span></div>
      <div class="qtystep">
        <button data-a="serv-" aria-label="Fewer servings">−</button>
        <div class="v">${fmtQty(scale)} serving${scale === 1 ? '' : 's'}</div>
        <button data-a="serv+" aria-label="More servings">＋</button>
      </div>
    </div>
    <div>${(r.ingredients || []).map((i) => `
      <div class="ingrow ${i.swapped ? 'swapped' : ''}">
        <div class="q">${esc(fmtAmount((Number(i.quantity) || 0) * factor, i.unit))}</div>
        <div class="n">${esc(i.item)}${i.notes ? ` <span class="note">${esc(i.notes)}</span>` : ''}
        ${i.originalItem ? `<div class="tiny dim">was ${esc(i.originalItem)}</div>` : ''}</div>
      </div>`).join('')}</div>
    <div class="row" style="margin-top:14px;gap:9px">
      <button class="btn grow sm" data-a="tolist">🛒 Add to shopping list</button>
      <button class="btn grow sm" data-a="toplan">🗓️ Add to a day</button>
    </div>
  </div>`);
  root.appendChild(ing);

  // --- steps ---------------------------------------------------------------
  if ((r.steps || []).length) {
    root.appendChild(el(`<div class="pad" style="padding-top:4px">
      <div class="sechead" style="padding:0 0 4px">Method<span class="line"></span>
        ${(r.steps || []).some((x) => String(x).length > 220) ? '<button class="btn xs ghost" data-a="splitsteps">Split into steps</button>' : ''}
      </div>
      ${r.steps.map((s, i) => `<div class="steprow"><div class="n">${i + 1}</div><div class="t">${esc(s)}</div></div>`).join('')}
      <button class="btn primary block" style="margin-top:14px" data-a="cook">▶ Start cooking</button>
    </div>`));
  }

  // --- notes ---------------------------------------------------------------
  root.appendChild(el(`<div class="pad" style="padding-top:4px">
    <div class="sechead" style="padding:0 0 6px">Our notes<span class="line"></span></div>
    <textarea class="input" id="notes" placeholder="Doubled the garlic. Kids ate it. Use the big pan.">${esc(r.notes || '')}</textarea>
    ${r.sourceUrl ? `<div class="small dim" style="margin-top:9px">Source: <a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">${esc(hostOf(r.sourceUrl) || r.sourceUrl)}</a></div>`
      : (r.sourceInspiration ? `<div class="small dim" style="margin-top:9px">${esc(r.sourceInspiration)}</div>` : '')}
    ${attribution(r)}
    ${r.imageCredit?.credit ? `<div class="tiny dim" style="margin-top:5px">Photo: ${esc(r.imageCredit.credit)}${r.imageCredit.source ? ` · <a href="${esc(r.imageCredit.source)}" target="_blank" rel="noopener">${esc(r.imageCredit.license || 'source')}</a>` : ''}${r.imageCredit.match === 'close' ? ' · stock photo, not this exact dish' : ''}</div>` : ''}
    <div class="row" style="margin-top:10px;gap:9px">
      <button class="btn sm grow ghost" data-a="photo">📷 ${r.image ? 'Change photo' : 'Add a photo'}</button>
      ${!r.image ? '<button class="btn sm grow ghost" data-a="findphoto">🔎 Find one</button>' : ''}
      ${otherPeople().length ? `<button class="btn sm grow ghost" data-a="nudge">🔔 Tell someone</button>` : ''}
    </div>
  </div>`));

  // --- similar -------------------------------------------------------------
  const sim = similarTo(r, store.allRecipes(), 6);
  if (sim.length) {
    root.appendChild(el(`<div class="sechead">More like this<span class="line"></span></div>`));
    const g = el(`<div class="grid"></div>`);
    for (const s of sim) {
      g.appendChild(el(`<div class="rcard" data-goto="${esc(s.recipe.id)}">
        ${artHtml(s.recipe)}
        <div class="body"><div class="name">${esc(s.recipe.title)}</div>
        <div class="tiny dim truncate">${esc(s.shared.join(' · '))}</div></div></div>`));
    }
    root.appendChild(g);
  }

  // --- events --------------------------------------------------------------
  on(root, 'click', '[data-a="back"]', () => nav.closeDetail());
  on(root, 'click', '[data-goto]', (e, t) => { e.preventDefault(); nav.openRecipe(t.dataset.goto); });
  on(root, 'click', '[data-a="fav"]', () => store.toggleFavorite(r.id));
  on(root, 'click', '[data-star]', (e, t) => store.setRating(r.id, Number(t.dataset.star)));
  on(root, 'click', '[data-a="cook"]', () => openCookMode(r, scale));
  on(root, 'click', '[data-a="tolist"]', () => addRecipeToList(r, scale));
  on(root, 'click', '[data-a="toplan"]', () => addRecipeToPlan(r, scale));
  on(root, 'click', '[data-a="healthify"]', () => doHealthify(r));
  on(root, 'click', '[data-a="more"]', () => openMore(r));
  on(root, 'click', '[data-a="photo"]', () => pickPhoto(r));
  on(root, 'click', '[data-a="splitsteps"]', async () => {
    const { explodeStep } = await import('../parse.js');
    const next = (r.steps || []).flatMap(explodeStep);
    if (next.length === (r.steps || []).length) { toast('Nothing to split', 'err'); return; }
    store.updateRecipe(r.id, { steps: next });
    toast(`Split into ${next.length} steps`, 'ok');
    nav.render();
  });

  on(root, 'click', '[data-a="findphoto"]', async () => {
    toast('Looking for a photo…');
    const { findPhotos } = await import('../parse.js');
    const found = await findPhotos(r.title, store.settings);
    if (!found) { toast('Couldn\'t find one', 'err'); return; }
    store.updateRecipe(r.id, {
      image: found.photos[0].image,
      imageCredit: { credit: found.credit, license: found.license, source: found.photos[0].source, match: 'close' },
    });
    toast('Photo added', 'ok');
    nav.render();
  });
  on(root, 'click', '[data-a="whoate"]', () => openWhoAte(r.id));
  on(root, 'click', '[data-a="newsitting"]', () => openWhoAte(r.id, { fresh: true }));
  on(root, 'click', '[data-a="history"]', () => openHistory(r.id));
  on(root, 'click', '[data-a="nudge"]', () => openNudge(r));

  on(root, 'click', '[data-a="serv-"]', () => { r.__scale = Math.max(1, scale - 1); nav.render(); });
  on(root, 'click', '[data-a="serv+"]', () => { r.__scale = Math.min(24, scale + 1); nav.render(); });

  const notes = $('#notes', root);
  notes.addEventListener('blur', () => {
    if (notes.value !== (r.notes || '')) { store.updateRecipe(r.id, { notes: notes.value }); toast('Notes saved'); }
  });

  return root;
}

/**
 * Who ate it — this time, and every time before. The running record is the
 * point: "Jett has eaten this twice out of three" is useful in a way that
 * "Jett didn't eat it" never is.
 */
function familyBlock(r) {
  const fam = store.familyVerdict(r);
  const rec = store.familyRecord(r);
  if (!fam || !rec) {
    return `<button class="btn sm block ghost" style="margin-top:10px" data-a="whoate">\ud83c\udf7d\ufe0f Who ate this?</button>`;
  }

  const chips = fam.rows.map((x) => `<span class="tag">${x.v.emoji} ${esc(x.person.name)}</span>`).join(' ');
  const headline = fam.wholeFamily
    ? '\u2705 <b>Everyone ate this one.</b>'
    : fam.kidsCount && !fam.kidsAte
    ? '\u26a0\ufe0f <b>The kids were not sold.</b>'
    : `<b>${fam.happy} of ${fam.total} ate it.</b>`;

  const when = fam.times > 1
    ? `<span class="tiny dim"> \u00b7 last time, ${esc(relTime(fam.at))}</span>`
    : `<span class="tiny dim"> \u00b7 ${esc(relTime(fam.at))}</span>`;

  return `<div class="banner ${fam.wholeFamily ? 'good' : fam.score > 0 ? 'info' : 'warn'}" style="margin:10px 0 0">
      ${headline}${when}<div style="margin-top:6px">${chips}</div>
      <div class="row" style="gap:7px;margin-top:9px">
        <button class="btn xs" data-a="whoate">Update last time</button>
        <button class="btn xs soft" data-a="newsitting">\uff0b Made it again</button>
      </div>
    </div>
    ${trackRecord(r, rec)}`;
}

/**
 * The long view. Only worth drawing once there's more than one night on
 * record — before that the banner above already says everything.
 */
function trackRecord(r, rec) {
  if (rec.times < 2) return '';
  const rows = rec.rows.filter((x) => x.served > 0);
  if (!rows.length) return '';

  const bar = (x) => x.marks.map((m) => {
    const good = m.v.score > 0;
    const bg = m.v.id === 'absent' ? 'var(--bg-4)'
      : good ? 'var(--accent)'
      : m.v.id === 'picked' ? 'var(--warn)' : 'var(--danger)';
    return `<span title="${esc(m.v.label)} \u2014 ${esc(relTime(m.at))}"
      style="flex:1;min-width:9px;height:9px;border-radius:3px;background:${bg};opacity:${m.v.id === 'absent' ? '.35' : '.92'}"></span>`;
  }).join('');

  const trendNote = (x) => x.trend > 0
    ? '<span class="tiny" style="color:var(--accent-2)"> \u2197 coming round to it</span>'
    : x.trend < 0 ? '<span class="tiny" style="color:var(--warn)"> \u2198 going off it</span>' : '';

  return `<div class="card" style="margin:10px 0 0">
    <div class="lrow" style="align-items:center">
      <div class="grow"><div style="font-weight:700">Track record</div>
        <div class="tiny dim">Made ${rec.times} times \u00b7 first ${esc(relTime(rec.firstAt))}</div></div>
      ${rec.reliable ? '<span class="tag accent">\ud83c\udfaf Reliable</span>' : ''}
    </div>
    <div class="pad" style="padding-top:2px">
      ${rows.map((x) => `<div style="margin-bottom:11px">
        <div class="row-between" style="margin-bottom:5px">
          <span style="font-weight:650;font-size:14px">${esc(x.person.name)}${trendNote(x)}</span>
          <span class="tiny ${x.ate === x.served ? '' : 'dim'}" style="${x.ate === x.served ? 'color:var(--accent-2);font-weight:700' : ''}">
            ate it ${x.ate} of ${x.served}</span>
        </div>
        <div class="row" style="gap:3px">${bar(x)}</div>
      </div>`).join('')}
      <button class="btn xs ghost block" data-a="history">See every time we made it</button>
    </div>
  </div>`;
}

/** Every sitting, oldest first, each one editable. */
function openHistory(recipeId) {
  const r = store.recipe(recipeId);
  if (!r) return;
  const people = store.people();
  const sittings = store.sittings(recipeId).slice().reverse();

  const body = `<div class="pad stack">
    ${sittings.length ? sittings.map((sit) => {
      const marks = people
        .map((p) => ({ p, v: verdictOf(sit.verdicts[p.id]) }))
        .filter((x) => x.v);
      return `<div class="card pad" style="margin:0">
        <div class="row-between">
          <b>${esc(new Date(sit.at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }))}</b>
          <span class="tiny dim">${esc(relTime(sit.at))}</span>
        </div>
        <div style="margin-top:7px">${marks.map((x) => `<span class="tag">${x.v.emoji} ${esc(x.p.name)}</span>`).join(' ') || '<span class="dim small">Nobody logged</span>'}</div>
        ${sit.note ? `<div class="small muted" style="margin-top:7px">${esc(sit.note)}</div>` : ''}
        <div class="row" style="gap:7px;margin-top:9px">
          <button class="btn xs" data-edit="${esc(sit.id)}">Edit</button>
          <button class="btn xs ghost danger" data-del="${esc(sit.id)}">Remove</button>
        </div>
      </div>`;
    }).join('') : '<p class="small muted" style="margin:0">Nothing logged yet.</p>'}
    <button class="btn primary block" data-a="add">\uff0b Log another time we made this</button>
  </div>`;

  sheet('Every time we made this', body, {
    onMount(root, close) {
      on(root, 'click', '[data-edit]', (e, t) => { close(); openWhoAte(recipeId, { sittingId: t.dataset.edit }); });
      on(root, 'click', '[data-del]', (e, t) => {
        store.deleteSitting(recipeId, t.dataset.del);
        close(); window.__recimeNav.render();
      });
      on(root, 'click', '[data-a="add"]', () => { close(); openWhoAte(recipeId, { fresh: true }); });
    },
  });
}

/**
 * Log one sitting. Opens on tonight's if there is one, otherwise starts a new
 * one — so tapping it after dinner does the obvious thing without asking.
 */
export function openWhoAte(recipeId, { onDone, sittingId, fresh } = {}) {
  const r = store.recipe(recipeId);
  if (!r) return;
  const people = store.people();

  let sitting = sittingId
    ? store.sittings(recipeId).find((x) => x.id === sittingId)
    : (fresh ? null : store.openSitting(recipeId));
  let liveId = sitting ? sitting.id : null;
  const draft = { ...(sitting ? sitting.verdicts : {}) };
  const priorCount = store.sittings(recipeId).length;

  const heading = sitting
    ? `Editing ${new Date(sitting.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    : priorCount ? `Time ${priorCount + 1} we've made this` : 'The first time we made this';

  const body = `<div class="pad stack">
    <p class="small muted" style="margin:0">${esc(heading)}. Tap how each person got on with it \u2014 this is what teaches the app which meals work for everyone at once, and it keeps every night rather than overwriting the last one.</p>
    ${people.map((p) => `<div>
      <div class="row-between" style="margin-bottom:6px">
        <span style="font-weight:650">${esc(p.name)}</span>
        <span class="tiny dim">${p.type === 'child' && ageOfSafe(p) != null ? ageOfSafe(p) : ''}</span>
      </div>
      <div class="chips wrap" style="padding:0" data-vfor="${esc(p.id)}">
        ${VERDICTS.map((v) => `<button class="chip sm ${draft[p.id] === v.id ? 'on' : ''}" data-v="${v.id}">${v.emoji} ${v.label}</button>`).join('')}
      </div>
    </div>`).join('')}
    <div class="field"><label>Anything worth remembering? (optional)</label>
      <input class="input" id="sitnote" value="${esc(sitting?.note || '')}" placeholder="e.g. less spice next time, Jett had seconds" autocomplete="off"></div>
    <button class="btn primary block" data-a="done">Save</button>
  </div>`;

  sheet('How did it go?', body, {
    onMount(root, close) {
      const commit = () => {
        const note = $('#sitnote', root)?.value || '';
        if (!Object.keys(draft).length && !liveId) return;
        const saved = store.recordSitting(recipeId, draft, liveId ? { id: liveId, note } : { note });
        if (saved) liveId = saved.id;
      };
      on(root, 'click', '[data-vfor] .chip', (e, t) => {
        const wrap = t.closest('[data-vfor]');
        const already = t.classList.contains('on');
        for (const c of wrap.querySelectorAll('.chip')) c.classList.remove('on');
        if (already) delete draft[wrap.dataset.vfor];
        else { t.classList.add('on'); draft[wrap.dataset.vfor] = t.dataset.v; }
        commit();
      });
      on(root, 'click', '[data-a="done"]', () => {
        commit();
        close();
        if (onDone) onDone();
        window.__recimeNav.render();
      });
    },
  });
}

function ageOfSafe(p) {
  try { return storeAgeOf(p); } catch (e) { return p.age != null ? p.age : null; }
}

/**
 * Let them shoot the dish themselves. Resized hard before storing — a raw
 * phone photo would blow past the browser's storage budget in a dozen recipes.
 */
function pickPhoto(r) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 900;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      let data = c.toDataURL('image/jpeg', 0.72);
      if (data.length > 300000) data = c.toDataURL('image/jpeg', 0.55);
      store.updateRecipe(r.id, { image: data, imageCredit: { credit: 'Our photo', license: '', source: '', match: 'exact' } });
      toast('Photo saved', 'ok');
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast('Could not read that image', 'err'); };
    img.src = url;
  };
  input.click();
}

function attribution(r) {
  const bits = [];
  if (r.sharedFrom?.by) bits.push(`Shared by ${esc(r.sharedFrom.by)}`);
  else if (r.addedBy) bits.push(`Added by ${esc(r.addedBy)}`);
  if (r.createdAt && !r.seed) bits.push(relTime(r.createdAt));
  return bits.length ? `<div class="tiny dim" style="margin-top:9px">${bits.join(' \u00b7 ')}</div>` : '';
}

function otherPeople() {
  const me = (store.settings.displayName || '').toLowerCase();
  return store.people().filter((p) => p.type === 'adult' && p.name.toLowerCase() !== me);
}

/** Point someone at a recipe. Lands in their app, and pings them if they've allowed it. */
function openNudge(r) {
  const people = otherPeople();
  sheet('Tell someone about this', `<div class="pad stack">
    <p class="small muted" style="margin:0">They'll see it next time they open the app \u2014 and get a notification straight away if they've turned those on.</p>
    <div class="field"><label>Who?</label>
      <div class="chips wrap" style="padding:0" id="nwho">
        ${people.map((p, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-w="${esc(p.name)}">${esc(p.name)}</button>`).join('')}
      </div></div>
    <div class="field"><label>Say something (optional)</label>
      <input class="input" id="nnote" placeholder="this looks like a Thursday" autocomplete="off"></div>
    <button class="btn primary block" data-a="send">Send it</button>
  </div>`, {
    onMount(root, close) {
      let who = people[0]?.name || '';
      on(root, 'click', '#nwho .chip', (e, t) => {
        who = t.dataset.w;
        for (const c of root.querySelectorAll('#nwho .chip')) c.classList.toggle('on', c.dataset.w === who);
      });
      on(root, 'click', '[data-a="send"]', () => {
        store.sendNudge(r.id, who, $('#nnote', root).value.trim());
        close();
        toast(store.settings.syncUrl ? `Sent to ${who}` : `Saved \u2014 turn on sync so ${who} actually gets it`, store.settings.syncUrl ? 'ok' : 'err');
      });
    },
  });
}

function nutriCell(key, val, baseVal, unit, higherIsBetter = false) {
  if (val == null) return `<div><div class="v">—</div><div class="k">${key}</div></div>`;
  let delta = '';
  if (baseVal != null && baseVal !== val) {
    const p = pctDelta(baseVal, val);
    const good = higherIsBetter ? p > 0 : p < 0;
    delta = `<div class="${good ? 'down' : 'up'}">${p > 0 ? '+' : ''}${p}%</div>`;
  }
  return `<div><div class="v">${val}${unit}</div><div class="k">${key}</div>${delta}</div>`;
}

function heroStyle(r) { return artStyle(r); }
function heroEmoji(r) { return recipeArt(r).emoji; }

// ---------------------------------------------------------------------------

function doHealthify(r) {
  const { recipe, swaps, notes } = healthify(r);
  const nav = window.__recimeNav;
  const body = `
    <div class="pad stack">
      ${swaps.length
        ? `<div class="small muted">Here's what I'd change. Nothing is saved until you tap Save.</div>
           <div class="stack">${swaps.map((s) => `<div class="swapcard">
             <div class="from">${esc(s.fromItem)}</div>
             <div class="to">→ ${esc(s.to)}${s.toQty !== s.fromQty ? ` <span class="tiny dim">(${fmtQty(s.fromQty)} → ${fmtQty(s.toQty)} ${esc(s.fromUnit || '')})</span>` : ''}</div>
             <div class="why">${esc(s.why)}</div></div>`).join('')}</div>`
        : `<div class="banner good" style="margin:0">This recipe is already pretty clean — no ingredient swaps stood out.</div>`}
      ${notes.length ? `<div><div class="small muted" style="margin-bottom:7px">Technique notes</div>
        <div class="stack">${notes.map((n) => `<div class="swapcard"><div class="why" style="margin:0">💡 ${esc(n)}</div></div>`).join('')}</div></div>` : ''}
      ${recipe.nutritionPerServing && r.nutritionPerServing ? `
        <div><div class="small muted" style="margin-bottom:7px">Estimated per serving</div>
        <div class="nutri">
          ${nutriCell('cal', recipe.nutritionPerServing.calories, r.nutritionPerServing.calories, '')}
          ${nutriCell('fat', recipe.nutritionPerServing.fat, r.nutritionPerServing.fat, 'g')}
          ${nutriCell('sodium', recipe.nutritionPerServing.sodium, r.nutritionPerServing.sodium, 'mg')}
        </div>
        <div class="tiny dim" style="margin-top:6px">Estimates from the swaps above, not lab values.</div></div>` : ''}
      <div class="row">
        <button class="btn grow" data-a="cancel">Cancel</button>
        <button class="btn grow primary" data-a="save">Save as new recipe</button>
      </div>
    </div>`;

  sheet('🌿 Healthier version', body, {
    onMount(root, close) {
      on(root, 'click', '[data-a="cancel"]', close);
      on(root, 'click', '[data-a="save"]', () => {
        const saved = store.addRecipe(recipe);
        store.updateRecipe(r.id, { remixId: saved.id });
        close();
        toast('Saved — both versions are in your library', 'ok');
        nav.openRecipe(saved.id);
      });
    },
  });
}

function openMore(r) {
  sheet(r.title, `<div class="pad stack">
    <button class="btn block" data-a="edit">✏️ Edit recipe</button>
    <button class="btn block" data-a="dup">📄 Duplicate</button>
    <button class="btn block" data-a="copy">📋 Copy as text</button>
    <button class="btn block" data-a="share">🔗 Share</button>
    <button class="btn block" data-a="print">🖨️ Print</button>
    ${store.circles().length && !r.sharedFrom ? `<button class="btn block" data-a="private">${r.private ? '👥 Share this with my circles' : '🔒 Keep this one private'}</button>` : ''}
    <div class="divider"></div>
    <div class="small muted">How often?</div>
    <div class="chips wrap" style="padding:0">
      ${FREQUENCIES.map((f) => `<button class="chip ${r.frequency === f.id ? 'on' : ''}" data-fq="${f.id}">${f.emoji} ${f.label}</button>`).join('')}
    </div>
    <div class="divider"></div>
    <button class="btn block danger" data-a="del">🗑 Delete recipe</button>
  </div>`, {
    onMount(root, close) {
      on(root, 'click', '[data-fq]', (e, t) => { store.setFrequency(r.id, t.dataset.fq); close(); toast('Saved'); });
      on(root, 'click', '[data-a="edit"]', () => { close(); openEditSheet(r); });
      on(root, 'click', '[data-a="dup"]', () => {
        const copy = { ...r, id: undefined, title: r.title + ' (copy)', seed: false, favorite: false, rating: 0, cookedCount: 0 };
        const saved = store.addRecipe(copy); close(); window.__recimeNav.openRecipe(saved.id);
      });
      on(root, 'click', '[data-a="copy"]', async () => {
        await copyText(recipeAsText(r)); close(); toast('Copied', 'ok');
      });
      on(root, 'click', '[data-a="share"]', async () => {
        close();
        const text = recipeAsText(r);
        if (navigator.share) { try { await navigator.share({ title: r.title, text }); } catch (e) { /* canceled */ } }
        else { await copyText(text); toast('Copied to clipboard', 'ok'); }
      });
      on(root, 'click', '[data-a="print"]', () => { close(); setTimeout(() => window.print(), 200); });
      on(root, 'click', '[data-a="private"]', () => {
        store.updateRecipe(r.id, { private: !r.private });
        close(); toast(r.private ? 'Shared with your circles' : 'Kept private');
      });
      on(root, 'click', '[data-a="del"]', async () => {
        close();
        if (await confirmSheet('Delete recipe?', `"${r.title}" will be removed from your library.`, { danger: true, okLabel: 'Delete' })) {
          store.deleteRecipe(r.id);
          window.__recimeNav.closeDetail();
          toast('Deleted');
        }
      });
    },
  });
}

export function recipeAsText(r) {
  const lines = [r.title, ''];
  if (r.description) lines.push(r.description, '');
  lines.push(`Serves ${r.servings} · ${fmtMinutes(totalMinutes(r))}`, '', 'INGREDIENTS');
  for (const i of r.ingredients || []) lines.push(`• ${fmtAmount(i.quantity, i.unit)} ${i.item}${i.notes ? ', ' + i.notes : ''}`);
  lines.push('', 'METHOD');
  (r.steps || []).forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  if (r.notes) lines.push('', 'NOTES', r.notes);
  if (r.sourceUrl) lines.push('', r.sourceUrl);
  return lines.join('\n');
}
