#!/bin/sh
set -eu
[ "$(node --version)" = v26.12.1 ] || { echo 'Use Node 26.12.1 from .node-version, then npm ci.' >&2; exit 1; }
[ "$(npm --version)" = 11.12.0 ] || { echo 'Use npm 11.12.0, then npm ci.' >&2; exit 1; }
for tool in prettier eslint tsc vitest; do
  [ -x "node_modules/.bin/$tool" ] || { echo "Missing $tool. Run npm ci before pushing." >&2; exit 1; }
done
# Whole-project scopes include deleted files, shared config and unknown bases.
./node_modules/.bin/prettier --check .
./node_modules/.bin/eslint .
npm run typecheck
npm test
