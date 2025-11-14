/**
 * scene.js - Scene setup with lights, ground, and shadows
 * Creates the 3D environment for the cannon shooter game
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let waterMaterial, waterUniforms;
let previousShipPositions = new Map(); // Track previous positions for velocity calculation

/**
 * Creates and initializes the Three.js scene
 * @param {HTMLElement} container - DOM element to attach renderer to
 */
export function createScene(container) {
    // Create scene - ocean theme
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 30, 120);
    
    // Create camera - third person view behind ship
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    // Initial position (will be updated to follow ship)
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 2, 0);
    
    // Create renderer with shadows
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Setup orbit controls (disabled by default for third-person, enabled in free camera mode)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false; // Disable by default for third-person follow cam
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 80;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
    
    // Add lights
    addLights();
    
    // Add ground plane
    addGround();
    
    return { scene, camera, renderer, controls };
}

/**
 * Adds lighting to the scene with shadows
 */
function addLights() {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Directional light (sun) with shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 50, 30);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.bias = -0.0001;
    
    scene.add(directionalLight);
    
    // Optional: Add shadow camera helper for debugging
    // const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // scene.add(helper);
}

/**
 * Adds an ocean plane with animated waves that receives shadows
 */
function addGround() {
    const waterGeometry = new THREE.PlaneGeometry(200, 200, 256, 256);

    // Initialize ship positions array with 32 zero vectors
    const initialPositions = [];
    for (let i = 0; i < 32; i++) {
        initialPositions.push(new THREE.Vector3(0, 0, 0));
    }

    // Initialize ship velocities array
    const initialVelocities = [];
    for (let i = 0; i < 32; i++) {
        initialVelocities.push(new THREE.Vector3(0, 0, 0));
    }

    // Shader uniforms for wave animation and ship wake effects
    waterUniforms = {
        time: { value: 0.0 },
        waveSpeed: { value: 0.5 },
        waveHeight: { value: 0.3 },
        waveFrequency: { value: 2.0 },
        oceanColor: { value: new THREE.Color(0x1e90ff) },
        deepColor: { value: new THREE.Color(0x0a4d8f) },
        shipPositions: { value: initialPositions },
        shipVelocities: { value: initialVelocities },
        shipCount: { value: 0 }
    };

    // Custom shader material for animated water
    waterMaterial = new THREE.ShaderMaterial({
        uniforms: waterUniforms,
        vertexShader: `
            uniform float time;
            uniform float waveSpeed;
            uniform float waveHeight;
            uniform float waveFrequency;
            uniform vec3 shipPositions[32]; // Max 32 ships
            uniform vec3 shipVelocities[32]; // Ship velocities
            uniform int shipCount;

            varying vec3 vWorldPosition;
            varying float vWaveHeight;
            varying vec3 vNormal;

            void main() {
                vec3 pos = position;
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

                // Base wave pattern
                float wave1 = sin(pos.x * waveFrequency + time * waveSpeed) * waveHeight;
                float wave2 = sin(pos.y * waveFrequency * 0.7 + time * waveSpeed * 0.8) * waveHeight;
                float wave3 = cos((pos.x + pos.y) * waveFrequency * 0.5 + time * waveSpeed * 1.2) * waveHeight * 0.5;

                float waveDisplacement = wave1 + wave2 + wave3;

                // Add directional wake effect from ships
                for(int i = 0; i < 32; i++) {
                    if(i >= shipCount) break;

                    vec3 shipPos = shipPositions[i];
                    vec3 shipVel = shipVelocities[i];

                    vec2 toWater = vec2(vWorldPosition.x - shipPos.x, vWorldPosition.z - shipPos.z);
                    float dist = length(toWater);

                    // Only create wake behind the ship
                    if(dist > 0.1 && dist < 10.0) {
                        vec2 velDir = normalize(vec2(shipVel.x, shipVel.z));
                        float speed = length(vec2(shipVel.x, shipVel.z));

                        if(speed > 0.01) {
                            // Check if water point is behind the ship
                            vec2 toWaterNorm = normalize(toWater);
                            float behindShip = dot(toWaterNorm, -velDir);

                            if(behindShip > 0.2) {
                                // V-shaped wake pattern
                                float lateralDist = abs(dot(toWater, vec2(-velDir.y, velDir.x)));
                                float wakeAngle = lateralDist / dist;

                                if(wakeAngle < 0.6) {
                                    // Smoother fade out
                                    float distanceFade = exp(-dist * 0.18);
                                    float angleFade = smoothstep(0.6, 0.0, wakeAngle);
                                    float wakeFade = distanceFade * angleFade;

                                    // Bigger, more visible waves
                                    float wakeWave = sin(dist * 3.0 - time * 5.0) * wakeFade;
                                    waveDisplacement += wakeWave * 0.22 * min(speed, 5.0);
                                }
                            }
                        }
                    }
                }

                pos.z += waveDisplacement;
                vWaveHeight = waveDisplacement;

                // Calculate normal for lighting
                float delta = 0.1;
                float dx = sin((pos.x + delta) * waveFrequency + time * waveSpeed) * waveHeight -
                          sin((pos.x - delta) * waveFrequency + time * waveSpeed) * waveHeight;
                float dy = sin((pos.y + delta) * waveFrequency * 0.7 + time * waveSpeed * 0.8) * waveHeight -
                          sin((pos.y - delta) * waveFrequency * 0.7 + time * waveSpeed * 0.8) * waveHeight;

                vNormal = normalize(vec3(-dx, -dy, 2.0 * delta));

                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 oceanColor;
            uniform vec3 deepColor;

            varying vec3 vWorldPosition;
            varying float vWaveHeight;
            varying vec3 vNormal;

            void main() {
                // Mix colors based on wave height
                vec3 color = mix(deepColor, oceanColor, vWaveHeight * 2.0 + 0.5);

                // Simple directional lighting
                vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                float diffuse = max(dot(vNormal, lightDir), 0.3);

                // Add specular highlights
                vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                vec3 reflectDir = reflect(-lightDir, vNormal);
                float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);

                color = color * diffuse + vec3(1.0) * specular * 0.3;

                gl_FragColor = vec4(color, 1.0);
            }
        `,
        side: THREE.DoubleSide
    });

    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    water.receiveShadow = true;
    water.position.y = 0;

    scene.add(water);
}

/**
 * Updates water animation
 * @param {number} deltaTime - Time since last frame in seconds
 */
export function updateWater(deltaTime) {
    if (waterUniforms) {
        waterUniforms.time.value += deltaTime;
    }
}

/**
 * Updates camera to follow the player ship in third-person view
 * @param {THREE.Group} playerShip - The player's ship/cannon group
 * @param {boolean} freeCameraMode - Whether free camera mode is active
 */
export function updateCamera(playerShip, freeCameraMode = false) {
    if (!playerShip || !camera) return;

    // In free camera mode, enable OrbitControls
    if (freeCameraMode) {
        controls.enabled = true;
        // Always update target to player ship for orbiting (ship may still move from physics)
        controls.target.set(playerShip.position.x, playerShip.position.y + 2, playerShip.position.z);
        // Update controls (required for damping)
        controls.update();
        return;
    }

    // In third-person mode, disable OrbitControls and follow ship
    if (controls.enabled) {
        controls.enabled = false;
    }

    // Camera offset behind and above the ship (in local space)
    const cameraDistance = 12; // Distance behind ship
    const cameraHeight = 8;     // Height above ship

    // Get ship's rotation
    const shipRotation = playerShip.rotation.y;

    // Calculate camera position behind the ship
    const offsetX = Math.sin(shipRotation) * cameraDistance;
    const offsetZ = Math.cos(shipRotation) * cameraDistance;

    // Set camera position
    camera.position.x = playerShip.position.x + offsetX;
    camera.position.y = playerShip.position.y + cameraHeight;
    camera.position.z = playerShip.position.z + offsetZ;

    // Camera looks at a point in front of the ship
    const lookAheadDistance = 10;
    const lookAtX = playerShip.position.x - Math.sin(shipRotation) * lookAheadDistance;
    const lookAtZ = playerShip.position.z - Math.cos(shipRotation) * lookAheadDistance;

    camera.lookAt(lookAtX, playerShip.position.y + 2, lookAtZ);
}

/**
 * Updates ship positions for water wake effect
 * @param {Array} targets - Array of ship targets
 * @param {THREE.Group} playerShip - Player's cannon/ship group
 * @param {number} deltaTime - Time since last frame
 */
export function updateShipWakes(targets, playerShip, deltaTime) {
    if (!waterUniforms || deltaTime === 0) return;

    const positions = [];
    const velocities = [];
    let shipIndex = 0;

    // Add player ship position and velocity
    if (playerShip) {
        const currentPos = new THREE.Vector3(
            playerShip.position.x,
            playerShip.position.y,
            playerShip.position.z
        );
        positions.push(currentPos);

        // Calculate velocity
        const prevPos = previousShipPositions.get('player');
        if (prevPos) {
            const velocity = new THREE.Vector3().subVectors(currentPos, prevPos).divideScalar(deltaTime);
            velocities.push(velocity);
        } else {
            velocities.push(new THREE.Vector3(0, 0, 0));
        }
        previousShipPositions.set('player', currentPos.clone());
        shipIndex++;
    }

    // Add enemy ship positions and velocities
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        if (target.isMoving && target.mesh && !target.destroyed) {
            const currentPos = new THREE.Vector3(
                target.mesh.position.x,
                target.mesh.position.y,
                target.mesh.position.z
            );
            positions.push(currentPos);

            // Calculate velocity
            const prevPos = previousShipPositions.get(`enemy_${i}`);
            if (prevPos) {
                const velocity = new THREE.Vector3().subVectors(currentPos, prevPos).divideScalar(deltaTime);
                velocities.push(velocity);
            } else {
                velocities.push(new THREE.Vector3(0, 0, 0));
            }
            previousShipPositions.set(`enemy_${i}`, currentPos.clone());
            shipIndex++;
        }
    }

    // Pad arrays to 32 elements (shader array size)
    while (positions.length < 32) {
        positions.push(new THREE.Vector3(0, 0, 0));
        velocities.push(new THREE.Vector3(0, 0, 0));
    }

    // Update uniforms
    waterUniforms.shipPositions.value = positions;
    waterUniforms.shipVelocities.value = velocities;
    waterUniforms.shipCount.value = shipIndex;
}

/**
 * Handles window resize
 */
export function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Export scene components
 */
export { scene, camera, renderer, controls };

