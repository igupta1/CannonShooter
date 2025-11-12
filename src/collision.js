/**
 * collision.js - Collision detection functions
 * Implements sphere vs AABB (Axis-Aligned Bounding Box) collision
 */

import * as THREE from 'three';
import { clamp } from './utils.js';

/**
 * Check collision between a sphere and an AABB
 * @param {Object} center - Sphere center {x, y, z}
 * @param {number} radius - Sphere radius
 * @param {Object} min - AABB minimum corner {x, y, z}
 * @param {Object} max - AABB maximum corner {x, y, z}
 * @returns {boolean} True if collision detected
 */
export function sphereVsAABB(center, radius, min, max) {
    // Find the closest point on the AABB to the sphere center
    const closestX = clamp(center.x, min.x, max.x);
    const closestY = clamp(center.y, min.y, max.y);
    const closestZ = clamp(center.z, min.z, max.z);
    
    // Calculate distance from sphere center to closest point
    const dx = center.x - closestX;
    const dy = center.y - closestY;
    const dz = center.z - closestZ;
    const distanceSquared = dx * dx + dy * dy + dz * dz;
    
    // Collision if distance is less than radius
    return distanceSquared <= (radius * radius);
}

/**
 * Get AABB bounds from a Three.js mesh or group
 * @param {THREE.Mesh|THREE.Group} object - The object to get bounds from
 * @returns {Object} {min: {x, y, z}, max: {x, y, z}}
 */
export function getAABBFromMesh(object) {
    // Use Three.js Box3 to compute bounding box for groups or meshes
    const box3 = new THREE.Box3();
    box3.setFromObject(object);
    
    const min = {
        x: box3.min.x,
        y: box3.min.y,
        z: box3.min.z
    };
    
    const max = {
        x: box3.max.x,
        y: box3.max.y,
        z: box3.max.z
    };
    
    return { min, max };
}

