# NoCalculator - Copilot Agent Instructions

## Project Overview

**NoCalculator** is a real-time competitive mental math game with ELO rating system.

### Tech Stack
- **Backend**: Node.js + TypeScript + Express + Socket.io + SQLite (better-sqlite3)
- **Frontend**: React + TypeScript + Vite + Socket.io-client
- **Auth**: JWT + bcrypt (HttpOnly cookies)
- **DB**: SQLite with deterministic schema in `src/db/database.ts`

### Architecture Pattern: Server-Authoritative Gaming

All game state lives on the server. Clients send only their answers; the server validates, calculates scores, and broadcasts results via WebSocket. This prevents cheating.

**Key insight**: Questions are deterministically generated using a seeded RNG based on `matchId`, so both players receive identical questions without sending them via network.

---

## Critical Components & Data Flow

### 1. Authentication & User Management
- **File**: `src/routes/auth.ts`, `src/services/userService.ts`, `src/middleware/auth.ts`
- **Flow**: 
  - Registration/Login: Hash password with bcrypt, return JWT token
  - Token stored in HttpOnly cookie + localStorage
  - Middleware verifies JWT on every protected route
  - WebSocket auth: Token passed in `socket.handshake.auth.token`

**Pattern**: User `id`, `username`, `elo` travel through JWT payload. Never mutate user directly—always use `UserService.updateUserElo()` etc.

### 2. Matchmaking Queue (ELO-Based)
- **File**: `src/services/matchmakingService.ts`
- **Singleton**: `matchmakingQueue` instance reused in `gameSocket.ts`
- **Logic**:
  - Players join queue with their current ELO
  - Match finder runs on `join_queue` event
  - ELO range starts at ±100, expands by ±50 per 10 seconds of wait
  - When match found: `match_found` event sent to both clients
  - Queue is in-memory only (lost on server restart)

**Important**: The queue is NOT persisted to DB. On server restart, waiting players are disconnected.

### 3. Deterministic Question Generation
- **File**: `src/services/questionService.ts`
- **Core Pattern**: `SeededRandom` class implements Linear Congruential Generator (LCG)
- **Seed source**: Hash of `matchId` ensures reproducibility across network calls
- **Difficulty progression**: Increases from 1 to 4 over 20 questions
  - 0-50% questions: Addition/Subtraction (60% vs 30%)
  - 50-100% questions: Multiplication/Division dominates

**When adding features**: Any randomness MUST use the same seed approach. Never use `Math.random()` for game logic.

### 4. Real-time Match Sync (WebSocket)
- **File**: `src/socket/gameSocket.ts`
- **State store**: `activeMatches` (Map<matchId, MatchState>) + `playerToMatch` (Map<userId, matchId>)
- **Event flow**:
  1. Client: `submit_answer` → Server validates + calculates score
  2. Server: Broadcasts `answer_submitted` to both players
  3. Server: When match ends, broadcasts `match_finished` with final scores
  4. Server: Updates user ELO in DB, record match in `match_events` table

**Pattern**: All game logic runs server-side. Clients are state machines that listen for events.

### 5. ELO Calculation
- **File**: `src/services/eloService.ts`
- **Formula**: Standard chess ELO with K-factor = 32
- **Called after**: Match finishes in `gameSocket.ts` line ~140
- **Database**: Results persisted to `users.elo` and `match_events` table

**Important**: ELO updates happen AFTER match is recorded to DB.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/server.ts` | Express + Socket.io initialization, CORS config |
| `src/socket/gameSocket.ts` | All WebSocket event handlers & match state management |
| `src/services/questionService.ts` | Seeded RNG, question generation, answer validation |
| `src/services/matchmakingService.ts` | Queue management with ELO-based matching |
| `src/db/database.ts` | SQLite schema init (users, matches, match_events tables) |
| `client/src/App.tsx` | Main app state: screen routing (login/lobby/game/solo) |
| `client/src/components/Game.tsx` | Multiplayer game UI with WebSocket listeners |
| `client/src/components/SoloGame.tsx` | Solo mode local game (no WebSocket, local state) |
| `client/src/components/Leaderboard.tsx` | Leaderboard display component |
| `client/src/components/Lobby.tsx` | Main lobby screen with queue UI and stats |
| `client/src/components/Login.tsx` | Login/registration forms |
| `client/src/services/socket.ts` | Socket.io client wrapper, auto-detects server host |
| `client/src/services/audioService.ts` | Audio effects management (correct/incorrect answers, game over, winner sounds) |

---

## Frontend Architecture

### Screen-Based State Machine
- **Login**: Register/Login forms → JWT token stored
- **Lobby**: Queue UI, stats display, solo test button
- **Game** (multiplayer): WebSocket-synced match, opponent score tracking
- **SoloGame** (solo mode): Local game state, no WebSocket (GET `/api/test/solo`)

### Key Pattern: Auto-Detecting Network Location
- **File**: `client/src/services/socket.ts` line 3-9
- WebSocket URL auto-detects: `http://{window.location.hostname}:3001`
- API calls use relative URLs (`/api/...`) via Vite proxy
- **Why**: Works on localhost AND network local (10.0.0.163) without config changes

---

## Database Schema
- **users**: id, username, password_hash, elo, games_played, wins
- **matches**: id, player1_id, player2_id, winner_id, created_at
- **match_events**: id, match_id, question_index, player_id, answer, correct, time_ms

**Pattern**: Questions are NOT stored—they're regenerated from `matchId` seed on demand.

---

## Development Workflows

### Starting Development
```bash
# Terminal 1: Backend (port 3001)
npm run dev

# Terminal 2: Frontend (port 5173, proxies /api to :3001)
cd client && npm run dev
```

### Building for Production
```bash
npm run build          # Backend: TypeScript → dist/
cd client && npm run build  # Frontend: Vite bundle → client/dist/
```

### Environment Variables (`.env`)
```
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
JWT_SECRET=<random-key-for-production>
DATABASE_PATH=./data/nocalculator.db
FRONTEND_URL=http://10.0.0.163:5173
```

### Testing Solo Mode
- GET `/api/test/solo` (requires auth) → Returns 20 questions + matchId
- Frontend handles `isSolo: true` → Routes to `SoloGame` component (local state only)

---

## Common Patterns to Follow

### Adding a New Route
1. Create handler in `src/routes/newFeature.ts`
2. Import & mount in `src/server.ts` with `app.use('/api/path', ...)`
3. Use `authMiddleware` for protected routes
4. Return JSON with error-first pattern: `{ error: "msg" }` or `{ data: {...} }`

### Adding a WebSocket Event
1. Add handler in `src/socket/gameSocket.ts` using `socket.on('event_name', ...)`
2. Broadcast to players: `io.to(matchId).emit(...)` or `socket.emit(...)`
3. **ALWAYS validate server-side** before trusting client data
4. Update `activeMatches` state if match logic changes

### Database Queries
- Use `better-sqlite3` synchronous API (no async)
- Prepare statements for repeated queries
- Example: `db.prepare('SELECT * FROM users WHERE id = ?').get(userId)`

### Frontend Component Patterns
- Hooks: `useState` for local UI, `useEffect` for WebSocket listeners
- Always cleanup listeners: `return () => { socketService.off(...) }` in useEffect
- Pass `isSolo` flag through data to distinguish game modes

### Audio Effects (AudioService)
- **File**: `client/src/services/audioService.ts`
- **Singleton**: `audioService` instance exported for app-wide use
- **Features**:
  - `playCorrectAnswer()`: Sound for correct answers (plusonepoint.mp3)
  - `playIncorrectAnswer()`: Sound for incorrect answers (minusonepoint.mp3)
  - `playGameOver()`: Sound when game ends (game-over-417465.mp3)
  - `playWinner()`: Sound when player wins (winner-game-sound-404167.mp3)
  - `setVolume(level)`: Set volume 0-1
  - `toggleSounds()`: Enable/disable all sounds
- **Initialization**: Audio context initialized on first user click/keydown (browser autoplay policy compliance)
- **Usage**: Import and call methods like `audioService.playCorrectAnswer()` in game event handlers

---

## Debugging Checklist

**Frontend not connecting to API from another machine?**
- ✓ Check `window.location.hostname` in console (should be `10.0.0.163`, not `127.0.0.1`)
- ✓ Verify `.env` has `FRONTEND_URL=http://10.0.0.163:5173`
- ✓ Backend must have CORS allowing that origin

**Questions different between players?**
- ✓ Check `matchId` is identical (logged in console)
- ✓ Verify `generateQuestions()` called with same matchId on both sides
- ✓ SeededRandom seed must match: `seed = hashString(matchId)`

**WebSocket disconnects randomly?**
- ✓ Check auth token expiration
- ✓ Verify socket reconnection logic in `socket.ts` (auto-reconnects 3 times)
- ✓ Check server logs for auth errors

---

## Security Notes
- ✅ Passwords: bcrypt (10 rounds)
- ✅ Auth: JWT with 7-day expiry (if implemented)
- ✅ Network: CORS whitelist (no wildcard)
- ✅ Server-authoritative: All game logic on server
- ⚠️ Rate limiting: 100 req/15min per IP (tunable)
- ⚠️ SQLite: No auth needed locally; use PostgreSQL for production

---

## Audio Assets
- `client/src/assets/plusonepoint.mp3`: Correct answer sound effect
- `client/src/assets/minusonepoint.mp3`: Incorrect answer sound effect
- `client/src/assets/game-over-417465.mp3`: Game over sound effect
- `client/src/assets/winner-game-sound-404167.mp3`: Winner sound effect

**Pattern**: Import audio files at top of service, use `audioService` singleton to trigger sounds based on game events.

---

## Related Files
- Deployment guide: `DEPLOYMENT.md`
- Backend build script: `build.sh`
- Codacy analysis config: `.github/instructions/codacy.instructions.md`
