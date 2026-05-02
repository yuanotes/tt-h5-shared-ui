# Shared 51:89 Card Components Design

## Goal

Add a reusable `shared-ui/` card component suite for mini-dashboard HTML5 electronic prototypes. Every rendered game card in the target integration uses a strict `51:89` width-to-height ratio, card selection opens a center-screen candidate dialog, and confirmation uses the approved flow: click a card to highlight it, then click a confirm button; when rules allow forfeiting, show a give-up button.

## Approved Approach

Use the approved **Plan 2: generic component suite with a compatibility adapter**.

The suite is split into four responsibilities:

1. `Card Frame`: renders a generic card shell with `data-card-aspect="51:89"` and a content slot. It does not know about any specific game fields.
2. `Card Motion`: provides lightweight tabletop-style movement through CSS classes and transform-based transitions. It does not implement drag physics, collision, or full tabletop scheduling.
3. `Card Choice Dialog`: renders the center modal with fan-spread candidate cards, highlight-before-confirm selection, confirm/cancel controls, and optional give-up.
4. `Card Selection Adapter`: preserves existing `renderCardSelection()` and checked-input collection APIs so `xingqiwu-zhiqian` can migrate without rewriting rule logic.

## Component Boundaries

`shared-ui/cardSelection.mjs` owns generic rendering helpers and delegated browser behavior:

- HTML escaping and safe `contextId` validation.
- 51:89 card frame rendering.
- selection input names and hidden input generation for compatibility.
- choice dialog markup.
- delegated click/keyboard handlers for opening dialogs, highlighting candidates, confirming, giving up, and cancelling.

`xingqiwu-zhiqian/src/browserApp.mjs` remains responsible for:

- rendering game-specific card content.
- deciding which cards are selectable in each context.
- calling game engine functions such as `playCards()`, `chooseReward()`, and `endDay()`.
- maintaining `selectedUidsByContext` across redraws.

`xingqiwu-zhiqian/src/styles.css` owns the actual visual skin for the project while using generic shared-ui class hooks.

## API Shape

The shared module exposes:

- `renderCardFrame({ card, className, contentHtml })`
- `renderCardChoiceDialog({ contextId, cards, title, helpText, min, max, allowGiveUp, allowCancel, renderCardContent })`
- `renderCardSelection({ contextId, cards, min, max, allowGiveUp, allowCancel, isCardSelectable, renderCardContent })`
- existing compatibility helpers: `selectionInputName()`, `renderSelectionInput()`, `collectSelectedCardUids()`, `selectedUidsFromEntries()`, `rememberSelectionFromChange()`, `restoreSelections()`
- `setupCardChoiceDialogs(root)` for delegated browser interaction.

Selection confirmation returns through checked compatibility inputs and a bubbling `card-choice:confirm` custom event. Give-up clears the context and emits `card-choice:give-up`. Cancel closes the dialog without changing committed selection.

## Interaction Rules

- Clicking an opener button displays a modal in the center of the screen.
- Candidate cards fan out from the center using transform variables.
- Clicking a card changes only pending highlight state.
- The confirm button is disabled until the pending selection satisfies `min`.
- Confirm writes the pending selection to hidden checked inputs, dispatches change events, emits `card-choice:confirm`, and closes the modal.
- Give-up appears only when `allowGiveUp` is true; it clears the context, emits `card-choice:give-up`, and closes the modal.
- Escape or cancel closes the modal without modifying committed selection when cancellation is allowed.
- All animation is CSS transform/transition based and respects `prefers-reduced-motion`.

## Non-goals

- No drag-and-drop card manipulation.
- No real physics, collision, snapping, or bounce scheduling.
- No Tabletop Simulator integration.
- No hard-coded `xingqiwu-zhiqian` card fields inside `shared-ui/`.
- No rule-engine changes unless required to connect UI results.

## Migration Scope

The implementation integrates the suite into `xingqiwu-zhiqian` for current card rendering and selection contexts:

- hand play selection: `play-hand`
- retain target selection: `retain-target`
- cleanse target selection: `cleanse-target`
- reward candidate cards continue to render through the shared 51:89 frame; direct reward confirmation can remain as project action controls unless explicitly migrated later.

## Testing Requirements

- Shared JS tests must cover card frame ratio markers, dialog controls, optional give-up, compatibility inputs, and selection restore/collection helpers.
- `xingqiwu-zhiqian` rendering tests must cover 51:89 card markers and dialog selection markers for hand/retain/cleanse contexts.
- Static CSS tests or rendering tests must confirm `aspect-ratio: 51 / 89` and dialog/fan hooks exist.
- Full verification must run:
  - `node --test tests/shared_card_selection.test.mjs`
  - `node --test xingqiwu-zhiqian/tests/*.test.mjs`
  - `python -m pytest tests -q`

## Acceptance Criteria

- Every `xingqiwu-zhiqian` card shell uses a shared 51:89 frame marker or project card class styled with `aspect-ratio: 51 / 89`.
- Selection contexts render an opener plus center dialog instead of visible checkbox-first UI.
- Candidate dialog supports fan layout hooks, highlight-before-confirm, confirm disabled until valid, cancel, and optional give-up.
- Existing command buttons can still collect selected card UIDs through `collectSelectedCardUids()`.
- Existing tests remain green after the migration.
