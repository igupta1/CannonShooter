/**
 * scene.js - Scene setup with lights, ground, and shadows
 * Creates the 3D environment for the cannon shooter game
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;

/**
 * Creates and initializes the Three.js scene
 * @param {HTMLElement} container - DOM element to attach renderer to
 */
export function createScene(container) {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 20, 100);
    
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
 * Adds a ground plane that receives shadows
 */
function addGround() {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x228B22,
        roughness: 0.8,
        metalness: 0.2
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.receiveShadow = true;
    ground.position.y = 0;
    
    scene.add(ground);
    
    // Add grid helper for reference
    const gridHelper = new THREE.GridHelper(100, 50, 0x000000, 0x444444);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
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

