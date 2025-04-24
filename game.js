let touchStartX = null;
let touchStartTime = null;
let SWIPE_THRESHOLD = 50; // Min swipe distance in pixels
let SWIPE_TIMEOUT = 300; // Max time for a swipe in milliseconds 

const ball = document.getElementById('ball');
const gameContainer = document.getElementById('gameContainer');
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('startButton');

let ballPosition = { x: 200, y: 50 };
let velocity = { x: 0, y: 0 };
let gravity = 0.4;
let score = 0;
let gameLoop;
let platformInterval;
let platforms = [];
let gameActive = false;
let isOnPlatform = false;
let difficulty = 'medium';
let sensitivity = 5;

function startGame() {
    if (gameActive) return;
    
    // Hide main menu
    document.getElementById('mainMenu').style.display = 'none';
    
    // Start with game inactive but show countdown
    gameActive = false;
    showCountdown(function() {
        // This callback will run after countdown completes
        actuallyStartGame();
    });
}

function actuallyStartGame() {
    gameActive = true;
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    startButton.style.display = 'none';
    
    updateDifficulty();
    
    // Reset ball position
    ballPosition = { x: 200, y: 50 };
    velocity = { x: 0, y: 0 };
    
    // Clear existing platforms
    platforms.forEach(platform => platform.remove());
    platforms = [];
    
    // Create initial platforms for landing
    createPlatform(200);
    createPlatform(400);
    
    // Clear any existing intervals to prevent duplicate execution
    clearInterval(gameLoop);
    clearInterval(platformInterval);
    
    // Start the game loop
    gameLoop = setInterval(updateGame, 20);
    
    // Start creating platforms periodically
    platformInterval = setInterval(() => {
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
    
    // Create a copy of the platforms array to avoid modification issues during iteration
    const platformsCopy = [...platforms];
    
    // Move and check platforms
    platformsCopy.forEach((platform, index) => {
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
        
        const platformX = parseInt(platform.style.left);
        
        // Improved collision detection with reduced bounce
        if (ballPosition.y + 20 >= platformY && 
            ballPosition.y <= platformY + 20 &&
            ballPosition.x + 20 >= platformX && 
            ballPosition.x <= platformX + 100) {
            
            if (velocity.y > 0) { // Only land when falling
                isOnPlatform = true;
                ballPosition.y = platformY - 20;
                velocity.y = -1; // Reduced from -2 to -1 for less bounce
                addLandingEffect(platformX, platformY);
            }
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

function addLandingEffect(x, y) {
    const effect = document.createElement('div');
    effect.className = 'landing-effect';
    effect.style.left = x + 'px';
    effect.style.top = y + 'px';
    gameContainer.appendChild(effect);
    setTimeout(() => effect.remove(), 500);
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
    clearInterval(platformInterval);
    startButton.style.display = 'block';
    
    // Update high scores before showing alert
    updateHighScores();
    
    // Use a timeout to allow the UI to update before showing alert
    setTimeout(() => {
        alert(`Game Over! Score: ${score}`);
    }, 100);
}

function showCountdown(callback) {
    const countdownElement = document.querySelector('.countdown');
    if (!countdownElement) return; // Ensure the element exists
    
    let count = 3;
    countdownElement.textContent = count;
    countdownElement.style.display = 'block';
    
    const countdownInterval = setInterval(() => {
        count--;
        
        if (count < 0) {
            clearInterval(countdownInterval);
            countdownElement.textContent = 'GO!';
            
            setTimeout(() => {
                countdownElement.style.display = 'none';
                countdownElement.textContent = '';
                // Call the callback function after countdown is completely done
                if (callback) callback();
            }, 500);
        } else {
            countdownElement.textContent = count;
        }
    }, 1000);
}

function updateDifficulty() {
    switch(difficulty) {
        case 'easy':
            gravity = 0.3;
            SWIPE_THRESHOLD = 40;
            break;
        case 'medium':
            gravity = 0.4;
            SWIPE_THRESHOLD = 50;
            break;
        case 'hard':
            gravity = 0.5;
            SWIPE_THRESHOLD = 60;
            break;
    }
}

function updateHighScores() {
    const scores = JSON.parse(localStorage.getItem('highScores')) || [];
    
    // Add current score
    scores.push({
        score: score,
        date: new Date().toLocaleDateString()
    });
    
    // Sort scores in descending order
    scores.sort((a, b) => b.score - a.score);
    
    // Keep only top 10 scores
    const topScores = scores.slice(0, 10);
    
    // Save back to localStorage
    localStorage.setItem('highScores', JSON.stringify(topScores));
    
    // Display high scores
    displayHighScores(topScores);
}

function displayHighScores(scores) {
    const highScoresList = document.getElementById('highScoresList');
    if (!highScoresList) return;
    
    highScoresList.innerHTML = '';
    
    scores.forEach((scoreData, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. Score: ${scoreData.score} - ${scoreData.date}`;
        highScoresList.appendChild(listItem);
    });
    
    document.getElementById('highScoresMenu').style.display = 'block';
}

// Control with arrow keys
document.addEventListener('keydown', (event) => {
    if (!gameActive) return;
    
    switch(event.key) {
        case 'ArrowLeft':
            velocity.x = -sensitivity;
            break;
        case 'ArrowRight':
            velocity.x = sensitivity;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        velocity.x = 0;
    }
});

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
        velocity.x = sensitivity; // Move right
    } else if (touchDifferenceX < 0) {
        velocity.x = -sensitivity; // Move left
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

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Start button click event
    if (startButton) {
        startButton.addEventListener('click', startGame);
    }
    
    // Connect the New Game button to the startGame function
    const newGameButton = document.getElementById('newGame');
    if (newGameButton) {
        newGameButton.addEventListener('click', () => {
            startGame();
        });
    }
    
    // Update sensitivity when the slider changes
    const sensitivitySlider = document.getElementById('sensitivity');
    if (sensitivitySlider) {
        sensitivity = parseInt(sensitivitySlider.value);
        sensitivitySlider.addEventListener('input', (event) => {
            sensitivity = parseInt(event.target.value);
        });
    }
    
    // Update difficulty when the dropdown changes
    const difficultySelect = document.getElementById('difficulty');
    if (difficultySelect) {
        difficulty = difficultySelect.value;
        difficultySelect.addEventListener('change', (event) => {
            difficulty = event.target.value;
            updateDifficulty();
        });
    }
    
    // Close high scores button functionality
    const closeHighScoresButton = document.getElementById('closeHighScores');
    if (closeHighScoresButton) {
        closeHighScoresButton.addEventListener('click', () => {
            document.getElementById('highScoresMenu').style.display = 'none';
        });
    }
    
    // Load and display high scores
    const savedScores = JSON.parse(localStorage.getItem('highScores')) || [];
    if (savedScores.length > 0) {
        // Update the main menu score list
        const scoreList = document.getElementById('scoreList');
        if (scoreList) {
            scoreList.innerHTML = '';
            
            savedScores.slice(0, 5).forEach((scoreData, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${scoreData.score} - ${scoreData.date}`;
                scoreList.appendChild(listItem);
            });
        }
    }
});