const enhancementStylesheet = 'enhancements.css';
if (!document.querySelector(`link[href="${enhancementStylesheet}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = enhancementStylesheet;
  document.head.appendChild(link);
}

// Replace the temporary text-based BTL mark with the official practice logo.
document.querySelectorAll('.brand').forEach((brand) => {
  if (!brand.querySelector('.brand-mark')) return;
  const logo = document.createElement('img');
  logo.src = 'assets/images/btlmh-logo.png';
  logo.alt = 'Back to Life Mental Health';
  logo.className = 'brand-logo-image';
  brand.classList.add('brand-logo-link');
  brand.replaceChildren(logo);
});

// The provider introduction now lives intentionally on the About page. Keep a
// graceful fallback if the owned video cannot be loaded by the browser.
document.querySelectorAll('.provider-video-card .provider-intro-video').forEach((video) => {
  const card = video.closest('.provider-video-card');
  if (!card) return;
  video.addEventListener('error', () => card.classList.add('video-unavailable'), { once: true });
  video.addEventListener('loadeddata', () => card.classList.remove('video-unavailable'), { once: true });
});

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

const canonicalRoutes = {
  'index.html': '/',
  'services.html': '/services-overview',
  'medication-management.html': '/medication-management',
  'new-patients.html': '/new-patients',
  'insurance-payment.html': '/insurance-payment',
  'telehealth.html': '/telehealth',
  'faq.html': '/faq',
  'about.html': '/about-us',
  'contact.html': '/contactus',
  'anxiety.html': '/anxiety',
  'depression.html': '/depression',
  'adhd.html': '/attention-deficit-hyperactive-disorder',
  'ptsd.html': '/post-traumatic-stress-disorder',
  'ocd.html': '/obsessive-compulsive-disorder',
  'bipolar.html': '/bipolar',
  'grief-loss.html': '/loss-bereavement',
  'life-transitions.html': '/life-changes',
  'privacy.html': '/privacy'
};
const pageFile = window.location.pathname.split('/').filter(Boolean).pop() || 'index.html';
const canonicalPath = canonicalRoutes[pageFile] || canonicalRoutes['index.html'];
const canonicalUrl = `https://www.back-to-life-mental-health.com${canonicalPath}`;
let canonical = document.querySelector('link[rel="canonical"]');
if (!canonical) {
  canonical = document.createElement('link');
  canonical.rel = 'canonical';
  document.head.appendChild(canonical);
}
canonical.href = canonicalUrl;

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
ensureMeta('name', 'twitter:card', 'summary');

const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');

// New patient information is now a first-class part of the site. Add the link
// to older pages without rewriting every historical template at once.
if (nav && !nav.querySelector('a[href="new-patients.html"]')) {
  const newPatients = document.createElement('a');
  newPatients.href = 'new-patients.html';
  newPatients.textContent = 'New Patients';
  const aboutLink = nav.querySelector('a[href="about.html"]');
  nav.insertBefore(newPatients, aboutLink || nav.querySelector('.button'));
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

document.querySelectorAll('a[href="services.html#medication-management"], a[href="#medication-management"]').forEach((link) => {
  if (link.textContent.toLowerCase().includes('medication')) link.setAttribute('href', 'medication-management.html');
});

const conditionRoutes = {
  'Anxiety': 'anxiety.html',
  'Anxiety disorders': 'anxiety.html',
  'Depression': 'depression.html',
  'ADHD': 'adhd.html',
  'PTSD': 'ptsd.html',
  'PTSD and trauma-related symptoms': 'ptsd.html',
  'OCD': 'ocd.html',
  'Obsessive-compulsive disorder': 'ocd.html',
  'Bipolar Disorder': 'bipolar.html',
  'Bipolar disorder': 'bipolar.html',
  'Grief & Loss': 'grief-loss.html',
  'Grief and loss': 'grief-loss.html',
  'Life Transitions': 'life-transitions.html',
  'Life transitions and adjustment concerns': 'life-transitions.html'
};

const conditionPageFiles = new Set([
  'anxiety.html',
  'depression.html',
  'adhd.html',
  'ptsd.html',
  'ocd.html',
  'bipolar.html',
  'grief-loss.html',
  'life-transitions.html'
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

document.querySelectorAll('.site-footer').forEach((footer) => {
  const explore = [...footer.querySelectorAll('div')].find((section) =>
    section.querySelector('h3')?.textContent?.trim().toLowerCase() === 'explore'
  );
  if (!explore) return;
  const patientLinks = [
    ['new-patients.html', 'New Patients'],
    ['insurance-payment.html', 'Insurance & Payment'],
    ['telehealth.html', 'Telehealth'],
    ['faq.html', 'FAQs'],
    ['privacy.html', 'Privacy Policy']
  ];
  patientLinks.forEach(([href, label]) => {
    if (explore.querySelector(`a[href="${href}"]`)) return;
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    explore.appendChild(link);
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

// Give the homepage a practical patient-journey entry point without turning it
// into another long information page.
if (pageFile === 'index.html' && !document.querySelector('[data-patient-resources]')) {
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
          <p>What happens first, how insurance works, when telehealth fits, and the questions people usually ask before scheduling.</p>
        </div>
        <div class="condition-grid">
          <a class="condition-card reveal" href="new-patients.html"><span>Start here</span><strong>New Patients</strong><p>From scheduling through your first treatment plan.</p></a>
          <a class="condition-card reveal" href="insurance-payment.html"><span>Coverage</span><strong>Insurance & Payment</strong><p>Current plans, private pay, and benefit questions.</p></a>
          <a class="condition-card reveal" href="telehealth.html"><span>Visit options</span><strong>Telehealth</strong><p>How virtual psychiatric care works across Arizona.</p></a>
          <a class="condition-card reveal" href="faq.html"><span>Quick answers</span><strong>FAQs</strong><p>Appointments, medication, insurance, and follow-up.</p></a>
        </div>
      </div>`;
    insuranceSection.insertAdjacentElement('afterend', resources);
  }
}

// Older condition pages already contain strong condition-specific education.
// Add the missing practical bridge between treatment information and FAQs so
// each page follows the same patient journey as the newer site sections.
if (conditionPageFiles.has(pageFile)) {
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
      <h2>You should leave with a clearer understanding of the plan.</h2>
      <p>The goal of an evaluation is not simply to attach a label. It is to understand the pattern, discuss reasonable options, and decide what should be watched over time.</p>
      <div class="next-step-grid">
        <div class="next-step-card"><span>01 / Understand</span><strong>Build the picture</strong><p>Symptoms, history, function, sleep, medical factors, previous treatment, and your goals are considered together.</p></div>
        <div class="next-step-card"><span>02 / Decide</span><strong>Review the options</strong><p>Recommendations include the reasoning, likely benefits, tradeoffs, alternatives, and what would change the plan.</p></div>
        <div class="next-step-card"><span>03 / Follow</span><strong>See what changes</strong><p>Follow-up focuses on response, side effects, functioning, new information, and whether treatment still fits.</p></div>
      </div>
      <div class="condition-next-links"><a href="new-patients.html">What starting care looks like →</a><a href="medication-management.html">How medication management works →</a></div>`;
    faqSection.insertAdjacentElement('beforebegin', nextStep);
  }

  // A few older condition templates predate the shared bottom CTA. Keep the
  // patient path consistent without duplicating a CTA where one already exists.
  if (!document.querySelector('.cta-section')) {
    const main = document.querySelector('main');
    if (main) {
      const cta = document.createElement('section');
      cta.className = 'cta-section condition-cta-generated';
      cta.innerHTML = `
        <div class="container cta-card reveal">
          <div><span class="eyebrow light">New patients welcome</span><h2>Start with a conversation.</h2><p>Schedule online or call the office with questions before booking.</p></div>
          <div class="cta-actions"><a class="button button-light" href="https://d2oe0ra32qx05a.cloudfront.net/?practiceKey=k_1_108034" target="_blank" rel="noopener">Book an Appointment</a><a class="button button-outline-light" href="tel:+14803138583">480-313-8583</a></div>
        </div>`;
      main.appendChild(cta);
    }
  }
}

if (nav) {
  const normalized = pageFile.includes('.') ? pageFile : `${pageFile}.html`;
  const contentPages = new Set([...conditionPageFiles, 'medication-management.html']);
  const patientPages = new Set(['new-patients.html','insurance-payment.html','telehealth.html','faq.html']);
  nav.querySelectorAll('a').forEach((link) => {
    link.removeAttribute('aria-current');
    const href = (link.getAttribute('href') || '').split('#')[0];
    const isCurrent = href === normalized ||
      (contentPages.has(normalized) && href === 'services.html') ||
      (patientPages.has(normalized) && href === 'new-patients.html');
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
