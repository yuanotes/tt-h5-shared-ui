import { escapeHtml, renderCardFrame } from './cardSelection.mjs';

const SAFE_ID = /^[a-z][a-z0-9-]*$/;
const SAFE_ATTR = /^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/;
const DESKTOP_REGION_ORDER = ['status', 'upper', 'center', 'bottom', 'reference'];

export const TABLETOP_DESKTOP_MODE = 'desktop-overview';
export const DEFAULT_DESKTOP_COLUMNS = 12;

function assertSafeId(value, label = 'id') {
  if (!SAFE_ID.test(String(value || ''))) {
    throw new Error(`tabletop desktop ${label} must match ${SAFE_ID}: ${value}`);
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

function safeKind(kind = 'special') {
  const normalized = String(kind || 'special');
  assertSafeId(normalized, 'kind');
  return normalized;
}

function safeRegion(region = 'center') {
  const normalized = String(region || 'center');
  assertSafeId(normalized, 'region');
  return normalized;
}

function zoneSpan(span) {
  if (span === null || span === undefined || span === '') return null;
  const numeric = Number(span);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > DEFAULT_DESKTOP_COLUMNS) {
    throw new Error(`tabletop desktop span must be an integer from 1 to ${DEFAULT_DESKTOP_COLUMNS}: ${span}`);
  }
  return numeric;
}

export function renderDesktopZone(zone = {}) {
  const {
    id,
    title = '',
    kind = 'special',
    region = '',
    className = '',
    bodyHtml = '',
    actionsHtml = '',
    span = null,
    attrs = {},
  } = zone;
  assertSafeId(id, 'zone id');
  const semanticKind = safeKind(kind);
  const semanticRegion = region ? safeRegion(region) : '';
  const safeSpan = zoneSpan(span);
  const attributes = {
    class: classList('tabletop-zone', `tabletop-zone--${semanticKind}`, semanticRegion && `tabletop-zone--region-${semanticRegion}`, className),
    'data-table-zone': id,
    'data-zone-kind': semanticKind,
    ...(semanticRegion ? { 'data-zone-region': semanticRegion } : {}),
    ...(safeSpan ? { 'data-zone-span': safeSpan, style: `--zone-span: ${safeSpan};` } : {}),
    ...attrs,
  };
  return `<section ${renderHtmlAttributes(attributes)}>
    ${title ? `<h2>${escapeHtml(title)}</h2>` : ''}
    <div class="tabletop-zone-body">${bodyHtml}</div>
    ${actionsHtml ? `<div class="tabletop-zone-actions">${actionsHtml}</div>` : ''}
  </section>`;
}

function pileCount(options) {
  if (Number.isFinite(Number(options.count))) return Math.max(0, Number(options.count));
  return Array.isArray(options.cards) ? options.cards.length : 0;
}

function defaultCardSummary(card) {
  const name = escapeHtml(card?.name || card?.uid || card?.id || '未知牌');
  const type = card?.type ? escapeHtml(card.type) : 'card';
  const iconsText = card?.iconsText ? ` · ${escapeHtml(card.iconsText)}` : '';
  return `<div class="tabletop-pile-summary" data-pile-card-summary>
    <strong>${name}</strong><span>${type}${iconsText}</span>
  </div>`;
}

export function renderCardPile(options = {}) {
  const {
    id,
    title = '',
    kind = 'pile',
    cards = [],
    faceDown = false,
    emptyText = '牌堆为空。',
    maxVisible = 12,
    renderCardSummary = defaultCardSummary,
    attrs = {},
  } = options;
  assertSafeId(id, 'pile id');
  const semanticKind = safeKind(kind);
  const count = pileCount(options);
  const attributes = {
    class: classList('tabletop-card-pile', `tabletop-card-pile--${semanticKind}`),
    'data-card-pile': id,
    'data-pile-kind': semanticKind,
    'data-pile-count': count,
    ...(faceDown ? { 'data-pile-hidden': 'true' } : {}),
    ...attrs,
  };
  if (faceDown) {
    const back = renderCardFrame({
      card: { uid: `${id}-back`, name: title || id, type: 'pile' },
      className: 'tabletop-pile-card tabletop-pile-card--back',
      attrs: { 'aria-label': title || id, 'data-card-size': 'same-game' },
      contentHtml: `
        <div class="tabletop-card-back-mark">牌背</div>
        ${title ? `<strong>${escapeHtml(title)}</strong>` : ''}
        <span>${count} 张</span>`,
    });
    return `<div ${renderHtmlAttributes(attributes)}>${back}</div>`;
  }
  const visibleCards = [...cards].slice(-maxVisible).reverse();
  const content = visibleCards.length
    ? visibleCards.map((card, index) => renderCardSummary(card, { index, count })).join('')
    : `<p class="empty">${escapeHtml(emptyText)}</p>`;
  return `<div ${renderHtmlAttributes(attributes)}>${content}</div>`;
}

function defaultHandCardContent(card) {
  return `<strong>${escapeHtml(card?.name || card?.uid || '未知牌')}</strong>${card?.type ? `<span>${escapeHtml(card.type)}</span>` : ''}`;
}

export function renderHandPile(options = {}) {
  const {
    id = 'hand',
    cards = [],
    action = 'play-card',
    emptyText = '手牌为空。',
    disabled = false,
    disabledReason = '当前阶段不能打出手牌',
    disabledCardReason = () => '',
    renderCardContent = defaultHandCardContent,
    attrs = {},
  } = options;
  assertSafeId(id, 'hand pile id');
  assertSafeId(action, 'hand pile action');
  const attributes = {
    class: 'tabletop-hand-pile',
    'data-hand-pile': id,
    'data-card-size': 'same-game',
    ...attrs,
  };
  const content = cards.length
    ? cards.map((card, index) => {
        const uid = card?.uid;
        if (!uid) throw new Error('renderHandPile requires every card.uid');
        const cardDisabledReason = disabled ? disabledReason : disabledCardReason(card, { index });
        const isDisabled = Boolean(cardDisabledReason);
        const buttonAttrs = {
          type: 'button',
          class: 'tabletop-hand-card',
          'data-hand-card': uid,
          'data-card-uid': uid,
          'data-action': action,
          'data-card-size': 'same-game',
          'aria-label': `打出 ${card.name || uid}`,
          ...(isDisabled ? { disabled: true, 'aria-disabled': 'true', title: cardDisabledReason } : {}),
        };
        const frame = renderCardFrame({
          card,
          className: 'tabletop-hand-card-frame card',
          attrs: { 'data-card-size': 'same-game', 'aria-hidden': 'true' },
          contentHtml: renderCardContent(card, { index, disabled: isDisabled }),
        });
        return `<button ${renderHtmlAttributes(buttonAttrs)}>${frame}</button>`;
      }).join('')
    : `<p class="empty">${escapeHtml(emptyText)}</p>`;
  return `<div ${renderHtmlAttributes(attributes)}>${content}</div>`;
}

function orderedRegions(regions) {
  const known = DESKTOP_REGION_ORDER.filter((region) => regions.has(region));
  const custom = [...regions.keys()].filter((region) => !DESKTOP_REGION_ORDER.includes(region)).sort();
  return [...known, ...custom];
}

function renderRegionedZones(zones) {
  const hasRegions = zones.some((zone) => zone.region);
  if (!hasRegions) return zones.map((zone) => renderDesktopZone(zone)).join('');
  const groups = new Map();
  for (const zone of zones) {
    const region = safeRegion(zone.region || 'center');
    if (!groups.has(region)) groups.set(region, []);
    groups.get(region).push(zone);
  }
  return `<div class="tabletop-desktop-board" data-tabletop-board>
    ${orderedRegions(groups).map((region) => `<section class="tabletop-desktop-region tabletop-desktop-region--${escapeHtml(region)}" data-desktop-region="${escapeHtml(region)}">
      ${groups.get(region).map((zone) => renderDesktopZone({ ...zone, region })).join('')}
    </section>`).join('')}
  </div>`;
}

export function renderTabletopDesktop(descriptor = {}) {
  const {
    title = '',
    eyebrow = '',
    linkHtml = '',
    zones = [],
    className = '',
    headerClassName = '',
    surfaceClassName = '',
    attrs = {},
  } = descriptor;
  const shellAttrs = {
    class: classList('tabletop-desktop', className),
    'data-tabletop-component': 'desktop',
    'data-tabletop-camera': true,
    'data-tabletop-mode': TABLETOP_DESKTOP_MODE,
    ...attrs,
  };
  const header = title || eyebrow || linkHtml
    ? `<header class="${escapeHtml(classList('tabletop-desktop-header', headerClassName))}">
        <div>
          ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
          ${title ? `<h1>${escapeHtml(title)}</h1>` : ''}
        </div>
        ${linkHtml ? `<div class="tabletop-desktop-link">${linkHtml}</div>` : ''}
      </header>`
    : '';
  const renderedZones = renderRegionedZones(zones);
  return `<div ${renderHtmlAttributes(shellAttrs)}>
    ${header}
    <main class="${escapeHtml(classList('tabletop-desktop-surface', surfaceClassName))}">
      ${renderedZones}
    </main>
  </div>`;
}
