/**
 * main.js - Main game loop and initialization
 * Bootstraps the game and runs the main update loop
 */

import { createScene, handleResize, scene, camera, renderer, controls } from './scene.js';
import { createCannon, setYawPitch, getMuzzlePosition, getFiringDirection } from './cannon.js';
import { spawnProjectile, updateProjectiles, getProjectiles, clearAllProjectiles, killProjectile, despawnProjectile } from './projectile.js';
import { spawnTargets, updateTargets, getTargets, clearAllTargets, resetTarget, hitTarget } from './targets.js';
import { sphereVsAABB, getAABBFromMesh } from './collision.js';
import { initInput, updateAiming, updateCharging, checkFire, getAimAngles, getCurrentCharge, addRestartListener as addInputRestartListener } from './input.js';
import { initHUD, updateScore, updateTimer, updatePowerBar, showGameOver, hideGameOver, addRestartListener, resetHUD } from './hud.js';

// Game state
let gameActive = false;
let score = 0;
let startTime = 0;
let lastFrameTime = 0;

// Game configuration
const GAME_DURATION = 60; // seconds
const MIN_POWER = 10;
const MAX_POWER = 40;
const TARGET_COUNT = 8;

/**
 * Initializes the game
 */
function init() {
    // Get container
    const container = document.getElementById('game-container');
    
    // Create scene and renderer
    createScene(container);
    
    // Create cannon
    createCannon(scene);
    
    // Initialize input
    initInput(renderer.domElement);
    addInputRestartListener(restartGame);
    
    // Initialize HUD
    initHUD();
    addRestartListener(restartGame);
    
    // Start game
    startGame();
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    // Start animation loop
    animate();
}

/**
 * Starts or restarts the game
 */
function startGame() {
    gameActive = true;
    score = 0;
    startTime = performance.now() / 1000;
    
    // Clear existing game objects
    clearAllProjectiles(scene);
    clearAllTargets(scene);
    
    // Spawn targets
    spawnTargets(scene, TARGET_COUNT);
    
    // Reset HUD
    resetHUD();
}

/**
 * Restarts the game
 */
function restartGame() {
    startGame();
}

/**
 * Main animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    const currentTime = performance.now() / 1000;
    const deltaTime = lastFrameTime > 0 ? currentTime - lastFrameTime : 0.016;
    lastFrameTime = currentTime;
    
    // Update controls
    controls.update();
    
    if (gameActive) {
        // Update game timer
        const elapsed = currentTime - startTime;
        const timeRemaining = GAME_DURATION - elapsed;
        updateTimer(timeRemaining);
        
        // Check if time is up
        if (timeRemaining <= 0) {
            endGame();
        } else {
            // Update game logic
            updateGame(currentTime, deltaTime);
        }
    }
    
    // Render scene
    renderer.render(scene, camera);
}

/**
 * Updates game logic each frame
 */
function updateGame(currentTime, deltaTime) {
    // Update cannon aiming with keyboard
    updateAiming(deltaTime);
    const { yaw, pitch } = getAimAngles();
    setYawPitch(yaw, pitch);
    
    // Update charging
    const charge = updateCharging(currentTime);
    updatePowerBar(charge);
    
    // Check for firing
    const fireCharge = checkFire();
    if (fireCharge !== null && fireCharge > 0) {
        fireCannon(fireCharge);
    }
    
    // Update projectiles with physics
    updateProjectiles(deltaTime, scene);
    
    // Update targets
    updateTargets(deltaTime);
    
    // Check collisions
    checkCollisions();
}

/**
 * Fires the cannon with the given charge
 */
function fireCannon(charge) {
    const muzzlePos = getMuzzlePosition();
    const direction = getFiringDirection();
    
    // Calculate speed based on charge
    const speed = MIN_POWER + (MAX_POWER - MIN_POWER) * charge;
    
    // Spawn projectile
    spawnProjectile(scene, muzzlePos, direction, speed);
}

/**
 * Checks for collisions between projectiles and targets
 */
function checkCollisions() {
    const projectiles = getProjectiles();
    const targets = getTargets();
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        
        if (!proj.alive) {
            continue;
        }
        
        const projPos = {
            x: proj.mesh.position.x,
            y: proj.mesh.position.y,
            z: proj.mesh.position.z
        };
        
        for (const target of targets) {
            const bounds = getAABBFromMesh(target.mesh);
            
            if (sphereVsAABB(projPos, proj.radius, bounds.min, bounds.max)) {
                // Hit detected!
                onTargetHit(target);
                killProjectile(i);
                despawnProjectile(i, scene);
                break;
            }
        }
    }
}

/**
 * Handles a target being hit
 */
function onTargetHit(target) {
    // Increment score
    score++;
    updateScore(score);
    
    // Trigger hit animation
    hitTarget(target);
    
    // Reset target to new position after a delay
    setTimeout(() => {
        resetTarget(target);
    }, 300);
}

/**
 * Ends the game
 */
function endGame() {
    gameActive = false;
    showGameOver(score);
}

// Initialize the game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

