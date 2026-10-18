/* First-party aggregate measurement. No visitor IDs, cookies, full URLs,
   referrer strings, form values or condition names leave this module. */
(() => {
  'use strict';
  if (location.origin !== 'https://www.back-to-life-mental-health.com' || navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true || navigator.webdriver) return;
  const pages = { '/': 'home', '/services': 'services', '/psychiatric-evaluation': 'evaluation', '/medication-management': 'medication', '/new-patients': 'new_patients', '/insurance-payment': 'insurance', '/telehealth': 'telehealth', '/about': 'about', '/contact': 'contact', '/adhd': 'education', '/anxiety': 'education', '/depression': 'education', '/ptsd': 'education', '/ocd': 'education', '/bipolar': 'education', '/grief-loss': 'education', '/life-transitions': 'education' };
  const path = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const page = pages[path === '/index' ? '/' : path];
  if (!page) return; // Patient resources, FAQs, privacy and unknown routes excluded.
  const allowedSources = ['organic_search', 'google_paid', 'facebook_paid', 'facebook_organic', 'instagram', 'referral', 'direct_unknown'];
  let source = 'direct_unknown';
  try {
    const query = new URLSearchParams(location.search);
    const campaignSource = (query.get('utm_source') || '').toLowerCase();
    const paid = /^(cpc|ppc|paid|paid_social|paidsocial)$/.test((query.get('utm_medium') || '').toLowerCase());
    const referrer = document.referrer ? new URL(document.referrer) : null;
    const domain = referrer?.hostname || '';
    const is = name => domain === name || domain.endsWith(`.${name}`);
    if ((campaignSource === 'google' && paid) || query.has('gclid')) source = 'google_paid';
    else if (['facebook', 'fb', 'meta'].includes(campaignSource)) source = paid ? 'facebook_paid' : 'facebook_organic';
    else if (['instagram', 'ig'].includes(campaignSource)) source = 'instagram';
    else if (referrer?.origin === location.origin) {
      try { const saved = sessionStorage.getItem('btlmh_growth_source'); if (allowedSources.includes(saved)) source = saved; } catch { /* storage is optional */ }
    } else if (is('google.com') || is('bing.com') || is('duckduckgo.com') || is('search.yahoo.com')) source = 'organic_search';
    else if (is('facebook.com') || is('fb.com')) source = 'facebook_organic';
    else if (is('instagram.com')) source = 'instagram';
    else if (referrer) source = 'referral';
    try { sessionStorage.setItem('btlmh_growth_source', source); } catch { /* no identifiers needed */ }
  } catch { /* unknown source stays explicit */ }
  const last = new Map();
  function send(event, placement = 'page') {
    const key = `${event}:${placement}`;
    const now = Date.now();
    if (last.has(key) && now - last.get(key) < 1000) return;
    last.set(key, now);
    try {
      void fetch('/api/growth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ v: 1, event, page, source, placement }), credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true, cache: 'no-store' }).catch(() => {});
    } catch { /* Measurement must never interrupt scheduling or navigation. */ }
  }
  const placement = element => element?.closest('[data-scheduler-fallback], [data-scheduler-dialog]') ? 'scheduler' : element?.closest('[data-scheduler-launcher]') ? 'floating' : element?.closest('.site-header') ? 'header' : element?.closest('.site-footer') ? 'footer' : 'main';
  function clicked(event) {
    if (!event.isTrusted || (event.type === 'auxclick' && event.button !== 1)) return;
    const element = event.target instanceof Element ? event.target.closest('a[href], [data-scheduler-launcher]') : null;
    if (!element) return;
    const where = placement(element);
    if (element.hasAttribute('data-scheduler-launcher')) { send('booking_click', where); return; }
    let url;
    try { url = new URL(element.getAttribute('href'), location.href); } catch { return; }
    if (url.protocol === 'tel:' && url.pathname.replace(/[^\d]/g, '') === '14803138583') send('phone_click', where);
    else if (url.origin === 'https://d2oe0ra32qx05a.cloudfront.net' && url.searchParams.get('practiceKey') === 'k_1_108034') send(element.hasAttribute('data-scheduler-fallback') ? 'scheduler_external' : 'booking_click', where);
  }
  document.addEventListener('click', clicked, true);
  document.addEventListener('auxclick', clicked, true);
  window.addEventListener('btlmh:scheduler-open', event => send('scheduler_open', placement(event.detail?.trigger)));
  let viewed = false;
  function view() { if (!viewed && document.visibilityState === 'visible') { viewed = true; send('page_view'); } }
  document.addEventListener('visibilitychange', view);
  view();
})();
