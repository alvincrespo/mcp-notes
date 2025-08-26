# Code Standards

## TypeScript Configuration

### Required tsconfig.json

@~/tsconfig.json

### TypeScript Rules
1. **Always use TypeScript** - No plain JavaScript files in src/
2. **Strict typing** - Enable all TypeScript strict flags
3. **No `any` types** - Use proper typing or `unknown`
4. **Explicit return types** - For public functions and methods
5. **File extensions** - Always include `.js` in imports for Node.js ESM

## Required Dependencies

@~/package.json

## Import Standards

### Import Organization / Order
```typescript
// 1. Node.js built-ins
import { promises as fs } from 'fs';
import path from 'path';

// 2. External dependencies (alphabetical)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";

// 3. Internal imports - absolute paths preferred
import { UserManager } from "../storage/user-manager.js";
import { validateInput } from "../utils/validation.js";

// 4. Type imports (separate section)
import type { User, CreateUserInput } from "../types/user.js";
```

### Import Rules
1. **ESM syntax only** - Use `import/export` not `require/module.exports`
2. **File extensions required** - Include `.js` extension in imports
3. **Absolute paths preferred** - Avoid deep relative paths like `../../../`
4. **Type imports separate** - Use `import type` for type-only imports
5. **Alphabetical ordering** - Within each section, sort alphabetically

## Code Style Rules

### Formatting Standards
```typescript
// Use Prettier with these settings
// .prettierrc.json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Variable Declarations
```typescript
// ✅ Good - Use const by default
const userId = user.id;
const userList = await getUsers();

// ✅ Good - Use let when reassignment needed
let currentUser = null;
if (userId) {
  currentUser = await getUser(userId);
}

// ❌ Bad - Don't use var
var userName = user.name; // Never use var

// ✅ Good - Destructuring with meaningful names
const { id: userId, name: userName } = user;

// ❌ Bad - Unclear destructuring
const { id, name } = user;
```

### Function Declarations
```typescript
// ✅ Good - Explicit return types for public functions
export async function createUser(
  userData: CreateUserInput
): Promise<User> {
  // Implementation
}

// ✅ Good - Arrow functions for simple operations
const formatUserName = (name: string): string =>
  name.trim().toLowerCase();

// ✅ Good - Function expressions for callbacks
const users = userList.filter(function(user) {
  return user.active;
});

// ❌ Bad - Missing return type on public function
export async function createUser(userData: CreateUserInput) {
  // Return type should be explicit
}
```

### Class Structure
```typescript
export class UserManager {
  // 1. Private properties first
  private storage: StorageInterface;
  private cache: Map<string, User> = new Map();

  // 2. Constructor
  constructor(storage: StorageInterface) {
    this.storage = storage;
  }

  // 3. Public methods
  async createUser(userData: CreateUserInput): Promise<User> {
    // Implementation
  }

  async getUser(id: string): Promise<User | null> {
    // Implementation
  }

  // 4. Private methods last
  private validateUserData(userData: CreateUserInput): void {
    // Implementation
  }
}
```

### Async/Await Standards
```typescript
// ✅ Good - Use async/await consistently
async function processUsers(): Promise<void> {
  try {
    const users = await getUsers();
    const processed = await Promise.all(
      users.map(user => processUser(user))
    );
    await saveProcessedUsers(processed);
  } catch (error) {
    logger.error('Failed to process users:', error);
    throw error;
  }
}

// ❌ Bad - Mixing promises and async/await
async function processUsers(): Promise<void> {
  return getUsers()
    .then(users => Promise.all(users.map(processUser)))
    .then(processed => saveProcessedUsers(processed))
    .catch(error => {
      logger.error('Error:', error);
      throw error;
    });
}
```

## Error Handling Standards

### Exception Types
```typescript
// Base error class
export class MCPError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'MCPError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
export class ValidationError extends MCPError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, details);
  }
}

export class NotFoundError extends MCPError {
  constructor(message: string, details?: unknown) {
    super('NOT_FOUND', message, details);
  }
}
```

### Error Handling Pattern
```typescript
// ✅ Good - Comprehensive error handling
async function createUser(userData: CreateUserInput): Promise<User> {
  try {
    // Validate input
    const validatedData = CreateUserSchema.parse(userData);

    // Check for duplicates
    const existing = await storage.getUserByEmail(validatedData.email);
    if (existing) {
      throw new ValidationError('User with this email already exists');
    }

    // Create user
    const user = await storage.createUser(validatedData);
    logger.info('User created successfully', { userId: user.id });

    return user;
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('User creation failed validation:', error.message);
      throw error;
    }

    logger.error('Unexpected error creating user:', error);
    throw new MCPError('USER_CREATE_FAILED', 'Failed to create user');
  }
}
```

## Logging Standards

### Logger Configuration
```typescript
import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// For STDIO transport, use console.error for startup messages only
if (process.env.MCP_TRANSPORT === 'stdio') {
  console.error('MCP Server starting...');
}
```

### Logging Rules
1. **Never use console.log** - Use structured logging instead
2. **Exception**: `console.error` allowed for STDIO transport initialization
3. **Include context** - Always log relevant IDs and parameters
4. **Log levels**: error, warn, info, debug
5. **Structured data** - Use objects for additional context

## Documentation Standards

### JSDoc Requirements
```typescript
/**
 * Creates a new user in the system.
 *
 * @param userData - The user data to create
 * @param options - Additional options for user creation
 * @returns Promise resolving to the created user
 * @throws {ValidationError} When user data is invalid
 * @throws {StorageError} When database operation fails
 *
 * @example
 * ```typescript
 * const user = await createUser({
 *   name: "John Doe",
 *   email: "john@example.com"
 * });
 * ```
 */
export async function createUser(
  userData: CreateUserInput,
  options?: CreateUserOptions
): Promise<User> {
  // Implementation
}
```

### Comment Guidelines
```typescript
// ✅ Good - Explain WHY, not WHAT
// Cache user data to avoid repeated database queries
const cachedUser = userCache.get(userId);

// ✅ Good - Complex business logic explanation
// Apply discount only if user has been active for 30+ days
// and has made at least 3 purchases
if (daysSinceJoin > 30 && purchaseCount >= 3) {
  discount = 0.1;
}

// ❌ Bad - Obvious comments
// Increment counter by 1
counter++;

// ❌ Bad - Outdated comments
// TODO: Remove this when API v2 is ready (comment from 2019)
```

## Linting Configuration

### ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

## Code Review Standards

### Review Checklist
- [ ] TypeScript types are explicit and accurate
- [ ] Error handling is comprehensive
- [ ] Input validation is implemented
- [ ] Logging is appropriate and structured
- [ ] Tests cover all code paths
- [ ] Documentation is complete
- [ ] Performance considerations addressed
- [ ] Security implications reviewed
