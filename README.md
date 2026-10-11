# AIP-chachup-docks
AIPを学習するための問題集/アーキテクチャ説明ガイドを設けたサイト

AWS Certified Generative AI Developer – Professional（**AIP-C01**）の出題範囲を学ぶための静的サイトです。

## 内容

| ページ | 内容 |
| --- | --- |
| `index.html` | ホーム。試験ガイドの分野・配点・タスクと、サンプル問題の対応 |
| `quiz.html` | 問題集（サンプル 10 問）。複数のサービスを組み合わせるシナリオ問題。解答後に選択肢ごとの正誤理由、正解のアーキテクチャ（処理の流れ）、根拠となる AWS 公式ドキュメントのリンクと記載の要旨を表示 |
| `guide.html` | アーキテクチャ説明ガイド。出題範囲のサービスを生成 AI アプリの 7 つの層で整理し、頻出パターン、判断表、サービスごとの役割・使いどころ・試験の着眼点・資料リンクを掲載 |

### サンプル問題

| 問題 | 分野 | 組み合わせるサービス |
| --- | --- | --- |
| Q01 | D1 検索メカニズム | Knowledge Bases（メタデータフィルタ）+ S3 + OpenSearch Serverless + Cognito + Lambda |
| Q02 | D3 入出力の安全対策 | Guardrails（ApplyGuardrail、PII マスク、グラウンディング）+ SageMaker AI + Knowledge Bases |
| Q03 | D2 エージェント | AgentCore Runtime / Gateway / Identity + Lambda + Cognito |
| Q04 | D2 エージェント | Bedrock Agents（ユーザー確認）+ Lambda + DynamoDB |
| Q05 | D4 コスト最適化（2 つ選択） | バッチ推論 + プロンプトキャッシュ + S3 + EventBridge |
| Q06 | D1 データ処理・ベクトルストア | Knowledge Bases（基盤モデルによる解析、階層チャンキング、増分同期）+ EventBridge + Lambda |
| Q07 | D3 データセキュリティ | PrivateLink + モデル呼び出しログ + KMS + S3 + CloudTrail |
| Q08 | D5 評価 | Bedrock Evaluations（RAG 評価、LLM-as-a-judge）+ CodePipeline |
| Q09 | D5 トラブルシューティング（2 つ選択） | クロスリージョン推論 + SQS + Lambda + CloudWatch |
| Q10 | D2 API 統合 | API Gateway WebSocket + Lambda + ConverseStream + DynamoDB TTL + Cognito |

問題はすべて公開情報をもとにしたオリジナル問題で、実際の試験問題ではありません。

## 使い方

ビルドは不要です。`index.html` をブラウザで開くだけで動きます。学習記録とテーマ設定はブラウザ（localStorage）に保存されます。

## 問題の追加

`data/questions.js` の `window.QUESTIONS` に同じ形式で追加します。

- `answer` は正解の選択肢の index の配列です。2 つ以上なら複数選択問題になります。
- `why` は選択肢ごとの正誤理由（`choices` と同じ順番）です。
- `evidence` には根拠となる AWS ドキュメントの `title` / `url` / `point`（記載の要旨）を入れます。

## ファイル構成

```
index.html          ホーム
quiz.html           問題集
guide.html          アーキテクチャ説明ガイド
css/style.css       スタイル（ライト/ダーク、スマホ対応）
js/common.js        テーマ切替
js/quiz.js          出題・採点・記録
data/questions.js   問題データ
```

## GitHub Pages での公開

Settings → Pages で Branch を `main`、フォルダを `/ (root)` にして保存します（`.nojekyll` を配置済み）。

## 出典

- [AIP-C01 試験ガイド](https://docs.aws.amazon.com/ja_jp/aws-certification/latest/ai-professional-01/ai-professional-01.html)
- [In-Scope AWS Services](https://docs.aws.amazon.com/ja_jp/aws-certification/latest/ai-professional-01/aip-01-in-scope-services.html)
