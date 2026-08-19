const enhancementStylesheet = 'enhancements.css';
if (!document.querySelector(`link[href="${enhancementStylesheet}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = enhancementStylesheet;
  document.head.appendChild(link);
}

// Keep shared browser metadata consistent even on older pages that were built
// before the favicon/manifest and clean canonical URL scheme were introduced.
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

document.querySelectorAll('.condition-card').forEach((card) => {
  const label = card.querySelector('strong')?.textContent?.trim();
  if (label && conditionRoutes[label]) card.setAttribute('href', conditionRoutes[label]);
});

// Convert the services overview's plain condition list into actual internal
// links. This improves navigation, keyboard access, and crawlable site structure.
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
  if (explore && !explore.querySelector('a[href="privacy.html"]')) {
    const privacy = document.createElement('a');
    privacy.href = 'privacy.html';
    privacy.textContent = 'Privacy Policy';
    explore.appendChild(privacy);
  }
});

if (nav) {
  const normalized = pageFile.includes('.') ? pageFile : `${pageFile}.html`;
  const contentPages = new Set(['anxiety.html','depression.html','adhd.html','ptsd.html','ocd.html','bipolar.html','grief-loss.html','life-transitions.html']);
  nav.querySelectorAll('a').forEach((link) => {
    link.removeAttribute('aria-current');
    const href = (link.getAttribute('href') || '').split('#')[0];
    const isCurrent = href === normalized || (contentPages.has(normalized) && href === 'services.html');
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
