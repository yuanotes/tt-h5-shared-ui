# tt-h5-shared-ui

Reusable HTML5 card game UI components for mini-dashboard electronic prototypes.

## What's here

| File | Purpose |
|------|---------|
| `cardSelection.mjs` | Card frame rendering (51:89 ratio), card choice dialogs, selection input helpers |
| `cardStack.mjs` | Card stack rendering — pile collapse/expand, stacked card summaries |
| `tabletopDesktop.mjs` | Desktop tabletop shell — upper/center/bottom zones, zones, hand pile, card piles |
| `tabletopDesktop.css` | Desktop layout primitives — grid flow, region layout, card sizing |
| `cardStack.css` | Stack visuals — backs, modal dialog, content grid hooks |

All components are framework-free, DOM-rendering helpers. No game rules leak into shared-ui.

## Usage in mini-dashboards

This repo is consumed as a **git submodule** inside `mini-dashboards/`:

```bash
# In mini-dashboards:
git submodule add git@github.com:yuanotes/tt-h5-shared-ui.git shared-ui
```

Mini-dashboards' `server.py` serves the submodule as static files:
```python
shared_ui_dir = BASE_DIR / "shared-ui"
if shared_ui_dir.is_dir():
    app.router.add_static("/shared-ui", shared_ui_dir)
```

Game modules (like `xingqiwu-zhiqian`) then import via:
- JS: `import { ... } from '../../shared-ui/cardStack.mjs'`
- CSS: `@import url('/shared-ui/tabletopDesktop.css')`

## Testing

```bash
node --test tests/shared_card_selection.test.mjs
node --test tests/shared_card_stack.test.mjs
node --test tests/shared_tabletop_desktop.test.mjs
```
