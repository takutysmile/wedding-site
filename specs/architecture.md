# Architecture

## 構成概要

```
[ゲスト / 管理者]
      │
      ▼
 CloudFront
  ├─ /          → S3（静的ファイル: HTML/CSS/JS）
  └─ /api/*     → API Gateway → Lambda → DynamoDB
```

---

## コンポーネント一覧

| コンポーネント | 用途 |
|---|---|
| S3 | フロントエンド静的ファイルのホスティング |
| CloudFront | CDN。S3 と API Gateway への振り分け |
| API Gateway | HTTP APIエンドポイントの公開 |
| Lambda | バックエンドロジック（Node.js） |
| DynamoDB | RSVP回答データの保存 |

---

## リクエストフロー

### ゲスト（RSVP送信）

1. ブラウザが CloudFront 経由で S3 の index.html を取得
2. フォーム送信時に `POST /api/rsvp` を呼び出し
3. API Gateway → Lambda → DynamoDB に書き込み
4. Lambda がレスポンスを返し、フロントが完了メッセージを表示

### 管理者（一覧確認）

1. ブラウザが CloudFront 経由で S3 の admin.html を取得
2. パスワード入力後、`GET /api/admin/rsvp` を呼び出し（Authorizationヘッダー付き）
3. Lambda がパスワードを検証し、DynamoDB から全件取得して返す

---

## 認証方式

- 管理者APIはリクエストヘッダー `Authorization: Bearer <password>` で認証
- Lambda が環境変数 `ADMIN_PASSWORD` と比較する
- セッション・JWT は使用しない（MVP簡易認証）

---

## CORS

- API Gateway で `Access-Control-Allow-Origin: *` を設定
- CloudFront ドメインが確定後、必要に応じて制限

---

## 環境変数（Lambda）

| 変数名 | 内容 |
|---|---|
| `ADMIN_PASSWORD` | 管理画面のパスワード（デプロイ時に設定） |
| `DYNAMODB_TABLE` | DynamoDB テーブル名 |

---

## コスト試算（目安）

| サービス | 無料枠 | 想定利用 |
|---|---|---|
| S3 | 5GB / 月 | 数MB以下 → 無料枠内 |
| CloudFront | 1TB転送 / 月 | 無料枠内 |
| API Gateway | 100万リクエスト / 月 | 無料枠内 |
| Lambda | 100万回実行 / 月 | 無料枠内 |
| DynamoDB | 25GB / 月 | 無料枠内 |
