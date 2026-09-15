import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// シーンの初期設定
const scene = new THREE.Scene();
scene.background = new THREE.Color('#050915');
scene.fog = new THREE.Fog('#050915', 14, 36);

// レンダラーの設定
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// カメラと操作設定
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 18);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = true;
controls.minDistance = 8;
controls.maxDistance = 24;
controls.maxPolarAngle = Math.PI * 0.9;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

// Bloom を使ってAIの思考が光って見えるようにする
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.6,
  0.5,
  0.1
);
bloomPass.threshold = 0.15;
bloomPass.strength = 1.5;
bloomPass.radius = 0.7;
composer.addPass(bloomPass);

// 全体の照明
const ambient = new THREE.AmbientLight('#6cb7ff', 0.9);
scene.add(ambient);

const keyLight = new THREE.PointLight('#7ad8ff', 40, 50, 2);
keyLight.position.set(0, 8, 8);
scene.add(keyLight);

const pulseLight = new THREE.PointLight('#ff79d8', 35, 50, 2);
pulseLight.position.set(0, -4, 0);
scene.add(pulseLight);

// 中心の思考コア
const coreGroup = new THREE.Group();
scene.add(coreGroup);

const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2.2, 1),
  new THREE.MeshPhysicalMaterial({
    color: '#c3a6ff',
    emissive: '#ff7ad9',
    emissiveIntensity: 1.8,
    roughness: 0.2,
    metalness: 0.7,
    transparent: true,
    opacity: 0.95,
    transmission: 0.35,
    thickness: 1.2
  })
);
coreGroup.add(core);

const coreHalo = new THREE.Mesh(
  new THREE.TorusGeometry(3.2, 0.09, 12, 120),
  new THREE.MeshBasicMaterial({
    color: '#87d6ff',
    transparent: true,
    opacity: 0.7
  })
);
coreHalo.rotation.x = Math.PI / 2;
coreGroup.add(coreHalo);

const ring2 = new THREE.Mesh(
  new THREE.TorusGeometry(4.5, 0.04, 8, 200),
  new THREE.MeshBasicMaterial({
    color: '#7ef6d1',
    transparent: true,
    opacity: 0.7
  })
);
ring2.rotation.y = Math.PI / 3;
coreGroup.add(ring2);

// ニューロンのようなノード群を球体で配置する
const nodeCount = 22;
const nodePositions = [];
const nodeMeshes = [];
const nodeRadius = 6.5;

for (let i = 0; i < nodeCount; i += 1) {
  const phi = Math.acos(1 - (2 * (i + 0.5)) / nodeCount);
  const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
  const x = nodeRadius * Math.sin(phi) * Math.cos(theta);
  const y = nodeRadius * Math.cos(phi);
  const z = nodeRadius * Math.sin(phi) * Math.sin(theta);

  nodePositions.push(new THREE.Vector3(x, y, z));

  const node = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshStandardMaterial({
      color: '#8be9fd',
      emissive: '#78d6ff',
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.5
    })
  );

  node.position.set(x, y, z);
  nodeMeshes.push(node);
  scene.add(node);
}

// ノード間の接続線を生成
const linePositions = [];
const lineColors = [];
const connectionColorA = new THREE.Color('#7ad8ff');
const connectionColorB = new THREE.Color('#ff8ae3');

for (let i = 0; i < nodeMeshes.length; i += 1) {
  const a = nodeMeshes[i].position;
  const b = new THREE.Vector3(0, 0, 0);
  const dist = a.distanceTo(b);
  if (dist < 10) {
    linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    lineColors.push(connectionColorA.r, connectionColorA.g, connectionColorA.b);
    lineColors.push(connectionColorB.r, connectionColorB.g, connectionColorB.b);
  }

  for (let j = i + 1; j < nodeMeshes.length; j += 1) {
    const bPos = nodeMeshes[j].position;
    if (a.distanceTo(bPos) < 3.2) {
      linePositions.push(a.x, a.y, a.z, bPos.x, bPos.y, bPos.z);
      lineColors.push(connectionColorA.r, connectionColorA.g, connectionColorA.b);
      lineColors.push(connectionColorB.r, connectionColorB.g, connectionColorB.b);
    }
  }
}

const lineGeometry = new THREE.BufferGeometry();
lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

const connectionLines = new THREE.LineSegments(
  lineGeometry,
  new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  })
);
scene.add(connectionLines);

// 思考を粒子として流す
const particleCount = 900;
const particlePositions = new Float32Array(particleCount * 3);
const particleBase = new Float32Array(particleCount * 3);
const particleSpeed = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i += 1) {
  const i3 = i * 3;
  const radius = 3 + Math.random() * 11;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  particlePositions[i3] = x;
  particlePositions[i3 + 1] = y;
  particlePositions[i3 + 2] = z;

  particleBase[i3] = x;
  particleBase[i3 + 1] = y;
  particleBase[i3 + 2] = z;
  particleSpeed[i] = 0.2 + Math.random() * 0.8;
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

const particleMaterial = new THREE.PointsMaterial({
  color: '#7ef6d1',
  size: 0.08,
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const thoughts = new THREE.Points(particleGeometry, particleMaterial);
scene.add(thoughts);

// 画面サイズ変更に対応
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

// アニメーションで AI の脳内が揺らいでいるように見せる
function animate() {
  const elapsed = clock.getElapsedTime();

  core.rotation.x = elapsed * 0.8;
  core.rotation.y = elapsed * 1.1;
  core.scale.setScalar(1 + Math.sin(elapsed * 2.2) * 0.08);

  coreHalo.rotation.z = elapsed * 0.7;
  ring2.rotation.x = elapsed * 0.5;
  ring2.rotation.z = elapsed * 0.9;

  nodeMeshes.forEach((node, index) => {
    const angle = elapsed * (0.6 + index * 0.04) + index * 1.12;
    const radius = 6 + Math.sin(elapsed * 1.5 + index) * 0.8;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle * 1.7) * 2.2;
    const z = Math.sin(angle) * radius;
    node.position.set(x, y, z);
    node.scale.setScalar(0.9 + Math.sin(elapsed * 2.2 + index) * 0.2);
  });

  const positions = particleGeometry.attributes.position.array;
  for (let i = 0; i < particleCount; i += 1) {
    const i3 = i * 3;
    const angle = elapsed * (0.4 + particleSpeed[i] * 0.8) + i;
    const radius = 3 + Math.sin(elapsed * 1.8 + i * 0.15) * 1.5 + particleBase[i3] * 0.12;
    positions[i3] = particleBase[i3] * 0.8 + Math.cos(angle) * radius * 0.45;
    positions[i3 + 1] = particleBase[i3 + 1] * 0.9 + Math.sin(angle * 1.7) * 1.8;
    positions[i3 + 2] = particleBase[i3 + 2] * 0.8 + Math.sin(angle) * radius * 0.45;
  }
  particleGeometry.attributes.position.needsUpdate = true;

  controls.update();
  composer.render();
  requestAnimationFrame(animate);
}

animate();
