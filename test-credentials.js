const { ReclaimClient } = require("@reclaimprotocol/zk-fetch");
require('dotenv').config();

console.log("Testing Reclaim credentials...\n");

console.log("Environment variables:");
console.log("APP_ID:", process.env.REACT_APP_RECLAIM_APP_ID);
console.log("APP_SECRET:", process.env.REACT_APP_RECLAIM_APP_SECRET ? "***hidden***" : "not set");
console.log("\n");

async function testCredentials() {
  try {
    // Initialize client
    console.log("Initializing ReclaimClient...");
    const reclaim = new ReclaimClient(
      process.env.REACT_APP_RECLAIM_APP_ID,
      process.env.REACT_APP_RECLAIM_APP_SECRET
    );
    console.log("✓ Client initialized successfully\n");

    // Try a simple zkFetch
    console.log("Attempting zkFetch to CoinGecko API...");
    const url = "https://api.coingecko.com/api/v3/global";
    
    const proof = await reclaim.zkFetch(
      url,
      { method: "GET" },
      {
        responseMatches: [
          {
            type: "regex",
            value: 'active_cryptocurrencies":(?<active_cryptocurrencies>[\\d\\.]+)'
          }
        ],
        responseRedactions: [{
          regex: 'active_cryptocurrencies":(?<active_cryptocurrencies>[\\d\\.]+)'
        }]
      }
    );

    console.log("✓ zkFetch successful!");
    console.log("\nProof structure:", JSON.stringify(proof, null, 2));
    
    if (proof && proof.proofs && proof.proofs[0]) {
      console.log("\nExtracted data:", proof.proofs[0].extractedParameterValues);
    } else if (proof && proof.extractedParameterValues) {
      console.log("\nExtracted data:", proof.extractedParameterValues);
    }
    
    console.log("\nCredentials are valid and working!");

  } catch (error) {
    console.error("✗ Error occurred:");
    console.error("Message:", error.message);
    
    if (error.message.includes("Application not found")) {
      console.error("\nDiagnosis: Your credentials are not recognized by Reclaim Protocol.");
      console.error("Possible issues:");
      console.error("1. The App ID doesn't exist in Reclaim's system");
      console.error("2. The credentials may have been revoked or expired");
      console.error("3. You may need to create a new application at https://dev.reclaimprotocol.org/");
    }
    
    console.error("\nFull error:", error);
  }
}

testCredentials();