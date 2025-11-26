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

// Trail configuration
const TRAIL_UPDATE_INTERVAL = 0.05; // Update trail every 50ms
const TRAIL_MAX_POINTS = 100; // Maximum number of trail points
const TRAIL_FADE_DURATION = 1.0; // Seconds for trail to fade out after projectile is destroyed

// Store fading trails
const fadingTrails = [];

/**
 * Spawns a new projectile
 * @param {THREE.Scene} scene - The scene to add the projectile to
 * @param {THREE.Vector3} origin - Starting position
 * @param {THREE.Vector3} direction - Normalized direction vector
 * @param {number} speed - Initial speed
 * @param {string} type - 'player' or 'enemy'
 */
export function spawnProjectile(scene, origin, direction, speed, type = 'player') {
    // Create sphere geometry
    const geometry = new THREE.SphereGeometry(PROJECTILE_RADIUS, 16, 16);
    const material = new THREE.MeshStandardMaterial({
        color: type === 'enemy' ? 0xFF4444 : 0x444444, // Red for enemy, gray for player
        roughness: 0.5,
        metalness: 0.9,
        emissive: type === 'enemy' ? 0xFF0000 : 0xFF6600, // Orange glow for player, red for enemy
        emissiveIntensity: type === 'enemy' ? 0.4 : 0.7
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(origin);
    mesh.castShadow = true;

    scene.add(mesh);

    // Add point light to projectile for better visibility
    const projectileLight = new THREE.PointLight(
        type === 'enemy' ? 0xFF0000 : 0xFF6600, 
        type === 'enemy' ? 2 : 3, 
        8
    );
    mesh.add(projectileLight);

    // Create trajectory trail using dots (spheres for better visibility)
    const trailGroup = new THREE.Group();
    const trailDots = []; // Array to store individual dot meshes
    scene.add(trailGroup);

    // Calculate initial velocity
    const velocity = direction.clone().multiplyScalar(speed);

    // Store projectile data
    projectiles.push({
        mesh,
        velocity,
        birthTime: performance.now() / 1000,
        alive: true,
        radius: PROJECTILE_RADIUS,
        type: type, // 'player' or 'enemy'
        // Trail data
        trailGroup: trailGroup,
        trailDots: trailDots,
        trailColor: type === 'enemy' ? 0xFF4444 : 0xFF8800,
        lastTrailUpdate: performance.now() / 1000,
        distanceSinceLastDot: 0
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
        
        // Update trajectory trail - add dots at intervals
        const deltaDistance = proj.velocity.length() * deltaTime;
        proj.distanceSinceLastDot += deltaDistance;
        
        // Add a new dot every 0.4 units traveled (creates dotted effect)
        if (proj.distanceSinceLastDot >= 0.4) {
            // Create a sphere dot for the trail
            const dotGeometry = new THREE.SphereGeometry(0.15, 8, 8); // Thick visible dots
            const dotMaterial = new THREE.MeshBasicMaterial({
                color: proj.trailColor,
                transparent: true,
                opacity: 0.9
            });
            const dot = new THREE.Mesh(dotGeometry, dotMaterial);
            dot.position.copy(proj.mesh.position);
            
            proj.trailGroup.add(dot);
            proj.trailDots.push({
                mesh: dot,
                material: dotMaterial
            });
            
            // Limit trail dots to prevent performance issues
            if (proj.trailDots.length > TRAIL_MAX_POINTS) {
                const oldDot = proj.trailDots.shift();
                proj.trailGroup.remove(oldDot.mesh);
                oldDot.mesh.geometry.dispose();
                oldDot.material.dispose();
            }
            
            proj.distanceSinceLastDot = 0;
        }
        
        // Check if below ground or expired
        const age = currentTime - proj.birthTime;
        if (proj.mesh.position.y < -1 || age > MAX_LIFETIME) {
            despawnProjectile(i, scene);
        }
    }
    
    // Update fading trails
    for (let i = fadingTrails.length - 1; i >= 0; i--) {
        const trail = fadingTrails[i];
        const elapsed = currentTime - trail.startFadeTime;
        const progress = elapsed / TRAIL_FADE_DURATION;
        
        if (progress >= 1.0) {
            // Remove trail completely
            scene.remove(trail.group);
            trail.dots.forEach(dot => {
                dot.mesh.geometry.dispose();
                dot.material.dispose();
            });
            fadingTrails.splice(i, 1);
        } else {
            // Fade out trail dots
            const opacity = trail.initialOpacity * (1.0 - progress);
            trail.dots.forEach(dot => {
                dot.material.opacity = opacity;
            });
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
        
        // Remove projectile mesh
        scene.remove(proj.mesh);
        proj.mesh.geometry.dispose();
        proj.mesh.material.dispose();
        
        // Start fading out trail dots instead of removing immediately
        if (proj.trailGroup && proj.trailDots.length > 0) {
            fadingTrails.push({
                group: proj.trailGroup,
                dots: proj.trailDots,
                startFadeTime: performance.now() / 1000,
                initialOpacity: 0.9
            });
        }
        
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
    
    // Also clear all fading trails
    for (let i = fadingTrails.length - 1; i >= 0; i--) {
        const trail = fadingTrails[i];
        scene.remove(trail.group);
        trail.dots.forEach(dot => {
            dot.mesh.geometry.dispose();
            dot.material.dispose();
        });
    }
    fadingTrails.length = 0;
}

/**
 * Creates an explosion animation at a position
 * @param {THREE.Scene} scene - Scene to add explosion to
 * @param {THREE.Vector3} position - Position of explosion
 * @param {number} color - Color of explosion (default orange)
 */
export function createExplosion(scene, position, color = 0xFF6600) {
    const explosionGroup = new THREE.Group();
    explosionGroup.position.copy(position);

    // Create multiple particles for explosion effect
    const particleCount = 20;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1.0
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);

        // Random direction for each particle
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const velocity = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi)
        ).multiplyScalar(5 + Math.random() * 5);

        explosionGroup.add(particle);
        particles.push({
            mesh: particle,
            velocity: velocity,
            material: particleMaterial
        });
    }

    // Add bright light flash
    const explosionLight = new THREE.PointLight(color, 10, 15);
    explosionGroup.add(explosionLight);

    scene.add(explosionGroup);

    // Animate explosion
    const startTime = performance.now();
    const duration = 800; // milliseconds

    function animateExplosion() {
        const elapsed = performance.now() - startTime;
        const progress = elapsed / duration;

        if (progress >= 1.0) {
            // Remove explosion
            scene.remove(explosionGroup);
            explosionGroup.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            return;
        }

        // Update particles
        particles.forEach(particle => {
            particle.mesh.position.add(particle.velocity.clone().multiplyScalar(0.016));
            particle.velocity.y -= 0.3; // Gravity effect
            particle.material.opacity = 1.0 - progress;
        });

        // Fade light
        explosionLight.intensity = 10 * (1.0 - progress);

        requestAnimationFrame(animateExplosion);
    }

    animateExplosion();
}

