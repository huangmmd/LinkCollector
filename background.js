// background.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("enabled", (data) => {
    if (data.enabled === undefined) {
      chrome.storage.local.set({ enabled: true });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_LINK") {
    chrome.storage.local.get(["enabled", "links"], (data) => {
      if (data.enabled) {
        const links = message.links;
        const existingLinks = data.links || [];
        const updatedLinks = links.map((link, index) => ({
          id: existingLinks.length + index + 1,
          link,
          pageTitle: message.pageTitle
        }));
        chrome.storage.local.set({ links: existingLinks.concat(updatedLinks) });
      }
    });
  } else if (message.type === "TOGGLE") {
    chrome.storage.local.get("enabled", (data) => {
      const isEnabled = !data.enabled;
      chrome.storage.local.set({ enabled: isEnabled });
      sendResponse({ enabled: isEnabled });
    });
    return true;
  } else if (message.type === "GET_ENABLED") {
    chrome.storage.local.get("enabled", (data) => {
      sendResponse({ enabled: data.enabled });
    });
    return true;
  } else if (message.type === "UPDATE_IMAGE") {
    // 直接转发消息给 popup.js
    chrome.runtime.sendMessage(message);
  } else if (message.type === "REFRESH_POPUP") {
    // 重新加载悬浮页
    chrome.action.setPopup({ popup: "popup.html" });
  }
});

chrome.runtime.onSuspend.addListener(() => {
  chrome.storage.local.set({ links: [] });
});