Building a Streamable HTTP MCP Server for Snapshot Integration
Introduction
Snapshot is a popular off-chain voting platform that many DAOs and crypto communities use for gasless governance. It provides a GraphQL API and a JavaScript SDK for interacting with spaces (communities), proposals, and votes. In this guide, we will implement a Model Context Protocol (MCP) server that exposes Snapshot functionality over a streamable HTTP interface. This will enable personal AI assistants (like Claude or others supporting MCP) to retrieve data (spaces, proposals, votes, etc.) and perform actions (create proposals, cast votes, follow spaces) on Snapshot via natural language commands. The server will use Node.js, Snapshot’s GraphQL API for fetching data, and the Snapshot.js SDK (with an Ethereum wallet) for signing and sending transactions to Snapshot.
Prerequisites and Tools
•	Node.js and NPM: Ensure you have a recent Node.js installed (preferably v18+). Initialize a Node project for our server.
•	Snapshot GraphQL API access: Snapshot’s Hub provides a GraphQL endpoint for querying data. The mainnet endpoint is https://hub.snapshot.org/graphql (and a testnet endpoint at https://testnet.hub.snapshot.org/graphql)[1]. No authentication is required for basic use (rate-limited to 60 requests/min)[2], but you can obtain an API key for higher limits if needed.
•	Snapshot.js SDK: The official JavaScript client by Snapshot Labs. Install it with npm install @snapshot-labs/snapshot.js. This library provides convenient methods to cast votes, create proposals, follow spaces, etc., using signed messages[3][4].
•	Ethereum Provider and Wallet: We need an Ethereum wallet to sign Snapshot messages (off-chain votes/proposals use EIP-712 signatures). We will use Ethers.js (already a dependency of snapshot.js) to manage the key. You should have a private key for an Ethereum address (on the relevant network) that will be used by the server for signing. Store this safely (e.g. in an environment variable). We’ll also use an RPC provider (e.g. Infura or Alchemy) to get blockchain data like the latest block number and to instantiate the signer.
Project Setup
1.	Initialize the project: Create a new directory for the server and run npm init -y. Then install dependencies:
 	npm install @snapshot-labs/snapshot.js @ethersproject/providers @ethersproject/wallet express dotenv
 	Here we include Express (for the HTTP server) and dotenv (to load environment variables, e.g. your private key and RPC credentials).
2.	Configure environment: In a .env file (or through your hosting environment), set your wallet’s private key and any API keys. For example:
 	PRIVKEY="<your_ethereum_private_key>"
INFURA_PROJECT_ID="<your_infura_id>"
 	The private key will allow the server to sign Snapshot messages (“wallet signature”). Important: Keep this key secure and never expose it publicly.
3.	Import required modules: In your server code (e.g. index.js or server.js), import the libraries:
 	import express from 'express';
import snapshot from '@snapshot-labs/snapshot.js';
import { InfuraProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import dotenv from 'dotenv';
dotenv.config();
 	Using ES modules or CommonJS as you prefer. Load environment variables at the top.
4.	Initialize Snapshot client and Ethereum signer:
 	const HUB_URL = 'https://hub.snapshot.org';  // mainnet hub (use testnet URL if needed)
const client = new snapshot.Client712(HUB_URL);

// Set up Ethereum provider and wallet signer
const provider = new InfuraProvider('mainnet', process.env.INFURA_PROJECT_ID);
const signer = new Wallet(process.env.PRIVKEY, provider);
 	We create a Snapshot.js client pointing to the Snapshot Hub. Client712 uses EIP-712 signing under the hood (this is the current Snapshot signing scheme). We then instantiate an ethers provider (here Infura for Mainnet) and a Wallet with our private key attached to that provider. The wallet signer will be used to sign messages for proposals and votes. (You can also use snapshot.utils.getProvider(network) to get a default archive provider for a given network[5].)
5.	Create the Express app and enable streaming responses:
 	const app = express();
app.use(express.json());  // to parse JSON request bodies
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Snapshot server listening on port ${PORT}`);
});
 	We will design our endpoints to flush output as needed, enabling streaming of results. In Express, you can call res.write() to send partial data and res.flush() (if using compression or certain configurations) or simply not end the response until all data is sent. We will ensure large query results are sent in chunks.
Retrieving Snapshot Data via GraphQL
The Snapshot Hub GraphQL API allows querying almost all Snapshot data (spaces, proposals, votes, etc.). We will implement read-only endpoints that proxy specific GraphQL queries and return results to the client (the AI assistant) in real-time. Key queries include:
•	Spaces: Retrieve details of one or many spaces (Snapshot “spaces” are like communities or DAOs). For example, to get a single space by its ID (which is usually an ENS name like yam.eth), you can query:
 	query {
  space(id: "yam.eth") {
    id
    name
    network
    symbol
    members
  }
}
 	This returns the space’s basic info: name, the network (chain ID) it uses, its governance token symbol, members, etc[6][7]. Our server will implement a route like GET /space/:id which internally executes such a GraphQL query (substituting the :id parameter) and streams back the JSON result.
•	Multiple Spaces: You can also query a list of spaces with filters (e.g., a list of IDs or pagination). For instance, GraphQL can fetch spaces sorted by creation time, etc[8]. We might expose an endpoint GET /spaces that accepts query params for filtering (like ?ids=space1,space2 or pagination) and returns the array of spaces as JSON. This can leverage a query like spaces(first:20, skip:0, orderBy:"created", orderDirection: asc) { ... }[8].
•	Proposals: To get data about proposals, we can query by proposal ID or list proposals for a space. For example, Get a single proposal by ID:
 	query {
  proposal(id: "QmWbpCtwdLzxuLKnMW4Vv4MPFd2pdPX71YBKPasfZxqLUS") {
    id
    title
    body
    choices
    start
    end
    state
    author
    space { id name }
  }
}
 	The id here is a content hash (an IPFS CID) that uniquely identifies the proposal. This would return details like the proposal’s title, description (body), choices, timestamps, current state (active/closed), author address, etc.[9]. We will implement GET /proposal/:id to fetch a specific proposal.
To list proposals in a space, GraphQL provides a proposals query, where we can filter by space and state. For example:
query {
  proposals(first: 20, where: { space_in: ["yam.eth"], state: "closed" }) {
    id
    title
    start
    end
    state
    author
  }
}
This would retrieve recent proposals in the yam.eth space that have closed[10]. We can map this to a GET /proposals?space=yam.eth&state=active|closed in our API.
•	Votes: To get votes on a proposal, the GraphQL votes query can return all votes given a proposal ID. For example:
 	query {
  votes(first: 1000, where: { proposal: "<proposal_id>" }) {
    voter
    choice
    vp
    created
  }
}
 	This returns each vote with the voter’s address, their choice (as an index or value), voting power, etc. We will provide an endpoint GET /votes?proposal=<id> to fetch votes for a proposal. (Keep in mind the proposal ID should be the Snapshot proposal ID; our server can accept either the IPFS hash or the hex string and handle conversion if needed.)
•	Other queries: Snapshot’s API also supports querying follows (which users follow which spaces), user profiles (name, avatar, etc. for an address), and space roles/permissions[11]. If “full interaction” is needed, you may implement endpoints for these as well (e.g., GET /user/:address to get profile info, GET /follows?follower=... to see what spaces a user follows, etc.). These are optional and can be added similarly by constructing the corresponding GraphQL queries.
Implementing the GraphQL proxy in code: We can use a library like node-fetch or Axios to send POST requests to the GraphQL endpoint. For example, inside the /space/:id route:
app.get('/space/:id', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const spaceId = req.params.id;
  const query = {
    query: `query { space(id: "${spaceId}") {
              id name network symbol members } }`
  };
  try {
    const response = await fetch(HUB_URL + '/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    if (!response.ok) throw new Error(`GraphQL error: ${response.status}`);
    // Stream the response
    const body = await response.body;  // get the ReadableStream
    for await (const chunk of body) {
      res.write(chunk);  // write chunks directly to the response
    }
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
In the above code, we stream the raw response from Snapshot Hub to the client by iterating over the response body stream and writing it to res. This ensures the data is sent in a streamable fashion. The same pattern can be applied to other GET endpoints (just adjusting the GraphQL query and perhaps processing results if needed). If the data is not too large, you could also simply const data = await response.json(); res.json(data); – but using res.write with chunks gives more control for streaming in real-time.
Note on API rate limits: The 60 req/min limit on the Hub means if the assistant queries very frequently, you might hit the rate cap[2]. For heavy usage or production, consider applying for an API key and include it in your GraphQL requests (Snapshot’s docs provide a guide for this).
Creating Proposals via Snapshot.js
One core feature of Snapshot is the ability to create proposals for voting. This requires an authenticated action (signature) from a wallet that has permission (usually any member can propose, unless a space restricts it). We will implement a POST endpoint (e.g. POST /proposal) to create a new proposal on Snapshot. This will utilize the Snapshot.js SDK to prepare and broadcast the proposal.
Endpoint design: The client (AI assistant) should send a JSON payload describing the proposal. For example, the JSON might include:
{
  "space": "your-space.eth",
  "title": "My Proposal Title",
  "body": "Proposal description text...",
  "choices": ["Option A", "Option B", "Option C"],
  "start": <startTimestamp>,
  "end": <endTimestamp>,
  "type": "single-choice",
  "discussion": "<optional discussion link>",
  "app": "my-app"
}
The server will take this input, fill in any additional required fields, and call Snapshot.js’s client.proposal method.
Using Snapshot.js to create a proposal: We have already initialized client and our signer. To create a proposal:
app.post('/proposal', async (req, res) => {
  const { space, title, body, choices, start, end, type, discussion, app } = req.body;
  if (!space || !title || !body || !choices || !start || !end || !type) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    // Ensure timestamps are in seconds (Snapshot expects Unix timestamps in seconds)
    const startTimestamp = Math.floor(new Date(start).getTime() / 1000) || start;
    const endTimestamp = Math.floor(new Date(end).getTime() / 1000) || end;
    // Get the current block number for snapshot
    const network = req.body.network || '1';  // network id as string, default Ethereum mainnet
    const blockNumber = await provider.getBlockNumber();
    // Prepare the proposal payload
    const proposalData = {
      space,
      type,                       // e.g. 'single-choice'
      title,
      body,
      choices,                    // array of choice strings
      start: startTimestamp,
      end: endTimestamp,
      snapshot: blockNumber,      // block number at which voting power is calculated
      network,                    // chain id, e.g. "1" for Ethereum mainnet[12]
      discussion: discussion || "",
      plugins: JSON.stringify({}),// use {} or specific plugins if any
      app: app || "mcp-server"    // identify the app/integration name
    };
    // Send the proposal using snapshot.js
    const receipt = await client.proposal(signer, signer.address, proposalData);
    // The receipt typically contains an IPFS hash of the proposal (content identifier)
    return res.status(200).json({ result: "Proposal created", receipt });
  } catch (error) {
    console.error("Proposal creation failed:", error);
    res.status(500).json({ error: error.message });
  }
});
Let’s break down what happens above: - We collect and validate the required fields from the request. The start and end can be given as datetime strings or timestamps; we convert to Unix time in seconds. - We determine the current blockchain state: snapshot (block number) and network. The snapshot field in the proposal is crucial – it fixes the block height at which voters’ token balances (voting power) are measured[12]. We fetch the latest block via our provider. The network field should match the space’s network (e.g., "1" for mainnet, "5" for Goerli testnet, etc.). You could also fetch the space’s network via GraphQL to be sure, or trust the client’s input. - We call client.proposal(signer, signer.address, proposalData). The Snapshot.js SDK will prepare an EIP-712 signed message using our signer (the wallet loaded with our private key) and submit it to the Snapshot Hub. On success, it returns a receipt – typically the IPFS hash (CID) where the proposal is stored, or an object containing that. For example, after creation you might get an ID like "0x4903dd16990de740...f69455" (a hex string) or an IPFS hash, which can be used to retrieve the proposal via the API. - We return a JSON response to the client. This could be streamed as well if needed (in most cases it’s small). The response includes a success message and the receipt (so the assistant/user can know the proposal ID).
Example: If we post a proposal to space "your-space.eth", the server will respond with something like:
{
  "result": "Proposal created",
  "receipt": {
     "id": "0x4903dd16990de7...69455"
  }
}
The id is the proposal’s identifier. The user can then query /proposal/0x4903dd... (or the GraphQL API) to confirm the content.
Note: The wallet used must have permission to create proposals in that space. Most Snapshot spaces allow any community member to propose, but some have a minimum token balance requirement or limit proposals to admins. The server does not enforce this itself; if the account lacks permissions, the Snapshot Hub will reject the proposal.
Casting Votes via Snapshot.js
Another critical feature is allowing the assistant (via our server) to cast votes on proposals. We will add a POST endpoint (e.g. POST /vote) that takes the proposal ID and the chosen option, then submits a signed vote.
Endpoint design: The client should provide the target proposal ID and their choice (and optionally a reason). For example:
{
  "proposal": "0x4903dd16990de7...69455",
  "choice": 1,
  "reason": "I support this proposal.",
  "space": "your-space.eth",
  "app": "my-app"
}
Here choice is the index of the option (1-indexed on Snapshot: 1 for first option)[13]. The space should be specified as well to avoid ambiguity. We’ll use Snapshot.js to send the vote:
app.post('/vote', async (req, res) => {
  const { proposal, choice, space, reason, app } = req.body;
  if (!proposal || !choice || !space) {
    return res.status(400).json({ error: "Missing proposal, choice or space" });
  }
  try {
    const voteData = {
      space,
      proposal,
      type: 'single-choice',       // assuming single-choice voting; adjust if multi-choice
      choice: Number(choice),      // choice index (integer)
      reason: reason || '',
      app: app || 'mcp-server'
    };
    const receipt = await client.vote(signer, signer.address, voteData);
    return res.status(200).json({ result: "Vote cast", receipt });
  } catch (error) {
    console.error("Voting failed:", error);
    res.status(500).json({ error: error.message });
  }
});
This is straightforward: we construct the vote payload and call client.vote(signer, signer.address, voteData). The SDK will handle creating the signed message (which includes the voter’s address, proposal ID, selected choice, etc.) and send it to Snapshot. If successful, we get a receipt which might include a vote ID or just confirmation. We then return a success message.
Just like proposals, the account must have voting power in the space for that proposal (e.g., hold the governance token at the snapshot block). If not, the vote might still be recorded as 0 weight (Snapshot will mark it accordingly). The reason field is optional; it lets the user add a justification for their vote which will be visible on Snapshot.
Choosing the proposal ID format: Snapshot proposals are identified by a hash. In the GraphQL data, you might see an IPFS CID (Qm...) as the proposal id. The Snapshot.js client typically expects the proposal ID in bytes32 hex format (as seen in the docs example)[13]. If your input is a Qm... string, you may need to convert it to the hex representation. However, often the Snapshot Hub returns the proposal ID as a 0x... hash as well. You can store or communicate the proposal ID in hex form to simplify this. In our implementation, we assume the client provides the correct format (0x...); you could enhance the server to accept either and convert if necessary.
Following Spaces and Managing Spaces (Optional)
For completeness, our MCP server can support other interactions: - Follow a space (join): Snapshot allows users to "follow" a space (which essentially means they become a member or subscriber). The Snapshot.js SDK provides client.follow() for this. We can implement POST /follow where the request body contains a space field (space ID to follow). Similar to voting, we’d call:
const receipt = await client.follow(signer, signer.address, { space });
This will sign and send a follow action, making our wallet address follow the given space. If successful, the receipt might include a follow ID. (On the GraphQL side, this corresponds to an entry you can retrieve via the follows query filtering by follower address[14][15].)
•	Create/Edit a space: This is a more advanced operation, usually restricted to space admins or owners. Snapshot.js provides a client.space() method to publish new space settings. If our server’s wallet is an admin of a space (or creating a new one), we could accept a POST /space with a JSON of all settings (name, symbol, strategies, etc.). The server would then call client.space(signer, signer.address, { space: "<space_id>", settings: JSON.stringify({...}) })[3][4]. This essentially writes the configuration to Snapshot (on IPFS). Unless you specifically need to automate space creation or updates via the assistant, this endpoint can be optional, as it requires crafting a large settings JSON and proper permissions.
If you implement these, structure the code similarly: parse input, use the Snapshot.js method, handle the receipt, and return a JSON response.
Streaming HTTP Responses
Our server is designed to work with AI assistants that expect streaming responses over HTTP. In practice, this means we should send data progressively as it’s available, rather than waiting to compile the entire result. We touched on this in the GraphQL section, using res.write() for chunks. Here are a few best practices to ensure good streaming behavior: - Set appropriate headers: For streaming JSON, you can use Content-Type: application/json; charset=utf-8 and optionally Transfer-Encoding: chunked (which is usually automatic in Node when using res.write). You generally should not use Content-Length (since we don’t know the full length upfront). - Flush data periodically: If constructing JSON manually, you might flush every N items or at logical breaks. For example, if streaming a large list of proposals, you could write a "[" then for each proposal write the JSON and a comma, etc., flushing along the way, and finally write the closing ]. This ensures the client (assistant) starts receiving and processing data immediately. If using the proxy streaming approach (piping the fetch response to the client), data will flow as it comes from Snapshot. - Handle connection close: If the client/assistant disconnects mid-stream, your server should handle the res.write throwing or res.finished becoming true, and stop processing further to save resources.
Using Express, an alternative approach is to use Server-Sent Events (SSE) for streaming. However, given the simplicity of our use-case (mostly request/response calls), chunked transfer as shown is sufficient and widely supported.
Testing the MCP Server
After implementing the endpoints, test them individually: 1. Run the server: node server.js (or use nodemon). Ensure it starts without errors. 2. Test GraphQL endpoints: Use curl or Postman to GET a known space, e.g. curl http://localhost:3000/space/yam.eth. You should see the JSON response with Yam’s data streamed or returned. Test proposals and votes endpoints similarly with valid IDs. 3. Test proposal creation: Pick a space (perhaps on testnet to avoid real consequences) where your wallet has some voting power. For example, if using a Goerli test space, adjust the HUB_URL to testnet and provider to Goerli. Then POST a JSON to /proposal. Verify that you get a success and an ID, and check on snapshot.org (or via GraphQL) that the proposal exists. 4. Test voting: Create a dummy proposal (or find an active one on a test space where your wallet has tokens) and try POST /vote. Verify the vote appears via the API or on the Snapshot UI.
Throughout testing, watch the server logs for errors. The Snapshot Hub might return errors if, for example, the space ID is invalid, or the proposal parameters don’t meet the space’s rules (e.g., start/end times not adhering to the space’s voting window settings). Adjust as needed and handle such errors gracefully (return them to the client).
Deployment and Usage
Once your MCP server is functioning, you can deploy it (on a VPS or cloud service). Ensure the environment variables (private key, RPC URL) are set in the production environment. Since this server holds a private key, treat it with care: use secure hosting and consider restricting access (e.g., with an API token or IP allowlist) if exposing it to the internet.
To use the server with Claude or another MCP-capable assistant, provide the server’s URL in the assistant’s tool integration interface. For example, in Claude’s web interface, you can add a Remote MCP server by specifying the base URL of your API. The assistant will then be able to call the defined endpoints when a user asks something that requires Snapshot data or actions.
Example interactions: - User: "How many votes did the latest proposal in yam.eth get?" – The assistant could call GET /proposals?space=yam.eth&state=closed to find the latest closed proposal, then GET /votes?proposal=<id> to count votes, all via the MCP server. - User: "Submit a proposal on my-space.eth to increase the treasury limit." – The assistant may gather details and then call POST /proposal with the given title/body/choices to create the proposal on Snapshot. - User: "Vote FOR the proposal X in my-space.eth" – The assistant can call POST /vote with the proposal ID and choice index corresponding to "FOR".
All such interactions become possible with our HTTP MCP server acting as the bridge between the natural language assistant and the Snapshot governance platform.
Conclusion
By following this guide, you now have a comprehensive server that exposes Snapshot’s full capabilities (data retrieval and on-chain-like actions through off-chain signatures) in a streamable HTTP format. We leveraged Snapshot’s GraphQL API for flexible queries[2] and the Snapshot.js SDK for trusted message signing and submission[3]. The implementation balanced best practices for MCP (streaming responses, stateless HTTP calls) with the requirements of Snapshot (cryptographic signatures and specific data formats).
With this setup, AI assistants can interact with decentralized governance processes in real-time – querying proposals, analyzing outcomes, and even participating in votes and proposal creation on behalf of users. This empowers new use cases where governance data and actions are integrated into conversational interfaces. Just be sure to maintain the security of your signing key and stay within API usage guidelines. Happy building, and enjoy bridging AI with blockchain governance through your new MCP Snapshot server!
Sources: Snapshot Hub API Documentation[6][7], Snapshot.js Usage Examples[3][4], and community implementation guides[13].
________________________________________
[1] [2] [6] [7] [8] [9] [10] [11] [14] [15] API | snapshot
https://docs.snapshot.box/tools/api
[3] [4] [5] [12] Automating Snapshot Proposals for Voting
https://streamingrat.com/news/automating-snapshot-proposals-for-voting/
[13] Vote on a Snapshot with a deployed Safe using the Safe SDK? - Ethereum Stack Exchange
https://ethereum.stackexchange.com/questions/156653/vote-on-a-snapshot-with-a-deployed-safe-using-the-safe-sdk
