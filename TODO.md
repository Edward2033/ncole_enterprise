## AI Chat — COMPLETED ✅

All items verified complete:

- [x] `dotenv.config()` loaded at top of `server.ts` before any imports
- [x] `GEMINI_API_KEY` + `GEMINI_MODEL` read from `process.env` via `env.ts` (Zod-validated)
- [x] `@google/generative-ai` installed and used in `ai.service.ts`
- [x] `POST /api/v1/ai/chat` registered in `app.ts` → `ai.routes.ts`
- [x] Accepts `{ message, history, portal }`, calls `gemini-2.0-flash`, returns `{ success: true, data: { reply } }`
- [x] Gemini errors are caught, logged via Winston, and re-thrown as `AppError(502)` — never silent
- [x] `ai.controller.ts` logs errors before forwarding to error handler
- [x] Frontend `VITE_API_URL=http://localhost:4000/api/v1` set in `frontend/.env`
- [x] `aiApi.chat()` calls `POST /ai/chat` via `apiFetch`
- [x] `AiChat.tsx` + `PublicAiChat.tsx` display `res.data.reply` from backend
- [x] Catch blocks surface real error message (`err.message`) — no hardcoded generic strings
- [x] No fake/dummy AI responses anywhere in the codebase
- [x] TypeScript build: 0 errors

## ⚠️ Action Required
The `GEMINI_API_KEY` in `backend/.env` appears invalid (starts with `AQ.` — Gemini keys start with `AIza`).
Replace it with a valid key from https://aistudio.google.com/app/apikey
