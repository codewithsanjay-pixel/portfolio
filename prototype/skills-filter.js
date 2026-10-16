// Prototype only: skill group filter. Without JavaScript every group stays visible.
(function () {
  var list = document.getElementById("skill-filters");
  var groups = document.querySelectorAll("#skill-groups .skill-group");
  if (!list || groups.length === 0) return;

  groups.forEach(function (group) {
    var li = document.createElement("li");
    var button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.setAttribute("aria-pressed", "false");
    button.dataset.group = group.dataset.group;
    button.textContent = group.dataset.group;
    li.appendChild(button);
    list.appendChild(li);
  });

  list.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-group]");
    if (!button) return;
    var choice = button.dataset.group;
    list.querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b === button));
    });
    groups.forEach(function (group) {
      group.hidden = choice !== "All" && group.dataset.group !== choice;
    });
  });
})();
