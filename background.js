// Background service worker for LinkedIn Post Vault extension
// This listens for installation and forwards messages between content scripts and popup

// Installation handler
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Post Vault extension installed');
});

// Message relay between content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Forward messages to all extension pages (popup)
  chrome.runtime.sendMessage(message).catch(() => {
    // Ignore errors if popup is closed
  });

  sendResponse({ received: true });
  return true;
});
