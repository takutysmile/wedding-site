// ============================================================
// 挙式日時 — デプロイ前に変更してください
// ============================================================
const WEDDING_DATE    = new Date('2027-01-23T10:00:00');
const RSVP_CLOSE_DATE = new Date('2026-12-16T00:00:00');

// ============================================================
// RSVP 回答期限チェック（12/24 以降はフォームを閉鎖）
// ============================================================
function checkRsvpDeadline() {
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
}
checkRsvpDeadline();

// ============================================================
// 挙式集合時間の出し分け（URLに ?family=1 が付いていれば親族向け表示）
// 一般ゲストと親族で集合時間・案内文が異なるため、リンクを分けて
// 案内している（親族には ?family=1 付きのURLを個別に共有する）
// ============================================================
(function () {
  const isFamily = new URLSearchParams(location.search).get('family') === '1';
  if (!isFamily) return;
  const el = document.getElementById('rsvp-arrival-text');
  if (!el) return;
  el.innerHTML =
    '御多用中恐縮に存じますが<br>' +
    '当日親族紹介を行いますので<br>' +
    '<b>午前9:15</b>までにお越しくださいますよう<br>' +
    'お願い申し上げます';
})();

// ============================================================
// ページ入場フラッシュ 除去
// ============================================================
setTimeout(() => {
  const flash = document.getElementById('page-flash');
  if (flash) flash.remove();
}, 900);

// ============================================================
// オープニング扉：輪郭線・取っ手の描画タイミングをJSでスケジュール
// CSSのanimation-delayだけで並行に走らせると、SP実機（Android Chrome /
// iOS Safari）で transform-style:preserve-3d の親（扉パネル）の中に
// delay付きアニメーションが複数あるとき足並みが揃わず、線や取っ手が
// 一番最後にまとめてスナップして見える不具合が出た。
// クラスの付け外しでCSS transitionを明示的に発火させる方式なら、
// その時点でスタイルが同期的に確定するので同じ崩れが起きない。
// ============================================================
(function () {
  const splash = document.getElementById('opening-splash');
  if (!splash) return;

  function draw(selector, delayMs) {
    setTimeout(() => {
      splash.querySelectorAll(selector).forEach(el => el.classList.add('is-drawn'));
    }, delayMs);
  }

  draw('.os-edge-top, .os-edge-bottom, .os-edge-outer', 150);
  draw('.os-edge-seam', 1950);
  draw('.os-handle', 2250);
})();

// ============================================================
// ティッカー / ナビの実高さを測って --ticker-h・--header-h に反映
// ティッカーとナビは別要素の固定配置なので、フォント読み込み等で
// 高さが変わってもナビがティッカーの実高さぶんだけ正確に下にくるように
// 実測値で上書きする（重なって見える問題への対応）
// ============================================================
const cbTicker = document.getElementById('cb-ticker');
const gnavEl   = document.getElementById('gnav');

function syncHeaderHeight() {
  if (!cbTicker || !gnavEl) return;
  const tickerH = cbTicker.offsetHeight;
  document.documentElement.style.setProperty('--ticker-h', `${tickerH}px`);
  document.documentElement.style.setProperty('--header-h', `${tickerH + gnavEl.offsetHeight}px`);
}
syncHeaderHeight();
window.addEventListener('resize', syncHeaderHeight);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(syncHeaderHeight);
}

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

let countdownTimer;

function updateCountdown() {
  const diff = WEDDING_DATE - new Date();
  if (diff <= 0) {
    [cdDays, cdHours, cdMins, cdSecs].forEach(el => { el.textContent = '00'; });
    clearInterval(countdownTimer); // 式当日以降は不要なので停止
    return;
  }
  rollEl(cdDays,  Math.floor(diff / 86400000));
  rollEl(cdHours, Math.floor(diff % 86400000 / 3600000));
  rollEl(cdMins,  Math.floor(diff % 3600000  / 60000));
  rollEl(cdSecs,  Math.floor(diff % 60000    / 1000));
}
updateCountdown();
countdownTimer = setInterval(updateCountdown, 1000);

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
// スクロール処理（パララックス / ナビ / 進捗バー / FAB を1つにまとめる）
// ============================================================
const parallaxEl  = document.getElementById('hero-parallax');
const isTouch     = window.matchMedia('(max-width: 768px)').matches;
const progressBar = document.getElementById('scroll-progress');
const fabRsvp     = document.getElementById('fab-rsvp');
const heroSection = document.getElementById('hero');
const rsvpSection = document.getElementById('rsvp');
let lastScrollY   = 0;

function onScroll() {
  const y         = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;

  // パララックス（PC のみ。SP は CSS アニメで代替）
  if (parallaxEl && !isTouch) {
    parallaxEl.style.transform = `translateY(${y * 0.35}px)`;
  }

  // ティッカーのみ下スクロール中に隠す（ナビは常に表示のまま。
  // ナビは CSS 側で ticker が隠れた分だけ自動的に上へ詰める）
  const hideTicker = y > lastScrollY && y > 100;
  if (cbTicker) cbTicker.classList.toggle('is-hidden', hideTicker);
  lastScrollY = y;

  // 進捗バー
  if (progressBar) {
    progressBar.style.width = (docHeight > 0 ? (y / docHeight) * 100 : 0) + '%';
  }

  // FAB: ヒーローを過ぎて RSVP セクションの手前まで表示
  if (fabRsvp) {
    const heroPast = heroSection ? heroSection.getBoundingClientRect().bottom < 0 : y > window.innerHeight;
    const rsvpNear = rsvpSection ? rsvpSection.getBoundingClientRect().top < window.innerHeight * 0.8 : false;
    fabRsvp.classList.toggle('is-visible', heroPast && !rsvpNear);
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll(); // 初期状態を適用

// ============================================================
// ドロワーメニュー
// ============================================================
const toggle    = document.getElementById('gnav-toggle');
const drawer    = document.getElementById('drawer');
const drawerOvl = document.getElementById('drawer-ovl');
const drawerNav = document.getElementById('drawer-nav');

function openDrawer() {
  drawer.classList.add('is-open');
  drawerOvl.classList.add('is-open');
  toggle.setAttribute('aria-expanded', 'true');
}

function closeDrawer() {
  drawer.classList.remove('is-open');
  drawerOvl.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
}

toggle.addEventListener('click', () => {
  toggle.getAttribute('aria-expanded') === 'true' ? closeDrawer() : openDrawer();
});
document.getElementById('drawer-close').addEventListener('click', closeDrawer);
drawerOvl.addEventListener('click', closeDrawer);
drawerNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

// ============================================================
// ボタン Ripple エフェクト
// ============================================================
// position:relative / overflow:hidden は CSS 側で定義済み
document.querySelectorAll('.submit-btn, .gnav-rsvp-pill, .slider-btn').forEach(btn => {
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
// Gallery Slider（Swiper.js）
// ============================================================
// スワイプ操作は自前のtouchstart/touchmove実装を3パターン試したが、
// いずれも実機のiOS Safariで反応しなくなる問題が解決できなかった。
// 実機のデバッグ環境がない状態で、実績のあるSwiper.js（世界的に
// 広く使われ、iOS Safariの癖を含めて長年検証されているカルーセル
// ライブラリ）に切り替え、車輪の再発明をやめている。
(function () {
  const el       = document.getElementById('gallery-swiper');
  const prevBtn  = document.getElementById('slider-prev');
  const nextBtn  = document.getElementById('slider-next');
  const dotsWrap = document.getElementById('slider-dots');
  const curEl    = document.getElementById('slider-current');
  const totEl    = document.getElementById('slider-total');
  if (!el || typeof Swiper === 'undefined') return;

  const total = el.querySelectorAll('.swiper-slide').length;
  totEl.textContent = pad(total);

  // ドット生成
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', `スライド ${i + 1}`);
    dot.addEventListener('click', () => swiper.slideToLoop(i));
    dotsWrap.appendChild(dot);
  }

  const hint = document.getElementById('swipe-hint');
  const hideHint = () => hint && hint.classList.add('is-hidden');
  if (hint) {
    const hintObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setTimeout(hideHint, 2500);
        hintObserver.disconnect();
      }
    }, { threshold: 0.5 });
    hintObserver.observe(el);
  }

  const swiper = new Swiper(el, {
    loop: true,
    speed: 500,
    grabCursor: true,
    keyboard: { enabled: true, onlyInViewport: true },
    autoplay: { delay: 4500, disableOnInteraction: false },
    on: {
      slideChange(s) {
        curEl.textContent = pad(s.realIndex + 1);
        dotsWrap.querySelectorAll('.slider-dot').forEach((d, i) =>
          d.classList.toggle('is-active', i === s.realIndex));
      },
      touchStart: hideHint,
    },
  });

  nextBtn.addEventListener('click', () => { swiper.slideNext(); hideHint(); });
  prevBtn.addEventListener('click', () => { swiper.slidePrev(); hideHint(); });
})();

// ============================================================
// Hero インタラクション: マウス傾き / デバイス傾き / スクロールパララックス
// ============================================================
(function () {
  const hero  = document.getElementById('hero');
  const title = document.querySelector('.hero-title');
  const sub   = document.querySelector('.hero-subtitle');
  const meta  = document.querySelector('.hero-meta-row');
  if (!hero || !title) return;

  let tgtX = 0, tgtY = 0, curX = 0, curY = 0;

  // PC: マウス移動でタイトルが追従
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    tgtX = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
    tgtY = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
  }, { passive: true });

  hero.addEventListener('mouseleave', () => { tgtX = 0; tgtY = 0; });

  // SP: デバイス傾き（ジャイロスコープ）
  const isSP = window.matchMedia('(max-width: 768px)').matches;
  if (isSP && window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', e => {
      if (e.gamma == null) return;
      tgtX = Math.max(-1, Math.min(1,  e.gamma / 18));
      tgtY = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 15));
    }, { passive: true });
  }

  // rAFループ: マウス/傾き + スクロールパララックスを合成
  function tick() {
    // なめらかな追従 (lerp)
    curX += (tgtX - curX) * 0.07;
    curY += (tgtY - curY) * 0.07;

    const scrollY = window.scrollY;
    const heroH   = hero.offsetHeight;
    const pct     = Math.min(scrollY / heroH, 1); // 0〜1

    const tx = curX * 16; // ±16px 水平
    const ty = curY * 9;  // ±9px  垂直

    // タイトル: マウス追従 + スクロールで上へ引き上げ
    title.style.transform = `translate(${tx}px, ${ty - pct * 55}px)`;

    // サブタイトル: タイトルより遅い追従
    if (sub)  sub.style.transform  = `translate(${tx * 0.5}px, ${ty * 0.5 - pct * 35}px)`;

    // メタ行: スクロールのみ (ゆっくり)
    if (meta) meta.style.transform = `translateY(${-pct * 18}px)`;

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
