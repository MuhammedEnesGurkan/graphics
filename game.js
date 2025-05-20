// 3D WebGL Araba Yarış Simülasyonu - Three.js ile GLB Asset Desteği

//import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
//import { GLTFLoader } from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/GLTFLoader.js';

// Global değişkenler

let scene, camera, renderer;
let carPosition = 1; // 0 = en sol şerit, 3 = en sağ şerit (toplam 4 şerit)
let carZ = 0; // Arabanın Z pozisyonu (ileri hareket)
let initialCarSpeed = 0.1; // Başlangıç hızı
let carSpeed = initialCarSpeed; // Arabanın ileri hareket hızı
let obstacles = [];
let gameActive = true;
let score = 0;
let cameraHeight = 2.0;
let cameraDistance = 8.0;

// 3D Modeller
let carModel = null;
let roadSegments = [];
let obstacleModels = [];

// GLB Loader
const loader = new THREE.GLTFLoader();

// Sahne nesneleri
let playerCar = null;
let roadGroup = null;

// Oyunu başlat
async function init() {
    const canvas = document.getElementById('gameCanvas');
    
    // Three.js sahne kurulumu
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    
    // Kamera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x87CEEB); // Gökyüzü mavisi
    
    // Işıklar
    setupLighting();
    
    // Pencere boyut değişikliği
    window.addEventListener('resize', onWindowResize);
    
    // Kontroller
    document.addEventListener('keydown', handleKeyPress);
    
    // Yolu oluştur
    createRoad();
    
    // Araba modelini yükle
    await loadCarModel();
    
    // Engelleri oluştur
    createObstacles();
    
    // Oyun döngüsünü başlat
    gameLoop();
}

function setupLighting() {
    // Güneş ışığı
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
    
    // Ortam ışığı
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // Kamera ışığı (arabayı aydınlatmak için)
    const cameraLight = new THREE.SpotLight(0xffffff, 0.5);
    cameraLight.position.set(0, 10, 0);
    scene.add(cameraLight);
}

async function loadCarModel() {
    try {
        // Hudson Hornet modelini yükle
        const gltf = await new Promise((resolve, reject) => {
            loader.load(
                'graphics_three/assets/doc_hudson_the_fabulous_hudson_hornet.glb',
                resolve,
                undefined,
                reject
            );
        });
        
        carModel = gltf.scene;
        
        // Modeli ölçekle ve konumlandır
        carModel.scale.set(0.5, 0.5, 0.5);
        carModel.position.set(0, 0, 0);
       // carModel.rotation.y = Math.PI; // Arabayı döndür (ileri baksın)
        
        // Gölge ayarları
        carModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // Oyuncu arabasını oluştur
        playerCar = carModel.clone();
        playerCar.position.set(getXFromLane(carPosition), 0.2, carZ);
        scene.add(playerCar);
        
        console.log('Hudson Hornet modeli başarıyla yüklendi!');
        
    } catch (error) {
        console.warn('GLB model yüklenemedi, fallback küp kullanılıyor:', error);
        createFallbackCar();
    }
}

function createFallbackCar() {
    // Model yüklenemezse basit araba geometrisi oluştur
    const carGroup = new THREE.Group();
    
    // Ana gövde
    const bodyGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.25;
    body.castShadow = true;
    carGroup.add(body);
    
    // Üst kısım (cam)
    const roofGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.2);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x88ddff });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 0.7;
    roof.position.z = 0.2;
    roof.castShadow = true;
    carGroup.add(roof);
    
    // Tekerlekler
    const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    
    const wheels = [
        [-0.4, 0.1, 0.8],   // Sol ön
        [0.4, 0.1, 0.8],    // Sağ ön
        [-0.4, 0.1, -0.8],  // Sol arka
        [0.4, 0.1, -0.8]    // Sağ arka
    ];
    
    wheels.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        carGroup.add(wheel);
    });
    
    playerCar = carGroup;
    playerCar.position.set(getXFromLane(carPosition), 0, carZ);
    scene.add(playerCar);
}
function createRoad() {
  roadGroup = new THREE.Group();
  const ROAD_WIDTH = 8;

  // 1) Ana yol segmentleri
  const roadGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, 4);
  const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

  for (let i = -20; i < 60; i++) {
    const roadSegment = new THREE.Mesh(roadGeometry, roadMaterial);
    roadSegment.rotation.x = -Math.PI / 2;
    roadSegment.position.set(0, 0.01, i * 4);
    roadSegment.receiveShadow = true;
    roadGroup.add(roadSegment);

    // 2) Şerit çizgileri
    if (i % 2 === 0) {
      for (let lane = 1; lane < 4; lane++) {
        const lineGeo = new THREE.BoxGeometry(0.1, 0.01, 1.5);
        const lineMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        // getXFromLane, ROAD_WIDTH’e göre X konumunu hesaplar
        line.position.set(getXFromLane(lane), 0.02, i * 4);
        roadGroup.add(line);
      }
    }
  }

  // 3) Çim kenarları
  const grassGeo = new THREE.PlaneGeometry(100, 400);
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });

  const leftGrass = new THREE.Mesh(grassGeo, grassMat);
  leftGrass.rotation.x = -Math.PI / 2;
  leftGrass.position.set(-ROAD_WIDTH/2 - 1, -0.01, 50);
  roadGroup.add(leftGrass);

  const rightGrass = new THREE.Mesh(grassGeo, grassMat);
  rightGrass.rotation.x = -Math.PI / 2;
  rightGrass.position.set( ROAD_WIDTH/2 + 1, -0.01, 50);
  roadGroup.add(rightGrass);

  scene.add(roadGroup);
}


function createObstacles() {
    obstacles = [];
    const obstacleCount = 50;
    
    // Engel geometrileri
    const obstacleGeometries = [
        new THREE.BoxGeometry(0.8, 0.8, 0.8),    // Küp
        new THREE.ConeGeometry(0.4, 1.2, 8),     // Koni
        new THREE.SphereGeometry(0.5, 8, 6)      // Küre
    ];
    
    const obstacleColors = [0x0066ff, 0xff6600, 0xffff00];
    
    for (let i = 0; i < obstacleCount; i++) {
        const lane = Math.floor(Math.random() * 4);
        const z = (i + 3) * 6 + Math.random() * 3;
        const obstacleType = Math.floor(Math.random() * 3);
        
        const material = new THREE.MeshLambertMaterial({ color: obstacleColors[obstacleType] });
        const obstacle = new THREE.Mesh(obstacleGeometries[obstacleType], material);
        
        obstacle.position.set(getXFromLane(lane), 0.5, z);
        obstacle.castShadow = true;
        
        obstacle.userData = {
            lane: lane,
            z: z,
            type: obstacleType,
            originalY: 0.5
        };
        
        obstacles.push(obstacle);
        scene.add(obstacle);
    }
}

function getXFromLane(lane) {
    return (lane - 1.5) * 2; // Şerit pozisyonunu X koordinatına çevir
}

function handleKeyPress(event) {
    if (!gameActive && event.code === 'Space') {
        restartGame();
        return;
    }
    
    if (!gameActive) return;
    
    switch(event.code) {
        case 'ArrowLeft':
            if (carPosition > 0) {
                carPosition--;
                updateCarPosition();
            }
            break;
        case 'ArrowRight':
            if (carPosition < 3) {
                carPosition++;
                updateCarPosition();
            }
            break;
    }
}

function updateCarPosition() {
    if (playerCar) {
        const targetX = getXFromLane(carPosition);
        // Yumuşak geçiş için tween benzeri hareket
        const currentX = playerCar.position.x;
        const difference = targetX - currentX;
        playerCar.position.x += difference * 0.3;
    }
}

function gameLoop() {
    if (!gameActive) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Hızı artır
    const MAX_SPEED = 0.3;        // istediğin en yüksek hız
// …
carSpeed = initialCarSpeed + Math.floor(score / 1000) * 0.000001;
// clamping:
carSpeed = Math.min(carSpeed, MAX_SPEED);

    document.getElementById('speedValue').textContent = Math.floor(carSpeed * 1000);
    
    // Araba ileri hareket
    carZ += carSpeed;
    
    // Araba pozisyonunu güncelle
    if (playerCar) {
        playerCar.position.z = carZ;
        updateCarPosition();
        
        // Araba animasyonu (hafif sallanma)
        playerCar.rotation.z = Math.sin(Date.now() * 0.01) * 0.02;
    }
    
    // Kamerayı güncelle
    const carX = getXFromLane(carPosition);
    camera.position.set(carX, cameraHeight, carZ - cameraDistance);
    camera.lookAt(carX, 0, carZ + 5);
    
    // Yolu hareket ettir
    if (roadGroup) {
        roadGroup.position.z = -carZ;
    }
    
    // Engelleri güncelle ve kontrol et
    updateObstacles();
    
    // Puanı güncelle
    score += carSpeed * 100;
    document.getElementById('score').textContent = Math.floor(score);
    
    // Render
    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
}

function updateObstacles() {
    const carX = getXFromLane(carPosition);
    
    for (const obstacle of obstacles) {
        // Engel animasyonu
        obstacle.position.y = obstacle.userData.originalY + Math.sin(Date.now() * 0.005 + obstacle.userData.z) * 0.1;
        obstacle.rotation.y += 0.02;
        
        // Çarpışma kontrolü
        if (obstacle.userData.lane === carPosition) {
            const distance = Math.abs(obstacle.userData.z - carZ);
            if (distance < 1.8) {
                gameOver();
                return;
            }
        }
        
        // Geçilen engelleri yeniden konumlandır
        if (obstacle.userData.z < carZ - 20) {
            obstacle.userData.z += 120;
            obstacle.userData.lane = Math.floor(Math.random() * 4);
            obstacle.position.set(getXFromLane(obstacle.userData.lane), obstacle.userData.originalY, obstacle.userData.z);
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function gameOver() {
    gameActive = false;
    document.getElementById('finalScore').textContent = Math.floor(score);
    document.getElementById('gameOver').style.display = 'block';
}

function restartGame() {
    gameActive = true;
    score = 0;
    carPosition = 1;
    carZ = 0;
    carSpeed = initialCarSpeed;
    
    // Engelleri sıfırla
    obstacles.forEach(obstacle => {
        scene.remove(obstacle);
    });
    createObstacles();
    
    // Araba pozisyonunu sıfırla
    if (playerCar) {
        playerCar.position.set(getXFromLane(carPosition), 0.2, carZ);
        playerCar.rotation.set(0, Math.PI, 0);
    }
    
    // UI'yi güncelle
    document.getElementById('score').textContent = '0';
    document.getElementById('speedValue').textContent = Math.floor(initialCarSpeed * 1000);
    document.getElementById('gameOver').style.display = 'none';
}

// Oyunu başlat
window.onload = init;