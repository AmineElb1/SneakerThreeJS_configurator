import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Setup Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('viewer').appendChild(renderer.domElement);

let model;
const colors = ['white', 'black', 'blue', 'red'];

// Loading Screen
const loadingScreen = document.getElementById('loading-screen');

// Load Environment Map
const environmentMap = new THREE.TextureLoader().load('/textures/studio_small.jpg');
scene.environment = environmentMap;

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
    model.scale.set(20, 20, 20);

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

// Add Color Buttons
function createColorButtons(containerId, changeFunction) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with ID "${containerId}" not found.`);
    return;
  }

  colors.forEach((color) => {
    const button = document.createElement('button');
    button.className = 'color';
    button.style.backgroundColor = color;
    button.onclick = () => changeFunction(color);
    container.appendChild(button);
  });
}

// Change Colors
function changeShoeColor(color) {
  if (!model) return;
  model.traverse((child) => {
    if (child.isMesh && child.name.includes('outside')) {
      child.material.color.set(color);
    }
  });
}

function changeLaceColor(color) {
  if (!model) return;
  model.traverse((child) => {
    if (child.isMesh && child.name.includes('laces')) {
      child.material.color.set(color);
    }
  });
}

function changeSoleColor(color) {
  if (!model) return;
  model.traverse((child) => {
    if (child.isMesh && child.name.includes('sole')) {
      child.material.color.set(color);
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
createColorButtons('shoe-colors', changeShoeColor);
createColorButtons('lace-colors', changeLaceColor);
createColorButtons('sole-colors', changeSoleColor);

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
