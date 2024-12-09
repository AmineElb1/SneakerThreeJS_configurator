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

renderer.setPixelRatio(window.devicePixelRatio);

let model;
const colors = ['white', 'black', 'blue', 'red', 'green', 'yellow', 'purple'];
const textureLoader = new THREE.TextureLoader();
const textures = {
  leather: {
    albedo: textureLoader.load('/public/textures/leatherTexture.jpg'),
  },
  vinyl: {
    albedo: textureLoader.load('/public/textures/vinyl.jpg'),
  },
};

// Scene Background
scene.background = new THREE.Color('lightgrey');

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
    model = gltf.scene;
    model.scale.set(15, 15, 15);

    model.traverse((child) => {
      if (child.isMesh) {
        child.material.envMapIntensity = 1;
      }
    });

    scene.add(model);
    console.log('Model loaded successfully.');
  },
  undefined,
  (error) => console.error('Error loading model:', error)
);

// Raycaster setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isAnimating = false;

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Click event with Raycasting
window.addEventListener('click', () => {
  if (isAnimating) return;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const firstIntersect = intersects[0];
    if (!firstIntersect.object.material) return;

    if (firstIntersect.object.material.name === 'mat_laces') {
      highlightMaterial(firstIntersect.object.material);
    }
  }
});

function highlightMaterial(material) {
  const originalEmissive = material.emissive.clone();
  material.emissive.set(0x00ff00);
  setTimeout(() => {
    material.emissive.copy(originalEmissive);
    isAnimating = false;
  }, 500);
}

// Accordion functionality for sections
function setupAccordion() {
  const sections = document.querySelectorAll('.section-header');
  const sectionContents = document.querySelectorAll('.section-content');

  sections.forEach((section) => {
    section.addEventListener('click', () => {
      const contentId = section.dataset.section;
      const content = document.getElementById(contentId);

      if (!content) {
        console.error(`No content found for section: ${contentId}`);
        return;
      }

      const isOpen = content.classList.contains('active');

      sectionContents.forEach((c) => c.classList.remove('active'));
      sections.forEach((s) => s.classList.remove('active'));

      if (!isOpen) {
        content.classList.add('active');
        section.classList.add('active');
      }
      console.log(`Clicked section: ${section.dataset.section}`);
    });
  });
}

// Initialize accordion
setupAccordion();

// Change Colors
function changeShoeColor(color) {
  if (!model) return;
  model.traverse((child) => {
    if (child.isMesh && child.name.includes('outside')) {
      child.material.color.set(color);
      child.material.map = null;
      child.material.needsUpdate = true;
    }
  });

  const currentShoeColorElement = document.getElementById('current-shoe-color');
  if (currentShoeColorElement) {
    currentShoeColorElement.style.backgroundColor = color;
    console.log(`Current shoe color updated to: ${color}`);
  }
}

function changeLaceColor(color) {
  if (!model) return;
  model.traverse((child) => {
    if (child.isMesh && child.name.includes('laces')) {
      child.material.color.set(color);
      child.material.needsUpdate = true;
    }
  });

  const currentLaceColorElement = document.getElementById('current-lace-color');
  if (currentLaceColorElement) {
    currentLaceColorElement.style.backgroundColor = color;
    console.log(`Current lace color updated to: ${color}`);
  }
}

function changeSoleColor(color) {
  if (!model) return;
  model.traverse((child) => {
    if (child.isMesh && child.name.includes('sole')) {
      child.material.color.set(color);
      child.material.needsUpdate = true;
    }
  });

  const currentSoleColorElement = document.getElementById('current-sole-color');
  if (currentSoleColorElement) {
    currentSoleColorElement.style.backgroundColor = color;
    console.log(`Current sole color updated to: ${color}`);
  }
}

function changeTexture(texture) {
  if (!model) return;
  model.traverse((child) => {
    if (child.isMesh && child.name.includes('outside')) {
      child.material.map = texture.albedo || null;
      child.material.needsUpdate = true;
    }
  });
}

// Add Buttons to UI
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
      if (item.albedo?.image) {
        button.style.backgroundImage = `url(${item.albedo.src})`;
      } else {
        button.style.backgroundImage = `url('/public/textures/vinyl.jpg')`;
      }
      button.style.backgroundSize = 'cover';
    } else {
      button.style.backgroundColor = item;
    }

    button.onclick = () => changeFunction(item);
    container.appendChild(button);
  });
}

// UI Buttons
createButtons('shoe-colors', colors, changeShoeColor);
createButtons('lace-colors', colors, changeLaceColor);
createButtons('sole-colors', colors, changeSoleColor);
createButtons('texture-options', Object.values(textures), changeTexture, true);

// Camera & Controls
camera.position.set(0, 2, 8);
const controls = new OrbitControls(camera, renderer.domElement);

function resetModel() {
  if (!model) {
    console.error('Model not loaded yet.');
    return;
  }

  changeShoeColor('white');
  changeLaceColor('white');
  changeSoleColor('white');

  model.traverse((child) => {
    if (child.isMesh) {
      child.material.map = null;
      child.material.needsUpdate = true;
    }
  });

  document.getElementById('current-shoe-color').style.backgroundColor = 'white';
  document.getElementById('current-lace-color').style.backgroundColor = 'white';
  document.getElementById('current-sole-color').style.backgroundColor = 'white';

  const currentTextureDisplay = document.getElementById('current-texture-display');
  if (currentTextureDisplay) {
    currentTextureDisplay.style.backgroundImage = 'none';
  }

  console.log('Model has been reset to default values.');
}

const resetButton = document.getElementById('reset-button');
if (resetButton) {
  resetButton.addEventListener('click', resetModel);
} else {
  console.error('Reset button not found.');
}

// Modal Functionality
const orderButton = document.getElementById('order-button');
const orderModal = document.getElementById('order-modal');
const closeModal = document.getElementById('close-modal');
const orderForm = document.getElementById('order-form');

// Show modal
orderButton.addEventListener('click', () => {
  orderModal.classList.remove('hidden');
});

// Close modal
closeModal.addEventListener('click', () => {
  orderModal.classList.add('hidden');
});

// Submit order
orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(orderForm);
  const orderData = {
    customerName: formData.get('name'),
    email: formData.get('email'),
    address: formData.get('address'),
    size: formData.get('size'),
    configuration: {
      shoeColor: document.getElementById('current-shoe-color').style.backgroundColor,
      laceColor: document.getElementById('current-lace-color').style.backgroundColor,
      soleColor: document.getElementById('current-sole-color').style.backgroundColor,
    },
  };

  try {
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (response.ok) {
      alert('Bestelling geplaatst!');
      orderModal.classList.add('hidden');
    } else {
      alert('Fout bij het plaatsen van de bestelling.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Er is een onverwachte fout opgetreden.');
  }
});

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