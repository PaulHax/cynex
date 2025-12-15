<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Playwright Screenshots

When taking screenshots to verify UI changes, use a smaller viewport to reduce token usage:

```
mcp__playwright__browser_resize with width: 1200, height: 600
```

Other tips:
- Use `type: "jpeg"` for better compression
- Use `element` and `ref` parameters to screenshot specific elements instead of full page