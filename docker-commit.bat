@echo off
REM =============================================================================
REM docker-commit.bat — Build Docker images locally, then commit & push
REM
REM Usage:
REM   docker-commit.bat "your commit message"
REM   docker-commit.bat "fix: something" --no-push
REM
REM What it does:
REM   1. Builds backend Docker image  (validates TypeScript, Prisma, compile)
REM   2. Builds frontend Docker image (validates TypeScript, Vite build)
REM   3. If both succeed  -> git add -A, git commit, git push
REM   4. If either fails  -> abort with clear error, no commit made
REM =============================================================================

setlocal EnableDelayedExpansion

REM ── Args ────────────────────────────────────────────────────────────────────
set "COMMIT_MSG=%~1"
set "NO_PUSH=false"
if "%~2"=="--no-push" set "NO_PUSH=true"

if "%COMMIT_MSG%"=="" (
    echo [FAIL]  Commit message is required.
    echo         Usage: docker-commit.bat "your commit message"
    exit /b 1
)

REM ── Move to repo root ────────────────────────────────────────────────────────
cd /d "%~dp0"

REM ── Pre-flight ───────────────────────────────────────────────────────────────
echo.
echo == Pre-flight ==
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL]  Docker is not installed or not in PATH.
    exit /b 1
)
echo [OK]    Docker found
git rev-parse --git-dir >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL]  Not a git repository.
    exit /b 1
)
echo [OK]    Git repository detected

REM ── Check for changes ────────────────────────────────────────────────────────
echo.
echo == Checking for changes ==
git status --short
for /f "tokens=*" %%i in ('git status --porcelain') do set "HAS_CHANGES=true"
if not defined HAS_CHANGES (
    echo [WARN]  No changes to commit - working tree clean.
    exit /b 0
)

REM ── Build backend image ──────────────────────────────────────────────────────
echo.
echo == Building backend Docker image ==
echo [INFO]  Validates: npm ci, prisma generate, tsc, npm run build

docker build ^
    --target runner ^
    --tag ncole-backend:commit-check ^
    --file backend\Dockerfile ^
    backend\

if %errorlevel% neq 0 (
    echo.
    echo [FAIL]  Backend Docker build FAILED.
    echo         Fix TypeScript / Prisma errors before committing.
    exit /b 1
)
echo [OK]    Backend image built successfully

REM ── Build frontend image ─────────────────────────────────────────────────────
echo.
echo == Building frontend Docker image ==
echo [INFO]  Validates: npm ci, tsc --noEmit, vite build

docker build ^
    --build-arg VITE_API_URL=http://localhost/api/v1 ^
    --tag ncole-frontend:commit-check ^
    --file frontend\Dockerfile ^
    frontend\

if %errorlevel% neq 0 (
    echo.
    echo [FAIL]  Frontend Docker build FAILED.
    echo         Fix TypeScript / Vite build errors before committing.
    exit /b 1
)
echo [OK]    Frontend image built successfully

REM ── Clean up temporary images ────────────────────────────────────────────────
echo.
echo == Cleaning up temporary build images ==
docker rmi ncole-backend:commit-check  --force >nul 2>&1
docker rmi ncole-frontend:commit-check --force >nul 2>&1
echo [OK]    Temporary images removed

REM ── Git commit ───────────────────────────────────────────────────────────────
echo.
echo == Committing to Git ==
git add -A
echo.
git status --short
echo.
git commit -m "%COMMIT_MSG%"
if %errorlevel% neq 0 (
    echo [FAIL]  git commit failed.
    exit /b 1
)
echo [OK]    Committed successfully

REM ── Git push ─────────────────────────────────────────────────────────────────
if "%NO_PUSH%"=="true" (
    echo [WARN]  --no-push flag set - skipping push.
) else (
    echo.
    echo == Pushing to origin ==
    for /f %%b in ('git branch --show-current') do set "BRANCH=%%b"
    git push origin !BRANCH!
    if %errorlevel% neq 0 (
        echo [FAIL]  git push failed.
        exit /b 1
    )
    echo [OK]    Pushed to origin/!BRANCH!
)

REM ── Summary ──────────────────────────────────────────────────────────────────
echo.
echo =====================================================
echo   docker-commit complete - all checks passed
echo =====================================================
for /f %%s in ('git log -1 --oneline') do echo   Commit : %%s
for /f %%b in ('git branch --show-current') do echo   Branch : %%b
echo.
endlocal
exit /b 0
