import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  renderCardStack,
  setupCardStacks,
  summarizeStackCards,
} from '../cardStack.mjs';

const stackCards = [
  { uid: 'top-b', name: 'Beta', type: 'starter', iconsText: '工1', effectText: '第二种牌。' },
  { uid: 'middle-a', name: 'Alpha', type: 'reward', iconsText: '食1', effectText: '第一种牌。' },
  { uid: 'bottom-b', name: 'Beta', type: 'starter', iconsText: '工1', effectText: '第二种牌。' },
];

test('summarizeStackCards groups duplicate cards and sorts by identity instead of deck order', () => {
  const groups = summarizeStackCards(stackCards);

  assert.deepEqual(groups.map((group) => `${group.name}×${group.count}`), ['Alpha×1', 'Beta×2']);
  assert.deepEqual(groups.map((group) => group.representative.uid), ['middle-a', 'top-b']);
});

test('renderCardStack shows only stacked card backs until its unordered contents dialog is opened', () => {
  const html = renderCardStack({
    id: 'draw',
    title: '抽牌堆',
    cards: stackCards,
    renderCardContent: (card, { count }) => `<strong>${card.name}</strong><span>${card.type}</span><em>×${count}</em>`,
  });
  const collapsed = html.slice(html.indexOf('data-card-stack="draw"'), html.indexOf('data-card-stack-dialog="draw"'));
  const dialog = html.slice(html.indexOf('data-card-stack-dialog="draw"'));

  assert(html.includes('data-card-stack="draw"'));
  assert(html.includes('data-card-stack-count="3"'));
  assert(html.includes('data-card-stack-open="draw"'));
  assert(html.includes('data-card-stack-face-down="true"'));
  assert(!collapsed.includes('card-stack-back-mark'), 'collapsed backs should be wordless decorative backs, not repeated text labels');
  assert(!collapsed.includes('>牌背<'), 'visual card backs should not print “牌背” through the stack');
  assert(collapsed.includes('card-stack-back--top'));
  assert(collapsed.includes('3 张'));
  assert(!collapsed.includes('Alpha'));
  assert(!collapsed.includes('Beta'));
  assert(dialog.includes('data-card-stack-dialog="draw"'));
  assert(dialog.includes('data-stack-order="unknown"'));
  assert(dialog.includes('顺序未知'));
  assert(dialog.includes('<strong>Alpha</strong>'));
  assert(dialog.includes('<strong>Beta</strong>'));
  assert(dialog.includes('<em>×2</em>'));
  assert(!dialog.includes('top-b'));
  assert(!dialog.includes('middle-a'));
  assert(!dialog.includes('data-stack-position'));
});

test('renderCardStack can render unordered contents with a full consumer card frame class', () => {
  const html = renderCardStack({
    id: 'discard',
    title: '弃牌堆',
    cards: [{ uid: 's05-1', id: 'S05', name: '咬牙忍耐', type: 'starter', iconsText: '心1', effectText: '保留1张未打出的手牌。' }],
    previewCardClassName: 'card card-stack-preview-card',
    renderCardContent: (card) => `<div class="card-head"><strong>${card.name}</strong><span>${card.type}</span></div><p>${card.effectText}</p>`,
  });
  const dialog = html.slice(html.indexOf('data-card-stack-dialog="discard"'));

  assert(dialog.includes('class="shared-card-frame card card-stack-preview-card"'));
  assert(!dialog.includes('data-card-uid="s05-1"'));
  assert(dialog.includes('data-card-id="S05"'));
  assert(dialog.includes('data-card-type="starter"'));
  assert(dialog.includes('<span>starter</span>'));
  assert(dialog.includes('保留1张未打出的手牌。'));
});

test('setupCardStacks opens and closes stack dialogs through delegated events', () => {
  const listeners = new Map();
  const dialog = {
    hidden: true,
    attrs: new Map(),
    setAttribute(key, value) { this.attrs.set(key, value); },
    removeAttribute(key) { this.attrs.delete(key); },
  };
  const opener = {
    getAttribute(key) { return key === 'data-card-stack-open' ? 'draw' : null; },
  };
  const closeButton = {
    closest(selector) {
      if (selector === '[data-card-stack-open]') return null;
      if (selector === '[data-card-stack-close], [data-card-stack-cancel]') return this;
      return null;
    },
  };
  const root = {
    addEventListener(type, handler) { listeners.set(type, handler); },
    removeEventListener(type, handler) {
      if (listeners.get(type) === handler) listeners.delete(type);
    },
    querySelector(selector) {
      if (selector === '[data-card-stack-dialog="draw"]') return dialog;
      if (selector === '[data-card-stack-dialog]:not([hidden])') return dialog.hidden ? null : dialog;
      return null;
    },
  };

  const cleanup = setupCardStacks(root);
  listeners.get('click')({
    target: {
      closest(selector) {
        return selector === '[data-card-stack-open]' ? opener : null;
      },
    },
  });

  assert.equal(dialog.hidden, false);
  assert.equal(dialog.attrs.get('data-card-stack-open-state'), 'open');

  listeners.get('click')({ target: closeButton });
  assert.equal(dialog.hidden, true);
  assert.equal(dialog.attrs.has('data-card-stack-open-state'), false);

  listeners.get('click')({
    target: {
      closest(selector) {
        return selector === '[data-card-stack-open]' ? opener : null;
      },
    },
  });
  listeners.get('keydown')({ key: 'Escape' });
  assert.equal(dialog.hidden, true);

  cleanup();
  assert.equal(listeners.size, 0);
});

test('cardStack.css defines stack backs, modal dialog, and unordered content grid hooks', () => {
  const css = readFileSync(new URL('../cardStack.css', import.meta.url), 'utf8');

  assert.match(css, /\.card-stack\b/);
  assert.match(css, /\.card-stack-backs\b/);
  assert.match(css, /\.card-stack-back\b/);
  assert.match(css, /\.card-stack-back\s*\{[^}]*background:/s);
  assert.match(css, /\.card-stack-back\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.card-stack-back::before/s);
  assert.doesNotMatch(css, /\.card-stack-back--top\s+\.card-stack-back-mark/s);
  assert.match(css, /\.card-stack-dialog\[hidden\]/);
  assert.match(css, /\.card-stack-content-grid\b/);
  assert.match(css, /data-stack-order="unknown"/);
  assert(!/\.card-stack[^{}]*\{[^}]*overflow-y:\s*(auto|scroll)/s.test(css));
});
