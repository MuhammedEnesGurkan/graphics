// 3D WebGL Araba Yarış Simülasyonu - Three.js ile GLB Asset Desteği

//import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
//import { GLTFLoader } from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/GLTFLoader.js';
//versiyon13
// Global değişkenler
// Harita tipleri - en başta global değişkenlerle birlikte tanımlanacak

const OBSTACLE_GLB_MODELS = [
    'graphics_three/assets/mater.glb',
    'graphics_three/assets/doc_hudson_the_fabulous_hudson_hornet.glb',
    // diğer .glb yollarını ekleyebilirsin
];

// Coin sistemi için yeni değişkenler - harita değişimi için coin sayısını düşürdüm
let coins = [];
let coinCount = 0;
const COINS_PER_MAP_CHANGE = 15; // Her 15 coin'de harita değişimi (50'den düşürüldü)

// Araç seçimi sistemi
const AVAILABLE_CARS = [
    {
        name: "Lightning McQueen",
        path: "graphics_three/assets/lightning_mcqueen_cars_3.glb",
        scale: 0.5,
        description: "Hızlı ve çevik yarış arabası"
    },
    {
        name: "Mater",
        path: "graphics_three/assets/mater.glb", 
        scale: 0.4,
        description: "Güçlü ve dayanıklı çekici"
    },
    {
        name: "Doc Hudson",
        path: "graphics_three/assets/doc_hudson_the_fabulous_hudson_hornet.glb",
        scale: 0.4,
        description: "Klasik yarış efsanesi"
    }
];

let selectedCarIndex = 0;
let gameStarted = false;

// Kamera sistemi - genişletildi
let currentCameraMode = 0; // 0: 3. şahıs, 1: 1. şahıs, 2: ön görünüm
const CAMERA_MODES = {
    THIRD_PERSON: 0,
    FIRST_PERSON: 1,
    FRONT_VIEW: 2
};

// Gece/Gündüz sistemi
let isNightMode = false;
let moonObject = null;
let moonLight = null;
let sunLight = null;
let steeringWheel = null; // Direksiyon objesi
let canMoveMoon = false; // Ay hareket ettirme modu

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
let initialCarSpeed = 0.2; // Başlangıç hızını 0.1'den 0.2'ye artırdım
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
// Mevcut nitro değişkenlerinin yanına ekleyin:
let nitroLights = [];
let carHeadlights = [];

// Hava durumu sistemi için yeni değişkenler
let weatherParticles = [];
let currentWeatherSystem = null;
let windSound = false;

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
async function startGame() {
    scene = new THREE.Scene();
    const canvas = document.getElementById('gameCanvas');
    await loadCarModel();
    await loadObstacleModels();
    createObstacles();
    createCoins(); // Coin'leri oluştur

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
    
    // Gece modu bilgisi
    if (isNightMode) {
        console.log('🌙 GECE MODU AKTIF!');
        console.log('Ay gökyüzünde merkezi konumda (yukarı bakın)');
        console.log('M tuşu ile ayı hareket ettirebilirsiniz');
    }
    
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
    // Gece/Gündüz moduna göre ışıklandırma
    if (isNightMode) {
        // Gece modu ışıklandırması
        setupNightLighting();
    } else {
        // Gündüz modu ışıklandırması
        setupDayLighting();
    }
    
    // Ortam ışığı - gece modunda biraz daha parlak (ay görünürlüğü için)
    const ambientLight = new THREE.AmbientLight(0x404040, isNightMode ? 0.4 : 0.8);
    scene.add(ambientLight);
    
    // Kamera ışığı (arabayı aydınlatmak için)
    const cameraLight = new THREE.SpotLight(0xffffff, 0.5);
    cameraLight.position.set(0, 10, 0);
    scene.add(cameraLight);
    
    const spotLight = new THREE.SpotLight(0xffffff, isNightMode ? 0.8 : 1.5);
    spotLight.position.set(0, 30, 0);
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 0.5;
    spotLight.castShadow = true;
    scene.add(spotLight);
}

// Gündüz ışıklandırması
function setupDayLighting() {
    // Güneş ışığı
    sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(100, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);
}

// Gece ışıklandırması
function setupNightLighting() {
    // Ay ışığı - çok daha güçlü
    moonLight = new THREE.DirectionalLight(0xaabbff, 1.5); // Çok güçlü ışık (1.0'dan 1.5'e)
    moonLight.position.set(0, 80, -40); // Ay ile aynı pozisyon
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 500;
    moonLight.shadow.camera.left = -100;
    moonLight.shadow.camera.right = 100;
    moonLight.shadow.camera.top = 100;
    moonLight.shadow.camera.bottom = -100;
    
    // Gölge kamerasının hedefini ayarla
    moonLight.target.position.set(0, 0, 0);
    
    scene.add(moonLight);
    scene.add(moonLight.target);
    
    // Ay objesi oluştur
    createMoon();
    
    console.log('Gece aydınlatması kuruldu - Ay ışığı pozisyonu:', moonLight.position);
}

// Ay objesi oluşturma
function createMoon() {
    const moonGeometry = new THREE.SphereGeometry(20, 32, 32); // Çok daha büyük ay (12'den 20'ye)
    
    // Ay tekstürü ve malzeme iyileştirmesi
    const moonMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xffffff, // Tamamen beyaz
        emissive: 0x445566 // Daha güçlü mavi parlaklık
    });
    
    moonObject = new THREE.Mesh(moonGeometry, moonMaterial);
    // Ay pozisyonunu tam ortada ve yüksekte yap
    moonObject.position.set(0, 80, -40); // Merkezi ve yüksek pozisyon
    moonObject.castShadow = false; // Ay gölge atmasın
    moonObject.receiveShadow = false;
    scene.add(moonObject);
    
    // Ay etrafında çok daha belirgin parıltı efekti
    const glowGeometry = new THREE.SphereGeometry(25, 16, 16); // Çok büyük parıltı
    const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xaabbff, 
        transparent: true, 
        opacity: 0.3 // Daha belirgin parıltı
    });
    const moonGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    moonGlow.position.set(0, 0, 0); // Ay merkezine yerleştir
    moonObject.add(moonGlow); // Ay ile birlikte hareket etsin
    
    // Ek parıltı halkası
    const outerGlowGeometry = new THREE.SphereGeometry(30, 16, 16);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x8899cc, 
        transparent: true, 
        opacity: 0.15 
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    outerGlow.position.set(0, 0, 0);
    moonObject.add(outerGlow);
    
    console.log('Ay oluşturuldu - Pozisyon:', moonObject.position);
}

// Ay hareket ettirme - iyileştirildi
function updateMoonPosition() {
    if (!moonObject || !moonLight) return;
    
    // Moonlight'ı ay pozisyonuna göre güncelle
    moonLight.position.copy(moonObject.position);
    
    // Moonlight'ın hedefini güncelle (her zaman sahne merkezine)
    moonLight.target.position.set(0, 0, 0);
    moonLight.target.updateMatrixWorld();
    
    // Debug: Ay pozisyonunu konsola yazdır
    if (canMoveMoon) {
        console.log('Ay pozisyonu:', moonObject.position.x, moonObject.position.y, moonObject.position.z);
    }
}

// Gece/Gündüz seçim menüsü
function createDayNightSelectionMenu() {
    const menuContainer = document.createElement('div');
    menuContainer.id = 'dayNightMenu';
    menuContainer.style.position = 'fixed';
    menuContainer.style.top = '0';
    menuContainer.style.left = '0';
    menuContainer.style.width = '100%';
    menuContainer.style.height = '100%';
    menuContainer.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    menuContainer.style.display = 'flex';
    menuContainer.style.flexDirection = 'column';
    menuContainer.style.alignItems = 'center';
    menuContainer.style.justifyContent = 'center';
    menuContainer.style.zIndex = '2000';
    menuContainer.style.fontFamily = 'Arial, sans-serif';

    const title = document.createElement('h1');
    title.textContent = 'ZAMAN SEÇİMİ';
    title.style.color = '#FFFFFF';
    title.style.marginBottom = '40px';
    title.style.fontSize = '48px';
    title.style.textShadow = '3px 3px 6px rgba(0,0,0,0.8)';
    menuContainer.appendChild(title);

    const timeContainer = document.createElement('div');
    timeContainer.style.display = 'flex';
    timeContainer.style.gap = '40px';
    timeContainer.style.marginBottom = '40px';

    // Gündüz seçeneği
    const dayOption = document.createElement('div');
    dayOption.style.background = !isNightMode ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
    dayOption.style.border = !isNightMode ? '3px solid #FFD700' : '2px solid #FFFFFF';
    dayOption.style.borderRadius = '15px';
    dayOption.style.padding = '30px';
    dayOption.style.textAlign = 'center';
    dayOption.style.cursor = 'pointer';
    dayOption.style.transition = 'all 0.3s ease';
    dayOption.style.minWidth = '200px';

    const dayIcon = document.createElement('div');
    dayIcon.style.fontSize = '60px';
    dayIcon.textContent = '☀️';
    dayIcon.style.marginBottom = '10px';

    const dayText = document.createElement('h3');
    dayText.textContent = 'GÜNDÜZ';
    dayText.style.color = '#FFFFFF';
    dayText.style.margin = '0 0 10px 0';

    const dayDesc = document.createElement('p');
    dayDesc.textContent = 'Güneş ışığında yarış';
    dayDesc.style.color = '#DDDDDD';
    dayDesc.style.margin = '0';
    dayDesc.style.fontSize = '14px';

    dayOption.appendChild(dayIcon);
    dayOption.appendChild(dayText);
    dayOption.appendChild(dayDesc);

    // Gece seçeneği
    const nightOption = document.createElement('div');
    nightOption.style.background = isNightMode ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
    nightOption.style.border = isNightMode ? '3px solid #FFD700' : '2px solid #FFFFFF';
    nightOption.style.borderRadius = '15px';
    nightOption.style.padding = '30px';
    nightOption.style.textAlign = 'center';
    nightOption.style.cursor = 'pointer';
    nightOption.style.transition = 'all 0.3s ease';
    nightOption.style.minWidth = '200px';

    const nightIcon = document.createElement('div');
    nightIcon.style.fontSize = '60px';
    nightIcon.textContent = '🌙';
    nightIcon.style.marginBottom = '10px';

    const nightText = document.createElement('h3');
    nightText.textContent = 'GECE';
    nightText.style.color = '#FFFFFF';
    nightText.style.margin = '0 0 10px 0';

    const nightDesc = document.createElement('p');
    nightDesc.textContent = 'Ay ışığında gece yarışı';
    nightDesc.style.color = '#DDDDDD';
    nightDesc.style.margin = '0';
    nightDesc.style.fontSize = '14px';

    nightOption.appendChild(nightIcon);
    nightOption.appendChild(nightText);
    nightOption.appendChild(nightDesc);

    function updateSelection() {
        if (!isNightMode) {
            dayOption.style.background = 'rgba(255,255,255,0.3)';
            dayOption.style.border = '3px solid #FFD700';
            dayOption.style.transform = 'scale(1.1)';
            nightOption.style.background = 'rgba(255,255,255,0.1)';
            nightOption.style.border = '2px solid #FFFFFF';
            nightOption.style.transform = 'scale(1)';
        } else {
            nightOption.style.background = 'rgba(255,255,255,0.3)';
            nightOption.style.border = '3px solid #FFD700';
            nightOption.style.transform = 'scale(1.1)';
            dayOption.style.background = 'rgba(255,255,255,0.1)';
            dayOption.style.border = '2px solid #FFFFFF';
            dayOption.style.transform = 'scale(1)';
        }
    }

    dayOption.addEventListener('click', () => {
        isNightMode = false;
        updateSelection();
    });

    nightOption.addEventListener('click', () => {
        isNightMode = true;
        updateSelection();
    });

    const continueButton = document.createElement('button');
    continueButton.textContent = 'DEVAM ET';
    continueButton.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
    continueButton.style.border = 'none';
    continueButton.style.borderRadius = '25px';
    continueButton.style.padding = '15px 40px';
    continueButton.style.fontSize = '24px';
    continueButton.style.color = '#FFFFFF';
    continueButton.style.cursor = 'pointer';
    continueButton.style.fontWeight = 'bold';
    continueButton.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    continueButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    continueButton.style.transition = 'all 0.3s ease';

    continueButton.addEventListener('click', () => {
        menuContainer.style.display = 'none';
        createCarSelectionMenu();
    });

    const instructions = document.createElement('p');
    instructions.textContent = 'Gece modunda M tuşu ile ayı hareket ettirebilirsiniz';
    instructions.style.color = '#CCCCCC';
    instructions.style.fontSize = '14px';
    instructions.style.marginTop = '20px';

    timeContainer.appendChild(dayOption);
    timeContainer.appendChild(nightOption);
    menuContainer.appendChild(timeContainer);
    menuContainer.appendChild(continueButton);
    menuContainer.appendChild(instructions);
    document.body.appendChild(menuContainer);
}

async function loadCarModel() {
    try {
        const selectedCar = AVAILABLE_CARS[selectedCarIndex];
        
        const gltf = await new Promise((resolve, reject) => {
            loader.load(
                selectedCar.path,
                resolve,
                undefined,
                reject
            );
        });
        
        carModel = gltf.scene;
        
        // Modeli ölçekle ve konumlandır
        carModel.scale.set(selectedCar.scale, selectedCar.scale, selectedCar.scale);
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
        
        // Nitro efekti ekle (arka tampon hizasına)
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

        // Araba farları oluştur
        const headlightLeft = new THREE.SpotLight(0xffffff, 1, 30, Math.PI / 6, 0.5);
        headlightLeft.position.set(-0.5, 0.5, 1.5);
        headlightLeft.target.position.set(-1, 0, 5);
        headlightLeft.castShadow = true;
        playerCar.add(headlightLeft);
        playerCar.add(headlightLeft.target);

        const headlightRight = new THREE.SpotLight(0xffffff, 1, 30, Math.PI / 6, 0.5);
        headlightRight.position.set(0.5, 0.5, 1.5);
        headlightRight.target.position.set(1, 0, 5);
        headlightRight.castShadow = true;
        playerCar.add(headlightRight);
        playerCar.add(headlightRight.target);

        carHeadlights.push(headlightLeft, headlightRight);

        // Nitro ışıkları oluştur
        const nitroLightLeft = new THREE.PointLight(0xff4400, 0, 8);
        nitroLightLeft.position.set(-0.18, 0.22, -1.05);
        playerCar.add(nitroLightLeft);

        const nitroLightRight = new THREE.PointLight(0xff4400, 0, 8);
        nitroLightRight.position.set(0.18, 0.22, -1.05);
        playerCar.add(nitroLightRight);

        nitroLights.push(nitroLightLeft, nitroLightRight);

        nitroGlow.visible = false;
        nitroLeft.visible = false;
        nitroRight.visible = false;
        
        // --- Arka far PointLight'ları (KIRMIZI) ---
        const nitroTailLightLeft = new THREE.PointLight(0xff0000, 0, 5);
        nitroTailLightLeft.position.set(-0.32, 0.28, -1.12); // Sol arka far
        playerCar.add(nitroTailLightLeft);

        const nitroTailLightRight = new THREE.PointLight(0xff0000, 0, 5);
        nitroTailLightRight.position.set(0.32, 0.28, -1.12); // Sağ arka far
        playerCar.add(nitroTailLightRight);

        // Tüm nitro ışıklarını diziye ekle
        nitroLights.push(nitroLightLeft, nitroLightRight, nitroTailLightLeft, nitroTailLightRight);
        
        // Direksiyon oluştur (sadece 1. şahıs kamera için)
        createSteeringWheel();
        
        console.log(`${selectedCar.name} modeli başarıyla yüklendi!`);
        
    } catch (error) {
        console.warn('GLB model yüklenemedi, fallback küp kullanılıyor:', error);
        createFallbackCar();
    }
}

// Direksiyon objesi oluşturma
function createSteeringWheel() {
    const steeringGroup = new THREE.Group();
    
    // Ana direksiyon halkası - daha büyük ve gerçekçi
    const ringGeometry = new THREE.TorusGeometry(0.25, 0.03, 8, 16); // Daha büyük halka
    const ringMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 }); // Koyu siyah
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    steeringGroup.add(ring);
    
    // Direksiyon kolları - daha kalın ve gerçekçi
    const spokeGeometry = new THREE.BoxGeometry(0.4, 0.02, 0.02); // Daha geniş
    const spokeMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    
    // Yatay kol
    const horizontalSpoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
    steeringGroup.add(horizontalSpoke);
    
    // Dikey kol
    const verticalSpoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
    verticalSpoke.rotation.z = Math.PI / 2;
    steeringGroup.add(verticalSpoke);
    
    // Merkez düğme - daha büyük
    const centerGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 8);
    const centerMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.rotation.x = Math.PI / 2;
    steeringGroup.add(center);
    
    // Dashboard parçası ekleme (gerçekçilik için)
    const dashGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.3);
    const dashMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const dashboard = new THREE.Mesh(dashGeometry, dashMaterial);
    dashboard.position.set(0, -0.4, 0.2);
    steeringGroup.add(dashboard);
    
    // Direksiyon pozisyonu - 1. şahıs kamera için optimize edildi
    steeringGroup.position.set(0.15, 0.2, 0.4); // Sağa kaydırıldı ve alçaltıldı
    steeringGroup.rotation.x = -Math.PI / 8; // Daha az eğik
    steeringGroup.scale.set(1.0, 1.0, 1.0); // Normal boyut
    
    // Başlangıçta görünmez
    steeringGroup.visible = false;
    
    steeringWheel = steeringGroup;
    playerCar.add(steeringWheel);
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
  
  // Gökyüzü renklerini gece/gündüz moduna göre ayarla
  let skyColor = mapType.skyColor;
  let fogColor = mapType.fogColor;
  
  if (isNightMode) {
    // Gece modu için koyu renkler
    skyColor = 0x001122; // Koyu lacivert gökyüzü
    fogColor = 0x001122;
  }
  
  // Gökyüzü ve sis renklerini güncelle
  renderer.setClearColor(skyColor);
  
  // Sis yoğunluğunu varsayılan değere sıfırla (hava durumu sistemi kendi yoğunluğunu ayarlayacak)
  scene.fog = new THREE.FogExp2(fogColor, isNightMode ? 0.015 : 0.01); // Gece modunda daha az sis
  
  // Hava durumu sistemini oluştur
  createWeatherSystem(mapType);
  
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

      // Gerçek ışık ekle (lambanın üstüne) - gece modunda daha parlak
      const pointLight = new THREE.PointLight(0xfff8e7, isNightMode ? 1.2 : 0.8, 15, 2);
      pointLight.position.set(0, 5.5, 0); // Model yüksekliğine göre ayarla
      pointLight.castShadow = false; // Performans için kapalı
      lightObj.add(pointLight);

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
    Coin Sayısı: ${coinCount}<br>
    Araba Z: ${Math.floor(carZ)}<br>
    Araba Şerit: ${carPosition}<br>
    Harita: ${MAP_TYPES[currentMapIndex].name}<br>
    Engel Sayısı: ${obstacles.length}<br>
    Aktif Coin: ${coins.length}
  `;
}

function handleKeyPress(event) {
    if (!gameActive && event.code === 'Space') {
        restartGame();
        return;
    }

    if (!gameActive) return;

    // Ay hareket kontrolleri (sadece gece modunda ve ay hareket modu açıkken)
    if (isNightMode && canMoveMoon && moonObject) {
        switch(event.code) {
            case 'KeyW':
                moonObject.position.y += 5;
                updateMoonPosition();
                return;
            case 'KeyS':
                moonObject.position.y = Math.max(20, moonObject.position.y - 5);
                updateMoonPosition();
                return;
            case 'KeyA':
                moonObject.position.x -= 5;
                updateMoonPosition();
                return;
            case 'KeyD':
                moonObject.position.x += 5;
                updateMoonPosition();
                return;
            case 'ArrowUp':
                moonObject.position.y += 5;
                updateMoonPosition();
                return;
            case 'ArrowDown':
                moonObject.position.y = Math.max(20, moonObject.position.y - 5);
                updateMoonPosition();
                return;
            case 'ArrowLeft':
                moonObject.position.x -= 5;
                updateMoonPosition();
                return;
            case 'ArrowRight':
                moonObject.position.x += 5;
                updateMoonPosition();
                return;
        }
    }

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
        // KAMERA: C tuşuna basınca kamera modunu değiştir
        case 'KeyC':
            switchCameraMode();
            break;
        // AY HAREKETİ: M tuşuna basınca ay hareket modunu aç/kapat (sadece gece modunda)
        case 'KeyM':
            if (isNightMode) {
                canMoveMoon = !canMoveMoon;
                showMoonControlNotification();
            }
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

  // Standart hız artışı - maksimum hızı artırdım
  const MAX_SPEED = 0.5; // 0.3'ten 0.5'e artırdım
  let targetSpeed = initialCarSpeed + Math.floor(coinCount / 15) * 0.03; // Coin başına hız artışını da artırdım
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
    const time = Date.now() * 0.01;
    if (nitroLeft && nitroRight && nitroGlow) {
        nitroLeft.material.opacity = 0.5 + Math.sin(time) * 0.2;
        nitroRight.material.opacity = 0.5 + Math.sin(time + 1) * 0.2;
        nitroGlow.material.opacity = 0.3 + Math.sin(time * 1.5) * 0.2;
    }
    
    // Nitro ışıklarını aç
    nitroLights.forEach(light => {
        light.intensity = 2 + Math.random() * 0.5; // Titreyen efekt
    });
    
    // ARABA FARLARINI DA PARLAT (YENİ EKLENDİ!)
    carHeadlights.forEach(headlight => {
        headlight.intensity = 2 + Math.random() * 0.3; // Normal 1'den 2'ye çıkar
        headlight.color.setHex(0xaaffff); // Mavi-beyaz nitro rengi
    });
    
    targetSpeed += 0.25; // Nitro boost'u da artırdım
} else {
    nitroSpriteLeft.visible = false;
    nitroSpriteRight.visible = false;
    if (nitroGlow && nitroLeft && nitroRight) {
        nitroGlow.visible = false;
        nitroLeft.visible = false;
        nitroRight.visible = false;
    }
    
    // Nitro ışıklarını kapat
    nitroLights.forEach(light => {
        light.intensity = 0;
    });
    
    // ARABA FARLARINI NORMALE DÖNDür (YENİ EKLENDİ!)
    carHeadlights.forEach(headlight => {
        headlight.intensity = 1; // Normal parlaklığa dön
        headlight.color.setHex(0xffffff); // Normal beyaz renk
    });
}

  // Sınırları koru - maksimum hızı da artırdım
  carSpeed = Math.max(0.05, Math.min(targetSpeed, 0.8));

  document.getElementById('speedValue').textContent = Math.floor(carSpeed * 1000);

  // Harita değişimi kontrolü (her COINS_PER_MAP_CHANGE coin'de bir)
  const mapIndex = Math.floor(coinCount / COINS_PER_MAP_CHANGE) % MAP_TYPES.length;
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

    // Araba animasyonu (hıza bağlı sallanma) - iyileştirildi
    const speedFactor = carSpeed * 3;
    playerCar.rotation.z = Math.sin(Date.now() * 0.01 * speedFactor) * 0.03;
    playerCar.rotation.x = Math.sin(Date.now() * 0.008 * speedFactor) * 0.01;
  }

  // Kamerayı güncelle
  updateCamera();

  // Ay pozisyonunu güncelle (gece modunda)
  if (isNightMode) {
    updateMoonPosition();
    createMoonStatusIndicator(); // Ay durumu göstergesini güncelle
  } else {
    // Gündüz modunda ay göstergesini gizle
    const indicator = document.getElementById('moonStatus');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  // Yolu hareket ettir
  if (roadGroup) {
    roadGroup.position.z = -carZ;
  }
  updateRoad();

  // Engelleri güncelle ve kontrol et
  updateObstacles();
  
  // Coin'leri güncelle
  updateCoins();
  
  // Hava durumu efektlerini güncelle
  updateWeatherEffects();

  // Puanı güncelle (artık sadece coin toplamaya dayalı)
  document.getElementById('score').textContent = Math.floor(score);
  
  // Coin sayısını güncelle
  const coinDisplayElement = document.getElementById('coinDisplay');
  if (coinDisplayElement) {
    coinDisplayElement.textContent = coinCount;
  }

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
 coinCount = 0; // Coin sayısını sıfırla
 carPosition = 1;
 carTargetX = getXFromLane(carPosition);
 carZ = 0;
 carSpeed = initialCarSpeed;
 currentMapIndex = 0;
 currentCameraMode = CAMERA_MODES.THIRD_PERSON; // Kamerayı 3. şahıs moduna sıfırla
 canMoveMoon = false; // Ay hareket modunu kapat
 
 // Arabayı yeniden konumlandır
 if (playerCar) {
   playerCar.position.set(getXFromLane(carPosition), 0.2, carZ);
   playerCar.rotation.set(0, 0, 0);
 }
 
 // Direksiyon görünürlüğünü sıfırla
 if (steeringWheel) {
   steeringWheel.visible = false;
 }
 
 // Engelleri yeniden oluştur
 obstacles.forEach(obstacle => {
   scene.remove(obstacle);
 });
 createObstacles();
 
 // Coin'leri yeniden oluştur
 coins.forEach(coin => {
   scene.remove(coin);
 });
 createCoins();
 
 // İlk haritayı yeniden oluştur
 createRoad(MAP_TYPES[0]);
 nitroLights.forEach(light => {
    light.intensity = 0;
});
 
 // Ay pozisyonunu varsayılan konuma sıfırla (gece modundaysa)
 if (isNightMode && moonObject) {
   moonObject.position.set(0, 80, -40); // Yeni merkezi pozisyon
   updateMoonPosition();
 }
 
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
 
 // Coin sayısı göstergesi
 const coinDiv = document.createElement('div');
 coinDiv.innerHTML = '<h3>Coin: <span id="coinDisplay">0</span></h3>';
 uiContainer.appendChild(coinDiv);
 
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
   <p>Shift/N: Nitro | Ctrl/B: Fren</p>
   <p>C: Kamera Değiştir (3 Mod)</p>
   ${isNightMode ? '<p>M: Ay Hareket Modu | WASD: Ay Kontrol</p>' : ''}
   <p>Altın coinleri toplayın!</p>
   <p>Her ${COINS_PER_MAP_CHANGE} coin = Yeni Harita!</p>
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

// Sayfa yüklendiğinde zaman seçim menüsünü göster
window.addEventListener('load', async () => {
 // Body stilini ayarla
 document.body.style.margin = '0';
 document.body.style.padding = '0';
 document.body.style.overflow = 'hidden';
 document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
 
 // Canvas ve UI oluştur
 createCanvas();
 createGameUI();
 
 // Zaman seçim menüsünü göster
 createDayNightSelectionMenu();
 
 console.log('3D WebGL Araba Yarış Simülasyonu yüklendi!');
 console.log('Önce zaman seçin, sonra araç seçin ve oyunu başlatın!');
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

// Coin oluşturma fonksiyonu
function createCoins() {
    // Eski coinleri temizle
    coins.forEach(coin => scene.remove(coin));
    coins = [];

    const coinCount = 40; // Yolda toplam 40 coin
    for (let i = 0; i < coinCount; i++) {
        const lane = Math.floor(Math.random() * 4);
        const z = (i + 2) * 8 + Math.random() * 4; // Coinler arasında mesafe

        // Altın renkli dönen silindir coin
        const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
        const coinMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFD700, // Altın sarısı
            emissive: 0x332200 // Hafif parlaklık
        });
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        
        coin.position.set(getXFromLane(lane), 0.8, z);
        coin.rotation.x = Math.PI / 2; // Yatay dönsün
        coin.castShadow = true;
        
        // Coin'e özel veriler
        coin.userData = {
            lane: lane,
            z: z,
            originalY: 0.8,
            rotationSpeed: 0.05 + Math.random() * 0.03,
            bobSpeed: 0.02 + Math.random() * 0.01,
            isCoin: true,
            collected: false
        };

        // Coin etrafında parıltı efekti
        const glowGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFD700, 
            transparent: true, 
            opacity: 0.2 
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(coin.position);
        coin.add(glow);

        coins.push(coin);
        scene.add(coin);
    }
}

// Coin güncelleme fonksiyonu
function updateCoins() {
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        
        if (coin.userData.collected) continue;

        // Coin animasyonu - döndürme ve yüzdürme
        coin.rotation.z += coin.userData.rotationSpeed;
        coin.position.y = coin.userData.originalY + 
            Math.sin(Date.now() * coin.userData.bobSpeed + coin.userData.z) * 0.2;

        // Çarpışma kontrolü - coin toplama
        const playerBox = new THREE.Box3().setFromObject(playerCar);
        const coinBox = new THREE.Box3().setFromObject(coin);
        
        if (playerBox.intersectsBox(coinBox)) {
            // Coin toplandı!
            coin.userData.collected = true;
            scene.remove(coin);
            coins.splice(i, 1);
            
            // Skor artır
            score += 100; // Her coin 100 puan
            coinCount++;
            
            // Coin toplama ses efekti (opsiyonel)
            console.log(`Coin toplandı! Toplam: ${coinCount}`);
            
            // Coin toplama efekti göster
            showCoinCollectEffect(coin.position);
            continue;
        }

        // Coin yeniden konumlandırma (çok geride kalırsa)
        if (coin.userData.z < carZ - 30) {
            coin.userData.z = carZ + 80 + Math.random() * 40;
            const newLane = Math.floor(Math.random() * 4);
            coin.userData.lane = newLane;
            coin.position.set(getXFromLane(newLane), coin.userData.originalY, coin.userData.z);
        }
        
        // Coin pozisyonunu güncelle
        coin.position.z = coin.userData.z;
    }
}

// Coin toplama efekti
function showCoinCollectEffect(position) {
    // Parıltı efekti oluştur
    const effectGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    const effectMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFD700, 
        transparent: true, 
        opacity: 0.8 
    });
    const effect = new THREE.Mesh(effectGeometry, effectMaterial);
    effect.position.copy(position);
    scene.add(effect);

    // Efekti büyüt ve kaybet
    let scale = 0.1;
    const animateEffect = () => {
        scale += 0.1;
        effect.scale.set(scale, scale, scale);
        effect.material.opacity -= 0.05;
        
        if (effect.material.opacity <= 0) {
            scene.remove(effect);
            return;
        }
        requestAnimationFrame(animateEffect);
    };
    animateEffect();
}

// Hava durumu sistemi
function createWeatherSystem(mapType) {
    // Eski hava durumu efektlerini temizle
    clearWeatherEffects();
    
    switch(mapType.name) {
        case "Normal":
            // Hafif rüzgar efekti
            createWindEffect();
            break;
        case "Çöl":
            // Kum fırtınası efekti
            createSandstormEffect();
            break;
        case "Karlı":
            // Kar yağışı efekti
            createSnowEffect();
            break;
        case "Bahar":
            // Yağmur efekti
            createRainEffect();
            break;
    }
}

function clearWeatherEffects() {
    // Tüm hava durumu parçacıklarını temizle
    weatherParticles.forEach(particle => {
        scene.remove(particle);
        if (particle.geometry) particle.geometry.dispose();
        if (particle.material) particle.material.dispose();
    });
    weatherParticles = [];
    
    // Eski hava durumu sistemini kaldır
    if (currentWeatherSystem) {
        scene.remove(currentWeatherSystem);
        currentWeatherSystem = null;
    }
}

function createWindEffect() {
    // Hafif yaprak uçuşu efekti
    for (let i = 0; i < 20; i++) {
        const leafGeometry = new THREE.PlaneGeometry(0.2, 0.3);
        const leafMaterial = new THREE.MeshLambertMaterial({ 
            color: Math.random() > 0.5 ? 0x228B22 : 0x32CD32,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        
        leaf.position.set(
            (Math.random() - 0.5) * 60,
            Math.random() * 15 + 5,
            Math.random() * 200 - 50
        );
        
        leaf.userData = {
            originalX: leaf.position.x,
            speed: Math.random() * 0.02 + 0.01,
            rotSpeed: Math.random() * 0.05 + 0.02
        };
        
        weatherParticles.push(leaf);
        scene.add(leaf);
    }
}

function createSandstormEffect() {
    // Kum parçacık sistemi
    const particleCount = 150;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = Math.random() * 20;
        positions[i * 3 + 2] = Math.random() * 200 - 50;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const sandMaterial = new THREE.PointsMaterial({
        color: 0xF4A460,
        size: 3,
        transparent: true,
        opacity: 0.6
    });
    
    const sandstorm = new THREE.Points(particles, sandMaterial);
    sandstorm.userData = { speed: 0.3, wind: 0.05 };
    
    currentWeatherSystem = sandstorm;
    scene.add(sandstorm);
    
    // Görüş mesafesini azalt
    scene.fog.density = 0.02;
}

function createSnowEffect() {
    // Kar yağışı parçacık sistemi
    const particleCount = 200;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 80;
        positions[i * 3 + 1] = Math.random() * 30 + 10;
        positions[i * 3 + 2] = Math.random() * 200 - 50;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const snowMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 2,
        transparent: true,
        opacity: 0.8
    });
    
    const snow = new THREE.Points(particles, snowMaterial);
    snow.userData = { speed: 0.1, swirl: 0.02 };
    
    currentWeatherSystem = snow;
    scene.add(snow);
    
    // Daha az sis
    scene.fog.density = 0.015;
}

function createRainEffect() {
    // Yağmur efekti
    for (let i = 0; i < 100; i++) {
        const rainGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 3);
        const rainMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.6
        });
        const raindrop = new THREE.Mesh(rainGeometry, rainMaterial);
        
        raindrop.position.set(
            (Math.random() - 0.5) * 60,
            Math.random() * 25 + 15,
            Math.random() * 200 - 50
        );
        
        raindrop.userData = {
            speed: Math.random() * 0.3 + 0.2,
            wind: Math.random() * 0.05
        };
        
        weatherParticles.push(raindrop);
        scene.add(raindrop);
    }
    
    // Daha fazla sis
    scene.fog.density = 0.025;
}

function updateWeatherEffects() {
    // Rüzgar efekti (yapraklar)
    weatherParticles.forEach(particle => {
        if (particle.userData) {
            // Yapraklar için
            if (particle.userData.rotSpeed) {
                particle.rotation.z += particle.userData.rotSpeed;
                particle.position.x += particle.userData.speed;
                particle.position.y += Math.sin(Date.now() * 0.001 + particle.userData.originalX) * 0.02;
                
                if (particle.position.x > 30) {
                    particle.position.x = -30;
                }
            }
            
            // Yağmur damlaları için
            if (particle.userData.speed && !particle.userData.rotSpeed) {
                particle.position.y -= particle.userData.speed;
                particle.position.x += particle.userData.wind;
                
                if (particle.position.y < 0) {
                    particle.position.y = 40;
                    particle.position.x = (Math.random() - 0.5) * 60;
                }
            }
        }
    });
    
    // Partikül sistemleri için (kar, kum fırtınası)
    if (currentWeatherSystem && currentWeatherSystem.userData) {
        const positions = currentWeatherSystem.geometry.attributes.position.array;
        const userData = currentWeatherSystem.userData;
        
        for (let i = 0; i < positions.length; i += 3) {
            if (userData.speed) {
                positions[i + 1] -= userData.speed; // Y pozisyonu (düşme)
                
                if (userData.wind) {
                    positions[i] += userData.wind * (Math.random() - 0.5); // X pozisyonu (rüzgar)
                }
                
                if (userData.swirl) {
                    positions[i] += Math.sin(Date.now() * 0.001 + i) * userData.swirl;
                }
                
                // Sınırları kontrol et
                if (positions[i + 1] < 0) {
                    positions[i + 1] = 30;
                    positions[i] = (Math.random() - 0.5) * 80;
                }
            }
        }
        
        currentWeatherSystem.geometry.attributes.position.needsUpdate = true;
    }
}

// Araç seçim menüsü oluştur
function createCarSelectionMenu() {
    const menuContainer = document.createElement('div');
    menuContainer.id = 'carSelectionMenu';
    menuContainer.style.position = 'fixed';
    menuContainer.style.top = '0';
    menuContainer.style.left = '0';
    menuContainer.style.width = '100%';
    menuContainer.style.height = '100%';
    menuContainer.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    menuContainer.style.display = 'flex';
    menuContainer.style.flexDirection = 'column';
    menuContainer.style.alignItems = 'center';
    menuContainer.style.justifyContent = 'center';
    menuContainer.style.zIndex = '2000';
    menuContainer.style.fontFamily = 'Arial, sans-serif';

    const title = document.createElement('h1');
    title.textContent = 'ARAÇ SEÇİMİ';
    title.style.color = '#FFFFFF';
    title.style.marginBottom = '40px';
    title.style.fontSize = '48px';
    title.style.textShadow = '3px 3px 6px rgba(0,0,0,0.8)';
    menuContainer.appendChild(title);

    const carContainer = document.createElement('div');
    carContainer.style.display = 'flex';
    carContainer.style.gap = '30px';
    carContainer.style.marginBottom = '40px';

    AVAILABLE_CARS.forEach((car, index) => {
        const carCard = document.createElement('div');
        carCard.style.background = index === selectedCarIndex ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
        carCard.style.border = index === selectedCarIndex ? '3px solid #FFD700' : '2px solid #FFFFFF';
        carCard.style.borderRadius = '15px';
        carCard.style.padding = '20px';
        carCard.style.textAlign = 'center';
        carCard.style.cursor = 'pointer';
        carCard.style.transition = 'all 0.3s ease';
        carCard.style.minWidth = '200px';

        const carName = document.createElement('h3');
        carName.textContent = car.name;
        carName.style.color = '#FFFFFF';
        carName.style.margin = '0 0 10px 0';
        carName.style.fontSize = '24px';

        const carDesc = document.createElement('p');
        carDesc.textContent = car.description;
        carDesc.style.color = '#DDDDDD';
        carDesc.style.margin = '0';
        carDesc.style.fontSize = '14px';

        carCard.appendChild(carName);
        carCard.appendChild(carDesc);

        carCard.addEventListener('click', () => {
            selectedCarIndex = index;
            updateCarSelection();
        });

        carCard.addEventListener('mouseenter', () => {
            if (index !== selectedCarIndex) {
                carCard.style.background = 'rgba(255,255,255,0.2)';
                carCard.style.transform = 'scale(1.05)';
            }
        });

        carCard.addEventListener('mouseleave', () => {
            if (index !== selectedCarIndex) {
                carCard.style.background = 'rgba(255,255,255,0.1)';
                carCard.style.transform = 'scale(1)';
            }
        });

        carContainer.appendChild(carCard);
    });

    function updateCarSelection() {
        Array.from(carContainer.children).forEach((card, index) => {
            if (index === selectedCarIndex) {
                card.style.background = 'rgba(255,255,255,0.3)';
                card.style.border = '3px solid #FFD700';
                card.style.transform = 'scale(1.1)';
            } else {
                card.style.background = 'rgba(255,255,255,0.1)';
                card.style.border = '2px solid #FFFFFF';
                card.style.transform = 'scale(1)';
            }
        });
    }

    const startButton = document.createElement('button');
    startButton.textContent = 'OYUNU BAŞLAT';
    startButton.style.background = 'linear-gradient(45deg, #FF6B6B, #FF8E53)';
    startButton.style.border = 'none';
    startButton.style.borderRadius = '25px';
    startButton.style.padding = '15px 40px';
    startButton.style.fontSize = '24px';
    startButton.style.color = '#FFFFFF';
    startButton.style.cursor = 'pointer';
    startButton.style.fontWeight = 'bold';
    startButton.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    startButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    startButton.style.transition = 'all 0.3s ease';

    startButton.addEventListener('mouseenter', () => {
        startButton.style.transform = 'scale(1.1)';
        startButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    });

    startButton.addEventListener('mouseleave', () => {
        startButton.style.transform = 'scale(1)';
        startButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    });

    startButton.addEventListener('click', async () => {
        menuContainer.style.display = 'none';
        gameStarted = true;
        await startGame();
    });

    // Klavye kontrolleri
    document.addEventListener('keydown', (e) => {
        if (!gameStarted) {
            switch(e.code) {
                case 'ArrowLeft':
                    selectedCarIndex = Math.max(0, selectedCarIndex - 1);
                    updateCarSelection();
                    break;
                case 'ArrowRight':
                    selectedCarIndex = Math.min(AVAILABLE_CARS.length - 1, selectedCarIndex + 1);
                    updateCarSelection();
                    break;
                case 'Enter':
                case 'Space':
                    startButton.click();
                    break;
            }
        }
    });

    const instructions = document.createElement('p');
    instructions.textContent = 'Klavye: ← → ile araç seçimi, Enter/Space ile başlat';
    instructions.style.color = '#CCCCCC';
    instructions.style.fontSize = '16px';
    instructions.style.marginTop = '20px';

    menuContainer.appendChild(carContainer);
    menuContainer.appendChild(startButton);
    menuContainer.appendChild(instructions);
    document.body.appendChild(menuContainer);
}

// Kamera güncelleme fonksiyonu
function updateCamera() {
    if (!playerCar) return;
    
    const carX = getXFromLane(carPosition);
    
    // Direksiyon görünürlüğünü kontrol et
    if (steeringWheel) {
        steeringWheel.visible = (currentCameraMode === CAMERA_MODES.FIRST_PERSON);
    }
    
    // 1. şahıs modunda araba gövdesini gizle (cam sorunu çözümü)
    if (playerCar) {
        playerCar.traverse((child) => {
            if (child.isMesh && child !== steeringWheel) {
                if (currentCameraMode === CAMERA_MODES.FIRST_PERSON) {
                    // 1. şahıs modunda araç gövdesini görünmez yap
                    child.visible = false;
                } else {
                    // Diğer modlarda araç gövdesini görünür yap
                    child.visible = true;
                }
            }
        });
        
        // Direksiyonu her zaman doğru görünürlükte tut
        if (steeringWheel) {
            steeringWheel.traverse((child) => {
                if (child.isMesh) {
                    child.visible = (currentCameraMode === CAMERA_MODES.FIRST_PERSON);
                }
            });
        }
    }
    
    switch(currentCameraMode) {
        case CAMERA_MODES.THIRD_PERSON:
            // 3. şahıs kamera (arkadan takip)
            camera.position.set(carX, cameraHeight, carZ - cameraDistance);
            camera.lookAt(carX, 0, carZ + 5);
            break;
            
        case CAMERA_MODES.FIRST_PERSON:
            // 1. şahıs kamera (gerçek araç içi görünümü - araç gövdesi görünmez)
            const carWorldPosition = new THREE.Vector3();
            playerCar.getWorldPosition(carWorldPosition);
            
            // Kamerayı tam araç içine koy - driver seat pozisyonu
            camera.position.set(carX - 0.15, carWorldPosition.y + 0.5, carZ + 0.2); // Daha iyi pozisyon
            camera.lookAt(carX, carWorldPosition.y + 0.4, carZ + 20); // İleriye bak
            
            // FOV'u araba içi için ayarla
            camera.fov = 90; // Daha geniş açı (85'den 90'a)
            camera.updateProjectionMatrix();
            
            // Direksiyon animasyonu (şerit değişiminde)
            if (steeringWheel) {
                const targetRotation = (carTargetX - playerCar.position.x) * 0.8;
                steeringWheel.rotation.z = THREE.MathUtils.lerp(steeringWheel.rotation.z, targetRotation, 0.15);
            }
            break;
            
        case CAMERA_MODES.FRONT_VIEW:
            // Ön görünüm kamera (arabaya önden bakış)
            camera.position.set(carX, cameraHeight * 0.8, carZ + cameraDistance);
            camera.lookAt(carX, 0, carZ - 2);
            
            // FOV'u normal hale getir
            camera.fov = 75;
            camera.updateProjectionMatrix();
            break;
    }
    
    // 3. şahıs ve ön görünümde FOV'u normal tut
    if (currentCameraMode !== CAMERA_MODES.FIRST_PERSON) {
        camera.fov = 75;
        camera.updateProjectionMatrix();
    }
}

// Kamera modu değiştirme
function switchCameraMode() {
    currentCameraMode = (currentCameraMode + 1) % Object.keys(CAMERA_MODES).length;
    
    // Kamera modu bildirimini göster
    showCameraModeNotification();
}

// Kamera modu bildirimi
function showCameraModeNotification() {
    let notification = document.getElementById('cameraNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'cameraNotification';
        notification.style.position = 'absolute';
        notification.style.top = '20%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.background = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = '#FFFFFF';
        notification.style.padding = '15px 25px';
        notification.style.borderRadius = '10px';
        notification.style.fontSize = '18px';
        notification.style.textAlign = 'center';
        notification.style.zIndex = '1000';
        notification.style.display = 'none';
        notification.style.border = '2px solid #00FFFF';
        notification.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
        document.body.appendChild(notification);
    }
    
    let modeText = '';
    switch(currentCameraMode) {
        case CAMERA_MODES.THIRD_PERSON:
            modeText = '3. Şahıs Kamera';
            break;
        case CAMERA_MODES.FIRST_PERSON:
            modeText = '1. Şahıs Kamera<br><small>(Araç gövdesi gizli - Net görüş)</small>';
            break;
        case CAMERA_MODES.FRONT_VIEW:
            modeText = 'Ön Görünüm Kamera';
            break;
    }
    
    notification.innerHTML = `Kamera: ${modeText}`;
    notification.style.display = 'block';
    
    // 2 saniye sonra bildirim kaybolsun
    setTimeout(() => {
        notification.style.display = 'none';
    }, 2000);
}

// Ay kontrol bildirimi
function showMoonControlNotification() {
    let notification = document.getElementById('moonControlNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'moonControlNotification';
        notification.style.position = 'absolute';
        notification.style.top = '30%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.background = 'rgba(0, 0, 100, 0.9)';
        notification.style.color = '#FFFFFF';
        notification.style.padding = '20px 30px';
        notification.style.borderRadius = '15px';
        notification.style.fontSize = '18px';
        notification.style.textAlign = 'center';
        notification.style.zIndex = '1000';
        notification.style.display = 'none';
        notification.style.border = '3px solid #FFFF00';
        notification.style.boxShadow = '0 0 25px rgba(255, 255, 0, 0.7)';
        notification.style.lineHeight = '1.5';
        document.body.appendChild(notification);
    }
    
    if (canMoveMoon) {
        notification.innerHTML = `
            <strong>🌙 AY HAREKET MODU AÇIK!</strong><br>
            <br>
            WASD / Ok Tuşları: Ayı hareket ettir<br>
            M: Modu kapat
        `;
    } else {
        notification.innerHTML = `
            <strong>🌙 AY HAREKET MODU KAPALI</strong><br>
            <br>
            M tuşuna basarak ayı hareket ettirebilirsiniz
        `;
    }
    
    notification.style.display = 'block';
    
    // 4 saniye sonra bildirim kaybolsun
    setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
}

// Gece modunda ay durumu göstergesi
function createMoonStatusIndicator() {
    if (!isNightMode) return;
    
    let indicator = document.getElementById('moonStatus');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'moonStatus';
        indicator.style.position = 'absolute';
        indicator.style.top = '20px';
        indicator.style.right = '20px';
        indicator.style.background = 'rgba(0, 0, 50, 0.8)';
        indicator.style.color = '#FFFFFF';
        indicator.style.padding = '10px 15px';
        indicator.style.borderRadius = '10px';
        indicator.style.fontSize = '14px';
        indicator.style.zIndex = '100';
        indicator.style.border = '2px solid #FFFF00';
        indicator.style.fontFamily = 'Arial, sans-serif';
        document.body.appendChild(indicator);
    }
    
    indicator.innerHTML = `
        🌙 Gece Modu<br>
        Ay Hareket: ${canMoveMoon ? '<span style="color: #00FF00;">AÇIK</span>' : '<span style="color: #FF6666;">KAPALI</span>'}
    `;
    
    indicator.style.display = 'block';
}