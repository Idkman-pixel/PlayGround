import {
  HEROES, TELLS, TELL_ORDER, RELICS, PATH_META, CAMP_OPTIONS, ENDINGS,
  HERO_UPGRADES, WHISPERS,
} from './data.js';
import { icon, portrait } from './art.js';
import { campaignPreview, upgradeCost, getRelic } from './state.js';

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

export function roman(value) {
  const n = Math.max(0, Number(value) || 0);
  if (n > 20) return String(n);
  const numerals = [['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]];
  let out = '';
  let left = n;
  for (const [glyph, amount] of numerals) {
    while (left >= amount) { out += glyph; left -= amount; }
  }
  return out || '0';
}

export function titleCase(value) {
  return String(value || '').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function tellChip(tell, extra = '') {
  const def = TELLS[tell];
  if (!def) return '';
  return `<span class="chip ${tell}">${icon(def.icon)}${def.name}${extra ? ` <b>· ${esc(extra)}</b>` : ''}</span>`;
}

export function markIcon(name, cls = '') {
  return `<span class="brand-mark ${cls}">${icon(name)}</span>`;
}

export function brand() {
  return `<div class="brand-lockup">${markIcon('eye')}<span>THE LISTENER BELOW</span></div>`;
}

export function hud(state, { center = '', compact = false, labelSmall = '', labelStrong = '' } = {}) {
  const run = state.run;
  const depth = run?.depth || 1;
  const zone = run?.zone || { name: 'The Threshold' };
  const small = labelSmall || `DEPTH ${roman(depth)} · CYCLE ${roman(run?.cycle || state.meta.runs + 1)}`;
  const strong = labelStrong || zone.name;
  return `<header class="hud">
    <div class="hud-left">
      <button class="icon-btn" data-action="pause" aria-label="Pause and menu">${icon('menu')}</button>
      ${compact ? '' : `<div class="hud-brand">${icon('eye')}<span>LISTENER</span></div><div class="hud-sep"></div>`}
      <div class="depth-label">
        <small>${esc(small)}</small>
        <strong>${esc(strong)}</strong>
      </div>
    </div>
    <div class="hud-center">${center}</div>
    <div class="hud-right">
      <div class="hud-stat" title="Ash carried this descent">${icon('ash')}<b>${run ? run.ash : state.meta.ash}</b></div>
      <button class="icon-btn" data-action="memory" aria-label="The Listener's memory">${icon('ear')}</button>
      <button class="icon-btn ${state.settings.sound ? 'is-on' : ''}" data-action="toggle-sound" aria-label="Toggle sound" aria-pressed="${state.settings.sound}">${icon(state.settings.sound ? 'sound' : 'mute')}</button>
    </div>
  </header>`;
}

export function titleScreen(state, ui) {
  const run = state.run;
  const nextCycle = run ? run.cycle : state.meta.runs + 1;
  const activeGrudges = TELL_ORDER
    .filter((tell) => (state.meta.grudges[tell] || 0) > 0)
    .sort((a, b) => state.meta.grudges[b] - state.meta.grudges[a]);
  const grudgeMarkup = activeGrudges.length
    ? activeGrudges.map((tell) => tellChip(tell, `×${state.meta.grudges[tell]}`)).join('')
    : '<span class="empty">It knows nothing about you yet.</span>';
  const cta = run ? 'Continue Descent' : 'Begin Descent';
  const sub = run
    ? `Depth ${roman(run.depth)} · ${run.party.filter((hero) => !hero.downed).length} still standing`
    : `Cycle ${roman(nextCycle)} · ${state.meta.totalTells} tells remembered`;
  const quote = state.meta.runs === 0
    ? 'Every technique you lean on becomes a weapon it owns.'
    : state.meta.wins > 0
      ? 'It has died every way you know how. It is still taking notes.'
      : 'The dark keeps what you teach it. Descend again.';

  return `<section class="screen screen-title">
    <div class="title-top">
      <div class="brand-lockup">${markIcon('eye')}<span>THE LISTENER BELOW</span></div>
      <div class="title-tools">
        <button class="icon-btn" data-action="settings" aria-label="Settings">${icon('settings')}</button>
        <button class="icon-btn ${state.settings.sound ? 'is-on' : ''}" data-action="toggle-sound" aria-label="Toggle sound" aria-pressed="${state.settings.sound}">${icon(state.settings.sound ? 'sound' : 'mute')}</button>
      </div>
    </div>
    <div class="title-ornament left"></div>
    <div class="title-ornament right"></div>
    <div class="title-main">
      <div class="title-eyebrow">${icon('ear')} A MEMORY-EATING ROGUELIKE ${icon('ear')}</div>
      <div class="title-lockup">
        <span class="title-the">THE</span>
        <span class="title-word">LISTENER</span>
        <span class="title-word below" data-text="BELOW">BELOW</span>
      </div>
      <div class="title-rule">${icon('spark')}</div>
      <p class="title-tagline">It learns you. <span>Then it wears you.</span></p>
      <div class="title-cta">
        <button class="btn btn-primary" data-action="start" aria-label="Start">
          ${icon('gate')}
          <span>${cta}<small>${sub}</small></span>
        </button>
        ${run ? '' : `<button class="btn btn-ghost" data-action="camp">${icon('fire')}THE LAST FIRE</button>`}
        <button class="btn btn-ghost" data-action="codex">${icon('book')}HOW TO PLAY</button>
      </div>
      <div class="title-cycle">
        <span>CYCLE <b>${roman(nextCycle)}</b></span><span class="sep"></span>
        <span>${state.meta.totalTells} TELLS LEARNED</span><span class="sep"></span>
        <span>BEST DEPTH <b>${roman(state.meta.bestDepth || 0)}</b></span>
      </div>
    </div>
    <div class="title-memory">
      <div class="title-memory-head">${icon('ear')} THE LISTENER REMEMBERS <b>${activeGrudges.length ? 'YOUR FAVOURITE WAYS TO HURT IT' : 'NOTHING YET'}</b></div>
      <div class="title-grudges">${grudgeMarkup}</div>
    </div>
    <div class="title-quote">${esc(quote)} <b>— the walls, probably</b></div>
  </section>`;
}

export function railMarkup(run) {
  return `<div class="descent-rail">
    ${[1, 2, 3, 4, 5].map((depth) => {
      const stateClass = depth < run.depth ? 'done' : depth === run.depth ? 'current' : 'future';
      const boss = depth === 5;
      return `<div class="rail-node ${stateClass} ${boss ? 'boss' : ''}">
        <div class="rail-dot">${icon(boss ? 'gate' : depth < run.depth ? 'check' : 'spark')}</div>
        <div class="rail-label">${boss ? 'THE EAR' : `DEPTH ${roman(depth)}`}</div>
      </div>`;
    }).join('')}
  </div>`;
}

export function mapScreen(state, run) {
  const zone = run.zone;
  const paths = run.paths || [];
  const ready = run.party.filter((hero) => !hero.downed);
  return `<section class="screen screen-map">
    ${hud(state, { center: `<div class="ear-label" style="color:var(--gold-3)"><span>THE DESCENT</span><b>${roman(run.depth)} / V</b></div>` })}
    <div class="map-scroll">
      <div class="map-wrap">
        ${railMarkup(run)}
        <div class="map-heading">
          <div class="kicker">CHOOSE YOUR DESCENT</div>
          <h2 class="map-title">${esc(zone.name.split(' ').slice(0, -1).join(' '))} <span>${esc(zone.name.split(' ').slice(-1)[0])}</span></h2>
          <p class="map-sub">${esc(zone.whisper)}</p>
          <div class="map-plan">
            <span class="chip">${icon('heart')}${ready.length}/4 standing</span>
            <span class="chip">${icon('ear')}${state.meta.totalTells} tells remembered</span>
            ${run.tempDamage ? `<span class="chip">${icon('sword')}+${run.tempDamage} blade</span>` : ''}
            ${run.relics.length ? `<span class="chip">${icon('relic')}${run.relics.length} relic${run.relics.length > 1 ? 's' : ''}</span>` : ''}
          </div>
        </div>
        <div class="path-grid">
          ${paths.map((path, index) => pathCard(path, index)).join('')}
        </div>
        <div class="map-foot">
          <p class="map-whisper"><b>“</b> Every path teaches it something. Choose what you can afford to lose. <b>”</b></p>
          <button class="btn btn-ghost btn-small" data-action="retreat">${icon('arrow')}Turn back</button>
        </div>
      </div>
    </div>
  </section>`;
}

function pathCard(path, index) {
  const meta = PATH_META[path.type] || PATH_META.battle;
  const sub = path.sub || path.desc;
  return `<button class="path-card" style="--tone:${path.tone || meta.tone}" data-action="choose-path" data-index="${index}" aria-label="${esc(path.title)} — ${esc(meta.label)}">
    <div class="path-art">
      <span class="path-rune">${path.type === 'boss' ? 'V' : roman(index + 1)}</span>
      <div class="path-sigil">${icon(path.icon || meta.icon)}</div>
    </div>
    <div class="path-body">
      <div class="path-type">${icon(path.icon || meta.icon)} ${esc(meta.label)}</div>
      <h3 class="path-title">${esc(path.title || sub)}</h3>
      <p class="path-desc">${esc(path.desc || '')}</p>
      <div class="path-risk">${icon('eye')}${esc(path.risk || meta.risk)} <b>ENTER ${icon('chevron')}</b></div>
    </div>
    <span class="path-arrow">${icon('arrow')}</span>
  </button>`;
}

export function campScreen(state) {
  const preview = campaignPreview(state);
  const ash = state.meta.ash;
  return `<section class="screen screen-camp">
    ${hud(state, {
      center: `<div class="ear-label" style="color:var(--gold-3)"><span>BETWEEN DESCENTS</span><b>${preview.cycle - 1} COMPLETE</b></div>`,
      labelSmall: `${state.meta.runs} RUN${state.meta.runs === 1 ? '' : 'S'} · CYCLE ${roman(preview.cycle)}`,
      labelStrong: 'The Last Fire',
    })}
    <div class="camp-scroll">
      <div class="camp-wrap">
        <div class="camp-head">
          <div class="camp-title-wrap">
            <div class="kicker">BETWEEN DESCENTS</div>
            <h1 class="camp-title">THE LAST <span>FIRE</span></h1>
            <p class="camp-sub">The Hollow is still down there, rehearsing. Spend what you carried back. It will not make you ready, only less easy to predict.</p>
          </div>
          <div class="camp-balance">${icon('ash')}<div><small>ASH TO SPEND</small><b>${ash}</b></div></div>
        </div>
        <div class="camp-layout">
          <div class="roster-list">
            ${HEROES.map((heroDef) => rosterCard(state, heroDef)).join('')}
            <div class="camp-foot">
              <p>The fire will not last. Neither will you.</p>
              <button class="btn btn-ghost btn-small" data-action="title">${icon('arrow')}Threshold</button>
            </div>
          </div>
          <aside class="memory-card">
            <div class="memory-card-head">
              <div class="memory-eye">${icon('ear')}</div>
              <div><small>PERMANENT ADAPTATION</small><b>The Listener Remembers</b></div>
            </div>
            <p class="memory-copy">Across <b>${state.meta.runs} descent${state.meta.runs === 1 ? '' : 's'}</b>, it has swallowed <b>${state.meta.totalTells} tells</b>. The techniques you repeat become its favourite defences.</p>
            <div class="grudges">
              <div class="grudges-title">GRUDGES · DAMAGE RESISTANCE</div>
              ${grudgeRows(state, 5)}
            </div>
            <div class="cycle-preview">
              <h4>CYCLE ${roman(preview.cycle)} WILL BRING</h4>
              <p>Enemies <b>+${preview.hp}% health</b>, <b>+${preview.dmg}% damage</b>.${preview.mutations.length ? ` Active mutations: <b>${preview.mutations.map((mutation) => mutation.name).join(', ')}</b>.` : ''} ${preview.nextMutation ? `<span class="danger-tag">“${preview.nextMutation.name}” awakens at cycle ${roman(preview.nextMutation.minCycle)}.</span>` : ''}</p>
            </div>
            <div class="camp-actions">
              <button class="btn btn-primary" data-action="start-run">${icon('gate')}Descend Into Cycle ${roman(preview.cycle)}</button>
              ${state.run ? `<button class="btn btn-ghost btn-small" data-action="resume-run">${icon('arrow')}Resume the descent</button>` : ''}
            </div>
          </aside>
        </div>
      </div>
    </div>
  </section>`;
}

function rosterCard(state, heroDef) {
  const up = state.meta.upgrades[heroDef.id] || { vigor: 0, edge: 0 };
  const maxHp = heroDef.maxHp + up.vigor * 6;
  const vignorCost = upgradeCost('vigor', up.vigor);
  const edgeCost = upgradeCost('edge', up.edge);
  const maxedV = up.vigor >= 5;
  const maxedE = up.edge >= 5;
  return `<div class="roster-card" style="--hero-tone:${heroDef.color}">
    <div class="roster-portrait">${portrait(heroDef.art)}</div>
    <div class="roster-info">
      <div class="roster-name"><b>${esc(heroDef.name)}</b><span>${esc(heroDef.role)}</span></div>
      <div class="roster-stats">
        <span>${icon('heart')}<b>${maxHp}</b> HP</span>
        <span>${icon('sword')}<b>+${up.edge}</b> EDGE</span>
        <span>${icon('shield')}<b>${up.vigor}</b> VIGOR</span>
      </div>
      <div class="roster-levels">
        ${[0, 1, 2, 3, 4].map((i) => `<span class="level-pip ${i < up.vigor + up.edge ? 'on' : ''}"></span>`).join('')}
      </div>
    </div>
    <div class="roster-upgrades">
      <button class="upgrade-btn" data-action="buy-upgrade" data-hero="${heroDef.id}" data-stat="vigor" ${maxedV || state.meta.ash < vignorCost ? 'disabled' : ''}>
        ${icon('heart')}<span>${maxedV ? 'Vigor maxed' : 'Vigor +6 HP'}</span><b>${maxedV ? '—' : `${vignorCost} ash`}</b>
      </button>
      <button class="upgrade-btn" data-action="buy-upgrade" data-hero="${heroDef.id}" data-stat="edge" ${maxedE || state.meta.ash < edgeCost ? 'disabled' : ''}>
        ${icon('sword')}<span>${maxedE ? 'Edge maxed' : 'Edge +1 dmg'}</span><b>${maxedE ? '—' : `${edgeCost} ash`}</b>
      </button>
    </div>
  </div>`;
}

export function grudgeRows(state, limit = 5) {
  const active = TELL_ORDER
    .filter((tell) => (state.meta.grudges[tell] || 0) > 0)
    .sort((a, b) => state.meta.grudges[b] - state.meta.grudges[a])
    .slice(0, limit);
  if (!active.length) return `<div class="memory-empty">It has no favourites yet. Give it time.</div>`;
  return active.map((tell) => {
    const level = state.meta.grudges[tell] || 0;
    return `<div class="grude-row" style="color:${TELLS[tell].color}">
      ${icon(TELLS[tell].icon)}
      <span>${TELLS[tell].name} resistance <b>${Math.round(level * 5.5)}%</b></span>
      <span class="pips">${[0, 1, 2, 3, 4].map((i) => `<i class="grude-pip ${i < level ? 'on' : ''}"></i>`).join('')}</span>
    </div>`;
  }).join('');
}

export function memoryModal(state) {
  const active = TELL_ORDER.filter((tell) => (state.meta.grudges[tell] || 0) > 0);
  return modalShell({
    kicker: 'PERMANENT ADAPTATION',
    title: 'The Listener’s Memory',
    body: `<p class="modal-copy">Every skill belongs to a <b class="gold">Tell</b>. Use one three times in a single fight and the Hollow learns it. At the end of every descent, your most-used Tell becomes a permanent grudge.</p>
      <div class="grudges" style="margin-top:16px">
        <div class="grudges-title">ACTIVE GRUDGES</div>
        ${grudgeRows(state, 5)}
      </div>
      <div class="cycle-preview" style="margin-top:18px">
        <h4>THE ARITHMETIC OF ATTENTION</h4>
        <p>${state.meta.runs} descents · ${state.meta.totalTells} tells swallowed · ${state.meta.wins} victories · ${state.meta.losses} losses · best depth ${roman(state.meta.bestDepth || 0)}.</p>
        <p style="margin-top:6px">The next descent is <b>Cycle ${roman(state.meta.runs + 1)}</b>. It will be harder. It always is.</p>
      </div>`,
    actions: `<button class="btn btn-primary" data-action="close-modal">Close</button>`,
  });
}

/* ==========================================================================
   Event / room
   ========================================================================== */

export function eventScreen(state, run) {
  const event = run.event;
  if (!event) return mapScreen(state, run);
  const card = event.card || {};
  const isResult = event.phase === 'result';
  const isRelic = event.kind === 'reliquary';
  const isCamp = event.kind === 'camp';
  const tone = card.tone || (isCamp ? '#e0a55f' : isRelic ? '#e4c17a' : '#a58bd8');
  const eventDef = event.kind === 'whisper' ? WHISPERS.find((entry) => entry.id === event.eventId) : null;
  const title = isResult
    ? (event.resultTitle || (event.kind === 'whisper' ? 'THE WALL EXHALES' : isCamp ? 'A BREATH, STOLEN' : 'THE GIFT IS TAKEN'))
    : (event.kind === 'whisper' ? eventDef?.title : isCamp ? 'A Moment’s Grace' : 'Choose a Relic');
  const text = isResult
    ? event.resultText
    : (event.kind === 'whisper' ? eventDef?.text : isCamp
      ? 'The fire is small and does not belong to you. Choose how to spend its warmth.'
      : 'Three relics on a table of bone. Take one. The Hollow will remember the shape of your want.');
  const iconName = isResult ? 'spark' : (card.icon || (isCamp ? 'fire' : isRelic ? 'relic' : 'eye'));
  const kicker = isResult ? 'IT LEARNS FROM THIS' : (isCamp ? 'RESPITE' : isRelic ? 'RELICS' : 'WHISPER');

  let choices = '';
  if (isResult) {
    choices = `<div class="event-result">
      <div class="result-line">${(event.resultChips || []).map((chip) => `<span class="chip ${chip.tone || ''}">${icon(chip.icon || 'spark')}${esc(chip.label)}</span>`).join('')}</div>
      <button class="btn btn-primary btn-wide" data-action="leave-event">${icon('arrow')}Continue the descent</button>
    </div>`;
  } else if (event.kind === 'whisper') {
    choices = `<div class="event-options">
      ${(eventDef?.options || []).map((option) => `<button class="choice-card" data-action="event-choice" data-id="${option.effect}">
        <span class="choice-icon">${icon(iconForEffect(option.effect))}</span>
        <span class="choice-body"><b>${esc(option.label)}</b><small>${esc(option.hint)}</small></span>
        ${icon('chevron')}
      </button>`).join('')}
    </div>`;
  } else if (isCamp) {
    choices = `<div class="event-options">
      ${CAMP_OPTIONS.map((option) => `<button class="choice-card" data-action="event-choice" data-id="${option.id}">
        <span class="choice-icon">${icon(option.icon)}</span>
        <span class="choice-body"><b>${esc(option.label)}</b><small>${esc(option.hint)}</small></span>
        ${icon('chevron')}
      </button>`).join('')}
    </div>`;
  } else if (isRelic) {
    choices = `<div class="event-relics">
      ${(event.relicOptions || []).map((relicId) => {
        const relic = getRelic(relicId);
        if (!relic) return '';
        return `<button class="relic-choice" style="--relic-tone:${relic.color}" data-action="choose-relic" data-id="${relic.id}">
          ${icon(relic.icon)}<b>${esc(relic.name)}</b><small>${esc(relic.desc)}</small>
        </button>`;
      }).join('')}
    </div>`;
  }

  return `<section class="screen screen-event" style="--tone:${tone}">
    ${hud(state, { center: `<div class="ear-label" style="color:${tone}"><span>DEPTH ${roman(run.depth)}</span><b>${esc(run.zone.name).toUpperCase()}</b></div>` })}
    <div class="event-scroll">
      <div class="event-panel">
        <div class="event-sigil">${icon(iconName)}</div>
        <div class="event-kicker">${esc(kicker)}</div>
        ${title === eventDef?.title && !isResult ? `<h2 class="event-title">${esc(title)}</h2>` : `<h2 class="event-title">${esc(title)}</h2>`}
        <p class="event-text">${esc(text || '')}</p>
        ${choices}
      </div>
    </div>
  </section>`;
}

function iconForEffect(effect) {
  if (effect?.startsWith('coin')) return 'coin';
  if (effect?.startsWith('voice')) return 'mouth';
  if (effect?.startsWith('mirror')) return 'mirror';
  if (effect?.startsWith('bell')) return 'bell';
  return 'eye';
}

/* ==========================================================================
   Run result
   ========================================================================== */

export function resultScreen(state, summary) {
  const ending = ENDINGS[summary.outcome] || ENDINGS.loss;
  const tone = summary.outcome === 'win' ? '#e4c17a' : summary.outcome === 'retreat' ? '#9fb5c9' : '#c85358';
  const grudgeDef = summary.topTell ? TELLS[summary.topTell] : null;
  const topTells = TELL_ORDER
    .map((tell) => ({ tell, count: summary.tells[tell] || 0 }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return `<section class="screen screen-result" style="--result-tone:${tone};--grudge-tone:${grudgeDef?.color || tone}">
    ${hud(state, {
      center: `<div class="ear-label" style="color:${tone}"><span>DESCENT COMPLETE</span><b>CYCLE ${roman(summary.cycle)}</b></div>`,
      labelSmall: `DEPTH ${roman(summary.depth)} · CYCLE ${roman(summary.cycle)}`,
      labelStrong: 'The Threshold',
    })}
    <div class="result-scroll">
      <div class="result-wrap">
        <div class="result-kicker">${esc(ending.kicker)}</div>
        <h1 class="result-title">${esc(ending.title)}</h1>
        <p class="result-sub">${esc(ending.text)}</p>
        <div class="result-stats">
          <div class="result-stat"><small>ASH CARRIED</small><b>${icon('ash')}${summary.ash}</b></div>
          <div class="result-stat"><small>TELLS GIVEN</small><b>${summary.totalTells}</b></div>
          <div class="result-stat"><small>DEPTH REACHED</small><b>${roman(summary.depth)} / V</b></div>
          <div class="result-stat"><small>NEXT CYCLE</small><b>${roman(summary.nextCycle)}</b></div>
        </div>
        ${topTells.length ? `<div class="result-grudge">
          ${icon(grudgeDef?.icon || 'ear')}
          <div><small>THE LISTENER LEARNED</small><b>${grudgeDef ? `${grudgeDef.name} · GRUDGE ${summary.grudgeLevel}` : 'Nothing new'}</b></div>
          <p>${grudgeDef ? `Your ${grudgeDef.name.toLowerCase()} techniques now meet ${Math.round(summary.grudgeLevel * 5.5)}% resistance. Cycle ${roman(summary.nextCycle)} begins harder.` : 'It watched, but you gave it nothing to repeat.'}</p>
        </div>` : ''}
        <div class="result-actions">
          <button class="btn btn-primary" data-action="result-camp">${icon('fire')}Return to the Last Fire</button>
          <button class="btn btn-ghost" data-action="title">${icon('arrow')}The Threshold</button>
        </div>
      </div>
    </div>
  </section>`;
}

/* ==========================================================================
   Modals
   ========================================================================== */

export function modalShell({ kicker = '', title = '', body = '', actions = '', wide = false, closable = true, tone = '' }) {
  return `<div class="modal-veil">
    <div class="modal-sheet ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}" ${tone ? `style="--tone:${tone}"` : ''}>
      ${closable ? `<button class="icon-btn modal-close" data-action="close-modal" aria-label="Close">${icon('close')}</button>` : ''}
      <div class="modal-head">
        ${kicker ? `<div class="modal-kicker">${esc(kicker)}</div>` : ''}
        <h2 class="modal-title">${title}</h2>
      </div>
      ${body}
      ${actions ? `<div class="modal-actions">${actions}</div>` : ''}
    </div>
  </div>`;
}

export function settingsModal(state, ui) {
  const supported = ui.motionSupported;
  return modalShell({
    kicker: 'THE APPARATUS',
    title: 'Settings',
    body: `<div class="settings-list">
      <div class="setting-row">
        <div class="setting-icon">${icon('sound')}</div>
        <div class="setting-text"><b>Sound</b><small>A low drone, small bells, and the sound of things breaking.</small></div>
        <button class="toggle ${state.settings.sound ? 'is-on' : ''}" data-action="toggle-sound" aria-label="Toggle sound" aria-pressed="${state.settings.sound}"></button>
      </div>
      <div class="setting-row">
        <div class="setting-icon">${icon('spark')}</div>
        <div class="setting-text"><b>Haptics</b><small>Short pulses on wounds, stress and revelations.</small></div>
        <button class="toggle ${state.settings.haptics ? 'is-on' : ''}" data-action="toggle-haptics" aria-label="Toggle haptics" aria-pressed="${state.settings.haptics}"></button>
      </div>
      <div class="setting-row">
        <div class="setting-icon">${icon('motion')}</div>
        <div class="setting-text"><b>Motion lantern</b><small>${supported ? (state.settings.tilt ? 'On. Tilt to steer the lantern’s aim in battle.' : 'Off. Optional tilt aiming. Tap remains fully playable.') : 'This device does not expose orientation sensors.'}</small></div>
        <button class="toggle ${state.settings.tilt ? 'is-on' : ''} ${supported ? '' : 'is-disabled'}" data-action="toggle-tilt" aria-label="Toggle motion lantern" aria-pressed="${state.settings.tilt}" ${supported ? '' : 'disabled'}></button>
      </div>
      <div class="setting-row">
        <div class="setting-icon">${icon('eye')}</div>
        <div class="setting-text"><b>Reduce motion</b><small>Quieter dust, still sigils, fewer flourishes.</small></div>
        <button class="toggle ${state.settings.reducedMotion ? 'is-on' : ''}" data-action="toggle-reduced-motion" aria-label="Toggle reduced motion" aria-pressed="${state.settings.reducedMotion}"></button>
      </div>
    </div>
    <p class="modal-note">${icon('phone', 'icon')} Built for phone and tablet. Portrait or landscape. Tap targets are oversized on purpose.</p>`,
    actions: `${state.run ? `<button class="btn btn-danger" data-action="abandon-run">${icon('skull')}Abandon descent</button>` : ''}
      <button class="btn btn-ghost" data-action="reset-save">${icon('trash')}Reset memory</button>
      <button class="btn btn-primary" data-action="close-modal">Return</button>`,
  });
}

export function codexModal(state) {
  return modalShell({
    kicker: 'A FIELD GUIDE FOR THE DOOMED',
    title: 'How to Descend',
    wide: true,
    body: `<div class="codex-section">
      <div class="codex-icon">${icon('gate')}</div>
      <div><h4>Choose the path</h4><p>Each depth offers three rooms. <b>Skirmishes</b> bleed you. <b>Camps</b> heal. <b>Reliquaries</b> give relics. <b>Whispers</b> offer trades you will regret. Reach the fifth depth and face <em>The Listener</em>.</p></div>
    </div>
    <div class="codex-section">
      <div class="codex-icon">${icon('sword')}</div>
      <div><h4>Fight with taps</h4><p>Tap a hero, tap a <b>skill</b>, then tap an <b>enemy or ally</b>. Each hero acts once per round. When everyone has committed, tap <em>End Turn</em> and the Hollow answers. Guard, mark, poison, burn and stress all matter.</p></div>
    </div>
    <div class="codex-section">
      <div class="codex-icon">${icon('ear')}</div>
      <div><h4>It learns by repetition</h4><p>Every skill carries a <b>Tell</b>. Use the same Tell three times in one fight and the Listener learns it, reducing that damage. At the end of every descent, your most-used Tell becomes a permanent <em>grudge</em>. Keep changing your approach.</p>
        <div class="codex-tells">${TELL_ORDER.map((tell) => tellChip(tell)).join('')}</div>
      </div>
    </div>
    <div class="codex-section">
      <div class="codex-icon">${icon('spark')}</div>
      <div><h4>Every run is harder</h4><p>Each descent advances the <b>Cycle</b> — even a retreat or a loss. Enemies gain health, damage and mutations. Your ash buys permanent hero upgrades, but the ledger always tilts toward the dark.</p></div>
    </div>
    <div class="codex-section">
      <div class="codex-icon">${icon('motion')}</div>
      <div><h4>Optional motion lantern</h4><p>Enable device tilt in Settings or below. In battle, tap the Lantern and tilt to steer its aim; tap an enemy to reveal a weakness. On iOS, permission is requested only when you press the button. Without tilt, simply tap a target.</p>
        <button class="btn btn-ghost btn-small" data-action="toggle-tilt" style="margin-top:9px">${icon('motion')}${state.settings.tilt ? 'Motion lantern is on' : 'Enable motion lantern'}</button>
      </div>
    </div>`,
    actions: `<button class="btn btn-primary" data-action="close-modal">I understand enough</button>`,
  });
}

export function pauseModal(state) {
  const inRun = !!state.run;
  return modalShell({
    kicker: inRun ? `CYCLE ${roman(state.run.cycle)} · DEPTH ${roman(state.run.depth)}` : 'AT THE THRESHOLD',
    title: inRun ? 'The Descent Waits' : 'Paused',
    body: `<p class="modal-copy">${inRun ? 'The Hollow does not pause. It only gives you a moment to imagine turning back.' : 'The dark is patient. Take your time.'}</p>
      ${inRun ? `<div class="event-options" style="margin-top:16px">
        <button class="choice-card" data-action="resume-game"><span class="choice-icon">${icon('arrow')}</span><span class="choice-body"><b>Resume</b><small>Return to the descent.</small></span>${icon('chevron')}</button>
        <button class="choice-card" data-action="retreat"><span class="choice-icon">${icon('gate')}</span><span class="choice-body"><b>Turn back</b><small>End this descent. The cycle still advances.</small></span>${icon('chevron')}</button>
      </div>` : ''}`,
    actions: `<button class="btn btn-ghost" data-action="codex">${icon('book')}How to play</button>
      <button class="btn btn-ghost" data-action="settings">${icon('settings')}Settings</button>
      <button class="btn btn-primary" data-action="${inRun ? 'resume-game' : 'close-modal'}">${inRun ? 'Resume' : 'Return'}</button>`,
  });
}

export function confirmModal({ kicker = 'A POINT OF NO RETURN', title = 'Are you certain?', text = '', confirmLabel = 'Yes', action = '', danger = true }) {
  return modalShell({
    kicker,
    title,
    body: `<p class="modal-copy">${text}</p>`,
    actions: `<button class="btn btn-ghost" data-action="close-modal">Not yet</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="${action}">${esc(confirmLabel)}</button>`,
  });
}

export function victoryModal(run, reward, isBoss = false) {
  const title = isBoss ? 'THE LISTENER FALLS SILENT' : 'THEY DO NOT GET UP';
  return modalShell({
    kicker: isBoss ? 'THE EAR BENEATH' : 'THE DARK THINS',
    title,
    tone: '#e4c17a',
    closable: false,
    body: `<p class="modal-copy">${isBoss
      ? 'You cut the last ear from the world. Somewhere below, a smaller silence begins taking notes.'
      : 'The bodies come apart into old memories. You take what you can carry and leave before they remember how to stand.'}</p>
      <div class="result-grudge" style="margin-top:17px;margin-bottom:4px">
        ${icon('ash')}
        <div><small>CLAIMED</small><b>${reward} ASH</b></div>
        <p>${isBoss ? 'The way out is behind you.' : run.depth < 5 ? `Depth ${roman(run.depth)} opens below.` : 'The gate waits below.'}</p>
      </div>`,
    actions: `<button class="btn btn-primary" data-action="claim-victory">${icon(isBoss ? 'gate' : 'arrow')}${isBoss ? 'Climb into the light' : 'Take the stair'}</button>`,
  });
}

