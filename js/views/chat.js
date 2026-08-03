// ---------------------------------------------------------------------------
// views/chat.js — "what are we in the mood for" / "what can I make right now"
// ---------------------------------------------------------------------------
import store from '../store.js';
import { el, on, artStyle, toast, sheet, emptyState, $, thumbUrl } from '../ui.js';
import { esc, recipeArt, fmtMinutes, totalMinutes, nowISO, normName } from '../util.js';
import { parseQuery, searchRecipes, describeQuery, SUGGESTED_PROMPTS, aiChat, pantryMatch } from '../chat.js';
import { generatePlan } from '../planner.js';
import { addRecipeToList } from './shop.js';
import { ymd, weekStartOf } from '../util.js';

export default function renderChat() {
  const nav = window.__recimeNav;
  const root = el(`<div class="screen chatwrap" style="overflow:hidden"></div>`);
  const log = store.state.chat || (store.state.chat = []);

  root.appendChild(el(`<div class="topbar">
    <div class="topbar-row">
      <h1>Ask</h1>
      <button class="btn sm ghost" data-a="pantry">🧺 My pantry</button>
      ${log.length ? '<button class="btn sm ghost" data-a="clear">Clear</button>' : ''}
    </div>
    <div class="sub">Tell me what you feel like, or what's in the fridge</div>
  </div>`));

  const logEl = el(`<div class="chatlog"></div>`);
  if (!log.length) {
    logEl.appendChild(el(`<div class="bubble bot">Hi — what are we thinking?<br><br>
      You can ask me for a mood ("something cozy and vegetarian"), a constraint ("under 30 minutes, no shellfish"),
      or just tell me what you've got: <i>"I have chicken thighs, a lemon and some rice"</i>.</div>`));
    logEl.appendChild(el(`<div class="chips wrap" style="padding:4px 0">
      ${SUGGESTED_PROMPTS.map((p) => `<button class="chip sm" data-prompt="${esc(p)}">${esc(p)}</button>`).join('')}
    </div>`));
  }
  for (const m of log) logEl.appendChild(bubble(m));
  root.appendChild(logEl);

  root.appendChild(el(`<div class="chatbar">
    <textarea id="cin" rows="1" placeholder="What are you in the mood for?" enterkeyhint="send"></textarea>
    <button class="send" data-a="send" aria-label="Send">↑</button>
  </div>`));

  // --- events --------------------------------------------------------------
  const input = $('#cin', root);
  const autosize = () => { input.style.height = 'auto'; input.style.height = Math.min(108, input.scrollHeight) + 'px'; };
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); }
  });

  on(root, 'click', '[data-a="send"]', () => send(input.value));
  on(root, 'click', '[data-prompt]', (e, t) => send(t.dataset.prompt));
  on(root, 'click', '[data-open]', (e, t) => nav.openRecipe(t.dataset.open));
  on(root, 'click', '[data-a="pantry"]', () => openPantry());
  on(root, 'click', '[data-a="clear"]', () => { store.state.chat = []; store.save(); nav.render(); });
  on(root, 'click', '[data-act]', (e, t) => runAction(t.dataset.act, t.dataset.arg));

  setTimeout(() => { logEl.scrollTop = logEl.scrollHeight; }, 30);

  function send(text) {
    const q = String(text || '').trim();
    if (!q) return;
    input.value = ''; autosize();
    push({ role: 'me', text: q });
    respond(q);
  }

  function push(m) {
    m.at = nowISO();
    store.state.chat.push(m);
    if (store.state.chat.length > 60) store.state.chat = store.state.chat.slice(-60);
    store.save();
    logEl.appendChild(bubble(m));
    logEl.scrollTop = logEl.scrollHeight;
  }

  async function respond(text) {
    const recipes = store.allRecipes();
    const q = parseQuery(text);

    // Pull pantry items in automatically when they ask "what can I make"
    if (/what can i (make|cook)|whats for|what should we (make|eat|cook)/i.test(text) && !q.pantry.length) {
      const pantry = store.pantryList().map((p) => p.name);
      if (pantry.length) { q.pantry = pantry.map(normName); q.pantryMode = true; }
    }

    if (q.intent === 'plan') {
      const weekKey = ymd(weekStartOf(new Date()));
      const p = generatePlan(recipes, {
        weekStart: weekKey, days: store.settings.planDays || 7,
        meals: store.settings.planMeals || ['dinner'],
        servings: store.householdServings(),
        weeknightMax: store.settings.weeknightMaxMinutes || 40,
        dietPrefs: store.settings.dietPrefs || [],
      });
      store.savePlan(p);
      push({ role: 'bot', text: 'Done — I put together a week based on what you two have liked. Have a look and swap anything.', actions: [{ label: 'Open the plan', act: 'goplan' }] });
      return;
    }

    let results = searchRecipes(recipes, q, { limit: 8 });

    if (q.intent === 'surprise' && !results.length) {
      results = recipes.slice().sort(() => Math.random() - 0.5).slice(0, 5).map((r) => ({ recipe: r, score: 1 }));
    }

    const intro = describeQuery(q, results.length);
    push({ role: 'bot', text: intro, results: results.map((r) => ({ id: r.recipe.id, pct: r.pantry?.pct, missing: (r.pantry?.coreMissing || []).map((m) => m.item).slice(0, 4) })) });

    // Offer to use the AI backend if it's configured and results were thin
    if (results.length < 2 && store.settings.aiKey && store.settings.syncUrl) {
      try {
        const ai = await aiChat([{ role: 'user', content: text }], recipes, store.settings);
        if (ai && ai.reply) push({ role: 'bot', text: ai.reply });
      } catch (e) { /* stay quiet — the local answer already went out */ }
    }
  }

  function runAction(act, arg) {
    if (act === 'goplan') nav.go('plan', { top: true });
    if (act === 'golist') nav.go('shop', { top: true });
    if (act === 'addlist') {
      const r = store.recipe(arg);
      if (r) addRecipeToList(r, store.householdServings() || r.servings);
    }
  }

  return root;
}

function bubble(m) {
  if (m.role === 'me') return el(`<div class="bubble me">${esc(m.text)}</div>`);
  const wrap = el(`<div class="bubble bot"></div>`);
  wrap.innerHTML = m.text.replace(/</g, '&lt;').replace(/\n/g, '<br>');
  if (m.results && m.results.length) {
    const cards = el(`<div class="minicards"></div>`);
    for (const res of m.results) {
      const r = store.recipe(res.id);
      if (!r) continue;
      cards.appendChild(el(`<div class="minicard" data-open="${esc(r.id)}">
        <div class="ma" style="${artStyle(r)}">${r.image ? `<img data-src="${esc(thumbUrl(r.image, 240))}" alt="" decoding="async" class="lazy" onerror="this.remove()">` : recipeArt(r).emoji}</div>
        <div class="grow" style="min-width:0">
          <div style="font-weight:650;font-size:14px;line-height:1.25">${esc(r.title)}</div>
          <div class="tiny dim">${fmtMinutes(totalMinutes(r))}${r.nutritionPerServing?.calories ? ` · ${r.nutritionPerServing.calories} cal` : ''}${
            res.pct != null ? ` · you have ${res.pct}% of it` : ''}</div>
          ${res.missing && res.missing.length ? `<div class="tiny" style="color:var(--warn)">need: ${esc(res.missing.join(', '))}</div>` : ''}
        </div>
        <span class="dim">›</span>
      </div>`));
    }
    wrap.appendChild(cards);
  }
  if (m.actions && m.actions.length) {
    wrap.appendChild(el(`<div class="row" style="margin-top:10px;gap:8px">
      ${m.actions.map((a) => `<button class="btn xs" data-act="${esc(a.act)}" data-arg="${esc(a.arg || '')}">${esc(a.label)}</button>`).join('')}
    </div>`));
  }
  return wrap;
}

// ---------------------------------------------------------------------------

function openPantry() {
  const items = store.pantryList();
  const body = `<div class="pad stack">
    <p class="small muted" style="margin:0">Tell me what's usually in the house and I'll factor it in when you ask what to make.</p>
    <div class="row" style="gap:8px">
      <input class="input grow" id="pnew" placeholder="e.g. eggs, rice, frozen peas" autocomplete="off">
      <button class="btn primary" data-a="add">Add</button>
    </div>
    <div class="chips wrap" style="padding:0" id="plist">
      ${items.length
        ? items.map((p) => `<button class="chip" data-rm="${esc(p.key)}">${esc(p.name)} ✕</button>`).join('')
        : '<span class="small dim">Nothing yet.</span>'}
    </div>
    ${items.length ? '<button class="btn block" data-a="whatcan">🍳 What can I make right now?</button>' : ''}
    <div class="divider"></div>
    <div class="small muted">Quick add</div>
    <div class="chips wrap" style="padding:0">
      ${['eggs', 'milk', 'butter', 'rice', 'pasta', 'onion', 'garlic', 'canned tomatoes', 'chicken breast', 'ground beef', 'frozen peas', 'cheddar', 'greek yogurt', 'olive oil', 'black beans', 'tortillas', 'spinach', 'potatoes', 'carrots', 'lemon']
        .map((s) => `<button class="chip sm" data-quick="${esc(s)}">＋ ${esc(s)}</button>`).join('')}
    </div>
  </div>`;

  sheet('🧺 What we have', body, {
    onMount(root, close) {
      const add = (v) => {
        for (const part of String(v).split(/,|\band\b/)) {
          const s = part.trim();
          if (s) store.addPantry(s);
        }
        close(); openPantry();
      };
      on(root, 'click', '[data-a="add"]', () => add($('#pnew', root).value));
      $('#pnew', root).addEventListener('keydown', (e) => { if (e.key === 'Enter') add(e.target.value); });
      on(root, 'click', '[data-quick]', (e, t) => { store.addPantry(t.dataset.quick); close(); openPantry(); });
      on(root, 'click', '[data-rm]', (e, t) => { store.removePantry(t.dataset.rm); close(); openPantry(); });
      on(root, 'click', '[data-a="whatcan"]', () => {
        close();
        const names = store.pantryList().map((p) => p.name).join(', ');
        const input = $('#cin');
        if (input) { input.value = 'What can I make with ' + names + '?'; input.dispatchEvent(new Event('input')); input.focus(); }
      });
    },
  });
}
