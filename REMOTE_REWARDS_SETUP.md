# Remote Rewards Data Setup Guide

## Overview

This guide will help you set up remote fetching of credit card rewards data from a private GitHub repository. This allows you to update card information, reward rates, and card images without releasing a new app version.

## Why Use Remote Data?

- Update card rewards information without app updates
- Add new credit cards remotely
- Update card images and branding
- Keep sensitive reward data in a private repository
- Offline support with intelligent caching

## Architecture

The app uses a three-tier fallback system:

1. **Remote** - Fetches latest data from GitHub (with authentication)
2. **Cache** - Uses locally cached data (24-hour expiry)
3. **Bundled** - Falls back to app's built-in data

## Setup Instructions

### Step 1: Create Private GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the "+" icon > "New repository"
3. Name it: `scrimp-rewards-data` (or any name you prefer)
4. **Important:** Select "Private" repository
5. Click "Create repository"

### Step 2: Prepare Your Data Structure

Create the following structure in your repository:

```
scrimp-rewards-data/
├── rewardsData.json
└── images/
    ├── dbs-live-fresh.png
    ├── uob-evol.png
    ├── hsbc-revolution.png
    ├── dbs-altitude.png
    ├── citi-rewards.png
    ├── uob-one.png
    ├── ocbc-365.png
    ├── sc-unlimited-cashback.png
    ├── maybank-family-friends.png
    ├── citi-cashback.png
    ├── hsbc-visa-platinum.png
    ├── uob-preferred-platinum.png
    ├── dbs-womans-world.png
    ├── ocbc-titanium-rewards.png
    └── sc-smart-credit.png
```

### Step 3: Prepare Card Images

**Image Specifications:**
- Recommended size: 52x32 pixels (credit card aspect ratio)
- Format: PNG or JPG
- File size: Under 100KB each (optimize for mobile)
- Background: Transparent or white
- Content: Simplified card design or bank logo

**Tips for creating card images:**
- Use actual card photos and crop/resize them
- Or create simplified mockups with bank colors and logos
- Ensure text/logos are readable at small size
- Optimize images using tools like TinyPNG or ImageOptim

### Step 4: Upload Files to GitHub

**Option A: Via Web Interface**
1. Go to your repository on github.com
2. Click "Add file" > "Upload files"
3. Upload `rewardsData.json` to root
4. Create `images` folder and upload all card images
5. Commit changes

**Option B: Via Git Command Line**
```bash
git clone https://github.com/yourusername/scrimp-rewards-data.git
cd scrimp-rewards-data

# Copy your rewardsData.json
cp /path/to/rewardsData.json .

# Create images folder and copy images
mkdir images
cp /path/to/card/images/*.png images/

git add .
git commit -m "Initial rewards data setup"
git push
```

### Step 5: Update rewardsData.json Image URLs

Make sure your `rewardsData.json` has the correct image URLs:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-31",
  "cards": [
    {
      "id": "dbs-live-fresh",
      "name": "DBS Live Fresh",
      "issuer": "DBS",
      "imageUrl": "images/dbs-live-fresh.png",
      "brandColor": "#D41F3D",
      "rewardType": "cashback",
      "minSpend": 600,
      "rewards": [...]
    },
    ...
  ]
}
```

### Step 6: Generate GitHub Personal Access Token (PAT)

1. Go to GitHub.com > Click your profile picture > Settings
2. Scroll down to "Developer settings" (bottom of left sidebar)
3. Click "Personal access tokens" > "Tokens (classic)"
4. Click "Generate new token" > "Generate new token (classic)"
5. Name it: "Scrimp Rewards Data Access"
6. Set expiration: "No expiration" (or 1 year if you prefer)
7. Select scopes:
   - ✅ **repo** (Full control of private repositories)
     - This is the ONLY scope needed
8. Click "Generate token"
9. **Important:** Copy the token immediately (you won't see it again!)
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 7: Configure the App

1. Open your Scrimp app
2. Navigate to **Settings** (gear icon in top right)
3. Scroll to **REMOTE DATA SOURCE** section
4. Enter your information:
   - **GitHub Repository:** `yourusername/scrimp-rewards-data`
   - **GitHub Token:** Paste your PAT from Step 6
5. Tap **"Save Configuration"**
6. Tap **"Test Connection"** to verify it works
7. If successful, tap **"Sync Now"** to download data and images

### Step 8: Verify It Works

1. After sync completes, go back to Settings
2. Tap **"My Cards"** under CREDIT CARDS
3. You should see all 15 cards with images (if you uploaded them)
4. Select a few cards and return to Dashboard
5. The Credit Cards section should show your cards with images

## Updating Rewards Data

### To Add/Edit Card Information

1. Edit `rewardsData.json` in your GitHub repo
2. Update reward rates, add new cards, etc.
3. Increment version number (optional but recommended)
4. Commit and push changes
5. In app: Settings > Remote Data Source > Sync Now
6. Changes appear immediately!

### To Add/Update Card Images

1. Upload new images to `images/` folder in GitHub
2. Update `imageUrl` field in `rewardsData.json`
3. Commit changes
4. Sync in app
5. Old images automatically cleared, new ones downloaded

## Automatic Syncing

The app automatically checks for updates:
- **On app start** (if cache is older than 24 hours)
- **Manual sync** via Settings > Sync Now
- **Cache lifetime:** 24 hours

You can force an immediate sync anytime by tapping "Sync Now" in Settings.

## Troubleshooting

### "Connection Failed: Invalid token"
- Your GitHub token may have expired or been revoked
- Generate a new token (Step 6)
- Make sure you selected the "repo" scope

### "Connection Failed: Repository not found or no access"
- Check repository name format: `username/repo-name`
- Ensure repository is accessible with your token
- Verify the repository exists and is spelled correctly

### "Sync Failed"
- Check your internet connection
- Verify GitHub is not down
- App will use cached/bundled data automatically

### Images Not Showing
- Verify image files exist in `images/` folder
- Check `imageUrl` paths in `rewardsData.json`
- Image URLs should be relative: `images/card-name.png`
- App will show colored cards as fallback

### "Last synced: Never"
- You haven't synced yet - tap "Sync Now"
- Or GitHub isn't configured - add token and repo

## Security & Privacy

- Your GitHub PAT is stored encrypted on your device
- Never share your PAT with anyone
- The token only needs "repo" read access
- Consider using a dedicated GitHub account for rewards data
- Rotate tokens periodically for security

## Data Format Reference

### Required Fields in rewardsData.json

```json
{
  "version": "1.0.0",
  "lastUpdated": "YYYY-MM-DD",
  "cards": [
    {
      "id": "unique-card-id",
      "name": "Card Display Name",
      "issuer": "Bank Name",
      "imageUrl": "images/card-id.png",
      "brandColor": "#HEX",
      "rewardType": "cashback" | "miles",
      "minSpend": 600,
      "rewards": [
        {
          "category": "groceries",
          "rate": 5,
          "unit": "%",
          "conditions": "Description"
        }
      ],
      "mccCodes": ["5411", "5812"]
    }
  ],
  "merchantMccMapping": [...]
}
```

## Advanced Usage

### Using GitHub Actions for Automation

You can set up GitHub Actions to automatically validate your JSON:

```yaml
# .github/workflows/validate.yml
name: Validate Rewards Data
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate JSON
        run: |
          cat rewardsData.json | jq . > /dev/null
```

### Versioning Strategy

Increment version numbers when making breaking changes:
- **1.0.0** → **1.0.1** - Minor updates (reward rate changes)
- **1.0.0** → **1.1.0** - New cards added
- **1.0.0** → **2.0.0** - Structure changes (add new fields)

### Backup Your Data

Regularly back up your repository:
```bash
git clone https://github.com/yourusername/scrimp-rewards-data.git
cd scrimp-rewards-data
git pull
# Creates a local backup
```

## Support

If you encounter issues:
1. Check this guide first
2. Verify your GitHub token hasn't expired
3. Test connection in app Settings
4. Check app console logs for detailed errors
5. App will always fall back to bundled data - you won't lose functionality

## What Gets Synced

- ✅ Card list and details
- ✅ Reward rates and conditions
- ✅ Merchant mappings
- ✅ MCC codes
- ✅ Card images
- ✅ Brand colors

## What Stays Local

- ❌ Your selected cards (privacy)
- ❌ Transaction data (privacy)
- ❌ Spending tracking (privacy)
- ❌ Personal preferences (privacy)

Only the rewards database is synced. All your personal financial data stays on your device.

---

**You're all set!** Your app can now fetch updated credit card data remotely while maintaining full offline functionality.

For questions or issues, check the app console logs for detailed debugging information.
