# BioMon - IB 35AC Battle

BioMon is a self-contained browser game for reviewing IB 35AC course concepts through Pokemon-style turn-based battles. Players choose a three-Pokemon team, answer course questions to power moves, defeat or catch opponents, buy items between encounters, manage a PC box, and try to clear a planned nine-encounter campaign.

The active app is a single-page HTML/CSS/JavaScript application split into separate source files (`js/`, `styles.css`) loaded via `<script>` and `<link>` tags. No bundler or build step is required to play. A Node.js dev toolchain (vitest, validate scripts) is available for testing and data integrity checks.

## Hosted Version

The game is hosted through Cloudflare Pages at `https://ib-35ac.pages.dev`.

## Run Locally

Open `index.html` in a modern browser:

```powershell
start .\index.html
```

If your browser blocks local assets, serve the folder instead:

```powershell
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Dev / Guide Mode

Add `?guide=1` to the local URL to open the developer guide toolbar:

```text
http://localhost:8000?guide=1
```

The toolbar can jump directly to title, starter select, battle, moves, questions, catch/bag, shop, PC, boss, result, and backdrop preview states.

Use `Backdrops` to inspect Pokemon positioning across every battle arena. The preview uses the real battle arena CSS and lets you quickly cycle backdrops, choose the player Pokemon, choose the opponent Pokemon, step through each Pokemon list, and swap the two sides.

## Current Project Structure

```text
.
|-- index.html              # page shell, markup, embedded font imports
|-- styles.css              # all styling (extracted from index.html)
|-- BUG-REPORT.md           # documented bugs found by the test suite
|-- README.md
|-- package.json            # dev dependencies (vitest only)
|-- vitest.config.js
|-- js/
|   |-- data.js             # game data tables, question bank, asset paths
|   |-- game.js             # core engine: state, rendering, battle, shop, save/load
|   `-- storage.js           # IndexedDB wrapper (STORE)
|-- scripts/
|   |-- game-data-loader.js # shared VM stub for headless data loading
|   |-- validate-game-data.js
|   |-- optimize-assets.js
|   `-- trim-mp3.js
|-- test/
|   `-- game.test.js        # vitest data integrity & type chart tests
|-- assets/
|   |-- animations/
|   |   `-- move-effects/
|   |-- backgrounds/
|   |   `-- High graphic/
|   |-- music/
|   |-- sfx/
|   |   `-- attack-moves/
|   |-- sprites/
|   |   |-- ani/
|   |   `-- ani-back/
|   `-- trainers/
`-- index.*.backup.html     # older snapshots (not loaded by the app)
```

## Main Files

| File | Purpose |
|------|---------|
| `index.html` | Page shell: markup for all six screens, embedded `<link>` for `styles.css`, `<script>` tags for `js/data.js`, `js/storage.js`, and `js/game.js` |
| `styles.css` | All game CSS: layout, screen backgrounds, cards, buttons, sprites, HP/XP bars, shop/pc/result UI, responsive scaling |
| `js/data.js` | Immutable data tables: types, moves, abilities, items, dex, evolutions, questions, run plan, arenas, asset path maps |
| `js/game.js` | Core engine: state creation, screen rendering, quiz flow, battle resolution, enemy AI, catch, shop, PC, audio/animation, save/load |
| `js/storage.js` | IndexedDB wrapper (`STORE`): provides `setItem`/`getItem`/`removeItem` with a localStorage fallback |
| `scripts/validate-game-data.js` | Node.js data integrity check (types, dex, evolutions, sprites, questions, arenas, items) |
| `scripts/game-data-loader.js` | Shared headless VM stub used by both the validator and vitest tests |
| `test/game.test.js` | vitest test suite: data integrity, type chart multipliers, dex references, move pools, run plan structure, question validation |

The `index.*.backup.html` files are older snapshots kept for recovery and comparison. They are not loaded by the app.

## Asset Inventory

The app loads assets from local paths defined near the top of `index.html`:

- `assets/sprites/ani/`: 334 front-facing animated Pokemon GIFs.
- `assets/sprites/ani-back/`: 334 back-facing animated Pokemon GIFs.
- `assets/backgrounds/`: 28 active title, selection, shop, result, and battle arena images.
- `assets/backgrounds/High graphic/`: archived alternate arena backgrounds not referenced by the current app.
- `assets/animations/move-effects/`: 45 retained Gen 3 move animation sprite sheets.
- `assets/music/`: 6 Pokemon Black/White music tracks for title, battle, rare battle, trainer battle, low HP, and victory states.
- `assets/sfx/attack-moves/`: 160 move sound effects, flattened under in-game move names.
- `assets/trainers/`: 6 trainer sprites plus a local README.

The app also imports Google Fonts (`Press Start 2P`, `Jersey 10`, and `Inter`). The game still runs offline, but those fonts may fall back if they are not cached.

## Gameplay Overview

BioMon combines three systems:

- Quiz combat: attacks require answering IB 35AC multiple-choice questions.
- Turn-based battles: Pokemon have HP, attack, defense, levels, XP, types, moves, status effects, abilities, held items, and fainting.
- Roguelite progression: runs move through planned encounters with shops, catching, team management, and final results.

The course content covers human variation, race and biology, population genetics, evolution, anthropology, health disparities, ancient DNA, epigenetics, and gene-culture evolution.

## Screen Flow

The app has six main screens:

- `title-screen`: difficulty mode, music toggle, three save slots, load/start actions, and carried-over collection entry point.
- `select-screen`: pick three Pokemon from either the starter pool or archived collection.
- `battle-screen`: responsive arena, scaled sprites, HP/XP bars, status chips, streak HUD, questions, moves, bag, team switcher, catch attempts, and battle shop.
- `shop-screen`: post-battle shop, inventory, healing item use, PC access, and next encounter button.
- `pc-screen`: swap team members with boxed Pokemon.
- `result-screen`: victory/loss stats and next-run action.

Only one screen is active at a time. Screen switching is handled by `showScreen(id)`.

## Campaign

The planned run is stored in `RUN_PLAN` and currently has 9 encounters:

1. Field Study wild encounter.
2. Anna - GSI Concept Crusher.
3. Monica - GSI Section Strategist.
4. Rare Habitat wild encounter.
5. Annie - GSI Lab Partner.
6. Emily - GSI Midterm Boss.
7. High-Risk Habitat wild encounter.
8. Fiona - GSI Final Evaluator.
9. Prof. Nielsen - Champion Exam final boss.

Wild encounters are catchable. Trainer and boss Pokemon are not catchable. After the planned campaign, `getEncounterSpec()` can generate open-ended catchable wild expeditions scaled to the player's team.

## Difficulty Modes

Difficulty is defined in `MODES`:

- Easy: the enemy usually acts after failed answers, skipped turns, stun turns, item use, switches, failed catches, or other lost-tempo actions.
- Hard: the enemy can counter every round if it is still alive, even after correct answers.

The selected mode is stored in game state and shown in the battle HUD.

## Data Tables

Most game changes start in the JavaScript data tables inside `index.html`:

- `TYPES`, `EFF_DATA`, and `TYPE_CHART`: Pokemon types and effectiveness.
- `MOVE_POOLS`: type-specific basic, special, and ultimate move pools.
- `UTIL_MOVES`: shared utility moves.
- `LEGENDARY_MOVES`: signature move overrides.
- `ABILITIES` and `TYPE_ABILITIES`: passive abilities and type-based assignment pools.
- `HELD_ITEMS`: equippable passive items.
- `RARITY_STATS`: stat ranges, move slot quality, catch rate, and XP yield by rarity.
- `DEX`: 334 Pokemon entries.
- `STARTER_IDS`: 18 starter-screen Pokemon.
- `EVO_DATA`: 146 evolution relationships.
- `TYPE_ARENAS`: background selection by enemy primary type.
- `ITEMS`: shop and bag items, including held items merged in from `HELD_ITEMS`.
- `QS`: 136 active in-game quiz questions.
- `RUN_PLAN`: planned campaign encounters.

## Question System

Active gameplay questions live in the `QS` array. Each question uses this shape:

```js
{
  d: 1,
  cat: "Human Variation",
  q: "Question text",
  a: ["Answer A", "Answer B", "Answer C", "Answer D"],
  c: 0,
  e: "Explanation shown after answering."
}
```

Difficulty maps to move tiers:

- `d: 1`: basic moves.
- `d: 2`: special moves.
- `d: 3`: ultimate moves.

`getQ(diff)` avoids repeating questions of the same difficulty until that difficulty pool has been exhausted. Questions answered incorrectly are tracked in `questionStats` and can reappear earlier after a short gap, giving missed material a lightweight spaced-repetition effect. `buildQuestionRound()` shuffles answer order while preserving the correct answer. Keyboard shortcuts `A`-`D` and `1`-`4` answer visible question buttons.

## Battle System

The battle system supports:

- Type effectiveness and immunities.
- STAB and critical hits.
- Difficulty scaling.
- Accuracy and crit rates.
- Streak requirements for stronger moves.
- Damage previews on move buttons.
- Healing, HP drain, poison, stun, guard, weaken, and vulnerable effects.
- Passive abilities such as Blaze, Static, Levitate, Sturdy, Intimidate, Regenerator, Adaptability, Guts, and Speed Boost.
- Held items such as Leftovers, Choice Band, Focus Sash, Scope Lens, Resist Berry, and Life Orb.
- Enemy AI move scoring.
- XP, level-ups, and optional evolution prompts.
- Responsive arena scaling for desktop and mobile play.

Important battle functions:

- `showMoves()` renders move buttons and damage previews.
- `requiredStreak()` and `canUseMove()` gate stronger moves.
- `runMove(side, move)` resolves animation, SFX, damage, healing, effects, recoil, messages, and death checks.
- `calcDamage()` applies stat, type, crit, ability, item, and status modifiers.
- `applyMoveEffects()` applies move status effects.
- `endStep()` handles poison, Regenerator, and Leftovers.
- `chooseEnemyMove()` and `scoreEnemyMove()` choose enemy actions.
- `handleDeaths()` routes victory, defeat, and forced-switch states.

## Responsive Battle Layout

The battle arena is designed to stay playable across desktop and mobile viewport sizes. Arena backgrounds in `TYPE_ARENAS` stretch to the active arena box, while Pokemon sprites, trainer sprites, platforms, HP boxes, send-out effects, move VFX, and damage text scale or position relative to that same arena. `positionBattleShadows()`, `spriteArenaPoint()`, and `positionBattleEffect()` keep dynamic overlays aligned after resizing.

## Catching, Team, And PC

The active team is capped at three Pokemon. Catching is available only in wild encounters and uses Poke Ball, Great Ball, or Ultra Ball modifiers.

`calcCatchRate()` considers:

- Base catch rate from rarity.
- Enemy HP remaining.
- Status effects.
- Rarity penalty.
- Level penalty.
- Ball modifier.

If the team has fewer than three Pokemon and does not already include the caught species, the catch joins the team. Otherwise, it goes to the PC box. `pc-screen` lets the player swap boxed Pokemon with current team members while preserving HP, fainted state, levels, XP, moves, abilities, held items, and battle state.

## Items And Shop

The default inventory is defined in `DEFAULT_INV`. The shop and bag use `ITEMS`, which includes:

- Potion.
- Super Potion.
- Revive.
- X Attack.
- Poke Ball.
- Great Ball.
- Ultra Ball.
- Held items merged from `HELD_ITEMS`.

Healing and revive items target a specific team member. Battle item use generally costs the player's turn. Equipping a held item opens a team selector and does not spend a combat turn.

## Saving And Persistence

The game uses browser IndexedDB as the primary storage backend, with `localStorage` as a fallback.

The `STORE` object (`js/storage.js`) wraps IndexedDB with a `localStorage`-like API (`setItem`/`getItem`/`removeItem`). `persistGame()` tries IndexedDB first; if it fails, it falls back to `localStorage` and shows an error toast.

Current keys:

```text
biomon_save_v2_slot_1
biomon_save_v2_slot_2
biomon_save_v2_slot_3
biomon_save_v2
biomon_collection_v1
biomon_music_enabled_v1
```

`biomon_save_v2_slot_1` through `biomon_save_v2_slot_3` are the current three save slots. `biomon_save_v2` is a legacy fallback read for slot 1 and may be removed when clearing slot 1. `biomon_collection_v1` stores archived roster data across completed or failed runs. `biomon_music_enabled_v1` stores the music toggle.

Save/load functions:

- `serializeMon()` and `serializeGame()` convert runtime state into plain JSON.
- `persistGame()` writes the active slot and archives the current roster.
- `readSave()`, `readSaveSlots()`, and `restoreGame()` load saved runs.
- `archiveCurrentRoster()`, `readCollection()`, and `saveCollection()` manage the cross-run collection.
- `clearSave()` removes a slot save.

When adding persistent state, update both serialization and restoration. `Set` values such as `used` and `caughtIds` must be converted to arrays before saving and rebuilt on restore.

## Audio And Effects

Audio and animation are handled directly in the browser:

- `MUSIC_TRACKS`, `setMusicTrack()`, `battleMusicTrack()`, and `updateMusicForScreen()` control background music.
- `moveSfxPath()` and `playMoveSfx()` load attack sound effects from `assets/sfx/attack-moves/`.
- `moveAnimationSheet()`, `moveAnimationTarget()`, and `playMoveAnimation()` run lightweight sprite-sheet effects from `assets/animations/move-effects/`.

The music toggle is global and persisted in localStorage.

Background music preloads metadata first instead of whole tracks. The low-HP track is trimmed to about five minutes to keep the local asset set smaller while preserving the in-game music cue.

## Validation

Run the lightweight data validator with Node:

```powershell
node .\scripts\validate-game-data.js
```

It checks embedded game data, question shapes, sprite availability, starter/evolution references, campaign ace IDs, item references, and static background references.

## Tests

Run the vitest test suite:

```powershell
npx vitest run
```

The suite (**233 tests across 21 suites**) validates:

- **Data integrity** — TYPES, DEX (200+ entries), STARTER_IDS, EVO_DATA, MOVE_POOLS, RUN_PLAN, 100+ questions, HELD_ITEMS, ITEMS, ALL_MONS, TYPE_ARENAS
- **Type chart** — 400+ individual multiplier checks, immunity pairs (Normal/Ghost, Electric/Ground, etc.), 4x ceilings, dual-type combinations
- **Utility functions** — clamp, shuffle, weightedChoice, finiteNumber, hpColor, save key helpers
- **Leveling & XP** — xpForLevel, levelUpMon (single, multi, exact threshold, edge cases)
- **Monster operations** — normalizeMonState (null, fill, clamp, faint, string input), cloneMon, createCaughtMon, createRunMon
- **Battle mechanics** — calcDamage with STAB, crit, guard, weaken, vulnerable, held items, abilities, type multiplier, estimateDamage, healTarget
- **Move rates** — accuracy per tier, stun, heal, debuff, caching, adjustedCrit with Scope Lens and abilities
- **Encounter generation** — planned vs endless specs, scaling, applyEncounterModifiers, scaleToLevel, normalizeEncounterMeta
- **Catching** — calcCatchRate with HP, ball, rarity, status, level factors
- **Move effects** — guard, poison, stun, secondaryChance, hasEffect, clearSwitchOutEffects
- **Evolution** — canEvolve, evolveMon, pickEvolutionMove, expandMove, EVOLUTIONS map integrity
- **Items & inventory** — isTargetedItem, canTargetWithItem, bagItemDesc, shop rules
- **Question system** — questionIndexesForDifficulty, buildQuestionRound, weightedQuestionPick, queue build/serialize/restore, getQ flow
- **Enemy AI** — scoreEnemyMove (general, immune, lethal), chooseEnemyMove scoring invariants
- **Game state** — createDefaultState, serializeGame, mutation isolation
- **Sophisticated edge cases** — 30+ probes for negative XP, zero xpToNext infinite loop, negative heal, zero attack damage floor, fainted inconsistency, rarity fallback, null safety, type chart reciprocity, catch rate extremes, question queue exhaustion, and more
- **5 documented bugs** — see `BUG-REPORT.md` for details (`healTarget` negative amount, `normalizeMonState` fainted/rarity bugs, `saveEncounterLabel` null crash, `calcDamage` zero-power damage)

## Developer Map

```text
Source files loaded in the browser:
|-- index.html         page shell, screen markup, font imports
|-- styles.css         all styling
|-- js/data.js         types, moves, abilities, items, dex, evolutions, questions, run plan, arenas, asset paths
|-- js/storage.js      IndexedDB wrapper (STORE.setItem / getItem / removeItem + localStorage fallback)
`-- js/game.js         audio/animation helpers → data table references → state creation/save-load
                       → encounter generation → catching → screen management/rendering
                       → quiz flow → battle resolution/enemy AI → shop/bag/pc systems → startup

Dev tooling:
|-- scripts/
|   |-- game-data-loader.js  shared VM context for headless data loading
|   |-- validate-game-data.js   Node.js data integrity validator
|   |-- optimize-assets.js      asset pipeline (sprite/sfx)
|   `-- trim-mp3.js             audio trimming utility
`-- test/
    `-- game.test.js         vitest test suite (233 tests, 21 suites)
```

The static screen markup in `index.html` appears before the `<script>` tags. JavaScript fills placeholder elements such as `mon-grid`, `bpanel`, `shop-grid`, `pc-team`, `pc-box-grid`, and `r-stats`.

## Runtime State

Mutable game state lives in global `G`, created by `createDefaultState()`.

Important fields include:

- `team`: current three-Pokemon team.
- `activeIdx`: active team member index.
- `pcBox`: boxed Pokemon.
- `money`: shop currency.
- `inv`: inventory.
- `enemy`: current opponent.
- `encounterMeta`: display and rules metadata for the active encounter.
- `encounterCount`: current run progress.
- `streak` and `bestStreak`: answer streak tracking.
- `asked` and `correct`: quiz performance tracking.
- `used`: question indexes already used this run.
- `caughtIds`: species caught this run.
- `pendingMove` and `pendingAnswerOk`: quiz-to-move resolution state.
- `pendingVictory`: post-KO level-up/evolution/continue state.
- `mode`: `easy` or `hard`.
- `locked`: guards against overlapping async actions and double clicks.

Most turn bugs come from state not being reset in `createDefaultState()`, `normalizeMonState()`, `startEncounter()`, `runMove()`, `endStep()`, or `handleDeaths()`.

## Common Edit Recipes

Add an in-game question:

1. Edit the `QS` array in `index.html`.
2. Add `d`, `cat`, `q`, `a`, `c`, and `e`.
3. Keep `c` as the zero-based index of the correct answer before shuffling.

Add a Pokemon:

1. Add matching GIFs to `assets/sprites/ani/` and `assets/sprites/ani-back/`.
2. Add a row to `DEX` using the same ID as the filenames.
3. Confirm the primary type exists in `MOVE_POOLS`, `TYPE_ABILITIES`, and `TYPE_ARENAS`.
4. Add the ID to `STARTER_IDS` only if it should appear on the starter screen.

Change the campaign:

1. Edit `RUN_PLAN`.
2. Use `kind: "wild"` for generated catchable encounters.
3. Use `kind: "trainer"` or `kind: "boss"` with `aceId` for fixed opponent fights.
4. Set `allowCatch: false` for trainer and boss fights.
5. Keep `finalBoss: true` on the intended campaign-ending fight.

Change combat balance:

1. Tune `RARITY_STATS` for broad Pokemon stat and reward balance.
2. Tune `MOVE_POOLS` or `LEGENDARY_MOVES` for move power, difficulty, and effects.
3. Tune `calcDamage()` for global damage rules.
4. Tune `calcCatchRate()` for catch difficulty.
5. Tune `levelUpMon()` and `EVO_DATA` for growth pacing.
6. Tune `ABILITIES`, `TYPE_ABILITIES`, and `HELD_ITEMS` for passive behavior.

Add or rename assets:

1. Keep Pokemon sprite filenames aligned with `DEX` IDs.
2. Keep move SFX filenames aligned with in-game move names or update `moveSfxPath()`.
3. Add move animation aliases in `MOVE_ANIMATION_ALIASES` when one sprite sheet should serve multiple move names.
4. Add arena backgrounds to `TYPE_ARENAS` after placing images in `assets/backgrounds/`.

## Current Limitations

- The app uses script-tag loading (no ES modules/bundler). Code runs in the global scope by design to keep the game self-contained and playable by opening `index.html`.
- Active quiz questions are embedded in `js/data.js`; the external JSON question database is not wired into runtime loading.
- Save data is browser-local (IndexedDB with localStorage fallback) and tied to the origin/path where the app is opened.
- UI rendering uses `innerHTML` with template literals throughout. This keeps the game as a single-bundle SPA without a framework, but malformed markup in a renderer can break a whole panel.
- Game mechanics that require DOM (battle animation, screen transitions, shop/PC interactions) are tested manually.
- The vitest suite (233 tests) covers pure data integrity, game logic functions, and edge cases. See `BUG-REPORT.md` for 5 known bugs detected by the test suite.
