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
    
    lookAt: function(eye, center, up) {
        const z0 = eye[0] - center[0];
        const z1 = eye[1] - center[1];
        const z2 = eye[2] - center[2];
        
        let len = Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
        if (len === 0) return;
        
        len = 1 / len;
        const z = [z0 * len, z1 * len, z2 * len];
        
        const x0 = up[1] * z[2] - up[2] * z[1];
        const x1 = up[2] * z[0] - up[0] * z[2];
        const x2 = up[0] * z[1] - up[1] * z[0];
        
        len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
        if (len === 0) return;
        
        len = 1 / len;
        const x = [x0 * len, x1 * len, x2 * len];
        
        const y0 = z[1] * x[2] - z[2] * x[1];
        const y1 = z[2] * x[0] - z[0] * x[2];
        const y2 = z[0] * x[1] - z[1] * x[0];
        
        len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
        if (len === 0) return;
        
        len = 1 / len;
        const y = [y0 * len, y1 * len, y2 * len];
        
        return [
            x[0], y[0], z[0], 0,
            x[1], y[1], z[1], 0,
            x[2], y[2], z[2], 0,
            -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
            -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
            -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]),
            1
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
    
    translate: function(m, tx, ty, tz) {
        return [
            m[0], m[1], m[2], m[3],
            m[4], m[5], m[6], m[7],
            m[8], m[9], m[10], m[11],
            m[0] * tx + m[4] * ty + m[8] * tz + m[12],
            m[1] * tx + m[5] * ty + m[9] * tz + m[13],
            m[2] * tx + m[6] * ty + m[10] * tz + m[14],
            m[3] * tx + m[7] * ty + m[11] * tz + m[15]
        ];
    },
    
    rotateY: function(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        
        const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
        const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
        
        // Perform axis-specific matrix multiplication
        return [
            a00 * c + a20 * -s, a01 * c + a21 * -s, a02 * c + a22 * -s, a03 * c + a23 * -s,
            m[4], m[5], m[6], m[7],
            a00 * s + a20 * c, a01 * s + a21 * c, a02 * s + a22 * c, a03 * s + a23 * c,
            m[12], m[13], m[14], m[15]
        ];
    },
    
    rotateX: function(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        
        const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
        const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
        
        // Perform axis-specific matrix multiplication
        return [
            m[0], m[1], m[2], m[3],
            a10 * c + a20 * s, a11 * c + a21 * s, a12 * c + a22 * s, a13 * c + a23 * s,
            a10 * -s + a20 * c, a11 * -s + a21 * c, a12 * -s + a22 * c, a13 * -s + a23 * c,
            m[12], m[13], m[14], m[15]
        ];
    },
    
    scale: function(m, sx, sy, sz) {
        return [
            m[0] * sx, m[1] * sx, m[2] * sx, m[3] * sx,
            m[4] * sy, m[5] * sy, m[6] * sy, m[7] * sy,
            m[8] * sz, m[9] * sz, m[10] * sz, m[11] * sz,
            m[12], m[13], m[14], m[15]
        ];
    },
    
    multiply: function(a, b) {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
        
        const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
        const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
        const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
        const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];
        
        return [
            b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
            b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
            b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
            b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
            
            b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
            b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
            b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
            b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
            
            b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
            b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
            b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
            b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
            
            b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
            b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
            b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
            b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33
        ];
    }
};