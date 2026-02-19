// Initialize game with error handling
function initializeGame() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Load character images
  const freddyMask = new Image();
  freddyMask.src = 'images/character1.png';

  const bonnieMask = new Image();
  bonnieMask.src = 'images/character2.png';

  const chicaMask = new Image();
  chicaMask.src = 'images/character3.png';

  const foxyMask = new Image();
  foxyMask.src = 'images/character4.png';

  if (!canvas || !ctx) {
    console.error('Failed to initialize canvas - game will not work');
    return; // Exit gracefully instead of throwing error
  }

  
  ctx.imageSmoothingEnabled = false;
  
  // Make canvas and context available globally
  window.gameCanvas = canvas;
  window.gameCtx = ctx;
}

// Initialize the game
initializeGame();

// Helper function to safely get DOM elements
function safeGetElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element with id '${id}' not found`);
  }
  return element;
}

// Load animatronic images with error handling
const animatronicImages = {
  freddy: new Image(),
  bonnie: new Image(),
  chica: new Image(),
  foxy: new Image()
};

// Track image loading status
const imageLoadStatus = {
  freddy: false,
  bonnie: false,
  chica: false,
  foxy: false
};

// Set up image loading with error handling and debugging
animatronicImages.freddy.onload = () => {
  imageLoadStatus.freddy = true;
  console.log('Freddy image loaded successfully, dimensions:', animatronicImages.freddy.width + 'x' + animatronicImages.freddy.height);
};
animatronicImages.freddy.onerror = () => {
  console.error('Freddy image failed to load, using fallback');
  console.log('Image src:', 'download.png');
};
animatronicImages.freddy.src = 'images/character1.png';

animatronicImages.bonnie.onload = () => {
  imageLoadStatus.bonnie = true;
  console.log('Bonnie image loaded successfully, dimensions:', animatronicImages.bonnie.width + 'x' + animatronicImages.bonnie.height);
};
animatronicImages.bonnie.onerror = () => {
  console.error('Bonnie image failed to load, using fallback');
  console.log('Image src:', 'download (1).png');
};
animatronicImages.bonnie.src = 'images/character2.png';

animatronicImages.chica.onload = () => {
  imageLoadStatus.chica = true;
  console.log('Chica image loaded successfully, dimensions:', animatronicImages.chica.width + 'x' + animatronicImages.chica.height);
};
animatronicImages.chica.onerror = () => {
  console.error('Chica image failed to load, using fallback');
  console.log('Image src:', 'images/character3.png');
};
animatronicImages.chica.src = 'images/character3.png';

animatronicImages.foxy.onload = () => {
  imageLoadStatus.foxy = true;
  console.log('Foxy image loaded successfully, dimensions:', animatronicImages.foxy.width + 'x' + animatronicImages.foxy.height);
};
animatronicImages.foxy.onerror = () => {
  console.error('Foxy image failed to load, using fallback');
  console.log('Image src:', 'download (3).png');
};
animatronicImages.foxy.src = 'images/character4.png';

// Mouse tracking for parallax effect
let mouseX = 400; // Center of screen
let mouseY = 300;
let targetMouseX = 400;
let targetMouseY = 300;
const parallaxStrength = 0.15; // How much the screen moves
const smoothness = 0.1; // How smooth the movement is

// Track mouse movement
if (window.gameCanvas) {
  window.gameCanvas.addEventListener('mousemove', (e) => {
    const rect = window.gameCanvas.getBoundingClientRect();
    targetMouseX = e.clientX - rect.left;
    targetMouseY = e.clientY - rect.top;
  });
}

// Update mouse position smoothly
function updateMousePosition() {
  mouseX += (targetMouseX - mouseX) * smoothness;
  mouseY += (targetMouseY - mouseY) * smoothness;
}

// Calculate parallax offset
function getParallaxOffset() {
  const offsetX = (mouseX - 400) * parallaxStrength;
  const offsetY = (mouseY - 300) * parallaxStrength;
  return { x: offsetX, y: offsetY };
}

let gameState = {
  power: 100,
  time: 0,
  night: 1,
  inCamera: false,
  leftLight: false,
  rightLight: false,
  leftDoor: false,
  rightDoor: false,
  gameOver: false,
  currentCamera: 1 // Start with Show Stage
};

let doorAnimation = {
  leftDoor: { animating: false, position: 0, target: 0, speed: 0.15 },
  rightDoor: { animating: false, position: 0, target: 0, speed: 0.15 }
};

let animatronics = {
  bonnie: { position: 0 },  // 0=Stage,1=Backstage,2=WestHall,3=WestCorner,4=Window
  chica: { position: 0 },   // 0=Stage,1=Dining,2=EastHall,3=EastCorner,4=Door
  foxy: { position: 0 }     // 0=CoveClosed,1=CovePeek,2=CoveOpen
};

let aiProgress = 0;
const cameraViews = {
  0: 'Show Stage (1A)',
  1: 'Dining Area (1B)',
  2: 'Pirate Cove (1C)',
  3: 'West Hall (2A)',
  4: 'West Hall Corner (2B)',
  5: 'East Hall (4A)'
};
let gameStartTime = Date.now();
let lastTime = 0;

// [Keep all your existing 3D functions unchanged - draw3DWall, draw3DDoor, draw3DDesk]
function drawAnimatronicSprite(image, x, y, width, height, fallbackColor = '#888') {
  if (!image.complete) {
    // Fallback: draw colored rectangle if image failed to load
    window.gameCtx.fillStyle = fallbackColor;
    window.gameCtx.fillRect(x, y, width, height);
    return;
  }
  
  window.gameCtx.save();
  
  // Create temporary canvas to remove white background
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = image.width;
  tempCanvas.height = image.height;
  
  // Draw image to temp canvas
  tempCtx.drawImage(image, 0, 0);
  
  // Get image data and remove white background
  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // Remove white/light pixels (make transparent)
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // If pixel is white or very light, make it transparent
    if (r > 200 && g > 200 && b > 200) {
      data[i + 3] = 0; // Set alpha to 0 (transparent)
    }
  }
  
  // Put modified image data back
  tempCtx.putImageData(imageData, 0, 0);
  
  // Draw the processed image with proper scaling
  window.gameCtx.drawImage(tempCanvas, x, y, width, height);
  
  window.gameCtx.restore();
}

function draw3DWall(x, y, w, h, colorDark, colorLight) {
  const ctx = window.gameCtx; // Use global context
  // Main wall with gradient for depth
  const wallGradient = ctx.createLinearGradient(x, y, x + w, y + h);
  wallGradient.addColorStop(0, colorLight);
  wallGradient.addColorStop(0.5, colorDark);
  wallGradient.addColorStop(1, colorDark);
  ctx.fillStyle = wallGradient;
  ctx.fillRect(x, y, w, h);
  
  // Side walls for 3D effect
  ctx.fillStyle = colorDark;
  // Left side wall
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 20, y - 10);
  ctx.lineTo(x - 20, y + h - 10);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  
  // Right side wall
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + 20, y - 10);
  ctx.lineTo(x + w + 20, y + h - 10);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  
  // Top edge for depth
  ctx.fillStyle = colorLight;
  ctx.fillRect(x - 20, y - 10, w + 40, 10);
  
  // Add texture lines
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  for(let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + i * (h/5));
    ctx.lineTo(x + w, y + i * (h/5));
    ctx.stroke();
  }
}

function draw3DDoor(x, y, w, h, open, side) {
  const anim = side === 'left' ? doorAnimation.leftDoor : doorAnimation.rightDoor;
  
  if (!open && anim.position < 1) {
    // SLAMMING ANIMATION - Door coming from above
    const doorHeight = h * anim.position;
    const doorY = y + (h - doorHeight);
    
    // Door with 3D effect
    const doorGradient = ctx.createLinearGradient(x, doorY, x + w, doorY + doorHeight);
    doorGradient.addColorStop(0, '#888');
    doorGradient.addColorStop(0.5, '#666');
    doorGradient.addColorStop(1, '#444');
    ctx.fillStyle = doorGradient;
    ctx.fillRect(x, doorY, w, doorHeight);
    
    // Door panels (scaled with animation)
    if (anim.position > 0.3) {
      const panelScale = (anim.position - 0.3) / 0.7;
      ctx.fillStyle = '#555';
      const panelHeight = (doorHeight / 3 - 10) * panelScale;
      ctx.fillRect(x + 10, doorY + 10, w - 20, panelHeight);
      ctx.fillRect(x + 10, doorY + doorHeight/3 + 10, w - 20, panelHeight);
      ctx.fillRect(x + 10, doorY + 2*doorHeight/3 + 10, w - 20, panelHeight);
      
      // Door handle
      ctx.fillStyle = '#C0C0C0';
      ctx.beginPath();
      ctx.arc(x + w - 20, doorY + doorHeight/2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 3D door frame
    ctx.fillStyle = '#333';
    ctx.fillRect(x - 5, y - 5, 5, h + 10);
    ctx.fillRect(x + w, y - 5, 5, h + 10);
    ctx.fillRect(x - 5, y - 5, w + 10, 5);
    ctx.fillRect(x - 5, y + h, w + 10, 5);
    
    // Shadow beneath door
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + w + 5, y + 5, 15, h);
    
    // Motion blur effect during slam
    if (anim.animating && anim.position < 0.8) {
      ctx.fillStyle = 'rgba(100,100,100,0.2)';
      for (let i = 1; i <= 3; i++) {
        const blurY = doorY - (i * 10 * (1 - anim.position));
        ctx.fillRect(x, blurY, w, 5);
      }
    }
  } else if (!open && anim.position >= 1) {
    // Fully closed door
    const doorGradient = ctx.createLinearGradient(x, y, x + w, y + h);
    doorGradient.addColorStop(0, '#888');
    doorGradient.addColorStop(0.5, '#666');
    doorGradient.addColorStop(1, '#444');
    ctx.fillStyle = doorGradient;
    ctx.fillRect(x, y, w, h);
    
    // Door panels
    ctx.fillStyle = '#555';
    ctx.fillRect(x + 10, y + 10, w - 20, h/3 - 10);
    ctx.fillRect(x + 10, y + h/3 + 10, w - 20, h/3 - 10);
    ctx.fillRect(x + 10, y + 2*h/3 + 10, w - 20, h/3 - 20);
    
    // Door handle
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.arc(x + w - 20, y + h/2, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // 3D door frame
    ctx.fillStyle = '#333';
    ctx.fillRect(x - 5, y - 5, 5, h + 10);
    ctx.fillRect(x + w, y - 5, 5, h + 10);
    ctx.fillRect(x - 5, y - 5, w + 10, 5);
    ctx.fillRect(x - 5, y + h, w + 10, 5);
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + w + 5, y + 5, 15, h);
  } else {
    // OPEN DOOR - Show hallway beyond
    if (x === 10) {
      drawOpenLeftDoorway(x, y, w, h);
    } else {
      drawOpenRightDoorway(x, y, w, h);
    }
    
    // Door frame
    ctx.fillStyle = '#333';
    ctx.fillRect(x - 5, y - 5, 5, h + 10);
    ctx.fillRect(x + w, y - 5, 5, h + 10);
    ctx.fillRect(x - 5, y - 5, w + 10, 5);
    ctx.fillRect(x - 5, y + h, w + 10, 5);
  }
}

function drawOpenLeftDoorway(x, y, w, h) {
  // West Hall background when door is open
  const hallGradient = ctx.createLinearGradient(x, y, x + w, y + h);
  hallGradient.addColorStop(0, '#444');
  hallGradient.addColorStop(1, '#222');
  ctx.fillStyle = hallGradient;
  ctx.fillRect(x, y, w, h);
  
  // Hall floor with perspective
  const floorGradient = ctx.createLinearGradient(x, y + h - 50, x, y + h);
  floorGradient.addColorStop(0, '#333');
  floorGradient.addColorStop(1, '#111');
  ctx.fillStyle = floorGradient;
  ctx.fillRect(x, y + h - 50, w, 50);
  
  // Perspective lines for hallway depth
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w/2, y + h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w/2, y + h);
  ctx.stroke();
  
  // Ceiling lights in hallway
  for(let i = 0; i < 3; i++) {
    const lightX = x + 20 + i * 35;
    const lightY = y + 20 + i * 15;
    const lightGradient = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, 15);
    lightGradient.addColorStop(0, 'rgba(255,255,200,0.2)');
    lightGradient.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(lightX - 15, lightY - 10, 30, 20);
  }
  
  // If Bonnie is in the hall, show him
  if (animatronics.bonnie.position === 2) {
    // Bonnie in West Hall
    drawAnimatronicSprite(
      animatronicImages.bonnie,
      x + 20,
      y + 40,
      48 * 0.6,
      72 * 0.6
    );
  }
  
  // Light illumination if left light is on
  if (gameState.leftLight) {
    const lightGrad = ctx.createRadialGradient(x + w/2, y + h/2, 0, x + w/2, y + h/2, 80);
    lightGrad.addColorStop(0, 'rgba(255,255,0,0.4)');
    lightGrad.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(x, y, w, h);
    
    // Light rays into hallway
    ctx.fillStyle = 'rgba(255,255,0,0.1)';
    for(let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x + w/2, y + h/2);
      ctx.lineTo(x + 10 + i*20, y);
      ctx.lineTo(x + 20 + i*20, y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawOpenRightDoorway(x, y, w, h) {
  // East Hall background when door is open
  const hallGradient = ctx.createLinearGradient(x + w, y, x, y + h);
  hallGradient.addColorStop(0, '#444');
  hallGradient.addColorStop(1, '#222');
  ctx.fillStyle = hallGradient;
  ctx.fillRect(x, y, w, h);
  
  // Hall floor with perspective
  const floorGradient = ctx.createLinearGradient(x + w, y + h - 50, x + w, y + h);
  floorGradient.addColorStop(0, '#333');
  floorGradient.addColorStop(1, '#111');
  ctx.fillStyle = floorGradient;
  ctx.fillRect(x, y + h - 50, w, 50);
  
  // Perspective lines for hallway depth
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w/2, y + h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w/2, y + h);
  ctx.stroke();
  
  // Ceiling lights in hallway
  for(let i = 0; i < 3; i++) {
    const lightX = x + w - 20 - i * 35;
    const lightY = y + 20 + i * 15;
    const lightGradient = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, 15);
    lightGradient.addColorStop(0, 'rgba(255,255,200,0.2)');
    lightGradient.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(lightX - 15, lightY - 10, 30, 20);
  }
  
  // If Chica is in the hall, show her
  if (animatronics.chica.position === 2) {
    // Chica in East Hall
    drawAnimatronicSprite(
      animatronicImages.chica,
      x + w - 68,
      y + 40,
      48 * 0.6,
      72 * 0.6
    );
  }
  
  // Light illumination if right light is on
  if (gameState.rightLight) {
    const lightGrad = ctx.createRadialGradient(x + w/2, y + h/2, 0, x + w/2, y + h/2, 80);
    lightGrad.addColorStop(0, 'rgba(255,255,0,0.4)');
    lightGrad.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(x, y, w, h);
    
    // Light rays into hallway
    ctx.fillStyle = 'rgba(255,255,0,0.1)';
    for(let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x + w/2, y + h/2);
      ctx.lineTo(x + w - 30 - i*20, y);
      ctx.lineTo(x + w - 20 - i*20, y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function draw3DDesk() {
  // Desk with 3D perspective
  const deskX = 250, deskY = 320, deskW = 300, deskH = 120;
  
  // Main desk surface with gradient
  const deskGradient = ctx.createLinearGradient(deskX, deskY, deskX, deskY + deskH);
  deskGradient.addColorStop(0, '#8D6E63');
  deskGradient.addColorStop(1, '#5D4037');
  ctx.fillStyle = deskGradient;
  ctx.fillRect(deskX, deskY, deskW, deskH);
  
  // Desk top surface (3D effect)
  ctx.fillStyle = '#A1887F';
  ctx.beginPath();
  ctx.moveTo(deskX - 10, deskY - 5);
  ctx.lineTo(deskX + deskW + 10, deskY - 5);
  ctx.lineTo(deskX + deskW, deskY);
  ctx.lineTo(deskX, deskY);
  ctx.closePath();
  ctx.fill();
  
  // Wood grain texture
  ctx.strokeStyle = '#6D4C41';
  ctx.lineWidth = 1;
  for(let i = 0; i < 15; i++) {
    ctx.beginPath();
    ctx.moveTo(deskX + 10, deskY + 8 + i * 7);
    ctx.lineTo(deskX + deskW - 10, deskY + 8 + i * 7);
    ctx.stroke();
  }
  
  // Desk legs with 3D effect
  ctx.fillStyle = '#4E342E';
  // Left leg
  ctx.fillRect(deskX + 10, deskY + deskH, 20, 60);
  ctx.fillRect(deskX + 8, deskY + deskH, 4, 60);
  // Right leg
  ctx.fillRect(deskX + deskW - 30, deskY + deskH, 20, 60);
  ctx.fillRect(deskX + deskW - 32, deskY + deskH, 4, 60);
  // Middle supports
  ctx.fillRect(deskX + 50, deskY + deskH, 15, 60);
  ctx.fillRect(deskX + deskW - 65, deskY + deskH, 15, 60);
  
  // Monitor with 3D effect
  const monitorX = 380, monitorY = 250, monitorW = 100, monitorH = 70;
  // Monitor screen
  const screenGradient = ctx.createLinearGradient(monitorX, monitorY, monitorX, monitorY + monitorH);
  screenGradient.addColorStop(0, '#222');
  screenGradient.addColorStop(1, '#000');
  ctx.fillStyle = screenGradient;
  ctx.fillRect(monitorX, monitorY, monitorW, monitorH);
  
  // Monitor frame
  ctx.fillStyle = '#333';
  ctx.fillRect(monitorX - 5, monitorY - 5, monitorW + 10, monitorH + 10);
  ctx.fillStyle = '#555';
  ctx.fillRect(monitorX - 3, monitorY - 3, monitorW + 6, monitorH + 6);
  
  // Monitor stand
  ctx.fillStyle = '#444';
  ctx.fillRect(monitorX + monitorW/2 - 10, monitorY + monitorH, 20, 30);
  ctx.fillRect(monitorX + monitorW/2 - 20, monitorY + monitorH + 25, 40, 8);
  
  // Monitor screen glow
  ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
  ctx.fillRect(monitorX + 5, monitorY + 5, monitorW - 10, monitorH - 10);
  
  // Fan on monitor
  ctx.fillStyle = '#FFF8DC';
  ctx.fillRect(monitorX + 10, monitorY + 10, monitorW - 20, 30);
  ctx.fillStyle = '#000';
  ctx.font = '10px monospace';
  ctx.fillText('Freddy Fazbear\'s Pizza', monitorX + 15, monitorY + 25);
  
  // Shadow under desk
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(deskX - 10, deskY + deskH + 55, deskW + 20, 10);
}

function draw3DFloor() {
  // Floor with CHECKERED PATTERN
  const floorY = 500;
  const tileSize = 67;
  const tileCount = 12;
  
  for(let row = 0; row < 2; row++) {
    for(let col = 0; col < tileCount; col++) {
      // Calculate perspective
      const perspective = 1 - (row * 0.3);
      const tileWidth = tileSize * perspective;
      const tileHeight = 25 * perspective;
      const x = col * tileSize;
      const y = floorY + row * 25;
      
      // Checker pattern
      if((row + col) % 2 === 0) {
        ctx.fillStyle = '#555';
      } else {
        ctx.fillStyle = '#333';
      }
      
      // Tile gradient for depth
      const tileGradient = ctx.createLinearGradient(x, y, x, y + tileHeight);
      tileGradient.addColorStop(0, ctx.fillStyle);
      tileGradient.addColorStop(1, '#222');
      ctx.fillStyle = tileGradient;
      ctx.fillRect(x, y, tileWidth, tileHeight);
    }
  }
}

// *** UPGRADED 3D CAMERA SYSTEM ***
function drawCamera() {
  const ctx = window.gameCtx;
  // Camera background with depth gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, 600);
  bgGradient.addColorStop(0, '#1a1a1a');
  bgGradient.addColorStop(1, '#000000');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 800, 600);
  
  // Add camera static noise effect
  drawCameraStatic();
  
  // Draw camera view based on current camera
  if (gameState.currentCamera === 1) {
    drawShowStage3D();
  } else if (gameState.currentCamera === 2) {
    drawDiningArea3D();
  } else if (gameState.currentCamera === 3) {
    drawPirateCove3D();
  } else if (gameState.currentCamera === 4) {
    drawWestHall3D();
  } else if (gameState.currentCamera === 5) {
    drawWestHallCorner3D();
  } else if (gameState.currentCamera === 6) {
    drawSupplyCloset3D();
  } else if (gameState.currentCamera === 7) {
    drawEastHall3D();
  } else if (gameState.currentCamera === 8) {
    drawEastHallCorner3D();
  } else if (gameState.currentCamera === 9) {
    drawBackstage3D();
  }
  
  // Add camera vignette effect
  drawCameraVignette();
  
  // Add scan lines for CRT effect
  drawScanLines();
  
  // Add camera static overlay
  drawStaticOverlay();
}

function drawMiniCameraView() {
  // Draw small preview of current camera
  ctx.save();
  ctx.scale(0.25, 0.25); // Scale down to 1/4 size
  ctx.translate(1560, 1400); // Position in corner
  
  // Draw the actual camera view at small scale
  if (gameState.currentCamera === 1) {
    drawShowStage3D();
  } else if (gameState.currentCamera === 2) {
    drawDiningArea3D();
  } else if (gameState.currentCamera === 3) {
    drawPirateCove3D();
  } else if (gameState.currentCamera === 4) {
    drawWestHall3D();
  } else if (gameState.currentCamera === 5) {
    drawWestHallCorner3D();
  } else if (gameState.currentCamera === 6) {
    drawSupplyCloset3D();
  } else if (gameState.currentCamera === 7) {
    drawEastHall3D();
  } else if (gameState.currentCamera === 8) {
    drawEastHallCorner3D();
  } else if (gameState.currentCamera === 9) {
    drawBackstage3D();
  }
  
  ctx.restore();
}

function drawCameraStatic() {
  const ctx = window.gameCtx;
  // Optimized static noise using overlay instead of ImageData manipulation
  ctx.fillStyle = 'rgba(128,128,128,0.05)';
  for(let i = 0; i < 100; i++) {
    const x = Math.random() * 800;
    const y = Math.random() * 600;
    const w = Math.random() * 3;
    const h = Math.random() * 20;
    ctx.fillRect(x, y, w, h);
  }
}

function drawCameraVignette() {
  // Dark vignette effect for camera view
  const vignette = ctx.createRadialGradient(400, 300, 100, 400, 300, 500);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(0.7, 'rgba(0,0,0,0.3)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 800, 600);
}

function drawScanLines() {
  // CRT scan lines effect
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  for(let y = 0; y < 600; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(800, y);
    ctx.stroke();
  }
}

function drawStaticOverlay() {
  // Animated static overlay
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for(let i = 0; i < 50; i++) {
    const x = Math.random() * 800;
    const y = Math.random() * 600;
    const w = Math.random() * 3;
    const h = Math.random() * 20;
    ctx.fillRect(x, y, w, h);
  }
}

function getCameraName() {
  const names = {
    1: 'SHOW STAGE',
    2: 'DINING AREA', 
    3: 'PIRATE COVE',
    4: 'WEST HALL',
    5: 'WEST HALL CORNER',
    6: 'SUPPLY CLOSET',
    7: 'EAST HALL',
    8: 'EAST HALL CORNER',
    9: 'BACKSTAGE'
  };
  return names[gameState.currentCamera] || 'UNKNOWN';
}

function getCameraTime() {
  const hours = Math.floor(gameState.time / 60).toString().padStart(2, '0');
  const minutes = (gameState.time % 60).toString().padStart(2, '0');
  return `${hours}:${minutes} AM`;
}

function drawShowStage3D() {
  // Darker camera view with security camera aesthetics
  ctx.save();
  
  // Apply camera darkness filter
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, 800, 600);
  
  // 3D stage floor with darker perspective and CHECKERED PATTERN
  const stageGradient = ctx.createLinearGradient(250, 400, 250, 500);
  stageGradient.addColorStop(0, '#4A3018');
  stageGradient.addColorStop(1, '#2A1810');
  ctx.fillStyle = stageGradient;
  ctx.beginPath();
  ctx.moveTo(200, 450);
  ctx.lineTo(600, 450);
  ctx.lineTo(650, 500);
  ctx.lineTo(150, 500);
  ctx.closePath();
  ctx.fill();
  
  // CHECKERED FLOOR PATTERN
  const tileSize = 25;
  for(let row = 0; row < 2; row++) {
    for(let col = 0; col < 20; col++) {
      const x = 150 + col * tileSize;
      const y = 450 + row * tileSize;
      
      if((row + col) % 2 === 0) {
        ctx.fillStyle = '#5A4033';
      } else {
        ctx.fillStyle = '#3A2418';
      }
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }
  
  // 3D stage backdrop with dark lighting
  const curtainGradient = ctx.createLinearGradient(250, 100, 250, 400);
  curtainGradient.addColorStop(0, '#4B0000');
  curtainGradient.addColorStop(1, '#2B0000');
  ctx.fillStyle = curtainGradient;
  ctx.fillRect(200, 100, 400, 350);
  
  // 3D curtain folds with shadows
  ctx.fillStyle = '#330000';
  for(let i = 0; i < 8; i++) {
    const x = 200 + i * 50;
    ctx.beginPath();
    ctx.moveTo(x, 100);
    ctx.lineTo(x - 10, 400);
    ctx.lineTo(x + 40, 400);
    ctx.lineTo(x + 30, 100);
    ctx.closePath();
    ctx.fill();
  }
  
  // Dim stage lights
  for(let i = 0; i < 3; i++) {
    const lightX = 300 + i * 100;
    const lightGradient = ctx.createRadialGradient(lightX, 120, 0, lightX, 120, 40);
    lightGradient.addColorStop(0, 'rgba(255,255,200,0.2)');
    lightGradient.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(lightX - 40, 80, 80, 80);
  }
  
  // UNIQUE SHOW STAGE PROPS
  // Musical notes floating in air
  ctx.fillStyle = 'rgba(255,215,0,0.3)';
  ctx.font = '20px serif';
  ctx.fillText('♪', 250, 150);
  ctx.fillText('♫', 450, 180);
  ctx.fillText('♪', 350, 140);
  
  // Birthday banner
  ctx.fillStyle = '#FF69B4';
  ctx.fillRect(250, 70, 300, 25);
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('HAPPY BIRTHDAY!', 320, 88);
  
  // Balloons
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(180, 200, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0000FF';
  ctx.beginPath();
  ctx.arc(620, 180, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFF00';
  ctx.beginPath();
  ctx.arc(200, 250, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // Microphone stands
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(280, 380, 8, 70);
  ctx.fillRect(520, 380, 8, 70);
  ctx.fillStyle = '#000';
  ctx.fillRect(278, 375, 12, 12);
  ctx.fillRect(518, 375, 12, 12);
  
  // 3D party tables with camera darkness
  draw3DTableCamera(120, 380, 60, 40, 0.8);
  draw3DTableCamera(620, 380, 60, 40, 0.8);
  draw3DTableCamera(370, 420, 70, 45, 0.6);
  
  // Pizza boxes on tables
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(130, 360, 40, 25);
  ctx.fillRect(630, 360, 40, 25);
  ctx.fillStyle = '#FF0000';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('PIZZA', 135, 375);
  ctx.fillText('PIZZA', 635, 375);
  
  // Freddy with camera lighting
  draw3DFreddyCamera(400, 220, 1.0);
  
  if (animatronics.bonnie.position === 0) {
    // Bonnie on Show Stage - using PNG sprite
    drawAnimatronicSprite(
      animatronicImages.bonnie,
      320,
      220,
      80 * 0.9,
      120 * 0.9
    );
  }
  
  if (animatronics.chica.position === 0) {
    draw3DChicaCamera(480, 220, 0.9);
  }
  
  // Camera timestamp overlay
  ctx.fillStyle = 'rgba(0,255,0,0.7)';
  ctx.font = '10px monospace';
  ctx.fillText('NIGHT ' + gameState.night, 700, 580);
  
  ctx.restore();
}

// 3D Helper Functions
function draw3DTable(x, y, width, height, scale) {
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  
  // Table top with 3D perspective
  const tableGradient = ctx.createLinearGradient(x, y, x, y + scaledHeight);
  tableGradient.addColorStop(0, '#8B4513');
  tableGradient.addColorStop(1, '#654321');
  ctx.fillStyle = tableGradient;
  ctx.fillRect(x, y, scaledWidth, scaledHeight);
  
  // Table top surface (3D effect)
  ctx.fillStyle = '#A1887F';
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 3);
  ctx.lineTo(x + scaledWidth + 5, y - 3);
  ctx.lineTo(x + scaledWidth, y);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  
  // Table legs
  ctx.fillStyle = '#4E342E';
  ctx.fillRect(x + 10, y + scaledHeight, 8 * scale, 30 * scale);
  ctx.fillRect(x + scaledWidth - 18, y + scaledHeight, 8 * scale, 30 * scale);
}

function draw3DPoster(x, y, width, height, color) {
  // Poster with 3D frame
  ctx.fillStyle = '#333';
  ctx.fillRect(x - 5, y - 5, width + 10, height + 10);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
  
  // Poster content
  ctx.fillStyle = '#000';
  ctx.font = 'bold 12px monospace';
  const text = color === '#FFD700' ? 'PIZZA!' : color === '#FF69B4' ? 'PARTY!' : 'FUN!';
  ctx.fillText(text, x + 10, y + height/2);
}

function draw3DTrashCan(x, y, width, height) {
  // 3D trash can
  const canGradient = ctx.createLinearGradient(x, y, x + width, y);
  canGradient.addColorStop(0, '#666');
  canGradient.addColorStop(1, '#444');
  ctx.fillStyle = canGradient;
  ctx.fillRect(x, y, width, height);
  
  // Can top
  ctx.fillStyle = '#555';
  ctx.fillRect(x - 2, y - 3, width + 4, 6);
}

function draw3DFloorTiles(x, y, width, height) {
  const tileSize = 50;
  for(let row = 0; row < 2; row++) {
    for(let col = 0; col < width / tileSize; col++) {
      const tileX = x + col * tileSize;
      const tileY = y + row * tileSize;
      
      if((row + col) % 2 === 0) {
        ctx.fillStyle = '#444';
      } else {
        ctx.fillStyle = '#333';
      }
      ctx.fillRect(tileX, tileY, tileSize, tileSize);
    }
  }
}

function draw3DPerspectiveFloor(x, y, width, height) {
  // Floor tiles with perspective
  const tileCount = 12;
  for(let i = 0; i < tileCount; i++) {
    const perspective = 1 - (i / tileCount) * 0.5;
    const tileWidth = 67 * perspective;
    const tileHeight = 25 * perspective;
    const tileX = x + i * (width / tileCount);
    const tileY = y;
    
    ctx.fillStyle = i % 2 === 0 ? '#444' : '#333';
    ctx.fillRect(tileX, tileY, tileWidth, tileHeight);
  }
}

// 3D Animatronic Drawing Functions
function draw3DFreddy(x, y, scale) {
  const scaledSize = 80 * scale;
  
  // Enhanced shadow with more realistic shape
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + scaledSize + 15, scaledSize * 0.6, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Freddy body with more detailed gradient and shape
  const bodyGradient = ctx.createLinearGradient(x - scaledSize/2, y, x + scaledSize/2, y + scaledSize);
  bodyGradient.addColorStop(0, '#A52A2A');
  bodyGradient.addColorStop(0.3, '#8B0000');
  bodyGradient.addColorStop(0.7, '#6B0000');
  bodyGradient.addColorStop(1, '#4B0000');
  ctx.fillStyle = bodyGradient;
  
  // Main body with rounded top
  ctx.beginPath();
  ctx.roundRect(x - scaledSize/2, y + 10, scaledSize, scaledSize - 10, 15 * scale);
  ctx.fill();
  
  // Chest panel details
  ctx.fillStyle = '#6B0000';
  ctx.fillRect(x - scaledSize/2 + 10, y + 30, scaledSize - 20, 25 * scale);
  
  // Belly patch
  ctx.fillStyle = '#FFF8DC';
  ctx.beginPath();
  ctx.ellipse(x, y + 50, 20 * scale, 15 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw character image as head
  if (animatronicImages.freddy.complete) {
    ctx.save();
    // Scale and position the image
    const imageSize = scaledSize * 1.2;
    ctx.drawImage(animatronicImages.freddy, x - imageSize/2, y - 20, imageSize, imageSize);
    ctx.restore();
  } else {
    // Fallback: draw original head if image not loaded
    const headGradient = ctx.createLinearGradient(x - 25 * scale, y - 20, x + 25 * scale, y + 20);
    headGradient.addColorStop(0, '#B22222');
    headGradient.addColorStop(1, '#8B0000');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(x, y + 10, 25 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Endoskeleton mask seams
  ctx.strokeStyle = '#4A0000';
  ctx.lineWidth = 1;
  // Vertical seam
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x, y + 30);
  ctx.stroke();
  // Horizontal seam
  ctx.beginPath();
  ctx.moveTo(x - 20 * scale, y + 10);
  ctx.lineTo(x + 20 * scale, y + 10);
  ctx.stroke();
  
  // Cheek plates
  ctx.strokeStyle = '#6B0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x - 15 * scale, y + 15, 8 * scale, 0, Math.PI * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 15 * scale, y + 15, 8 * scale, Math.PI * 0.5, Math.PI);
  ctx.stroke();
  
  // Ears
  ctx.fillStyle = '#8B0000';
  ctx.beginPath();
  ctx.moveTo(x - 20 * scale, y - 5);
  ctx.lineTo(x - 25 * scale, y - 25);
  ctx.lineTo(x - 10 * scale, y - 15);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 20 * scale, y - 5);
  ctx.lineTo(x + 25 * scale, y - 25);
  ctx.lineTo(x + 10 * scale, y - 15);
  ctx.closePath();
  ctx.fill();
  
  // Eyes with more detail
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x - 10 * scale, y + 10, 4 * scale, 0, Math.PI * 2);
  ctx.arc(x + 10 * scale, y + 10, 4 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Eye glow
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(x - 9 * scale, y + 9, 2 * scale, 0, Math.PI * 2);
  ctx.arc(x + 11 * scale, y + 9, 2 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Nose
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, y + 20, 3 * scale, 2 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Better bowtie
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(x - 15 * scale, y - 5);
  ctx.lineTo(x - 8 * scale, y - 2);
  ctx.lineTo(x - 15 * scale, y + 1);
  ctx.lineTo(x - 22 * scale, y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 15 * scale, y - 5);
  ctx.lineTo(x + 8 * scale, y - 2);
  ctx.lineTo(x + 15 * scale, y + 1);
  ctx.lineTo(x + 22 * scale, y - 2);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.moveTo(x - 12 * scale, y - 4);
  ctx.lineTo(x - 8 * scale, y - 2);
  ctx.lineTo(x - 12 * scale, y);
  ctx.lineTo(x - 16 * scale, y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 12 * scale, y - 4);
  ctx.lineTo(x + 8 * scale, y - 2);
  ctx.lineTo(x + 12 * scale, y);
  ctx.lineTo(x + 16 * scale, y - 2);
  ctx.closePath();
  ctx.fill();
  
  // Enhanced microphone with detailed endoskeleton parts
  // Microphone stand pole
  const micGradient = ctx.createLinearGradient(x + 20 * scale, y + 20, x + 24 * scale, y + 20);
  micGradient.addColorStop(0, '#C0C0C0');
  micGradient.addColorStop(0.5, '#A9A9A9');
  micGradient.addColorStop(1, '#808080');
  ctx.fillStyle = micGradient;
  ctx.fillRect(x + 20 * scale, y + 20, 4 * scale, 35 * scale);
  
  // Microphone head with mesh detail
  ctx.beginPath();
  ctx.ellipse(x + 22 * scale, y + 18, 8 * scale, 6 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Microphone mesh pattern
  ctx.fillStyle = '#696969';
  for(let i = 0; i < 3; i++) {
    for(let j = 0; j < 2; j++) {
      ctx.beginPath();
      ctx.arc(x + 18 * scale + i * 3, y + 16 * scale + j * 3, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Endoskeleton jaw visible under mask
  ctx.fillStyle = '#4A4A4A';
  ctx.fillRect(x - 15 * scale, y + 35, 30 * scale, 8 * scale);
  ctx.fillStyle = '#2C2C2C';
  // Jaw teeth
  for(let i = 0; i < 4; i++) {
    ctx.fillRect(x - 12 * scale + i * 7, y + 38, 2 * scale, 3 * scale);
  }
  
  // Top hat
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 15 * scale, y - 35, 30 * scale, 3 * scale);
  ctx.fillRect(x - 12 * scale, y - 45, 24 * scale, 12 * scale);
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(x - 12 * scale, y - 43, 24 * scale, 2 * scale);
}

function draw3DChica(x, y, scale) {
  const scaledSize = 80 * scale;
  
  // Enhanced shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + scaledSize + 15, scaledSize * 0.6, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Chica body with detailed gradient
  const bodyGradient = ctx.createLinearGradient(x - scaledSize/2, y, x + scaledSize/2, y + scaledSize);
  bodyGradient.addColorStop(0, '#FFD700');
  bodyGradient.addColorStop(0.3, '#FFA500');
  bodyGradient.addColorStop(0.7, '#FF8C00');
  bodyGradient.addColorStop(1, '#FF6347');
  ctx.fillStyle = bodyGradient;
  
  // Main body with rounded shape
  ctx.beginPath();
  ctx.roundRect(x - scaledSize/2, y + 10, scaledSize, scaledSize - 10, 15 * scale);
  ctx.fill();
  
  // Chest bib
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.moveTo(x - scaledSize/2 + 10, y + 25);
  ctx.lineTo(x + scaledSize/2 - 10, y + 25);
  ctx.lineTo(x + scaledSize/2 - 15, y + 55);
  ctx.lineTo(x - scaledSize/2 + 15, y + 55);
  ctx.closePath();
  ctx.fill();
  
  // Bib text "LET'S EAT!!!"
  ctx.fillStyle = '#FF0000';
  ctx.font = `bold ${8 * scale}px sans-serif`;
  ctx.fillText("LET'S", x - 20 * scale, y + 40);
  ctx.fillText("EAT!!!", x - 18 * scale, y + 50);
  
  // Belly patch
  ctx.fillStyle = '#FFF8DC';
  ctx.beginPath();
  ctx.ellipse(x, y + 50, 18 * scale, 12 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Head with chicken features and endoskeleton mask
  const headGradient = ctx.createLinearGradient(x - 25 * scale, y - 20, x + 25 * scale, y + 20);
  headGradient.addColorStop(0, '#FFD700');
  headGradient.addColorStop(1, '#FFA500');
  ctx.fillStyle = headGradient;
  ctx.beginPath();
  ctx.arc(x, y + 10, 23 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Endoskeleton mask seams
  ctx.strokeStyle = '#CC6600';
  ctx.lineWidth = 1;
  // Vertical seam
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x, y + 30);
  ctx.stroke();
  // Horizontal seam
  ctx.beginPath();
  ctx.moveTo(x - 18 * scale, y + 10);
  ctx.lineTo(x + 18 * scale, y + 10);
  ctx.stroke();
  
  // Jaw separation line
  ctx.strokeStyle = '#FF8C00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 15 * scale, y + 25);
  ctx.lineTo(x + 15 * scale, y + 25);
  ctx.stroke();
  
  // Chicken comb
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x - 8 * scale, y - 25);
  ctx.lineTo(x - 4 * scale, y - 15);
  ctx.lineTo(x, y - 20);
  ctx.lineTo(x + 4 * scale, y - 15);
  ctx.lineTo(x + 8 * scale, y - 25);
  ctx.lineTo(x, y - 10);
  ctx.closePath();
  ctx.fill();
  
  // Eyes with purple glow
  ctx.fillStyle = '#9400D3';
  ctx.beginPath();
  ctx.arc(x - 10 * scale, y + 10, 5 * scale, 0, Math.PI * 2);
  ctx.arc(x + 10 * scale, y + 10, 5 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Eye highlights
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(x - 9 * scale, y + 9, 2 * scale, 0, Math.PI * 2);
  ctx.arc(x + 11 * scale, y + 9, 2 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Beak
  ctx.fillStyle = '#FFA500';
  ctx.beginPath();
  ctx.moveTo(x, y + 18);
  ctx.lineTo(x - 8 * scale, y + 25);
  ctx.lineTo(x + 8 * scale, y + 25);
  ctx.closePath();
  ctx.fill();
  
  // Enhanced Mr. Cupcake with extreme detail
  const cupcakeX = x + 35 * scale;
  const cupcakeY = y - 5;
  
  // Cupcake wrapper with pleated detail
  const wrapperGradient = ctx.createLinearGradient(cupcakeX - 15, cupcakeY, cupcakeX + 15, cupcakeY);
  wrapperGradient.addColorStop(0, '#FF1493');
  wrapperGradient.addColorStop(0.3, '#FF69B4');
  wrapperGradient.addColorStop(0.7, '#FFB6C1');
  wrapperGradient.addColorStop(1, '#C71585');
  ctx.fillStyle = wrapperGradient;
  
  // Pleated wrapper shape
  ctx.beginPath();
  ctx.moveTo(cupcakeX - 15, cupcakeY + 20);
  for(let i = 0; i < 6; i++) {
    const pleatX = cupcakeX - 15 + i * 5;
    const pleatDepth = i % 2 === 0 ? 3 : 0;
    ctx.lineTo(pleatX, cupcakeY + pleatDepth);
  }
  ctx.lineTo(cupcakeX + 15, cupcakeY + 20);
  ctx.closePath();
  ctx.fill();
  
  // Wrapper folds detail
  ctx.strokeStyle = '#C71585';
  ctx.lineWidth = 1;
  for(let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(cupcakeX - 12 + i * 6, cupcakeY);
    ctx.lineTo(cupcakeX - 12 + i * 6, cupcakeY + 18);
    ctx.stroke();
  }
  
  // Multi-layered frosting
  // Base frosting layer
  const frostingGradient = ctx.createRadialGradient(cupcakeX, cupcakeY, 0, cupcakeX, cupcakeY, 15);
  frostingGradient.addColorStop(0, '#FFFFFF');
  frostingGradient.addColorStop(0.3, '#FFB6C1');
  frostingGradient.addColorStop(0.7, '#FF69B4');
  frostingGradient.addColorStop(1, '#FF1493');
  ctx.fillStyle = frostingGradient;
  ctx.beginPath();
  ctx.arc(cupcakeX, cupcakeY, 15, 0, Math.PI * 2);
  ctx.fill();
  
  // Frosting swirls
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cupcakeX, cupcakeY, 8, 0, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cupcakeX + 5, cupcakeY - 3, 4, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();
  
  // Detailed cherry with stem
  // Cherry stem
  ctx.strokeStyle = '#228B22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cupcakeX, cupcakeY - 12);
  ctx.quadraticCurveTo(cupcakeX + 3, cupcakeY - 15, cupcakeX + 5, cupcakeY - 12);
  ctx.stroke();
  
  // Cherry with gradient
  const cherryGradient = ctx.createRadialGradient(cupcakeX, cupcakeY - 8, 0, cupcakeX, cupcakeY - 8, 6);
  cherryGradient.addColorStop(0, '#FF6B6B');
  cherryGradient.addColorStop(0.7, '#FF0000');
  cherryGradient.addColorStop(1, '#8B0000');
  ctx.fillStyle = cherryGradient;
  ctx.beginPath();
  ctx.arc(cupcakeX, cupcakeY - 8, 6, 0, Math.PI * 2);
  ctx.fill();
  
  // Cherry highlight
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(cupcakeX - 2, cupcakeY - 9, 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Endoskeleton-like mechanical eyes
  // Eye sockets
  ctx.fillStyle = '#2C2C2C';
  ctx.beginPath();
  ctx.ellipse(cupcakeX - 6, cupcakeY - 2, 4, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(cupcakeX + 6, cupcakeY - 2, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Glowing red eyes
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(cupcakeX - 6, cupcakeY - 2, 2.5, 0, Math.PI * 2);
  ctx.arc(cupcakeX + 6, cupcakeY - 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Eye glow effect
  ctx.fillStyle = 'rgba(255,0,0,0.3)';
  ctx.beginPath();
  ctx.arc(cupcakeX - 6, cupcakeY - 2, 4, 0, Math.PI * 2);
  ctx.arc(cupcakeX + 6, cupcakeY - 2, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Mechanical teeth with endoskeleton detail
  ctx.fillStyle = '#E5E5E5';
  // Top teeth row
  for(let i = 0; i < 5; i++) {
    const toothX = cupcakeX - 8 + i * 4;
    const toothHeight = 3 + Math.random() * 2;
    ctx.fillRect(toothX, cupcakeY + 2, 2.5, toothHeight);
    // Tooth detail line
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(toothX + 0.5, cupcakeY + 3, 1.5, 1);
    ctx.fillStyle = '#E5E5E5';
  }
  
  // Bottom teeth row
  for(let i = 0; i < 4; i++) {
    const toothX = cupcakeX - 6 + i * 4;
    ctx.fillRect(toothX, cupcakeY + 6, 2.5, 2.5);
  }
  
  // Jaw mechanism visible
  ctx.fillStyle = '#4A4A4A';
  ctx.fillRect(cupcakeX - 10, cupcakeY + 8, 20, 3);
  
  // Sprinkles on frosting
  const sprinkleColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
  for(let i = 0; i < 8; i++) {
    const sprinkleX = cupcakeX - 10 + Math.random() * 20;
    const sprinkleY = cupcakeY - 8 + Math.random() * 12;
    const sprinkleColor = sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)];
    ctx.fillStyle = sprinkleColor;
    ctx.save();
    ctx.translate(sprinkleX, sprinkleY);
    ctx.rotate(Math.random() * Math.PI);
    ctx.fillRect(-2, -0.5, 4, 1);
    ctx.restore();
  }
}

function draw3DFoxy(x, y, scale, state) {
  const scaledSize = 100 * scale;
  
  // Enhanced shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + scaledSize + 15, scaledSize * 0.6, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Foxy body with detailed gradient
  const bodyGradient = ctx.createLinearGradient(x - scaledSize/2, y, x + scaledSize/2, y + scaledSize);
  bodyGradient.addColorStop(0, '#FF8C00');
  bodyGradient.addColorStop(0.3, '#FF6347');
  bodyGradient.addColorStop(0.7, '#CD5C5C');
  bodyGradient.addColorStop(1, '#8B4513');
  ctx.fillStyle = bodyGradient;
  
  // Main body with fox shape (taller and thinner)
  ctx.beginPath();
  ctx.roundRect(x - scaledSize/2 + 5, y + 10, scaledSize - 10, scaledSize - 10, 12 * scale);
  ctx.fill();
  
  // Chest patch (lighter color)
  ctx.fillStyle = '#FFA07A';
  ctx.beginPath();
  ctx.ellipse(x, y + 40, 15 * scale, 20 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Head with fox features and endoskeleton mask
  const headGradient = ctx.createLinearGradient(x - 25 * scale, y - 20, x + 25 * scale, y + 20);
  headGradient.addColorStop(0, '#FF8C00');
  headGradient.addColorStop(1, '#FF6347');
  ctx.fillStyle = headGradient;
  ctx.beginPath();
  ctx.arc(x, y + 10, 22 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Endoskeleton mask seams (visible under damaged areas)
  ctx.strokeStyle = '#CD5C5C';
  ctx.lineWidth = 1;
  // Vertical seam
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x, y + 30);
  ctx.stroke();
  // Horizontal seam
  ctx.beginPath();
  ctx.moveTo(x - 18 * scale, y + 10);
  ctx.lineTo(x + 18 * scale, y + 10);
  ctx.stroke();
  
  // Jaw separation line
  ctx.strokeStyle = '#FFA07A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 15 * scale, y + 25);
  ctx.lineTo(x + 15 * scale, y + 25);
  ctx.stroke();
  
  // Fox ears (pointed)
  ctx.fillStyle = '#FF6347';
  // Left ear
  ctx.beginPath();
  ctx.moveTo(x - 18 * scale, y - 5);
  ctx.lineTo(x - 25 * scale, y - 25);
  ctx.lineTo(x - 10 * scale, y - 15);
  ctx.closePath();
  ctx.fill();
  // Right ear
  ctx.beginPath();
  ctx.moveTo(x + 18 * scale, y - 5);
  ctx.lineTo(x + 25 * scale, y - 25);
  ctx.lineTo(x + 10 * scale, y - 15);
  ctx.closePath();
  ctx.fill();
  
  // Inner ear details
  ctx.fillStyle = '#FFB6C1';
  ctx.beginPath();
  ctx.moveTo(x - 16 * scale, y - 8);
  ctx.lineTo(x - 20 * scale, y - 20);
  ctx.lineTo(x - 12 * scale, y - 12);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 16 * scale, y - 8);
  ctx.lineTo(x + 20 * scale, y - 20);
  ctx.lineTo(x + 12 * scale, y - 12);
  ctx.closePath();
  ctx.fill();
  
  // Eyepatch (over right eye)
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x + 10 * scale, y + 10, 12 * scale, 8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Eyepatch strap
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(x - 2 * scale, y + 5);
  ctx.lineTo(x + 22 * scale, y + 5);
  ctx.stroke();
  
  // Left eye (yellow and menacing)
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(x - 10 * scale, y + 10, 6 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Eye pupil
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x - 10 * scale, y + 10, 3 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Eye highlight
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(x - 9 * scale, y + 9, 2 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Snout (longer fox snout)
  ctx.fillStyle = '#FFA07A';
  ctx.beginPath();
  ctx.ellipse(x, y + 22, 6 * scale, 8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Nose
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x, y + 20, 2 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Enhanced hook hand
  const hookGradient = ctx.createLinearGradient(x + 35 * scale, y + 35, x + 45 * scale, y + 65);
  hookGradient.addColorStop(0, '#C0C0C0');
  hookGradient.addColorStop(0.5, '#A9A9A9');
  hookGradient.addColorStop(1, '#808080');
  ctx.fillStyle = hookGradient;
  
  // Hook shape
  ctx.beginPath();
  ctx.moveTo(x + 40 * scale, y + 40);
  ctx.lineTo(x + 42 * scale, y + 60);
  ctx.lineTo(x + 38 * scale, y + 65);
  ctx.lineTo(x + 35 * scale, y + 62);
  ctx.lineTo(x + 37 * scale, y + 45);
  ctx.closePath();
  ctx.fill();
  
  // Hook shine
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.moveTo(x + 38 * scale, y + 42);
  ctx.lineTo(x + 39 * scale, y + 55);
  ctx.lineTo(x + 37 * scale, y + 56);
  ctx.lineTo(x + 36 * scale, y + 45);
  ctx.closePath();
  ctx.fill();
  
  // Pirate bandana
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(x - 20 * scale, y - 5);
  ctx.lineTo(x + 20 * scale, y - 5);
  ctx.lineTo(x + 15 * scale, y + 5);
  ctx.lineTo(x - 15 * scale, y + 5);
  ctx.closePath();
  ctx.fill();
  
  // Torn pants/shorts
  ctx.fillStyle = '#4B0082';
  ctx.fillRect(x - scaledSize/2 + 8, y + 60, scaledSize - 16, 20 * scale);
  
  // Torn edges
  ctx.fillStyle = '#8B4513';
  for(let i = 0; i < 5; i++) {
    const tearX = x - scaledSize/2 + 10 + i * 15;
    const tearHeight = Math.random() * 5 + 2;
    ctx.fillRect(tearX, y + 75 + Math.random() * 5, 8 * scale, tearHeight);
  }
}

function drawOffice3D() {
  const ctx = window.gameCtx;
  // Update mouse position for smooth movement
  updateMousePosition();
  const offset = getParallaxOffset();
  
  // Save context and apply parallax transform
  ctx.save();
  ctx.translate(offset.x, offset.y);
  
  // Background with gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, 600);
  bgGradient.addColorStop(0, '#1a1a1a');
  bgGradient.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(-offset.x, -offset.y, 800, 600);
  
  // Draw 3D floor with parallax
  draw3DFloor();
  
  // Draw 3D walls with parallax
  draw3DWall(-offset.x * 0.3, 120, 180, 380, '#333', '#555');
  draw3DWall(620 - offset.x * 0.3, 120, 180, 380, '#333', '#555');
  
  // Back wall with parallax
  const backWallGradient = ctx.createLinearGradient(0, 80, 0, 120);
  backWallGradient.addColorStop(0, '#ffaa00');
  backWallGradient.addColorStop(1, '#cc8800');
  ctx.fillStyle = backWallGradient;
  ctx.fillRect(320, 80 - offset.y * 0.2, 160, 40);
  
  // Stage lights on back wall with parallax
  for(let i = 0; i < 3; i++) {
    const lightX = 340 + i * 50 - offset.x * 0.2;
    const lightY = 100 - offset.y * 0.2;
    const lightGradient = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, 15);
    lightGradient.addColorStop(0, '#ffff88');
    lightGradient.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(lightX - 15, lightY - 15, 30, 30);
  }
  
  // Draw 3D desk with parallax
  draw3DDesk();
  
  // LEFT SIDE - Window, Light, and Door
  // Draw warning window first (behind everything)
  drawLeftWarningWindow();
  
  // Draw window frame
  ctx.fillStyle = '#222';
  ctx.fillRect(38, 158, 104, 4);
  ctx.fillRect(38, 398, 104, 4);
  ctx.fillRect(38, 158, 4, 244);
  ctx.fillRect(138, 158, 4, 244);
  
  // Left Window + Light with parallax
  if (gameState.leftLight) {
    // Enhanced light effect that shines through
    const lightGrad = ctx.createRadialGradient(90 - offset.x * 0.5, 250 - offset.y * 0.5, 0, 90 - offset.x * 0.5, 250 - offset.y * 0.5, 150);
    lightGrad.addColorStop(0, 'rgba(255,255,0,0.8)');
    lightGrad.addColorStop(0.3, 'rgba(255,255,0,0.4)');
    lightGrad.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(20, 140, 140, 280);
    
    // Light rays that shine into the office
    ctx.fillStyle = 'rgba(255,255,0,0.1)';
    for(let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(90 - offset.x * 0.5, 250 - offset.y * 0.5);
      ctx.lineTo(10 + i*15, 140);
      ctx.lineTo(25 + i*15, 140);
      ctx.closePath();
      ctx.fill();
    }
    
    // Light spill on floor
    const floorLight = ctx.createRadialGradient(90 - offset.x * 0.4, 500, 0, 90 - offset.x * 0.4, 500, 80);
    floorLight.addColorStop(0, 'rgba(255,255,0,0.3)');
    floorLight.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = floorLight;
    ctx.fillRect(20, 480, 140, 60);
    
    // Light on wall
    const wallLight = ctx.createRadialGradient(90 - offset.x * 0.5, 300 - offset.y * 0.5, 0, 90 - offset.x * 0.5, 300 - offset.y * 0.5, 60);
    wallLight.addColorStop(0, 'rgba(255,255,0,0.2)');
    wallLight.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = wallLight;
    ctx.fillRect(40, 240, 100, 120);
  }
  
  // Check for Bonnie at window (regardless of light state)
  if (animatronics.bonnie.position === 4 && !gameState.leftDoor) {
      // Bonnie with 3D shadow and parallax
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(50 - offset.x * 0.3, 175 - offset.y * 0.3, 90, 200);
      
      // Draw Bonnie sprite
      drawAnimatronicSprite(
        animatronicImages.bonnie,
        45 - offset.x * 0.3,
        170 - offset.y * 0.3,
        90,
        200
      );
      
      // Warning text
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('BONNIE!', 55 - offset.x * 0.3, 260 - offset.y * 0.3);
    } else {
    // Dark window with depth
    const windowGradient = ctx.createLinearGradient(40, 160, 40, 400);
    windowGradient.addColorStop(0, 'rgba(0,20,40,0.9)');
    windowGradient.addColorStop(1, 'rgba(0,10,20,0.95)');
    ctx.fillStyle = windowGradient;
    ctx.fillRect(40, 160, 100, 240);
  }
  
  // Draw 3D door
  draw3DDoor(10, 150, 140, 300, gameState.leftDoor, 'left');
  
  // RIGHT SIDE - Window, Light, and Door
  // Draw warning window first
  drawRightWarningWindow();
  
  // Draw window frame
  ctx.fillStyle = '#222';
  ctx.fillRect(648, 158, 134, 4);
  ctx.fillRect(648, 398, 134, 4);
  ctx.fillRect(648, 158, 4, 244);
  ctx.fillRect(778, 158, 4, 244);
  
  // Right Window + Light with parallax
  if (gameState.rightLight) {
    // Enhanced light effect that shines through
    const lightGrad = ctx.createRadialGradient(710 - offset.x * 0.5, 250 - offset.y * 0.5, 0, 710 - offset.x * 0.5, 250 - offset.y * 0.5, 150);
    lightGrad.addColorStop(0, 'rgba(255,255,0,0.8)');
    lightGrad.addColorStop(0.3, 'rgba(255,255,0,0.4)');
    lightGrad.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(640, 140, 140, 280);
    
    // Light rays that shine into the office
    ctx.fillStyle = 'rgba(255,255,0,0.1)';
    for(let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(710 - offset.x * 0.5, 250 - offset.y * 0.5);
      ctx.lineTo(630 + i*15, 140);
      ctx.lineTo(645 + i*15, 140);
      ctx.closePath();
      ctx.fill();
    }
    
    // Light spill on floor
    const floorLight = ctx.createRadialGradient(710 - offset.x * 0.4, 500, 0, 710 - offset.x * 0.4, 500, 80);
    floorLight.addColorStop(0, 'rgba(255,255,0,0.3)');
    floorLight.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = floorLight;
    ctx.fillRect(640, 480, 140, 60);
    
    // Light on wall
    const wallLight = ctx.createRadialGradient(710 - offset.x * 0.5, 300 - offset.y * 0.5, 0, 710 - offset.x * 0.5, 300 - offset.y * 0.5, 60);
    wallLight.addColorStop(0, 'rgba(255,255,0,0.2)');
    wallLight.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = wallLight;
    ctx.fillRect(660, 240, 100, 120);
    
    if (animatronics.chica.position === 4 && !gameState.rightDoor) {
      // Chica with 3D shadow and parallax
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(665 - offset.x * 0.3, 175 - offset.y * 0.3, 110, 220);
      
      // Draw Chica sprite
      drawAnimatronicSprite(
        animatronicImages.chica,
        660 - offset.x * 0.3,
        170 - offset.y * 0.3,
        110,
        220
      );
    }
  } else {
    // Dark window with depth
    const windowGradient = ctx.createLinearGradient(650, 160, 650, 400);
    windowGradient.addColorStop(0, 'rgba(20,20,40,0.9)');
    windowGradient.addColorStop(1, 'rgba(10,10,30,0.95)');
    ctx.fillStyle = windowGradient;
    ctx.fillRect(650, 160, 130, 240);
  }
  
  // Draw 3D door
  draw3DDoor(650, 150, 140, 300, gameState.rightDoor, 'right');
  
  // Add ambient lighting
  const ambientGradient = ctx.createRadialGradient(400 - offset.x * 0.1, 300 - offset.y * 0.1, 0, 400 - offset.x * 0.1, 300 - offset.y * 0.1, 300);
  ambientGradient.addColorStop(0, 'rgba(255,255,255,0.02)');
  ambientGradient.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = ambientGradient;
  ctx.fillRect(-offset.x, -offset.y, 800, 600);
  
  // Restore context
  ctx.restore();
}

// Warning window functions
function drawLeftWarningWindow() {
  // Show warning when Bonnie is close (position 3 or 4)
  if (animatronics.bonnie.position >= 3) {
    const warningLevel = animatronics.bonnie.position === 3 ? 0.3 : 0.6;
    
    // Warning glow
    const warningGlow = ctx.createRadialGradient(90, 250, 0, 90, 250, 100);
    warningGlow.addColorStop(0, `rgba(255,0,0,${warningLevel})`);
    warningGlow.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = warningGlow;
    ctx.fillRect(20, 160, 140, 260);
    
    // Warning indicator
    ctx.fillStyle = `rgba(255,0,0,${warningLevel})`;
    ctx.fillRect(70, 180, 40, 8);
    ctx.fillRect(85, 170, 10, 28);
    
    // Warning text
    if (animatronics.bonnie.position === 4) {
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('!', 88, 188);
    }
  }
}

function drawRightWarningWindow() {
  // Show warning when Chica is close (position 3 or 4)
  if (animatronics.chica.position >= 3) {
    const warningLevel = animatronics.chica.position === 3 ? 0.3 : 0.6;
    
    // Warning glow
    const warningGlow = ctx.createRadialGradient(710, 250, 0, 710, 250, 100);
    warningGlow.addColorStop(0, `rgba(255,0,0,${warningLevel})`);
    warningGlow.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = warningGlow;
    ctx.fillRect(640, 160, 140, 260);
    
    // Warning indicator
    ctx.fillStyle = `rgba(255,0,0,${warningLevel})`;
    ctx.fillRect(690, 180, 40, 8);
    ctx.fillRect(705, 170, 10, 28);
    
    // Warning text
    if (animatronics.chica.position === 4) {
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('!', 708, 188);
    }
  }
}

function updateDoorAnimations() {
  // Update left door animation
  const leftAnim = doorAnimation.leftDoor;
  if (leftAnim.animating) {
    if (leftAnim.target === 1) {
      // Closing - slam from above
      leftAnim.position = Math.min(1, leftAnim.position + leftAnim.speed);
      if (leftAnim.position >= 1) {
        leftAnim.position = 1;
        leftAnim.animating = false;
      }
    } else {
      // Opening - reverse animation
      leftAnim.position = Math.max(0, leftAnim.position - leftAnim.speed * 0.5);
      if (leftAnim.position <= 0) {
        leftAnim.position = 0;
        leftAnim.animating = false;
      }
    }
  }
  
  // Update right door animation
  const rightAnim = doorAnimation.rightDoor;
  if (rightAnim.animating) {
    if (rightAnim.target === 1) {
      // Closing - slam from above
      rightAnim.position = Math.min(1, rightAnim.position + rightAnim.speed);
      if (rightAnim.position >= 1) {
        rightAnim.position = 1;
        rightAnim.animating = false;
      }
    } else {
      // Opening - reverse animation
      rightAnim.position = Math.max(0, rightAnim.position - rightAnim.speed * 0.5);
      if (rightAnim.position <= 0) {
        rightAnim.position = 0;
        rightAnim.animating = false;
      }
    }
  }
}

function updateGame(dt) {
  if (gameState.gameOver) return;
  
  const realElapsedSeconds = (Date.now() - gameStartTime) / 1000;
  gameState.time = Math.min(realElapsedSeconds, 360);
  
  const gameHours = Math.floor(gameState.time / 60) + 12;
  const displayHour = gameHours % 12 || 12;
  const displayMinute = Math.floor(gameState.time % 60);
  const timeElement = safeGetElement('time');
  if (timeElement) {
    timeElement.textContent = `${displayHour}:${displayMinute.toString().padStart(2, '0')} AM`;
  }
  
  if (gameState.time >= 360) {
    alert(`Survived Night ${gameState.night}!`);
    gameState.night++;
    gameStartTime = Date.now();
    resetNight();
    const nightElement = safeGetElement('night');
    if (nightElement) {
      nightElement.textContent = `Night ${gameState.night}`;
    }
    return;
  }
  
  let usageBars = 1;
  if (gameState.leftLight) usageBars += 1;
  if (gameState.rightLight) usageBars += 1;
  if (gameState.leftDoor) usageBars += 2;
  if (gameState.rightDoor) usageBars += 2;
  if (gameState.inCamera) usageBars += 1;
  
  const drainPerSecond = usageBars * 0.001;
  const drainThisFrame = drainPerSecond * (dt / 1000) * 100;
  
  gameState.power = Math.max(0, gameState.power - drainThisFrame);
  const powerElement = safeGetElement('powerPercent');
  if (powerElement) {
    powerElement.textContent = Math.floor(gameState.power);
  }
  
  if (gameState.power <= 0 && !gameState.gameOver) {
    jumpscare('POWER OUT!');
  }
  
  updateDoorAnimations();
  updateAnimatronics();
}

function updateAnimatronics() {
  aiProgress += 1;
  if (aiProgress % 1000 !== 0) return;
  
  const aiChance = [0.2, 0.4, 0.6, 0.8, 1.0][Math.min(gameState.night-1, 4)];
  
  if (Math.random() < aiChance && animatronics.bonnie.position < 4) animatronics.bonnie.position++;
  if (Math.random() < aiChance && animatronics.chica.position < 4) animatronics.chica.position++;
  if (!gameState.inCamera && Math.random() < 0.02 && animatronics.foxy.position < 2) animatronics.foxy.position++;
}

function jumpscare(name) {
  const ctx = window.gameCtx;
  ctx.fillStyle = '#f00';
  ctx.fillRect(0, 0, 800, 600);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 60px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(name, 400, 300);
  ctx.textAlign = 'left';
  gameState.gameOver = true;
  const gameOverElement = safeGetElement('gameOver');
  if (gameOverElement) {
    gameOverElement.style.display = 'block';
  }
}

function resetNight() {
  animatronics.bonnie.position = 0;
  animatronics.chica.position = 0;
  animatronics.foxy.position = 0;
  gameState.power = 100;
}

// All your existing button handlers with safe element access
const leftLightBtn = safeGetElement('leftLight');
const rightLightBtn = safeGetElement('rightLight');
if (leftLightBtn) leftLightBtn.onclick = () => gameState.leftLight = !gameState.leftLight;
if (rightLightBtn) rightLightBtn.onclick = () => gameState.rightLight = !gameState.rightLight;
const leftDoorBtn = safeGetElement('leftDoor');
const rightDoorBtn = safeGetElement('rightDoor');
const cameraBtn = safeGetElement('cameraBtn');
const cameraControls = safeGetElement('cameraControls');

if (leftDoorBtn) leftDoorBtn.onclick = () => {
  gameState.leftDoor = !gameState.leftDoor;
  const leftAnim = doorAnimation.leftDoor;
  leftAnim.target = gameState.leftDoor ? 1 : 0;
  leftAnim.animating = true;
  if (gameState.leftDoor && leftAnim.position === 0) {
    leftAnim.position = 0; // Start from top for slam effect
  }
};

if (rightDoorBtn) rightDoorBtn.onclick = () => {
  gameState.rightDoor = !gameState.rightDoor;
  const rightAnim = doorAnimation.rightDoor;
  rightAnim.target = gameState.rightDoor ? 1 : 0;
  rightAnim.animating = true;
  if (gameState.rightDoor && rightAnim.position === 0) {
    rightAnim.position = 0; // Start from top for slam effect
  }
};

if (cameraBtn) cameraBtn.onclick = () => {
  gameState.inCamera = !gameState.inCamera;
  cameraBtn.classList.toggle('active', gameState.inCamera);
  if (cameraControls) cameraControls.style.display = gameState.inCamera ? 'flex' : 'none';
  if (gameState.inCamera && !gameState.currentCamera) {
    gameState.currentCamera = 1; // Only set camera when turning on
  }
  updateCameraButtons();
};


// Camera button event listeners
document.querySelectorAll('.camBtn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const camNum = parseInt(e.target.dataset.cam);
    gameState.currentCamera = camNum;
    updateCameraButtons();
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && gameState.inCamera) {
    gameState.inCamera = false;
    if (cameraBtn) cameraBtn.classList.remove('active');
    if (cameraControls) cameraControls.style.display = 'none';
  } else if (!gameState.inCamera || gameState.gameOver) return;
  const cam = parseInt(e.key);
  if (cam >= 1 && cam <= 9) {
    gameState.currentCamera = cam;
    updateCameraButtons();
  }
});

function updateCameraButtons() {
  document.querySelectorAll('.camBtn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.cam) === gameState.currentCamera);
  });
}

function restartGame() {
  Object.assign(gameState, {power:100, time:0, night:1, inCamera:false, leftLight:false, rightLight:false, leftDoor:false, rightDoor:false, gameOver:false, currentCamera:1});
  gameStartTime = Date.now();
  resetNight();
  const gameOverElement = safeGetElement('gameOver');
  if (gameOverElement) gameOverElement.style.display = 'none';
  if (cameraBtn) cameraBtn.classList.remove('active');
  if (cameraControls) cameraControls.style.display = 'none';
  const nightElement = safeGetElement('night');
  if (nightElement) nightElement.textContent = `Night ${gameState.night}`;
  updateCameraButtons();
}

// Camera-specific drawing functions with darker lighting
function draw3DTableCamera(x, y, w, h, scale) {
  // Table with camera darkness
  ctx.fillStyle = '#3A2418';
  ctx.fillRect(x, y, w * scale, h * scale);
  ctx.fillStyle = '#2A1810';
  ctx.fillRect(x + 5, y + 5, (w - 10) * scale, (h - 10) * scale);
  
  // Table shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - 5, y + h * scale, w * scale + 10, 10);
}

function draw3DPosterCamera(x, y, w, h, color) {
  // Poster with camera lighting
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color + '80'; // Add transparency
  ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
}

function draw3DFreddyCamera(x, y, scale) {
  // Freddy with camera lighting
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x - 10, y - 10, 120 * scale, 180 * scale);
  
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x, y, 100 * scale, 160 * scale);
  
  // Features with camera darkness
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 20, y + 30, 8 * scale, 8 * scale);
  ctx.fillRect(x + 72, y + 30, 8 * scale, 8 * scale);
  
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 25, y + 50, 50 * scale, 8 * scale);
  
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 30, y + 65, 40 * scale, 20 * scale);
  
  // Hat
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 10, y - 20, 80 * scale, 25 * scale);
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x + 15, y - 15, 70 * scale, 15 * scale);
}

function draw3DChicaCamera(x, y, scale) {
  // Chica with camera lighting
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x - 10, y - 10, 120 * scale, 200 * scale);
  
  ctx.fillStyle = '#aa0';
  ctx.fillRect(x, y, 100 * scale, 180 * scale);
  
  // Chica's features with camera darkness
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 20, y + 30, 8 * scale, 8 * scale);
  ctx.fillRect(x + 72, y + 30, 8 * scale, 8 * scale);
  
  ctx.fillStyle = '#FFA500';
  ctx.fillRect(x + 25, y + 50, 50 * scale, 3 * scale);
  
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 22, y + 65, 56 * scale, 20 * scale);
  
  // Chica's cupcake
  ctx.fillStyle = '#FF69B4';
  ctx.fillRect(x + 80, y + 10, 20 * scale, 20 * scale);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 84, y + 14, 12 * scale, 12 * scale);
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(x + 88, y + 6, 4 * scale, 6 * scale);
  ctx.fillStyle = '#FFD700';
  for(let i = 0; i < 2; i++) {
    ctx.fillRect(x + 86 + i*4, y + 16, 1 * scale, 1 * scale);
  }
}

function drawDiningArea3D() {
  ctx.save();
  
  // Camera darkness filter
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, 800, 600);
  
  // 3D dining floor with camera lighting and CHECKERED PATTERN
  const floorGradient = ctx.createLinearGradient(0, 400, 0, 600);
  floorGradient.addColorStop(0, '#3A2418');
  floorGradient.addColorStop(1, '#1A0C08');
  ctx.fillStyle = floorGradient;
  ctx.fillRect(0, 400, 800, 200);
  
  // CHECKERED FLOOR PATTERN
  const tileSize = 40;
  for(let row = 0; row < 5; row++) {
    for(let col = 0; col < 20; col++) {
      const x = col * tileSize;
      const y = 400 + row * tileSize;
      
      if((row + col) % 2 === 0) {
        ctx.fillStyle = '#4A3428';
      } else {
        ctx.fillStyle = '#2A1810';
      }
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }
  
  // 3D back wall with dark lighting
  const wallGradient = ctx.createLinearGradient(0, 100, 0, 400);
  wallGradient.addColorStop(0, '#353535');
  wallGradient.addColorStop(1, '#151515');
  ctx.fillStyle = wallGradient;
  ctx.fillRect(0, 100, 800, 300);
  
  // Dim ceiling lights
  for(let i = 0; i < 4; i++) {
    const lightX = 150 + i * 150;
    const lightGradient = ctx.createRadialGradient(lightX, 150, 0, lightX, 150, 50);
    lightGradient.addColorStop(0, 'rgba(255,255,200,0.15)');
    lightGradient.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(lightX - 50, 100, 100, 100);
  }
  
  // UNIQUE DINING AREA PROPS
  // Arcade machines along the wall
  ctx.fillStyle = '#4169E1';
  ctx.fillRect(50, 200, 60, 80);
  ctx.fillStyle = '#000';
  ctx.fillRect(55, 210, 50, 60);
  ctx.fillStyle = '#0F0';
  ctx.font = '8px monospace';
  ctx.fillText('INSERT', 65, 240);
  ctx.fillText('COIN', 70, 250);
  
  ctx.fillStyle = '#FF4500';
  ctx.fillRect(690, 200, 60, 80);
  ctx.fillStyle = '#000';
  ctx.fillRect(695, 210, 50, 60);
  ctx.fillStyle = '#F00';
  ctx.fillText('GAME', 710, 240);
  ctx.fillText('OVER', 710, 250);
  
  // Party hats on tables
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(180, 340);
  ctx.lineTo(160, 320);
  ctx.lineTo(200, 320);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FF69B4';
  ctx.fillRect(175, 315, 10, 5);
  
  ctx.fillStyle = '#00CED1';
  ctx.beginPath();
  ctx.moveTo(580, 340);
  ctx.lineTo(560, 320);
  ctx.lineTo(600, 320);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FF1493';
  ctx.fillRect(575, 315, 10, 5);
  
  // Juice dispensers
  ctx.fillStyle = '#FFA500';
  ctx.fillRect(350, 150, 30, 50);
  ctx.fillStyle = '#FF6347';
  ctx.fillRect(390, 150, 30, 50);
  ctx.fillStyle = '#32CD32';
  ctx.fillRect(430, 150, 30, 50);
  ctx.fillStyle = '#FFF';
  ctx.font = '10px sans-serif';
  ctx.fillText('ORANGE', 355, 180);
  ctx.fillText('CHERRY', 395, 180);
  ctx.fillText('LIME', 440, 180);
  
  // Trash cans with overflow
  ctx.fillStyle = '#666';
  ctx.fillRect(100, 380, 30, 40);
  ctx.fillStyle = '#FFF';
  ctx.fillRect(105, 375, 20, 8);
  // Overflow trash
  ctx.fillStyle = '#888';
  ctx.fillRect(95, 370, 40, 5);
  ctx.fillRect(100, 365, 30, 5);
  
  ctx.fillStyle = '#666';
  ctx.fillRect(670, 380, 30, 40);
  ctx.fillStyle = '#FFF';
  ctx.fillRect(675, 375, 20, 8);
  
  // Kids' drawings on wall
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(250, 180, 20, 0, Math.PI * 2);
  ctx.stroke(); // Red circle face
  ctx.fillStyle = '#000';
  ctx.fillRect(240, 175, 5, 5);
  ctx.fillRect(255, 175, 5, 5);
  ctx.fillRect(248, 185, 4, 4);
  
  ctx.strokeStyle = '#0000FF';
  ctx.beginPath();
  ctx.moveTo(500, 160);
  ctx.lineTo(520, 180);
  ctx.lineTo(480, 180);
  ctx.closePath();
  ctx.stroke(); // Blue triangle house
  
  // 3D party tables with camera darkness
  draw3DTableCamera(150, 350, 80, 50, 0.9);
  draw3DTableCamera(350, 330, 85, 55, 0.95);
  draw3DTableCamera(550, 350, 80, 50, 0.9);
  
  // 3D posters with camera lighting
  draw3DPosterCamera(100, 150, 60, 80, '#FFD700');
  draw3DPosterCamera(300, 140, 60, 80, '#FF69B4');
  draw3DPosterCamera(500, 150, 60, 80, '#0f0');
  
  if (animatronics.chica.position === 1) {
    draw3DChicaCamera(400, 250, 1.0);
  }
  
  ctx.restore();
}

function drawWestHallCorner3D() {
  ctx.save();
  
  // Heavy camera darkness for corner view
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, 800, 600);
  
  // 3D corner with very dark lighting
  const cornerGradient = ctx.createRadialGradient(500, 300, 0, 500, 300, 200);
  cornerGradient.addColorStop(0, '#353535');
  cornerGradient.addColorStop(1, '#151515');
  ctx.fillStyle = cornerGradient;
  ctx.fillRect(300, 150, 400, 400);
  
  // 3D corner walls with shadows
  ctx.fillStyle = '#252525';
  ctx.fillRect(300, 150, 200, 400);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(500, 150, 200, 400);
  
  // Very dim corner light
  const cornerLight = ctx.createRadialGradient(500, 250, 0, 500, 250, 80);
  cornerLight.addColorStop(0, 'rgba(255,255,200,0.1)');
  cornerLight.addColorStop(1, 'rgba(255,255,200,0)');
  ctx.fillStyle = cornerLight;
  ctx.fillRect(420, 170, 160, 160);
  
  if (animatronics.bonnie.position === 3) {
    // Bonnie in West Hall Corner - using PNG sprite
    drawAnimatronicSprite(
      animatronicImages.bonnie,
      550,
      300,
      80 * 1.2,
      120 * 1.2
    );
  }
  
  ctx.restore();
}

function drawPirateCove3D() {
  ctx.save();
  
  // Camera darkness filter
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, 800, 600);
  
  // 3D Pirate Cove environment
  const coveGradient = ctx.createLinearGradient(200, 200, 600, 400);
  coveGradient.addColorStop(0, '#5B3513');
  coveGradient.addColorStop(1, '#352311');
  ctx.fillStyle = coveGradient;
  ctx.fillRect(200, 200, 400, 300);
  
  // 3D curtain
  const curtainGradient = ctx.createLinearGradient(280, 180, 280, 480);
  curtainGradient.addColorStop(0, '#600020');
  curtainGradient.addColorStop(1, '#300010');
  ctx.fillStyle = curtainGradient;
  ctx.fillRect(280, 180, 240, 300);
  
  // 3D curtain folds
  ctx.fillStyle = '#400018';
  for(let i = 0; i < 6; i++) {
    const x = 280 + i * 40;
    ctx.beginPath();
    ctx.moveTo(x, 180);
    ctx.lineTo(x - 15, 480);
    ctx.lineTo(x + 25, 480);
    ctx.lineTo(x + 20, 180);
    ctx.closePath();
    ctx.fill();
  }
  
  // UNIQUE PIRATE COVE PROPS
  // Treasure chest
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(150, 400, 60, 40);
  ctx.fillStyle = '#654321';
  ctx.fillRect(155, 405, 50, 30);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(170, 415, 20, 10);
  // Gold coins
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(165, 430, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(175, 428, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(185, 432, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Pirate ship wheel on wall
  ctx.fillStyle = '#654321';
  ctx.beginPath();
  ctx.arc(650, 250, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(640, 240, 20, 20);
  // Wheel spokes
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  for(let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    ctx.beginPath();
    ctx.moveTo(650, 250);
    ctx.lineTo(650 + Math.cos(angle) * 25, 250 + Math.sin(angle) * 25);
    ctx.stroke();
  }
  
  // Jolly Roger flag
  ctx.fillStyle = '#000';
  ctx.fillRect(550, 120, 60, 40);
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 20px serif';
  ctx.fillText('☠', 565, 145);
  
  // Fishing net
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2;
  for(let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(100 + i * 20, 350);
    ctx.lineTo(100 + i * 20 + 10, 360);
    ctx.lineTo(100 + i * 20 + 20, 350);
    ctx.stroke();
  }
  
  // Barrel
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(100, 420, 40, 50);
  ctx.fillStyle = '#654321';
  ctx.fillRect(105, 425, 30, 40);
  // Barrel bands
  ctx.fillStyle = '#444';
  ctx.fillRect(95, 430, 50, 5);
  ctx.fillRect(95, 450, 50, 5);
  
  // Anchor
  ctx.fillStyle = '#666';
  ctx.fillRect(700, 400, 30, 40);
  ctx.fillStyle = '#444';
  ctx.fillRect(710, 390, 10, 15);
  ctx.beginPath();
  ctx.moveTo(715, 390);
  ctx.lineTo(715, 380);
  ctx.lineTo(705, 385);
  ctx.closePath();
  ctx.fill();
  
  // Seagull silhouette
  ctx.fillStyle = '#000';
  ctx.font = '20px serif';
  ctx.fillText('🦅', 300, 150);
  
  if (animatronics.foxy.position === 0) {
    // Foxy peeking out
    drawAnimatronicSprite(
      animatronicImages.foxy,
      380,
      300,
      60,
      80
    );
  } else if (animatronics.foxy.position === 2) {
    // Open curtain - Foxy is gone!
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(280, 250, 240, 230);
    ctx.fillStyle = 'rgba(255,0,0,0.5)';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('FOXY IS GONE!', 320, 350);
  }
  
  ctx.restore();
}

// Add placeholder functions for other cameras
function drawWestHall3D() {
  ctx.save();
  
  // Camera darkness filter
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, 800, 600);
  
  // 3D hallway with perspective
  const hallGradient = ctx.createLinearGradient(0, 150, 800, 450);
  hallGradient.addColorStop(0, '#444');
  hallGradient.addColorStop(1, '#222');
  ctx.fillStyle = hallGradient;
  ctx.fillRect(0, 150, 800, 350);
  
  // 3D floor with perspective
  const floorGradient = ctx.createLinearGradient(0, 500, 0, 600);
  floorGradient.addColorStop(0, '#333');
  floorGradient.addColorStop(1, '#111');
  ctx.fillStyle = floorGradient;
  ctx.fillRect(0, 500, 800, 100);
  
  // 3D ceiling lights
  for(let i = 0; i < 4; i++) {
    const lightX = 150 + i * 150;
    const lightGradient = ctx.createRadialGradient(lightX, 180, 0, lightX, 180, 30);
    lightGradient.addColorStop(0, 'rgba(255,255,200,0.3)');
    lightGradient.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(lightX - 30, 160, 60, 40);
  }
  
  if (animatronics.bonnie.position === 2) {
    // Bonnie in West Hall - using PNG sprite
    drawAnimatronicSprite(
      animatronicImages.bonnie,
      300,
      280,
      80 * 0.8,
      120 * 0.8
    );
  }
  
  ctx.restore();
}

function drawSupplyCloset3D() {
  ctx.save();
  
  // Camera darkness filter
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, 800, 600);
  
  // 3D supply closet with shelves
  const closetGradient = ctx.createLinearGradient(100, 100, 700, 500);
  closetGradient.addColorStop(0, '#555');
  closetGradient.addColorStop(1, '#333');
  ctx.fillStyle = closetGradient;
  ctx.fillRect(100, 100, 600, 400);
  
  // Shelves
  ctx.fillStyle = '#444';
  ctx.fillRect(100, 150, 600, 10);
  ctx.fillRect(100, 250, 600, 10);
  ctx.fillRect(100, 350, 600, 10);
  ctx.fillRect(100, 450, 600, 10);
  
  // Items on shelves
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(150, 120, 40, 30);
  ctx.fillRect(250, 220, 35, 30);
  ctx.fillStyle = '#666';
  ctx.fillRect(350, 320, 45, 30);
  ctx.fillStyle = '#FFA500';
  ctx.fillRect(450, 420, 30, 30);
  
  // Single light bulb
  const lightGradient = ctx.createRadialGradient(400, 200, 0, 400, 200, 60);
  lightGradient.addColorStop(0, 'rgba(255,255,200,0.2)');
  lightGradient.addColorStop(1, 'rgba(255,255,200,0)');
  ctx.fillStyle = lightGradient;
  ctx.fillRect(340, 140, 120, 120);
  
  ctx.restore();
}

function drawEastHall3D() {
  ctx.save();
  
  // Camera darkness filter
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, 800, 600);
  
  // 3D East Hall with perspective (reverse of West Hall)
  const hallGradient = ctx.createLinearGradient(800, 150, 0, 450);
  hallGradient.addColorStop(0, '#444');
  hallGradient.addColorStop(1, '#222');
  ctx.fillStyle = hallGradient;
  ctx.fillRect(0, 150, 800, 350);
  
  // 3D floor with perspective
  const floorGradient = ctx.createLinearGradient(800, 500, 0, 600);
  floorGradient.addColorStop(0, '#333');
  floorGradient.addColorStop(1, '#111');
  ctx.fillStyle = floorGradient;
  ctx.fillRect(0, 500, 800, 100);
  
  // 3D ceiling lights
  for(let i = 0; i < 4; i++) {
    const lightX = 150 + i * 150;
    const lightGradient = ctx.createRadialGradient(lightX, 180, 0, lightX, 180, 30);
    lightGradient.addColorStop(0, 'rgba(255,255,200,0.3)');
    lightGradient.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(lightX - 30, 160, 60, 40);
  }
  
  // UNIQUE EAST HALL PROPS
  // Birthday party decorations
  // Streamers
  ctx.strokeStyle = '#FF69B4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(100, 160);
  ctx.quadraticCurveTo(200, 140, 300, 160);
  ctx.stroke();
  ctx.strokeStyle = '#00CED1';
  ctx.beginPath();
  ctx.moveTo(500, 160);
  ctx.quadraticCurveTo(600, 140, 700, 160);
  ctx.stroke();
  
  // "PARTY THIS WAY" sign
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(350, 250, 100, 40);
  ctx.fillStyle = '#FF0000';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('PARTY', 370, 268);
  ctx.fillText('THIS WAY', 365, 282);
  
  // Balloon bouquets
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(150, 300, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0000FF';
  ctx.beginPath();
  ctx.arc(170, 295, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFF00';
  ctx.beginPath();
  ctx.arc(160, 285, 10, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#FF69B4';
  ctx.beginPath();
  ctx.arc(650, 300, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#00FF00';
  ctx.beginPath();
  ctx.arc(670, 295, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFA500';
  ctx.beginPath();
  ctx.arc(660, 285, 10, 0, Math.PI * 2);
  ctx.fill();
  
  // Ice cream machine
  ctx.fillStyle = '#FFF';
  ctx.fillRect(50, 350, 50, 70);
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(55, 355, 40, 30);
  ctx.fillStyle = '#FF69B4';
  ctx.fillRect(60, 360, 30, 20);
  ctx.fillStyle = '#32CD32';
  ctx.fillRect(65, 365, 20, 15);
  ctx.fillStyle = '#000';
  ctx.font = '8px sans-serif';
  ctx.fillText('ICE CREAM', 60, 410);
  
  // Party favor table
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(700, 380, 60, 40);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(705, 375, 50, 8);
  // Party hats
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.moveTo(710, 370);
  ctx.lineTo(705, 360);
  ctx.lineTo(715, 360);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0000FF';
  ctx.beginPath();
  ctx.moveTo(730, 370);
  ctx.lineTo(725, 360);
  ctx.lineTo(735, 360);
  ctx.closePath();
  ctx.fill();
  
  // Confetti on floor
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(200, 480, 5, 5);
  ctx.fillRect(350, 490, 5, 5);
  ctx.fillRect(500, 485, 5, 5);
  ctx.fillStyle = '#FF69B4';
  ctx.fillRect(250, 485, 5, 5);
  ctx.fillRect(400, 480, 5, 5);
  ctx.fillRect(550, 490, 5, 5);
  ctx.fillStyle = '#00CED1';
  ctx.fillRect(300, 490, 5, 5);
  ctx.fillRect(450, 485, 5, 5);
  ctx.fillRect(600, 480, 5, 5);
  
  if (animatronics.chica.position === 2) {
    draw3DChicaCamera(400, 280, 0.9);
  }
  
  ctx.restore();
}

function drawEastHallCorner3D() {
  ctx.save();
  
  // Heavy camera darkness for corner view
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, 800, 600);
  
  // 3D corner with very dark lighting (mirror of West Hall Corner)
  const cornerGradient = ctx.createRadialGradient(300, 300, 0, 300, 300, 200);
  cornerGradient.addColorStop(0, '#353535');
  cornerGradient.addColorStop(1, '#151515');
  ctx.fillStyle = cornerGradient;
  ctx.fillRect(100, 150, 400, 400);
  
  // 3D corner walls with shadows
  ctx.fillStyle = '#252525';
  ctx.fillRect(100, 150, 200, 400);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(300, 150, 200, 400);
  
  // UNIQUE EAST HALL CORNER PROPS
  // Vending machine
  ctx.fillStyle = '#4169E1';
  ctx.fillRect(120, 200, 60, 80);
  ctx.fillStyle = '#000';
  ctx.fillRect(125, 210, 50, 60);
  // Vending items
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(130, 220, 15, 10);
  ctx.fillStyle = '#0000FF';
  ctx.fillRect(150, 220, 15, 10);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(130, 235, 15, 10);
  ctx.fillStyle = '#FFFF00';
  ctx.fillRect(150, 235, 15, 10);
  ctx.fillStyle = '#FFF';
  ctx.font = '8px sans-serif';
  ctx.fillText('$1.00', 135, 255);
  
  // Lost and found board
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(420, 180, 80, 60);
  ctx.fillStyle = '#FFF';
  ctx.fillRect(425, 185, 70, 50);
  // Notes on board
  ctx.fillStyle = '#000';
  ctx.font = '6px sans-serif';
  ctx.fillText('LOST: Teddy Bear', 430, 195);
  ctx.fillText('FOUND: Red Hat', 430, 205);
  ctx.fillText('LOST: Toy Car', 430, 215);
  ctx.fillText('FOUND: Blue Cup', 430, 225);
  
  // Potted plant
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(200, 380, 20, 30);
  ctx.fillStyle = '#228B22';
  ctx.beginPath();
  ctx.arc(210, 370, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#32CD32';
  ctx.beginPath();
  ctx.arc(210, 365, 20, 0, Math.PI * 2);
  ctx.fill();
  
  // Kids' drawing on floor
  ctx.strokeStyle = '#FF69B4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(350, 450);
  ctx.lineTo(380, 470);
  ctx.lineTo(320, 470);
  ctx.closePath();
  ctx.stroke(); // Pink crayon star
  
  // Janitorial supplies
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(450, 400, 15, 40); // Mop handle
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(445, 435, 25, 10); // Mop head
  ctx.fillStyle = '#FFF';
  ctx.fillRect(480, 420, 20, 20); // Cleaning bucket
  
  // Very dim corner light
  const cornerLight = ctx.createRadialGradient(300, 250, 0, 300, 250, 80);
  cornerLight.addColorStop(0, 'rgba(255,255,200,0.1)');
  cornerLight.addColorStop(1, 'rgba(255,255,200,0)');
  ctx.fillStyle = cornerLight;
  ctx.fillRect(220, 170, 160, 160);
  
  if (animatronics.chica.position === 3) {
    draw3DChicaCamera(350, 300, 1.2);
  }
  
  ctx.restore();
}

function drawBackstage3D() {
  ctx.save();
  
  // Heavy camera darkness for backstage
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, 800, 600);
  
  // 3D backstage area
  const backstageGradient = ctx.createLinearGradient(100, 100, 700, 500);
  backstageGradient.addColorStop(0, '#4A4A4A');
  backstageGradient.addColorStop(1, '#2A2A2A');
  ctx.fillStyle = backstageGradient;
  ctx.fillRect(100, 100, 600, 400);
  
  // UNIQUE BACKSTAGE PROPS
  // Costume rack with colorful animatronic parts
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(150, 150, 80, 100);
  // Hanging costumes
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(170, 120, 40, 60); // Freddy spare head
  ctx.fillStyle = '#4B0082';
  ctx.fillRect(160, 130, 35, 50); // Bonnie spare head
  ctx.fillStyle = '#FF69B4';
  ctx.fillRect(185, 135, 30, 45); // Chica spare head
  
  // Tool wall
  ctx.fillStyle = '#666';
  ctx.fillRect(600, 120, 80, 120);
  // Tools
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(610, 130, 30, 8); // Wrench
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(645, 130, 25, 6); // Screwdriver
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(615, 145, 20, 5); // Pliers
  ctx.fillStyle = '#0000FF';
  ctx.fillRect(640, 145, 25, 5); // Wire cutters
  
  // Paint cans
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(250, 200, 25, 30);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(280, 200, 25, 30);
  ctx.fillStyle = '#0000FF';
  ctx.fillRect(310, 200, 25, 30);
  ctx.fillStyle = '#FFFF00';
  ctx.fillRect(340, 200, 25, 30);
  ctx.fillStyle = '#000';
  ctx.font = '6px sans-serif';
  ctx.fillText('RED', 255, 215);
  ctx.fillText('GREEN', 280, 215);
  ctx.fillText('BLUE', 310, 215);
  ctx.fillText('YELLOW', 340, 215);
  
  // Spare parts table
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(400, 250, 100, 60);
  // Electronic components
  ctx.fillStyle = '#32CD32';
  ctx.fillRect(410, 240, 15, 10); // Circuit board
  ctx.fillStyle = '#FF69B4';
  ctx.fillRect(430, 245, 20, 5); // Wires
  ctx.fillStyle = '#00CED1';
  ctx.fillRect(455, 242, 25, 8); // Motor
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(490, 248, 8, 12); // Spring
  
  // Endoskeleton on workbench
  ctx.fillStyle = '#FFF';
  ctx.fillRect(200, 320, 60, 80);
  ctx.fillStyle = '#666';
  ctx.fillRect(210, 330, 40, 60);
  // Endoskeleton features
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(220, 340, 8, 8); // Eye
  ctx.fillRect(232, 340, 8, 8); // Eye
  ctx.fillStyle = '#000';
  ctx.fillRect(225, 355, 10, 3); // Mouth
  
  // Musical instrument storage
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(550, 350, 40, 80); // Guitar case
  ctx.fillStyle = '#654321';
  ctx.fillRect(555, 355, 30, 70);
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(565, 380, 10, 30); // Guitar neck
  
  // "STAFF ONLY" sign
  ctx.fillStyle = '#FFF';
  ctx.fillRect(350, 180, 100, 40);
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(355, 185, 90, 30);
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('STAFF', 375, 200);
  ctx.fillText('ONLY', 380, 215);
  
  // Duct tape on wall
  ctx.fillStyle = '#666';
  ctx.fillRect(100, 300, 40, 8);
  ctx.fillStyle = '#888';
  ctx.fillRect(105, 302, 30, 4);
  
  // Coffee station
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(650, 300, 50, 40);
  ctx.fillStyle = '#000';
  ctx.fillRect(655, 305, 40, 30);
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(670, 310, 10, 15); // Coffee pot
  ctx.fillStyle = '#FFF';
  ctx.fillRect(660, 325, 30, 5); // Coffee mug
  
  // Wires and cables on floor
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(150, 450);
  ctx.lineTo(250, 450);
  ctx.lineTo(350, 470);
  ctx.stroke();
  
  // Colorful extension cords
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 480);
  ctx.lineTo(400, 480);
  ctx.lineTo(500, 490);
  ctx.stroke();
  
  ctx.strokeStyle = '#0000FF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(320, 490);
  ctx.lineTo(420, 485);
  ctx.lineTo(520, 495);
  ctx.stroke();
  
  // Single flickering light
  const lightGradient = ctx.createRadialGradient(400, 150, 0, 400, 150, 50);
  lightGradient.addColorStop(0, 'rgba(255,255,200,0.15)');
  lightGradient.addColorStop(1, 'rgba(255,255,200,0)');
  ctx.fillStyle = lightGradient;
  ctx.fillRect(350, 100, 100, 100);
  
  if (animatronics.bonnie.position === 1) {
    // Bonnie in Backstage - using PNG sprite
    drawAnimatronicSprite(
      animatronicImages.bonnie,
      300,
      250,
      80 * 0.9,
      120 * 0.9
    );
  }
  
  ctx.restore();
}

function gameLoop(timestamp) {
  const dt = timestamp - lastTime || 16;
  lastTime = timestamp;

  if (gameState.inCamera) {
    drawCamera();
  } else {
    drawOffice3D();
  }
  updateGame(dt);

  requestAnimationFrame(gameLoop);
}

// Initialize UI after DOM is ready
document.getElementById('night').textContent = `Night ${gameState.night}`;

// Check image loading status after a delay
setTimeout(() => {
  console.log('=== IMAGE LOADING STATUS ===');
  console.log('Freddy:', imageLoadStatus.freddy ? 'LOADED' : 'FAILED', 'Dimensions:', animatronicImages.freddy.width + 'x' + animatronicImages.freddy.height);
  console.log('Bonnie:', imageLoadStatus.bonnie ? 'LOADED' : 'FAILED', 'Dimensions:', animatronicImages.bonnie.width + 'x' + animatronicImages.bonnie.height);
  console.log('Chica:', imageLoadStatus.chica ? 'LOADED' : 'FAILED', 'Dimensions:', animatronicImages.chica.width + 'x' + animatronicImages.chica.height);
  console.log('Foxy:', imageLoadStatus.foxy ? 'LOADED' : 'FAILED', 'Dimensions:', animatronicImages.foxy.width + 'x' + animatronicImages.foxy.height);
  console.log('==========================');
}, 2000);

// Start the game loop
requestAnimationFrame(gameLoop);
