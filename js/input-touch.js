// ===================== TOUCH CONTROLS =====================

// Touch state
export const touch = {
  // Joystick
  joystickActive: false,
  joystickId: null,
  joystickStart: { x: 0, y: 0 },
  joystickCurrent: { x: 0, y: 0 },
  joystickVector: { x: 0, y: 0 }, // normalized -1 to 1
  
  // Shoot area
  shootActive: false,
  shootId: null,
  shootPos: { x: 0, y: 0 },
  
  // Buttons
  dashPressed: false,
  brakePressed: false,
  
  // Config
  joystickRadius: 60,
  joystickDeadzone: 0.2,
  shootAreaX: 0.5, // right 50% of screen
};

// Config
const DASH_COOLDOWN = 180; // frames (3 seconds at 60fps)
const DASH_DURATION = 30; // frames (0.5 seconds)
const DASH_SPEED_MULT = 2.5;
const BRAKE_FRICTION = 0.1;

export let dashCooldownTimer = 0;
export let dashActiveTimer = 0;

export function initTouchControls() {
  const canvas = document.getElementById('game');
  
  // Touch start
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const x = t.clientX / window.innerWidth;
      const y = t.clientY / window.innerHeight;
      
      // Joystick area (left 40% of screen, bottom 40%)
      if (x < 0.4 && y > 0.6) {
        touch.joystickActive = true;
        touch.joystickId = t.identifier;
        touch.joystickStart = { x: t.clientX, y: t.clientY };
        touch.joystickCurrent = { x: t.clientX, y: t.clientY };
        touch.joystickVector = { x: 0, y: 0 };
      }
      // Dash button (right side, top)
      else if (x > 0.85 && y > 0.7 && y < 0.85) {
        touch.dashPressed = true;
      }
      // Brake button (right side, bottom)
      else if (x > 0.85 && y > 0.85) {
        touch.brakePressed = true;
      }
      // Shoot area (right 60% of screen)
      else if (x >= 0.4) {
        touch.shootActive = true;
        touch.shootId = t.identifier;
        touch.shootPos = { x: t.clientX, y: t.clientY };
      }
    }
  }, { passive: false });
  
  // Touch move
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === touch.joystickId) {
        touch.joystickCurrent = { x: t.clientX, y: t.clientY };
        
        // Calculate vector
        const dx = touch.joystickCurrent.x - touch.joystickStart.x;
        const dy = touch.joystickCurrent.y - touch.joystickStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > touch.joystickRadius * touch.joystickDeadzone) {
          touch.joystickVector = {
            x: dx / dist,
            y: dy / dist
          };
        } else {
          touch.joystickVector = { x: 0, y: 0 };
        }
      }
      
      if (t.identifier === touch.shootId) {
        touch.shootPos = { x: t.clientX, y: t.clientY };
      }
    }
  }, { passive: false });
  
  // Touch end
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === touch.joystickId) {
        touch.joystickActive = false;
        touch.joystickId = null;
        touch.joystickVector = { x: 0, y: 0 };
      }
      if (t.identifier === touch.shootId) {
        touch.shootActive = false;
        touch.shootId = null;
      }
    }
    // Check for button releases
    const activeIds = Array.from(e.touches).map(t => t.identifier);
    if (!activeIds.includes(touch.joystickId)) {
      touch.joystickActive = false;
      touch.joystickVector = { x: 0, y: 0 };
    }
  }, { passive: false });
  
  // Prevent context menu
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

export function updateTouchInput() {
  // Update dash cooldown
  if (dashCooldownTimer > 0) {
    dashCooldownTimer--;
  }
  
  // Handle dash
  if (touch.dashPressed && dashCooldownTimer === 0 && dashActiveTimer === 0) {
    dashActiveTimer = DASH_DURATION;
    dashCooldownTimer = DASH_COOLDOWN;
  }
  touch.dashPressed = false;
  
  if (dashActiveTimer > 0) {
    dashActiveTimer--;
  }
}

export function getTouchMoveInput() {
  return touch.joystickVector;
}

export function getTouchAimInput() {
  if (touch.shootActive) {
    return { x: touch.shootPos.x, y: touch.shootPos.y };
  }
  return null;
}

export function isTouchShooting() {
  return touch.shootActive;
}

export function isBraking() {
  return touch.brakePressed;
}

export function isDashing() {
  return dashActiveTimer > 0;
}

export function getDashCooldownPercent() {
  return dashCooldownTimer / DASH_COOLDOWN;
}

// ===================== RENDER TOUCH UI =====================
export function drawTouchUI(ctx, W, H) {
  // Only draw on touch devices
  if (!('ontouchstart' in window)) return;
  
  // Joystick
  if (touch.joystickActive) {
    const jx = touch.joystickStart.x;
    const jy = touch.joystickStart.y;
    
    // Base
    ctx.beginPath();
    ctx.arc(jx, jy, touch.joystickRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Stick
    const stickX = jx + touch.joystickVector.x * touch.joystickRadius * 0.8;
    const stickY = jy + touch.joystickVector.y * touch.joystickRadius * 0.8;
    ctx.beginPath();
    ctx.arc(stickX, stickY, 25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
  }
  
  // Dash button
  const dashX = W - 80;
  const dashY = H - 180;
  ctx.beginPath();
  ctx.arc(dashX, dashY, 35, 0, Math.PI * 2);
  if (dashCooldownTimer > 0) {
    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
  } else {
    ctx.fillStyle = 'rgba(255, 200, 0, 0.4)';
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('冲', dashX, dashY);
  
  // Brake button
  const brakeX = W - 80;
  const brakeY = H - 80;
  ctx.beginPath();
  ctx.arc(brakeX, brakeY, 35, 0, Math.PI * 2);
  if (touch.brakePressed) {
    ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
  } else {
    ctx.fillStyle = 'rgba(255, 100, 100, 0.4)';
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('停', brakeX, brakeY);
  
  // Aim indicator
  if (touch.shootActive) {
    ctx.beginPath();
    ctx.arc(touch.shootPos.x, touch.shootPos.y, 15, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
