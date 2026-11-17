// AMALA Projects runtime branding. Only edits text in place (never swaps nodes) so React stays happy.
(function () {
  var NAME = "AMALA Projects";
  var DROP = [/Join [\d,]+\+ teams building with Plane/];
  var RULES = [
    [/Plane Publish/g, NAME],
    [/\bPlane\b/g, NAME]
  ];
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, CODE: 1, PRE: 1, NOSCRIPT: 1 };

  function fix(s) {
    for (var i = 0; i < DROP.length; i++) if (DROP[i].test(s)) return "";
    for (var j = 0; j < RULES.length; j++) s = s.replace(RULES[j][0], RULES[j][1]);
    return s;
  }
  function editable(el) {
    for (; el; el = el.parentElement) {
      if (SKIP[el.tagName] || el.isContentEditable) return true;
    }
    return false;
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) {
      if (root.nodeValue.indexOf("Plane") !== -1 && !editable(root.parentElement)) {
        var v = fix(root.nodeValue);
        if (v !== root.nodeValue) root.nodeValue = v;
      }
      return;
    }
    if (root.nodeType !== 1 || SKIP[root.tagName] || root.isContentEditable) return;
    var t = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
    while ((n = t.nextNode())) walk(n);
    ["placeholder", "title", "aria-label", "alt"].forEach(function (a) {
      root.querySelectorAll && root.querySelectorAll("[" + a + "*='Plane']").forEach(function (el) {
        el.setAttribute(a, fix(el.getAttribute(a)));
      });
    });
  }
  function fixTitle() {
    if (document.title.indexOf("Plane") !== -1) document.title = fix(document.title);
  }
  var queued = false;
  function run() {
    queued = false;
    fixTitle();
    walk(document.body);
  }
  function queue() {
    if (!queued) { queued = true; requestAnimationFrame(run); }
  }
  function start() {
    run();
    new MutationObserver(queue).observe(document.documentElement, {
      childList: true, subtree: true, characterData: true
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
