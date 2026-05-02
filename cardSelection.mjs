const SAFE_CONTEXT = /^[a-z][a-z0-9-]*$/;
const SAFE_ATTR = /^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/;

export const CARD_ASPECT_RATIO = '51 / 89';

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function assertContextId(contextId) {
  if (!SAFE_CONTEXT.test(String(contextId || ''))) {
    throw new Error(`card selection contextId must match ${SAFE_CONTEXT}: ${contextId}`);
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

export function selectionInputName(contextId) {
  assertContextId(contextId);
  return `card-selection:${contextId}`;
}

export function renderSelectionInput(card, options = {}) {
  const {
    contextId,
    label = '选择',
    disabled = false,
    hidden = false,
    checked = false,
  } = options;
  assertContextId(contextId);
  const uid = card?.uid;
  if (!uid) throw new Error('renderSelectionInput requires card.uid');
  const input = `<input type="checkbox"
      name="${escapeHtml(selectionInputName(contextId))}"
      value="${escapeHtml(uid)}"
      data-card-select-context="${escapeHtml(contextId)}"
      data-card-uid="${escapeHtml(uid)}"
      ${checked ? 'checked' : ''}
      ${disabled ? 'disabled' : ''}
      ${hidden ? 'hidden aria-hidden="true"' : ''}>`;
  if (hidden) return input;
  return `<label class="select-card" data-selection-label="${escapeHtml(contextId)}">
    ${input}
    ${escapeHtml(label)}
  </label>`;
}

function defaultRenderCardContent(card) {
  return `<strong>${escapeHtml(card.name || card.uid)}</strong>${card.type ? `<span>${escapeHtml(card.type)}</span>` : ''}`;
}

export function renderCardFrame(options = {}) {
  const {
    card = {},
    className = '',
    contentHtml = '',
    attrs = {},
  } = options;
  const uid = card.uid || card.id || '';
  const classes = ['shared-card-frame', className].filter(Boolean).join(' ');
  const mergedAttrs = {
    class: classes,
    'data-card-frame': true,
    'data-card-aspect': '51:89',
    ...(uid ? { 'data-card-uid': uid } : {}),
    ...(card.id ? { 'data-card-id': card.id } : {}),
    ...(card.type ? { 'data-card-type': card.type } : {}),
    ...attrs,
  };
  return `<article ${renderHtmlAttributes(mergedAttrs)}><div class="shared-card-content">${contentHtml}</div></article>`;
}

function safeSelectionMax(max, cardsLength) {
  if (!Number.isFinite(max)) return cardsLength;
  return Math.max(0, Number(max));
}

export function renderCardChoiceDialog(options = {}) {
  const {
    contextId,
    cards = [],
    title = '',
    helpText = '',
    min = 0,
    max = Number.POSITIVE_INFINITY,
    emptyText = '没有可选牌。',
    confirmLabel = '选择高亮牌',
    giveUpLabel = '放弃',
    cancelLabel = '取消',
    allowGiveUp = false,
    allowCancel = true,
    renderCardContent = defaultRenderCardContent,
    isCardSelectable = () => true,
  } = options;
  assertContextId(contextId);
  const safeMin = Math.max(0, Number(min || 0));
  const safeMax = safeSelectionMax(max, cards.length);
  const candidateCount = cards.length;
  const candidates = candidateCount
    ? cards.map((card, index) => {
        const uid = card?.uid;
        if (!uid) throw new Error('renderCardChoiceDialog requires every card.uid');
        const selectable = Boolean(isCardSelectable(card));
        const style = `--choice-index: ${index}; --choice-count: ${candidateCount};`;
        const contentHtml = renderCardContent(card, { selectable, index, selected: false });
        return `<button type="button" class="card-choice-card" data-card-choice-card data-card-uid="${escapeHtml(uid)}" aria-label="选择 ${escapeHtml(card.name || uid)}" aria-selected="false" style="${escapeHtml(style)}" ${selectable ? '' : 'disabled aria-disabled="true"'}>
          ${renderCardFrame({ card, className: 'selection-card card-choice-frame', contentHtml })}
        </button>`;
      }).join('')
    : `<p class="empty">${escapeHtml(emptyText)}</p>`;
  return `<div class="card-choice-dialog" data-card-choice-dialog="${escapeHtml(contextId)}" data-choice-min="${escapeHtml(safeMin)}" data-choice-max="${escapeHtml(safeMax)}" ${allowCancel ? 'data-choice-allow-cancel="true"' : ''} hidden>
    <div class="card-choice-scrim" data-card-choice-cancel></div>
    <section class="card-choice-panel" role="dialog" aria-modal="true" aria-labelledby="card-choice-title-${escapeHtml(contextId)}">
      ${title ? `<h3 id="card-choice-title-${escapeHtml(contextId)}">${escapeHtml(title)}</h3>` : ''}
      ${helpText ? `<p class="selection-help">${escapeHtml(helpText)}</p>` : ''}
      <div class="card-choice-row" data-card-choice-row>${candidates}</div>
      <div class="card-choice-actions">
        <button type="button" data-card-choice-confirm ${safeMin > 0 ? 'disabled' : ''}>${escapeHtml(confirmLabel)}</button>
        ${allowGiveUp ? `<button type="button" class="ghost" data-card-choice-give-up>${escapeHtml(giveUpLabel)}</button>` : ''}
        ${allowCancel ? `<button type="button" class="ghost" data-card-choice-cancel>${escapeHtml(cancelLabel)}</button>` : ''}
      </div>
    </section>
  </div>`;
}

export function renderCardSelection(options = {}) {
  const {
    contextId,
    cards = [],
    title = '',
    helpText = '',
    min = 0,
    max = Number.POSITIVE_INFINITY,
    emptyText = '没有可选牌。',
    inputLabel = '选择',
    disabled = false,
    openLabel = '打开候选牌',
    confirmLabel = '选择高亮牌',
    allowGiveUp = false,
    allowCancel = true,
    autoOpen = false,
    renderCardContent = defaultRenderCardContent,
    isCardSelectable = () => true,
  } = options;
  assertContextId(contextId);
  const safeMax = Number.isFinite(max) ? String(Math.max(0, Number(max))) : 'unbounded';
  const selectableCards = cards.filter((card) => Boolean(isCardSelectable(card)));
  const inputBank = selectableCards.length
    ? `<div class="card-selection-inputs" hidden>${selectableCards.map((card) => renderSelectionInput(card, {
        contextId,
        label: inputLabel,
        disabled,
        hidden: true,
      })).join('')}</div>`
    : '';
  const body = cards.length
    ? `<button type="button" class="card-choice-open" data-card-choice-open="${escapeHtml(contextId)}" ${disabled ? 'disabled' : ''}>${escapeHtml(openLabel)}</button>
      <p class="card-choice-summary" data-card-choice-summary>未选择</p>
      ${inputBank}
      ${renderCardChoiceDialog({
        contextId,
        cards,
        title,
        helpText,
        min,
        max,
        emptyText,
        confirmLabel,
        allowGiveUp,
        allowCancel,
        renderCardContent,
        isCardSelectable,
      })}`
    : `<p class="empty">${escapeHtml(emptyText)}</p>`;

  return `<section class="card-selection shared-card-selection" data-card-selection="${escapeHtml(contextId)}" ${autoOpen ? `data-auto-open-card-choice="${escapeHtml(contextId)}"` : ''} data-selection-min="${escapeHtml(min)}" data-selection-max="${escapeHtml(safeMax)}">
    ${title ? `<h3>${escapeHtml(title)}</h3>` : ''}
    ${helpText ? `<p class="selection-help">${escapeHtml(helpText)}</p>` : ''}
    ${body}
  </section>`;
}

export function selectedUidsFromEntries(entries, contextId) {
  const name = selectionInputName(contextId);
  return [...entries]
    .filter(([key]) => key === name)
    .map(([, value]) => String(value));
}

export function collectSelectedCardUids(root, contextId) {
  assertContextId(contextId);
  if (!root?.querySelectorAll) return [];
  return [...root.querySelectorAll(`[data-card-select-context="${contextId}"][data-card-uid]:checked`)]
    .map((node) => node.getAttribute('data-card-uid'))
    .filter(Boolean);
}

export function rememberSelectionFromChange(event, selectedByContext) {
  const target = event?.target;
  const contextId = target?.getAttribute?.('data-card-select-context');
  const uid = target?.getAttribute?.('data-card-uid');
  if (!contextId || !uid) return false;
  assertContextId(contextId);
  if (!selectedByContext.has(contextId)) selectedByContext.set(contextId, new Set());
  const selected = selectedByContext.get(contextId);
  if (target.checked) selected.add(uid);
  else selected.delete(uid);
  return true;
}

function selectionSection(node) {
  return node?.closest?.('[data-card-selection]') || null;
}

function sectionInputs(section) {
  return [...(section?.querySelectorAll?.('[data-card-select-context][data-card-uid]') || [])];
}

function dialogCards(dialog) {
  return [...(dialog?.querySelectorAll?.('[data-card-choice-card][data-card-uid]') || [])];
}

function selectedDialogUids(dialog) {
  return dialogCards(dialog)
    .filter((node) => node.getAttribute('aria-selected') === 'true')
    .map((node) => node.getAttribute('data-card-uid'))
    .filter(Boolean);
}

function updateSelectionSummary(section) {
  const summary = section?.querySelector?.('[data-card-choice-summary]');
  if (!summary) return;
  const selected = sectionInputs(section)
    .filter((input) => input.checked)
    .map((input) => input.getAttribute('data-card-uid'))
    .filter(Boolean);
  summary.textContent = selected.length ? `已选择 ${selected.length} 张` : '未选择';
  summary.setAttribute('data-selected-count', String(selected.length));
}

function updateConfirmState(dialog) {
  const confirm = dialog?.querySelector?.('[data-card-choice-confirm]');
  if (!confirm) return;
  const min = Number(dialog.getAttribute('data-choice-min') || 0);
  confirm.disabled = selectedDialogUids(dialog).length < min;
}

function syncDialogFromCommittedInputs(dialog) {
  const section = selectionSection(dialog);
  const committed = new Set(sectionInputs(section)
    .filter((input) => input.checked)
    .map((input) => input.getAttribute('data-card-uid')));
  for (const card of dialogCards(dialog)) {
    card.setAttribute('aria-selected', committed.has(card.getAttribute('data-card-uid')) ? 'true' : 'false');
  }
  updateConfirmState(dialog);
}

function emitChoiceEvent(section, name, detail) {
  if (!section || typeof CustomEvent !== 'function') return;
  section.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
}

function dispatchInputChange(input) {
  if (typeof Event !== 'function') return;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function closeDialog(dialog) {
  if (!dialog) return;
  dialog.hidden = true;
  dialog.removeAttribute('data-card-choice-open-state');
}

function commitDialog(dialog) {
  const section = selectionSection(dialog);
  const selected = new Set(selectedDialogUids(dialog));
  const contextId = section?.getAttribute('data-card-selection') || dialog.getAttribute('data-card-choice-dialog');
  for (const input of sectionInputs(section)) {
    const shouldCheck = selected.has(input.getAttribute('data-card-uid'));
    if (input.checked !== shouldCheck) {
      input.checked = shouldCheck;
      dispatchInputChange(input);
    }
  }
  updateSelectionSummary(section);
  emitChoiceEvent(section, 'card-choice:confirm', { contextId, selectedUids: [...selected] });
  closeDialog(dialog);
}

function giveUpDialog(dialog) {
  const section = selectionSection(dialog);
  const contextId = section?.getAttribute('data-card-selection') || dialog.getAttribute('data-card-choice-dialog');
  for (const card of dialogCards(dialog)) card.setAttribute('aria-selected', 'false');
  for (const input of sectionInputs(section)) {
    if (input.checked) {
      input.checked = false;
      dispatchInputChange(input);
    }
  }
  updateSelectionSummary(section);
  updateConfirmState(dialog);
  emitChoiceEvent(section, 'card-choice:give-up', { contextId });
  closeDialog(dialog);
}

function openDialog(dialog) {
  if (!dialog) return;
  dialog.hidden = false;
  dialog.setAttribute('data-card-choice-open-state', 'open');
  syncDialogFromCommittedInputs(dialog);
}

function chooseCard(cardButton) {
  const dialog = cardButton?.closest?.('[data-card-choice-dialog]');
  if (!dialog || cardButton.disabled) return;
  const max = Number(dialog.getAttribute('data-choice-max') || 1);
  const wasSelected = cardButton.getAttribute('aria-selected') === 'true';
  if (max <= 1) {
    for (const card of dialogCards(dialog)) card.setAttribute('aria-selected', 'false');
    cardButton.setAttribute('aria-selected', wasSelected ? 'false' : 'true');
  } else if (wasSelected) {
    cardButton.setAttribute('aria-selected', 'false');
  } else if (selectedDialogUids(dialog).length < max) {
    cardButton.setAttribute('aria-selected', 'true');
  }
  updateConfirmState(dialog);
}

export function restoreSelections(root, selectedByContext) {
  if (!root?.querySelectorAll) return;
  for (const input of root.querySelectorAll('[data-card-select-context][data-card-uid]')) {
    const contextId = input.getAttribute('data-card-select-context');
    const uid = input.getAttribute('data-card-uid');
    input.checked = Boolean(selectedByContext.get(contextId)?.has(uid));
  }
  for (const section of root.querySelectorAll('[data-card-selection]')) {
    updateSelectionSummary(section);
  }
}

export function setupCardChoiceDialogs(root = globalThis.document) {
  if (!root?.addEventListener || !root?.querySelector) return () => {};

  function onClick(event) {
    const opener = event.target.closest?.('[data-card-choice-open]');
    if (opener) {
      const contextId = opener.getAttribute('data-card-choice-open');
      const section = selectionSection(opener);
      openDialog(section?.querySelector?.(`[data-card-choice-dialog="${contextId}"]`) || root.querySelector(`[data-card-choice-dialog="${contextId}"]`));
      return;
    }

    const card = event.target.closest?.('[data-card-choice-card]');
    if (card) {
      chooseCard(card);
      return;
    }

    const confirm = event.target.closest?.('[data-card-choice-confirm]');
    if (confirm) {
      commitDialog(confirm.closest('[data-card-choice-dialog]'));
      return;
    }

    const giveUp = event.target.closest?.('[data-card-choice-give-up]');
    if (giveUp) {
      giveUpDialog(giveUp.closest('[data-card-choice-dialog]'));
      return;
    }

    const cancel = event.target.closest?.('[data-card-choice-cancel]');
    if (cancel) {
      const dialog = cancel.closest('[data-card-choice-dialog]');
      if (dialog?.hasAttribute('data-choice-allow-cancel')) closeDialog(dialog);
    }
  }

  function onKeydown(event) {
    if (event.key !== 'Escape') return;
    const dialog = root.querySelector('[data-card-choice-dialog]:not([hidden])');
    if (dialog?.hasAttribute('data-choice-allow-cancel')) closeDialog(dialog);
  }

  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeydown);
  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeydown);
  };
}
