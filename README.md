# tt-h5-shared-ui

Reusable HTML5 card game UI components for mini-dashboard electronic prototypes.

## What's here

| File | Purpose |
|------|---------|
| `backend.py` | aiohttp `register(app)` — serves `/shared-ui/` static files |
| `cardSelection.mjs` | Card frame rendering (51:89 ratio), card choice dialogs, selection input helpers |
| `cardStack.mjs` | Card stack rendering — pile collapse/expand, stacked card summaries |
| `tabletopDesktop.mjs` | Desktop tabletop shell — upper/center/bottom zones, zones, hand pile, card piles |
| `tabletopDesktop.css` | Desktop layout primitives — grid flow, region layout, card sizing |
| `cardStack.css` | Stack visuals — backs, modal dialog, content grid hooks |

All JS/CSS components are framework-free, DOM-rendering helpers. No game rules leak into shared-ui.

## Usage in mini-dashboards

This repo is consumed as a **git submodule** inside `mini-dashboards/`:

```bash
# In mini-dashboards:
git submodule add git@github.com:yuanotes/tt-h5-shared-ui.git shared-ui
```

`server.py` auto-discovers `shared-ui/backend.py` and calls `register(app)`, which serves `/shared-ui/` as static files.

Game modules (like `xingqiwu-zhiqian`) then import via:
- JS: `import { ... } from '../../shared-ui/cardStack.mjs'`
- CSS: `@import url('/shared-ui/tabletopDesktop.css')`

## Testing

```bash
node --test tests/shared_card_selection.test.mjs
node --test tests/shared_card_stack.test.mjs
node --test tests/shared_tabletop_desktop.test.mjs
```

In mini-dashboards, the integration test verifies the backend.py route:
```bash
python3 -m pytest tests/test_shared_ui_static.py -v
```
