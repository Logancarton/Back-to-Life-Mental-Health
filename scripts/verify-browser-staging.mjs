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
const ghToken = process.env.GH_TOKEN || '';
const ghRepo = process.env.GITHUB_REPOSITORY || '';
const ghSha = process.env.GITHUB_SHA || '';
const crisisText = 'In a crisis? If you are having thoughts of suicide or are in emotional distress, call or text 988 to reach the 988 Suicide & Crisis Lifeline, or call 911 for a medical emergency. Back to Life Mental Health is an outpatient practice and does not provide emergency or after-hours crisis services.';
const publicRoutes = [
  '/', '/services', '/psychiatric-evaluation', '/north-phoenix-psychiatric-care',
  '/medication-management', '/new-patients', '/current-patients',
  '/insurance-payment', '/telehealth', '/faq', '/about', '/contact', '/anxiety',
  '/depression', '/adhd', '/ptsd', '/ocd', '/bipolar', '/grief-loss',
  '/life-transitions', '/privacy'
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function publish(state, description, context = 'task2-browser-qa') {
  if (!ghToken || !ghRepo || !ghSha) return;
  await fetch(`https://api.github.com/repos/${ghRepo}/statuses/${ghSha}`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${ghToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ state, context, description: String(description).slice(0, 140) })
  });
}

async function goto(page, path, expectedStatus = 200) {
  const response = await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  assert(response, `${path}: no navigation response`);
  assert(response.status() === expectedStatus, `${path}: expected ${expectedStatus}, got ${response.status()}`);
  await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(250);
}

async function noOverflow(page, label) {
  const result = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  assert(result.scrollWidth <= result.viewport + 2, `${label}: horizontal overflow ${result.scrollWidth} > ${result.viewport}`);
}

async function localImagesLoad(page, label) {
  const images = page.locator('img[src]');
  const count = await images.count();
  for (let index = 0; index < count; index += 1) {
    const image = images.nth(index);
    const src = await image.getAttribute('src');
    if (!src) continue;
    const absolute = new URL(src, `${baseUrl}/`).href;
    if (!absolute.startsWith(baseUrl)) continue;

    if (!(await image.isVisible())) {
      const response = await page.context().request.get(absolute, { timeout: 10000 });
      assert(response.ok(), `${label}: hidden image returned ${response.status()}: ${absolute}`);
      continue;
    }

    await image.scrollIntoViewIfNeeded();
    const handle = await image.elementHandle();
    if (!handle) throw new Error(`${label}: image handle missing: ${absolute}`);
    await page.waitForFunction((node) => node.complete && node.naturalWidth > 0, handle, { timeout: 10000 });
  }
}

async function localAssetLoads(page, assetPath, label) {
  const absolute = new URL(assetPath, `${baseUrl}/`).href;
  const response = await page.context().request.get(absolute, { timeout: 15000 });
  assert(response.ok(), `${label}: asset returned ${response.status()}: ${absolute}`);
}

async function heroUsesAsset(page, assetPath, label) {
  const hero = page.locator('.condition-hero');
  assert(await hero.count() === 1, `${label}: condition hero missing`);
  assert(await hero.isVisible(), `${label}: condition hero not visible`);
  const urls = await hero.evaluate((node) => {
    const background = getComputedStyle(node).backgroundImage;
    return [...background.matchAll(/url\(["']?(.*?)["']?\)/g)].map((match) => decodeURI(match[1]));
  });
  assert(urls.some((url) => url.endsWith(assetPath)), `${label}: expected hero asset ${assetPath}; got ${urls.join(', ') || 'none'}`);
  await localAssetLoads(page, assetPath, label);
}

async function activeNav(page) {
  return page.locator('[data-nav] a[aria-current="page"]').evaluateAll((links) => links.map((link) => {
    const path = new URL(link.href, window.location.href).pathname.replace(/\/+$/, '');
    return path || '/';
  }));
}

async function exactLink(page, href, label) {
  assert(await page.locator(`a[href="${href}"]`).count() > 0, `${label}: missing ${href}`);
}

async function schedulerLifecycle(page, label, mobile = false) {
  const launcher = page.locator('[data-scheduler-launcher]');
  await launcher.waitFor({ state: 'visible', timeout: 10000 });
  const hitTestable = await launcher.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit === node || node.contains(hit);
  });
  assert(hitTestable, `${label}: launcher covered or not clickable`);

  await launcher.evaluate((node) => node.click());
  await page.waitForFunction(() => document.querySelector('[data-scheduler-dialog]')?.open === true);
  const dialog = page.locator('[data-scheduler-dialog]');
  assert(await dialog.getAttribute('aria-labelledby') === 'scheduler-dialog-title', `${label}: dialog accessibility label missing`);
  assert(await launcher.getAttribute('aria-expanded') === 'true', `${label}: aria-expanded did not open`);
  assert(await page.locator('[data-scheduler-dialog] iframe').count() === 1, `${label}: iframe missing`);
  assert(await page.locator('[data-scheduler-dialog] iframe').getAttribute('src') === schedulerUrl, `${label}: scheduler destination changed`);
  assert(await page.locator(`[data-scheduler-fallback][href="${schedulerUrl}"]`).count() === 1, `${label}: fallback missing`);

  if (mobile) {
    const metrics = await dialog.evaluate((node) => ({
      width: node.getBoundingClientRect().width,
      viewport: window.innerWidth,
      radius: getComputedStyle(node).borderRadius
    }));
    assert(Math.abs(metrics.width - metrics.viewport) <= 2, `${label}: dialog is not edge-to-edge`);
    assert(metrics.radius === '0px', `${label}: dialog radius should be 0`);
    await page.waitForFunction(() => {
      const bar = document.querySelector('[data-mobile-contact-bar]');
      return bar && getComputedStyle(bar).opacity === '0' && getComputedStyle(bar).pointerEvents === 'none';
    });
  }

  await page.locator('[data-scheduler-close]').evaluate((node) => node.click());
  await page.waitForFunction(() => document.querySelector('[data-scheduler-dialog]')?.open === false);
  await page.waitForFunction(() => document.querySelector('[data-scheduler-launcher]')?.getAttribute('aria-expanded') === 'false');
  await page.waitForFunction(() => document.activeElement === document.querySelector('[data-scheduler-launcher]'));

  await launcher.evaluate((node) => node.click());
  await page.waitForFunction(() => document.querySelector('[data-scheduler-dialog]')?.open === true);
  assert(await page.locator('[data-scheduler-dialog] iframe').count() === 1, `${label}: iframe duplicated after reopen`);
  await page.locator('[data-scheduler-close]').evaluate((node) => node.click());
  await page.waitForFunction(() => document.querySelector('[data-scheduler-dialog]')?.open === false);
}

async function guidedHomepage(page, label) {
  const tabs = page.getByRole('tab');
  const panel = page.getByRole('tabpanel');
  assert(await tabs.count() === 4, `${label}: expected four starting points`);
  const titles = [
    'You don’t need to have it all figured out.',
    'Your experience comes with you.',
    'Room for your concerns. And their perspective.',
    'Understand the why. Talk through the tradeoffs.'
  ];
  for (let i = 0; i < titles.length; i += 1) {
    await tabs.nth(i).click();
    assert(await tabs.nth(i).getAttribute('aria-selected') === 'true', `${label}: selection ${i} missing`);
    assert(await panel.count() === 1, `${label}: more than one visible panel`);
    const heading = (await panel.locator('h3').innerText()).replace(/\s+/g, ' ').trim();
    assert(heading === titles[i], `${label}: wrong content for selection ${i}`);
    await noOverflow(page, `${label} path ${i}`);
    const link = panel.locator('a').first();
    assert(await link.isVisible(), `${label}: next-step link missing`);
    const destination = await link.getAttribute('href');
    const response = await page.context().request.get(new URL(destination, baseUrl).href);
    assert(response.ok(), `${label}: next-step destination failed`);
  }
  await tabs.nth(3).press('ArrowRight');
  assert(await tabs.nth(0).getAttribute('aria-selected') === 'true', `${label}: arrow wrap failed`);
  await tabs.nth(0).press('End');
  assert(await tabs.nth(3).getAttribute('aria-selected') === 'true', `${label}: End failed`);
  await tabs.nth(3).press('Home');
  assert(await tabs.nth(0).getAttribute('aria-selected') === 'true', `${label}: Home failed`);
  assert(await tabs.nth(0).evaluate(node => node === document.activeElement), `${label}: focus lost`);
  assert(await page.locator('[data-patient-resources]').count() === 1, `${label}: duplicated practical resources`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

async function verifyStaticBuild(request) {
  for (const path of publicRoutes) {
    const response = await request.get(`${baseUrl}${path}`, { timeout: 15000 });
    assert(response.ok(), `${path}: static build request returned ${response.status()}`);
    const source = await response.text();

    assert(source.includes('<meta property="og:title"'), `${path}: static og:title missing`);
    assert(source.includes('<meta property="og:description"'), `${path}: static og:description missing`);
    assert(source.includes('<meta property="og:url"'), `${path}: static og:url missing`);
    assert(source.includes('<meta name="twitter:card" content="summary_large_image">'), `${path}: static Twitter card missing`);
    assert(source.includes('href="enhancements-base.css"'), `${path}: parallel enhancements-base stylesheet missing`);
    assert(source.includes('href="enhancements.css"'), `${path}: enhancements stylesheet missing`);

    const crisisBlocks = source.match(/class="container crisis-block"/g) || [];
    assert(crisisBlocks.length === 1, `${path}: expected one static crisis block, got ${crisisBlocks.length}`);
    const plain = source.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    assert(plain.includes(crisisText), `${path}: static crisis wording changed`);
    assert(source.includes('href="tel:988"'), `${path}: 988 link missing`);
    assert(source.includes('href="tel:911"'), `${path}: 911 link missing`);

    const imgTags = source.match(/<img\b[^>]*>/gi) || [];
    for (const tag of imgTags) {
      assert(/\bwidth="\d+"/i.test(tag) && /\bheight="\d+"/i.test(tag), `${path}: image missing intrinsic dimensions: ${tag.slice(0, 120)}`);
    }
  }

  const cssResponse = await request.get(`${baseUrl}/enhancements.css`, { timeout: 15000 });
  assert(cssResponse.ok(), `enhancements.css returned ${cssResponse.status()}`);
  const css = await cssResponse.text();
  assert(!/@import\s+url\(["']enhancements-base\.css["']\)/i.test(css), 'enhancements.css still contains render-blocking @import');

  const sitemapResponse = await request.get(`${baseUrl}/sitemap.xml`, { timeout: 15000 });
  assert(sitemapResponse.ok(), `sitemap.xml returned ${sitemapResponse.status()}`);
  const sitemap = await sitemapResponse.text();
  const lastmods = sitemap.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) || [];
  assert(lastmods.length === publicRoutes.length, `sitemap expected ${publicRoutes.length} lastmod values, got ${lastmods.length}`);
}

const conditionPhotography = [
  ['/anxiety', 'assets/images/anxiety.webp'],
  ['/adhd', 'assets/images/organized-desk.webp'],
  ['/ptsd', 'assets/images/ptsd-safe.webp'],
  ['/ocd', 'assets/images/ocd-organizing.webp'],
  ['/grief-loss', 'assets/images/grief-and-loss.webp'],
  ['/medication-management', 'assets/images/script-pad.webp']
];

let browser;
try {
  await publish('pending', 'Rendered staging QA is running');
  browser = await chromium.launch({ headless: true });
  const desktopContext = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const desktop = await desktopContext.newPage();

  await verifyStaticBuild(desktopContext.request);
  await publish('success', 'Static metadata, WebP, sitemap, and crisis resources passed', 'task4-seo-perf');

  await goto(desktop, '/');
  assert(!(await desktop.locator('body').innerText()).includes('275518'), 'Homepage still contains removed license number');
  assert(!(await desktop.locator('[data-menu-toggle]').isVisible()), 'Desktop hamburger should be hidden');
  assert((await desktop.locator('body').innerText()).includes('North Phoenix'), 'Homepage missing North Phoenix geographic positioning');
  assert((await desktop.locator('body').innerText()).includes('Logan Carton, PMHNP-BC'), 'Homepage provider credential missing');
  await exactLink(desktop, '/north-phoenix-psychiatric-care', 'Homepage regional care link');
  await exactLink(desktop, 'tel:988', 'Homepage 988 crisis link');
  await exactLink(desktop, 'tel:911', 'Homepage 911 emergency link');
  await localImagesLoad(desktop, 'desktop home');
  await desktop.evaluate(() => window.scrollTo(0, 0));
  await desktop.waitForTimeout(200);
  await noOverflow(desktop, 'desktop home');
  await schedulerLifecycle(desktop, 'desktop scheduler');
  await guidedHomepage(desktop, 'desktop guided homepage');
  await publish('success', 'Desktop homepage and scheduler passed', 'task2-desktop-home');

  await goto(desktop, '/current-patients');
  const currentPatientTopLinks = await desktop.locator('[data-nav] a').evaluateAll((links) => links.filter((link) => new URL(link.href, window.location.href).pathname.replace(/\/+$/, '') === '/current-patients').length);
  assert(currentPatientTopLinks === 1, `Current Patients expected one top-nav route found ${currentPatientTopLinks}`);
  assert(JSON.stringify(await activeNav(desktop)) === JSON.stringify(['/current-patients']), 'Current Patients active navigation incorrect');
  await exactLink(desktop, portalUrl, 'Patient Portal');
  await exactLink(desktop, telehealthUrl, 'Direct telehealth');
  await noOverflow(desktop, 'desktop current patients');
  await publish('success', 'Current Patients links/navigation passed', 'task2-current-patients');

  await goto(desktop, '/medication-management');
  assert(JSON.stringify(await activeNav(desktop)) === JSON.stringify(['/medication-management']), 'Medication Management not sole current nav item');
  await goto(desktop, '/psychiatric-evaluation');
  assert(JSON.stringify(await activeNav(desktop)) === JSON.stringify(['/services']), 'Psychiatric Evaluation did not keep Services current');
  await goto(desktop, '/north-phoenix-psychiatric-care');
  assert(JSON.stringify(await activeNav(desktop)) === JSON.stringify(['/services']), 'North Phoenix regional page did not keep Services current');
  assert((await desktop.locator('body').innerText()).includes('Norterra'), 'North Phoenix regional page missing surrounding-area content');
  await exactLink(desktop, '/contact', 'North Phoenix regional Contact link');
  await localImagesLoad(desktop, 'desktop north phoenix');
  await noOverflow(desktop, 'desktop north phoenix');
  await goto(desktop, '/adhd');
  assert(JSON.stringify(await activeNav(desktop)) === JSON.stringify(['/services']), 'Condition page did not keep Services current');
  await publish('success', 'Active navigation and regional page passed', 'task2-navigation');

  await goto(desktop, '/about');
  const providerPhoto = desktop.locator('img[src$="me.webp"]');
  const managerPhoto = desktop.locator('img[src$="stacey.webp"]');
  const officePhoto = desktop.locator('img[src$="lobby.webp"]');
  assert(await providerPhoto.count() === 1 && await providerPhoto.isVisible(), 'About provider photo missing or hidden');
  assert(await managerPhoto.count() === 1 && await managerPhoto.isVisible(), 'About office-manager photo missing or hidden');
  assert(await officePhoto.count() === 1 && await officePhoto.isVisible(), 'About office photo missing or hidden');
  assert((await desktop.locator('body').innerText()).includes('Logan Carton, PMHNP-BC'), 'About provider credential missing');
  await localImagesLoad(desktop, 'desktop about');
  await noOverflow(desktop, 'desktop about');
  await publish('success', 'About photography/layout passed', 'task2-about');

  for (const [path, assetPath] of conditionPhotography) {
    await goto(desktop, path);
    await heroUsesAsset(desktop, assetPath, `desktop ${path}`);
    await noOverflow(desktop, `desktop ${path}`);
  }
  await publish('success', 'Condition photography passed', 'task3-condition-photography');

  await goto(desktop, '/insurance-payment');
  await localImagesLoad(desktop, 'desktop insurance');
  await noOverflow(desktop, 'desktop insurance');

  await goto(desktop, '/contact');
  await exactLink(desktop, 'tel:+14803138583', 'Phone');
  await exactLink(desktop, 'mailto:Admin@BTLMH.com', 'Email');
  await exactLink(desktop, '/north-phoenix-psychiatric-care', 'Contact regional care link');
  assert(await desktop.locator('a[href^="https://www.google.com/maps/search/"]').count() > 0, 'Directions link missing');
  await localImagesLoad(desktop, 'desktop contact');
  await noOverflow(desktop, 'desktop contact');

  await goto(desktop, '/task-2-real-404-check', 404);
  assert((await desktop.locator('body').innerText()).toLowerCase().includes('page not found'), 'Rendered 404 content missing');
  assert((await desktop.locator('.crisis-block').innerText()).replace(/\s+/g, ' ').trim() === crisisText, '404 crisis wording changed');
  await exactLink(desktop, 'tel:988', '404 988 crisis link');
  await exactLink(desktop, 'tel:911', '404 911 emergency link');
  await noOverflow(desktop, 'desktop 404');
  await publish('success', 'Desktop links/images/404 passed', 'task2-desktop-rest');
  await desktopContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobile = await mobileContext.newPage();
  await goto(mobile, '/');
  const toggle = mobile.locator('[data-menu-toggle]');
  const nav = mobile.locator('[data-nav]');
  assert(await toggle.isVisible(), 'Mobile hamburger not visible');
  await toggle.click();
  assert(await toggle.getAttribute('aria-expanded') === 'true', 'Mobile hamburger did not open');
  assert(await nav.evaluate((node) => node.classList.contains('open')), 'Mobile nav open class missing');
  await mobile.waitForFunction(() => {
    const bar = document.querySelector('[data-mobile-contact-bar]');
    return bar && getComputedStyle(bar).opacity === '0' && getComputedStyle(bar).pointerEvents === 'none';
  });
  await toggle.click();
  assert(await toggle.getAttribute('aria-expanded') === 'false', 'Mobile hamburger did not close');
  assert(!(await nav.evaluate((node) => node.classList.contains('open'))), 'Mobile nav stayed open');
  await noOverflow(mobile, 'mobile home');
  await guidedHomepage(mobile, 'mobile guided homepage');
  await schedulerLifecycle(mobile, 'mobile scheduler', true);
  await publish('success', 'Mobile hamburger/scheduler passed', 'task2-mobile-home');

  for (const path of ['/about', '/current-patients', '/insurance-payment', '/contact', '/psychiatric-evaluation', '/north-phoenix-psychiatric-care', '/medication-management', '/anxiety', '/adhd', '/ptsd', '/ocd', '/grief-loss']) {
    await goto(mobile, path);
    await noOverflow(mobile, `mobile ${path}`);
  }

  await goto(mobile, '/current-patients');
  assert(JSON.stringify(await activeNav(mobile)) === JSON.stringify(['/current-patients']), 'Mobile Current Patients active navigation incorrect');
  await exactLink(mobile, schedulerUrl, 'Mobile scheduler destination');
  await mobileContext.close();

  const fallbackContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const fallback = await fallbackContext.newPage();
  await goto(fallback, '/');
  assert(await fallback.locator('[data-start-panel]:visible').count() === 4, 'No-JavaScript starting paths missing');
  await noOverflow(fallback, 'no-JavaScript homepage');
  await fallbackContext.close();

  await publish('success', 'Desktop/mobile rendered staging QA passed');
  console.log('Rendered staging QA passed.');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const slug = message.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || 'unknown';
  await publish('failure', message, `task2-fail-${slug}`).catch(() => {});
  await publish('failure', message).catch(() => {});
  console.error(`Rendered staging QA failed: ${message}`);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
}
