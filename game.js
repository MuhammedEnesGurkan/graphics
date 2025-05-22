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
let carTargetX = getXFromLane(carPosition); 
let carZ = 0; // Arabanın Z pozisyonu (ileri hareket)
let initialCarSpeed = 0.1; // Başlangıç hızı
let carSpeed = initialCarSpeed; // Arabanın ileri hareket hızı
let obstacles = [];
let gameActive = true;
let score = 0;
let cameraHeight = 2.0;
let cameraDistance = 8.0;
let loadedStreetlightModel = null;
let nitroActive = false;
let nitroTimer = 0;
let brakeActive = false;
let nitroGlow, nitroLeft, nitroRight;


// 3D Modeller
let carModel = null;
let roadSegments = [];
let obstacleModels = [];

// GLB Loader
const loader = new THREE.GLTFLoader();

// Sahne nesneleri
let playerCar = null;
let roadGroup = null;

async function loadStreetlightModel() {
    return new Promise((resolve, reject) => {
        loader.load(
            'graphics_three/assets/free_streetlight.glb',
            gltf => {
                loadedStreetlightModel = gltf.scene;
                resolve();
            },
            undefined,
            reject
        );
    });
}

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
   await loadStreetlightModel();
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
        // Nitro efekti ekle (arka tampon hizasına)// Nitro efekti ekle (arka tampon hizasına)
const nitroTexture = new THREE.TextureLoader().load('graphics_three/assets/png-transparent-red-glow-red-glow-flash-light-thumbnail.png');
const nitroMaterial = new THREE.SpriteMaterial({ 
    map: nitroTexture, 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.7, 
    depthWrite: false 
});
window.nitroSpriteLeft = new THREE.Sprite(nitroMaterial); // global erişim için window. ile
window.nitroSpriteRight = new THREE.Sprite(nitroMaterial);

nitroSpriteLeft.position.set(-0.19, 0.22, -1.07);
nitroSpriteRight.position.set(0.19, 0.22, -1.07);
nitroSpriteLeft.scale.set(0.5, 0.5, 1);
nitroSpriteRight.scale.set(0.5, 0.5, 1);

playerCar.add(nitroSpriteLeft);
playerCar.add(nitroSpriteRight);

nitroSpriteLeft.visible = false;
nitroSpriteRight.visible = false;
        nitroGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 })
);
nitroGlow.position.set(0, 0.22, -2.05);
playerCar.add(nitroGlow);

nitroLeft = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 })
);
nitroLeft.position.set(-0.18, 0.22, -1.05);
playerCar.add(nitroLeft);

nitroRight = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 })
);
nitroRight.position.set(0.18, 0.22, -1.05);
playerCar.add(nitroRight);

nitroGlow.visible = false;
nitroLeft.visible = false;
nitroRight.visible = false;


        
        console.log('mcquen modeli başarıyla yüklendi!');
        
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
  // Streetlightları yolun kenarlarına ekle (her 20 metrede bir)
if (loadedStreetlightModel) {
  const lampSpacing = 75; // Lambalar arası mesafe (daha büyük = daha az lamba)
  const lightCount = Math.floor((ROAD_LENGTH * 4) / lampSpacing);

  for (let i = 0; i < lightCount; i++) {
    [-1, 1].forEach(side => {
      const lightObj = loadedStreetlightModel.clone();

      // Pozisyon ayarı (yoldan biraz uzakta)
      lightObj.position.set(
        side * (ROAD_WIDTH / 2 - 0.7),
        3.5,
        i * lampSpacing - 20 // -20 offset, gerekirse değiştir
      );
      lightObj.scale.set(1.1, 1.1, 1.1);
      if (side === -1) {
        lightObj.rotation.y = Math.PI;
      }

      // Mesh gölge ayarı (Modelin bütün meshlerine uygula!)
      lightObj.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Gerçek ışık ekle (lambanın üstüne)
      const pointLight = new THREE.PointLight(0xfff8e7, 0.8, 15, 2);
      pointLight.position.set(0, 5.5, 0); // Model yüksekliğine göre ayarla
      pointLight.castShadow = false; // Performans için kapalı
      lightObj.add(pointLight);

      // Dekoratif "yanıyor" efekti için küçük parlak küre (ekstra FPS için kullanılabilir)
      /*
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfff8e7 })
      );
      bulb.position.set(0, 5.5, 0);
      lightObj.add(bulb);
      */

      roadGroup.add(lightObj);
    });
  }
}

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
function createObstacles() {
    // Tüm eski engelleri temizle!
    obstacles.forEach(obstacle => scene.remove(obstacle));
    obstacles = [];

    const obstacleCount = 30;
    for (let i = 0; i < obstacleCount; i++) {
        const lane = Math.floor(Math.random() * 4);
        const z = (i + 3) * 6 + Math.random() * 3;

        if (loadedObstacleModels.length === 0) continue;
        const modelIdx = Math.floor(Math.random() * loadedObstacleModels.length);
        const glbModel = loadedObstacleModels[modelIdx];
        if (!glbModel) continue;

        const obstacle = glbModel.clone();
        obstacle.position.set(getXFromLane(lane), 0.2, z);
        obstacle.castShadow = true;

        obstacle.userData = {
            lane: lane,
            z: z,
            originalY: obstacle.position.y,
            isGLBModel: true,
            npcSpeed: 0.05 + Math.random() * 0.1, // daima >0!
            direction: 1, // sadece ileri
            laneChangeTimer: 0,
            laneChangeDelay: Math.random() * 500 + 500,
            targetLane: lane
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
                carTargetX = getXFromLane(carPosition); 
            }
            break;
        case 'ArrowRight':
            if (carPosition < 3) {
                carPosition++;
                carTargetX = getXFromLane(carPosition); 
            }
            break;
        // NİTRO: Shift tuşuna basınca nitro aç
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyN': // Alternatif olarak N harfi de kullanılabilir
            nitroActive = true;
            break;
        // FREN: Control tuşuna basınca fren yap
        case 'ControlLeft':
        case 'ControlRight':
        case 'KeyB': // Alternatif olarak B harfi de kullanılabilir
            brakeActive = true;
            break;
    }
}

// Tuş bırakıldığında nitro veya fren devre dışı
function handleKeyUp(event) {
    switch(event.code) {
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyN':
            nitroActive = false;
            break;
        case 'ControlLeft':
        case 'ControlRight':
        case 'KeyB':
            brakeActive = false;
            break;
    }
}
document.addEventListener('keyup', handleKeyUp);


function updateCarPosition() {
    if (playerCar) {
        const difference = carTargetX - playerCar.position.x;
        // Araba neredeyse hedefteyse tam yerine koy
        if (Math.abs(difference) < 0.01) {
            playerCar.position.x = carTargetX;
        } else {
            playerCar.position.x += difference * 0.15; // 0.3 -> 0.15 ile daha yavaş ve smooth olur
        }
    }
}

function gameLoop() {
  if (!gameActive) {
    requestAnimationFrame(gameLoop);
    return;
  }

  // Standart hız artışı
  const MAX_SPEED = 0.3;
  let targetSpeed = initialCarSpeed + Math.floor(score / 1000) * 0.000001;
  targetSpeed = Math.min(targetSpeed, MAX_SPEED);
  if (brakeActive) targetSpeed -= 0.07;
  // Nitro aktifse hızı artır
 if (nitroActive) {
    nitroSpriteLeft.visible = true;
    nitroSpriteRight.visible = true;
    if (nitroGlow && nitroLeft && nitroRight) {
        nitroGlow.visible = true;
        nitroLeft.visible = true;
        nitroRight.visible = true;
    }
    targetSpeed += 0.18;
} else {
    nitroSpriteLeft.visible = false;
    nitroSpriteRight.visible = false;
    if (nitroGlow && nitroLeft && nitroRight) {
        nitroGlow.visible = false;
        nitroLeft.visible = false;
        nitroRight.visible = false;
    }


}

  // Sınırları koru
  carSpeed = Math.max(0.05, Math.min(targetSpeed, 0.6));

  document.getElementById('speedValue').textContent = Math.floor(carSpeed * 1000);

  // Harita değişimi kontrolü (her 5000 puanda bir)
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

function updateObstacles() {
  for (const obstacle of obstacles) {
    // Sadece GLB (NPC) arabalar için hareket ve şerit değişimi
    if (obstacle.userData.isGLBModel) {
      // 1. Duran NPC'leri tespit et ve hız ekle
      if (obstacle.userData.npcSpeed < 0.01) {
        obstacle.userData.npcSpeed = 0.08 + Math.random() * 0.08;
      }
      // 2. İleri hareket
      obstacle.userData.z += obstacle.userData.npcSpeed * obstacle.userData.direction;

      // 3. Şerit değiştirme sistemi (SADECE 1 şerit sağ/sol!)
      obstacle.userData.laneChangeTimer++;
      if (obstacle.userData.laneChangeTimer >= obstacle.userData.laneChangeDelay) {
        const currentLane = obstacle.userData.lane;
        let candidateLanes = [];
        if (currentLane > 0) candidateLanes.push(currentLane - 1);
        if (currentLane < 3) candidateLanes.push(currentLane + 1);

        // Rastgele komşu şeritlerden birini seç
        const newLane = candidateLanes[Math.floor(Math.random() * candidateLanes.length)];
        obstacle.userData.targetLane = newLane;

        obstacle.userData.laneChangeTimer = 0;
        obstacle.userData.laneChangeDelay = Math.random() * 300 + 150;
      }

      // 4. Yumuşak şerit değişimi
      const targetX = getXFromLane(obstacle.userData.targetLane);
      if (Math.abs(obstacle.position.x - targetX) > 0.1) {
        obstacle.position.x += (targetX - obstacle.position.x) * 0.04;
      } else {
        obstacle.position.x = targetX;
        obstacle.userData.lane = obstacle.userData.targetLane;
      }

      // 5. Hafif sallanma efekti
      obstacle.position.y = obstacle.userData.originalY +
        Math.sin(Date.now() * 0.003 + obstacle.userData.z) * 0.02;
    } else {
      // Fallback engeller için animasyon
      obstacle.position.y = obstacle.userData.originalY +
        Math.sin(Date.now() * 0.005 + obstacle.userData.z) * 0.1;
      obstacle.rotation.y += 0.02;
    }

    // Pozisyonları güncelle
    obstacle.position.z = obstacle.userData.z;

    // --- Çarpışma kontrolü ---
    const playerBox = new THREE.Box3().setFromObject(playerCar);
    const obstacleBox = new THREE.Box3().setFromObject(obstacle);
    if (playerBox.intersectsBox(obstacleBox)) {
      gameOver();
      return;
    }

    // --- NPC sınır kontrolleri ve yeniden doğurma ---
    // Çok geride kalanları ileri taşı
    if (obstacle.userData.z < carZ - 30) {
      obstacle.userData.z = carZ + 80 + Math.random() * 40;
      let newLane = Math.floor(Math.random() * 4);
      obstacle.userData.lane = newLane;
      obstacle.userData.targetLane = newLane;
      obstacle.position.x = getXFromLane(newLane);
      obstacle.userData.npcSpeed = 0.07 + Math.random() * 0.08;
      obstacle.userData.direction = 1; // Hep ileri
      obstacle.userData.laneChangeDelay = Math.random() * 300 + 150;
    }
    // Çok ilerde olanları geri taşı
    if (obstacle.userData.z > carZ + 120) {
      obstacle.userData.z = carZ - 20 + Math.random() * 15;
      let newLane = Math.floor(Math.random() * 4);
      obstacle.userData.lane = newLane;
      obstacle.userData.targetLane = newLane;
      obstacle.position.x = getXFromLane(newLane);
    }
  }
}



function gameOver() {
 gameActive = false;
 
 // Game Over ekranını göster
 let gameOverDiv = document.getElementById('gameOver');
 if (!gameOverDiv) {
   gameOverDiv = document.createElement('div');
   gameOverDiv.id = 'gameOver';
   gameOverDiv.style.position = 'absolute';
   gameOverDiv.style.top = '50%';
   gameOverDiv.style.left = '50%';
   gameOverDiv.style.transform = 'translate(-50%, -50%)';
   gameOverDiv.style.background = 'rgba(255, 0, 0, 0.9)';
   gameOverDiv.style.color = '#FFFFFF';
   gameOverDiv.style.padding = '40px';
   gameOverDiv.style.borderRadius = '15px';
   gameOverDiv.style.fontSize = '32px';
   gameOverDiv.style.textAlign = 'center';
   gameOverDiv.style.zIndex = '1000';
   gameOverDiv.style.border = '3px solid #FF0000';
   gameOverDiv.style.boxShadow = '0 0 30px rgba(255, 0, 0, 0.7)';
   document.body.appendChild(gameOverDiv);
 }
 
 gameOverDiv.innerHTML = `
   <h2>OYUN BİTTİ!</h2>
   <p>Final Puanınız: ${Math.floor(score)}</p>
   <p>Ulaştığınız Harita: ${MAP_TYPES[currentMapIndex].name}</p>
   <p style="font-size: 18px; margin-top: 20px;">Tekrar oynamak için SPACE tuşuna basın</p>
 `;
 gameOverDiv.style.display = 'block';
}

function restartGame() {
 // Game Over ekranını gizle
 const gameOverDiv = document.getElementById('gameOver');
 if (gameOverDiv) {
   gameOverDiv.style.display = 'none';
 }
 
 // Oyun değişkenlerini sıfırla
 gameActive = true;
 score = 0;
 carPosition = 1;
 carTargetX = getXFromLane(carPosition);
 carZ = 0;
 carSpeed = initialCarSpeed;
 currentMapIndex = 0;
 
 // Arabayı yeniden konumlandır
 if (playerCar) {
   playerCar.position.set(getXFromLane(carPosition), 0.2, carZ);
   playerCar.rotation.set(0, 0, 0);
 }
 
 // Engelleri yeniden oluştur
 obstacles.forEach(obstacle => {
   scene.remove(obstacle);
 });
 createObstacles();
 
 // İlk haritayı yeniden oluştur
 createRoad(MAP_TYPES[0]);
 
 console.log('Oyun yeniden başlatıldı!');
}

function onWindowResize() {
 camera.aspect = window.innerWidth / window.innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(window.innerWidth, window.innerHeight);
}

// HTML elementi oluşturma
function createGameUI() {
 // Ana konteyner
 const uiContainer = document.createElement('div');
 uiContainer.style.position = 'absolute';
 uiContainer.style.top = '20px';
 uiContainer.style.left = '20px';
 uiContainer.style.zIndex = '100';
 uiContainer.style.fontFamily = 'Arial, sans-serif';
 uiContainer.style.color = '#FFFFFF';
 uiContainer.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
 
 // Puan göstergesi
 const scoreDiv = document.createElement('div');
 scoreDiv.innerHTML = '<h3>Puan: <span id="score">0</span></h3>';
 uiContainer.appendChild(scoreDiv);
 
 // Hız göstergesi
 const speedDiv = document.createElement('div');
 speedDiv.innerHTML = '<h3>Hız: <span id="speedValue">100</span> km/h</h3>';
 uiContainer.appendChild(speedDiv);
 
 // Kontrol açıklaması
 const controlsDiv = document.createElement('div');
 controlsDiv.style.marginTop = '20px';
 controlsDiv.style.fontSize = '14px';
 controlsDiv.innerHTML = `
   <p><strong>Kontroller:</strong></p>
   <p>← Sol Şerit | → Sağ Şerit</p>
   <p>Her 5000 puan = Yeni Harita!</p>
 `;
 uiContainer.appendChild(controlsDiv);
 
 document.body.appendChild(uiContainer);
}

// Canvas oluştur
function createCanvas() {
 const canvas = document.createElement('canvas');
 canvas.id = 'gameCanvas';
 canvas.style.display = 'block';
 canvas.style.margin = '0 auto';
 document.body.appendChild(canvas);
 return canvas;
}

// Sayfa yüklendiğinde oyunu başlat
window.addEventListener('load', async () => {
 // Body stilini ayarla
 document.body.style.margin = '0';
 document.body.style.padding = '0';
 document.body.style.overflow = 'hidden';
 document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
 
 // Canvas ve UI oluştur
 createCanvas();
 createGameUI();
 
 // Oyunu başlat
 await init();
 
 console.log('3D WebGL Araba Yarış Simülasyonu başlatıldı!');
 console.log('Kontroller: Sol/Sağ ok tuşları ile şerit değiştirin');
 console.log('Her 5000 puanda harita değişir!');
});

// Touch kontrolleri (mobil destek)
let touchStartX = 0;

document.addEventListener('touchstart', (e) => {
 touchStartX = e.touches[0].clientX;
});

document.addEventListener('touchend', (e) => {
 if (!gameActive) {
   if (document.getElementById('gameOver') && document.getElementById('gameOver').style.display === 'block') {
     restartGame();
   }
   return;
 }
 
 const touchEndX = e.changedTouches[0].clientX;
 const diff = touchEndX - touchStartX;
 
 if (Math.abs(diff) > 50) { // Minimum 50px kaydırma
   if (diff > 0 && carPosition < 3) {
     // Sağa kaydırma
     carPosition++;
     carTargetX = getXFromLane(carPosition);
   } else if (diff < 0 && carPosition > 0) {
     // Sola kaydırma
     carPosition--;
     carTargetX = getXFromLane(carPosition);
   }
 }
});

// Performans optimizasyonu
/*
function optimizePerformance() {
 // Düşük FPS algılandığında grafik kalitesini düşür
 let lastTime = performance.now();
 let frameCount = 0;
 let fps = 60;
 
 function measureFPS() {
   frameCount++;
   const currentTime = performance.now();
   
   if (currentTime - lastTime >= 1000) {
     fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
     frameCount = 0;
     lastTime = currentTime;
     
     // Düşük FPS'de optimizasyon
     if (fps < 30) {
       renderer.setPixelRatio(Math.min(window.devicePixelRatio * 0.8, 1));
       console.log('Performans optimizasyonu aktif - FPS:', fps);
     } else if (fps > 50) {
       renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
     }
   }
   
   requestAnimationFrame(measureFPS);
 }
 
 measureFPS();
}*/

// Başlangıçta performans izlemeyi başlat
//setTimeout(optimizePerformance, 2000);