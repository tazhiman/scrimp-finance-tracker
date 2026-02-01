# Developer Guide - Updating Rewards Data

## Overview

Your app now uses a clean, consumer-friendly design with no exposed GitHub settings. However, as the developer, you can still update credit card rewards data remotely.

## How It Works

The app has a three-tier data system:
1. **Bundled** - The `data/rewardsData.json` file in your app (always available)
2. **Remote** - Optional GitHub repository for updates (configured by you, not users)
3. **Cache** - Local storage that syncs from GitHub automatically

Users never see any of this complexity - they just get updated card data automatically.

## Where to Configure GitHub Settings

### Configuration File: `config/remoteConfig.ts`

This is where YOU (the developer) configure remote data syncing:

```typescript
export const REMOTE_CONFIG = {
  // Set to true to enable remote data fetching
  ENABLED: false,
  
  // Your private GitHub repository (format: "username/repo-name")
  GITHUB_REPO: '',
  
  // Your GitHub Personal Access Token (with 'repo' scope)
  GITHUB_TOKEN: '',
  
  // Cache duration in milliseconds (default: 24 hours)
  CACHE_TTL_MS: 24 * 60 * 60 * 1000,
};
```

## Setup Steps

### 1. Create Private GitHub Repository

```bash
# On github.com, create a private repo named something like:
your-username/scrimp-rewards-data
```

### 2. Upload Your Data

```bash
# Clone the repo
git clone https://github.com/your-username/scrimp-rewards-data.git
cd scrimp-rewards-data

# Copy your rewards data
cp path/to/finance-tracker/data/rewardsData.json .

# Optional: Add card images
mkdir images
# Add your card image files here (52x32px PNGs recommended)

# Commit and push
git add .
git commit -m "Initial rewards data"
git push
```

### 3. Generate GitHub Personal Access Token

1. Go to GitHub.com → Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Name it: "Scrimp Rewards Data"
4. Select scope: ☑️ **repo** (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (starts with `ghp_...`)

### 4. Configure Your App

Edit `config/remoteConfig.ts`:

```typescript
export const REMOTE_CONFIG = {
  ENABLED: true,
  GITHUB_REPO: 'your-username/scrimp-rewards-data',
  GITHUB_TOKEN: 'ghp_your_token_here_xxxxxxxxxxxxxxxxx',
  CACHE_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours
};
```

### 5. Secure Your Credentials

**IMPORTANT:** Never commit your token to a public repository!

Add to your `.gitignore`:
```
# Keep credentials private
config/remoteConfig.ts
```

Then make a template for other developers:
```bash
cp config/remoteConfig.ts config/remoteConfig.example.ts
# Edit example to remove your real token
```

## Updating Card Data

### Update Rewards Information

1. Edit `rewardsData.json` in your GitHub repo
2. Update reward rates, add new cards, etc.
3. Commit and push

```bash
cd scrimp-rewards-data
# Edit rewardsData.json
git add rewardsData.json
git commit -m "Update HSBC Revolution rewards to 5 mpd"
git push
```

### Users Receive Updates Automatically

- App checks for updates every 24 hours (or your configured `CACHE_TTL_MS`)
- On next app launch after 24 hours, new data is downloaded
- Users never see loading screens or sync buttons
- Falls back to bundled data if GitHub is unreachable

## Production Deployment

### Option 1: Build-Time Configuration (Recommended)

Keep credentials in `config/remoteConfig.ts` and don't commit the file:

```bash
# .gitignore
config/remoteConfig.ts

# Keep a template
config/remoteConfig.example.ts
```

### Option 2: Environment Variables (Better for Teams)

For Expo/EAS Build, use secrets:

```bash
# Install expo-constants
npm install expo-constants

# Add secrets via EAS
eas secret:create --scope project --name GITHUB_REPO --value "username/repo"
eas secret:create --scope project --name GITHUB_TOKEN --value "ghp_..."
```

Then update `config/remoteConfig.ts`:

```typescript
import Constants from 'expo-constants';

export const REMOTE_CONFIG = {
  ENABLED: true,
  GITHUB_REPO: Constants.expoConfig?.extra?.GITHUB_REPO || '',
  GITHUB_TOKEN: Constants.expoConfig?.extra?.GITHUB_TOKEN || '',
  CACHE_TTL_MS: 24 * 60 * 60 * 1000,
};
```

### Option 3: Disable Remote Updates

If you don't need remote updates, just keep it disabled:

```typescript
export const REMOTE_CONFIG = {
  ENABLED: false,
  // ... rest stays empty
};
```

The app works perfectly with just the bundled `data/rewardsData.json`.

## Testing

### Test Remote Sync

1. Set `ENABLED: true` and configure credentials
2. Delete app from device/simulator (to clear cache)
3. Rebuild and run: `npm start`
4. Check console for: "Fetching rewards data from: https://..."
5. If successful: "Rewards data cached successfully"

### Test Fallback

1. Turn off WiFi
2. Launch app
3. Should still work with bundled or cached data

### Test Cache

1. Sync once with internet
2. Close app
3. Turn off WiFi
4. Relaunch app
5. Should use cached data (no internet needed)

## Data Format

Your `rewardsData.json` should follow this structure:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-31",
  "cards": [
    {
      "id": "card-id",
      "name": "Card Name",
      "issuer": "Bank",
      "imageUrl": "images/card-id.png",
      "brandColor": "#HEX",
      "rewardType": "cashback" | "miles",
      "minSpend": 600,
      "rewards": [...],
      "mccCodes": [...]
    }
  ],
  "merchantMccMapping": [...]
}
```

## Monitoring

Check app logs to see data source:
- "Using bundled rewards data" - No remote configured or sync failed
- "Using cached rewards data" - Using previously synced data
- "Fetching rewards data from: ..." - Syncing from GitHub

## FAQ

**Q: Will users see loading screens?**  
A: No. The app loads bundled data immediately, then syncs in background.

**Q: What if GitHub is down?**  
A: App uses cached data. If no cache, uses bundled data. Always works.

**Q: How often does it sync?**  
A: Every 24 hours (configurable via `CACHE_TTL_MS`).

**Q: Can I disable remote updates?**  
A: Yes, set `ENABLED: false`. App works great with bundled data only.

**Q: Do I need card images?**  
A: No, they're optional. App shows colored cards with brand colors as fallback.

**Q: Can multiple developers work on this?**  
A: Yes, use environment variables (Option 2) or share credentials securely.

**Q: What about App Store review?**  
A: No issues - the app works standalone. Remote sync is invisible to reviewers.

## Summary

Your app is now production-ready for the App Store:
- ✅ No exposed GitHub settings in user UI
- ✅ Works offline and standalone
- ✅ Optional remote updates (your choice)
- ✅ Automatic background syncing
- ✅ Consumer-friendly experience

Configure `config/remoteConfig.ts` to enable remote updates, or leave it disabled and update via app releases. Your choice!
