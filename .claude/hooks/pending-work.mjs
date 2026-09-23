#!/usr/bin/env node
// Stop hook: when a turn ends with code changed but the session snapshot not
// updated, say so once. The next session reads docs/STATUS.md to know where we
// are, so code that moves without it is how context gets lost.
// Silent as soon as STATUS.md is part of the change set — no nagging.
import { execFileSync } from 'node:child_process';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

let changed = [];
try {
  changed = execFileSync('git', ['status', '--porcelain', '--', 'src', 'supabase'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);
} catch {
  process.exit(0);
}

if (changed.length === 0) process.exit(0);

let statusTouched = '';
try {
  statusTouched = execFileSync('git', ['status', '--porcelain', '--', 'docs/STATUS.md'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
} catch {
  statusTouched = '';
}
if (statusTouched) process.exit(0);

process.stdout.write(
  JSON.stringify({
    systemMessage: `${changed.length} archivo(s) de src/ o supabase/ sin commitear y docs/STATUS.md sin tocar. Antes de cerrar: /verificar y /cerrar-sesion.`,
    suppressOutput: true,
  }),
);
