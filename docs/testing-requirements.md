# Testing Requirements - Vitest Edition

## Test Structure Standards

### Directory Organization
```
tests/
├── unit/                    # Unit tests
│   ├── tools/              # Tool-specific tests
│   ├── resources/          # Resource handler tests
│   ├── prompts/            # Prompt template tests
│   ├── storage/            # Storage layer tests
│   └── utils/              # Utility function tests
├── integration/            # Integration tests
│   ├── mcp-server.test.ts # Full server tests
│   ├── tool-chains.test.ts # Multi-tool workflows
│   └── error-flows.test.ts # Error scenario tests
├── fixtures/               # Test data
│   ├── sample-data.json
│   ├── test-configs/
│   └── mock-responses/
├── helpers/                # Test utilities
│   ├── test-server.ts     # Test server setup
│   ├── mock-storage.ts    # Storage mocks
│   └── fixtures.ts        # Test data helpers
└── performance/           # Performance tests
    └── load-tests.ts
```

## Vitest Configuration

### vitest.config.ts
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Test file patterns
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    exclude: ['node_modules/**', 'build/**', 'dist/**'],

    // Global test setup
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/index.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts'
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      },
      // Exclude specific lines from coverage
      skipFull: false,
      all: true
    },

    // Timeout configuration
    testTimeout: 30000,
    hookTimeout: 10000,

    // Better error reporting
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: 'test-results.json',
      html: 'test-results.html'
    },

    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,

    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1
      }
    },

    // Setup files
    setupFiles: ['./tests/setup.ts']
  },

  // Path resolution (equivalent to moduleNameMapping)
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },

  // ESM support
  esbuild: {
    target: 'es2022'
  }
})
```

### Test Setup
```typescript
// tests/setup.ts
import { beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { logger } from '../src/utils/logger.js'

// Set test environment
process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = 'error'

// Suppress logs during testing
beforeAll(() => {
  logger.level = 'error'
})

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks()
  vi.restoreAllMocks()

  // Clear any timers
  vi.clearAllTimers()

  // Reset modules if needed
  vi.resetModules()
})

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Mock console methods for cleaner test output
const originalConsoleError = console.error
beforeAll(() => {
  console.error = vi.fn()
})

afterEach(() => {
  console.error = originalConsoleError
})
```

## Unit Testing Patterns

### Tool Testing Pattern
```typescript
// tests/unit/tools/create-note.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NotesServer } from '../../../src/server.js'
import { MockStorage } from '../../helpers/mock-storage.js'
import { createTestServer } from '../../helpers/test-server.js'

describe('CreateNoteTool', () => {
  let server: NotesServer
  let mockStorage: MockStorage

  beforeEach(async () => {
    mockStorage = new MockStorage()
    server = createTestServer({ storage: mockStorage })
    await server.initialize()
  })

  afterEach(async () => {
    await server.shutdown()
  })

  describe('successful creation', () => {
    it('should create note with valid input', async () => {
      const input = {
        title: 'Test Note',
        content: 'This is a test note',
        tags: ['test', 'example']
      }

      const result = await server.callTool('create_note', input)

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        message: expect.stringContaining('Created note "Test Note"'),
        noteId: expect.any(String)
      })

      // Verify storage was called
      expect(mockStorage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Note',
          content: 'This is a test note',
          tags: ['test', 'example']
        })
      )
    })

    it('should create note without optional fields', async () => {
      const input = {
        title: 'Simple Note',
        content: 'Basic content'
      }

      const result = await server.callTool('create_note', input)

      expect(result.success).toBe(true)
      expect(mockStorage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Simple Note',
          content: 'Basic content',
          tags: [] // Default empty array
        })
      )
    })

    it('should generate unique IDs for concurrent creation', async () => {
      const promises = Array(5).fill(null).map((_, i) =>
        server.callTool('create_note', {
          title: `Concurrent Note ${i}`,
          content: 'Content'
        })
      )

      const results = await Promise.all(promises)
      const noteIds = results.map(r => r.data.noteId)

      // All should be successful
      expect(results.every(r => r.success)).toBe(true)

      // All IDs should be unique
      const uniqueIds = new Set(noteIds)
      expect(uniqueIds.size).toBe(5)
    })
  })

  describe('validation errors', () => {
    it.each([
      { title: '', content: 'Content', expectedError: 'title' },
      { title: 'Title', content: '', expectedError: 'content' },
      { title: 'x'.repeat(201), content: 'Content', expectedError: 'too long' }
    ])('should reject invalid input: $title', async ({ title, content, expectedError }) => {
      const result = await server.callTool('create_note', { title, content })

      expect(result.success).toBe(false)
      expect(result.error).toContain(expectedError)
    })

    it('should sanitize malicious input', async () => {
      const input = {
        title: '<script>alert("xss")</script>Clean Title',
        content: 'Content with <script>evil()</script> script'
      }

      const result = await server.callTool('create_note', input)

      expect(result.success).toBe(true)

      const createCall = mockStorage.create.mock.calls[0][0]
      expect(createCall.title).not.toContain('<script>')
      expect(createCall.content).not.toContain('<script>')
    })
  })

  describe('storage errors', () => {
    it('should handle storage failure gracefully', async () => {
      mockStorage.create.mockRejectedValueOnce(new Error('Storage failure'))

      const input = {
        title: 'Test Note',
        content: 'Test content'
      }

      const result = await server.callTool('create_note', input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('storage error')
    })

    it('should handle duplicate detection', async () => {
      const validationError = new Error('Note with this title already exists')
      validationError.name = 'ValidationError'
      mockStorage.create.mockRejectedValueOnce(validationError)

      const input = {
        title: 'Duplicate Note',
        content: 'Test content'
      }

      const result = await server.callTool('create_note', input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('already exists')
    })
  })

  describe('edge cases', () => {
    it('should handle very long content', async () => {
      const input = {
        title: 'Long Content Note',
        content: 'x'.repeat(50000) // Very long content
      }

      const result = await server.callTool('create_note', input)
      expect(result.success).toBe(true)
    })

    it('should handle special characters in title', async () => {
      const input = {
        title: 'Note with émojis 🚀 and üñíçødé',
        content: 'Test content'
      }

      const result = await server.callTool('create_note', input)
      expect(result.success).toBe(true)
    })

    it.each([
      { title: 'Test 1', content: 'Content', tags: [] },
      { title: 'Test 2', content: 'Content', tags: undefined },
      { title: 'Test 3', content: 'Content' } // No tags field
    ])('should handle tags variations: %o', async (input) => {
      const result = await server.callTool('create_note', input)
      expect(result.success).toBe(true)
    })
  })
})
```

### Resource Testing Pattern
```typescript
// tests/unit/resources/note-resource.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NoteResourceHandler } from '../../../src/resources/note-resource.js'
import { MockStorage } from '../../helpers/mock-storage.js'
import { createSampleNote } from '../../fixtures/notes.js'

describe('NoteResource', () => {
  let resourceHandler: NoteResourceHandler
  let mockStorage: MockStorage

  beforeEach(() => {
    mockStorage = new MockStorage()
    resourceHandler = new NoteResourceHandler(mockStorage)
  })

  describe('successful retrieval', () => {
    it('should return note resource by ID', async () => {
      const sampleNote = createSampleNote({
        id: 'test-note-123',
        title: 'Test Note',
        content: 'Note content here'
      })

      mockStorage.getById.mockResolvedValueOnce(sampleNote)

      const result = await resourceHandler.handle({ id: 'test-note-123' })

      expect(result).toMatchObject({
        uri: 'note:///test-note-123',
        mimeType: 'text/markdown',
        content: expect.stringContaining('# Test Note')
      })

      expect(result.content).toContain('Note content here')
    })

    it('should format content as markdown', async () => {
      const note = createSampleNote({
        title: 'My Note',
        content: 'This is **bold** text',
        tags: ['work', 'important']
      })

      mockStorage.getById.mockResolvedValueOnce(note)

      const result = await resourceHandler.handle({ id: note.id })

      expect(result.content).toMatch(/^# My Note\n\n/)
      expect(result.content).toContain('This is **bold** text')
      expect(result.content).toContain('Tags: work, important')
    })

    it('should cache resource requests', async () => {
      const note = createSampleNote({ id: 'cached-note' })
      mockStorage.getById.mockResolvedValue(note)

      // First request
      await resourceHandler.handle({ id: 'cached-note' })
      // Second request
      await resourceHandler.handle({ id: 'cached-note' })

      // Storage should only be called once due to caching
      expect(mockStorage.getById).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('should throw NotFoundError for non-existent note', async () => {
      mockStorage.getById.mockResolvedValueOnce(null)

      await expect(
        resourceHandler.handle({ id: 'non-existent' })
      ).rejects.toThrow('Note non-existent not found')
    })

    it.each([
      { id: '', name: 'empty string' },
      { id: null, name: 'null' },
      { id: undefined, name: 'undefined' }
    ])('should validate ID parameter: $name', async ({ id }) => {
      await expect(
        resourceHandler.handle({ id })
      ).rejects.toThrow('Invalid resource ID')
    })
  })
})
```

### Storage Testing Pattern with File System Mocking
```typescript
// tests/unit/storage/json-storage.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import { JsonNotesStorage } from '../../../src/storage/json-storage.js'
import { Note } from '../../../src/types/note.js'

// Mock the file system
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    rename: vi.fn(),
    access: vi.fn(),
    mkdir: vi.fn(),
    unlink: vi.fn(),
    rmdir: vi.fn()
  }
}))

const mockFs = vi.mocked(fs)

describe('JsonNotesStorage', () => {
  let storage: JsonNotesStorage
  let testDataPath: string

  beforeEach(async () => {
    testDataPath = path.join(process.cwd(), 'test-data', `notes-${Date.now()}.json`)
    storage = new JsonNotesStorage(testDataPath)

    // Reset mocks
    vi.clearAllMocks()

    // Default mock implementations
    mockFs.access.mockResolvedValue(undefined)
    mockFs.mkdir.mockResolvedValue(undefined)
    mockFs.readFile.mockRejectedValue({ code: 'ENOENT' })
    mockFs.writeFile.mockResolvedValue(undefined)
    mockFs.rename.mockResolvedValue(undefined)
  })

  describe('initialization', () => {
    it('should create data directory if it does not exist', async () => {
      mockFs.access.mockRejectedValueOnce({ code: 'ENOENT' })

      await storage.initialize()

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        path.dirname(testDataPath),
        { recursive: true }
      )
    })

    it('should load existing notes on initialization', async () => {
      const existingNotes = [
        { id: '1', title: 'Note 1', content: 'Content 1', tags: [], created: '2024-01-01', updated: '2024-01-01' }
      ]

      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(existingNotes))

      await storage.initialize()

      const notes = await storage.getAllNotes()
      expect(notes).toHaveLength(1)
      expect(notes[0].title).toBe('Note 1')
    })

    it('should handle corrupted JSON gracefully', async () => {
      mockFs.readFile.mockResolvedValueOnce('invalid json')

      await expect(storage.initialize()).resolves.not.toThrow()

      const notes = await storage.getAllNotes()
      expect(notes).toHaveLength(0)
    })
  })

  describe('CRUD operations', () => {
    beforeEach(async () => {
      await storage.initialize()
    })

    it('should create and retrieve notes', async () => {
      const created = await storage.createNote(
        'Test Note',
        'Test content',
        ['test']
      )

      expect(created).toMatchObject({
        id: expect.any(String),
        title: 'Test Note',
        content: 'Test content',
        tags: ['test'],
        created: expect.any(String),
        updated: expect.any(String)
      })

      const retrieved = await storage.getNote(created.id)
      expect(retrieved).toEqual(created)
    })

    it('should return null for non-existent note', async () => {
      const result = await storage.getNote('non-existent-id')
      expect(result).toBeNull()
    })

    it('should list all notes', async () => {
      await storage.createNote('Note 1', 'Content 1')
      await storage.createNote('Note 2', 'Content 2')

      const notes = await storage.getAllNotes()
      expect(notes).toHaveLength(2)
      expect(notes.map(n => n.title)).toEqual(
        expect.arrayContaining(['Note 1', 'Note 2'])
      )
    })

    it('should delete notes', async () => {
      const note = await storage.createNote('To Delete', 'Content')

      const deleted = await storage.deleteNote(note.id)
      expect(deleted).toBe(true)

      const retrieved = await storage.getNote(note.id)
      expect(retrieved).toBeNull()
    })

    it('should return false when deleting non-existent note', async () => {
      const deleted = await storage.deleteNote('non-existent')
      expect(deleted).toBe(false)
    })

    it('should use atomic writes for data safety', async () => {
      await storage.createNote('Test', 'Content')

      // Verify temporary file is used
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.any(String),
        'utf8'
      )

      // Verify atomic rename
      expect(mockFs.rename).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        testDataPath
      )
    })
  })

  describe('error handling', () => {
    beforeEach(async () => {
      await storage.initialize()
    })

    it('should handle write permission errors', async () => {
      mockFs.writeFile.mockRejectedValueOnce({ code: 'EACCES' })

      await expect(
        storage.createNote('Test', 'Content')
      ).rejects.toThrow()
    })

    it('should handle disk space errors', async () => {
      mockFs.writeFile.mockRejectedValueOnce({ code: 'ENOSPC' })

      await expect(
        storage.createNote('Test', 'Content')
      ).rejects.toThrow()
    })
  })
})
```

## Integration Testing

### Full Server Testing with Supertest Alternative
```typescript
// tests/integration/mcp-server.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NotesServer } from '../../src/server.js'
import { createTestTransport } from '../helpers/test-transport.js'

describe('MCP Server Integration', () => {
  let server: NotesServer
  let transport: any

  beforeEach(async () => {
    server = new NotesServer({
      storage: { path: ':memory:' }
    })
    await server.initialize()

    transport = createTestTransport()
    await server.getServer().connect(transport)
  })

  afterEach(async () => {
    await server.shutdown()
  })

  it('should handle complete note workflow', async () => {
    // 1. List notes (should be empty)
    let response = await transport.request('tools/call', {
      name: 'list_notes',
      arguments: {}
    })

    expect(response.result.content[0].text).toContain('[]')

    // 2. Create a note
    response = await transport.request('tools/call', {
      name: 'create_note',
      arguments: {
        title: 'Integration Test Note',
        content: 'This note was created during integration testing',
        tags: ['test', 'integration']
      }
    })

    const createResult = JSON.parse(response.result.content[0].text)
    expect(createResult.success).toBe(true)
    const noteId = createResult.noteId

    // 3. Get the note
    response = await transport.request('tools/call', {
      name: 'get_note',
      arguments: { id: noteId }
    })

    const getResult = JSON.parse(response.result.content[0].text)
    expect(getResult.success).toBe(true)
    expect(getResult.data.title).toBe('Integration Test Note')

    // 4. List notes (should contain our note)
    response = await transport.request('tools/call', {
      name: 'list_notes',
      arguments: {}
    })

    const listResult = JSON.parse(response.result.content[0].text)
    expect(listResult).toHaveLength(1)

    // 5. Delete the note
    response = await transport.request('tools/call', {
      name: 'delete_note',
      arguments: { id: noteId }
    })

    const deleteResult = JSON.parse(response.result.content[0].text)
    expect(deleteResult.success).toBe(true)
  })

  it('should handle resource access', async () => {
    // Create a note first
    const createResponse = await transport.request('tools/call', {
      name: 'create_note',
      arguments: {
        title: 'Resource Test',
        content: 'Testing resource access'
      }
    })

    const noteId = JSON.parse(createResponse.result.content[0].text).noteId

    // Access note as resource
    const resourceResponse = await transport.request('resources/read', {
      uri: `note:///${noteId}`
    })

    expect(resourceResponse.result.content).toContain('# Resource Test')
    expect(resourceResponse.result.content).toContain('Testing resource access')
  })

  it('should handle prompt templates', async () => {
    // Create some test notes
    await transport.request('tools/call', {
      name: 'create_note',
      arguments: {
        title: 'Meeting Notes',
        content: 'Discussed project timeline',
        tags: ['meeting', 'work']
      }
    })

    // Use summarize prompt
    const promptResponse = await transport.request('prompts/get', {
      name: 'summarize_notes',
      arguments: { tag: 'work' }
    })

    expect(promptResponse.result.messages[0].content).toContain('Meeting Notes')
    expect(promptResponse.result.messages[0].content).toContain('Discussed project timeline')
  })
})
```

### Error Flow Testing
```typescript
// tests/integration/error-flows.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { NotesServer } from '../../src/server.js'

describe('Error Handling Integration', () => {
  let server: NotesServer

  beforeEach(async () => {
    server = new NotesServer()
    await server.initialize()
  })

  it.each([
    {
      input: { title: '<script>alert("xss")</script>', content: 'Content' },
      expectedError: 'validation'
    },
    {
      input: { title: 'Title', content: 'x'.repeat(100000) },
      expectedError: 'too long'
    },
    {
      input: { title: '', content: 'Content' },
      expectedError: 'required'
    }
  ])('should handle malicious input: $input.title', async ({ input, expectedError }) => {
    const result = await server.callTool('create_note', input)

    expect(result.success).toBe(false)
    expect(result.error.toLowerCase()).toContain(expectedError)
  })

  it('should handle concurrent operations gracefully', async () => {
    const operations = Array(10).fill(null).map((_, i) =>
      server.callTool('create_note', {
        title: `Concurrent Note ${i}`,
        content: `Content ${i}`
      })
    )

    const results = await Promise.all(operations)
    const successCount = results.filter(r => r.success).length

    expect(successCount).toBe(10)

    // Verify all notes were created with unique IDs
    const noteIds = results
      .filter(r => r.success)
      .map(r => r.data.noteId)

    const uniqueIds = new Set(noteIds)
    expect(uniqueIds.size).toBe(10)
  })

  it('should handle rate limiting gracefully', async () => {
    // Simulate rapid requests
    const rapidRequests = Array(100).fill(null).map(() =>
      server.callTool('list_notes', {})
    )

    const results = await Promise.allSettled(rapidRequests)

    // Most should succeed, some might be rate limited
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    expect(successful).toBeGreaterThan(50)
    expect(successful + failed).toBe(100)
  })
})
```

## Performance Testing

### Load Testing with Benchmark API
```typescript
// tests/performance/load-tests.test.ts
import { describe, it, expect, bench } from 'vitest'
import { NotesServer } from '../../src/server.js'

describe('Performance Tests', () => {
  let server: NotesServer

  beforeEach(async () => {
    server = new NotesServer({
      storage: { path: ':memory:' }
    })
    await server.initialize()
  })

  bench('note creation throughput', async () => {
    await server.callTool('create_note', {
      title: `Performance Test Note ${Date.now()}`,
      content: 'Performance test content',
      tags: ['performance', 'test']
    })
  })

  bench('note retrieval performance', async () => {
    // Pre-create a note for consistent testing
    const note = await server.callTool('create_note', {
      title: 'Benchmark Note',
      content: 'Content for benchmarking'
    })

    await server.callTool('get_note', { id: note.data.noteId })
  })

  it('should handle high-frequency note creation', async () => {
    const noteCount = 1000
    const start = performance.now()

    const promises = Array(noteCount).fill(null).map((_, i) =>
      server.callTool('create_note', {
        title: `Performance Test Note ${i}`,
        content: `Content for note ${i}`,
        tags: [`tag-${i % 10}`]
      })
    )

    const results = await Promise.all(promises)
    const end = performance.now()

    const successCount = results.filter(r => r.success).length
    const avgTimePerNote = (end - start) / noteCount

    expect(successCount).toBe(noteCount)
    expect(avgTimePerNote).toBeLessThan(10) // Less than 10ms per note
  })

  it('should handle large note retrieval efficiently', async () => {
    // Create 100 notes with substantial content
    const createPromises = Array(100).fill(null).map((_, i) =>
      server.callTool('create_note', {
        title: `Large Dataset Note ${i}`,
        content: 'x'.repeat(5000), // 5KB content
        tags: [`category-${i % 5}`]
      })
    )

    await Promise.all(createPromises)

    const start = performance.now()
    const result = await server.callTool('list_notes', { limit: 50 })
    const end = performance.now()

    expect(result.success).toBe(true)
    expect(end - start).toBeLessThan(100) // Less than 100ms
  })

  it('should maintain performance under memory pressure', async () => {
    // Create many notes to test memory efficiency
    for (let batch = 0; batch < 10; batch++) {
      const batchPromises = Array(100).fill(null).map((_, i) =>
        server.callTool('create_note', {
          title: `Batch ${batch} Note ${i}`,
          content: `Content for batch ${batch}, note ${i}`,
          tags: [`batch-${batch}`]
        })
      )

      await Promise.all(batchPromises)

      // Check memory usage doesn't grow unbounded
      const memUsage = process.memoryUsage()
      expect(memUsage.heapUsed).toBeLessThan(500 * 1024 * 1024) // 500MB
    }
  })
})
```

## Test Helpers

### Mock Storage with Vitest
```typescript
// tests/helpers/mock-storage.ts
import { vi } from 'vitest'

export class MockStorage {
  private data: Map<string, any> = new Map()

  create = vi.fn(async (item: any) => {
    const id = `mock-${Date.now()}-${Math.random()}`
    const created = {
      ...item,
      id,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    }
    this.data.set(id, created)
    return created
  })

  getById = vi.fn(async (id: string) => {
    return this.data.get(id) || null
  })

  getAll = vi.fn(async () => {
    return Array.from(this.data.values())
  })

  update = vi.fn(async (id: string, updates: any) => {
    const existing = this.data.get(id)
    if (!existing) return null

    const updated = {
      ...existing,
      ...updates,
      updated: new Date().toISOString()
    }
    this.data.set(id, updated)
    return updated
  })

  delete = vi.fn(async (id: string) => {
    return this.data.delete(id)
  })

  search = vi.fn(async (query: string) => {
    const allNotes = Array.from(this.data.values())
    return allNotes.filter(note =>
      note.title.includes(query) || note.content.includes(query)
    )
  })

  clear() {
    this.data.clear()
    vi.clearAllMocks()
  }

  // Helper methods for testing
  getCallHistory(method: string) {
    return this[method].mock.calls
  }

  getCallCount(method: string) {
    return this[method].mock.calls.length
  }

  mockImplementation(method: string, implementation: (...args: any[]) => any) {
    this[method].mockImplementation(implementation)
  }
}
```

### Test Data Fixtures with Factory Pattern
```typescript
// tests/fixtures/notes.ts
import { Note } from '../../src/types/note.js'
import { faker } from '@faker-js/faker'
import { v4 as uuidv4 } from 'uuid'

export function createSampleNote(overrides: Partial<Note> = {}): Note {
  const now = new Date().toISOString()

  return {
    id: uuidv4(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(2),
    tags: faker.helpers.arrayElements(
      ['work', 'personal', 'important', 'draft', 'archived'],
      { min: 0, max: 3 }
    ),
    created: now,
    updated: now,
    ...overrides
  }
}

export function createNotesList(count: number, template?: Partial<Note>): Note[] {
  return Array(count).fill(null).map((_, i) =>
    createSampleNote({
      title: `Note ${i + 1}`,
      content: `Content for note ${i + 1}`,
      tags: [`category-${i % 3}`, 'test'],
      ...template
    })
  )
}

export function createNotesWithTags(tagGroups: string[][]): Note[] {
  return tagGroups.map((tags, i) =>
    createSampleNote({
      title: `Tagged Note ${i + 1}`,
      content: `Content with tags: ${tags.join(', ')}`,
      tags
    })
  )
}

export function createLargeNote(sizeKB: number = 50): Note {
  const contentSize = sizeKB * 1024
  const content = 'x'.repeat(contentSize)

  return createSampleNote({
    title: `Large Note (${sizeKB}KB)`,
    content,
    tags: ['large', 'test']
  })
}

// Factory for creating test scenarios
export class NoteFactory {
  static withValidation() {
    return {
      valid: createSampleNote({ title: 'Valid Note', content: 'Valid content' }),
      emptyTitle: { title: '', content: 'Content' },
      longTitle: { title: 'x'.repeat(201), content: 'Content' },
      emptyContent: { title: 'Title', content: '' }
    }
  }

  static withMaliciousContent() {
    return {
      xssTitle: createSampleNote({
        title: '<script>alert("xss")</script>Clean Title'
      }),
      sqlInjection: createSampleNote({
        content: "'; DROP TABLE notes; --"
      }),
      htmlInjection: createSampleNote({
        content: '<img src=x onerror=alert("xss")>'
      })
    }
  }

  static withPerformanceData(count: number) {
    return Array(count).fill(null).map((_, i) =>
      createSampleNote({
        title: `Performance Note ${i}`,
        content: faker.lorem.paragraphs(10), // Substantial content
        tags: faker.helpers.arrayElements(['perf', 'test', 'data'], 2)
      })
    )
  }
}
```

### Test Server Helper
```typescript
// tests/helpers/test-server.ts
import { NotesServer } from '../../src/server.js'
import { MockStorage } from './mock-storage.js'

export interface TestServerOptions {
  storage?: any
  config?: any
  skipInitialize?: boolean
}

export async function createTestServer(options: TestServerOptions = {}): Promise<NotesServer> {
  const storage = options.storage || new MockStorage()

  const server = new NotesServer({
    storage: storage,
    config: {
      maxNotes: 10000,
      enableDebug: false,
      ...options.config
    }
  })

  if (!options.skipInitialize) {
    await server.initialize()
  }

  return server
}

export function createTestTransport() {
  const requestHandlers = new Map()

  return {
    request: vi.fn(async (method: string, params: any) => {
      const handler = requestHandlers.get(method)
      if (handler) {
        return handler(params)
      }

      // Default mock response
      return {
        result: {
          content: [{ type: 'text', text: JSON.stringify({ success: true }) }]
        }
      }
    }),

    onRequest: (method: string, handler: Function) => {
      requestHandlers.set(method, handler)
    }
  }
}
```

## Coverage Requirements

### Coverage Configuration
```typescript
// In vitest.config.ts coverage section
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  include: ['src/**/*.ts'],
  exclude: [
    'src/**/*.d.ts',
    'src/index.ts',
    'src/**/*.test.ts',
    'src/**/*.spec.ts',
    'src/types/**/*.ts' // Type definitions
  ],
  thresholds: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    // Per-file thresholds for critical components
    'src/server.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/storage/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  skipFull: false,
  all: true
}
```

### Running Tests and Coverage
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest tests/unit/tools/create-note.test.ts

# Run tests matching pattern
npx vitest --run --reporter=verbose "tools"

# Run benchmarks
npx vitest bench

# Generate coverage report and open
npm run test:coverage && open coverage/index.html

# Run tests with UI
npm run test:ui
```

## Advanced Testing Features

### Snapshot Testing
```typescript
// tests/unit/outputs/note-formatting.test.ts
import { it, expect } from 'vitest'
import { formatNoteAsMarkdown } from '../../src/utils/formatters.js'
import { createSampleNote } from '../fixtures/notes.js'

it('should format note consistently', () => {
  const note = createSampleNote({
    title: 'Sample Note',
    content: 'This is **bold** and *italic* text',
    tags: ['markdown', 'test']
  })

  const formatted = formatNoteAsMarkdown(note)
  expect(formatted).toMatchSnapshot()
})
```

### Environment-specific Testing
```typescript
// tests/unit/config/environment.test.ts
import { it, expect, beforeEach, afterEach } from 'vitest'
import { loadConfig } from '../../src/config/settings.js'

describe('Environment Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Create clean environment
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // Restore environment
    process.env = originalEnv
  })

  it('should load development config', () => {
    process.env.NODE_ENV = 'development'
    process.env.MCP_DEBUG = 'true'

    const config = loadConfig()

    expect(config.enableDebug).toBe(true)
    expect(config.transport).toBe('stdio')
  })

  it('should load production config', () => {
    process.env.NODE_ENV = 'production'
    process.env.MCP_PORT = '8080'

    const config = loadConfig()

    expect(config.enableDebug).toBe(false)
    expect(config.port).toBe(8080)
  })
})
```
