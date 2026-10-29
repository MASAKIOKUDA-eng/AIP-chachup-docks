// 問題集の出題・採点
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var LETTERS = "ABCDEFGH";
  var STORE = "aip-quiz-history";
  var PREFS = "aip-quiz-prefs";
  var TEN = 10;

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
  // 出題方式と 10 問の選び方は、次に開いたときも同じにする
  function loadPrefs() { try { return JSON.parse(localStorage.getItem(PREFS)) || {}; } catch (e) { return {}; } }
  function savePrefs(p) { try { localStorage.setItem(PREFS, JSON.stringify(p)); } catch (e) {} }
  function domainLabel(d) { return "第" + d + "分野　" + esc(window.DOMAINS[d].name); }
  function guideLink(q) {
    return q.guide ? '<a href="guide.html#' + encodeURIComponent(q.guide) + '">' + esc(q.topic) + " の解説（アーキテクチャガイド）</a>" : esc(q.topic);
  }
  // 根拠リンクは https のみ許可（データに javascript: などが混入しても実行されないように）
  function safeUrl(u) { return /^https:\/\//.test(u) ? u : "#"; }
  // 判断基準とした Well-Architected のベストプラクティス
  function waBlock(q) {
    var w = window.WA[q.wa];
    if (!w) return "";
    return "<h3>判断基準（Well-Architected Generative AI Lens）</h3><p>" + esc(window.PILLARS[w[0]]) + "の柱　" +
      '<a href="' + esc(window.waUrl(q.wa)) + '" target="_blank" rel="noopener">' + esc(q.wa) + "　" + esc(w[1]) + "</a></p>";
  }
  function evidenceList(q) {
    var list = q.evidence.slice();
    q.ref.forEach(function (k) { var d = window.DOCS[k]; if (d) list.push({ title: d[0], url: d[1] }); });
    return list;
  }
  // 選択肢ごとに、正解の理由と、不正解の選択肢がなぜ誤りかを示す（表示の順番で）
  function whyList(q, order) {
    return '<h3>選択肢ごとの解説</h3><dl class="whylist">' + order.map(function (orig, pos) {
      var right = q.answer.indexOf(orig) >= 0;
      var text = String(q.why[orig] || "").replace(/^(正解|誤り|不正解)。/, "");
      return '<dt class="' + (right ? "ok" : "ng") + '">' + LETTERS[pos] + "　" + (right ? "正解" : "不正解") + "</dt><dd>" + esc(text) + "</dd>";
    }).join("") + "</dl>";
  }
  function isMulti(q) { return q.answer.length > 1; }
  function sameSet(a, b) { return a.length === b.length && a.slice().sort().join() === b.slice().sort().join(); }

  // ---- ホーム ----
  // 分野の選択肢には、選んでいる回の問題数を表示する（選択の状態は保つ）
  function renderDomainFilter() {
    var setEl = document.querySelector("input[name=set]:checked");
    var set = setEl ? Number(setEl.value) : 1;
    var prev = {};
    Array.prototype.forEach.call(document.querySelectorAll("input[name=dom]"), function (e) { prev[e.value] = e.checked; });
    var html = "";
    Object.keys(window.DOMAINS).forEach(function (d) {
      var n = window.QUESTIONS.filter(function (q) { return q.set === set && String(q.domain) === d; }).length;
      var on = prev[d] === undefined ? true : prev[d];
      html += '<label><input type="checkbox" name="dom" value="' + d + '"' + (on ? " checked" : "") + "> " + domainLabel(d) + "（" + n + "問）</label>";
    });
    $("domainFilter").innerHTML = html;
    renderBlocks();
  }

  function selectedSet() {
    var setEl = document.querySelector("input[name=set]:checked");
    return setEl ? Number(setEl.value) : 1;
  }
  function selectedDomains() {
    return Array.prototype.map.call(document.querySelectorAll("input[name=dom]:checked"), function (e) { return Number(e.value); });
  }
  function selectedMode() {
    var m = document.querySelector("input[name=mode]:checked");
    return m ? m.value : "all";
  }
  // 選んだ回と分野の問題（問題番号の順）
  function pool(set, doms) {
    return window.QUESTIONS.filter(function (q) { return q.set === set && doms.indexOf(q.domain) >= 0; });
  }

  // 10 問の選び方：おまかせ、または問題番号の順に 10 問ずつ区切った範囲
  function renderBlocks() {
    var list = pool(selectedSet(), selectedDomains());
    var h = loadHistory();
    var prev = $("block").value || loadPrefs().block || "auto";
    var html = '<option value="auto">おまかせ（未解答・前回不正解を優先）</option>';
    for (var b = 0; b * TEN < list.length; b++) {
      var part = list.slice(b * TEN, b * TEN + TEN);
      var done = part.filter(function (q) { return h[q.id]; });
      var ok = done.filter(function (q) { return h[q.id].last; }).length;
      html += '<option value="' + b + '">' + (b * TEN + 1) + "〜" + (b * TEN + part.length) + " 問目" +
        (done.length ? "（解答済み " + done.length + "・正解 " + ok + "）" : "") + "</option>";
    }
    $("block").innerHTML = html;
    $("block").value = prev;
    if ($("block").value !== prev) $("block").value = "auto";
    $("tenOpts").hidden = selectedMode() !== "ten";
  }

  // おまかせの 10 問：まだ解いていない問題 → 前回間違えた問題 → 前回正解した問題 の順に選び、問題番号の順に並べる
  function pickAuto(list) {
    var h = loadHistory();
    var rank = function (q) { return !h[q.id] ? 0 : !h[q.id].last ? 1 : 2; };
    var picked = shuffle(list).sort(function (a, b) { return rank(a) - rank(b); }).slice(0, TEN);
    return list.filter(function (q) { return picked.indexOf(q) >= 0; });
  }

  function renderHome() {
    var h = loadHistory();
    var cur = document.querySelector("input[name=set]:checked") ? selectedSet() : 1; // 設定に戻ったときも選んでいた回を保つ
    var sets = "";
    for (var n = 1; n <= window.SET_COUNT; n++) {
      var cnt = window.QUESTIONS.filter(function (q) { return q.set === n; }).length;
      sets += '<label><input type="radio" name="set" value="' + n + '"' + (n === cur ? " checked" : "") + (cnt ? "" : " disabled") +
        "> 第" + n + "回（" + (cnt ? cnt + "問" : "準備中") + "）</label>";
    }
    $("setFilter").innerHTML = sets;
    renderDomainFilter();
    Array.prototype.forEach.call(document.querySelectorAll("input[name=set]"), function (r) {
      r.addEventListener("change", renderDomainFilter);
    });
    $("total").textContent = window.QUESTIONS.length;

    var rows = "";
    for (var k = 1; k <= window.SET_COUNT; k++) {
      var qs = window.QUESTIONS.filter(function (q) { return q.set === k; });
      if (!qs.length) continue;
      var done = qs.filter(function (q) { return h[q.id]; });
      var ok = done.filter(function (q) { return h[q.id].last; }).length;
      rows += "<tr><td>第" + k + "回</td><td>" + qs.length + "</td><td>" + done.length + "</td><td>" + ok + "</td><td>" +
        (done.length ? Math.round(ok / done.length * 100) + "%" : "—") + "</td></tr>";
    }
    $("historyTable").innerHTML = "<table><thead><tr><th>回</th><th>問題数</th><th>解答済み</th><th>前回正解</th><th>正答率</th></tr></thead><tbody>" + rows + "</tbody></table>";
  }

  function start(onlyWrong) {
    var h = loadHistory();
    var set = selectedSet();
    var list = pool(set, selectedDomains()).filter(function (q) { return !onlyWrong || (h[q.id] && !h[q.id].last); });
    if (!list.length) { alert(onlyWrong ? "間違えた問題はありません。" : "出題範囲を1つ以上選んでください。"); return; }
    var mode = selectedMode();
    var block = $("block").value;
    var label = "";
    savePrefs({ mode: mode, block: block });
    if (mode === "ten") {
      if (onlyWrong) { list = list.slice(0, TEN); label = "前回間違えた問題"; }
      else if (block === "auto") { list = pickAuto(list); label = "おまかせ"; }
      else {
        var b = Number(block);
        list = list.slice(b * TEN, b * TEN + TEN);
        label = (b * TEN + 1) + "〜" + (b * TEN + list.length) + " 問目";
      }
    }
    begin(list, { mode: mode, block: onlyWrong ? "wrong" : block, label: label });
  }

  // 問題の一覧を受け取って出題を始める（「同じ問題をもう一度」でも使う）
  function begin(list, info) {
    if ($("shuffleQ").checked) list = shuffle(list);
    state = { list: list, idx: 0, answers: {}, checked: {}, order: {}, info: info };
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

    $("qProgress").textContent = "第" + q.set + "回　" + (state.info.mode === "ten" ? "10 問演習（" + state.info.label + "）　" : "") + (state.idx + 1) + " / " + state.list.length + "（問題 " + q.id + "）";
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
        (on ? " checked" : "") + (checked ? " disabled" : "") + '><span class="label">' + LETTERS[pos] + "</span><span>" + esc(q.choices[orig]) + "</span></label>";
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
        whyList(q, order) +
        (q.flow.length ? "<h3>正解のアーキテクチャ（処理の流れ）</h3><ol class=\"flow\">" + q.flow.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ol>" : "") +
        waBlock(q) +
        "<h3>根拠となる AWS ドキュメント</h3>" + evidenceList(q).map(function (e) {
          return '<div class="evidence"><a href="' + esc(safeUrl(e.url)) + '" target="_blank" rel="noopener">' + esc(e.title) + "</a>" +
            (e.point ? '<span class="point">' + esc(e.point) + "</span>" : "") + "</div>";
        }).join("") +
        '<p class="small muted">※ 根拠欄はドキュメントの記載の要旨です。正確な文言はリンク先で確認してください。</p>' +
        (q.guide ? "<h3>復習</h3><p>" + guideLink(q) + "</p>" : "");
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

    var byPillar = {};
    state.list.forEach(function (q) {
      var p = window.WA[q.wa] ? window.WA[q.wa][0] : "-";
      var b = byPillar[p] || (byPillar[p] = { n: 0, ok: 0 });
      b.n += 1; if (sameSet(state.answers[q.id] || [], q.answer)) b.ok += 1;
    });
    $("pillarScore").innerHTML = "<table><thead><tr><th>Well-Architected の柱</th><th>正解</th></tr></thead><tbody>" +
      Object.keys(window.PILLARS).filter(function (p) { return byPillar[p]; }).map(function (p) {
        return "<tr><td>" + esc(window.PILLARS[p]) + "</td><td>" + byPillar[p].ok + " / " + byPillar[p].n + "</td></tr>";
      }).join("") + "</tbody></table>";

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
    $("nextTenBtn").hidden = !hasNextTen();
    show("result");
  }

  // 10 問演習の続き：範囲を選んでいたときは次の範囲、おまかせのときは新しい 10 問
  function hasNextTen() {
    var info = state.info;
    if (info.mode !== "ten" || info.block === "wrong") return false;
    if (info.block === "auto") return true;
    return (Number(info.block) + 1) * TEN < pool(selectedSet(), selectedDomains()).length;
  }
  function nextTen() {
    if (state.info.block !== "auto") {
      renderBlocks();
      $("block").value = String(Number(state.info.block) + 1);
    }
    start(false);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var prefs = loadPrefs();
    if (prefs.mode === "ten") document.querySelector("input[name=mode][value=ten]").checked = true;
    renderHome();
    $("startBtn").addEventListener("click", function () { start(false); });
    $("wrongBtn").addEventListener("click", function () { start(true); });
    $("checkBtn").addEventListener("click", check);
    $("nextBtn").addEventListener("click", next);
    $("prevBtn").addEventListener("click", function () { if (state.idx > 0) { state.idx -= 1; renderQuestion(); } });
    $("quitBtn").addEventListener("click", function () { renderHome(); show("home"); });
    $("homeBtn").addEventListener("click", function () { renderHome(); show("home"); });
    $("againBtn").addEventListener("click", function () {
      var list = state.list.slice().sort(function (a, b) { return window.QUESTIONS.indexOf(a) - window.QUESTIONS.indexOf(b); });
      begin(list, state.info);
    });
    $("nextTenBtn").addEventListener("click", nextTen);
    $("domainFilter").addEventListener("change", renderBlocks);
    $("block").addEventListener("change", function () { savePrefs({ mode: selectedMode(), block: $("block").value }); });
    Array.prototype.forEach.call(document.querySelectorAll("input[name=mode]"), function (r) {
      r.addEventListener("change", function () { renderBlocks(); savePrefs({ mode: selectedMode(), block: $("block").value }); });
    });
    $("resetBtn").addEventListener("click", function () {
      if (confirm("学習の記録を消去しますか？")) { try { localStorage.removeItem(STORE); } catch (e) {} renderHome(); }
    });
  });
})();
