/**
 * targets.js - Target spawning and management
 * Creates and manages moving box targets for the game
 */

import * as THREE from 'three';
import { randomInRange, pingPong } from './utils.js';

const targets = [];
const TARGET_HEIGHT = 0.5;
const BOSS_HEIGHT = 0.8;
const BOSS_MAX_HITS = 4; // Boss requires 4 hits to destroy

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
    
    // Enemy warship colors - visible navy palette
    const hullDark = 0x2C3E50;        // Navy blue (more visible)
    const hullMid = 0x34495E;         // Slate blue
    const metalDark = 0x2C3E50;       // Gun metal
    const accentRed = 0xC0392B;       // Brighter red stripe
    const accentGold = 0xB8860B;      // Dark gold/brass
    const glassBlue = 0x4A6FA5;       // Tinted window glass
    const smokestackBlack = 0x222222; // Near black
    const deckGray = 0x374151;        // Dark deck
    
    // ============ MAIN HULL - Simple box hull ============
    const hullGeometry = new THREE.BoxGeometry(1.6, 0.7, 3.5);
    const hullMaterial = new THREE.MeshStandardMaterial({
        color: hullDark,
        roughness: 0.6,
        metalness: 0.5
    });
    const hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    hullMesh.position.set(0, 0.35, 0);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    shipGroup.add(hullMesh);
    
    // Hull stripe (waterline) - red accent
    const stripeGeometry = new THREE.BoxGeometry(1.65, 0.15, 3.6);
    const stripeMaterial = new THREE.MeshStandardMaterial({ color: accentRed, roughness: 0.4, metalness: 0.3 });
    const stripeMesh = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripeMesh.position.set(0, 0.55, 0);
    shipGroup.add(stripeMesh);
    
    // ============ DECK ============
    const deckGeometry = new THREE.BoxGeometry(1.5, 0.08, 3.3);
    const deckMaterial = new THREE.MeshStandardMaterial({ color: deckGray, roughness: 0.75, metalness: 0.3 });
    const deckMesh = new THREE.Mesh(deckGeometry, deckMaterial);
    deckMesh.position.set(0, 0.75, 0);
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    shipGroup.add(deckMesh);
    
    // ============ BOW (FRONT) - Sharp pointed section ============
    const bowGeometry = new THREE.ConeGeometry(0.5, 1.2, 4);
    const bowMaterial = new THREE.MeshStandardMaterial({ color: hullDark, roughness: 0.6, metalness: 0.5 });
    const bowMesh = new THREE.Mesh(bowGeometry, bowMaterial);
    bowMesh.rotation.x = Math.PI / 2;
    bowMesh.rotation.z = Math.PI / 4;
    bowMesh.position.set(0, 0.35, -2.3);
    bowMesh.castShadow = true;
    shipGroup.add(bowMesh);
    
    // ============ SUPERSTRUCTURE - Modern bridge ============
    // Lower superstructure
    const superGeometry = new THREE.BoxGeometry(1.1, 0.4, 1.4);
    const superMaterial = new THREE.MeshStandardMaterial({ color: hullMid, roughness: 0.65, metalness: 0.4 });
    const superMesh = new THREE.Mesh(superGeometry, superMaterial);
    superMesh.position.set(0, 1.0, 0.2);
    superMesh.castShadow = true;
    shipGroup.add(superMesh);
    
    // Bridge deck
    const bridgeDeckGeometry = new THREE.BoxGeometry(0.85, 0.3, 1.0);
    const bridgeDeckMesh = new THREE.Mesh(bridgeDeckGeometry, superMaterial);
    bridgeDeckMesh.position.set(0, 1.35, 0.1);
    bridgeDeckMesh.castShadow = true;
    shipGroup.add(bridgeDeckMesh);
    
    // Bridge windows
    const windowMaterial = new THREE.MeshStandardMaterial({ 
        color: glassBlue, 
        roughness: 0.1, 
        metalness: 0.4,
        transparent: true,
        opacity: 0.7
    });
    
    const frontWindowGeometry = new THREE.BoxGeometry(0.7, 0.15, 0.05);
    const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    frontWindow.position.set(0, 1.4, -0.45);
    shipGroup.add(frontWindow);
    
    // ============ MAST/RADAR TOWER ============
    const mastGeometry = new THREE.CylinderGeometry(0.04, 0.05, 0.8, 6);
    const mastMaterial = new THREE.MeshStandardMaterial({ color: metalDark, roughness: 0.5, metalness: 0.7 });
    const mastMesh = new THREE.Mesh(mastGeometry, mastMaterial);
    mastMesh.position.set(0, 1.9, 0.1);
    mastMesh.castShadow = true;
    shipGroup.add(mastMesh);
    
    // Radar dish
    const radarDishGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.04, 6);
    const radarDishMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.6 });
    const radarDish = new THREE.Mesh(radarDishGeometry, radarDishMaterial);
    radarDish.position.set(0, 2.35, 0.1);
    shipGroup.add(radarDish);
    
    // ============ SMOKESTACK ============
    const stackGeometry = new THREE.CylinderGeometry(0.1, 0.14, 0.5, 6);
    const stackMaterial = new THREE.MeshStandardMaterial({ color: smokestackBlack, roughness: 0.7, metalness: 0.4 });
    const stackMesh = new THREE.Mesh(stackGeometry, stackMaterial);
    stackMesh.position.set(0, 1.25, 0.7);
    shipGroup.add(stackMesh);
    
    // Stack band (red accent)
    const bandGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 6);
    const band = new THREE.Mesh(bandGeometry, new THREE.MeshStandardMaterial({ color: accentRed, roughness: 0.5 }));
    band.position.set(0, 1.38, 0.7);
    shipGroup.add(band);
    
    // ============ WEAPONS - Main turret ============
    const turretMaterial = new THREE.MeshStandardMaterial({ color: metalDark, roughness: 0.5, metalness: 0.75 });
    const turretBaseGeometry = new THREE.CylinderGeometry(0.22, 0.25, 0.15, 6);
    const turretBase = new THREE.Mesh(turretBaseGeometry, turretMaterial);
    turretBase.position.set(0, 0.87, -1.0);
    shipGroup.add(turretBase);
    
    // Main cannon barrel
    const mainCannonGeometry = new THREE.CylinderGeometry(0.07, 0.09, 0.8, 6);
    const mainCannon = new THREE.Mesh(mainCannonGeometry, turretMaterial);
    mainCannon.rotation.x = Math.PI / 2;
    mainCannon.position.set(0, 0.95, -1.5);
    shipGroup.add(mainCannon);
    
    // Side cannons
    const sideCannonGeometry = new THREE.CylinderGeometry(0.04, 0.05, 0.4, 6);
    const leftCannon = new THREE.Mesh(sideCannonGeometry, turretMaterial);
    leftCannon.rotation.z = -Math.PI / 2;
    leftCannon.position.set(-0.75, 0.85, 0);
    shipGroup.add(leftCannon);
    
    const rightCannon = new THREE.Mesh(sideCannonGeometry, turretMaterial);
    rightCannon.rotation.z = Math.PI / 2;
    rightCannon.position.set(0.75, 0.85, 0);
    shipGroup.add(rightCannon);
    
    // ============ STERN ============
    const sternGeometry = new THREE.BoxGeometry(1.2, 0.4, 0.5);
    const sternMesh = new THREE.Mesh(sternGeometry, superMaterial);
    sternMesh.position.set(0, 0.95, 1.3);
    sternMesh.castShadow = true;
    shipGroup.add(sternMesh);
    
    // Railing
    const railGeometry = new THREE.BoxGeometry(1.3, 0.06, 0.04);
    const railMaterial = new THREE.MeshStandardMaterial({ color: metalDark, roughness: 0.5, metalness: 0.6 });
    const sternRail = new THREE.Mesh(railGeometry, railMaterial);
    sternRail.position.set(0, 1.18, 1.55);
    shipGroup.add(sternRail);
    
    
    // ============ SIDE RAILINGS ============
    for (let side = -1; side <= 1; side += 2) {
        const sideRailGeometry = new THREE.BoxGeometry(0.04, 0.06, 2.5);
        const sideRail = new THREE.Mesh(sideRailGeometry, railMaterial);
        sideRail.position.set(side * 0.72, 1.07, -0.2);  // Raised
        shipGroup.add(sideRail);
    }
    
    // ============ ENEMY FLAG ============
    const flagPoleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6);
    const flagPoleMaterial = new THREE.MeshStandardMaterial({ color: metalDark, roughness: 0.5, metalness: 0.7 });
    const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
    flagPole.position.set(0, 1.72, 1.6);  // Raised
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
    flagMesh.position.set(0.22, 1.87, 1.6);  // Raised
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
    portLight.position.set(-0.78, 0.82, -1.0);  // Raised
    shipGroup.add(portLight);
    
    const starboardLight = new THREE.Mesh(lightGeometry, greenLightMaterial);
    starboardLight.position.set(0.78, 0.82, -1.0);  // Raised
    shipGroup.add(starboardLight);
    
    // Masthead light
    const mastheadLight = new THREE.Mesh(lightGeometry, new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF, 
        emissive: 0xFFFFFF, 
        emissiveIntensity: 0.4,
        roughness: 0.3
    }));
    mastheadLight.position.set(0, 3.32, 0.1);  // Raised
    shipGroup.add(mastheadLight);
    
    // ============ DECK EQUIPMENT (simplified) ============
    // Single orange life raft for visibility
    const raftGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
    const raftMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600, roughness: 0.8 });
    const raft = new THREE.Mesh(raftGeometry, raftMaterial);
    raft.position.set(0.4, 1.44, 0.5);  // Raised
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
 * Creates a massive boss warship model (3x scale, darker, more menacing)
 * @param {THREE.Scene} scene - Scene to add the boss to
 * @param {number} x - X position
 * @param {number} z - Z position
 */
export function spawnBossShip(scene, x, z) {
    // Create a group for the boss warship
    const shipGroup = new THREE.Group();

    // Boss warship colors - dark and menacing
    const hullDark = 0x1A1A2E;        // Very dark navy
    const hullMid = 0x16213E;         // Dark blue
    const metalDark = 0x0F0F23;       // Near black metal
    const accentCrimson = 0x8B0000;   // Dark crimson
    const accentGold = 0xDAA520;      // Goldenrod
    const glassRed = 0x8B0000;        // Red tinted glass
    const smokestackBlack = 0x0A0A0A; // Pure black
    const deckDark = 0x1C1C2E;        // Very dark deck
    const fireGlow = 0xFF4500;        // Orange fire glow

    // Scale factor for the boss (3x larger)
    const scale = 3.0;

    // ============ MAIN HULL - Massive armored hull ============
    const hullGeometry = new THREE.BoxGeometry(1.6 * scale, 0.9 * scale, 4.5 * scale);
    const hullMaterial = new THREE.MeshStandardMaterial({
        color: hullDark,
        roughness: 0.5,
        metalness: 0.7
    });
    const hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    hullMesh.position.set(0, 0.45 * scale, 0);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    shipGroup.add(hullMesh);

    // Hull crimson stripe (waterline) - menacing accent
    const stripeGeometry = new THREE.BoxGeometry(1.7 * scale, 0.2 * scale, 4.6 * scale);
    const stripeMaterial = new THREE.MeshStandardMaterial({
        color: accentCrimson,
        roughness: 0.3,
        metalness: 0.4,
        emissive: accentCrimson,
        emissiveIntensity: 0.3
    });
    const stripeMesh = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripeMesh.position.set(0, 0.7 * scale, 0);
    shipGroup.add(stripeMesh);

    // ============ ARMORED DECK ============
    const deckGeometry = new THREE.BoxGeometry(1.5 * scale, 0.1 * scale, 4.2 * scale);
    const deckMaterial = new THREE.MeshStandardMaterial({ color: deckDark, roughness: 0.7, metalness: 0.4 });
    const deckMesh = new THREE.Mesh(deckGeometry, deckMaterial);
    deckMesh.position.set(0, 0.95 * scale, 0);
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    shipGroup.add(deckMesh);

    // ============ ARMORED BOW - Sharp reinforced ram ============
    const bowGeometry = new THREE.ConeGeometry(0.6 * scale, 1.8 * scale, 4);
    const bowMaterial = new THREE.MeshStandardMaterial({ color: hullDark, roughness: 0.5, metalness: 0.7 });
    const bowMesh = new THREE.Mesh(bowGeometry, bowMaterial);
    bowMesh.rotation.x = Math.PI / 2;
    bowMesh.rotation.z = Math.PI / 4;
    bowMesh.position.set(0, 0.45 * scale, -3.1 * scale);
    bowMesh.castShadow = true;
    shipGroup.add(bowMesh);

    // Ram spike
    const spikeGeometry = new THREE.ConeGeometry(0.15 * scale, 1.2 * scale, 6);
    const spikeMaterial = new THREE.MeshStandardMaterial({ color: metalDark, roughness: 0.3, metalness: 0.9 });
    const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
    spike.rotation.x = Math.PI / 2;
    spike.position.set(0, 0.45 * scale, -4.0 * scale);
    shipGroup.add(spike);

    // ============ MASSIVE SUPERSTRUCTURE ============
    // Lower superstructure
    const superGeometry = new THREE.BoxGeometry(1.3 * scale, 0.6 * scale, 2.0 * scale);
    const superMaterial = new THREE.MeshStandardMaterial({ color: hullMid, roughness: 0.55, metalness: 0.5 });
    const superMesh = new THREE.Mesh(superGeometry, superMaterial);
    superMesh.position.set(0, 1.3 * scale, 0.3 * scale);
    superMesh.castShadow = true;
    shipGroup.add(superMesh);

    // Command bridge
    const bridgeDeckGeometry = new THREE.BoxGeometry(1.0 * scale, 0.5 * scale, 1.4 * scale);
    const bridgeDeckMesh = new THREE.Mesh(bridgeDeckGeometry, superMaterial);
    bridgeDeckMesh.position.set(0, 1.85 * scale, 0.2 * scale);
    bridgeDeckMesh.castShadow = true;
    shipGroup.add(bridgeDeckMesh);

    // Bridge windows - glowing red
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: glassRed,
        roughness: 0.1,
        metalness: 0.4,
        emissive: 0xFF0000,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.8
    });

    const frontWindowGeometry = new THREE.BoxGeometry(0.85 * scale, 0.2 * scale, 0.06 * scale);
    const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    frontWindow.position.set(0, 1.95 * scale, -0.55 * scale);
    shipGroup.add(frontWindow);

    // ============ TWIN MASTS/RADAR TOWERS ============
    const mastMaterial = new THREE.MeshStandardMaterial({ color: metalDark, roughness: 0.4, metalness: 0.8 });

    for (let side = -1; side <= 1; side += 2) {
        const mastGeometry = new THREE.CylinderGeometry(0.06 * scale, 0.08 * scale, 1.2 * scale, 6);
        const mastMesh = new THREE.Mesh(mastGeometry, mastMaterial);
        mastMesh.position.set(side * 0.3 * scale, 2.7 * scale, 0.2 * scale);
        mastMesh.castShadow = true;
        shipGroup.add(mastMesh);

        // Radar dish on each mast
        const radarDishGeometry = new THREE.CylinderGeometry(0.3 * scale, 0.3 * scale, 0.06 * scale, 8);
        const radarDishMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.3,
            metalness: 0.7,
            emissive: 0xFF0000,
            emissiveIntensity: 0.2
        });
        const radarDish = new THREE.Mesh(radarDishGeometry, radarDishMaterial);
        radarDish.position.set(side * 0.3 * scale, 3.35 * scale, 0.2 * scale);
        shipGroup.add(radarDish);
    }

    // ============ TWIN SMOKESTACKS ============
    for (let side = -1; side <= 1; side += 2) {
        const stackGeometry = new THREE.CylinderGeometry(0.15 * scale, 0.2 * scale, 0.8 * scale, 8);
        const stackMaterial = new THREE.MeshStandardMaterial({ color: smokestackBlack, roughness: 0.6, metalness: 0.5 });
        const stackMesh = new THREE.Mesh(stackGeometry, stackMaterial);
        stackMesh.position.set(side * 0.4 * scale, 1.75 * scale, 1.0 * scale);
        shipGroup.add(stackMesh);

        // Fire glow at top
        const fireGeometry = new THREE.CylinderGeometry(0.12 * scale, 0.08 * scale, 0.15 * scale, 6);
        const fireMaterial = new THREE.MeshStandardMaterial({
            color: fireGlow,
            emissive: fireGlow,
            emissiveIntensity: 1.5,
            roughness: 0.5
        });
        const fire = new THREE.Mesh(fireGeometry, fireMaterial);
        fire.position.set(side * 0.4 * scale, 2.2 * scale, 1.0 * scale);
        shipGroup.add(fire);
    }

    // ============ MAIN WEAPON - MASSIVE DEATH CANNON ============
    const turretMaterial = new THREE.MeshStandardMaterial({
        color: metalDark,
        roughness: 0.4,
        metalness: 0.85,
        emissive: accentCrimson,
        emissiveIntensity: 0.2
    });

    // Main turret base
    const turretBaseGeometry = new THREE.CylinderGeometry(0.5 * scale, 0.6 * scale, 0.3 * scale, 8);
    const turretBase = new THREE.Mesh(turretBaseGeometry, turretMaterial);
    turretBase.position.set(0, 1.15 * scale, -1.5 * scale);
    shipGroup.add(turretBase);

    // Turret housing
    const turretHousingGeometry = new THREE.BoxGeometry(0.8 * scale, 0.5 * scale, 0.8 * scale);
    const turretHousing = new THREE.Mesh(turretHousingGeometry, turretMaterial);
    turretHousing.position.set(0, 1.45 * scale, -1.5 * scale);
    shipGroup.add(turretHousing);

    // MASSIVE DEATH CANNON BARREL
    const mainCannonGeometry = new THREE.CylinderGeometry(0.2 * scale, 0.25 * scale, 2.0 * scale, 8);
    const mainCannonMaterial = new THREE.MeshStandardMaterial({
        color: 0x1A1A1A,
        roughness: 0.3,
        metalness: 0.9,
        emissive: fireGlow,
        emissiveIntensity: 0.3
    });
    const mainCannon = new THREE.Mesh(mainCannonGeometry, mainCannonMaterial);
    mainCannon.rotation.x = Math.PI / 2;
    mainCannon.position.set(0, 1.55 * scale, -2.8 * scale);
    shipGroup.add(mainCannon);

    // Cannon muzzle glow
    const muzzleGeometry = new THREE.RingGeometry(0.15 * scale, 0.25 * scale, 8);
    const muzzleMaterial = new THREE.MeshStandardMaterial({
        color: fireGlow,
        emissive: fireGlow,
        emissiveIntensity: 2.0,
        side: THREE.DoubleSide
    });
    const muzzle = new THREE.Mesh(muzzleGeometry, muzzleMaterial);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 1.55 * scale, -3.85 * scale);
    shipGroup.add(muzzle);

    // Side cannons (also deadly)
    const sideCannonGeometry = new THREE.CylinderGeometry(0.08 * scale, 0.1 * scale, 0.8 * scale, 6);
    for (let i = 0; i < 3; i++) {
        const zOffset = -0.8 + i * 0.8;

        const leftCannon = new THREE.Mesh(sideCannonGeometry, turretMaterial);
        leftCannon.rotation.z = -Math.PI / 2;
        leftCannon.position.set(-0.95 * scale, 1.0 * scale, zOffset * scale);
        shipGroup.add(leftCannon);

        const rightCannon = new THREE.Mesh(sideCannonGeometry, turretMaterial);
        rightCannon.rotation.z = Math.PI / 2;
        rightCannon.position.set(0.95 * scale, 1.0 * scale, zOffset * scale);
        shipGroup.add(rightCannon);
    }

    // ============ STERN ============
    const sternGeometry = new THREE.BoxGeometry(1.4 * scale, 0.5 * scale, 0.7 * scale);
    const sternMesh = new THREE.Mesh(sternGeometry, superMaterial);
    sternMesh.position.set(0, 1.2 * scale, 1.8 * scale);
    sternMesh.castShadow = true;
    shipGroup.add(sternMesh);

    // ============ SKULL EMBLEM (front of ship) ============
    // Skull shape using spheres
    const skullMaterial = new THREE.MeshStandardMaterial({
        color: 0xDDDDDD,
        roughness: 0.6,
        emissive: 0xFF0000,
        emissiveIntensity: 0.3
    });
    const skullGeometry = new THREE.SphereGeometry(0.2 * scale, 8, 8);
    const skull = new THREE.Mesh(skullGeometry, skullMaterial);
    skull.position.set(0, 0.7 * scale, -2.25 * scale);
    skull.scale.set(1, 0.9, 0.7);
    shipGroup.add(skull);

    // Eye sockets (glowing red)
    const eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 2.0
    });
    const eyeGeometry = new THREE.SphereGeometry(0.06 * scale, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08 * scale, 0.75 * scale, -2.35 * scale);
    shipGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08 * scale, 0.75 * scale, -2.35 * scale);
    shipGroup.add(rightEye);

    // ============ BATTLE FLAG (tattered, crimson) ============
    const flagPoleGeometry = new THREE.CylinderGeometry(0.03 * scale, 0.03 * scale, 1.2 * scale, 6);
    const flagPoleMaterial = new THREE.MeshStandardMaterial({ color: metalDark, roughness: 0.4, metalness: 0.8 });
    const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
    flagPole.position.set(0, 2.8 * scale, 2.2 * scale);
    shipGroup.add(flagPole);

    // Large crimson flag
    const flagGeometry = new THREE.PlaneGeometry(0.8 * scale, 0.5 * scale, 5, 3);
    const flagPositions = flagGeometry.attributes.position;
    for (let i = 0; i < flagPositions.count; i++) {
        const x = flagPositions.getX(i);
        flagPositions.setZ(i, Math.sin(x * 3) * 0.08 * scale);
    }
    flagGeometry.computeVertexNormals();

    const flagMaterial = new THREE.MeshStandardMaterial({
        color: accentCrimson,
        roughness: 0.8,
        emissive: accentCrimson,
        emissiveIntensity: 0.2,
        side: THREE.DoubleSide
    });
    const flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
    flagMesh.position.set(0.45 * scale, 3.2 * scale, 2.2 * scale);
    flagMesh.rotation.y = Math.PI / 2;
    shipGroup.add(flagMesh);

    // ============ RUNNING LIGHTS ============
    const lightGeometry = new THREE.SphereGeometry(0.06 * scale, 8, 8);
    const redLightMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 1.0
    });

    // Port and starboard lights
    const portLight = new THREE.Mesh(lightGeometry, redLightMaterial);
    portLight.position.set(-0.95 * scale, 1.0 * scale, -2.0 * scale);
    shipGroup.add(portLight);

    const starboardLight = new THREE.Mesh(lightGeometry, redLightMaterial);
    starboardLight.position.set(0.95 * scale, 1.0 * scale, -2.0 * scale);
    shipGroup.add(starboardLight);

    // Position the boss ship
    shipGroup.position.set(x, BOSS_HEIGHT, z);
    scene.add(shipGroup);

    // Store boss target data
    const bossTarget = {
        mesh: shipGroup,
        isMoving: true,
        isBoss: true,
        // Movement parameters - boss patrols back and forth
        patrolCenterX: x,
        patrolCenterZ: z,
        patrolRadius: 12,
        patrolAngle: 0,
        patrolSpeed: 0.15, // Slower than regular ships
        orbitAngle: 0, // For compatibility with update function
        originalColor: hullMaterial.color.clone(),
        hullMaterial: hullMaterial,
        hitTime: 0,
        hits: 0,
        maxHits: BOSS_MAX_HITS,
        // Boss shooting parameters - DEADLY triple shot with expanded range
        detectionRadius: 45, // Much longer range
        shootCooldown: 0,
        shootInterval: 3.5, // Fires every 3.5 seconds
        isOneShot: true, // Boss cannon is instant kill
        tripleShot: true // Boss fires 3 projectiles in spread pattern
    };

    targets.push(bossTarget);
    return bossTarget;
}

/**
 * Updates all targets (movement, hit animations, shooting)
 * @param {number} deltaTime - Time since last frame in seconds
 * @param {THREE.Vector3} playerPosition - Player ship position
 * @param {Function} shootCallback - Callback function to spawn enemy projectile
 */
export function updateTargets(deltaTime, playerPosition = null, shootCallback = null, bossShootCallback = null) {
    const currentTime = performance.now() / 1000;

    for (const target of targets) {
        // Skip destroyed targets
        if (target.destroyed) continue;

        if (target.isMoving) {
            if (target.isBoss) {
                // Boss ship patrol movement - figure-8 pattern
                target.patrolAngle += target.patrolSpeed * deltaTime;

                const x = target.patrolCenterX + Math.sin(target.patrolAngle) * target.patrolRadius;
                const z = target.patrolCenterZ + Math.sin(target.patrolAngle * 2) * (target.patrolRadius * 0.5);

                target.mesh.position.x = x;
                target.mesh.position.z = z;
                target.mesh.position.y = BOSS_HEIGHT;

                // Boss faces the direction of movement
                const moveAngle = Math.atan2(
                    Math.cos(target.patrolAngle) * target.patrolRadius,
                    Math.cos(target.patrolAngle * 2) * target.patrolRadius
                );
                target.mesh.rotation.y = moveAngle;
            } else {
                // Regular ship orbit movement
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
                direction.y = target.isBoss ? 0.15 : 0.2; // Boss has flatter trajectory
                direction.normalize();

                // Get cannon position
                const cannonHeight = target.isBoss ? 4.5 : 0.6;
                const cannonPos = new THREE.Vector3(
                    target.mesh.position.x,
                    target.mesh.position.y + cannonHeight,
                    target.mesh.position.z
                );

                // Boss uses special one-shot callback with triple shot
                if (target.isBoss && bossShootCallback) {
                    if (target.tripleShot) {
                        // Fire triple shot in spread pattern
                        const spreadAngle = 0.15; // Radians (~8.5 degrees)

                        // Center shot
                        bossShootCallback(cannonPos.clone(), direction.clone());

                        // Left shot
                        const leftDir = direction.clone();
                        leftDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);
                        bossShootCallback(cannonPos.clone(), leftDir);

                        // Right shot
                        const rightDir = direction.clone();
                        rightDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), -spreadAngle);
                        bossShootCallback(cannonPos.clone(), rightDir);
                    } else {
                        bossShootCallback(cannonPos, direction);
                    }
                } else if (shootCallback) {
                    shootCallback(cannonPos, direction);
                }

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

