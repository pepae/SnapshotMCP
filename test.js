#!/usr/bin/env node
/**
 * Simple test script for the Snapshot MCP Server
 * Tests the basic "pull" functionality (data retrieval)
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3001';
const MCP_ENDPOINT = `${SERVER_URL}/mcp`;

/**
 * Send an MCP request to the server
 */
async function sendMCPRequest(method, params = {}) {
    try {
        const response = await fetch(MCP_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: Math.random().toString(36).substring(7),
                method,
                params
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(`❌ Request failed:`, error.message);
        return null;
    }
}

/**
 * Test suite for Snapshot MCP Server
 */
async function runTests() {
    console.log('🧪 Testing Snapshot MCP Server\n');

    // Test 1: Health check
    console.log('1️⃣  Testing health endpoint...');
    try {
        const health = await fetch(`${SERVER_URL}/health`);
        if (health.ok) {
            const data = await health.json();
            console.log('✅ Health check passed:', data.status);
        } else {
            console.log('❌ Health check failed');
        }
    } catch (error) {
        console.log('❌ Health check error:', error.message);
    }

    // Test 2: Initialize MCP
    console.log('\n2️⃣  Testing MCP initialization...');
    const initResult = await sendMCPRequest('initialize', {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
            name: "Test Client",
            version: "1.0.0"
        }
    });
    
    if (initResult && initResult.result) {
        console.log('✅ MCP initialization successful');
        console.log('   Protocol version:', initResult.result.protocolVersion);
        console.log('   Server:', initResult.result.serverInfo.name);
    } else {
        console.log('❌ MCP initialization failed');
        return;
    }

    // Test 3: List tools
    console.log('\n3️⃣  Testing tools list...');
    const toolsResult = await sendMCPRequest('tools/list');
    
    if (toolsResult && toolsResult.result && toolsResult.result.tools) {
        console.log('✅ Tools list retrieved');
        console.log(`   Found ${toolsResult.result.tools.length} tools:`);
        toolsResult.result.tools.forEach(tool => {
            console.log(`   • ${tool.name}: ${tool.description}`);
        });
    } else {
        console.log('❌ Tools list failed');
        return;
    }

    // Test 4: Get a popular space (Uniswap)
    console.log('\n4️⃣  Testing get_space with Uniswap...');
    const spaceResult = await sendMCPRequest('tools/call', {
        name: 'get_space',
        arguments: {
            space_id: 'uniswapgovernance.eth'
        }
    });
    
    if (spaceResult && spaceResult.result && spaceResult.result.content) {
        const data = JSON.parse(spaceResult.result.content[0].text);
        if (data.status === 'success' && data.data.space) {
            console.log('✅ Space retrieval successful');
            console.log(`   Space: ${data.data.space.name}`);
            console.log(`   Network: ${data.data.space.network}`);
            console.log(`   Followers: ${data.data.space.followersCount}`);
            console.log(`   Proposals: ${data.data.space.proposalsCount}`);
        } else {
            console.log('❌ Space retrieval failed:', data.error || 'Unknown error');
        }
    } else {
        console.log('❌ Space retrieval request failed');
    }

    // Test 5: List recent proposals from Uniswap
    console.log('\n5️⃣  Testing list_proposals with Uniswap...');
    const proposalsResult = await sendMCPRequest('tools/call', {
        name: 'list_proposals',
        arguments: {
            space: 'uniswapgovernance.eth',
            first: 5,
            order_by: 'created',
            order_direction: 'desc'
        }
    });
    
    if (proposalsResult && proposalsResult.result && proposalsResult.result.content) {
        const data = JSON.parse(proposalsResult.result.content[0].text);
        if (data.status === 'success' && data.data.proposals) {
            console.log('✅ Proposals list successful');
            console.log(`   Found ${data.data.proposals.length} proposals:`);
            data.data.proposals.slice(0, 3).forEach((proposal, index) => {
                const state = proposal.state || 'unknown';
                const date = new Date(proposal.created * 1000).toLocaleDateString();
                console.log(`   ${index + 1}. ${proposal.title} (${state}, ${date})`);
            });
        } else {
            console.log('❌ Proposals list failed:', data.error || 'Unknown error');
        }
    } else {
        console.log('❌ Proposals list request failed');
    }

    // Test 6: Search for spaces
    console.log('\n6️⃣  Testing list_spaces with search...');
    const spacesResult = await sendMCPRequest('tools/call', {
        name: 'list_spaces',
        arguments: {
            search: 'aave',
            first: 3
        }
    });
    
    if (spacesResult && spacesResult.result && spacesResult.result.content) {
        const data = JSON.parse(spacesResult.result.content[0].text);
        if (data.status === 'success' && data.data.spaces) {
            console.log('✅ Spaces search successful');
            console.log(`   Found ${data.data.spaces.length} spaces matching "aave":`);
            data.data.spaces.forEach((space, index) => {
                console.log(`   ${index + 1}. ${space.name} (${space.id})`);
            });
        } else {
            console.log('❌ Spaces search failed:', data.error || 'Unknown error');
        }
    } else {
        console.log('❌ Spaces search request failed');
    }

    console.log('\n🎉 Test suite completed!');
}

// Check if server is running and run tests
async function main() {
    console.log(`🔍 Checking if server is running at ${SERVER_URL}...\n`);
    
    try {
        const health = await fetch(`${SERVER_URL}/health`);
        if (!health.ok) {
            throw new Error(`Server responded with ${health.status}`);
        }
        
        console.log('✅ Server is running, starting tests...\n');
        await runTests();
    } catch (error) {
        console.log('❌ Server is not running or not responding');
        console.log('   Please start the server first with: npm start');
        console.log('   Error:', error.message);
    }
}

main().catch(console.error);
