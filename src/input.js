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
    s: false,
    a: false,
    d: false,
    arrowup: false,
    arrowdown: false
};

// Aiming parameters
let yaw = 0; // Start facing blocks (0 = -Z direction)
let pitch = 30; // degrees

// Ship rotation parameter
let shipRotation = 0; // Current Y-axis rotation of the ship

// Camera mode
let freeCameraMode = false; // Toggle between third-person and free camera
let updateCameraModeCallback = null; // Callback to update HUD indicator

// Configuration
const MAX_CHARGE_TIME = 1.5; // seconds
const ROTATION_SPEED = 60; // degrees per second
const SHIP_ROTATION_SPEED = 1.5; // radians per second for ship turning
const FORWARD_SPEED = 6; // units per second for forward movement
const MIN_PITCH = 0; // horizontal
const MAX_PITCH = 90; // straight up
const MIN_YAW = -Math.PI / 2; // -90 degrees (facing right edge of block area)
const MAX_YAW = Math.PI / 2;  // +90 degrees (facing left edge of block area)
const BOUNDARY_RADIUS = 60; // Maximum distance from origin (large enough to reach all treasures)

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

    // Debug: log all key presses
    console.log('Key pressed:', key);

    // Toggle free camera mode with C key
    if (key === 'c') {
        freeCameraMode = !freeCameraMode;
        console.log('🎥 Free camera mode:', freeCameraMode ? 'ENABLED ✅' : 'DISABLED ❌');

        // Update HUD indicator if available
        if (typeof updateCameraModeCallback === 'function') {
            updateCameraModeCallback(freeCameraMode);
        }

        event.preventDefault();
        return;
    }

    if (key === 'w' || key === 's' || key === 'a' || key === 'd') {
        keysPressed[key] = true;
        event.preventDefault();
    }
    if (key === 'arrowup' || key === 'arrowdown') {
        keysPressed[key] = true;
        event.preventDefault();
    }
}

/**
 * Handles keyboard release
 */
function onKeyUp(event) {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 's' || key === 'a' || key === 'd') {
        keysPressed[key] = false;
        event.preventDefault();
    }
    if (key === 'arrowup' || key === 'arrowdown') {
        keysPressed[key] = false;
        event.preventDefault();
    }
}

/**
 * Updates aiming based on keyboard input
 * Note: W/A/S/D are now used for ship movement
 * Arrow Up/Down control cannon pitch (up/down aiming)
 * @param {number} deltaTime - Time since last frame in seconds
 */
export function updateAiming(deltaTime) {
    const rotationAmount = ROTATION_SPEED * deltaTime;

    // Arrow Up - aim cannon up (increase pitch)
    if (keysPressed.arrowup) {
        pitch += rotationAmount;
    }

    // Arrow Down - aim cannon down (decrease pitch)
    if (keysPressed.arrowdown) {
        pitch -= rotationAmount;
    }

    // Keep cannon pointed forward relative to ship (yaw = 0)
    yaw = 0;
    pitch = clamp(pitch, MIN_PITCH, MAX_PITCH);
}

/**
 * Updates ship position based on W/A/S/D input - forward/backward movement and rotation
 * @param {number} deltaTime - Time since last frame in seconds
 * @param {THREE.Group} cannonGroup - The cannon/ship group to move
 */
export function updateShipMovement(deltaTime, cannonGroup) {
    // Don't move ship in free camera mode
    if (freeCameraMode) {
        return;
    }

    // A key - rotate ship left (counter-clockwise)
    if (keysPressed.a) {
        shipRotation += SHIP_ROTATION_SPEED * deltaTime;
    }

    // D key - rotate ship right (clockwise)
    if (keysPressed.d) {
        shipRotation -= SHIP_ROTATION_SPEED * deltaTime;
    }

    // W key - move forward in the direction the ship is facing
    if (keysPressed.w) {
        const moveX = -Math.sin(shipRotation) * FORWARD_SPEED * deltaTime;
        const moveZ = -Math.cos(shipRotation) * FORWARD_SPEED * deltaTime;
        cannonGroup.position.x += moveX;
        cannonGroup.position.z += moveZ;
    }

    // S key - move backward (reverse) in the opposite direction the ship is facing
    if (keysPressed.s) {
        const moveX = Math.sin(shipRotation) * FORWARD_SPEED * deltaTime;
        const moveZ = Math.cos(shipRotation) * FORWARD_SPEED * deltaTime;
        cannonGroup.position.x += moveX;
        cannonGroup.position.z += moveZ;
    }

    // Apply ship rotation to the cannon group
    cannonGroup.rotation.y = shipRotation;

    // Keep ship within circular boundary
    const distFromOrigin = Math.sqrt(cannonGroup.position.x ** 2 + cannonGroup.position.z ** 2);
    if (distFromOrigin > BOUNDARY_RADIUS) {
        const angle = Math.atan2(cannonGroup.position.x, cannonGroup.position.z);
        cannonGroup.position.x = Math.sin(angle) * BOUNDARY_RADIUS;
        cannonGroup.position.z = Math.cos(angle) * BOUNDARY_RADIUS;
    }
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
 * Resets the ship position and rotation to starting position
 */
export function resetShipPosition() {
    shipRotation = 0;
}

/**
 * Gets whether free camera mode is active
 * @returns {boolean} True if in free camera mode
 */
export function isFreeCameraMode() {
    return freeCameraMode;
}

/**
 * Sets the callback function for camera mode updates
 * @param {Function} callback - Function to call when camera mode changes
 */
export function setCameraModeCallback(callback) {
    updateCameraModeCallback = callback;
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

