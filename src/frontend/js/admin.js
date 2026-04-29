let authToken = '';
let allItems  = [];

// ---- ログイン ----

document.getElementById('login-btn').addEventListener('click', doLogin);
document.getElementById('password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doLogin();
});

async function doLogin() {
  const password = document.getElementById('password').value;
  if (!password) {
    document.getElementById('login-error').textContent = 'パスワードを入力してください。';
    return;
  }

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = '確認中...';
  document.getElementById('login-error').textContent = '';

  try {
    const res = await fetch(`${API_BASE}/admin/rsvp`, {
      headers: { 'Authorization': `Bearer ${password}` },
    });

    if (res.ok) {
      authToken = password;
      document.getElementById('login-wrap').style.display = 'none';
      document.getElementById('dashboard').classList.add('show');
      const data = await res.json();
      allItems = data.items;
      updateSummary(allItems);
      applyFilters();
      updateLastUpdated();
    } else if (res.status === 401) {
      document.getElementById('login-error').textContent = 'パスワードが正しくありません。';
    } else {
      document.getElementById('login-error').textContent = 'エラーが発生しました。しばらく待ってから再試行してください。';
    }
  } catch {
    document.getElementById('login-error').textContent = '通信エラーが発生しました。';
  } finally {
    btn.disabled = false;
    btn.textContent = 'ログイン';
  }
}

// ---- ログアウト ----

document.getElementById('logout-btn').addEventListener('click', () => {
  authToken = '';
  document.getElementById('password').value = '';
  document.getElementById('login-error').textContent = '';
  document.getElementById('dashboard').classList.remove('show');
  document.getElementById('login-wrap').style.display = 'flex';
});

// ---- 更新 ----

document.getElementById('reload-btn').addEventListener('click', loadRsvp);

async function loadRsvp() {
  document.getElementById('table-wrap').innerHTML = '<div class="loading">読み込み中...</div>';
  hideDashAlert();

  try {
    const res = await fetch(`${API_BASE}/admin/rsvp`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    if (res.ok) {
      const data = await res.json();
      allItems = data.items;
      updateSummary(allItems);
      applyFilters();
      updateLastUpdated();
    } else {
      showDashAlert('error', 'データの取得に失敗しました。');
      document.getElementById('table-wrap').innerHTML = '';
    }
  } catch {
    showDashAlert('error', '通信エラーが発生しました。');
    document.getElementById('table-wrap').innerHTML = '';
  }
}

// ---- テーブル描画 ----

function renderTable(items) {
  const wrap = document.getElementById('table-wrap');

  if (!items || items.length === 0) {
    wrap.innerHTML = '<div class="empty-msg">まだ回答がありません。</div>';
    return;
  }

  const rows = items.map(item => {
    const attendanceBadge = item.attendance === 'attending'
      ? '<span class="badge badge-attending">出席</span>'
      : '<span class="badge badge-not-attending">欠席</span>';

    const dietary = item.dietary_restrictions
      ? escHtml(item.dietary_restrictions)
      : '<span style="color:#ccc">—</span>';

    const message = item.message
      ? escHtml(item.message)
      : '<span style="color:#ccc">—</span>';

    const date = formatDate(item.submitted_at);

    return `
      <tr>
        <td><strong>${escHtml(item.name)}</strong></td>
        <td>${attendanceBadge}</td>
        <td>${dietary}</td>
        <td style="max-width:200px;word-break:break-word;">${message}</td>
        <td><span style="white-space:nowrap;">${date}</span></td>
        <td>
          <button
            class="btn btn-delete"
            data-id="${escHtml(item.id)}"
            data-name="${escHtml(item.name)}"
            onclick="confirmDelete(this)"
          >削除</button>
        </td>
      </tr>
    `;
  }).join('');

  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>お名前</th>
          <th>出欠</th>
          <th>食事制限</th>
          <th>メッセージ</th>
          <th>送信日時</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ---- 削除 ----

async function confirmDelete(btn) {
  const id = btn.dataset.id;
  const name = btn.dataset.name;

  if (!confirm(`「${name}」の回答を削除しますか？`)) return;

  btn.disabled = true;
  btn.textContent = '削除中';
  hideDashAlert();

  try {
    const res = await fetch(`${API_BASE}/admin/rsvp/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    if (res.ok) {
      showDashAlert('success', `「${name}」の回答を削除しました。`);
      await loadRsvp();
    } else {
      showDashAlert('error', '削除に失敗しました。');
      btn.disabled = false;
      btn.textContent = '削除';
    }
  } catch {
    showDashAlert('error', '通信エラーが発生しました。');
    btn.disabled = false;
    btn.textContent = '削除';
  }
}

// ---- サマリ更新 ----

function updateSummary(items) {
  const total = items.length;
  const attending = items.filter(i => i.attendance === 'attending').length;
  const notAttending = total - attending;
  document.getElementById('count-total').textContent = total;
  document.getElementById('count-attending').textContent = attending;
  document.getElementById('count-not-attending').textContent = notAttending;
}

// ---- ユーティリティ ----

function updateLastUpdated() {
  document.getElementById('last-updated').textContent =
    `最終更新：${new Date().toLocaleString('ja-JP')}`;
}

function showDashAlert(type, msg) {
  const el = document.getElementById('dash-alert');
  el.textContent = msg;
  el.className = `alert ${type}`;
}

function hideDashAlert() {
  document.getElementById('dash-alert').className = 'alert';
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// フィルター・検索
// ============================================================
function applyFilters() {
  const nameQuery   = document.getElementById('search-name').value.trim().toLowerCase();
  const attendance  = document.getElementById('filter-attendance').value;
  const allergyOnly = document.getElementById('filter-allergy').checked;

  const filtered = allItems.filter(item => {
    if (nameQuery  && !item.name.toLowerCase().includes(nameQuery)) return false;
    if (attendance && item.attendance !== attendance)               return false;
    if (allergyOnly && !item.dietary_restrictions)                  return false;
    return true;
  });

  renderTable(filtered);

  const countEl = document.getElementById('filter-count');
  countEl.textContent = filtered.length < allItems.length
    ? `${filtered.length} / ${allItems.length} 件`
    : '';
}

document.getElementById('search-name').addEventListener('input', applyFilters);
document.getElementById('filter-attendance').addEventListener('change', applyFilters);
document.getElementById('filter-allergy').addEventListener('change', applyFilters);
document.getElementById('filter-reset').addEventListener('click', () => {
  document.getElementById('search-name').value      = '';
  document.getElementById('filter-attendance').value = '';
  document.getElementById('filter-allergy').checked  = false;
  applyFilters();
});
