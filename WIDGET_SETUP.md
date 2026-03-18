# iOS Widget Setup Guide

This guide will help you set up the iOS home screen widget for the Finance Tracker app.

## Overview

The widget displays:
- **Small (2x2)**: Today's spending with quick "Add Expense" button
- **Medium (4x2)**: Today's and monthly spending with progress bar and quick actions
- **Large (4x4)**: Detailed spending overview with budget progress and multiple quick actions

All widgets follow the app's dark theme with the same color scheme:
- Background: `#121212`
- Primary: `#BFFF0A` (lime green)
- Accent: `#FF6B2C` (orange)
- Card Background: `#2A2A2A`

## Prerequisites

- Xcode 13.0 or later
- iOS 14.0+ target deployment
- EAS Build or Development Build (widgets don't work in Expo Go)

## Setup Steps

### 1. Configure App Groups

App Groups allow the widget to share data with the main app.

**In Xcode:**

1. Open your project in Xcode
2. Select the main app target
3. Go to "Signing & Capabilities"
4. Click "+ Capability" and add "App Groups"
5. Enable a new group: `group.com.scrimp.app`
6. Repeat for the widget extension target

### 2. Add Widget Extension to Xcode Project

The widget files are already created in `/ios/FinanceWidget/`:
- `FinanceWidget.swift` - Main widget code
- `Info.plist` - Widget configuration

**In Xcode:**

1. File → New → Target
2. Choose "Widget Extension"
3. Name it "FinanceWidget"
4. Bundle Identifier: `com.financetracker.app.FinanceWidget`
5. Don't include configuration intent
6. Replace the generated files with the ones in `/ios/FinanceWidget/`

### 3. Add Native Module Files

Copy these files to your Xcode project:
- `/ios/WidgetDataModule.swift`
- `/ios/WidgetDataModule.m`

**In Xcode:**

1. Right-click on project → Add Files
2. Select both files
3. Ensure "Copy items if needed" is checked
4. Add to the main app target (not the widget target)

### 4. Update app.json

Add the URL scheme for deep linking (already configured):

```json
{
  "expo": {
    "scheme": "financetracker",
    "ios": {
      "bundleIdentifier": "com.financetracker.app",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["financetracker"]
          }
        ]
      }
    }
  }
}
```

### 5. Handle Deep Links in App

The widget uses these deep link URLs:
- `financetracker://` - Open app
- `financetracker://add` - Open add transaction screen
- `financetracker://transactions` - Open transactions tab
- `financetracker://goals` - Open goals tab

**Update `app/_layout.tsx` to handle deep links:**

```typescript
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

// In your root component
const router = useRouter();

useEffect(() => {
  const handleDeepLink = (event: { url: string }) => {
    const { path } = Linking.parse(event.url);
    
    switch (path) {
      case 'add':
        router.push('/(tabs)');
        // Open add transaction modal
        break;
      case 'transactions':
        router.push('/(tabs)');
        break;
      case 'goals':
        router.push('/(tabs)/goals');
        break;
      default:
        router.push('/(tabs)');
    }
  };

  const subscription = Linking.addEventListener('url', handleDeepLink);
  
  // Handle initial URL if app was closed
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleDeepLink({ url });
    }
  });

  return () => subscription.remove();
}, []);
```

### 6. Build with EAS

**Option A: Development Build**

```bash
# Create development build with widget
eas build --profile development --platform ios

# Install on device
# Widget will appear in widget gallery
```

**Option B: Production Build**

```bash
# Create production build
eas build --profile production --platform ios

# Submit to TestFlight/App Store
eas submit --platform ios
```

### 7. Add Widget to Home Screen

Once installed on device:

1. Long-press on home screen
2. Tap "+" in top-left corner
3. Search for "Finance Tracker"
4. Choose widget size (Small, Medium, or Large)
5. Tap "Add Widget"

## How It Works

### Data Flow

1. **App → Widget**:
   - When transactions are added/updated, `FinanceContext` calls `updateWidgetData()`
   - Data is written to shared UserDefaults via App Groups
   - Widget timelines are reloaded via `WidgetCenter`

2. **Widget → App**:
   - User taps widget buttons
   - Deep links open the app to specific screens
   - Widget updates every 15 minutes automatically

### Data Stored

The widget accesses these shared values:
- `todaySpending`: Current day's expenses
- `monthlySpending`: Current month's expenses
- `monthlyBudget`: User's monthly budget

### Update Frequency

- **Automatic**: Every 15 minutes
- **Manual**: When app updates transactions
- **System**: When widget appears on screen

## Troubleshooting

### Widget Not Appearing

1. Ensure App Groups are configured correctly
2. Check bundle identifiers match
3. Rebuild with `eas build`
4. Widgets don't work in Expo Go

### Widget Not Updating

1. Check `updateWidgetData()` is being called
2. Verify App Group identifier matches in both targets
3. Look for errors in Xcode console
4. Try force-removing and re-adding widget

### Deep Links Not Working

1. Verify URL scheme in `app.json`
2. Check deep link handling in `_layout.tsx`
3. Test with `xcrun simctl openurl booted financetracker://add`

## Testing in Simulator

```bash
# Open simulator
open -a Simulator

# Run development build
npx expo run:ios

# Test deep links
xcrun simctl openurl booted financetracker://add
```

## Design Customization

Widget colors are defined in `FinanceWidget.swift`:

```swift
let backgroundColor = Color(red: 18/255, green: 18/255, blue: 18/255)
let primaryColor = Color(red: 191/255, green: 255/255, blue: 10/255)
let accentColor = Color(red: 255/255, green: 107/255, blue: 44/255)
```

Modify these values to match any theme changes.

## Performance

- Widget refreshes every 15 minutes (configurable in `getTimeline`)
- Minimal battery impact
- Data updates are async and non-blocking
- Widget size: ~100KB

## Requirements

- **Minimum iOS**: 14.0
- **Xcode**: 13.0+
- **React Native**: 0.64+
- **Expo SDK**: 45+

## Next Steps

After setup:
1. Test all three widget sizes
2. Verify deep links work correctly
3. Check widget updates when adding transactions
4. Submit to TestFlight for beta testing

## Support

For issues:
1. Check Xcode build logs
2. Verify App Groups are enabled
3. Ensure bundle identifiers match
4. Test in development build first

---

**Note**: Widgets are a native iOS feature and require a development/production build. They will not work in Expo Go.
