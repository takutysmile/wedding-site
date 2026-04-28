# 前提条件

## アーキテクチャ
- AWSサーバーレス構成
- S3 + CloudFront + Lambda + DynamoDB

## 技術スタック
- フロント：HTML / CSS / JavaScript
- バックエンド：Node.js（Lambda）
- DB：DynamoDB

## 認証
- 一般ユーザー：認証なし
- 管理画面：簡易認証（Basic or 固定ID/PASS）

## スコープ
- MVP（最小構成）
- 個人利用レベル

## 非対象
- 決済
- SNSログイン
- 高度なセキュリティ

## コスト
- 無料枠内を目標