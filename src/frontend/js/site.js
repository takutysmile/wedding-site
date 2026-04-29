// ============================================================
// 挙式日時 — デプロイ前に変更してください
// ============================================================
const WEDDING_DATE    = new Date('2027-01-23T10:00:00');
const RSVP_CLOSE_DATE = new Date('2026-12-24T00:00:00');

// ============================================================
// RSVP 回答期限チェック（12/24 以降はフォームを閉鎖）
// ============================================================
(function checkRsvpDeadline() {
  if (new Date() < RSVP_CLOSE_DATE) {
    // 期限内 — 閉鎖メッセージを非表示
    const el = document.getElementById('rsvp-closed');
    if (el) el.style.display = 'none';
    return;
  }
  // 期限切れ
  const noteEl     = document.getElementById('rsvp-deadline-note');
  const closedEl   = document.getElementById('rsvp-closed');
  const formWrapEl = document.getElementById('form-wrap');
  const fabEl      = document.getElementById('fab-rsvp');

  if (noteEl)     noteEl.style.display     = 'none';
  if (closedEl)   closedEl.classList.add('is-shown');
  if (formWrapEl) formWrapEl.style.display = 'none';
  if (fabEl)      fabEl.style.display      = 'none';
})();

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
// パララックス背景（PC のみ。SP は CSS float アニメで代替）
// ============================================================
const parallaxEl = document.getElementById('hero-parallax');
const isTouch    = window.matchMedia('(max-width: 768px)').matches;

if (parallaxEl && !isTouch) {
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
// スクロール進捗バー + FAB 表示制御
// ============================================================
const progressBar = document.getElementById('scroll-progress');
const fabRsvp     = document.getElementById('fab-rsvp');
const heroSection = document.getElementById('hero');
const rsvpSection = document.getElementById('rsvp');

function updateScrollUI() {
  const scrollTop  = window.scrollY;
  const docHeight  = document.documentElement.scrollHeight - window.innerHeight;

  // 進捗バー
  if (progressBar) {
    progressBar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
  }

  // FAB: ヒーロー通過後 かつ RSVP セクション手前まで表示
  if (fabRsvp) {
    const heroPast  = heroSection ? heroSection.getBoundingClientRect().bottom < 0 : scrollTop > window.innerHeight;
    const rsvpNear  = rsvpSection ? rsvpSection.getBoundingClientRect().top < window.innerHeight * 0.8 : false;
    fabRsvp.classList.toggle('is-visible', heroPast && !rsvpNear);
  }
}

// ============================================================
// ナビ: スクロール方向で hide / show
// ============================================================
const gnav = document.getElementById('gnav');
let lastScrollY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  gnav.classList.toggle('is-hidden', y > lastScrollY && y > 100);
  lastScrollY = y;
  updateScrollUI();
}, { passive: true });
updateScrollUI();

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
// Hero 文字エフェクト（ウォブル + グリッチ）PC: hover / SP: tap
// ============================================================
const heroLetters = Array.from(document.querySelectorAll('.hero-letter'));

setTimeout(() => {

  function wobble(letter) {
    if (letter.classList.contains('is-glitching')) return;
    letter.classList.add('is-wobbling');
    letter.addEventListener('animationend', () => letter.classList.remove('is-wobbling'), { once: true });
  }

  heroLetters.forEach(letter => {
    letter.addEventListener('mouseenter',  () => wobble(letter));          // PC
    letter.addEventListener('touchstart',  () => wobble(letter), { passive: true }); // SP
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

  // ---- SP スワイプヒント ----
  const hint = document.getElementById('swipe-hint');
  if (hint) {
    // ギャラリーが見えたら表示 → 2.5秒後 or 最初のスワイプで消す
    const hintObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setTimeout(() => hint.classList.add('is-hidden'), 2500);
        hintObserver.disconnect();
      }
    }, { threshold: 0.5 });
    hintObserver.observe(track);

    const hideHint = () => hint.classList.add('is-hidden');
    track.addEventListener('touchstart', hideHint, { once: true, passive: true });
    nextBtn.addEventListener('click',     hideHint, { once: true });
    prevBtn.addEventListener('click',     hideHint, { once: true });
  }

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
