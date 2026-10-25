# AIP-chachup-docks
AIPを学習するための問題集/アーキテクチャ説明ガイドを設けたサイト

AWS Certified Generative AI Developer – Professional（**AIP-C01**）の出題範囲を学ぶための静的サイトです。

## 内容

| ページ | 内容 |
| --- | --- |
| `index.html` | ホーム。試験ガイドの分野・配点・タスク |
| `quiz.html` | 問題集（75 問 × 6 回 = 450 問）。実際のユースケースを想定し、複数のサービスを組み合わせて設計するシナリオ問題。解答後に、解説（正解の理由と、不正解の選択肢がなぜ誤りか）、判断基準とした Well-Architected のベストプラクティス、根拠となる AWS 公式ドキュメントへのリンクを表示 |
| `guide.html` | アーキテクチャ説明ガイド。出題範囲のサービスを生成 AI アプリの 7 つの層で整理し、頻出パターン、判断表、サービスごとの役割・使いどころ・試験の着眼点、Well-Architected Generative AI Lens のベストプラクティスの一覧を掲載 |

### 問題集の作り方の方針

- **1 回 75 問 × 6 回。** 各回の分野の配分は試験の配点どおり（第1分野 23 問、第2分野 20 問、第3分野 15 問、第4分野 9 問、第5分野 8 問）。
- **正解の基準は Well-Architected。** すべての問題で、正解は [Well-Architected Generative AI Lens](https://docs.aws.amazon.com/ja_jp/wellarchitected/latest/generative-ai-lens/generative-ai-lens.html) のベストプラクティスに沿っているかどうかで決めています。各回で 6 つの柱の 50 のベストプラクティスをすべて扱います。
- **実際のユースケースが前提。** 業界や業務の状況と制約を示し、その中で最も適切な設計や対応を選ぶ問題です。
- **重複は不可。** 問われるサービスの重複は許容しますが、同じ内容の問題は入れていません（検査スクリプトで問題文の類似度も確かめています）。
- **選択肢の長さで正解が分からないように**しています。正解が一番長い選択肢になる問題はなく、一番短い問題が多くなりすぎないようにもしています。
- **不正解の選択肢も解説する。** 解答後の解説には、正解の理由だけでなく、不正解の選択肢がそれぞれなぜ誤りか（問題文のどの要件や制約に合わないか、何をすべきだったか）を載せています。
- 問題はすべて公開情報をもとにしたオリジナル問題で、実際の試験問題ではありません。

## 使い方

ビルドは不要です。`index.html` をブラウザで開くだけで動きます。学習記録とテーマ設定はブラウザ（localStorage）に保存されます。

問題集では、回（第1回〜第6回）と出題する分野を選んで解きます。結果は分野別と Well-Architected の柱別に表示します。

出題方式は 2 つあります。

- **選んだ範囲をすべて解く：** 選んだ回と分野の問題を通しで解きます。
- **10 問ずつ演習する：** 次の 2 つから選びます。
  - **範囲を選ぶ：** 問題番号の順に 10 問ずつ区切った範囲（1〜10 問目、11〜20 問目、…）を選びます。範囲ごとに解答済みの数と正解の数を表示します。結果の画面の「次の 10 問へ」で次の範囲に進みます。
  - **おまかせ：** まだ解いていない問題、前回間違えた問題を優先して 10 問を選びます。結果の画面の「次の 10 問へ」で、新しく 10 問を選びます。

  「前回間違えた問題だけ解く」も 10 問ずつになります。選んだ出題方式は、次に開いたときも同じになります。

## 問題の追加・修正

問題は `data/set<回>-<a〜d>.js` に、`addQuestions(回, [ ... ])` の形で書きます。

| キー | 内容 |
| --- | --- |
| `d` | 試験分野（1〜5） |
| `t` | タスク（例：`"1.5 検索メカニズムの設計"`） |
| `topic` | 知識分野（例：`"RAG の検索とアクセス制御"`） |
| `wa` | 判断基準とした Well-Architected のベストプラクティスの ID（例：`"GENSEC02-BP01"`）。一覧は `data/meta.js` の `WA` |
| `svc` | 関連するサービス |
| `q` | 問題文 |
| `c` | 選択肢（4 つ。複数選択の問題は 5 つ） |
| `a` | 正解の選択肢の番号（0 始まり）。複数選択の問題は配列 |
| `why` | 選択肢ごとの正誤の理由（`c` と同じ順番）。不正解の選択肢は、問題文の要件や制約に照らして何が問題か、代わりに何をすべきかを 30〜120 文字で書く |
| `exp` | 解説。Well-Architected のベストプラクティスに沿う理由を含める |
| `ref` | 根拠のドキュメントのキーの配列。一覧は `data/meta.js` の `DOCS` |

選択肢は画面に表示するとき、問題ごとに決まった順番に並べ替えます（シャッフルを切っても正解の位置が偏りません）。

追加・修正したら、次のコマンドでデータを検査します。

```
node tools/check-questions.js
```

検査する内容：

- 各回が 75 問で、分野の配分が配点どおりか
- 各回で 50 のベストプラクティスをすべて扱っているか
- 選択肢と理由の数、正解の番号、ベストプラクティスの ID、ドキュメントのキーが正しいか
- 不正解の選択肢の理由が短すぎないか（30 文字以上）
- 正解が一番長い選択肢になっていないか、一番短い問題が多すぎないか
- 問題文が重複・類似していないか

作成の途中で分野の配分などの検査を省くときは `--partial` を付けます。補助として、`node tools/show-choices.js 1-01 1-02` で選択肢の文字数を確認できます。

## ファイル構成

```
LICENSE                   Apache License 2.0
NOTICE                    著作権表示
index.html                ホーム
quiz.html                 問題集
guide.html                アーキテクチャ説明ガイド
css/style.css             スタイル（ライト/ダーク、スマホ対応）
js/common.js              テーマ切替
js/quiz.js                出題・採点・記録
data/meta.js              分野、Well-Architected のベストプラクティス、参照ドキュメント、問題の登録関数
data/set1-a.js 〜 set6-d.js  問題データ（各回 4 ファイル）
tools/check-questions.js  問題データの検査
tools/show-choices.js     選択肢と文字数の表示
tools/near-shortest.js    正解が一番短い問題の一覧
tools/replace.py          文字列の一括置換
```

## GitHub Pages での公開

Settings → Pages で Branch を `main`、フォルダを `/ (root)` にして保存します（`.nojekyll` を配置済み）。

## 出典

- [AIP-C01 試験ガイド](https://docs.aws.amazon.com/ja_jp/aws-certification/latest/ai-professional-01/ai-professional-01.html)
- [In-Scope AWS Services](https://docs.aws.amazon.com/ja_jp/aws-certification/latest/ai-professional-01/aip-01-in-scope-services.html)
- [Well-Architected Generative AI Lens](https://docs.aws.amazon.com/ja_jp/wellarchitected/latest/generative-ai-lens/generative-ai-lens.html)

## ライセンス

[Apache License 2.0](LICENSE) で公開しています。コード、問題、解説、ガイドの文章のすべてが対象です。著作権表示は [NOTICE](NOTICE) にあります。

```
Copyright 2026 Masaki Okuda
```

## 免責事項

- このサイトは個人が作成した学習用の教材です。Amazon Web Services（AWS）の公式の教材ではなく、AWS が承認・提供しているものでもありません。
- 「AWS」「Amazon Bedrock」などのサービス名は、Amazon.com, Inc. またはその関連会社の商標です。
- 問題と解説は正確さに努めていますが、誤りを含む可能性があります。最新の仕様は AWS の公式ドキュメントで確認してください。
