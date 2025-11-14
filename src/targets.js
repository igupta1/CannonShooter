/**
 * targets.js - Target spawning and management
 * Creates and manages moving box targets for the game
 */

import * as THREE from 'three';
import { randomInRange, pingPong } from './utils.js';

const targets = [];
const TARGET_HEIGHT = 0.3; // Height slightly above water surface

// Movement parameters
const SHIP_RADIUS = 4.0; // Safe radius around each ship (prevents touching)
const GRID_SPACING = 10; // Distance between ship centers (must be > 2 * SHIP_RADIUS)
const MOVEMENT_RADIUS = 1.5; // How far ships move from their center position

/**
 * Spawns guard ships in circles around treasures
 * @param {THREE.Scene} scene - Scene to add targets to
 * @param {Array} treasurePositions - Array of treasure positions {x, z}
 * @param {number} shipsPerTreasure - Number of ships guarding each treasure
 */
export function spawnTargets(scene, treasurePositions, shipsPerTreasure = 5) {
    // Clear existing targets
    for (const target of targets) {
        scene.remove(target.mesh);
    }
    targets.length = 0;

    // Spawn ships in circles around each treasure
    for (let i = 0; i < treasurePositions.length; i++) {
        const treasure = treasurePositions[i];
        const orbitRadius = 8; // Radius of the circle around treasure

        for (let j = 0; j < shipsPerTreasure; j++) {
            // Calculate position in circle
            const angle = (j / shipsPerTreasure) * Math.PI * 2;
            const x = treasure.x + Math.cos(angle) * orbitRadius;
            const z = treasure.z + Math.sin(angle) * orbitRadius;

            spawnTarget(scene, treasure.x, treasure.z, orbitRadius, angle, i, j);
        }
    }
}

/**
 * Spawns a single navy ship target that orbits around a treasure
 * @param {THREE.Scene} scene - Scene to add target to
 * @param {number} treasureX - X position of treasure being guarded
 * @param {number} treasureZ - Z position of treasure being guarded
 * @param {number} orbitRadius - Radius of orbit around treasure
 * @param {number} startAngle - Starting angle in the orbit
 * @param {number} treasureIndex - Index of treasure being guarded
 * @param {number} shipIndex - Index of this ship in the guard circle
 */
function spawnTarget(scene, treasureX, treasureZ, orbitRadius, startAngle, treasureIndex, shipIndex) {
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
    hullMesh.position.y = 0.4; // Match player ship hull height for water level
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

    // Add cannons to enemy ship (2 cannons on sides)
    const cannonGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.8, 8);
    const cannonMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.6,
        metalness: 0.8
    });

    // Left cannon
    const leftCannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
    leftCannon.rotation.z = Math.PI / 2;
    leftCannon.position.set(-0.7, 0.6, 0);
    leftCannon.castShadow = true;
    shipGroup.add(leftCannon);

    // Right cannon
    const rightCannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
    rightCannon.rotation.z = Math.PI / 2;
    rightCannon.position.set(0.7, 0.6, 0);
    rightCannon.castShadow = true;
    shipGroup.add(rightCannon);

    // Calculate initial position on orbit
    const startX = treasureX + Math.cos(startAngle) * orbitRadius;
    const startZ = treasureZ + Math.sin(startAngle) * orbitRadius;

    shipGroup.position.set(startX, TARGET_HEIGHT, startZ);
    
    scene.add(shipGroup);
    
    // Store target data for orbiting behavior
    const target = {
        mesh: shipGroup,
        isMoving: true, // All ships move
        // Orbit parameters
        treasureX: treasureX, // X position of treasure being guarded
        treasureZ: treasureZ, // Z position of treasure being guarded
        orbitRadius: orbitRadius, // Radius of circular orbit
        orbitAngle: startAngle, // Current angle in orbit
        orbitSpeed: 0.3, // Speed of orbit (radians per second)
        treasureIndex: treasureIndex,
        shipIndex: shipIndex,
        originalColor: hullMaterial.color.clone(),
        hullMaterial: hullMaterial, // Store for color animation
        hitTime: 0,
        hits: 0,
        // Shooting parameters
        detectionRadius: 15, // Distance at which ship detects player
        shootCooldown: 0, // Time until next shot
        shootInterval: 4.0 // Seconds between shots (increased for health system)
    };
    
    targets.push(target);
}

/**
 * Updates all targets (movement, hit animations, shooting)
 * @param {number} deltaTime - Time since last frame in seconds
 * @param {THREE.Vector3} playerPosition - Player ship position
 * @param {Function} shootCallback - Callback function to spawn enemy projectile
 */
export function updateTargets(deltaTime, playerPosition = null, shootCallback = null) {
    const currentTime = performance.now() / 1000;

    for (const target of targets) {
        // Skip destroyed targets
        if (target.destroyed) continue;

        if (target.isMoving) {
            // Update orbit angle
            target.orbitAngle += target.orbitSpeed * deltaTime;

            // Calculate new position on circular orbit
            const x = target.treasureX + Math.cos(target.orbitAngle) * target.orbitRadius;
            const z = target.treasureZ + Math.sin(target.orbitAngle) * target.orbitRadius;

            target.mesh.position.x = x;
            target.mesh.position.z = z;
            target.mesh.position.y = TARGET_HEIGHT;

            // Rotate ship to face direction of movement (tangent to circle)
            target.mesh.rotation.y = target.orbitAngle + Math.PI / 2;
        }

        // Enemy shooting AI
        if (playerPosition && shootCallback && target.isMoving) {
            // Update shoot cooldown
            if (target.shootCooldown > 0) {
                target.shootCooldown -= deltaTime;
            }

            // Check if player is in range
            const dx = playerPosition.x - target.mesh.position.x;
            const dz = playerPosition.z - target.mesh.position.z;
            const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);

            // If player is in range and cooldown is ready, shoot
            if (distanceToPlayer < target.detectionRadius && target.shootCooldown <= 0) {
                // Calculate direction to player
                const direction = new THREE.Vector3(dx, 0, dz).normalize();

                // Aim slightly up for arc trajectory
                direction.y = 0.2;
                direction.normalize();

                // Get cannon position (center of ship, slightly elevated)
                const cannonPos = new THREE.Vector3(
                    target.mesh.position.x,
                    target.mesh.position.y + 0.6,
                    target.mesh.position.z
                );

                // Shoot!
                shootCallback(cannonPos, direction);

                // Reset cooldown
                target.shootCooldown = target.shootInterval;
            }
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
 * Resets a navy ship target to its original orbit position
 * @param {Object} target - Target to reset
 */
export function resetTarget(target) {
    // Reset orbit angle to a random position
    target.orbitAngle = Math.random() * Math.PI * 2;

    // Calculate position on orbit
    const x = target.treasureX + Math.cos(target.orbitAngle) * target.orbitRadius;
    const z = target.treasureZ + Math.sin(target.orbitAngle) * target.orbitRadius;

    target.mesh.position.set(x, TARGET_HEIGHT, z);

    // Keep navy ship color consistent (don't randomize)
    target.hullMaterial.color.copy(target.originalColor);

    target.mesh.scale.set(1, 1, 1);
    target.mesh.rotation.y = target.orbitAngle + Math.PI / 2;
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

        // Traverse the ship group and dispose of all geometries and materials
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
    targets.length = 0;
}

