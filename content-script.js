// Content script that runs on LinkedIn pages
// This script acts as a bridge between the popup and the injected scraper

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startExtraction') {
    injectScraperAndStart();
    sendResponse({ status: 'started' });
  }
  return true;
});

// Listen for messages from the injected scraper script
window.addEventListener('message', (event) => {
  // Only accept messages from same origin
  if (event.source !== window) return;

  // Handle messages from the scraper
  if (event.data.type === 'scraperProgress') {
    chrome.runtime.sendMessage({
      type: 'progress',
      status: event.data.status,
      count: event.data.count
    });
  } else if (event.data.type === 'scraperComplete') {
    chrome.runtime.sendMessage({
      type: 'complete',
      data: event.data.data
    });
  } else if (event.data.type === 'scraperError') {
    chrome.runtime.sendMessage({
      type: 'error',
      error: event.data.error
    });
  }
});

function injectScraperAndStart() {
  // Check if scraper is already injected
  if (document.getElementById('linkedin-scraper-injected')) {
    // If already injected, just trigger it again
    window.postMessage({ type: 'startScraping' }, '*');
    return;
  }

  // Create and inject the scraper script
  const script = document.createElement('script');
  script.id = 'linkedin-scraper-injected';
  script.src = chrome.runtime.getURL('linkedin-scraper.js');

  script.onload = () => {
    // Start scraping after script is loaded
    setTimeout(() => {
      window.postMessage({ type: 'startScraping' }, '*');
    }, 100);
  };

  script.onerror = () => {
    chrome.runtime.sendMessage({
      type: 'error',
      error: 'Failed to load scraper script'
    });
  };

  (document.head || document.documentElement).appendChild(script);
}
