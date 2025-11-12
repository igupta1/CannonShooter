/**
 * collision.js - Collision detection functions
 * Implements sphere vs AABB (Axis-Aligned Bounding Box) collision
 */

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
 * Get AABB bounds from a Three.js mesh
 * @param {THREE.Mesh} mesh - The mesh to get bounds from
 * @returns {Object} {min: {x, y, z}, max: {x, y, z}}
 */
export function getAABBFromMesh(mesh) {
    const geometry = mesh.geometry;
    
    // Compute bounding box if not already computed
    if (!geometry.boundingBox) {
        geometry.computeBoundingBox();
    }
    
    const box = geometry.boundingBox;
    const worldPos = mesh.position;
    const scale = mesh.scale;
    
    // Transform local bounding box to world space
    const min = {
        x: worldPos.x + box.min.x * scale.x,
        y: worldPos.y + box.min.y * scale.y,
        z: worldPos.z + box.min.z * scale.z
    };
    
    const max = {
        x: worldPos.x + box.max.x * scale.x,
        y: worldPos.y + box.max.y * scale.y,
        z: worldPos.z + box.max.z * scale.z
    };
    
    return { min, max };
}

