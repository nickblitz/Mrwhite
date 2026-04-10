"use strict";

// ===== Word Pairs (civilian word / imposter word) =====
const WORD_PAIRS = [
  { civilian: "Coffee",      imposter: "Tea" },
  { civilian: "Beach",       imposter: "Lake" },
  { civilian: "Guitar",      imposter: "Violin" },
  { civilian: "Pizza",       imposter: "Flatbread" },
  { civilian: "Lion",        imposter: "Tiger" },
  { civilian: "Soccer",      imposter: "Rugby" },
  { civilian: "Castle",      imposter: "Fortress" },
  { civilian: "Shark",       imposter: "Dolphin" },
  { civilian: "Diamond",     imposter: "Ruby" },
  { civilian: "Wine",        imposter: "Champagne" },
  { civilian: "Submarine",   imposter: "Boat" },
  { civilian: "Astronaut",   imposter: "Pilot" },
  { civilian: "Library",     imposter: "Bookstore" },
  { civilian: "Sushi",       imposter: "Sashimi" },
  { civilian: "Tennis",      imposter: "Badminton" },
  { civilian: "Piano",       imposter: "Keyboard" },
  { civilian: "Dragon",      imposter: "Dinosaur" },
  { civilian: "Hospital",    imposter: "Clinic" },
  { civilian: "Eagle",       imposter: "Hawk" },
  { civilian: "Burger",      imposter: "Sandwich" },
  { civilian: "Tornado",     imposter: "Hurricane" },
  { civilian: "Volcano",     imposter: "Mountain" },
  { civilian: "Vampire",     imposter: "Werewolf" },
  { civilian: "Pirate",      imposter: "Sailor" },
  { civilian: "Wizard",      imposter: "Witch" },
  { civilian: "Robot",       imposter: "Android" },
  { civilian: "Museum",      imposter: "Gallery" },
  { civilian: "Snowflake",   imposter: "Raindrop" },
  { civilian: "Panda",       imposter: "Koala" },
  { civilian: "Chocolate",   imposter: "Candy" },
  { civilian: "Rocket",      imposter: "Missile" },
  { civilian: "Spy",         imposter: "Detective" },
  { civilian: "Sword",       imposter: "Dagger" },
  { civilian: "Clock",       imposter: "Watch" },
  { civilian: "Doctor",      imposter: "Nurse" },
  { civilian: "Prison",      imposter: "Police Station" },
  { civilian: "Forest",      imposter: "Jungle" },
  { civilian: "Motorcycle",  imposter: "Bicycle" },
  { civilian: "Champagne",   imposter: "Beer" },
  { civilian: "Owl",         imposter: "Bat" },
  { civilian: "Crown",       imposter: "Tiara" },
  { civilian: "Cannon",      imposter: "Catapult" },
  { civilian: "Penguin",     imposter: "Seal" },
  { civilian: "Popcorn",     imposter: "Chips" },
  { civilian: "Compass",     imposter: "Map" },
];

// ===== Game State =====
const state = {
  players: [],        // [{name, role}]  role: "civilian"|"mrwhite"|"imposter"
  civilianWord: "",
  imposterWord: "",
  mrWhiteIndex: -1,
  imposterIndex: -1,
  revealIndex: 0,
  revealed: false,
  eliminated: [],
  round: 1,
  votedOut: -1,
  accusation: null,   // "mrwhite" | "imposter"
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

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  const pair = rand(WORD_PAIRS);

  // Randomly assign special roles to 2 different players
  const indices = shuffle([...Array(names.length).keys()]);
  const mrWhite = indices[0];
  const imposter = indices[1];

  state.players = names.map((name, idx) => ({
    name,
    role: idx === mrWhite ? "mrwhite" : idx === imposter ? "imposter" : "civilian",
  }));
  state.civilianWord = pair.civilian;
  state.imposterWord = pair.imposter;
  state.mrWhiteIndex = mrWhite;
  state.imposterIndex = imposter;
  state.revealIndex = 0;
  state.revealed = false;
  state.eliminated = [];
  state.round = 1;
  state.votedOut = -1;
  state.accusation = null;

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
      <div class="role-desc">You have <em>no word</em>.<br/>Listen, bluff, survive!</div>
    `;
  } else if (player.role === "imposter") {
    back.className = "role-card-back imposter-back";
    back.innerHTML = `
      <div class="role-label">You are the</div>
      <div class="role-name">Imposter</div>
      <div class="role-word">Your word</div>
      <div class="role-secret">${state.imposterWord}</div>
      <div class="role-desc">Blend in — civilians have a <em>different</em> word!</div>
    `;
  } else {
    back.className = "role-card-back civilian-back";
    back.innerHTML = `
      <div class="role-label">Secret Word</div>
      <div class="role-secret">${state.civilianWord}</div>
      <div class="role-desc">Find the Imposter &amp; Mr. White.<br/>Don't be too obvious!</div>
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
let selectedAccusation = null;

function goToVote() {
  selectedVote = -1;
  selectedAccusation = null;
  document.getElementById("vote-round-badge").textContent = `Round ${state.round}`;
  document.getElementById("confirm-vote-btn").classList.add("hidden");
  document.getElementById("accusation-section").classList.add("hidden");
  document.getElementById("accuse-mrwhite").classList.remove("selected");
  document.getElementById("accuse-imposter").classList.remove("selected");

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
  selectedAccusation = null;
  document.querySelectorAll(".vote-option").forEach(opt => {
    opt.classList.toggle("selected", parseInt(opt.dataset.index) === playerIndex);
  });
  document.getElementById("accuse-mrwhite").classList.remove("selected");
  document.getElementById("accuse-imposter").classList.remove("selected");
  document.getElementById("accusation-section").classList.remove("hidden");
  document.getElementById("confirm-vote-btn").classList.add("hidden");
}

function setAccusation(type) {
  selectedAccusation = type;
  document.getElementById("accuse-mrwhite").classList.toggle("selected", type === "mrwhite");
  document.getElementById("accuse-imposter").classList.toggle("selected", type === "imposter");
  if (selectedVote !== -1) {
    document.getElementById("confirm-vote-btn").classList.remove("hidden");
  }
}

function confirmVote() {
  if (selectedVote === -1 || !selectedAccusation) return;
  state.votedOut = selectedVote;
  state.accusation = selectedAccusation;
  state.eliminated.push(selectedVote);
  showEliminationScreen(selectedVote);
}

// ===== Elimination Screen =====
function showEliminationScreen(playerIndex) {
  const player = state.players[playerIndex];
  const actualRole = player.role;
  const accused = state.accusation;
  const correct = accused === actualRole;

  // Role label for display
  const roleLabel = actualRole === "mrwhite" ? "Mr. White" :
                    actualRole === "imposter" ? "the Imposter" : "a Civilian";
  const accusedLabel = accused === "mrwhite" ? "Mr. White" : "the Imposter";

  document.getElementById("elim-title").textContent = `${player.name} was eliminated!`;
  document.getElementById("elim-role-reveal").textContent = `They were ${roleLabel}.`;

  if (actualRole !== "civilian") {
    document.getElementById("elim-accusation-result").textContent =
      correct ? `✓ Correct accusation!` : `✗ Wrong — you accused them of being ${accusedLabel}.`;
    document.getElementById("elim-accusation-result").className =
      "elim-accusation-result " + (correct ? "correct" : "wrong");
  } else {
    document.getElementById("elim-accusation-result").textContent = "";
  }

  const nextBtn = document.getElementById("elim-next-btn");
  if (actualRole === "mrwhite") {
    document.getElementById("elim-message").textContent = "Mr. White gets one last chance to guess the word!";
    nextBtn.textContent = "Mr. White's Final Guess";
  } else if (actualRole === "imposter") {
    document.getElementById("elim-message").textContent = correct
      ? "The Imposter has been unmasked!"
      : "You got the wrong role — but they're still out.";
    nextBtn.textContent = "Continue";
  } else {
    document.getElementById("elim-message").textContent = "An innocent Civilian was eliminated. The hunt continues!";
    nextBtn.textContent = "Continue";
  }

  // Restart stick figure animation
  [".sf-cannibal", ".sf-victim"].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) { const clone = el.cloneNode(true); el.replaceWith(clone); }
  });

  showScreen("screen-elimination");
}

function afterElimination() {
  const actualRole = state.players[state.votedOut].role;

  if (actualRole === "mrwhite") {
    showGuessScreen();
    return;
  }

  checkSurvivalWin();
}

function checkSurvivalWin() {
  const active = getActivePlayers();
  const mrWhiteAlive = active.some(p => p.index === state.mrWhiteIndex);
  const imposterAlive = active.some(p => p.index === state.imposterIndex);

  if (active.length <= 2) {
    if (mrWhiteAlive) { endGame("mrwhite", "survived"); return; }
    if (imposterAlive) { endGame("imposter", "survived"); return; }
  }

  state.round++;
  startCluePhase();
}

// ===== Mr. White Guess =====
function showGuessScreen() {
  const mrWhite = state.players[state.mrWhiteIndex];
  document.getElementById("guess-prompt").innerHTML =
    `<strong>${mrWhite.name}</strong> was Mr. White!<br/><br/>
     Guess the civilians' secret word to steal the win.`;
  document.getElementById("guess-input").value = "";
  showScreen("screen-guess");
  setTimeout(() => document.getElementById("guess-input").focus(), 300);
}

function submitGuess() {
  const guess = document.getElementById("guess-input").value.trim().toLowerCase();
  if (!guess) return;

  if (guess === state.civilianWord.toLowerCase()) {
    endGame("mrwhite", "guess");
    return;
  }

  // Mr. White guessed wrong — does Imposter still live?
  const active = getActivePlayers();
  const imposterAlive = active.some(p => p.index === state.imposterIndex);
  if (imposterAlive) {
    endGame("imposter", "mrwhite_lost");
  } else {
    endGame("civilians", "wrong-guess");
  }
}

// ===== Game Over =====
function endGame(winner, reason) {
  const mrWhite = state.players[state.mrWhiteIndex];
  const imposter = state.players[state.imposterIndex];
  const screen = document.getElementById("screen-gameover");

  screen.className = "screen"; // reset classes
  if (winner === "mrwhite") screen.classList.add("end-mrwhite");
  else if (winner === "imposter") screen.classList.add("end-imposter");
  else screen.classList.add("end-civilians");

  const icons = { mrwhite: "&#129419;", imposter: "&#128373;", civilians: "&#127881;" };
  document.getElementById("gameover-icon").innerHTML = icons[winner];

  if (winner === "mrwhite") {
    document.getElementById("gameover-title").textContent = "Mr. White Wins!";
    document.getElementById("gameover-message").textContent = reason === "survived"
      ? `${mrWhite.name} survived as Mr. White and outlasted everyone!`
      : `${mrWhite.name} correctly guessed the secret word!`;
  } else if (winner === "imposter") {
    document.getElementById("gameover-title").textContent = "Imposter Wins!";
    document.getElementById("gameover-message").textContent = reason === "survived"
      ? `${imposter.name} blended in perfectly and survived as the Imposter!`
      : `${imposter.name} (Imposter) wins — Mr. White was caught but the Imposter lives!`;
  } else {
    document.getElementById("gameover-title").textContent = "Civilians Win!";
    document.getElementById("gameover-message").textContent =
      `Both ${mrWhite.name} (Mr. White) and ${imposter.name} (Imposter) have been eliminated!`;
  }

  document.getElementById("gameover-word").innerHTML =
    `Civilian word: <span>${state.civilianWord}</span> &nbsp;·&nbsp; Imposter word: <span>${state.imposterWord}</span>`;

  showScreen("screen-gameover");
}

// ===== New Game =====
function newGame() {
  playerCount = state.players.length;
  document.getElementById("player-count-display").textContent = playerCount;
  renderPlayerNameInputs(state.players.map(p => p.name));
  showScreen("screen-setup");
}

// ===== Init =====
renderPlayerNameInputs();
