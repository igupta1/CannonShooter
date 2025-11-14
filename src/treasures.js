/**
 * treasures.js - Treasure chest spawning and collection
 * Creates treasure chests for the player to collect
 */

import * as THREE from 'three';

const treasures = [];
const CHEST_HEIGHT = 0.5; // Height above water surface

/**
 * Creates a treasure chest 3D model
 * @returns {THREE.Group} Chest group
 */
function createChestModel() {
    const chestGroup = new THREE.Group();

    // Chest colors
    const woodBrown = 0x8B4513;
    const goldColor = 0xFFD700;
    const darkWood = 0x654321;

    // Main chest body (bottom part)
    const bodyGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: woodBrown,
        roughness: 0.8,
        metalness: 0.2
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = 0.4;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    chestGroup.add(bodyMesh);

    // Chest lid (top part)
    const lidGeometry = new THREE.BoxGeometry(1.2, 0.4, 0.8);
    const lidMaterial = new THREE.MeshStandardMaterial({
        color: darkWood,
        roughness: 0.7,
        metalness: 0.2
    });
    const lidMesh = new THREE.Mesh(lidGeometry, lidMaterial);
    lidMesh.position.y = 1.0;
    lidMesh.castShadow = true;
    chestGroup.add(lidMesh);

    // Gold trim/lock on front
    const lockGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.15);
    const lockMaterial = new THREE.MeshStandardMaterial({
        color: goldColor,
        roughness: 0.3,
        metalness: 0.9
    });
    const lockMesh = new THREE.Mesh(lockGeometry, lockMaterial);
    lockMesh.position.set(0, 0.4, 0.5);
    lockMesh.castShadow = true;
    chestGroup.add(lockMesh);

    // Gold bands (horizontal)
    const bandGeometry = new THREE.BoxGeometry(1.3, 0.1, 0.85);
    const band1 = new THREE.Mesh(bandGeometry, lockMaterial);
    band1.position.y = 0.3;
    band1.castShadow = true;
    chestGroup.add(band1);

    const band2 = new THREE.Mesh(bandGeometry, lockMaterial);
    band2.position.y = 0.7;
    band2.castShadow = true;
    chestGroup.add(band2);

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
 * Updates treasure chests (floating animation, rotation)
 * @param {number} deltaTime - Time since last frame in seconds
 */
export function updateTreasures(deltaTime) {
    for (const treasure of treasures) {
        if (treasure.collected) continue;

        // Floating animation
        treasure.floatTime += deltaTime;
        const floatOffset = Math.sin(treasure.floatTime * 2) * 0.1;
        treasure.mesh.position.y = CHEST_HEIGHT + floatOffset;

        // Gentle rotation
        treasure.mesh.rotation.y += deltaTime * 0.5;
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
