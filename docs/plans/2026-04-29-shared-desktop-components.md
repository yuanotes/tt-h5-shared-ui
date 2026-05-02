# Shared Desktop Components Implementation Plan

> **For Hermes:** Use TDD and execute task-by-task. User explicitly approved Option B and requested plan + execution without further discussion.

**Goal:** Build descriptor-driven shared desktop components in `shared-ui/` and refactor `xingqiwu-zhiqian` to use them.

**Architecture:** `xingqiwu` keeps all rules. It exposes `xingqiwuDesktopDescriptor(state)`, then calls `renderTabletopDesktop(descriptor)` from `shared-ui/tabletopDesktop.mjs`. Shared code renders desktop shell, upper/center/bottom regions, zones, common zone, piles, and a visible hand pile only.

**Corrections locked by user:**
- Same game means same actual card width, not just same 51:89 aspect ratio.
- Hand is not a centered selection dialog. It is a bottom `hand pile` that shows all hand cards; hover highlights, click plays directly.
- Desktop board is spatial: upper = crisis/projects, center = played/common area, bottom = draw/hand/discard.

**Tech Stack:** Pure ESM JavaScript, CSS, Node `node:test`, Python `pytest`, aiohttp static routes.

---

## Task 1: Add shared desktop RED tests

**Objective:** Specify the reusable desktop descriptor API before implementation.

**Files:**
- Create: `tests/shared_tabletop_desktop.test.mjs`
- Test target: `shared-ui/tabletopDesktop.mjs`

**Steps:**
1. Write failing tests for:
   - `renderTabletopDesktop` shell markers.
   - `renderDesktopZone` special/common/pile markers.
   - `renderCardPile` face-down draw pile hides card names and shows count.
   - visible discard pile renders compact summaries.
   - shared CSS file contains no internal scrollbar rules and has grid primitives.
2. Run `node --test tests/shared_tabletop_desktop.test.mjs` and verify RED because the module does not exist.

## Task 2: Implement shared desktop components

**Objective:** Add the minimal shared module and CSS to satisfy Task 1.

**Files:**
- Create: `shared-ui/tabletopDesktop.mjs`
- Create: `shared-ui/tabletopDesktop.css`
- Modify: `tests/test_shared_ui_static.py`

**Steps:**
1. Implement `renderTabletopDesktop`, `renderDesktopZone`, `renderCardPile`, and constants.
2. Reuse `escapeHtml` and `renderCardFrame` from `cardSelection.mjs`.
3. Add generic CSS classes: `.tabletop-desktop`, `.tabletop-desktop-surface`, `.tabletop-zone`, `.tabletop-card-pile`.
4. Update Python static test to assert the new shared files exist.
5. Run shared Node test and Python static test.
6. Commit shared desktop component changes.

## Task 3: Add xingqiwu RED rendering tests

**Objective:** Specify that `xingqiwu-zhiqian` uses the shared desktop descriptor and has a common played zone.

**Files:**
- Modify: `xingqiwu-zhiqian/tests/rendering.test.mjs`
- Modify: `xingqiwu-zhiqian/tests/desktop_layout_static.test.mjs`

**Steps:**
1. Add tests requiring:
   - export `xingqiwuDesktopDescriptor`.
   - descriptor includes common `played` zone.
   - rendered HTML contains `data-tabletop-component="desktop"`.
   - rendered HTML contains `data-zone-kind="common"` and `data-table-zone="played"`.
   - draw/hand/discard remain pile or pile-like zones.
   - static CSS imports or defines shared desktop classes.
2. Run targeted Node tests and verify RED.

## Task 4: Refactor xingqiwu renderGame through descriptor

**Objective:** Replace hard-coded desktop shell assembly with adapter + shared renderer.

**Files:**
- Modify: `xingqiwu-zhiqian/src/browserApp.mjs`
- Modify: `xingqiwu-zhiqian/src/styles.css`

**Steps:**
1. Import shared desktop helpers.
2. Add `renderPlayed(state)` common zone.
3. Add `xingqiwuDesktopDescriptor(state)` returning zones.
4. Make `renderGame(state)` call `renderTabletopDesktop`.
5. Preserve existing action handlers and card choice dialogs.
6. Update CSS selectors to support shared desktop classes while preserving existing visual hierarchy.
7. Run targeted Node tests until GREEN.
8. Commit xingqiwu desktop refactor.

## Task 5: Full verification and served-route check

**Objective:** Prove the implementation works locally and through the running service.

**Files:**
- No planned source changes unless verification exposes a bug.

**Steps:**
1. Run `node --test tests/*.test.mjs` from repo root.
2. Run `node --test` inside `xingqiwu-zhiqian` if needed for submodule tests.
3. Run `python -m pytest tests -q` from repo root.
4. Run `git diff --check` for root and submodule.
5. Restart `mini-dashboards.service`.
6. Verify Tailscale IP is online with `tailscale status`.
7. Verify `http://100.123.13.124:8080/xingqiwu-zhiqian/` with browser automation: no console errors, desktop component markers present, common played zone present, draw pile does not reveal hidden card names.
8. Report exact test and service evidence.
