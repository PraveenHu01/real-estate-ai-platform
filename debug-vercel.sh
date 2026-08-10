#!/usr/bin/env bash
# debug-vercel.sh — why does localhost work but Vercel not?
#
# Tuned for THIS repo: Vite SPA in frontend/, Express serverless fn in api/,
# monorepo root owns install+build. No Next.js anywhere, so there is no
# `next build` and no NEXT_PUBLIC_* — the public prefix here is VITE_.
#
# Usage:  bash debug-vercel.sh          (add --build to run the real Vite build)
set -uo pipefail

RED=$'\033[31m'; GRN=$'\033[32m'; YLW=$'\033[33m'; CYN=$'\033[36m'; DIM=$'\033[2m'; RST=$'\033[0m'
PASS=0; FAIL=0; WARN=0
ok()   { printf '%s✅ %s%s\n' "$GRN" "$1" "$RST"; PASS=$((PASS+1)); }
bad()  { printf '%s❌ %s%s\n' "$RED" "$1" "$RST"; [ $# -gt 1 ] && printf '   %s↳ %s%s\n' "$DIM" "$2" "$RST"; FAIL=$((FAIL+1)); }
warn() { printf '%s⚠️  %s%s\n' "$YLW" "$1" "$RST"; [ $# -gt 1 ] && printf '   %s↳ %s%s\n' "$DIM" "$2" "$RST"; WARN=$((WARN+1)); }
head2(){ printf '\n%s── %s ──%s\n' "$CYN" "$1" "$RST"; }

cd "$(dirname "$0")" || exit 1
RUN_BUILD=0; [ "${1:-}" = "--build" ] && RUN_BUILD=1

head2 "1. Git: is your work actually pushed?"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  bad "Not a git repository" "Vercel deploys from git. Run: git init && git remote add origin <url>"
else
  DIRTY=$(git status --porcelain 2>/dev/null)
  if [ -n "$DIRTY" ]; then
    bad "Uncommitted changes — Vercel cannot see these" "$(printf '%s' "$DIRTY" | wc -l | tr -d ' ') file(s). This is the #1 cause."
    printf '%s%s%s\n' "$DIM" "$(printf '%s' "$DIRTY" | sed 's/^/     /')" "$RST"
  else
    ok "Working tree clean"
  fi

  # Untracked files that committed code require = MODULE_NOT_FOUND on Vercel.
  UNTRACKED=$(git ls-files --others --exclude-standard -- '*.js' '*.jsx' 2>/dev/null)
  if [ -n "$UNTRACKED" ]; then
    HITS=""
    while IFS= read -r f; do
      [ -z "$f" ] && continue
      base=$(basename "$f"); base="${base%.*}"
      # Does any TRACKED file import/require this untracked module?
      if git grep -qE "(require|from)[^\"']*['\"][^\"']*/${base}['\"]" -- '*.js' '*.jsx' 2>/dev/null; then
        HITS="${HITS}${f} "
      fi
    done <<< "$UNTRACKED"
    if [ -n "$HITS" ]; then
      bad "Untracked file(s) imported by committed code" "Will throw MODULE_NOT_FOUND on Vercel: $HITS"
      printf '   %sFix: git add %s%s\n' "$DIM" "$HITS" "$RST"
    else
      warn "Untracked source files present (not imported by tracked code)" "$(printf '%s' "$UNTRACKED" | tr '\n' ' ')"
    fi
  else
    ok "No untracked source files"
  fi

  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  printf '   %sbranch: %s%s\n' "$DIM" "$BRANCH" "$RST"
  if UP=$(git rev-parse --abbrev-ref '@{upstream}' 2>/dev/null); then
    git fetch --quiet 2>/dev/null || warn "git fetch failed (offline?)" "ahead/behind may be stale"
    AHEAD=$(git rev-list --count "${UP}..HEAD" 2>/dev/null || echo 0)
    BEHIND=$(git rev-list --count "HEAD..${UP}" 2>/dev/null || echo 0)
    if [ "$AHEAD" != "0" ]; then
      bad "$AHEAD local commit(s) never pushed to $UP" "Fix: git push"
    else
      ok "In sync with $UP"
    fi
    [ "$BEHIND" != "0" ] && warn "$BEHIND commit(s) behind $UP" "Someone else pushed; git pull --rebase"
  else
    bad "Branch '$BRANCH' has no upstream" "Fix: git push -u origin $BRANCH"
  fi

  printf '   %sHEAD: %s  %s%s\n' "$DIM" "$(git rev-parse --short HEAD)" "$(git log -1 --pretty=%s | cut -c1-56)" "$RST"

  # Vercel only auto-deploys its Production Branch. Warn on the classic mismatch.
  if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
    warn "On '$BRANCH' — pushes here create PREVIEW deploys, not production" "Production URL only updates from your Production Branch."
  fi
fi

head2 "2. Stale local Vercel build (the --prebuilt trap)"

if [ -d .vercel/output ]; then
  bad ".vercel/output/ exists — a stale local build is on disk" "If you deploy with 'vercel deploy --prebuilt', Vercel ships THIS instead of building your new code."
  if find .vercel/output -name '*win32*' -o -name '*msvc*' 2>/dev/null | grep -q .; then
    bad "Prebuilt output contains Windows-only native binaries" "$(find .vercel/output -name '*win32*' -o -name '*msvc*' 2>/dev/null | head -1 | xargs -r basename) cannot load on Vercel's Linux runtime."
  fi
  printf '   %sFix: rm -rf .vercel/output   then deploy WITHOUT --prebuilt%s\n' "$DIM" "$RST"
else
  ok "No stale .vercel/output"
fi

head2 "3. Env vars: VITE_* are baked in at BUILD time"

# Vite inlines import.meta.env.VITE_* into the bundle when `vite build` runs.
# A var added to the Vercel dashboard AFTER the last build is not in the JS.
for f in frontend/.env frontend/.env.local .env.local; do
  [ -f "$f" ] || continue
  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    bad "$f is TRACKED by git" "Secrets in history. Fix: git rm --cached $f"
  fi
  VITE_VARS=$(grep -oE '^\s*VITE_[A-Z0-9_]+' "$f" 2>/dev/null | tr -d ' ' || true)
  if [ -n "$VITE_VARS" ]; then
    printf '   %s%s declares: %s%s\n' "$DIM" "$f" "$(printf '%s' "$VITE_VARS" | tr '\n' ' ')" "$RST"
  fi
done

# The specific footgun in this repo: setting VITE_API_BASE_URL breaks cookies.
if grep -rqE '^\s*VITE_API_BASE_URL=.+' frontend/.env frontend/.env.local 2>/dev/null; then
  bad "VITE_API_BASE_URL is SET" "This repo proxies /api same-origin. A full URL makes auth cross-site and drops HttpOnly cookies. Leave it unset."
else
  ok "VITE_API_BASE_URL unset (correct — same-origin /api)"
fi

# Name drift: only VITE_ML_BASE_URL is read by the code.
if grep -rqE '^\s*VITE_ML_SERVICE_URL=' frontend/.env frontend/.env.local 2>/dev/null; then
  bad "VITE_ML_SERVICE_URL is set but nothing reads it" "Code reads VITE_ML_BASE_URL (frontend/src/services/api.js). Rename it."
fi

# http:// ML URL is blocked as mixed content once the site is https.
if grep -rqE '^\s*VITE_ML_BASE_URL=http://' frontend/.env frontend/.env.local 2>/dev/null; then
  warn "VITE_ML_BASE_URL uses http://" "Browsers block http from an https page. Must be https in production."
fi

# Any VITE_* referenced in source but declared nowhere -> undefined in prod.
USED=$(grep -rhoE 'import\.meta\.env\.VITE_[A-Z0-9_]+' frontend/src 2>/dev/null | sed 's/.*env\.//' | sort -u || true)
for v in $USED; do
  if ! grep -rqE "^\s*${v}=" frontend/.env frontend/.env.local 2>/dev/null; then
    printf '   %s%s used in code, not in a local .env (falls back to default)%s\n' "$DIM" "$v" "$RST"
  fi
done

head2 "4. Server-side env (must exist in Vercel dashboard)"

# These are read by the Express function at RUNTIME — never VITE_-prefixed,
# never in the bundle. Missing DATABASE_URL = 500 on every /api call.
for v in DATABASE_URL JWT_ACCESS_SECRET JWT_REFRESH_SECRET ENCRYPTION_KEY EMAIL_HMAC_KEY; do
  if grep -qE "^\s*${v}=" backend/.env 2>/dev/null; then
    printf '   %s%-20s present locally → must ALSO be in Vercel%s\n' "$DIM" "$v" "$RST"
  else
    warn "$v missing from backend/.env" "Runtime will fail if it is also absent in Vercel."
  fi
done
printf '   %sVerify: vercel env ls    (Settings → Environment Variables)%s\n' "$DIM" "$RST"

head2 "5. Case sensitivity (Windows/macOS lie, Vercel's Linux does not)"

CASE_BAD=0
# Compare each relative import against the real on-disk filename. A path that
# resolves case-insensitively but not exactly is the classic Windows->Linux bug.
while IFS= read -r line; do
  file="${line%%:*}"; rest="${line#*:}"
  imp=$(printf '%s' "$rest" | grep -oE "'(\.[^']+)'" | tr -d "'" | head -1)
  [ -z "$imp" ] && continue
  dir=$(dirname "$file")
  found=0
  for ext in "" .js .jsx .json; do
    [ -e "$dir/$imp$ext" ] && { found=1; break; }
  done
  if [ "$found" = "0" ]; then
    base=$(basename "$imp")
    real=$(find "$dir" -maxdepth 2 -iname "${base}.js" -o -maxdepth 2 -iname "${base}.jsx" 2>/dev/null | head -1)
    [ -n "$real" ] && { bad "Case mismatch '$imp' in $file" "real: $(basename "$real")"; CASE_BAD=1; }
  fi
done < <(grep -rnE "^import .*from '\.\.?/" frontend/src --include=*.jsx --include=*.js 2>/dev/null)
[ "$CASE_BAD" = "0" ] && ok "All relative imports match on-disk casing"

head2 "6. Client-side crashes (blank white page)"

# Module-scope window/document/localStorage runs during render on any host.
RISK=$(grep -rnE '^\s*(const|let|var)\s+\w+\s*=\s*(window|document|localStorage|sessionStorage)\.' \
       frontend/src --include=*.jsx --include=*.js 2>/dev/null | head -5 || true)
if [ -n "$RISK" ]; then
  warn "Browser global at module scope"; printf '%s%s%s\n' "$DIM" "$(printf '%s' "$RISK" | sed 's/^/     /')" "$RST"
else
  ok "No module-scope browser globals"
fi

# lucide-react icons that do not exist import as undefined -> blank page, no build error.
if [ -f frontend/check-icons.cjs ]; then
  if (cd frontend && node check-icons.cjs >/dev/null 2>&1); then ok "lucide-react icon imports all resolve"
  else bad "Missing lucide-react icon" "Run: cd frontend && node check-icons.cjs"; fi
fi

head2 "7. Vercel config sanity"

if [ -f vercel.json ]; then
  node -e 'JSON.parse(require("fs").readFileSync("vercel.json","utf8"))' 2>/dev/null \
    && ok "vercel.json is valid JSON" || bad "vercel.json is INVALID JSON" "Vercel ignores it or fails the build."
  grep -q '"outputDirectory"' vercel.json && ok "outputDirectory set" \
    || warn "no outputDirectory" "Vercel may publish the wrong folder."
  # An SPA catch-all that swallows /assets breaks every hashed JS/CSS file.
  grep -q 'assets' vercel.json && ok "SPA rewrite excludes /assets" \
    || warn "SPA rewrite may swallow /assets/*" "Hashed bundles would 404 → blank page."
else
  warn "No vercel.json" "Relying on dashboard settings only."
fi

if [ -f .vercel/project.json ]; then
  NODE_V=$(grep -oE '"nodeVersion"\s*:\s*"[^"]+"' .vercel/project.json | grep -oE '[0-9]+\.x' || true)
  ENG_V=$(grep -oE '"node"\s*:\s*"[^"]+"' package.json | grep -oE '[0-9]+\.x' || true)
  if [ -n "$NODE_V" ] && [ -n "$ENG_V" ] && [ "$NODE_V" != "$ENG_V" ]; then
    bad "Node mismatch: Vercel $NODE_V vs package.json engines $ENG_V" "Align them; native modules (@node-rs/argon2) break across majors."
  elif [ -n "$NODE_V" ]; then
    ok "Node version aligned ($NODE_V)"
  fi
fi

head2 "8. Production build (what Vercel actually runs)"

if [ "$RUN_BUILD" = "1" ]; then
  printf '   %s$ npm run build%s\n' "$DIM" "$RST"
  if OUT=$(npm run build 2>&1); then
    ok "Build succeeded"
    printf '%s%s%s\n' "$DIM" "$(printf '%s' "$OUT" | tail -6 | sed 's/^/     /')" "$RST"
  else
    bad "BUILD FAILED — this is why Vercel serves old code"
    printf '%s%s%s\n' "$DIM" "$(printf '%s' "$OUT" | tail -25 | sed 's/^/     /')" "$RST"
  fi
else
  printf '   %sskipped — re-run with: bash debug-vercel.sh --build%s\n' "$DIM" "$RST"
fi

printf '\n%s────────── %s✅ %d  %s⚠️ %d  %s❌ %d %s──────────%s\n' \
  "$CYN" "$GRN" "$PASS" "$YLW" "$WARN" "$RED" "$FAIL" "$CYN" "$RST"
[ "$FAIL" -gt 0 ] && printf '%sFix ❌ items top-down — they are ordered by how often they cause this.%s\n' "$YLW" "$RST"
exit 0

