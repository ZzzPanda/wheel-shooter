// ===================== ENTITIES: PLAYER =====================

import { player, gameState, bullets, enemies, particles } from './state.js';
import { COMBAT, PLAYER } from './config.js';
import { isKeyPressed, getMousePos, isMouseDown } from './input.js';

let animFrame = 0;
let animTimer = 0;
let SPRITE_CONFIG;

export function setSpriteConfig(config) {
  SPRITE_CONFIG = config;
}

export function updatePlayer(dt, spritesLoaded, sprites) {
  if (gameState.paused) return;

  // Movement
  let mx = 0, my = 0;
  if (isKeyPressed('w') || isKeyPressed('arrowup')) my = -1;
  if (isKeyPressed('s') || isKeyPressed('arrowdown')) my = 1;
  if (isKeyPressed('a') || isKeyPressed('arrowleft')) mx = -1;
  if (isKeyPressed('d') || isKeyPressed('arrowright')) mx = 1;

  if (mx || my) {
    let len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    let spd = PLAYER.speed * player.speedMult;
    player.vx += mx * spd * 0.3;
    player.vy += my * spd * 0.3;
  }

  player.vx *= PLAYER.friction;
  player.vy *= PLAYER.friction;
  player.x += player.vx;
  player.y += player.vy;

  // Map bounds
  const halfMap = 1500 - PLAYER.radius;
  player.x = Math.max(-halfMap, Math.min(halfMap, player.x));
  player.y = Math.max(-halfMap, Math.min(halfMap, player.y));

  // I-frames
  if (player.iFrames > 0) player.iFrames--;

  // Aim angle
  const mouse = getMousePos();
  player.angle = Math.atan2(mouse.y - (player.y - gameState.camY + canvas.height / 2), 
                              mouse.x - (player.x - gameState.camX + canvas.width / 2));

  // Manual fire
  if (player.manualFireCD > 0) player.manualFireCD -= dt;
  if (isMouseDown() && player.manualFireCD <= 0) {
    fireManualBullet();
    player.manualFireCD = player.manualRate;
  }

  // Auto fire
  for (let i = 0; i < player.autoTurrets; i++) {
    if (!player.autoFireCDs[i]) player.autoFireCDs[i] = Math.floor(i * player.autoRate / player.autoTurrets);
    if (player.autoFireCDs[i] > 0) player.autoFireCDs[i] -= dt;
    if (player.autoFireCDs[i] <= 0 && enemies.length > 0) {
      fireAutoBullet(i);
      player.autoFireCDs[i] = player.autoRate;
    }
  }

  // Animation
  animTimer++;
  if (animTimer > 8) {
    animTimer = 0;
    animFrame = (animFrame + 1) % (SPRITE_CONFIG?.numFrames || 3);
  }
}

let canvas;

function fireManualBullet() {
  const angle = player.angle;
  const spread = 0.1;
  const a = angle + (Math.random() - 0.5) * spread;

  bullets.push({
    x: player.x + Math.cos(angle) * 22,
    y: player.y + Math.sin(angle) * 22,
    vx: Math.cos(a) * player.bulletSpeed,
    vy: Math.sin(a) * player.bulletSpeed,
    dmg: player.manualDmg,
    radius: 4 * player.bulletSize,
    color: '#ff0',
    life: 90,
    type: 'manual',
    pierce: player.piercing,
  });

  // Recoil
  const rc = COMBAT.recoilForce * player.recoilMult;
  player.vx -= Math.cos(angle) * rc;
  player.vy -= Math.sin(angle) * rc;

  // Screen shake
  gameState.shakeX += (Math.random() - 0.5) * 1.5;
  gameState.shakeY += (Math.random() - 0.5) * 1.5;

  // Particles
  for (let i = 0; i < 2; i++) {
    particles.push({
      x: player.x + Math.cos(angle) * 24,
      y: player.y + Math.sin(angle) * 24,
      vx: Math.cos(a + Math.random() - 0.5) * 3,
      vy: Math.sin(a + Math.random() - 0.5) * 3,
      life: 8,
      maxLife: 8,
      radius: 3,
      color: '#ff0',
    });
  }
}

function fireAutoBullet(turretIndex) {
  // Find nearest enemy
  let nearest = null;
  let nd = Infinity;
  for (let e of enemies) {
    let d = Math.hypot(e.x - player.x, e.y - player.y);
    if (d < nd && d < COMBAT.autoRange) {
      nd = d;
      nearest = e;
    }
  }
  if (!nearest) return;

  const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  const offset = (turretIndex % 2 === 0 ? -1 : 1) * 12;
  const perpA = angle + Math.PI / 2;
  const ox = player.x + Math.cos(perpA) * offset;
  const oy = player.y + Math.sin(perpA) * offset;
  const spread = 0.08;
  const a = angle + (Math.random() - 0.5) * spread;

  bullets.push({
    x: ox + Math.cos(angle) * 18,
    y: oy + Math.sin(angle) * 18,
    vx: Math.cos(a) * player.autoBulletSpeed,
    vy: Math.sin(a) * player.autoBulletSpeed,
    dmg: player.autoDmg,
    radius: 3 * player.autoBulletSize,
    color: '#0ff',
    life: 70,
    type: 'auto',
    pierce: 0,
  });

  particles.push({
    x: ox + Math.cos(angle) * 20,
    y: oy + Math.sin(angle) * 20,
    vx: Math.cos(a) * 2,
    vy: Math.sin(a) * 2,
    life: 5,
    maxLife: 5,
    radius: 2,
    color: '#0ff',
  });
}

export function drawPlayer(ctx, W, H, spritesLoaded, sprites) {
  const sx = player.x - gameState.camX + W / 2;
  const sy = player.y - gameState.camY + H / 2;
  const aimAngle = player.angle;

  ctx.save();
  ctx.translate(sx, sy);

  // Draw sprite if loaded
  if (spritesLoaded && sprites.player.complete && SPRITE_CONFIG) {
    const srcX = animFrame * SPRITE_CONFIG.frameWidth;
    const dstW = SPRITE_CONFIG.frameWidth * SPRITE_CONFIG.scale;
    const dstH = SPRITE_CONFIG.frameHeight * SPRITE_CONFIG.scale;

    ctx.save();
    ctx.rotate(aimAngle);
    ctx.drawImage(
      sprites.player,
      srcX, 0, SPRITE_CONFIG.frameWidth, SPRITE_CONFIG.frameHeight,
      -dstW / 2, -dstH / 2, dstW, dstH
    );
    ctx.restore();
  } else {
    // Fallback: circle
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
  }

  // Auto turrets
  for (let i = 0; i < player.autoTurrets; i++) {
    const tAngle = aimAngle + Math.PI + (i - (player.autoTurrets - 1) / 2) * 0.5;
    let turretAim = aimAngle;
    
    let nearest = null;
    let nd = Infinity;
    for (let e of enemies) {
      let d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < nd && d < COMBAT.autoRange) {
        nd = d;
        nearest = e;
      }
    }
    if (nearest) {
      turretAim = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    }

    const tx = Math.cos(tAngle) * 10;
    const ty = Math.sin(tAngle) * 10;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(turretAim);
    ctx.fillStyle = '#0aa';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.fillStyle = '#0ff';
    ctx.fillRect(3, -2, 12, 4);
    ctx.restore();
  }

  ctx.restore();

  // HP bar
  if (player.hp < player.maxHp) {
    const bw = 40;
    ctx.fillStyle = '#400';
    ctx.fillRect(sx - bw / 2, sy - 25, bw, 4);
    ctx.fillStyle = '#f00';
    ctx.fillRect(sx - bw / 2, sy - 25, bw * (player.hp / player.maxHp), 4);
  }

  // I-frames flash
  if (player.iFrames > 0 && Math.floor(player.iFrames / 3) % 2) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(sx, sy, PLAYER.radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }
}

export function getPlayer() {
  return player;
}

export function setCanvas(c) {
  canvas = c;
}
