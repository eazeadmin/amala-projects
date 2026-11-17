// AMALA Projects: EOS project template.
// Adds an "Apply AMALA template" button to every project's Settings page.
// It runs in the signed-in user's session (no API keys) and only ADDS what's
// missing, so it's safe to click again on a project that already has it.
(function () {
  var TEMPLATE = {
    states: [
      // [name, group, color, description] - existing defaults are renamed where noted
      { name: "Not Started", group: "unstarted", color: "#9AA4BC", rename: ["Todo"], isDefault: true },
      { name: "In Progress", group: "started", color: "#3B82F6" },
      { name: "Blocked", group: "started", color: "#DC2626", description: "Waiting on someone or something" },
      { name: "Ongoing", group: "started", color: "#8B5CF6", description: "Recurring / continuous work" },
      { name: "Completed", group: "completed", color: "#16A34A", rename: ["Done"] }
    ],
    labelGroup: "Department",
    labels: [
      ["Marketing", "#EC4899"], ["Sales", "#F59E0B"], ["Distribution", "#0EA5E9"],
      ["Finance", "#16A34A"], ["Processing", "#8B5CF6"], ["Operations", "#64748B"]
    ]
  };

  function quarter(d) {
    var q = Math.floor(d.getMonth() / 3);
    var end = new Date(d.getFullYear(), q * 3 + 3, 0);
    return { label: "Q" + (q + 1) + " " + d.getFullYear(), end: iso(end) };
  }
  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function weekLabels(n) {
    var d = new Date(), out = [], m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday this week
    for (var i = 0; i < n; i++) {
      var s = new Date(d); s.setDate(d.getDate() + 7 * i);
      var e = new Date(s); e.setDate(s.getDate() + 6);
      out.push(m[s.getMonth()] + " " + s.getDate() + "–" + (e.getMonth() !== s.getMonth() ? m[e.getMonth()] + " " : "") + e.getDate());
    }
    return out;
  }

  function pages(projectName) {
    var weeks = weekLabels(5);
    var cells = function () { return weeks.map(function () { return "<td><p></p></td>"; }).join(""); };
    var row = function (m, t) { return "<tr><td><p></p></td><td><p>" + m + "</p></td><td><p>" + (t || "") + "</p></td>" + cells() + "</tr>"; };
    var sec = function (n) { return "<tr><td><p><strong>" + n + "</strong></p></td><td><p></p></td><td><p></p></td>" + cells() + "</tr>"; };
    var head = "<tr><th><p>Who</p></th><th><p>Measurable</p></th><th><p>Target</p></th>" +
      weeks.map(function (w) { return "<th><p>" + w + "</p></th>"; }).join("") + "</tr>";
    return [
      ["Overview",
        "<h2>Vision</h2><p><em>Where " + projectName + " is going. (Fill in.)</em></p>" +
        "<h2>Mission</h2><p><em>What we do every day to get there. (Fill in.)</em></p>" +
        "<h2>Outcome</h2><p><em>The measurable result this project is judged on. (Fill in.)</em></p>" +
        "<h2>Key links</h2><ul><li><p>Onboarding checklist: <em>(add link)</em></p></li><li><p>Client data dashboard: <em>(add link)</em></p></li><li><p>Drive folder: <em>(add link)</em></p></li></ul>" +
        "<h2>How this project works</h2><ul>" +
        "<li><p><strong>Rocks</strong> are quarterly goals. Each Rock is a <strong>Module</strong> named \"Q# YYYY Rock: …\" with an owner and due date. Its progress % updates as tasks are completed. Module status: In Progress = On Track, Paused = Needs Attention / Blocked.</p></li>" +
        "<li><p><strong>Tasks</strong> are work items with an owner (assignee), due date and department label.</p></li>" +
        "<li><p><strong>Status</strong>: Not Started → In Progress → Completed. Use Blocked when waiting on someone, Ongoing for recurring work.</p></li>" +
        "<li><p><strong>Priority</strong>: High = Priority 1, Medium = Priority 2, Low = Priority 3.</p></li>" +
        "<li><p><strong>Weekly Scorecard</strong> and <strong>SOPs &amp; Assets</strong> live in Pages.</p></li>" +
        "<li><p>Rule: if it's not in AMALA Projects, it doesn't exist. Requests go here, not Slack DMs.</p></li></ul>"],
      ["Weekly Scorecard",
        "<p>Updated every Monday before the WIP. One row per measurable, one owner per row. Fill in owners and targets.</p><table><tbody>" +
        head + sec("MARKETING") + row("Leads / opt-ins") + row("Booked calls") +
        sec("SALES") + row("Calls held") + row("Show rate %") + row("New sales") + row("Close rate %") + row("Cash collected") +
        sec("OPERATIONS") + row("Clients onboarded") + row("Avg onboarding call length") +
        sec("FINANCE / PROCESSING") + row("Applications submitted") + row("Applications settled") +
        "</tbody></table>"],
      ["SOPs & Assets",
        "<p>Every SOP, template and folder for this project. One line each: what it is, then the link.</p>" +
        "<h3>SOPs</h3><ul><li><p><em>(SOP name — link)</em></p></li></ul>" +
        "<h3>Folders &amp; assets</h3><ul><li><p><em>(Drive folder — link)</em></p></li></ul>" +
        "<h3>Dashboards</h3><ul><li><p><em>(Dashboard — link)</em></p></li></ul>"]
    ];
  }

  async function apply(workspace, projectId, log) {
    var csrf = (await (await fetch("/auth/get-csrf-token/")).json()).csrf_token;
    var base = "/api/workspaces/" + workspace + "/projects/" + projectId;
    async function api(method, path, body) {
      var r = await fetch(base + path, {
        method: method,
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
        body: body ? JSON.stringify(body) : undefined
      });
      var t = await r.text(), d;
      try { d = JSON.parse(t); } catch (e) { d = t; }
      if (!r.ok) throw new Error(method + " " + path + " → " + r.status + " " + String(t).slice(0, 200));
      return d;
    }
    var list = function (d) { return Array.isArray(d) ? d : (d && d.results) || []; };
    var done = [];

    // 1. Turn on modules, cycles and pages
    var project = await api("PATCH", "/", { module_view: true, cycle_view: true, page_view: true });
    log("Features on");

    // 2. States
    var states = list(await api("GET", "/states/"));
    var byName = function (n) { return states.find(function (s) { return s.name.toLowerCase() === n.toLowerCase(); }); };
    var seq = 0;
    for (var i = 0; i < TEMPLATE.states.length; i++) {
      var st = TEMPLATE.states[i];
      var existing = byName(st.name);
      if (!existing && st.rename) {
        var old = st.rename.map(byName).find(Boolean);
        if (old) { existing = await api("PATCH", "/states/" + old.id + "/", { name: st.name, color: st.color }); done.push("renamed " + old.name + " → " + st.name); }
      }
      if (!existing) {
        var after = states.filter(function (s) { return s.group === st.group; }).map(function (s) { return s.sequence; });
        seq = (after.length ? Math.max.apply(null, after) : 30000) + 1000;
        existing = await api("POST", "/states/", { name: st.name, group: st.group, color: st.color, sequence: seq, description: st.description || "" });
        states.push(existing);
        done.push("state " + st.name);
      }
      if (st.isDefault && !existing.default) {
        await fetch(base + "/states/" + existing.id + "/mark-default/", { method: "POST", headers: { "X-CSRFToken": csrf } });
      }
    }
    log("States ready");

    // 3. Department labels
    var labels = list(await api("GET", "/issue-labels/"));
    var findLabel = function (n) { return labels.find(function (l) { return l.name.toLowerCase() === n.toLowerCase(); }); };
    var parent = findLabel(TEMPLATE.labelGroup);
    if (!parent) { parent = await api("POST", "/issue-labels/", { name: TEMPLATE.labelGroup, color: "#111111" }); labels.push(parent); done.push("label group"); }
    for (var k = 0; k < TEMPLATE.labels.length; k++) {
      if (!findLabel(TEMPLATE.labels[k][0])) {
        labels.push(await api("POST", "/issue-labels/", { name: TEMPLATE.labels[k][0], color: TEMPLATE.labels[k][1], parent: parent.id }));
        done.push("label " + TEMPLATE.labels[k][0]);
      }
    }
    log("Labels ready");

    // 4. Pages
    var existingPages = list(await api("GET", "/pages/")).map(function (p) { return (p.name || "").toLowerCase(); });
    var pg = pages(project.name);
    for (var p = 0; p < pg.length; p++) {
      if (existingPages.indexOf(pg[p][0].toLowerCase()) === -1) {
        await api("POST", "/pages/", { name: pg[p][0], description_html: pg[p][1], access: 0 });
        done.push("page " + pg[p][0]);
      }
    }
    log("Pages ready");

    // 5. A first Rock for this quarter, only if the project has no Rocks yet
    var q = quarter(new Date());
    var modules = list(await api("GET", "/modules/"));
    if (!modules.some(function (m) { return /\bRock\b/i.test(m.name); })) {
      await api("POST", "/modules/", {
        name: q.label + " Rock: (rename me)",
        description: "A quarterly goal. Rename it, set the lead, and add the tasks that deliver it. Status: In Progress = On Track, Paused = Needs Attention / Blocked.",
        status: "planned",
        target_date: q.end
      });
      done.push("first " + q.label + " Rock");
    }
    log("Done");
    return done;
  }

  window.amalaApplyTemplate = apply;

  // --- Button on project Settings pages ---------------------------------------
  var RE = /^\/([^/]+)\/(?:settings\/)?projects\/([0-9a-f-]{36})(?:\/settings)?\/?/;
  function route() {
    var m = location.pathname.match(RE);
    return m && /settings/.test(location.pathname) ? { ws: m[1], pid: m[2] } : null;
  }
  function render() {
    var r = route(), btn = document.getElementById("amala-template-btn");
    if (!r) { if (btn) btn.remove(); return; }
    if (btn) return;
    btn = document.createElement("button");
    btn.id = "amala-template-btn";
    btn.textContent = "Apply AMALA template";
    btn.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:99999;padding:10px 16px;border-radius:8px;border:0;background:#111;color:#fff;font:600 13px/1.2 Manrope,system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)";
    var armed = false, busy = false;
    btn.onclick = async function () {
      if (busy) return;
      if (!armed) { armed = true; btn.textContent = "Click again to confirm"; setTimeout(function () { if (!busy) { armed = false; btn.textContent = "Apply AMALA template"; } }, 4000); return; }
      busy = true;
      try {
        var cur = route();
        var done = await apply(cur.ws, cur.pid, function (s) { btn.textContent = s + "…"; });
        btn.textContent = done.length ? "Template applied ✓ (" + done.length + " added)" : "Already up to date ✓";
      } catch (e) {
        btn.textContent = "Failed — see console";
        console.error("[AMALA template]", e);
      }
      setTimeout(function () { busy = false; armed = false; btn.textContent = "Apply AMALA template"; }, 6000);
    };
    document.body.appendChild(btn);
  }
  var last = "";
  setInterval(function () { if (location.pathname !== last) { last = location.pathname; render(); } }, 500);
})();
