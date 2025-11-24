// LinkedIn Post Vault - Scraper Module
// Extracts data from saved posts on LinkedIn

function collectSavedPost(element) {
    const data = {};

    // Get the unique post URN
    data.post_urn = element.getAttribute('data-chameleon-result-urn');

    // Find the content container
    const contentContainer = element.querySelector('.entity-result__content-container');
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

    // Get author name and image - different selectors for companies vs people
    let authorImage = contentContainer.querySelector('img.presence-entity__image');
    if (!authorImage) {
        // Try company logo selector
        authorImage = contentContainer.querySelector('.entity-result__content-image img');
    }
    data.author_name = authorImage ? authorImage.alt : null;
    data.author_profile_image_url = authorImage ? authorImage.src : null;

    // Author headline - using the specific class from the HTML
    const authorHeadline = contentContainer.querySelector('.entity-result__content-actor .BvunVpeZUMekKXeJvQZVXAKJcjEpdiNbugLNZdU');
    data.author_headline = authorHeadline ? authorHeadline.textContent.trim() : null;

    // Connection degree (1st, 2nd, 3rd) - only for personal profiles
    const connectionBadge = contentContainer.querySelector('.entity-result__badge-text');
    data.connection_degree = connectionBadge ? connectionBadge.textContent.trim().replace('•', '').trim() : null;

    // Posted time
    const timestampPara = contentContainer.querySelector('.entity-result__content-actor p.t-black--light.t-12');
    if (timestampPara) {
        const timestampSpan = timestampPara.querySelector('span[aria-hidden="true"]');
        data.posted_time = timestampSpan ? timestampSpan.textContent.trim() : null;
    }

    // Post URL - try to find link, or construct from URN
    const postLink = contentContainer.querySelector('a[href*="/feed/update/"]');
    if (postLink) {
        data.post_url = postLink.href;
    } else if (data.post_urn) {
        // Construct URL from URN for text-only posts
        const activityId = data.post_urn.replace('urn:li:activity:', '');
        data.post_url = `https://www.linkedin.com/feed/update/${data.post_urn}?updateEntityUrn=urn%3Ali%3Afs_updateV2%3A%28${data.post_urn}%2CFEED_DETAIL%2CEMPTY%2CDEFAULT%2Cfalse%29`;
    } else {
        data.post_url = null;
    }

    // Post text content - try multiple selectors for different post types
    const postText = contentContainer.querySelector('.entity-result__content-summary, .entity-result__content-summary--3-lines, p[class*="entity-result__content-summary"]');
    if (postText) {
        data.post_text = postText.textContent.replace('…see more', '').trim();
    }

    // Media detection
    const postImage = contentContainer.querySelector('.entity-result__embedded-object-image');
    data.has_image = postImage !== null;
    data.post_image_url = postImage ? postImage.src : null;
    data.post_image_alt = postImage ? postImage.alt : null;

    const video = contentContainer.querySelector('video');
    data.has_video = video !== null;

    return data;
}

// Collect all saved posts on the current page
function collectAllSavedPosts() {
    const containers = document.querySelectorAll('[data-chameleon-result-urn]');
    const results = [];

    console.log(`LinkedIn Post Vault: Found ${containers.length} saved posts to collect`);

    containers.forEach((container, index) => {
        console.log(`Collecting post ${index + 1}/${containers.length}...`);
        results.push(collectSavedPost(container));
    });

    return results;
}

// This module is loaded as part of the LinkedIn Post Vault extension
// The functions above are called by content-script.js
console.log('LinkedIn Post Vault: Collector module loaded');
