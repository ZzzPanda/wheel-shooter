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
  joystickRadius: 80, // bigger joystick
  joystickDeadzone: 0.15,
  shootAreaX: 0.5, // right 50% of screen
};

// Config
const DASH_COOLDOWN = 180; // frames (3 seconds at 60fps)
const DASH_DURATION = 30; // frames (0.5 seconds)
const DASH_SPEED_MULT = 2.5;
const BRAKE_FRICTION = 0.1;

// Button configs
const BUTTON_RADIUS = 50; // bigger buttons
const DASH_X_OFFSET = 80; // from right edge
const DASH_Y = 120; // from top
const BRAKE_Y = 220; // below dash

// Left side button (brake)
const LEFT_BUTTON_X = 80; // from left edge
const LEFT_BRAKE_Y = 220;

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
      
      const W = window.innerWidth;
      const H = window.innerHeight;
      
      // Left side: joystick + brake button
      if (x < 0.5) {
        // Brake button (left side, middle height)
        const brakeBtnX = LEFT_BUTTON_X;
        const brakeBtnY = LEFT_BRAKE_Y;
        const tx = t.clientX;
        const ty = t.clientY;
        const brakeDist = Math.sqrt((tx - brakeBtnX) ** 2 + (ty - brakeBtnY) ** 2);
        
        if (brakeDist < BUTTON_RADIUS) {
          touch.brakePressed = true;
        } else {
          // Joystick (left half, anywhere)
          touch.joystickActive = true;
          touch.joystickId = t.identifier;
          touch.joystickStart = { x: t.clientX, y: t.clientY };
          touch.joystickCurrent = { x: t.clientX, y: t.clientY };
          touch.joystickVector = { x: 0, y: 0 };
        }
      }
      // Right half: dash button + fixed shoot joystick
      else {
        const rightX = W;
        const dashBtnX = rightX - DASH_X_OFFSET;
        const dashBtnY = DASH_Y;
        
        const tx = t.clientX;
        const ty = t.clientY;
        
        // Check dash button (top right)
        const dashDist = Math.sqrt((tx - dashBtnX) ** 2 + (ty - dashBtnY) ** 2);
        if (dashDist < BUTTON_RADIUS) {
          touch.dashPressed = true;
        }
        // Fixed shoot joystick (right side, lower area)
        else {
          touch.shootActive = true;
          touch.shootId = t.identifier;
          // Fixed center position for shoot joystick
          touch.shootPos = { 
            x: W * 0.75, 
            y: H - 180 
          };
        }
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
        // For fixed joystick, calculate relative to fixed center
        const W = window.innerWidth;
        const H = window.innerHeight;
        const fixedX = W * 0.75;
        const fixedY = H - 180;
        
        // Update aim direction based on touch movement relative to fixed center
        const dx = t.clientX - fixedX;
        const dy = t.clientY - fixedY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 10) {
          touch.shootPos = { x: t.clientX, y: t.clientY };
        }
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
  
  const rightX = W - DASH_X_OFFSET;
  const shootJoystickX = W * 0.75;
  const shootJoystickY = H - 180;
  
  // === LEFT SIDE ===
  
  // Joystick (left side)
  if (touch.joystickActive) {
    const jx = touch.joystickStart.x;
    const jy = touch.joystickStart.y;
    
    // Base
    ctx.beginPath();
    ctx.arc(jx, jy, touch.joystickRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Stick
    const stickX = jx + touch.joystickVector.x * touch.joystickRadius * 0.8;
    const stickY = jy + touch.joystickVector.y * touch.joystickRadius * 0.8;
    ctx.beginPath();
    ctx.arc(stickX, stickY, 30, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
  }
  
  // Brake button (left side, middle)
  ctx.beginPath();
  ctx.arc(LEFT_BUTTON_X, LEFT_BRAKE_Y, BUTTON_RADIUS, 0, Math.PI * 2);
  if (touch.brakePressed) {
    ctx.fillStyle = 'rgba(255, 100, 100, 0.7)';
  } else {
    ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('停', LEFT_BUTTON_X, LEFT_BRAKE_Y);
  
  // === RIGHT SIDE ===
  
  // Dash button (right top)
  ctx.beginPath();
  ctx.arc(rightX, DASH_Y, BUTTON_RADIUS, 0, Math.PI * 2);
  if (dashCooldownTimer > 0) {
    ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
  } else if (touch.dashPressed) {
    ctx.fillStyle = 'rgba(255, 200, 0, 0.7)';
  } else {
    ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('冲', rightX, DASH_Y);
  
  // Fixed shoot joystick (right side, lower area)
  // Draw fixed base area
  ctx.beginPath();
  ctx.arc(shootJoystickX, shootJoystickY, 60, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 50, 50, 0.15)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 50, 50, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw stick when touching
  if (touch.shootActive) {
    const stickX = touch.shootPos.x;
    const stickY = touch.shootPos.y;
    ctx.beginPath();
    ctx.arc(stickX, stickY, 25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 50, 50, 0.5)';
    ctx.fill();
  }
  
  // Labels
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('左:摇杆/刹车', LEFT_BUTTON_X, LEFT_BRAKE_Y + 70);
  ctx.fillText('右:冲刺/射击', rightX, shootJoystickY + 80);
}
