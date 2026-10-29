// 第1回 問題 1〜10（最初に作成したサンプル問題）
// 各問題の evidence は、解答の根拠となる AWS 公式ドキュメントとその記載の要旨です。
//
// フィールド:
//   id, domain(1-5), task("1.4" など), services[], question, choices[],
//   answer(正解の index 配列。2つ以上なら複数選択), why[](選択肢ごとの正誤理由),
//   explanation(総合解説), flow[](正解アーキテクチャの処理の流れ), evidence[{title,url,point}]

var D = "https://docs.aws.amazon.com/ja_jp/";

addQuestions(1, [
  {
    wa: "GENSEC01-BP03",
    domain: 1,
    task: "1.5 検索（リトリーバル）メカニズムの設計",
    topic: "RAG の検索とアクセス制御",
    guide: "svc-kb",
    services: ["Amazon Bedrock Knowledge Bases", "Amazon S3", "Amazon OpenSearch Serverless", "Amazon Cognito", "AWS Lambda"],
    question:
      "SaaS 企業が、500 社のテナント向けに社内文書 Q&A を提供する RAG アプリケーションを構築している。文書は Amazon S3 にテナントごとのプレフィックスで保存し、Amazon Bedrock Knowledge Bases（ベクトルストアは Amazon OpenSearch Serverless）で取り込む。利用者は Amazon Cognito で認証され、ID トークンに tenant_id が含まれる。他テナントの文書が回答に混入しないことを保証しつつ、テナント追加時の運用負荷を最小にしたい。最も適切な設計はどれですか。",
    choices: [
      ".metadata.json で文書に tenant_id を付与し、Lambda が検証済みトークンの値を Retrieve の equals フィルタに使う",
      "システムプロンプトに利用者のテナント ID を埋め込み、他テナントの文書は回答に使わないよう指示したうえで、取得件数を増やして関連文書を確実に拾う",
      "テナントごとに専用のナレッジベースと OpenSearch Serverless コレクションを作り、テナント追加のたびにデータソースと IAM ロールを設定する",
      "Bedrock Guardrails の拒否トピックに他テナントの社名や製品名を登録し、利用者のテナント以外の内容を含む回答を出力時にブロックする"
    ],
    answer: [0],
    why: [
      "正解。メタデータはフィルタ用に保存され、検索時に equals などで絞り込める。tenant_id をクライアント入力ではなくサーバー側（検証済みトークン）から付与するので、利用者が条件を改ざんできない。テナントが増えてもナレッジベースは1つで済む。",
      "検索段階で他テナントのチャンクが取得されたまま、モデルの判断だけで除外を任せることになり、プロンプトインジェクションで簡単に破られる。テナントの分離は検索条件としてサーバー側で強制する。",
      "分離はできるが、500 社分のナレッジベースとコレクション、IAM ロールをテナント追加のたびに作ることになり、運用負荷を最小にする要件に反する。1 つの仕組みをメタデータで絞り込むほうが増減に強い。",
      "社名や製品名が書かれていない他テナントの文書は素通りし、混入を保証して防げない。Guardrails は有害な内容や話題を制御するもので、誰がどの文書を見られるかはアクセス制御として検索時に絞る。"
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
    wa: "GENSEC02-BP01",
    domain: 3,
    task: "3.1 入出力の安全対策の実装",
    topic: "入出力の安全対策（Guardrails）",
    guide: "svc-guardrails",
    services: ["Amazon Bedrock Guardrails", "Amazon SageMaker AI", "Amazon Bedrock Knowledge Bases", "AWS Lambda"],
    question:
      "保険会社が、Amazon SageMaker AI のリアルタイムエンドポイントでホストしているファインチューニング済みのオープンモデルを使って、約款に関する RAG チャットを提供している。検索には Amazon Bedrock Knowledge Bases の Retrieve API を使う。監査で (1) 検索した約款に書かれていない内容を回答する「ハルシネーション」と、(2) 回答に顧客の電話番号やマイナンバーなどの個人情報が含まれることが指摘された。モデルを変更せずに両方へ対処したい。最も適切な方法はどれですか。",
    choices: [
      "InvokeEndpoint の呼び出しに guardrailIdentifier と guardrailVersion を指定し、Guardrails の機密情報フィルタとグラウンディングチェックを SageMaker のモデルに適用する",
      "Guardrails に PII のマスクとコンテキストグラウンディングチェックを設定し、Lambda から ApplyGuardrail API で検索結果を根拠としてモデル出力を評価する",
      "モデル出力に Amazon Comprehend の DetectPiiEntities を適用して個人情報をマスクし、ハルシネーションは低評価率を CloudWatch で監視して週次で直す",
      "個人情報を含まず約款だけに基づいた回答例を追加の学習データとして用意し、SageMaker AI でモデルを再度ファインチューニングして出力を改善する"
    ],
    answer: [1],
    why: [
      "InvokeEndpoint には Guardrails を指定する引数がなく、この呼び出しでは何も適用されない。Bedrock 外のモデルの出力は ApplyGuardrail API で別に評価する。",
      "正解。ApplyGuardrail API はモデルを呼び出さずにガードレールだけを評価できるため、SageMaker や外部のモデルにも使える。機密情報フィルタで PII をマスクし、コンテキストグラウンディングチェックで根拠のない回答を検出できる。",
      "Comprehend で個人情報のマスクはできるが、ハルシネーションは低評価のメトリクスが上がるまで放置され、誤った約款説明が出続ける。根拠の文書と照らす検査を出力の段階で自動で行う必要がある。",
      "再ファインチューニングはモデルを変更しないという条件に反する。学習で傾向は変わっても、個人情報を出さないことや根拠に沿うことは保証できず、出力を毎回検査する仕組みが別に必要になる。"
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
    wa: "GENPERF03-BP01",
    domain: 2,
    task: "2.1 エージェント型 AI とツール連携の実装",
    topic: "エージェントの本番運用（AgentCore）",
    guide: "svc-agentcore",
    services: ["Amazon Bedrock AgentCore Runtime", "AgentCore Gateway", "AgentCore Identity", "AWS Lambda", "Amazon Cognito"],
    question:
      "ある企業は、オープンソースのフレームワーク（LangGraph）で開発した調査エージェントを本番運用したい。要件は次のとおり。(1) 1回の調査が最長で数時間かかる。(2) 利用者ごとにセッションを完全に分離する。(3) 社内の REST API と既存の Lambda 関数を、MCP 対応ツールとしてエージェントから使えるようにする。(4) 利用者の代わりに外部 SaaS へ OAuth でアクセスする。エージェントのコードの書き換えを最小限にしたい。最も適切な構成はどれですか。",
    choices: [
      "エージェントを Lambda にデプロイして API Gateway から同期で呼び出し、ツールは Lambda から直接呼ぶ。SaaS のトークンは共通のものを Secrets Manager に保存する",
      "エージェントを Bedrock Agents で作り直し、社内 API と Lambda をアクション グループの OpenAPI スキーマとして定義し、SaaS の資格情報はセッション属性で渡す",
      "AgentCore Runtime で動かし、API と Lambda を AgentCore Gateway で MCP ツール化、OAuth 委任は AgentCore Identity で管理する",
      "エージェントを ECS on Fargate の長時間稼働タスク 1 つで動かし、全利用者の会話状態をタスクのメモリで管理して、SaaS へは利用者ごとの API キーで接続する"
    ],
    answer: [2],
    why: [
      "Lambda は最大 15 分で止まるため数時間の調査を完走できず、共通トークンでは利用者本人の権限で SaaS にアクセスできない。長時間実行とセッション分離、利用者ごとの OAuth 委任を備えた実行基盤を使う。",
      "動かすことはできるが、既存の LangGraph のコードとツール定義を Bedrock Agents 向けに作り直すことになり、書き換えを最小にする要件に反する。既存フレームワークのまま載せられる基盤を選ぶ。",
      "正解。AgentCore Runtime はフレームワークを問わずエージェントをホストでき、セッションを分離して長時間（既定で最大 8 時間）実行できる。Gateway は API や Lambda を MCP 対応ツールに変換し、Identity は Cognito などの IdP と連携して受信認証と外部サービスへの資格情報を管理する。",
      "全利用者の会話状態が 1 つのプロセスに混在してセッションが分離されず、タスクが落ちると全員の調査が失われる単一障害点になる。セッションごとに分離された実行環境で動かす。"
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
    wa: "GENSEC05-BP01",
    domain: 2,
    task: "2.1 エージェント型 AI とツール連携の実装",
    topic: "エージェントのアクション制御",
    guide: "svc-agents",
    services: ["Amazon Bedrock Agents", "AWS Lambda", "Amazon DynamoDB", "Amazon Bedrock Guardrails"],
    question:
      "EC 事業者が Amazon Bedrock Agents で顧客サポートエージェントを構築している。アクション グループには、注文照会と返金処理の Lambda 関数（注文データは Amazon DynamoDB）を登録している。返金処理だけは、実行前に必ず顧客本人の明示的な同意を得る必要がある。また、悪意のあるプロンプトによって返金が勝手に実行されるリスクを下げたい。追加のカスタムコードを最小にしつつ、最も確実な方法はどれですか。",
    choices: [
      "エージェントの指示（instruction）に、返金の前には必ず注文内容と金額を顧客に提示し、明示的な同意を得てから実行するよう記載する",
      "Bedrock Guardrails の拒否トピックに「返金」を登録し、プロンプト攻撃フィルタの強度を HIGH にして、悪意のある返金依頼を入力時に止める",
      "注文照会と返金処理を別のエージェントに分け、返金エージェントには推論性能の高いモデルを使い、スーパーバイザーエージェントで振り分ける",
      "返金関数に requireConfirmation を ENABLED で設定し、実行前に顧客の確認を求め、結果を次の InvokeAgent で返す"
    ],
    answer: [3],
    why: [
      "指示は多くの場合守られるが、モデルの判断に任せるため確認が飛ばされることがあり、悪意のあるプロンプトで指示自体を上書きされうる。重要な操作の確認はモデルの外の仕組みで必ず挟む。",
      "「返金」の話題そのものを拒否するため、正当な返金依頼まで止まり業務が成り立たない。必要な機能は残したまま、実行の直前に本人の確認を必須にして不正な実行を防ぐ。",
      "エージェントを分けて高性能なモデルにしても、返金前の同意確認がモデル任せである点は変わらず、必ず確認される保証にならない。確認は推論の質ではなく実行フローの仕組みで強制する。",
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
    wa: "GENCOST02-BP01",
    domain: 4,
    task: "4.1 コスト最適化",
    topic: "推論コストの最適化",
    guide: "decide",
    services: ["Amazon Bedrock バッチ推論", "Amazon Bedrock プロンプトキャッシュ", "Amazon S3", "Amazon EventBridge"],
    question:
      "コールセンターを運営する企業が Amazon Bedrock を使っている。【夜間要約】 毎晩、その日の通話記録 約 20 万件を要約し、翌朝 9 時までに結果を S3 に出せばよい。【日中チャット】 日中は、オペレーター支援チャットで毎回同じ約 5,000 トークンの業務マニュアルをプロンプトの先頭に付けて質問している。品質を変えずにコストを下げたい。適切な施策を 2 つ選んでください。",
    choices: [
      "夜間要約を、S3 上の JSONL を入力にしたバッチ推論ジョブに切り替え、EventBridge のスケジュールで毎晩起動する",
      "夜間要約のために Provisioned Throughput を購入してモデルユニットを 24 時間確保し、オンデマンドのクォータに左右されないようにする",
      "日中チャットで、共通のマニュアル部分の直後にキャッシュチェックポイントを置き、プロンプトキャッシュを有効にする",
      "日中チャットで、マニュアルを毎回送る代わりに maxTokens を大きくし、モデルが一般知識から詳しい回答を生成できるようにする",
      "夜間要約を、SQS と Lambda で 1 件ずつオンデマンド推論する構成に変え、Lambda の同時実行数を上げて処理時間を短くする"
    ],
    answer: [0, 2],
    why: [
      "正解。遅延が許容される大量処理にはバッチ推論が適しており、対象モデルではオンデマンドより 50% 安い料金で利用できる。",
      "夜間の数時間しか使わない要約のためにモデルユニットを 24 時間確保すると、使わない日中も課金されてかえって高くなる。期限に余裕のある大量処理は、割安なバッチ推論で必要なときだけ回す。",
      "正解。毎回繰り返す長いプレフィックスをキャッシュすると、キャッシュされたトークンは割引料金になり、レイテンシも短くなる。",
      "マニュアルを外すと回答の根拠がなくなって品質が落ち、maxTokens を増やせば出力トークンも増えてコストは上がる。同じ前置きの重複はプロンプトキャッシュで再利用して入力コストを下げる。",
      "1 件ずつのオンデマンド推論では単価が変わらずコストは下がらず、同時実行を上げるとスロットリングも起きやすい。翌朝までに出せばよい大量処理は、割安なバッチ推論に任せる。"
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
    wa: "GENPERF04-BP01",
    domain: 1,
    task: "1.3 データの検証と処理パイプライン / 1.4 ベクトルストア",
    topic: "RAG のデータ取り込み（解析・チャンキング）",
    guide: "svc-kb",
    services: ["Amazon Bedrock Knowledge Bases", "Amazon S3", "Amazon EventBridge", "AWS Lambda"],
    question:
      "製造業の企業が、数百ページある保守マニュアル（PDF）を Amazon Bedrock Knowledge Bases に取り込んでいる。マニュアルには部品表などの複雑な表や図が多く、既定の設定では表の内容に関する質問への回答精度が低い。また、手順の一部だけが検索されて前後の文脈が欠けた回答になることが多い。マニュアルは S3 上で毎日数件更新される。最も効果的な改善策の組み合わせはどれですか。",
    choices: [
      "チャンクの設定は既定のまま取得件数（numberOfResults）を最大にし、マニュアルの更新時はナレッジベースを毎晩削除して作り直す",
      "PDF をすべて画像に変換してから取り込み、固定サイズチャンキングのトークン数を 50 に縮めて、検索でヒットする箇所を増やす",
      "表や図は基盤モデルによる解析、文脈は階層チャンキングで補い、S3 の更新時に StartIngestionJob で増分同期する",
      "Amazon Comprehend でマニュアルからキーフレーズとエンティティを抽出し、その結果だけをテキストにしてナレッジベースに取り込む"
    ],
    answer: [2],
    why: [
      "取得件数を増やしても表の解析精度は上がらず、無関係なチャンクが増えて回答の質とコストが悪化する。毎晩の全件作り直しも無駄が大きく、表は解析方法、文脈はチャンキング、更新は増分同期で直す。",
      "画像にしても表の構造は読み取りやすくならず、50 トークンの小さなチャンクでは手順の前後がさらに切れて文脈の欠落が悪化する。表は構造を理解できる解析方法で、文脈は階層的なチャンクで補う。",
      "正解。基盤モデルによる解析は表や図を含む資料からテキストや説明を抽出できる。階層チャンキングは子チャンクで精度良く検索し、より広い親チャンクに置き換えて返すため文脈が保たれる。同期は追加・変更・削除された文書だけを処理する。",
      "キーフレーズやエンティティだけを残すと、回答に必要な手順の流れや部品表の数値が失われる。元の内容を保ったまま、表や図を正しく解析して取り込む方法を選ぶ。"
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
    wa: "GENSEC01-BP02",
    domain: 3,
    task: "3.2 データセキュリティとプライバシー / 3.3 ガバナンスとコンプライアンス",
    topic: "閉域接続と監査ログ",
    guide: "svc-privatelink",
    services: ["AWS PrivateLink（インターフェイス VPC エンドポイント）", "Amazon Bedrock モデル呼び出しログ", "AWS KMS", "Amazon S3", "AWS CloudTrail"],
    question:
      "金融機関が、VPC 内の Amazon ECS で動くアプリケーションから Amazon Bedrock を利用する。セキュリティ部門の要件は、(1) 通信がインターネットを経由しないこと、(2) すべてのプロンプトと応答の本文を監査用に 7 年間保存すること、(3) 保存データは自社管理の鍵で暗号化すること、(4) 誰がどのモデルを呼び出したかの API 操作履歴を残すこと、である。最も適切な構成はどれですか。",
    choices: [
      "NAT ゲートウェイ経由で Bedrock に接続してセキュリティグループで送信先を制限し、CloudTrail のデータイベントでプロンプトと応答を 7 年保存する",
      "bedrock-runtime の VPC エンドポイントで接続し、呼び出しログを KMS 暗号化した S3 に 7 年保持、API 操作は CloudTrail で記録する",
      "アプリでプロンプトと応答を CloudWatch Logs に出力して保持期間を無期限にし、Bedrock のパブリックエンドポイントへは TLS 1.2 以上で暗号化して接続する",
      "VPC ピアリングで Bedrock のサービス VPC と接続し、Amazon Macie でプロンプトを分類してから、機密度に応じて S3 Glacier に保存する"
    ],
    answer: [1],
    why: [
      "NAT ゲートウェイ経由ではインターネット側の経路を通るため要件 (1) を満たさず、CloudTrail は API 操作を記録するだけでプロンプトや応答の本文は残らない。本文は Bedrock の呼び出しログで保存する。",
      "正解。インターフェイス VPC エンドポイント（PrivateLink）でプライベートに接続でき、モデル呼び出しログで入出力の本文を S3 / CloudWatch Logs に記録できる。KMS キーで暗号化し、API 操作は CloudTrail で追跡する。",
      "パブリックエンドポイントへの接続はインターネットを経由し、アプリ任せのログは出力漏れが起きうるうえ自社管理の鍵での暗号化もない。プライベート接続とサービス側の呼び出しログ、KMS 暗号化を組み合わせる。",
      "Bedrock への閉域接続は VPC ピアリングではなく VPC エンドポイントで行う。Macie は S3 上の機密データを検出するサービスで、プロンプトと応答を取得して保存する手段にはならない。"
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
    wa: "GENOPS01-BP01",
    domain: 5,
    task: "5.1 生成 AI の評価の仕組みの実装",
    topic: "RAG の評価と品質ゲート",
    guide: "svc-eval",
    services: ["Amazon Bedrock Evaluations", "Amazon Bedrock Knowledge Bases", "Amazon S3", "AWS CodePipeline / CodeBuild"],
    question:
      "社内ヘルプデスク向け RAG を運用しているチームが、チャンキング方式と生成モデルの変更を検討している。変更のたびに (1) 検索結果が質問に関連しているか、(2) 回答が正しく、検索した文書に忠実か（ハルシネーションがないか）を自動で評価し、基準を下回る変更は本番に出さないようにしたい。評価のための大規模な人手は用意できない。最も適切な方法はどれですか。",
    choices: [
      "本番リリース後に CloudWatch で InvocationLatency と Invocations を監視し、利用者からの低評価が増えたら前のバージョンにロールバックする",
      "変更のたびに SageMaker Ground Truth で人手の評価ジョブを作り、評価者の平均点が前の版を上回った場合だけ本番に出す",
      "正解付きの質問セットで Bedrock のナレッジベース評価（検索のみ、検索と生成）を実行し、CodePipeline でしきい値未満のデプロイを止める",
      "公開されているベンチマークデータセットで生成モデル単体の自動評価（ROUGE、BERTScore など）を行い、スコアが高いモデルを採用する"
    ],
    answer: [2],
    why: [
      "レイテンシや呼び出し回数では回答の正しさや根拠への忠実さはわからず、品質の低い変更が本番に出てから気づくことになる。リリース前に評価データセットで品質を測り、基準未満は止める。",
      "人手の評価ジョブは有効だが、変更のたびに多数の評価者を確保するのは大規模な人手を用意できない条件に反し、自動の品質ゲートにならない。正解付きの質問セットで自動評価し、しきい値で判定する。",
      "正解。ナレッジベース評価には「検索のみ」と「検索と生成」の 2 種類があり、評価用モデル（LLM-as-a-judge）が Context relevance / coverage、Correctness、Faithfulness などを算出する。パイプラインの品質ゲートにすれば回帰を防げる。",
      "公開ベンチマークで生成モデル単体を測っても、検索結果の関連性は評価できず、社内文書での性能もわからない。実際のデータに近い評価セットで、検索と生成をあわせて評価する。"
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
    wa: "GENOPS02-BP03",
    domain: 5,
    task: "5.2 生成 AI アプリケーションのトラブルシューティング / 4.2 パフォーマンス",
    topic: "スロットリング対策",
    guide: "svc-bedrock",
    services: ["Amazon Bedrock クロスリージョン推論", "Amazon SQS", "AWS Lambda", "Amazon CloudWatch"],
    question:
      "小売企業の商品説明生成アプリは、Amazon Bedrock をオンデマンドで呼び出している。セール前の夕方に、管理画面からの一括生成リクエストが集中し、ThrottlingException（HTTP 429）が多発して処理が失敗する。CloudWatch の InvocationThrottles メトリクスも同じ時間帯に増えている。データの処理リージョンは米国内であれば問題ない。根本的に失敗を減らす施策を 2 つ選んでください。",
    choices: [
      "一括生成を SQS に入れて Lambda で順に処理し、ThrottlingException はジッター付き指数バックオフで再試行する",
      "呼び出し元 Lambda の予約済み同時実行数を増やし、セール前の時間帯は、より多くのリクエストを並列で Bedrock に送れるようにしておく",
      "モデル ID の代わりに米国のクロスリージョン推論プロファイルを指定して呼び出し、米国内の複数リージョンの処理能力を使う",
      "SDK の自動再試行を無効にして 429 をすぐ管理画面に返し、画面に再実行ボタンを表示して失敗した生成をやり直せるようにする",
      "モデルのパラメータ temperature を 0 にし、top_p も下げて出力のばらつきを抑えることで、1 件あたりの生成を速くする"
    ],
    answer: [0, 2],
    why: [
      "正解。429 はクォータ超過を示すため、ジッター付きの指数バックオフで再試行するのが推奨。急な集中は SQS で平準化すると、すぐに結果が不要な一括処理に適している。",
      "同時実行数を増やすと Bedrock への同時リクエストがさらに増え、クォータを超えてスロットリングが悪化する。急増する要求はキューで平準化し、処理能力に合わせて流す。",
      "正解。クロスリージョン推論は、データの所在要件が許す範囲で複数リージョンの処理能力に分散し、急なトラフィックに対応しやすくする。",
      "再試行をやめると一時的なスロットリングまで失敗として画面に返り、再実行の操作が増えるだけで失敗は減らない。一時的なエラーはバックオフ付きの再試行で自動回復させる。",
      "temperature や top_p は出力のばらつきを決める設定で、リクエスト数やトークン数のクォータには影響せず、スロットリングは減らない。要求の平準化や処理能力の拡大で対処する。"
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
    wa: "GENSUS01-BP01",
    domain: 2,
    task: "2.4 基盤モデル API の統合 / 2.5 アプリケーション統合パターン",
    topic: "ストリーミング応答と会話履歴",
    guide: "svc-apigw",
    services: ["Amazon API Gateway（WebSocket API）", "AWS Lambda", "Amazon Bedrock（ConverseStream）", "Amazon DynamoDB", "Amazon Cognito"],
    question:
      "スタートアップ企業が、ブラウザ向けの AI アシスタントを開発している。要件は、(1) 回答を生成しながら 1 文字ずつ画面に表示し、体感の待ち時間を短くする、(2) ログインした利用者ごとに会話履歴を保持し、30 日経過した履歴は自動で削除する、(3) サーバーを管理しない、である。最も適切な構成はどれですか。",
    choices: [
      "REST API から Lambda を同期で呼び、InvokeModel で回答全体を生成してから返す。会話履歴は Lambda の /tmp に利用者 ID ごとのファイルで保存する",
      "Lambda が生成した回答全文を S3 に書き込み、ブラウザが数秒ごとにポーリングして表示する。会話履歴は S3 の利用者ごとのテキストファイルに追記していく",
      "EC2 上に WebSocket サーバーを構築して回答を逐次送信し、会話履歴はインスタンスのメモリに保持して、30 日ごとにプロセスを再起動して消す",
      "WebSocket API と Lambda で ConverseStream の差分を順次送り、Cognito で接続を認証し、履歴は DynamoDB の TTL で消す"
    ],
    answer: [3],
    why: [
      "回答全体の生成を待ってから返すため 1 文字ずつ表示できず、REST API の統合タイムアウトにも当たりやすい。/tmp は実行環境ごとの一時領域で消えるため、履歴は永続的なストアに保存する。",
      "数秒ごとのポーリングでは生成中の逐次表示にならず、無駄なリクエストも増える。テキストファイルへの追記では 30 日後の自動削除もできず、ストリーミング応答と TTL のあるストアを使う。",
      "EC2 上の WebSocket サーバーはサーバー管理が必要で要件 (3) に反し、メモリ上の履歴は障害や停止で消える。マネージドな WebSocket API と、TTL で自動削除できるデータベースを使う。",
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
]);
