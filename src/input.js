/**
 * input.js - Input handling for aiming and firing
 * Manages keyboard and mouse input for cannon control
 */

import { clamp, degToRad } from './utils.js';

// Input state
let isCharging = false;
let chargeStartTime = 0;
let currentCharge = 0;

// Keyboard state
let keysPressed = {
    w: false,
    a: false,
    s: false,
    d: false,
    arrowleft: false,
    arrowright: false
};

// Aiming parameters
let yaw = 0; // Start facing blocks (0 = -Z direction)
let pitch = 30; // degrees

// Configuration
const MAX_CHARGE_TIME = 1.5; // seconds
const ROTATION_SPEED = 60; // degrees per second
const MOVEMENT_SPEED = 8; // units per second for left/right movement
const MIN_PITCH = 0; // horizontal
const MAX_PITCH = 90; // straight up
const MIN_YAW = -Math.PI / 2; // -90 degrees (facing right edge of block area)
const MAX_YAW = Math.PI / 2;  // +90 degrees (facing left edge of block area)
const MIN_X_POSITION = -15; // Left boundary
const MAX_X_POSITION = 15;  // Right boundary

/**
 * Initializes input event listeners
 * @param {HTMLElement} element - Element to attach listeners to (usually canvas)
 */
export function initInput(element) {
    // Mouse buttons for charging/firing
    element.addEventListener('mousedown', onMouseDown);
    element.addEventListener('mouseup', onMouseUp);
    
    // Keyboard for aiming
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Prevent context menu on right-click
    element.addEventListener('contextmenu', (e) => e.preventDefault());
}

/**
 * Handles keyboard press
 */
function onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keysPressed[key] = true;
        event.preventDefault();
    }
    if (key === 'arrowleft' || key === 'arrowright') {
        keysPressed[key] = true;
        event.preventDefault();
    }
}

/**
 * Handles keyboard release
 */
function onKeyUp(event) {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keysPressed[key] = false;
        event.preventDefault();
    }
    if (key === 'arrowleft' || key === 'arrowright') {
        keysPressed[key] = false;
        event.preventDefault();
    }
}

/**
 * Updates aiming based on keyboard input
 * @param {number} deltaTime - Time since last frame in seconds
 */
export function updateAiming(deltaTime) {
    const rotationAmount = ROTATION_SPEED * deltaTime;

    // A key - rotate left (increase yaw)
    if (keysPressed.a) {
        yaw += degToRad(rotationAmount);
    }

    // D key - rotate right (decrease yaw)
    if (keysPressed.d) {
        yaw -= degToRad(rotationAmount);
    }

    // W key - rotate up (increase pitch)
    if (keysPressed.w) {
        pitch += rotationAmount;
    }

    // S key - rotate down (decrease pitch)
    if (keysPressed.s) {
        pitch -= rotationAmount;
    }

    // Clamp yaw and pitch to valid ranges
    yaw = clamp(yaw, MIN_YAW, MAX_YAW);
    pitch = clamp(pitch, MIN_PITCH, MAX_PITCH);
}

/**
 * Updates ship position based on arrow key input
 * @param {number} deltaTime - Time since last frame in seconds
 * @param {THREE.Group} cannonGroup - The cannon/ship group to move
 */
export function updateShipMovement(deltaTime, cannonGroup) {
    const movementAmount = MOVEMENT_SPEED * deltaTime;

    // Arrow Left - move ship left
    if (keysPressed.arrowleft) {
        cannonGroup.position.x -= movementAmount;
    }

    // Arrow Right - move ship right
    if (keysPressed.arrowright) {
        cannonGroup.position.x += movementAmount;
    }

    // Clamp ship position to boundaries
    cannonGroup.position.x = clamp(cannonGroup.position.x, MIN_X_POSITION, MAX_X_POSITION);
}

/**
 * Handles mouse button press (start charging)
 */
function onMouseDown(event) {
    if (event.button === 0) { // Left mouse button
        isCharging = true;
        chargeStartTime = performance.now() / 1000;
        currentCharge = 0;
    }
}

/**
 * Handles mouse button release (fire)
 */
function onMouseUp(event) {
    if (event.button === 0 && isCharging) {
        isCharging = false;
    }
}

/**
 * Updates charging state
 * @param {number} currentTime - Current time in seconds
 * @returns {number} Charge fraction (0 to 1)
 */
export function updateCharging(currentTime) {
    if (isCharging) {
        const elapsed = currentTime - chargeStartTime;
        currentCharge = clamp(elapsed / MAX_CHARGE_TIME, 0, 1);
    }
    return currentCharge;
}

/**
 * Checks if a shot should be fired and returns the charge amount
 * @returns {number|null} Charge amount if firing, null otherwise
 */
export function checkFire() {
    if (!isCharging && currentCharge > 0) {
        const charge = currentCharge;
        currentCharge = 0;
        return charge;
    }
    return null;
}

/**
 * Gets the current aiming angles
 * @returns {Object} {yaw, pitch}
 */
export function getAimAngles() {
    return { yaw, pitch };
}

/**
 * Gets the current charge amount
 * @returns {number} Charge fraction (0 to 1)
 */
export function getCurrentCharge() {
    return currentCharge;
}

/**
 * Resets the charging state
 */
export function resetCharge() {
    isCharging = false;
    currentCharge = 0;
}

/**
 * Adds keyboard listener for restart
 * @param {Function} restartCallback - Function to call on restart
 */
export function addRestartListener(restartCallback) {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'r' || event.key === 'R') {
            restartCallback();
        }
    });
}

