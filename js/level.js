// ===================== LEVEL & UPGRADES =====================

import { player, gameState } from './state.js';
import { LEVEL, UPGRADES } from './config.js';

let onLevelUp = null;

export function setLevelUpCallback(cb) {
  onLevelUp = cb;
}

export function gainXp(amount) {
  player.xp += amount;
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = Math.floor(LEVEL.xpBase * Math.pow(LEVEL.xpGrowth, player.level - 1));
    showLevelUp();
  }
}

function showLevelUp() {
  gameState.paused = true;

  // Pick 3 random upgrades
  const pool = [...UPGRADES];
  const picks = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picks.push(pool.splice(idx, 1)[0]);
  }

  if (onLevelUp) {
    onLevelUp(picks);
  }
}

export function applyUpgrade(upgrade) {
  upgrade.apply(player);
  gameState.paused = false;
}

export function getUpgrades() {
  return UPGRADES;
}
