# Snapshot MCP Server

A Model Context Protocol (MCP) server that provides access to Snapshot governance platform functionality. This server enables AI assistants like Claude to query Snapshot spaces, proposals, votes, and perform governance actions through natural language commands.

## Features

### Data Retrieval ("Pull" Functionality)
- 🏛️ **Spaces**: Query DAO/community information, settings, and statistics
- 📋 **Proposals**: Retrieve proposal details, status, and voting information  
- 🗳️ **Votes**: Access voting data, results, and voter participation
- 👤 **Users**: Get user profiles, voting history, and followed spaces
- 🔍 **Search**: Find spaces and proposals with filtering and pagination

### Future Features (Coming Soon)
- ✍️ **Create Proposals**: Submit new governance proposals
- 🗳️ **Cast Votes**: Vote on active proposals
- 👥 **Follow Spaces**: Subscribe to DAOs and communities
- 🔐 **Wallet Integration**: Secure transaction signing

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and setup**:
```bash
git clone <repository-url>
cd SnapshotMCP
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env file as needed (optional for read-only functionality)
```

3. **Start the server**:
```bash
npm start
```

4. **Test the functionality**:
```bash
npm test
```

The server will be available at `http://localhost:3001` with the MCP endpoint at `/mcp`.

## Available Tools

### `get_space`
Get detailed information about a Snapshot space (DAO/community).

**Parameters:**
- `space_id` (string): The space ID (e.g., 'uniswap.eth', 'aave.eth')

**Example:**
```json
{
  "name": "get_space",
  "arguments": {
    "space_id": "uniswap.eth"
  }
}
```

### `list_spaces`
Search and list Snapshot spaces with filtering options.

**Parameters:**
- `first` (number): Number of spaces to return (max 100, default 20)
- `skip` (number): Number of spaces to skip for pagination (default 0)
- `search` (string): Search term to filter spaces by name or ID
- `category` (string): Filter by category
- `order_by` (string): Field to order by ('created', 'updated', 'followersCount', 'proposalsCount')
- `order_direction` (string): Order direction ('asc', 'desc')

### `get_proposal`
Get detailed information about a specific Snapshot proposal.

**Parameters:**
- `proposal_id` (string): The proposal ID (IPFS hash or hex string)

### `list_proposals`
List and search proposals with filtering options.

**Parameters:**
- `space` (string): Filter by space ID
- `state` (string): Filter by state ('pending', 'active', 'closed')
- `author` (string): Filter by author address
- `first` (number): Number of proposals to return (max 100, default 20)
- `skip` (number): Number to skip for pagination
- `order_by` (string): Field to order by ('created', 'updated', 'start', 'end', 'votes')
- `order_direction` (string): Order direction ('asc', 'desc')

### `get_votes`
Get votes for a specific proposal.

**Parameters:**
- `proposal_id` (string): The proposal ID to get votes for
- `first` (number): Number of votes to return (max 1000, default 100)
- `skip` (number): Number to skip for pagination
- `order_by` (string): Field to order by ('created', 'vp')
- `order_direction` (string): Order direction ('asc', 'desc')

### `get_user_profile`
Get user profile information and governance statistics.

**Parameters:**
- `address` (string): Ethereum address or ENS name

### `get_user_follows`
Get spaces that a user follows.

**Parameters:**
- `address` (string): Ethereum address or ENS name
- `first` (number): Number of follows to return (default 20)
- `skip` (number): Number to skip for pagination

## Example Usage

### Query a DAO's Information
```javascript
// Get Uniswap DAO information
{
  "method": "tools/call",
  "params": {
    "name": "get_space",
    "arguments": {
      "space_id": "uniswap.eth"
    }
  }
}
```

### Find Recent Proposals
```javascript
// Get recent active proposals from Aave
{
  "method": "tools/call", 
  "params": {
    "name": "list_proposals",
    "arguments": {
      "space": "aave.eth",
      "state": "active",
      "first": 10,
      "order_by": "created",
      "order_direction": "desc"
    }
  }
}
```

### Search for DAOs
```javascript
// Search for DeFi-related spaces
{
  "method": "tools/call",
  "params": {
    "name": "list_spaces", 
    "arguments": {
      "search": "defi",
      "first": 20,
      "order_by": "followersCount",
      "order_direction": "desc"
    }
  }
}
```

## Integration with Claude

To use this server with Claude Web:

1. Start the server: `npm start`
2. In Claude's interface, add a new MCP server
3. Use the endpoint: `http://localhost:3001/mcp`
4. The tools will be available for natural language queries

Example queries to Claude:
- "What are the latest proposals in the Uniswap DAO?"
- "Show me information about the Aave governance space"
- "Find all active proposals across popular DeFi DAOs"
- "What spaces does vitalik.eth follow?"

## Development

### Project Structure
```
SnapshotMCP/
├── server.js          # Main MCP server implementation
├── test.js            # Test suite for basic functionality
├── package.json       # Dependencies and scripts
├── .env.example       # Environment configuration template
└── README.md          # This file
```

### Dependencies
- `@snapshot-labs/snapshot.js`: Official Snapshot SDK (for future write operations)
- `ethers`: Ethereum utilities (for future wallet integration)
- `node-fetch`: HTTP client for GraphQL requests
- `dotenv`: Environment variable management

### API Rate Limits
- Snapshot Hub: 60 requests/minute (unauthenticated)
- Server implements basic rate limiting
- Consider API key for production use

## Roadmap

### Phase 1: Data Retrieval ✅
- [x] Basic MCP server setup
- [x] Snapshot GraphQL API integration  
- [x] Space, proposal, and vote queries
- [x] User profile and follows data
- [x] Search and filtering capabilities
- [x] Test suite for validation

### Phase 2: Write Operations (Next)
- [ ] Wallet integration for signing
- [ ] Create proposals functionality
- [ ] Vote casting capabilities  
- [ ] Follow/unfollow spaces
- [ ] Transaction confirmation tracking

### Phase 3: Advanced Features
- [ ] Real-time proposal monitoring
- [ ] Vote delegation support
- [ ] Multi-chain governance support
- [ ] Analytics and reporting tools
- [ ] Enhanced security features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the test suite: `npm test`
- Review server logs for debugging
- Ensure Snapshot API is accessible
- Verify MCP protocol compatibility

---

**Built with ❤️ for the Web3 governance community**
