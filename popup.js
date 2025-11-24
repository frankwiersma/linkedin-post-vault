// DOM elements
const startBtn = document.getElementById('startBtn');
const statusDiv = document.getElementById('status');
const progressInfo = document.getElementById('progressInfo');
const resultsSection = document.getElementById('resultsSection');
const resultsCount = document.getElementById('resultsCount');
const downloadJSONBtn = document.getElementById('downloadJSON');
const downloadCSVBtn = document.getElementById('downloadCSV');

// Store extracted data
let extractedData = [];

// Event listeners
startBtn.addEventListener('click', startExtraction);
downloadJSONBtn.addEventListener('click', downloadJSON);
downloadCSVBtn.addEventListener('click', downloadCSV);

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'progress') {
    updateProgress(message.status, message.count);
  } else if (message.type === 'complete') {
    extractionComplete(message.data);
  } else if (message.type === 'error') {
    showError(message.error);
  }
});

function startExtraction() {
  // Disable button and show loading state
  startBtn.disabled = true;
  startBtn.textContent = 'Extracting...';
  statusDiv.textContent = 'Starting extraction...';
  statusDiv.classList.add('loading');
  resultsSection.style.display = 'none';

  // Get current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];

    // Check if we're on LinkedIn
    if (!currentTab.url.includes('linkedin.com')) {
      showError('Please navigate to LinkedIn first');
      resetButton();
      return;
    }

    // Send message to content script
    chrome.tabs.sendMessage(currentTab.id, { action: 'startExtraction' }, (response) => {
      if (chrome.runtime.lastError) {
        showError('Failed to connect. Please refresh the LinkedIn page and try again.');
        resetButton();
      }
    });
  });
}

function updateProgress(status, count) {
  statusDiv.textContent = status;
  if (count !== undefined) {
    progressInfo.textContent = `Found ${count} saved posts`;
  }
}

function extractionComplete(data) {
  extractedData = data;
  statusDiv.classList.remove('loading');
  statusDiv.textContent = 'Extraction complete!';
  progressInfo.textContent = '';

  // Show results section
  resultsSection.style.display = 'block';
  resultsCount.textContent = `Successfully extracted ${data.length} saved posts`;

  resetButton();
}

function showError(error) {
  statusDiv.classList.remove('loading');
  statusDiv.textContent = `Error: ${error}`;
  statusDiv.style.color = '#d32f2f';
  progressInfo.textContent = '';

  resetButton();
}

function resetButton() {
  startBtn.disabled = false;
  startBtn.innerHTML = '<span class="btn-icon">🚀</span> Start Extraction';
}

function downloadJSON() {
  const dataStr = JSON.stringify(extractedData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `linkedin_saved_posts_${timestamp}.json`;

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
}

function downloadCSV() {
  const csv = convertToCSV(extractedData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `linkedin_saved_posts_${timestamp}.csv`;

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
}

function convertToCSV(data) {
  if (!data || data.length === 0) {
    return '';
  }

  // CSV headers
  const headers = [
    'Title',
    'Author',
    'Author Profile',
    'Post URL',
    'Content',
    'Date',
    'Post Type',
    'Has Image',
    'Has Video',
    'Reactions',
    'Comments',
    'Saved Date'
  ];

  // Escape CSV field
  const escapeCSV = (field) => {
    if (field === null || field === undefined) {
      return '';
    }
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV rows
  const rows = data.map(post => {
    return [
      escapeCSV(post.title || ''),
      escapeCSV(post.author || ''),
      escapeCSV(post.authorProfile || ''),
      escapeCSV(post.postUrl || ''),
      escapeCSV(post.content || ''),
      escapeCSV(post.date || ''),
      escapeCSV(post.postType || ''),
      escapeCSV(post.hasImage ? 'Yes' : 'No'),
      escapeCSV(post.hasVideo ? 'Yes' : 'No'),
      escapeCSV(post.reactions || ''),
      escapeCSV(post.comments || ''),
      escapeCSV(new Date().toISOString())
    ].join(',');
  });

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}
