// ===================== ENTITIES: ENEMIES =====================

import { enemies, player, gameState, bullets, particles, xpOrbs, gameState as state } from './state.js';
import { ENEMY_TYPES, WAVE, WORLD, COMBAT } from './config.js';

export function spawnEnemy() {
  const angle = Math.random() * Math.PI * 2;
  const dist = WORLD.enemySpawnDist + Math.random() * 100;
  const sx = player.x + Math.cos(angle) * dist;
  const sy = player.y + Math.sin(angle) * dist;

  // Pick type based on wave
  let pool = [0, 0, 0, 1, 3];
  if (state.wave >= 3) pool.push(1, 1, 3, 3);
  if (state.wave >= 5) pool.push(2);
  if (state.wave >= 8) pool.push(4);
  if (state.wave >= 10) pool.push(2, 2, 4);

  const ti = pool[Math.floor(Math.random() * pool.length)];
  const t = ENEMY_TYPES[ti];
  const hpMult = 1 + (state.wave - 1) * WAVE.hpGrowth;

  enemies.push({
    x: sx,
    y: sy,
    hp: t.hp * hpMult,
    maxHp: t.hp * hpMult,
    speed: t.speed,
    radius: t.radius,
    color: t.color,
    dmg: t.dmg,
    xp: t.xp,
    type: t.name,
    hitFlash: 0,
  });
}

export function updateEnemies(dt, addDmgText, gainXp) {
  // Move enemies
  for (let e of enemies) {
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed;
    e.y += Math.sin(angle) * e.speed;
    if (e.hitFlash > 0) e.hitFlash--;

    // Collision with player
    const d = Math.hypot(player.x - e.x, player.y - e.y);
    if (d < 18 + e.radius && player.iFrames <= 0) {
      const dmg = Math.max(1, e.dmg - player.armor);
      player.hp -= dmg;
      player.iFrames = 30;
      addDmgText(player.x, player.y - 18, dmg, '#f44');

      const pushA = Math.atan2(player.y - e.y, player.x - e.x);
      player.vx += Math.cos(pushA) * 5;
      player.vy += Math.sin(pushA) * 5;
      gameState.shakeX = (Math.random() - 0.5) * 6;
      gameState.shakeY = (Math.random() - 0.5) * 6;
    }
  }

  // Enemy separation
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i];
      const b = enemies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      const minD = a.radius + b.radius;
      if (d < minD && d > 0) {
        const push = (minD - d) * 0.3 / d;
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
      }
    }
  }

  // Spawn enemies
  const spawnRate = Math.max(WAVE.spawnRateMin, WAVE.spawnRateBase - state.wave * 4);
  if (Math.random() < 1 / spawnRate) {
    spawnEnemy();
  }
}

export function drawEnemies(ctx, W, H) {
  for (let e of enemies) {
    const sx = e.x - gameState.camX + W / 2;
    const sy = e.y - gameState.camY + H / 2;
    if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) continue;

    ctx.beginPath();
    ctx.arc(sx, sy, e.radius, 0, Math.PI * 2);
    ctx.fillStyle = e.hitFlash > 0 ? '#fff' : e.color;
    ctx.fill();

    // Eyes toward player
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.arc(sx + Math.cos(angle - 0.3) * e.radius * 0.4, sy + Math.sin(angle - 0.3) * e.radius * 0.4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + Math.cos(angle + 0.3) * e.radius * 0.4, sy + Math.sin(angle + 0.3) * e.radius * 0.4, 2, 0, Math.PI * 2);
    ctx.fill();

    // HP bar
    if (e.hp < e.maxHp) {
      const bw = e.radius * 2;
      ctx.fillStyle = '#400';
      ctx.fillRect(sx - bw / 2, sy - e.radius - 8, bw, 3);
      ctx.fillStyle = '#f44';
      ctx.fillRect(sx - bw / 2, sy - e.radius - 8, bw * (e.hp / e.maxHp), 3);
    }
  }
}
