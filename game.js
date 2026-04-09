"use strict";

// ===== Word List =====
const WORD_POOL = [
  // Food & Drink
  "Pizza", "Sushi", "Coffee", "Chocolate", "Ice Cream", "Burger", "Pasta",
  "Soda", "Cake", "Sandwich", "Salad", "Steak", "Soup", "Donut", "Taco",
  "Bread", "Cheese", "Wine", "Beer", "Juice", "Milk", "Egg", "Bacon",
  "Fries", "Popcorn", "Honey", "Butter", "Rice", "Noodles", "Cookie",
  // Nature
  "Mountain", "Ocean", "River", "Forest", "Desert", "Volcano", "Rainbow",
  "Thunder", "Snowflake", "Beach", "Cave", "Island", "Jungle", "Waterfall",
  "Cloud", "Moon", "Star", "Sun", "Tornado", "Fog", "Glacier", "Coral",
  // Animals
  "Lion", "Shark", "Elephant", "Penguin", "Dolphin", "Eagle", "Wolf",
  "Panda", "Tiger", "Crocodile", "Gorilla", "Butterfly", "Octopus", "Owl",
  "Fox", "Flamingo", "Cheetah", "Koala", "Deer", "Bat", "Snake", "Turtle",
  // Objects & Places
  "Library", "Airport", "Museum", "Hospital", "Stadium", "Castle",
  "Submarine", "Telescope", "Compass", "Lantern", "Mirror", "Clock",
  "Guitar", "Camera", "Umbrella", "Bicycle", "Rocket", "Sword", "Diamond",
  "Lighthouse", "Temple", "Skyscraper", "Bridge", "Tunnel",
  // Concepts & Pop Culture
  "Dream", "Shadow", "Echo", "Mystery", "Silence", "Adventure", "Secret",
  "Gravity", "Luck", "Memory", "Chaos", "Harmony", "Illusion",
  "Pirate", "Ninja", "Vampire", "Zombie", "Wizard", "Dragon", "Ghost",
  "Robot", "Mermaid", "Alien", "Superhero", "Detective", "Spy",
];

// ===== Game State =====
const state = {
  players: [],
  secretWord: "",
  mrWhiteIndex: -1,
  revealIndex: 0,
  revealed: false,
  eliminated: [],
  round: 1,
  votedOut: -1,
};

// ===== Utilities =====
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getActivePlayers() {
  return state.players
    .map((p, i) => ({ ...p, index: i }))
    .filter(p => !state.eliminated.includes(p.index));
}


// ===== Setup Screen =====
let playerCount = 4;

function changePlayerCount(delta) {
  playerCount = Math.max(3, Math.min(8, playerCount + delta));
  document.getElementById("player-count-display").textContent = playerCount;
  renderPlayerNameInputs();
}

function renderPlayerNameInputs(prefill = []) {
  const list = document.getElementById("player-names-list");
  const existing = Array.from(list.querySelectorAll("input")).map(i => i.value);
  list.innerHTML = "";
  for (let i = 0; i < playerCount; i++) {
    const row = document.createElement("div");
    row.className = "player-name-input-row";
    const num = document.createElement("div");
    num.className = "player-num";
    num.textContent = i + 1;
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Player ${i + 1}`;
    input.maxLength = 20;
    input.value = prefill[i] || existing[i] || "";
    row.appendChild(num);
    row.appendChild(input);
    list.appendChild(row);
  }
}

function getPlayerNames() {
  return Array.from(document.querySelectorAll(".player-name-input-row input"))
    .map((inp, i) => inp.value.trim() || `Player ${i + 1}`);
}

// ===== Start Game =====
function startGame() {
  const names = getPlayerNames();
  const word = rand(WORD_POOL);
  const mrWhite = Math.floor(Math.random() * names.length);

  state.players = names.map((name, idx) => ({
    name,
    role: idx === mrWhite ? "mrwhite" : "civilian",
  }));
  state.secretWord = word;
  state.mrWhiteIndex = mrWhite;
  state.revealIndex = 0;
  state.revealed = false;
  state.eliminated = [];
  state.round = 1;
  state.votedOut = -1;

  showRevealForPlayer(0);
}

// ===== Role Reveal Phase =====
function showRevealForPlayer(idx) {
  state.revealed = false;
  const player = state.players[idx];

  document.getElementById("reveal-player-name").textContent = player.name;
  document.getElementById("reveal-player-name2").textContent = player.name;
  document.getElementById("reveal-progress").textContent = `${idx + 1} / ${state.players.length}`;

  const card = document.getElementById("role-card");
  card.classList.remove("flipped");

  const back = document.getElementById("role-card-back");
  if (player.role === "mrwhite") {
    back.className = "role-card-back mr-white-back";
    back.innerHTML = `
      <div class="role-label">You are</div>
      <div class="role-name">Mr. White</div>
      <div class="role-desc">You have no word.<br/>Bluff and listen carefully!</div>
    `;
  } else {
    back.className = "role-card-back civilian-back";
    back.innerHTML = `
      <div class="role-label">Secret Word</div>
      <div class="role-secret">${state.secretWord}</div>
      <div class="role-desc">Give clues without being too obvious.<br/>Find Mr. White!</div>
    `;
  }

  document.getElementById("reveal-next-btn").classList.add("hidden");
  showScreen("screen-role-reveal");
}

function toggleReveal() {
  if (state.revealed) return;
  state.revealed = true;
  document.getElementById("role-card").classList.add("flipped");
  document.getElementById("reveal-next-btn").classList.remove("hidden");
}

function nextReveal() {
  state.revealIndex++;
  if (state.revealIndex < state.players.length) {
    showRevealForPlayer(state.revealIndex);
  } else {
    startCluePhase();
  }
}

// ===== Clue Phase =====
function startCluePhase() {
  document.getElementById("clue-round-badge").textContent = `Round ${state.round}`;
  showScreen("screen-clues");
}

// ===== Vote Phase =====
let selectedVote = -1;

function goToVote() {
  selectedVote = -1;
  document.getElementById("vote-round-badge").textContent = `Round ${state.round}`;
  document.getElementById("confirm-vote-btn").classList.add("hidden");

  const voteOptions = document.getElementById("vote-options");
  voteOptions.innerHTML = "";
  getActivePlayers().forEach(player => {
    const opt = document.createElement("div");
    opt.className = "vote-option";
    opt.dataset.index = player.index;
    opt.innerHTML = `
      <div class="vote-check">&#10003;</div>
      <div class="clue-avatar av${player.index % 8}" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;flex-shrink:0;">${player.name.charAt(0).toUpperCase()}</div>
      <div class="vote-option-name">${player.name}</div>
    `;
    opt.addEventListener("click", () => selectVote(player.index));
    voteOptions.appendChild(opt);
  });

  showScreen("screen-vote");
}

function selectVote(playerIndex) {
  selectedVote = playerIndex;
  document.querySelectorAll(".vote-option").forEach(opt => {
    opt.classList.toggle("selected", parseInt(opt.dataset.index) === playerIndex);
  });
  document.getElementById("confirm-vote-btn").classList.remove("hidden");
}

function confirmVote() {
  if (selectedVote === -1) return;
  state.votedOut = selectedVote;
  state.eliminated.push(selectedVote);
  showEliminationScreen(selectedVote);
}

// ===== Elimination Screen =====
function showEliminationScreen(playerIndex) {
  const player = state.players[playerIndex];
  const isMrWhite = playerIndex === state.mrWhiteIndex;

  document.getElementById("elim-title").textContent = `${player.name} was eliminated!`;
  document.getElementById("elim-message").textContent = isMrWhite
    ? "Mr. White has been caught! One last chance to guess the word..."
    : `${player.name} was a Civilian. The hunt continues!`;

  document.getElementById("elim-next-btn").textContent =
    isMrWhite ? "Mr. White's Final Guess" : "Continue";

  // Re-trigger CSS animation by replacing animated elements
  [".sf-cannibal", ".sf-victim"].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) { const clone = el.cloneNode(true); el.replaceWith(clone); }
  });

  showScreen("screen-elimination");
}

function afterElimination() {
  if (state.votedOut === state.mrWhiteIndex) {
    showGuessScreen();
    return;
  }

  const active = getActivePlayers();
  if (active.length <= 2 && active.some(p => p.index === state.mrWhiteIndex)) {
    endGame("mrwhite", "survived");
    return;
  }

  state.round++;
  startCluePhase();
}

// ===== Mr. White Guess =====
function showGuessScreen() {
  const mrWhite = state.players[state.mrWhiteIndex];
  document.getElementById("guess-prompt").innerHTML =
    `<strong>${mrWhite.name}</strong>, you've been caught as Mr. White!<br/><br/>
     Guess the secret word correctly to steal the win.`;
  document.getElementById("guess-input").value = "";
  showScreen("screen-guess");
  setTimeout(() => document.getElementById("guess-input").focus(), 300);
}

function submitGuess() {
  const guess = document.getElementById("guess-input").value.trim().toLowerCase();
  if (!guess) return;

  if (guess === state.secretWord.toLowerCase()) {
    endGame("mrwhite", "guess");
  } else {
    endGame("civilians", "wrong-guess");
  }
}

// ===== Game Over =====
function endGame(winner, reason) {
  const mrWhite = state.players[state.mrWhiteIndex];
  const screen = document.getElementById("screen-gameover");
  screen.classList.toggle("mr-white-wins", winner === "mrwhite");

  if (winner === "mrwhite") {
    document.getElementById("gameover-icon").innerHTML = "&#129419;";
    document.getElementById("gameover-title").textContent = "Mr. White Wins!";
    document.getElementById("gameover-message").textContent = reason === "survived"
      ? `${mrWhite.name} survived as Mr. White and outlasted the civilians!`
      : `${mrWhite.name} correctly guessed the secret word!`;
  } else {
    document.getElementById("gameover-icon").innerHTML = "&#127881;";
    document.getElementById("gameover-title").textContent = "Civilians Win!";
    document.getElementById("gameover-message").textContent =
      `${mrWhite.name} was Mr. White and failed to guess the secret word.`;
  }

  document.getElementById("gameover-word").innerHTML =
    `The secret word was: <span>${state.secretWord}</span>`;

  showScreen("screen-gameover");
}

// ===== New Game / Rematch =====
function newGame() {
  playerCount = state.players.length;
  document.getElementById("player-count-display").textContent = playerCount;
  renderPlayerNameInputs(state.players.map(p => p.name));
  showScreen("screen-setup");
}

// ===== Init =====
renderPlayerNameInputs();
