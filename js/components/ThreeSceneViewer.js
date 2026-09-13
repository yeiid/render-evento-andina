/**
 * js/components/ThreeSceneViewer.js
 * Advanced Interactive 3D Visualizer with:
 * - Pixel-perfect 2D ↔ 3D coordinate conversion matching element centroids
 * - Model dispatchers for Pagoda 4x4, Pagoda Doble 4x8, Rectangular tents (3x3, 4x4, 4x6, 4x8), Bars and Barriers by Brand (Andina, Tecate, Heineken)
 * - Direct 3D Raycast object dragging & real-time synchronization
 * - 3 Camera Modes: Aerial Orbit, 1.7m First-Person Walkthrough, and Cinematic Drone Flyover
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
    makeAndinaTent, 
    makePagodaTent, 
    makeDoublePagodaTent,
    makeRectangularTent,
    makeAndinaBar, 
    makeAndinaBarrier, 
    makePersonModel 
} from '../modules/estructuras.js';
import { showNotification } from '../utils/ui.js';

export class ThreeSceneViewer {
    constructor(state) {
        this.state = state;
        this.modal = document.getElementById('threeModal');
        this.container = document.getElementById('threeCanvasContainer');
        this.mapImage = document.getElementById('mapImage');

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.elementsGroup = null;
        this.peopleGroup = null;
        this.groundMesh = null;
        this.directionalLight = null;
        this.ambientLight = null;
        this.boxHelper = null;

        this.animFrameId = null;
        this.cameraMode = 'orbit'; // 'orbit', 'walk', 'drone'
        this.droneAngle = 0;
        this.isNight = false;
        this.showPeople = false; // Disabled by default, toggleable by user

        // 3D Object Dragging State
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.planeIntersection = new THREE.Vector3();
        this.dragging3DElement = null;
        this.dragOffset = new THREE.Vector3();
        this.groundWidth = 60;
        this.groundHeight = 45;

        // First person walkthrough movement state
        this.walkPos = new THREE.Vector3(0, 1.7, 10);
        this.walkYaw = 0;
        this.keysPressed = {};

        this.init();
    }

    init() {
        const btnView3D = document.getElementById('btnView3D');
        const btnClose3D = document.getElementById('btnClose3D');
        const btnReset3DCam = document.getElementById('btnReset3DCam');
        const btnToggle3DLight = document.getElementById('btnToggle3DLight');
        const btnFocus3D = document.getElementById('btnFocus3D');
        const btnOverview3D = document.getElementById('btnOverview3D');
        const btnDuplicate3D = document.getElementById('btnDuplicate3D');
        const btnDelete3D = document.getElementById('btnDelete3D');
        const btnSnapshot3D = document.getElementById('btnSnapshot3D');
        
        // Mode buttons
        const btnModeOrbit = document.getElementById('btnModeOrbit');
        const btnModeWalk = document.getElementById('btnModeWalk');
        const btnModeDrone = document.getElementById('btnModeDrone');

        if (btnView3D) btnView3D.addEventListener('click', () => this.open3DModal());
        if (btnClose3D) btnClose3D.addEventListener('click', () => this.close3DModal());
        if (btnReset3DCam) btnReset3DCam.addEventListener('click', () => this.setCameraMode('orbit'));
        if (btnToggle3DLight) btnToggle3DLight.addEventListener('click', () => this.toggleLighting());
        if (btnFocus3D) btnFocus3D.addEventListener('click', () => this.focusOnSelectedElement());
        if (btnOverview3D) btnOverview3D.addEventListener('click', () => this.zoomToOverview());
        if (btnDuplicate3D) btnDuplicate3D.addEventListener('click', () => this.duplicateSelectedElement());
        if (btnDelete3D) btnDelete3D.addEventListener('click', () => this.deleteSelectedElement());
        if (btnSnapshot3D) btnSnapshot3D.addEventListener('click', () => this.takeSnapshot());

        if (btnModeOrbit) btnModeOrbit.addEventListener('click', () => this.setCameraMode('orbit'));
        if (btnModeWalk) btnModeWalk.addEventListener('click', () => this.setCameraMode('walk'));
        if (btnModeDrone) btnModeDrone.addEventListener('click', () => this.setCameraMode('drone'));

        this.bindWalkControls();

        window.addEventListener('keydown', (e) => {
            if (this.modal && this.modal.classList.contains('active')) {
                if (e.key.toLowerCase() === 'r') {
                    this.rotateSelectedElement(45);
                } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
                    e.preventDefault();
                    this.duplicateSelectedElement();
                } else if (e.key === 'Delete' || e.key === 'Backspace') {
                    if (document.activeElement.tagName !== 'INPUT') {
                        this.deleteSelectedElement();
                    }
                }
            }
        });

        this.state.subscribe((event) => {
            if ((event === 'mapDimensionsChanged' || event === 'elementAdded' || event === 'elementRemoved' || event === 'elementsReset') && this.modal && this.modal.classList.contains('active')) {
                this.updateGroundAndElements();
            }
        });

        window.addEventListener('resize', () => {
            if (this.modal && this.modal.classList.contains('active')) {
                this.onWindowResize();
            }
        });
    }

    open3DModal() {
        if (!this.mapImage.naturalWidth) {
            showNotification('Espera a que cargue la imagen del mapa');
            return;
        }

        this.modal.classList.add('active');
        if (!this.renderer) {
            this.setupThreeScene();
        }
        this.updateGroundAndElements();
        this.setCameraMode('orbit');
        this.animate();
        showNotification('Vista 3D Activada (Posicionamiento Calibrado)');
    }

    close3DModal() {
        this.modal.classList.remove('active');
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    setupThreeScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050811);
        this.scene.fog = new THREE.FogExp2(0x050811, 0.012);

        // Camera
        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 35, 45);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;

        this.container.appendChild(this.renderer.domElement);

        // Orbit Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.02;

        // Lights
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(this.ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xfff5ea, 1.4);
        this.directionalLight.position.set(25, 40, 20);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 150;
        const d = 35;
        this.directionalLight.shadow.camera.left = -d;
        this.directionalLight.shadow.camera.right = d;
        this.directionalLight.shadow.camera.top = d;
        this.directionalLight.shadow.camera.bottom = -d;
        this.scene.add(this.directionalLight);

        // Groups
        this.elementsGroup = new THREE.Group();
        this.scene.add(this.elementsGroup);

        this.peopleGroup = new THREE.Group();
        this.scene.add(this.peopleGroup);

        // Selection Box Helper
        this.boxHelper = new THREE.BoxHelper(new THREE.Object3D(), 0x00ff00);
        this.boxHelper.visible = false;
        this.scene.add(this.boxHelper);

        this.bind3DDragControls();
    }

    bind3DDragControls() {
        const dom = this.renderer.domElement;

        const updatePointer = (e) => {
            const rect = dom.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
            const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
            this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        };

        dom.addEventListener('contextmenu', (e) => e.preventDefault());

        const onPointerDown = (e) => {
            if (this.cameraMode !== 'orbit') return;
            updatePointer(e);

            this.raycaster.setFromCamera(this.pointer, this.camera);
            const intersects = this.raycaster.intersectObjects(this.elementsGroup.children, true);

            if (intersects.length > 0) {
                let topGroup = intersects[0].object;
                while (topGroup.parent && topGroup.parent !== this.elementsGroup) {
                    topGroup = topGroup.parent;
                }

                if (topGroup && topGroup.userData && topGroup.userData.id) {
                    this.dragging3DElement = topGroup;
                    this.state.selectElement(topGroup.userData.id);

                    this.controls.enabled = false;
                    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);

                    if (e.shiftKey || e.button === 2) {
                        this.isRotating3D = true;
                        this.lastClientX = clientX;
                        dom.style.cursor = 'ew-resize';
                    } else {
                        this.isRotating3D = false;
                        if (this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersection)) {
                            this.dragOffset.copy(topGroup.position).sub(this.planeIntersection);
                        }
                        dom.style.cursor = 'grabbing';
                    }

                    this.boxHelper.setFromObject(topGroup);
                    this.boxHelper.visible = true;
                }
            } else {
                this.boxHelper.visible = false;
            }
        };

        const onPointerMove = (e) => {
            if (!this.dragging3DElement) return;
            const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);

            if (this.isRotating3D) {
                const deltaX = clientX - this.lastClientX;
                this.lastClientX = clientX;

                const el = this.state.elements.find(item => item.id === this.dragging3DElement.userData.id);
                if (el) {
                    const newRot = ((el.rot || 0) + deltaX * 1.5) % 360;
                    this.dragging3DElement.rotation.y = - (newRot * Math.PI / 180);
                    this.boxHelper.update();
                    this.state.updateElement(el.id, { rot: Math.round(newRot) });
                }
                return;
            }

            updatePointer(e);

            this.raycaster.setFromCamera(this.pointer, this.camera);
            const hit = this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersection);
            if (!hit) return;

            const newX = this.planeIntersection.x + this.dragOffset.x;
            const newZ = this.planeIntersection.z + this.dragOffset.z;

            // Clamp 3D positions within ground plane limits
            const halfW = (this.groundWidth || 60) / 2;
            const halfH = (this.groundHeight || 45) / 2;
            const clampedX = Math.max(-halfW, Math.min(halfW, newX));
            const clampedZ = Math.max(-halfH, Math.min(halfH, newZ));

            this.dragging3DElement.position.x = clampedX;
            this.dragging3DElement.position.z = clampedZ;
            this.boxHelper.update();

            const mapW = this.mapWidth || 1920;
            const mapH = this.mapHeight || 1080;

            const u = (clampedX / this.groundWidth) + 0.5;
            const v = (clampedZ / this.groundHeight) + 0.5;

            const elementCenterX = u * mapW;
            const elementCenterY = v * mapH;

            const elData = this.dragging3DElement.userData;
            const x = Math.round(elementCenterX - elData.w / 2);
            const y = Math.round(elementCenterY - elData.h / 2);

            this.state.updateElement(elData.id, { x, y });
        };

        const onPointerUp = () => {
            if (this.dragging3DElement) {
                this.dragging3DElement = null;
                this.isRotating3D = false;
                if (this.cameraMode === 'orbit') {
                    this.controls.enabled = true;
                }
                dom.style.cursor = 'default';
            }
        };

        dom.addEventListener('mousedown', onPointerDown);
        dom.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        dom.addEventListener('touchstart', onPointerDown, { passive: false });
        dom.addEventListener('touchmove', onPointerMove, { passive: false });
        window.addEventListener('touchend', onPointerUp);
    }

    create3DModelForType(type, brand = 'andina') {
        if (type.startsWith('person')) {
            let color = 0x0055a4; // Staff blue
            if (type === 'person_guest') color = 0xcc0000; // Red
            if (type === 'person_vip') color = 0x008200; // Green
            return makePersonModel(color);
        } else if (type.startsWith('barrier')) {
            const barrierBrand = type.split('_')[1] || brand;
            return makeAndinaBarrier(2.5, barrierBrand);
        } else if (type === 'tent_pagoda_4x8') {
            return makeDoublePagodaTent(brand);
        } else if (type === 'tent_pagoda') {
            return makePagodaTent(brand);
        } else if (type === 'tent_4x6') {
            return makeRectangularTent(4.0, 6.0, brand);
        } else if (type === 'tent_4x8') {
            return makeRectangularTent(4.0, 8.0, brand);
        } else if (type.startsWith('tent')) {
            return makeAndinaTent(brand);
        } else if (type.startsWith('bar_') || type === 'bar') {
            const barBrand = type.split('_')[1] || brand;
            return makeAndinaBar(barBrand);
        }
        return makeAndinaTent(brand);
    }

    updateGroundAndElements() {
        if (this.groundMesh) {
            this.scene.remove(this.groundMesh);
            if (this.groundMesh.geometry) this.groundMesh.geometry.dispose();
            if (this.groundMesh.material) this.groundMesh.material.dispose();
        }

        const wrapper = document.getElementById('mapWrapper');
        const styleW = wrapper ? parseFloat(wrapper.style.width) : 0;
        const styleH = wrapper ? parseFloat(wrapper.style.height) : 0;

        this.mapWidth = styleW || this.state.mapWidth || this.mapImage.naturalWidth || 1920;
        this.mapHeight = styleH || this.state.mapHeight || this.mapImage.naturalHeight || 1080;

        this.groundWidth = 60;
        this.groundHeight = this.groundWidth * (this.mapHeight / this.mapWidth);

        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(this.mapImage.src, () => {
            texture.needsUpdate = true;
        });
        texture.colorSpace = THREE.SRGBColorSpace;

        const groundMat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.1
        });

        const groundGeo = new THREE.PlaneGeometry(this.groundWidth, this.groundHeight);
        this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.groundMesh.receiveShadow = true;
        this.scene.add(this.groundMesh);

        // Clear old 3D elements & people
        while (this.elementsGroup.children.length > 0) {
            this.elementsGroup.remove(this.elementsGroup.children[0]);
        }
        while (this.peopleGroup.children.length > 0) {
            this.peopleGroup.remove(this.peopleGroup.children[0]);
        }

        // Map 2D elements into 3D world space
        this.state.elements.forEach(el => {
            const brand = el.brand || 'andina';
            const mesh3D = this.create3DModelForType(el.type, brand);

            // Calibrated 2D/3D default dimensions
            let defaultW = 48, defaultH = 48;
            if (el.type.startsWith('person')) { defaultW = 20; defaultH = 20; }
            if (el.type.startsWith('bar')) { defaultW = 60; defaultH = 25; }
            if (el.type.startsWith('barrier')) { defaultW = 40; defaultH = 10; }
            if (el.type === 'tent_3x3') { defaultW = 36; defaultH = 36; }
            if (el.type === 'tent_4x6') { defaultW = 48; defaultH = 72; }
            if (el.type === 'tent_4x8' || el.type === 'tent_pagoda_4x8') { defaultW = 48; defaultH = 96; }

            const scaleX = el.w / defaultW;
            const scaleZ = el.h / defaultH;

            if (mesh3D) {
                mesh3D.userData = { id: el.id, type: el.type, w: el.w, h: el.h };

                // Pixel-perfect conversion from 2D bounding box center to 3D world position
                const elementCenterX = el.x + el.w / 2;
                const elementCenterY = el.y + el.h / 2;

                const u = elementCenterX / this.mapWidth - 0.5;
                const v = elementCenterY / this.mapHeight - 0.5;

                const worldX = u * this.groundWidth;
                const worldZ = v * this.groundHeight;

                mesh3D.position.set(worldX, 0, worldZ);
                mesh3D.rotation.y = - (el.rot || 0) * (Math.PI / 180);
                mesh3D.scale.set(scaleX, 1, scaleZ);

                this.elementsGroup.add(mesh3D);
            }
        });

        const badge = document.getElementById('threeStatsBadge');
        if (badge) {
            badge.innerText = `📊 ${this.state.elements.length} elementos`;
        }

        this.walkPos.set(0, 1.7, this.groundHeight / 2 + 5);
        this.resetCamera(this.groundWidth, this.groundHeight);
    }

    setCameraMode(mode) {
        this.cameraMode = mode;

        document.querySelectorAll('.btn-mode').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`btnMode${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
        if (activeBtn) activeBtn.classList.add('active');

        if (mode === 'orbit') {
            this.controls.enabled = true;
            this.resetCamera();
            showNotification('Cámara: Órbita Aérea (Arrastra objetos en 3D)');
        } else if (mode === 'walk') {
            this.controls.enabled = false;
            this.camera.position.copy(this.walkPos);
            this.camera.lookAt(this.walkPos.x, 1.7, this.walkPos.z - 5);
            showNotification('Modo Peatón 3D (Usa WASD o Teclas de Dirección)');
        } else if (mode === 'drone') {
            this.controls.enabled = false;
            showNotification('Modo Dron Cinemático');
        }
    }

    bindWalkControls() {
        window.addEventListener('keydown', (e) => {
            if (this.cameraMode === 'walk') {
                this.keysPressed[e.key.toLowerCase()] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.cameraMode === 'walk') {
                this.keysPressed[e.key.toLowerCase()] = false;
            }
        });
    }

    updateWalkthrough(delta) {
        if (this.cameraMode !== 'walk') return;

        const moveSpeed = 8.0 * delta;
        const rotateSpeed = 1.5 * delta;

        if (this.keysPressed['a'] || this.keysPressed['arrowleft']) this.walkYaw += rotateSpeed;
        if (this.keysPressed['d'] || this.keysPressed['arrowright']) this.walkYaw -= rotateSpeed;

        const dirX = Math.sin(this.walkYaw);
        const dirZ = Math.cos(this.walkYaw);

        if (this.keysPressed['w'] || this.keysPressed['arrowup']) {
            this.walkPos.x -= dirX * moveSpeed;
            this.walkPos.z -= dirZ * moveSpeed;
        }
        if (this.keysPressed['s'] || this.keysPressed['arrowdown']) {
            this.walkPos.x += dirX * moveSpeed;
            this.walkPos.z += dirZ * moveSpeed;
        }

        this.walkPos.y = 1.7;

        this.camera.position.copy(this.walkPos);
        const lookTarget = new THREE.Vector3(
            this.walkPos.x - Math.sin(this.walkYaw) * 10,
            1.7,
            this.walkPos.z - Math.cos(this.walkYaw) * 10
        );
        this.camera.lookAt(lookTarget);
    }

    updateDroneFlyover(delta) {
        if (this.cameraMode !== 'drone') return;

        this.droneAngle += 0.25 * delta;
        const radius = 45;
        const height = 28;

        const droneX = Math.cos(this.droneAngle) * radius;
        const droneZ = Math.sin(this.droneAngle) * radius;

        this.camera.position.set(droneX, height, droneZ);
        this.camera.lookAt(0, 0, 0);
    }

    resetCamera(w = 60, h = 45) {
        if (!this.camera || !this.controls) return;
        this.camera.position.set(0, Math.max(w, h) * 0.7, Math.max(w, h) * 0.8);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    toggleLighting() {
        this.isNight = !this.isNight;
        
        if (this.isNight) {
            this.scene.background.setHex(0x020307);
            this.scene.fog.color.setHex(0x020307);
            this.directionalLight.intensity = 0.2;
            this.ambientLight.intensity = 0.3;
            
            this.elementsGroup.traverse(child => {
                if (child.isPointLight) child.intensity = 1.5;
            });
            showNotification('Modo Noche 3D (Luces de Evento Activas)');
        } else {
            this.scene.background.setHex(0x050811);
            this.scene.fog.color.setHex(0x050811);
            this.directionalLight.intensity = 1.4;
            this.ambientLight.intensity = 0.7;
            
            this.elementsGroup.traverse(child => {
                if (child.isPointLight) child.intensity = 0.3;
            });
            showNotification('Modo Día 3D');
        }
    }

    duplicateSelectedElement() {
        if (!this.state.selectedId) {
            showNotification('Selecciona un elemento para duplicar');
            return;
        }

        const newEl = this.state.duplicateElement(this.state.selectedId);
        if (newEl) {
            this.updateGroundAndElements();
            this.focusOnSelectedElement();
            showNotification('Elemento Duplicado Exitosamente');
        }
    }

    deleteSelectedElement() {
        if (!this.state.selectedId) {
            showNotification('Selecciona un elemento para eliminar');
            return;
        }

        const targetId = this.state.selectedId;
        this.state.removeElement(targetId);
        this.boxHelper.visible = false;
        this.updateGroundAndElements();
        showNotification('Elemento Eliminado');
    }

    takeSnapshot() {
        if (!this.renderer || !this.scene || !this.camera) return;

        // Ensure current frame is rendered cleanly
        this.renderer.render(this.scene, this.camera);
        const dataUrl = this.renderer.domElement.toDataURL('image/png');

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `render-evento-andina-3d-${Date.now()}.png`;
        a.click();
        showNotification('📸 Capura PNG descargada con éxito');
    }

    rotateSelectedElement(angleDeg = 45) {
        if (!this.state.selectedId) {
            showNotification('Selecciona un elemento en 2D o 3D para rotarlo');
            return;
        }

        const el = this.state.elements.find(item => item.id === this.state.selectedId);
        if (!el) return;

        const newRot = ((el.rot || 0) + angleDeg) % 360;
        const targetMesh = this.elementsGroup.children.find(child => child.userData && child.userData.id === this.state.selectedId);
        if (targetMesh) {
            targetMesh.rotation.y = - (newRot * Math.PI / 180);
            this.boxHelper.update();
        }

        this.state.updateElement(this.state.selectedId, { rot: Math.round(newRot) });
        showNotification(`Rotación 3D: ${Math.round(newRot)}°`);
    }

    focusOnSelectedElement() {
        if (!this.state.selectedId) {
            showNotification('Selecciona un elemento en 2D o 3D para enfocar');
            return;
        }

        const targetMesh = this.elementsGroup.children.find(child => child.userData && child.userData.id === this.state.selectedId);
        if (!targetMesh) return;

        const targetPos = targetMesh.position;
        if (this.controls) {
            this.controls.target.set(targetPos.x, targetPos.y + 1, targetPos.z);
            this.camera.position.set(targetPos.x + 6, targetPos.y + 5, targetPos.z + 8);
            this.controls.update();
            this.boxHelper.setFromObject(targetMesh);
            this.boxHelper.visible = true;
            showNotification('Cámara Enfocada en Elemento Seleccionado');
        }
    }

    zoomToOverview() {
        this.resetCamera(this.groundWidth, this.groundHeight);
        this.boxHelper.visible = false;
        showNotification('Vista General del Escenario');
    }

    togglePeople() {
        this.showPeople = !this.showPeople;
        const btnTogglePeople = document.getElementById('btnTogglePeople');
        if (btnTogglePeople) {
            btnTogglePeople.classList.toggle('active', this.showPeople);
        }
        this.updateGroundAndElements();
        showNotification(this.showPeople ? 'Modelos de Personas (Escala Humana): Visibles' : 'Modelos de Personas: Ocultos');
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        if (!this.modal.classList.contains('active')) return;
        
        this.animFrameId = requestAnimationFrame(() => this.animate());

        const delta = 0.016;

        if (this.cameraMode === 'orbit' && this.controls) {
            this.controls.update();
        } else if (this.cameraMode === 'walk') {
            this.updateWalkthrough(delta);
        } else if (this.cameraMode === 'drone') {
            this.updateDroneFlyover(delta);
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
