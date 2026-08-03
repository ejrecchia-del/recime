// ---------------------------------------------------------------------------
// app.js — router, tab bar, and the "something was shared to us" intake
// ---------------------------------------------------------------------------
import store, { startSync, pullRemote } from './store.js';
import { $, el, on, toast, hydrateImages } from './ui.js';
import { extractUrl } from './parse.js';

import renderRecipes from './views/recipes.js';
import renderDetail from './views/detail.js';
import renderPlan from './views/plan.js';
import renderShop from './views/shop.js';
import renderChat from './views/chat.js';
import renderSettings from './views/settings.js';
import { openImportSheet } from './views/import.js';

const TABS = [
  { id: 'recipes', label: 'Recipes', icon: '📖' },
  { id: 'chat', label: 'Ask', icon: '💬' },
  { id: 'plan', label: 'Plan', icon: '🗓️' },
  { id: 'shop', label: 'Shopping', icon: '🛒' },
  { id: 'settings', label: 'More', icon: '⚙️' },
];

export const app = {
  tab: 'recipes',
  detailId: null,
  scrollMemory: {},
  filters: { q: '', favorites: false, family: false, shared: false, tags: [], meal: '', sort: 'recent' },
};

const viewEl = () => $('#view');

// Views reach the router through this rather than importing app.js back,
// which would make the module graph circular.
window.__recimeNav = { app, go, openRecipe, closeDetail, render };

export function go(tab, opts = {}) {
  if (app.tab === tab && !opts.force && !app.detailId) return;
  const cur = $('.screen');
  if (cur && !app.detailId) app.scrollMemory[app.tab] = cur.scrollTop;
  app.detailId = null;
  app.tab = tab;
  render();
  const s = $('.screen');
  if (s) s.scrollTop = opts.top ? 0 : (app.scrollMemory[tab] || 0);
  syncHash();
}

export function openRecipe(id) {
  const cur = $('.screen');
  if (cur && !app.detailId) app.scrollMemory[app.tab] = cur.scrollTop;
  app.detailId = id;
  render();
  const s = $('.screen'); if (s) s.scrollTop = 0;
  syncHash();
}

export function closeDetail() {
  app.detailId = null;
  render();
  const s = $('.screen'); if (s) s.scrollTop = app.scrollMemory[app.tab] || 0;
  syncHash();
}

function syncHash() {
  const h = app.detailId ? `#/recipe/${app.detailId}` : `#/${app.tab}`;
  if (location.hash !== h) history.replaceState(null, '', h);
}

export function render() {
  const v = viewEl();
  if (!v) return;
  document.documentElement.dataset.theme = store.settings.theme === 'light' ? 'light' : 'dark';

  if (app.detailId) {
    const r = store.recipe(app.detailId);
    if (!r || r.deleted) { app.detailId = null; }
    else { v.innerHTML = ''; v.appendChild(renderDetail(r)); renderNav(); hydrateImages(v); return; }
  }

  v.innerHTML = '';
  let node;
  switch (app.tab) {
    case 'chat': node = renderChat(); break;
    case 'plan': node = renderPlan(); break;
    case 'shop': node = renderShop(); break;
    case 'settings': node = renderSettings(); break;
    default: node = renderRecipes();
  }
  v.appendChild(node);
  renderNav();
  hydrateImages(v);
}

function renderNav() {
  const nav = $('#nav');
  const unchecked = store.shoppingItems().filter((i) => !i.have && !i.checked).length;
  const fresh = store.newRecipes().length + store.inboxNudges().length;
  nav.innerHTML = TABS.map((t) => {
    const on = app.tab === t.id && !app.detailId;
    const n = t.id === 'shop' ? unchecked : t.id === 'recipes' ? fresh : 0;
    const badge = n ? `<span class="badge">${n > 99 ? '99+' : n}</span>` : '';
    return `<button data-tab="${t.id}" class="${on ? 'on' : ''}">${badge}<span class="ic">${t.icon}</span>${t.label}</button>`;
  }).join('');
}

// --- Shared-in content ------------------------------------------------------
// Android share target lands on /?url=...&text=...&title=...
// The iOS Shortcut lands on the same place.
function handleIncomingShare() {
  const p = new URLSearchParams(location.search);
  const url = p.get('url') || extractUrl(p.get('text') || '') || '';
  const text = p.get('text') || '';
  const title = p.get('title') || '';
  if (!url && !text) return false;
  // Clean the query string so a refresh doesn't re-trigger it
  history.replaceState(null, '', location.pathname + location.hash);
  setTimeout(() => openImportSheet({ url, text, title, auto: true }), 220);
  return true;
}

// --- Boot -------------------------------------------------------------------
function boot() {
  store.load();

  // Restore route from the hash
  const h = location.hash || '';
  const m = h.match(/^#\/recipe\/(.+)$/);
  if (m) app.detailId = decodeURIComponent(m[1]);
  else {
    const t = h.replace('#/', '');
    if (TABS.some((x) => x.id === t)) app.tab = t;
  }

  render();

  on($('#nav'), 'click', '[data-tab]', (e, t) => go(t.dataset.tab, { top: false }));

  let knownNudges = new Set(Object.keys(store.state.nudges || {}));
  let knownRecipes = new Set(Object.keys(store.state.recipes || {}));

  store.subscribe((reason) => {
    if (reason === 'sync') { updateSyncDot(); return; }
    if (reason === 'sync:changed' || reason === 'circles:changed') {
      notifyAboutArrivals(knownNudges, knownRecipes);
      knownNudges = new Set(Object.keys(store.state.nudges || {}));
      knownRecipes = new Set(Object.keys(store.state.recipes || {}));
    }
    render();
  });

  handleIncomingShare();
  window.addEventListener('hashchange', () => {
    const mm = (location.hash || '').match(/^#\/recipe\/(.+)$/);
    if (mm) { app.detailId = decodeURIComponent(mm[1]); render(); }
  });

  if (store.settings.syncUrl && store.settings.syncKey) startSync(store);

  // Ask the browser to keep our data around (iOS grants this readily for
  // home-screen web apps).
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  window.addEventListener('online', () => { if (store.settings.syncUrl) pullRemote(store); });
}

/**
 * Fire a notification when something new arrives from the other phone.
 *
 * Honest limitation: this is a *local* notification raised while the app is
 * running or warm in the background. True out-of-nowhere push needs the Push
 * API and a server to send it — see notes in SETUP.md.
 */
async function notifyAboutArrivals(knownNudges, knownRecipes) {
  if (!store.settings.notifyEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const me = (store.settings.displayName || '').toLowerCase();

  const newNudges = Object.values(store.state.nudges || {})
    .filter((n) => !knownNudges.has(n.id) && !n.seen
      && (!n.to || n.to.toLowerCase() === me) && (n.from || '').toLowerCase() !== me);

  const newRecipes = Object.values(store.state.recipes || {})
    .filter((r) => !knownRecipes.has(r.id) && !r.seed && !r.deleted
      && (r.addedBy || r.sharedFrom?.by || '').toLowerCase() !== me);

  const show = async (title, body, tag) => {
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const opts = { body, tag, icon: './icons/icon-192.png', badge: './icons/icon-192.png' };
      if (reg) await reg.showNotification(title, opts);
      else new Notification(title, opts);
    } catch (e) { /* notifications are a nicety, never a hard failure */ }
  };

  for (const n of newNudges.slice(0, 3)) {
    const r = store.state.recipes[n.recipeId];
    await show(`${n.from} sent you a recipe`, `${r ? r.title : 'A recipe'}${n.note ? ' — ' + n.note : ''}`, 'nudge-' + n.id);
  }
  if (!newNudges.length && newRecipes.length) {
    const first = newRecipes[0];
    await show(
      newRecipes.length === 1 ? 'New recipe added' : `${newRecipes.length} new recipes`,
      newRecipes.length === 1 ? `${first.title}${first.addedBy ? ' — added by ' + first.addedBy : ''}` : 'Open ReciMe to see them',
      'newrecipes');
  }
}

function updateSyncDot() {
  for (const d of document.querySelectorAll('.syncdot')) {
    d.className = 'syncdot ' + store.syncStatus;
  }
  const label = document.querySelector('[data-sync-label]');
  if (label) label.textContent = syncLabel();
}

export function syncLabel() {
  switch (store.syncStatus) {
    case 'ok': return 'Synced';
    case 'syncing': return 'Syncing…';
    case 'error': return 'Sync problem';
    default: return 'This device only';
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

// Expose a couple of things for the console / debugging
window.ReciMe = { store, go, openRecipe, render };
