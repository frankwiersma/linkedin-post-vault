// LinkedIn Post Vault - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  checkCurrentPage();

  const exportJsonBtn = document.getElementById('export-json-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const clearBtn = document.getElementById('clear-btn');
  const goToSavedPostsBtn = document.getElementById('go-to-saved-posts');

  if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJSON);
  if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportCSV);
  if (clearBtn) clearBtn.addEventListener('click', clearData);
  if (goToSavedPostsBtn) goToSavedPostsBtn.addEventListener('click', goToSavedPosts);
});

// Check if user is on LinkedIn saved posts page
function checkCurrentPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];

    if (!currentTab || !currentTab.url) {
      loadStats();
      return;
    }

    const isOnSavedPostsPage = currentTab.url.includes('linkedin.com/my-items/saved-posts');

    if (!isOnSavedPostsPage) {
      showNavigationPrompt();
    } else {
      loadStats();
    }
  });
}

// Show prompt to navigate to saved posts page
function showNavigationPrompt() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'none';
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('nav-prompt').style.display = 'flex';
}

// Navigate to saved posts page
function goToSavedPosts() {
  chrome.tabs.query({}, (allTabs) => {
    const savedPostsTab = allTabs.find(tab =>
      tab.url && tab.url.includes('linkedin.com/my-items/saved-posts')
    );

    if (savedPostsTab) {
      chrome.tabs.update(savedPostsTab.id, { active: true });
      chrome.windows.update(savedPostsTab.windowId, { focused: true });
      window.close();
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.update(tabs[0].id, {
            url: 'https://www.linkedin.com/my-items/saved-posts/'
          });
        } else {
          chrome.tabs.create({
            url: 'https://www.linkedin.com/my-items/saved-posts/'
          });
        }
        window.close();
      });
    }
  });
}

// Load and display stats
function loadStats() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
    const loading = document.getElementById('loading');
    const content = document.getElementById('content');
    const emptyState = document.getElementById('empty-state');
    const navPrompt = document.getElementById('nav-prompt');

    loading.style.display = 'none';
    navPrompt.style.display = 'none';

    if (response.success && response.stats.total_count > 0) {
      content.style.display = 'block';
      emptyState.style.display = 'none';

      document.getElementById('total-count').textContent = response.stats.total_count;

      if (response.stats.last_collected) {
        const date = new Date(response.stats.last_collected);
        document.getElementById('last-collect').textContent = formatRelativeTime(date);
      } else {
        document.getElementById('last-collect').textContent = 'Never';
      }
    } else {
      content.style.display = 'none';
      emptyState.style.display = 'flex';
    }
  });
}

// Export as JSON
function exportJSON() {
  chrome.runtime.sendMessage({ type: 'EXPORT_DATA' }, (response) => {
    if (response.success) {
      const jsonString = JSON.stringify(response.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `linkedin-saved-posts-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('JSON exported successfully!');
    } else {
      showToast('Failed to export data');
    }
  });
}

// Export as CSV
function exportCSV() {
  chrome.runtime.sendMessage({ type: 'EXPORT_DATA' }, (response) => {
    if (response.success && response.data.length > 0) {
      const csvString = convertToCSV(response.data);
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `linkedin-saved-posts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('CSV exported successfully!');
    } else {
      showToast('No data to export');
    }
  });
}

// Convert to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = [
    'post_urn',
    'author_name',
    'author_profile_url',
    'author_headline',
    'is_company_post',
    'connection_degree',
    'posted_time',
    'post_url',
    'post_text',
    'has_image',
    'has_video',
    'reactions',
    'comments'
  ];

  const escapeCSV = (field) => {
    if (field === null || field === undefined) return '""';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const headerRow = headers.join(',');
  const dataRows = data.map(post => {
    return headers.map(h => escapeCSV(post[h])).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

// Clear all data
function clearData() {
  if (confirm('Are you sure you want to delete all saved posts? This cannot be undone.')) {
    chrome.runtime.sendMessage({ type: 'CLEAR_DATA' }, (response) => {
      if (response.success) {
        showToast('All data cleared');
        setTimeout(() => loadStats(), 500);
      } else {
        showToast('Failed to clear data');
      }
    });
  }
}

// Format relative time
function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
