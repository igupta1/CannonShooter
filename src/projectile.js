/**
 * projectile.js - Projectile physics and management
 * Handles spawning, updating, and managing cannonball projectiles
 */

import * as THREE from 'three';

// Projectile storage
const projectiles = [];

// Physics constants
const GRAVITY = new THREE.Vector3(0, -9.8, 0);
const MAX_LIFETIME = 5; // seconds
const PROJECTILE_RADIUS = 0.3;

/**
 * Spawns a new projectile
 * @param {THREE.Scene} scene - The scene to add the projectile to
 * @param {THREE.Vector3} origin - Starting position
 * @param {THREE.Vector3} direction - Normalized direction vector
 * @param {number} speed - Initial speed
 */
export function spawnProjectile(scene, origin, direction, speed) {
    // Create sphere geometry
    const geometry = new THREE.SphereGeometry(PROJECTILE_RADIUS, 16, 16);
    const material = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.7,
        metalness: 0.8
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(origin);
    mesh.castShadow = true;
    
    scene.add(mesh);
    
    // Calculate initial velocity
    const velocity = direction.clone().multiplyScalar(speed);
    
    // Store projectile data
    projectiles.push({
        mesh,
        velocity,
        birthTime: performance.now() / 1000,
        alive: true,
        radius: PROJECTILE_RADIUS
    });
}

/**
 * Updates all active projectiles with physics
 * @param {number} deltaTime - Time since last frame in seconds
 * @param {THREE.Scene} scene - Scene to remove dead projectiles from
 */
export function updateProjectiles(deltaTime, scene) {
    const currentTime = performance.now() / 1000;
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        
        if (!proj.alive) {
            continue;
        }
        
        // Apply gravity
        proj.velocity.add(GRAVITY.clone().multiplyScalar(deltaTime));
        
        // Update position
        proj.mesh.position.add(proj.velocity.clone().multiplyScalar(deltaTime));
        
        // Check if below ground or expired
        const age = currentTime - proj.birthTime;
        if (proj.mesh.position.y < -1 || age > MAX_LIFETIME) {
            despawnProjectile(i, scene);
        }
    }
}

/**
 * Removes a projectile from the scene and array
 * @param {number} index - Index of projectile to remove
 * @param {THREE.Scene} scene - Scene to remove from
 */
export function despawnProjectile(index, scene) {
    if (index >= 0 && index < projectiles.length) {
        const proj = projectiles[index];
        scene.remove(proj.mesh);
        proj.mesh.geometry.dispose();
        proj.mesh.material.dispose();
        projectiles.splice(index, 1);
    }
}

/**
 * Marks a projectile as dead (for collision handling)
 * @param {number} index - Index of projectile
 */
export function killProjectile(index) {
    if (index >= 0 && index < projectiles.length) {
        projectiles[index].alive = false;
    }
}

/**
 * Gets all active projectiles
 * @returns {Array} Array of projectile objects
 */
export function getProjectiles() {
    return projectiles;
}

/**
 * Clears all projectiles (for restart)
 * @param {THREE.Scene} scene - Scene to remove projectiles from
 */
export function clearAllProjectiles(scene) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        despawnProjectile(i, scene);
    }
}

