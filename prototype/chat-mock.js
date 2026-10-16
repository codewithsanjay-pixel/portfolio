// Prototype only: shows how the chat panel will feel. Nothing is sent anywhere.
(function () {
  var form = document.getElementById("chat-form");
  var input = document.getElementById("chat-input");
  var log = document.getElementById("chat-log");
  if (!form || !input || !log) return;

  document.querySelectorAll(".chip.starter").forEach(function (chip) {
    chip.addEventListener("click", function () {
      input.value = chip.textContent;
      input.focus();
    });
  });

  function addMessage(kind, label, text) {
    var msg = document.createElement("div");
    msg.className = "msg " + (kind === "user" ? "msg-user" : "msg-bot");
    if (label) {
      var l = document.createElement("p");
      l.className = "msg-label";
      l.textContent = label;
      msg.appendChild(l);
    }
    var p = document.createElement("p");
    p.textContent = text; // textContent, never innerHTML, for user text
    msg.appendChild(p);
    log.appendChild(msg);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var question = input.value.trim();
    if (!question) return;
    addMessage("user", null, question);
    addMessage("bot", "Prototype", "The assistant is not connected yet. In the real site, the answer and its sources appear here.");
    input.value = "";
  });
})();
