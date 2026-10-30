// The Listener Below — hand-built SVG art. No external image dependencies.

let artUid = 0;
const uid = (p) => `${p}${++artUid}`;

const STROKE = `fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"`;

const ICON_PATHS = {
  sword: `<path d="M14.5 3.5 20 3l-.5 5.5-9 9-4-4 8-9Z"/><path d="m7 13 4 4"/><path d="m4 16 4 4"/><path d="m3 21 3-3"/><path d="m12 10 2 2"/>`,
  scythe: `<path d="M4 21 18 4"/><path d="M9 3c5 0 9 2 11 6-3-1-6-1-8 0"/><path d="m5 17 4 4"/>`,
  shield: `<path d="M12 3 19 6v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z"/><path d="m9 11 2 2 4-4"/>`,
  hammer: `<path d="m4 20 8-8"/><path d="m10.5 5.5 3-3 7 7-3 3-7-7Z"/><path d="m8 14 4 4"/>`,
  bell: `<path d="M6 16h12l-2-3V9a4 4 0 0 0-8 0v4l-2 3Z"/><path d="M10 19a2 2 0 0 0 4 0"/><path d="M12 3v2"/>`,
  sun: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>`,
  flame: `<path d="M12 21c4 0 7-2.8 7-6.5 0-4.6-4.3-6.2-4.1-11.5-2.4 1.4-4.2 3.9-4.2 6.1 0 1 .3 1.8.9 2.6-1.2-.2-2.1-1-2.6-2C7.3 11.3 5 13.1 5 15.5 5 18.6 8 21 12 21Z"/>`,
  eye: `<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/>`,
  spiral: `<path d="M12 21a9 9 0 1 1 9-9c0 4-3 7-7 7a5 5 0 0 1-5-5c0-2.2 1.8-4 4-4a2 2 0 0 1 2 2c0 1-.8 1.8-1.8 1.8"/>`,
  needle: `<path d="M20 3 9 14"/><path d="m6 17 3-3"/><path d="M3.5 20.5 6 17l1 1 2.5-2.5"/><path d="M14 5c2-1 4 1 3 3"/>`,
  drop: `<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z"/><path d="M9.5 15.5c0 1.4 1.1 2.5 2.5 2.5"/>`,
  finger: `<path d="M9 20v-7.5a1.7 1.7 0 0 1 3.4 0V8.2a1.7 1.7 0 0 1 3.4 0v3.2-1.6a1.6 1.6 0 0 1 3.2 0V17c0 2.2-1.8 4-4 4h-2.7c-1.8 0-3.3-1.2-3.3-1.2L4 16.5a1.5 1.5 0 0 1 2.3-1.9L9 17"/>`,
  skull: `<path d="M12 3a7 7 0 0 0-7 7c0 2.5 1.2 4.2 3 5.4V19l2 2h4l2-2v-3.6c1.8-1.2 3-2.9 3-5.4a7 7 0 0 0-7-7Z"/><circle cx="9.3" cy="10.2" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.7" cy="10.2" r="1.1" fill="currentColor" stroke="none"/><path d="M11 14h2M10 18h4"/>`,
  fire: `<path d="M12 21c3.5 0 6-2.4 6-5.6 0-4-3.8-5.7-3.6-9.9-2.2 1.2-3.8 3.4-3.8 5.4 0 .8.2 1.5.6 2.1-1-.2-1.7-.9-2.1-1.8C7.9 12.3 6 14 6 16c0 3 2.6 5 6 5Z"/><path d="M12 21c1.5 0 2.6-1 2.6-2.4 0-1.7-1.7-2.4-1.6-4.2-1 .5-1.7 1.4-1.7 2.3 0 .4.1.7.3 1-.5-.1-.8-.4-1-.8-.6.5-1 1.2-1 1.9 0 1.2.9 2.2 2.4 2.2Z"/>`,
  relic: `<path d="M8 3h8l4 5-8 13L4 8l4-5Z"/><path d="M4 8h16M12 3v18M8 8l4 5 4-5"/>`,
  gate: `<path d="M5 21V9a7 7 0 0 1 14 0v12"/><path d="M9 21V10a3 3 0 0 1 6 0v11"/><path d="M3 21h18"/>`,
  seal: `<circle cx="12" cy="10" r="6"/><path d="M8 15.5 6 22l6-2 6 2-2-6.5"/><path d="M9.5 10h5M12 7.5v5"/>`,
  nail: `<path d="M12 2v11"/><path d="M8 6h8"/><path d="m8 13 4 9 4-9"/><path d="M9 13h6"/>`,
  knot: `<path d="M7 4c4 2 2 6 5 8s5-1 5 3-5 6-8 3-1-7-5-8-3-4 3-6Z"/><path d="M4 7 7 4M17 17l3 3"/>`,
  candle: `<path d="M9 21h6l-1-8h-4l-1 8Z"/><path d="M12 13V9"/><path d="M12 9c-2-1-2-3 0-5 2 2 2 4 0 5Z"/>`,
  die: `<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>`,
  coin: `<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.2c.5-1 1.4-1.5 2.5-1.5 1.7 0 2.6.9 2.6 2.1 0 2.9-5.2 2-5.2 5 0 1.3 1.1 2.2 2.8 2.2 1.1 0 2-.5 2.5-1.4"/><path d="M12 5.5v13"/>`,
  mouth: `<path d="M4 10c2.8-5 13.2-5 16 0-2.8 5-13.2 5-16 0Z"/><path d="M7 10c1.8-1.8 8.2-1.8 10 0-1.8 1.8-8.2 1.8-10 0Z"/><path d="M12 5v2M12 17v2"/>`,
  mirror: `<rect x="6" y="3" width="12" height="14" rx="6"/><path d="M9 6c2-2 5-1 6 1"/><path d="M8 21h8M12 17v4"/>`,
  heart: `<path d="M12 21S3 15.5 3 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 9 2.5C21 15.5 12 21 12 21Z"/>`,
  lantern: `<path d="M9 6h6l2 3v9H7V9l2-3Z"/><path d="M12 3v3M10 18v2M14 18v2"/><path d="M12 10v4"/>`,
  close: `<path d="m5 5 14 14M19 5 5 19"/>`,
  settings: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>`,
  sound: `<path d="M4 10v4h4l5 4V6L8 10H4Z"/><path d="M16 8c2 2 2 6 0 8M18.5 5.5c3.5 3.5 3.5 9.5 0 13"/>`,
  mute: `<path d="M4 10v4h4l5 4V6L8 10H4Z"/><path d="m17 9 4 6M21 9l-4 6"/>`,
  pause: `<path d="M9 5v14M15 5v14"/>`,
  menu: `<path d="M4 7h16M4 12h16M4 17h16"/>`,
  chevron: `<path d="m9 6 6 6-6 6"/>`,
  ash: `<path d="m12 3 3 7 5 2-5 2-3 7-3-7-5-2 5-2 3-7Z"/>`,
  phone: `<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10.5 5h3M11 18.5h2"/>`,
  target: `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>`,
  info: `<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>`,
  arrow: `<path d="M4 12h16M14 6l6 6-6 6"/>`,
  book: `<path d="M4 5c3-2 5-2 8 0 3-2 5-2 8 0v14c-3-2-5-2-8 0-3-2-5-2-8 0V5Z"/><path d="M12 5v14"/>`,
  motion: `<path d="M3 12h4l2-5 3 10 2-5h7"/><path d="M17 4l3 3-3 3M20 7h-5"/>`,
  spark: `<path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/>`,
  shieldCheck: `<path d="M12 3 19 6v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z"/><path d="m8.5 11.5 2.2 2.2 4.8-4.8"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  check: `<path d="m4 12 5 5L20 6"/>`,
  restart: `<path d="M4 12a8 8 0 1 1 2.3 5.7"/><path d="M4 17v-5h5"/>`,
  trash: `<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>`,
  ear: `<path d="M7 9a5 5 0 1 1 10 0c0 3-2 4-2 6.5 0 2-1 4-3.5 4S8 18 8 16"/><path d="M10 9a2 2 0 1 1 4 0c0 1.4-1 2-1 3.5"/>`,
  crown: `<path d="m4 18 2-11 4 5 2-8 2 8 4-5 2 11H4Z"/><path d="M6 21h12"/>`,
  chains: `<path d="M9 15 7 17a3 3 0 0 1-4-4l3-3a3 3 0 0 1 4 0"/><path d="m15 9 2-2a3 3 0 0 1 4 4l-3 3a3 3 0 0 1-4 0"/><path d="m8 16 8-8"/>`,
};

export function icon(name, cls = '') {
  const path = ICON_PATHS[name] || ICON_PATHS.spark;
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" ${STROKE}>${path}</svg>`;
}

function portraitOpen(id, tone, tone2) {
  const bg = uid('bg');
  const glow = uid('glow');
  return `<svg viewBox="0 0 120 150" class="portrait-svg" role="img" aria-label="">
    <defs>
      <radialGradient id="${bg}" cx="50%" cy="38%" r="70%">
        <stop offset="0" stop-color="${tone}" stop-opacity=".42"/>
        <stop offset=".58" stop-color="${tone2}" stop-opacity=".15"/>
        <stop offset="1" stop-color="#08070b" stop-opacity="0"/>
      </radialGradient>
      <filter id="${glow}" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.2" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="120" height="150" fill="url(#${bg})"/>
    <g opacity=".16" stroke="${tone}" fill="none">
      <circle cx="60" cy="59" r="42"/><circle cx="60" cy="59" r="34" stroke-dasharray="2 7"/>
    </g>`;
}

function portraitClose(extra = '') {
  return `${extra}</svg>`;
}

function heroVesper() {
  return portraitClose(`${portraitOpen('vesper', '#d16b59', '#37161c')}
    <g opacity=".5" stroke="#e3cbb7" fill="none" stroke-width=".8">
      <path d="M22 132c8-20 7-38 11-53M98 132c-7-20-7-38-11-53"/>
    </g>
    <g transform="rotate(18 96 64)">
      <path d="m94 9 3-3 2 3-13 105-5 2 1-5L94 9Z" fill="#aab9c5"/>
      <path d="m95 11 1 92" stroke="#e7eef2" stroke-width="1.4" opacity=".8"/>
      <path d="M79 108h14M84 104v9M88 103v11" stroke="#d7b06b" stroke-width="2.4"/>
    </g>
    <path d="M31 150c1-27 3-53 13-70 6-10 15-17 25-23-10 12-13 22-11 34 8 8 15 17 17 29 2 11 2 21 2 30Z" fill="#170e12"/>
    <path d="M35 150c2-29 3-50 13-67 5-8 10-13 17-18-3 8-4 15-2 22 7 9 12 15 14 23 3 11 2 25 2 40Z" fill="#3b1a1d"/>
    <path d="M35 150c2-27 3-49 12-65l5 1c-5 19-4 42-2 64Z" fill="#5e2928" opacity=".9"/>
    <path d="M43 74c0-17 6-31 20-38 11 4 19 15 20 29-1 16-8 25-21 27-12-1-19-7-19-18Z" fill="#23171a"/>
    <path d="M48 63c2-10 7-17 15-20 8 4 14 10 16 20-2 11-7 17-15 20-9-2-14-9-16-20Z" fill="#b69c89"/>
    <path d="M48 61c2-10 8-16 15-18 8 2 14 8 16 18-4-6-10-9-16-9s-11 3-15 9Z" fill="#1a1114"/>
    <path d="M53 60c3-2 6-2 9 0M66 60c3-2 5-1 7 1" stroke="#1a1114" stroke-width="1.4" fill="none"/>
    <path d="M62 64v5l-2 1" stroke="#705648" stroke-width="1.2" fill="none"/>
    <path d="M55 73c4 2 8 2 12-1" stroke="#6d3e3e" stroke-width="1.3" fill="none"/>
    <path d="M39 85c12-7 32-8 43 0-3 8-11 11-21 11-11 0-19-4-22-11Z" fill="#7c2f31"/>
    <path d="M43 86c10-4 24-4 34 0" stroke="#d36c62" stroke-width="1" fill="none" opacity=".8"/>
    <path d="M48 92c8-7 19-7 26-1" stroke="#2b1417" stroke-width="2" fill="none"/>
    <circle cx="60" cy="89" r="2.2" fill="#e4c17a"/>
    <g filter="url(#${uid('g')})" opacity=".8">
      <circle cx="26" cy="45" r="1.1" fill="#e6c583"/><circle cx="94" cy="33" r=".8" fill="#e6c583"/><circle cx="88" cy="133" r="1" fill="#c96052"/>
    </g>`);
}

function heroBram() {
  return portraitClose(`${portraitOpen('bram', '#d0a460', '#3b2918')}
    <path d="M20 150c2-26 4-44 12-57 6-10 14-16 28-22 15 5 24 12 29 23 6 13 8 31 10 56Z" fill="#171311"/>
    <path d="M27 150c2-24 5-41 12-54 6-8 13-13 21-17 9 4 17 10 22 18 5 12 8 29 9 53Z" fill="#332a21"/>
    <path d="M33 83c-2-11 2-19 9-23l7 10-3 15-13-2Z" fill="#55432f"/>
    <path d="M87 83c2-11-2-19-9-23l-7 10 3 15 13-2Z" fill="#55432f"/>
    <path d="M39 69c0-14 7-25 21-30 14 5 21 16 21 30 0 15-7 25-21 29-14-4-21-14-21-29Z" fill="#25211c"/>
    <path d="M45 59c1-10 6-18 15-21 9 4 14 11 15 21v8H45v-8Z" fill="#78644a"/>
    <path d="M48 66h11l-2 13h-7l-2-13ZM60 66h12l-2 13h-7l-3-13Z" fill="#211b16"/>
    <path d="M50 69h7M63 69h7" stroke="#d5a961" stroke-width="1.6"/>
    <path d="M54 82h12" stroke="#241b14" stroke-width="2"/>
    <path d="M39 84c13-6 29-6 42 0" stroke="#d0a460" stroke-width="1.4" fill="none" opacity=".65"/>
    <path d="M35 93c16-7 34-7 50 0" stroke="#8d6b3f" stroke-width="1" fill="none" opacity=".6"/>
    <g>
      <path d="M54 96h12l-2 4H56l-2-4Z" fill="#a27b42"/>
      <path d="M55 100h10l-1.5 12h-7L55 100Z" fill="#7b582f"/>
      <path d="M58 112h4l1 7h-6l1-7Z" fill="#554020"/>
      <path d="M60 96v-3" stroke="#c5a062" stroke-width="1.2"/>
      <circle cx="60" cy="106" r="2" fill="#e2bd76"/>
    </g>
    <path d="M16 58c9-4 17-3 23 2M104 58c-9-4-17-3-23 2" stroke="#6c5435" stroke-width="4" opacity=".5"/>
    <g opacity=".25" stroke="#d0a460" fill="none">
      <path d="M25 130c14-9 56-9 70 0M30 138c12-6 48-6 60 0"/>
    </g>
    <circle cx="31" cy="33" r="1" fill="#e4c17a"/><circle cx="91" cy="27" r=".8" fill="#e4c17a"/>`);
}

function heroMoth() {
  return portraitClose(`${portraitOpen('moth', '#74b9b5', '#142b2f')}
    <path d="M34 150c2-26 5-45 11-59 5-11 9-17 15-24 8 6 12 14 15 24 5 15 8 34 11 59Z" fill="#101820"/>
    <path d="M36 150c3-30 6-47 12-60 4-8 8-14 12-19 6 6 9 12 13 20 6 14 8 32 10 59Z" fill="#1d3033"/>
    <path d="M46 73c-1-17 5-28 14-35 10 7 16 18 15 35-1 15-6 24-15 28-9-4-14-13-14-28Z" fill="#1a2024"/>
    <path d="M43 66c-3-21 5-39 17-46 12 8 19 25 16 46-3 13-8 21-16 24-9-3-14-11-17-24Z" fill="#1b151c"/>
    <path d="M39 44c9-7 25-6 35 2l-6 6c-8-5-16-5-23 0l-6-8Z" fill="#392638"/>
    <path d="M54 55c0-12 3-19 6-24 3 6 5 14 4 24-1 13-3 20-5 24-2-5-4-12-5-24Z" fill="#b599ad"/>
    <path d="M53 56c3-2 5-2 8 0M63 55c2-1 4-1 6 1" stroke="#1c1218" stroke-width="1.2"/>
    <path d="M58 66c2 1 4 1 6-1" stroke="#6b4358" stroke-width="1" fill="none"/>
    <path d="M44 70c-7-3-12-1-15 4-3 6 1 12 8 13 5 1 9-2 11-6" fill="none" stroke="#6f9e9b" stroke-width="2"/>
    <path d="M75 72c8-5 14-4 18 1 4 7-1 14-9 15-5 1-9-2-11-6" fill="none" stroke="#6f9e9b" stroke-width="2"/>
    <path d="M63 91c7-7 16-8 24-4l-4 12-12 5-10-5 2-8Z" fill="#271c2c"/>
    <path d="M84 85c6-13 12-19 19-22-1 10-5 20-12 28" fill="#20383a"/>
    <g>
      <path d="M83 91c0-8 4-14 10-17 5 3 8 9 7 16-1 8-4 12-8 14-5-2-8-6-9-13Z" fill="#1d2f31"/>
      <path d="M88 85c1-4 2-6 5-8 3 2 5 5 5 9 0 5-2 9-5 10-3-2-4-6-5-11Z" fill="#7bcac3" filter="url(#${uid('g')})"/>
      <path d="M90 88c0-3 1-5 3-5s3 2 3 5-1 5-3 5-3-2-3-5Z" fill="#e9fffb"/>
      <path d="M85 102c3 5 6 9 7 16h-5l-5-14 3-2Z" fill="#51433a"/>
    </g>
    <path d="M47 93c4-4 10-5 15-3" stroke="#75b3ad" stroke-width="1" fill="none" opacity=".6"/>
    <g opacity=".85">
      <circle cx="31" cy="95" r="1.4" fill="#86d3cb"/><circle cx="26" cy="86" r=".7" fill="#e4c17a"/><circle cx="95" cy="52" r="1" fill="#86d3cb"/><circle cx="86" cy="31" r=".7" fill="#e4c17a"/>
    </g>`);
}

function heroWren() {
  return portraitClose(`${portraitOpen('wren', '#a98dce', '#241935')}
    <path d="M27 150c3-27 6-44 14-56 6-9 13-15 19-19 8 4 16 10 21 19 8 13 10 30 13 56Z" fill="#16121b"/>
    <path d="M32 150c4-26 7-42 14-53 5-8 10-12 14-15 6 4 12 8 17 16 6 11 9 27 12 52Z" fill="#2e2538"/>
    <path d="M35 88c-2-13 2-20 8-23l4 11-2 11-10 1Z" fill="#4d405d"/>
    <path d="M85 88c2-13-2-20-8-23l-4 11 2 11 10 1Z" fill="#4d405d"/>
    <path d="M42 65c1-17 7-27 18-31 11 4 17 14 18 31 0 17-7 27-18 31-11-4-18-14-18-31Z" fill="#d8cbb4"/>
    <path d="M52 55c6-2 11-1 15 2l-3 21-6 5-5-5-1-23Z" fill="#eee4d0"/>
    <path d="M66 58c10 2 16 7 18 14-5-2-10-2-15 1l-3-15Z" fill="#e0d2ba"/>
    <path d="M67 65c5-1 9 0 12 3-4 0-7 1-10 3" fill="#b8a791"/>
    <path d="M67 58c7 1 12 4 15 9" stroke="#7e684f" stroke-width="1" fill="none"/>
    <path d="M51 60c2-2 5-2 7 0M62 58c2-2 4-1 5 1" stroke="#2a1d2b" stroke-width="1.3"/>
    <circle cx="55" cy="55" r="4" fill="#2a2030"/><circle cx="55" cy="55" r="2" fill="#bca8dc"/>
    <circle cx="70" cy="54" r="4" fill="#2a2030"/><circle cx="70" cy="54" r="2" fill="#bca8dc"/>
    <path d="M46 66c14-7 28-7 40 0" stroke="#221829" stroke-width="1" opacity=".5"/>
    <path d="M30 45c17-8 42-10 62-1l2 8c-23-7-45-6-65 2l1-9Z" fill="#211a29"/>
    <path d="M38 42c11-8 32-10 47-5l4-7c-17-8-38-6-54 4l3 8Z" fill="#352a44"/>
    <path d="M50 34c-4-8-2-13 3-17 3 6 6 10 5 15" fill="#513f5b"/>
    <path d="M71 33c2-8 6-12 10-13 0 5-1 10-4 14" fill="#513f5b"/>
    <path d="M51 87c7-4 16-3 23 2l-1 13-10 8-11-8-1-15Z" fill="#352c3f"/>
    <path d="M70 94c9-3 17-2 24 2" stroke="#c95e66" stroke-width="1.2" fill="none"/>
    <path d="M81 98c7 2 11 6 14 12" stroke="#c95e66" stroke-width="1" fill="none"/>
    <path d="M77 99c-3 5-2 10 1 15" stroke="#c95e66" stroke-width="1" fill="none"/>
    <g opacity=".4"><path d="M26 128c13-7 54-7 68 0M31 136c11-5 46-5 58 0" stroke="#a98dce" fill="none"/></g>`);
}

function enemyPilgrim() {
  return portraitClose(`${portraitOpen('pilgrim', '#c6c0af', '#25231e')}
    <path d="M60 42c-20 0-35 20-40 45-4 21-5 43-3 63h86c2-20 1-42-3-63-5-25-20-45-40-45Z" fill="#141412"/>
    <path d="M34 150c-1-27 2-51 10-71 6-15 11-25 16-31 5 6 11 16 17 31 8 20 11 44 10 71Z" fill="#2c2a24"/>
    <path d="M47 55c-3-13 2-23 13-29 11 6 17 16 14 29-2 11-7 18-14 21-8-3-12-10-13-21Z" fill="#d6cebc"/>
    <path d="M49 50c4-5 8-7 11-7s8 2 11 7c-3 5-6 8-11 8s-8-3-11-8Z" fill="#171714"/>
    <circle cx="55" cy="52" r="2.4" fill="#c6c0af"/><circle cx="65" cy="52" r="2.4" fill="#c6c0af"/>
    <path d="M56 67c3 1 6 1 8 0" stroke="#746e60" stroke-width="1" fill="none"/>
    <path d="M43 86c11-5 23-5 34 0" stroke="#5d5a4e" stroke-width="1.4" fill="none"/>
    <path d="M22 97c-8 8-11 22-12 38" stroke="#2c2a24" stroke-width="7" fill="none"/>
    <path d="M98 97c8 8 11 22 12 38" stroke="#2c2a24" stroke-width="7" fill="none"/>
    <path d="M10 137c-2 5 2 8 7 7M110 137c2 5-2 8-7 7" stroke="#6d6758" stroke-width="2" fill="none"/>
    <path d="M47 107c9-3 18-3 26 0M45 120c10-3 21-3 30 0M44 133c10-3 22-3 32 0" stroke="#5d5a4e" stroke-width=".9" fill="none" opacity=".7"/>
    <path d="M60 83v39" stroke="#7d7463" stroke-width=".8" opacity=".5"/>
    <g opacity=".6" stroke="#c6c0af" fill="none"><path d="M31 75c4-10 7-17 11-22M89 75c-4-10-7-17-11-22"/></g>
    <circle cx="35" cy="32" r="1" fill="#d6cebc"/><circle cx="90" cy="45" r=".8" fill="#d6cebc"/>`);
}

function enemyHusk() {
  return portraitClose(`${portraitOpen('husk', '#a393c8', '#241b34')}
    <path d="M45 53c5-18 25-28 39-18 14 10 17 30 9 46-5 10-12 16-15 28-3 12-2 27 1 41H45c3-20 2-36-3-49-6-16-6-35 3-48Z" fill="#17121d"/>
    <path d="M48 61c7-15 23-21 34-13 11 8 13 22 7 34-5 9-9 15-8 28 1 12 4 26 5 40H44c3-20 2-36-2-48-4-13-3-29 6-41Z" fill="#2b2138"/>
    <path d="M46 70c4-4 8-3 10 2M66 69c5-4 9-3 12 1" stroke="#9d8bc2" stroke-width="1" fill="none"/>
    <path d="M58 55c-5-9-5-20 2-29 7 9 7 20 2 29Z" fill="#c3b2db" opacity=".7"/>
    <path d="M55 64c-2-8 1-14 6-18 4 5 6 12 3 19-2 5-5 7-9-1Z" fill="#d2c4e3"/>
    <path d="M56 71c4-2 8-2 12 0-2 13-5 21-7 27-3-7-5-15-5-27Z" fill="#0d0b11"/>
    <path d="M49 91c8-4 17-3 24 2M47 103c10-4 21-3 30 2M46 116c11-4 23-3 33 2M45 130c12-4 24-3 34 2" stroke="#6d5b88" stroke-width="1.4" fill="none"/>
    <path d="M49 91c8 7 17 8 24 2M47 103c10 8 21 9 30 2" stroke="#9c8abb" stroke-width=".8" fill="none" opacity=".5"/>
    <path d="M41 82c-10 11-17 28-19 50M79 82c10 11 17 28 19 50" stroke="#2b2138" stroke-width="4" fill="none"/>
    <path d="M18 132c1 7 4 9 9 8M102 132c-1 7-4 9-9 8" stroke="#9d8bc2" stroke-width="1.4" fill="none"/>
    <g opacity=".65" fill="#bca8dc"><circle cx="26" cy="47" r="1"/><circle cx="95" cy="64" r="1.2"/><circle cx="32" cy="119" r=".8"/><circle cx="88" cy="111" r=".7"/></g>`);
}

function enemyHound() {
  return portraitClose(`${portraitOpen('hound', '#cd7061', '#351413')}
    <path d="M23 118c-2-17 7-29 21-34 8-3 17-2 25 2l18-13 9 3-7 15 7 10-3 8-11-1c-3 13-13 24-28 27-14 3-29-4-31-17Z" fill="#15100f"/>
    <path d="M29 114c0-12 8-21 19-24 7-2 14-1 20 2l17-11 4 2-6 12 6 7-1 4-10-1c-2 11-10 18-22 21-13 2-25-2-27-12Z" fill="#2d1a18"/>
    <path d="M45 93c1-9 5-16 13-21l12 15-7 8-18-2Z" fill="#3a211e"/>
    <path d="M54 86c1-4 4-7 8-9l7 7-5 6-10-4Z" fill="#d4c9b4" opacity=".7"/>
    <path d="M57 85c2 1 4 1 6 0" stroke="#24100e" stroke-width="1.4" fill="none"/>
    <circle cx="60" cy="80" r="1.8" fill="#ffd5b0"/><circle cx="51" cy="82" r="1.3" fill="#ffd5b0"/>
    <path d="M27 112c9-5 18-4 26 1M31 119c9-4 18-3 24 1" stroke="#7e4a40" stroke-width=".9" fill="none" opacity=".7"/>
    <path d="M63 98c10 4 18 2 23-5M64 106c10 4 18 3 24-3M66 114c9 2 16 0 21-4" stroke="#72504a" stroke-width="1" fill="none" opacity=".6"/>
    <path d="M19 120c-6 4-9 12-4 17 4 4 9 2 11-2M92 99c8-2 14 1 16 7 2 5-2 9-7 9" stroke="#2d1a18" stroke-width="3" fill="none"/>
    <path d="M31 89c-8-4-15-3-20 3M103 63c5-5 9-12 8-19" stroke="#5b2b27" stroke-width="1.4" fill="none" opacity=".7"/>
    <g fill="#e0a08b" opacity=".7"><circle cx="28" cy="103" r=".9"/><circle cx="86" cy="87" r=".7"/><circle cx="40" cy="129" r=".8"/></g>`);
}

function enemyWidow() {
  return portraitClose(`${portraitOpen('widow', '#dfb06b', '#35230f')}
    <path d="M60 50c-23 0-36 23-39 52-2 18-2 35 0 48h78c2-13 2-30 0-48-3-29-16-52-39-52Z" fill="#14100d"/>
    <path d="M28 150c2-30 8-57 19-75 6-9 9-16 13-23 4 7 8 14 14 23 11 18 16 45 18 75Z" fill="#2c2117"/>
    <path d="M45 58c2-13 7-21 15-25 8 4 14 12 15 25 1 13-4 23-15 28-10-5-15-15-15-28Z" fill="#d7c5ad"/>
    <path d="M46 54c8-8 20-9 29-2l-2 13c-8-5-17-5-25 1l-2-12Z" fill="#403428"/>
    <path d="M51 59c3-3 6-3 8 0M63 59c3-3 6-3 8 0" stroke="#1c1612" stroke-width="1.4" fill="none"/>
    <path d="M60 63v6M57 73c2 2 5 2 7 0" stroke="#7c624e" stroke-width="1.1" fill="none"/>
    <path d="M42 78c11-5 24-5 36 0-5 9-12 13-18 13s-14-4-18-13Z" fill="#2c2117"/>
    <g>
      <path d="M48 43c-2-8 1-15 5-20 3 6 4 12 3 18M59 41c-1-10 2-18 6-23 2 8 2 15 0 21M70 44c1-8 4-14 8-17 1 7 0 13-2 18" fill="#ead0a1" opacity=".85"/>
      <path d="M49 42c0-4 1-7 3-10M60 40c0-4 2-8 4-11M72 43c1-3 3-6 5-8" stroke="#f4a34b" stroke-width="1.8"/>
      <path d="M52 30c-2-5 0-8 3-11 2 4 2 8 0 11M64 27c-2-6 0-10 3-13 2 5 2 9 0 13" fill="#f5c46b" filter="url(#${uid('g')})"/>
    </g>
    <path d="M30 120c8-9 20-13 30-13s22 4 30 13" stroke="#5b4631" stroke-width="1" fill="none" opacity=".6"/>
    <path d="M22 129c-2 5 0 9 4 11M98 129c2 5 0 9-4 11" stroke="#7f6243" stroke-width="1.4" fill="none"/>
    <path d="M50 91c2 12 1 22-2 30M70 91c-2 12-1 22 2 30" stroke="#c9b18f" stroke-width="2" fill="none" opacity=".6"/>
    <g fill="#f0c173" opacity=".8"><circle cx="25" cy="66" r=".8"/><circle cx="94" cy="82" r="1"/><circle cx="33" cy="141" r=".7"/></g>`);
}

function enemyBellEater() {
  return portraitClose(`${portraitOpen('belleater', '#ca9257', '#2b1c0d')}
    <path d="M60 62c-21 0-38 13-44 36-5 19-2 38 8 52h72c10-14 13-33 8-52-6-23-23-36-44-36Z" fill="#14100c"/>
    <path d="M31 150c-5-17-3-35 4-48 8-16 17-25 25-30 8 5 17 14 25 30 7 13 9 31 4 48Z" fill="#332419"/>
    <path d="M40 77c12-9 28-9 40 0l-4 14c-10-4-22-4-32 0l-4-14Z" fill="#5b4129"/>
    <path d="M37 100c1-18 9-31 23-37 14 6 22 19 23 37-1 22-9 34-23 38-14-4-22-16-23-38Z" fill="#0d0b09"/>
    <path d="M41 97c2-15 8-26 19-31 11 5 17 16 19 31-2 18-8 28-19 32-11-4-17-14-19-32Z" fill="#282018"/>
    <path d="M45 95c1-13 6-21 15-25 9 4 14 12 15 25-1 16-6 25-15 29-9-4-14-13-15-29Z" fill="#080706"/>
    <path d="M48 95c1-11 4-18 12-22 8 4 11 11 12 22-1 13-4 21-12 25-8-4-11-12-12-25Z" fill="#b58a4e" opacity=".45"/>
    <path d="M53 91h14l-2 8H55l-2-8ZM54 99h12l-1 10h-10l-1-10Z" fill="#c29a5b" opacity=".85"/>
    <path d="M60 100v9" stroke="#5a3b1d" stroke-width="1"/>
    <path d="M47 104c4 8 21 8 26 0-1 16-7 24-13 27-7-3-12-11-13-27Z" fill="#6e4824" opacity=".4"/>
    <path d="M46 112c9 4 19 4 28 0M50 120c7 3 14 3 20 0" stroke="#cbab70" stroke-width="1" fill="none" opacity=".5"/>
    <path d="M28 82c-12 3-19 13-19 27M92 82c12 3 19 13 19 27" stroke="#332419" stroke-width="7" fill="none"/>
    <path d="M7 110c-3 4-2 8 2 10M113 110c3 4 2 8-2 10" stroke="#b58a4e" stroke-width="2" fill="none"/>
    <g opacity=".6" stroke="#ca9257" fill="none"><path d="M33 70c-3-8-2-15 2-21M87 70c3-8 2-15-2-21"/></g>`);
}

function enemyUnnamed() {
  return portraitClose(`${portraitOpen('unnamed', '#d8cfbd', '#2b2822')}
    <path d="M60 23c-12 0-19 9-19 19 0 8 4 13 9 16-9 6-15 19-18 38-4 23-2 40 1 54h54c3-14 5-31 1-54-3-19-9-32-18-38 5-3 9-8 9-16 0-10-7-19-19-19Z" fill="#151411"/>
    <path d="M42 150c-2-28 0-52 4-68 3-11 8-20 14-27 6 7 11 16 14 27 4 16 6 40 4 68Z" fill="#ddd5c4"/>
    <path d="M45 150c-1-25 0-48 4-64 3-9 7-16 11-21 4 5 8 12 11 21 4 16 5 39 4 64Z" fill="#c6bda9"/>
    <path d="M46 62c0-15 6-25 14-30 8 5 14 15 14 30 0 14-6 23-14 27-8-4-14-13-14-27Z" fill="#0c0b09"/>
    <path d="M51 55c3-6 9-8 14-4M66 54c3-1 5 0 6 2" stroke="#e7ddc8" stroke-width="1.2" fill="none" opacity=".7"/>
    <path d="M60 58v12M56 71c3 2 5 2 8 0" stroke="#6e6657" stroke-width="1" fill="none"/>
    <path d="M41 89c11-4 27-4 38 0M40 96c13-4 27-4 40 0M41 104c12-3 26-3 38 0" stroke="#a69b86" stroke-width="1" fill="none" opacity=".5"/>
    <g opacity=".85">
      <path d="M27 100c-8-11-13-22-14-34 8 2 17 10 25 24M93 100c8-11 13-22 14-34-8 2-17 10-25 24" fill="none" stroke="#ddd5c4" stroke-width="2"/>
      <path d="M21 124c-9-3-15-9-18-17 7-1 14 2 22 9M99 124c9-3 15-9 18-17-7-1-14 2-22 9" fill="none" stroke="#ddd5c4" stroke-width="1.6"/>
      <path d="M27 100c-5-6-9-12-12-19M93 100c5-6 9-12 12-19" stroke="#9e9481" stroke-width=".8"/>
    </g>
    <g stroke="#e7ddc8" fill="none" opacity=".55">
      <circle cx="60" cy="45" r="35" stroke-dasharray="1 7"/><circle cx="60" cy="45" r="45" stroke-dasharray="1 11"/>
    </g>
    <circle cx="60" cy="43" r="2" fill="#e7ddc8" filter="url(#${uid('g')})"/>
    <g fill="#e7ddc8" opacity=".7"><circle cx="23" cy="42" r=".8"/><circle cx="98" cy="36" r=".9"/><circle cx="35" cy="135" r=".7"/></g>`);
}

function enemyListener() {
  return portraitClose(`${portraitOpen('listener', '#e1cc9f', '#3a250e')}
    <g opacity=".45" stroke="#e4c17a" fill="none">
      <ellipse cx="60" cy="70" rx="1" ry="1"/>
      <ellipse cx="60" cy="72" rx="34" ry="15" stroke-dasharray="1 5"/>
      <ellipse cx="60" cy="72" rx="47" ry="23" stroke-dasharray="1 8"/>
      <ellipse cx="60" cy="72" rx="57" ry="32" stroke-dasharray="1 12"/>
    </g>
    <path d="M60 23c-24 0-43 17-46 43-3 27 11 49 36 58 5 2 15 2 20 0 25-9 39-31 36-58-3-26-22-43-46-43Z" fill="#1b1510"/>
    <path d="M60 31c-20 0-36 14-39 36-2 22 10 41 30 49 4 2 13 2 18 0 20-8 32-27 30-49-3-22-19-36-39-36Z" fill="#3b2b1a"/>
    <path d="M60 38c-16 0-29 11-32 29-2 18 8 34 24 41 3 1 12 1 16 0 16-7 26-23 24-41-3-18-16-29-32-29Z" fill="#6d522d" opacity=".45"/>
    <g>
      <ellipse cx="43" cy="57" rx="9" ry="4.5" fill="#e7dcc2"/>
      <ellipse cx="77" cy="57" rx="9" ry="4.5" fill="#e7dcc2"/>
      <ellipse cx="60" cy="45" rx="5.5" ry="3" fill="#e7dcc2"/>
      <circle cx="43" cy="57" r="3.2" fill="#1a1209"/><circle cx="77" cy="57" r="3.2" fill="#1a1209"/><circle cx="60" cy="45" r="2" fill="#1a1209"/>
      <circle cx="42" cy="56" r="1" fill="#ffd7a0"/><circle cx="76" cy="56" r="1" fill="#ffd7a0"/><circle cx="60" cy="44" r=".7" fill="#ffd7a0"/>
    </g>
    <path d="M38 82c8-10 15-14 22-14s14 4 22 14c-9 17-14 23-22 23s-13-6-22-23Z" fill="#0b0805"/>
    <path d="M44 85c5 4 10 5 16 5s11-1 16-5c-5 12-9 16-16 16s-11-4-16-16Z" fill="#311d0e"/>
    <path d="M48 98c8 3 16 3 24 0" stroke="#e1cc9f" stroke-width="1" fill="none" opacity=".4"/>
    <path d="M60 68v11" stroke="#a7814d" stroke-width="1.3"/>
    <g fill="none" stroke="#d8bf8e" opacity=".75">
      <path d="M18 66c-4 9-4 19 0 28M102 66c4 9 4 19 0 28"/>
      <path d="M11 55c-6 12-6 27 0 39M109 55c6 12 6 27 0 39"/>
    </g>
    <g fill="#e4c17a" opacity=".8"><circle cx="20" cy="60" r="1"/><circle cx="100" cy="62" r="1.2"/><circle cx="13" cy="53" r=".8"/><circle cx="107" cy="52" r=".7"/></g>
    <path d="M28 130c-4 4-5 9-3 14M92 130c4 4 5 9 3 14" stroke="#6d522d" stroke-width="2" fill="none"/>
    <path d="M44 126c10 5 22 5 32 0" stroke="#6d522d" stroke-width="1" fill="none" opacity=".5"/>`);
}

function enemyEcho() {
  return portraitClose(`${portraitOpen('echo', '#b3a0d7', '#21172e')}
    <path d="M60 31c-12 0-19 9-19 21 0 14 8 25 19 32 11-7 19-18 19-32 0-12-7-21-19-21Z" fill="#2b1e3b" opacity=".65"/>
    <path d="M29 150c2-29 6-49 14-63 5-8 11-14 17-19 6 5 12 11 17 19 8 14 12 34 14 63Z" fill="#1b1425" opacity=".7"/>
    <path d="M51 54c3-5 6-8 9-10 4 2 7 5 9 10-3 5-6 7-9 7s-6-2-9-7Z" fill="#c5b7df" opacity=".65"/>
    <path d="M54 55h5M63 55h4" stroke="#2a1c3b" stroke-width="1.4"/>
    <path d="M58 64c2 1 3 1 5-1" stroke="#56426e" stroke-width="1" fill="none"/>
    <path d="M40 84c13-5 27-5 40 0" stroke="#8f7bb2" stroke-width="1.2" fill="none" opacity=".7"/>
    <path d="M50 71c-9 2-16 8-19 18M70 71c9 2 16 8 19 18" stroke="#5d4879" stroke-width="2" fill="none" opacity=".6"/>
    <g stroke="#deccf4" fill="none" opacity=".6">
      <path d="M60 25v30M46 45l10 10M74 45 64 55M60 78v37M47 96l12 8M73 96l-12 8"/>
      <path d="M40 113c8-3 15-2 20 2M80 113c-8-3-15-2-20 2"/>
    </g>
    <path d="M44 137c10-3 22-3 32 0" stroke="#8f7bb2" stroke-width="1" fill="none" opacity=".5"/>
    <g opacity=".5" fill="#b3a0d7"><circle cx="31" cy="55" r="1"/><circle cx="90" cy="48" r=".8"/><circle cx="35" cy="123" r=".7"/></g>`);
}

const PORTRAITS = {
  vesper: heroVesper,
  bram: heroBram,
  moth: heroMoth,
  wren: heroWren,
  pilgrim: enemyPilgrim,
  husk: enemyHusk,
  hound: enemyHound,
  widow: enemyWidow,
  belleater: enemyBellEater,
  unnamed: enemyUnnamed,
  listener: enemyListener,
  echo: enemyEcho,
};

export function portrait(id) {
  const fn = PORTRAITS[id] || PORTRAITS.pilgrim;
  return fn();
}

export function eyeSigil(cls = '') {
  const g = uid('eye');
  return `<svg class="eye-sigil ${cls}" viewBox="0 0 500 500" aria-hidden="true">
    <defs>
      <radialGradient id="${g}i" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#ffe8ad"/><stop offset=".16" stop-color="#dfb56a"/>
        <stop offset=".42" stop-color="#8d5b27"/><stop offset=".73" stop-color="#25150b"/>
        <stop offset="1" stop-color="#070609"/>
      </radialGradient>
      <radialGradient id="${g}h" cx="50%" cy="50%" r="50%">
        <stop offset=".5" stop-color="#dfb56a" stop-opacity=".14"/>
        <stop offset=".78" stop-color="#8d5b27" stop-opacity=".06"/>
        <stop offset="1" stop-color="#070609" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <g class="eye-rings" fill="none" stroke="#d6b26e">
      <ellipse cx="250" cy="250" rx="236" ry="236" opacity=".08"/>
      <ellipse cx="250" cy="250" rx="185" ry="185" opacity=".12" stroke-dasharray="1 12"/>
      <ellipse cx="250" cy="250" rx="139" ry="139" opacity=".16" stroke-dasharray="2 9"/>
    </g>
    <path d="M46 250C110 153 178 107 250 107s140 46 204 143c-64 97-132 143-204 143S110 347 46 250Z" fill="#0b0910" stroke="#ceb17a" stroke-width="1.5" opacity=".9"/>
    <path d="M79 250c56-78 115-116 171-116s115 38 171 116c-56 78-115 116-171 116S135 328 79 250Z" fill="#100c12" stroke="#7a5c33" opacity=".8"/>
    <circle cx="250" cy="250" r="148" fill="url(#${g}h)"/>
    <circle cx="250" cy="250" r="105" fill="url(#${g}i)"/>
    <g class="eye-iris" fill="none" stroke="#f0c982" opacity=".5">
      <ellipse cx="250" cy="250" rx="70" ry="82" stroke-dasharray="1 7"/>
      <ellipse cx="250" cy="250" rx="48" ry="61" stroke-dasharray="1 5"/>
    </g>
    <ellipse cx="250" cy="250" rx="19" ry="61" fill="#050407"/>
    <ellipse cx="250" cy="250" rx="19" ry="61" fill="none" stroke="#f3d290" opacity=".5"/>
    <circle cx="222" cy="218" r="11" fill="#fff4d1" opacity=".65"/>
    <path d="M250 107v-42M250 435v42M46 250H4M496 250h-42M122 122 93 93M378 378l29 29M378 122l29-29M122 378l-29 29" stroke="#d6b26e" stroke-width="1" opacity=".3"/>
    <g fill="#d6b26e" opacity=".55"><circle cx="250" cy="65" r="2"/><circle cx="435" cy="250" r="2"/><circle cx="250" cy="435" r="1.5"/><circle cx="65" cy="250" r="1.5"/></g>
  </svg>`;
}

export function sigilFor(type) {
  const map = {
    battle: 'sword', elite: 'skull', camp: 'fire', reliquary: 'relic',
    whisper: 'eye', boss: 'gate', tell: 'spark', ash: 'ash', heart: 'heart',
  };
  return icon(map[type] || 'spark');
}
