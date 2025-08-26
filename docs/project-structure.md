# Project Structure Standards

## Standard Directory Layout

```
mcp-notes/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # Main server class
│   ├── tools/                # MCP tool implementations
│   │   ├── index.ts          # Tool registry
│   │   └── [tool-name].ts    # Individual tools
│   ├── resources/            # MCP resource handlers
│   │   ├── index.ts          # Resource registry
│   │   └── [resource-name].ts
│   ├── prompts/              # MCP prompt templates
│   │   ├── index.ts          # Prompt registry
│   │   └── [prompt-name].ts
│   ├── storage/              # Data persistence layer
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   ├── config/               # Configuration management
│   └── middleware/           # Request/response middleware
├── tests/                    # Test files
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── data/                     # Local data storage
├── docs/                     # Project documentation
├── scripts/                  # Build/deployment scripts
├── .env.example              # Environment variables template
├── package.json
├── tsconfig.json
├── jest.config.js
├── Dockerfile
├── docker-compose.yml
├── README.md
└── CLAUDE.md                 # Development standards
```

## Naming Conventions

### File and Directory Names
- **Files**: kebab-case (`user-manager.ts`)
- **Directories**: kebab-case (`user-tools/`)
- **Test files**: `[name].test.ts` or `[name].spec.ts`

### Code Naming
- **Classes**: PascalCase (`UserManager`)
- **Functions/Variables**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Types/Interfaces**: PascalCase (`User`, `CreateUserInput`)

### MCP Naming
- **Tools**: snake_case (`create_user`, `list_notes`)
- **Resources**: URI format (`user:///{id}`, `notes:///list`)
- **Prompts**: snake_case (`summarize_notes`, `generate_report`)

## File Organization Rules

### Tool Files (`src/tools/`)
Each tool should have its own file:
```typescript
// src/tools/create-user.ts
export const createUserDefinition = { /* ... */ };
export const createUserHandler = async (input) => { /* ... */ };
```

### Resource Files (`src/resources/`)
Group related resources:
```typescript
// src/resources/user-resources.ts
export const userResourceDefinitions = [
  { pattern: "user:///{id}", /* ... */ },
  { pattern: "users:///list", /* ... */ }
];
export const userResourceHandlers = { /* ... */ };
```

### Type Files (`src/types/`)
Organize by domain:
```typescript
// src/types/user.ts
export interface User { /* ... */ }
export type CreateUserInput = { /* ... */ };
export const UserSchema = z.object({ /* ... */ });
```

### Configuration Files (`src/config/`)
```typescript
// src/config/settings.ts
export interface Config { /* ... */ }
export const defaultConfig: Config = { /* ... */ };
export function loadConfig(): Config { /* ... */ }
```

## Documentation Organization

### Required Documentation
- `README.md` - Project overview and quick start
- `CHANGELOG.md` - Version history
- `CLAUDE.md` - Claude context
- `docs/` - Detailed documentation

### Documentation Standards
- Use clear headings and structure
- Include code examples for all features
- Provide installation instructions
- Document environment variables
- Include troubleshooting section

## Version Control

### Git Workflow
- Use descriptive commit messages
- Create feature branches for new functionality
- Tag releases with semantic versioning
- Keep main branch deployable
- Use pull requests for code review
