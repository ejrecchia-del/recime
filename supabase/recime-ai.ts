// ===========================================================================
// Supabase Edge Function: recime-ai   (OPTIONAL)
//
// Only needed if you want the Ask tab to answer with a real model instead of
// the built-in matcher. Everything in the app works without this.
//
// Deploy: Edge Functions → Deploy a new function → Via Editor →
//         name it exactly `recime-ai` → paste this → Deploy.
// Secret: ANTHROPIC_API_KEY
// ===========================================================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) return json({ error: 'ANTHROPIC_API_KEY is not set on this function' }, 400);

  try {
    const { messages, catalog } = await req.json();

    const system = `You help a married couple decide what to cook. You can see their recipe library below as JSON.

Rules:
- Recommend from their library first. Refer to recipes by their exact title.
- Keep it to three or four suggestions, each with one short line on why it fits.
- If nothing in the library fits, say so plainly and describe what you'd make instead — do not invent a title that sounds like it's already saved.
- Be warm and brief. No headers, no bullet-point walls. Two or three sentences plus the picks.

THEIR LIBRARY:
${JSON.stringify(catalog).slice(0, 60000)}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 900,
        system,
        messages: (messages || []).slice(-8),
      }),
    });

    if (!res.ok) return json({ error: 'Model call failed: ' + res.status }, 502);
    const body = await res.json();
    return json({ reply: body?.content?.[0]?.text || '' });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
