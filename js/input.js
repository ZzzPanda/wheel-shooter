// ===================== INPUT =====================

export const keys = {};
export let mouseX = 0;
export let mouseY = 0;
export let mouseDown = false;

let canvas;
let canvasWidth = 0;
let canvasHeight = 0;

export function initInput(canvasEl) {
  canvas = canvasEl;
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;
  
  // Keyboard
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    e.preventDefault();
  });
  
  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  // Mouse
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
}

export function isKeyPressed(key) {
  return keys[key.toLowerCase()] || false;
}

export function getMousePos() {
  return { x: mouseX, y: mouseY };
}

export function isMouseDown() {
  return mouseDown;
}
