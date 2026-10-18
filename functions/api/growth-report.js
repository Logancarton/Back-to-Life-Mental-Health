import { ORIGIN, reply, reportRange } from '../../server/growth.js';

async function sameSecret(left, right) {
  const hash = value => crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const [a, b] = await Promise.all([hash(left), hash(right)]);
  const av = new Uint8Array(a), bv = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < av.length; i++) difference |= av[i] ^ bv[i];
  return difference === 0;
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  if (url.origin !== ORIGIN) return reply(403);
  if (request.method !== 'GET') return reply(405);
  if (!env.GROWTH_DB || !env.GROWTH_REPORT_KEY || env.GROWTH_REPORT_KEY.length < 24 || env.GROWTH_REPORT_KEY.length > 256) return reply(503, { error: 'Reporting is not configured. Set GROWTH_REPORT_KEY to a random secret of 24–256 characters in Cloudflare Pages, then redeploy.' });
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') || '';
  if (token.length > 256 || !await sameSecret(token, env.GROWTH_REPORT_KEY)) return reply(401, { error: 'Report key was not accepted.' });
  let range;
  try { range = reportRange(url.searchParams.get('start'), url.searchParams.get('end')); }
  catch (error) { return reply(400, { error: error.message }); }
  try {
    const data = await env.GROWTH_DB.prepare('SELECT day,event,page,source,placement,count FROM growth_counts WHERE day >= ? AND day <= ? ORDER BY day,event,page,source,placement').bind(range.start, range.end).all();
    const first = await env.GROWTH_DB.prepare("SELECT value FROM growth_meta WHERE key='first_event_day'").first();
    return reply(200, { ...range, first_event_day: first?.value || null, generated_at: new Date().toISOString(), rows: data.results, note: 'Event counts, not unique people, completed calls or appointments. Condition pages are grouped as education. Source is coarse within-tab attribution; Direct/unknown includes unavailable referrers. Missing or blocked events cannot be recovered.' });
  } catch { return reply(503, { error: 'Counts are temporarily unavailable.' }); }
}
