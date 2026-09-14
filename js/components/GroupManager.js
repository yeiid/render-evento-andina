/**
 * js/components/GroupManager.js
 * Controls 2D canvas multi-selection rubber-band box, grouping operations,
 * and saving custom element prefabs/templates.
 */
import { showNotification } from '../utils/ui.js';

export class GroupManager {
    constructor(state, workspaceComponent) {
        this.state = state;
        this.workspaceComponent = workspaceComponent;
        this.workspace = document.getElementById('workspace');
        this.wrapper = document.getElementById('mapWrapper');
        this.container = document.getElementById('elementsContainer');

        this.selectionBox = null;
        this.isSelecting = false;
        this.startX = 0;
        this.startY = 0;

        this.init();
    }

    init() {
        this.createSelectionBoxDOM();
        this.bindSelectionEvents();
    }

    createSelectionBoxDOM() {
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'canvas-selection-box';
        this.selectionBox.style.display = 'none';
        this.wrapper.appendChild(this.selectionBox);
    }

    bindSelectionEvents() {
        // Shift + MouseDown or MouseDown on empty space starts Rubber-band box selection
        this.workspace.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left click
            if (e.target.closest('.placed-element') || e.target.closest('.rotate-handle') || e.target.closest('.prop-panel')) {
                return;
            }

            if (e.shiftKey) {
                this.isSelecting = true;
                const rect = this.wrapper.getBoundingClientRect();
                this.startX = (e.clientX - rect.left) / this.state.scale;
                this.startY = (e.clientY - rect.top) / this.state.scale;

                this.selectionBox.style.left = `${this.startX}px`;
                this.selectionBox.style.top = `${this.startY}px`;
                this.selectionBox.style.width = '0px';
                this.selectionBox.style.height = '0px';
                this.selectionBox.style.display = 'block';
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isSelecting) return;

            const rect = this.wrapper.getBoundingClientRect();
            const currentX = (e.clientX - rect.left) / this.state.scale;
            const currentY = (e.clientY - rect.top) / this.state.scale;

            const minX = Math.min(this.startX, currentX);
            const minY = Math.min(this.startY, currentY);
            const width = Math.abs(currentX - this.startX);
            const height = Math.abs(currentY - this.startY);

            this.selectionBox.style.left = `${minX}px`;
            this.selectionBox.style.top = `${minY}px`;
            this.selectionBox.style.width = `${width}px`;
            this.selectionBox.style.height = `${height}px`;

            // Find elements overlapping selection box
            const selected = [];
            this.state.elements.forEach(el => {
                const elRight = el.x + el.w;
                const elBottom = el.y + el.h;

                const overlap = !(elRight < minX || el.x > minX + width || elBottom < minY || el.y > minY + height);
                if (overlap) {
                    selected.push(el.id);
                }
            });

            this.state.selectMultiple(selected);
        });

        window.addEventListener('mouseup', () => {
            if (this.isSelecting) {
                this.isSelecting = false;
                this.selectionBox.style.display = 'none';
            }
        });
    }

    groupSelected() {
        const group = this.state.groupSelectedElements();
        if (group) {
            showNotification(`🔗 ${group.name} creado (${group.elementIds.length} elementos)`);
        } else {
            showNotification('Selecciona 2 o más elementos para agrupar (Shift + Click)');
        }
    }

    ungroupSelected() {
        this.state.ungroupSelectedElements();
        showNotification('🔓 Grupo desagrupado');
    }

    saveAsTemplate() {
        if (this.state.selectedIds.length === 0) {
            showNotification('Selecciona elementos para guardar como plantilla');
            return;
        }

        const name = prompt('Nombre para este conjunto/plantilla:', `Conjunto ${Date.now().toString().slice(-4)}`);
        if (!name) return;

        const prefab = this.state.saveSelectionAsPrefab(name);
        if (prefab) {
            showNotification(`⭐ Plantilla "${prefab.name}" guardada en el catálogo`);
        }
    }
}
