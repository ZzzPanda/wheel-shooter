// ===================== ENTITIES: PARTICLES =====================

import { particles, xpOrbs, dmgTexts, player } from './state.js';
import { gameState as state } from './state.js';

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

export function updateParticles(dt) {
  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // XP orbs
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
      const speed = Math.max(2, 8 - d * 0.05);
      o.x += Math.cos(a) * speed;
      o.y += Math.sin(a) * speed;
    }
    if (d < 15) {
      // XP collected - will be handled by caller
      xpOrbs.splice(i, 1);
      return o.amount; // Return XP amount
    }
  }

  // Damage texts
  for (let i = dmgTexts.length - 1; i >= 0; i--) {
    dmgTexts[i].life--;
    if (dmgTexts[i].life <= 0) dmgTexts.splice(i, 1);
  }

  return 0;
}

export function addDmgText(x, y, txt, color) {
  dmgTexts.push({ x, y, txt: String(txt), color, life: 40, maxLife: 40 });
}

export function drawParticles(ctx, W, H) {
  // Particles
  for (let p of particles) {
    const sx = p.x - gameState.camX + W / 2;
    const sy = p.y - gameState.camY + H / 2;
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.beginPath();
    ctx.arc(sx, sy, p.radius * (p.life / p.maxLife), 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }

  // XP orbs
  for (let o of xpOrbs) {
    const sx = o.x - gameState.camX + W / 2;
    const sy = o.y - gameState.camY + H / 2;
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

  // Damage texts
  for (let d of dmgTexts) {
    const sx = d.x - gameState.camX + W / 2;
    const sy = d.y - gameState.camY + H / 2 - (1 - d.life / d.maxLife) * 20;
    ctx.save();
    ctx.globalAlpha = d.life / d.maxLife;
    ctx.font = 'bold 14px Courier New';
    ctx.fillStyle = d.color;
    ctx.textAlign = 'center';
    ctx.fillText(d.txt, sx, sy);
    ctx.restore();
  }
}
