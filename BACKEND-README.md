# zkFetch Bybit Demo

This demo shows how to generate zero-knowledge proofs of Bybit wallet balances using zkFetch and Reclaim Protocol.

## Prerequisites

- Node.js version 18 or higher
- npm or yarn
- ngrok account (free tier works fine)
- Bybit testnet API credentials (optional, demo mode works without them)

### Required Bybit API Permissions

When creating your Bybit testnet API key, ensure it has these permissions:
- Contracts - Orders Positions
- USDC Contracts - Trade
- Unified Trading - Trade
- SPOT - Trade
- Wallet - Account Transfer Subaccount Transfer
- Exchange - Convert，Exchange History
- P2P - Orders Ads
- Bybit Pay - Orders Read-Only

> **Note**: Missing permissions may result in authentication errors or incomplete balance data.

## Setup Instructions

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm install --prefix . express cors axios dotenv
```

### 2. Configure Environment Variables

```bash
# Copy the example environment files
cp backend.env.example .env

# Edit .env and add your Bybit API credentials (optional)
# BYBIT_API_KEY=your_actual_api_key_here
# BYBIT_API_SECRET=your_actual_api_secret_here

# Create .env.local for frontend Reclaim credentials
cp .env.example .env.local
# Add your Reclaim credentials from dev.reclaimprotocol.org
```

### 3. Start the Services (Use 3 separate terminals)

#### Terminal 1: Backend Server
```bash
# Start the backend server
node backend-server.js

# The backend will run on http://localhost:3001
```

#### Terminal 2: ngrok Tunnel
```bash
# Install ngrok if you haven't already
npm install -g ngrok
# OR
brew install ngrok

# Start ngrok tunnel to backend
ngrok http 3001

# Copy the generated HTTPS URL (e.g., https://1234abcd.ngrok-free.app)
# You'll need this URL for the frontend configuration
```

#### Terminal 3: Frontend
```bash
# Update the Bybit API URL in src/App.js
# Find the bybit example configuration and update the url to your ngrok URL:
# url: 'https://your-ngrok-url.ngrok-free.app/api/wallet-balance'

# Start the frontend
npm start

# The frontend will run on http://localhost:3000
```

## Testing the Bybit Example

1. **Backend Status**:
   - Visit `http://localhost:3001/health` to verify the backend is running
   - You should see API status and endpoints information

2. **ngrok Status**:
   - Keep the ngrok terminal open to maintain the tunnel
   - The URL changes each time you restart ngrok
   - Make sure to update the frontend URL when it changes

3. **Demo Mode vs Real API**:
   - Without API keys, the backend runs in demo mode
   - Demo mode returns a fixed balance >20K USDT
   - With real API keys, it uses your actual Bybit testnet balance

## API Response Format

The backend returns Bybit wallet data in this format:

```json
{
  "retCode": 0,
  "retMsg": "OK",
  "result": {
    "list": [
      {
        "accountType": "UNIFIED",
        "totalEquity": "44757.38194591",      // Total account value
        "totalMarginBalance": "38.17779912",
        "totalAvailableBalance": "38.17779912",
        "totalWalletBalance": "38.17779912",
        "coin": [
          {
            "coin": "USDT",
            "equity": "38.1746688",
            "walletBalance": "38.1746688",
            "usdValue": "38.17779912",
            "unrealisedPnl": "0",
            "marginCollateral": true
          }
        ]
      }
    ]
  },
  "time": 1754316316641,
  "demo": false                // Indicates if using real or demo data
}
```

### Key Fields:
- `totalEquity`: Total account value (used for >20K verification)
- `accountType`: Account type (used in proof generation)
- `coin[].walletBalance`: Available balance per currency
- `demo`: Indicates if response is from real API or demo mode

## Troubleshooting

### Backend Issues
- Check that port 3001 is available
- Verify API credentials in .env if using real Bybit API
- Look for error messages in the backend terminal

### ngrok Issues
- Ensure ngrok is authenticated (`ngrok auth your-token`)
- Check that the tunnel URL is accessible
- Verify the URL in the frontend code matches your ngrok URL

### Frontend Issues
- Make sure the ngrok URL is updated in App.js
- Check browser console for CORS or connection errors
- Verify Reclaim credentials in .env.local

## Architecture

```
Frontend (3000) → ngrok → Backend (3001) → Bybit API
```

- Frontend: React app with zkFetch integration
- ngrok: Provides HTTPS tunnel to backend
- Backend: Handles Bybit API authentication
- Bybit API: Provides wallet balance data

## Security Notes

1. **ngrok Security**:
   - ngrok URLs are public - anyone can access your backend
   - Use only for development/testing
   - Implement proper authentication for production

2. **API Keys**:
   - Use testnet API keys only
   - Never commit API keys to git
   - Rotate keys regularly