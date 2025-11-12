/**
 * utils.js - Utility functions for the Cannon Shooter game
 * Contains math helpers and common operations
 */

/**
 * Clamps a value between min and max
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between a and b
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Returns a random value in the range [min, max]
 */
export function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * Ping-pong function: oscillates between 0 and length
 * @param {number} t - Time value
 * @param {number} length - Maximum value
 */
export function pingPong(t, length) {
    const cycle = (t % (length * 2));
    return cycle <= length ? cycle : (length * 2) - cycle;
}

/**
 * Converts degrees to radians
 */
export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees
 */
export function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

/**
 * Normalizes a vector (returns a new vector)
 */
export function normalizeVector(vec) {
    const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
    if (length === 0) return { x: 0, y: 0, z: 0 };
    return {
        x: vec.x / length,
        y: vec.y / length,
        z: vec.z / length
    };
}

