// ---------------------------------------------------------------------------
// ui.js — tiny DOM layer: no framework, just helpers that keep views readable
// ---------------------------------------------------------------------------
import { esc, recipeArt, fmtQty } from './util.js';

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function frag(html) {
  const t = document.createElement('template');
  t.innerHTML = html;
  return t.content;
}

export function $(sel, root = document) { return root.querySelector(sel); }
export function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

/** Event delegation: on(root, 'click', '[data-x]', handler) */
export function on(root, type, sel, fn) {
  root.addEventListener(type, (e) => {
    const t = e.target.closest(sel);
    if (t && root.contains(t)) fn(e, t);
  });
}

// --- Toast -----------------------------------------------------------------
let toastTimer;
export function toast(msg, kind = '') {
  const old = $('.toast'); if (old) old.remove();
  const t = el(`<div class="toast ${kind}">${esc(msg)}</div>`);
  document.body.appendChild(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .25s'; setTimeout(() => t.remove(), 260); }, kind === 'err' ? 4200 : 2400);
}

// --- Sheet (bottom modal) --------------------------------------------------
export function sheet(title, bodyHtml, { onMount, wide } = {}) {
  const scrim = el(`<div class="scrim"><div class="sheet" role="dialog" aria-modal="true">
    <div class="sheet-grip"></div>
    ${title ? `<h2>${esc(title)}</h2>` : ''}
    <div class="sheet-body"></div>
  </div></div>`);
  $('.sheet-body', scrim).innerHTML = bodyHtml;
  scrim.addEventListener('click', (e) => { if (e.target === scrim) close(); });
  function close() {
    scrim.style.opacity = '0'; scrim.style.transition = 'opacity .15s';
    setTimeout(() => scrim.remove(), 150);
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', onKey);
  document.body.appendChild(scrim);
  hydrateImages(scrim);
  if (onMount) onMount(scrim, close);
  return { el: scrim, close };
}

export function confirmSheet(title, message, { danger = false, okLabel = 'Confirm' } = {}) {
  return new Promise((resolve) => {
    const s = sheet(title, `
      <div class="pad"><p class="muted" style="margin-top:0">${esc(message)}</p>
      <div class="row" style="margin-top:16px">
        <button class="btn grow" data-a="no">Cancel</button>
        <button class="btn grow ${danger ? 'danger' : 'primary'}" data-a="yes">${esc(okLabel)}</button>
      </div></div>`, {
      onMount(root, close) {
        on(root, 'click', '[data-a]', (e, t) => { close(); resolve(t.dataset.a === 'yes'); });
      },
    });
    s.el.addEventListener('click', (e) => { if (e.target === s.el) resolve(false); });
  });
}

export function promptSheet(title, { label = '', value = '', placeholder = '', multiline = false, okLabel = 'Save' } = {}) {
  return new Promise((resolve) => {
    const s = sheet(title, `
      <div class="pad stack">
        <div class="field">
          ${label ? `<label>${esc(label)}</label>` : ''}
          ${multiline
            ? `<textarea class="input" id="pv" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`
            : `<input class="input" id="pv" value="${esc(value)}" placeholder="${esc(placeholder)}">`}
        </div>
        <div class="row">
          <button class="btn grow" data-a="no">Cancel</button>
          <button class="btn grow primary" data-a="yes">${esc(okLabel)}</button>
        </div>
      </div>`, {
      onMount(root, close) {
        const input = $('#pv', root);
        setTimeout(() => input.focus(), 60);
        on(root, 'click', '[data-a]', (e, t) => {
          const v = input.value;
          close(); resolve(t.dataset.a === 'yes' ? v : null);
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !multiline) { const v = input.value; close(); resolve(v); }
        });
      },
    });
    s.el.addEventListener('click', (e) => { if (e.target === s.el) resolve(null); });
  });
}

// --- Recipe artwork --------------------------------------------------------
export function artStyle(r) {
  const a = recipeArt(r);
  return `background:linear-gradient(${a.angle}deg,${a.a},${a.b})`;
}

/**
 * Card art is 122px tall — asking the CDN for an 800px-wide photo to paint it
 * is four times the bytes for no visible gain. The hero keeps the big one.
 */
export function thumbUrl(url, width = 420) {
  if (typeof url !== 'string' || url.startsWith('data:')) return url;
  if (!/images\.pexels\.com/.test(url)) return url;
  return url.replace(/([?&]w=)\d+/, '$1' + width);
}

export function artHtml(r, cls = 'art') {
  const a = recipeArt(r);
  const style = `background:linear-gradient(${a.angle}deg,${a.a},${a.b})`;
  // The gradient + emoji sit underneath, so a photo that fails to load just
  // falls away to the artwork instead of leaving a broken box.
  //
  // The src is held in data-src and handed over by hydrateImages() below.
  // Chrome's own loading="lazy" turned out to defer these forever inside our
  // scrolling container — 141 cards, not one request — so we do it ourselves.
  if (r.image) {
    return `<div class="${cls}" style="${style}"><span class="artemoji">${a.emoji}</span>` +
      `<img data-src="${esc(thumbUrl(r.image))}" alt="" decoding="async" class="lazy" onerror="this.remove()"></div>`;
  }
  return `<div class="${cls}" style="${style}">${a.emoji}</div>`;
}

let imgObserver = null;

/**
 * Load photos as they come near the screen. Anything already in view (or
 * within a screen's reach of it) starts immediately, so the grid is never
 * blank while you're looking at it.
 */
export function hydrateImages(root = document) {
  const imgs = root.querySelectorAll('img.lazy[data-src]');
  if (!imgs.length) return;

  const load = (img) => {
    if (!img.dataset.src) return;
    img.src = img.dataset.src;
    delete img.dataset.src;
    img.classList.remove('lazy');
    img.classList.add('loading-in');
    img.addEventListener('load', () => img.classList.add('shown'), { once: true });
  };

  if (!('IntersectionObserver' in window)) { imgs.forEach(load); return; }

  if (!imgObserver) {
    imgObserver = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        imgObserver.unobserve(e.target);
        load(e.target);
      }
    }, { rootMargin: '600px 0px', threshold: 0 });
  }
  imgs.forEach((img) => imgObserver.observe(img));

  // Belt and braces: anything sitting in the viewport right now gets loaded
  // outright, in case the observer's first callback is slow to arrive.
  requestAnimationFrame(() => {
    for (const img of imgs) {
      if (!img.dataset.src) continue;
      const b = img.getBoundingClientRect();
      if (b.top < window.innerHeight + 200 && b.bottom > -200) load(img);
    }
  });
}

export function starsHtml(n) {
  if (!n) return '';
  return `<span class="stars">${'★'.repeat(n)}</span>`;
}

// --- Long press ------------------------------------------------------------
export function longPress(root, sel, fn, ms = 480) {
  let timer = null, fired = false;
  const start = (e) => {
    const t = e.target.closest(sel);
    if (!t) return;
    fired = false;
    timer = setTimeout(() => { fired = true; if (navigator.vibrate) navigator.vibrate(12); fn(e, t); }, ms);
  };
  const cancel = () => { clearTimeout(timer); };
  root.addEventListener('touchstart', start, { passive: true });
  root.addEventListener('touchend', cancel);
  root.addEventListener('touchmove', cancel, { passive: true });
  root.addEventListener('mousedown', start);
  root.addEventListener('mouseup', cancel);
  root.addEventListener('mouseleave', cancel);
  root.addEventListener('click', (e) => { if (fired) { e.preventDefault(); e.stopPropagation(); fired = false; } }, true);
}

// --- Clipboard -------------------------------------------------------------
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e2) { /* ignore */ }
    ta.remove();
    return ok;
  }
}

export function downloadFile(name, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function emptyState(emoji, title, body, actionHtml = '') {
  return `<div class="empty-state"><div class="e">${emoji}</div><h3>${esc(title)}</h3>
    <p class="small" style="max-width:34ch;margin:0 auto 14px">${esc(body)}</p>${actionHtml}</div>`;
}
