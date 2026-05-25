# Crypto Desk USDT Wallet DApp - Setup Guide

A secure, feature-rich TRON wallet application for managing USDT (TRC20) and TRX on the TRON blockchain. Built with React Native and Expo for cross-platform support (iOS, Android, and Web).

## Features

- 🔐 **Secure Wallet Management**: Create new wallets or import existing ones using mnemonic phrases or private keys
- 💰 **Multi-Currency Support**: Manage both USDT (TRC20) and TRX tokens
- 📊 **Transaction History**: View complete transaction history with real-time status updates
- 🔒 **PIN & Biometric Security**: Protect your wallet with PIN code and Face ID/Touch ID
- 📱 **QR Code Scanner**: Easily scan wallet addresses for sending transactions
- 🔔 **Push Notifications**: Get notified about incoming transactions
- 🌐 **Multi-Network Support**: Works on TRON Mainnet and Nile Testnet
- 📈 **Admin Dashboard**: Monitor users and collect profits (admin access required)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Bun** (v1.0 or higher) - [Download](https://bun.sh/)
- **Expo CLI** - Will be installed automatically
- **Git** - [Download](https://git-scm.com/)

### For Mobile Development:
- **iOS**: macOS with Xcode installed (for iOS development)
- **Android**: Android Studio with Android SDK (for Android development)
- **Expo Go App**: Install on your mobile device for testing
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <project-directory>
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Setup

The app uses the following environment variables (pre-configured):

```env
EXPO_PUBLIC_RORK_DB_ENDPOINT
EXPO_PUBLIC_RORK_DB_NAMESPACE
EXPO_PUBLIC_RORK_DB_TOKEN
```

These are system-managed and don't require manual configuration.

### 4. Configure TRON Network

The wallet is configured for TRON Nile Testnet by default. To switch to Mainnet:

1. Open `services/tronService.ts`
2. Update the `TRON_NETWORK` constant:
   ```typescript
   const TRON_NETWORK = 'mainnet'; // or 'nile' for testnet
   ```
3. Update USDT contract address for the corresponding network

## Running the App

### Web Development

```bash
bun run start-web
```

The app will open in your browser at `http://localhost:8081`

### Mobile Development (Expo Go)

```bash
bun start
```

This will:
1. Start the development server
2. Display a QR code in the terminal
3. Scan the QR code with:
   - **iOS**: Camera app → tap the notification
   - **Android**: Expo Go app → Scan QR code

### Production Build

For production builds, you'll need to use EAS Build. Contact support for build configuration.

## Project Structure

```
├── app/                      # Main application screens
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── index.tsx        # Wallet overview
│   │   ├── send.tsx         # Send transactions
│   │   ├── receive.tsx      # Receive funds
│   │   ├── history.tsx      # Transaction history
│   │   └── settings.tsx     # App settings
│   ├── admin.tsx            # Admin dashboard
│   └── _layout.tsx          # Root layout with providers
├── components/              # Reusable UI components
├── services/               # Business logic services
│   ├── tronService.ts      # TRON blockchain interactions
│   └── notificationService.ts # Push notifications
├── hooks/                  # Custom React hooks
│   └── useWalletStore.ts   # Wallet state management
├── contexts/               # React Context providers
├── backend/               # tRPC backend
│   └── trpc/              # API routes
│       └── routes/
│           ├── admin.ts   # Admin endpoints
│           └── users.ts   # User tracking
└── utils/                 # Utility functions
```

## Key Technologies

- **React Native 0.81** - Mobile framework
- **Expo SDK 54** - Development platform
- **TypeScript** - Type safety
- **Expo Router** - File-based navigation
- **TronWeb 6.1** - TRON blockchain integration
- **Zustand** - State management
- **React Query** - Server state management
- **tRPC** - Type-safe API
- **Hono** - Backend framework

## Usage Guide

### First Time Setup

1. **Launch the App**: Open the app on your device
2. **Create/Import Wallet**:
   - **Create New**: Generate a new wallet with a 12-word mnemonic phrase
   - **Import Mnemonic**: Import existing wallet using 12-word phrase
   - **Import Private Key**: Import using TRON private key
3. **Backup Mnemonic**: Write down and securely store your mnemonic phrase
4. **Set PIN**: Create a 6-digit PIN for app access
5. **Enable Biometrics**: (Optional) Enable Face ID/Touch ID

### Admin Dashboard

Access the admin panel to monitor users and collect profits.

#### Accessing Admin

1. Navigate to the **Settings** tab
2. Scroll to bottom and tap "Admin Panel"
3. Enter admin credentials

#### Admin Features

- **User Statistics**: View total users and active wallets
- **Transaction Volume**: Monitor total USDT/TRX processed
- **Profit Collection**: Collect accumulated profits to your address
- **User List**: View all registered wallet addresses

## Security Best Practices

⚠️ **Important Security Notes:**

1. **Never share your mnemonic phrase or private key** with anyone
2. **Backup your mnemonic phrase** in a secure offline location
3. **Use a strong PIN** (avoid sequential numbers like 123456)
4. **Enable biometric authentication** for additional security
5. **Verify recipient addresses** before sending transactions

## Troubleshooting

### Transaction Failed

- Ensure sufficient TRX balance for network fees (minimum 15-20 TRX recommended)
- Verify recipient address is valid
- Check transaction on [Tronscan](https://tronscan.org/) for details

### Balance Not Updating

- Pull down on the wallet screen to refresh
- Check network connection
- Verify you're connected to the correct network (Mainnet/Testnet)

## Support

For support and questions:

- Open an issue on GitHub
- Documentation: [WALLET_GUIDE.md](./WALLET_GUIDE.md)

## License

Copyright © 2026 Crypto Desk. All rights reserved.

## Disclaimer

This wallet software is provided "as is" without warranty of any kind. Users are responsible for securing their mnemonic phrases and private keys.

**Use at your own risk.**
