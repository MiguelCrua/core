const json = (status, error) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path;
    try { path = decodeURIComponent(url.pathname).toLowerCase(); } catch { return json(400, 'Pedido inválido.'); }
    // All requests run through this Worker; private assets never have a public route.
    if (path.includes('__private') || path.includes('\\')) return new Response('Not found', { status: 404 });
    if (url.pathname !== '/api/workbook') return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return json(405, 'Método não permitido.');
    if (request.headers.get('Origin') !== url.origin) return json(403, 'Pedido não autorizado.');
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json(415, 'Pedido inválido.');
    if (!env.CORE_SHEETS_WEBHOOK || !env.CORE_SHEETS_SECRET) return json(503, 'O download estará disponível em breve.');
    if (env.WORKBOOK_LIMITER) {
      const { success } = await env.WORKBOOK_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
      if (!success) return json(429, 'Aguarda um minuto antes de tentar novamente.');
    }
    try {
      const reader = request.body?.getReader();
      if (!reader) return json(400, 'Preenche o nome e um email válido.');
      let size = 0; const chunks = [];
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > 4096) { await reader.cancel(); return json(413, 'Pedido demasiado grande.'); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      let data;
      try { data = JSON.parse(new TextDecoder().decode(bytes)); } catch { return json(400, 'Verifica os dados introduzidos.'); }
      const name = typeof data?.name === 'string' ? data.name.trim() : '';
      const email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
      if (name.length < 2 || name.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, 'Preenche o nome e um email válido.');
      const pdf = await env.ASSETS.fetch(new Request(new URL('/__private/workbook.pdf', url.origin)));
      if (!pdf.ok) return json(503, 'O Workbook está temporariamente indisponível.');
      const saved = await fetch(env.CORE_SHEETS_WEBHOOK, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, secret: env.CORE_SHEETS_SECRET, source: 'core-workbook' }),
        signal: AbortSignal.timeout(20000)
      });
      if (!saved.ok || (await saved.json()).ok !== true) return json(503, 'Não foi possível guardar o pedido. Tenta novamente.');
      return new Response(pdf.body, { headers: {
        'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="Core - Workbook.pdf"',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'
      } });
    } catch { return json(503, 'Não foi possível concluir o pedido. Tenta novamente.'); }
  }
};
