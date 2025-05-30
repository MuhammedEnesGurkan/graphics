








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
    
    const box1 = new THREE.Box3().setFromObject(obstacle);
    const box2 = new THREE.Box3().setFromObject(playerCar);

    return box1.intersectsBox(box2);
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


const loader = new THREE.GLTFLoader();


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
  
    
    gameLoop();
}

function setupLighting() {
    
    if (isNightMode) {
        
        setupNightLighting();
    } else {
        
        setupDayLighting();
    }
    
    
    const ambientLight = new THREE.AmbientLight(0x404040, isNightMode ? 0.4 : 0.8);
    scene.add(ambientLight);
    
    
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


function setupDayLighting() {
    
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


function setupNightLighting() {
    
    moonLight = new THREE.DirectionalLight(0xaabbff, 1.5); 
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

        
        const headlightLeft = new THREE.SpotLight(0xffffff, isNightMode ? 2.0 : 1.2, 15, Math.PI / 6, 0.4);
        headlightLeft.position.set(-0.3, 0.5, 1.0);
        headlightLeft.castShadow = true;
        headlightLeft.shadow.mapSize.width = 512;
        headlightLeft.shadow.mapSize.height = 512;
        headlightLeft.shadow.camera.near = 0.2;
        headlightLeft.shadow.camera.far = 15;
        
        const leftTarget = new THREE.Object3D();
        leftTarget.position.set(-1, 0, 15);
        playerCar.add(leftTarget);
        headlightLeft.target = leftTarget;
        
        playerCar.add(headlightLeft);

        const headlightRight = new THREE.SpotLight(0xffffff, isNightMode ? 2.0 : 1.2, 15, Math.PI / 6, 0.4);
        headlightRight.position.set(0.3, 0.5, 1.0);
        headlightRight.castShadow = true;
        headlightRight.shadow.mapSize.width = 512;
        headlightRight.shadow.mapSize.height = 512;
        headlightRight.shadow.camera.near = 0.2;
        headlightRight.shadow.camera.far = 15;
        
        const rightTarget = new THREE.Object3D();
        rightTarget.position.set(1, 0, 15);
        playerCar.add(rightTarget);
        headlightRight.target = rightTarget;
        
        playerCar.add(headlightRight);

        carHeadlights.push(headlightLeft, headlightRight);

        
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
        
        const nitroTailLightLeft = new THREE.PointLight(0xff0000, 0, 5);
        nitroTailLightLeft.position.set(-0.32, 0.28, -1.12);
        playerCar.add(nitroTailLightLeft);

        const nitroTailLightRight = new THREE.PointLight(0xff0000, 0, 5);
        nitroTailLightRight.position.set(0.32, 0.28, -1.12);
        playerCar.add(nitroTailLightRight);

        nitroLights.push(nitroLightLeft, nitroLightRight, nitroTailLightLeft, nitroTailLightRight);
        
        
        createSteeringWheel();
        
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

    const obstacleCount = 10;
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
const isGangCar = [3, 4, 5, 6,8].includes(selectedCarIndex); 
  
 
    const BASE_MAX_SPEED = isGangCar ? 0.7 : 0.5; 
  const SPEED_INCREMENT = isGangCar ? 0.05 : 0.03; 
  let targetSpeed = initialCarSpeed + Math.floor(coinCount / 15) * SPEED_INCREMENT;
  targetSpeed = Math.min(targetSpeed, BASE_MAX_SPEED);
  if (brakeActive) targetSpeed -= 0.1;
  
  
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
    
    
    nitroLights.forEach(light => {
        light.intensity = 2 + Math.random() * 0.5; 
    });
    
    
    carHeadlights.forEach(headlight => {
        headlight.intensity = 2 + Math.random() * 0.3; 
        headlight.color.setHex(0xaaffff); 
    });
      const nitroBoost = isGangCar ? 0.35 : 0.25; 
    targetSpeed += nitroBoost;
    
   
  } else {
    nitroSpriteLeft.visible = false;
    nitroSpriteRight.visible = false;
    if (nitroGlow && nitroLeft && nitroRight) {
        nitroGlow.visible = false;
        nitroLeft.visible = false;
        nitroRight.visible = false;
    }
    
    
    nitroLights.forEach(light => {
        light.intensity = 0;
    });
    
    
    carHeadlights.forEach(headlight => {
        headlight.intensity = 1; 
        headlight.color.setHex(0xffffff); 
    });
  }
const ABSOLUTE_MAX_SPEED = isGangCar ? 1.2 : 0.8;
  
  carSpeed = Math.max(0.05, Math.min(targetSpeed, ABSOLUTE_MAX_SPEED));

 document.getElementById('speedValue').textContent = Math.floor(carSpeed * 1000);

  
  if (coinCount >= COINS_PER_MAP_CHANGE) {
    
    const success = changeMap();
    if (success) {
      console.log(`✅ Otomatik harita değişimi başarılı: ${MAP_TYPES[currentMapIndex].name}`);
    }
  }



const selectedCarName = AVAILABLE_CARS[selectedCarIndex].name;
const selectedCarMusic = AVAILABLE_CARS[selectedCarIndex].music;


if ([3, 4, 5, 6].includes(selectedCarIndex) && currentMapIndex === 0) { 
    
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

else if ((selectedCarIndex === 7 || selectedCarIndex === 9)  && currentMapIndex === 0){ 
    
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
else {
    
    if (currentMusic && (
        currentMusic.src.includes('Gang_Cars.mp3') || 
        currentMusic.src.includes('Finn.mp3')
    )) {
        console.log(`🎵 ${selectedCarName} özel müziği durduruluyor - normal müziğe dönülüyor...`);
        playMapMusic(currentMapIndex);
    }
}


  displayDebugInfo();

  
  carZ += carSpeed;

  
  updateJump();

  
  if (playerCar) {
    playerCar.position.z = carZ;
    updateCarPosition();

    
    
    if (!isJumping) {
        const speedFactor = carSpeed * 3;
        playerCar.rotation.z = Math.sin(Date.now() * 0.01 * speedFactor) * 0.03;
        playerCar.rotation.x = Math.sin(Date.now() * 0.008 * speedFactor) * 0.01;
    }
  }

  
  updateCamera();

  
  if (isNightMode) {
    updateMoonPosition();
    createMoonStatusIndicator(); 
  } else {
    
    const indicator = document.getElementById('moonStatus');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  
  if (roadGroup) {
    roadGroup.position.z = -carZ;
  }
  updateRoad();

  
  updateObstacles();
  
  
  updateCoins();
  
  
  updateWeatherEffects();

  
  document.getElementById('score').textContent = Math.floor(score);
  
  
  const coinDisplayElement = document.getElementById('coinDisplay');
  if (coinDisplayElement) {
    coinDisplayElement.textContent = coinCount;
  }

  
  renderer.render(scene, camera);
  
  
  if (Math.floor(Date.now() / 5000) !== Math.floor((Date.now() - 16) / 5000)) {
    checkHeadlightStatus();
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
        
        const playerBox = new THREE.Box3().setFromObject(playerCar);
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        if (playerBox.intersectsBox(obstacleBox)) {
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
 
 const uiContainer = document.createElement('div');
 uiContainer.style.position = 'absolute';
 uiContainer.style.top = '20px';
 uiContainer.style.left = '20px';
 uiContainer.style.zIndex = '100';
 uiContainer.style.fontFamily = 'Arial, sans-serif';
 uiContainer.style.color = '#FFFFFF';
 uiContainer.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
 
 
 const scoreDiv = document.createElement('div');
 scoreDiv.innerHTML = '<h3>Puan: <span id="score">0</span></h3>';
 uiContainer.appendChild(scoreDiv);
 
 
 const coinDiv = document.createElement('div');
 coinDiv.innerHTML = '<h3>Coin: <span id="coinDisplay">0</span></h3>';
 uiContainer.appendChild(coinDiv);
 
 
 const speedDiv = document.createElement('div');
 speedDiv.innerHTML = '<h3>Hız: <span id="speedValue">100</span> km/h</h3>';
 uiContainer.appendChild(speedDiv);
 
 
 const controlsDiv = document.createElement('div');
 controlsDiv.style.marginTop = '20px';
 controlsDiv.style.fontSize = '14px';
 controlsDiv.innerHTML = `
   <p><strong>Kontroller:</strong></p>
   <p>← → Ok Tuşları: Araç Şerit Değiştirme</p>
   <p><strong>SPACE: ZIPLAMA 🦘 (Engelleri Aş!)</strong></p>
   <p>Shift/N: Nitro | Ctrl/B: Fren</p>
   <p>C: Kamera Değiştir (3 Mod)</p>
   <p>P: Müzik Aç/Kapat 🎵</p>
   ${isNightMode ? '<p style="color: #FFD700;">🌙 GECE MODU:</p><p>M: Ay Hareket Modu | WASD: Ay Kontrolü</p><p style="color: #FFB6C1;">(Ok tuşları her zaman araç için kullanılır)</p>' : ''}
   <p>Altın coinleri toplayın!</p>
   <p>Her ${COINS_PER_MAP_CHANGE} coin = Yeni Harita!</p>
   <p style="color: #FFD700;">🎯 Zıpla ve engelleri aşarak bonus puan kazan!</p>
 `;
 uiContainer.appendChild(controlsDiv);
 
 document.body.appendChild(uiContainer);
}


function createCanvas() {
 const canvas = document.createElement('canvas');
 canvas.id = 'gameCanvas';
 canvas.style.display = 'block';
 canvas.style.margin = '0 auto';
 document.body.appendChild(canvas);
 return canvas;
}






async function loadCarModelsForSelection() {
    console.log('🚗 Araç seçim ekranı için modeller yükleniyor...');
    console.log('📂 Yüklenecek araç sayısı:', AVAILABLE_CARS.length);
    
    loadedCarModels = [];
    
    for (let i = 0; i < AVAILABLE_CARS.length; i++) {
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
            carModel.position.set(0, 0, 0);
            
            
            carModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            loadedCarModels.push(carModel);
            console.log(`✅ ${car.name} modeli hazırlandı`);
            
        } catch (error) {
            console.warn(`⚠️ ${AVAILABLE_CARS[i].name} modeli yüklenemedi:`, error);
            loadedCarModels.push(null);
        }
    }
    
    console.log('🎯 Araç yükleme tamamlandı. Başarılı:', loadedCarModels.filter(m => m !== null).length);
    console.log('❌ Başarısız:', loadedCarModels.filter(m => m === null).length);
}


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

    
    const title = document.createElement('h1');
    title.textContent = '🚗 ARAÇ SEÇİMİ 🚗';
    title.style.color = '#FFFFFF';
    title.style.marginBottom = '20px';
    title.style.fontSize = '48px';
    title.style.textShadow = '3px 3px 6px rgba(0,0,0,0.8)';
    title.style.textAlign = 'center';
    menuContainer.appendChild(title);

    
    const sceneContainer = document.createElement('div');
    sceneContainer.style.position = 'relative';
    sceneContainer.style.width = '800px'; 
    sceneContainer.style.height = '600px'; 
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
    carInfoPanel.style.minWidth = '150px'; 
    carInfoPanel.style.border = '1px solid #FFD700'; 
    carInfoPanel.style.maxWidth = '200px'; 
    sceneContainer.appendChild(carInfoPanel);

    menuContainer.appendChild(sceneContainer);

    
    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.gap = '20px';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.marginBottom = '30px';

    
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '⬅️ ÖNCEKİ';
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
    nextButton.innerHTML = 'SONRAKİ ➡️';
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
    startButton.textContent = '🏁 OYUNU BAŞLAT 🏁';
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

    menuContainer.appendChild(startButton);

    
    const instructions = document.createElement('div');
    instructions.style.color = '#CCCCCC';
    instructions.style.fontSize = '16px';
    instructions.style.textAlign = 'center';
    instructions.style.marginTop = '20px';
    instructions.style.lineHeight = '1.5';
    instructions.innerHTML = `
        <p><strong>🎮 Kontroller:</strong></p>
        <p>← → Ok Tuşları: Araç değiştir | Enter/Space: Başlat</p>
        <p>💡 L Tuşu: Işığı Aç/Kapat</p>
        <p>🎛️ I Tuşu: Işık Miktarı Paneli</p>
        <p>🔘 Sağ üstte butonlar ile de kontrol edilebilir</p>
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
    lightToggleButton.innerHTML = carSelectionLightsEnabled ? '💡 Işık: AÇIK' : '🌙 Işık: KAPALI';
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
    lightIntensityButton.innerHTML = '🎛️ Işık Miktarı';
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

    
    [prevButton, nextButton, startButton].forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 8px 25px rgba(0,0,0,0.5)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        });
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
    
    const menuContainer = document.getElementById('carSelectionMenu');
    if (menuContainer) {
        
        if (menuContainer.cleanupHandler) {
            menuContainer.cleanupHandler();
        }
        menuContainer.style.display = 'none';
    }
    
    
    cleanup3DCarSelectionScene();
    
    
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

    
    const title = document.createElement('h1');
    title.textContent = '🚗 ARAÇ SEÇİMİ 🚗';
    title.style.color = '#FFFFFF';
    title.style.marginBottom = '20px';
    title.style.fontSize = '48px';
    title.style.textShadow = '3px 3px 6px rgba(0,0,0,0.8)';
    title.style.textAlign = 'center';
    menuContainer.appendChild(title);

    
    const sceneContainer = document.createElement('div');
    sceneContainer.style.position = 'relative';
    sceneContainer.style.width = '1000px'; 
    sceneContainer.style.height = '600px'; 
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

    menuContainer.appendChild(sceneContainer);

    
    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.gap = '20px';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.marginBottom = '30px';

    
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '⬅️ ÖNCEKİ';
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
    nextButton.innerHTML = 'SONRAKİ ➡️';
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
    startButton.textContent = '🏁 OYUNU BAŞLAT 🏁';
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

    menuContainer.appendChild(startButton);

    
    const instructions = document.createElement('div');
    instructions.style.color = '#CCCCCC';
    instructions.style.fontSize = '16px';
    instructions.style.textAlign = 'center';
    instructions.style.marginTop = '20px';
    instructions.style.lineHeight = '1.5';
    instructions.innerHTML = `
        <p><strong>🎮 Kontroller:</strong></p>
        <p>← → Ok Tuşları: Araç değiştir | Enter/Space: Başlat</p>
        <p>💡 L Tuşu: Işığı Aç/Kapat</p>
        <p>🎛️ I Tuşu: Işık Miktarı Paneli</p>
        <p>🔘 Sağ üstte butonlar ile de kontrol edilebilir</p>
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
    lightToggleButton.innerHTML = carSelectionLightsEnabled ? '💡 Işık: AÇIK' : '🌙 Işık: KAPALI';
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
    lightIntensityButton.innerHTML = '🎛️ Işık Miktarı';
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

    
    [prevButton, nextButton, startButton].forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 8px 25px rgba(0,0,0,0.5)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        });
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

    
    carSelectionCamera = new THREE.PerspectiveCamera(75, 800/600, 0.1, 1000); 
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

    
    const ringGeometry = new THREE.TorusGeometry(3.2, 0.1, 8, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFD700,
        transparent: true,
        opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.y = -0.45;
    ring.rotation.x = Math.PI / 2;
    ring.name = 'rotatingRing';
    carSelectionScene.add(ring);

    
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
    
    
    if (currentDisplayedCar) {
        carSelectionScene.remove(currentDisplayedCar);
        console.log('❌ Eski araba kaldırıldı');
    }
    
    
    if (loadedCarModels[selectedCarIndex]) {
        currentDisplayedCar = loadedCarModels[selectedCarIndex].clone();
        currentDisplayedCar.position.set(0, 0.7, 0); 
        
        
        
        const box = new THREE.Box3().setFromObject(currentDisplayedCar);
        const size = box.getSize(new THREE.Vector3());
        console.log('📏 Araç boyutu:', size);
        
        
        if (size.y > 3 || size.x > 4 || size.z > 6) {
            const scale = Math.min(3/size.y, 4/size.x, 6/size.z);
            currentDisplayedCar.scale.multiplyScalar(scale);
            console.log('📉 Araç ölçeklendi:', scale);
        }
        
        console.log('✅ Yeni araba Y=0 merkezde eklendi:', currentDisplayedCar.position);
        
        
        currentDisplayedCar.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        carSelectionScene.add(currentDisplayedCar);
    } else {
        console.warn('⚠️ Araç modeli yüklenmemiş:', selectedCarIndex);
    }
    
    
    const carInfoPanel = document.getElementById('carInfoPanel');
    const carIndexDisplay = document.getElementById('carIndexDisplay');
    
    if (carInfoPanel) {
        const car = AVAILABLE_CARS[selectedCarIndex];
        carInfoPanel.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #FFD700;">${car.name}</h3>
            <p style="margin: 0; color: #CCCCCC;">${car.description}</p>
            <br>
            <div style="color: #00FFFF;">
                <strong>Özellikler:</strong><br>
                • Ölçek: ${car.scale}<br>
                • Model: ${car.path.split('/').pop()}<br>
                • Y Pozisyon: 0 (Merkez)<br>
                • Durum: ${loadedCarModels[selectedCarIndex] ? '✅ Hazır' : '❌ Yüklenmedi'}
            </div>
        `;
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
    
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
    
    createCanvas();
    createGameUI();
    
    try {
        
        await loadCarModelsForSelection();
        
        
        createDayNightSelectionMenu();
        
        console.log('✅ 3D WebGL Araba Yarış Simülasyonu yüklendi!');
        console.log('Önce zaman seçin, sonra araç seçin ve oyunu başlatın!');
        
    } catch (error) {
        console.error('❌ Oyun yüklenirken hata oluştu:', error);
        
        
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
            currentDisplayedCar.rotation.y += 0.01; 
            
            
            currentDisplayedCar.position.y = Math.sin(Date.now() * 0.002) * 0.1;
        }
        
        
        carSelectionScene.traverse((object) => {
            if (object.name === 'rotatingRing') {
                object.rotation.y += 0.005;
            }
        });
        
        
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
    
    
    playMapMusic(currentMapIndex);
    
    
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
    
    lightToggleButton.innerHTML = carSelectionLightsEnabled ? '💡 Işık: AÇIK' : '🌙 Işık: KAPALI';
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
    title.textContent = '🎛️ Işık Miktarı Kontrolü';
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