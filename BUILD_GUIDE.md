# Build & Deployment Guide

## Environment Overview

Your app has 3 environments with different behaviors:

| Environment | Dev Options | Cache TTL | Build Type | Use Case |
|-------------|-------------|-----------|------------|----------|
| **Development** | ✅ Visible | 0 (always fresh) | `expo start` | Local development |
| **UAT** | ✅ Visible | 1 hour | TestFlight/Internal | Testing with testers |
| **Production** | ❌ Hidden | 24 hours | App Store | End users |

## Development (Local)

```bash
# Run locally with hot reload
npm start

# Features:
# - Dev menu visible in Settings
# - "Load Test Data" button
# - "Sync Rewards Data" button
# - Environment badge shows "Development"
# - Cache always refreshes (0 TTL)
```

## UAT Build (TestFlight for Testers)

```bash
# Build for internal testing
eas build --profile uat --platform ios

# Or for Android
eas build --profile uat --platform android

# Features:
# - Dev menu still visible (for testers to test features)
# - Environment badge shows "UAT"
# - Cache refreshes every 1 hour
# - Can force sync rewards data
# - Distributed via TestFlight/Internal Testing
```

## Production Build (App Store)

```bash
# Build for App Store submission
eas build --profile production --platform ios

# Or for Android
eas build --profile production --platform android

# Features:
# - NO dev menu (completely hidden)
# - NO "Load Test Data" button
# - NO "Sync Rewards Data" button
# - NO environment badge
# - Cache refreshes every 24 hours
# - Clean, production-ready app
```

## How It Works

### Automatic Environment Detection

```typescript
// The app automatically detects environment:

if (__DEV__) {
  // Running locally with expo start
  environment = 'development'
}
else if (process.env.EXPO_PUBLIC_ENV === 'uat') {
  // Built with --profile uat
  environment = 'uat'
}
else {
  // Built with --profile production
  environment = 'production'
}
```

### Environment-Specific Config

Each environment gets different settings:

**Development:**
- GitHub sync: ✅ Enabled
- Cache TTL: 0 ms (always fetch fresh)
- Debug features: ✅ Show
- Log level: Debug (verbose)

**UAT:**
- GitHub sync: ✅ Enabled
- Cache TTL: 1 hour
- Debug features: ✅ Show (for testers)
- Log level: Info

**Production:**
- GitHub sync: ✅ Enabled
- Cache TTL: 24 hours
- Debug features: ❌ Hidden
- Log level: Error only

## TestFlight Deployment

### For Internal Testing (UAT)

```bash
# 1. Build UAT version
eas build --profile uat --platform ios

# 2. Submit to TestFlight
eas submit --platform ios --latest

# 3. Testers will see:
#    - "DEVELOPER" section in Settings
#    - Can manually sync rewards data
#    - Environment badge shows "UAT"
#    - Good for testing new features
```

### For External Testing (Production-like)

```bash
# 1. Build production version
eas build --profile production --platform ios

# 2. Submit to TestFlight
eas submit --platform ios --latest

# 3. External testers will see:
#    - NO developer section
#    - Clean production experience
#    - No debug features
#    - Identical to App Store version
```

## First Time EAS Setup

If you haven't used EAS Build before:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Initialize EAS in your project
eas build:configure

# Build your first UAT version
eas build --profile uat --platform ios
```

## Local Testing Different Environments

You can't fully test UAT/Production locally (they need proper builds), but you can preview the UI:

```typescript
// Temporarily force an environment in config/env.ts
export function getCurrentEnvironment(): Environment {
  return 'production'; // Force production mode
}
```

Then run `npm start` and you'll see how it looks in production (no dev menu).

**Remember to revert this change!**

## Security Notes

### Current Setup (Acceptable for MVP)

Your GitHub token is currently in `config/env.ts` which is fine for:
- Personal projects
- Small teams
- MVP/Beta testing

### For Production at Scale

Consider using EAS Secrets:

```bash
# Store token securely
eas secret:create --scope project --name GITHUB_TOKEN --value "ghp_xxx"
eas secret:create --scope project --name GITHUB_REPO --value "user/repo"

# Then update config/env.ts to read from env:
githubToken: process.env.EXPO_PUBLIC_GITHUB_TOKEN || '',
```

## Verifying Your Build

After building, test each environment:

### Development ✅
- Run `npm start`
- Open Settings
- Should see: DEVELOPER section with sync button

### UAT ✅
- Install TestFlight build
- Open Settings
- Should see: DEVELOPER section + "UAT" badge

### Production ✅
- Install TestFlight/App Store build
- Open Settings
- Should NOT see: DEVELOPER section
- Should see: Clean settings page

## Quick Reference

```bash
# Local development
npm start

# Build for testing (internal TestFlight)
eas build --profile uat --platform ios

# Build for App Store
eas build --profile production --platform ios

# Check what testers will see
# (build with uat profile)

# Check what users will see
# (build with production profile)
```

## Common Issues

**Q: TestFlight build shows dev features**
A: You built with `uat` profile. Use `production` profile for App Store.

**Q: Can't see dev features in TestFlight**
A: That's correct if you used `production` profile. Use `uat` profile for internal testing.

**Q: Cache not refreshing in development**
A: Perfect! Dev environment has 0 TTL (always fresh).

**Q: Want to test without dev features locally**
A: Temporarily change `getCurrentEnvironment()` to return `'production'`.

---

Your app is now properly configured for all stages of deployment! 🚀
