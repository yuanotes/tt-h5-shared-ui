# tt-h5-shared-ui — Agent Guide

Pure JS/CSS reusable card game UI components. No server-side code, no Python, no HTTP endpoints.

## Structure

```text
├── README.md
├── AGENTS.md
├── cardSelection.mjs       # Card frame + choice dialog + selection helpers
├── cardStack.mjs           # Card pile rendering + collapse/expand
├── cardStack.css           # Stack styles
├── tabletopDesktop.mjs     # Desktop shell, zones, piles, hand
├── tabletopDesktop.css     # Desktop layout primitives
├── docs/
│   ├── plans/
│   └── superpowers/specs/
└── tests/
```

## Design principles

- **Framework-free**: No React, Vue, or other frameworks. Pure ES modules.
- **DOM-rendering only**: These are rendering helpers. They know nothing about game rules, state machines, or win conditions.
- **Game-agnostic**: No hard-coded game cards, types, or mechanics. Callers supply card data descriptors.
- **Card ratio**: All cards use 51:89 width:height ratio.
- **No server**: This is a static asset library. Serving is the consumer's responsibility.

## When modifying

- Changes must stay backwards-compatible with existing consumers (`xingqiwu-zhiqian`).
- Tests run with plain `node --test`. No transpilation, no bundler.
- If a new component is added, tests go in `tests/`.

## Test commands

```bash
node --test tests/shared_card_selection.test.mjs
node --test tests/shared_card_stack.test.mjs
node --test tests/shared_tabletop_desktop.test.mjs
```
