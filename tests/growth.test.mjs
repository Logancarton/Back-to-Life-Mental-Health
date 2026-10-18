import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { onRequest as collect } from '../functions/api/growth.js';
import { onRequest as report } from '../functions/api/growth-report.js';
import { ORIGIN, phoenixDay, reportRange } from '../server/growth.js';
import { setupGrowth } from '../scripts/setup-growth.mjs';
import vm from 'node:vm';

const payload = { v: 1, event: 'page_view', page: 'home', source: 'organic_search', placement: 'page' };
const key = 'test-only-report-key-abcdefghijklmnopqrstuvwxyz';
const schema = await readFile(new URL('../scripts/growth-schema.sql', import.meta.url), 'utf8');
const client = await readFile(new URL('../growth.js', import.meta.url), 'utf8');
function clientHarness({ url = ORIGIN, referrer = '', navigator = {}, storageBlocked = false, saved = null, brokenFetch = false } = {}) {
  const sent = [], listeners = new Map();
  class Element {
    constructor(href, place = 'main', fallback = false) { this.href = href; this.place = place; this.fallback = fallback; }
    closest(selector) {
      if (selector.startsWith('a[href]')) return this;
      if (selector.includes('data-scheduler-fallback') || selector.includes('data-scheduler-dialog')) return this.fallback ? this : null;
      if (selector.includes('data-scheduler-launcher')) return this.place === 'floating' ? this : null;
      if (selector === '.site-header') return this.place === 'header' ? this : null;
      if (selector === '.site-footer') return this.place === 'footer' ? this : null;
      return null;
    }
    hasAttribute(name) { return name === 'data-scheduler-launcher' ? this.place === 'floating' : name === 'data-scheduler-fallback' && this.fallback; }
    getAttribute() { return this.href; }
  }
  const addEventListener = (type, handler) => listeners.set(type, handler);
  const storage = { getItem() { if (storageBlocked) throw Error('blocked'); return saved; }, setItem(key, value) { if (storageBlocked) throw Error('blocked'); saved = value; } };
  const globals = { location: new URL(url), navigator, document: { referrer, visibilityState: 'visible', addEventListener }, window: { addEventListener }, sessionStorage: storage, Element, URL, URLSearchParams, Map, Date, JSON, fetch(endpoint, options) { if (brokenFetch) throw Error('offline'); sent.push({ endpoint, options, body: JSON.parse(options.body) }); return Promise.resolve(); } };
  vm.runInNewContext(client, globals);
  return { sent, click(href, place = 'main', fallback = false) { listeners.get('click')?.({ isTrusted: true, type: 'click', target: new Element(href, place, fallback) }); }, opened(place = 'main') { listeners.get('btlmh:scheduler-open')?.({ detail: { trigger: new Element('', place) } }); } };
}

test('Browser client emits allowlisted aggregate fields, suppresses duplicate clicks and separates opens', () => {
  const h = clientHarness({ url: `${ORIGIN}/adhd?utm_source=facebook&utm_medium=paid_social&private=never-save` });
  const scheduler = 'https://d2oe0ra32qx05a.cloudfront.net/?practiceKey=k_1_108034';
  h.click(scheduler, 'header'); h.click(scheduler, 'header'); h.opened('header'); h.click(scheduler, 'main', true); h.click('tel:+14803138583'); h.click('tel:988');
  assert.deepEqual(h.sent.map(item => item.body.event), ['page_view', 'booking_click', 'scheduler_open', 'scheduler_external', 'phone_click']);
  assert.ok(h.sent.every(item => item.body.page === 'education' && item.body.source === 'facebook_paid'));
  assert.ok(h.sent.every(item => item.options.referrerPolicy === 'no-referrer' && item.options.credentials === 'omit'));
  assert.ok(!JSON.stringify(h.sent).includes('never-save')); assert.ok(!JSON.stringify(h.sent).includes('adhd'));
});
test('Client excludes privacy preferences, preview hosts, automation and patient-resource pages', () => {
  for (const options of [{ navigator: { doNotTrack: '1' } }, { navigator: { globalPrivacyControl: true } }, { navigator: { webdriver: true } }, { url: 'https://preview.pages.dev/' }, { url: `${ORIGIN}/current-patients` }, { url: `${ORIGIN}/growth-report` }, { url: `${ORIGIN}/privacy` }]) assert.equal(clientHarness(options).sent.length, 0);
});
test('Storage and network failure do not break interactions; unknown source remains explicit', () => {
  const h = clientHarness({ storageBlocked: true }); h.click('tel:+14803138583');
  assert.ok(h.sent.every(item => item.body.source === 'direct_unknown'));
  assert.doesNotThrow(() => clientHarness({ brokenFetch: true }).opened());
});
test('Internal navigation preserves coarse tab source without saving the raw referrer', () => {
  const h = clientHarness({ url: `${ORIGIN}/contact`, referrer: `${ORIGIN}/adhd?private=never-save`, saved: 'organic_search' });
  assert.equal(h.sent[0].body.source, 'organic_search'); assert.ok(!JSON.stringify(h.sent).includes('never-save'));
});
function database() {
  const db = new DatabaseSync(':memory:'); db.exec(schema);
  const wrap = (sql, params = []) => ({
    bind(...args) { return wrap(sql, args); },
    async all() { return { results: db.prepare(sql).all(...params) }; },
    async first() { return db.prepare(sql).get(...params) || null; },
    sql, params
  });
  return { db, prepare: wrap, async batch(statements) {
    db.exec('BEGIN');
    try { const results = statements.map(s => db.prepare(s.sql).run(...s.params)); db.exec('COMMIT'); return results; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  } };
}
function request(body = payload, options = {}) {
  return new Request(`${ORIGIN}/api/growth`, { method: 'POST', headers: { Origin: ORIGIN, 'Sec-Fetch-Site': 'same-origin', 'Content-Type': 'application/json', ...options.headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
}
test('Counts persist as one daily aggregate without identifiers; parallel increments are additive', async () => {
  const db = database();
  const results = await Promise.all(Array.from({ length: 8 }, () => collect({ request: request(), env: { GROWTH_DB: db } })));
  assert.ok(results.every(r => r.status === 204));
  const rows = db.db.prepare('SELECT * FROM growth_counts').all();
  assert.equal(rows.length, 1); assert.equal(rows[0].count, 8);
  assert.deepEqual(Object.keys(rows[0]), ['day', 'event', 'page', 'source', 'placement', 'count']);
  assert.equal(rows[0].day, phoenixDay());
});
test('Collector rejects raw URLs, diagnoses, arbitrary fields, invalid actions and oversized bodies', async () => {
  const db = database();
  for (const value of [{ ...payload, name: 'Do not retain' }, { ...payload, page: '/adhd?patient=x' }, { ...payload, source: 'https://example.com/private' }, { ...payload, event: 'appointment_completed' }, { ...payload, placement: 'main' }, {}, [], null]) {
    assert.equal((await collect({ request: request(value), env: { GROWTH_DB: db } })).status, 400);
  }
  assert.equal((await collect({ request: request('x'.repeat(513)), env: { GROWTH_DB: db } })).status, 413);
  assert.equal((await collect({ request: request('{'), env: { GROWTH_DB: db } })).status, 400);
  assert.equal(db.db.prepare('SELECT COUNT(*) AS n FROM growth_counts').get().n, 0);
});
test('Only same-origin production requests are accepted; DNT and GPC produce no writes', async () => {
  const db = database(); const env = { GROWTH_DB: db };
  for (const headers of [{ Origin: 'https://elsewhere.test' }, { 'Sec-Fetch-Site': 'cross-site' }]) assert.equal((await collect({ request: request(payload, { headers }), env })).status, 403);
  for (const headers of [{ DNT: '1' }, { 'Sec-GPC': '1' }]) assert.equal((await collect({ request: request(payload, { headers }), env })).status, 204);
  assert.equal((await collect({ request: new Request('https://preview.pages.dev/api/growth', { method: 'HEAD' }), env })).status, 403);
  assert.equal((await collect({ request: new Request(`${ORIGIN}/api/growth`), env })).status, 405);
  assert.equal((await collect({ request: new Request(`${ORIGIN}/api/growth`, { method: 'HEAD' }), env })).status, 204);
  assert.equal(db.db.prepare('SELECT COUNT(*) AS n FROM growth_counts').get().n, 0);
});
test('Storage outages return a bounded failure, not a false success', async () => {
  assert.equal((await collect({ request: request(), env: {} })).status, 503);
  assert.equal((await collect({ request: request(), env: { GROWTH_DB: { prepare() { throw Error('down'); } } } })).status, 503);
});
test('Phoenix midnight and last seven complete days use Arizona dates', () => {
  assert.equal(phoenixDay(new Date('2026-10-18T06:59:59Z')), '2026-10-17');
  assert.equal(phoenixDay(new Date('2026-10-18T07:00:00Z')), '2026-10-18');
  assert.deepEqual(reportRange(null, null, new Date('2026-10-18T15:00:00Z')), { start: '2026-10-11', end: '2026-10-17', timezone: 'America/Phoenix' });
  for (const pair of [['2026-02-30', '2026-03-01'], ['2026-10-18', '2026-10-18'], ['2026-10-01', null], ['2026-01-01', '2026-10-01'], ['2026-10-10', '2026-10-01']]) assert.throws(() => reportRange(...pair, new Date('2026-10-18T15:00:00Z')));
});
test('Report requires the secret in a header and does not expose counts without it', async () => {
  const db = database();
  db.db.exec("INSERT INTO growth_counts VALUES ('2026-10-01','booking_click','education','direct_unknown','main',4)");
  const env = { GROWTH_DB: db, GROWTH_REPORT_KEY: key };
  const make = (query = '', auth = '') => new Request(`${ORIGIN}/api/growth-report?start=2026-10-01&end=2026-10-02${query}`, { headers: { Authorization: auth } });
  assert.equal((await report({ request: make(`&key=${key}`), env })).status, 401);
  assert.equal((await report({ request: make('', 'Bearer wrong'), env })).status, 401);
  const response = await report({ request: make('', `Bearer ${key}`), env });
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const value = await response.json(); assert.equal(value.rows[0].count, 4); assert.equal(value.timezone, 'America/Phoenix');
  assert.equal((await report({ request: make('', `Bearer ${key}`), env: { GROWTH_DB: db } })).status, 503);
});
test('Setup reuses the database and preserves existing production bindings', async () => {
  const calls = []; let bound = false;
  const fetcher = async (url, options) => {
    calls.push([url, options]);
    let result;
    if (url.includes('/pages/projects/')) {
      if (options.method === 'PATCH') { const patch = JSON.parse(options.body); assert.equal(patch.deployment_configs.production.d1_databases.OTHER.id, 'other-db'); bound = true; result = {}; }
      else result = { deployment_configs: { production: { d1_databases: { OTHER: { id: 'other-db' }, ...(bound ? { GROWTH_DB: { id: 'growth-db' } } : {}) } } } };
    } else if (url.endsWith('/query')) result = [{ success: true }];
    else result = [{ name: 'practice-growth', uuid: 'growth-db' }];
    return Response.json({ success: true, result });
  };
  await setupGrowth({ accountId: 'account', projectName: 'practice', token: 'test-token', fetcher });
  assert.equal(calls.filter(([url, options]) => url.endsWith('/d1/database') && options.method === 'POST').length, 0);
  assert.ok(bound);
});
test('Setup stops on missing permissions without attempting a binding or deployment', async () => {
  const calls = [];
  await assert.rejects(setupGrowth({ accountId: 'account', projectName: 'practice', token: 'test-token', fetcher: async (url, options) => { calls.push(options.method); return Response.json({ success: false }, { status: 403 }); } }), /D1 Edit/);
  assert.deepEqual(calls, ['GET']);
});
