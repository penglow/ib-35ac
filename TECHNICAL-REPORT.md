# BioMon — IB 35AC Battle: Technical Report

> **Generated:** 2026-05-05
> **Repository:** `C:\Users\abdul\Documents\ib-35ac`
> **Hosted:** https://ib-35ac.pages.dev (Cloudflare Pages)

---

## 1. Project Overview

**BioMon** is a self-contained single-page browser game that helps students review **IB 35AC (Human Biological Variation)** course concepts through Pokemon-style turn-based battles. The player selects a 3-Pokemon team, answers multiple-choice course questions to power moves, defeats or catches opponents, buys items, manages a PC box, and progresses through a 9-encounter campaign in a roguelite progression format.

---

## 2. Directory Structure

```
ib-35ac/
├── .claude/
│   └── settings.local.json          # Claude AI assistant permissions config
├── .git/                            # Git repository
├── .gitignore                       # ignore: node_modules, .DS_Store, *.log, *.backup.html
├── assets/
│   ├── animations/
│   │   ├── move-effects/            # 45 Gen 3 move animation PNG sprite sheets (192px frames)
│   │   └── README.md                # Credits: Gen 3 Move Animation Pack V1.0
│   ├── backgrounds/
│   │   ├── arena-*.png (18)         # Type-specific battle arena backgrounds
│   │   ├── arena-{species}.png (5)  # Special boss arenas
│   │   ├── High graphic/            # Archived alternate arena backgrounds (unused)
│   │   ├── result-lose.png          # Defeat screen backdrop
│   │   ├── result-win.png           # Victory screen backdrop
│   │   ├── select-screen.png        # Starter selection backdrop
│   │   ├── shop-screen.png          # Shop backdrop
│   │   └── title-screen.png         # Title screen backdrop
│   ├── favicon.ico / favicon.svg    # Browser tab icons
│   ├── music/
│   │   └── *.mp3 (6 tracks)         # Pokemon Black/White BGM
│   ├── sfx/
│   │   ├── attack-moves/            # 160 move sound effects (Gen 5)
│   │   └── README.md                # Credits: BellBlitzKing collection
│   ├── sprites/
│   │   ├── ani/                     # 334 front-facing animated Pokemon GIFs
│   │   └── ani-back/                # 334 back-facing animated Pokemon GIFs
│   └── trainers/
│       ├── *.png (6 files)          # Trainer sprites
│       └── README.md                # Credits: Pokemon Showdown sprites
├── index.html                       # Single-page HTML shell (234 lines, 6 screens)
├── js/
│   ├── data.js                      # Game data tables (3,959 lines)
│   ├── game.js                      # Core game engine (4,128 lines)
│   └── storage.js                   # IndexedDB wrapper (106 lines)
├── node_modules/                    # Dev dependencies (vitest, live-server)
├── package.json                     # NPM config with dev scripts
├── package-lock.json
├── README.md                        # Main project documentation (435 lines)
├── scripts/
│   ├── game-data-loader.js          # VM sandbox stubs for headless testing (138 lines)
│   ├── optimize-assets.js           # PNG/GIF to WebP pipeline (138 lines)
│   ├── trim-mp3.js                  # MP3 trimmer via MPEG frame parsing (152 lines)
│   └── validate-game-data.js        # Data integrity validator (215 lines)
├── styles.css                       # All game CSS (~1,976 lines)
├── test/
│   └── game.test.js                 # Vitest test suite (3,374 lines, 233 tests)
└── vitest.config.js                 # Vitest configuration (8 lines)
```

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Browser (no Node required to play) | Single-page application |
| **Languages** | HTML5, CSS3, JavaScript (ES6+) | All application code |
| **Loading** | `<script>` tags, no ES modules/bundler | Scripts run in global scope |
| **Styling** | Custom CSS, CSS custom properties, container queries | Google Fonts: Press Start 2P, Jersey 10, Inter |
| **Storage** | IndexedDB + localStorage fallback | Saves, collection, music toggle |
| **Audio** | HTML5 `<Audio>` element | Background music (MP3) + SFX |
| **Testing** | Vitest 2.1.0 | 233 unit/integration tests |
| **Test Harness** | Node.js `vm` module | Sandboxed DOM stubs for headless execution |
| **Dev Server** | live-server 1.2.2 | Local development on port 3000 |
| **Hosting** | Cloudflare Pages | Static site deployment |

---

## 4. Architecture

### 4.1 Single-Page Application (No Framework)

The game is a pure vanilla JavaScript SPA with no frameworks, bundlers, or build tools. All code runs in the global scope and loads via `<script>` tags in a fixed order:

```
index.html
  ├─ <link> styles.css          → CSS (no JS dependency)
  ├─ <script> js/data.js        → Global data tables (must load first)
  ├─ <script> js/storage.js     → STORE singleton for persistence
  └─ <script> js/game.js        → All game logic (depends on globals from data.js + storage.js)
```

### 4.2 Screen-Based Architecture

Six mutually exclusive screens toggled by `showScreen(id)`:
- `title-screen` — Difficulty select, save slots, new game
- `select-screen` — Starter Pokemon selection (pick 3)
- `battle-screen` — Main arena with quiz-combat
- `shop-screen` — Between-battle item management
- `pc-screen` — Team/PC box swap overlay
- `result-screen` — End-of-run summary

### 4.3 Centralized State Management

All mutable game state lives in a single global object `G`, created by `createDefaultState()`. All screens and subsystems read/write `G` directly. State serialization (`serializeGame()`) and restoration (`restoreGame()`) convert to/from JSON for persistence.

**Key G fields:**
- `team`, `activeIdx` — Player team and active mon index
- `enemy` — Current opponent mon
- `money`, `inv` — Currency and inventory
- `streak`, `bestStreak` — Correct-answer streak tracking
- `used`, `caughtIds` — Sets tracking unlocked moves and caught species
- `questionStats`, `battleQuestionQueues` — Spaced-repetition quiz state
- `pendingMove`, `pendingAnswerOk` — Async turn resolution state
- `locked` — Guard against overlapping actions
- `mode` — Difficulty (`easy`/`hard`)
- `encounterMeta`, `pcBox`, `shopContext`, `pcContext` — Encounter and UI context

### 4.4 Event-Driven Turn Flow

```
showMenu() → showMoves() → pickMove(idx)
  → showQuestion(diff)
  → answer(idx) → recordQuestionResult()
  → showAnswerResult(ok)
  → resolvePendingTurn()
    ├─ [correct] runMove("player", move) → animation/SFX → calcDamage → effects
    └─ [wrong]  endStep("player")
  → [if enemy alive + hard mode | failed turn] runEnemyTurn()
    → chooseEnemyMove() → runMove("enemy", move)
  → handleDeaths() → enemyDead() | checkPlayerAlive()
  → showMenu() (loop)
```

### 4.5 Persistence Architecture

```
persistGame()
  → serializeGame()         (G→JSON, Sets→Arrays)
  → STORE.setItem()         (IndexedDB)
  → archiveCurrentRoster()  (merge team+PC→collection)

restoreGame(save)
  → createDefaultState()    (fresh G template)
  → fills fields from JSON
  → normalizeMonState()     (merge with DEX defaults)
  → Sets rebuilt from Arrays
  → startEncounter() or goToShop()
```

**Storage keys:**
- `biomon_save_v2_slot_1/2/3` — Three save slots
- `biomon_save_v2` — Legacy slot 1 fallback
- `biomon_collection_v1` — Cross-run Pokemon collection
- `biomon_music_enabled_v1` — Music toggle preference

---

## 5. Key Modules

### 5.1 `js/data.js` (3,959 lines) — Data Layer

Immutable game data tables. Key data structures:

| Structure | Description |
|-----------|-------------|
| `TYPES` | 18-element array of Pokemon types |
| `TYPE_CLASS` | CSS class mappings for type badges |
| `TYPE_CHART` | 18x18 type effectiveness matrix (values: 0, 0.25, 0.5, 1, 2, 4) |
| `MODES` | Easy/Hard difficulty definitions |
| `MOVE_POOLS` | Per-type move pools (basic/special/ultimate tiers) |
| `UTIL_MOVES` | Shared utility moves |
| `LEGENDARY_MOVES` | Signature move overrides per species |
| `ABILITIES` | Passive ability definitions |
| `TYPE_ABILITIES` | Type-based ability assignment pools |
| `HELD_ITEMS` | Equippable item definitions |
| `RARITY_STATS` | Stat ranges per rarity tier |
| `DEX` | 334 Pokemon entries: `[id, name, type1, type2?, rarity?, baseHP, ...]` |
| `STARTER_IDS` | 18 starter Pokemon for selection screen |
| `RUN_PLAN` | 9-encounter campaign definition |
| `EVO_DATA` | 146 evolution relationships `[fromId, toId, requiredLevel]` |
| `EVOLUTIONS` | Computed evolution map keyed by source ID |
| `ALL_MONS` | Full monster objects built from DEX |
| `MON_BY_ID` | Lookup map keyed by ID |
| `TYPE_ARENAS` | Background/position config per type |
| `ITEMS` | Shop/bag items |
| `QS` | 136 active quiz questions with difficulty, category, answers, explanation |
| `MOVE_ANIMATION_*` | Animation mapping (exact, aliases, type fallbacks) |
| `MUSIC_TRACKS` | BGM track path mappings |
| Asset path constants | `SP`, `SPB`, `MUSIC_PATH`, `MOVE_SFX_PATH` |

### 5.2 `js/storage.js` (106 lines) — Persistence Layer

IIFE returning the `STORE` singleton:
- **Primary:** IndexedDB (`biomon_v1` database, `kv` object store)
- **Fallback:** localStorage with try/catch guards
- **API:** `setItem(key, value)`, `getItem(key)`, `removeItem(key)` — all async
- Dual-write strategy: writes to both IndexedDB and localStorage for redundancy

### 5.3 `js/game.js` (4,128 lines) — Core Engine

Organized into clearly labeled sections:

| Section | Key Functions | Purpose |
|---------|--------------|---------|
| Error Boundary | `showErrorToast()`, `safePlayAudio()`, `safeSetStorage()` | Defensive wrappers, global error handlers |
| Utility | `wait()`, `shuffle()`, `clamp()`, `finiteNumber()` | Helper functions |
| Leveling | `xpForLevel()`, `levelUpMon()` | XP curve and level-up stat/move gains |
| Game State | `createDefaultState()`, `normalizeMonState()`, `cloneMon()`, `createCaughtMon()` | State init, normalization, cloning |
| Save/Collection | `serializeMon()`, `serializeGame()`, `restoreGame()`, `persistGame()`, `readCollection()` | Full persistence subsystem |
| Encounter Gen | `getEncounterSpec()`, `createEncounter()`, `scaleToLevel()` | Run plan / endless encounter creation |
| Catching | `calcCatchRate()` | Probability based on HP, ball, rarity, level, status |
| Screen Mgmt | `showScreen()`, `applyArenaLayout()`, `applyArenaTheme()`, `buildSelect()` | Screen transitions and layout |
| Battle Rendering | `renderBattle()`, `refreshHud()`, `updateBars()`, `updateStatuses()` | HUD and sprite rendering |
| Battle Menu | `showMenu()`, `showMoves()`, `pickMove()`, `moveDmgPreview()`, `canUseMove()` | Player action selection |
| Question System | `getQ()`, `buildQuestionRound()`, `showQuestion()`, `answer()`, `weightedQuestionPick()` | Spaced-repetition quiz flow |
| Battle Resolution | `resolvePendingTurn()`, `runEnemyTurn()`, `chooseEnemyMove()`, `runMove()` | Full turn resolution pipeline |
| Combat Math | `calcDamage()`, `estimateDamage()`, `getTypeMultiplier()`, `resolveMoveType()`, `adjustedCrit()` | Damage calc with modifiers |
| Effects | `applyMoveEffects()`, `endStep()`, `settlePendingEffects()`, `consumeHit()`, `healTarget()` | Status effects, poison, healing |
| Death/Results | `handleDeaths()`, `enemyDead()`, `checkPlayerAlive()` | KO handling, XP/money |
| Shop/Bag | `goToShop()`, `buyItem()`, `useItem()`, `useItemOnTarget()`, `equipHeld()` | Shop and inventory |
| Team/Switch | `showTeam()`, `doSwitch()`, `forceSwitch()`, `clearSwitchOutEffects()` | Team switching |
| PC Box | `openPCScreen()`, `swapFromPC()`, `selectTeamForSwap()`, `closePCScreen()` | Pokemon storage system |
| Audio/Animation | `flashMsg()`, `spawnDmg()`, `flash()`, `animateAttack()`, `animateImpact()`, `playMoveAnimation()` | Visual/audio feedback |
| Results | `showEnd()`, `setResultBackdrop()` | End-of-run summary |
| Guide Mode | `guideShow()`, `guideShowBattle()`, `guideShowMoves()`, etc. | Dev screenshot/debug toolbar |
| Keyboard | Enter/Space/A-D/1-4/Escape listener | Keyboard shortcuts |
| Preloader | IIFE loading sprites, backgrounds, trainers, animations | Asset preloading with progress bar |
| Resize | Window resize listener | Responsive shadow repositioning |

---

## 6. Testing

### 6.1 Framework and Configuration

- **Runner:** Vitest 2.1.0
- **Config:** `vitest.config.js` — targets `test/**/*.test.js`, globals disabled
- **Approach:** VM sandbox testing — browser-only code runs inside Node.js `vm.Context` with stubbed DOM APIs

### 6.2 Test Architecture

`scripts/game-data-loader.js` provides `createStubs()`:
- Fake DOM (`document`, `Audio`, `Image`, `localStorage`, `indexedDB`)
- Fake element trees (innerHTML, src, disabled, dataset capture)
- All game asset path constants injected

Test flow:
```
test/game.test.js
  → initContext()
    → createStubs()                (fake DOM, timers, localStorage, Audio)
    → vm.runInNewContext(data.js)   → exports __DATA__
    → vm.runInNewContext(storage.js)
    → vm.runInNewContext(game.js)
    → vm.runInNewContext(export hooks) → __GET_G / __SET_G
  → Tests call __GET_G(), mutate state, exercise game functions
```

### 6.3 Test Suites (36 describe suites, 233+ tests)

| # | Suite | Focus |
|---|-------|-------|
| 1 | Data Integrity | TYPES, TYPE_CHART, DEX, STARTER_IDS, EVO_DATA, MOVE_POOLS, RUN_PLAN, QS, RARITY_STATS, HELD_ITEMS, ITEMS, TYPE_CLASS, MODES, ALL_MONS, TYPE_ARENAS |
| 2 | Type Effectiveness | `getTypeMultiplier` against known matchups (Water>Fire, Normal<>Ghost, Electric>Flying/Water, 4x ceilings, dual-type combos, immunities) |
| 3 | Utility Functions | `clamp`, `shuffle`, `weightedChoice`, `finiteNumber`, `hpColor`, save key helpers |
| 4 | Leveling & XP | `xpForLevel`, `levelUpMon` (single, multi, thresholds, edge cases) |
| 5 | Monster Operations | `normalizeMonState`, `cloneMon`, `createCaughtMon`, `createRunMon` |
| 6 | Battle Mechanics | `calcDamage` (STAB, crit, guard, weaken, vulnerable, held items, abilities, type mult), `estimateDamage`, `healTarget` |
| 7 | Move Rates | Accuracy per tier, stun/heal/debuff rates, caching, `adjustedCrit` with Scope Lens/abilities |
| 8 | Encounter Generation | Planned vs endless specs, scaling, `applyEncounterModifiers`, `scaleToLevel`, `normalizeEncounterMeta` |
| 9 | Catching System | `calcCatchRate` with HP, ball, rarity, status, level factors |
| 10 | Move Effects | Guard, poison, stun, `secondaryChance`, `hasEffect`, `clearSwitchOutEffects` |
| 11 | Evolution | `canEvolve`, `evolveMon`, `pickEvolutionMove`, `expandMove`, EVOLUTIONS integrity |
| 12 | Items & Inventory | `isTargetedItem`, `canTargetWithItem`, `bagItemDesc`, shop rules |
| 13 | Question System | `questionIndexesForDifficulty`, `buildQuestionRound`, `weightedQuestionPick`, queue build/serialize/restore, `getQ` flow |
| 14 | Save & Labels | Label formatting, save data helpers |
| 15 | Enemy AI | `scoreEnemyMove` (general, immune, lethal), `chooseEnemyMove` scoring invariants |
| 16 | Game State Init | `createDefaultState` structure and defaults |
| 17 | Move Classification | `requiredStreak`, `consumesStreak`, `moveClass`, `shownType`, `cleanMove` |
| 18 | Mon Builder | `buildMon` from DEX, `seededPick` determinism, ALL_MONS alignment |
| 19 | End Step Effects | Poison/weaken tick-down |
| 20 | Accessory Helpers | Held item/ability interaction helpers |
| 21 | Edge Cases | Negative XP, zero xpToNext loop, negative heal, zero-atk floor, fainted inconsistency, rarity fallback, null safety, type chart reciprocity, catch rate extremes, question queue exhaustion |
| 22 | Fix Coverage | Known bug verification tests |
| 23 | Serialization | `serializeGame`/`restoreGame` roundtrip integrity |
| 24 | Evolution & Moves | Multi-stage evolution, move expansion |
| 25 | Catching Edge Cases | Edge case catching and item interactions |
| 26 | Question Exhaustion | Queue exhaustion and recovery |
| 27 | Effects Stacking | Status stacking interactions |
| 28 | Builder Edge Cases | Builder edge cases |
| 29 | Save Consistency | Multi-slot consistency |
| 30 | Mutation Isolation | State mutation isolation |
| 31 | Endless Stress | Endless encounter generation |
| 32-36 | Dev/Guide Mode | Detection, setup, backdrops, evolution testing, router smoke tests |

---

## 7. Patterns and Conventions

### 7.1 Error Handling

- **Global error boundary:** `window.addEventListener("error")` and `"unhandledrejection"` catch unhandled errors
- **Error toast:** `showErrorToast()` - fixed-position auto-dismiss toast (4s)
- **Defensive wrappers:** `safePlayAudio()`, `safeSetStorage()`, `safeGetStorage()`, `safeRemoveStorage()`
- **Try/catch everywhere:** All I/O (storage, save/load) wrapped in try/catch
- **Graceful fallbacks:** IndexedDB failure → localStorage → silent no-op
- **Promise rejection suppression:** Audio play promise rejections caught with `.catch(() => {})`

### 7.2 Logging

- Minimal: `console.warn` for storage failures, `console.error` for game crashes
- No structured logging framework
- Storage errors logged but silently swallowed (UI shows error toast)

### 7.3 State Management

- **Single global mutable state object `G`** — no Redux/Zustand/framework
- **State reset:** New games and restores replace `G` via `createDefaultState()` or `restoreGame()`
- **Lock guard:** `G.locked` boolean prevents overlapping async actions and double-clicks
- **Sets serialized as arrays:** `G.used` and `G.caughtIds` converted to Arrays before JSON, rebuilt on restore

### 7.4 UI Rendering

- **`innerHTML` with template literals** — all dynamic UI set via `element.innerHTML = `...``
- **No virtual DOM** — raw DOM manipulation throughout
- **Screen switching:** `showScreen(id)` toggles `.active` class on screen divs
- **Event binding:** HTML `onclick=""` attributes for buttons
- **Keyboard shortcuts:** Enter/Space for `role="button"`, A-D/1-4 for quiz answers, Escape to cancel

### 7.5 Naming Conventions

| Convention | Example |
|------------|---------|
| Constants | `UPPER_SNAKE_CASE` |
| Functions | `camelCase` |
| Global state | `G` (single-letter) |
| Files | kebab-case for JS, PascalCase for README |
| Function grouping | `// ====== SECTION NAME ======` headers |

### 7.6 Data Patterns

- **Immutable data tables:** All game data in `data.js` read-only, never mutated at runtime
- **DEX format:** Array of arrays `[id, name, type, type2?, rarity?, hp?, atk?, def?, catchRate?, ...]`
- **Question format:** `{ d: difficulty, cat: category, q: text, a: [answers], c: correctIndex, e: explanation }`
- **Move pools:** Nested objects `MOVE_POOLS[type][tier]` where tier is `basic`/`special`/`ultimate`
- **Type Chart:** 18x18 multiplier matrix

---

## 8. Configuration and Infrastructure

### 8.1 NPM Scripts

| Command | Purpose |
|---------|---------|
| `npm run validate` | Run data integrity checker |
| `npm run trim-mp3` | Trim MP3 files via MPEG frame parsing |
| `npm run dev` | Start live-server on port 3000 |
| `npm run test` | Run vitest (233 tests) |
| `npm run test:watch` | Run vitest in watch mode |
| `npm run optimize:report` | Asset optimization dry-run report |
| `npm run optimize:png` | Convert PNGs to WebP |
| `npm run optimize:gif` | Convert GIFs to animated WebP |
| `npm run optimize:all` | Convert all assets |

### 8.2 Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^2.1.0 | Test runner and assertion library |
| `live-server` | ^1.2.2 | Local development server |

### 8.3 Optional External Tools

- `cwebp` / `gif2webp` (Google WebP) or `ImageMagick` for asset optimization
- `ffmpeg` as alternative converter

### 8.4 CI/CD

**None.** No `.github/workflows/`, no Docker files, no pipeline configurations.

### 8.5 Code Quality Tools

**None.** No ESLint, Prettier, Biome, or git hooks configured.

---

## 9. Data Flow Diagrams

### 9.1 Load Order and Dependency Chain

```
index.html
  ├── <link> styles.css         → CSS (no JS dependency)
  ├── <script> js/data.js      → Defines all global data tables
  ├── <script> js/storage.js   → Defines global STORE singleton
  └── <script> js/game.js      → Defines all game logic
```

### 9.2 Gameplay Data Flow

```
User Action
  → screen event handler (pickMove, answer, etc.)
  → mutates global G state
  → calls rendering function (showMoves, renderBattle, updateBars)
  → reads DOM elements, sets innerHTML/src/style
  → calls persistGame() for auto-save
  → STORE.setItem() → IndexedDB (+ localStorage fallback)
```

### 9.3 Save/Load Flow

```
persistGame()
  → serializeGame()         (G → JSON, Sets → Arrays)
  → STORE.setItem(key, json)
  → archiveCurrentRoster()  (merge team+PC → collection)

restoreGame(save)
  → createDefaultState()    (fresh template)
  → fills from parsed JSON
  → normalizeMonState() on each Pokemon
  → Sets rebuilt from Arrays
  → start new encounter or go to shop
```

### 9.4 Battle Turn Resolution

```
showMenu()
  → showMoves()
  → pickMove(idx)
    → showQuestion(diff)
    → answer(idx)
      → recordQuestionResult()
      → showAnswerResult(ok)
      → resolvePendingTurn()
        ├─ correct: runMove("player", move)
        │   → playMoveAnimation() → playSfx() → calcDamage()
        │   → applyMoveEffects() → endStep("player")
        └─ wrong: endStep("player")
      → runEnemyTurn() (hard mode or player failed)
        → chooseEnemyMove()
        → runMove("enemy", move)
      → handleDeaths()
        → enemyDead() | checkPlayerAlive()
      → loop back to showMenu()
```

---

## 10. Asset Inventory

| Category | Count | Format | Location |
|----------|-------|--------|----------|
| Pokemon sprites (front) | 334 | GIF | `assets/sprites/ani/` |
| Pokemon sprites (back) | 334 | GIF | `assets/sprites/ani-back/` |
| Move animations | 45 sheets | PNG | `assets/animations/move-effects/` |
| Move SFX | 160 files | MP3 | `assets/sfx/attack-moves/` |
| Background music | 6 tracks | MP3 | `assets/music/` |
| Arena backgrounds | 28 | PNG | `assets/backgrounds/` |
| Trainer sprites | 6 | PNG | `assets/trainers/` |

---

## 11. Key Metrics

| Metric | Value |
|--------|-------|
| Total repo size | ~220.68 MB (mostly assets) |
| Production JS lines | ~8,193 (data.js + game.js + storage.js) |
| Total JS including test/scripts | ~12,365 lines |
| CSS lines | ~1,976 |
| HTML lines | 234 |
| Pokemon in DEX | 334 entries |
| Evolution relationships | 146 |
| Quiz questions | 136 active |
| Campaign encounters | 9 (3 wild, 5 trainer, 1 boss) |
| Type chart size | 18x18 matrix |
| Move animation sheets | 45 |
| Move SFX files | 160 |
| Music tracks | 6 |
| Save slots | 3 |
| Test suites | 36 |
| Test cases | 233 |
| Known bugs | 5 documented in BUG-REPORT.md |

---

## 12. Evolution Mechanics

### 12.1 Overview

Evolution allows Pokemon to transform into stronger forms, gaining stats, new moves, and sometimes type changes. It is the primary long-term progression mechanic in the game. Evolution is offered after every victorious battle where the active Pokemon has reached the required level for its next evolutionary stage.

### 12.2 Data Structures

#### EVO_DATA (146 entries, `data.js:1986-2140`)

Each entry is a triple: `[fromId, toId, levelRequired]`. Covers Gen 1-7+ Pokemon. Examples:

| From | To | Required Level |
|------|----|---------------|
| bulbasaur → ivysaur → venusaur | | 16 → 32 |
| charmander → charmeleon → charizard | | 16 → 36 |
| dratini → dragonair → dragonite | | 30 → 55 |
| deino → zweilous → hydreigon | | 50 → 64 |
| beldum → metang → metagross | | 20 → 45 |

Notable design: some 3-stage lines skip middle forms (e.g., `caterpie → butterfree`, `magikarp → gyarados`, `rockruff → lycanroc`) when the middle form is absent from the DEX.

#### EVOLUTIONS Map (`data.js:2141-2144`)

Built at game startup by filtering `EVO_DATA`:
```
EVO_DATA.forEach(([from, to, level]) => {
  if (MON_BY_ID[from] && MON_BY_ID[to]) EVOLUTIONS[from] = { to, level };
});
```
This safety filter removes any chain where either endpoint is missing from the Pokemon roster, preventing broken evolutions.

### 12.3 Core Functions (all in `data.js`)

#### `canEvolve(mon)` — `data.js:2148-2152`

```
function canEvolve(mon) {
  if (!mon || !mon.id) return false;
  const evo = EVOLUTIONS[mon.id];
  return !!(evo && (mon.level || 1) >= evo.level && MON_BY_ID[evo.to]);
}
```

Checks three conditions:
1. Mon has a valid ID and evolution entry exists
2. Mon's current level meets or exceeds the required level
3. The target form exists in the DEX

#### `pickEvolutionMove(mon, target)` — `data.js:2156-2164`

```
function pickEvolutionMove(mon, target) {
  const owned = new Set((mon.moves || []).map((m) => m && m.name));
  const candidates = (target.moves || []).filter(
    (m) => m && !owned.has(m.name),
  );
  if (!candidates.length) return null;
  candidates.sort((a, b) => (b.power || 0) - (a.power || 0));
  return cleanMove({ ...candidates[0] });
}
```

Scans the evolved form's moveset for the **strongest move** (highest power) not already known by the mon. This is typically the evolved form's ultimate-tier move.

#### `evolveMon(mon)` — `data.js:2169-2230`

This is the core transformation function. It does **not** check the level requirement — the caller must verify with `canEvolve` first.

**Stat transformation:**
```
hpDelta = max(0, target.hp - source.hp)   // never negative
atkDelta = max(0, target.atk - source.atk)
defDelta = max(0, target.def - source.def)
mon.hp += hpDelta
mon.atk += atkDelta
mon.def += defDelta
mon.curHp = clamp(mon.curHp + hpDelta, 1, mon.hp)  // current HP adjusted up
```

Stat deltas are **clamped to be non-negative** — evolving never reduces stats, even if the new form has lower base stats than the current mon's buffed stats.

**Identity transformation:**
- `mon.id`, `mon.name`, `mon.type`, `mon.type2` — Updated to target form
- `mon.tc`, `mon.tc2` — CSS type classes recalculated
- `mon.rarity` — Updated (e.g., Common → Rare)
- `mon.xpYield` — Updated for higher bounty if caught
- `mon.desc` — Updated flavor text

**Move learning:**
- If mon has fewer than 4 moves: the new move is **appended**
- If mon already has 4 moves: the **weakest existing move** (lowest power) is **replaced**
- The new move is a deep clone via `cleanMove({ ...candidates[0] })`

**Return value:**
```
{
  fromId, fromName,     // original identity
  toId, toName,         // new identity
  hpDelta, atkDelta, defDelta,  // stat gains
  learnedMove           // move name, or null if no new move
}
```

### 12.4 Evolution Trigger in Battle Flow

Evolution is offered in the **victory panel** (`game.js:2585-2730`) — the UI shown after defeating an enemy.

#### Step 1: Enemy Defeated (`enemyDead()`, `game.js:2524-2566`)

After combat ends:
1. XP is awarded to the active Pokemon (100%) and bench (35% of base)
2. `levelUpMon()` is called which may trigger one or more level-ups
3. Level-ups grant stat gains and can unlock base DEX moves at levels 3 and 6
4. `showVictoryScreen()` is called with defeat details and level-up gains

#### Step 2: Victory Panel Rendering (`renderVictoryPanel()`, `game.js:2606-2706`)

The victory panel shows three things in order:
1. **Level-up summary** — Level number, stat gains, and any new moves learned from base DEX
2. **Evolution prompt** (if eligible) — "CAN EVOLVE!" with:
   - Visual preview: current sprite → evolved sprite (dimmed)
   - Stat gain preview: `+X HP +Y ATK +Z DEF`
   - Note: "Learns a new move from its evolved form."
   - Two buttons: **Evolve!** (gold) and **Not Now**
3. **Continue button** — "Continue to Shop" appears only after evolution is resolved (confirmed or declined)

The key condition for showing the prompt:
```
a && canEvolve(a) && !evoDeclined
```
Where `a` is the active Pokemon. Evolution is **only offered for the active Pokemon** — bench Pokemon are not prompted, even if eligible.

#### Step 3: Confirming Evolution (`confirmEvolution()`, `game.js:2708-2718`)

```
function confirmEvolution() {
  const ctx = G.pendingVictory;
  if (!ctx) return;
  const a = active();
  if (!a || !canEvolve(a)) return;
  const result = evolveMon(a);
  if (!result) return;
  ctx.evoResult = result;
  refreshHud();
  renderVictoryPanel();  // re-renders to show evolution result
}
```

After evolution, the panel re-renders showing:
- "EVOLVED!" header
- Before → after sprite comparison with flash animation
- The `+X HP +Y ATK +Z DEF` gains
- The learned move name
- "Continue to Shop" button

#### Step 4: Declining Evolution (`declineEvolution()`, `game.js:2720-2724`)

Sets `evoDeclined = true` — the prompt is removed and the "Continue to Shop" button appears. The mon stays unevolved; there is no second chance that battle.

#### Step 5: Continue (`finishVictory()`, `game.js:2727-2730`)

Clears `G.pendingVictory` and transitions to the shop screen via `goToShop()`.

### 12.5 State Persistence Through Evolution

Evolution uses a **pending victory state** pattern (`G.pendingVictory`):

```
G.pendingVictory = {
  defeated, reward, xpGain, levelGains, meta,
  evoResult: null,       // Set after evolveMon() runs
  evoDeclined: false,    // True if player clicks "Not Now"
}
```

This state survives re-renders so the panel can transition from "prompt" → "result" → "continue" without losing context. It is cleared when `finishVictory()` is called.

### 12.6 What Persists Through Evolution

| Property | Behavior |
|----------|----------|
| List of basic/pre-evolution moves | Preserved (unless replaced by a stronger new move) |
| Held item | Preserved |
| Ability | Preserved |
| Current HP | Adjusted upward by HP delta (clamped to 1 minimum) |
| Level, XP | Preserved |
| FX/status effects | Preserved |
| `fainted` flag | Preserved |
| Rarity | Updated to target form's rarity |
| Type | Updates to target form (may change from mono to dual or vice versa) |
| XP yield on defeat | Updates to target form's value |
| Sprite reference | Changes via `mon.id` change (sprites referenced by ID) |

### 12.7 XP Curve and Level-Up Flow

```
xpForLevel(lvl) = floor(80 + lvl * 30)
```

| Level | XP to reach |
|-------|-------------|
| 1 → 2 | 110 |
| 2 → 3 | 140 |
| 3 → 4 | 170 |
| 5 → 6 | 230 |
| 15 → 16 | 530 |
| 50 → 51 | 1580 |

Level-ups are processed in a `while` loop — if a mon gains enough XP to jump multiple levels, all are processed in sequence. Each level grants:
- **HP**: `round(3 + (rarityHpRange * 0.04))`
- **ATK**: +1 on even levels
- **DEF**: +1 on every 3rd level (3, 6, 9...)
- **New move from base DEX**: At level 3 (3rd move) and level 6 (4th move)

### 12.8 Design Decisions and Edge Cases

1. **No level check in `evolveMon`**: The function transforms regardless; the caller (`canEvolve`) is responsible for the guard. This allows the dev guide mode to force-evolve for testing.

2. **Non-negative stat deltas**: If a mon has been buffed beyond the target form's base stats (e.g., rare EVs), evolution adds `Math.max(0, delta)`. The mon never loses stats.

3. **Missing middle forms**: Some 3-stage lines that lack middle forms in the DEX skip directly (e.g., `caterpie → butterfree` at level 10). This is handled by `EVO_DATA` entries that simply connect first to final form.

4. **Evolution is optional**: Players can decline and keep their current form indefinitely. All stat gains from leveling still apply.

5. **Only active mon is prompted**: Bench Pokemon that level up from shared XP are not offered evolution, even if eligible. They must be switched in as active and defeat an enemy.

6. **Catching already-evolved forms**: Wild/trainer encounters may field evolved Pokemon directly — these are caught as their evolved form with the pre-evolved moves already absent.

7. **Guide/dev mode** (`game.js:3769-3946`): A separate `guideEvoState` singleton powers the evolution testing screen accessible via `?guide=1`. It allows selecting any mon, setting any level, and previewing evolution chains with stat previews and one-click evolution.

### 12.9 Complete Evolution Chain Examples

```
bulbasaur → ivysaur (Lv16) → venusaur (Lv32)
gastly → haunter (Lv25) → gengar (Lv36)
dratini → dragonair (Lv30) → dragonite (Lv55)
larvitar → pupitar (Lv30) → tyranitar (Lv55)
deino → zweilous (Lv50) → hydreigon (Lv64)
beldum → metang (Lv20) → metagross (Lv45)
goomy → sliggoo (Lv40) → goodra (Lv50)
```

### 12.10 Test Coverage

The test suite (`test/game.test.js:1178-1280`, `2559-2584`, `3201-3387`) covers:

| Test | What it verifies |
|------|-----------------|
| `canEvolve` at required level | Returns true |
| `canEvolve` below required level | Returns false |
| `canEvolve` for non-evolving mon | Returns false |
| `canEvolve` for null/undefined | Returns false |
| `EVOLUTIONS` map integrity | Every EVO_DATA entry has a corresponding EVOLUTIONS key |
| `evolveMon` transforms mon | ID, name, stats all update correctly |
| `evolveMon` no evolution entry | Returns null |
| `evolveMon` adds new move | Move count increases |
| `pickEvolutionMove` | Picks strongest unknown move |
| Evolution chain (3-stage) | Bulbasaur → Ivysaur → Venusaur |
| Held item + ability persist | Both survive evolution |
| `canEvolve` for multi-stage | True for both stages at correct levels |
| Dev mode evolution rendering | Panel shows evolve button, handles non-evolving mons, level-gated rendering, evolution result display |

