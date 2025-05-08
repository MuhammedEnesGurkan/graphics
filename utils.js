// Matrix ve vektör işlemleri için yardımcı fonksiyonlar
const mat4 = {
    perspective: function(fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);

        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, (2 * far * near) * nf, 0
        ];
    },

    identity: function() {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    },

    translate: function(m, v) {
        const result = this.identity();
        result[12] = v[0];
        result[13] = v[1]; 
        result[14] = v[2];
        return this.multiply(m, result);
    },

    rotateX: function(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const result = this.identity();
        
        result[5] = c;
        result[6] = s;
        result[9] = -s;
        result[10] = c;
        
        return this.multiply(m, result);
    },

    rotateY: function(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const result = this.identity();
        
        result[0] = c;
        result[2] = -s;
        result[8] = s;
        result[10] = c;
        
        return this.multiply(m, result);
    },

    rotateZ: function(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const result = this.identity();
        
        result[0] = c;
        result[1] = s;
        result[4] = -s;
        result[5] = c;
        
        return this.multiply(m, result);
    },

    scale: function(m, v) {
        const result = this.identity();
        result[0] = v[0];
        result[5] = v[1];
        result[10] = v[2];
        return this.multiply(m, result);
    },

    multiply: function(a, b) {
        const result = Array(16).fill(0);
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                for (let k = 0; k < 4; k++) {
                    result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
                }
            }
        }
        
        return result;
    },

    lookAt: function(eye, target, up) {
        let z = normalize(subtractVectors(eye, target));
        let x = normalize(cross(up, z));
        let y = normalize(cross(z, x));
        
        return [
            x[0], y[0], z[0], 0,
            x[1], y[1], z[1], 0,
            x[2], y[2], z[2], 0,
            -dot(x, eye), -dot(y, eye), -dot(z, eye), 1
        ];
    },

    inverse: function(m) {
        let inv = new Array(16);
        
        inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] + 
                m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
        
        inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] - 
                m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
        
        inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] + 
                m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
        
        inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] - 
                m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
        
        inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] - 
                m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
        
        inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] + 
                m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
        
        inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] - 
                m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
        
        inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] + 
                m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
        
        inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] + 
                m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
        
        inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] - 
                m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
        
        inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] + 
                m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
        
        inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] - 
                m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
        
        inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - 
                m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
        
        inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + 
                m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
        
        inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - 
                m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
        
        inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + 
                m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];
        
        let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
        
        if (det === 0) {
            return null;
        }
        
        det = 1.0 / det;
        
        for (let i = 0; i < 16; i++) {
            inv[i] = inv[i] * det;
        }
        
        return inv;
    }
};

// Vektör işlemleri
function normalize(v) {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (length > 0.00001) {
        return [v[0] / length, v[1] / length, v[2] / length];
    }
    return [0, 0, 0];
}

function cross(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

function subtractVectors(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

// Geometrik şekiller
function createCube() {
    // Küpün köşe noktaları
    const positions = [
        // Ön yüz
        -0.5, -0.5,  0.5,  // 0
         0.5, -0.5,  0.5,  // 1
         0.5,  0.5,  0.5,  // 2
        -0.5,  0.5,  0.5,  // 3
        // Arka yüz
        -0.5, -0.5, -0.5,  // 4
         0.5, -0.5, -0.5,  // 5
         0.5,  0.5, -0.5,  // 6
        -0.5,  0.5, -0.5,  // 7
    ];

    // Üçgenler (indeksler)
    const indices = [
        // Ön yüz
        0, 1, 2,
        0, 2, 3,
        // Sağ yüz
        1, 5, 6,
        1, 6, 2,
        // Arka yüz
        5, 4, 7,
        5, 7, 6,
        // Sol yüz
        4, 0, 3,
        4, 3, 7,
        // Üst yüz
        3, 2, 6,
        3, 6, 7,
        // Alt yüz
        4, 5, 1,
        4, 1, 0
    ];

    // Her köşe için normal vektörleri
    const normals = [
        // Ön
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        // Arka
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        // Sağ
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        // Sol
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        // Üst
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        // Alt
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0
    ];

    return { positions, indices, normals };
}

function createPyramid() {
    // Piramidin köşe noktaları
    const positions = [
        // Taban köşeleri
        -0.5, -0.5, -0.5,  // 0
         0.5, -0.5, -0.5,  // 1
         0.5, -0.5,  0.5,  // 2
        -0.5, -0.5,  0.5,  // 3
        // Tepe noktası
         0.0,  0.5,  0.0   // 4
    ];

    // Üçgenler (indeksler)
    const indices = [
        // Taban
        0, 3, 2,
        0, 2, 1,
        // Yan yüzler
        0, 1, 4,  // Ön
        1, 2, 4,  // Sağ
        2, 3, 4,  // Arka
        3, 0, 4   // Sol
    ];

    // Normal vektörler için basit hesaplama
    const normals = [];
    for (let i = 0; i < positions.length / 3; i++) {
        if (i < 4) {
            normals.push(0, -1, 0); // Taban için normal
        } else {
            normals.push(0, 1, 0); // Tepe noktası için normal
        }
    }

    return { positions, indices, normals };
}

function createSphere(radius, latitudeBands, longitudeBands) {
    const positions = [];
    const indices = [];
    const normals = [];

    // Küre üzerindeki noktaları oluştur
    for (let latNum = 0; latNum <= latitudeBands; latNum++) {
        const theta = latNum * Math.PI / latitudeBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let longNum = 0; longNum <= longitudeBands; longNum++) {
            const phi = longNum * 2 * Math.PI / longitudeBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;

            normals.push(x, y, z);
            positions.push(radius * x, radius * y, radius * z);
        }
    }

    // İndeksleri oluştur
    for (let latNum = 0; latNum < latitudeBands; latNum++) {
        for (let longNum = 0; longNum < longitudeBands; longNum++) {
            const first = (latNum * (longitudeBands + 1)) + longNum;
            const second = first + longitudeBands + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    return { positions, indices, normals };
}