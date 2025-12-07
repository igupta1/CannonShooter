/**
 * treasures.js - Treasure chest spawning and collection
 * Creates treasure chests for the player to collect
 */

import * as THREE from 'three';

const treasures = [];
const CHEST_HEIGHT = 0.8;
const MEGA_CHEST_HEIGHT = 1.2;

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
 * Creates a mega treasure chest 3D model (larger, more ornate, purple/diamond themed)
 * @returns {Object} Chest group and materials for animation
 */
function createMegaChestModel() {
    const chestGroup = new THREE.Group();

    // Mega chest color palette - purple/diamond theme
    const darkPurple = 0x2D1B4E;
    const richPurple = 0x6B3FA0;
    const diamondColor = 0x00FFFF;
    const brightDiamond = 0xADFFFF;
    const platinumColor = 0xE5E4E2;

    // ============ CHEST BODY (larger) ============
    const bodyGeometry = new THREE.BoxGeometry(2.2, 1.4, 1.6);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: richPurple,
        roughness: 0.5,
        metalness: 0.3
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = 0.7;
    bodyMesh.castShadow = true;
    chestGroup.add(bodyMesh);

    // Inner diamond glow (glowing interior)
    const innerRimGeometry = new THREE.BoxGeometry(1.9, 0.2, 1.3);
    const innerDiamondMaterial = new THREE.MeshStandardMaterial({
        color: brightDiamond,
        roughness: 0.1,
        metalness: 0.9,
        emissive: diamondColor,
        emissiveIntensity: 1.5
    });
    const innerRim = new THREE.Mesh(innerRimGeometry, innerDiamondMaterial);
    innerRim.position.y = 1.45;
    chestGroup.add(innerRim);

    // ============ DOMED LID (larger) ============
    const lidCurveGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2.0, 12, 1, false, 0, Math.PI);
    const lidMaterial = new THREE.MeshStandardMaterial({
        color: darkPurple,
        roughness: 0.5,
        metalness: 0.4
    });
    const lidMesh = new THREE.Mesh(lidCurveGeometry, lidMaterial);
    lidMesh.rotation.z = Math.PI / 2;
    lidMesh.rotation.y = Math.PI / 2;
    lidMesh.position.set(0, 1.5, 0);
    lidMesh.castShadow = true;
    chestGroup.add(lidMesh);

    // ============ PLATINUM TRIM ============
    const platinumMaterial = new THREE.MeshStandardMaterial({
        color: platinumColor,
        roughness: 0.15,
        metalness: 0.98,
        emissive: diamondColor,
        emissiveIntensity: 0.6
    });

    // Platinum bands (3 horizontal)
    const bandGeometry = new THREE.BoxGeometry(2.35, 0.15, 1.75);
    const band1 = new THREE.Mesh(bandGeometry, platinumMaterial);
    band1.position.y = 0.25;
    chestGroup.add(band1);

    const band2 = new THREE.Mesh(bandGeometry, platinumMaterial);
    band2.position.y = 0.7;
    chestGroup.add(band2);

    const band3 = new THREE.Mesh(bandGeometry, platinumMaterial);
    band3.position.y = 1.15;
    chestGroup.add(band3);

    // ============ LOCK (larger, ornate) ============
    const lockGeometry = new THREE.BoxGeometry(0.5, 0.65, 0.15);
    const lockMesh = new THREE.Mesh(lockGeometry, platinumMaterial);
    lockMesh.position.set(0, 0.75, 0.88);
    chestGroup.add(lockMesh);

    // Lock hasp (larger)
    const haspGeometry = new THREE.TorusGeometry(0.15, 0.05, 6, 10, Math.PI);
    const hasp = new THREE.Mesh(haspGeometry, platinumMaterial);
    hasp.rotation.z = Math.PI;
    hasp.position.set(0, 1.15, 0.88);
    chestGroup.add(hasp);

    // ============ CORNER DIAMONDS ============
    const diamondGemMaterial = new THREE.MeshStandardMaterial({
        color: diamondColor,
        roughness: 0.05,
        metalness: 0.2,
        emissive: diamondColor,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.9
    });

    const diamondGeometry = new THREE.OctahedronGeometry(0.18, 0);
    const cornerPositions = [
        [-0.95, 0.3, 0.65], [0.95, 0.3, 0.65],
        [-0.95, 0.3, -0.65], [0.95, 0.3, -0.65],
        [-0.95, 1.1, 0.65], [0.95, 1.1, 0.65],
        [-0.95, 1.1, -0.65], [0.95, 1.1, -0.65]
    ];

    for (const pos of cornerPositions) {
        const diamond = new THREE.Mesh(diamondGeometry, diamondGemMaterial);
        diamond.position.set(pos[0], pos[1], pos[2]);
        diamond.rotation.y = Math.PI / 4;
        chestGroup.add(diamond);
    }

    // ============ CENTER CROWN GEM (large diamond on top) ============
    const crownGemGeometry = new THREE.OctahedronGeometry(0.3, 1);
    const crownGem = new THREE.Mesh(crownGemGeometry, diamondGemMaterial);
    crownGem.position.set(0, 2.1, 0);
    crownGem.rotation.y = Math.PI / 4;
    chestGroup.add(crownGem);

    // ============ FLOATING PARTICLES (diamond sparkles) ============
    const sparkleGeometry = new THREE.SphereGeometry(0.06, 6, 6);
    const sparkleMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: diamondColor,
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 0.8
    });

    for (let i = 0; i < 6; i++) {
        const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial.clone());
        const angle = (i / 6) * Math.PI * 2;
        sparkle.position.set(
            Math.cos(angle) * 1.4,
            1.5 + Math.sin(i * 1.5) * 0.3,
            Math.sin(angle) * 1.4
        );
        sparkle.userData.sparkleAngle = angle;
        sparkle.userData.sparkleHeight = sparkle.position.y;
        chestGroup.add(sparkle);
    }

    // Store references for animation
    chestGroup.userData = {
        goldMaterial: platinumMaterial,
        innerGoldMaterial: innerDiamondMaterial,
        gemMaterial: diamondGemMaterial,
        baseEmissiveIntensity: 0.6,
        isMegaChest: true
    };

    return chestGroup;
}

/**
 * Spawns treasure chests in a grid pattern, including one mega chest
 * @param {THREE.Scene} scene - Scene to add chests to
 * @param {number} count - Number of regular treasures to spawn
 * @returns {Object} Object with treasurePositions array and megaChestPosition
 */
export function spawnTreasures(scene, count) {
    // Clear existing treasures
    clearAllTreasures(scene);

    const treasurePositions = [];
    let megaChestPosition = null;

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
            const z = 0 - (row * spacing) + gridDepthHalf; // Moved much closer to player

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
                floatTime: Math.random() * Math.PI * 2, // Random phase for floating animation
                isMegaChest: false
            };

            treasures.push(treasure);
            treasurePositions.push({ x, z });
        }
    }

    // Spawn mega chest at a special location (behind regular chests but on playable map)
    const megaChestMesh = createMegaChestModel();
    const megaX = 0;
    const megaZ = 0 - (numRows * spacing) - 10; // Behind regular chests

    megaChestMesh.position.set(megaX, MEGA_CHEST_HEIGHT, megaZ);
    megaChestMesh.rotation.y = 0;
    scene.add(megaChestMesh);

    const megaTreasure = {
        mesh: megaChestMesh,
        collected: false,
        centerX: megaX,
        centerZ: megaZ,
        floatTime: 0,
        isMegaChest: true
    };

    treasures.push(megaTreasure);
    megaChestPosition = { x: megaX, z: megaZ };

    return { treasurePositions, megaChestPosition };
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

        const baseHeight = treasure.isMegaChest ? MEGA_CHEST_HEIGHT : CHEST_HEIGHT;
        const floatAmplitude = treasure.isMegaChest ? 0.25 : 0.15;
        const floatOffset = Math.sin(treasure.floatTime * 2) * floatAmplitude;
        treasure.mesh.position.y = baseHeight + floatOffset;

        // Gentle rotation (mega chest rotates slower)
        const rotationSpeed = treasure.isMegaChest ? 0.3 : 0.5;
        treasure.mesh.rotation.y += deltaTime * rotationSpeed;

        // Pulsing glow animation (emissive materials only - no lights)
        const userData = treasure.mesh.userData;
        if (userData && userData.goldMaterial) {
            // Create a smooth pulsing effect using sin wave
            const pulseSpeed = treasure.isMegaChest ? 3.5 : 2.5;
            const pulse = (Math.sin(treasure.floatTime * pulseSpeed) + 1) / 2; // 0 to 1

            // Pulse emissive intensity on gold materials
            const baseIntensity = userData.baseEmissiveIntensity || 0.8;
            const minPulse = baseIntensity * 0.5;
            const maxPulse = baseIntensity * (treasure.isMegaChest ? 1.8 : 1.3);
            const emissivePulse = minPulse + pulse * (maxPulse - minPulse);

            userData.goldMaterial.emissiveIntensity = emissivePulse;

            if (userData.innerGoldMaterial) {
                userData.innerGoldMaterial.emissiveIntensity = emissivePulse * (treasure.isMegaChest ? 1.5 : 1.2);
            }
            if (userData.gemMaterial) {
                userData.gemMaterial.emissiveIntensity = 0.3 + pulse * (treasure.isMegaChest ? 1.0 : 0.5);
            }
        }

        // Special mega chest sparkle animation
        if (treasure.isMegaChest) {
            treasure.mesh.traverse((child) => {
                if (child.userData && child.userData.sparkleAngle !== undefined) {
                    // Orbit the sparkles around the chest
                    const newAngle = child.userData.sparkleAngle + treasure.floatTime * 0.8;
                    child.position.x = Math.cos(newAngle) * 1.4;
                    child.position.z = Math.sin(newAngle) * 1.4;
                    child.position.y = child.userData.sparkleHeight + Math.sin(treasure.floatTime * 3 + child.userData.sparkleAngle) * 0.4;
                }
            });
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
