/**
 * js/components/StorageManager.js
 * Handles custom Google map uploads, JSON scene export, and JSON scene importing.
 */
import { showNotification } from '../utils/ui.js';

export class StorageManager {
    constructor(state, workspaceComponent) {
        this.state = state;
        this.workspaceComponent = workspaceComponent;
        
        this.btnUploadMap = document.getElementById('btnUploadMap');
        this.btnSave = document.getElementById('btnSave');
        this.btnLoad = document.getElementById('btnLoad');
        this.mapInput = document.getElementById('mapInput');
        this.jsonInput = document.getElementById('jsonInput');
        this.mapImage = document.getElementById('mapImage');

        this.init();
    }

    init() {
        if (this.btnUploadMap && this.mapInput) {
            this.btnUploadMap.addEventListener('click', () => this.mapInput.click());
            this.mapInput.addEventListener('change', (e) => this.handleMapUpload(e));
        }

        if (this.btnSave) {
            this.btnSave.addEventListener('click', () => this.saveScene());
        }

        if (this.btnLoad && this.jsonInput) {
            this.btnLoad.addEventListener('click', () => this.jsonInput.click());
            this.jsonInput.addEventListener('change', (e) => this.loadScene(e));
        }
    }

    handleMapUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            this.mapImage.onload = () => {
                if (this.workspaceComponent) this.workspaceComponent.initMapPosition();
            };
            this.mapImage.src = ev.target.result;
            showNotification('Mapa de Google cargado');
        };
        reader.readAsDataURL(file);
    }

    saveScene() {
        const payload = {
            mapImageSrc: this.mapImage.src.startsWith('data:') ? this.mapImage.src : 'imagen1.png',
            elements: this.state.elements
        };
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "escenario_andina.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showNotification('Escenario guardado exitosamente');
    }

    loadScene(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const loaded = JSON.parse(ev.target.result);
                const loadedElements = Array.isArray(loaded) ? loaded : (loaded.elements || []);
                
                if (!Array.isArray(loaded) && loaded.mapImageSrc) {
                    this.mapImage.onload = () => {
                        if (this.workspaceComponent) this.workspaceComponent.initMapPosition();
                    };
                    this.mapImage.src = loaded.mapImageSrc;
                }

                this.state.setElements(loadedElements);
                showNotification('Escenario cargado con éxito');
            } catch (err) {
                alert('Error al leer el archivo JSON.');
            }
        };
        reader.readAsText(file);
    }
}
