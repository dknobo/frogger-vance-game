const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load images
const frogImg = new Image();
frogImg.src = 'frog.png';
const logImg = new Image();
logImg.src = 'log.png';
const cars = [];
for (let i = 1; i <= 9; i++) {
    const carImg = new Image();
    carImg.src = `Vance00${i}.png`;
    cars.push(carImg);
}

// Game objects
const frog = {
    x: 400,
    y: 550,
    width: 40,
    height: 40,
    speed: 40,
    bounce: 0 // For bounce effect
};

const logs = [];
const vehicles = [];
const laneHeight = 50;
let score = 0;
let level = 1;
let levelUpMessage = '';
let levelUpTimer = 0;
let levelStartTime = Date.now();
let particles = []; // For effects

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.1;
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    oscillator.stop(audioCtx.currentTime + duration);
}

// Particle effect
function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 60,
            color: color
        });
    }
}

// Game state
let gameOver = false;

// Initialize game objects
function initLevel() {
    logs.length = 0;
    vehicles.length = 0;
    levelStartTime = Date.now();

    const baseLogCount = 3;
    const logsPerLane = Math.max(2, baseLogCount - Math.floor(level / 3));
    const waterLanes = [
        {y: 50, speed: 2 + level * 0.2, spacing: 200 + level * 10},
        {y: 100, speed: -2.5 - level * 0.2, spacing: 250 + level * 10},
        {y: 150, speed: 3 + level * 0.2, spacing: 220 + level * 10}
    ];

    waterLanes.forEach(lane => {
        for (let x = 0; x < canvas.width; x += lane.spacing / logsPerLane) {
            logs.push({
                x: x,
                y: lane.y,
                width: 100,
                height: 40,
                speed: lane.speed
            });
        }
    });

    const baseVehicleCount = 8;
    const numVehicles = baseVehicleCount + level * 2;
    for (let i = 0; i < numVehicles; i++) {
        vehicles.push({
            x: Math.random() * (canvas.width - 200) + 100,
            y: 250 + Math.floor(Math.random() * 5) * laneHeight,
            width: 60,
            height: 40,
            speed: -(1 + Math.random() * (1.5 + level * 0.2)),
            img: cars[i % cars.length]
        });
    }
}

// Controls
document.addEventListener('keydown', (e) => {
    if (gameOver) return;

    switch(e.key) {
        case 'ArrowUp':
            if (frog.y > 0) frog.y -= frog.speed;
            frog.bounce = 5;
            playSound(600, 0.1);
            break;
        case 'ArrowDown':
            if (frog.y < canvas.height - frog.height) frog.y += frog.speed;
            frog.bounce = 5;
            playSound(600, 0.1);
            break;
        case 'ArrowLeft':
            if (frog.x > 0) frog.x -= frog.speed;
            frog.bounce = 5;
            playSound(600, 0.1);
            break;
        case 'ArrowRight':
            if (frog.x < canvas.width - frog.width) frog.x += frog.speed;
            frog.bounce = 5;
            playSound(600, 0.1);
            break;
    }

    if (frog.y < 50) {
        const timeTaken = (Date.now() - levelStartTime) / 1000; // Seconds
        const timeBonus = Math.max(0, Math.floor(20 - timeTaken)) * 10; // Max 200 points
        score += 100 + level * 50 + timeBonus; // Base 100 + 50/level + time bonus
        level++;
        levelUpMessage = `Level ${level} Reached! +${100 + level * 50 + timeBonus} points`;
        levelUpTimer = 120;
        playSound(800, 0.1);
        setTimeout(() => playSound(1000, 0.1), 100);
        setTimeout(() => playSound(1200, 0.2), 200);
        createParticles(canvas.width/2, 50, 20, 'yellow');
        frog.y = 550;
        frog.x = 400;
        initLevel();
    }
});

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update game objects
function update() {
    if (gameOver) return;

    logs.forEach(log => {
        log.x += log.speed;
        if (log.speed > 0 && log.x > canvas.width) {
            log.x = -log.width;
        } else if (log.speed < 0 && log.x < -log.width) {
            log.x = canvas.width;
        }
        
        if (checkCollision(frog, log)) {
            frog.x += log.speed;
        }
    });

    vehicles.forEach(vehicle => {
        vehicle.x += vehicle.speed;
        if (vehicle.speed < 0 && vehicle.x < -vehicle.width) {
            vehicle.x = canvas.width + (Math.random() * 200);
            vehicle.y = 250 + Math.floor(Math.random() * 5) * laneHeight;
            vehicle.speed = -(1 + Math.random() * (1.5 + level * 0.2));
            vehicle.img = cars[Math.floor(Math.random() * cars.length)];
        } else if (vehicle.speed > 0 && vehicle.x > canvas.width) {
            vehicle.x = -vehicle.width - (Math.random() * 200);
            vehicle.y = 250 + Math.floor(Math.random() * 5) * laneHeight;
            vehicle.speed = -(1 + Math.random() * (1.5 + level * 0.2));
            vehicle.img = cars[Math.floor(Math.random() * cars.length)];
        }

        if (checkCollision(frog, vehicle)) {
            playSound(200, 0.5, 'square');
            createParticles(frog.x + frog.width/2, frog.y + frog.height/2, 15, 'red');
            gameOver = true;
        }
    });

    if (frog.y <= 190 && frog.y > 10) {
        let onLog = false;
        for (let log of logs) {
            if (checkCollision(frog, log)) {
                onLog = true;
                break;
            }
        }
        if (!onLog && frog.y > 50 && frog.y < 190) {
            playSound(300, 0.3, 'sawtooth');
            createParticles(frog.x + frog.width/2, frog.y + frog.height/2, 15, 'blue');
            gameOver = true;
        }
    }

    if (levelUpTimer > 0) {
        levelUpTimer--;
    }

    // Update particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
    });

    // Update frog bounce
    if (frog.bounce > 0) {
        frog.bounce--;
    }
}

// Draw game
function draw() {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a3c34');
    gradient.addColorStop(0.33, '#2a5d77');
    gradient.addColorStop(0.67, '#4a2c1f');
    gradient.addColorStop(1, '#3d2b1f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Water with ripple effect
    ctx.fillStyle = 'rgba(0, 0, 255, 0.7)';
    ctx.fillRect(0, 0, canvas.width, 200);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * 200, Math.random() * 20, 0, Math.PI * 2);
        ctx.fill();
    }

    // Road with lines
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 200, canvas.width, 400);
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 20]);
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 250 + i * laneHeight);
        ctx.lineTo(canvas.width, 250 + i * laneHeight);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // Goal with glow
    ctx.fillStyle = '#00cc00';
    ctx.fillRect(0, 0, canvas.width, 50);
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, 60);

    logs.forEach(log => {
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.drawImage(logImg, log.x, log.y, log.width, log.height);
        ctx.shadowBlur = 0;
    });

    vehicles.forEach(vehicle => {
        ctx.drawImage(vehicle.img, vehicle.x, vehicle.y, vehicle.width, vehicle.height);
    });

    // Frog with bounce effect
    const bounceOffset = Math.sin(frog.bounce * Math.PI / 5) * 5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
    ctx.drawImage(frogImg, frog.x, frog.y - bounceOffset, frog.width, frog.height);
    ctx.shadowBlur = 0;

    // Particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.life / 20, 0, Math.PI * 2);
        ctx.fill();
    });

    // HUD
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}  Level: ${level}`, 10, 35);

    if (levelUpTimer > 0) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
        ctx.font = '32px Arial';
        ctx.fillText(levelUpMessage, canvas.width/2 - 150, canvas.height/2 - 20);
    }

    if (gameOver) {
        // Game over screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const randomCar = cars[Math.floor(Math.random() * cars.length)];
        ctx.drawImage(randomCar, canvas.width/2 - 100, canvas.height/2 - 150, 200, 150);
        
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.fillText('GAME OVER', canvas.width/2 - 120, canvas.height/2 + 20);
        ctx.font = '30px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width/2 - 110, canvas.height/2 + 60);
        ctx.fillText(`Highest Level: ${level}`, canvas.width/2 - 130, canvas.height/2 + 100);
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
initLevel();
gameLoop();