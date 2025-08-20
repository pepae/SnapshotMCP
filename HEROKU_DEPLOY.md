# Snapshot MCP Server - Heroku Deployment

## Environment Variables
Set these in your Heroku app settings:

```bash
PORT=3001
SNAPSHOT_HUB_URL=https://hub.snapshot.org
NODE_ENV=production
```

## Deployment Commands

```bash
# Login to Heroku
heroku login

# Create a new Heroku app
heroku create your-snapshot-mcp-server

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SNAPSHOT_HUB_URL=https://hub.snapshot.org

# Deploy to Heroku
git add .
git commit -m "Deploy Snapshot MCP server"
git push heroku main

# Check logs
heroku logs --tail
```

## API Endpoints
Once deployed, your server will be available at:
- Health check: `https://your-app-name.herokuapp.com/health`
- MCP endpoint: `https://your-app-name.herokuapp.com/mcp`

## Usage in VS Code
Update your `mcp.json` to use the Heroku URL:
```json
{
  "mcpServers": {
    "Snapshot MCP": {
      "command": "node",
      "args": [
        "path/to/mcp-client.js",
        "https://your-app-name.herokuapp.com/mcp"
      ]
    }
  }
}
```
