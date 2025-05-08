// Ana oyun kodu
let gl;
let canvas;
let shaderProgram;
let projectionMatrix;
let modelViewMatrix;

// Nesneler
let playerCar;
let enemyCar1;
let enemyCar2;
let ground;

// Kamera ayarları
let cameraPosition = [0, 5, 15];
let cameraRotation = [0, 0, 0];
let cameraTarget = [0, 0, 0];
let cameraUp = [0, 1, 0];

// Işık ayarları
let lightPosition = [5, 10, 5];
let lightColor = [1.0, 1.0, 1.0];
let lightIntensity = 1.0;

// Oyun kontrolü
let selectedCar = 0; // 0: oyuncu arabası, 1: düşman 1, 2: düşman 2
let keysPressed = {};
let playerMoved = false; // Oyuncu hareket ediyor mu?
let lastPlayerPosition = [0, 0.5, 0]; // Son oyuncu pozisyonu
let enemyState = {
    enemy1: {
        targetPoint: 0,
        waypoints: [[-5, 0.5, -5], [-5, 0.5, 5], [5, 0.5, 5], [5, 0.5, -5]],
        speed: 0.1
    },
    enemy2: {
        chaseMode: true,
        chaseDistance: 8,
        speed: 0.08,
        rotationSpeed: 0.03,
        wanderAngle: 0
    }
};
let gameTime = 0; // Oyun zamanı

// Shader kod parçaları
const vertexShaderSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec4 aColor;
    
    uniform mat4 uProjectionMatrix;
    uniform mat4 uModelViewMatrix;
    uniform vec3 uLightPosition;
    uniform vec3 uLightColor;
    uniform float uLightIntensity;
    
    varying vec4 vColor;
    
    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
        
        // Basit aydınlatma hesaplaması
        vec3 normal = normalize(aNormal);
        vec3 lightDir = normalize(uLightPosition - aPosition);
        float diffuse = max(dot(normal, lightDir), 0.0);
        
        // Ortam ışık (ambient) + yayılan ışık (diffuse)
        vec3 lighting = uLightColor * uLightIntensity * diffuse + vec3(0.2, 0.2, 0.2);
        
        vColor = vec4(aColor.rgb * lighting, aColor.a);
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    varying vec4 vColor;
    
    void main() {
        gl_FragColor = vColor;
    }
`;

// WebGL'i başlat
function initWebGL() {
    canvas = document.getElementById('webglCanvas');
    gl = canvas.getContext('webgl');
    
    if (!gl) {
        alert('WebGL desteklenmiyor!');
        return;
    }
    
    // Canvas boyutunu pencere boyutuna ayarla
    resizeCanvas();
    
    // Shader programını oluştur ve başlat
    initShaders();
    
    // Nesneleri oluştur
    createObjects();
    
    // Olayları dinle
    setupEvents();
    
    // Çizim döngüsünü başlat
    render();
}

// Canvas boyutunu pencereye göre ayarla
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

// Shader programını oluştur
function initShaders() {
    // Vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Vertex shader derlenemedi:', gl.getShaderInfoLog(vertexShader));
        return;
    }
    
    // Fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Fragment shader derlenemedi:', gl.getShaderInfoLog(fragmentShader));
        return;
    }
    
    // Shader programını oluştur ve bağla
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Shader program bağlanamadı:', gl.getProgramInfoLog(shaderProgram));
        return;
    }
    
    gl.useProgram(shaderProgram);
}

// WebGL buffer'ları oluştur
function createBuffer(data, itemSize, numItems) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    buffer.itemSize = itemSize;
    buffer.numItems = numItems;
    return buffer;
}

// İndeks buffer'ı oluştur
function createIndexBuffer(indices) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    buffer.numItems = indices.length;
    return buffer;
}

// Shader attribute'u ayarla
function setAttributeBuffer(buffer, attributeName, itemSize) {
    const attribute = gl.getAttribLocation(shaderProgram, attributeName);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
}

// Nesneleri oluştur
function createObjects() {
    // Oyuncu arabası (küp)
    const cube = createCube();
    playerCar = {
        position: [0, 0.5, 0],
        rotation: 0,
        scale: [1, 0.5, 2], // Araba şeklinde uzatılmış
        vertexBuffer: createBuffer(cube.positions, 3, cube.positions.length / 3),
        normalBuffer: createBuffer(cube.normals, 3, cube.normals.length / 3),
        colorBuffer: createBuffer(cube.colors, 4, cube.colors.length / 4),
        indexBuffer: createIndexBuffer(cube.indices),
        numIndices: cube.indices.length
    };
    
    // Düşman araba 1 (piramit)
    const pyramid = createPyramid();
    enemyCar1 = {
        position: [-5, 0.5, -5],
        rotation: Math.PI / 4,
        scale: [1, 0.5, 2],
        vertexBuffer: createBuffer(pyramid.positions, 3, pyramid.positions.length / 3),
        normalBuffer: createBuffer(pyramid.normals, 3, pyramid.normals.length / 3),
        colorBuffer: createBuffer(pyramid.colors, 4, pyramid.colors.length / 4),
        indexBuffer: createIndexBuffer(pyramid.indices),
        numIndices: pyramid.indices.length
    };
    
    // Düşman araba 2 (silindir)
    const cylinder = createCylinder();
    enemyCar2 = {
        position: [5, 0.5, -8],
        rotation: -Math.PI / 6,
        scale: [1, 0.5, 2],
        vertexBuffer: createBuffer(cylinder.positions, 3, cylinder.positions.length / 3),
        normalBuffer: createBuffer(cylinder.normals, 3, cylinder.normals.length / 3),
        colorBuffer: createBuffer(cylinder.colors, 4, cylinder.colors.length / 4),
        indexBuffer: createIndexBuffer(cylinder.indices),
        numIndices: cylinder.indices.length
    };
    
    // Zemin düzlemi
    const groundMesh = createGround(50, 50);
    ground = {
        position: [0, 0, 0],
        rotation: 0,
        scale: [1, 1, 1],
        vertexBuffer: createBuffer(groundMesh.positions, 3, groundMesh.positions.length / 3),
        normalBuffer: createBuffer(groundMesh.normals, 3, groundMesh.normals.length / 3),
        colorBuffer: createBuffer(groundMesh.colors, 4, groundMesh.colors.length / 4),
        indexBuffer: createIndexBuffer(groundMesh.indices),
        numIndices: groundMesh.indices.length
    };
}

// Klavye ve fare olaylarını dinle
function setupEvents() {
    // Klavye olayları
    window.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
    });
    
    window.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });
    
    // Pencere yeniden boyutlandırma
    window.addEventListener('resize', resizeCanvas);
}

// İki nokta arasındaki mesafeyi hesapla
function distance(a, b) {
    return Math.sqrt(
        (a[0] - b[0]) * (a[0] - b[0]) + 
        (a[2] - b[2]) * (a[2] - b[2])
    );
}

// İki nokta arasındaki açıyı hesapla
function angleBetween(a, b) {
    return Math.atan2(b[0] - a[0], b[2] - a[2]);
}

// Nesne hareketi
function updateMovement() {
    const speed = 0.2;
    const rotateSpeed = 0.05;
    const selectedObject = [playerCar, enemyCar1, enemyCar2][selectedCar];
    
    // Oyuncu hareketini kontrol et
    playerMoved = false;
    const oldPos = [...playerCar.position];
    
    // WASD ile seçili nesneyi hareket ettir
    if (keysPressed['w'] || keysPressed['W']) {
        selectedObject.position[0] += Math.sin(selectedObject.rotation) * speed;
        selectedObject.position[2] += Math.cos(selectedObject.rotation) * speed;
        if (selectedCar === 0) playerMoved = true;
    }
    
    if (keysPressed['s'] || keysPressed['S']) {
        selectedObject.position[0] -= Math.sin(selectedObject.rotation) * speed;
        selectedObject.position[2] -= Math.cos(selectedObject.rotation) * speed;
        if (selectedCar === 0) playerMoved = true;
    }
    
    if (keysPressed['a'] || keysPressed['A']) {
        selectedObject.rotation += rotateSpeed;
        if (selectedCar === 0) playerMoved = true;
    }
    
    if (keysPressed['d'] || keysPressed['D']) {
        selectedObject.rotation -= rotateSpeed;
        if (selectedCar === 0) playerMoved = true;
    }
    
    // Oyuncu tarafından kontrol edilmeyen düşman araçlar için AI kontrol
    if (selectedCar !== 1) {
        // Düşman araba 1 - belirli yolda hareket eden AI
        updateEnemyCar1AI(playerMoved);
    }
    
    if (selectedCar !== 2) {
        // Düşman araba 2 - oyuncuyu takip eden AI
        updateEnemyCar2AI(playerMoved);
    }
    
    // 1, 2, 3 tuşları ile araç seçimi
    if (keysPressed['1'] && selectedCar !== 0) {
        selectedCar = 0;
        keysPressed['1'] = false;
    }
    
    if (keysPressed['2'] && selectedCar !== 1) {
        selectedCar = 1;
        keysPressed['2'] = false;
    }
    
    if (keysPressed['3'] && selectedCar !== 2) {
        selectedCar = 2;
        keysPressed['3'] = false;
    }
    
    // Kamera kontrolü (ok tuşları)
    const cameraSpeed = 0.1;
    
    if (keysPressed['ArrowUp']) {
        cameraRotation[0] -= cameraSpeed;
    }
    
    if (keysPressed['ArrowDown']) {
        cameraRotation[0] += cameraSpeed;
    }
    
    if (keysPressed['ArrowLeft']) {
        cameraRotation[1] -= cameraSpeed;
    }
    
    if (keysPressed['ArrowRight']) {
        cameraRotation[1] += cameraSpeed;
    }
    
    if (keysPressed['q'] || keysPressed['Q']) {
        cameraPosition[1] += cameraSpeed * 5;
    }
    
    if (keysPressed['e'] || keysPressed['E']) {
        cameraPosition[1] -= cameraSpeed * 5;
    }
    
    // Işık kontrolü
    const lightSpeed = 0.3;
    
    if (keysPressed['j'] || keysPressed['J']) {
        lightPosition[0] -= lightSpeed;
    }
    
    if (keysPressed['l'] || keysPressed['L']) {
        lightPosition[0] += lightSpeed;
    }
    
    if (keysPressed['i'] || keysPressed['I']) {
        lightPosition[2] -= lightSpeed;
    }
    
    if (keysPressed['k'] || keysPressed['K']) {
        lightPosition[2] += lightSpeed;
    }
    
    if (keysPressed['u'] || keysPressed['U']) {
        lightPosition[1] += lightSpeed;
    }
    
    if (keysPressed['o'] || keysPressed['O']) {
        lightPosition[1] -= lightSpeed;
    }
    
    // Işık parlaklığı
    if (keysPressed['+'] || keysPressed['=']) {
        lightIntensity = Math.min(lightIntensity + 0.05, 2.0);
    }
    
    if (keysPressed['-'] || keysPressed['_']) {
        lightIntensity = Math.max(lightIntensity - 0.05, 0.1);
    }
    
    // Oyun zamanını güncelle
    gameTime += 1;
}

// Düşman araba 1 - belirli yolda hareket eden AI
function updateEnemyCar1AI(playerMoved) {
    // Oyuncu hareket etmiyorsa veya düşman oyuncu tarafından kontrol ediliyorsa hareketi durdur
    if (!playerMoved && gameTime > 10) return;
    
    const enemy = enemyState.enemy1;
    const currentWaypoint = enemy.waypoints[enemy.targetPoint];
    const car = enemyCar1;
    
    // Hedef noktaya yönelen açıyı hesapla
    const targetAngle = angleBetween(car.position, currentWaypoint);
    
    // Aracı hedef noktaya döndür
    const angleDiff = targetAngle - car.rotation;
    
    // Açı farkını -PI ile PI arasına normalize et
    let normalizedAngleDiff = angleDiff;
    while (normalizedAngleDiff > Math.PI) normalizedAngleDiff -= Math.PI * 2;
    while (normalizedAngleDiff < -Math.PI) normalizedAngleDiff += Math.PI * 2;
    
    // Yumuşak dönüş
    if (Math.abs(normalizedAngleDiff) > 0.05) {
        car.rotation += Math.sign(normalizedAngleDiff) * 0.05;
    } else {
        car.rotation = targetAngle;
    }
    
    // Hedef noktaya doğru hareket et
    car.position[0] += Math.sin(car.rotation) * enemy.speed;
    car.position[2] += Math.cos(car.rotation) * enemy.speed;
    
    // Eğer hedef noktaya yakınsa, sonraki noktaya geç
    if (distance(car.position, currentWaypoint) < 1.0) {
        enemy.targetPoint = (enemy.targetPoint + 1) % enemy.waypoints.length;
    }
}

// Düşman araba 2 - oyuncuyu takip eden AI
function updateEnemyCar2AI(playerMoved) {
    // Oyuncu hareket etmiyorsa veya düşman oyuncu tarafından kontrol ediliyorsa hareketi durdur
    if (!playerMoved && gameTime > 10) return;
    
    const enemy = enemyState.enemy2;
    const car = enemyCar2;
    const playerPos = playerCar.position;
    
    // Oyuncuya olan mesafeyi hesapla
    const distToPlayer = distance(car.position, playerPos);
    
    if (enemy.chaseMode && distToPlayer < enemy.chaseDistance) {
        // Oyuncuyu takip et
        const targetAngle = angleBetween(car.position, playerPos);
        
        // Aracı oyuncuya döndür - daha yavaş döndürmek için rotasyon hızını sınırla
        const angleDiff = targetAngle - car.rotation;
        
        // Açı farkını -PI ile PI arasına normalize et
        let normalizedAngleDiff = angleDiff;
        while (normalizedAngleDiff > Math.PI) normalizedAngleDiff -= Math.PI * 2;
        while (normalizedAngleDiff < -Math.PI) normalizedAngleDiff += Math.PI * 2;
        
        car.rotation += Math.sign(normalizedAngleDiff) * Math.min(Math.abs(normalizedAngleDiff), enemy.rotationSpeed);
        
        // Oyuncuya doğru hareket et, ama çok yaklaşma
        if (distToPlayer > 3.0) {
            car.position[0] += Math.sin(car.rotation) * enemy.speed;
            car.position[2] += Math.cos(car.rotation) * enemy.speed;
        }
    } else {
        // Rastgele dolaş
        if (Math.random() < 0.02) {
            enemy.wanderAngle += (Math.random() - 0.5) * 0.5;
        }
        
        car.rotation += enemy.wanderAngle;
        car.position[0] += Math.sin(car.rotation) * enemy.speed * 0.5;
        car.position[2] += Math.cos(car.rotation) * enemy.speed * 0.5;
        
        // Alanın dışına çıkmayı önle
        const boundary = 20;
        if (Math.abs(car.position[0]) > boundary || Math.abs(car.position[2]) > boundary) {
            const centerAngle = angleBetween(car.position, [0, 0.5, 0]);
            car.rotation = centerAngle;
            enemy.wanderAngle = 0;
        }
        
        // Oyuncuya yeterince yakınsa, takip moduna geç
        if (distToPlayer < enemy.chaseDistance) {
            enemy.chaseMode = true;
        }
    }
}

// Nesne çiz
function drawObject(object) {
    // Model-View matrisini oluştur
    modelViewMatrix = mat4.identity();
    
    // Kamera konumunu uygula
    const camX = cameraPosition[0];
    const camY = cameraPosition[1];
    const camZ = cameraPosition[2];
    
    // Kamerayı konumlandır ve döndür
    modelViewMatrix = mat4.lookAt(
        [camX, camY, camZ], 
        [camX + Math.sin(cameraRotation[1]), camY + Math.sin(cameraRotation[0]), camZ - Math.cos(cameraRotation[1])], 
        cameraUp
    );
    
    // Nesne transformasyonlarını uygula
    modelViewMatrix = mat4.translate(modelViewMatrix, object.position[0], object.position[1], object.position[2]);
    modelViewMatrix = mat4.rotateY(modelViewMatrix, object.rotation);
    modelViewMatrix = mat4.scale(modelViewMatrix, object.scale[0], object.scale[1], object.scale[2]);
    
    // Shader için uniform değişkenleri ayarla
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uModelViewMatrix"), false, modelViewMatrix);
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, "uLightPosition"), new Float32Array(lightPosition));
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, "uLightColor"), new Float32Array(lightColor));
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "uLightIntensity"), lightIntensity);
    
    // Attribute bufferları ayarla
    setAttributeBuffer(object.vertexBuffer, "aPosition", 3);
    setAttributeBuffer(object.normalBuffer, "aNormal", 3);
    setAttributeBuffer(object.colorBuffer, "aColor", 4);
    
    // İndeks buffer ile çiz
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.indexBuffer);
    gl.drawElements(gl.TRIANGLES, object.numIndices, gl.UNSIGNED_SHORT, 0);
}

// Ana render fonksiyonu
function render() {
    // Klavye olaylarıyla hareket güncelleme
    updateMovement();
    
    // Ekranı temizle
    gl.clearColor(0.529, 0.808, 0.922, 1.0); // Gökyüzü mavisi
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Z-Buffer'ı aktifleştir
    gl.enable(gl.DEPTH_TEST);
    
    // Projeksiyon matrisini ayarla (perspektif)
    const aspectRatio = canvas.width / canvas.height;
    projectionMatrix = mat4.perspective(Math.PI / 4, aspectRatio, 0.1, 100.0);
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uProjectionMatrix"), false, projectionMatrix);
    
    // Nesneleri çiz
    drawObject(ground);
    drawObject(playerCar);
    drawObject(enemyCar1);
    drawObject(enemyCar2);
    
    // Bir sonraki çerçeveyi iste
    requestAnimationFrame(render);
}

// Sayfa yüklendiğinde WebGL'i başlat
window.onload = initWebGL;