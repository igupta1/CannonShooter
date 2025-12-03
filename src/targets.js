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
    // Create a group for the enemy warship
    const shipGroup = new THREE.Group();
    
    // Enemy warship colors - menacing dark palette
    const hullDark = 0x1A1A2E;        // Very dark blue-black
    const hullMid = 0x2D3A4A;         // Dark slate blue
    const metalDark = 0x1F2937;       // Gun metal
    const accentRed = 0x8B0000;       // Dark crimson
    const accentGold = 0xB8860B;      // Dark gold/brass
    const glassBlue = 0x4A6FA5;       // Tinted window glass
    const smokestackBlack = 0x222222; // Near black
    const deckGray = 0x374151;        // Dark deck
    
    // ============ MAIN HULL - Sleek warship shape ============
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-0.7, 0);
    hullShape.lineTo(-0.85, 0.25);
    hullShape.lineTo(-0.8, 0.55);
    hullShape.lineTo(0.8, 0.55);
    hullShape.lineTo(0.85, 0.25);
    hullShape.lineTo(0.7, 0);
    hullShape.lineTo(-0.7, 0);
    
    const hullExtrudeSettings = { depth: 3.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.04 };
    const hullGeometry = new THREE.ExtrudeGeometry(hullShape, hullExtrudeSettings);
    const hullMaterial = new THREE.MeshStandardMaterial({
        color: hullDark,
        roughness: 0.6,
        metalness: 0.5
    });
    const hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    hullMesh.rotation.x = Math.PI / 2;
    hullMesh.position.set(0, 0.28, 1.75);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    shipGroup.add(hullMesh);
    
    // Hull stripe (waterline)
    const stripeGeometry = new THREE.BoxGeometry(1.75, 0.08, 3.7);
    const stripeMaterial = new THREE.MeshStandardMaterial({ color: accentRed, roughness: 0.4, metalness: 0.3 });
    const stripeMesh = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripeMesh.position.set(0, 0.35, 0);
    shipGroup.add(stripeMesh);
    
    // ============ DECK ============
    const deckGeometry = new THREE.BoxGeometry(1.5, 0.08, 3.3);
    const deckMaterial = new THREE.MeshStandardMaterial({ color: deckGray, roughness: 0.75, metalness: 0.3 });
    const deckMesh = new THREE.Mesh(deckGeometry, deckMaterial);
    deckMesh.position.set(0, 0.62, 0);
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    shipGroup.add(deckMesh);
    
    // Deck detail (single stripe instead of multiple lines for performance)
    const deckStripeGeometry = new THREE.BoxGeometry(1.4, 0.02, 0.1);
    const deckStripeMat = new THREE.MeshStandardMaterial({ color: 0x1F2937, roughness: 0.8 });
    const deckStripe = new THREE.Mesh(deckStripeGeometry, deckStripeMat);
    deckStripe.position.set(0, 0.67, 0);
    shipGroup.add(deckStripe);
    
    // ============ BOW (FRONT) - Sharp pointed section ============
    const bowGeometry = new THREE.ConeGeometry(0.55, 1.4, 4);
    const bowMaterial = new THREE.MeshStandardMaterial({ color: hullDark, roughness: 0.6, metalness: 0.5 });
    const bowMesh = new THREE.Mesh(bowGeometry, bowMaterial);
    bowMesh.rotation.x = Math.PI / 2;
    bowMesh.rotation.z = Math.PI / 4;
    bowMesh.position.set(0, 0.38, -2.35);
    bowMesh.castShadow = true;
    shipGroup.add(bowMesh);
    
    // Bow ram/blade
    const ramGeometry = new THREE.BoxGeometry(0.08, 0.25, 0.8);
    const ramMaterial = new THREE.MeshStandardMaterial({ color: metalDark, roughness: 0.4, metalness: 0.8 });
    const ramMesh = new THREE.Mesh(ramGeometry, ramMaterial);
    ramMesh.position.set(0, 0.25, -2.7);
    ramMesh.castShadow = true;
    shipGroup.add(ramMesh);
    
    // ============ SUPERSTRUCTURE - Modern bridge ============
    // Lower superstructure
    const superGeometry = new THREE.BoxGeometry(1.1, 0.45, 1.6);
    const superMaterial = new THREE.MeshStandardMaterial({ color: hullMid, roughness: 0.65, metalness: 0.4 });
    const superMesh = new THREE.Mesh(superGeometry, superMaterial);
    superMesh.position.set(0, 0.88, 0.2);
    superMesh.castShadow = true;
    shipGroup.add(superMesh);
    
    // Bridge deck
    const bridgeDeckGeometry = new THREE.BoxGeometry(0.9, 0.35, 1.2);
    const bridgeDeckMesh = new THREE.Mesh(bridgeDeckGeometry, superMaterial);
    bridgeDeckMesh.position.set(0, 1.28, 0.1);
    bridgeDeckMesh.castShadow = true;
    shipGroup.add(bridgeDeckMesh);
    
    // Bridge windows (wraparound)
    const windowMaterial = new THREE.MeshStandardMaterial({ 
        color: glassBlue, 
        roughness: 0.1, 
        metalness: 0.4,
        transparent: true,
        opacity: 0.7
    });
    
    // Front windows
    const frontWindowGeometry = new THREE.BoxGeometry(0.75, 0.18, 0.05);
    const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    frontWindow.position.set(0, 1.35, -0.55);
    shipGroup.add(frontWindow);
    
    // Side windows
    for (let side = -1; side <= 1; side += 2) {
        const sideWindowGeometry = new THREE.BoxGeometry(0.05, 0.18, 0.5);
        const sideWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
        sideWindow.position.set(side * 0.48, 1.35, -0.25);
        shipGroup.add(sideWindow);
    }
    
    // Window frame trim
    const frameMaterial = new THREE.MeshStandardMaterial({ color: accentGold, roughness: 0.3, metalness: 0.7 });
    const frameTopGeometry = new THREE.BoxGeometry(0.8, 0.03, 0.08);
    const frameTop = new THREE.Mesh(frameTopGeometry, frameMaterial);
    frameTop.position.set(0, 1.45, -0.55);
    shipGroup.add(frameTop);
    
    // ============ MAST/RADAR TOWER ============
    const mastGeometry = new THREE.CylinderGeometry(0.04, 0.06, 1.0, 8);
    const mastMaterial = new THREE.MeshStandardMaterial({ color: metalDark, roughness: 0.5, metalness: 0.7 });
    const mastMesh = new THREE.Mesh(mastGeometry, mastMaterial);
    mastMesh.position.set(0, 1.95, 0.1);
    mastMesh.castShadow = true;
    shipGroup.add(mastMesh);
    
    // Radar array (simplified)
    const radarDishGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.04, 8);
    const radarDishMaterial = new THREE.MeshStandardMaterial({ color: 0x3A3A3A, roughness: 0.4, metalness: 0.6 });
    const radarDish = new THREE.Mesh(radarDishGeometry, radarDishMaterial);
    radarDish.position.set(0, 2.5, 0.1);
    shipGroup.add(radarDish);
    
    // Single radar antenna (simplified)
    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4);
    const antenna = new THREE.Mesh(antennaGeometry, mastMaterial);
    antenna.position.set(0, 2.75, 0.1);
    shipGroup.add(antenna);
    
    // ============ SMOKESTACK (simplified) ============
    const stackGeometry = new THREE.CylinderGeometry(0.12, 0.16, 0.6, 6);
    const stackMaterial = new THREE.MeshStandardMaterial({ color: smokestackBlack, roughness: 0.7, metalness: 0.4 });
    const stackMesh = new THREE.Mesh(stackGeometry, stackMaterial);
    stackMesh.position.set(0, 1.4, 0.8);
    shipGroup.add(stackMesh);
    
    // Stack band (red accent)
    const bandGeometry = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 6);
    const band = new THREE.Mesh(bandGeometry, new THREE.MeshStandardMaterial({ color: accentRed, roughness: 0.5 }));
    band.position.set(0, 1.55, 0.8);
    shipGroup.add(band);
    
    // ============ WEAPONS SYSTEMS (simplified) ============
    // Main turret (forward)
    const turretMaterial = new THREE.MeshStandardMaterial({ color: metalDark, roughness: 0.5, metalness: 0.75 });
    const turretBaseGeometry = new THREE.CylinderGeometry(0.25, 0.28, 0.18, 6);
    const turretBase = new THREE.Mesh(turretBaseGeometry, turretMaterial);
    turretBase.position.set(0, 0.75, -1.2);
    shipGroup.add(turretBase);
    
    // Main cannon barrel
    const mainCannonGeometry = new THREE.CylinderGeometry(0.08, 0.1, 1.0, 6);
    const mainCannon = new THREE.Mesh(mainCannonGeometry, turretMaterial);
    mainCannon.rotation.x = Math.PI / 2;
    mainCannon.position.set(0, 0.85, -1.7);
    shipGroup.add(mainCannon);
    
    // Side cannons (simplified - no mounts)
    const sideCannonGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.5, 6);
    const leftCannon = new THREE.Mesh(sideCannonGeometry, turretMaterial);
    leftCannon.rotation.z = -Math.PI / 2;
    leftCannon.position.set(-0.85, 0.75, 0);
    shipGroup.add(leftCannon);
    
    const rightCannon = new THREE.Mesh(sideCannonGeometry, turretMaterial);
    rightCannon.rotation.z = Math.PI / 2;
    rightCannon.position.set(0.85, 0.75, 0);
    shipGroup.add(rightCannon);
    
    // ============ STERN (REAR) DETAILS ============
    // Stern structure
    const sternGeometry = new THREE.BoxGeometry(1.3, 0.5, 0.6);
    const sternMesh = new THREE.Mesh(sternGeometry, superMaterial);
    sternMesh.position.set(0, 0.85, 1.4);
    sternMesh.castShadow = true;
    shipGroup.add(sternMesh);
    
    // Stern railing
    const railGeometry = new THREE.BoxGeometry(1.4, 0.08, 0.04);
    const railMaterial = new THREE.MeshStandardMaterial({ color: metalDark, roughness: 0.5, metalness: 0.6 });
    const sternRail = new THREE.Mesh(railGeometry, railMaterial);
    sternRail.position.set(0, 1.15, 1.72);
    shipGroup.add(sternRail);
    
    
    // ============ SIDE RAILINGS ============
    for (let side = -1; side <= 1; side += 2) {
        const sideRailGeometry = new THREE.BoxGeometry(0.04, 0.06, 2.5);
        const sideRail = new THREE.Mesh(sideRailGeometry, railMaterial);
        sideRail.position.set(side * 0.72, 0.75, -0.2);
        shipGroup.add(sideRail);
    }
    
    // ============ ENEMY FLAG ============
    const flagPoleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6);
    const flagPoleMaterial = new THREE.MeshStandardMaterial({ color: metalDark, roughness: 0.5, metalness: 0.7 });
    const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
    flagPole.position.set(0, 1.4, 1.6);
    shipGroup.add(flagPole);
    
    // Enemy flag (red/black)
    const flagGeometry = new THREE.PlaneGeometry(0.4, 0.25, 3, 2);
    const flagPositions = flagGeometry.attributes.position;
    for (let i = 0; i < flagPositions.count; i++) {
        const x = flagPositions.getX(i);
        flagPositions.setZ(i, Math.sin(x * 4) * 0.04);
    }
    flagGeometry.computeVertexNormals();
    
    const flagMaterial = new THREE.MeshStandardMaterial({ 
        color: accentRed, 
        roughness: 0.9,
        side: THREE.DoubleSide
    });
    const flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
    flagMesh.position.set(0.22, 1.55, 1.6);
    flagMesh.rotation.y = Math.PI / 2;
    shipGroup.add(flagMesh);
    
    // ============ LIGHTING/GLOW EFFECTS ============
    // Running lights
    const lightMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFF0000, 
        emissive: 0xFF0000, 
        emissiveIntensity: 0.5,
        roughness: 0.3
    });
    const greenLightMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00FF00, 
        emissive: 0x00FF00, 
        emissiveIntensity: 0.5,
        roughness: 0.3
    });
    
    const lightGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const portLight = new THREE.Mesh(lightGeometry, lightMaterial);
    portLight.position.set(-0.78, 0.5, -1.0);
    shipGroup.add(portLight);
    
    const starboardLight = new THREE.Mesh(lightGeometry, greenLightMaterial);
    starboardLight.position.set(0.78, 0.5, -1.0);
    shipGroup.add(starboardLight);
    
    // Masthead light
    const mastheadLight = new THREE.Mesh(lightGeometry, new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF, 
        emissive: 0xFFFFFF, 
        emissiveIntensity: 0.4,
        roughness: 0.3
    }));
    mastheadLight.position.set(0, 3.0, 0.1);
    shipGroup.add(mastheadLight);
    
    // ============ DECK EQUIPMENT (simplified) ============
    // Single orange life raft for visibility
    const raftGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
    const raftMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600, roughness: 0.8 });
    const raft = new THREE.Mesh(raftGeometry, raftMaterial);
    raft.position.set(0.4, 1.12, 0.5);
    shipGroup.add(raft);

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
        shootInterval: 7.0 // Seconds between shots (slower fire rate)
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

