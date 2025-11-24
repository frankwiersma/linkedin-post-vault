# LinkedIn Post Vault 🔐

A powerful Chrome extension that exports your saved LinkedIn posts to JSON or CSV format with a single click.

## Features ✨

- **One-Click Export**: Extract all your saved LinkedIn posts instantly
- **Multiple Formats**: Download as JSON or CSV
- **Automatic Scrolling**: Automatically loads all your saved posts
- **Rich Data**: Extracts titles, authors, content, dates, reactions, and more
- **Beautiful UI**: Clean, modern interface with real-time progress updates
- **Privacy-Focused**: All processing happens locally in your browser

## Quick Install 🚀

### Method 1: Install from Source (2 minutes)

1. **Download the Extension**
   ```bash
   git clone https://github.com/frankwiersma/linkedin-post-vault.git
   cd linkedin-post-vault
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `linkedin-post-vault` folder
   - Done! The extension is now installed

### Method 2: One-Line Install (Advanced)

```bash
git clone https://github.com/frankwiersma/linkedin-post-vault.git && cd linkedin-post-vault && start chrome chrome://extensions/
```

Then follow step 2 above to load the extension.

## How to Use 📖

1. **Log into LinkedIn**
   - Make sure you're logged into your LinkedIn account

2. **Open the Extension**
   - Click the LinkedIn Post Vault icon in your Chrome toolbar
   - (If you don't see it, click the puzzle piece icon and pin it)

3. **Start Extraction**
   - Click the "Start Extraction" button
   - The extension will automatically:
     - Navigate to your saved posts page
     - Scroll through all your saved posts
     - Extract all data

4. **Download Your Data**
   - Once complete, click "Download JSON" or "Download CSV"
   - Your data is saved to your Downloads folder

## What Data is Extracted? 📊

The extension captures:

- **Post Title**: Main content preview
- **Author**: Name of the person who posted
- **Author Profile**: LinkedIn profile URL
- **Post URL**: Direct link to the post
- **Content**: Full post text
- **Date**: When the post was published
- **Post Type**: Article, image, video, or text post
- **Media Info**: Whether it has images or videos
- **Engagement**: Reactions and comment counts
- **Saved Date**: Timestamp of when you exported

## File Formats 📄

### JSON Format
Perfect for developers and data analysis. Clean, structured data that's easy to parse.

```json
[
  {
    "title": "Post preview...",
    "author": "John Doe",
    "authorProfile": "https://linkedin.com/in/johndoe",
    "postUrl": "https://linkedin.com/posts/...",
    "content": "Full post content...",
    "date": "2024-01-15",
    "postType": "article",
    "hasImage": true,
    "hasVideo": false,
    "reactions": "142",
    "comments": "23",
    "extractedAt": "2024-01-20T10:30:00.000Z"
  }
]
```

### CSV Format
Perfect for Excel, Google Sheets, or data analysis tools. Opens directly in spreadsheet applications.

## Troubleshooting 🔧

### Extension doesn't start
- Make sure you're on LinkedIn.com
- Refresh the LinkedIn page and try again
- Check that the extension is enabled in `chrome://extensions/`

### No posts found
- Verify you have saved posts on LinkedIn
- Try navigating to `linkedin.com/my-items/saved-posts/` manually first
- Make sure you're logged into LinkedIn

### Extraction stops early
- Some posts might be private or deleted
- Try refreshing and running the extraction again
- Check your internet connection

## Privacy & Security 🔒

- **100% Local**: All data processing happens in your browser
- **No External Servers**: Your data never leaves your computer
- **No Tracking**: We don't collect or store any information
- **Open Source**: Full source code is available for inspection

## Technical Details 🛠️

### Architecture

```
popup.html/js → content-script.js → linkedin-scraper.js
     ↓                                      ↓
  User clicks                         Scrapes posts
     ↓                                      ↓
 Sends message                         Returns data
     ↓                                      ↓
  Downloads                            Extracted
  JSON/CSV                               posts
```

### How It Works

1. **Injection**: Content script injects the scraper into the LinkedIn page
2. **Navigation**: Scraper navigates to saved posts page
3. **Scrolling**: Automatically scrolls to load all posts (infinite scroll)
4. **Extraction**: Parses DOM to extract post data
5. **Export**: Sends data back to popup for download

### Files Structure

```
linkedin-post-vault/
├── manifest.json           # Extension configuration
├── popup.html              # UI interface
├── popup.js                # UI logic and export functions
├── styles.css              # UI styling
├── content-script.js       # Bridge between popup and scraper
├── linkedin-scraper.js     # Core scraping logic
├── background.js           # Service worker
├── icons/                  # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

## Contributing 🤝

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

## Support the Project ☕

If you find this extension helpful, consider buying me a coffee!

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-yellow?style=for-the-badge&logo=buy-me-a-coffee)](https://www.buymeacoffee.com/frankwiersma)

[☕ Buy me a coffee](https://www.buymeacoffee.com/frankwiersma)

## License 📝

MIT License - Feel free to use, modify, and distribute.

## Changelog 📅

### Version 1.0.0 (November 24, 2024)
- Initial release
- JSON and CSV export
- Automatic scrolling and data extraction
- Real-time progress updates
- Beautiful gradient UI

## FAQ ❓

**Q: Is this safe to use?**
A: Yes! The extension only reads public data from LinkedIn. It doesn't modify anything or send data anywhere.

**Q: Will LinkedIn ban me for using this?**
A: This extension only automates what you could do manually (scrolling and copying). It respects rate limits and behaves like a normal user.

**Q: Can I export posts from other people's profiles?**
A: No, this only exports YOUR saved posts from your own account.

**Q: How many posts can it handle?**
A: The extension has been tested with thousands of posts. It will handle however many you have saved.

**Q: Can I schedule automatic exports?**
A: Not currently, but this feature may be added in a future version.

## Author 👨‍💻

Created by [Frank Wiersma](https://github.com/frankwiersma)

---

**Note**: This extension is not affiliated with, endorsed by, or sponsored by LinkedIn Corporation.
