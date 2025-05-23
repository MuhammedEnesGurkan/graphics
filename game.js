// 3D WebGL Araba Yarış Simülasyonu - Three.js ile GLB Asset Desteği

//import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
//import { GLTFLoader } from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/GLTFLoader.js';

// Global değişkenler
// Harita tipleri - en başta global değişkenlerle birlikte tanımlanacak
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

// 🎵 MÜZİK SİSTEMİ
class GameMusicSystem {
  constructor() {
    this.audioContext = null;
    this.masterGainNode = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.3;
    this.currentTheme = 'normal';
    this.oscillators = [];
    this.intervalId = null;
  }

  async init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.connect(this.audioContext.destination);
      this.masterGainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
      
      console.log("🎵 Müzik sistemi hazır!");
      return true;
    } catch (error) {
      console.log("Müzik sistemi başlatılamadı:", error);
      return false;
    }
  }

  // Tema müzikleri - her tema için farklı melodi
  getThemeMusic(theme) {
    const themes = {
      normal: {
        name: "Highway Cruiser",
        bpm: 120,
        scale: [440, 494, 523, 587, 659, 698, 784, 880], // A major scale
        pattern: [0, 2, 4, 2, 0, 4, 6, 4, 2, 0, 2, 4],
        bass: [220, 220, 277, 277, 330, 330, 277, 277],
        rhythm: [1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1]
      },
      desert: {
        name: "Desert Storm",
        bpm: 100,
        scale: [440, 466, 523, 554, 659, 698, 740, 880], // Arabic-ish scale
        pattern: [0, 3, 1, 4, 2, 5, 3, 6, 4, 7, 2, 0],
        bass: [220, 233, 247, 220, 277, 233, 220, 247],
        rhythm: [1, 0.75, 0.25, 1, 0.5, 0.5, 1, 0.75]
      },
      snowy: {
        name: "Winter Drive",
        bpm: 90,
        scale: [440, 466, 493, 523, 554, 587, 622, 659], // Minor scale
        pattern: [0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7],
        bass: [220, 247, 220, 262, 233, 277, 247, 220],
        rhythm: [1.5, 0.5, 1, 1, 0.5, 0.5, 1, 1.5]
      },
      spring: {
        name: "Nature Cruise",
        bpm: 110,
        scale: [440, 494, 523, 587, 659, 698, 784, 880], // Happy major
        pattern: [0, 4, 2, 6, 4, 7, 5, 3, 1, 5, 3, 7],
        bass: [220, 277, 247, 330, 277, 220, 294, 247],
        rhythm: [0.5, 0.5, 1, 0.5, 0.5, 1, 0.75, 0.25]
      }
    };
    
    return themes[theme] || themes.normal;
  }

  startMusic(theme = 'normal') {
    if (!this.audioContext || this.isPlaying) return;
    
    this.currentTheme = theme;
    this.isPlaying = true;
    
    const music = this.getThemeMusic(theme);
    const beatDuration = 60 / music.bpm; // Saniye cinsinden beat süresi
    
    let noteIndex = 0;
    let bassIndex = 0;
    
    // Ana melodi ve bas döngüsü
    this.intervalId = setInterval(() => {
      if (this.isMuted || !this.isPlaying) return;
      
      // Ana melodi notası
      this.playNote(
        music.scale[music.pattern[noteIndex]], 
        beatDuration * music.rhythm[noteIndex % music.rhythm.length], 
        0.15, 
        'sine'
      );
      
      // Bas notası (her 2 beatte bir)
      if (noteIndex % 2 === 0) {
        this.playNote(
          music.bass[bassIndex], 
          beatDuration * 2, 
          0.08, 
          'sawtooth'
        );
        bassIndex = (bassIndex + 1) % music.bass.length;
      }
      
      // Perküsyon (her 4 beatte bir)
      if (noteIndex % 4 === 0) {
        this.playDrum();
      }
      
      noteIndex = (noteIndex + 1) % music.pattern.length;
      
    }, beatDuration * 500); // Her yarım beatte çal
    
    console.log(`🎵 "${music.name}" çalmaya başladı!`);
  }

  playNote(frequency, duration, volume, waveType = 'sine') {
    if (!this.audioContext || this.isMuted) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGainNode);
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = waveType;
    
    // ADSR envelope (Attack, Decay, Sustain, Release)
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.02); // Attack
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.8, this.audioContext.currentTime + 0.1); // Decay
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration); // Release
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
    
    this.oscillators.push(oscillator);
    
    // Oscillatoru listeden temizle
    oscillator.onended = () => {
      const index = this.oscillators.indexOf(oscillator);
      if (index > -1) {
        this.oscillators.splice(index, 1);
      }
    };
  }

  playDrum() {
    if (!this.audioContext || this.isMuted) return;
    
    // Basit kick drum sesi
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGainNode);
    
    oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.1);
    oscillator.type = 'triangle';
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  stopMusic() {
    this.isPlaying = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Aktif oscillatörleri durdur
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Zaten durmuş olabilir
      }
    });
    this.oscillators = [];
    
    console.log("🎵 Müzik durdu");
  }

  changeTheme(newTheme) {
    if (this.currentTheme === newTheme) return;
    
    console.log(`🎵 Tema değişiyor: ${this.currentTheme} → ${newTheme}`);
    
    // Eski müziği durdur
    this.stopMusic();
    
    // Kısa bir pause sonra yeni tema müziğini başlat
    setTimeout(() => {
      this.startMusic(newTheme);
    }, 500);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.masterGainNode) {
      this.masterGainNode.gain.setValueAtTime(
        this.isMuted ? 0 : this.volume, 
        this.audioContext.currentTime
      );
    }
    
    return this.isMuted;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGainNode && !this.isMuted) {
      this.masterGainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    }
  }
}

// Global müzik sistemi
let musicSystem = new GameMusicSystem();

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
  }, 3000); // 300'den 3000'e değiştirdim
}

// Oyunu başlat
async function init() {
  const canvas = document.getElementById('gameCanvas');
  
  // Three.js sahne kurulumu
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(MAP_TYPES[0].fogColor, 0.01);
  
  // Kamera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(MAP_TYPES[0].skyColor); // İlk harita tipi için gökyüzü rengi
  
  // 🎵 Müzik sistemini başlat
  const musicReady = await musicSystem.init();
  if (musicReady) {
    // Oyun başlar başlamaz müzik çalmaya başla
    musicSystem.startMusic('normal');
  }
  
  // Işıklar
  setupLighting();
  
  // Pencere boyut değişikliği
  window.addEventListener('resize', onWindowResize);
  
  // Kontroller
  document.addEventListener('keydown', handleKeyPress);
  
  // Müzik kontrol butonları
  setupMusicControls();
  
  // İlk haritayı oluştur (normal)
  createRoad(MAP_TYPES[0]);
  
  // Araba modelini yükle
  await loadCarModel();
  
  // Engelleri oluştur
  createObstacles();
  
  // Oyun döngüsünü başlat
  gameLoop();
}

// Müzik kontrol butonlarını ayarla
function setupMusicControls() {
  // Mute/Unmute button
  const muteButton = document.getElementById('muteButton');
  if (muteButton) {
    muteButton.addEventListener('click', () => {
      const isMuted = musicSystem.toggleMute();
      muteButton.textContent = isMuted ? '🔇 SES' : '🔊 SES';
    });
  }
  
  // Volume control (opsiyonel)
  const volumeSlider = document.getElementById('volumeSlider');
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      musicSystem.setVolume(e.target.value / 100);
    });
  }
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

// Harita tipine göre dekorasyon ekleme - TEK FONKSIYON KALDI
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
  
  // Harita değişimi kontrolü (her 5.000 puanda bir)
  const mapIndex = Math.floor(score / 5000) % MAP_TYPES.length;
  if (mapIndex !== currentMapIndex) {
    currentMapIndex = mapIndex;
    const newTheme = MAP_TYPES[currentMapIndex];
    
    createRoad(newTheme);
    showMapChangeNotification(newTheme);
    
    // 🎵 Müzik temasını değiştir
    const musicThemes = ['normal', 'desert', 'snowy', 'spring'];
    musicSystem.changeTheme(musicThemes[currentMapIndex]);
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
      // Daha ileride yeniden konumlandır (100-160 birim arasında)
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
    
    // 🎵 Müziği durdur
    musicSystem.stopMusic();
    
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
  
  // 🎵 Müziği yeniden başlat
  musicSystem.startMusic('normal');
  
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
    playerCar.rotation.set(0, 0, 0); // Math.PI kaldırıldı
  }
  
  // UI'yi güncelle
  document.getElementById('score').textContent = '0';
  document.getElementById('speedValue').textContent = Math.floor(initialCarSpeed * 1000);
  document.getElementById('gameOver').style.display = 'none';
}

// Oyunu başlat
window.onload = init;