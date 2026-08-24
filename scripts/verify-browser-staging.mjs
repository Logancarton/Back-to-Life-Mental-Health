#!/usr/bin/env node

import { chromium } from 'playwright';

const baseUrl = (process.argv[2] || '').replace(/\/$/, '');
if (!baseUrl) {
  console.error('Usage: node scripts/verify-browser-staging.mjs <base-url>');
  process.exit(2);
}

const schedulerUrl = 'https://d2oe0ra32qx05a.cloudfront.net/?practiceKey=k_1_108034';
const portalUrl = 'https://portal.kareo.com/';
const telehealthUrl = 'https://telehealth.kareo.com/lcarton';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function gotoPath(page, path, expectedStatus = 200) {
  const response = await page.goto(`${baseUrl}${path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  assert(response, `${path}: browser navigation returned no response`);
  assert(response.status() === expectedStatus, `${path}: expected HTTP ${expectedStatus}, got ${response.status()}`);
  await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(250);
  return response;
}

async function assertNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  assert(
    dimensions.scrollWidth <= dimensions.viewport + 2,
    `${label}: horizontal overflow ${dimensions.scrollWidth}px > ${dimensions.viewport}px viewport`
  );
}

async function assertLocalImagesRespond(page, label) {
  const urls = await page.locator('img[src]').evaluateAll((images) => images.map((image) => image.src));
  for (const url of [...new Set(urls)]) {
    if (!url.startsWith(baseUrl)) continue;
    const response = await page.context().request.get(url, { timeout: 20000 });
    assert(response.ok(), `${label}: image failed ${url} -> ${response.status()}`);
  }
}

async function currentNavPaths(page) {
  return page.locator('[data-nav] a[aria-current="page"]').evaluateAll((links) =>
    links.map((link) => {
      const path = new URL(link.href, window.location.href).pathname.replace(/\/+$/, '');
      return path || '/';
    })
  );
}

async function assertLinkExists(page, href, label) {
  const count = await page.locator(`a[href="${href}"]`).count();
  assert(count > 0, `${label}: expected link ${href}`);
}

async function testSchedulerLifecycle(page, label, expectMobileDialog = false) {
  const launcher = page.locator('[data-scheduler-launcher]');
  const dialog = page.locator('[data-scheduler-dialog]');

  await launcher.waitFor({ state: 'visible', timeout: 10000 });
  await launcher.click();
  await page.waitForFunction(() => document.querySelector('[data-scheduler-dialog]')?.open === true);

  assert(await dialog.evaluate((node) => node.open), `${label}: scheduler did not open`);
  assert(await page.locator('[data-scheduler-dialog] iframe').count() === 1, `${label}: scheduler iframe missing`);
  assert(
    await page.locator('[data-scheduler-dialog] iframe').getAttribute('src') === schedulerUrl,
    `${label}: scheduler iframe URL changed`
  );

  if (expectMobileDialog) {
    const metrics = await dialog.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        width: node.getBoundingClientRect().width,
        viewport: window.innerWidth,
        radius: style.borderRadius
      };
    });
    assert(Math.abs(metrics.width - metrics.viewport) <= 2, `${label}: scheduler is not full-width on small mobile viewport`);
    assert(metrics.radius === '0px', `${label}: mobile scheduler should be edge-to-edge`);

    const mobileBar = page.locator('[data-mobile-contact-bar]');
    const mobileBarState = await mobileBar.evaluate((node) => {
      const style = getComputedStyle(node);
      return { opacity: style.opacity, pointerEvents: style.pointerEvents };
    });
    assert(mobileBarState.opacity === '0', `${label}: mobile contact bar remains visible over scheduler`);
    assert(mobileBarState.pointerEvents === 'none', `${label}: mobile contact bar remains clickable over scheduler`);
  }

  await page.locator('[data-scheduler-close]').click();
  await page.waitForFunction(() => document.querySelector('[data-scheduler-dialog]')?.open === false);
  assert(await launcher.getAttribute('aria-expanded') === 'false', `${label}: launcher aria-expanded did not reset`);

  await launcher.click();
  await page.waitForFunction(() => document.querySelector('[data-scheduler-dialog]')?.open === true);
  assert(await page.locator('[data-scheduler-dialog] iframe').count() === 1, `${label}: scheduler iframe duplicated after reopen`);
  await page.locator('[data-scheduler-close]').click();
  await page.waitForFunction(() => document.querySelector('[data-scheduler-dialog]')?.open === false);
}

const browser = await chromium.launch({ headless: true });

try {
  const desktopContext = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const desktop = await desktopContext.newPage();

  await gotoPath(desktop, '/');
  assert(!(await desktop.locator('body').innerText()).includes('275518'), 'Homepage still exposes removed license number');
  assert(!(await desktop.locator('[data-menu-toggle]').isVisible()), 'Desktop hamburger should be hidden');
  assert(await desktop.locator('img.hero-photo-image').evaluate((image) => image.complete && image.naturalWidth > 0), 'Homepage hero image did not render');
  await assertNoHorizontalOverflow(desktop, 'desktop home');
  await assertLocalImagesRespond(desktop, 'desktop home');
  await testSchedulerLifecycle(desktop, 'desktop scheduler');
  console.log('PASS desktop homepage + scheduler');

  await gotoPath(desktop, '/current-patients');
  const portalLinks = await desktop.locator('[data-nav] a').evaluateAll((links) =>
    links.filter((link) => new URL(link.href, window.location.href).pathname.replace(/\/+$/, '') === '/current-patients').length
  );
  assert(portalLinks === 1, `Current Patients: expected one top-nav route, found ${portalLinks}`);
  await assertLinkExists(desktop, portalUrl, 'Current Patients portal');
  await assertLinkExists(desktop, telehealthUrl, 'Current Patients telehealth');
  assert(JSON.stringify(await currentNavPaths(desktop)) === JSON.stringify(['/current-patients']), 'Current Patients top-nav active state is incorrect');
  await assertNoHorizontalOverflow(desktop, 'desktop current patients');
  console.log('PASS Current Patients + portal/telehealth links');

  await gotoPath(desktop, '/medication-management');
  const medicationNav = await currentNavPaths(desktop);
  assert(
    JSON.stringify(medicationNav) === JSON.stringify(['/medication-management']),
    `Medication Management: expected one active nav item, got ${JSON.stringify(medicationNav)}`
  );
  console.log('PASS Medication Management active navigation');

  await gotoPath(desktop, '/adhd');
  assert(JSON.stringify(await currentNavPaths(desktop)) === JSON.stringify(['/services']), 'ADHD should keep Services active in top navigation');
  console.log('PASS condition-page parent navigation');

  await gotoPath(desktop, '/about');
  const videoSources = await desktop.locator('.provider-intro-video source').evaluateAll((sources) =>
    sources.map((source) => ({ src: source.src, type: source.type }))
  );
  assert(videoSources.length >= 2, 'About: expected MP4 plus MOV fallback');
  assert(videoSources[0].type === 'video/mp4', `About: first video source is ${videoSources[0]?.type || 'missing'}, expected video/mp4`);
  assert(videoSources[1].type === 'video/quicktime', `About: second video source is ${videoSources[1]?.type || 'missing'}, expected video/quicktime`);
  const mp4Response = await desktop.context().request.get(videoSources[0].src, { timeout: 30000 });
  assert(mp4Response.ok(), `About: deployed MP4 returned ${mp4Response.status()}`);
  await assertLocalImagesRespond(desktop, 'desktop about');
  await assertNoHorizontalOverflow(desktop, 'desktop about');
  console.log('PASS About video source + images');

  await gotoPath(desktop, '/insurance-payment');
  await assertLocalImagesRespond(desktop, 'desktop insurance');
  await assertNoHorizontalOverflow(desktop, 'desktop insurance');
  console.log('PASS insurance images/layout');

  await gotoPath(desktop, '/contact');
  await assertLinkExists(desktop, 'tel:+14803138583', 'Contact phone');
  await assertLinkExists(desktop, 'mailto:Admin@BTLMH.com', 'Contact email');
  const directionsCount = await desktop.locator('a[href^="https://www.google.com/maps/search/"]').count();
  assert(directionsCount > 0, 'Contact: Google Maps directions link missing');
  await assertLocalImagesRespond(desktop, 'desktop contact');
  await assertNoHorizontalOverflow(desktop, 'desktop contact');
  console.log('PASS contact links + images/layout');

  await gotoPath(desktop, '/this-page-should-not-exist', 404);
  assert((await desktop.locator('body').innerText()).toLowerCase().includes('page not found'), '404 page content did not render');
  console.log('PASS rendered 404');

  await desktopContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobile = await mobileContext.newPage();
  await gotoPath(mobile, '/');
  const toggle = mobile.locator('[data-menu-toggle]');
  const nav = mobile.locator('[data-nav]');
  assert(await toggle.isVisible(), 'Mobile hamburger is not visible');
  await toggle.click();
  assert(await toggle.getAttribute('aria-expanded') === 'true', 'Mobile hamburger did not set aria-expanded=true');
  assert(await nav.evaluate((node) => node.classList.contains('open')), 'Mobile navigation did not open');

  const barWhileMenuOpen = await mobile.locator('[data-mobile-contact-bar]').evaluate((node) => {
    const style = getComputedStyle(node);
    return { opacity: style.opacity, pointerEvents: style.pointerEvents };
  });
  assert(barWhileMenuOpen.opacity === '0', 'Mobile action bar remains visible over open menu');
  assert(barWhileMenuOpen.pointerEvents === 'none', 'Mobile action bar remains clickable over open menu');

  await toggle.click();
  assert(await toggle.getAttribute('aria-expanded') === 'false', 'Mobile hamburger did not close');
  assert(!(await nav.evaluate((node) => node.classList.contains('open'))), 'Mobile navigation retained open class');
  await assertNoHorizontalOverflow(mobile, 'mobile home');
  await testSchedulerLifecycle(mobile, 'mobile scheduler', true);
  console.log('PASS mobile hamburger + scheduler');

  for (const path of ['/about', '/current-patients', '/insurance-payment', '/contact', '/medication-management']) {
    await gotoPath(mobile, path);
    await assertNoHorizontalOverflow(mobile, `mobile ${path}`);
  }
  console.log('PASS representative mobile layouts');

  await gotoPath(mobile, '/current-patients');
  assert(JSON.stringify(await currentNavPaths(mobile)) === JSON.stringify(['/current-patients']), 'Mobile Current Patients nav state is incorrect');

  const schedulerLinks = await mobile.locator(`a[href="${schedulerUrl}"]`).count();
  assert(schedulerLinks > 0, 'Scheduler URL is missing from rendered site');
  console.log('PASS scheduler destination preserved');

  await mobileContext.close();
  console.log('All rendered staging browser checks passed.');
} finally {
  await browser.close();
}
