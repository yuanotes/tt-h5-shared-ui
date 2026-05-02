# Shared 51:89 Card Components Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build reusable `shared-ui` card frame and card choice dialog helpers, then integrate them into `xingqiwu-zhiqian` without changing game rules.

**Architecture:** Extend `shared-ui/cardSelection.mjs` into a small framework-free card interaction suite: generic 51:89 frame, center fan choice dialog, compatibility checked inputs, and delegated browser handlers. `xingqiwu-zhiqian` supplies card content and CSS skin, while existing rule actions continue to collect selected UIDs through the adapter.

**Tech Stack:** Native ES modules, string-rendered HTML, browser delegated events, CSS transforms/transitions, Node native test runner, Python pytest.

---

## Preconditions

Work from `/home/cycreate/projects/mini-dashboards`. The repository is dirty from earlier unrelated work, so never run `git add -A`. Stage only paths named in the task.

Baseline commands:

```bash
node --test tests/shared_card_selection.test.mjs
node --test xingqiwu-zhiqian/tests/*.test.mjs
python -m pytest tests -q
```

---

### Task 1: Specify shared card frame and dialog output

**Objective:** Add failing tests for the generic 51:89 card frame and center choice dialog contract.

**Files:**
- Modify: `/home/cycreate/projects/mini-dashboards/tests/shared_card_selection.test.mjs`
- Modify later: `/home/cycreate/projects/mini-dashboards/shared-ui/cardSelection.mjs`

**Step 1: Write failing tests**

Add tests that import `renderCardFrame`, `renderCardChoiceDialog`, and `CARD_ASPECT_RATIO` and assert:

```js
assert.equal(CARD_ASPECT_RATIO, '51 / 89');
assert(frame.includes('data-card-aspect="51:89"'));
assert(frame.includes('class="shared-card-frame'));
assert(dialog.includes('data-card-choice-dialog="play-hand"'));
assert(dialog.includes('data-card-choice-card'));
assert(dialog.includes('data-card-choice-confirm'));
assert(dialog.includes('data-card-choice-give-up'));
```

**Step 2: Verify RED**

```bash
cd /home/cycreate/projects/mini-dashboards
node --test tests/shared_card_selection.test.mjs
```

Expected: FAIL because new exports do not exist.

**Step 3: Commit**

Skip commit if the working tree still contains uncommitted prerequisite files; otherwise stage only the test file.

---

### Task 2: Implement shared frame, dialog, and adapter markup

**Objective:** Make the shared tests pass with generic, game-agnostic markup.

**Files:**
- Modify: `/home/cycreate/projects/mini-dashboards/shared-ui/cardSelection.mjs`
- Test: `/home/cycreate/projects/mini-dashboards/tests/shared_card_selection.test.mjs`

**Step 1: Implement minimal exports**

Add:

- `export const CARD_ASPECT_RATIO = '51 / 89';`
- `renderHtmlAttributes(attrs)` internal helper.
- `renderCardFrame()` generic shell.
- `renderCardChoiceDialog()` center dialog markup.
- extend `renderCardSelection()` so it emits hidden compatibility inputs, opener button, summary, and the dialog.

**Step 2: Verify GREEN**

```bash
cd /home/cycreate/projects/mini-dashboards
node --test tests/shared_card_selection.test.mjs
```

Expected: PASS.

---

### Task 3: Specify delegated browser selection behavior

**Objective:** Test the public browser setup hook and compatibility helper behavior without coupling to project rules.

**Files:**
- Modify: `/home/cycreate/projects/mini-dashboards/tests/shared_card_selection.test.mjs`
- Modify later: `/home/cycreate/projects/mini-dashboards/shared-ui/cardSelection.mjs`

**Step 1: Write failing tests**

Add assertions that `setupCardChoiceDialogs` is exported as a function and that `restoreSelections()` sets checked inputs from a context map without relying on visible checkboxes.

**Step 2: Verify RED**

```bash
cd /home/cycreate/projects/mini-dashboards
node --test tests/shared_card_selection.test.mjs
```

Expected: FAIL because `setupCardChoiceDialogs` does not exist.

---

### Task 4: Implement delegated browser selection behavior

**Objective:** Provide real browser behavior for open, highlight, confirm, give-up, cancel, and Escape.

**Files:**
- Modify: `/home/cycreate/projects/mini-dashboards/shared-ui/cardSelection.mjs`

**Step 1: Implement delegated handlers**

Add `setupCardChoiceDialogs(root = document)` that:

- opens `[data-card-choice-dialog]` from `[data-card-choice-open]`.
- toggles pending `aria-selected` on `[data-card-choice-card]`.
- enforces `max`, disables confirm until `min` is satisfied.
- on confirm, writes checked states to hidden `[data-card-select-context][data-card-uid]` inputs, dispatches `change`, emits `card-choice:confirm`, and closes.
- on give-up, clears inputs, dispatches `change`, emits `card-choice:give-up`, and closes.
- on cancel/Escape, closes without committing.

**Step 2: Verify GREEN**

```bash
cd /home/cycreate/projects/mini-dashboards
node --test tests/shared_card_selection.test.mjs
```

Expected: PASS.

---

### Task 5: Specify `xingqiwu-zhiqian` rendering migration

**Objective:** Lock project integration expectations before changing project rendering.

**Files:**
- Modify: `/home/cycreate/projects/mini-dashboards/xingqiwu-zhiqian/tests/rendering.test.mjs`
- Modify later: `/home/cycreate/projects/mini-dashboards/xingqiwu-zhiqian/src/browserApp.mjs`
- Modify later: `/home/cycreate/projects/mini-dashboards/xingqiwu-zhiqian/src/styles.css`

**Step 1: Write failing tests**

Add assertions that rendered game HTML includes:

```js
assert(html.includes('data-card-aspect="51:89"'));
assert(html.includes('data-card-choice-open="play-hand"'));
assert(html.includes('data-card-choice-dialog="play-hand"'));
assert(html.includes('data-card-choice-confirm'));
assert(!html.includes('<input type="checkbox" data-card-uid'));
```

Also assert CSS includes `aspect-ratio: 51 / 89`, `.card-choice-dialog`, `.card-choice-fan`, and `prefers-reduced-motion`.

**Step 2: Verify RED**

```bash
cd /home/cycreate/projects/mini-dashboards/xingqiwu-zhiqian
node --test tests/rendering.test.mjs
```

Expected: FAIL on the new markers.

---

### Task 6: Integrate shared card suite into `xingqiwu-zhiqian`

**Objective:** Use shared 51:89 frames and dialog selection in the project renderer.

**Files:**
- Modify: `/home/cycreate/projects/mini-dashboards/xingqiwu-zhiqian/src/browserApp.mjs`
- Modify: `/home/cycreate/projects/mini-dashboards/xingqiwu-zhiqian/src/styles.css`

**Step 1: Update imports and rendering**

Import `renderCardFrame` and `setupCardChoiceDialogs`. Change `cardArticle()` to build game-specific content and wrap it with `renderCardFrame()`. Change `renderCardSelection()` calls to use `renderCardContent` and `isCardSelectable` instead of embedding visible checkbox labels.

**Step 2: Attach delegated behavior**

In `boot()`, call `setupCardChoiceDialogs(document)` once before or after existing event listeners.

**Step 3: Add CSS**

Add project styling for:

- `.shared-card-frame`
- `.shared-card-content`
- `.card-choice-dialog[hidden]`
- `.card-choice-panel`
- `.card-choice-fan`
- `.card-choice-card[aria-selected="true"]`
- `.card-choice-actions`
- `@media (prefers-reduced-motion: reduce)`

**Step 4: Verify GREEN**

```bash
cd /home/cycreate/projects/mini-dashboards/xingqiwu-zhiqian
node --test tests/rendering.test.mjs
```

Expected: PASS.

---

### Task 7: Full verification and service refresh

**Objective:** Prove the implementation did not regress existing Node/Python suites and refresh the running service.

**Files:**
- No code changes unless verification reveals a specific failure.

**Step 1: Run full tests**

```bash
cd /home/cycreate/projects/mini-dashboards
node --test tests/shared_card_selection.test.mjs
node --test xingqiwu-zhiqian/tests/*.test.mjs
python -m pytest tests -q
```

Expected: all commands exit 0.

**Step 2: Whitespace check**

```bash
git diff --check
```

Expected: no whitespace errors.

**Step 3: Restart service if browser files changed**

```bash
systemctl --user restart mini-dashboards.service
systemctl --user status mini-dashboards.service --no-pager
```

Expected: service active.

**Step 4: Verify Tailscale URL**

```bash
tailscale status
curl --noproxy '*' -fsS http://100.123.13.124:8080/xingqiwu-zhiqian/ -o /tmp/xingqiwu-zhiqian.html
```

Expected: page downloads and includes `星期五之前`.
