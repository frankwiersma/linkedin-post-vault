// LinkedIn Post Vault - Background Service Worker
// Handles storage operations and badge updates

console.log('LinkedIn Post Vault: Background service worker started');

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received:', message.type);

  if (message.type === 'SAVE_POSTS') {
    // Save collected posts to storage
    chrome.storage.local.get(['saved_posts'], (result) => {
      const existingPosts = result.saved_posts || [];
      const newPosts = message.posts || [];

      // Merge with existing, avoid duplicates by post_urn
      const existingUrns = new Set(existingPosts.map(p => p.post_urn));
      const newUniquePosts = newPosts.filter(p => !existingUrns.has(p.post_urn));

      const allPosts = [...existingPosts, ...newUniquePosts];

      // Save to storage
      chrome.storage.local.set({
        saved_posts: allPosts,
        last_collected: new Date().toISOString(),
        total_count: allPosts.length
      }, () => {
        console.log(`Saved ${allPosts.length} total (${newUniquePosts.length} new)`);

        // Update badge
        updateBadge(allPosts.length);

        sendResponse({
          success: true,
          totalCount: allPosts.length,
          newCount: newUniquePosts.length
        });
      });
    });
    return true; // Required for async
  }

  if (message.type === 'GET_STATS') {
    // Get storage stats
    chrome.storage.local.get(['saved_posts', 'last_collected', 'total_count'], (result) => {
      sendResponse({
        success: true,
        stats: {
          total_count: result.total_count || 0,
          last_collected: result.last_collected || null,
          posts: result.saved_posts || []
        }
      });
    });
    return true;
  }

  if (message.type === 'EXPORT_DATA') {
    // Get all data for export
    chrome.storage.local.get(['saved_posts'], (result) => {
      sendResponse({
        success: true,
        data: result.saved_posts || []
      });
    });
    return true;
  }

  if (message.type === 'CLEAR_DATA') {
    // Clear all stored data
    chrome.storage.local.clear(() => {
      updateBadge(0);
      console.log('All data cleared');
      sendResponse({ success: true });
    });
    return true;
  }
});

// Update extension badge
function updateBadge(count) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Initialize badge on startup
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Post Vault installed');

  chrome.storage.local.get(['total_count'], (result) => {
    updateBadge(result.total_count || 0);
  });
});

// Update badge when storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.total_count) {
    updateBadge(changes.total_count.newValue || 0);
  }
});
