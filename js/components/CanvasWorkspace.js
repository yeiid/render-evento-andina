/**
 * js/components/CanvasWorkspace.js
 * Controls map canvas viewport interactions: Panning, Mouse wheel zoom, and Mobile Touch Pinch-to-zoom.
 */
export class CanvasWorkspace {
    constructor(state) {
        this.state = state;
        this.workspace = document.getElementById('workspace');
        this.wrapper = document.getElementById('mapWrapper');
        this.image = document.getElementById('mapImage');

        this.panning = false;
        this.startX = 0;
        this.startY = 0;

        // Mobile touch pinch state
        this.initialDistance = null;
        this.initialScale = null;

        this.init();
    }

    init() {
        if (this.image.complete && this.image.naturalWidth > 0) {
            this.initMapPosition();
        } else {
            this.image.onload = () => this.initMapPosition();
        }

        window.addEventListener('resize', () => this.initMapPosition());

        this.bindMouseEvents();
        this.bindTouchEvents();
        this.bindWheelZoom();
    }

    initMapPosition() {
        const mapW = this.image.naturalWidth || 1920;
        const mapH = this.image.naturalHeight || 1080;

        // Store canonical dimensions in central state
        this.state.setMapDimensions(mapW, mapH);

        // Force fixed canonical coordinate resolution on wrapper & elementsContainer
        this.wrapper.style.width = `${mapW}px`;
        this.wrapper.style.height = `${mapH}px`;
        this.image.style.width = '100%';
        this.image.style.height = '100%';

        const elementsContainer = document.getElementById('elementsContainer');
        if (elementsContainer) {
            elementsContainer.style.width = '100%';
            elementsContainer.style.height = '100%';
        }

        const w = this.workspace.clientWidth;
        const h = this.workspace.clientHeight;
        const scaleX = w / mapW;
        const scaleY = h / mapH;
        
        this.state.scale = Math.min(scaleX, scaleY) * 0.95;
        this.state.pointX = (w - mapW * this.state.scale) / 2;
        this.state.pointY = (h - mapH * this.state.scale) / 2;
        
        this.updateTransform();
    }

    updateTransform() {
        this.wrapper.style.transform = `translate(${this.state.pointX}px, ${this.state.pointY}px) scale(${this.state.scale})`;
    }

    bindMouseEvents() {
        this.workspace.addEventListener('mousedown', (e) => {
            if (e.target.closest('.placed-element') || e.target.closest('.rotate-handle') || e.target.closest('.prop-panel')) return;
            this.state.selectElement(null);
            this.panning = true;
            this.startX = e.clientX - this.state.pointX;
            this.startY = e.clientY - this.state.pointY;
        });

        window.addEventListener('mousemove', (e) => {
            if (this.panning) {
                this.state.pointX = e.clientX - this.startX;
                this.state.pointY = e.clientY - this.startY;
                this.updateTransform();
            }
        });

        window.addEventListener('mouseup', () => {
            this.panning = false;
        });
    }

    bindTouchEvents() {
        this.workspace.addEventListener('touchstart', (e) => {
            if (e.target.closest('.placed-element') || e.target.closest('.rotate-handle') || e.target.closest('.prop-panel')) return;
            
            if (e.touches.length === 1) {
                this.state.selectElement(null);
                this.panning = true;
                this.startX = e.touches[0].clientX - this.state.pointX;
                this.startY = e.touches[0].clientY - this.state.pointY;
            } else if (e.touches.length === 2) {
                this.panning = false;
                this.initialDistance = this.getDistance(e.touches[0], e.touches[1]);
                this.initialScale = this.state.scale;
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (this.panning && e.touches.length === 1) {
                this.state.pointX = e.touches[0].clientX - this.startX;
                this.state.pointY = e.touches[0].clientY - this.startY;
                this.updateTransform();
                e.preventDefault();
            } else if (e.touches.length === 2 && this.initialDistance) {
                const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                const zoomFactor = currentDistance / this.initialDistance;
                
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                
                const xs = (centerX - this.state.pointX) / this.state.scale;
                const ys = (centerY - this.state.pointY) / this.state.scale;
                
                this.state.scale = Math.max(0.05, Math.min(this.initialScale * zoomFactor, 10));
                this.state.pointX = centerX - xs * this.state.scale;
                this.state.pointY = centerY - ys * this.state.scale;
                
                this.updateTransform();
                e.preventDefault();
            }
        }, { passive: false });

        window.addEventListener('touchend', () => {
            this.panning = false;
            this.initialDistance = null;
        });
    }

    bindWheelZoom() {
        this.workspace.addEventListener('wheel', (e) => {
            e.preventDefault();
            const xs = (e.clientX - this.state.pointX) / this.state.scale;
            const ys = (e.clientY - this.state.pointY) / this.state.scale;
            const delta = e.wheelDelta ? e.wheelDelta : -e.deltaY;
            
            if (delta > 0) this.state.scale *= 1.15;
            else this.state.scale /= 1.15;
            
            this.state.scale = Math.max(0.05, Math.min(this.state.scale, 10));
            this.state.pointX = e.clientX - xs * this.state.scale;
            this.state.pointY = e.clientY - ys * this.state.scale;
            
            this.updateTransform();
        }, { passive: false });
    }

    getDistance(t1, t2) {
        return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    }

    getViewportCenterCoordinates() {
        const rect = this.wrapper.getBoundingClientRect();
        return {
            x: (this.workspace.clientWidth / 2 - rect.left) / this.state.scale,
            y: (this.workspace.clientHeight / 2 - rect.top) / this.state.scale
        };
    }
}
