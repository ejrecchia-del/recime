// ===========================================================================
// Supabase Edge Function: instacart-list   (OPTIONAL — needs an API key you
// probably can't get yet)
//
// Instacart's Developer Platform stopped accepting new applications, so this
// only becomes useful if you're granted access later. It's here and ready.
//
// Deploy: Edge Functions → Deploy a new function → Via Editor →
//         name it exactly `instacart-list` → paste this → Deploy.
// Secrets: INSTACART_API_KEY  (and optionally INSTACART_ENV=dev)
// ===========================================================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const key = Deno.env.get('INSTACART_API_KEY');
  if (!key) return json({ error: 'INSTACART_API_KEY is not set on this function' }, 400);

  const base = Deno.env.get('INSTACART_ENV') === 'dev'
    ? 'https://connect.dev.instacart.tools'
    : 'https://connect.instacart.com';

  try {
    const payload = await req.json();

    const res = await fetch(base + '/idp/v1/products/products_link', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) return json({ error: body?.error?.message || `Instacart returned ${res.status}` }, res.status);

    // If a retailer is preferred, nudge the landing page toward it.
    let url = body.products_link_url as string;
    const retailer = Deno.env.get('INSTACART_RETAILER_KEY');
    if (url && retailer) url += (url.includes('?') ? '&' : '?') + 'retailer_key=' + encodeURIComponent(retailer);

    return json({ products_link_url: url });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
