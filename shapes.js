// Farklı şekiller oluşturmak için yardımcı fonksiyonlar

// Küp şekli (Oyuncu Arabası)
function createCube() {
    const positions = [
        // Ön yüz
        -1.0, -0.5, 1.0,  1.0, -0.5, 1.0,  1.0, 0.5, 1.0, -1.0, 0.5, 1.0,
        // Arka yüz
        -1.0, -0.5, -1.0, -1.0, 0.5, -1.0, 1.0, 0.5, -1.0, 1.0, -0.5, -1.0,
        // Üst yüz
        -1.0, 0.5, -1.0, -1.0, 0.5, 1.0,  1.0, 0.5, 1.0,  1.0, 0.5, -1.0,
        // Alt yüz
        -1.0, -0.5, -1.0, 1.0, -0.5, -1.0, 1.0, -0.5, 1.0, -1.0, -0.5, 1.0,
        // Sağ yüz
        1.0, -0.5, -1.0, 1.0, 0.5, -1.0, 1.0, 0.5, 1.0, 1.0, -0.5, 1.0,
        // Sol yüz
        -1.0, -0.5, -1.0, -1.0, -0.5, 1.0, -1.0, 0.5, 1.0, -1.0, 0.5, -1.0
    ];

    const normals = [
        // Ön yüz
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
        // Arka yüz
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
        // Üst yüz
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
        // Alt yüz
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
        // Sağ yüz
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
        // Sol yüz
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0
    ];

    const colors = [
        // Kırmızı (önce tüm yüzler için aynı renk)
        1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0,
        // Kırmızı (koyu ton)
        0.8, 0.0, 0.0, 1.0, 0.8, 0.0, 0.0, 1.0, 0.8, 0.0, 0.0, 1.0, 0.8, 0.0, 0.0, 1.0,
        // Kırmızı (açık ton)
        1.0, 0.3, 0.3, 1.0, 1.0, 0.3, 0.3, 1.0, 1.0, 0.3, 0.3, 1.0, 1.0, 0.3, 0.3, 1.0,
        // Kırmızı (çok koyu ton)
        0.6, 0.0, 0.0, 1.0, 0.6, 0.0, 0.0, 1.0, 0.6, 0.0, 0.0, 1.0, 0.6, 0.0, 0.0, 1.0,
        // Kırmızı (orta ton)
        0.9, 0.1, 0.1, 1.0, 0.9, 0.1, 0.1, 1.0, 0.9, 0.1, 0.1, 1.0, 0.9, 0.1, 0.1, 1.0,
        // Kırmızı (farklı ton)
        0.7, 0.0, 0.0, 1.0, 0.7, 0.0, 0.0, 1.0, 0.7, 0.0, 0.0, 1.0, 0.7, 0.0, 0.0, 1.0
    ];

    const indices = [
        0, 1, 2,    0, 2, 3,    // Ön yüz
        4, 5, 6,    4, 6, 7,    // Arka yüz
        8, 9, 10,   8, 10, 11,  // Üst yüz
        12, 13, 14, 12, 14, 15, // Alt yüz
        16, 17, 18, 16, 18, 19, // Sağ yüz
        20, 21, 22, 20, 22, 23  // Sol yüz
    ];

    return { positions, normals, colors, indices };
}

// Piramit şekli (Düşman Arabası 1)
function createPyramid() {
    const positions = [
        // Taban
        -1.0, -0.5, -1.0,  1.0, -0.5, -1.0,  1.0, -0.5, 1.0, -1.0, -0.5, 1.0,
        // Ön üçgen
        0.0, 0.5, 0.0, -1.0, -0.5, 1.0, 1.0, -0.5, 1.0,
        // Sağ üçgen
        0.0, 0.5, 0.0, 1.0, -0.5, 1.0, 1.0, -0.5, -1.0,
        // Arka üçgen
        0.0, 0.5, 0.0, 1.0, -0.5, -1.0, -1.0, -0.5, -1.0,
        // Sol üçgen
        0.0, 0.5, 0.0, -1.0, -0.5, -1.0, -1.0, -0.5, 1.0
    ];

    const normals = [
        // Taban
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
        // Ön
        0.0, 0.5, 1.0, 0.0, 0.5, 1.0, 0.0, 0.5, 1.0,
        // Sağ
        1.0, 0.5, 0.0, 1.0, 0.5, 0.0, 1.0, 0.5, 0.0,
        // Arka
        0.0, 0.5, -1.0, 0.0, 0.5, -1.0, 0.0, 0.5, -1.0,
        // Sol
        -1.0, 0.5, 0.0, -1.0, 0.5, 0.0, -1.0, 0.5, 0.0
    ];

    const colors = [
        // Mavi (taban)
        0.0, 0.0, 0.8, 1.0, 0.0, 0.0, 0.8, 1.0, 0.0, 0.0, 0.8, 1.0, 0.0, 0.0, 0.8, 1.0,
        // Mavi (ön)
        0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0,
        // Mavi (sağ)
        0.0, 0.3, 0.8, 1.0, 0.0, 0.3, 0.8, 1.0, 0.0, 0.3, 0.8, 1.0,
        // Mavi (arka)
        0.0, 0.5, 1.0, 1.0, 0.0, 0.5, 1.0, 1.0, 0.0, 0.5, 1.0, 1.0,
        // Mavi (sol)
        0.3, 0.3, 1.0, 1.0, 0.3, 0.3, 1.0, 1.0, 0.3, 0.3, 1.0, 1.0,
    ];

    const indices = [
        0, 1, 2,    0, 2, 3,    // Taban
        4, 5, 6,               // Ön üçgen
        7, 8, 9,               // Sağ üçgen
        10, 11, 12,            // Arka üçgen
        13, 14, 15             // Sol üçgen
    ];

    return { positions, normals, colors, indices };
}

// Silindir şekli (Düşman Arabası 2) - basitleştirilmiş
function createCylinder(segments = 20) {
    const positions = [];
    const normals = [];
    const colors = [];
    const indices = [];
    
    // Üst ve alt çember merkez noktaları
    positions.push(0, 0.5, 0);  // Üst merkez
    normals.push(0, 1, 0);
    colors.push(0, 0.8, 0, 1);  // Yeşil
    
    positions.push(0, -0.5, 0); // Alt merkez
    normals.push(0, -1, 0);
    colors.push(0, 0.6, 0, 1);  // Koyu yeşil
    
    // Silindir çevresi nokta oluşturma
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle);
        const z = Math.sin(angle);
        
        // Üst çember noktası
        positions.push(x, 0.5, z);
        normals.push(0, 1, 0);  // Üst yüzey normal
        colors.push(0, 0.7, 0, 1);
        
        // Alt çember noktası
        positions.push(x, -0.5, z);
        normals.push(0, -1, 0); // Alt yüzey normal
        colors.push(0, 0.5, 0, 1);
        
        // Çevre noktaları
        positions.push(x, 0.5, z);
        normals.push(x, 0, z);  // Çevre normal
        colors.push(0, 0.9, 0, 1);
        
        positions.push(x, -0.5, z);
        normals.push(x, 0, z);  // Çevre normal
        colors.push(0, 0.4, 0, 1);
    }
    
    // Üst çember indeksler
    for (let i = 0; i < segments; i++) {
        const current = 2 + i * 4;
        const next = 2 + ((i + 1) % segments) * 4;
        indices.push(0, current, next);
    }
    
    // Alt çember indeksler
    for (let i = 0; i < segments; i++) {
        const current = 3 + i * 4;
        const next = 3 + ((i + 1) % segments) * 4;
        indices.push(1, current, next);
    }
    
    // Çevre üçgenler
    for (let i = 0; i < segments; i++) {
        const i0 = 4 + i * 4;
        const i1 = 5 + i * 4;
        const i2 = 4 + ((i + 1) % segments) * 4;
        const i3 = 5 + ((i + 1) % segments) * 4;
        
        indices.push(i0, i1, i2);
        indices.push(i2, i1, i3);
    }
    
    return { positions, normals, colors, indices };
}

// Zemin (Düzlem) oluşturma
function createGround(width, depth) {
    const positions = [
        -width/2, 0, -depth/2,
         width/2, 0, -depth/2,
         width/2, 0,  depth/2,
        -width/2, 0,  depth/2
    ];
    
    const normals = [
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0
    ];
    
    const colors = [
        0.5, 0.5, 0.5, 1.0,
        0.5, 0.5, 0.5, 1.0,
        0.5, 0.5, 0.5, 1.0,
        0.5, 0.5, 0.5, 1.0
    ];
    
    const indices = [0, 1, 2, 0, 2, 3];
    
    return { positions, normals, colors, indices };
}