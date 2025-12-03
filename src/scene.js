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

    // Enhanced shader uniforms for realistic ocean
    waterUniforms = {
        time: { value: 0.0 },
        waveSpeed: { value: 0.4 },
        waveHeight: { value: 0.25 },  // Reduced for smoother waves
        waveFrequency: { value: 1.8 },
        // Natural ocean color palette
        shallowColor: { value: new THREE.Color(0x40A4C4) },    // Light tropical blue
        deepColor: { value: new THREE.Color(0x0D4F6E) },       // Deep ocean blue
        midColor: { value: new THREE.Color(0x1A6E8E) },        // Mid ocean blue
        foamColor: { value: new THREE.Color(0xF0F8FF) },       // Slightly blue-tinted white foam
        skyColor: { value: new THREE.Color(0x87CEEB) },        // Sky reflection
        sunColor: { value: new THREE.Color(0xFFFAE0) },        // Warm sun color
        shipPositions: { value: initialPositions },
        shipVelocities: { value: initialVelocities },
        shipCount: { value: 0 }
    };

    // Enhanced water shader with realistic ocean effects (optimized)
    waterMaterial = new THREE.ShaderMaterial({
        uniforms: waterUniforms,
        vertexShader: `
            uniform float time;
            uniform float waveSpeed;
            uniform float waveHeight;
            uniform float waveFrequency;
            uniform vec3 shipPositions[32];
            uniform vec3 shipVelocities[32];
            uniform int shipCount;

            varying vec3 vWorldPosition;
            varying float vWaveHeight;
            varying vec3 vNormal;
            varying float vFoam;
            varying float vDistanceFromCamera;

            void main() {
                vec3 pos = position;
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

                // Multi-frequency wave pattern for realistic ocean
                float t = time * waveSpeed;
                
                // Large rolling swells
                float wave1 = sin(pos.x * waveFrequency * 0.3 + t * 0.7) * waveHeight * 1.2;
                float wave2 = sin(pos.y * waveFrequency * 0.25 + t * 0.5) * waveHeight * 1.0;
                
                // Medium waves
                float wave3 = sin(pos.x * waveFrequency + t) * waveHeight * 0.6;
                float wave4 = cos(pos.y * waveFrequency * 0.8 + t * 1.2) * waveHeight * 0.5;
                
                // Small choppy detail (using simple hash instead of noise)
                float chop = sin(pos.x * 3.7 + pos.y * 2.3 + t * 2.0) * waveHeight * 0.15;
                float chop2 = cos(pos.x * 2.1 - pos.y * 4.1 + t * 2.5) * waveHeight * 0.1;
                
                // Cross waves
                float crossWave = sin((pos.x + pos.y) * waveFrequency * 0.6 + t * 0.9) * waveHeight * 0.4;

                float waveDisplacement = wave1 + wave2 + wave3 + wave4 + chop + chop2 + crossWave;
                
                // Track foam from steep wave peaks
                float waveSlope = abs(wave3 + wave4) / waveHeight;
                vFoam = smoothstep(0.8, 1.3, waveSlope);

                // Ship wake effects
                for(int i = 0; i < 32; i++) {
                    if(i >= shipCount) break;

                    vec3 shipPos = shipPositions[i];
                    vec3 shipVel = shipVelocities[i];

                    vec2 toWater = vec2(vWorldPosition.x - shipPos.x, vWorldPosition.z - shipPos.z);
                    float dist = length(toWater);

                    if(dist > 0.1 && dist < 12.0) {
                        vec2 velDir = normalize(vec2(shipVel.x, shipVel.z) + vec2(0.001));
                        float speed = length(vec2(shipVel.x, shipVel.z));

                        if(speed > 0.01) {
                            vec2 toWaterNorm = normalize(toWater);
                            float behindShip = dot(toWaterNorm, -velDir);

                            if(behindShip > 0.15) {
                                float lateralDist = abs(dot(toWater, vec2(-velDir.y, velDir.x)));
                                float wakeAngle = lateralDist / dist;

                                if(wakeAngle < 0.7) {
                                    float distanceFade = exp(-dist * 0.15);
                                    float angleFade = smoothstep(0.7, 0.0, wakeAngle);
                                    float wakeFade = distanceFade * angleFade;

                                    float wakeWave = sin(dist * 2.5 - time * 4.0) * wakeFade;
                                    waveDisplacement += wakeWave * 0.25 * min(speed, 6.0);
                                    
                                    vFoam += wakeFade * 0.4 * min(speed, 3.0);
                                }
                            }
                            
                            if(dist < 3.0 && behindShip < 0.0) {
                                vFoam += (1.0 - dist / 3.0) * speed * 0.25;
                            }
                        }
                    }
                }

                pos.z += waveDisplacement;
                vWaveHeight = waveDisplacement;

                // Calculate normal
                float delta = 0.15;
                float hL = sin((pos.x - delta) * waveFrequency + t) * waveHeight;
                float hR = sin((pos.x + delta) * waveFrequency + t) * waveHeight;
                float hD = sin((pos.y - delta) * waveFrequency * 0.8 + t * 1.2) * waveHeight;
                float hU = sin((pos.y + delta) * waveFrequency * 0.8 + t * 1.2) * waveHeight;
                
                vNormal = normalize(vec3(hL - hR, hD - hU, delta * 2.0));
                vDistanceFromCamera = length(cameraPosition - vWorldPosition);

                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 shallowColor;
            uniform vec3 deepColor;
            uniform vec3 midColor;
            uniform vec3 foamColor;
            uniform vec3 skyColor;
            uniform vec3 sunColor;

            varying vec3 vWorldPosition;
            varying float vWaveHeight;
            varying vec3 vNormal;
            varying float vFoam;
            varying float vDistanceFromCamera;

            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                vec3 sunDir = normalize(vec3(0.5, 0.7, 0.3));
                
                // === FRESNEL - more reflective at grazing angles ===
                float fresnel = pow(1.0 - max(dot(viewDir, vec3(0.0, 1.0, 0.0)), 0.0), 2.5);
                fresnel = mix(0.1, 0.7, fresnel);
                
                // === BASE WATER COLOR - brighter, more natural ===
                float heightFactor = (vWaveHeight + 0.3) * 1.2;
                heightFactor = clamp(heightFactor, 0.0, 1.0);
                
                // Smooth gradient from deep to shallow
                vec3 waterColor = mix(deepColor, midColor, heightFactor * 0.7);
                waterColor = mix(waterColor, shallowColor, heightFactor * heightFactor * 0.5);
                
                // Brighten overall
                waterColor *= 1.15;
                
                // === SUBSURFACE SCATTERING - light through waves ===
                float sss = pow(max(dot(viewDir, -sunDir), 0.0), 3.0);
                vec3 subsurface = shallowColor * sss * 0.3;
                waterColor += subsurface;
                
                // === DIFFUSE LIGHTING ===
                float diffuse = max(dot(normal, sunDir), 0.0);
                diffuse = diffuse * 0.4 + 0.6; // Keep shadows soft
                waterColor *= diffuse;
                
                // === SPECULAR HIGHLIGHTS ===
                vec3 halfDir = normalize(sunDir + viewDir);
                float spec1 = pow(max(dot(normal, halfDir), 0.0), 128.0);
                float spec2 = pow(max(dot(normal, halfDir), 0.0), 16.0);
                vec3 specularColor = sunColor * (spec1 * 1.2 + spec2 * 0.2);
                
                // === SKY REFLECTION ===
                vec3 reflectDir = reflect(-viewDir, normal);
                float skyBlend = max(reflectDir.y * 0.5 + 0.5, 0.0);
                vec3 skyReflect = mix(skyColor * 0.5, skyColor * 0.9, skyBlend);
                
                // === FOAM on wave crests ===
                float foam = smoothstep(0.3, 0.9, vFoam);
                float foamPattern = fract(sin(dot(vWorldPosition.xz * 3.0, vec2(12.9898, 78.233))) * 43758.5453);
                foam *= 0.6 + foamPattern * 0.4;
                
                // === COMBINE ===
                vec3 finalColor = waterColor;
                
                // Blend in sky reflection
                finalColor = mix(finalColor, skyReflect, fresnel * 0.5);
                
                // Add sun sparkle
                finalColor += specularColor;
                
                // Add white foam
                finalColor = mix(finalColor, foamColor, foam * 0.8);
                
                // === HORIZON FOG ===
                float fogFactor = smoothstep(50.0, 150.0, vDistanceFromCamera);
                vec3 horizonColor = mix(skyColor, vec3(0.7, 0.85, 0.95), 0.3);
                finalColor = mix(finalColor, horizonColor, fogFactor * 0.6);

                gl_FragColor = vec4(finalColor, 1.0);
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

