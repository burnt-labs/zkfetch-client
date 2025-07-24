# zkFetch React Starter - Enhanced Edition

This enhanced example demonstrates how to use zk-fetch with Reclaim Protocol in a React application, with added features for mobile development and on-chain integration.

## Features

- 🔐 **Zero-Knowledge Proofs**: Generate verifiable proofs for API responses
- 📱 **Mobile-Responsive**: Optimized for mobile devices with responsive design
- 🔄 **Multiple Examples**: GET and POST requests with different API endpoints
- ⛓️ **On-Chain Ready**: Transform proofs for smart contract verification
- 🎯 **Error Handling**: Comprehensive error handling and user feedback
- 🎨 **Modern UI**: Clean, modern interface with Tailwind CSS

## Examples Included

1. **CoinGecko API** - Fetch and prove active cryptocurrency count
2. **GitHub API** - Verify public repository count for users
3. **JSONPlaceholder** - Demonstrate POST requests with zkFetch

## Getting Started

### Prerequisites

1. Node.js (v14 or higher)
2. An application ID and secret from [Reclaim Protocol DevTool](https://dev.reclaimprotocol.org/)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd reclaim-zkfetch-client-master

# Install dependencies
npm install

# Run post-install script for zkFetch setup
npm run postinstall

# Set up environment variables
cp .env.example .env
```

### Environment Variables

Edit `.env` and add your Reclaim credentials:

```env
REACT_APP_RECLAIM_APP_ID=your_app_id_here
REACT_APP_RECLAIM_APP_SECRET=your_app_secret_here
```

### Running the Application

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## How It Works

### 1. Making zkFetch Requests

```javascript
const data = await reclaim.zkFetch(url, fetchOptions, {
  responseMatches: [
    {
      type: "regex",
      value: 'pattern_to_match'
    }
  ],
  responseRedactions: [{
    regex: 'pattern_to_redact'
  }]
});
```

### 2. Proof Transformation for On-Chain Use

The app automatically transforms proofs for smart contract verification:

```javascript
const transformed = {
  encodedProof: "0x...", // ABI-encoded proof data
  extractedData: {...},  // Extracted values from the API
  claimInfo: {...}      // Claim metadata
};
```

### 3. Response Matching Patterns

- **CoinGecko**: Extracts `active_cryptocurrencies` count
- **GitHub**: Extracts `public_repos` count
- **JSONPlaceholder**: Extracts the created post `id`

## Mobile Development Considerations

### Responsive Design
- Mobile-first CSS with breakpoints
- Touch-friendly buttons and interactions
- Optimized font sizes and spacing
- Safe area support for modern devices

### Performance
- Efficient proof generation
- Loading states for better UX
- Error boundaries for graceful failures

## Advanced Usage

### Custom API Integration

Add your own API example:

```javascript
const examples = {
  myapi: {
    name: 'My Custom API',
    url: 'https://api.example.com/data',
    method: 'GET',
    responseMatches: [{
      type: 'regex',
      value: '"value":(?<value>\\d+)'
    }],
    responseRedactions: [{
      regex: '"value":(?<value>\\d+)'
    }],
    description: 'Custom API verification'
  }
};
```

### Smart Contract Integration

Use the transformed proof in your smart contract:

```solidity
function verifyProof(
    bytes32 identifier,
    address owner,
    uint256 timestampS,
    uint256 epoch,
    bytes memory signatures
) external {
    // Verification logic
}
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Some APIs may have CORS restrictions. Use APIs that allow cross-origin requests.

2. **Webpack Polyfills**: The project includes necessary polyfills for browser compatibility.

3. **Mobile Testing**: Use responsive design mode in browser DevTools or test on actual devices.

### Debug Mode

Check the browser console for detailed logs:
- Raw proof data
- Transformation steps
- Error details

## Project Structure

```
├── src/
│   ├── App.js          # Main application component
│   ├── App.css         # Mobile-responsive styles
│   └── index.js        # Application entry point
├── public/
│   └── browser-rpc/    # zkFetch browser resources
├── config-overrides.js # Webpack configuration
└── script.sh          # Post-install setup script
```

## Contributing

Feel free to submit issues and enhancement requests!

## Resources

- [Reclaim Protocol Documentation](https://docs.reclaimprotocol.org/)
- [zkFetch NPM Package](https://www.npmjs.com/package/@reclaimprotocol/zk-fetch)
- [XION Documentation](https://docs.burnt.com/xion)
- [Proof of Concept Hackathon](https://proofofconcept.devpost.com/)

## License

This project is open source and available under the MIT License.