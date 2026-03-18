#!/usr/bin/env node

/**
 * figma-sync.js
 * Surveille le dossier ./tokens, convertit les JSON Figma en index.css oklch, et git push.
 * Usage : node figma-sync.js
 * Dépose un JSON exporté depuis Figma dans ./tokens/ → tout se fait automatiquement.
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOKENS_DIR = path.join(__dirname, 'tokens');
const CSS_OUT    = path.join(__dirname, 'src', 'index.css');

// ── Palette Tailwind raw colors (pour résoudre les alias) ──
const RAW = {
  'neutral': { 50:'#fafafa',100:'#f5f5f5',200:'#e5e5e5',300:'#d4d4d4',400:'#a3a3a3',500:'#737373',600:'#525252',700:'#404040',800:'#262626',900:'#171717',950:'#0a0a0a' },
  'blue':    { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a',950:'#172554' },
  'red':     { 50:'#fef2f2',100:'#ffe2e2',200:'#fecaca',300:'#fca5a5',400:'#f87171',500:'#ef4444',600:'#dc2626',700:'#b91c1c',800:'#991b1b',900:'#7f1d1d',950:'#450a0a' },
  'white':   { 'alpha-100':'#ffffff' },
  'black':   { 'alpha-100':'#000000' },
};

// Résout un alias Figma genre "{brand-shades.500}" → hex
function resolveAlias(val, brandNeutrals = 'neutral', brandShades = 'blue') {
  if (!val || !val.startsWith('{')) return val;
  const ref = val.slice(1, -1); // "brand-shades.500"
  const [group, shade] = ref.split('.');
  const map = {
    'brand-neutrals': RAW[brandNeutrals],
    'brand-shades':   RAW[brandShades],
    'white':          RAW['white'],
    'black':          RAW['black'],
    'red':            RAW['red'],
    'blue':           RAW['blue'],
    'neutral':        RAW['neutral'],
  };
  if (map[group] && shade) return map[group][shade] || '#000000';
  return '#000000';
}

// Convertit hex → oklch (approximation précise)
function hexToOklch(hex) {
  if (!hex || !hex.startsWith('#')) return 'oklch(0 0 0)';
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;

  // sRGB → linear
  const lin = v => v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  const lr = lin(r), lg = lin(g), lb = lin(b);

  // linear → OKLab
  const l_ = Math.cbrt(0.4122214708*lr + 0.5363325363*lg + 0.0514459929*lb);
  const m_ = Math.cbrt(0.2119034982*lr + 0.6806995451*lg + 0.1073969566*lb);
  const s_ = Math.cbrt(0.0883024619*lr + 0.2817188376*lg + 0.6299787005*lb);
  const L = 0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_;
  const a = 1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_;
  const bv= 0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_;

  const C = Math.sqrt(a*a + bv*bv);
  let H = Math.atan2(bv, a) * 180 / Math.PI;
  if (H < 0) H += 360;

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
}

// Parse le JSON sémantique et retourne un objet {token: hex}
function parseSemanticTokens(json, brandShades = 'blue') {
  const result = {};
  function walk(obj, prefix) {
    for (const [k, v] of Object.entries(obj)) {
      if (v && v.$type === 'color') {
        const cssKey = (prefix ? prefix + '-' : '') + k.replace(/\s+/g, '-');
        const hex = resolveAlias(v.$value, 'neutral', brandShades);
        result[cssKey] = hex;
      } else if (v && typeof v === 'object' && !v.$type) {
        walk(v, prefix ? prefix + '-' + k.replace(/\s+/g, '-') : k.replace(/\s+/g, '-'));
      }
    }
  }
  walk(json, '');
  return result;
}

// Génère le index.css complet
function generateCSS(lightTokens, darkTokens) {
  const get = (tokens, key) => {
    const hex = tokens[key] || tokens['general-' + key];
    return hex ? hexToOklch(hex) : null;
  };

  const lp  = get(lightTokens, 'primary')    || 'oklch(0.205 0 0)';
  const lpf = get(lightTokens, 'primary-foreground') || 'oklch(0.985 0 0)';
  const lb  = get(lightTokens, 'background') || 'oklch(1 0 0)';
  const lf  = get(lightTokens, 'foreground') || 'oklch(0.145 0 0)';
  const ls  = get(lightTokens, 'secondary')  || 'oklch(0.97 0 0)';
  const lbr = get(lightTokens, 'border')     || 'oklch(0.922 0 0)';
  const lmu = get(lightTokens, 'muted')      || 'oklch(0.97 0 0)';
  const lmf = get(lightTokens, 'muted-foreground') || 'oklch(0.556 0 0)';
  const ld  = get(lightTokens, 'destructive')|| 'oklch(0.577 0.245 27.325)';

  const dp  = get(darkTokens,  'primary')    || 'oklch(0.922 0 0)';
  const dpf = get(darkTokens,  'primary-foreground') || 'oklch(0.205 0 0)';
  const db  = get(darkTokens,  'background') || 'oklch(0.145 0 0)';
  const df  = get(darkTokens,  'foreground') || 'oklch(0.985 0 0)';
  const ds  = get(darkTokens,  'secondary')  || 'oklch(0.269 0 0)';
  const dbr = get(darkTokens,  'border')     || 'oklch(1 0 0 / 10%)';
  const dmu = get(darkTokens,  'muted')      || 'oklch(0.269 0 0)';
  const dmf = get(darkTokens,  'muted-foreground') || 'oklch(0.708 0 0)';
  const dd  = get(darkTokens,  'destructive')|| 'oklch(0.704 0.191 22.216)';

  return `@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@fontsource-variable/geist";

@custom-variant dark (&:is(.dark *));

/* ── Généré automatiquement par figma-sync.js — ne pas modifier ── */
:root {
    --background: ${lb};
    --foreground: ${lf};
    --card: ${lb};
    --card-foreground: ${lf};
    --popover: ${lb};
    --popover-foreground: ${lf};
    --primary: ${lp};
    --primary-foreground: ${lpf};
    --secondary: ${ls};
    --secondary-foreground: ${lf};
    --muted: ${lmu};
    --muted-foreground: ${lmf};
    --accent: ${ls};
    --accent-foreground: ${lf};
    --destructive: ${ld};
    --border: ${lbr};
    --input: ${lbr};
    --ring: oklch(0.708 0 0);
    --radius: 0.625rem;
    --sidebar: ${lb};
    --sidebar-foreground: ${lf};
    --sidebar-primary: ${lp};
    --sidebar-primary-foreground: ${lpf};
    --sidebar-accent: ${ls};
    --sidebar-accent-foreground: ${lf};
    --sidebar-border: ${lbr};
    --sidebar-ring: oklch(0.708 0 0);
}

.dark {
    --background: ${db};
    --foreground: ${df};
    --card: ${db};
    --card-foreground: ${df};
    --popover: ${db};
    --popover-foreground: ${df};
    --primary: ${dp};
    --primary-foreground: ${dpf};
    --secondary: ${ds};
    --secondary-foreground: ${df};
    --muted: ${dmu};
    --muted-foreground: ${dmf};
    --accent: ${dmu};
    --accent-foreground: ${df};
    --destructive: ${dd};
    --border: ${dbr};
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.556 0 0);
    --sidebar: ${db};
    --sidebar-foreground: ${df};
    --sidebar-primary: ${dp};
    --sidebar-primary-foreground: ${dpf};
    --sidebar-accent: ${ds};
    --sidebar-accent-foreground: ${df};
    --sidebar-border: ${dbr};
    --sidebar-ring: oklch(0.556 0 0);
}

@theme inline {
    --font-sans: 'Geist Variable', sans-serif;
    --color-background: var(--background);
    --color-foreground: var(--foreground);
    --color-card: var(--card);
    --color-card-foreground: var(--card-foreground);
    --color-popover: var(--popover);
    --color-popover-foreground: var(--popover-foreground);
    --color-primary: var(--primary);
    --color-primary-foreground: var(--primary-foreground);
    --color-secondary: var(--secondary);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-muted: var(--muted);
    --color-muted-foreground: var(--muted-foreground);
    --color-accent: var(--accent);
    --color-accent-foreground: var(--accent-foreground);
    --color-destructive: var(--destructive);
    --color-border: var(--border);
    --color-input: var(--input);
    --color-ring: var(--ring);
    --color-sidebar: var(--sidebar);
    --color-sidebar-foreground: var(--sidebar-foreground);
    --color-sidebar-primary: var(--sidebar-primary);
    --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
    --color-sidebar-accent: var(--sidebar-accent);
    --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
    --color-sidebar-border: var(--sidebar-border);
    --color-sidebar-ring: var(--sidebar-ring);
    --radius-sm: calc(var(--radius) * 0.6);
    --radius-md: calc(var(--radius) * 0.8);
    --radius-lg: var(--radius);
    --radius-xl: calc(var(--radius) * 1.4);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
  html { @apply font-sans; }
}
`;
}

// Parse le gros fichier exporté par le plugin (plusieurs JSON concaténés)
function parseExport(raw) {
  const lightMatch = raw.match(/semantic colors\.shadcn\.tokens\.json\s*(\{[\s\S]*?\})\s*(?:semantic colors\.shadcn-dark|$)/);
  const darkMatch  = raw.match(/semantic colors\.shadcn-dark\.tokens\.json\s*(\{[\s\S]*?\})\s*(?:\w|$)/);

  let lightJSON = {}, darkJSON = {};
  try { if (lightMatch) lightJSON = JSON.parse(lightMatch[1]); } catch(e) {}
  try { if (darkMatch)  darkJSON  = JSON.parse(darkMatch[1]);  } catch(e) {}

  return { lightJSON, darkJSON };
}

// Détecte la brand-shades depuis brand colors JSON
function detectBrandShades(raw) {
  const m = raw.match(/brand colors[\s\S]*?"brand-shades"[\s\S]*?"50"[\s\S]*?"\$value":\s*"([^"]+)"/);
  if (!m) return 'blue';
  const val = m[1];
  for (const [name, shades] of Object.entries(RAW)) {
    if (Object.values(shades).includes(val)) return name;
  }
  return 'blue';
}

// ── Traitement d'un fichier JSON ──
function processFile(filePath) {
  console.log(`\n📥 Fichier détecté : ${path.basename(filePath)}`);
  const raw = fs.readFileSync(filePath, 'utf8');

  let lightJSON = {}, darkJSON = {};

  // Format : fichier unique avec tout dedans
  if (raw.includes('semantic colors.shadcn.tokens.json')) {
    const parsed = parseExport(raw);
    lightJSON = parsed.lightJSON;
    darkJSON  = parsed.darkJSON;
  } else {
    // Format : juste le JSON sémantique light
    try { lightJSON = JSON.parse(raw); } catch(e) { console.error('JSON invalide'); return; }
  }

  const brandShades = detectBrandShades(raw);
  console.log(`🎨 Brand shades détecté : ${brandShades}`);

  const lightTokens = parseSemanticTokens(lightJSON, brandShades);
  const darkTokens  = parseSemanticTokens(darkJSON,  brandShades);

  const css = generateCSS(lightTokens, darkTokens);
  fs.writeFileSync(CSS_OUT, css, 'utf8');
  console.log(`✅ index.css mis à jour`);

  // Git push
  try {
    execSync('git add src/index.css', { cwd: __dirname, stdio: 'inherit' });
    execSync(`git commit -m "figma-sync: update tokens"`, { cwd: __dirname, stdio: 'inherit' });
    execSync('git push', { cwd: __dirname, stdio: 'inherit' });
    console.log(`🚀 Pushé sur GitHub → Netlify rebuild en cours`);
  } catch(e) {
    console.log('⚠️  Git push échoué (peut-être rien à committer)');
  }

  // Archive le fichier traité
  const done = path.join(TOKENS_DIR, 'done');
  fs.mkdirSync(done, { recursive: true });
  fs.renameSync(filePath, path.join(done, path.basename(filePath)));
  console.log(`📦 Fichier archivé dans tokens/done/\n`);
}

// ── Watcher ──
fs.mkdirSync(TOKENS_DIR, { recursive: true });
console.log(`👁  figma-sync démarré — dépose un JSON dans ./tokens/ pour déclencher la sync`);
console.log(`📁 Dossier surveillé : ${TOKENS_DIR}\n`);

fs.watch(TOKENS_DIR, (event, filename) => {
  if (!filename || !filename.endsWith('.json')) return;
  const filePath = path.join(TOKENS_DIR, filename);
  setTimeout(() => {
    if (fs.existsSync(filePath)) processFile(filePath);
  }, 500);
});
