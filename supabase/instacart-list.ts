// ===========================================================================
// Supabase Edge Function: instacart-list
//
// Talks to Instacart's Developer Platform on your behalf. The API key stays
// here as a function secret — it never reaches the phone, and never ends up in
// a URL somebody could read over your shoulder.
//
// Sign-ups are open again: make a key at https://dashboard.instacart.com
// (API Keys → Create New API Key). Development keys hit a sandbox; production
// keys build real, shoppable pages.
//
// Deploy: Edge Functions → Deploy a new function → Via Editor →
//         name it exactly `instacart-list` → paste this → Deploy.
// Secrets: INSTACART_API_KEY
//          INSTACART_ENV=dev            (optional — sandbox instead of live)
//          INSTACART_RETAILER_KEY=...   (optional — land on one store)
//
// Three actions, one function, so there's only ever one thing to deploy:
//   { action: 'list',      payload }  → a shoppable shopping-list page
//   { action: 'recipe',    payload }  → a shoppable recipe page
//   { action: 'retailers', postalCode, countryCode } → stores near a postcode
//
// A body with no `action` is treated as a shopping list, which is what the
// first version of this function accepted. Old clients keep working.
// ===========================================================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const key = Deno.env.get('INSTACART_API_KEY');
  if (!key) {
    return json({ error: 'INSTACART_API_KEY is not set on this function. Add it under Edge Functions → instacart-list → Secrets.' }, 400);
  }

  const base = Deno.env.get('INSTACART_ENV') === 'dev'
    ? 'https://connect.dev.instacart.tools'
    : 'https://connect.instacart.com';

  const headers = {
    Authorization: 'Bearer ' + key,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    const body = await req.json();
    const action = body?.action || 'list';

    // --- stores near a postcode -------------------------------------------
    // The one call that isn't about building a cart. Used to fill in the store
    // list for somebody who has just installed the app somewhere else.
    if (action === 'retailers') {
      const postal = String(body.postalCode || '').trim();
      const country = String(body.countryCode || 'US').trim().toUpperCase();
      if (!/^[A-Za-z0-9 -]{3,10}$/.test(postal)) return json({ error: 'Give me a postal code.' }, 400);

      const url = `${base}/idp/v1/retailers?postal_code=${encodeURIComponent(postal)}&country_code=${encodeURIComponent(country)}`;
      const res = await fetch(url, { headers: { Authorization: headers.Authorization, Accept: 'application/json' } });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) return json({ error: errorText(out, res.status) }, res.status);
      return json({ retailers: out.retailers || [] });
    }

    // --- a shoppable page --------------------------------------------------
    const path = action === 'recipe'
      ? '/idp/v1/products/recipe'
      : '/idp/v1/products/products_link';

    const payload = body.payload || body;   // old clients posted the payload bare
    const res = await fetch(base + path, { method: 'POST', headers, body: JSON.stringify(payload) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return json({ error: errorText(out, res.status) }, res.status);

    let url = out.products_link_url as string;
    const retailer = body.retailerKey || Deno.env.get('INSTACART_RETAILER_KEY');
    if (url && retailer) url += (url.includes('?') ? '&' : '?') + 'retailer_key=' + encodeURIComponent(String(retailer));

    return json({ products_link_url: url });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

/** Instacart returns errors in a few shapes; dig out something readable. */
function errorText(body: any, status: number): string {
  if (typeof body?.error === 'string') return body.error;
  if (body?.error?.message) return body.error.message;
  if (Array.isArray(body?.errors) && body.errors.length) {
    return body.errors.map((e: any) => e?.message || e?.error || JSON.stringify(e)).join('; ');
  }
  if (body?.message) return body.message;
  if (status === 401 || status === 403) return 'Instacart rejected the API key. Check it is a production key and copied in full.';
  return `Instacart returned ${status}`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
