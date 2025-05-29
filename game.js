// 3D WebGL Araba Yarış Simülasyonu - Three.js ile GLB Asset Desteği

//import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
//import { GLTFLoader } from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/GLTFLoader.js';
//versiyon13
// Global değişkenler
// Harita tipleri - en başta global değişkenlerle birlikte tanımlanacak

// MÜZİK SİSTEMİ - İYİLEŞTİRİLDİ
let currentMusic = null;
let musicEnabled = true;
const MUSIC_VOLUME = 0.7; // 0.3'ten 0.7'ye artırıldı - daha yüksek ses

// Harita müzikleri - basit müzikler (daha sonra değiştirilebilir)
const MAP_MUSIC = {
    0: 'graphics_three/musics/Life is a Highway.mp3', 
    1: 'graphics_three/musics/forgottendeserts.mp3', 
    2: 'graphics_three/musics/snow.mp3', 
    3: 'graphics_three/musics/Opening Race.mp3'  
};

// ZİPLAMA SİSTEMİ DEĞİŞKENLERİ - YENİ EKLENDİ
let isJumping = false;
let jumpVelocity = 0;
let jumpStartY = 0.2; // Arabanın normal Y pozisyonu
let jumpHeight = 4.0; // Maksimum zıplama yüksekliği
let jumpSpeed = 0.15; // Zıplama hızı
let gravity = 0.005; // Yerçekimi kuvveti
let jumpCooldown = false;
let jumpCooldownTime = 1000; // 1 saniye cooldown
let jumpSound = null;

// ARAÇ SEÇİM EKRANI IŞIK KONTROLÜ - YENİ EKLENDİ
let carSelectionLightsEnabled = true; // Işıkların açık/kapalı durumu
let lightToggleButton = null; // Işık açma/kapama butonu referansı

// IŞIK MİKTARI KONTROL PANELİ DEĞİŞKENLERİ - YENİ EKLENDİ
let lightIntensityPanel = null;
let lightSliders = {
    ambient: 0.8,
    spot: 2.0, 
    point: 0.8,
    directional: 0.8
};
let lightObjects = {   // Işık objelerinin referansları
    ambient: null,
    spot: null,
    point: null,
    directional: null
};

// Müzik kontrol fonksiyonları - MP3 DESTEĞI İLE YENİDEN YAZILDI
function playMapMusic(mapIndex) {
    if (!musicEnabled) return;
    
    // ANINDA MÜZİK DEĞİŞİMİ - MEVCUT MÜZİĞİ HEMEN DURDUR
    if (currentMusic) {
        try {
            currentMusic.pause();
            currentMusic.currentTime = 0;
            currentMusic.removeEventListener('loadeddata', null);
            currentMusic.removeEventListener('canplay', null);
            currentMusic.removeEventListener('error', null);
            currentMusic.removeEventListener('progress', null);
            currentMusic = null; // Referansı temizle
        } catch (e) {
            console.warn('Müzik durdurulurken hata:', e);
        }
    }
    
    // Yeni müziği başlat
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
        
        // Hemen çalmaya başla
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
        
        // Farklı olaylarla hemen çalmaya çalış
        currentMusic.addEventListener('loadeddata', playImmediately);
        currentMusic.addEventListener('canplay', playImmediately);
        
        // Hata yakalama - detaylı
        currentMusic.addEventListener('error', (e) => {
            console.error('❌ Müzik yükleme hatası:');
            console.error('Dosya:', musicPath);
            console.error('Hata kodu:', currentMusic.error?.code);
            console.error('Hata mesajı:', currentMusic.error?.message);
            
            // Hata kodlarını açıkla
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
        
        // Müziği yükle ve hemen çalmaya başla
        currentMusic.load();
        
        // Backup: 100ms sonra da çalmaya çalış
        setTimeout(() => {
            if (currentMusic && musicEnabled && currentMusic.paused) {
                currentMusic.play().catch(e => {
                    // Sessiz hata, zaten üstte loglandı
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
            // Kullanıcı etkileşimi ile müziği başlat
            currentMusic.play().catch(e => {
                console.warn('⚠️ Müzik çalınamadı:', e.message);
                if (e.name === 'NotAllowedError') {
                    console.log('💡 Tarayıcı güvenlik nedeniyle müzik çalmayı engelledi. Sayfada bir tıklama yapın.');
                    // Müzik çalmak için sayfa etkileşimi gerekli
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

// Müzik etkileşimi istemi
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
    
    // Tıklama ile müziği başlat
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
    
    // 10 saniye sonra otomatik gizle
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

// Coin sistemi için yeni değişkenler - harita değişimi için coin sayısını düşürdüm
let coins = [];
let coinCount = 0;
const COINS_PER_MAP_CHANGE = 20; // Her 15 coin'de harita değişimi (50'den düşürüldü)

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
    ,
    {
        name: "Wingo",
        path: "graphics_three/assets/wingo/source/Wingo.glb",
        scale: 0.12, // Bu değeri aracın boyutuna göre ayarlayabilirsiniz
        description: "Hızlı ve şık spor arabası",
        // music: "graphics_three/musics/Gang_Cars.mp3" // SADECE WINGO'YA ÖZEL MÜZİK
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

// Global değişkenler bölümüne ekleyin:
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

// SORUN 1: Eksik değişken tanımlamaları - dosyanın başına ekleyin
let selectedCar = null;
let selectedCarIndex = 0;

let gameStarted = false;

// Kamera sistemi - genişletildi
let currentCameraMode = 0; // 0: 3. şahıs, 1: 1. şahıs, 2: ön görünüm


const CAMERA_MODES = {
    THIRD_PERSON: 0,
    CLOSE_VIEW: 1,  
    FIRST_PERSON: 2,  
    FRONT_VIEW: 3     
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
// Müzik fonksiyonlarının yanına ekleyin (80. satır civarı):

// Seçili araç için müzik kontrolü (sadece özel müziği olanlar için)
function playSelectedCarMusic() {
    const selectedCar = AVAILABLE_CARS[selectedCarIndex];
    
    // Eğer seçili aracın özel müziği varsa onu çal
    if (selectedCar && selectedCar.music) {
        console.log(`🎵 ${selectedCar.name} için özel müzik çalıyor: ${selectedCar.music}`);
        
        // MEVCUT MÜZİĞİ DURDUR
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
                playMapMusic(currentMapIndex); // Hata durumunda harita müziğine dön
            });
            
            currentMusic.load();
            
        } catch (error) {
            console.error('💥 Araç müziği oluşturma hatası:', error);
            playMapMusic(currentMapIndex); // Hata durumunda harita müziğine dön
        }
    } else {
        // Özel müziği yoksa normal harita müziğini çal
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
                model.scale.set(0.15, 0.15, 0.15); // Mia için çok küçük
                console.log(' Mia modeli küçük boyutta ayarlandı (0.15)');
            } else {
                model.scale.set(0.4, 0.4, 0.4); // Diğer modeller normal boyutta
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
    
    // YOL MODELLERİNİ YÜKLE - İ
    await loadRoadModels();
    
    await loadCarModel();
    await loadObstacleModels();
    createObstacles();
    createCoins(); // Coin'leri oluştur

    // Three.js sahne kurulumu
    scene.fog = new THREE.FogExp2(MAP_TYPES[0].fogColor, 0.01);
  
    // Kamera - FAR PLANE İYİLEŞTİRİLDİ
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000); // 1000'den 2000'e artırıldı
  
    // Renderer - GÖLGE KALİTESİ İYİLEŞTİRİLDİ
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Yumuşak gölgeler
    renderer.shadowMap.autoUpdate = true;
    renderer.setClearColor(MAP_TYPES[0].skyColor); // İlk harita tipi için gökyüzü rengi
    
    // GÖLGE KALİTESİ ARTIŞI
    renderer.shadowMap.width = 4096; // Yüksek çözünürlük gölge
    renderer.shadowMap.height = 4096;
  
    // Işıklar
    setupLighting();
    await loadStreetlightModel();
    
    // Gece modu bilgisi ve OTOMATIK AY HAREKETİ AKTIFLEŞTIRME
    if (isNightMode) {
        console.log('🌙 GECE MODU AKTIF!');
        console.log('Ay gökyüzünde merkezi konumda (yukarı bakın)');
        console.log('WASD tuşları ile ayı hareket ettirebilirsiniz (otomatik aktif)');
        canMoveMoon = true; // Gece modunda otomatik olarak ay hareket modunu aç
        showMoonControlNotification(); // Kullanıcıya bildirim göster
    }
    
    // İLK MÜZİK BAŞLAT
    playSelectedCarMusic()
    playMapMusic(0);
    
    
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
        selectedCar = AVAILABLE_CARS[selectedCarIndex];
        console.log(`🚗 ${selectedCar.name} modeli yükleniyor...`);
        
        const gltf = await new Promise((resolve, reject) => {
            loader.load(selectedCar.path, resolve, undefined, reject);
        });
        
        carModel = gltf.scene.clone();
        carModel.scale.set(selectedCar.scale, selectedCar.scale, selectedCar.scale);
        
        // DOĞRU ROTASYON UYGULAMASI
        const baseRotation = CAR_ROTATIONS[selectedCar.name] || 0;
        carModel.rotation.y = baseRotation;
        console.log(`🔄 ${selectedCar.name} rotasyonu: ${(baseRotation * 180 / Math.PI).toFixed(0)}°`);
       
        
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

        // Araba farları oluştur
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

        // Far görsel efektleri
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
        
        const nitroTailLightLeft = new THREE.PointLight(0xff0000, 0, 5);
        nitroTailLightLeft.position.set(-0.32, 0.28, -1.12);
        playerCar.add(nitroTailLightLeft);

        const nitroTailLightRight = new THREE.PointLight(0xff0000, 0, 5);
        nitroTailLightRight.position.set(0.32, 0.28, -1.12);
        playerCar.add(nitroTailLightRight);

        nitroLights.push(nitroLightLeft, nitroLightRight, nitroTailLightLeft, nitroTailLightRight);
        
        // Direksiyon oluştur
        createSteeringWheel();
        
        console.log(`✅ ${selectedCar.name} modeli başarıyla yüklendi!`);
        
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
  const ROAD_LENGTH = 300; // Daha uzun yol - 200'den 300'e artırıldı

  // ÇÖL YOLU İÇİN ÖZEL MATERIAL VE RENK
  console.log('🛣️ Geometrik yol oluşturuluyor...');
  
  // Ana yol segmentleri
  let roadMaterial;
  if (mapType.name === "Çöl") {
    // Çöl haritası için özel kumlu sarımsı yol
    roadMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xD2B48C, // Kumlu sarımsı renk (tan)
      roughness: 0.9   // Mat görünüm
    });
  } else {
    // Diğer haritalar için normal renkli yol
    roadMaterial = new THREE.MeshLambertMaterial({ color: mapType.roadColor });
  }
  
  const roadGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, 4);

  // SONSUZ YOL İÇİN DAHA UZUN SEGMENT ARALIĞI
  // -100'den 500'e kadar (toplam 600 birim) yol segmentleri oluştur
  for (let i = -100; i < 500; i++) {
    const roadSegment = new THREE.Mesh(roadGeometry, roadMaterial);
    roadSegment.rotation.x = -Math.PI / 2;
    roadSegment.position.set(0, 0.01, i * 4);
    roadSegment.receiveShadow = true;
    roadGroup.add(roadSegment);

    // Şerit çizgileri - DÜZELTİLDİ (yatay çizgiler)
    if (i % 2 === 0) {
      for (let lane = 1; lane < 4; lane++) {
        // Şerit çizgilerini YATAY (yol boyunca uzun) yapmak için boyutları doğru ayarla
        const lineGeo = new THREE.BoxGeometry(0.1, 1.5, 0.01);
        
        let lineMaterial;
        if (mapType.name === "Çöl") {
          // Çöl haritasında daha koyu şerit çizgileri
          lineMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Koyu kahverengi
        } else {
          // Diğer haritalarda beyaz şerit çizgileri
          lineMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        }
        
        const line = new THREE.Mesh(lineGeo, lineMaterial);
        line.rotation.x = -Math.PI / 2; // Yatay konuma getir (yola yapıştır)
        line.position.set(getXFromLane(lane) - 1, 0.015, i * 4);
        roadGroup.add(line);
      }
    }
  }

  // Çim kenarları (yolun her iki tarafında) - DAHA UZUN
  const grassGeo = new THREE.PlaneGeometry(100, 800); // 400'den 800'e artırıldı
  let grassMat;
  
  if (mapType.name === "Çöl") {
    // Çöl haritası için kumlu zemin
    grassMat = new THREE.MeshLambertMaterial({ 
      color: 0xF4A460, // Sandy Brown - daha açık kum rengi
      roughness: 0.8 
    });
  } else {
    // Diğer haritalar için normal çim rengi
    grassMat = new THREE.MeshLambertMaterial({ color: mapType.grassColor });
  }

  const leftGrass = new THREE.Mesh(grassGeo, grassMat);
  leftGrass.rotation.x = -Math.PI / 2;
  leftGrass.position.set(-ROAD_WIDTH/2 - 40, -0.01, 200); // Merkezi pozisyon ayarlandı
  roadGroup.add(leftGrass);

  const rightGrass = new THREE.Mesh(grassGeo, grassMat);
  rightGrass.rotation.x = -Math.PI / 2;
  rightGrass.position.set(ROAD_WIDTH/2 + 40, -0.01, 200); // Merkezi pozisyon ayarlandı
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
  
  // Sis yoğunluğunu varsayılan değere sıfırla
  scene.fog = new THREE.FogExp2(fogColor, isNightMode ? 0.015 : 0.01);
  
  // Hava durumu sistemini oluştur
  createWeatherSystem(mapType);
  
  // Streetlightları yolun kenarlarına ekle (her 20 metrede bir)
  if (loadedStreetlightModel) {
    const lampSpacing = 75; // Lambalar arası mesafe
    const lightCount = Math.floor(600 / lampSpacing); // Daha fazla lamba

    for (let i = 0; i < lightCount; i++) {
      [-1, 1].forEach(side => {
        const lightObj = loadedStreetlightModel.clone();

        // Pozisyon ayarı (yoldan biraz uzakta)
        lightObj.position.set(
          side * (ROAD_WIDTH / 2 - 0.7),
          3.5,
          i * lampSpacing - 100 // Başlangıç pozisyonu ayarlandı
        );
        lightObj.scale.set(1.1, 1.1, 1.1);
        if (side === -1) {
          lightObj.rotation.y = Math.PI;
        }

        // Mesh gölge ayarı
        lightObj.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Gerçek ışık ekle
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
  
  // 1. Yolu arabanın konumuna göre hareket ettir
  roadGroup.position.z = -carZ;
  
  // 2. SONSUZ YOL SİSTEMİ - Daha sık sıfırlama
  const RESET_DISTANCE = 500; // 1000'den 500'e düşürüldü - daha sık sıfırlanacak
  
  if (carZ > RESET_DISTANCE) {
    // Arabayı ve kamerayı konumsal olarak sıfırla ama oyun devam etsin
    const resetAmount = Math.floor(carZ / RESET_DISTANCE) * RESET_DISTANCE;
    
    carZ -= resetAmount;
    
    // Engelleri de konumsal olarak sıfırla
    obstacles.forEach(obstacle => {
      obstacle.userData.z -= resetAmount;
      obstacle.position.z = obstacle.userData.z;
    });
    
    // Coin'leri de sıfırla
    coins.forEach(coin => {
      coin.userData.z -= resetAmount;
      coin.position.z = coin.userData.z;
    });
    
    console.log(`🔄 Sonsuz yol sıfırlaması: ${resetAmount} birim geri alındı`);
    console.log(`🛣️ Yeni araba pozisyonu: ${carZ}`);
  }
  
  // 3. Yol segmentlerini dinamik olarak ekle/çıkar (performans için)
  // Bu kısım isteğe bağlı - performans sorunu olursa ekleyebiliriz
}
// Harita tipine göre dekorasyon ekleme - DAHA FAZLA DEKORASYON
function addMapDecorations(mapType) {
  switch(mapType.name) {
    case "Çöl":
      // Kaktüsler ekle - DAHA FAZLA VE DAHA UZUN MESAFE
      for (let i = 0; i < 30; i++) { // 15'den 30'a artırıldı
        const height = 0.8 + Math.random() * 1.0;
        const cactusGeo = new THREE.CylinderGeometry(0.2, 0.3, height, 8);
        const cactusMat = new THREE.MeshLambertMaterial({ color: 0x2F4F2F });
        const cactus = new THREE.Mesh(cactusGeo, cactusMat);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (8 + Math.random() * 10);
        const z = Math.random() * 600 - 100; // Daha uzun mesafe
        
        cactus.position.set(x, height/2, z);
        cactus.castShadow = true;
        cactus.receiveShadow = true;
        roadGroup.add(cactus);
      }
      break;
      
      case "Karlı":
        // Daha gerçekçi kar senaryosu
        
        // 1. Büyük kar yığınları (ana kar kümeleri)
        for (let i = 0; i < 15; i++) {
          const snowRadius = 2 + Math.random() * 3;
          const snowGeo = new THREE.SphereGeometry(snowRadius, 12, 8);
          const snowMat = new THREE.MeshLambertMaterial({ 
            color: 0xF0F8FF, // Biraz mavimsi beyaz
            transparent: true,
            opacity: 0.9
          });
          const snow = new THREE.Mesh(snowGeo, snowMat);
          
          const side = Math.random() > 0.5 ? 1 : -1;
          const x = side * (9 + Math.random() * 18);
          const z = Math.random() * 700 - 150;
          
          snow.position.set(x, snowRadius * 0.3, z); // Yarısı toprağa gömülü
          snow.scale.set(1, 0.4 + Math.random() * 0.3, 1); // Yassı kar yığını
          snow.receiveShadow = true;
          snow.castShadow = true;
          roadGroup.add(snow);
        }
        
        // 2. Orta boy kar tepecikleri
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
        
        // 3. Küçük kar parçacıkları (dağınık kar)
        for (let i = 0; i < 50; i++) {
          const snowRadius = 0.3 + Math.random() * 0.5;
          const snowGeo = new THREE.SphereGeometry(snowRadius, 6, 4);
          const snowMat = new THREE.MeshLambertMaterial({ 
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.7
          });
          const snow = new THREE.Mesh(snowGeo, snowMat);
          
          const x = (Math.random() - 0.5) * 50; // Her yere dağılmış
          const z = Math.random() * 650 - 120;
          
          snow.position.set(x, snowRadius * 0.1, z);
          snow.scale.y = 0.2 + Math.random() * 0.3; // Çok yassı
          snow.receiveShadow = true;
          roadGroup.add(snow);
        }
        
        // 4. Kar kaplı kayalar (gerçekçilik için)
        for (let i = 0; i < 8; i++) {
          const rockRadius = 1.5 + Math.random() * 2;
          const rockGeo = new THREE.SphereGeometry(rockRadius, 8, 6);
          const rockMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
          const rock = new THREE.Mesh(rockGeo, rockMat);
          
          // Üzerine kar ekle
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
        
        // 5. Buzlu alanlar (parlak yüzeyler)
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
          
          ice.rotation.x = -Math.PI / 2; // Yatay konumda
          ice.position.set(x, 0.05, z);
          ice.receiveShadow = true;
          
          roadGroup.add(ice);
        }
        
        break;
      
    case "Bahar":
      // Çiçekler ekle - DAHA FAZLA
      for (let i = 0; i < 120; i++) { // 80'den 120'ye artırıldı
        const flowerSize = 0.3 + Math.random() * 0.2;
        const flowerGeo = new THREE.SphereGeometry(flowerSize, 8, 6);
        
        // Rastgele çiçek renkleri
        const flowerColors = [0xFF69B4, 0xFF1493, 0xFFFF00, 0xFFDAB9, 0xFF6347];
        const colorIndex = Math.floor(Math.random() * flowerColors.length);
        const flowerMat = new THREE.MeshLambertMaterial({ color: flowerColors[colorIndex] });
        
        const flower = new THREE.Mesh(flowerGeo, flowerMat);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (5 + Math.random() * 15);
        const z = Math.random() * 600 - 100; // Daha uzun mesafe
        
        flower.position.set(x, flowerSize, z);
        flower.castShadow = true;
        flower.receiveShadow = true;
        roadGroup.add(flower);
      }
      break;
      
    case "Normal":
      // Normal harita için ağaçlar ekle
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
    // Tüm eski engelleri temizle!
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

    // Ay hareket kontrolleri (sadece gece modunda ve ay hareket modu açıkken)
    if (isNightMode && canMoveMoon && moonObject) {
        switch(event.code) {
            case 'KeyW':
                moonObject.position.y += 5;
                updateMoonPosition();
                return; // Return kullanarak diğer kontrollerin çalışmasını engelleme
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
        // ZİPLAMA: Space tuşuna basınca araç zıplasın - YENİ EKLENDİ
        case 'Space':
            if (gameActive) {
                initiateJump();
                event.preventDefault(); // Sayfa kaydırmasını engelle
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
        // MÜZİK KONTROLÜ: P tuşuna basınca müziği aç/kapat
        case 'KeyP':
            toggleMusic();
            showMusicNotification();
            break;
        // IŞIK KONTROLÜ: L tuşu ile ışığı aç/kapat - YENİ EKLENDİ
        case 'KeyL':
            // Sadece araç seçim ekranı açık olduğunda çalışsın
            const carSelectionMenu = document.getElementById('carSelectionMenu');
            if (carSelectionMenu && carSelectionMenu.style.display !== 'none') {
                event.preventDefault();
                toggleCarSelectionLights();
                console.log('💡 Araç seçim ekranında ışık kontrolü çalıştı');
            }
            break;
        // IŞIK MİKTARI PANELİ: I tuşu ile paneli aç/kapat - SADECE ARAÇ SEÇİM EKRANINDA  
        case 'KeyI':
            // Sadece araç seçim ekranı açık olduğunda çalışsın
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
    
    // HERHANGİ BİR TUŞ BASILINCA MÜZİK BAŞLAT (ilk etkileşim)
    tryStartMusicOnFirstInteraction();
}

// updateObstacles fonksiyonundan sonra bu fonksiyonu ekleyin:

function reduceObstacles() {
    if (obstacles.length <= 5) { // 1'den 5'e değiştirildi
        console.log('🚫 Zaten 5 veya daha az engel var!');
        return;
    }
    
    // Tüm engelleri kaldır
    obstacles.forEach(obstacle => {
        scene.remove(obstacle);
        if (obstacle.geometry) obstacle.geometry.dispose();
        if (obstacle.material) obstacle.material.dispose();
    });
    
    // Array'i temizle
    obstacles = [];
    
    // 5 ENGEL OLUŞTUR - 1'den 5'e değiştirildi
    for (let i = 0; i < 5; i++) {
        if (loadedObstacleModels.length > 0) {
            const modelIdx = Math.floor(Math.random() * loadedObstacleModels.length);
            const glbModel = loadedObstacleModels[modelIdx];
            
            if (glbModel) {
                const obstacle = glbModel.clone();
                const lane = Math.floor(Math.random() * 4);
                const z = carZ + 30 + (i * 15) + Math.random() * 10; // Her engel arasında mesafe
                
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
    
    // Bildirim göster
    showObstacleReductionNotification();
}
// İlk kullanıcı etkileşiminde müziği başlatma
function tryStartMusicOnFirstInteraction() {
    if (currentMusic && musicEnabled && currentMusic.paused) {
        currentMusic.play().catch(e => {
            if (e.name !== 'NotAllowedError') {
                console.warn('Müzik başlatma hatası:', e.message);
            }
        });
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
const isGangCar = [3, 4, 5, 6,8].includes(selectedCarIndex); // Wingo, DJ, Boost, Snot Rod
  // Standart hız artışı - maksimum hızı artırdım
 
    const BASE_MAX_SPEED = isGangCar ? 0.7 : 0.5; // Gang araçları daha hızlı
  const SPEED_INCREMENT = isGangCar ? 0.05 : 0.03; // Gang araçları daha hızlı hızlanır
  let targetSpeed = initialCarSpeed + Math.floor(coinCount / 15) * SPEED_INCREMENT;
  targetSpeed = Math.min(targetSpeed, BASE_MAX_SPEED);
  if (brakeActive) targetSpeed -= 0.1;
  
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
        headlight.color.setHex(0xaaffff); 
    });
      const nitroBoost = isGangCar ? 0.35 : 0.25; // Gang araçları %40 daha güçlü nitro
    targetSpeed += nitroBoost;
    
   
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
const ABSOLUTE_MAX_SPEED = isGangCar ? 1.2 : 0.8;
  // Sınırları koru - maksimum hızı da artırdım
  carSpeed = Math.max(0.05, Math.min(targetSpeed, ABSOLUTE_MAX_SPEED));

 document.getElementById('speedValue').textContent = Math.floor(carSpeed * 1000);

  // YENİ HAREİTA DEĞİŞİM SİSTEMİ - DÖNGÜSEL OLARAK
  if (coinCount >= COINS_PER_MAP_CHANGE) {
    // Otomatik harita değişimi yap
    const success = changeMap();
    if (success) {
      console.log(`✅ Otomatik harita değişimi başarılı: ${MAP_TYPES[currentMapIndex].name}`);
    }
  }
// gameLoop fonksiyonunda mevcut müzik kontrol kodunu bulun ve şu şekilde değiştirin:

// ARAÇ-SPESİFİK MÜZİK KONTROLÜ - FINN VE HOLLEY İÇİN GENİŞLETİLDİ
const selectedCarName = AVAILABLE_CARS[selectedCarIndex].name;
const selectedCarMusic = AVAILABLE_CARS[selectedCarIndex].music;

// Wingo ve DJ/Boost için özel müzik (sadece normal haritada)
if ([3, 4, 5, 6].includes(selectedCarIndex) && currentMapIndex === 0) { 
    // Wingo (3) ve DJ (4) - Normal haritada Gang_Cars.mp3
    if (!currentMusic || !currentMusic.src.includes('Gang_Cars.mp3')) {
        console.log(`🎵 ${selectedCarName} normal haritada - Gang_Cars.mp3 başlatılıyor...`);
        
        // Mevcut müziği durdur
        if (currentMusic) {
            currentMusic.pause();
            currentMusic = null;
        }
        
        // Gang_Cars.mp3 çal
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
// Finn McMissle ve Holley Shiftwell için özel müzik (tüm haritalarda)
else if ((selectedCarIndex === 7 || selectedCarIndex === 9)  && currentMapIndex === 0){ 
    // Finn McMissle (7) ve Holley Shiftwell (9) - Finn.mp3
    if (!currentMusic || !currentMusic.src.includes('Finn.mp3')) {
        console.log(`🎵 ${selectedCarName} - Finn.mp3 başlatılıyor...`);
        
        // Mevcut müziği durdur
        if (currentMusic) {
            currentMusic.pause();
            currentMusic = null;
        }
        
        // Finn.mp3 çal
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
    // Özel müziği olmayan araçlar veya özel şartları sağlamayan durumlar
    if (currentMusic && (
        currentMusic.src.includes('Gang_Cars.mp3') || 
        currentMusic.src.includes('Finn.mp3')
    )) {
        console.log(`🎵 ${selectedCarName} özel müziği durduruluyor - normal müziğe dönülüyor...`);
        playMapMusic(currentMapIndex);
    }
}


  displayDebugInfo();

  // Araba ileri hareket
  carZ += carSpeed;

  // ZİPLAMA SİSTEMİNİ GÜNCELLE - YENİ EKLENDİ
  updateJump();

  // Araba pozisyonunu güncelle
  if (playerCar) {
    playerCar.position.z = carZ;
    updateCarPosition();

    // Araba animasyonu (hıza bağlı sallanma) - iyileştirildi
    // SADECE ZİPLAMIYORSA NORMAL ANİMASYON YAP
    if (!isJumping) {
        const speedFactor = carSpeed * 3;
        playerCar.rotation.z = Math.sin(Date.now() * 0.01 * speedFactor) * 0.03;
        playerCar.rotation.x = Math.sin(Date.now() * 0.008 * speedFactor) * 0.01;
    }
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
  
  // FAR KONTROLÜ - DEBUG BİLGİSİ (sadece 5 saniyede bir)
  if (Math.floor(Date.now() / 5000) !== Math.floor((Date.now() - 16) / 5000)) {
    checkHeadlightStatus();
  }
  
  requestAnimationFrame(gameLoop);
}

// Far durumu kontrolü
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
        obstacle.userData.laneChangeDelay = Math.random() * 500 + 350;
      }

      // 4. Yumuşak şerit değişimi
      const targetX = getXFromLane(obstacle.userData.targetLane);
      if (Math.abs(obstacle.position.x - targetX) > 0.1) {
        obstacle.position.x += (targetX - obstacle.position.x) * 0.017;
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

    // --- ÇARPIŞMA KONTROLÜ - ZİPLAMA SıRASINDA DEVRE DIŞI ---
    // EĞER ARABA HAVADAYSA VE YETERİNCE YÜKSEKTEYSE ÇARPIŞMA KONTROL ETMEYİN
    const carIsHighEnough = isCarInAir() && playerCar && playerCar.position.y > obstacle.position.y + 1.5;
    
    if (!carIsHighEnough) {
        // Normal çarpışma kontrolü yap
        const playerBox = new THREE.Box3().setFromObject(playerCar);
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        if (playerBox.intersectsBox(obstacleBox)) {
            console.log('💥 ÇARPIŞMA! Araba havada değil veya yeterince yüksek değil');
            gameOver();
            return;
        }
    } else {
        // Araba havada ve yeterince yüksek - çarpışma yok!
        console.log('🦘 ENGEL AŞILDI! Araba havada, çarpışma kontrol edilmiyor');
        
        // Zıplama ile engel aşma bonus puanı
         if (!obstacle.userData.jumpBonusGiven) {
            obstacle.userData.jumpBonusGiven = true;
            console.log('✅ Engel aşıldı - bonus puan yok');
        }
    }

    // --- NPC sınır kontrolleri ve yeniden doğurma ---
    // Çok geride kalanları ileri taşı
     if (obstacle.userData.z < carZ - 30) {
      // YENİ RASTGELE MODEL SEÇ VE DEĞİŞTİR
      const newModelIndex = Math.floor(Math.random() * loadedObstacleModels.length);
      const newModel = loadedObstacleModels[newModelIndex];
      
      if (newModel) {
        // Eski modeli sahneden kaldır
        scene.remove(obstacle);
        
        // Yeni model klonla
        const newObstacle = newModel.clone();
        
        // Yeni pozisyon ayarla
        obstacle.userData.z = carZ + 80 + Math.random() * 40;
        let newLane = Math.floor(Math.random() * 4);
        obstacle.userData.lane = newLane;
        obstacle.userData.targetLane = newLane;
        
        // Yeni engeli konumlandır
        newObstacle.position.set(getXFromLane(newLane), 0.2, obstacle.userData.z);
        newObstacle.castShadow = true;
        
        // UserData'yı aktar
        newObstacle.userData = {
          ...obstacle.userData,
          originalY: 0.2,
          npcSpeed: 0.07 + Math.random() * 0.08,
          direction: 1,
          laneChangeDelay: Math.random() * 300 + 150,
          jumpBonusGiven: false,
          isGLBModel: true
        };
        
        // Obstacles array'inde güncelle
        const obstacleIndex = obstacles.indexOf(obstacle);
        if (obstacleIndex !== -1) {
          obstacles[obstacleIndex] = newObstacle;
        }
        
        // Yeni engeli sahneye ekle
        scene.add(newObstacle);
        
        console.log(`🔄 Engel yenilendi: ${OBSTACLE_GLB_MODELS[newModelIndex].split('/').pop()} - Lane ${newLane}, Z=${Math.floor(obstacle.userData.z)}`);
        return; // Bu engel için işlemi sonlandır
      }
    }
    
    // Çok ilerde olanları geri taşı - YENİ RASTGELE MODEL SEÇİMİ
    if (obstacle.userData.z > carZ + 120) {
      // YENİ RASTGELE MODEL SEÇ VE DEĞİŞTİR
      const newModelIndex = Math.floor(Math.random() * loadedObstacleModels.length);
      const newModel = loadedObstacleModels[newModelIndex];
      
      if (newModel) {
        // Eski modeli sahneden kaldır
        scene.remove(obstacle);
        
        // Yeni model klonla
        const newObstacle = newModel.clone();
        
        // Yeni pozisyon ayarla
        obstacle.userData.z = carZ - 20 + Math.random() * 15;
        let newLane = Math.floor(Math.random() * 4);
        obstacle.userData.lane = newLane;
        obstacle.userData.targetLane = newLane;
        
        // Yeni engeli konumlandır
        newObstacle.position.set(getXFromLane(newLane), 0.2, obstacle.userData.z);
        newObstacle.castShadow = true;
        
        // UserData'yı aktar
        newObstacle.userData = {
          ...obstacle.userData,
          originalY: 0.2,
          jumpBonusGiven: false,
          isGLBModel: true
        };
        
        // Obstacles array'inde güncelle
        const obstacleIndex = obstacles.indexOf(obstacle);
        if (obstacleIndex !== -1) {
          obstacles[obstacleIndex] = newObstacle;
        }
        
        // Yeni engeli sahneye ekle
        scene.add(newObstacle);
        
        console.log(`⬅️ Engel geri konumlandırıldı: ${OBSTACLE_GLB_MODELS[newModelIndex].split('/').pop()} - Lane ${newLane}, Z=${Math.floor(obstacle.userData.z)}`);
        return; // Bu engel için işlemi sonlandır
      }
    }
}
}


function gameOver() {
 gameActive = false;
 
 // OYUN BİTTİĞİNDE VARSAYILAN MÜZİĞE DÖN
 console.log('🎮 Oyun bitti - Varsayılan müziğe dönülüyor...');
 playMapMusic(0); // İlk harita müziğine dön
 
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
   <p style="font-size: 14px; color: #FFB6C1;">🎵 Varsayılan müzik çalıyor...</p>
 `;
 gameOverDiv.style.display = 'block';
}

function restartGame() {
 // Game Over ekranını gizle
 const gameOverDiv = document.getElementById('gameOver');
 if (gameOverDiv) {
   gameOverDiv.style.display = 'none';
 }
 
 // OYUN YENİDEN BAŞLADIĞINDA VARSAYILAN MÜZİĞE DÖN
 console.log('🔄 Oyun yeniden başlıyor - Varsayılan müziğe dönülüyor...');
 playMapMusic(0); // İlk harita müziğine dön
 
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
 
 console.log('✅ Oyun yeniden başlatıldı! İlk harita ve müzik yüklendi.');
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

// Canvas oluştur
function createCanvas() {
 const canvas = document.createElement('canvas');
 canvas.id = 'gameCanvas';
 canvas.style.display = 'block';
 canvas.style.margin = '0 auto';
 document.body.appendChild(canvas);
 return canvas;
}

// Araç seçim ekranı için yeni değişkenler



// Araç seçim ekranı için araç modellerini yükle
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
            
            // Gölge ayarları
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

// 3D araç seçim ekranını oluştur
function createCarSelectionMenu() {
    // Ana konteyner
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

    // Başlık
    const title = document.createElement('h1');
    title.textContent = '🚗 ARAÇ SEÇİMİ 🚗';
    title.style.color = '#FFFFFF';
    title.style.marginBottom = '20px';
    title.style.fontSize = '48px';
    title.style.textShadow = '3px 3px 6px rgba(0,0,0,0.8)';
    title.style.textAlign = 'center';
    menuContainer.appendChild(title);

    // 3D sahne konteyner
    const sceneContainer = document.createElement('div');
    sceneContainer.style.position = 'relative';
    sceneContainer.style.width = '800px'; // 1000px'den 800px'e küçültüldü 
    sceneContainer.style.height = '600px'; // 600px aynı kaldı
    sceneContainer.style.border = '3px solid #FFD700';
    sceneContainer.style.borderRadius = '15px';
    sceneContainer.style.background = 'linear-gradient(45deg, #2c3e50, #3498db)';
    sceneContainer.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.5)';
    sceneContainer.style.marginBottom = '30px';
    sceneContainer.style.overflow = 'hidden';

    // 3D Canvas
    carSelectionCanvas = document.createElement('canvas');
    carSelectionCanvas.style.width = '100%';
    carSelectionCanvas.style.height = '100%';
    carSelectionCanvas.style.borderRadius = '12px';
    sceneContainer.appendChild(carSelectionCanvas);

    // Araç bilgi paneli (3D sahne üzerine overlay)
    const carInfoPanel = document.createElement('div');
    carInfoPanel.id = 'carInfoPanel';
    carInfoPanel.style.position = 'absolute';
    carInfoPanel.style.top = '5px'; // 10px'den 5px'e küçültüldü
    carInfoPanel.style.left = '5px'; // 10px'den 5px'e küçültüldü
    carInfoPanel.style.background = 'rgba(0, 0, 0, 0.8)';
    carInfoPanel.style.color = '#FFFFFF';
    carInfoPanel.style.padding = '8px'; // 15px'den 8px'e küçültüldü
    carInfoPanel.style.borderRadius = '6px'; // 10px'den 6px'e küçültüldü
    carInfoPanel.style.fontSize = '12px'; // 16px'den 12px'e küçültüldü
    carInfoPanel.style.minWidth = '150px'; // 200px'den 150px'e küçültüldü
    carInfoPanel.style.border = '1px solid #FFD700'; // 2px'den 1px'e ince yapıldı
    carInfoPanel.style.maxWidth = '200px'; // Maksimum genişlik eklendi
    sceneContainer.appendChild(carInfoPanel);

    menuContainer.appendChild(sceneContainer);

    // Kontrol butonları konteyner
    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.gap = '20px';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.marginBottom = '30px';

    // Önceki araç butonu
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

    // Sonraki araç butonu
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

    // Araç indeksi gösterge
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

    // Oyunu başlat butonu
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

    // Kontrol talimatları
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

    // IŞIK KONTROL BUTONU - YENİ EKLENDİ
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
    lightToggleButton.style.padding = '20px 30px'; // 15px 25px'den büyütüldü
    lightToggleButton.style.fontSize = '20px'; // 18px'den büyütüldü
    lightToggleButton.style.color = '#FFFFFF';
    lightToggleButton.style.cursor = 'pointer';
    lightToggleButton.style.fontWeight = 'bold';
    lightToggleButton.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    lightToggleButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    lightToggleButton.style.transition = 'all 0.3s ease';
    lightToggleButton.style.border = '3px solid #FFD700';
    lightToggleButton.style.minWidth = '200px';

    // Işık miktarı butonu ekle
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

    // Hover efektleri ve click eventleri
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

    // Click eventleri
    lightToggleButton.addEventListener('click', toggleCarSelectionLights);
    lightIntensityButton.addEventListener('click', toggleLightIntensityPanel);

    menuContainer.appendChild(lightControlContainer);

    // IŞIK MİKTARI KONTROL PANELİ - YENİ EKLENDİ
    createLightIntensityPanel();

    document.body.appendChild(menuContainer);

    // 3D sahneyi başlat
    init3DCarSelectionScene();

    // Event listener'ları ekle
    prevButton.addEventListener('click', () => changeSelectedCar(-1));
    nextButton.addEventListener('click', () => changeSelectedCar(1));
    startButton.addEventListener('click', startGameWithSelectedCar);

    // Hover efektleri
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

    // Klavye kontrolleri
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
                // IŞIK KONTROLÜ: L tuşu ile ışığı aç/kapat - YENİ EKLENDİ
                case 'KeyL':
                    // Sadece araç seçim ekranı açık olduğunda çalışsın
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
    
    // Cleanup function
    menuContainer.cleanupHandler = () => {
        document.removeEventListener('keydown', keyHandler);
    };

    // İlk arabayı göster
    updateCarDisplay();
}

// 3D araç seçim sahnesini başlat
// 3D araç seçim sahnesini başlat// 3D araç seçim sahnesini başlat


// Araç seçimini değiştir
function changeSelectedCar(direction) {
    selectedCarIndex += direction;
    
    // Döngüsel seçim
    if (selectedCarIndex < 0) {
        selectedCarIndex = AVAILABLE_CARS.length - 1;
    } else if (selectedCarIndex >= AVAILABLE_CARS.length) {
        selectedCarIndex = 0;
    }
    
    updateCarDisplay();
}

// Araç görünümünü güncelle
// 3D araç seçim sahnesini başlat
// Global değişkenler - ışık kontrol paneli için
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

// Işık referansları
let carSelectionLights = {
    ambient: null,
    spot: null,
    lamp: null,
    back: null
};


// Işık kontrol paneli oluşturma fonksiyonu
function createLightControlPanel() {
    // Ana panel container
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

    // Panel başlığı
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

    // Ana ışık açma/kapama
    const masterToggle = createToggleControl('Tüm Işıkları Aç/Kapat', lightControls.lightsEnabled, (value) => {
        lightControls.lightsEnabled = value;
        toggleAllLights(value);
        updateLightControlsVisibility();
    });
    lightControlPanel.appendChild(masterToggle);

    // Işık kontrolleri container
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'light-controls-container';
    controlsContainer.style.display = lightControls.lightsEnabled ? 'block' : 'none';

    // Ortam ışığı kontrolleri
    controlsContainer.appendChild(createSectionTitle('🌅 Ortam Işığı'));
    controlsContainer.appendChild(createSliderControl('Parlaklık', lightControls.ambientIntensity, 0, 2, 0.1, (value) => {
        lightControls.ambientIntensity = value;
        if (carSelectionLights.ambient) carSelectionLights.ambient.intensity = value;
    }));
    controlsContainer.appendChild(createColorControl('Renk', lightControls.ambientColor, (value) => {
        lightControls.ambientColor = value;
        if (carSelectionLights.ambient) carSelectionLights.ambient.color.setHex(parseInt(value.replace('#', '0x')));
    }));

    // Spot ışık kontrolleri
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

    // Lamba ışığı kontrolleri
    controlsContainer.appendChild(createSectionTitle('🔆 Tavan Lambası'));
    controlsContainer.appendChild(createSliderControl('Parlaklık', lightControls.lampIntensity, 0, 3, 0.1, (value) => {
        lightControls.lampIntensity = value;
        if (carSelectionLights.lamp) carSelectionLights.lamp.intensity = value;
    }));
    controlsContainer.appendChild(createColorControl('Renk', lightControls.lampColor, (value) => {
        lightControls.lampColor = value;
        if (carSelectionLights.lamp) carSelectionLights.lamp.color.setHex(parseInt(value.replace('#', '0x')));
    }));

    // Arka plan ışığı kontrolleri
    controlsContainer.appendChild(createSectionTitle('🌈 Arka Plan Işığı'));
    controlsContainer.appendChild(createSliderControl('Parlaklık', lightControls.backIntensity, 0, 2, 0.1, (value) => {
        lightControls.backIntensity = value;
        if (carSelectionLights.back) carSelectionLights.back.intensity = value;
    }));
    controlsContainer.appendChild(createColorControl('Renk', lightControls.backColor, (value) => {
        lightControls.backColor = value;
        if (carSelectionLights.back) carSelectionLights.back.color.setHex(parseInt(value.replace('#', '0x')));
    }));

    // Preset butonları
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

    // Paneli sayfaya ekle
    document.body.appendChild(lightControlPanel);
}

// Yardımcı fonksiyonlar
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

    // Ayarları uygula
    Object.assign(lightControls, preset);

    // Işıkları güncelle
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

    // Panel kontrollerini güncelle
    updatePanelControls();
}

function updatePanelControls() {
    // Tüm slider ve color input'ları güncelle
    const sliders = lightControlPanel.querySelectorAll('input[type="range"]');
    const colorInputs = lightControlPanel.querySelectorAll('input[type="color"]');
    
    // Bu fonksiyon panelin yeniden oluşturulmasını gerektirebilir
    // Daha basit yaklaşım için paneli yeniden oluştur
    if (lightControlPanel) {
        lightControlPanel.remove();
        createLightControlPanel();
    }
}

// Panel gösterme/gizleme toggle fonksiyonu
function toggleLightControlPanel() {
    if (lightControlPanel) {
        lightControlPanel.style.display = lightControlPanel.style.display === 'none' ? 'block' : 'none';
    } else {
        createLightControlPanel();
    }
}


// Seçilen araçla oyunu başlat
async function startGameWithSelectedCar() {
    // Seçim menüsünü kapat
    const menuContainer = document.getElementById('carSelectionMenu');
    if (menuContainer) {
        // Cleanup
        if (menuContainer.cleanupHandler) {
            menuContainer.cleanupHandler();
        }
        menuContainer.style.display = 'none';
    }
    
    // 3D seçim sahnesini temizle
    cleanup3DCarSelectionScene();
    
    // Oyunu başlat
    gameStarted = true;
    await startGame();
}

// 3D araç seçim sahnesini temizle
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

// Ana oyun başlatma fonksiyonunu güncelle


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

// Araç seçim ekranı için yeni değişkenler
let carSelectionScene = null;
let carSelectionCamera = null;
let carSelectionRenderer = null;
let carSelectionCanvas = null;
let currentDisplayedCar = null;
let carSelectionAnimationId = null;

// Yüklenen araç modelleri (seçim ekranı için)
let loadedCarModels = [];


// 3D araç seçim ekranını oluştur
function createCarSelectionMenu() {
    // Ana konteyner
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

    // Başlık
    const title = document.createElement('h1');
    title.textContent = '🚗 ARAÇ SEÇİMİ 🚗';
    title.style.color = '#FFFFFF';
    title.style.marginBottom = '20px';
    title.style.fontSize = '48px';
    title.style.textShadow = '3px 3px 6px rgba(0,0,0,0.8)';
    title.style.textAlign = 'center';
    menuContainer.appendChild(title);

    // 3D sahne konteyner
    const sceneContainer = document.createElement('div');
    sceneContainer.style.position = 'relative';
    sceneContainer.style.width = '1000px'; // 800px'den 1000px'e artırıldı
    sceneContainer.style.height = '600px'; // 500px'den 600px'e artırıldı
    sceneContainer.style.border = '3px solid #FFD700';
    sceneContainer.style.borderRadius = '15px';
    sceneContainer.style.background = 'linear-gradient(45deg, #2c3e50, #3498db)';
    sceneContainer.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.5)';
    sceneContainer.style.marginBottom = '30px';
    sceneContainer.style.overflow = 'hidden';

    // 3D Canvas
    carSelectionCanvas = document.createElement('canvas');
    carSelectionCanvas.style.width = '100%';
    carSelectionCanvas.style.height = '100%';
    carSelectionCanvas.style.borderRadius = '12px';
    sceneContainer.appendChild(carSelectionCanvas);

    // Araç bilgi paneli (3D sahne üzerine overlay)
    const carInfoPanel = document.createElement('div');
    carInfoPanel.id = 'carInfoPanel';
    carInfoPanel.style.position = 'absolute';
    carInfoPanel.style.top = '5px'; // 10px'den 5px'e küçültüldü
    carInfoPanel.style.left = '5px'; // 10px'den 5px'e küçültüldü
    carInfoPanel.style.background = 'rgba(0, 0, 0, 0.8)';
    carInfoPanel.style.color = '#FFFFFF';
    carInfoPanel.style.padding = '8px'; // 15px'den 8px'e küçültüldü
    carInfoPanel.style.borderRadius = '6px'; // 10px'den 6px'e küçültüldü
    carInfoPanel.style.fontSize = '12px'; // 16px'den 12px'e küçültüldü
    carInfoPanel.style.minWidth = '100px'; // 200px'den 150px'e küçültüldü
    carInfoPanel.style.border = '1px solid #FFD700'; // 2px'den 1px'e ince yapıldı
    carInfoPanel.style.maxWidth = '200px'; // Maksimum genişlik eklendi
    sceneContainer.appendChild(carInfoPanel);

    menuContainer.appendChild(sceneContainer);

    // Kontrol butonları konteyner
    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.gap = '20px';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.marginBottom = '30px';

    // Önceki araç butonu
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

    // Sonraki araç butonu
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

    // Araç indeksi gösterge
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

    // Oyunu başlat butonu
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

    // Kontrol talimatları
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

    // IŞIK KONTROL BUTONU - YENİ EKLENDİ
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
    lightToggleButton.style.padding = '20px 30px'; // 15px 25px'den büyütüldü
    lightToggleButton.style.fontSize = '20px'; // 18px'den büyütüldü
    lightToggleButton.style.color = '#FFFFFF';
    lightToggleButton.style.cursor = 'pointer';
    lightToggleButton.style.fontWeight = 'bold';
    lightToggleButton.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    lightToggleButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    lightToggleButton.style.transition = 'all 0.3s ease';
    lightToggleButton.style.border = '3px solid #FFD700';
    lightToggleButton.style.minWidth = '250px';

    // Işık miktarı butonu ekle
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

    // Hover efektleri ve click eventleri
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

    // Click eventleri
    lightToggleButton.addEventListener('click', toggleCarSelectionLights);
    lightIntensityButton.addEventListener('click', toggleLightIntensityPanel);

    menuContainer.appendChild(lightControlContainer);

    // IŞIK MİKTARI KONTROL PANELİ - YENİ EKLENDİ
    createLightIntensityPanel();

    document.body.appendChild(menuContainer);

    // 3D sahneyi başlat
    init3DCarSelectionScene();

    // Event listener'ları ekle
    prevButton.addEventListener('click', () => changeSelectedCar(-1));
    nextButton.addEventListener('click', () => changeSelectedCar(1));
    startButton.addEventListener('click', startGameWithSelectedCar);

    // Hover efektleri
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

    // Klavye kontrolleri
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
                // IŞIK KONTROLÜ: L tuşu ile ışığı aç/kapat - YENİ EKLENDİ
                case 'KeyL':
                    // Sadece araç seçim ekranı açık olduğunda çalışsın
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
    
    // Cleanup function
    menuContainer.cleanupHandler = () => {
        document.removeEventListener('keydown', keyHandler);
    };

    // İlk arabayı göster
    updateCarDisplay();
}

// 3D araç seçim sahnesini başlat
// 3D araç seçim sahnesini başlat
async function init3DCarSelectionScene() {
    // Sahne oluştur
    carSelectionScene = new THREE.Scene();
    carSelectionScene.background = new THREE.Color(0x1a1a2e);

    // Kamera oluştur - ARAÇ GÖZÜKECEK POZİSYON
    carSelectionCamera = new THREE.PerspectiveCamera(75, 800/600, 0.1, 1000); 
    carSelectionCamera.position.set(0, 2, 6); // Merkez, yukarıdan, yakın
    carSelectionCamera.lookAt(0, 0, 0); // Merkezi bakış

    // Renderer oluştur - TUTARLI BOYUTLAR
    carSelectionRenderer = new THREE.WebGLRenderer({ 
        canvas: carSelectionCanvas, 
        antialias: true,
        alpha: true
    });
    carSelectionRenderer.setSize(800, 600); // 4:3 oranı, tutarlı boyut
    carSelectionRenderer.shadowMap.enabled = true;
    carSelectionRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    carSelectionRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // GÜÇLÜ IŞIKLANDIRMA - ARAÇ GÖRÜNÜR OLSUN
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8); // Daha güçlü ambient
    carSelectionLights.ambient = ambientLight;
    carSelectionScene.add(ambientLight);

    // Ana spot ışık - araç üzerine odaklanmış
    const spotLight = new THREE.SpotLight(0xffffff, 2.0); 
    spotLight.position.set(0, 8, 4); // Yukarıdan aydınlatma
    spotLight.target.position.set(0, 0, 0); // Merkeze bakış
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 0.3;
    spotLight.distance = 15;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    carSelectionLights.spot = spotLight;
    carSelectionScene.add(spotLight);
    carSelectionScene.add(spotLight.target);

    // Dolgulu ışık - araç detayları görünsün
    const fillLight = new THREE.DirectionalLight(0x6699ff, 0.8);
    fillLight.position.set(-3, 3, 3);
    carSelectionLights.lamp = fillLight;
    carSelectionScene.add(fillLight);

    // Arka plan ışığı - atmosfer için
    const backLight = new THREE.PointLight(0xff6600, 0.5, 10);
    backLight.position.set(0, 3, -5);
    carSelectionLights.back = backLight;
    carSelectionScene.add(backLight);

    // Platform - araç altına
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

    // Platform çevresi halka efekti
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

    // IŞIK KONTROL PANELİ OLUŞTUR
    createLightControlPanel();

    // İlk arabayı yükle ve göster
    await loadCarModelsForSelection();
    updateCarDisplay();

    // Başlangıç ışık değerlerini uygula
    updateLightIntensity('ambient', lightSliders.ambient);
    updateLightIntensity('spot', lightSliders.spot);
    updateLightIntensity('point', lightSliders.point);
    updateLightIntensity('directional', lightSliders.directional);

    // Animasyon döngüsü
    carSelectionAnimationLoop();
}
// Araç seçimini değiştir
function changeSelectedCar(direction) {
    selectedCarIndex += direction;
    
    // Döngüsel seçim
    if (selectedCarIndex < 0) {
        selectedCarIndex = AVAILABLE_CARS.length - 1;
    } else if (selectedCarIndex >= AVAILABLE_CARS.length) {
        selectedCarIndex = 0;
    }
    
    updateCarDisplay();
}

// Araç görünümünü güncelle// Araç görünümünü güncelle
// Araç görünümünü güncelle
function updateCarDisplay() {
    console.log('🔄 updateCarDisplay çalışıyor - Araç merkez pozisyonunda gözükecek');
    
    // Eski arabayı kaldır
    if (currentDisplayedCar) {
        carSelectionScene.remove(currentDisplayedCar);
        console.log('❌ Eski araba kaldırıldı');
    }
    
    // Yeni arabayı ekle - MERKEZ POZİSYON (Y=0)
    if (loadedCarModels[selectedCarIndex]) {
        currentDisplayedCar = loadedCarModels[selectedCarIndex].clone();
        currentDisplayedCar.position.set(0, 0.7, 0); // Y=0 merkez pozisyon
        
        
        // Araç boyutunu kontrol et ve gerekirse ölçekle
        const box = new THREE.Box3().setFromObject(currentDisplayedCar);
        const size = box.getSize(new THREE.Vector3());
        console.log('📏 Araç boyutu:', size);
        
        // Çok büyükse küçült
        if (size.y > 3 || size.x > 4 || size.z > 6) {
            const scale = Math.min(3/size.y, 4/size.x, 6/size.z);
            currentDisplayedCar.scale.multiplyScalar(scale);
            console.log('📉 Araç ölçeklendi:', scale);
        }
        
        console.log('✅ Yeni araba Y=0 merkezde eklendi:', currentDisplayedCar.position);
        
        // Gölge ayarları
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
    
    // Bilgi panelini güncelle
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

// Ana oyun başlatma fonksiyonunu güncelle


// SORUN 2: loadRoadModels fonksiyonu eksik - ekleyin
async function loadRoadModels() {
    console.log('🛣️ Yol modelleri yükleniyor...');
    // Basit implementasyon - gerekirse daha detaylı yapılabilir
    return Promise.resolve();
}

// SORUN 3: Eksik utility fonksiyonları - ekleyin
function createCoins() {
    // Mevcut coin'leri temizle
    coins.forEach(coin => scene.remove(coin));
    coins = [];

    // Yeni coin'ler oluştur
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
        
        // Coin animasyonu
        coin.rotation.y += 0.05;
        coin.position.y = 1 + Math.sin(Date.now() * 0.005 + index) * 0.2;
        
        // Çarpışma kontrolü
        const playerBox = new THREE.Box3().setFromObject(playerCar);
        const coinBox = new THREE.Box3().setFromObject(coin);
        
        if (playerBox.intersectsBox(coinBox)) {
            coin.userData.collected = true;
            scene.remove(coin);
            coinCount++;
            score += 100;
            console.log(`💰 Coin toplandı! Toplam: ${coinCount}`);
        }
        
        // MESAFE KONTROLÜ ARTTIRILDI - Geride kalan coin'leri yeniden konumlandır
        if (coin.position.z < carZ - 50) { // 30'dan 50'ye artırıldı
            const newLane = Math.floor(Math.random() * 4);
            coin.position.set(
                getXFromLane(newLane), 
                1, 
                carZ + 100 + Math.random() * 50 // Daha ileri konumlandır
            );
            coin.userData.z = coin.position.z;
            coin.userData.lane = newLane;
            coin.userData.collected = false;
            
            // Coin'i sahneye tekrar ekle (eğer kaldırılmışsa)
            if (!scene.children.includes(coin)) {
                scene.add(coin);
            }
            
            console.log(`🔄 Coin yeniden konumlandırıldı: Lane ${newLane}, Z=${Math.floor(coin.position.z)}`);
        }
    });
    
    // EK GÜVENLİK: Eğer coin sayısı çok azsa yenilerini ekle
    const activeCoinCount = coins.filter(coin => !coin.userData.collected).length;
    if (activeCoinCount < 10) { // Minimum 10 coin olsun
        console.log(`🪙 Coin sayısı az (${activeCoinCount}), yenileri ekleniyor...`);
        addMoreCoins(10 - activeCoinCount);
    }
}

function createWeatherSystem(mapType) {
    console.log(`🌤️ ${mapType.name} haritası için hava durumu oluşturuluyor...`);
}

function updateWeatherEffects() {
    // Hava durumu efektlerini güncelle
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

// SORUN 4: Ana fonksiyon düzeltmeleri
// Sayfa yüklendiğinde çalışacak fonksiyonu düzeltin
window.addEventListener('load', async () => {
    // Body stilini ayarla
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
    // Canvas ve UI oluştur
    createCanvas();
    createGameUI();
    
    try {
        // ARAÇ MODELLERİNİ YÜKLE
        await loadCarModelsForSelection();
        
        // Zaman seçim menüsünü göster
        createDayNightSelectionMenu();
        
        console.log('✅ 3D WebGL Araba Yarış Simülasyonu yüklendi!');
        console.log('Önce zaman seçin, sonra araç seçin ve oyunu başlatın!');
        
    } catch (error) {
        console.error('❌ Oyun yüklenirken hata oluştu:', error);
        
        // Hata durumunda kullanıcıya bilgi ver
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


// SORUN 6: carSelectionAnimationLoop fonksiyonunu güvenli hale getirin
function carSelectionAnimationLoop() {
    // Renderer ve sahne kontrolleri
    if (!carSelectionRenderer || !carSelectionScene || !carSelectionCamera) {
        console.warn('⚠️ Araç seçim animasyon döngüsü durduruluyor - eksik objeler');
        return;
    }
    
    try {
        // Arabayı döndür ve Y=0 merkezinde tutarlı bobbing efekti
        if (currentDisplayedCar) {
            currentDisplayedCar.rotation.y += 0.01; // Yavaş döndürme
            
            // Y=0 merkez etrafında hafif bobbing efekti
            currentDisplayedCar.position.y = Math.sin(Date.now() * 0.002) * 0.1;
        }
        
        // Çevredeki efektleri döndür (eğer varsa)
        carSelectionScene.traverse((object) => {
            if (object.name === 'rotatingRing') {
                object.rotation.y += 0.005;
            }
        });
        
        // Render et
        carSelectionRenderer.render(carSelectionScene, carSelectionCamera);
        
        // Bir sonraki frame'i talep et
        carSelectionAnimationId = requestAnimationFrame(carSelectionAnimationLoop);
        
    } catch (error) {
        console.error('❌ Araç seçim animasyon hatası:', error);
        // Hata durumunda animasyon döngüsünü durdur
        if (carSelectionAnimationId) {
            cancelAnimationFrame(carSelectionAnimationId);
            carSelectionAnimationId = null;
        }
    }
}
// Harita değiştirme fonksiyonu - DÖNGÜSEL OLARAK EKLENDİ
function changeMap() {
    // Coin kontrolü - sadece yeterli coin varsa değiştir
    if (coinCount < COINS_PER_MAP_CHANGE) {
        console.log(`❌ Harita değişimi için ${COINS_PER_MAP_CHANGE} coin gerekli. Mevcut: ${coinCount}`);
        return false;
    }
    
    // Coin'leri harca
    coinCount -= COINS_PER_MAP_CHANGE;
    
    // Önceki harita indexini sakla
    const oldMapIndex = currentMapIndex;
    
    // Sonraki haritaya geç - DÖNGÜSEL OLARAK
    currentMapIndex = (currentMapIndex + 1) % MAP_TYPES.length;
    
    const newMap = MAP_TYPES[currentMapIndex];
    
    console.log(`🗺️ Harita değişimi: ${MAP_TYPES[oldMapIndex].name} → ${newMap.name}`);
    console.log(`🪙 Coin harcandı: ${COINS_PER_MAP_CHANGE}, Kalan: ${coinCount}`);
    console.log(`📍 Yeni harita index: ${currentMapIndex}/${MAP_TYPES.length - 1}`);
    
    // Yolu yeniden oluştur
    createRoad(newMap);
    
    // Müziği değiştir
    playMapMusic(currentMapIndex);
    
    // Engel ve coin'leri temizle
    clearObstaclesAndCoins();
    
    // Yeni engel ve coin'ler oluştur
    createObstacles();
    createCoins();
    
    // Bildirim göster
    showMapChangeNotification(newMap);
    
    return true;
}
// Engel ve coin'leri temizle - HAREİTA DEĞİŞİMİNDE KULLANILIR
function clearObstaclesAndCoins() {
    // Engelleri temizle
    obstacles.forEach(obstacle => {
        scene.remove(obstacle);
        if (obstacle.geometry) obstacle.geometry.dispose();
        if (obstacle.material) obstacle.material.dispose();
    });
    obstacles = [];
    
    // Coin'leri temizle
    coins.forEach(coin => {
        scene.remove(coin);
        if (coin.geometry) coin.geometry.dispose();
        if (coin.material) coin.material.dispose();
    });
    coins = [];
    
    console.log('🧹 Engeller ve coin\'ler temizlendi');
}
// Daha fazla coin eklemek için yardımcı fonksiyon - updateCoins fonksiyonundan sonra ekleyin
function addMoreCoins(count) {
    for (let i = 0; i < count; i++) {
        const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
        const coinMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        
        const lane = Math.floor(Math.random() * 4);
        const z = carZ + 80 + i * 15 + Math.random() * 20; // Arabanın ilerisinde
        
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

// ZİPLAMA SİSTEMİ FONKSİYONLARI - YENİ EKLENDİ
function initiateJump() {
    // Eğer zaten zıplıyorsa veya cooldown aktifse zıplama
    if (isJumping || jumpCooldown) {
        console.log('🚫 Zıplama cooldown aktif veya zaten zıplıyor');
        return;
    }
    
    // Zıplama başlat
    isJumping = true;
    jumpVelocity = jumpSpeed;
    jumpStartY = playerCar.position.y;
    jumpCooldown = true;
    
    console.log('🦘 ZIPLAMA BAŞLADI! Mevcut Y:', jumpStartY);
    
    // Zıplama ses efekti (varsa)
    playJumpSound();
    
    // Zıplama sırasında araba hafifçe öne eğilsin
    if (playerCar) {
        playerCar.rotation.x = -0.2; // Öne eğim
    }
    
    // Cooldown timer'ı başlat
    setTimeout(() => {
        jumpCooldown = false;
        console.log('✅ Zıplama cooldown bitti');
    }, jumpCooldownTime);
}

function updateJump() {
    if (!isJumping || !playerCar) return;
    
    // Yerçekimi etkisi
    jumpVelocity -= gravity;
    
    // Y pozisyonunu güncelle
    playerCar.position.y += jumpVelocity;
    
    // Zemine inip inmediğini kontrol et
    if (playerCar.position.y <= jumpStartY) {
        // Zıplama sona erdi
        playerCar.position.y = jumpStartY;
        isJumping = false;
        jumpVelocity = 0;
        
        // Araba rotasyonunu normale döndür
        playerCar.rotation.x = 0;
        
        console.log('🛬 Zıplama bitti, zemine indi');
        
        // İniş ses efekti
        playLandingSound();
    }
    
    // Maksimum yükseklik kontrolü
    if (playerCar.position.y > jumpStartY + jumpHeight) {
        playerCar.position.y = jumpStartY + jumpHeight;
        jumpVelocity = 0; // Zıplama hızını sıfırla, sadece düşme başlasın
    }
}

// Arabanın havada olup olmadığını kontrol et
function isCarInAir() {
    return isJumping && playerCar && playerCar.position.y > jumpStartY + 0.5;
}

// Zıplama ses efektleri
function playJumpSound() {
    try {
        // Basit ses efekti - daha sonra gerçek ses dosyası eklenebilir
        console.log('🔊 ZIPLAMA SESİ: WHOOSH!');
        
        // Web Audio API ile basit ses üretimi (isteğe bağlı)
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
        
        // Web Audio API ile iniş ses efekti
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

// Zıplama bonus gösterimi
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
    
    // 2 saniye sonra gizle
    setTimeout(() => {
        bonusDiv.style.display = 'none';
    }, 2000);
}
function restartGame() {
    // Game Over ekranını gizle
    const gameOverDiv = document.getElementById('gameOver');
    if (gameOverDiv) {
        gameOverDiv.style.display = 'none';
    }
    
    console.log('🔄 Oyun yeniden başlıyor - Varsayılan müziğe dönülüyor...');
    playMapMusic(0);
    
    // Oyun değişkenlerini sıfırla
    gameActive = true; // ÖNEMLİ: Bu satır mutlaka olmalı!
    score = 0;
    coinCount = 0;
    carPosition = 1;
    carTargetX = getXFromLane(carPosition);
    carZ = 0;
    carSpeed = initialCarSpeed;
    currentMapIndex = 0;
    currentCameraMode = CAMERA_MODES.THIRD_PERSON;
    canMoveMoon = false;
    
    // ZİPLAMA DURUMUNU SIFIRLAMA
    isJumping = false;
    jumpVelocity = 0;
    jumpCooldown = false;
    
    // ARABAYA DOĞRU ROTASYON UYGULA
    if (playerCar) {
        playerCar.position.set(getXFromLane(carPosition), jumpStartY, carZ);
        
        const selectedCarName = AVAILABLE_CARS[selectedCarIndex].name;
        const correctRotation = CAR_ROTATIONS[selectedCarName] || 0;
        playerCar.rotation.set(0, correctRotation, 0);
        
        console.log(`🔄 ${selectedCarName} restart rotasyonu: ${(correctRotation * 180 / Math.PI).toFixed(0)}°`);
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
    
    // Nitro ışıklarını kapat
    nitroLights.forEach(light => {
        light.intensity = 0;
    });
    
    // Ay pozisyonunu sıfırla (gece modundaysa)
    if (isNightMode && moonObject) {
        moonObject.position.set(0, 80, -40);
        updateMoonPosition();
    }
    
    console.log('✅ Oyun yeniden başlatıldı! gameActive:', gameActive);
}
// IŞIK KONTROL FONKSİYONLARI - YENİ EKLENDİ
function toggleCarSelectionLights() {
    carSelectionLightsEnabled = !carSelectionLightsEnabled;
    
    console.log(`💡 Araç seçim ışıkları: ${carSelectionLightsEnabled ? 'AÇILDI' : 'KAPATILDI'}`);
    
    // Buton görünümünü güncelle
    updateLightToggleButton();
    
    // Sahne ışıklarını güncelle
    updateCarSelectionSceneLights();
    
    // Işık ses efekti (isteğe bağlı)
    playLightToggleSound();
}

function updateLightToggleButton() {
    if (!lightToggleButton) return;
    
    lightToggleButton.innerHTML = carSelectionLightsEnabled ? '💡 Işık: AÇIK' : '🌙 Işık: KAPALI';
    lightToggleButton.style.background = carSelectionLightsEnabled ? 
        'linear-gradient(45deg, #FFD700, #FFA500)' : 
        'linear-gradient(45deg, #2C3E50, #34495E)';
    
    // Animasyon efekti
    lightToggleButton.style.transform = 'scale(1.2)';
    setTimeout(() => {
        lightToggleButton.style.transform = 'scale(1)';
    }, 200);
}

function updateCarSelectionSceneLights() {
    if (!carSelectionScene) return;
    
    // Tüm ışıkları bul ve aç/kapat
    carSelectionScene.traverse((child) => {
        if (child.isLight) {
            child.visible = carSelectionLightsEnabled;
            
            // Işık kapatıldığında intensity'yi sıfırla, açıldığında geri yükle
            if (carSelectionLightsEnabled) {
                // Işık tiplerine göre orijinal intensity'leri geri yükle
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
    
    // Arka plan rengini de ayarla
    if (carSelectionScene.background) {
        if (carSelectionLightsEnabled) {
            // Normal renk
            carSelectionScene.background.setHex(0x1a1a2e);
        } else {
            // Çok koyu renk
            carSelectionScene.background.setHex(0x000000);
        }
    }
    
    console.log(`🔄 Sahne ışıkları güncellendi: ${carSelectionLightsEnabled ? 'Açık' : 'Kapalı'}`);
}

function playLightToggleSound() {
    try {
        // Basit ışık açma/kapama ses efekti
        if (typeof AudioContext !== 'undefined') {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (carSelectionLightsEnabled) {
                // Işık açma sesi - yükselen ton
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
                console.log('🔊 IŞIK AÇMA SESİ: DING!');
            } else {
                // Işık kapama sesi - düşen ton
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

// IŞIK MİKTARI KONTROL PANELİ FONKSİYONLARI - YENİ EKLENDİ
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

    // Panel başlığı
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

    // Kapatma butonu
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

    // Işık kontrolleri
    createLightSlider('🌅 Ortam Işığı', 'ambient', 0, 2, 0.1);
    createLightSlider('💡 Spot Işık', 'spot', 0, 5, 0.1);
    createLightSlider('🔆 Point Işık', 'point', 0, 3, 0.1);
    createLightSlider('🌞 Directional Işık', 'directional', 0, 2, 0.1);

    // Hızlı ayar butonları
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
        
        // Slider rengini değere göre ayarla
        const percent = ((value - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(to right, #333 0%, #FFD700 ${percent}%, #333 ${percent}%, #333 100%)`;
    });

    // İlk yükleme için renk ayarı
    const percent = ((lightSliders[key] - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, #333 0%, #FFD700 ${percent}%, #333 ${percent}%, #333 100%)`;

    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(valueDisplay);
    container.appendChild(labelElement);
    container.appendChild(sliderContainer);
    lightIntensityPanel.appendChild(container);
}

function updateLightIntensity(lightType, value) {
    if (!carSelectionLightsEnabled) return; // Işıklar kapalıysa güncelleme yapma
    
    // Doğru ışık objesini bul ve güncelle
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
    
    // Tüm slider değerlerini güncelle
    const sliders = lightIntensityPanel.querySelectorAll('input[type="range"]');
    const valueDisplays = lightIntensityPanel.querySelectorAll('span[style*="min-width: 40px"]');
    
    Object.keys(lightSliders).forEach((key, index) => {
        if (sliders[index]) {
            sliders[index].value = lightSliders[key];
            
            // Slider rengini güncelle
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
        // Panel kapanırken animasyon
        lightIntensityPanel.style.transform = 'scale(0.8)';
        lightIntensityPanel.style.opacity = '0';
        setTimeout(() => {
            lightIntensityPanel.style.display = 'none';
        }, 300);
    } else {
        // Panel açılırken animasyon
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