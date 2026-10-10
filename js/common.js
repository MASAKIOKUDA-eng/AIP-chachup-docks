// テーマ切替（ライト / ダーク）。設定はこのブラウザにだけ保存されます。
(function () {
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem("aip-theme");
    if (saved) root.setAttribute("data-theme", saved);
  } catch (e) {}
  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("themeBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var dark = root.getAttribute("data-theme") === "dark" ||
        (!root.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
      var next = dark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("aip-theme", next); } catch (e) {}
    });
  });
})();
