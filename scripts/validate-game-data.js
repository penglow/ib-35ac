const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const INDEX_PATH = path.join(ROOT, "index.html");
const EXTERNAL_QUESTIONS_PATH = path.join(
  ROOT,
  "ib35ac_no_calculation_questions_database.json",
);
const MOVE_EFFECTS_PATH = path.join(ROOT, "assets", "animations", "move-effects");

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function createClassList() {
  return {
    add() {},
    remove() {},
    toggle() {},
    contains() {
      return false;
    },
  };
}

function createElementStub() {
  return {
    style: { setProperty() {} },
    classList: createClassList(),
    dataset: {},
    children: [],
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    remove() {},
    addEventListener() {},
    setAttribute(name, value) {
      this[name] = String(value);
    },
    getAttribute(name) {
      return this[name] || null;
    },
    querySelector() {
      return createElementStub();
    },
    querySelectorAll() {
      return [];
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    },
    set textContent(value) {
      this._textContent = value;
    },
    get textContent() {
      return this._textContent || "";
    },
    set innerHTML(value) {
      this._innerHTML = value;
    },
    get innerHTML() {
      return this._innerHTML || "";
    },
    set src(value) {
      this._src = value;
    },
    get src() {
      return this._src || "";
    },
    set disabled(value) {
      this._disabled = value;
    },
    get disabled() {
      return !!this._disabled;
    },
  };
}

function extractScript(html) {
  const match = html.match(/<script>([\s\S]*)<\/script>/);
  if (!match) throw new Error("Could not find inline <script> in index.html");
  return match[1];
}

function loadGameData() {
  const html = readText(INDEX_PATH);
  const script = extractScript(html);
  const elementCache = new Map();
  const context = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    requestAnimationFrame(callback) {
      return setTimeout(callback, 0);
    },
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
      removeItem() {},
    },
    Audio: function Audio() {
      return {
        loop: false,
        preload: "",
        volume: 1,
        paused: true,
        src: "",
        currentTime: 0,
        play() {
          this.paused = false;
          return Promise.resolve();
        },
        pause() {
          this.paused = true;
        },
      };
    },
    Image: function Image() {
      return createElementStub();
    },
    document: {
      body: createElementStub(),
      createElement() {
        return createElementStub();
      },
      addEventListener() {},
      getElementById(id) {
        if (!elementCache.has(id)) elementCache.set(id, createElementStub());
        return elementCache.get(id);
      },
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
    },
    window: {
      addEventListener() {},
    },
  };
  context.globalThis = context;

  const exportScript = `${script}
globalThis.__GAME_DATA__ = {
  TYPES,
  MOVE_POOLS,
  UTIL_MOVES,
  LEGENDARY_MOVES,
  HELD_ITEMS,
  RARITY_STATS,
  DEX,
  STARTER_IDS,
  EVO_DATA,
  RUN_PLAN,
  TYPE_ARENAS,
  ITEMS,
  QS,
  ALL_MONS,
  MOVE_ANIMATION_EXACT,
  MOVE_ANIMATION_ALIASES,
  TYPE_ANIMATION_FALLBACKS
};`;

  vm.runInNewContext(exportScript, context, {
    filename: INDEX_PATH,
    timeout: 5000,
  });
  return context.__GAME_DATA__;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function pngDimensions(file) {
  const data = fs.readFileSync(file);
  if (
    data.length < 24 ||
    data[0] !== 0x89 ||
    data.toString("latin1", 1, 4) !== "PNG"
  ) {
    return null;
  }
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
  };
}

function validate() {
  const data = loadGameData();
  const errors = [];
  const warnings = [];
  const dexIds = new Set(data.DEX.map(([id]) => id));
  const allMonIds = new Set(data.ALL_MONS.map((mon) => mon.id));
  const typeSet = new Set(data.TYPES);
  const itemIds = new Set(data.ITEMS.map((item) => item.id));
  const heldItemIds = new Set(data.HELD_ITEMS.map((item) => item.id));

  for (const mon of data.ALL_MONS) {
    if (!mon.id || !mon.name) errors.push("Pokemon entry missing id/name");
    if (!typeSet.has(mon.type)) errors.push(`${mon.id}: unknown type ${mon.type}`);
    if (mon.type2 && !typeSet.has(mon.type2)) {
      errors.push(`${mon.id}: unknown secondary type ${mon.type2}`);
    }
    for (const spriteDir of ["ani", "ani-back"]) {
      const sprite = path.join(ROOT, "assets", "sprites", spriteDir, `${mon.id}.gif`);
      if (!fs.existsSync(sprite)) {
        errors.push(`${mon.id}: missing ${spriteDir} sprite`);
      }
    }
    for (const move of mon.moves || []) {
      if (!move.name) errors.push(`${mon.id}: move missing name`);
      if (!typeSet.has(move.type) && move.type !== "Adaptive") {
        errors.push(`${mon.id}: ${move.name} has unknown type ${move.type}`);
      }
      if (![1, 2, 3].includes(move.diff)) {
        errors.push(`${mon.id}: ${move.name} has invalid question difficulty`);
      }
    }
  }

  for (const id of data.STARTER_IDS) {
    if (!allMonIds.has(id)) errors.push(`Starter id not found in dex: ${id}`);
  }

  for (const [from, to, level] of data.EVO_DATA) {
    if (!dexIds.has(from)) errors.push(`Evolution source not found: ${from}`);
    if (!dexIds.has(to)) errors.push(`Evolution target not found: ${to}`);
    if (!Number.isFinite(level) || level < 2) {
      errors.push(`Evolution ${from} -> ${to} has invalid level ${level}`);
    }
  }

  data.RUN_PLAN.forEach((encounter, index) => {
    const label = `RUN_PLAN[${index}]`;
    if (!["wild", "trainer", "boss"].includes(encounter.kind)) {
      errors.push(`${label}: invalid kind ${encounter.kind}`);
    }
    if (encounter.aceId && !allMonIds.has(encounter.aceId)) {
      errors.push(`${label}: aceId not found: ${encounter.aceId}`);
    }
    if ((encounter.kind === "trainer" || encounter.kind === "boss") && encounter.allowCatch) {
      warnings.push(`${label}: trainer/boss encounter allows catching`);
    }
  });

  for (const item of data.ITEMS) {
    if (!item.id || !item.name) errors.push("Item entry missing id/name");
    if (item.effect === "held" && !heldItemIds.has(item.id)) {
      errors.push(`${item.id}: held item is not in HELD_ITEMS`);
    }
  }
  for (const id of Object.keys(data.RARITY_STATS)) {
    const rarity = data.RARITY_STATS[id];
    if (!rarity.slots || rarity.slots.length < 2) {
      errors.push(`${id}: rarity has too few move slots`);
    }
  }

  const animationSheets = new Set([
    ...data.MOVE_ANIMATION_EXACT,
    ...Object.values(data.MOVE_ANIMATION_ALIASES),
    ...Object.values(data.TYPE_ANIMATION_FALLBACKS),
  ]);
  for (const sheet of animationSheets) {
    const file = path.join(MOVE_EFFECTS_PATH, `${sheet}.png`);
    if (!fs.existsSync(file)) {
      errors.push(`Missing move animation sheet: ${sheet}.png`);
      continue;
    }
    const dims = pngDimensions(file);
    if (!dims) {
      errors.push(`Move animation sheet is not a PNG: ${sheet}.png`);
      continue;
    }
    if (dims.width % 192 !== 0 || dims.height % 192 !== 0) {
      errors.push(
        `Move animation sheet is not aligned to 192px frames: ${sheet}.png ${dims.width}x${dims.height}`,
      );
    }
  }

  const questionCounts = { 1: 0, 2: 0, 3: 0 };
  const seenQuestionText = new Map();
  data.QS.forEach((question, index) => {
    const label = `QS[${index}]`;
    if (![1, 2, 3].includes(question.d)) errors.push(`${label}: invalid d`);
    else questionCounts[question.d]++;
    if (!question.cat) errors.push(`${label}: missing cat`);
    if (!question.q) errors.push(`${label}: missing q`);
    if (!Array.isArray(question.a) || question.a.length < 2) {
      errors.push(`${label}: expected at least two answers`);
    } else if (!Number.isInteger(question.c) || question.c < 0 || question.c >= question.a.length) {
      errors.push(`${label}: correct index is out of range`);
    }
    const normalized = normalizeText(question.q);
    if (seenQuestionText.has(normalized)) {
      warnings.push(`${label}: duplicate question text also at QS[${seenQuestionText.get(normalized)}]`);
    } else {
      seenQuestionText.set(normalized, index);
    }
  });

  if (fs.existsSync(EXTERNAL_QUESTIONS_PATH)) {
    const external = JSON.parse(readText(EXTERNAL_QUESTIONS_PATH));
    const compatible = external.filter((question) =>
      ["multiple_choice", "true_false"].includes(question.type),
    );
    const embeddedQuestions = new Set(data.QS.map((question) => normalizeText(question.q)));
    const missingCompatible = compatible.filter(
      (question) => !embeddedQuestions.has(normalizeText(question.question)),
    );
    if (missingCompatible.length) {
      warnings.push(
        `${missingCompatible.length}/${compatible.length} compatible external questions were not exact-text matches in QS`,
      );
    }
  }

  const backgroundRefs = readText(INDEX_PATH).match(/assets\/backgrounds\/[^)'"]+/g) || [];
  for (const ref of new Set(backgroundRefs)) {
    const file = path.join(ROOT, ref);
    if (!fs.existsSync(file)) errors.push(`Missing background asset: ${ref}`);
  }

  return { errors, warnings, questionCounts };
}

const result = validate();
console.log(
  `Validated game data. Questions by difficulty: easy=${result.questionCounts[1]}, medium=${result.questionCounts[2]}, hard=${result.questionCounts[3]}.`,
);
for (const warning of result.warnings) console.warn(`WARN: ${warning}`);
if (result.errors.length) {
  for (const error of result.errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}
console.log("No blocking data errors found.");
