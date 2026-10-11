// 問題集の出題・採点
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var LETTERS = "ABCDEFGH";
  var STORE = "aip-quiz-history";

  var state = { list: [], idx: 0, answers: {}, checked: {}, order: {} };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function loadHistory() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
  function saveHistory(h) { try { localStorage.setItem(STORE, JSON.stringify(h)); } catch (e) {} }
  function domainLabel(d) { return "第" + d + "分野　" + esc(window.DOMAINS[d].name); }
  function guideLink(q) {
    return q.guide ? '<a href="guide.html#' + encodeURIComponent(q.guide) + '">' + esc(q.topic) + " の解説（アーキテクチャガイド）</a>" : esc(q.topic);
  }
  // 根拠リンクは https のみ許可（データに javascript: などが混入しても実行されないように）
  function safeUrl(u) { return /^https:\/\//.test(u) ? u : "#"; }
  function isMulti(q) { return q.answer.length > 1; }
  function sameSet(a, b) { return a.length === b.length && a.slice().sort().join() === b.slice().sort().join(); }

  // ---- ホーム ----
  function renderHome() {
    var h = loadHistory();
    var box = $("domainFilter");
    var html = "";
    Object.keys(window.DOMAINS).forEach(function (d) {
      var n = window.QUESTIONS.filter(function (q) { return String(q.domain) === d; }).length;
      html += '<label><input type="checkbox" name="dom" value="' + d + '" checked> ' + domainLabel(d) + "（" + n + "問）</label>";
    });
    box.innerHTML = html;
    $("total").textContent = window.QUESTIONS.length;

    var rows = window.QUESTIONS.map(function (q) {
      var r = h[q.id];
      var mark = !r ? '<span class="muted">未回答</span>' : r.last ? '<span style="color:var(--ok)">○ 正解</span>' : '<span style="color:var(--ng)">× 不正解</span>';
      return "<tr><td>" + esc(q.id) + '</td><td class="small">' + domainLabel(q.domain) + "</td><td>" + esc(q.topic) + "</td><td>" + mark + "</td></tr>";
    }).join("");
    $("historyTable").innerHTML = "<table><thead><tr><th>問題</th><th>試験分野</th><th>知識分野</th><th>前回</th></tr></thead><tbody>" + rows + "</tbody></table>";
  }

  function start(onlyWrong) {
    var doms = Array.prototype.map.call(document.querySelectorAll("input[name=dom]:checked"), function (e) { return Number(e.value); });
    var h = loadHistory();
    var list = window.QUESTIONS.filter(function (q) {
      return doms.indexOf(q.domain) >= 0 && (!onlyWrong || (h[q.id] && !h[q.id].last));
    });
    if (!list.length) { alert(onlyWrong ? "間違えた問題はありません。" : "出題範囲を1つ以上選んでください。"); return; }
    if ($("shuffleQ").checked) list = shuffle(list);
    state = { list: list, idx: 0, answers: {}, checked: {}, order: {} };
    var shuffleC = $("shuffleC").checked;
    list.forEach(function (q) {
      var idxs = q.choices.map(function (_, i) { return i; });
      state.order[q.id] = shuffleC ? shuffle(idxs) : idxs;
    });
    show("quiz");
    renderQuestion();
  }

  function show(id) {
    ["home", "quiz", "result"].forEach(function (s) { $(s).hidden = s !== id; });
    window.scrollTo(0, 0);
  }

  // ---- 出題 ----
  function renderQuestion() {
    var q = state.list[state.idx];
    var order = state.order[q.id];
    var sel = state.answers[q.id] || [];
    var checked = !!state.checked[q.id];
    var multi = isMulti(q);

    $("qProgress").textContent = (state.idx + 1) + " / " + state.list.length + "（" + q.id + "）";
    $("bar").style.width = ((state.idx + 1) / state.list.length * 100) + "%";
    // 解答前から、どの分野・知識を問う問題かを示す
    $("qMeta").innerHTML =
      "<tr><th>試験分野</th><td>" + domainLabel(q.domain) + "（配点 " + window.DOMAINS[q.domain].weight + "%）</td></tr>" +
      "<tr><th>タスク</th><td>" + esc(q.task) + "</td></tr>" +
      "<tr><th>知識分野</th><td>" + esc(q.topic) + "</td></tr>" +
      "<tr><th>関連サービス</th><td>" + q.services.map(esc).join("、") + "</td></tr>";
    $("qText").textContent = q.question;
    $("qHint").textContent = multi ? "正しいものを " + q.answer.length + " つ選んでください。" : "最も適切なものを 1 つ選んでください。";

    var html = "";
    order.forEach(function (orig, pos) {
      var cls = "choice";
      var on = sel.indexOf(orig) >= 0;
      if (on) cls += " sel";
      if (checked) {
        if (q.answer.indexOf(orig) >= 0) cls += " correct";
        else if (on) cls += " wrong";
      }
      html += '<label class="' + cls + '"><input type="' + (multi ? "checkbox" : "radio") + '" name="c" value="' + orig + '"' +
        (on ? " checked" : "") + (checked ? " disabled" : "") + '><span class="label">' + LETTERS[pos] + "</span><span>" + esc(q.choices[orig]) +
        (checked ? '<span class="why">' + esc(q.why[orig]) + "</span>" : "") + "</span></label>";
    });
    $("choices").innerHTML = html;
    Array.prototype.forEach.call(document.querySelectorAll("#choices input"), function (inp) {
      inp.addEventListener("change", function () {
        var v = Number(inp.value);
        var cur = (state.answers[q.id] || []).slice();
        if (multi) {
          if (inp.checked) { if (cur.indexOf(v) < 0) cur.push(v); } else cur = cur.filter(function (x) { return x !== v; });
        } else cur = [v];
        state.answers[q.id] = cur;
        renderQuestion();
      });
    });

    var fb = $("feedback");
    if (checked) {
      var ok = sameSet(sel, q.answer);
      var correctLetters = order.map(function (o, p) { return q.answer.indexOf(o) >= 0 ? LETTERS[p] : null; }).filter(Boolean).join("・");
      fb.innerHTML =
        '<p class="result-line ' + (ok ? "ok" : "ng") + '">' + (ok ? "正解" : "不正解（正解は " + correctLetters + "）") + "</p>" +
        "<h3>解説</h3><p>" + esc(q.explanation) + "</p>" +
        "<h3>正解のアーキテクチャ（処理の流れ）</h3><ol class=\"flow\">" + q.flow.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ol>" +
        "<h3>根拠となる AWS ドキュメント</h3>" + q.evidence.map(function (e) {
          return '<div class="evidence"><a href="' + esc(safeUrl(e.url)) + '" target="_blank" rel="noopener">' + esc(e.title) + '</a><span class="point">' + esc(e.point) + "</span></div>";
        }).join("") +
        '<p class="small muted">※ 根拠欄はドキュメントの記載の要旨です。正確な文言はリンク先で確認してください。</p>' +
        "<h3>復習</h3><p>" + guideLink(q) + "</p>";
      fb.hidden = false;
    } else {
      fb.hidden = true;
      fb.innerHTML = "";
    }

    $("prevBtn").disabled = state.idx === 0;
    $("checkBtn").hidden = checked;
    $("checkBtn").disabled = multi ? sel.length !== q.answer.length : sel.length === 0;
    $("nextBtn").hidden = !checked;
    $("nextBtn").textContent = state.idx === state.list.length - 1 ? "結果を見る" : "次の問題へ";
  }

  function check() {
    var q = state.list[state.idx];
    state.checked[q.id] = true;
    var ok = sameSet(state.answers[q.id] || [], q.answer);
    var h = loadHistory();
    var r = h[q.id] || { tries: 0, correct: 0 };
    r.tries += 1; if (ok) r.correct += 1; r.last = ok;
    h[q.id] = r;
    saveHistory(h);
    renderQuestion();
  }

  function next() {
    if (state.idx < state.list.length - 1) { state.idx += 1; renderQuestion(); window.scrollTo(0, 0); }
    else renderResult();
  }

  // ---- 結果 ----
  function renderResult() {
    var total = state.list.length;
    var correct = state.list.filter(function (q) { return sameSet(state.answers[q.id] || [], q.answer); }).length;
    $("score").innerHTML = '<div class="score">' + correct + " / " + total + '</div><div class="muted">正答率 ' + Math.round(correct / total * 100) + "%</div>";

    var byDom = {};
    state.list.forEach(function (q) {
      var b = byDom[q.domain] || (byDom[q.domain] = { n: 0, ok: 0 });
      b.n += 1; if (sameSet(state.answers[q.id] || [], q.answer)) b.ok += 1;
    });
    $("domScore").innerHTML = "<table><thead><tr><th>分野</th><th>正解</th></tr></thead><tbody>" +
      Object.keys(byDom).sort().map(function (d) { return "<tr><td>" + domainLabel(d) + "</td><td>" + byDom[d].ok + " / " + byDom[d].n + "</td></tr>"; }).join("") +
      "</tbody></table>";

    $("review").innerHTML = state.list.map(function (q, i) {
      var ok = sameSet(state.answers[q.id] || [], q.answer);
      return '<div class="review-item"><span style="color:var(--' + (ok ? "ok" : "ng") + ')">' + (ok ? "○" : "×") + "</span> " +
        '<a href="#" data-i="' + i + '">' + esc(q.id) + "</a>　" + esc(q.topic) + '　<span class="small muted">' + domainLabel(q.domain) + "</span>" +
        '<div class="small muted">' + esc(q.question.slice(0, 90)) + "…</div></div>";
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#review a[data-i]"), function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault(); state.idx = Number(a.getAttribute("data-i")); show("quiz"); renderQuestion();
      });
    });
    show("result");
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderHome();
    $("startBtn").addEventListener("click", function () { start(false); });
    $("wrongBtn").addEventListener("click", function () { start(true); });
    $("checkBtn").addEventListener("click", check);
    $("nextBtn").addEventListener("click", next);
    $("prevBtn").addEventListener("click", function () { if (state.idx > 0) { state.idx -= 1; renderQuestion(); } });
    $("quitBtn").addEventListener("click", function () { renderHome(); show("home"); });
    $("homeBtn").addEventListener("click", function () { renderHome(); show("home"); });
    $("againBtn").addEventListener("click", function () { start(false); });
    $("resetBtn").addEventListener("click", function () {
      if (confirm("学習の記録を消去しますか？")) { try { localStorage.removeItem(STORE); } catch (e) {} renderHome(); }
    });
  });
})();
