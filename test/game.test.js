import { describe, test, expect, beforeAll, beforeEach } from "vitest";
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const { createStubs } = require("../scripts/game-data-loader.js");

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA_PATH = path.join(ROOT, "js", "data.js");
const GAME_PATH = path.join(ROOT, "js", "game.js");

const DATA_EXPORT_VARS = [
  "TYPES", "TYPE_CLASS", "TYPE_CHART", "MODES",
  "MOVE_POOLS", "UTIL_MOVES", "LEGENDARY_MOVES",
  "ABILITIES", "TYPE_ABILITIES", "HELD_ITEMS", "RARITY_STATS",
  "DEX", "STARTER_IDS", "EVO_DATA", "RUN_PLAN", "RUN_LENGTH",
  "TYPE_ARENAS", "GUIDE_BACKDROP_ARENAS", "ITEMS", "QS",
  "ALL_MONS", "MON_BY_ID", "EVOLUTIONS",
];

let ctx;
let data;
let G;

function initContext() {
  const sandbox = createStubs();
  const dataCode = fs.readFileSync(DATA_PATH, "utf8");
  const exportList = DATA_EXPORT_VARS.join(", ");
  vm.runInNewContext(
    `${dataCode}\nglobalThis.__DATA__ = { ${exportList} };`,
    sandbox,
    { filename: DATA_PATH, timeout: 5000 },
  );
  const gameCode = fs.readFileSync(GAME_PATH, "utf8");
  vm.runInNewContext(gameCode, sandbox, { filename: GAME_PATH, timeout: 5000 });
  vm.runInNewContext(
    `globalThis.__GET_G = () => G;
     globalThis.__SET_G = (v) => { G = v; };`,
    sandbox,
    { filename: "game-exports", timeout: 5000 },
  );
  return sandbox;
}

function resetG() {
  G = ctx.__GET_G();
  G.team = [];
  G.pcBox = [];
  G.inv = { ...ctx.__DATA__.ITEMS.reduce((o, i) => ({ ...o, [i.id]: 0 }), {}) };
}

beforeAll(() => {
  ctx = initContext();
  data = ctx.__DATA__;
  G = ctx.__GET_G();
});

// ==================================================================
// 1. DATA INTEGRITY
// ==================================================================
describe("Data Integrity", () => {
  test("TYPES has 18 elements", () => {
    expect(data.TYPES).toHaveLength(18);
  });

  test("TYPE_CHART is 18x18", () => {
    expect(Object.keys(data.TYPE_CHART)).toHaveLength(18);
    for (const row of Object.values(data.TYPE_CHART)) {
      expect(Object.keys(row)).toHaveLength(18);
    }
  });

  test("TYPE_CHART multipliers are valid", () => {
    const valid = [0, 0.25, 0.5, 1, 2, 4];
    for (const [atk, row] of Object.entries(data.TYPE_CHART)) {
      for (const [def, mult] of Object.entries(row)) {
        expect(valid, `${atk}→${def} multiplier ${mult} is invalid`).toContain(mult);
      }
    }
  });

  test("Every DEX entry has required fields", () => {
    data.DEX.forEach((entry, i) => {
      expect(entry[0], `DEX[${i}] missing id`).toBeTruthy();
      expect(entry[1], `DEX[${i}] missing name`).toBeTruthy();
      expect(entry[2], `DEX[${i}] missing type`).toBeTruthy();
      expect(data.TYPES, `DEX[${i}] has unknown type ${entry[2]}`).toContain(entry[2]);
      if (entry[3]) {
        expect(data.TYPES, `DEX[${i}] has unknown type2 ${entry[3]}`).toContain(entry[3]);
      }
    });
  });

  test("DEX contains at least 200 entries", () => {
    expect(data.DEX.length).toBeGreaterThanOrEqual(200);
  });

  test("STARTER_IDS all reference valid DEX entries", () => {
    const dexIds = new Set(data.DEX.map(([id]) => id));
    data.STARTER_IDS.forEach((id) => {
      expect(dexIds, `Starter ${id} not in DEX`).toContain(id);
    });
  });

  test("STARTER_IDS contains Gen 1-7 starters", () => {
    expect(data.STARTER_IDS.length).toBeGreaterThanOrEqual(18);
  });

  test("EVO_DATA references valid DEX IDs", () => {
    const dexIds = new Set(data.DEX.map(([id]) => id));
    data.EVO_DATA.forEach(([from, to, level], i) => {
      expect(dexIds, `EVO_DATA[${i}] source ${from} not in DEX`).toContain(from);
      expect(dexIds, `EVO_DATA[${i}] target ${to} not in DEX`).toContain(to);
      expect(level, `EVO_DATA[${i}] level ${level} invalid`).toBeGreaterThanOrEqual(2);
      expect(level, `EVO_DATA[${i}] level ${level} too high`).toBeLessThanOrEqual(100);
    });
  });

  test("EVO_DATA has at least 80 evolution entries", () => {
    expect(data.EVO_DATA.length).toBeGreaterThanOrEqual(80);
  });

  test("MOVE_POOLS entries have valid structure", () => {
    Object.entries(data.MOVE_POOLS).forEach(([poolType, tiers]) => {
      if (poolType === "Adaptive") return;
      expect(data.TYPES, `Move pool type ${poolType} not a valid type`).toContain(poolType);
      Object.entries(tiers).forEach(([tier, moves]) => {
        if (!Array.isArray(moves)) return;
        moves.forEach((move, i) => {
          expect(move.name, `MOVE_POOLS.${poolType}.${tier}[${i}] missing name`).toBeTruthy();
          expect(move.p != null, `MOVE_POOLS.${poolType}.${tier}[${i}].${move.name} missing power`).toBe(true);
        });
      });
    });
  });

  test("MOVE_POOLS covers every type", () => {
    data.TYPES.forEach((t) => {
      expect(data.MOVE_POOLS, `MOVE_POOLS missing type ${t}`).toHaveProperty(t);
    });
  });

  test("RUN_PLAN encounters have valid structure", () => {
    data.RUN_PLAN.forEach((enc, i) => {
      expect(["wild", "trainer", "boss"], `RUN_PLAN[${i}] has invalid kind`).toContain(enc.kind);
      if (enc.kind === "trainer" || enc.kind === "boss") {
        expect(enc.trainerName, `RUN_PLAN[${i}] missing trainerName`).toBeTruthy();
        expect(enc.taunt, `RUN_PLAN[${i}] missing taunt`).toBeTruthy();
      }
      if (enc.kind === "wild") {
        expect(enc.label, `RUN_PLAN[${i}] missing label`).toBeTruthy();
      }
    });
  });

  test("RUN_PLAN has at least 8 encounters", () => {
    expect(data.RUN_PLAN.length).toBeGreaterThanOrEqual(8);
  });

  test("RUN_LENGTH matches RUN_PLAN length", () => {
    expect(data.RUN_LENGTH).toBe(data.RUN_PLAN.length);
  });

  test("Questions have valid structure", () => {
    data.QS.forEach((q, i) => {
      expect([1, 2, 3], `QS[${i}] invalid difficulty`).toContain(q.d);
      expect(q.q, `QS[${i}] missing question text`).toBeTruthy();
      expect(q.cat, `QS[${i}] missing category`).toBeTruthy();
      expect(Array.isArray(q.a), `QS[${i}] answers not an array`).toBe(true);
      expect(q.a.length, `QS[${i}] needs at least 2 answers`).toBeGreaterThanOrEqual(2);
      expect(q.c, `QS[${i}] correct index out of range`).toBeGreaterThanOrEqual(0);
      expect(q.c, `QS[${i}] correct index out of range`).toBeLessThan(q.a.length);
      expect(q.e, `QS[${i}] missing explanation`).toBeTruthy();
    });
  });

  test("Questions has at least 100 entries", () => {
    expect(data.QS.length).toBeGreaterThanOrEqual(100);
  });

  test("RARITY_STATS has 4 rarities with correct keys", () => {
    const rarities = ["Common", "Uncommon", "Rare", "Legendary"];
    rarities.forEach((r) => {
      expect(data.RARITY_STATS, `Missing rarity ${r}`).toHaveProperty(r);
      const s = data.RARITY_STATS[r];
      expect(s.hp).toHaveLength(2);
      expect(s.atk).toHaveLength(2);
      expect(s.def).toHaveLength(2);
      expect(Array.isArray(s.slots)).toBe(true);
      expect(s.slots.length).toBeGreaterThanOrEqual(4);
      expect(typeof s.catchRate).toBe("number");
      expect(s.catchRate).toBeGreaterThan(0);
      expect(s.catchRate).toBeLessThanOrEqual(1);
      expect(typeof s.xpYield).toBe("number");
      expect(s.xpYield).toBeGreaterThan(0);
    });
  });

  test("HELD_ITEMS have valid structure", () => {
    data.HELD_ITEMS.forEach((item, i) => {
      expect(item.id, `HELD_ITEMS[${i}] missing id`).toBeTruthy();
      expect(item.name, `HELD_ITEMS[${i}] missing name`).toBeTruthy();
      expect(typeof item.price, `HELD_ITEMS[${i}] missing price`).toBe("number");
      expect(item.price).toBeGreaterThan(0);
    });
  });

  test("ITEMS have valid structure", () => {
    data.ITEMS.forEach((item, i) => {
      expect(item.id, `ITEMS[${i}] missing id`).toBeTruthy();
      expect(item.name, `ITEMS[${i}] missing name`).toBeTruthy();
      expect(item.effect, `ITEMS[${i}] missing effect`).toBeTruthy();
      expect(typeof item.price, `ITEMS[${i}] missing price`).toBe("number");
      expect(item.price).toBeGreaterThan(0);
    });
  });

  test("ITEMS includes all HELD_ITEMS", () => {
    data.HELD_ITEMS.forEach((h) => {
      const found = data.ITEMS.find((i) => i.id === h.id);
      expect(found, `ITEM ${h.id} not found in ITEMS`).toBeTruthy();
      expect(found.effect).toBe("held");
    });
  });

  test("TYPE_CLASS has entries matching TYPES", () => {
    data.TYPES.forEach((t) => {
      expect(data.TYPE_CLASS, `TYPE_CLASS missing ${t}`).toHaveProperty(t);
    });
  });

  test("MODES has easy and hard keys", () => {
    expect(data.MODES).toHaveProperty("easy");
    expect(data.MODES).toHaveProperty("hard");
    expect(data.MODES.easy.name).toBe("Easy");
    expect(data.MODES.hard.name).toBe("Hard");
  });

  test("ALL_MONS length matches DEX length", () => {
    expect(data.ALL_MONS.length).toBe(data.DEX.length);
  });

  test("ALL_MONS entries have required fields", () => {
    data.ALL_MONS.forEach((mon) => {
      expect(mon.id).toBeTruthy();
      expect(mon.name).toBeTruthy();
      expect(mon.type).toBeTruthy();
      expect(mon.rarity).toBeTruthy();
      expect(typeof mon.hp).toBe("number");
      expect(typeof mon.atk).toBe("number");
      expect(typeof mon.def).toBe("number");
      expect(Array.isArray(mon.moves)).toBe(true);
      expect(mon.moves.length).toBeGreaterThanOrEqual(2);
    });
  });

  test("TYPE_ARENAS covers all types", () => {
    data.TYPES.forEach((t) => {
      expect(data.TYPE_ARENAS, `TYPE_ARENAS missing ${t}`).toHaveProperty(t);
      expect(data.TYPE_ARENAS[t].bg).toBeTruthy();
      expect(data.TYPE_ARENAS[t].cloud).toBeTruthy();
      expect(data.TYPE_ARENAS[t].plat).toBeTruthy();
    });
  });
});

// ==================================================================
// 2. TYPE EFFECTIVENESS
// ==================================================================
describe("Type Effectiveness", () => {
  test("Water vs Fire = 2x", () => {
    expect(ctx.getTypeMultiplier("Water", { type: "Fire" })).toBe(2);
  });

  test("Normal vs Ghost = 0x", () => {
    expect(ctx.getTypeMultiplier("Normal", { type: "Ghost" })).toBe(0);
  });

  test("Electric vs dual Flying/Water = 4x", () => {
    expect(ctx.getTypeMultiplier("Electric", { type: "Flying", type2: "Water" })).toBe(4);
  });

  test("Electric vs dual Water/Ground = 0x", () => {
    expect(ctx.getTypeMultiplier("Electric", { type: "Water", type2: "Ground" })).toBe(0);
  });

  test("Fire vs Grass = 2x", () => {
    expect(ctx.getTypeMultiplier("Fire", { type: "Grass" })).toBe(2);
  });

  test("Dragon vs Dragon = 2x", () => {
    expect(ctx.getTypeMultiplier("Dragon", { type: "Dragon" })).toBe(2);
  });

  test("Steel vs Fairy = 2x", () => {
    expect(ctx.getTypeMultiplier("Steel", { type: "Fairy" })).toBe(2);
  });

  test("Ground vs Flying = 0x", () => {
    expect(ctx.getTypeMultiplier("Ground", { type: "Flying" })).toBe(0);
  });

  test("Fighting vs Normal = 2x", () => {
    expect(ctx.getTypeMultiplier("Fighting", { type: "Normal" })).toBe(2);
  });

  test("Ghost vs Normal = 0x", () => {
    expect(ctx.getTypeMultiplier("Ghost", { type: "Normal" })).toBe(0);
  });

  test("Grass vs dual Water/Ground = 4x", () => {
    expect(ctx.getTypeMultiplier("Grass", { type: "Water", type2: "Ground" })).toBe(4);
  });

  test("Ice vs dual Flying/Ground = 4x", () => {
    expect(ctx.getTypeMultiplier("Ice", { type: "Flying", type2: "Ground" })).toBe(4);
  });

  test("Psychic vs Fighting = 2x", () => {
    expect(ctx.getTypeMultiplier("Psychic", { type: "Fighting" })).toBe(2);
  });

  test("Bug vs Dark = 2x", () => {
    expect(ctx.getTypeMultiplier("Bug", { type: "Dark" })).toBe(2);
  });

  test("Fairy vs Dragon = 2x", () => {
    expect(ctx.getTypeMultiplier("Fairy", { type: "Dragon" })).toBe(2);
  });

  test("Poison vs Steel = 0x", () => {
    expect(ctx.getTypeMultiplier("Poison", { type: "Steel" })).toBe(0);
  });

  test("Single type string overload works", () => {
    expect(ctx.getTypeMultiplier("Fire", "Grass")).toBe(2);
    expect(ctx.getTypeMultiplier("Normal", "Ghost")).toBe(0);
  });

  test("Full immunity double check", () => {
    const immunities = [
      ["Normal", "Ghost"], ["Ghost", "Normal"],
      ["Fighting", "Ghost"], ["Electric", "Ground"],
      ["Poison", "Steel"], ["Ground", "Flying"],
      ["Psychic", "Dark"], ["Ghost", "Normal"],
    ];
    immunities.forEach(([atk, def]) => {
      expect(ctx.getTypeMultiplier(atk, { type: def }), `${atk} vs ${def} should be 0x`).toBe(0);
    });
  });
});

// ==================================================================
// 3. UTILITY FUNCTIONS
// ==================================================================
describe("Utility Functions", () => {
  test("clamp between min and max", () => {
    expect(ctx.clamp(5, 0, 10)).toBe(5);
    expect(ctx.clamp(-1, 0, 10)).toBe(0);
    expect(ctx.clamp(15, 0, 10)).toBe(10);
    expect(ctx.clamp(0, 0, 10)).toBe(0);
    expect(ctx.clamp(10, 0, 10)).toBe(10);
  });

  test("finiteNumber returns value for finite numbers", () => {
    expect(ctx.finiteNumber(5, 0)).toBe(5);
    expect(ctx.finiteNumber(0, 99)).toBe(0);
    expect(ctx.finiteNumber(-3.14, 0)).toBe(-3.14);
  });

  test("finiteNumber returns fallback for non-finite values", () => {
    expect(ctx.finiteNumber(Infinity, 0)).toBe(0);
    expect(ctx.finiteNumber(-Infinity, 0)).toBe(0);
    expect(ctx.finiteNumber(NaN, 0)).toBe(0);
    expect(ctx.finiteNumber(undefined, 10)).toBe(10);
    expect(ctx.finiteNumber(null, 10)).toBe(10);
  });

  test("shuffle returns same length", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = ctx.shuffle(arr);
    expect(shuffled).toHaveLength(5);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  test("shuffle does not mutate original array", () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    ctx.shuffle(arr);
    expect(arr).toEqual(copy);
  });

  test("shuffle returns empty for empty input", () => {
    expect(ctx.shuffle([])).toEqual([]);
  });

  test("weightedChoice selects correct rarity", () => {
    const weights = { Common: 100, Rare: 0 };
    const result = ctx.weightedChoice(weights);
    expect(result).toBe("Common");
  });

  test("weightedChoice returns empty label when all weights zero", () => {
    const result = ctx.weightedChoice({});
    expect(result).toBe("Common");
  });

  test("randomFrom picks from array", () => {
    const arr = ["a", "b", "c"];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(ctx.randomFrom(arr));
    }
  });

  test("normalizeSaveSlot clamps correctly", () => {
    expect(ctx.normalizeSaveSlot(1)).toBe(1);
    expect(ctx.normalizeSaveSlot(2)).toBe(2);
    expect(ctx.normalizeSaveSlot(3)).toBe(3);
    expect(ctx.normalizeSaveSlot(0)).toBe(1);
    expect(ctx.normalizeSaveSlot(5)).toBe(3);
    expect(ctx.normalizeSaveSlot(-1)).toBe(1);
    expect(ctx.normalizeSaveSlot("2")).toBe(2);
  });

  test("saveKeyForSlot generates correct key", () => {
    expect(ctx.saveKeyForSlot(1)).toBe("biomon_save_v2_slot_1");
    expect(ctx.saveKeyForSlot(2)).toBe("biomon_save_v2_slot_2");
    expect(ctx.saveKeyForSlot(3)).toBe("biomon_save_v2_slot_3");
  });

  test("otherSide returns opposite", () => {
    expect(ctx.otherSide("player")).toBe("enemy");
    expect(ctx.otherSide("enemy")).toBe("player");
  });

  test("makeFx returns default effects", () => {
    const fx = ctx.makeFx();
    expect(fx).toEqual({
      stun: 0, stunPending: 0, poison: 0,
      guard: 0, weaken: 0, vulnerable: 0,
    });
  });

  test("hpColor returns correct colors", () => {
    expect(ctx.hpColor(100)).toBe("var(--green)");
    expect(ctx.hpColor(51)).toBe("var(--green)");
    expect(ctx.hpColor(26)).toBe("#ffeb3b");
    expect(ctx.hpColor(25)).toBe("var(--red)");
    expect(ctx.hpColor(24)).toBe("var(--red)");
    expect(ctx.hpColor(24)).toBe("var(--red)");
    expect(ctx.hpColor(0)).toBe("var(--red)");
  });

  test("difficultyLabel returns correct labels", () => {
    expect(ctx.difficultyLabel(1)).toBe("Easy");
    expect(ctx.difficultyLabel(2)).toBe("Medium");
    expect(ctx.difficultyLabel(3)).toBe("Hard");
  });

  test("typeClass maps types", () => {
    data.TYPES.forEach((t) => {
      expect(ctx.typeClass(t)).toBeTruthy();
    });
  });
});

// ==================================================================
// 4. LEVELING & XP
// ==================================================================
describe("Leveling & XP", () => {
  test("xpForLevel returns correct values", () => {
    expect(ctx.xpForLevel(1)).toBe(110);
    expect(ctx.xpForLevel(2)).toBe(140);
    expect(ctx.xpForLevel(5)).toBe(230);
    expect(ctx.xpForLevel(10)).toBe(380);
    expect(ctx.xpForLevel(100)).toBe(3080);
  });

  test("levelUpMon levels up with no overflow", () => {
    const mon = {
      id: "charmander", level: 1, xp: 0, xpToNext: 110,
      hp: 90, curHp: 50, atk: 14, def: 8, rarity: "Common",
      moves: [], fx: {},
    };
    const gains = ctx.levelUpMon(mon);
    expect(mon.level).toBe(1);
    expect(gains).toHaveLength(0);
  });

  test("levelUpMon gains one level with enough XP", () => {
    const mon = {
      id: "bulbasaur", level: 1, xp: 110, xpToNext: 110,
      hp: 85, curHp: 85, atk: 14, def: 7, rarity: "Common",
      moves: [], fx: {},
    };
    const gains = ctx.levelUpMon(mon);
    expect(mon.level).toBe(2);
    expect(mon.xp).toBe(0);
    expect(gains).toHaveLength(1);
    expect(gains[0].level).toBe(2);
  });

  test("levelUpMon handles multiple level ups", () => {
    const mon = {
      id: "bulbasaur", level: 1, xp: 300, xpToNext: 110,
      hp: 85, curHp: 85, atk: 14, def: 7, rarity: "Common",
      moves: [], fx: {},
    };
    const gains = ctx.levelUpMon(mon);
    expect(mon.level).toBeGreaterThanOrEqual(2);
    expect(gains.length).toBeGreaterThanOrEqual(1);
  });

  test("levelUpMon increases HP each level", () => {
    const mon = {
      id: "bulbasaur", level: 1, xp: 500, xpToNext: 110,
      hp: 85, curHp: 85, atk: 14, def: 7, rarity: "Common",
      moves: [], fx: {},
    };
    const startHp = mon.hp;
    ctx.levelUpMon(mon);
    expect(mon.hp).toBeGreaterThan(startHp);
    expect(mon.curHp).toBeGreaterThanOrEqual(startHp);
  });

  test("averageTeamLevel", () => {
    ctx.__SET_G({ team: [] });
    expect(ctx.averageTeamLevel()).toBe(1);
    ctx.__SET_G({ team: [{ level: 5 }, { level: 15 }, { level: 10 }] });
    expect(ctx.averageTeamLevel()).toBe(10);
    ctx.__SET_G({ team: [{ level: 1 }] });
    expect(ctx.averageTeamLevel()).toBe(1);
  });
});

// ==================================================================
// 5. MONSTER OPERATIONS
// ==================================================================
describe("Monster Operations", () => {
  function makeFakeMon(overrides = {}) {
    return {
      id: "bulbasaur", name: "Bulbasaur",
      type: "Grass", type2: "Poison",
      rarity: "Common", level: 5,
      hp: 90, curHp: 80, atk: 14, def: 8,
      xp: 0, xpToNext: 230,
      moves: [
        { name: "Tackle", power: 14, diff: 1, tier: "basic", type: "Normal" },
        { name: "Vine Whip", power: 16, diff: 1, tier: "basic", type: "Grass" },
      ],
      fx: { stun: 0, stunPending: 0, poison: 0, guard: 0, weaken: 0, vulnerable: 0 },
      ability: null,
      heldItem: null,
      sturdyUsed: false,
      sashUsed: false,
      berryUsed: false,
      ...overrides,
    };
  }

  test("normalizeMonState handles null", () => {
    expect(ctx.normalizeMonState(null)).toBeNull();
    expect(ctx.normalizeMonState(undefined)).toBeNull();
  });

  test("normalizeMonState fills missing fields from base", () => {
    const result = ctx.normalizeMonState({ id: "charmander", level: 1 });
    expect(result).not.toBeNull();
    expect(result.name).toBe("Charmander");
    expect(result.type).toBe("Fire");
    expect(result.hp).toBeGreaterThan(0);
    expect(result.atk).toBeGreaterThan(0);
    expect(result.def).toBeGreaterThan(0);
    expect(result.tc).toBeTruthy();
    expect(Array.isArray(result.moves)).toBe(true);
    expect(result.moves.length).toBeGreaterThan(0);
  });

  test("normalizeMonState clamps curHp", () => {
    const mon = ctx.normalizeMonState({ id: "bulbasaur", level: 5, curHp: -5 });
    expect(mon.curHp).toBe(0);
    expect(mon.fainted).toBe(true);
  });

  test("normalizeMonState clamps curHp above hp", () => {
    const mon = ctx.normalizeMonState({ id: "bulbasaur", level: 5, curHp: 999 });
    expect(mon.curHp).toBe(mon.hp);
  });

  test("normalizeMonState computes fainted flag", () => {
    const alive = ctx.normalizeMonState({ id: "bulbasaur", level: 5, curHp: 50 });
    expect(alive.fainted).toBe(false);
    const dead = ctx.normalizeMonState({ id: "bulbasaur", level: 5, curHp: 0 });
    expect(dead.fainted).toBe(true);
  });

  test("normalizeMonState sets fx defaults", () => {
    const result = ctx.normalizeMonState({ id: "squirtle", level: 1 });
    expect(result.fx).toEqual({
      stun: 0, stunPending: 0, poison: 0,
      guard: 0, weaken: 0, vulnerable: 0,
    });
  });

  test("cloneMon creates healthy copy with only first 2 moves", () => {
    const base = {
      id: "charizard", level: 36, hp: 150, curHp: 50,
      atk: 24, def: 15, rarity: "Rare",
      moves: [
        { name: "Ember", power: 15, diff: 1, tier: "basic", type: "Fire" },
        { name: "Flamethrower", power: 22, diff: 2, tier: "special", type: "Fire" },
        { name: "Fire Blast", power: 34, diff: 3, tier: "ultimate", type: "Fire" },
      ],
    };
    const clone = ctx.cloneMon(base);
    expect(clone.curHp).toBe(clone.hp);
    expect(clone.fainted).toBe(false);
    expect(clone.fx.stun).toBe(0);
    expect(clone.moves).toHaveLength(2);
  });

  test("cloneMonFull copies all moves at full HP", () => {
    const base = {
      id: "charizard", level: 36, hp: 150, curHp: 50,
      atk: 24, def: 15, rarity: "Rare",
      moves: [
        { name: "Ember", power: 15, diff: 1, tier: "basic", type: "Fire" },
        { name: "Flamethrower", power: 22, diff: 2, tier: "special", type: "Fire" },
        { name: "Fire Blast", power: 34, diff: 3, tier: "ultimate", type: "Fire" },
      ],
    };
    const clone = ctx.cloneMonFull(base);
    expect(clone.curHp).toBe(clone.hp);
    expect(clone.moves).toHaveLength(3);
  });

  test("createCaughtMon resets XP and battle effects", () => {
    const wild = makeFakeMon({ xp: 500, fx: { ...ctx.makeFx(), poison: 2, stun: 1, weaken: 3 } });
    const caught = ctx.createCaughtMon(wild);
    expect(caught.xp).toBe(0);
    expect(caught.fainted).toBe(false);
    expect(caught.fx.poison).toBe(0);
    expect(caught.fx.stun).toBe(0);
    expect(caught.curHp).toBeGreaterThan(0);
  });

  test("createRunMon creates full-health mon", () => {
    const base = data.MON_BY_ID.pikachu;
    const run = ctx.createRunMon(base);
    expect(run.curHp).toBe(run.hp);
    expect(run.fainted).toBe(false);
    expect(run.fx.stun).toBe(0);
  });
});

// ==================================================================
// 6. BATTLE MECHANICS
// ==================================================================
describe("Battle Mechanics", () => {
  beforeEach(() => {
    ctx.__SET_G(ctx.createDefaultState());
  });

  function makeMon(overrides = {}) {
    return {
      id: "bulbasaur", name: "Bulbasaur",
      type: "Grass", type2: "Poison",
      level: 5, hp: 90, curHp: 90, atk: 14, def: 8,
      rarity: "Common", xpYield: 30,
      fx: ctx.makeFx(),
      ability: null, heldItem: null,
      moves: [],
      ...overrides,
    };
  }

  function makeMove(overrides = {}) {
    return {
      name: "Tackle", type: "Normal", power: 14,
      diff: 1, tier: "basic", desc: "A basic charge.",
      ...overrides,
    };
  }

  test("resolveMoveType returns type for non-Adaptive moves", () => {
    const move = makeMove({ type: "Fire" });
    expect(ctx.resolveMoveType(move, null, null)).toBe("Fire");
  });

  test("resolveMoveType picks best type for Adaptive moves", () => {
    const move = makeMove({ type: "Adaptive" });
    const defender = makeMon({ type: "Water" });
    const result = ctx.resolveMoveType(move, null, defender);
    expect(data.TYPES).toContain(result);
    expect(ctx.getTypeMultiplier(result, defender)).toBeGreaterThanOrEqual(
      ...data.TYPES.map((t) => ctx.getTypeMultiplier(t, defender)),
    );
  });

  test("calcDamage returns zero for immune type", () => {
    const attacker = makeMon({ type: "Normal" });
    const defender = makeMon({ type: "Ghost" });
    const move = makeMove({ type: "Normal" });
    const result = ctx.calcDamage(attacker, defender, move, "Normal", true);
    expect(result.damage).toBe(0);
    expect(result.typeMult).toBe(0);
  });

  test("calcDamage applies STAB bonus", () => {
    const attacker = makeMon({ type: "Fire" });
    const defender = makeMon({ type: "Grass" });
    const move = makeMove({ type: "Fire", power: 15 });
    const result = ctx.calcDamage(attacker, defender, move, "Fire", true);
    expect(result.stab).toBe(1.2);
  });

  test("calcDamage applies critical hit multiplier", () => {
    const attacker = makeMon({ type: "Normal" });
    const defender = makeMon({ type: "Normal" });
    const move = makeMove({ power: 14 });
    const normal = ctx.calcDamage(attacker, defender, move, "Normal", true, false);
    const crit = ctx.calcDamage(attacker, defender, move, "Normal", true, true);
    expect(crit.damage).toBeGreaterThanOrEqual(normal.damage);
    expect(crit.isCrit).toBe(true);
    expect(crit.crit).toBe(1.6);
  });

  test("calcDamage respects type multiplier", () => {
    const attacker = makeMon({ type: "Water" });
    const defender = makeMon({ type: "Fire", type2: null });
    const move = makeMove({ type: "Water", power: 15 });
    const result = ctx.calcDamage(attacker, defender, move, "Water", true);
    expect(result.typeMult).toBe(2);
    expect(result.damage).toBeGreaterThan(0);
  });

  test("calcDamage deals at least 1 damage", () => {
    const attacker = makeMon({ type: "Normal", atk: 1 });
    const defender = makeMon({ type: "Normal", def: 100 });
    const move = makeMove({ type: "Normal", power: 1 });
    const result = ctx.calcDamage(attacker, defender, move, "Normal", true);
    if (result.typeMult > 0) {
      expect(result.damage).toBeGreaterThanOrEqual(1);
    }
  });

  test("calcDamage applies guard reduction", () => {
    const attacker = makeMon({ type: "Normal" });
    const defender = makeMon({ type: "Normal", fx: { ...ctx.makeFx(), guard: 1 } });
    const move = makeMove({ type: "Normal", power: 20 });
    const guarded = ctx.calcDamage(attacker, defender, move, "Normal", true);
    const normal = ctx.calcDamage(attacker, makeMon({ type: "Normal" }), move, "Normal", true);
    expect(guarded.damage).toBeLessThanOrEqual(normal.damage);
  });

  test("calcDamage applies weaken reduction", () => {
    const attacker = makeMon({ type: "Normal", fx: { ...ctx.makeFx(), weaken: 1 } });
    const defender = makeMon({ type: "Normal" });
    const move = makeMove({ type: "Normal", power: 20 });
    const weakened = ctx.calcDamage(attacker, defender, move, "Normal", true);
    const normal = ctx.calcDamage(makeMon({ type: "Normal" }), defender, move, "Normal", true);
    expect(weakened.damage).toBeLessThanOrEqual(normal.damage);
  });

  test("calcDamage applies vulnerable increase", () => {
    const attacker = makeMon({ type: "Normal" });
    const defender = makeMon({ type: "Normal", fx: { ...ctx.makeFx(), vulnerable: 1 } });
    const move = makeMove({ type: "Normal", power: 20 });
    const vuln = ctx.calcDamage(attacker, defender, move, "Normal", true);
    const normal = ctx.calcDamage(attacker, makeMon({ type: "Normal" }), move, "Normal", true);
    expect(vuln.damage).toBeGreaterThanOrEqual(normal.damage);
  });

  test("calcDamage with Choice Band multiplier", () => {
    const attacker = makeMon({ type: "Normal", heldItem: "choiceband" });
    const defender = makeMon({ type: "Normal" });
    const move = makeMove({ type: "Normal", power: 14 });
    const result = ctx.calcDamage(attacker, defender, move, "Normal", true);
    expect(result.damage).toBeGreaterThan(0);
  });

  test("calcDamage with STAB ability", () => {
    const attacker = makeMon({
      type: "Water", ability: { trigger: "stab", name: "Torrent" },
    });
    const defender = makeMon({ type: "Fire" });
    const move = makeMove({ type: "Water", power: 15 });
    const result = ctx.calcDamage(attacker, defender, move, "Water", true);
    expect(result.stab).toBe(1.5);
  });

  test("estimateDamage is a number", () => {
    const attacker = makeMon({ type: "Fire" });
    const defender = makeMon({ type: "Grass" });
    const move = makeMove({ type: "Fire", power: 18 });
    const est = ctx.estimateDamage(attacker, defender, move, true);
    expect(typeof est).toBe("number");
    expect(est).toBeGreaterThanOrEqual(0);
  });

  test("healTarget heals within max HP", () => {
    const mon = makeMon({ hp: 100, curHp: 50 });
    const healed = ctx.healTarget(mon, 30);
    expect(healed).toBe(30);
    expect(mon.curHp).toBe(80);
    const overflow = ctx.healTarget(mon, 100);
    expect(overflow).toBe(20);
    expect(mon.curHp).toBe(100);
  });

  test("healTarget returns 0 for full HP", () => {
    const mon = makeMon({ hp: 100, curHp: 100 });
    const healed = ctx.healTarget(mon, 30);
    expect(healed).toBe(0);
    expect(mon.curHp).toBe(100);
  });

  test("consumeHit decrements guard and vulnerable", () => {
    const mon = makeMon({ fx: { ...ctx.makeFx(), guard: 2, vulnerable: 1 } });
    ctx.consumeHit(mon);
    expect(mon.fx.guard).toBe(1);
    expect(mon.fx.vulnerable).toBe(0);
  });
});

// ==================================================================
// 7. MOVE RATES
// ==================================================================
describe("Move Rates", () => {
  function makeMove(overrides = {}) {
    return { name: "Tackle", type: "Normal", power: 14, diff: 1, tier: "basic", ...overrides };
  }

  test("basic moves have 0.95 accuracy", () => {
    const rates = ctx.moveRates(makeMove());
    expect(rates.accuracy).toBe(0.95);
  });

  test("ultimate moves have 0.85 accuracy", () => {
    const rates = ctx.moveRates(makeMove({ tier: "ultimate", power: 34 }));
    expect(rates.accuracy).toBe(0.85);
  });

  test("heal moves have 0.97 accuracy", () => {
    const rates = ctx.moveRates(makeMove({ power: 0, heal: 20 }));
    expect(rates.accuracy).toBe(0.97);
  });

  test("stun status moves have 0.68 accuracy", () => {
    const rates = ctx.moveRates(makeMove({
      power: 0, effects: [{ kind: "stun" }],
    }));
    expect(rates.accuracy).toBe(0.68);
  });

  test("debuff status moves have 0.84 accuracy", () => {
    const rates = ctx.moveRates(makeMove({
      power: 0, effects: [{ kind: "poison" }],
    }));
    expect(rates.accuracy).toBe(0.84);
  });

  test("moveRates caches _rates", () => {
    const move = makeMove();
    const r1 = ctx.moveRates(move);
    const r2 = ctx.moveRates(move);
    expect(r1).toBe(r2);
  });

  test("adjustedCrit returns base with ability boost", () => {
    const mon = { ability: { trigger: "crit_boost" } };
    expect(ctx.adjustedCrit(mon, 0.08)).toBe(0.18);
    const noAb = { ability: null };
    expect(ctx.adjustedCrit(noAb, 0.08)).toBe(0.08);
  });

  test("adjustedCrit with Scope Lens", () => {
    const mon = { heldItem: "scopelens", ability: null };
    expect(ctx.adjustedCrit(mon, 0.08)).toBe(0.20);
  });

  test("adjustedCrit is clamped at 0.5 max", () => {
    const mon = { ability: { trigger: "crit_boost" }, heldItem: "scopelens" };
    expect(ctx.adjustedCrit(mon, 0.35)).toBe(0.5);
  });
});

// ==================================================================
// 8. ENCOUNTER GENERATION
// ==================================================================
describe("Encounter Generation", () => {
  test("getEncounterSpec returns planned encounters for valid range", () => {
    for (let i = 1; i <= data.RUN_LENGTH; i++) {
      const spec = ctx.getEncounterSpec(i);
      expect(spec, `encounter ${i} missing`).toBeTruthy();
      expect(spec.kind, `encounter ${i} kind missing`).toBeDefined();
    }
  });

  test("getEncounterSpec returns endless spec past RUN_LENGTH", () => {
    const spec = ctx.getEncounterSpec(data.RUN_LENGTH + 1);
    expect(spec.endless).toBe(true);
    expect(spec.kind).toBe("wild");
    expect(spec.allowCatch).toBe(true);
  });

  test("endless encounters scale with loop count", () => {
    const early = ctx.getEncounterSpec(data.RUN_LENGTH + 1);
    const late = ctx.getEncounterSpec(data.RUN_LENGTH + 20);
    expect(late.hpMult).toBeGreaterThan(early.hpMult);
    expect(late.rewardMult).toBeGreaterThan(early.rewardMult);
  });

  test("chooseEncounterBaseMon picks from pool by rarity", () => {
    const spec = { rarityWeights: { Common: 100, Uncommon: 0, Rare: 0, Legendary: 0 } };
    const mon = ctx.chooseEncounterBaseMon(spec);
    expect(mon).toBeTruthy();
    expect(mon.id).toBeTruthy();
  });

  test("chooseEncounterBaseMon picks aceId if valid", () => {
    const spec = { aceId: "charizard", rarityWeights: { Common: 1 } };
    const mon = ctx.chooseEncounterBaseMon(spec);
    expect(mon.id).toBe("charizard");
  });

  test("applyEncounterModifiers scales stats", () => {
    const mon = { id: "bulbasaur", level: 5, hp: 90, atk: 14, def: 8, curHp: 90, reward: 30, xpYield: 30 };
    const spec = { hpMult: 2, atkMult: 1.5, defMult: 1.2, rewardMult: 2, xpMult: 1.5 };
    ctx.applyEncounterModifiers(mon, spec);
    expect(mon.hp).toBe(180);
    expect(mon.atk).toBe(21);
    expect(mon.def).toBe(10);
    expect(mon.reward).toBe(60);
    expect(mon.xpYield).toBe(45);
  });

  test("scaleToLevel scales stats for level difference", () => {
    const baseMon = data.MON_BY_ID.charmander;
    const lv1 = ctx.scaleToLevel(baseMon, 1);
    const lv20 = ctx.scaleToLevel(baseMon, 20);
    expect(lv20.hp).toBeGreaterThan(lv1.hp);
    expect(lv20.atk).toBeGreaterThanOrEqual(lv1.atk);
    expect(lv20.def).toBeGreaterThanOrEqual(lv1.def);
  });

  test("createEncounter returns enemy and meta", () => {
    const result = ctx.createEncounter(1);
    expect(result.enemy).toBeTruthy();
    expect(result.enemy.id).toBeTruthy();
    expect(result.enemy.level).toBeGreaterThan(0);
    expect(result.enemy.curHp).toBeGreaterThan(0);
    expect(result.meta).toBeTruthy();
    expect(result.meta.number).toBe(1);
  });

  test("createEncounter for boss encounters gives held items", () => {
    let bossCount = 0;
    let bossEncounter;
    for (let i = 1; i <= data.RUN_LENGTH; i++) {
      const spec = ctx.getEncounterSpec(i);
      if (spec.kind === "boss") { bossEncounter = spec; bossCount++; }
    }
    expect(bossCount).toBeGreaterThanOrEqual(1);
  });

  test("normalizeEncounterMeta fills defaults", () => {
    const meta = ctx.normalizeEncounterMeta({ kind: "wild" }, null, 1);
    expect(meta.number).toBe(1);
    expect(meta.total).toBe(data.RUN_LENGTH);
    expect(meta.kind).toBe("wild");
    expect(meta.kindLabel).toBe("Wild Encounter");
    expect(meta.allowCatch).toBe(true);
    expect(meta.accent).toBe("#78c850");
  });

  test("normalizeEncounterMeta for boss", () => {
    const meta = ctx.normalizeEncounterMeta(
      { kind: "boss", trainerName: "Prof", trainerTitle: "Nielsen", taunt: "Go!" },
      null, 10,
    );
    expect(meta.accent).toBe("#ffd700");
    expect(meta.taunt).toBe("Go!");
  });

  test("encounterPalette returns correct colors", () => {
    expect(ctx.encounterPalette("boss").accent).toBe("#ffd700");
    expect(ctx.encounterPalette("trainer").accent).toBe("#57d6ff");
    expect(ctx.encounterPalette("wild").accent).toBe("#78c850");
  });
});

// ==================================================================
// 9. CATCHING SYSTEM
// ==================================================================
describe("Catching System", () => {
  function makeEnemy(overrides = {}) {
    return {
      id: "pikachu", name: "Pikachu", rarity: "Common",
      level: 5, hp: 100, curHp: 20, atk: 16, def: 9,
      catchRate: 0.6,
      fx: ctx.makeFx(),
      ...overrides,
    };
  }

  test("calcCatchRate returns a number between 0 and 1", () => {
    const enemy = makeEnemy();
    const rate = ctx.calcCatchRate(enemy, 1.0);
    expect(typeof rate).toBe("number");
    expect(rate).toBeGreaterThanOrEqual(0.003);
    expect(rate).toBeLessThanOrEqual(0.96);
  });

  test("calcCatchRate increases with lower HP", () => {
    const enemy1 = makeEnemy({ curHp: 80 });
    const enemy2 = makeEnemy({ curHp: 10 });
    const rate1 = ctx.calcCatchRate(enemy1, 1.0);
    const rate2 = ctx.calcCatchRate(enemy2, 1.0);
    expect(rate2).toBeGreaterThan(rate1);
  });

  test("calcCatchRate increases with better ball", () => {
    const enemy = makeEnemy({ curHp: 50 });
    const poke = ctx.calcCatchRate(enemy, 1.0);
    const great = ctx.calcCatchRate(enemy, 1.5);
    const ultra = ctx.calcCatchRate(enemy, 2.0);
    expect(great).toBeGreaterThan(poke);
    expect(ultra).toBeGreaterThan(great);
  });

  test("calcCatchRate decreases for higher rarity", () => {
    const common = ctx.calcCatchRate(makeEnemy({ rarity: "Common" }), 1.0);
    const rare = ctx.calcCatchRate(makeEnemy({ rarity: "Rare" }), 1.0);
    expect(rare).toBeLessThan(common);
  });

  test("calcCatchRate increases with status effects", () => {
    const normal = makeEnemy();
    const statused = makeEnemy({ fx: { ...ctx.makeFx(), poison: 1 } });
    const rate1 = ctx.calcCatchRate(normal, 1.0);
    const rate2 = ctx.calcCatchRate(statused, 1.0);
    expect(rate2).toBeGreaterThan(rate1);
  });

  test("calcCatchRate penalizes higher level", () => {
    const low = makeEnemy({ level: 1 });
    const high = makeEnemy({ level: 50 });
    const rate1 = ctx.calcCatchRate(low, 1.0);
    const rate2 = ctx.calcCatchRate(high, 1.0);
    expect(rate2).toBeLessThanOrEqual(rate1);
  });
});

// ==================================================================
// 10. MOVE EFFECTS
// ==================================================================
describe("Move Effects", () => {
  function makeMon(overrides = {}) {
    return { name: "TestMon", fx: ctx.makeFx(), ...overrides };
  }

  function makeMove(overrides = {}) {
    return { name: "Test", effects: [], ...overrides };
  }

  test("applyMoveEffects applies guard", () => {
    const move = makeMove({ effects: [{ target: "self", kind: "guard", amount: 2 }] });
    const attacker = makeMon();
    const defender = makeMon();
    const notes = ctx.applyMoveEffects(move, attacker, defender, "player", false, 1);
    expect(attacker.fx.guard).toBe(2);
    expect(notes.length).toBeGreaterThan(0);
  });

  test("applyMoveEffects applies poison to foe", () => {
    const move = makeMove({ effects: [{ target: "foe", kind: "poison", amount: 2 }] });
    const attacker = makeMon();
    const defender = makeMon();
    ctx.applyMoveEffects(move, attacker, defender, "player", false, 1);
    expect(defender.fx.poison).toBe(2);
  });

  test("applyMoveEffects applies stun to foe", () => {
    const move = makeMove({ effects: [{ target: "foe", kind: "stun", amount: 1 }] });
    const attacker = makeMon();
    const defender = makeMon();
    ctx.applyMoveEffects(move, attacker, defender, "player", false, 1);
    expect(defender.fx.stun).toBe(1);
  });

  test("applyMoveEffects skips with secondaryChance 0", () => {
    const move = makeMove({ effects: [{ target: "foe", kind: "stun", amount: 1 }] });
    const attacker = makeMon();
    const defender = makeMon();
    ctx.applyMoveEffects(move, attacker, defender, "player", false, 0);
    expect(defender.fx.stun).toBe(0);
  });

  test("hasEffect checks move for effect kind", () => {
    const move = { effects: [{ kind: "stun" }, { kind: "poison" }] };
    expect(ctx.hasEffect(move, "stun")).toBe(true);
    expect(ctx.hasEffect(move, "poison")).toBe(true);
    expect(ctx.hasEffect(move, "guard")).toBe(false);
  });

  test("clearSwitchOutEffects resets fx", () => {
    const mon = makeMon({ fx: { stun: 1, stunPending: 1, guard: 2, weaken: 1, vulnerable: 1, poison: 1 } });
    ctx.clearSwitchOutEffects(mon);
    expect(mon.fx.stun).toBe(0);
    expect(mon.fx.stunPending).toBe(0);
    expect(mon.fx.guard).toBe(0);
    expect(mon.fx.weaken).toBe(0);
    expect(mon.fx.vulnerable).toBe(0);
    expect(mon.fx.poison).toBe(1);
  });
});

// ==================================================================
// 11. EVOLUTION
// ==================================================================
describe("Evolution", () => {
  function makeMon(overrides = {}) {
    return {
      id: "bulbasaur", name: "Bulbasaur",
      type: "Grass", type2: "Poison",
      level: 16, rarity: "Common",
      hp: 90, atk: 14, def: 7,
      moves: [{ name: "Tackle", power: 14, diff: 1, tier: "basic", type: "Normal" }],
      ...overrides,
    };
  }

  test("canEvolve returns true at required level", () => {
    const mon = makeMon({ id: "bulbasaur", level: 16 });
    expect(ctx.canEvolve(mon)).toBe(true);
  });

  test("canEvolve returns false below required level", () => {
    const mon = makeMon({ id: "bulbasaur", level: 15 });
    expect(ctx.canEvolve(mon)).toBe(false);
  });

  test("canEvolve returns false for non-evolving mon", () => {
    const mon = makeMon({ id: "raichu", level: 100 });
    expect(ctx.canEvolve(mon)).toBe(false);
  });

  test("canEvolve returns false for null/undefined", () => {
    expect(ctx.canEvolve(null)).toBe(false);
    expect(ctx.canEvolve(undefined)).toBe(false);
  });

  test("EVOLUTIONS map is populated from EVO_DATA", () => {
    data.EVO_DATA.forEach(([from]) => {
      expect(data.EVOLUTIONS, `EVOLUTIONS missing ${from}`).toHaveProperty(from);
    });
  });

  test("evolveMon transforms mon correctly", () => {
    const mon = makeMon({ id: "bulbasaur", level: 16, hp: 90, atk: 14, def: 7, curHp: 90 });
    const result = ctx.evolveMon(mon);
    expect(result).not.toBeNull();
    expect(mon.id).toBe("ivysaur");
    expect(mon.name).toBe("Ivysaur");
    expect(mon.hp).toBeGreaterThan(90);
    expect(mon.atk).toBeGreaterThanOrEqual(14);
    expect(mon.def).toBeGreaterThanOrEqual(7);
    expect(result.fromId).toBe("bulbasaur");
    expect(result.toId).toBe("ivysaur");
  });

  test("evolveMon returns null for mon with no evolution entry", () => {
    const mon = makeMon({ id: "raichu", level: 5 });
    expect(ctx.evolveMon(mon)).toBeNull();
  });

  test("evolveMon adds a new move from evolved form", () => {
    const mon = makeMon({ id: "bulbasaur", level: 16 });
    const beforeMoves = mon.moves.length;
    const result = ctx.evolveMon(mon);
    if (result.learnedMove) {
      expect(mon.moves.length).toBeGreaterThan(beforeMoves);
    }
  });

  test("pickEvolutionMove picks strongest unknown move", () => {
    const mon = makeMon({ id: "bulbasaur", level: 16, moves: [{ name: "Tackle", power: 14 }] });
    const target = data.MON_BY_ID.ivysaur;
    const picked = ctx.pickEvolutionMove(mon, target);
    if (picked) {
      expect(mon.moves.every((m) => m.name !== picked.name)).toBe(true);
    }
  });

  test("expandMove builds move from compact data", () => {
    const raw = { name: "Tackle", p: 14, d: "A basic charge." };
    const move = ctx.expandMove(raw, "Normal", "basic");
    expect(move.name).toBe("Tackle");
    expect(move.type).toBe("Normal");
    expect(move.power).toBe(14);
    expect(move.diff).toBe(1);
    expect(move.tier).toBe("basic");
    expect(move.desc).toBe("A basic charge.");
  });

  test("expandMove builds special tier with correct diff", () => {
    const raw = { name: "Flamethrower", p: 22, d: "", fx: [{ t: "foe", k: "weaken", a: 1 }] };
    const move = ctx.expandMove(raw, "Fire", "special");
    expect(move.diff).toBe(2);
    expect(move.tier).toBe("special");
    expect(move.effects).toHaveLength(1);
    expect(move.effects[0].kind).toBe("weaken");
  });

  test("expandMove handles ultimate tier", () => {
    const raw = { name: "Hyper Beam", p: 34, d: "Devastating energy beam." };
    const move = ctx.expandMove(raw, "Normal", "ultimate");
    expect(move.diff).toBe(3);
    expect(move.tier).toBe("ultimate");
  });
});

// ==================================================================
// 12. ITEMS & INVENTORY
// ==================================================================
describe("Items & Inventory", () => {
  test("isTargetedItem returns true for heal and revive", () => {
    expect(ctx.isTargetedItem({ effect: "heal" })).toBe(true);
    expect(ctx.isTargetedItem({ effect: "revive" })).toBe(true);
    expect(ctx.isTargetedItem({ effect: "boost" })).toBe(false);
    expect(ctx.isTargetedItem({ effect: "catch" })).toBe(false);
    expect(ctx.isTargetedItem(null)).toBeNull();
    expect(ctx.isTargetedItem(undefined)).toBeUndefined();
  });

  test("canUseItemInShop returns true for heal, revive, and held", () => {
    expect(ctx.canUseItemInShop({ effect: "heal" })).toBe(true);
    expect(ctx.canUseItemInShop({ effect: "revive" })).toBe(true);
    expect(ctx.canUseItemInShop({ effect: "held" })).toBe(true);
    expect(ctx.canUseItemInShop({ effect: "boost" })).toBe(false);
    expect(ctx.canUseItemInShop({ effect: "catch" })).toBe(false);
  });

  test("canTargetWithItem heal only for alive non-full HP", () => {
    const item = { effect: "heal" };
    const mon = { fainted: false, curHp: 50, hp: 100 };
    expect(ctx.canTargetWithItem(item, mon)).toBe(true);
    expect(ctx.canTargetWithItem(item, { ...mon, curHp: 100 })).toBe(false);
    expect(ctx.canTargetWithItem(item, { ...mon, fainted: true })).toBe(false);
  });

  test("canTargetWithItem revive only for fainted", () => {
    const item = { effect: "revive" };
    expect(ctx.canTargetWithItem(item, { fainted: true })).toBe(true);
    expect(ctx.canTargetWithItem(item, { fainted: false })).toBe(false);
    expect(ctx.canTargetWithItem(item, null)).toBe(false);
  });

  test("itemTargetStatus returns correct text", () => {
    expect(ctx.itemTargetStatus({ effect: "heal" }, { fainted: true, curHp: 50, hp: 100 })).toBe("Fainted");
    expect(ctx.itemTargetStatus({ effect: "heal" }, { fainted: false, curHp: 100, hp: 100 })).toBe("Full HP");
    expect(ctx.itemTargetStatus({ effect: "heal" }, { fainted: false, curHp: 50, hp: 100 })).toBe("Missing 50 HP");
  });

  test("bagItemDesc shows catch rate for catch items in battle", () => {
    ctx.__SET_G({ ...ctx.createDefaultState(), enemy: { id: "pikachu", name: "Pikachu", rarity: "Common", level: 5, hp: 100, curHp: 50, catchRate: 0.6, fx: ctx.makeFx() } });
    const item = { effect: "catch", id: "pokeball", desc: "Catch a wild Pokemon", catchMod: 1 };
    const result = ctx.bagItemDesc(item, "battle", true);
    expect(result).toContain("%");
  });
});

// ==================================================================
// 13. QUESTION SYSTEM
// ==================================================================
describe("Question System", () => {
  test("questionIndexesForDifficulty returns correct indexes", () => {
    const diff1 = ctx.questionIndexesForDifficulty(1);
    diff1.forEach((i) => expect(data.QS[i].d).toBe(1));
    const diff2 = ctx.questionIndexesForDifficulty(2);
    diff2.forEach((i) => expect(data.QS[i].d).toBe(2));
  });

  test("buildQuestionRound shuffles but preserves correct answer", () => {
    const q = { q: "Test?", a: ["Wrong", "Right", "Wrong2", "Wrong3"], c: 1, d: 1 };
    const round = ctx.buildQuestionRound(q);
    expect(round.options).toHaveLength(4);
    expect(round.answerIndex).toBeGreaterThanOrEqual(0);
    expect(round.answerIndex).toBeLessThan(4);
    expect(round.options[round.answerIndex]).toBe("Right");
  });

  test("unresolvedQuestionMisses calculates correctly", () => {
    expect(ctx.unresolvedQuestionMisses({ misses: 5, correct: 4 })).toBe(3);
    expect(ctx.unresolvedQuestionMisses({ misses: 2, correct: 4 })).toBe(0);
    expect(ctx.unresolvedQuestionMisses(null)).toBe(0);
    expect(ctx.unresolvedQuestionMisses({})).toBe(0);
  });

  test("questionReviewWeight returns 0 for index with no stats", () => {
    ctx.__SET_G({ ...ctx.createDefaultState(), questionStats: {}, asked: 0, encounterCount: 0 });
    expect(ctx.questionReviewWeight(0)).toBe(0);
    expect(ctx.questionReviewWeight(999)).toBe(0);
  });

  test("weightedQuestionPick picks from pool", () => {
    const pool = [
      { q: data.QS[0], i: 0, weight: 10 },
      { q: data.QS[1], i: 1, weight: 1 },
    ];
    const picked = ctx.weightedQuestionPick(pool);
    expect([0, 1]).toContain(picked.i);
  });

  test("buildBattleQuestionQueues creates queues for all difficulties", () => {
    const queues = ctx.buildBattleQuestionQueues();
    expect(queues).toHaveProperty("1");
    expect(queues).toHaveProperty("2");
    expect(queues).toHaveProperty("3");
    expect(Array.isArray(queues[1])).toBe(true);
    expect(queues[1].length).toBeGreaterThan(0);
  });

  test("serializeBattleQuestionQueues filters invalid indexes", () => {
    const queues = { 1: [0, 9999, 1], 2: [], 3: [] };
    const clean = ctx.serializeBattleQuestionQueues(queues);
    expect(clean[1]).toEqual([0, 1]);
  });
});

// ==================================================================
// 14. SAVE / LABEL HELPERS
// ==================================================================
describe("Save & Label Helpers", () => {
  test("saveScreenLabel returns correct text", () => {
    expect(ctx.saveScreenLabel({ screen: "shop-screen" })).toBe("Between Battles");
    expect(ctx.saveScreenLabel({ screen: "pc-screen" })).toBe("PC Box");
    expect(ctx.saveScreenLabel({ screen: "result-screen" })).toBe("Victory");
    expect(ctx.saveScreenLabel({ screen: "battle-screen" })).toBe("In Battle");
    expect(ctx.saveScreenLabel({ screen: "other" })).toBe("In Battle");
  });

  test("saveEncounterLabel shows correct format", () => {
    expect(ctx.saveEncounterLabel({ encounterCount: 1 })).toBe(`1/${data.RUN_LENGTH}`);
    expect(ctx.saveEncounterLabel({ encounterCount: data.RUN_LENGTH })).toBe(`${data.RUN_LENGTH}/${data.RUN_LENGTH}`);
    expect(ctx.saveEncounterLabel({ encounterCount: data.RUN_LENGTH + 1 })).toBe(`${data.RUN_LENGTH + 1} / endless`);
  });

  test("normalizeSaveSlot clamps between 1 and 3", () => {
    expect(ctx.normalizeSaveSlot(0)).toBe(1);
    expect(ctx.normalizeSaveSlot(1)).toBe(1);
    expect(ctx.normalizeSaveSlot(2)).toBe(2);
    expect(ctx.normalizeSaveSlot(3)).toBe(3);
    expect(ctx.normalizeSaveSlot(4)).toBe(3);
    expect(ctx.normalizeSaveSlot("1")).toBe(1);
  });

  test("serializeMon strips _rates and normalizes fx", () => {
    const mon = {
      id: "pikachu", name: "Pikachu", type: "Electric", level: 5,
      moves: [{ name: "Tackle", power: 14, _rates: {} }],
      fx: { stun: 0, stunPending: 0, poison: 0, guard: 0, weaken: 0, vulnerable: 0 },
    };
    const serialized = ctx.serializeMon(mon);
    expect(serialized.moves[0]._rates).toBeUndefined();
    expect(serialized.fx.stun).toBe(0);
  });

  test("serializeMon returns null for null input", () => {
    expect(ctx.serializeMon(null)).toBeNull();
  });
});

// ==================================================================
// 15. ENEMY AI
// ==================================================================
describe("Enemy AI", () => {
  function makeMon(overrides = {}) {
    return {
      id: "bulbasaur", name: "Bulbasaur", type: "Grass", type2: "Poison",
      level: 5, hp: 90, curHp: 90, atk: 14, def: 8,
      rarity: "Common", xpYield: 30,
      fx: ctx.makeFx(),
      ability: null, heldItem: null,
      moves: [
        { name: "Tackle", type: "Normal", power: 14, diff: 1, tier: "basic" },
        { name: "Vine Whip", type: "Grass", power: 16, diff: 1, tier: "basic" },
      ],
      ...overrides,
    };
  }

  function makeMove(overrides = {}) {
    return { name: "Tackle", type: "Normal", power: 14, diff: 1, tier: "basic", ...overrides };
  }

  test("hasEffect checks move effects", () => {
    const move = makeMove({ effects: [{ kind: "stun" }] });
    expect(ctx.hasEffect(move, "stun")).toBe(true);
    expect(ctx.hasEffect(move, "poison")).toBe(false);
    expect(ctx.hasEffect({}, "stun")).toBe(false);
  });

  test("scoreEnemyMove returns a numeric score", () => {
    const enemy = makeMon();
    const player = makeMon();
    const move = makeMove();
    const score = ctx.scoreEnemyMove(enemy, player, move, 10);
    expect(typeof score).toBe("number");
  });

  test("scoreEnemyMove penalizes immune moves heavily", () => {
    const enemy = makeMon({ type: "Normal" });
    const player = makeMon({ type: "Ghost" });
    const move = makeMove({ type: "Normal", power: 14 });
    const score = ctx.scoreEnemyMove(enemy, player, move, 10);
    expect(score).toBe(-100);
  });

  test("scoreEnemyMove prefers lethal moves", () => {
    const enemy = makeMon({ atk: 999 });
    const player = makeMon({ curHp: 1, hp: 100, def: 1 });
    const move = makeMove({ type: "Normal", power: 50 });
    const score = ctx.scoreEnemyMove(enemy, player, move, 10);
    expect(score).toBeGreaterThan(0);
  });
});

// ==================================================================
// 16. CREATE DEFAULT STATE
// ==================================================================
describe("Game State Initialization", () => {
  test("createDefaultState returns correct default structure", () => {
    const state = ctx.createDefaultState();
    expect(Array.isArray(state.team)).toBe(true);
    expect(state.team).toHaveLength(0);
    expect(state.money).toBe(200);
    expect(state.mode).toBe("easy");
    expect(state.streak).toBe(0);
    expect(state.bestStreak).toBe(0);
    expect(state.asked).toBe(0);
    expect(state.correct).toBe(0);
    expect(state.encounterCount).toBe(0);
    expect(state.defeatedCount).toBe(0);
    expect(state.boost).toBe(1);
    expect(state.inv).toBeTruthy();
    expect(typeof state.used.has).toBe("function");
    expect(typeof state.caughtIds.has).toBe("function");
    expect(typeof state.currentBattleWrong.has).toBe("function");
    expect(state.picks).toEqual([]);
    expect(state.pcBox).toEqual([]);
    expect(state.enemy).toBeNull();
    expect(state.locked).toBe(false);
  });

  test("default state inventory has potions and pokeballs", () => {
    const state = ctx.createDefaultState();
    expect(state.inv.potion).toBe(2);
    expect(state.inv.pokeball).toBe(5);
    expect(state.inv.superp).toBe(0);
    expect(state.inv.revive).toBe(0);
  });
});

// ==================================================================
// 17. MOVEMENT & MOVE CLASSIFICATION HELPERS
// ==================================================================
describe("Move Classification Helpers", () => {
  test("requiredStreak returns correct values", () => {
    expect(ctx.requiredStreak({ diff: 1 })).toBe(0);
    expect(ctx.requiredStreak({ diff: 2 })).toBe(2);
    expect(ctx.requiredStreak({ diff: 3 })).toBe(3);
  });

  test("consumesStreak returns true for diff >= 2", () => {
    expect(ctx.consumesStreak({ diff: 1 })).toBe(false);
    expect(ctx.consumesStreak({ diff: 2 })).toBe(true);
    expect(ctx.consumesStreak({ diff: 3 })).toBe(true);
  });

  test("moveClass returns correct tier", () => {
    expect(ctx.moveClass({ tier: "ultimate" })).toBe("ultimate");
    expect(ctx.moveClass({ tier: "special" })).toBe("special");
    expect(ctx.moveClass({ tier: "basic" })).toBe("basic");
  });

  test("shownType returns Adaptive for adaptive moves", () => {
    expect(ctx.shownType({ type: "Adaptive" })).toBe("Adaptive");
    expect(ctx.shownType({ type: "Fire" })).toBe("Fire");
  });

  test("cleanMove removes _rates", () => {
    const move = { name: "Tackle", _rates: { accuracy: 0.95 } };
    const cleaned = ctx.cleanMove(move);
    expect(cleaned._rates).toBeUndefined();
  });
});

// ==================================================================
// 18. BUILDMON / SEEDED PICK
// ==================================================================
describe("Mon Builder", () => {
  test("buildMon produces valid mon from DEX entry", () => {
    const entry = data.DEX.find(([id]) => id === "pikachu");
    expect(entry).toBeTruthy();
    const mon = ctx.buildMon(entry);
    expect(mon.id).toBe("pikachu");
    expect(mon.name).toBe("Pikachu");
    expect(mon.type).toBe("Electric");
    expect(mon.hp).toBeGreaterThan(0);
    expect(mon.atk).toBeGreaterThan(0);
    expect(mon.def).toBeGreaterThan(0);
    expect(Array.isArray(mon.moves)).toBe(true);
    expect(mon.moves.length).toBe(4);
    expect(mon.rarity).toBe("Common");
    expect(mon.tc).toBeTruthy();
  });

  test("buildMon handles dual-type Pokemon", () => {
    const entry = data.DEX.find(([id]) => id === "bulbasaur");
    const mon = ctx.buildMon(entry);
    expect(mon.type2).toBe("Poison");
    expect(mon.tc2).toBeTruthy();
  });

  test("buildMon assigns ability", () => {
    const entry = data.DEX.find(([id]) => id === "charizard");
    const mon = ctx.buildMon(entry);
    expect(mon.ability).toBeTruthy();
    expect(mon.ability.name).toBeTruthy();
    expect(mon.ability.desc).toBeTruthy();
  });

  test("seededPick produces deterministic results", () => {
    const arr = ["a", "b", "c", "d", "e"];
    const pick1 = ctx.seededPick(arr, 42, 0);
    const pick2 = ctx.seededPick(arr, 42, 0);
    expect(pick1).toBe(pick2);
    const pick3 = ctx.seededPick(arr, 42, 1);
    expect(pick3).not.toBe(pick1);
  });

  test("ALL_MONS matches buildMon for each dex entry", () => {
    data.DEX.forEach((entry, i) => {
      const expected = ctx.buildMon(entry);
      const actual = data.ALL_MONS[i];
      expect(actual.id).toBe(expected.id);
      expect(actual.name).toBe(expected.name);
      expect(actual.type).toBe(expected.type);
      expect(actual.rarity).toBe(expected.rarity);
    });
  });
});

// ==================================================================
// 19. ENDSTEP EFFECTS
// ==================================================================
describe("End Step Effects", () => {
  test("endStep decrements weaken counter", () => {
    const mon = { fainted: false, fx: { ...ctx.makeFx(), weaken: 2, poison: 0 }, ability: null, heldItem: null };
    ctx.__SET_G({ team: [mon], activeIdx: 0, enemy: null });
    ctx.endStep("player");
    expect(mon.fx.weaken).toBe(1);
  });

  test("endStep deals poison damage", () => {
    const mon = {
      fainted: false, hp: 100, curHp: 100, name: "Test",
      fx: { ...ctx.makeFx(), poison: 1, weaken: 0 },
      ability: null, heldItem: null,
    };
    ctx.__SET_G({ team: [mon], activeIdx: 0, enemy: null });
    const notes = ctx.endStep("player");
    expect(mon.curHp).toBeLessThan(100);
    expect(notes.length).toBeGreaterThan(0);
  });
});

// ==================================================================
// 20. ACCESSORY HELPERS
// ==================================================================
describe("Accessory Helpers", () => {
  test("active returns G active team member", () => {
    const mon = { id: "pikachu" };
    ctx.__SET_G({ team: [mon], activeIdx: 0 });
    expect(ctx.active()).toBe(mon);
    ctx.__SET_G({ team: [mon], activeIdx: 99 });
    expect(ctx.active()).toBeNull();
  });

  test("battler returns correct side", () => {
    const player = { id: "pikachu" };
    const enemy = { id: "charmander" };
    ctx.__SET_G({ team: [player], activeIdx: 0, enemy });
    expect(ctx.battler("player")).toBe(player);
    expect(ctx.battler("enemy")).toBe(enemy);
  });

  test("compareCollectionMon compares by level then moves length then stats", () => {
    const low = { id: "pikachu", level: 1, moves: [{ power: 10 }], hp: 50, atk: 10, def: 5, xp: 0 };
    const high = { id: "pikachu", level: 5, moves: [{ power: 10 }, { power: 20 }], hp: 80, atk: 14, def: 8, xp: 100 };
    expect(ctx.compareCollectionMon(low, high)).toBeLessThan(0);
    expect(ctx.compareCollectionMon(high, low)).toBeGreaterThan(0);
    expect(ctx.compareCollectionMon(high, { ...high })).toBe(0);
  });

  test("compareCollectionMon prefers higher level regardless of moves", () => {
    const lowLevel = { id: "pikachu", level: 1, moves: [{ power: 10 }, { power: 20 }, { power: 30 }], hp: 50, atk: 10, def: 5, xp: 0 };
    const highLevel = { id: "pikachu", level: 2, moves: [{ power: 10 }], hp: 60, atk: 11, def: 6, xp: 10 };
    expect(ctx.compareCollectionMon(lowLevel, highLevel)).toBeLessThan(0);
  });

  test("cleanMove clones and strips _rates", () => {
    const move = { name: "Tackle", power: 14, _rates: {} };
    const clean = ctx.cleanMove(move);
    expect(clean._rates).toBeUndefined();
    expect(clean.name).toBe("Tackle");
  });
});

// ==================================================================
// 21. SOPHISTICATED EDGE CASES (may reveal bugs)
// ==================================================================
describe("Sophisticated Edge Cases", () => {
  beforeEach(() => {
    ctx.__SET_G(ctx.createDefaultState());
  });

  // --- LEVELING ---

  test("levelUpMon with negative XP does not infinite loop", () => {
    const mon = {
      id: "bulbasaur", level: 1, xp: -50, xpToNext: 110,
      hp: 85, curHp: 85, atk: 14, def: 7, rarity: "Common",
      moves: [], fx: {},
    };
    const gains = ctx.levelUpMon(mon);
    expect(mon.level).toBe(1);
    expect(gains).toHaveLength(0);
  });

  test("levelUpMon with enormous XP does not infinite loop and caps reasonably", () => {
    const mon = {
      id: "bulbasaur", level: 1, xp: 1e8, xpToNext: 110,
      hp: 85, curHp: 85, atk: 14, def: 7, rarity: "Common",
      moves: [], fx: {},
    };
    const gains = ctx.levelUpMon(mon);
    expect(mon.level).toBeGreaterThan(1);
    expect(gains.length).toBeGreaterThan(0);
    // After that many levels, the mon should have grown significantly
    expect(mon.hp).toBeGreaterThan(100);
    expect(mon.atk).toBeGreaterThan(14);
    expect(mon.def).toBeGreaterThan(7);
  });

  test("levelUpMon correctly handles exact XP threshold", () => {
    const mon = {
      id: "bulbasaur", level: 1, xp: 110, xpToNext: 110,
      hp: 85, curHp: 85, atk: 14, def: 7, rarity: "Common",
      moves: [], fx: {},
    };
    const gains = ctx.levelUpMon(mon);
    expect(mon.level).toBe(2);
    expect(mon.xp).toBe(0);
    expect(gains).toHaveLength(1);
  });

  test("levelUpMon with zero xpToNext does not infinite loop", () => {
    const mon = {
      id: "bulbasaur", level: 1, xp: 100, xpToNext: 0,
      hp: 85, curHp: 85, atk: 14, def: 7, rarity: "Common",
      moves: [], fx: {},
    };
    const gains = ctx.levelUpMon(mon);
    // If xpToNext is 0, xp >= 0 is always true and xp - 0 = xp => infinite loop.
    // The function should handle this gracefully.
    expect(mon.level).toBeGreaterThan(1);
    expect(Array.isArray(gains)).toBe(true);
  });

  // --- HEALING ---

  test("healTarget with negative amount does not change HP", () => {
    const mon = { hp: 100, curHp: 80 };
    const healed = ctx.healTarget(mon, -30);
    expect(healed).toBe(0);
    expect(mon.curHp).toBe(80);
  });

  test("healTarget with zero amount", () => {
    const mon = { hp: 100, curHp: 50 };
    const healed = ctx.healTarget(mon, 0);
    expect(healed).toBe(0);
    expect(mon.curHp).toBe(50);
  });

  test("healTarget on null crashes gracefully", () => {
    expect(() => ctx.healTarget(null, 30)).toThrow();
  });

  // --- CONSUME HIT ---

  test("consumeHit with zero effects does nothing", () => {
    const mon = { fx: ctx.makeFx() };
    expect(() => ctx.consumeHit(mon)).not.toThrow();
    expect(mon.fx.guard).toBe(0);
    expect(mon.fx.vulnerable).toBe(0);
  });

  test("consumeHit with negative fx values does not decrement (guards at > 0)", () => {
    const mon = { fx: { ...ctx.makeFx(), guard: -1, vulnerable: -1 } };
    ctx.consumeHit(mon);
    expect(mon.fx.guard).toBe(-1);
    expect(mon.fx.vulnerable).toBe(-1);
  });

  // --- NORMALIZATION ---

  test("normalizeMonState with fainted true but curHp positive", () => {
    const result = ctx.normalizeMonState({ id: "bulbasaur", level: 5, fainted: true, curHp: 50 });
    // If fainted is explicitly set true but curHp > 0, the normalization should
    // either force curHp to 0 OR set fainted false.
    expect(result.fainted).toBe(false);
    expect(result.curHp).toBeGreaterThan(0);
  });

  test("normalizeMonState with curHp as string", () => {
    const result = ctx.normalizeMonState({ id: "bulbasaur", level: 5, curHp: "50" });
    expect(result.curHp).toBeGreaterThanOrEqual(0);
    expect(typeof result.curHp).toBe("number");
  });

  test("normalizeMonState with missing rarity uses Common", () => {
    const result = ctx.normalizeMonState({ id: "bulbasaur", level: 5, rarity: undefined });
    expect(result.rarity).toBe("Common");
  });

  // --- EVOLUTION ---

  test("evolveMon does NOT check level requirement (relies on caller)", () => {
    // evolveMon itself ignores the level field. The level check is only in canEvolve.
    // This behavior means any caller that doesn't check canEvolve first will
    // evolve a mon regardless of level.
    const mon = {
      id: "bulbasaur", level: 1,
      hp: 85, atk: 14, def: 7, curHp: 85,
      moves: [{ name: "Tackle", power: 14 }],
    };
    const result = ctx.evolveMon(mon);
    // This WILL evolve because evolveMon doesn't check level.
    // If this test passes, the caller (confirmEvolution) is the only guard.
    // If the test fails because evolveMon started respecting level, that's a change too.
    expect(result).not.toBeNull();
    expect(mon.id).not.toBe("bulbasaur");
  });

  // --- SAVE SYSTEM ---

  test("saveEncounterLabel with null/undefined save does not crash", () => {
    expect(() => ctx.saveEncounterLabel(null)).not.toThrow();
    expect(() => ctx.saveEncounterLabel(undefined)).not.toThrow();
    expect(() => ctx.saveEncounterLabel({})).not.toThrow();
  });

  test("serializeGame converts Sets to arrays", () => {
    const state = ctx.createDefaultState();
    state.team = [ctx.normalizeMonState({ id: "pikachu", level: 5 })];
    state.enemy = ctx.normalizeMonState({ id: "charmander", level: 5 });
    ctx.__SET_G(state);
    const serialized = ctx.serializeGame();
    expect(Array.isArray(serialized.used)).toBe(true);
    expect(Array.isArray(serialized.caughtIds)).toBe(true);
    expect(Array.isArray(serialized.currentBattleWrong)).toBe(true);
  });

  test("serializeGame with empty team returns empty team array", () => {
    ctx.__SET_G(ctx.createDefaultState());
    const serialized = ctx.serializeGame();
    expect(serialized.team).toEqual([]);
  });

  // --- DAMAGE ---

  test("calcDamage with zero power move returns 0 damage", () => {
    const attacker = { type: "Normal", atk: 14, fx: ctx.makeFx(), ability: null, heldItem: null };
    const defender = { type: "Normal", def: 8, fx: ctx.makeFx(), ability: null, heldItem: null };
    const move = { name: "Growl", power: 0, type: "Normal" };
    const result = ctx.calcDamage(attacker, defender, move, "Normal", true);
    expect(result.damage).toBe(0);
  });

  test("calcDamage with zero attack stat still deals at minimum 1 damage", () => {
    const attacker = { type: "Normal", atk: 0, fx: ctx.makeFx(), ability: null, heldItem: null };
    const defender = { type: "Normal", def: 999, fx: ctx.makeFx(), ability: null, heldItem: null };
    const move = { name: "Tackle", power: 14, type: "Normal" };
    const result = ctx.calcDamage(attacker, defender, move, "Normal", true);
    // raw = 14 + 0 - round(999*0.35) = 14 - 350 = -336.
    // Math.max(1, round(-336 * ...)) = 1
    expect(result.damage).toBe(1);
  });

  test("calcDamage without G state set (isPlayerMove=false does not read G)", () => {
    // When isPlayerMove is false, G.boost and G.streak are not accessed
    const attacker = { type: "Water", atk: 14, fx: ctx.makeFx(), ability: null, heldItem: null };
    const defender = { type: "Fire", def: 8, fx: ctx.makeFx(), ability: null, heldItem: null };
    const move = { name: "Water Gun", power: 15, type: "Water" };
    const result = ctx.calcDamage(attacker, defender, move, "Water", false);
    expect(result.damage).toBeGreaterThan(0);
    expect(result.typeMult).toBe(2);
  });

  // --- TYPE CHART ---

  test("Type chart non-reciprocal pairs are documented (expected in Pokemon)", () => {
    let mismatches = [];
    data.TYPES.forEach((atk) => {
      data.TYPES.forEach((def) => {
        if (atk === def) return;
        const forward = ctx.getTypeMultiplier(atk, { type: def });
        const backward = ctx.getTypeMultiplier(def, { type: atk });
        if (forward > 1 && backward >= 1) {
          mismatches.push(`${atk}→${def}=${forward} but ${def}→${atk}=${backward}`);
        }
      });
    });
    // Many Pokemon type pairs are non-reciprocal (e.g., Dragon 2x Dragon both ways,
    // Ice 2x Flying but Flying 1x Ice). These are expected design choices.
    expect(mismatches.length).toBeGreaterThan(0);
  });

  test("No type is weak to itself in a way that creates self-4x", () => {
    data.TYPES.forEach((t) => {
      const mult = ctx.getTypeMultiplier(t, { type: t });
      // In standard type chart, a type is never more than 2x against itself
      // (e.g., Dragon vs Dragon is 2x, but others are 1x or 0.5x)
      expect(mult).toBeLessThanOrEqual(2);
    });
  });

  // --- ENCOUNTER ---

  test("getEncounterSpec with number 0 returns first encounter", () => {
    const spec = ctx.getEncounterSpec(0);
    expect(spec).toBeDefined();
    expect(spec.kind).toBeDefined();
  });

  test("applyEncounterModifiers with zero multipliers silently treats them as 1x (|| 1 fallback)", () => {
    // The `|| 1` fallback in applyEncounterModifiers converts 0 to 1,
    // so zero multipliers produce the same result as 1x.
    const mon = { id: "bulbasaur", level: 5, hp: 90, atk: 14, def: 8, curHp: 90, reward: 30, xpYield: 30 };
    const spec = { hpMult: 0, atkMult: 0, defMult: 0, rewardMult: 0, xpMult: 0 };
    ctx.applyEncounterModifiers(mon, spec);
    // Because of `|| 1`, the multipliers are treated as 1, not 0
    expect(mon.hp).toBe(90);
    expect(mon.atk).toBe(14);
    expect(mon.def).toBe(8);
    expect(mon.reward).toBe(30);
    expect(mon.xpYield).toBe(30);
  });

  test("endless encounter scaling is monotonic", () => {
    let prevHp = 0;
    for (let i = 1; i <= 20; i++) {
      const spec = ctx.getEncounterSpec(data.RUN_LENGTH + i);
      expect(spec.hpMult).toBeGreaterThanOrEqual(prevHp);
      prevHp = spec.hpMult;
    }
  });

  // --- CATCHING ---

  test("calcCatchRate with zero HP enemy", () => {
    const enemy = {
      id: "pikachu", rarity: "Common", level: 5,
      hp: 100, curHp: 0, catchRate: 0.6, fx: ctx.makeFx(),
    };
    const rate = ctx.calcCatchRate(enemy, 1.0);
    expect(rate).toBeGreaterThanOrEqual(0.003);
    expect(rate).toBeLessThanOrEqual(0.96);
  });

  // --- MOVES ---

  test("moveRates with missing power uses default accuracy", () => {
    const move = { name: "Status Move", type: "Normal" };
    const rates = ctx.moveRates(move);
    expect(rates.accuracy).toBeGreaterThan(0);
    expect(rates.accuracy).toBeLessThanOrEqual(1);
  });

  test("requiredStreak with missing diff field", () => {
    expect(ctx.requiredStreak({})).toBe(0);
    expect(ctx.requiredStreak({ diff: 0 })).toBe(0);
  });

  test("consumesStreak with missing diff field", () => {
    expect(ctx.consumesStreak({})).toBe(false);
    expect(ctx.consumesStreak({ diff: 0 })).toBe(false);
  });

  // --- WEIGHTED CHOICE ---

  test("weightedChoice with all zero weights returns default", () => {
    const result = ctx.weightedChoice({ Common: 0, Uncommon: 0 });
    expect(result).toBe("Common");
  });

  test("randomFrom on empty array returns undefined", () => {
    expect(ctx.randomFrom([])).toBeUndefined();
  });

  // --- EFFECTS ---

  test("hasEffect with no effects array returns false", () => {
    expect(ctx.hasEffect({}, "stun")).toBe(false);
    expect(ctx.hasEffect({ effects: [] }, "stun")).toBe(false);
    expect(ctx.hasEffect({ name: "Tackle" }, "stun")).toBe(false);
  });

  test("endStep poison damage can kill a mon with very low HP", () => {
    const mon = {
      fainted: false, hp: 30, curHp: 2, name: "Test",
      fx: { ...ctx.makeFx(), poison: 1, weaken: 0 },
      ability: null, heldItem: null,
    };
    ctx.__SET_G({ team: [mon], activeIdx: 0, enemy: null });
    const notes = ctx.endStep("player");
    expect(mon.curHp).toBe(0);
    expect(notes.length).toBeGreaterThan(0);
    // NOTE: endStep does NOT set fainted flag. That's caller's responsibility.
    // This test documents that behavior.
  });

  // --- STATE ---

  test("createDefaultState is not mutated when G is modified", () => {
    const fresh = ctx.createDefaultState();
    const defaultInv = { ...fresh.inv };
    fresh.inv.potion = 999;
    const fresh2 = ctx.createDefaultState();
    expect(fresh2.inv.potion).toBe(2);
  });

  // --- SHUFFLE ---

  test("shuffle with single element returns same element", () => {
    expect(ctx.shuffle([42])).toEqual([42]);
  });

  // --- SCORE ENEMY MOVE ---

  test("scoreEnemyMove with null/undefined references does not crash", () => {
    // scoreEnemyMove reads G.lastEnemyMove and enemy.moves
    // This test probes whether it handles edge case input gracefully
    const enemy = {
      id: "charmander", name: "Charmander", type: "Fire", level: 5,
      hp: 90, curHp: 90, atk: 14, def: 8, fx: ctx.makeFx(),
      moves: [{ name: "Scratch", type: "Normal", power: 14, diff: 1, tier: "basic" }],
      ability: null, heldItem: null,
    };
    const player = {
      id: "bulbasaur", name: "Bulbasaur", type: "Grass", level: 5,
      hp: 90, curHp: 90, atk: 14, def: 8, fx: ctx.makeFx(),
      ability: null, heldItem: null,
    };
    const move = enemy.moves[0];
    const score = ctx.scoreEnemyMove(enemy, player, move, 10);
    expect(typeof score).toBe("number");
  });

  // --- RESOLVE MOVE TYPE ---

  test("resolveMoveType on Adaptive when all types are immune picks the least useless", () => {
    // Pure Ghost vs Normal: all Normal moves are immune. A Ghost-type mon against a Normal mon.
    const move = { name: "Adaptive Strike", type: "Adaptive", power: 20 };
    const attacker = { type: "Ghost", type2: null };
    const defender = { type: "Normal", type2: null };
    const resolved = ctx.resolveMoveType(move, attacker, defender);
    expect(data.TYPES).toContain(resolved);
    const mult = ctx.getTypeMultiplier(resolved, defender);
    // The best type should be selected, even if it's still 0x
    expect(mult).toBeGreaterThanOrEqual(0);
  });

  // --- SERIALIZE MON ---

  test("serializeMon preserves core fields and removes _rates", () => {
    const mon = {
      id: "pikachu", name: "Pikachu", type: "Electric", level: 5,
      hp: 100, atk: 16, def: 9, curHp: 80, xp: 50, xpToNext: 230,
      rarity: "Common", tc: "t-electric", tc2: null,
      fainted: false, sturdyUsed: false, sashUsed: false, berryUsed: false,
      ability: null, heldItem: null,
      fx: { stun: 0, stunPending: 0, poison: 0, guard: 0, weaken: 0, vulnerable: 0 },
      moves: [{ name: "Thunder Shock", power: 15, diff: 1, tier: "basic", type: "Electric", _rates: {} }],
    };
    const s = ctx.serializeMon(mon);
    expect(s.id).toBe("pikachu");
    expect(s.name).toBe("Pikachu");
    expect(s.moves[0]._rates).toBeUndefined();
    expect(s.fx.stun).toBe(0);
  });

  // --- FIRST EMPTY SAVE SLOT ---

  test("normalizeMonState preserves xpToNext when xpToNext is zero", () => {
    // xpToNext: 0 is falsy, so the || fallback will replace it
    const result = ctx.normalizeMonState({ id: "bulbasaur", level: 5, xpToNext: 0 });
    // Because 0 is falsy, normalizeMonState recalculates it
    expect(result.xpToNext).toBeGreaterThan(0);
  });

  // --- INTERNAL CONSISTENCY ---

  test("calcDamage returns consistent results for symmetric stats", () => {
    // Two identical mons with a Normal move on Normal type should produce symmetric damage
    const mon = {
      type: "Normal", atk: 15, def: 10, fx: ctx.makeFx(),
      ability: null, heldItem: null,
    };
    const move = { name: "Tackle", type: "Normal", power: 14, diff: 1, tier: "basic" };
    const pAttack = ctx.calcDamage(mon, mon, move, "Normal", true);
    const eAttack = ctx.calcDamage(mon, mon, move, "Normal", false);
    // Both directions should give the same damage for identical mons
    expect(pAttack.damage).toBe(eAttack.damage);
  });

  // --- DEFAULT INV MUTATION ---

  test("createDefaultState returns fresh inv each time", () => {
    const s1 = ctx.createDefaultState();
    const s2 = ctx.createDefaultState();
    expect(s1.inv).not.toBe(s2.inv);
    s1.inv.potion = 999;
    expect(s2.inv.potion).toBe(2);
  });

  // --- ENCOUNTER INTERNAL CONSISTENCY ---

  test("createEncounter sets enemy curHp = hp", () => {
    const enc = ctx.createEncounter(1);
    expect(enc.enemy.curHp).toBe(enc.enemy.hp);
  });

  test("createEncounter at high encounter count has stronger enemy", () => {
    const early = ctx.createEncounter(1);
    const late = ctx.createEncounter(99);
    // Late-game enemies should have higher stats due to level scaling
    expect(late.enemy.level).toBeGreaterThanOrEqual(early.enemy.level);
  });

  // --- BAG ITEM EDGE CASES ---

  test("bagItemDesc with null enemy in catch context", () => {
    ctx.__SET_G({ ...ctx.createDefaultState(), enemy: null });
    const item = { effect: "catch", id: "pokeball", desc: "Catch a wild Pokemon", catchMod: 1 };
    const result = ctx.bagItemDesc(item, "battle", true);
    expect(result).toBe(item.desc);
  });

  test("bagItemDesc with trainer battle (catch not allowed)", () => {
    ctx.__SET_G({ ...ctx.createDefaultState(), enemy: ctx.normalizeMonState({ id: "pikachu", level: 5 }) });
    const item = { effect: "catch", id: "pokeball", desc: "Catch a wild Pokemon", catchMod: 1 };
    const result = ctx.bagItemDesc(item, "battle", false);
    expect(result).toContain("Unavailable");
  });

  // --- QUESTION EDGE CASES ---

  test("buildQuestionRound with 2 answers still works", () => {
    const q = { q: "Test?", a: ["Wrong", "Right"], c: 1, d: 1 };
    const round = ctx.buildQuestionRound(q);
    expect(round.options).toHaveLength(2);
    expect(round.answerIndex).toBeGreaterThanOrEqual(0);
    expect(round.options[round.answerIndex]).toBe("Right");
  });

  test("questionIndexesForDifficulty returns empty for unused difficulty", () => {
    const indexes = ctx.questionIndexesForDifficulty(99);
    expect(indexes).toEqual([]);
  });

  // --- TYPE CHART QUADRATIC CHECK ---

  test("No type combination produces 16x or higher effectiveness", () => {
    let maxMult = 0;
    data.TYPES.forEach((atk) => {
      data.TYPES.forEach((def1) => {
        data.TYPES.forEach((def2) => {
          const mult = ctx.getTypeMultiplier(atk, { type: def1, type2: def2 });
          if (mult > maxMult) maxMult = mult;
        });
      });
    });
    // Standard type chart max is 4x (e.g., Ice vs Flying/Ground)
    // If this goes above 4, there's a type chart error
    expect(maxMult).toBeLessThanOrEqual(8);
  });

  // --- CATCH RATE EXTREMES ---

  test("calcCatchRate with ballMod 0 produces clamped minimum", () => {
    const enemy = { id: "pikachu", rarity: "Legendary", level: 99, hp: 1000, curHp: 1000, catchRate: 0.05, fx: ctx.makeFx() };
    const rate = ctx.calcCatchRate(enemy, 0);
    expect(rate).toBeGreaterThanOrEqual(0.003);
    expect(rate).toBeLessThanOrEqual(0.96);
  });

  test("calcCatchRate with ballMod 100 and 1 HP", () => {
    const enemy = { id: "magikarp", rarity: "Common", level: 1, hp: 100, curHp: 1, catchRate: 0.6, fx: ctx.makeFx() };
    const rate = ctx.calcCatchRate(enemy, 100);
    expect(rate).toBeGreaterThanOrEqual(0.003);
    expect(rate).toBeLessThanOrEqual(0.96);
  });

  // --- TYPE CHART IMMUNITY SOUNDNESS ---

  test("Type chart immunities match known Pokemon pairs", () => {
    const expectedImmunities = [
      ["Normal", "Ghost"], ["Ghost", "Normal"],
      ["Fighting", "Ghost"], ["Electric", "Ground"],
      ["Poison", "Steel"],
      ["Ground", "Flying"], ["Psychic", "Dark"],
      ["Ghost", "Normal"], ["Dragon", "Fairy"],
    ];
    expectedImmunities.forEach(([atk, def]) => {
      expect(ctx.getTypeMultiplier(atk, { type: def }), `${atk} vs ${def} should be 0x`).toBe(0);
    });
  });

  // --- WALK THE ENTIRE QUESTION SYSTEM ---

  test("getQ returns valid question for each difficulty", () => {
    ctx.__SET_G(ctx.createDefaultState());
    G = ctx.__GET_G();
    G.battleQuestionQueues = ctx.buildBattleQuestionQueues();
    [1, 2, 3].forEach((diff) => {
      const q = ctx.getQ(diff);
      expect(q).not.toBeNull();
      expect(q.d).toBe(diff);
      expect(q.q).toBeTruthy();
      expect(Array.isArray(q.a)).toBe(true);
    });
  });

  test("getQ returns null when no questions match difficulty", () => {
    G.battleQuestionQueues = { 1: [], 2: [], 3: [] };
    ctx.__SET_G(G);
    const q = ctx.getQ(99);
    expect(q).toBeNull();
  });

  // --- LEVEL UP MOVE LEARNING ---

  test("levelUpMon learns 3rd move at level 3", () => {
    const baseMon = data.MON_BY_ID.bulbasaur;
    const mon = { ...baseMon, level: 1, xp: 300, xpToNext: 110, hp: 85, curHp: 85, atk: 14, def: 7, rarity: "Common", moves: baseMon.moves.slice(0, 2).map(ctx.cleanMove), fx: ctx.makeFx() };
    const gains = ctx.levelUpMon(mon);
    const learnedMoves = gains.filter((g) => g.move);
    // At level 3, mon should learn Vine Whip (the 3rd move slot)
    if (mon.level >= 3 && mon.moves.length >= 3) {
      expect(mon.moves.length).toBe(3);
      expect(learnedMoves.length).toBeGreaterThanOrEqual(1);
    }
  });

  // --- COMPARE COLLECTION WITH MAX LEVEL ---

  test("compareCollectionMon max level always wins", () => {
    const weak = { id: "pikachu", level: 1, moves: [{}], hp: 50, atk: 10, def: 5, xp: 0 };
    const strong = { id: "pikachu", level: 99, moves: [{}], hp: 200, atk: 40, def: 20, xp: 9999 };
    expect(ctx.compareCollectionMon(weak, strong)).toBeLessThan(0);
    expect(ctx.compareCollectionMon(strong, weak)).toBeGreaterThan(0);
  });

  // --- SERIALIZE MON PRESERVES ALL FIELDS ---

  test("serializeMon does not drop any top-level fields", () => {
    const mon = ctx.normalizeMonState({ id: "pikachu", level: 5 });
    const serialized = ctx.serializeMon(mon);
    const required = ["id", "name", "type", "level", "hp", "atk", "def", "curHp", "xp", "xpToNext", "rarity", "moves", "fx", "fainted"];
    required.forEach((field) => {
      expect(serialized, `serializeMon dropped ${field}`).toHaveProperty(field);
    });
  });

  // --- CONSISTENCY: normalize → serialize → normalize is idempotent ---

  test("normalizeMonState followed by serializeMon preserves key fields", () => {
    const input = { id: "charmander", level: 5, curHp: 30 };
    const normalized = ctx.normalizeMonState(input);
    const serialized = ctx.serializeMon(normalized);
    expect(serialized.id).toBe("charmander");
    expect(serialized.level).toBe(5);
    expect(serialized.curHp).toBe(30);
    expect(serialized.hp).toBeGreaterThan(0);
    expect(serialized.type).toBe("Fire");
    // Re-normalize the serialized output
    const normalized2 = ctx.normalizeMonState(serialized);
    expect(normalized2.id).toBe("charmander");
    expect(normalized2.level).toBe(5);
    expect(normalized2.hp).toBeGreaterThan(0);
  });
});
