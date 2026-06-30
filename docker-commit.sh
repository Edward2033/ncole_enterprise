#!/usr/bin/env bash
# =============================================================================
# docker-commit.sh — Build Docker images locally, then commit & push to GitHub
#
# Usage:
#   bash docker-commit.sh "your commit message"
#   bash docker-commit.sh "fix: something" --no-push   (build + commit only)
#
# What it does:
#   1. Checks for staged / unstaged changes
#   2. Builds backend Docker image  (validates TypeScript, Prisma, compile)
#   3. Builds frontend Docker image (validates TypeScript, Vite build)
#   4. If both succeed  → git add -A, git commit, git push
#   5. If either fails  → abort, show which image failed, no commit is made
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${BLUE}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[FAIL]${RESET}  $*"; }
step()    { echo -e "\n${BOLD}${CYAN}══ $* ══${RESET}"; }

# ── Args ─────────────────────────────────────────────────────────────────────
COMMIT_MSG="${1:-}"
NO_PUSH=false
[[ "${2:-}" == "--no-push" ]] && NO_PUSH=true

if [[ -z "$COMMIT_MSG" ]]; then
  error "Commit message is required."
  echo   "  Usage: bash docker-commit.sh \"your commit message\""
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Pre-flight checks ─────────────────────────────────────────────────────────
step "Pre-flight"

if ! command -v docker &>/dev/null; then
  error "Docker is not installed or not in PATH."
  exit 1
fi
success "Docker $(docker --version | awk '{print $3}' | tr -d ',')"

if ! git rev-parse --git-dir &>/dev/null; then
  error "Not inside a git repository."
  exit 1
fi
success "Git repository detected — branch: $(git branch --show-current)"

# ── Check for changes ─────────────────────────────────────────────────────────
step "Checking for changes"

CHANGED=$(git status --short | grep -v '^??' || true)
if [[ -z "$CHANGED" ]]; then
  warn "No changes to commit (working tree clean)."
  warn "Nothing to do — exiting without error."
  exit 0
fi

echo -e "Files to be committed:"
git status --short

# ── Build backend image ───────────────────────────────────────────────────────
step "Building backend Docker image"
info "Context: ./backend  |  Target: runner"
info "This validates: npm ci → npx prisma generate → tsc → npm run build"

if docker build \
    --target runner \
    --tag ncole-backend:commit-check \
    --file backend/Dockerfile \
    backend/; then
  success "Backend image built successfully"
else
  error "Backend Docker build FAILED — fix TypeScript / Prisma errors before committing."
  exit 1
fi

# ── Build frontend image ──────────────────────────────────────────────────────
step "Building frontend Docker image"
info "Context: ./frontend  |  VITE_API_URL=http://localhost/api/v1"
info "This validates: npm ci → tsc --noEmit → vite build"

if docker build \
    --build-arg VITE_API_URL=http://localhost/api/v1 \
    --tag ncole-frontend:commit-check \
    --file frontend/Dockerfile \
    frontend/; then
  success "Frontend image built successfully"
else
  error "Frontend Docker build FAILED — fix TypeScript / Vite build errors before committing."
  exit 1
fi

# ── Clean up check images ─────────────────────────────────────────────────────
step "Cleaning up temporary build images"
docker rmi ncole-backend:commit-check  --force 2>/dev/null || true
docker rmi ncole-frontend:commit-check --force 2>/dev/null || true
success "Temporary images removed"

# ── Git commit ────────────────────────────────────────────────────────────────
step "Committing to Git"

# Stage everything except intentionally ignored files
git add -A

# Show exactly what is being committed
echo ""
git status --short
echo ""

git commit -m "$COMMIT_MSG"
success "Committed: $(git log -1 --oneline)"

# ── Git push ──────────────────────────────────────────────────────────────────
if [[ "$NO_PUSH" == true ]]; then
  warn "--no-push flag set — skipping push to remote."
else
  step "Pushing to origin/main"
  git push origin "$(git branch --show-current)"
  success "Pushed to origin/$(git branch --show-current)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}${BOLD}║   docker-commit complete — all checks passed  ║${RESET}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  Commit : $(git log -1 --oneline)"
echo -e "  Branch : $(git branch --show-current)"
if [[ "$NO_PUSH" == false ]]; then
  echo -e "  Remote : $(git remote get-url origin)"
fi
echo ""
