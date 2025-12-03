/**
 * treasures.js - Treasure chest spawning and collection
 * Creates treasure chests for the player to collect
 */

import * as THREE from 'three';

const treasures = [];
const CHEST_HEIGHT = 0.8;

/**
 * Creates an optimized treasure chest 3D model
 * @returns {Object} Chest group and materials for animation
 */
function createChestModel() {
    const chestGroup = new THREE.Group();

    // Rich color palette
    const darkWood = 0x3D2817;
    const richWood = 0x6B4423;
    const goldColor = 0xFFD700;
    const brightGold = 0xFFE55C;

    // ============ CHEST BODY ============
    const bodyGeometry = new THREE.BoxGeometry(1.4, 0.9, 1.0);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: richWood,
        roughness: 0.65,
        metalness: 0.15
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = 0.45;
    bodyMesh.castShadow = true;
    chestGroup.add(bodyMesh);

    // Inner gold rim (glowing interior)
    const innerRimGeometry = new THREE.BoxGeometry(1.2, 0.15, 0.8);
    const innerGoldMaterial = new THREE.MeshStandardMaterial({
        color: brightGold,
        roughness: 0.2,
        metalness: 0.9,
        emissive: goldColor,
        emissiveIntensity: 1.0
    });
    const innerRim = new THREE.Mesh(innerRimGeometry, innerGoldMaterial);
    innerRim.position.y = 0.95;
    chestGroup.add(innerRim);

    // ============ DOMED LID (simplified) ============
    const lidCurveGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.3, 8, 1, false, 0, Math.PI);
    const lidMaterial = new THREE.MeshStandardMaterial({
        color: darkWood,
        roughness: 0.6,
        metalness: 0.2
    });
    const lidMesh = new THREE.Mesh(lidCurveGeometry, lidMaterial);
    lidMesh.rotation.z = Math.PI / 2;
    lidMesh.rotation.y = Math.PI / 2;
    lidMesh.position.set(0, 1.0, 0);
    lidMesh.castShadow = true;
    chestGroup.add(lidMesh);

    // ============ GOLD TRIM (simplified - shared material) ============
    const goldMaterial = new THREE.MeshStandardMaterial({
        color: goldColor,
        roughness: 0.2,
        metalness: 0.95,
        emissive: goldColor,
        emissiveIntensity: 0.8
    });

    // Gold bands (2 horizontal)
    const bandGeometry = new THREE.BoxGeometry(1.5, 0.1, 1.1);
    const band1 = new THREE.Mesh(bandGeometry, goldMaterial);
    band1.position.y = 0.2;
    chestGroup.add(band1);

    const band2 = new THREE.Mesh(bandGeometry, goldMaterial);
    band2.position.y = 0.7;
    chestGroup.add(band2);

    // ============ LOCK ============
    const lockGeometry = new THREE.BoxGeometry(0.35, 0.45, 0.1);
    const lockMesh = new THREE.Mesh(lockGeometry, goldMaterial);
    lockMesh.position.set(0, 0.5, 0.55);
    chestGroup.add(lockMesh);

    // Lock hasp
    const haspGeometry = new THREE.TorusGeometry(0.1, 0.03, 4, 8, Math.PI);
    const hasp = new THREE.Mesh(haspGeometry, goldMaterial);
    hasp.rotation.z = Math.PI;
    hasp.position.set(0, 0.78, 0.55);
    chestGroup.add(hasp);

    // ============ GEM (single center gem) ============
    const gemGeometry = new THREE.OctahedronGeometry(0.12, 0);
    const gemMaterial = new THREE.MeshStandardMaterial({
        color: 0xDC143C,
        roughness: 0.1,
        metalness: 0.3,
        emissive: 0xDC143C,
        emissiveIntensity: 0.5
    });
    const gem = new THREE.Mesh(gemGeometry, gemMaterial);
    gem.position.set(0, 1.35, 0);
    gem.rotation.y = Math.PI / 4;
    chestGroup.add(gem);

    // Store references for animation (NO lights - use emissive only)
    chestGroup.userData = {
        goldMaterial: goldMaterial,
        innerGoldMaterial: innerGoldMaterial,
        gemMaterial: gemMaterial,
        baseEmissiveIntensity: 0.8
    };

    return chestGroup;
}

/**
 * Spawns treasure chests in a grid pattern
 * @param {THREE.Scene} scene - Scene to add chests to
 * @param {number} count - Number of treasures to spawn
 * @returns {Array} Array of treasure positions
 */
export function spawnTreasures(scene, count) {
    // Clear existing treasures
    clearAllTreasures(scene);

    const treasurePositions = [];

    // Calculate grid layout for treasures
    const chestsPerRow = 3;
    const numRows = Math.ceil(count / chestsPerRow);
    const spacing = 25; // Distance between treasure centers

    for (let row = 0; row < numRows; row++) {
        const chestsInRow = Math.min(chestsPerRow, count - row * chestsPerRow);

        for (let col = 0; col < chestsInRow; col++) {
            // Create chest model
            const chestMesh = createChestModel();

            // Calculate position in grid (centered)
            const gridWidthHalf = ((chestsPerRow - 1) * spacing) / 2;
            const gridDepthHalf = ((numRows - 1) * spacing) / 2;

            const x = (col * spacing) - gridWidthHalf;
            const z = -40 - (row * spacing) + gridDepthHalf;

            chestMesh.position.set(x, CHEST_HEIGHT, z);

            // Random rotation for variety
            chestMesh.rotation.y = Math.random() * Math.PI * 2;

            scene.add(chestMesh);

            // Store treasure data
            const treasure = {
                mesh: chestMesh,
                collected: false,
                centerX: x,
                centerZ: z,
                floatTime: Math.random() * Math.PI * 2 // Random phase for floating animation
            };

            treasures.push(treasure);
            treasurePositions.push({ x, z });
        }
    }

    return treasurePositions;
}

/**
 * Updates treasure chests (floating animation, rotation, pulsing glow)
 * @param {number} deltaTime - Time since last frame in seconds
 */
export function updateTreasures(deltaTime) {
    for (const treasure of treasures) {
        if (treasure.collected) continue;

        // Floating animation
        treasure.floatTime += deltaTime;
        const floatOffset = Math.sin(treasure.floatTime * 2) * 0.15;
        treasure.mesh.position.y = CHEST_HEIGHT + floatOffset;

        // Gentle rotation
        treasure.mesh.rotation.y += deltaTime * 0.5;

        // Pulsing glow animation (emissive materials only - no lights)
        const userData = treasure.mesh.userData;
        if (userData && userData.goldMaterial) {
            // Create a smooth pulsing effect using sin wave
            const pulseSpeed = 2.5;
            const pulse = (Math.sin(treasure.floatTime * pulseSpeed) + 1) / 2; // 0 to 1
            
            // Pulse emissive intensity on gold materials
            const baseIntensity = userData.baseEmissiveIntensity || 0.8;
            const minPulse = baseIntensity * 0.5;
            const maxPulse = baseIntensity * 1.3;
            const emissivePulse = minPulse + pulse * (maxPulse - minPulse);
            
            userData.goldMaterial.emissiveIntensity = emissivePulse;
            
            if (userData.innerGoldMaterial) {
                userData.innerGoldMaterial.emissiveIntensity = emissivePulse * 1.2;
            }
            if (userData.gemMaterial) {
                userData.gemMaterial.emissiveIntensity = 0.3 + pulse * 0.5;
            }
        }
    }
}

/**
 * Checks if player is close enough to collect a treasure
 * @param {THREE.Vector3} playerPosition - Player's position
 * @param {number} collectionRadius - How close player needs to be
 * @returns {Object|null} Collected treasure or null
 */
export function checkTreasureCollection(playerPosition, collectionRadius = 2.5) {
    for (const treasure of treasures) {
        if (treasure.collected) continue;

        const dx = treasure.mesh.position.x - playerPosition.x;
        const dz = treasure.mesh.position.z - playerPosition.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < collectionRadius) {
            return treasure;
        }
    }
    return null;
}

/**
 * Collects a treasure (removes it from scene)
 * @param {THREE.Scene} scene - Scene to remove from
 * @param {Object} treasure - Treasure to collect
 */
export function collectTreasure(scene, treasure) {
    treasure.collected = true;
    scene.remove(treasure.mesh);

    // Dispose of geometries and materials
    treasure.mesh.traverse((child) => {
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
 * Gets all treasures
 * @returns {Array} Array of treasure objects
 */
export function getTreasures() {
    return treasures;
}

/**
 * Gets count of collected treasures
 * @returns {number} Number of collected treasures
 */
export function getCollectedCount() {
    return treasures.filter(t => t.collected).length;
}

/**
 * Gets total treasure count
 * @returns {number} Total number of treasures
 */
export function getTotalCount() {
    return treasures.length;
}

/**
 * Clears all treasures (for restart)
 * @param {THREE.Scene} scene - Scene to remove treasures from
 */
export function clearAllTreasures(scene) {
    for (const treasure of treasures) {
        scene.remove(treasure.mesh);

        treasure.mesh.traverse((child) => {
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
    treasures.length = 0;
}
