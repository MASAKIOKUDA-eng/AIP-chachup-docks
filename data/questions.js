// AIP-C01 サンプル問題（シナリオ形式・複数サービスの組み合わせ）
// 各問題の evidence は、解答の根拠となる AWS 公式ドキュメントとその記載の要旨です。
//
// フィールド:
//   id, domain(1-5), task("1.4" など), services[], question, choices[],
//   answer(正解の index 配列。2つ以上なら複数選択), why[](選択肢ごとの正誤理由),
//   explanation(総合解説), flow[](正解アーキテクチャの処理の流れ), evidence[{title,url,point}]

var D = "https://docs.aws.amazon.com/ja_jp/";

window.QUESTIONS = [
  {
    id: "Q01",
    domain: 1,
    task: "1.5 検索（リトリーバル）メカニズムの設計",
    services: ["Amazon Bedrock Knowledge Bases", "Amazon S3", "Amazon OpenSearch Serverless", "Amazon Cognito", "AWS Lambda"],
    question:
      "SaaS 企業が、500 社のテナント向けに社内文書 Q&A を提供する RAG アプリケーションを構築している。文書は Amazon S3 にテナントごとのプレフィックスで保存し、Amazon Bedrock Knowledge Bases（ベクトルストアは Amazon OpenSearch Serverless）で取り込む。利用者は Amazon Cognito で認証され、ID トークンに tenant_id が含まれる。他テナントの文書が回答に混入しないことを保証しつつ、テナント追加時の運用負荷を最小にしたい。最も適切な設計はどれですか。",
    choices: [
      "各文書に tenant_id 属性を持つ <ファイル名>.metadata.json を同じ S3 の場所に置いて取り込み、Lambda が検証済みトークンから tenant_id を取り出して Retrieve / RetrieveAndGenerate の vectorSearchConfiguration.filter に equals 条件として付与する",
      "システムプロンプトに「ユーザーのテナント ID は X です。X 以外の文書は回答に使わないでください」と記載し、取得件数（numberOfResults）を増やして関連文書を確実に拾う",
      "テナントごとに専用のナレッジベースと OpenSearch Serverless コレクションを作成し、テナント追加のたびに手動でデータソースを設定する",
      "Amazon Bedrock Guardrails の拒否トピックに他テナントの社名を登録し、他テナントに関する回答をブロックする"
    ],
    answer: [0],
    why: [
      "正解。メタデータはフィルタ用に保存され、検索時に equals などで絞り込める。tenant_id をクライアント入力ではなくサーバー側（検証済みトークン）から付与するので、利用者が条件を改ざんできない。テナントが増えてもナレッジベースは1つで済む。",
      "誤り。プロンプトでの指示は確実な制御にならず、プロンプトインジェクションで回避されうる。検索段階で他テナントのチャンクが取得されてしまう点も解決しない。",
      "分離はできるが、500 社分のナレッジベースとコレクションを管理するのは運用負荷が大きく、「運用負荷を最小に」という要件に合わない。",
      "誤り。Guardrails は有害コンテンツや話題の制御が目的で、アクセス制御の仕組みではない。社名が出ない文書の混入は防げない。"
    ],
    explanation:
      "マルチテナントの RAG では、検索の段階で取得対象を絞り込むことが重要です。Knowledge Bases では、S3 の文書と同じ場所に .metadata.json を置くと属性が保存され、Retrieve API の filter（equals / in など）で絞り込めます。フィルタ値は必ずサーバー側で、認証済みの情報から決めるのがポイントです。",
    flow: [
      "利用者 → Amazon Cognito で認証（ID トークンに tenant_id）",
      "API → Lambda がトークンを検証し tenant_id を取得",
      "Lambda → Bedrock Knowledge Bases の RetrieveAndGenerate（filter: tenant_id equals X）",
      "Knowledge Bases → OpenSearch Serverless でテナントのチャンクのみ検索 → 基盤モデルで回答生成"
    ],
    evidence: [
      { title: "データソースにメタデータを含めてナレッジベースのクエリを改善する", url: D + "bedrock/latest/userguide/kb-metadata.html", point: "メタデータファイルはソース文書と同じ名前に .metadata.json を付け、S3 の同じ場所に置く（上限 10 KB）。メタデータは埋め込み対象にしない場合でも、フィルタ用に保存される。" },
      { title: "Retrieve API リファレンス", url: D + "bedrock/latest/APIReference/API_agent-runtime_Retrieve.html", point: "フィルタは vectorSearchConfiguration.filter に指定し、equals などの演算子で属性と値を比較する。" },
      { title: "クエリとレスポンス生成の設定", url: D + "bedrock/latest/userguide/kb-test-config.html", point: "メタデータフィルタの演算子として equals / notEquals / greaterThan / lessThan / in / notIn などを使える。" }
    ]
  },
  {
    id: "Q02",
    domain: 3,
    task: "3.1 入出力の安全対策の実装",
    services: ["Amazon Bedrock Guardrails", "Amazon SageMaker AI", "Amazon Bedrock Knowledge Bases", "AWS Lambda"],
    question:
      "保険会社が、Amazon SageMaker AI のリアルタイムエンドポイントでホストしているファインチューニング済みのオープンモデルを使って、約款に関する RAG チャットを提供している。検索には Amazon Bedrock Knowledge Bases の Retrieve API を使う。監査で (1) 検索した約款に書かれていない内容を回答する「ハルシネーション」と、(2) 回答に顧客の電話番号やマイナンバーなどの個人情報が含まれることが指摘された。モデルを変更せずに両方へ対処したい。最も適切な方法はどれですか。",
    choices: [
      "SageMaker エンドポイントの InvokeEndpoint 呼び出し時に guardrailIdentifier パラメータを指定し、Bedrock Guardrails を適用する",
      "Bedrock Guardrails で機密情報フィルタ（該当 PII はマスク）と、しきい値を設定したコンテキストグラウンディングチェックを構成し、Lambda から ApplyGuardrail API を呼び出して、検索結果をグラウンディングソース、質問をクエリとしてモデル出力を評価する",
      "Amazon Comprehend の PII 検出のみを出力に適用し、ハルシネーションは利用者のフィードバックで後から修正する",
      "個人情報を出力しないよう、追加の学習データでモデルを再度ファインチューニングする"
    ],
    answer: [1],
    why: [
      "誤り。guardrailIdentifier は Bedrock の推論 API（InvokeModel / Converse）で使うもので、SageMaker の InvokeEndpoint には存在しない。",
      "正解。ApplyGuardrail API はモデルを呼び出さずにガードレールだけを評価できるため、SageMaker や外部のモデルにも使える。機密情報フィルタで PII をマスクし、コンテキストグラウンディングチェックで根拠のない回答を検出できる。",
      "PII には一部対処できるが、ハルシネーションへの対策がなく要件を満たさない。",
      "「モデルを変更せずに」という条件に反する。また、学習だけでは PII を出さないことを保証できない。"
    ],
    explanation:
      "Bedrock Guardrails は ApplyGuardrail API により、Bedrock 以外のモデルの入出力にも適用できます。コンテキストグラウンディングチェックは、回答がソースに基づいているか（grounding）と質問に関連しているか（relevance）をスコア化し、しきい値未満をブロックします。機密情報フィルタは PII をブロックまたはマスクできます。",
    flow: [
      "Lambda → Knowledge Bases の Retrieve API で約款のチャンクを取得",
      "Lambda → ApplyGuardrail（source=INPUT）で質問をチェック",
      "Lambda → SageMaker エンドポイントで回答を生成",
      "Lambda → ApplyGuardrail（source=OUTPUT、検索結果を grounding_source、質問を query として指定）",
      "マスク済みの回答、またはブロック時の定型メッセージを返す"
    ],
    evidence: [
      { title: "ApplyGuardrail API をアプリケーションで使用する", url: D + "bedrock/latest/userguide/guardrails-use-independent-api.html", point: "基盤モデルを呼び出さずにガードレールを評価できる。マスクした場合はマスク済みテキスト、ブロックした場合は定型メッセージが返る。グラウンディングチェックでは grounding_source と query の修飾子を付けて渡す。" },
      { title: "コンテキストグラウンディングチェックでハルシネーションを除外する", url: D + "bedrock/latest/userguide/guardrails-contextual-grounding-check.html", point: "grounding と relevance をスコア化し、設定したしきい値（0〜0.99）未満の回答をフィルタする。" },
      { title: "Amazon Bedrock Guardrails の概要", url: D + "bedrock/latest/userguide/guardrails.html", point: "機密情報フィルタは入力と出力の PII を検出し、ブロックまたはマスクできる。正規表現によるカスタム識別子も追加できる。" }
    ]
  },
  {
    id: "Q03",
    domain: 2,
    task: "2.1 エージェント型 AI とツール連携の実装",
    services: ["Amazon Bedrock AgentCore Runtime", "AgentCore Gateway", "AgentCore Identity", "AWS Lambda", "Amazon Cognito"],
    question:
      "ある企業は、オープンソースのフレームワーク（LangGraph）で開発した調査エージェントを本番運用したい。要件は次のとおり。(1) 1回の調査が最長で数時間かかる。(2) 利用者ごとにセッションを完全に分離する。(3) 社内の REST API と既存の Lambda 関数を、MCP 対応ツールとしてエージェントから使えるようにする。(4) 利用者の代わりに外部 SaaS へ OAuth でアクセスする。エージェントのコードの書き換えを最小限にしたい。最も適切な構成はどれですか。",
    choices: [
      "エージェントを AWS Lambda にデプロイし、Amazon API Gateway から同期で呼び出す。SaaS のトークンは全利用者共通のものを AWS Secrets Manager に保存する",
      "エージェントを Amazon Bedrock Agents で作り直し、すべてのツールをアクション グループの OpenAPI スキーマとして定義し直す",
      "エージェントを Amazon Bedrock AgentCore Runtime にデプロイし、REST API と Lambda を AgentCore Gateway で MCP ツールとして公開する。利用者の認証と SaaS への OAuth 委任は AgentCore Identity（受信は Cognito）で管理する",
      "エージェントを Amazon ECS on AWS Fargate の 1 つの長時間稼働タスクで動かし、全利用者の会話をそのタスクのメモリ上で管理する"
    ],
    answer: [2],
    why: [
      "誤り。Lambda の最大実行時間は 15 分で数時間の処理に対応できない。また共通トークンでは「利用者の代わりに」アクセスする要件を満たさない。",
      "動作はするが、既存の LangGraph コードとツールを作り直す必要があり「書き換えを最小限に」に反する。",
      "正解。AgentCore Runtime はフレームワークを問わずエージェントをホストでき、セッションを分離して長時間（既定で最大 8 時間）実行できる。Gateway は API や Lambda を MCP 対応ツールに変換し、Identity は Cognito などの IdP と連携して受信認証と外部サービスへの資格情報を管理する。",
      "誤り。利用者のセッションが同じプロセスに混在して分離されず、タスク障害時に全セッションが失われる。"
    ],
    explanation:
      "AgentCore は「任意のフレームワーク・任意のモデルで作ったエージェントを本番運用するための部品群」です。Runtime（ホスティングとセッション分離）、Gateway（ツールの MCP 化）、Identity（エージェント用の ID と資格情報管理）、Memory、Observability などを組み合わせます。既存のエージェントを活かす場合は AgentCore、マネージドな設定中心で新規に作る場合は Bedrock Agents、という使い分けが出題されやすいポイントです。",
    flow: [
      "利用者 → Cognito で認証 → AgentCore Runtime（受信認証を AgentCore Identity で検証）",
      "Runtime がセッションごとに分離された環境で LangGraph エージェントを実行",
      "エージェント → AgentCore Gateway（MCP）→ 社内 REST API / Lambda",
      "エージェント → AgentCore Identity で取得した利用者の OAuth トークン → 外部 SaaS"
    ],
    evidence: [
      { title: "Amazon Bedrock AgentCore とは", url: D + "bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html", point: "Runtime はセッション分離と組み込みの ID 機能を備え、マルチモーダル・マルチエージェントのワークロードに対応する。Gateway は既存の MCP サーバーにも接続できる。" },
      { title: "AgentCore のクォータ", url: D + "bedrock-agentcore/latest/devguide/bedrock-agentcore-limits.html", point: "Runtime のセッションの最大存続時間は既定で 8 時間（maxLifetime で調整可能）。" },
      { title: "AgentCore Identity", url: D + "bedrock-agentcore/latest/devguide/identity.html", point: "AI エージェント向けの ID・資格情報管理サービス。Cognito、Okta、Microsoft Entra ID などの IdP と連携できる。" },
      { title: "AWS 規範ガイダンス：Amazon Bedrock AgentCore", url: D + "prescriptive-guidance/latest/agentic-ai-frameworks/amazon-bedrock-agent-core.html", point: "Gateway により API、Lambda 関数、既存サービスを MCP 対応ツールに変換してエージェントから使える。" },
      { title: "Lambda のクォータ", url: D + "lambda/latest/dg/gettingstarted-limits.html", point: "関数のタイムアウトは最大 900 秒（15 分）。" }
    ]
  },
  {
    id: "Q04",
    domain: 2,
    task: "2.1 エージェント型 AI とツール連携の実装",
    services: ["Amazon Bedrock Agents", "AWS Lambda", "Amazon DynamoDB", "Amazon Bedrock Guardrails"],
    question:
      "EC 事業者が Amazon Bedrock Agents で顧客サポートエージェントを構築している。アクション グループには、注文照会と返金処理の Lambda 関数（注文データは Amazon DynamoDB）を登録している。返金処理だけは、実行前に必ず顧客本人の明示的な同意を得る必要がある。また、悪意のあるプロンプトによって返金が勝手に実行されるリスクを下げたい。追加のカスタムコードを最小にしつつ、最も確実な方法はどれですか。",
    choices: [
      "エージェントの指示（instruction）に「返金の前には必ず顧客に確認すること」と記載する",
      "Bedrock Guardrails の拒否トピックに「返金」を登録する",
      "注文照会と返金処理を別々のエージェントに分け、返金エージェントのモデルをより高性能なものに変更する",
      "返金処理の関数に requireConfirmation を ENABLED に設定し、エージェントが関数を呼ぶ前に利用者へ確認を求めるようにする。アプリケーションは確認結果を次の InvokeAgent リクエストで返す"
    ],
    answer: [3],
    why: [
      "指示は守られることが多いが、モデルの判断に依存するため確実ではなく、プロンプトインジェクションへの対策にもならない。",
      "誤り。返金に関する会話自体がブロックされ、正当な返金もできなくなる。",
      "誤り。モデルを変えても確認が必ず行われる保証にはならない。",
      "正解。ユーザー確認を有効にすると、関数の呼び出し前に必ず確認を求め、利用者が拒否した場合は実行されない。ドキュメントでも、プロンプトインジェクションによる意図しない操作からの保護に役立つと説明されている。"
    ],
    explanation:
      "Bedrock Agents には、アクションの実行を制御する仕組みとして「ユーザー確認（requireConfirmation）」と「Return of Control（Lambda の代わりにアプリ側へ制御を返す）」があります。金額や権限が絡む操作はモデルの判断だけに任せず、仕組みとして人の確認を挟むのが定石です。",
    flow: [
      "顧客 → InvokeAgent「注文123を返金して」",
      "エージェントが返金関数を選択 → requireConfirmation により確認を要求するレスポンスを返す",
      "アプリが顧客に確認 → 結果（CONFIRM / DENY）を returnControlInvocationResults で再度 InvokeAgent",
      "CONFIRM の場合のみ Lambda（返金処理）が実行され、DynamoDB を更新"
    ],
    evidence: [
      { title: "アクション グループ関数を呼び出す前にユーザーの確認を得る", url: D + "bedrock/latest/userguide/agents-userconfirmation.html", point: "確認を有効にすると、関数の呼び出し前にユーザーに確認を求める。確認結果は 2 回目の InvokeAgent で returnControlInvocationResults として送る。拒否された場合は実行されない。悪意のあるプロンプトインジェクションによる操作からアプリケーションを守る助けになる。" },
      { title: "アクションのフルフィルメントの処理", url: D + "bedrock/latest/userguide/action-handle.html", point: "Lambda を使う方法のほかに、RETURN_CONTROL によって予測したアクションとパラメータをアプリケーションに返す方法がある。" },
      { title: "エージェントにアクション グループを追加する", url: D + "bedrock/latest/userguide/agents-action-add.html", point: "関数ごとに requireConfirmation（ENABLED / DISABLED、既定は DISABLED）を設定できる。OpenAPI スキーマでは x-requireConfirmation を使う。" }
    ]
  },
  {
    id: "Q05",
    domain: 4,
    task: "4.1 コスト最適化",
    services: ["Amazon Bedrock バッチ推論", "Amazon Bedrock プロンプトキャッシュ", "Amazon S3", "Amazon EventBridge"],
    question:
      "コールセンターを運営する企業が Amazon Bedrock を使っている。【夜間要約】 毎晩、その日の通話記録 約 20 万件を要約し、翌朝 9 時までに結果を S3 に出せばよい。【日中チャット】 日中は、オペレーター支援チャットで毎回同じ約 5,000 トークンの業務マニュアルをプロンプトの先頭に付けて質問している。品質を変えずにコストを下げたい。適切な施策を 2 つ選んでください。",
    choices: [
      "【夜間要約】 を、入力を JSONL で S3 に置き CreateModelInvocationJob で実行するバッチ推論に切り替え、EventBridge のスケジュールで毎晩起動する",
      "【夜間要約】 のために Provisioned Throughput を購入し、24 時間確保しておく",
      "【日中チャット】 で、共通のマニュアル部分の後ろにキャッシュチェックポイントを置き、プロンプトキャッシュを有効にする",
      "【日中チャット】 で、マニュアルを毎回すべて送る代わりに maxTokens を大きくして回答を詳しくする",
      "【夜間要約】 を、SQS と Lambda で 1 件ずつオンデマンド推論する構成に変え、並列度を上げる"
    ],
    answer: [0, 2],
    why: [
      "正解。遅延が許容される大量処理にはバッチ推論が適しており、対象モデルではオンデマンドより 50% 安い料金で利用できる。",
      "誤り。夜間しか使わない処理のために常時確保すると、使っていない時間も課金され割高になる。",
      "正解。毎回繰り返す長いプレフィックスをキャッシュすると、キャッシュされたトークンは割引料金になり、レイテンシも短くなる。",
      "誤り。出力トークンが増えてコストが上がる。入力の重複も解消されない。",
      "誤り。オンデマンド料金のままでコストは下がらず、スロットリングの原因にもなりやすい。"
    ],
    explanation:
      "推論のコスト最適化では、ワークロードの性質に合わせて推論方式を選びます。遅延を許容できる大量処理はバッチ推論、繰り返し使う長いコンテキストはプロンプトキャッシュ、安定した大量のリアルタイム処理は Provisioned Throughput が候補です。プロンプトキャッシュにはモデルごとに最小トークン数や TTL があり、キャッシュへの書き込みは割高になる場合がある点も押さえておきましょう。",
    flow: [
      "【夜間要約】 EventBridge Scheduler → Lambda が当日の通話記録を JSONL にして S3 へ",
      "【夜間要約】 Lambda → CreateModelInvocationJob（入力・出力とも S3）→ 完了後に結果を S3 から取得",
      "【日中チャット】 Converse API：[マニュアル 5,000 トークン] + cachePoint + [オペレーターの質問]",
      "【日中チャット】 2 回目以降はキャッシュヒット → 入力コストとレイテンシを削減"
    ],
    evidence: [
      { title: "バッチ推論ジョブの作成", url: D + "bedrock/latest/userguide/batch-inference-create.html", point: "CreateModelInvocationJob で、S3 に置いた JSONL の複数のプロンプトに対してまとめて推論する。レイテンシを重視しないワークロード向け。" },
      { title: "Amazon Bedrock の料金", url: "https://aws.amazon.com/jp/bedrock/pricing/", point: "一部の基盤モデルは、バッチ推論をオンデマンドより 50% 低い料金で提供している。" },
      { title: "プロンプトキャッシュ", url: D + "bedrock/latest/userguide/prompt-caching.html", point: "対応モデルでプロンプトの一部をキャッシュし、繰り返し使う長いコンテキストのレイテンシと入力トークンのコストを削減する。" },
      { title: "Generative AI Lens GENCOST03-BP03：プロンプトキャッシュでトークンコストを削減する", url: D + "wellarchitected/latest/generative-ai-lens/gencost03-bp03.html", point: "キャッシュされたトークンは割引料金になるが、キャッシュへの書き込みはモデルによって割高になる。チェックポイントにはモデルごとの最小トークン数がある。" }
    ]
  },
  {
    id: "Q06",
    domain: 1,
    task: "1.3 データの検証と処理パイプライン / 1.4 ベクトルストア",
    services: ["Amazon Bedrock Knowledge Bases", "Amazon S3", "Amazon EventBridge", "AWS Lambda"],
    question:
      "製造業の企業が、数百ページある保守マニュアル（PDF）を Amazon Bedrock Knowledge Bases に取り込んでいる。マニュアルには部品表などの複雑な表や図が多く、既定の設定では表の内容に関する質問への回答精度が低い。また、手順の一部だけが検索されて前後の文脈が欠けた回答になることが多い。マニュアルは S3 上で毎日数件更新される。最も効果的な改善策の組み合わせはどれですか。",
    choices: [
      "チャンクサイズを既定のまま、取得件数（numberOfResults）を最大まで増やす。更新時はナレッジベースを毎晩削除して作り直す",
      "PDF をすべて画像に変換してから取り込み、固定サイズのチャンクを 50 トークンに縮める",
      "解析方式に基盤モデルによる解析（BEDROCK_FOUNDATION_MODEL）を設定して表や図を抽出し、階層チャンキング（子チャンクで検索し、親チャンクを返す）を使う。S3 の更新イベントを EventBridge で受けて Lambda から StartIngestionJob を実行し、増分で同期する",
      "Amazon Comprehend でマニュアルからキーフレーズを抽出し、キーフレーズだけをナレッジベースに取り込む"
    ],
    answer: [2],
    why: [
      "誤り。取得件数を増やしても表の解析精度は上がらず、ノイズが増えてコストも上がる。毎晩の作り直しは同期が増分で行われることを活かせず無駄が大きい。",
      "誤り。画像化しても表の構造は改善せず、チャンクを極端に小さくすると文脈がさらに失われる。",
      "正解。基盤モデルによる解析は表や図を含む資料からテキストや説明を抽出できる。階層チャンキングは子チャンクで精度良く検索し、より広い親チャンクに置き換えて返すため文脈が保たれる。同期は追加・変更・削除された文書だけを処理する。",
      "誤り。キーフレーズだけでは回答に必要な手順や数値が失われる。"
    ],
    explanation:
      "RAG の精度は「解析（パース）→ チャンキング → 埋め込み → 検索」のどこがボトルネックかを見極めて改善します。表や図が多い資料は高度な解析、文脈の欠落は階層チャンキングやセマンティックチャンキング、データの鮮度は増分同期の自動化で対応します。",
    flow: [
      "マニュアル更新 → S3 → EventBridge（Object Created）→ Lambda",
      "Lambda → StartIngestionJob（追加・変更された文書のみ処理）",
      "Knowledge Bases：基盤モデルで解析 → 階層チャンキング → 埋め込み → ベクトルストア",
      "検索時：子チャンクでマッチ → 親チャンクに置き換えて基盤モデルに渡す"
    ],
    evidence: [
      { title: "ナレッジベースのコンテンツのチャンキングの仕組み", url: D + "bedrock/latest/userguide/kb-chunking.html", point: "階層チャンキングは親と子の 2 層に分割し、検索時は子チャンクを取得して、より広い親チャンクに置き換える。セマンティックチャンキングは意味的に近い内容のまとまりで分割する。" },
      { title: "マルチモーダルコンテンツのナレッジベースの作成", url: D + "bedrock/latest/userguide/kb-multimodal-create.html", point: "基盤モデルや Bedrock Data Automation をパーサーに選ぶと、PDF・画像・表などからテキストを抽出し、視覚要素の説明を生成できる。" },
      { title: "データをナレッジベースと同期する", url: D + "bedrock/latest/userguide/kb-data-source-sync-ingest.html", point: "同期は増分で行われ、前回以降に追加・変更・削除された文書だけを処理する。StartIngestionJob で開始し、GetIngestionJob で状況を確認する。" }
    ]
  },
  {
    id: "Q07",
    domain: 3,
    task: "3.2 データセキュリティとプライバシー / 3.3 ガバナンスとコンプライアンス",
    services: ["AWS PrivateLink（インターフェイス VPC エンドポイント）", "Amazon Bedrock モデル呼び出しログ", "AWS KMS", "Amazon S3", "AWS CloudTrail"],
    question:
      "金融機関が、VPC 内の Amazon ECS で動くアプリケーションから Amazon Bedrock を利用する。セキュリティ部門の要件は、(1) 通信がインターネットを経由しないこと、(2) すべてのプロンプトと応答の本文を監査用に 7 年間保存すること、(3) 保存データは自社管理の鍵で暗号化すること、(4) 誰がどのモデルを呼び出したかの API 操作履歴を残すこと、である。最も適切な構成はどれですか。",
    choices: [
      "NAT ゲートウェイ経由で Bedrock のパブリックエンドポイントに接続し、セキュリティグループで送信先を制限する。CloudTrail の証跡だけを有効にしてプロンプトと応答を記録する",
      "bedrock-runtime のインターフェイス VPC エンドポイント（エンドポイントポリシーで許可する操作を制限）を使う。モデル呼び出しログを有効にして、KMS カスタマーマネージドキーで暗号化した S3 に出力し、ライフサイクルルールで 7 年間保持する。API 操作履歴は CloudTrail で記録する",
      "アプリケーションでプロンプトと応答を CloudWatch Logs に出力し、ロググループの保持期間を無期限にする。通信はパブリックエンドポイントに TLS で接続する",
      "VPC ピアリングで Bedrock のサービス VPC と接続し、Amazon Macie でプロンプトを分類して保存する"
    ],
    answer: [1],
    why: [
      "誤り。NAT ゲートウェイ経由ではインターネット側の経路を使う。また CloudTrail は API 呼び出しの記録であり、プロンプトや応答の本文は記録されない。",
      "正解。インターフェイス VPC エンドポイント（PrivateLink）でプライベートに接続でき、モデル呼び出しログで入出力の本文を S3 / CloudWatch Logs に記録できる。KMS キーで暗号化し、API 操作は CloudTrail で追跡する。",
      "誤り。インターネット経由の要件を満たさない。アプリ任せのログでは漏れが生じうるうえ、自社管理の鍵による暗号化も指定されていない。",
      "誤り。Bedrock との接続に VPC ピアリングは使わない。Macie は S3 内の機密データの検出サービスで、ログ取得の手段ではない。"
    ],
    explanation:
      "「本文を残す」はモデル呼び出しログ、「誰がいつ呼んだか」は CloudTrail という役割の違いが頻出です。閉域接続は PrivateLink（インターフェイス VPC エンドポイント）を使い、プライベート DNS を有効にすればコードを変えずにエンドポイント経由になります。ログの暗号化に使う KMS もプライベートに使う場合は、KMS 用の VPC エンドポイントも検討します。",
    flow: [
      "ECS タスク（プライベートサブネット）→ bedrock-runtime インターフェイス VPC エンドポイント → Bedrock",
      "Bedrock → モデル呼び出しログ → S3（SSE-KMS、カスタマーマネージドキー、ライフサイクル 7 年）",
      "すべての API 操作 → CloudTrail（誰が・いつ・どのモデルを）"
    ],
    evidence: [
      { title: "インターフェイス VPC エンドポイント（AWS PrivateLink）で Bedrock にプライベート接続する", url: D + "bedrock/latest/userguide/vpc-interface-endpoints.html", point: "VPC と Bedrock の間にプライベート接続を作成できる。エンドポイントポリシーで InvokeModel などの許可する操作を制御する。プライベート DNS を有効にすると通常のサービス名がエンドポイント経由になる。" },
      { title: "モデル呼び出しログ", url: D + "bedrock/latest/userguide/model-invocation-logging.html", point: "モデル呼び出しの入力データと出力データを CloudWatch Logs や S3 に記録できる。" },
      { title: "規範ガイダンス：CloudFormation で Bedrock のモデル呼び出しログを設定する", url: D + "prescriptive-guidance/latest/patterns/configure-bedrock-invocation-logging-cloudformation.html", point: "呼び出しログ用の S3 バケットと CloudWatch Logs のロググループを KMS キーで暗号化する構成例。" },
      { title: "VPC エンドポイント経由で AWS KMS に接続する", url: D + "kms/latest/developerguide/kms-vpc-endpoint.html", point: "KMS にもインターフェイス VPC エンドポイントがあり、インターネットゲートウェイや NAT なしで鍵の操作ができる。" }
    ]
  },
  {
    id: "Q08",
    domain: 5,
    task: "5.1 生成 AI の評価の仕組みの実装",
    services: ["Amazon Bedrock Evaluations", "Amazon Bedrock Knowledge Bases", "Amazon S3", "AWS CodePipeline / CodeBuild"],
    question:
      "社内ヘルプデスク向け RAG を運用しているチームが、チャンキング方式と生成モデルの変更を検討している。変更のたびに (1) 検索結果が質問に関連しているか、(2) 回答が正しく、検索した文書に忠実か（ハルシネーションがないか）を自動で評価し、基準を下回る変更は本番に出さないようにしたい。評価のための大規模な人手は用意できない。最も適切な方法はどれですか。",
    choices: [
      "本番リリース後に CloudWatch で InvocationLatency と Invocations を監視し、問題があればロールバックする",
      "変更のたびに社員 50 名に回答を 5 段階で評価してもらい、平均点で判断する",
      "質問と正解（ground truth）のデータセットを S3 に用意し、Bedrock のナレッジベース評価ジョブを使う。検索のみの評価でコンテキストの関連性と網羅性を、検索と生成の評価で LLM-as-a-judge による正確性と忠実性を測る。CodePipeline から評価を実行し、スコアがしきい値未満ならデプロイを止める",
      "一般的なベンチマークデータセットで生成モデル単体の自動評価（ROUGE など）だけを行う"
    ],
    answer: [2],
    why: [
      "誤り。レイテンシや呼び出し回数では回答の品質はわからず、問題が本番で起きてから気づくことになる。",
      "人による評価は有効だが、変更のたびに大人数を集めるのは「大規模な人手は用意できない」という条件に反し、自動化もできない。",
      "正解。ナレッジベース評価には「検索のみ」と「検索と生成」の 2 種類があり、評価用モデル（LLM-as-a-judge）が Context relevance / coverage、Correctness、Faithfulness などを算出する。パイプラインの品質ゲートにすれば回帰を防げる。",
      "誤り。検索の品質を評価できず、社内文書という実際のデータでの性能もわからない。"
    ],
    explanation:
      "RAG の評価は「検索」と「生成」に分けて考えます。検索の評価（コンテキストの関連性・網羅性）と、生成の評価（正確性・忠実性・完全性など）を、自社の質問セットと正解で自動評価し、CI/CD の品質ゲートに組み込むのが試験ガイドのスキル（回帰テスト、自動品質ゲート、LLM-as-a-Judge）に対応する構成です。",
    flow: [
      "変更を push → CodePipeline → CodeBuild がテスト用ナレッジベースを更新",
      "CodeBuild → Bedrock 評価ジョブ（検索のみ：ContextRelevance / ContextCoverage）",
      "CodeBuild → Bedrock 評価ジョブ（検索と生成：Correctness / Faithfulness、評価用モデルを指定）",
      "結果を S3 から読み取り → しきい値を満たせば本番デプロイ、満たさなければ停止"
    ],
    evidence: [
      { title: "検索と生成の RAG 評価ジョブの作成", url: D + "bedrock/latest/userguide/knowledge-base-evaluation-create-randg.html", point: "ナレッジベースの検索と回答生成をまとめて評価するジョブを作成できる。評価用モデル（judge）を指定する。" },
      { title: "メトリクスを使って RAG システムの性能を理解する", url: D + "bedrock/latest/userguide/knowledge-base-evaluation-metrics.html", point: "検索と生成の評価には Correctness、Completeness、Helpfulness、Faithfulness などがあり、検索のみの評価には ContextRelevance と ContextCoverage がある。Faithfulness は検索したチャンクに対してハルシネーションがないかを示す。" },
      { title: "AIP-C01 試験ガイド 第 5 分野", url: D + "aws-certification/latest/ai-professional-01/ai-professional-01-domain5.html", point: "スキルとして、回帰テストと自動品質ゲート、RAG 評価や LLM-as-a-Judge による評価、検索品質のテストが挙げられている。" }
    ]
  },
  {
    id: "Q09",
    domain: 5,
    task: "5.2 生成 AI アプリケーションのトラブルシューティング / 4.2 パフォーマンス",
    services: ["Amazon Bedrock クロスリージョン推論", "Amazon SQS", "AWS Lambda", "Amazon CloudWatch"],
    question:
      "小売企業の商品説明生成アプリは、Amazon Bedrock をオンデマンドで呼び出している。セール前の夕方に、管理画面からの一括生成リクエストが集中し、ThrottlingException（HTTP 429）が多発して処理が失敗する。CloudWatch の InvocationThrottles メトリクスも同じ時間帯に増えている。データの処理リージョンは米国内であれば問題ない。根本的に失敗を減らす施策を 2 つ選んでください。",
    choices: [
      "一括生成リクエストを Amazon SQS に入れ、Lambda で取り出して呼び出す非同期の構成にし、失敗時はジッター付きの指数バックオフで再試行する",
      "呼び出し元 Lambda の予約済み同時実行数を増やし、より多くのリクエストを同時に送る",
      "米国のクロスリージョン推論プロファイルを指定して呼び出し、複数リージョンの処理能力を使う",
      "SDK の自動再試行を無効にして、エラーをすぐ利用者に返す",
      "モデルのパラメータ temperature を 0 にして生成を高速化する"
    ],
    answer: [0, 2],
    why: [
      "正解。429 はクォータ超過を示すため、ジッター付きの指数バックオフで再試行するのが推奨。急な集中は SQS で平準化すると、すぐに結果が不要な一括処理に適している。",
      "誤り。同時リクエストが増えて、さらにスロットリングが悪化する。",
      "正解。クロスリージョン推論は、データの所在要件が許す範囲で複数リージョンの処理能力に分散し、急なトラフィックに対応しやすくする。",
      "誤り。失敗がそのまま利用者に返るだけで、根本的な対策にならない。",
      "誤り。temperature は出力の多様性に関する設定で、スロットリングとは関係がない。"
    ],
    explanation:
      "スロットリングへの対策は「送り方を平準化する（キューイング、バックオフ）」と「使える処理能力を増やす（クロスリージョン推論、クォータ引き上げ、Provisioned Throughput）」の 2 つの軸で考えます。InvocationThrottles は SDK の再試行設定によって観測値が変わるため、再試行で隠れたスロットリングにも注意します。",
    flow: [
      "管理画面 → API → SQS（一括生成ジョブを投入）",
      "Lambda（同時実行数を制御）→ SQS からバッチ取得",
      "Lambda → Bedrock（米国のクロスリージョン推論プロファイル ID を modelId に指定）",
      "429 の場合はジッター付き指数バックオフ → 規定回数を超えたら DLQ へ",
      "CloudWatch で InvocationThrottles と DLQ の件数を監視しアラーム"
    ],
    evidence: [
      { title: "Bedrock API エラーコードのトラブルシューティング", url: D + "bedrock/latest/userguide/troubleshooting-api-error-codes.html", point: "429 ThrottlingException はアカウントのクォータの問題として扱い、指数バックオフとランダムなジッターで再試行する。安定した大量の負荷には Provisioned Throughput などを検討する。" },
      { title: "スケーリングとスループットのベストプラクティス", url: D + "bedrock/latest/userguide/scaling-throughput-best-practices.html", point: "モデルとデータ所在の要件が許す場合はクロスリージョン推論を使う。独自のリージョン間フェイルオーバーでは再試行の回数を制限する。" },
      { title: "クロスリージョン推論", url: D + "bedrock/latest/userguide/cross-region-inference.html", point: "推論プロファイルを使い、地理的範囲内の複数リージョンにリクエストを分散してスループットを高める。" },
      { title: "CloudWatch メトリクスで bedrock-runtime の推論を監視する", url: D + "bedrock/latest/userguide/monitoring-runtime-metrics.html", point: "InvocationThrottles はスロットリングされた呼び出しの数。観測される値は SDK の再試行設定に左右される。" }
    ]
  },
  {
    id: "Q10",
    domain: 2,
    task: "2.4 基盤モデル API の統合 / 2.5 アプリケーション統合パターン",
    services: ["Amazon API Gateway（WebSocket API）", "AWS Lambda", "Amazon Bedrock（ConverseStream）", "Amazon DynamoDB", "Amazon Cognito"],
    question:
      "スタートアップ企業が、ブラウザ向けの AI アシスタントを開発している。要件は、(1) 回答を生成しながら 1 文字ずつ画面に表示し、体感の待ち時間を短くする、(2) ログインした利用者ごとに会話履歴を保持し、30 日経過した履歴は自動で削除する、(3) サーバーを管理しない、である。最も適切な構成はどれですか。",
    choices: [
      "API Gateway の REST API から Lambda を同期で呼び出し、InvokeModel で回答全体を生成してから返す。履歴は Lambda の /tmp に保存する",
      "ブラウザから数秒ごとに S3 の結果ファイルをポーリングし、Lambda が生成した回答全文を S3 に書き込む。履歴は S3 にテキストで追記する",
      "Amazon EC2 上に WebSocket サーバーを構築し、会話履歴をインスタンスのメモリに保持する",
      "API Gateway の WebSocket API を使い、$connect ルートの Lambda オーソライザーで Cognito のトークンを検証する。Lambda で ConverseStream を呼び、受け取った差分（delta）を @connections API で順次クライアントに送る。会話履歴は利用者 ID をキーに DynamoDB に保存し、TTL 属性で 30 日後に自動削除する"
    ],
    answer: [3],
    why: [
      "誤り。全文の生成を待つため体感の待ち時間が長く、REST API の統合タイムアウトにも当たりやすい。/tmp は実行環境ごとの一時領域で、履歴の保存には使えない。",
      "誤り。ポーリングでは逐次表示にならず、余計なリクエストが増える。30 日での自動削除の仕組みもない。",
      "誤り。サーバーの管理が必要になり、メモリ上の履歴はインスタンスの停止で失われる。",
      "正解。ConverseStream は生成されたテキストを差分のイベントとして順次返すため、WebSocket で逐次表示できる。DynamoDB の TTL は期限切れの項目を追加コストなしで自動削除する。"
    ],
    explanation:
      "ストリーミング表示は「モデル側のストリーミング API（ConverseStream / InvokeModelWithResponseStream）」と「クライアントへの双方向の通信路（WebSocket など）」の組み合わせで実現します。会話履歴のような期限付きのデータは DynamoDB の TTL で管理するのが定石です。",
    flow: [
      "ブラウザ → Cognito でログイン → WebSocket 接続（$connect で Lambda オーソライザーがトークン検証）",
      "メッセージ受信 → Lambda が DynamoDB から履歴を取得",
      "Lambda → Bedrock ConverseStream → contentBlockDelta を受け取るたびに @connections で送信",
      "完了後 → DynamoDB に会話を保存（expireAt = 現在時刻 + 30 日）"
    ],
    evidence: [
      { title: "Converse API による推論", url: D + "bedrock/latest/userguide/conversation-inference.html", point: "Converse は完了した応答を、ConverseStream は応答をストリームで返す。テキストはコンテンツブロックごとの差分（delta）イベントとして届く。" },
      { title: "API Gateway の WebSocket API", url: D + "apigateway/latest/developerguide/apigateway-websocket-api.html", point: "クライアントとサーバーの双方向通信を実現し、サーバーからクライアントへメッセージを送れる。" },
      { title: "WebSocket API の Lambda オーソライザー", url: D + "apigateway/latest/developerguide/apigateway-websocket-api-lambda-auth.html", point: "$connect ルートで Lambda オーソライザーを使い、接続時に認可を行う。" },
      { title: "DynamoDB の Time to Live（TTL）", url: D + "amazondynamodb/latest/developerguide/TTL.html", point: "項目ごとに有効期限のタイムスタンプを設定すると、期限切れの項目が書き込みスループットを消費せずに自動で削除される。" }
    ]
  }
];

window.DOMAINS = {
  1: { name: "基盤モデルの統合、データ管理、コンプライアンス", weight: 31 },
  2: { name: "実装と統合", weight: 26 },
  3: { name: "AI の安全性、セキュリティ、ガバナンス", weight: 20 },
  4: { name: "生成 AI アプリケーションの運用効率と最適化", weight: 12 },
  5: { name: "テスト、検証、トラブルシューティング", weight: 11 }
};
