import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { XRButton } from 'three/addons/webxr/XRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

init();

function init() {
  console.log('init');
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(0, 1.6, 3);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0.3, 0.5, 0.8);
  scene.fog = new THREE.Fog("gold", 1, 80);

  const ambientColor = 0xffffff;
  const ambientIntensity = 0.1;
  const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
  scene.add(ambientLight);

  // model
  const loader = new GLTFLoader().setPath('src/assets/cathedral/');
  loader.load(
    // resource URL
    'scene.gltf',
    // called when the resource is loaded
    async function (gltf) {
      console.log('resource is loaded');
      const model = gltf.scene;

      // wait until the model can be added to the scene without blocking due to shader compilation
      await renderer.compileAsync(model, camera, scene);
      scene.add(model);
      render();
    },
    // called while loading is progressing
    function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    // called when loading has errors
    function (error) {
      console.log('An error happened', error);
    }
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.xr.enabled = true;
  renderer.setAnimationLoop(render);
  container.appendChild(renderer.domElement);

  //
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', render); // use if there is no animation loop
  controls.minDistance = 2;
  controls.maxDistance = 25;
  controls.target.set(0, 0, 0);
  controls.update();

  document.body.appendChild(XRButton.createButton(renderer));

  // controllers
  function onSelectStart() {
    this.userData.isSelecting = true;
  }

  function onSelectEnd() {
    this.userData.isSelecting = false;
  }

  function onSqueezeStart() {
    this.userData.isSqueezing = true;
  }

  function onSqueezeEnd() {
    this.userData.isSqueezing = false;
  }

  controller1 = renderer.xr.getController(0);
  controller1.addEventListener('selectstart', onSelectStart);
  controller1.addEventListener('selectend', onSelectEnd);
  controller1.addEventListener('squeezestart', onSqueezeStart);
  controller1.addEventListener('squeezeend', onSqueezeEnd);
  controller1.addEventListener('connected', function (event) {
    this.add(buildController(event.data));
  });
  controller1.addEventListener('disconnected', function () {
    this.remove(this.children[0]);
  });
  controller1.userData.tag = 'controller1';
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener('selectstart', onSelectStart);
  controller2.addEventListener('selectend', onSelectEnd);
  controller2.addEventListener('squeezestart', onSqueezeStart);
  controller2.addEventListener('squeezeend', onSqueezeEnd);
  controller2.addEventListener('connected', function (event) {
    this.add(buildController(event.data));
  });
  controller2.addEventListener('disconnected', function () {
    this.remove(this.children[0]);
  });
  controller2.userData.tag = 'controller2';
  scene.add(controller2);

  // The XRControllerModelFactory will automatically fetch controller models
  // that match what the user is holding as closely as possible. The models
  // should be attached to the object returned from getControllerGrip in
  // order to match the orientation of the held device.

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
  scene.add(controllerGrip2);

  //
  window.addEventListener('resize', onWindowResize);
}

function buildController(data) {
  let geometry, material;

  switch (data.targetRayMode) {
    case 'tracked-pointer':
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, - 1], 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3));
      material = new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending });
      return new THREE.Line(geometry, material);

    case 'gaze':
      geometry = new THREE.RingGeometry(0.02, 0.04, 32).translate(0, 0, - 1);
      material = new THREE.MeshBasicMaterial({ opacity: 0.5, transparent: true });
      return new THREE.Mesh(geometry, material);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function handleController(controller) {
  if (controller.userData.isSelecting) {
    console.log('handleController %s isSelecting', controller.userData.tag);
    const c = renderer.xr.getCamera();
    console.log('handleController s camera.position.y: ', c.position);
    c.position.y = c.position.y + 1;
    console.log('handleController e camera.position.y: ', c.position);

    // physics.setMeshPosition(spheres, controller.position, count);
    // velocity.x = (Math.random() - 0.5) * 2;
    // velocity.y = (Math.random() - 0.5) * 2;
    // velocity.z = (Math.random() - 9);
    // velocity.applyQuaternion(controller.quaternion);
    // physics.setMeshVelocity(spheres, velocity, count);

    // if (++count === spheres.count) count = 0;
  }
  if (controller.userData.isSqueezing) {
    console.log('handleController %s isSqueezing', controller.userData.tag);
    const c = renderer.xr.getCamera();
    console.log('handleController s camera.position.y: ', c.position);
    c.position.y = c.position.y - 1;
    console.log('handleController e camera.position.y: ', c.position);
  }
}

function render() {
  handleController(controller1);
  handleController(controller2);
  renderer.render(scene, camera);
}
