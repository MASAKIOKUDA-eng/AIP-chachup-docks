// 正解が一番短い選択肢になっている問題のうち、差が小さいものを表示する: node tools/near-shortest.js <回>
var fs = require("fs"), path = require("path");
global.window = {};
eval(fs.readFileSync(path.join(__dirname, "..", "data", "meta.js"), "utf8"));
global.addQuestions = window.addQuestions;
var set = process.argv[2];
fs.readdirSync(path.join(__dirname, "..", "data")).filter(function (f) { return new RegExp("^set" + set + "-[a-z]\\.js$").test(f); }).sort()
  .forEach(function (f) { eval(fs.readFileSync(path.join(__dirname, "..", "data", f), "utf8")); });
window.QUESTIONS.forEach(function (q) {
  var L = q.choices.map(function (c) { return c.length; });
  var others = L.map(function (_, i) { return i; }).filter(function (i) { return q.answer.indexOf(i) < 0; });
  var minO = Math.min.apply(null, others.map(function (i) { return L[i]; }));
  var maxC = Math.max.apply(null, q.answer.map(function (i) { return L[i]; }));
  if (maxC < minO) {
    var j = others.filter(function (i) { return L[i] === minO; })[0];
    console.log(q.id + " 正解 " + maxC + " / 最短の誤答 " + minO + " : " + q.choices[j]);
  }
});
