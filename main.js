import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap'; 

// Setup Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('viewer').appendChild(renderer.domElement);

let model;
const colors = ['white', 'black', 'blue', 'red', 'green', 'yellow', 'purple'];
const textures = [
  { name: 'Leather', path: '/leather.jpg' },
  { name: 'Fabric', path: '/texture.jpg' }
];

// Loading Screen
const loadingScreen = document.getElementById('loading-screen');

scene.background = new THREE.Color('lightgrey'); // Lichtgrijs

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Load 3D Model
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/draco/');
loader.setDRACOLoader(dracoLoader);

loader.load(
  '/Shoe_compressed.glb',
  (gltf) => {
    if (loadingScreen) loadingScreen.style.display = 'none';
    model = gltf.scene;
    model.scale.set(15, 15, 15);

    model.traverse((child) => {
      if (child.isMesh) {
        child.material.envMapIntensity = 1;
      }
    });

    scene.add(model);
  },
  undefined,
  (error) => console.error('Error loading model:', error)
);

// Raycaster setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isAnimating = false;

// Mouse move event (updates raycaster position)
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Click event with Raycasting
window.addEventListener('click', () => {
  if (isAnimating) return; // Prevent overlapping animations
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const firstIntersect = intersects[0];
    if (!firstIntersect.object.material) return;

    // Handle raycast interaction
    if (firstIntersect.object.material.name === 'mat_laces') {
      isAnimating = true;
      highlightMaterial(firstIntersect.object.material);
      animateCamera(0, 5, 4);
    } else if (
      firstIntersect.object.material.name === 'mat_sole_top' ||
      firstIntersect.object.material.name === 'mat_sole_bottom'
    ) {
      isAnimating = true;
      highlightMaterial(firstIntersect.object.material);
      animateCamera(6, 0, 1);
    } else if (
      firstIntersect.object.material.name === 'mat_outside_1' ||
      firstIntersect.object.material.name === 'mat_outside_2' ||
      firstIntersect.object.material.name === 'mat_outside_3'
    ) {
      isAnimating = true;
      highlightMaterial(firstIntersect.object.material);
      animateCamera(-6, 0, 1);
    }
  }
});

// Helper functions for raycast animations
function highlightMaterial(material) {
  const originalEmissive = material.emissive.clone();
  material.emissive.set(0x00ff00); // Highlight color
  setTimeout(() => {
    material.emissive.copy(originalEmissive); // Reset to original color
    isAnimating = false;
  }, 500);
}

function animateCamera(x, y, z) {
  gsap.to(camera.position, {
    duration: 1,
    x,
    y,
    z,
    onComplete: () => (isAnimating = false),
  });
}

// Add Color and Texture Buttons
function createButtons(containerId, items, changeFunction, isTexture = false) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with ID "${containerId}" not found.`);
    return;
  }

  items.forEach((item) => {
    const button = document.createElement('button');
    button.className = isTexture ? 'texture-button' : 'color';
    if (isTexture) {
      button.style.backgroundImage = `url(${item.path})`;
      button.style.backgroundSize = 'cover';
    } else {
      button.style.backgroundColor = item;
    }
    button.onclick = () => changeFunction(isTexture ? item.path : item);
    container.appendChild(button);
  });
}

// Change Colors
function changeShoeColor(color) {
  if (!model) return;
  model.traverse((child) => {
    if (child.isMesh && child.name.includes('outside')) {
      child.material.color.set(color);
      child.material.map = null; // Remove texture
      child.material.needsUpdate = true;
    }
  });
}

function changeLaceColor(color) {
  if (!model) return;
  model.traverse((child) => {
    if (child.isMesh && child.name.includes('laces')) {
      child.material.color.set(color);
      child.material.map = null;
      child.material.needsUpdate = true;
    }
  });
}

function changeSoleColor(color) {
  if (!model) return;
  model.traverse((child) => {
    if (child.isMesh && child.name.includes('sole')) {
      child.material.color.set(color);
      child.material.map = null;
      child.material.needsUpdate = true;
    }
  });
}

// Apply Texture
function applyTexture(texturePath) {
  if (!model) return;
  const texture = textureLoader.load(texturePath, () => {
    console.log('Texture loaded:', texturePath);
  }, undefined, (error) => {
    console.error('Error loading texture:', error);
  });
  model.traverse((child) => {
    if (child.isMesh && (child.name.includes('outside') || child.name.includes('laces') || child.name.includes('sole'))) {
      child.material.map = texture;
      child.material.color.set("black"); // Set to light gray to make texture more visible // Reset color to ensure texture is visible
      child.material.needsUpdate = true;
    }
  });
}

// Reset Model
function resetModel() {
  changeShoeColor('white');
  changeLaceColor('white');
  changeSoleColor('white');
}

// Add Buttons to UI
createButtons('shoe-colors', colors, changeShoeColor);
createButtons('lace-colors', colors, changeLaceColor);
createButtons('sole-colors', colors, changeSoleColor);
createButtons('texture-options', textures, applyTexture, true);

const resetButton = document.getElementById('reset-button');
if (resetButton) {
  resetButton.addEventListener('click', resetModel);
} else {
  console.error('Reset button not found.');
}

// Tab functionality
const tabs = document.querySelectorAll('.tab-button');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    contents.forEach((content) => {
      content.classList.remove('active');
      if (content.id === tab.dataset.tab) {
        content.classList.add('active');
      }
    });
  });
});

// Camera & Controls
camera.position.set(0, 2, 8);
const controls = new OrbitControls(camera, renderer.domElement);

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
