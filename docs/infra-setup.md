# AWS インフラ構築手順

## 前提条件

- AWSアカウントが作成済みであること
- AWSマネジメントコンソールにログインできること
- 使用リージョン：**ap-northeast-1（東京）**
- Node.js 18以上がローカルにインストール済みであること（デプロイ時に必要）

---

## 構成図（再掲）

```
ブラウザ → CloudFront → S3（HTML/CSS/JS）
                 ↓
          API Gateway → Lambda → DynamoDB
```

---

## 1. DynamoDB テーブル作成

1. AWSコンソール上部の検索バーに `DynamoDB` と入力して開く
2. 左メニュー「テーブル」→「テーブルの作成」をクリック
3. 以下を入力：

   | 項目 | 値 |
   |---|---|
   | テーブル名 | `wedding-rsvp` |
   | パーティションキー | `id`（タイプ：文字列） |
   | ソートキー | **なし**（空欄のまま） |
   | テーブル設定 | 「デフォルト設定」を選択 |
   | キャパシティモード | オンデマンド |

4. 「テーブルの作成」をクリック
5. テーブルのARNをメモしておく（例：`arn:aws:dynamodb:ap-northeast-1:123456789012:table/wedding-rsvp`）

---

## 2. IAM ロール作成

### 2-1. ポリシーの作成

1. 検索バーで `IAM` を開く
2. 左メニュー「ポリシー」→「ポリシーの作成」をクリック
3. 「JSON」タブを選択し、以下を貼り付け（`ACCOUNT_ID` と `REGION` は自分の値に変更）：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:Scan",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:ap-northeast-1:<YOUR_ACCOUNT_ID>:table/wedding-rsvp"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

> **`<YOUR_ACCOUNT_ID>` の確認方法:** AWSコンソール右上のアカウント名をクリックすると12桁の数字が表示される。それをそのまま入力する。（例：`123456789012`）

4. 「次へ」→ポリシー名に `wedding-lambda-policy` と入力 →「ポリシーの作成」

### 2-2. ロールの作成

1. 左メニュー「ロール」→「ロールを作成」をクリック
2. 「AWSのサービス」→「Lambda」を選択 →「次へ」
3. 先ほど作成した `wedding-lambda-policy` を検索してチェック →「次へ」
4. ロール名に `wedding-lambda-role` と入力 →「ロールを作成」

---

## 3. Lambda 関数作成

### 3-1. デプロイパッケージの準備（ローカル作業）

ターミナル（コマンドプロンプト）で以下を実行：

```bash
# プロジェクトルートで実行
cd src/backend
npm install
zip -r ../../lambda-deploy.zip handler.js lib/ routes/ node_modules/
```

> Windowsの場合は PowerShell または Git Bash で実行。zip コマンドがない場合はエクスプローラーで `handler.js`・`lib` フォルダ・`routes` フォルダ・`node_modules` フォルダを選択して右クリック→「圧縮」でも可。

### 3-2. Lambda 関数の作成

1. 検索バーで `Lambda` を開く
2. 「関数の作成」→「一から作成」を選択
3. 以下を入力：

   | 項目 | 値 |
   |---|---|
   | 関数名 | `wedding-rsvp-handler` |
   | ランタイム | `Node.js 18.x` |
   | アーキテクチャ | `x86_64` |
   | 実行ロール | 「既存のロールを使用する」→ `wedding-lambda-role` |

4. 「関数の作成」をクリック

### 3-3. コードのアップロード

1. 関数ページの「コードソース」セクションで「アップロード元」→「.zipファイル」
2. `lambda-deploy.zip` を選択してアップロード
3. 「保存」をクリック

### 3-3-b. ハンドラの設定（必須）

> **ここを忘れると全APIが「Function not found」エラーになります**

1. 「コード」タブ →「ランタイム設定」→「編集」をクリック
2. 「ハンドラ」欄を以下に変更：

   | 項目 | 値 |
   |---|---|
   | ハンドラ | `handler.handler` |

   > デフォルト値は `index.handler` なので必ず変更すること。`handler.handler` の意味は「`handler.js` ファイルの `handler` 関数」。

3. 「保存」をクリック

### 3-4. 環境変数の設定

1. 「設定」タブ→「環境変数」→「編集」
2. 以下を追加：

   | キー | 値 |
   |---|---|
   | `DYNAMODB_TABLE` | `wedding-rsvp` |
   | `ADMIN_PASSWORD` | 任意のパスワード（例：`MySecretPass123`） |

3. 「保存」をクリック

### 3-5. タイムアウト設定

1. 「設定」タブ→「一般設定」→「編集」
2. タイムアウトを `10秒` に変更 →「保存」

---

## 4. API Gateway 設定

1. 検索バーで `API Gateway` を開く
2. 「APIを作成」→「HTTP API」→「構築」をクリック
3. 「統合を追加」で：
   - 統合タイプ：Lambda
   - Lambda 関数：`wedding-rsvp-handler`
4. API名に `wedding-api` と入力 →「次へ」

### 4-1. ルートの設定

「次へ」でルート画面に進み、以下の3ルートを追加：

| メソッド | パス |
|---|---|
| POST | `/api/rsvp` |
| GET | `/api/admin/rsvp` |
| DELETE | `/api/admin/rsvp/{id}` |

各ルートの統合ターゲットは `wedding-rsvp-handler` を選択。

> **なぜ `/api/` が付くのか？**  
> CloudFront のビヘイビアがパスパターン `/api/*` を API Gateway に転送するため、Lambda が受け取るパスは `/api/rsvp` になる。ルート定義をこれに合わせる必要がある。

5. 「次へ」→ステージ名は `$default` のまま
6. 「作成」をクリック
7. 作成後に表示される **エンドポイントURL**（例：`https://xxxxxxxx.execute-api.ap-northeast-1.amazonaws.com`）をメモしておく

### 4-2. CORS 設定

> **補足:** Lambda がすでに CORS ヘッダー（`Access-Control-Allow-Origin` 等）を返しているため、API Gateway 側の CORS 設定は省略可能です。ただし OPTIONS プリフライトを確実に処理するために設定しておくことを推奨します。

1. 左メニュー「CORS」を開く
2. 「設定」をクリックして以下を入力：

   | 項目 | 値 |
   |---|---|
   | Access-Control-Allow-Origin | `*`（CloudFrontドメイン確定後に変更推奨） |
   | Access-Control-Allow-Headers | `Content-Type,Authorization` |
   | Access-Control-Allow-Methods | `GET,POST,DELETE,OPTIONS` |

3. 「保存」をクリック

### 4-3. スロットリング設定（レート制限）

スパム回答・大量リクエストを防ぐため、`POST /rsvp` にリクエスト数の上限を設定する。

1. 左メニュー「ステージ」→ `$default` を選択
2. 「スロットリング」セクションの「ルートレベルのスロットリング」で「編集」
3. `POST /api/rsvp` の行に以下を設定：

   | 項目 | 推奨値 | 説明 |
   |---|---|---|
   | レートの制限 | `5` | 1秒あたりの最大リクエスト数 |
   | バーストの制限 | `10` | 瞬間的に許容する最大数 |

4. 「保存」をクリック

> **補足:** `GET /admin/rsvp` と `DELETE /admin/rsvp/{id}` は管理者のみ使用するため設定不要。  
> 制限を超えたリクエストには自動的に `429 Too Many Requests` が返される。

---

## 5. S3 バケット作成

1. 検索バーで `S3` を開く
2. 「バケットを作成」をクリック
3. 以下を入力：

   | 項目 | 値 |
   |---|---|
   | バケット名 | `wedding-site-frontend-（任意の文字列）`（例：`wedding-site-frontend-2026`）|
   | リージョン | `ap-northeast-1`（東京）|
   | パブリックアクセス | 「パブリックアクセスをすべてブロック」を**オン**のまま |

4. その他はデフォルト →「バケットを作成」

---

## 6. CloudFront 設定

1. 検索バーで `CloudFront` を開く
2. 「ディストリビューションを作成」をクリック

### 6-1. オリジン設定（S3）

| 項目 | 値 |
|---|---|
| オリジンドメイン | 先ほど作成したS3バケットを選択 |
| オリジンアクセス | 「Origin access control settings（OAC）」を選択 |
| OAC | 「新しいOACを作成」をクリックしてデフォルトで作成 |

> 作成後「S3バケットポリシーを更新する必要があります」と表示されたら、「ポリシーをコピー」してS3バケットのバケットポリシーに貼り付ける

### 6-2. 2つ目のオリジン（API Gateway）を追加

「オリジンを追加」→：

| 項目 | 値 |
|---|---|
| オリジンドメイン | API GatewayのエンドポイントURL（手順4でメモしたもの）|
| プロトコル | HTTPSのみ |

### 6-3. ビヘイビア設定

デフォルトビヘイビア（S3向け）はそのままで、`/api/*` 用のビヘイビアを追加：

1. 「ビヘイビアを作成」をクリック
2. 以下を設定：

   | 項目 | 値 |
   |---|---|
   | パスパターン | `/api/*` |
   | オリジン | API Gatewayのオリジン |
   | ビューワープロトコルポリシー | Redirect HTTP to HTTPS |
   | キャッシュポリシー | `CachingDisabled`（APIはキャッシュしない） |
   | オリジンリクエストポリシー | `AllViewerExceptHostHeader` |

3. 「変更を保存」

### 6-4. ディストリビューション設定

| 項目 | 値 |
|---|---|
| デフォルトルートオブジェクト | `index.html` |
| 価格クラス | 「北米・欧州・アジア・中東・アフリカ」（最安クラスで十分） |

4. 「ディストリビューションを作成」をクリック
5. 作成後に表示される **ドメイン名**（例：`xxxxxxxxxxxx.cloudfront.net`）をメモしておく

---

## 7. フロントエンドのデプロイ

### 7-1. index.html の修正

`src/frontend/index.html` 内の以下の行を編集：

```js
// 変更前
const API_BASE = 'https://<cloudfront-domain>/api';

// 変更後（手順6-4でメモしたドメインに変更）
const API_BASE = 'https://xxxxxxxxxxxx.cloudfront.net/api';
```

また、ヒーローセクションのコメント箇所に式の情報を記入：

```html
<p class="event-date">2026年〇月〇日（〇）〇〇時〇〇分</p>
<p class="event-venue">〇〇ホテル 〒000-0000 東京都〇〇区〇〇</p>
```

### 7-2. S3 へアップロード

1. S3バケットを開いて「アップロード」
2. 以下のファイル・フォルダをまとめてアップロード：
   - `src/frontend/index.html`（ゲスト向けページ）
   - `src/frontend/admin.html`（管理者向けページ）
   - `src/frontend/css/` フォルダ（スタイルシート）
   - `src/frontend/js/` フォルダ（JavaScript）
3. アップロード後、「アクション」→「パブリックアクセス」は**付与しない**（CloudFront経由でのみ配信）

> **フォルダのアップロード方法:** S3コンソールの「フォルダのアップロード」ボタンを使うか、ファイルを個別にアップロードして `css/index.css` のようにパスを合わせること。

> **管理画面へのアクセス:**  
> `https://xxxxxxxxxxxx.cloudfront.net/admin.html` でアクセスできる。URLを知っている人しかアクセスできないため、共有は主催者のみに限定すること。

---

## 8. 動作確認

| 確認項目 | 手順 |
|---|---|
| フロントが表示される | `https://xxxxxxxxxxxx.cloudfront.net` をブラウザで開く |
| RSVPが送信できる | フォームを入力して送信 → 完了画面が表示される |
| DynamoDBにデータが入る | DynamoDBコンソール → テーブル → 「項目を検索」で確認 |
| 管理APIが動作する | ターミナルで以下を実行：|

```bash
curl -H "Authorization: Bearer YOUR_PASSWORD" \
  https://xxxxxxxxxxxx.cloudfront.net/api/admin/rsvp
```

---

## IAM 設計まとめ

| リソース | ロール/ポリシー | 権限 |
|---|---|---|
| Lambda | `wedding-lambda-role` | DynamoDB（PutItem, Scan, DeleteItem）+ CloudWatch Logs |
| CloudFront | なし（マネージドサービス） | — |
| API Gateway | なし（Lambda呼び出しはリソースベースポリシーで自動設定） | — |
| S3 | バケットポリシー（CloudFront OACのみ許可） | GetObject（CloudFrontのみ） |

---

## トラブルシューティング

| 症状 | 確認箇所 |
|---|---|
| APIが403を返す | Lambda のリソースベースポリシーに API Gateway が許可されているか確認 |
| APIが500を返す | Lambda の CloudWatch Logs でエラーログを確認 |
| フロントが表示されない | CloudFront のデプロイ完了まで最大15分かかる場合がある |
| DynamoDBに書き込めない | Lambda の IAM ロールに `dynamodb:PutItem` が許可されているか確認 |
