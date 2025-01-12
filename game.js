
let touchStartX = null;
let touchStartTime = null;
const SWIPE_THRESHOLD = 50; // Min swipe distance in pixels kitna ho
const SWIPE_TIMEOUT = 300; // Max time for a swipe in milliseconds 
// 
// 
// 
// 
const ball = document.getElementById('ball');
const gameContainer = document.getElementById('gameContainer');
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('startButton');

let ballPosition = { x: 200, y: 50 };
let velocity = { x: 0, y: 0 };
let gravity = 0.4;
let score = 0;
let gameLoop;
let platforms = [];
let gameActive = false;
let isOnPlatform = false;

function startGame() {
    if (gameActive) return;
    
    gameActive = true;
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    startButton.style.display = 'none';
    
    // Reset ball position ke liye
    ballPosition = { x: 200, y: 50 };
    velocity = { x: 0, y: 0 };
    
    // Clear existing platforms ki gir jaye
    platforms.forEach(platform => platform.remove());
    platforms = [];
    
    // Create initial platforms for landing
    createPlatform(200);
    createPlatform(400);
    
    gameLoop = setInterval(updateGame, 20);
    setInterval(() => {
        if (gameActive) createPlatform(600);
    }, 2000);
}

function updateGame() {
    if (!gameActive) return;

    // Apply gravity if not on platform
    if (!isOnPlatform) {
        velocity.y += gravity;
    }
    
    // Update ball position
    ballPosition.y += velocity.y;
    ballPosition.x += velocity.x;
    
    // Keep ball within horizontal boundaries
    if (ballPosition.x < 0) ballPosition.x = 0;
    if (ballPosition.x > gameContainer.offsetWidth - 20) {
        ballPosition.x = gameContainer.offsetWidth - 20;
    }
    
    // Check if ball fell off the bottom
    if (ballPosition.y > gameContainer.offsetHeight) {
        endGame();
        return;
    }
    
    // Update ball position
    ball.style.left = ballPosition.x + 'px';
    ball.style.top = ballPosition.y + 'px';
    
    // Reset platform check
    isOnPlatform = false;
    
    // Move and check platforms
    platforms.forEach((platform, index) => {
        // Move platform up
        let platformY = parseInt(platform.style.top) - 2;
        platform.style.top = platformY + 'px';
        
        // Remove platforms that are off screen
        if (platformY + 20 < 0) {
            platform.remove();
            platforms.splice(index, 1);
            score++;
            scoreElement.textContent = `Score: ${score}`;
        }
        
        // Check if ball is on this platform
        if (checkLanding(platform)) {
            isOnPlatform = true;
            ballPosition.y = platformY - 20; // Place ball on top of platform
            velocity.y = -2; // Match platform speed
        }
    });

    // If not on any platform and falling, check for game over
    if (!isOnPlatform && velocity.y > 0 && ballPosition.y > gameContainer.offsetHeight - 100) {
        let canLand = false;
        platforms.forEach(platform => {
            if (Math.abs(parseInt(platform.style.top) - ballPosition.y) < 100) {
                const platformX = parseInt(platform.style.left);
                if (ballPosition.x >= platformX - 20 && ballPosition.x <= platformX + 100) {
                    canLand = true;
                }
            }
        });
        if (!canLand) {
            endGame();
        }
    }
}

function createPlatform(startY) {
    const platform = document.createElement('div');
    platform.className = 'platform';
    platform.style.left = Math.random() * (gameContainer.offsetWidth - 100) + 'px';
    platform.style.top = startY + 'px';
    gameContainer.appendChild(platform);
    platforms.push(platform);
}

function checkLanding(platform) {
    const platformRect = platform.getBoundingClientRect();
    const ballBottom = ballPosition.y + 20;
    const platformTop = parseInt(platform.style.top);
    
    return (
        ballPosition.x + 20 > parseInt(platform.style.left) &&
        ballPosition.x < parseInt(platform.style.left) + 100 &&
        ballBottom >= platformTop &&
        ballBottom <= platformTop + 10 &&
        velocity.y >= 0
    );
}

function endGame() {
    gameActive = false;
    clearInterval(gameLoop);
    startButton.style.display = 'block';
    alert(`Game Over! Score: ${score}`);
}

// Control with arrow keys
document.addEventListener('keydown', (event) => {
    if (!gameActive) return;
    
    switch(event.key) {
        case 'ArrowLeft':
            velocity.x = -5;
            break;
        case 'ArrowRight':
            velocity.x = 5;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        velocity.x = 0;
    }
});

startButton.addEventListener('click', startGame);

// touch event listeners
gameContainer.addEventListener('touchstart', (event) => {
    if (!gameActive) return;
    
    touchStartX = event.touches[0].clientX;
    touchStartTime = Date.now();
});

gameContainer.addEventListener('touchmove', (event) => {
    if (!gameActive || touchStartX === null) return;
    event.preventDefault(); // Prevent scrolling
    
    const touchCurrentX = event.touches[0].clientX;
    const touchDifferenceX = touchCurrentX - touchStartX;
    
    // Move ball based on touch position difference
    if (touchDifferenceX > 0) {
        velocity.x = 5; // Move right
    } else if (touchDifferenceX < 0) {
        velocity.x = -5; // Move left
    }
});

gameContainer.addEventListener('touchend', (event) => {
    if (!gameActive || touchStartX === null) return;
    
    const touchEndX = event.changedTouches[0].clientX;
    const touchDifferenceX = touchEndX - touchStartX;
    const touchDuration = Date.now() - touchStartTime;
    
    // Check if it was a quick swipe
    if (Math.abs(touchDifferenceX) > SWIPE_THRESHOLD && touchDuration < SWIPE_TIMEOUT) {
        // Additional velocity for quick swipes
        velocity.x = (touchDifferenceX > 0) ? 8 : -8;
        setTimeout(() => {
            velocity.x = 0;
        }, 200); // Reset velocity after 200ms
    } else {
        velocity.x = 0;
    }
    
    touchStartX = null;
    touchStartTime = null;
});