// 指定した問題の選択肢と文字数を表示する: node tools/show-choices.js 1-38 1-42 ...
var fs = require("fs"), path = require("path");
global.window = {};
eval(fs.readFileSync(path.join(__dirname, "..", "data", "meta.js"), "utf8"));
global.addQuestions = window.addQuestions;
fs.readdirSync(path.join(__dirname, "..", "data")).filter(function (f) { return /^set\d+-[a-z]\.js$/.test(f); }).sort()
  .forEach(function (f) { eval(fs.readFileSync(path.join(__dirname, "..", "data", f), "utf8")); });
process.argv.slice(2).forEach(function (id) {
  var q = window.QUESTIONS.find(function (x) { return x.id === id; });
  if (!q) return console.log(id + ": なし");
  console.log(id);
  q.choices.forEach(function (c, i) { console.log("  " + (q.answer.indexOf(i) >= 0 ? "*" : " ") + " " + c.length + " " + c); });
});
