/**
 * scene.js - Scene setup with lights, ground, and shadows
 * Creates the 3D environment for the cannon shooter game
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let waterMaterial, waterUniforms;

/**
 * Creates and initializes the Three.js scene
 * @param {HTMLElement} container - DOM element to attach renderer to
 */
export function createScene(container) {
    // Create scene - ocean theme
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 30, 120);
    
    // Create camera - positioned behind cannon looking toward blocks
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 2, -10);
    
    // Create renderer with shadows
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Create orbit controls - target the area between cannon and blocks
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
    controls.target.set(0, 2, -10); // Look toward block area
    controls.update();
    
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

    // Shader uniforms for wave animation and ship wake effects
    waterUniforms = {
        time: { value: 0.0 },
        waveSpeed: { value: 0.5 },
        waveHeight: { value: 0.3 },
        waveFrequency: { value: 2.0 },
        oceanColor: { value: new THREE.Color(0x1e90ff) },
        deepColor: { value: new THREE.Color(0x0a4d8f) },
        shipPositions: { value: initialPositions },
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

                // Add wake effect from ships
                for(int i = 0; i < 32; i++) {
                    if(i >= shipCount) break;

                    vec3 shipPos = shipPositions[i];
                    float dist = distance(vec2(vWorldPosition.x, vWorldPosition.z), vec2(shipPos.x, shipPos.z));

                    // Create ripples radiating from ship
                    if(dist < 15.0) {
                        float ripple = sin(dist * 2.0 - time * 3.0) * exp(-dist * 0.15);
                        waveDisplacement += ripple * 0.4;
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
 * Updates ship positions for water wake effect
 * @param {Array} targets - Array of ship targets
 */
export function updateShipWakes(targets) {
    if (!waterUniforms) return;

    const positions = [];
    for (const target of targets) {
        if (target.isMoving && target.mesh && !target.destroyed) {
            // Create a new Vector3 for each ship position
            positions.push(new THREE.Vector3(
                target.mesh.position.x,
                target.mesh.position.y,
                target.mesh.position.z
            ));
        }
    }

    // Pad array to 32 elements (shader array size)
    while (positions.length < 32) {
        positions.push(new THREE.Vector3(0, 0, 0));
    }

    // Update uniforms
    waterUniforms.shipPositions.value = positions;
    waterUniforms.shipCount.value = Math.min(targets.filter(t => t.isMoving).length, 32);
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

