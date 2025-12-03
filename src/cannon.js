/**
 * cannon.js - Cannon creation and aiming mechanics
 * Creates a detailed 3D pirate ship with cannon
 */

import * as THREE from 'three';
import { degToRad, clamp } from './utils.js';

let cannonBase, cannonBarrel, cannonGroup;

// Aiming constraints
const MIN_PITCH = 5;  // degrees
const MAX_PITCH = 70; // degrees

/**
 * Creates a detailed pirate ship from primitive geometries
 * @param {THREE.Scene} scene - The scene to add the ship to
 * @returns {Object} Ship components
 */
export function createCannon(scene) {
    cannonGroup = new THREE.Group();
    
    // Create base (yaw rotation) - this is the pirate ship hull
    cannonBase = new THREE.Group();
    
    // Ship colors - rich, warm palette
    const hullDark = 0x2D1810;      // Very dark brown for hull
    const hullMid = 0x5C3A21;       // Medium wood brown
    const deckWood = 0x8B6914;      // Golden deck planks
    const trimGold = 0xD4AF37;      // Gold trim
    const sailCream = 0xFFF5E1;     // Off-white sails
    const ropeColor = 0x8B7355;     // Rope tan
    const cannonMetal = 0x2A2A2A;   // Dark iron
    const brassAccent = 0xB8860B;   // Brass accents
    
    // ============ HULL ============
    // Main hull body - tapered shape using custom geometry
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-1.2, 0);
    hullShape.lineTo(-1.4, 0.3);
    hullShape.lineTo(-1.3, 0.7);
    hullShape.lineTo(1.3, 0.7);
    hullShape.lineTo(1.4, 0.3);
    hullShape.lineTo(1.2, 0);
    hullShape.lineTo(-1.2, 0);
    
    const hullExtrudeSettings = { depth: 5, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.05 };
    const hullGeometry = new THREE.ExtrudeGeometry(hullShape, hullExtrudeSettings);
    const hullMaterial = new THREE.MeshStandardMaterial({
        color: hullDark,
        roughness: 0.85,
        metalness: 0.05
    });
    const hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    hullMesh.rotation.x = Math.PI / 2;
    hullMesh.position.set(0, 0.35, 2.5);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    cannonBase.add(hullMesh);
    
    // Hull stripe/trim
    const stripeGeometry = new THREE.BoxGeometry(2.9, 0.12, 5.2);
    const stripeMaterial = new THREE.MeshStandardMaterial({ color: trimGold, roughness: 0.4, metalness: 0.6 });
    const stripeMesh = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripeMesh.position.set(0, 0.55, 0);
    stripeMesh.castShadow = true;
    cannonBase.add(stripeMesh);
    
    // ============ DECK ============
    const deckGeometry = new THREE.BoxGeometry(2.4, 0.15, 4.8);
    const deckMaterial = new THREE.MeshStandardMaterial({
        color: deckWood,
        roughness: 0.75,
        metalness: 0.0
    });
    const deckMesh = new THREE.Mesh(deckGeometry, deckMaterial);
    deckMesh.position.y = 0.85;
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    cannonBase.add(deckMesh);
    
    // Deck planks (visual detail)
    for (let i = -4; i <= 4; i++) {
        const plankLine = new THREE.BoxGeometry(0.02, 0.02, 4.6);
        const plankMat = new THREE.MeshStandardMaterial({ color: 0x4A3520, roughness: 0.9 });
        const plank = new THREE.Mesh(plankLine, plankMat);
        plank.position.set(i * 0.26, 0.94, 0);
        cannonBase.add(plank);
    }
    
    // ============ BOW (FRONT) - Ornate pointed section ============
    const bowGeometry = new THREE.ConeGeometry(0.8, 1.8, 4);
    const bowMaterial = new THREE.MeshStandardMaterial({ color: hullDark, roughness: 0.85 });
    const bowMesh = new THREE.Mesh(bowGeometry, bowMaterial);
    bowMesh.rotation.x = Math.PI / 2;
    bowMesh.rotation.z = Math.PI / 4;
    bowMesh.position.set(0, 0.5, -3.3);
    bowMesh.castShadow = true;
    cannonBase.add(bowMesh);
    
    // Bowsprit (front pole)
    const bowspritGeometry = new THREE.CylinderGeometry(0.06, 0.08, 2.5, 8);
    const bowspritMaterial = new THREE.MeshStandardMaterial({ color: hullMid, roughness: 0.7 });
    const bowspritMesh = new THREE.Mesh(bowspritGeometry, bowspritMaterial);
    bowspritMesh.rotation.x = Math.PI / 2 + 0.2;
    bowspritMesh.position.set(0, 1.1, -3.8);
    bowspritMesh.castShadow = true;
    cannonBase.add(bowspritMesh);
    
    // Figurehead (gold ornament)
    const figureheadGeometry = new THREE.ConeGeometry(0.15, 0.5, 6);
    const figureheadMaterial = new THREE.MeshStandardMaterial({ color: trimGold, roughness: 0.3, metalness: 0.7 });
    const figureheadMesh = new THREE.Mesh(figureheadGeometry, figureheadMaterial);
    figureheadMesh.rotation.x = Math.PI / 2;
    figureheadMesh.position.set(0, 0.7, -4.0);
    figureheadMesh.castShadow = true;
    cannonBase.add(figureheadMesh);
    
    // ============ STERN (BACK) - Captain's quarters ============
    const sternGeometry = new THREE.BoxGeometry(2.3, 1.2, 1.5);
    const sternMaterial = new THREE.MeshStandardMaterial({ color: hullMid, roughness: 0.75 });
    const sternMesh = new THREE.Mesh(sternGeometry, sternMaterial);
    sternMesh.position.set(0, 1.2, 2.0);
    sternMesh.castShadow = true;
    sternMesh.receiveShadow = true;
    cannonBase.add(sternMesh);
    
    // Stern windows (captain's cabin)
    for (let i = -1; i <= 1; i++) {
        const windowGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.1);
        const windowMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x87CEEB, 
            roughness: 0.1, 
            metalness: 0.3,
            transparent: true,
            opacity: 0.7
        });
        const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
        windowMesh.position.set(i * 0.55, 1.3, 2.8);
        cannonBase.add(windowMesh);
        
        // Window frame
        const frameGeometry = new THREE.BoxGeometry(0.45, 0.45, 0.05);
        const frameMaterial = new THREE.MeshStandardMaterial({ color: trimGold, roughness: 0.4, metalness: 0.5 });
        const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
        frameMesh.position.set(i * 0.55, 1.3, 2.82);
        cannonBase.add(frameMesh);
    }
    
    // Stern railing
    const sternRailGeometry = new THREE.BoxGeometry(2.4, 0.15, 0.1);
    const sternRailMesh = new THREE.Mesh(sternRailGeometry, new THREE.MeshStandardMaterial({ color: hullMid, roughness: 0.8 }));
    sternRailMesh.position.set(0, 1.9, 2.75);
    sternRailMesh.castShadow = true;
    cannonBase.add(sternRailMesh);
    
    // ============ SIDE RAILINGS WITH POSTS ============
    const railMaterial = new THREE.MeshStandardMaterial({ color: hullMid, roughness: 0.8 });
    
    // Left railing
    const leftRailGeometry = new THREE.BoxGeometry(0.08, 0.35, 4.5);
    const leftRail = new THREE.Mesh(leftRailGeometry, railMaterial);
    leftRail.position.set(-1.15, 1.1, -0.1);
    leftRail.castShadow = true;
    cannonBase.add(leftRail);
    
    // Right railing
    const rightRail = new THREE.Mesh(leftRailGeometry, railMaterial);
    rightRail.position.set(1.15, 1.1, -0.1);
    rightRail.castShadow = true;
    cannonBase.add(rightRail);
    
    // Railing posts
    for (let i = -3; i <= 2; i++) {
        const postGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6);
        const leftPost = new THREE.Mesh(postGeometry, railMaterial);
        leftPost.position.set(-1.15, 1.15, i * 0.75);
        leftPost.castShadow = true;
        cannonBase.add(leftPost);
        
        const rightPost = new THREE.Mesh(postGeometry, railMaterial);
        rightPost.position.set(1.15, 1.15, i * 0.75);
        rightPost.castShadow = true;
        cannonBase.add(rightPost);
    }
    
    // ============ MAIN MAST (shorter for better cannon visibility) ============
    const mastGeometry = new THREE.CylinderGeometry(0.08, 0.12, 2.8, 12);
    const mastMaterial = new THREE.MeshStandardMaterial({ color: hullMid, roughness: 0.75 });
    const mastMesh = new THREE.Mesh(mastGeometry, mastMaterial);
    mastMesh.position.set(0, 2.3, 0.3);
    mastMesh.castShadow = true;
    cannonBase.add(mastMesh);
    
    // ============ MAIN SAIL (smaller, positioned to not block cannon) ============
    const sailGeometry = new THREE.PlaneGeometry(1.8, 1.6, 8, 8);
    // Add some curve to the sail
    const sailPositions = sailGeometry.attributes.position;
    for (let i = 0; i < sailPositions.count; i++) {
        const x = sailPositions.getX(i);
        const y = sailPositions.getY(i);
        const bulge = Math.sin((x / 0.9 + 0.5) * Math.PI) * 0.35;
        sailPositions.setZ(i, bulge);
    }
    sailGeometry.computeVertexNormals();
    
    const sailMaterial = new THREE.MeshStandardMaterial({ 
        color: sailCream, 
        roughness: 0.9, 
        metalness: 0.0,
        side: THREE.DoubleSide
    });
    const sailMesh = new THREE.Mesh(sailGeometry, sailMaterial);
    sailMesh.position.set(0, 2.5, 0.1);
    sailMesh.castShadow = true;
    sailMesh.receiveShadow = true;
    cannonBase.add(sailMesh);
    
    // Sail cross beam (yard) - top
    const yardGeometry = new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8);
    const yardMesh = new THREE.Mesh(yardGeometry, mastMaterial);
    yardMesh.rotation.z = Math.PI / 2;
    yardMesh.position.set(0, 3.3, 0.3);
    yardMesh.castShadow = true;
    cannonBase.add(yardMesh);
    
    // Lower yard
    const lowerYardMesh = new THREE.Mesh(yardGeometry, mastMaterial);
    lowerYardMesh.rotation.z = Math.PI / 2;
    lowerYardMesh.position.set(0, 1.7, 0.3);
    lowerYardMesh.castShadow = true;
    cannonBase.add(lowerYardMesh);
    
    // ============ PIRATE FLAG (on top of mast) ============
    const flagGeometry = new THREE.PlaneGeometry(0.6, 0.4, 4, 3);
    // Wave the flag slightly
    const flagPositions = flagGeometry.attributes.position;
    for (let i = 0; i < flagPositions.count; i++) {
        const x = flagPositions.getX(i);
        flagPositions.setZ(i, Math.sin(x * 3) * 0.06);
    }
    flagGeometry.computeVertexNormals();
    
    const flagMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.95,
        side: THREE.DoubleSide
    });
    const flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
    flagMesh.position.set(0.35, 3.55, 0.3);
    flagMesh.rotation.y = Math.PI / 2;
    flagMesh.castShadow = true;
    cannonBase.add(flagMesh);
    
    // Skull and crossbones on flag
    const skullGeometry = new THREE.SphereGeometry(0.07, 12, 12);
    const skullMaterial = new THREE.MeshStandardMaterial({ color: 0xE8E8E8, roughness: 0.6 });
    const skullMesh = new THREE.Mesh(skullGeometry, skullMaterial);
    skullMesh.position.set(0.32, 3.57, 0.3);
    skullMesh.castShadow = true;
    cannonBase.add(skullMesh);
    
    // Crossbones
    const boneGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6);
    const boneMaterial = new THREE.MeshStandardMaterial({ color: 0xE8E8E8, roughness: 0.6 });
    const bone1 = new THREE.Mesh(boneGeometry, boneMaterial);
    bone1.rotation.z = Math.PI / 4;
    bone1.position.set(0.32, 3.45, 0.3);
    cannonBase.add(bone1);
    const bone2 = new THREE.Mesh(boneGeometry, boneMaterial);
    bone2.rotation.z = -Math.PI / 4;
    bone2.position.set(0.32, 3.45, 0.3);
    cannonBase.add(bone2);
    
    // ============ RIGGING (ROPES) - shorter ============
    const ropeMaterial = new THREE.MeshBasicMaterial({ color: ropeColor });
    
    // Shrouds (side ropes)
    for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 2; i++) {
            const ropeGeometry = new THREE.CylinderGeometry(0.012, 0.012, 2.0, 4);
            const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
            rope.position.set(side * (0.8 - i * 0.15), 2.0, 0.4 - i * 0.2);
            rope.rotation.z = side * 0.35;
            rope.rotation.x = -0.1 + i * 0.05;
            cannonBase.add(rope);
        }
    }
    
    // ============ CANNON (on swivel mount) ============
    cannonBarrel = new THREE.Group();
    
    // Cannon carriage (wooden base)
    const carriageGeometry = new THREE.BoxGeometry(0.6, 0.25, 1.2);
    const carriageMaterial = new THREE.MeshStandardMaterial({ color: hullMid, roughness: 0.8 });
    const carriageMesh = new THREE.Mesh(carriageGeometry, carriageMaterial);
    carriageMesh.position.set(0, -0.15, -0.3);
    carriageMesh.castShadow = true;
    cannonBarrel.add(carriageMesh);
    
    // Cannon barrel - more detailed
    const barrelGeometry = new THREE.CylinderGeometry(0.18, 0.24, 2.2, 16);
    const barrelMaterial = new THREE.MeshStandardMaterial({
        color: cannonMetal,
        roughness: 0.5,
        metalness: 0.85
    });
    const barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrelMesh.rotation.x = -Math.PI / 2;
    barrelMesh.position.z = -1.1;
    barrelMesh.castShadow = true;
    cannonBarrel.add(barrelMesh);
    
    // Cannon muzzle (flared end)
    const muzzleGeometry = new THREE.CylinderGeometry(0.24, 0.2, 0.25, 16);
    const muzzleMesh = new THREE.Mesh(muzzleGeometry, barrelMaterial);
    muzzleMesh.rotation.x = -Math.PI / 2;
    muzzleMesh.position.z = -2.35;
    muzzleMesh.castShadow = true;
    cannonBarrel.add(muzzleMesh);
    
    // Cannon rings (decorative bands)
    for (let i = 0; i < 3; i++) {
        const ringGeometry = new THREE.TorusGeometry(0.21, 0.03, 8, 16);
        const ringMaterial = new THREE.MeshStandardMaterial({ color: brassAccent, roughness: 0.3, metalness: 0.8 });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.y = Math.PI / 2;
        ring.position.z = -0.5 - i * 0.6;
        ring.castShadow = true;
        cannonBarrel.add(ring);
    }
    
    // Cannon breech (back end)
    const breechGeometry = new THREE.SphereGeometry(0.22, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const breechMesh = new THREE.Mesh(breechGeometry, barrelMaterial);
    breechMesh.rotation.x = Math.PI / 2;
    breechMesh.position.z = 0.1;
    breechMesh.castShadow = true;
    cannonBarrel.add(breechMesh);
    
    // Cannon wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 12);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: hullMid, roughness: 0.8 });
    const wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel1.rotation.z = Math.PI / 2;
    wheel1.position.set(-0.38, -0.2, -0.5);
    wheel1.castShadow = true;
    cannonBarrel.add(wheel1);
    
    const wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel2.rotation.z = Math.PI / 2;
    wheel2.position.set(0.38, -0.2, -0.5);
    wheel2.castShadow = true;
    cannonBarrel.add(wheel2);
    
    // Wheel spokes
    for (let w = 0; w < 2; w++) {
        const xPos = w === 0 ? -0.38 : 0.38;
        for (let i = 0; i < 4; i++) {
            const spokeGeometry = new THREE.BoxGeometry(0.02, 0.38, 0.02);
            const spoke = new THREE.Mesh(spokeGeometry, new THREE.MeshStandardMaterial({ color: hullDark }));
            spoke.rotation.z = Math.PI / 2;
            spoke.rotation.y = (i / 4) * Math.PI;
            spoke.position.set(xPos, -0.2, -0.5);
            cannonBarrel.add(spoke);
        }
    }
    
    // Position cannon on ship deck (front area)
    cannonBarrel.position.set(0, 1.0, -1.5);
    
    // ============ DECORATIVE ELEMENTS ============
    // Lanterns on stern
    for (let side = -1; side <= 1; side += 2) {
        const lanternGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.25, 8);
        const lanternMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFD700, 
            roughness: 0.2, 
            metalness: 0.6,
            emissive: 0xFFAA00,
            emissiveIntensity: 0.3
        });
        const lantern = new THREE.Mesh(lanternGeometry, lanternMaterial);
        lantern.position.set(side * 1.0, 1.7, 2.6);
        lantern.castShadow = true;
        cannonBase.add(lantern);
    }
    
    // Anchor (decorative, on side)
    const anchorRingGeometry = new THREE.TorusGeometry(0.15, 0.03, 8, 12);
    const anchorMaterial = new THREE.MeshStandardMaterial({ color: cannonMetal, roughness: 0.5, metalness: 0.8 });
    const anchorRing = new THREE.Mesh(anchorRingGeometry, anchorMaterial);
    anchorRing.position.set(-1.35, 0.5, -1.5);
    anchorRing.rotation.y = Math.PI / 2;
    cannonBase.add(anchorRing);
    
    // Barrel (cargo) on deck
    const cargoBarrelGeometry = new THREE.CylinderGeometry(0.2, 0.22, 0.4, 12);
    const cargoBarrelMaterial = new THREE.MeshStandardMaterial({ color: hullMid, roughness: 0.9 });
    const cargoBarrel = new THREE.Mesh(cargoBarrelGeometry, cargoBarrelMaterial);
    cargoBarrel.position.set(0.7, 1.1, 1.0);
    cargoBarrel.castShadow = true;
    cannonBase.add(cargoBarrel);
    
    // Coiled rope on deck
    const coilGeometry = new THREE.TorusGeometry(0.18, 0.04, 6, 24);
    const coilMaterial = new THREE.MeshStandardMaterial({ color: ropeColor, roughness: 0.95 });
    const coil = new THREE.Mesh(coilGeometry, coilMaterial);
    coil.rotation.x = Math.PI / 2;
    coil.position.set(-0.7, 1.0, 0.8);
    cannonBase.add(coil);
    
    // Assemble hierarchy
    cannonBase.add(cannonBarrel);
    cannonGroup.add(cannonBase);
    
    // Position ship at origin on water
    cannonGroup.position.set(0, 0, 0);
    
    scene.add(cannonGroup);
    
    return { cannonGroup, cannonBase, cannonBarrel };
}

/**
 * Sets the yaw and pitch of the cannon
 * @param {number} yaw - Rotation around Y axis in radians (relative to ship)
 * @param {number} pitch - Rotation around X axis in degrees
 */
export function setYawPitch(yaw, pitch) {
    // Clamp pitch to valid range
    const clampedPitch = clamp(pitch, MIN_PITCH, MAX_PITCH);

    // Apply rotations
    // Yaw rotates the cannon base left/right RELATIVE to the ship
    // The ship itself is rotated via cannonGroup.rotation.y in input.js
    cannonBase.rotation.y = yaw;
    // Pitch rotates the barrel up/down (positive pitch = aim up)
    cannonBarrel.rotation.x = degToRad(clampedPitch);
}

/**
 * Gets the muzzle position in world coordinates
 * @returns {THREE.Vector3} World position of cannon muzzle
 */
export function getMuzzlePosition() {
    const muzzleOffset = new THREE.Vector3(0, 0, -2.2);
    cannonBarrel.localToWorld(muzzleOffset);
    return muzzleOffset;
}

/**
 * Gets the firing direction vector
 * @returns {THREE.Vector3} Normalized direction vector
 */
export function getFiringDirection() {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(cannonBarrel.getWorldQuaternion(new THREE.Quaternion()));
    return direction.normalize();
}

/**
 * Export cannon components
 */
export { cannonBase, cannonBarrel, cannonGroup };

