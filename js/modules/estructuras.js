import * as THREE from 'three';

// -------------------------------------------------------
// Helpers comunes
// -------------------------------------------------------

/**
 * TextSprite con etiqueta sombreada, orientado siempre a la cámara.
 * Útil para letreros, anotaciones de plano.
 */
export function makeTextSprite(text, color = '#ffffff', bg = 'rgba(0,0,0,0.55)') {
    const canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = 512, h = 128;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // fondo redondeado
    ctx.fillStyle = bg;
    roundRect(ctx, 0, 0, w, h, 14);
    ctx.fill();

    // borde
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    roundRect(ctx, 0, 0, w, h, 14);
    ctx.stroke();

    // texto
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

/** Poste base + cúpula para bandera */
export function makeFlagpole(height = 3.0, color = 0xcccccc) {
    const group = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.3 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, height, 8), poleMat);
    pole.position.y = height / 2;
    pole.castShadow = true;
    group.add(pole);

    // base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 0.08, 8),
        new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 })
    );
    base.position.y = 0.04;
    group.add(base);
    return group;
}

/** Bandera roja con emblema blanco (puede ser sprite o geometry) */
export function makeFlag(redColor = 0xcc0000) {
    const group = new THREE.Group();
    const flagMat = new THREE.MeshStandardMaterial({
        color: redColor,
        roughness: 0.6,
        side: THREE.DoubleSide,
    });
    // bandera como manta pequeña alzada
    const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.6),
        flagMat
    );
    flag.position.set(0, 2.4, 0);
    flag.castShadow = true;
    group.add(flag);

    // emblema blanco (círculo + forma abstracta águila/estrella)
    const emblemMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.15,
        roughness: 0.3,
    });
    const emblem = new THREE.Mesh(
        new THREE.CircleGeometry(0.18, 16),
        emblemMat
    );
    emblem.position.set(0, 2.4, 0.01);
    emblem.rotation.x = -Math.PI / 2;
    group.add(emblem);
    return group;
}

/** Bandera completa (poste + bandera), siempre mirando al cámara para que el emblema visible */
export function makeFlagSign(redColor = 0xcc0000, poleHeight = 3.0) {
    const group = new THREE.Group();
    const pole = makeFlagpole(poleHeight);
    group.add(pole);

    const flag = makeFlag(redColor);
    flag.position.y = poleHeight - 0.2;
    group.add(flag);

    // poste refuerzo para evitar flip
    group.userData = { poleHeight };
    return group;
}

/** Edificio modular (caja con techo aplanado) */
export function makeModularBuilding(
    width = 5,
    depth = 4,
    height = 3,
    wallColor = 0xe8e8e8,
    roofColor = 0xcccccc,
    roofPitch = false
) {
    const group = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({
        color: wallColor,
        roughness: 0.55,
        metalness: 0.05,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // techado
    const roofMat = new THREE.MeshStandardMaterial({
        color: roofColor,
        roughness: 0.4,
        metalness: 0.15,
    });
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.2, 0.2, depth + 0.2),
        roofMat
    );
    roof.position.y = height + 0.1;
    roof.castShadow = true;
    group.add(roof);
    return group;
}

/** Suelo pavimentado (zona de estacionamiento, etc.) */
export function makePavement(width, depth, color = 0x999999) {
    const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.85,
        metalness: 0.05,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.05;
    mesh.receiveShadow = true;
    return mesh;
}

/** Líneas de estacionamiento (pistas blancas sobre pavimento) */
export function makeParkingLines(count, spacing, width, color = 0xeeeeee) {
    const lines = [];
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 });
    for (let i = 0; i < count; i++) {
        const z = -count / 2 * spacing + i * spacing + spacing / 2;
        const pts = [
            new THREE.Vector3(-width / 2 + 0.5, 0.06, z),
            new THREE.Vector3(width / 2 - 0.5, 0.06, z),
        ];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, mat);
        lines.push(line);
    }
    return lines;
}

/** Contenedor estándar (caja gris/azul con detalles de puertas) */
export function makeContainer(
    width = 2.4,
    depth = 6,
    height = 2.6,
    color = 0x888888,
    doorColor = 0x666666
) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.2,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // puertas (francesa: dos mitades)
    const doorMat = new THREE.MeshStandardMaterial({
        color: doorColor,
        roughness: 0.6,
        metalness: 0.3,
    });
    for (const side of [-1, 1]) {
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.42, height * 0.8, 0.05),
            doorMat
        );
        door.position.set(0, height * 0.5, side * depth * 0.45);
        group.add(door);
    }
    // línea divisoria
    const divMat = new THREE.LineBasicMaterial({ color: 0x444444 });
    const divPts = [
        new THREE.Vector3(0, height * 0.2, depth * 0.45),
        new THREE.Vector3(0, height * 0.8, depth * 0.45),
    ];
    const divGeo = new THREE.BufferGeometry().setFromPoints(divPts);
    const divLine = new THREE.Line(divGeo, divMat);
    group.add(divLine);

    // rieles arriba
    const railMat = new THREE.LineBasicMaterial({ color: 0x444444 });
    const railPts = [
        new THREE.Vector3(-width / 2 + 0.1, height, depth * 0.45),
        new THREE.Vector3(width / 2 - 0.1, height, depth * 0.45),
    ];
    const railGeo = new THREE.BufferGeometry().setFromPoints(railPts);
    const railLine = new THREE.Line(railGeo, railMat);
    group.add(railLine);

    return group;
}

/** Líneas de obstáculos (pista de llantas) */
export function makeObstacleLines(count, width, depth, color = 0xd8c39a) {
    const lines = [];
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 });
    const segDepth = depth / count;
    for (let i = 0; i < count; i++) {
        const z = -depth / 2 + i * segDepth + segDepth / 2;
        const pts = [
            new THREE.Vector3(-width / 2 + 0.5, 0.05, z),
            new THREE.Vector3(width / 2 - 0.5, 0.05, z),
        ];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, mat);
        lines.push(line);
    }
    return lines;
}

/** Llantas (círculos grises en el campo de llantas) */
export function makeTire(radius = 0.8, thickness = 0.3, color = 0x555555) {
    const group = new THREE.Group();
    const tireMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.85,
        metalness: 0.05,
    });
    const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, thickness, 20),
        tireMat
    );
    tire.position.y = thickness / 2;
    tire.rotation.x = Math.PI / 2;
    tire.castShadow = true;
    tire.receiveShadow = true;
    group.add(tire);

    // banda de la rueda (anillo más oscuro)
    const rimMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.6,
        metalness: 0.3,
    });
    const rim = new THREE.Mesh(
        new THREE.RingGeometry(radius * 0.3, radius * 0.8, 20),
        rimMat
    );
    rim.position.y = thickness / 2;
    rim.rotation.x = -Math.PI / 2;
    group.add(rim);
    return group;
}

/** Ruta vehicular serpenteando: corredor de tierra con bordes */
export function makeVehicleRoute(points, width = 2.4) {
    const group = new THREE.Group();
    const roadMat = new THREE.MeshStandardMaterial({
        color: 0x6b6b6b,
        roughness: 0.9,
        metalness: 0.0,
    });
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(b, a);
        const len = dir.length();
        dir.normalize();
        const wide = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(width / 2);
        const corners = [
            new THREE.Vector3().copy(a).add(wide),
            new THREE.Vector3().copy(a).sub(wide),
            new THREE.Vector3().copy(b).sub(wide),
            new THREE.Vector3().copy(b).add(wide),
        ];
        const geo = new THREE.BufferGeometry();
        const verts = new Float32Array([
            corners[0].x, 0.05, corners[0].z,
            corners[1].x, 0.05, corners[1].z,
            corners[2].x, 0.05, corners[2].z,
            corners[0].x, 0.05, corners[0].z,
            corners[2].x, 0.05, corners[2].z,
            corners[3].x, 0.05, corners[3].z,
        ]);
        geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        geo.computeVertexNormals();
        const road = new THREE.Mesh(geo, roadMat);
        road.receiveShadow = true;
        group.add(road);
    }
    return group;
}

/** Línea punteada de aproximación (helipuerto) */
export function makeDashedApproach(from, to, color = 0x4488ff, dash = 0.5, gap = 0.4) {
    const pts = [from, to];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineDashedMaterial({
        color,
        dashSize: dash,
        gapSize: gap,
        linewidth: 2,
    });
    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    return line;
}

/** Marcador "H" de helipuerto */
export function makeHeliportMark(color = 0xffffff, size = 2.0) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.2,
        roughness: 0.4,
        metalness: 0.2,
        side: THREE.DoubleSide,
    });
    // h horizontal
    const hH = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.3, size * 0.1), mat);
    hH.position.y = 0.01;
    hH.rotation.x = -Math.PI / 2;
    group.add(hH);
    // h vertical
    const hV = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.1, size * 0.6), mat);
    hV.position.set(0, 0.01, size * 0.15);
    hV.rotation.x = -Math.PI / 2;
    group.add(hV);
    return group;
}

/** Vehículo amarillo simple (chasis + cabina) */
export function makeYellowTruck(color = 0xffcc00) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.4,
        metalness: 0.1,
    });
    // chasis trasero (caja)
    const chassis = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 1.4, 3.2),
        bodyMat
    );
    chassis.position.set(0, 0.9, -0.6);
    chassis.castShadow = true;
    group.add(chassis);
    // cabina
    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 1.2, 1.6),
        bodyMat
    );
    cabin.position.set(0, 1.6, 1.4);
    cabin.castShadow = true;
    group.add(cabin);
    // ventana (rectángulo más claro)
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        roughness: 0.1,
        metalness: 0.3,
        transparent: true,
        opacity: 0.4,
    });
    const glass = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.7, 0.05),
        glassMat
    );
    glass.position.set(0, 1.7, 2.15);
    group.add(glass);
    // ruedas
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    for (const side of [-1, 1]) {
        for (const z of [-1.1, 1.1]) {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12),
                wheelMat
            );
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(side * 1.15, 0.35, z);
            wheel.castShadow = true;
            group.add(wheel);
        }
    }
    return group;
}

// -------------------------------------------------------
// ANDINA LIGHT STRUCTURES
// -------------------------------------------------------

/** Carpa Andina (Pyramidal Tent) */
export function makeAndinaTent() {
    const group = new THREE.Group();
    const blueColor = 0x0055a4; // Andina Blue
    
    // Roof (Pyramid)
    const roofMat = new THREE.MeshStandardMaterial({
        color: blueColor,
        roughness: 0.9,
        side: THREE.DoubleSide
    });
    // ConeGeometry(radius, height, radialSegments)
    // Using 4 segments for a square pyramid
    const roofGeo = new THREE.ConeGeometry(2.8, 1.5, 4);
    // Rotate to align with square base
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.25; // 2.5 (pole height) + 0.75 (half cone height)
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    // Valance (faldón blanco/azul con logo)
    const valanceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const valanceGeo = new THREE.BoxGeometry(4.0, 0.4, 4.0);
    const valance = new THREE.Mesh(valanceGeo, valanceMat);
    valance.position.y = 2.5;
    valance.castShadow = true;
    group.add(valance);

    // Text Sprite for "ANDINA" on the valance (optional, added to one side)
    if (typeof makeTextSprite === 'function') {
        const logo1 = makeTextSprite('ANDINA', blueColor, 'transparent');
        logo1.scale.set(3, 0.75, 1);
        logo1.position.set(0, 2.5, 2.01);
        group.add(logo1);
        
        const logo2 = makeTextSprite('ANDINA', blueColor, 'transparent');
        logo2.scale.set(3, 0.75, 1);
        logo2.position.set(0, 2.5, -2.01);
        logo2.rotation.y = Math.PI;
        group.add(logo2);
    }

    // Poles (4 patas)
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

    return group;
}

/** Valla Andina (Blue Barrier) */
export function makeAndinaBarrier(length = 2.5) {
    const group = new THREE.Group();
    const blueColor = 0x0055a4;
    
    // Marco exterior (tubo azul)
    const frameMat = new THREE.MeshStandardMaterial({ color: blueColor, metalness: 0.4, roughness: 0.6 });
    
    // Postes laterales
    const height = 1.2;
    const postGeo = new THREE.CylinderGeometry(0.03, 0.03, height, 8);
    for (let x of [-length/2 + 0.05, length/2 - 0.05]) {
        const post = new THREE.Mesh(postGeo, frameMat);
        post.position.set(x, height/2, 0);
        post.castShadow = true;
        group.add(post);
        
        // Patitas
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), frameMat);
        foot.rotation.x = Math.PI / 2;
        foot.position.set(x, 0.05, 0);
        group.add(foot);
    }

    // Tubos horizontales superior e inferior
    const horizGeo = new THREE.CylinderGeometry(0.03, 0.03, length, 8);
    horizGeo.rotateZ(Math.PI / 2);
    
    const topBar = new THREE.Mesh(horizGeo, frameMat);
    topBar.position.y = height - 0.05;
    group.add(topBar);
    
    const bottomBar = new THREE.Mesh(horizGeo, frameMat);
    bottomBar.position.y = 0.2;
    group.add(bottomBar);

    // Lona (Banner)
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(length - 0.2, height - 0.35), bannerMat);
    banner.position.y = (height - 0.05 + 0.2) / 2;
    group.add(banner);

    if (typeof makeTextSprite === 'function') {
        const logo = makeTextSprite('ANDINA LIGHT', blueColor, 'transparent');
        logo.scale.set(length * 0.8, (height - 0.35) * 0.8, 1);
        logo.position.set(0, banner.position.y, 0.02);
        group.add(logo);
        
        const logoBack = makeTextSprite('ANDINA LIGHT', blueColor, 'transparent');
        logoBack.scale.set(length * 0.8, (height - 0.35) * 0.8, 1);
        logoBack.position.set(0, banner.position.y, -0.02);
        logoBack.rotation.y = Math.PI;
        group.add(logoBack);
    }

    return group;
}

/** Barra Andina (Bar Stand / Coolers) */
export function makeAndinaBar() {
    const group = new THREE.Group();
    const blueColor = 0x0055a4;
    
    // Mostrador principal
    const barWidth = 4.0;
    const barHeight = 1.1;
    const barDepth = 0.8;
    const bodyMat = new THREE.MeshStandardMaterial({ color: blueColor, roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(barWidth, barHeight, barDepth), bodyMat);
    body.position.y = barHeight / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Tope del mostrador (madera/negro)
    const topMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(barWidth + 0.1, 0.05, barDepth + 0.1), topMat);
    top.position.y = barHeight;
    group.add(top);

    // Letrero Frontal
    if (typeof makeTextSprite === 'function') {
        const logo = makeTextSprite('ANDINA LIGHT', '#ffffff', 'transparent');
        logo.scale.set(3, 0.8, 1);
        logo.position.set(0, barHeight / 2, barDepth / 2 + 0.01);
        group.add(logo);
    }
    
    // Hieleras (Coolers) detrás de la barra
    const coolerMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    for(let i of [-1, 1]) {
        const cooler = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.8), coolerMat);
        cooler.position.set(i * 1.0, 0.45, -1.0);
        cooler.castShadow = true;
        group.add(cooler);
        
        // Tapas grises
        const lidMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const lid = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.8), lidMat);
        lid.position.set(i * 1.0, 0.9, -1.0);
        group.add(lid);
    }

    return group;
}
