# Finance Tracker iOS Widget

A beautiful, themed iOS home screen widget that displays your spending at a glance.

## Features

### Widget Sizes

#### **Small Widget (2x2)**
- Today's spending total
- Quick "Add Expense" button
- Minimal, focused design

#### **Medium Widget (4x2)**
- Today's spending
- Monthly spending with progress bar
- Budget tracking
- "Add Expense" and "Open App" buttons

#### **Large Widget (4x4)**
- Detailed today's spending
- Monthly budget with percentage
- Color-coded progress bar:
  - Green (< 75%): On track
  - Orange (75-90%): Warning
  - Red (> 90%): Over budget
- Multiple quick action buttons
- Current time display

## Design

All widgets match the app's dark theme:
- **Background**: `#121212` (pure black)
- **Cards**: `#2A2A2A` (dark gray)
- **Primary**: `#BFFF0A` (lime green)
- **Accent**: `#FF6B2C` (orange)
- **Text**: `#E6E6E6` (light gray)

## Quick Actions

Tapping widget buttons opens the app to specific screens:
- **Add Expense**: Opens transaction form
- **Open App**: Opens main dashboard
- **View**: Opens transactions list
- **Goals**: Opens goals screen

## Data Updates

The widget automatically updates:
- **Every 15 minutes** (iOS system schedule)
- **When you add transactions** (immediate)
- **When widget appears** (on wake/unlock)

## Setup

See [WIDGET_SETUP.md](./WIDGET_SETUP.md) for detailed installation instructions.

### Quick Start

1. Build with EAS: `eas build --profile development --platform ios`
2. Install on device
3. Long-press home screen → Add Widget
4. Search "Finance Tracker"
5. Choose size and add

## Technical Details

- **Platform**: iOS 14.0+
- **Framework**: SwiftUI + WidgetKit
- **Update Interval**: 15 minutes
- **Data Sharing**: App Groups
- **Deep Linking**: Custom URL scheme
- **Battery Impact**: Minimal

## File Structure

```
ios/
├── FinanceWidget/
│   ├── FinanceWidget.swift    # Widget UI and logic
│   └── Info.plist             # Widget configuration
├── WidgetDataModule.swift     # Native bridge
└── WidgetDataModule.m         # Objective-C bridge

utils/
└── widgetData.ts              # React Native API

context/
└── FinanceContext.tsx         # Auto-updates widget
```

## Limitations

- **Expo Go**: Widgets don't work in Expo Go (requires dev/production build)
- **Android**: No widget support yet (iOS only)
- **Live Updates**: Maximum once per 15 minutes (iOS restriction)
- **Interactivity**: Limited to button taps (no text input)

## Customization

### Change Update Frequency

Edit `FinanceWidget.swift`:

```swift
// Update every 15 minutes (default)
let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!

// Change to 30 minutes
let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
```

### Modify Colors

Edit `FinanceWidgetEntryView` in `FinanceWidget.swift`:

```swift
let backgroundColor = Color(red: 18/255, green: 18/255, blue: 18/255)
let primaryColor = Color(red: 191/255, green: 255/255, blue: 10/255)
let accentColor = Color(red: 255/255, green: 107/255, blue: 44/255)
```

### Add More Sizes

Add support for additional widget families:

```swift
.supportedFamilies([
  .systemSmall,
  .systemMedium,
  .systemLarge,
  .systemExtraLarge  // iPad only
])
```

## Troubleshooting

### Widget Not Showing
- Ensure you're using a development/production build
- Check App Groups are enabled in Xcode
- Verify bundle identifiers match

### Data Not Updating
- Check console logs in Xcode
- Verify `updateWidgetData()` is being called
- Force-remove and re-add widget

### Buttons Not Working
- Verify URL scheme in `app.json`
- Check deep link handling in `_layout.tsx`
- Test with: `xcrun simctl openurl booted financetracker://add`

## Performance

- **Size**: ~100KB
- **Memory**: Minimal (< 10MB)
- **CPU**: Negligible
- **Battery**: < 1% daily impact
- **Network**: None (uses local data)

## Future Enhancements

Potential features:
- [ ] Category breakdown
- [ ] Week-over-week comparison
- [ ] Card spending progress
- [ ] Goal progress rings
- [ ] Configurable budget in widget
- [ ] Dark/light theme toggle
- [ ] Android widget support

## Support

For issues or questions:
1. Check [WIDGET_SETUP.md](./WIDGET_SETUP.md)
2. Review Xcode console logs
3. Verify all setup steps completed
4. Test in development build first

---

**Note**: Widgets are native iOS features and require proper Xcode configuration. They do not work in Expo Go.
