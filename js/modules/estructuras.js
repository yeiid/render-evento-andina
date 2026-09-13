import * as THREE from 'three';

// -------------------------------------------------------
// Helpers comunes y definición de marcas
// -------------------------------------------------------

export const BRAND_COLORS = {
    andina: { main: 0x0055a4, accent: 0xffd700, text: '#ffffff', name: 'ANDINA LIGHT' },
    heineken: { main: 0x008200, accent: 0xffffff, text: '#ffffff', name: 'HEINEKEN' },
    tecate: { main: 0xcc0000, accent: 0xffd700, text: '#ffffff', name: 'TECATE' }
};

/**
 * TextSprite con etiqueta sombreada, orientado siempre a la cámara.
 */
export function makeTextSprite(text, color = '#ffffff', bg = 'rgba(0,0,0,0.55)') {
    const canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = 512, h = 128;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = bg;
    roundRect(ctx, 0, 0, w, h, 14);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    roundRect(ctx, 0, 0, w, h, 14);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 46px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        sizeAttenuation: true,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.renderOrder = 999;
    return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/** Modelo de persona para escala humana (1.75m alto) */
export function makePersonModel(shirtColorHex = 0x0055a4) {
    const group = new THREE.Group();
    
    const headMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.6 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), headMat);
    head.position.y = 1.62;
    head.castShadow = true;
    group.add(head);

    const torsoMat = new THREE.MeshStandardMaterial({ color: shirtColorHex, roughness: 0.7 });
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.7, 10), torsoMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    group.add(torso);

    const legsMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.8 });
    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.8, 8);
    
    const legL = new THREE.Mesh(legGeo, legsMat);
    legL.position.set(-0.1, 0.4, 0);
    legL.castShadow = true;
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, legsMat);
    legR.position.set(0.1, 0.4, 0);
    legR.castShadow = true;
    group.add(legR);

    return group;
}

/** Carpa Piramidal Estándar (3x3 / 4x4) */
export function makeAndinaTent(brandKey = 'andina') {
    const group = new THREE.Group();
    const brand = BRAND_COLORS[brandKey] || BRAND_COLORS.andina;
    
    const roofMat = new THREE.MeshStandardMaterial({
        color: brand.main,
        roughness: 0.9,
        side: THREE.DoubleSide
    });
    const roofGeo = new THREE.ConeGeometry(2.8, 1.5, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.25;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    const valanceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const valanceGeo = new THREE.BoxGeometry(4.0, 0.4, 4.0);
    const valance = new THREE.Mesh(valanceGeo, valanceMat);
    valance.position.y = 2.5;
    valance.castShadow = true;
    group.add(valance);

    const logo1 = makeTextSprite(brand.name, brand.main, 'transparent');
    logo1.scale.set(3, 0.75, 1);
    logo1.position.set(0, 2.5, 2.01);
    group.add(logo1);
    
    const logo2 = makeTextSprite(brand.name, brand.main, 'transparent');
    logo2.scale.set(3, 0.75, 1);
    logo2.position.set(0, 2.5, -2.01);
    logo2.rotation.y = Math.PI;
    group.add(logo2);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6, roughness: 0.4 });
    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8);
    for (let x of [-1.9, 1.9]) {
        for (let z of [-1.9, 1.9]) {
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(x, 1.25, z);
            pole.castShadow = true;
            group.add(pole);
        }
    }

    const tentLight = new THREE.PointLight(0xffea9f, 0.8, 8);
    tentLight.position.set(0, 2.2, 0);
    tentLight.name = 'interiorLight';
    group.add(tentLight);

    return group;
}

/** Carpa Piramidal Rectangular (4x6 / 4x8) con ridgeline real */
export function makeRectangularTent(width = 4.0, depth = 6.0, brandKey = 'andina') {
    const group = new THREE.Group();
    const brand = BRAND_COLORS[brandKey] || BRAND_COLORS.andina;
    
    const roofMat = new THREE.MeshStandardMaterial({
        color: brand.main,
        roughness: 0.9,
        side: THREE.DoubleSide
    });

    // Dual peak / gable ridge roof
    const roofGeo = new THREE.BoxGeometry(width - 0.2, 1.4, depth - 0.2);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.2;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    const valanceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const valanceGeo = new THREE.BoxGeometry(width, 0.4, depth);
    const valance = new THREE.Mesh(valanceGeo, valanceMat);
    valance.position.y = 2.5;
    valance.castShadow = true;
    group.add(valance);

    const logo1 = makeTextSprite(brand.name, brand.main, 'transparent');
    logo1.scale.set(width * 0.7, 0.75, 1);
    logo1.position.set(0, 2.5, depth / 2 + 0.01);
    group.add(logo1);

    const logo2 = makeTextSprite(brand.name, brand.main, 'transparent');
    logo2.scale.set(width * 0.7, 0.75, 1);
    logo2.position.set(0, 2.5, -depth / 2 - 0.01);
    logo2.rotation.y = Math.PI;
    group.add(logo2);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6, roughness: 0.4 });
    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8);
    const zCoords = [-depth/2 + 0.1, 0, depth/2 - 0.1];
    for (let x of [-width/2 + 0.1, width/2 - 0.1]) {
        for (let z of zCoords) {
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(x, 1.25, z);
            pole.castShadow = true;
            group.add(pole);
        }
    }

    const tentLight = new THREE.PointLight(0xffea9f, 0.9, 10);
    tentLight.position.set(0, 2.2, 0);
    tentLight.name = 'interiorLight';
    group.add(tentLight);

    return group;
}

/** Carpa Pagoda 4x4m (Techo alto en punta blanca 4.5m) */
export function makePagodaTent(brandKey = 'andina') {
    const group = new THREE.Group();
    const brand = BRAND_COLORS[brandKey] || BRAND_COLORS.andina;

    const roofMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8,
        side: THREE.DoubleSide
    });

    const roofGeo = new THREE.ConeGeometry(2.9, 2.2, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.6;
    roof.castShadow = true;
    group.add(roof);

    const valanceMat = new THREE.MeshStandardMaterial({ color: brand.main, roughness: 0.8 });
    const valance = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.45, 4.0), valanceMat);
    valance.position.y = 2.5;
    group.add(valance);

    const logo = makeTextSprite('PAGODA ' + brand.name, '#ffffff', 'transparent');
    logo.scale.set(3, 0.75, 1);
    logo.position.set(0, 2.5, 2.01);
    group.add(logo);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.7 });
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8);
    for (let x of [-1.95, 1.95]) {
        for (let z of [-1.95, 1.95]) {
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(x, 1.25, z);
            pole.castShadow = true;
            group.add(pole);
        }
    }

    const light = new THREE.PointLight(0xfff0c2, 1.0, 9);
    light.position.set(0, 2.3, 0);
    light.name = 'interiorLight';
    group.add(light);

    return group;
}

/** Carpa Pagoda Doble 4x8m (Doble Cúpula / Aguja blanca elevadas) */
export function makeDoublePagodaTent(brandKey = 'andina') {
    const group = new THREE.Group();
    const brand = BRAND_COLORS[brandKey] || BRAND_COLORS.andina;

    const roofMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8,
        side: THREE.DoubleSide
    });

    // Peak 1 (z = -2.0)
    const peak1Geo = new THREE.ConeGeometry(2.8, 2.2, 4);
    peak1Geo.rotateY(Math.PI / 4);
    const peak1 = new THREE.Mesh(peak1Geo, roofMat);
    peak1.position.set(0, 3.6, -2.0);
    peak1.castShadow = true;
    group.add(peak1);

    // Peak 2 (z = +2.0)
    const peak2Geo = new THREE.ConeGeometry(2.8, 2.2, 4);
    peak2Geo.rotateY(Math.PI / 4);
    const peak2 = new THREE.Mesh(peak2Geo, roofMat);
    peak2.position.set(0, 3.6, 2.0);
    peak2.castShadow = true;
    group.add(peak2);

    // Connecting Roof Ridge
    const ridgeGeo = new THREE.BoxGeometry(3.9, 0.3, 4.0);
    const ridge = new THREE.Mesh(ridgeGeo, roofMat);
    ridge.position.set(0, 2.65, 0);
    group.add(ridge);

    // Valance color de marca (4x8m)
    const valanceMat = new THREE.MeshStandardMaterial({ color: brand.main, roughness: 0.8 });
    const valance = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.45, 8.0), valanceMat);
    valance.position.y = 2.5;
    group.add(valance);

    const logo1 = makeTextSprite('PAGODA DOBLE 4x8 ' + brand.name, '#ffffff', 'transparent');
    logo1.scale.set(3.8, 0.75, 1);
    logo1.position.set(2.01, 2.5, 0);
    logo1.rotation.y = Math.PI / 2;
    group.add(logo1);

    const logo2 = makeTextSprite('PAGODA DOBLE 4x8 ' + brand.name, '#ffffff', 'transparent');
    logo2.scale.set(3.8, 0.75, 1);
    logo2.position.set(-2.01, 2.5, 0);
    logo2.rotation.y = -Math.PI / 2;
    group.add(logo2);

    // Poles (6 patas para estructura de 8m)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.7 });
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8);
    for (let x of [-1.95, 1.95]) {
        for (let z of [-3.95, 0, 3.95]) {
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(x, 1.25, z);
            pole.castShadow = true;
            group.add(pole);
        }
    }

    const light1 = new THREE.PointLight(0xfff0c2, 1.0, 9);
    light1.position.set(0, 2.3, -2.0);
    light1.name = 'interiorLight';
    group.add(light1);

    const light2 = new THREE.PointLight(0xfff0c2, 1.0, 9);
    light2.position.set(0, 2.3, 2.0);
    light2.name = 'interiorLight';
    group.add(light2);

    return group;
}

/** Valla con marca personalizada (2.5m) */
export function makeAndinaBarrier(length = 2.5, brandKey = 'andina') {
    const group = new THREE.Group();
    const brand = BRAND_COLORS[brandKey] || BRAND_COLORS.andina;
    
    const frameMat = new THREE.MeshStandardMaterial({ color: brand.main, metalness: 0.4, roughness: 0.6 });
    
    const height = 1.2;
    const postGeo = new THREE.CylinderGeometry(0.03, 0.03, height, 8);
    for (let x of [-length/2 + 0.05, length/2 - 0.05]) {
        const post = new THREE.Mesh(postGeo, frameMat);
        post.position.set(x, height/2, 0);
        post.castShadow = true;
        group.add(post);
        
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), frameMat);
        foot.rotation.x = Math.PI / 2;
        foot.position.set(x, 0.05, 0);
        group.add(foot);
    }

    const horizGeo = new THREE.CylinderGeometry(0.03, 0.03, length, 8);
    horizGeo.rotateZ(Math.PI / 2);
    
    const topBar = new THREE.Mesh(horizGeo, frameMat);
    topBar.position.y = height - 0.05;
    group.add(topBar);
    
    const bottomBar = new THREE.Mesh(horizGeo, frameMat);
    bottomBar.position.y = 0.2;
    group.add(bottomBar);

    const bannerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(length - 0.2, height - 0.35), bannerMat);
    banner.position.y = (height - 0.05 + 0.2) / 2;
    group.add(banner);

    const logo = makeTextSprite(brand.name, brand.main, 'transparent');
    logo.scale.set(length * 0.8, (height - 0.35) * 0.8, 1);
    logo.position.set(0, banner.position.y, 0.02);
    group.add(logo);
    
    const logoBack = makeTextSprite(brand.name, brand.main, 'transparent');
    logoBack.scale.set(length * 0.8, (height - 0.35) * 0.8, 1);
    logoBack.position.set(0, banner.position.y, -0.02);
    logoBack.rotation.y = Math.PI;
    group.add(logoBack);

    return group;
}

/** Barra de Tragos con marca personalizada */
export function makeAndinaBar(brandKey = 'andina') {
    const group = new THREE.Group();
    const brand = BRAND_COLORS[brandKey] || BRAND_COLORS.andina;
    
    const barWidth = 4.0;
    const barHeight = 1.1;
    const barDepth = 0.8;
    const bodyMat = new THREE.MeshStandardMaterial({ color: brand.main, roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(barWidth, barHeight, barDepth), bodyMat);
    body.position.y = barHeight / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const topMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(barWidth + 0.1, 0.05, barDepth + 0.1), topMat);
    top.position.y = barHeight;
    group.add(top);

    const logo = makeTextSprite(brand.name, '#ffffff', 'transparent');
    logo.scale.set(3, 0.8, 1);
    logo.position.set(0, barHeight / 2, barDepth / 2 + 0.01);
    group.add(logo);
    
    const coolerMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    for (let i of [-1, 1]) {
        const cooler = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.8), coolerMat);
        cooler.position.set(i * 1.0, 0.45, -1.0);
        cooler.castShadow = true;
        group.add(cooler);
        
        const lidMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const lid = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.8), lidMat);
        lid.position.set(i * 1.0, 0.9, -1.0);
        group.add(lid);
    }

    for (let x of [-0.6, 0, 0.6]) {
        const tapBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.3, 8),
            new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8, roughness: 0.2 })
        );
        tapBase.position.set(x, barHeight + 0.15, 0);
        tapBase.castShadow = true;
        group.add(tapBase);

        const tapHandle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8),
            new THREE.MeshStandardMaterial({ color: brand.main, metalness: 0.3 })
        );
        tapHandle.position.set(x, barHeight + 0.3, 0.05);
        tapHandle.rotation.x = Math.PI / 6;
        group.add(tapHandle);
    }

    const barLight = new THREE.PointLight(brand.main, 1.2, 6);
    barLight.position.set(0, barHeight / 2, barDepth / 2 + 0.1);
    barLight.name = 'interiorLight';
    group.add(barLight);

    return group;
}
