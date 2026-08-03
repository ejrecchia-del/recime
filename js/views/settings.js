// ---------------------------------------------------------------------------
// views/settings.js — sync, stores, preferences, backup, and the how-to
// ---------------------------------------------------------------------------
import store, { startSync, pullRemote, pushDirty, pushToCircles, pullFromCircles, EATING_TYPES, eatingType, appetiteShare, ageOf, daysToBirthday, AISLE_ORDER } from '../store.js';
import { el, on, toast, sheet, confirmSheet, copyText, downloadFile, $ } from '../ui.js';
import { esc, uid } from '../util.js';
import { PRICE_META } from '../shopping.js';

const DIETS = [
  ['vegetarian', 'Vegetarian'], ['vegan', 'Vegan'], ['gluten-free', 'Gluten-free'],
  ['low-carb', 'Low carb'], ['high-protein', 'High protein'],
  ['no-pork', 'No pork'], ['no-shellfish', 'No shellfish'],
];

export default function renderSettings() {
  const nav = window.__recimeNav;
  const s = store.settings;
  const root = el(`<div class="screen"></div>`);
  const recipeCount = store.allRecipes().length;

  root.appendChild(el(`<div class="topbar">
    <div class="topbar-row"><h1>More</h1></div>
    <div class="sub">${recipeCount} recipes · ${store.shoppingItems().length} on the list</div>
  </div>`));

  // --- sync ----------------------------------------------------------------
  root.appendChild(section('Sharing with Dale', `
    <div class="card pad stack">
      <div class="row">
        <span class="syncdot ${store.syncStatus}"></span>
        <span class="grow" data-sync-label>${syncLabelText()}</span>
        ${s.syncUrl ? '<button class="btn xs" data-a="syncnow">Sync now</button>' : ''}
      </div>
      ${s.syncUrl ? `
        <div class="kv"><span class="k">Household code</span><span class="v mono">${esc(s.household)}</span></div>
        <div class="row" style="gap:8px">
          <button class="btn sm grow" data-a="invite">📨 Invite Dale</button>
          <button class="btn sm grow ghost" data-a="setupsync">Change</button>
        </div>
        ${store.syncMessage ? `<div class="tiny" style="color:var(--danger)">${esc(store.syncMessage)}</div>` : ''}
      ` : `
        <p class="small muted" style="margin:0">Right now everything lives on this device only. Connect a free Supabase project and you'll both see the same recipes, plan and shopping list — updating live while you're in the store.</p>
        <button class="btn primary block" data-a="setupsync">Set up shared sync</button>
      `}
    </div>`));

  // --- sharing with friends -------------------------------------------------
  const circles = store.circles();
  const sharedIn = store.allRecipes().filter((r) => r.sharedFrom).length;
  root.appendChild(section('Sharing recipes with friends', `
    <div class="card pad stack">
      <p class="small muted" style="margin:0">A circle is a shared cookbook. It shares <b>recipes only</b> \u2014 your meal plan, shopping list and pantry never leave your own household.</p>
      <div class="tiny dim">${store.shareableCount()} recipes would be shared. Anything they already have is skipped rather than duplicated.</div>
      ${circles.length ? `<div class="card" style="margin:0">
        ${circles.map((c) => `<div class="lrow" data-circle="${esc(c.id)}">
          <div class="thumb" style="background:var(--bg-3);font-size:17px">\ud83d\udc65</div>
          <div class="grow"><div style="font-weight:650">${esc(c.name)}</div>
            <div class="tiny dim mono truncate">${esc(c.code)} \u00b7 ${c.mode === 'push-only' ? 'sharing out only' : c.mode === 'pull-only' ? 'receiving only' : 'two-way'}</div></div>
          <span class="dim">\u203a</span></div>`).join('')}
      </div>` : ''}
      ${sharedIn ? `<div class="tiny dim">${sharedIn} recipe${sharedIn === 1 ? '' : 's'} shared with you are in your library.</div>` : ''}
      <button class="btn block" data-a="addcircle">\uff0b Start or join a circle</button>
      ${!s.syncUrl ? '<div class="tiny" style="color:var(--warn)">Sharing needs shared sync set up first.</div>' : ''}
    </div>`));

  // --- share to app --------------------------------------------------------
  root.appendChild(section('Sharing recipes into the app', `
    <div class="card pad stack">
      <p class="small muted" style="margin:0">On Android this app shows up in the share sheet once installed. iPhone doesn't allow that for web apps, so there's a one-time Shortcut that does the same job.</p>
      <button class="btn block" data-a="ioshortcut">📲 Set up "Share → ReciMe" on iPhone</button>
      <button class="btn block ghost small" data-a="install">How do I install this on my phone?</button>
    </div>`));

  // --- stores --------------------------------------------------------------
  root.appendChild(section('Stores', `
    <div class="card">
      ${(s.stores || []).map((st) => `<div class="lrow">
        <div class="thumb" style="background:var(--bg-3);font-size:17px">🏪</div>
        <div class="grow"><div style="font-weight:600">${esc(st.name)}</div>
          <div class="tiny dim">Instacart: ${esc(st.slug || 'not set')}${s.defaultStore === st.id ? ' · default' : ''}</div></div>
        <button class="btn xs ghost" data-editstore="${esc(st.id)}">Edit</button>
      </div>`).join('')}
      <div class="lrow"><button class="btn sm ghost" data-a="addstore">＋ Add a store</button></div>
    </div>
    <div class="pad-x" style="margin-top:9px">
      <div class="field"><label>Default for new list items</label>
        <select class="input" data-set="defaultDest">
          <option value="" ${!s.defaultDest ? 'selected' : ''}>Leave undecided</option>
          <option value="in-person" ${s.defaultDest === 'in-person' ? 'selected' : ''}>In person</option>
          <option value="instacart" ${s.defaultDest === 'instacart' ? 'selected' : ''}>Instacart</option>
        </select></div>
    </div>`));

  // --- standing store rules -------------------------------------------------
  const rules = store.storeRules();
  root.appendChild(section('Where things come from', `
    <div class="pad-x" style="margin-bottom:9px">
      <p class="small muted" style="margin:0">Standing rules, applied every time a list is built. Anything you assign by hand on the list itself wins over these.</p>
    </div>
    <div class="card">
      ${rules.length ? rules.map((r) => {
        const st = (s.stores || []).find((x) => x.id === r.store);
        return `<div class="lrow" data-rule="${esc(r.id)}">
          <label class="switch" data-stop><input type="checkbox" data-ruletoggle="${esc(r.id)}" ${r.enabled !== false ? 'checked' : ''}><span class="track"></span><span class="knob"></span></label>
          <div class="grow" style="min-width:0">
            <div style="font-weight:650">${esc(r.label || r.match)}</div>
            <div class="tiny dim truncate">${r.kind === 'aisle' ? 'Whole aisle' : esc(String(r.match).split(',').slice(0, 4).join(', '))}${r.minQty ? ` \u00b7 ${r.minQty}${r.minUnit || 'lb'}+` : ''} \u2192 ${esc(st ? st.name : r.store)}${r.dest === 'instacart' ? ' (Instacart)' : r.dest === 'in-person' ? ' (in person)' : ''}</div>
          </div>
          <span class="dim">\u203a</span>
        </div>`;
      }).join('') : '<div class="lrow"><span class="dim small">No rules yet.</span></div>'}
      <div class="lrow"><button class="btn sm ghost" data-a="addrule">\uff0b Add a rule</button></div>
    </div>
    <div class="pad-x" style="margin-top:9px">
      <div class="field"><label>Notes for whoever builds the cart</label>
        <textarea class="input" id="cartnotes" style="min-height:74px" placeholder="e.g. Buy bulk items from Costco. Skip anything over $15. Prefer store brand for staples.">${esc(s.cartNotes || '')}</textarea>
        <div class="tiny dim">Free text, passed along whenever you hand the list to Claude. Good for one-offs the rules above don't cover.</div>
      </div>
    </div>`));

  // --- who we're feeding ----------------------------------------------------
  const people = store.people();
  const kids = store.children();
  root.appendChild(section('Who we\'re cooking for', `
    <div class="card">
      ${people.map((p) => {
        const et = eatingType(p.eating);
        return `<div class="lrow" data-person="${esc(p.id)}">
          <div class="thumb" style="background:var(--bg-3);font-size:19px">${p.type === 'child' ? '\ud83e\uddd2' : '\ud83e\uddd1'}</div>
          <div class="grow"><div style="font-weight:650">${esc(p.name)}</div>
            <div class="tiny dim">${p.type === 'child' ? `${ageOf(p) != null ? ageOf(p) + ' years old · ' : ''}${et.emoji} ${esc(et.label)}` : `Adult · ${et.emoji} ${esc(et.label)}`}</div>
            ${p.type === 'child' && !p.dob ? '<div class="tiny" style="color:var(--warn,#e0a33e)">Tap to add a birthday — then this ages on its own</div>' : ''}</div>
          <span class="dim">\u203a</span>
        </div>`;
      }).join('')}
      <div class="lrow" style="gap:8px">
        <button class="btn sm ghost" data-a="addadult">\uff0b Adult</button>
        <button class="btn sm ghost" data-a="addchild">\uff0b Child</button>
      </div>
    </div>
    <div class="pad-x" style="margin-top:9px">
      <div class="banner good" style="margin:0">Cooking for <b>${store.householdServings()}</b> portions
      — ${store.adults().length} adult${store.adults().length === 1 ? '' : 's'}${kids.length ? ` and ${kids.length} ${kids.length === 1 ? 'child' : 'children'}, counted by age` : ''}.
      Plans and shopping lists scale to this.</div>
    </div>`));

  // --- planning ------------------------------------------------------------
  root.appendChild(section('How we eat', `
    <div class="pad-x stack">
      <div class="row" style="gap:9px">
        <div class="field grow"><label>Weeknight limit (min)</label>
          <input class="input" type="number" min="10" max="180" step="5" data-set-num="weeknightMaxMinutes" value="${s.weeknightMaxMinutes || 40}"></div>
      </div>
      <div class="field"><label>Meals to plan each day</label>
        <div class="chips wrap" style="padding:0">
          ${['breakfast', 'lunch', 'dinner'].map((m) => `<button class="chip ${(s.planMeals || []).includes(m) ? 'on' : ''}" data-meal="${m}">${m}</button>`).join('')}
        </div></div>
      <div class="field"><label>Anything to avoid</label>
        <div class="chips wrap" style="padding:0">
          ${DIETS.map(([id, label]) => `<button class="chip ${(s.dietPrefs || []).includes(id) ? 'on' : ''}" data-diet="${id}">${label}</button>`).join('')}
        </div></div>
    </div>`));

  // --- notifications --------------------------------------------------------
  const perm = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  root.appendChild(section('Notifications', `
    <div class="card">
      <div class="lrow"><div class="grow"><div>Tell me when something new arrives</div>
        <div class="tiny dim">${perm === 'granted' ? 'Allowed' : perm === 'denied' ? 'Blocked in your browser settings' : perm === 'unsupported' ? 'Not supported here' : 'Not asked yet'}</div></div>
        <label class="switch"><input type="checkbox" data-a="notiftoggle" ${s.notifyEnabled && perm === 'granted' ? 'checked' : ''} ${perm === 'denied' || perm === 'unsupported' ? 'disabled' : ''}><span class="track"></span><span class="knob"></span></label></div>
    </div>
    <div class="pad-x tiny dim" style="margin-top:8px;line-height:1.5">
      Covers recipes ${esc((s.people || []).filter((p) => p.type === 'adult' && p.name !== s.displayName).map((p) => p.name).join(' or ') || 'someone else')} adds, and any recipe sent to you with the 🔔 button.
      These fire while the app is open or warm in the background \u2014 on iPhone that means it has to be installed to your home screen.
      Notifications that arrive out of nowhere with the app fully closed need a push server; ask me and I'll add it.
    </div>`));

  // --- appearance ----------------------------------------------------------
  root.appendChild(section('Appearance', `
    <div class="card">
      <div class="lrow"><span class="grow">Dark theme</span>
        <label class="switch"><input type="checkbox" data-toggle="theme" ${s.theme !== 'light' ? 'checked' : ''}><span class="track"></span><span class="knob"></span></label></div>
      <div class="lrow"><span class="grow">Show price estimates</span>
        <label class="switch"><input type="checkbox" data-toggle="showPrices" ${s.showPrices !== false ? 'checked' : ''}><span class="track"></span><span class="knob"></span></label></div>
    </div>`));

  // --- advanced ------------------------------------------------------------
  root.appendChild(section('Optional extras', `
    <div class="card">
      <div class="lrow" data-a="aikey"><div class="grow"><div>AI recipe reading &amp; chat</div>
        <div class="tiny dim">${s.aiKey ? 'Key saved' : 'Off — video imports and chat use the built-in parser'}</div></div><span class="dim">›</span></div>
      <div class="lrow" data-a="ickey"><div class="grow"><div>Instacart API key</div>
        <div class="tiny dim">${s.instacartKey ? 'Key saved' : 'Not set — Instacart is closed to new sign-ups'}</div></div><span class="dim">›</span></div>
    </div>`));

  // --- data ----------------------------------------------------------------
  root.appendChild(section('Your data', `
    <div class="card">
      <div class="lrow" data-a="export"><span class="grow">Export a backup</span><span class="dim">›</span></div>
      <div class="lrow" data-a="import"><span class="grow">Restore from a backup</span><span class="dim">›</span></div>
      <div class="lrow" data-a="reseed"><span class="grow">Restore the starter recipes</span><span class="dim">›</span></div>
      <div class="lrow" data-a="reset"><span class="grow" style="color:var(--danger)">Erase everything on this device</span><span class="dim">›</span></div>
    </div>
    <div class="pad-x tiny dim" style="margin-top:10px;line-height:1.5">
      Price estimates: ${esc(PRICE_META.region)}, gathered ${esc(PRICE_META.researched)}. Sale prices at ShopRite and Acme typically run 25–40% below these.
      Nutrition figures on imported recipes are estimates.
    </div>
    <div class="pad-x tiny dim" style="margin-top:10px">ReciMe · built for Eric &amp; Dale</div>`));

  wire(root);
  return root;
}

function birthdaySoon(p) {
  const d = daysToBirthday(p);
  if (d == null || d > 30) return '';
  return ` \u00b7 <span style="color:var(--warn)">turns ${(ageOf(p) || 0) + 1} in ${d} day${d === 1 ? '' : 's'}</span>`;
}

function section(title, html) {
  const wrap = el(`<div></div>`);
  wrap.appendChild(el(`<div class="sechead">${esc(title)}<span class="line"></span></div>`));
  const body = el(`<div class="pad-x"></div>`);
  body.innerHTML = html;
  wrap.appendChild(body);
  return wrap;
}

function syncLabelText() {
  switch (store.syncStatus) {
    case 'ok': return 'Synced';
    case 'syncing': return 'Syncing…';
    case 'error': return 'Sync problem';
    default: return store.settings.syncUrl ? 'Connected — not synced yet' : 'This device only';
  }
}

// ---------------------------------------------------------------------------

function wire(root) {
  const nav = window.__recimeNav;
  const s = store.settings;

  on(root, 'change', '[data-set]', (e, t) => store.setSetting(t.dataset.set, t.value));
  on(root, 'change', '[data-set-num]', (e, t) => store.setSetting(t.dataset.setNum, Number(t.value)));
  on(root, 'change', '[data-toggle]', (e, t) => {
    const k = t.dataset.toggle;
    if (k === 'theme') store.setSetting('theme', t.checked ? 'dark' : 'light');
    else store.setSetting(k, t.checked);
    nav.render();
  });
  on(root, 'click', '[data-meal]', (e, t) => {
    const m = t.dataset.meal;
    const cur = s.planMeals || ['dinner'];
    const next = cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m];
    store.setSetting('planMeals', next.length ? next : ['dinner']);
    nav.render();
  });
  on(root, 'click', '[data-diet]', (e, t) => {
    const d = t.dataset.diet;
    const cur = s.dietPrefs || [];
    store.setSetting('dietPrefs', cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]);
    nav.render();
  });

  on(root, 'change', '[data-a="notiftoggle"]', async (e, t) => {
    if (!t.checked) { store.setSetting('notifyEnabled', false); nav.render(); return; }
    let p = Notification.permission;
    if (p === 'default') p = await Notification.requestPermission();
    if (p === 'granted') {
      store.setSetting('notifyEnabled', true);
      const reg = await navigator.serviceWorker?.getRegistration();
      const opts = { body: "This is what a new recipe will look like.", icon: './icons/icon-192.png' };
      if (reg) reg.showNotification('ReciMe notifications are on', opts); else new Notification('ReciMe notifications are on', opts);
    } else {
      store.setSetting('notifyEnabled', false);
      toast('Your browser blocked notifications', 'err');
    }
    nav.render();
  });

  on(root, 'click', '[data-circle]', (e, t) => openCircle(t.dataset.circle));
  on(root, 'click', '[data-a="addcircle"]', () => openCircle(null));

  on(root, 'click', '[data-rule]', (e, t) => { if (e.target.closest('[data-stop]')) return; openRule(t.dataset.rule); });
  on(root, 'change', '[data-ruletoggle]', (e, t) => {
    const list = store.storeRules().map((r) => (r.id === t.dataset.ruletoggle ? { ...r, enabled: t.checked } : r));
    store.saveStoreRules(list);
  });
  on(root, 'click', '[data-a="addrule"]', () => openRule(null));
  const notes = $('#cartnotes', root);
  if (notes) notes.addEventListener('blur', () => {
    if (notes.value !== (store.settings.cartNotes || '')) { store.setSetting('cartNotes', notes.value); toast('Notes saved'); }
  });

  on(root, 'click', '[data-person]', (e, t) => openPerson(t.dataset.person));
  on(root, 'click', '[data-a="addadult"]', () => openPerson(null, 'adult'));
  on(root, 'click', '[data-a="addchild"]', () => openPerson(null, 'child'));

  on(root, 'click', '[data-a="setupsync"]', openSyncSetup);
  on(root, 'click', '[data-a="syncnow"]', async () => { await pushDirty(store); await pullRemote(store); toast('Synced', 'ok'); });
  on(root, 'click', '[data-a="invite"]', openInvite);
  on(root, 'click', '[data-a="ioshortcut"]', openIosShortcut);
  on(root, 'click', '[data-a="install"]', openInstallHelp);
  on(root, 'click', '[data-a="addstore"]', () => openStore(null));
  on(root, 'click', '[data-editstore]', (e, t) => openStore(t.dataset.editstore));
  on(root, 'click', '[data-a="aikey"]', () => openKey('aiKey', 'AI key',
    'Paste an Anthropic API key. It is stored on this device and used by your own backend function — it never goes anywhere else. This turns on video-caption recipe reading and smarter chat answers.'));
  on(root, 'click', '[data-a="ickey"]', () => openKey('instacartKey', 'Instacart API key',
    'Instacart closed new developer sign-ups, so most people will not have one of these. If you get access later, paste the key here for one-tap cart building.'));

  on(root, 'click', '[data-a="export"]', () => {
    downloadFile(`recime-backup-${new Date().toISOString().slice(0, 10)}.json`, store.exportJSON());
    toast('Backup downloaded', 'ok');
  });
  on(root, 'click', '[data-a="import"]', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json,.json';
    input.onchange = async () => {
      const f = input.files[0]; if (!f) return;
      try { store.importJSON(await f.text()); toast('Restored', 'ok'); }
      catch (err) { toast(String(err.message || err), 'err'); }
    };
    input.click();
  });
  on(root, 'click', '[data-a="reseed"]', () => {
    for (const k of Object.keys(store.state.meta)) if (k.startsWith('removed:')) delete store.state.meta[k];
    store.topUpSeeds(); store.emit('reseed'); toast('Starter recipes restored', 'ok');
  });
  on(root, 'click', '[data-a="reset"]', async () => {
    if (await confirmSheet('Erase everything?', 'All recipes, plans and lists on this device will be deleted. If sync is on, this device will re-download from the cloud.', { danger: true, okLabel: 'Erase' })) {
      localStorage.removeItem('recime.state.v1');
      location.reload();
    }
  });
}

// ---------------------------------------------------------------------------

function openCircle(id) {
  const circles = store.circles();
  const c = id ? circles.find((x) => x.id === id)
    : { id: uid('cir'), name: '', code: 'circle-' + Math.random().toString(36).slice(2, 9), mode: 'both' };

  sheet(id ? c.name || 'Circle' : 'Recipe circle', `<div class="pad stack">
    <p class="small muted" style="margin:0">Everyone who enters the same circle code sees each other's recipes. Nothing else is shared \u2014 not your plan, not your shopping list.</p>

    <div class="field"><label>What's it called?</label>
      <input class="input" id="cn" value="${esc(c.name)}" placeholder="e.g. The Recchias &amp; friends"></div>

    <div class="field"><label>Circle code</label>
      <input class="input mono" id="cc" value="${esc(c.code)}" autocomplete="off" style="font-size:13px">
      <div class="tiny dim">Send this to whoever you're sharing with \u2014 they enter the same code. Anyone with it can see and add recipes, so pick something not guessable.</div></div>

    <div class="field"><label>Direction</label>
      <div class="segment" id="cm">
        <button data-m="both" class="${c.mode === 'both' ? 'on' : ''}">Two-way</button>
        <button data-m="push-only" class="${c.mode === 'push-only' ? 'on' : ''}">Share out</button>
        <button data-m="pull-only" class="${c.mode === 'pull-only' ? 'on' : ''}">Receive</button>
      </div>
      <div class="tiny dim">Two-way is the usual one. "Share out" publishes yours without pulling theirs in.</div></div>

    <div class="banner info" style="margin:0">Individual recipes can be kept out of every circle \u2014 open a recipe, tap \u22ef, and mark it private.</div>

    <div class="row">
      ${id ? '<button class="btn danger" data-a="del">Leave</button>' : ''}
      <button class="btn grow primary" data-a="save">${id ? 'Save' : 'Create circle'}</button>
    </div>
    ${id ? '<button class="btn block" data-a="invite">\ud83d\udce8 Copy the invite</button>' : ''}
  </div>`, {
    onMount(root, close) {
      let mode = c.mode;
      on(root, 'click', '#cm button', (e, t) => {
        mode = t.dataset.m;
        for (const b of root.querySelectorAll('#cm button')) b.classList.toggle('on', b.dataset.m === mode);
      });
      on(root, 'click', '[data-a="save"]', async () => {
        const name = $('#cn', root).value.trim() || 'Recipe circle';
        const code = $('#cc', root).value.trim();
        if (!code) { toast('Needs a code', 'err'); return; }
        const next = { ...c, name, code, mode };
        store.saveCircles(id ? circles.map((x) => (x.id === id ? next : x)) : [...circles, next]);
        close(); window.__recimeNav.render();
        toast('Syncing recipes…');
        await pushToCircles(store);
        const got = await pullFromCircles(store);
        toast(got ? `${got} recipe${got === 1 ? '' : 's'} came in` : 'Your recipes are shared', 'ok');
        window.__recimeNav.render();
      });
      on(root, 'click', '[data-a="del"]', () => {
        store.saveCircles(circles.filter((x) => x.id !== id));
        // Their recipes go with them.
        for (const r of store.allRecipes()) {
          if (r.sharedFrom?.circleId === id) { r.deleted = true; r.updatedAt = new Date().toISOString(); }
        }
        store.saveNow();
        close(); window.__recimeNav.render(); toast('Left the circle');
      });
      on(root, 'click', '[data-a="invite"]', async () => {
        const text = `Add our recipe app:\n\n1. Open ${location.origin}${location.pathname} in Safari and Add to Home Screen\n2. In the app: More \u2192 Sharing recipes with friends \u2192 Start or join a circle\n3. Enter this code exactly:\n\n${c.code}\n\nYou'll see our recipes and we'll see yours. Shopping lists and meal plans stay private to each household.`;
        await copyText(text); close(); toast('Invite copied', 'ok');
      });
    },
  });
}

function openRule(id) {
  const rules = store.storeRules();
  const stores = store.settings.stores || [];
  const r = id ? rules.find((x) => x.id === id)
    : { id: uid('rule'), kind: 'keyword', match: '', store: stores[0]?.id || '', dest: 'instacart', label: '', enabled: true };

  sheet(id ? 'Edit rule' : 'New rule', `<div class="pad stack">
    <div class="field"><label>Name it</label>
      <input class="input" id="rl" value="${esc(r.label || '')}" placeholder="e.g. Paper goods & household"></div>

    <div class="field"><label>Match on</label>
      <div class="segment" id="rkind">
        <button data-k="keyword" class="${r.kind === 'keyword' ? 'on' : ''}">Item names</button>
        <button data-k="aisle" class="${r.kind === 'aisle' ? 'on' : ''}">A whole aisle</button>
      </div></div>

    <div class="field" id="rkw" ${r.kind === 'aisle' ? 'style="display:none"' : ''}>
      <label>Words to look for</label>
      <textarea class="input" id="rm" style="min-height:70px" placeholder="toilet paper, paper towel, trash bag">${esc(r.kind === 'aisle' ? '' : r.match || '')}</textarea>
      <div class="tiny dim">Comma separated. Partial matches count — "chicken" catches chicken thighs and chicken breast.</div>
    </div>

    <div class="field" id="rai" ${r.kind === 'aisle' ? '' : 'style="display:none"'}>
      <label>Aisle</label>
      <select class="input" id="ra">${AISLE_ORDER.map((a) => `<option ${r.match === a ? 'selected' : ''}>${a}</option>`).join('')}</select>
    </div>

    <div class="row" style="gap:9px">
      <div class="field grow"><label>Only if at least</label>
        <input class="input" id="rq" type="number" min="0" step="0.5" value="${r.minQty || ''}" placeholder="any amount"></div>
      <div class="field grow"><label>of</label>
        <select class="input" id="ru">
          ${['lb', 'oz', 'cup', 'each'].map((u) => `<option ${(r.minUnit || 'lb') === u ? 'selected' : ''}>${u}</option>`).join('')}
        </select></div>
    </div>
    <div class="tiny dim" style="margin-top:-6px">Leave blank for any amount. This is how "big packs of chicken go to Costco" works.</div>

    <div class="field"><label>Send it to</label>
      <div class="chips wrap" style="padding:0" id="rst">
        ${stores.map((st) => `<button class="chip ${r.store === st.id ? 'on' : ''}" data-s="${esc(st.id)}">${esc(st.name)}</button>`).join('')}
      </div></div>

    <div class="field"><label>How</label>
      <div class="segment" id="rdest">
        <button data-d="instacart" class="${r.dest === 'instacart' ? 'on' : ''}">Instacart</button>
        <button data-d="in-person" class="${r.dest === 'in-person' ? 'on' : ''}">In person</button>
      </div></div>

    <div class="row">
      ${id ? '<button class="btn danger" data-a="del">Delete</button>' : ''}
      <button class="btn grow primary" data-a="save">Save rule</button>
    </div>
  </div>`, {
    onMount(root, close) {
      let kind = r.kind, storeId = r.store, dest = r.dest;
      on(root, 'click', '#rkind button', (e, t) => {
        kind = t.dataset.k;
        for (const b of root.querySelectorAll('#rkind button')) b.classList.toggle('on', b.dataset.k === kind);
        $('#rkw', root).style.display = kind === 'keyword' ? '' : 'none';
        $('#rai', root).style.display = kind === 'aisle' ? '' : 'none';
      });
      on(root, 'click', '#rst .chip', (e, t) => {
        storeId = t.dataset.s;
        for (const c of root.querySelectorAll('#rst .chip')) c.classList.toggle('on', c.dataset.s === storeId);
      });
      on(root, 'click', '#rdest button', (e, t) => {
        dest = t.dataset.d;
        for (const b of root.querySelectorAll('#rdest button')) b.classList.toggle('on', b.dataset.d === dest);
      });
      on(root, 'click', '[data-a="save"]', () => {
        const match = kind === 'aisle' ? $('#ra', root).value : $('#rm', root).value.trim();
        if (!match) { toast('Give it something to match on', 'err'); return; }
        if (!storeId) { toast('Pick a store', 'err'); return; }
        const q = $('#rq', root).value;
        const next = {
          ...r, kind, match, store: storeId, dest,
          label: $('#rl', root).value.trim() || (kind === 'aisle' ? match : match.split(',')[0]),
          minQty: q === '' ? undefined : Number(q),
          minUnit: q === '' ? undefined : $('#ru', root).value,
          enabled: r.enabled !== false,
        };
        store.saveStoreRules(id ? rules.map((x) => (x.id === id ? next : x)) : [...rules, next]);
        close(); window.__recimeNav.render();
      });
      on(root, 'click', '[data-a="del"]', () => {
        store.saveStoreRules(rules.filter((x) => x.id !== id));
        close(); window.__recimeNav.render();
      });
    },
  });
}

function openPerson(id, newType) {
  const people = store.people();
  const p = id ? people.find((x) => x.id === id) : { id: uid('per'), name: '', type: newType || 'adult', age: null, eating: 'everything' };
  const isChild = p.type === 'child';

  sheet(id ? p.name || 'Edit person' : (isChild ? 'Add a child' : 'Add an adult'), `<div class="pad stack">
    <div class="field"><label>Name</label>
      <input class="input" id="pn" value="${esc(p.name)}" placeholder="${isChild ? 'e.g. Nina' : 'e.g. Eric'}" autocomplete="off"></div>

    <div class="field"><label>Adult or child?</label>
      <div class="segment" id="ptype">
        <button data-t="adult" class="${p.type === 'adult' ? 'on' : ''}">Adult</button>
        <button data-t="child" class="${p.type === 'child' ? 'on' : ''}">Child</button>
      </div></div>

    <div class="field" id="agefield" ${p.type === 'child' ? '' : 'style="display:none"'}>
      <label>Birthday</label>
      <input class="input" id="pdob" type="date" max="${new Date().toISOString().slice(0, 10)}" value="${esc(p.dob || '')}">
      <div class="tiny dim">Give a birthday and the app ages them on its own — portions grow, toddler
        food-safety notes drop away, and you never have to come back and edit this.</div>
      <label style="margin-top:10px">Or just an age</label>
      <input class="input" id="pa" type="number" min="0" max="21" value="${p.age != null ? p.age : ''}" placeholder="e.g. 6">
      <div class="tiny dim">Used to work out portion sizes — a six-year-old doesn't eat an adult serving.
        A birthday, if you give one, wins over this.</div>
    </div>

    <div class="field"><label>How they eat</label>
      <div class="chips wrap" style="padding:0" id="peat">
        ${EATING_TYPES.map((e) => `<button class="chip ${p.eating === e.id ? 'on' : ''}" data-e="${e.id}">${e.emoji} ${e.label}</button>`).join('')}
      </div>
      <div class="tiny dim">The pickier someone is, the more the app leans toward meals everyone will actually eat.</div>
    </div>

    <div class="field"><label>Foods they won't touch (optional)</label>
      <input class="input" id="pd" value="${esc((p.dislikes || []).join(', '))}" placeholder="mushrooms, olives, anything spicy" autocomplete="off">
      <div class="tiny dim">Comma separated. Recipes built around these get pushed down the list.</div>
    </div>

    <div class="row">
      ${id && people.length > 1 ? '<button class="btn danger" data-a="del">Remove</button>' : ''}
      <button class="btn grow primary" data-a="save">Save</button>
    </div>
  </div>`, {
    onMount(root, close) {
      let type = p.type;
      let eating = p.eating;
      on(root, 'click', '#ptype button', (e, t) => {
        type = t.dataset.t;
        for (const b of root.querySelectorAll('#ptype button')) b.classList.toggle('on', b.dataset.t === type);
        $('#agefield', root).style.display = type === 'child' ? '' : 'none';
      });
      on(root, 'click', '#peat .chip', (e, t) => {
        eating = t.dataset.e;
        for (const c of root.querySelectorAll('#peat .chip')) c.classList.toggle('on', c.dataset.e === eating);
      });
      on(root, 'click', '[data-a="save"]', () => {
        const name = $('#pn', root).value.trim();
        if (!name) { toast('Needs a name', 'err'); return; }
        const ageRaw = $('#pa', root)?.value || '';
        const dob = $('#pdob', root)?.value || '';
        const next = {
          ...p, name, type, eating,
          dob: type === 'child' ? dob : '',
          dobNeeded: type === 'child' && !dob,
          age: type === 'child' && ageRaw !== '' ? Number(ageRaw) : null,
          dislikes: $('#pd', root).value.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean),
        };
        const list = id ? people.map((x) => (x.id === id ? next : x)) : [...people, next];
        store.savePeople(list);
        close(); window.__recimeNav.render();
      });
      on(root, 'click', '[data-a="del"]', () => {
        store.savePeople(people.filter((x) => x.id !== id));
        close(); window.__recimeNav.render();
      });
    },
  });
}

function openSyncSetup() {
  const s = store.settings;
  sheet('Shared sync', `<div class="pad stack">
    <p class="small muted" style="margin:0">Both phones point at the same free Supabase project. Setup is about ten minutes, once. The full walkthrough is in the SETUP guide that came with the app.</p>
    <div class="field"><label>Project URL</label>
      <input class="input" id="s-url" value="${esc(s.syncUrl)}" placeholder="https://abcdefg.supabase.co" inputmode="url" autocomplete="off"></div>
    <div class="field"><label>Anon public key</label>
      <textarea class="input" id="s-key" style="min-height:80px;font-size:12px" placeholder="eyJhbGci…">${esc(s.syncKey)}</textarea></div>
    <div class="field"><label>Household code</label>
      <input class="input" id="s-house" value="${esc(s.household)}" autocomplete="off">
      <div class="tiny dim">Both of you must use the exact same code. That's what pairs your two phones.</div></div>
    <div class="field"><label>Your name (so you know who added what)</label>
      <input class="input" id="s-name" value="${esc(s.displayName || '')}" placeholder="Eric or Dale"></div>
    <button class="btn primary block" data-a="save">Save and connect</button>
    ${s.syncUrl ? '<button class="btn block danger" data-a="off">Turn sync off</button>' : ''}
  </div>`, {
    onMount(root, close) {
      on(root, 'click', '[data-a="save"]', async () => {
        store.setSetting('syncUrl', $('#s-url', root).value.trim().replace(/\/+$/, ''));
        store.setSetting('syncKey', $('#s-key', root).value.trim());
        store.setSetting('household', $('#s-house', root).value.trim() || store.settings.household);
        store.setSetting('displayName', $('#s-name', root).value.trim());
        close();
        toast('Connecting…');
        store.lastPull = null;
        const n = await pullRemote(store);
        for (const kind of ['recipes', 'plans', 'shopping', 'pantry']) {
          for (const id of Object.keys(store.state[kind])) store.markDirty({ recipes: 'recipe', plans: 'plan', shopping: 'shop', pantry: 'pantry' }[kind], id);
        }
        await pushDirty(store);
        startSync(store);
        toast(store.syncStatus === 'error' ? 'Could not connect — check the URL and key' : 'Connected 🎉', store.syncStatus === 'error' ? 'err' : 'ok');
      });
      on(root, 'click', '[data-a="off"]', () => {
        store.setSetting('syncUrl', ''); store.setSetting('syncKey', '');
        close(); toast('Sync off');
      });
    },
  });
}

function openInvite() {
  const s = store.settings;
  const text = `Add our recipe app on your phone:

1. Open ${location.origin}${location.pathname} in Safari
2. Tap Share, then "Add to Home Screen"
3. Open it, go to More → Set up shared sync
4. Enter exactly:

Project URL: ${s.syncUrl}
Household code: ${s.household}

Key:
${s.syncKey}`;
  sheet('Invite Dale', `<div class="pad stack">
    <p class="small muted" style="margin:0">Send her this. Once she pastes the same three things in, you'll both be looking at the same list.</p>
    <textarea class="input" style="min-height:220px;font-size:12px" readonly>${esc(text)}</textarea>
    <button class="btn primary block" data-a="copy">📋 Copy</button>
    <button class="btn block" data-a="share">Share…</button>
  </div>`, {
    onMount(root, close) {
      on(root, 'click', '[data-a="copy"]', async () => { await copyText(text); close(); toast('Copied', 'ok'); });
      on(root, 'click', '[data-a="share"]', async () => {
        close();
        if (navigator.share) { try { await navigator.share({ title: 'ReciMe', text }); } catch (e) { /* canceled */ } }
        else { await copyText(text); toast('Copied', 'ok'); }
      });
    },
  });
}

function openIosShortcut() {
  const base = location.origin + location.pathname;
  sheet('Share → ReciMe on iPhone', `<div class="pad stack">
    <p class="small muted" style="margin:0">Apple doesn't let web apps appear in the share sheet, but a Shortcut can stand in for one. Five minutes, once.</p>
    <ol class="small" style="margin:0;padding-left:20px;line-height:1.75">
      <li>Open the <b>Shortcuts</b> app and tap <b>＋</b></li>
      <li>Add a <b>Text</b> action. Type this into it, exactly:<br>
        <code style="display:block;background:var(--bg-3);padding:8px;border-radius:8px;margin:6px 0;font-size:11.5px;word-break:break-all">${esc(base)}?url=</code>
        then tap at the end and insert the <b>Shortcut Input</b> variable right after the <code>=</code></li>
      <li>Add an <b>Open URLs</b> action underneath, and set its input to that Text</li>
      <li>Tap the shortcut name at the top → <b>Details</b> → turn on <b>Show in Share Sheet</b></li>
      <li>Under <b>Share Sheet Types</b>, leave only <b>URLs</b> and <b>Safari web pages</b> ticked</li>
      <li>Rename it <b>Save to ReciMe</b> and tap Done</li>
    </ol>
    <div class="banner info" style="margin:0">Now: in Safari, TikTok or Instagram, tap Share → scroll down → <b>Save to ReciMe</b>. The recipe opens ready to save. (It opens in Safari rather than the installed app — that's an Apple limitation, and the recipe still lands in your library because both are synced.)</div>
    <button class="btn primary block" data-a="copyurl">📋 Copy the URL for step 2</button>
  </div>`, {
    onMount(root, close) {
      on(root, 'click', '[data-a="copyurl"]', async () => { await copyText(base + '?url='); toast('Copied', 'ok'); });
    },
  });
}

function openInstallHelp() {
  sheet('Put it on your home screen', `<div class="pad stack">
    <div><div style="font-weight:700;margin-bottom:5px">iPhone / iPad</div>
      <div class="small muted">Open this page in <b>Safari</b> → tap the Share button → <b>Add to Home Screen</b> → Add. It then runs full screen with no browser bars, works offline, and keeps its data permanently.</div></div>
    <div><div style="font-weight:700;margin-bottom:5px">Android</div>
      <div class="small muted">Chrome will offer <b>Install app</b>, or use the ⋮ menu → <b>Add to Home screen</b>. Once installed, ReciMe appears directly in the share sheet — sharing a recipe link to it just works.</div></div>
    <div><div style="font-weight:700;margin-bottom:5px">Mac</div>
      <div class="small muted">Safari → File → <b>Add to Dock</b>. Or just bookmark it in any browser.</div></div>
  </div>`);
}

function openStore(id) {
  const stores = store.settings.stores || [];
  const st = id ? stores.find((x) => x.id === id) : { id: uid('st'), name: '', slug: '' };
  sheet(id ? 'Edit store' : 'Add a store', `<div class="pad stack">
    <div class="field"><label>Name</label><input class="input" id="st-name" value="${esc(st.name)}" placeholder="ShopRite"></div>
    <div class="field"><label>Instacart store slug</label>
      <input class="input" id="st-slug" value="${esc(st.slug || '')}" placeholder="shoprite" autocomplete="off">
      <div class="tiny dim">Find it in the address bar on Instacart: instacart.com/store/<b>this-bit</b>/storefront</div></div>
    <div class="row-between card pad"><span>Make this the default</span>
      <label class="switch"><input type="checkbox" id="st-def" ${store.settings.defaultStore === st.id ? 'checked' : ''}><span class="track"></span><span class="knob"></span></label></div>
    <div class="row">
      ${id ? '<button class="btn danger" data-a="del">Remove</button>' : ''}
      <button class="btn grow primary" data-a="save">Save</button>
    </div>
  </div>`, {
    onMount(root, close) {
      on(root, 'click', '[data-a="save"]', () => {
        const name = $('#st-name', root).value.trim();
        if (!name) { toast('Needs a name', 'err'); return; }
        const next = { ...st, name, slug: $('#st-slug', root).value.trim() };
        const list = id ? stores.map((x) => (x.id === id ? next : x)) : [...stores, next];
        store.setSetting('stores', list);
        if ($('#st-def', root).checked) store.setSetting('defaultStore', next.id);
        close(); window.__recimeNav.render();
      });
      on(root, 'click', '[data-a="del"]', () => {
        store.setSetting('stores', stores.filter((x) => x.id !== id));
        close(); window.__recimeNav.render();
      });
    },
  });
}

function openKey(field, title, blurb) {
  sheet(title, `<div class="pad stack">
    <p class="small muted" style="margin:0">${esc(blurb)}</p>
    <div class="field"><label>Key</label>
      <textarea class="input" id="k-v" style="min-height:80px;font-size:12px" placeholder="sk-…">${esc(store.settings[field] || '')}</textarea></div>
    <button class="btn primary block" data-a="save">Save</button>
    ${store.settings[field] ? '<button class="btn block danger" data-a="clear">Remove key</button>' : ''}
  </div>`, {
    onMount(root, close) {
      on(root, 'click', '[data-a="save"]', () => {
        store.setSetting(field, $('#k-v', root).value.trim());
        close(); window.__recimeNav.render(); toast('Saved', 'ok');
      });
      on(root, 'click', '[data-a="clear"]', () => { store.setSetting(field, ''); close(); window.__recimeNav.render(); });
    },
  });
}
