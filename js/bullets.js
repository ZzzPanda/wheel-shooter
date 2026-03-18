// ===================== ENTITIES: BULLETS =====================

import { bullets, enemies, player, particles } from './state.js';
import { gameState as state } from './state.js';

export function updateBullets(dt, addDmgText, gainXp, spawnDeathParticles) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    b.life--;

    if (b.life <= 0) {
      bullets.splice(i, 1);
      continue;
    }

    // Check enemy collision
    let hit = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const d = Math.hypot(b.x - e.x, b.y - e.y);
      if (d < b.radius + e.radius) {
        e.hp -= b.dmg;
        e.hitFlash = 4;
        addDmgText(e.x, e.y - e.radius, Math.floor(b.dmg), b.type === 'manual' ? '#ff0' : '#0ff');

        // Knockback
        const ka = Math.atan2(e.y - player.y, e.x - player.x);
        e.x += Math.cos(ka) * 3;
        e.y += Math.sin(ka) * 3;

        if (e.hp <= 0) {
          spawnDeathParticles(e.x, e.y, e.color, 12);
          xpOrbs.push({ x: e.x, y: e.y, amount: e.xp, radius: 4, life: 600 });
          state.kills++;
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
}

export function drawBullets(ctx, W, H, spritesLoaded, sprites) {
  for (let b of bullets) {
    const sx = b.x - gameState.camX + W / 2;
    const sy = b.y - gameState.camY + H / 2;

    if (b.type === 'manual' && spritesLoaded && sprites.railgun.complete) {
      const angle = Math.atan2(b.vy, b.vx);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);
      ctx.drawImage(sprites.railgun, -15, -3, 30, 6);
      ctx.restore();
    } else {
      // Default bullet
      ctx.beginPath();
      ctx.arc(sx, sy, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();

      // Glow
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
