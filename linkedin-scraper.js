// LinkedIn Scraper - Injected into the page context
// This script scrapes saved posts from LinkedIn

(function() {
  'use strict';

  const SAVED_POSTS_URL = 'https://www.linkedin.com/my-items/saved-posts/';
  const SCROLL_DELAY = 1500; // Delay between scrolls in ms
  const MAX_SCROLL_ATTEMPTS = 100; // Maximum number of scroll attempts
  const STABILITY_CHECKS = 3; // Number of times count must be stable before finishing

  let isRunning = false;

  // Listen for start message
  window.addEventListener('message', (event) => {
    if (event.data.type === 'startScraping' && !isRunning) {
      startScraping();
    }
  });

  async function startScraping() {
    isRunning = true;

    try {
      // Send progress update
      sendProgress('Navigating to saved posts...', 0);

      // Navigate to saved posts if not already there
      if (!window.location.href.includes('my-items/saved-posts')) {
        window.location.href = SAVED_POSTS_URL;
        return; // Script will run again after navigation
      }

      // Wait for page to load
      await waitForPageLoad();

      // Scroll and load all posts
      sendProgress('Loading all saved posts...', 0);
      await scrollToLoadAll();

      // Extract data from all posts
      sendProgress('Extracting post data...', 0);
      const posts = await extractAllPosts();

      // Send completion message
      sendComplete(posts);

    } catch (error) {
      sendError(error.message || 'Unknown error occurred');
    } finally {
      isRunning = false;
    }
  }

  async function waitForPageLoad() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const feed = document.querySelector('.scaffold-finite-scroll__content');
        if (feed) {
          clearInterval(checkInterval);
          setTimeout(resolve, 1000); // Wait a bit more for content to render
        }
      }, 500);
    });
  }

  async function scrollToLoadAll() {
    let previousCount = 0;
    let stableCount = 0;
    let scrollAttempts = 0;

    while (scrollAttempts < MAX_SCROLL_ATTEMPTS) {
      // Scroll to bottom
      window.scrollTo(0, document.body.scrollHeight);

      // Wait for new content to load
      await sleep(SCROLL_DELAY);

      // Count current posts
      const currentCount = getPostElements().length;

      // Send progress update
      sendProgress(`Scrolling... Found ${currentCount} posts`, currentCount);

      // Check if count is stable
      if (currentCount === previousCount) {
        stableCount++;
        if (stableCount >= STABILITY_CHECKS) {
          break; // No new posts loaded for multiple checks
        }
      } else {
        stableCount = 0;
      }

      previousCount = currentCount;
      scrollAttempts++;
    }
  }

  function getPostElements() {
    // Try multiple selectors for different LinkedIn layouts
    const selectors = [
      '.reusable-search__result-container',
      '.scaffold-finite-scroll__content > div',
      '[data-id^="urn:li:activity"]',
      '.feed-shared-update-v2'
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        return Array.from(elements);
      }
    }

    return [];
  }

  async function extractAllPosts() {
    const postElements = getPostElements();
    const extractedPosts = [];

    for (let i = 0; i < postElements.length; i++) {
      try {
        const postData = extractPostData(postElements[i]);
        if (postData) {
          extractedPosts.push(postData);
        }

        // Send progress every 10 posts
        if (i % 10 === 0) {
          sendProgress(`Extracting... ${i + 1}/${postElements.length}`, extractedPosts.length);
        }
      } catch (error) {
        console.error('Error extracting post:', error);
      }
    }

    return extractedPosts;
  }

  function extractPostData(element) {
    try {
      const data = {
        title: '',
        author: '',
        authorProfile: '',
        postUrl: '',
        content: '',
        date: '',
        postType: 'post',
        hasImage: false,
        hasVideo: false,
        reactions: '',
        comments: '',
        extractedAt: new Date().toISOString()
      };

      // Extract author name
      const authorElement = element.querySelector('.update-components-actor__name, .feed-shared-actor__name, [data-control-name="actor"]');
      if (authorElement) {
        data.author = authorElement.innerText.trim();
      }

      // Extract author profile URL
      const authorLink = element.querySelector('.update-components-actor__container a, .feed-shared-actor__container a');
      if (authorLink) {
        data.authorProfile = authorLink.href;
      }

      // Extract post URL
      const postLink = element.querySelector('a[href*="/posts/"], a[href*="/feed/update/"]');
      if (postLink) {
        data.postUrl = postLink.href;
      }

      // Extract title/headline
      const titleElement = element.querySelector('.feed-shared-update-v2__description, .update-components-text, .break-words');
      if (titleElement) {
        data.title = titleElement.innerText.trim().substring(0, 200); // First 200 chars
      }

      // Extract full content
      const contentElement = element.querySelector('.feed-shared-update-v2__commentary, .update-components-text');
      if (contentElement) {
        data.content = contentElement.innerText.trim();
      }

      // Extract date
      const dateElement = element.querySelector('time, .update-components-actor__sub-description');
      if (dateElement) {
        data.date = dateElement.getAttribute('datetime') || dateElement.innerText.trim();
      }

      // Check for images
      const images = element.querySelectorAll('img.ivm-view-attr__img--centered, .feed-shared-image__image');
      data.hasImage = images.length > 0;

      // Check for videos
      const videos = element.querySelectorAll('video, .feed-shared-external-video');
      data.hasVideo = videos.length > 0;

      // Determine post type
      if (data.hasVideo) {
        data.postType = 'video';
      } else if (data.hasImage) {
        data.postType = 'image';
      } else if (element.querySelector('.feed-shared-article')) {
        data.postType = 'article';
      }

      // Extract reactions
      const reactionsElement = element.querySelector('.social-details-social-counts__reactions-count, [aria-label*="reaction"]');
      if (reactionsElement) {
        data.reactions = reactionsElement.innerText.trim();
      }

      // Extract comments
      const commentsElement = element.querySelector('.social-details-social-counts__comments, [aria-label*="comment"]');
      if (commentsElement) {
        data.comments = commentsElement.innerText.trim();
      }

      return data;

    } catch (error) {
      console.error('Error parsing post element:', error);
      return null;
    }
  }

  function sendProgress(status, count) {
    window.postMessage({
      type: 'scraperProgress',
      status: status,
      count: count
    }, '*');
  }

  function sendComplete(data) {
    window.postMessage({
      type: 'scraperComplete',
      data: data
    }, '*');
  }

  function sendError(error) {
    window.postMessage({
      type: 'scraperError',
      error: error
    }, '*');
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

})();
