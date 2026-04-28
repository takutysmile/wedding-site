# Project: Wedding Site (Serverless)

## ■ 目的
結婚式招待サイト（RSVP管理付き）をAWSサーバーレスで構築する

---

## ■ 技術スタック
- フロント：HTML / CSS / JS
- API：AWS Lambda (Node.js)
- DB：DynamoDB
- 配信：S3 + CloudFront

---

## ■ アーキテクチャ
User → CloudFront → S3（フロント）
　　　　　 ↓
　　 API Gateway → Lambda → DynamoDB

---

## ■ 開発ルール
1. 必ず specs を最初に読む
2. specs が唯一の正
3. agentの役割を守る
4. 小さく実装して検証する
5. 過剰設計禁止（MVP優先）

---

## ■ 開発フロー
1. product-manager → 要件整理
2. architect → 設計
3. backend / frontend / infra → 実装
4. qa → レビュー
5. 修正

---

## ■ 非機能要件
- 低コスト（無料枠内）
- シンプル構成
- セキュリティ最低限担保

---

## ■ 注意
- 認証は簡易（管理画面のみ）
- 個人利用レベル
- スケーラビリティは後回し