# RoninPLEX v2.1.0 — Skills & MCP Orchestration

## Principle

The Agentic Awesome Skills catalog is a capability library, not a requirement to invoke every unrelated skill. The v2.1.0 workflow should use the complete available capability surface to identify applicable skills, then invoke only skills that materially apply to the current task.

The supplied environment inventory includes 100+ skills and the following MCP servers:

- StitchMCP
- chrome-devtools
- context7
- memory-bank
- playwright
- sequential-thinking
- serena

## Applicable Capability Groups

### Architecture / planning

Use:
- Antigravity customization guidance
- systematic planning/orchestration skills
- GSD Core
- sequential thinking
- Serena for code navigation/refactoring where available
- memory-bank for durable project context where appropriate

### Frontend / UI

Use:
- modern web guidance
- a11y debugging
- Chrome DevTools
- Playwright
- StitchMCP when visual/UI generation or iteration is appropriate

### Playback / debugging

Use:
- systematic debugging/troubleshooting
- Chrome DevTools
- Playwright
- Serena
- performance/memory debugging skills when the defect is performance-related

### Security / reliability

Use:
- accidental data loss prevention
- credentials/security guidance
- troubleshooting
- permissioned GitHub when repository operations require it

### Android

Use android-cli only if/when an Android target is actually being implemented. Do not add Android-specific scope to v2.1.0 merely because the skill exists.

### Unrelated domains

Science, BigQuery, Firebase, Flutter, Google Maps, and other unrelated specialist skills should not be artificially invoked for RoninPLEX work unless the codebase or a new requirement actually introduces that technology/domain.

## MCP Usage Rules

### Playwright

Use for repeatable browser/UI flows where the target is accessible to browser automation.

### Chrome DevTools

Use for:
- accessibility;
- network inspection;
- performance;
- runtime debugging.

### Serena

Use for:
- symbol-aware code navigation;
- targeted refactoring;
- understanding relationships across the codebase.

### Context7

Use when current library/API documentation is needed before implementing against a dependency.

### Sequential Thinking

Use for complex debugging, architecture decisions, and multi-step failure analysis.

### StitchMCP

Use when designing or iterating visual UI concepts that benefit from the Stitch workflow. Generated design output must still be reconciled with the actual application architecture.

### Memory Bank

Use for durable project context only when it materially improves continuity; avoid duplicating the authoritative v2.1.0 requirements.

## Required Skill Discipline

Before implementation:

1. identify the task domain;
2. select applicable skills;
3. check for conflicting instructions;
4. inspect the relevant code;
5. implement the smallest safe change;
6. verify;
7. record evidence.

Do not load the entire skill library into every prompt. The upstream Agentic Awesome Skills guidance warns that a full Antigravity catalog can exhaust context or trigger instability; targeted selection is the safer approach.

## Security Note

Skills are instruction-bearing artifacts. Review selected skills before trusting them with sensitive or destructive operations.
