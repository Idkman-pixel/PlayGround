import {
  HEROES, TELLS, TELL_ORDER, RELICS, CAMP_OPTIONS, WHISPERS, MUTATIONS,
} from './data.js';
import { icon, eyeSigil } from './art.js';
import { Sound } from './audio.js';
import {
  loadState, persist, makeDefaultState, createRun, createEncounter, makePaths,
  livingEnemies, livingHeroes, readyHeroes, frontEnemies, planIntents,
  zoneFor, makeRunSummary, upgradeCost, relicActive, ensureRunShape, SAVE_KEY,
} from './state.js';
import {
  titleScreen, mapScreen, campScreen, eventScreen, resultScreen,
  settingsModal, codexModal, pauseModal, memoryModal, confirmModal,
  victoryModal, hud, roman, esc,
} from './views.js';
import { combatScreen, skillById } from './combat-view.js';

const app = document.getElementById('app');
const modalRoot = document.getElementById('modal-root');
const toastRoot = document.getElementById('toast-root');
const bannerRoot = document.getElementById('banner-root');
const sound = new Sound();

const state = loadState();
if (state.run) ensureRunShape(state.run);

const ui = {
  screen: 'title',
  selectedHeroId: null,
  selectedSkillId: null,
  targetMode: false,
  targetKind: null,
  targetIds: [],
  lanternMode: false,
  lanternHover: null,
  busy: false,
  phase: 'player',
  modalType: null,
  lastSummary: null,
  victoryPending: false,
  motionSupported: typeof window.DeviceOrientationEvent !== 'undefined',
  motionRequested: false,
  motion: { x: 0, y: 0, rawX: 0, rawY: 0, active: false },
  tiltBound: false,
};

sound.enabled = state.settings.sound;
setupBackground();
applySettings();
bindEvents();
setupAsh();
if (state.settings.tilt && ui.motionSupported) startMotion();
render();

// Expose a small debug surface for verification and curious players.
window.__LISTENER__ = {
  state,
  ui,
  get run() { return state.run; },
  start: () => startOrContinue(),
  map: () => { if (state.run) { ui.screen = 'map'; render(); } },
  combat: () => { if (state.run?.encounter) { ui.screen = 'combat'; render(); } },
  finish: (outcome = 'retreat') => finishRun(outcome),
  openSettings: () => openSettings(),
};

/* ==========================================================================
   Shared UI helpers
   ========================================================================== */

function applySettings() {
  sound.enabled = state.settings.sound;
  document.documentElement.classList.toggle('reduced-motion', !!state.settings.reducedMotion);
  if (ui.motionSupported && state.settings.tilt) document.body.classList.add('motion-on');
  else document.body.classList.remove('motion-on');
}

function haptic(pattern = 12) {
  if (!state.settings.haptics) return;
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch { /* haptics are a courtesy */ }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function toast(message, tone = '') {
  if (!toastRoot) return;
  const node = document.createElement('div');
  node.className = `toast ${tone}`;
  node.textContent = message;
  toastRoot.appendChild(node);
  while (toastRoot.children.length > 3) toastRoot.firstElementChild?.remove();
  setTimeout(() => node.remove(), 3400);
}

function showBanner(kicker, title, sub = '', tone = '') {
  if (!bannerRoot) return;
  bannerRoot.innerHTML = `<div class="banner ${tone}">
    <div class="banner-kicker">${esc(kicker)}</div>
    <div class="banner-title">${esc(title)}</div>
    ${sub ? `<div class="banner-sub">${esc(sub)}</div>` : ''}
  </div>`;
  setTimeout(() => { if (bannerRoot.firstElementChild?.classList.contains('banner')) bannerRoot.innerHTML = ''; }, 2700);
}

function openModal(html, type = null) {
  ui.modalType = type;
  if (modalRoot) modalRoot.innerHTML = html;
  document.body.classList.add('modal-open');
}

function refreshModal() {
  if (!ui.modalType) { closeModal(); return; }
  if (ui.modalType === 'settings') openModal(settingsModal(state, ui), 'settings');
  else if (ui.modalType === 'codex') openModal(codexModal(state), 'codex');
  else if (ui.modalType === 'pause') openModal(pauseModal(state), 'pause');
  else if (ui.modalType === 'memory') openModal(memoryModal(state), 'memory');
}

function closeModal() {
  ui.modalType = null;
  if (modalRoot) modalRoot.innerHTML = '';
  document.body.classList.remove('modal-open');
}

function render() {
  applySettings();
  let html = '';
  if (ui.screen === 'title') {
    html = titleScreen(state, ui);
  } else if (ui.screen === 'camp') {
    html = campScreen(state);
  } else if (ui.screen === 'map') {
    if (!state.run) { ui.screen = 'title'; html = titleScreen(state, ui); }
    else html = mapScreen(state, state.run);
  } else if (ui.screen === 'event') {
    if (!state.run?.event) { ui.screen = state.run ? 'map' : 'title'; html = state.run ? mapScreen(state, state.run) : titleScreen(state, ui); }
    else html = eventScreen(state, state.run);
  } else if (ui.screen === 'combat') {
    if (!state.run?.encounter) { ui.screen = state.run ? 'map' : 'title'; html = state.run ? mapScreen(state, state.run) : titleScreen(state, ui); }
    else html = combatScreen(state, state.run, ui);
  } else if (ui.screen === 'result') {
    html = resultScreen(state, ui.lastSummary || { outcome: 'retreat', cycle: 1, nextCycle: 1, ash: 0, totalTells: 0, depth: 1, tells: {}, topTell: null, grudgeLevel: 0 });
  }
  app.innerHTML = html;
  const scene = ui.screen === 'event' ? 'map' : ui.screen;
  document.body.dataset.scene = scene;
  app.dataset.scene = scene;
  if (ui.modalType) refreshModal();
}

function ensureSelectedHero() {
  const run = state.run;
  if (!run?.encounter) return;
  const heroes = run.party;
  const current = heroes.find((hero) => hero.id === ui.selectedHeroId);
  if (current && !current.downed) return;
  const next = readyHeroes(run)[0] || livingHeroes(run)[0] || heroes[0];
  ui.selectedHeroId = next?.id || null;
  ui.selectedSkillId = null;
}

function selectNextReady() {
  const run = state.run;
  if (!run) return;
  const next = readyHeroes(run).find((hero) => hero.id !== ui.selectedHeroId) || readyHeroes(run)[0] || livingHeroes(run)[0];
  ui.selectedHeroId = next?.id || null;
  ui.selectedSkillId = null;
  ui.targetMode = false;
  ui.targetKind = null;
  ui.targetIds = [];
}

/* ==========================================================================
   Navigation and run lifecycle
   ========================================================================== */

function startOrContinue() {
  sound.init();
  sound.setEnabled(state.settings.sound);
  if (state.run) {
    if (state.run.state === 'boss-victory') {
      finishRun('win');
      return;
    }
    ui.screen = ['combat', 'event', 'map'].includes(state.run.state) ? state.run.state : 'map';
    if (ui.screen === 'combat' && !state.run.encounter) ui.screen = 'map';
    if (ui.screen === 'event' && !state.run.event) ui.screen = 'map';
    if (ui.screen === 'combat') {
      state.run.zone = zoneFor(state.run.depth);
      if (state.run.encounter.phase === 'enemy') state.run.encounter.phase = 'player';
      if (!state.run.encounter.log?.length) state.run.encounter.log = ['The dark remembers where you stopped.'];
      if (!state.run.encounter.enemies.some((enemy) => enemy.intent) && livingEnemies(state.run.encounter).length) planIntents(state.run, state.run.encounter);
      ui.phase = state.run.encounter.phase;
      ui.busy = false;
      ensureSelectedHero();
    }
    render();
    toast(state.run ? 'The dark remembers where you stopped.' : 'The threshold is behind you.', 'gold');
    sound.sfx('step');
    return;
  }
  startRun();
}

function startRun() {
  if (state.run) { startOrContinue(); return; }
  state.run = createRun(state);
  ui.screen = 'map';
  ui.lastSummary = null;
  ui.victoryPending = false;
  ui.selectedHeroId = null;
  ui.selectedSkillId = null;
  ui.targetMode = false;
  ui.lanternMode = false;
  closeModal();
  persist(state);
  sound.sfx('step');
  haptic(18);
  render();
  toast('The first step is the loudest. It hears it anyway.', 'gold');
}

function resumeRun() {
  if (!state.run) { ui.screen = 'title'; render(); return; }
  closeModal();
  startOrContinue();
}

function retreatPrompt() {
  if (!state.run) return;
  openModal(confirmModal({
    kicker: 'A DELIBERATE WOUND',
    title: 'Turn back?',
    text: 'You will keep the ash you have gathered, but this descent ends. The Listener still learns from it, and the Cycle still advances. It always does.',
    confirmLabel: 'Turn back',
    action: 'confirm-retreat',
    danger: true,
  }), 'confirm');
}

function finishRun(outcome) {
  if (!state.run) return;
  const run = state.run;
  const summary = makeRunSummary(state, run, outcome);
  state.run = null;
  ui.lastSummary = summary;
  ui.screen = 'result';
  ui.selectedHeroId = null;
  ui.selectedSkillId = null;
  ui.targetMode = false;
  ui.lanternMode = false;
  ui.lanternHover = null;
  ui.victoryPending = false;
  ui.busy = false;
  closeModal();
  persist(state);
  sound.sfx(outcome === 'win' ? 'victory' : 'loss');
  haptic(outcome === 'win' ? [30, 40, 60] : 40);
  render();
}

function advanceDepth() {
  const run = state.run;
  if (!run) return;
  run.depth = Math.min(run.maxDepth || 5, run.depth + 1);
  run.zone = zoneFor(run.depth);
  run.path = null;
  run.event = null;
  run.encounter = null;
  run.state = 'map';
  run.paths = makePaths(run);
  ui.screen = 'map';
  ui.selectedSkillId = null;
  ui.targetMode = false;
  ui.lanternMode = false;
  ui.busy = false;
  persist(state);
  sound.sfx('step');
  render();
  toast(`Depth ${roman(run.depth)} · ${run.zone.name}`, 'gold');
}

/* ==========================================================================
   Map / camp / upgrades
   ========================================================================== */

function choosePath(index) {
  const run = state.run;
  if (!run || ui.screen !== 'map') return;
  const card = run.paths?.[Number(index)];
  if (!card) return;
  sound.init();
  sound.sfx(card.type === 'boss' ? 'learn' : 'select');
  run.path = card;
  if (card.type === 'battle' || card.type === 'elite' || card.type === 'boss') {
    startCombat(card);
  } else {
    beginEvent(card);
  }
}

function beginEvent(card) {
  const run = state.run;
  if (!run) return;
  const rngPool = RELICS.filter((relic) => !run.relics.includes(relic.id));
  const relicOptions = [];
  const pool = rngPool.length ? [...rngPool] : [...RELICS];
  while (relicOptions.length < 3 && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    relicOptions.push(pool.splice(index, 1)[0].id);
  }
  run.event = {
    kind: card.type,
    card,
    eventId: card.eventId,
    phase: 'choice',
    relicOptions,
    resultText: '',
    resultTitle: '',
    resultChips: [],
  };
  run.state = 'event';
  ui.screen = 'event';
  ui.selectedSkillId = null;
  ui.targetMode = false;
  persist(state);
  render();
  sound.sfx('ui');
}

function chooseEventOption(id) {
  const run = state.run;
  const event = run?.event;
  if (!event || event.phase !== 'choice') return;
  const chips = [];
  let text = '';
  let resultTitle = 'IT LEARNS FROM THIS';
  sound.sfx('ui');

  if (event.kind === 'whisper') {
    if (id === 'coinTake') {
      run.ash += 45;
      addStressParty(run, 8);
      chips.push({ icon: 'ash', label: '+45 ash', tone: '' }, { icon: 'spiral', label: 'All stress +8', tone: 'shadow' });
      text = 'The coin dissolves on your tongue. The walls sigh with pleasure.';
    } else if (id === 'coinLeave') {
      addStressParty(run, -5);
      chips.push({ icon: 'spiral', label: 'All stress −5', tone: 'shadow' });
      text = 'You step past. The beating follows you for a while, then stops.';
    } else if (id === 'voiceAnswer') {
      const living = livingHeroes(run);
      const first = living[Math.floor(Math.random() * living.length)];
      const second = living[Math.floor(Math.random() * living.length)] || first;
      if (first) addStress(first, -22);
      if (second && second !== first) addStress(second, 10);
      chips.push({ icon: 'heart', label: `${first?.name || 'Someone'} stress −22`, tone: 'teal' });
      text = 'Moth laughs. Wren does not. The door is gone when you look again.';
    } else if (id === 'voiceShut') {
      run.ash += 10;
      addStressParty(run, 4);
      chips.push({ icon: 'ash', label: '+10 ash', tone: '' }, { icon: 'spiral', label: 'All stress +4', tone: 'shadow' });
      text = 'The nail goes in easily. The screaming does not start until you leave.';
    } else if (id === 'mirrorTrade') {
      const relic = randomRelic(run);
      if (relic) {
        addRelic(run, relic.id);
        chips.push({ icon: relic.icon, label: relic.name, tone: '' });
        text = `It takes your reflection and leaves the ${relic.name}. You do not look down.`;
      } else {
        run.ash += 30;
        chips.push({ icon: 'ash', label: '+30 ash', tone: '' });
        text = 'It takes your reflection and gives you nothing but the weight of being seen.';
      }
      addStressParty(run, 6);
      chips.push({ icon: 'spiral', label: 'All stress +6', tone: 'shadow' });
    } else if (id === 'mirrorBreak') {
      run.ash += 35;
      const living = livingHeroes(run);
      const hero = living[Math.floor(Math.random() * living.length)];
      if (hero) addStress(hero, 14);
      chips.push({ icon: 'ash', label: '+35 ash', tone: '' }, { icon: 'spiral', label: `${hero?.name || 'Someone'} stress +14`, tone: 'shadow' });
      text = 'The saint shatters into a hundred small versions of you. None of them blink.';
    } else if (id === 'bellListen') {
      run.lanternBonus += 1;
      addStressParty(run, 5);
      chips.push({ icon: 'lantern', label: '+1 lantern next fight', tone: 'gold' }, { icon: 'spiral', label: 'All stress +5', tone: 'shadow' });
      text = 'The bell tells you the shape of the next violence. You wish it had not.';
    } else if (id === 'bellCut') {
      run.ash += 20;
      run.nextFightMod = 'weakened';
      chips.push({ icon: 'ash', label: '+20 ash', tone: '' }, { icon: 'skull', label: 'Next fight: −15% enemy health', tone: 'blood' });
      text = 'The thread parts. Somewhere below, something wakes with less of itself.';
    }
  } else if (event.kind === 'camp') {
    if (id === 'tend') {
      for (const hero of run.party) {
        if (!hero.downed) hero.hp = Math.min(hero.maxHp, hero.hp + Math.ceil(hero.maxHp * 0.3));
      }
      chips.push({ icon: 'heart', label: 'Party healed 30%', tone: 'teal' });
      text = 'The needle goes in. The thread comes out red. Everyone pretends to sleep.';
      resultTitle = 'A BREATH, STOLEN';
    } else if (id === 'talk') {
      addStressParty(run, -24);
      chips.push({ icon: 'spiral', label: 'All stress −24', tone: 'shadow' });
      text = 'You tell the true one, the ugly one. The fire listens better than the others do.';
      resultTitle = 'A BREATH, STOLEN';
    } else if (id === 'sharpen') {
      run.nextFightDamage = (run.nextFightDamage || 0) + 2;
      chips.push({ icon: 'sword', label: '+2 damage next fight', tone: '' });
      text = 'You put an edge on everything you can reach. It is not enough. It is something.';
      resultTitle = 'A BREATH, STOLEN';
    }
  }

  event.phase = 'result';
  event.resultText = text;
  event.resultTitle = resultTitle;
  event.resultChips = chips;
  persist(state);
  render();
  haptic(10);
  sound.sfx(id.startsWith('coin') || id === 'mirrorTrade' ? 'mark' : 'heal');
}

function chooseRelic(id) {
  const run = state.run;
  const event = run?.event;
  if (!event || event.phase !== 'choice') return;
  const relic = RELICS.find((entry) => entry.id === id);
  if (!relic) return;
  addRelic(run, id);
  event.phase = 'result';
  event.resultTitle = 'THE GIFT IS TAKEN';
  event.resultText = `${relic.name}. ${relic.desc} The Hollow watches you put it away.`;
  event.resultChips = [{ icon: relic.icon, label: relic.name, tone: '' }];
  persist(state);
  sound.sfx('mark');
  render();
}

function addRelic(run, id) {
  if (!run.relics.includes(id)) run.relics.push(id);
}

function randomRelic(run) {
  const pool = RELICS.filter((relic) => !run.relics.includes(relic.id));
  if (!pool.length) return RELICS[Math.floor(Math.random() * RELICS.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

function leaveEvent() {
  const run = state.run;
  if (!run?.event || run.event.phase !== 'result') return;
  advanceDepth();
}

function buyUpgrade(heroId, stat) {
  if (!HEROES.some((hero) => hero.id === heroId) || !['vigor', 'edge'].includes(stat)) return;
  const level = state.meta.upgrades[heroId]?.[stat] || 0;
  if (level >= 5) return;
  const cost = upgradeCost(stat, level);
  if (state.meta.ash < cost) { toast('Not enough ash.', 'bad'); sound.sfx('stress'); return; }
  state.meta.ash -= cost;
  state.meta.upgrades[heroId][stat] = level + 1;
  persist(state);
  sound.sfx('heal');
  haptic(12);
  render();
  toast(`${stat === 'vigor' ? 'Vigor' : 'Edge'} increased. The body remembers.`, 'teal');
}

/* ==========================================================================
   Event helpers
   ========================================================================== */

function addStress(hero, amount) {
  if (!hero || hero.downed) return;
  const reduction = relicActive(state, 'blackCandle') && amount > 0 ? 0.8 : 1;
  hero.stress = Math.max(0, Math.min(100, hero.stress + Math.round(amount * reduction)));
  if (hero.stress >= 100) {
    hero.stress = 62;
    hero.broken = 1;
    if (ui.screen === 'combat') {
      showBanner('THE MIND GIVES WAY', `${hero.name.toUpperCase()} IS BROKEN`, 'They will lose their next action.', 'learn');
      sound.sfx('break');
      haptic([20, 30, 40]);
    } else {
      toast(`${hero.name} is shaken. Stress carried into the next fight.`, 'bad');
    }
  }
}

function addStressParty(run, amount) {
  for (const hero of run.party) addStress(hero, amount);
}

/* ==========================================================================
   Combat setup and player actions
   ========================================================================== */

function startCombat(card) {
  const run = state.run;
  if (!run) return;
  const enc = createEncounter(run, card.type, state);
  if (run.nextFightMod === 'weakened') {
    for (const enemy of enc.enemies) {
      enemy.maxHp = Math.max(1, Math.round(enemy.maxHp * 0.85));
      enemy.hp = enemy.maxHp;
    }
    run.nextFightMod = null;
  }
  run.encounter = enc;
  run.state = 'combat';
  run.lanternCharges = 1 + (run.relics.includes('waxSeal') ? 1 : 0) + (run.lanternBonus || 0);
  run.lanternBonus = 0;
  run.tempDamage = (run.tempDamage || 0) + (run.nextFightDamage || 0);
  run.nextFightDamage = 0;

  for (const hero of run.party) {
    hero.spent = false;
    hero.block = relicActive(state, 'saltKnot') ? 10 : 0;
    hero.guard = 0;
    hero.taunt = 0;
    hero.mark = 0;
    hero.bleed = 0;
    hero.bleedTurns = 0;
    hero.burn = 0;
    hero.burnTurns = 0;
    hero.broken = 0;
    hero.brokenSkip = 0;
    hero.cds = {};
    if (hero.downed) {
      hero.downed = false;
      hero.hp = Math.max(1, Math.round(hero.maxHp * 0.25));
    }
  }

  ui.screen = 'combat';
  ui.selectedHeroId = readyHeroes(run)[0]?.id || livingHeroes(run)[0]?.id || run.party[0].id;
  ui.selectedSkillId = null;
  ui.targetMode = false;
  ui.targetKind = null;
  ui.targetIds = [];
  ui.lanternMode = false;
  ui.lanternHover = null;
  ui.busy = false;
  ui.phase = 'player';
  ui.victoryPending = false;
  persist(state);
  sound.sfx(card.type === 'boss' ? 'learn' : 'enemy');
  haptic(12);
  render();
}

function selectHero(id) {
  const run = state.run;
  const enc = run?.encounter;
  if (!run || !enc || enc.phase !== 'player' || ui.busy) return;
  const hero = run.party.find((entry) => entry.id === id);
  if (!hero || hero.downed) return;
  if (hero.spent) { toast(`${hero.name} has already committed this round.`, 'bad'); sound.sfx('stress'); return; }
  if (hero.broken > 0 || hero.brokenSkip > 0) { toast(`${hero.name} is still holding themselves together.`, 'bad'); return; }
  ui.selectedHeroId = id;
  ui.selectedSkillId = null;
  ui.targetMode = false;
  ui.targetKind = null;
  ui.targetIds = [];
  ui.lanternMode = false;
  sound.sfx('select');
  render();
}

function selectSkill(skillId) {
  const run = state.run;
  const enc = run?.encounter;
  if (!run || !enc || enc.phase !== 'player' || ui.busy) return;
  const hero = run.party.find((entry) => entry.id === ui.selectedHeroId);
  const skill = skillById(hero, skillId);
  if (!hero || !skill) return;
  if (hero.spent || hero.downed || hero.broken > 0 || hero.brokenSkip > 0) return;
  if ((hero.cds[skill.id] || 0) > 0) { toast(`${skill.name} is still gathering.`, 'bad'); return; }
  ui.lanternMode = false;
  if (ui.selectedSkillId === skillId) {
    ui.selectedSkillId = null;
    ui.targetMode = false;
    ui.targetKind = null;
    ui.targetIds = [];
    render();
    return;
  }

  if (skill.target === 'self' || skill.target === 'party' || skill.target === 'allEnemies') {
    ui.selectedSkillId = skill.id;
    ui.targetMode = false;
    render();
    useSkill(hero.id, skill.id, null);
    return;
  }

  const targets = targetsForSkill(hero, skill);
  if (!targets.length) { toast('There is no valid target.', 'bad'); return; }
  ui.selectedSkillId = skill.id;
  ui.targetMode = true;
  ui.targetKind = skill.target === 'ally' ? 'hero' : 'enemy';
  ui.targetIds = targets;
  sound.sfx('target');
  haptic(6);
  render();
}

function targetsForSkill(hero, skill) {
  const run = state.run;
  const enc = run?.encounter;
  if (!enc) return [];
  if (skill.target === 'front') return frontEnemies(enc, 1).map((enemy) => enemy.uid);
  if (skill.target === 'front2') return frontEnemies(enc, 2).map((enemy) => enemy.uid);
  if (skill.target === 'any') return livingEnemies(enc).map((enemy) => enemy.uid);
  if (skill.target === 'allEnemies') return livingEnemies(enc).map((enemy) => enemy.uid);
  if (skill.target === 'ally') return livingHeroes(run).map((entry) => entry.id);
  if (skill.target === 'self') return [hero.id];
  if (skill.target === 'party') return livingHeroes(run).map((entry) => entry.id);
  return [];
}

function handleTarget(kind, id) {
  const run = state.run;
  const enc = run?.encounter;
  if (!run || !enc || enc.phase !== 'player' || ui.busy) return;
  if (ui.lanternMode) {
    if (kind === 'enemy') applyLantern(id);
    return;
  }
  if (!ui.targetMode || !ui.targetIds.includes(id)) return;
  const skillId = ui.selectedSkillId;
  const heroId = ui.selectedHeroId;
  if (!skillId || !heroId) return;
  useSkill(heroId, skillId, id);
}

async function useSkill(heroId, skillId, targetId) {
  const run = state.run;
  const enc = run?.encounter;
  if (!run || !enc || enc.phase !== 'player' || ui.busy) return;
  const hero = run.party.find((entry) => entry.id === heroId);
  const skill = skillById(hero, skillId);
  if (!hero || !skill || hero.spent || hero.downed || hero.broken > 0 || hero.brokenSkip > 0) return;
  if ((hero.cds[skill.id] || 0) > 0) return;

  const targets = resolveSkillTargets(hero, skill, targetId);
  if (!targets.length) {
    toast('The dark offers no opening.', 'bad');
    return;
  }

  ui.busy = true;
  ui.targetMode = false;
  ui.targetKind = null;
  ui.targetIds = [];
  ui.selectedSkillId = null;
  helperClearLantern();
  hero.spent = true;
  if (skill.cd) hero.cds[skill.id] = skill.cd;

  const flashes = [];
  const logs = [];
  let crit = false;

  if (skill.dmg) {
    const enemies = targets.filter((target) => enc.enemies.includes(target) && !target.dead);
    for (const enemy of enemies) {
      const result = computePlayerDamage(run, enc, hero, skill, enemy);
      crit = crit || result.crit;
      const hit = damageEnemy(run, enc, hero, enemy, result.damage, result.crit);
      flashes.push(...hit.flashes);
      logs.push(hit.log);
      if (!enemy.dead) {
        if (skill.mark) {
          enemy.mark = Math.max(enemy.mark, skill.mark);
          flashes.push({ id: enemy.uid, type: 'mark', text: 'MARKED', tone: 'mark' });
        }
        if (skill.burn) {
          enemy.burn = Math.max(enemy.burn, skill.burn);
          enemy.burnTurns = Math.max(enemy.burnTurns || 0, skill.burnTurns || 2);
          flashes.push({ id: enemy.uid, type: 'damage', text: `BURN ${skill.burn}`, tone: 'burn' });
        }
        if (skill.poison) {
          enemy.poison = Math.max(enemy.poison, skill.poison);
          enemy.poisonTurns = Math.max(enemy.poisonTurns || 0, skill.poisonTurns || 3);
          flashes.push({ id: enemy.uid, type: 'damage', text: `ROT ${skill.poison}`, tone: 'burn' });
        }
        if (skill.stun && Math.random() < skill.stun) {
          enemy.stun = 1;
          flashes.push({ id: enemy.uid, type: 'mark', text: 'STUNNED', tone: 'mark' });
          logs.push(`${enemy.name} reels, briefly unable to answer.`);
        }
      }
    }
  }

  if (skill.heal) {
    const healTargets = skill.target === 'party'
      ? livingHeroes(run)
      : targets.filter((target) => target && target.maxHp);
    const base = Array.isArray(skill.heal) ? randInt(skill.heal[0], skill.heal[1]) : skill.heal;
    for (const target of healTargets) {
      if (!target || target.downed) continue;
      const amount = Math.round(base * (relicActive(state, 'redThread') ? 1.3 : 1));
      const healed = healHero(target, amount);
      if (healed > 0) {
        flashes.push({ id: target.id, type: 'heal', text: `+${healed}`, tone: 'heal' });
        logs.push(`${hero.name} restores ${healed} health to ${target.name}.`);
      }
      if (skill.cleanse) {
        target.bleed = 0;
        target.burn = 0;
        target.bleedTurns = 0;
        target.burnTurns = 0;
      }
      if (skill.guard) target.guard = Math.max(target.guard, skill.guard);
    }
  }

  if (skill.guard && !skill.heal) {
    for (const target of targets) {
      if (!target || !target.maxHp) continue;
      target.guard = Math.max(target.guard, skill.guard);
      flashes.push({ id: target.id, type: 'mark', text: 'GUARDED', tone: 'block' });
      logs.push(`${hero.name} sets a ward over ${target.name}.`);
    }
  }

  if (skill.block) {
    hero.block += skill.block;
    flashes.push({ id: hero.id, type: 'block', text: `+${skill.block} BLOCK`, tone: 'block' });
    logs.push(`${hero.name} takes the weight. +${skill.block} block.`);
  }

  if (skill.taunt) {
    hero.taunt = Math.max(hero.taunt, skill.taunt);
    for (const enemy of livingEnemies(enc)) {
      if (enemy.intent && enemy.intent.targetMode !== 'all') {
        enemy.intent.targetIds = [hero.id];
        enemy.intent.label = hero.name.toUpperCase();
      }
    }
    logs.push(`${hero.name} rings the bell. Every eye turns toward them.`);
    flashes.push({ id: hero.id, type: 'mark', text: 'TAUNTING', tone: 'block' });
  }

  if (skill.selfHeal) {
    const healed = healHero(hero, skill.selfHeal);
    if (healed > 0) {
      flashes.push({ id: hero.id, type: 'heal', text: `+${healed}`, tone: 'heal' });
      logs.push(`${hero.name} drinks a little borrowed warmth. +${healed} health.`);
    }
  }

  if (skill.stress) {
    for (const target of targets) {
      if (!target || !run.party.includes(target) || target.downed) continue;
      addStress(target, skill.stress);
      flashes.push({ id: target.id, type: 'stress', text: `${skill.stress < 0 ? '−' : '+'}${Math.abs(skill.stress)} STRESS`, tone: 'stress' });
    }
  }

  if (skill.selfStress) {
    addStress(hero, skill.selfStress);
    flashes.push({ id: hero.id, type: 'stress', text: `${skill.selfStress < 0 ? '−' : '+'}${Math.abs(skill.selfStress)} STRESS`, tone: 'stress' });
  }

  const learnedTell = recordTell(run, enc, skill.tell);

  if (logs.length) {
    enc.log.unshift(`${hero.name} uses ${skill.name}. ${logs[0]}`);
  } else {
    enc.log.unshift(`${hero.name} uses ${skill.name}.`);
  }

  const allDead = livingEnemies(enc).length === 0;
  if (allDead) {
    enc.phase = 'over';
    ui.phase = 'over';
  } else {
    selectNextReady();
  }

  const soundName = crit ? 'crit' : skill.dmg ? 'hit' : skill.heal || skill.selfHeal ? 'heal' : skill.stress ? 'stress' : 'block';
  sound.sfx(soundName);
  haptic(crit ? [15, 25, 30] : 12);
  persist(state);
  render();
  animateFlashes(flashes);

  if (learnedTell) {
    showBanner('THE LISTENER LEARNS', `${TELLS[learnedTell].name.toUpperCase()} IS KNOWN`, `Your ${TELLS[learnedTell].name.toLowerCase()} techniques will meet resistance here.`, 'learn');
    sound.sfx('learn');
    haptic([20, 25, 35]);
  }

  if (allDead) {
    completeVictory(enc);
    return;
  }

  await sleep(260);
  ui.busy = false;
}

function resolveSkillTargets(hero, skill, targetId) {
  const run = state.run;
  const enc = run?.encounter;
  if (!enc) return [];
  if (skill.target === 'allEnemies') return livingEnemies(enc);
  if (skill.target === 'front') return frontEnemies(enc, 1);
  if (skill.target === 'front2') return frontEnemies(enc, 2);
  if (skill.target === 'party') return livingHeroes(run);
  if (skill.target === 'self') return [hero];
  if (targetId && skill.target === 'ally') {
    const target = run.party.find((entry) => entry.id === targetId);
    return target && !target.downed ? [target] : [];
  }
  if (targetId && (skill.target === 'any' || skill.target === 'front' || skill.target === 'front2')) {
    const enemy = enc.enemies.find((entry) => entry.uid === targetId && !entry.dead);
    return enemy ? [enemy] : [];
  }
  return [];
}

function computePlayerDamage(run, enc, hero, skill, enemy) {
  let value = randInt(skill.dmg[0], skill.dmg[1]);
  value += hero.edge + run.tempDamage + (relicActive(state, 'gildedNail') ? 2 : 0);
  const critChance = 0.1 + (relicActive(state, 'boneDie') ? 0.12 : 0);
  const crit = Math.random() < critChance;
  if (crit) value = Math.round(value * 1.65);
  if (enemy.mark > 0) value = Math.round(value * 1.3);
  if (enemy.exposed > 0) value = Math.round(value * 1.3);
  const bossWarded = enemy.boss && livingEnemies(enc).some((other) => other !== enemy && other.defId === 'echo');
  if (bossWarded) value = Math.round(value * 0.55);
  let resist = (state.meta.grudges[skill.tell] || 0) * 0.055;
  if (enc.learned[skill.tell]) resist += 0.2;
  if (enemy.affinity === skill.tell) resist += 0.35;
  resist = Math.min(0.72, resist);
  value = Math.round(value * (1 - resist));
  value = Math.max(1, value - enemy.armor * 2);
  return { damage: value, crit };
}

function damageEnemy(run, enc, hero, enemy, amount, crit) {
  const flashes = [];
  let left = Math.max(1, Math.round(amount));
  let blocked = 0;
  if (enemy.block > 0) {
    blocked = Math.min(enemy.block, left);
    enemy.block -= blocked;
    left -= blocked;
  }
  enemy.hp = Math.max(0, enemy.hp - left);
  let log = `${hero.name} cuts ${enemy.name} for ${amount}${blocked ? ` (${blocked} blocked)` : ''}.`;
  flashes.push({ id: enemy.uid, type: 'damage', text: `${crit ? 'CRIT ' : '−'}${amount}`, tone: crit ? 'crit' : 'damage' });
  if (blocked) flashes.push({ id: enemy.uid, type: 'block', text: `${blocked} BLOCK`, tone: 'block' });
  if (enemy.hp <= 0 && !enemy.dead) {
    enemy.dead = true;
    enemy.block = 0;
    enemy.intent = null;
    log = `${enemy.name} comes apart. ${hero.name} takes ${amount}.`;
    sound.sfx('death');
    haptic([18, 30]);
  }
  if (!enemy.dead && enemy.reflect > 0 && hero) {
    const reflected = Math.min(enemy.reflect, hero.hp - 1);
    if (reflected > 0) {
      hero.hp -= reflected;
      flashes.push({ id: hero.id, type: 'damage', text: `−${reflected}`, tone: 'damage' });
      log += ' A thorn in its memory answers.';
    }
  }
  return { flashes, log };
}

function healHero(hero, amount) {
  const before = hero.hp;
  hero.hp = Math.min(hero.maxHp, hero.hp + Math.max(0, Math.round(amount)));
  return hero.hp - before;
}

function recordTell(run, enc, tell) {
  run.tells[tell] = (run.tells[tell] || 0) + 1;
  enc.tellUses[tell] = (enc.tellUses[tell] || 0) + 1;
  if (enc.tellUses[tell] >= 3 && !enc.learned[tell]) {
    enc.learned[tell] = true;
    return tell;
  }
  return null;
}

function animateFlashes(flashes) {
  for (const flash of flashes) {
    if (!flash || !flash.id) continue;
    const card = app.querySelector(`[data-unit="${flash.id}"]`);
    if (!card) continue;
    const typeClass = flash.type === 'heal' ? 'flash-heal' : flash.type === 'stress' ? 'flash-stress' : flash.type === 'mark' ? 'flash-mark' : 'flash-hit';
    card.classList.remove('flash-hit', 'flash-heal', 'flash-stress', 'flash-mark');
    void card.offsetWidth;
    card.classList.add(typeClass);
    if (flash.type === 'damage' && card.classList.contains('enemy-card')) {
      const slash = document.createElement('span');
      slash.className = 'hit-slash';
      card.appendChild(slash);
      setTimeout(() => slash.remove(), 400);
    }
    const float = document.createElement('span');
    float.className = `float-text ${flash.tone || flash.type}`;
    float.textContent = flash.text;
    card.appendChild(float);
    setTimeout(() => float.remove(), 950);
  }
}

function helperClearLantern() {
  ui.lanternMode = false;
  ui.lanternHover = null;
}


/* ==========================================================================
   Enemy turn, statuses and round transitions
   ========================================================================== */

async function endTurn() {
  const run = state.run;
  const enc = run?.encounter;
  if (!run || !enc || enc.phase !== 'player' || ui.busy) return;

  ui.busy = true;
  helperClearLantern();
  ui.selectedSkillId = null;
  ui.targetMode = false;
  ui.targetKind = null;
  ui.targetIds = [];
  enc.phase = 'enemy';
  ui.phase = 'enemy';
  persist(state);
  render();
  sound.sfx('enemy');
  await sleep(380);

  for (const enemy of livingEnemies(enc)) {
    if (enc.phase === 'over') break;
    if (!enemy.intent) continue;
    const result = executeEnemyIntent(run, enc, enemy);
    if (!result) continue;
    if (result.log) enc.log.unshift(result.log);
    ensureSelectedHero();
    render();
    animateFlashes(result.flashes);
    haptic(8);
    await sleep(560);
    if (livingHeroes(run).length === 0) {
      await defeatSequence();
      return;
    }
  }

  if (enc.phase !== 'over') {
    const tickFlashes = tickCombatStatuses(run, enc);
    if (tickFlashes.length) {
      render();
      animateFlashes(tickFlashes);
      haptic(8);
      await sleep(420);
    }
  }

  if (livingHeroes(run).length === 0) {
    await defeatSequence();
    return;
  }
  if (livingEnemies(enc).length === 0) {
    enc.phase = 'over';
    ui.phase = 'over';
    render();
    await completeVictory(enc);
    return;
  }

  startPlayerRound(run, enc);
  ui.busy = false;
  persist(state);
  render();
  sound.sfx('step');
}

function executeEnemyIntent(run, enc, enemy) {
  const intent = enemy.intent;
  if (!intent) return null;
  const flashes = [];

  if (intent.kind === 'stunned' || enemy.stun > 0) {
    enemy.stun = Math.max(0, (enemy.stun || 0) - 1);
    enemy.intent = null;
    return { flashes: [], log: `${enemy.name} cannot find its mouth. The moment passes.` };
  }

  if (intent.kind === 'heal') {
    const amount = Math.max(0, intent.heal || 10);
    const before = enemy.hp;
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + amount);
    enemy.intent = null;
    flashes.push({ id: enemy.uid, type: 'heal', text: `+${enemy.hp - before}`, tone: 'heal' });
    return { flashes, log: `${enemy.name} uses ${intent.name} and knits itself back together.` };
  }

  const heroes = livingHeroes(run);
  let targets = [];
  if (intent.targetMode === 'all') {
    targets = [...heroes];
  } else {
    for (const id of intent.targetIds || []) {
      const hero = run.party.find((entry) => entry.id === id && !entry.downed);
      if (hero && !targets.includes(hero)) targets.push(hero);
    }
    if (!targets.length && heroes.length) targets = [heroes[0]];
  }

  if (!targets.length) {
    enemy.intent = null;
    return { flashes, log: `${enemy.name} reaches for someone who is no longer there.` };
  }

  const logParts = [];
  for (const hero of targets) {
    let damage = intent.dmg ? randInt(intent.dmg[0], intent.dmg[1]) : 0;
    let blocked = 0;
    if (damage > 0 && hero.guard > 0) {
      damage = Math.round(damage * 0.65);
      flashes.push({ id: hero.id, type: 'mark', text: 'GUARD', tone: 'block' });
    }
    if (damage > 0 && hero.block > 0) {
      blocked = Math.min(hero.block, damage);
      hero.block -= blocked;
      damage -= blocked;
      if (blocked > 0) flashes.push({ id: hero.id, type: 'block', text: `${blocked} BLOCK`, tone: 'block' });
    }
    if (damage > 0) {
      hero.hp = Math.max(0, hero.hp - damage);
      flashes.push({ id: hero.id, type: 'damage', text: `−${damage}`, tone: 'damage' });
      logParts.push(`${hero.name} takes ${damage}${blocked ? ` (${blocked} blocked)` : ''}.`);
    } else if (blocked > 0) {
      logParts.push(`${hero.name}'s block holds.`);
    }

    if (hero.hp <= 0) {
      downHero(run, hero);
      flashes.push({ id: hero.id, type: 'mark', text: 'FALLEN', tone: 'damage' });
      logParts.push(`${hero.name} falls.`);
      continue;
    }

    if (intent.stress > 0) {
      addStress(hero, intent.stress);
      flashes.push({ id: hero.id, type: 'stress', text: `+${intent.stress} STRESS`, tone: 'stress' });
      logParts.push(`${hero.name} gains ${intent.stress} stress.`);
    }

    if (intent.bleed > 0) {
      hero.bleed = Math.max(hero.bleed || 0, intent.bleed);
      hero.bleedTurns = Math.max(hero.bleedTurns || 0, 3);
      flashes.push({ id: hero.id, type: 'damage', text: `BLEED ${intent.bleed}`, tone: 'burn' });
      logParts.push(`${hero.name} is bleeding.`);
    }
    if (intent.burn > 0) {
      hero.burn = Math.max(hero.burn || 0, intent.burn);
      hero.burnTurns = Math.max(hero.burnTurns || 0, 2);
      flashes.push({ id: hero.id, type: 'damage', text: `BURN ${intent.burn}`, tone: 'burn' });
      logParts.push(`${hero.name} is burning.`);
    }
  }

  enemy.intent = null;
  return {
    flashes,
    log: `${enemy.name} uses ${intent.name}. ${logParts.slice(0, 2).join(' ')}${logParts.length > 2 ? ` (+${logParts.length - 2} more.)` : ''}`,
  };
}

function downHero(run, hero) {
  if (hero.downed) return;
  hero.downed = true;
  hero.hp = 0;
  hero.block = 0;
  hero.guard = 0;
  hero.taunt = 0;
  hero.mark = 0;
  hero.spent = true;
  hero.broken = 0;
  for (const other of run.party) {
    if (other !== hero && !other.downed) other.stress = Math.min(100, other.stress + 4);
  }
  toast(`${hero.name} falls. The dark leans closer.`, 'bad');
  sound.sfx('death');
}

function killEnemy(enemy) {
  if (enemy.dead) return;
  enemy.dead = true;
  enemy.hp = 0;
  enemy.block = 0;
  enemy.intent = null;
  enemy.stun = 0;
  sound.sfx('death');
}

function tickCombatStatuses(run, enc) {
  const flashes = [];
  const notes = [];

  for (const enemy of enc.enemies) {
    if (enemy.dead) continue;
    if (enemy.burn > 0) {
      const damage = Math.max(1, enemy.burn);
      enemy.hp = Math.max(0, enemy.hp - damage);
      flashes.push({ id: enemy.uid, type: 'damage', text: `−${damage}`, tone: 'burn' });
      notes.push(`${enemy.name} burns for ${damage}.`);
      enemy.burnTurns = Math.max(0, (enemy.burnTurns || 0) - 1);
      if (!enemy.burnTurns) enemy.burn = 0;
    }
    if (enemy.hp <= 0) {
      killEnemy(enemy);
      notes.push(`${enemy.name} is reduced to ash.`);
      continue;
    }
    if (enemy.poison > 0) {
      const damage = Math.max(1, enemy.poison);
      enemy.hp = Math.max(0, enemy.hp - damage);
      flashes.push({ id: enemy.uid, type: 'damage', text: `−${damage}`, tone: 'burn' });
      notes.push(`${enemy.name} rots for ${damage}.`);
      enemy.poisonTurns = Math.max(0, (enemy.poisonTurns || 0) - 1);
      if (!enemy.poisonTurns) enemy.poison = 0;
    }
    if (enemy.hp <= 0) {
      killEnemy(enemy);
      notes.push(`${enemy.name} comes apart.`);
    }
  }

  for (const hero of run.party) {
    if (hero.downed) continue;
    if (hero.bleed > 0) {
      const damage = Math.max(1, hero.bleed);
      hero.hp = Math.max(0, hero.hp - damage);
      flashes.push({ id: hero.id, type: 'damage', text: `−${damage}`, tone: 'burn' });
      notes.push(`${hero.name} bleeds for ${damage}.`);
      hero.bleedTurns = Math.max(0, (hero.bleedTurns || 0) - 1);
      if (!hero.bleedTurns) hero.bleed = 0;
    }
    if (hero.hp <= 0) {
      downHero(run, hero);
      flashes.push({ id: hero.id, type: 'mark', text: 'FALLEN', tone: 'damage' });
      continue;
    }
    if (hero.burn > 0) {
      const damage = Math.max(1, hero.burn);
      hero.hp = Math.max(0, hero.hp - damage);
      flashes.push({ id: hero.id, type: 'damage', text: `−${damage}`, tone: 'burn' });
      notes.push(`${hero.name} burns for ${damage}.`);
      hero.burnTurns = Math.max(0, (hero.burnTurns || 0) - 1);
      if (!hero.burnTurns) hero.burn = 0;
    }
    if (hero.hp <= 0) {
      downHero(run, hero);
      flashes.push({ id: hero.id, type: 'mark', text: 'FALLEN', tone: 'damage' });
    }
  }

  if (notes.length) enc.log.unshift(notes.slice(0, 3).join(' '));
  return flashes;
}

function startPlayerRound(run, enc) {
  enc.round += 1;
  enc.phase = 'player';
  ui.phase = 'player';

  for (const hero of run.party) {
    hero.block = 0;
    hero.guard = Math.max(0, (hero.guard || 0) - 1);
    hero.taunt = Math.max(0, (hero.taunt || 0) - 1);
    hero.mark = Math.max(0, (hero.mark || 0) - 1);
    hero.brokenSkip = 0;
    if (hero.broken > 0) {
      hero.broken = 0;
      hero.spent = true;
      toast(`${hero.name} is still holding themselves together. They lose this round.`, 'bad');
    } else if (!hero.downed) {
      hero.spent = false;
    }
    for (const skillId of Object.keys(hero.cds || {})) {
      hero.cds[skillId] = Math.max(0, (hero.cds[skillId] || 0) - 1);
      if (!hero.cds[skillId]) delete hero.cds[skillId];
    }
  }

  for (const enemy of livingEnemies(enc)) {
    enemy.mark = Math.max(0, (enemy.mark || 0) - 1);
    enemy.exposed = Math.max(0, (enemy.exposed || 0) - 1);
  }

  planIntents(run, enc);
  ensureSelectedHero();
  ui.selectedSkillId = null;
  ui.targetMode = false;
  ui.targetKind = null;
  ui.targetIds = [];
}

async function defeatSequence() {
  if (!state.run) return;
  const enc = state.run.encounter;
  if (enc) enc.phase = 'over';
  ui.phase = 'over';
  render();
  showBanner('THE HOLLOW KEEPS YOU', 'YOUR PARTY FALLS SILENT', 'It will practice your face.', 'learn');
  sound.sfx('loss');
  haptic(40);
  await sleep(1200);
  if (state.run) finishRun('loss');
}

/* ==========================================================================
   Victory
   ========================================================================== */

async function completeVictory(enc) {
  const run = state.run;
  if (!run || ui.victoryPending) return;
  ui.victoryPending = true;
  ui.busy = true;
  enc.phase = 'over';
  ui.phase = 'over';

  const reward = Math.max(0, enc.award || 0);
  run.ash += reward;
  let revived = 0;
  for (const hero of run.party) {
    if (!hero.downed) continue;
    hero.downed = false;
    hero.hp = Math.max(1, Math.round(hero.maxHp * 0.25));
    hero.stress = Math.min(hero.stress, 58);
    hero.spent = false;
    revived += 1;
  }
  if (revived) enc.log.unshift(`The fallen are dragged back to their feet. Depth ${roman(run.depth)} is not done with them.`);

  if (enc.isBoss) {
    run.state = 'boss-victory';
    persist(state);
    openModal(victoryModal(run, reward, true), 'victory');
    sound.sfx('victory');
    haptic([30, 40, 60]);
    return;
  }

  run.depth = Math.min(run.maxDepth || 5, run.depth + 1);
  run.zone = zoneFor(run.depth);
  run.path = null;
  run.event = null;
  run.paths = makePaths(run);
  run.state = 'map';
  enc.log.unshift(`${reward} ash claimed. ${run.depth < (run.maxDepth || 5) ? `Depth ${roman(run.depth)} opens below.` : 'The gate waits below.'}`);
  persist(state);
  openModal(victoryModal(run, reward, false), 'victory');
  sound.sfx('victory');
  haptic([24, 34, 52]);
}

function claimVictory() {
  const run = state.run;
  if (!run) { closeModal(); return; }
  if (run.state === 'boss-victory') {
    closeModal();
    finishRun('win');
    return;
  }
  closeModal();
  run.encounter = null;
  run.path = null;
  run.state = 'map';
  ui.screen = 'map';
  ui.busy = false;
  ui.victoryPending = false;
  ui.selectedHeroId = null;
  ui.selectedSkillId = null;
  ui.targetMode = false;
  ui.targetKind = null;
  ui.targetIds = [];
  helperClearLantern();
  persist(state);
  render();
  sound.sfx('step');
  haptic(12);
  toast(`Depth ${roman(run.depth)} · ${run.zone.name}`, 'gold');
}

/* ==========================================================================
   Lantern and motion
   ========================================================================== */

function toggleLantern() {
  const run = state.run;
  const enc = run?.encounter;
  if (!run || !enc || enc.phase !== 'player' || ui.busy) return;
  if ((run.lanternCharges || 0) <= 0) {
    toast('The lantern is cold. No charges remain.', 'bad');
    sound.sfx('stress');
    return;
  }
  helperClearLantern();
  ui.lanternMode = !ui.lanternMode;
  ui.selectedSkillId = null;
  ui.targetMode = false;
  ui.targetKind = null;
  ui.targetIds = [];
  if (ui.lanternMode) {
    sound.sfx('lantern');
    haptic(8);
  }
  render();
}

function cancelLantern() {
  if (!ui.lanternMode) return;
  helperClearLantern();
  sound.sfx('ui');
  render();
}

function applyLantern(enemyId) {
  const run = state.run;
  const enc = run?.encounter;
  if (!run || !enc || enc.phase !== 'player' || ui.busy || !ui.lanternMode) return;
  if ((run.lanternCharges || 0) <= 0) { helperClearLantern(); render(); return; }
  const enemy = enc.enemies.find((entry) => entry.uid === enemyId && !entry.dead);
  if (!enemy) return;

  run.lanternCharges -= 1;
  enemy.exposed = Math.max(enemy.exposed || 0, 2);
  enc.log.unshift(`${enemy.name} is lit from within. It will take 30% more damage for two rounds.`);
  helperClearLantern();
  ui.selectedSkillId = null;
  persist(state);
  sound.sfx('lantern');
  haptic(12);
  render();
  animateFlashes([{ id: enemy.uid, type: 'mark', text: 'EXPOSED', tone: 'mark' }]);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function startMotion() {
  if (!ui.motionSupported) return;
  if (!ui.tiltBound) {
    window.addEventListener('deviceorientation', onOrientation, true);
    ui.tiltBound = true;
  }
}

function onOrientation(event) {
  if (!state.settings.tilt) return;
  const gamma = Number.isFinite(event.gamma) ? event.gamma : 0;
  const beta = Number.isFinite(event.beta) ? event.beta : 0;
  const targetX = clamp(gamma / 32, -1, 1);
  const targetY = clamp((beta - 42) / 34, -1, 1);
  ui.motion.x = ui.motion.x * 0.78 + targetX * 0.22;
  ui.motion.y = ui.motion.y * 0.78 + targetY * 0.22;
  ui.motion.rawX = gamma;
  ui.motion.rawY = beta;
  ui.motion.active = true;
  document.documentElement.style.setProperty('--tx', ui.motion.x.toFixed(3));
  document.documentElement.style.setProperty('--ty', ui.motion.y.toFixed(3));
  updateReticle();
}

function updateReticle() {
  const reticle = document.getElementById('tilt-reticle');
  if (!reticle) return;
  const xPct = 50 + ui.motion.x * 33;
  const yPct = 39 + ui.motion.y * 23;
  reticle.style.left = `${xPct}%`;
  reticle.style.top = `${yPct}%`;

  if (!ui.lanternMode) {
    if (ui.lanternHover) {
      ui.lanternHover = null;
      document.querySelectorAll('.enemy-card.is-lantern-focus').forEach((card) => card.classList.remove('is-lantern-focus'));
    }
    return;
  }

  const node = document.elementFromPoint((xPct / 100) * window.innerWidth, (yPct / 100) * window.innerHeight);
  const card = node?.closest?.('.enemy-card');
  const enemyId = card?.dataset?.unit || null;
  if (enemyId === ui.lanternHover) return;
  ui.lanternHover = enemyId;
  document.querySelectorAll('.enemy-card').forEach((nodeCard) => {
    nodeCard.classList.toggle('is-lantern-focus', nodeCard.dataset.unit === enemyId);
  });
  const confirm = document.querySelector('[data-action="lantern-confirm"]');
  if (confirm) confirm.disabled = !enemyId;
}

async function toggleTilt() {
  if (!ui.motionSupported) {
    toast('This device does not expose orientation sensors.', 'bad');
    return;
  }
  if (state.settings.tilt) {
    state.settings.tilt = false;
    persist(state);
    applySettings();
    sound.sfx('ui');
    toast('Motion lantern off. Tap targeting remains.', '');
    if (ui.modalType) refreshModal(); else render();
    return;
  }

  let granted = true;
  try {
    const orientation = window.DeviceOrientationEvent;
    const motion = window.DeviceMotionEvent;
    if (orientation && typeof orientation.requestPermission === 'function') {
      granted = (await orientation.requestPermission()) === 'granted';
    } else if (motion && typeof motion.requestPermission === 'function') {
      granted = (await motion.requestPermission()) === 'granted';
    }
  } catch {
    granted = false;
  }
  if (!granted) {
    toast('Motion permission was not granted. Tapping works just as well.', 'bad');
    return;
  }

  state.settings.tilt = true;
  startMotion();
  persist(state);
  applySettings();
  sound.sfx('lantern');
  haptic(10);
  toast('Motion lantern on. Tilt to aim the light.', 'teal');
  if (ui.modalType) refreshModal(); else render();
}

function handleParallax(event) {
  if (state.settings.tilt && ui.motion.active) return;
  if (event.pointerType === 'touch') return;
  const x = clamp((event.clientX / window.innerWidth - 0.5) * 2, -1, 1);
  const y = clamp((event.clientY / window.innerHeight - 0.5) * 2, -1, 1);
  document.documentElement.style.setProperty('--tx', x.toFixed(3));
  document.documentElement.style.setProperty('--ty', y.toFixed(3));
}

/* ==========================================================================
   Settings and save management
   ========================================================================== */

function openSettings() { openModal(settingsModal(state, ui), 'settings'); sound.sfx('ui'); }

function openMemory() { openModal(memoryModal(state), 'memory'); sound.sfx('ui'); }

function openCodex() { openModal(codexModal(state), 'codex'); sound.sfx('ui'); }

function openPause() {
  if (!state.run && ui.screen !== 'combat') { openSettings(); return; }
  openModal(pauseModal(state), 'pause');
  sound.sfx('ui');
}

function toggleSound() {
  state.settings.sound = !state.settings.sound;
  sound.setEnabled(state.settings.sound);
  persist(state);
  if (state.settings.sound) sound.sfx('select');
  if (ui.modalType) refreshModal(); else render();
}

function toggleHaptics() {
  state.settings.haptics = !state.settings.haptics;
  persist(state);
  if (state.settings.haptics) haptic(14);
  if (ui.modalType) refreshModal(); else render();
}

function toggleReducedMotion() {
  state.settings.reducedMotion = !state.settings.reducedMotion;
  persist(state);
  applySettings();
  if (ui.modalType) refreshModal(); else render();
  toast(state.settings.reducedMotion ? 'Motion reduced. The dark holds still.' : 'Motion restored.', 'teal');
}

function resetSavePrompt() {
  openModal(confirmModal({
    kicker: 'A CLEAN MOUTH',
    title: 'Forget everything?',
    text: 'This erases every grudge, every upgrade and every unfinished descent. The Listener will not remember you. It will start learning from nothing.',
    confirmLabel: 'Erase the memory',
    action: 'confirm-reset',
    danger: true,
  }), 'confirm');
}

function abandonPrompt() {
  openModal(confirmModal({
    kicker: 'A DELIBERATE WOUND',
    title: 'Abandon this descent?',
    text: 'You keep the ash gathered so far, but every hero is dragged back to the threshold. The Cycle still advances.',
    confirmLabel: 'Abandon them',
    action: 'confirm-abandon',
    danger: true,
  }), 'confirm');
}

/* ==========================================================================
   Input
   ========================================================================== */

function handleClick(event) {
  const actionEl = event.target.closest('[data-action]');
  if (!actionEl) return;
  const action = actionEl.dataset.action;

  if (action !== 'toggle-sound') sound.init();

  switch (action) {
    case 'start':
      startOrContinue();
      break;
    case 'start-run':
      startOrContinue();
      break;
    case 'camp':
      ui.screen = 'camp';
      closeModal();
      render();
      sound.sfx('step');
      break;
    case 'title':
      closeModal();
      ui.screen = 'title';
      ui.selectedHeroId = null;
      ui.selectedSkillId = null;
      ui.targetMode = false;
      helperClearLantern();
      render();
      sound.sfx('ui');
      break;
    case 'resume-run':
      resumeRun();
      break;
    case 'resume-game':
      closeModal();
      render();
      sound.sfx('ui');
      break;
    case 'pause':
      openPause();
      break;
    case 'settings':
      openSettings();
      break;
    case 'memory':
      openMemory();
      break;
    case 'codex':
      openCodex();
      break;
    case 'close-modal':
      closeModal();
      render();
      sound.sfx('ui');
      break;
    case 'retreat':
      retreatPrompt();
      break;
    case 'confirm-retreat':
      closeModal();
      finishRun('retreat');
      break;
    case 'result-camp':
      ui.screen = 'camp';
      closeModal();
      render();
      sound.sfx('fire');
      break;
    case 'choose-path':
      choosePath(actionEl.dataset.index);
      break;
    case 'event-choice':
      chooseEventOption(actionEl.dataset.id);
      break;
    case 'choose-relic':
      chooseRelic(actionEl.dataset.id);
      break;
    case 'leave-event':
      leaveEvent();
      break;
    case 'buy-upgrade':
      buyUpgrade(actionEl.dataset.hero, actionEl.dataset.stat);
      break;
    case 'select-hero':
      selectHero(actionEl.dataset.id);
      break;
    case 'target':
      handleTarget(actionEl.dataset.kind, actionEl.dataset.id);
      break;
    case 'inspect-enemy':
      inspectEnemy(actionEl.dataset.id);
      break;
    case 'skill':
      selectSkill(actionEl.dataset.id);
      break;
    case 'end-turn':
      endTurn();
      break;
    case 'lantern':
      toggleLantern();
      break;
    case 'lantern-target':
      applyLantern(actionEl.dataset.id);
      break;
    case 'lantern-confirm':
      if (ui.lanternHover) applyLantern(ui.lanternHover);
      break;
    case 'cancel-lantern':
      cancelLantern();
      break;
    case 'claim-victory':
      claimVictory();
      break;
    case 'toggle-sound':
      toggleSound();
      break;
    case 'toggle-haptics':
      toggleHaptics();
      break;
    case 'toggle-tilt':
      toggleTilt();
      break;
    case 'toggle-reduced-motion':
      toggleReducedMotion();
      break;
    case 'reset-save':
      resetSavePrompt();
      break;
    case 'confirm-reset':
      try { localStorage.removeItem(SAVE_KEY); } catch { /* private mode */ }
      window.location.reload();
      break;
    case 'abandon-run':
      abandonPrompt();
      break;
    case 'confirm-abandon':
      closeModal();
      finishRun('retreat');
      break;
    default:
      break;
  }
}

function inspectEnemy(enemyId) {
  const run = state.run;
  const enc = run?.encounter;
  if (!enc) return;
  const enemy = enc.enemies.find((entry) => entry.uid === enemyId);
  if (!enemy) return;
  const bits = [enemy.title];
  if (enemy.mutation) bits.push(enemy.mutation.desc);
  if (enemy.affinity) bits.push(`Warded against ${enemy.affinity} tells.`);
  if (enemy.intent) {
    bits.push(enemy.intent.kind === 'stunned'
      ? 'It has been silenced this round.'
      : `Next: ${enemy.intent.name}${enemy.intent.dmg ? ` (${enemy.intent.dmg[0]}–${enemy.intent.dmg[1]})` : ''}.`);
  }
  toast(bits.join(' · '), enemy.boss ? 'bad' : '');
  sound.sfx('ui');
}

function cycleHero(direction) {
  const run = state.run;
  if (!run?.encounter) return;
  const heroes = livingHeroes(run);
  if (!heroes.length) return;
  const index = heroes.findIndex((hero) => hero.id === ui.selectedHeroId);
  const next = heroes[(index + direction + heroes.length) % heroes.length];
  if (next) selectHero(next.id);
}

function handleKey(event) {
  if (event.key === 'Escape') {
    if (ui.modalType) { closeModal(); render(); }
    else if (ui.screen !== 'title') openPause();
    return;
  }
  if (ui.modalType) return;
  const run = state.run;
  const enc = run?.encounter;
  if (ui.screen !== 'combat' || !enc) return;

  if (event.key === 'ArrowLeft') { event.preventDefault(); cycleHero(-1); return; }
  if (event.key === 'ArrowRight') { event.preventDefault(); cycleHero(1); return; }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (enc.phase === 'player' && !ui.busy) endTurn();
    return;
  }
  if (event.key.toLowerCase() === 'l') { toggleLantern(); return; }
  if (['1', '2', '3'].includes(event.key)) {
    const hero = run.party.find((entry) => entry.id === ui.selectedHeroId);
    const skill = hero?.skills[Number(event.key) - 1];
    if (skill) selectSkill(skill.id);
  }
}

function bindEvents() {
  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKey);
  window.addEventListener('pointermove', handleParallax, { passive: true });
  if (!ui.tiltBound && ui.motionSupported) {
    window.addEventListener('deviceorientation', onOrientation, true);
    ui.tiltBound = true;
  }
}

/* ==========================================================================
   Ambient ash
   ========================================================================== */

function setupBackground() {
  const eye = document.getElementById('bg-eye');
  if (eye) eye.innerHTML = eyeSigil();
}

function setupAsh() {
  const canvas = document.getElementById('ash-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];

  const spawn = (initial = false) => ({
    x: Math.random() * width,
    y: initial ? Math.random() * height : height + 8,
    r: Math.random() * 1.4 + 0.35,
    vy: -(Math.random() * 0.2 + 0.05),
    vx: (Math.random() - 0.5) * 0.16,
    alpha: Math.random() * 0.32 + 0.08,
    twinkle: Math.random() * Math.PI * 2,
  });

  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(clamp(width / 17, 24, 82));
    particles = Array.from({ length: count }, () => spawn(true));
  };

  let last = performance.now();
  const frame = (now) => {
    const delta = Math.min(48, now - last);
    last = now;
    ctx.clearRect(0, 0, width, height);
    const reduced = state.settings.reducedMotion;
    for (const particle of particles) {
      if (!reduced) {
        particle.y += particle.vy * (delta / 16.67);
        particle.x += particle.vx * (delta / 16.67) + Math.sin((now + particle.twinkle * 900) / 2400) * 0.035;
        particle.twinkle += 0.012 * (delta / 16.67);
        if (particle.y < -10) {
          particle.y = height + 8;
          particle.x = Math.random() * width;
        }
        if (particle.x < -10) particle.x = width + 8;
        if (particle.x > width + 10) particle.x = -8;
      }
      const glow = reduced ? 1 : 0.65 + Math.sin(particle.twinkle) * 0.35;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(214, 183, 133, ${(particle.alpha * glow).toFixed(3)})`;
      ctx.fill();
    }
    window.requestAnimationFrame(frame);
  };

  resize();
  window.addEventListener('resize', resize);
  window.requestAnimationFrame(frame);
}
