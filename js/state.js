// ===================== GAME STATE =====================

import { PLAYER, COMBAT, LEVEL, WORLD, ENEMY_TYPES, WAVE, UPGRADES } from './config.js';

export let gameState = {
  running: false,
  paused: false,
  time: 0,
  wave: 1,
  waveTimer: 0,
  kills: 0,
  shakeX: 0,
  shakeY: 0,
  camX: 0,
  camY: 0,
};

export let player = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  angle: 0,
  hp: PLAYER.startHp,
  maxHp: PLAYER.startHp,
  level: 1,
  xp: 0,
  xpToNext: LEVEL.xpBase,
  manualFireCD: 0,
  autoFireCDs: [],
  manualDmg: COMBAT.manualDamage,
  autoDmg: COMBAT.autoDamage,
  manualRate: COMBAT.manualFireRate,
  autoRate: COMBAT.autoFireRate,
  bulletSpeed: COMBAT.bulletSpeed,
  autoBulletSpeed: COMBAT.autoBulletSpeed,
  recoilMult: 1,
  speedMult: 1,
  armor: 0,
  autoTurrets: 1,
  piercing: 0,
  lifeSteal: 0,
  bulletSize: 1,
  autoBulletSize: 1,
  magnetRange: 60,
  iFrames: 0,
};

export let bullets = [];
export let enemies = [];
export let particles = [];
export let xpOrbs = [];
export let dmgTexts = [];

export function resetGame() {
  gameState = {
    running: false,
    paused: false,
    time: 0,
    wave: 1,
    waveTimer: 0,
    kills: 0,
    shakeX: 0,
    shakeY: 0,
    camX: 0,
    camY: 0,
  };

  player = {
    x: PLAYER.startX,
    y: PLAYER.startY,
    vx: 0,
    vy: 0,
    angle: 0,
    hp: PLAYER.startHp,
    maxHp: PLAYER.startHp,
    level: 1,
    xp: 0,
    xpToNext: LEVEL.xpBase,
    manualFireCD: 0,
    autoFireCDs: [],
    manualDmg: COMBAT.manualDamage,
    autoDmg: COMBAT.autoDamage,
    manualRate: COMBAT.manualFireRate,
    autoRate: COMBAT.autoFireRate,
    bulletSpeed: COMBAT.bulletSpeed,
    autoBulletSpeed: COMBAT.autoBulletSpeed,
    recoilMult: 1,
    speedMult: 1,
    armor: 0,
    autoTurrets: 1,
    piercing: 0,
    lifeSteal: 0,
    bulletSize: 1,
    autoBulletSize: 1,
    magnetRange: 60,
    iFrames: 0,
  };

  bullets = [];
  enemies = [];
  particles = [];
  xpOrbs = [];
  dmgTexts = [];
}

export function startGame() {
  resetGame();
  gameState.running = true;
  gameState.paused = false;
}

export function pauseGame() {
  gameState.paused = true;
}

export function resumeGame() {
  gameState.paused = false;
}

export function gameOver() {
  gameState.running = false;
}
