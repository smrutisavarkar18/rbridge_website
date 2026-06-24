/* ═══════════════════════════════════════════════
   RBRIDGE LIFESCIENCES – MAIN JS
   ═══════════════════════════════════════════════ */

// ── Sticky nav shadow ────────────────────────────
const header = document.getElementById('site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// ── Mobile hamburger ─────────────────────────────
const hamburger = document.getElementById('hamburger');
const mainNav   = document.getElementById('main-nav');
if (hamburger && mainNav) {
  hamburger.addEventListener('click', () => {
    mainNav.classList.toggle('open');
    document.body.style.overflow = mainNav.classList.contains('open') ? 'hidden' : '';
  });
}

// ── Mobile dropdown toggles ──────────────────────
document.querySelectorAll('.has-dropdown .nav-link').forEach(link => {
  link.addEventListener('click', e => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      link.closest('.has-dropdown').classList.toggle('open');
    }
  });
});

document.addEventListener('click', e => {
  if (mainNav && mainNav.classList.contains('open')) {
    if (!mainNav.contains(e.target) && hamburger && !hamburger.contains(e.target)) {
      mainNav.classList.remove('open');
      document.body.style.overflow = '';
    }
  }
});

// ── Regulatory Updates via RSS ───────────────────
// Uses rss2json.com to convert FDA / EMA RSS feeds to JSON (no API key, free)
const updatesContainer = document.getElementById('updates-preview');

async function loadRegulatoryUpdates() {
  if (!updatesContainer) return;

  // FDA drug safety news RSS (official USFDA feed)
  const feeds = [
    {
      url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/drugs/rss.xml',
      source: 'USFDA'
    },
    {
      url: 'https://www.ema.europa.eu/en/rss/news.xml',
      source: 'EMA'
    }
  ];

  const API = 'https://api.rss2json.com/v1/api.json?rss_url=';
  let allItems = [];

  try {
    // Fetch both feeds in parallel
    const results = await Promise.allSettled(
      feeds.map(f =>
        fetch(`${API}${encodeURIComponent(f.url)}&count=3`)
          .then(r => r.json())
          .then(data => (data.items || []).map(item => ({
            source: f.source,
            title: item.title,
            date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '',
            link: item.link || ''
          })))
      )
    );

    results.forEach(r => {
      if (r.status === 'fulfilled') allItems = allItems.concat(r.value);
    });

    // Sort by most recent, take top 3
    allItems = allItems.slice(0, 3);

    if (!allItems.length) throw new Error('No items');

    updatesContainer.innerHTML = allItems.map(u => `
      <div class="update-item">
        <p class="update-source">${escHtml(u.source)}</p>
        <p class="update-title">${escHtml(u.title)}</p>
        <p class="update-date">${escHtml(u.date)}</p>
      </div>
    `).join('');

  } catch {
    // Fallback static items
    updatesContainer.innerHTML = `
      <div class="update-item">
        <p class="update-source">USFDA</p>
        <p class="update-title">Drug Safety Communications &amp; Guidance Updates</p>
        <p class="update-date"><a href="updates.html" style="color:var(--red);">View all regulatory updates →</a></p>
      </div>
      <div class="update-item">
        <p class="update-source">EMA</p>
        <p class="update-title">European Medicines Agency – Latest Regulatory News</p>
        <p class="update-date"><a href="updates.html" style="color:var(--red);">View all regulatory updates →</a></p>
      </div>
      <div class="update-item">
        <p class="update-source">CDSCO</p>
        <p class="update-title">Central Drugs Standard Control Organisation – Notifications</p>
        <p class="update-date"><a href="updates.html" style="color:var(--red);">View all regulatory updates →</a></p>
      </div>
    `;
  }
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

loadRegulatoryUpdates();

// ── Scroll reveal for cards ──────────────────────
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .stat-card').forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = `opacity 0.4s ease ${i * 0.06}s, transform 0.4s ease ${i * 0.06}s`;
  observer.observe(el);
});
