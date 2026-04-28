# 残タスクと手順

## 現在の状態

| カテゴリ | 状態 |
|---|---|
| 要件定義 | ✅ 完了 |
| 設計（アーキテクチャ・API・DB） | ✅ 完了 |
| バックエンド実装 | ✅ 完了 |
| フロントエンド実装 | ✅ 完了 |
| セキュリティ対応 | ✅ 完了 |
| AWSデプロイ | ❌ 未実施 |
| 静的コンテンツ入力 | ❌ 未実施 |

---

## 残タスク一覧

### STEP 1 — コンテンツ入力（ローカル作業）

**ファイル:** `src/frontend/index.html`

以下のコメント箇所を実際の文言に書き換える。

```html
<!-- 変更前 -->
<p class="event-date"><!-- 例: 2026年〇月〇日（〇）〇〇:〇〇 --></p>
<p class="event-venue"><!-- 例: 〇〇ホテル 〒000-0000 東京都... --></p>

<!-- 変更後（例） -->
<p class="event-date">2026年○月○日（○）12時00分</p>
<p class="event-venue">○○ホテル 〒000-0000 東京都○○区○○</p>
```

招待メッセージも同様に書き換える：

```html
<!-- 変更前 -->
<div class="invitation-msg">
  <!-- 招待メッセージをここに記入 -->
</div>

<!-- 変更後（例） -->
<div class="invitation-msg">
  このたび私どもは結婚式を挙げることとなりました。<br>
  ぜひご参席いただけますようお願い申し上げます。
</div>
```

---

### STEP 2 — AWSリソースの構築

詳細手順は `docs/infra-setup.md` を参照。以下はチェックリスト。

#### 2-1. DynamoDB
- [ ] テーブル `wedding-rsvp` を作成（PK: `id`、オンデマンド）

#### 2-2. IAM
- [ ] ポリシー `wedding-lambda-policy` を作成（PutItem・Scan・DeleteItem + CloudWatch Logs）
- [ ] ロール `wedding-lambda-role` を作成し、上記ポリシーをアタッチ

#### 2-3. Lambda
- [ ] 関数 `wedding-rsvp-handler` を作成（Node.js 18.x）
- [ ] `src/backend/` で `npm install` を実行
- [ ] `handler.js`・`lib/`・`routes/`・`node_modules/` をZIPに圧縮
  ```bash
  cd src/backend
  npm install
  zip -r ../../lambda-deploy.zip handler.js lib/ routes/ node_modules/
  ```
- [ ] ZIPをLambdaにアップロード
- [ ] **ハンドラを `handler.handler` に変更**（デフォルトは `index.handler` なので必須）
- [ ] 環境変数を設定
  - `DYNAMODB_TABLE` = `wedding-rsvp`
  - `ADMIN_PASSWORD` = （任意のパスワードを設定）
- [ ] タイムアウトを `10秒` に変更

#### 2-4. API Gateway
- [ ] HTTP API `wedding-api` を作成
- [ ] ルートを3つ追加（統合ターゲット: `wedding-rsvp-handler`）
  - `POST /api/rsvp`
  - `GET /api/admin/rsvp`
  - `DELETE /api/admin/rsvp/{id}`
- [ ] CORS を設定（Origin: `*`、Headers: `Content-Type,Authorization`、Methods: `GET,POST,DELETE,OPTIONS`）
- [ ] スロットリング設定（`POST /api/rsvp`: レート5、バースト10）
- [ ] **エンドポイントURL をメモする**（例: `https://xxxxxxxx.execute-api.ap-northeast-1.amazonaws.com`）

#### 2-5. S3
- [ ] バケットを作成（例: `wedding-site-frontend-2026`、パブリックアクセスは全てブロック）

#### 2-6. CloudFront
- [ ] ディストリビューションを作成
- [ ] オリジン1: S3（OAC設定）→ S3バケットポリシーを更新
- [ ] オリジン2: API Gateway（エンドポイントURL）
- [ ] ビヘイビア追加: パスパターン `/api/*` → API Gatewayオリジン（キャッシュ無効）
- [ ] デフォルトルートオブジェクト: `index.html`
- [ ] **CloudFrontドメイン名をメモする**（例: `xxxxxxxxxxxx.cloudfront.net`）

---

### STEP 3 — フロントエンドの最終調整とアップロード

#### 3-1. API_BASE を更新

**ファイル:** `src/frontend/js/config.js`（1ファイルだけ変更すればOK）

```js
// 変更前
const API_BASE = 'https://<cloudfront-domain>/api';

// 変更後（手順2-6でメモしたドメインに変更）
const API_BASE = 'https://xxxxxxxxxxxx.cloudfront.net/api';
```

#### 3-2. S3 にアップロード

以下のファイル・フォルダをS3バケットのルートにアップロードする。
フォルダ構造をそのまま維持すること（`css/`・`js/` フォルダごとアップロード）。

```
src/frontend/
├── index.html
├── admin.html
├── css/
│   ├── index.css
│   └── admin.css
└── js/
    ├── config.js   ← API_BASE を変更済みのもの
    ├── index.js
    └── admin.js
```

---

### STEP 4 — 動作確認

| 確認項目 | 手順 |
|---|---|
| フロントが表示される | `https://xxxxxxxxxxxx.cloudfront.net` をブラウザで開く |
| 式の情報が表示される | 日時・会場・招待メッセージが正しく表示されているか |
| スマホで表示できる | スマホのブラウザで同じURLを開く |
| RSVPを送信できる | フォームを入力して送信 → 完了画面が表示される |
| DynamoDBにデータが保存される | AWSコンソール → DynamoDB → `wedding-rsvp` テーブル →「項目を検索」 |
| 管理画面にログインできる | `https://xxxxxxxxxxxx.cloudfront.net/admin.html` を開いてパスワードを入力 |
| 一覧が表示される | RSVPの回答が一覧に表示される |
| 削除できる | 一覧から任意の行を削除できる |
| 管理APIが動作する（CURLで確認） | ターミナルで以下を実行: |

```bash
curl -H "Authorization: Bearer YOUR_PASSWORD" \
  https://xxxxxxxxxxxx.cloudfront.net/api/admin/rsvp
```

---

### STEP 5 — 招待URLの共有

- **ゲスト向け URL**: `https://xxxxxxxxxxxx.cloudfront.net`
  → 招待状やLINEでゲストに共有する

- **管理者向け URL**: `https://xxxxxxxxxxxx.cloudfront.net/admin.html`
  → 新郎新婦（または担当者）だけに共有する。URLを知っている人しかアクセスできないため、SNS等には公開しないこと。

---

## 注意事項

| 項目 | 内容 |
|---|---|
| パスワードの保管 | `ADMIN_PASSWORD` に設定した値は必ずメモしておく。Lambda環境変数から後で確認可能だが、紛失に注意 |
| CloudFront の反映時間 | 設定変更後、最大15分ほど反映に時間がかかる場合がある |
| ファイル変更後の再デプロイ | フロントを修正したら S3 に上書きアップロードするだけでOK。バックエンドを修正したら再度ZIPを作成してLambdaにアップロード |
| 静的コンテンツの変更 | 日時・会場・メッセージを変更したい場合は `index.html` を編集して S3 に再アップロード |
