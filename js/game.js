// ===================== MAIN GAME =====================

import { gameState, player, bullets, enemies, xpOrbs, resetGame, startGame, gameOver as setGameOver } from './state.js';
import { initInput } from './input.js';
import { loadSprites, areSpritesLoaded, sprites } from './sprites.js';
import { setSpriteConfig, updatePlayer, drawPlayer, setCanvas } from './player.js';
import { spawnEnemy, updateEnemies, drawEnemies } from './enemies.js';
import { updateBullets, drawBullets } from './bullets.js';
import { updateParticles, drawParticles, addDmgText, spawnDeathParticles } from './particles.js';
import { gainXp, setLevelUpCallback, applyUpgrade } from './level.js';
import { render, updateCamera } from './render.js';
import { SPRITES } from './config.js';

let canvas, ctx;
let W, H;
let lastTime = 0;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

function init() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  setCanvas(canvas);

  resize();
  window.addEventListener('resize', resize);

  // Input
  initInput(canvas);

  // Sprites
  loadSprites(() => {
    setSpriteConfig(SPRITES.player);
  });

  // Level up callback
  setLevelUpCallback(showLevelUpScreen);

  // UI
  document.getElementById('start-btn').addEventListener('click', () => {
    startGame();
    gameLoop();
  });

  document.getElementById('restart-btn').addEventListener('click', () => {
    startGame();
    gameLoop();
  });
}

function update(dt) {
  if (!gameState.running || gameState.paused) return;

  gameState.time += dt;
  gameState.waveTimer += dt;

  // Wave progression
  if (gameState.waveTimer > 1800) {
    gameState.waveTimer = 0;
    gameState.wave++;
    const ann = document.getElementById('wave-announce');
    ann.textContent = `— 波次 ${gameState.wave} —`;
    ann.style.opacity = '1';
    setTimeout(() => { ann.style.opacity = '0'; }, 2000);
  }

  // Update entities
  updatePlayer(dt, areSpritesLoaded(), sprites);
  updateBullets(dt, addDmgText, gainXp, spawnDeathParticles);
  updateEnemies(dt, addDmgText, gainXp);

  // Particles & XP
  const xpGain = updateParticles(dt);
  if (xpGain > 0) {
    gainXp(xpGain);
  }

  // Camera
  updateCamera();

  // Check death
  if (player.hp <= 0) {
    endGame();
  }

  // Update HUD
  updateHUD();
}

function draw() {
  const drawFuncs = {
    player: (ctx, W, H) => drawPlayer(ctx, W, H, areSpritesLoaded(), sprites),
    enemies: drawEnemies,
    bullets: (ctx, W, H) => drawBullets(ctx, W, H, areSpritesLoaded(), sprites),
    particles: drawParticles,
    xpOrbs: null, // included in particles
  };

  render(ctx, W, H, drawFuncs);
}

function gameLoop() {
  if (!gameState.running) return;

  update(1);
  draw();
  requestAnimationFrame(gameLoop);
}

function updateHUD() {
  document.getElementById('hp').textContent = Math.ceil(player.hp);
  document.getElementById('maxhp').textContent = player.maxHp;
  document.getElementById('level').textContent = player.level;
  document.getElementById('kills').textContent = gameState.kills;
  document.getElementById('wave').textContent = gameState.wave;

  const secs = Math.floor(gameState.time / 60);
  document.getElementById('timer').textContent = `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

  document.getElementById('xp-val').textContent = player.xp;
  document.getElementById('xp-need').textContent = player.xpToNext;
  document.getElementById('xp-bar').style.width = `${(player.xp / player.xpToNext) * 100}%`;
}

function showLevelUpScreen(upgrades) {
  const screen = document.getElementById('level-up-screen');
  const opts = document.getElementById('upgrade-options');
  opts.innerHTML = '';

  upgrades.forEach(up => {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML = `<div class="icon">${up.icon}</div><div class="name">${up.name}</div><div class="desc">${up.desc}</div>`;
    card.addEventListener('click', () => {
      applyUpgrade(up);
      screen.style.display = 'none';
      if (gameState.running) gameLoop();
    });
    opts.appendChild(card);
  });

  screen.style.display = 'flex';
}

function endGame() {
  setGameOver();
  const secs = Math.floor(gameState.time / 60);
  document.getElementById('final-time').textContent = `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
  document.getElementById('final-level').textContent = player.level;
  document.getElementById('final-kills').textContent = gameState.kills;
  document.getElementById('game-over-screen').style.display = 'flex';
}

// Start
window.addEventListener('load', init);
