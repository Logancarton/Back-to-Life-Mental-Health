export const ORIGIN = 'https://www.back-to-life-mental-health.com';
export const EVENTS = ['page_view', 'booking_click', 'scheduler_open', 'scheduler_external', 'phone_click'];
export const PAGES = ['home', 'services', 'evaluation', 'medication', 'new_patients', 'insurance', 'telehealth', 'about', 'contact', 'education'];
export const SOURCES = ['organic_search', 'google_paid', 'facebook_paid', 'facebook_organic', 'instagram', 'referral', 'direct_unknown'];
export const PLACEMENTS = ['page', 'header', 'main', 'footer', 'floating', 'scheduler'];

export function phoenixDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Phoenix', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function reply(status, data = null) {
  return new Response(data === null ? null : JSON.stringify(data), { status, headers: {
    'Cache-Control': 'no-store', 'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'no-referrer'
  } });
}

export function validateEvent(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value).sort().join(',');
  if (keys !== 'event,page,placement,source,v' || value.v !== 1) return false;
  if (!EVENTS.includes(value.event) || !PAGES.includes(value.page) || !SOURCES.includes(value.source) || !PLACEMENTS.includes(value.placement)) return false;
  return value.event === 'page_view' ? value.placement === 'page' : value.placement !== 'page';
}

export function reportRange(start, end, now = new Date()) {
  const today = phoenixDay(now);
  const shift = (day, delta) => new Date(Date.parse(`${day}T12:00:00Z`) + delta * 86400000).toISOString().slice(0, 10);
  const valid = day => /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(`${day}T12:00:00Z`)) && new Date(`${day}T12:00:00Z`).toISOString().slice(0, 10) === day;
  if (!start && !end) { end = shift(today, -1); start = shift(end, -6); }
  if (!start || !end || !valid(start) || !valid(end) || start > end || end >= today || (Date.parse(end) - Date.parse(start)) / 86400000 > 92) throw new Error('Choose 1–93 complete days ending before today (America/Phoenix).');
  return { start, end, timezone: 'America/Phoenix' };
}
