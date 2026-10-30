import { TELLS } from './data.js';
import { icon, portrait } from './art.js';
import { heroDefinition, livingEnemies, livingHeroes } from './state.js';
import { esc, hud, roman } from './views.js';

function pct(value, max) {
  return Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
}

function intentIcon(kind) {
  if (kind === 'stress') return 'spiral';
  if (kind === 'heal') return 'heart';
  if (kind === 'stunned') return 'mute';
  return 'sword';
}

function statusChipsForEnemy(enemy, enc) {
  const chips = [];
  if (enemy.mutation) chips.push(`<span class="status-chip bad" title="${esc(enemy.mutation.desc)}">${icon('skull')}${esc(enemy.mutation.name)}</span>`);
  if (enemy.affinity) chips.push(`<span class="status-chip mark">${icon(TELLS[enemy.affinity].icon)}${TELLS[enemy.affinity].name}-ward</span>`);
  if (enemy.boss && livingEnemies(enc).some((other) => other.uid !== enemy.uid && other.defId === 'echo')) {
    chips.push(`<span class="status-chip good">${icon('shield')}Warded</span>`);
  }
  if (enemy.block > 0) chips.push(`<span class="status-chip block">${icon('shield')}${enemy.block}</span>`);
  if (enemy.mark > 0) chips.push(`<span class="status-chip mark">${icon('eye')}Marked ${enemy.mark}</span>`);
  if (enemy.exposed > 0) chips.push(`<span class="status-chip mark">${icon('lantern')}Exposed</span>`);
  if (enemy.burn > 0) chips.push(`<span class="status-chip bad">${icon('flame')}Burn ${enemy.burn}</span>`);
  if (enemy.poison > 0) chips.push(`<span class="status-chip bad">${icon('drop')}Rot ${enemy.poison}</span>`);
  if (enemy.stun > 0) chips.push(`<span class="status-chip good">${icon('mute')}Stunned</span>`);
  if (enc.learned && Object.keys(enc.learned).length) {
    const learned = Object.keys(enc.learned)[0];
    chips.push(`<span class="status-chip bad">${icon('ear')}${TELLS[learned].name} learned</span>`);
  }
  return chips.join('');
}

function statusChipsForHero(hero, state) {
  const chips = [];
  if (hero.broken > 0) chips.push(`<span class="status-chip bad">${icon('skull')}Broken</span>`);
  if (hero.block > 0) chips.push(`<span class="status-chip block">${icon('shield')}${hero.block}</span>`);
  if (hero.guard > 0) chips.push(`<span class="status-chip good">${icon('shieldCheck')}Guarded ${hero.guard}</span>`);
  if (hero.taunt > 0) chips.push(`<span class="status-chip good">${icon('bell')}Taunt ${hero.taunt}</span>`);
  if (hero.mark > 0) chips.push(`<span class="status-chip mark">${icon('eye')}Marked</span>`);
  if (hero.bleed > 0) chips.push(`<span class="status-chip bad">${icon('drop')}Bleed ${hero.bleed}</span>`);
  if (hero.burn > 0) chips.push(`<span class="status-chip bad">${icon('flame')}Burn ${hero.burn}</span>`);
  return chips.join('');
}

function enemyCard(enemy, enc, ui) {
  const canTarget = ui.lanternMode || (ui.targetMode && ui.targetKind === 'enemy' && ui.targetIds?.includes(enemy.uid));
  const intent = enemy.intent;
  const intentKind = intent?.kind || 'damage';
  const intentLabel = intent
    ? (intent.kind === 'stunned' ? 'Silenced' : intent.name)
    : 'Listening';
  const intentTarget = intent?.label && intent.label !== '—' ? intent.label : '';
  const damage = intent?.dmg ? `${intent.dmg[0]}–${intent.dmg[1]}` : (intent?.stress ? `+${intent.stress} stress` : '');
  const isFocus = ui.lanternHover === enemy.uid;
  const action = canTarget ? (ui.lanternMode ? 'lantern-target' : 'target') : 'inspect-enemy';

  return `<button class="unit enemy-card ${enemy.dead ? 'is-dead' : ''} ${canTarget ? 'is-targetable' : ''} ${isFocus ? 'is-lantern-focus' : ''}" data-unit="${enemy.uid}" data-action="${action}" data-kind="enemy" data-id="${enemy.uid}" aria-label="${esc(enemy.name)}${enemy.dead ? ' silenced' : ''}">
    <div class="unit-art">
      ${portrait(enemy.art)}
      <span class="unit-rank">${roman(enemy.rank)}</span>
      <span class="unit-level">${enemy.boss ? 'BOSS' : enemy.elite ? 'ELITE' : enemy.defId === 'echo' ? 'ECHO' : 'HUSK'}</span>
      ${canTarget ? '<span class="target-label">TARGET</span>' : ''}
    </div>
    <div class="unit-body">
      <div class="unit-heading">
        <span class="unit-name">${esc(enemy.name)}</span>
      </div>
      <div class="unit-title">${esc(enemy.title)}</div>
      <div class="unit-bars">
        <div class="mini-bar enemy-hp"><i style="width:${pct(enemy.hp, enemy.maxHp)}%"></i></div>
        <div class="bar-meta"><span>HP <b>${Math.max(0, enemy.hp)}</b>/${enemy.maxHp}</span><span>ARMOR <b>${enemy.armor}</b></span></div>
      </div>
      <div class="enemy-intent ${intentKind} ${intent?.kind === 'stunned' ? 'unknown' : ''}" title="${esc(intentLabel)} ${esc(intentTarget)} ${damage ? `· ${esc(damage)}` : ''}">
        ${icon(intentIcon(intentKind))}<span>${esc(intentLabel)}</span><b>${damage ? esc(damage) : esc(intentTarget)}</b>
      </div>
      <div class="status-row">${statusChipsForEnemy(enemy, enc)}</div>
    </div>
  </button>`;
}

function heroCard(hero, ui) {
  const canTarget = ui.targetMode && ui.targetKind === 'hero' && ui.targetIds?.includes(hero.id);
  const selected = ui.selectedHeroId === hero.id;
  const spent = hero.spent || hero.broken > 0;
  return `<button class="unit hero-card ${hero.downed ? 'is-downed' : ''} ${selected ? 'is-selected' : ''} ${spent && !hero.downed ? 'is-spent' : ''} ${hero.broken > 0 ? 'is-broken' : ''} ${canTarget ? 'is-targetable' : ''}" data-unit="${hero.id}" data-action="${canTarget ? 'target' : 'select-hero'}" data-kind="hero" data-id="${hero.id}" data-hero="${hero.id}" aria-label="${esc(hero.name)} — ${hero.hp} of ${hero.maxHp} health, ${hero.stress} stress" ${hero.downed ? 'aria-disabled="true"' : ''}>
    <div class="unit-art">
      ${portrait(hero.art)}
      <span class="unit-rank">${roman(hero.rank)}</span>
      ${canTarget ? '<span class="target-label">GUARD</span>' : ''}
    </div>
    <div class="unit-body">
      <div class="unit-heading">
        <span class="unit-name">${esc(hero.name)}</span>
      </div>
      <div class="unit-title">${esc(hero.role)}</div>
      <div class="unit-bars">
        <div class="mini-bar hp"><i style="width:${pct(hero.hp, hero.maxHp)}%"></i></div>
        <div class="bar-meta"><span>HP <b>${hero.hp}</b>/${hero.maxHp}</span><span class="stress-label">STRESS <b>${hero.stress}</b></span></div>
        <div class="mini-bar stress"><i style="width:${pct(hero.stress, 100)}%"></i></div>
      </div>
      <div class="status-row">${statusChipsForHero(hero)}</div>
    </div>
  </button>`;
}

function skillCard(hero, skill, ui) {
  const cd = hero.cds?.[skill.id] || 0;
  const disabled = ui.phase !== 'player' || hero.spent || hero.downed || cd > 0 || hero.broken > 0;
  const selected = ui.selectedSkillId === skill.id;
  const tell = TELLS[skill.tell];
  const meta = skillMeta(skill);
  return `<button class="skill-card ${selected ? 'is-selected' : ''} ${disabled && !selected ? 'is-disabled' : ''}" style="--tell-color:${tell.color}" data-action="skill" data-id="${skill.id}" ${disabled ? 'aria-disabled="true"' : ''}>
    <div class="skill-top">
      <span class="skill-icon">${icon(skill.icon)}</span>
      <span class="skill-name">${esc(skill.name)}</span>
    </div>
    <div class="skill-meta"><b>${esc(tell.name)}</b><span class="dot"></span>${esc(meta)}</div>
    <div class="skill-desc">${esc(skill.desc)}</div>
    <span class="skill-tell">${esc(skill.targetLabel || '')}</span>
    ${cd > 0 ? `<span class="skill-cd"><b>${cd}</b>round${cd > 1 ? 's' : ''}</span>` : ''}
  </button>`;
}

function skillMeta(skill) {
  if (skill.dmg) {
    const base = `${skill.dmg[0]}–${skill.dmg[1]}`;
    if (skill.target === 'allEnemies') return `All foes · ${base}`;
    if (skill.target === 'front2') return `Front two · ${base}`;
    if (skill.target === 'any') return `Any foe · ${base}`;
    if (skill.target === 'front') return `Front · ${base}`;
    return `${skill.targetLabel} · ${base}`;
  }
  if (skill.heal) {
    const value = Array.isArray(skill.heal) ? `${skill.heal[0]}–${skill.heal[1]}` : skill.heal;
    return `${skill.target === 'party' ? 'Party' : 'Ally'} · heal ${value}`;
  }
  if (skill.stress) return `Ally · ${skill.stress < 0 ? '−' : '+'}${Math.abs(skill.stress)} stress`;
  return skill.targetLabel || '';
}

export function combatScreen(state, run, ui) {
  const enc = run.encounter;
  if (!enc) return '';
  const heroes = run.party;
  const aliveHeroes = livingHeroes(run);
  const selected = heroes.find((hero) => hero.id === ui.selectedHeroId) || aliveHeroes.find((hero) => !hero.spent) || aliveHeroes[0] || heroes[0];
  const selectedDef = selected ? heroDefinition(selected.id) : null;
  const phase = enc.phase;
  const ready = heroes.filter((hero) => !hero.downed && !hero.spent && hero.broken <= 0).length;
  const tellUse = Math.max(0, ...Object.values(enc.tellUses || {}));
  const learnedList = Object.keys(enc.learned || {});
  const learned = learnedList[0] || null;
  const earState = learned ? 'learned' : '';
  const feed = enc.log?.[0] || 'The dark waits.';
  const canLantern = phase === 'player' && run.lanternCharges > 0;
  const skills = selectedDef?.skills || [];
  const hint = ui.lanternMode
    ? 'Lantern lit. Choose a foe to expose.'
    : ui.targetMode
      ? `Choose a target · ${selectedDef?.skills.find((skill) => skill.id === ui.selectedSkillId)?.targetLabel || ''}`
      : phase === 'enemy'
        ? 'The Hollow is answering.'
        : ready === 0
          ? 'Everyone is committed. End the turn.'
          : 'Tap a skill, then a target.';

  return `<section class="screen screen-combat ${ui.lanternMode ? 'lantern-mode' : ''} ${state.settings.tilt ? 'motion-on' : ''}">
    ${hud(state, {
      compact: true,
      center: `<div class="ear-meter ${earState}">
        <div class="ear-icon">${icon(learned ? 'ear' : 'eye')}</div>
        <div class="ear-body">
          <div class="ear-label"><span>LISTENER’S EAR</span><b>${learned ? `${TELLS[learned].name.toUpperCase()} LEARNED` : `${tellUse}/3`}</b></div>
          <div class="ear-track">${[0, 1, 2].map((i) => `<span class="ear-seg ${i < tellUse ? 'on' : ''} ${learned ? 'hot' : ''}"></span>`).join('')}</div>
        </div>
      </div>`,
    })}
    <div class="combat-main">
      <div class="combat-stage">
        <div class="battlefield">
          <div class="unit-line enemy-line">
            ${enc.enemies.map((enemy) => enemyCard(enemy, enc, ui)).join('')}
          </div>
          <div class="round-axis">
            <div class="round-medallion"><small>ROUND</small><b>${enc.round}</b></div>
            <span class="phase-label ${phase === 'enemy' ? 'enemy' : ''}">${phase === 'enemy' ? 'IT ANSWERS' : phase === 'over' ? 'SILENCE' : 'YOUR MOVE'}</span>
          </div>
          <div class="unit-line hero-line">
            ${heroes.map((hero) => heroCard(hero, ui)).join('')}
          </div>
        </div>
        <div class="combat-feed">${icon('eye')}<p>${esc(feed)}</p></div>
      </div>
      <footer class="command-dock">
        <div class="dock-inner">
          <div class="focus-line">
            <div class="focus-portrait" style="--hero-tone:${selected?.color || '#d9b570'}">${selected ? portrait(selected.art) : ''}</div>
            <div class="focus-copy">
              <div class="focus-name"><b>${selected ? esc(selected.name) : 'The party'}</b><span style="--hero-tone:${selected?.color || '#d9b570'}">${selected ? esc(selected.role) : 'Waiting'}</span></div>
              <div class="focus-hint ${ui.targetMode || ui.lanternMode ? 'targeting' : phase === 'enemy' ? 'enemy' : ''}">
                ${ui.targetMode || ui.lanternMode ? icon('target') : ''}${esc(hint)}
              </div>
            </div>
            ${selected ? `<div class="focus-hearts">
              <span class="focus-heart">${icon('heart')}<b>${selected.hp}</b></span>
              <span class="focus-heart stress">${icon('spiral')}<b>${selected.stress}</b></span>
              ${selected.block ? `<span class="focus-heart">${icon('shield')}<b>${selected.block}</b></span>` : ''}
            </div>` : ''}
            <div class="dock-tools">
              <button class="lantern-btn ${ui.lanternMode ? 'is-active' : ''}" data-action="lantern" ${canLantern ? '' : 'disabled'} aria-label="Use lantern">
                ${icon('lantern')}LANTERN <small>${run.lanternCharges}</small>
              </button>
              <button class="end-turn-btn ${ready === 0 ? 'is-ready' : ''}" data-action="end-turn" ${phase === 'player' ? '' : 'disabled'}>
                ${icon('arrow')}END TURN<small>${ready} READY</small>
              </button>
            </div>
          </div>
          <div class="skill-row">
            ${selected && !selected.downed ? skills.map((skill) => skillCard(selected, skill, ui)).join('') : `<div class="skill-card is-disabled"><span class="skill-name">No one is standing</span><span class="skill-meta">The dark is patient</span></div>`}
          </div>
        </div>
      </footer>
    </div>
    ${ui.lanternMode ? `<div class="lantern-wash"></div>
      <div class="lantern-hint">
        ${icon('lantern')}<b>Lantern lit.</b> Tap a foe${state.settings.tilt ? ', or tilt to aim' : ''}.
        ${state.settings.tilt ? `<button class="cancel" data-action="lantern-confirm" ${ui.lanternHover ? '' : 'disabled'}>Reveal</button>` : ''}
        <span class="cancel" data-action="cancel-lantern">Cancel</span>
      </div>
      <div id="tilt-reticle"></div>` : ''}
  </section>`;
}

export function skillById(hero, skillId) {
  return hero?.skills.find((skill) => skill.id === skillId);
}
