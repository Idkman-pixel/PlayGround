// THE LISTENER BELOW — game content and tuning.

export const TELLS = {
  steel:  { name: 'Steel',  color: '#9fb5c9', faint: '#71869a', icon: 'sword'  },
  flame:  { name: 'Flame',  color: '#f28a4b', faint: '#a7582e', icon: 'flame'  },
  shadow: { name: 'Shadow', color: '#a58bd8', faint: '#6d5a99', icon: 'eye'    },
  blood:  { name: 'Blood',  color: '#ce5b63', faint: '#8e3e47', icon: 'drop'   },
  oath:   { name: 'Oath',   color: '#e4c17a', faint: '#a68a4f', icon: 'oath'   },
};

export const TELL_ORDER = ['steel', 'flame', 'shadow', 'blood', 'oath'];

export const HEROES = [
  {
    id: 'vesper',
    name: 'Vesper',
    epithet: 'The Penitent Blade',
    role: 'Vanguard',
    rank: 1,
    color: '#c96052',
    art: 'vesper',
    maxHp: 74,
    blurb: 'A swordswoman who took a vow of silence. The Hollow answered anyway.',
    skills: [
      {
        id: 'sever', name: 'Sever', tell: 'steel', icon: 'sword', target: 'front',
        targetLabel: 'Front', dmg: [10, 14], cd: 0,
        desc: 'A clean, brutal cut. Heavy damage to the front enemy.',
      },
      {
        id: 'reap', name: 'Reap', tell: 'steel', icon: 'scythe', target: 'front2',
        targetLabel: 'Front two', dmg: [6, 9], selfStress: 4, cd: 1,
        desc: 'Sweep both front ranks. The oath frays a little each time.',
      },
      {
        id: 'vow', name: 'Vow', tell: 'oath', icon: 'shield', target: 'ally',
        targetLabel: 'Ally', cd: 2, selfStress: -8, guard: 2,
        desc: 'Shield an ally for 2 rounds. Vesper steadies herself.',
      },
    ],
  },
  {
    id: 'bram',
    name: 'Bram',
    epithet: 'The Bell Warden',
    role: 'Bulwark',
    rank: 2,
    color: '#c59a5b',
    art: 'bram',
    maxHp: 94,
    blurb: 'He carries the last bell of a drowned abbey. It only rings for the doomed.',
    skills: [
      {
        id: 'crush', name: 'Crush', tell: 'steel', icon: 'hammer', target: 'front2',
        targetLabel: 'Front two', dmg: [8, 11], stun: 0.25, cd: 0,
        desc: 'Bring the bell-hammer down. May stun. Hits the front two.',
      },
      {
        id: 'toll', name: 'Bellwether', tell: 'oath', icon: 'bell', target: 'self',
        targetLabel: 'Self', block: 9, taunt: 2, selfStress: 3, cd: 2,
        desc: 'Taunt every foe and gain 9 block for 2 rounds.',
      },
      {
        id: 'rally', name: 'Rally', tell: 'oath', icon: 'sun', target: 'party',
        targetLabel: 'Party', heal: 4, stress: -7, cd: 2,
        desc: 'A low, stubborn note. Heal the party and ease their fear.',
      },
    ],
  },
  {
    id: 'moth',
    name: 'Moth',
    epithet: 'The Lantern Witch',
    role: 'Occultist',
    rank: 3,
    color: '#83b9b5',
    art: 'moth',
    maxHp: 58,
    blurb: 'She fed her name to a flame. It still flickers when she lies.',
    skills: [
      {
        id: 'emberfall', name: 'Emberfall', tell: 'flame', icon: 'flame', target: 'allEnemies',
        targetLabel: 'All foes', dmg: [4, 6], burn: 3, burnTurns: 2, cd: 2,
        desc: 'A rain of hungry sparks. Damages and burns every enemy.',
      },
      {
        id: 'unmake', name: 'Unmake', tell: 'shadow', icon: 'eye', target: 'any',
        targetLabel: 'Any foe', dmg: [2, 4], mark: 2, selfStress: 5, cd: 1,
        desc: 'Peel away a name. Marks the target: +30% damage taken for 2 rounds. Moth pays 5 stress.',
      },
      {
        id: 'siphon', name: 'Siphon', tell: 'shadow', icon: 'spiral', target: 'any',
        targetLabel: 'Any foe', dmg: [5, 7], selfHeal: 6, cd: 0,
        desc: 'Drink a little of what the Hollow has already taken.',
      },
    ],
  },
  {
    id: 'wren',
    name: 'Wren',
    epithet: 'The Hollow Doctor',
    role: 'Physician',
    rank: 4,
    color: '#a68dca',
    art: 'wren',
    maxHp: 64,
    blurb: 'Her stitches hold memory in. She has sewn shut more than one mouth.',
    skills: [
      {
        id: 'stitch', name: 'Stitch', tell: 'blood', icon: 'needle', target: 'ally',
        targetLabel: 'Ally', heal: [13, 17], cleanse: true, cd: 1,
        desc: 'Close a wound with red thread. Heals and cleanses bleed.',
      },
      {
        id: 'blight', name: 'Blight', tell: 'blood', icon: 'drop', target: 'any',
        targetLabel: 'Any foe', dmg: [2, 3], poison: 5, poisonTurns: 3, cd: 1,
        desc: 'Inject a patient rot. Poisons for 3 rounds.',
      },
      {
        id: 'hush', name: 'Hush', tell: 'shadow', icon: 'finger', target: 'ally',
        targetLabel: 'Ally', stress: -15, cd: 0,
        desc: 'A hand over the mouth. Removes 15 stress from an ally.',
      },
    ],
  },
];

export const ENEMIES = {
  pilgrim: {
    id: 'pilgrim', name: 'Pale Pilgrim', title: 'The Unshriven', art: 'pilgrim',
    hp: 38, armor: 0, color: '#c9c3b5',
    attacks: [
      { id: 'rend', name: 'Rend', kind: 'damage', dmg: [6, 9], stress: 3, target: 'front', weight: 3 },
      { id: 'kneel', name: 'Kneel', kind: 'stress', stress: 7, target: 'random', weight: 1 },
    ],
  },
  husk: {
    id: 'husk', name: 'Choir Husk', title: 'A Mouth in the Dark', art: 'husk',
    hp: 31, armor: 0, color: '#a99bc7',
    attacks: [
      { id: 'hymn', name: 'Hymn', kind: 'stress', stress: 6, target: 'all', weight: 2 },
      { id: 'grasp', name: 'Grasp', kind: 'damage', dmg: [4, 7], stress: 3, target: 'random', weight: 3 },
    ],
  },
  hound: {
    id: 'hound', name: 'Grief Hound', title: 'It Remembers Your Scent', art: 'hound',
    hp: 35, armor: 1, color: '#c87363',
    attacks: [
      { id: 'maul', name: 'Maul', kind: 'damage', dmg: [6, 9], bleed: 4, stress: 2, target: 'front', weight: 3 },
      { id: 'howl', name: 'Howl', kind: 'stress', stress: 5, target: 'all', weight: 1 },
    ],
  },
  widow: {
    id: 'widow', name: 'Wax Widow', title: 'She Keeps the Flame', art: 'widow',
    hp: 30, armor: 0, color: '#d8a962',
    attacks: [
      { id: 'candle', name: 'Candle', kind: 'damage', dmg: [5, 8], burn: 4, target: 'random', weight: 3 },
      { id: 'weep', name: 'Weep', kind: 'stress', stress: 8, target: 'back', weight: 2 },
    ],
  },
  bellEater: {
    id: 'bellEater', name: 'Bell-Eater', title: 'A Hunger With Hands', art: 'belleater',
    hp: 58, armor: 2, color: '#c18d56',
    attacks: [
      { id: 'bite', name: 'Swallow', kind: 'damage', dmg: [10, 14], stress: 4, target: 'front', weight: 3 },
      { id: 'toll', name: 'Iron Toll', kind: 'damage', dmg: [4, 6], stress: 6, target: 'all', weight: 2 },
    ],
  },
  theUnnamed: {
    id: 'theUnnamed', name: 'The Unnamed', title: 'A Saint of No Face', art: 'unnamed',
    hp: 92, armor: 2, color: '#bdb4a4', elite: true,
    attacks: [
      { id: 'erase', name: 'Erase', kind: 'damage', dmg: [12, 17], stress: 8, target: 'random', weight: 3 },
      { id: 'litany', name: 'Litany', kind: 'stress', stress: 10, target: 'all', weight: 2 },
      { id: 'mend', name: 'Mend', kind: 'heal', heal: 10, target: 'self', weight: 1 },
    ],
  },
  listener: {
    id: 'listener', name: 'The Listener', title: 'That Which Wears Your Past', art: 'listener',
    hp: 178, armor: 2, color: '#d7c6a4', boss: true,
    attacks: [
      { id: 'devour', name: 'Devour Memory', kind: 'damage', dmg: [8, 11], stress: 9, target: 'all', weight: 3 },
      { id: 'unmake', name: 'Unmake', kind: 'damage', dmg: [14, 19], stress: 5, target: 'random', weight: 2 },
      { id: 'learn', name: 'Learn You', kind: 'stress', stress: 12, target: 'all', weight: 1 },
    ],
  },
  echo: {
    id: 'echo', name: 'Echo', title: 'An Old Version of You', art: 'echo',
    hp: 42, armor: 1, color: '#a795c7',
    attacks: [
      { id: 'repeat', name: 'Repeat', kind: 'damage', dmg: [6, 9], stress: 5, target: 'random', weight: 3 },
    ],
  },
};

export const ZONES = [
  { depth: 1, name: 'The Sunken Nave', whisper: 'Water remembers every hymn.' },
  { depth: 2, name: 'The Ossuary Stair', whisper: 'Each step is a name you forgot.' },
  { depth: 3, name: 'The Choir of Wax', whisper: 'They sing with borrowed mouths.' },
  { depth: 4, name: 'The Unmade Chapel', whisper: 'The pews are facing the wrong way.' },
  { depth: 5, name: 'The Ear Beneath', whisper: 'It has been waiting for you to listen back.' },
];

export const MUTATIONS = [
  { id: 'waxen', name: 'Waxen', desc: 'Begins with 8 block', minCycle: 2 },
  { id: 'hollow', name: 'Hollow', desc: 'Attacks inflict +4 stress', minCycle: 3 },
  { id: 'quick', name: 'Quickened', desc: '+20% damage', minCycle: 4 },
  { id: 'thorned', name: 'Thorned', desc: 'Reflects 3 damage', minCycle: 5 },
  { id: 'twinned', name: 'Twinned', desc: '+25% max health', minCycle: 6 },
];

export const RELICS = [
  { id: 'waxSeal', name: 'Wax Seal', icon: 'seal', desc: '+1 lantern charge in every fight.', color: '#e0bd77' },
  { id: 'gildedNail', name: 'Gilded Nail', icon: 'nail', desc: '+2 damage with every strike.', color: '#d4b065' },
  { id: 'saltKnot', name: 'Salt Knot', icon: 'knot', desc: 'Party begins each fight with 10 block.', color: '#9cc8c5' },
  { id: 'blackCandle', name: 'Black Candle', icon: 'candle', desc: 'Stress taken reduced by 20%.', color: '#a58bd8' },
  { id: 'boneDie', name: 'Bone Die', icon: 'die', desc: '+12% critical strike chance.', color: '#e3d8c2' },
  { id: 'redThread', name: 'Red Thread', icon: 'needle', desc: 'Healing is 30% stronger.', color: '#ce5b63' },
];

export const PATH_META = {
  battle: { label: 'Skirmish', icon: 'sword', risk: 'Blood remembers', tone: '#c96052' },
  elite: { label: 'Elite', icon: 'skull', risk: 'A name is watching', tone: '#d8a962' },
  camp: { label: 'Respite', icon: 'fire', risk: 'Warmth is borrowed', tone: '#e0a55f' },
  reliquary: { label: 'Reliquary', icon: 'relic', risk: 'Every gift has a price', tone: '#e4c17a' },
  whisper: { label: 'Whisper', icon: 'eye', risk: 'It knows you can hear', tone: '#a58bd8' },
  boss: { label: 'The Gate', icon: 'gate', risk: 'No way but through', tone: '#e4c17a' },
};

export const BATTLE_TITLES = [
  ['A Procession of Masks', 'They walk backward, toward you.'],
  ['The Bell That Breathes', 'A slow sound crawls under the floor.'],
  ['Stair of Teeth', 'The steps are warm.'],
  ['Kneeling Dark', 'Something here is still praying.'],
  ['The Wax Choir', 'Every candle has a throat.'],
  ['A Door Made of Mouths', 'It opens when you remember.'],
  ['The Unshriven', 'They have been waiting to be named.'],
  ['A Quiet Ambush', 'The silence has too many hands.'],
  ['The Grief Kennel', 'The hounds know your childhood.'],
];

export const WHISPERS = [
  {
    id: 'coin',
    title: 'The Coin in the Wound',
    icon: 'coin',
    text: 'A gold coin sits in a wound in the stone. It is warm. It is beating.',
    options: [
      { label: 'Take it', hint: '+45 ash · all stress +8', effect: 'coinTake' },
      { label: 'Leave it beating', hint: 'All stress −5', effect: 'coinLeave' },
    ],
    result: {
      coinTake: 'The coin dissolves on your tongue. The walls sigh with pleasure.',
      coinLeave: 'You step past. The beating follows you for a while, then stops.',
    },
  },
  {
    id: 'voice',
    title: 'A Familiar Voice',
    icon: 'mouth',
    text: 'From behind a door: your own voice, younger, asking to be let out.',
    options: [
      { label: 'Answer it', hint: 'One hero stress −22 · another +10', effect: 'voiceAnswer' },
      { label: 'Nail the door shut', hint: '+10 ash · all stress +4', effect: 'voiceShut' },
    ],
    result: {
      voiceAnswer: 'Moth laughs. Wren does not. The door is gone when you look again.',
      voiceShut: 'The nail goes in easily. The screaming does not start until you leave.',
    },
  },
  {
    id: 'mirror',
    title: 'The Mirror Saint',
    icon: 'mirror',
    text: 'A figure of black glass holds out its hands. It has your scars, but none of your reasons.',
    options: [
      { label: 'Trade reflections', hint: 'Gain a random relic · all stress +6', effect: 'mirrorTrade' },
      { label: 'Break the saint', hint: '+35 ash · one hero stress +14', effect: 'mirrorBreak' },
    ],
    result: {
      mirrorTrade: 'It takes your reflection. You keep the gift. You do not look down.',
      mirrorBreak: 'The saint shatters into a hundred small versions of you. None of them blink.',
    },
  },
  {
    id: 'bell',
    title: 'The Bell Without a Tongue',
    icon: 'bell',
    text: 'A bell hangs in the dark, mouth sewn shut with red thread. It rings anyway.',
    options: [
      { label: 'Listen closely', hint: 'Reveal the next fight · all stress +5', effect: 'bellListen' },
      { label: 'Cut the thread', hint: 'Enemies in next fight have −15% health · +20 ash', effect: 'bellCut' },
    ],
    result: {
      bellListen: 'The bell tells you the shape of the next violence. You wish it had not.',
      bellCut: 'The thread parts. Somewhere below, something wakes with less of itself.',
    },
  },
];

export const CAMP_OPTIONS = [
  { id: 'tend', label: 'Tend the wounded', hint: 'Heal 30% of max HP for the party', icon: 'heart' },
  { id: 'talk', label: 'Tell a true story', hint: 'Reduce all stress by 24', icon: 'fire' },
  { id: 'sharpen', label: 'Prepare the blades', hint: '+2 damage for the next fight', icon: 'sword' },
];

export const ENDINGS = {
  win: {
    title: 'THE LISTENER FALLS SILENT',
    kicker: 'BUT SILENCE IS ALSO A KIND OF EAR',
    text: 'You climb out carrying a piece of its attention. It does not die. It learns how you killed it.',
  },
  loss: {
    title: 'THE HOLLOW KEEPS YOU',
    kicker: 'YOU WAKE WITH SOMEONE ELSE’S MEMORIES',
    text: 'Your bodies are returned to the threshold. The Listener keeps the rest. It is already practicing.',
  },
  retreat: {
    title: 'YOU TURN BACK',
    kicker: 'THE DESCENT DOES NOT TURN WITH YOU',
    text: 'You leave with what you can carry. Behind you, the dark rehearses your footsteps.',
  },
};

export const HERO_UPGRADES = {
  vigor: { label: 'Vigor', stat: '+6 max HP', icon: 'heart', base: 32, step: 18 },
  edge: { label: 'Edge', stat: '+1 damage', icon: 'sword', base: 38, step: 22 },
};

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
