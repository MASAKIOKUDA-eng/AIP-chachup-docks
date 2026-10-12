// 試験の分野、Well-Architected のベストプラクティス、参照ドキュメント、問題の登録関数
window.DOMAINS = {
  1: { name: "基盤モデルの統合、データ管理、コンプライアンス", weight: 31, perSet: 23 },
  2: { name: "実装と統合", weight: 26, perSet: 20 },
  3: { name: "AI の安全性、セキュリティ、ガバナンス", weight: 20, perSet: 15 },
  4: { name: "生成 AI アプリケーションの運用効率と最適化", weight: 12, perSet: 9 },
  5: { name: "テスト、検証、トラブルシューティング", weight: 11, perSet: 8 }
};
window.SET_COUNT = 6;
window.SET_SIZE = 75;

// AWS Well-Architected Framework Generative AI Lens のベストプラクティス
window.PILLARS = {
  OPS: "運用上の優秀性", SEC: "セキュリティ", REL: "信頼性",
  PERF: "パフォーマンス効率", COST: "コスト最適化", SUS: "持続可能性"
};
window.WA = {
  "GENOPS01-BP01": ["OPS", "機能面の性能を定期的に評価する"],
  "GENOPS01-BP02": ["OPS", "利用者のフィードバックを収集して監視する"],
  "GENOPS02-BP01": ["OPS", "アプリケーションのすべての層を監視する"],
  "GENOPS02-BP02": ["OPS", "基盤モデルのメトリクスを監視する"],
  "GENOPS02-BP03": ["OPS", "システムの過負荷のリスクを軽減する仕組みを実装する"],
  "GENOPS03-BP01": ["OPS", "プロンプトテンプレートを管理する"],
  "GENOPS03-BP02": ["OPS", "エージェントと RAG のワークフローのトレースを有効にする"],
  "GENOPS04-BP01": ["OPS", "生成 AI アプリケーションのライフサイクルを IaC で自動化する"],
  "GENOPS04-BP02": ["OPS", "GenAIOps を実装してアプリケーションのライフサイクルを最適化する"],
  "GENOPS05-BP01": ["OPS", "モデルをカスタマイズすべき場面を見極める"],
  "GENSEC01-BP01": ["SEC", "基盤モデルのエンドポイントへのアクセスを最小権限にする"],
  "GENSEC01-BP02": ["SEC", "基盤モデルとアプリケーションの間をプライベートな通信にする"],
  "GENSEC01-BP03": ["SEC", "データストアにアクセスする基盤モデルの権限を最小にする"],
  "GENSEC01-BP04": ["SEC", "生成 AI サービスと基盤モデルへのアクセスを監視する"],
  "GENSEC02-BP01": ["SEC", "ガードレールで有害または誤ったモデルの応答を軽減する"],
  "GENSEC03-BP01": ["SEC", "コントロールプレーンとデータアクセスを監視する"],
  "GENSEC04-BP01": ["SEC", "安全なプロンプトカタログを実装する"],
  "GENSEC04-BP02": ["SEC", "基盤モデルへの利用者の入力を無害化し検証する"],
  "GENSEC05-BP01": ["SEC", "エージェントのワークフローに最小権限とアクセス許可の境界を設ける"],
  "GENSEC06-BP01": ["SEC", "モデルの学習ワークフローにデータの浄化フィルタを実装する"],
  "GENREL01-BP01": ["REL", "利用状況に応じて基盤モデルのスループットを拡張・分散する"],
  "GENREL02-BP01": ["REL", "モデルのエンドポイントと周辺基盤の間のネットワークを冗長化する"],
  "GENREL03-BP01": ["REL", "ロジックでプロンプトの流れを管理し、障害から適切に回復する"],
  "GENREL03-BP02": ["REL", "エージェントのワークフローにタイムアウトの仕組みを実装する"],
  "GENREL04-BP02": ["REL", "モデルカタログを実装する"],
  "GENREL05-BP01": ["REL", "利用可能なすべてのリージョンに推論リクエストを分散する"],
  "GENREL05-BP02": ["REL", "埋め込みデータを利用可能なすべてのリージョンに複製する"],
  "GENREL05-BP03": ["REL", "エージェントの機能がすべてのリージョンで利用できることを確認する"],
  "GENREL06-BP01": ["REL", "高性能な分散処理タスクを耐障害性のある設計にする"],
  "GENPERF01-BP01": ["PERF", "プロンプトと応答の正解データセットを定義する"],
  "GENPERF01-BP02": ["PERF", "生成 AI ワークロードの性能メトリクスを収集する"],
  "GENPERF02-BP01": ["PERF", "モデルのエンドポイントを負荷試験する"],
  "GENPERF02-BP02": ["PERF", "推論パラメータを最適化して応答の品質を高める"],
  "GENPERF02-BP03": ["PERF", "用途に合ったモデルを選び、カスタマイズする"],
  "GENPERF03-BP01": ["PERF", "モデルのホスティング、カスタマイズ、データアクセスにマネージドなサービスを使う"],
  "GENPERF04-BP01": ["PERF", "ベクトル埋め込みをレイテンシと関連性の観点でテストする"],
  "GENPERF04-BP02": ["PERF", "用途に合わせてベクトルのサイズを最適化する"],
  "GENCOST01-BP01": ["COST", "推論コストを最適化するようにモデルを適正なサイズで選ぶ"],
  "GENCOST02-BP01": ["COST", "推論方式を選ぶときにコストと性能のバランスを取る"],
  "GENCOST02-BP02": ["COST", "リソースの消費を最適化してホスティングのコストを最小にする"],
  "GENCOST03-BP01": ["COST", "プロンプトのトークン数を最適化する"],
  "GENCOST03-BP02": ["COST", "モデルの応答の長さを制御する"],
  "GENCOST03-BP03": ["COST", "プロンプトキャッシュでトークンのコストを下げる"],
  "GENCOST03-BP04": ["COST", "利用者の入力に注釈を付けてコストを考慮したコンテンツフィルタリングにする"],
  "GENCOST04-BP01": ["COST", "埋め込みのベクトル長を短くする"],
  "GENCOST05-BP01": ["COST", "長時間実行されるワークフローに停止条件を設ける"],
  "GENSUS01-BP01": ["SUS", "オートスケーリングとサーバーレスでリソースの利用効率を高める"],
  "GENSUS01-BP02": ["SUS", "効率的なモデルカスタマイズのサービスを使う"],
  "GENSUS02-BP01": ["SUS", "データの処理と保存を最適化してエネルギー消費を抑える"],
  "GENSUS03-BP01": ["SUS", "小さなモデルと最適化された推論手法で環境負荷を下げる"]
};
window.waUrl = function (id) {
  return "https://docs.aws.amazon.com/ja_jp/wellarchitected/latest/generative-ai-lens/" + id.toLowerCase() + ".html";
};

// 参照ドキュメント（キー → [タイトル, URL]）。問題の ref でキーを指定する
(function () {
  var D = "https://docs.aws.amazon.com/ja_jp/";
  var B = D + "bedrock/latest/userguide/";
  var AC = D + "bedrock-agentcore/latest/devguide/";
  window.DOCS = {
    bedrock: ["Amazon Bedrock とは", B + "what-is-bedrock.html"],
    converse: ["Converse API による推論", B + "conversation-inference.html"],
    batch: ["バッチ推論", B + "batch-inference.html"],
    cris: ["クロスリージョン推論", B + "cross-region-inference.html"],
    caching: ["プロンプトキャッシュ", B + "prompt-caching.html"],
    routing: ["インテリジェントプロンプトルーティング", B + "prompt-routing.html"],
    pt: ["Provisioned Throughput", B + "prov-throughput.html"],
    profiles: ["推論プロファイル", B + "inference-profiles.html"],
    invlog: ["モデル呼び出しログ", B + "model-invocation-logging.html"],
    metrics: ["CloudWatch メトリクスで bedrock-runtime を監視する", B + "monitoring-runtime-metrics.html"],
    errors: ["Bedrock API エラーコードのトラブルシューティング", B + "troubleshooting-api-error-codes.html"],
    scaling: ["スケーリングとスループットのベストプラクティス", B + "scaling-throughput-best-practices.html"],
    vpce: ["インターフェイス VPC エンドポイント（PrivateLink）", B + "vpc-interface-endpoints.html"],
    iam: ["Amazon Bedrock の Identity and Access Management", B + "security-iam.html"],
    trail: ["CloudTrail による Bedrock API 呼び出しのログ", B + "logging-using-cloudtrail.html"],
    guardrails: ["Amazon Bedrock Guardrails", B + "guardrails.html"],
    grounding: ["コンテキストグラウンディングチェック", B + "guardrails-contextual-grounding-check.html"],
    applyGr: ["ApplyGuardrail API", B + "guardrails-use-independent-api.html"],
    kb: ["Amazon Bedrock Knowledge Bases", B + "knowledge-base.html"],
    kbMeta: ["ナレッジベースのメタデータとフィルタ", B + "kb-metadata.html"],
    kbChunk: ["ナレッジベースのチャンキング", B + "kb-chunking.html"],
    kbSync: ["ナレッジベースのデータ同期", B + "kb-data-source-sync-ingest.html"],
    kbQuery: ["ナレッジベースのクエリとレスポンス生成の設定", B + "kb-test-config.html"],
    agents: ["Amazon Bedrock Agents", B + "agents.html"],
    agentsHow: ["Amazon Bedrock Agents の仕組み", B + "agents-how.html"],
    confirm: ["アクション グループの実行前にユーザーの確認を得る", B + "agents-userconfirmation.html"],
    roc: ["アクションのフルフィルメント（Return of Control）", B + "action-handle.html"],
    promptMgmt: ["Prompt Management", B + "prompt-management.html"],
    flows: ["Amazon Bedrock Flows", B + "flows.html"],
    customize: ["モデルのカスタマイズ", B + "custom-models.html"],
    evalMetrics: ["モデル評価のメトリクス", B + "model-evaluation-metrics.html"],
    ragMetrics: ["RAG 評価のメトリクス", B + "knowledge-base-evaluation-metrics.html"],
    ragEval: ["検索と生成の RAG 評価ジョブ", B + "knowledge-base-evaluation-create-randg.html"],
    agentcore: ["Amazon Bedrock AgentCore とは", AC + "what-is-bedrock-agentcore.html"],
    acLimits: ["AgentCore のクォータ", AC + "bedrock-agentcore-limits.html"],
    acIdentity: ["AgentCore Identity", AC + "identity.html"],
    acSessions: ["AgentCore Runtime のセッション分離", AC + "runtime-sessions.html"],
    acObs: ["AgentCore のオブザーバビリティ", AC + "observability-configure.html"],
    acVpc: ["AgentCore の VPC 構成", AC + "agentcore-vpc.html"],
    sagemaker: ["Amazon SageMaker AI とは", D + "sagemaker/latest/dg/whatis.html"],
    smAsync: ["SageMaker AI 非同期推論", D + "sagemaker/latest/dg/async-inference.html"],
    smScaling: ["SageMaker AI エンドポイントの自動スケーリング", D + "sagemaker/latest/dg/endpoint-auto-scaling.html"],
    smMonitor: ["SageMaker Model Monitor", D + "sagemaker/latest/dg/model-monitor.html"],
    a2i: ["Amazon Augmented AI（人によるレビュー）", D + "sagemaker/latest/dg/a2i-use-augmented-ai-a2i-human-review-loops.html"],
    bedrockOrSm: ["Bedrock と SageMaker AI の選択", D + "decision-guides/latest/decision-guides/bedrock-or-sagemaker.html"],
    aossVector: ["OpenSearch Serverless のベクトル検索", D + "opensearch-service/latest/developerguide/serverless-vector-search.html"],
    comprehendPii: ["Amazon Comprehend の PII 検出", D + "comprehend/latest/dg/how-pii.html"],
    textract: ["Amazon Textract とは", D + "textract/latest/dg/what-is.html"],
    sfn: ["Step Functions のサービス統合パターン", D + "step-functions/latest/dg/connect-to-resource.html"],
    lambdaLimits: ["Lambda のクォータ", D + "lambda/latest/dg/gettingstarted-limits.html"],
    wsApi: ["API Gateway の WebSocket API", D + "apigateway/latest/developerguide/apigateway-websocket-api.html"],
    apigwThrottle: ["API Gateway のスロットリング", D + "apigateway/latest/developerguide/api-gateway-request-throttling.html"],
    usagePlans: ["API Gateway の使用量プラン", D + "apigateway/latest/developerguide/api-gateway-api-usage-plans.html"],
    ddbTtl: ["DynamoDB の Time to Live（TTL）", D + "amazondynamodb/latest/developerguide/TTL.html"],
    kmsVpce: ["VPC エンドポイント経由で AWS KMS に接続する", D + "kms/latest/developerguide/kms-vpc-endpoint.html"],
    macie: ["Amazon Macie とは", D + "macie/latest/user/what-is-macie.html"],
    accessAnalyzer: ["IAM Access Analyzer", D + "IAM/latest/UserGuide/what-is-access-analyzer.html"],
    secrets: ["AWS Secrets Manager とは", D + "secretsmanager/latest/userguide/intro.html"],
    waf: ["AWS WAF", D + "waf/latest/developerguide/waf-chapter.html"],
    cwAnomaly: ["CloudWatch の異常検出", D + "AmazonCloudWatch/latest/monitoring/CloudWatch_Anomaly_Detection.html"],
    xray: ["AWS X-Ray とは", D + "xray/latest/devguide/aws-xray.html"],
    costAnomaly: ["AWS Cost Anomaly Detection", D + "cost-management/latest/userguide/manage-ad.html"],
    budgets: ["AWS Budgets", D + "cost-management/latest/userguide/budgets-managing-costs.html"],
    appconfig: ["AWS AppConfig とは", D + "appconfig/latest/userguide/what-is-appconfig.html"],
    sqs: ["Amazon SQS とは", D + "AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html"],
    eventbridge: ["Amazon EventBridge とは", D + "eventbridge/latest/userguide/eb-what-is.html"],
    s3Lifecycle: ["S3 のライフサイクル管理", D + "AmazonS3/latest/userguide/object-lifecycle-mgmt.html"],
    glueDq: ["AWS Glue Data Quality", D + "glue/latest/dg/glue-data-quality.html"],
    cfn: ["AWS CloudFormation とは", D + "AWSCloudFormation/latest/UserGuide/Welcome.html"],
    codepipeline: ["AWS CodePipeline とは", D + "codepipeline/latest/userguide/welcome.html"],
    qbusiness: ["Amazon Q Business とは", D + "amazonq/latest/qbusiness-ug/what-is.html"],
    ragOptions: ["規範ガイダンス：RAG の選択肢とアーキテクチャ", D + "prescriptive-guidance/latest/retrieval-augmented-generation-options/introduction.html"],
    genaiLens: ["Well-Architected Generative AI Lens", D + "wellarchitected/latest/generative-ai-lens/generative-ai-lens.html"]
  };
})();

window.QUESTIONS = [];

// 問題を登録する。短いキー（d, t, topic, svc, q, c, a, why, exp, wa, ref）で書ける。
//   d: 試験分野(1-5)  t: タスク  svc: 関連サービス  q: 問題文  c: 選択肢  a: 正解の index（数値か配列）
//   why: 選択肢ごとの理由  exp: 解説（Well-Architected に沿う理由を含める）  wa: ベストプラクティス ID
//   ref: DOCS のキーの配列  guide: アーキテクチャガイドの見出し ID（任意）
window.addQuestions = function (set, list) {
  var n = window.QUESTIONS.filter(function (x) { return x.set === set; }).length;
  list.forEach(function (o) {
    n += 1;
    var answer = o.answer || o.a;
    window.QUESTIONS.push({
      id: set + "-" + String(n).padStart(2, "0"),
      set: set,
      domain: o.domain || o.d,
      task: o.task || o.t,
      topic: o.topic,
      guide: o.guide,
      services: o.services || o.svc || [],
      question: o.question || o.q,
      choices: o.choices || o.c,
      answer: Array.isArray(answer) ? answer : [answer],
      why: o.why,
      explanation: o.explanation || o.exp,
      flow: o.flow || [],
      wa: o.wa,
      evidence: o.evidence || [],
      ref: o.ref || []
    });
  });
};
