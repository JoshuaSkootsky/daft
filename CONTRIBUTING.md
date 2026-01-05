# Contributing to DAFT

Thanks for your interest in contributing! Here's how you can help.

## Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/daft.git`
3. Install dependencies: `bun install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Before You Submit a PR

### Open an Issue First

Before starting work on a new feature or bug fix, please open an issue to discuss it. This ensures:

- Your work aligns with project goals
- We can catch potential issues early
- Others know you're working on it (avoid duplicate work)

### Run Tests

Before submitting a PR, run the test suite:

```bash
# Type-check all examples
bun run --check examples/*.ts

# Test specs
./run.sh examples/linear-spec.ts examples/data.json
./run.sh examples/dag-spec.ts

# Or run the full test workflow
bun test
```

Ensure all tests pass before pushing.

## Code Style

- Follow TypeScript best practices
- Keep functions focused and small
- Add JSDoc comments for public APIs
- Run `bun run --check` before committing

## What We're Looking For

- Bug fixes
- New predicates and tools
- Performance improvements
- Documentation improvements
- Example specs demonstrating new patterns

## What We're NOT Looking For

- Breaking changes without migration guide
- Major architectural changes without prior discussion
- Features that bloat the core

## Submitting a PR

1. Push to your fork: `git push origin feature/your-feature-name`
2. Open a pull request on GitHub
3. Fill in the PR template
4. Wait for review

## Questions?

Open an issue and we'll help you out!
