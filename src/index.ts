#!/usr/bin/env node
/**
 * MCP Notes Server Entry Point
 *
 * This is your first MCP server! It demonstrates the basic structure
 * and will be expanded as you learn more MCP concepts.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main() {
  // Create the MCP server instance
  const server = new McpServer({
    name: "notes-server",
    version: "1.0.0"
  });

  // Add a simple greeting tool to test the server
  server.registerTool(
    "hello_mcp",
    {
      title: "Hello MCP",
      description: "A simple greeting tool to test your MCP server setup"
    },
    async () => {
      return {
        content: [{
          type: "text",
          text: "🎉 Congratulations! Your MCP server is working correctly!\n\n" +
                "This is your first MCP tool response. As you progress through " +
                "the learning plan, you'll add more sophisticated tools for " +
                "managing notes, resources, and prompts."
        }]
      };
    }
  );

  // Set up STDIO transport for Claude Desktop integration
  const transport = new StdioServerTransport();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.error('Received SIGINT, shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
  });

  // Connect the server to the transport
  await server.connect(transport);

  // IMPORTANT: Use console.error for logging in STDIO mode
  // Writing to stdout corrupts the JSON-RPC messages
  console.error("🚀 Notes MCP server started successfully!");
  console.error("Ready to receive requests from Claude Desktop or MCP Inspector");
}

// Start the server
main().catch((error) => {
  console.error("❌ Failed to start MCP server:", error);
  process.exit(1);
});
