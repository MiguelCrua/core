const json = (status, error) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
const signingKey = secret => crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
const sign = async (secret, payload) => {
  const signature = await crypto.subtle.sign('HMAC', await signingKey(secret), new TextEncoder().encode('core-workbook-download:' + payload));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
};
const pdfResponse = (pdf, head = false) => {
  const headers = new Headers(pdf.headers);
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', 'attachment; filename="CORE - Workbook.pdf"');
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(head ? null : pdf.body, { status: pdf.status, headers });
};
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path;
    try { path = decodeURIComponent(url.pathname).toLowerCase(); } catch { return json(400, 'Pedido inválido.'); }
    // All requests run through this Worker; private assets never have a public route.
    if (path.includes('__private') || path.includes('\\')) return new Response('Not found', { status: 404 });
    if (url.pathname === '/api/workbook/download') {
      if (!['GET', 'HEAD'].includes(request.method)) return json(405, 'Método não permitido.');
      const token = url.searchParams.get('token') || '';
      const [expires, nonce, signature] = token.split('.');
      const expiry = Number(expires);
      const now = Math.floor(Date.now() / 1000);
      if (!env.CORE_SHEETS_SECRET || !/^\d+$/.test(expires || '') || !/^[a-f0-9-]{36}$/.test(nonce || '') || !/^[a-f0-9]{64}$/.test(signature || '') || expiry <= now || expiry > now + 7200) return json(403, 'O link expirou. Volta a pedir o Workbook.');
      const signatureBytes = Uint8Array.from(signature.match(/../g), hex => parseInt(hex, 16));
      const valid = await crypto.subtle.verify('HMAC', await signingKey(env.CORE_SHEETS_SECRET), signatureBytes, new TextEncoder().encode('core-workbook-download:' + expires + '.' + nonce));
      if (!valid) return json(403, 'Link de download inválido.');
      const headers = new Headers();
      if (request.headers.has('Range')) headers.set('Range', request.headers.get('Range'));
      const pdf = await env.ASSETS.fetch(new Request(new URL('/__private/workbook.pdf', url.origin), { headers }));
      if (!pdf.ok) return json(503, 'O Workbook está temporariamente indisponível.');
      return pdfResponse(pdf, request.method === 'HEAD');
    }
    if (url.pathname !== '/api/workbook') return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return json(405, 'Método não permitido.');
    if (request.headers.get('Origin') !== url.origin) return json(403, 'Pedido não autorizado.');
    const contentType = request.headers.get('Content-Type') || '';
    const nativeForm = contentType.startsWith('application/x-www-form-urlencoded');
    if (!nativeForm && !contentType.startsWith('application/json')) return json(415, 'Pedido inválido.');
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
      try {
        const body = new TextDecoder().decode(bytes);
        data = nativeForm ? Object.fromEntries(new URLSearchParams(body)) : JSON.parse(body);
      } catch { return json(400, 'Verifica os dados introduzidos.'); }
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
      if (nativeForm) {
        // Redirect the POST to a repeatable, signed GET: mobile download managers
        // can request the attachment again when the user chooses Save to Downloads.
        const payload = `${Math.floor(Date.now() / 1000) + 3600}.${crypto.randomUUID()}`;
        const token = payload + '.' + await sign(env.CORE_SHEETS_SECRET, payload);
        await pdf.body?.cancel();
        return new Response(null, { status: 303, headers: { Location: `/api/workbook/download?token=${token}`, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
      }
      return pdfResponse(pdf);
    } catch { return json(503, 'Não foi possível concluir o pedido. Tenta novamente.'); }
  }
};
