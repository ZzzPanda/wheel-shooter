// ===================== GAME ENGINE =====================

import { SPRITES } from './config.js';
import { loadSprites, areSpritesLoaded, sprites } from './sprites.js';
import * as touch from './input-touch.js';

// ===================== CANVAS SETUP =====================
const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');
export let W, H;

export function resizeCanvas() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ===================== GAME STATE =====================
export let gameRunning = false;
export let gamePaused = false;
export let gameTime = 0;
export let waveNum = 1;
export let waveTimer = 0;
export let kills = 0;
export let shakeX = 0, shakeY = 0;
export let camX = 0, camY = 0;

// ===================== ENTITIES =====================
export let player = {};
export let bullets = [];
export let enemies = [];
export let particles = [];
export let xpOrbs = [];
export let dmgTexts = [];

// Animation
export let animFrame = 0;
export let animTimer = 0;

// ===================== CONFIG IMPORT =====================
import { PLAYER, COMBAT, LEVEL, WORLD, ENEMY_TYPES, WAVE, UPGRADES } from './config.js';

// ===================== PLAYER =====================
export function resetPlayer() {
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
}

// ===================== INPUT =====================
const keys = {};
export let mouseX = W / 2, mouseY = H / 2;
export let mouseDown = false;

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  e.preventDefault();
});
window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});
window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});
window.addEventListener('mousedown', (e) => {
  if (e.button === 0) mouseDown = true;
});
window.addEventListener('mouseup', (e) => {
  if (e.button === 0) mouseDown = false;
});

// ===================== SPAWNING =====================
export function spawnEnemy() {
  const angle = Math.random() * Math.PI * 2;
  const dist = WORLD.enemySpawnDist + Math.random() * 100;
  const sx = player.x + Math.cos(angle) * dist;
  const sy = player.y + Math.sin(angle) * dist;

  let pool = [0, 0, 0, 1, 3];
  if (waveNum >= 3) pool.push(1, 1, 3, 3);
  if (waveNum >= 5) pool.push(2);
  if (waveNum >= 8) pool.push(4);
  if (waveNum >= 10) pool.push(2, 2, 4);

  const ti = pool[Math.floor(Math.random() * pool.length)];
  const t = ENEMY_TYPES[ti];
  const hpMult = 1 + (waveNum - 1) * WAVE.hpGrowth;

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

// ===================== COMBAT =====================
export function fireManualBullet(aimAngle) {
  const screenPX = player.x - camX + W / 2;
  const screenPY = player.y - camY + H / 2;
  const angle = aimAngle || Math.atan2(mouseY - screenPY, mouseX - screenPX);
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

  const rc = COMBAT.recoilForce * player.recoilMult;
  player.vx -= Math.cos(angle) * rc;
  player.vy -= Math.sin(angle) * rc;

  shakeX += (Math.random() - 0.5) * 1.5;
  shakeY += (Math.random() - 0.5) * 1.5;

  for (let i = 0; i < 2; i++) {
    particles.push({
      x: player.x + Math.cos(angle) * 24,
      y: player.y + Math.sin(angle) * 24,
      vx: Math.cos(a + (Math.random() - 0.5)) * 3,
      vy: Math.sin(a + (Math.random() - 0.5)) * 3,
      life: 8,
      maxLife: 8,
      radius: 3,
      color: '#ff0',
    });
  }
}

export function fireAutoBullet(turretIndex) {
  let nearest = null;
  let nd = Infinity;
  for (const e of enemies) {
    const d = Math.hypot(e.x - player.x, e.y - player.y);
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

// ===================== PARTICLES =====================
export function spawnDeathParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1 + Math.random() * 3;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 20 + Math.random() * 15,
      maxLife: 35,
      radius: 2 + Math.random() * 3,
      color,
    });
  }
}

export function spawnXpOrb(x, y, amount) {
  xpOrbs.push({ x, y, amount, radius: 4, life: 600 });
}

export function addDmgText(x, y, txt, color) {
  dmgTexts.push({ x, y, txt: String(txt), color, life: 40, maxLife: 40 });
}

// ===================== UPGRADES =====================
export function showLevelUp() {
  gamePaused = true;
  document.getElementById('level-up-screen').style.display = 'flex';
  const opts = document.getElementById('upgrade-options');
  opts.innerHTML = '';

  const pool = [...UPGRADES];
  const picks = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picks.push(pool.splice(idx, 1)[0]);
  }

  picks.forEach((up) => {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML = `<div class="icon">${up.icon}</div><div class="name">${up.name}</div><div class="desc">${up.desc}</div>`;
    card.addEventListener('click', () => {
      up.apply(player);
      document.getElementById('level-up-screen').style.display = 'none';
      gamePaused = false;
    });
    opts.appendChild(card);
  });
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

// ===================== UPDATE =====================
export function updateGame(dt) {
  if (gamePaused) return;

  // Update touch controls
  touch.updateTouchInput();

  gameTime += dt;
  waveTimer += dt;

  if (waveTimer > WAVE.interval) {
    waveTimer = 0;
    waveNum++;
    const ann = document.getElementById('wave-announce');
    ann.textContent = `— 波次 ${waveNum} —`;
    ann.style.opacity = '1';
    setTimeout(() => { ann.style.opacity = '0'; }, 2000);
  }

  // Player movement (keyboard)
  let mx = 0, my = 0;
  if (keys['w'] || keys['arrowup']) my = -1;
  if (keys['s'] || keys['arrowdown']) my = 1;
  if (keys['a'] || keys['arrowleft']) mx = -1;
  if (keys['d'] || keys['arrowright']) mx = 1;

  // Touch joystick input
  const touchMove = touch.getTouchMoveInput();
  if (touchMove.x !== 0 || touchMove.y !== 0) {
    mx = touchMove.x;
    my = touchMove.y;
  }

  // Apply movement
  if (mx || my) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    
    // Dash boost
    let speedBoost = 1;
    if (touch.isDashing()) speedBoost = 2.5;
    
    player.vx += mx * PLAYER.speed * player.speedMult * 0.3 * speedBoost;
    player.vy += my * PLAYER.speed * player.speedMult * 0.3 * speedBoost;
  }

  // Brake
  if (touch.isBraking()) {
    player.vx *= 0.1;
    player.vy *= 0.1;
  }

  player.vx *= PLAYER.friction;
  player.vy *= PLAYER.friction;
  player.x += player.vx;
  player.y += player.vy;

  const half = WORLD.mapSize / 2 - PLAYER.radius;
  player.x = Math.max(-half, Math.min(half, player.x));
  player.y = Math.max(-half, Math.min(half, player.y));

  if (player.iFrames > 0) player.iFrames--;

  // Manual fire (mouse or touch)
  let aimAngle = null;
  
  // Touch aim
  const touchAim = touch.getTouchAimInput();
  if (touchAim) {
    mouseX = touchAim.x;
    mouseY = touchAim.y;
  }
  
  const screenPX = player.x - camX + W / 2;
  const screenPY = player.y - camY + H / 2;
  aimAngle = Math.atan2(mouseY - screenPY, mouseX - screenPX);
  player.angle = aimAngle;

  if (player.manualFireCD > 0) player.manualFireCD -= dt;
  
  // Mouse or touch shooting (disabled when dashing or braking)
  const isBraking = touch.isBraking();
  const isDashing = touch.isDashing();
  const canShoot = !isBraking && !isDashing;
  const isShooting = canShoot && (mouseDown || touch.isTouchShooting());
  if (isShooting && player.manualFireCD <= 0) {
    fireManualBullet(aimAngle);
    player.manualFireCD = player.manualRate;
  }

  // Auto fire (disabled when braking)
  if (!isBraking) {
    for (let i = 0; i < player.autoTurrets; i++) {
      if (!player.autoFireCDs[i])
        player.autoFireCDs[i] = Math.floor((i * player.autoRate) / player.autoTurrets);
      if (player.autoFireCDs[i] > 0) player.autoFireCDs[i] -= dt;
      if (player.autoFireCDs[i] <= 0 && enemies.length > 0) {
        fireAutoBullet(i);
        player.autoFireCDs[i] = player.autoRate;
      }
    }
  }

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    b.life--;
    if (b.life <= 0) {
      bullets.splice(i, 1);
      continue;
    }

    let hit = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const d = Math.hypot(b.x - e.x, b.y - e.y);
      if (d < b.radius + e.radius) {
        e.hp -= b.dmg;
        e.hitFlash = 4;
        addDmgText(e.x, e.y - e.radius, Math.floor(b.dmg), b.type === 'manual' ? '#ff0' : '#0ff');

        const ka = Math.atan2(e.y - player.y, e.x - player.x);
        e.x += Math.cos(ka) * 3;
        e.y += Math.sin(ka) * 3;

        if (e.hp <= 0) {
          spawnDeathParticles(e.x, e.y, e.color, 12);
          spawnXpOrb(e.x, e.y, e.xp);
          kills++;
          if (player.lifeSteal > 0) {
            player.hp = Math.min(player.maxHp, player.hp + player.lifeSteal);
          }
          enemies.splice(j, 1);
        }

        if (b.pierce > 0) {
          b.pierce--;
          b.dmg *= 0.7;
        } else {
          hit = true;
        }
        break;
      }
    }
    if (hit) bullets.splice(i, 1);
  }

  // Update enemies
  for (const e of enemies) {
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed;
    e.y += Math.sin(angle) * e.speed;
    if (e.hitFlash > 0) e.hitFlash--;

    const d = Math.hypot(player.x - e.x, player.y - e.y);
    if (d < PLAYER.radius + e.radius && player.iFrames <= 0) {
      const dmg = Math.max(1, e.dmg - player.armor);
      player.hp -= dmg;
      player.iFrames = 30;
      addDmgText(player.x, player.y - PLAYER.radius, dmg, '#f44');
      const pushA = Math.atan2(player.y - e.y, player.x - e.x);
      player.vx += Math.cos(pushA) * 5;
      player.vy += Math.sin(pushA) * 5;
      shakeX = (Math.random() - 0.5) * 6;
      shakeY = (Math.random() - 0.5) * 6;
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
        const push = ((minD - d) * 0.3) / d;
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
      }
    }
  }

  const spawnRate = Math.max(WAVE.spawnRateMin, WAVE.spawnRateBase - waveNum * 4);
  if (Math.random() < 1 / spawnRate) spawnEnemy();

  // Update XP orbs
  for (let i = xpOrbs.length - 1; i >= 0; i--) {
    const o = xpOrbs[i];
    o.life--;
    if (o.life <= 0) {
      xpOrbs.splice(i, 1);
      continue;
    }
    const d = Math.hypot(player.x - o.x, player.y - o.y);
    if (d < player.magnetRange) {
      const a = Math.atan2(player.y - o.y, player.x - o.x);
      o.x += Math.cos(a) * Math.max(2, 8 - d * 0.05);
      o.y += Math.sin(a) * Math.max(2, 8 - d * 0.05);
    }
    if (d < 15) {
      gainXp(o.amount);
      xpOrbs.splice(i, 1);
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  for (let i = dmgTexts.length - 1; i >= 0; i--) {
    dmgTexts[i].life--;
    if (dmgTexts[i].life <= 0) dmgTexts.splice(i, 1);
  }

  shakeX *= 0.8;
  shakeY *= 0.8;
  camX += (player.x - camX) * 0.1;
  camY += (player.y - camY) * 0.1;

  if (player.hp <= 0) {
    gameOver();
  }

  updateHUD();
}

function updateHUD() {
  document.getElementById('hp').textContent = Math.ceil(player.hp);
  document.getElementById('maxhp').textContent = player.maxHp;
  document.getElementById('level').textContent = player.level;
  document.getElementById('kills').textContent = kills;
  document.getElementById('wave').textContent = waveNum;
  const secs = Math.floor(gameTime / 60);
  document.getElementById('timer').textContent = `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
  document.getElementById('xp-val').textContent = player.xp;
  document.getElementById('xp-need').textContent = player.xpToNext;
  document.getElementById('xp-bar').style.width = `${(player.xp / player.xpToNext) * 100}%`;
}

// ===================== RENDERING =====================
export function drawGrid() {
  const gridSize = 60;
  const offX = -camX % gridSize;
  const offY = -camY % gridSize;
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  for (let x = offX; x < W; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = offY; y < H; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

export function drawBoundary() {
  const lx = -WORLD.mapSize / 2 - camX + W / 2;
  const ly = -WORLD.mapSize / 2 - camY + H / 2;
  ctx.strokeStyle = '#f00';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.strokeRect(lx, ly, WORLD.mapSize, WORLD.mapSize);
  ctx.setLineDash([]);
}

export function drawPlayer() {
  const sx = player.x - camX + W / 2;
  const sy = player.y - camY + H / 2;
  const screenPX = sx, screenPY = sy;
  const aimAngle = Math.atan2(mouseY - screenPY, mouseX - screenPX);
  player.angle = aimAngle;

  animTimer++;
  if (animTimer > 8) {
    animTimer = 0;
    animFrame = (animFrame + 1) % SPRITES.player.numFrames;
  }

  ctx.save();
  ctx.translate(sx, sy);

  if (areSpritesLoaded()) {
    const s = SPRITES.player;
    const srcX = animFrame * s.frameWidth;
    const dstW = s.frameWidth * s.scale;
    const dstH = s.frameHeight * s.scale;

    ctx.save();
    ctx.rotate(aimAngle);
    ctx.drawImage(sprites.player, srcX, 0, s.frameWidth, s.frameHeight, -dstW / 2, -dstH / 2, dstW, dstH);
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();

    const wheelAngle1 = aimAngle + Math.PI / 2;
    const wheelAngle2 = aimAngle - Math.PI / 2;
    for (const wa of [wheelAngle1, wheelAngle2]) {
      const wx = Math.cos(wa) * PLAYER.radius;
      const wy = Math.sin(wa) * PLAYER.radius;
      ctx.beginPath();
      ctx.arc(wx, wy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#555';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, -2, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#88f';
    ctx.fill();

    ctx.save();
    ctx.rotate(aimAngle);
    ctx.fillStyle = '#ddd';
    ctx.fillRect(10, -3, 18, 6);
    ctx.restore();
  }

  for (let i = 0; i < player.autoTurrets; i++) {
    const tAngle = aimAngle + Math.PI + ((i - (player.autoTurrets - 1) / 2) * 0.5);
    let nearest = null;
    let nd = Infinity;
    for (const e of enemies) {
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < nd && d < COMBAT.autoRange) {
        nd = d;
        nearest = e;
      }
    }
    const turretAim = nearest ? Math.atan2(nearest.y - player.y, nearest.x - player.x) : tAngle;
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

  if (player.hp < player.maxHp) {
    const bw = 40;
    ctx.fillStyle = '#400';
    ctx.fillRect(sx - bw / 2, sy - 25, bw, 4);
    ctx.fillStyle = '#f00';
    ctx.fillRect(sx - bw / 2, sy - 25, bw * (player.hp / player.maxHp), 4);
  }

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

export function drawEnemies() {
  for (const e of enemies) {
    const sx = e.x - camX + W / 2;
    const sy = e.y - camY + H / 2;
    if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) continue;

    ctx.beginPath();
    ctx.arc(sx, sy, e.radius, 0, Math.PI * 2);
    ctx.fillStyle = e.hitFlash > 0 ? '#fff' : e.color;
    ctx.fill();

    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.arc(sx + Math.cos(angle - 0.3) * e.radius * 0.4, sy + Math.sin(angle - 0.3) * e.radius * 0.4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + Math.cos(angle + 0.3) * e.radius * 0.4, sy + Math.sin(angle + 0.3) * e.radius * 0.4, 2, 0, Math.PI * 2);
    ctx.fill();

    if (e.hp < e.maxHp) {
      const bw = e.radius * 2;
      ctx.fillStyle = '#400';
      ctx.fillRect(sx - bw / 2, sy - e.radius - 8, bw, 3);
      ctx.fillStyle = '#f44';
      ctx.fillRect(sx - bw / 2, sy - e.radius - 8, bw * (e.hp / e.maxHp), 3);
    }
  }
}

export function drawBullets() {
  for (const b of bullets) {
    const sx = b.x - camX + W / 2;
    const sy = b.y - camY + H / 2;

    if (b.type === 'manual' && sprites.railgun.complete) {
      const angle = Math.atan2(b.vy, b.vx);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);
      ctx.drawImage(sprites.railgun, -15, -3, 30, 6);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(sx, sy, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(sx, sy, b.radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
      ctx.restore();
    }
  }
}

export function drawParticles() {
  for (const p of particles) {
    const sx = p.x - camX + W / 2;
    const sy = p.y - camY + H / 2;
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.beginPath();
    ctx.arc(sx, sy, p.radius * (p.life / p.maxLife), 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }
}

export function drawXpOrbs() {
  for (const o of xpOrbs) {
    const sx = o.x - camX + W / 2;
    const sy = o.y - camY + H / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, o.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#4f4';
    ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(sx, sy, o.radius * 2, 0, Math.PI * 2);
    ctx.fillStyle = '#4f4';
    ctx.fill();
    ctx.restore();
  }
}

export function drawDmgTexts() {
  for (const d of dmgTexts) {
    const sx = d.x - camX + W / 2;
    const sy = d.y - camY + H / 2 - (1 - d.life / d.maxLife) * 20;
    ctx.save();
    ctx.globalAlpha = d.life / d.maxLife;
    ctx.font = 'bold 14px Courier New';
    ctx.fillStyle = d.color;
    ctx.textAlign = 'center';
    ctx.fillText(d.txt, sx, sy);
    ctx.restore();
  }
}

export function renderGame() {
  ctx.save();
  ctx.translate(shakeX, shakeY);
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);
  drawGrid();
  drawBoundary();
  drawXpOrbs();
  drawBullets();
  drawEnemies();
  drawPlayer();
  drawParticles();
  drawDmgTexts();
  ctx.restore();
  
  // Draw touch UI
  touch.drawTouchUI(ctx, W, H);
}

// ===================== GAME LOOP =====================
export function gameLoop() {
  if (!gameRunning) return;
  updateGame(1);
  renderGame();
  requestAnimationFrame(gameLoop);
}

// ===================== START / END =====================
export function startGameFunc() {
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('game-over-screen').style.display = 'none';
  resetPlayer();
  bullets = [];
  enemies = [];
  particles = [];
  xpOrbs = [];
  dmgTexts = [];
  gameTime = 0;
  waveNum = 1;
  waveTimer = 0;
  kills = 0;
  camX = 0;
  camY = 0;
  gameRunning = true;
  gamePaused = false;
  gameLoop();
}

export function gameOver() {
  gameRunning = false;
  const secs = Math.floor(gameTime / 60);
  document.getElementById('final-time').textContent = `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
  document.getElementById('final-level').textContent = player.level;
  document.getElementById('final-kills').textContent = kills;
  document.getElementById('game-over-screen').style.display = 'flex';
}

// ===================== INIT =====================
export function init() {
  touch.initTouchControls();
  
  document.getElementById('start-btn').addEventListener('click', startGameFunc);
  document.getElementById('restart-btn').addEventListener('click', startGameFunc);
}
