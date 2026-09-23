#!/usr/bin/env node
// PreToolUse hook (Write|Edit): protect two invariants that are easy to break
// by accident and expensive to undo.
//   1. Secrets never get written into the repo (.env files are the only place
//      they live, and they are gitignored).
//   2. A migration that is already committed has been applied to the cloud
//      database. Editing it makes the SQL files and the real schema diverge:
//      schema changes must go into a NEW migration.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

function decide(decision, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0); // never block on a hook of our own making
}

const filePath = payload?.tool_input?.file_path;
if (typeof filePath !== 'string' || filePath.length === 0) process.exit(0);

const rel = path.relative(root, filePath).split(path.sep).join('/');

if (/(^|\/)\.env(\.|$)/.test(rel)) {
  decide('deny', 'Los secretos viven solo en .env, escrito por el usuario. Claude no lo edita.');
}

if (/^supabase\/migrations\/.+\.sql$/.test(rel)) {
  let tracked = false;
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', rel], { cwd: root, stdio: 'ignore' });
    tracked = true;
  } catch {
    tracked = false; // new, unapplied migration: free to edit
  }
  if (tracked) {
    decide(
      'ask',
      `${rel} ya esta commiteada, es decir aplicada a la base de datos en la nube. La convencion del proyecto (CLAUDE.md) es crear una migracion nueva con "npx supabase migration new <nombre>" en vez de editar una aplicada. Aprueba solo si sabes que esta migracion nunca se aplico.`,
    );
  }
}
