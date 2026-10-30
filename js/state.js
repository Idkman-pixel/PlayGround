import {
  HEROES, ENEMIES, MUTATIONS, RELICS, PATH_META, BATTLE_TITLES, WHISPERS,
  TELL_ORDER, ZONES, mulberry32, hashSeed, clone,
} from './data.js';

export const SAVE_KEY = 'the-listener-below.save.v1';
export const VERSION = 1;

export function makeDefaultState() {
  return {
    version: VERSION,
    meta: {
      runs: 0,
      wins: 0,
      losses: 0,
      retreats: 0,
      ash: 0,
      totalTells: 0,
      bestDepth: 0,
      grudges: Object.fromEntries(TELL_ORDER.map((tell) => [tell, 0])),
      upgrades: Object.fromEntries(HEROES.map((hero) => [hero.id, { vigor: 0, edge: 0 }])),
      memoryLog: [],
    },
    settings: {
      sound: true,
      haptics: true,
      tilt: false,
      reducedMotion: false,
    },
    run: null,
  };
}

export function loadState() {
  const fallback = makeDefaultState();
  let parsed = null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  if (!parsed || parsed.version !== VERSION) return fallback;
  const state = fallback;
  if (parsed.meta && typeof parsed.meta === 'object') {
    state.meta = { ...state.meta, ...parsed.meta };
    state.meta.grudges = { ...fallback.meta.grudges, ...(parsed.meta.grudges || {}) };
    state.meta.upgrades = { ...fallback.meta.upgrades, ...(parsed.meta.upgrades || {}) };
    for (const hero of HEROES) {
      state.meta.upgrades[hero.id] = { vigor: 0, edge: 0, ...(state.meta.upgrades[hero.id] || {}) };
    }
    if (!Array.isArray(state.meta.memoryLog)) state.meta.memoryLog = [];
  }
  if (parsed.settings && typeof parsed.settings === 'object') {
    state.settings = { ...state.settings, ...parsed.settings };
  }
  if (parsed.run && typeof parsed.run === 'object') {
    state.run = parsed.run;
    ensureRunShape(state.run);
  }
  return state;
}

export function persist(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: VERSION,
      meta: state.meta,
      settings: state.settings,
      run: state.run,
    }));
  } catch {
    // A full private-mode quota should never break the descent.
  }
}

export function ensureRunShape(run) {
  if (!run || typeof run !== 'object') return;
  if (!run.tells) run.tells = Object.fromEntries(TELL_ORDER.map((tell) => [tell, 0]));
  for (const tell of TELL_ORDER) if (typeof run.tells[tell] !== 'number') run.tells[tell] = 0;
  if (!Array.isArray(run.relics)) run.relics = [];
  if (!Array.isArray(run.paths)) run.paths = [];
  if (!Array.isArray(run.party)) run.party = [];
  if (!run.encounter) run.encounter = null;
  if (!run.event) run.event = null;
  if (!run.state) run.state = 'map';
  if (typeof run.ash !== 'number') run.ash = 0;
  if (typeof run.tempDamage !== 'number') run.tempDamage = 0;
  if (typeof run.lanternBonus !== 'number') run.lanternBonus = 0;
  if (!run.zone) run.zone = zoneFor(run.depth || 1);
  if (run.encounter) {
    if (!run.encounter.tellUses) run.encounter.tellUses = Object.fromEntries(TELL_ORDER.map((tell) => [tell, 0]));
    if (!run.encounter.learned) run.encounter.learned = {};
    if (!Array.isArray(run.encounter.log)) run.encounter.log = [];
    if (!Array.isArray(run.encounter.enemies)) run.encounter.enemies = [];
    if (!run.encounter.phase) run.encounter.phase = 'player';
    if (typeof run.encounter.round !== 'number') run.encounter.round = 1;
  }
}

export function zoneFor(depth) {
  return ZONES[Math.min(ZONES.length - 1, Math.max(0, (depth || 1) - 1))];
}

export function heroDefinition(id) {
  return HEROES.find((hero) => hero.id === id);
}

export function upgradeCost(stat, level) {
  const base = stat === 'vigor' ? 32 : 38;
  const step = stat === 'vigor' ? 18 : 22;
  return base + step * level;
}

export function makeHero(id, meta) {
  const def = heroDefinition(id);
  const upgrades = meta.upgrades[id] || { vigor: 0, edge: 0 };
  const maxHp = def.maxHp + upgrades.vigor * 6;
  return {
    id,
    name: def.name,
    epithet: def.epithet,
    role: def.role,
    rank: def.rank,
    color: def.color,
    art: def.art,
    maxHp,
    hp: maxHp,
    baseMaxHp: def.maxHp,
    edge: upgrades.edge,
    vigor: upgrades.vigor,
    stress: 0,
    block: 0,
    guard: 0,
    taunt: 0,
    mark: 0,
    bleed: 0,
    bleedTurns: 0,
    burn: 0,
    burnTurns: 0,
    broken: 0,
    downed: false,
    spent: false,
    cds: {},
    skills: def.skills,
  };
}

export function partyPower(meta) {
  return HEROES.reduce((sum, hero) => {
    const up = meta.upgrades[hero.id] || { vigor: 0, edge: 0 };
    return sum + up.vigor * 6 + up.edge * 4;
  }, 0);
}

export function createRun(state) {
  const cycle = state.meta.runs + 1;
  const seed = (Math.random() * 0xffffffff) >>> 0;
  const run = {
    seed,
    cycle,
    depth: 1,
    maxDepth: 5,
    zone: zoneFor(1),
    state: 'map',
    party: HEROES.map((hero) => makeHero(hero.id, state.meta)),
    ash: 0,
    relics: [],
    tells: Object.fromEntries(TELL_ORDER.map((tell) => [tell, 0])),
    tempDamage: 0,
    lanternBonus: 0,
    paths: [],
    path: null,
    encounter: null,
    event: null,
    startedAt: Date.now(),
    log: ['You step into the dark. It has already heard you.'],
  };
  run.paths = makePaths(run);
  return run;
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

function shuffled(rng, arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function makePaths(run) {
  const depth = run.depth;
  if (depth >= 5) {
    return [{
      id: `boss-${depth}`,
      type: 'boss',
      title: 'The Listener’s Gate',
      desc: 'It has worn every face you brought down here. Now it wants yours.',
      sub: 'No path around. Only through.',
      risk: 'The final ear',
      icon: 'gate',
      tone: PATH_META.boss.tone,
      eventId: null,
    }];
  }

  const rng = mulberry32((run.seed ^ hashSeed(`depth-${depth}`)) >>> 0);
  let types;
  if (depth === 1) {
    types = ['battle', 'whisper', 'reliquary'];
  } else {
    const extras = ['camp', 'reliquary', 'whisper'];
    if (depth >= 3) extras.push('elite');
    const chosen = shuffled(rng, extras).slice(0, 2);
    types = ['battle', ...chosen];
    if (depth >= 3 && !types.includes('elite') && rng() < 0.34) types[2] = 'elite';
  }
  types = shuffled(rng, types);

  return types.map((type, index) => {
    const meta = PATH_META[type];
    let title = '';
    let desc = '';
    let sub = '';
    let eventId = null;

    if (type === 'battle') {
      const entry = pick(rng, BATTLE_TITLES);
      title = entry[0];
      sub = entry[1];
      desc = 'A knot of the Hollow’s attention. Cut it loose before it learns more.';
    } else if (type === 'elite') {
      title = 'The Unnamed';
      sub = 'A saint with no face left to steal.';
      desc = 'A greater memory walks here. It is heavier than the others.';
    } else if (type === 'camp') {
      title = pick(rng, ['A Guttering Fire', 'The Last Warmth', 'A Borrowed Hearth']);
      sub = 'One warm hour. It is not yours.';
      desc = 'Rest, bind wounds, and speak only of things that are still true.';
    } else if (type === 'reliquary') {
      title = pick(rng, ['The Reliquary', 'A Saint’s Rib', 'The Gift Table']);
      sub = 'A gift wrapped in someone else’s hand.';
      desc = 'Take one relic. The Hollow will remember what you chose.';
    } else if (type === 'whisper') {
      const event = pick(rng, WHISPERS);
      eventId = event.id;
      title = event.title;
      sub = 'It knows you can hear.';
      desc = 'A voice in the wall offers a trade. Every answer teaches it something.';
    }

    return {
      id: `${type}-${depth}-${index}-${Math.floor(rng() * 9999)}`,
      type,
      title,
      desc,
      sub,
      risk: meta.risk,
      icon: meta.icon,
      tone: meta.tone,
      eventId,
    };
  });
}

const ENCOUNTER_TABLE = {
  1: [
    ['pilgrim', 'husk'],
    ['hound', 'pilgrim'],
    ['husk', 'hound'],
  ],
  2: [
    ['pilgrim', 'husk', 'widow'],
    ['hound', 'pilgrim', 'husk'],
    ['bellEater', 'husk'],
    ['widow', 'hound', 'pilgrim'],
  ],
  3: [
    ['bellEater', 'widow', 'hound'],
    ['bellEater', 'pilgrim', 'widow'],
    ['theUnnamed', 'husk'],
    ['hound', 'widow', 'pilgrim'],
  ],
  4: [
    ['bellEater', 'widow', 'theUnnamed'],
    ['theUnnamed', 'hound', 'husk'],
    ['bellEater', 'hound', 'widow'],
    ['theUnnamed', 'widow', 'pilgrim'],
  ],
};

const ELITE_TABLE = [
  ['theUnnamed', 'husk', 'pilgrim'],
  ['theUnnamed', 'bellEater', 'widow'],
  ['theUnnamed', 'hound', 'husk'],
];

function attackWithScale(attack, scale) {
  return {
    ...attack,
    dmg: attack.dmg ? attack.dmg.map((value) => Math.max(1, Math.round(value * scale))) : null,
    stress: attack.stress ? Math.max(1, Math.round(attack.stress * Math.min(1.45, scale))) : 0,
  };
}

function applyMutation(enemy, mutation) {
  enemy.mutation = mutation;
  if (mutation.id === 'waxen') enemy.block += 8;
  if (mutation.id === 'hollow') enemy.stressBonus = 4;
  if (mutation.id === 'quick') enemy.damageScale *= 1.2;
  if (mutation.id === 'thorned') enemy.reflect = 3;
  if (mutation.id === 'twinned') {
    enemy.maxHp = Math.round(enemy.maxHp * 1.25);
    enemy.hp = enemy.maxHp;
  }
}

export function createEncounter(run, type, state) {
  const rng = mulberry32((run.seed ^ hashSeed(`encounter-${run.depth}-${type}`)) >>> 0);
  const cycle = run.cycle;
  const depth = run.depth;
  const isBoss = type === 'boss';
  const isElite = type === 'elite';
  const hpScale = (1 + 0.145 * (cycle - 1)) * (1 + 0.055 * (depth - 1)) * (isElite ? 1.08 : 1);
  const dmgScale = (1 + 0.085 * (cycle - 1)) * (1 + 0.025 * (depth - 1));
  const enemies = [];

  if (isBoss) {
    const ranked = [...TELL_ORDER].sort((a, b) => (state.meta.grudges[b] || 0) - (state.meta.grudges[a] || 0));
    const affinities = [ranked[0], ranked[1] || ranked[0]];
    const bossHp = Math.round(ENEMIES.listener.hp * (1 + 0.14 * (cycle - 1)));
    const echoHp = Math.round(ENEMIES.echo.hp * (1 + 0.15 * (cycle - 1)));

    const boss = makeEnemyFromDef('listener', 2, bossHp, dmgScale, run);
    boss.intent = null;
    boss.boss = true;

    const echoA = makeEnemyFromDef('echo', 1, echoHp, dmgScale, run);
    echoA.name = `Echo of ${affinities[0][0].toUpperCase()}${affinities[0].slice(1)}`;
    echoA.title = 'An old version of you';
    echoA.affinity = affinities[0];
    echoA.intent = null;

    const echoB = makeEnemyFromDef('echo', 3, echoHp, dmgScale, run);
    echoB.name = `Echo of ${affinities[1][0].toUpperCase()}${affinities[1].slice(1)}`;
    echoB.title = 'An old version of you';
    echoB.affinity = affinities[1];
    echoB.intent = null;

    enemies.push(echoA, boss, echoB);
  } else {
    const table = isElite ? ELITE_TABLE : (ENCOUNTER_TABLE[depth] || ENCOUNTER_TABLE[4]);
    const template = pick(rng, table);
    template.forEach((defId, index) => {
      const def = ENEMIES[defId];
      const scaledHp = Math.round(def.hp * hpScale * (def.elite ? 1.15 : 1));
      const enemy = makeEnemyFromDef(defId, index + 1, scaledHp, dmgScale, run);
      enemy.intent = null;
      enemies.push(enemy);
    });
  }

  const enc = {
    id: `enc-${run.depth}-${type}-${Math.floor(rng() * 99999)}`,
    type,
    round: 1,
    phase: 'player',
    enemies,
    tellUses: Object.fromEntries(TELL_ORDER.map((tell) => [tell, 0])),
    learned: {},
    log: [],
    award: 0,
    isBoss,
  };

  if (!isBoss) {
    const available = MUTATIONS.filter((mutation) => mutation.minCycle <= cycle);
    const mutationCount = cycle >= 6 && (isElite || rng() < 0.5) ? 2 : (available.length && (isElite || rng() < 0.78) ? 1 : 0);
    const candidates = shuffled(rng, enemies.filter((enemy) => !enemy.boss)).slice(0, mutationCount);
    for (const enemy of candidates) {
      const options = available.filter((mutation) => !enemies.some((other) => other.mutation?.id === mutation.id));
      if (options.length) applyMutation(enemy, pick(rng, options));
    }
  }

  enc.log.unshift(isBoss
    ? 'The gate exhales. Every old version of you turns its head.'
    : 'Tap a skill, then a target. End the turn when you are ready.');
  enc.award = isBoss ? 110 + cycle * 8 : (isElite ? 48 : 23 + depth * 7) + cycle * 2;
  planIntents(run, enc);
  return enc;
}

function makeEnemyFromDef(defId, rank, hp, dmgScale, run) {
  const def = ENEMIES[defId];
  const damageScale = dmgScale;
  return {
    uid: `enemy-${defId}-${rank}`,
    defId,
    name: def.name,
    title: def.title,
    art: def.art,
    rank,
    maxHp: Math.max(1, hp),
    hp: Math.max(1, hp),
    armor: def.armor,
    color: def.color,
    block: 0,
    mark: 0,
    exposed: 0,
    burn: 0,
    burnTurns: 0,
    poison: 0,
    poisonTurns: 0,
    stun: 0,
    dead: false,
    mutation: null,
    affinity: null,
    damageScale,
    stressBonus: 0,
    reflect: 0,
    boss: !!def.boss,
    elite: !!def.elite,
    intent: null,
    attacks: def.attacks.map((attack) => attackWithScale(attack, damageScale)),
    baseAttacks: def.attacks,
    runCycle: run.cycle,
  };
}

export function livingEnemies(enc) {
  if (!enc) return [];
  return enc.enemies.filter((enemy) => !enemy.dead);
}

export function livingHeroes(run) {
  return run.party.filter((hero) => !hero.downed);
}

export function readyHeroes(run) {
  return run.party.filter((hero) => !hero.downed && !hero.spent && hero.broken <= 0);
}

export function frontEnemies(enc, count = 1) {
  return livingEnemies(enc).slice(0, count);
}

export function pickTargetHero(run, mode, rng = Math.random) {
  const heroes = livingHeroes(run);
  if (!heroes.length) return null;
  const taunter = heroes.filter((hero) => hero.taunt > 0).sort((a, b) => b.taunt - a.taunt)[0];
  if (mode !== 'all' && taunter) return taunter;
  if (mode === 'front') return heroes[0];
  if (mode === 'back') return heroes[heroes.length - 1];
  if (mode === 'all') return null;
  return heroes[Math.floor(rng() * heroes.length)];
}

export function planIntents(run, enc) {
  if (!enc) return;
  const heroes = livingHeroes(run);
  if (!heroes.length) return;
  for (const enemy of livingEnemies(enc)) {
    if (enemy.stun > 0) {
      enemy.intent = {
        kind: 'stunned',
        name: 'Silenced',
        targetIds: [],
        label: '—',
        dmg: null,
        stress: 0,
        attackId: 'stunned',
      };
      continue;
    }
    const totalWeight = enemy.attacks.reduce((sum, attack) => sum + (attack.weight || 1), 0);
    let roll = Math.random() * totalWeight;
    let attack = enemy.attacks[0];
    for (const candidate of enemy.attacks) {
      roll -= candidate.weight || 1;
      if (roll <= 0) { attack = candidate; break; }
    }

    let targetIds = [];
    let label = '';
    if (attack.target === 'all') {
      targetIds = heroes.map((hero) => hero.id);
      label = 'ALL';
    } else if (attack.target === 'self') {
      targetIds = [enemy.uid];
      label = 'SELF';
    } else {
      const target = pickTargetHero(run, attack.target);
      if (target) {
        targetIds = [target.id];
        label = target.name.toUpperCase();
      }
    }

    const damage = attack.dmg
      ? attack.dmg.map((value) => Math.max(1, Math.round(value)))
      : null;
    const stress = attack.stress ? Math.round(attack.stress + (enemy.stressBonus || 0)) : 0;
    enemy.intent = {
      attackId: attack.id,
      name: attack.name,
      kind: attack.kind,
      dmg: damage,
      stress,
      burn: attack.burn || 0,
      bleed: attack.bleed || 0,
      heal: attack.heal || 0,
      targetIds,
      label,
      targetMode: attack.target,
    };
  }
}

export function campaignPreview(state) {
  const cycle = state.meta.runs + 1;
  const hp = 1 + 0.145 * (cycle - 1);
  const dmg = 1 + 0.085 * (cycle - 1);
  const unlocked = MUTATIONS.filter((mutation) => mutation.minCycle <= cycle);
  return {
    cycle,
    hp: Math.round((hp - 1) * 100),
    dmg: Math.round((dmg - 1) * 100),
    mutations: unlocked,
    nextMutation: MUTATIONS.find((mutation) => mutation.minCycle > cycle),
  };
}

export function makeRunSummary(state, run, outcome) {
  const totalTells = TELL_ORDER.reduce((sum, tell) => sum + (run.tells[tell] || 0), 0);
  let topTell = null;
  let topCount = 0;
  for (const tell of TELL_ORDER) {
    const count = run.tells[tell] || 0;
    if (count > topCount) { topTell = tell; topCount = count; }
  }
  if (!topTell && totalTells > 0) topTell = TELL_ORDER[0];
  if (topTell) state.meta.grudges[topTell] = (state.meta.grudges[topTell] || 0) + 1;

  state.meta.runs += 1;
  state.meta.ash += run.ash;
  state.meta.totalTells += totalTells;
  state.meta.bestDepth = Math.max(state.meta.bestDepth || 0, run.depth);
  if (outcome === 'win') state.meta.wins += 1;
  else if (outcome === 'loss') state.meta.losses += 1;
  else state.meta.retreats += 1;

  const summary = {
    outcome,
    cycle: run.cycle,
    nextCycle: state.meta.runs + 1,
    ash: run.ash,
    depth: run.depth,
    tells: clone(run.tells),
    totalTells,
    topTell,
    topCount,
    grudgeLevel: topTell ? state.meta.grudges[topTell] : 0,
    duration: Math.max(1, Math.round((Date.now() - (run.startedAt || Date.now())) / 60000)),
    relics: run.relics.map((id) => RELICS.find((relic) => relic.id === id)).filter(Boolean),
  };
  state.meta.memoryLog.push({
    cycle: run.cycle,
    outcome,
    topTell,
    totalTells,
    depth: run.depth,
    at: Date.now(),
  });
  state.meta.memoryLog = state.meta.memoryLog.slice(-30);
  return summary;
}

export function getRelic(id) {
  return RELICS.find((relic) => relic.id === id);
}

export function heroDamageBonus(state, hero) {
  return (hero.edge || 0) + (state.run?.tempDamage || 0) + (state.run?.relics.includes('gildedNail') ? 2 : 0);
}

export function relicActive(state, id) {
  return !!(state.run && state.run.relics.includes(id));
}
