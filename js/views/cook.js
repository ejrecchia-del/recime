// ---------------------------------------------------------------------------
// views/cook.js — hands-free, one-step-at-a-time cooking
//
// Big type, screen stays awake, timers pulled out of the step text, and the
// ingredients each step needs shown right there so you're not scrolling back.
// ---------------------------------------------------------------------------
import store from '../store.js';
import { el, on, toast, $, $$ } from '../ui.js';
import { openWhoAte } from './detail.js';
import { esc, fmtAmount, normName } from '../util.js';

let wakeLock = null;
let activeTimers = [];

export function openCookMode(recipe, servings) {
  const factor = (servings || recipe.servings || 4) / (recipe.servings || 4);
  const steps = (recipe.steps || []).filter(Boolean);
  if (!steps.length) { toast('This recipe has no steps yet'); return; }

  let i = 0;
  const overlay = el(`<div class="cook"></div>`);
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  requestWakeLock();

  function stepIngredients(text) {
    const t = text.toLowerCase();
    return (recipe.ingredients || []).filter((ing) => {
      const n = normName(ing.item);
      if (!n || n.length < 3) return false;
      if (t.includes(n)) return true;
      const head = n.split(' ').filter((w) => w.length > 3);
      return head.some((w) => t.includes(w));
    });
  }

  function draw() {
    const text = steps[i];
    const needs = stepIngredients(text);
    const timers = findTimers(text);
    const pct = ((i + 1) / steps.length) * 100;

    overlay.innerHTML = `
      <div class="chead">
        <button class="btn icon ghost" data-a="close" aria-label="Exit">✕</button>
        <div class="grow truncate" style="font-weight:650">${esc(recipe.title)}</div>
        <button class="btn sm ghost" data-a="all">All steps</button>
      </div>
      <div class="progress"><div class="fill" style="width:${pct}%"></div></div>
      <div class="cbody">
        <div class="stepno">Step ${i + 1} of ${steps.length}</div>
        <div class="steptext">${esc(text)}</div>
        ${needs.length ? `<div class="needbox">
          <h4>For this step</h4>
          ${needs.map((n) => `<div class="row" style="gap:8px;padding:3px 0">
            <span style="font-weight:700;color:var(--accent-2);min-width:74px" class="mono">${esc(fmtAmount((Number(n.quantity) || 0) * factor, n.unit))}</span>
            <span class="grow">${esc(n.item)}${n.notes ? ` <span class="dim small">${esc(n.notes)}</span>` : ''}</span>
          </div>`).join('')}
        </div>` : ''}
        ${timers.length ? `<div class="row" style="gap:9px;flex-wrap:wrap">
          ${timers.map((t, ti) => `<button class="timer" data-timer="${t.seconds}" data-tid="t${i}_${ti}">⏲ ${esc(t.label)}</button>`).join('')}
        </div>` : ''}
        <div style="flex:1"></div>
      </div>
      <div class="cfoot">
        <button class="btn ${i === 0 ? '' : ''}" data-a="prev" ${i === 0 ? 'disabled' : ''}>‹ Back</button>
        ${i < steps.length - 1
          ? `<button class="btn primary grow" data-a="next">Next step ›</button>`
          : `<button class="btn primary grow" data-a="done">✓ Done — we ate it</button>`}
      </div>`;
  }

  function close() {
    stopAllTimers();
    releaseWakeLock();
    overlay.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight' || e.key === ' ') { if (i < steps.length - 1) { i++; draw(); } }
    if (e.key === 'ArrowLeft') { if (i > 0) { i--; draw(); } }
  }
  document.addEventListener('keydown', onKey);

  on(overlay, 'click', '[data-a="close"]', close);
  on(overlay, 'click', '[data-a="prev"]', () => { if (i > 0) { i--; draw(); } });
  on(overlay, 'click', '[data-a="next"]', () => { if (i < steps.length - 1) { i++; draw(); } });
  on(overlay, 'click', '[data-a="done"]', () => {
    store.markCooked(recipe.id);
    close();
    // Right after dinner is the only moment anyone will actually answer this,
    // so ask now rather than burying it in a menu.
    if (store.people().length > 1) setTimeout(() => openWhoAte(recipe.id), 250);
    else toast('Nice. Logged it 🍽️', 'ok');
  });
  on(overlay, 'click', '[data-a="all"]', () => showAllSteps(recipe, (n) => { i = n; draw(); }));
  on(overlay, 'click', '[data-timer]', (e, t) => startTimer(t, Number(t.dataset.timer)));

  // swipe between steps
  let x0 = null;
  overlay.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  overlay.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 65) {
      if (dx < 0 && i < steps.length - 1) { i++; draw(); }
      else if (dx > 0 && i > 0) { i--; draw(); }
    }
    x0 = null;
  });

  // iOS drops the wake lock when you switch away; grab it again on return
  document.addEventListener('visibilitychange', reacquire);
  function reacquire() { if (document.visibilityState === 'visible' && document.body.contains(overlay)) requestWakeLock(); }

  draw();
}

function showAllSteps(recipe, jump) {
  const s = el(`<div class="scrim"><div class="sheet">
    <div class="sheet-grip"></div><h2>All steps</h2>
    <div class="pad" style="padding-top:0">
      ${(recipe.steps || []).map((st, n) => `<div class="steprow" data-jump="${n}" style="cursor:pointer">
        <div class="n">${n + 1}</div><div class="t">${esc(st)}</div></div>`).join('')}
    </div></div></div>`);
  s.addEventListener('click', (e) => {
    const j = e.target.closest('[data-jump]');
    if (j) { jump(Number(j.dataset.jump)); s.remove(); return; }
    if (e.target === s) s.remove();
  });
  document.body.appendChild(s);
}

// --- Timers ----------------------------------------------------------------

export function findTimers(text) {
  const out = [];
  const re = /(\d+)\s*(?:to|–|-|or)?\s*(\d+)?\s*(hour|hr|minute|min|second|sec)s?\b/gi;
  let m;
  while ((m = re.exec(text))) {
    const a = Number(m[1]); const b = m[2] ? Number(m[2]) : null;
    const n = b ? Math.round((a + b) / 2) : a;
    const unit = m[3].toLowerCase();
    let secs = n;
    if (unit.startsWith('min')) secs = n * 60;
    else if (unit.startsWith('hour') || unit.startsWith('hr')) secs = n * 3600;
    if (secs < 20 || secs > 6 * 3600) continue;
    const label = b ? `${a}–${b} ${unit}${b > 1 ? 's' : ''}` : `${a} ${unit}${a > 1 ? 's' : ''}`;
    if (!out.some((t) => t.seconds === secs)) out.push({ seconds: secs, label });
    if (out.length >= 3) break;
  }
  return out;
}

function startTimer(btn, seconds) {
  if (btn._iv) { // tap again to cancel
    clearInterval(btn._iv); btn._iv = null;
    btn.classList.remove('running', 'done');
    btn.textContent = btn._orig;
    return;
  }
  btn._orig = btn.textContent;
  let left = seconds;
  btn.classList.add('running');
  const tick = () => {
    const m = Math.floor(left / 60), s = left % 60;
    btn.textContent = `⏲ ${m}:${String(s).padStart(2, '0')}`;
    if (left <= 0) {
      clearInterval(btn._iv); btn._iv = null;
      btn.classList.remove('running'); btn.classList.add('done');
      btn.textContent = '⏰ Time!';
      ding();
      if (navigator.vibrate) navigator.vibrate([300, 120, 300, 120, 300]);
      toast('Timer finished', 'ok');
      return;
    }
    left--;
  };
  tick();
  btn._iv = setInterval(tick, 1000);
  activeTimers.push(btn);
}

function stopAllTimers() {
  for (const b of activeTimers) if (b._iv) clearInterval(b._iv);
  activeTimers = [];
}

function ding() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.42;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      o.start(t); o.stop(t + 0.36);
    }
    setTimeout(() => ctx.close(), 2000);
  } catch (e) { /* audio blocked, the vibration still fires */ }
}

// --- Wake lock -------------------------------------------------------------
async function requestWakeLock() {
  try {
    if (!('wakeLock' in navigator)) return;
    if (wakeLock && !wakeLock.released) return;
    wakeLock = await navigator.wakeLock.request('screen');
  } catch (e) { /* not fatal — the screen will just dim */ }
}

function releaseWakeLock() {
  try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) { /* ignore */ }
}
