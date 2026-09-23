#!/usr/bin/env node
// SessionStart hook: inject the project's current state into a fresh session,
// so no one has to re-explain where we left off. Reads docs/STATUS.md (the
// short snapshot) plus the live git state, which STATUS.md cannot know.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

function git(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

let status = '';
try {
  status = readFileSync(path.join(root, 'docs', 'STATUS.md'), 'utf8');
} catch {
  status = '(docs/STATUS.md is missing — recreate it: it is the session entry point.)';
}

const dirty = git(['status', '--porcelain']);
const context = [
  '# habia — estado al iniciar la sesion (hook SessionStart)',
  status,
  '## Git ahora mismo',
  `Rama: ${git(['rev-parse', '--abbrev-ref', 'HEAD']) || 'desconocida'}`,
  `Ultimos commits:\n${git(['log', '-5', '--pretty=format:%h %s']) || '(ninguno)'}`,
  dirty ? `Cambios sin commitear:\n${dirty}` : 'Working tree limpio.',
  'Si el usuario dice "continua" sin mas contexto, propon el primer punto de "Proximos pasos".',
].join('\n\n');

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
    suppressOutput: true,
  }),
);
