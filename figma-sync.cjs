#!/usr/bin/env node

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOKENS_DIR = path.join(__dirname, 'tokens');
const CSS_OUT    = path.join(__dirname, 'src', 'tokens.css'); // fichier séparé !

const RAW = {
  neutral:  {50:'#fafafa',100:'#f5f5f5',200:'#e5e5e5',300:'#d4d4d4',400:'#a3a3a3',500:'#737373',600:'#525252',700:'#404040',800:'#262626',900:'#171717',950:'#0a0a0a'},
  slate:    {50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a',950:'#020617'},
  gray:     {50:'#f9fafb',100:'#f3f4f6',200:'#e5e7eb',300:'#d1d5db',400:'#9ca3af',500:'#6b7280',600:'#4b5563',700:'#374151',800:'#1f2937',900:'#111827',950:'#030712'},
  zinc:     {50:'#fafafa',100:'#f4f4f5',200:'#e4e4e7',300:'#d4d4d8',400:'#a1a1aa',500:'#71717a',600:'#52525b',700:'#3f3f46',800:'#27272a',900:'#18181b',950:'#09090b'},
  stone:    {50:'#fafaf9',100:'#f5f5f4',200:'#e7e5e4',300:'#d6d3d1',400:'#a8a29e',500:'#78716c',600:'#57534e',700:'#44403c',800:'#292524',900:'#1c1917',950:'#0c0a09'},
  red:      {50:'#fef2f2',100:'#ffe2e2',200:'#fecaca',300:'#fca5a5',400:'#f87171',500:'#ef4444',600:'#dc2626',700:'#b91c1c',800:'#991b1b',900:'#7f1d1d',950:'#450a0a'},
  orange:   {50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12',950:'#431407'},
  amber:    {50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f',950:'#451a03'},
  yellow:   {50:'#fefce8',100:'#fef9c3',200:'#fef08a',300:'#fde047',400:'#facc15',500:'#eab308',600:'#ca8a04',700:'#a16207',800:'#854d0e',900:'#713f12',950:'#422006'},
  lime:     {50:'#f7fee7',100:'#ecfccb',200:'#d9f99d',300:'#bef264',400:'#a3e635',500:'#84cc16',600:'#65a30d',700:'#4d7c0f',800:'#3f6212',900:'#365314',950:'#1a2e05'},
  green:    {50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d',950:'#052e16'},
  emerald:  {50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857',800:'#065f46',900:'#064e3b',950:'#022c22'},
  teal:     {50:'#f0fdfa',100:'#ccfbf1',200:'#99f6e4',300:'#5eead4',400:'#2dd4bf',500:'#14b8a6',600:'#0d9488',700:'#0f766e',800:'#115e59',900:'#134e4a',950:'#042f2e'},
  cyan:     {50:'#ecfeff',100:'#cffafe',200:'#a5f3fc',300:'#67e8f9',400:'#22d3ee',500:'#06b6d4',600:'#0891b2',700:'#0e7490',800:'#155e75',900:'#164e63',950:'#083344'},
  sky:      {50:'#f0f9ff',100:'#e0f2fe',200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1',800:'#075985',900:'#0c4a6e',950:'#082f49'},
  blue:     {50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a',950:'#172554'},
  indigo:   {50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81',950:'#1e1b4b'},
  violet:   {50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',300:'#c4b5fd',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9',800:'#5b21b6',900:'#4c1d95',950:'#2e1065'},
  purple:   {50:'#faf5ff',100:'#f3e8ff',200:'#e9d5ff',300:'#d8b4fe',400:'#c084fc',500:'#a855f7',600:'#9333ea',700:'#7e22ce',800:'#6b21a8',900:'#581c87',950:'#3b0764'},
  fuchsia:  {50:'#fdf4ff',100:'#fae8ff',200:'#f5d0fe',300:'#f0abfc',400:'#e879f9',500:'#d946ef',600:'#c026d3',700:'#a21caf',800:'#86198f',900:'#701a75',950:'#4a044e'},
  pink:     {50:'#fdf2f8',100:'#fce7f3',200:'#fbcfe8',300:'#f9a8d4',400:'#f472b6',500:'#ec4899',600:'#db2777',700:'#be185d',800:'#9d174d',900:'#831843',950:'#500724'},
  rose:     {50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3',300:'#fda4af',400:'#fb7185',500:'#f43f5e',600:'#e11d48',700:'#be123c',800:'#9f1239',900:'#881337',950:'#4c0519'},
  white:    {'alpha-100':'#ffffff','alpha-0':'rgba(255,255,255,0)','alpha-5':'rgba(255,255,255,0.05)','alpha-10':'rgba(255,255,255,0.1)','alpha-60':'rgba(255,255,255,0.6)'},
  black:    {'alpha-100':'#000000','alpha-0':'rgba(0,0,0,0)','alpha-5':'rgba(0,0,0,0.05)','alpha-10':'rgba(0,0,0,0.1)','alpha-60':'rgba(0,0,0,0.6)'},
};

function resolveAlias(val, brandNeutrals, brandShades) {
  if (!val || !val.startsWith('{')) return val;
  const ref = val.slice(1,-1);
  const parts = ref.split('.');
  const group = parts[0];
  const shade = parts.slice(1).join('.');
  const map = {
    'brand-neutrals': RAW[brandNeutrals] || RAW.neutral,
    'brand-shades':   RAW[brandShades]   || RAW.blue,
  };
  const palette = map[group] || RAW[group];
  if (palette && shade) return palette[shade] || '#000000';
  return '#000000';
}

function hexToOklch(hex) {
  if (!hex || !hex.startsWith('#')) return null;
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const lin = v => v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4);
  const lr=lin(r), lg=lin(g), lb=lin(b);
  const l_=Math.cbrt(0.4122214708*lr+0.5363325363*lg+0.0514459929*lb);
  const m_=Math.cbrt(0.2119034982*lr+0.6806995451*lg+0.1073969566*lb);
  const s_=Math.cbrt(0.0883024619*lr+0.2817188376*lg+0.6299787005*lb);
  const L=0.2104542553*l_+0.7936177850*m_-0.0040720468*s_;
  const a=1.9779984951*l_-2.4285922050*m_+0.4505937099*s_;
  const bv=0.0259040371*l_+0.7827717662*m_-0.8086757660*s_;
  const C=Math.sqrt(a*a+bv*bv);
  let H=Math.atan2(bv,a)*180/Math.PI;
  if(H<0)H+=360;
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
}

function parseSemanticTokens(json, brandNeutrals, brandShades) {
  const result = {};
  function walk(obj, prefix) {
    for (const [k,v] of Object.entries(obj)) {
      if (v && v.$type === 'color') {
        const cssKey = (prefix ? prefix+'-' : '') + k.replace(/\s+/g,'-');
        result[cssKey] = resolveAlias(v.$value, brandNeutrals, brandShades);
      } else if (v && typeof v === 'object' && !v.$type) {
        walk(v, prefix ? prefix+'-'+k.replace(/\s+/g,'-') : k.replace(/\s+/g,'-'));
      }
    }
  }
  walk(json, '');
  return result;
}

function generateTokensCSS(lightTokens, darkTokens) {
  const get = (tokens, key) => {
    const hex = tokens[key] || tokens['general-'+key];
    return hex ? hexToOklch(hex) : null;
  };

  const lp  = get(lightTokens,'primary')            || 'oklch(0.205 0 0)';
  const lpf = get(lightTokens,'primary-foreground') || 'oklch(0.985 0 0)';
  const lb  = get(lightTokens,'background')         || 'oklch(1 0 0)';
  const lf  = get(lightTokens,'foreground')         || 'oklch(0.145 0 0)';
  const ls  = get(lightTokens,'secondary')          || 'oklch(0.97 0 0)';
  const lbr = get(lightTokens,'border')             || 'oklch(0.922 0 0)';
  const lmu = get(lightTokens,'muted')              || 'oklch(0.97 0 0)';
  const lmf = get(lightTokens,'muted-foreground')   || 'oklch(0.556 0 0)';
  const ld  = get(lightTokens,'destructive')        || 'oklch(0.577 0.245 27.325)';

  const dp  = get(darkTokens, 'primary')            || 'oklch(0.922 0 0)';
  const dpf = get(darkTokens, 'primary-foreground') || 'oklch(0.205 0 0)';
  const db  = get(darkTokens, 'background')         || 'oklch(0.145 0 0)';
  const df  = get(darkTokens, 'foreground')         || 'oklch(0.985 0 0)';
  const ds  = get(darkTokens, 'secondary')          || 'oklch(0.269 0 0)';
  const dbr = get(darkTokens, 'border')             || 'oklch(0.269 0 0)';
  const dmu = get(darkTokens, 'muted')              || 'oklch(0.269 0 0)';
  const dmf = get(darkTokens, 'muted-foreground')   || 'oklch(0.708 0 0)';
  const dd  = get(darkTokens, 'destructive')        || 'oklch(0.704 0.191 22.216)';

  // Ce fichier est chargé APRÈS shadcn/tailwind.css donc il écrase bien les valeurs
  return `/* tokens.css — généré par figma-sync.cjs */
/* Chargé après shadcn pour écraser les valeurs par défaut */

:root {
  --background: ${lb} !important;
  --foreground: ${lf} !important;
  --primary: ${lp} !important;
  --primary-foreground: ${lpf} !important;
  --secondary: ${ls} !important;
  --secondary-foreground: ${lf} !important;
  --muted: ${lmu} !important;
  --muted-foreground: ${lmf} !important;
  --accent: ${ls} !important;
  --accent-foreground: ${lf} !important;
  --destructive: ${ld} !important;
  --border: ${lbr} !important;
  --input: ${lbr} !important;
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
  --card: ${lb} !important;
  --card-foreground: ${lf} !important;
  --popover: ${lb} !important;
  --popover-foreground: ${lf} !important;
  --sidebar: ${lb} !important;
  --sidebar-foreground: ${lf} !important;
  --sidebar-primary: ${lp} !important;
  --sidebar-primary-foreground: ${lpf} !important;
  --sidebar-accent: ${ls} !important;
  --sidebar-accent-foreground: ${lf} !important;
  --sidebar-border: ${lbr} !important;
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: ${db} !important;
  --foreground: ${df} !important;
  --primary: ${dp} !important;
  --primary-foreground: ${dpf} !important;
  --secondary: ${ds} !important;
  --secondary-foreground: ${df} !important;
  --muted: ${dmu} !important;
  --muted-foreground: ${dmf} !important;
  --accent: ${dmu} !important;
  --accent-foreground: ${df} !important;
  --destructive: ${dd} !important;
  --border: ${dbr} !important;
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --card: ${db} !important;
  --card-foreground: ${df} !important;
  --sidebar: ${db} !important;
  --sidebar-foreground: ${df} !important;
  --sidebar-primary: ${dp} !important;
  --sidebar-primary-foreground: ${dpf} !important;
}
`;
}

function parseExport(raw) {
  const lightMatch = raw.match(/semantic colors\.shadcn\.tokens\.json\s*(\{[\s\S]*?\n\})\s*(?:semantic colors\.shadcn-dark|brand colors|typography|\-\-\-)/);
  const darkMatch  = raw.match(/semantic colors\.shadcn-dark\.tokens\.json\s*(\{[\s\S]*?\n\})\s*(?:brand colors|typography|\-\-\-)/);
  let lightJSON = {}, darkJSON = {};
  try { if (lightMatch) lightJSON = JSON.parse(lightMatch[1]); } catch(e) {}
  try { if (darkMatch)  darkJSON  = JSON.parse(darkMatch[1]);  } catch(e) {}
  return { lightJSON, darkJSON };
}

function detectBrandShades(raw) {
  const m = raw.match(/brand colors[\s\S]{0,500}"brand-shades"[\s\S]{0,200}"50"[\s\S]{0,100}"\$value":\s*"\{(\w+)\.50\}"/);
  if (m) return m[1];
  return 'blue';
}

function processFile(filePath) {
  console.log(`\n📥 Fichier : ${path.basename(filePath)}`);
  const raw = fs.readFileSync(filePath, 'utf8');

  let lightJSON = {}, darkJSON = {};
  if (raw.includes('semantic colors.shadcn.tokens.json')) {
    const parsed = parseExport(raw);
    lightJSON = parsed.lightJSON;
    darkJSON  = parsed.darkJSON;
  } else {
    try { lightJSON = JSON.parse(raw); } catch(e) { console.error('JSON invalide'); return; }
  }

  const brandShades = detectBrandShades(raw);
  console.log(`🎨 Brand shades : ${brandShades}`);

  const lightTokens = parseSemanticTokens(lightJSON, 'neutral', brandShades);
  const darkTokens  = parseSemanticTokens(darkJSON,  'neutral', brandShades);

  const primary = lightTokens['general-primary'] || lightTokens['primary'];
  console.log(`🔵 Primary : ${primary} → ${hexToOklch(primary)}`);

  const css = generateTokensCSS(lightTokens, darkTokens);
  fs.writeFileSync(CSS_OUT, css, 'utf8');
  console.log(`✅ src/tokens.css mis à jour`);

  try {
    execSync('git add src/tokens.css', { cwd: __dirname, stdio: 'inherit' });
    execSync('git commit -m "figma-sync: update tokens"', { cwd: __dirname, stdio: 'inherit' });
    execSync('git push', { cwd: __dirname, stdio: 'inherit' });
    console.log(`🚀 Pushé → Netlify rebuild en cours`);
  } catch(e) {
    console.log('⚠️  Git push échoué');
  }

  const done = path.join(TOKENS_DIR, 'done');
  fs.mkdirSync(done, { recursive: true });
  fs.renameSync(filePath, path.join(done, Date.now() + '-' + path.basename(filePath)));
  console.log(`📦 Archivé\n`);
}

fs.mkdirSync(TOKENS_DIR, { recursive: true });
console.log(`👁  figma-sync démarré`);
console.log(`📁 Surveille : ${TOKENS_DIR}\n`);

fs.watch(TOKENS_DIR, (event, filename) => {
  if (!filename || !filename.endsWith('.json')) return;
  const filePath = path.join(TOKENS_DIR, filename);
  setTimeout(() => {
    if (fs.existsSync(filePath)) processFile(filePath);
  }, 500);
});
