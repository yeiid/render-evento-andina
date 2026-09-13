import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ---- Módulos del mapa S.W.A.T. ----
import { createTerrain } from './modules/terreno.js';
import {
    makeTextSprite,
    makeFlagSign,
    makeModularBuilding,
    makePavement,
    makeParkingLines,
    makeContainer,
    makeObstacleLines,
    makeTire,
    makeVehicleRoute,
    makeDashedApproach,
    makeHeliportMark,
    makeYellowTruck,
    makeAndinaTent,
    makeAndinaBarrier,
    makeAndinaBar,
} from './modules/estructuras.js';

// =========================================================
// RENDER — BASE C.I.E.S.W.A.T. (PLANO S.W.A.T.)
// =========================================================
//
// Convención de ejes (coherente con el plano cenital):
//   +X = Este      (derecha en el plano)
//   -X = Oeste      (izquierda / entrada del muelle)
//   +Z = Sur        (fondo del plano, instalaciones)
//   -Z = Norte      (monoidos, curvas de nivel, elevaciones)
//   +Y = arriba
//
// El mapa de imagen1.png se dibuja como fondo con sus límites.

class SWATBaseRender {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.isMobile = this.detectMobile();

        // Grupo del mapa de referencia (imagen1.png + límites)
        this.mapGroup = null;

        this.init();
    }

    detectMobile() {
        const UA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i;
        return UA.test(navigator.userAgent) || window.innerWidth < 768;
    }

    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createControls();
        this.createLighting();

        // 1) Mapa de referencia (imagen1.png) con sus límites
        this.buildMapOverlay();

        // 2) Terreno con elevations y curvas de nivel
        this.terrainGroup = createTerrain();
        this.scene.add(this.terrainGroup);

        // 3) Estructuras del plano
        this.buildStructures();

        this.setupEventListeners();
        this.animate();

        document.getElementById('loading').classList.add('hidden');

        if (this.isMobile) {
            const hint = document.getElementById('touch-hint');
            if (hint) {
                hint.classList.add('visible');
                setTimeout(() => hint.classList.remove('visible'), 4000);
            }
        }
    }

    // -------------------------------------------------------
    // Escena — cielo neutro (el mapa de imagen ya pinta el fondo)
    // -------------------------------------------------------
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x7a8a9a);
        this.scene.fog = new THREE.Fog(0x7a8a9a, 80, 160);
    }

    // -------------------------------------------------------
    // Cámara — vista cenital inicial tipo "plano"
    // -------------------------------------------------------
    createCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 300);
        // Vista cenital desde arriba, mirando el centro de la instalación
        this.camera.position.set(0, 45, 35);
        this.camera.lookAt(0, 0, 0);
    }

    // -------------------------------------------------------
    // Renderer
    // -------------------------------------------------------
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: !this.isMobile });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.container.appendChild(this.renderer.domElement);
    }

    // -------------------------------------------------------
    // Controles
    // -------------------------------------------------------
    createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = this.isMobile ? 0.08 : 0.06;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 120;
        this.controls.maxPolarAngle = Math.PI; // admite vista cenital de arriba
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    // -------------------------------------------------------
    // Iluminación — día exterior
    // -------------------------------------------------------
    createLighting() {
        // Hemisférico: cielo azul / suelo verde
        const hemi = new THREE.HemisphereLight(0x9fc5e8, 0x4a6a3a, 0.9);
        this.scene.add(hemi);

        // Sol con sombras
        const sun = new THREE.DirectionalLight(0xfff4e0, 1.4);
        sun.position.set(25, 35, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 120;
        sun.shadow.camera.left = -60;
        sun.shadow.camera.right = 60;
        sun.shadow.camera.top = 60;
        sun.shadow.camera.bottom = -60;
        sun.shadow.bias = -0.0005;
        this.scene.add(sun);
        this.scene.add(sun.target);
        this.sunLight = sun;
    }

    // -------------------------------------------------------
    // MAPA DE REFERENCIA — imagen1.png con límites visibles
    // -------------------------------------------------------
    buildMapOverlay() {
        this.mapGroup = new THREE.Group();

        // --- Imagen de fondo (plano del diagrama) ---
        const loader = new THREE.TextureLoader();
        const mapUrl = 'imagen1.png';
        loader.load(
            mapUrl,
            (texture) => {
                texture.needsUpdate = true;
                this.texture = texture;

                const mapWidth = 5375.06524291517;
                const mapHeight = 3837.406059556257;

                // Plano con la imagen como background del plano del diagrama
                const mat = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    transparent: true,
                    opacity: 0.55, // semi-transparente para que se vea el 3D encima
                });
                const geo = new THREE.PlaneGeometry(mapWidth, mapHeight);
                const mesh = new THREE.Mesh(geo, mat);
                // Centrar el mapa en el origen; el mapa ocupa 16125 x 11512 en "world units"
                // Pero eso es muy grande para el world. Escalar a tamaño razonable.
                // Conservar proporción: nuevo ancho = 80, alto = 80 * (h/w)
                const SCALE = 80 / mapWidth;
                mesh.scale.set(SCALE, SCALE, 1);
                // Rotar -90° para que el eje Y del mapa vaya hacia +Z (este) del world,
                // y el eje X hacia -Z (norte) del world. Ajustar según convención.
                // El mapa tiene +Y = arriba del dibujo (norte), +X = derecha (este).
                // En nuestro world: +Z = Sur, -Z = Norte.
                // Para que el norte del mapa quede en -Z, rotamos el plano -90° alrededor de Z.
                // Además el mapa corre hacia abajo si no ajustamos el origen.
                mesh.rotation.x = -Math.PI / 2; // acostado sobre XZ
                mesh.position.set(0, -0.02, 0);  // ligeramente debajo del terreno para que no tape estructuras
                this.mapGroup.add(mesh);

                // --- Límites del mapa (rectángulo de borde) ---
                const limitMat = new THREE.LineBasicMaterial({
                    color: 0xff4444,
                    transparent: true,
                    opacity: 0.8,
                });
                const halfW = (mapWidth * SCALE) / 2;
                const halfH = (mapHeight * SCALE) / 2;
                // El plano está acostado en XZ; después de rotation.x = -PI/2,
                // el eje X del plano apunta hacia +X world, y el eje Y del plano apunta hacia +Z world.
                // Así que los bordes en world son:
                //   X: -halfW .. +halfW
                //   Z: -halfH .. +halfH
                const corners = [
                    new THREE.Vector3(-halfW, 0.01, -halfH),
                    new THREE.Vector3( halfW, 0.01, -halfH),
                    new THREE.Vector3( halfW, 0.01,  halfH),
                    new THREE.Vector3(-halfW, 0.01,  halfH),
                    new THREE.Vector3(-halfW, 0.01, -halfH),
                ];
                const borderGeo = new THREE.BufferGeometry().setFromPoints(corners);
                const borderLine = new THREE.Line(borderGeo, limitMat);
                this.mapGroup.add(borderLine);

                // --- Esquinas marcadas (pequeños cubos rojos) ---
                const cornerMat = new THREE.MeshStandardMaterial({
                    color: 0xff2222,
                    emissive: 0xff2222,
                    emissiveIntensity: 0.3,
                    roughness: 0.3,
                });
                for (const [cx, cz] of [
                    [-halfW, -halfH],
                    [ halfW, -halfH],
                    [ halfW,  halfH],
                    [-halfW,  halfH],
                ]) {
                    const corner = new THREE.Mesh(
                        new THREE.BoxGeometry(0.6, 0.6, 0.6),
                        cornerMat
                    );
                    corner.position.set(cx, 0.3, cz);
                    corner.castShadow = true;
                    this.mapGroup.add(corner);
                }

                // --- Etiquetas de los límites (sprites) en las esquinas ---
                if (typeof makeTextSprite === 'function') {
                    const labelStyle = { color: '#ff4444', bg: 'rgba(0,0,0,0.5)' };
                    this.mapGroup.add(makeTextSprite('N ORTE', labelStyle.color, labelStyle.bg));
                    this.mapGroup.children[this.mapGroup.children.length - 1].position.set(0, 0.4, -halfH - 2);
                    this.mapGroup.children[this.mapGroup.children.length - 1].scale.set(6, 1.5, 1);

                    const eLabel = makeTextSprite('E ESTE', labelStyle.color, labelStyle.bg);
                    eLabel.position.set(halfW + 2, 0.4, 0);
                    eLabel.scale.set(6, 1.5, 1);
                    this.mapGroup.add(eLabel);

                    const sLabel = makeTextSprite('S SUR', labelStyle.color, labelStyle.bg);
                    sLabel.position.set(0, 0.4, halfH + 2);
                    sLabel.scale.set(6, 1.5, 1);
                    this.mapGroup.add(sLabel);

                    const oLabel = makeTextSprite('O OESTE', labelStyle.color, labelStyle.bg);
                    oLabel.position.set(-halfW - 2, 0.4, 0);
                    oLabel.scale.set(6, 1.5, 1);
                    this.mapGroup.add(oLabel);
                }

                // --- Escala / leyenda de metros ---
                if (typeof makeTextSprite === 'function') {
                    const legend = makeTextSprite(
                        'Plano C.I.E.S.W.A.T. — 1 cuadro = aprox. 50 m',
                        '#ffffff',
                        'rgba(0,0,0,0.6)'
                    );
                    legend.position.set(-halfW + 1, 0.4, -halfH + 3);
                    legend.scale.set(8, 2, 1);
                    this.mapGroup.add(legend);
                }
            },
            undefined,
            (err) => {
                console.warn('No se pudo cargar imagen1.png como mapa de referencia:', err);
                // Sin mapa: dibujar solo límites ficticios para que el usuario sepa dónde estará
                const dummyMat = new THREE.LineDashedMaterial({
                    color: 0xff4444,
                    dashSize: 0.8,
                    gapSize: 0.6,
                });
                const dummyCorners = [
                    new THREE.Vector3(-40, 0.01, -30),
                    new THREE.Vector3( 40, 0.01, -30),
                    new THREE.Vector3( 40, 0.01,  30),
                    new THREE.Vector3(-40, 0.01,  30),
                    new THREE.Vector3(-40, 0.01, -30),
                ];
                const dummyGeo = new THREE.BufferGeometry().setFromPoints(dummyCorners);
                const dummyLine = new THREE.Line(dummyGeo, dummyMat);
                dummyLine.computeLineDistances();
                this.mapGroup.add(dummyLine);
            }
        );

        this.scene.add(this.mapGroup);
    }

    // -------------------------------------------------------
    // ESTRUCTURAS DEL PLANO
    // -------------------------------------------------------
    buildStructures() {
        // Las posiciones están calibradas para coincidir con el diagrama
        // cuando el mapa de imagen1.png se superpone.

        // ---------------------------------------------------
        // NORTE (-Z) — zona montañosa + edificio principal
        // ---------------------------------------------------

        // Edificio Principal S.W.A.T. (Estructura Modular) — grande, alargado
        // Ubicado en la esquina superior izquierda del plano (NW)
        const buildingW = 14;
        const buildingD = 7;
        const buildingH = 3.2;
        const mainBuilding = makeModularBuilding(buildingW, buildingD, buildingH, 0xe8e8e8, 0xcccccc);
        mainBuilding.position.set(-18, buildingH / 2, -24);
        mainBuilding.castShadow = true;
        mainBuilding.receiveShadow = true;
        this.scene.add(mainBuilding);

        // Extensión adyacente al edificio principal (parte trasera/este del edificio)
        const extension = makeModularBuilding(8, 6, 3.2, 0xd0d0d0, 0xb0b0b0);
        extension.position.set(-10, buildingH / 2, -24);
        extension.castShadow = true;
        extension.receiveShadow = true;
        this.scene.add(extension);

        // ---------------------------------------------------
        // ÁREA DE CONTENEDORA Y TULIBUNA (contenedores al W del edificio)
        // ---------------------------------------------------
        const containerPositions = [
            { x: -30, z: -22 },
            { x: -30, z: -18 },
            { x: -32, z: -14 },
            { x: -28, z: -10 },
        ];
        this.containers = [];
        for (const pos of containerPositions) {
            const container = makeContainer(2.4, 6, 2.6, 0x8899aa, 0x667788);
            container.position.set(pos.x, 1.3, pos.z);
            container.castShadow = true;
            container.receiveShadow = true;
            this.scene.add(container);
            this.containers.push(container);
        }

        // ---------------------------------------------------
        // COBERTIZO DE CONOSS Y LAIVAL
        // ---------------------------------------------------
        const cobertizoMat = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.6,
            metalness: 0.1,
        });
        const cobertizo = new THREE.Mesh(
            new THREE.BoxGeometry(4, 2.2, 4),
            cobertizoMat
        );
        cobertizo.position.set(-14, 1.1, -16);
        cobertizo.castShadow = true;
        cobertizo.receiveShadow = true;
        this.scene.add(cobertizo);

        // techo del cobertizo
        const cobertizoRoofMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.5,
            metalness: 0.2,
        });
        const cobertizoRoof = new THREE.Mesh(
            new THREE.BoxGeometry(4.3, 0.15, 4.3),
            cobertizoRoofMat
        );
        cobertizoRoof.position.set(-14, 2.25, -16);
        cobertizoRoof.castShadow = true;
        this.scene.add(cobertizoRoof);

        // ---------------------------------------------------
        // CARPAS ANDINA LIGHT Y BARRA
        // ---------------------------------------------------
        this.andinaTents = [];
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
                const tent = makeAndinaTent();
                // Posicionar cerca del cobertizo, formando el patrón de 2x3 del plano
                tent.position.set(-8 + col * 4.5, 0, -12 + row * 4.5);
                this.scene.add(tent);
                this.andinaTents.push(tent);
            }
        }
        
        // Barra Andina Light debajo de una de las carpas centrales
        const bar = makeAndinaBar();
        bar.position.set(-8 + 1 * 4.5, 0, -12 + 0 * 4.5);
        this.scene.add(bar);

        // ---------------------------------------------------
        // ZONA DE ESTACIONAMIENTO
        // ---------------------------------------------------
        const parkingMat = makePavement(22, 12, 0x999999);
        parkingMat.position.set(6, 0.05, -22);
        this.scene.add(parkingMat);

        const parkingLines = makeParkingLines(7, 1.4, 22, 0xeeeeee);
        for (const line of parkingLines) {
            line.position.set(6, 0.06, -22);
            this.scene.add(line);
        }

        // ---------------------------------------------------
        // LETREROS DE BIENVENIDA C.I.E.S.W.A.T.
        // ---------------------------------------------------
        if (typeof makeTextSprite === 'function') {
            const letrero = makeTextSprite(
                'BIENVENIDOS C.I.E.S.W.A.T.',
                '#ffcc00',
                'rgba(0,0,0,0.6)'
            );
            letrero.position.set(0, 0.5, -18);
            letrero.scale.set(8, 2, 1);
            this.scene.add(letrero);

            // segundo letrero más pequeño
            const letrero2 = makeTextSprite(
                'BASE DE OPERACIONES',
                '#ffffff',
                'rgba(0,0,0,0.5)'
            );
            letrero2.position.set(2, 0.4, -14);
            letrero2.scale.set(5, 1.2, 1);
            this.scene.add(letrero2);
        }

        // Bandera roja cerca del edificio principal (emblema C.I.E.S.W.A.T.)
        const flag1 = makeFlagSign(0xcc0000, 3.5);
        flag1.position.set(-18, 0, -20.5);
        this.scene.add(flag1);

        // Bandera roja cerca del cobertizo
        const flag2 = makeFlagSign(0xcc0000, 3.0);
        flag2.position.set(-14, 0, -14);
        this.scene.add(flag2);

        // Bandera roja en la ruta vehicular (3 banderas a lo largo)
        for (let i = 0; i < 3; i++) {
            const flag = makeFlagSign(0xcc0000, 2.8);
            flag.position.set(-22 + i * 6, 0, 12 + i * 4);
            this.scene.add(flag);
        }

        // Bandera roja cerca del helipuerto
        const flag3 = makeFlagSign(0xcc0000, 3.2);
        flag3.position.set(28, 0, 22);
        this.scene.add(flag3);

        // ---------------------------------------------------
        // PISTA DE OBSTÁCULOS DE LLANTAS
        // ---------------------------------------------------
        const pistaMat = makePavement(20, 12, 0xd8c39a);
        pistaMat.position.set(4, 0.05, -2);
        this.scene.add(pistaMat);

        const obstLines = makeObstacleLines(8, 20, 12);
        for (const line of obstLines) {
            line.position.set(4, 0.06, -2);
            this.scene.add(line);
        }

        // ---------------------------------------------------
        // CAMPO DE LLANTAS
        // ---------------------------------------------------
        const campoMat = makePavement(14, 10, 0x3a6a3a);
        campoMat.position.set(4, 0.05, 6);
        this.scene.add(campoMat);

        // filas de llantas (5 filas x 6 columnas)
        const tireSpacing = 1.4;
        const rows = 5;
        const cols = 6;
        this.tires = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const tire = makeTire(0.7, 0.25, 0x555555);
                const x = 4 - (cols - 1) * tireSpacing / 2 + c * tireSpacing;
                const z = 6 - (rows - 1) * tireSpacing / 2 + r * tireSpacing;
                tire.position.set(x, 0.15, z);
                this.scene.add(tire);
                this.tires.push(tire);
            }
        }

        // ---------------------------------------------------
        // RUTA DE ASCENSO A LA MONTAÑA (Vehicular) — lado derecho (+X)
        // Serpentea desde la zona de instalación hacia la montaña (-Z, +X)
        // ---------------------------------------------------
        const routePoints = [
            new THREE.Vector3(14, 0.05, -8),
            new THREE.Vector3(20, 0.05, -14),
            new THREE.Vector3(24, 0.05, -22),
            new THREE.Vector3(28, 0.05, -30),
            new THREE.Vector3(28, 0.05, -40),
        ];
        const route = makeVehicleRoute(routePoints, 2.4);
        this.scene.add(route);

        // Bordes de la ruta (líneas)
        const routeEdgeMat = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 });
        for (let i = 0; i < routePoints.length - 1; i++) {
            const a = routePoints[i];
            const b = routePoints[i + 1];
            const dir = new THREE.Vector3().subVectors(b, a);
            const len = dir.length();
            dir.normalize();
            const wide = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(1.25);
            const p1 = new THREE.Vector3().copy(a).add(wide);
            const p2 = new THREE.Vector3().copy(b).add(wide);
            const pts = [p1, p2];
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const line = new THREE.Line(geo, routeEdgeMat);
            this.scene.add(line);
        }

        // ---------------------------------------------------
        // MUALLE DE ACCESO ROAD (entrada desde Oeste -X)
        // Ya está en el terreno (terreno.js), pero aquí reforzamos
        // con el bordado y la estructura Pavimento
        // ---------------------------------------------------
        // (el camino ya fue dibujado en terreno.js)

        // ---------------------------------------------------
        // UNIDADES MODULARES AZULES — 2 PISOS (dos grupos de 4 cajas)
        // ---------------------------------------------------
        // Grupo 1 — bloque 4 cajas (2 pisos, contiguas)
        // Cada unidad modular tiene 2 pisos: se apilan dos cajas azules.
        const unitW = 3.0;
        const unitD = 3.0;
        const floorH = 2.2;
        const gap = 0.2;

        // Primer grupo (4 unidades en 2x2, 2 pisos cada una)
        const group1Base = new THREE.Group();
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                // piso 1
                const floor1 = makeModularBuilding(unitW, unitD, floorH, 0x004b87, 0x003060);
                floor1.position.set(
                    -6 + col * (unitW + gap),
                    floorH / 2,
                    -6 + row * (unitD + gap)
                );
                floor1.castShadow = true;
                floor1.receiveShadow = true;
                group1Base.add(floor1);

                // piso 2 (encima)
                const floor2 = makeModularBuilding(unitW, unitD, floorH, 0x004b87, 0x003060);
                floor2.position.set(
                    -6 + col * (unitW + gap),
                    floorH * 1.5 + floorH / 2,
                    -6 + row * (unitD + gap)
                );
                floor2.castShadow = true;
                floor2.receiveShadow = true;
                group1Base.add(floor2);
            }
        }
        group1Base.position.set(0, 0, 2);
        this.scene.add(group1Base);

        // Segundo grupo (4 unidades, también 2 pisos, ligeramente desplazado)
        const group2Base = new THREE.Group();
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                const floor1 = makeModularBuilding(unitW, unitD, floorH, 0x004b87, 0x003060);
                floor1.position.set(
                    2 + col * (unitW + gap),
                    floorH / 2,
                    0 + row * (unitD + gap)
                );
                floor1.castShadow = true;
                floor1.receiveShadow = true;
                group2Base.add(floor1);

                const floor2 = makeModularBuilding(unitW, unitD, floorH, 0x004b87, 0x003060);
                floor2.position.set(
                    2 + col * (unitW + gap),
                    floorH * 1.5 + floorH / 2,
                    0 + row * (unitD + gap)
                );
                floor2.castShadow = true;
                floor2.receiveShadow = true;
                group2Base.add(floor2);
            }
        }
        group2Base.position.set(0, 0, 2);
        this.scene.add(group2Base);

        // ---------------------------------------------------
        // EDIFICIO PEQUEÑO MARRÓN (junto al camino, W)
        // ---------------------------------------------------
        // (ya estaba en terreno.js, pero reforzamos con un marcador)
        const smallBldg = makeModularBuilding(4, 5, 2.2, 0x8b6f47, 0x6b4e32);
        smallBldg.position.set(-30, 1.1, 28);
        smallBldg.castShadow = true;
        smallBldg.receiveShadow = true;
        this.scene.add(smallBldg);

        // ---------------------------------------------------
        // HELIPUERTO / CONTROL (esquina SE, +X +Z)
        // ---------------------------------------------------
        const heliportMat = makePavement(8, 8, 0x445566);
        heliportMat.position.set(30, 0.05, 24);
        this.scene.add(heliportMat);

        // Línea punteada de aproximación
        const approachStart = new THREE.Vector3(26, 0.06, 30);
        const approachEnd = new THREE.Vector3(30, 0.06, 24);
        const approachLine = makeDashedApproach(approachStart, approachEnd, 0x4488ff, 0.6, 0.4);
        this.scene.add(approachLine);

        // Marcador "H" del helipuerto
        const hMark = makeHeliportMark(0xffffff, 2.5);
        hMark.position.set(30, 0.06, 24);
        this.scene.add(hMark);

        // ---------------------------------------------------
        // VALLAS ANDINA LIGHT (Camino al Helipuerto)
        // ---------------------------------------------------
        this.andinaBarriers = [];
        // Crear un pasillo con vallas hacia el helipuerto
        for (let i = 0; i < 4; i++) {
            const barrierL = makeAndinaBarrier(3);
            barrierL.position.set(20 + i * 3, 0, 22);
            // Rotar ligeramente para seguir el camino
            barrierL.rotation.y = 0.2;
            this.scene.add(barrierL);
            this.andinaBarriers.push(barrierL);
            
            const barrierR = makeAndinaBarrier(3);
            barrierR.position.set(20 + i * 3, 0, 26);
            barrierR.rotation.y = 0.2;
            this.scene.add(barrierR);
            this.andinaBarriers.push(barrierR);
        }

        // ---------------------------------------------------
        // VEHÍCULO AMARILLO cerca del cobertizo
        // ---------------------------------------------------
        const truck = makeYellowTruck(0xffcc00);
        truck.position.set(-16, 0.2, -12);
        truck.rotation.y = 0.5;
        truck.castShadow = true;
        this.scene.add(truck);

        // ---------------------------------------------------
        // VEHÍCULO AMARILLO en la ruta vehicular (subiendo la montaña)
        // ---------------------------------------------------
        const truck2 = makeYellowTruck(0xffcc00);
        truck2.position.set(22, 0.2, -32);
        truck2.rotation.y = -0.8;
        truck2.castShadow = true;
        this.scene.add(truck2);

        // Guardar referencias para futuras animaciones
        this.structureGroups = [
            mainBuilding, extension, group1Base, group2Base,
            cobertizo, cobertizoRoof, heliportMat,
        ];
        this.flags = [flag1, flag2, flag3];
        this.trucks = [truck, truck2];
    }

    // -------------------------------------------------------
    // Event listeners
    // -------------------------------------------------------
    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());

        // Botones UI (mantiene compatibilidad con los ids existentes)
        const controlsContainer = document.getElementById('controls');
        if (controlsContainer) {
            const modes = [
                { id: 'btn-orbit',    mode: 'orbit' },
                { id: 'btn-cinematic', mode: 'cinematic' },
                { id: 'btn-stage',    mode: 'stage' },
                { id: 'btn-aerial',   mode: 'aerial' },
                { id: 'btn-close',    mode: 'close' },
                { id: 'btn-reset',    mode: 'reset' },
            ];
            for (const m of modes) {
                const btn = document.getElementById(m.id);
                if (btn) {
                    btn.addEventListener('click', () => this.setMode(m.mode));
                }
            }
        }

        if (!this.isMobile) {
            window.addEventListener('keydown', (e) => {
                const k = e.key;
                if (k === '1') this.setMode('orbit');
                if (k === '2') this.setMode('cinematic');
                if (k === '3') this.setMode('stage');
                if (k === '4') this.setMode('aerial');
                if (k === '5') this.setMode('close');
                if (k === 'r') this.resetCamera();
            });
        }
    }

    // -------------------------------------------------------
    // Modos de cámara
    // -------------------------------------------------------
    setMode(mode) {
        const modes = {
            orbit: {
                pos: () => this.camera.position.clone(),
                tgt: () => this.controls.target.clone(),
            },
            cinematic: {
                pos: () => new THREE.Vector3(0, 40, 25),
                tgt: () => new THREE.Vector3(0, 0, 0),
            },
            stage: {
                pos: () => new THREE.Vector3(0, 15, 20),
                tgt: () => new THREE.Vector3(0, 0, -5),
            },
            aerial: {
                pos: () => new THREE.Vector3(0, 55, 10),
                tgt: () => new THREE.Vector3(0, 0, 0),
            },
            close: {
                pos: () => new THREE.Vector3(10, 8, 10),
                tgt: () => new THREE.Vector3(-4, 0, -2),
            },
            reset: {
                pos: () => new THREE.Vector3(0, 45, 35),
                tgt: () => new THREE.Vector3(0, 0, 0),
            },
        };

        const m = modes[mode];
        if (!m) return;

        this.currentMode = mode;

        // Actualizar botón activo
        const btns = document.querySelectorAll('#controls button');
        btns.forEach((b) => b.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-${mode}`);
        if (activeBtn) activeBtn.classList.add('active');

        if (mode === 'orbit') {
            this.controls.enabled = true;
            this.animating = false;
        } else if (mode === 'reset') {
            this.controls.enabled = true;
            this.animating = false;
            this.camera.position.copy(m.pos());
            this.controls.target.copy(m.tgt());
            this.controls.update();
            return;
        } else {
            this.controls.enabled = false;
            this.animating = true;
            if (mode === 'cinematic') this.cinematicTime = 0;
            this.camera.position.copy(m.pos());
            this.controls.target.copy(m.tgt());
        }
    }

    resetCamera() {
        this.camera.position.set(0, 45, 35);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
        this.setMode('orbit');
    }

    onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    // -------------------------------------------------------
    // Loop
    // -------------------------------------------------------
    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();

        // Cinemático: orbita cenital alrededor del centro
        if (this.currentMode === 'cinematic' && this.animating) {
            this.cinematicTime += delta * 0.15;
            const r = 42;
            const h = 38 + Math.sin(this.cinematicTime * 0.2) * 4;
            const cx = Math.cos(this.cinematicTime) * r;
            const cz = Math.sin(this.cinematicTime) * r;
            this.camera.position.set(cx, h, cz);
            this.camera.lookAt(0, 0, 0);
            this.controls.target.set(0, 0, 0);
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// =========================================================
// Arranque
// =========================================================
window.addEventListener('DOMContentLoaded', () => {
    const app = new SWATBaseRender('canvas-container');
    window.app = app;

    // Service Worker (mantenido)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('js/service-worker.js').catch((err) => {
            console.warn('SW registration skipped:', err);
        });
    }
});
