      // ========== ERROR BOUNDARY ==========
      // Defensive wrappers around audio, localStorage, and global error handling.
      // showErrorToast lazily creates a toast element on first error.
      // safePlayAudio / safeSetStorage / safeGetStorage / safeRemoveStorage catch
      // exceptions silently so a single bad localStorage write never breaks the game.
      let _errorToastTimer = null;

      function showErrorToast(message) {
        let el = document.getElementById("error-toast");
        if (!el) {
          el = document.createElement("div");
          el.id = "error-toast";
          el.style.cssText =
            "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);" +
            "background:var(--red,#e94560);color:#fff;padding:8px 20px;" +
            "border-radius:6px;font-family:Inter,sans-serif;font-size:13px;" +
            "z-index:99999;opacity:0;transition:opacity .3s;pointer-events:none;";
          document.body.appendChild(el);
        }
        el.textContent = message;
        el.style.opacity = "1";
        clearTimeout(_errorToastTimer);
        _errorToastTimer = setTimeout(() => { el.style.opacity = "0"; }, 4000);
      }

      window.addEventListener("error", (e) => {
        if (e.target && (e.target.tagName === "IMG" || e.target.tagName === "AUDIO")) {
          return;
        }
        showErrorToast("Something went wrong. Try refreshing.");
        console.error("Game error:", e.error || e.message);
      });

      window.addEventListener("unhandledrejection", (e) => {
        showErrorToast("An unexpected error occurred.");
        console.error("Unhandled rejection:", e.reason);
      });

      function safePlayAudio(src, volume) {
        if (!src) return;
        const audio = new Audio(src);
        audio.volume = volume != null ? volume : 0.45;
        const promise = audio.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(() => {});
        }
        return audio;
      }

      function safeSetStorage(key, value) {
        try { localStorage.setItem(key, value); } catch {
          showErrorToast("Save failed — storage may be full.");
        }
      }

      function safeGetStorage(key) {
        try { return localStorage.getItem(key); } catch { return null; }
      }

      function safeRemoveStorage(key) {
        try { localStorage.removeItem(key); } catch (e) { console.warn("Failed to remove storage key:", key, e); }
      }

      // ========== UTILITY ==========
      // wait / shuffle / clamp / finiteNumber — small helpers reused throughout.
      // shuffle uses Fisher-Yates. finiteNumber guards against NaN in saved data.
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      function shuffle(list) {
        const arr = [...list];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      }
      function clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, v));
      }
      function finiteNumber(value, fallback) {
        return Number.isFinite(value) ? value : fallback;
      }

      // UI rendering uses innerHTML with template literals throughout for simplicity.
      // This keeps the game as a self-contained single-bundle SPA without a framework.

      // ========== LEVELING ==========
      // xpForLevel gives a linear XP curve (80 + lvl * 30).
      // levelUpMon awards HP per level, ATK every even level, DEF every third,
      // and unlocks third move at level 3, fourth at level 6 from the base dex.
      function xpForLevel(lvl) {
        return Math.floor(80 + lvl * 30);
      }

      function levelUpMon(mon) {
        const gains = [];
        while (mon.xp >= mon.xpToNext) {
          mon.xp -= mon.xpToNext;
          mon.level++;
          const r = RARITY_STATS[mon.rarity] || RARITY_STATS.Common;
          const hpGain = Math.round(3 + (r.hp[1] - r.hp[0]) * 0.04);
          const atkGain = mon.level % 2 === 0 ? 1 : 0;
          const defGain = mon.level % 3 === 0 ? 1 : 0;
          mon.hp += hpGain;
          mon.curHp += hpGain;
          mon.atk += atkGain;
          mon.def += defGain;
          mon.xpToNext = xpForLevel(mon.level);
          const base = MON_BY_ID[mon.id];
          if (base) {
            if (
              mon.level >= 3 &&
              mon.moves.length < 3 &&
              base.moves.length >= 3
            ) {
              mon.moves.push({ ...base.moves[2] });
              gains.push({
                level: mon.level,
                move: base.moves[2].name,
                stat: `+${hpGain}HP`,
              });
            } else if (
              mon.level >= 6 &&
              mon.moves.length < 4 &&
              base.moves.length >= 4
            ) {
              mon.moves.push({ ...base.moves[3] });
              gains.push({
                level: mon.level,
                move: base.moves[3].name,
                stat: `+${hpGain}HP`,
              });
            } else {
              gains.push({
                level: mon.level,
                stat: `+${hpGain}HP${atkGain ? " +1ATK" : ""}${defGain ? " +1DEF" : ""}`,
              });
            }
          } else {
            gains.push({ level: mon.level, stat: `+${hpGain}HP` });
          }
        }
        return gains;
      }

      // ========== GAME STATE ==========
      // DEFAULT_INV defines every inventory key — items not listed here are zero.
      // createDefaultState returns a fresh G; G holds ALL mutable run state so
      // new games and restores are just replacing G.
      // makeFx returns a fresh status counter object.
      // normalizeMonState merges saved/caught mon data with base dex entries for
      // backward compatibility — old saves without fields like `ability` or `fx`
      // still get sensible defaults.
      // cloneMon is for starter copies (first 2 moves only, full HP).
      // cloneMonFull is for enemies/PC copies (all moves, full HP).
      // createCaughtMon preserves level but resets XP and battle-only effects.
      const DEFAULT_INV = {
        potion: 2,
        superp: 0,
        revive: 0,
        xattack: 0,
        pokeball: 5,
        greatball: 0,
        ultraball: 0,
        leftovers: 0,
        choiceband: 0,
        focussash: 0,
        scopelens: 0,
        typeberry: 0,
        lifeorb: 0,
      };
      function createDefaultState() {
        // G holds all mutable run state. New games and restores both start here.
        return {
          team: [],
          activeIdx: 0,
          money: 200,
          inv: { ...DEFAULT_INV },
          boost: 1,
          enemy: null,
          streak: 0,
          bestStreak: 0,
          asked: 0,
          correct: 0,
          used: new Set(),
          questionStats: {},
          battleQuestionQueues: null,
          currentBattleWrong: new Set(),
          currentQuestionIndex: -1,
          picks: [],
          pendingMove: null,
          pendingAnswerOk: false,
          answerLocked: false,
          mode: "easy",
          locked: false,
          shopContext: "screen",
          lastEnemyMove: null,
          encounterCount: 0,
          defeatedCount: 0,
          pcBox: [],
          caughtIds: new Set(),
          defeatedEnemy: null,
          shopTitle: "Shop",
          shopColor: "var(--green)",
          pcContext: "shop",
          encounterMeta: null,
          pendingVictory: null,
        };
      }
      let G = createDefaultState();
      let curQ = null;
      let battleMsgToken = 0;

      function makeFx() {
        // Status counters tick down as turns resolve.
        return {
          stun: 0,
          stunPending: 0,
          poison: 0,
          guard: 0,
          weaken: 0,
          vulnerable: 0,
        };
      }
      function cleanMove(move) {
        if (!move) return move;
        const copy = { ...move };
        // Cached accuracy/crit rates are recalculated at runtime after loading.
        delete copy._rates;
        return copy;
      }
      function normalizeMonState(mon) {
        if (!mon) return null;
        const base = MON_BY_ID[mon.id] || {};
        const level = mon.level || base.level || 1;
        const hp = Math.max(1, finiteNumber(mon.hp, finiteNumber(base.hp, 1)));
        const atk = Math.max(1, finiteNumber(mon.atk, finiteNumber(base.atk, 1)));
        const def = Math.max(1, finiteNumber(mon.def, finiteNumber(base.def, 1)));
        const fallbackType = mon.type || base.type || "Normal";
        const moves = mon.moves || base.moves || [
          expandMove(MOVE_POOLS.Normal.basic[0], fallbackType, "basic"),
        ];
        // Merge saved/caught Pokemon with base dex data so old saves still get defaults.
        // Filter undefined keys so they don't overwrite base defaults (e.g. rarity).
        const monDefined = Object.fromEntries(
          Object.entries(mon).filter(([, v]) => v !== undefined),
        );
        const normalized = {
          ...base,
          ...monDefined,
          level,
          hp,
          atk,
          def,
          xp: mon.xp || 0,
          xpToNext: mon.xpToNext || xpForLevel(level),
          type: fallbackType,
          tc: TYPE_CLASS[fallbackType] || mon.tc || TYPE_CLASS.Normal,
          tc2:
            mon.type2 || base.type2
              ? TYPE_CLASS[mon.type2 || base.type2] || mon.tc2 || null
              : null,
          fx: { ...makeFx(), ...(mon.fx || {}) },
          moves: moves.map(cleanMove),
          ability: mon.ability || base.ability || null,
          heldItem: mon.heldItem || null,
          sturdyUsed: mon.sturdyUsed || false,
          sashUsed: mon.sashUsed || false,
          berryUsed: mon.berryUsed || false,
        };
        normalized.curHp = clamp(
          typeof normalized.curHp === "number"
            ? normalized.curHp
            : normalized.hp,
          0,
          normalized.hp,
        );
        normalized.fainted = normalized.curHp <= 0;
        return normalized;
      }

      function cloneMon(mon) {
        // Starter copies begin healthy with only the first two moves unlocked.
        return normalizeMonState({
          ...mon,
          curHp: mon.hp,
          fainted: false,
          fx: makeFx(),
          level: mon.level || 1,
          xp: mon.xp || 0,
          xpToNext: mon.xpToNext || xpForLevel(mon.level || 1),
          moves: (mon.moves || []).slice(0, 2).map(cleanMove),
        });
      }

      function cloneMonFull(mon) {
        // Enemy and PC copies keep the full move list available.
        return normalizeMonState({
          ...mon,
          curHp: mon.hp,
          fainted: false,
          fx: makeFx(),
          moves: (mon.moves || []).map(cleanMove),
        });
      }
      function createCaughtMon(mon) {
        // Captured Pokemon keep their current level but reset battle-only effects.
        const caught = normalizeMonState(mon);
        caught.curHp = clamp(caught.curHp || caught.hp, 1, caught.hp);
        caught.fainted = false;
        caught.fx = makeFx();
        caught.xp = 0;
        caught.xpToNext = xpForLevel(caught.level || 1);
        return caught;
      }

      function active() {
        return G.team[G.activeIdx] || null;
      }
      function battler(side) {
        return side === "player" ? active() : G.enemy;
      }
      function otherSide(side) {
        return side === "player" ? "enemy" : "player";
      }

      // ========== SAVE / COLLECTION STORAGE ==========
      // Multiple save slots backed by localStorage. serializeGame/restoreGame use a
      // versioned format with Sets converted to Arrays for JSON compatibility.
      // persistGame auto-archives the current roster to the shared collection.
      // saveCollection deduplicates by species keeping the strongest version.
      // archiveCurrentRoster merges team + PC into the long-term collection store.
      let activeSaveSlot = 1;
      let choosingOverwriteSlot = false;
      function normalizeSaveSlot(slot) {
        return clamp(Number(slot) || 1, 1, SAVE_SLOT_COUNT);
      }
      function saveKeyForSlot(slot) {
        return `${SAVE_KEY}_slot_${normalizeSaveSlot(slot)}`;
      }
      function readSave(slot = activeSaveSlot) {
        try {
          const normalizedSlot = normalizeSaveSlot(slot);
          let raw = localStorage.getItem(saveKeyForSlot(normalizedSlot));
          if (!raw && normalizedSlot === 1) raw = localStorage.getItem(SAVE_KEY);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          parsed.slot = parsed.slot || normalizedSlot;
          return parsed;
        } catch {
          return null;
        }
      }
      function readSaveSlots() {
        return Array.from({ length: SAVE_SLOT_COUNT }, (_, i) => {
          const slot = i + 1;
          return { slot, save: readSave(slot) };
        });
      }
      function firstEmptySaveSlot() {
        const empty = readSaveSlots().find(
          ({ save }) => !(save && save.team && save.team.length),
        );
        return empty ? empty.slot : null;
      }
      function currentScreenId() {
        const current = document.querySelector(".screen.active");
        return current ? current.id : "title-screen";
      }
      function serializeMon(mon) {
        if (!mon) return null;
        return {
          ...mon,
          fx: { ...makeFx(), ...(mon.fx || {}) },
          moves: (mon.moves || []).map(cleanMove),
        };
      }
      function serializeGame() {
        // Convert Sets and nested Pokemon state into JSON-friendly values.
        return {
          version: 5,
          slot: activeSaveSlot,
          savedAt: Date.now(),
          screen: currentScreenId(),
          team: G.team.map(serializeMon),
          activeIdx: G.activeIdx,
          money: G.money,
          inv: { ...DEFAULT_INV, ...(G.inv || {}) },
          boost: G.boost,
          enemy: serializeMon(G.enemy),
          streak: G.streak,
          bestStreak: G.bestStreak,
          asked: G.asked,
          correct: G.correct,
          used: [...G.used],
          questionStats: { ...(G.questionStats || {}) },
          battleQuestionQueues: serializeBattleQuestionQueues(G.battleQuestionQueues),
          currentBattleWrong: [...(G.currentBattleWrong || [])],
          picks: [...G.picks],
          mode: G.mode,
          shopContext: G.shopContext,
          lastEnemyMove: G.lastEnemyMove,
          encounterCount: G.encounterCount,
          defeatedCount: G.defeatedCount,
          pcBox: G.pcBox.map(serializeMon),
          caughtIds: [...G.caughtIds],
          defeatedEnemy: serializeMon(G.defeatedEnemy),
          shopTitle: G.shopTitle,
          shopColor: G.shopColor,
          pcContext: G.pcContext,
          encounterMeta: G.encounterMeta ? { ...G.encounterMeta } : null,
        };
      }
      function readCollection() {
        try {
          const raw = localStorage.getItem(COLLECTION_KEY);
          if (!raw) return [];
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed)
            ? parsed.map(normalizeMonState).filter(Boolean)
            : [];
        } catch {
          return [];
        }
      }
      function compareCollectionMon(a, b) {
        // When duplicate species are archived, keep the strongest version.
        if ((a.level || 1) !== (b.level || 1))
          return (a.level || 1) - (b.level || 1);
        if ((a.moves?.length || 0) !== (b.moves?.length || 0))
          return (a.moves?.length || 0) - (b.moves?.length || 0);
        const aScore = (a.hp || 0) + (a.atk || 0) + (a.def || 0) + (a.xp || 0);
        const bScore = (b.hp || 0) + (b.atk || 0) + (b.def || 0) + (b.xp || 0);
        return aScore - bScore;
      }
      function saveCollection(mons) {
        const merged = new Map();
        mons
          .map(normalizeMonState)
          .filter(Boolean)
          .forEach((mon) => {
            const existing = merged.get(mon.id);
            if (!existing || compareCollectionMon(existing, mon) < 0)
              merged.set(mon.id, normalizeMonState(mon));
          });
        const raw = JSON.stringify([...merged.values()].map(serializeMon));
        try {
          localStorage.setItem(COLLECTION_KEY, raw);
        } catch {
          STORE.setItem(COLLECTION_KEY, raw).catch(() => {});
        }
      }
      function archiveCurrentRoster() {
        const current = [...G.team, ...G.pcBox]
          .map(serializeMon)
          .filter(Boolean);
        if (!current.length) return;
        saveCollection([...readCollection(), ...current]);
      }
      let useStartersOnly = false;
      function getRosterChoices() {
        if (!useStartersOnly) {
          const collection = readCollection();
          if (collection.length >= 3) return collection;
        }
        return STARTER_IDS.map((id) =>
          ALL_MONS.find((m) => m.id === id),
        ).filter(Boolean);
      }
      function createRunMon(mon) {
        const fresh = normalizeMonState(mon);
        fresh.curHp = fresh.hp;
        fresh.fainted = false;
        fresh.fx = makeFx();
        return fresh;
      }
      function saveScreenLabel(save) {
        if (save.screen === "shop-screen") return "Between Battles";
        if (save.screen === "pc-screen") return "PC Box";
        if (save.screen === "result-screen") return "Victory";
        return "In Battle";
      }
      function saveEncounterLabel(save) {
        if (!save) return "";
        return (save.encounterCount || 0) > RUN_LENGTH
          ? `${save.encounterCount} / endless`
          : `${save.encounterCount || 0}/${RUN_LENGTH}`;
      }
      function saveSlotHtml(slot, save) {
        const activeClass = slot === activeSaveSlot ? "active-slot" : "";
        if (choosingOverwriteSlot) {
          const meta = save && save.team && save.team.length
            ? `${save.team.map((m) => m.name).join(", ")}<br>Encounter ${saveEncounterLabel(save)}`
            : "Empty";
          return `<div class="slot-card ${activeClass}">
            <div class="slot-title">Slot ${slot}</div>
            <div class="slot-meta">${meta}</div>
            <button class="btn btn-gold" onclick="startNewGameInSlot(${slot})">Start Here</button>
          </div>`;
        }
        if (!save || !save.team || !save.team.length) {
          return `<div class="slot-card ${activeClass}">
            <div class="slot-title">Slot ${slot}</div>
            <div class="slot-meta">Empty</div>
            <button class="btn" disabled>Load Game</button>
          </div>`;
        }
        const names = save.team.map((m) => m.name).join(", ");
        const savedAt = save.savedAt
          ? new Date(save.savedAt).toLocaleString()
          : "Unknown";
        return `<div class="slot-card ${activeClass}">
          <div class="slot-title">Slot ${slot}</div>
          <div class="slot-meta">${names}<br>${saveScreenLabel(save)} | ${save.mode === "hard" ? "Hard" : "Easy"} | Encounter ${saveEncounterLabel(save)}<br>$${save.money || 0} | Saved: ${savedAt}</div>
          <button class="btn btn-gold" onclick="loadGameFromTitle(${slot})">Load Game</button>
        </div>`;
      }
      function refreshTitleSaveUi() {
        const slotsEl = document.getElementById("save-slots");
        const cancelBtn = document.getElementById("overwrite-cancel");
        if (!slotsEl) return;
        if (cancelBtn) cancelBtn.style.display = choosingOverwriteSlot ? "" : "none";
        const slots = readSaveSlots();
        slotsEl.innerHTML = slots
          .map(({ slot, save: slotSave }) => saveSlotHtml(slot, slotSave))
          .join("");
      }
      function persistGame(screenOverride = "") {
        if (!G.team.length) {
          refreshTitleSaveUi();
          return;
        }
        activeSaveSlot = normalizeSaveSlot(activeSaveSlot);
        const payload = serializeGame();
        if (screenOverride) payload.screen = screenOverride;
        if (payload.screen === "pc-screen")
          payload.screen =
            G.pcContext === "battle" ? "battle-screen" : "shop-screen";
        const key = saveKeyForSlot(activeSaveSlot);
        const raw = JSON.stringify(payload);
        STORE.setItem(key, raw).catch(() => {
          try { localStorage.setItem(key, raw); } catch {
            showErrorToast("Save failed — storage may be full.");
          }
        });
        archiveCurrentRoster();
        refreshTitleSaveUi();
      }
      function clearSave(slot = activeSaveSlot) {
        const normalized = normalizeSaveSlot(slot);
        try {
          localStorage.removeItem(saveKeyForSlot(normalized));
          if (normalized === 1) localStorage.removeItem(SAVE_KEY);
        } catch (e) { console.warn("Failed to clear save slot:", slot, e); }
        STORE.removeItem(saveKeyForSlot(normalized)).catch(() => {});
        refreshTitleSaveUi();
      }
      function restoreGame(save, modeOverride = "") {
        // Build a clean state object instead of mutating the current run in place.
        activeSaveSlot = normalizeSaveSlot(save.slot || activeSaveSlot);
        const next = createDefaultState();
        next.team = (save.team || []).map(normalizeMonState).filter(Boolean);
        next.activeIdx = clamp(
          save.activeIdx ?? 0,
          0,
          Math.max(0, next.team.length - 1),
        );
        next.money = typeof save.money === "number" ? save.money : 200;
        next.inv = { ...DEFAULT_INV, ...(save.inv || {}) };
        next.boost = typeof save.boost === "number" ? save.boost : 1;
        next.enemy = normalizeMonState(save.enemy);
        next.streak = save.streak || 0;
        next.bestStreak = save.bestStreak || 0;
        next.asked = save.asked || 0;
        next.correct = save.correct || 0;
        next.used = new Set(save.used || []);
        next.questionStats = save.questionStats || {};
        next.battleQuestionQueues = restoreBattleQuestionQueues(save.battleQuestionQueues);
        next.currentBattleWrong = new Set(save.currentBattleWrong || []);
        next.currentQuestionIndex = -1;
        next.picks = Array.isArray(save.picks) ? save.picks.slice(0, 3) : [];
        next.mode =
          modeOverride === "hard" || modeOverride === "easy"
            ? modeOverride
            : save.mode === "hard"
              ? "hard"
              : "easy";
        next.locked = false;
        next.shopContext = save.shopContext || "screen";
        next.lastEnemyMove = save.lastEnemyMove || null;
        next.encounterCount = save.encounterCount || 0;
        next.defeatedCount = save.defeatedCount || 0;
        next.pcBox = (save.pcBox || []).map(normalizeMonState).filter(Boolean);
        next.caughtIds = new Set(save.caughtIds || []);
        next.defeatedEnemy = normalizeMonState(save.defeatedEnemy);
        next.shopTitle =
          save.shopTitle ||
          (next.defeatedEnemy
            ? `${next.defeatedEnemy.name} defeated!`
            : "Shop");
        next.shopColor = save.shopColor || "var(--green)";
        next.pcContext = save.pcContext === "battle" ? "battle" : "shop";
        next.encounterMeta = normalizeEncounterMeta(
          save.encounterMeta,
          next.enemy,
          save.encounterCount || 0,
        );
        G = next;
        curQ = null;
        battleMsgToken = 0;
        renderModeUi();
        refreshTitleSaveUi();
      }
      function openNewGame() {
        openFreshRun();
      }
      function openFreshRun() {
        choosingOverwriteSlot = true;
        refreshTitleSaveUi();
      }
      function cancelOverwriteSelect() {
        choosingOverwriteSlot = false;
        refreshTitleSaveUi();
      }
      function startNewGameInSlot(slot) {
        activeSaveSlot = normalizeSaveSlot(slot);
        choosingOverwriteSlot = false;
        useStartersOnly = true;
        clearSave(activeSaveSlot);
        showScreen("select-screen");
        refreshTitleSaveUi();
      }
      function beginNextRun() {
        clearSave();
        openNewGame();
      }
      function loadGameFromTitle(slot = activeSaveSlot) {
        choosingOverwriteSlot = false;
        activeSaveSlot = normalizeSaveSlot(slot);
        const save = readSave(activeSaveSlot);
        if (!save || !save.team || !save.team.length) return;
        const selectedMode = G.mode;
        restoreGame(save, selectedMode);
        persistGame(save.screen || "battle-screen");
        if (save.screen === "shop-screen") {
          goToShop();
          return;
        }
        if (save.screen === "pc-screen") {
          openPCScreen(save.pcContext || "shop");
          return;
        }
        if (!G.enemy) {
          goToShop();
          return;
        }
        showScreen("battle-screen");
        renderBattle();
        showMenu("Game loaded.");
      }

      // ========== ENCOUNTER GENERATION ==========
      // Encounters follow a planned run (RUN_PLAN) for the first N steps, then fall
      // to endless scaling with increasing rarity weights and pressure modifiers.
      // weightedChoice draws from rarity tables instead of fixed %s for easy tuning.
      // createEncounter builds the full enemy + metadata. scaleToLevel starts from
      // a fresh clone so base dex entries are never mutated.
      function averageTeamLevel() {
        return G.team.length
          ? Math.round(G.team.reduce((s, m) => s + m.level, 0) / G.team.length)
          : 1;
      }

      function encounterPalette(kind) {
        if (kind === "boss") return { accent: "#ffd700" };
        if (kind === "trainer") return { accent: "#57d6ff" };
        return { accent: "#78c850" };
      }

      function normalizeEncounterMeta(meta, enemy, encounterCount) {
        // Fill in display text and flags so loaded saves and new encounters match.
        const kind = meta?.kind || "wild";
        const palette = encounterPalette(kind);
        const safeCount = encounterCount || meta?.number || 1;
        return {
          number: meta?.number || safeCount,
          total: safeCount > RUN_LENGTH ? "ENDLESS" : RUN_LENGTH,
          kind,
          kindLabel:
            meta?.kindLabel ||
            (kind === "boss"
              ? "Boss Battle"
              : kind === "trainer"
                ? "Trainer Battle"
                : "Wild Encounter"),
          title:
            meta?.title ||
            (kind === "wild"
              ? meta?.label || "Wild Encounter"
              : [meta?.trainerName, meta?.trainerTitle]
                  .filter(Boolean)
                  .join(" - ") || "Trainer Battle"),
          subtitle:
            meta?.subtitle ||
            (enemy
              ? `${enemy.name} is ready to battle.`
              : "Battle in progress."),
          allowCatch: meta?.allowCatch !== false,
          trainerName: meta?.trainerName || "",
          trainerTitle: meta?.trainerTitle || "",
          trainerSprite: meta?.trainerSprite || "",
          taunt: meta?.taunt || "",
          accent: meta?.accent || palette.accent,
          finalBoss: !!meta?.finalBoss,
        };
      }

      function weightedChoice(weights) {
        // Rarity tables use weights instead of fixed percentages for easy tuning.
        const entries = Object.entries(weights || {}).filter(
          ([, weight]) => weight > 0,
        );
        if (!entries.length) return "Common";
        const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
        let roll = Math.random() * total;
        for (const [label, weight] of entries) {
          roll -= weight;
          if (roll <= 0) return label;
        }
        return entries[entries.length - 1][0];
      }

      function randomFrom(list) {
        return list[Math.floor(Math.random() * list.length)];
      }

      function getEncounterSpec(number) {
        if (number <= RUN_LENGTH) {
          return RUN_PLAN[Math.max(0, number - 1)];
        }
        const loop = number - RUN_LENGTH;
        const rarityWeights =
          loop < 4
            ? { Common: 35, Uncommon: 40, Rare: 22, Legendary: 3 }
            : loop < 10
              ? { Common: 22, Uncommon: 38, Rare: 32, Legendary: 8 }
              : { Common: 12, Uncommon: 30, Rare: 43, Legendary: 15 };
        const pressure = Math.min(0.8, loop * 0.035);
        return {
          kind: "wild",
          label: "Wild Expedition",
          subtitle: "An open-ended field encounter scaled to your team.",
          allowCatch: true,
          rarityWeights,
          levelOffset: Math.floor((loop - 1) / 3),
          hpMult: 1 + pressure,
          atkMult: 1 + pressure * 0.65,
          defMult: 1 + pressure * 0.55,
          rewardMult: 1.2 + Math.min(1.8, loop * 0.08),
          xpMult: 1.15 + Math.min(1.5, loop * 0.06),
          accent: "#78c850",
          endless: true,
        };
      }

      function chooseEncounterBaseMon(spec) {
        // Trainer and boss encounters can force an ace, otherwise roll by rarity.
        if (spec.aceId && MON_BY_ID[spec.aceId]) return MON_BY_ID[spec.aceId];
        const rarity = weightedChoice(spec.rarityWeights);
        let pool = ALL_MONS.filter((m) => m.rarity === rarity);
        if (!pool.length) pool = ALL_MONS;
        return randomFrom(pool);
      }

      function applyEncounterModifiers(mon, spec) {
        // Encounter specs scale stats and rewards without changing the base dex.
        mon.hp = Math.max(1, Math.round(mon.hp * (spec.hpMult || 1)));
        mon.curHp = mon.hp;
        mon.atk = Math.max(1, Math.round(mon.atk * (spec.atkMult || 1)));
        mon.def = Math.max(1, Math.round(mon.def * (spec.defMult || 1)));
        mon.reward = Math.max(
          1,
          Math.round((mon.reward || 30) * (spec.rewardMult || 1)),
        );
        mon.xpYield = Math.max(
          1,
          Math.round((mon.xpYield || 30) * (spec.xpMult || 1)),
        );
      }

      function createEncounter(number) {
        const spec = getEncounterSpec(number);
        const baseMon = chooseEncounterBaseMon(spec);
        // Planned encounters ramp toward bosses; endless wild fights scale from the team average.
        const bonusFromRun = spec.endless ? 0 : Math.floor((number - 1) / 2);
        const level = Math.max(
          1,
          averageTeamLevel() + (spec.levelOffset || 0) + bonusFromRun,
        );
        const enemy = scaleToLevel(baseMon, level);
        applyEncounterModifiers(enemy, spec);
        // Give trainer/boss enemies held items
        if (spec.kind === "boss") {
          const bossItems = ["choiceband","leftovers","focussash","lifeorb"];
          enemy.heldItem = bossItems[Math.floor(Math.random() * bossItems.length)];
        } else if (spec.kind === "trainer" && Math.random() < 0.5) {
          const trainerItems = ["leftovers","scopelens","typeberry"];
          enemy.heldItem = trainerItems[Math.floor(Math.random() * trainerItems.length)];
        }
        const meta = normalizeEncounterMeta(
          {
            number,
            kind: spec.kind,
            kindLabel:
              spec.kind === "boss"
                ? "Boss Battle"
                : spec.kind === "trainer"
                  ? "Trainer Battle"
                  : "Wild Encounter",
            title:
              spec.kind === "wild"
                ? spec.label
                : `${spec.trainerName} - ${spec.trainerTitle}`,
            subtitle:
              spec.kind === "wild"
                ? spec.subtitle
                : `${spec.subtitle} ${spec.trainerName} sends out ${enemy.name}.`,
            allowCatch: spec.allowCatch,
            trainerName: spec.trainerName || "",
            trainerTitle: spec.trainerTitle || "",
            trainerSprite: spec.trainerSprite || "",
            taunt: spec.taunt || "",
            accent: spec.accent || encounterPalette(spec.kind).accent,
            finalBoss: !!spec.finalBoss,
          },
          enemy,
          number,
        );
        return { enemy, meta };
      }

      function scaleToLevel(baseMon, level) {
        // Start from a fresh copy so scaling one encounter never mutates the dex entry.
        const m = cloneMonFull(baseMon);
        m.level = level;
        const extra = Math.max(0, level - 1);
        const r = RARITY_STATS[m.rarity] || RARITY_STATS.Common;
        m.hp += Math.round(extra * (3 + (r.hp[1] - r.hp[0]) * 0.03));
        m.curHp = m.hp;
        m.atk += Math.floor(extra * 0.5);
        m.def += Math.floor(extra * 0.35);
        m.reward = Math.round((m.xpYield || 30) * (1 + level * 0.15));
        return m;
      }

      // ========== CATCHING ==========
      // calcCatchRate factors in remaining HP (squared curve), ball modifier,
      // rarity penalty (Common through Legendary), level penalty, and a status
      // bonus for poison/stun. Returns a 0.3%-96% clamped probability.
      function calcCatchRate(enemy, ballMod) {
        // Low HP and stronger balls help, while rarity and level reduce the odds.
        const base =
          enemy.catchRate || RARITY_STATS[enemy.rarity]?.catchRate || 0.3;
        const hp = Math.max(1, finiteNumber(enemy.hp, 1));
        const curHp = clamp(finiteNumber(enemy.curHp, hp), 0, hp);
        const healthFactor = clamp(1 - curHp / hp, 0, 1);
        const safeBallMod = Math.max(0.1, finiteNumber(ballMod, 1));
        let statusBonus = 1;
        if (enemy.fx) {
          if (enemy.fx.stun > 0 || enemy.fx.poison > 0) statusBonus += 0.2;
          if (enemy.fx.weaken > 0) statusBonus += 0.08;
          if (enemy.fx.vulnerable > 0) statusBonus += 0.08;
        }
        const rarityPenalty =
          { Common: 1, Uncommon: 0.78, Rare: 0.52, Legendary: 0.3 }[
            enemy.rarity
          ] || 1;
        const levelPenalty =
          1 / (1 + Math.max(0, (enemy.level || 1) - 1) * 0.045);
        const difficultyBoost = clamp(
          1 - rarityPenalty + (1 - levelPenalty),
          0,
          1.2,
        );
        const effectiveBallMod = Math.pow(safeBallMod, 1 + difficultyBoost * 0.5);
        return clamp(
          base *
            rarityPenalty *
            levelPenalty *
            effectiveBallMod *
            (0.12 + Math.pow(healthFactor, 2.2) * 1.9) *
            statusBonus,
          0.003,
          0.96,
        );
      }

      // ========== SCREEN MANAGEMENT ==========
      // showScreen toggles the `.active` class with a fade-in animation, then
      // rebuilds dynamic content (select screen) and updates music.
      // applyArenaLayout sets CSS custom properties for sprite positioning in %.
      // Arena themes are driven by the enemy's type (or secondary type for Normal).
      // typeBadges / rarityBadge render small labeled pills for the UI.
      function setMode(mode) {
        G.mode = mode;
        renderModeUi();
        refreshTitleSaveUi();
      }
      function renderModeUi() {
        const easy = document.getElementById("mode-easy");
        const hard = document.getElementById("mode-hard");
        if (easy && hard) {
          easy.classList.toggle("active", G.mode === "easy");
          hard.classList.toggle("active", G.mode === "hard");
          easy.setAttribute("aria-pressed", G.mode === "easy" ? "true" : "false");
          hard.setAttribute("aria-pressed", G.mode === "hard" ? "true" : "false");
        }
        const summary = document.getElementById("mode-summary");
        if (summary)
          summary.textContent = `${MODES[G.mode].name} Mode: ${MODES[G.mode].summary}`;
        const selectSummary = document.getElementById("select-mode-summary");
        if (selectSummary)
          selectSummary.textContent = `Current rules: ${MODES[G.mode].battle}`;
        const battleMode = document.getElementById("mode-b");
        if (battleMode)
          battleMode.textContent = `Mode ${MODES[G.mode].name.toUpperCase()}`;
      }

      function applyArenaLayout(arena, theme, arenaId) {
        const pos = { ...DEFAULT_ARENA_POS, ...(theme.pos || {}) };
        arena.style.background = theme.bg;
        arena.style.setProperty("--cloud-color", theme.cloud);
        arena.style.setProperty("--plat-color", theme.plat);
        arena.style.setProperty("--player-x", `${pos.playerX}%`);
        arena.style.setProperty("--player-y", `${pos.playerY}%`);
        arena.style.setProperty("--enemy-x", `${pos.enemyX}%`);
        arena.style.setProperty("--enemy-y", `${pos.enemyY}%`);
        arena.style.setProperty("--trainer-x", `${pos.trainerX}%`);
        arena.style.setProperty("--trainer-y", `${pos.trainerY}%`);

        arena.style.setProperty("--player-size", pos.playerSize);
        arena.style.setProperty("--enemy-size", pos.enemySize);
        arena.style.setProperty(
          "--trainer-size",
          pos.trainerSize || DEFAULT_ARENA_POS.trainerSize,
        );

        arena.classList.toggle("ice-arena", arenaId === "Ice");
        requestAnimationFrame(positionBattleShadows);
      }

      function applyArenaTheme() {
        const arena = document.getElementById("arena");
        if (!arena || !G.enemy) return;
        const arenaType =
          G.enemy.type === "Normal" && G.enemy.type2 ? G.enemy.type2 : G.enemy.type;
        const theme = TYPE_ARENAS[arenaType] || TYPE_ARENAS.Normal;
        applyArenaLayout(arena, theme, arenaType);
      }

      function positionShadowUnderSprite(spriteId, shadowSelector, scale) {
        const arena = document.getElementById("arena");
        const sprite = document.getElementById(spriteId);
        const shadow = arena && arena.querySelector(shadowSelector);
        if (!arena || !sprite || !shadow) return;

        const arenaBox = arena.getBoundingClientRect();
        const spriteBox = sprite.getBoundingClientRect();
        if (!arenaBox.width || !spriteBox.width || !spriteBox.height) return;

        const width = clamp(spriteBox.width * scale, 84, 260);
        const height = clamp(width * 0.13, 14, 34);
        const centerX = spriteBox.left - arenaBox.left + spriteBox.width / 2;
        const footY = spriteBox.bottom - arenaBox.top - spriteBox.height * 0.08;

        shadow.style.left = `${centerX - width / 2}px`;
        shadow.style.top = `${footY - height / 2}px`;
        shadow.style.right = "auto";
        shadow.style.bottom = "auto";
        shadow.style.width = `${width}px`;
        shadow.style.height = `${height}px`;
      }

      function positionBattleShadows() {
        positionShadowUnderSprite("p-sprite", ".plat-player", 0.9);
        positionShadowUnderSprite("e-sprite", ".plat-enemy", 0.82);
      }

      function spriteArenaPoint(spriteId, xRatio = 0.5, yRatio = 0.5) {
        const arena = document.getElementById("arena");
        const sprite = document.getElementById(spriteId);
        if (!arena || !sprite) return null;

        const arenaBox = arena.getBoundingClientRect();
        const spriteBox = sprite.getBoundingClientRect();
        if (!arenaBox.width || !spriteBox.width || !spriteBox.height) return null;

        return {
          x: spriteBox.left - arenaBox.left + spriteBox.width * xRatio,
          y: spriteBox.top - arenaBox.top + spriteBox.height * yRatio,
        };
      }

      function positionBattleEffect(el, target) {
        const point =
          target === "enemy"
            ? spriteArenaPoint("e-sprite", 0.5, 0.52)
            : spriteArenaPoint("p-sprite", 0.5, 0.58);
        if (!el || !point) return;
        el.style.left = `${point.x}px`;
        el.style.top = `${point.y}px`;
      }

      function setResultBackdrop(won) {
        const screen = document.getElementById("result-screen");
        if (!screen) return;
        screen.style.background = won
          ? "var(--result-win-bg)"
          : "var(--result-lose-bg)";
      }
      function setShopBackdrop() {
        const screen = document.getElementById("shop-screen");
        if (screen) screen.style.background = "var(--shop-bg)";
      }

      function showScreen(id) {
        // Screens are mutually exclusive; dynamic screens rebuild themselves when opened.
        document
          .querySelectorAll(".screen")
          .forEach((s) => s.classList.remove("active", "fade-in"));
        const target = document.getElementById(id);
        target.classList.add("active", "fade-in");
        // Remove fade-in class after animation completes so it can be re-triggered
        setTimeout(() => target.classList.remove("fade-in"), 400);
        if (id === "select-screen") buildSelect();
        updateMusicForScreen();
        renderModeUi();
        refreshTitleSaveUi();
      }

      function typeBadges(mon) {
        let html = `<span class="type-badge ${mon.tc}">${mon.type}</span>`;
        if (mon.type2)
          html += ` <span class="type-badge ${mon.tc2 || TYPE_CLASS[mon.type2]}">${mon.type2}</span>`;
        return html;
      }

      function rarityBadge(rarity) {
        const cls =
          {
            Common: "r-common",
            Uncommon: "r-uncommon",
            Rare: "r-rare",
            Legendary: "r-legendary",
          }[rarity] || "r-common";
        return `<span class="rarity-badge ${cls}">${rarity}</span>`;
      }

      function buildSelect() {
        G.picks = [];
        const grid = document.getElementById("mon-grid");
        grid.innerHTML = "";
        const starters = getRosterChoices();
        // The same selection screen supports fresh starters and carried-over rosters.
        const pickInfo = document.querySelector("#select-screen .pick-info");
        if (pickInfo) {
          const fromCollection =
            !useStartersOnly && readCollection().length >= 3;
          pickInfo.textContent = fromCollection
            ? "Pick 3 Pokemon from your carried-over roster for the next run"
            : "Pick 3 Pokemon to begin your journey";
        }
        starters.forEach((mon) => {
          const d = document.createElement("div");
          d.className = "mon-card";
          d.dataset.id = mon.id;
          d.setAttribute("role", "button");
          d.tabIndex = 0;
          d.setAttribute("aria-pressed", "false");
          d.setAttribute("aria-label", `Choose ${mon.name}`);
          d.innerHTML = `<div class="pick-num"></div>
      <img class="csprite" src="${SP}${mon.id}.gif" alt="${mon.name}" loading="lazy" decoding="async">
      <div class="mname">${mon.name}</div>
      ${typeBadges(mon)} ${rarityBadge(mon.rarity)}
      <div class="mdesc">${mon.desc}</div>
      <div class="mstats"><span>Lv <em>${mon.level || 1}</em></span><span>HP <em>${mon.hp}</em></span><span>ATK <em>${mon.atk}</em></span><span>DEF <em>${mon.def}</em></span></div>
      ${mon.ability ? `<div style="margin-top:6px"><span class="ability-badge" title="${mon.ability.desc}">${mon.ability.name}</span></div>` : ""}`;
          d.onclick = () => togglePick(mon.id);
          grid.appendChild(d);
        });
        document.getElementById("go-btn").style.display = "none";
        renderModeUi();
      }

      function togglePick(id) {
        const idx = G.picks.indexOf(id);
        if (idx >= 0) G.picks.splice(idx, 1);
        else if (G.picks.length < 3) G.picks.push(id);
        document.querySelectorAll(".mon-card").forEach((card) => {
          const pickIndex = G.picks.indexOf(card.dataset.id);
          card.classList.toggle("picked", pickIndex >= 0);
          card.setAttribute("aria-pressed", pickIndex >= 0 ? "true" : "false");
          card.querySelector(".pick-num").textContent =
            pickIndex >= 0 ? pickIndex + 1 : "";
        });
        document.getElementById("go-btn").style.display =
          G.picks.length === 3 ? "" : "none";
      }

      function startGame() {
        const picks = [...G.picks];
        const mode = G.mode;
        const rosterPool = getRosterChoices();
        G = createDefaultState();
        G.mode = mode;
        G.picks = picks;
        G.team = picks.map((id) => {
          const base =
            rosterPool.find((m) => m.id === id) ||
            ALL_MONS.find((m) => m.id === id);
          return createRunMon(base);
        });
        G.activeIdx = 0;
        useStartersOnly = false;
        archiveCurrentRoster();
        startEncounter();
        persistGame("battle-screen");
      }

      async function startEncounter() {
        if (G.team[G.activeIdx]?.fainted) {
          const nextHealthy = G.team.findIndex((m) => !m.fainted);
          if (nextHealthy >= 0) G.activeIdx = nextHealthy;
          else {
            showEnd(false);
            return;
          }
        }
        G.encounterCount++;
        const encounter = createEncounter(G.encounterCount);
        G.enemy = encounter.enemy;
        G.encounterMeta = encounter.meta;
        G.lastEnemyMove = null;
        G.defeatedEnemy = null;
        G.shopTitle = "Shop";
        G.shopColor = "var(--green)";
        resetBattleQuestionBank();
        showScreen("battle-screen");
        renderBattle();
        showEncounterIntroPanel();
        await playTrainerSendOut();
        let extraText = "";
        const p = active();
        if (p.ability && p.ability.trigger === "start") { G.enemy.fx.weaken = Math.max(G.enemy.fx.weaken, 2); extraText += ` ${p.name}'s Intimidate weakened ${G.enemy.name}!`; }
        if (G.enemy.ability && G.enemy.ability.trigger === "start") { p.fx.weaken = Math.max(p.fx.weaken, 2); extraText += ` ${G.enemy.name}'s Intimidate weakened ${p.name}!`; }
        showMenu(openingBattleText() + extraText);
      }

      function renderBattle() {
        const a = active();
        if (!a || !G.enemy) {
          showEnd(false);
          return;
        }
        document.getElementById("p-name").textContent = a.name;
        document.getElementById("p-lvl").textContent = "Lv" + a.level;
        document.getElementById("p-sprite").src = SPB + a.id + ".gif";
        document.getElementById("e-name").textContent = G.enemy.name;
        document.getElementById("e-lvl").textContent = "Lv" + G.enemy.level;
        document.getElementById("e-sprite").src = SP + G.enemy.id + ".gif";
        const trainer = document.getElementById("trainer-sprite");
        const meta = normalizeEncounterMeta(
          G.encounterMeta,
          G.enemy,
          G.encounterCount,
        );
        if (trainer && meta.trainerSprite) {
          trainer.src = TRAINER_PATH + meta.trainerSprite;
          trainer.alt = meta.trainerName || "Trainer";
          trainer.classList.add("visible");
        } else if (trainer) {
          trainer.removeAttribute("src");
          trainer.alt = "";
          trainer.classList.remove("visible");
        }
        applyArenaTheme();
        updateEncounterHud();
        ["p-sprite", "e-sprite"].forEach((id) => {
          const el = document.getElementById(id);
          el.classList.remove("hit", "atk-r", "atk-l", "faint");
          el.style.opacity = 1;
        });
        positionBattleShadows();
        refreshHud();
      }

      function encounterIntroText() {
        const meta = normalizeEncounterMeta(
          G.encounterMeta,
          G.enemy,
          G.encounterCount,
        );
        if (meta.kind === "wild") return `A wild ${G.enemy.name} appeared!`;
        const trainerName = meta.trainerName || "The trainer";
        return `${trainerName} is unleashing ${G.enemy.name}!`;
      }

      function showEncounterIntroPanel() {
        const bpanel = document.getElementById("bpanel");
        if (!bpanel || !G.enemy) return;
        const meta = normalizeEncounterMeta(
          G.encounterMeta,
          G.enemy,
          G.encounterCount,
        );
        bpanel.innerHTML = `<div class="act-panel">
    <div class="act-msg" style="color:${meta.accent || "var(--accent)"}">${encounterIntroText()}</div>
    <div class="exp-box">${meta.subtitle}</div>
  </div>`;
      }

      async function playTrainerSendOut() {
        const meta = normalizeEncounterMeta(
          G.encounterMeta,
          G.enemy,
          G.encounterCount,
        );
        if (!meta.trainerSprite) return;
        const arena = document.getElementById("arena");
        const enemySprite = document.getElementById("e-sprite");
        if (!arena || !enemySprite) return;

        enemySprite.classList.add("sendout-hidden");
        const ball = document.createElement("div");
        ball.className = "sendout-ball";
        arena.appendChild(ball);
        await wait(1080);
        ball.classList.add("open");

        const burst = document.createElement("div");
        burst.className = "sendout-flash";
        arena.appendChild(burst);
        positionBattleEffect(burst, "enemy");
        await wait(150);
        enemySprite.classList.remove("sendout-hidden");
        enemySprite.classList.add("sendout-appear");
        await wait(520);
        enemySprite.classList.remove("sendout-appear");
        ball.remove();
        burst.remove();
      }

      function traitHtml(mon) {
        let html = "";
        if (mon.ability) html += `<span class="ability-badge" title="${mon.ability.desc}">${mon.ability.name}</span> `;
        if (mon.heldItem) {
          const h = HELD_ITEMS.find(x => x.id === mon.heldItem);
          if (h) html += `<span class="held-badge" title="${h.desc}">${h.icon} ${h.name}</span>`;
        }
        return html;
      }

      function refreshHud() {
        if (!G.enemy || !active()) return;
        document.getElementById("round-b").textContent =
          G.encounterCount > RUN_LENGTH
            ? `Encounter ${G.encounterCount} / endless`
            : `Encounter ${G.encounterCount}/${RUN_LENGTH}`;
        document.getElementById("money-b").textContent = "$" + G.money;
        document.getElementById("mode-b").textContent =
          `Mode ${MODES[G.mode].name.toUpperCase()}`;
        document.getElementById("caught-b").textContent =
          `Caught: ${G.caughtIds.size}`;
        document.getElementById("p-traits").innerHTML = traitHtml(active());
        document.getElementById("e-traits").innerHTML = traitHtml(G.enemy);
        updateEncounterHud();
        updateBars();
        updateStreak();
        updateStatuses();
        updateStatusGlows();
      }

      function updateEncounterHud() {
        const meta = normalizeEncounterMeta(
          G.encounterMeta,
          G.enemy,
          G.encounterCount,
        );
        const box = document.getElementById("encounter-callout");
        if (!box) return;
        box.style.setProperty("--enc-accent", meta.accent);
        document.getElementById("encounter-kind").textContent = meta.kindLabel;
        document.getElementById("encounter-title").textContent = meta.title;
        document.getElementById("encounter-sub").textContent = meta.subtitle;
      }

      function openingBattleText() {
        const meta = normalizeEncounterMeta(
          G.encounterMeta,
          G.enemy,
          G.encounterCount,
        );
        if (meta.kind === "wild")
          return `${MODES[G.mode].battle} Catching is enabled in wild encounters.`;
        return `${meta.taunt || meta.subtitle} Catching is disabled in ${meta.kind === "boss" ? "boss" : "trainer"} battles.`;
      }

      function hpColor(pct) {
        return pct > 50 ? "var(--green)" : pct > 25 ? "#ffeb3b" : "var(--red)";
      }
      function updateBars() {
        const a = active();
        const enemy = G.enemy;
        const pp = Math.max(0, (a.curHp / a.hp) * 100);
        const ep = Math.max(0, (enemy.curHp / enemy.hp) * 100);
        document.getElementById("p-hpbar").style.width = pp + "%";
        document.getElementById("e-hpbar").style.width = ep + "%";
        document.getElementById("p-hpbar").style.background = hpColor(pp);
        document.getElementById("e-hpbar").style.background = hpColor(ep);
        document.getElementById("p-hptext").textContent =
          `${Math.max(0, a.curHp)}/${a.hp}`;
        document.getElementById("e-hptext").textContent =
          `${Math.max(0, enemy.curHp)}/${enemy.hp}`;
        const xpPct =
          a.xpToNext > 0 ? Math.min(100, (a.xp / a.xpToNext) * 100) : 0;
        document.getElementById("p-xpbar").style.width = xpPct + "%";
        updateMusicForScreen();
      }

      function updateStreak() {
        document.getElementById("s-num").textContent = G.streak;
        const hud = document.getElementById("streak-hud");
        const fire = document.getElementById("s-fire");
        if (G.streak >= 5) {
          fire.textContent = "+++";
          hud.classList.add("fire");
        } else if (G.streak >= 3) {
          fire.textContent = "++";
          hud.classList.add("fire");
        } else if (G.streak >= 1) {
          fire.textContent = "+";
          hud.classList.remove("fire");
        } else {
          fire.textContent = "";
          hud.classList.remove("fire");
        }
      }

      function statusChip(label, cls) {
        return `<span class="status-chip ${cls}">${label}</span>`;
      }
      function renderStatusChips(mon) {
        const chips = [];
        if (mon.fx.stun > 0) chips.push(statusChip("STUN", "stun"));
        if (mon.fx.guard > 0)
          chips.push(statusChip(`GUARD ${mon.fx.guard}`, "guard"));
        if (mon.fx.weaken > 0)
          chips.push(statusChip(`WEAK ${mon.fx.weaken}`, "weaken"));
        if (mon.fx.vulnerable > 0)
          chips.push(statusChip(`OPEN ${mon.fx.vulnerable}`, "vulnerable"));
        if (mon.fx.poison > 0)
          chips.push(statusChip(`POISON ${mon.fx.poison}`, "poison"));
        return chips.join("") || statusChip("CLEAR", "");
      }
      function updateStatuses() {
        document.getElementById("p-status").innerHTML =
          renderStatusChips(active());
        document.getElementById("e-status").innerHTML = renderStatusChips(
          G.enemy,
        );
      }

      function updateStatusGlows() {
        const a = active();
        const enemy = G.enemy;
        const pBox = document.querySelector(".hpbox.php .hpbox-in");
        const eBox = document.querySelector(".hpbox.ehp .hpbox-in");
        if (!pBox || !eBox) return;
        const statusClasses = ["status-poison", "status-stun", "status-guard", "status-weaken", "status-vulnerable"];
        pBox.classList.remove(...statusClasses);
        eBox.classList.remove(...statusClasses);
        if (a) {
          if (a.fx.poison > 0) pBox.classList.add("status-poison");
          if (a.fx.stun > 0) pBox.classList.add("status-stun");
          if (a.fx.guard > 0) pBox.classList.add("status-guard");
          if (a.fx.weaken > 0) pBox.classList.add("status-weaken");
          if (a.fx.vulnerable > 0) pBox.classList.add("status-vulnerable");
        }
        if (enemy) {
          if (enemy.fx.poison > 0) eBox.classList.add("status-poison");
          if (enemy.fx.stun > 0) eBox.classList.add("status-stun");
          if (enemy.fx.guard > 0) eBox.classList.add("status-guard");
          if (enemy.fx.weaken > 0) eBox.classList.add("status-weaken");
          if (enemy.fx.vulnerable > 0) eBox.classList.add("status-vulnerable");
        }
      }

      // ========== BATTLE MENU ==========
      // renderBattle populates sprites, HUD, and the encounter callout from G.
      // refreshHud / updateBars / updateEncounterHud keep all on-screen numbers
      // and bars in sync with G.
      // showMenu / showMoves / pickMove handle the turn flow: pick a move,
      // check streak requirements, then advance to a question.
      // moveDmgPreview estimates damage (easy mode only) and shows type effectiveness.
      // canUseMove gates medium (streak 2) and hard (streak 3) moves.
      function showMenu(extra = "") {
        document.getElementById("bpanel").innerHTML = `
    <div style="text-align:center;margin-bottom:8px;font-family:'Press Start 2P',monospace;font-size:10px;color:var(--dim)">What will ${active().name} do?</div>
    <div style="text-align:center;margin-bottom:10px;font-size:11px;color:var(--accent)">${extra || openingBattleText()}</div>
    <div class="menu-row">
      <button class="menu-btn fight" onclick="showMoves()">Fight</button>
      <button class="menu-btn pkmn" onclick="showTeam()">Pokemon</button>
      <button class="menu-btn bag" onclick="showBag()">Bag</button>
      <button class="menu-btn shop" onclick="showBattleShop()">Shop</button>
    </div>`;
        persistGame("battle-screen");
      }

      function typeClass(type) {
        return TYPE_CLASS[type] || "t-normal";
      }
      function shownType(move) {
        return move.type === "Adaptive" ? "Adaptive" : move.type;
      }
      function difficultyLabel(diff) {
        return diff === 1 ? "Easy" : diff === 2 ? "Medium" : "Hard";
      }
      function requiredStreak(move) {
        return move.diff === 3 ? 3 : move.diff === 2 ? 2 : 0;
      }
      function canUseMove(move) {
        return G.streak >= requiredStreak(move);
      }
      function consumesStreak(move) {
        return move.diff >= 2;
      }
      function moveClass(move) {
        return move.tier === "ultimate"
          ? "ultimate"
          : move.tier === "special"
            ? "special"
            : "basic";
      }

      function moveDmgPreview(move) {
        if (G.mode !== "easy" || !move.power || !G.enemy) return "";
        const a = active();
        const est = estimateDamage(a, G.enemy, move, true);
        const actualType = resolveMoveType(move, a, G.enemy);
        const mult = getTypeMultiplier(actualType, G.enemy);
        let eff = "";
        if (mult > 1) eff = ` <span class="type-eff-badge super-eff" title="${mult.toFixed(1)}&#xd7; effectiveness">${mult.toFixed(1)}&#xd7; SE</span>`;
        else if (mult < 1 && mult > 0) eff = ` <span class="type-eff-badge nve-eff" title="${mult.toFixed(2)}&#xd7; effectiveness">${mult.toFixed(2)}&#xd7; NVE</span>`;
        else if (mult === 0) eff = " <span class='type-eff-badge imm-eff'>IMMUNE</span>";
        return `<span class="mdmg-preview">~${est} dmg${eff}</span>`;
      }

      function showMoves() {
        const moves = active().moves || [];
        document.getElementById("bpanel").innerHTML = `
    <div style="text-align:center;margin-bottom:6px;font-family:'Press Start 2P',monospace;font-size:9px;color:var(--dim)">Medium moves need a 2 streak. Hard moves need a 3 streak.</div>
    <div class="moves-grid">
      ${moves
        .map(
          (move, i) => `
        <button class="move-btn ${moveClass(move)}" ${canUseMove(move) ? `onclick="pickMove(${i})"` : "disabled"}>
          ${move.name}
          <span class="mtype"><span class="type-badge ${typeClass(shownType(move))}">${shownType(move)}</span></span>
          <span class="mdmg">${move.power ? `${move.power} POW` : "STATUS / HEAL"} ${moveDmgPreview(move)}</span>
          <span class="mcat">${canUseMove(move) ? `${difficultyLabel(move.diff)} Question` : `Need ${requiredStreak(move)} streak`}</span>
          <span class="mdesc">${move.desc}</span>
        </button>`,
        )
        .join("")}
    </div>
    <div style="text-align:center;margin-top:8px"><button class="menu-btn back" onclick="showMenu()">Back</button></div>`;
      }

      function pickMove(idx) {
        if (G.locked) return;
        G.pendingMove = active().moves[idx];
        // Store the move until the question answer determines whether it resolves.
        if (!canUseMove(G.pendingMove)) {
          showMenu(
            `${G.pendingMove.name} needs a streak of ${requiredStreak(G.pendingMove)}.`,
          );
          return;
        }
        if (active().fx.stun > 0) {
          showStunResult();
          return;
        }
        showQuestion(G.pendingMove.diff);
      }

      // ========== QUESTIONS ==========
      // Question banks are shuffled per-difficulty at the start of each encounter.
      // The system uses a Spaced-Repetition-like weighted review: questions with
      // more misses have higher weight vs the fresh deck. Questions are tracked
      // per-battle so wrong answers come up again within the same encounter.
      // buildQuestionRound shuffles answer order while preserving correctness.
      // showQuestion / answer / showAnswerResult / showStunResult handle the full
      // answering lifecycle.
      const QUESTION_DIFFICULTIES = [1, 2, 3];
      const QUESTION_REVIEW_MIN_GAP = 5;
      const QUESTION_REVIEW_MAX_WEIGHT = 7;
      const FRESH_POOL_SIZE = 4;

      function questionIndexesForDifficulty(diff) {
        return QS.map((q, i) => (q.d === diff ? i : -1)).filter((i) => i >= 0);
      }

      function buildBattleQuestionQueues() {
        return QUESTION_DIFFICULTIES.reduce((queues, diff) => {
          queues[diff] = statPrioritizedShuffle(questionIndexesForDifficulty(diff));
          return queues;
        }, {});
      }

      function serializeBattleQuestionQueues(queues) {
        const clean = {};
        QUESTION_DIFFICULTIES.forEach((diff) => {
          clean[diff] = Array.isArray(queues?.[diff])
            ? queues[diff].filter((index) => QS[index]?.d === diff)
            : [];
        });
        return clean;
      }

      function restoreBattleQuestionQueues(queues) {
        const clean = serializeBattleQuestionQueues(queues);
        QUESTION_DIFFICULTIES.forEach((diff) => {
          if (!clean[diff].length) {
            clean[diff] = statPrioritizedShuffle(questionIndexesForDifficulty(diff));
          }
        });
        return clean;
      }

      function ensureBattleQuestionQueues() {
        if (!G.battleQuestionQueues) {
          G.battleQuestionQueues = buildBattleQuestionQueues();
          return;
        }
        QUESTION_DIFFICULTIES.forEach((diff) => {
          if (!Array.isArray(G.battleQuestionQueues[diff])) {
            G.battleQuestionQueues[diff] = statPrioritizedShuffle(questionIndexesForDifficulty(diff));
          }
        });
      }

      function resetBattleQuestionBank() {
        G.battleQuestionQueues = buildBattleQuestionQueues();
        G.currentBattleWrong = new Set();
        G.currentQuestionIndex = -1;
      }

      function ensureCurrentBattleWrongSet() {
        if (!(G.currentBattleWrong instanceof Set)) {
          G.currentBattleWrong = new Set(G.currentBattleWrong || []);
        }
        return G.currentBattleWrong;
      }

      function resetUsedQuestionsForDifficulty(diff) {
        QS.forEach((q, i) => {
          if (q.d === diff) G.used.delete(i);
        });
      }

      function removeFromBattleQuestionQueue(diff, index) {
        ensureBattleQuestionQueues();
        G.battleQuestionQueues[diff] = G.battleQuestionQueues[diff].filter(
          (queuedIndex) => queuedIndex !== index,
        );
      }

      function questionFreshWeight(index) {
        const stats = G.questionStats[index];
        if (!stats || !stats.asked) return 1;
        if (unresolvedQuestionMisses(stats) > 0) return 1.5;
        const correctRate = stats.correct / stats.asked;
        if (correctRate >= 0.8) return 0.2;
        if (correctRate >= 0.5) return 0.4;
        return 0.7;
      }

      function statPrioritizedShuffle(indices) {
        const shuffled = shuffle(indices);
        return shuffled.sort((a, b) => {
          const sa = G.questionStats[a];
          const sb = G.questionStats[b];
          const pa = !sa || !sa.asked ? 0 : unresolvedQuestionMisses(sa) > 0 ? 1 : 2 + (sa.correct || 0);
          const pb = !sb || !sb.asked ? 0 : unresolvedQuestionMisses(sb) > 0 ? 1 : 2 + (sb.correct || 0);
          return pa - pb;
        });
      }

      function collectFreshCandidates(diff, poolByIndex, max) {
        const queue = G.battleQuestionQueues[diff];
        let count = 0;
        for (let qi = 0; qi < queue.length && count < max; qi++) {
          const index = queue[qi];
          if (QS[index]?.d !== diff || G.used.has(index)) continue;
          if (!poolByIndex.has(index)) {
            poolByIndex.set(index, { q: QS[index], i: index, weight: questionFreshWeight(index) });
            count++;
          }
        }
        return count;
      }

      function nextFreshQuestionEntry(diff) {
        ensureBattleQuestionQueues();
        const queue = G.battleQuestionQueues[diff];
        while (queue.length) {
          const index = queue[0];
          if (QS[index]?.d !== diff || G.used.has(index)) {
            queue.shift();
            continue;
          }
          return { q: QS[index], i: index, weight: 1 };
        }

        const matching = questionIndexesForDifficulty(diff);
        if (matching.length && matching.every((index) => G.used.has(index))) {
          resetUsedQuestionsForDifficulty(diff);
        }
        G.battleQuestionQueues[diff] = statPrioritizedShuffle(matching);
        return nextFreshQuestionEntry(diff);
      }

      function unresolvedQuestionMisses(stats) {
        if (!stats || !stats.misses) return 0;
        return stats.misses - Math.floor((stats.correct || 0) * 0.5);
      }

      function questionReviewWeight(index) {
        const stats = G.questionStats[index];
        const unresolvedMisses = unresolvedQuestionMisses(stats);
        if (unresolvedMisses <= 0) return 0;
        const gap = G.asked - (stats.lastAsked || 0);
        if (gap < QUESTION_REVIEW_MIN_GAP) return 0;
        const currentBattleMiss = ensureCurrentBattleWrongSet().has(index) ? 1 : 0;
        const previousBattleMiss =
          stats.lastMissedBattle && stats.lastMissedBattle < G.encounterCount
            ? 0.5
            : 0;
        return Math.min(
          QUESTION_REVIEW_MAX_WEIGHT,
          1 + unresolvedMisses * 2 + Math.min(2, gap / 8) + currentBattleMiss + previousBattleMiss,
        );
      }

      function weightedQuestionPick(pool) {
        const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
        let roll = Math.random() * total;
        for (const entry of pool) {
          roll -= entry.weight;
          if (roll <= 0) return entry;
        }
        return pool[pool.length - 1];
      }

      function getQ(diff) {
        const matching = QS.map((q, i) => ({ q, i })).filter(
          (entry) => entry.q.d === diff,
        );
        if (!matching.length) return null;

        const poolByIndex = new Map();
        ensureBattleQuestionQueues();

        let freshCount = collectFreshCandidates(diff, poolByIndex, FRESH_POOL_SIZE);
        if (freshCount === 0) {
          const allMatching = questionIndexesForDifficulty(diff);
          if (allMatching.length && allMatching.every((idx) => G.used.has(idx))) {
            resetUsedQuestionsForDifficulty(diff);
          }
          G.battleQuestionQueues[diff] = statPrioritizedShuffle(allMatching);
          freshCount = collectFreshCandidates(diff, poolByIndex, FRESH_POOL_SIZE);
        }

        matching.forEach((entry) => {
          const reviewWeight = questionReviewWeight(entry.i);
          if (reviewWeight > 0) poolByIndex.set(entry.i, { ...entry, weight: reviewWeight });
        });

        const pool = shuffle([...poolByIndex.values()]);
        if (!pool.length) return null;
        const pick = weightedQuestionPick(pool);
        removeFromBattleQuestionQueue(diff, pick.i);
        G.used.add(pick.i);
        G.currentQuestionIndex = pick.i;
        return pick.q;
      }

      function recordQuestionResult(ok) {
        const index = G.currentQuestionIndex;
        if (index < 0) return;
        const prev = G.questionStats[index] || {
          asked: 0,
          correct: 0,
          misses: 0,
          lastAsked: 0,
        };
        const next = {
          asked: prev.asked + 1,
          correct: prev.correct + (ok ? 1 : 0),
          misses: prev.misses + (ok ? 0 : 1),
          lastAsked: G.asked,
        };
        if (ok) {
          next.lastCorrectAt = G.asked;
          next.lastMissedBattle = prev.lastMissedBattle || 0;
          next.lastMissedAt = prev.lastMissedAt || 0;
          if (unresolvedQuestionMisses(next) <= 0) {
            ensureCurrentBattleWrongSet().delete(index);
          }
        } else {
          next.lastCorrectAt = prev.lastCorrectAt || 0;
          next.lastMissedBattle = G.encounterCount;
          next.lastMissedAt = G.asked;
          ensureCurrentBattleWrongSet().add(index);
        }
        G.questionStats[index] = next;
      }

      function buildQuestionRound(question) {
        // Shuffle answer order while preserving which option is correct.
        const answers = question.a.map((text, index) => ({
          text,
          correct: index === question.c,
        }));
        const shuffledAnswers = shuffle(answers);
        return {
          ...question,
          options: shuffledAnswers.map((a) => a.text),
          answerIndex: shuffledAnswers.findIndex((a) => a.correct),
        };
      }

      function showQuestion(diff) {
        const picked = getQ(diff);
        if (!picked) {
          showMenu("No questions available for that move yet.");
          return;
        }
        curQ = buildQuestionRound(picked);
        G.answerLocked = false;
        const keys = ["A", "B", "C", "D"];
        document.getElementById("bpanel").innerHTML = `<div class="q-area">
    <div class="q-cat">${curQ.cat} - ${difficultyLabel(diff)}</div>
    <div class="q-text">${curQ.q}</div>
    <div class="a-grid">
      ${curQ.options.map((a, i) => `<button class="a-btn" onclick="answer(${i})"><span class="akey">${keys[i]}</span>${a}</button>`).join("")}
    </div>
  </div>`;
      }

      function answer(idx) {
        if (G.answerLocked || !curQ || G.locked) return;
        const buttons = document.querySelectorAll(".a-btn");
        if (!buttons.length || idx < 0 || idx >= buttons.length) return;
        G.answerLocked = true;
        buttons.forEach((btn) => {
          btn.classList.add("locked");
          btn.disabled = true;
        });
        buttons[curQ.answerIndex].classList.add("correct");
        G.asked++;
        const ok = idx === curQ.answerIndex;
        recordQuestionResult(ok);
        if (ok) {
          // Correct answers build streaks for stronger moves.
          G.correct++;
          G.streak++;
          if (G.streak > G.bestStreak) G.bestStreak = G.streak;
        } else {
          buttons[idx].classList.add("wrong");
          // Basic misses reset streak, while harder moves spend their required streak later.
          if (!consumesStreak(G.pendingMove)) G.streak = 0;
        }
        G.pendingAnswerOk = ok;
        updateStreak();
        setTimeout(() => showAnswerResult(ok), 600);
      }

      function showAnswerResult(ok) {
        const move = G.pendingMove;
        const title = ok
          ? `${active().name} is ready to use ${move.name}.`
          : `${active().name}'s move fails.`;
        const followup = ok
          ? G.mode === "hard"
            ? `${G.enemy.name} still gets a move if it survives.`
            : "In Easy mode the enemy only attacks if your turn fails."
          : `${G.enemy.name} gets the opening.`;
        const color = ok ? "var(--green)" : "var(--red)";
        document.getElementById("bpanel").innerHTML = `<div class="act-panel">
    <div class="act-msg answer-result-msg" style="color:${color}">${title}</div>
    <div class="exp-box">${curQ.e}<br><br>${followup}</div>
    <button class="btn ${ok ? "btn-green" : "btn-red"}" onclick="resolvePendingTurn()">Resolve Turn</button>
  </div>`;
      }

      function showStunResult() {
        document.getElementById("bpanel").innerHTML = `<div class="act-panel">
    <div class="act-msg" style="color:var(--red)">${active().name} is stunned and cannot move.</div>
    <div class="exp-box">A stun makes you lose your action entirely. The enemy gets an opening.</div>
    <button class="btn btn-red" onclick="resolveStunnedTurn()">Continue</button>
  </div>`;
      }

      // ========== BATTLE RESOLUTION ==========
      // resolveStunnedTurn / resolvePendingTurn / runEnemyTurn sequence the turn.
      // Hard mode always lets the enemy act; Easy mode only after a failed turn.
      // chooseEnemyMove scores every available move against the player's threat
      // level and picks among top candidates for slightly unpredictable AI.
      // runMove is the full pipeline: accuracy → immunity → type check → damage
      // (crit, Stab, held items, abilities) → effects → drain → endstep.
      // endStep handles poison tick, Regen, Leftovers, and weaken decay.
      // handleDeaths triggers enemyDead or checkPlayerAlive.
      async function resolveStunnedTurn() {
        if (G.locked) return;
        G.locked = true;
        active().fx.stun--;
        const notes = endStep("player");
        refreshHud();
        await showNotes(notes, "var(--dim)");
        const ended = await handleDeaths();
        if (ended) return;
        if (G.enemy && !G.enemy.fainted) await runEnemyTurn();
        else {
          G.locked = false;
          showMenu();
        }
      }

      async function resolvePendingTurn() {
        if (G.locked) return;
        G.locked = true;
        const ok = G.pendingAnswerOk;
        const spentStreakMove = G.pendingMove;
        let moveWorked = false;
        if (ok) {
          // Correct answer lets the selected move resolve first.
          const result = await runMove("player", G.pendingMove);
          moveWorked = result.success;
          if (spentStreakMove && consumesStreak(spentStreakMove)) {
            G.streak = Math.max(0, G.streak - requiredStreak(spentStreakMove));
            updateStreak();
          }
          if (result.ended) return;
        } else {
          if (spentStreakMove && consumesStreak(spentStreakMove)) {
            G.streak = Math.max(0, G.streak - requiredStreak(spentStreakMove));
            updateStreak();
          }
          const notes = endStep("player");
          refreshHud();
          await showNotes(notes, "var(--red)");
          const ended = await handleDeaths();
          if (ended) return;
        }
        // Hard mode always lets the enemy answer. Easy mode only does so after failure.
        const enemyActs =
          G.enemy &&
          !G.enemy.fainted &&
          (!ok || !moveWorked || G.mode === "hard");
        if (enemyActs) {
          await runEnemyTurn();
          return;
        }
        settlePendingEffects("enemy");
        const enemyTickNotes = endStep("enemy");
        refreshHud();
        if (enemyTickNotes.length) await showNotes(enemyTickNotes, "var(--dim)");
        const endedAfterTick = await handleDeaths();
        if (endedAfterTick) return;
        G.pendingMove = null;
        G.locked = false;
        showMenu();
      }

      async function runEnemyTurn() {
        if (!active()) {
          showEnd(false);
          return;
        }
        if (!G.enemy || G.enemy.fainted) {
          G.locked = false;
          showMenu();
          return;
        }
        if (G.enemy.fx.stun > 0) {
          G.enemy.fx.stun--;
          await flashMsg(
            `${G.enemy.name} is stunned and loses its move.`,
            "var(--gold)",
          );
          await wait(1650);
          const notes = endStep("enemy");
          settlePendingEffects("enemy");
          refreshHud();
          await showNotes(notes, "var(--gold)");
          const ended = await handleDeaths();
          if (ended) return;
          G.pendingMove = null;
          G.locked = false;
          showMenu();
          return;
        }
        const move = chooseEnemyMove();
        G.lastEnemyMove = move.name;
        const result = await runMove("enemy", move);
        if (result.ended) return;
        settlePendingEffects("enemy");
        G.pendingMove = null;
        G.locked = false;
        showMenu();
      }

      function chooseEnemyMove() {
        const enemy = G.enemy;
        const player = active();
        const enemyMoves =
          enemy && enemy.moves && enemy.moves.length
            ? enemy.moves
            : [expandMove(MOVE_POOLS.Normal.basic[0], "Normal", "basic")];
        const playerMoves = player && player.moves ? player.moves : [];
        // Estimate the player's best hit so the enemy can value defense and healing.
        const playerThreat = playerMoves.length
          ? Math.max(
              ...playerMoves.map((m) => estimateDamage(player, enemy, m, true)),
            )
          : 0;
        const scored = enemyMoves
          .map((move) => ({
            move,
            score: scoreEnemyMove(enemy, player, move, playerThreat),
          }))
          .sort((a, b) => b.score - a.score);
        const bestScore = scored[0].score;
        // Pick among near-best moves so enemies feel smart but not completely predictable.
        const candidates = scored.filter((e) => e.score >= bestScore - 6);
        const totalWeight = candidates.reduce(
          (sum, e) => sum + Math.max(1, e.score),
          0,
        );
        let roll = Math.random() * totalWeight;
        for (const entry of candidates) {
          roll -= Math.max(1, entry.score);
          if (roll <= 0) return entry.move;
        }
        return candidates[0].move;
      }

      function scoreEnemyMove(enemy, player, move, playerThreat) {
        let score = 10;
        const rates = moveRates(move);
        const actualType = resolveMoveType(move, enemy, player);
        const typeMult = getTypeMultiplier(actualType, player);
        // Damage, type advantage, lethal pressure, and useful statuses all raise score.
        const estimate = move.power
          ? estimateDamage(enemy, player, move, false)
          : 0;
        const expectedDamage =
          estimate * rates.accuracy * (1 + rates.critChance * 0.6);
        const missingHp = enemy.hp - enemy.curHp;
        const canLethal = expectedDamage >= player.curHp;
        const lowEnemy = enemy.curHp <= enemy.hp * 0.35;
        const midEnemy = enemy.curHp <= enemy.hp * 0.6;
        const playerLow = player.curHp <= player.hp * 0.35;
        const playerHealthy = player.curHp >= player.hp * 0.65;

        if (move.power > 0) {
          if (typeMult === 0) return -100;
          score += expectedDamage;
          score += (typeMult - 1) * 18;
          if (canLethal) score += 55;
          if (playerLow) score += 12;
          if (hasEffect(move, "vulnerable") && player.fx.vulnerable === 0)
            score += 8;
          if (hasEffect(move, "weaken") && player.fx.weaken === 0) score += 8;
          if (
            hasEffect(move, "poison") &&
            player.fx.poison === 0 &&
            playerHealthy
          )
            score += 8;
          if (hasEffect(move, "stun") && player.fx.stun === 0)
            score += 14 * rates.accuracy;
        } else {
          score -= 4;
        }
        score += (rates.accuracy - 0.8) * 20;
        score += rates.critChance * 18;

        if (move.heal) {
          const healValue = Math.min(move.heal, missingHp);
          score += healValue * 1.2;
          if (lowEnemy) score += 28;
          else if (midEnemy) score += 10;
          else score -= 10;
          if (playerThreat >= enemy.curHp && healValue > 0) score += 18;
        }

        if (hasEffect(move, "guard")) {
          if (enemy.fx.guard === 0) score += 12;
          if (playerThreat >= enemy.curHp) score += 18;
          if (lowEnemy) score += 8;
        } else if (enemy.fx.guard > 0 && !move.power) {
          score -= 10;
        }

        if (hasEffect(move, "stun")) {
          if (player.fx.stun === 0) score += 18 * rates.accuracy;
          else score -= 14;
          if (playerThreat >= enemy.curHp) score += 10;
        }
        if (hasEffect(move, "poison")) {
          if (player.fx.poison === 0) score += playerHealthy ? 16 : 6;
          else score -= 14;
        }
        if (hasEffect(move, "weaken")) {
          if (player.fx.weaken === 0) score += playerThreat > estimate ? 14 : 8;
          else score -= 12;
        }
        if (hasEffect(move, "vulnerable")) {
          if (player.fx.vulnerable === 0) score += 10;
          else score -= 10;
        }
        if (move.drain && estimate > 0) {
          score += Math.min(missingHp, Math.round(estimate * move.drain)) * 1.1;
        }
        if (player.fx.stun > 0 && move.power > 0) score += 10;
        if (G.lastEnemyMove === move.name) score -= 12;
        if (enemy.moves.length === 4 && !move.power && playerLow && !move.heal)
          score -= 6;

        return Math.round(score);
      }

      function hasEffect(move, kind) {
        return (move.effects || []).some((e) => e.kind === kind);
      }

      function moveRates(move) {
        if (move._rates) return move._rates;
        // Rates are derived from move properties so the move table can stay compact.
        const isStun = hasEffect(move, "stun");
        const isStatus = move.power <= 0;
        const isUltimate = move.tier === "ultimate" || move.power >= 32;
        const hasDebuff =
          hasEffect(move, "poison") ||
          hasEffect(move, "weaken") ||
          hasEffect(move, "vulnerable");
        let accuracy = 1;
        if (typeof move.acc === "number") accuracy = move.acc;
        else if (move.heal) accuracy = 0.97;
        else if (isStun && isStatus) accuracy = 0.68;
        else if (isStun) accuracy = 0.74;
        else if (isStatus && hasDebuff) accuracy = 0.84;
        else if (isStatus) accuracy = 0.92;
        else if (isUltimate) accuracy = 0.85;
        else if (move.power >= 24) accuracy = 0.89;
        else if (move.power >= 18) accuracy = 0.92;
        else accuracy = 0.95;
        if (hasDebuff && !isStatus) accuracy -= 0.03;

        let critChance = 0;
        if (typeof move.crit === "number") critChance = move.crit;
        else if (move.power > 0) {
          critChance = isUltimate ? 0.16 : move.power >= 24 ? 0.11 : 0.08;
          if (hasDebuff || isStun || move.drain) critChance -= 0.02;
          if (move.type === "Rock") critChance += 0.02;
          if (move.type === "Ghost") critChance += 0.01;
        }

        move._rates = {
          accuracy: clamp(accuracy, 0.6, 0.99),
          critChance: clamp(critChance, 0, 0.35),
        };
        return move._rates;
      }

      function adjustedCrit(mon, baseCrit) {
        let c = baseCrit;
        if (mon.ability && mon.ability.trigger === "crit_boost") c += 0.10;
        if (mon.heldItem === "scopelens") c += 0.12;
        return clamp(c, 0, 0.5);
      }

      function resolveMoveType(move, attacker, defender) {
        if (move.type !== "Adaptive") return move.type;
        // Adaptive moves become whichever attacking type hits this defender best.
        let best = "Normal",
          bestMulti = 0;
        TYPES.forEach((t) => {
          const multi = getTypeMultiplier(t, defender);
          if (multi > bestMulti) {
            bestMulti = multi;
            best = t;
          }
        });
        return best;
      }

      function getTypeMultiplier(attackType, defender) {
        if (typeof defender === "string") {
          return TYPE_CHART[attackType]?.[defender] ?? 1;
        }
        const m1 = TYPE_CHART[attackType]?.[defender.type] ?? 1;
        const m2 = defender.type2
          ? (TYPE_CHART[attackType]?.[defender.type2] ?? 1)
          : 1;
        return m1 * m2;
      }

      function calcDamage(
        attacker,
        defender,
        move,
        actualType,
        isPlayerMove,
        isCrit = false,
      ) {
        // Damage combines base power, stats, type matchup, active statuses, boost, and crit.
        let stab =
          actualType === attacker.type || actualType === attacker.type2
            ? 1.2
            : 1;
        if (stab > 1 && attacker.ability && attacker.ability.trigger === "stab") stab = 1.5;
        const typeMult = getTypeMultiplier(actualType, defender);
        const weaken = attacker.fx.weaken > 0 ? 0.75 : 1;
        const guard = defender.fx.guard > 0 ? 0.65 : 1;
        const vulnerable = defender.fx.vulnerable > 0 ? 1.25 : 1;
        const boost = isPlayerMove ? G.boost : 1;
        const streakBonus = isPlayerMove
          ? 1 + Math.min(0.2, G.streak * 0.04)
          : 1;
        const crit = isCrit ? 1.6 : 1;

        // Ability bonuses
        let abilityMult = 1;
        const ab = attacker.ability;
        if (ab && ab.trigger === "attack" && ab.type === actualType && attacker.curHp <= attacker.hp / 3) abilityMult = 1.3;
        if (ab && ab.trigger === "guts" && attacker.fx.poison > 0) abilityMult = 1.4;

        // Held item offense
        let heldOffense = 1;
        if (attacker.heldItem === "choiceband") heldOffense = 1.35;
        if (attacker.heldItem === "lifeorb") heldOffense = 1.2;

        // Held item / ability defense
        let heldDefense = 1;
        const defAb = defender.ability;
        if (defAb && defAb.trigger === "defend_type" && defAb.types && defAb.types.includes(actualType)) heldDefense = 0.5;
        if (defender.heldItem === "typeberry" && !defender.berryUsed && typeMult > 1) heldDefense = 0.5;

        // DragonScale passive def
        let defBonus = defender.def;
        if (defAb && defAb.trigger === "passive_def") defBonus = Math.round(defBonus * 1.15);

        if (move.power <= 0) {
          return { damage: 0, stab: 1, typeMult: 1, isCrit: false, crit: 1 };
        }
        const raw =
          move.power +
          Math.round(attacker.atk * 0.7) -
          Math.round(defBonus * 0.35);
        const damage =
          typeMult === 0
            ? 0
            : Math.max(
                1,
                Math.round(
                  raw *
                    stab *
                    typeMult *
                    weaken *
                    guard *
                    vulnerable *
                    boost *
                    streakBonus *
                    crit *
                    abilityMult *
                    heldOffense *
                    heldDefense,
                ),
              );
        return { damage, stab, typeMult, isCrit, crit };
      }

      function estimateDamage(attacker, defender, move, isPlayerMove) {
        return calcDamage(
          attacker,
          defender,
          move,
          resolveMoveType(move, attacker, defender),
          isPlayerMove,
        ).damage;
      }

      function consumeHit(defender) {
        if (defender.fx.guard > 0) defender.fx.guard--;
        if (defender.fx.vulnerable > 0) defender.fx.vulnerable--;
      }

      function healTarget(target, amount) {
        if (amount <= 0 || !Number.isFinite(amount)) return 0;
        const before = target.curHp;
        target.curHp = Math.min(target.hp, target.curHp + amount);
        return target.curHp - before;
      }

      function applyMoveEffects(
        move,
        attacker,
        defender,
        side,
        deferEnemyStun,
        secondaryChance = 1,
      ) {
        const notes = [];
        (move.effects || []).forEach((ef) => {
          const chance = ef.target === "self" ? 1 : secondaryChance;
          if (Math.random() > chance) return;
          const target = ef.target === "self" ? attacker : defender;
          const amount = ef.amount || 1;
          if (ef.kind === "guard") {
            target.fx.guard = Math.max(target.fx.guard, amount);
            notes.push(`${target.name} is guarding.`);
          } else if (ef.kind === "weaken") {
            target.fx.weaken = Math.max(target.fx.weaken, amount);
            notes.push(`${target.name}'s attacks are weakened.`);
          } else if (ef.kind === "vulnerable") {
            target.fx.vulnerable = Math.max(target.fx.vulnerable, amount);
            notes.push(`${target.name} is exposed.`);
          } else if (ef.kind === "poison") {
            target.fx.poison = Math.max(target.fx.poison, amount);
            notes.push(`${target.name} was poisoned.`);
          } else if (ef.kind === "stun") {
            if (side === "player" && ef.target === "foe" && deferEnemyStun) {
              // In hard mode, enemy stun waits until after its immediate counterattack.
              target.fx.stunPending = Math.max(target.fx.stunPending, amount);
              notes.push(`${target.name} will be stunned next turn.`);
            } else {
              target.fx.stun = Math.max(target.fx.stun, amount);
              notes.push(`${target.name} is stunned.`);
            }
          }
        });
        return notes;
      }

      function animateAttack(side) {
        const el = document.getElementById(
          side === "player" ? "p-sprite" : "e-sprite",
        );
        el.classList.add(side === "player" ? "atk-r" : "atk-l");
        setTimeout(
          () => el.classList.remove(side === "player" ? "atk-r" : "atk-l"),
          430,
        );
      }
      function animateImpact(side) {
        const el = document.getElementById(
          side === "player" ? "p-sprite" : "e-sprite",
        );
        el.classList.add("hit");
        setTimeout(() => el.classList.remove("hit"), 500);
      }

      async function playEvolutionAnimation(result, side = "player") {
        const el = document.getElementById(
          side === "player" ? "p-sprite" : "e-sprite",
        );
        if (!result || !el) {
          await wait(900);
          return;
        }
        const spritePath = side === "player" ? SPB : SP;
        el.classList.remove("evo-transform-out", "evo-transform-in");
        el.src = `${spritePath}${result.fromId}.gif`;
        void el.offsetWidth;
        el.classList.add("evo-transform-out");
        await wait(520);
        el.src = `${spritePath}${result.toId}.gif`;
        el.classList.remove("evo-transform-out");
        void el.offsetWidth;
        el.classList.add("evo-transform-in");
        spawnFloatText(side, "Evolved!", "buff");
        await wait(720);
        el.classList.remove("evo-transform-in");
      }

      function shakeArena(hard = false) {
        const arena = document.getElementById("arena");
        if (!arena) return;
        arena.classList.add(hard ? "shake-hard" : "shake");
        setTimeout(() => arena.classList.remove("shake", "shake-hard"), hard ? 600 : 500);
      }

      function flashSprite(side, type = "heal") {
        const el = document.getElementById(side === "player" ? "p-sprite" : "e-sprite");
        if (!el) return;
        el.classList.add(type === "revive" ? "revive-flash" : "heal-flash");
        setTimeout(() => el.classList.remove("heal-flash", "revive-flash"), 800);
      }

      function spawnFloatText(side, text, type = "neutral") {
        const arena = document.getElementById("arena");
        if (!arena) return;
        const el = document.createElement("div");
        el.className = `float-text ${type}`;
        el.textContent = text;
        const rect = arena.getBoundingClientRect();
        const isPlayer = side === "player";
        // Position above the target sprite area
        const left = isPlayer ? 28 : 72; // % from left
        const top = isPlayer ? 68 : 38;  // % from top
        el.style.left = `${left}%`;
        el.style.top = `${top}%`;
        el.style.transform = "translate(-50%, -100%)";
        arena.appendChild(el);
        setTimeout(() => el.remove(), 1500);
      }

      async function runMove(side, move) {
        const attacker = battler(side);
        const defender = battler(otherSide(side));
        const actualType = resolveMoveType(move, attacker, defender);
        const rates = moveRates(move);
        const panelColor = side === "player" ? "var(--green)" : "var(--red)";
        await flashMsg(`${attacker.name} used ${move.name}!`, panelColor);
        await wait(320);
        playMoveSfx(move);
        playMoveAnimation(side, move, actualType);
        animateAttack(side);
        await wait(380);
        if (side === "player" && G.boost !== 1) G.boost = 1;
        const landed = Math.random() <= rates.accuracy;
        if (!landed) {
          const notes = [`${move.name} failed.`];
          refreshHud();
          await showNotes(notes, panelColor);
          const endNotes = endStep(side);
          refreshHud();
          await showNotes(endNotes, "var(--dim)");
          return { ended: await handleDeaths(), success: false };
        }

        // Levitate immunity
        if (move.power > 0 && defender.ability && defender.ability.trigger === "immunity" && defender.ability.type === actualType) {
          const notes = [`${defender.name}'s ${defender.ability.name} makes it immune!`];
          spawnFloatText(otherSide(side), "Immune!", "immune");
          if (move.heal) { const healed = healTarget(attacker, move.heal); if (healed > 0) notes.push(`${attacker.name} restored ${healed} HP.`); }
          refreshHud();
          await showNotes(notes, panelColor);
          const endNotes = endStep(side);
          refreshHud();
          await showNotes(endNotes, "var(--dim)");
          return { ended: await handleDeaths(), success: false };
        }

        const typeMult =
          move.power > 0 ? getTypeMultiplier(actualType, defender) : 1;
        if (typeMult === 0) {
          const notes = [`It doesn't affect ${defender.name}...`];
          spawnFloatText(otherSide(side), "No Effect", "immune");
          if (move.heal) {
            const healed = healTarget(attacker, move.heal);
            if (healed > 0)
              notes.push(`${attacker.name} restored ${healed} HP.`);
          }
          refreshHud();
          await showNotes(notes, panelColor);
          const endNotes = endStep(side);
          refreshHud();
          await showNotes(endNotes, "var(--dim)");
          return { ended: await handleDeaths(), success: false };
        }
        const aCrit = adjustedCrit(attacker, rates.critChance);
        const isCrit = move.power > 0 && Math.random() <= aCrit;
        let damageInfo = null,
          totalDamage = 0;
        if (move.power > 0) {
          damageInfo = calcDamage(
            attacker,
            defender,
            move,
            actualType,
            side === "player",
            isCrit,
          );
          totalDamage = damageInfo.damage;

          // Resist Berry consumption
          if (defender.heldItem === "typeberry" && !defender.berryUsed && damageInfo.typeMult > 1) {
            defender.berryUsed = true;
          }

          defender.curHp = Math.max(0, defender.curHp - totalDamage);

          // Sturdy ability
          if (defender.curHp <= 0 && defender.ability && defender.ability.trigger === "endure" && !defender.sturdyUsed) {
            defender.curHp = 1;
            defender.sturdyUsed = true;
          }
          // Focus Sash
          if (defender.curHp <= 0 && defender.heldItem === "focussash" && !defender.sashUsed) {
            defender.curHp = 1;
            defender.sashUsed = true;
          }
        }
        animateImpact(otherSide(side));
        if (totalDamage > 0) {
          spawnDmg(otherSide(side), totalDamage, damageInfo.isCrit);
          if (damageInfo.typeMult > 1) {
            flash("#00e5ff");
            shakeArena(damageInfo.isCrit);
            spawnFloatText(otherSide(side), "Super Effective!", "super");
          }
          if (damageInfo.typeMult < 1 && damageInfo.typeMult > 0) {
            flash("#888");
            spawnFloatText(otherSide(side), "Not Very Effective...", "resist");
          }
          if (damageInfo.isCrit) {
            flash("#ffd700");
            shakeArena(true);
            spawnFloatText(otherSide(side), "Critical Hit!", "crit");
          }
          if (damageInfo.typeMult === 1 && !damageInfo.isCrit) {
            shakeArena(false);
          }
          consumeHit(defender);
        }
        const notes = [];
        if (damageInfo) {
          if (damageInfo.isCrit) notes.push("Critical hit!");
          if (damageInfo.stab > 1) notes.push("Same-type bonus!");
          if (damageInfo.typeMult > 1) notes.push("It was super effective!");
          if (damageInfo.typeMult < 1 && damageInfo.typeMult > 0)
            notes.push("It's not very effective...");
          if (move.type === "Adaptive")
            notes.push(`Adaptive shifted to ${actualType}.`);
          if (defender.sturdyUsed && defender.curHp === 1 && defender.ability && defender.ability.trigger === "endure")
            notes.push(`${defender.name}'s Sturdy held on!`);
          if (defender.sashUsed && defender.curHp === 1 && defender.heldItem === "focussash")
            notes.push(`${defender.name}'s Focus Sash saved it!`);
        }
        if (move.heal) {
          const healed = healTarget(attacker, move.heal);
          if (healed > 0) {
            notes.push(`${attacker.name} restored ${healed} HP.`);
            spawnFloatText(side, `+${healed} HP`, "heal");
            flashSprite(side, "heal");
          }
        }
        if (move.drain && totalDamage > 0 && !attacker.fainted) {
          const healed = healTarget(
            attacker,
            Math.max(1, Math.round(totalDamage * move.drain)),
          );
          if (healed > 0) {
            notes.push(`${attacker.name} drained ${healed} HP.`);
            spawnFloatText(side, `+${healed} HP`, "heal");
            flashSprite(side, "heal");
          }
        }
        const enemyWillActRightAfter =
          side === "player" &&
          G.mode === "hard" &&
          G.enemy &&
          !G.enemy.fainted &&
          defender.curHp > 0;
        notes.push(
          ...applyMoveEffects(
            move,
            attacker,
            defender,
            side,
            enemyWillActRightAfter,
            move.power > 0 ? 0.3 : 1,
          ),
        );

        // Life Orb recoil
        if (attacker.heldItem === "lifeorb" && totalDamage > 0 && !attacker.fainted) {
          const recoil = Math.max(1, Math.round(attacker.hp * 0.08));
          attacker.curHp = Math.max(1, attacker.curHp - recoil);
          notes.push(`${attacker.name} lost ${recoil} HP to Life Orb.`);
        }

        // Static / Poison Point defense ability
        if (totalDamage > 0 && defender.ability && !attacker.fainted) {
          if (defender.ability.trigger === "defend" && attacker.fx.stun === 0 && Math.random() < 0.30) {
            attacker.fx.stun = 1;
            notes.push(`${defender.name}'s Static stunned ${attacker.name}!`);
          }
          if (defender.ability.trigger === "defend_poison" && attacker.fx.poison === 0 && Math.random() < 0.30) {
            attacker.fx.poison = 2;
            notes.push(`${defender.name}'s Poison Point poisoned ${attacker.name}!`);
          }
        }

        refreshHud();
        await showNotes(notes, panelColor);
        const endNotes = endStep(side);
        refreshHud();
        await showNotes(endNotes, "var(--dim)");
        return { ended: await handleDeaths(), success: true };
      }

      function endStep(side) {
        const mon = battler(side);
        if (!mon || mon.fainted) return [];
        const notes = [];
        // End-of-turn effects tick after that battler finishes its action.
        if (mon.fx.weaken > 0) mon.fx.weaken--;
        if (mon.fx.poison > 0) {
          const poisonDmg = Math.max(4, Math.round(mon.hp * 0.08));
          mon.curHp = Math.max(0, mon.curHp - poisonDmg);
          mon.fx.poison--;
          spawnDmg(side, poisonDmg, false);
          flash("#a040a0");
          notes.push(`${mon.name} took ${poisonDmg} poison damage.`);
        }
        // Regenerator ability
        if (mon.ability && mon.ability.trigger === "endturn" && mon.curHp < mon.hp && mon.curHp > 0) {
          const regen = Math.max(1, Math.round(mon.hp * 0.10));
          const healed = healTarget(mon, regen);
          if (healed > 0) notes.push(`${mon.name}'s Regenerator restored ${healed} HP.`);
        }
        // Leftovers
        if (mon.heldItem === "leftovers" && mon.curHp < mon.hp && mon.curHp > 0) {
          const lheal = Math.max(1, Math.round(mon.hp * 0.08));
          const healed = healTarget(mon, lheal);
          if (healed > 0) notes.push(`${mon.name}'s Leftovers restored ${healed} HP.`);
        }
        return notes;
      }

      function settlePendingEffects(side) {
        const mon = battler(side);
        if (!mon) return;
        if (mon.fx.stunPending > 0) {
          // Deferred stun becomes active once the enemy's current response is over.
          mon.fx.stun = Math.max(mon.fx.stun, mon.fx.stunPending);
          mon.fx.stunPending = 0;
        }
        refreshHud();
      }

      async function handleDeaths() {
        // Fainting can end the encounter or force the player to switch.
        const player = active();
        const enemyFaintedNow = G.enemy && G.enemy.curHp <= 0 && !G.enemy.fainted;
        const playerFaintedNow = player && player.curHp <= 0 && !player.fainted;

        if (!G.enemy && !player) {
          showEnd(false);
          return true;
        }
        if (!player) {
          showEnd(false);
          return true;
        }
        if (enemyFaintedNow) {
          G.enemy.fainted = true;
          document.getElementById("e-sprite").classList.add("faint");
        }
        if (playerFaintedNow) {
          player.fainted = true;
          document.getElementById("p-sprite").classList.add("faint");
        }
        if (enemyFaintedNow || playerFaintedNow) {
          await wait(700);
        }
        if (enemyFaintedNow) {
          enemyDead();
          return true;
        }
        if (playerFaintedNow) {
          checkPlayerAlive();
          return true;
        }
        return false;
      }

      function enemyDead() {
        const defeated = G.enemy;
        const meta = normalizeEncounterMeta(
          G.encounterMeta,
          defeated,
          G.encounterCount,
        );
        const reward = defeated.reward || 100;
        G.money += reward;
        G.defeatedCount++;
        G.defeatedEnemy = defeated;

        const a = active();
        const baseXp = defeated.xpYield
          ? Math.round(defeated.xpYield * (1 + defeated.level * 0.22))
          : 40;
        const xpGain = a && !a.fainted ? baseXp : 0;
        const gains = [];
        if (a && !a.fainted) {
          a.xp += xpGain;
          gains.push(...levelUpMon(a));
        }
        const benchXp = Math.round(baseXp * 0.35);
        G.team.forEach((m, i) => {
          if (i !== G.activeIdx && !m.fainted && benchXp > 0) {
            m.xp += benchXp;
            gains.push(...levelUpMon(m));
          }
        });

        G.locked = false;
        refreshHud();
        G.shopTitle =
          meta.kind === "wild"
            ? `${defeated.name} defeated!`
            : `${meta.trainerName} defeated!`;
        G.shopColor = meta.kind === "boss" ? "var(--gold)" : "var(--green)";
        if (meta.finalBoss) {
          showEnd(true, true);
          persistGame("shop-screen");
          return;
        }
        showVictoryScreen(defeated, reward, xpGain, gains, meta);
      }

      function checkPlayerAlive() {
        const alive = G.team.filter((m) => !m.fainted);
        if (!alive.length) {
          showEnd(false);
          return;
        }
        G.locked = false;
        forceSwitch();
      }

      // ========== ENCOUNTER RESULTS / CATCHING ==========
      // enemyDead awards money and XP, calls levelUpMon, and shows the victory
      // screen with evolution prompts. checkPlayerAlive forces a switch if any
      // team member remains.
      // tryBattleCatch spends the ball immediately, gives the enemy a free turn
      // on failure, and either adds to team (up to 3) or sends to PC Box.
      function showVictoryScreen(
        defeated,
        reward,
        xpGain,
        levelGains,
        meta = null,
      ) {
        // Victory is kept in state so evolution choices can re-render the panel.
        G.pendingVictory = {
          defeated,
          reward,
          xpGain,
          levelGains,
          meta,
          evoResult: null,
          evoDeclined: false,
          evoAnimating: false,
        };
        updateMusicForScreen();
        renderVictoryPanel();
      }

      function renderVictoryPanel() {
        const ctx = G.pendingVictory;
        if (!ctx) return;
        const {
          defeated,
          reward,
          xpGain,
          levelGains,
          meta,
          evoResult,
          evoDeclined,
          evoAnimating,
        } = ctx;

        let lvlHtml = "";
        if (levelGains && levelGains.length) {
          lvlHtml = `<div class="lvlup-box"><h4>LEVEL UP!</h4><div class="lvlup-stats">${levelGains
            .map(
              (g) =>
                `Lv${g.level}: ${g.stat}${g.move ? ` — Learned ${g.move}!` : ""}`,
            )
            .join("<br>")}</div></div>`;
        }

        let evoHtml = "";
        const a = active();
        if (evoResult) {
          // After confirming evolution, show the before/after summary.
          const moveLine = evoResult.learnedMove
            ? `<div><span class="move">Learned ${evoResult.learnedMove}!${evoResult.replacedMove ? ` Replaced ${evoResult.replacedMove}.` : ""}</span></div>`
            : "";
          evoHtml = `<div class="evo-panel${evoAnimating ? " evo-animating" : ""}">
      <h4>${evoAnimating ? "EVOLVING..." : "EVOLVED!"}</h4>
      <div class="evo-arrow">
        <img class="evo-before" src="${SP}${evoResult.fromId}.gif" alt="${evoResult.fromName}">
        <span class="ar">→</span>
        <img class="evo-after evo-flash" src="${SP}${evoResult.toId}.gif" alt="${evoResult.toName}">
      </div>
      <div class="evo-name">${evoResult.fromName} evolved into <em>${evoResult.toName}</em>!</div>
      <div class="evo-deltas">
        <span class="gain">+${evoResult.hpDelta} HP</span> &nbsp;
        <span class="gain">+${evoResult.atkDelta} ATK</span> &nbsp;
        <span class="gain">+${evoResult.defDelta} DEF</span>
        ${moveLine}
      </div>
    </div>`;
        } else if (a && canEvolve(a) && !evoDeclined) {
          const preview = previewEvolution(a);
          const target = preview ? MON_BY_ID[preview.toId] : null;
          if (!preview || !target) {
            evoHtml = "";
          } else {
            // Preview stat gains before the player commits to evolving.
            evoHtml = `<div class="evo-panel">
      <h4>${a.name.toUpperCase()} CAN EVOLVE!</h4>
      <div class="evo-arrow">
        <img src="${SP}${a.id}.gif" alt="${a.name}">
        <span class="ar">→</span>
        <img class="evo-preview-target" src="${SP}${target.id}.gif" alt="${target.name}">
      </div>
      <div class="evo-name">Evolve into <em>${target.name}</em>?</div>
      <div class="evo-deltas">
        <span class="gain">+${preview.hpDelta} HP</span> &nbsp;
        <span class="gain">+${preview.atkDelta} ATK</span> &nbsp;
        <span class="gain">+${preview.defDelta} DEF</span>
        ${preview.learnedMove ? `<div>Can learn <span class="move">${preview.learnedMove}</span>.</div>` : `<div>No new move available.</div>`}
      </div>
      <div class="evo-row">
        <button class="btn btn-gold" onclick="confirmEvolution()">Evolve!</button>
        <button class="btn" onclick="declineEvolution()">Not Now</button>
      </div>
    </div>`;
          }
        }

        const heading =
          meta && meta.kind !== "wild"
            ? `${meta.trainerName}'s ${defeated.name} defeated!`
            : `${defeated.name} defeated!`;
        const continueHtml =
          !evoAnimating && (evoResult || evoDeclined || !canEvolve(a))
            ? `<div class="catch-row"><button class="btn btn-gold" onclick="finishVictory()">Continue to Shop</button></div>`
            : "";

        document.getElementById("bpanel").innerHTML = `<div class="catch-panel">
    <h3>${heading} +$${reward} | +${xpGain} XP</h3>
    <img class="catch-sprite" src="${SP}${defeated.id}.gif" alt="${defeated.name}">
    <div class="catch-info">${typeBadges(defeated)} ${rarityBadge(defeated.rarity)} Lv${defeated.level}</div>
    ${lvlHtml}
    ${evoHtml}
    ${continueHtml}
  </div>`;
        persistGame("shop-screen");
      }

      async function confirmEvolution() {
        const ctx = G.pendingVictory;
        if (!ctx || ctx.evoAnimating) return;
        const a = active();
        if (!a || !canEvolve(a)) return;
        const result = evolveMon(a);
        if (!result) return;
        ctx.evoResult = result;
        ctx.evoAnimating = true;
        renderVictoryPanel();
        await playEvolutionAnimation(result, "player");
        ctx.evoAnimating = false;
        refreshHud();
        renderVictoryPanel();
      }

      function declineEvolution() {
        const ctx = G.pendingVictory;
        if (!ctx || ctx.evoAnimating) return;
        ctx.evoDeclined = true;
        renderVictoryPanel();
      }

      function finishVictory() {
        G.pendingVictory = null;
        goToShop();
      }

      async function tryBattleCatch(ballId) {
        if (G.locked || !G.enemy || G.enemy.fainted) return;
        if (G.encounterMeta && !G.encounterMeta.allowCatch) {
          await flashMsg(
            "Trainer-owned Pokemon cannot be caught.",
            "var(--red)",
          );
          await wait(1450);
          showBag();
          return;
        }
        const ball = ITEMS.find((i) => i.id === ballId);
        if (!ball || (G.inv[ballId] || 0) <= 0) return;
        G.inv[ballId]--;
        G.locked = true;
        const target = G.enemy;
        const rate = calcCatchRate(target, ball.catchMod);
        // Catching spends the ball immediately; a failed catch gives the enemy a turn.
        const caught = Math.random() < rate;

        const bpanel = document.getElementById("bpanel");
        bpanel.innerHTML = `<div class="act-panel">
    <div class="pokeball-throw" aria-hidden="true">
      <div class="pokeball-shadow"></div>
      <div class="pokeball"></div>
    </div>
    <div class="act-msg" style="color:var(--gold)">Throwing ${ball.name}...</div>
  </div>`;
        refreshHud();

        await wait(1200);

        if (caught) {
          G.caughtIds.add(target.id);
          const caughtMon = createCaughtMon(target);

          const catchReward = Math.round((target.reward || 80) * 0.5);
          G.money += catchReward;
          const a = active();
          const catchXp = a && !a.fainted
            ? Math.round((target.xpYield || 30) * (1 + target.level * 0.22) * 0.5)
            : 0;
          if (a && !a.fainted) a.xp += catchXp;
          const catchGains = a && !a.fainted ? levelUpMon(a) : [];

          const addToTeam =
            G.team.length < 3 && !G.team.some((m) => m.id === target.id);
          const rewardLine = `+$${catchReward}${catchXp ? ` +${catchXp} XP` : ""}${catchGains.length ? ` — Level up!` : ""}`;
          if (addToTeam) {
            G.team.push(caughtMon);
            bpanel.innerHTML = `<div class="act-panel">
        <div class="act-msg" style="color:var(--gold)">Gotcha! ${target.name} was caught and added to your team!</div>
        <div class="exp-box">${rewardLine}</div>
        <button class="btn btn-gold" onclick="goToShop()">Continue</button>
      </div>`;
          } else {
            G.pcBox.push(caughtMon);
            bpanel.innerHTML = `<div class="act-panel">
        <div class="act-msg" style="color:var(--gold)">Gotcha! ${target.name} was caught and sent to your PC Box!</div>
        <div class="exp-box">${rewardLine}</div>
        <button class="btn btn-gold" onclick="goToShop()">Continue</button>
      </div>`;
          }
          G.defeatedEnemy = createCaughtMon(target);
          G.shopTitle = `${target.name} caught!`;
          G.shopColor = "var(--gold)";
          G.pendingMove = null;
          G.pendingAnswerOk = false;
          G.locked = false;
          refreshHud();
          persistGame("shop-screen");
          return;
        }

        await flashMsg(`Oh no! ${target.name} broke free!`, "var(--red)");
        await wait(1450);
        refreshHud();
        if (G.enemy && !G.enemy.fainted) {
          await runEnemyTurn();
          return;
        }
        G.pendingMove = null;
        G.locked = false;
        showMenu();
      }

      // ========== PC BOX / TEAM SWAP ==========
      // Swaps are direct object exchanges so HP, XP, held items, and effects
      // survive. The PC can be opened from both shop and battle contexts.
      // Active index is automatically corrected if the active mon is swapped out.
      function openPCScreen(context = "shop") {
        // Remember where the PC was opened so Back returns to battle or shop correctly.
        G.pcContext = context === "battle" ? "battle" : "shop";
        swapTeamIdx = -1;
        showScreen("pc-screen");
        renderPCScreen();
      }
      function renderPCScreen() {
        document.getElementById("pc-title").textContent = "PC Box";
        document.getElementById("pc-subtitle").textContent = G.pcBox.length
          ? "Pick a team member, then pick a boxed Pokemon to swap them. HP, fainted state, and move progress are preserved."
          : "Your PC is empty right now. Extra captures will appear here.";
        // Team and box cards are rebuilt from G so swaps preserve battle state.
        document.getElementById("pc-team").innerHTML = G.team
          .map(
            (m, i) => `
    <div class="team-slot ${swapTeamIdx === i ? "current" : ""}" role="button" tabindex="0" onclick="selectTeamForSwap(${i})">
      <img class="ts-sprite" src="${SP}${m.id}.gif" alt="${m.name}" loading="lazy" decoding="async">
      <div class="ts-name">${m.name}</div>
      <div class="ts-hp">${m.fainted ? "FAINTED" : `Lv${m.level} ${m.curHp}/${m.hp}`}</div>
      <div class="ts-bar"><div class="ts-fill" style="width:${Math.max(0, (m.curHp / m.hp) * 100)}%;background:${hpColor(Math.max(0, (m.curHp / m.hp) * 100))}"></div></div>
    </div>`,
          )
          .join("");
        document.getElementById("pc-box-grid").innerHTML = G.pcBox.length
          ? G.pcBox
              .map(
                (m, i) => `
    <div class="pc-slot" role="button" tabindex="0" onclick="swapFromPC(${i})">
      <img src="${SP}${m.id}.gif" alt="${m.name}" loading="lazy" decoding="async">
      <div class="pc-name">${m.name}</div>
      <div class="pc-lvl">${m.fainted ? "FAINTED" : `Lv${m.level} ${m.curHp}/${m.hp}`}</div>
    </div>`,
              )
              .join("")
          : `<div class="exp-box">No Pokemon are in the PC Box yet.</div>`;
        persistGame("pc-screen");
      }
      function showPCSwap() {
        if (!G.pcBox.length) {
          goToShop();
          return;
        }
        document.getElementById("bpanel").innerHTML = `<div class="team-panel">
    <h3>PC Box — Tap to swap with a team member</h3>
    <div style="font-size:10px;color:var(--dim);margin-bottom:8px">Your Team:</div>
    <div class="team-row">${G.team
      .map(
        (m, i) => `
      <div class="team-slot" role="button" tabindex="0" onclick="selectTeamForSwap(${i})" style="cursor:pointer">
        <img class="ts-sprite" src="${SP}${m.id}.gif" alt="${m.name}" loading="lazy" decoding="async">
        <div class="ts-name">${m.name}</div>
        <div class="ts-hp">Lv${m.level} ${m.curHp}/${m.hp}</div>
      </div>`,
      )
      .join("")}</div>
    <div style="font-size:10px;color:var(--dim);margin:8px 0">PC Box:</div>
    <div class="pc-grid">${G.pcBox
      .map(
        (m, i) => `
      <div class="pc-slot" role="button" tabindex="0" onclick="swapFromPC(${i})">
        <img src="${SP}${m.id}.gif" alt="${m.name}" loading="lazy" decoding="async">
        <div class="pc-name">${m.name}</div>
        <div class="pc-lvl">Lv${m.level} ${m.rarity}</div>
      </div>`,
      )
      .join("")}</div>
    <button class="btn btn-gold" onclick="goToShop()">Done</button>
  </div>`;
      }

      let swapTeamIdx = -1;
      function selectTeamForSwap(idx) {
        swapTeamIdx = idx;
        const pcScreen = document.getElementById("pc-screen");
        if (pcScreen && pcScreen.classList.contains("active")) {
          renderPCScreen();
          return;
        }
        document.querySelectorAll(".team-slot").forEach((el, i) => {
          el.style.borderColor = i === idx ? "var(--gold)" : "#2a3f60";
        });
      }

      function swapFromPC(pcIdx) {
        if (swapTeamIdx < 0) {
          swapTeamIdx = 0;
        }
        // Swap the two stored Pokemon objects directly to preserve HP, XP, and effects.
        const temp = G.team[swapTeamIdx];
        G.team[swapTeamIdx] = G.pcBox[pcIdx];
        G.pcBox[pcIdx] = temp;
        if (G.team[G.activeIdx]?.fainted) {
          const nextHealthy = G.team.findIndex((m) => !m.fainted);
          if (nextHealthy >= 0) G.activeIdx = nextHealthy;
        }
        swapTeamIdx = -1;
        const pcScreen = document.getElementById("pc-screen");
        if (pcScreen && pcScreen.classList.contains("active")) {
          renderPCScreen();
          return;
        }
        showPCSwap();
      }
      function closePCScreen() {
        swapTeamIdx = -1;
        if (G.pcContext === "battle") {
          showScreen("battle-screen");
          renderBattle();
          showMenu("Back from PC Box.");
          return;
        }
        goToShop();
      }

      // ========== SHOP ==========
      // The shop is the between-battle hub. goToShop renders the store, inventory,
      // and the "next encounter" button. Buying from the battle shop costs a turn.
      // showBag renders all owned items; targeted items (heal/revive) show a
      // team-select sub-panel. Held items can be equipped in shop or battle.
      // useItemOnTarget / equipHeld handle the actual state mutations.
      function goToShop() {
        G.shopContext = "screen";
        showScreen("shop-screen");
        setShopBackdrop();
        document.getElementById("shop-title").textContent =
          G.shopTitle || "Shop";
        document.getElementById("shop-title").style.color =
          G.shopColor || "var(--green)";
        document.getElementById("shop-money").textContent = "$" + G.money;
        document.getElementById("shop-msg").textContent = "";
        const nextBtn = document.getElementById("shop-next");
        const nextSpec = getEncounterSpec(G.encounterCount + 1);
        // The next button reflects the next planned encounter type.
        if (nextBtn) {
          nextBtn.disabled = false;
          nextBtn.textContent =
            nextSpec.kind === "boss"
              ? "Final Boss"
              : nextSpec.kind === "trainer"
                ? "Trainer Battle"
                : nextSpec.endless
                  ? "Wild Expedition"
                  : "Next Battle";
        }
        renderShop();
        persistGame("shop-screen");
      }

      function renderTeamSlot(mon, i, forced) {
        const pct = Math.max(0, (mon.curHp / mon.hp) * 100);
        const current = i === G.activeIdx;
        const disabled = mon.fainted || current;
        const heldInfo = mon.heldItem ? HELD_ITEMS.find(h => h.id === mon.heldItem) : null;
        return `<div class="team-slot ${mon.fainted ? "fainted" : ""} ${current ? "current" : ""}" ${disabled ? 'aria-disabled="true"' : `role="button" tabindex="0" onclick="doSwitch(${i}, ${forced ? "true" : "false"})"`}>
    ${!forced && current ? '<div class="ts-tag">Active</div>' : ""}
    <img class="ts-sprite" src="${SP}${mon.id}.gif" alt="${mon.name}" loading="lazy" decoding="async">
    <div class="ts-name">${mon.name}</div>
    <span class="type-badge ${mon.tc}" style="font-size:8px">${mon.type}</span>
    ${mon.ability ? `<span class="ability-badge" style="font-size:7px;margin-left:2px">${mon.ability.name}</span>` : ""}
    ${heldInfo ? `<div style="font-size:8px;color:var(--gold);margin-top:2px">${heldInfo.icon} ${heldInfo.name}</div>` : ""}
    <div class="ts-hp">${mon.fainted ? "FAINTED" : `Lv${mon.level} ${mon.curHp}/${mon.hp}`}</div>
    <div class="ts-bar"><div class="ts-fill" style="width:${pct}%;background:${hpColor(pct)}"></div></div>
  </div>`;
      }

      function forceSwitch() {
        document.getElementById("bpanel").innerHTML = `<div class="team-panel">
    <h3>${active().name} fainted! Choose your next Pokemon:</h3>
    <div class="team-row">${G.team.map((m, i) => renderTeamSlot(m, i, true)).join("")}</div>
  </div>`;
      }

      function clearSwitchOutEffects(mon) {
        if (!mon || !mon.fx) return;
        mon.fx.stun = 0;
        mon.fx.stunPending = 0;
        mon.fx.guard = 0;
        mon.fx.weaken = 0;
        mon.fx.vulnerable = 0;
      }

      function showTeam() {
        document.getElementById("bpanel").innerHTML = `<div class="team-panel">
    <h3>Your Team</h3>
    <div style="font-size:11px;color:var(--dim)">Switching costs your turn.</div>
    <div class="team-row">${G.team.map((m, i) => renderTeamSlot(m, i, false)).join("")}</div>
    <button class="menu-btn back" onclick="showMenu()">Back</button>
  </div>`;
      }

      async function spendUtilityTurn(message, color) {
        if (G.locked) return;
        G.locked = true;
        refreshHud();
        await flashMsg(message, color);
        await wait(1800);
        const ended = await handleDeaths();
        if (ended) return;
        // Switching and item use are useful, but still give the enemy a response.
        if (G.enemy && !G.enemy.fainted) {
          await runEnemyTurn();
          return;
        }
        G.pendingMove = null;
        G.locked = false;
        showMenu();
      }

      async function doSwitch(idx, forced = false) {
        if (G.locked || idx === G.activeIdx) return;
        clearSwitchOutEffects(active());
        G.boost = 1;
        G.activeIdx = idx;
        renderBattle();
        if (forced) {
          // Forced switches happen after fainting and do not spend an extra turn.
          G.locked = false;
          showMenu("Switched Pokemon.");
          return;
        }
        await spendUtilityTurn(
          `Switched to ${active().name}.`,
          "var(--accent)",
        );
      }

      function isTargetedItem(item) {
        return item && (item.effect === "heal" || item.effect === "revive");
      }
      function canUseItemInShop(item) {
        return isTargetedItem(item) || item?.effect === "held";
      }

      function bagItemDesc(item, context, catchAllowed) {
        if (context === "shop" && item.effect === "held") {
          return "Equip between battles";
        }
        if (context === "shop" && !canUseItemInShop(item)) {
          return "Use this during battle";
        }
        if (item.effect === "catch" && !catchAllowed) {
          return "Unavailable in trainer and boss battles";
        }
        if (item.effect === "catch" && G.enemy) {
          return `${item.desc} (${Math.round(calcCatchRate(G.enemy, item.catchMod) * 100)}% now)`;
        }
        return item.desc;
      }

      function renderBagItems(context = "battle") {
        const catchAllowed = !G.encounterMeta || G.encounterMeta.allowCatch;
        return ITEMS.map((item) => {
          const cnt = G.inv[item.id] || 0;
          const catchLocked = item.effect === "catch" && !catchAllowed;
          const shopLocked = context === "shop" && !canUseItemInShop(item);
          // Disabled bag cards stay visible so players know what they own.
          const empty = cnt <= 0 || catchLocked || shopLocked;
          const desc = bagItemDesc(item, context, catchAllowed);
          const action = isTargetedItem(item)
            ? `showItemTargets('${item.id}', '${context}')`
            : `useItem('${item.id}', '${context}')`;
          return `<div class="bag-item ${empty ? "empty" : ""}" ${empty ? 'aria-disabled="true"' : `role="button" tabindex="0" onclick="${action}"`}>
        <div class="bi-icon">${item.icon}</div>
        <div class="bi-name">${item.name}</div>
        <div class="bi-desc">${desc}</div>
        <div class="bi-count">x${cnt}</div>
      </div>`;
        }).join("");
      }

      function showBag() {
        document.getElementById("bpanel").innerHTML = `<div class="bag-panel">
    <h3>Bag</h3>
    <div style="font-size:11px;color:var(--dim)">Using an item costs your turn. ${!G.encounterMeta || G.encounterMeta.allowCatch ? "Catch odds increase hard as enemy HP drops." : "Trainer and boss battles do not allow catches."}</div>
    <div class="bag-row">${renderBagItems("battle")}</div>
    <button class="menu-btn back" onclick="showMenu()">Back</button>
  </div>`;
      }

      function setShopMessage(text, color = "var(--green)") {
        const msg = document.getElementById("shop-msg");
        if (!msg) return;
        msg.textContent = text || "";
        msg.style.color = color;
      }

      function showShopBag(message = "Choose an owned healing item to use.", color = "var(--dim)") {
        setShopMessage(message, color);
        document.getElementById("shop-grid").innerHTML = `<div class="bag-panel">
    <h3>Use Items</h3>
    <div style="font-size:11px;color:var(--dim)">Potions, Revives, and held items can be used between battles without spending a turn.</div>
    <div class="bag-row">${renderBagItems("shop")}</div>
    <button class="btn" onclick="showShopItems()">Back to Shop</button>
  </div>`;
        updateShopInv();
        persistGame("shop-screen");
      }

      function showShopItems() {
        setShopMessage("");
        renderShop();
      }

      function canTargetWithItem(item, mon) {
        if (!item || !mon) return false;
        if (item.effect === "heal") return !mon.fainted && mon.curHp < mon.hp;
        if (item.effect === "revive") return mon.fainted;
        return false;
      }

      function itemTargetStatus(item, mon) {
        if (item.effect === "heal") {
          if (mon.fainted) return "Fainted";
          if (mon.curHp >= mon.hp) return "Full HP";
          return `Missing ${mon.hp - mon.curHp} HP`;
        }
        if (item.effect === "revive") {
          return mon.fainted ? "Can revive" : "Not fainted";
        }
        return "";
      }

      function renderItemTargetSlot(item, mon, i, context) {
        const pct = Math.max(0, (mon.curHp / mon.hp) * 100);
        const canTarget = canTargetWithItem(item, mon);
        const faintedClass =
          mon.fainted && !(item.effect === "revive" && canTarget)
            ? "fainted"
            : "";
        return `<div class="team-slot ${faintedClass} ${i === G.activeIdx ? "current" : ""} ${canTarget ? "" : "disabled"}" ${canTarget ? `role="button" tabindex="0" onclick="useItemOnTarget('${item.id}', ${i}, '${context}')"` : 'aria-disabled="true"'}>
    ${i === G.activeIdx ? '<div class="ts-tag">Active</div>' : ""}
    <img class="ts-sprite" src="${SP}${mon.id}.gif" alt="${mon.name}" loading="lazy" decoding="async">
    <div class="ts-name">${mon.name}</div>
    <span class="type-badge ${mon.tc}" style="font-size:8px">${mon.type}</span>
    <div class="ts-hp">${mon.fainted ? "FAINTED" : `Lv${mon.level} ${mon.curHp}/${mon.hp}`}</div>
    <div class="ts-bar"><div class="ts-fill" style="width:${pct}%;background:${hpColor(pct)}"></div></div>
    <div style="font-size:9px;color:var(--dim);margin-top:4px">${itemTargetStatus(item, mon)}</div>
  </div>`;
      }

      function showItemTargets(id, context = "battle") {
        if (context === "battle" && G.locked) return;
        const item = ITEMS.find((i) => i.id === id);
        if (!isTargetedItem(item) || (G.inv[id] || 0) <= 0) return;
        const anyTarget = G.team.some((mon) => canTargetWithItem(item, mon));
        const helper =
          context === "shop"
            ? "Choose a Pokemon. Items used here do not cost a battle turn."
            : "Choose a Pokemon. Using this item costs your turn.";
        const panel = `<div class="team-panel">
    <h3>Use ${item.name} on which Pokemon?</h3>
    <div style="font-size:11px;color:var(--dim)">${helper}</div>
    ${anyTarget ? "" : `<div class="exp-box">No Pokemon can use ${item.name} right now.</div>`}
    <div class="team-row">${G.team.map((m, i) => renderItemTargetSlot(item, m, i, context)).join("")}</div>
    <button class="${context === "shop" ? "btn" : "menu-btn back"}" onclick="${context === "shop" ? "showShopBag()" : "showBag()"}">Back</button>
  </div>`;
        if (context === "shop") {
          setShopMessage("");
          document.getElementById("shop-grid").innerHTML = panel;
          updateShopInv();
          persistGame("shop-screen");
          return;
        }
        document.getElementById("bpanel").innerHTML = panel;
      }

      function inventoryText() {
        return (
          ITEMS.filter((i) => (G.inv[i.id] || 0) > 0)
            .map((i) => `${i.icon} ${i.name} x${G.inv[i.id]}`)
            .join(" | ") || "Empty"
        );
      }

      function renderShopCards(context) {
        return ITEMS.map((item) => {
          const cant = G.money < item.price;
          // Context chooses whether the card buys from the full shop screen or battle panel.
          return `<div class="shop-card ${cant ? "cant" : ""}" ${cant ? 'aria-disabled="true"' : `role="button" tabindex="0" onclick="buyItem('${item.id}', ${item.price}, '${context}')"`}>
      <div class="si">${item.icon}</div>
      <div class="sn">${item.name}</div>
      <div class="sd">${item.desc}</div>
      <div class="sp">$${item.price}</div>
      <div class="sq">Owned: ${G.inv[item.id] || 0}</div>
    </div>`;
        }).join("");
      }

      function showBattleShop() {
        G.shopContext = "battle";
        document.getElementById("bpanel").innerHTML = `<div class="bag-panel">
    <h3>Battle Shop</h3>
    <div class="shop-money">$${G.money}</div>
    <div class="shop-grid">${renderShopCards("battle")}</div>
    <div class="shop-inv"><b>Inventory:</b> ${inventoryText()}</div>
    <button class="menu-btn back" onclick="showMenu()">Back</button>
  </div>`;
      }

      async function useItem(id, context = "battle") {
        if ((context === "battle" && G.locked) || (G.inv[id] || 0) <= 0)
          return;
        const item = ITEMS.find((i) => i.id === id);
        if (!item) return;
        if (isTargetedItem(item)) {
          showItemTargets(id, context);
          return;
        }
        if (item.effect === "catch") {
          await tryBattleCatch(id);
          return;
        }
        if (item.effect === "held") {
          showEquipHeldItem(id, context);
          return;
        }
        G.inv[id]--;
        let actionText = "";
        let actionColor = "var(--green)";
        if (item.effect === "boost") {
          G.boost = item.val;
          actionText = `${active().name}'s next move is boosted.`;
          actionColor = "var(--red)";
        }
        refreshHud();
        await spendUtilityTurn(actionText, actionColor);
      }

      function showEquipHeldItem(itemId, context = "battle") {
        const item = HELD_ITEMS.find(h => h.id === itemId);
        if (!item) return;
        const slots = G.team.map((mon, i) => {
          const current = mon.heldItem ? HELD_ITEMS.find(h => h.id === mon.heldItem) : null;
          return `<div class="team-slot" role="button" tabindex="0" onclick="equipHeld('${itemId}', ${i}, '${context}')" style="cursor:pointer">
            <img class="ts-sprite" src="${SP}${mon.id}.gif" alt="${mon.name}" loading="lazy" decoding="async">
            <div class="ts-name">${mon.name}</div>
            <div class="ts-hp" style="font-size:9px;color:var(--dim)">${current ? current.icon + ' ' + current.name : 'No item'}</div>
          </div>`;
        }).join("");
        const panel = `<div class="bag-panel">
          <h3>Give ${item.icon} ${item.name} to:</h3>
          <div style="font-size:11px;color:var(--dim)">${context === "shop" ? "Equipping here does not cost a battle turn." : "Equipping during battle costs your turn."}</div>
          <div class="team-row">${slots}</div>
          <button class="${context === "shop" ? "btn" : "menu-btn back"}" onclick="${context === "shop" ? "showShopBag()" : "showBag()"}">Back</button>
        </div>`;
        if (context === "shop") {
          document.getElementById("shop-grid").innerHTML = panel;
          updateShopInv();
          persistGame("shop-screen");
          return;
        }
        document.getElementById("bpanel").innerHTML = panel;
      }

      async function equipHeld(itemId, teamIdx, context = "battle") {
        if ((context === "battle" && G.locked) || (G.inv[itemId] || 0) <= 0)
          return;
        const mon = G.team[teamIdx];
        const item = HELD_ITEMS.find(h => h.id === itemId);
        if (!mon || !item) return;
        if (mon.heldItem) {
          G.inv[mon.heldItem] = (G.inv[mon.heldItem] || 0) + 1;
        }
        G.inv[itemId]--;
        mon.heldItem = itemId;
        mon.sashUsed = false;
        mon.berryUsed = false;
        const actionText = `${mon.name} is now holding ${item.name}.`;
        if (context === "shop") {
          showShopBag(actionText, "var(--gold)");
          return;
        }
        renderBattle();
        await spendUtilityTurn(actionText, "var(--gold)");
      }

      async function useItemOnTarget(id, targetIdx, context = "battle") {
        if ((context === "battle" && G.locked) || (G.inv[id] || 0) <= 0)
          return;
        const item = ITEMS.find((i) => i.id === id);
        const target = G.team[targetIdx];
        if (!isTargetedItem(item) || !canTargetWithItem(item, target)) {
          showItemTargets(id, context);
          return;
        }

        G.inv[id]--;
        let actionText = "";
        let actionColor = "var(--green)";
        if (item.effect === "heal") {
          const healed = healTarget(target, item.val);
          actionText = `${target.name} healed ${healed} HP.`;
          flashSprite("player", "heal");
          spawnFloatText("player", `+${healed} HP`, "heal");
        } else if (item.effect === "revive") {
          target.fainted = false;
          target.curHp = Math.max(1, Math.floor(target.hp * item.val));
          target.fx = makeFx();
          actionText = `${target.name} was revived.`;
          actionColor = "var(--gold)";
          flashSprite("player", "revive");
          spawnFloatText("player", "Revived!", "heal");
        }

        if (G.team[G.activeIdx]?.fainted && !target.fainted) {
          G.activeIdx = targetIdx;
        }

        if (context === "shop") {
          showShopBag(actionText, actionColor);
          return;
        }

        if (targetIdx === G.activeIdx) renderBattle();
        else refreshHud();
        await spendUtilityTurn(actionText, actionColor);
      }

      async function flashMsg(text, color) {
        const token = ++battleMsgToken;
        let msgClass = "act-msg";
        if (color === "var(--gold)" || color === "#ffd700") msgClass += " crit-msg";
        else if (color === "var(--dim)" || color === "#888") msgClass += " neutral-msg";
        document.getElementById("bpanel").innerHTML =
          `<div class="act-panel"><div class="${msgClass}" id="battle-msg" style="color:${color}"></div></div>`;
        const el = document.getElementById("battle-msg");
        const chars = [...text];
        const step = 36;
        for (let i = 1; i <= chars.length; i++) {
          // Token prevents older animations from writing after a newer message starts.
          if (token !== battleMsgToken) return false;
          el.textContent = chars.slice(0, i).join("");
          await wait(step);
        }
        return token === battleMsgToken;
      }

      async function showNotes(notes, color) {
        if (!notes || !notes.length) return;
        await flashMsg(notes.join(" "), color);
        await wait(1950);
      }

      function spawnDmg(who, val, crit) {
        const d = document.createElement("div");
        d.className = "dmgf" + (crit ? " crit" : "");
        d.textContent = "-" + val;
        const arena = document.getElementById("arena");
        arena.appendChild(d);
        const point =
          who === "enemy"
            ? spriteArenaPoint("e-sprite", 0.5, 0.18)
            : spriteArenaPoint("p-sprite", 0.5, 0.2);
        if (point) {
          d.style.left = `${point.x}px`;
          d.style.top = `${point.y}px`;
        } else if (who === "enemy") {
          d.style.top = "18%";
          d.style.right = "15%";
        } else {
          d.style.bottom = "28%";
          d.style.left = "12%";
        }
        setTimeout(() => d.remove(), 1200);
      }

      function flash(color) {
        const f = document.createElement("div");
        f.className = "flash-ov";
        f.style.background = color;
        document.body.appendChild(f);
        setTimeout(() => f.remove(), 500);
      }

      function renderShop() {
        document.getElementById("shop-grid").innerHTML =
          renderShopCards("screen");
        updateShopInv();
      }

      async function buyItem(id, price, context = "screen") {
        const item = ITEMS.find((i) => i.id === id);
        const cost = item ? item.price : price;
        if (!item || G.money < cost) return;
        G.money -= cost;
        G.inv[id] = (G.inv[id] || 0) + 1;
        refreshHud();
        if (context === "battle") {
          // Battle shop purchases return to the in-battle shop panel.
          persistGame("battle-screen");
          await flashMsg(
            `Bought ${item.name}`,
            "var(--green)",
          );
          await wait(1575);
          showBattleShop();
          return;
        }
        document.getElementById("shop-money").textContent = "$" + G.money;
        document.getElementById("shop-msg").textContent =
          `Bought ${item.name}`;
        document.getElementById("shop-msg").style.color = "var(--green)";
        setTimeout(() => {
          const msg = document.getElementById("shop-msg");
          if (msg) msg.textContent = "";
        }, 1400);
        renderShop();
        persistGame("shop-screen");
      }

      function updateShopInv() {
        document.getElementById("shop-inv").innerHTML =
          `<b>Inventory:</b> ${inventoryText()}`;
      }

      function nextBattle() {
        startEncounter();
      }

      function showEnd(won, canContinue = false) {
        showScreen("result-screen");
        setResultBackdrop(won);
        if (!canContinue) {
          archiveCurrentRoster();
          clearSave();
        }
        const title = document.getElementById("r-title");
        const sprite = document.getElementById("r-sprite");
        const action = document.getElementById("result-action");
        if (won) {
          title.textContent = "CHAMPION!";
          title.style.color = "var(--gold)";
          sprite.src = SP + (G.team[0]?.id || "pikachu") + ".gif";
          setMusicTrack("victory");
          if (action) {
            action.textContent = canContinue ? "Continue" : "New Game";
            action.onclick = canContinue ? () => goToShop() : () => beginNextRun();
          }
        } else {
          title.textContent = "DEFEATED...";
          title.style.color = "var(--red)";
          sprite.src = SP + ((G.enemy && G.enemy.id) || G.team[0]?.id || "pikachu") + ".gif";
          if (action) {
            action.textContent = "New Game";
            action.onclick = () => beginNextRun();
          }
        }
        const acc = G.asked ? Math.round((G.correct / G.asked) * 100) : 0;
        const bestLvl = G.team.length ? Math.max(...G.team.map((m) => m.level)) : 1;
        document.getElementById("r-stats").innerHTML = `
    <div class="r-stat"><span class="r-val">${G.correct}/${G.asked}</span><span class="r-lbl">Correct</span></div>
    <div class="r-stat"><span class="r-val">${acc}%</span><span class="r-lbl">Accuracy</span></div>
    <div class="r-stat"><span class="r-val">${G.bestStreak}</span><span class="r-lbl">Best Streak</span></div>
    <div class="r-stat"><span class="r-val">${G.defeatedCount}</span><span class="r-lbl">Defeated</span></div>
    <div class="r-stat"><span class="r-val">${G.caughtIds.size}</span><span class="r-lbl">Caught</span></div>
    <div class="r-stat"><span class="r-val">Lv${bestLvl}</span><span class="r-lbl">Highest</span></div>
    <div class="r-stat"><span class="r-val">${MODES[G.mode].name}</span><span class="r-lbl">Mode</span></div>
    <div class="r-stat"><span class="r-val">$${G.money}</span><span class="r-lbl">Money</span></div>`;
      }

      // ========== SCREENSHOT GUIDE MODE ==========
      // Developer screenshot/debug mode activated via URL query string
      // (?guide=1 or ?screenshots=1). Injects a floating toolbar at the top that
      // navigates to pre-seeded game states (battle, moves, shop, PC, evolution,
      // backdrops) for visual testing and documentation screenshots.
      // All guideShow functions build a fake G state then render the screen.
      function isGuideMode() {
        const query = window.location?.search || "";
        return (
          query.includes("guide=1") ||
          query.includes("guide=true") ||
          query.includes("screenshots=1")
        );
      }

      function guideEnsureToolbar() {
        if (!isGuideMode() || document.getElementById("guide-toolbar")) return;
        const toolbar = document.createElement("div");
        toolbar.id = "guide-toolbar";
        toolbar.className = "guide-toolbar";
        toolbar.innerHTML = [
          ["title", "Title"],
          ["select", "Starters"],
          ["battle", "Battle"],
          ["moves", "Moves"],
          ["question", "Question"],
          ["feedback", "Feedback"],
          ["catch", "Catch/Bag"],
          ["shop", "Shop"],
          ["pc", "PC"],
          ["boss", "Boss"],
          ["backdrops", "Backdrops"],
          ["evolution", "Evolution"],
          ["result", "Result"],
        ]
          .map(
            ([id, label]) =>
              `<button type="button" onclick="guideShow('${id}')">${label}</button>`,
          )
          .join("");
        document.body.appendChild(toolbar);
      }

      function guideMon(id) {
        return ALL_MONS.find((m) => m.id === id) || ALL_MONS[0];
      }

      const guideBackdropState = {
        arenaIndex: 0,
        playerId: "bulbasaur",
        enemyId: "pikachu",
      };

      function guideOptionList(items, selectedValue) {
        return items
          .map(
            ({ value, label }) =>
              `<option value="${value}"${value === selectedValue ? " selected" : ""}>${label}</option>`,
          )
          .join("");
      }

      function guideMonOptions(selectedId) {
        return guideOptionList(
          ALL_MONS.map((mon) => ({ value: mon.id, label: mon.name })),
          selectedId,
        );
      }

      function guideBackdropOptions(selectedIndex) {
        return GUIDE_BACKDROP_ARENAS.map((arena, index) => ({
          value: String(index),
          label: arena.label,
        }))
          .map(
            ({ value, label }) =>
              `<option value="${value}"${Number(value) === selectedIndex ? " selected" : ""}>${label}</option>`,
          )
          .join("");
      }

      function guidePreviewMon(id, level = 50) {
        const mon = scaleToLevel(guideMon(id), level);
        mon.curHp = mon.hp;
        mon.fx = makeFx();
        mon.heldItem = "";
        return mon;
      }

      function guideApplyBackdropArena() {
        const arena = document.getElementById("arena");
        const entry = GUIDE_BACKDROP_ARENAS[guideBackdropState.arenaIndex];
        if (!arena || !entry) return;
        const theme = entry.theme || TYPE_ARENAS.Normal;
        applyArenaLayout(arena, theme, entry.id);
      }

      function guideRenderBackdropPanel() {
        const entry = GUIDE_BACKDROP_ARENAS[guideBackdropState.arenaIndex];
        document.getElementById("bpanel").innerHTML = `
    <div class="act-panel dev-backdrop-panel">
      <div class="dev-backdrop-title">
        <span>Backdrop Position Check</span>
        <span>${guideBackdropState.arenaIndex + 1}/${GUIDE_BACKDROP_ARENAS.length}</span>
      </div>
      <div class="dev-control-grid">
        <label class="dev-field">Backdrop
          <select onchange="guideSetBackdrop(Number(this.value))">
            ${guideBackdropOptions(guideBackdropState.arenaIndex)}
          </select>
        </label>
        <label class="dev-field">Player
          <select onchange="guideSetBackdropMon('player', this.value)">
            ${guideMonOptions(guideBackdropState.playerId)}
          </select>
        </label>
        <label class="dev-field">Opponent
          <select onchange="guideSetBackdropMon('enemy', this.value)">
            ${guideMonOptions(guideBackdropState.enemyId)}
          </select>
        </label>
      </div>
      <div class="menu-row dev-backdrop-actions">
        <button class="menu-btn back" type="button" onclick="guideStepBackdrop(-1)">Prev Backdrop</button>
        <button class="menu-btn back" type="button" onclick="guideStepBackdrop(1)">Next Backdrop</button>
        <button class="menu-btn back" type="button" onclick="guideStepBackdropMon('player', -1)">Prev Player</button>
        <button class="menu-btn back" type="button" onclick="guideStepBackdropMon('player', 1)">Next Player</button>
        <button class="menu-btn back" type="button" onclick="guideStepBackdropMon('enemy', -1)">Prev Opponent</button>
        <button class="menu-btn back" type="button" onclick="guideStepBackdropMon('enemy', 1)">Next Opponent</button>
        <button class="menu-btn back" type="button" onclick="guideSwapBackdropMons()">Swap Mons</button>
      </div>
      <div style="font-size:11px;color:var(--dim)">${entry.label}: ${G.team[0].name} vs ${G.enemy.name}</div>
    </div>`;
      }

      function guideShowBackdrops() {
        const player = guidePreviewMon(guideBackdropState.playerId);
        const enemy = guidePreviewMon(guideBackdropState.enemyId);
        G = createDefaultState();
        G.mode = "easy";
        G.team = [player];
        G.activeIdx = 0;
        G.enemy = enemy;
        G.encounterCount = 1;
        G.encounterMeta = normalizeEncounterMeta(
          {
            kind: "wild",
            kindLabel: "Dev Preview",
            title: GUIDE_BACKDROP_ARENAS[guideBackdropState.arenaIndex].label,
            subtitle: `${player.name} vs ${enemy.name}`,
            allowCatch: false,
            accent: "#ffd700",
          },
          enemy,
          1,
        );
        showScreen("battle-screen");
        document.getElementById("p-name").textContent = player.name;
        document.getElementById("p-lvl").textContent = "Lv" + player.level;
        document.getElementById("p-sprite").src = SPB + player.id + ".gif";
        document.getElementById("e-name").textContent = enemy.name;
        document.getElementById("e-lvl").textContent = "Lv" + enemy.level;
        document.getElementById("e-sprite").src = SP + enemy.id + ".gif";
        const trainer = document.getElementById("trainer-sprite");
        if (trainer) {
          trainer.removeAttribute("src");
          trainer.alt = "";
          trainer.classList.remove("visible");
        }
        ["p-sprite", "e-sprite"].forEach((id) => {
          const el = document.getElementById(id);
          el.classList.remove(
            "hit",
            "atk-r",
            "atk-l",
            "faint",
            "sendout-hidden",
            "sendout-appear",
          );
          el.style.opacity = 1;
        });
        guideApplyBackdropArena();
        refreshHud();
        guideRenderBackdropPanel();
      }

      function guideSetBackdrop(index) {
        guideBackdropState.arenaIndex = clamp(
          Number.isFinite(index) ? index : 0,
          0,
          GUIDE_BACKDROP_ARENAS.length - 1,
        );
        guideShowBackdrops();
      }

      function guideStepBackdrop(delta) {
        guideBackdropState.arenaIndex =
          (guideBackdropState.arenaIndex + delta + GUIDE_BACKDROP_ARENAS.length) %
          GUIDE_BACKDROP_ARENAS.length;
        guideShowBackdrops();
      }

      function guideSetBackdropMon(side, id) {
        if (!MON_BY_ID[id]) return;
        if (side === "player") guideBackdropState.playerId = id;
        else guideBackdropState.enemyId = id;
        guideShowBackdrops();
      }

      function guideStepBackdropMon(side, delta) {
        const currentId =
          side === "player"
            ? guideBackdropState.playerId
            : guideBackdropState.enemyId;
        const currentIndex = Math.max(
          0,
          ALL_MONS.findIndex((mon) => mon.id === currentId),
        );
        const nextIndex =
          (currentIndex + delta + ALL_MONS.length) % ALL_MONS.length;
        guideSetBackdropMon(side, ALL_MONS[nextIndex].id);
      }

      function guideSwapBackdropMons() {
        const currentPlayer = guideBackdropState.playerId;
        guideBackdropState.playerId = guideBackdropState.enemyId;
        guideBackdropState.enemyId = currentPlayer;
        guideShowBackdrops();
      }

      function guideSetupRun(encounterNumber = 1) {
        G = createDefaultState();
        G.mode = "easy";
        G.team = ["bulbasaur", "charmander", "squirtle"].map((id) =>
          createRunMon(guideMon(id)),
        );
        G.team.forEach((mon, i) => {
          mon.level = 5 + i;
          mon.xp = 20 * i;
          mon.xpToNext = xpForLevel(mon.level);
          mon.curHp = Math.max(1, mon.hp - 8 - i * 3);
        });
        G.activeIdx = 0;
        G.money = 450;
        G.inv = {
          ...DEFAULT_INV,
          potion: 3,
          superp: 1,
          revive: 1,
          pokeball: 6,
          greatball: 2,
          ultraball: 1,
          leftovers: 1,
        };
        G.streak = 3;
        G.bestStreak = 5;
        G.asked = 12;
        G.correct = 9;
        G.defeatedCount = 3;
        G.caughtIds = new Set(["zubat", "eevee"]);
        G.pcBox = ["pikachu", "eevee", "zubat", "gastly"].map((id) =>
          createRunMon(guideMon(id)),
        );
        const encounter = createEncounter(encounterNumber);
        G.encounterCount = encounterNumber;
        G.enemy = encounter.enemy;
        G.encounterMeta = encounter.meta;
        G.enemy.curHp = Math.max(1, Math.round(G.enemy.hp * 0.42));
        G.enemy.fx.poison = 2;
        G.lastEnemyMove = null;
        G.pendingMove = null;
        G.pendingAnswerOk = false;
        G.answerLocked = false;
        G.locked = false;
        resetBattleQuestionBank();
      }

      function guideShowBattle(message = "") {
        showScreen("battle-screen");
        renderBattle();
        showMenu(
          message ||
            "Screenshot mode: this battle screen shows the quiz-combat layout.",
        );
      }

      // ── Evolution test state ──────────────────────────────
      const guideEvoState = {
        monId: "bulbasaur",
        level: 16,
        evolved: false,
        result: null,
        animating: false,
      };

      function guideEvolutionEligibleMon() {
        const baseId = MON_BY_ID[guideEvoState.monId]
          ? guideEvoState.monId
          : "bulbasaur";
        const evo = EVOLUTIONS[baseId];
        const level = evo
          ? Math.max(guideEvoState.level, evo.level)
          : guideEvoState.level;
        return guidePreviewMon(baseId, level);
      }

      function guideEvoMonOptions(selectedId) {
        return guideOptionList(
          ALL_MONS.map((mon) => {
            const evo = EVOLUTIONS[mon.id];
            const label = evo
              ? `${mon.name} → ${MON_BY_ID[evo.to]?.name || evo.to} (Lv${evo.level})`
              : mon.name;
            return { value: mon.id, label };
          }),
          selectedId,
        );
      }

      function guideShowEvolution() {
        const player = guidePreviewMon(guideEvoState.monId, guideEvoState.level);
        G = createDefaultState();
        G.mode = "easy";
        G.team = [player];
        G.activeIdx = 0;
        G.enemy = null;
        G.encounterCount = 1;
        showScreen("battle-screen");
        document.getElementById("p-name").textContent = player.name;
        document.getElementById("p-lvl").textContent = "Lv" + player.level;
        document.getElementById("p-sprite").src = SPB + player.id + ".gif";
        document.getElementById("p-sprite").style.opacity = 1;
        [
          "hit",
          "atk-r",
          "atk-l",
          "faint",
          "sendout-hidden",
          "sendout-appear",
        ].forEach((c) => document.getElementById("p-sprite").classList.remove(c));
        document
          .getElementById("p-sprite")
          .classList.remove("evo-transform-out", "evo-transform-in");
        document.getElementById("e-name").textContent = "";
        document.getElementById("e-lvl").textContent = "";
        const eSprite = document.getElementById("e-sprite");
        eSprite.src = "";
        eSprite.alt = "";
        const trainer = document.getElementById("trainer-sprite");
        if (trainer) {
          trainer.removeAttribute("src");
          trainer.alt = "";
          trainer.classList.remove("visible");
        }
        const arena = document.getElementById("arena");
        if (arena) applyArenaLayout(arena, TYPE_ARENAS.Normal, "grass-field");
        refreshHud();
        guideRenderEvolutionPanel();
      }

      function guideRenderEvolutionPanel() {
        const evo = EVOLUTIONS[guideEvoState.monId];
        const canEv = evo && guideEvoState.level >= evo.level && MON_BY_ID[evo.to];
        const mon = guidePreviewMon(guideEvoState.monId, guideEvoState.level);

        // Update battle sprites to reflect current mon/level
        document.getElementById("p-name").textContent = mon.name;
        document.getElementById("p-lvl").textContent = "Lv" + mon.level;
        if (!guideEvoState.animating) {
          document.getElementById("p-sprite").src = SPB + mon.id + ".gif";
        }

        let evoInfo = "";
        if (canEv) {
          const preview = previewEvolution(mon);
          const target = preview ? MON_BY_ID[preview.toId] : MON_BY_ID[evo.to];
          const previewHp = preview ? preview.hpDelta : 0;
          const previewAtk = preview ? preview.atkDelta : 0;
          const previewDef = preview ? preview.defDelta : 0;
          evoInfo = `<div class="evo-preview-info">
            <div class="evo-preview-arrow">
              <img src="${SP}${guideEvoState.monId}.gif" alt="${mon.name}" style="width:56px;height:56px;image-rendering:pixelated">
              <span class="ar" style="font-size:16px">→</span>
              <img src="${SP}${target.id}.gif" alt="${target.name}" style="width:56px;height:56px;image-rendering:pixelated;opacity:.65">
            </div>
            <div style="color:#90f7a0;font-size:13px">Evolves into <em style="color:var(--accent)">${target.name}</em> at Lv${evo.level}</div>
            <div style="color:var(--dim);font-size:11px;margin-top:2px">+${previewHp} HP | +${previewAtk} ATK | +${previewDef} DEF${preview && preview.learnedMove ? ` | Learns ${preview.learnedMove}` : " | No new move"}</div>
          </div>`;
        } else if (evo && MON_BY_ID[evo.to]) {
          const need = evo.level - guideEvoState.level;
          evoInfo = `<div class="evo-preview-info dim">
            ${MON_BY_ID[evo.to]?.name || evo.to} requires Lv${evo.level} (need ${need} more)
          </div>`;
        } else {
          evoInfo = `<div class="evo-preview-info dim">This Pokemon does not evolve.</div>`;
        }

        let resultHtml = "";
        if (guideEvoState.evolved && guideEvoState.result) {
          const r = guideEvoState.result;
          const moveLine = r.learnedMove
            ? `<div><span class="move">Learned ${r.learnedMove}!${r.replacedMove ? ` Replaced ${r.replacedMove}.` : ""}</span></div>`
            : "";
          resultHtml = `<div class="evo-panel${guideEvoState.animating ? " evo-animating" : ""}">
            <h4>EVOLVED!</h4>
            <div class="evo-arrow">
              <img src="${SP}${r.fromId}.gif" alt="${r.fromName}">
              <span class="ar">→</span>
              <img class="evo-after evo-flash" src="${SP}${r.toId}.gif" alt="${r.toName}">
            </div>
            <div class="evo-name">${r.fromName} evolved into <em>${r.toName}</em>!</div>
            <div class="evo-deltas">
              <span class="gain">+${r.hpDelta} HP</span> &nbsp;
              <span class="gain">+${r.atkDelta} ATK</span> &nbsp;
              <span class="gain">+${r.defDelta} DEF</span>
              ${moveLine}
            </div>
          </div>`;
        }

        document.getElementById("bpanel").innerHTML = `<div class="act-panel dev-backdrop-panel">
          <div class="dev-backdrop-title">
            <span>Evolution Testing</span>
          </div>
          <div class="dev-control-grid evo-test-grid">
            <label class="dev-field">Pokemon
              <select onchange="guideSetEvoMon(this.value)">
                ${guideEvoMonOptions(guideEvoState.monId)}
              </select>
            </label>
            <label class="dev-field">Level
              <input type="number" min="1" max="100" value="${guideEvoState.level}"
                onchange="guideSetEvoLevel(Number(this.value))" class="dev-number-input">
              <input type="range" min="1" max="100" value="${guideEvoState.level}"
                oninput="guideSetEvoLevel(Number(this.value))" class="dev-range-input">
            </label>
          </div>
          ${evoInfo}
          ${canEv && !guideEvoState.evolved && !guideEvoState.animating ? `<div class="evo-row">
            <button class="btn btn-gold" onclick="guideDoEvolution()">Evolve!</button>
          </div>` : ""}
          ${guideEvoState.evolved ? `<div class="evo-row">
            <button class="btn" onclick="guideResetEvolution()"${guideEvoState.animating ? " disabled" : ""}>Reset</button>
          </div>` : ""}
          <div class="evo-row">
            <button class="btn" onclick="guidePreviewEvolutionVictory('prompt')">Post-Battle Prompt</button>
            <button class="btn" onclick="guidePreviewEvolutionVictory('result')">Result Screen</button>
            <button class="btn btn-gold" onclick="guidePreviewEvolutionVictory('animation')">Play Full Animation</button>
          </div>
          ${resultHtml}
        </div>`;
      }

      function guideSetEvoMon(id) {
        if (!MON_BY_ID[id]) return;
        guideEvoState.monId = id;
        guideEvoState.evolved = false;
        guideEvoState.result = null;
        guideEvoState.animating = false;
        guideRenderEvolutionPanel();
      }

      function guideSetEvoLevel(level) {
        guideEvoState.level = clamp(Number.isFinite(level) ? level : 1, 1, 100);
        guideEvoState.evolved = false;
        guideEvoState.result = null;
        guideEvoState.animating = false;
        guideRenderEvolutionPanel();
      }

      async function guideDoEvolution() {
        if (guideEvoState.animating) return;
        const evo = EVOLUTIONS[guideEvoState.monId];
        if (!evo || guideEvoState.level < evo.level || !MON_BY_ID[evo.to]) return;
        const mon = guidePreviewMon(guideEvoState.monId, guideEvoState.level);
        const result = evolveMon(mon);
        if (!result) return;
        guideEvoState.result = result;
        guideEvoState.evolved = true;
        guideEvoState.animating = true;
        guideRenderEvolutionPanel();
        await playEvolutionAnimation(result, "player");
        guideEvoState.animating = false;
        // Update battle sprite to show evolved form
        document.getElementById("p-name").textContent = mon.name;
        document.getElementById("p-lvl").textContent = "Lv" + mon.level;
        document.getElementById("p-sprite").src = SPB + mon.id + ".gif";
        refreshHud();
        guideRenderEvolutionPanel();
      }

      function guideResetEvolution() {
        guideEvoState.evolved = false;
        guideEvoState.result = null;
        guideEvoState.animating = false;
        guideRenderEvolutionPanel();
      }

      async function guidePreviewEvolutionVictory(mode = "prompt") {
        const player = guideEvolutionEligibleMon();
        if (!EVOLUTIONS[player.id]) {
          guideShowEvolution();
          return;
        }
        G = createDefaultState();
        G.mode = "easy";
        G.team = [player];
        G.activeIdx = 0;
        G.encounterCount = 1;
        G.enemy = guidePreviewMon("pikachu", Math.max(5, player.level - 1));
        G.enemy.curHp = 0;
        G.enemy.fainted = true;
        showScreen("battle-screen");
        renderBattle();
        showVictoryScreen(
          G.enemy,
          150,
          90,
          [
            {
              level: player.level,
              stat: "+4HP +1ATK",
            },
          ],
          { kind: "wild" },
        );

        if (mode === "result") {
          const result = evolveMon(active());
          if (!result) return;
          G.pendingVictory.evoResult = result;
          document.getElementById("p-name").textContent = active().name;
          document.getElementById("p-lvl").textContent = "Lv" + active().level;
          document.getElementById("p-sprite").src = SPB + active().id + ".gif";
          renderVictoryPanel();
        } else if (mode === "animation") {
          await confirmEvolution();
        }
      }

      function guideApplyEvolutionParams(params) {
        const monId =
          params.get("mon") ||
          params.get("pokemon") ||
          params.get("evoMon") ||
          params.get("id");
        if (monId && MON_BY_ID[monId]) {
          guideEvoState.monId = monId;
        }

        const level = Number(params.get("level") || params.get("lvl"));
        if (Number.isFinite(level)) {
          guideEvoState.level = clamp(level, 1, 100);
        }

        guideEvoState.evolved = false;
        guideEvoState.result = null;
        guideEvoState.animating = false;
        guideShowEvolution();

        const autoEvolve =
          params.get("evolve") === "1" ||
          params.get("evolved") === "1" ||
          params.get("animate") === "1";
        if (autoEvolve) guideDoEvolution();
      }

      function guideShow(stage) {
        guideEnsureToolbar();
        if (stage === "title") {
          G = createDefaultState();
          showScreen("title-screen");
          return;
        }
        if (stage === "select") {
          G = createDefaultState();
          useStartersOnly = true;
          showScreen("select-screen");
          ["bulbasaur", "charmander", "squirtle"].forEach(togglePick);
          return;
        }
        if (stage === "boss") {
          guideSetupRun(RUN_LENGTH);
          G.mode = "hard";
          guideShowBattle("Prof. Nielsen is the final boss encounter.");
          return;
        }
        if (stage === "backdrops") {
          guideShowBackdrops();
          return;
        }
        if (stage === "evolution") {
          guideShowEvolution();
          return;
        }
        guideSetupRun(stage === "shop" || stage === "pc" || stage === "result" ? 3 : 1);
        if (stage === "battle") {
          guideShowBattle();
        } else if (stage === "moves") {
          guideShowBattle();
          showMoves();
        } else if (stage === "question") {
          guideShowBattle();
          G.pendingMove = active().moves[0];
          showQuestion(1);
        } else if (stage === "feedback") {
          guideShowBattle();
          G.pendingMove = active().moves[0];
          showQuestion(1);
          showAnswerResult(true);
        } else if (stage === "catch") {
          guideShowBattle("Wild Pokemon can be caught from the bag.");
          showBag();
        } else if (stage === "shop") {
          G.shopTitle = "Victory!";
          G.shopColor = "var(--green)";
          showScreen("shop-screen");
          setShopBackdrop();
          document.getElementById("shop-title").textContent = "Victory!";
          document.getElementById("shop-title").style.color = "var(--green)";
          document.getElementById("shop-money").textContent = "$" + G.money;
          document.getElementById("shop-msg").textContent =
            "Buy items before the next IB 35AC encounter.";
          renderShop();
        } else if (stage === "pc") {
          G.pcContext = "shop";
          showScreen("pc-screen");
          renderPCScreen();
        } else if (stage === "result") {
          showEnd(true, true);
        }
      }

      Object.assign(window, {
        guideShow,
        guideSetBackdrop,
        guideStepBackdrop,
        guideSetBackdropMon,
        guideStepBackdropMon,
        guideSwapBackdropMons,
        guideShowEvolution,
        guideSetEvoMon,
        guideSetEvoLevel,
        guideDoEvolution,
        guideResetEvolution,
        guidePreviewEvolutionVictory,
        guideApplyEvolutionParams,
      });

      function initGuideMode() {
        if (!isGuideMode()) return;
        guideEnsureToolbar();
        const params = new URLSearchParams(window.location.search || "");
        const stage = params.get("stage") || "title";
        const backdrop = Number(params.get("backdrop"));
        if (stage === "backdrops" && Number.isFinite(backdrop)) {
          guideSetBackdrop(backdrop);
        } else if (stage === "evolution" || stage === "evo") {
          guideApplyEvolutionParams(params);
        } else {
          guideShow(stage);
        }
      }

      // ========== KEYBOARD SHORTCUTS / INITIAL RENDER ==========
      // Enter/Space for role="button" elements, Escape to cancel slot overwrite,
      // and A-D / 1-4 keys for the 4 answer buttons in quiz panels.
      document.addEventListener("keydown", (e) => {
        if (
          (e.key === "Enter" || e.key === " ") &&
          e.target?.getAttribute?.("role") === "button"
        ) {
          e.preventDefault();
          e.target.click();
          return;
        }
        if (e.key === "Escape" && choosingOverwriteSlot) {
          cancelOverwriteSelect();
          return;
        }
        const k = e.key.toLowerCase();
        const buttons = document.querySelectorAll(".a-btn:not(.locked)");
        if (buttons.length) {
          const map = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
          if (k in map && map[k] < buttons.length) buttons[map[k]].click();
        }
      });

      // ========== ASSET PRELOADER ==========
      // Progressive asset loading: enumerates all backgrounds, mon sprites
      // (front + back per dex entry), trainer portraits, and move animation
      // sheets, then preloads them as Image objects. A progress bar updates
      // per-image and the title screen appears once finished (or 15s fallback).
      (function preloadAssets() {
        const images = [];

        // Background images
        ["title-screen","select-screen","shop-screen","result-win","result-lose"]
          .forEach(f => images.push(`./assets/backgrounds/${f}.png`));
        GUIDE_BACKDROP_ARENAS.forEach((entry) => {
          const match = entry.theme.bg.match(/url\('([^']+)'\)/);
          if (match) images.push(`./${match[1]}`);
        });

        // All DEX mon sprites (front + back)
        ALL_MONS.forEach(mon => {
          const id = mon.id;
          images.push(SP + id + ".gif");
          images.push(SPB + id + ".gif");
        });

        // Trainer sprites
        ["anna.png","monica.png","annie.png","emily.png","fiona.png","prof-nielsen.png"]
          .forEach(f => images.push(TRAINER_PATH + f));

        // Move animation sheets
        const animFiles = [
          "Air Cutter","Bite","Bulk Up","Calm Mind","Charm","Comet Punch","Constrict",
          "Defense Curl","Dig","Ember","Focus Energy","Fury Swipes","Gust","Headbutt",
          "Health Up","Karate Chop","Lick","Low Kick","Mean Look","Metal Claw",
          "Mind Reader","Peck","Poison Powder","Protect","Reflect","Roar","Rock Throw",
          "Scratch","Shadow Ball","Shiny","Slash","Sleep Powder","Status Burn",
          "Status Confusion","Status Freeze","Status Sleep","Stomp","Struggle",
          "Supersonic","Tackle","Thunder Punch","Thunder Shock","Thunder Wave","Toxic","Vine Whip"
        ];
        animFiles.forEach(f => images.push(MOVE_ANIMATION_PATH + encodeURIComponent(f) + ".png"));

        let loaded = 0;
        let loadingFinished = false;
        const total = images.length;
        const bar = document.getElementById("load-bar");
        const pct = document.getElementById("load-pct");

        function tick() {
          loaded++;
          const p = Math.round((loaded / total) * 100);
          bar.style.width = p + "%";
          pct.textContent = p + "%";
          if (loaded >= total) finishLoading();
        }

        function finishLoading() {
          if (loadingFinished) return;
          loadingFinished = true;
          document.getElementById("loading-screen").classList.remove("active");
          document.getElementById("loading-screen").style.display = "none";
          document.getElementById("title-screen").classList.add("active");
          renderModeUi();
          refreshTitleSaveUi();
          renderMusicToggle();
          updateMusicForScreen();
          initGuideMode();
        }

        images.forEach(src => {
          const img = new Image();
          img.onload = tick;
          img.onerror = tick;
          img.src = src;
        });

        // Fallback: if loading takes too long (15s), show the game anyway
        setTimeout(() => {
          if (loaded < total) finishLoading();
        }, 15000);
      })();

      window.addEventListener("resize", () =>
        requestAnimationFrame(positionBattleShadows),
      );
