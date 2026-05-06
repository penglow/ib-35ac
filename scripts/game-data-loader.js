// game-data-loader.js
// Creates a sandboxed VM environment to load and exercise game scripts in a headless
// (non-browser) context.  The sandbox stubs out enough of the DOM and browser APIs
// that game code expecting a browser can run without actually having one.  Useful for
// unit tests, data extraction, and offline processing.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

// Returns a no-op object that mimics the DOM classList API.  Every method is a stub
// so any game code that toggles CSS classes can be called without throwing.
function createClassList() {
  return {
    add() {},
    remove() {},
    toggle() {},
    contains() { return false; },
  };
}

// Creates a minimal fake DOM element.  The stub captures key properties that game code
// commonly reads or writes (innerHTML, src, disabled, textContent, dataset) and exposes
// enough DOM traversal methods (appendChild, querySelector, getBoundingClientRect) to
// keep scripts from crashing when they manipulate the virtual tree.
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

// Builds the complete fake browser environment used as the VM sandbox context.
// Returns an object with stubbed globals: console, timers, localStorage, Audio,
// Image, document (with an element cache so repeated getElementById calls return
// the same stub), window, indexedDB, and game-specific constants such as asset
// paths and save keys.  The optional extras parameter lets callers override or
// augment any property without mutating the default set.
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

// Reads a game script from disk, optionally wraps its top-level variables as a
// __DATA__ object, then executes the code in the sandboxed VM context.
//   scriptPath – absolute or relative path to the .js file
//   context    – the sandbox object returned by createStubs
//   exportVars – array of variable names to hoist into a __DATA__ dictionary
// Returns the __DATA__ object populated by the script (or undefined if exportVars
// was not supplied).  Execution is capped at 5 seconds to catch infinite loops.
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

// Public API – each function can be used independently or composed together:
//   createClassList   – stub for DOM classList (used internally)
//   createElementStub – stub for a single DOM element (used internally)
//   createStubs      – full fake browser environment
//   loadScript       – run a script inside that environment and extract its data
module.exports = { createClassList, createElementStub, createStubs, loadScript };
