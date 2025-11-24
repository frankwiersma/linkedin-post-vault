// LinkedIn Post Vault - Content Script
// Creates on-page UI and handles collection process

console.log('LinkedIn Post Vault: Content script loaded');

// Global state
let isCollecting = false;
let shouldStop = false;
let totalCollected = 0;
let collectingRound = 0;

// Create fixed header banner with collection controls
function createCollectionHeader() {
  if (document.getElementById('vault-header')) {
    return;
  }

  const header = document.createElement('div');
  header.id = 'vault-header';
  header.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    backdrop-filter: blur(10px);
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 10px rgba(102, 126, 234, 0.4);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  // Left side: status
  const statusContainer = document.createElement('div');
  statusContainer.style.cssText = `
    display: flex;
    align-items: center;
    flex: 1;
  `;

  const indicator = document.createElement('div');
  indicator.id = 'vault-indicator';
  indicator.style.cssText = `
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #4CAF50;
    margin-right: 12px;
    flex-shrink: 0;
    transition: background-color 0.3s ease;
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
  `;

  const statusText = document.createElement('div');
  statusText.id = 'vault-status';
  statusText.textContent = 'Ready to collect your saved posts';
  statusText.style.cssText = `
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.3px;
  `;

  statusContainer.appendChild(indicator);
  statusContainer.appendChild(statusText);

  // Right side: buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
  `;

  const startButton = document.createElement('button');
  startButton.id = 'vault-start-btn';
  startButton.innerHTML = '▶ Start Collection';
  startButton.style.cssText = `
    background: rgba(255, 255, 255, 0.95);
    color: #667eea;
    border: none;
    padding: 8px 18px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  `;

  const stopButton = document.createElement('button');
  stopButton.id = 'vault-stop-btn';
  stopButton.innerHTML = '■ Stop';
  stopButton.style.cssText = `
    background: rgba(239, 68, 68, 0.95);
    color: white;
    border: none;
    padding: 8px 18px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    display: none;
    box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
  `;

  startButton.addEventListener('click', () => startCollection(indicator, statusText, startButton, stopButton));
  stopButton.addEventListener('click', () => stopCollection(indicator, statusText, startButton, stopButton));

  [startButton, stopButton].forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
    });
  });

  buttonContainer.appendChild(startButton);
  buttonContainer.appendChild(stopButton);

  header.appendChild(statusContainer);
  header.appendChild(buttonContainer);

  document.body.prepend(header);
  console.log('LinkedIn Post Vault: Header UI created');
}

// Start collection process
async function startCollection(indicator, statusText, startButton, stopButton) {
  if (isCollecting) return;

  isCollecting = true;
  shouldStop = false;
  totalCollected = 0;
  collectingRound = 0;

  startButton.style.display = 'none';
  stopButton.style.display = 'block';
  indicator.style.backgroundColor = '#3b82f6';
  indicator.style.boxShadow = '0 0 8px rgba(59, 130, 246, 0.6)';
  statusText.textContent = 'Starting collection...';

  try {
    while (!shouldStop) {
      collectingRound++;

      // Collect current posts
      indicator.style.backgroundColor = '#3b82f6';
      statusText.textContent = `Collecting posts (Round ${collectingRound})...`;

      const collectedData = collectAllSavedPosts();

      if (collectedData && collectedData.length > 0) {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            type: 'SAVE_POSTS',
            posts: collectedData
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });

        if (response && response.success) {
          totalCollected = response.totalCount;
          const newCount = response.newCount;

          indicator.style.backgroundColor = '#4CAF50';
          indicator.style.boxShadow = '0 0 8px rgba(76, 175, 80, 0.6)';
          statusText.textContent = `Collected ${totalCollected} posts (${newCount} new this round)`;
          console.log(`Round ${collectingRound}: ${newCount} new, ${totalCollected} total`);
        }
      }

      if (shouldStop) break;

      // Check for "Show more results" button
      const loadMoreButton = document.querySelector('.scaffold-finite-scroll__load-button');

      if (!loadMoreButton || loadMoreButton.offsetParent === null) {
        console.log('No more posts to load');
        indicator.style.backgroundColor = '#4CAF50';
        statusText.textContent = `Collection complete! ${totalCollected} total posts`;
        showNotification(`Collection complete! ${totalCollected} posts saved`, 'success');
        break;
      }

      // Click "Show more" and wait
      indicator.style.backgroundColor = '#f59e0b';
      indicator.style.boxShadow = '0 0 8px rgba(245, 158, 11, 0.6)';
      statusText.textContent = `Loading more posts... (${totalCollected} collected)`;

      loadMoreButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 500));
      loadMoreButton.click();

      statusText.textContent = `Waiting for posts to load... (${totalCollected} collected)`;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

  } catch (error) {
    console.error('Collection error:', error);
    showNotification(`Error: ${error.message}`, 'error');
    indicator.style.backgroundColor = '#ef4444';
    statusText.textContent = `Error: ${error.message}`;
  } finally {
    isCollecting = false;
    startButton.style.display = 'block';
    stopButton.style.display = 'none';

    if (shouldStop) {
      indicator.style.backgroundColor = '#f59e0b';
      statusText.textContent = `Collection stopped at ${totalCollected} posts`;
      showNotification(`Stopped. ${totalCollected} posts collected`, 'info');
    }

    setTimeout(() => {
      if (!isCollecting) {
        indicator.style.backgroundColor = '#4CAF50';
        indicator.style.boxShadow = '0 0 8px rgba(76, 175, 80, 0.6)';
        statusText.textContent = 'Ready to collect your saved posts';
      }
    }, 5000);
  }
}

// Stop collection
function stopCollection(indicator, statusText, startButton, stopButton) {
  shouldStop = true;
  indicator.style.backgroundColor = '#f59e0b';
  statusText.textContent = 'Stopping...';
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';

  notification.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    z-index: 10000;
    background: ${bgColor};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease;
    max-width: 350px;
  `;
  notification.textContent = message;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 300);
  }, 4000);
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createCollectionHeader);
} else {
  createCollectionHeader();
}

// Watch for navigation changes (LinkedIn is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (url.includes('/my-items/saved-posts')) {
      setTimeout(createCollectionHeader, 1000);
    }
  }
}).observe(document, { subtree: true, childList: true });
