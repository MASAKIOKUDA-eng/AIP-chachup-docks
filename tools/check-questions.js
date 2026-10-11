// 問題データの検査: node tools/check-questions.js
// ・選択肢と正誤理由の数が一致しているか
// ・正解の選択肢が「一番長い」ことで見抜けてしまわないか
var fs = require("fs");
var path = require("path");
global.window = {};
eval(fs.readFileSync(path.join(__dirname, "..", "data", "questions.js"), "utf8"));

var errors = 0;
window.QUESTIONS.forEach(function (q) {
  var len = q.choices.map(function (c) { return c.length; });
  var max = Math.max.apply(null, len);
  var problems = [];
  if (q.why.length !== q.choices.length) problems.push("why の数が choices と一致しません");
  if (!q.topic) problems.push("topic がありません");
  if (q.answer.some(function (i) { return i >= q.choices.length; })) problems.push("answer の番号が範囲外です");
  if (q.answer.some(function (i) { return len[i] === max; })) problems.push("正解が一番長い選択肢です");
  if (problems.length) { errors += 1; console.log(q.id + ": " + problems.join(" / ") + "（長さ " + len.join(", ") + "）"); }
});
console.log(errors ? errors + " 件の問題があります" : "OK: " + window.QUESTIONS.length + " 問");
process.exit(errors ? 1 : 0);
