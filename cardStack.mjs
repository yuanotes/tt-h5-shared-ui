import { escapeHtml, renderCardFrame } from './cardSelection.mjs';

const SAFE_ID = /^[a-z][a-z0-9-]*$/;
const SAFE_ATTR = /^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/;

function assertSafeId(value, label = 'id') {
  if (!SAFE_ID.test(String(value || ''))) {
    throw new Error(`card stack ${label} must match ${SAFE_ID}: ${value}`);
  }
}

function renderHtmlAttributes(attrs = {}) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== false && value !== null && value !== undefined)
    .map(([key, value]) => {
      if (!SAFE_ATTR.test(key)) throw new Error(`unsafe html attribute: ${key}`);
      if (value === true) return escapeHtml(key);
      return `${escapeHtml(key)}="${escapeHtml(value)}"`;
    })
    .join(' ');
}

function classList(...items) {
  return items
    .flatMap((item) => String(item || '').split(/\s+/))
    .map((item) => item.trim())
    .filter(Boolean)
    .join(' ');
}

function stableJson(value) {
  if (!value || typeof value !== 'object') return value ?? '';
  if (Array.isArray(value)) return value.map(stableJson);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableJson(value[key])]));
}

function stackIdentity(card = {}) {
  return JSON.stringify({
    id: card.id || '',
    name: card.name || '',
    type: card.type || '',
    icons: stableJson(card.icons || {}),
    iconsText: card.iconsText || '',
    requirement: stableJson(card.requirement || {}),
    effectText: card.effectText || card.effect || '',
  });
}

function displaySortKey(group) {
  return [group.name || '', group.type || '', group.effectText || '', group.key].join('\u0000');
}

export function summarizeStackCards(cards = []) {
  const groups = new Map();
  for (const card of cards || []) {
    const key = stackIdentity(card);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        id: card?.id || '',
        name: card?.name || card?.id || card?.uid || '未知牌',
        type: card?.type || '',
        effectText: card?.effectText || card?.effect || '',
        icons: card?.icons || {},
        iconsText: card?.iconsText || '',
        requirement: card?.requirement || {},
        representative: card,
        count: 0,
      });
    }
    groups.get(key).count += 1;
  }
  return [...groups.values()].sort((a, b) => displaySortKey(a).localeCompare(displaySortKey(b), 'zh-Hans'));
}

function defaultRenderStackCardContent(card, { count } = {}) {
  return `<div class="card-stack-preview-default">
    <strong>${escapeHtml(card?.name || '未知牌')}</strong>
    ${card?.type ? `<span>${escapeHtml(card.type)}</span>` : ''}
    <em>×${escapeHtml(count || 1)}</em>
  </div>`;
}

function backFrames(id, title, count) {
  const visibleBacks = Math.max(1, Math.min(3, count || 1));
  return Array.from({ length: visibleBacks }, (_, index) => {
    const isTopBack = index === visibleBacks - 1;
    return renderCardFrame({
      card: { uid: `${id}-back-${index + 1}`, name: title || id, type: 'stack-back' },
      className: classList('card-stack-back', `card-stack-back--${index + 1}`, isTopBack && 'card-stack-back--top'),
      attrs: { 'aria-hidden': 'true' },
      contentHtml: '',
    });
  }).join('');
}

function previewCards(groups, renderCardContent, previewCardClassName) {
  if (groups.length === 0) return '<p class="empty">牌堆为空。</p>';
  return groups.map((group) => {
    const cardForDisplay = {
      name: group.name,
      id: group.id,
      type: group.type,
      icons: group.icons,
      iconsText: group.iconsText,
      requirement: group.requirement,
      effectText: group.effectText,
    };
    const contentHtml = renderCardContent(cardForDisplay, { count: group.count, stackGroup: group });
    return `<div class="card-stack-content-item" data-card-stack-item data-card-stack-item-count="${escapeHtml(group.count)}">
      <span class="card-stack-count-badge" aria-label="${escapeHtml(group.count)} 张">×${escapeHtml(group.count)}</span>
      ${renderCardFrame({
        card: cardForDisplay,
        className: previewCardClassName,
        contentHtml,
      })}
    </div>`;
  }).join('');
}

export function renderCardStack(options = {}) {
  const {
    id,
    title = '',
    cards = [],
    count = Array.isArray(cards) ? cards.length : 0,
    className = '',
    emptyText = '牌堆为空。',
    helpText = '这里只显示牌堆构成，不显示抽取顺序。',
    openLabel = '查看牌堆内容',
    closeLabel = '关闭',
    renderCardContent = defaultRenderStackCardContent,
    previewCardClassName = 'card-stack-preview-card',
    attrs = {},
  } = options;
  assertSafeId(id, 'id');
  const safeCount = Math.max(0, Number(count || 0));
  const groups = summarizeStackCards(cards);
  const stackAttrs = {
    class: classList('card-stack', className),
    'data-card-stack': id,
    'data-card-stack-count': safeCount,
    'data-card-stack-face-down': 'true',
    ...attrs,
  };
  const titleId = `card-stack-title-${id}`;
  const dialogTitleId = `card-stack-dialog-title-${id}`;
  const trigger = `<button type="button" class="card-stack-trigger" data-card-stack-open="${escapeHtml(id)}" aria-haspopup="dialog" aria-controls="card-stack-dialog-${escapeHtml(id)}" aria-labelledby="${titleId}">
    <span class="card-stack-backs" aria-hidden="true">${backFrames(id, title, safeCount)}</span>
    <span class="card-stack-label" id="${titleId}">
      ${title ? `<strong>${escapeHtml(title)}</strong>` : ''}
      <span>${safeCount} 张</span>
      <small>${escapeHtml(openLabel)}</small>
    </span>
  </button>`;
  const body = groups.length
    ? `<div class="card-stack-content-grid">${previewCards(groups, renderCardContent, previewCardClassName)}</div>`
    : `<p class="empty">${escapeHtml(emptyText)}</p>`;
  const dialog = `<div class="card-stack-dialog" id="card-stack-dialog-${escapeHtml(id)}" data-card-stack-dialog="${escapeHtml(id)}" data-stack-order="unknown" role="dialog" aria-modal="true" aria-labelledby="${dialogTitleId}" hidden>
    <div class="card-stack-scrim" data-card-stack-cancel></div>
    <section class="card-stack-panel">
      <header class="card-stack-panel-header">
        <div>
          <h3 id="${dialogTitleId}">${title ? escapeHtml(title) : '牌堆内容'}</h3>
          <p class="card-stack-order-note">顺序未知：${escapeHtml(helpText)}</p>
        </div>
        <button type="button" class="ghost card-stack-close" data-card-stack-close>${escapeHtml(closeLabel)}</button>
      </header>
      ${body}
    </section>
  </div>`;
  return `<div ${renderHtmlAttributes(stackAttrs)}>${trigger}${dialog}</div>`;
}

function openDialog(dialog) {
  if (!dialog) return;
  dialog.hidden = false;
  dialog.setAttribute('data-card-stack-open-state', 'open');
}

function closeDialog(dialog) {
  if (!dialog) return;
  dialog.hidden = true;
  dialog.removeAttribute('data-card-stack-open-state');
}

export function setupCardStacks(root = globalThis.document) {
  if (!root?.addEventListener || !root?.querySelector) return () => {};

  function onClick(event) {
    const opener = event.target.closest?.('[data-card-stack-open]');
    if (opener) {
      const stackId = opener.getAttribute('data-card-stack-open');
      assertSafeId(stackId, 'open id');
      openDialog(root.querySelector(`[data-card-stack-dialog="${stackId}"]`));
      return;
    }

    const closer = event.target.closest?.('[data-card-stack-close], [data-card-stack-cancel]');
    if (closer) {
      closeDialog(closer.closest?.('[data-card-stack-dialog]') || root.querySelector('[data-card-stack-dialog]:not([hidden])'));
    }
  }

  function onKeydown(event) {
    if (event.key !== 'Escape') return;
    closeDialog(root.querySelector('[data-card-stack-dialog]:not([hidden])'));
  }

  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeydown);
  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeydown);
  };
}
