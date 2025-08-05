const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Bybit API configuration
const BYBIT_API_URL = 'https://api-testnet.bybit.com';
const API_KEY = process.env.BYBIT_API_KEY || '--ADD-HERE-YOUR-API-KEY--';
const API_SECRET = process.env.BYBIT_API_SECRET || '--ADD-HERE-YOUR-API-SECRET--';

// Generate Bybit API signature
function generateSignature(timestamp, queryString) {
  const payload = timestamp + API_KEY + '5000' + queryString;
  return crypto.createHmac('sha256', API_SECRET).update(payload).digest('hex');
}

// Get API key information to check permissions
async function checkApiKeyPermissions() {
  try {
    const timestamp = Date.now().toString();
    const queryString = ''; // No query parameters for this endpoint
    const signature = generateSignature(timestamp, queryString);
    
    const headers = {
      'X-BAPI-API-KEY': API_KEY,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': '5000',
      'X-BAPI-SIGN': signature,
      'Content-Type': 'application/json'
    };
    
    console.log('=== Checking API Key Permissions ===');
    const response = await axios.get(`${BYBIT_API_URL}/v5/user/query-api`, { headers });
    
    console.log('API Key Info:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Permission check failed:', error.response?.data || error.message);
    return null;
  }
}

// Try the exact same method as the working test script - All Coins Balance
async function getAllCoinsBalance() {
  try {
    const timestamp = Date.now().toString();
    
    // Try the same parameters as your working test script
    const params = new URLSearchParams({
      accountType: 'UNIFIED',
      coin: 'USDT'
    });
    
    params.sort();
    const queryString = params.toString();
    const signature = generateSignature(timestamp, queryString);
    
    console.log('=== Trying All Coins Balance Method ===');
    console.log('Query String:', queryString);
    
    const headers = {
      'X-BAPI-API-KEY': API_KEY,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': '5000',
      'X-BAPI-SIGN': signature,
      'Content-Type': 'application/json'
    };
    
    // Try the funding account balance endpoint first
    const fullUrl = `${BYBIT_API_URL}/v5/asset/balance/all-balance?${queryString}`;
    console.log('Trying funding balance URL:', fullUrl);
    
    const response = await axios.get(fullUrl, { headers });
    console.log('Funding balance response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Funding balance failed:', error.response?.data || error.message);
    throw error;
  }
}

// Get Bybit wallet balance
async function getBybitBalance() {
  try {
    // First check API key permissions
    console.log('=== Starting Bybit Balance Check ===');
    const permissionCheck = await checkApiKeyPermissions();
    
    if (permissionCheck && permissionCheck.result) {
      console.log('API Key Permissions:');
      console.log('- Wallet permissions:', JSON.stringify(permissionCheck.result.permissions?.Wallet || [], null, 2));
      console.log('- Account type (UTA):', permissionCheck.result.uta);
    }
    
    try {
      return await getAllCoinsBalance();
    } catch (fundingError) {
      console.log('Funding balance failed, trying account wallet balance...');
      
      // Fallback to account wallet balance
      const timestamp = Date.now().toString();
      
      const params = new URLSearchParams({
        accountType: 'UNIFIED',
        coin: 'USDT'
      });
      
      params.sort();
      const queryString = params.toString();
      const signature = generateSignature(timestamp, queryString);
      
      console.log('=== Trying Account Wallet Balance ===');
      console.log('Query String:', queryString);
      
      const headers = {
        'X-BAPI-API-KEY': API_KEY,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': '5000',
        'X-BAPI-SIGN': signature,
        'Content-Type': 'application/json'
      };
      
      const fullUrl = `${BYBIT_API_URL}/v5/account/wallet-balance?${queryString}`;
      console.log('Account wallet URL:', fullUrl);
      
      const response = await axios.get(fullUrl, { headers });
      console.log('Account wallet response:', JSON.stringify(response.data, null, 2));
      return response.data;
    }
    
  } catch (error) {
    console.error('Both balance methods failed:', error.response?.data || error.message);
    throw error;
  }
}

// API endpoint for wallet balance proof
app.get('/api/wallet-balance', async (req, res) => {
  try {
    console.log('Fetching wallet balance from Bybit...');
    
    // For demo purposes when API keys are not set
    if (API_KEY === '--ADD-HERE-YOUR-API-KEY--' || API_SECRET === '--ADD-HERE-YOUR-API-SECRET--') {
      console.log('Using demo data (API keys not configured)');
      return res.json({
        retCode: 0,
        retMsg: "success",
        result: {
          memberId: "104642451",
          accountType: "UNIFIED",
          balance: [{
            coin: "USDT",
            transferBalance: "00000.00",
            walletBalance: "00000.00",
            bonus: ""
          }]
        },
        retExtInfo: {},
        time: Date.now(),
        demo: true
      });
    }
    
    // Get actual balance from Bybit
    const balanceData = await getBybitBalance();
    
    // Check if Bybit returned an error
    if (balanceData.retCode !== 0) {
      console.log('Bybit API returned error, using demo data:', balanceData.retMsg);
      return res.json({
        retCode: 0,
        retMsg: "success",
        result: {
          memberId: "104642451",
          accountType: "UNIFIED",
          balance: [{
            coin: "USDT",
            transferBalance: "00000.00",
            walletBalance: "00000.00",
            bonus: ""
          }]
        },
        retExtInfo: {},
        time: Date.now(),
        demo: true
      });
    }
    
    // Return the balance data for zkfetch proof generation
    res.json({
      ...balanceData,
      demo: false
    });
    
  } catch (error) {
    console.error('Error fetching wallet balance:', error.message);
    
    // Always return demo data if API fails or has permission issues
    res.json({
      retCode: 0,
      retMsg: "success",
      result: {
        memberId: "104642451",
        accountType: "UNIFIED",
        balance: [{
          coin: "USDT",
          transferBalance: "00000.00",
          walletBalance: "00000.00",
          bonus: ""
        }]
      },
      retExtInfo: {},
      time: Date.now(),
      demo: true
    });
  }
});

// Test endpoint to check API permissions and test balance methods
app.get('/api/test-bybit', async (req, res) => {
  try {
    console.log('=== Manual Bybit API Test ===');
    
    // Check API key permissions
    const permissions = await checkApiKeyPermissions();
    
    // Try to get balance using different methods
    const results = {
      permissions: permissions,
      balanceTests: {}
    };
    
    // Test 1: Try funding balance (all-balance)
    try {
      console.log('\n--- Test 1: Funding Balance ---');
      const fundingBalance = await getAllCoinsBalance();
      results.balanceTests.fundingBalance = {
        success: true,
        data: fundingBalance
      };
    } catch (error) {
      results.balanceTests.fundingBalance = {
        success: false,
        error: error.response?.data || error.message
      };
    }
    
    // Test 2: Try account wallet balance
    try {
      console.log('\n--- Test 2: Account Wallet Balance ---');
      const timestamp = Date.now().toString();
      const params = new URLSearchParams({
        accountType: 'UNIFIED',
        coin: 'USDT'
      });
      params.sort();
      const queryString = params.toString();
      const signature = generateSignature(timestamp, queryString);
      
      const headers = {
        'X-BAPI-API-KEY': API_KEY,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': '5000',
        'X-BAPI-SIGN': signature,
        'Content-Type': 'application/json'
      };
      
      const response = await axios.get(`${BYBIT_API_URL}/v5/account/wallet-balance?${queryString}`, { headers });
      results.balanceTests.accountWalletBalance = {
        success: true,
        data: response.data
      };
    } catch (error) {
      results.balanceTests.accountWalletBalance = {
        success: false,
        error: error.response?.data || error.message
      };
    }
    
    res.json(results);
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    apiKeysConfigured: API_KEY !== '--ADD-HERE-YOUR-API-KEY--',
    endpoints: {
      'GET /api/wallet-balance': 'Get Bybit wallet balance for zkFetch',
      'GET /api/test-bybit': 'Test API key permissions and different balance endpoints',
      'GET /health': 'Health check'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`API Keys configured: ${API_KEY !== '--ADD-HERE-YOUR-API-KEY--'}`);
  console.log('Endpoints:');
  console.log(`  GET /api/wallet-balance - Get Bybit wallet balance`);
  console.log(`  GET /api/test-bybit - Test API permissions and endpoints`);
  console.log(`  GET /health - Health check`);
  
  if (API_KEY !== '--ADD-HERE-YOUR-API-KEY--') {
    console.log('\n🔑 API Keys are configured!');
    console.log('💡 Visit http://localhost:3001/api/test-bybit to test API access');
  } else {
    console.log('\n⚠️  API Keys not configured - using demo mode');
  }
});

module.exports = app; 