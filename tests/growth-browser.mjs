import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const origin = 'https://www.back-to-life-mental-health.com';
const source = await readFile(new URL('../script.js', import.meta.url), 'utf8');
const growth = await readFile(new URL('../growth.js', import.meta.url), 'utf8');
const reportHTML = await readFile(new URL('../growth-report.html', import.meta.url), 'utf8');
const reportJS = await readFile(new URL('../growth-report.js', import.meta.url), 'utf8');
const scheduler = 'https://d2oe0ra32qx05a.cloudfront.net/?practiceKey=k_1_108034';
const fixture = `<!doctype html><html><head><title>Practice</title><script defer src="/script.js"></script></head><body><header class="site-header" data-header><nav data-nav><a href="${scheduler}" id="book">Book Appointment</a></nav></header><main><a href="tel:+14803138583" id="phone">Call office</a><a href="tel:988" id="crisis">Crisis</a><a href="/contact" id="next">Contact</a></main><footer class="site-footer"><div class="footer-grid"><div><h3>Contact</h3><a href="mailto:Admin@BTLMH.com">Email</a></div></div></footer></body></html>`;
const browser = await chromium.launch({ headless: true });
let passed = 0;
async function scenario(name, run, settings = {}) {
  const context = await browser.newContext({ viewport: settings.viewport || { width: 1280, height: 900 } });
  const events = [], errors = [];
  await context.addInitScript(settings => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    if (settings.dnt) Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' });
    if (settings.gpc) Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => true });
    if (settings.noStorage) Object.defineProperty(window, 'sessionStorage', { get() { throw Error('Storage disabled'); } });
  }, settings);
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/growth') {
      events.push(route.request().postDataJSON());
      assert.equal(route.request().headers().referer, undefined);
      if (settings.offline) return route.abort();
      return route.fulfill({ status: 204 });
    }
    if (url.pathname === '/script.js') return route.fulfill({ contentType: 'application/javascript', body: source });
    if (url.pathname === '/growth.js') return route.fulfill({ contentType: 'application/javascript', body: growth });
    if (url.pathname === '/growth-report.js') return route.fulfill({ contentType: 'application/javascript', body: reportJS });
    if (url.pathname === '/growth-report.html') return route.fulfill({ contentType: 'text/html', body: reportHTML });
    if (url.pathname === '/api/growth-report') {
      assert.equal(route.request().headers().authorization, 'Bearer test-only-key-abcdefghijklmnopqrstuvwxyz');
      return route.fulfill({ json: { start: '2026-10-01', end: '2026-10-07', timezone: 'America/Phoenix', first_event_day: '2026-10-01', rows: [{ day: '2026-10-01', event: 'booking_click', page: 'education', source: 'direct_unknown', placement: 'main', count: 3 }], note: 'Counts are actions.' } });
    }
    if (url.origin === origin && !/\.(css|svg|webmanifest)$/.test(url.pathname)) return route.fulfill({ contentType: 'text/html', body: fixture });
    return route.fulfill({ status: 200, body: '' });
  });
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  try { await run(page, events); assert.deepEqual(errors, []); passed++; console.log(`PASS ${name}`); }
  finally { await context.close(); }
}
try {
  await scenario('Desktop scheduler, fallback and phone events stay distinct', async (page, events) => {
    const firstView = page.waitForResponse(response => response.url().endsWith('/api/growth'));
    await page.goto(`${origin}/?utm_source=facebook&utm_medium=paid_social&secret=never-send`);
    await firstView;
    await page.locator('#book').click();
    await page.locator('dialog').waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('dialog')?.open);
    await page.locator('[data-scheduler-fallback]').evaluate(node => node.addEventListener('click', event => event.preventDefault()));
    await page.locator('[data-scheduler-fallback]').click({ noWaitAfter: true });
    await page.locator('[data-scheduler-close]').click();
    const nextView = page.waitForResponse(response => response.url().endsWith('/api/growth'));
    await page.locator('#next').click();
    await nextView;
    await page.locator('#phone').click({ noWaitAfter: true });
    await page.waitForTimeout(150);
    for (const name of ['page_view', 'booking_click', 'scheduler_open', 'scheduler_external', 'phone_click']) assert.ok(events.some(e => e.event === name), `${name} absent`);
    assert.equal(events.filter(e => e.event === 'booking_click').length, 1);
    assert.ok(events.every(e => e.source === 'facebook_paid'));
    assert.ok(!JSON.stringify(events).includes('secret'));
  });
  await scenario('Mobile floating button opens scheduling even when collection fails', async (page, events) => {
    await page.goto(origin); await page.waitForTimeout(150);
    await page.locator('[data-scheduler-launcher]').click();
    assert.equal(await page.locator('dialog').evaluate(node => node.open), true);
    await page.waitForTimeout(100);
    assert.ok(events.some(e => e.event === 'booking_click' && e.placement === 'floating'));
    assert.ok(events.some(e => e.event === 'scheduler_open'));
  }, { viewport: { width: 390, height: 844 }, offline: true });
  for (const setting of [{ dnt: true }, { gpc: true }]) await scenario(`Privacy signal ${Object.keys(setting)[0]} suppresses all collection`, async (page, events) => {
    await page.goto(origin); await page.waitForTimeout(100); await page.locator('#book').click();
    assert.equal(await page.locator('dialog').evaluate(node => node.open), true); assert.equal(events.length, 0);
  }, setting);
  await scenario('Condition names, queries and disabled storage do not leak', async (page, events) => {
    await page.goto(`${origin}/adhd?patient=secret`); await page.waitForTimeout(150); await page.locator('#book').click(); await page.waitForTimeout(100);
    assert.ok(events.length >= 2); assert.ok(events.every(e => e.page === 'education' && e.source === 'direct_unknown'));
    assert.ok(!JSON.stringify(events).includes('adhd')); assert.ok(!JSON.stringify(events).includes('patient'));
  }, { noStorage: true });
  await scenario('Current patient resources excluded', async (page, events) => {
    await page.goto(`${origin}/current-patients`); await page.waitForTimeout(100); await page.locator('#book').click(); await page.waitForTimeout(50); assert.equal(events.length, 0);
  });
  await scenario('Protected report renders counts without disclosing key in URL or page analytics', async (page, events) => {
    await page.goto(`${origin}/growth-report.html`);
    await page.locator('#report-key').fill('test-only-key-abcdefghijklmnopqrstuvwxyz');
    await page.getByRole('button', { name: 'Show report' }).click();
    await page.locator('#results').waitFor({ state: 'visible' });
    assert.ok((await page.locator('#sources').innerText()).includes('Direct / unknown'));
    assert.ok((await page.locator('#totals').innerText()).includes('3'));
    assert.equal(events.length, 0); assert.equal(await page.evaluate(() => localStorage.length), 0);
    assert.ok(!page.url().includes('test-only-key'));
  });
} finally { await browser.close(); }
console.log(`${passed} browser scenarios passed.`);
