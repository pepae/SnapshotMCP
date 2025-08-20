# Snapshot MCP Server

The Snapshot MCP Server bridges the gap between AI assistants and decentralized governance platforms. It provides real-time access to governance data from thousands of DAOs and communities using the Snapshot platform, enabling intelligent analysis and interaction with Web3 governance systems.

> **⚠️ ALPHA SOFTWARE DISCLAIMER**
> 
> This software is in ALPHA stage and is provided "AS IS" without warranties of any kind. Use at your own risk.
> 
> **IMPORTANT SECURITY WARNINGS:**
> - This is experimental software not intended for production use with valuable assets
> - Wallet operations are fully custodial - private keys are stored in server memory
> - No guarantees are made regarding security, functionality, or data integrity
> - Users assume full responsibility for any losses, damages, or security breaches
> - Do NOT use with wallets containing significant funds or valuable assets
> - Governance actions are irreversible and may have financial or legal implications
> 
> **NO LIABILITY:** The developers, contributors, and associated parties accept no responsibility for any damages, losses, security breaches, incorrect governance actions, or other issues arising from the use of this software.
> 
> **RECOMMENDATION:** Use only for testing, experimentation, and low-value governance participation. Always verify proposals and votes independently before submitting.

A Model Context Protocol (MCP) server that provides comprehensive access to Snapshot governance platform functionality. This server enables AI assistants like Claude to query Snapshot spaces, proposals, votes, and perform governance actions through natural language commands.


## Features

### Core Governance Data Access
- Space Management: Query DAO/community information, settings, and statistics
- Proposal System: Retrieve proposal details, status, and voting information
- Vote Analysis: Access voting data, results, and voter participation metrics
- User Profiles: Get user profiles, voting history, and followed spaces
- Search Capabilities: Find spaces and proposals with advanced filtering and pagination

### Governance Operations
- Proposal Creation: Submit new governance proposals to any space
- Vote Casting: Vote on active proposals with optional reasoning
- Space Following: Subscribe to and unsubscribe from DAOs and communities
- Wallet Integration: Secure transaction signing for governance operations

### Technical Features
- Real-time GraphQL API integration with Snapshot Hub
- Claude Web compatibility with proper CORS and streaming support
- Rate limiting and error handling for production use
- Comprehensive logging and debugging capabilities

## Quick Start

### Adding to Claude Web

The Snapshot MCP Server is deployed and ready to use with Claude Web. Follow these steps to integrate it:

1. **Access Claude Web**: Go to https://claude.ai and log into your account

2. **Open MCP Settings**: 
   - Click on your profile/settings
   - Navigate to "Feature Preview" or "Integrations"
   - Look for "Model Context Protocol" or "MCP Servers"

3. **Add the Server**:
   - Click "Add Server" or "New Integration"
   - Enter the server details:
     - Name: `Snapshot Governance`
     - URL: `https://snapshot-mcp-server-luis-3073bff3e375.herokuapp.com/mcp`
     - Description: `Access to Snapshot governance data and operations`

4. **Test the Integration**:
   - Start a new conversation with Claude
   - Try queries like:
     - "What are the latest proposals in Uniswap governance?"
     - "Show me information about the Aave DAO"
     - "Find active proposals in DeFi protocols"

### Local Development Setup

For development or self-hosting:

#### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Git

#### Installation Steps

1. **Clone the repository**:
```bash
git clone https://github.com/your-username/SnapshotMCP.git
cd SnapshotMCP
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment** (optional):
```bash
cp .env.example .env
# Edit .env file if needed (most functionality works without configuration)
```

4. **Start the development server**:
```bash
npm start
```

5. **Verify installation**:
```bash
# Test basic functionality
npm test

# Check server health
curl http://localhost:3001/health
```

The server will be available at `http://localhost:3001` with the MCP endpoint at `/mcp`.

#### Local Claude Integration

To use your local server with Claude Desktop (not Claude Web):

1. **Install Claude Desktop**: Download from https://claude.ai/desktop

2. **Configure MCP**: Edit your Claude Desktop MCP configuration file:
   - Windows: `%APPDATA%\Claude\mcp.json`
   - macOS: `~/Library/Application Support/Claude/mcp.json`
   - Linux: `~/.config/claude/mcp.json`

3. **Add server configuration**:
```json
{
  "servers": {
    "snapshot": {
      "command": "node",
      "args": ["server.js"],
      "cwd": "/path/to/SnapshotMCP"
    }
  }
}
```

4. **Restart Claude Desktop** and test the integration

## API Reference

The Snapshot MCP Server provides 13 tools for interacting with Snapshot governance:

### Space Management

#### get_space
Retrieve detailed information about a specific Snapshot space (DAO/community).

Parameters:
- `space_id` (string, required): The space identifier (e.g., 'uniswap.eth', 'aave.eth')

Returns: Complete space configuration including voting strategies, membership, and statistics.

#### list_spaces
Search and list multiple Snapshot spaces with filtering and pagination.

Parameters:
- `first` (number, optional): Number of spaces to return (max 100, default 20)
- `skip` (number, optional): Number of spaces to skip for pagination (default 0)
- `search` (string, optional): Search term to filter spaces by name or ID
- `category` (string, optional): Filter by space category
- `order_by` (string, optional): Sort field ('created', 'updated', 'followersCount', 'proposalsCount')
- `order_direction` (string, optional): Sort direction ('asc', 'desc', default 'desc')

Returns: Array of space objects matching the filter criteria.

### Proposal Management

#### get_proposal
Retrieve comprehensive information about a specific proposal.

Parameters:
- `proposal_id` (string, required): The proposal ID (IPFS hash or hex string)

Returns: Complete proposal data including voting results, timeline, and metadata.

#### list_proposals
Search and filter proposals across spaces with advanced options.

Parameters:
- `space` (string, optional): Filter by space ID
- `state` (string, optional): Filter by proposal state ('pending', 'active', 'closed')
- `author` (string, optional): Filter by proposal author address
- `first` (number, optional): Number of proposals to return (max 100, default 20)
- `skip` (number, optional): Number to skip for pagination (default 0)
- `order_by` (string, optional): Sort field ('created', 'updated', 'start', 'end', 'votes')
- `order_direction` (string, optional): Sort direction ('asc', 'desc', default 'desc')

Returns: Array of proposal objects matching the filter criteria.

#### create_proposal
Create a new governance proposal in a Snapshot space (requires wallet).

Parameters:
- `space_id` (string, required): The space ID where to create the proposal
- `title` (string, required): The proposal title
- `body` (string, required): The proposal description/body (supports Markdown)
- `choices` (array, required): Array of voting choice strings
- `type` (string, optional): Voting type ('single-choice', 'approval', 'quadratic', etc.)
- `start` (number, optional): Start timestamp (Unix epoch, defaults to now)
- `end` (number, optional): End timestamp (Unix epoch, defaults to 7 days from now)
- `snapshot` (string, optional): Block number for voting power snapshot

Returns: Transaction receipt and proposal ID upon successful creation.

### Voting Operations

#### get_votes
Retrieve voting data for a specific proposal.

Parameters:
- `proposal_id` (string, required): The proposal ID to get votes for
- `first` (number, optional): Number of votes to return (max 1000, default 100)
- `skip` (number, optional): Number to skip for pagination (default 0)
- `order_by` (string, optional): Sort field ('created', 'vp' for voting power)
- `order_direction` (string, optional): Sort direction ('asc', 'desc', default 'desc')

Returns: Array of vote objects with voter addresses, choices, and voting power.

#### cast_vote
Cast a vote on an active proposal (requires wallet).

Parameters:
- `space_id` (string, required): The space ID containing the proposal
- `proposal_id` (string, required): The proposal ID to vote on
- `choice` (number, required): The choice number (1-based index for single-choice voting)
- `reason` (string, optional): Optional reason for the vote

Returns: Transaction receipt confirming the vote submission.

### User Management

#### get_user_profile
Retrieve user profile information and governance statistics.

Parameters:
- `address` (string, required): Ethereum address or ENS name

Returns: User profile data including vote count, proposal count, and activity history.

#### get_user_follows
Get spaces that a user follows.

Parameters:
- `address` (string, required): Ethereum address or ENS name of the user
- `first` (number, optional): Number of follows to return (default 20)
- `skip` (number, optional): Number to skip for pagination (default 0)

Returns: Array of followed spaces with follow timestamps.

#### follow_space
Follow a Snapshot space (requires wallet).

Parameters:
- `space_id` (string, required): The space ID to follow

Returns: Transaction receipt confirming the follow action.

#### unfollow_space
Unfollow a Snapshot space (requires wallet).

Parameters:
- `space_id` (string, required): The space ID to unfollow

Returns: Transaction receipt confirming the unfollow action.

### Wallet Operations

#### create_wallet
Generate a new random wallet for Snapshot operations.

Parameters: None

Returns: Wallet address, mnemonic phrase, and private key. Store securely.

#### import_wallet
Import an existing wallet using a private key.

Parameters:
- `private_key` (string, required): The private key to import (with or without 0x prefix)

Returns: Wallet address confirmation.

#### get_wallet_address
Get the address of the currently configured wallet.

Parameters: None

Returns: Current wallet address or error if no wallet is configured.

## Usage Examples

### Basic Governance Queries

Query information about a specific DAO:
```
"Tell me about the Uniswap governance space"
```

Find recent proposals across multiple spaces:
```
"What are the latest active proposals in DeFi protocols?"
```

Analyze voting patterns:
```
"Show me the voting results for the latest Aave proposal"
```

### Advanced Research

Search for governance trends:
```
"Find all proposals about token economics in the last month"
```

User analysis:
```
"What spaces does vitalik.eth follow and what has he voted on recently?"
```

Cross-DAO comparison:
```
"Compare the governance activity between Uniswap and Compound this quarter"
```

### Governance Participation

Create a proposal (requires wallet setup):
```
"Help me create a proposal for the ENS DAO about improving documentation"
```

Vote on proposals:
```
"I want to vote 'Yes' on the latest MakerDAO proposal with reasoning about risk management"
```

Follow interesting DAOs:
```
"Follow the Gitcoin and Optimism governance spaces for me"
```

### Data Analysis Queries

Proposal success rates:
```
"What percentage of proposals pass in the top 10 DeFi DAOs?"
```

Voter participation analysis:
```
"Which DAOs have the highest voter turnout rates?"
```

Governance token distribution:
```
"Show me the voting power distribution for the latest Compound proposal"
```

## Configuration

### Environment Variables

The server supports optional configuration through environment variables:

```bash
# Server Configuration
PORT=3001                    # Server port (default: 3001)
SNAPSHOT_HUB_URL=https://hub.snapshot.org  # Snapshot API endpoint

# Rate Limiting (optional)
RATE_LIMIT_REQUESTS=60       # Requests per minute (default: 60)
RATE_LIMIT_WINDOW=60000      # Rate limit window in ms

# Logging (optional)
LOG_LEVEL=info               # Logging level (error, warn, info, debug)
LOG_FORMAT=json              # Log format (json, text)
```

### Production Deployment

For production deployment, consider these additional configurations:

#### Heroku Deployment
```bash
# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set PORT=443

# Deploy
git push heroku main
```

#### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

#### AWS Lambda Deployment
The server can be adapted for serverless deployment using AWS Lambda with proper event handling modifications.

## Architecture

### System Overview

The Snapshot MCP Server consists of several key components:

#### Core Components
- **MCP Protocol Handler**: Manages Model Context Protocol communication with Claude
- **Snapshot API Client**: GraphQL client for interacting with Snapshot Hub
- **Wallet Manager**: Handles wallet operations and transaction signing
- **HTTP Server**: Express-based server with CORS and streaming support

#### Data Flow
1. Claude sends natural language queries to the MCP server
2. Server parses MCP protocol messages and extracts tool calls
3. GraphQL queries are executed against Snapshot Hub API
4. Results are formatted and returned via MCP protocol
5. Claude processes the data and provides natural language responses

#### Security Model
- Read operations require no authentication
- Write operations (proposals, votes) require wallet configuration
- Private keys are handled securely in memory only
- All API calls use HTTPS encryption
- Rate limiting prevents abuse

### Technical Implementation

#### MCP Protocol Support
- Protocol Version: 2024-11-05
- Transport: Streamable HTTP with Claude Web compatibility
- Tools: 13 governance and wallet management tools
- Error Handling: Comprehensive error messages and fallbacks

#### GraphQL Integration
- Endpoint: https://hub.snapshot.org/graphql
- Rate Limiting: 60 requests per minute (unauthenticated)
- Caching: In-memory response caching for performance
- Pagination: Automatic handling of large result sets

#### Wallet Integration
- ethers.js v5.7.2 for Ethereum compatibility
- Snapshot.js SDK for governance operations
- EIP-712 signing for Snapshot transactions
- Support for both random wallet generation and private key import

## Development

### Project Structure
```
SnapshotMCP/
├── server.js              # Main MCP server implementation
├── test.js                # Test suite and validation
├── package.json           # Dependencies and scripts
├── package-lock.json      # Locked dependency versions
├── .env.example           # Environment configuration template
├── .gitignore            # Git ignore patterns
├── Procfile              # Heroku deployment configuration
├── HEROKU_DEPLOY.md      # Deployment documentation
├── implementationguide.md # Technical implementation details
└── README.md             # This documentation
```

### Key Dependencies

#### Production Dependencies
- `@snapshot-labs/snapshot.js`: Official Snapshot SDK for governance operations
- `ethers`: Ethereum utilities and wallet management (v5.7.2 for compatibility)
- `node-fetch`: HTTP client for GraphQL API requests
- `dotenv`: Environment variable management

#### Development Dependencies
- `nodemon`: Development server with auto-reload
- Custom test suite for API validation

### Development Workflow

#### Local Development
1. Clone the repository and install dependencies
2. Start the development server with `npm run dev`
3. Use `npm test` to run the test suite
4. Monitor logs for debugging and performance analysis

#### Testing Strategy
- Unit tests for individual tool functions
- Integration tests with live Snapshot API
- Error handling and edge case validation
- Performance testing for rate limiting

#### Code Quality
- ESLint configuration for code consistency
- Error handling best practices
- Comprehensive logging for debugging
- Security considerations for wallet operations

### API Rate Limits and Best Practices

#### Snapshot Hub Limits
- Unauthenticated: 60 requests per minute
- Authenticated: Higher limits available with API key
- GraphQL query complexity limits apply

#### Server Implementation
- Built-in rate limiting with configurable thresholds
- Request queuing for high-volume scenarios
- Graceful degradation when limits are reached
- Caching strategies to reduce API calls

#### Optimization Recommendations
- Use pagination for large datasets
- Implement client-side caching where appropriate
- Batch related queries when possible
- Monitor and log API usage patterns

## Deployment

### Production Environments

#### Heroku (Current)
- Live deployment: https://snapshot-mcp-server-luis-3073bff3e375.herokuapp.com
- Automatic scaling based on demand
- Built-in monitoring and logging
- Zero-downtime deployments

#### Self-Hosted Options
- Node.js server with process management (PM2)
- Docker containerization for consistent environments
- Reverse proxy setup (Nginx) for production traffic
- SSL certificate configuration for HTTPS

#### Cloud Platform Support
- AWS EC2 with Application Load Balancer
- Google Cloud Platform with Cloud Run
- Azure Container Instances
- DigitalOcean App Platform

### Monitoring and Maintenance

#### Health Monitoring
- `/health` endpoint for system status checks
- Request/response logging for debugging
- Error tracking and alerting systems
- Performance metrics collection

#### Maintenance Tasks
- Regular dependency updates and security patches
- Log rotation and cleanup procedures
- Database maintenance (if persistence is added)
- Backup and recovery procedures

## Troubleshooting

### Common Issues

#### Claude Web Integration
- Verify HTTPS endpoint is accessible
- Check CORS headers are properly configured
- Ensure MCP protocol version compatibility
- Test with `/health` endpoint first

#### API Connection Problems
- Confirm Snapshot Hub API availability
- Check network connectivity and firewall rules
- Verify rate limiting is not exceeded
- Review GraphQL query syntax and parameters

#### Wallet Operations
- Ensure private key format is correct
- Verify wallet has sufficient permissions for the space
- Check that proposals and votes are properly formatted
- Confirm network connectivity for transaction submission

### Debug Procedures

#### Server Logs
```bash
# Check recent server logs
heroku logs --tail --app your-app-name

# Local debugging
npm run dev  # Starts server with detailed logging
```

#### API Testing
```bash
# Test server health
curl https://your-server.herokuapp.com/health

# Test MCP endpoint
curl -X POST https://your-server.herokuapp.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

#### Common Error Messages
- "Rate limit exceeded": Wait for rate limit reset or implement caching
- "GraphQL errors": Check query syntax and required parameters
- "No wallet configured": Create or import a wallet before write operations
- "Unknown tool": Verify tool name matches available tools list

## Contributing

### Development Setup
1. Fork the repository on GitHub
2. Clone your fork locally: `git clone https://github.com/your-username/SnapshotMCP.git`
3. Create a feature branch: `git checkout -b feature-name`
4. Install dependencies: `npm install`
5. Make your changes and test thoroughly
6. Submit a pull request with detailed description

### Contribution Guidelines
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation for API changes
- Ensure all tests pass before submitting
- Include examples for new features

### Areas for Contribution
- Additional Snapshot API endpoints integration
- Enhanced error handling and user feedback
- Performance optimizations and caching
- Additional wallet provider support
- Multi-chain governance support
- Real-time notification systems

## License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Support and Community

### Getting Help
- GitHub Issues: Report bugs and request features
- Documentation: Comprehensive guides and API reference
- Server Logs: Built-in debugging and monitoring
- Test Suite: Validate functionality and troubleshoot issues

### Version History
- v1.0.0: Initial release with complete governance functionality
- Live deployment on Heroku with Claude Web support
- Full API coverage for Snapshot platform features

### Acknowledgments
Built for the Web3 governance community using the Snapshot platform and Model Context Protocol. Special thanks to the Snapshot Labs team for providing the GraphQL API and the Anthropic team for developing the MCP specification.
