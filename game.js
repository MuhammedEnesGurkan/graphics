// WebGL Araba Yarış Simülasyonu

// Global değişkenler
let gl;
let canvas;
let program;
let carPosition = 1; // 0 = en sol şerit, 3 = en sağ şerit (toplam 4 şerit)
let carY = 0; // Arabanın dikey pozisyonu (ekranda yukarı doğru hareket edecek)
let initialCarSpeed = 5; // Başlangıç hızı
let carSpeed = initialCarSpeed; // Arabanın yukarı hareket hızı
let obstacles = [];
let gameActive = true;
let score = 0;
let roadOffset = 0;

// Vertex shader
const vsSource = `
    attribute vec2 aPosition;
    attribute vec3 aColor;
    varying vec3 vColor;
    uniform vec2 uResolution;
    void main() {
        // Ekran oranlarını ayarla
        vec2 zeroToOne = aPosition / uResolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        
        vColor = aColor;
    }
`;

// Fragment shader
const fsSource = `
    precision mediump float;
    varying vec3 vColor;
    void main() {
        gl_FragColor = vec4(vColor, 1.0);
    }
`;

// Oyunu başlat
function init() {
    // Canvas ve WebGL bağlamını al
    canvas = document.getElementById('gameCanvas');
    gl = canvas.getContext('webgl');

    if (!gl) {
        alert('WebGL desteklenmiyor!');
        return;
    }

    // Canvas boyutunu ayarla
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Shader programını oluştur
    program = createShaderProgram();

    // Buffer'ları oluştur
    createBuffers();

    // Engelleri oluştur
    createObstacles();

    // Klavye olaylarını dinle
    document.addEventListener('keydown', handleKeyPress);

    // Oyun döngüsünü başlat
    requestAnimationFrame(gameLoop);
}

// Canvas boyutunu ayarla
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

// Shader programını oluştur
function createShaderProgram() {
    // Vertex shader'ı derle
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vsSource);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Vertex shader derleme hatası:', gl.getShaderInfoLog(vertexShader));
        gl.deleteShader(vertexShader);
        return null;
    }

    // Fragment shader'ı derle
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fsSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Fragment shader derleme hatası:', gl.getShaderInfoLog(fragmentShader));
        gl.deleteShader(fragmentShader);
        gl.deleteShader(vertexShader);
        return null;
    }

    // Shader programını oluştur ve linkleme
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Shader program linkleme hatası:', gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}

// Araba ve engel için buffer'ları oluştur
let carBuffer, obstacleBuffer, roadBuffer;
function createBuffers() {
    // Araba için buffer oluştur
    carBuffer = {
        vertices: gl.createBuffer(),
        colors: gl.createBuffer()
    };
    
    // Engel için buffer oluştur
    obstacleBuffer = {
        vertices: gl.createBuffer(),
        colors: gl.createBuffer()
    };
    
    // Yol için buffer oluştur
    roadBuffer = {
        vertices: gl.createBuffer(),
        colors: gl.createBuffer()
    };
}

// Klavye olaylarını işle
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
            }
            break;
        case 'ArrowRight':
            if (carPosition < 3) {
                carPosition++;
            }
            break;
    }
}

// Sabit engelleri oluştur
function createObstacles() {
    obstacles = [];
    const obstacleCount = 50; // Toplam engel sayısı
    
    // Sabit engelleri oluştur
    for (let i = 0; i < obstacleCount; i++) {
        // Rastgele bir şerit seç (0-3 arası)
        const lane = Math.floor(Math.random() * 4);
        
        // Rastgele bir Y pozisyonu belirle (engeller arası mesafe en az 150 olsun)
        const y = i * 150 + Math.random() * 100;
        
        // Engel tipini belirle (0-2 arası)
        const obstacleType = Math.floor(Math.random() * 3);
        
        // Engeli ekle
        obstacles.push({
            lane: lane,
            y: y,
            type: obstacleType
        });
    }
}

// Oyun döngüsü
function gameLoop() {
    if (!gameActive) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Ekranı temizle
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Programı kullan
    gl.useProgram(program);
    
    // Çözünürlük bilgisini gönder
    const uResolution = gl.getUniformLocation(program, 'uResolution');
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    
    // Skora göre arabanın hızını artır (her 100 puanda 1 birim)
    carSpeed = initialCarSpeed + Math.floor(score / 100);
    document.getElementById('speedValue').textContent = carSpeed;
    
    // Arabayı yukarı hareket ettir
    carY += carSpeed;
    
    // Yol kaydırma efekti için offset hesapla
    roadOffset = (carY % 40);
    
    // Yolu ve şeritleri çiz
    drawRoad();
    
    // Arabayı çiz
    drawCar();
    
    // Engelleri çiz ve çarpışma kontrolü yap
    drawObstaclesAndCheckCollisions();
    
    // Puanı güncelle
    score += carSpeed;
    document.getElementById('score').textContent = Math.floor(score);
    
    // Oyun döngüsüne devam et
    requestAnimationFrame(gameLoop);
}

// Yol ve şeritleri çiz
function drawRoad() {
    const roadWidth = canvas.width * 0.5;
    const laneWidth = roadWidth / 4;
    const roadLeft = (canvas.width - roadWidth) / 2;
    
    // Yol arka planını çiz (koyu gri)
    drawRectangle(
        roadLeft, 0, roadWidth, canvas.height,
        0.3, 0.3, 0.3
    );
    
    // Şeritleri çiz (beyaz çizgiler)
    for (let i = 1; i < 4; i++) {
        const x = roadLeft + laneWidth * i;
        
        // Şerit çizgileri - kesikli çizgiler
        for (let j = -10; j < canvas.height / 20 + 10; j++) {
            const yPos = j * 40 - (roadOffset % 40);
            
            drawRectangle(
                x - 2, yPos, 4, 20,
                1, 1, 1
            );
        }
    }
    
    // Yol kenarlarını çiz (beyaz düz çizgiler)
    drawRectangle(
        roadLeft, 0, 4, canvas.height,
        1, 1, 1
    );
    
    drawRectangle(
        roadLeft + roadWidth - 4, 0, 4, canvas.height,
        1, 1, 1
    );
}

// Dikdörtgen çiz
function drawRectangle(x, y, width, height, r, g, b) {
    const vertices = new Float32Array([
        x, y,
        x + width, y,
        x + width, y + height,
        x, y + height
    ]);
    
    const colors = new Float32Array([
        r, g, b,
        r, g, b,
        r, g, b,
        r, g, b
    ]);
    
    // Vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, roadBuffer.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    
    // Colors
    gl.bindBuffer(gl.ARRAY_BUFFER, roadBuffer.colors);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    
    const aColor = gl.getAttribLocation(program, 'aColor');
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
    
    // Dikdörtgeni çiz
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

// Arabayı çiz
function drawCar() {
    const roadWidth = canvas.width * 0.5;
    const laneWidth = roadWidth / 4;
    const roadLeft = (canvas.width - roadWidth) / 2;
    
    // Arabanın bulunduğu şeritin x konumu
    const carX = roadLeft + laneWidth * carPosition + laneWidth / 2;
    
    // Arabanın çizileceği y pozisyonu - Ekranda yukarı doğru hareket edecek
    // carY değeri arttıkça arabanın ekrandaki konumu yukarı doğru hareket edecek
    // Başlangıç konumu ekranın altından biraz yukarıda
    const startY = canvas.height * 0.75; // Ekranın 3/4'ü
    const maxDistance = startY - canvas.height * 0.25; // Maksimum hareket mesafesi
    const movementProgress = Math.min(carY / 1000, 1); // 1000 birim ilerledikten sonra maksimum yüksekliğe ulaşır
    const carScreenY = startY - movementProgress * maxDistance;
    
    // Arabayı çiz
    const carWidth = 30;
    const carHeight = 50;
    
    // Arabanın gövdesi (kırmızı dikdörtgen)
    drawRectangle(
        carX - carWidth/2, carScreenY - carHeight/2,
        carWidth, carHeight,
        1, 0, 0
    );
    
    // Arabanın ön kısmı (turuncu üçgen)
    const vertices = new Float32Array([
        carX - carWidth/2, carScreenY - carHeight/2,
        carX + carWidth/2, carScreenY - carHeight/2,
        carX, carScreenY - carHeight/2 - 20
    ]);
    
    const colors = new Float32Array([
        1, 0.5, 0,
        1, 0.5, 0,
        1, 0.5, 0
    ]);
    
    // Vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, carBuffer.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    
    // Colors
    gl.bindBuffer(gl.ARRAY_BUFFER, carBuffer.colors);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    
    const aColor = gl.getAttribLocation(program, 'aColor');
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
    
    // Üçgeni çiz
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    
    // Arabanın tekerleklerini çiz (siyah kareler)
    // Sol ön tekerlek
    drawRectangle(
        carX - carWidth/2 - 5, carScreenY - carHeight/3,
        10, 15,
        0, 0, 0
    );
    
    // Sağ ön tekerlek
    drawRectangle(
        carX + carWidth/2 - 5, carScreenY - carHeight/3,
        10, 15,
        0, 0, 0
    );
    
    // Sol arka tekerlek
    drawRectangle(
        carX - carWidth/2 - 5, carScreenY + carHeight/4,
        10, 15,
        0, 0, 0
    );
    
    // Sağ arka tekerlek
    drawRectangle(
        carX + carWidth/2 - 5, carScreenY + carHeight/4,
        10, 15,
        0, 0, 0
    );
}

// Engelleri çiz ve çarpışma kontrolünü yap
function drawObstaclesAndCheckCollisions() {
    const roadWidth = canvas.width * 0.5;
    const laneWidth = roadWidth / 4;
    const roadLeft = (canvas.width - roadWidth) / 2;
    
    // Arabanın ekrandaki pozisyonu
    const startY = canvas.height * 0.75;
    const maxDistance = startY - canvas.height * 0.25;
    const movementProgress = Math.min(carY / 1000, 1);
    const carScreenY = startY - movementProgress * maxDistance;
    
    const carWidth = 30;
    const carHeight = 70; // Çarpışma algılaması için biraz daha yüksek
    
    // Ekranda görünen engelleri çiz
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        
        // Engelin ekrandaki Y pozisyonunu hesapla
        // carY: Arabanın başlangıçtan itibaren aldığı yol
        // obstacle.y: Engelin başlangıçtan itibaren konumu
        // Eğer carY > obstacle.y ise araba engeli geçmiş demektir
        const relativePosition = obstacle.y - carY;
        
        // Engelin ekrandaki pozisyonu (araba ilerledikçe engeller yukarıdan aşağıya doğru görünecek)
        const obstacleScreenY = relativePosition + carScreenY;
        
        // Ekranda görünüyor mu kontrol et
        if (obstacleScreenY < canvas.height + 50 && obstacleScreenY > -50) {
            // Engelin bulunduğu şeritin x konumu
            const obstacleX = roadLeft + laneWidth * obstacle.lane + laneWidth / 2;
            
            // Engelin tipine göre farklı şekil ve renk kullan
            let r = 0, g = 0, b = 1; // Varsayılan mavi
            let obstacleWidth = 30;
            let obstacleHeight = 30;
            
            if (obstacle.type === 1) {
                r = 0; g = 1; b = 0; // Yeşil engel
                obstacleWidth = 40; // Daha geniş
                obstacleHeight = 20;
            } else if (obstacle.type === 2) {
                r = 1; g = 1; b = 0; // Sarı engel
                obstacleWidth = 35;
                obstacleHeight = 35;
            }
            
            // Engeli çiz
            drawRectangle(
                obstacleX - obstacleWidth/2, obstacleScreenY - obstacleHeight/2,
                obstacleWidth, obstacleHeight,
                r, g, b
            );
            
            // Çarpışma kontrolü
            // Araba pozisyonu ve engel aynı şeritte mi ve yeterince yakın mı?
            if (obstacle.lane === carPosition && 
                Math.abs(obstacleScreenY - carScreenY) < (carHeight/2 + obstacleHeight/2 - 10)) {
                gameOver();
                break;
            }
        }
    }
}

// Oyun bittiğinde
function gameOver() {
    gameActive = false;
    document.getElementById('finalScore').textContent = Math.floor(score);
    document.getElementById('gameOver').style.display = 'block';
}

// Oyunu yeniden başlat
function restartGame() {
    gameActive = true;
    score = 0;
    carPosition = 1;
    carY = 0;
    carSpeed = initialCarSpeed;
    createObstacles();
    document.getElementById('score').textContent = '0';
    document.getElementById('speedValue').textContent = initialCarSpeed;
    document.getElementById('gameOver').style.display = 'none';
}

// Oyun yüklendiğinde başlat
window.onload = init;