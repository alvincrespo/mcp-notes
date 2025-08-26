# Notes MCP Server - Learning Project

Welcome to your MCP (Model Context Protocol) server learning project! This server will help you understand how to build AI-integrated tools that work with Claude and other AI assistants.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Server
```bash
npm run build
```

### 3. Test with MCP Inspector
```bash
npm run inspector
```

This opens a web interface where you can test your MCP server tools interactively.

### 4. Development Mode
```bash
npm run dev
```

This runs the server in watch mode, rebuilding when you make changes.

## 🧪 Testing Your Setup

After building, you can test the server using the MCP Inspector:

1. Run `npm run inspector`
2. Open the provided URL in your browser
3. Try calling the "hello_mcp" tool
4. You should see a success message!

## 📁 Project Structure

```
notes-mcp-server/
├── src/
│   ├── index.ts          # Main server entry point
│   ├── storage/          # Data persistence layer (coming soon)
│   ├── tools/            # MCP tool implementations (coming soon)
│   ├── types/            # TypeScript type definitions (coming soon)
│   └── utils/            # Utility functions (coming soon)
├── data/                 # Local data storage
├── tests/                # Test files
├── build/                # Compiled JavaScript (generated)
├── package.json
└── tsconfig.json
```

## 🎯 Learning Progress

- [x] **Environment Setup** - Project structure and dependencies ✅
- [ ] **Basic Server** - Simple MCP server with hello tool ⏳
- [ ] **Note Storage** - File-based note storage system
- [ ] **CRUD Tools** - Create, read, update, delete note tools
- [ ] **Resources** - Serve note content as MCP resources
- [ ] **Prompts** - Template prompts for note operations
- [ ] **Error Handling** - Robust error management
- [ ] **Testing** - Comprehensive test suite
- [ ] **Deployment** - Claude Desktop integration

## 🔧 Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode with auto-reload
- `npm run start` - Start the compiled server
- `npm run inspector` - Open MCP Inspector for testing
- `npm run test` - Run test suite
- `npm run clean` - Remove build files

## 📚 Next Steps

1. **Test the basic server** using MCP Inspector
2. **Examine the code** in `src/index.ts` to understand MCP structure
3. **Follow the development plan** to add note management features
4. **Experiment** with the code - try modifying the hello_mcp tool response

## 🆘 Troubleshooting

### Server Won't Start
- Check Node.js version: `node --version` (needs 18+)
- Rebuild: `npm run clean && npm run build`
- Check for TypeScript errors: `npx tsc --noEmit`

### MCP Inspector Issues
- Make sure the server builds successfully first
- Check that the build/ directory contains index.js
- Try restarting the inspector

### Development Tips
- Always use `console.error()` for logging in MCP servers, not `console.log()`
- The server communicates via stdin/stdout, so stdout must be reserved for MCP messages
- Use the MCP Inspector liberally - it's your best debugging tool

Happy learning! 🎉
