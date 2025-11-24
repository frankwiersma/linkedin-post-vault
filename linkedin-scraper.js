// LinkedIn Post Vault - Scraper Module
// Extracts data from saved posts on LinkedIn

function collectSavedPost(element) {
    const data = {};

    // Get the unique post URN
    data.post_urn = element.getAttribute('data-chameleon-result-urn');

    // Find the content container
    const contentContainer = element.querySelector('.entity-result__content');
    if (!contentContainer) return data;

    // Author Information - handle both personal profiles and company pages
    let authorLink = contentContainer.querySelector('a[href*="/in/"]');
    let isCompanyPost = false;

    if (!authorLink) {
        // Try company page link
        authorLink = contentContainer.querySelector('a[href*="/company/"]');
        isCompanyPost = true;
    }
    data.author_profile_url = authorLink ? authorLink.href : null;
    data.is_company_post = isCompanyPost;

    // Get author name and image
    let authorImage = contentContainer.querySelector('img.presence-entity__image');
    if (!authorImage) {
        authorImage = contentContainer.querySelector('.entity-result__image img');
    }
    data.author_name = authorImage ? authorImage.alt : null;
    data.author_profile_image_url = authorImage ? authorImage.src : null;

    // Author headline
    const authorHeadline = contentContainer.querySelector('.entity-result__primary-subtitle');
    data.author_headline = authorHeadline ? authorHeadline.textContent.trim() : null;

    // Connection degree (1st, 2nd, 3rd) - only for personal profiles
    const connectionBadge = contentContainer.querySelector('.entity-result__badge-text');
    data.connection_degree = connectionBadge ? connectionBadge.textContent.trim().replace('•', '').trim() : null;

    // Posted time
    const timestampElements = contentContainer.querySelectorAll('.entity-result__metadata span');
    for (const elem of timestampElements) {
        const text = elem.textContent.trim();
        if (text.includes('ago') || text.includes('day') || text.includes('week') || text.includes('month') || text.includes('year') || text.includes('hour') || text.includes('minute')) {
            data.posted_time = text;
            break;
        }
    }

    // Post URL - try to find link, or construct from URN
    const postLink = contentContainer.querySelector('a[href*="/feed/update/"], a[href*="/posts/"]');
    if (postLink) {
        data.post_url = postLink.href;
    } else if (data.post_urn) {
        data.post_url = `https://www.linkedin.com/feed/update/${data.post_urn}`;
    } else {
        data.post_url = null;
    }

    // Post text content
    const postText = contentContainer.querySelector('.entity-result__summary, .entity-result__content-summary');
    if (postText) {
        data.post_text = postText.textContent.replace('…see more', '').replace('...see more', '').trim();
    }

    // Media detection
    const postImage = contentContainer.querySelector('.entity-result__image img, img[data-ghost-classes*="entity-result"]');
    data.has_image = postImage !== null;
    data.post_image_url = postImage ? postImage.src : null;
    data.post_image_alt = postImage ? postImage.alt : null;

    const video = contentContainer.querySelector('video, [data-test-icon="video-icon"]');
    data.has_video = video !== null;

    // Engagement metrics
    const socialDetails = contentContainer.querySelector('.social-details-social-counts');
    if (socialDetails) {
        const reactions = socialDetails.querySelector('[aria-label*="reaction"]');
        data.reactions = reactions ? reactions.textContent.trim() : null;

        const comments = socialDetails.querySelector('[aria-label*="comment"]');
        data.comments = comments ? comments.textContent.trim() : null;
    }

    return data;
}

// Collect all saved posts currently visible on the page
function collectAllSavedPosts() {
    const containers = document.querySelectorAll('[data-chameleon-result-urn]');
    const results = [];

    console.log(`LinkedIn Post Vault: Found ${containers.length} posts to collect`);

    containers.forEach((container, index) => {
        const postData = collectSavedPost(container);
        if (postData && postData.post_urn) {
            results.push(postData);
        }
    });

    console.log(`LinkedIn Post Vault: Collected ${results.length} posts`);
    return results;
}

// Module loaded confirmation
console.log('LinkedIn Post Vault: Scraper module loaded');
