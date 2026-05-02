import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  TABLETOP_DESKTOP_MODE,
  renderCardPile,
  renderDesktopZone,
  renderHandPile,
  renderTabletopDesktop,
} from '../tabletopDesktop.mjs';

test('renderTabletopDesktop exposes desktop shell and zone markers', () => {
  const html = renderTabletopDesktop({
    title: '测试牌桌',
    eyebrow: 'HTML5 electronic prototype',
    linkHtml: '<a href="./design.md">设计文档</a>',
    zones: [
      { id: 'zone1', title: 'Zone 1', kind: 'special', bodyHtml: '<p>特殊区</p>' },
      { id: 'played', title: 'Common Zone', kind: 'common', bodyHtml: '<p>打出的牌</p>' },
    ],
  });

  assert.equal(TABLETOP_DESKTOP_MODE, 'desktop-overview');
  assert(html.includes('class="tabletop-desktop'));
  assert(html.includes('data-tabletop-component="desktop"'));
  assert(html.includes('data-tabletop-camera'));
  assert(html.includes('data-tabletop-mode="desktop-overview"'));
  assert(html.includes('class="tabletop-desktop-surface'));
  assert(html.includes('data-table-zone="zone1"'));
  assert(html.includes('data-zone-kind="special"'));
  assert(html.includes('data-table-zone="played"'));
  assert(html.includes('data-zone-kind="common"'));
  assert(html.includes('设计文档'));
});

test('renderTabletopDesktop groups zones into upper center and bottom board regions', () => {
  const html = renderTabletopDesktop({
    title: '三段牌桌',
    zones: [
      { id: 'crisis', title: '危机区', kind: 'special', region: 'upper', bodyHtml: '<p>危机</p>' },
      { id: 'played', title: '打出区', kind: 'common', region: 'center', bodyHtml: '<p>已打出</p>' },
      { id: 'draw', title: '抽牌堆', kind: 'draw', region: 'bottom', bodyHtml: '<p>抽牌</p>' },
      { id: 'hand', title: '手牌', kind: 'hand', region: 'bottom', bodyHtml: '<p>手牌</p>' },
      { id: 'discard', title: '弃牌堆', kind: 'discard', region: 'bottom', bodyHtml: '<p>弃牌</p>' },
    ],
  });

  assert(html.includes('data-tabletop-board'));
  assert(html.includes('data-desktop-region="upper"'));
  assert(html.includes('data-desktop-region="center"'));
  assert(html.includes('data-desktop-region="bottom"'));
  assert(html.indexOf('data-desktop-region="upper"') < html.indexOf('data-desktop-region="center"'));
  assert(html.indexOf('data-desktop-region="center"') < html.indexOf('data-desktop-region="bottom"'));
  assert(html.indexOf('data-table-zone="draw"') < html.indexOf('data-table-zone="hand"'));
  assert(html.indexOf('data-table-zone="hand"') < html.indexOf('data-table-zone="discard"'));
});

test('renderDesktopZone marks semantic kind and layout span without game rules', () => {
  const html = renderDesktopZone({
    id: 'custom-market',
    title: '市场',
    kind: 'special',
    className: 'market-zone',
    span: 4,
    bodyHtml: '<button type="button">选择</button>',
  });

  assert(html.includes('data-table-zone="custom-market"'));
  assert(html.includes('data-zone-kind="special"'));
  assert(html.includes('data-zone-span="4"'));
  assert(html.includes('style="--zone-span: 4;"'));
  assert(html.includes('market-zone'));
  assert(html.includes('<button type="button">选择</button>'));
});

test('renderHandPile shows every hand card as same-sized direct-play cards', () => {
  const html = renderHandPile({
    id: 'hand',
    cards: [
      { uid: 'h1', name: '采集野果', type: 'starter' },
      { uid: 'bad1', name: '饥饿', type: 'bad' },
    ],
    action: 'play-card',
    disabledCardReason: (card) => (card.type === 'bad' ? '坏牌不能主动打出' : ''),
    renderCardContent: (card) => `<strong>${card.name}</strong>`,
  });

  assert(html.includes('data-hand-pile="hand"'));
  assert(html.includes('data-card-size="same-game"'));
  assert(html.includes('data-action="play-card"'));
  assert(html.includes('data-hand-card="h1"'));
  assert(html.includes('aria-label="打出 采集野果"'));
  assert(html.includes('data-hand-card="bad1"'));
  assert(html.includes('disabled aria-disabled="true"'));
  assert(!html.includes('data-card-choice-dialog="hand"'));
  assert(!html.includes('data-card-selection="hand"'));
});

test('renderCardPile face-down draw pile hides card identity and shows only count', () => {
  const html = renderCardPile({
    id: 'draw',
    title: '抽牌堆',
    kind: 'draw',
    faceDown: true,
    count: 3,
    cards: [
      { uid: 'secret-1', name: '隐藏顶牌', type: 'starter' },
      { uid: 'secret-2', name: '隐藏第二张', type: 'reward' },
    ],
  });

  assert(html.includes('data-card-pile="draw"'));
  assert(html.includes('data-pile-kind="draw"'));
  assert(html.includes('data-pile-hidden="true"'));
  assert(html.includes('data-pile-count="3"'));
  assert(html.includes('牌背'));
  assert(html.includes('3 张'));
  assert(html.includes('data-card-aspect="51:89"'));
  assert(!html.includes('隐藏顶牌'));
  assert(!html.includes('隐藏第二张'));
});

test('renderCardPile visible discard pile renders compact card summaries', () => {
  const html = renderCardPile({
    id: 'discard',
    title: '弃牌堆',
    kind: 'discard',
    cards: [
      { uid: 'd1', name: '折断树枝', type: 'starter', iconsText: '工1' },
      { uid: 'd2', name: '探潮采贝', type: 'reward', iconsText: '食1' },
    ],
  });

  assert(html.includes('data-card-pile="discard"'));
  assert(html.includes('data-pile-kind="discard"'));
  assert(html.includes('折断树枝'));
  assert(html.includes('探潮采贝'));
  assert(html.includes('starter'));
  assert(html.includes('工1'));
  assert(!html.includes('data-pile-hidden="true"'));
});

test('tabletopDesktop.css defines reusable grid flow with no internal scrollbars', () => {
  const css = readFileSync(new URL('../tabletopDesktop.css', import.meta.url), 'utf8');

  assert.match(css, /\.tabletop-desktop\b/);
  assert.match(css, /\.tabletop-desktop-board\b/);
  assert.match(css, /data-desktop-region/);
  assert.match(css, /\.tabletop-hand-pile\b/);
  assert.match(css, /--tabletop-card-width:\s*132px/);
  assert.match(css, /\.tabletop-hand-card\b[^{}]*\{[^}]*width:\s*var\(--tabletop-card-width\)/s);
  assert.match(css, /\.tabletop-zone\s*\{[^}]*overflow:\s*visible/s);
  assert(!/\.tabletop-zone[^{}]*\{[^}]*overflow-y:\s*(auto|scroll)/s.test(css));
  assert(!/\.tabletop-zone[^{}]*\{[^}]*overflow:\s*(auto|scroll)/s.test(css));
});
