// ============================================================
// 挙式日時 — デプロイ前に変更してください
// ============================================================
const WEDDING_DATE = new Date('2027-01-23T10:00:00');

// ============================================================
// ページ入場フラッシュ 除去
// ============================================================
setTimeout(() => {
  const flash = document.getElementById('page-flash');
  if (flash) flash.remove();
}, 900);

// ============================================================
// カスタムカーソル
// ============================================================
const cursorDot = document.getElementById('cursor-dot');

if (cursorDot && window.matchMedia('(pointer:fine)').matches) {
  document.addEventListener('mousemove', e => {
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top  = e.clientY + 'px';
    cursorDot.classList.add('is-visible');
  }, { passive: true });

  document.querySelectorAll('a, button, label, .slider-btn').forEach(el => {
    el.addEventListener('mouseenter', () => cursorDot.classList.add('is-hovering'));
    el.addEventListener('mouseleave', () => cursorDot.classList.remove('is-hovering'));
  });
}

// ============================================================
// カウントダウン（スロットマシーンroll）
// ============================================================
function pad(n) { return String(n).padStart(2, '0'); }

function rollEl(el, value) {
  const v = pad(value);
  if (el.textContent === v) return;
  el.textContent = v;
  el.classList.remove('is-ticking');
  void el.offsetWidth;
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
  rollEl(cdDays,  Math.floor(diff / 86400000));
  rollEl(cdHours, Math.floor(diff % 86400000 / 3600000));
  rollEl(cdMins,  Math.floor(diff % 3600000  / 60000));
  rollEl(cdSecs,  Math.floor(diff % 60000    / 1000));
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ============================================================
// パララックス背景（写真レイヤー）
// ============================================================
const parallaxEl = document.getElementById('hero-parallax');
if (parallaxEl) {
  window.addEventListener('scroll', () => {
    parallaxEl.style.transform = `translateY(${window.scrollY * 0.35}px)`;
  }, { passive: true });
}

// ============================================================
// スクロールアニメーション（IntersectionObserver）
// ============================================================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.js-fade-item, .js-stamp-item').forEach(el => observer.observe(el));

// ============================================================
// ナビ: スクロール方向で hide / show
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
  const open = navList.classList.toggle('is-open');
  toggle.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', open);
});
navList.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navList.classList.remove('is-open');
  toggle.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
}));

// ============================================================
// Hero 文字エフェクト（ウォブル + グリッチ）
// ============================================================
const heroLetters = Array.from(document.querySelectorAll('.hero-letter'));

// 全文字が着地してから有効化（最後の文字: --i:6 → 0.3 + 6*0.08 + 0.55 ≈ 1.33s）
setTimeout(() => {

  // ---- ホバーウォブル ----
  heroLetters.forEach(letter => {
    letter.addEventListener('mouseenter', () => {
      if (letter.classList.contains('is-glitching')) return;
      letter.classList.add('is-wobbling');
      letter.addEventListener('animationend', () => letter.classList.remove('is-wobbling'), { once: true });
    });
  });

  // ---- 定期グリッチ（ランダム1文字） ----
  function triggerGlitch() {
    const target = heroLetters[Math.floor(Math.random() * heroLetters.length)];
    if (target.classList.contains('is-wobbling')) return;
    target.classList.add('is-glitching');
    target.addEventListener('animationend', () => target.classList.remove('is-glitching'), { once: true });
  }
  // 最初のグリッチは2秒後、以降4〜7秒ランダム間隔
  function scheduleGlitch() {
    const delay = 4000 + Math.random() * 3000;
    setTimeout(() => { triggerGlitch(); scheduleGlitch(); }, delay);
  }
  setTimeout(scheduleGlitch, 2000);

}, 1500);

// ============================================================
// ボタン Ripple エフェクト
// ============================================================
document.querySelectorAll('.submit-btn, .gnav-rsvp, .slider-btn').forEach(btn => {
  btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  btn.addEventListener('click', function (e) {
    const rect   = this.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top  - size / 2}px;
      border-radius:50%;
      background:rgba(255,255,255,0.38);
      transform:scale(0);
      animation:rippleOut 0.55s ease-out forwards;
      pointer-events:none;
    `;
    this.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
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
    dotsWrap.querySelectorAll('.slider-dot').forEach((d, i) =>
      d.classList.toggle('is-active', i === current));
  }

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  nextBtn.addEventListener('click', () => { stopAuto(); next(); startAuto(); });
  prevBtn.addEventListener('click', () => { stopAuto(); prev(); startAuto(); });

  function startAuto() { autoTimer = setInterval(next, 4500); }
  function stopAuto()  { clearInterval(autoTimer); }
  startAuto();

  // タッチ & マウスドラッグ
  let startX = 0, isDragging = false;
  const onStart = x => { startX = x; isDragging = true; track.classList.add('is-dragging'); stopAuto(); };
  const onEnd   = x => {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove('is-dragging');
    if (Math.abs(x - startX) > 48) { x < startX ? next() : prev(); }
    startAuto();
  };
  track.addEventListener('touchstart', e => onStart(e.touches[0].clientX),     { passive: true });
  track.addEventListener('touchend',   e => onEnd(e.changedTouches[0].clientX), { passive: true });
  track.addEventListener('mousedown',  e => { e.preventDefault(); onStart(e.clientX); });
  window.addEventListener('mouseup',   e => onEnd(e.clientX));

  // キーボード
  document.addEventListener('keydown', e => {
    const r = document.getElementById('gallery').getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      if (e.key === 'ArrowLeft')  { stopAuto(); prev(); startAuto(); }
      if (e.key === 'ArrowRight') { stopAuto(); next(); startAuto(); }
    }
  });
})();
