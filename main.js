import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'dat.gui';
import './style.css';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Schaduwen inschakelen
document.body.appendChild(renderer.domElement);

// Environment Map
const cubeTextureLoader = new THREE.CubeTextureLoader();
const environmentMap = cubeTextureLoader.load([
  '/px.jpg', // Positieve X-richting
  '/nx.jpg', // Negatieve X-richting
  '/py.jpg', // Positieve Y-richting
  '/ny.jpg', // Negatieve Y-richting
  '/pz.jpg', // Positieve Z-richting
  '/nz.jpg', // Negatieve Z-richting
]);

scene.background = environmentMap; // Voeg de environment map toe als achtergrond
scene.environment = environmentMap; // Gebruik de map voor reflecties/verlichting

// Verlichting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Omgevingslicht
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
scene.add(directionalLight);

// GLTF Model Loader met DRACO Loader
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/draco/'); // Externe Draco-decoder
loader.setDRACOLoader(dracoLoader);

let model;
loader.load(
  '/Shoe_compressed.glb', // Zorg ervoor dat dit je eigen modelbestand is
  (gltf) => {
    model = gltf.scene;
    model.scale.set(15, 15, 15);
    model.traverse((child) => {
      if (child.isMesh) {
        child.material.envMap = environmentMap; // Voeg de environment map toe aan het materiaal
        child.material.needsUpdate = true; // Zorg ervoor dat het materiaal wordt bijgewerkt
      }
    });
    scene.add(model);
  },
  undefined,
  (error) => console.error(error)
);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// GUI instellingen
const gui = new GUI();
const settings = {
  lightIntensity: 1,
  lightPositionX: 5,
  lightPositionY: 10,
  lightPositionZ: 7,
};

gui.add(settings, 'lightIntensity', 0, 2).onChange((value) => {
  directionalLight.intensity = value;
});
gui.add(settings, 'lightPositionX', -10, 10).onChange((value) => {
  directionalLight.position.x = value;
});
gui.add(settings, 'lightPositionY', 0, 20).onChange((value) => {
  directionalLight.position.y = value;
});
gui.add(settings, 'lightPositionZ', -10, 10).onChange((value) => {
  directionalLight.position.z = value;
});

// Camera positie
camera.position.set(0, 2, 8);

// Background (voor testing)
scene.background = new THREE.Color('White');

// Animatie
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
