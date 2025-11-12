/**
 * targets.js - Target spawning and management
 * Creates and manages moving box targets for the game
 */

import * as THREE from 'three';
import { randomInRange, pingPong } from './utils.js';

const targets = [];
const TARGET_HEIGHT = 2; // Height above ground

/**
 * Spawns multiple targets at random positions
 * @param {THREE.Scene} scene - Scene to add targets to
 * @param {number} count - Number of targets to spawn
 */
export function spawnTargets(scene, count) {
    for (let i = 0; i < count; i++) {
        spawnTarget(scene, i >= count / 2); // At least half are moving
    }
}

/**
 * Spawns a single target
 * @param {THREE.Scene} scene - Scene to add target to
 * @param {boolean} isMoving - Whether the target moves
 */
function spawnTarget(scene, isMoving) {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
        roughness: 0.7,
        metalness: 0.3
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Random lane (x position) and distance (z position)
    const lane = randomInRange(-15, 15);
    const distance = randomInRange(-30, -10);
    
    mesh.position.set(lane, TARGET_HEIGHT, distance);
    
    scene.add(mesh);
    
    // Store target data
    const target = {
        mesh,
        isMoving,
        lane,
        distance,
        movementRange: randomInRange(5, 10),
        movementSpeed: randomInRange(1, 3),
        movementTime: Math.random() * 100,
        originalColor: material.color.clone(),
        hitTime: 0,
        hits: 0
    };
    
    targets.push(target);
}

/**
 * Updates all targets (movement, hit animations)
 * @param {number} deltaTime - Time since last frame in seconds
 */
export function updateTargets(deltaTime) {
    const currentTime = performance.now() / 1000;
    
    for (const target of targets) {
        if (target.isMoving) {
            // Update movement time
            target.movementTime += deltaTime * target.movementSpeed;
            
            // Oscillate left-right using ping-pong
            const offset = pingPong(target.movementTime, target.movementRange) - target.movementRange / 2;
            target.mesh.position.x = target.lane + offset;
        }
        
        // Handle hit animation (flash and scale)
        if (target.hitTime > 0) {
            const timeSinceHit = currentTime - target.hitTime;
            
            if (timeSinceHit < 0.3) {
                // Flash and scale effect
                const t = timeSinceHit / 0.3;
                const flash = Math.sin(t * Math.PI * 4) * 0.5 + 0.5;
                target.mesh.material.color.lerp(new THREE.Color(0xffffff), flash * 0.5);
                
                const scale = 1 + Math.sin(t * Math.PI) * 0.3;
                target.mesh.scale.set(scale, scale, scale);
            } else {
                // Reset after animation
                target.mesh.material.color.copy(target.originalColor);
                target.mesh.scale.set(1, 1, 1);
                target.hitTime = 0;
            }
        }
    }
}

/**
 * Resets a target to a new random position
 * @param {Object} target - Target to reset
 */
export function resetTarget(target) {
    target.lane = randomInRange(-15, 15);
    target.distance = randomInRange(-30, -10);
    target.mesh.position.set(target.lane, TARGET_HEIGHT, target.distance);
    
    // Assign new color
    target.mesh.material.color.setHSL(Math.random(), 0.7, 0.5);
    target.originalColor.copy(target.mesh.material.color);
    
    // Reset movement parameters
    target.movementRange = randomInRange(5, 10);
    target.movementSpeed = randomInRange(1, 3);
    target.movementTime = Math.random() * 100;
    
    target.mesh.scale.set(1, 1, 1);
}

/**
 * Triggers hit animation on a target
 * @param {Object} target - Target that was hit
 */
export function hitTarget(target) {
    target.hitTime = performance.now() / 1000;
    target.hits++;
}

/**
 * Gets all targets
 * @returns {Array} Array of target objects
 */
export function getTargets() {
    return targets;
}

/**
 * Clears all targets (for restart)
 * @param {THREE.Scene} scene - Scene to remove targets from
 */
export function clearAllTargets(scene) {
    for (const target of targets) {
        scene.remove(target.mesh);
        target.mesh.geometry.dispose();
        target.mesh.material.dispose();
    }
    targets.length = 0;
}

