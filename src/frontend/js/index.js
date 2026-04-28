const form      = document.getElementById('rsvp-form');
const submitBtn = document.getElementById('submit-btn');
const formAlert = document.getElementById('form-alert');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const name         = document.getElementById('name').value.trim();
  const attendanceEl = document.querySelector('input[name="attendance"]:checked');
  const dietary      = document.getElementById('dietary').value.trim();
  const message      = document.getElementById('message').value.trim();

  let hasError = false;

  if (!name) {
    setError('name-error', 'お名前を入力してください。');
    hasError = true;
  }
  if (!attendanceEl) {
    setError('attendance-error', '出欠を選択してください。');
    hasError = true;
  }
  if (hasError) return;

  submitBtn.disabled    = true;
  submitBtn.textContent = '送信中...';

  const payload = { name, attendance: attendanceEl.value };
  if (dietary) payload.dietary_restrictions = dietary;
  if (message) payload.message = message;

  try {
    const res = await fetch(`${API_BASE}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      document.getElementById('form-wrap').style.display = 'none';
      document.getElementById('complete').classList.add('show');
    } else {
      const data = await res.json().catch(() => ({}));
      showAlert(data.error || '送信に失敗しました。もう一度お試しください。');
      submitBtn.disabled    = false;
      submitBtn.textContent = '送信する';
    }
  } catch {
    showAlert('通信エラーが発生しました。インターネット接続をご確認ください。');
    submitBtn.disabled    = false;
    submitBtn.textContent = '送信する';
  }
});

function setError(id, msg) {
  document.getElementById(id).textContent = msg;
}

function showAlert(msg) {
  formAlert.textContent = msg;
  formAlert.classList.add('show');
}

function clearErrors() {
  document.getElementById('name-error').textContent      = '';
  document.getElementById('attendance-error').textContent = '';
  formAlert.textContent = '';
  formAlert.classList.remove('show');
}
