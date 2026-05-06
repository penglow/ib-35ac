      // Asset paths and localStorage keys shared across the game.
      const SP = "./assets/sprites/ani/";
      const SPB = "./assets/sprites/ani-back/";
      const MUSIC_PATH = "./assets/music/";
      const MOVE_SFX_PATH = "./assets/sfx/attack-moves/";
      const MOVE_ANIMATION_PATH = "./assets/animations/move-effects/";
      const TRAINER_PATH = "./assets/trainers/";
      const SAVE_KEY = "biomon_save_v2";
      const SAVE_SLOT_COUNT = 3;
      const COLLECTION_KEY = "biomon_collection_v1";
      const MUSIC_KEY = "biomon_music_enabled_v1";
      const MUSIC_TRACKS = {
        title: `${MUSIC_PATH}Pokemon Black and White Music - Title Screen.mp3`,
        wild: `${MUSIC_PATH}Pokémon Black & White - Wild Pokemon Battle Music (HQ).mp3`,
        trainer: `${MUSIC_PATH}Pokémon Black & White - Trainer Battle Music (HQ).mp3`,
        rare: `${MUSIC_PATH}Pokémon Black & White - Rare Wild Pokemon Battle Music (HQ).mp3`,
        critical: `${MUSIC_PATH}Pokemon Black and White - Low HP Music EXTENDED.mp3`,
        victory: `${MUSIC_PATH}Victory! Pokémon_ Black & White.mp3`,
      };
      const MUSIC_VOLUME = 0.2;
      const SFX_VOLUME = 0.45;
      const MOVE_ANIMATION_FRAME = 192;
      // Animations that have their own dedicated sprite sheet (used directly by name).
      // If a move is NOT in EXACT and NOT in ALIASES, the system falls back to
      // TYPE_ANIMATION_FALLBACKS[actualType], then TYPE_ANIMATION_FALLBACKS[move.type],
      // then "Tackle" as the ultimate default.
      const MOVE_ANIMATION_EXACT = new Set([
        "Bite",
        "Bulk Up",
        "Calm Mind",
        "Charm",
        "Dig",
        "Ember",
        "Gust",
        "Headbutt",
        "Karate Chop",
        "Lick",
        "Low Kick",
        "Metal Claw",
        "Peck",
        "Protect",
        "Reflect",
        "Rock Throw",
        "Scratch",
        "Shadow Ball",
        "Sleep Powder",
        "Tackle",
        "Thunder Shock",
        "Thunder Wave",
        "Toxic",
        "Vine Whip",
      ]);
      // Maps move names to visually similar animation sheets to reuse sprite assets.
      // When a move is found here, its mapped animation is used instead.
      const MOVE_ANIMATION_ALIASES = {
        Acid: "Toxic",
        "Acid Armor": "Defense Curl",
        Aeroblast: "Gust",
        "Air Slash": "Air Cutter",
        "Aqua Jet": "Tackle",
        "Aqua Ring": "Health Up",
        "Aura Sphere": "Shadow Ball",
        "Aurora Beam": "Status Freeze",
        "Blast Burn": "Ember",
        Blizzard: "Status Freeze",
        "Bloom Doom": "Vine Whip",
        "Blue Flare": "Ember",
        "Body Slam": "Tackle",
        "Bolt Strike": "Thunder Punch",
        "Brave Bird": "Gust",
        "Brick Break": "Karate Chop",
        "Bubble Beam": "Gust",
        "Bug Bite": "Bite",
        "Bug Buzz": "Supersonic",
        Bulldoze: "Dig",
        "Bullet Punch": "Comet Punch",
        "Bullet Seed": "Vine Whip",
        "Charge Beam": "Thunder Shock",
        "Close Combat": "Karate Chop",
        Confusion: "Status Confusion",
        Curse: "Mean Look",
        "Dark Pulse": "Shadow Ball",
        "Dark Void": "Status Sleep",
        "Dazzling Gleam": "Shiny",
        "Diamond Storm": "Rock Throw",
        "Disarming Voice": "Charm",
        "Draco Meteor": "Rock Throw",
        "Dragon Ascent": "Gust",
        "Dragon Breath": "Ember",
        "Dragon Claw": "Scratch",
        "Dragon Dance": "Bulk Up",
        "Dragon Pulse": "Shadow Ball",
        "Dragon Rush": "Tackle",
        "Dragon Tail": "Vine Whip",
        "Drain Punch": "Karate Chop",
        "Draining Kiss": "Health Up",
        "Earth Power": "Dig",
        Earthquake: "Dig",
        "Fairy Wind": "Gust",
        "Feint Attack": "Bite",
        "Fire Fang": "Bite",
        "Fire Spin": "Ember",
        Fissure: "Dig",
        "Flame Claw": "Scratch",
        Flamethrower: "Ember",
        "Flash Cannon": "Shiny",
        "Focus Blast": "Focus Energy",
        "Frost Breath": "Status Freeze",
        "Fury Cutter": "Fury Swipes",
        "Future Sight": "Mind Reader",
        "Genesis Wave": "Shadow Ball",
        Geomancy: "Shiny",
        "Giga Drain": "Health Up",
        "Giga Impact": "Tackle",
        "Gunk Shot": "Toxic",
        "Gyro Ball": "Defense Curl",
        Haze: "Status Freeze",
        "Heavy Slam": "Stomp",
        Hex: "Shadow Ball",
        Hurricane: "Gust",
        "Hydro Pump": "Gust",
        "Hyper Beam": "Shiny",
        "Ice Beam": "Status Freeze",
        "Ice Shard": "Status Freeze",
        "Icy Wind": "Status Freeze",
        Inferno: "Status Burn",
        "Iron Defense": "Defense Curl",
        "Iron Head": "Headbutt",
        Judgment: "Shiny",
        "Leech Seed": "Vine Whip",
        "Mach Punch": "Comet Punch",
        Megahorn: "Peck",
        "Meteor Mash": "Comet Punch",
        Moonblast: "Shiny",
        "Mud Slap": "Dig",
        "Nasty Plot": "Mean Look",
        "Night Daze": "Shadow Ball",
        "Oblivion Wing": "Gust",
        "Origin Pulse": "Gust",
        Outrage: "Struggle",
        "Phantom Force": "Shadow Ball",
        "Play Rough": "Tackle",
        "Poison Sting": "Poison Powder",
        "Powder Snow": "Status Freeze",
        "Precipice Blades": "Rock Throw",
        Psybeam: "Supersonic",
        Psychic: "Mind Reader",
        Psystrike: "Shadow Ball",
        "Psystrike Omega": "Shadow Ball",
        Pursuit: "Tackle",
        "Quick Attack": "Tackle",
        "Razor Leaf": "Vine Whip",
        Recover: "Health Up",
        Rest: "Status Sleep",
        "Roar of Time": "Roar",
        "Rock Polish": "Shiny",
        "Rock Slide": "Rock Throw",
        "Rock Wrecker": "Rock Throw",
        Roost: "Health Up",
        "Sacred Fire": "Ember",
        "Sand Attack": "Dig",
        Scald: "Status Burn",
        "Shadow Curse": "Mean Look",
        "Shadow Force": "Shadow Ball",
        "Shadow Sneak": "Shadow Ball",
        "Sheer Cold": "Status Freeze",
        "Sludge Bomb": "Toxic",
        "Sludge Wave": "Toxic",
        "Smack Down": "Rock Throw",
        "Solar Beam": "Shiny",
        "Spacial Rend": "Slash",
        Spark: "Thunder Shock",
        "Stealth Rock": "Rock Throw",
        "Stone Edge": "Rock Throw",
        "String Shot": "Constrict",
        "Struggle Bug": "Constrict",
        "Sucker Punch": "Comet Punch",
        Surf: "Gust",
        Tailwind: "Gust",
        Thunder: "Thunder Shock",
        Thunderbolt: "Thunder Shock",
        Twister: "Gust",
        "U-Turn": "Tackle",
        Venoshock: "Toxic",
        "Volt Switch": "Thunder Shock",
        "Water Gun": "Gust",
        "Will-o-Wisp": "Status Burn",
        "Wing Attack": "Gust",
        Wish: "Health Up",
        "X-Scissor": "Slash",
        "Zen Headbutt": "Headbutt",
      };
      // Per-type fallback animations used when a move has no exact sheet or alias.
      // Keyed by the move's actual (resolved) type, e.g. Fire -> "Ember".
      const TYPE_ANIMATION_FALLBACKS = {
        Bug: "Constrict",
        Dark: "Bite",
        Dragon: "Gust",
        Electric: "Thunder Shock",
        Fairy: "Charm",
        Fighting: "Karate Chop",
        Fire: "Ember",
        Flying: "Gust",
        Ghost: "Shadow Ball",
        Grass: "Vine Whip",
        Ground: "Dig",
        Ice: "Status Freeze",
        Normal: "Tackle",
        Poison: "Toxic",
        Psychic: "Mind Reader",
        Rock: "Rock Throw",
        Steel: "Metal Claw",
        Water: "Gust",
      };

      // Global audio element for BGM. Managed through the music system below.
      // Browsers block autoplay until a user gesture (pointerdown/keydown) fires,
      // which sets musicPrimed = true and enables playCurrentMusic().
      const musicAudio = new Audio();
      musicAudio.loop = true;
      musicAudio.preload = "metadata";
      musicAudio.volume = MUSIC_VOLUME;
      let currentMusicTrack = "";
      let musicPrimed = false;
      let musicEnabled = readMusicSetting();

      function readMusicSetting() {
        try {
          return localStorage.getItem(MUSIC_KEY) !== "off";
        } catch {
          return true;
        }
      }

      function saveMusicSetting() {
        try {
          localStorage.setItem(MUSIC_KEY, musicEnabled ? "on" : "off");
        } catch (e) { console.warn("Failed to save music setting:", e); }
      }

      function renderMusicToggle() {
        const btn = document.getElementById("music-toggle");
        if (!btn) return;
        btn.textContent = musicEnabled ? "MUSIC ON" : "MUSIC OFF";
        btn.classList.toggle("muted", !musicEnabled);
      }

      function primeMusic() {
        musicPrimed = true;
        updateMusicForScreen();
      }

      function toggleMusic() {
        musicPrimed = true;
        if (musicEnabled && musicAudio.paused) {
          updateMusicForScreen();
          return;
        }
        musicEnabled = !musicEnabled;
        saveMusicSetting();
        renderMusicToggle();
        if (musicEnabled) updateMusicForScreen();
        else musicAudio.pause();
      }

      function playCurrentMusic() {
        if (!musicEnabled || !musicPrimed || !musicAudio.src) return;
        if (!musicAudio.paused) return;
        const playAttempt = musicAudio.play();
        if (playAttempt && typeof playAttempt.catch === "function") {
          playAttempt.catch(() => {});
        }
      }

      function moveSfxPath(move) {
        if (!move || !move.name) return "";
        return `${MOVE_SFX_PATH}${encodeURIComponent(move.name)}.mp3`;
      }

      function playMoveSfx(move) {
        if (!musicPrimed) return;
        const src = moveSfxPath(move);
        if (!src) return;
        const sfx = new Audio(src);
        sfx.volume = SFX_VOLUME;
        const playAttempt = sfx.play();
        if (playAttempt && typeof playAttempt.catch === "function") {
          playAttempt.catch(() => {});
        }
      }

      function moveAnimationSheet(move, actualType) {
        if (!move || !move.name) return "";
        if (MOVE_ANIMATION_ALIASES[move.name])
          return MOVE_ANIMATION_ALIASES[move.name];
        if (MOVE_ANIMATION_EXACT.has(move.name)) return move.name;
        return (
          TYPE_ANIMATION_FALLBACKS[actualType] ||
          TYPE_ANIMATION_FALLBACKS[move.type] ||
          "Tackle"
        );
      }

      function moveAnimationTarget(side, move) {
        const selfEffect = (move.effects || []).some(
          (effect) => effect.target === "self",
        );
        if ((move.heal || selfEffect) && !move.power) return side;
        return otherSide(side);
      }

      function playMoveAnimation(side, move, actualType) {
        const arena = document.getElementById("arena");
        const sheet = moveAnimationSheet(move, actualType);
        if (!arena || !sheet) return;
        const target = moveAnimationTarget(side, move);
        const vfx = document.createElement("div");
        vfx.className = `move-vfx target-${target}`;
        if (actualType === "Electric" || /^Thunder/.test(sheet)) {
          vfx.classList.add("electric-vfx");
        }
        const src = `${MOVE_ANIMATION_PATH}${encodeURIComponent(sheet)}.png`;
        vfx.style.backgroundImage = `url("${src}")`;
        arena.appendChild(vfx);
        positionBattleEffect(vfx, target);

        const img = new Image();
        img.onload = () => {
          const cols = Math.max(1, Math.floor(img.naturalWidth / MOVE_ANIMATION_FRAME));
          const rows = Math.max(1, Math.floor(img.naturalHeight / MOVE_ANIMATION_FRAME));
          const frames = cols * rows;
          let frame = 0;
          let removed = false;
          const removeVfx = () => {
            if (removed) return;
            removed = true;
            vfx.remove();
          };
          const renderFrame = () => {
            const col = frame % cols;
            const row = Math.floor(frame / cols);
            vfx.style.backgroundPosition =
              `-${col * MOVE_ANIMATION_FRAME}px -${row * MOVE_ANIMATION_FRAME}px`;
          };
          renderFrame();
          if (frames <= 1) {
            setTimeout(removeVfx, 420);
            return;
          }
          const timer = setInterval(() => {
            frame++;
            if (frame >= frames) {
              clearInterval(timer);
              setTimeout(removeVfx, 120);
              return;
            }
            renderFrame();
          }, 52);
        };
        img.onerror = () => vfx.remove();
        img.src = src;
      }

      // Switches the audio element to a new track key (e.g. "wild", "trainer").
      // No-ops if the same track is already loaded (just ensures playback).
      function setMusicTrack(track) {
        const src = MUSIC_TRACKS[track];
        if (!src) return;
        if (track === currentMusicTrack) {
          playCurrentMusic();
          return;
        }
        currentMusicTrack = track;
        musicAudio.pause();
        musicAudio.src = src;
        musicAudio.currentTime = 0;
        playCurrentMusic();
      }

      // Determines the appropriate battle track based on game state.
      // Priority: victory -> critical (HP <= 25%) -> trainer/boss -> rare wild -> wild.
      function battleMusicTrack() {
        if (!G || !G.enemy) return "title";
        if (G.defeatedEnemy || G.enemy.curHp <= 0 || G.enemy.fainted) {
          return "victory";
        }
        const player = active();
        const battleLive =
          player &&
          player.curHp > 0 &&
          !player.fainted &&
          G.enemy.curHp > 0 &&
          !G.enemy.fainted;
        const playerHpPct =
          player && player.hp > 0 ? Math.max(0, player.curHp / player.hp) : 1;
        if (battleLive && playerHpPct <= 0.25) {
          return "critical";
        }
        const meta = normalizeEncounterMeta(
          G.encounterMeta,
          G.enemy,
          G.encounterCount,
        );
        if (meta.kind === "trainer" || meta.kind === "boss") return "trainer";
        const rareWild =
          G.enemy.rarity === "Rare" ||
          G.enemy.rarity === "Legendary" ||
          /rare|high-risk/i.test(`${meta.title} ${meta.subtitle}`);
        return rareWild ? "rare" : "wild";
      }

      function musicTrackForScreen(id) {
        if (G.pendingVictory) return "victory";
        if (id === "shop-screen" && G.defeatedEnemy) return "victory";
        if (id === "pc-screen" && G.pcContext === "shop" && G.defeatedEnemy)
          return "victory";
        if (id === "battle-screen") return battleMusicTrack();
        if (id === "pc-screen" && G.pcContext === "battle")
          return battleMusicTrack();
        return "title";
      }

      function updateMusicForScreen() {
        const id =
          typeof currentScreenId === "function"
            ? currentScreenId()
            : "title-screen";
        setMusicTrack(musicTrackForScreen(id));
        renderMusicToggle();
      }

      document.addEventListener("pointerdown", primeMusic, { once: true });
      document.addEventListener("keydown", primeMusic, { once: true });

      // ========== TYPE SYSTEM (18 types, real Pokemon chart) ==========
      const TYPES = [
        "Normal",
        "Fire",
        "Water",
        "Electric",
        "Grass",
        "Ice",
        "Fighting",
        "Poison",
        "Ground",
        "Flying",
        "Psychic",
        "Bug",
        "Rock",
        "Ghost",
        "Dragon",
        "Dark",
        "Steel",
        "Fairy",
      ];
      const TYPE_CLASS = {};
      TYPES.forEach((t) => (TYPE_CLASS[t] = "t-" + t.toLowerCase()));
      TYPE_CLASS["Adaptive"] = "t-adaptive";

      // Compact type effectiveness: rows = attacker, cols = defender in TYPES order
      // 0=immune, h=0.5, 1=neutral, 2=super effective
      const EFF_DATA = {
        Normal: "1 1 1 1 1 1 1 1 1 1 1 1 h 0 1 1 h 1",
        Fire: "1 h h 1 2 2 1 1 1 1 1 2 h 1 h 1 2 1",
        Water: "1 2 h 1 h 1 1 1 2 1 1 1 2 1 h 1 1 1",
        Electric: "1 1 2 h h 1 1 1 0 2 1 1 1 1 h 1 1 1",
        Grass: "1 h 2 1 h 1 1 h 2 h 1 h 2 1 h 1 h 1",
        Ice: "1 h h 1 2 h 1 1 2 2 1 1 1 1 2 1 h 1",
        Fighting: "2 1 1 1 1 2 1 h 1 h h h 2 0 1 2 2 h",
        Poison: "1 1 1 1 2 1 1 h h 1 1 1 h h 1 1 0 2",
        Ground: "1 2 1 2 h 1 1 2 1 0 1 h 2 1 1 1 2 1",
        Flying: "1 1 1 h 2 1 2 1 1 1 1 2 h 1 1 1 h 1",
        Psychic: "1 1 1 1 1 1 2 2 1 1 h 1 1 1 1 0 h 1",
        Bug: "1 h 1 1 2 1 h h 1 h 2 1 1 h 1 2 h h",
        Rock: "1 2 1 1 1 2 h 1 h 2 1 2 1 1 1 1 h 1",
        Ghost: "0 1 1 1 1 1 1 1 1 1 2 1 1 2 1 h 1 1",
        Dragon: "1 1 1 1 1 1 1 1 1 1 1 1 1 1 2 1 h 0",
        Dark: "1 1 1 1 1 1 h 1 1 1 2 1 1 2 1 h 1 h",
        Steel: "1 h h h 1 2 1 1 1 1 1 1 2 1 1 1 h 2",
        Fairy: "1 h 1 1 1 1 2 h 1 1 1 1 1 1 2 2 h 1",
      };

      const TYPE_CHART = {};
      TYPES.forEach((atk) => {
        TYPE_CHART[atk] = {};
        const vals = EFF_DATA[atk].split(" ");
        TYPES.forEach((def, i) => {
          TYPE_CHART[atk][def] =
            vals[i] === "2"
              ? 2
              : vals[i] === "h"
                ? 0.5
                : vals[i] === "0"
                  ? 0
                  : 1;
        });
      });

      const MODES = {
        easy: {
          name: "Easy",
          summary: "Enemy attacks only after failed or skipped player turns.",
          battle:
            "Enemy hits back only when your move fails, you are stunned, or your turn is lost.",
        },
        hard: {
          name: "Hard",
          summary: "Enemy gets a move every round if still alive.",
          battle:
            "Answer wrong and your move fails. Answer right and the enemy still counters.",
        },
      };

      // ========== MOVE POOLS (by type) ==========
      // Compact format per move entry:
      //   name  - display name (aliased via MOVE_ANIMATION_ALIASES for animation)
      //   p     - base power (0 for pure status moves)
      //   d     - description string shown in the UI
      //   fx    - optional array of effects: { t: "foe"|"self", k: effectKind, a: amount }
      //          effectKind: "weaken" / "vulnerable" / "stun" / "poison" / "guard"
      //   heal  - flat HP restoration amount (used when p === 0)
      //   drain - fraction of dealt damage restored as HP (e.g. 0.5 = 50% drain)
      const MOVE_POOLS = {
        Normal: {
          basic: [
            { name: "Tackle", p: 14, d: "A basic charge." },
            { name: "Quick Attack", p: 15, d: "A swift strike." },
            { name: "Scratch", p: 14, d: "Sharp claws strike." },
          ],
          special: [
            {
              name: "Body Slam",
              p: 20,
              d: "Heavy hit that may weaken.",
              fx: [{ t: "foe", k: "weaken", a: 2 }],
            },
            { name: "Headbutt", p: 18, d: "A solid headbutt." },
          ],
          ultimate: [
            { name: "Hyper Beam", p: 34, d: "Devastating energy beam." },
            { name: "Giga Impact", p: 35, d: "Full-force charge." },
          ],
        },
        Fire: {
          basic: [
            { name: "Ember", p: 15, d: "A small flame." },
            { name: "Flame Claw", p: 16, d: "Fiery slash." },
            { name: "Fire Fang", p: 16, d: "Burning bite." },
          ],
          special: [
            { name: "Flamethrower", p: 22, d: "A stream of fire." },
            {
              name: "Fire Spin",
              p: 14,
              d: "Trapping fire that weakens.",
              fx: [{ t: "foe", k: "weaken", a: 2 }],
            },
            {
              name: "Will-o-Wisp",
              p: 8,
              d: "Weakens the foe.",
              fx: [{ t: "foe", k: "weaken", a: 2 }],
            },
          ],
          ultimate: [
            {
              name: "Blast Burn",
              p: 37,
              d: "Huge blast that exposes foe.",
              fx: [{ t: "foe", k: "vulnerable", a: 2 }],
            },
            {
              name: "Inferno",
              p: 35,
              d: "Engulfing fire that weakens.",
              fx: [{ t: "foe", k: "weaken", a: 2 }],
            },
          ],
        },
        Water: {
          basic: [
            { name: "Water Gun", p: 14, d: "A jet of water." },
            { name: "Bubble Beam", p: 16, d: "A stream of bubbles." },
            { name: "Aqua Jet", p: 15, d: "A quick water strike." },
          ],
          special: [
            { name: "Surf", p: 22, d: "A big wave crashes." },
            {
              name: "Scald",
              p: 18,
              d: "Hot water that weakens.",
              fx: [{ t: "foe", k: "weaken", a: 2 }],
            },
            { name: "Aqua Ring", p: 0, d: "Heal 22 HP.", heal: 22 },
          ],
          ultimate: [
            { name: "Hydro Pump", p: 36, d: "Massive water blast." },
            {
              name: "Origin Pulse",
              p: 38,
              d: "Devastating wave.",
              fx: [{ t: "foe", k: "vulnerable", a: 2 }],
            },
          ],
        },
        Electric: {
          basic: [
            { name: "Thunder Shock", p: 14, d: "A jolt of electricity." },
            { name: "Spark", p: 16, d: "An electric charge." },
            { name: "Charge Beam", p: 15, d: "A beam of energy." },
          ],
          special: [
            { name: "Thunderbolt", p: 22, d: "A strong electric bolt." },
            {
              name: "Thunder Wave",
              p: 0,
              d: "Paralyzes the foe.",
              fx: [{ t: "foe", k: "stun", a: 1 }],
            },
            { name: "Volt Switch", p: 18, d: "Hits and zaps." },
          ],
          ultimate: [
            {
              name: "Thunder",
              p: 36,
              d: "Lightning strike that stuns.",
              fx: [{ t: "foe", k: "stun", a: 1 }],
            },
            { name: "Bolt Strike", p: 37, d: "Massive electric slam." },
          ],
        },
        Grass: {
          basic: [
            { name: "Razor Leaf", p: 16, d: "Sharp leaves." },
            { name: "Vine Whip", p: 15, d: "Lashing vines." },
            { name: "Bullet Seed", p: 14, d: "A volley of seeds." },
          ],
          special: [
            {
              name: "Giga Drain",
              p: 16,
              d: "Drains half damage dealt.",
              drain: 0.5,
            },
            {
              name: "Leech Seed",
              p: 10,
              d: "Poisons and drains.",
              drain: 0.4,
              fx: [{ t: "foe", k: "poison", a: 3 }],
            },
            {
              name: "Sleep Powder",
              p: 0,
              d: "Puts foe to sleep.",
              fx: [{ t: "foe", k: "stun", a: 1 }],
            },
          ],
          ultimate: [
            { name: "Solar Beam", p: 36, d: "Concentrated sunlight." },
            {
              name: "Bloom Doom",
              p: 34,
              d: "Heavy hit with poison.",
              fx: [{ t: "foe", k: "poison", a: 3 }],
            },
          ],
        },
        Ice: {
          basic: [
            { name: "Ice Shard", p: 15, d: "A chunk of ice." },
            { name: "Powder Snow", p: 14, d: "A flurry of snow." },
            { name: "Frost Breath", p: 16, d: "An icy breath." },
          ],
          special: [
            { name: "Ice Beam", p: 22, d: "A freezing beam." },
            {
              name: "Icy Wind",
              p: 16,
              d: "Chilling gust that weakens.",
              fx: [{ t: "foe", k: "weaken", a: 2 }],
            },
            {
              name: "Haze",
              p: 0,
              d: "Guard next hit.",
              fx: [{ t: "self", k: "guard", a: 1 }],
            },
          ],
          ultimate: [
            { name: "Blizzard", p: 36, d: "Raging snowstorm." },
            {
              name: "Sheer Cold",
              p: 38,
              d: "Absolute zero blast.",
              fx: [{ t: "foe", k: "stun", a: 1 }],
            },
          ],
        },
        Fighting: {
          basic: [
            { name: "Karate Chop", p: 15, d: "A sharp chop." },
            { name: "Low Kick", p: 14, d: "A tripping kick." },
            { name: "Mach Punch", p: 15, d: "A fast punch." },
          ],
          special: [
            { name: "Brick Break", p: 22, d: "Shatters guards." },
            {
              name: "Drain Punch",
              p: 18,
              d: "Drains half damage.",
              drain: 0.5,
            },
            {
              name: "Bulk Up",
              p: 0,
              d: "Guard next hit.",
              fx: [{ t: "self", k: "guard", a: 1 }],
            },
          ],
          ultimate: [
            { name: "Close Combat", p: 36, d: "All-out attack." },
            {
              name: "Focus Blast",
              p: 35,
              d: "Concentrated energy.",
              fx: [{ t: "foe", k: "vulnerable", a: 2 }],
            },
          ],
        },
        Poison: {
          basic: [
            { name: "Poison Sting", p: 14, d: "A toxic jab." },
            { name: "Acid", p: 15, d: "Corrosive splash." },
            { name: "Venoshock", p: 16, d: "Toxic burst." },
          ],
          special: [
            {
              name: "Sludge Bomb",
              p: 22,
              d: "Filthy bomb that poisons.",
              fx: [{ t: "foe", k: "poison", a: 3 }],
            },
            {
              name: "Toxic",
              p: 0,
              d: "Badly poisons the foe.",
              fx: [{ t: "foe", k: "poison", a: 4 }],
            },
            {
              name: "Acid Armor",
              p: 0,
              d: "Guard next hit.",
              fx: [{ t: "self", k: "guard", a: 1 }],
            },
          ],
          ultimate: [
            {
              name: "Gunk Shot",
              p: 35,
              d: "Massive toxic shot.",
              fx: [{ t: "foe", k: "poison", a: 3 }],
            },
            {
              name: "Sludge Wave",
              p: 34,
              d: "Wave of poison.",
              fx: [{ t: "foe", k: "weaken", a: 2 }],
            },
          ],
        },
        Ground: {
          basic: [
            { name: "Mud Slap", p: 14, d: "A splash of mud." },
            { name: "Bulldoze", p: 16, d: "Shaking the ground." },
            { name: "Sand Attack", p: 13, d: "Blinding sand." },
          ],
          special: [
            { name: "Earthquake", p: 24, d: "Massive tremor." },
            { name: "Earth Power", p: 22, d: "Ground eruption." },
            { name: "Dig", p: 18, d: "Digs then strikes." },
          ],
          ultimate: [
            { name: "Fissure", p: 36, d: "Ground-splitting force." },
            {
              name: "Precipice Blades",
              p: 38,
              d: "Earth blades erupt.",
              fx: [{ t: "foe", k: "vulnerable", a: 2 }],
            },
          ],
        },
        Flying: {
          basic: [
            { name: "Gust", p: 14, d: "A blast of wind." },
            { name: "Wing Attack", p: 16, d: "A wing strike." },
            { name: "Peck", p: 14, d: "A sharp peck." },
          ],
          special: [
            { name: "Air Slash", p: 21, d: "Sharp wind blade." },
            { name: "Roost", p: 0, d: "Restore 24 HP.", heal: 24 },
            {
              name: "Tailwind",
              p: 0,
              d: "Guard next hit.",
              fx: [{ t: "self", k: "guard", a: 1 }],
            },
          ],
          ultimate: [
            {
              name: "Hurricane",
              p: 35,
              d: "Raging storm.",
              fx: [{ t: "foe", k: "weaken", a: 2 }],
            },
            { name: "Brave Bird", p: 37, d: "Reckless dive." },
          ],
        },
        Psychic: {
          basic: [
            { name: "Confusion", p: 15, d: "Psychic wave." },
            { name: "Psybeam", p: 16, d: "A colorful beam." },
            { name: "Zen Headbutt", p: 16, d: "A focused headbutt." },
          ],
          special: [
            { name: "Psychic", p: 22, d: "Strong telekinesis." },
            {
              name: "Reflect",
              p: 0,
              d: "Guard next hit.",
              fx: [{ t: "self", k: "guard", a: 1 }],
            },
            { name: "Calm Mind", p: 0, d: "Restore 20 HP.", heal: 20 },
          ],
          ultimate: [
            {
              name: "Psystrike",
              p: 36,
              d: "Elite psychic blast.",
              fx: [{ t: "foe", k: "stun", a: 1 }],
            },
            { name: "Future Sight", p: 35, d: "Delayed psychic hit." },
          ],
        },
        Bug: {
          basic: [
            { name: "Bug Bite", p: 15, d: "A sharp bite." },
            { name: "Fury Cutter", p: 14, d: "Repeated slashes." },
            { name: "Struggle Bug", p: 14, d: "A weak struggle." },
          ],
          special: [
            { name: "X-Scissor", p: 21, d: "Cross slash." },
            { name: "U-Turn", p: 18, d: "Hit and retreat." },
            {
              name: "String Shot",
              p: 0,
              d: "Weakens foe.",
              fx: [{ t: "foe", k: "weaken", a: 2 }],
            },
          ],
          ultimate: [
            { name: "Megahorn", p: 35, d: "Massive horn charge." },
            {
              name: "Bug Buzz",
              p: 34,
              d: "Vibrating screech.",
              fx: [{ t: "foe", k: "weaken", a: 2 }],
            },
          ],
        },
        Rock: {
          basic: [
            { name: "Rock Throw", p: 15, d: "Hurls a rock." },
            { name: "Rock Slide", p: 17, d: "Falling rocks." },
            { name: "Smack Down", p: 15, d: "Knocks down." },
          ],
          special: [
            { name: "Stone Edge", p: 22, d: "Sharpened stone." },
            {
              name: "Stealth Rock",
              p: 14,
              d: "Traps and weakens.",
              fx: [{ t: "foe", k: "vulnerable", a: 2 }],
            },
            {
              name: "Rock Polish",
              p: 0,
              d: "Guard next hit.",
              fx: [{ t: "self", k: "guard", a: 1 }],
            },
          ],
          ultimate: [
            { name: "Rock Wrecker", p: 36, d: "Massive boulder." },
            {
              name: "Diamond Storm",
              p: 35,
              d: "Storm of gems.",
              fx: [{ t: "self", k: "guard", a: 1 }],
            },
          ],
        },
        Ghost: {
          basic: [
            { name: "Shadow Sneak", p: 15, d: "Strikes from shadows." },
            { name: "Lick", p: 13, d: "An eerie lick." },
            { name: "Hex", p: 16, d: "A cursed blast." },
          ],
          special: [
            { name: "Shadow Ball", p: 22, d: "Shadowy orb." },
            {
              name: "Curse",
              p: 0,
              d: "Poisons foe at a cost.",
              fx: [{ t: "foe", k: "poison", a: 3 }],
            },
            {
              name: "Will-o-Wisp",
              p: 8,
              d: "Ghostly flame weakens.",
              fx: [{ t: "foe", k: "weaken", a: 2 }],
            },
          ],
          ultimate: [
            { name: "Shadow Force", p: 36, d: "Vanish then strike." },
            {
              name: "Phantom Force",
              p: 35,
              d: "Phase through and hit.",
              fx: [{ t: "foe", k: "stun", a: 1 }],
            },
          ],
        },
        Dragon: {
          basic: [
            { name: "Dragon Breath", p: 16, d: "A hot breath." },
            { name: "Dragon Claw", p: 17, d: "Sharp dragon claws." },
            { name: "Twister", p: 14, d: "A draconic tornado." },
          ],
          special: [
            { name: "Dragon Pulse", p: 22, d: "A shock wave." },
            {
              name: "Dragon Dance",
              p: 0,
              d: "Guard and power up.",
              fx: [{ t: "self", k: "guard", a: 1 }],
            },
            { name: "Dragon Tail", p: 18, d: "A sweeping tail." },
          ],
          ultimate: [
            { name: "Outrage", p: 37, d: "Rampaging fury." },
            {
              name: "Draco Meteor",
              p: 38,
              d: "Meteors rain down.",
              fx: [{ t: "foe", k: "vulnerable", a: 2 }],
            },
          ],
        },
        Dark: {
          basic: [
            { name: "Bite", p: 15, d: "A sharp bite." },
            { name: "Pursuit", p: 14, d: "Chases and strikes." },
            { name: "Feint Attack", p: 15, d: "A sneaky strike." },
          ],
          special: [
            { name: "Dark Pulse", p: 22, d: "A wave of darkness." },
            {
              name: "Nasty Plot",
              p: 0,
              d: "Guard next hit.",
              fx: [{ t: "self", k: "guard", a: 1 }],
            },
            { name: "Sucker Punch", p: 20, d: "Strikes first." },
          ],
          ultimate: [
            {
              name: "Dark Void",
              p: 0,
              d: "Puts foe to deep sleep.",
              fx: [{ t: "foe", k: "stun", a: 2 }],
            },
            {
              name: "Night Daze",
              p: 35,
              d: "Explosive darkness.",
              fx: [{ t: "foe", k: "weaken", a: 2 }],
            },
          ],
        },
        Steel: {
          basic: [
            { name: "Metal Claw", p: 15, d: "Steel claws." },
            { name: "Iron Head", p: 17, d: "A heavy headbutt." },
            { name: "Bullet Punch", p: 14, d: "A swift metal jab." },
          ],
          special: [
            { name: "Flash Cannon", p: 22, d: "A beam of light." },
            {
              name: "Iron Defense",
              p: 0,
              d: "Guard next hit.",
              fx: [{ t: "self", k: "guard", a: 1 }],
            },
            { name: "Gyro Ball", p: 20, d: "Spinning steel hit." },
          ],
          ultimate: [
            { name: "Meteor Mash", p: 36, d: "A meteoric punch." },
            {
              name: "Heavy Slam",
              p: 35,
              d: "Crushing weight.",
              fx: [{ t: "foe", k: "stun", a: 1 }],
            },
          ],
        },
        Fairy: {
          basic: [
            { name: "Fairy Wind", p: 14, d: "A mystical breeze." },
            { name: "Disarming Voice", p: 15, d: "A charming cry." },
            { name: "Draining Kiss", p: 14, d: "Drains a little.", drain: 0.3 },
          ],
          special: [
            { name: "Moonblast", p: 22, d: "Lunar power." },
            {
              name: "Charm",
              p: 0,
              d: "Weakens foe greatly.",
              fx: [{ t: "foe", k: "weaken", a: 3 }],
            },
            { name: "Wish", p: 0, d: "Restore 24 HP.", heal: 24 },
          ],
          ultimate: [
            { name: "Dazzling Gleam", p: 35, d: "Blinding light." },
            {
              name: "Play Rough",
              p: 34,
              d: "Rough play that weakens.",
              fx: [{ t: "foe", k: "weaken", a: 2 }],
            },
          ],
        },
      };

      const UTIL_MOVES = [
        {
          name: "Protect",
          p: 0,
          d: "Guard next hit.",
          fx: [{ t: "self", k: "guard", a: 1 }],
        },
        { name: "Rest", p: 0, d: "Restore 30 HP.", heal: 30 },
        { name: "Recover", p: 0, d: "Restore 24 HP.", heal: 24 },
      ];

      // Legendary signature moves. When a Pokemon has an entry here, its 4th
      // move slot is replaced with this signature move (see buildMon line ~1907).
      const LEGENDARY_MOVES = {
        mewtwo: {
          name: "Psystrike Omega",
          type: "Psychic",
          power: 42,
          diff: 3,
          tier: "ultimate",
          desc: "Devastating psychic annihilation.",
          effects: [{ target: "foe", kind: "stun", amount: 1 }],
        },
        rayquaza: {
          name: "Dragon Ascent",
          type: "Dragon",
          power: 44,
          diff: 3,
          tier: "ultimate",
          desc: "Mythical sky attack.",
          effects: [{ target: "foe", kind: "vulnerable", amount: 3 }],
        },
        lugia: {
          name: "Aeroblast",
          type: "Flying",
          power: 40,
          diff: 3,
          tier: "ultimate",
          desc: "Legendary wind cannon.",
          effects: [{ target: "foe", kind: "weaken", amount: 3 }],
        },
        "ho-oh": {
          name: "Sacred Fire",
          type: "Fire",
          power: 42,
          diff: 3,
          tier: "ultimate",
          desc: "Holy flame that purges.",
          effects: [{ target: "foe", kind: "weaken", amount: 3 }],
        },
        groudon: {
          name: "Precipice Blades",
          type: "Ground",
          power: 43,
          diff: 3,
          tier: "ultimate",
          desc: "Earth-splitting power.",
          effects: [{ target: "foe", kind: "vulnerable", amount: 3 }],
        },
        kyogre: {
          name: "Origin Pulse",
          type: "Water",
          power: 42,
          diff: 3,
          tier: "ultimate",
          desc: "Primordial wave.",
          effects: [{ target: "foe", kind: "vulnerable", amount: 3 }],
        },
        dialga: {
          name: "Roar of Time",
          type: "Dragon",
          power: 44,
          diff: 3,
          tier: "ultimate",
          desc: "Distorts time itself.",
          effects: [{ target: "foe", kind: "stun", amount: 2 }],
        },
        palkia: {
          name: "Spacial Rend",
          type: "Dragon",
          power: 42,
          diff: 3,
          tier: "ultimate",
          desc: "Tears space apart.",
          effects: [{ target: "foe", kind: "vulnerable", amount: 3 }],
        },
        giratina: {
          name: "Shadow Force",
          type: "Ghost",
          power: 43,
          diff: 3,
          tier: "ultimate",
          desc: "Strikes from the distortion world.",
          effects: [
            { target: "foe", kind: "stun", amount: 1 },
            { target: "foe", kind: "vulnerable", amount: 2 },
          ],
        },
        zekrom: {
          name: "Bolt Strike",
          type: "Electric",
          power: 43,
          diff: 3,
          tier: "ultimate",
          desc: "Thunder incarnate.",
          effects: [{ target: "foe", kind: "stun", amount: 1 }],
        },
        reshiram: {
          name: "Blue Flare",
          type: "Fire",
          power: 43,
          diff: 3,
          tier: "ultimate",
          desc: "Blue flames consume all.",
          effects: [{ target: "foe", kind: "weaken", amount: 3 }],
        },
        xerneas: {
          name: "Geomancy",
          type: "Fairy",
          power: 40,
          diff: 3,
          tier: "ultimate",
          desc: "Life energy overflows.",
          effects: [{ target: "self", kind: "guard", amount: 2 }],
        },
        yveltal: {
          name: "Oblivion Wing",
          type: "Dark",
          power: 40,
          diff: 3,
          tier: "ultimate",
          desc: "Drains life force.",
          drain: 0.6,
          effects: [],
        },
        arceus: {
          name: "Judgment",
          type: "Normal",
          power: 45,
          diff: 3,
          tier: "ultimate",
          desc: "Divine power descends.",
          effects: [{ target: "foe", kind: "vulnerable", amount: 3 }],
        },
        mew: {
          name: "Genesis Wave",
          type: "Psychic",
          power: 38,
          diff: 3,
          tier: "ultimate",
          desc: "Origin of all moves.",
          effects: [{ target: "self", kind: "guard", amount: 2 }],
        },
        suicune: {
          name: "Aurora Beam",
          type: "Ice",
          power: 38,
          diff: 3,
          tier: "ultimate",
          desc: "Northern lights blast.",
          effects: [{ target: "foe", kind: "weaken", amount: 3 }],
        },
        darkrai: {
          name: "Dark Void",
          type: "Dark",
          power: 0,
          diff: 3,
          tier: "ultimate",
          desc: "Plunges foe into nightmare sleep.",
          effects: [
            { target: "foe", kind: "stun", amount: 2 },
            { target: "foe", kind: "poison", amount: 3 },
          ],
        },
        garchomp: {
          name: "Dragon Rush",
          type: "Dragon",
          power: 38,
          diff: 3,
          tier: "ultimate",
          desc: "Land shark's fury.",
          effects: [{ target: "foe", kind: "vulnerable", amount: 2 }],
        },
        lucario: {
          name: "Aura Sphere",
          type: "Fighting",
          power: 36,
          diff: 3,
          tier: "ultimate",
          desc: "Pure aura energy.",
          effects: [],
        },
        gengar: {
          name: "Shadow Curse",
          type: "Ghost",
          power: 36,
          diff: 3,
          tier: "ultimate",
          desc: "A devastating curse.",
          effects: [{ target: "foe", kind: "poison", amount: 4 }],
        },
        dragonite: {
          name: "Dragon Rush",
          type: "Dragon",
          power: 37,
          diff: 3,
          tier: "ultimate",
          desc: "Legendary dragon charge.",
          effects: [{ target: "foe", kind: "stun", amount: 1 }],
        },
      };

      // ========== ABILITIES ==========
      // Each ability has a trigger field that determines when it activates:
      //   "attack"       - +% damage when HP is low (Blaze, Torrent, Overgrow, Swarm)
      //   "defend"       - chance to stun attacker on contact (Static)
      //   "immunity"     - negates damage of given type (Levitate -> Ground)
      //   "endure"       - survives a fatal hit at 1 HP once (Sturdy)
      //   "start"        - fires at battle start (Intimidate)
      //   "endturn"      - fires at end of each turn (Regenerator)
      //   "defend_type"  - halves damage from listed types (Thick Fat)
      //   "stab"         - boosts STAB multiplier (Adaptability)
      //   "defend_poison"- chance to poison attacker on contact (PoisonPoint)
      //   "punch"        - boosts punch/fist-move power (IronFist)
      //   "guts"         - +ATK when poisoned (Guts)
      //   "passive_def"  - always-active DEF boost (DragonScale)
      //   "crit_boost"   - increases crit chance (SpeedBoost)
      const ABILITIES = {
        Blaze:      {name:"Blaze",      desc:"+30% Fire dmg when below 1/3 HP", trigger:"attack", type:"Fire"},
        Torrent:    {name:"Torrent",    desc:"+30% Water dmg when below 1/3 HP", trigger:"attack", type:"Water"},
        Overgrow:   {name:"Overgrow",   desc:"+30% Grass dmg when below 1/3 HP", trigger:"attack", type:"Grass"},
        Swarm:      {name:"Swarm",      desc:"+30% Bug dmg when below 1/3 HP", trigger:"attack", type:"Bug"},
        Static:     {name:"Static",     desc:"30% to stun attacker on contact", trigger:"defend"},
        Levitate:   {name:"Levitate",   desc:"Immune to Ground moves", trigger:"immunity", type:"Ground"},
        Sturdy:     {name:"Sturdy",     desc:"Survives a KO with 1 HP once", trigger:"endure"},
        Intimidate: {name:"Intimidate", desc:"Weaken foe at battle start", trigger:"start"},
        Regenerator:{name:"Regenerator",desc:"Heal 10% HP at end of each turn", trigger:"endturn"},
        ThickFat:   {name:"ThickFat",   desc:"Halves Fire and Ice damage taken", trigger:"defend_type", types:["Fire","Ice"]},
        Adaptability:{name:"Adaptability",desc:"STAB bonus is 1.5x instead of 1.2x", trigger:"stab"},
        PoisonPoint:{name:"PoisonPoint",desc:"30% to poison attacker on contact", trigger:"defend_poison"},
        IronFist:   {name:"IronFist",   desc:"+20% power for punch/fist moves", trigger:"punch"},
        Guts:       {name:"Guts",       desc:"+40% ATK when poisoned", trigger:"guts"},
        DragonScale:{name:"DragonScale",desc:"+15% DEF at all times", trigger:"passive_def"},
        SpeedBoost: {name:"SpeedBoost", desc:"+10% crit chance", trigger:"crit_boost"}
      };

      const TYPE_ABILITIES = {
        Fire:["Blaze","Blaze","Blaze"],
        Water:["Torrent","Torrent","Torrent"],
        Grass:["Overgrow","Overgrow","Overgrow"],
        Electric:["Static","Static","SpeedBoost"],
        Bug:["Swarm","Swarm","Swarm"],
        Psychic:["Levitate","Levitate","Regenerator"],
        Rock:["Sturdy","Sturdy","Sturdy"],
        Steel:["Sturdy","ThickFat","Sturdy"],
        Normal:["Adaptability","Guts","Intimidate"],
        Fighting:["Guts","IronFist","Intimidate"],
        Poison:["PoisonPoint","PoisonPoint","Guts"],
        Ground:["Intimidate","Sturdy","Guts"],
        Flying:["SpeedBoost","Intimidate","SpeedBoost"],
        Ghost:["Levitate","Levitate","Regenerator"],
        Dragon:["DragonScale","DragonScale","Intimidate"],
        Dark:["Intimidate","Guts","Intimidate"],
        Fairy:["Regenerator","Regenerator","Adaptability"],
        Ice:["ThickFat","ThickFat","Sturdy"]
      };

      function assignAbility(type, seed) {
        const pool = TYPE_ABILITIES[type] || TYPE_ABILITIES.Normal;
        return ABILITIES[pool[seed % pool.length]] || ABILITIES.Adaptability;
      }

      // ========== HELD ITEMS ==========
      const HELD_ITEMS = [
        {id:"leftovers",  name:"Leftovers",    icon:"\u{1F34E}", desc:"Heal 8% HP each turn",         price:300, slot:"held"},
        {id:"choiceband", name:"Choice Band",  icon:"\u{1F397}️", desc:"+35% damage dealt",     price:400, slot:"held"},
        {id:"focussash",  name:"Focus Sash",   icon:"\u{1F38C}", desc:"Survive one KO at 1 HP (once)", price:350, slot:"held"},
        {id:"scopelens",  name:"Scope Lens",   icon:"\u{1F50D}", desc:"+12% crit chance",            price:250, slot:"held"},
        {id:"typeberry",  name:"Resist Berry", icon:"\u{1FAD0}", desc:"Halve one super-effective hit", price:275, slot:"held"},
        {id:"lifeorb",    name:"Life Orb",     icon:"\u{1F52E}", desc:"+20% dmg, lose 8% HP per atk", price:350, slot:"held"}
      ];

      // ========== RARITY SYSTEM ==========
      // Each rarity tier defines stat ranges as [min, max] — the final stat is
      // interpolated within this range using the Pokemon's seed (0-99). The
      // "slots" array determines which move tiers (basic/special/ultimate) fill
      // the 4 move slots. Higher rarities have better stats, better move tiers,
      // lower catch rates, and higher XP yield.
      const RARITY_STATS = {
        Common: {
          hp: [85, 105],
          atk: [13, 17],
          def: [7, 10],
          slots: ["basic", "basic", "special", "special"],
          catchRate: 0.6,
          xpYield: 30,
        },
        Uncommon: {
          hp: [100, 120],
          atk: [16, 20],
          def: [9, 12],
          slots: ["basic", "special", "special", "ultimate"],
          catchRate: 0.35,
          xpYield: 50,
        },
        Rare: {
          hp: [115, 140],
          atk: [19, 24],
          def: [11, 15],
          slots: ["basic", "special", "ultimate", "ultimate"],
          catchRate: 0.15,
          xpYield: 80,
        },
        Legendary: {
          hp: [135, 170],
          atk: [23, 30],
          def: [13, 18],
          slots: ["basic", "special", "ultimate", "ultimate"],
          catchRate: 0.05,
          xpYield: 150,
        },
      };

      // ========== POKEDEX (200+ Pokemon) ==========
      // Format: [showdownId, name, type1, type2|null, rarity, seed(0-99)]
      // The seed is used by buildMon to spread stats within the rarity range and
      // to deterministically assign moves from the type's move pool.
      const DEX = [
        // --- Gen 1 ---
        ["bulbasaur", "Bulbasaur", "Grass", "Poison", "Common", 35],
        ["ivysaur", "Ivysaur", "Grass", "Poison", "Uncommon", 50],
        ["venusaur", "Venusaur", "Grass", "Poison", "Rare", 72],
        ["charmander", "Charmander", "Fire", null, "Common", 40],
        ["charmeleon", "Charmeleon", "Fire", null, "Uncommon", 55],
        ["charizard", "Charizard", "Fire", "Flying", "Rare", 80],
        ["squirtle", "Squirtle", "Water", null, "Common", 30],
        ["wartortle", "Wartortle", "Water", null, "Uncommon", 48],
        ["blastoise", "Blastoise", "Water", null, "Rare", 75],
        ["caterpie", "Caterpie", "Bug", null, "Common", 10],
        ["butterfree", "Butterfree", "Bug", "Flying", "Uncommon", 35],
        ["pidgey", "Pidgey", "Normal", "Flying", "Common", 20],
        ["pidgeot", "Pidgeot", "Normal", "Flying", "Uncommon", 55],
        ["rattata", "Rattata", "Normal", null, "Common", 15],
        ["pikachu", "Pikachu", "Electric", null, "Common", 50],
        ["raichu", "Raichu", "Electric", null, "Uncommon", 65],
        ["sandshrew", "Sandshrew", "Ground", null, "Common", 25],
        ["sandslash", "Sandslash", "Ground", null, "Uncommon", 55],
        ["nidoqueen", "Nidoqueen", "Poison", "Ground", "Uncommon", 60],
        ["nidoking", "Nidoking", "Poison", "Ground", "Uncommon", 70],
        ["clefairy", "Clefairy", "Fairy", null, "Common", 30],
        ["clefable", "Clefable", "Fairy", null, "Uncommon", 60],
        ["vulpix", "Vulpix", "Fire", null, "Common", 35],
        ["ninetales", "Ninetales", "Fire", null, "Uncommon", 65],
        ["jigglypuff", "Jigglypuff", "Normal", "Fairy", "Common", 25],
        ["wigglytuff", "Wigglytuff", "Normal", "Fairy", "Uncommon", 50],
        ["zubat", "Zubat", "Poison", "Flying", "Common", 15],
        ["golbat", "Golbat", "Poison", "Flying", "Uncommon", 40],
        ["oddish", "Oddish", "Grass", "Poison", "Common", 20],
        ["vileplume", "Vileplume", "Grass", "Poison", "Uncommon", 55],
        ["growlithe", "Growlithe", "Fire", null, "Common", 45],
        ["arcanine", "Arcanine", "Fire", null, "Rare", 75],
        ["poliwag", "Poliwag", "Water", null, "Common", 20],
        ["poliwrath", "Poliwrath", "Water", "Fighting", "Uncommon", 60],
        ["abra", "Abra", "Psychic", null, "Common", 40],
        ["kadabra", "Kadabra", "Psychic", null, "Uncommon", 60],
        ["alakazam", "Alakazam", "Psychic", null, "Rare", 85],
        ["machop", "Machop", "Fighting", null, "Common", 35],
        ["machoke", "Machoke", "Fighting", null, "Uncommon", 50],
        ["machamp", "Machamp", "Fighting", null, "Rare", 75],
        ["geodude", "Geodude", "Rock", "Ground", "Common", 20],
        ["golem", "Golem", "Rock", "Ground", "Uncommon", 60],
        ["ponyta", "Ponyta", "Fire", null, "Common", 38],
        ["rapidash", "Rapidash", "Fire", null, "Uncommon", 58],
        ["slowpoke", "Slowpoke", "Water", "Psychic", "Common", 15],
        ["slowbro", "Slowbro", "Water", "Psychic", "Uncommon", 50],
        ["magnemite", "Magnemite", "Electric", "Steel", "Common", 30],
        ["magneton", "Magneton", "Electric", "Steel", "Uncommon", 55],
        ["gastly", "Gastly", "Ghost", "Poison", "Common", 35],
        ["haunter", "Haunter", "Ghost", "Poison", "Uncommon", 55],
        ["gengar", "Gengar", "Ghost", "Poison", "Rare", 82],
        ["onix", "Onix", "Rock", "Ground", "Common", 25],
        ["drowzee", "Drowzee", "Psychic", null, "Common", 20],
        ["hypno", "Hypno", "Psychic", null, "Uncommon", 50],
        ["krabby", "Krabby", "Water", null, "Common", 25],
        ["voltorb", "Voltorb", "Electric", null, "Common", 30],
        ["electrode", "Electrode", "Electric", null, "Uncommon", 55],
        ["exeggcute", "Exeggcute", "Grass", "Psychic", "Common", 20],
        ["exeggutor", "Exeggutor", "Grass", "Psychic", "Uncommon", 55],
        ["cubone", "Cubone", "Ground", null, "Common", 30],
        ["marowak", "Marowak", "Ground", null, "Uncommon", 55],
        ["hitmonlee", "Hitmonlee", "Fighting", null, "Uncommon", 65],
        ["hitmonchan", "Hitmonchan", "Fighting", null, "Uncommon", 60],
        ["lickitung", "Lickitung", "Normal", null, "Common", 25],
        ["koffing", "Koffing", "Poison", null, "Common", 20],
        ["weezing", "Weezing", "Poison", null, "Uncommon", 50],
        ["rhyhorn", "Rhyhorn", "Ground", "Rock", "Common", 30],
        ["rhydon", "Rhydon", "Ground", "Rock", "Uncommon", 65],
        ["chansey", "Chansey", "Normal", null, "Uncommon", 30],
        ["tangela", "Tangela", "Grass", null, "Common", 35],
        ["horsea", "Horsea", "Water", null, "Common", 30],
        ["seadra", "Seadra", "Water", null, "Uncommon", 55],
        ["staryu", "Staryu", "Water", null, "Common", 35],
        ["starmie", "Starmie", "Water", "Psychic", "Uncommon", 65],
        ["scyther", "Scyther", "Bug", "Flying", "Uncommon", 70],
        ["jynx", "Jynx", "Ice", "Psychic", "Uncommon", 50],
        ["electabuzz", "Electabuzz", "Electric", null, "Uncommon", 65],
        ["magmar", "Magmar", "Fire", null, "Uncommon", 65],
        ["pinsir", "Pinsir", "Bug", null, "Uncommon", 60],
        ["tauros", "Tauros", "Normal", null, "Uncommon", 65],
        ["magikarp", "Magikarp", "Water", null, "Common", 5],
        ["gyarados", "Gyarados", "Water", "Flying", "Rare", 80],
        ["lapras", "Lapras", "Water", "Ice", "Rare", 60],
        ["ditto", "Ditto", "Normal", null, "Uncommon", 40],
        ["eevee", "Eevee", "Normal", null, "Common", 45],
        ["vaporeon", "Vaporeon", "Water", null, "Uncommon", 65],
        ["jolteon", "Jolteon", "Electric", null, "Uncommon", 70],
        ["flareon", "Flareon", "Fire", null, "Uncommon", 68],
        ["snorlax", "Snorlax", "Normal", null, "Rare", 50],
        ["dratini", "Dratini", "Dragon", null, "Uncommon", 40],
        ["dragonair", "Dragonair", "Dragon", null, "Uncommon", 55],
        ["dragonite", "Dragonite", "Dragon", "Flying", "Rare", 85],
        ["mewtwo", "Mewtwo", "Psychic", null, "Legendary", 95],
        ["mew", "Mew", "Psychic", null, "Legendary", 80],

        // --- Gen 2 ---
        ["chikorita", "Chikorita", "Grass", null, "Common", 30],
        ["bayleef", "Bayleef", "Grass", null, "Uncommon", 48],
        ["meganium", "Meganium", "Grass", null, "Rare", 60],
        ["cyndaquil", "Cyndaquil", "Fire", null, "Common", 35],
        ["quilava", "Quilava", "Fire", null, "Uncommon", 50],
        ["typhlosion", "Typhlosion", "Fire", null, "Rare", 72],
        ["totodile", "Totodile", "Water", null, "Common", 38],
        ["croconaw", "Croconaw", "Water", null, "Uncommon", 52],
        ["feraligatr", "Feraligatr", "Water", null, "Rare", 75],
        ["sentret", "Sentret", "Normal", null, "Common", 12],
        ["hoothoot", "Hoothoot", "Normal", "Flying", "Common", 15],
        ["noctowl", "Noctowl", "Normal", "Flying", "Uncommon", 40],
        ["mareep", "Mareep", "Electric", null, "Common", 28],
        ["flaaffy", "Flaaffy", "Electric", null, "Uncommon", 45],
        ["ampharos", "Ampharos", "Electric", null, "Rare", 68],
        ["marill", "Marill", "Water", "Fairy", "Common", 25],
        ["azumarill", "Azumarill", "Water", "Fairy", "Uncommon", 55],
        ["sudowoodo", "Sudowoodo", "Rock", null, "Uncommon", 45],
        ["espeon", "Espeon", "Psychic", null, "Uncommon", 70],
        ["umbreon", "Umbreon", "Dark", null, "Uncommon", 55],
        ["murkrow", "Murkrow", "Dark", "Flying", "Common", 35],
        ["slowking", "Slowking", "Water", "Psychic", "Uncommon", 55],
        ["misdreavus", "Misdreavus", "Ghost", null, "Common", 35],
        ["snubbull", "Snubbull", "Fairy", null, "Common", 25],
        ["granbull", "Granbull", "Fairy", null, "Uncommon", 50],
        ["scizor", "Scizor", "Bug", "Steel", "Rare", 78],
        ["heracross", "Heracross", "Bug", "Fighting", "Uncommon", 65],
        ["sneasel", "Sneasel", "Dark", "Ice", "Uncommon", 60],
        ["teddiursa", "Teddiursa", "Normal", null, "Common", 30],
        ["ursaring", "Ursaring", "Normal", null, "Uncommon", 65],
        ["swinub", "Swinub", "Ice", "Ground", "Common", 20],
        ["piloswine", "Piloswine", "Ice", "Ground", "Uncommon", 50],
        ["skarmory", "Skarmory", "Steel", "Flying", "Uncommon", 55],
        ["houndour", "Houndour", "Dark", "Fire", "Common", 35],
        ["houndoom", "Houndoom", "Dark", "Fire", "Uncommon", 65],
        ["kingdra", "Kingdra", "Water", "Dragon", "Rare", 70],
        ["larvitar", "Larvitar", "Rock", "Ground", "Uncommon", 40],
        ["pupitar", "Pupitar", "Rock", "Ground", "Uncommon", 55],
        ["tyranitar", "Tyranitar", "Rock", "Dark", "Rare", 88],
        ["lugia", "Lugia", "Psychic", "Flying", "Legendary", 90],
        ["hooh", "Ho-Oh", "Fire", "Flying", "Legendary", 92],
        ["suicune", "Suicune", "Water", null, "Legendary", 78],

        // --- Gen 3 ---
        ["treecko", "Treecko", "Grass", null, "Common", 38],
        ["grovyle", "Grovyle", "Grass", null, "Uncommon", 52],
        ["sceptile", "Sceptile", "Grass", null, "Rare", 74],
        ["torchic", "Torchic", "Fire", null, "Common", 35],
        ["combusken", "Combusken", "Fire", "Fighting", "Uncommon", 52],
        ["blaziken", "Blaziken", "Fire", "Fighting", "Rare", 82],
        ["mudkip", "Mudkip", "Water", null, "Common", 32],
        ["marshtomp", "Marshtomp", "Water", "Ground", "Uncommon", 48],
        ["swampert", "Swampert", "Water", "Ground", "Rare", 72],
        ["zigzagoon", "Zigzagoon", "Normal", null, "Common", 10],
        ["ralts", "Ralts", "Psychic", "Fairy", "Common", 30],
        ["kirlia", "Kirlia", "Psychic", "Fairy", "Uncommon", 48],
        ["gardevoir", "Gardevoir", "Psychic", "Fairy", "Rare", 75],
        ["shroomish", "Shroomish", "Grass", null, "Common", 22],
        ["breloom", "Breloom", "Grass", "Fighting", "Uncommon", 60],
        ["slakoth", "Slakoth", "Normal", null, "Common", 15],
        ["slaking", "Slaking", "Normal", null, "Rare", 90],
        ["nosepass", "Nosepass", "Rock", null, "Common", 25],
        ["aron", "Aron", "Steel", "Rock", "Common", 28],
        ["lairon", "Lairon", "Steel", "Rock", "Uncommon", 48],
        ["aggron", "Aggron", "Steel", "Rock", "Rare", 72],
        ["meditite", "Meditite", "Fighting", "Psychic", "Common", 30],
        ["medicham", "Medicham", "Fighting", "Psychic", "Uncommon", 55],
        ["electrike", "Electrike", "Electric", null, "Common", 30],
        ["manectric", "Manectric", "Electric", null, "Uncommon", 60],
        ["carvanha", "Carvanha", "Water", "Dark", "Common", 35],
        ["sharpedo", "Sharpedo", "Water", "Dark", "Uncommon", 65],
        ["trapinch", "Trapinch", "Ground", null, "Common", 25],
        ["vibrava", "Vibrava", "Ground", "Dragon", "Uncommon", 45],
        ["flygon", "Flygon", "Ground", "Dragon", "Rare", 70],
        ["swablu", "Swablu", "Normal", "Flying", "Common", 20],
        ["altaria", "Altaria", "Dragon", "Flying", "Uncommon", 55],
        ["zangoose", "Zangoose", "Normal", null, "Uncommon", 62],
        ["seviper", "Seviper", "Poison", null, "Uncommon", 58],
        ["absol", "Absol", "Dark", null, "Uncommon", 70],
        ["snorunt", "Snorunt", "Ice", null, "Common", 22],
        ["glalie", "Glalie", "Ice", null, "Uncommon", 55],
        ["bagon", "Bagon", "Dragon", null, "Uncommon", 40],
        ["shelgon", "Shelgon", "Dragon", null, "Uncommon", 55],
        ["salamence", "Salamence", "Dragon", "Flying", "Rare", 85],
        ["beldum", "Beldum", "Steel", "Psychic", "Uncommon", 35],
        ["metang", "Metang", "Steel", "Psychic", "Uncommon", 50],
        ["metagross", "Metagross", "Steel", "Psychic", "Rare", 80],
        ["rayquaza", "Rayquaza", "Dragon", "Flying", "Legendary", 99],
        ["groudon", "Groudon", "Ground", null, "Legendary", 95],
        ["kyogre", "Kyogre", "Water", null, "Legendary", 95],

        // --- Gen 4 ---
        ["turtwig", "Turtwig", "Grass", null, "Common", 30],
        ["grotle", "Grotle", "Grass", null, "Uncommon", 48],
        ["torterra", "Torterra", "Grass", "Ground", "Rare", 65],
        ["chimchar", "Chimchar", "Fire", null, "Common", 38],
        ["monferno", "Monferno", "Fire", "Fighting", "Uncommon", 52],
        ["infernape", "Infernape", "Fire", "Fighting", "Rare", 78],
        ["piplup", "Piplup", "Water", null, "Common", 30],
        ["prinplup", "Prinplup", "Water", null, "Uncommon", 48],
        ["empoleon", "Empoleon", "Water", "Steel", "Rare", 70],
        ["starly", "Starly", "Normal", "Flying", "Common", 18],
        ["staraptor", "Staraptor", "Normal", "Flying", "Uncommon", 68],
        ["shinx", "Shinx", "Electric", null, "Common", 30],
        ["luxio", "Luxio", "Electric", null, "Uncommon", 50],
        ["luxray", "Luxray", "Electric", null, "Rare", 70],
        ["roserade", "Roserade", "Grass", "Poison", "Uncommon", 65],
        ["cranidos", "Cranidos", "Rock", null, "Common", 40],
        ["rampardos", "Rampardos", "Rock", null, "Uncommon", 75],
        ["shieldon", "Shieldon", "Rock", "Steel", "Common", 20],
        ["bastiodon", "Bastiodon", "Rock", "Steel", "Uncommon", 35],
        ["drifloon", "Drifloon", "Ghost", "Flying", "Common", 25],
        ["drifblim", "Drifblim", "Ghost", "Flying", "Uncommon", 45],
        ["buneary", "Buneary", "Normal", null, "Common", 30],
        ["lopunny", "Lopunny", "Normal", null, "Uncommon", 55],
        ["honchkrow", "Honchkrow", "Dark", "Flying", "Uncommon", 65],
        ["mismagius", "Mismagius", "Ghost", null, "Uncommon", 60],
        ["gible", "Gible", "Dragon", "Ground", "Uncommon", 40],
        ["gabite", "Gabite", "Dragon", "Ground", "Uncommon", 55],
        ["garchomp", "Garchomp", "Dragon", "Ground", "Rare", 88],
        ["riolu", "Riolu", "Fighting", null, "Common", 42],
        ["lucario", "Lucario", "Fighting", "Steel", "Rare", 78],
        ["hippopotas", "Hippopotas", "Ground", null, "Common", 22],
        ["hippowdon", "Hippowdon", "Ground", null, "Uncommon", 55],
        ["skorupi", "Skorupi", "Poison", "Bug", "Common", 28],
        ["drapion", "Drapion", "Poison", "Dark", "Uncommon", 60],
        ["croagunk", "Croagunk", "Poison", "Fighting", "Common", 32],
        ["toxicroak", "Toxicroak", "Poison", "Fighting", "Uncommon", 62],
        ["snover", "Snover", "Grass", "Ice", "Common", 22],
        ["abomasnow", "Abomasnow", "Grass", "Ice", "Uncommon", 50],
        ["weavile", "Weavile", "Dark", "Ice", "Rare", 72],
        ["magnezone", "Magnezone", "Electric", "Steel", "Rare", 65],
        ["electivire", "Electivire", "Electric", null, "Rare", 75],
        ["magmortar", "Magmortar", "Fire", null, "Rare", 75],
        ["togekiss", "Togekiss", "Fairy", "Flying", "Rare", 65],
        ["glaceon", "Glaceon", "Ice", null, "Uncommon", 60],
        ["leafeon", "Leafeon", "Grass", null, "Uncommon", 58],
        ["mamoswine", "Mamoswine", "Ice", "Ground", "Rare", 70],
        ["gallade", "Gallade", "Psychic", "Fighting", "Rare", 72],
        ["froslass", "Froslass", "Ice", "Ghost", "Uncommon", 55],
        ["dialga", "Dialga", "Steel", "Dragon", "Legendary", 95],
        ["palkia", "Palkia", "Water", "Dragon", "Legendary", 92],
        ["giratina", "Giratina", "Ghost", "Dragon", "Legendary", 90],
        ["darkrai", "Darkrai", "Dark", null, "Legendary", 88],
        ["arceus", "Arceus", "Normal", null, "Legendary", 99],

        // --- Gen 5 ---
        ["snivy", "Snivy", "Grass", null, "Common", 32],
        ["servine", "Servine", "Grass", null, "Uncommon", 48],
        ["serperior", "Serperior", "Grass", null, "Rare", 65],
        ["tepig", "Tepig", "Fire", null, "Common", 30],
        ["pignite", "Pignite", "Fire", "Fighting", "Uncommon", 48],
        ["emboar", "Emboar", "Fire", "Fighting", "Rare", 68],
        ["oshawott", "Oshawott", "Water", null, "Common", 30],
        ["dewott", "Dewott", "Water", null, "Uncommon", 48],
        ["samurott", "Samurott", "Water", null, "Rare", 70],
        ["lillipup", "Lillipup", "Normal", null, "Common", 15],
        ["herdier", "Herdier", "Normal", null, "Uncommon", 40],
        ["stoutland", "Stoutland", "Normal", null, "Uncommon", 60],
        ["roggenrola", "Roggenrola", "Rock", null, "Common", 18],
        ["boldore", "Boldore", "Rock", null, "Uncommon", 42],
        ["gigalith", "Gigalith", "Rock", null, "Rare", 65],
        ["timburr", "Timburr", "Fighting", null, "Common", 28],
        ["gurdurr", "Gurdurr", "Fighting", null, "Uncommon", 48],
        ["conkeldurr", "Conkeldurr", "Fighting", null, "Rare", 72],
        ["sandile", "Sandile", "Ground", "Dark", "Common", 30],
        ["krokorok", "Krokorok", "Ground", "Dark", "Uncommon", 50],
        ["krookodile", "Krookodile", "Ground", "Dark", "Rare", 72],
        ["darumaka", "Darumaka", "Fire", null, "Common", 40],
        ["darmanitan", "Darmanitan", "Fire", null, "Uncommon", 75],
        ["scraggy", "Scraggy", "Dark", "Fighting", "Common", 30],
        ["scrafty", "Scrafty", "Dark", "Fighting", "Uncommon", 58],
        ["zorua", "Zorua", "Dark", null, "Uncommon", 42],
        ["zoroark", "Zoroark", "Dark", null, "Rare", 72],
        ["ferroseed", "Ferroseed", "Grass", "Steel", "Common", 18],
        ["ferrothorn", "Ferrothorn", "Grass", "Steel", "Uncommon", 40],
        ["litwick", "Litwick", "Ghost", "Fire", "Common", 30],
        ["lampent", "Lampent", "Ghost", "Fire", "Uncommon", 48],
        ["chandelure", "Chandelure", "Ghost", "Fire", "Rare", 75],
        ["axew", "Axew", "Dragon", null, "Uncommon", 38],
        ["fraxure", "Fraxure", "Dragon", null, "Uncommon", 55],
        ["haxorus", "Haxorus", "Dragon", null, "Rare", 82],
        ["cubchoo", "Cubchoo", "Ice", null, "Common", 20],
        ["beartic", "Beartic", "Ice", null, "Uncommon", 55],
        ["mienfoo", "Mienfoo", "Fighting", null, "Common", 32],
        ["mienshao", "Mienshao", "Fighting", null, "Uncommon", 65],
        ["pawniard", "Pawniard", "Dark", "Steel", "Common", 30],
        ["bisharp", "Bisharp", "Dark", "Steel", "Uncommon", 68],
        ["deino", "Deino", "Dark", "Dragon", "Uncommon", 35],
        ["zweilous", "Zweilous", "Dark", "Dragon", "Uncommon", 52],
        ["hydreigon", "Hydreigon", "Dark", "Dragon", "Rare", 85],
        ["volcarona", "Volcarona", "Bug", "Fire", "Rare", 78],
        ["zekrom", "Zekrom", "Dragon", "Electric", "Legendary", 95],
        ["reshiram", "Reshiram", "Dragon", "Fire", "Legendary", 95],

        // --- Gen 6 ---
        ["chespin", "Chespin", "Grass", null, "Common", 28],
        ["quilladin", "Quilladin", "Grass", null, "Uncommon", 45],
        ["chesnaught", "Chesnaught", "Grass", "Fighting", "Rare", 65],
        ["fennekin", "Fennekin", "Fire", null, "Common", 32],
        ["braixen", "Braixen", "Fire", null, "Uncommon", 48],
        ["delphox", "Delphox", "Fire", "Psychic", "Rare", 68],
        ["froakie", "Froakie", "Water", null, "Common", 35],
        ["frogadier", "Frogadier", "Water", null, "Uncommon", 50],
        ["greninja", "Greninja", "Water", "Dark", "Rare", 80],
        ["fletchling", "Fletchling", "Normal", "Flying", "Common", 18],
        ["fletchinder", "Fletchinder", "Fire", "Flying", "Uncommon", 45],
        ["talonflame", "Talonflame", "Fire", "Flying", "Uncommon", 68],
        ["honedge", "Honedge", "Steel", "Ghost", "Common", 30],
        ["doublade", "Doublade", "Steel", "Ghost", "Uncommon", 50],
        ["aegislash", "Aegislash", "Steel", "Ghost", "Rare", 72],
        ["sylveon", "Sylveon", "Fairy", null, "Uncommon", 62],
        ["goomy", "Goomy", "Dragon", null, "Common", 22],
        ["sliggoo", "Sliggoo", "Dragon", null, "Uncommon", 45],
        ["goodra", "Goodra", "Dragon", null, "Rare", 65],
        ["phantump", "Phantump", "Ghost", "Grass", "Common", 25],
        ["trevenant", "Trevenant", "Ghost", "Grass", "Uncommon", 50],
        ["noibat", "Noibat", "Flying", "Dragon", "Common", 28],
        ["noivern", "Noivern", "Flying", "Dragon", "Uncommon", 65],
        ["xerneas", "Xerneas", "Fairy", null, "Legendary", 90],
        ["yveltal", "Yveltal", "Dark", "Flying", "Legendary", 92],

        // --- Gen 7+ picks ---
        ["rowlet", "Rowlet", "Grass", "Flying", "Common", 30],
        ["decidueye", "Decidueye", "Grass", "Ghost", "Rare", 68],
        ["litten", "Litten", "Fire", null, "Common", 35],
        ["incineroar", "Incineroar", "Fire", "Dark", "Rare", 75],
        ["popplio", "Popplio", "Water", null, "Common", 28],
        ["primarina", "Primarina", "Water", "Fairy", "Rare", 65],
        ["rockruff", "Rockruff", "Rock", null, "Common", 30],
        ["lycanroc", "Lycanroc", "Rock", null, "Uncommon", 65],
        ["mimikyu", "Mimikyu", "Ghost", "Fairy", "Uncommon", 55],
        ["grookey", "Grookey", "Grass", null, "Common", 30],
        ["cinderace", "Cinderace", "Fire", null, "Rare", 75],
        ["sobble", "Sobble", "Water", null, "Common", 28],
        ["inteleon", "Inteleon", "Water", null, "Rare", 72],
        ["corviknight", "Corviknight", "Flying", "Steel", "Rare", 62],
        ["toxtricity", "Toxtricity", "Electric", "Poison", "Uncommon", 65],
        ["dragapult", "Dragapult", "Dragon", "Ghost", "Rare", 85],
        ["grimmsnarl", "Grimmsnarl", "Dark", "Fairy", "Uncommon", 58],
        ["sprigatito", "Sprigatito", "Grass", null, "Common", 32],
        ["fuecoco", "Fuecoco", "Fire", null, "Common", 30],
        ["quaquaval", "Quaquaval", "Water", "Fighting", "Rare", 70],
        ["ceruledge", "Ceruledge", "Fire", "Ghost", "Rare", 75],
        ["kingambit", "Kingambit", "Dark", "Steel", "Rare", 80],
        ["baxcalibur", "Baxcalibur", "Dragon", "Ice", "Rare", 78],
        ["crobat", "Crobat", "Poison", "Flying", "Uncommon", 58],
        ["blissey", "Blissey", "Normal", null, "Uncommon", 30],
        ["deoxys", "Deoxys", "Psychic", null, "Legendary", 90],
        ["solrock", "Solrock", "Rock", "Psychic", "Uncommon", 50],
      ];

      // ========== STARTERS (curated subset for initial pick) ==========
      const STARTER_IDS = [
        "bulbasaur",
        "charmander",
        "squirtle",
        "pikachu",
        "eevee",
        "riolu",
        "gastly",
        "abra",
        "machop",
        "ralts",
        "shinx",
        "growlithe",
        "dratini",
        "larvitar",
        "beldum",
        "froakie",
        "honedge",
        "mimikyu",
      ];

      const RUN_PLAN = [
        {
          kind: "wild",
          label: "Field Study",
          subtitle: "A catchable warm-up encounter to build momentum.",
          allowCatch: true,
          levelOffset: -1,
          rarityWeights: {
            Common: 0.78,
            Uncommon: 0.22,
            Rare: 0,
            Legendary: 0,
          },
          accent: "#78c850",
        },
        {
          kind: "trainer",
          trainerName: "Anna",
          trainerTitle: "GSI Concept Crusher",
          trainerSprite: "anna.png",
          subtitle: "Trainer-owned Pokemon cannot be caught.",
          taunt: "Fast questions, faster punishments.",
          allowCatch: false,
          aceId: "alakazam",
          levelOffset: 0,
          hpMult: 1.08,
          atkMult: 1.08,
          defMult: 1.05,
          rewardMult: 1.2,
          xpMult: 1.15,
          accent: "#57d6ff",
        },
        {
          kind: "trainer",
          trainerName: "Monica",
          trainerTitle: "GSI Section Strategist",
          trainerSprite: "monica.png",
          subtitle: "Another GSI checkpoint before the rare habitat opens.",
          taunt: "Sections reward preparation. Keep your answers precise.",
          allowCatch: false,
          aceId: "gardevoir",
          levelOffset: 0,
          hpMult: 1.09,
          atkMult: 1.09,
          defMult: 1.06,
          rewardMult: 1.2,
          xpMult: 1.15,
          accent: "#8bd3ff",
        },
        {
          kind: "wild",
          label: "Rare Habitat",
          subtitle: "A stronger wild encounter with better capture upside.",
          allowCatch: true,
          levelOffset: 0,
          rarityWeights: {
            Common: 0.35,
            Uncommon: 0.45,
            Rare: 0.2,
            Legendary: 0,
          },
          rewardMult: 1.05,
          xpMult: 1.05,
          accent: "#00e5ff",
        },
        {
          kind: "trainer",
          trainerName: "Annie",
          trainerTitle: "GSI Lab Partner",
          trainerSprite: "annie.png",
          subtitle: "One-mon duels still need real structure.",
          taunt: "No freebies here. Answer cleanly or lose tempo.",
          allowCatch: false,
          aceId: "lucario",
          levelOffset: 1,
          hpMult: 1.12,
          atkMult: 1.12,
          defMult: 1.08,
          rewardMult: 1.25,
          xpMult: 1.2,
          accent: "#ff7a59",
        },
        {
          kind: "boss",
          trainerName: "Emily",
          trainerTitle: "GSI Midterm Boss",
          trainerSprite: "emily.png",
          subtitle: "A real checkpoint fight. Catching stays disabled.",
          taunt: "You do not pass by guessing.",
          allowCatch: false,
          aceId: "garchomp",
          levelOffset: 2,
          hpMult: 1.2,
          atkMult: 1.15,
          defMult: 1.12,
          rewardMult: 1.5,
          xpMult: 1.3,
          accent: "#ffd166",
        },
        {
          kind: "wild",
          label: "High-Risk Habitat",
          subtitle: "One last catch window before the finals.",
          allowCatch: true,
          levelOffset: 1,
          rarityWeights: {
            Common: 0.12,
            Uncommon: 0.46,
            Rare: 0.36,
            Legendary: 0.06,
          },
          rewardMult: 1.1,
          xpMult: 1.08,
          accent: "#7ed957",
        },
        {
          kind: "trainer",
          trainerName: "Fiona",
          trainerTitle: "GSI Final Evaluator",
          trainerSprite: "fiona.png",
          subtitle: "The last trainer before the championship exam.",
          taunt: "If you can answer under pressure, prove it now.",
          allowCatch: false,
          aceId: "hydreigon",
          levelOffset: 2,
          hpMult: 1.16,
          atkMult: 1.16,
          defMult: 1.1,
          rewardMult: 1.35,
          xpMult: 1.25,
          accent: "#c084fc",
        },
        {
          kind: "boss",
          trainerName: "Prof. Nielsen",
          trainerTitle: "Champion Exam",
          trainerSprite: "prof-nielsen.png",
          subtitle: "Final boss. Win here and the run is yours.",
          taunt: "No catches. No padding. Finish the exam.",
          allowCatch: false,
          aceId: "mewtwo",
          levelOffset: 3,
          hpMult: 1.28,
          atkMult: 1.22,
          defMult: 1.16,
          rewardMult: 1.8,
          xpMult: 1.45,
          finalBoss: true,
          accent: "#ffd700",
        },
      ];
      const RUN_LENGTH = RUN_PLAN.length;

      // ========== MON BUILDER ==========
      function expandMove(raw, type, tier) {
        // Convert the compact move data tables into the full shape used in battle.
        const diff = tier === "basic" ? 1 : tier === "special" ? 2 : 3;
        const move = {
          name: raw.name,
          type: type,
          power: raw.p || 0,
          diff: diff,
          tier:
            tier === "ultimate"
              ? "ultimate"
              : tier === "special"
                ? "special"
                : "basic",
          desc: raw.d || "",
        };
        if (raw.heal) move.heal = raw.heal;
        if (raw.drain) move.drain = raw.drain;
        if (raw.fx) {
          move.effects = raw.fx.map((f) => ({
            target: f.t === "self" ? "self" : "foe",
            kind: f.k,
            amount: f.a,
          }));
        }
        return move;
      }

      function seededPick(arr, seed, offset) {
        // Gives each Pokemon stable moves without storing every move by hand.
        return arr[(seed + offset * 7 + 3) % arr.length];
      }

      function buildMon(entry) {
        const [id, name, type1, type2, rarity, seed] = entry;
        const r = RARITY_STATS[rarity];
        const t = seed / 99;
        // Seed spreads each Pokemon across its rarity's stat range.
        const hp = Math.round(r.hp[0] + (r.hp[1] - r.hp[0]) * t);
        const atk = Math.round(r.atk[0] + (r.atk[1] - r.atk[0]) * t);
        const def_ = Math.round(
          r.def[0] + (r.def[1] - r.def[0]) * (1 - t * 0.4),
        );

        const moves = r.slots.map((tier, i) => {
          // Dual-type Pokemon alternate some slots into their second type.
          const useType2 = type2 && (i === 1 || i === 3);
          const mtype = useType2 ? type2 : type1;
          const pool = MOVE_POOLS[mtype];
          if (!pool)
            return expandMove(MOVE_POOLS.Normal.basic[0], "Normal", "basic");
          const tierPool = pool[tier] || pool.basic;
          const raw = seededPick(tierPool, seed, i);
          return expandMove(raw, mtype, tier);
        });

        if (LEGENDARY_MOVES[id]) {
          // Legendary signature moves replace the last generated move slot.
          moves[3] = { ...LEGENDARY_MOVES[id] };
          if (!moves[3].effects) moves[3].effects = [];
        }

        return {
          id,
          name,
          type: type1,
          type2: type2 || null,
          rarity,
          hp,
          atk,
          def: def_,
          tc: TYPE_CLASS[type1],
          tc2: type2 ? TYPE_CLASS[type2] : null,
          desc: `${rarity} ${type1}${type2 ? "/" + type2 : ""} type.`,
          moves,
          ability: assignAbility(type1, seed),
          catchRate: r.catchRate,
          xpYield: r.xpYield,
        };
      }

      const ALL_MONS = DEX.map(buildMon);
      const MON_BY_ID = {};
      ALL_MONS.forEach((m) => (MON_BY_ID[m.id] = m));

      // ========== EVOLUTIONS ==========
      // Triples: [fromId, toId, levelRequired]. Only chains where both ends exist in DEX
      // are included — if a middle form or final form is missing from the roster, the
      // chain is simply omitted so the mon stays unevolvable.
      const EVO_DATA = [
        // Gen 1
        ["bulbasaur", "ivysaur", 16],
        ["ivysaur", "venusaur", 32],
        ["charmander", "charmeleon", 16],
        ["charmeleon", "charizard", 36],
        ["squirtle", "wartortle", 16],
        ["wartortle", "blastoise", 36],
        ["caterpie", "butterfree", 10],
        ["pidgey", "pidgeot", 18],
        ["pikachu", "raichu", 22],
        ["sandshrew", "sandslash", 22],
        ["clefairy", "clefable", 28],
        ["vulpix", "ninetales", 28],
        ["jigglypuff", "wigglytuff", 28],
        ["zubat", "golbat", 22],
        ["golbat", "crobat", 36],
        ["oddish", "vileplume", 28],
        ["growlithe", "arcanine", 30],
        ["poliwag", "poliwrath", 28],
        ["abra", "kadabra", 16],
        ["kadabra", "alakazam", 36],
        ["machop", "machoke", 28],
        ["machoke", "machamp", 36],
        ["geodude", "golem", 28],
        ["ponyta", "rapidash", 40],
        ["slowpoke", "slowbro", 28],
        ["magnemite", "magneton", 30],
        ["magneton", "magnezone", 40],
        ["gastly", "haunter", 25],
        ["haunter", "gengar", 36],
        ["drowzee", "hypno", 26],
        ["voltorb", "electrode", 30],
        ["exeggcute", "exeggutor", 28],
        ["cubone", "marowak", 28],
        ["koffing", "weezing", 35],
        ["rhyhorn", "rhydon", 42],
        ["horsea", "seadra", 32],
        ["seadra", "kingdra", 44],
        ["staryu", "starmie", 28],
        ["magikarp", "gyarados", 20],
        ["eevee", "vaporeon", 25],
        ["dratini", "dragonair", 30],
        ["dragonair", "dragonite", 55],
        // Gen 2
        ["chikorita", "bayleef", 16],
        ["bayleef", "meganium", 32],
        ["cyndaquil", "quilava", 14],
        ["quilava", "typhlosion", 36],
        ["totodile", "croconaw", 18],
        ["croconaw", "feraligatr", 30],
        ["hoothoot", "noctowl", 20],
        ["mareep", "flaaffy", 15],
        ["flaaffy", "ampharos", 30],
        ["marill", "azumarill", 18],
        ["snubbull", "granbull", 23],
        ["teddiursa", "ursaring", 30],
        ["swinub", "piloswine", 33],
        ["piloswine", "mamoswine", 40],
        ["houndour", "houndoom", 24],
        ["larvitar", "pupitar", 30],
        ["pupitar", "tyranitar", 55],
        // Gen 3
        ["treecko", "grovyle", 16],
        ["grovyle", "sceptile", 36],
        ["torchic", "combusken", 16],
        ["combusken", "blaziken", 36],
        ["mudkip", "marshtomp", 16],
        ["marshtomp", "swampert", 36],
        ["ralts", "kirlia", 20],
        ["kirlia", "gardevoir", 30],
        ["shroomish", "breloom", 23],
        ["aron", "lairon", 32],
        ["lairon", "aggron", 42],
        ["meditite", "medicham", 37],
        ["electrike", "manectric", 26],
        ["carvanha", "sharpedo", 30],
        ["trapinch", "vibrava", 35],
        ["vibrava", "flygon", 45],
        ["swablu", "altaria", 35],
        ["snorunt", "glalie", 42],
        ["bagon", "shelgon", 30],
        ["shelgon", "salamence", 50],
        ["beldum", "metang", 20],
        ["metang", "metagross", 45],
        // Gen 4
        ["turtwig", "grotle", 18],
        ["grotle", "torterra", 32],
        ["chimchar", "monferno", 14],
        ["monferno", "infernape", 36],
        ["piplup", "prinplup", 16],
        ["prinplup", "empoleon", 36],
        ["starly", "staraptor", 34],
        ["shinx", "luxio", 15],
        ["luxio", "luxray", 30],
        ["cranidos", "rampardos", 30],
        ["shieldon", "bastiodon", 30],
        ["drifloon", "drifblim", 28],
        ["buneary", "lopunny", 25],
        ["gible", "gabite", 24],
        ["gabite", "garchomp", 48],
        ["riolu", "lucario", 30],
        ["hippopotas", "hippowdon", 34],
        ["skorupi", "drapion", 40],
        ["croagunk", "toxicroak", 37],
        ["snover", "abomasnow", 40],
        // Gen 5
        ["snivy", "servine", 17],
        ["servine", "serperior", 36],
        ["tepig", "pignite", 17],
        ["pignite", "emboar", 36],
        ["oshawott", "dewott", 17],
        ["dewott", "samurott", 36],
        ["lillipup", "herdier", 16],
        ["herdier", "stoutland", 32],
        ["roggenrola", "boldore", 25],
        ["boldore", "gigalith", 35],
        ["timburr", "gurdurr", 25],
        ["gurdurr", "conkeldurr", 38],
        ["sandile", "krokorok", 29],
        ["krokorok", "krookodile", 40],
        ["darumaka", "darmanitan", 35],
        ["scraggy", "scrafty", 39],
        ["zorua", "zoroark", 30],
        ["ferroseed", "ferrothorn", 40],
        ["litwick", "lampent", 41],
        ["lampent", "chandelure", 50],
        ["axew", "fraxure", 38],
        ["fraxure", "haxorus", 48],
        ["cubchoo", "beartic", 37],
        ["mienfoo", "mienshao", 50],
        ["pawniard", "bisharp", 52],
        ["deino", "zweilous", 50],
        ["zweilous", "hydreigon", 64],
        // Gen 6
        ["chespin", "quilladin", 16],
        ["quilladin", "chesnaught", 36],
        ["fennekin", "braixen", 16],
        ["braixen", "delphox", 36],
        ["froakie", "frogadier", 16],
        ["frogadier", "greninja", 36],
        ["fletchling", "fletchinder", 17],
        ["fletchinder", "talonflame", 35],
        ["honedge", "doublade", 35],
        ["doublade", "aegislash", 40],
        ["goomy", "sliggoo", 40],
        ["sliggoo", "goodra", 50],
        ["phantump", "trevenant", 40],
        ["noibat", "noivern", 48],
        // Gen 7+
        ["rowlet", "decidueye", 34],
        ["litten", "incineroar", 34],
        ["popplio", "primarina", 34],
        ["rockruff", "lycanroc", 25],
      ];
      const EVOLUTIONS = {};
      EVO_DATA.forEach(([from, to, level]) => {
        if (MON_BY_ID[from] && MON_BY_ID[to]) EVOLUTIONS[from] = { to, level };
      });

      // Checks whether a mon meets the level requirement for evolution and the
      // target form exists in the roster.
      function canEvolve(mon) {
        if (!mon || !mon.id) return false;
        const evo = EVOLUTIONS[mon.id];
        return !!(evo && (mon.level || 1) >= evo.level && MON_BY_ID[evo.to]);
      }

      // Scans the evolved form's moveset for any move the mon does not already
      // know and returns the strongest candidate (highest power, usually ultimate tier).
      function pickEvolutionMove(mon, target) {
        const owned = new Set((mon.moves || []).map((m) => m && m.name));
        const candidates = (target.moves || []).filter(
          (m) => m && !owned.has(m.name),
        );
        if (!candidates.length) return null;
        candidates.sort((a, b) => (b.power || 0) - (a.power || 0));
        return cleanMove({ ...candidates[0] });
      }

      // Transforms a mon into its evolved form: updates stats (adding the delta
      // between source and target base stats), types, rarity, and moveset.
      // Returns an object describing the change (deltas + learned move) or null.
      function evolveMon(mon) {
        const evo = EVOLUTIONS[mon.id];
        if (!evo) return null;
        const target = MON_BY_ID[evo.to];
        const source = MON_BY_ID[mon.id];
        if (!target || !source) return null;

        const hpDelta = Math.max(0, (target.hp || 0) - (source.hp || 0));
        const atkDelta = Math.max(0, (target.atk || 0) - (source.atk || 0));
        const defDelta = Math.max(0, (target.def || 0) - (source.def || 0));

        const fromName = source.name;
        const fromId = source.id;

        mon.hp = (mon.hp || target.hp) + hpDelta;
        mon.atk = (mon.atk || target.atk) + atkDelta;
        mon.def = (mon.def || target.def) + defDelta;
        mon.curHp = clamp((mon.curHp || 0) + hpDelta, 1, mon.hp);

        mon.id = target.id;
        mon.name = target.name;
        mon.type = target.type;
        mon.type2 = target.type2 || null;
        mon.tc = TYPE_CLASS[target.type] || mon.tc;
        mon.tc2 = target.type2 ? TYPE_CLASS[target.type2] || null : null;
        mon.rarity = target.rarity;
        mon.xpYield = target.xpYield;
        mon.catchRate = target.catchRate;
        mon.desc = target.desc;

        let learnedMove = null;
        const newMove = pickEvolutionMove(mon, target);
        if (newMove) {
          if (!mon.moves) mon.moves = [];
          if (mon.moves.length < 4) {
            mon.moves.push(newMove);
          } else {
            let idx = 0,
              low = Infinity;
            mon.moves.forEach((m, i) => {
              const p = (m && m.power) || 0;
              if (p < low) {
                low = p;
                idx = i;
              }
            });
            mon.moves[idx] = newMove;
          }
          learnedMove = newMove.name;
        }

        return {
          fromId,
          fromName,
          toId: target.id,
          toName: target.name,
          hpDelta,
          atkDelta,
          defDelta,
          learnedMove,
        };
      }

      // ========== ARENA THEMES ==========
      const ARENA_SIZE_STANDARD = {
        playerSize: "clamp(104px, min(28cqw, 54cqh), 198px)",
        enemySize: "clamp(78px, min(22cqw, 38cqh), 160px)",
      };
      const ARENA_SIZE_TIGHT = {
        playerSize: "clamp(100px, min(26cqw, 50cqh), 184px)",
        enemySize: "clamp(74px, min(20cqw, 34cqh), 148px)",
      };
      const ARENA_SIZE_SPACIOUS = {
        playerSize: "clamp(108px, min(29cqw, 55cqh), 204px)",
        enemySize: "clamp(80px, min(23cqw, 39cqh), 164px)",
      };

      const DEFAULT_ARENA_POS = {
        ...ARENA_SIZE_STANDARD,
        playerX: 30,
        playerY: 84,
        enemyX: 66,
        enemyY: 58,
        trainerX: 75,
        trainerY: 60,
        trainerSize: "clamp(74px, min(18cqw, 34cqh), 146px)",
      };

      // Per-type battle arena themes. Each entry has:
      //   bg     - CSS background (gradient + image)
      //   cloud  - CSS color for atmosphere overlay
      //   plat   - CSS color for the platform
      //   pos    - positioning: playerX/Y, enemyX/Y as percentage coords,
      //            playerSize/enemySize as clamp(...) values for responsive sizing,
      //            plus trainerX/Y/trainerSize for trainer battles.
      const TYPE_ARENAS = {
        Fire: {
          bg: "linear-gradient(180deg,rgba(20,8,6,.16),rgba(20,8,6,.28)),url('assets/backgrounds/arena-fire.png') center/cover no-repeat",
          cloud: "rgba(255,219,184,.24)",
          plat: "rgba(158,73,37,.78)",
          pos: { ...ARENA_SIZE_TIGHT, playerX: 30, playerY: 84, enemyX: 66, enemyY: 57 },
        },
        Water: {
          bg: "linear-gradient(180deg,rgba(6,12,20,.16),rgba(6,12,20,.28)),url('assets/backgrounds/arena-water.png') center/cover no-repeat",
          cloud: "rgba(180,210,255,.3)",
          plat: "rgba(50,90,160,.7)",
          pos: { ...ARENA_SIZE_SPACIOUS, playerX: 31, playerY: 78, enemyX: 66, enemyY: 55 },
        },
        Grass: {
          bg: "linear-gradient(180deg,rgba(10,20,10,.14),rgba(10,20,10,.24)),url('assets/backgrounds/arena-grass.png') center/cover no-repeat",
          cloud: "rgba(230,255,214,.24)",
          plat: "rgba(78,130,66,.76)",
          pos: { ...ARENA_SIZE_TIGHT, playerX: 31, playerY: 77, enemyX: 66, enemyY: 56 },
        },
        Electric: {
          bg: "linear-gradient(180deg,rgba(20,18,6,.14),rgba(20,18,6,.24)),url('assets/backgrounds/arena-electric.png') center/cover no-repeat",
          cloud: "rgba(255,245,180,.3)",
          plat: "rgba(180,160,50,.7)",
          pos: { ...ARENA_SIZE_TIGHT, playerX: 30, playerY: 85, enemyX: 66, enemyY: 61 },
        },
        Ice: {
          bg: "linear-gradient(180deg,rgba(10,16,22,.14),rgba(10,16,22,.24)),url('assets/backgrounds/arena-ice.png') center/cover no-repeat",
          cloud: "rgba(200,230,255,.35)",
          plat: "rgba(120,170,200,.7)",
          pos: { ...ARENA_SIZE_TIGHT, playerX: 31, playerY: 80, enemyX: 66, enemyY: 53 },
        },
        Fighting: {
          bg: "linear-gradient(180deg,rgba(20,10,8,.16),rgba(20,10,8,.26)),url('assets/backgrounds/arena-fighting.png') center/cover no-repeat",
          cloud: "rgba(255,200,180,.2)",
          plat: "rgba(160,60,40,.7)",
          pos: { ...ARENA_SIZE_SPACIOUS, playerX: 31, playerY: 81, enemyX: 66, enemyY: 57 },
        },
        Poison: {
          bg: "linear-gradient(180deg,rgba(16,8,20,.18),rgba(16,8,20,.28)),url('assets/backgrounds/arena-poison.png') center/cover no-repeat",
          cloud: "rgba(225,255,214,.42)",
          plat: "rgba(94,124,46,.76)",
          pos: { ...ARENA_SIZE_TIGHT, playerX: 31, playerY: 79, enemyX: 66, enemyY: 56 },
        },
        Ground: {
          bg: "linear-gradient(180deg,rgba(22,16,8,.16),rgba(22,16,8,.26)),url('assets/backgrounds/arena-ground.png') center/cover no-repeat",
          cloud: "rgba(255,230,190,.25)",
          plat: "rgba(170,130,70,.75)",
          pos: { ...ARENA_SIZE_STANDARD, playerX: 31, playerY: 83, enemyX: 66, enemyY: 60 },
        },
        Flying: {
          bg: "linear-gradient(180deg,rgba(12,14,22,.1),rgba(12,14,22,.2)),url('assets/backgrounds/arena-flying.png') center/cover no-repeat",
          cloud: "rgba(255,255,255,.5)",
          plat: "rgba(130,110,180,.65)",
          pos: { ...ARENA_SIZE_STANDARD, playerX: 31, playerY: 78, enemyX: 66, enemyY: 55 },
        },
        Psychic: {
          bg: "linear-gradient(180deg,rgba(15,16,28,.1),rgba(15,16,28,.22)),url('assets/backgrounds/arena-psychic.png') center/cover no-repeat",
          cloud: "rgba(255,255,255,.48)",
          plat: "rgba(125,101,194,.72)",
          pos: { ...ARENA_SIZE_STANDARD, playerX: 31, playerY: 80, enemyX: 66, enemyY: 56 },
        },
        Bug: {
          bg: "linear-gradient(180deg,rgba(14,18,8,.14),rgba(14,18,8,.24)),url('assets/backgrounds/arena-bug.png') center/cover no-repeat",
          cloud: "rgba(220,240,200,.3)",
          plat: "rgba(100,130,50,.7)",
          pos: { ...ARENA_SIZE_TIGHT, playerX: 31, playerY: 85, enemyX: 66, enemyY: 57 },
        },
        Rock: {
          bg: "linear-gradient(180deg,rgba(26,18,8,.16),rgba(26,18,8,.28)),url('assets/backgrounds/arena-rock.png') center/cover no-repeat",
          cloud: "rgba(255,236,210,.2)",
          plat: "rgba(148,112,64,.78)",
          pos: { ...ARENA_SIZE_STANDARD, playerX: 31, playerY: 80, enemyX: 66, enemyY: 57 },
        },
        Ghost: {
          bg: "linear-gradient(180deg,rgba(14,10,24,.18),rgba(14,10,24,.28)),url('assets/backgrounds/arena-ghost.png') center/cover no-repeat",
          cloud: "rgba(196,181,255,.22)",
          plat: "rgba(84,61,152,.74)",
          pos: { ...ARENA_SIZE_STANDARD, playerX: 31, playerY: 81, enemyX: 66, enemyY: 57 },
        },
        Dragon: {
          bg: "linear-gradient(180deg,rgba(9,12,18,.16),rgba(9,12,18,.3)),url('assets/backgrounds/arena-dragon.png') center/cover no-repeat",
          cloud: "rgba(243,247,255,.34)",
          plat: "rgba(96,93,78,.76)",
          pos: { ...ARENA_SIZE_STANDARD, playerX: 31, playerY: 80, enemyX: 66, enemyY: 57 },
        },
        Dark: {
          bg: "linear-gradient(180deg,rgba(10,8,6,.2),rgba(10,8,6,.35)),url('assets/backgrounds/arena-dark.png') center/cover no-repeat",
          cloud: "rgba(180,170,160,.15)",
          plat: "rgba(90,70,55,.75)",
          pos: { ...ARENA_SIZE_STANDARD, playerX: 31, playerY: 82, enemyX: 66, enemyY: 58 },
        },
        Steel: {
          bg: "linear-gradient(180deg,rgba(14,14,18,.14),rgba(14,14,18,.26)),url('assets/backgrounds/arena-steel.png') center/cover no-repeat",
          cloud: "rgba(210,210,220,.25)",
          plat: "rgba(140,140,160,.7)",
          pos: { ...ARENA_SIZE_SPACIOUS, playerX: 31, playerY: 82, enemyX: 66, enemyY: 57 },
        },
        Fairy: {
          bg: "linear-gradient(180deg,rgba(20,12,16,.12),rgba(20,12,16,.22)),url('assets/backgrounds/arena-fairy.png') center/cover no-repeat",
          cloud: "rgba(255,200,220,.3)",
          plat: "rgba(180,110,140,.65)",
          pos: { ...ARENA_SIZE_TIGHT, playerX: 31, playerY: 82, enemyX: 66, enemyY: 58 },
        },
        Normal: {
          bg: "linear-gradient(180deg,rgba(110,181,255,.12),rgba(61,122,48,.18)),url('assets/backgrounds/arena-normal.png') center/cover no-repeat",
          cloud: "rgba(255,255,255,.5)",
          plat: "rgba(60,120,50,.7)",
          pos: { ...ARENA_SIZE_SPACIOUS, playerX: 31, playerY: 85, enemyX: 66, enemyY: 60 },
        },
      };

      const GUIDE_BACKDROP_ARENAS = [
        ...Object.entries(TYPE_ARENAS).map(([id, theme]) => ({
          id,
          label: id,
          theme,
        })),
        {
          id: "Muk",
          label: "Muk",
          theme: {
            bg: "linear-gradient(180deg,rgba(15,8,18,.18),rgba(15,8,18,.3)),url('assets/backgrounds/arena-muk.png') center/cover no-repeat",
            cloud: "rgba(225,255,214,.36)",
            plat: "rgba(91,118,49,.78)",
            pos: { ...ARENA_SIZE_TIGHT, playerX: 31, playerY: 80, enemyX: 66, enemyY: 57 },
          },
        },
        {
          id: "Haunter",
          label: "Haunter",
          theme: {
            bg: "linear-gradient(180deg,rgba(14,10,24,.18),rgba(14,10,24,.3)),url('assets/backgrounds/arena-haunter.png') center/cover no-repeat",
            cloud: "rgba(196,181,255,.22)",
            plat: "rgba(84,61,152,.74)",
            pos: { ...ARENA_SIZE_STANDARD, playerX: 31, playerY: 81, enemyX: 66, enemyY: 57 },
          },
        },
        {
          id: "Gengar",
          label: "Gengar",
          theme: {
            bg: "linear-gradient(180deg,rgba(14,10,24,.18),rgba(14,10,24,.32)),url('assets/backgrounds/arena-gengar.png') center/cover no-repeat",
            cloud: "rgba(196,181,255,.2)",
            plat: "rgba(84,61,152,.74)",
            pos: { ...ARENA_SIZE_STANDARD, playerX: 31, playerY: 81, enemyX: 66, enemyY: 57 },
          },
        },
        {
          id: "Hydreigon",
          label: "Hydreigon",
          theme: {
            bg: "linear-gradient(180deg,rgba(9,12,18,.18),rgba(9,12,18,.34)),url('assets/backgrounds/arena-hydreigon.png') center/cover no-repeat",
            cloud: "rgba(243,247,255,.28)",
            plat: "rgba(83,79,72,.78)",
            pos: { ...ARENA_SIZE_STANDARD, playerX: 31, playerY: 80, enemyX: 66, enemyY: 57 },
          },
        },
        {
          id: "Mewtwo",
          label: "Mewtwo",
          theme: {
            bg: "linear-gradient(180deg,rgba(15,16,28,.12),rgba(15,16,28,.28)),url('assets/backgrounds/arena-mewtwo.png') center/cover no-repeat",
            cloud: "rgba(255,255,255,.42)",
            plat: "rgba(125,101,194,.72)",
            pos: { ...ARENA_SIZE_SPACIOUS, playerX: 31, playerY: 80, enemyX: 66, enemyY: 56 },
          },
        },
      ];

      // ========== ITEMS ==========
      // Each item has an effect type:
      //   "heal"   - restores HP by val points
      //   "revive" - revives a fainted mon at val fraction of max HP
      //   "boost"  - multiplies next move damage by val
      //   "catch"  - used in wild encounters, catchMod adjusts success rate
      //   "held"   - passive held-item effect (from HELD_ITEMS)
      const ITEMS = [
        {
          id: "potion",
          name: "Potion",
          icon: "🧪",
          desc: "Heal 30 HP",
          price: 100,
          effect: "heal",
          val: 30,
        },
        {
          id: "superp",
          name: "Super Potion",
          icon: "💊",
          desc: "Heal 60 HP",
          price: 250,
          effect: "heal",
          val: 60,
        },
        {
          id: "revive",
          name: "Revive",
          icon: "⭐",
          desc: "Revive fainted ally at 50%",
          price: 400,
          effect: "revive",
          val: 0.5,
        },
        {
          id: "xattack",
          name: "X Attack",
          icon: "⚔️",
          desc: "Boost next move by 50%",
          price: 150,
          effect: "boost",
          val: 1.5,
        },
        {
          id: "pokeball",
          name: "Poke Ball",
          icon: "🔴",
          desc: "Catch a wild Pokemon",
          price: 150,
          effect: "catch",
          catchMod: 1.0,
        },
        {
          id: "greatball",
          name: "Great Ball",
          icon: "🔵",
          desc: "Better catch rate",
          price: 350,
          effect: "catch",
          catchMod: 1.5,
        },
        {
          id: "ultraball",
          name: "Ultra Ball",
          icon: "🟡",
          desc: "High catch rate",
          price: 600,
          effect: "catch",
          catchMod: 2.0,
        },
        ...HELD_ITEMS.map(h => ({...h, effect:"held"})),
      ];

      // ========== QUESTIONS ==========
      // Question bank for the integrated quiz mechanic. Each question:
      //   d    - difficulty (1=easy, 2=medium, 3=hard) — affects damage/stun scaling
      //   cat  - topic category (displayed as a tag)
      //   q    - question text
      //   a    - array of answer choices
      //   c    - index of the correct answer in a[]
      //   e    - explanation shown after answering
      const QS = [
        {
          d: 1,
          cat: "Human Variation",
          q: "A cline is best defined as:",
          a: [
            "A sharp boundary between races",
            "A gradual geographic change in a trait",
            "A mutation that appears once",
            "A chart of family ancestry",
          ],
          c: 1,
          e: "A cline describes gradual trait change across geography rather than discrete breaks.",
        },
        {
          d: 1,
          cat: "Population Genetics",
          q: "Gene flow refers to:",
          a: [
            "Random mutation in one person",
            "Movement of alleles between populations",
            "A sudden population crash",
            "Protein synthesis inside cells",
          ],
          c: 1,
          e: "Gene flow is the transfer of alleles among populations through migration and reproduction.",
        },
        {
          d: 1,
          cat: "Population Genetics",
          q: "Genetic drift is strongest in:",
          a: [
            "Very large populations",
            "Small populations",
            "Perfectly mixed continents",
            "Populations under no reproduction",
          ],
          c: 1,
          e: "Random sampling effects are strongest when population size is small.",
        },
        {
          d: 1,
          cat: "Population Genetics",
          q: "The founder effect happens when:",
          a: [
            "A small group starts a new population",
            "Selection perfectly matches the environment",
            "All populations exchange migrants equally",
            "A species stops reproducing",
          ],
          c: 0,
          e: "Founder effects arise when a new population begins from a small subset of the original one.",
        },
        {
          d: 1,
          cat: "Population Genetics",
          q: "A population bottleneck usually means:",
          a: [
            "Migration increases immediately",
            "Population size drops sharply",
            "Every allele becomes adaptive",
            "Mutations stop happening",
          ],
          c: 1,
          e: "A bottleneck is a sharp reduction in population size, often reducing variation.",
        },
        {
          d: 1,
          cat: "Genetics",
          q: "Admixture means:",
          a: [
            "Cloning a genome",
            "Mixing between previously separated populations",
            "A mutation deleting one gene",
            "Mating only within one family",
          ],
          c: 1,
          e: "Admixture occurs when people from previously separated populations have descendants together.",
        },
        {
          d: 1,
          cat: "Genetics",
          q: "Mitochondrial DNA is typically inherited:",
          a: [
            "From the father",
            "From the mother",
            "Half from each parent",
            "Only from sons",
          ],
          c: 1,
          e: "Human mitochondrial DNA is usually inherited maternally.",
        },
        {
          d: 1,
          cat: "Human Biology",
          q: "Lactase persistence is most directly tied to a history of:",
          a: [
            "Dairying",
            "Deep-sea fishing",
            "High-altitude living",
            "Rice farming only",
          ],
          c: 0,
          e: "Lactase persistence is a classic example of adaptation associated with dairying.",
        },
        {
          d: 1,
          cat: "Human Variation",
          q: "Sickle-cell trait is commonest where malaria has been:",
          a: [
            "Rare",
            "Absent for thousands of years",
            "A strong selective pressure",
            "Replaced by cholera",
          ],
          c: 2,
          e: "Sickle-cell trait has been maintained in some regions because it can reduce severe malaria risk.",
        },
        {
          d: 1,
          cat: "Human Variation",
          q: "Human skin color variation is strongly associated with:",
          a: [
            "Annual rainfall only",
            "UV radiation",
            "Blood type",
            "Eye dominance",
          ],
          c: 1,
          e: "Skin pigmentation is closely tied to long-term UV exposure patterns.",
        },
        {
          d: 1,
          cat: "Human Biology",
          q: "Melanin is important because it helps regulate exposure to:",
          a: ["Ultraviolet radiation", "Sound waves", "Gravity", "Salt"],
          c: 0,
          e: "Melanin helps protect against ultraviolet radiation and is central to pigmentation.",
        },
        {
          d: 1,
          cat: "Human Biology",
          q: "High-altitude adaptation is mainly a response to low:",
          a: ["Calcium", "Glucose", "Oxygen", "Vitamin C"],
          c: 2,
          e: "Altitude creates low-oxygen conditions that can favor specific adaptations.",
        },
        {
          d: 1,
          cat: "Evolution",
          q: "Natural selection acts most directly on:",
          a: [
            "Phenotypes",
            "DNA bases one by one",
            "Chromosome counts only",
            "Species names",
          ],
          c: 0,
          e: "Selection operates on phenotypes, with genetic consequences across generations.",
        },
        {
          d: 1,
          cat: "Evolution",
          q: "Mutation is important because it introduces:",
          a: [
            "Guaranteed fitness gains",
            "New genetic variation",
            "Only harmful changes",
            "Perfect adaptation",
          ],
          c: 1,
          e: "Mutation creates new variation, though its effects can be beneficial, neutral, or harmful.",
        },
        {
          d: 1,
          cat: "Anthropology",
          q: "A biological population is best described as:",
          a: [
            "Everyone on one continent",
            "A group that shares a breeding pool more often than outsiders",
            "All members of one race",
            "Any people with the same language",
          ],
          c: 1,
          e: "Populations are generally defined by shared ancestry and greater reproduction within the group.",
        },
        {
          d: 1,
          cat: "Genetics",
          q: "An allele frequency describes:",
          a: [
            "The number of chromosomes in a cell",
            "How common a gene variant is in a population",
            "The size of a mutation",
            "How many genes a person has",
          ],
          c: 1,
          e: "Allele frequency is the proportion of a given allele in a population.",
        },
        {
          d: 1,
          cat: "Evolution",
          q: "An adaptation is:",
          a: [
            "Any trait a person learns",
            "A trait that improves fitness in a given environment",
            "Any mutation at all",
            "A cultural rule",
          ],
          c: 1,
          e: "Adaptations are traits shaped by selection because they improve reproductive success in context.",
        },
        {
          d: 1,
          cat: "Human Biology",
          q: "Acclimatization differs from adaptation because acclimatization is:",
          a: [
            "A short-term physiological adjustment",
            "Always genetic",
            "A permanent mutation",
            "Only cultural",
          ],
          c: 0,
          e: "Acclimatization is an individual physiological response, not an evolved population-level change.",
        },
        {
          d: 1,
          cat: "Genetics",
          q: "A polygenic trait is one influenced by:",
          a: [
            "Exactly one gene",
            "Many genes",
            "Only the environment",
            "One chromosome",
          ],
          c: 1,
          e: "Polygenic traits reflect contributions from many genes, often along with environment.",
        },
        {
          d: 1,
          cat: "Genetics",
          q: "Heritability refers to:",
          a: [
            "How fixed a trait is in one person",
            "The proportion of variation in a population associated with genetic differences",
            "Whether a trait is inherited by all children",
            "How old a gene is",
          ],
          c: 1,
          e: "Heritability concerns variation in populations, not inevitability for individuals.",
        },
        {
          d: 1,
          cat: "Human Evolution",
          q: "Current evidence places the deepest origin of Homo sapiens in:",
          a: ["Europe", "Asia", "Africa", "Australia"],
          c: 2,
          e: "Fossil and genetic evidence support Africa as the deepest origin of modern humans.",
        },
        {
          d: 1,
          cat: "Human Evolution",
          q: "The Out of Africa model argues that modern humans:",
          a: [
            "Evolved independently on each continent",
            "Expanded outward from Africa",
            "Reached Africa last",
            "Did not migrate",
          ],
          c: 1,
          e: "The model holds that modern humans originated in Africa and later dispersed.",
        },
        {
          d: 1,
          cat: "Race and Biology",
          q: "In IB 35AC, race is treated primarily as:",
          a: [
            "A fixed biological subspecies system",
            "A social classification with biological consequences through society",
            "A blood-group map",
            "A replacement for ancestry",
          ],
          c: 1,
          e: "The course emphasizes race as a social construct with real social and health effects.",
        },
        {
          d: 1,
          cat: "Race and Biology",
          q: "Ancestry differs from race because ancestry is more about:",
          a: [
            "Shared population history",
            "Legal identity only",
            "Skin color labels only",
            "Medical billing",
          ],
          c: 0,
          e: "Ancestry tracks lineage and population history more directly than racial classification does.",
        },
        {
          d: 3,
          cat: "Gene-Culture Evolution",
          q: "Gene-culture coevolution means:",
          a: [
            "Culture and biology never interact",
            "Cultural practices can alter selection pressures",
            "Genes cause culture but not the reverse",
            "Only language evolves",
          ],
          c: 1,
          e: "Gene-culture coevolution describes reciprocal shaping between cultural practices and biology.",
        },
        {
          d: 3,
          cat: "Evolution",
          q: "Convergent evolution produces similar traits in populations that:",
          a: [
            "Always share recent common ancestry",
            "Face similar selective pressures",
            "Never experience selection",
            "Are genetically identical",
          ],
          c: 1,
          e: "Convergent evolution can produce similar outcomes in separate lineages under similar pressures.",
        },
        {
          d: 1,
          cat: "Race and Biology",
          q: "Why is blood type a poor basis for defining races?",
          a: [
            "Blood types exist only in Europe",
            "Blood type variation does not sort humans into clean racial blocks",
            "People have only one blood type per continent",
            "Blood type is purely cultural",
          ],
          c: 1,
          e: "Single traits like blood type do not divide humans into discrete biological races.",
        },
        {
          d: 1,
          cat: "Genetics",
          q: "In the slides, expression level means the amount of:",
          a: ["mRNA produced", "Fossils found", "Fst calculated", "Skin pigment measured"],
          c: 0,
          e: "Lecture 2 defines expression level as the amount of mRNA produced.",
        },
        {
          d: 1,
          cat: "Genetics",
          q: "Enzymes are proteins that:",
          a: ["Catalyze chemical reactions", "Store classroom attendance", "Define racial categories", "Stop all mutations"],
          c: 0,
          e: "Lecture 2 describes enzymes as proteins that catalyze chemical reactions.",
        },
        {
          d: 1,
          cat: "Genetics",
          q: "A genotype is best described as:",
          a: [
            "A person's genetic makeup at a gene or set of genes",
            "A visible trait only",
            "A social category",
            "A fossil measurement",
          ],
          c: 0,
          e: "A genotype refers to genetic information, while a phenotype is an observable trait.",
        },
        {
          d: 1,
          cat: "Genetics",
          q: "A phenotype is:",
          a: [
            "An observable trait or characteristic",
            "Only a DNA base",
            "A population boundary",
            "A type of mutation rate",
          ],
          c: 0,
          e: "Phenotypes are observable traits, often shaped by genes and environment together.",
        },
        {
          d: 1,
          cat: "Genetics",
          q: "An allele is:",
          a: [
            "A version of a gene or DNA variant",
            "A whole species",
            "A kind of fossil",
            "A social identity label",
          ],
          c: 0,
          e: "Alleles are alternative versions of genetic variants at a locus.",
        },
        {
          d: 1,
          cat: "Genetics",
          q: "Mendelian segregation means each parent usually passes on:",
          a: [
            "One allele copy for a gene",
            "Every allele copy for a gene",
            "Only learned traits",
            "No genetic information",
          ],
          c: 0,
          e: "For many genes, offspring inherit one allele copy from each parent.",
        },
        {
          d: 1,
          cat: "Evolution",
          q: "A phylogenetic tree is used to show:",
          a: [
            "Evolutionary relationships",
            "Exam scores",
            "Latitude only",
            "Blood pressure changes",
          ],
          c: 0,
          e: "Phylogenetic trees represent hypotheses about evolutionary relationships among organisms.",
        },
        {
          d: 1,
          cat: "Evolution",
          q: "Genetic distance and mutation rate can help estimate:",
          a: [
            "When lineages diverged",
            "How tall someone is",
            "How much milk someone drinks",
            "The price of a DNA test",
          ],
          c: 0,
          e: "Lecture 4 connects genetic distance, mutation rate, and divergence time.",
        },
        {
          d: 1,
          cat: "Genetics",
          q: "A heterozygous genotype has:",
          a: [
            "Two different alleles at a locus",
            "No alleles at a locus",
            "Only cultural traits",
            "Two identical populations",
          ],
          c: 0,
          e: "Heterozygous means the two allele copies at a locus are different.",
        },
        {
          d: 1,
          cat: "Genomics",
          q: "A PCA plot in genetics is mainly used to summarize:",
          a: [
            "Patterns of genetic variation",
            "Protein cooking temperatures",
            "The age of a classroom",
            "Only one person's diet",
          ],
          c: 0,
          e: "PCA is a way to visualize broad patterns in genetic variation across samples.",
        },
        {
          d: 1,
          cat: "Genomics",
          q: "An admixture plot is usually trying to visualize:",
          a: [
            "Mixed ancestry patterns",
            "The central dogma",
            "Only skin color",
            "The number of chromosomes in bacteria",
          ],
          c: 0,
          e: "Admixture plots are statistical summaries of ancestry components and mixture patterns.",
        },
        {
          d: 1,
          cat: "Ancient DNA",
          q: "Ancient DNA helps researchers study:",
          a: [
            "Genetic information from past people or organisms",
            "Only modern social media",
            "Future mutations with certainty",
            "Protein translation in real time",
          ],
          c: 0,
          e: "Ancient DNA can reveal information about populations that lived in the past.",
        },
        {
          d: 1,
          cat: "Human Evolution",
          q: "Introgression means DNA entered a population through:",
          a: [
            "Interbreeding between groups",
            "Writing a phylogeny",
            "Avoiding all migration",
            "Deleting every mutation",
          ],
          c: 0,
          e: "Introgression happens when interbreeding moves DNA from one group into another.",
        },
        {
          d: 3,
          cat: "Ancient DNA",
          q: "Denisovans are best described as:",
          a: [
            "An extinct hominin group known partly from ancient DNA",
            "A modern nation-state",
            "A type of blood cell",
            "A consumer DNA company",
          ],
          c: 0,
          e: "Denisovans are an extinct hominin group identified largely through ancient DNA evidence.",
        },
        {
          d: 3,
          cat: "Anthropology",
          q: "Ethical genetic research with Indigenous communities should emphasize:",
          a: [
            "Consent, collaboration, and respect",
            "Ignoring community concerns",
            "Taking samples without explanation",
            "Replacing history with genetics alone",
          ],
          c: 0,
          e: "Ethical research requires respectful collaboration and attention to community priorities.",
        },
        {
          d: 1,
          cat: "Human Evolution",
          q: "The slides say the past can be studied through:",
          a: [
            "Multiple approaches including archaeology and genetics",
            "Only one DNA test",
            "Only modern borders",
            "Pokemon types",
          ],
          c: 0,
          e: "Lecture 12 lists multiple approaches, including traditional knowledge, archaeology, linguistics, biological anthropology, and genetics.",
        },
        {
          d: 3,
          cat: "Gene-Culture Evolution",
          q: "FADS enzymes are discussed in relation to:",
          a: ["Fatty acid synthesis and diet", "Skull shape", "Mendel's first law", "Direct-to-consumer ancestry labels"],
          c: 0,
          e: "Lecture 17 discusses FADS enzymes, PUFAs, and diet-related selection.",
        },
        {
          d: 3,
          cat: "Human Biology",
          q: "MHC proteins sit on cell surfaces and present antigens to:",
          a: [
            "T cells",
            "Only rocks",
            "Only extinct hominins",
            "Admixture plots",
          ],
          c: 0,
          e: "Lecture 18 says MHC proteins present antigens to T cells.",
        },
        {
          d: 1,
          cat: "Human Biology",
          q: "Human pigmentation is often discussed in biology because it relates to:",
          a: [
            "Melanin, UV exposure, and vitamin D",
            "The number of fingers only",
            "Language families only",
            "Exam attendance",
          ],
          c: 0,
          e: "Pigmentation involves melanin and is connected to UV exposure and vitamin D biology.",
        },
        {
          d: 1,
          cat: "Human Biology",
          q: "Sex chromosomes are chromosomes involved in:",
          a: [
            "Sex determination",
            "Digesting starch",
            "Measuring Fst",
            "Building phylogenetic trees only",
          ],
          c: 0,
          e: "Sex chromosomes are one part of the biology of sex determination.",
        },
        {
          d: 1,
          cat: "Human Biology",
          q: "Intersex variation shows that biological sex:",
          a: [
            "Can be more complex than a simple binary",
            "Is unrelated to bodies",
            "Is determined by race",
            "Never involves chromosomes",
          ],
          c: 0,
          e: "Intersex variation is one reason sex biology is more complex than a simple binary.",
        },
        {
          d: 3,
          cat: "Genomics",
          q: "A GWAS looks for genetic variants associated with:",
          a: [
            "Traits or diseases",
            "Classroom locations",
            "Only fossils",
            "The definition of culture",
          ],
          c: 0,
          e: "Genome-wide association studies search for variants statistically associated with traits or diseases.",
        },
        {
          d: 3,
          cat: "Genomics",
          q: "Consumer DNA ancestry results should be interpreted as:",
          a: [
            "Statistical estimates based on reference data",
            "Perfect maps of identity",
            "Proof of pure races",
            "Unchanging facts for every company",
          ],
          c: 0,
          e: "Ancestry results depend on statistical models, reference panels, and category choices.",
        },
        {
          d: 3,
          cat: "Social Biology",
          q: "Eugenics is the idea of improving humans through:",
          a: [
            "Controlled reproduction or selective breeding",
            "Respectful dialogue",
            "Transcription",
            "Vitamin D production",
          ],
          c: 0,
          e: "Eugenics refers to attempts to control reproduction in the name of improving a population.",
        },
        {
          d: 1,
          cat: "Race and Identity",
          q: "Racial formation focuses on how racial categories are shaped by:",
          a: [
            "Social history and politics",
            "One gene only",
            "Blood type alone",
            "Mitochondria alone",
          ],
          c: 0,
          e: "Racial formation treats race as shaped by social, historical, and political processes.",
        },
        {
          d: 2,
          cat: "Population Genetics",
          q: "Which situation violates a Hardy-Weinberg assumption?",
          a: [
            "Random mating",
            "No migration",
            "Natural selection changes survival",
            "A large population",
          ],
          c: 2,
          e: "Hardy-Weinberg assumes no selection, so differential survival violates the model.",
        },
        {
          d: 2,
          cat: "Population Genetics",
          q: "Fst is used to estimate:",
          a: [
            "Protein folding speed",
            "Genetic differentiation among populations",
            "Mutation rate per cell division",
            "The age of a fossil",
          ],
          c: 1,
          e: "Fst summarizes how differentiated populations are genetically.",
        },
        {
          d: 2,
          cat: "Human Evolution",
          q: "A serial founder effect helps explain why:",
          a: [
            "Genetic diversity often declines with distance from Africa",
            "Every population has equal diversity",
            "Mutation stopped after migration",
            "Europe shows the oldest human fossils",
          ],
          c: 0,
          e: "Repeated founding events can reduce diversity as humans expanded farther from Africa.",
        },
        {
          d: 2,
          cat: "Human Evolution",
          q: "Why is genetic diversity especially high in many African populations?",
          a: [
            "Africa has no migration",
            "Modern humans have their deepest history there",
            "Selection is absent in Africa",
            "All African populations are one breeding group",
          ],
          c: 1,
          e: "Because Homo sapiens has its deepest roots in Africa, many African populations retain more diversity.",
        },
        {
          d: 2,
          cat: "Human Variation",
          q: "Why do skin-color clines challenge racial typologies?",
          a: [
            "Skin color never changes",
            "Gradual variation does not produce clean racial boundaries",
            "Skin color is unrelated to biology",
            "Only Europeans show clines",
          ],
          c: 1,
          e: "Gradual change across geography conflicts with fixed race boxes.",
        },
        {
          d: 2,
          cat: "Human Variation",
          q: "Sickle-cell variation is often taught as a case of:",
          a: [
            "Directional selection toward one universal best allele",
            "Balancing selection in malarial environments",
            "Pure drift with no ecology",
            "A mutation caused by race labels",
          ],
          c: 1,
          e: "The persistence of the allele in some regions reflects balancing selection tied to malaria.",
        },
        {
          d: 2,
          cat: "Human Biology",
          q: "The evolutionary tradeoff involving UV, folate, and vitamin D helps explain:",
          a: [
            "Why humans all have the same pigmentation",
            "Why pigmentation varies with latitude",
            "Why blood types differ",
            "Why mtDNA is maternal",
          ],
          c: 1,
          e: "Latitude-related UV patterns help explain broad pigmentation gradients.",
        },
        {
          d: 3,
          cat: "Human Variation",
          q: "Light skin in Europe and East Asia is often used to illustrate:",
          a: [
            "Independent adaptation under similar pressures",
            "Proof of one recent light-skin race",
            "Only cultural change",
            "The founder effect only",
          ],
          c: 0,
          e: "Similar pigmentation can evolve separately in different populations facing similar UV conditions.",
        },
        {
          d: 2,
          cat: "Genetics",
          q: "Why can mtDNA and Y-chromosome studies tell different stories?",
          a: [
            "They measure identical lineages",
            "They track different sex-linked lines of ancestry",
            "One is cultural and the other biological",
            "Both mutate too slowly to matter",
          ],
          c: 1,
          e: "mtDNA follows maternal lines while the Y chromosome follows paternal lines.",
        },
        {
          d: 2,
          cat: "Population Genetics",
          q: "Continued gene flow between populations generally tends to:",
          a: [
            "Increase differentiation",
            "Reduce differentiation",
            "Eliminate all local adaptation instantly",
            "Stop mutation",
          ],
          c: 1,
          e: "Gene flow usually makes populations more genetically similar on average.",
        },
        {
          d: 2,
          cat: "Population Genetics",
          q: "A small isolated population is especially prone to:",
          a: [
            "Genetic drift",
            "Perfect Hardy-Weinberg equilibrium",
            "Infinite genetic diversity",
            "No allele frequency change",
          ],
          c: 0,
          e: "Isolation plus small size magnifies random allele-frequency shifts.",
        },
        {
          d: 2,
          cat: "Population Genetics",
          q: "After a severe bottleneck, a trait may become common because of:",
          a: [
            "Only natural selection",
            "Sampling effects alone can be enough",
            "Immediate speciation",
            "The end of mutation",
          ],
          c: 1,
          e: "Bottlenecks can change frequencies through drift even without strong selection.",
        },
        {
          d: 2,
          cat: "Genomics",
          q: "Why are ancestry estimates from consumer DNA tests probabilistic?",
          a: [
            "Because genes are imaginary",
            "They depend on reference datasets and statistical comparison",
            "Because every person belongs to one pure race",
            "Because mitochondria override the genome",
          ],
          c: 1,
          e: "The estimates depend on the available reference populations and model assumptions.",
        },
        {
          d: 2,
          cat: "Race and Medicine",
          q: "Why can race be a poor medical proxy?",
          a: [
            "Race is always identical to ancestry",
            "It can hide more relevant ancestry, exposure, and environmental factors",
            "Doctors never use biology",
            "Race has no social consequences",
          ],
          c: 1,
          e: "Racial labels are broad and often miss the factors most relevant to health outcomes.",
        },
        {
          d: 2,
          cat: "Human Biology",
          q: "Which is an example of acclimatization rather than adaptation?",
          a: [
            "A population evolving lactose persistence",
            "A visitor increasing breathing rate at altitude",
            "A mutation spreading over generations",
            "A cline in pigmentation",
          ],
          c: 1,
          e: "A short-term physiological response in an individual is acclimatization.",
        },
        {
          d: 2,
          cat: "Gene-Culture Evolution",
          q: "Lactase persistence is especially useful because it shows:",
          a: [
            "Culture can alter selective environments",
            "Selection does not affect humans",
            "Milk directly causes mutations",
            "Only one population can adapt",
          ],
          c: 0,
          e: "Dairying practices changed selective pressures, making it a classic gene-culture case.",
        },
        {
          d: 2,
          cat: "Health Disparities",
          q: "IB 35AC often treats health differences among racialized groups as shaped heavily by:",
          a: [
            "Only genes",
            "Social conditions and lived environments",
            "Only continent of origin",
            "Blood type",
          ],
          c: 1,
          e: "The course emphasizes that inequality, stress, access, and environment shape health patterns.",
        },
        {
          d: 3,
          cat: "Evolution",
          q: "Convergent evolution is important because similar phenotypes can arise:",
          a: [
            "Only from identical ancestry",
            "Without recent common ancestry",
            "Only after admixture",
            "Only in humans",
          ],
          c: 1,
          e: "Trait similarity does not always imply recent common ancestry.",
        },
        {
          d: 2,
          cat: "Population Genetics",
          q: "Assortative mating would most directly affect which Hardy-Weinberg assumption?",
          a: [
            "Random mating",
            "No mutation",
            "Large population size",
            "No migration",
          ],
          c: 0,
          e: "Nonrandom mate choice violates the random-mating assumption.",
        },
        {
          d: 2,
          cat: "Human Variation",
          q: "A clinal pattern in a trait often suggests the trait has been shaped by:",
          a: [
            "Sharp racial boundaries",
            "Geography, migration, and possibly selection",
            "One recent mutation everywhere",
            "Only modern census categories",
          ],
          c: 1,
          e: "Clines often reflect a mix of migration, environment, and selection across space.",
        },
        {
          d: 2,
          cat: "Human Biology",
          q: "Why is skin color often discussed with folate and vitamin D together?",
          a: [
            "They are unrelated to sunlight",
            "They capture different biological costs and benefits tied to UV exposure",
            "They determine blood type",
            "They explain all disease variation",
          ],
          c: 1,
          e: "Pigmentation is often explained through UV-linked tradeoffs involving folate protection and vitamin D production.",
        },
        {
          d: 2,
          cat: "Genetics",
          q: "Admixture usually makes population histories look:",
          a: [
            "Simpler and more tree-like",
            "More reticulate and interconnected",
            "Impossible to study",
            "Identical across continents",
          ],
          c: 1,
          e: "Admixture creates cross-connections rather than a simple branching tree.",
        },
        {
          d: 2,
          cat: "Race and Biology",
          q: "Why do arbitrary racial boundaries fail biologically?",
          a: [
            "Human variation is entirely random",
            "Most traits vary continuously and populations have mixed histories",
            "Every trait is controlled by one gene",
            "Races change only because of language",
          ],
          c: 1,
          e: "Continuous variation and admixture undermine rigid racial borders.",
        },
        {
          d: 2,
          cat: "Ancient DNA",
          q: "Ancient DNA changed the study of human origins mainly by showing:",
          a: [
            "Human history was simpler than expected",
            "Interbreeding and migration were often more complex than simple replacement models",
            "Neanderthals are fictional",
            "Modern humans never left Africa",
          ],
          c: 1,
          e: "Ancient DNA has revealed more complex migration and interbreeding histories.",
        },
        {
          d: 2,
          cat: "Human Variation",
          q: "Local adaptation does not imply biological races because:",
          a: [
            "Adaptation cannot happen in humans",
            "Populations can adapt in specific ways without forming discrete global boxes",
            "Every adaptation is cultural",
            "Only one trait matters",
          ],
          c: 1,
          e: "Specific adaptations can occur without dividing humanity into fixed racial units.",
        },
        {
          d: 2,
          cat: "Population Genetics",
          q: "One common result of a bottleneck is:",
          a: [
            "Lower heterozygosity",
            "Guaranteed beneficial mutations",
            "No selection afterward",
            "Perfectly equal allele frequencies",
          ],
          c: 0,
          e: "Bottlenecks often reduce heterozygosity and increase the role of drift.",
        },
        {
          d: 2,
          cat: "Human Variation",
          q: "Why is sickle-cell trait not well described as an African racial marker?",
          a: [
            "It occurs only outside Africa",
            "Its distribution tracks malarial ecology more than race labels",
            "It is controlled by skin color",
            "It is not genetic",
          ],
          c: 1,
          e: "Its frequency is better explained by malaria-related selection than by race categories.",
        },
        {
          d: 2,
          cat: "Genomics",
          q: "Why should ancestry-test categories be interpreted carefully?",
          a: [
            "Reference populations and labels are human choices",
            "DNA has no information about history",
            "Everyone belongs to one pure cluster",
            "All companies use the same categories",
          ],
          c: 0,
          e: "Different reference panels and labels can change the apparent result.",
        },
        {
          d: 2,
          cat: "Evolution",
          q: "Phenotypic similarity can be misleading as evidence of close relatedness because of:",
          a: [
            "Hardy-Weinberg equilibrium",
            "Convergent evolution",
            "Mendelian segregation",
            "Founder effects only",
          ],
          c: 1,
          e: "Similar selective pressures can produce similar traits in unrelated populations.",
        },
        {
          d: 3,
          cat: "Population Genetics",
          q: "Which statement best captures a major finding of human population genetics?",
          a: [
            "Most human genetic variation lies between continental races",
            "Most human genetic variation lies within populations",
            "Variation is evenly partitioned between all groups",
            "Ancient DNA removed the need for population genetics",
          ],
          c: 1,
          e: "A classic result is that most human variation is found within populations rather than between broad continental groups.",
        },
        {
          d: 3,
          cat: "Population Genetics",
          q: "Why do low average Fst values not mean ancestry inference is impossible?",
          a: [
            "Because Fst measures culture, not genes",
            "Small average differences can still produce probabilistic clustering when many loci are used",
            "Because all populations are genetically identical",
            "Because Fst is only used for fossils",
          ],
          c: 1,
          e: "Low differentiation does not prevent statistical ancestry inference across many loci.",
        },
        {
          d: 3,
          cat: "Population Genetics",
          q: "If a population departs from Hardy-Weinberg because of assortative mating, the most direct effect is on:",
          a: [
            "Genotype frequencies",
            "The mutation rate",
            "The fossil record",
            "The chromosome number",
          ],
          c: 0,
          e: "Nonrandom mating changes genotype frequencies even if allele frequencies do not immediately shift much.",
        },
        {
          d: 3,
          cat: "Race and Biology",
          q: "Why do clines undermine typological race concepts?",
          a: [
            "Clines are invisible in humans",
            "Gradual geographic change conflicts with claims of sharp natural racial boundaries",
            "Clines apply only to disease traits",
            "Typologies are based only on blood types",
          ],
          c: 1,
          e: "Gradual variation contradicts the idea of discrete natural racial blocks.",
        },
        {
          d: 3,
          cat: "Genetics",
          q: "A key limitation of mtDNA for reconstructing population history is that it:",
          a: [
            "Tracks only one maternal lineage",
            "Measures every ancestor equally",
            "Cannot mutate",
            "Is inherited from both parents",
          ],
          c: 0,
          e: "mtDNA reflects one narrow lineage and can miss much of the ancestry story.",
        },
        {
          d: 3,
          cat: "Race and Biology",
          q: "Why does the variability of racial labels across countries matter analytically?",
          a: [
            "It suggests race is a stable biological constant",
            "It shows racial classification depends on social history and context",
            "It proves genes are irrelevant",
            "It means ancestry cannot be studied",
          ],
          c: 1,
          e: "Changing labels across time and place support the view that race is socially constructed.",
        },
        {
          d: 3,
          cat: "Anthropology",
          q: "Admixture makes rigid racial classification especially problematic because:",
          a: [
            "It creates lineages that cross supposed category boundaries",
            "It stops evolution",
            "It removes all geographic patterning",
            "It makes every person genetically unique in every trait",
          ],
          c: 0,
          e: "Admixture shows that human histories cross and blend rather than fitting sealed categories.",
        },
        {
          d: 3,
          cat: "Human Evolution",
          q: "A serial founder model predicts that populations farther from Africa will often show:",
          a: [
            "Greater genetic diversity than African populations",
            "Lower genetic diversity on average",
            "No evidence of drift",
            "No private alleles",
          ],
          c: 1,
          e: "Repeated founder events tend to reduce diversity with increasing distance from origin points.",
        },
        {
          d: 3,
          cat: "Ancient DNA",
          q: "Evidence of Neanderthal and Denisovan ancestry in living people supports which conclusion?",
          a: [
            "Archaic and modern humans never met",
            "Interbreeding was part of human history",
            "All humans have identical archaic ancestry",
            "Modern humans evolved separately on each continent",
          ],
          c: 1,
          e: "Ancient DNA supports multiple episodes of introgression into modern human populations.",
        },
        {
          d: 3,
          cat: "Evolution",
          q: "If two populations share similar skin color but differ strongly in ancestry, the best explanation may be:",
          a: [
            "A laboratory error",
            "Convergent adaptation to similar UV regimes",
            "Proof they are the same race",
            "Genetic drift alone in every case",
          ],
          c: 1,
          e: "Similar environments can favor similar traits in different populations.",
        },
        {
          d: 3,
          cat: "Race and Medicine",
          q: "Why can using race as a biological shortcut in medicine be harmful?",
          a: [
            "It can obscure actual causal variables like ancestry, exposure, and structural inequality",
            "It always improves precision",
            "It replaces all lab tests",
            "It eliminates bias automatically",
          ],
          c: 0,
          e: "Broad race labels can distract from the more specific factors driving risk and treatment response.",
        },
        {
          d: 3,
          cat: "Race and Identity",
          q: "Why is genetic ancestry not the same thing as racial identity?",
          a: [
            "Ancestry has no social meaning",
            "Race is shaped by social classification, history, and context beyond genetic lineage",
            "Identity is determined only by mitochondria",
            "Racial identity is fixed by one gene",
          ],
          c: 1,
          e: "Genetic ancestry and social identity intersect but are not interchangeable concepts.",
        },
        {
          d: 3,
          cat: "Population Genetics",
          q: "A balanced polymorphism is most likely when:",
          a: [
            "Heterozygotes have a fitness advantage in a particular environment",
            "Every allele is equally neutral",
            "Selection is absent",
            "Only drift is operating",
          ],
          c: 0,
          e: "Balanced polymorphism can be maintained when heterozygotes have an advantage, as in the sickle-cell case.",
        },
        {
          d: 3,
          cat: "Population Genetics",
          q: "Why can a rare disease allele become common after a founder event?",
          a: [
            "Founder events eliminate selection forever",
            "Sampling can raise its frequency in the founding group before the population grows",
            "The allele mutates into every genome",
            "Because founder events only happen in Europe",
          ],
          c: 1,
          e: "A founder event can amplify a rare allele through chance if founders happen to carry it.",
        },
        {
          d: 3,
          cat: "Human Variation",
          q: "Why are broad group comparisons for polygenic traits difficult to interpret?",
          a: [
            "Polygenic traits ignore environment",
            "Many loci, environmental effects, and history all interact",
            "They are controlled by mtDNA alone",
            "They are all perfectly heritable",
          ],
          c: 1,
          e: "Polygenic traits are shaped by many genes plus environment, making simple group comparisons misleading.",
        },
        {
          d: 3,
          cat: "Race and Biology",
          q: "A major implication of the finding that most variation is within populations is that:",
          a: [
            "Biological race categories are poor summaries of total human variation",
            "No human population history exists",
            "Genes do not affect traits",
            "All populations are evolutionarily identical",
          ],
          c: 0,
          e: "This finding weakens claims that a few race boxes can summarize human biological diversity.",
        },
        {
          d: 3,
          cat: "Migration",
          q: "Sex-biased migration can produce different mtDNA and Y-chromosome patterns because:",
          a: [
            "The Y chromosome and mtDNA track different parental lines",
            "One of them is not genetic",
            "They mutate at the same exact rate",
            "Both always show identical history",
          ],
          c: 0,
          e: "Maternal and paternal lineages can move differently across populations.",
        },
        {
          d: 3,
          cat: "Population Genetics",
          q: "Why are statistical genetic clusters sensitive to sampling design?",
          a: [
            "Clusters are pure natural races waiting to be discovered",
            "The apparent boundaries depend partly on which reference populations are included",
            "Sampling has no effect on clustering",
            "Only fossils determine clusters",
          ],
          c: 1,
          e: "Cluster patterns can change depending on how populations are sampled and labeled.",
        },
        {
          d: 3,
          cat: "Human Variation",
          q: "If a trait changes gradually with latitude, the strongest initial interpretation is:",
          a: [
            "A discrete racial boundary",
            "An environmental gradient possibly interacting with gene flow and selection",
            "A single recent mutation everywhere",
            "Proof that culture is irrelevant",
          ],
          c: 1,
          e: "Latitude-linked clines usually point first to environmental gradients rather than hard group boundaries.",
        },
        {
          d: 3,
          cat: "Population Genetics",
          q: "Gene flow can counteract local adaptation because it:",
          a: [
            "Introduces alleles from other populations",
            "Stops all selection",
            "Makes populations identical instantly",
            "Eliminates recombination",
          ],
          c: 0,
          e: "Incoming alleles can dilute locally favored variants, especially when migration is high.",
        },
        {
          d: 3,
          cat: "Anthropology",
          q: "Why is typological thinking misleading in human variation?",
          a: [
            "It mistakes continuous, overlapping variation for fixed natural kinds",
            "It uses too much genetics",
            "It only applies to plants",
            "It denies migration",
          ],
          c: 0,
          e: "Typologies flatten gradients, overlap, and mixed population histories into false boxes.",
        },
        {
          d: 3,
          cat: "Genomics",
          q: "Why can direct-to-consumer ancestry testing unintentionally reinforce racial thinking?",
          a: [
            "Because DNA has no historical signal",
            "Because probabilistic clusters may be mistaken for natural races",
            "Because companies sequence only mtDNA",
            "Because all customers receive the same result",
          ],
          c: 1,
          e: "People can confuse model-based ancestry groupings with fixed biological race categories.",
        },
        {
          d: 3,
          cat: "Ancient DNA",
          q: "Ancient DNA is especially powerful because it:",
          a: [
            "Eliminates the need for archaeology",
            "Can reveal population movement and admixture directly across time",
            "Proves race is biological",
            "Measures culture without context",
          ],
          c: 1,
          e: "Ancient genomes allow researchers to compare populations across different historical periods directly.",
        },
        {
          d: 3,
          cat: "Race and Medicine",
          q: "A better framework than race-first medicine is to prioritize:",
          a: [
            "Individual ancestry, exposures, family history, and structural context",
            "Skin color alone",
            "Census labels only",
            "Continent labels only",
          ],
          c: 0,
          e: "More precise biological and social variables usually outperform race labels in clinical reasoning.",
        },
        {
          d: 3,
          cat: "Social Biology",
          q: "Why can race still matter biologically even if it is socially constructed?",
          a: [
            "Because social experience can shape exposure, stress, and health outcomes",
            "Because social categories replace genes",
            "Because biology and society never interact",
            "Because race is secretly a subspecies",
          ],
          c: 0,
          e: "Socially constructed race can still affect bodies through lived conditions and inequality.",
        },
        {
          d: 3,
          cat: "Epigenetics",
          q: "A course discussion of epigenetics most strongly supports the claim that:",
          a: [
            "Social and environmental conditions can influence biological outcomes",
            "Genes are irrelevant",
            "Epigenetics replaces evolution",
            "Only one generation matters",
          ],
          c: 0,
          e: "Epigenetics is often used to show how social and environmental conditions can become biologically consequential.",
        },
        {
          d: 3,
          cat: "Human Variation",
          q: "Why is it incorrect to rank populations as biologically 'more evolved' or 'less evolved'?",
          a: [
            "Evolution is goal-directed and one population reached the goal first",
            "Evolution is not a ladder and populations adapt to different histories and environments",
            "Only European populations evolve",
            "Natural selection stopped in humans",
          ],
          c: 1,
          e: "Evolution is not a hierarchy; populations follow different adaptive and demographic histories.",
        },
        {
          d: 3,
          cat: "Population Genetics",
          q: "If two populations have similar average trait values, that similarity alone does NOT prove:",
          a: [
            "They experienced selection",
            "They are closely related genetically",
            "Environment matters",
            "Traits can be polygenic",
          ],
          c: 1,
          e: "Phenotypic similarity can arise through convergence or plasticity, not only close relatedness.",
        },
        {
          d: 3,
          cat: "Race and Biology",
          q: "Why does IB 35AC emphasize both biology and culture together?",
          a: [
            "Because each can shape the other over time",
            "Because culture replaces evolution",
            "Because biology matters only in fossils",
            "Because social life has no effect on bodies",
          ],
          c: 0,
          e: "A central course theme is that biological and cultural processes are mutually shaping.",
        },
        { d: 1, cat: "Genetics", q: "Which of the following is not an example of a locus?", a: ["The lactase gene", "An Aa genotype", "Position 3,926,732 on Chromosome 11"], c: 1, e: "Correct answer: An Aa genotype." },
        { d: 1, cat: "Population Genetics", q: "Which of the following is a correct definition of a polymorphism?", a: ["A locus that is genetically variable in the population", "An exchange of DNA between maternally and paternally inherited copies of DNA", "A specific haploid DNA sequence found in one or more individuals", "A change in allelic state, typically during production of germ cells"], c: 0, e: "Correct answer: A locus that is genetically variable in the population." },
        { d: 2, cat: "Evolution", q: "Which of the following statements are NOT correct?", a: ["Fitness is specific to an environment and genomic context", "The individuals that survive the longest have the highest fitness", "High fitness does not imply better in any other way than heritable propensity for large number of descendants", "Fitness is an average property of alleles, genomes, genetic variants, etc."], c: 1, e: "Fitness is about reproductive success, not lifespan alone." },
        { d: 2, cat: "Population Genetics", q: "Inspecting the DNA sequences, what would you expect FST calculated between these two populations to be?", a: ["Less than 0", "Equal to 0", "Between 0 and 1", "Equal to 1", "Larger than 1"], c: 2, e: "Correct answer: Between 0 and 1." },
        { d: 2, cat: "Population Genetics", q: "FST among human groups is generally:", a: ["Lower than observed among other globally distributed species", "About the same as that observed among other globally distributed species", "Higher than observed among other globally distributed species"], c: 0, e: "Correct answer: Lower than observed among other globally distributed species." },
        { d: 2, cat: "Race and Biology", q: "Lewontin argued against a scientific basis for human racial constructs based on:", a: ["PCA analyses", "A partitioning of genetic variance within and between groups", "Phylogenetic trees", "Admixture analyses"], c: 1, e: "Correct answer: A partitioning of genetic variance within and between groups." },
        { d: 2, cat: "Human Evolution", q: "Time travelling back to East Asia 1 million years ago, which hominin species might you encounter?", a: ["Homo erectus", "Anatomically modern humans", "Neanderthals", "Ardipithecus"], c: 0, e: "Correct answer: Homo erectus." },
        { d: 2, cat: "Human Evolution", q: "What was the first molecular evidence in favor of the out-of-Africa hypothesis based on?", a: ["FST analyses", "Average number of pairwise differences", "mtDNA phylogenies", "Admixture analyses", "PCA analyses"], c: 2, e: "Correct answer: mtDNA phylogenies." },
        { d: 2, cat: "Ancient DNA", q: "As time passes after admixture, the segments of introgressed DNA tend to become:", a: ["Longer", "Shorter", "More genetically differentiated", "More similar to the host DNA"], c: 1, e: "Correct answer: Shorter." },
        { d: 2, cat: "Human Evolution", q: "Humans and Neanderthals interbred:", a: ["In the Middle East approximately 50k years ago", "In the Middle East approximately 100k years ago", "In Africa approximately 50k years ago", "In Africa approximately 100k years ago"], c: 0, e: "Correct answer: In the Middle East approximately 50k years ago." },
        { d: 2, cat: "Migration", q: "The continent of Australia was first populated:", a: ["In 1788 by English sailors", "After the last ice age", "Shortly after the first anatomically modern humans were found outside Africa"], c: 2, e: "Correct answer: Shortly after the first anatomically modern humans were found outside Africa." },
        { d: 2, cat: "Anthropology", q: "Which of the following sentences best reflects the idea of epistemic diversity?", a: ["Scientific inquiries should be done with respect for diversity", "Diversity is a governing principle for understanding life on earth", "Western scientific knowledge does not supersede indigenous knowledge based on oral tradition and lived experiences", "Allowing a diversity of opinions improves scientific discourse"], c: 2, e: "Correct answer: Western scientific knowledge does not supersede indigenous knowledge based on oral tradition and lived experiences." },
        { d: 2, cat: "Human Biology", q: "Which of the following sentences are true?", a: ["Tibetans tend to produce more red blood cells in high altitude than other humans", "Tibetans tend to produce fewer red blood cells in high altitude than other humans", "Tibetans tend to have more Neanderthal admixture than other humans", "Tibetans tend to have less Neanderthal admixture than other humans"], c: 1, e: "The high-altitude adaptation is usually tied to Denisovan-related EPAS1 ancestry, not Neanderthal admixture." },
        { d: 3, cat: "Ancient DNA", q: "Most people in India today are to different degrees admixed between:", a: ["Anatolian farmers, Iranian farmers, and South Asian hunter-gatherers", "Anatolian farmers, Steppe pastoralists, and South Asian hunter-gatherers", "Iranian farmers, Steppe pastoralists, and South Asian hunter-gatherers", "Anatolian farmers, Iranian farmers, and Steppe pastoralists"], c: 2, e: "Correct answer: Iranian farmers, Steppe pastoralists, and South Asian hunter-gatherers." },
        { d: 3, cat: "Race and Identity", q: "The practice of endogamy, meaning only marrying within castes or tribes, in India:", a: ["Has existed for thousands of years", "Is a recently invented praxis"], c: 0, e: "Correct answer: Has existed for thousands of years." },
        { d: 3, cat: "Genomics", q: "Believing, without further evidence, that ancestry components inferred in an Admixture analysis represent real ancestral populations is:", a: ["A consequence of epistemic diversity", "A statistical error", "An example of reification", "A consequence of having too little data"], c: 2, e: "Correct answer: An example of reification." },
        { d: 3, cat: "Migration", q: "According to geneticists and archeologists, the primary route of colonization of the Americas by the ancestors of Native Americans was by:", a: ["Sailing from the Pacific islands", "Sailing from Europe", "Walking from Siberia to Alaska", "Walking along the South Pole to Patagonia"], c: 2, e: "Correct answer: Walking from Siberia to Alaska." },
        { d: 3, cat: "Race and Identity", q: "In genetic analyses, most people in Mexico appear to be admixed between:", a: ["People from Asia, Native Americans, People from Europe", "People from Africa, People from Asia, People from Europe", "People from Africa, Native Americans, People from Asia", "People from Africa, Native Americans, People from Europe"], c: 3, e: "Correct answer: People from Africa, Native Americans, People from Europe." },
        { d: 2, cat: "Gene-Culture Evolution", q: "Lactase persistence is:", a: ["Expression of the lactase gene in adults", "Continuation of the cultural tradition of milk drinking", "Keeping cattle as a form of subsistence farming", "The evolution of milk drinking"], c: 0, e: "Correct answer: Expression of the lactase gene in adults." },
        { d: 1, cat: "Gene-Culture Evolution", q: "Lactase persistence has evolved in Europe and only in Europe.", a: ["True", "False"], c: 1, e: "Correct answer: False." },
        { d: 2, cat: "Evolution", q: "A selective sweep is:", a: ["A form of balancing selection", "The effect of an advantageous mutation going to fixation", "The elimination of deleterious mutations", "When selection increases the number of segregating sites in a population"], c: 1, e: "Correct answer: The effect of an advantageous mutation going to fixation." },
        { d: 3, cat: "Human Biology", q: "In the metabolism of ethanol, the enzyme that catalyzes the conversion of acetaldehyde to acetic acid is:", a: ["ADH, alcohol dehydrogenase", "ALDH, acetaldehyde dehydrogenase", "Amylase", "CO2 + H2O"], c: 1, e: "Correct answer: ALDH, acetaldehyde dehydrogenase." },
        { d: 3, cat: "Gene-Culture Evolution", q: "A high copy number of the amylase gene is associated with:", a: ["High alcohol intake", "Milk consumption in adults", "A diet rich in long-chained PUFAs", "A diet rich in starch"], c: 3, e: "Correct answer: A diet rich in starch." },
        { d: 2, cat: "Evolution", q: "Positive selection is associated with:", a: ["An increase in the rate of synonymous mutations", "A decrease in the rate of synonymous mutations", "An increase in the rate of nonsynonymous mutations", "A decrease in the rate of nonsynonymous mutations"], c: 2, e: "Correct answer: An increase in the rate of nonsynonymous mutations." },
        { d: 3, cat: "Human Biology", q: "MHC molecules are:", a: ["Antiviral factors", "Expressed specifically on T-cells", "Responsible for lysis of cells", "Involved in binding of antigens"], c: 3, e: "Correct answer: Involved in binding of antigens." },
        { d: 2, cat: "Human Biology", q: "MC1R encodes a protein that:", a: ["Is a precursor of the pheomelanin protein", "Is a precursor of the eumelanin protein", "Mediates the signal of pheomelanin production", "Mediates the signal of eumelanin production"], c: 3, e: "Correct answer: Mediates the signal of eumelanin production." },
        { d: 3, cat: "Genomics", q: "A GWAS identifies SNPs that:", a: ["Are associated with specific phenotypes", "Are highly differentiated among populations", "Are under positive selection", "Are under negative selection"], c: 0, e: "Correct answer: Are associated with specific phenotypes." },
        { d: 3, cat: "Comparative Biology", q: "In monoecious animal species:", a: ["Individuals reproduce asexually", "Individuals can choose to be male or female depending on ecological conditions", "Individuals produce either egg or sperm cells", "Individuals produce both egg and sperm cells"], c: 3, e: "Correct answer: Individuals produce both egg and sperm cells." },
        { d: 1, cat: "Human Biology", q: "Sex determination in humans depends on the:", a: ["ADH gene", "MC1R gene", "RIS gene", "SRY gene"], c: 3, e: "Correct answer: SRY gene." },
        { d: 2, cat: "Evolution", q: "It is thought that sex has evolved in order to:", a: ["Increase the reproductive rate", "Facilitate recombination", "Facilitate male-male competition", "Facilitate female choice"], c: 1, e: "Correct answer: Facilitate recombination." },
        { d: 1, cat: "Genetics", q: "Which of the following is NOT a quantitative trait?", a: ["Human height", "Cholesterol levels", "Number of fingers on the right hand", "The score on an IQ test"], c: 2, e: "Correct answer: Number of fingers on the right hand." },
        { d: 2, cat: "Genetics", q: "Heritability measures the similarity between offspring and parents.", a: ["True", "False"], c: 1, e: "Heritability is the proportion of phenotypic variance attributable to genetic variance in a population." },
        { d: 3, cat: "Genetics", q: "In parent-offspring regression, narrow-sense heritability is measured as:", a: ["The intercept of the regression line", "The slope of the regression line", "The mean", "The variance"], c: 1, e: "Correct answer: The slope of the regression line." },
        { d: 3, cat: "Genomics", q: "In an association mapping study, you find evidence for an association if the -log p-value is:", a: ["High", "Low", "Equal to zero", "Negative"], c: 0, e: "Correct answer: High." },
        { d: 3, cat: "Genomics", q: "Which of these answers is NOT commonly invoked as an explanation for the missing heritability problem?", a: ["Twin studies overestimate heritability", "Rare alleles", "Small p-values", "Gene-gene interactions"], c: 2, e: "Correct answer: Small p-values." },
        { d: 3, cat: "Genomics", q: "Which type of variant rarely contributes to common diseases?", a: ["Rare variants of weak effect", "Rare variants of strong effect", "Common variants of weak effect", "Common variants of strong effect"], c: 0, e: "Correct answer: Rare variants of weak effect." },
        { d: 3, cat: "Human Biology", q: "The cause of depression is a deficiency of serotonin.", a: ["True", "False"], c: 1, e: "Correct answer: False." },
        { d: 3, cat: "Genomics", q: "Population stratification in GWAS studies can cause:", a: ["Gene-environment interactions", "False negatives", "False positives", "Gene-gene interactions"], c: 2, e: "Correct answer: False positives." },
        { d: 3, cat: "Genomics", q: "A polygenic score measures:", a: ["The amount of population stratification", "The phenotypic value of the trait", "The number of SNPs affecting the trait", "The combined effect of all SNPs affecting a trait"], c: 3, e: "Correct answer: The combined effect of all SNPs affecting a trait." },
        { d: 2, cat: "Social Biology", q: "Genetic determinism is:", a: ["The idea that behavior and mental activity is fully controlled by genetics", "The idea that disease susceptibility can be informed by genetics", "The idea that our destinies are predetermined", "The idea that genetics is fully determined by behavior"], c: 0, e: "Correct answer: The idea that behavior and mental activity is fully controlled by genetics." },
        { d: 1, cat: "Social Biology", q: "IVF screening of embryos is available and legal in the US.", a: ["True", "False"], c: 0, e: "Correct answer: True." },
        { d: 3, cat: "Social Biology", q: "Eugenic laws were enacted in Germany but never in the United States.", a: ["True", "False"], c: 1, e: "Correct answer: False." },
        { d: 3, cat: "Race and Biology", q: "Darwin believed there were five human races.", a: ["True", "False"], c: 1, e: "Correct answer: False." },
      ];
