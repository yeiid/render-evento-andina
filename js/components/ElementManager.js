/**
 * js/components/ElementManager.js
 * Renders elements into the canvas DOM, handles selection, drag-and-drop movement,
 * and rotation handle. Elements maintain standardized proportional dimensions.
 */
export class ElementManager {
    constructor(state, workspaceComponent) {
        this.state = state;
        this.workspaceComponent = workspaceComponent;
        this.container = document.getElementById('elementsContainer');
        this.wrapper = document.getElementById('mapWrapper');

        this.draggingElement = null;
        this.rotatingElement = null;

        this.init();
    }

    init() {
        this.state.subscribe((event, data) => {
            if (event === 'elementAdded') this.renderElement(data);
            if (event === 'elementRemoved') this.removeElementDOM(data);
            if (event === 'selectionChanged') this.updateSelectionDOM(data);
            if (event === 'elementUpdated') this.updateElementDOM(data);
            if (event === 'cleared') this.container.innerHTML = '';
            if (event === 'elementsReset') this.renderAll(data);
        });

        this.bindGlobalDragAndRotate();
    }

    renderAll(elementsList) {
        this.container.innerHTML = '';
        elementsList.forEach(el => this.renderElement(el));
    }

    renderElement(elData) {
        const div = document.createElement('div');
        div.className = `placed-element el-${elData.type}`;
        div.id = elData.id;
        
        // Strict matching order to prevent 'barrier' from triggering 'bar'
        if (elData.type.startsWith('barrier')) {
            // Vallas do not show text, only dashed boundary lines
            div.innerText = '';
        } else if (elData.type.startsWith('tent')) {
            const textMap = {
                tent_3x3: '3x3',
                tent_4x4: '4x4',
                tent_4x6: '4x6',
                tent_4x8: '4x8',
                tent_pagoda: 'PAGODA',
                tent_pagoda_4x8: 'PAGODA 4x8'
            };
            div.innerText = textMap[elData.type] || 'ANDINA';
        } else if (elData.type.startsWith('bar_') || elData.type === 'bar') {
            const brandMap = {
                bar_andina: 'ANDINA',
                bar_heineken: 'HEINEKEN',
                bar_tecate: 'TECATE'
            };
            div.innerText = brandMap[elData.type] || 'BARRA';
        } else if (elData.type.startsWith('person')) {
            div.innerText = '👤';
            div.title = elData.label || 'Persona';
        }

        // Rotate handle (Top)
        const rotHandle = document.createElement('div');
        rotHandle.className = 'rotate-handle';
        div.appendChild(rotHandle);

        const startInteraction = (e, clientX, clientY) => {
            if (e.target.classList.contains('rotate-handle')) {
                this.rotatingElement = { id: elData.id };
                e.stopPropagation();
                return;
            }

            this.state.selectElement(elData.id, e.shiftKey);
            const rect = this.wrapper.getBoundingClientRect();
            const mouseX = (clientX - rect.left) / this.state.scale;
            const mouseY = (clientY - rect.top) / this.state.scale;
            
            const activeIds = this.state.selectedIds.length > 0 ? this.state.selectedIds : [elData.id];
            this.draggingElement = {
                primaryId: elData.id,
                offsets: activeIds.map(sId => {
                    const item = this.state.elements.find(el => el.id === sId);
                    return {
                        id: sId,
                        offsetX: mouseX - item.x,
                        offsetY: mouseY - item.y
                    };
                })
            };
            e.stopPropagation();
        };

        div.addEventListener('mousedown', (e) => startInteraction(e, e.clientX, e.clientY));
        div.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) startInteraction(e, e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });

        this.container.appendChild(div);
        this.updateElementDOM(elData);
    }

    updateElementDOM(elData) {
        const div = document.getElementById(elData.id);
        if (!div) return;
        div.style.left = `${elData.x}px`;
        div.style.top = `${elData.y}px`;
        div.style.width = `${elData.w}px`;
        div.style.height = `${elData.h}px`;
        div.style.transform = `rotate(${elData.rot}deg)`;
    }

    updateSelectionDOM() {
        document.querySelectorAll('.placed-element').forEach(el => el.classList.remove('selected', 'multi-selected'));
        const activeIds = this.state.selectedIds || [];
        activeIds.forEach(id => {
            const div = document.getElementById(id);
            if (div) {
                div.classList.add(activeIds.length > 1 ? 'multi-selected' : 'selected');
            }
        });
    }

    removeElementDOM(id) {
        const div = document.getElementById(id);
        if (div) div.remove();
    }

    bindGlobalDragAndRotate() {
        const handleMove = (clientX, clientY) => {
            if (this.draggingElement) {
                const rect = this.wrapper.getBoundingClientRect();
                const x = (clientX - rect.left) / this.state.scale;
                const y = (clientY - rect.top) / this.state.scale;
                
                this.draggingElement.offsets.forEach(off => {
                    this.state.updateElement(off.id, {
                        x: Math.round(x - off.offsetX),
                        y: Math.round(y - off.offsetY)
                    });
                });
            } else if (this.rotatingElement) {
                const elData = this.state.elements.find(el => el.id === this.rotatingElement.id);
                if (elData) {
                    const rect = this.wrapper.getBoundingClientRect();
                    const centerX = (rect.left + elData.x * this.state.scale) + (elData.w * this.state.scale / 2);
                    const centerY = (rect.top + elData.y * this.state.scale) + (elData.h * this.state.scale / 2);
                    const angle = Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI;
                    const rot = Math.round(angle + 90);
                    
                    // If element belongs to multi-selection/group, rotate all relative to group center or individually
                    if (this.state.selectedIds.includes(elData.id) && this.state.selectedIds.length > 1) {
                        this.state.selectedIds.forEach(sId => {
                            this.state.updateElement(sId, { rot });
                        });
                    } else {
                        this.state.updateElement(elData.id, { rot });
                    }
                }
            }
        };

        window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
        window.addEventListener('touchmove', (e) => {
            if (this.draggingElement || this.rotatingElement) {
                if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
                e.preventDefault();
            }
        }, { passive: false });

        const endInteraction = () => {
            this.draggingElement = null;
            this.rotatingElement = null;
        };

        window.addEventListener('mouseup', endInteraction);
        window.addEventListener('touchend', endInteraction);
    }
}
