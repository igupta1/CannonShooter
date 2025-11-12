/**
 * hud.js - HUD (Heads-Up Display) management
 * Manages score, timer, power bar, and game over screen
 */

// DOM element references
let scoreElement;
let timerElement;
let powerBarElement;
let gameOverElement;
let finalScoreElement;
let restartButton;

/**
 * Initializes HUD element references
 */
export function initHUD() {
    scoreElement = document.getElementById('score');
    timerElement = document.getElementById('timer');
    powerBarElement = document.getElementById('power-bar');
    gameOverElement = document.getElementById('game-over');
    finalScoreElement = document.getElementById('final-score');
    restartButton = document.getElementById('restart-btn');
}

/**
 * Updates the score display
 * @param {number} score - Current score
 */
export function updateScore(score) {
    if (scoreElement) {
        scoreElement.textContent = score;
    }
}

/**
 * Updates the timer display
 * @param {number} timeRemaining - Seconds remaining
 */
export function updateTimer(timeRemaining) {
    if (timerElement) {
        timerElement.textContent = Math.ceil(Math.max(0, timeRemaining));
    }
}

/**
 * Updates the power bar display
 * @param {number} charge - Charge amount (0 to 1)
 */
export function updatePowerBar(charge) {
    if (powerBarElement) {
        powerBarElement.style.width = `${charge * 100}%`;
    }
}

/**
 * Shows the game over screen
 * @param {number} finalScore - Final score to display
 */
export function showGameOver(finalScore) {
    if (gameOverElement && finalScoreElement) {
        finalScoreElement.textContent = finalScore;
        gameOverElement.classList.remove('hidden');
    }
}

/**
 * Hides the game over screen
 */
export function hideGameOver() {
    if (gameOverElement) {
        gameOverElement.classList.add('hidden');
    }
}

/**
 * Adds restart button listener
 * @param {Function} callback - Function to call on restart
 */
export function addRestartListener(callback) {
    if (restartButton) {
        restartButton.addEventListener('click', callback);
    }
}

/**
 * Resets HUD to initial state
 */
export function resetHUD() {
    updateScore(0);
    updateTimer(60);
    updatePowerBar(0);
    hideGameOver();
}

