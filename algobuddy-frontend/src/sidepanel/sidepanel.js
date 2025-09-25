const API_ENDPOINT = import.meta.env.VITE_API_URL;
let countdownIntervalId = null;

document.addEventListener("DOMContentLoaded", () => {
  checkIfHintShouldBeTriggered();
  document
    .getElementById("hint")
    .addEventListener("click", handleManualHintClick);
  document.getElementById("code").addEventListener("click", getCode);
  document.getElementById("procedure").addEventListener("click", getProcedure);
  setupTimerButtons();
  loadInitialTimerState();
});

function handleManualHintClick() {
  cancelTimer();
  fetchAndShowHint();
}

async function fetchAndShowHint() {
  try {
    showLoader();
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const problem = await getProblemDescription(tab.id);
    const userCode = await getCodeFromEditor(tab.id);

    if (!problem) {
      showResult("Could not find a LeetCode problem on this page.");
      return;
    }

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem: problem,
        currentSolution: userCode,
        operation: "Hint",
      }),
    });

    if (!response.ok) throw new Error("Backend server error");

    const text = await response.text();
    showResult(text);
  } catch (error) {
    console.error("Error in fetchAndShowHint:", error);
    showResult("Error fetching hint.");
  }
}

function checkIfHintShouldBeTriggered() {
  chrome.storage.session.get(["triggerHintOnLoad"], (result) => {
    if (result.triggerHintOnLoad) {
      chrome.storage.session.remove("triggerHintOnLoad");
      fetchAndShowHint(); 
    }
  });
}



async function getCode() {
  try {
    showLoader();
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const problem = await getProblemDescription(tab.id);

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem: problem,
        currentSolution: "",
        operation: "Code",
      }),
    });

    if (!response.ok) throw new Error("Backend server error");

    const text = await response.text();
    showResult(text);
  } catch (err) {
    console.error("Error in getCode:", err);
    showResult("Error fetching code.");
  }
}

async function getProcedure() {
  try {
    showLoader();
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const problem = await getProblemDescription(tab.id);

    
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem: problem,
        currentSolution: "",
        operation: "Procedure",
      }),
    });

    if (!response.ok) throw new Error("Backend server error");

    const text = await response.text();
    showResult(text);
  } catch (err) {
    console.error("Error in getProcedure:", err);
    showResult("Error fetching procedure.");
  }
}

function setupTimerButtons() {
  const timerButtons = document.querySelectorAll(".timer-btn");
  timerButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const timeInMinutes = parseInt(event.target.dataset.time, 10) / 60;
      chrome.storage.local.set({ hintTimerDuration: timeInMinutes }, () => {
        updateActiveButton(timeInMinutes);
        chrome.runtime.sendMessage({ message: "leetCodeProblemLoaded" });
        displayCountdown(timeInMinutes * 60 * 1000);
      });
    });
  });
}

function loadInitialTimerState() {
  chrome.storage.local.get(["hintTimerDuration"], (result) => {
    if (result.hintTimerDuration) {
      updateActiveButton(result.hintTimerDuration);
      chrome.runtime.sendMessage({ message: "getTimerStatus" }, (response) => {
        if (response && response.remainingTime > 0) {
          displayCountdown(response.remainingTime);
        }
      });
    }
  });
}

function displayCountdown(milliseconds) {
  if (countdownIntervalId) clearInterval(countdownIntervalId);

  const statusDiv = document.getElementById("timer-status");
  let remainingTime = Math.floor(milliseconds / 1000);

  const updateCountdown = () => {
    const minutes = Math.floor(remainingTime / 60);
    const secs = remainingTime % 60;
    statusDiv.innerHTML = `Hint in ${minutes}:${
      secs < 10 ? "0" : ""
    }${secs} <span class="cancel-timer">Cancel</span>`;
    statusDiv
      .querySelector(".cancel-timer")
      .addEventListener("click", cancelTimer);
  };

  if (remainingTime <= 0) {
    statusDiv.innerHTML = "";
    return;
  }

  updateCountdown();

  countdownIntervalId = setInterval(() => {
    remainingTime--;
    if (remainingTime > 0) {
      updateCountdown();
    } else {
      clearInterval(countdownIntervalId);
      statusDiv.innerHTML = "";
    }
  }, 1000);
}

function cancelTimer() {
  if (countdownIntervalId) clearInterval(countdownIntervalId);
  countdownIntervalId = null;
  document.getElementById("timer-status").innerHTML = "";
  chrome.runtime.sendMessage({ message: "cancelAlarm" });
  chrome.storage.local.set({ hintTimerDuration: 0 }, () => {
    updateActiveButton(0);
  });
}

function showLoader() {
  const loaderHtml = '<div class="loader"></div>';
  showResult(loaderHtml);
}

function showResult(content) {
  const resultsDiv = document.getElementById("results");
  if (content.includes('class="loader"')) {
    resultsDiv.innerHTML = content;
    return;
  }

  const normalizedContent = content.toLowerCase();
  const isFullExplanation =
    normalizedContent.includes("intuition") ||
    normalizedContent.includes("approach") ||
    normalizedContent.includes("edge cases") ||
    normalizedContent.includes("algorithm") ||
    normalizedContent.includes("complexity");

  const isCodeOnly = content.startsWith("```java");
  if (isFullExplanation) {
    const htmlContent = marked.parse(content);
    resultsDiv.innerHTML = `<div class="result-content">${htmlContent}</div>`;
    Prism.highlightAll();
  } else if (isCodeOnly) {
    const rawCode = content.replace(/^```java\n|```$/g, "").trim();

    resultsDiv.innerHTML = `
      <div class="code-container">
        <div class="code-header">
          <span class="language-label">Java</span>
          <button class="copy-btn">
            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            <span>Copy</span>
          </button>
        </div>
        <pre><code class="language-java">${rawCode
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</code></pre>
      </div>
    `;

    const copyButton = resultsDiv.querySelector(".copy-btn");
    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(rawCode).then(() => {
        copyButton.querySelector("span").textContent = "Copied!";
        setTimeout(() => {
          copyButton.querySelector("span").textContent = "Copy";
        }, 2000);
      });
    });

    Prism.highlightAll();
  }
}

function updateActiveButton(durationInMinutes) {
  const durationInSeconds = durationInMinutes * 60;
  document.querySelectorAll(".timer-btn").forEach((btn) => {
    btn.classList.toggle(
      "active",
      parseInt(btn.dataset.time, 10) === durationInSeconds
    );
  });
}

async function getProblemDescription(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: () => {
      const metaTag = document.querySelector('meta[name="description"]');
      return metaTag ? metaTag.content : null;
    },
  });
  return result;
}

async function getCodeFromEditor(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: () => {
      const container = document.querySelector(".view-lines");
      if (!container) return "";
      const lines = container.querySelectorAll(".view-line");
      let codeText = "";
      lines.forEach((line) => {
        codeText += line.innerText + "\n";
      });
      return codeText.trim();
    },
  });
  return result;
}