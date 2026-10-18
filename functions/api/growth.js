import { ORIGIN, phoenixDay, reply, validateEvent } from '../../server/growth.js';

// No request bodies, headers, IP addresses or full URLs are persisted or logged.
export async function onRequest({ request, env }) {
  if (new URL(request.url).origin !== ORIGIN) return reply(403);
  if (request.method === 'HEAD') {
    if (!env.GROWTH_DB) return reply(503);
    try { await env.GROWTH_DB.prepare('SELECT 1 FROM growth_counts LIMIT 0').all(); return reply(204); }
    catch { return reply(503); }
  }
  if (request.method !== 'POST') return reply(405);
  if (request.headers.get('Origin') !== ORIGIN || request.headers.get('Sec-Fetch-Site') !== 'same-origin') return reply(403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply(415);
  if (request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1') return reply(204);
  if (!env.GROWTH_DB) return reply(503);
  let value;
  try {
    // Bound the actual streamed body, not just a client-supplied length header.
    const reader = request.body?.getReader();
    if (!reader) return reply(400);
    let length = 0;
    const chunks = [];
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      length += chunk.byteLength;
      if (length > 512) { await reader.cancel(); return reply(413); }
      chunks.push(chunk);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    value = JSON.parse(new TextDecoder().decode(bytes));
  } catch { return reply(400); }
  if (!validateEvent(value)) return reply(400);
  const day = phoenixDay();
  try {
    await env.GROWTH_DB.batch([
      env.GROWTH_DB.prepare('INSERT INTO growth_counts (day,event,page,source,placement,count) VALUES (?,?,?,?,?,1) ON CONFLICT(day,event,page,source,placement) DO UPDATE SET count=count+1')
        .bind(day, value.event, value.page, value.source, value.placement),
      env.GROWTH_DB.prepare("INSERT OR IGNORE INTO growth_meta (key,value) VALUES ('first_event_day',?)").bind(day)
    ]);
    return reply(204);
  } catch { return reply(503); }
}
