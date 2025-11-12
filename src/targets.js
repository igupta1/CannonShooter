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
 * Spawns a single navy ship target
 * @param {THREE.Scene} scene - Scene to add target to
 * @param {boolean} isMoving - Whether the target moves
 */
function spawnTarget(scene, isMoving) {
    // Create a group for the navy ship
    const shipGroup = new THREE.Group();
    
    // Navy ship colors
    const navyBlue = 0x1C3F60;
    const darkGray = 0x4A5568;
    const white = 0xE8E8E8;
    const redStripe = 0xC41E3A;
    
    // Main hull
    const hullGeometry = new THREE.BoxGeometry(1.2, 0.8, 3);
    const hullMaterial = new THREE.MeshStandardMaterial({
        color: navyBlue,
        roughness: 0.7,
        metalness: 0.4
    });
    const hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    hullMesh.position.y = 0;
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    shipGroup.add(hullMesh);
    
    // Deck/superstructure
    const deckGeometry = new THREE.BoxGeometry(1.0, 0.6, 1.5);
    const deckMaterial = new THREE.MeshStandardMaterial({
        color: darkGray,
        roughness: 0.6,
        metalness: 0.5
    });
    const deckMesh = new THREE.Mesh(deckGeometry, deckMaterial);
    deckMesh.position.set(0, 0.7, -0.2);
    deckMesh.castShadow = true;
    shipGroup.add(deckMesh);
    
    // Bridge/command center
    const bridgeGeometry = new THREE.BoxGeometry(0.7, 0.5, 0.8);
    const bridgeMaterial = new THREE.MeshStandardMaterial({
        color: white,
        roughness: 0.5,
        metalness: 0.6
    });
    const bridgeMesh = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridgeMesh.position.set(0, 1.25, -0.2);
    bridgeMesh.castShadow = true;
    shipGroup.add(bridgeMesh);
    
    // Radar/antenna
    const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8);
    const antennaMaterial = new THREE.MeshStandardMaterial({
        color: darkGray,
        roughness: 0.4,
        metalness: 0.8
    });
    const antennaMesh = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antennaMesh.position.set(0, 1.8, -0.2);
    antennaMesh.castShadow = true;
    shipGroup.add(antennaMesh);
    
    // Radar dish on top
    const radarGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
    const radarMesh = new THREE.Mesh(radarGeometry, antennaMaterial);
    radarMesh.position.set(0, 2.1, -0.2);
    radarMesh.castShadow = true;
    shipGroup.add(radarMesh);
    
    // Smokestacks (two)
    const stackGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.8, 8);
    const stackMaterial = new THREE.MeshStandardMaterial({
        color: redStripe,
        roughness: 0.6,
        metalness: 0.5
    });
    const stack1 = new THREE.Mesh(stackGeometry, stackMaterial);
    stack1.position.set(-0.3, 1.3, 0.5);
    stack1.castShadow = true;
    shipGroup.add(stack1);
    
    const stack2 = new THREE.Mesh(stackGeometry, stackMaterial);
    stack2.position.set(0.3, 1.3, 0.5);
    stack2.castShadow = true;
    shipGroup.add(stack2);
    
    // Bow (front pointed section)
    const bowGeometry = new THREE.ConeGeometry(0.6, 0.8, 4);
    const bowMaterial = new THREE.MeshStandardMaterial({
        color: navyBlue,
        roughness: 0.7,
        metalness: 0.4
    });
    const bowMesh = new THREE.Mesh(bowGeometry, bowMaterial);
    bowMesh.rotation.x = Math.PI / 2;
    bowMesh.position.set(0, 0, -1.9);
    bowMesh.castShadow = true;
    shipGroup.add(bowMesh);
    
    // Random lane (x position) and distance (z position)
    const lane = randomInRange(-15, 15);
    const distance = randomInRange(-30, -10);
    
    shipGroup.position.set(lane, TARGET_HEIGHT, distance);
    
    scene.add(shipGroup);
    
    // Store target data
    const target = {
        mesh: shipGroup,
        isMoving,
        lane,
        distance,
        movementRange: randomInRange(5, 10),
        movementSpeed: randomInRange(1, 3),
        movementTime: Math.random() * 100,
        originalColor: hullMaterial.color.clone(),
        hullMaterial: hullMaterial, // Store for color animation
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
                target.hullMaterial.color.lerp(new THREE.Color(0xffffff), flash * 0.5);
                
                const scale = 1 + Math.sin(t * Math.PI) * 0.3;
                target.mesh.scale.set(scale, scale, scale);
            } else {
                // Reset after animation
                target.hullMaterial.color.copy(target.originalColor);
                target.mesh.scale.set(1, 1, 1);
                target.hitTime = 0;
            }
        }
    }
}

/**
 * Resets a navy ship target to a new random position
 * @param {Object} target - Target to reset
 */
export function resetTarget(target) {
    target.lane = randomInRange(-15, 15);
    target.distance = randomInRange(-30, -10);
    target.mesh.position.set(target.lane, TARGET_HEIGHT, target.distance);
    
    // Keep navy ship color consistent (don't randomize)
    target.hullMaterial.color.copy(target.originalColor);
    
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

