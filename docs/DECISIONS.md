# Decision log

| ID | Decision | Rationale / impact |
|---|---|---|
| D001 | Single-player, 15 × 15 grid, 60-second shift | Keep the core loop simple; no snake body. |
| D002 | Deterministic AI rival, no LLM/API | Fast, inexpensive, testable; completing work increases threat and skills reduce it. |
| D003 | Pure TypeScript engine, separate Canvas rendering and React UI | Test gameplay independent of browser. |
| D004 | No backend, login or leaderboard in MVP | Focus on playability and low-friction launch. |
| D005 | Node 24 runtime, Vitest 5.1.2, config named vitest.config.mts | Resolve types conflict and explicit ESM configuration warning; 2 baseline tests pass. |
| D006 | No public deployment required for Phase 0 | Align foundation with previously stated phase roadmap; public deployment is Phase 6. |

Gameplay balance values are initial hypotheses. Record approved changes with date, rationale and affected tests. Do not silently change the project specification.
