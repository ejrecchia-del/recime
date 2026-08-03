// ---------------------------------------------------------------------------
// views/recipes.js — the library: search, filter, favorites, suggestions
// ---------------------------------------------------------------------------
import store, { FREQUENCIES } from '../store.js';
import { el, on, artHtml, starsHtml, toast, emptyState, longPress, sheet, $ } from '../ui.js';
import { esc, fmtMinutes, totalMinutes, sortBy, uniq } from '../util.js';
import { suggestions, profileSummary } from '../suggest.js';
import { openImportSheet } from './import.js';

const SORTS = [
  { id: 'recent', label: 'Recently added' },
  { id: 'rating', label: 'Top rated' },
  { id: 'az', label: 'A – Z' },
  { id: 'quick', label: 'Quickest' },
  { id: 'cooked', label: 'Most cooked' },
];

const QUICK_TAGS = ['make-with-kids', 'dessert', 'popsicle', 'no-bake', 'component-meal', '30-minute', 'kid-friendly', 'high-protein', 'vegetarian', 'sheet-pan', 'one-pot', 'grill', 'soup', 'salad', 'pasta', 'lunchbox', 'low-carb', 'gluten-free', 'meal-prep', 'slow-cooker', 'instant-pot', 'freezer-friendly', 'comfort-food', 'healthy-remix'];

export default function renderRecipes() {
  const { app, openRecipe } = window.__recimeNav;
  const f = app.filters;
  const all = store.allRecipes();

  const root = el(`<div class="screen"></div>`);

  // --- header --------------------------------------------------------------
  const favCount = all.filter((r) => r.favorite).length;
  const weeklyCount = all.filter((r) => r.frequency === 'every-week').length;
  const familyCount = all.filter((r) => store.everyoneAte(r)).length;
  const sharedCount = all.filter((r) => r.sharedFrom).length;

  const head = el(`<div class="topbar">
    <div class="topbar-row">
      <h1>Recipes</h1>
      <button class="btn sm ghost" data-a="sort" title="Sort">⇅</button>
      <button class="btn sm primary" data-a="add">＋ Add</button>
    </div>
    <div class="sub">${all.length} saved · ${favCount} favorite${favCount === 1 ? '' : 's'}</div>
    <div style="margin-top:10px" class="search">
      <span class="dim">🔍</span>
      <input id="q" placeholder="Search recipes or ingredients" value="${esc(f.q)}" autocomplete="off" enterkeyhint="search">
      ${f.q ? '<button data-a="clearq" class="dim" style="font-size:17px;padding:0 2px">✕</button>' : ''}
    </div>
  </div>`);
  root.appendChild(head);

  // --- filter chips --------------------------------------------------------
  const chipRow = el(`<div class="chips" style="padding-top:10px">
    <button class="chip ${f.favorites ? 'on gold' : ''}" data-f="fav">★ Favorites${favCount ? ` <span class="tiny">${favCount}</span>` : ''}</button>
    <button class="chip ${f.freq === 'every-week' ? 'on' : ''}" data-f="weekly">🔁 Every week${weeklyCount ? ` <span class="tiny">${weeklyCount}</span>` : ''}</button>
    ${store.children().length ? `<button class="chip ${f.family ? 'on' : ''}" data-f="family">👪 Everyone ate it${familyCount ? ` <span class="tiny">${familyCount}</span>` : ''}</button>` : ''}
    ${sharedCount ? `<button class="chip ${f.shared ? 'on' : ''}" data-f="shared">👥 Shared with us <span class="tiny">${sharedCount}</span></button>` : ''}
    ${['dinner', 'breakfast', 'lunch', 'side', 'snack', 'dessert'].map((m) =>
      `<button class="chip ${f.meal === m ? 'on' : ''}" data-f="meal:${m}">${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}
  </div>`);
  root.appendChild(chipRow);

  // Someone pointed you at a recipe
  for (const n of store.inboxNudges().slice(0, 3)) {
    const nr = store.recipe(n.recipeId);
    if (!nr) continue;
    root.appendChild(el(`<div class="banner info" data-nudge="${esc(n.id)}">
      \ud83d\udd14 <b>${esc(n.from)}</b> thinks you'll like <a href="#" data-goto="${esc(nr.id)}">${esc(nr.title)}</a>${n.note ? ` \u2014 \u201c${esc(n.note)}\u201d` : ''}
      <button class="btn xs" style="margin-left:8px" data-dismiss="${esc(n.id)}">Got it</button></div>`));
  }

  // Recipes added by someone else since you last looked
  const fresh = store.newRecipes();
  if (fresh.length && !filtersActive(f)) {
    root.appendChild(el(`<div class="sechead">New since you last looked
      <span class="line"></span><button class="chip sm plain" data-a="seen">Mark seen</button></div>`));
    const g = el('<div class="grid"></div>');
    for (const nr of fresh.slice(0, 8)) g.appendChild(card(nr, byLine(nr)));
    root.appendChild(g);
  }

  const tagRow = el(`<div class="chips" style="padding-top:7px;padding-bottom:4px">
    ${QUICK_TAGS.map((t) => `<button class="chip sm ${f.tags.includes(t) ? 'on' : ''}" data-f="tag:${t}">${t.replace(/-/g, ' ')}</button>`).join('')}
  </div>`);
  root.appendChild(tagRow);

  // --- filtering -----------------------------------------------------------
  let list = all.slice();
  if (f.q) {
    const q = f.q.toLowerCase();
    list = list.filter((r) =>
      r.title.toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.cuisine || '').toLowerCase().includes(q) ||
      (r.tags || []).some((t) => t.includes(q)) ||
      (r.ingredients || []).some((i) => i.item.toLowerCase().includes(q)));
  }
  if (f.favorites) list = list.filter((r) => r.favorite);
  if (f.family) list = list.filter((r) => store.everyoneAte(r));
  if (f.shared) list = list.filter((r) => r.sharedFrom);
  if (f.freq) list = list.filter((r) => r.frequency === f.freq);
  if (f.meal) list = list.filter((r) => r.mealType === f.meal);
  if (f.tags.length) list = list.filter((r) => f.tags.every((t) => (r.tags || []).includes(t)));

  switch (f.sort) {
    case 'rating': list = sortBy(list, (r) => (r.rating || 0) * 10 + (r.favorite ? 1 : 0), -1); break;
    case 'az': list = sortBy(list, (r) => r.title.toLowerCase()); break;
    case 'quick': list = sortBy(list, (r) => totalMinutes(r) || 999); break;
    case 'cooked': list = sortBy(list, (r) => r.cookedCount || 0, -1); break;
    default: list = sortBy(list, (r) => r.createdAt || '', -1);
  }

  // --- results -------------------------------------------------------------
  const filtered = filtersActive(f);
  if (filtered) {
    root.appendChild(el(`<div class="sechead">${list.length} result${list.length === 1 ? '' : 's'}<span class="line"></span>
      <button class="chip sm plain" data-a="clearall">Clear</button></div>`));
  }

  if (!list.length) {
    root.appendChild(el(filtered
      ? emptyState('🔍', 'Nothing matches', 'Try removing a filter or searching for an ingredient instead.',
          '<button class="btn sm" data-a="clearall">Clear filters</button>')
      : emptyState('📖', 'No recipes yet', 'Add one from a link, paste it in, or type it out.',
          '<button class="btn primary sm" data-a="add">Add a recipe</button>')));
  } else {
    const grid = el(`<div class="grid"></div>`);
    for (const r of list) grid.appendChild(card(r));
    root.appendChild(grid);
  }

  // --- suggestions ---------------------------------------------------------
  if (!filtered) {
    const sugg = suggestions(all, { limit: 6 });
    if (sugg.length) {
      const why = profileSummary(all);
      root.appendChild(el(`<div class="sechead">Because you liked<span class="line"></span></div>`));
      if (why) root.appendChild(el(`<div class="pad-x small dim" style="margin-bottom:2px">${esc(why)}</div>`));
      const grid = el(`<div class="grid"></div>`);
      for (const s of sugg) grid.appendChild(card(s.recipe, s.reasons.join(' · ')));
      root.appendChild(grid);
    }
  }

  root.appendChild(el(`<button class="fab" data-a="add" aria-label="Add recipe">＋</button>`));

  // --- events --------------------------------------------------------------
  const qEl = $('#q', root);
  qEl.addEventListener('input', () => {
    f.q = qEl.value;
    clearTimeout(qEl._t);
    qEl._t = setTimeout(() => { window.__recimeNav.render(); setTimeout(() => { const n = $('#q'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 0); }, 300);
  });

  on(root, 'click', '[data-f]', (e, t) => {
    const v = t.dataset.f;
    if (v === 'fav') f.favorites = !f.favorites;
    else if (v === 'family') f.family = !f.family;
    else if (v === 'shared') f.shared = !f.shared;
    else if (v === 'weekly') f.freq = f.freq === 'every-week' ? '' : 'every-week';
    else if (v.startsWith('meal:')) { const m = v.slice(5); f.meal = f.meal === m ? '' : m; }
    else if (v.startsWith('tag:')) {
      const tg = v.slice(4);
      f.tags = f.tags.includes(tg) ? f.tags.filter((x) => x !== tg) : [...f.tags, tg];
    }
    window.__recimeNav.render();
  });

  on(root, 'click', '[data-a="clearall"]', () => {
    Object.assign(f, { q: '', favorites: false, family: false, shared: false, tags: [], meal: '', freq: '' });
    window.__recimeNav.render();
  });
  on(root, 'click', '[data-a="clearq"]', () => { f.q = ''; window.__recimeNav.render(); });
  on(root, 'click', '[data-a="add"]', () => openImportSheet({}));
  on(root, 'click', '[data-a="sort"]', () => openSort(f));
  on(root, 'click', '[data-a="seen"]', () => { store.markRecipesSeen(); window.__recimeNav.render(); });
  on(root, 'click', '[data-dismiss]', (e, t) => { e.stopPropagation(); store.dismissNudge(t.dataset.dismiss); });
  on(root, 'click', '[data-goto]', (e, t) => { e.preventDefault(); openRecipe(t.dataset.goto); });

  on(root, 'click', '[data-open]', (e, t) => {
    if (e.target.closest('[data-fav]')) return;
    openRecipe(t.dataset.open);
  });
  on(root, 'click', '[data-fav]', (e, t) => {
    e.stopPropagation();
    store.toggleFavorite(t.dataset.fav);
    if (navigator.vibrate) navigator.vibrate(8);
  });

  longPress(root, '[data-open]', (e, t) => openQuickActions(t.dataset.open));

  return root;
}

/** A clean-plate badge is more useful at a glance than anything else. */
function filtersActive(f) {
  return !!(f.q || f.favorites || f.family || f.shared || f.freq || f.meal || f.tags.length);
}

function byLine(r) {
  if (r.sharedFrom?.by) return 'shared by ' + r.sharedFrom.by;
  if (r.addedBy) return 'added by ' + r.addedBy;
  return '';
}

function famBadge(r) {
  if (r.sharedFrom) return `<div class="corner">👥 ${esc((r.sharedFrom.by || 'shared').split(' ')[0])}</div>`;
  if (r.private) return '<div class="corner">🔒</div>';
  const fam = store.familyVerdict(r);
  if (!fam) return '';
  const times = fam.times > 1 ? ` \u00d7${fam.times}` : '';
  if (store.everyoneAte(r)) return `<div class="corner" style="background:rgba(47,158,107,.85)">\ud83d\udc6a all ate${times}</div>`;
  if (fam.kidsCount && !fam.kidsAte) return '<div class="corner" style="background:rgba(176,74,74,.8)">kids passed</div>';
  return '';
}

function card(r, reason = '') {
  const mins = totalMinutes(r);
  const freq = FREQUENCIES.find((x) => x.id === r.frequency);
  return el(`<div class="rcard" data-open="${esc(r.id)}">
    ${artHtml(r)}
    <button class="fav" data-fav="${esc(r.id)}" aria-label="Favorite">${r.favorite ? '❤️' : '🤍'}</button>
    ${famBadge(r) || (freq ? `<div class="corner">${freq.emoji}</div>` : (r.healthyOf ? '<div class="corner">🌿</div>' : ''))}
    <div class="body">
      <div class="name">${esc(r.title)}</div>
      <div class="meta">
        ${mins ? `<span>⏱ ${fmtMinutes(mins)}</span>` : ''}
        ${r.nutritionPerServing?.calories ? `<span>${r.nutritionPerServing.calories} cal</span>` : ''}
      </div>
      ${r.rating ? `<div>${starsHtml(r.rating)}</div>` : ''}
      ${reason ? `<div class="tiny dim truncate">${esc(reason)}</div>` : ''}
      ${!reason && r.addedBy && !r.seed ? `<div class="tiny dim truncate">by ${esc(r.addedBy)}</div>` : ''}
    </div>
  </div>`);
}

function openSort(f) {
  sheet('Sort by', `<div class="pad stack">
    ${SORTS.map((s) => `<button class="btn block ${f.sort === s.id ? 'primary' : ''}" data-s="${s.id}">${s.label}</button>`).join('')}
  </div>`, {
    onMount(root, close) {
      on(root, 'click', '[data-s]', (e, t) => { f.sort = t.dataset.s; close(); window.__recimeNav.render(); });
    },
  });
}

export function openQuickActions(id) {
  const r = store.recipe(id);
  if (!r) return;
  sheet(r.title, `<div class="pad stack">
    <div>
      <div class="small muted" style="margin-bottom:7px">How often do you want this?</div>
      <div class="chips wrap" style="padding:0">
        ${FREQUENCIES.map((fq) => `<button class="chip ${r.frequency === fq.id ? 'on' : ''}" data-fq="${fq.id}">${fq.emoji} ${fq.label}</button>`).join('')}
      </div>
    </div>
    <div>
      <div class="small muted" style="margin-bottom:7px">Rating</div>
      <div class="ratebar" data-rate>
        ${[1, 2, 3, 4, 5].map((n) => `<button class="${r.rating >= n ? 'on' : ''}" data-star="${n}">★</button>`).join('')}
      </div>
    </div>
    <button class="btn block" data-a="fav">${r.favorite ? '💔 Remove from favorites' : '❤️ Add to favorites'}</button>
  </div>`, {
    onMount(root, close) {
      on(root, 'click', '[data-fq]', (e, t) => { store.setFrequency(id, t.dataset.fq); close(); toast('Saved'); });
      on(root, 'click', '[data-star]', (e, t) => { store.setRating(id, Number(t.dataset.star)); close(); toast('Rated'); });
      on(root, 'click', '[data-a="fav"]', () => { store.toggleFavorite(id); close(); });
    },
  });
}
