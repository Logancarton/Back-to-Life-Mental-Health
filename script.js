const enhancementStylesheet = 'enhancements.css';
if (!document.querySelector(`link[href="${enhancementStylesheet}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = enhancementStylesheet;
  document.head.appendChild(link);
}

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

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeMenu());
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      closeMenu({ returnFocus: true });
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 820 && nav.classList.contains('open')) closeMenu();
  });
}

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = new Date().getFullYear();
});

// Normalize links created during the first build so every page points at the
// dedicated medication-management page rather than the old section anchor.
document.querySelectorAll('a[href="services.html#medication-management"]').forEach((link) => {
  link.setAttribute('href', 'medication-management.html');
});

// The original homepage condition cards initially pointed to the services
// overview. Route them to their dedicated education pages without requiring
// duplicate markup across the site.
const conditionRoutes = {
  'Anxiety': 'anxiety.html',
  'Depression': 'depression.html',
  'ADHD': 'adhd.html',
  'PTSD': 'ptsd.html',
  'OCD': 'ocd.html',
  'Bipolar Disorder': 'bipolar.html',
  'Grief & Loss': 'grief-loss.html',
  'Life Transitions': 'life-transitions.html'
};

document.querySelectorAll('.condition-card').forEach((card) => {
  const label = card.querySelector('strong')?.textContent?.trim();
  if (label && conditionRoutes[label]) card.setAttribute('href', conditionRoutes[label]);
});

// Ensure Privacy Policy is available in older footer markup from every page.
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

// Mark the current navigation item for assistive technology and remove stale
// hand-authored active states when navigating among dedicated content pages.
if (nav) {
  const file = window.location.pathname.split('/').filter(Boolean).pop() || 'index.html';
  const normalized = file.includes('.') ? file : `${file}.html`;
  const contentPages = new Set([
    'anxiety.html', 'depression.html', 'adhd.html', 'ptsd.html', 'ocd.html',
    'bipolar.html', 'grief-loss.html', 'life-transitions.html'
  ]);

  nav.querySelectorAll('a').forEach((link) => {
    link.removeAttribute('aria-current');
    const href = (link.getAttribute('href') || '').split('#')[0];
    const isCurrent = href === normalized ||
      (contentPages.has(normalized) && href === 'services.html');
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
