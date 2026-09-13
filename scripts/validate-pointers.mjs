// Checks src/data/pointers.json against the voice rules in looking-app-spec.md §9.
// Run: node scripts/validate-pointers.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '..', 'src', 'data', 'pointers.json');
const data = JSON.parse(readFileSync(file, 'utf-8'));

const BANNED = [
  'awareness', 'aware', 'consciousness', 'conscious', 'presence', 'present moment',
  'the witness', 'witness to', 'the observer', 'observer of', 'the self', 'the Self',
  'ego', 'soul', 'god', 'brahman', 'oneness', 'the void', 'enlighten', 'truth',
  'energy', 'vibration', 'the universe', 'divine', 'sacred', 'journey',
];

let errors = 0;
const ids = new Set();
const firstLines = new Map();

for (const p of data.pointers) {
  if (ids.has(p.id)) {
    console.error(`DUPLICATE ID: ${p.id}`);
    errors++;
  }
  ids.add(p.id);

  if (p.lines.length < 3 || p.lines.length > 6) {
    console.error(`${p.id}: ${p.lines.length} lines (must be 3-6)`);
    errors++;
  }

  const full = p.lines.map((l) => l.t).join(' ');
  const lower = full.toLowerCase();
  for (const word of BANNED) {
    // Word-boundary match so e.g. "ego" doesn't flag "negotiated".
    // Multi-word phrases (e.g. "the witness") have no boundary concern.
    const pattern = /^[a-z]+$/.test(word) ? `\\b${word}\\b` : word;
    if (new RegExp(pattern).test(lower)) {
      console.error(`${p.id}: banned word "${word}" in: ${full}`);
      errors++;
    }
  }

  const first = p.lines[0].t.trim();
  if (firstLines.has(first)) {
    console.error(`${p.id}: opening line duplicates ${firstLines.get(first)}: "${first}"`);
    errors++;
  }
  firstLines.set(first, p.id);

  for (const line of p.lines) {
    if (!line.t || !line.t.trim()) {
      console.error(`${p.id}: empty line`);
      errors++;
    }
    if (line.hold !== undefined && (line.hold < 1 || line.hold > 3.5)) {
      console.error(`${p.id}: hold ${line.hold} out of expected range`);
      errors++;
    }
  }
}

console.log(`${data.pointers.length} pointers checked.`);
if (errors > 0) {
  console.error(`${errors} issue(s) found.`);
  process.exit(1);
} else {
  console.log('All checks passed.');
}
