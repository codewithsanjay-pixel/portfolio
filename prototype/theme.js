// Theme toggle. Runs in <head> so a saved choice applies before first paint.
// With no saved choice, the page follows the OS light/dark setting.
(function () {
  var KEY = "theme";
  var root = document.documentElement;

  function readSaved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function save(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* storage blocked: choice lasts this visit only */ }
  }

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function currentTheme() {
    return root.getAttribute("data-theme") || (systemPrefersDark() ? "dark" : "light");
  }

  var saved = readSaved();
  if (saved === "light" || saved === "dark") {
    root.setAttribute("data-theme", saved);
  }

  function syncButton(button) {
    var isDark = currentTheme() === "dark";
    button.setAttribute("aria-pressed", String(isDark));
    button.querySelector(".theme-toggle-label").textContent = isDark ? "Light theme" : "Dark theme";
    button.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.getElementById("theme-toggle");
    if (!button) return;
    syncButton(button);

    button.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      save(next);
      syncButton(button);
    });

    // Keep the label right if the OS setting changes while no choice is saved.
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function () { syncButton(button); };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
    }
  });
})();
