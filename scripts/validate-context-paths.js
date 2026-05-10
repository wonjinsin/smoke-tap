#!/usr/bin/env node
/**
 * Validate that path-shaped tokens in context docs resolve to real files.
 *
 * Targets: CLAUDE.md, README.md, MEMORY.md, ARCHITECTURE.md, <module>/CLAUDE.md
 * Exits 0 if all paths exist, 1 otherwise.
 *
 * Skip a single line by placing `<!-- skip-validate-next -->` immediately above it.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const TOP_TARGETS = ['CLAUDE.md', 'README.md', 'MEMORY.md', 'ARCHITECTURE.md'];

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', '.expo', '.worktrees', '.claude',
  'ios', // includes Pods/build/etc.
]);

const SKIP_TOKEN_PATTERNS = [
  /^https?:\/\//,
  /^@\//,                     // TS path alias
  /^group\.com\./,            // App Group ID
  /[<>]/,                     // placeholder syntax
  /^[A-Z][a-zA-Z0-9_]*\.[A-Z]/, // identifier.IDENTIFIER (e.g. C.BG)
];

const KNOWN_EXTS = /\.(ts|tsx|js|jsx|json|md|yml|yaml|swift|png|jpg|jpeg|svg|css|html|sh|py|sql|plist|pbxproj|entitlements|h|m|mm|gradle|properties|xml|toml)$/i;

function findModuleClaudeMd(root) {
  const out = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.')) continue;
    const p = path.join(entry.name, 'CLAUDE.md');
    if (fs.existsSync(path.join(root, p))) out.push(p);
  }
  return out;
}

function looksLikePath(token) {
  if (token.length < 2 || token.length > 200) return false;
  if (/\s/.test(token)) return false;
  if (token.includes('/')) return true;
  return KNOWN_EXTS.test(token);
}

function shouldSkip(token) {
  return SKIP_TOKEN_PATTERNS.some((p) => p.test(token));
}

function pathExists(token) {
  const cleaned = token.replace(/[#?].*$/, '').replace(/\/$/, '');
  if (!cleaned) return true;
  return fs.existsSync(path.resolve(ROOT, cleaned));
}

function extractCandidates(line) {
  const out = new Set();
  for (const m of line.matchAll(/`([^`]+)`/g)) out.add(m[1]);
  for (const m of line.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) out.add(m[1]);
  for (const m of line.matchAll(/<code>([^<]+)<\/code>/g)) out.add(m[1]);
  return [...out];
}

const targets = [
  ...TOP_TARGETS.filter((f) => fs.existsSync(path.join(ROOT, f))),
  ...findModuleClaudeMd(ROOT),
];

const broken = [];

for (const target of targets) {
  const lines = fs.readFileSync(path.join(ROOT, target), 'utf8').split('\n');
  let skipNext = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/<!--\s*skip-validate-next\s*-->/.test(line)) { skipNext = true; continue; }
    if (skipNext) { skipNext = false; continue; }
    for (const c of extractCandidates(line)) {
      const t = c.trim();
      if (!looksLikePath(t)) continue;
      if (shouldSkip(t)) continue;
      if (!pathExists(t)) broken.push({ file: target, line: i + 1, token: t });
    }
  }
}

if (broken.length === 0) {
  console.log(`✓ All context paths resolve. (${targets.length} files checked)`);
  process.exit(0);
}

for (const b of broken) console.log(`${b.file}:${b.line}: ${b.token}`);
console.log(`\n✗ ${broken.length} broken path(s) across ${targets.length} files.`);
process.exit(1);
