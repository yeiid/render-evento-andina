import * as THREE from 'three';

/**
 * Terreno de la instalación C.I.E.S.W.A.T. en montaña.
 * Representa el plano cenital del diagrama: terreno empinado en el
 * norte/noreste con curvas de nivel y elevations anotadas, zona de
 * instalación en la parte plana sur, y el muelle/access road que entra
 * desde el oeste (izquierda) serpentando hacia el sur.
 *
 * Elevaciones del diagrama (msnm):
 *   2150, 2180, 2200, 2250
 *
 * Convención de ejes usada en este proyecto:
 *   +X = Este, -X = Oeste
 *   +Z = Sur, -Z = Norte   (así la "parte superior" del plano cae en -Z)
 *   +Y = arriba
 */
export function createTerrain() {
    const group = new THREE.Group();

    // -------------------------------------------------------
    // 1. Base del terreno (todo el recinto)
    // -------------------------------------------------------
    const groundGeo = new THREE.PlaneGeometry(120, 120, 60, 60);
    // Desplace sutil los vértices para sugerir pendiente en la zona N/NE
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        // La parte superior del plano (Norte, -Z) y NEE (+X, -Z) sube
        const mountainness = Math.max(0, (-z - 30) / 50) * 6 +
                             Math.max(0, (x - 20) / 40) * 4 *
                             Math.max(0, (-z - 10) / 40);
        // Suavizar con una caída rápida hacia el sur
        const falloff = Math.max(0, 1 - Math.max(0, -z - 10) / 40);
        const y = mountainness * (1 - falloff * 0.7);
        pos.setY(i, y);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x2e4e2e,   // verde montañoso base
        roughness: 0.95,
        metalness: 0.0,
        side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.castShadow = false;
    group.add(ground);

    // -------------------------------------------------------
    // 2. Zona de instalación sur (color arena/beige)
    //    La parte plana donde se concentran las estructuras
    // -------------------------------------------------------
    const installGeo = new THREE.PlaneGeometry(60, 50);
    const installMat = new THREE.MeshStandardMaterial({
        color: 0xd8c39a,   // arena / tierra compacta
        roughness: 1.0,
        metalness: 0.0,
        side: THREE.DoubleSide,
    });
    const installZone = new THREE.Mesh(installGeo, installMat);
    installZone.rotation.x = -Math.PI / 2;
    installZone.position.set(0, 0.06, -8);  // centro de la zona de instalación
    installZone.receiveShadow = true;
    group.add(installZone);

    // -------------------------------------------------------
    // 3. Curvas de nivel (líneas marrones) en la zona montañosa
    //    Anotamos elevations del diagrama
    // -------------------------------------------------------
    const levelMat = new THREE.LineBasicMaterial({
        color: 0x8b5a2b,
        transparent: true,
        opacity: 0.65,
    });

    // Curvas de nivel aproximadas (polígonos cerrados en -Z positivo == norte)
    const contours = [
        { z: -42, label: '2150 M', radius: 26 },
        { z: -48, label: '2180 M', radius: 20 },
        { z: -55, label: '2200 M', radius: 14 },
        { z: -62, label: '2250 M', radius: 8  },
    ];

    for (const c of contours) {
        const pts = [];
        const segments = 48;
        for (let i = 0; i <= segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            // Estirar ligeramente hacia +X para que el monte se vea más al NE
            const ex = Math.cos(a) * c.radius * (1 + 0.25 * Math.max(0, Math.cos(a)));
            const ez = Math.sin(a) * c.radius;
            pts.push(new THREE.Vector3(ex, 0.07, c.z + ez));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, levelMat);
        group.add(line);
    }

    // -------------------------------------------------------
    // 4. Texto de elevations (Sprites si está disponible, sino omitido)
    // -------------------------------------------------------
    if (typeof TextSprite === 'function') {
        for (const c of contours) {
            const sprite = TextSprite(c.label, '#8b5a2b', 0.9);
            sprite.position.set(0, 0.5, c.z - 1);
            group.add(sprite);
        }
    } else {
        // fallback: anotaciones simples como planos con canvas texture
        for (const c of contours) {
            const txt = makeTextSprite(c.label, '#8b5a2b');
            txt.position.set(0, 0.5, c.z - 1);
            txt.scale.set(4, 1.2, 1);
            group.add(txt);
        }
    }

    // -------------------------------------------------------
    // 5. Muelle de acceso (Access road) — entra por Oeste (izquierda, -X)
    //    y serpentea hacia el sur (+Z)
    // -------------------------------------------------------
    const roadMat = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.9,
        metalness: 0.0,
    });
    // Segementos de camino (serpentea)
    const roadPoints = [
        new THREE.Vector3(-40, 0.05, -20),
        new THREE.Vector3(-30, 0.05, -10),
        new THREE.Vector3(-22, 0.05,  0),
        new THREE.Vector3(-24, 0.05, 10),
        new THREE.Vector3(-28, 0.05, 20),
        new THREE.Vector3(-36, 0.05, 30),
    ];
    // Construir el camino como una tira ancha a lo largo de los puntos
    for (let i = 0; i < roadPoints.length - 1; i++) {
        const a = roadPoints[i];
        const b = roadPoints[i + 1];
        const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(b, a);
        const len = dir.length();
        dir.normalize();
        // Ancho del camino = 2.4
        const wide = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(1.2);
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

    // Borde del camino (línea discontinua ejecutiva)
    const dashMat = new THREE.LineDashedMaterial({
        color: 0x888888,
        dashSize: 0.4,
        gapSize: 0.3,
        linewidth: 1,
    });
    const dashPts = roadPoints.map(p => new THREE.Vector3(p.x, 0.07, p.z));
    const dashGeo = new THREE.BufferGeometry().setFromPoints(dashPts);
    const dashLine = new THREE.Line(dashGeo, dashMat);
    dashLine.computeLineDistances();
    group.add(dashLine);

    // -------------------------------------------------------
    // 6. Pequeño edificio marrón junto al camino (Oeste, cerca del acceso)
    // -------------------------------------------------------
    const smallBuildingMat = new THREE.MeshStandardMaterial({
        color: 0x8b6f47,
        roughness: 0.85,
        metalness: 0.05,
    });
    const smallBldg = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2.2, 5),
        smallBuildingMat
    );
    smallBldg.position.set(-30, 1.1, 28);
    smallBldg.castShadow = true;
    smallBldg.receiveShadow = true;
    group.add(smallBldg);

    // Techado del pequeño edificio
    const smallRoofMat = new THREE.MeshStandardMaterial({
        color: 0x6b4e32,
        roughness: 0.7,
        metalness: 0.1,
    });
    const smallRoof = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.2, 5.4),
        smallRoofMat
    );
    smallRoof.position.set(-30, 2.2, 28);
    smallRoof.castShadow = true;
    group.add(smallRoof);

    // -------------------------------------------------------
    // 7. Zonas verdes de césped/vegetación alrededor de la zona de instalación
    // -------------------------------------------------------
    const grassMat = new THREE.MeshStandardMaterial({
        color: 0x3a6a3a,
        roughness: 0.95,
        metalness: 0.0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
    });
    // Borde sur de la zona de instalación
    const grassSouth = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 12),
        grassMat
    );
    grassSouth.rotation.x = -Math.PI / 2;
    grassSouth.position.set(0, 0.05, 16);
    group.add(grassSouth);

    return group;
}

// -------------------------------------------------------
// Helpers de texto (Sprites con canvas)
// -------------------------------------------------------
function makeTextSprite(text, color = '#ffffff', bg = 'rgba(0,0,0,0.5)') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // fondo
    ctx.fillStyle = bg;
    ctx.roundRect(0, 0, canvas.width, canvas.height, 16);
    ctx.fill();

    // borde
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.roundRect(0, 0, canvas.width, canvas.height, 16);
    ctx.stroke();

    // texto
    ctx.fillStyle = color;
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

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

/** Polyfill mínimo de roundRect en CanvasRenderingContext2D */
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (r > w / 2) r = w / 2;
        if (r > h / 2) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
        return this;
    };
}
