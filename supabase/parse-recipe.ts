// ===========================================================================
// Supabase Edge Function: parse-recipe
//
// Fetches a URL server-side (browsers can't, because of CORS) and pulls a
// structured recipe out of it:
//   1. schema.org/Recipe JSON-LD  — what nearly every recipe site publishes
//   2. microdata / RDFa fallback
//   3. oEmbed + meta description  — for TikTok / Instagram / YouTube
//   4. optional Anthropic pass    — cleans up messy video captions
//
// Deploy: Supabase dashboard → Edge Functions → Deploy a new function →
//         Via Editor → name it exactly `parse-recipe` → paste this → Deploy.
//
// Optional secret (Edge Functions → Secrets): ANTHROPIC_API_KEY
// ===========================================================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { url, ai } = await req.json();
    if (!url || !/^https?:\/\//i.test(url)) return bad('Give me a http(s) link');

    // Facebook and Instagram answer a plain server fetch with a login wall or a
    // 400. Their public embed endpoint is the supported way in, and for a
    // public reel it carries the whole caption.
    const embedded = await socialCaption(url);
    if (embedded && embedded.length > 60) {
      const meta0: Record<string, string> = {};
      let r0 = (ai && Deno.env.get('ANTHROPIC_API_KEY'))
        ? await aiExtract(embedded, meta0, url)
        : fromPlainText(embedded, meta0);
      if (r0 && (r0.ingredients || []).length) {
        r0.sourceUrl = url;
        return json({ recipe: r0 });
      }
      // We have the words but couldn't shape them here. Hand the caption back
      // and let the app parse it — same code path as pasting it in by hand,
      // which is better at social-caption formatting than this function is.
      return json({ caption: embedded, sourceUrl: url });
    }

    const html = await fetchPage(url);
    let recipe = fromJsonLd(html) || fromMicrodata(html);

    if (!recipe) {
      const meta = readMeta(html);
      const caption = await videoCaption(url, meta);
      if (caption && caption.length > 60) {
        if (ai && Deno.env.get('ANTHROPIC_API_KEY')) {
          recipe = await aiExtract(caption, meta, url);
        } else {
          recipe = fromPlainText(caption, meta);
        }
      }
      if (!recipe) {
        const text = stripToText(html);
        if (ai && Deno.env.get('ANTHROPIC_API_KEY') && text.length > 200) {
          recipe = await aiExtract(text.slice(0, 14000), meta, url);
        } else {
          recipe = fromPlainText(text, meta);
        }
      }
      if (recipe && !recipe.image) recipe.image = meta.image || '';
    }

    if (!recipe || !(recipe.ingredients || []).length) {
      // Same idea for ordinary pages: if there are words on it, let the app
      // have a go before we give up on the person.
      const fallback = stripToText(html);
      if (fallback && fallback.length > 200) {
        return json({ caption: fallback.slice(0, 20000), sourceUrl: url, meta: readMeta(html) });
      }
      return json({
        error: 'I could read the page but could not find a recipe on it. Copy the text and paste it into the app instead.',
        code: 'no-recipe',
      }, 422);
    }

    recipe.sourceUrl = url;
    return json({ recipe });
  } catch (e) {
    return json({ error: String((e as Error).message || e), code: 'fetch-failed' }, 500);
  }
});

// ---------------------------------------------------------------------------

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
function bad(msg: string) { return json({ error: msg, code: 'bad-request' }, 400); }

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' },
    redirect: 'follow',
  });
  if (res.status === 403 || res.status === 401 || res.status === 429) {
    throw new Error(`That site returned ${res.status}`);   // bot protection — the app explains the paste fallback
  }
  if (!res.ok) {
    if (/facebook\.com|fb\.watch|instagram\.com/i.test(url)) {
      throw new Error('Facebook and Instagram block servers from reading posts. If the post is public I can usually still get the caption — this one I could not. Copy the caption text and use Paste instead.');
    }
    throw new Error(`That site returned ${res.status}`);
  }
  return await res.text();
}

// --- JSON-LD ---------------------------------------------------------------

function fromJsonLd(html: string) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    let data: unknown;
    try { data = JSON.parse(b[1].trim().replace(/^﻿/, '')); } catch { continue; }
    const found = findRecipe(data);
    if (found) return normalise(found);
  }
  return null;
}

function findRecipe(node: unknown): Record<string, unknown> | null {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const n of node) { const f = findRecipe(n); if (f) return f; }
    return null;
  }
  if (typeof node !== 'object') return null;
  const o = node as Record<string, unknown>;
  const t = o['@type'];
  const types = Array.isArray(t) ? t : [t];
  if (types.some((x) => String(x).toLowerCase() === 'recipe')) return o;
  if (o['@graph']) return findRecipe(o['@graph']);
  for (const k of ['mainEntity', 'mainEntityOfPage', 'itemListElement']) {
    if (o[k]) { const f = findRecipe(o[k]); if (f) return f; }
  }
  return null;
}

function normalise(r: Record<string, any>) {
  const ingredients: string[] = arr(r.recipeIngredient ?? r.ingredients).map(txt).filter(Boolean);
  const steps = flattenInstructions(r.recipeInstructions);
  const yieldRaw = Array.isArray(r.recipeYield) ? r.recipeYield[0] : r.recipeYield;
  const servings = parseInt(String(yieldRaw ?? '').replace(/\D+/g, ''), 10) || 4;

  return {
    title: txt(r.name) || '',
    description: clean(txt(r.description) || ''),
    author: authorName(r.author),
    image: pickImage(r.image),
    servings,
    prepMinutes: isoMinutes(r.prepTime),
    cookMinutes: isoMinutes(r.cookTime) || Math.max(0, isoMinutes(r.totalTime) - isoMinutes(r.prepTime)),
    cuisine: cap(txt(Array.isArray(r.recipeCuisine) ? r.recipeCuisine[0] : r.recipeCuisine) || ''),
    mealType: mapCategory(txt(Array.isArray(r.recipeCategory) ? r.recipeCategory[0] : r.recipeCategory) || ''),
    ingredients,
    steps,
    nutritionPerServing: fromNutrition(r.nutrition),
  };
}

function flattenInstructions(x: unknown): string[] {
  if (!x) return [];
  if (typeof x === 'string') return splitSteps(clean(stripTags(x)));
  if (Array.isArray(x)) {
    const out: string[] = [];
    for (const i of x) {
      if (typeof i === 'string') out.push(...splitSteps(clean(stripTags(i))));
      else if (i && typeof i === 'object') {
        const o = i as Record<string, any>;
        if (o.itemListElement) out.push(...flattenInstructions(o.itemListElement));
        else if (o.text) out.push(...splitSteps(clean(stripTags(String(o.text)))));
        else if (o.name) out.push(clean(stripTags(String(o.name))));
      }
    }
    return out.filter((s) => s.length > 3);
  }
  if (typeof x === 'object') return flattenInstructions([(x as Record<string, unknown>)]);
  return [];
}

function splitSteps(s: string): string[] {
  if (s.length < 220) return [s];
  return s.split(/(?<=[.!?])\s+(?=[A-Z])/).map((p) => p.trim()).filter((p) => p.length > 8);
}

function fromNutrition(n: unknown) {
  if (!n || typeof n !== 'object') return null;
  const o = n as Record<string, any>;
  const num = (v: unknown) => { const m = String(v ?? '').match(/[\d.]+/); return m ? Math.round(Number(m[0])) : null; };
  const cals = num(o.calories);
  if (!cals) return null;
  return {
    calories: cals,
    protein: num(o.proteinContent) ?? 0,
    carbs: num(o.carbohydrateContent) ?? 0,
    fat: num(o.fatContent) ?? 0,
    fiber: num(o.fiberContent) ?? 0,
    sodium: num(o.sodiumContent) ?? 0,
  };
}

// --- microdata -------------------------------------------------------------

function fromMicrodata(html: string) {
  const ing = [...html.matchAll(/itemprop=["']recipeIngredient["'][^>]*>([\s\S]{0,300}?)</gi)]
    .map((m) => clean(stripTags(m[1]))).filter(Boolean);
  if (ing.length < 2) return null;
  const steps = [...html.matchAll(/itemprop=["']recipeInstructions["'][^>]*>([\s\S]{0,1500}?)<\/(?:li|p|div)>/gi)]
    .map((m) => clean(stripTags(m[1]))).filter((s) => s.length > 8);
  const meta = readMeta(html);
  return {
    title: meta.title, description: meta.description, image: meta.image,
    servings: 4, prepMinutes: 0, cookMinutes: 0,
    ingredients: ing, steps, nutritionPerServing: null,
  };
}

// --- video / social --------------------------------------------------------

async function videoCaption(url: string, meta: Record<string, string>) {
  const oembed = oembedFor(url);
  if (oembed) {
    try {
      const r = await fetch(oembed, { headers: { 'User-Agent': UA } });
      if (r.ok) {
        const j = await r.json();
        const bits = [j.title, j.description, j.author_name ? `by ${j.author_name}` : ''].filter(Boolean).join('\n');
        if (bits.length > (meta.description || '').length) return bits;
      }
    } catch { /* fall through to meta */ }
  }
  return [meta.title, meta.description].filter(Boolean).join('\n');
}

/**
 * Meta's public embed plugin. It exists so third-party sites can render a
 * public post for logged-out visitors, which is exactly our situation, and it
 * returns the full caption text rather than the truncated preview.
 */
function embedUrlsFor(url: string): string[] {
  const enc = encodeURIComponent(url);
  if (/facebook\.com|fb\.watch/i.test(url)) {
    return [
      `https://www.facebook.com/plugins/post.php?href=${enc}&show_text=true&width=500`,
      `https://www.facebook.com/plugins/video.php?href=${enc}&show_text=true&width=500`,
    ];
  }
  if (/instagram\.com/i.test(url)) {
    const clean = url.split('?')[0].replace(/\/$/, '');
    return [`${clean}/embed/captioned/`];
  }
  return [];
}

async function socialCaption(url: string): Promise<string> {
  for (const embed of embedUrlsFor(url)) {
    try {
      const r = await fetch(embed, {
        headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' },
        redirect: 'follow',
      });
      if (!r.ok) continue;
      const html = await r.text();
      const text = captionFromEmbed(html);
      if (text && text.length > 60) return text;
    } catch { /* try the next shape */ }
  }
  return '';
}

/**
 * Pull the human text out of an embed page and drop the chrome around it —
 * the like counts, the "See more", the login prompts.
 */
function captionFromEmbed(html: string): string {
  let t = stripToText(html);
  // Everything before the first recipe-ish heading is author furniture.
  const cut = t.search(/\bingredients?\b\s*(\([^)]*\))?\s*:/i);
  if (cut > 0) t = t.slice(Math.max(0, cut - 220));
  t = t
    .replace(/\bSee more\b/gi, ' ')
    .replace(/\bSee less\b/gi, ' ')
    .replace(/\b(Like|Comment|Share|Reply|Follow|View more comments|Log ?in|Sign ?up|Create new account)\b/gi, ' ')
    .replace(/\b\d+(?:[.,]\d+)?[KMB]?\s*(?:likes?|comments?|shares?|views?|reactions?)\b/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  // Anything after the engagement block is not the recipe.
  const tail = t.search(/\b(Most relevant|All comments|Related videos|Suggested)\b/i);
  if (tail > 200) t = t.slice(0, tail);
  return t.trim();
}

function oembedFor(url: string): string | null {
  if (/tiktok\.com/i.test(url)) return 'https://www.tiktok.com/oembed?url=' + encodeURIComponent(url);
  if (/youtube\.com|youtu\.be/i.test(url)) return 'https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(url);
  if (/vimeo\.com/i.test(url)) return 'https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(url);
  return null;
}

// --- plain text fallback ---------------------------------------------------

function fromPlainText(text: string, meta: Record<string, string>) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const ing: string[] = [];
  const steps: string[] = [];
  let mode: '' | 'ing' | 'step' = '';
  for (const l of lines) {
    const low = l.toLowerCase().replace(/[^a-z ]/g, '').trim();
    if (/^(ingredients?|you will need|what you need)$/.test(low)) { mode = 'ing'; continue; }
    if (/^(instructions?|directions?|method|steps?|preparation)$/.test(low)) { mode = 'step'; continue; }
    const looksIng = /^[-•*·▢]?\s*(\d|[½⅓⅔¼¾⅛])/.test(l) && l.length < 110;
    if (mode === 'ing' || (mode === '' && looksIng)) { if (l.length < 130) ing.push(l); continue; }
    if (mode === 'step' && l.length > 12) steps.push(l.replace(/^\s*\d+[.)]\s*/, ''));
  }
  if (!ing.length) return null;
  return {
    title: meta.title || 'Imported recipe',
    description: meta.description || '',
    image: meta.image || '', servings: 4, prepMinutes: 0, cookMinutes: 0,
    ingredients: ing, steps, nutritionPerServing: null,
  };
}

// --- optional AI pass ------------------------------------------------------

async function aiExtract(text: string, meta: Record<string, string>, url: string) {
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) return null;
  const prompt = `Pull the recipe out of the text below and return ONLY JSON, no commentary, matching exactly:
{"title":"","description":"","servings":4,"prepMinutes":0,"cookMinutes":0,"cuisine":"","mealType":"dinner",
 "ingredients":[{"quantity":1,"unit":"cup","item":"","notes":""}],"steps":[""]}

Rules: quantity must be a number (0.5 not 1/2). unit is one of "" lb oz cup tbsp tsp clove can bunch whole pinch g ml.
mealType is one of breakfast lunch dinner snack dessert. If a quantity isn't stated, make a sensible one for the servings.
Write the steps as clear short instructions. If there is genuinely no recipe here, return {"error":"none"}.

Source: ${url}
Title: ${meta.title || ''}

TEXT:
${text}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const body = await res.json();
  const out = body?.content?.[0]?.text || '';
  const m = out.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[0]);
    if (parsed.error) return null;
    parsed.image = meta.image || '';
    return parsed;
  } catch { return null; }
}

// --- html helpers ----------------------------------------------------------

function readMeta(html: string) {
  const grab = (re: RegExp) => { const m = html.match(re); return m ? clean(decode(m[1])) : ''; };
  return {
    title: grab(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)
      || grab(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)/i)
      || grab(/<title[^>]*>([^<]+)</i),
    description: grab(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i)
      || grab(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i),
    image: grab(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i),
  };
}

function stripToText(html: string) {
  return decode(html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|br)>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripTags(s: string) { return String(s).replace(/<[^>]+>/g, ' '); }
function clean(s: string) { return String(s).replace(/\s+/g, ' ').trim(); }
function txt(v: unknown): string { return v == null ? '' : (typeof v === 'string' ? v : String((v as any).name ?? v)); }

function authorName(a: unknown): string {
  if (!a) return '';
  if (typeof a === 'string') return a.trim();
  if (Array.isArray(a)) return authorName(a[0]);
  if (typeof a === 'object') return String((a as Record<string, unknown>).name ?? '').trim();
  return '';
}
function arr(v: unknown): unknown[] { return Array.isArray(v) ? v : v ? [v] : []; }
function cap(s: string) { return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : ''; }

function pickImage(img: unknown): string {
  if (!img) return '';
  if (typeof img === 'string') return img;
  if (Array.isArray(img)) return pickImage(img[0]);
  const o = img as Record<string, unknown>;
  return String(o.url ?? o['@id'] ?? '');
}

function isoMinutes(iso: unknown): number {
  const s = String(iso ?? '');
  const m = s.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return 0;
  return (Number(m[1] || 0) * 1440) + (Number(m[2] || 0) * 60) + Number(m[3] || 0);
}

function mapCategory(c: string) {
  const s = c.toLowerCase();
  if (/breakfast|brunch/.test(s)) return 'breakfast';
  if (/lunch/.test(s)) return 'lunch';
  if (/dessert|sweet|cake|cookie/.test(s)) return 'dessert';
  if (/snack|appetiz|starter|side/.test(s)) return 'snack';
  return 'dinner';
}

function decode(s: string) {
  return String(s)
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&frac12;/g, '½').replace(/&frac14;/g, '¼')
    .replace(/&frac34;/g, '¾').replace(/&deg;/g, '°')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
