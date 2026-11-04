import {
  CATEGORIES,
  CATEGORY_KEYS,
  DARES,
  daresFor,
  shuffle,
} from "./dares.js";

/* ═══════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════ */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const LEVEL_LABEL = { 1: "GENTLE", 2: "BOLD", 3: "FERAL" };
const PLAYER_COLORS = ["#f6ff5c", "#67e8f9", "#ff5ca8", "#4ade80", "#fb923c", "#c084fc", "#fb7185", "#38bdf8"];
const STORAGE_STATS = "daredeck_stats_v1";
const STORAGE_SOUND = "daredeck_sound_v1";
const SAFE_HINTS = {
  ice: "Keep it moving. 30 seconds max.",
  clip: "Gentle pressure only. Stop at sharp pain.",
  endurance: "Tap out at any sharp pain.",
  taste: "Check ingredients and allergies first.",
  social: "Share only what feels okay.",
  movement: "Clear some space first.",
  silly: "Commit to the bit. Stay kind.",
  chaos: "No breaking things. Ask before touching.",
  focus: "Guessing is allowed. Losing is funny.",
  sound: "Indoor volume, please.",
};
const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (value) => String(value).replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initials(name) {
  const pieces = String(name).trim().split(/\s+/).filter(Boolean);
  if (pieces.length > 1) return (pieces[0][0] + pieces[1][0]).toUpperCase();
  return (pieces[0] || "?").slice(0, 2).toUpperCase();
}

function readStore(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage can be unavailable in private modes. The game still works. */
  }
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}

function ordinal(number) {
  const suffix = number % 10 === 1 && number % 100 !== 11 ? "st"
    : number % 10 === 2 && number % 100 !== 12 ? "nd"
      : number % 10 === 3 && number % 100 !== 13 ? "rd" : "th";
  return `${number}${suffix}`;
}

/* ═══════════════════════════════════════════════════════════════════
   Element references
   ═══════════════════════════════════════════════════════════════════ */

const els = {
  screens: $$(".screen"),
  home: $("#screen-home"),
  gameScreen: $("#screen-game"),
  endScreen: $("#screen-end"),
  soundToggle: $("#sound-toggle"),
  rulesButton: $("#rules-button"),
  libraryCount: $("#library-count"),
  deckPreview: $("#deck-preview"),
  modeSwitch: $(".mode-switch"),
  soloOptions: $("#solo-options"),
  groupOptions: $("#group-options"),
  lengthPills: $("#length-pills"),
  turnsPills: $("#turns-pills"),
  intensitySwitch: $(".intensity-switch"),
  intensityHint: $("#intensity-hint"),
  categoryChips: $("#category-chips"),
  selectAll: $("#select-all"),
  playerList: $("#player-list"),
  playerInput: $("#player-input"),
  addPlayer: $("#add-player"),
  playerCount: $("#player-count"),
  totalTurns: $("#total-turns"),
  propsText: $("#props-text"),
  startButton: $("#start-game"),
  rulesDialog: $("#rules-dialog"),
  quitDialog: $("#quit-dialog"),
  confirmQuit: $("#confirm-quit"),
  toast: $("#toast"),
  progressLabel: $("#progress-label"),
  deckLeft: $("#deck-left"),
  progressFill: $("#progress-fill"),
  scorePill: $(".score-pill"),
  scoreValue: $("#score-value"),
  playersStrip: $("#players-strip"),
  turnAvatar: $("#turn-avatar"),
  turnKicker: $("#turn-kicker"),
  turnLabel: $("#turn-label"),
  timerStatus: $("#timer-status"),
  gameCard: $("#game-card"),
  cardCategory: $("#card-category"),
  cardLevel: $("#card-level"),
  cardIcon: $("#card-icon"),
  cardText: $("#card-text"),
  cardHint: $("#card-hint"),
  cardIndex: $("#card-index"),
  timerRingWrap: $("#timer-ring-wrap"),
  timerRing: $("#timer-ring"),
  timerText: $("#timer-text"),
  resultStamp: $("#result-stamp"),
  controls: $("#controls"),
  announcer: $("#game-announcer"),
  endIcon: $("#end-icon"),
  endKicker: $("#end-kicker"),
  endTitle: $("#end-title"),
  endSubtitle: $("#end-subtitle"),
  endStats: $("#end-stats"),
  podium: $("#podium"),
  endFavorite: $("#end-favorite"),
  lifetime: $("#lifetime"),
  playAgain: $("#play-again"),
  changeSetup: $("#change-setup"),
  quitGame: $("#quit-game"),
  fx: $("#fx"),
};

/* ═══════════════════════════════════════════════════════════════════
   UI setup state (home screen)
   ═══════════════════════════════════════════════════════════════════ */

const ui = {
  mode: "solo",
  length: 10,
  turns: 3,
  level: 2,
  categories: new Set(CATEGORY_KEYS),
  players: [{ name: "Player 1" }, { name: "Player 2" }],
};

let game = null;
let timerId = null;
let lastTickSecond = null;
let toastTimer = null;
let muted = readStore(STORAGE_SOUND, false) === true;

/* ═══════════════════════════════════════════════════════════════════
   Sound
   ═══════════════════════════════════════════════════════════════════ */

let audioContext = null;

function ensureAudio() {
  if (muted) return null;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) audioContext = new AudioCtor();
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  return audioContext;
}

function note(context, frequency, delay, duration, type = "sine", volume = 0.05) {
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function playSound(kind) {
  const context = ensureAudio();
  if (!context) return;
  if (kind === "draw") {
    note(context, 520, 0, 0.09, "triangle", 0.045);
    note(context, 780, 0.07, 0.13, "triangle", 0.04);
  } else if (kind === "start") {
    note(context, 660, 0, 0.08, "sine", 0.04);
  } else if (kind === "pause") {
    note(context, 420, 0, 0.09, "sine", 0.035);
  } else if (kind === "tick") {
    note(context, 880, 0, 0.05, "square", 0.018);
  } else if (kind === "timeup") {
    note(context, 250, 0, 0.2, "sawtooth", 0.035);
    note(context, 190, 0.17, 0.28, "sawtooth", 0.03);
  } else if (kind === "success") {
    [523, 659, 784, 1047].forEach((frequency, index) => {
      note(context, frequency, index * 0.075, 0.2, "triangle", 0.05);
    });
  } else if (kind === "fail") {
    [330, 262, 196].forEach((frequency, index) => {
      note(context, frequency, index * 0.1, 0.18, "sawtooth", 0.03);
    });
  } else if (kind === "skip") {
    note(context, 392, 0, 0.1, "sine", 0.035);
    note(context, 330, 0.09, 0.13, "sine", 0.03);
  }
}

function updateSoundUi() {
  document.body.classList.toggle("is-muted", muted);
  els.soundToggle.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
  els.soundToggle.title = muted ? "Sound off" : "Sound on";
}

/* ═══════════════════════════════════════════════════════════════════
   Confetti
   ═══════════════════════════════════════════════════════════════════ */

const fxContext = els.fx.getContext("2d");
const confetti = { particles: [], frame: 0, last: 0, width: 0, height: 0, dpr: 1 };

function resizeFx() {
  confetti.dpr = Math.min(2, window.devicePixelRatio || 1);
  confetti.width = window.innerWidth;
  confetti.height = window.innerHeight;
  els.fx.width = Math.floor(confetti.width * confetti.dpr);
  els.fx.height = Math.floor(confetti.height * confetti.dpr);
  fxContext.setTransform(confetti.dpr, 0, 0, confetti.dpr, 0, 0);
}

function burstConfetti(count = 85, accent = "#f6ff5c") {
  if (prefersReducedMotion()) return;
  const palette = [accent, "#f6ff5c", "#ff5ca8", "#67e8f9", "#ffffff"];
  const originX = confetti.width / 2;
  const originY = confetti.height * 0.42;
  if (confetti.particles.length > 260) {
    confetti.particles.splice(0, confetti.particles.length - 260);
  }
  for (let index = 0; index < count; index += 1) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.1;
    const speed = 260 + Math.random() * 620;
    confetti.particles.push({
      x: originX + (Math.random() - 0.5) * 120,
      y: originY + (Math.random() - 0.5) * 40,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 7,
      color: palette[Math.floor(Math.random() * palette.length)],
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 12,
      life: 1.4 + Math.random() * 0.8,
      age: 0,
      round: Math.random() > 0.55,
    });
  }
  if (!confetti.frame) {
    confetti.last = performance.now();
    confetti.frame = requestAnimationFrame(stepConfetti);
  }
}

function stepConfetti(timestamp) {
  const delta = Math.min(0.04, (timestamp - confetti.last) / 1000);
  confetti.last = timestamp;
  fxContext.clearRect(0, 0, confetti.width, confetti.height);
  confetti.particles = confetti.particles.filter((particle) => {
    particle.age += delta;
    if (particle.age >= particle.life) return false;
    particle.vy += 780 * delta;
    particle.vx *= 0.988;
    particle.vy *= 0.992;
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.rotation += particle.spin * delta;
    const fade = Math.max(0, 1 - Math.max(0, (particle.age - particle.life * 0.62) / (particle.life * 0.38)));
    fxContext.save();
    fxContext.globalAlpha = fade;
    fxContext.translate(particle.x, particle.y);
    fxContext.rotate(particle.rotation);
    fxContext.fillStyle = particle.color;
    if (particle.round) {
      fxContext.beginPath();
      fxContext.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
      fxContext.fill();
    } else {
      fxContext.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
    }
    fxContext.restore();
    return true;
  });
  if (confetti.particles.length) {
    confetti.frame = requestAnimationFrame(stepConfetti);
  } else {
    confetti.frame = 0;
    fxContext.clearRect(0, 0, confetti.width, confetti.height);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   Setup screen
   ═══════════════════════════════════════════════════════════════════ */

function renderCategoryChips() {
  els.categoryChips.innerHTML = CATEGORY_KEYS.map((key) => {
    const category = CATEGORIES[key];
    const selected = ui.categories.has(key);
    return `<button type="button" class="chip${selected ? " is-on" : ""}" data-category="${key}" style="--cat:${category.color}" aria-pressed="${selected}" title="${esc(category.blurb)}"><span class="chip-icon" aria-hidden="true">${category.icon}</span>${category.name}</button>`;
  }).join("");
}

function renderPlayers() {
  els.playerList.innerHTML = ui.players.map((player, index) => `
    <div class="player-row">
      <span class="player-dot" style="--dot:${PLAYER_COLORS[index % PLAYER_COLORS.length]}" aria-hidden="true">${index + 1}</span>
      <input class="player-input" data-player-index="${index}" type="text" maxlength="14" value="${esc(player.name)}" placeholder="Player ${index + 1}" aria-label="Player ${index + 1} name" autocomplete="off">
      <button class="remove-player" data-remove-player="${index}" type="button" aria-label="Remove ${esc(player.name)}" ${ui.players.length <= 2 ? "disabled" : ""}>✕</button>
    </div>
  `).join("");
  updateSetupSummary();
}

function uniquePlayerNames(players) {
  const seen = new Map();
  return players.map((player) => {
    const base = String(player.name || "").trim().slice(0, 14) || "Player";
    const count = (seen.get(base.toLowerCase()) || 0) + 1;
    seen.set(base.toLowerCase(), count);
    return count === 1 ? base : `${base} ${count}`.slice(0, 16);
  });
}

function selectedCount() {
  return daresFor({
    categories: [...ui.categories],
    maxLevel: ui.level,
    playerCount: ui.mode === "group" ? ui.players.length : 1,
  }).length;
}

function updateSetupSummary() {
  const count = selectedCount();
  els.deckPreview.textContent = String(count);
  els.playerCount.textContent = String(ui.players.length);
  els.totalTurns.textContent = String(ui.players.length * ui.turns);
  els.intensityHint.textContent = `Max level ${ui.level}`;
  els.startButton.disabled = count === 0;

  const props = [];
  if (ui.categories.has("ice")) props.push("ice cubes");
  if (ui.categories.has("clip")) props.push("clothespins");
  if (ui.categories.has("taste")) props.push("safe snacks");
  props.push("a timer");
  const list = props.length === 2 ? props.join(" and ") : `${props.slice(0, -1).join(", ")}, and ${props[props.length - 1]}`;
  const allergy = ui.categories.has("taste") ? " Check ingredients and allergies before any taste dare." : "";
  els.propsText.textContent = `Grab ${list}.${allergy}`;

  els.playerList.querySelectorAll(".remove-player").forEach((button) => {
    button.disabled = ui.players.length <= 2;
  });
}

function setMode(mode) {
  if (mode !== "solo" && mode !== "group") return;
  ui.mode = mode;
  $$(".seg-btn", els.modeSwitch).forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  els.soloOptions.hidden = mode === "group";
  els.groupOptions.hidden = mode !== "group";
  if (mode === "group" && ui.players.length < 2) {
    ui.players = [{ name: "Player 1" }, { name: "Player 2" }];
    renderPlayers();
  }
  updateSetupSummary();
}

function currentConfig() {
  const players = uniquePlayerNames(ui.players).map((name) => ({ name }));
  return {
    mode: ui.mode,
    length: ui.length,
    turns: ui.turns,
    level: ui.level,
    categories: [...ui.categories],
    players: ui.mode === "group" ? players : [{ name: "You" }],
  };
}

/* ═══════════════════════════════════════════════════════════════════
   Screen + toast utilities
   ═══════════════════════════════════════════════════════════════════ */

let activeScreenName = "home";

function showScreen(name) {
  const focused = document.activeElement;
  if (focused && focused !== document.body && typeof focused.blur === "function") focused.blur();
  const changed = name !== activeScreenName;
  activeScreenName = name;
  els.screens.forEach((screen) => {
    const active = screen.id === `screen-${name}`;
    screen.classList.toggle("is-active", active);
    screen.classList.remove("is-entering");
    screen.hidden = !active;
    if (active && changed) {
      void screen.offsetWidth;
      screen.classList.add("is-entering");
      window.setTimeout(() => screen.classList.remove("is-entering"), 500);
    }
  });
  document.body.classList.toggle("in-game", name === "game");
  document.body.classList.toggle("is-end", name === "end");
  window.scrollTo({ top: 0, behavior: "auto" });
}

function showToast(message, duration = 2800) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => els.toast.classList.remove("is-visible"), duration);
}

/* ═══════════════════════════════════════════════════════════════════
   Game lifecycle
   ═══════════════════════════════════════════════════════════════════ */

function startGame(config) {
  if (!config) return;
  const categories = Array.isArray(config.categories) && config.categories.length
    ? config.categories
    : [...ui.categories];
  if (!categories.length) {
    showToast("Pick at least one dare category.");
    return;
  }

  const players = (config.players || []).map((player, index) => ({
    name: String(player.name || `Player ${index + 1}`).slice(0, 16),
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    score: 0,
    done: 0,
    chicken: 0,
    skip: 0,
    streak: 0,
    bestStreak: 0,
    cats: {},
  }));

  if (config.mode === "group" && players.length < 2) {
    showToast("Group mode needs at least two players.");
    return;
  }

  const deck = shuffle(daresFor({
    categories,
    maxLevel: config.level || 3,
    playerCount: players.length,
  }));

  if (!deck.length) {
    showToast("No dares match that setup. Add a category or raise the intensity.");
    return;
  }

  const wantedTurns = config.mode === "solo"
    ? Number(config.length) || 10
    : players.length * (Number(config.turns) || 1);
  const totalTurns = Math.min(wantedTurns, deck.length);

  stopTimer();
  game = {
    config: {
      mode: config.mode,
      length: Number(config.length) || 10,
      turns: Number(config.turns) || 1,
      level: Number(config.level) || 3,
      categories: [...categories],
      players: players.map((player) => ({ name: player.name })),
    },
    players,
    deck,
    deckSize: deck.length,
    totalTurns,
    wantedTurns,
    turn: 1,
    drawn: 0,
    activeIndex: 0,
    phase: "deal",
    currentDare: null,
    result: null,
    timer: { total: 0, remaining: 0, started: false, endAt: 0 },
    finished: false,
    statsRecorded: false,
  };

  els.resultStamp.hidden = true;
  els.resultStamp.className = "result-stamp";
  els.resultStamp.innerHTML = "";
  els.gameCard.classList.remove("is-success", "is-fail");
  showScreen("game");
  dealNext();

  if (totalTurns < wantedTurns) {
    showToast(`Only ${totalTurns} dares match those filters — the run was shortened.`);
  }
}

function dealNext() {
  if (!game) return;
  if (game.turn > game.totalTurns || game.deck.length === 0) {
    endGame();
    return;
  }

  game.activeIndex = game.config.mode === "group"
    ? (game.turn - 1) % game.players.length
    : 0;
  game.currentDare = game.deck.pop();
  game.drawn += 1;
  game.phase = "deal";
  game.result = null;
  game.timer = {
    total: game.currentDare.secs || 0,
    remaining: game.currentDare.secs || 0,
    started: false,
    endAt: 0,
  };

  renderGame();
  animateCard();
  playSound("draw");
}

function animateCard() {
  els.gameCard.classList.remove("is-dealing");
  void els.gameCard.offsetWidth;
  els.gameCard.classList.add("is-dealing");
  window.setTimeout(() => els.gameCard.classList.remove("is-dealing"), 620);
}

function activePlayer() {
  return game ? game.players[game.activeIndex] : null;
}

function renderGame() {
  if (!game || !game.currentDare) return;
  const dare = game.currentDare;
  const category = CATEGORIES[dare.cat];
  const player = activePlayer();
  const round = Math.floor((game.turn - 1) / game.players.length) + 1;

  els.gameCard.style.setProperty("--cat", category.color);
  els.cardCategory.textContent = `${category.icon} ${category.name}`;
  els.cardLevel.textContent = `LEVEL ${dare.lvl} · ${LEVEL_LABEL[dare.lvl]}`;
  els.cardIcon.textContent = category.icon;
  els.cardText.textContent = dare.text;
  els.cardHint.textContent = SAFE_HINTS[dare.cat] || "Stop anytime. Skip is free.";
  els.cardIndex.textContent = `#${String(game.drawn).padStart(3, "0")} / ${game.deckSize}`;
  els.announcer.textContent = `${category.name} dare, level ${dare.lvl}. ${dare.text}`;
  els.gameCard.classList.remove("is-success", "is-fail");
  els.resultStamp.hidden = true;
  els.resultStamp.className = "result-stamp";
  els.resultStamp.innerHTML = "";

  if (game.config.mode === "group") {
    els.turnKicker.textContent = `ROUND ${round} OF ${game.config.turns}`;
    els.turnLabel.textContent = player.name;
    els.turnAvatar.textContent = initials(player.name);
    els.turnAvatar.style.setProperty("--dot", player.color);
    els.turnAvatar.style.background = `${player.color}22`;
    els.turnAvatar.style.borderColor = `${player.color}66`;
    els.turnAvatar.style.color = player.color;
    els.turnAvatar.style.fontSize = "11px";
    els.turnAvatar.style.fontWeight = "900";
  } else {
    els.turnKicker.textContent = "YOUR TURN";
    els.turnLabel.textContent = `Dare ${game.turn}`;
    els.turnAvatar.textContent = "🕺";
    els.turnAvatar.removeAttribute("style");
  }

  els.timerRingWrap.classList.toggle("is-off", game.timer.total <= 0);
  els.timerRingWrap.classList.remove("is-urgent");
  setTimerUi(game.timer.remaining, game.timer.total);
  setTimerStatus("Ready", "");
  updateProgress();
  updateScore(false);
  updatePlayersStrip();
  renderControls();
}

function updateProgress() {
  if (!game) return;
  const completed = game.phase === "result" ? game.turn : Math.max(0, game.turn - 1);
  const percentage = game.totalTurns ? (completed / game.totalTurns) * 100 : 0;
  els.progressFill.style.width = `${percentage}%`;
  els.progressLabel.textContent = `Dare ${game.turn} of ${game.totalTurns}`;
  els.deckLeft.textContent = `${game.deck.length} left`;
}

function updateScore(animate = false) {
  if (!game) return;
  const player = activePlayer();
  els.scoreValue.textContent = String(player ? player.score : 0);
  els.scorePill.setAttribute("aria-label", `${player ? player.name : "Player"} score: ${player ? player.score : 0}`);
  if (animate) {
    els.scorePill.classList.remove("is-popping");
    void els.scorePill.offsetWidth;
    els.scorePill.classList.add("is-popping");
    window.setTimeout(() => els.scorePill.classList.remove("is-popping"), 500);
  }
}

function updatePlayersStrip() {
  if (!game) return;
  const group = game.players.length > 1;
  els.playersStrip.hidden = !group;
  if (!group) {
    els.playersStrip.innerHTML = "";
    return;
  }
  els.playersStrip.innerHTML = game.players.map((player, index) => `
    <div class="player-chip${index === game.activeIndex ? " is-active" : ""}" aria-label="${esc(player.name)}: ${player.score} points">
      <span class="player-dot" style="--dot:${player.color}" aria-hidden="true">${initials(player.name)}</span>
      <span>${esc(player.name)}</span>
      <span class="chip-score">${player.score}</span>
    </div>
  `).join("");
  const activeChip = els.playersStrip.querySelector(".is-active");
  if (activeChip) {
    const left = activeChip.offsetLeft - els.playersStrip.clientWidth / 2 + activeChip.offsetWidth / 2;
    els.playersStrip.scrollTo({ left: Math.max(0, left), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }
}

function setTimerStatus(text, modifier) {
  els.timerStatus.textContent = text;
  els.timerStatus.className = `timer-status${modifier ? ` ${modifier}` : ""}`;
}

function setTimerUi(remaining, total) {
  if (total <= 0) {
    els.timerRing.style.strokeDashoffset = "0";
    els.timerText.textContent = "∞";
    els.timerRingWrap.classList.add("is-off");
    els.timerRingWrap.classList.remove("is-urgent");
    return;
  }
  const ratio = Math.max(0, Math.min(1, remaining / total));
  const circumference = 169.65;
  els.timerRing.style.strokeDashoffset = String(circumference * (1 - ratio));
  els.timerText.textContent = formatTime(remaining);
  const urgent = remaining > 0 && remaining <= 5 && game && game.phase === "running";
  els.timerRingWrap.classList.toggle("is-urgent", urgent);
}

/* ── Timer ─────────────────────────────────────────────────────────── */

function startTimer() {
  if (!game || !game.currentDare || game.currentDare.secs <= 0) return;
  if (game.phase === "running") return;
  const remaining = game.timer.remaining > 0 ? game.timer.remaining : game.timer.total;
  game.timer.remaining = remaining;
  game.timer.endAt = performance.now() + remaining * 1000;
  game.timer.started = true;
  game.phase = "running";
  lastTickSecond = null;
  window.clearInterval(timerId);
  timerId = window.setInterval(tickTimer, 80);
  setTimerStatus("Live", "is-live");
  els.cardHint.textContent = "Timer running. Breathe.";
  renderControls();
  playSound("start");
}

function pauseTimer() {
  if (!game || game.phase !== "running") return;
  game.timer.remaining = Math.max(0, (game.timer.endAt - performance.now()) / 1000);
  window.clearInterval(timerId);
  timerId = null;
  game.phase = "paused";
  setTimerUi(game.timer.remaining, game.timer.total);
  setTimerStatus("Paused", "is-paused");
  els.cardHint.textContent = "Paused. Take your time.";
  renderControls();
  playSound("pause");
}

function resumeTimer() {
  if (!game || game.phase !== "paused") return;
  startTimer();
}

function stopTimer() {
  window.clearInterval(timerId);
  timerId = null;
}

function tickTimer() {
  if (!game || game.phase !== "running") return;
  const remaining = Math.max(0, (game.timer.endAt - performance.now()) / 1000);
  game.timer.remaining = remaining;
  setTimerUi(remaining, game.timer.total);

  const second = Math.ceil(remaining);
  if (second > 0 && second <= 3 && second !== lastTickSecond) {
    lastTickSecond = second;
    playSound("tick");
  }

  if (remaining <= 0) {
    stopTimer();
    game.phase = "timeup";
    game.timer.remaining = 0;
    setTimerUi(0, game.timer.total);
    setTimerStatus("Time!", "is-done");
    els.cardHint.textContent = "Time's up. Well? Did you hold it?";
    renderControls();
    playSound("timeup");
  }
}

/* ── Controls ──────────────────────────────────────────────────────── */

function controlsButton(action, label, className, extra = "") {
  return `<button type="button" class="${className}" data-action="${action}" ${extra}>${label}</button>`;
}

function nextTurnLabel() {
  if (!game) return "Next";
  const nextTurn = game.turn + 1;
  if (nextTurn > game.totalTurns || game.deck.length === 0) return "See results";
  if (game.config.mode === "group") {
    const nextPlayer = game.players[(nextTurn - 1) % game.players.length];
    return `Next: ${nextPlayer.name}`;
  }
  return "Next dare";
}

function renderControls() {
  if (!game) return;
  const timed = game.timer.total > 0;
  let markup = "";

  if (game.phase === "result") {
    markup = controlsButton("next", `${esc(nextTurnLabel())} →`, "primary-button wide");
  } else if (game.phase === "running") {
    markup = [
      controlsButton("timer", "Pause", "primary-button"),
      controlsButton("done", "Done", "secondary-button"),
      controlsButton("chicken", "Chicken out", "ghost-button"),
      controlsButton("skip", "Skip this dare (safe word)", "ghost-button skip-button"),
    ].join("");
  } else if (game.phase === "paused") {
    markup = [
      controlsButton("timer", "Resume", "primary-button"),
      controlsButton("done", "Done", "secondary-button"),
      controlsButton("chicken", "Chicken out", "ghost-button"),
      controlsButton("skip", "Skip this dare (safe word)", "ghost-button skip-button"),
    ].join("");
  } else if (game.phase === "timeup") {
    markup = [
      controlsButton("done", "Done", "primary-button"),
      controlsButton("chicken", "Chicken out", "secondary-button"),
      controlsButton("skip", "Skip this dare (safe word)", "ghost-button skip-button"),
    ].join("");
  } else {
    markup = [
      timed ? controlsButton("timer", "Start timer", "primary-button") : "",
      controlsButton("done", timed ? "Done" : "Done — I did it", timed ? "secondary-button" : "primary-button"),
      controlsButton("chicken", "Chicken out", timed ? "ghost-button" : "secondary-button"),
      controlsButton("skip", "Skip this dare (safe word)", "ghost-button skip-button"),
    ].join("");
  }

  els.controls.innerHTML = markup;
}

/* ── Resolve a card ────────────────────────────────────────────────── */

function resolveCard(kind) {
  if (!game || game.phase === "result") return;
  const dare = game.currentDare;
  const player = activePlayer();
  if (!dare || !player) return;

  stopTimer();
  const previousScore = player.score;
  let points = 0;
  let bonus = 0;

  if (kind === "done") {
    bonus = game.timer.started && game.timer.total > 0 && game.timer.remaining > game.timer.total * 0.35 ? 5 : 0;
    points = 10 + dare.lvl * 5 + bonus;
    player.score += points;
    player.done += 1;
    player.streak += 1;
    player.bestStreak = Math.max(player.bestStreak, player.streak);
    player.cats[dare.cat] = (player.cats[dare.cat] || 0) + 1;
  } else if (kind === "chicken") {
    player.chicken += 1;
    player.streak = 0;
  } else {
    player.skip += 1;
  }

  game.phase = "result";
  game.result = { kind, points, bonus, previousScore, playerName: player.name };
  renderResultUi(kind, points, bonus);
  els.announcer.textContent = kind === "done"
    ? `Nailed it. ${points} points for ${player.name}.`
    : kind === "chicken"
      ? `${player.name} chickened out. No points.`
      : `${player.name} used the safe word. Card skipped.`;
  setTimerStatus(kind === "done" ? "Done" : kind === "chicken" ? "Chicken" : "Skipped", "is-done");
  updateProgress();
  updateScore(kind === "done");
  updatePlayersStrip();
  renderControls();

  if (kind === "done") {
    const accent = CATEGORIES[dare.cat] ? CATEGORIES[dare.cat].color : "#f6ff5c";
    burstConfetti(90, accent);
    playSound("success");
  } else if (kind === "chicken") {
    playSound("fail");
  } else {
    playSound("skip");
  }
}

function renderResultUi(kind, points, bonus) {
  els.resultStamp.hidden = false;
  els.resultStamp.className = "result-stamp";
  els.gameCard.classList.remove("is-success", "is-fail");

  if (kind === "done") {
    els.gameCard.classList.add("is-success");
    els.resultStamp.innerHTML = `
      <strong>NAILED IT</strong>
      <span>+${points} PTS</span>
      <small>${bonus ? "Includes a +5 fast-finish bonus." : "One less card. One more story."}</small>
    `;
    els.cardHint.textContent = "Result locked in.";
  } else if (kind === "chicken") {
    els.gameCard.classList.add("is-fail");
    els.resultStamp.classList.add("is-fail");
    els.resultStamp.innerHTML = `
      <strong>CHICKENED OUT</strong>
      <span>0 PTS</span>
      <small>No shame. The card has left the deck.</small>
    `;
    els.cardHint.textContent = "Honesty counts.";
  } else {
    els.resultStamp.classList.add("is-skip");
    els.resultStamp.innerHTML = `
      <strong>SAFE WORD</strong>
      <span>SKIPPED</span>
      <small>No explanation needed. Moving on.</small>
    `;
    els.cardHint.textContent = "Skipped without drama.";
  }
}

function nextTurn() {
  if (!game) return;
  game.turn += 1;
  if (game.turn > game.totalTurns || game.deck.length === 0) {
    endGame();
    return;
  }
  dealNext();
}

/* ═══════════════════════════════════════════════════════════════════
   End screen
   ═══════════════════════════════════════════════════════════════════ */

function loadStats() {
  const defaults = {
    games: 0,
    dares: 0,
    points: 0,
    bestScore: 0,
    bestStreak: 0,
  };
  return { ...defaults, ...readStore(STORAGE_STATS, defaults) };
}

function soloRank(ratio, played) {
  if (played === 0) return { title: "No Dares Taken", icon: "🫥" };
  if (ratio === 1) return { title: "Certified Menace", icon: "👑" };
  if (ratio >= 0.8) return { title: "Daredevil", icon: "🔥" };
  if (ratio >= 0.5) return { title: "Brave-ish", icon: "🫡" };
  if (ratio > 0) return { title: "Cardboard Hero", icon: "📦" };
  return { title: "Professional Spectator", icon: "🍿" };
}

function endGame() {
  if (!game || game.finished) return;
  game.finished = true;
  stopTimer();

  const players = game.players;
  const totalDone = players.reduce((sum, player) => sum + player.done, 0);
  const totalChicken = players.reduce((sum, player) => sum + player.chicken, 0);
  const totalSkip = players.reduce((sum, player) => sum + player.skip, 0);
  const played = totalDone + totalChicken + totalSkip;
  const totalScore = players.reduce((sum, player) => sum + player.score, 0);
  const bestStreak = Math.max(0, ...players.map((player) => player.bestStreak));
  const sorted = [...players].sort((a, b) => b.score - a.score || b.done - a.done || a.name.localeCompare(b.name));
  const topScore = sorted.length ? sorted[0].score : 0;

  const categoryTotals = {};
  players.forEach((player) => {
    Object.entries(player.cats).forEach(([key, value]) => {
      categoryTotals[key] = (categoryTotals[key] || 0) + value;
    });
  });
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const stats = loadStats();
  if (!game.statsRecorded) {
    stats.games += 1;
    stats.dares += totalDone;
    stats.points += totalScore;
    stats.bestScore = Math.max(stats.bestScore || 0, topScore);
    stats.bestStreak = Math.max(stats.bestStreak || 0, bestStreak);
    writeStore(STORAGE_STATS, stats);
    game.statsRecorded = true;
  }

  els.endKicker.textContent = game.deck.length === 0 ? "DECK COMPLETE" : "RUN COMPLETE";

  if (game.config.mode === "group") {
    const tied = sorted.filter((player) => player.score === topScore);
    els.endIcon.textContent = "🏆";
    if (topScore === 0) {
      els.endTitle.textContent = "The Deck Wins";
      els.endSubtitle.textContent = "Zero points between you. Bold strategy. The dares remain undefeated.";
    } else if (tied.length > 1) {
      els.endTitle.textContent = "Dead Heat!";
      els.endSubtitle.textContent = `A shared crown at ${topScore} points for ${tied.map((player) => player.name).join(" and ")}. Everyone survives.`;
    } else {
      els.endTitle.textContent = `${sorted[0].name} Wins!`;
      els.endSubtitle.textContent = `${sorted[0].name} banked ${topScore} points. Everyone survives, which is honestly the real win.`;
    }
  } else {
    const ratio = played ? totalDone / played : 0;
    const rank = soloRank(ratio, played);
    els.endIcon.textContent = rank.icon;
    els.endTitle.textContent = rank.title;
    els.endSubtitle.textContent = played
      ? `${totalDone} of ${played} dares completed for ${totalScore} points. The deck has been notified.`
      : "You skipped every card. Technically flawless. Spiritually suspicious.";
  }

  els.announcer.textContent = `${els.endTitle.textContent}. ${els.endSubtitle.textContent}`;

  els.endStats.innerHTML = [
    { value: `${totalDone}/${played || game.totalTurns}`, label: "Dares done" },
    { value: game.config.mode === "group" ? String(topScore) : String(totalScore), label: game.config.mode === "group" ? "Top score" : "Score" },
    { value: String(bestStreak), label: "Best streak" },
    { value: String(totalChicken + totalSkip), label: "Bailouts" },
  ].map((stat) => `<div class="stat"><strong>${stat.value}</strong><span>${stat.label}</span></div>`).join("");

  els.podium.hidden = game.config.mode !== "group";
  if (game.config.mode === "group") {
    const medals = ["🥇", "🥈", "🥉"];
    els.podium.innerHTML = sorted.map((player, index) => `
      <div class="podium-row${index === 0 ? " is-winner" : ""}">
        <span class="podium-rank" aria-hidden="true">${medals[index] || ordinal(index + 1)}</span>
        <span class="podium-name">${esc(player.name)}</span>
        <span class="podium-score">${player.done} done · ${player.score} pts</span>
      </div>
    `).join("");
  }

  els.endFavorite.hidden = !topCategory;
  if (topCategory) {
    const category = CATEGORIES[topCategory[0]];
    els.endFavorite.innerHTML = `Most conquered: <strong>${category.icon} ${category.name} ×${topCategory[1]}</strong>`;
  }

  els.lifetime.textContent = `Lifetime: ${stats.games} ${stats.games === 1 ? "run" : "runs"} · ${stats.dares} dares completed · best score ${stats.bestScore}`;

  showScreen("end");
  if (totalDone > 0) burstConfetti(85, topCategory ? CATEGORIES[topCategory[0]].color : "#f6ff5c");
}

/* ═══════════════════════════════════════════════════════════════════
   Event wiring
   ═══════════════════════════════════════════════════════════════════ */

els.modeSwitch.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mode]");
  if (button) setMode(button.dataset.mode);
});

els.lengthPills.addEventListener("click", (event) => {
  const button = event.target.closest("[data-length]");
  if (!button) return;
  ui.length = Number(button.dataset.length);
  $$(".pill", els.lengthPills).forEach((pill) => pill.classList.toggle("is-active", pill === button));
  updateSetupSummary();
});

els.turnsPills.addEventListener("click", (event) => {
  const button = event.target.closest("[data-turns]");
  if (!button) return;
  ui.turns = Number(button.dataset.turns);
  $$(".pill", els.turnsPills).forEach((pill) => pill.classList.toggle("is-active", pill === button));
  updateSetupSummary();
});

els.intensitySwitch.addEventListener("click", (event) => {
  const button = event.target.closest("[data-level]");
  if (!button) return;
  ui.level = Number(button.dataset.level);
  $$(".seg-btn", els.intensitySwitch).forEach((seg) => seg.classList.toggle("is-active", seg === button));
  updateSetupSummary();
});

els.categoryChips.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  const key = button.dataset.category;
  if (ui.categories.has(key)) {
    if (ui.categories.size === 1) {
      showToast("Keep at least one category in the deck.");
      return;
    }
    ui.categories.delete(key);
  } else {
    ui.categories.add(key);
  }
  button.classList.toggle("is-on", ui.categories.has(key));
  button.setAttribute("aria-pressed", String(ui.categories.has(key)));
  updateSetupSummary();
});

els.selectAll.addEventListener("click", () => {
  ui.categories = new Set(CATEGORY_KEYS);
  renderCategoryChips();
  updateSetupSummary();
  showToast("All ten categories are back in the deck.");
});

els.playerList.addEventListener("input", (event) => {
  const input = event.target.closest("[data-player-index]");
  if (!input) return;
  const index = Number(input.dataset.playerIndex);
  if (ui.players[index]) ui.players[index].name = input.value;
  els.totalTurns.textContent = String(ui.players.length * ui.turns);
});

els.playerList.addEventListener("change", (event) => {
  const input = event.target.closest("[data-player-index]");
  if (!input) return;
  const index = Number(input.dataset.playerIndex);
  if (!input.value.trim()) input.value = `Player ${index + 1}`;
  if (ui.players[index]) ui.players[index].name = input.value.trim();
  updateSetupSummary();
});

els.playerList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-player]");
  if (!button || ui.players.length <= 2) return;
  ui.players.splice(Number(button.dataset.removePlayer), 1);
  renderPlayers();
});

function addPlayer() {
  if (ui.players.length >= 8) {
    showToast("Eight players is the limit. The deck has enough chaos already.");
    return;
  }
  const typed = els.playerInput.value.trim().slice(0, 14);
  ui.players.push({ name: typed || `Player ${ui.players.length + 1}` });
  els.playerInput.value = "";
  renderPlayers();
  const inputs = $$(".player-input", els.playerList);
  inputs[inputs.length - 1]?.focus();
}

els.addPlayer.addEventListener("click", addPlayer);
els.playerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addPlayer();
  }
});

els.startButton.addEventListener("click", () => {
  const config = currentConfig();
  if (!ui.categories.size) {
    showToast("Pick at least one dare category.");
    return;
  }
  if (ui.mode === "group" && ui.players.length < 2) {
    showToast("Group mode needs at least two players.");
    return;
  }
  startGame(config);
});

els.controls.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "timer") {
    if (!game) return;
    if (game.phase === "deal") startTimer();
    else if (game.phase === "running") pauseTimer();
    else if (game.phase === "paused") resumeTimer();
  } else if (action === "done") {
    resolveCard("done");
  } else if (action === "chicken") {
    resolveCard("chicken");
  } else if (action === "skip") {
    resolveCard("skip");
  } else if (action === "next") {
    nextTurn();
  }
});

els.soundToggle.addEventListener("click", () => {
  muted = !muted;
  writeStore(STORAGE_SOUND, muted);
  updateSoundUi();
  if (!muted) playSound("start");
  showToast(muted ? "Sound off." : "Sound on.");
});

els.rulesButton.addEventListener("click", () => {
  if (typeof els.rulesDialog.showModal === "function") els.rulesDialog.showModal();
  else els.rulesDialog.setAttribute("open", "");
});

els.quitGame.addEventListener("click", () => {
  if (!game || game.finished) {
    showScreen("home");
    return;
  }
  if (typeof els.quitDialog.showModal === "function") els.quitDialog.showModal();
  else if (window.confirm("Quit this run?")) leaveRun();
});

els.quitDialog.addEventListener("close", () => {
  if (els.quitDialog.returnValue === "quit") leaveRun();
});

function leaveRun() {
  stopTimer();
  game = null;
  els.resultStamp.hidden = true;
  els.gameCard.classList.remove("is-success", "is-fail");
  showScreen("home");
  showToast("Run abandoned. The deck will reshuffle.");
}

els.playAgain.addEventListener("click", () => {
  if (!game) return;
  const config = {
    ...game.config,
    categories: [...game.config.categories],
    players: game.config.players.map((player) => ({ name: player.name })),
  };
  startGame(config);
});

els.changeSetup.addEventListener("click", () => {
  stopTimer();
  game = null;
  showScreen("home");
  window.setTimeout(() => {
    $(".setup")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
  }, 80);
});

$$("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close("dismiss");
  });
});

document.addEventListener("keydown", (event) => {
  if (document.querySelector("dialog[open]")) return;
  if (event.target.closest("input, textarea, select, button")) return;
  if (!game || game.finished || !els.gameScreen.classList.contains("is-active")) return;

  if (event.code === "Space") {
    event.preventDefault();
    if (game.phase === "result") nextTurn();
    else if (game.phase === "deal" && game.timer.total > 0) startTimer();
    else if (game.phase === "running") pauseTimer();
    else if (game.phase === "paused") resumeTimer();
    return;
  }

  if (event.key === "1") {
    event.preventDefault();
    resolveCard("done");
  } else if (event.key === "2") {
    event.preventDefault();
    resolveCard("chicken");
  } else if (event.key.toLowerCase() === "s") {
    event.preventDefault();
    resolveCard("skip");
  }
});

window.addEventListener("resize", resizeFx);

/* ═══════════════════════════════════════════════════════════════════
   Boot
   ═══════════════════════════════════════════════════════════════════ */

function boot() {
  els.libraryCount.textContent = `${DARES.length} cards`;
  renderCategoryChips();
  renderPlayers();
  updateSoundUi();
  setMode("solo");
  resizeFx();
  showScreen("home");

  // Handy for automated checks and curious humans.
  window.__dareDeck = {
    get game() { return game; },
    DARES,
    CATEGORIES,
    startGame,
    daresFor,
  };
}

boot();
