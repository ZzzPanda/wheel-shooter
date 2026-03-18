// ===================== RENDERING =====================

import { gameState } from './state.js';

const WORLD = { mapSize: 3000 };

export function drawGrid(ctx, W, H) {
  const gridSize = 60;
  const offX = (-gameState.camX) % gridSize;
  const offY = (-gameState.camY) % gridSize;

  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;

  for (let x = offX; x < W; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = offY; y < H; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

export function drawBoundary(ctx, W, H) {
  const lx = -WORLD.mapSize / 2 - gameState.camX + W / 2;
  const ly = -WORLD.mapSize / 2 - gameState.camY + H / 2;

  ctx.strokeStyle = '#f00';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.strokeRect(lx, ly, WORLD.mapSize, WORLD.mapSize);
  ctx.setLineDash([]);
}

export function render(ctx, W, H, drawFuncs) {
  ctx.save();
  ctx.translate(gameState.shakeX, gameState.shakeY);

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);

  // Grid & boundary
  drawGrid(ctx, W, H);
  drawBoundary(ctx, W, H);

  // Game objects (in render order)
  if (drawFuncs.xpOrbs) drawFuncs.xpOrbs(ctx, W, H);
  if (drawFuncs.bullets) drawFuncs.bullets(ctx, W, H);
  if (drawFuncs.enemies) drawFuncs.enemies(ctx, W, H);
  if (drawFuncs.player) drawFuncs.player(ctx, W, H);
  if (drawFuncs.particles) drawFuncs.particles(ctx, W, H);

  ctx.restore();

  // Decay shake
  gameState.shakeX *= 0.8;
  gameState.shakeY *= 0.8;
}

export function updateCamera() {
  gameState.camX += (player.x - gameState.camX) * 0.1;
  gameState.camY += (player.y - gameState.camY) * 0.1;
}

import { player } from './state.js';
