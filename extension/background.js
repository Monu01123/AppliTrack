// background.js
// Service worker for HireIQ Job Clipper

chrome.runtime.onInstalled.addListener(() => {
  console.log("HireIQ Job Clipper installed.");
});

// Listen for authentication sync from the web app
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SYNC_AUTH") {
    chrome.storage.local.set({ 
      auth_token: request.token, 
      user: request.user 
    }).then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep message channel open for async response
  }
});
