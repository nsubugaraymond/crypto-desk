# Local Development Setup Guide

Step-by-step guide to run the Crypto Desk USDT Wallet DApp locally using VS Code.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20 or higher) - [Download](https://nodejs.org/)
  - ⚠️ **Important**: Node.js 20+ is required for Expo SDK 54
- **Bun** (latest version) - [Install](https://bun.sh/)
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
- **VS Code** - [Download](https://code.visualstudio.com/)
- **Expo Go App** on your mobile device:
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## Step-by-Step Installation

### Step 1: Open Project in VS Code

1. Launch VS Code
2. Click `File` → `Open Folder`
3. Navigate to this project folder and select it
4. Click `Open`

### Step 2: Open Terminal

In VS Code:
- **Windows/Linux**: Press `` Ctrl+` ``
- **macOS**: Press `` Cmd+` ``
- Or click `Terminal` → `New Terminal` from the menu

### Step 3: Install Dependencies

In the terminal, run:

```bash
bun install
```

Wait for the installation to complete. This will install all packages listed in `package.json`.

### Step 4: Start Development Server

**⚠️ Important:** Due to Bun/Expo CLI compatibility, use npm for running the app:

```bash
npm run dev
```

**Alternative options:**

```bash
# Start with tunnel (works on any network)
npm run dev

# Start for web only
npm run dev-web

# Start on local network (fastest, requires same WiFi)
npm run dev-local
```

The terminal will display a QR code after the server starts.

### Step 5: Run on Your Device

#### Option A: Mobile Device (Recommended)

1. Open **Expo Go** app on your phone
2. **On iOS**: Scan the QR code with your camera app
3. **On Android**: Scan the QR code within the Expo Go app
4. Wait for the app to load on your device

#### Option B: Web Browser

In the terminal:
- Press `w` to open in web browser

Or run directly:
```bash
npm run dev-web
```

Then open `http://localhost:8081` in your browser.

#### Option C: iOS Simulator (macOS only)

In the terminal:
- Press `i` to open iOS Simulator

#### Option D: Android Emulator

In the terminal:
- Press `a` to open Android Emulator

---

## VS Code Recommended Extensions

Install these for better development experience:

1. **ES7+ React/Redux/React-Native snippets**
   - Search in Extensions: `dsznajder.es7-react-js-snippets`

2. **Prettier - Code formatter**
   - Search in Extensions: `esbenp.prettier-vscode`

3. **ESLint**
   - Search in Extensions: `dbaeumer.vscode-eslint`

4. **React Native Tools**
   - Search in Extensions: `msjsdiag.vscode-react-native`

To install extensions:
1. Click the Extensions icon in the sidebar (or press `Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search for the extension name
3. Click `Install`

---

## Useful Terminal Commands

Once the dev server is running, you can press:

| Key | Action |
|-----|--------|
| `r` | Reload app |
| `m` | Toggle menu |
| `s` | Switch connection type |
| `w` | Open in web browser |
| `i` | Open iOS Simulator (macOS) |
| `a` | Open Android Emulator |
| `j` | Open debugger |
| `c` | Clear Metro bundler cache |

---

## Common Issues & Solutions

### Issue: "Command not found: bun"

**Solution:**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Restart your terminal
```

### Issue: "Cannot connect to Metro server"

**Solution:**
```bash
# Clear cache and restart
npx expo start --clear
```

### Issue: "Port 8081 already in use"

**Solution:**
```bash
# Kill the process using port 8081 (macOS/Linux)
lsof -ti:8081 | xargs kill -9

# Or on Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Or use npx
npx kill-port 8081
```

### Issue: "configs.toReversed is not a function" or "Unknown file extension" error

**Solution:**
You're using Node.js v18 or lower. Expo SDK 54 requires Node.js 20+:

```bash
# Check your Node.js version
node --version

# If it shows v18.x.x or lower, upgrade Node.js:
# Option 1: Download from https://nodejs.org/ (get LTS version 20+)

# Option 2: Using nvm (Node Version Manager)
# Install nvm: https://github.com/nvm-sh/nvm
nvm install 20
nvm use 20

# Option 3: Using Homebrew (macOS)
brew update
brew upgrade node

# After upgrading, verify:
node --version  # Should show v20.x.x or higher

# Then restart your terminal and run:
npm run dev
```

### Issue: "Expo Go can't connect"

**Solution:**
- Ensure phone and computer are on the same WiFi
- Disable VPN if active
- Try tunnel mode (already enabled in this project)
- Check firewall settings

### Issue: "Module not found" errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
bun install

# Clear cache
npx expo start --clear
```

---

## Project Structure Overview

```
├── app/                    # Main application screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home screen
│   │   ├── send.tsx       # Send crypto
│   │   ├── receive.tsx    # Receive crypto
│   │   ├── history.tsx    # Transaction history
│   │   └── settings.tsx   # Settings
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── contexts/             # State management
├── hooks/                # Custom React hooks
├── services/             # API & blockchain services
├── utils/                # Helper functions
└── constants/            # App constants
```

---

## Development Tips

### Live Reload

- Save any file (`Ctrl+S` / `Cmd+S`)
- The app automatically reloads on your device
- Check the terminal for errors

### Debugging

1. In the terminal, press `j` to open debugger
2. Or shake your device and select "Debug"
3. Chrome DevTools will open for debugging

### Viewing Logs

- All `console.log()` statements appear in the VS Code terminal
- Or shake your device and view logs in Expo Go

### Hot Keys in VS Code

- `Ctrl+P` / `Cmd+P` - Quick file open
- `Ctrl+Shift+F` / `Cmd+Shift+F` - Search in all files
- `F12` - Go to definition
- `Shift+F12` - Find all references
- `Ctrl+B` / `Cmd+B` - Toggle sidebar

---

## Environment Variables

This project uses environment variables for configuration:

- `EXPO_PUBLIC_RORK_DB_ENDPOINT`
- `EXPO_PUBLIC_RORK_DB_NAMESPACE`
- `EXPO_PUBLIC_RORK_DB_TOKEN`

These are automatically configured when running via `bunx rork start`.

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Start dev server
3. ✅ Run on device
4. 📝 Make your first code change
5. 💾 Save and watch it reload
6. 🚀 Start building!

---

## Need Help?

- **Expo Docs**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **VS Code Docs**: https://code.visualstudio.com/docs

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with tunnel (recommended) |
| `npm run dev-web` | Start for web browser only |
| `npm run dev-local` | Start on local network (fastest) |
| `bun install` | Install dependencies |
| `npm start` | Rork platform start (may have compatibility issues) |

Happy coding! 🎉