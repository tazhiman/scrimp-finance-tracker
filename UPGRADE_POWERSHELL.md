# Expo SDK 54 Upgrade - PowerShell Commands

## Step-by-Step Upgrade Commands (PowerShell)

Run these commands in PowerShell, one at a time:

### 1. Remove old node_modules
```powershell
Remove-Item -Recurse -Force node_modules
```

### 2. Remove package-lock.json (if it exists)
```powershell
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
```

### 3. Clean npm cache
```powershell
npm cache clean --force
```

### 4. Install dependencies
```powershell
npm install
```

### 5. Fix Expo package versions (IMPORTANT)
```powershell
npx expo install --fix
```

### 6. Clear Expo cache and start
```powershell
npx expo start --clear --port 5000
```

## All-in-One Script (Optional)

You can also run all commands at once:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue; Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue; npm cache clean --force; npm install; npx expo install --fix
```

Then start the server:
```powershell
npx expo start --clear --port 5000
```

## Alternative: Using Tunnel Mode

If you still have connection issues:
```powershell
npx expo start --tunnel --port 5000 --clear
```

