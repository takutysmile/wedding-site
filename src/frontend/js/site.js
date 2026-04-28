// ============================================================
// 挙式日時 — デプロイ前にここを書き換えてください
// ============================================================
const WEDDING_DATE = new Date('2027-01-23T10:00:00');

// ============================================================
// カウントダウン（毎秒更新 + ティックアニメ）
// ============================================================
function pad(n) { return String(n).padStart(2, '0'); }

function tickEl(el, value) {
  const v = pad(value);
  if (el.textContent === v) return;
  el.textContent = v;
  el.classList.remove('is-ticking');
  void el.offsetWidth; // reflow to restart animation
  el.classList.add('is-ticking');
  el.addEventListener('animationend', () => el.classList.remove('is-ticking'), { once: true });
}

const cdDays  = document.getElementById('cd-days');
const cdHours = document.getElementById('cd-hours');
const cdMins  = document.getElementById('cd-mins');
const cdSecs  = document.getElementById('cd-secs');

function updateCountdown() {
  const diff = WEDDING_DATE - new Date();
  if (diff <= 0) {
    [cdDays, cdHours, cdMins, cdSecs].forEach(el => { el.textContent = '00'; });
    return;
  }
  tickEl(cdDays,  Math.floor(diff / 86400000));
  tickEl(cdHours, Math.floor(diff % 86400000 / 3600000));
  tickEl(cdMins,  Math.floor(diff % 3600000  / 60000));
  tickEl(cdSecs,  Math.floor(diff % 60000    / 1000));
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
// スクロールアニメーション（フェード + スタンプ）
// ============================================================
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.js-fade-item, .js-stamp-item').forEach(el => {
  fadeObserver.observe(el);
});

// ============================================================
// ナビ: スクロール下 → 隠す / 上 → 表示
// ============================================================
const gnav = document.getElementById('gnav');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  gnav.classList.toggle('is-hidden', y > lastScrollY && y > 100);
  lastScrollY = y;
}, { passive: true });

// ============================================================
// モバイルメニュー
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
    toggle.setAttribute('aria-expanded', 'false');
  });
});

// ============================================================
// Gallery Slider
// ============================================================
(function () {
  const track    = document.getElementById('slider-track');
  const prevBtn  = document.getElementById('slider-prev');
  const nextBtn  = document.getElementById('slider-next');
  const dotsWrap = document.getElementById('slider-dots');
  const curEl    = document.getElementById('slider-current');
  const totEl    = document.getElementById('slider-total');

  if (!track) return;

  const slides = track.querySelectorAll('.slide');
  const total  = slides.length;
  let current  = 0;
  let autoTimer;

  // ドット生成
  totEl.textContent = pad(total);
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', `スライド ${i + 1}`);
    dot.addEventListener('click', () => { stopAuto(); goTo(i); startAuto(); });
    dotsWrap.appendChild(dot);
  });

  function goTo(n) {
    current = ((n % total) + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    curEl.textContent = pad(current + 1);
    dotsWrap.querySelectorAll('.slider-dot').forEach((d, i) => {
      d.classList.toggle('is-active', i === current);
    });
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  nextBtn.addEventListener('click', () => { stopAuto(); next(); startAuto(); });
  prevBtn.addEventListener('click', () => { stopAuto(); prev(); startAuto(); });

  function startAuto() { autoTimer = setInterval(next, 4500); }
  function stopAuto()  { clearInterval(autoTimer); }
  startAuto();

  // ---- タッチ & マウスドラッグ ----
  let startX = 0;
  let isDragging = false;

  function onStart(x) {
    startX = x;
    isDragging = true;
    track.classList.add('is-dragging');
    stopAuto();
  }
  function onEnd(x) {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove('is-dragging');
    const dx = x - startX;
    if (Math.abs(dx) > 48) { dx < 0 ? next() : prev(); }
    startAuto();
  }

  // Touch
  track.addEventListener('touchstart', e => onStart(e.touches[0].clientX),      { passive: true });
  track.addEventListener('touchend',   e => onEnd(e.changedTouches[0].clientX),  { passive: true });

  // Mouse drag
  track.addEventListener('mousedown',  e => { e.preventDefault(); onStart(e.clientX); });
  window.addEventListener('mouseup',   e => onEnd(e.clientX));

  // キーボード
  document.addEventListener('keydown', e => {
    const section = document.getElementById('gallery');
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      if (e.key === 'ArrowLeft')  { stopAuto(); prev(); startAuto(); }
      if (e.key === 'ArrowRight') { stopAuto(); next(); startAuto(); }
    }
  });
})();
