// 問題データの検査: node tools/check-questions.js [--partial]
// ・各回が 75 問で、試験分野の配分が配点どおりか（--partial のときは作成途中として省略）
// ・各回で Well-Architected Generative AI Lens のベストプラクティスをすべて扱っているか（--partial のときは省略）
// ・選択肢と理由の数、正解の番号、ベストプラクティス ID、参照ドキュメントのキーが正しいか
// ・正解の選択肢が「一番長い」ことで見抜けてしまわないか
// ・問題文の重複や、ほぼ同じ内容の問題がないか
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var partial = process.argv.indexOf("--partial") >= 0;

global.window = {};
eval(fs.readFileSync(path.join(root, "data", "meta.js"), "utf8"));
global.addQuestions = window.addQuestions;
fs.readdirSync(path.join(root, "data")).filter(function (f) { return /^set\d+-[a-z]\.js$/.test(f); }).sort().forEach(function (f) {
  eval(fs.readFileSync(path.join(root, "data", f), "utf8"));
});

var errors = [];
function err(id, msg) { errors.push(id + ": " + msg); }

window.QUESTIONS.forEach(function (q) {
  var len = q.choices.map(function (c) { return c.length; });
  var max = Math.max.apply(null, len);
  if (!q.why || q.why.length !== q.choices.length) err(q.id, "why の数が choices と一致しません");
  if (!q.topic) err(q.id, "topic がありません");
  if (!window.DOMAINS[q.domain]) err(q.id, "domain が不正です");
  if (!window.WA[q.wa]) err(q.id, "wa（ベストプラクティス ID）が不正です: " + q.wa);
  if (q.choices.length < 4) err(q.id, "選択肢が 4 つ未満です");
  if (q.answer.length > 1 && q.choices.length < 5) err(q.id, "複数選択の問題は選択肢を 5 つ以上にします");
  if (q.answer.some(function (i) { return i >= q.choices.length; })) err(q.id, "answer の番号が範囲外です");
  // 正解が他のどの選択肢よりも長い（同じ長さは可）と、長さで見抜けてしまう
  var others = len.filter(function (_, i) { return q.answer.indexOf(i) < 0; });
  var maxOther = Math.max.apply(null, others);
  if (q.answer.some(function (i) { return len[i] > maxOther; })) err(q.id, "正解が一番長い選択肢です（長さ " + len.join(", ") + "）");
  if (!q.evidence.length && !q.ref.length) err(q.id, "根拠のドキュメント（ref / evidence）がありません");
  q.ref.forEach(function (k) { if (!window.DOCS[k]) err(q.id, "ref のキーが DOCS にありません: " + k); });
  if (new Set(q.choices).size !== q.choices.length) err(q.id, "同じ選択肢があります");
});

// 重複・類似の検出（問題文の文字 3-gram の Jaccard 係数）
function grams(s) {
  var g = new Set();
  s = s.replace(/\s+/g, "");
  for (var i = 0; i < s.length - 2; i++) g.add(s.slice(i, i + 3));
  return g;
}
var gs = window.QUESTIONS.map(function (q) { return grams(q.question); });
for (var i = 0; i < gs.length; i++) {
  for (var j = i + 1; j < gs.length; j++) {
    var inter = 0;
    gs[i].forEach(function (x) { if (gs[j].has(x)) inter++; });
    var jac = inter / (gs[i].size + gs[j].size - inter);
    if (jac >= 0.45) err(window.QUESTIONS[i].id, window.QUESTIONS[j].id + " と問題文が似すぎています（" + jac.toFixed(2) + "）");
  }
}

// 各回の構成
var summary = [];
for (var s = 1; s <= window.SET_COUNT; s++) {
  var list = window.QUESTIONS.filter(function (q) { return q.set === s; });
  if (!list.length) continue;
  var byDom = {};
  list.forEach(function (q) { byDom[q.domain] = (byDom[q.domain] || 0) + 1; });
  var used = new Set(list.map(function (q) { return q.wa; }));
  var missing = Object.keys(window.WA).filter(function (k) { return !used.has(k); });
  var multi = list.filter(function (q) { return q.answer.length > 1; }).length;
  // 正解が一番短い選択肢になっている割合（高すぎると、短いものを選べば当たってしまう）
  var shortest = list.filter(function (q) {
    var len = q.choices.map(function (c) { return c.length; });
    var minOther = Math.min.apply(null, len.filter(function (_, i) { return q.answer.indexOf(i) < 0; }));
    return q.answer.every(function (i) { return len[i] < minOther; });
  }).length;
  if (list.length >= 20 && shortest / list.length > 0.35) err("第" + s + "回", "正解が一番短い選択肢になっている問題が " + shortest + " 問あり、多すぎます");
  summary.push("第" + s + "回: " + list.length + " 問 / 分野 " + [1, 2, 3, 4, 5].map(function (d) { return byDom[d] || 0; }).join("-") +
    " / 複数選択 " + multi + " / 正解が最短 " + shortest + " / 未使用のベストプラクティス " + missing.length);
  if (!partial) {
    if (list.length !== window.SET_SIZE) err("第" + s + "回", "問題数が " + list.length + " です（" + window.SET_SIZE + " 問にします）");
    Object.keys(window.DOMAINS).forEach(function (d) {
      if ((byDom[d] || 0) !== window.DOMAINS[d].perSet) err("第" + s + "回", "第" + d + "分野が " + (byDom[d] || 0) + " 問です（" + window.DOMAINS[d].perSet + " 問にします）");
    });
    if (missing.length) err("第" + s + "回", "扱っていないベストプラクティス: " + missing.join(", "));
  }
}

console.log(summary.join("\n"));
if (errors.length) { console.log(errors.join("\n")); console.log(errors.length + " 件の問題があります"); process.exit(1); }
console.log("OK: " + window.QUESTIONS.length + " 問");
