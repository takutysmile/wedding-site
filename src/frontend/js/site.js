// ============================================================
// 挙式日時 — デプロイ前にここを書き換えてください
// ============================================================
const WEDDING_DATE = new Date('2027-01-23T10:00:00');

// ============================================================
// カウントダウン（毎秒更新）
// ============================================================
function pad(n) { return String(n).padStart(2, '0'); }

function updateCountdown() {
  const diff = WEDDING_DATE - new Date();

  if (diff <= 0) {
    ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => {
      document.getElementById(id).textContent = '00';
    });
    return;
  }

  document.getElementById('cd-days').textContent  = pad(Math.floor(diff / 86400000));
  document.getElementById('cd-hours').textContent = pad(Math.floor(diff % 86400000 / 3600000));
  document.getElementById('cd-mins').textContent  = pad(Math.floor(diff % 3600000  / 60000));
  document.getElementById('cd-secs').textContent  = pad(Math.floor(diff % 60000    / 1000));
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ============================================================
// パララックス背景
// ============================================================
const parallaxEl = document.getElementById('hero-parallax');

if (parallaxEl) {
  window.addEventListener('scroll', () => {
    parallaxEl.style.transform = `translateY(${window.scrollY * 0.38}px)`;
  }, { passive: true });
}

// ============================================================
// スクロールフェードイン（IntersectionObserver）
// ============================================================
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.js-fade-item').forEach(el => fadeObserver.observe(el));

// ============================================================
// ナビ: スクロール下 → 隠す、上 → 表示
// ============================================================
const gnav = document.getElementById('gnav');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y > lastScrollY && y > 100) {
    gnav.classList.add('is-hidden');
  } else {
    gnav.classList.remove('is-hidden');
  }
  lastScrollY = y;
}, { passive: true });

// ============================================================
// モバイルメニュー トグル
// ============================================================
const toggle  = document.getElementById('gnav-toggle');
const navList = document.getElementById('gnav-list');

toggle.addEventListener('click', () => {
  const isOpen = navList.classList.toggle('is-open');
  toggle.classList.toggle('is-open', isOpen);
  toggle.setAttribute('aria-expanded', isOpen);
});

navList.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navList.classList.remove('is-open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', false);
  });
});
