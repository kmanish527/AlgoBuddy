const API_ENDPOINT = import.meta.env.VITE_API_URL;

function notifyBackgroundScript() {
  chrome.runtime.sendMessage({ message: "leetCodeProblemLoaded" });
}

let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    notifyBackgroundScript();
  }
}).observe(document, { subtree: true, childList: true });

notifyBackgroundScript();

notifyBackgroundScript();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "getHint") {
    console.log("AlgoBuddy: Timer finished. Fetching hint.");
    fetchAndShowHint();
  }
});

async function fetchAndShowHint() {
  const problemDescription = document.querySelector(
    'meta[name="description"]'
  )?.content;
  if (!problemDescription) return;

  const response = await fetch("API_ENDPOINT", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problem: problemDescription,
      currentSolution: "",
      operation: "Hint",
    }),
  });

  if (!response.ok) return;

  const hintText = await response.text();
  displayHintOnPage(hintText);
}

function displayHintOnPage(hint) {
  const oldHint = document.getElementById("algobuddy-hint-popup");
  if (oldHint) oldHint.remove();

  const popup = document.createElement("div");
  popup.id = "algobuddy-hint-popup";
  popup.innerHTML = `
    <div class="algobuddy-header">
      <strong>AlgoBuddy Hint</strong>
      <button id="algobuddy-close-btn">&times;</button>
    </div>
    <div class="algobuddy-content">${hint}</div>
  `;

  popup.style.position = "fixed";
  popup.style.top = "20px";
  popup.style.right = "20px";
  popup.style.width = "300px";
  popup.style.backgroundColor = "#2a2a40";
  popup.style.color = "#f3f3f3";
  popup.style.border = "1px solid #444";
  popup.style.borderRadius = "8px";
  popup.style.zIndex = "9999";
  popup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";

  const header = popup.querySelector(".algobuddy-header");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.padding = "8px 12px";
  header.style.backgroundColor = "#3a3a50";

  const content = popup.querySelector(".algobuddy-content");
  content.style.padding = "12px";

  const closeBtn = popup.querySelector("#algobuddy-close-btn");
  closeBtn.style.background = "none";
  closeBtn.style.border = "none";
  closeBtn.style.color = "#f3f3f3";
  closeBtn.style.fontSize = "20px";
  closeBtn.style.cursor = "pointer";

  document.body.appendChild(popup);

  closeBtn.addEventListener("click", () => {
    popup.remove();
  });
}
