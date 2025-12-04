








let currentMusic = null;
let musicEnabled = true;
const MUSIC_VOLUME = 0.7; 


const MAP_MUSIC = {
    0: 'graphics_three/musics/Life is a Highway.mp3', 
    1: 'graphics_three/musics/forgottendeserts.mp3', 
    2: 'graphics_three/musics/snow.mp3', 
    3: 'graphics_three/musics/Opening Race.mp3'  
};


let isJumping = false;
let jumpVelocity = 0;
let jumpStartY = 0.2; 
let jumpHeight = 4.0; 
let jumpSpeed = 0.15; 
let gravity = 0.005; 
let jumpCooldown = false;
let jumpCooldownTime = 1000; 
let jumpSound = null;


let carSelectionLightsEnabled = true; 
let lightToggleButton = null; 


let lightIntensityPanel = null;
let lightSliders = {
    ambient: 0.8,
    spot: 2.0, 
    point: 0.8,
    directional: 0.8
};
let lightObjects = {   
    ambient: null,
    spot: null,
    point: null,
    directional: null
};


function playMapMusic(mapIndex) {
    if (!musicEnabled) return;
    
    if (selectedCarIndex === 12 && currentMusic && currentMusic.src.includes('m3.mp3')) {
        console.log(`🚗 BMW M3 aktif - harita müziği ${MAP_TYPES[mapIndex].name} için atlanıyor`);
        return; // BMW M3 müziğini koruyup çık
    }
    
    if (currentMusic) {
        try {
            currentMusic.pause();
            currentMusic.currentTime = 0;
            currentMusic.removeEventListener('loadeddata', null);
            currentMusic.removeEventListener('canplay', null);
            currentMusic.removeEventListener('error', null);
            currentMusic.removeEventListener('progress', null);
            currentMusic = null; 
        } catch (e) {
            console.warn('Müzik durdurulurken hata:', e);
        }
    }
    
    
    const musicPath = MAP_MUSIC[mapIndex];
    if (!musicPath) {
        console.warn('Bu harita için müzik bulunamadı:', mapIndex);
        return;
    }
    
    console.log(`🎵 ANINDA MÜZİK DEĞİŞİMİ: ${musicPath} (Harita: ${MAP_TYPES[mapIndex].name})`);
    
    try {
        currentMusic = new Audio();
        currentMusic.src = musicPath;
        currentMusic.volume = MUSIC_VOLUME;
        currentMusic.loop = true;
        currentMusic.preload = 'auto';
        
        
        const playImmediately = () => {
            console.log(`✅ Yeni müzik başladı: ${MAP_TYPES[mapIndex].name}`);
            if (musicEnabled) {
                currentMusic.play().catch(e => {
                    console.warn('⚠️ Müzik çalınamadı:', e.message);
                    if (e.name === 'NotAllowedError') {
                        console.log('💡 Tarayıcı müzik çalmak için kullanıcı etkileşimi bekliyor.');
                        showMusicInteractionPrompt();
                    }
                });
            }
        };
        
        
        currentMusic.addEventListener('loadeddata', playImmediately);
        currentMusic.addEventListener('canplay', playImmediately);
        
        
        currentMusic.addEventListener('error', (e) => {
            console.error('❌ Müzik yükleme hatası:');
            console.error('Dosya:', musicPath);
            console.error('Hata kodu:', currentMusic.error?.code);
            console.error('Hata mesajı:', currentMusic.error?.message);
            
            
            switch(currentMusic.error?.code) {
                case 1:
                    console.error('MEDIA_ERR_ABORTED: Kullanıcı işlemi iptal etti');
                    break;
                case 2:
                    console.error('MEDIA_ERR_NETWORK: Ağ hatası');
                    break;
                case 3:
                    console.error('MEDIA_ERR_DECODE: Dosya format hatası');
                    break;
                case 4:
                    console.error('MEDIA_ERR_SRC_NOT_SUPPORTED: Dosya bulunamadı veya desteklenmiyor');
                    break;
            }
        });
        
        
        currentMusic.load();
        
        
        setTimeout(() => {
            if (currentMusic && musicEnabled && currentMusic.paused) {
                currentMusic.play().catch(e => {
                    
                });
            }
        }, 100);
        
    } catch (error) {
        console.error('💥 Müzik oluşturma hatası:', error);
    }
}

function toggleMusic() {
    musicEnabled = !musicEnabled;
    
    if (currentMusic) {
        if (musicEnabled) {
            
            currentMusic.play().catch(e => {
                console.warn('⚠️ Müzik çalınamadı:', e.message);
                if (e.name === 'NotAllowedError') {
                    console.log('💡 Tarayıcı güvenlik nedeniyle müzik çalmayı engelledi. Sayfada bir tıklama yapın.');
                    
                    showMusicInteractionPrompt();
                }
            });
        } else {
            currentMusic.pause();
        }
    }
    
    console.log(`🎵 Müzik ${musicEnabled ? 'açıldı' : 'kapatıldı'}`);
    return musicEnabled;
}


function showMusicInteractionPrompt() {
    let prompt = document.getElementById('musicPrompt');
    if (!prompt) {
        prompt = document.createElement('div');
        prompt.id = 'musicPrompt';
        prompt.style.position = 'absolute';
        prompt.style.top = '40%';
        prompt.style.left = '50%';
        prompt.style.transform = 'translate(-50%, -50%)';
        prompt.style.background = 'rgba(255, 165, 0, 0.9)';
        prompt.style.color = '#FFFFFF';
        prompt.style.padding = '20px 30px';
        prompt.style.borderRadius = '15px';
        prompt.style.fontSize = '18px';
        prompt.style.textAlign = 'center';
        prompt.style.zIndex = '1001';
        prompt.style.border = '3px solid #FFD700';
        prompt.style.boxShadow = '0 0 25px rgba(255, 165, 0, 0.7)';
        prompt.style.cursor = 'pointer';
        document.body.appendChild(prompt);
    }
    
    prompt.innerHTML = `
        🎵 Müzik İçin Tıklayın<br>
        <small>Tarayıcı güvenliği nedeniyle tıklama gerekli</small>
    `;
    
    prompt.style.display = 'block';
    
    
    prompt.addEventListener('click', () => {
        if (currentMusic && musicEnabled) {
            currentMusic.play().then(() => {
                console.log('🎵 Müzik kullanıcı etkileşimi ile başlatıldı');
                prompt.style.display = 'none';
            }).catch(e => {
                console.error('Müzik hala çalamıyor:', e);
            });
        }
    });
    
    
    setTimeout(() => {
        prompt.style.display = 'none';
    }, 10000);
}

const OBSTACLE_GLB_MODELS = [
    'graphics_three/assets/mia.glb',
    'graphics_three/assets/sheriff.glb',
    'graphics_three/assets/fillmore.glb',
    'graphics_three/assets/guido.glb',
];


let coins = [];
let coinCount = 0;
const COINS_PER_MAP_CHANGE = 20; 


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
    ,
    {
        name: "Wingo",
        path: "graphics_three/assets/wingo/source/Wingo.glb",
        scale: 0.12, 
        description: "Hızlı ve şık spor arabası",
        
    },
     {
        name: "DJ",
        path: "graphics_three/assets/dj_cars_2_game_wii.glb",
        scale: 0.5,
        description: "Hızlı ve sanatsever yarış arabası",
      
        
    },
    {
        name: "Boost",
        path: "graphics_three/assets/1999_boost.glb",
        scale: 0.5,
        description: "Hızlı ve lider ruhlu yarış arabası",
      
        
    },
    {
        name: "Snot Rod",
        path: "graphics_three/assets/Snot Rod.glb",
        scale: 0.12,
        description: "Turbo gazlı, asi drag arabası", 
    },
    {
        name: "Finn McMissle",
        path: "graphics_three/assets/Finn McMissle.glb",
        scale: 0.5,
        description: "Casus, zeki, çok amaçlı Aston Martin", 
    },
     {
    name: "Michael Schumacher Ferrari",
    path: "graphics_three/assets/michael_schumacher_ferrari.glb",
    scale: 0.5,
    description: "Efsanevi Formula 1 sürücüsünün Ferrari arabası"
},
{
    name: "Holley Shiftwell",
    path: "graphics_three/assets/holley_shiftwell.glb",
    scale: 0.5,
    description: "Yüksek teknolojiye sahip ajan araba"
},
{
    name: "Chick Hicks",
    path: "graphics_three/assets/chick_hicks.glb",
    scale: 0.5,
    description: "Hırslı ve kural tanımaz rakip yarışçı"
},
{
    name: "The King",
    path: "graphics_three/assets/the_king.glb",
        scale: 0.12,
    description: "Tecrübeli ve saygı duyulan emektar yarışçı"
}
,
{
    name: "BMW M3 GTR",
    path: "graphics_three/assets/M3.glb",
    scale: 0.5,
    description: "2003 NFS MW Efsanesi"
}
    
];


const CAR_ROTATIONS = {
    "DJ": -Math.PI / 2,
    "Finn McMissle": -Math.PI / 2,
    "Snot Rod": 0,
    "Holley Shiftwell": 0,
    "Wingo": 0,
    "Lightning McQueen": 0,
    "Mater": 0,
    "Doc Hudson": 0,
    "Boost": 0,
    "Michael Schumacher Ferrari": 0,
    "Chick Hicks": 0,
    "The King": 0
};


let selectedCar = null;
let selectedCarIndex = 0;

let gameStarted = false;


let currentCameraMode = 0; 


const CAMERA_MODES = {
    THIRD_PERSON: 0,
    CLOSE_VIEW: 1,  
    FIRST_PERSON: 2,  
    FRONT_VIEW: 3     
};


let isNightMode = false;
let moonObject = null;
let moonLight = null;
let sunLight = null;
let steeringWheel = null; 
let canMoveMoon = false; 

function checkCollision(obstacle, playerCar) {
    // Önce mesafe kontrolü - sadece yakın engeller için collision kontrolü yap
    const zDistance = Math.abs(obstacle.position.z - playerCar.position.z);
    if (zDistance > 2.0) { // 2 birim yakınlıkta kontrol et
        return false;
    }
    
    // X ekseni kontrolü - sadece aynı şeritteyse
    const xDistance = Math.abs(obstacle.position.x - playerCar.position.x);
    if (xDistance > 1.0) { // Şerit genişliği kontrolü
        return false;
    }
    
    // Sadece arabanın ana gövdesini kullan - TÜM ışıkları ve efektleri hariç tut
    const carBox = new THREE.Box3();
    let hasValidMesh = false;
    
    // Arabanın sadece ana mesh'lerini kontrol et - sadece araç gövdesi
    playerCar.traverse((child) => {
        // Sadece opak, katı mesh'leri dahil et
        // TÜM ışıklar, efektler, volumetric'ler hariç
        if (child.isMesh && 
            !child.userData.isVolumetric && 
            !child.userData.isHeadlightGlow &&
            !child.userData.isLightTarget &&
            !child.userData.isHeadlight &&
            !child.userData.isNitroVolumetric &&
            !child.userData.isNitroGlow &&
            child.material) {
            // Material kontrolü - şeffaf değilse ve opacity yeterliyse
            const isTransparent = child.material.transparent === true;
            const opacity = child.material.opacity !== undefined ? child.material.opacity : 1.0;
            
            if (!isTransparent && opacity >= 0.8) { // Opak objeler
                const childBox = new THREE.Box3().setFromObject(child);
                if (!childBox.isEmpty()) {
                    carBox.union(childBox);
                    hasValidMesh = true;
                }
            }
        }
    });
    
    // Eğer hiç mesh bulunamazsa, arabanın kendisini kullan ama tüm efektleri filtrele
    if (!hasValidMesh || carBox.isEmpty()) {
        // Sadece ana gövdeyi al, TÜM child objeleri filtrele
        const tempBox = new THREE.Box3();
        playerCar.children.forEach((child) => {
            if (child.isMesh && 
                !child.userData.isVolumetric && 
                !child.userData.isHeadlightGlow &&
                !child.userData.isLightTarget &&
                !child.userData.isHeadlight &&
                !child.userData.isNitroVolumetric &&
                !child.userData.isNitroGlow &&
                child.material) {
                const isTransparent = child.material.transparent === true;
                const opacity = child.material.opacity !== undefined ? child.material.opacity : 1.0;
                
                if (!isTransparent && opacity >= 0.8) {
                    tempBox.expandByObject(child);
                    hasValidMesh = true;
                }
            }
        });
        if (!tempBox.isEmpty() && hasValidMesh) {
            carBox.copy(tempBox);
        } else {
            // Son çare: tüm objeyi al ama küçült
            carBox.setFromObject(playerCar);
            carBox.expandByScalar(-0.2); // %20 küçült (daha az küçült)
        }
    } else {
        // Collision box'ı çok az küçült - sadece gerçek temas için
        carBox.expandByScalar(-0.1); // %10 küçült (daha az küçült)
    }
    
    const obstacleBox = new THREE.Box3().setFromObject(obstacle);
    obstacleBox.expandByScalar(-0.05); // Engel box'ını %5 küçült (çok az küçült)
    
    return obstacleBox.intersectsBox(carBox);
}



function playSelectedCarMusic() {
    const selectedCar = AVAILABLE_CARS[selectedCarIndex];
    
    
    if (selectedCar && selectedCar.music) {
        console.log(`🎵 ${selectedCar.name} için özel müzik çalıyor: ${selectedCar.music}`);
        
        
        if (currentMusic) {
            try {
                currentMusic.pause();
                currentMusic.currentTime = 0;
                currentMusic = null;
            } catch (e) {
                console.warn('Müzik durdurulurken hata:', e);
            }
        }
        
        try {
            currentMusic = new Audio();
            currentMusic.src = selectedCar.music;
            currentMusic.volume = MUSIC_VOLUME;
            currentMusic.loop = true;
            currentMusic.preload = 'auto';
            
            const playImmediately = () => {
                console.log(`✅ ${selectedCar.name} özel müziği başladı`);
                if (musicEnabled) {
                    currentMusic.play().catch(e => {
                        console.warn('⚠️ Araç müziği çalınamadı:', e.message);
                        if (e.name === 'NotAllowedError') {
                            showMusicInteractionPrompt();
                        }
                    });
                }
            };
            
            currentMusic.addEventListener('loadeddata', playImmediately);
            currentMusic.addEventListener('canplay', playImmediately);
            
            currentMusic.addEventListener('error', (e) => {
                console.error('❌ Araç müziği yükleme hatası:', selectedCar.music);
                console.error('Varsayılan harita müziğine dönülüyor...');
                playMapMusic(currentMapIndex); 
            });
            
            currentMusic.load();
            
        } catch (error) {
            console.error('💥 Araç müziği oluşturma hatası:', error);
            playMapMusic(currentMapIndex); 
        }
    } else {
        
        console.log(`🎵 ${selectedCar.name} için özel müzik yok, harita müziği çalıyor`);
        playMapMusic(currentMapIndex);
    }
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
            if (OBSTACLE_GLB_MODELS[i].includes('mia.glb',)) {
                model.scale.set(0.15, 0.15, 0.15); 
                console.log(' Mia modeli küçük boyutta ayarlandı (0.15)');
            } else {
                model.scale.set(0.4, 0.4, 0.4); 
            }
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
    grassColor: 0x228b22, 
    skyColor: 0x87CEEB,
    fogColor: 0x87CEEB
  },
  { 
    name: "Çöl", 
    roadColor: 0x8B4513, 
    grassColor: 0xF4A460, 
    skyColor: 0xFFD700, 
    fogColor: 0xFFD700
  },
  { 
    name: "Karlı", 
    roadColor: 0x666666, 
    grassColor: 0xFFFFFF, 
    skyColor: 0xB0E0E6, 
    fogColor: 0xF0F8FF
  },
  { 
    name: "Bahar", 
    roadColor: 0x555555, 
    grassColor: 0x90EE90, 
    skyColor: 0x00BFFF, 
    fogColor: 0x00BFFF
  }
];


function showMapChangeNotification(mapType) {
  
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
  
  
  notification.textContent = `Yeni Harita: ${mapType.name}`;
  notification.style.display = 'block';
  
  
  setTimeout(() => {
    notification.style.display = 'none';
  }, 300);
}


let currentMapIndex = 0;
let scene, camera, renderer;
let carPosition = 1; 
let carTargetX = getXFromLane(carPosition); 
let carZ = 0; 
let initialCarSpeed = 0.2; 
let carSpeed = initialCarSpeed; 
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

let nitroLights = [];
let carHeadlights = [];


let weatherParticles = [];
let currentWeatherSystem = null;
let windSound = false;


let carModel = null;
let roadSegments = [];
let obstacleModels = [];


// GLTFLoader'ı kontrol et ve oluştur
let loader;
if (typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined') {
    loader = new THREE.GLTFLoader();
} else if (typeof GLTFLoader !== 'undefined') {
    THREE.GLTFLoader = GLTFLoader;
    loader = new THREE.GLTFLoader();
} else {
    console.error('❌ GLTFLoader bulunamadı!');
    loader = null;
}


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


async function startGame() {
    scene = new THREE.Scene();
    const canvas = document.getElementById('gameCanvas');
    
    
    await loadRoadModels();
    
    await loadCarModel();
    await loadObstacleModels();
    createObstacles();
    createCoins(); 

    
    scene.fog = new THREE.FogExp2(MAP_TYPES[0].fogColor, 0.01);
  
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000); 
  
    
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    renderer.shadowMap.autoUpdate = true;
    renderer.setClearColor(MAP_TYPES[0].skyColor); 
    
    
    renderer.shadowMap.width = 4096; 
    renderer.shadowMap.height = 4096;
  
    
    setupLighting();
    await loadStreetlightModel();
    
    
    if (isNightMode) {
        console.log('🌙 GECE MODU AKTIF!');
        console.log('Ay gökyüzünde merkezi konumda (yukarı bakın)');
        console.log('WASD tuşları ile ayı hareket ettirebilirsiniz (otomatik aktif)');
        canMoveMoon = true; 
        showMoonControlNotification(); 
    }
    
    
    playSelectedCarMusic()
    playMapMusic(0);
    
    
    
    window.addEventListener('resize', onWindowResize);
  
    
    document.addEventListener('keydown', handleKeyPress);
  
    
    createRoad(MAP_TYPES[0]);
  
    
    await loadCarModel();
  
    
    createObstacles();
  
    // Create UI
    createGameUI();
    
    gameLoop();
}

// Advanced Lighting System Variables
let volumetricLights = [];
let bloomEffects = [];
let dynamicLightAdaptation = true;
let lightIntensityMultiplier = 1.0;
let volumetricLightMeshes = [];

// Modern UI System Variables
let modernUIInitialized = false;

function setupLighting() {
    
    if (isNightMode) {
        
        setupNightLighting();
    } else {
        
        setupDayLighting();
    }
    
    
    // Atmosferi biraz karanlıklaştır - gerçekçi aydınlatma için
    const ambientLight = new THREE.AmbientLight(0x404040, isNightMode ? 0.25 : 0.5);
    scene.add(ambientLight);
    
    
    const cameraLight = new THREE.SpotLight(0xffffff, 0.3);
    cameraLight.position.set(0, 10, 0);
    scene.add(cameraLight);
    
    const spotLight = new THREE.SpotLight(0xffffff, isNightMode ? 0.5 : 1.0);
    spotLight.position.set(0, 30, 0);
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 0.5;
    spotLight.castShadow = true;
    scene.add(spotLight);
    
    // Advanced Lighting Features
    setupVolumetricLights();
    setupBloomEffects();
    setupDynamicLightAdaptation();
}

// Volumetric Light Effects - Creates visible light rays/beams
function setupVolumetricLights() {
    volumetricLights = [];
    volumetricLightMeshes = [];
    
    // Create volumetric light cones for streetlights (night mode)
    if (isNightMode && loadedStreetlightModel) {
        // This will be called after streetlights are created
        // We'll update this in createRoad function
    }
    
    // Volumetric effect for car headlights - gerçekçi ışık ışınları
    if (playerCar) {
        createCarVolumetricLights();
    }
    
    // Arabanın önündeki alanı aydınlatmak için ek volumetric light
    // Bu gerçek hayattaki ışık saçılmasını simüle eder
}

function createCarVolumetricLights() {
    // Beyaz far volumetric cone'ları kaldırıldı - sadece SpotLight'lar kullanılıyor
    // Diğer ışıklar (nitro, fren) sabit kalıyor
}

// Bloom/Glow Effects - Enhanced visual quality
function setupBloomEffects() {
    bloomEffects = [];
    
    // Enhanced glow for nitro effects
    if (nitroGlow) {
        const bloomMaterial = nitroGlow.material.clone();
        bloomMaterial.emissive = new THREE.Color(0xff4400);
        bloomMaterial.emissiveIntensity = 2.0;
        nitroGlow.material = bloomMaterial;
        bloomEffects.push(nitroGlow);
    }
    
    // Enhanced glow for moon (night mode)
    if (isNightMode && moonObject) {
        moonObject.traverse((child) => {
            if (child.isMesh && child.material) {
                const material = child.material.clone();
                if (material.emissive) {
                    material.emissiveIntensity = 1.5;
                }
                child.material = material;
                bloomEffects.push(child);
            }
        });
    }
}

// Dynamic Light Adaptation - Adjusts lighting based on speed and environment
function setupDynamicLightAdaptation() {
    dynamicLightAdaptation = true;
    lightIntensityMultiplier = 1.0;
}

function updateDynamicLighting() {
    if (!dynamicLightAdaptation) return;
    
    // Adjust light intensity based on car speed
    const speedFactor = Math.min(carSpeed / 0.5, 1.5); // Normalize speed
    lightIntensityMultiplier = 0.8 + (speedFactor * 0.4); // Range: 0.8 to 1.2
    
    // Adjust ambient light based on environment
    const environmentFactor = isNightMode ? 0.6 : 1.0;
    lightIntensityMultiplier *= environmentFactor;
    
    // Apply to volumetric lights
    volumetricLightMeshes.forEach((mesh) => {
        if (mesh.material) {
            mesh.material.opacity = (isNightMode ? 0.15 : 0.08) * lightIntensityMultiplier;
        }
    });
    
    // Adjust headlight intensity dynamically - gerçekçi değerler
    carHeadlights.forEach((headlight, index) => {
        if (headlight) {
            // İlk iki far için daha yüksek intensity (gerçekçi değerler)
            if (index < 2) {
                const baseIntensity = isNightMode ? 5.0 : 3.5;
                headlight.intensity = baseIntensity * lightIntensityMultiplier;
                // Gerçekçi sıcak beyaz renk
                headlight.color.setHex(0xffffcc);
            } else {
                // Ön doldurma ışığı için
                const baseIntensity = isNightMode ? 3.0 : 2.2;
                headlight.intensity = baseIntensity * lightIntensityMultiplier;
                headlight.color.setHex(0xffffcc);
            }
            
            // Add slight flicker effect at high speeds (gerçekçi titreşim)
            if (carSpeed > 0.6) {
                headlight.intensity += Math.sin(Date.now() * 0.01) * 0.15;
            }
        }
    });
    
    // Nitro boost lighting - neon mavi ışık
    if (nitroActive) {
        lightIntensityMultiplier *= 1.5;
        nitroLights.forEach((light) => {
            if (light && light.userData && light.userData.isNitroLight) {
                light.intensity = 4.0 + Math.sin(Date.now() * 0.03) * 1.0;
                light.color.setHex(0x00ffff); // Neon mavi
            }
        });
    }
    
    // Fren lighting - kırmızı ışık
    if (brakeActive) {
        nitroLights.forEach((light) => {
            if (light && light.userData && light.userData.isBrakeLight) {
                light.intensity = 3.0 + Math.sin(Date.now() * 0.05) * 0.5;
                light.color.setHex(0xff0000); // Kırmızı
            }
        });
    }
}

// 3D HUD System - Creates holographic UI elements around the car
// Modern UI System - Creates stunning, innovative UI elements
function createModernUI() {
    if (modernUIInitialized) return;
    
    // Remove old UI
    const oldUI = document.getElementById('gameUI');
    if (oldUI) oldUI.remove();
    
    // Create modern UI container
    const uiContainer = document.createElement('div');
    uiContainer.id = 'modernGameUI';
    uiContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
        font-family: 'Arial', 'Helvetica', sans-serif;
    `;
    document.body.appendChild(uiContainer);
    
    // Create speedometer (circular gauge)
    createSpeedometer(uiContainer);
    
    // Create nitro gauge
    createNitroGauge(uiContainer);
    
    // Create score display with animations
    createScoreDisplay(uiContainer);
    
    // Create coin counter
    createCoinCounter(uiContainer);
    
    // Create visual effects overlay
    createVisualEffectsOverlay(uiContainer);
    
    // Create minimap/radar
    createMinimap(uiContainer);
    
    modernUIInitialized = true;
    console.log('✅ Modern UI System initialized');
}

function createSpeedometer(container) {
    const speedoContainer = document.createElement('div');
    speedoContainer.id = 'speedometer';
    speedoContainer.style.cssText = `
        position: absolute;
        bottom: 30px;
        left: 30px;
        width: 200px;
        height: 200px;
    `;
    
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    canvas.style.cssText = `
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.5));
    `;
    speedoContainer.appendChild(canvas);
    
    const speedText = document.createElement('div');
    speedText.id = 'speedText';
    speedText.style.cssText = `
        position: absolute;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 32px;
        font-weight: bold;
        color: #00ffff;
        text-shadow: 0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.5);
        text-align: center;
    `;
    speedText.textContent = '0';
    speedoContainer.appendChild(speedText);
    
    const speedLabel = document.createElement('div');
    speedLabel.style.cssText = `
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 14px;
        color: #ffffff;
        text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
    `;
    speedLabel.textContent = 'KM/H';
    speedoContainer.appendChild(speedLabel);
    
    container.appendChild(speedoContainer);
    
    // Store canvas for drawing
    window.speedometerCanvas = canvas;
    window.speedometerCtx = canvas.getContext('2d');
}

function createNitroGauge(container) {
    const nitroContainer = document.createElement('div');
    nitroContainer.id = 'nitroGauge';
    nitroContainer.style.cssText = `
        position: absolute;
        bottom: 30px;
        right: 30px;
        width: 300px;
        height: 80px;
        background: linear-gradient(135deg, rgba(255, 68, 0, 0.2), rgba(255, 0, 0, 0.1));
        border: 2px solid rgba(255, 68, 0, 0.5);
        border-radius: 10px;
        backdrop-filter: blur(10px);
        box-shadow: 0 0 20px rgba(255, 68, 0, 0.3), inset 0 0 20px rgba(255, 68, 0, 0.1);
        padding: 10px;
    `;
    
    const nitroLabel = document.createElement('div');
    nitroLabel.style.cssText = `
        font-size: 14px;
        color: #ff4400;
        text-shadow: 0 0 5px rgba(255, 68, 0, 0.8);
        margin-bottom: 5px;
        font-weight: bold;
    `;
    nitroLabel.textContent = '⚡ NITRO';
    nitroContainer.appendChild(nitroLabel);
    
    const nitroBar = document.createElement('div');
    nitroBar.id = 'nitroBar';
    nitroBar.style.cssText = `
        width: 0%;
        height: 30px;
        background: linear-gradient(90deg, #ff4400, #ff8800, #ff4400);
        background-size: 200% 100%;
        border-radius: 5px;
        box-shadow: 0 0 15px rgba(255, 68, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3);
        transition: width 0.1s ease-out;
        position: relative;
        overflow: hidden;
    `;
    
    const nitroShine = document.createElement('div');
    nitroShine.style.cssText = `
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
        animation: nitroShine 2s infinite;
    `;
    nitroBar.appendChild(nitroShine);
    
    nitroContainer.appendChild(nitroBar);
    container.appendChild(nitroContainer);
    
    // Add CSS animation
    if (!document.getElementById('nitroShineStyle')) {
        const style = document.createElement('style');
        style.id = 'nitroShineStyle';
        style.textContent = `
            @keyframes nitroShine {
                0% { left: -100%; }
                100% { left: 100%; }
            }
        `;
        document.head.appendChild(style);
    }
}

function createScoreDisplay(container) {
    const scoreContainer = document.createElement('div');
    scoreContainer.id = 'scoreDisplay';
    scoreContainer.style.cssText = `
        position: absolute;
        top: 30px;
        left: 30px;
        font-size: 48px;
        font-weight: bold;
        color: #ffd700;
        text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.5);
        animation: scorePulse 2s ease-in-out infinite;
    `;
    scoreContainer.innerHTML = `
        <div style="font-size: 18px; color: #ffffff; margin-bottom: 5px;">SCORE</div>
        <div id="scoreValue">0</div>
    `;
    container.appendChild(scoreContainer);
    
    // Add CSS animation
    if (!document.getElementById('scorePulseStyle')) {
        const style = document.createElement('style');
        style.id = 'scorePulseStyle';
        style.textContent = `
            @keyframes scorePulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
        `;
        document.head.appendChild(style);
    }
}

function createCoinCounter(container) {
    const coinContainer = document.createElement('div');
    coinContainer.id = 'coinCounter';
    coinContainer.style.cssText = `
        position: absolute;
        top: 30px;
        right: 30px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 32px;
        font-weight: bold;
        color: #ffd700;
        text-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
    `;
    coinContainer.innerHTML = `
        <span style="font-size: 40px; animation: coinRotate 3s linear infinite;">🪙</span>
        <span id="coinValue">0</span>
    `;
    container.appendChild(coinContainer);
    
    // Add CSS animation
    if (!document.getElementById('coinRotateStyle')) {
        const style = document.createElement('style');
        style.id = 'coinRotateStyle';
        style.textContent = `
            @keyframes coinRotate {
                0% { transform: rotateY(0deg); }
                100% { transform: rotateY(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Visual Effects Overlay - Bloom, Glow, Particle Effects
function createVisualEffectsOverlay(container) {
    // Create bloom/glow overlay canvas
    const effectsCanvas = document.createElement('canvas');
    effectsCanvas.id = 'effectsCanvas';
    effectsCanvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 999;
        mix-blend-mode: screen;
        opacity: 0.6;
    `;
    container.appendChild(effectsCanvas);
    
    window.effectsCanvas = effectsCanvas;
    window.effectsCtx = effectsCanvas.getContext('2d');
    effectsCanvas.width = window.innerWidth;
    effectsCanvas.height = window.innerHeight;
    
    // Create particle system overlay
    createParticleOverlay(container);
    
    // Create speed lines effect
    createSpeedLines(container);
    
    // Create lens flare effect
    createLensFlare(container);
    
    // Create chromatic aberration effect
    createChromaticAberration(container);
}

function createParticleOverlay(container) {
    const particleContainer = document.createElement('div');
    particleContainer.id = 'particleOverlay';
    particleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 998;
        overflow: hidden;
    `;
    container.appendChild(particleContainer);
    
    // Create floating particles
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${2 + Math.random() * 3}px;
            height: ${2 + Math.random() * 3}px;
            background: radial-gradient(circle, rgba(0, 255, 255, 0.8), transparent);
            border-radius: 50%;
            box-shadow: 0 0 ${5 + Math.random() * 10}px rgba(0, 255, 255, 0.6);
            animation: floatParticle ${10 + Math.random() * 20}s linear infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 5}s;
        `;
        particleContainer.appendChild(particle);
    }
    
    // Add CSS animation
    if (!document.getElementById('floatParticleStyle')) {
        const style = document.createElement('style');
        style.id = 'floatParticleStyle';
        style.textContent = `
            @keyframes floatParticle {
                0% {
                    transform: translate(0, 0) scale(1);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translate(${-100 + Math.random() * 200}px, ${-100 + Math.random() * 200}px) scale(0);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function createSpeedLines(container) {
    const speedLinesContainer = document.createElement('div');
    speedLinesContainer.id = 'speedLines';
    speedLinesContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 997;
        overflow: hidden;
    `;
    container.appendChild(speedLinesContainer);
    
    // Create speed lines
    for (let i = 0; i < 20; i++) {
        const line = document.createElement('div');
        line.style.cssText = `
            position: absolute;
            width: 2px;
            height: ${50 + Math.random() * 100}px;
            background: linear-gradient(to bottom, 
                rgba(0, 255, 255, 0.8), 
                rgba(0, 255, 255, 0.4), 
                transparent);
            left: ${Math.random() * 100}%;
            top: -200px;
            animation: speedLine ${1 + Math.random() * 2}s linear infinite;
            animation-delay: ${Math.random() * 2}s;
            opacity: 0;
        `;
        speedLinesContainer.appendChild(line);
    }
    
    // Add CSS animation
    if (!document.getElementById('speedLineStyle')) {
        const style = document.createElement('style');
        style.id = 'speedLineStyle';
        style.textContent = `
            @keyframes speedLine {
                0% {
                    top: -200px;
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    top: 100%;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function createLensFlare(container) {
    const flareContainer = document.createElement('div');
    flareContainer.id = 'lensFlare';
    flareContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 996;
    `;
    container.appendChild(flareContainer);
    
    // Create lens flare elements
    for (let i = 0; i < 5; i++) {
        const flare = document.createElement('div');
        flare.style.cssText = `
            position: absolute;
            width: ${100 + i * 50}px;
            height: ${100 + i * 50}px;
            border-radius: 50%;
            background: radial-gradient(circle, 
                rgba(255, 255, 255, ${0.3 - i * 0.05}), 
                rgba(255, 255, 200, ${0.2 - i * 0.04}), 
                transparent);
            filter: blur(${10 + i * 5}px);
            animation: lensFlareMove ${10 + i * 2}s ease-in-out infinite;
            animation-delay: ${i * 2}s;
        `;
        flareContainer.appendChild(flare);
    }
    
    // Add CSS animation
    if (!document.getElementById('lensFlareStyle')) {
        const style = document.createElement('style');
        style.id = 'lensFlareStyle';
        style.textContent = `
            @keyframes lensFlareMove {
                0%, 100% {
                    transform: translate(20%, 20%) scale(1);
                    opacity: 0.3;
                }
                50% {
                    transform: translate(80%, 80%) scale(1.2);
                    opacity: 0.6;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function createChromaticAberration(container) {
    const chromaContainer = document.createElement('div');
    chromaContainer.id = 'chromaticAberration';
    chromaContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 995;
        mix-blend-mode: overlay;
        opacity: 0.1;
    `;
    
    // Create RGB separation effect
    const rgbLayers = ['red', 'green', 'blue'];
    rgbLayers.forEach((color, index) => {
        const layer = document.createElement('div');
        layer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${color === 'red' ? 'rgba(255, 0, 0, 0.1)' : 
                        color === 'green' ? 'rgba(0, 255, 0, 0.1)' : 
                        'rgba(0, 0, 255, 0.1)'};
            filter: blur(${1 + index}px);
            transform: translate(${(index - 1) * 2}px, ${(index - 1) * 2}px);
            animation: chromaShift ${3 + index}s ease-in-out infinite;
            animation-delay: ${index * 0.5}s;
        `;
        chromaContainer.appendChild(layer);
    });
    
    container.appendChild(chromaContainer);
    
    // Add CSS animation
    if (!document.getElementById('chromaShiftStyle')) {
        const style = document.createElement('style');
        style.id = 'chromaShiftStyle';
        style.textContent = `
            @keyframes chromaShift {
                0%, 100% {
                    transform: translate(${-2}px, ${-2}px);
                }
                50% {
                    transform: translate(${2}px, ${2}px);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function updateVisualEffects() {
    if (!window.effectsCanvas || !window.effectsCtx) return;
    
    const ctx = window.effectsCtx;
    const canvas = window.effectsCanvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw bloom/glow effects based on speed
    const speedFactor = Math.min(carSpeed / 0.8, 1.0);
    
    // Draw glow around edges when moving fast
    if (carSpeed > 0.3) {
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        gradient.addColorStop(0, `rgba(0, 255, 255, ${0.1 * speedFactor})`);
        gradient.addColorStop(0.5, `rgba(0, 255, 255, ${0.05 * speedFactor})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw nitro glow effect
    if (nitroActive) {
        const nitroGradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        nitroGradient.addColorStop(0, 'rgba(255, 68, 0, 0.3)');
        nitroGradient.addColorStop(0.3, 'rgba(255, 68, 0, 0.2)');
        nitroGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = nitroGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Update speed lines visibility
    const speedLines = document.getElementById('speedLines');
    if (speedLines) {
        speedLines.style.opacity = Math.min(speedFactor * 0.8, 0.8).toString();
    }
}

function createMinimap(container) {
    const minimapContainer = document.createElement('div');
    minimapContainer.id = 'minimap';
    minimapContainer.style.cssText = `
        position: absolute;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        height: 100px;
        background: rgba(0, 0, 0, 0.5);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        backdrop-filter: blur(10px);
        padding: 10px;
    `;
    
    const minimapCanvas = document.createElement('canvas');
    minimapCanvas.width = 200;
    minimapCanvas.height = 100;
    minimapCanvas.style.cssText = `
        width: 100%;
        height: 100%;
    `;
    minimapContainer.appendChild(minimapCanvas);
    
    container.appendChild(minimapContainer);
    
    window.minimapCanvas = minimapCanvas;
    window.minimapCtx = minimapCanvas.getContext('2d');
}

function updateModernUI() {
    if (!modernUIInitialized) return;
    
    // Update speedometer
    updateSpeedometer();
    
    // Update nitro gauge
    updateNitroGauge();
    
    // Update score
    const scoreValue = document.getElementById('scoreValue');
    if (scoreValue) {
        const currentScore = parseInt(scoreValue.textContent) || 0;
        const newScore = Math.floor(score);
        if (newScore !== currentScore) {
            scoreValue.textContent = newScore.toLocaleString();
            // Add pulse animation on score change
            scoreValue.style.animation = 'none';
            setTimeout(() => {
                scoreValue.style.animation = 'scorePulse 0.3s ease-out';
            }, 10);
        }
    }
    
    // Update coin counter
    const coinValue = document.getElementById('coinValue');
    if (coinValue) {
        coinValue.textContent = coinCount;
    }
    
    // Update speed text
    const speedText = document.getElementById('speedText');
    if (speedText) {
        const speedKmh = Math.floor(carSpeed * 1000);
        speedText.textContent = speedKmh;
    }
    
    // Update minimap
    updateMinimap();
}

function updateSpeedometer() {
    if (!window.speedometerCanvas || !window.speedometerCtx) return;
    
    const ctx = window.speedometerCtx;
    const canvas = window.speedometerCanvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw speedometer arc
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 0);
    ctx.stroke();
    
    // Draw speed indicator
    const speedPercentage = Math.min(carSpeed / 0.8, 1.0);
    const angle = Math.PI - (speedPercentage * Math.PI);
    const indicatorLength = radius - 10;
    
    ctx.strokeStyle = carSpeed > 0.6 ? '#ff0000' : (carSpeed > 0.3 ? '#ffff00' : '#00ff00');
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
        centerX + Math.cos(angle) * indicatorLength,
        centerY - Math.sin(angle) * indicatorLength
    );
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Draw speed marks
    for (let i = 0; i <= 10; i++) {
        const markAngle = Math.PI - (i / 10) * Math.PI;
        const markLength = i % 5 === 0 ? 15 : 8;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(
            centerX + Math.cos(markAngle) * (radius - markLength),
            centerY - Math.sin(markAngle) * (radius - markLength)
        );
        ctx.lineTo(
            centerX + Math.cos(markAngle) * radius,
            centerY - Math.sin(markAngle) * radius
        );
        ctx.stroke();
    }
}

function updateNitroGauge() {
    const nitroBar = document.getElementById('nitroBar');
    if (!nitroBar) return;
    
    // Simulate nitro level (you can adjust this based on actual nitro system)
    const nitroLevel = nitroActive ? 100 : Math.min(100, (score % 500) / 5);
    nitroBar.style.width = nitroLevel + '%';
    
    // Add pulsing effect when nitro is active
    if (nitroActive) {
        nitroBar.style.animation = 'nitroPulse 0.5s ease-in-out infinite';
        if (!document.getElementById('nitroPulseStyle')) {
            const style = document.createElement('style');
            style.id = 'nitroPulseStyle';
            style.textContent = `
                @keyframes nitroPulse {
                    0%, 100% { box-shadow: 0 0 15px rgba(255, 68, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3); }
                    50% { box-shadow: 0 0 30px rgba(255, 68, 0, 1), inset 0 0 20px rgba(255, 255, 255, 0.5); }
                }
            `;
            document.head.appendChild(style);
        }
    } else {
        nitroBar.style.animation = 'none';
    }
}

function updateVisualEffects() {
    if (!window.effectsCanvas || !window.effectsCtx) return;
    
    const ctx = window.effectsCtx;
    const canvas = window.effectsCanvas;
    
    // Resize canvas if needed
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw bloom/glow effects based on speed
    const speedFactor = Math.min(carSpeed / 0.8, 1.0);
    
    // Draw glow around edges when moving fast
    if (carSpeed > 0.3) {
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        gradient.addColorStop(0, `rgba(0, 255, 255, ${0.1 * speedFactor})`);
        gradient.addColorStop(0.5, `rgba(0, 255, 255, ${0.05 * speedFactor})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw nitro glow effect
    if (nitroActive) {
        const nitroGradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        nitroGradient.addColorStop(0, 'rgba(255, 68, 0, 0.3)');
        nitroGradient.addColorStop(0.3, 'rgba(255, 68, 0, 0.2)');
        nitroGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = nitroGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Update speed lines visibility
    const speedLines = document.getElementById('speedLines');
    if (speedLines) {
        speedLines.style.opacity = Math.min(speedFactor * 0.8, 0.8).toString();
    }
}

function updateMinimap() {
    if (!window.minimapCanvas || !window.minimapCtx) return;
    
    const ctx = window.minimapCtx;
    const canvas = window.minimapCanvas;
    const ROAD_WIDTH = 8; // Road width constant
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw road
    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.fillRect(0, canvas.height / 2 - 10, canvas.width, 20);
    
    // Draw player car
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#00ffff';
    ctx.fillRect(canvas.width / 2 - 5, canvas.height / 2 - 5, 10, 10);
    ctx.shadowBlur = 0;
    
    // Draw obstacles
    if (obstacles) {
        obstacles.forEach(obs => {
            if (!obs || !obs.position) return;
            const distance = obs.position.z - carZ;
            if (Math.abs(distance) < 50) {
                const x = canvas.width / 2 + (obs.position.x / ROAD_WIDTH) * (canvas.width / 2);
                const y = canvas.height / 2 - (distance / 50) * (canvas.height / 2);
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(x - 3, y - 3, 6, 6);
            }
        });
    }
    
    // Draw coins
    if (coins && coins.length > 0) {
        coins.forEach(coin => {
            if (!coin || !coin.position) return;
            const distance = coin.position.z - carZ;
            if (Math.abs(distance) < 50) {
                const x = canvas.width / 2 + (coin.position.x / ROAD_WIDTH) * (canvas.width / 2);
                const y = canvas.height / 2 - (distance / 50) * (canvas.height / 2);
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
}


function setupDayLighting() {
    // Gündüz modu - biraz daha karanlık atmosfer
    sunLight = new THREE.DirectionalLight(0xffffff, 0.9); // 1.2'den 0.9'a düşürüldü
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


function setupNightLighting() {
    // Gece modu - biraz daha karanlık atmosfer
    moonLight = new THREE.DirectionalLight(0xaabbff, 1.0); // 1.5'ten 1.0'a düşürüldü
    moonLight.position.set(0, 80, -40); 
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 500;
    moonLight.shadow.camera.left = -100;
    moonLight.shadow.camera.right = 100;
    moonLight.shadow.camera.top = 100;
    moonLight.shadow.camera.bottom = -100;
    
    
    moonLight.target.position.set(0, 0, 0);
    
    scene.add(moonLight);
    scene.add(moonLight.target);
    
    
    createMoon();
    
    console.log('Gece aydınlatması kuruldu - Ay ışığı pozisyonu:', moonLight.position);
}


function createMoon() {
    const moonGeometry = new THREE.SphereGeometry(20, 32, 32); 
    
    
    const moonMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xffffff, 
        emissive: 0x445566 
    });
    
    moonObject = new THREE.Mesh(moonGeometry, moonMaterial);
    
    moonObject.position.set(0, 80, -40); 
    moonObject.castShadow = false; 
    moonObject.receiveShadow = false;
    scene.add(moonObject);
    
    
    const glowGeometry = new THREE.SphereGeometry(25, 16, 16); 
    const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xaabbff, 
        transparent: true, 
        opacity: 0.3 
    });
    const moonGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    moonGlow.position.set(0, 0, 0); 
    moonObject.add(moonGlow); 
    
    
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


function updateMoonPosition() {
    if (!moonObject || !moonLight) return;
    
    
    moonLight.position.copy(moonObject.position);
    
    
    moonLight.target.position.set(0, 0, 0);
    moonLight.target.updateMatrixWorld();
    
    
    if (canMoveMoon) {
        console.log('Ay pozisyonu:', moonObject.position.x, moonObject.position.y, moonObject.position.z);
    }
}


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

    
    const dayOption = document.createElement('div');
    dayOption.style.background = !isNightMode ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
    dayOption.style.border = !isNightMode ? '3px solid #FFD700' : '2px solid #FFFFFF';
    dayOption.style.borderRadius = '15px';
    dayOption.style.padding = '30px';
    dayOption.style.textAlign = 'center';
    dayOption.style.cursor = 'pointer';
    dayOption.style.transition = 'all 0.3s ease';
    dayOption.style.minWidth = '200px';

    // Güneş ikonu: orijinal ☀️ karakteri, üstüne yüz overlay'i
    const dayIcon = document.createElement('div');
    dayIcon.style.fontSize = '60px';
    dayIcon.textContent = '☀️';
    dayIcon.style.marginBottom = '10px';
    dayIcon.style.transition = 'transform 0.4s ease';
    dayIcon.style.position = 'relative';

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

    
    const nightOption = document.createElement('div');
    nightOption.style.background = isNightMode ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
    nightOption.style.border = isNightMode ? '3px solid #FFD700' : '2px solid #FFFFFF';
    nightOption.style.borderRadius = '15px';
    nightOption.style.padding = '30px';
    nightOption.style.textAlign = 'center';
    nightOption.style.cursor = 'pointer';
    nightOption.style.transition = 'all 0.3s ease';
    nightOption.style.minWidth = '200px';

    // Ay ikonu: tamamen özel çizim (hilal + bulutlar)
    const nightIcon = document.createElement('div');
    nightIcon.style.position = 'relative';
    nightIcon.style.width = '80px';
    nightIcon.style.height = '80px';
    nightIcon.style.margin = '0 auto 10px auto';
    nightIcon.style.transition = 'transform 0.4s ease';

    // Dış sarı daire (ay gövdesi için temel)
    const moonBase = document.createElement('div');
    moonBase.style.position = 'absolute';
    moonBase.style.width = '80px';
    moonBase.style.height = '80px';
    moonBase.style.borderRadius = '50%';
    moonBase.style.background = 'radial-gradient(circle at 30% 25%, #ffe9a9 0, #ffd54f 35%, #ffb300 80%)';
    moonBase.style.boxShadow = '0 0 18px rgba(255, 213, 79, 0.7)';
    nightIcon.appendChild(moonBase);

    // İçteki mor arka plan ile hilal efekti
    const moonInnerCut = document.createElement('div');
    moonInnerCut.style.position = 'absolute';
    moonInnerCut.style.width = '72px';
    moonInnerCut.style.height = '72px';
    moonInnerCut.style.borderRadius = '50%';
    moonInnerCut.style.right = '2px';
    moonInnerCut.style.top = '4px';
    moonInnerCut.style.background = 'rgba(86, 79, 142, 1)'; // sayfanın mor tonuna yakın
    nightIcon.appendChild(moonInnerCut);

    // Hilali biraz eğmek için tüm ikonu döndür
    nightIcon.style.transform = 'rotate(-12deg)';

    // Güneş ve Ay için göz elemanları oluştur
    const createEyes = (parent, isSun) => {
        const eyeContainer = document.createElement('div');
        eyeContainer.style.position = 'absolute';
        eyeContainer.style.top = isSun ? '20px' : '30px';
        // Güneş için tam ortada, ay için hilalin iç tarafında
        eyeContainer.style.left = isSun ? '50%' : '60%';
        eyeContainer.style.transform = 'translateX(-50%)';
        eyeContainer.style.display = 'flex';
        eyeContainer.style.gap = isSun ? '6px' : '0px';
        
        let leftEye;
        let rightEye = null;

        if (isSun) {
            // Güneş: iki yuvarlak göz
            const makeEye = () => {
                const eye = document.createElement('div');
                eye.style.width = '8px';
                eye.style.height = '8px';
                eye.style.borderRadius = '50%';
                eye.style.background = '#000000';
                eye.style.boxShadow = '0 0 3px rgba(0,0,0,0.6)';
                eye.style.transformOrigin = '50% 50%';
                return eye;
            };

            leftEye = makeEye();
            rightEye = makeEye();
            leftEye.classList.add('sun-eye-left');
            rightEye.classList.add('sun-eye-right');
            eyeContainer.appendChild(leftEye);
            eyeContainer.appendChild(rightEye);
        } else {
            // Ay: sadece kapalı yay göz (kirpik yok)
            const closedEye = document.createElement('div');
            closedEye.style.position = 'relative';
            closedEye.style.width = '16px';
            closedEye.style.height = '8px';
            
            const eyeArc = document.createElement('div');
            eyeArc.style.position = 'absolute';
            eyeArc.style.width = '14px';
            eyeArc.style.height = '8px';
            eyeArc.style.borderBottom = '2px solid #000';
            eyeArc.style.borderRadius = '0 0 14px 14px';
            eyeArc.style.left = '0';
            eyeArc.style.top = '2px';

            closedEye.appendChild(eyeArc);

            closedEye.classList.add('moon-eye-single');
            eyeContainer.appendChild(closedEye);
            leftEye = eyeArc; // blink animasyonu için ana yay'ı hedef al
        }

        parent.appendChild(eyeContainer);

        return { leftEye, rightEye };
    };

    const sunEyes = createEyes(dayIcon, true);
    const moonEyes = createEyes(nightIcon, false);

    // Güneşe yanak ve gülücük ekle (emoji bozulmadan üzerine çizim)
    const makeCheek = (left) => {
        const cheek = document.createElement('div');
        cheek.style.position = 'absolute';
        cheek.style.width = '10px';
        cheek.style.height = '10px';
        cheek.style.borderRadius = '50%';
        cheek.style.background = '#ff8a80';
        cheek.style.opacity = '0.9';
        cheek.style.top = '40px';
        cheek.style[left ? 'left' : 'right'] = '18px';
        return cheek;
    };
    const leftCheek = makeCheek(true);
    const rightCheek = makeCheek(false);

    const mouth = document.createElement('div');
    mouth.style.position = 'absolute';
    mouth.style.width = '24px';
    mouth.style.height = '12px';
    mouth.style.borderBottom = '3px solid #5d4037';
    mouth.style.borderRadius = '0 0 20px 20px';
    mouth.style.left = '50%';
    mouth.style.top = '46px';
    mouth.style.transform = 'translateX(-50%)';

    dayIcon.appendChild(leftCheek);
    dayIcon.appendChild(rightCheek);
    dayIcon.appendChild(mouth);

    // Ay için daha doğal görünüm: küçük tek göz + hafif gülümseme
    const moonSmile = document.createElement('div');
    moonSmile.style.position = 'absolute';
    // Çeyrek daire şeklinde hafif gülümseme
    moonSmile.style.width = '16px';
    moonSmile.style.height = '16px';
    moonSmile.style.border = '0';
    moonSmile.style.borderBottom = '2px solid rgba(0,0,0,0.75)';
    moonSmile.style.borderRight = '2px solid rgba(0,0,0,0.75)';
    moonSmile.style.borderRadius = '0 0 18px 0';
    // Hilalin üst yüzüne daha iyi oturması için konum
    moonSmile.style.left = '58%';
    moonSmile.style.top = '42px';
    moonSmile.style.transform = 'translateX(-50%) rotate(5deg)';
    nightIcon.appendChild(moonSmile);

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

    // Göz kırpma animasyonu için global CSS ekle
    if (!document.getElementById('eyeBlinkStyles')) {
        const style = document.createElement('style');
        style.id = 'eyeBlinkStyles';
        style.textContent = `
            @keyframes eyeBlink {
                0%, 100% { transform: scaleY(1); }
                40%     { transform: scaleY(0.1); }
                60%     { transform: scaleY(1); }
            }
            .blink-once {
                animation: eyeBlink 0.4s ease-in-out 1;
            }
        `;
        document.head.appendChild(style);
    }

    function triggerSunBlink() {
        [sunEyes.leftEye, sunEyes.rightEye].forEach(eye => {
            if (!eye) return;
            eye.classList.remove('blink-once'); // reset
            void eye.offsetWidth; // reflow for restart
            eye.classList.add('blink-once');
        });
    }

    // Ay göz kırpma: verilen süre boyunca tek gözü tekrar tekrar kırpar
    function triggerMoonBlinkForDuration(durationMs = 2000) {
        const eye = moonEyes.leftEye;
        if (!eye) return Promise.resolve();

        return new Promise((resolve) => {
            const intervalMs = 350;
            let elapsed = 0;

            const intervalId = setInterval(() => {
                // Blink animasyonunu yeniden başlat
                eye.classList.remove('blink-once');
                void eye.offsetWidth;
                eye.classList.add('blink-once');

                elapsed += intervalMs;
                if (elapsed >= durationMs) {
                    clearInterval(intervalId);
                    resolve();
                }
            }, intervalMs);
        });
    }

    function updateSelection() {
        if (!isNightMode) {
            dayOption.style.background = 'rgba(255,255,255,0.3)';
            dayOption.style.border = '3px solid #FFD700';
            dayOption.style.transform = 'scale(1.1)';
            dayIcon.style.transform = 'scale(1.15) rotate(10deg)';
            nightOption.style.background = 'rgba(255,255,255,0.1)';
            nightOption.style.border = '2px solid #FFFFFF';
            nightOption.style.transform = 'scale(1)';
            nightIcon.style.transform = 'scale(1)';
        } else {
            nightOption.style.background = 'rgba(255,255,255,0.3)';
            nightOption.style.border = '3px solid #FFD700';
            nightOption.style.transform = 'scale(1.1)';
            nightIcon.style.transform = 'scale(1.15) rotate(-10deg)';
            dayOption.style.background = 'rgba(255,255,255,0.1)';
            dayOption.style.border = '2px solid #FFFFFF';
            dayOption.style.transform = 'scale(1)';
            dayIcon.style.transform = 'scale(1)';
        }
    }
    
    // Hover animasyonları:
    // - Güneş: önce kendi etrafında hızlı bir tur, sonra yavaş ve stabil dönüş
    // - Ay   : klasik sağa-sola sallanma (wobble) animasyonu
    if (!document.getElementById('sunMoonWobbleStyles')) {
        const style = document.createElement('style');
        style.id = 'sunMoonWobbleStyles';
        style.textContent = `
            @keyframes sunSpinOnce {
                0%   { transform: scale(1.2) rotate(0deg); }
                100% { transform: scale(1.2) rotate(360deg); }
            }
            @keyframes sunSlow {
                0%   { transform: scale(1.2) rotate(0deg); }
                100% { transform: scale(1.2) rotate(360deg); }
            }
            @keyframes moonWobble {
                /* Sabit hızla (linear) süzülürken çok hafif yön değişimi */
                0%   { transform: scale(1.2) translateY(-30px) rotate(-6deg); }
                25%  { transform: scale(1.2) translateY(-22.5px) rotate(-4deg); }
                50%  { transform: scale(1.2) translateY(-15px)  rotate(-2deg); }
                75%  { transform: scale(1.2) translateY(-7.5px) rotate(-1deg); }
                100% { transform: scale(1.2) translateY(0px)    rotate(0deg); }
            }
        `;
        document.head.appendChild(style);
    }

    dayOption.addEventListener('mouseenter', () => {
        dayOption.style.transform = 'scale(1.1)';
        // İlk önce biraz daha yavaş tek seferlik dönüş, ardından daha uzun ve yumuşak sürekli dönüş
        dayIcon.style.animation = 'sunSpinOnce 0.6s ease-out 0s 1, sunSlow 6s linear 0.6s infinite';
    });
    dayOption.addEventListener('mouseleave', () => {
        dayIcon.style.animation = '';
        // Seçili durumu korumak için sadece isNightMode'a göre resetle
        updateSelection();
        // Güneş seçili iken devam et'e basınca göz kırpsın
        if (!isNightMode) {
            triggerSunBlink();
        }
    });

    nightOption.addEventListener('mouseenter', () => {
        nightOption.style.transform = 'scale(1.1)';
        // Ay için yukarıdan aşağı sabit hızla, süzülür gibi inen animasyon
        nightIcon.style.animation = 'moonWobble 2.5s linear forwards';
    });
    nightOption.addEventListener('mouseleave', () => {
        nightIcon.style.animation = '';
        updateSelection();
    });

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

    continueButton.addEventListener('click', async () => {
        // Eğer gece modu seçiliyse, oyuna geçmeden önce ay 2 saniye göz kırpsın
        if (isNightMode) {
            continueButton.disabled = true;
            await triggerMoonBlinkForDuration(2000);
            continueButton.disabled = false;
        }

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
        selectedCar = AVAILABLE_CARS[selectedCarIndex];
        console.log(`🚗 ${selectedCar.name} modeli yükleniyor...`);
        
        const gltf = await new Promise((resolve, reject) => {
            loader.load(selectedCar.path, resolve, undefined, reject);
        });
        
        carModel = gltf.scene.clone();
        carModel.scale.set(selectedCar.scale, selectedCar.scale, selectedCar.scale);
        
        
        const baseRotation = CAR_ROTATIONS[selectedCar.name] || 0;
        carModel.rotation.y = baseRotation;
        console.log(`🔄 ${selectedCar.name} rotasyonu: ${(baseRotation * 180 / Math.PI).toFixed(0)}°`);
       
        
        
        carModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        
        playerCar = carModel.clone();
        playerCar.position.set(getXFromLane(carPosition), 0.2, carZ);
        scene.add(playerCar);
        
        
        const nitroTexture = new THREE.TextureLoader().load('graphics_three/assets/png-transparent-red-glow-red-glow-flash-light-thumbnail.png');
        const nitroMaterial = new THREE.SpriteMaterial({ 
            map: nitroTexture, 
            color: 0xffffff, 
            transparent: true, 
            opacity: 0.7, 
            depthWrite: false 
        });
        window.nitroSpriteLeft = new THREE.Sprite(nitroMaterial);
        window.nitroSpriteRight = new THREE.Sprite(nitroMaterial);

        nitroSpriteLeft.position.set(-0.19, 0.22, -1.07);
        nitroSpriteRight.position.set(0.19, 0.22, -1.07);
        nitroSpriteLeft.scale.set(0.5, 0.5, 1);
        nitroSpriteRight.scale.set(0.5, 0.5, 1);

        playerCar.add(nitroSpriteLeft);
        playerCar.add(nitroSpriteRight);

        nitroSpriteLeft.visible = false;
        nitroSpriteRight.visible = false;
        
        // Nitro glow efektleri - neon mavi
        nitroGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 })
        );
        nitroGlow.position.set(0, 0.22, -2.05);
        nitroGlow.userData.isNitroGlow = true;
        playerCar.add(nitroGlow);

        nitroLeft = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 })
        );
        nitroLeft.position.set(-0.18, 0.22, -1.05);
        nitroLeft.userData.isNitroGlow = true;
        playerCar.add(nitroLeft);

        nitroRight = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 })
        );
        nitroRight.position.set(0.18, 0.22, -1.05);
        nitroRight.userData.isNitroGlow = true;
        playerCar.add(nitroRight);

        
        // Gerçekçi far ışıkları - gerçek hayattaki gibi
        // Sıcak beyaz renk (0xffffcc) ve yumuşak geçişler
        const headlightColor = 0xffffcc; // Sıcak beyaz (gerçek araba farları gibi)
        const headlightIntensity = isNightMode ? 5.0 : 3.5;
        const headlightDistance = 35; // Daha uzun mesafe
        const headlightAngle = Math.PI / 5; // 36 derece - gerçekçi açı
        const headlightPenumbra = 0.7; // Yumuşak kenar geçişi
        
        const headlightLeft = new THREE.SpotLight(
            headlightColor, 
            headlightIntensity, 
            headlightDistance, 
            headlightAngle, 
            headlightPenumbra
        );
        headlightLeft.position.set(-0.3, 0.4, 1.0); // Biraz daha aşağı - yol yüzeyine odaklanır
        headlightLeft.castShadow = false;
        headlightLeft.decay = 2; // Mesafeye göre azalan intensity (gerçekçi)
        headlightLeft.userData.isHeadlight = true; // Collision detection'dan hariç
        
        const leftTarget = new THREE.Object3D();
        leftTarget.position.set(-0.8, -0.5, 30); // Yol yüzeyine odaklanmış
        leftTarget.userData.isLightTarget = true; // Collision detection'dan hariç
        playerCar.add(leftTarget);
        headlightLeft.target = leftTarget;
        
        playerCar.add(headlightLeft);

        const headlightRight = new THREE.SpotLight(
            headlightColor, 
            headlightIntensity, 
            headlightDistance, 
            headlightAngle, 
            headlightPenumbra
        );
        headlightRight.position.set(0.3, 0.4, 1.0);
        headlightRight.castShadow = false;
        headlightRight.decay = 2; // Mesafeye göre azalan intensity
        headlightRight.userData.isHeadlight = true; // Collision detection'dan hariç
        
        const rightTarget = new THREE.Object3D();
        rightTarget.position.set(0.8, -0.5, 30); // Yol yüzeyine odaklanmış
        rightTarget.userData.isLightTarget = true; // Collision detection'dan hariç
        playerCar.add(rightTarget);
        headlightRight.target = rightTarget;
        
        playerCar.add(headlightRight);

        carHeadlights.push(headlightLeft, headlightRight);
        
        // Arabanın önündeki alanı aydınlatmak için geniş açılı doldurma ışığı
        // Gerçek hayatta farların birleştiği alanı simüle eder
        const frontFillLight = new THREE.SpotLight(
            headlightColor, 
            isNightMode ? 3.0 : 2.2, 
            28, 
            Math.PI / 2.5, // Daha geniş açı
            0.6 // Yumuşak kenar
        );
        frontFillLight.position.set(0, 0.8, 1.1);
        frontFillLight.castShadow = false;
        frontFillLight.decay = 2;
        frontFillLight.userData.isHeadlight = true; // Collision detection'dan hariç
        
        const frontTarget = new THREE.Object3D();
        frontTarget.position.set(0, -0.8, 25); // Yol yüzeyine odaklanmış
        frontTarget.userData.isLightTarget = true; // Collision detection'dan hariç
        playerCar.add(frontTarget);
        frontFillLight.target = frontTarget;
        
        playerCar.add(frontFillLight);
        carHeadlights.push(frontFillLight);

        
        const headlightGlowLeft = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 16, 16),
            new THREE.MeshBasicMaterial({ 
                color: 0xffffcc, 
                transparent: true, 
                opacity: isNightMode ? 1.0 : 0.7
            })
        );
        headlightGlowLeft.position.set(-0.3, 0.5, 1.0);
        playerCar.add(headlightGlowLeft);

        const headlightGlowRight = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 16, 16),
            new THREE.MeshBasicMaterial({ 
                color: 0xffffcc, 
                transparent: true, 
                opacity: isNightMode ? 1.0 : 0.7
            })
        );
        headlightGlowRight.position.set(0.3, 0.5, 1.0);
        playerCar.add(headlightGlowRight);

        
        // FREN IŞIKLARI - Fren yapınca kırmızı ışık çıkar
        const brakeLightLeft = new THREE.PointLight(0xff0000, 0, 6);
        brakeLightLeft.position.set(-0.32, 0.28, -1.12);
        brakeLightLeft.userData.isBrakeLight = true;
        playerCar.add(brakeLightLeft);

        const brakeLightRight = new THREE.PointLight(0xff0000, 0, 6);
        brakeLightRight.position.set(0.32, 0.28, -1.12);
        brakeLightRight.userData.isBrakeLight = true;
        playerCar.add(brakeLightRight);

        // NITRO IŞIKLARI - Nitro aktifken neon mavi ışık çıkar (gerçek oyunlardaki gibi)
        const nitroLightLeft = new THREE.PointLight(0x00ffff, 0, 10); // Neon mavi
        nitroLightLeft.position.set(-0.18, 0.22, -1.05);
        nitroLightLeft.userData.isNitroLight = true;
        playerCar.add(nitroLightLeft);

        const nitroLightRight = new THREE.PointLight(0x00ffff, 0, 10); // Neon mavi
        nitroLightRight.position.set(0.18, 0.22, -1.05);
        nitroLightRight.userData.isNitroLight = true;
        playerCar.add(nitroLightRight);

        // Nitro volumetric efektleri - neon mavi ışık ışınları (daha uzun ve etkileyici)
        const nitroVolumetricLeft = new THREE.Mesh(
            new THREE.ConeGeometry(0.6, 12, 12, 1, true),
            new THREE.MeshBasicMaterial({
                color: 0x00ffff, // Neon mavi
                transparent: true,
                opacity: 0.5,
                side: THREE.FrontSide,
                depthWrite: false
            })
        );
        nitroVolumetricLeft.position.set(-0.18, 0.22, -1.05);
        nitroVolumetricLeft.rotation.x = -Math.PI / 2; // Arkaya doğru (dar ucu arabanın arkasında, geniş ucu arkaya)
        nitroVolumetricLeft.visible = false;
        nitroVolumetricLeft.userData.isNitroVolumetric = true;
        playerCar.add(nitroVolumetricLeft);

        const nitroVolumetricRight = new THREE.Mesh(
            new THREE.ConeGeometry(0.6, 12, 12, 1, true),
            new THREE.MeshBasicMaterial({
                color: 0x00ffff, // Neon mavi
                transparent: true,
                opacity: 0.5,
                side: THREE.FrontSide,
                depthWrite: false
            })
        );
        nitroVolumetricRight.position.set(0.18, 0.22, -1.05);
        nitroVolumetricRight.rotation.x = -Math.PI / 2; // Arkaya doğru (dar ucu arabanın arkasında, geniş ucu arkaya)
        nitroVolumetricRight.visible = false;
        nitroVolumetricRight.userData.isNitroVolumetric = true;
        playerCar.add(nitroVolumetricRight);
        
        // Merkez nitro volumetric efekt - daha büyük ve etkileyici
        const nitroVolumetricCenter = new THREE.Mesh(
            new THREE.ConeGeometry(0.8, 15, 12, 1, true),
            new THREE.MeshBasicMaterial({
                color: 0x00ffff, // Neon mavi
                transparent: true,
                opacity: 0.4,
                side: THREE.FrontSide,
                depthWrite: false
            })
        );
        nitroVolumetricCenter.position.set(0, 0.22, -1.8);
        nitroVolumetricCenter.rotation.x = -Math.PI / 2; // Arkaya doğru
        nitroVolumetricCenter.visible = false;
        nitroVolumetricCenter.userData.isNitroVolumetric = true;
        playerCar.add(nitroVolumetricCenter);

        nitroLights.push(nitroLightLeft, nitroLightRight, brakeLightLeft, brakeLightRight);
        
        // Nitro volumetric efektlerini sakla
        if (!window.nitroVolumetricMeshes) {
            window.nitroVolumetricMeshes = [];
        }
        window.nitroVolumetricMeshes.push(nitroVolumetricLeft, nitroVolumetricRight, nitroVolumetricCenter);

        nitroGlow.visible = false;
        nitroLeft.visible = false;
        nitroRight.visible = false;
        
        
        createSteeringWheel();
        
        // Create volumetric lights for car headlights
        createCarVolumetricLights();
        
        console.log(`✅ ${selectedCar.name} modeli başarıyla yüklendi!`);
        
    } catch (error) {
        console.warn('GLB model yüklenemedi, fallback küp kullanılıyor:', error);
        createFallbackCar();
    }
}


function createSteeringWheel() {
    const steeringGroup = new THREE.Group();
    
    
    const ringGeometry = new THREE.TorusGeometry(0.25, 0.03, 8, 16); 
    const ringMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 }); 
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    steeringGroup.add(ring);
    
    
    const spokeGeometry = new THREE.BoxGeometry(0.4, 0.02, 0.02); 
    const spokeMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    
    
    const horizontalSpoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
    steeringGroup.add(horizontalSpoke);
    
    
    const verticalSpoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
    verticalSpoke.rotation.z = Math.PI / 2;
    steeringGroup.add(verticalSpoke);
    
    
    const centerGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 8);
    const centerMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.rotation.x = Math.PI / 2;
    steeringGroup.add(center);
    
    
    const dashGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.3);
    const dashMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const dashboard = new THREE.Mesh(dashGeometry, dashMaterial);
    dashboard.position.set(0, -0.4, 0.2);
    steeringGroup.add(dashboard);
    
    
    steeringGroup.position.set(0.15, 0.2, 0.4); 
    steeringGroup.rotation.x = -Math.PI / 8; 
    steeringGroup.scale.set(1.0, 1.0, 1.0); 
    
    
    steeringGroup.visible = false;
    
    steeringWheel = steeringGroup;
    playerCar.add(steeringWheel);
}

function createFallbackCar() {
    
    const carGroup = new THREE.Group();
    
    
    const bodyGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.25;
    body.castShadow = true;
    carGroup.add(body);
    
    
    const roofGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.2);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x88ddff });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 0.7;
    roof.position.z = 0.2;
    roof.castShadow = true;
    carGroup.add(roof);
    
    
    const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    
    const wheels = [
        [-0.4, 0.1, 0.8],   
        [0.4, 0.1, 0.8],    
        [-0.4, 0.1, -0.8],  
        [0.4, 0.1, -0.8]    
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
  
  if (roadGroup) {
    scene.remove(roadGroup);
    
    roadGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
  
  roadGroup = new THREE.Group();
  const ROAD_WIDTH = 8;
  const ROAD_LENGTH = 300; 

  
  console.log('🛣️ Geometrik yol oluşturuluyor...');
  
  
  let roadMaterial;
  if (mapType.name === "Çöl") {
    
    roadMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xD2B48C, 
      roughness: 0.9   
    });
  } else {
    
    roadMaterial = new THREE.MeshLambertMaterial({ color: mapType.roadColor });
  }
  
  const roadGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, 4);

  
  
  for (let i = -100; i < 500; i++) {
    const roadSegment = new THREE.Mesh(roadGeometry, roadMaterial);
    roadSegment.rotation.x = -Math.PI / 2;
    roadSegment.position.set(0, 0.01, i * 4);
    roadSegment.receiveShadow = true;
    roadGroup.add(roadSegment);

    
    if (i % 2 === 0) {
      for (let lane = 1; lane < 4; lane++) {
        
        const lineGeo = new THREE.BoxGeometry(0.1, 1.5, 0.01);
        
        let lineMaterial;
        if (mapType.name === "Çöl") {
          
          lineMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); 
        } else {
          
          lineMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        }
        
        const line = new THREE.Mesh(lineGeo, lineMaterial);
        line.rotation.x = -Math.PI / 2; 
        line.position.set(getXFromLane(lane) - 1, 0.015, i * 4);
        roadGroup.add(line);
      }
    }
  }

  
  const grassGeo = new THREE.PlaneGeometry(100, 800); 
  let grassMat;
  
  if (mapType.name === "Çöl") {
    
    grassMat = new THREE.MeshLambertMaterial({ 
      color: 0xF4A460, 
      roughness: 0.8 
    });
  } else {
    
    grassMat = new THREE.MeshLambertMaterial({ color: mapType.grassColor });
  }

  const leftGrass = new THREE.Mesh(grassGeo, grassMat);
  leftGrass.rotation.x = -Math.PI / 2;
  leftGrass.position.set(-ROAD_WIDTH/2 - 40, -0.01, 200); 
  roadGroup.add(leftGrass);

  const rightGrass = new THREE.Mesh(grassGeo, grassMat);
  rightGrass.rotation.x = -Math.PI / 2;
  rightGrass.position.set(ROAD_WIDTH/2 + 40, -0.01, 200); 
  roadGroup.add(rightGrass);

  
  addMapDecorations(mapType);

  scene.add(roadGroup);
  
  
  let skyColor = mapType.skyColor;
  let fogColor = mapType.fogColor;
  
  if (isNightMode) {
    
    skyColor = 0x001122; 
    fogColor = 0x001122;
  }
  
  
  renderer.setClearColor(skyColor);
  
  
  scene.fog = new THREE.FogExp2(fogColor, isNightMode ? 0.015 : 0.01);
  
  
  createWeatherSystem(mapType);
  
  
  if (loadedStreetlightModel) {
    const lampSpacing = 75; 
    const lightCount = Math.floor(600 / lampSpacing); 

    for (let i = 0; i < lightCount; i++) {
      [-1, 1].forEach(side => {
        const lightObj = loadedStreetlightModel.clone();

        
        lightObj.position.set(
          side * (ROAD_WIDTH / 2 - 0.7),
          3.5,
          i * lampSpacing - 100 
        );
        lightObj.scale.set(1.1, 1.1, 1.1);
        if (side === -1) {
          lightObj.rotation.y = Math.PI;
        }

        
        lightObj.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        
        const pointLight = new THREE.PointLight(0xfff8e7, isNightMode ? 1.2 : 0.8, 15, 2);
        pointLight.position.set(0, 5.5, 0);
        pointLight.castShadow = false;
        lightObj.add(pointLight);

        roadGroup.add(lightObj);
      });
    }
  }
  
  console.log(`🛣️ ${mapType.name} haritası oluşturuldu - Yol uzunluğu: 600 birim`);
}function updateRoad() {
  if (!roadGroup) return;
  
  
  roadGroup.position.z = -carZ;
  
  
  const RESET_DISTANCE = 500; 
  
  if (carZ > RESET_DISTANCE) {
    
    const resetAmount = Math.floor(carZ / RESET_DISTANCE) * RESET_DISTANCE;
    
    carZ -= resetAmount;
    
    
    obstacles.forEach(obstacle => {
      obstacle.userData.z -= resetAmount;
      obstacle.position.z = obstacle.userData.z;
    });
    
    
    coins.forEach(coin => {
      coin.userData.z -= resetAmount;
      coin.position.z = coin.userData.z;
    });
    
    console.log(`🔄 Sonsuz yol sıfırlaması: ${resetAmount} birim geri alındı`);
    console.log(`🛣️ Yeni araba pozisyonu: ${carZ}`);
  }
  
  
  
}

function addMapDecorations(mapType) {
  switch(mapType.name) {
    case "Çöl":
      
      for (let i = 0; i < 30; i++) { 
        const height = 0.8 + Math.random() * 1.0;
        const cactusGeo = new THREE.CylinderGeometry(0.2, 0.3, height, 8);
        const cactusMat = new THREE.MeshLambertMaterial({ color: 0x2F4F2F });
        const cactus = new THREE.Mesh(cactusGeo, cactusMat);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (8 + Math.random() * 10);
        const z = Math.random() * 600 - 100; 
        
        cactus.position.set(x, height/2, z);
        cactus.castShadow = true;
        cactus.receiveShadow = true;
        roadGroup.add(cactus);
      }
      break;
      
      case "Karlı":
        
        
        
        for (let i = 0; i < 15; i++) {
          const snowRadius = 2 + Math.random() * 3;
          const snowGeo = new THREE.SphereGeometry(snowRadius, 12, 8);
          const snowMat = new THREE.MeshLambertMaterial({ 
            color: 0xF0F8FF, 
            transparent: true,
            opacity: 0.9
          });
          const snow = new THREE.Mesh(snowGeo, snowMat);
          
          const side = Math.random() > 0.5 ? 1 : -1;
          const x = side * (9 + Math.random() * 18);
          const z = Math.random() * 700 - 150;
          
          snow.position.set(x, snowRadius * 0.3, z); 
          snow.scale.set(1, 0.4 + Math.random() * 0.3, 1); 
          snow.receiveShadow = true;
          snow.castShadow = true;
          roadGroup.add(snow);
        }
        
        
        for (let i = 0; i < 25; i++) {
          const snowRadius = 0.8 + Math.random() * 1.2;
          const snowGeo = new THREE.SphereGeometry(snowRadius, 8, 6);
          const snowMat = new THREE.MeshLambertMaterial({ 
            color: 0xFAFAFA,
            transparent: true,
            opacity: 0.85
          });
          const snow = new THREE.Mesh(snowGeo, snowMat);
          
          const side = Math.random() > 0.5 ? 1 : -1;
          const x = side * (6 + Math.random() * 20);
          const z = Math.random() * 600 - 100;
          
          snow.position.set(x, snowRadius * 0.2, z);
          snow.scale.set(1, 0.3 + Math.random() * 0.4, 1);
          snow.receiveShadow = true;
          roadGroup.add(snow);
        }
        
        
        for (let i = 0; i < 50; i++) {
          const snowRadius = 0.3 + Math.random() * 0.5;
          const snowGeo = new THREE.SphereGeometry(snowRadius, 6, 4);
          const snowMat = new THREE.MeshLambertMaterial({ 
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.7
          });
          const snow = new THREE.Mesh(snowGeo, snowMat);
          
          const x = (Math.random() - 0.5) * 50; 
          const z = Math.random() * 650 - 120;
          
          snow.position.set(x, snowRadius * 0.1, z);
          snow.scale.y = 0.2 + Math.random() * 0.3; 
          snow.receiveShadow = true;
          roadGroup.add(snow);
        }
        
        
        for (let i = 0; i < 8; i++) {
          const rockRadius = 1.5 + Math.random() * 2;
          const rockGeo = new THREE.SphereGeometry(rockRadius, 8, 6);
          const rockMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
          const rock = new THREE.Mesh(rockGeo, rockMat);
          
          
          const snowCapGeo = new THREE.SphereGeometry(rockRadius * 1.1, 6, 4);
          const snowCapMat = new THREE.MeshLambertMaterial({ 
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.8
          });
          const snowCap = new THREE.Mesh(snowCapGeo, snowCapMat);
          
          const side = Math.random() > 0.5 ? 1 : -1;
          const x = side * (12 + Math.random() * 15);
          const z = Math.random() * 500 - 80;
          
          rock.position.set(x, rockRadius * 0.4, z);
          rock.scale.set(1, 0.6 + Math.random() * 0.4, 1);
          
          snowCap.position.set(x, rockRadius * 0.8, z);
          snowCap.scale.set(1, 0.3, 1);
          
          rock.receiveShadow = true;
          rock.castShadow = true;
          snowCap.receiveShadow = true;
          
          roadGroup.add(rock);
          roadGroup.add(snowCap);
        }
        
        
        for (let i = 0; i < 6; i++) {
          const iceGeo = new THREE.PlaneGeometry(3 + Math.random() * 4, 2 + Math.random() * 3);
          const iceMat = new THREE.MeshPhongMaterial({ 
            color: 0xE6F3FF,
            transparent: true,
            opacity: 0.6,
            shininess: 100
          });
          const ice = new THREE.Mesh(iceGeo, iceMat);
          
          const side = Math.random() > 0.5 ? 1 : -1;
          const x = side * (7 + Math.random() * 12);
          const z = Math.random() * 400 - 60;
          
          ice.rotation.x = -Math.PI / 2; 
          ice.position.set(x, 0.05, z);
          ice.receiveShadow = true;
          
          roadGroup.add(ice);
        }
        
        break;
      
    case "Bahar":
      
      for (let i = 0; i < 120; i++) { 
        const flowerSize = 0.3 + Math.random() * 0.2;
        const flowerGeo = new THREE.SphereGeometry(flowerSize, 8, 6);
        
        
        const flowerColors = [0xFF69B4, 0xFF1493, 0xFFFF00, 0xFFDAB9, 0xFF6347];
        const colorIndex = Math.floor(Math.random() * flowerColors.length);
        const flowerMat = new THREE.MeshLambertMaterial({ color: flowerColors[colorIndex] });
        
        const flower = new THREE.Mesh(flowerGeo, flowerMat);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (5 + Math.random() * 15);
        const z = Math.random() * 600 - 100; 
        
        flower.position.set(x, flowerSize, z);
        flower.castShadow = true;
        flower.receiveShadow = true;
        roadGroup.add(flower);
      }
      break;
      
    case "Normal":
      
      for (let i = 0; i < 25; i++) {
        const treeHeight = 2 + Math.random() * 2;
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, treeHeight, 8);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        
        const leavesGeo = new THREE.SphereGeometry(1, 8, 6);
        const leavesMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.y = treeHeight * 0.8;
        
        const tree = new THREE.Group();
        tree.add(trunk);
        tree.add(leaves);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (10 + Math.random() * 20);
        const z = Math.random() * 600 - 100;
        
        tree.position.set(x, treeHeight/2, z);
        tree.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        roadGroup.add(tree);
      }
      break;
  }
}


function createObstacles() {
    
    obstacles.forEach(obstacle => scene.remove(obstacle));
    obstacles = [];

    const obstacleCount = 20;
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
            npcSpeed: 0.05 + Math.random() * 0.1, 
            direction: 1, 
            laneChangeTimer: 0,
            laneChangeDelay: Math.random() * 500 + 500,
            targetLane: lane
        };

        obstacles.push(obstacle);
        scene.add(obstacle);
    }
}


function getXFromLane(lane) {
    
    
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
    Araba Y: ${playerCar ? Math.floor(playerCar.position.y * 100) / 100 : 'N/A'}<br>
    Zıplama: ${isJumping ? '🦘 Havada' : '🚗 Zeminde'}<br>
    Zıplama Cooldown: ${jumpCooldown ? '❌ Aktif' : '✅ Hazır'}<br>
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
        
        case 'Space':
            if (gameActive) {
                initiateJump();
                event.preventDefault(); 
            }
            break;
        
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyN': 
            nitroActive = true;
            break;
        
        case 'ControlLeft':
        case 'ControlRight':
        case 'KeyB': 
            brakeActive = true;
            break;
        
        case 'KeyC':
            switchCameraMode();
            break;
        
        case 'KeyM':
            if (isNightMode) {
                canMoveMoon = !canMoveMoon;
                showMoonControlNotification();
            }
            break;
        
        case 'KeyP':
            toggleMusic();
            showMusicNotification();
            break;
        
        case 'KeyL':
            
            const carSelectionMenu = document.getElementById('carSelectionMenu');
            if (carSelectionMenu && carSelectionMenu.style.display !== 'none') {
                event.preventDefault();
                toggleCarSelectionLights();
                console.log('💡 Araç seçim ekranında ışık kontrolü çalıştı');
            }
            break;
        
        case 'KeyI':
            
            const carSelectionMenuForPanel = document.getElementById('carSelectionMenu');
            if (carSelectionMenuForPanel && carSelectionMenuForPanel.style.display !== 'none') {
                event.preventDefault();
                toggleLightIntensityPanel();
                console.log('🎛️ Araç seçim ekranında ışık miktarı paneli çalıştı');
            }
            break;
             case 'KeyO':
            if (gameActive) {
                reduceObstacles();
            }
            break;
    }
    
    
    tryStartMusicOnFirstInteraction();
}



function reduceObstacles() {
    if (obstacles.length <= 3) { 
        console.log('🚫 Zaten 5 veya daha az engel var!');
        return;
    }
    
    
    obstacles.forEach(obstacle => {
        scene.remove(obstacle);
        if (obstacle.geometry) obstacle.geometry.dispose();
        if (obstacle.material) obstacle.material.dispose();
    });
    
    
    obstacles = [];
    
    
    for (let i = 0; i < 3; i++) {
        if (loadedObstacleModels.length > 0) {
            const modelIdx = Math.floor(Math.random() * loadedObstacleModels.length);
            const glbModel = loadedObstacleModels[modelIdx];
            
            if (glbModel) {
                const obstacle = glbModel.clone();
                const lane = Math.floor(Math.random() * 4);
                const z = carZ + 30 + (i * 15) + Math.random() * 10; 
                
                obstacle.position.set(getXFromLane(lane), 0.2, z);
                obstacle.castShadow = true;

                obstacle.userData = {
                    lane: lane,
                    z: z,
                    originalY: obstacle.position.y,
                    isGLBModel: true,
                    npcSpeed: 0.05 + Math.random() * 0.1,
                    direction: 1,
                    laneChangeTimer: 0,
                    laneChangeDelay: Math.random() * 500 + 500,
                    targetLane: lane
                };

                obstacles.push(obstacle);
                scene.add(obstacle);
            }
        }
    }
    
    console.log(`🎯 ENGEL SAYISI AZALTILDI! Yeni engel sayısı: ${obstacles.length}`);
    
    
    showObstacleReductionNotification();
}

function tryStartMusicOnFirstInteraction() {
    if (currentMusic && musicEnabled && currentMusic.paused) {
        currentMusic.play().catch(e => {
            if (e.name !== 'NotAllowedError') {
                console.warn('Müzik başlatma hatası:', e.message);
            }
        });
    }
}


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
        
        if (Math.abs(difference) < 0.01) {
            playerCar.position.x = carTargetX;
        } else {
            playerCar.position.x += difference * 0.15; 
        }
    }
}
function gameLoop() {
  if (!gameActive) {
    requestAnimationFrame(gameLoop);
    return;
  }

const isGangCar = [1,3, 4, 5, 6, 8, 12].includes(selectedCarIndex); 

// HIZ HESAPLAMA
const BASE_MAX_SPEED = isGangCar ? 0.7 : 0.5; 
const SPEED_INCREMENT = isGangCar ? 0.05 : 0.03; 
let targetSpeed = initialCarSpeed + Math.floor(coinCount / 15) * SPEED_INCREMENT;
targetSpeed = Math.min(targetSpeed, BASE_MAX_SPEED);
if (brakeActive) targetSpeed -= 0.1;

// NITRO HIZ ARTIŞI
if (nitroActive) {
    const nitroBoost = isGangCar ? 0.50 : 0.25; 
    targetSpeed += nitroBoost;
}

// MAKSIMUM HIZ SINIRI
const ABSOLUTE_MAX_SPEED = isGangCar ? 1.2 : 0.8;
targetSpeed = Math.min(targetSpeed, ABSOLUTE_MAX_SPEED);

// ✨ YUMUŞAK HIZ GEÇİŞİ SİSTEMİ
const ACCELERATION = 0.02; // Hızlanma katsayısı (düşük = daha yumuşak)
const DECELERATION = 0.03; // Yavaşlama katsayısı (düşük = daha yumuşak)

if (carSpeed < targetSpeed) {
    // Hızlanma
    carSpeed += ACCELERATION;
    carSpeed = Math.min(carSpeed, targetSpeed); // Hedef hızı aşmasın
} else if (carSpeed > targetSpeed) {
    // Yavaşlama  
    carSpeed -= DECELERATION;
    carSpeed = Math.max(carSpeed, targetSpeed); // Hedef hızın altına düşmesin
}

// Minimum hız kontrolü
carSpeed = Math.max(0.05, carSpeed);

// FREN IŞIKLARI - Fren yapınca kırmızı ışık çıkar
if (brakeActive) {
    nitroLights.forEach(light => {
        if (light.userData && light.userData.isBrakeLight) {
            light.intensity = 3.0 + Math.sin(Date.now() * 0.05) * 0.5; // Kırmızı fren ışığı
            light.color.setHex(0xff0000); // Kırmızı
        }
    });
} else {
    // Fren yapılmıyorsa fren ışıklarını kapat
    nitroLights.forEach(light => {
        if (light.userData && light.userData.isBrakeLight) {
            light.intensity = 0;
        }
    });
}

// NITRO EFEKTLERİ - Nitro aktifken neon mavi ışık çıkar (geliştirilmiş ve daha etkileyici)
if (nitroActive) {
    nitroSpriteLeft.visible = true;
    nitroSpriteRight.visible = true;
    
    // Nitro sprite'ları daha büyük ve parlak yap
    if (nitroSpriteLeft && nitroSpriteRight) {
        const scale = 0.7 + Math.sin(Date.now() * 0.05) * 0.2; // Pulse efekti
        nitroSpriteLeft.scale.set(scale, scale, 1);
        nitroSpriteRight.scale.set(scale, scale, 1);
    }
    
    if (nitroGlow && nitroLeft && nitroRight) {
        nitroGlow.visible = true;
        nitroLeft.visible = true;
        nitroRight.visible = true;
    }
    
    const time = Date.now() * 0.01;
    const pulseSpeed = 0.03; // Daha hızlı pulse
    
    // Nitro glow efektleri - daha parlak ve dinamik
    if (nitroLeft && nitroRight && nitroGlow) {
        const baseOpacity = 0.7;
        const pulseAmount = 0.3;
        nitroLeft.material.opacity = baseOpacity + Math.sin(time * 2) * pulseAmount;
        nitroRight.material.opacity = baseOpacity + Math.sin(time * 2 + 1) * pulseAmount;
        nitroGlow.material.opacity = baseOpacity + Math.sin(time * 3) * pulseAmount;
        
        // Renk değişimi - neon mavi tonları
        const colorIntensity = 0.8 + Math.sin(time * 1.5) * 0.2;
        nitroLeft.material.color.setRGB(0, colorIntensity, colorIntensity);
        nitroRight.material.color.setRGB(0, colorIntensity, colorIntensity);
        nitroGlow.material.color.setRGB(0, colorIntensity, colorIntensity);
    }
    
    // Nitro neon mavi ışık efektleri (gerçek oyunlardaki gibi) - daha güçlü
    nitroLights.forEach(light => {
        if (light.userData && light.userData.isNitroLight) {
            const intensity = 6.0 + Math.sin(Date.now() * 0.04) * 2.0; // Daha güçlü ve dinamik
            light.intensity = intensity;
            light.color.setHex(0x00ffff); // Neon mavi
            light.distance = 15; // Daha uzun mesafe
        }
    });
    
    // Nitro volumetric efektleri - neon mavi ışık ışınları (daha etkileyici)
    if (window.nitroVolumetricMeshes) {
        window.nitroVolumetricMeshes.forEach((mesh, index) => {
            mesh.visible = true;
            const baseOpacity = index === 2 ? 0.5 : 0.6; // Merkez daha şeffaf
            const pulseAmount = 0.3;
            mesh.material.opacity = baseOpacity + Math.sin(Date.now() * 0.025 + index) * pulseAmount;
            
            // Renk değişimi - parlak neon mavi
            const colorIntensity = 0.9 + Math.sin(Date.now() * 0.02 + index) * 0.1;
            mesh.material.color.setRGB(0, colorIntensity, colorIntensity);
        });
    }
    
    // Far ışık efektleri - nitro aktifken daha güçlü (renk değişmez, sadece intensity artar)
    carHeadlights.forEach((headlight, index) => {
        if (index < 2) {
            // Ana farlar - nitro aktifken daha güçlü
            headlight.intensity = (isNightMode ? 6.0 : 4.5) + Math.random() * 0.3; 
        } else {
            // Ön doldurma ışığı
            headlight.intensity = (isNightMode ? 3.5 : 2.8) + Math.random() * 0.2;
        }
        // Farlar sıcak beyaz kalır (nitro mavi değil)
        headlight.color.setHex(0xffffcc); 
    });
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
        if (light.userData && light.userData.isNitroLight) {
        light.intensity = 0;
        }
    });
    
    // Nitro volumetric efektlerini gizle
    if (window.nitroVolumetricMeshes) {
        window.nitroVolumetricMeshes.forEach(mesh => {
            mesh.visible = false;
        });
    }
    
    // Farları normale döndür - gerçekçi sıcak beyaz renk
    carHeadlights.forEach((headlight, index) => {
        if (index < 2) {
            // Ana farlar - önündeki alanı aydınlatmak için güçlü
            headlight.intensity = isNightMode ? 5.0 : 3.5; 
        } else {
            // Ön doldurma ışığı
            headlight.intensity = isNightMode ? 3.0 : 2.2;
        }
        // Gerçekçi sıcak beyaz renk (0xffffcc)
        headlight.color.setHex(0xffffcc); 
    });
}

// OTOMATİK HARİTA DEĞİŞİMİ
if (coinCount >= COINS_PER_MAP_CHANGE) {
    const success = changeMap();
    if (success) {
        console.log(`✅ Otomatik harita değişimi başarılı: ${MAP_TYPES[currentMapIndex].name}`);
    }
}

// MÜZİK SİSTEMİ
const selectedCarName = AVAILABLE_CARS[selectedCarIndex].name;

if ([3, 4, 5, 6].includes(selectedCarIndex) && currentMapIndex === 0) { 
    // Gang Cars müziği
    if (!currentMusic || !currentMusic.src.includes('Gang_Cars.mp3')) {
        console.log(`🎵 ${selectedCarName} normal haritada - Gang_Cars.mp3 başlatılıyor...`);
        
        if (currentMusic) {
            currentMusic.pause();
            currentMusic = null;
        }
        
        try {
            currentMusic = new Audio('graphics_three/musics/Gang_Cars.mp3');
            currentMusic.volume = MUSIC_VOLUME;
            currentMusic.loop = true;
            
            if (musicEnabled) {
                currentMusic.play().catch(e => {
                    console.warn(`${selectedCarName} müziği çalınamadı:`, e);
                });
            }
            
            console.log(`🚗 ${selectedCarName} özel müziği başladı!`);
        } catch (error) {
            console.error(`${selectedCarName} müziği yüklenemedi:`, error);
            playMapMusic(currentMapIndex);
        }
    }
} 
else if ((selectedCarIndex === 7 || selectedCarIndex === 9) && currentMapIndex === 0){ 
    // Finn müziği
    if (!currentMusic || !currentMusic.src.includes('Finn.mp3')) {
        console.log(`🎵 ${selectedCarName} - Finn.mp3 başlatılıyor...`);
        
        if (currentMusic) {
            currentMusic.pause();
            currentMusic = null;
        }
        
        try {
            currentMusic = new Audio('graphics_three/musics/Finn.mp3');
            currentMusic.volume = MUSIC_VOLUME;
            currentMusic.loop = true;
            
            if (musicEnabled) {
                currentMusic.play().catch(e => {
                    console.warn(`${selectedCarName} müziği çalınamadı:`, e);
                });
            }
            
            console.log(`🚗 ${selectedCarName} özel müziği başladı!`);
        } catch (error) {
            console.error(`${selectedCarName} müziği yüklenemedi:`, error);
            playMapMusic(currentMapIndex);
        }
    }
} 
else if (selectedCarIndex === 12) { 
    // BMW M3 GTR - TÜM haritalarda m3.mp3 çalsın
    if (!currentMusic || !currentMusic.src.includes('m3.mp3')) {
        console.log(`🎵 ${selectedCarName} - m3.mp3 başlatılıyor (TÜM HARITALARDA)...`);
        
        if (currentMusic) {
            currentMusic.pause();
            currentMusic = null;
        }
        
        try {
            currentMusic = new Audio('graphics_three/musics/m3.mp3');
            currentMusic.volume = MUSIC_VOLUME;
            currentMusic.loop = true;
            
            if (musicEnabled) {
                currentMusic.play().catch(e => {
                    console.warn(`${selectedCarName} müziği çalınamadı:`, e);
                });
            }
            
            console.log(`🚗 ${selectedCarName} özel müziği başladı (Harita: ${MAP_TYPES[currentMapIndex].name})!`);
        } catch (error) {
            console.error(`${selectedCarName} müziği yüklenemedi:`, error);
            playMapMusic(currentMapIndex);
        }
    } else {
        // BMW M3 müziği zaten çalıyor
        console.log(`🎵 ${selectedCarName} müziği devam ediyor (Harita: ${MAP_TYPES[currentMapIndex].name})`);
    }
} 
else {
    // Diğer araçlar için normal müzik
    if (currentMusic && (
        currentMusic.src.includes('Gang_Cars.mp3') || 
        currentMusic.src.includes('Finn.mp3') || 
        currentMusic.src.includes('m3.mp3')
    )) {
        console.log(`🎵 ${selectedCarName} özel müziği durduruluyor - normal müziğe dönülüyor...`);
        playMapMusic(currentMapIndex);
    }
}

// DEBUG BİLGİLERİ
displayDebugInfo();

// ARAÇ POZİSYONU VE HAREKET
carZ += carSpeed;
updateJump();

if (playerCar) {
    playerCar.position.z = carZ;
    updateCarPosition();

    // Araç sallanma efekti (sadece zıplamadayken değil)
    if (!isJumping) {
        const speedFactor = carSpeed * 3;
        playerCar.rotation.z = Math.sin(Date.now() * 0.01 * speedFactor) * 0.03;
        playerCar.rotation.x = Math.sin(Date.now() * 0.008 * speedFactor) * 0.01;
    }
}

// KAMERA GÜNCELLEMESİ
updateCamera();

// GECE MODU KONTROLLERI
if (isNightMode) {
    updateMoonPosition();
    createMoonStatusIndicator(); 
} else {
    const indicator = document.getElementById('moonStatus');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// SAHNE GÜNCELLEMELERİ
if (roadGroup) {
    roadGroup.position.z = -carZ;
}
updateRoad();
updateObstacles();
updateCoins();
updateWeatherEffects();

// UI GÜNCELLEMELERİ - Modern UI
updateModernUI();

// Visual Effects Updates
updateVisualEffects();

// Advanced Lighting Updates
updateDynamicLighting();

// RENDER
renderer.render(scene, camera);

// FAR DURUMU KONTROLÜ (5 saniyede bir)
if (Math.floor(Date.now() / 5000) !== Math.floor((Date.now() - 16) / 5000)) {
    checkHeadlightStatus();
}

// SONRAKI FRAME
  // Update UI
  if (modernUIInitialized) {
      updateModernUI();
  }
  
requestAnimationFrame(gameLoop);
}


function checkHeadlightStatus() {
  if (carHeadlights && carHeadlights.length > 0) {
    carHeadlights.forEach((light, index) => {
      if (light) {
        console.log(`💡 Far ${index + 1}: Parlaklık=${light.intensity}, Mesafe=${light.distance}, Aktif=${light.visible}`);
      }
    });
  } else {
    console.warn('⚠️ Araba farları bulunamadı! Far sistemi çalışmıyor olabilir.');
  }
}

function updateObstacles() {
  for (const obstacle of obstacles) {
    
    if (obstacle.userData.isGLBModel) {
      
      if (obstacle.userData.npcSpeed < 0.01) {
        obstacle.userData.npcSpeed = 0.08 + Math.random() * 0.08;
      }
      
      obstacle.userData.z += obstacle.userData.npcSpeed * obstacle.userData.direction;

      
      obstacle.userData.laneChangeTimer++;
      if (obstacle.userData.laneChangeTimer >= obstacle.userData.laneChangeDelay) {
        const currentLane = obstacle.userData.lane;
        let candidateLanes = [];
        if (currentLane > 0) candidateLanes.push(currentLane - 1);
        if (currentLane < 3) candidateLanes.push(currentLane + 1);

        
        const newLane = candidateLanes[Math.floor(Math.random() * candidateLanes.length)];
        obstacle.userData.targetLane = newLane;

        obstacle.userData.laneChangeTimer = 0;
        obstacle.userData.laneChangeDelay = Math.random() * 500 + 350;
      }

      
      const targetX = getXFromLane(obstacle.userData.targetLane);
      if (Math.abs(obstacle.position.x - targetX) > 0.1) {
        obstacle.position.x += (targetX - obstacle.position.x) * 0.017;
      } else {
        obstacle.position.x = targetX;
        obstacle.userData.lane = obstacle.userData.targetLane;
      }

      
      obstacle.position.y = obstacle.userData.originalY +
        Math.sin(Date.now() * 0.003 + obstacle.userData.z) * 0.02;
    } else {
      
      obstacle.position.y = obstacle.userData.originalY +
        Math.sin(Date.now() * 0.005 + obstacle.userData.z) * 0.1;
      obstacle.rotation.y += 0.02;
    }

    
    obstacle.position.z = obstacle.userData.z;

    
    
    const carIsHighEnough = isCarInAir() && playerCar && playerCar.position.y > obstacle.position.y + 1.5;
    
    if (!carIsHighEnough) {
        // checkCollision fonksiyonunu kullan - daha tutarlı
        if (checkCollision(obstacle, playerCar)) {
            console.log('💥 ÇARPIŞMA! Araba havada değil veya yeterince yüksek değil');
            gameOver();
            return;
        }
    } else {
        
        console.log('🦘 ENGEL AŞILDI! Araba havada, çarpışma kontrol edilmiyor');
        
        
         if (!obstacle.userData.jumpBonusGiven) {
            obstacle.userData.jumpBonusGiven = true;
            console.log('✅ Engel aşıldı - bonus puan yok');
        }
    }

    
    
     if (obstacle.userData.z < carZ - 30) {
      
      const newModelIndex = Math.floor(Math.random() * loadedObstacleModels.length);
      const newModel = loadedObstacleModels[newModelIndex];
      
      if (newModel) {
        
        scene.remove(obstacle);
        
        
        const newObstacle = newModel.clone();
        
        
        obstacle.userData.z = carZ + 80 + Math.random() * 40;
        let newLane = Math.floor(Math.random() * 4);
        obstacle.userData.lane = newLane;
        obstacle.userData.targetLane = newLane;
        
        
        newObstacle.position.set(getXFromLane(newLane), 0.2, obstacle.userData.z);
        newObstacle.castShadow = true;
        
        
        newObstacle.userData = {
          ...obstacle.userData,
          originalY: 0.2,
          npcSpeed: 0.07 + Math.random() * 0.08,
          direction: 1,
          laneChangeDelay: Math.random() * 300 + 150,
          jumpBonusGiven: false,
          isGLBModel: true
        };
        
        
        const obstacleIndex = obstacles.indexOf(obstacle);
        if (obstacleIndex !== -1) {
          obstacles[obstacleIndex] = newObstacle;
        }
        
        
        scene.add(newObstacle);
        
        console.log(`🔄 Engel yenilendi: ${OBSTACLE_GLB_MODELS[newModelIndex].split('/').pop()} - Lane ${newLane}, Z=${Math.floor(obstacle.userData.z)}`);
        return; 
      }
    }
    
    
    if (obstacle.userData.z > carZ + 120) {
      
      const newModelIndex = Math.floor(Math.random() * loadedObstacleModels.length);
      const newModel = loadedObstacleModels[newModelIndex];
      
      if (newModel) {
        
        scene.remove(obstacle);
        
        
        const newObstacle = newModel.clone();
        
        
        obstacle.userData.z = carZ - 20 + Math.random() * 15;
        let newLane = Math.floor(Math.random() * 4);
        obstacle.userData.lane = newLane;
        obstacle.userData.targetLane = newLane;
        
        
        newObstacle.position.set(getXFromLane(newLane), 0.2, obstacle.userData.z);
        newObstacle.castShadow = true;
        
        
        newObstacle.userData = {
          ...obstacle.userData,
          originalY: 0.2,
          jumpBonusGiven: false,
          isGLBModel: true
        };
        
        
        const obstacleIndex = obstacles.indexOf(obstacle);
        if (obstacleIndex !== -1) {
          obstacles[obstacleIndex] = newObstacle;
        }
        
        
        scene.add(newObstacle);
        
        console.log(`⬅️ Engel geri konumlandırıldı: ${OBSTACLE_GLB_MODELS[newModelIndex].split('/').pop()} - Lane ${newLane}, Z=${Math.floor(obstacle.userData.z)}`);
        return; 
      }
    }
}
}


function gameOver() {
 gameActive = false;
 
 
 console.log('🎮 Oyun bitti - Varsayılan müziğe dönülüyor...');
 playMapMusic(0); 
 
 
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
   <p style="font-size: 14px; color: #FFB6C1;">🎵 Varsayılan müzik çalıyor...</p>
 `;
 gameOverDiv.style.display = 'block';
}

function restartGame() {
 
 const gameOverDiv = document.getElementById('gameOver');
 if (gameOverDiv) {
   gameOverDiv.style.display = 'none';
 }
 
 
 console.log('🔄 Oyun yeniden başlıyor - Varsayılan müziğe dönülüyor...');
 playMapMusic(0); 
 
 
 gameActive = true;
 score = 0;
 coinCount = 0; 
 carPosition = 1;
 carTargetX = getXFromLane(carPosition);
 carZ = 0;
 carSpeed = initialCarSpeed;
 currentMapIndex = 0;
 currentCameraMode = CAMERA_MODES.THIRD_PERSON; 
 canMoveMoon = false; 
 
 
 if (playerCar) {
   playerCar.position.set(getXFromLane(carPosition), 0.2, carZ);
   playerCar.rotation.set(0, 0, 0);
 }
 
 
 if (steeringWheel) {
   steeringWheel.visible = false;
 }
 
 
 obstacles.forEach(obstacle => {
   scene.remove(obstacle);
 });
 createObstacles();
 
 
 coins.forEach(coin => {
   scene.remove(coin);
 });
 createCoins();
 
 
 createRoad(MAP_TYPES[0]);
 nitroLights.forEach(light => {
    light.intensity = 0;
});
 
 
 if (isNightMode && moonObject) {
   moonObject.position.set(0, 80, -40); 
   updateMoonPosition();
 }
 
 console.log('✅ Oyun yeniden başlatıldı! İlk harita ve müzik yüklendi.');
}

function onWindowResize() {
 camera.aspect = window.innerWidth / window.innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(window.innerWidth, window.innerHeight);
}


function createGameUI() {
    // Create modern UI instead of old UI
    createModernUI();
    
    // Create controls panel (smaller, modern design)
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'controlsPanel';
    controlsContainer.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 250px;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        padding: 15px;
        font-size: 12px;
        color: #ffffff;
        max-width: 300px;
        pointer-events: auto;
        z-index: 1001;
    `;
    controlsContainer.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; color: #00ffff;">🎮 KONTROLLER</div>
        <div style="margin-bottom: 5px;">← → : Şerit Değiştir</div>
        <div style="margin-bottom: 5px;"><strong>SPACE: ZIPLAMA 🦘</strong></div>
        <div style="margin-bottom: 5px;">Shift/N: Nitro | Ctrl/B: Fren</div>
        <div style="margin-bottom: 5px;">C: Kamera | P: Müzik</div>
        ${isNightMode ? '<div style="margin-top: 10px; color: #FFD700;">🌙 GECE MODU: M + WASD</div>' : ''}
    `;
    document.body.appendChild(controlsContainer);
}


function createCanvas() {
    // Canvas zaten varsa onu kullan
    let canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
 canvas.id = 'gameCanvas';
        document.body.appendChild(canvas);
    }
 canvas.style.display = 'block';
 canvas.style.margin = '0 auto';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
 return canvas;
}






async function loadCarModelsForSelection() {
    // Eğer modeller zaten yüklenmişse tekrar yükleme
    if (loadedCarModels && loadedCarModels.length === AVAILABLE_CARS.length && loadedCarModels.every(m => m !== null)) {
        console.log('✅ Modeller zaten yüklü, tekrar yükleme atlanıyor');
        return;
    }
    
    console.log('🚗 Araç seçim ekranı için modeller yükleniyor...');
    console.log('📂 Yüklenecek araç sayısı:', AVAILABLE_CARS.length);
    
    // Sadece boşsa veya eksikse başlat
    if (!loadedCarModels || loadedCarModels.length === 0) {
        loadedCarModels = new Array(AVAILABLE_CARS.length).fill(null);
    } else if (loadedCarModels.length < AVAILABLE_CARS.length) {
        // Diziyi genişlet
        while (loadedCarModels.length < AVAILABLE_CARS.length) {
            loadedCarModels.push(null);
        }
    }
    
    for (let i = 0; i < AVAILABLE_CARS.length; i++) {
        // Eğer bu model zaten yüklenmişse atla
        if (loadedCarModels[i] && loadedCarModels[i] !== null) {
            console.log(`⏭️ ${AVAILABLE_CARS[i].name} zaten yüklü, atlanıyor`);
            continue;
        }
        try {
            const car = AVAILABLE_CARS[i];
            console.log(`🔄 ${i + 1}/${AVAILABLE_CARS.length} - ${car.name} yükleniyor...`);
            console.log(`📍 Dosya yolu: ${car.path}`);
            
            const gltf = await new Promise((resolve, reject) => {
                loader.load(
                    car.path,
                    (gltf) => {
                        console.log(`✅ ${car.name} başarıyla yüklendi`);
                        resolve(gltf);
                    },
                    (progress) => {
                        console.log(`📈 ${car.name} yükleme ilerlemesi:`, Math.round((progress.loaded / progress.total) * 100) + '%');
                    },
                    (error) => {
                        console.error(`❌ ${car.name} yükleme hatası:`, error);
                        reject(error);
                    }
                );
            });
            
            const carModel = gltf.scene.clone();
            carModel.scale.set(car.scale, car.scale, car.scale);

            // Showcase (araç seçim ekranı) için bazı büyük modelleri ekstra küçült
            // 4. araba (index 3: Wingo), 7. araba (index 6: Snot Rod), 12. araba (index 11: The King)
            if (i === 3 || i === 6 || i === 11) {
                carModel.scale.multiplyScalar(0.5); // sadece seçim ekranında yarı boyuta indir
            }
            carModel.position.set(0, 0, 0);
            
            
            carModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            // Diziyi gerekirse genişlet ve doğru index'e ekle
            if (loadedCarModels.length <= i) {
                while (loadedCarModels.length <= i) {
                    loadedCarModels.push(null);
                }
            }
            loadedCarModels[i] = carModel;
            console.log(`✅ ${car.name} modeli hazırlandı ve index ${i}'ye eklendi (Toplam: ${loadedCarModels.filter(m => m !== null).length}/${AVAILABLE_CARS.length})`);
            
        } catch (error) {
            console.warn(`⚠️ ${AVAILABLE_CARS[i].name} modeli yüklenemedi:`, error);
            // Diziyi gerekirse genişlet
            if (loadedCarModels.length <= i) {
                while (loadedCarModels.length <= i) {
            loadedCarModels.push(null);
                }
            }
            loadedCarModels[i] = null;
        }
    }
    
    console.log('🎯 Araç yükleme tamamlandı. Başarılı:', loadedCarModels.filter(m => m !== null).length);
    console.log('❌ Başarısız:', loadedCarModels.filter(m => m === null).length);
    console.log('📊 Yüklenmiş modeller dizisi:', loadedCarModels.map((m, i) => m ? `${i}:${AVAILABLE_CARS[i].name}` : `${i}:null`).join(', '));
    
    // Başlık ikonlarını güncelle (eğer menü açıksa)
    const leftIcon = document.getElementById('leftTitleCarIcon');
    const rightIcon = document.getElementById('rightTitleCarIcon');
    if (leftIcon && rightIcon) {
        console.log('🔄 Başlık ikonları güncelleniyor...');
        leftIcon.innerHTML = '';
        rightIcon.innerHTML = '';
        if (loadedCarModels[0]) {
            createMiniature3DCarIcon(leftIcon, 0); // Lightning McQueen
            createMiniature3DCarIcon(rightIcon, 0); // Lightning McQueen
        }
    }
}

// Minyatür 3D araba ikonu oluştur (başlık için)
function createMiniature3DCarIcon(container, carIndex) {
    if (!container || carIndex < 0 || carIndex >= AVAILABLE_CARS.length) {
        // Fallback: boş bırak
        container.innerHTML = '';
        return;
    }
    
    // Canvas oluştur
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 360;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);
    
    // Three.js scene oluştur
    const scene = new THREE.Scene();
    scene.background = null; // Şeffaf arka plan
    
    // Kamera
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true, 
        antialias: true 
    });
    renderer.setSize(360, 360);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Işıklandırma
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0x00ffff, 0.5);
    pointLight.position.set(-3, 3, 3);
    scene.add(pointLight);
    
    // Araba modelini yükle ve ekle
    const car = AVAILABLE_CARS[carIndex];
    let carModel = null;
    let animationId = null;
    
    // Model yükleme fonksiyonu
    const loadAndSetupModel = (model) => {
        if (!model) return;
        
        carModel = model.clone();
        // Başlıktaki minyatür Şimşek McQueen ikonlarını biraz büyüttük
        carModel.scale.set(car.scale * 0.35, car.scale * 0.35, car.scale * 0.35); // Minyatür boyut (biraz daha büyük)
        carModel.position.set(0, 0, 0);
        carModel.rotation.y = Math.PI / 4; // 45 derece döndür
        
        carModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(carModel);
        
        // Animasyon döngüsünü başlat
        let rotationAngle = 0;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            
            if (!carModel || !carModel.parent) {
                cancelAnimationFrame(animationId);
                return;
            }
            
            rotationAngle += 0.01;
            carModel.rotation.y = Math.PI / 4 + Math.sin(rotationAngle) * 0.2; // Hafif sallanma
            carModel.position.y = Math.sin(rotationAngle * 2) * 0.1; // Yukarı-aşağı hareket
            
            // Kamerayı döndür (360 derece dönüş)
            camera.position.x = Math.cos(rotationAngle * 0.3) * 5;
            camera.position.z = Math.sin(rotationAngle * 0.3) * 5;
            camera.lookAt(0, 0, 0);
            
            renderer.render(scene, camera);
        };
        
        animate();
    };
    
    // Önce yüklenmiş modelleri kontrol et
    if (loadedCarModels && loadedCarModels[carIndex] && loadedCarModels[carIndex] !== null) {
        loadAndSetupModel(loadedCarModels[carIndex]);
    } else {
        // Model henüz yüklenmemişse yükle
        if (!loader) {
            console.warn('⚠️ GLTFLoader bulunamadı');
            container.innerHTML = '';
            return;
        }
        
        loader.load(
            car.path,
            (gltf) => {
                loadAndSetupModel(gltf.scene);
            },
            undefined,
            (error) => {
                console.warn(`⚠️ Minyatür araba ikonu yüklenemedi:`, error);
                // Fallback: boş bırak
                container.innerHTML = '';
            }
        );
    }
}

// Create animated background for car selection menu
function createAnimatedBackground(container) {
    const bgContainer = document.createElement('div');
    bgContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
    `;
    
    // Create floating particles
    for (let i = 0; i < 150; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${2 + Math.random() * 5}px;
            height: ${2 + Math.random() * 5}px;
            background: radial-gradient(circle, rgba(0, 255, 255, 0.9), transparent);
            border-radius: 50%;
            box-shadow: 0 0 ${8 + Math.random() * 15}px rgba(0, 255, 255, 0.8);
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: floatParticleBG ${15 + Math.random() * 25}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        bgContainer.appendChild(particle);
    }
    
    container.appendChild(bgContainer);
    
    // Add CSS animation if not exists
    if (!document.getElementById('floatParticleBGStyle')) {
        const style = document.createElement('style');
        style.id = 'floatParticleBGStyle';
        style.textContent = `
            @keyframes floatParticleBG {
                0% {
                    transform: translate(0, 0) scale(1);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translate(${-300 + Math.random() * 600}px, ${-300 + Math.random() * 600}px) scale(0);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Create scanning line effect
function createScanningLine(container) {
    const scanLine = document.createElement('div');
    scanLine.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: linear-gradient(90deg, 
            transparent, 
            rgba(0, 255, 255, 0.8), 
            rgba(255, 255, 255, 1), 
            rgba(0, 255, 255, 0.8), 
            transparent);
        box-shadow: 0 0 20px rgba(0, 255, 255, 1);
        animation: scanLineMove 4s linear infinite;
        z-index: 100;
        pointer-events: none;
    `;
    container.appendChild(scanLine);
    
    // Add CSS animation
    if (!document.getElementById('scanLineMoveStyle')) {
        const style = document.createElement('style');
        style.id = 'scanLineMoveStyle';
        style.textContent = `
            @keyframes scanLineMove {
                0% {
                    top: 0;
                    opacity: 1;
                }
                50% {
                    opacity: 0.8;
                }
                100% {
                    top: 100%;
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Advanced menu lighting effects
function createAdvancedMenuLighting(container) {
    // Create multiple light sources for dynamic lighting
    const lightSources = [];
    
    for (let i = 0; i < 6; i++) {
        const light = document.createElement('div');
        light.style.cssText = `
            position: absolute;
            width: ${200 + Math.random() * 300}px;
            height: ${200 + Math.random() * 300}px;
            border-radius: 50%;
            background: radial-gradient(circle, 
                rgba(${Math.random() > 0.5 ? '0, 255, 255' : '255, 215, 0'}, ${0.3 + Math.random() * 0.3}) 0%,
                transparent 70%);
            pointer-events: none;
            z-index: 0;
            filter: blur(${40 + Math.random() * 40}px);
            animation: lightFloat${i} ${8 + Math.random() * 12}s ease-in-out infinite;
        `;
        
        const angle = (i / 6) * Math.PI * 2;
        const radius = 30 + Math.random() * 20;
        light.style.left = `${50 + Math.cos(angle) * radius}%`;
        light.style.top = `${50 + Math.sin(angle) * radius}%`;
        
        container.appendChild(light);
        lightSources.push(light);
        
        // Add animation
        if (!document.getElementById(`lightFloat${i}Style`)) {
            const style = document.createElement('style');
            style.id = `lightFloat${i}Style`;
            style.textContent = `
                @keyframes lightFloat${i} {
                    0%, 100% {
                        transform: translate(${Math.cos(angle) * 50}px, ${Math.sin(angle) * 50}px) scale(1);
                        opacity: ${0.3 + Math.random() * 0.4};
                    }
                    50% {
                        transform: translate(${-Math.cos(angle) * 50}px, ${-Math.sin(angle) * 50}px) scale(${1.2 + Math.random() * 0.3});
                        opacity: ${0.5 + Math.random() * 0.3};
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Holographic grid effect
function createHolographicGrid(container) {
    const grid = document.createElement('canvas');
    grid.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
        opacity: 0.15;
    `;
    grid.width = window.innerWidth;
    grid.height = window.innerHeight;
    
    const ctx = grid.getContext('2d');
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    
    function drawGrid() {
        ctx.clearRect(0, 0, grid.width, grid.height);
        
        const time = Date.now() * 0.0005;
        const offsetX = Math.sin(time) * 20;
        const offsetY = Math.cos(time) * 20;
        
        // Vertical lines
        for (let x = -gridSize; x < grid.width + gridSize; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x + offsetX, 0);
            ctx.lineTo(x + offsetX, grid.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = -gridSize; y < grid.height + gridSize; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y + offsetY);
            ctx.lineTo(grid.width, y + offsetY);
            ctx.stroke();
        }
        
        requestAnimationFrame(drawGrid);
    }
    
    drawGrid();
    container.appendChild(grid);
}

// Floating particles effect
function createFloatingParticles(container) {
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const size = 2 + Math.random() * 4;
        const duration = 10 + Math.random() * 20;
        const delay = Math.random() * 5;
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, 
                rgba(${Math.random() > 0.5 ? '0, 255, 255' : '255, 215, 0'}, 0.8) 0%,
                transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 2;
            box-shadow: 0 0 ${size * 2}px rgba(${Math.random() > 0.5 ? '0, 255, 255' : '255, 215, 0'}, 0.6);
            left: ${Math.random() * 100}%;
            animation: floatParticle${i} ${duration}s linear infinite ${delay}s;
        `;
        
        container.appendChild(particle);
        
        // Add animation
        if (!document.getElementById(`floatParticle${i}Style`)) {
            const style = document.createElement('style');
            style.id = `floatParticle${i}Style`;
            const startY = Math.random() * 100;
            const endY = -20;
            const startX = Math.random() * 100;
            const endX = startX + (Math.random() - 0.5) * 30;
            
            style.textContent = `
                @keyframes floatParticle${i} {
                    0% {
                        transform: translate(${startX}vw, ${startY}vh) scale(0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        transform: translate(${endX}vw, ${endY}vh) scale(1);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Araç değişiminde özel efekt
function createCarChangeEffect() {
    if (!carSelectionScene) return;
    
    // Parçacık efekti için geçici ışık patlaması
    const flashLight = new THREE.PointLight(0x00FFFF, 5, 10);
    flashLight.position.set(0, 1, 0);
    carSelectionScene.add(flashLight);
    
    // Işık patlaması animasyonu
    let flashIntensity = 5;
    const flashAnimation = () => {
        flashIntensity -= 0.3;
        if (flashIntensity > 0) {
            flashLight.intensity = flashIntensity;
            requestAnimationFrame(flashAnimation);
        } else {
            carSelectionScene.remove(flashLight);
            flashLight.dispose();
        }
    };
    flashAnimation();
}

// Mouse cursor trail efekti - lastik dumanı gibi duman efekti
function createMouseTrailEffect(container) {
    // Eğer zaten varsa tekrar oluşturma
    if (document.getElementById('mouseTrailContainer')) {
        return;
    }
    
    // Duman parçacıkları için container
    const trailContainer = document.createElement('div');
    trailContainer.id = 'mouseTrailContainer';
    trailContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
    `;
    document.body.appendChild(trailContainer);
    
    // Duman parçacıkları dizisi
    const smokeParticles = [];
    const maxParticles = 15; // Duman yoğunluğu
    let mouseX = 0, mouseY = 0;
    let lastMouseX = 0, lastMouseY = 0;
    
    // Duman parçacığı oluştur
    function createSmokeParticle(x, y) {
        const particle = document.createElement('div');
        const size = 8 + Math.random() * 12; // Rastgele boyut
        const duration = 800 + Math.random() * 400; // Duman süresi
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: radial-gradient(circle, 
                rgba(150, 150, 150, 0.6) 0%,
                rgba(100, 100, 100, 0.4) 30%,
                rgba(50, 50, 50, 0.2) 60%,
                transparent 100%);
            pointer-events: none;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
            opacity: 0.8;
            filter: blur(3px);
        `;
        
        trailContainer.appendChild(particle);
        
        // Duman animasyonu - yukarı doğru yayılma
        const startX = x + (Math.random() - 0.5) * 20;
        const startY = y + (Math.random() - 0.5) * 20;
        const endX = startX + (Math.random() - 0.5) * 60;
        const endY = startY - 40 - Math.random() * 60;
        const endSize = size * (1.5 + Math.random() * 1.5);
        
        let progress = 0;
        const animate = () => {
            progress += 0.02;
            if (progress < 1) {
                const currentX = startX + (endX - startX) * progress;
                const currentY = startY + (endY - startY) * progress;
                const currentSize = size + (endSize - size) * progress;
                const currentOpacity = 0.8 * (1 - progress);
                
                particle.style.left = currentX + 'px';
                particle.style.top = currentY + 'px';
                particle.style.width = currentSize + 'px';
                particle.style.height = currentSize + 'px';
                particle.style.opacity = currentOpacity;
                particle.style.filter = `blur(${3 + progress * 5}px)`;
                
                requestAnimationFrame(animate);
            } else {
                // Particle'ı sadece hala container'ın child'ı ise kaldır
                if (particle && particle.parentNode === trailContainer) {
                    trailContainer.removeChild(particle);
                }
                const index = smokeParticles.indexOf(particle);
                if (index > -1) smokeParticles.splice(index, 1);
            }
        };
        animate();
        
        smokeParticles.push(particle);
    }
    
    // Mouse hareketini takip et ve duman oluştur
    let lastParticleTime = 0;
    const handleMouseMove = (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Her 30ms'de bir yeni duman parçacığı oluştur (smooth duman)
        const now = Date.now();
        if (now - lastParticleTime > 30) {
            createSmokeParticle(mouseX, mouseY);
            lastParticleTime = now;
        }
        
        // Hızlandığında daha fazla duman
        const speed = Math.sqrt(
            Math.pow(mouseX - lastMouseX, 2) + 
            Math.pow(mouseY - lastMouseY, 2)
        );
        if (speed > 5 && now - lastParticleTime > 15) {
            createSmokeParticle(mouseX, mouseY);
            lastParticleTime = now;
        }
        
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    };
    
    const handleMouseLeave = () => {
        // Menü dışına çıkınca dumanı temizle
        setTimeout(() => {
            smokeParticles.forEach(particle => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            });
            smokeParticles.length = 0;
        }, 1000);
    };
    
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    // Panellere hover efekti ekle
    setTimeout(() => {
        const panels = container.querySelectorAll('[id="carInfoPanel"], [id="performancePanel"]');
        panels.forEach(panel => {
            panel.addEventListener('mouseenter', () => {
                panel.style.transform = 'scale(1.02)';
                panel.style.transition = 'transform 0.3s ease';
            });
            panel.addEventListener('mouseleave', () => {
                panel.style.transform = 'scale(1)';
            });
        });
    }, 100);
}

// Energy waves effect
function createEnergyWaves(container) {
    const waveCount = 3;
    
    for (let i = 0; i < waveCount; i++) {
        const wave = document.createElement('div');
        wave.style.cssText = `
            position: absolute;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg,
                transparent 0%,
                rgba(0, 255, 255, 0.5) 20%,
                rgba(0, 255, 255, 0.8) 50%,
                rgba(0, 255, 255, 0.5) 80%,
                transparent 100%);
            pointer-events: none;
            z-index: 3;
            filter: blur(1px);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.6);
            animation: energyWave${i} ${4 + i * 2}s linear infinite ${i * 1.5}s;
        `;
        
        container.appendChild(wave);
        
        // Add animation
        if (!document.getElementById(`energyWave${i}Style`)) {
            const style = document.createElement('style');
            style.id = `energyWave${i}Style`;
            style.textContent = `
                @keyframes energyWave${i} {
                    0% {
                        top: ${20 + i * 25}%;
                        opacity: 0;
                        transform: scaleX(0);
                    }
                    10% {
                        opacity: 1;
                    }
                    50% {
                        transform: scaleX(1);
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        top: ${80 - i * 25}%;
                        opacity: 0;
                        transform: scaleX(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

function createCarSelectionMenu() {
    
    const menuContainer = document.createElement('div');
    menuContainer.id = 'carSelectionMenu';
    menuContainer.style.position = 'fixed';
    menuContainer.style.top = '0';
    menuContainer.style.left = '0';
    menuContainer.style.width = '100%';
    menuContainer.style.height = '100%';
    menuContainer.style.background = `
        radial-gradient(ellipse at top, rgba(0, 255, 255, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at bottom, rgba(255, 215, 0, 0.1) 0%, transparent 50%),
        linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 30%, #16213e 60%, #0f3460 100%)
    `;
    menuContainer.style.display = 'flex';
    menuContainer.style.flexDirection = 'column';
    menuContainer.style.alignItems = 'center';
    menuContainer.style.justifyContent = 'center';
    menuContainer.style.zIndex = '2000';
    menuContainer.style.fontFamily = '"Segoe UI", "Arial", sans-serif';
    menuContainer.style.overflow = 'hidden';
    menuContainer.style.position = 'relative';
    
    // Add animated background particles
    createAnimatedBackground(menuContainer);
    
    // Add scanning line effect
    createScanningLine(menuContainer);
    
    // Add advanced lighting effects
    createAdvancedMenuLighting(menuContainer);
    
    // Add holographic grid effect
    createHolographicGrid(menuContainer);
    
    // Add floating particles
    createFloatingParticles(menuContainer);
    
    // Add energy waves
    createEnergyWaves(menuContainer);
    
    // Add advanced lighting effects
    createAdvancedMenuLighting(menuContainer);
    
    // Add holographic grid effect
    createHolographicGrid(menuContainer);
    
    // Add floating particles
    createFloatingParticles(menuContainer);
    
    // Add energy waves
    createEnergyWaves(menuContainer);
    
    // Modern title with enhanced glow effect and animated car icons
    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = `
        position: relative;
        margin-bottom: 10px;
        margin-top: 20px;
        text-align: center;
        z-index: 1;
    `;
    
    // Sol araba ikonu - 3D minyatür model
    const leftCarIcon = document.createElement('div');
    leftCarIcon.id = 'leftTitleCarIcon';
    leftCarIcon.style.cssText = `
        display: inline-block;
        width: 180px;
        height: 180px;
        margin-right: -30px;
        margin-left: -50px;
        margin-top: -100px;
        transform: translateX(-30px);
        animation: carIconFloat 3s ease-in-out infinite, carIconPulse 2s ease-in-out infinite;
        cursor: pointer;
        transition: transform 0.3s ease, filter 0.3s ease;
        filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.6));
        position: relative;
        vertical-align: middle;
    `;
    
    // Sağ araba ikonu - 3D minyatür model
    const rightCarIcon = document.createElement('div');
    rightCarIcon.id = 'rightTitleCarIcon';
    rightCarIcon.style.cssText = `
        display: inline-block;
        width: 180px;
        height: 180px;
        margin-left: -10px;
        margin-top: -100px;
        transform: translateX(-50px);
        animation: carIconFloat 3s ease-in-out infinite 1.5s, carIconPulse 2s ease-in-out infinite 1s;
        cursor: pointer;
        transition: transform 0.3s ease, filter 0.3s ease;
        filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.6));
        position: relative;
        vertical-align: middle;
    `;
    
    // Car icon hover efektleri
    leftCarIcon.addEventListener('mouseenter', () => {
        leftCarIcon.style.transform = 'translateX(-40px) scale(1.3) rotate(15deg)';
        leftCarIcon.style.filter = 'drop-shadow(0 0 20px rgba(0, 255, 255, 1))';
    });
    leftCarIcon.addEventListener('mouseleave', () => {
        leftCarIcon.style.transform = 'translateX(-40px) scale(1) rotate(0deg)';
        leftCarIcon.style.filter = 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.6))';
    });
    
    rightCarIcon.addEventListener('mouseenter', () => {
        rightCarIcon.style.transform = 'translateX(-40px) scale(1.3) rotate(-15deg)';
        rightCarIcon.style.filter = 'drop-shadow(0 0 20px rgba(0, 255, 255, 1))';
    });
    rightCarIcon.addEventListener('mouseleave', () => {
        rightCarIcon.style.transform = 'translateX(-40px) scale(1) rotate(0deg)';
        rightCarIcon.style.filter = 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.6))';
    });
    
    // 3D minyatür araba modellerini yükle ve render et (modeller yüklendikten sonra)
    // Placeholder'ı boş bırak
    leftCarIcon.innerHTML = '';
    rightCarIcon.innerHTML = '';
    
    // Modeller yüklendikten sonra 3D modelleri göster
    const updateTitleIcons = async () => {
        console.log('🎨 Başlık ikonları güncelleniyor...');
        
        // Önce modellerin yüklenip yüklenmediğini kontrol et
        if (!loadedCarModels || loadedCarModels.length === 0) {
            // Modeller yüklenmemişse yükle
            console.log('📦 Başlık ikonları için modeller yükleniyor...');
            try {
                await loadCarModelsForSelection();
                console.log('✅ Modeller yüklendi, ikonlar oluşturuluyor...');
            } catch (error) {
                console.error('❌ Modeller yüklenirken hata:', error);
                return; // Hata durumunda çık
            }
        }
        
        // Lightning McQueen (index 0) yüklenene kadar bekle (maksimum 15 saniye)
        let attempts = 0;
        while ((!loadedCarModels || loadedCarModels.length === 0 || !loadedCarModels[0]) && attempts < 150) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // Lightning McQueen'i her iki tarafta da göster
        if (loadedCarModels && loadedCarModels.length > 0 && loadedCarModels[0]) {
            console.log('🎨 Lightning McQueen minyatür ikonları oluşturuluyor...');
            console.log('📊 Lightning McQueen modeli:', loadedCarModels[0] ? 'Yüklü' : 'Yok');
            
            // Placeholder'ı temizle
            leftCarIcon.innerHTML = '';
            rightCarIcon.innerHTML = '';
            
            // Lightning McQueen'i her iki tarafta da oluştur
            try {
                createMiniature3DCarIcon(leftCarIcon, 0); // Lightning McQueen
                createMiniature3DCarIcon(rightCarIcon, 0); // Lightning McQueen
                console.log('✅ Lightning McQueen ikonları oluşturuldu');
            } catch (error) {
                console.error('❌ Lightning McQueen ikon oluşturulurken hata:', error);
            }
        } else {
            console.warn('⚠️ Lightning McQueen modeli yüklenemedi');
            console.warn('📊 loadedCarModels durumu:', {
                length: loadedCarModels ? loadedCarModels.length : 0,
                lightningMcQueen: loadedCarModels && loadedCarModels[0] ? 'Yüklü' : 'Yok'
            });
        }
    };
    
    // Hemen başlat ve modeller yüklendikten sonra tekrar dene
    updateTitleIcons();
    
    // Modeller yüklendikten sonra tekrar güncelle (güvenlik için)
    setTimeout(() => {
        if (leftCarIcon.innerHTML === '' || rightCarIcon.innerHTML === '') {
            console.log('🔄 İkonlar hala boş, tekrar güncelleniyor...');
            updateTitleIcons();
        }
    }, 2000);
    
    const title = document.createElement('h1');
    title.style.cssText = `
        color: #FFFFFF;
        font-size: 72px;
        font-weight: 900;
        text-shadow: 
            0 0 10px rgba(0, 255, 255, 0.8),
            0 0 20px rgba(0, 255, 255, 0.6),
            0 0 30px rgba(0, 255, 255, 0.4),
            0 0 40px rgba(0, 255, 255, 0.2),
            0 0 60px rgba(0, 255, 255, 0.1);
        margin: 0;
        letter-spacing: 5px;
        animation: titleGlowEnhanced 2s ease-in-out infinite alternate;
        position: relative;
        display: inline-block;
    `;
    title.textContent = 'CAR SELECTION';
    
    // Add CSS animation for enhanced title glow
    if (!document.getElementById('titleGlowEnhancedStyle')) {
        const style = document.createElement('style');
        style.id = 'titleGlowEnhancedStyle';
        style.textContent = `
            @keyframes titleGlowEnhanced {
                0% {
                    text-shadow: 
                        0 0 10px rgba(0, 255, 255, 0.8),
                        0 0 20px rgba(0, 255, 255, 0.6),
                        0 0 30px rgba(0, 255, 255, 0.4);
                    transform: scale(1);
                }
                100% {
                    text-shadow: 
                        0 0 20px rgba(0, 255, 255, 1),
                        0 0 40px rgba(0, 255, 255, 0.8),
                        0 0 60px rgba(0, 255, 255, 0.6),
                        0 0 80px rgba(0, 255, 255, 0.4),
                        0 0 100px rgba(0, 255, 255, 0.2);
                    transform: scale(1.02);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    titleContainer.appendChild(leftCarIcon);
    titleContainer.appendChild(title);
    titleContainer.appendChild(rightCarIcon);
    menuContainer.appendChild(titleContainer);
    
    // Car icon float animation - gelişmiş animasyon
    if (!document.getElementById('carIconFloatStyle')) {
        const style = document.createElement('style');
        style.id = 'carIconFloatStyle';
        style.textContent = `
            @keyframes carIconFloat {
                0%, 100% {
                    transform: translateY(0px) rotate(0deg) scale(1);
                    filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.6));
                }
                25% {
                    transform: translateY(-20px) rotate(15deg) scale(1.1);
                    filter: drop-shadow(0 0 25px rgba(0, 255, 255, 1));
                }
                50% {
                    transform: translateY(-15px) rotate(0deg) scale(1.15);
                    filter: drop-shadow(0 0 30px rgba(0, 255, 255, 1));
                }
                75% {
                    transform: translateY(-25px) rotate(-15deg) scale(1.1);
                    filter: drop-shadow(0 0 25px rgba(0, 255, 255, 1));
                }
            }
            @keyframes carIconPulse {
                0%, 100% {
                    transform: scale(1);
                    filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.6));
                }
                50% {
                    transform: scale(1.15);
                    filter: drop-shadow(0 0 25px rgba(0, 255, 255, 1));
                }
            }
            @keyframes flagWave {
                0%, 100% {
                    transform: rotate(0deg);
                }
                10% {
                    transform: rotate(-8deg);
                }
                20% {
                    transform: rotate(8deg);
                }
                30% {
                    transform: rotate(-6deg);
                }
                40% {
                    transform: rotate(6deg);
                }
                50% {
                    transform: rotate(-4deg);
                }
                60% {
                    transform: rotate(4deg);
                }
                70% {
                    transform: rotate(-2deg);
                }
                80% {
                    transform: rotate(2deg);
                }
                90% {
                    transform: rotate(0deg);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    
    // Mouse cursor trail efekti ekle
    createMouseTrailEffect(menuContainer);

    
    const sceneContainer = document.createElement('div');
    sceneContainer.style.position = 'relative';
    sceneContainer.style.width = '1200px'; 
    sceneContainer.style.height = '800px'; 
    sceneContainer.style.border = '4px solid transparent';
    sceneContainer.style.borderRadius = '20px';
    sceneContainer.style.background = 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460)';
    sceneContainer.style.boxShadow = `
        0 0 40px rgba(0, 255, 255, 0.6),
        0 0 80px rgba(0, 255, 255, 0.3),
        inset 0 0 40px rgba(0, 255, 255, 0.1)
    `;
    sceneContainer.style.marginBottom = '30px';
    sceneContainer.style.overflow = 'hidden';
    sceneContainer.style.position = 'relative';
    
    // Add animated border
    sceneContainer.style.backgroundImage = `
        linear-gradient(45deg, #1a1a2e, #16213e, #0f3460),
        linear-gradient(45deg, rgba(0, 255, 255, 0.3), rgba(255, 215, 0, 0.3))
    `;
    sceneContainer.style.backgroundClip = 'padding-box, border-box';
    sceneContainer.style.backgroundOrigin = 'padding-box, border-box';
    
    // Add pulsing border animation
    sceneContainer.style.animation = 'borderPulse 3s ease-in-out infinite';
    
    if (!document.getElementById('borderPulseStyle')) {
        const style = document.createElement('style');
        style.id = 'borderPulseStyle';
        style.textContent = `
            @keyframes borderPulse {
                0%, 100% {
                    box-shadow: 
                        0 0 40px rgba(0, 255, 255, 0.6),
                        0 0 80px rgba(0, 255, 255, 0.3),
                        inset 0 0 40px rgba(0, 255, 255, 0.1);
                }
                50% {
                    box-shadow: 
                        0 0 60px rgba(0, 255, 255, 0.9),
                        0 0 120px rgba(0, 255, 255, 0.5),
                        inset 0 0 60px rgba(0, 255, 255, 0.2);
                }
            }
        `;
        document.head.appendChild(style);
    }

    
    carSelectionCanvas = document.createElement('canvas');
    carSelectionCanvas.style.width = '100%';
    carSelectionCanvas.style.height = '100%';
    carSelectionCanvas.style.borderRadius = '12px';
    sceneContainer.appendChild(carSelectionCanvas);

    
    const carInfoPanel = document.createElement('div');
    carInfoPanel.id = 'carInfoPanel';
    carInfoPanel.style.cssText = `
        position: absolute;
        top: 20px;
        left: 20px;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(26, 26, 46, 0.95));
        backdrop-filter: blur(15px);
        color: #FFFFFF;
        padding: 25px;
        border-radius: 15px;
        font-size: 16px;
        min-width: 280px;
        border: 2px solid rgba(0, 255, 255, 0.6);
        box-shadow: 
            0 0 30px rgba(0, 255, 255, 0.5),
            inset 0 0 30px rgba(0, 255, 255, 0.1);
        z-index: 10;
        animation: panelGlow 3s ease-in-out infinite;
    `;
    
    // Add panel glow animation if not exists
    if (!document.getElementById('panelGlowStyle')) {
        const style = document.createElement('style');
        style.id = 'panelGlowStyle';
        style.textContent = `
            @keyframes panelGlow {
                0%, 100% {
                    box-shadow: 
                        0 0 30px rgba(0, 255, 255, 0.5),
                        inset 0 0 30px rgba(0, 255, 255, 0.1);
                    border-color: rgba(0, 255, 255, 0.6);
                }
                50% {
                    box-shadow: 
                        0 0 50px rgba(0, 255, 255, 0.8),
                        inset 0 0 50px rgba(0, 255, 255, 0.2);
                    border-color: rgba(0, 255, 255, 1);
                }
            }
            @keyframes titlePulse {
                0%, 100% {
                    transform: scale(1);
                    text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
                }
                50% {
                    transform: scale(1.02);
                    text-shadow: 0 0 30px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 215, 0, 0.6);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    sceneContainer.appendChild(carInfoPanel);
    
    // Sağ tarafta performans karşılaştırma paneli ekle
    const performancePanel = document.createElement('div');
    performancePanel.id = 'performancePanel';
    performancePanel.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(26, 26, 46, 0.95));
        backdrop-filter: blur(15px);
        color: #FFFFFF;
        padding: 25px;
        border-radius: 15px;
        font-size: 14px;
        min-width: 250px;
        border: 2px solid rgba(255, 215, 0, 0.6);
        box-shadow: 
            0 0 30px rgba(255, 215, 0, 0.5),
            inset 0 0 30px rgba(255, 215, 0, 0.1);
        z-index: 10;
        animation: panelGlow 3s ease-in-out infinite;
    `;
    performancePanel.innerHTML = `
        <div style="color: #FFD700; font-size: 18px; margin-bottom: 15px; font-weight: bold; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);">
            📊 COMPARISON
        </div>
        <div style="color: #CCCCCC; font-size: 12px; line-height: 1.8;">
            <div style="margin-bottom: 10px;">💡 Compare vehicles</div>
            <div style="margin-bottom: 10px;">⚡ Performance metrics</div>
            <div style="margin-bottom: 10px;">🎯 Each vehicle is unique</div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 215, 0, 0.3);">
                <div style="color: #00FFFF; font-size: 11px;">
                    💡 Tip: Cars rotate automatically
                </div>
            </div>
        </div>
    `;
    sceneContainer.appendChild(performancePanel);

    menuContainer.appendChild(sceneContainer);

    
    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.gap = '20px';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.marginBottom = '30px';
    controlsContainer.style.zIndex = 1;

    
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '⬅️ PREVIOUS';
    prevButton.style.cssText = `
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 25px;
        padding: 20px 40px;
        font-size: 22px;
        color: #FFFFFF;
        cursor: pointer;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        box-shadow: 
            0 8px 25px rgba(231, 76, 60, 0.6),
            0 0 40px rgba(231, 76, 60, 0.3);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    `;
    
    // Hover efektleri
    prevButton.addEventListener('mouseenter', () => {
        prevButton.style.transform = 'scale(1.1) translateY(-3px)';
        prevButton.style.boxShadow = '0 12px 35px rgba(231, 76, 60, 0.9), 0 0 60px rgba(231, 76, 60, 0.5)';
        prevButton.style.borderColor = 'rgba(255, 255, 255, 0.8)';
    });
    prevButton.addEventListener('mouseleave', () => {
        prevButton.style.transform = 'scale(1) translateY(0px)';
        prevButton.style.boxShadow = '0 8px 25px rgba(231, 76, 60, 0.6), 0 0 40px rgba(231, 76, 60, 0.3)';
        prevButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });
    
    // Add shine effect
    const prevShine = document.createElement('div');
    prevShine.style.cssText = `
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
        animation: buttonShine 3s infinite;
    `;
    prevButton.appendChild(prevShine);

    
    const nextButton = document.createElement('button');
    nextButton.innerHTML = 'NEXT ➡️';
    nextButton.style.cssText = `
        background: linear-gradient(135deg, #3498db, #2980b9);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 25px;
        padding: 20px 40px;
        font-size: 22px;
        color: #FFFFFF;
        cursor: pointer;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        box-shadow: 
            0 8px 25px rgba(52, 152, 219, 0.6),
            0 0 40px rgba(52, 152, 219, 0.3);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    `;
    
    // Hover efektleri
    nextButton.addEventListener('mouseenter', () => {
        nextButton.style.transform = 'scale(1.1) translateY(-3px)';
        nextButton.style.boxShadow = '0 12px 35px rgba(52, 152, 219, 0.9), 0 0 60px rgba(52, 152, 219, 0.5)';
        nextButton.style.borderColor = 'rgba(255, 255, 255, 0.8)';
    });
    nextButton.addEventListener('mouseleave', () => {
        nextButton.style.transform = 'scale(1) translateY(0px)';
        nextButton.style.boxShadow = '0 8px 25px rgba(52, 152, 219, 0.6), 0 0 40px rgba(52, 152, 219, 0.3)';
        nextButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });
    
    const nextShine = document.createElement('div');
    nextShine.style.cssText = `
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
        animation: buttonShine 3s infinite 1.5s;
    `;
    nextButton.appendChild(nextShine);
    
    // Add button shine animation if not exists
    if (!document.getElementById('buttonShineStyle')) {
        const style = document.createElement('style');
        style.id = 'buttonShineStyle';
        style.textContent = `
            @keyframes buttonShine {
                0% {
                    transform: translateX(-100%) translateY(-100%) rotate(45deg);
                }
                100% {
                    transform: translateX(100%) translateY(100%) rotate(45deg);
                }
            }
        `;
        document.head.appendChild(style);
    }

    
    const carIndexDisplay = document.createElement('div');
    carIndexDisplay.id = 'carIndexDisplay';
    carIndexDisplay.style.cssText = `
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.4), rgba(255, 165, 0, 0.4));
        backdrop-filter: blur(10px);
        color: #FFFFFF;
        padding: 18px 35px;
        border-radius: 30px;
        font-size: 24px;
        font-weight: bold;
        border: 3px solid rgba(255, 215, 0, 0.9);
        box-shadow: 
            0 0 30px rgba(255, 215, 0, 0.6),
            inset 0 0 30px rgba(255, 215, 0, 0.2);
        text-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
        min-width: 180px;
        text-align: center;
        animation: indexPulse 2s ease-in-out infinite;
    `;
    
    // Add index pulse animation if not exists
    if (!document.getElementById('indexPulseStyle')) {
        const style = document.createElement('style');
        style.id = 'indexPulseStyle';
        style.textContent = `
            @keyframes indexPulse {
                0%, 100% {
                    transform: scale(1);
                    box-shadow: 
                        0 0 30px rgba(255, 215, 0, 0.6),
                        inset 0 0 30px rgba(255, 215, 0, 0.2);
                }
                50% {
                    transform: scale(1.05);
                    box-shadow: 
                        0 0 50px rgba(255, 215, 0, 0.9),
                        inset 0 0 50px rgba(255, 215, 0, 0.3);
                }
            }
        `;
        document.head.appendChild(style);
    }

    controlsContainer.appendChild(prevButton);
    controlsContainer.appendChild(carIndexDisplay);
    controlsContainer.appendChild(nextButton);
    menuContainer.appendChild(controlsContainer);

    
    const startButton = document.createElement('button');
    startButton.textContent = '🏁 START GAME 🏁';
    startButton.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
    startButton.style.border = 'none';
    startButton.style.borderRadius = '25px';
    startButton.style.padding = '20px 50px';
    startButton.style.fontSize = '28px';
    startButton.style.color = '#FFFFFF';
    startButton.style.cursor = 'pointer';
    startButton.style.fontWeight = 'bold';
    startButton.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    startButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    startButton.style.transition = 'all 0.3s ease';
    startButton.style.position = 'relative';
    startButton.style.overflow = 'hidden';
    
    // Start button hover efektleri - bayrak sallanma animasyonu ile
    startButton.addEventListener('mouseenter', () => {
        startButton.style.transform = 'scale(1.15) translateY(-5px)';
        startButton.style.boxShadow = '0 10px 30px rgba(39, 174, 96, 0.8), 0 0 50px rgba(39, 174, 96, 0.5)';
        startButton.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
        // Bayrak ikonuna sallanma animasyonu ekle
        startButton.style.animation = 'flagWave 0.6s ease-in-out infinite';
    });
    startButton.addEventListener('mouseleave', () => {
        startButton.style.transform = 'scale(1) translateY(0px)';
        startButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
        startButton.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
        startButton.style.animation = '';
    });

    menuContainer.appendChild(startButton);
    
    // Mouse cursor trail efekti ekle (sadece ilk createCarSelectionMenu'da)
    if (!document.getElementById('mouseTrail')) {
        createMouseTrailEffect(menuContainer);
    }

    
    const instructions = document.createElement('div');
    instructions.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 20px;
        color: #CCCCCC;
        font-size: 13px;
        text-align: left;
        line-height: 1.5;
        background: rgba(0, 0, 0, 0.7);
        padding: 12px 18px;
        border-radius: 10px;
        border: 1px solid rgba(0, 255, 255, 0.3);
        z-index: 100;
        max-width: 220px;
    `;
    instructions.innerHTML = `
        <p><strong>🎮 Controls:</strong></p>
        <p>← → Arrow Keys: Change car | Enter/Space: Start</p>
        <p>💡 L Key: Toggle Light</p>
        <p>🎛️ I Key: Light Control Panel</p>
        <p>🔘 Can also be controlled with buttons at top right</p>
    `;
    menuContainer.appendChild(instructions);

    
    const lightControlContainer = document.createElement('div');
    lightControlContainer.style.position = 'absolute';
    lightControlContainer.style.top = '20px';
    lightControlContainer.style.right = '20px';
    lightControlContainer.style.zIndex = '2001';
    lightControlContainer.style.display = 'flex';
    lightControlContainer.style.flexDirection = 'column';
    lightControlContainer.style.gap = '10px';

    lightToggleButton = document.createElement('button');
    lightToggleButton.innerHTML = carSelectionLightsEnabled ? '💡 Light: ON' : '🌙 Light: OFF';
    lightToggleButton.style.background = carSelectionLightsEnabled ? 
        'linear-gradient(45deg, #FFD700, #FFA500)' : 
        'linear-gradient(45deg, #2C3E50, #34495E)';
    lightToggleButton.style.border = 'none';
    lightToggleButton.style.borderRadius = '15px';
    lightToggleButton.style.padding = '20px 30px'; 
    lightToggleButton.style.fontSize = '20px'; 
    lightToggleButton.style.color = '#FFFFFF';
    lightToggleButton.style.cursor = 'pointer';
    lightToggleButton.style.fontWeight = 'bold';
    lightToggleButton.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    lightToggleButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    lightToggleButton.style.transition = 'all 0.3s ease';
    lightToggleButton.style.border = '3px solid #FFD700';
    lightToggleButton.style.minWidth = '200px';

    
    const lightIntensityButton = document.createElement('button');
    lightIntensityButton.innerHTML = '🎛️ Light Intensity';
    lightIntensityButton.style.background = 'linear-gradient(45deg, #9B59B6, #8E44AD)';
    lightIntensityButton.style.border = 'none';
    lightIntensityButton.style.borderRadius = '15px';
    lightIntensityButton.style.padding = '20px 30px';
    lightIntensityButton.style.fontSize = '20px';
    lightIntensityButton.style.color = '#FFFFFF';
    lightIntensityButton.style.cursor = 'pointer';
    lightIntensityButton.style.fontWeight = 'bold';
    lightIntensityButton.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    lightIntensityButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    lightIntensityButton.style.transition = 'all 0.3s ease';
    lightIntensityButton.style.border = '3px solid #9B59B6';
    lightIntensityButton.style.minWidth = '200px';

    lightControlContainer.appendChild(lightToggleButton);
    lightControlContainer.appendChild(lightIntensityButton);

    
    [lightToggleButton, lightIntensityButton].forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.6)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
        });
    });

    
    lightToggleButton.addEventListener('click', toggleCarSelectionLights);
    lightIntensityButton.addEventListener('click', toggleLightIntensityPanel);

    menuContainer.appendChild(lightControlContainer);

    
    createLightIntensityPanel();

    document.body.appendChild(menuContainer);

    
    init3DCarSelectionScene();

    
    prevButton.addEventListener('click', () => changeSelectedCar(-1));
    nextButton.addEventListener('click', () => changeSelectedCar(1));
    startButton.addEventListener('click', startGameWithSelectedCar);

    
    [prevButton, nextButton].forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.2) translateY(-8px)';
            button.style.filter = 'brightness(1.3)';
            button.style.boxShadow = '0 12px 35px rgba(0,0,0,0.6)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1) translateY(0)';
            button.style.filter = 'brightness(1)';
        });
    });
    
    startButton.addEventListener('mouseenter', () => {
        startButton.style.transform = 'scale(1.1) translateY(-8px)';
        startButton.style.filter = 'brightness(1.2)';
        startButton.style.animation = 'none';
        setTimeout(() => {
            startButton.style.animation = 'startButtonPulse 1s ease-in-out infinite, gradientShift 2s ease infinite, flagWave 0.6s ease-in-out infinite';
        }, 10);
    });
    
    startButton.addEventListener('mouseleave', () => {
        startButton.style.transform = 'scale(1) translateY(0)';
        startButton.style.filter = 'brightness(1)';
        startButton.style.animation = 'startButtonPulse 2s ease-in-out infinite, gradientShift 3s ease infinite';
    });

    
    const keyHandler = (e) => {
        if (menuContainer.style.display !== 'none') {
            switch(e.code) {
                case 'ArrowLeft':
                    e.preventDefault();
                    changeSelectedCar(-1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    changeSelectedCar(1);
                    break;
                case 'Enter':
                case 'Space':
                    e.preventDefault();
                    startGameWithSelectedCar();
                    break;
                
                case 'KeyL':
                    
                    const carSelectionMenu = document.getElementById('carSelectionMenu');
                    if (carSelectionMenu && carSelectionMenu.style.display !== 'none') {
                        event.preventDefault();
                        toggleCarSelectionLights();
                        console.log('💡 Araç seçim ekranında ışık kontrolü çalıştı');
                    }
                    break;
            }
        }
    };
    
    document.addEventListener('keydown', keyHandler);
    
    
    menuContainer.cleanupHandler = () => {
        document.removeEventListener('keydown', keyHandler);
    };

    
    updateCarDisplay();
}






function changeSelectedCar(direction) {
    selectedCarIndex += direction;
    
    
    if (selectedCarIndex < 0) {
        selectedCarIndex = AVAILABLE_CARS.length - 1;
    } else if (selectedCarIndex >= AVAILABLE_CARS.length) {
        selectedCarIndex = 0;
    }
    
    updateCarDisplay();
}




let lightControlPanel = null;
let lightControls = {
    ambientIntensity: 0.6,
    spotIntensity: 2.0,
    lampIntensity: 1.0,
    backIntensity: 0.5,
    spotAngle: Math.PI / 4,
    spotPenumbra: 0.3,
    lightsEnabled: true,
    ambientColor: '#404040',
    spotColor: '#ffffff',
    lampColor: '#ffffcc',
    backColor: '#ff6600'
};


let carSelectionLights = {
    ambient: null,
    spot: null,
    lamp: null,
    back: null
};



function createLightControlPanel() {
    
    lightControlPanel = document.createElement('div');
    lightControlPanel.id = 'car-selection-light-panel';
    lightControlPanel.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid #FFD700;
        border-radius: 10px;
        padding: 15px;
        color: white;
        font-family: Arial, sans-serif;
        font-size: 10px;
        min-width: 50px;
        max-height: 100px;
        overflow-y: auto;
        z-index: 1000;
        backdrop-filter: blur(5px);
    `;

    
    const title = document.createElement('h3');
    title.textContent = '🔆 Işık Kontrol Paneli';
    title.style.cssText = `
        margin: 0 0 15px 0;
        color: #FFD700;
        text-align: center;
        border-bottom: 1px solid #FFD700;
        padding-bottom: 10px;
    `;
    lightControlPanel.appendChild(title);

    
    const masterToggle = createToggleControl('Tüm Işıkları Aç/Kapat', lightControls.lightsEnabled, (value) => {
        lightControls.lightsEnabled = value;
        toggleAllLights(value);
        updateLightControlsVisibility();
    });
    lightControlPanel.appendChild(masterToggle);

    
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'light-controls-container';
    controlsContainer.style.display = lightControls.lightsEnabled ? 'block' : 'none';

    
    controlsContainer.appendChild(createSectionTitle('🌅 Ortam Işığı'));
    controlsContainer.appendChild(createSliderControl('Parlaklık', lightControls.ambientIntensity, 0, 2, 0.1, (value) => {
        lightControls.ambientIntensity = value;
        if (carSelectionLights.ambient) carSelectionLights.ambient.intensity = value;
    }));
    controlsContainer.appendChild(createColorControl('Renk', lightControls.ambientColor, (value) => {
        lightControls.ambientColor = value;
        if (carSelectionLights.ambient) carSelectionLights.ambient.color.setHex(parseInt(value.replace('#', '0x')));
    }));

    
    controlsContainer.appendChild(createSectionTitle('💡 Ana Spot Işık'));
    controlsContainer.appendChild(createSliderControl('Parlaklık', lightControls.spotIntensity, 0, 5, 0.1, (value) => {
        lightControls.spotIntensity = value;
        if (carSelectionLights.spot) carSelectionLights.spot.intensity = value;
    }));
    controlsContainer.appendChild(createSliderControl('Açı', lightControls.spotAngle, 0.1, Math.PI/2, 0.1, (value) => {
        lightControls.spotAngle = value;
        if (carSelectionLights.spot) carSelectionLights.spot.angle = value;
    }));
    controlsContainer.appendChild(createSliderControl('Kenar Yumuşaklığı', lightControls.spotPenumbra, 0, 1, 0.1, (value) => {
        lightControls.spotPenumbra = value;
        if (carSelectionLights.spot) carSelectionLights.spot.penumbra = value;
    }));
    controlsContainer.appendChild(createColorControl('Renk', lightControls.spotColor, (value) => {
        lightControls.spotColor = value;
        if (carSelectionLights.spot) carSelectionLights.spot.color.setHex(parseInt(value.replace('#', '0x')));
    }));

    
    controlsContainer.appendChild(createSectionTitle('🔆 Tavan Lambası'));
    controlsContainer.appendChild(createSliderControl('Parlaklık', lightControls.lampIntensity, 0, 3, 0.1, (value) => {
        lightControls.lampIntensity = value;
        if (carSelectionLights.lamp) carSelectionLights.lamp.intensity = value;
    }));
    controlsContainer.appendChild(createColorControl('Renk', lightControls.lampColor, (value) => {
        lightControls.lampColor = value;
        if (carSelectionLights.lamp) carSelectionLights.lamp.color.setHex(parseInt(value.replace('#', '0x')));
    }));

    
    controlsContainer.appendChild(createSectionTitle('🌈 Arka Plan Işığı'));
    controlsContainer.appendChild(createSliderControl('Parlaklık', lightControls.backIntensity, 0, 2, 0.1, (value) => {
        lightControls.backIntensity = value;
        if (carSelectionLights.back) carSelectionLights.back.intensity = value;
    }));
    controlsContainer.appendChild(createColorControl('Renk', lightControls.backColor, (value) => {
        lightControls.backColor = value;
        if (carSelectionLights.back) carSelectionLights.back.color.setHex(parseInt(value.replace('#', '0x')));
    }));

    
    controlsContainer.appendChild(createSectionTitle('🎨 Hazır Ayarlar'));
    const presetContainer = document.createElement('div');
    presetContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px;';
    
    const presets = [
        { name: 'Varsayılan', action: () => applyLightPreset('default') },
        { name: 'Gece', action: () => applyLightPreset('night') },
        { name: 'Gündüz', action: () => applyLightPreset('day') },
        { name: 'Neon', action: () => applyLightPreset('neon') },
        { name: 'Sıcak', action: () => applyLightPreset('warm') }
    ];

    presets.forEach(preset => {
        const btn = document.createElement('button');
        btn.textContent = preset.name;
        btn.style.cssText = `
            padding: 5px 8px;
            background: #333;
            color: white;
            border: 1px solid #FFD700;
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
        `;
        btn.onmouseover = () => btn.style.background = '#FFD700';
        btn.onmouseout = () => btn.style.background = '#333';
        btn.onclick = preset.action;
        presetContainer.appendChild(btn);
    });
    controlsContainer.appendChild(presetContainer);

    lightControlPanel.appendChild(controlsContainer);

    lightControlPanel.appendChild(controlsContainer);

    
    document.body.appendChild(lightControlPanel);
}


function createSectionTitle(title) {
    const element = document.createElement('div');
    element.textContent = title;
    element.style.cssText = `
        color: #FFD700;
        font-weight: bold;
        margin: 10px 0 5px 0;
        border-bottom: 1px solid #555;
        padding-bottom: 3px;
    `;
    return element;
}

function createSliderControl(label, value, min, max, step, onChange) {
    const container = document.createElement('div');
    container.style.marginBottom = '8px';

    const labelElement = document.createElement('label');
    labelElement.textContent = `${label}: `;
    labelElement.style.display = 'block';
    labelElement.style.marginBottom = '2px';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.style.cssText = 'width: 100%; margin-bottom: 2px;';

    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = value.toFixed(1);
    valueDisplay.style.cssText = 'color: #FFD700; font-size: 10px;';

    slider.oninput = () => {
        const newValue = parseFloat(slider.value);
        valueDisplay.textContent = newValue.toFixed(1);
        onChange(newValue);
    };

    container.appendChild(labelElement);
    container.appendChild(slider);
    container.appendChild(valueDisplay);
    return container;
}

function createColorControl(label, value, onChange) {
    const container = document.createElement('div');
    container.style.marginBottom = '8px';

    const labelElement = document.createElement('label');
    labelElement.textContent = `${label}: `;
    labelElement.style.display = 'block';
    labelElement.style.marginBottom = '2px';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = value;
    colorInput.style.cssText = 'width: 50px; height: 25px; border: none; cursor: pointer;';

    colorInput.onchange = () => onChange(colorInput.value);

    container.appendChild(labelElement);
    container.appendChild(colorInput);
    return container;
}

function createToggleControl(label, value, onChange) {
    const container = document.createElement('div');
    container.style.cssText = 'margin-bottom: 15px; text-align: center;';

    const button = document.createElement('button');
    button.textContent = value ? '🔆 Işıklar AÇIK' : '🌙 Işıklar KAPALI';
    button.style.cssText = `
        padding: 10px 20px;
        background: ${value ? '#4CAF50' : '#f44336'};
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        width: 100%;
    `;

    button.onclick = () => {
        const newValue = !value;
        button.textContent = newValue ? '🔆 Işıklar AÇIK' : '🌙 Işıklar KAPALI';
        button.style.background = newValue ? '#4CAF50' : '#f44336';
        onChange(newValue);
        value = newValue;
    };

    container.appendChild(button);
    return container;
}

function toggleAllLights(enabled) {
    Object.values(carSelectionLights).forEach(light => {
        if (light) {
            light.visible = enabled;
        }
    });
}

function updateLightControlsVisibility() {
    const container = document.getElementById('light-controls-container');
    if (container) {
        container.style.display = lightControls.lightsEnabled ? 'block' : 'none';
    }
}

function applyLightPreset(presetName) {
    const presets = {
        default: {
            ambientIntensity: 0.6, ambientColor: '#404040',
            spotIntensity: 2.0, spotColor: '#ffffff',
            lampIntensity: 1.0, lampColor: '#ffffcc',
            backIntensity: 0.5, backColor: '#ff6600'
        },
        night: {
            ambientIntensity: 0.2, ambientColor: '#1a1a2e',
            spotIntensity: 0.8, spotColor: '#4444ff',
            lampIntensity: 0.3, lampColor: '#aaaaff',
            backIntensity: 0.2, backColor: '#6600ff'
        },
        day: {
            ambientIntensity: 1.0, ambientColor: '#ffffff',
            spotIntensity: 3.0, spotColor: '#ffffff',
            lampIntensity: 1.5, lampColor: '#ffffff',
            backIntensity: 0.8, backColor: '#ffff99'
        },
        neon: {
            ambientIntensity: 0.3, ambientColor: '#ff00ff',
            spotIntensity: 2.5, spotColor: '#00ffff',
            lampIntensity: 2.0, lampColor: '#ff0099',
            backIntensity: 1.0, backColor: '#00ff00'
        },
        warm: {
            ambientIntensity: 0.7, ambientColor: '#ffcc99',
            spotIntensity: 1.8, spotColor: '#ffaa66',
            lampIntensity: 1.2, lampColor: '#ffcc66',
            backIntensity: 0.6, backColor: '#ff9944'
        }
    };

    const preset = presets[presetName];
    if (!preset) return;

    
    Object.assign(lightControls, preset);

    
    if (carSelectionLights.ambient) {
        carSelectionLights.ambient.intensity = preset.ambientIntensity;
        carSelectionLights.ambient.color.setHex(parseInt(preset.ambientColor.replace('#', '0x')));
    }
    if (carSelectionLights.spot) {
        carSelectionLights.spot.intensity = preset.spotIntensity;
        carSelectionLights.spot.color.setHex(parseInt(preset.spotColor.replace('#', '0x')));
    }
    if (carSelectionLights.lamp) {
        carSelectionLights.lamp.intensity = preset.lampIntensity;
        carSelectionLights.lamp.color.setHex(parseInt(preset.lampColor.replace('#', '0x')));
    }
    if (carSelectionLights.back) {
        carSelectionLights.back.intensity = preset.backIntensity;
        carSelectionLights.back.color.setHex(parseInt(preset.backColor.replace('#', '0x')));
    }

    
    updatePanelControls();
}

function updatePanelControls() {
    
    const sliders = lightControlPanel.querySelectorAll('input[type="range"]');
    const colorInputs = lightControlPanel.querySelectorAll('input[type="color"]');
    
    
    
    if (lightControlPanel) {
        lightControlPanel.remove();
        createLightControlPanel();
    }
}


function toggleLightControlPanel() {
    if (lightControlPanel) {
        lightControlPanel.style.display = lightControlPanel.style.display === 'none' ? 'block' : 'none';
    } else {
        createLightControlPanel();
    }
}



async function startGameWithSelectedCar() {
    
    // Hide and remove car selection menu completely
    const menuContainer = document.getElementById('carSelectionMenu');
    if (menuContainer) {
        if (menuContainer.cleanupHandler) {
            menuContainer.cleanupHandler();
        }
        menuContainer.style.display = 'none';
        menuContainer.remove(); // Completely remove from DOM
    }
    
    // Hide and remove light control panel
    const lightControlPanel = document.getElementById('lightControlPanel');
    if (lightControlPanel) {
        lightControlPanel.style.display = 'none';
        lightControlPanel.remove();
    }
    
    // Hide and remove light intensity panel
    const lightIntensityPanel = document.getElementById('lightIntensityPanel');
    if (lightIntensityPanel) {
        lightIntensityPanel.style.display = 'none';
        lightIntensityPanel.remove();
    }
    
    // Hide day/night selection menu if exists
    const dayNightMenu = document.getElementById('dayNightSelectionMenu');
    if (dayNightMenu) {
        dayNightMenu.style.display = 'none';
        dayNightMenu.remove();
    }
    
    cleanup3DCarSelectionScene();
    
    // Ensure canvas is visible and on top
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.style.display = 'block';
        canvas.style.zIndex = '1';
        canvas.style.position = 'relative';
    }
    
    // Remove any remaining UI overlays that might block the game
    const modernUI = document.getElementById('modernGameUI');
    if (modernUI) {
        modernUI.style.zIndex = '100';
    }
    
    gameStarted = true;
    await startGame();
}


function cleanup3DCarSelectionScene() {
    if (carSelectionAnimationId) {
        cancelAnimationFrame(carSelectionAnimationId);
        carSelectionAnimationId = null;
    }
    
    if (carSelectionRenderer) {
        carSelectionRenderer.dispose();
        carSelectionRenderer = null;
    }
    
    if (carSelectionScene) {
        carSelectionScene.clear();
        carSelectionScene = null;
    }
    
    carSelectionCamera = null;
    carSelectionCanvas = null;
    currentDisplayedCar = null;
    
    console.log('🧹 3D araç seçim sahnesi temizlendi');
}





function createMoonStatusIndicator() {
    if (!isNightMode) return;
    
    let indicator = document.getElementById('moonStatus');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'moonStatus';
        indicator.style.position = 'absolute';
        indicator.style.top = '20px';
        indicator.style.right = '20px';
        indicator.style.background = 'rgba(0, 0, 50, 0.9)';
        indicator.style.color = '#FFFFFF';
        indicator.style.padding = '20px';
        indicator.style.borderRadius = '10px';
        indicator.style.fontSize = '18px';
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


let carSelectionScene = null;
let carSelectionCamera = null;
let carSelectionRenderer = null;
let carSelectionCanvas = null;
let currentDisplayedCar = null;
let carSelectionAnimationId = null;


let loadedCarModels = [];



function createCarSelectionMenu() {
    
    const menuContainer = document.createElement('div');
    menuContainer.id = 'carSelectionMenu';
    menuContainer.style.position = 'fixed';
    menuContainer.style.top = '0';
    menuContainer.style.left = '0';
    menuContainer.style.width = '100%';
    menuContainer.style.height = '100%';
    menuContainer.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
    menuContainer.style.display = 'flex';
    menuContainer.style.flexDirection = 'column';
    menuContainer.style.alignItems = 'center';
    menuContainer.style.justifyContent = 'center';
    menuContainer.style.zIndex = '2000';
    menuContainer.style.fontFamily = 'Arial, sans-serif';

    
    // Modern title with Lightning McQueen 3D icons
    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = `
        position: relative;
        margin-bottom: 10px;
        margin-top: 20px;
        text-align: center;
        z-index: 1;
    `;
    
    // Sol araba ikonu - Lightning McQueen 3D model
    const leftCarIcon = document.createElement('div');
    leftCarIcon.id = 'leftTitleCarIcon';
    leftCarIcon.style.cssText = `
        display: inline-block;
        width: 220px;
        height: 220px;
        margin-right: -60px;
        margin-left: -80px;
        margin-top: -110px;
        transform: translateX(-60px);
        animation: carIconFloat 3s ease-in-out infinite, carIconPulse 2s ease-in-out infinite;
        cursor: pointer;
        transition: transform 0.3s ease, filter 0.3s ease;
        filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.6));
        position: relative;
        vertical-align: middle;
    `;
    
    // Sağ araba ikonu - Lightning McQueen 3D model
    const rightCarIcon = document.createElement('div');
    rightCarIcon.id = 'rightTitleCarIcon';
    rightCarIcon.style.cssText = `
        display: inline-block;
        width: 220px;
        height: 220px;
        margin-left: -40px;
        margin-top: -110px;
        transform: translateX(-60px);
        animation: carIconFloat 3s ease-in-out infinite 1.5s, carIconPulse 2s ease-in-out infinite 1s;
        cursor: pointer;
        transition: transform 0.3s ease, filter 0.3s ease;
        filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.6));
        position: relative;
        vertical-align: middle;
    `;
    
    // Car icon hover efektleri
    leftCarIcon.addEventListener('mouseenter', () => {
        leftCarIcon.style.transform = 'translateX(-40px) scale(1.3) rotate(15deg)';
        leftCarIcon.style.filter = 'drop-shadow(0 0 20px rgba(0, 255, 255, 1))';
    });
    leftCarIcon.addEventListener('mouseleave', () => {
        leftCarIcon.style.transform = 'translateX(-40px) scale(1) rotate(0deg)';
        leftCarIcon.style.filter = 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.6))';
    });
    
    rightCarIcon.addEventListener('mouseenter', () => {
        rightCarIcon.style.transform = 'translateX(-40px) scale(1.3) rotate(-15deg)';
        rightCarIcon.style.filter = 'drop-shadow(0 0 20px rgba(0, 255, 255, 1))';
    });
    rightCarIcon.addEventListener('mouseleave', () => {
        rightCarIcon.style.transform = 'translateX(-40px) scale(1) rotate(0deg)';
        rightCarIcon.style.filter = 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.6))';
    });
    
    const title = document.createElement('h1');
    title.style.cssText = `
        color: #FFFFFF;
        font-size: 72px;
        font-weight: 900;
        text-shadow: 
            0 0 10px rgba(0, 255, 255, 0.8),
            0 0 20px rgba(0, 255, 255, 0.6),
            0 0 30px rgba(0, 255, 255, 0.4),
            0 0 40px rgba(0, 255, 255, 0.2),
            0 0 60px rgba(0, 255, 255, 0.1);
        margin: 0;
        letter-spacing: 5px;
        animation: titleGlowEnhanced 2s ease-in-out infinite alternate;
        position: relative;
        display: inline-block;
    `;
    title.textContent = 'CAR SELECTION';
    
    titleContainer.appendChild(leftCarIcon);
    titleContainer.appendChild(title);
    titleContainer.appendChild(rightCarIcon);
    menuContainer.appendChild(titleContainer);
    
    // Lightning McQueen 3D modellerini yükle ve render et
    leftCarIcon.innerHTML = '';
    rightCarIcon.innerHTML = '';
    
    const updateTitleIcons = async () => {
        console.log('🎨 Başlık ikonları güncelleniyor (2. menü)...');
        
        if (!loadedCarModels || loadedCarModels.length === 0) {
            console.log('📦 Başlık ikonları için modeller yükleniyor...');
            try {
                await loadCarModelsForSelection();
                console.log('✅ Modeller yüklendi, Lightning McQueen ikonları oluşturuluyor...');
            } catch (error) {
                console.error('❌ Modeller yüklenirken hata:', error);
                return;
            }
        }
        
        let attempts = 0;
        while ((!loadedCarModels || loadedCarModels.length === 0 || !loadedCarModels[0]) && attempts < 150) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (loadedCarModels && loadedCarModels.length > 0 && loadedCarModels[0]) {
            console.log('🎨 Lightning McQueen minyatür ikonları oluşturuluyor (2. menü)...');
            leftCarIcon.innerHTML = '';
            rightCarIcon.innerHTML = '';
            try {
                createMiniature3DCarIcon(leftCarIcon, 0); // Lightning McQueen
                createMiniature3DCarIcon(rightCarIcon, 0); // Lightning McQueen
                console.log('✅ Lightning McQueen ikonları oluşturuldu (2. menü)');
            } catch (error) {
                console.error('❌ Lightning McQueen ikon oluşturulurken hata:', error);
            }
        }
    };
    
    updateTitleIcons();
    
    setTimeout(() => {
        if (leftCarIcon.innerHTML === '' || rightCarIcon.innerHTML === '') {
            console.log('🔄 İkonlar hala boş, tekrar güncelleniyor (2. menü)...');
            updateTitleIcons();
        }
    }, 2000);

    
    const sceneContainer = document.createElement('div');
    sceneContainer.style.position = 'relative';
    sceneContainer.style.width = '1200px'; 
    sceneContainer.style.height = '800px'; 
    sceneContainer.style.border = '3px solid #FFD700';
    sceneContainer.style.borderRadius = '15px';
    sceneContainer.style.background = 'linear-gradient(45deg, #2c3e50, #3498db)';
    sceneContainer.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.5)';
    sceneContainer.style.marginBottom = '30px';
    sceneContainer.style.overflow = 'hidden';

    
    carSelectionCanvas = document.createElement('canvas');
    carSelectionCanvas.style.width = '100%';
    carSelectionCanvas.style.height = '100%';
    carSelectionCanvas.style.borderRadius = '12px';
    sceneContainer.appendChild(carSelectionCanvas);

    
    const carInfoPanel = document.createElement('div');
    carInfoPanel.id = 'carInfoPanel';
    carInfoPanel.style.position = 'absolute';
    carInfoPanel.style.top = '5px'; 
    carInfoPanel.style.left = '5px'; 
    carInfoPanel.style.background = 'rgba(0, 0, 0, 0.8)';
    carInfoPanel.style.color = '#FFFFFF';
    carInfoPanel.style.padding = '8px'; 
    carInfoPanel.style.borderRadius = '6px'; 
    carInfoPanel.style.fontSize = '12px'; 
    carInfoPanel.style.minWidth = '100px'; 
    carInfoPanel.style.border = '1px solid #FFD700'; 
    carInfoPanel.style.maxWidth = '200px'; 
    sceneContainer.appendChild(carInfoPanel);
    
    // Sağ tarafta performans karşılaştırma paneli ekle
    const performancePanel = document.createElement('div');
    performancePanel.id = 'performancePanel';
    performancePanel.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(26, 26, 46, 0.95));
        backdrop-filter: blur(15px);
        color: #FFFFFF;
        padding: 25px;
        border-radius: 15px;
        font-size: 14px;
        min-width: 250px;
        border: 2px solid rgba(255, 215, 0, 0.6);
        box-shadow: 
            0 0 30px rgba(255, 215, 0, 0.5),
            inset 0 0 30px rgba(255, 215, 0, 0.1);
        z-index: 10;
        animation: panelGlow 3s ease-in-out infinite;
    `;
    performancePanel.innerHTML = `
        <div style="color: #FFD700; font-size: 18px; margin-bottom: 15px; font-weight: bold; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);">
            📊 COMPARISON
        </div>
        <div style="color: #CCCCCC; font-size: 12px; line-height: 1.8;">
            <div style="margin-bottom: 10px;">💡 Compare vehicles</div>
            <div style="margin-bottom: 10px;">⚡ Performance metrics</div>
            <div style="margin-bottom: 10px;">🎯 Each vehicle is unique</div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 215, 0, 0.3);">
                <div style="color: #00FFFF; font-size: 11px;">
                    💡 Tip: Cars rotate automatically
                </div>
            </div>
        </div>
    `;
    sceneContainer.appendChild(performancePanel);

    menuContainer.appendChild(sceneContainer);

    
    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.gap = '20px';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.marginBottom = '30px';

    
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '⬅️ PREVIOUS';
    prevButton.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
    prevButton.style.border = 'none';
    prevButton.style.borderRadius = '15px';
    prevButton.style.padding = '15px 25px';
    prevButton.style.fontSize = '18px';
    prevButton.style.color = '#FFFFFF';
    prevButton.style.cursor = 'pointer';
    prevButton.style.fontWeight = 'bold';
    prevButton.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
    prevButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    prevButton.style.transition = 'all 0.3s ease';

    
    const nextButton = document.createElement('button');
    nextButton.innerHTML = 'NEXT ➡️';
    nextButton.style.background = 'linear-gradient(45deg, #3498db, #2980b9)';
    nextButton.style.border = 'none';
    nextButton.style.borderRadius = '15px';
    nextButton.style.padding = '15px 25px';
    nextButton.style.fontSize = '18px';
    nextButton.style.color = '#FFFFFF';
    nextButton.style.cursor = 'pointer';
    nextButton.style.fontWeight = 'bold';
    nextButton.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
    nextButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    nextButton.style.transition = 'all 0.3s ease';

    
    const carIndexDisplay = document.createElement('div');
    carIndexDisplay.id = 'carIndexDisplay';
    carIndexDisplay.style.background = 'rgba(255, 255, 255, 0.2)';
    carIndexDisplay.style.color = '#FFFFFF';
    carIndexDisplay.style.padding = '10px 20px';
    carIndexDisplay.style.borderRadius = '20px';
    carIndexDisplay.style.fontSize = '16px';
    carIndexDisplay.style.fontWeight = 'bold';
    carIndexDisplay.style.border = '2px solid #FFD700';

    controlsContainer.appendChild(prevButton);
    controlsContainer.appendChild(carIndexDisplay);
    controlsContainer.appendChild(nextButton);
    menuContainer.appendChild(controlsContainer);

    
    const startButton = document.createElement('button');
    startButton.textContent = '🏁 START GAME 🏁';
    startButton.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
    startButton.style.border = 'none';
    startButton.style.borderRadius = '25px';
    startButton.style.padding = '20px 50px';
    startButton.style.fontSize = '28px';
    startButton.style.color = '#FFFFFF';
    startButton.style.cursor = 'pointer';
    startButton.style.fontWeight = 'bold';
    startButton.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    startButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    startButton.style.transition = 'all 0.3s ease';
    startButton.style.position = 'relative';
    startButton.style.overflow = 'hidden';
    
    // Start button hover efektleri - bayrak sallanma animasyonu ile
    startButton.addEventListener('mouseenter', () => {
        startButton.style.transform = 'scale(1.15) translateY(-5px)';
        startButton.style.boxShadow = '0 10px 30px rgba(39, 174, 96, 0.8), 0 0 50px rgba(39, 174, 96, 0.5)';
        startButton.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
        // Bayrak ikonuna sallanma animasyonu ekle
        startButton.style.animation = 'flagWave 0.6s ease-in-out infinite';
    });
    startButton.addEventListener('mouseleave', () => {
        startButton.style.transform = 'scale(1) translateY(0px)';
        startButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
        startButton.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
        startButton.style.animation = '';
    });

    menuContainer.appendChild(startButton);
    
    // Mouse cursor trail efekti ekle (sadece ilk createCarSelectionMenu'da)
    if (!document.getElementById('mouseTrail')) {
        createMouseTrailEffect(menuContainer);
    }

    
    const instructions = document.createElement('div');
    instructions.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 20px;
        color: #CCCCCC;
        font-size: 13px;
        text-align: left;
        line-height: 1.5;
        background: rgba(0, 0, 0, 0.7);
        padding: 12px 18px;
        border-radius: 10px;
        border: 1px solid rgba(0, 255, 255, 0.3);
        z-index: 100;
        max-width: 220px;
    `;
    instructions.innerHTML = `
        <p><strong>🎮 Controls:</strong></p>
        <p>← → Arrow Keys: Change car | Enter/Space: Start</p>
        <p>💡 L Key: Toggle Light</p>
        <p>🎛️ I Key: Light Control Panel</p>
        <p>🔘 Can also be controlled with buttons at top right</p>
    `;
    menuContainer.appendChild(instructions);

    
    const lightControlContainer = document.createElement('div');
    lightControlContainer.style.position = 'absolute';
    lightControlContainer.style.top = '20px';
    lightControlContainer.style.right = '20px';
    lightControlContainer.style.zIndex = '2001';
    lightControlContainer.style.display = 'flex';
    lightControlContainer.style.flexDirection = 'column';
    lightControlContainer.style.gap = '10px';

    lightToggleButton = document.createElement('button');
    lightToggleButton.innerHTML = carSelectionLightsEnabled ? '💡 Light: ON' : '🌙 Light: OFF';
    lightToggleButton.style.background = carSelectionLightsEnabled ? 
        'linear-gradient(45deg, #FFD700, #FFA500)' : 
        'linear-gradient(45deg, #2C3E50, #34495E)';
    lightToggleButton.style.border = 'none';
    lightToggleButton.style.borderRadius = '15px';
    lightToggleButton.style.padding = '20px 30px'; 
    lightToggleButton.style.fontSize = '20px'; 
    lightToggleButton.style.color = '#FFFFFF';
    lightToggleButton.style.cursor = 'pointer';
    lightToggleButton.style.fontWeight = 'bold';
    lightToggleButton.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    lightToggleButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    lightToggleButton.style.transition = 'all 0.3s ease';
    lightToggleButton.style.border = '3px solid #FFD700';
    lightToggleButton.style.minWidth = '250px';

    
    const lightIntensityButton = document.createElement('button');
    lightIntensityButton.innerHTML = '🎛️ Light Intensity';
    lightIntensityButton.style.background = 'linear-gradient(45deg, #9B59B6, #8E44AD)';
    lightIntensityButton.style.border = 'none';
    lightIntensityButton.style.borderRadius = '15px';
    lightIntensityButton.style.padding = '20px 30px';
    lightIntensityButton.style.fontSize = '20px';
    lightIntensityButton.style.color = '#FFFFFF';
    lightIntensityButton.style.cursor = 'pointer';
    lightIntensityButton.style.fontWeight = 'bold';
    lightIntensityButton.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    lightIntensityButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    lightIntensityButton.style.transition = 'all 0.3s ease';
    lightIntensityButton.style.border = '3px solid #9B59B6';
    lightIntensityButton.style.minWidth = '200px';

    lightControlContainer.appendChild(lightToggleButton);
    lightControlContainer.appendChild(lightIntensityButton);

    
    [lightToggleButton, lightIntensityButton].forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.6)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
        });
    });

    
    lightToggleButton.addEventListener('click', toggleCarSelectionLights);
    lightIntensityButton.addEventListener('click', toggleLightIntensityPanel);

    menuContainer.appendChild(lightControlContainer);

    
    createLightIntensityPanel();

    document.body.appendChild(menuContainer);

    
    init3DCarSelectionScene();

    
    prevButton.addEventListener('click', () => changeSelectedCar(-1));
    nextButton.addEventListener('click', () => changeSelectedCar(1));
    startButton.addEventListener('click', startGameWithSelectedCar);

    
    [prevButton, nextButton].forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.2) translateY(-8px)';
            button.style.filter = 'brightness(1.3)';
            button.style.boxShadow = '0 12px 35px rgba(0,0,0,0.6)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1) translateY(0)';
            button.style.filter = 'brightness(1)';
        });
    });
    
    startButton.addEventListener('mouseenter', () => {
        startButton.style.transform = 'scale(1.1) translateY(-8px)';
        startButton.style.filter = 'brightness(1.2)';
        startButton.style.animation = 'none';
        setTimeout(() => {
            startButton.style.animation = 'startButtonPulse 1s ease-in-out infinite, gradientShift 2s ease infinite, flagWave 0.6s ease-in-out infinite';
        }, 10);
    });
    
    startButton.addEventListener('mouseleave', () => {
        startButton.style.transform = 'scale(1) translateY(0)';
        startButton.style.filter = 'brightness(1)';
        startButton.style.animation = 'startButtonPulse 2s ease-in-out infinite, gradientShift 3s ease infinite';
    });

    
    const keyHandler = (e) => {
        if (menuContainer.style.display !== 'none') {
            switch(e.code) {
                case 'ArrowLeft':
                    e.preventDefault();
                    changeSelectedCar(-1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    changeSelectedCar(1);
                    break;
                case 'Enter':
                case 'Space':
                    e.preventDefault();
                    startGameWithSelectedCar();
                    break;
                
                case 'KeyL':
                    
                    const carSelectionMenu = document.getElementById('carSelectionMenu');
                    if (carSelectionMenu && carSelectionMenu.style.display !== 'none') {
                        event.preventDefault();
                        toggleCarSelectionLights();
                        console.log('💡 Araç seçim ekranında ışık kontrolü çalıştı');
                    }
                    break;
            }
        }
    };
    
    document.addEventListener('keydown', keyHandler);
    
    
    menuContainer.cleanupHandler = () => {
        document.removeEventListener('keydown', keyHandler);
    };

    
    updateCarDisplay();
}



async function init3DCarSelectionScene() {
    
    carSelectionScene = new THREE.Scene();
    carSelectionScene.background = new THREE.Color(0x1a1a2e);

    
    carSelectionCamera = new THREE.PerspectiveCamera(75, 1200/800, 0.1, 1000); 
    carSelectionCamera.position.set(0, 2, 6); 
    carSelectionCamera.lookAt(0, 0, 0); 

    
    carSelectionRenderer = new THREE.WebGLRenderer({ 
        canvas: carSelectionCanvas, 
        antialias: true,
        alpha: true
    });
    carSelectionRenderer.setSize(800, 600); 
    carSelectionRenderer.shadowMap.enabled = true;
    carSelectionRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    carSelectionRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8); 
    carSelectionLights.ambient = ambientLight;
    carSelectionScene.add(ambientLight);

    
    const spotLight = new THREE.SpotLight(0xffffff, 2.0); 
    spotLight.position.set(0, 8, 4); 
    spotLight.target.position.set(0, 0, 0); 
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 0.3;
    spotLight.distance = 15;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    carSelectionLights.spot = spotLight;
    carSelectionScene.add(spotLight);
    carSelectionScene.add(spotLight.target);

    
    const fillLight = new THREE.DirectionalLight(0x6699ff, 0.8);
    fillLight.position.set(-3, 3, 3);
    carSelectionLights.lamp = fillLight;
    carSelectionScene.add(fillLight);

    
    const backLight = new THREE.PointLight(0xff6600, 0.5, 10);
    backLight.position.set(0, 3, -5);
    carSelectionLights.back = backLight;
    carSelectionScene.add(backLight);

    
    const platformGeometry = new THREE.CylinderGeometry(3, 3, 0.1, 32);
    const platformMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x2c3e50,
        transparent: true,
        opacity: 0.9
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -0.5;
    platform.receiveShadow = true;
    carSelectionScene.add(platform);

    
    // Gelişmiş dönen halka - daha büyük ve parlak
    const ringGeometry = new THREE.TorusGeometry(4.2, 0.18, 16, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFD700,
        transparent: true,
        opacity: 0.8,
        emissive: 0xFFD700,
        emissiveIntensity: 0.5
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.y = -0.45;
    ring.rotation.x = Math.PI / 2;
    ring.name = 'rotatingRing';
    carSelectionScene.add(ring);
    
    // İç halka - daha küçük, ters yönde dönen
    const innerRingGeometry = new THREE.TorusGeometry(3.4, 0.12, 12, 48);
    const innerRingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00FFFF,
        transparent: true,
        opacity: 0.6,
        emissive: 0x00FFFF,
        emissiveIntensity: 0.3
    });
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    innerRing.position.y = -0.44;
    innerRing.rotation.x = Math.PI / 2;
    innerRing.name = 'innerRotatingRing';
    carSelectionScene.add(innerRing);
    
    // Platform altı ışık efekti
    const platformLight = new THREE.PointLight(0x00FFFF, 1.5, 8);
    platformLight.position.set(0, -0.3, 0);
    carSelectionScene.add(platformLight);
    
    // Platform üstü spot ışık
    const topSpotLight = new THREE.SpotLight(0xFFFFFF, 2.5, 10, Math.PI / 4, 0.5);
    topSpotLight.position.set(0, 5, 0);
    topSpotLight.target.position.set(0, 0, 0);
    topSpotLight.castShadow = true;
    carSelectionScene.add(topSpotLight);
    carSelectionScene.add(topSpotLight.target);

    
    createLightControlPanel();

    
    await loadCarModelsForSelection();
    updateCarDisplay();

    
    updateLightIntensity('ambient', lightSliders.ambient);
    updateLightIntensity('spot', lightSliders.spot);
    updateLightIntensity('point', lightSliders.point);
    updateLightIntensity('directional', lightSliders.directional);

    
    carSelectionAnimationLoop();
}

function changeSelectedCar(direction) {
    selectedCarIndex += direction;
    
    
    if (selectedCarIndex < 0) {
        selectedCarIndex = AVAILABLE_CARS.length - 1;
    } else if (selectedCarIndex >= AVAILABLE_CARS.length) {
        selectedCarIndex = 0;
    }
    
    updateCarDisplay();
}



function updateCarDisplay() {
    console.log('🔄 updateCarDisplay çalışıyor - Araç merkez pozisyonunda gözükecek');
    console.log('📊 Yüklenmiş model sayısı:', loadedCarModels ? loadedCarModels.length : 0);
    console.log('🎯 Seçili araç indexi:', selectedCarIndex);
    
    
    if (currentDisplayedCar) {
        carSelectionScene.remove(currentDisplayedCar);
        console.log('❌ Eski araba kaldırıldı');
    }
    
    
    if (loadedCarModels && loadedCarModels[selectedCarIndex] && loadedCarModels[selectedCarIndex] !== null) {
        currentDisplayedCar = loadedCarModels[selectedCarIndex].clone();
        currentDisplayedCar.position.set(0, 0.7, 0); 
        currentDisplayedCar.rotation.set(0, 0, 0); // Başlangıç rotasyonu
        
        // Araç değişiminde özel efekt - scale animasyonu
        currentDisplayedCar.scale.set(0, 0, 0); 
        
        
        
        const box = new THREE.Box3().setFromObject(currentDisplayedCar);
        const size = box.getSize(new THREE.Vector3());
        console.log('📏 Araç boyutu:', size);
        
        
        let targetScale = 1;
        if (size.y > 3 || size.x > 4 || size.z > 6) {
            targetScale = Math.min(3/size.y, 4/size.x, 6/size.z);
            console.log('📉 Araç ölçeklendi:', targetScale);
        }

        // Showcase'te spesifik bazı arabaları (4., 7., 12.) ekstra küçült
        // 4. araba -> index 3 (Wingo)
        // 7. araba -> index 6 (Snot Rod)
        // 12. araba -> index 11 (The King)
        if (selectedCarIndex === 3 || selectedCarIndex === 6 || selectedCarIndex === 11) {
            targetScale *= 0.3; // yalnızca seçim ekranında yaklaşık %70 daha küçük
            console.log('🎚 Özel showcase ölçek faktörü uygulandı (0.3x):', targetScale);
        }
        
        // Scale animasyonu - yumuşak giriş
        let scaleProgress = 0;
        const scaleAnimation = () => {
            scaleProgress += 0.05;
            if (scaleProgress < 1) {
                const easeOut = 1 - Math.pow(1 - scaleProgress, 3); // Ease out cubic
                currentDisplayedCar.scale.setScalar(easeOut * targetScale);
                requestAnimationFrame(scaleAnimation);
            } else {
                currentDisplayedCar.scale.setScalar(targetScale);
            }
        };
        scaleAnimation();
        
        console.log('✅ Yeni araba Y=0.7 merkezde eklendi:', currentDisplayedCar.position);
        
        // Gelişmiş gölge ve ışık ayarları
        currentDisplayedCar.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Material'ları daha parlak yap
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            if (mat.emissive) {
                                mat.emissiveIntensity = 0.1;
                            }
                        });
                    } else {
                        if (child.material.emissive) {
                            child.material.emissiveIntensity = 0.1;
                        }
                    }
                }
            }
        });
        
        carSelectionScene.add(currentDisplayedCar);
        
        // Araç değişiminde parçacık efekti (görsel feedback)
        createCarChangeEffect();
    } else {
        console.warn('⚠️ Araç modeli yüklenmemiş:', selectedCarIndex);
        console.warn('📦 Yüklenmiş modeller:', loadedCarModels ? loadedCarModels.map((m, i) => m ? i : null).filter(i => i !== null) : 'yok');
        
        // Model henüz yüklenmemişse, yüklenene kadar bekle ve tekrar dene
        if (!loadedCarModels || loadedCarModels.length === 0 || !loadedCarModels[selectedCarIndex]) {
            console.log('⏳ Model yükleniyor, bekleniyor...');
            setTimeout(() => {
                if (loadedCarModels && loadedCarModels[selectedCarIndex]) {
                    updateCarDisplay();
                }
            }, 500);
        }
    }
    
    
    const carInfoPanel = document.getElementById('carInfoPanel');
    const carIndexDisplay = document.getElementById('carIndexDisplay');
    
    if (carInfoPanel) {
        const car = AVAILABLE_CARS[selectedCarIndex];
        
        // Performans değerleri (araç tipine göre)
        const isGangCar = [1, 3, 4, 5, 6, 8, 12].includes(selectedCarIndex);
        const speedValue = isGangCar ? 85 + Math.floor(Math.random() * 15) : 60 + Math.floor(Math.random() * 20);
        const powerValue = isGangCar ? 90 + Math.floor(Math.random() * 10) : 70 + Math.floor(Math.random() * 20);
        const handlingValue = isGangCar ? 75 + Math.floor(Math.random() * 15) : 80 + Math.floor(Math.random() * 15);
        const nitroValue = isGangCar ? 95 + Math.floor(Math.random() * 5) : 70 + Math.floor(Math.random() * 20);
        
        carInfoPanel.innerHTML = `
            <div style="position: relative;">
                <h3 style="margin: 0 0 15px 0; color: #FFD700; font-size: 28px; text-shadow: 0 0 20px rgba(255, 215, 0, 0.8); animation: titlePulse 2s ease-in-out infinite;">
                    ${car.name}
                </h3>
                <p style="margin: 0 0 20px 0; color: #00FFFF; font-size: 14px; line-height: 1.6;">${car.description}</p>
                
                <!-- Performans Göstergeleri -->
                <div style="margin-top: 20px; border-top: 1px solid rgba(0, 255, 255, 0.3); padding-top: 15px;">
                    <div style="color: #00FFFF; font-size: 18px; margin-bottom: 15px; font-weight: bold; text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);">
                        ⚡ PERFORMANCE METRICS
                    </div>
                    
                    <!-- Hız -->
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: #FFFFFF; font-size: 13px;">🚀 HIZ</span>
                            <span style="color: #FFD700; font-size: 13px; font-weight: bold;">${speedValue}%</span>
                        </div>
                        <div style="background: rgba(0, 0, 0, 0.5); height: 8px; border-radius: 4px; overflow: hidden; border: 1px solid rgba(0, 255, 255, 0.3);">
                            <div class="statBar" data-value="${speedValue}" style="background: linear-gradient(90deg, #00FFFF, #00FF88); height: 100%; width: 0%; transition: width 1s ease-out; box-shadow: 0 0 10px rgba(0, 255, 255, 0.6);"></div>
                        </div>
                    </div>
                    
                    <!-- Güç -->
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: #FFFFFF; font-size: 13px;">💪 GÜÇ</span>
                            <span style="color: #FFD700; font-size: 13px; font-weight: bold;">${powerValue}%</span>
                        </div>
                        <div style="background: rgba(0, 0, 0, 0.5); height: 8px; border-radius: 4px; overflow: hidden; border: 1px solid rgba(255, 68, 0, 0.3);">
                            <div class="statBar" data-value="${powerValue}" style="background: linear-gradient(90deg, #FF4400, #FF8800); height: 100%; width: 0%; transition: width 1s ease-out; box-shadow: 0 0 10px rgba(255, 68, 0, 0.6);"></div>
                        </div>
                    </div>
                    
                    <!-- Manevra -->
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: #FFFFFF; font-size: 13px;">🎯 MANEVRA</span>
                            <span style="color: #FFD700; font-size: 13px; font-weight: bold;">${handlingValue}%</span>
                        </div>
                        <div style="background: rgba(0, 0, 0, 0.5); height: 8px; border-radius: 4px; overflow: hidden; border: 1px solid rgba(0, 255, 0, 0.3);">
                            <div class="statBar" data-value="${handlingValue}" style="background: linear-gradient(90deg, #00FF00, #88FF00); height: 100%; width: 0%; transition: width 1s ease-out; box-shadow: 0 0 10px rgba(0, 255, 0, 0.6);"></div>
                        </div>
                    </div>
                    
                    <!-- Nitro -->
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: #FFFFFF; font-size: 13px;">⚡ NİTRO</span>
                            <span style="color: #FFD700; font-size: 13px; font-weight: bold;">${nitroValue}%</span>
                        </div>
                        <div style="background: rgba(0, 0, 0, 0.5); height: 8px; border-radius: 4px; overflow: hidden; border: 1px solid rgba(255, 215, 0, 0.3);">
                            <div class="statBar" data-value="${nitroValue}" style="background: linear-gradient(90deg, #FFD700, #FFA500); height: 100%; width: 0%; transition: width 1s ease-out; box-shadow: 0 0 10px rgba(255, 215, 0, 0.6);"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Durum -->
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(0, 255, 255, 0.3);">
                    <div style="color: #00FF00; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 20px;">${loadedCarModels[selectedCarIndex] ? '✅' : '❌'}</span>
                        <span><strong>Durum:</strong> ${loadedCarModels[selectedCarIndex] ? 'Hazır' : 'Yüklenmedi'}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Stat bar animasyonlarını başlat
        setTimeout(() => {
            const statBars = carInfoPanel.querySelectorAll('.statBar');
            statBars.forEach(bar => {
                const value = parseInt(bar.getAttribute('data-value'));
                bar.style.width = value + '%';
            });
        }, 100);
    }
    
    if (carIndexDisplay) {
        carIndexDisplay.textContent = `${selectedCarIndex + 1} / ${AVAILABLE_CARS.length}`;
    }
}





async function loadRoadModels() {
    console.log('🛣️ Yol modelleri yükleniyor...');
    
    return Promise.resolve();
}


function createCoins() {
    
    coins.forEach(coin => scene.remove(coin));
    coins = [];

    
    const coinCount = 20;
    for (let i = 0; i < coinCount; i++) {
        const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
        const coinMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        
        const lane = Math.floor(Math.random() * 4);
        const z = 20 + i * 10 + Math.random() * 5;
        
        coin.position.set(getXFromLane(lane), 1, z);
        coin.rotation.x = Math.PI / 2;
        coin.castShadow = true;
        
        coin.userData = {
            lane: lane,
            z: z,
            collected: false
        };
        
        coins.push(coin);
        scene.add(coin);
    }
}

function updateCoins() {
    if (!playerCar) return;
    
    coins.forEach((coin, index) => {
        if (coin.userData.collected) return;
        
        
        coin.rotation.y += 0.05;
        coin.position.y = 1 + Math.sin(Date.now() * 0.005 + index) * 0.2;
        
        
        const playerBox = new THREE.Box3().setFromObject(playerCar);
        const coinBox = new THREE.Box3().setFromObject(coin);
        
        if (playerBox.intersectsBox(coinBox)) {
            coin.userData.collected = true;
            scene.remove(coin);
            coinCount++;
            score += 100;
            console.log(`💰 Coin toplandı! Toplam: ${coinCount}`);
        }
        
        
        if (coin.position.z < carZ - 50) { 
            const newLane = Math.floor(Math.random() * 4);
            coin.position.set(
                getXFromLane(newLane), 
                1, 
                carZ + 100 + Math.random() * 50 
            );
            coin.userData.z = coin.position.z;
            coin.userData.lane = newLane;
            coin.userData.collected = false;
            
            
            if (!scene.children.includes(coin)) {
                scene.add(coin);
            }
            
            console.log(`🔄 Coin yeniden konumlandırıldı: Lane ${newLane}, Z=${Math.floor(coin.position.z)}`);
        }
    });
    
    
    const activeCoinCount = coins.filter(coin => !coin.userData.collected).length;
    if (activeCoinCount < 10) { 
        console.log(`🪙 Coin sayısı az (${activeCoinCount}), yenileri ekleniyor...`);
        addMoreCoins(10 - activeCoinCount);
    }
}

function createWeatherSystem(mapType) {
    console.log(`🌤️ ${mapType.name} haritası için hava durumu oluşturuluyor...`);
}

function updateWeatherEffects() {
    
}

function switchCameraMode() {
    currentCameraMode = (currentCameraMode + 1) % 4;
    
    if (steeringWheel) {
        steeringWheel.visible = (currentCameraMode === CAMERA_MODES.FIRST_PERSON);
    }
    
    console.log(`📷 Kamera modu: ${Object.keys(CAMERA_MODES)[currentCameraMode]}`);
}

function updateCamera() {
    if (!playerCar || !camera) return;
    
    const carPos = playerCar.position;
    
    switch(currentCameraMode) {
        case CAMERA_MODES.THIRD_PERSON:
            camera.position.set(
                carPos.x,
                carPos.y + cameraHeight,
                carPos.z - cameraDistance
            );
            camera.lookAt(carPos.x, carPos.y, carPos.z + 5);
            break;
            case CAMERA_MODES.CLOSE_VIEW:
            
            camera.position.set(
                carPos.x,
                carPos.y + 1.5,     
                carPos.z - 4        
            );
            camera.lookAt(carPos.x, carPos.y + 0.5, carPos.z + 3);
            break;
        case CAMERA_MODES.FIRST_PERSON:
            camera.position.set(
                carPos.x,
                carPos.y + 1.2,
                carPos.z + 0.5
            );
            camera.lookAt(carPos.x, carPos.y, carPos.z + 10);
            break;
            
        case CAMERA_MODES.FRONT_VIEW:
            camera.position.set(
                carPos.x,
                carPos.y + 2,
                carPos.z + 8
            );
            camera.lookAt(carPos.x, carPos.y, carPos.z);
            break;
    }
}

function showMusicNotification() {
    console.log(`🎵 Müzik: ${musicEnabled ? 'AÇIK' : 'KAPALI'}`);
}

function showMoonControlNotification() {
    if (!isNightMode) return;
    console.log(`🌙 Ay hareket modu: ${canMoveMoon ? 'AÇIK' : 'KAPALI'}`);
}



window.addEventListener('load', async () => {
    console.log('🚀 Oyun başlatılıyor...');
    console.log('THREE:', typeof THREE !== 'undefined');
    console.log('GLTFLoader:', typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined');
    
    // THREE.js kontrolü
    if (typeof THREE === 'undefined') {
        console.error('❌ THREE.js yüklenemedi!');
        document.body.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: rgba(255, 0, 0, 0.9); color: white; padding: 30px; 
                        border-radius: 15px; text-align: center; z-index: 9999;">
                <h2>❌ THREE.js Yüklenemedi</h2>
                <p>Sayfayı yenileyin.</p>
            </div>
        `;
        return;
    }
    
    // GLTFLoader kontrolü
    if (!loader) {
        console.error('❌ GLTFLoader yüklenemedi!');
        document.body.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: rgba(255, 0, 0, 0.9); color: white; padding: 30px; 
                        border-radius: 15px; text-align: center; z-index: 9999;">
                <h2>❌ GLTFLoader Yüklenemedi</h2>
                <p>Sayfayı yenileyin.</p>
            </div>
        `;
        return;
    }
    
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
    
    createCanvas();
    createGameUI();
    
    try {
        console.log('📦 Araç modelleri yükleniyor...');
        await loadCarModelsForSelection();
        console.log('✅ Araç modelleri yüklendi');
        
        console.log('🎨 Menü oluşturuluyor...');
        createDayNightSelectionMenu();
        
        console.log('✅ 3D WebGL Araba Yarış Simülasyonu yüklendi!');
        console.log('Önce zaman seçin, sonra araç seçin ve oyunu başlatın!');
        
    } catch (error) {
        console.error('❌ Oyun yüklenirken hata oluştu:', error);
        console.error('Hata detayı:', error.stack);
        
        
        document.body.innerHTML = `
            <div style="
                position: fixed; 
                top: 50%; 
                left: 50%; 
                transform: translate(-50%, -50%);
                background: rgba(255, 0, 0, 0.9);
                color: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                font-family: Arial, sans-serif;
                z-index: 9999;
            ">
                <h2>🚗 Oyun Yükleme Hatası</h2>
                <p>Oyun dosyaları yüklenirken bir hata oluştu.</p>
                <p><strong>Hata:</strong> ${error.message}</p>
                <p><small>Lütfen sayfayı yenileyin veya konsolu kontrol edin.</small></p>
                <button onclick="location.reload()" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 15px;
                ">Sayfayı Yenile</button>
            </div>
        `;
    }
});



function carSelectionAnimationLoop() {
    
    if (!carSelectionRenderer || !carSelectionScene || !carSelectionCamera) {
        console.warn('⚠️ Araç seçim animasyon döngüsü durduruluyor - eksik objeler');
        return;
    }
    
    try {
        
        if (currentDisplayedCar) {
            // Yavaş 360° döndürme - daha smooth
            currentDisplayedCar.rotation.y += 0.008; 
            
            // Yumuşak yukarı-aşağı hareket
            currentDisplayedCar.position.y = 0.7 + Math.sin(Date.now() * 0.002) * 0.15;
            
            // Hafif sallanma efekti (daha dinamik)
            currentDisplayedCar.rotation.z = Math.sin(Date.now() * 0.003) * 0.05;
            currentDisplayedCar.rotation.x = Math.sin(Date.now() * 0.004) * 0.03;
        }
        
        // Kamera animasyonu - yumuşak hareket
        if (carSelectionCamera) {
            const time = Date.now() * 0.0005;
            carSelectionCamera.position.x = Math.sin(time) * 0.5;
            carSelectionCamera.position.y = 2 + Math.cos(time * 0.7) * 0.3;
            carSelectionCamera.lookAt(0, 0.7, 0);
        }
        
        
        carSelectionScene.traverse((object) => {
            if (object.name === 'rotatingRing') {
                object.rotation.y += 0.008; // Dış halka
            }
            if (object.name === 'innerRotatingRing') {
                object.rotation.y -= 0.012; // İç halka ters yönde
            }
        });
        
        // Platform ışığının pulse efekti
        const platformLight = carSelectionScene.children.find(child => child.isPointLight && child.position.y < 0);
        if (platformLight) {
            platformLight.intensity = 1.5 + Math.sin(Date.now() * 0.005) * 0.5;
        }
        
        
        carSelectionRenderer.render(carSelectionScene, carSelectionCamera);
        
        
        carSelectionAnimationId = requestAnimationFrame(carSelectionAnimationLoop);
        
    } catch (error) {
        console.error('❌ Araç seçim animasyon hatası:', error);
        
        if (carSelectionAnimationId) {
            cancelAnimationFrame(carSelectionAnimationId);
            carSelectionAnimationId = null;
        }
    }
}

function changeMap() {
    
    if (coinCount < COINS_PER_MAP_CHANGE) {
        console.log(`❌ Harita değişimi için ${COINS_PER_MAP_CHANGE} coin gerekli. Mevcut: ${coinCount}`);
        return false;
    }
    
    
    coinCount -= COINS_PER_MAP_CHANGE;
    
    
    const oldMapIndex = currentMapIndex;
    
    
    currentMapIndex = (currentMapIndex + 1) % MAP_TYPES.length;
    
    const newMap = MAP_TYPES[currentMapIndex];
    
    console.log(`🗺️ Harita değişimi: ${MAP_TYPES[oldMapIndex].name} → ${newMap.name}`);
    console.log(`🪙 Coin harcandı: ${COINS_PER_MAP_CHANGE}, Kalan: ${coinCount}`);
    console.log(`📍 Yeni harita index: ${currentMapIndex}/${MAP_TYPES.length - 1}`);



       createRoad(newMap);
    
        if (selectedCarIndex !== 12) {
        playMapMusic(currentMapIndex);
    } else {
        console.log(`🎵 BMW M3 aktif - müzik devam ediyor: ${currentMusic?.src || 'Yok'}`);
    }

    createRoad(newMap);
    
    
  
    
    
    clearObstaclesAndCoins();
    
    
    createObstacles();
    createCoins();
    
    
    showMapChangeNotification(newMap);
    
    return true;
}

function clearObstaclesAndCoins() {
    
    obstacles.forEach(obstacle => {
        scene.remove(obstacle);
        if (obstacle.geometry) obstacle.geometry.dispose();
        if (obstacle.material) obstacle.material.dispose();
    });
    obstacles = [];
    
    
    coins.forEach(coin => {
        scene.remove(coin);
        if (coin.geometry) coin.geometry.dispose();
        if (coin.material) coin.material.dispose();
    });
    coins = [];
    
    console.log('🧹 Engeller ve coin\'ler temizlendi');
}

function addMoreCoins(count) {
    for (let i = 0; i < count; i++) {
        const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
        const coinMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        
        const lane = Math.floor(Math.random() * 4);
        const z = carZ + 80 + i * 15 + Math.random() * 20; 
        
        coin.position.set(getXFromLane(lane), 1, z);
        coin.rotation.x = Math.PI / 2;
        coin.castShadow = true;
        
        coin.userData = {
            lane: lane,
            z: z,
            collected: false
        };
        
        coins.push(coin);
        scene.add(coin);
    }
    
    console.log(`✅ ${count} yeni coin eklendi. Toplam aktif coin: ${coins.filter(c => !c.userData.collected).length}`);
}


function initiateJump() {
    
    if (isJumping || jumpCooldown) {
        console.log('🚫 Zıplama cooldown aktif veya zaten zıplıyor');
        return;
    }
    
    
    isJumping = true;
    jumpVelocity = jumpSpeed;
    jumpStartY = playerCar.position.y;
    jumpCooldown = true;
    
    console.log('🦘 ZIPLAMA BAŞLADI! Mevcut Y:', jumpStartY);
    
    
    playJumpSound();
    
    
    if (playerCar) {
        playerCar.rotation.x = -0.2; 
    }
    
    
    setTimeout(() => {
        jumpCooldown = false;
        console.log('✅ Zıplama cooldown bitti');
    }, jumpCooldownTime);
}

function updateJump() {
    if (!isJumping || !playerCar) return;
    
    
    jumpVelocity -= gravity;
    
    
    playerCar.position.y += jumpVelocity;
    
    
    if (playerCar.position.y <= jumpStartY) {
        
        playerCar.position.y = jumpStartY;
        isJumping = false;
        jumpVelocity = 0;
        
        
        playerCar.rotation.x = 0;
        
        console.log('🛬 Zıplama bitti, zemine indi');
        
        
        playLandingSound();
    }
    
    
    if (playerCar.position.y > jumpStartY + jumpHeight) {
        playerCar.position.y = jumpStartY + jumpHeight;
        jumpVelocity = 0; 
    }
}


function isCarInAir() {
    return isJumping && playerCar && playerCar.position.y > jumpStartY + 0.5;
}


function playJumpSound() {
    try {
        
        console.log('🔊 ZIPLAMA SESİ: WHOOSH!');
        
        
        if (typeof AudioContext !== 'undefined') {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    } catch (error) {
        console.warn('Zıplama ses efekti çalınamadı:', error);
    }
}

function playLandingSound() {
    try {
        console.log('🔊 İNİŞ SESİ: THUD!');
        
        
        if (typeof AudioContext !== 'undefined') {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        }
    } catch (error) {
        console.warn('İniş ses efekti çalınamadı:', error);
    }
}


function showJumpBonus() {
    let bonusDiv = document.getElementById('jumpBonus');
    if (!bonusDiv) {
        bonusDiv = document.createElement('div');
        bonusDiv.id = 'jumpBonus';
        bonusDiv.style.position = 'absolute';
        bonusDiv.style.top = '30%';
        bonusDiv.style.left = '50%';
        bonusDiv.style.transform = 'translate(-50%, -50%)';
        bonusDiv.style.background = 'rgba(255, 215, 0, 0.9)';
        bonusDiv.style.color = '#000000';
        bonusDiv.style.padding = '20px 30px';
        bonusDiv.style.borderRadius = '15px';
        bonusDiv.style.fontSize = '24px';
        bonusDiv.style.textAlign = 'center';
        bonusDiv.style.zIndex = '1001';
        bonusDiv.style.border = '3px solid #FF6600';
        bonusDiv.style.boxShadow = '0 0 25px rgba(255, 165, 0, 0.8)';
        bonusDiv.style.fontWeight = 'bold';
        bonusDiv.style.display = 'none';
        document.body.appendChild(bonusDiv);
    }
    
    bonusDiv.innerHTML = `
        🦘 ZIPLAMA BONUSU! 🦘<br>
        <span style="color: #FF6600;">+500 Puan</span><br>
        <span style="color: #FFD700;">+2 Coin</span>
    `;
    
    bonusDiv.style.display = 'block';
    
    
    setTimeout(() => {
        bonusDiv.style.display = 'none';
    }, 2000);
}
function restartGame() {
    
    const gameOverDiv = document.getElementById('gameOver');
    if (gameOverDiv) {
        gameOverDiv.style.display = 'none';
    }
    
    console.log('🔄 Oyun yeniden başlıyor - Varsayılan müziğe dönülüyor...');
    playMapMusic(0);
    
    
    gameActive = true; 
    score = 0;
    coinCount = 0;
    carPosition = 1;
    carTargetX = getXFromLane(carPosition);
    carZ = 0;
    carSpeed = initialCarSpeed;
    currentMapIndex = 0;
    currentCameraMode = CAMERA_MODES.THIRD_PERSON;
    canMoveMoon = false;
    
    
    isJumping = false;
    jumpVelocity = 0;
    jumpCooldown = false;
    
    
    if (playerCar) {
        playerCar.position.set(getXFromLane(carPosition), jumpStartY, carZ);
        
        const selectedCarName = AVAILABLE_CARS[selectedCarIndex].name;
        const correctRotation = CAR_ROTATIONS[selectedCarName] || 0;
        playerCar.rotation.set(0, correctRotation, 0);
        
        console.log(`🔄 ${selectedCarName} restart rotasyonu: ${(correctRotation * 180 / Math.PI).toFixed(0)}°`);
    }
    
    
    if (steeringWheel) {
        steeringWheel.visible = false;
    }
    
    
    obstacles.forEach(obstacle => {
        scene.remove(obstacle);
    });
    createObstacles();
    
    
    coins.forEach(coin => {
        scene.remove(coin);
    });
    createCoins();
    
    
    createRoad(MAP_TYPES[0]);
    
    
    nitroLights.forEach(light => {
        light.intensity = 0;
    });
    
    
    if (isNightMode && moonObject) {
        moonObject.position.set(0, 80, -40);
        updateMoonPosition();
    }
    
    console.log('✅ Oyun yeniden başlatıldı! gameActive:', gameActive);
}

function toggleCarSelectionLights() {
    carSelectionLightsEnabled = !carSelectionLightsEnabled;
    
    console.log(`💡 Araç seçim ışıkları: ${carSelectionLightsEnabled ? 'AÇILDI' : 'KAPATILDI'}`);
    
    
    updateLightToggleButton();
    
    
    updateCarSelectionSceneLights();
    
    
    playLightToggleSound();
}

function updateLightToggleButton() {
    if (!lightToggleButton) return;
    
    lightToggleButton.innerHTML = carSelectionLightsEnabled ? '💡 Light: ON' : '🌙 Light: OFF';
    lightToggleButton.style.background = carSelectionLightsEnabled ? 
        'linear-gradient(45deg, #FFD700, #FFA500)' : 
        'linear-gradient(45deg, #2C3E50, #34495E)';
    
    
    lightToggleButton.style.transform = 'scale(1.2)';
    setTimeout(() => {
        lightToggleButton.style.transform = 'scale(1)';
    }, 200);
}

function updateCarSelectionSceneLights() {
    if (!carSelectionScene) return;
    
    
    carSelectionScene.traverse((child) => {
        if (child.isLight) {
            child.visible = carSelectionLightsEnabled;
            
            
            if (carSelectionLightsEnabled) {
                
                if (child.isAmbientLight) {
                    child.intensity = 0.6;
                } else if (child.isSpotLight) {
                    child.intensity = 1.5;
                } else if (child.isPointLight) {
                    child.intensity = 1.0;
                } else if (child.isDirectionalLight) {
                    child.intensity = 0.4;
                }
            } else {
                child.intensity = 0;
            }
        }
    });
    
    
    if (carSelectionScene.background) {
        if (carSelectionLightsEnabled) {
            
            carSelectionScene.background.setHex(0x1a1a2e);
        } else {
            
            carSelectionScene.background.setHex(0x000000);
        }
    }
    
    console.log(`🔄 Sahne ışıkları güncellendi: ${carSelectionLightsEnabled ? 'Açık' : 'Kapalı'}`);
}

function playLightToggleSound() {
    try {
        
        if (typeof AudioContext !== 'undefined') {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (carSelectionLightsEnabled) {
                
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
                console.log('🔊 IŞIK AÇMA SESİ: DING!');
            } else {
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
                console.log('🔊 IŞIK KAPAMA SESİ: DONG!');
            }
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        }
    } catch (error) {
        console.warn('Işık ses efekti çalınamadı:', error);
    }
}


function createLightIntensityPanel() {
    lightIntensityPanel = document.createElement('div');
    lightIntensityPanel.id = 'lightIntensityPanel';
    lightIntensityPanel.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #FFD700;
        border-radius: 15px;
        padding: 20px;
        color: white;
        font-family: Arial, sans-serif;
        font-size: 14px;
        min-width: 300px;
        max-height: 400px;
        overflow-y: auto;
        z-index: 2002;
        backdrop-filter: blur(10px);
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
        display: none;
        transition: all 0.3s ease;
    `;

    
    const title = document.createElement('h3');
    title.textContent = '🎛️ Light Intensity Control';
    title.style.cssText = `
        margin: 0 0 20px 0;
        color: #FFD700;
        text-align: center;
        border-bottom: 2px solid #FFD700;
        padding-bottom: 10px;
    `;
    lightIntensityPanel.appendChild(title);

    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '❌';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(255, 0, 0, 0.8);
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        color: white;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s ease;
    `;
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = 'rgba(255, 0, 0, 1)';
        closeButton.style.transform = 'scale(1.1)';
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'rgba(255, 0, 0, 0.8)';
        closeButton.style.transform = 'scale(1)';
    });
    closeButton.addEventListener('click', () => {
        lightIntensityPanel.style.display = 'none';
    });
    lightIntensityPanel.appendChild(closeButton);

    
    createLightSlider('🌅 Ortam Işığı', 'ambient', 0, 2, 0.1);
    createLightSlider('💡 Spot Işık', 'spot', 0, 5, 0.1);
    createLightSlider('🔆 Point Işık', 'point', 0, 3, 0.1);
    createLightSlider('🌞 Directional Işık', 'directional', 0, 2, 0.1);

    
    const presetContainer = document.createElement('div');
    presetContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 20px;
        border-top: 1px solid #FFD700;
        padding-top: 15px;
    `;

    const presets = [
        { name: '🌅 Gündüz', values: { ambient: 1.0, spot: 2.0, point: 1.5, directional: 0.8 } },
        { name: '🌙 Gece', values: { ambient: 0.2, spot: 0.5, point: 0.3, directional: 0.1 } },
        { name: '🔥 Dramatik', values: { ambient: 0.1, spot: 3.0, point: 2.0, directional: 0.0 } },
        { name: '🌈 Renkli', values: { ambient: 0.8, spot: 1.5, point: 2.0, directional: 1.0 } },
        { name: '🔄 Sıfırla', values: { ambient: 0.6, spot: 1.5, point: 1.0, directional: 0.4 } }
    ];

    presets.forEach(preset => {
        const btn = document.createElement('button');
        btn.textContent = preset.name;
        btn.style.cssText = `
            padding: 8px 12px;
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s ease;
            flex: 1;
            min-width: 80px;
        `;
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.1)';
            btn.style.background = 'linear-gradient(45deg, #5CBF60, #50b959)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
            btn.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
        });
        btn.addEventListener('click', () => applyLightPreset(preset.values));
        presetContainer.appendChild(btn);
    });

    lightIntensityPanel.appendChild(presetContainer);
    document.body.appendChild(lightIntensityPanel);
}

function createLightSlider(label, key, min, max, step) {
    const container = document.createElement('div');
    container.style.cssText = 'margin-bottom: 15px;';

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.cssText = `
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: #FFD700;
    `;

    const sliderContainer = document.createElement('div');
    sliderContainer.style.cssText = 'display: flex; align-items: center; gap: 10px;';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = lightSliders[key];
    slider.style.cssText = `
        flex: 1;
        height: 8px;
        background: linear-gradient(to right, #333, #FFD700);
        outline: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
    `;

    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = lightSliders[key].toFixed(1);
    valueDisplay.style.cssText = `
        color: #FFD700;
        font-weight: bold;
        min-width: 40px;
        text-align: center;
        background: rgba(255, 215, 0, 0.2);
        padding: 4px 8px;
        border-radius: 5px;
        border: 1px solid #FFD700;
    `;

    slider.addEventListener('input', () => {
        const value = parseFloat(slider.value);
        lightSliders[key] = value;
        valueDisplay.textContent = value.toFixed(1);
        updateLightIntensity(key, value);
        
        
        const percent = ((value - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(to right, #333 0%, #FFD700 ${percent}%, #333 ${percent}%, #333 100%)`;
    });

    
    const percent = ((lightSliders[key] - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, #333 0%, #FFD700 ${percent}%, #333 ${percent}%, #333 100%)`;

    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(valueDisplay);
    container.appendChild(labelElement);
    container.appendChild(sliderContainer);
    lightIntensityPanel.appendChild(container);
}

function updateLightIntensity(lightType, value) {
    if (!carSelectionLightsEnabled) return; 
    
    
    switch(lightType) {
        case 'ambient':
            if (carSelectionLights.ambient) {
                carSelectionLights.ambient.intensity = value;
                console.log(`🌅 Ortam ışığı güncellendi: ${value.toFixed(1)}`);
            }
            break;
        case 'spot':
            if (carSelectionLights.spot) {
                carSelectionLights.spot.intensity = value;
                console.log(`💡 Spot ışığı güncellendi: ${value.toFixed(1)}`);
            }
            break;
        case 'point':
            if (carSelectionLights.back) {
                carSelectionLights.back.intensity = value;
                console.log(`🔆 Point ışığı güncellendi: ${value.toFixed(1)}`);
            }
            break;
        case 'directional':
            if (carSelectionLights.lamp) {
                carSelectionLights.lamp.intensity = value;
                console.log(`🌞 Directional ışığı güncellendi: ${value.toFixed(1)}`);
            }
            break;
        default:
            console.warn('⚠️ Bilinmeyen ışık tipi:', lightType);
    }
}

function applyLightPreset(values) {
    Object.keys(values).forEach(key => {
        lightSliders[key] = values[key];
        updateLightIntensity(key, values[key]);
    });
    
    
    const sliders = lightIntensityPanel.querySelectorAll('input[type="range"]');
    const valueDisplays = lightIntensityPanel.querySelectorAll('span[style*="min-width: 40px"]');
    
    Object.keys(lightSliders).forEach((key, index) => {
        if (sliders[index]) {
            sliders[index].value = lightSliders[key];
            
            
            const min = parseFloat(sliders[index].min);
            const max = parseFloat(sliders[index].max);
            const percent = ((lightSliders[key] - min) / (max - min)) * 100;
            sliders[index].style.background = `linear-gradient(to right, #333 0%, #FFD700 ${percent}%, #333 ${percent}%, #333 100%)`;
        }
        
        if (valueDisplays[index]) {
            valueDisplays[index].textContent = lightSliders[key].toFixed(1);
        }
    });
    
    console.log('🎨 Işık preset uygulandı:', values);
}

function toggleLightIntensityPanel() {
    if (!lightIntensityPanel) {
        createLightIntensityPanel();
    }
    
    const isVisible = lightIntensityPanel.style.display !== 'none';
    
    if (isVisible) {
        
        lightIntensityPanel.style.transform = 'scale(0.8)';
        lightIntensityPanel.style.opacity = '0';
        setTimeout(() => {
            lightIntensityPanel.style.display = 'none';
        }, 300);
    } else {
        
        lightIntensityPanel.style.display = 'block';
        lightIntensityPanel.style.transform = 'scale(0.8)';
        lightIntensityPanel.style.opacity = '0';
        setTimeout(() => {
            lightIntensityPanel.style.transform = 'scale(1)';
            lightIntensityPanel.style.opacity = '1';
        }, 50);
    }
    
    console.log(`🎛️ Işık miktarı paneli: ${isVisible ? 'KAPATILDI' : 'AÇILDI'}`);
}