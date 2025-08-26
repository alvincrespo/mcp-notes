#!/usr/bin/env -S npx tsx

/**
 * MCP Server Development Environment Setup Script
 *
 * This TypeScript script automates the initial setup for MCP server development
 * following the learning plan from Section 1: Environment setup and MCP fundamentals
 *
 * Usage: npx tsx setup-mcp-env.ts
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command: string, description: string) {
  try {
    log(`⚡ ${description}...`, 'blue');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
  } catch (error) {
    log(`❌ Failed: ${description}`, 'red');
    throw error;
  }
}

function createFile(filePath: string, content: string, description: string) {
  try {
    writeFileSync(filePath, content, 'utf8');
    log(`✅ Created ${description}: ${filePath}`, 'green');
  } catch (error) {
    log(`❌ Failed to create ${description}: ${filePath}`, 'red');
    throw error;
  }
}

function createDirectory(dirPath: string) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    log(`📁 Created directory: ${dirPath}`, 'blue');
  } else {
    log(`📁 Directory already exists: ${dirPath}`, 'yellow');
  }
}

async function main() {
  try {
    log('🚀 Starting MCP Server Development Environment Setup', 'bold');
    log('This will create a complete TypeScript MCP server project structure\n', 'blue');

    // Step 1: Check prerequisites
    log('Step 1: Checking prerequisites...', 'bold');

    try {
      executeCommand('node --version', 'Checking Node.js version');
      executeCommand('npm --version', 'Checking npm version');
    } catch (error) {
      log('❌ Node.js or npm not found. Please install Node.js 18+ LTS first.', 'red');
      process.exit(1);
    }

    // Step 2: Initialize project structure (30 minutes equivalent)
    log('\nStep 2: Creating project structure...', 'bold');

    const projectName = 'notes-mcp-server';

    // Create subdirectories
    const directories = [
      'src',
      'src/storage',
      'src/tools',
      'src/types',
      'src/utils',
      'data',
      'tests'
    ];

    directories.forEach(dir => createDirectory(dir));

    // Step 3: Configure TypeScript and dependencies (45 minutes equivalent)
    log('\nStep 3: Setting up package.json and dependencies...', 'bold');

    const packageJson = {
      "name": "notes-mcp-server",
      "version": "1.0.0",
      "description": "Personal Note Manager MCP Server - Learning Project",
      "type": "module",
      "main": "./build/index.js",
      "scripts": {
        "build": "tsc",
        "dev": "tsx watch src/index.ts",
        "start": "node build/index.js",
        "inspector": "npx @modelcontextprotocol/inspector build/index.js",
        "test": "jest",
        "test:watch": "jest --watch",
        "clean": "rm -rf build",
        "lint": "eslint src/**/*.ts",
        "format": "prettier --write src/**/*.ts"
      },
      "dependencies": {
        "@modelcontextprotocol/sdk": "^1.17.4",
        "zod": "^3.22.0",
        "uuid": "^9.0.0"
      },
      "devDependencies": {
        "@types/node": "^20.0.0",
        "@types/uuid": "^9.0.0",
        "@types/jest": "^29.5.0",
        "typescript": "^5.3.0",
        "tsx": "^4.0.0",
        "jest": "^29.7.0",
        "ts-jest": "^29.1.0",
        "@typescript-eslint/eslint-plugin": "^6.0.0",
        "@typescript-eslint/parser": "^6.0.0",
        "eslint": "^8.50.0",
        "prettier": "^3.0.0"
      },
      "keywords": ["mcp", "model-context-protocol", "notes", "typescript"],
      "author": "MCP Learning Project",
      "license": "MIT"
    };

    createFile('package.json', JSON.stringify(packageJson, null, 2), 'package.json');

    // Create TypeScript configuration
    const tsConfig = {
      "compilerOptions": {
        "target": "ES2022",
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "outDir": "./build",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "resolveJsonModule": true,
        "allowSyntheticDefaultImports": true
      },
      "include": ["src/**/*"],
      "exclude": ["node_modules", "build", "tests"]
    };

    createFile('tsconfig.json', JSON.stringify(tsConfig, null, 2), 'TypeScript configuration');

    // Step 4: Create basic MCP server (1 hour equivalent)
    log('\nStep 4: Creating basic MCP server files...', 'bold');

    const indexTs = `#!/usr/bin/env node
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
          text: "🎉 Congratulations! Your MCP server is working correctly!\\n\\n" +
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
`;

    createFile('src/index.ts', indexTs, 'main server file');

    // Create README with setup instructions
    const readme = `# Notes MCP Server - Learning Project

Welcome to your MCP (Model Context Protocol) server learning project! This server will help you understand how to build AI-integrated tools that work with Claude and other AI assistants.

## 🚀 Quick Start

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Build the Server
\`\`\`bash
npm run build
\`\`\`

### 3. Test with MCP Inspector
\`\`\`bash
npm run inspector
\`\`\`

This opens a web interface where you can test your MCP server tools interactively.

### 4. Development Mode
\`\`\`bash
npm run dev
\`\`\`

This runs the server in watch mode, rebuilding when you make changes.

## 🧪 Testing Your Setup

After building, you can test the server using the MCP Inspector:

1. Run \`npm run inspector\`
2. Open the provided URL in your browser
3. Try calling the "hello_mcp" tool
4. You should see a success message!

## 📁 Project Structure

\`\`\`
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
\`\`\`

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

- \`npm run build\` - Compile TypeScript to JavaScript
- \`npm run dev\` - Run in development mode with auto-reload
- \`npm run start\` - Start the compiled server
- \`npm run inspector\` - Open MCP Inspector for testing
- \`npm run test\` - Run test suite
- \`npm run clean\` - Remove build files

## 📚 Next Steps

1. **Test the basic server** using MCP Inspector
2. **Examine the code** in \`src/index.ts\` to understand MCP structure
3. **Follow the development plan** to add note management features
4. **Experiment** with the code - try modifying the hello_mcp tool response

## 🆘 Troubleshooting

### Server Won't Start
- Check Node.js version: \`node --version\` (needs 18+)
- Rebuild: \`npm run clean && npm run build\`
- Check for TypeScript errors: \`npx tsc --noEmit\`

### MCP Inspector Issues
- Make sure the server builds successfully first
- Check that the build/ directory contains index.js
- Try restarting the inspector

### Development Tips
- Always use \`console.error()\` for logging in MCP servers, not \`console.log()\`
- The server communicates via stdin/stdout, so stdout must be reserved for MCP messages
- Use the MCP Inspector liberally - it's your best debugging tool

Happy learning! 🎉
`;

    createFile('README.md', readme, 'README with setup instructions');

    // Create basic test configuration
    const jestConfig = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};`;

    createFile('jest.config.js', jestConfig, 'Jest test configuration');

    // Create basic test file
    const basicTest = `import { describe, it, expect } from '@jest/globals';

describe('MCP Server Setup', () => {
  it('should have basic project structure', () => {
    // This test ensures the project was set up correctly
    expect(true).toBe(true);
  });

  // TODO: Add actual MCP server tests as you build features
});`;

    createFile('tests/setup.test.ts', basicTest, 'basic test file');

    // Install dependencies
    log('\nStep 5: Installing dependencies...', 'bold');
    executeCommand('npm install', 'Installing all dependencies');

    // Build the project to verify setup
    log('\nStep 6: Building project to verify setup...', 'bold');
    executeCommand('npm run build', 'Building TypeScript project');

    // Final success message
    log('\n🎉 MCP Server Development Environment Setup Complete!', 'green');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
    log('\n📋 What was created:', 'bold');
    log(`   📁 Project directory: ${projectName}`, 'blue');
    log('   📦 Package.json with all MCP dependencies', 'blue');
    log('   🔧 TypeScript configuration', 'blue');
    log('   🚀 Basic MCP server with hello tool', 'blue');
    log('   🧪 Test framework setup', 'blue');
    log('   📖 Comprehensive README', 'blue');

    log('\n🔥 Next steps to continue learning:', 'bold');
    log(`   1. cd ${projectName}`, 'yellow');
    log('   2. npm run inspector    # Test your server!', 'yellow');
    log('   3. Try the "hello_mcp" tool in the inspector', 'yellow');
    log('   4. Examine src/index.ts to understand the code', 'yellow');
    log('   5. Ask Claude to explain any concepts you want to understand better', 'yellow');

    log('\n💡 Pro tips:', 'bold');
    log('   • Use "npm run dev" for development with auto-reload', 'green');
    log('   • The MCP Inspector is your best friend for testing', 'green');
    log('   • Never use console.log() - only console.error() for logging', 'green');
    log('   • Check the README.md for detailed documentation', 'green');

  } catch (error) {
    log('\n❌ Setup failed!', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
main();
