// ---------------------------------------------------------------------------
// views/shop.js — the list you actually walk the store with
// ---------------------------------------------------------------------------
import store, { AISLE_ORDER, AISLE_META } from '../store.js';
import { el, on, toast, sheet, confirmSheet, copyText, emptyState, $, longPress } from '../ui.js';
import { esc, fmtQty, fmtAmount, money, uid, nowISO, normName, ymd, weekStartOf, sum } from '../util.js';
import {
  aggregateIngredients, groupByAisle, totals, estimateCost, applyPricing,
  priceLookup, buyAmount, needAmount, destLabel, listAsText,
  instacartSearchUrl, instacartStorefrontUrl, instacartListPayload,
  instacartReady, callInstacart,
  claudeHandoffPayload, normaliseAisle, applyStoreRules, PRICE_META,
} from '../shopping.js';
import { guessCategory } from '../parse.js';

let mode = 'shop'; // 'shop' = walking the store, 'plan' = organising

export default function renderShop() {
  const nav = window.__recimeNav;
  const items = store.shoppingItems();
  const root = el(`<div class="screen"></div>`);
  const t = totals(items);
  const stores = store.settings.stores || [];

  root.appendChild(el(`<div class="topbar">
    <div class="topbar-row">
      <h1>Shopping</h1>
      <button class="btn sm ghost" data-a="menu">⋯</button>
    </div>
    <div class="sub">${t.buyCount} to buy${t.checkedCount ? ` · ${t.checkedCount} in the cart` : ''}${t.have ? ` · ${money(t.have)} saved by what you have` : ''}</div>
    <div style="margin-top:10px" class="segment">
      <button data-mode="shop" class="${mode === 'shop' ? 'on' : ''}">🛒 At the store</button>
      <button data-mode="plan" class="${mode === 'plan' ? 'on' : ''}">📋 Organize</button>
    </div>
  </div>`));

  if (!items.length) {
    root.appendChild(el(emptyState('🛒', 'Your list is empty',
      'Build it from this week\'s plan, or add things one at a time.',
      `<button class="btn primary" data-a="fromplan">Build from this week's plan</button>
       <div style="margin-top:10px"><button class="btn sm ghost" data-a="additem">Add an item</button></div>`)));
    wire(root, items);
    return root;
  }

  // --- the list ------------------------------------------------------------
  const visible = mode === 'shop' ? items.filter((i) => !i.have) : items;
  const groups = groupByAisle(visible);

  for (const g of groups) {
    const gTotal = sum(g.items.filter((i) => !i.have), (i) => i.overridePrice != null ? Number(i.overridePrice) : (i.estCost || 0));
    const done = g.items.filter((i) => i.checked || i.have).length;
    root.appendChild(el(`<div class="aislehead">
      <span class="dot" style="background:${g.meta.color}"></span>
      <span class="t">${g.meta.emoji} ${esc(g.aisle)}</span>
      <span class="n">${done}/${g.items.length} · ${money(gTotal)}</span>
    </div>`));
    const card = el(`<div class="card" style="margin:0 16px 4px"></div>`);
    for (const it of g.items) card.appendChild(row(it, stores, mode === 'plan'));
    root.appendChild(card);
  }

  if (mode === 'shop' && items.some((i) => i.have)) {
    const haveCount = items.filter((i) => i.have).length;
    root.appendChild(el(`<div class="pad-x" style="margin-top:12px">
      <button class="btn block ghost small" data-a="showhave">✅ ${haveCount} item${haveCount === 1 ? '' : 's'} you already have — show</button></div>`));
  }

  root.appendChild(el(`<div class="pad"><button class="btn block" data-a="additem">＋ Add an item</button></div>`));

  // --- destination breakdown ----------------------------------------------
  const destEntries = Object.entries(t.byDest).filter(([k]) => k !== 'unassigned');
  if (destEntries.length || t.byDest.unassigned) {
    root.appendChild(el(`<div class="pad" style="padding-top:0"><div class="card pad">
      <div class="sechead" style="padding:0 0 6px">Where it's coming from<span class="line"></span></div>
      ${destEntries.map(([k, v]) => {
        const [d, sid] = k.split(':');
        const st = stores.find((s) => s.id === sid);
        return `<div class="kv"><span class="k">${d === 'instacart' ? '🚚 Instacart' : '🛒 In person'}${st ? ' · ' + esc(st.name) : ''}</span><span class="v">${money(v)}</span></div>`;
      }).join('')}
      ${t.byDest.unassigned ? `<div class="kv"><span class="k dim">Not assigned yet</span><span class="v">${money(t.byDest.unassigned)}</span></div>` : ''}
    </div></div>`));
  }

  // --- export actions ------------------------------------------------------
  root.appendChild(el(`<div class="pad stack" style="padding-top:0">
    <button class="btn block" data-a="instacart">🚚 Send to Instacart</button>
    <button class="btn block" data-a="claude">🤖 Hand off to Claude to build the cart</button>
    <div class="row" style="gap:9px">
      <button class="btn grow sm" data-a="copy">📋 Copy list</button>
      <button class="btn grow sm" data-a="assign">⇄ Assign all</button>
    </div>
    <div class="tiny dim center" style="margin-top:2px">Prices are ${esc(PRICE_META.region)} estimates from ${esc(PRICE_META.researched)} — sale prices usually run lower.</div>
  </div>`));

  // --- sticky total --------------------------------------------------------
  root.appendChild(el(`<div class="totalbar">
    <div class="row-between">
      <div>
        <div class="tiny dim">${mode === 'shop' ? 'Still to grab' : 'Anticipated spend'}</div>
        <div class="big">${money(mode === 'shop' ? t.remaining : t.buying)}</div>
      </div>
      <div class="center">
        <div class="tiny dim">In cart</div>
        <div style="font-weight:700" class="mono">${money(t.checked)}</div>
      </div>
      <div class="center">
        <div class="tiny dim">Items</div>
        <div style="font-weight:700" class="mono">${t.checkedCount}/${t.buyCount}</div>
      </div>
    </div>
    ${t.unpriced ? `<div class="tiny dim" style="margin-top:4px">${t.unpriced} item${t.unpriced === 1 ? '' : 's'} without a price estimate — tap one to set it.</div>` : ''}
  </div>`));

  wire(root, items);
  return root;
}

function row(it, stores, showSource) {
  const price = it.overridePrice != null ? Number(it.overridePrice) : it.estCost;
  const buy = buyAmount(it);
  const need = needAmount(it);
  return el(`<div class="shoprow ${it.checked ? 'checked' : ''} ${it.have ? 'have' : ''}">
    <button class="check ${it.checked ? 'on' : ''}" data-check="${esc(it.id)}" aria-label="In the cart">✓</button>
    <div class="grow" data-edit="${esc(it.id)}" style="min-width:0">
      <div class="nm"><span class="buyqty">${esc(buy)}</span> ${esc(it.name)}</div>
      <div class="row" style="gap:6px;flex-wrap:nowrap;margin-top:1px;overflow:hidden">
        ${buy !== need ? `<span class="qt nowrap">need ${esc(need)}</span>` : ''}
        ${it.staple ? '<span class="qt nowrap">staple</span>' : ''}
        ${it.dest ? `<span class="destpill ${esc(it.dest)}">${esc(destLabel(it, stores))}</span>` : ''}
        ${showSource && it.from && it.from.length ? `<span class="qt truncate">${esc(it.from.map((f) => f.title).join(', '))}</span>` : ''}
      </div>
    </div>
    <div class="pr">${price != null ? money(price) : '—'}</div>
    <button class="check ${it.have ? 'on' : ''}" data-have="${esc(it.id)}" title="I already have this" style="border-radius:14px;font-size:12px">${it.have ? '✓' : '🏠'}</button>
  </div>`);
}

// ---------------------------------------------------------------------------

function wire(root, items) {
  const nav = window.__recimeNav;

  on(root, 'click', '[data-mode]', (e, t) => { mode = t.dataset.mode; nav.render(); });

  on(root, 'click', '[data-check]', (e, t) => {
    const it = store.state.shopping[t.dataset.check];
    store.updateShoppingItem(it.id, { checked: !it.checked });
    if (navigator.vibrate) navigator.vibrate(8);
  });

  on(root, 'click', '[data-have]', (e, t) => {
    const it = store.state.shopping[t.dataset.have];
    store.updateShoppingItem(it.id, { have: !it.have, checked: false });
    toast(it.have ? 'Back on the list' : 'Removed — you already have it');
  });

  on(root, 'click', '[data-edit]', (e, t) => openItem(t.dataset.edit));
  on(root, 'click', '[data-a="additem"]', () => openItem(null));
  on(root, 'click', '[data-a="fromplan"]', () => buildListFromPlan(ymd(weekStartOf(new Date())), { navigate: false }));
  on(root, 'click', '[data-a="showhave"]', () => { mode = 'plan'; nav.render(); });
  on(root, 'click', '[data-a="menu"]', () => openMenu());
  on(root, 'click', '[data-a="instacart"]', () => openInstacart(items));
  on(root, 'click', '[data-a="claude"]', () => openClaudeHandoff(items));
  on(root, 'click', '[data-a="assign"]', () => openBulkAssign(items));
  on(root, 'click', '[data-a="copy"]', async () => {
    const ok = await copyText(listAsText(items, { stores: store.settings.stores, title: 'Shopping list' }));
    toast(ok ? 'Copied' : 'Could not copy', ok ? 'ok' : 'err');
  });
}

// ---------------------------------------------------------------------------

function openItem(id) {
  const existing = id ? store.state.shopping[id] : null;
  const it = existing || {
    id: uid('shp'), name: '', quantity: 1, unit: '', category: 'Other',
    have: false, checked: false, dest: '', store: '', manual: true, deleted: false,
  };
  const stores = store.settings.stores || [];

  const body = `<div class="pad stack">
    <div class="field"><label>Item</label>
      <input class="input" id="i-name" value="${esc(it.name)}" placeholder="e.g. Greek yogurt" autocomplete="off"></div>
    <div class="row" style="gap:10px">
      <div class="field grow"><label>Amount</label>
        <input class="input" id="i-qty" type="number" step="0.25" min="0" value="${it.quantity}"></div>
      <div class="field grow"><label>Unit</label>
        <input class="input" id="i-unit" value="${esc(it.unit || '')}" placeholder="lb, cup, can…" autocomplete="off"></div>
    </div>
    <div class="field"><label>Aisle</label>
      <select class="input" id="i-cat">${AISLE_ORDER.map((a) => `<option ${a === it.category ? 'selected' : ''}>${a}</option>`).join('')}</select></div>
    <div class="field"><label>Price estimate</label>
      <input class="input" id="i-price" type="number" step="0.01" min="0" placeholder="${it.estCost != null ? it.estCost.toFixed(2) : 'auto'}" value="${it.overridePrice != null ? it.overridePrice : ''}">
      ${it.priceInfo ? `<div class="tiny dim">Based on ${esc(it.priceInfo.packSize || '')} at ${money(it.priceInfo.unitPrice)} per ${esc(it.priceInfo.per)}${it.priceInfo.fuzzy ? ' (closest match)' : ''}</div>` : ''}
    </div>
    <div class="field"><label>Where are we getting it?</label>
      <div class="chips wrap" style="padding:0" id="i-dest">
        <button class="chip ${!it.dest ? 'on' : ''}" data-d="">Undecided</button>
        ${stores.map((s) => `<button class="chip ${it.dest === 'instacart' && it.store === s.id ? 'on' : ''}" data-d="instacart:${esc(s.id)}">🚚 Instacart · ${esc(s.name)}</button>`).join('')}
        ${stores.map((s) => `<button class="chip ${it.dest === 'in-person' && it.store === s.id ? 'on' : ''}" data-d="in-person:${esc(s.id)}">🛒 In person · ${esc(s.name)}</button>`).join('')}
      </div>
    </div>
    <div class="row-between card pad">
      <span>I already have this</span>
      <label class="switch"><input type="checkbox" id="i-have" ${it.have ? 'checked' : ''}><span class="track"></span><span class="knob"></span></label>
    </div>
    ${it.from && it.from.length ? `<div class="tiny dim">Needed for: ${esc(it.from.map((f) => f.title).join(', '))}</div>` : ''}
    <div class="row">
      ${existing ? '<button class="btn danger" data-a="del">Delete</button>' : ''}
      <button class="btn grow primary" data-a="save">${existing ? 'Save' : 'Add to list'}</button>
    </div>
    ${existing ? `<a class="btn block ghost small" target="_blank" rel="noopener"
        href="${esc(instacartSearchUrl(it.name, (stores.find((s) => s.id === (it.store || store.settings.defaultStore)) || {}).slug))}">Search this on Instacart ↗</a>` : ''}
  </div>`;

  sheet(existing ? existing.name : 'Add an item', body, {
    onMount(root, close) {
      let dest = it.dest ? it.dest + ':' + (it.store || '') : '';
      on(root, 'click', '#i-dest .chip', (e, t) => {
        dest = t.dataset.d;
        for (const c of root.querySelectorAll('#i-dest .chip')) c.classList.toggle('on', c.dataset.d === dest);
      });
      on(root, 'click', '[data-a="save"]', () => {
        const name = $('#i-name', root).value.trim();
        if (!name) { toast('Give it a name', 'err'); return; }
        const [d, sid] = String(dest || '').split(':');
        const priceRaw = $('#i-price', root).value;
        const next = {
          ...it,
          name,
          quantity: Number($('#i-qty', root).value) || 1,
          unit: $('#i-unit', root).value.trim(),
          category: normaliseAisle($('#i-cat', root).value),
          dest: d || '',
          store: sid || '',
          pinned: dest !== (it.dest ? it.dest + ':' + (it.store || '') : '') ? true : it.pinned,
          have: $('#i-have', root).checked,
          overridePrice: priceRaw === '' ? undefined : Number(priceRaw),
          key: normName(name),
        };
        if (next.overridePrice === undefined) {
          delete next.overridePrice;
          applyPricing(next);
        } else {
          applyPricing({ ...next });
          const est = estimateCost(next);
          next.buyQty = est.buyQty ?? null;
          next.buyUnit = est.buyUnit || '';
        }
        store.putShoppingItem(next);
        close();
      });
      on(root, 'click', '[data-a="del"]', () => { store.removeShoppingItem(it.id); close(); toast('Removed'); });
    },
  });
}

// ---------------------------------------------------------------------------

function openMenu() {
  const items = store.shoppingItems();
  sheet('Shopping list', `<div class="pad stack">
    <button class="btn block" data-a="rebuild">🔄 Rebuild from this week's plan</button>
    <button class="btn block" data-a="reapply">📍 Re-apply store rules</button>
    <button class="btn block" data-a="uncheck">↺ Uncheck everything</button>
    <button class="btn block" data-a="clearchecked">🧹 Remove checked items</button>
    <button class="btn block" data-a="resethave">🏠 Reset "already have"</button>
    <div class="divider"></div>
    <button class="btn block danger" data-a="clearall">🗑 Clear the whole list</button>
  </div>`, {
    onMount(root, close) {
      on(root, 'click', '[data-a="rebuild"]', () => { close(); buildListFromPlan(ymd(weekStartOf(new Date())), { navigate: false, replace: true }); });
      on(root, 'click', '[data-a="reapply"]', () => {
        let n = 0;
        for (const i of items) {
          if (i.pinned || i.have) continue;
          const before = i.dest + '|' + i.store;
          const next = { ...i };
          applyStoreRules(next);
          if (before !== next.dest + '|' + next.store) { store.updateShoppingItem(i.id, { dest: next.dest, store: next.store, ruleId: next.ruleId }); n++; }
        }
        close(); toast(n ? `${n} item${n === 1 ? '' : 's'} re-routed` : 'Nothing changed');
      });
      on(root, 'click', '[data-a="uncheck"]', () => {
        for (const i of items) if (i.checked) store.updateShoppingItem(i.id, { checked: false });
        close(); toast('Unchecked');
      });
      on(root, 'click', '[data-a="clearchecked"]', () => { store.clearShopping(true); close(); toast('Cleaned up'); });
      on(root, 'click', '[data-a="resethave"]', () => {
        for (const i of items) if (i.have) store.updateShoppingItem(i.id, { have: false });
        close(); toast('Reset');
      });
      on(root, 'click', '[data-a="clearall"]', async () => {
        close();
        if (await confirmSheet('Clear the list?', 'Everything on it will be removed.', { danger: true, okLabel: 'Clear' })) {
          store.clearShopping(false); toast('Cleared');
        }
      });
    },
  });
}

function openBulkAssign(items) {
  const stores = store.settings.stores || [];
  sheet('Assign everything to…', `<div class="pad stack">
    ${stores.map((s) => `<button class="btn block" data-d="instacart:${esc(s.id)}">🚚 Instacart · ${esc(s.name)}</button>`).join('')}
    ${stores.map((s) => `<button class="btn block" data-d="in-person:${esc(s.id)}">🛒 In person · ${esc(s.name)}</button>`).join('')}
    <button class="btn block ghost" data-d="">Clear assignments</button>
    <div class="tiny dim center">Only affects items you haven't already assigned by hand.</div>
    <button class="btn block ghost small" data-force>Apply to every item, overwriting</button>
  </div>`, {
    onMount(root, close) {
      let force = false;
      on(root, 'click', '[data-force]', (e, t) => { force = true; t.classList.add('primary'); t.textContent = 'Overwrite mode on — now pick a destination'; });
      on(root, 'click', '[data-d]', (e, t) => {
        const [d, sid] = String(t.dataset.d || '').split(':');
        for (const i of items) {
          if (i.have) continue;
          if (!force && i.dest) continue;
          store.updateShoppingItem(i.id, { dest: d || '', store: sid || '', pinned: true });
        }
        close(); toast('Assigned');
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Instacart
// ---------------------------------------------------------------------------

function openInstacart(items) {
  const stores = store.settings.stores || [];
  const forCart = items.filter((i) => !i.have && (i.dest === 'instacart' || !i.dest));
  const explicit = items.filter((i) => !i.have && i.dest === 'instacart');
  const list = explicit.length ? explicit : forCart;
  const hasKey = instacartReady();

  const body = `<div class="pad stack">
    <div class="small muted">${explicit.length
      ? `${explicit.length} item${explicit.length === 1 ? '' : 's'} are marked for Instacart.`
      : `Nothing is marked for Instacart yet, so this will use all ${forCart.length} unassigned items.`}</div>

    ${hasKey
      ? `<button class="btn primary block" data-a="api">🚚 Build an Instacart list page</button>
         <div class="tiny dim">Uses your Instacart API key to create one shoppable page with everything on it.</div>`
      : `<div class="banner" style="margin:0">One-tap cart building is off. Instacart's developer sign-ups are open again — make a key at dashboard.instacart.com, put it on your backend, and switch it on under Settings → Keys and backends. The options below work either way.</div>`}

    <button class="btn block" data-a="storefront">Open Instacart · ${esc((stores.find((s) => s.id === store.settings.defaultStore) || stores[0] || {}).name || 'store')}</button>
    <button class="btn block" data-a="searchall">🔎 Open a search tab per item (${list.length})</button>
    <button class="btn block" data-a="copyplain">📋 Copy list to paste into Instacart</button>
    <div class="tiny dim">Instacart's own list import accepts pasted text — copy, then use "Add items" in the app.</div>
  </div>`;

  sheet('Send to Instacart', body, {
    onMount(root, close) {
      on(root, 'click', '[data-a="storefront"]', () => {
        const s = stores.find((x) => x.id === store.settings.defaultStore) || stores[0];
        window.open(instacartStorefrontUrl(s?.slug || 'shoprite'), '_blank', 'noopener');
      });
      on(root, 'click', '[data-a="searchall"]', () => {
        close();
        openSearchRunner(list, stores);
      });
      on(root, 'click', '[data-a="copyplain"]', async () => {
        const text = list.map((i) => `${buyAmount(i)} ${i.name}`.replace(/\s+/g, ' ').trim()).join('\n');
        const ok = await copyText(text);
        close(); toast(ok ? 'Copied — paste into Instacart' : 'Could not copy', ok ? 'ok' : 'err');
      });
      on(root, 'click', '[data-a="api"]', async () => {
        close();
        await instacartApiList(list);
      });
    },
  });
}

/** Walk the list one item at a time, opening Instacart search for each. */
function openSearchRunner(list, stores) {
  let i = 0;
  const slugOf = (it) => (stores.find((s) => s.id === (it.store || store.settings.defaultStore)) || stores[0] || {}).slug;
  const s = sheet('Add to Instacart', `<div class="pad stack" id="runner"></div>`, {
    onMount(root, close) {
      const box = $('#runner', root);
      const draw = () => {
        if (i >= list.length) {
          box.innerHTML = `<div class="center" style="padding:20px 0"><div style="font-size:34px">✅</div>
            <div style="font-weight:650;margin-top:6px">That's the whole list</div></div>
            <button class="btn primary block" data-a="close">Done</button>`;
          return;
        }
        const it = list[i];
        box.innerHTML = `
          <div class="tiny dim">Item ${i + 1} of ${list.length}</div>
          <div style="font-size:21px;font-weight:700;letter-spacing:-.4px">${esc(it.name)}</div>
          <div class="muted">${esc(buyAmount(it))}${it.estCost != null ? ` · about ${money(it.estCost)}` : ''}</div>
          <a class="btn primary block" target="_blank" rel="noopener" href="${esc(instacartSearchUrl(it.name, slugOf(it)))}">🔎 Find it on Instacart ↗</a>
          <div class="row">
            <button class="btn grow" data-a="skip">Skip</button>
            <button class="btn grow primary" data-a="added">Added to cart ✓</button>
          </div>`;
      };
      on(root, 'click', '[data-a="added"]', () => {
        store.updateShoppingItem(list[i].id, { checked: true, dest: 'instacart', store: list[i].store || store.settings.defaultStore });
        i++; draw();
      });
      on(root, 'click', '[data-a="skip"]', () => { i++; draw(); });
      on(root, 'click', '[data-a="close"]', close);
      draw();
    },
  });
  return s;
}

async function instacartApiList(list) {
  toast('Building your Instacart page…');
  try {
    const stores = store.settings.stores || [];
    const pick = stores.find((s) => s.id === store.settings.defaultStore) || stores[0];
    const body = await callInstacart('list', {
      payload: instacartListPayload(list, 'ReciMe — this week', location.origin),
      retailerKey: pick?.retailerKey || undefined,
    });
    if (!body.products_link_url) throw new Error('Instacart did not return a link');
    window.open(body.products_link_url, '_blank', 'noopener');
  } catch (e) {
    toast(String(e.message || e), 'err');
  }
}

// ---------------------------------------------------------------------------
// Claude handoff
// ---------------------------------------------------------------------------

function openClaudeHandoff(items) {
  const plan = store.plan(ymd(weekStartOf(new Date())));
  const payload = claudeHandoffPayload(items, plan, store.settings.stores || []);
  const prompt = buildClaudePrompt(payload);

  sheet('Hand off to Claude', `<div class="pad stack">
    <p class="muted small" style="margin:0">This copies your list plus instructions. Paste it into a Claude session with browser access and it can compare stores on Instacart, lean organic where the price is sane, build the cart, and tell you when it's ready to check out.</p>
    <button class="btn primary block" data-a="copy">📋 Copy the handoff</button>
    <button class="btn block" data-a="publish">☁️ Publish it for Claude to read</button>
    <div class="tiny dim">Publishing saves it to your synced backend so a scheduled Claude task can pick it up without you pasting anything.</div>
    <details><summary class="small muted" style="padding:6px 0;cursor:pointer">Preview</summary>
      <textarea class="input" style="min-height:190px;font-size:12px" readonly>${esc(prompt)}</textarea></details>
  </div>`, {
    onMount(root, close) {
      const notesEl = $('#hnotes', root);
      const rebuild = () => {
        store.settings.cartNotes = notesEl.value;
        store.saveSettings();
        return buildClaudePrompt(claudeHandoffPayload(items, plan, store.settings.stores || []));
      };
      on(root, 'click', '[data-a="copy"]', async () => {
        const ok = await copyText(rebuild());
        close(); toast(ok ? 'Copied — paste it to Claude' : 'Could not copy', ok ? 'ok' : 'err');
      });
      on(root, 'click', '[data-a="publish"]', async () => {
        const freshPrompt = rebuild();
        close();
        if (!store.settings.syncUrl) { toast('Set up sync in Settings first', 'err'); return; }
        try {
          const res = await fetch(String(store.settings.syncUrl).replace(/\/+$/, '') + '/rest/v1/recime_items?on_conflict=household,kind,item_id', {
            method: 'POST',
            headers: {
              apikey: store.settings.syncKey, Authorization: 'Bearer ' + store.settings.syncKey,
              'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal',
            },
            body: JSON.stringify([{
              household: store.settings.household, kind: 'cart-request', item_id: 'current',
              data: { ...claudeHandoffPayload(items, plan, store.settings.stores || []), prompt: freshPrompt },
              updated_at: nowISO(), deleted: false,
            }]),
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          toast('Published — Claude can read it now', 'ok');
        } catch (e) { toast(String(e.message || e), 'err'); }
      });
    },
  });
}

function buildClaudePrompt(payload) {
  const lines = [
    'Please build my Instacart order from this shopping list.',
    '',
  ];
  if (payload.preferences?.notes) {
    lines.push('Read this first — it overrides anything below:', payload.preferences.notes, '');
  }
  if (payload.storeRules?.length) {
    lines.push('Standing rules about where things come from:');
    for (const r of payload.storeRules) lines.push(`  - ${r.what} \u2192 ${r.store} (${r.how})`);
    lines.push('');
  }
  lines.push(
    'How I want you to shop:',
    '- Compare my usual stores and pick whichever gives the best total; tell me if splitting across two stores saves a meaningful amount.',
    '- Lean organic where the price premium is reasonable (roughly within 30%), conventional where it is not.',
    '- Match the sizes to the quantities below — round up to the nearest package, do not over-buy.',
    '- Skip anything marked as already owned.',
    '- When the cart is built, do not place the order. Send me a summary with the store, the item count, the total, and anything you had to substitute or could not find.',
    '- Items already marked with a destination were routed by my rules or by hand — respect them.',
    '',
    'Stores I use: ' + payload.stores.map((s) => s.name).join(', '),
    'Note: Costco through Instacart does not need a membership, but non-member prices run roughly 13-15% above in-warehouse, so only send genuinely bulk items there.',
    payload.meals.length ? '\nThis week we are making: ' + payload.meals.join(', ') : '',
    '',
    'The list:',
  );
  const byAisle = {};
  for (const i of payload.items) (byAisle[i.aisle] = byAisle[i.aisle] || []).push(i);
  for (const a of AISLE_ORDER) {
    if (!byAisle[a]) continue;
    lines.push('', a + ':');
    for (const i of byAisle[a]) {
      lines.push(`  - ${fmtQty(i.quantity)} ${i.unit} ${i.name}`.replace(/\s+/g, ' ') +
        (i.estimatedPrice != null ? `  (about $${i.estimatedPrice.toFixed(2)})` : '') +
        (i.preferredDestination && i.preferredDestination !== 'either' ? `  [${i.preferredDestination}${i.pinnedByHand ? ', set by hand' : ''}]` : ''));
    }
  }
  lines.push('', `My own estimate for the whole list is about $${(payload.estimatedTotal || 0).toFixed(2)}.`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Building the list
// ---------------------------------------------------------------------------

export function buildListFromPlan(weekKey, { navigate = false, replace = false } = {}) {
  const plan = store.plan(weekKey);
  if (!plan) { toast('No plan for this week yet', 'err'); return; }
  const entries = plan.slots
    .filter((s) => s.recipeId && !s.skipped)
    .map((s) => ({ recipe: store.recipe(s.recipeId), servings: s.servings }))
    .filter((e) => e.recipe);
  if (!entries.length) { toast('Nothing planned yet', 'err'); return; }

  const fresh = aggregateIngredients(entries);
  const existing = store.shoppingItems();

  if (replace) {
    for (const i of existing) if (!i.manual) store.removeShoppingItem(i.id);
  }

  // Merge into what's already there, remembering "have"/"checked"/destination.
  const byKey = new Map(store.shoppingItems().map((i) => [i.key + '|' + i.unit, i]));
  let added = 0, updated = 0;
  for (const f of fresh) {
    const hit = byKey.get(f.key + '|' + f.unit) || store.shoppingItems().find((i) => i.key === f.key);
    if (hit) {
      store.updateShoppingItem(hit.id, {
        quantity: hit.manual ? hit.quantity : f.quantity,
        unit: hit.manual ? hit.unit : f.unit,
        estCost: hit.overridePrice != null ? hit.estCost : f.estCost,
        priceInfo: f.priceInfo, from: f.from, category: hit.manual ? hit.category : f.category,
      });
      updated++;
    } else {
      const dest = store.settings.defaultDest || '';
      const item = { ...f, dest, store: dest ? store.settings.defaultStore : '' };
      applyStoreRules(item);
      store.putShoppingItem(item);
      added++;
    }
  }
  toast(`${added} added${updated ? `, ${updated} updated` : ''}`, 'ok');
  if (navigate) window.__recimeNav.go('shop', { top: true });
}

export function addRecipeToList(recipe, servings) {
  const fresh = aggregateIngredients([{ recipe, servings }]);
  let added = 0;
  for (const f of fresh) {
    const hit = store.shoppingItems().find((i) => i.key === f.key && i.unit === f.unit);
    if (hit) {
      store.updateShoppingItem(hit.id, { quantity: (hit.quantity || 0) + f.quantity, from: [...(hit.from || []), ...f.from] });
    } else {
      const dest = store.settings.defaultDest || '';
      const item = { ...f, dest, store: dest ? store.settings.defaultStore : '' };
      applyStoreRules(item);
      store.putShoppingItem(item);
      added++;
    }
  }
  toast(`${fresh.length} ingredient${fresh.length === 1 ? '' : 's'} on the list`, 'ok');
}
