# Database Design

## 概要

DynamoDB を使用する。テーブルは1つのみ（MVP構成）。

---

## テーブル: `wedding-rsvp`

### キー設計

| キー | 属性名 | 型 | 説明 |
|---|---|---|---|
| Partition Key | `id` | String | UUID（Lambda側で生成） |

ソートキーなし。全件スキャンで取得（件数が数十件のため許容）。

---

### 属性一覧

| 属性名 | 型 | 必須 | 説明 |
|---|---|---|---|
| id | String | ◯ | UUID（主キー） |
| name | String | ◯ | 回答者の氏名 |
| attendance | String | ◯ | `"attending"` or `"not_attending"` |
| dietary_restrictions | String | ✕ | 食事制限・アレルギー情報 |
| message | String | ✕ | メッセージ |
| submitted_at | String | ◯ | ISO 8601形式のタイムスタンプ（UTC） |

---

### サンプルレコード

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "山田 太郎",
  "attendance": "attending",
  "dietary_restrictions": "甲殻類アレルギー",
  "message": "おめでとうございます。楽しみにしています。",
  "submitted_at": "2026-04-28T10:00:00Z"
}
```

---

## キャパシティ設定

| 設定 | 値 | 理由 |
|---|---|---|
| 課金モード | オンデマンド（PAY_PER_REQUEST） | 無料枠内。低トラフィックに最適 |
| プロビジョンド | 使用しない | MVP構成、スケーリング不要 |

---

## 備考

- インデックス（GSI/LSI）は使用しない（全件スキャンで十分）
- データ保持期間の設定なし（TTL不使用）
- バックアップは自動バックアップ（AWS デフォルト）に依存
