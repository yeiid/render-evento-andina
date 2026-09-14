/**
 * js/components/PropertyPanel.js
 * Controls the floating property inspector panel for selected elements.
 * Manages Rotation, Duplicate, and Delete actions.
 */
import { showNotification } from '../utils/ui.js';

export class PropertyPanel {
    constructor(state, groupManager = null) {
        this.state = state;
        this.groupManager = groupManager;
        this.panel = document.getElementById('propPanel');
        this.propTitle = document.getElementById('propTitle');
        this.inpRot = document.getElementById('inpRot');
        this.btnDuplicate = document.getElementById('btnDuplicate');
        this.btnDelete = document.getElementById('btnDelete');
        this.btnGroup = document.getElementById('btnGroup');
        this.btnUngroup = document.getElementById('btnUngroup');
        this.btnSavePrefab = document.getElementById('btnSavePrefab');

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
                const rot = parseInt(e.target.value, 10) || 0;
                if (this.state.selectedIds.length > 1) {
                    this.state.selectedIds.forEach(id => this.state.updateElement(id, { rot }));
                } else if (this.state.selectedId) {
                    this.state.updateElement(this.state.selectedId, { rot });
                }
            });
        }

        if (this.btnDuplicate) {
            this.btnDuplicate.addEventListener('click', () => {
                if (this.state.selectedIds.length > 1) {
                    this.state.selectedIds.forEach(id => this.state.duplicateElement(id));
                    showNotification(`${this.state.selectedIds.length} elementos duplicados`);
                } else if (this.state.selectedId) {
                    this.state.duplicateElement(this.state.selectedId);
                    showNotification('Elemento duplicado');
                }
            });
        }

        if (this.btnDelete) {
            this.btnDelete.addEventListener('click', () => {
                if (this.state.selectedIds.length > 1) {
                    const count = this.state.selectedIds.length;
                    [...this.state.selectedIds].forEach(id => this.state.removeElement(id));
                    showNotification(`${count} elementos eliminados`);
                } else if (this.state.selectedId) {
                    this.state.removeElement(this.state.selectedId);
                    showNotification('Elemento eliminado');
                }
            });
        }

        if (this.btnGroup) {
            this.btnGroup.addEventListener('click', () => {
                if (this.groupManager) this.groupManager.groupSelected();
                else this.state.groupSelectedElements();
            });
        }

        if (this.btnUngroup) {
            this.btnUngroup.addEventListener('click', () => {
                if (this.groupManager) this.groupManager.ungroupSelected();
                else this.state.ungroupSelectedElements();
            });
        }

        if (this.btnSavePrefab) {
            this.btnSavePrefab.addEventListener('click', () => {
                if (this.groupManager) this.groupManager.saveAsTemplate();
                else this.state.saveSelectionAsPrefab();
            });
        }

        window.addEventListener('keydown', (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && (this.state.selectedId || this.state.selectedIds.length > 0) && e.target.tagName !== 'INPUT') {
                if (this.btnDelete) this.btnDelete.click();
            }
        });
    }

    updatePanelVisibility(selectedId) {
        const selectedCount = this.state.selectedIds ? this.state.selectedIds.length : (selectedId ? 1 : 0);

        if (selectedCount > 1) {
            this.panel.classList.add('visible');
            if (this.propTitle) this.propTitle.innerText = `📦 Selección (${selectedCount})`;
        } else if (selectedId) {
            const el = this.state.elements.find(item => item.id === selectedId);
            if (!el) {
                this.panel.classList.remove('visible');
                return;
            }

            this.panel.classList.add('visible');
            if (this.propTitle) this.propTitle.innerText = 'Propiedades';
            this.syncInputs(el);
        } else {
            this.panel.classList.remove('visible');
        }
    }

    syncInputs(elData) {
        if (this.inpRot && document.activeElement !== this.inpRot && elData) {
            this.inpRot.value = elData.rot || 0;
        }
    }
}
