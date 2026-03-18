// ===================== CONFIG =====================

// Canvas
export const GAME = {
  title: '轮椅枪手',
  subtitle: 'Wheelchair Gunner',
};

// Player
export const PLAYER = {
  radius: 18,
  speed: 0.8,
  friction: 0.88,
  startHp: 100,
  startX: 0,
  startY: 0,
};

// Combat
export const COMBAT = {
  recoilForce: 3.5,
  manualFireRate: 6,
  autoFireRate: 45,
  bulletSpeed: 10,
  autoBulletSpeed: 7,
  manualDamage: 5,
  autoDamage: 8,
  autoRange: 350,
};

// Leveling
export const LEVEL = {
  xpBase: 10,
  xpGrowth: 1.35,
};

// World
export const WORLD = {
  enemySpawnDist: 500,
  mapSize: 3000,
};

// Enemy Types
export const ENEMY_TYPES = [
  { name: 'zombie', hp: 30, speed: 1.2, radius: 12, color: '#4a4', dmg: 10, xp: 3 },
  { name: 'fast',   hp: 15, speed: 2.8, radius: 9,  color: '#a4a', dmg: 8,  xp: 2 },
  { name: 'tank',   hp: 120, speed: 0.6, radius: 20, color: '#a44', dmg: 20, xp: 8 },
  { name: 'swarm',  hp: 10, speed: 2.0, radius: 7,  color: '#aa4', dmg: 5,  xp: 1 },
  { name: 'elite',  hp: 250, speed: 1.0, radius: 24, color: '#f80', dmg: 30, xp: 15 },
];

// Wave config
export const WAVE = {
  interval: 1800, // 30 seconds
  spawnRateBase: 50,
  spawnRateMin: 8,
  hpGrowth: 0.15,
};

// Upgrades
export const UPGRADES = [
  { icon: '🔫', name: '枪械强化', desc: '手动伤害+30%', apply: (p) => { p.manualDmg *= 1.3; } },
  { icon: '⚡', name: '射速提升', desc: '手动射速+20%', apply: (p) => { p.manualRate = Math.max(3, p.manualRate * 0.8); } },
  { icon: '🤖', name: '新增炮塔', desc: '轮椅+1自动炮塔', apply: (p) => { p.autoTurrets++; } },
  { icon: '💪', name: '炮塔强化', desc: '自动炮塔伤害+40%', apply: (p) => { p.autoDmg *= 1.4; } },
  { icon: '🛡️', name: '装甲强化', desc: '护甲+3', apply: (p) => { p.armor += 3; } },
  { icon: '❤️', name: '生命提升', desc: '最大HP+30', apply: (p) => { p.maxHp += 30; p.hp = Math.min(p.hp + 30, p.maxHp); } },
  { icon: '🏃', name: '移速提升', desc: '移动速度+15%', apply: (p) => { p.speedMult *= 1.15; } },
  { icon: '💥', name: '穿透弹', desc: '穿透+1', apply: (p) => { p.piercing++; } },
  { icon: '🔄', name: '后坐力控制', desc: '后坐力-25%', apply: (p) => { p.recoilMult *= 0.75; } },
  { icon: '🧲', name: '磁力增强', desc: '经验范围+40%', apply: (p) => { p.magnetRange *= 1.4; } },
  { icon: '🩸', name: '生命窃取', desc: '击杀回复2HP', apply: (p) => { p.lifeSteal += 2; } },
  { icon: '📏', name: '大口径', desc: '子弹+30%', apply: (p) => { p.bulletSize *= 1.3; p.autoBulletSize *= 1.3; } },
  { icon: '🚀', name: '弹速提升', desc: '弹速+20%', apply: (p) => { p.bulletSpeed *= 1.2; p.autoBulletSpeed *= 1.2; } },
  { icon: '⚙️', name: '炮塔射速', desc: '炮塔射速+25%', apply: (p) => { p.autoRate = Math.max(15, p.autoRate * 0.75); } },
];

// Sprite config
export const SPRITES = {
  player: {
    src: 'assets/player.png',
    frameWidth: 32,
    frameHeight: 145,
    numFrames: 3,
    scale: 0.6,
  },
  railgun: {
    src: 'assets/railgun.png',
  },
};
