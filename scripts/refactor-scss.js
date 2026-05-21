const fs = require('fs');
const path = require('path');
const glob = require('glob');

const root = path.resolve(__dirname, '..');
const pattern = path.join(root, 'src', '**', '*.scss');

const files = glob.sync(pattern, { nodir: true });
console.log('Found', files.length, 'scss files');

const replacements = [
  // remove top legacy variable blocks (common header)
  { re: /\/\/ ===[\s\S]*?\$text-muted: [^;]+;\s*/g, repl: '// TIMQU: migrated to global CSS variables.\n' },
  // ordered replacements
  { re: /\$yellow-bright/g, repl: 'var(--gold-light)' },
  { re: /rgba\(\$yellow\s*,\s*([0-9.]+)\)/g, repl: 'rgba(var(--gold-rgb), $1)' },
  { re: /rgba\(\$yellow\s*,\s*([0-9.]+)\s*\)/g, repl: 'rgba(var(--gold-rgb), $1)' },
  { re: /\$yellow-glow/g, repl: 'rgba(var(--gold-rgb), 0.3)' },
  { re: /\$yellow/g, repl: 'var(--gold)' },
  { re: /\$dark-surface/g, repl: 'var(--card-bg)' },
  { re: /\$dark-card/g, repl: 'var(--card-bg)' },
  { re: /\$bg-card/g, repl: 'var(--card-bg)' },
  { re: /\$bg-card-hover/g, repl: 'var(--card-bg-hover)' },
  { re: /\$dark-border/g, repl: 'var(--border-color)' },
  { re: /\$border\b/g, repl: 'var(--border-color)' },
  { re: /\$text-primary/g, repl: 'var(--text-color)' },
  { re: /\$text-secondary/g, repl: 'var(--text-secondary)' },
  { re: /\$text-muted/g, repl: 'var(--muted-color)' },
  { re: /\$dark-bg/g, repl: 'var(--bg-color)' },
  { re: /\$bg\b/g, repl: 'var(--bg-color)' },
  { re: /\$white-muted/g, repl: 'var(--white-muted)' },
  { re: /\$white\b/g, repl: 'var(--white)' },
  { re: /\$online-green/g, repl: 'var(--online-green)' },
  { re: /\$danger/g, repl: 'var(--color-danger)' },
  { re: /\$header-height/g, repl: 'var(--header-height)' },
];

files.forEach(file => {
  let src = fs.readFileSync(file, 'utf8');
  let out = src;
  replacements.forEach(r => {
    out = out.replace(r.re, r.repl);
  });
  if (out !== src) {
    fs.writeFileSync(file, out, 'utf8');
    console.log('Updated', file);
  }
});

console.log('Done');
