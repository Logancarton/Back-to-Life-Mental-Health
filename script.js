// The provider introduction lives intentionally on the About page. Keep a
// graceful fallback if the owned video cannot be loaded by the browser.
document.querySelectorAll('.provider-video-card .provider-intro-video').forEach((video) => {
  const card = video.closest('.provider-video-card');
  if (!card) return;
  video.addEventListener('error', () => card.classList.add('video-unavailable'), { once: true });
  video.addEventListener('loadeddata', () => card.classList.remove('video-unavailable'), { once: true });
});

// Keep lightweight document fallbacks for utility pages such as the 404 page.
if (!document.querySelector('link[rel="icon"]')) {
  const icon = document.createElement('link');
  icon.rel = 'icon';
  icon.type = 'image/svg+xml';
  icon.href = 'favicon.svg';
  document.head.appendChild(icon);
}
if (!document.querySelector('link[rel="manifest"]')) {
  const manifest = document.createElement('link');
  manifest.rel = 'manifest';
  manifest.href = 'site.webmanifest';
  document.head.appendChild(manifest);
}
if (!document.querySelector('meta[name="theme-color"]')) {
  const theme = document.createElement('meta');
  theme.name = 'theme-color';
  theme.content = '#17323a';
  document.head.appendChild(theme);
}

// Cloudflare Pages owns the public URL shape. Normalize both repository .html
// paths and historical Odoo slugs to the same clean routes so shared behavior
// works identically in local/source files and on the deployed pages.dev host.
const siteOrigin = 'https://www.back-to-life-mental-health.com';
const publicPageRoutes = {
  'index.html': '/',
  'services.html': '/services',
  'psychiatric-evaluation.html': '/psychiatric-evaluation',
  'north-phoenix-psychiatric-care.html': '/north-phoenix-psychiatric-care',
  'medication-management.html': '/medication-management',
  'new-patients.html': '/new-patients',
  'current-patients.html': '/current-patients',
  'insurance-payment.html': '/insurance-payment',
  'telehealth.html': '/telehealth',
  'faq.html': '/faq',
  'about.html': '/about',
  'contact.html': '/contact',
  'anxiety.html': '/anxiety',
  'depression.html': '/depression',
  'adhd.html': '/adhd',
  'ptsd.html': '/ptsd',
  'ocd.html': '/ocd',
  'bipolar.html': '/bipolar',
  'grief-loss.html': '/grief-loss',
  'life-transitions.html': '/life-transitions',
  'privacy.html': '/privacy'
};
const routeAliases = {
  '/': '/',
  '/index.html': '/',
  '/services': '/services',
  '/services.html': '/services',
  '/services-overview': '/services',
  '/psychiatric-evaluation': '/psychiatric-evaluation',
  '/psychiatric-evaluation.html': '/psychiatric-evaluation',
  '/north-phoenix-psychiatric-care': '/north-phoenix-psychiatric-care',
  '/north-phoenix-psychiatric-care.html': '/north-phoenix-psychiatric-care',
  '/medication-management': '/medication-management',
  '/medication-management.html': '/medication-management',
  '/new-patients': '/new-patients',
  '/new-patients.html': '/new-patients',
  '/current-patients': '/current-patients',
  '/current-patients.html': '/current-patients',
  '/insurance-payment': '/insurance-payment',
  '/insurance-payment.html': '/insurance-payment',
  '/pricing': '/insurance-payment',
  '/telehealth': '/telehealth',
  '/telehealth.html': '/telehealth',
  '/faq': '/faq',
  '/faq.html': '/faq',
  '/about': '/about',
  '/about.html': '/about',
  '/about-us': '/about',
  '/contact': '/contact',
  '/contact.html': '/contact',
  '/contactus': '/contact',
  '/anxiety': '/anxiety',
  '/anxiety.html': '/anxiety',
  '/depression': '/depression',
  '/depression.html': '/depression',
  '/adhd': '/adhd',
  '/adhd.html': '/adhd',
  '/attention-deficit-hyperactive-disorder': '/adhd',
  '/ptsd': '/ptsd',
  '/ptsd.html': '/ptsd',
  '/post-traumatic-stress-disorder': '/ptsd',
  '/ocd': '/ocd',
  '/ocd.html': '/ocd',
  '/obsessive-compulsive-disorder': '/ocd',
  '/bipolar': '/bipolar',
  '/bipolar.html': '/bipolar',
  '/grief-loss': '/grief-loss',
  '/grief-loss.html': '/grief-loss',
  '/loss-bereavement': '/grief-loss',
  '/life-transitions': '/life-transitions',
  '/life-transitions.html': '/life-transitions',
  '/life-changes': '/life-transitions',
  '/privacy': '/privacy',
  '/privacy.html': '/privacy'
};
const publicRoutes = new Set(Object.values(publicPageRoutes));
const normalizeRoute = (href = '/') => {
  const raw = String(href).trim();
  if (!raw) return '/';
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(raw) || raw.startsWith('mailto:') || raw.startsWith('tel:')) return raw;

  const pathOnly = raw.split('#')[0].split('?')[0];
  if (!pathOnly) return window.location.pathname || '/';
  const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  const normalizedPath = withLeadingSlash === '/' ? '/' : withLeadingSlash.replace(/\/+$/, '');
  return routeAliases[normalizedPath] || normalizedPath;
};

// Rewrite internal navigation to the clean public route before visitors click
// it. The source files stay easy to open locally, while the rendered site links
// directly to the same extensionless URLs used by canonicals and the sitemap.
document.querySelectorAll('a[href]').forEach((link) => {
  const raw = link.getAttribute('href')?.trim();
  if (!raw || raw.startsWith('#') || /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(raw) || raw.startsWith('mailto:') || raw.startsWith('tel:')) return;

  const match = raw.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  if (!match) return;
  const route = normalizeRoute(match[1] || '/');
  if (!publicRoutes.has(route)) return;

  const cleanHref = `${route}${match[2] || ''}${match[3] || ''}`;
  if (raw !== cleanHref) link.setAttribute('href', cleanHref);
});

const currentRoute = normalizeRoute(window.location.pathname || '/');
const declaredCanonical = document.querySelector('link[rel="canonical"]')?.href;
const canonicalUrl = publicRoutes.has(currentRoute)
  ? `${siteOrigin}${currentRoute === '/' ? '/' : currentRoute}`
  : (declaredCanonical || window.location.href);
const hasRouteLink = (container, route) => Boolean(container && [...container.querySelectorAll('a[href]')].some((link) => normalizeRoute(link.getAttribute('href')) === route));

const description = document.querySelector('meta[name="description"]')?.content || '';
const ensureMeta = (attribute, key, value) => {
  let tag = document.querySelector(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.content = value;
};
ensureMeta('property', 'og:title', document.title);
if (description) ensureMeta('property', 'og:description', description);
ensureMeta('property', 'og:url', canonicalUrl);
ensureMeta('property', 'og:type', 'website');
ensureMeta('property', 'og:site_name', 'Back to Life Mental Health');

const defaultSocialImage = `${siteOrigin}/assets/images/homepage-hero.webp`;
const socialImage = document.querySelector('meta[property="og:image"]')?.content || defaultSocialImage;
const socialImageAlt = document.querySelector('meta[property="og:image:alt"]')?.content || 'Back to Life Mental Health psychiatric care for Anthem, North Phoenix, and the North Valley';
ensureMeta('property', 'og:image', socialImage);
ensureMeta('property', 'og:image:alt', socialImageAlt);
ensureMeta('name', 'twitter:card', 'summary_large_image');
ensureMeta('name', 'twitter:title', document.title);
if (description) ensureMeta('name', 'twitter:description', description);
ensureMeta('name', 'twitter:image', socialImage);
ensureMeta('name', 'twitter:image:alt', socialImageAlt);

// Tell search engines the preferred site name explicitly. Google recommends
// WebSite structured data on the domain-level home page for this purpose.
if (currentRoute === '/' && !document.querySelector('script[data-website-schema]')) {
  const websiteSchema = document.createElement('script');
  websiteSchema.type = 'application/ld+json';
  websiteSchema.setAttribute('data-website-schema', '');
  websiteSchema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Back to Life Mental Health',
    alternateName: 'BTLMH',
    url: `${siteOrigin}/`
  });
  document.head.appendChild(websiteSchema);
}

// Add breadcrumb structured data for the public information hierarchy. This
// does not change visible navigation; it simply describes relationships that
// are already represented by the site's navigation and page structure.
const breadcrumbTrails = {
  '/services': ['Home', 'Psychiatric Services'],
  '/psychiatric-evaluation': ['Home', 'Psychiatric Services', 'Psychiatric Evaluation'],
  '/north-phoenix-psychiatric-care': ['Home', 'Psychiatric Services', 'North Phoenix & North Valley Psychiatric Care'],
  '/medication-management': ['Home', 'Psychiatric Services', 'Medication Management'],
  '/new-patients': ['Home', 'New Patients'],
  '/current-patients': ['Home', 'Current Patients'],
  '/insurance-payment': ['Home', 'New Patients', 'Insurance & Payment'],
  '/telehealth': ['Home', 'New Patients', 'Telehealth'],
  '/faq': ['Home', 'New Patients', 'FAQs'],
  '/about': ['Home', 'About Back to Life Mental Health'],
  '/contact': ['Home', 'Contact Back to Life Mental Health'],
  '/anxiety': ['Home', 'Psychiatric Services', 'Anxiety Treatment'],
  '/depression': ['Home', 'Psychiatric Services', 'Depression Treatment'],
  '/adhd': ['Home', 'Psychiatric Services', 'ADHD Treatment'],
  '/ptsd': ['Home', 'Psychiatric Services', 'PTSD & Trauma-Related Symptoms'],
  '/ocd': ['Home', 'Psychiatric Services', 'OCD Treatment'],
  '/bipolar': ['Home', 'Psychiatric Services', 'Bipolar Disorder Treatment'],
  '/grief-loss': ['Home', 'Psychiatric Services', 'Grief & Loss'],
  '/life-transitions': ['Home', 'Psychiatric Services', 'Life Transitions & Adjustment'],
  '/privacy': ['Home', 'Privacy Policy']
};

const breadcrumbParentUrls = {
  'Home': `${siteOrigin}/`,
  'Psychiatric Services': `${siteOrigin}/services`,
  'New Patients': `${siteOrigin}/new-patients`
};

const breadcrumbTrail = breadcrumbTrails[currentRoute];
if (breadcrumbTrail && !document.querySelector('script[data-breadcrumb-schema]')) {
  const breadcrumbSchema = document.createElement('script');
  breadcrumbSchema.type = 'application/ld+json';
  breadcrumbSchema.setAttribute('data-breadcrumb-schema', '');
  breadcrumbSchema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbTrail.map((name, index) => {
      const item = {
        '@type': 'ListItem',
        position: index + 1,
        name
      };
      if (index < breadcrumbTrail.length - 1) {
        item.item = breadcrumbParentUrls[name] || `${siteOrigin}/`;
      } else {
        item.item = canonicalUrl;
      }
      return item;
    })
  });
  document.head.appendChild(breadcrumbSchema);
}

const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');

// Give established patients a consistent, quiet portal entry point on every
// full public page without duplicating another navigation system in the HTML.
if (nav && !hasRouteLink(nav, '/current-patients')) {
  const patientPortalLink = document.createElement('a');
  patientPortalLink.href = '/current-patients';
  patientPortalLink.textContent = 'Patient Portal';
  patientPortalLink.setAttribute('data-patient-portal-link', '');
  const bookingLink = nav.querySelector('a[href*="practiceKey="]');
  nav.insertBefore(patientPortalLink, bookingLink || null);
}

const updateHeader = () => {
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 8);
};

const closeMenu = ({ returnFocus = false } = {}) => {
  if (!menuToggle || !nav) return;
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
  if (returnFocus) menuToggle.focus();
};

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('menu-open', isOpen);
  });
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('open')) closeMenu({ returnFocus: true });
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 820 && nav.classList.contains('open')) closeMenu();
  });
}

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = new Date().getFullYear();
});

// Keep social proof, regional access, current-patient access, and social-media
// links available from the shared footer without duplicating markup everywhere.
const googleReviewsUrl = 'https://www.google.com/maps/search/?api=1&query=Back%20to%20Life%20Mental%20Health%2C%20Anthem%20AZ&query_place_id=ChIJa6pXTtlxK4cRDzcak9fsa_s';
const facebookUrl = 'https://www.facebook.com/profile.php?id=61552499436523';
const instagramUrl = 'https://www.instagram.com/backtolifementalhealth/';
const linkedinCompanyUrl = 'https://www.linkedin.com/company/103752686/';
document.querySelectorAll('.site-footer .footer-grid').forEach((footerGrid) => {
  const contactColumn = footerGrid.querySelector('a[href^="mailto:"]')?.closest('div');
  if (!contactColumn) return;

  const footerBrandCopy = footerGrid.querySelector('.footer-brand p');
  if (footerBrandCopy) {
    footerBrandCopy.textContent = 'Independent psychiatric care for Anthem, North Phoenix, and the North Valley, with telehealth throughout Arizona.';
  }

  const exploreColumn = [...footerGrid.children].find((column) => column.querySelector('h3')?.textContent?.trim() === 'Explore');
  if (exploreColumn && !hasRouteLink(exploreColumn, '/north-phoenix-psychiatric-care')) {
    const localCareLink = document.createElement('a');
    localCareLink.href = '/north-phoenix-psychiatric-care';
    localCareLink.textContent = 'North Phoenix & North Valley';
    const servicesLink = [...exploreColumn.querySelectorAll('a[href]')].find((link) => normalizeRoute(link.getAttribute('href')) === '/services');
    if (servicesLink) servicesLink.insertAdjacentElement('afterend', localCareLink);
    else exploreColumn.prepend(localCareLink);
  }

  if (exploreColumn && !hasRouteLink(exploreColumn, '/current-patients')) {
    const currentPatientsLink = document.createElement('a');
    currentPatientsLink.href = '/current-patients';
    currentPatientsLink.textContent = 'Current Patients';
    const newPatientsLink = [...exploreColumn.querySelectorAll('a[href]')].find((link) => normalizeRoute(link.getAttribute('href')) === '/new-patients');
    if (newPatientsLink) newPatientsLink.insertAdjacentElement('afterend', currentPatientsLink);
    else exploreColumn.appendChild(currentPatientsLink);
  }

  if (!contactColumn.querySelector('[data-google-reviews-link]')) {
    const reviewsLink = document.createElement('a');
    reviewsLink.href = googleReviewsUrl;
    reviewsLink.target = '_blank';
    reviewsLink.rel = 'noopener noreferrer';
    reviewsLink.textContent = 'Google Reviews';
    reviewsLink.setAttribute('data-google-reviews-link', '');
    contactColumn.appendChild(reviewsLink);
  }

  if (!contactColumn.querySelector('[data-facebook-link]')) {
    const facebookLink = document.createElement('a');
    facebookLink.href = facebookUrl;
    facebookLink.target = '_blank';
    facebookLink.rel = 'noopener noreferrer';
    facebookLink.textContent = 'Facebook';
    facebookLink.setAttribute('data-facebook-link', '');
    contactColumn.appendChild(facebookLink);

  if (!contactColumn.querySelector('[data-instagram-link]')) {
    const instagramLink = document.createElement('a');
    instagramLink.href = instagramUrl;
    instagramLink.target = '_blank';
    instagramLink.rel = 'noopener noreferrer';
    instagramLink.textContent = 'Instagram';
    instagramLink.setAttribute('data-instagram-link', '');
    contactColumn.appendChild(instagramLink);
  }

  if (!contactColumn.querySelector('[data-linkedin-company-link]')) {
    const linkedinLink = document.createElement('a');
    linkedinLink.href = linkedinCompanyUrl;
    linkedinLink.target = '_blank';
    linkedinLink.rel = 'noopener noreferrer';
    linkedinLink.textContent = 'LinkedIn';
    linkedinLink.setAttribute('data-linkedin-company-link', '');
    contactColumn.appendChild(linkedinLink);
  }
  }
});

document.querySelectorAll('a[href="services.html#medication-management"], a[href="/services#medication-management"], a[href="#medication-management"]').forEach((link) => {
  if (link.textContent.toLowerCase().includes('medication')) link.setAttribute('href', '/medication-management');
});

const conditionRoutes = {
  'Anxiety': '/anxiety',
  'Anxiety disorders': '/anxiety',
  'Depression': '/depression',
  'ADHD': '/adhd',
  'PTSD': '/ptsd',
  'PTSD and trauma-related symptoms': '/ptsd',
  'OCD': '/ocd',
  'Obsessive-compulsive disorder': '/ocd',
  'Bipolar Disorder': '/bipolar',
  'Bipolar disorder': '/bipolar',
  'Grief & Loss': '/grief-loss',
  'Grief and loss': '/grief-loss',
  'Life Transitions': '/life-transitions',
  'Life transitions and adjustment concerns': '/life-transitions'
};

const conditionPageRoutes = new Set([
  '/anxiety',
  '/depression',
  '/adhd',
  '/ptsd',
  '/ocd',
  '/bipolar',
  '/grief-loss',
  '/life-transitions'
]);

document.querySelectorAll('.condition-card').forEach((card) => {
  const label = card.querySelector('strong')?.textContent?.trim();
  if (label && conditionRoutes[label]) card.setAttribute('href', conditionRoutes[label]);
});

document.querySelectorAll('.simple-list').forEach((list) => {
  [...list.children].forEach((item) => {
    if (item.tagName === 'A') return;
    const label = item.textContent.trim();
    const route = conditionRoutes[label];
    if (!route) return;
    const link = document.createElement('a');
    link.href = route;
    link.textContent = label;
    link.className = 'simple-list-link';
    item.replaceWith(link);
  });
});

// Keep the patient-resource subnavigation consistent across the journey pages.
document.querySelectorAll('.journey-nav-inner').forEach((journeyNav) => {
  if (!hasRouteLink(journeyNav, '/current-patients')) {
    const currentPatientsLink = document.createElement('a');
    currentPatientsLink.href = '/current-patients';
    currentPatientsLink.textContent = 'Current Patients';
    const newPatientsLink = [...journeyNav.querySelectorAll('a[href]')].find((link) => normalizeRoute(link.getAttribute('href')) === '/new-patients');
    if (newPatientsLink) newPatientsLink.insertAdjacentElement('afterend', currentPatientsLink);
    else journeyNav.prepend(currentPatientsLink);
  }

  journeyNav.querySelectorAll('a').forEach((link) => {
    link.removeAttribute('aria-current');
    if (normalizeRoute(link.getAttribute('href')) === currentRoute) link.setAttribute('aria-current', 'page');
  });
});

// Mobile visitors get persistent access to the two highest-value actions while
// desktop keeps the quieter editorial layout. This is navigation behavior, not
// patient data collection, and uses the same practice phone and booking URL.
if (!document.querySelector('[data-mobile-contact-bar]')) {
  const mobileBar = document.createElement('nav');
  mobileBar.className = 'mobile-contact-bar';
  mobileBar.setAttribute('data-mobile-contact-bar', '');
  mobileBar.setAttribute('aria-label', 'Quick contact');
  mobileBar.innerHTML = `
    <a class="mobile-contact-bar-call" href="tel:+14803138583">Call Office</a>
    <a class="mobile-contact-bar-book" href="https://d2oe0ra32qx05a.cloudfront.net/?practiceKey=k_1_108034" target="_blank" rel="noopener">Book Appointment</a>`;
  document.body.appendChild(mobileBar);
  document.body.classList.add('has-mobile-contact-bar');
}

// Keep scheduling on the public website while Tebra owns the appointment flow.
// The iframe is created only after a visitor opens the scheduler, so Tebra does
// not add startup cost or receive appointment interaction until it is needed.
const schedulingHost = 'd2oe0ra32qx05a.cloudfront.net';
const tebraSchedulerUrl = 'https://d2oe0ra32qx05a.cloudfront.net/?practiceKey=k_1_108034';
const canShowSchedulingWidget = Boolean(header && document.querySelector('.site-footer'));

if (canShowSchedulingWidget && !document.querySelector('[data-scheduler-launcher]')) {
  const schedulerStyles = document.createElement('link');
  schedulerStyles.rel = 'stylesheet';
  schedulerStyles.href = 'scheduler.css';
  schedulerStyles.setAttribute('data-scheduler-styles', '');
  document.head.appendChild(schedulerStyles);

  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'scheduler-launcher';
  launcher.setAttribute('data-scheduler-launcher', '');
  launcher.setAttribute('aria-label', 'Schedule an appointment');
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-controls', 'tebra-scheduler-dialog');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 2v3M17 2v3M3.5 9.5h17M5.5 4h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
      <path d="M8 13h1M12 13h1M16 13h1M8 17h1M12 17h1M16 17h1"/>
    </svg>`;

  const schedulerDialog = document.createElement('dialog');
  schedulerDialog.className = 'scheduler-dialog';
  schedulerDialog.id = 'tebra-scheduler-dialog';
  schedulerDialog.setAttribute('data-scheduler-dialog', '');
  schedulerDialog.setAttribute('aria-labelledby', 'scheduler-dialog-title');
  schedulerDialog.innerHTML = `
    <div class="scheduler-panel">
      <header class="scheduler-header">
        <div>
          <span class="scheduler-eyebrow">Secure online scheduling</span>
          <h2 id="scheduler-dialog-title">Schedule an appointment</h2>
        </div>
        <button class="scheduler-close" type="button" aria-label="Close appointment scheduler" data-scheduler-close>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </header>
      <div class="scheduler-frame-wrap" data-scheduler-frame-wrap>
        <div class="scheduler-loading" data-scheduler-loading role="status">Loading secure Tebra scheduling…</div>
      </div>
      <footer class="scheduler-footer">
        <span>Scheduling is securely provided by Tebra.</span>
        <a href="${tebraSchedulerUrl}" target="_blank" rel="noopener" data-scheduler-fallback>Open scheduler in a new tab</a>
      </footer>
    </div>`;

  document.body.append(schedulerDialog, launcher);

  const closeButton = schedulerDialog.querySelector('[data-scheduler-close]');
  const frameWrap = schedulerDialog.querySelector('[data-scheduler-frame-wrap]');
  const loadingMessage = schedulerDialog.querySelector('[data-scheduler-loading]');
  const siteFooter = document.querySelector('.site-footer');
  let schedulerFrame = null;
  let loadingTimer = null;
  let lastSchedulerTrigger = launcher;

  const ensureSchedulerFrame = () => {
    if (schedulerFrame) return schedulerFrame;

    schedulerFrame = document.createElement('iframe');
    schedulerFrame.className = 'scheduler-frame';
    schedulerFrame.src = tebraSchedulerUrl;
    schedulerFrame.title = 'Tebra appointment scheduler for Back to Life Mental Health';
    schedulerFrame.loading = 'lazy';
    schedulerFrame.referrerPolicy = 'strict-origin-when-cross-origin';

    schedulerFrame.addEventListener('load', () => {
      if (loadingMessage) loadingMessage.hidden = true;
      if (loadingTimer) window.clearTimeout(loadingTimer);
    });

    schedulerFrame.addEventListener('error', () => {
      if (loadingMessage) loadingMessage.textContent = 'The embedded scheduler could not load. Please use the new-tab link below.';
    });

    frameWrap.appendChild(schedulerFrame);
    loadingTimer = window.setTimeout(() => {
      if (loadingMessage && !loadingMessage.hidden) {
        loadingMessage.textContent = 'Still loading? You can open the secure scheduler in a new tab below.';
      }
    }, 12000);
    return schedulerFrame;
  };

  const openScheduler = (trigger = launcher) => {
    lastSchedulerTrigger = trigger;

    if (typeof schedulerDialog.showModal !== 'function') {
      window.open(tebraSchedulerUrl, '_blank', 'noopener');
      return;
    }

    ensureSchedulerFrame();
    if (!schedulerDialog.open) schedulerDialog.showModal();
    launcher.setAttribute('aria-expanded', 'true');
    document.body.classList.add('scheduler-open');
    window.requestAnimationFrame(() => closeButton?.focus({ preventScroll: true }));
  };

  const closeScheduler = () => {
    if (schedulerDialog.open) schedulerDialog.close();
  };

  launcher.addEventListener('click', () => openScheduler(launcher));
  closeButton?.addEventListener('click', closeScheduler);

  schedulerDialog.addEventListener('close', () => {
    launcher.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('scheduler-open');
    if (lastSchedulerTrigger instanceof HTMLElement) lastSchedulerTrigger.focus({ preventScroll: true });
  });

  schedulerDialog.addEventListener('click', (event) => {
    const rect = schedulerDialog.getBoundingClientRect();
    const outsideDialog = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outsideDialog) closeScheduler();
  });

  document.querySelectorAll(`a[href*="${schedulingHost}"]:not([data-scheduler-fallback])`).forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openScheduler(link);
    });
  });

  if (siteFooter && 'IntersectionObserver' in window) {
    const footerObserver = new IntersectionObserver(([entry]) => {
      launcher.classList.toggle('is-near-footer', entry.isIntersecting);
    }, { threshold: 0.02 });
    footerObserver.observe(siteFooter);
  }
}

// Give the homepage a practical patient-journey entry point without turning it
// into another long information page.
if (currentRoute === '/' && !document.querySelector('[data-patient-resources]')) {
  const insuranceSection = document.querySelector('.insurance-section');
  if (insuranceSection) {
    const resources = document.createElement('section');
    resources.className = 'section section-soft';
    resources.setAttribute('data-patient-resources', '');
    resources.innerHTML = `
      <div class="container">
        <div class="section-heading reveal">
          <span class="eyebrow">Plan your visit</span>
          <h2>The practical stuff, without the scavenger hunt.</h2>
          <p>What happens first, how current patients stay connected, how insurance works, and the questions people usually ask.</p>
        </div>
        <div class="condition-grid">
          <a class="condition-card reveal" href="/new-patients"><span>Start here</span><strong>New Patients</strong><p>From scheduling through your first treatment plan.</p></a>
          <a class="condition-card reveal" href="/current-patients"><span>Already established?</span><strong>Current Patients</strong><p>Portal access, secure messages, records, and account help.</p></a>
          <a class="condition-card reveal" href="/insurance-payment"><span>Coverage</span><strong>Insurance & Payment</strong><p>Current plans, private pay, and benefit questions.</p></a>
          <a class="condition-card reveal" href="/faq"><span>Quick answers</span><strong>FAQs</strong><p>Appointments, medication, insurance, and follow-up.</p></a>
        </div>
      </div>`;
    insuranceSection.insertAdjacentElement('afterend', resources);
  }
}

// Condition pages share a practical bridge between education and FAQs.
if (conditionPageRoutes.has(currentRoute)) {
  const articleMain = document.querySelector('.article-main');
  const faqSection = [...document.querySelectorAll('.article-main > .article-section')].find((section) =>
    section.querySelector('.eyebrow')?.textContent?.trim().toLowerCase().includes('frequently asked')
  );

  if (articleMain && faqSection && !articleMain.querySelector('[data-condition-next-step]')) {
    const nextStep = document.createElement('section');
    nextStep.className = 'article-section condition-next-step reveal';
    nextStep.setAttribute('data-condition-next-step', '');
    nextStep.innerHTML = `
      <span class="eyebrow">What happens next</span>
      <h2>The goal is a clearer understanding of the plan.</h2>
      <p>The goal of an evaluation is not simply to attach a label. It is to understand the pattern, discuss reasonable options, and decide what should be watched over time.</p>
      <div class="next-step-grid">
        <div class="next-step-card"><span>01 / Understand</span><strong>Build the picture</strong><p>Symptoms, history, function, sleep, medical factors, previous treatment, and your goals are considered together.</p></div>
        <div class="next-step-card"><span>02 / Decide</span><strong>Review the options</strong><p>Recommendations include the reasoning, likely benefits, tradeoffs, alternatives, and what would change the plan.</p></div>
        <div class="next-step-card"><span>03 / Follow</span><strong>See what changes</strong><p>Follow-up focuses on response, side effects, functioning, new information, and whether treatment still fits.</p></div>
      </div>
      <div class="condition-next-links"><a href="/new-patients">What starting care looks like →</a><a href="/medication-management">How medication management works →</a></div>`;
    faqSection.insertAdjacentElement('beforebegin', nextStep);
  }
}

if (nav) {
  const contentPageRoutes = new Set([
    ...conditionPageRoutes,
    '/psychiatric-evaluation',
    '/north-phoenix-psychiatric-care',
    '/medication-management'
  ]);
  const patientPages = new Set(['/new-patients', '/insurance-payment', '/telehealth', '/faq']);
  const navLinks = [...nav.querySelectorAll('a')];
  const hasExactCurrentLink = navLinks.some((link) => normalizeRoute(link.getAttribute('href')) === currentRoute);

  navLinks.forEach((link) => {
    link.removeAttribute('aria-current');
    const hrefRoute = normalizeRoute(link.getAttribute('href'));
    const isCurrent = hrefRoute === currentRoute ||
      (!hasExactCurrentLink && contentPageRoutes.has(currentRoute) && hrefRoute === '/services') ||
      (!hasExactCurrentLink && patientPages.has(currentRoute) && hrefRoute === '/new-patients');
    if (isCurrent) link.setAttribute('aria-current', 'page');
  });
}

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -20px' });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}