/**
 * main.js - Main game loop and initialization
 * Bootstraps the game and runs the main update loop
 */

import { createScene, handleResize, scene, camera, renderer, controls, updateWater, updateShipWakes, updateCamera } from './scene.js';
import { createCannon, setYawPitch, getMuzzlePosition, getFiringDirection, cannonGroup } from './cannon.js';
import { spawnProjectile, updateProjectiles, getProjectiles, clearAllProjectiles, killProjectile, despawnProjectile } from './projectile.js';
import { spawnTargets, updateTargets, getTargets, clearAllTargets, resetTarget, hitTarget } from './targets.js';
import { spawnTreasures, updateTreasures, checkTreasureCollection, collectTreasure, clearAllTreasures, getCollectedCount, getTotalCount } from './treasures.js';
import { sphereVsAABB, getAABBFromMesh } from './collision.js';
import { initInput, updateAiming, updateCharging, checkFire, getAimAngles, getCurrentCharge, updateShipMovement, addRestartListener as addInputRestartListener, resetShipPosition, isFreeCameraMode, setCameraModeCallback } from './input.js';
import { initHUD, updateScore, updateTimer, updatePowerBar, showGameOver, hideGameOver, addRestartListener, resetHUD, updateTreasureCount, updateHealth, updateCameraMode } from './hud.js';

// Game state
let gameActive = false;
let score = 0;
let startTime = 0;
let lastFrameTime = 0;
let gameOverReason = 'timeout'; // 'timeout', 'collision', or 'hit'
let playerHealth = 4; // Player health (max 4)
const MAX_HEALTH = 4;

// Game configuration
const GAME_DURATION = 60; // seconds
const MIN_POWER = 10;
const MAX_POWER = 40;
const TREASURE_COUNT = 6; // Number of treasure chests
const SHIPS_PER_TREASURE = 5; // Guard ships per treasure

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

    // Connect camera mode toggle to HUD indicator
    setCameraModeCallback(updateCameraMode);
    
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
    playerHealth = MAX_HEALTH; // Reset health

    // Clear existing game objects
    clearAllProjectiles(scene);
    clearAllTargets(scene);
    clearAllTreasures(scene);

    // Reset player ship position and rotation
    cannonGroup.position.set(0, 0, 0);
    cannonGroup.rotation.y = 0;
    resetShipPosition();

    // Spawn treasure chests first
    const treasurePositions = spawnTreasures(scene, TREASURE_COUNT);

    // Spawn guard ships around each treasure (5 ships per treasure)
    spawnTargets(scene, treasurePositions, SHIPS_PER_TREASURE);

    // Reset HUD
    resetHUD();
    updateTreasureCount(0, getTotalCount());
    updatePlayerHealth(playerHealth);
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
    
    // Update camera to follow ship (or enable free camera mode)
    updateCamera(cannonGroup, isFreeCameraMode());

    if (gameActive) {
        // Update game timer
        const elapsed = currentTime - startTime;
        const timeRemaining = GAME_DURATION - elapsed;
        updateTimer(timeRemaining);
        
        // Check if time is up
        if (timeRemaining <= 0) {
            gameOverReason = 'timeout';
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
    // Update ship movement with arrow keys
    updateShipMovement(deltaTime, cannonGroup);

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

    // Update targets with enemy shooting AI
    updateTargets(deltaTime, cannonGroup.position, shootEnemyProjectile);

    // Update treasure chests
    updateTreasures(deltaTime);

    // Check treasure collection
    const collectedTreasure = checkTreasureCollection(cannonGroup.position);
    if (collectedTreasure) {
        collectTreasure(scene, collectedTreasure);
        score += 10; // 10 points per treasure
        updateScore(score);
        updateTreasureCount(getCollectedCount(), getTotalCount());
    }

    // Update water animation and ship wakes
    updateWater(deltaTime);
    updateShipWakes(getTargets(), cannonGroup, deltaTime);

    // Check collisions
    checkCollisions();

    // Check player-enemy ship collisions
    checkPlayerShipCollisions();
}

/**
 * Fires the cannon with the given charge
 */
function fireCannon(charge) {
    const muzzlePos = getMuzzlePosition();
    const direction = getFiringDirection();

    // Calculate speed based on charge
    const speed = MIN_POWER + (MAX_POWER - MIN_POWER) * charge;

    // Spawn player projectile
    spawnProjectile(scene, muzzlePos, direction, speed, 'player');
}

/**
 * Fires an enemy projectile at the player
 * @param {THREE.Vector3} position - Enemy cannon position
 * @param {THREE.Vector3} direction - Direction to shoot
 */
function shootEnemyProjectile(position, direction) {
    const speed = 20; // Enemy projectile speed
    spawnProjectile(scene, position, direction, speed, 'enemy');
}

/**
 * Checks for collisions between projectiles and targets/player
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

        // Player projectiles hit enemy ships
        if (proj.type === 'player') {
            for (const target of targets) {
                // Skip destroyed targets
                if (target.destroyed) continue;

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
        // Enemy projectiles hit player
        else if (proj.type === 'enemy') {
            // Simple sphere collision with player ship
            const playerPos = cannonGroup.position;
            const dx = projPos.x - playerPos.x;
            const dy = projPos.y - playerPos.y;
            const dz = projPos.z - playerPos.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            const hitRadius = 2.5; // Player ship hit radius
            if (distance < hitRadius) {
                // Player hit by enemy projectile - Reduce health!
                playerHealth--;
                updatePlayerHealth(playerHealth);

                killProjectile(i);
                despawnProjectile(i, scene);

                // Check if player died
                if (playerHealth <= 0) {
                    gameOverReason = 'hit';
                    endGame();
                    return;
                }
            }
        }
    }
}

/**
 * Updates the player health display
 * @param {number} health - Current health value
 */
function updatePlayerHealth(health) {
    updateHealth(health, MAX_HEALTH);
}

/**
 * Handles a target being hit
 */
function onTargetHit(target) {
    // Increment score
    score++;
    updateScore(score);

    // Mark target as destroyed (stop moving and hide)
    target.isMoving = false;
    target.destroyed = true;

    // Remove ship from scene
    scene.remove(target.mesh);

    // Dispose of geometries and materials
    target.mesh.traverse((child) => {
        if (child.geometry) {
            child.geometry.dispose();
        }
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose());
            } else {
                child.material.dispose();
            }
        }
    });
}

/**
 * Checks for collisions between player ship and enemy ships
 */
function checkPlayerShipCollisions() {
    const targets = getTargets();
    const playerPos = cannonGroup.position;
    const collisionRadius = 3.5; // Distance at which ships collide

    for (const target of targets) {
        // Skip destroyed targets
        if (target.destroyed) continue;

        const enemyPos = target.mesh.position;

        // Calculate distance between player and enemy ship
        const dx = playerPos.x - enemyPos.x;
        const dz = playerPos.z - enemyPos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Check if collision occurred
        if (distance < collisionRadius) {
            // Game over due to collision!
            gameOverReason = 'collision';
            endGame();
            return;
        }
    }
}

/**
 * Ends the game
 */
function endGame() {
    gameActive = false;

    // Show different message based on how game ended
    if (gameOverReason === 'collision') {
        showGameOver(score, 'Ship Collision!');
    } else if (gameOverReason === 'hit') {
        showGameOver(score, 'Hit by Enemy Fire!');
    } else {
        showGameOver(score, "Time's Up!");
    }
}

// Initialize the game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

