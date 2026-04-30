# BioMon - IB 35AC Battle

BioMon is a self-contained browser game for reviewing IB 35AC course concepts through Pokemon-style turn-based battles. The player chooses a small starter team, answers course questions to power attacks, defeats or catches opponents, buys items between encounters, and tries to clear a nine-encounter run ending in a final boss.

The project is intentionally simple to run: there is no build system, package manager, backend, or database. The game lives in `index.html`, and all artwork and audio are stored locally under `assets/`.

## What This Codebase Does

BioMon combines three systems:

- A quiz game: each attack requires answering an IB 35AC multiple-choice question.
- A turn-based battle game: creatures have HP, attack, defense, types, moves, status effects, XP, levels, and fainting.
- A lightweight roguelite run: players progress through a fixed sequence of wild encounters, trainers, bosses, shops, captures, and team management.

The course content focuses on human variation, race and biology, population genetics, evolution, anthropology, health disparities, ancient DNA, epigenetics, and gene-culture evolution.

## How To Run

Open `index.html` in a modern browser.

Recommended options:

```powershell
# From the project root, open directly in the default browser
start .\index.html
```

Or use a simple local server if the browser blocks local asset loading:

```powershell
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

No install step is required.

## Project Structure

```text
.
├── index.html
├── README.md
├── index.pre-(de)buff.backup.html
├── index.pre-roster-expansion.backup.html
├── index.pre-roster-expansiov2.backup.html
├── index.restore-backup.html
└── assets/
    ├── backgrounds/
    └── sprites/
        ├── ani/
        └── ani-back/
```

### Main Files

`index.html` is the active application. It contains:

- HTML for all screens.
- CSS for layout, animations, responsive behavior, battle visuals, cards, HUDs, shops, and result screens.
- JavaScript for game state, question handling, battle logic, saving, item use, catching, leveling, encounter generation, and rendering.

The backup HTML files are older snapshots of `index.html`. They are useful for recovery or comparison but are not loaded by the game.

The root of `assets/backgrounds/` contains 28 active background images for the title screen, starter selection, shop, win/loss screens, and type-themed battle arenas. The code now has generic arena backgrounds for all 18 Pokemon types.

`assets/backgrounds/High graphic/` is an archive folder for arena backgrounds that were flagged as too high-detail for the pixel-style battle presentation. The active game does not reference that folder.

`assets/animations/move-effects/` contains the retained move animation sheets used by the battle system.

`assets/music/` contains background music for title/menu screens, battle variants, and critical-health battle state.

`assets/sfx/attack-moves/` contains the attack move sound effects referenced by the current move list. The files are flattened under the in-game move names so the battle system can load them directly.

`assets/sprites/ani/` contains 334 front-facing animated creature GIFs.

`assets/sprites/ani-back/` contains 334 back-facing animated creature GIFs for the player's side of battle.

## Game Flow

1. The title screen lets the player choose Easy or Hard mode, start a new game, continue a saved game, or begin a new run from the collection.
2. The starter screen lets the player pick three starters from a curated starter pool.
3. The battle screen runs turn-based combat.
4. After battles, the player can shop, manage the PC box, and continue to the next encounter.
5. The run ends with either defeat or victory after the final boss.

The run contains 9 encounters:

1. Wild Field Study
2. GSI trainer battle against Anna
3. GSI trainer battle against Monica
4. Wild Rare Habitat
5. GSI trainer battle against Annie
6. GSI Midterm Boss against Emily
7. Wild High-Risk Habitat
8. GSI trainer battle against Fiona
9. Champion Exam boss against Prof. Nielsen

Wild encounters can be caught. Trainer and boss Pokemon cannot be caught.

## Difficulty Modes

Easy mode gives the player more room to learn. The enemy attacks only after a failed answer, skipped turn, stun turn, item turn, switch turn, failed catch, or similar lost-tempo action.

Hard mode makes battles more punishing. The enemy counters every round if it is still alive, even when the player answers correctly.

The selected mode is stored in game state and shown in the battle HUD.

## Quiz System

Questions are stored in the `QS` array inside `index.html`. Each question has:

- `d`: difficulty level, where `1` is easy, `2` is medium, and `3` is hard.
- `cat`: category label.
- `q`: question text.
- `a`: answer choices.
- `c`: zero-based index of the correct answer.
- `e`: explanation shown after answering.

Move difficulty determines question difficulty:

- Basic moves use difficulty 1 questions.
- Special moves use difficulty 2 questions.
- Ultimate moves use difficulty 3 questions.

Correct answers execute the selected move. Wrong answers fail the move and usually give the enemy a chance to act.

Keyboard shortcuts are supported during questions:

- `A`, `B`, `C`, `D`
- `1`, `2`, `3`, `4`

## Battle System

Each creature has:

- ID and display name.
- Primary type and optional secondary type.
- Rarity.
- HP, attack, and defense.
- Four moves.
- Current HP.
- Level and XP.
- Status effect state.

Damage uses attack, defense, move power, type effectiveness, critical hits, difficulty scaling, and temporary modifiers. Type effectiveness is based on the `TYPE_CHART` generated from `EFF_DATA`.

The battle system supports:

- HP bars.
- XP bars.
- Level-ups.
- Critical hits.
- Type advantage and resistance.
- Streak-based move locking.
- Status effects.
- Item use.
- Switching.
- Catching.
- Enemy AI move selection.

## Move System

Moves are generated from type-based move pools in `MOVE_POOLS`. Each type has:

- Basic moves.
- Special moves.
- Ultimate moves.

Moves can deal damage, heal, drain HP, or apply effects. Some legendary or high-profile creatures receive special custom moves from `LEGENDARY_MOVES`.

Move effects include:

- `stun`: causes a skipped or delayed turn.
- `poison`: deals damage over time.
- `guard`: blocks or reduces incoming damage.
- `weaken`: reduces outgoing damage.
- `vulnerable`: increases incoming damage.

Special and ultimate moves require answer streaks before they can be used. Using stronger moves consumes streak progress.

## Creature Data

The main creature list is stored in the `DEX` array. Each entry follows this format:

```js
[showdownId, name, type1, type2OrNull, rarity, seed]
```

Example:

```js
["bulbasaur", "Bulbasaur", "Grass", "Poison", "Common", 35]
```

The `buildMon()` function converts raw `DEX` entries into full battle-ready creature objects. It uses the creature's rarity and seed to calculate stats and select moves deterministically.

Rarity affects:

- Base HP range.
- Attack range.
- Defense range.
- Move slot quality.
- Catch rate.
- XP yield.

Supported rarities are:

- Common
- Uncommon
- Rare
- Legendary

## Starters

The starter selection pool is stored in `STARTER_IDS`. The player chooses three starters before beginning a new run.

The starter list is intentionally smaller than the full dex so the first choice screen stays manageable. Additional creatures appear through wild encounters and can be added to the team or PC box if caught.

## Encounters

The full run structure is stored in `RUN_PLAN`. Each encounter can define:

- Encounter kind: wild, trainer, or boss.
- Display labels and subtitles.
- Whether catching is allowed.
- Enemy ace ID for trainer or boss fights.
- Rarity weights for wild encounters.
- Level offset.
- HP, attack, and defense multipliers.
- Reward and XP multipliers.
- Accent color.
- Final boss flag.

Wild encounters choose from the dex using weighted rarity probabilities. Trainer and boss encounters usually use a specific ace creature.

## Catching

Catching is only available during wild encounters. The available ball items are:

- Poke Ball
- Great Ball
- Ultra Ball

Catch odds are calculated from:

- Base catch rate from rarity.
- Remaining enemy HP.
- Status effects.
- Enemy rarity.
- Enemy level.
- Ball modifier.

Lower enemy HP significantly improves capture odds. If the player's active team has fewer than three creatures and does not already include that creature, the capture joins the team. Otherwise, it goes to the PC box.

## Items And Shop

Items are stored in the `ITEMS` array. The shop appears between encounters and can also be opened during battle.

Available item types:

- Healing items restore HP.
- Revive restores a fainted team member.
- X Attack boosts the next move.
- Balls attempt to catch wild Pokemon.

Using most items during battle costs the player's turn.

## Team And PC Box

The active team can hold up to three creatures. Extra caught creatures go into the PC box.

The PC screen allows swapping a boxed creature with a team member. HP, fainted state, level, XP, moves, and battle state are preserved during swaps.

Switching team members during battle costs a turn unless the switch is forced after a faint.

## Saving And Persistence

The game uses browser `localStorage`.

Two keys are used:

```text
biomon_save_v2
biomon_collection_v1
```

`biomon_save_v2` stores the current run:

- Mode.
- Team.
- PC box.
- Active creature.
- Current enemy.
- Encounter number.
- Money.
- Inventory.
- Score and streak stats.
- Current screen.

`biomon_collection_v1` stores archived roster data between completed or failed runs. This lets the title screen offer continuation from a previous collection.

The save is cleared when the run ends, but the roster is archived to the collection first.

## Screens

The app is organized into screen containers:

- `title-screen`: mode selection, save info, new/load buttons.
- `select-screen`: starter selection.
- `battle-screen`: arena, HUD, HP/XP bars, question panel, move menu, bag, team menu.
- `shop-screen`: post-battle shop and inventory.
- `pc-screen`: team and box management.
- `result-screen`: final win/loss stats.

Only one screen is active at a time. Screen switching is handled by `showScreen()`.

## Styling And Assets

The CSS is embedded in `index.html`. It defines:

- Pixel-styled buttons and headers.
- Type badges.
- Rarity badges.
- Responsive starter grid.
- Battle arena layout.
- Sprite animation.
- HP and XP bars.
- Damage popups.
- Shop cards.
- PC box grid.
- Result stats.

The game imports Google Fonts:

```css
Press Start 2P
Inter
```

If the user is offline, the local game still loads, but fonts may fall back depending on browser cache and network availability.

Arena backgrounds are selected dynamically from `TYPE_ARENAS` based on the enemy's primary type.

## Important JavaScript Sections

`MODES` defines Easy and Hard rules.

`MOVE_POOLS` defines type-specific basic, special, and ultimate moves.

`LEGENDARY_MOVES` overrides some final moves for legendary or signature creatures.

`RARITY_STATS` defines stat ranges, move slot quality, catch rates, and XP values.

`DEX` contains the creature roster.

`STARTER_IDS` controls the starter choices.

`RUN_PLAN` controls the nine-encounter campaign.

`ITEMS` controls shop and bag items.

`QS` contains all quiz questions.

`createDefaultState()` initializes a fresh game.

`readSave()`, `serializeGame()`, `persistGame()`, and `restoreGame()` handle localStorage saves.

`buildSelect()`, `togglePick()`, and `startGame()` handle starter selection.

`startEncounter()` and `createEncounter()` generate each battle.

`renderBattle()`, `refreshHud()`, `updateBars()`, and `showMenu()` update the battle UI.

`showQuestion()`, `answer()`, and `showAnswerResult()` run quiz turns.

`runMove()`, `calcDamage()`, `applyMoveEffects()`, and `handleDeaths()` resolve combat.

`runEnemyTurn()`, `chooseEnemyMove()`, and `scoreEnemyMove()` handle enemy AI.

`tryBattleCatch()` handles capture attempts.

`goToShop()`, `renderShop()`, and `buyItem()` handle shopping.

`openPCScreen()`, `renderPCScreen()`, and `swapFromPC()` handle PC box management.

`showEnd()` displays final results and archives the roster.

## Developer Map For Editing

The project is a single-page app, but it is easier to maintain if you treat `index.html` as several logical files stacked together:

```text
index.html
├── <head>
│   ├── metadata
│   └── embedded CSS
├── <body>
│   ├── screen markup
│   └── embedded JavaScript
│       ├── constants and data tables
│       ├── state creation and save/load helpers
│       ├── encounter generation
│       ├── rendering helpers
│       ├── quiz flow
│       ├── battle resolution
│       ├── catching, shop, and PC box systems
│       └── startup code
```

The screen markup is near the middle of the file, before the `<script>` tag. The main screens are normal HTML containers with IDs such as `title-screen`, `select-screen`, `battle-screen`, `shop-screen`, `pc-screen`, and `result-screen`. JavaScript does not create these screens from scratch; it mostly fills their placeholder elements, such as `mon-grid`, `bpanel`, `shop-grid`, `pc-team`, and `r-stats`.

The CSS is embedded near the top of `index.html`. Most visual changes can be made there without touching game logic. If you are changing layout, button styles, sprite sizes, responsive behavior, HP bars, cards, shop UI, or animations, start in the CSS. If you are changing what data appears inside a panel, start in the rendering functions.

## Main State Object

Runtime state lives in the global variable `G`, created by `createDefaultState()`.

Important fields:

- `team`: the player's active team.
- `activeIdx`: index of the currently active team member.
- `money`: current shop currency.
- `inv`: item inventory.
- `boost`: next-attack multiplier from X Attack.
- `enemy`: current opponent.
- `streak` and `bestStreak`: correct-answer streak tracking.
- `asked` and `correct`: quiz score tracking.
- `used`: set of question indexes already used this run.
- `picks`: starter IDs selected on the starter screen.
- `pendingMove`: move waiting for quiz resolution.
- `pendingAnswerOk`: whether the last answer allowed the move to resolve.
- `mode`: `easy` or `hard`.
- `locked`: prevents double-clicks and overlapping async turns.
- `encounterCount`: current run progress from 1 to 8.
- `defeatedCount`: number of defeated opponents.
- `pcBox`: boxed caught creatures.
- `caughtIds`: set of creature IDs caught in this run.
- `encounterMeta`: metadata for the current encounter, including whether catches are allowed.

Most bugs involving weird turn behavior are caused by one of these fields not being reset at the right time. When adding new gameplay state, initialize it in `createDefaultState()`, serialize it in `serializeGame()` if it must persist, and restore it in `restoreGame()`.

## Data Flow

Most of the app follows this pattern:

```text
data table -> builder/normalizer -> state object -> render function -> DOM update
```

Examples:

- `DEX` entries are converted by `buildMon()` into full creature objects.
- `RUN_PLAN` entries are converted by `createEncounter()` into `G.enemy` and `G.encounterMeta`.
- `QS` entries are selected by `getQ()` and converted into answer buttons by `buildQuestionRound()`.
- `ITEMS` entries are rendered by `renderShopCards()` and `showBag()`.

This means most edits should happen in data tables first. Only edit battle functions when the rule itself needs to change.

## Startup Flow

When the page loads, the bottom of the script runs:

```js
renderModeUi();
refreshTitleSaveUi();
```

Those calls prepare the title screen. A new run starts through this chain:

```text
openNewGame()
-> showScreen("select-screen")
-> buildSelect()
-> togglePick()
-> startGame()
-> startEncounter()
-> renderBattle()
-> showMenu()
```

A loaded run starts through:

```text
loadGameFromTitle()
-> readSave()
-> restoreGame()
-> showScreen(saved screen)
-> renderBattle(), goToShop(), or renderPCScreen()
```

If a screen is not updating correctly after loading, check `restoreGame()` first, then check the render function for that screen.

## Battle Turn Flow

Player attacks use this high-level flow:

```text
showMenu()
-> showMoves()
-> pickMove(index)
-> showQuestion(difficulty)
-> answer(choiceIndex)
-> showAnswerResult(ok)
-> resolvePendingTurn()
-> runMove("player", pendingMove)
-> handleDeaths()
-> runEnemyTurn() when required
-> showMenu()
```

Enemy attacks use:

```text
runEnemyTurn()
-> chooseEnemyMove()
-> scoreEnemyMove()
-> runMove("enemy", move)
-> handleDeaths()
```

`G.locked` is important during these flows. It stops the player from clicking several actions while animations, messages, or async combat resolution are still running.

## Combat Internals

`runMove(side, move)` is the main move resolver. It handles animation, damage, healing, drain, effects, streak consumption, messages, and death checks.

The important helper functions are:

- `resolveMoveType()` decides the actual attack type, including adaptive behavior.
- `getTypeMultiplier()` reads the type chart and calculates effectiveness.
- `calcDamage()` calculates final damage from stats, power, type matchup, crits, difficulty, guard, weaken, vulnerable, and boost effects.
- `applyMoveEffects()` applies status effects like stun, poison, guard, weaken, and vulnerable.
- `endStep()` and `settlePendingEffects()` process after-turn effects.
- `handleDeaths()` decides whether the enemy fainted, the player fainted, the run ended, or a forced switch is needed.

If damage feels too high or too low, tune `calcDamage()` first. If enemies make bad choices, tune `scoreEnemyMove()`. If a status lasts too long or too short, inspect `applyMoveEffects()`, `endStep()`, and `settlePendingEffects()`.

## Rendering Pattern

The app uses direct DOM updates with `document.getElementById()` and `innerHTML`.

Common rendering functions:

- `showScreen(id)`: changes the active screen.
- `buildSelect()`: renders starter cards.
- `renderBattle()`: renders creature names, levels, sprites, and arena.
- `refreshHud()`: updates money, mode, round, and caught counters.
- `updateBars()`: updates HP and XP bars.
- `updateStatuses()`: renders status chips.
- `showMenu()`: renders the main battle action menu.
- `showMoves()`: renders move buttons.
- `showBag()`: renders battle inventory.
- `renderShop()`: renders shop cards.
- `renderPCScreen()`: renders team and PC box.
- `showEnd()`: renders final stats.

Because much of the UI is built with template strings, check for malformed HTML when changing these functions. A missing quote or bracket can break an entire panel.

## Save/Load Internals

The save system cannot store live JavaScript objects like `Set` directly, so it converts state into plain JSON.

Save flow:

```text
persistGame()
-> serializeGame()
-> serializeMon()
-> localStorage.setItem()
```

Load flow:

```text
readSave()
-> JSON.parse()
-> restoreGame()
-> normalizeMonState()
```

Collection flow:

```text
archiveCurrentRoster()
-> saveCollection()
-> localStorage.setItem(COLLECTION_KEY)
```

When adding a new field to creature state, update both `serializeMon()` and `normalizeMonState()`. When adding a new field to global game state, update `serializeGame()` and `restoreGame()`.

## Asset Naming Rules

Creature sprite paths are generated from creature IDs:

```js
SP + mon.id + ".gif"
SPB + mon.id + ".gif"
```

That means this dex entry:

```js
["charizard", "Charizard", "Fire", "Flying", "Rare", 82]
```

expects these files:

```text
assets/sprites/ani/charizard.gif
assets/sprites/ani-back/charizard.gif
```

If a sprite is broken, check the ID spelling in `DEX` against both sprite filenames.

Backgrounds are referenced manually in CSS variables and `TYPE_ARENAS`. If adding a new arena background, add the image to `assets/backgrounds/` and reference it from `TYPE_ARENAS`.

## Common Edit Recipes

Add a question:

1. Find the `QS` array.
2. Add an object with `d`, `cat`, `q`, `a`, `c`, and `e`.
3. Use `d:1` for basic moves, `d:2` for special moves, and `d:3` for ultimate moves.
4. Make sure `c` points to the correct zero-based answer index.

Add a creature:

1. Add matching front and back GIF files under `assets/sprites/ani/` and `assets/sprites/ani-back/`.
2. Add a row to `DEX` using the same ID as the filenames.
3. Confirm the primary type exists in `MOVE_POOLS` and `TYPE_ARENAS`.
4. Add the ID to `STARTER_IDS` only if it should appear on the starter screen.

Change starter choices:

1. Edit `STARTER_IDS`.
2. Keep the list small enough that `buildSelect()` remains usable on mobile.
3. Ensure every ID exists in `DEX`.

Change the campaign:

1. Edit `RUN_PLAN`.
2. Use `kind: "wild"` for catchable encounter generation.
3. Use `kind: "trainer"` or `kind: "boss"` for fixed opponent fights.
4. Set `allowCatch: false` for trainer and boss fights.
5. Set `finalBoss: true` only on the final encounter.

Change combat balance:

1. Edit `RARITY_STATS` for broad creature balance.
2. Edit `MOVE_POOLS` for move power and effects.
3. Edit `calcDamage()` for global damage rules.
4. Edit `calcCatchRate()` for capture difficulty.
5. Edit `levelUpMon()` for growth pacing.

Add an item:

1. Add the item to `ITEMS`.
2. If it uses an existing effect type, the shop and bag should render automatically.
3. If it introduces a new `effect`, add handling in `useItem()`.
4. If it should work differently in battle and shop contexts, inspect `buyItem()` and `showBattleShop()`.

Change screen visuals:

1. Find the relevant screen ID in the HTML markup.
2. Find matching CSS selectors.
3. If content is inserted dynamically, find the render function that writes to that element.
4. Test desktop and mobile widths because many elements use viewport-based sizing.

Debug a broken battle:

1. Check the browser console for JavaScript errors.
2. Check whether `G.locked` is stuck as `true`.
3. Check whether `G.enemy`, `G.team[G.activeIdx]`, and `G.pendingMove` have expected values.
4. Check the latest function in the turn chain: `answer()`, `resolvePendingTurn()`, `runMove()`, `handleDeaths()`, or `runEnemyTurn()`.

## How To Modify The Game

To add a new quiz question, add an object to `QS`:

```js
{d:2, cat:"Category", q:"Question text?", a:["Choice A","Choice B","Choice C","Choice D"], c:0, e:"Explanation."}
```

To add a new creature, add an entry to `DEX` and make sure matching sprite files exist in both sprite folders:

```text
assets/sprites/ani/<id>.gif
assets/sprites/ani-back/<id>.gif
```

To make a creature available as a starter, add its ID to `STARTER_IDS`.

To tune a run, edit `RUN_PLAN`.

To tune item prices or effects, edit `ITEMS`.

To tune combat balance, inspect:

- `RARITY_STATS`
- `calcDamage()`
- `moveRates()`
- `calcCatchRate()`
- `levelUpMon()`
- `scoreEnemyMove()`

## Known Technical Notes

This is a single-file app. That makes it easy to distribute, but it also means the HTML file is large and mixes markup, style, data, and logic.

There is no automated test suite. Manual browser testing is currently the main verification method.

There is no asset manifest. Sprite paths are generated from creature IDs, so missing or mismatched sprite filenames will show broken images.

The code depends on browser APIs such as DOM manipulation and `localStorage`, so it should be tested in an actual browser rather than only by static inspection.

## Suggested Future Improvements

- Split `index.html` into separate `style.css`, `data.js`, and `game.js` files.
- Add a small test harness for pure functions like damage, catch rate, leveling, and encounter generation.
- Add an asset validation script that checks every `DEX` ID has front and back sprites.
- Add a question validation script that checks each question has exactly four answers and a valid correct index.
- Add import/export for saves so progress can move between browsers.
- Replace inline `onclick` handlers with event listeners for easier maintenance.
