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
 * @param {string} type - 'player', 'enemy', or 'boss'
 */
export function spawnProjectile(scene, origin, direction, speed, type = 'player') {
    // Boss projectiles are larger
    const radius = type === 'boss' ? PROJECTILE_RADIUS * 2.5 : PROJECTILE_RADIUS;

    // Determine colors based on type
    let color, emissiveColor, emissiveIntensity, lightColor, lightIntensity;
    if (type === 'boss') {
        color = 0x8B0000;           // Dark red
        emissiveColor = 0xFF0000;   // Bright red glow
        emissiveIntensity = 1.2;    // Very bright
        lightColor = 0xFF0000;
        lightIntensity = 8;         // Very bright light
    } else if (type === 'enemy') {
        color = 0xFF4444;
        emissiveColor = 0xFF0000;
        emissiveIntensity = 0.4;
        lightColor = 0xFF0000;
        lightIntensity = 2;
    } else {
        color = 0x444444;
        emissiveColor = 0xFF6600;
        emissiveIntensity = 0.7;
        lightColor = 0xFF6600;
        lightIntensity = 3;
    }

    // Create sphere geometry
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.5,
        metalness: 0.9,
        emissive: emissiveColor,
        emissiveIntensity: emissiveIntensity
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(origin);
    mesh.castShadow = true;

    scene.add(mesh);

    // Add point light to projectile for better visibility
    const projectileLight = new THREE.PointLight(lightColor, lightIntensity, type === 'boss' ? 15 : 8);
    mesh.add(projectileLight);

    // Boss projectiles have an outer glow ring
    if (type === 'boss') {
        const glowGeometry = new THREE.RingGeometry(radius * 1.2, radius * 1.8, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF0000,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const glowRing = new THREE.Mesh(glowGeometry, glowMaterial);
        mesh.add(glowRing);
    }

    // Create trajectory trail using dots (spheres for better visibility)
    const trailGroup = new THREE.Group();
    const trailDots = []; // Array to store individual dot meshes
    scene.add(trailGroup);

    // Calculate initial velocity
    const velocity = direction.clone().multiplyScalar(speed);

    // Determine trail color
    let trailColor;
    if (type === 'boss') {
        trailColor = 0xFF0000; // Bright red trail
    } else if (type === 'enemy') {
        trailColor = 0xFF4444;
    } else {
        trailColor = 0xFF8800;
    }

    // Store projectile data
    projectiles.push({
        mesh,
        velocity,
        birthTime: performance.now() / 1000,
        alive: true,
        radius: radius,
        type: type, // 'player', 'enemy', or 'boss'
        // Trail data
        trailGroup: trailGroup,
        trailDots: trailDots,
        trailColor: trailColor,
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

    // Clear all active lasers
    clearAllLasers(scene);
}

// Store active laser beams
const activeLasers = [];

/**
 * Creates a boss laser beam that lasts 1 second
 * @param {THREE.Scene} scene - Scene to add laser to
 * @param {THREE.Vector3} origin - Start position of laser
 * @param {THREE.Vector3} direction - Direction of laser
 * @param {Function} onHitPlayer - Callback when laser hits player
 */
export function createBossLaser(scene, origin, direction, onHitPlayer) {
    const laserLength = 150; // Very long range
    const laserDuration = 1.0; // 1 second duration

    // Create laser beam group
    const laserGroup = new THREE.Group();

    // Main laser beam (cylinder)
    const beamGeometry = new THREE.CylinderGeometry(0.3, 0.3, laserLength, 8);
    const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF0000,
        transparent: true,
        opacity: 0.9
    });
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);

    // Inner core (brighter)
    const coreGeometry = new THREE.CylinderGeometry(0.15, 0.15, laserLength, 8);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 1.0
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);

    // Outer glow
    const glowGeometry = new THREE.CylinderGeometry(0.6, 0.6, laserLength, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF4400,
        transparent: true,
        opacity: 0.4
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);

    laserGroup.add(glow);
    laserGroup.add(beam);
    laserGroup.add(core);

    // Position and rotate laser to point in direction
    laserGroup.position.copy(origin);

    // Calculate rotation to align cylinder with direction
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(up, direction.clone().normalize());
    laserGroup.quaternion.copy(quaternion);

    // Offset so laser starts at origin and extends outward
    const offset = direction.clone().normalize().multiplyScalar(laserLength / 2);
    laserGroup.position.add(offset);

    // Add point lights along the beam for dramatic effect
    const startLight = new THREE.PointLight(0xFF0000, 10, 15);
    startLight.position.set(0, -laserLength / 2, 0);
    laserGroup.add(startLight);

    const midLight = new THREE.PointLight(0xFF4400, 5, 10);
    midLight.position.set(0, 0, 0);
    laserGroup.add(midLight);

    scene.add(laserGroup);

    // Store laser data
    const laserData = {
        group: laserGroup,
        origin: origin.clone(),
        direction: direction.clone().normalize(),
        length: laserLength,
        startTime: performance.now() / 1000,
        duration: laserDuration,
        beamMaterial: beamMaterial,
        coreMaterial: coreMaterial,
        glowMaterial: glowMaterial,
        onHitPlayer: onHitPlayer,
        hasHitPlayer: false
    };

    activeLasers.push(laserData);

    return laserData;
}

/**
 * Updates all active laser beams
 * @param {number} deltaTime - Time since last frame
 * @param {THREE.Scene} scene - Scene reference
 * @param {THREE.Vector3} playerPosition - Player position for collision
 */
export function updateLasers(deltaTime, scene, playerPosition) {
    const currentTime = performance.now() / 1000;

    for (let i = activeLasers.length - 1; i >= 0; i--) {
        const laser = activeLasers[i];
        const elapsed = currentTime - laser.startTime;
        const progress = elapsed / laser.duration;

        if (progress >= 1.0) {
            // Remove laser
            scene.remove(laser.group);
            laser.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            activeLasers.splice(i, 1);
            continue;
        }

        // Pulsing effect
        const pulse = Math.sin(elapsed * 20) * 0.2 + 0.8;
        laser.beamMaterial.opacity = 0.9 * pulse;
        laser.coreMaterial.opacity = 1.0 * pulse;
        laser.glowMaterial.opacity = 0.4 * pulse;

        // Fade out near end
        if (progress > 0.7) {
            const fadeProgress = (progress - 0.7) / 0.3;
            laser.beamMaterial.opacity *= (1 - fadeProgress);
            laser.coreMaterial.opacity *= (1 - fadeProgress);
            laser.glowMaterial.opacity *= (1 - fadeProgress);
        }

        // Check collision with player (if not already hit)
        if (!laser.hasHitPlayer && playerPosition) {
            // Calculate closest point on laser line to player
            const laserStart = laser.origin.clone();
            const laserEnd = laser.origin.clone().add(laser.direction.clone().multiplyScalar(laser.length));

            const playerToStart = playerPosition.clone().sub(laserStart);
            const laserVec = laserEnd.clone().sub(laserStart);
            const laserLengthSq = laserVec.lengthSq();

            // Project player position onto laser line
            const t = Math.max(0, Math.min(1, playerToStart.dot(laserVec) / laserLengthSq));
            const closestPoint = laserStart.clone().add(laserVec.multiplyScalar(t));

            const distanceToLaser = playerPosition.distanceTo(closestPoint);
            const hitRadius = 2.5; // Player hit radius

            if (distanceToLaser < hitRadius) {
                laser.hasHitPlayer = true;
                if (laser.onHitPlayer) {
                    laser.onHitPlayer();
                }
            }
        }
    }
}

/**
 * Clears all active lasers
 * @param {THREE.Scene} scene - Scene to remove lasers from
 */
export function clearAllLasers(scene) {
    for (let i = activeLasers.length - 1; i >= 0; i--) {
        const laser = activeLasers[i];
        scene.remove(laser.group);
        laser.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }
    activeLasers.length = 0;
}

/**
 * Gets all active lasers
 * @returns {Array} Array of laser objects
 */
export function getActiveLasers() {
    return activeLasers;
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

