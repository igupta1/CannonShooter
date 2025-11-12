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
 * Creates a cannon from primitive geometries
 * @param {THREE.Scene} scene - The scene to add the cannon to
 * @returns {Object} Cannon components
 */
export function createCannon(scene) {
    cannonGroup = new THREE.Group();
    
    // Create base (yaw rotation)
    cannonBase = new THREE.Group();
    
    const baseGeometry = new THREE.CylinderGeometry(1, 1.2, 0.5, 8);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.7,
        metalness: 0.5
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.y = 0.25;
    baseMesh.castShadow = true;
    cannonBase.add(baseMesh);
    
    // Create mounting bracket
    const bracketGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.6);
    const bracketMesh = new THREE.Mesh(bracketGeometry, baseMaterial);
    bracketMesh.position.y = 0.9;
    bracketMesh.castShadow = true;
    cannonBase.add(bracketMesh);
    
    // Create barrel (pitch rotation)
    cannonBarrel = new THREE.Group();
    
    const barrelGeometry = new THREE.CylinderGeometry(0.25, 0.3, 3, 16);
    const barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x2c3e50,
        roughness: 0.6,
        metalness: 0.7
    });
    const barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
    // Rotate cylinder to lie horizontally along Z axis
    barrelMesh.rotation.x = -Math.PI / 2; // Rotate to point forward along -Z
    barrelMesh.position.z = -1.5; // Position at end of pivot (negative Z = forward)
    barrelMesh.castShadow = true;
    cannonBarrel.add(barrelMesh);
    
    // Add barrel muzzle detail
    const muzzleGeometry = new THREE.CylinderGeometry(0.3, 0.28, 0.3, 16);
    const muzzleMesh = new THREE.Mesh(muzzleGeometry, barrelMaterial);
    muzzleMesh.rotation.x = -Math.PI / 2;
    muzzleMesh.position.z = -3; // Position at muzzle end
    muzzleMesh.castShadow = true;
    cannonBarrel.add(muzzleMesh);
    
    // Position barrel pivot point
    cannonBarrel.position.y = 0.9;
    
    // Assemble hierarchy
    cannonBase.add(cannonBarrel);
    cannonGroup.add(cannonBase);
    
    // Position cannon at origin on ground
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
    const muzzleOffset = new THREE.Vector3(0, 0, -3);
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

