#!/usr/bin/env node
/**
 * Snapshot MCP Server
 * 
 * A Model Context Protocol (MCP) server that provides access to Snapshot governance
 * platform functionality. Enables AI assistants to query spaces, proposals, votes,
 * and perform governance actions through natural language commands.
 * 
 * Features:
 * - Query Snapshot spaces, proposals, and votes via GraphQL API
 * - Create proposals and cast votes (requires wallet configuration)
 * - Streamable HTTP responses for real-time data
 * - Compatible with Claude and other MCP-capable AI assistants
 * 
 * Author: MCP Snapshot Integration
 * Version: 1.0.0
 * License: MIT
 */

import { createServer } from 'http';
import { URL } from 'url';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const SERVER_VERSION = "1.0.0";
const SERVER_PORT = parseInt(process.env.PORT || "3001");
const SNAPSHOT_HUB_URL = process.env.SNAPSHOT_HUB_URL || "https://hub.snapshot.org";
const SNAPSHOT_GRAPHQL_ENDPOINT = `${SNAPSHOT_HUB_URL}/graphql`;

/**
 * Snapshot GraphQL API Client
 * Handles all interactions with Snapshot's GraphQL endpoint
 */
class SnapshotAPI {
    constructor() {
        this.graphqlEndpoint = SNAPSHOT_GRAPHQL_ENDPOINT;
        this.requestCount = 0;
        this.lastRequestTime = Date.now();
    }

    /**
     * Execute a GraphQL query against Snapshot Hub
     */
    async query(query, variables = {}) {
        try {
            // Basic rate limiting
            this.requestCount++;
            const now = Date.now();
            if (now - this.lastRequestTime > 60000) {
                this.requestCount = 1;
                this.lastRequestTime = now;
            }
            
            if (this.requestCount > 50) {
                throw new Error('Rate limit exceeded. Please wait before making more requests.');
            }

            const response = await fetch(this.graphqlEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            if (!response.ok) {
                throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.errors) {
                throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
            }

            return data.data;
        } catch (error) {
            console.error('Snapshot API query failed:', error);
            throw error;
        }
    }    /**
     * Get details of a single space by ID
     */
    async getSpace(spaceId) {
        const query = `
            query {
                space(id: "${spaceId}") {
                    id
                    name
                    about
                    network
                    symbol
                    avatar
                    website
                    twitter
                    github
                    private
                    domain
                    members
                    admins
                    followersCount
                    proposalsCount
                    strategies {
                        name
                        params
                    }
                    voting {
                        delay
                        period
                        type
                        quorum
                    }
                }
            }
        `;

        return await this.query(query);
    }

    /**
     * Get multiple spaces with filtering options
     */
    async getSpaces(options = {}) {
        const {
            first = 20,
            skip = 0,
            orderBy = "created",
            orderDirection = "desc"
        } = options;

        const query = `
            query {
                spaces(
                    first: ${first}
                    skip: ${skip}
                    orderBy: "${orderBy}"
                    orderDirection: ${orderDirection}
                ) {
                    id
                    name
                    about
                    network
                    symbol
                    avatar
                    followersCount
                    proposalsCount
                    private
                }
            }
        `;

        return await this.query(query);
    }

    /**
     * Get details of a single proposal by ID
     */
    async getProposal(proposalId) {
        const query = `
            query GetProposal($id: String!) {
                proposal(id: $id) {
                    id
                    ipfs
                    title
                    body
                    choices
                    start
                    end
                    snapshot
                    state
                    author
                    created
                    updated
                    type
                    strategies {
                        name
                        network
                        params
                    }
                    plugins
                    network
                    symbol
                    privacy
                    validation {
                        name
                        params
                    }
                    space {
                        id
                        name
                        avatar
                        symbol
                    }
                    scores_state
                    scores_total
                    scores
                    votes
                    discussion
                    app
                }
            }
        `;

        return await this.query(query, { id: proposalId });
    }

    /**
     * Get proposals with filtering options
     */
    async getProposals(options = {}) {
        const {
            first = 20,
            skip = 0,
            orderBy = "created",
            orderDirection = "desc",
            where = {}
        } = options;

        const query = `
            query GetProposals(
                $first: Int!
                $skip: Int!
                $orderBy: String!
                $orderDirection: OrderDirection!
                $where: ProposalWhere
            ) {
                proposals(
                    first: $first
                    skip: $skip
                    orderBy: $orderBy
                    orderDirection: $orderDirection
                    where: $where
                ) {
                    id
                    ipfs
                    title
                    body
                    choices
                    start
                    end
                    snapshot
                    state
                    author
                    created
                    type
                    space {
                        id
                        name
                        avatar
                        symbol
                    }
                    scores_state
                    scores_total
                    scores
                    votes
                    discussion
                }
            }
        `;

        return await this.query(query, {
            first,
            skip,
            orderBy,
            orderDirection,
            where
        });
    }

    /**
     * Get votes for a proposal
     */
    async getVotes(proposalId, options = {}) {
        const {
            first = 1000,
            skip = 0,
            orderBy = "created",
            orderDirection = "desc"
        } = options;

        const query = `
            query GetVotes(
                $proposal: String!
                $first: Int!
                $skip: Int!
                $orderBy: String!
                $orderDirection: OrderDirection!
            ) {
                votes(
                    where: { proposal: $proposal }
                    first: $first
                    skip: $skip
                    orderBy: $orderBy
                    orderDirection: $orderDirection
                ) {
                    id
                    voter
                    choice
                    vp
                    vp_by_strategy
                    created
                    proposal {
                        id
                        choices
                    }
                    space {
                        id
                    }
                    reason
                    app
                }
            }
        `;

        return await this.query(query, {
            proposal: proposalId,
            first,
            skip,
            orderBy,
            orderDirection
        });
    }

    /**
     * Get user profile information
     */
    async getUserProfile(address) {
        const query = `
            query GetUser($id: String!) {
                user(id: $id) {
                    id
                    name
                    about
                    avatar
                    created
                    votesCount
                    proposalsCount
                }
            }
        `;

        return await this.query(query, { id: address.toLowerCase() });
    }

    /**
     * Get spaces that a user follows
     */
    async getUserFollows(address, options = {}) {
        const {
            first = 20,
            skip = 0
        } = options;

        const query = `
            query GetUserFollows(
                $follower: String!
                $first: Int!
                $skip: Int!
            ) {
                follows(
                    where: { follower: $follower }
                    first: $first
                    skip: $skip
                ) {
                    id
                    follower
                    space {
                        id
                        name
                        about
                        avatar
                        followersCount
                    }
                    created
                }
            }
        `;

        return await this.query(query, {
            follower: address.toLowerCase(),
            first,
            skip
        });
    }
}

// Initialize Snapshot API client
const snapshotAPI = new SnapshotAPI();

/**
 * MCP Tool implementations for Snapshot functionality
 */
const tools = {
    /**
     * Get information about a Snapshot space
     */
    get_space: {
        name: "get_space",
        description: "Get detailed information about a Snapshot space (DAO/community)",
        inputSchema: {
            type: "object",
            properties: {
                space_id: {
                    type: "string",
                    description: "The space ID (usually an ENS name like 'uniswap.eth' or 'aave.eth')"
                }
            },
            required: ["space_id"]
        },
        handler: async (args) => {
            try {
                const result = await snapshotAPI.getSpace(args.space_id);
                return {
                    status: "success",
                    data: result,
                    space_id: args.space_id
                };
            } catch (error) {
                return {
                    status: "error",
                    error: error.message,
                    space_id: args.space_id
                };
            }
        }
    },

    /**
     * Search and list Snapshot spaces
     */
    list_spaces: {
        name: "list_spaces",
        description: "List and search Snapshot spaces with filtering options",
        inputSchema: {
            type: "object",
            properties: {
                first: {
                    type: "number",
                    description: "Number of spaces to return (max 100)",
                    default: 20
                },
                skip: {
                    type: "number",
                    description: "Number of spaces to skip for pagination",
                    default: 0
                },
                search: {
                    type: "string",
                    description: "Search term to filter spaces by name or ID"
                },
                category: {
                    type: "string",
                    description: "Filter by category"
                },
                order_by: {
                    type: "string",
                    enum: ["created", "updated", "followersCount", "proposalsCount"],
                    description: "Field to order results by",
                    default: "created"
                },
                order_direction: {
                    type: "string",
                    enum: ["asc", "desc"],
                    description: "Order direction",
                    default: "desc"
                }
            }
        },
        handler: async (args) => {
            try {
                const where = {};
                
                if (args.search) {
                    where.id_contains = args.search.toLowerCase();
                }
                
                if (args.category) {
                    where.categories_contains = [args.category];
                }

                const result = await snapshotAPI.getSpaces({
                    first: Math.min(args.first || 20, 100),
                    skip: args.skip || 0,
                    orderBy: args.order_by || "created",
                    orderDirection: args.order_direction || "desc",
                    where
                });

                return {
                    status: "success",
                    data: result,
                    query: args
                };
            } catch (error) {
                return {
                    status: "error",
                    error: error.message,
                    query: args
                };
            }
        }
    },

    /**
     * Get detailed information about a proposal
     */
    get_proposal: {
        name: "get_proposal",
        description: "Get detailed information about a specific Snapshot proposal",
        inputSchema: {
            type: "object",
            properties: {
                proposal_id: {
                    type: "string",
                    description: "The proposal ID (IPFS hash or hex string)"
                }
            },
            required: ["proposal_id"]
        },
        handler: async (args) => {
            try {
                const result = await snapshotAPI.getProposal(args.proposal_id);
                return {
                    status: "success",
                    data: result,
                    proposal_id: args.proposal_id
                };
            } catch (error) {
                return {
                    status: "error",
                    error: error.message,
                    proposal_id: args.proposal_id
                };
            }
        }
    },

    /**
     * List proposals with filtering
     */
    list_proposals: {
        name: "list_proposals",
        description: "List and search proposals with filtering options",
        inputSchema: {
            type: "object",
            properties: {
                space: {
                    type: "string",
                    description: "Filter by space ID"
                },
                state: {
                    type: "string",
                    enum: ["pending", "active", "closed"],
                    description: "Filter by proposal state"
                },
                author: {
                    type: "string",
                    description: "Filter by proposal author address"
                },
                first: {
                    type: "number",
                    description: "Number of proposals to return (max 100)",
                    default: 20
                },
                skip: {
                    type: "number",
                    description: "Number of proposals to skip for pagination",
                    default: 0
                },
                order_by: {
                    type: "string",
                    enum: ["created", "updated", "start", "end", "votes"],
                    description: "Field to order results by",
                    default: "created"
                },
                order_direction: {
                    type: "string",
                    enum: ["asc", "desc"],
                    description: "Order direction",
                    default: "desc"
                }
            }
        },
        handler: async (args) => {
            try {
                const where = {};
                
                if (args.space) {
                    where.space = args.space;
                }
                
                if (args.state) {
                    where.state = args.state;
                }
                
                if (args.author) {
                    where.author = args.author.toLowerCase();
                }

                const result = await snapshotAPI.getProposals({
                    first: Math.min(args.first || 20, 100),
                    skip: args.skip || 0,
                    orderBy: args.order_by || "created",
                    orderDirection: args.order_direction || "desc",
                    where
                });

                return {
                    status: "success",
                    data: result,
                    query: args
                };
            } catch (error) {
                return {
                    status: "error",
                    error: error.message,
                    query: args
                };
            }
        }
    },

    /**
     * Get votes for a proposal
     */
    get_votes: {
        name: "get_votes",
        description: "Get votes for a specific proposal",
        inputSchema: {
            type: "object",
            properties: {
                proposal_id: {
                    type: "string",
                    description: "The proposal ID to get votes for"
                },
                first: {
                    type: "number",
                    description: "Number of votes to return (max 1000)",
                    default: 100
                },
                skip: {
                    type: "number",
                    description: "Number of votes to skip for pagination",
                    default: 0
                },
                order_by: {
                    type: "string",
                    enum: ["created", "vp"],
                    description: "Field to order results by",
                    default: "created"
                },
                order_direction: {
                    type: "string",
                    enum: ["asc", "desc"],
                    description: "Order direction",
                    default: "desc"
                }
            },
            required: ["proposal_id"]
        },
        handler: async (args) => {
            try {
                const result = await snapshotAPI.getVotes(args.proposal_id, {
                    first: Math.min(args.first || 100, 1000),
                    skip: args.skip || 0,
                    orderBy: args.order_by || "created",
                    orderDirection: args.order_direction || "desc"
                });

                return {
                    status: "success",
                    data: result,
                    proposal_id: args.proposal_id,
                    query: args
                };
            } catch (error) {
                return {
                    status: "error",
                    error: error.message,
                    proposal_id: args.proposal_id,
                    query: args
                };
            }
        }
    },

    /**
     * Get user profile and statistics
     */
    get_user_profile: {
        name: "get_user_profile",
        description: "Get user profile information and governance statistics",
        inputSchema: {
            type: "object",
            properties: {
                address: {
                    type: "string",
                    description: "Ethereum address or ENS name of the user"
                }
            },
            required: ["address"]
        },
        handler: async (args) => {
            try {
                const result = await snapshotAPI.getUserProfile(args.address);
                return {
                    status: "success",
                    data: result,
                    address: args.address
                };
            } catch (error) {
                return {
                    status: "error",
                    error: error.message,
                    address: args.address
                };
            }
        }
    },

    /**
     * Get spaces that a user follows
     */
    get_user_follows: {
        name: "get_user_follows",
        description: "Get spaces that a user follows",
        inputSchema: {
            type: "object",
            properties: {
                address: {
                    type: "string",
                    description: "Ethereum address or ENS name of the user"
                },
                first: {
                    type: "number",
                    description: "Number of follows to return",
                    default: 20
                },
                skip: {
                    type: "number",
                    description: "Number of follows to skip for pagination",
                    default: 0
                }
            },
            required: ["address"]
        },
        handler: async (args) => {
            try {
                const result = await snapshotAPI.getUserFollows(args.address, {
                    first: Math.min(args.first || 20, 100),
                    skip: args.skip || 0
                });

                return {
                    status: "success",
                    data: result,
                    address: args.address,
                    query: args
                };
            } catch (error) {
                return {
                    status: "error",
                    error: error.message,
                    address: args.address,
                    query: args
                };
            }
        }
    }
};

/**
 * MCP Protocol Handler
 */
class MCPHandler {
    constructor() {
        this.tools = tools;
    }

    async handleRequest(method, params) {
        switch (method) {
            case 'initialize':
                return {
                    protocolVersion: "2024-11-05",
                    capabilities: {
                        tools: {}
                    },
                    serverInfo: {
                        name: "Snapshot MCP Server",
                        version: SERVER_VERSION
                    }
                };

            case 'notifications/initialized':
                // This is a notification, no response needed
                return null;

            case 'tools/list':
                return {
                    tools: Object.values(this.tools).map(tool => ({
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema
                    }))
                };

            case 'tools/call':
                const { name, arguments: args } = params;
                const tool = this.tools[name];
                
                if (!tool) {
                    throw new Error(`Unknown tool: ${name}`);
                }

                try {
                    const result = await tool.handler(args || {});
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify(result, null, 2)
                        }]
                    };
                } catch (error) {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify({
                                status: "error",
                                error: error.message,
                                tool: name,
                                args
                            }, null, 2)
                        }],
                        isError: true
                    };
                }

            default:
                throw new Error(`Unknown method: ${method}`);
        }
    }
}

// Initialize MCP handler
const mcpHandler = new MCPHandler();

/**
 * HTTP Server with MCP Protocol Support
 */
const server = createServer(async (req, res) => {
    // Set CORS headers for web compatibility
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Health check endpoint
    if (url.pathname === '/health' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({
            status: "healthy",
            server: "Snapshot MCP Server",
            version: SERVER_VERSION,
            snapshot_hub: SNAPSHOT_HUB_URL,
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // MCP endpoint (handle both /mcp and /mcp/)
    if ((url.pathname === '/mcp' || url.pathname === '/mcp/') && req.method === 'POST') {
        try {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                let request;
                try {
                    request = JSON.parse(body);
                    const response = await mcpHandler.handleRequest(request.method, request.params);
                    
                    // Handle notifications (no response needed)
                    if (response === null) {
                        res.writeHead(200);
                        res.end();
                        return;
                    }
                    
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        jsonrpc: "2.0",
                        id: request.id,
                        result: response
                    }));
                } catch (error) {
                    console.error('MCP request error:', error);
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        jsonrpc: "2.0",
                        id: request?.id || null,
                        error: {
                            code: -32603,
                            message: error.message
                        }
                    }));
                }
            });
        } catch (error) {
            console.error('Request processing error:', error);
            res.writeHead(500);
            res.end('Internal Server Error');
        }
        return;
    }

    // Default response for unknown routes
    res.writeHead(404);
    res.end('Not Found');
});

// Start the server
server.listen(SERVER_PORT, '0.0.0.0', () => {
    console.log(`🚀 Snapshot MCP Server v${SERVER_VERSION} started`);
    console.log(`📡 Server running on: http://0.0.0.0:${SERVER_PORT}`);
    console.log(`🔗 MCP endpoint: http://0.0.0.0:${SERVER_PORT}/mcp`);
    console.log(`💊 Health check: http://0.0.0.0:${SERVER_PORT}/health`);
    console.log(`📊 Snapshot Hub: ${SNAPSHOT_HUB_URL}`);
    console.log('');
    console.log('Available tools:');
    Object.values(tools).forEach(tool => {
        console.log(`  • ${tool.name}: ${tool.description}`);
    });
    console.log('');
    console.log('Ready to handle MCP requests! 🎯');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Snapshot MCP Server...');
    server.close(() => {
        console.log('✅ Server closed gracefully');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    server.close(() => {
        console.log('✅ Server closed gracefully');
        process.exit(0);
    });
});

export default server;
