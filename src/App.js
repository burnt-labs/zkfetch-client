import { ReclaimClient } from "@reclaimprotocol/zk-fetch";
import "./App.css";
import { useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { ethers } from "ethers";

// Log credentials for debugging
console.log("Initializing Reclaim with:", {
  appId: process.env.REACT_APP_RECLAIM_APP_ID,
  appSecret: process.env.REACT_APP_RECLAIM_APP_SECRET ? "***hidden***" : "not set"
});

// Initialize ReclaimClient
const reclaim = new ReclaimClient(
  process.env.REACT_APP_RECLAIM_APP_ID,
  process.env.REACT_APP_RECLAIM_APP_SECRET
);

function App() {
  const [proofData, setProofData] = useState(null);
  const [transformedProof, setTransformedProof] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedExample, setSelectedExample] = useState('coingecko');

  const examples = {
    coingecko: {
      name: 'CoinGecko Market Data',
      url: 'https://api.coingecko.com/api/v3/global',
      method: 'GET',
      responseMatches: [
        {
          type: 'regex',
          value: 'active_cryptocurrencies":\\s*(?<active_cryptocurrencies>[\\d\\.]+)'
        },
      ],
      responseRedactions: [{
        regex: 'active_cryptocurrencies":\\s*(?<active_cryptocurrencies>[\\d\\.]+)'
      }],
      description: 'Fetch active cryptocurrency count'
    },
    github: {
      name: 'GitHub User Data',
      url: 'https://api.github.com/users/github',
      method: 'GET',
      responseMatches: [
        {
          type: 'regex',
          value: '"public_repos":\\s*(?<public_repos>\\d+)'
        },
      ],
      responseRedactions: [{
        regex: '"public_repos":\\s*(?<public_repos>\\d+)'
      }],
      description: 'Verify GitHub repository count'
    },
    jsonplaceholder: {
      name: 'JSONPlaceholder POST',
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'POST',
      body: JSON.stringify({
        title: 'zkFetch Demo Post',
        body: 'This is a verifiable POST request using zkFetch',
        userId: 1
      }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
      responseMatches: [
        {
          type: 'regex',
          value: '"id":\\s*(?<post_id>\\d+)'
        },
      ],
      responseRedactions: [{
        regex: '"id":\\s*(?<post_id>\\d+)'
      }],
      description: 'Create a verifiable POST request'
    },
  };

  const generateProof = async () => {
    setIsFetching(true);
    setProofData(null);
    setTransformedProof(null);

    try {
      const example = examples[selectedExample];
      
      toast.loading(`Fetching data from ${example.name}...`, { id: 'fetching' });
      
      const fetchOptions = {
        method: example.method,
        ...(example.headers && { headers: example.headers }),
        ...(example.body && { body: example.body })
      };
      
      const data = await reclaim.zkFetch(
        example.url,
        fetchOptions,
        {
          responseMatches: example.responseMatches,
          responseRedactions: example.responseRedactions
        }
      );
      
      console.log('Raw proof data:', data);
      setProofData(data);
      
      // Transform proof for on-chain use
      const transformed = transformProofForChain(data);
      setTransformedProof(transformed);
      
      toast.success('Proof generated successfully!', { id: 'fetching' });
      setIsFetching(false);
      
      return data;
    } catch (error) {
      setIsFetching(false);
      const errorMessage = error?.message || 'An unexpected error occurred';
      
      // Log full error for debugging
      console.error('zkFetch error details:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      
      // Check if it's an authentication error
      if (errorMessage.includes('Application not found') || errorMessage.includes('404')) {
        toast.error(
          <div>
            <p className="font-semibold">Reclaim Authentication Error</p>
            <p className="text-sm mt-1">Your credentials are not recognized by Reclaim Protocol.</p>
            <p className="text-xs mt-2">Please check:</p>
            <ul className="text-xs list-disc list-inside">
              <li>Your app is registered at dev.reclaimprotocol.org</li>
              <li>Credentials are copied correctly</li>
              <li>No extra quotes or spaces in .env file</li>
            </ul>
          </div>, 
          { 
            id: 'fetching',
            duration: 10000,
          }
        );
      } else {
        toast.error(`Failed to generate proof: ${errorMessage}`, { id: 'fetching' });
      }
    }
  };

  const transformProofForChain = (proof) => {
    try {
      // Handle new proof structure (no proofs array in v0.4.0)
      const proofObject = proof.proofs ? proof.proofs[0] : proof;
      
      // Encode the proof data for on-chain verification
      const abiCoder = new ethers.AbiCoder();
      
      const transformed = {
        claimInfo: {
          provider: proofObject.claimData.provider,
          parameters: proofObject.claimData.parameters,
          context: proofObject.claimData.context || ''
        },
        signedClaim: {
          claim: {
            identifier: proofObject.identifier,
            owner: proofObject.claimData.owner,
            timestampS: proofObject.claimData.timestampS,
            epoch: proofObject.claimData.epoch
          },
          signatures: proofObject.signatures || []
        },
        // Encode for smart contract
        encodedProof: abiCoder.encode(
          ['bytes32', 'address', 'uint256', 'uint256'],
          [
            ethers.id(proofObject.identifier),
            proofObject.claimData.owner,
            proofObject.claimData.timestampS,
            proofObject.claimData.epoch
          ]
        ),
        // Extract the verified data
        extractedData: proofObject.extractedParameterValues,
        // Include witnesses for verification
        witnesses: proofObject.witnesses || []
      };
      
      return transformed;
    } catch (error) {
      console.error('Error transforming proof:', error);
      toast.error('Failed to transform proof for on-chain use');
      return null;
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-900 to-black">
        <div className="w-full max-w-4xl flex flex-col gap-8 items-center justify-center font-sans">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center">
            zkFetch Demo
          </h1>
          <h2 className="text-md md:text-lg text-slate-300 text-center max-w-2xl">
            This demo uses{" "}
            <a
              href="https://www.npmjs.com/package/@reclaimprotocol/zk-fetch"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 font-semibold hover:underline transition-colors duration-300"
            >
              @reclaimprotocol/zk-fetch
            </a>{" "}
            to fetch data from{" "}
            <a 
              href="https://api.coingecko.com/api/v3/global" 
              target="_blank" 
              rel="noreferrer"
              className="text-green-400 font-semibold hover:underline transition-colors duration-300"
            >
              CoinGecko API
            </a>{" "}
            and generate a proof
          </h2>

          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            onClick={generateProof}
          >
            {isFetching ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Fetching...
              </span>
            ) : (
              "Generate Proof"
            )}
          </button>
          
          <div className="w-full max-w-2xl mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Select Example:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {Object.entries(examples).map(([key, example]) => (
                <button
                  key={key}
                  onClick={() => setSelectedExample(key)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedExample === key
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <h4 className="text-white font-semibold">{example.name}</h4>
                  <p className="text-gray-400 text-sm mt-1">{example.description}</p>
                </button>
              ))}
            </div>
          </div>

          {proofData && !isFetching && (
            <div className="w-full space-y-6">
              <div className="bg-gray-900 rounded-lg shadow-xl p-6">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Proof Generated Successfully! ✅
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-green-400 mb-2">Extracted Data:</h4>
                    <pre className="text-gray-300 bg-gray-800 p-3 rounded">
                      {JSON.stringify(proofData.extractedParameterValues || {}, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-blue-400 mb-2">Proof Details:</h4>
                    <div className="bg-gray-800 p-3 rounded space-y-2 text-sm">
                      <p className="text-gray-300"><span className="text-gray-400">Identifier:</span> {proofData.identifier}</p>
                      <p className="text-gray-300"><span className="text-gray-400">Timestamp:</span> {new Date(proofData.claimData.timestampS * 1000).toLocaleString()}</p>
                      <p className="text-gray-300"><span className="text-gray-400">Provider:</span> {proofData.claimData.provider}</p>
                      <p className="text-gray-300"><span className="text-gray-400">Witnesses:</span> {proofData.witnesses?.length || 0}</p>
                    </div>
                  </div>
                  
                  <details className="cursor-pointer">
                    <summary className="text-gray-400 hover:text-gray-300">View Raw Proof Data</summary>
                    <pre className="text-gray-300 overflow-x-auto whitespace-pre-wrap text-sm mt-2">
                      {JSON.stringify(proofData, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>

              {transformedProof && (
                <div className="bg-gray-900 rounded-lg shadow-xl p-6">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Transformed for On-Chain Use
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-blue-400 mb-2">Extracted Data:</h4>
                      <pre className="text-gray-300 bg-gray-800 p-3 rounded">
                        {JSON.stringify(transformedProof.extractedData, null, 2)}
                      </pre>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-blue-400 mb-2">Encoded Proof (for Smart Contract):</h4>
                      <div className="bg-gray-800 p-3 rounded break-all">
                        <code className="text-green-400 text-xs">
                          {transformedProof.encodedProof}
                        </code>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-blue-400 mb-2">Claim Info:</h4>
                      <pre className="text-gray-300 bg-gray-800 p-3 rounded text-sm">
                        {JSON.stringify(transformedProof.claimInfo, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default App;
