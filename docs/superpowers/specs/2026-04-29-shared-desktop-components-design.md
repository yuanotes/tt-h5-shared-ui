# Shared Desktop Components Design

**Goal:** Add reusable descriptor-driven desktop components for tabletop-to-HTML5 electronic prototypes, then refactor `xingqiwu-zhiqian` to use them.

**Decision:** Use Option B — descriptor-driven desktop. Each game translates its own state into a shared desktop descriptor; `shared-ui` renders the desktop shell, zones, common zone, and card piles without knowing game rules.

## Boundaries

### `shared-ui` owns
- Desktop shell with `data-tabletop-camera` and `data-tabletop-mode="desktop-overview"`.
- Zone semantics: `special`, `common`, `draw`, `hand`, `discard`, `pile`, `actions`, `log`.
- Desktop board regions: `status`, `upper`, `center`, `bottom`, `reference`; games may map zones into these regions declaratively.
- Stable DOM markers: `data-tabletop-component`, `data-table-zone`, `data-zone-kind`, `data-zone-region`, `data-desktop-region`, `data-card-pile`, `data-pile-kind`, `data-hand-pile`.
- Hidden draw pile safety: face-down card back plus count only; no top-card identity leakage.
- Same-game card sizing: a shared `--tabletop-card-width` contract so cards in one electronic prototype match actual rendered size, not just 51:89 ratio.
- Generic no-internal-scroll desktop flow classes.
- Compatibility with existing `renderCardFrame()` 51:89 card shells.
- A `renderHandPile()` presentation helper that shows every hand card and emits click actions upward; it does not execute play rules.

### `shared-ui` does not own
- Game rules: draw/play/discard/move card behavior.
- Whether a card is legal to play.
- Game-specific terms such as crisis, reward, project, victory route.
- The existing centered card choice dialog; it remains a separate shared component.
- Drag/drop, physical simulation, or card physics.

## Descriptor shape

```js
renderTabletopDesktop({
  title: '星期五之前',
  eyebrow: 'Robinson deckbuilding survival',
  linkHtml: '<a ...>设计文档</a>',
  zones: [
    {
      id: 'guidance',
      title: '提示区',
      kind: 'special',
      region: 'status',
      className: 'guidance-zone',
      bodyHtml: '<p>...</p>',
    },
    {
      id: 'played',
      title: '当日打出区',
      kind: 'common',
      region: 'center',
      className: 'common-zone',
      bodyHtml: renderCommonZone(...),
    },
  ],
})
```

Pile helpers accept game-rendered card HTML when card identities are visible, or face-down metadata when identities must remain hidden. Hand is a special visible pile: it renders all hand cards at the same game card width and emits a click action upward.

```js
renderCardPile({
  id: 'draw',
  kind: 'draw',
  title: '抽牌堆',
  count: state.playerDeck.length,
  faceDown: true,
})
renderHandPile({
  id: 'hand',
  cards: state.hand,
  action: 'play-card',
  disabledCardReason: (card) => card.type === 'bad' ? '坏牌不能主动打出' : '',
})
```

The default card table order for `xingqiwu-zhiqian` is:
- upper: crisis + projects
- center: played/common area
- bottom: draw pile + hand pile + discard pile

## Xingqiwu migration

`xingqiwu-zhiqian/src/browserApp.mjs` will add an adapter:

```js
export function xingqiwuDesktopDescriptor(state) {
  return {
    title: '星期五之前',
    eyebrow: 'Robinson deckbuilding survival',
    zones: [...],
  };
}
```

`renderGame(state)` will become a thin call to `renderTabletopDesktop(xingqiwuDesktopDescriptor(state))`.

The new common zone for `xingqiwu-zhiqian` is `played`: it displays cards already played today. This makes the electronic prototype closer to a real card-table surface while preserving the existing rules engine.

## Acceptance criteria

- `shared-ui/tabletopDesktop.mjs` exports desktop, zone, pile, and hand-pile render helpers.
- `shared-ui/tabletopDesktop.css` defines reusable desktop layout primitives, upper/center/bottom regions, and same-game fixed card sizing.
- Shared tests verify descriptor rendering, region markers, hand-pile direct-play markers, 51:89 card integration, same-size card CSS, and hidden draw pile safety.
- `xingqiwu-zhiqian` renders through a desktop descriptor adapter.
- `xingqiwu-zhiqian` includes a common/played zone and keeps draw/hand/discard pile zones in the bottom desktop region.
- Hand play uses the dedicated visible hand-pile component: hover highlights a card, click plays that card directly; the centered card-choice dialog is reserved for other selection contexts such as reward/retain/cleanse.
- No zone-level internal scrollbars are introduced.
- Full Node and Python test suites pass.
- Served route `http://100.123.13.124:8080/xingqiwu-zhiqian/` loads without JS console errors.
