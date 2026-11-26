# PLEASE REMAIN RELEVANT. — Project specification

Version: 0.1.1 (proposed MVP baseline; not playtested) · Codename: PRR

## 1. Product contract

A free, mobile-friendly, browser-based, single-player corporate satire arcade game. A player clocks in, collects work and skills, avoids meetings and a rival AI, and tries to survive a 60-second shift. Completing tasks makes the rival faster; upskilling slows it down. The rival is deterministic game logic, not a trained AI model. No login is required. The intended launch is a public web link, a short gameplay clip and a shareable results card.

MVP success: strangers can understand the game within five seconds, complete a run, restart easily and share their result. No multiplayer, real LLMs, career simulation, boss levels, inventory, payments, accounts or global leaderboard in the initial MVP. Daily challenges and a verified leaderboard are optional post-MVP work.

## 2. Initial game rules (tunable after playtests)

- Board: 15 × 15 empty grid. Player, one rival, one task, one skill, one coffee and two meetings, each on distinct cells. No walls inside the board in MVP. Start at (7,7), facing right; rival starts at least 8 Manhattan cells away. Collectibles initially spawn outside the player's cell.
- Duration: 60 seconds of active simulation time. Countdown before starting; no simulation until countdown ends. Simulation tick 100 ms. Player steps every 200 ms, follows the last valid direction (arrows/WASD, swipe or touch directional buttons). Boundary blocks movement instead of killing the player. No diagonal motion. Player may change direction freely; a snake body is not used. Pause on blur/hidden tab; resume explicitly. Restart returns to fresh state.
- Energy: 100 initially, cap 100, drain 1 per completed active second. Coffee +15; meeting −12; AI contact −25. Energy floors at zero. At zero, end the run. No damage while paused. If the AI hit is the event that reaches zero, result is REPLACED; otherwise BURNED OUT. At 60 seconds with positive energy, SHIFT SURVIVED. If both occur on the last tick, energy failure wins.
- Score: 10 per completed active second + 100 per task + 150 per skill. No points for coffee or meetings. Counts and elapsed time are stored separately. No score change after end.
- AI level: starts at 0, range 0–5. Every second task collected raises level by 1 (cap 5). Each skill reduces level by 1 (floor 0). AI step periods by level: [800,700,600,500,400,300] ms. At a move, choose the axis that reduces Manhattan distance most; break ties horizontally. Rival ignores pickup effects. AI contact damages once, relocates rival to a safe free cell at least 8 Manhattan cells from player where possible, and grants player 1 second of AI-contact immunity. Detect contact after each actor movement (including swapping positions); do not double-charge within one tick. Reset rival movement countdown on relocation; a level change affects the next scheduled interval, not retroactively.
- Items: task respawns immediately; skill respawns after 5 active seconds; coffee after 8 active seconds; meeting after 4 active seconds. Maintain one task, one skill, one coffee and two meeting slots, with individual cooldowns. Never spawn on player, rival, another item or out of bounds. If no eligible cell, defer spawn to next tick. Spawn from list of free cells, use injected seeded random generator. No pickup effect from rival. A pickup is consumed once on player entry; staying on a cell does not repeatedly trigger an effect.
- Tick order: accept pending direction, move player if due, apply any pickup, resolve AI contact, move rival if due and resolve contact, apply scheduled energy drain and elapsed-time score, process due respawns, check final outcome. Once energy reaches zero, finish immediately; no subsequent effects revive the player. Update UI after each step. Score for a completed second is awarded only if that time boundary was reached before the run ended.
- Results: final score, time survived, tasks, skills, coffee, meetings hit, AI peak level, outcome, personal best. Funny titles are presentation, not gameplay. Example: "Professionally Exhausted" for burnout. Share card uses actual run values; never invent ranking or global percentile.

## 3. Screen flow and style

Landing → instructions (one short overlay or inline text) → 3-2-1 → playing ↔ paused → result → play again. Results include share/copy challenge, personal best and return to home. First-time player should need no more than one main click to begin. Mobile uses touch buttons and swipe, desktop arrows/WASD, Escape pause. Provide mute, readable contrast, text/icon labels in addition to colors, reduced-motion option, and a clear touch target. Stop page scroll only in the game control region. Visual direction: retro office operating system, dark charcoal, lime for player/skills, red or coral for hazards, purple for rival, amber for coffee; use distinctive silhouettes. No real company logos, unlicensed game art or audio. Humor targets corporate absurdity, not specific people.

## 4. Stack and architecture

Next.js App Router, TypeScript, Tailwind CSS, native Canvas 2D, Vitest, optionally Playwright for browser checks. Vercel for deployment. Local storage for best score, mute, and accessibility settings; validate values and tolerate blocked storage. No backend for MVP. Use pure TypeScript game logic, a seeded RNG injection, and a fixed-step clock. Render is separate from simulation. React owns screen flow and HUD, not the state of each individual canvas cell. Audio and persistence stay outside the engine. Supabase is reserved for optional post-launch ranking/challenges, with server-side validation and rate limiting.

```text
please-remain-relevant/
  README.md
  docs/
    PROJECT_SPEC.md
    BUILD_STATUS.md
    DECISIONS.md
    PLAYTESTS.md
  public/
    assets/
      sprites/
      audio/
    og-image.png                  # create during polish
  src/
    app/
      layout.tsx
      page.tsx
      globals.css
    components/
      game/
        GameShell.tsx
        GameCanvas.tsx
        GameHUD.tsx
        TouchControls.tsx
        PauseScreen.tsx
        ResultsScreen.tsx
      LandingScreen.tsx
    game/
      config.ts
      types.ts
      engine.ts
      movement.ts
      collisions.ts
      spawning.ts
      rival.ts
      scoring.ts
      rng.ts
      renderer.ts
      useGameLoop.ts
    lib/
      storage.ts
      share.ts
      audio.ts
  tests/
    game/
      engine.test.ts
      collisions.test.ts
      spawning.test.ts
      rival.test.ts
      scoring.test.ts
    e2e/
      game.spec.ts
  package.json
  tsconfig.json
  vitest.config.mts
```

Create files as needed per phase, not empty implementations for future phases. Framework-generated config files may differ. Engine public API: createGame(seed), stepGame(state, input), getResult(state). State includes phase, tick, elapsed, positions, direction, energy, score, task/skill/coffee/meeting counts, rival level/peak level, cooldowns, immunity, RNG state and outcome. Input is a pending direction or none; pause/restart are controller actions. Engine must not call Date.now, Math.random, Canvas, DOM, localStorage or React. All balance parameters live in config.ts. Engine effects are pure data events; UI plays sounds/animations in response.

## 5. Phase gates

| Phase | Scope | Done when |
|---|---|---|
| 0: Foundation | Repo, framework, docs, scripts, Git | Dev server, lint, build and baseline test pass; source of truth committed and pushed. Public deployment is Phase 6. |
| 1: Arcade skeleton | Board, player, keyboard, fixed loop, boundary, pause/restart | Predictable movement on grid; no double loops or off-board positions; basic tests pass. |
| 2: Survival loop | Items, spawn/cooldowns, energy, score, timer, end state | Full 60-second run playable; zero energy ends run; tests cover rules and restart. |
| 3: Rival | Deterministic chase, task-driven level, skill counter, contact/immunity | Rival demonstrably speeds/slows; fair respawn; tests cover caps and collision. |
| 4: UX and personality | Landing, HUD, touch/swipe, mobile layout, pixel art, audio, accessibility | Desktop and mobile game works; controls and outcome readable; no external asset licensing issue. |
| 5: Share and release candidate | Results, local best, share text/card, OG metadata, testing | Share opens useful result/challenge, replay works, no backend required, all core tests pass. |
| 6: Playtest and launch | Deploy, feedback, tuning, short clip, LinkedIn post | At least 5 external playtesters attempted; blockers fixed; public HTTPS link tested on desktop and phone. |
| 7: Optional growth | Daily seed, verified ranking, limited analytics, additional events | Separate approved scope based on real feedback; never a launch dependency. |

Suggested pace: ~2–3 weeks of part-time effort, depending on experience and polish. This is a planning estimate, not a deadline or promise. Do not advance while critical bugs remain.

## 6. Test checklist

- Player stays within bounds; no diagonal movement; keyboard/touch inputs work and do not scroll board.
- Identical seed and input sequence produce identical state and final result. Spawns never overlap occupied cells. Cooldowns pause correctly. Item counts and score cannot double increment.
- AI level increases every second task, decreases with skills, remains 0–5. Movement speed follows config. AI contact detected including swaps; immune contact does not damage; relocation valid. Energy bounded 0–100. Last-tick tie follows specified precedence.
- 60 active seconds wins if energy positive; zero energy ends immediately. End freezes state. Pause/resume and browser hide preserve active time. Repeated restarts do not leak event listeners or animation loops.
- Personal best only increases; malformed or unavailable local storage does not crash. Share has copy fallback. Test responsive view at 360 px width, desktop, iOS/Android browser where available. Test with keyboard and touch, muted and reduced motion.
- `npm run lint`, `npm run test`, `npm run build` pass before release; define scripts during setup. Manual smoke test on deployed site.

## 7. Launch and evaluation

First playtest with 5–10 people; observe without coaching whether they understand the hook, start, and finish or replay. Ask what confused them and whether they would challenge a friend. Adjust config values before adding mechanics. Optional privacy-respecting aggregate analytics: starts, completions, restarts, share clicks; no personal identifiers or fingerprinting. Share clicks do not prove actual shares. Initial goals (hypotheses, not guarantees): median first run starts within 10 seconds; at least 4/5 testers understand task/AI trade-off; at least 3/5 voluntarily replay. Track qualitative feedback and sample size. No invented user metrics in LinkedIn post.

Post-launch candidate: daily seeded board, verified leaderboard, office events and career levels. For ranking, do not trust client-submitted scores; use bounded, server-validated replay or equivalent verification plus rate limits. Do not send research data to this game; it is independent from academic research.

## 8. Continuity protocol

This file is the source of truth. Keep docs/BUILD_STATUS.md updated after each phase: current phase, completed items, next task, commands and test results, blockers, last commit. Record changes to mechanics or scope in docs/DECISIONS.md with date, rationale, affected tests. Record external feedback in docs/PLAYTESTS.md. If a new feature idea arises, place it in backlog unless needed for the current phase. Start each new coding conversation by providing PROJECT_SPEC.md and BUILD_STATUS.md, plus changed files or repo snapshot as needed. Do not claim tests ran unless actually executed.

Immediate next task: Phase 0. Scaffold repository, copy this spec into docs/PROJECT_SPEC.md, create status/decision/playtest files, install test tooling, verify dev server/lint/test/build, commit foundation. Phase 1 starts only after foundation checks pass.
