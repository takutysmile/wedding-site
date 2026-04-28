# API Specification

## ベースURL

```
https://<cloudfront-domain>/api
```

---

## エンドポイント一覧

| メソッド | パス | 概要 | 認証 |
|---|---|---|---|
| POST | /rsvp | RSVP回答を送信する | 不要 |
| GET | /admin/rsvp | RSVP回答一覧を取得する | 必要 |
| DELETE | /admin/rsvp/{id} | RSVP回答を削除する | 必要 |

---

## POST /rsvp

### 概要
ゲストがRSVP回答を送信する。

### リクエスト

**Headers**
```
Content-Type: application/json
```

**Body**
```json
{
  "name": "山田 太郎",
  "attendance": "attending",
  "dietary_restrictions": "甲殻類アレルギー",
  "message": "おめでとうございます。楽しみにしています。"
}
```

| フィールド | 型 | 必須 | 値 | 備考 |
|---|---|---|---|---|
| name | string | ◯ | 任意の文字列 | 1〜50文字 |
| attendance | string | ◯ | `"attending"` or `"not_attending"` | 出席/欠席 |
| dietary_restrictions | string | ✕ | 任意の文字列 | 最大200文字 |
| message | string | ✕ | 任意の文字列 | 最大500文字 |

### レスポンス

**成功 200**
```json
{
  "message": "回答を受け付けました。"
}
```

**バリデーションエラー 400**
```json
{
  "error": "name は必須です。"
}
```

**サーバーエラー 500**
```json
{
  "error": "サーバーエラーが発生しました。"
}
```

---

## GET /admin/rsvp

### 概要
管理者がRSVP回答の一覧を取得する。

### リクエスト

**Headers**
```
Authorization: Bearer <ADMIN_PASSWORD>
```

### レスポンス

**成功 200**
```json
{
  "items": [
    {
      "id": "uuid-xxxx",
      "name": "山田 太郎",
      "attendance": "attending",
      "dietary_restrictions": "甲殻類アレルギー",
      "message": "楽しみにしています。",
      "submitted_at": "2026-04-28T10:00:00Z"
    }
  ],
  "count": 1
}
```

| フィールド | 型 | 備考 |
|---|---|---|
| items | array | 回答一覧（送信日時の降順） |
| count | number | 総件数 |

**認証エラー 401**
```json
{
  "error": "認証に失敗しました。"
}
```

**サーバーエラー 500**
```json
{
  "error": "サーバーエラーが発生しました。"
}
```

---

## DELETE /admin/rsvp/{id}

### 概要
管理者が指定したRSVP回答を削除する。

### リクエスト

**Headers**
```
Authorization: Bearer <ADMIN_PASSWORD>
```

**Path Parameter**

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| id | string | ◯ | 削除対象のRSVP UUID |

### レスポンス

**成功 200**
```json
{
  "message": "回答を削除しました。"
}
```

**IDなし 400**
```json
{
  "error": "id は必須です。"
}
```

**認証エラー 401**
```json
{
  "error": "認証に失敗しました。"
}
```

**サーバーエラー 500**
```json
{
  "error": "サーバーエラーが発生しました。"
}
```

---

## 共通仕様

- レスポンスは常に `application/json`
- 文字コードは UTF-8
- タイムスタンプは ISO 8601（UTC）形式
