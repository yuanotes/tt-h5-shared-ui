import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CARD_ASPECT_RATIO,
  collectSelectedCardUids,
  renderCardChoiceDialog,
  renderCardFrame,
  renderCardSelection,
  renderSelectionInput,
  selectedUidsFromEntries,
  setupCardChoiceDialogs,
} from '../cardSelection.mjs';

test('renderCardSelection marks context, max, and per-card inputs', () => {
  const html = renderCardSelection({
    contextId: 'retain-target',
    title: '保留目标',
    helpText: '最多保留1张。',
    max: 1,
    cards: [{ uid: 'a1', name: '咬牙忍耐', type: 'starter' }],
  });

  assert(html.includes('data-card-selection="retain-target"'));
  assert(html.includes('data-selection-max="1"'));
  assert(html.includes('name="card-selection:retain-target"'));
  assert(html.includes('data-card-select-context="retain-target"'));
  assert(html.includes('data-card-uid="a1"'));
  assert(html.includes('最多保留1张。'));
});

test('renderCardFrame marks the standard 51:89 shared card shell', () => {
  const frame = renderCardFrame({
    card: { uid: 'a1', name: '咬牙忍耐', type: 'starter' },
    className: 'card compact',
    contentHtml: '<strong>咬牙忍耐</strong>',
  });

  assert.equal(CARD_ASPECT_RATIO, '51 / 89');
  assert(frame.includes('class="shared-card-frame card compact"'));
  assert(frame.includes('data-card-frame'));
  assert(frame.includes('data-card-aspect="51:89"'));
  assert(frame.includes('data-card-uid="a1"'));
  assert(frame.includes('data-card-type="starter"'));
  assert(frame.includes('<div class="shared-card-content"><strong>咬牙忍耐</strong></div>'));
});

test('renderCardChoiceDialog exposes horizontal candidates and confirm/give-up controls', () => {
  const dialog = renderCardChoiceDialog({
    contextId: 'play-hand',
    title: '选择要打出的手牌',
    helpText: '先高亮，再确认。',
    min: 1,
    max: 1,
    allowGiveUp: true,
    cards: [
      { uid: 'h1', name: '采集野果', type: 'starter' },
      { uid: 'h2', name: '折断树枝', type: 'starter' },
    ],
  });

  assert(dialog.includes('data-card-choice-dialog="play-hand"'));
  assert(dialog.includes('role="dialog"'));
  assert(dialog.includes('data-card-choice-card'));
  assert(dialog.includes('data-card-choice-row'));
  assert(!dialog.includes('data-card-choice-fan'));
  assert(dialog.includes('data-card-choice-confirm'));
  assert(dialog.includes('disabled'));
  assert(dialog.includes('data-card-choice-give-up'));
  assert(dialog.includes('aria-label="选择 采集野果"'));
  assert(!dialog.includes('--fan-rotation'));
});

test('setupCardChoiceDialogs is exported for browser delegated behavior', () => {
  assert.equal(typeof setupCardChoiceDialogs, 'function');
});

test('renderSelectionInput rejects unsafe context ids', () => {
  assert.throws(
    () => renderSelectionInput({ uid: 'a1', name: 'A' }, { contextId: 'bad context' }),
    /contextId/
  );
});

test('selectedUidsFromEntries reads only the requested context', () => {
  const entries = [
    ['card-selection:play-hand', 'h1'],
    ['card-selection:retain-target', 'r1'],
    ['card-selection:retain-target', 'r2'],
    ['card-selection:cleanse-target', 'b1'],
  ];

  assert.deepEqual(selectedUidsFromEntries(entries, 'retain-target'), ['r1', 'r2']);
});

test('collectSelectedCardUids reads checked inputs from a DOM-like root', () => {
  const queried = [];
  const root = {
    querySelectorAll(selector) {
      queried.push(selector);
      return [
        { getAttribute: (key) => (key === 'data-card-uid' ? 'c1' : null) },
        { getAttribute: (key) => (key === 'data-card-uid' ? 'c2' : null) },
      ];
    },
  };

  assert.deepEqual(collectSelectedCardUids(root, 'cleanse-target'), ['c1', 'c2']);
  assert.deepEqual(queried, ['[data-card-select-context="cleanse-target"][data-card-uid]:checked']);
});
