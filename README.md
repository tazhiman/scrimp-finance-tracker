# Finance Tracker App 💰

A modern, local-first personal finance tracking app built with React Native and Expo. Track your income, expenses, savings goals, and credit card spending all in one place.

## 📱 Features

- **Transaction Management**: Track income and expenses with categories
- **Savings Goals**: Set and monitor progress toward financial goals
- **Credit Card Tracking**: Monitor spending across multiple credit cards with minimum spend requirements
- **Calendar View**: Visual calendar showing daily transactions
- **Budget Tracking**: Automatic budget calculation based on income
- **Goal Reminders**: Optional notifications for due/overdue goals
- **Excel Export**: Export transactions to spreadsheet for analysis
- **Dark/Light Theme**: Toggle between dark and light modes
- **Local-First**: All data stored on device, no cloud sync required

## 🏗️ Tech Stack

### Core
- **React Native** (v0.81.5) - Mobile framework
- **Expo** (SDK 54) - Development platform
- **TypeScript** - Type safety

### Navigation & UI
- **Expo Router** (v6) - File-based navigation
- **React Navigation** - Bottom tabs
- **React Native Gesture Handler** - Touch interactions
- **Date-fns** - Date manipulation

### Data & Storage
- **AsyncStorage** - Local data persistence
- **Context API** - Global state management

### Features
- **expo-notifications** - Local push notifications
- **xlsx** - Excel export functionality
- **expo-file-system** - File operations
- **expo-sharing** - Share files
- **@react-native-community/datetimepicker** - Native date pickers

### Credit Cards (Optional)
- Remote card data syncing from GitHub
- Image caching for card visuals
- Dynamic reward calculations

## 📁 Project Structure

```
finance-tracker/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── index.tsx             # Dashboard (Home)
│   │   ├── transactions.tsx      # Transactions list & calendar
│   │   ├── goals.tsx             # Savings goals
│   │   ├── settings.tsx          # App settings
│   │   └── faq.tsx               # Help & FAQ
│   ├── _layout.tsx               # Root layout
│   ├── transaction/[id].tsx      # Transaction detail
│   └── goal/[id].tsx             # Goal detail
│
├── components/                   # Reusable UI components
│   ├── TransactionForm.tsx       # Add/edit transaction modal
│   ├── GoalForm.tsx              # Add/edit goal modal
│   ├── TransactionCalendarMonth.tsx  # Calendar view
│   ├── TransactionDayModal.tsx   # Daily transactions modal
│   ├── CreditCardStats.tsx       # Dashboard card stats
│   ├── CardManagementModal.tsx   # Credit card selection
│   └── TimePeriodSelector.tsx    # Day/Week/Month toggle
│
├── context/                      # Global state
│   ├── FinanceContext.tsx        # Financial data & operations
│   └── ThemeContext.tsx          # Theme management
│
├── utils/                        # Utility functions
│   ├── storage.ts                # AsyncStorage operations
│   ├── calculations.ts           # Budget & category calculations
│   ├── dateHelpers.ts            # Date formatting utilities
│   ├── notifications.ts          # Push notification scheduling
│   ├── excelExport.ts            # Excel export functionality
│   ├── cardEngine.ts             # Credit card recommendations
│   ├── remoteRewardsData.ts      # GitHub data syncing
│   └── widgetData.ts             # iOS widget data bridge
│
├── types/                        # TypeScript definitions
│   └── index.ts                  # All app types
│
├── constants/                    # Static data
│   ├── categories.ts             # Transaction categories
│   └── Colors.ts                 # Theme colors
│
├── data/                         # Static data files
│   └── rewardsData.json          # Credit card reward rules
│
├── config/                       # Configuration
│   ├── env.ts                    # Environment management
│   └── remoteConfig.ts           # Remote data config
│
├── ios/                          # iOS native code (if any)
│   ├── FinanceWidget/            # iOS widget extension
│   └── WidgetDataModule.swift    # Native bridge
│
├── assets/                       # Static assets
│   ├── icon.png                  # App icon
│   ├── splash.png                # Splash screen
│   └── adaptive-icon.png         # Android adaptive icon
│
├── app.json                      # Expo configuration
├── eas.json                      # EAS Build configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

## 🎨 Architecture

### Data Flow

```
User Action
    ↓
Component (UI)
    ↓
Context (State Management)
    ↓
Utility Functions (Business Logic)
    ↓
AsyncStorage (Persistence)
```

### Key Patterns

1. **Context + Hooks**: Global state managed via React Context
2. **Local-First**: All data stored locally with AsyncStorage
3. **File-Based Routing**: Expo Router for navigation
4. **Type Safety**: TypeScript throughout
5. **Component Composition**: Reusable, single-responsibility components

### State Management

**FinanceContext** manages:
- Transactions (income/expenses)
- Savings goals
- Recurring expenses
- Custom categories

**ThemeContext** manages:
- Dark/light mode
- Color schemes

### Data Models

```typescript
// Transaction
{
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;          // ISO date
  createdAt: string;     // ISO datetime
  description?: string;
  cardId?: string;       // Credit card used
}

// Savings Goal
{
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  frequency: 'weekly' | 'monthly';
  contributionAmount: number;
  lastContribution?: string;
}

// Credit Card
{
  id: string;
  name: string;
  currentSpend: number;
  lastUpdated?: string;
  isCustom?: boolean;
  minSpend?: number;
}
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or later)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI**: `npm install -g eas-cli`
- **iOS Simulator** (Mac only) or **Android Emulator**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
   
   *Note: `--legacy-peer-deps` is required due to React 19 peer dependency conflicts*

3. **Start development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on physical device

## 🛠️ Development Workflow

### Running the App

```bash
# Start development server
npx expo start

# Start with cache cleared
npx expo start -c

# Run on specific platform
npx expo run:ios
npx expo run:android
```

### Making Changes

1. **Edit files** - Changes hot-reload automatically
2. **Add dependencies** - Use `npx expo install <package>`
3. **Check types** - Run `npx tsc --noEmit`
4. **Test on device** - Use Expo Go or development build

### Common Commands

```bash
# Install Expo-compatible package
npx expo install <package-name>

# Install with legacy peer deps (when needed)
npm install <package-name> --legacy-peer-deps

# Clear cache
npx expo start -c

# View logs
npx react-native log-ios
npx react-native log-android
```

## 🌍 Environments

The app supports three environments with different configurations:

### 1. Development
- **When**: Running `npx expo start` locally
- **Features**: All debug features visible, no cache, verbose logging
- **Settings visible**: Yes (Developer section shown)

### 2. UAT (User Acceptance Testing)
- **When**: Building with `eas build --profile uat`
- **Features**: Debug features visible, 1-hour cache, testing mode
- **Settings visible**: Yes (Developer section shown)
- **Use case**: TestFlight beta testing

### 3. Production
- **When**: Building with `eas build --profile production`
- **Features**: No debug features, 24-hour cache, optimized
- **Settings visible**: No (Clean user experience)
- **Use case**: App Store release

### Environment Configuration

Settings are in `/config/env.ts`:

```typescript
const configs = {
  development: {
    enableRemoteSync: true,
    showDebugInfo: true,
    cacheTTL: 0,          // No cache
    logLevel: 'verbose',
  },
  uat: {
    enableRemoteSync: true,
    showDebugInfo: true,
    cacheTTL: 3600000,    // 1 hour
    logLevel: 'info',
  },
  production: {
    enableRemoteSync: true,
    showDebugInfo: false,
    cacheTTL: 86400000,   // 24 hours
    logLevel: 'error',
  },
};
```

### Detecting Environment

```typescript
import { ENV } from '@/config/env';

// Check current environment
if (ENV.isDevelopment) {
  console.log('Running in dev mode');
}

// Check if debug features should show
if (ENV.showDebugFeatures) {
  // Show developer options
}
```

## 📦 Building the App

### EAS Build Setup

1. **Login to Expo**
   ```bash
   eas login
   ```

2. **Configure project**
   ```bash
   eas build:configure
   ```

### Build Profiles

Defined in `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_ENV": "development"
      }
    },
    "uat": {
      "distribution": "internal",
      "channel": "uat",
      "env": {
        "EXPO_PUBLIC_ENV": "uat"
      }
    },
    "production": {
      "channel": "production",
      "env": {
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  }
}
```

### Building for iOS

```bash
# Development build (with dev client)
eas build --profile development --platform ios

# UAT build (for TestFlight testing)
eas build --profile uat --platform ios

# Production build (for App Store)
eas build --profile production --platform ios
```

### Building for Android

```bash
# Development build
eas build --profile development --platform android

# UAT build
eas build --profile uat --platform android

# Production build
eas build --profile production --platform android
```

### Build Process

1. **Trigger build** - Run `eas build` command
2. **Upload to EAS** - Code uploaded to Expo servers
3. **Build remotely** - App built in cloud (faster, no local setup needed)
4. **Download** - Get `.ipa` (iOS) or `.apk`/`.aab` (Android) file
5. **Install/Submit** - Install on device or submit to stores

## 🚢 Deployment

### TestFlight (iOS)

1. **Build with UAT profile**
   ```bash
   eas build --profile uat --platform ios
   ```

2. **Submit to TestFlight**
   ```bash
   eas submit --platform ios
   ```

3. **Internal/External Testing**
   - Add testers in App Store Connect
   - They receive TestFlight invitation
   - Debug features visible for testing

### App Store (iOS)

1. **Build with production profile**
   ```bash
   eas build --profile production --platform ios
   ```

2. **Submit to App Store**
   ```bash
   eas submit --platform ios
   ```

3. **App Store Connect**
   - Add screenshots, description
   - Submit for review
   - Production = clean, no debug features

### Google Play (Android)

1. **Build with production profile**
   ```bash
   eas build --profile production --platform android
   ```

2. **Submit to Play Store**
   ```bash
   eas submit --platform android
   ```

## 🔄 Over-The-Air (OTA) Updates

EAS Update allows pushing updates without rebuilding:

### Publishing Updates

```bash
# Publish to development channel
eas update --channel development --message "Bug fixes"

# Publish to UAT channel
eas update --channel uat --message "New feature testing"

# Publish to production channel
eas update --channel production --message "Release v1.0.1"
```

### What Can Be Updated OTA

✅ **Can update:**
- JavaScript code changes
- React components
- Styling changes
- Assets (images, fonts)
- Business logic

❌ **Cannot update (requires rebuild):**
- Native dependencies
- Native code changes
- App permissions
- Build configuration

### Update Strategy

1. **JS-only changes** → Use OTA update
2. **Native changes** → Rebuild and resubmit
3. **Critical bugs** → OTA update to fix quickly
4. **Major features** → New build version

## 🧪 Testing

### Local Testing

```bash
# Run on simulator/emulator
npx expo start
# Press 'i' (iOS) or 'a' (Android)

# Test on physical device
npx expo start
# Scan QR code with Expo Go
```

### Development Build Testing

Development builds include dev menu and debugging tools:

```bash
# Build dev client
eas build --profile development --platform ios

# Install on device
# Download .ipa and install via Xcode or drag to simulator
```

### TestFlight Testing (iOS)

1. Build with UAT profile
2. Submit to TestFlight
3. Add testers in App Store Connect
4. Testers receive invitation
5. Collect feedback

### Load Test Data

In development/UAT builds:
1. Go to Settings
2. Tap "Load Test Data" (Developer section)
3. Confirms loading 2 years of sample data
4. Restart app to see data

## 🐛 Troubleshooting

### Common Issues

#### Permission Errors

**Problem**: `EACCES: permission denied`

**Solution**:
```bash
# Fix node_modules permissions
sudo chown -R $(whoami) /Users/$(whoami)/Downloads/finance-tracker/node_modules
chmod -R u+x node_modules/.bin

# Fix EAS cache
sudo chown -R $(whoami) /Users/$(whoami)/Library/Caches/eas-cli/

# Fix Apple auth
sudo chown -R $(whoami) /Users/$(whoami)/.app-store/
```

**Prevention**: Never use `sudo` with npm/expo/eas commands!

#### Peer Dependency Conflicts

**Problem**: `ERESOLVE could not resolve`

**Solution**:
```bash
npm install --legacy-peer-deps
# or
npx expo install <package> -- --legacy-peer-deps
```

#### Cache Issues

**Problem**: Old code running, changes not showing

**Solution**:
```bash
# Clear Metro bundler cache
npx expo start -c

# Clear npm cache
npm cache clean --force

# Delete and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### Build Failures

**Problem**: EAS build fails

**Solution**:
1. Check EAS build logs for specific error
2. Ensure `app.json` and `eas.json` are valid
3. Verify all dependencies are compatible
4. Try clearing cache: `eas build --clear-cache`

#### Widget Not Showing

**Problem**: iOS widget not appearing

**Solution**:
- Widgets only work in development/production builds
- Not available in Expo Go
- Requires native iOS widget extension files
- See `WIDGET_SETUP.md` for configuration

### Getting Help

1. **Check logs**: `npx react-native log-ios` or `npx react-native log-android`
2. **Expo docs**: https://docs.expo.dev
3. **EAS docs**: https://docs.expo.dev/eas
4. **GitHub issues**: Check project issues for similar problems

## 📚 Key Concepts

### Local-First Architecture

All data is stored locally using AsyncStorage:
- No internet required (except for optional credit card data sync)
- Privacy-focused (data never leaves device)
- Fast performance (no network latency)
- Works offline by default

### File-Based Routing (Expo Router)

Files in `/app` become routes automatically:
```
app/(tabs)/index.tsx       →  /
app/(tabs)/transactions.tsx →  /transactions
app/transaction/[id].tsx    →  /transaction/123
```

Benefits:
- No manual route configuration
- Type-safe navigation
- Automatic deep linking
- Nested layouts

### Context Pattern

Global state without external libraries:
```typescript
// Provider wraps app
<FinanceProvider>
  <App />
</FinanceProvider>

// Components access via hook
const { transactions, addTransaction } = useFinance();
```

### AsyncStorage Pattern

Simple key-value persistence:
```typescript
// Save
await AsyncStorage.setItem('@transactions', JSON.stringify(data));

// Load
const data = await AsyncStorage.getItem('@transactions');
const transactions = JSON.parse(data || '[]');
```

## 🎯 Best Practices

### Code Organization

1. **Components**: Small, focused, reusable
2. **Utils**: Pure functions, no side effects
3. **Context**: Global state only (not UI state)
4. **Types**: Define interfaces for all data structures
5. **Constants**: Extract magic numbers/strings

### Performance

1. **Memoization**: Use `useMemo` for expensive calculations
2. **Callbacks**: Use `useCallback` for function props
3. **FlatList**: Use for long lists (built-in virtualization)
4. **Avoid inline styles**: Define styles outside components
5. **Lazy loading**: Load data only when needed

### TypeScript

1. **No `any`**: Always type your data
2. **Interfaces**: Define clear data contracts
3. **Type imports**: `import type { ... }`
4. **Generics**: Use for flexible, type-safe functions
5. **Strict mode**: Keep TypeScript strict

### Git Workflow

1. **Feature branches**: Create branch per feature
2. **Commits**: Clear, descriptive messages
3. **Pull requests**: Review before merge
4. **Versioning**: Follow semantic versioning (v1.0.0)

## 📖 Additional Resources

### Expo Documentation
- **Expo Docs**: https://docs.expo.dev
- **Expo Router**: https://docs.expo.dev/router/introduction/
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **EAS Submit**: https://docs.expo.dev/submit/introduction/

### React Native
- **React Native Docs**: https://reactnative.dev
- **React Navigation**: https://reactnavigation.org
- **TypeScript**: https://www.typescriptlang.org/docs/

### Project-Specific Docs
- `WIDGET_SETUP.md` - iOS widget implementation
- `WIDGET_README.md` - Widget features and customization
- `DEVELOPER_GUIDE.md` - Credit card data sync setup
- `BUILD_GUIDE.md` - Environment-specific building

## 🤝 Contributing

### Adding Features

1. Create feature branch
2. Implement with TypeScript
3. Test on iOS and Android
4. Update documentation
5. Submit pull request

### Code Style

- **Formatting**: Prettier (runs on commit)
- **Linting**: ESLint rules
- **TypeScript**: Strict mode enabled
- **Comments**: Explain "why", not "what"

## 📄 License

[Your License Here]

## 🙏 Acknowledgments

- Expo team for amazing tooling
- React Native community
- Open source contributors

---

**Questions?** Check the FAQ in the app or review the documentation in `/docs`.

**Issues?** See the Troubleshooting section above or create a GitHub issue.

**Happy coding! 🚀**
