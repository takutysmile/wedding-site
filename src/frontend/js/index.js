const form      = document.getElementById('rsvp-form');
const submitBtn = document.getElementById('submit-btn');
const formAlert = document.getElementById('form-alert');

// ============================================================
// ご出席 — トグルボタン（ラジオボタンの代わり）
// ============================================================
const attendanceInput = document.getElementById('attendance');
const attYesBtn = document.getElementById('att-yes');
const attNoBtn  = document.getElementById('att-no');

function pickAttendance(value) {
  attendanceInput.value = value;
  attYesBtn.classList.toggle('sel', value === 'attending');
  attNoBtn.classList.toggle('sel', value === 'not_attending');
  attYesBtn.setAttribute('aria-checked', String(value === 'attending'));
  attNoBtn.setAttribute('aria-checked', String(value === 'not_attending'));
}

attYesBtn.addEventListener('click', () => pickAttendance('attending'));
attNoBtn.addEventListener('click', () => pickAttendance('not_attending'));

// ============================================================
// エラートースト
// ============================================================
const errorToast = document.getElementById('error-toast');
const etMsg      = document.getElementById('et-msg');
const etClose    = document.getElementById('et-close');
let toastTimer;

function showToast(msg) {
  etMsg.textContent = msg;
  errorToast.classList.add('is-open');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 5000);
}

function hideToast() {
  errorToast.classList.remove('is-open');
}

if (etClose) {
  etClose.addEventListener('click', hideToast);
}

// ============================================================
// RSVP フォーム送信
// ============================================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const familyName     = document.getElementById('family-name').value.trim();
  const givenName      = document.getElementById('given-name').value.trim();
  const familyNameKana = document.getElementById('family-name-kana').value.trim();
  const givenNameKana  = document.getElementById('given-name-kana').value.trim();
  const attendance     = attendanceInput.value;
  const message        = document.getElementById('message').value.trim();

  // ひらがなのみ許可（伸ばし棒「ー」・繰り返し記号「ゝゞ」も許容）
  const HIRAGANA_RE = /^[ぁ-ゖゝゞー]+$/;

  let hasError = false;
  const missingLabels = [];

  if (!familyName || !givenName) {
    setError('name-error', '姓・名を両方入力してください');
    missingLabels.push('お名前');
    hasError = true;
  }
  if (!familyNameKana || !givenNameKana) {
    setError('kana-error', 'ふりがなを両方入力してください');
    missingLabels.push('ふりがな');
    hasError = true;
  } else if (!HIRAGANA_RE.test(familyNameKana) || !HIRAGANA_RE.test(givenNameKana)) {
    setError('kana-error', 'ふりがなはひらがなで入力してください');
    missingLabels.push('ふりがな');
    hasError = true;
  }
  if (!attendance) {
    setError('attendance-error', '出欠を選択してください');
    missingLabels.push('ご出席');
    hasError = true;
  }
  if (hasError) {
    showToast(`未入力の項目があります：${missingLabels.join(' ')}`);
    return;
  }

  submitBtn.disabled    = true;
  submitBtn.textContent = '送信中...';

  const name     = `${familyName} ${givenName}`; // 姓と名をスペースで結合して送信
  const furigana = `${familyNameKana} ${givenNameKana}`;
  const payload  = { name, furigana, attendance };
  if (message) payload.message = message;

  try {
    const res = await fetch(`${API_BASE}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      launchSuccess();
    } else {
      const data = await res.json().catch(() => ({}));
      const msg  = data.error || '送信に失敗しました もう一度お試しください';
      showToast(msg);
      submitBtn.disabled    = false;
      submitBtn.textContent = '送信する';
    }
  } catch {
    showToast('通信エラーが発生しました インターネット接続をご確認ください');
    submitBtn.disabled    = false;
    submitBtn.textContent = '送信する';
  }
});

// ============================================================
// 送信成功 — 封筒アニメーション → 完了メッセージ
// ============================================================
function launchSuccess() {
  const formWrap = document.getElementById('form-wrap');
  const complete = document.getElementById('complete');

  // フォームを非表示にして完了セクションを表示
  formWrap.style.display = 'none';
  complete.classList.add('show');

  // フォームが消えてレイアウトが縮むと完了メッセージが画面外になることが
  // あるため、表示位置までスクロールして追従させる
  complete.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // 封筒アニメーション終了後にメッセージが自動表示（CSS 側で delay 1.0s）
}

// ============================================================
// ヘルパー
// ============================================================
function setError(id, msg) {
  const errorEl = document.getElementById(id);
  if (!errorEl) return;

  errorEl.textContent = msg;
  errorEl.classList.remove('is-shown');
  void errorEl.offsetWidth; // クラスを一旦外した後に再付与してアニメを確実にリセットする
  errorEl.classList.add('is-shown');

  // 親 .field にシェイクを付与
  const field = errorEl.closest('.field');
  if (field) {
    field.classList.add('is-error');
    field.addEventListener('animationend', () => {
      field.classList.remove('is-error');
    }, { once: true });
  }
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('is-shown');
  });
  document.querySelectorAll('.field.is-error').forEach(el => {
    el.classList.remove('is-error');
  });
  if (formAlert) {
    formAlert.textContent = '';
    formAlert.classList.remove('show');
  }
}
