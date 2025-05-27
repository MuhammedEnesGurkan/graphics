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
    // diğer .glb yollarını ekleyebilirsin
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
    }

    
];

// SORUN 1: Eksik değişken tanımlamaları - dosyanın başına ekleyin
let selectedCar = null;
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
    
    // YOL MODELLERİNİ YÜKLE - YENİ EKLENDİ
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
        // Seçilen arabayı al
        selectedCar = AVAILABLE_CARS[selectedCarIndex];
        console.log(`🚗 ${selectedCar.name} modeli yükleniyor...`);
        
        const gltf = await new Promise((resolve, reject) => {
            loader.load(selectedCar.path, resolve, undefined, reject);
        });
        
        carModel = gltf.scene.clone();
        carModel.scale.set(selectedCar.scale, selectedCar.scale, selectedCar.scale);
       if (selectedCar.name === "DJ" || selectedCar.name === "Finn McMissle") {
    carModel.rotation.y = - Math.PI / 2; // 90 derece döndür
    console.log(`🔄 ${selectedCar.name} modeli 90 derece döndürüldü`);
}

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
      // Kar yığınları ekle - DAHA FAZLA
      for (let i = 0; i < 40; i++) { // 20'den 40'a artırıldı
        const snowRadius = 1 + Math.random() * 1.5;
        const snowGeo = new THREE.SphereGeometry(snowRadius, 8, 6);
        const snowMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        const snow = new THREE.Mesh(snowGeo, snowMat);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (8 + Math.random() * 15);
        const z = Math.random() * 600 - 100; // Daha uzun mesafe
        
        snow.position.set(x, 0, z);
        snow.scale.y = 0.5; // Yassıltılmış kar yığını
        snow.receiveShadow = true;
        roadGroup.add(snow);
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

    const obstacleCount = 1;
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
        // OK TUŞLARI KALDIRILIYOR - ARAÇ KONTROLÜ İÇİN SERBEST BIRAKILIYOR
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
        // MÜZİK KONTROLÜ: P tuşuna basınca müziği aç/kapat
        case 'KeyP':
            toggleMusic();
            showMusicNotification();
            break;
    }
    
    // HERHANGİ BİR TUŞ BASILINCA MÜZİK BAŞLAT (ilk etkileşim)
    tryStartMusicOnFirstInteraction();
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

  // YENİ HAREİTA DEĞİŞİM SİSTEMİ - DÖNGÜSEL OLARAK
  if (coinCount >= COINS_PER_MAP_CHANGE) {
    // Otomatik harita değişimi yap
    const success = changeMap();
    if (success) {
      console.log(`✅ Otomatik harita değişimi başarılı: ${MAP_TYPES[currentMapIndex].name}`);
    }
  }

  if ([3, 4, 5, 6].includes(selectedCarIndex) && currentMapIndex === 0) { // Wingo ve Normal harita
    // Eğer şu anda Wingo'nun özel müziği çalmıyorsa başlat
    if (!currentMusic || !currentMusic.src.includes('Gang_Cars.mp3')) {
      console.log('🎵 Wingo normal haritada - özel müzik başlatılıyor...');
      
      // Mevcut müziği durdur
      if (currentMusic) {
        currentMusic.pause();
        currentMusic = null;
      }
      
      // Wingo'nun özel müziğini çal
      try {
        currentMusic = new Audio('graphics_three/musics/Gang_Cars.mp3');
        currentMusic.volume = MUSIC_VOLUME;
        currentMusic.loop = true;
        
        if (musicEnabled) {
          currentMusic.play().catch(e => {
            console.warn('Wingo müziği çalınamadı:', e);
          });
        }
        
        console.log('🚗 Wingo özel müziği başladı!');
      } catch (error) {
        console.error('Wingo müziği yüklenemedi:', error);
        // Hata durumunda normal harita müziğine dön
        playMapMusic(currentMapIndex);
      }
    }
  } else {
    // Wingo değilse veya normal harita değilse, normal harita müziği çal
    if (currentMusic && currentMusic.src.includes('Gang_Cars.mp3')) {
      console.log('🎵 Wingo özel müziği durduruluyor - normal müziğe dönülüyor...');
      playMapMusic(currentMapIndex);
    }
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
   <p>Shift/N: Nitro | Ctrl/B: Fren</p>
   <p>C: Kamera Değiştir (3 Mod)</p>
   <p>P: Müzik Aç/Kapat 🎵</p>
   ${isNightMode ? '<p style="color: #FFD700;">🌙 GECE MODU:</p><p>M: Ay Hareket Modu | WASD: Ay Kontrolü</p><p style="color: #FFB6C1;">(Ok tuşları her zaman araç için kullanılır)</p>' : ''}
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
    sceneContainer.style.width = '600px';
    sceneContainer.style.height = '400px';
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
    carInfoPanel.style.maxWidth = '180px'; // Maksimum genişlik eklendi
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
        <p>Fare ile butonları kullanabilirsiniz</p>
    `;
    menuContainer.appendChild(instructions);

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
async function init3DCarSelectionScene() {
    // Sahne oluştur
    carSelectionScene = new THREE.Scene();
    carSelectionScene.background = new THREE.Color(0x1a1a2e);

    // Kamera oluştur - LAMBA GÖRÜNEBİLSİN DİYE POZİSYON AYARLANDI
   carSelectionCamera = new THREE.PerspectiveCamera(50, 600/400, 0.1, 1000);
    carSelectionCamera.position.set(4, 2, 6); // Normal kamera pozisyonu
    carSelectionCamera.lookAt(0, 0, 0); // Zemini görecek şekilde


    // Renderer oluştur
    carSelectionRenderer = new THREE.WebGLRenderer({ 
        canvas: carSelectionCanvas, 
        antialias: true,
        alpha: true
    });
    carSelectionRenderer.setSize(600, 400);
    carSelectionRenderer.shadowMap.enabled = true;
    carSelectionRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    carSelectionRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // TAVAN LAMBASI GLB MODEL YÜKLEMESİ
    try {
        console.log('🔆 Tavan lambası yükleniyor...');
        
        // GLTFLoader kontrolü
        if (typeof GLTFLoader === 'undefined') {
            throw new Error('GLTFLoader yüklenmemiş');
        }
        
        const loader = new GLTFLoader();
        const lampGltf = await new Promise((resolve, reject) => {
            loader.load(
                'graphics_three/assets/ceiling_lamp_-_11mb.glb',
                (gltf) => {
                    console.log('✅ Tavan lambası başarıyla yüklendi');
                    resolve(gltf);
                },
                (progress) => {
                    console.log('📈 Lamba yükleme ilerlemesi:', Math.round((progress.loaded / progress.total) * 100) + '%');
                },
                (error) => {
                    console.error('❌ Tavan lambası yükleme hatası:', error);
                    reject(error);
                }
            );
        });
       const ceilingLamp = lampGltf.scene.clone();
        
        // Lamba pozisyonu ve ölçeği ayarla - ARABA ÜSTÜNDEKİ POZİSYON
        ceilingLamp.position.set(0, 1.5, 0); // Arabanın hemen üstünde (Y=1.5)
        ceilingLamp.scale.set(0.03, 0.03, 0.03); 
        
        // Lamba materyallerini parlak yap
        ceilingLamp.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Eğer lamba ampulü varsa parlak yap
                if (child.material) {
                    if (child.name.toLowerCase().includes('bulb') || 
                        child.name.toLowerCase().includes('light')) {
                        child.material.emissive = new THREE.Color(0xffffaa);
                        child.material.emissiveIntensity = 0.5;
                    }
                }
            }
        });
        
        carSelectionScene.add(ceilingLamp);
        console.log('🔆 Tavan lambası sahneye eklendi');
        
    } catch (error) {
        console.warn('⚠️ Tavan lambası yüklenemedi, basit lamba oluşturuluyor:', error);
        
        // Alternatif basit lamba oluştur
        const lampGroup = new THREE.Group();
        
        // Lamba gövdesi
        const lampBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.3, 1, 8),
            new THREE.MeshPhongMaterial({ color: 0x444444 })
        );
        lampBody.position.y = 6;
        
        // Lamba ampulü
        const lampBulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 16, 16),
            new THREE.MeshBasicMaterial({ 
                color: 0xffffaa,
                emissive: 0xffffaa,
                emissiveIntensity: 0.3
            })
        );
        lampBulb.position.y = 5.5;
        
        lampGroup.add(lampBody);
        lampGroup.add(lampBulb);
        carSelectionScene.add(lampGroup);
    }

    // Işıklandırma - GÜÇLÜ VE GÖRÜNÜR
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3); // Daha düşük ambient
    carSelectionScene.add(ambientLight);

    // Ana spot ışık - tavan lambasından
    const spotLight = new THREE.SpotLight(0xffffff, 3.0); // Daha güçlü
    spotLight.position.set(0, 6, 0); // Lambanın pozisyonunda
    spotLight.target.position.set(0, 0, 0);
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 0.2;
    spotLight.distance = 20;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.camera.near = 0.1;
    spotLight.shadow.camera.far = 25;
    carSelectionScene.add(spotLight);
    carSelectionScene.add(spotLight.target);

    // Lamba etrafında yumuşak ışık
    const lampLight = new THREE.PointLight(0xffffcc, 2.0, 15);
    lampLight.position.set(0, 5.5, 0);
    carSelectionScene.add(lampLight);

    // Dolgulu ışık (fill light)
    const fillLight = new THREE.DirectionalLight(0x6699ff, 0.8);
    fillLight.position.set(-5, 3, 5);
    carSelectionScene.add(fillLight);

   
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
        opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.y = -0.45;
    ring.rotation.x = Math.PI / 2;
    carSelectionScene.add(ring);

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

// Araç görünümünü güncelle
// 3D araç seçim sahnesini başlat
async function init3DCarSelectionScene() {
    // Sahne oluştur
    carSelectionScene = new THREE.Scene();
    carSelectionScene.background = new THREE.Color(0x1a1a2e);

    // Kamera oluştur
    carSelectionCamera = new THREE.PerspectiveCamera(50, 600/400, 0.1, 1000);
    carSelectionCamera.position.set(4, 2, 6);
    carSelectionCamera.lookAt(0, 0, 0);

    // Renderer oluştur
    carSelectionRenderer = new THREE.WebGLRenderer({ 
        canvas: carSelectionCanvas, 
        antialias: true,
        alpha: true
    });
    carSelectionRenderer.setSize(600, 400);
    carSelectionRenderer.shadowMap.enabled = true;
    carSelectionRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    carSelectionRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // TAVAN LAMBASI GLB MODEL YÜKLEMESİ - YENİ EKLENDİ
    // TAVAN LAMBASI GLB MODEL YÜKLEMESİ - ÇOK KÜÇÜK ÖLÇEK VE ARABA ÜSTÜNDEKİ POZİSYON
try {
    console.log('🔆 Tavan lambası yükleniyor...');
    
    // GLTFLoader kontrolü
    if (typeof GLTFLoader === 'undefined') {
        throw new Error('GLTFLoader yüklenmemiş');
    }
    
    const loader = new GLTFLoader();
    const lampGltf = await new Promise((resolve, reject) => {
        loader.load(
            'graphics_three/assets/ceiling_lamp_-_11mb.glb',
            (gltf) => {
                console.log('✅ Tavan lambası başarıyla yüklendi');
                resolve(gltf);
            },
            (progress) => {
                console.log('📈 Lamba yükleme ilerlemesi:', Math.round((progress.loaded / progress.total) * 100) + '%');
            },
            (error) => {
                console.error('❌ Tavan lambası yükleme hatası:', error);
                reject(error);
            }
        );
    });
    
    const ceilingLamp = lampGltf.scene.clone();
    
    // Lamba pozisyonu ve ölçeği ayarla - ÇOK KÜÇÜK VE ARABA ÜSTÜNDEKİ POZİSYON
    ceilingLamp.position.set(0, 2.5, 0); // Arabanın hemen üstünde (Y=2.5)
    ceilingLamp.scale.set(0.05, 0.05, 0.05); // ÇOK KÜÇÜK ölçek (0.3'ten 0.05'e)
    
    // Lamba materyallerini parlak yap
    ceilingLamp.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Eğer lamba ampulü varsa parlak yap
            if (child.material) {
                if (child.name.toLowerCase().includes('bulb') || 
                    child.name.toLowerCase().includes('light')) {
                    child.material.emissive = new THREE.Color(0xffffaa);
                    child.material.emissiveIntensity = 0.5;
                }
            }
        }
    });
    
    carSelectionScene.add(ceilingLamp);
    console.log('🔆 Küçük tavan lambası arabanın üstünde konumlandırıldı');
    
} catch (error) {
    console.warn('⚠️ Tavan lambası yüklenemedi, basit lamba oluşturuluyor:', error);
    
    // Alternatif basit lamba oluştur - KÜÇÜK VERSİYON
    const lampGroup = new THREE.Group();
    
    // Lamba gövdesi - küçük
    const lampBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.05, 0.2, 8), // Çok küçük silindir
        new THREE.MeshPhongMaterial({ color: 0x444444 })
    );
    lampBody.position.y = 2.5; // Arabanın üstünde
    
    // Lamba ampulü - küçük
    const lampBulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 16, 16), // Çok küçük ampul
        new THREE.MeshBasicMaterial({ 
            color: 0xffffaa,
            emissive: 0xffffaa,
            emissiveIntensity: 0.3
        })
    );
    lampBulb.position.y = 2.3; // Ampul biraz aşağıda
    
    lampGroup.add(lampBody);
    lampGroup.add(lampBulb);
    carSelectionScene.add(lampGroup);
    
    console.log('🔆 Alternatif küçük lamba arabanın üstünde oluşturuldu');
}

    // Işıklandırma
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    carSelectionScene.add(ambientLight);

    // Ana spot ışık - tavan lambasından geliyormuş gibi konumlandırıldı// Ana spot ışık - küçük tavan lambasından geliyormuş gibi konumlandırıldı
const spotLight = new THREE.SpotLight(0xffffff, 2.0); // Parlaklık artırıldı
spotLight.position.set(0, 3, 0); // Lambanın hemen üstünde (Y=3)
spotLight.target.position.set(0, 0, 0); // Platform merkezini hedefle
spotLight.angle = Math.PI / 4; // Dar açı
spotLight.penumbra = 0.3;
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
carSelectionScene.add(spotLight);
carSelectionScene.add(spotLight.target);

// Lambanın kendi ışığı (görsel efekt için) - YENİ POZİSYON
const lampLight = new THREE.PointLight(0xffffcc, 1.0, 8);
lampLight.position.set(0, 2.5, 0); // Lamba ile aynı pozisyon
carSelectionScene.add(lampLight);

    // Arka plan için rengarenk ışık
    const backLight = new THREE.PointLight(0xff6600, 0.5, 20);
    backLight.position.set(-4, 3, -2);
    carSelectionScene.add(backLight);

    // Platform (araba altı zemin)
    const platformGeometry = new THREE.CylinderGeometry(3, 3, 0.1, 32);
    const platformMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x2c3e50,
        transparent: true,
        opacity: 0.8
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
    carSelectionScene.add(ring);

    // Animasyon döngüsü
    carSelectionAnimationLoop();
}

// Araç seçim animasyon döngüsü
// Araç seçim animasyon döngüsü
// Araç seçim animasyon döngüsü
function carSelectionAnimationLoop() {
    // Renderer ve sahne kontrolleri
    if (!carSelectionRenderer || !carSelectionScene || !carSelectionCamera) {
        console.warn('⚠️ Araç seçim animasyon döngüsü durduruluyor - eksik objeler');
        return;
    }
    
    try {
        // Arabayı döndür ve bobbing efekti ekle
        if (currentDisplayedCar) {
            currentDisplayedCar.rotation.y += 0.01;
            
            // Hafif yukarı aşağı bobbing efekti - BASE POZİSYONU AYARLANDI
            currentDisplayedCar.position.y = 0.3 + Math.sin(Date.now() * 0.002) * 0.1; // Base pozisyon 0.3
        }
        
        // Arka plan rengini değiştir (yavaşça)
        const time = Date.now() * 0.0005;
        const r = Math.sin(time) * 0.5 + 0.5;
        const g = Math.sin(time + 2) * 0.5 + 0.5;
        const b = Math.sin(time + 4) * 0.5 + 0.5;
        carSelectionScene.background.setRGB(r * 0.1, g * 0.1, b * 0.2);
        
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
async function startGame() {
    scene = new THREE.Scene();
    const canvas = document.getElementById('gameCanvas');
    
    // YOL MODELLERİNİ YÜKLE - YENİ EKLENDİ
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
    sceneContainer.style.width = '600px';
    sceneContainer.style.height = '400px';
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
    carInfoPanel.style.top = '10px';
    carInfoPanel.style.left = '10px';
    carInfoPanel.style.background = 'rgba(0, 0, 0, 0.8)';
    carInfoPanel.style.color = '#FFFFFF';
    carInfoPanel.style.padding = '15px';
    carInfoPanel.style.borderRadius = '10px';
    carInfoPanel.style.fontSize = '16px';
    carInfoPanel.style.minWidth = '200px';
    carInfoPanel.style.border = '2px solid #FFD700';
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
        <p>Fare ile butonları kullanabilirsiniz</p>
    `;
    menuContainer.appendChild(instructions);

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

    // Kamera oluştur
    carSelectionCamera = new THREE.PerspectiveCamera(50, 600/400, 0.1, 1000);
    carSelectionCamera.position.set(4, 2, 6);
    carSelectionCamera.lookAt(0, 0, 0);

    // Renderer oluştur
    carSelectionRenderer = new THREE.WebGLRenderer({ 
        canvas: carSelectionCanvas, 
        antialias: true,
        alpha: true
    });
    carSelectionRenderer.setSize(600, 400);
    carSelectionRenderer.shadowMap.enabled = true;
    carSelectionRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    carSelectionRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // TAVAN LAMBASI GLB MODEL YÜKLEMESİ - YENİ EKLENDİ
    try {
        console.log('🔆 Tavan lambası yükleniyor...');
        const lampGltf = await new Promise((resolve, reject) => {
            loader.load(
                'graphics_three/assets/ceiling_lamp_-_11mb.glb',
                (gltf) => {
                    console.log('✅ Tavan lambası başarıyla yüklendi');
                    resolve(gltf);
                },
                (progress) => {
                    console.log('📈 Lamba yükleme ilerlemesi:', Math.round((progress.loaded / progress.total) * 100) + '%');
                },
                (error) => {
                    console.error('❌ Tavan lambası yükleme hatası:', error);
                    reject(error);
                }
            );
        });
        
        const ceilingLamp = lampGltf.scene.clone();
        
        // Lamba pozisyonu ve ölçeği ayarla
        ceilingLamp.position.set(0, 6, 0); // Sahnenin üstünde
        ceilingLamp.scale.set(0.5, 0.5, 0.5); // Boyutunu ayarla
        
        // Gölge ayarları
        ceilingLamp.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        carSelectionScene.add(ceilingLamp);
        console.log('🔆 Tavan lambası sahneye eklendi');
        
    } catch (error) {
        console.warn('⚠️ Tavan lambası yüklenemedi, varsayılan ışıklandırma kullanılacak:', error);
    }

    // Işıklandırma
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    carSelectionScene.add(ambientLight);

    // Ana spot ışık - tavan lambasından geliyormuş gibi konumlandırıldı
    const spotLight = new THREE.SpotLight(0xffffff, 1.5);
    spotLight.position.set(0, 8, 0); // Tavan lambasının hemen üstünde
    spotLight.target.position.set(0, 0, 0); // Platform merkezini hedefle
    spotLight.angle = Math.PI / 3; // Geniş açı
    spotLight.penumbra = 0.3;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    carSelectionScene.add(spotLight);
    carSelectionScene.add(spotLight.target);

    // Ek dolgu ışığı
    const fillLight = new THREE.DirectionalLight(0x4477ff, 0.4);
    fillLight.position.set(-3, 2, 4);
    carSelectionScene.add(fillLight);

    // Arka plan için rengarenk ışık
    const backLight = new THREE.PointLight(0xff6600, 0.5, 20);
    backLight.position.set(-4, 3, -2);
    carSelectionScene.add(backLight);

    // Platform (araba altı zemin)
    const platformGeometry = new THREE.CylinderGeometry(3, 3, 0.1, 32);
    const platformMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x2c3e50,
        transparent: true,
        opacity: 0.8
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
    carSelectionScene.add(ring);

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
    console.log('🔄 updateCarDisplay çalışıyor - Y pozisyonu 5 olarak ayarlanacak');
    
    // Eski arabayı kaldır
    if (currentDisplayedCar) {
        carSelectionScene.remove(currentDisplayedCar);
        console.log('❌ Eski araba kaldırıldı');
    }
    
    // Yeni arabayı ekle - Y POZİSYONU 5
    if (loadedCarModels[selectedCarIndex]) {
        currentDisplayedCar = loadedCarModels[selectedCarIndex].clone();
        currentDisplayedCar.position.set(0, 5, 0); // Y=5 olarak ayarlandı
        currentDisplayedCar.rotation.y = 0;
        
        console.log('✅ Yeni araba Y=5 pozisyonunda eklendi:', currentDisplayedCar.position);
        
        // Gölge ayarları
        currentDisplayedCar.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        carSelectionScene.add(currentDisplayedCar);
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
                • Y Pozisyon: 5<br>
                • Durum: ${loadedCarModels[selectedCarIndex] ? '✅ Hazır' : '❌ Yüklenmedi'}
            </div>
        `;
    }
    
    if (carIndexDisplay) {
        carIndexDisplay.textContent = `${selectedCarIndex + 1} / ${AVAILABLE_CARS.length}`;
    }
}

// Araç seçim animasyon döngüsü// Araç seçim animasyon döngüsü
function carSelectionAnimationLoop() {
    // Renderer ve sahne kontrolleri
    if (!carSelectionRenderer || !carSelectionScene || !carSelectionCamera) {
        console.warn('⚠️ Araç seçim animasyon döngüsü durduruluyor - eksik objeler');
        return;
    }
    
    try {
        // Arabayı döndür ve bobbing efekti ekle
        if (currentDisplayedCar) {
            currentDisplayedCar.rotation.y += 0.01;
            
            // Y=5 baz pozisyonunda bobbing efekti
            currentDisplayedCar.position.y = 5 + Math.sin(Date.now() * 0.002) * 0.1; // Base pozisyon 5
        }
        
        // Arka plan rengini değiştir (yavaşça)
        const time = Date.now() * 0.0005;
        const r = Math.sin(time) * 0.5 + 0.5;
        const g = Math.sin(time + 2) * 0.5 + 0.5;
        const b = Math.sin(time + 4) * 0.5 + 0.5;
        carSelectionScene.background.setRGB(r * 0.1, g * 0.1, b * 0.2);
        
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
async function startGame() {
    scene = new THREE.Scene();
    const canvas = document.getElementById('gameCanvas');
    
    // YOL MODELLERİNİ YÜKLE - YENİ EKLENDİ
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
    currentCameraMode = (currentCameraMode + 1) % 3;
    
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

// SORUN 5: loadCarModelsForSelection fonksiyonunu debug ile güçlendirin
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

// SORUN 6: carSelectionAnimationLoop fonksiyonunu güvenli hale getirin
function carSelectionAnimationLoop() {
    // Renderer ve sahne kontrolleri
    if (!carSelectionRenderer || !carSelectionScene || !carSelectionCamera) {
        console.warn('⚠️ Araç seçim animasyon döngüsü durduruluyor - eksik objeler');
        return;
    }
    
    try {
        // Arabayı döndür
        if (currentDisplayedCar) {
            currentDisplayedCar.rotation.y += 0.01;
            
            // Hafif yukarı aşağı bobbing efekti
            currentDisplayedCar.position.y = Math.sin(Date.now() * 0.002) * 0.1;
        }
        
        // Arka plan rengini değiştir (yavaşça)
        const time = Date.now() * 0.0005;
        const r = Math.sin(time) * 0.5 + 0.5;
        const g = Math.sin(time + 2) * 0.5 + 0.5;
        const b = Math.sin(time + 4) * 0.5 + 0.5;
        carSelectionScene.background.setRGB(r * 0.1, g * 0.1, b * 0.2);
        
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