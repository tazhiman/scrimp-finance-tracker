# Quick Start Guide

## First Time Setup

1. **Install Node.js** (if not already installed)
   - Download from https://nodejs.org/
   - Version 18 or later recommended

2. **Install Expo CLI globally**
   ```bash
   npm install -g expo-cli
   ```

3. **Install project dependencies**
   ```bash
   npm install
   ```
   
   **Important**: After installing, run this to ensure all Expo packages are compatible:
   ```bash
   npx expo install --fix
   ```

4. **Add app icons and splash screens** (optional)
   - Place your assets in the `assets/` directory:
     - `icon.png` (1024x1024)
     - `splash.png` (1242x2436)
     - `adaptive-icon.png` (1024x1024)
     - `favicon.png` (48x48)

## Running the App

1. **Start the development server**
   ```bash
   npm start
   ```

2. **Run on your device/simulator**
   - Press `i` for iOS Simulator (Mac only)
   - Press `a` for Android Emulator
   - Scan the QR code with Expo Go app on your phone

## Project Structure

- `app/` - Screen components (Expo Router)
- `components/` - Reusable UI components
- `context/` - React Context providers for state
- `utils/` - Helper functions
- `types/` - TypeScript type definitions
- `constants/` - App constants (colors, categories)

## Key Features

✅ Savings goals with progress tracking
✅ Transaction tracking (income/expense)
✅ Time period filtering (day/week/month)
✅ Gamification (levels, badges, streaks)
✅ Apple Fitness-style progress rings
✅ Dark theme UI

## Troubleshooting

### Connection Issues with Expo Go

**Error: "Could not connect to the server"**

Try these solutions in order:

1. **Use Tunnel Mode** (Recommended - works across networks)
   ```bash
   npm run start:tunnel
   ```
   This creates a tunnel through Expo's servers, so your phone and computer don't need to be on the same network.

2. **Use LAN Mode** (If on same network)
   ```bash
   npm run start:lan
   ```
   This explicitly uses your local network IP address.

3. **Check Network Connection**
   - Ensure your phone and computer are on the same Wi-Fi network
   - Try disconnecting and reconnecting to Wi-Fi on both devices
   - Some corporate/school networks block peer-to-peer connections

4. **Check Firewall Settings**
   - Windows: Allow Node.js through Windows Firewall
   - Mac: Allow Node.js through System Preferences > Security & Privacy > Firewall
   - Temporarily disable firewall to test if it's the issue

5. **Try Default Port**
   - If port 5000 doesn't work, try: `expo start` (uses default port 8081)
   - Then scan the QR code again

6. **Clear Cache and Restart**
   ```bash
   expo start -c --port 5000
   ```

7. **Manual Connection**
   - In Expo Go, tap "Enter URL manually"
   - Enter: `exp://YOUR_COMPUTER_IP:5000`
   - Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

**Issue: Module not found errors**
- Run `npm install` again
- Clear cache: `expo start -c`

**Issue: TypeScript errors**
- Ensure all dependencies are installed
- Check `tsconfig.json` paths are correct

**Issue: Icons not showing**
- Install `@expo/vector-icons` if missing
- Run `npm install @expo/vector-icons`

