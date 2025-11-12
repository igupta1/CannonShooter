/**
 * cannon.js - Cannon creation and aiming mechanics
 * Creates a 3D cannon that can rotate for aiming
 */

import * as THREE from 'three';
import { degToRad, clamp } from './utils.js';

let cannonBase, cannonBarrel, cannonGroup;

// Aiming constraints
const MIN_PITCH = 5;  // degrees
const MAX_PITCH = 70; // degrees

/**
 * Creates a pirate ship from primitive geometries
 * @param {THREE.Scene} scene - The scene to add the ship to
 * @returns {Object} Ship components
 */
export function createCannon(scene) {
    cannonGroup = new THREE.Group();
    
    // Create base (yaw rotation) - this is the pirate ship hull
    cannonBase = new THREE.Group();
    
    // Ship colors
    const woodBrown = 0x8B4513;
    const darkWood = 0x654321;
    const sailWhite = 0xFFF8DC;
    
    // Ship hull - main body
    const hullGeometry = new THREE.BoxGeometry(2, 0.8, 4);
    const hullMaterial = new THREE.MeshStandardMaterial({
        color: woodBrown,
        roughness: 0.8,
        metalness: 0.1
    });
    const hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    hullMesh.position.y = 0.4;
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    cannonBase.add(hullMesh);
    
    // Ship deck
    const deckGeometry = new THREE.BoxGeometry(2.2, 0.2, 4.2);
    const deckMaterial = new THREE.MeshStandardMaterial({
        color: darkWood,
        roughness: 0.9,
        metalness: 0.05
    });
    const deckMesh = new THREE.Mesh(deckGeometry, deckMaterial);
    deckMesh.position.y = 0.9;
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    cannonBase.add(deckMesh);
    
    // Ship sides (railings)
    const railingLeft = new THREE.BoxGeometry(0.1, 0.3, 4);
    const railingMat = new THREE.MeshStandardMaterial({ color: darkWood, roughness: 0.9 });
    const leftRail = new THREE.Mesh(railingLeft, railingMat);
    leftRail.position.set(-1.05, 1.15, 0);
    leftRail.castShadow = true;
    cannonBase.add(leftRail);
    
    const rightRail = new THREE.Mesh(railingLeft, railingMat);
    rightRail.position.set(1.05, 1.15, 0);
    rightRail.castShadow = true;
    cannonBase.add(rightRail);
    
    // Mast (center pole)
    const mastGeometry = new THREE.CylinderGeometry(0.1, 0.12, 2.5, 8);
    const mastMaterial = new THREE.MeshStandardMaterial({
        color: darkWood,
        roughness: 0.8
    });
    const mastMesh = new THREE.Mesh(mastGeometry, mastMaterial);
    mastMesh.position.set(0, 2.25, 0.5);
    mastMesh.castShadow = true;
    cannonBase.add(mastMesh);
    
    // Pirate flag at top of mast
    const flagGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.05);
    const flagMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.9
    });
    const flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
    flagMesh.position.set(0, 3.5, 0.5);
    flagMesh.castShadow = true;
    cannonBase.add(flagMesh);
    
    // Skull on flag (small white sphere)
    const skullGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const skullMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const skullMesh = new THREE.Mesh(skullGeometry, skullMaterial);
    skullMesh.position.set(0, 3.5, 0.48);
    skullMesh.castShadow = true;
    cannonBase.add(skullMesh);
    
    // Create cannon barrel (pitch rotation) - mounted on ship
    cannonBarrel = new THREE.Group();
    
    const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.25, 2, 12);
    const barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.6,
        metalness: 0.8
    });
    const barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrelMesh.rotation.x = -Math.PI / 2;
    barrelMesh.position.z = -1;
    barrelMesh.castShadow = true;
    cannonBarrel.add(barrelMesh);
    
    // Cannon muzzle
    const muzzleGeometry = new THREE.CylinderGeometry(0.25, 0.22, 0.3, 12);
    const muzzleMesh = new THREE.Mesh(muzzleGeometry, barrelMaterial);
    muzzleMesh.rotation.x = -Math.PI / 2;
    muzzleMesh.position.z = -2.2;
    muzzleMesh.castShadow = true;
    cannonBarrel.add(muzzleMesh);
    
    // Cannon mount wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: darkWood });
    const wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel1.rotation.z = Math.PI / 2;
    wheel1.position.set(-0.3, -0.2, -0.5);
    cannonBarrel.add(wheel1);
    
    const wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel2.rotation.z = Math.PI / 2;
    wheel2.position.set(0.3, -0.2, -0.5);
    cannonBarrel.add(wheel2);
    
    // Position cannon on ship deck
    cannonBarrel.position.set(0, 1.0, -1.5);
    
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
 * @param {number} yaw - Rotation around Y axis in radians
 * @param {number} pitch - Rotation around X axis in degrees
 */
export function setYawPitch(yaw, pitch) {
    // Clamp pitch to valid range
    const clampedPitch = clamp(pitch, MIN_PITCH, MAX_PITCH);
    
    // Apply rotations
    // Yaw rotates the base left/right
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

