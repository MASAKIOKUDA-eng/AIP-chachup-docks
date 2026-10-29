// アーキテクチャの構成を問う問題になっているかの目安: node tools/lint-architecture.js [回]
// 選択肢に、業務の運用や組織の判断（手作業、周知、利用をやめる など）を表す言い回しがあるものを表示する。
// 機械的な目安なので、表示されたものは人が読んで判断する（エラーにはしない）
var fs = require("fs"), path = require("path");
var root = path.join(__dirname, "..");
var set = process.argv[2];
global.window = {};
eval(fs.readFileSync(path.join(root, "data", "meta.js"), "utf8"));
global.addQuestions = window.addQuestions;
fs.readdirSync(path.join(root, "data")).filter(function (f) {
  return /^set\d+-[a-z]\.js$/.test(f) && (!set || f.indexOf("set" + set + "-") === 0);
}).sort().forEach(function (f) { eval(fs.readFileSync(path.join(root, "data", f), "utf8")); });
var re = /担当者|手作業|手で|社員に|利用者に|周知|通知して|研修|教育|規程|契約|待つ|やめ|廃止|停止して|使わない|しない(ことに|ように)|任せ|お願い|依頼|会議|承認を得|読んでもらう|確認してもらう|使ってもらう|ことにする|受け付けない|諦め|見送/;
var n = 0;
window.QUESTIONS.forEach(function (q) {
  var hits = q.choices.filter(function (c) { return re.test(c); });
  if (!hits.length) return;
  n++;
  console.log(q.id + "\n" + hits.map(function (c) { return "  - " + c; }).join("\n"));
});
console.log(n + " 問に、業務の判断のように見える選択肢があります（目安）");
