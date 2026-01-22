# Finance Tracker

A gamified personal finance tracking app built with Expo and React Native, inspired by Apple Fitness.

## Features

- **Savings Goals**: Set and track multiple savings goals with customizable contribution frequencies
- **Transaction Tracking**: Record income and expenses with categories
- **Time Period Views**: View your finances by day, week, or month
- **Gamification**: 
  - Progress rings (Apple Fitness style)
  - Level and XP system
  - Achievement badges
  - Activity streaks
- **Intuitive UI**: Clean, modern interface with dark theme

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your preferred platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Project Structure

```
finance-tracker/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── context/               # React Context providers
├── utils/                 # Utility functions
├── types/                 # TypeScript type definitions
└── constants/             # App constants (colors, categories)
```

## Key Technologies

- **Expo**: React Native framework
- **TypeScript**: Type safety
- **Expo Router**: File-based routing
- **React Context**: State management
- **AsyncStorage**: Local data persistence
- **React Native Reanimated**: Smooth animations
- **React Native SVG**: Custom progress rings
- **date-fns**: Date utilities

## Features in Detail

### Savings Goals
- Create multiple savings goals
- Set target amounts and contribution frequencies (daily/weekly/monthly)
- Auto-calculate recommended contribution amounts
- Visual progress tracking with circular progress indicators

### Transactions
- Add income and expense transactions
- Categorize transactions
- Filter by time period (day/week/month)
- View spending breakdown by category

### Gamification
- **Levels**: Earn XP from saving money, completing goals, and maintaining streaks
- **Badges**: Unlock achievements for milestones
- **Streaks**: Track consecutive days of activity
- **Progress Rings**: Visual indicators for savings and spending goals

## Data Storage

All data is stored locally on the device using AsyncStorage. This ensures:
- Fast performance
- Offline functionality
- Privacy (data stays on device)

Future versions may include cloud sync capabilities.

## Development

### Type Checking
```bash
npx tsc --noEmit
```

### Building
```bash
# iOS
expo build:ios

# Android
expo build:android
```

## License

MIT

