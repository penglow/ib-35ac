# Bug Report

Found by the `game.test.js` vitest suite. 5 failing tests documenting real code issues.

---

## B1: `healTarget()` heals negative amounts

**File:** `js/game.js:2089`

```js
function healTarget(target, amount) {
  const before = target.curHp;
  target.curHp = Math.min(target.hp, target.curHp + amount);  // ← no guard
  return target.curHp - before;
}
```

`Math.min(100, 80 + (-30))` yields 50, returns -30. A negative amount silently deals damage instead of being ignored.

**Fix:** Bail early when `amount <= 0`.

---

## B2: `normalizeMonState` allows `fainted: true` with `curHp > 0`

**File:** `js/game.js:254`

```js
normalized.fainted = !!normalized.fainted || normalized.curHp <= 0;
```

`!!true || false` → `true`. An explicit `fainted: true` in the input survives even when the mon has half HP. Creates an inconsistent immortal-faint state.

**Fix:** Normalize toward whichever source is more recent: `normalized.fainted = normalized.curHp <= 0;` (trust HP, ignore explicit `fainted`), or enforce curHp = 0 when `fainted` is set.

---

## B3: `normalizeMonState` loses base `rarity` when input omits it

**File:** `js/game.js:224-225`

```js
const normalized = {
  ...base,       // base.rarity = "Common"
  ...mon,        // mon.rarity = undefined → overrides base
  ...
};
```

`{ ...{ rarity: "Common" }, ...{ rarity: undefined } }` → `{ rarity: undefined }`. Spread copies keys even when the value is `undefined`, wiping the base default.

**Fix:** Filter mon keys that are `undefined`, or reorder spread so base fills gaps, or use an explicit fallback for each scalar field.

---

## B4: `saveEncounterLabel()` crashes on `null`

**File:** `js/game.js:455`

```js
return (save.encounterCount || 0) > RUN_LENGTH
```

`null.encounterCount` throws `TypeError`. Title-screen rendering can crash if corrupted save data reaches this function.

**Fix:** Guard against null/undefined: `if (!save) return "";`

---

## B5: `calcDamage()` produces non-zero damage for `power: 0` moves

**File:** `js/game.js:2047-2070`

```js
const raw =
  move.power +
  Math.round(attacker.atk * 0.7) -
  Math.round(defBonus * 0.35);
const damage = typeMult === 0 ? 0 : Math.max(1, Math.round(raw * ...));
```

With `power: 0`, `atk: 14`, `def: 8`: `raw = 0 + 10 - 3 = 7`, damage = 8 (after STAB × 1.2). Status moves should never deal damage. `runMove()` sidesteps this by guarding `if (move.power > 0)` before calling `calcDamage`, but direct callers get wrong results.

**Fix:** Return `{ damage: 0, ... }` when `move.power <= 0`.
