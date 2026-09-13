/**
 * js/components/PropertyPanel.js
 * Controls the floating property inspector panel for selected elements.
 * Manages Rotation, Duplicate, and Delete actions.
 */
import { showNotification } from '../utils/ui.js';

export class PropertyPanel {
    constructor(state) {
        this.state = state;
        this.panel = document.getElementById('propPanel');
        this.inpRot = document.getElementById('inpRot');
        this.btnDuplicate = document.getElementById('btnDuplicate');
        this.btnDelete = document.getElementById('btnDelete');

        this.init();
    }

    init() {
        this.state.subscribe((event, data) => {
            if (event === 'selectionChanged') {
                this.updatePanelVisibility(data);
            }
            if (event === 'elementUpdated' && data.id === this.state.selectedId) {
                this.syncInputs(data);
            }
        });

        if (this.inpRot) {
            this.inpRot.addEventListener('input', (e) => {
                if (!this.state.selectedId) return;
                const rot = parseInt(e.target.value, 10) || 0;
                this.state.updateElement(this.state.selectedId, { rot });
            });
        }

        if (this.btnDuplicate) {
            this.btnDuplicate.addEventListener('click', () => {
                if (!this.state.selectedId) return;
                this.state.duplicateElement(this.state.selectedId);
                showNotification('Elemento duplicado');
            });
        }

        if (this.btnDelete) {
            this.btnDelete.addEventListener('click', () => {
                if (!this.state.selectedId) return;
                this.state.removeElement(this.state.selectedId);
                showNotification('Elemento eliminado');
            });
        }

        window.addEventListener('keydown', (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && this.state.selectedId && e.target.tagName !== 'INPUT') {
                if (this.btnDelete) this.btnDelete.click();
            }
        });
    }

    updatePanelVisibility(selectedId) {
        if (selectedId) {
            const el = this.state.elements.find(item => item.id === selectedId);
            if (!el) {
                this.panel.classList.remove('visible');
                return;
            }

            this.panel.classList.add('visible');
            this.syncInputs(el);
        } else {
            this.panel.classList.remove('visible');
        }
    }

    syncInputs(elData) {
        if (this.inpRot && document.activeElement !== this.inpRot) {
            this.inpRot.value = elData.rot;
        }
    }
}
