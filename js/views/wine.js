// ---------------------------------------------------------------------------
// views/wine.js — the cellar
//
// Every bottle you've bought, what you thought of it, and which ones ride
// along on every order. Same machinery as the recipe library on purpose: a
// star rating, a favourite, and a frequency where "Every order" does for wine
// what "Eat every week!" does for dinner.
// ---------------------------------------------------------------------------
import store, { WINE_FREQUENCIES, wineFrequency } from '../store.js';
import { el, on, toast, sheet, confirmSheet, emptyState, starsHtml, $ } from '../ui.js';
import { esc, relTime } from '../util.js';
import { STYLES, styleOf, planWine, bodyWord, BODY_BANDS, ABV_BANDS, abvNumber, caseMath } from '../wine.js';
import { openWine as openWeekWine } from './plan.js';

const COLOURS = [
  { id: '', label: 'All' },
  { id: 'red', label: 'Red', emoji: '🍷' },
  { id: 'white', label: 'White', emoji: '🥂' },
  { id: 'rose', label: 'Rosé', emoji: '🌸' },
  { id: 'sparkling', label: 'Sparkling', emoji: '🍾' },
  { id: 'sweet', label: 'Dessert', emoji: '🍯' },
];

const filters = { colour: '', freq: '', favorites: false, q: '', body: '', abv: '', minRating: 0, onSale: false, sort: 'rating' };

/** Everything we know about one bottle's shape, wherever it came from. */
function shapeOf(w) {
  const st = w.styleId ? styleOf(w.styleId) : null;
  return {
    style: st,
    body: st ? st.body : null,
    abv: abvNumber(w.abv) ?? (st ? abvNumber(st.abv) : null),
  };
}

export default function renderWine() {
  const root = el('<div class="screen"></div>');
  const all = store.wines();
  const always = store.alwaysWines();

  root.appendChild(el(`<div class="topbar">
    <div class="topbar-row"><h1>Wine</h1>
      <button class="btn sm icon ghost" data-a="add" aria-label="Add a wine">＋</button></div>
    <div class="sub">${all.length} bottle${all.length === 1 ? '' : 's'}${always.length ? ` · ${always.length} on every order` : ''}</div>
  </div>`));

  // --- this week -------------------------------------------------------------
  const weekKey = store.currentWeekKey();
  const plan = store.plan(weekKey);
  if (plan) {
    const entries = plan.slots
      .filter((sl) => sl.recipeId && !sl.skipped)
      .map((sl) => ({ recipe: store.recipe(sl.recipeId) }))
      .filter((e) => e.recipe);
    if (entries.length >= 2) {
      const wp = planWine(entries, {
        bottles: store.settings.wineBottles || 12,
        targetPerBottle: store.settings.wineTargetPerBottle || 12,
      });
      root.appendChild(el(`<div class="pad" style="padding-bottom:4px">
        <div class="card pad" data-a="week" style="margin:0;cursor:pointer">
          <div class="row-between">
            <div style="min-width:0">
              <div style="font-weight:700">🍷 This week wants ${wp.bottles} bottles</div>
              <div class="tiny dim truncate">${wp.buy.slice(0, 4).map((b) => `${b.bottles}× ${esc(b.style.name)}`).join(' · ')}${wp.buy.length > 4 ? ' …' : ''}</div>
              <div class="tiny" style="color:var(--accent-2)">$${wp.math.net.toFixed(0)} after the ${Math.round(wp.tier.discount * 100)}% case discount</div>
            </div>
            <span class="dim">›</span>
          </div>
        </div>
      </div>`));
    }
  }

  // --- standing order --------------------------------------------------------
  if (always.length) {
    root.appendChild(el(`<div class="pad" style="padding-top:6px;padding-bottom:2px">
      <div class="sechead" style="padding:0 0 7px">On every order<span class="line"></span></div>
      <div class="card">
        ${always.map((w) => row(w)).join('')}
      </div>
      <button class="btn sm block ghost" style="margin-top:8px" data-a="addalways">🛒 Put these on the list</button>
    </div>`));
  }

  if (!all.length) {
    root.appendChild(el(emptyState('🍷', 'No bottles yet',
      'Add one by hand, or let this week\'s pairing find them for you and save what you liked.',
      `<div class="pad stack" style="max-width:320px;margin:0 auto">
        <button class="btn primary block" data-a="add">＋ Add a bottle</button>
        <button class="btn block" data-a="week">🍷 What goes with this week?</button>
      </div>`)));
    wire(root);
    return root;
  }

  // --- budget ---------------------------------------------------------------
  const bottles = store.settings.wineBottles || 12;
  const target = store.settings.wineTargetPerBottle || 12;
  const bm = caseMath(bottles, target / (1 - (bottles >= 12 ? 0.15 : bottles >= 6 ? 0.10 : 0)));
  root.appendChild(el(`<div class="pad-x" style="margin-top:2px">
    <div class="card pad" style="margin:0">
      <div class="row-between" style="margin-bottom:8px">
        <span style="font-weight:700">Budget</span>
        <span class="tiny dim">${bm.tier.label} · ${Math.round(bm.tier.discount * 100)}% off</span>
      </div>
      <div class="row" style="gap:9px">
        <div class="field grow"><label>Bottles</label>
          <div class="segment" id="wb">
            ${[6, 12, 18].map((n) => `<button data-b="${n}" class="${bottles === n ? 'on' : ''}">${n}</button>`).join('')}
          </div></div>
        <div class="field" style="max-width:118px"><label>Per bottle, after</label>
          <input class="input" id="wtarget" type="number" min="5" max="60" step="1" value="${target}"></div>
      </div>
      <div class="kv" style="margin-top:8px"><span class="k">Shelf ceiling</span>
        <span class="v"><b>$${(target / (1 - bm.tier.discount)).toFixed(2)}</b> a bottle</span></div>
      <div class="kv"><span class="k">Case total</span>
        <span class="v">about <b>$${bm.net.toFixed(0)}</b> for ${bottles}</span></div>
      ${bm.nextTier ? `<div class="tiny" style="color:var(--warn);margin-top:5px">📌 ${bm.nextTier.need} more and the discount goes to ${Math.round(bm.nextTier.discount * 100)}%.</div>` : ''}
    </div>
  </div>`));

  // --- filters ---------------------------------------------------------------
  // NOTE: one wrapper element. el() returns only the first node it's handed,
  // so a block of siblings loses everything after the first — which is exactly
  // how the filter chips managed to never appear.
  root.appendChild(el(`<div>
  <div class="pad-x" style="margin-top:10px">
    <div class="search"><span>🔍</span>
      <input id="wq" placeholder="Search producer, grape, region" value="${esc(filters.q)}" autocomplete="off"></div>
  </div>
  <div class="chips" style="margin-top:9px">
    <button class="chip ${filters.favorites ? 'on' : ''}" data-f="fav">★ Favorites</button>
    <button class="chip ${filters.minRating >= 4 ? 'on' : ''}" data-f="rated">⭐ 4+ only</button>
    <button class="chip ${filters.onSale ? 'on' : ''}" data-f="sale">🏷 On sale</button>
    ${WINE_FREQUENCIES.filter((f) => f.id !== 'never').map((f) => `<button class="chip ${filters.freq === f.id ? 'on' : ''}" data-f="freq:${f.id}">${f.emoji} ${esc(f.label)}</button>`).join('')}
  </div>
  <div class="chips" style="margin-top:6px">
    ${COLOURS.map((c) => `<button class="chip sm ${filters.colour === c.id ? 'on' : ''}" data-f="colour:${c.id}">${c.emoji || ''} ${esc(c.label)}</button>`).join('')}
  </div>
  <div class="chips" style="margin-top:6px">
    ${BODY_BANDS.map((b) => `<button class="chip sm ${filters.body === b.id ? 'on' : ''}" data-f="body:${b.id}">${esc(b.label)} bodied</button>`).join('')}
    ${ABV_BANDS.map((b) => `<button class="chip sm ${filters.abv === b.id ? 'on' : ''}" data-f="abv:${b.id}">${esc(b.label)}</button>`).join('')}
  </div>
  </div>`));

  // --- the cellar ------------------------------------------------------------
  let list = all.slice();
  if (filters.favorites) list = list.filter((w) => w.favorite);
  if (filters.freq) list = list.filter((w) => w.frequency === filters.freq);
  if (filters.colour) list = list.filter((w) => (w.colour || 'red') === filters.colour);
  if (filters.minRating) list = list.filter((w) => (w.rating || 0) >= filters.minRating);
  if (filters.onSale) list = list.filter((w) => w.salePrice != null);
  if (filters.body) {
    const band = BODY_BANDS.find((b) => b.id === filters.body);
    list = list.filter((w) => band && band.test(shapeOf(w).body));
  }
  if (filters.abv) {
    const band = ABV_BANDS.find((b) => b.id === filters.abv);
    list = list.filter((w) => band && band.test(shapeOf(w).abv));
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter((w) => [w.name, w.producer, w.grape, w.region, w.country, w.notes]
      .join(' ').toLowerCase().includes(q));
  }
  list.sort((a, b) => (b.rating || 0) - (a.rating || 0)
    || String(b.lastBoughtAt || b.createdAt).localeCompare(String(a.lastBoughtAt || a.createdAt)));

  root.appendChild(el(`<div class="pad" style="padding-top:10px">
    <div class="row-between" style="margin-bottom:7px">
      <span class="small muted">${list.length} of ${all.length} bottle${all.length === 1 ? '' : 's'}</span>
      ${list.length !== all.length ? '<button class="btn xs ghost" data-f="clear">Clear filters</button>' : ''}
    </div>
    ${list.length
      ? `<div class="card">${list.map((w, i) => row(w, true, i + 1)).join('')}</div>`
      : '<p class="muted small center">Nothing matches those filters.</p>'}
  </div>`));

  wire(root);
  return root;
}

function row(w, showFreq = false, n = null) {
  const st = w.styleId ? styleOf(w.styleId) : null;
  const f = wineFrequency(w.frequency);
  const body = st ? bodyWord(st.body) : '';
  const emoji = w.colour === 'white' ? '🥂' : w.colour === 'rose' ? '🌸'
    : w.colour === 'sparkling' ? '🍾' : w.colour === 'sweet' ? '🍯' : '🍷';
  const price = w.salePrice != null ? `<b style="color:var(--accent-2)">$${Number(w.salePrice).toFixed(2)}</b> <s class="dim">$${Number(w.price).toFixed(2)}</s>`
    : w.price != null ? `$${Number(w.price).toFixed(2)}` : '';
  return `<div class="lrow" data-wine="${esc(w.id)}">
    ${n != null ? `<span class="rownum">${n}</span>` : ''}
    <div class="thumb" style="background:var(--bg-3);font-size:18px">${emoji}</div>
    <div class="grow" style="min-width:0">
      <div class="row" style="gap:6px">
        <span style="font-weight:650" class="truncate">${esc(w.name)}</span>
        ${w.favorite ? '<span>❤️</span>' : ''}
      </div>
      <div class="tiny dim truncate">${[w.vintage, w.grape || (st && st.name), body ? body + ' bodied' : '', w.region, w.abv || (st && st.abv)].filter(Boolean).map(esc).join(' · ')}</div>
      <div class="row tiny" style="gap:8px;margin-top:2px">
        ${price ? `<span>${price}</span>` : ''}
        ${w.score ? `<span class="tag">${esc(w.score)}</span>` : ''}
        ${showFreq && f ? `<span class="tag" style="color:${f.color}">${f.emoji} ${esc(f.label)}</span>` : ''}
      </div>
      ${w.rating ? `<div class="tiny">${starsHtml(w.rating)}</div>` : ''}
    </div>
    <span class="dim">›</span>
  </div>`;
}

function wire(root) {
  const nav = window.__recimeNav;
  on(root, 'click', '[data-a="add"]', () => openWineEditor(null));
  on(root, 'click', '[data-a="week"]', () => openWeekWine(store.currentWeekKey()));
  on(root, 'click', '[data-a="addalways"]', () => {
    const list = store.alwaysWines();
    for (const w of list) addWineToList(w);
    toast(`${list.length} bottle${list.length === 1 ? '' : 's'} added`, 'ok');
    nav.go('shop', { top: true });
  });
  on(root, 'click', '[data-wine]', (e, t) => openWineSheet(t.dataset.wine));

  on(root, 'click', '[data-f]', (e, t) => {
    const f = t.dataset.f;
    if (f === 'fav') filters.favorites = !filters.favorites;
    else if (f === 'rated') filters.minRating = filters.minRating >= 4 ? 0 : 4;
    else if (f === 'sale') filters.onSale = !filters.onSale;
    else if (f === 'clear') Object.assign(filters, { colour: '', freq: '', favorites: false, body: '', abv: '', minRating: 0, onSale: false, q: '' });
    else if (f.startsWith('freq:')) filters.freq = filters.freq === f.slice(5) ? '' : f.slice(5);
    else if (f.startsWith('colour:')) filters.colour = f.slice(7);
    else if (f.startsWith('body:')) filters.body = filters.body === f.slice(5) ? '' : f.slice(5);
    else if (f.startsWith('abv:')) filters.abv = filters.abv === f.slice(4) ? '' : f.slice(4);
    nav.render();
  });

  on(root, 'click', '#wb button', (e, t) => {
    store.setSetting('wineBottles', Number(t.dataset.b));
    nav.render();
  });
  const tgt = $('#wtarget', root);
  if (tgt) {
    let tt = null;
    tgt.addEventListener('input', () => {
      clearTimeout(tt);
      tt = setTimeout(() => {
        const v = Number(tgt.value);
        if (v >= 5 && v <= 60) { store.setSetting('wineTargetPerBottle', v); nav.render(); }
      }, 500);
    });
  }

  const q = $('#wq', root);
  if (q) {
    let tmr = null;
    q.addEventListener('input', () => {
      clearTimeout(tmr);
      tmr = setTimeout(() => { filters.q = q.value; nav.render(); }, 220);
    });
  }
}

/** Put one bottle on the shopping list, routed to the wine shop. */
export function addWineToList(w, bottles = 1) {
  const price = w.salePrice != null ? w.salePrice : w.price;
  store.putShoppingItem({
    id: 'shop-wine-' + w.id,
    key: 'wine ' + (w.styleId || w.id),
    name: w.name,
    displayName: w.name,
    quantity: bottles,
    unit: 'bottle',
    category: 'Wine & Beer',
    dest: 'in-person',
    store: store.settings.wineStore || '',
    wineId: w.id,
    estCost: price != null ? Math.round(price * bottles * 100) / 100 : null,
    priceInfo: price != null ? { unitPrice: price, per: 'bottle', confidence: 'seen' } : null,
    have: false, checked: false, manual: true, pinned: false,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deleted: false,
  });
}

// --- One bottle -------------------------------------------------------------
export function openWineSheet(id) {
  const w = store.wine(id);
  if (!w) return;
  const st = w.styleId ? styleOf(w.styleId) : null;

  const body = `<div class="pad stack">
    <div>
      <div style="font-weight:700;font-size:17px">${esc(w.name)}</div>
      <div class="small dim">${[w.producer, w.vintage, w.region, w.country].filter(Boolean).map(esc).join(' · ')}</div>
    </div>

    <div class="row" style="gap:7px;flex-wrap:wrap">
      ${w.grape || st ? `<span class="tag accent">${esc(w.grape || st.name)}</span>` : ''}
      ${w.abv ? `<span class="tag">${esc(w.abv)} ABV</span>` : ''}
      ${w.score ? `<span class="tag gold">${esc(w.score)}</span>` : ''}
      ${w.size ? `<span class="tag">${esc(w.size)}</span>` : ''}
    </div>

    ${w.notes ? `<p class="small muted" style="margin:0">${esc(w.notes)}</p>` : ''}
    ${st ? `<div class="banner info" style="margin:0"><b>${esc(st.name)}</b> — ${esc(st.notes)}.
      <div class="tiny" style="margin-top:4px">Goes with: ${esc(st.look)}</div></div>` : ''}

    <div class="field"><label>What did you think?</label>
      <div class="row" style="gap:4px" id="wstars">
        ${[1, 2, 3, 4, 5].map((n) => `<button class="btn sm ${w.rating >= n ? 'primary' : 'ghost'}" data-star="${n}">★</button>`).join('')}
      </div></div>

    <div class="field"><label>How often should we buy it?</label>
      <div class="chips wrap" style="padding:0" id="wfreq">
        ${WINE_FREQUENCIES.map((f) => `<button class="chip sm ${w.frequency === f.id ? 'on' : ''}" data-fq="${f.id}">${f.emoji} ${esc(f.label)}</button>`).join('')}
      </div>
      <div class="tiny dim">“Every order” means it goes on the list automatically, every time.</div></div>

    ${w.price != null ? `<div class="kv"><span class="k">Price</span><span class="v">${w.salePrice != null ? `$${Number(w.salePrice).toFixed(2)} (was $${Number(w.price).toFixed(2)})` : `$${Number(w.price).toFixed(2)}`}</span></div>` : ''}
    ${w.timesBought ? `<div class="kv"><span class="k">Bought</span><span class="v">${w.timesBought}× · last ${esc(relTime(w.lastBoughtAt))}</span></div>` : ''}
    ${w.store ? `<div class="kv"><span class="k">From</span><span class="v">${esc(w.store)}</span></div>` : ''}

    <div class="row" style="gap:8px">
      <button class="btn grow" data-a="fav">${w.favorite ? '❤️ Favorited' : '🤍 Favorite'}</button>
      <button class="btn grow" data-a="tolist">🛒 Add to list</button>
    </div>
    <div class="row" style="gap:8px">
      ${w.url ? `<a class="btn grow ghost" href="${esc(w.url)}" target="_blank" rel="noopener">Open at the shop ↗</a>` : ''}
      <button class="btn grow ghost" data-a="edit">✏️ Edit</button>
      <button class="btn ghost danger" data-a="del">Remove</button>
    </div>
  </div>`;

  sheet('', body, {
    onMount(root, close) {
      const refresh = () => { close(); setTimeout(() => openWineSheet(id), 120); };
      on(root, 'click', '[data-star]', (e, t) => { store.setWineRating(id, t.dataset.star); refresh(); });
      on(root, 'click', '[data-fq]', (e, t) => { store.setWineFrequency(id, t.dataset.fq); refresh(); });
      on(root, 'click', '[data-a="fav"]', () => { store.toggleWineFavorite(id); refresh(); });
      on(root, 'click', '[data-a="tolist"]', () => {
        addWineToList(w); store.markWineBought(id);
        close(); toast('On the list', 'ok'); window.__recimeNav.render();
      });
      on(root, 'click', '[data-a="edit"]', () => { close(); setTimeout(() => openWineEditor(id), 120); });
      on(root, 'click', '[data-a="del"]', async () => {
        close();
        if (await confirmSheet('Remove this bottle?', `${w.name} will be taken out of the cellar.`, { danger: true, okLabel: 'Remove' })) {
          store.removeWine(id); window.__recimeNav.render();
        }
      });
    },
  });
}

export function openWineEditor(id) {
  const w = id ? store.wine(id) : {
    name: '', producer: '', vintage: '', grape: '', region: '', country: '',
    abv: '', price: null, salePrice: null, score: '', notes: '', colour: 'red', styleId: '', store: '', url: '',
  };
  if (!w) return;

  const body = `<div class="pad stack">
    <div class="field"><label>What is it?</label>
      <input class="input" id="w-name" value="${esc(w.name)}" placeholder="e.g. OZV Old Vine Zinfandel" autocomplete="off"></div>
    <div class="row" style="gap:9px">
      <div class="field grow"><label>Producer</label>
        <input class="input" id="w-prod" value="${esc(w.producer)}" autocomplete="off"></div>
      <div class="field" style="max-width:110px"><label>Vintage</label>
        <input class="input" id="w-vint" value="${esc(w.vintage)}" inputmode="numeric" autocomplete="off"></div>
    </div>
    <div class="field"><label>Style</label>
      <select class="input" id="w-style">
        <option value="">— pick one —</option>
        ${STYLES.map((s) => `<option value="${s.id}" ${w.styleId === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
      </select></div>
    <div class="row" style="gap:9px">
      <div class="field grow"><label>Region</label>
        <input class="input" id="w-region" value="${esc(w.region)}" autocomplete="off"></div>
      <div class="field" style="max-width:110px"><label>ABV</label>
        <input class="input" id="w-abv" value="${esc(w.abv)}" placeholder="13.5%" autocomplete="off"></div>
    </div>
    <div class="row" style="gap:9px">
      <div class="field grow"><label>Price</label>
        <input class="input" id="w-price" value="${w.price != null ? w.price : ''}" inputmode="decimal"></div>
      <div class="field grow"><label>Sale price</label>
        <input class="input" id="w-sale" value="${w.salePrice != null ? w.salePrice : ''}" inputmode="decimal"></div>
    </div>
    <div class="field"><label>Critic score (optional)</label>
      <input class="input" id="w-score" value="${esc(w.score)}" placeholder="91 JS" autocomplete="off"></div>
    <div class="field"><label>How does it taste?</label>
      <textarea class="input" id="w-notes" placeholder="blackberry, cocoa, soft finish">${esc(w.notes)}</textarea></div>
    <div class="field"><label>Where from</label>
      <input class="input" id="w-store" value="${esc(w.store)}" placeholder="Chester Fine Wines" autocomplete="off"></div>
    <button class="btn primary block" data-a="save">Save</button>
  </div>`;

  sheet(id ? 'Edit bottle' : 'Add a bottle', body, {
    onMount(root, close) {
      on(root, 'click', '[data-a="save"]', () => {
        const name = $('#w-name', root).value.trim();
        if (!name) { toast('It needs a name', 'err'); return; }
        const styleId = $('#w-style', root).value;
        const st = styleOf(styleId);
        const num = (sel) => {
          const v = $(sel, root).value.trim();
          return v === '' ? null : Number(v);
        };
        const patch = {
          name,
          producer: $('#w-prod', root).value.trim(),
          vintage: $('#w-vint', root).value.trim(),
          styleId,
          colour: st ? st.colour : (w.colour || 'red'),
          grape: st ? st.name : (w.grape || ''),
          region: $('#w-region', root).value.trim(),
          abv: $('#w-abv', root).value.trim(),
          price: num('#w-price'),
          salePrice: num('#w-sale'),
          score: $('#w-score', root).value.trim(),
          notes: $('#w-notes', root).value.trim(),
          store: $('#w-store', root).value.trim(),
        };
        if (id) store.updateWine(id, patch); else store.addWine(patch);
        close();
        toast('Saved', 'ok');
        window.__recimeNav.render();
      });
    },
  });
}

/**
 * Bulk-add bottles that came back from a research run. Accepts the JSON the
 * hand-off asks for, so a round trip is one paste rather than twelve forms.
 */
export function importWines(json) {
  let rows = [];
  try { rows = typeof json === 'string' ? JSON.parse(json) : json; } catch { return 0; }
  if (!Array.isArray(rows)) rows = rows.wines || rows.bottles || [];
  let n = 0;
  for (const r of rows) {
    if (!r || !r.name) continue;
    const st = r.styleId ? styleOf(r.styleId) : STYLES.find((s) => s.name.toLowerCase() === String(r.style || '').toLowerCase());
    store.addWine({
      name: r.name,
      producer: r.producer || '',
      vintage: String(r.vintage || ''),
      styleId: st ? st.id : '',
      colour: st ? st.colour : (r.colour || 'red'),
      grape: r.grape || (st ? st.name : ''),
      region: r.region || '',
      country: r.country || '',
      abv: r.abv || '',
      price: r.price != null ? Number(r.price) : null,
      salePrice: r.salePrice != null ? Number(r.salePrice) : null,
      score: r.score || '',
      notes: r.notes || '',
      store: r.store || '',
      url: r.url || '',
    });
    n++;
  }
  if (n) window.__recimeNav.render();
  return n;
}

// Reachable from the console and from a paste-back sheet.
if (typeof window !== 'undefined') window.__recimeImportWines = importWines;
