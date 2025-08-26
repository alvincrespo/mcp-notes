# CLAUDE.md - MCP Development Standards

@docs/project-structure.md
@docs/code-standards.md
@docs/mcp-patterns.md
@docs/error-handling.md
@docs/security-guidelines.md
@docs/testing-requirements.md
@docs/performance-guidelines.md
@docs/deployment-standards.md
@docs/maintenance-guidelines.md
@~/.claude/personal-mcp-preferences.md

## MCP Server Development Standards Overview

This project follows structured development standards for building production-ready Model Context Protocol (MCP) servers. All detailed guidelines are organized in the imported documentation files above.

## Core Development Principles

1. **TypeScript-First**: All code written in TypeScript with strict typing
2. **Security by Design**: Input validation and sanitization from day one
3. **Test-Driven**: Minimum 85% code coverage with comprehensive error testing
4. **Production-Ready**: Docker deployment and monitoring built-in
5. **MCP Best Practices**: Follow established patterns for tools, resources, and prompts

## Quick Start Checklist

**Initial Setup:**
- [ ] Create project using standard directory structure
- [ ] Configure TypeScript with strict settings
- [ ] Install required MCP dependencies
- [ ] Set up testing framework (Jest)

**MCP Implementation:**
- [ ] Implement server class with proper lifecycle management
- [ ] Create tools with Zod input validation
- [ ] Add comprehensive error handling
- [ ] Implement resources following URI patterns
- [ ] Add prompts with proper message structure

**Quality Assurance:**
- [ ] Write unit tests for all tools/resources/prompts
- [ ] Test with MCP Inspector
- [ ] Validate security with input sanitization tests
- [ ] Performance test with realistic data loads

**Production Deployment:**
- [ ] Configure Docker containerization
- [ ] Set up health checks and monitoring
- [ ] Document installation and configuration
- [ ] Create backup and recovery procedures

## Development Workflow

```bash
# Start new MCP server project
npm run create:mcp-server [name]

# Development
npm run dev          # Start with hot reload
npm run inspector    # Launch MCP Inspector for testing

# Quality checks
npm test            # Run test suite
npm run coverage    # Check code coverage
npm run security    # Run security audit

# Production
npm run build       # Build for production
npm run docker      # Build Docker image
npm run deploy      # Deploy to production
```

## Common Commands

- **Create new tool**: `npm run generate:tool [name]`
- **Create new resource**: `npm run generate:resource [name]`
- **Create new prompt**: `npm run generate:prompt [name]`
- **Run integration tests**: `npm run test:integration`
- **Check standards compliance**: `npm run lint:standards`

## Getting Help

- Review imported documentation files for detailed guidelines
- Use `/memory` command in Claude Code to view all loaded standards
- Check `docs/troubleshooting.md` for common issues
- See `docs/examples/` directory for reference implementations

---

**Version**: 0.0.0
**Last Updated**: 2025-08-26
**Next Review**: TBD
