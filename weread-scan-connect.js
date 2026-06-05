(function (root) {
  "use strict";

  const apiKeyPattern = /\bwrk-[A-Za-z0-9_-]+\b/;
  const statusId = "ohmytab-weread-scan-status";
  const officialSkillUrl = "https://weread.qq.com/r/weread-skills";
  const state = {
    lastSentKey: "",
    scanTimer: 0
  };

  function extractWereadApiKey(text) {
    const match = String(text || "").match(apiKeyPattern);
    return match ? match[0] : "";
  }

  function getPageText() {
    const parts = [
      root.document?.body?.innerText,
      root.document?.documentElement?.innerText
    ].filter(Boolean);
    return parts.join("\n");
  }

  function showStatus(text, tone = "info") {
    const document = root.document;
    if (!document?.body) return;

    let pill = document.getElementById?.(statusId);
    if (!pill) {
      pill = document.createElement("div");
      pill.id = statusId;
      pill.setAttribute("role", "status");
      pill.style.position = "fixed";
      pill.style.right = "20px";
      pill.style.bottom = "20px";
      pill.style.zIndex = "2147483647";
      pill.style.maxWidth = "300px";
      pill.style.padding = "12px 14px";
      pill.style.borderRadius = "12px";
      pill.style.fontSize = "14px";
      pill.style.lineHeight = "1.5";
      pill.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      pill.style.boxShadow = "0 18px 42px rgba(15, 23, 42, 0.18)";
      document.body.append(pill);
    }

    const isError = tone === "error";
    pill.style.color = isError ? "#7f1d1d" : "#14532d";
    pill.style.background = isError ? "#fef2f2" : "#ecfdf5";
    pill.style.border = isError ? "1px solid #fecaca" : "1px solid #bbf7d0";
    pill.textContent = text;
  }

  function sendCapturedKey(apiKey) {
    if (!apiKey || apiKey === state.lastSentKey) return;
    if (!root.chrome?.runtime?.sendMessage) return;

    state.lastSentKey = apiKey;
    showStatus("OhMyTab 已获取连接凭证，正在同步。");
    root.chrome.runtime.sendMessage({ type: "weread:capturedApiKey", apiKey }, (response) => {
      const runtimeError = root.chrome?.runtime?.lastError;
      if (runtimeError || !response?.ok) {
        state.lastSentKey = "";
        showStatus(response?.error || runtimeError?.message || "OhMyTab 同步连接失败，请回到扩展后重试。", "error");
        return;
      }
      showStatus("OhMyTab 已开始同步微信读书笔记，可以回到新标签页查看进度。");
    });
  }

  function scanPage() {
    sendCapturedKey(extractWereadApiKey(getPageText()));
  }

  function scheduleScan() {
    if (state.scanTimer) {
      root.clearTimeout?.(state.scanTimer);
    }
    state.scanTimer = root.setTimeout?.(() => {
      state.scanTimer = 0;
      scanPage();
    }, 250) || 0;
  }

  function start() {
    if (!root.location?.href?.startsWith(officialSkillUrl)) return;
    scanPage();
    if (typeof root.MutationObserver === "function" && root.document?.documentElement) {
      const observer = new root.MutationObserver(scheduleScan);
      observer.observe(root.document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
    root.addEventListener?.("focus", scanPage);
    root.addEventListener?.("pageshow", scanPage);
  }

  root.OhMyTabWereadScanConnect = {
    extractWereadApiKey
  };

  start();
})(typeof globalThis !== "undefined" ? globalThis : window);
