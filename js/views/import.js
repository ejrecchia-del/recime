// ---------------------------------------------------------------------------
// views/import.js — getting recipes in: shared link, pasted text, or by hand
// ---------------------------------------------------------------------------
import store from '../store.js';
import { el, on, toast, sheet, $ } from '../ui.js';
import { esc, fmtQty, uid } from '../util.js';
import { AISLE_ORDER } from '../store.js';
import {
  importFromUrl, parseRecipeText, normaliseImported, isVideoUrl, hostOf,
  estimateNutrition, guessCategory, extractUrl, parseIngredientLine,
  findPhotos,
} from '../parse.js';

export function openImportSheet({ url = '', text = '', title = '', auto = false } = {}) {
  const sharedUrl = url || extractUrl(text);
  const body = `<div class="pad stack">
    <div class="segment" id="tabs">
      <button data-t="link" class="on">Link</button>
      <button data-t="paste">Paste</button>
      <button data-t="manual">By hand</button>
    </div>

    <div data-pane="link" class="stack">
      <div class="field"><label>Recipe or video link</label>
        <input class="input" id="m-url" value="${esc(sharedUrl)}" placeholder="https://…" inputmode="url" autocomplete="off"></div>
      <button class="btn primary block" data-a="fetch">Get the recipe</button>
      <div id="m-status" class="small dim"></div>
      <div class="tiny dim">Recipe sites work straight away. TikTok, Instagram and YouTube links pull from the caption or description, which usually has the recipe in it.</div>
    </div>

    <div data-pane="paste" class="stack hidden">
      <div class="field"><label>Paste the whole recipe</label>
        <textarea class="input" id="m-text" style="min-height:180px" placeholder="Paste the title, ingredients and steps — I'll sort them out.">${esc(text && !sharedUrl ? text : '')}</textarea></div>
      <button class="btn primary block" data-a="parse">Sort this out</button>
    </div>

    <div data-pane="manual" class="stack hidden">
      <button class="btn primary block" data-a="blank">Start from a blank recipe</button>
    </div>
  </div>`;

  sheet('Add a recipe', body, {
    onMount(root, close) {
      on(root, 'click', '#tabs button', (e, t) => {
        for (const b of root.querySelectorAll('#tabs button')) b.classList.toggle('on', b === t);
        for (const p of root.querySelectorAll('[data-pane]')) p.classList.toggle('hidden', p.dataset.pane !== t.dataset.t);
      });

      const status = $('#m-status', root);
      let lastCaption = '';

      async function doFetch() {
        const u = $('#m-url', root).value.trim();
        if (!u) { toast('Paste a link first', 'err'); return; }
        status.innerHTML = `<span class="spinner"></span> Reading ${esc(hostOf(u) || 'the page')}…`;
        try {
          const data = await importFromUrl(u, store.settings);
          close();
          if (data.oversized) {
            toast('That page had several recipes on it — trim what you don\u2019t want', 'err');
          }
          openEditSheet(data, { isNew: true });
        } catch (err) {
          if (/returned 40[13]|returned 429|returned 5\d\d/.test(err.message || '')) {
            status.innerHTML = `<span style="color:var(--warn)">That site blocks automatic reading — a lot of the big
              recipe networks do (AllRecipes, EatingWell, Serious Eats).</span>
              <div class="small dim" style="margin-top:6px">Open the page, select the recipe, copy it, and use the
              Paste tab — it takes about ten seconds and works every time.</div>
              <div style="margin-top:8px" class="row">
                <a class="btn sm" href="${esc(u)}" target="_blank" rel="noopener">Open the page \u2197</a>
                <button class="btn sm primary" data-a="fallback">Paste it in</button>
              </div>`;
            return;
          }
          if (err.code === 'needs-backend') {
            status.innerHTML = '';
            close();
            noBackendSheet(u);
            return;
          }
          // We got the words but couldn't shape them — drop them straight into
          // the Paste box so it's one tap rather than a trip to the browser.
          if (err.caption) {
            lastCaption = err.caption;
            status.innerHTML = `<span style="color:var(--warn)">I read the post but couldn't pick the recipe out of it cleanly.</span>
              <div class="small dim" style="margin-top:6px">I've put the caption in the Paste box — tidy it and save.</div>
              <div style="margin-top:8px"><button class="btn sm primary" data-a="fallback">Open it in Paste</button></div>`;
            return;
          }
          if (/facebook|instagram/i.test(err.message || '') || /facebook\.com|fb\.watch|instagram\.com/i.test(u)) {
            status.innerHTML = `<span style="color:var(--warn)">Facebook and Instagram don't let a server read a post
              directly. I try their public embed first, and for most public reels that works — this one it didn't.</span>
              <div class="small dim" style="margin-top:6px">Open the reel, press and hold the caption, copy it, and
              paste it here. The app reads caption-style recipes properly now.</div>
              <div style="margin-top:8px" class="row">
                <a class="btn sm" href="${esc(u)}" target="_blank" rel="noopener">Open the post \u2197</a>
                <button class="btn sm primary" data-a="fallback">Paste it in</button>
              </div>`;
            return;
          }
          status.innerHTML = `<span style="color:var(--danger)">${esc(err.message || 'Could not read that page')}</span>
            <div style="margin-top:8px"><button class="btn sm" data-a="fallback">Paste it in instead</button></div>`;
        }
      }

      on(root, 'click', '[data-a="fetch"]', doFetch);
      on(root, 'click', '[data-a="fallback"]', () => {
        for (const b of root.querySelectorAll('#tabs button')) b.classList.toggle('on', b.dataset.t === 'paste');
        for (const p of root.querySelectorAll('[data-pane]')) p.classList.toggle('hidden', p.dataset.pane !== 'paste');
        const box = $('#m-text', root);
        if (box && lastCaption && !box.value.trim()) { box.value = lastCaption; box.focus(); }
      });

      on(root, 'click', '[data-a="parse"]', () => {
        const txt = $('#m-text', root).value.trim();
        if (!txt) { toast('Nothing to read', 'err'); return; }
        const data = parseRecipeText(txt, { title, sourceUrl: sharedUrl });
        if (!data.nutritionPerServing && data.ingredients.length) data.nutritionPerServing = estimateNutrition(data);
        close();
        openEditSheet(data, { isNew: true });
      });

      on(root, 'click', '[data-a="blank"]', () => {
        close();
        openEditSheet({ title: '', ingredients: [], steps: [], servings: Math.max(2, Math.round(store.householdServings())) }, { isNew: true });
      });

      // Shared in from the OS — go straight to work
      if (auto && sharedUrl) setTimeout(doFetch, 120);
      else if (auto && text) {
        for (const b of root.querySelectorAll('#tabs button')) b.classList.toggle('on', b.dataset.t === 'paste');
        for (const p of root.querySelectorAll('[data-pane]')) p.classList.toggle('hidden', p.dataset.pane !== 'paste');
      }
    },
  });
}

function noBackendSheet(url) {
  sheet('This phone isn\'t connected yet', `<div class="pad stack">
    <p class="muted small" style="margin:0">Reading a recipe off a webpage has to happen on a server — a browser isn't allowed to fetch another site directly. <b>That server is already built and running.</b> This phone just hasn't been pointed at it yet.</p>
    <p class="muted small" style="margin:0">It's a one-time job: <b>More → Set up shared sync</b>, then enter the project URL, key and household code from your setup guide. Takes about a minute, and it switches on sharing between phones at the same time.</p>
    <button class="btn primary block" data-a="connect">Connect this phone</button>
    <div class="divider" style="margin:2px 0"></div>
    <p class="muted small" style="margin:0">Or do it the manual way right now: open the link, copy the recipe text, and paste it in.</p>
    <a class="btn block" href="${esc(url)}" target="_blank" rel="noopener">Open the link ↗</a>
    <button class="btn block" data-a="paste">Paste it in</button>
  </div>`, {
    onMount(root, close) {
      on(root, 'click', '[data-a="paste"]', () => { close(); openImportSheet({ text: '', url: '' }); });
      on(root, 'click', '[data-a="connect"]', () => { close(); window.__recimeNav.go('settings', { top: true }); setTimeout(() => document.querySelector('[data-a="setupsync"]')?.click(), 260); });
    },
  });
}

// ---------------------------------------------------------------------------
// The editor — also used for editing an existing recipe
// ---------------------------------------------------------------------------

export function openEditSheet(data, { isNew = false } = {}) {
  const r = JSON.parse(JSON.stringify(data));
  r.ingredients = r.ingredients || [];
  r.steps = r.steps || [];

  const body = `<div class="pad stack">
    <div class="field"><label>Title</label>
      <input class="input" id="e-title" value="${esc(r.title || '')}" placeholder="What is it?"></div>
    <div class="field"><label>One-line description</label>
      <input class="input" id="e-desc" value="${esc(r.description || '')}" placeholder="Optional"></div>

    <div class="row" style="gap:9px">
      <div class="field grow"><label>Serves</label><input class="input" id="e-serv" type="number" min="1" max="30" value="${r.servings || 4}"></div>
      <div class="field grow"><label>Prep (min)</label><input class="input" id="e-prep" type="number" min="0" value="${r.prepMinutes || 0}"></div>
      <div class="field grow"><label>Cook (min)</label><input class="input" id="e-cook" type="number" min="0" value="${r.cookMinutes || 0}"></div>
    </div>
    <div class="row" style="gap:9px">
      <div class="field grow"><label>Meal</label><select class="input" id="e-meal">
        ${['dinner', 'lunch', 'breakfast', 'side', 'snack', 'dessert'].map((m) => `<option ${r.mealType === m ? 'selected' : ''}>${m}</option>`).join('')}
      </select></div>
      <div class="field grow"><label>Cuisine</label><select class="input" id="e-cuisine">
        ${['American', 'Italian', 'Mexican', 'Mediterranean', 'Greek', 'Thai', 'Chinese', 'Japanese', 'Korean', 'Indian', 'Middle Eastern', 'Vietnamese', 'Spanish', 'French', 'Caribbean', 'Other']
          .map((c) => `<option ${r.cuisine === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select></div>
    </div>

    <div class="field"><label>Ingredients — one per line</label>
      <textarea class="input" id="e-ing" style="min-height:170px" placeholder="1 1/2 lbs chicken thighs&#10;2 cups brown rice&#10;3 cloves garlic, minced">${esc(
        r.ingredients.map((i) => `${fmtQty(i.quantity)} ${i.unit || ''} ${i.item}${i.notes ? ', ' + i.notes : ''}`.replace(/\s+/g, ' ').trim()).join('\n'))}</textarea>
      <div class="tiny dim">I'll work out the amounts, units and grocery aisles.</div></div>

    <div class="field"><label>Steps — one per line</label>
      <textarea class="input" id="e-steps" style="min-height:170px" placeholder="Heat the oven to 425°F.&#10;Toss everything on a sheet pan.">${esc(r.steps.join('\n'))}</textarea></div>

    <div class="field"><label>Photo</label>
      <div id="e-photo" class="photopick">${r.image
        ? `<img src="${esc(r.image)}" alt="">`
        : '<span class="dim small">Looking for one…</span>'}</div>
      <div class="row" style="gap:7px;margin-top:7px">
        <button type="button" class="btn sm ghost grow" data-a="findphoto">🔎 Find a photo</button>
        <button type="button" class="btn sm ghost" data-a="nextphoto">Try another</button>
      </div>
      <input class="input" id="e-img" value="${esc(r.image || '')}" placeholder="…or paste an image link" style="margin-top:7px;font-size:12px"></div>

    <div class="row">
      <button class="btn grow" data-a="cancel">Cancel</button>
      <button class="btn grow primary" data-a="save">${isNew ? 'Save recipe' : 'Save changes'}</button>
    </div>
  </div>`;

  sheet(isNew ? 'Check it over' : 'Edit recipe', body, {
    onMount(root, close) {
      // --- photo -----------------------------------------------------------
      // A pasted recipe arrives with no picture, so go and find one without
      // being asked. The first hit is applied; "Try another" cycles the rest.
      let photoPool = [];
      let photoAt = 0;
      const photoBox = $('#e-photo', root);
      const imgField = $('#e-img', root);

      const showPhoto = (url) => {
        imgField.value = url || '';
        photoBox.innerHTML = url ? `<img src="${esc(url)}" alt="">` : '<span class="dim small">No photo</span>';
      };

      const lookUp = async (explicit) => {
        const q = $('#e-title', root).value.trim();
        if (!q) { toast('Give it a title first', 'err'); return; }
        photoBox.innerHTML = '<span class="dim small"><span class="spinner"></span> Looking…</span>';
        const found = await findPhotos(q, store.settings);
        if (!found) {
          photoBox.innerHTML = '<span class="dim small">Couldn\'t find one — paste a link below</span>';
          if (explicit) toast('No photo found', 'err');
          return;
        }
        photoPool = found.photos;
        photoAt = 0;
        photoCredit = { credit: found.credit, license: found.license, source: photoPool[0].source, match: 'close' };
        showPhoto(photoPool[0].image);
      };

      let photoCredit = r.imageCredit || null;
      on(root, 'click', '[data-a="findphoto"]', () => lookUp(true));
      on(root, 'click', '[data-a="nextphoto"]', () => {
        if (!photoPool.length) { lookUp(true); return; }
        photoAt = (photoAt + 1) % photoPool.length;
        if (photoCredit) photoCredit.source = photoPool[photoAt].source;
        showPhoto(photoPool[photoAt].image);
      });
      imgField.addEventListener('input', () => {
        photoBox.innerHTML = imgField.value.trim()
          ? `<img src="${esc(imgField.value.trim())}" alt="">`
          : '<span class="dim small">No photo</span>';
      });
      if (!r.image) setTimeout(() => lookUp(false), 150);

      on(root, 'click', '[data-a="cancel"]', close);
      on(root, 'click', '[data-a="save"]', () => {
        const title = $('#e-title', root).value.trim();
        if (!title) { toast('It needs a title', 'err'); return; }

        const ingredients = $('#e-ing', root).value.split('\n')
          .map((l) => l.trim()).filter(Boolean)
          .map((l) => parseIngredientLine(l)).filter(Boolean);
        const steps = $('#e-steps', root).value.split('\n').map((s) => s.trim()).filter(Boolean);

        const next = {
          ...r,
          title,
          description: $('#e-desc', root).value.trim(),
          servings: Number($('#e-serv', root).value) || 4,
          prepMinutes: Number($('#e-prep', root).value) || 0,
          cookMinutes: Number($('#e-cook', root).value) || 0,
          mealType: $('#e-meal', root).value,
          cuisine: $('#e-cuisine', root).value,
          image: $('#e-img', root).value.trim(),
          imageCredit: $('#e-img', root).value.trim() ? photoCredit : null,
          ingredients,
          steps,
        };
        if (!next.nutritionPerServing && ingredients.length) next.nutritionPerServing = estimateNutrition(next);

        let saved;
        if (isNew || !r.id) { saved = store.addRecipe(next); }
        else { saved = store.updateRecipe(r.id, next); }
        close();
        toast('Saved', 'ok');
        window.__recimeNav.openRecipe(saved.id);
      });
    },
  });
}
