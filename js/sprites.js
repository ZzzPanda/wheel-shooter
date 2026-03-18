// ===================== SPRITE LOADER =====================

import { SPRITES } from './config.js';

export const sprites = {
  player: new Image(),
  railgun: new Image(),
};

let spritesLoaded = 0;
const totalSprites = 2;

export function loadSprites(onComplete) {
  function onLoad() {
    spritesLoaded++;
    console.log(`Sprite loaded: ${spritesLoaded}/${totalSprites}`);
    if (spritesLoaded >= totalSprites && onComplete) {
      onComplete();
    }
  }

  sprites.player.onload = onLoad;
  sprites.player.onerror = () => console.error('Failed to load player sprite');
  sprites.railgun.onload = onLoad;
  sprites.railgun.onerror = () => console.error('Failed to load railgun sprite');

  sprites.player.src = SPRITES.player.src;
  sprites.railgun.src = SPRITES.railgun.src;
}

export function areSpritesLoaded() {
  return spritesLoaded >= totalSprites;
}
