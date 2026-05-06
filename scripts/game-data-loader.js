const fs = require("fs");
const path = require("path");
const vm = require("vm");

function createClassList() {
  return {
    add() {},
    remove() {},
    toggle() {},
    contains() { return false; },
  };
}

function createElementStub() {
  return {
    style: { setProperty() {} },
    classList: createClassList(),
    dataset: {},
    children: [],
    appendChild(child) { this.children.push(child); return child; },
    remove() {},
    addEventListener() {},
    setAttribute(name, value) { this[name] = String(value); },
    getAttribute(name) { return this[name] || null; },
    removeAttribute(name) { delete this[name]; },
    querySelector() { return createElementStub(); },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }; },
    set textContent(value) { this._textContent = value; },
    get textContent() { return this._textContent || ""; },
    set innerHTML(value) { this._innerHTML = value; },
    get innerHTML() { return this._innerHTML || ""; },
    set src(value) { this._src = value; },
    get src() { return this._src || ""; },
    set disabled(value) { this._disabled = value; },
    get disabled() { return !!this._disabled; },
  };
}

function createStubs(extras = {}) {
  const elementCache = new Map();
  const context = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    requestAnimationFrame(callback) { return setTimeout(callback, 0); },
    localStorage: {
      getItem() { return null; },
      setItem() {},
      removeItem() {},
    },
    Audio: function Audio() {
      return {
        loop: false, preload: "", volume: 1, paused: true, src: "",
        currentTime: 0,
        play() { this.paused = false; return Promise.resolve(); },
        pause() { this.paused = true; },
      };
    },
    Image: function Image() { return createElementStub(); },
    document: {
      body: createElementStub(),
      createElement() { return createElementStub(); },
      addEventListener() {},
      getElementById(id) {
        if (!elementCache.has(id)) elementCache.set(id, createElementStub());
        return elementCache.get(id);
      },
      querySelector() { return null; },
      querySelectorAll() { return []; },
    },
    window: { addEventListener() {} },
    indexedDB: null,
    encodeURIComponent,
    SP: "./assets/sprites/ani/",
    SPB: "./assets/sprites/ani-back/",
    MUSIC_PATH: "./assets/music/",
    MOVE_SFX_PATH: "./assets/sfx/attack-moves/",
    MOVE_ANIMATION_PATH: "./assets/animations/move-effects/",
    TRAINER_PATH: "./assets/trainers/",
    SAVE_KEY: "biomon_save_v2",
    SAVE_SLOT_COUNT: 3,
    COLLECTION_KEY: "biomon_collection_v1",
    MUSIC_KEY: "biomon_music_enabled_v1",
    MUSIC_TRACKS: {},
    MUSIC_VOLUME: 0.2,
    SFX_VOLUME: 0.45,
    MOVE_ANIMATION_FRAME: 192,
    ...extras,
  };
  context.globalThis = context;
  return context;
}

function loadScript(scriptPath, context, exportVars) {
  const code = fs.readFileSync(scriptPath, "utf8");
  let scriptCode = code;
  if (exportVars && exportVars.length) {
    const exportList = exportVars.map((v) => v).join(", ");
    scriptCode = `${code}\nglobalThis.__DATA__ = { ${exportList} };`;
  }
  vm.runInNewContext(scriptCode, context, { filename: scriptPath, timeout: 5000 });
  return context.__DATA__;
}

module.exports = { createClassList, createElementStub, createStubs, loadScript };
