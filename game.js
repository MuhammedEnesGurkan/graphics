// 3D WebGL Araba Yarış Simülasyonu - Three.js ile GLB Asset Desteği

//import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
//import { GLTFLoader } from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/GLTFLoader.js';

// Global değişkenler
// Harita tipleri - en başta global değişkenlerle birlikte tanımlanacak

const OBSTACLE_GLB_MODELS = [
    'graphics_three/assets/mater.glb',
    'graphics_three/assets/doc_hudson_the_fabulous_hudson_hornet.glb',
    // diğer .glb yollarını ekleyebilirsin
];
function checkCollision(obstacle, playerCar) {
    // Box3 ile çarpışma kontrolü
    const box1 = new THREE.Box3().setFromObject(obstacle);
    const box2 = new THREE.Box3().setFromObject(playerCar);

    return box1.intersectsBox(box2);
}
let loadedObstacleModels = [];
async function loadObstacleModels() {
    for (let i = 0; i < OBSTACLE_GLB_MODELS.length; i++) {
        try {
            const gltf = await new Promise((resolve, reject) => {
                loader.load(
                    OBSTACLE_GLB_MODELS[i],
                    resolve,
                    undefined,
                    reject
                );
            });
            const model = gltf.scene;
            model.scale.set(0.4, 0.4, 0.4);
            model.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            loadedObstacleModels.push(model);
        } catch (err) {
            loadedObstacleModels.push(null);
        }
    }
}


const MAP_TYPES = [
  { 
    name: "Normal", 
    roadColor: 0x333333, 
    grassColor: 0x228b22, // Yeşil çimen
    skyColor: 0x87CEEB,
    fogColor: 0x87CEEB
  },
  { 
    name: "Çöl", 
    roadColor: 0x8B4513, // Kahverengi yol 
    grassColor: 0xF4A460, // Kumsal sarısı
    skyColor: 0xFFD700, // Altın sarısı gökyüzü
    fogColor: 0xFFD700
  },
  { 
    name: "Karlı", 
    roadColor: 0x666666, // Gri yol
    grassColor: 0xFFFFFF, // Beyaz kar
    skyColor: 0xB0E0E6, // Açık mavi gökyüzü
    fogColor: 0xF0F8FF
  },
  { 
    name: "Bahar", 
    roadColor: 0x555555, 
    grassColor: 0x90EE90, // Açık yeşil
    skyColor: 0x00BFFF, // Mavi gökyüzü
    fogColor: 0x00BFFF
  }
];



// Harita değişimi için bildirim
function showMapChangeNotification(mapType) {
  // Bildirim div'i oluştur
  let notification = document.getElementById('mapNotification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'mapNotification';
    notification.style.position = 'absolute';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.background = 'rgba(0, 0, 0, 0.8)';
    notification.style.color = '#FFFFFF';
    notification.style.padding = '20px';
    notification.style.borderRadius = '10px';
    notification.style.fontSize = '24px';
    notification.style.textAlign = 'center';
    notification.style.zIndex = '1000';
    notification.style.display = 'none';
    notification.style.border = '2px solid #00FFFF';
    notification.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
    document.body.appendChild(notification);
  }
  
  // Bildirim metnini güncelle ve göster
  notification.textContent = `Yeni Harita: ${mapType.name}`;
  notification.style.display = 'block';
  
  // 3 saniye sonra bildirim kaybolsun
  setTimeout(() => {
    notification.style.display = 'none';
  }, 300);
}

// Geçerli harita indeksi
let currentMapIndex = 0;
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
    scene = new THREE.Scene();
  const canvas = document.getElementById('gameCanvas');
  await loadCarModel();
await loadObstacleModels();
createObstacles();

  
  // Three.js sahne kurulumu

  scene.fog = new THREE.FogExp2(MAP_TYPES[0].fogColor, 0.01);
  
  // Kamera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(MAP_TYPES[0].skyColor); // İlk harita tipi için gökyüzü rengi
  
  // Işıklar
  setupLighting();
  
  // Pencere boyut değişikliği
  window.addEventListener('resize', onWindowResize);
  
  // Kontroller
  document.addEventListener('keydown', handleKeyPress);
  
  // İlk haritayı oluştur (normal)
  createRoad(MAP_TYPES[0]);
  
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
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);
    
    // Kamera ışığı (arabayı aydınlatmak için)
    const cameraLight = new THREE.SpotLight(0xffffff, 0.5);
    cameraLight.position.set(0, 10, 0);
    scene.add(cameraLight);
    const spotLight = new THREE.SpotLight(0xffffff, 1.5);
    spotLight.position.set(0, 30, 0);
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 0.5;
    spotLight.castShadow = true;
    scene.add(spotLight);
}

async function loadCarModel() {
    try {
        // Hudson Hornet modelini yükle
        const gltf = await new Promise((resolve, reject) => {
            loader.load(
                'graphics_three/assets/lightning_mcqueen_cars_3.glb',
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
function createRoad(mapType = MAP_TYPES[0]) {
  // Eski yolu temizleme
  if (roadGroup) {
    scene.remove(roadGroup);
    // Hafızadan temizleme
    roadGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
  
  roadGroup = new THREE.Group();
  const ROAD_WIDTH = 8;
  const ROAD_LENGTH = 200; // Daha uzun yol

  // Ana yol segmentleri
  const roadGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, 4);
  const roadMaterial = new THREE.MeshLambertMaterial({ color: mapType.roadColor });

  // -20'den 180'e kadar (toplam 200 birim) yol segmentleri oluştur
  for (let i = -20; i < ROAD_LENGTH; i++) {
    const roadSegment = new THREE.Mesh(roadGeometry, roadMaterial);
    roadSegment.rotation.x = -Math.PI / 2;
    roadSegment.position.set(0, 0.01, i * 4);
    roadSegment.receiveShadow = true;
    roadGroup.add(roadSegment);

    // Şerit çizgileri
    if (i % 2 === 0) {
      for (let lane = 1; lane < 4; lane++) {
        const lineGeo = new THREE.BoxGeometry(0.1, 0.01, 1.5);
        const lineMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        // getXFromLane fonksiyonunu kullanarak şerit konumlarını belirle
        line.position.set(getXFromLane(lane), 0.02, i * 4);
        roadGroup.add(line);
      }
    }
  }

  // Çim kenarları (yolun her iki tarafında)
  const grassGeo = new THREE.PlaneGeometry(100, 400);
  const grassMat = new THREE.MeshLambertMaterial({ color: mapType.grassColor });

  const leftGrass = new THREE.Mesh(grassGeo, grassMat);
  leftGrass.rotation.x = -Math.PI / 2;
  leftGrass.position.set(-ROAD_WIDTH/2 - 40, -0.01, ROAD_LENGTH * 2);
  roadGroup.add(leftGrass);

  const rightGrass = new THREE.Mesh(grassGeo, grassMat);
  rightGrass.rotation.x = -Math.PI / 2;
  rightGrass.position.set(ROAD_WIDTH/2 + 40, -0.01, ROAD_LENGTH * 2);
  roadGroup.add(rightGrass);

  // Harita tipine göre dekoratif öğeler ekle
  addMapDecorations(mapType);

  scene.add(roadGroup);
  
  // Gökyüzü ve sis renklerini güncelle
  renderer.setClearColor(mapType.skyColor);
  scene.fog = new THREE.FogExp2(mapType.fogColor, 0.01);
}
function updateRoad() {
  if (!roadGroup) return;
  
  // 1. Önce yolu arabanın konumuna göre hareket ettir
  roadGroup.position.z = -carZ;
  
  // 2. Belirli bir mesafe ilerledikten sonra arabayı ve kamerayı sıfırla
  // ama puan ve oyun ilerleyişini koru
  const RESET_DISTANCE = 1000; // 1000 birim ileri gidince sıfırla
  
  if (carZ > RESET_DISTANCE) {
    // Arabayı ve kamerayı konumsal olarak sıfırla ama oyun devam etsin
    const resetAmount = Math.floor(carZ / RESET_DISTANCE) * RESET_DISTANCE;
    
    carZ -= resetAmount;
    
    // Engelleri de konumsal olarak sıfırla
    obstacles.forEach(obstacle => {
      obstacle.userData.z -= resetAmount;
      obstacle.position.z = obstacle.userData.z;
    });
    
    console.log("Konum sıfırlandı: " + resetAmount + " birim geri alındı");
  }
}
// Harita tipine göre dekorasyon ekleme
function addMapDecorations(mapType) {
  switch(mapType.name) {
    case "Çöl":
      // Kaktüsler ekle
      for (let i = 0; i < 15; i++) {
        const height = 0.8 + Math.random() * 1.0;
        const cactusGeo = new THREE.CylinderGeometry(0.2, 0.3, height, 8);
        const cactusMat = new THREE.MeshLambertMaterial({ color: 0x2F4F2F });
        const cactus = new THREE.Mesh(cactusGeo, cactusMat);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (8 + Math.random() * 10);
        const z = Math.random() * 150 - 10;
        
        cactus.position.set(x, height/2, z);
        roadGroup.add(cactus);
      }
      break;
      
    case "Karlı":
      // Kar yığınları ekle
      for (let i = 0; i < 20; i++) {
        const snowRadius = 1 + Math.random() * 1.5;
        const snowGeo = new THREE.SphereGeometry(snowRadius, 8, 6);
        const snowMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        const snow = new THREE.Mesh(snowGeo, snowMat);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (8 + Math.random() * 15);
        const z = Math.random() * 150 - 10;
        
        snow.position.set(x, 0, z);
        snow.scale.y = 0.5; // Yassıltılmış kar yığını
        roadGroup.add(snow);
      }
      break;
      
    case "Bahar":
      // Çiçekler ekle
      for (let i = 0; i < 80; i++) {
        const flowerSize = 0.3 + Math.random() * 0.2;
        const flowerGeo = new THREE.SphereGeometry(flowerSize, 8, 6);
        
        // Rastgele çiçek renkleri
        const flowerColors = [0xFF69B4, 0xFF1493, 0xFFFF00, 0xFFDAB9, 0xFF6347];
        const colorIndex = Math.floor(Math.random() * flowerColors.length);
        const flowerMat = new THREE.MeshLambertMaterial({ color: flowerColors[colorIndex] });
        
        const flower = new THREE.Mesh(flowerGeo, flowerMat);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (5 + Math.random() * 15);
        const z = Math.random() * 150 - 10;
        
        flower.position.set(x, flowerSize, z);
        roadGroup.add(flower);
      }
      break;
  }
}

// Harita tipine göre dekorasyon ekleme (basit)
function addMapDecorations(mapType) {
  switch(mapType.name) {
    case "Çöl":
      // Kaktüsler ekle (basit)
      for (let i = 0; i < 15; i++) {
        const height = 0.8 + Math.random() * 1.0;
        const cactusGeo = new THREE.CylinderGeometry(0.2, 0.3, height, 8);
        const cactusMat = new THREE.MeshLambertMaterial({ color: 0x2F4F2F });
        const cactus = new THREE.Mesh(cactusGeo, cactusMat);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (8 + Math.random() * 10);
        const z = Math.random() * 150 - 10;
        
        cactus.position.set(x, height/2, z);
        roadGroup.add(cactus);
      }
      break;
      
    case "Karlı":
      // Kar yığınları ekle
      for (let i = 0; i < 20; i++) {
        const snowRadius = 1 + Math.random() * 1.5;
        const snowGeo = new THREE.SphereGeometry(snowRadius, 8, 6);
        const snowMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        const snow = new THREE.Mesh(snowGeo, snowMat);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (8 + Math.random() * 15);
        const z = Math.random() * 150 - 10;
        
        snow.position.set(x, 0, z);
        snow.scale.y = 0.5; // Yassıltılmış kar yığını
        roadGroup.add(snow);
      }
      break;
      
    case "Bahar":
      // Çiçekler ve yapraklar ekle
      for (let i = 0; i < 80; i++) {
        const flowerSize = 0.3 + Math.random() * 0.2;
        const flowerGeo = new THREE.SphereGeometry(flowerSize, 8, 6);
        
        // Rastgele çiçek renkleri
        const flowerColors = [0xFF69B4, 0xFF1493, 0xFFFF00, 0xFFDAB9, 0xFF6347];
        const colorIndex = Math.floor(Math.random() * flowerColors.length);
        const flowerMat = new THREE.MeshLambertMaterial({ color: flowerColors[colorIndex] });
        
        const flower = new THREE.Mesh(flowerGeo, flowerMat);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (5 + Math.random() * 15);
        const z = Math.random() * 150 - 10;
        
        flower.position.set(x, flowerSize, z);
        roadGroup.add(flower);
      }
      break;
  }
}

function createObstacles() {
    obstacles = [];
    const obstacleCount = 50;

    for (let i = 0; i < obstacleCount; i++) {
        const lane = Math.floor(Math.random() * 4);
        const z = (i + 3) * 6 + Math.random() * 3;

        // Rastgele bir GLB model seç
        if (loadedObstacleModels.length === 0) continue; // Hiç model yoksa atla

        const modelIdx = Math.floor(Math.random() * loadedObstacleModels.length);
        const glbModel = loadedObstacleModels[modelIdx];
        if (!glbModel) continue; // Model yüklü değilse geç

        // GLB modelden yeni bir klon oluştur
        const obstacle = glbModel.clone();
        obstacle.position.set(getXFromLane(lane), 0.2, z); // Y pozisyonu ayarla
        obstacle.castShadow = true;

        obstacle.userData = {
            lane: lane,
            z: z,
            originalY: obstacle.position.y,
            isGLBModel: true
        };

        obstacles.push(obstacle);
        scene.add(obstacle);
    }
}

function getXFromLane(lane) {
    // Lane: 0=en sol, 3=en sağ şerit
    // Şeritler arasında 2 birim mesafe, merkez -3 birim
    return -3 + lane * 2;
}
function displayDebugInfo() {
  let debugDiv = document.getElementById('debug');
  if (!debugDiv) {
    debugDiv = document.createElement('div');
    debugDiv.id = 'debug';
    debugDiv.style.position = 'absolute';
    debugDiv.style.bottom = '10px';
    debugDiv.style.right = '10px';
    debugDiv.style.background = 'rgba(0,0,0,0.7)';
    debugDiv.style.color = '#fff';
    debugDiv.style.padding = '10px';
    debugDiv.style.fontFamily = 'monospace';
    debugDiv.style.fontSize = '12px';
    document.body.appendChild(debugDiv);
  }
  
  debugDiv.innerHTML = `
    Puan: ${Math.floor(score)}<br>
    Araba Z: ${Math.floor(carZ)}<br>
    Araba Şerit: ${carPosition}<br>
    Harita: ${MAP_TYPES[currentMapIndex].name}<br>
    Engel Sayısı: ${obstacles.length}
  `;
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
  const MAX_SPEED = 0.3;
  carSpeed = initialCarSpeed + Math.floor(score / 1000) * 0.000001;
  carSpeed = Math.min(carSpeed, MAX_SPEED);
  
  document.getElementById('speedValue').textContent = Math.floor(carSpeed * 1000);
  
  // Harita değişimi kontrolü (her 20.000 puanda bir)
  const mapIndex = Math.floor(score / 5000) % MAP_TYPES.length;
  if (mapIndex !== currentMapIndex) {
    currentMapIndex = mapIndex;
    createRoad(MAP_TYPES[currentMapIndex]);
    showMapChangeNotification(MAP_TYPES[currentMapIndex]);
  }
  displayDebugInfo();
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
  updateRoad();
  
  // Engelleri güncelle ve kontrol et
  updateObstacles();
  
  // Puanı güncelle
  score += carSpeed * 100;
  document.getElementById('score').textContent = Math.floor(score);
  
  // Render
  renderer.render(scene, camera);
  requestAnimationFrame(gameLoop);
}

// Harita değişimi için bildirim
function updateObstacles() {
  for (const obstacle of obstacles) {
    // ANİMASYON
    if (obstacle.userData.isGLBModel) {
      obstacle.rotation.y += 0.01;
      obstacle.position.y = obstacle.userData.originalY + Math.sin(Date.now() * 0.003 + obstacle.userData.z) * 0.05;
    } else {
      obstacle.position.y = obstacle.userData.originalY + Math.sin(Date.now() * 0.005 + obstacle.userData.z) * 0.1;
      obstacle.rotation.y += 0.02;
    }

    // -------------- YENİ ÇARPIŞMA KONTROLÜ -----------------
    // Her engel ve playerCar için kutu oluştur ve kesişiyor mu bak
    const playerBox = new THREE.Box3().setFromObject(playerCar);
    const obstacleBox = new THREE.Box3().setFromObject(obstacle);

    if (playerBox.intersectsBox(obstacleBox)) {
      gameOver();
      return;
    }
    // ------------------------------------------------------

    // Geçilen engelleri yeniden konumlandır
    if (obstacle.userData.z < carZ - 20) {
      obstacle.userData.z = carZ + 100 + Math.random() * 60;
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
  currentMapIndex = 0; // Harita indeksini sıfırla
  
  // Haritayı varsayılana sıfırla
  createRoad(MAP_TYPES[0]);
  
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