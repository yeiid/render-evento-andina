/**
 * js/core/State.js
 * Central application state manager using the Observer Pattern.
 */
export class State {
    constructor() {
        this.elements = [];
        this.selectedId = null;
        this.selectedIds = [];
        this.groups = [];
        this.prefabs = JSON.parse(localStorage.getItem('andina_prefabs') || '[]');
        this.scale = 1;
        this.pointX = 0;
        this.pointY = 0;
        this.mapWidth = 1920;
        this.mapHeight = 1080;
        this.idCounter = 0;
        this.groupCounter = 0;
        this.listeners = [];
    }

    setMapDimensions(width, height) {
        if (!width || !height) return;

        const oldW = this.mapWidth;
        const oldH = this.mapHeight;

        if (oldW !== width || oldH !== height) {
            if (this.elements.length > 0 && oldW > 0 && oldH > 0 && (oldW !== 1920 || oldH !== 1080)) {
                const scaleX = width / oldW;
                const scaleY = height / oldH;
                this.elements.forEach(el => {
                    el.x = Math.round(el.x * scaleX);
                    el.y = Math.round(el.y * scaleY);
                });
            }

            this.mapWidth = width;
            this.mapHeight = height;
            this.notify('mapDimensionsChanged', { width, height });
            if (this.elements.length > 0) {
                this.notify('elementsReset', this.elements);
            }
        }
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify(event, data) {
        this.listeners.forEach(l => l(event, data));
    }

    addElement(elData) {
        this.elements.push(elData);
        this.notify('elementAdded', elData);
        this.selectElement(elData.id);
    }

    duplicateElement(id) {
        const source = this.elements.find(el => el.id === id);
        if (!source) return null;

        const newEl = {
            ...source,
            id: this.getNextId(),
            x: source.x + 25,
            y: source.y + 25
        };

        this.addElement(newEl);
        return newEl;
    }

    removeElement(id) {
        // If part of a group, remove from group too
        this.groups.forEach(g => {
            g.elementIds = g.elementIds.filter(eId => eId !== id);
        });
        this.groups = this.groups.filter(g => g.elementIds.length > 1);

        this.elements = this.elements.filter(el => el.id !== id);
        this.selectedIds = this.selectedIds.filter(sId => sId !== id);
        if (this.selectedId === id) {
            this.selectedId = this.selectedIds.length > 0 ? this.selectedIds[0] : null;
        }
        this.notify('elementRemoved', id);
        this.notify('selectionChanged', this.selectedId);
    }

    selectElement(id, multi = false) {
        if (!id) {
            this.selectedId = null;
            this.selectedIds = [];
        } else if (multi) {
            if (this.selectedIds.includes(id)) {
                this.selectedIds = this.selectedIds.filter(sId => sId !== id);
            } else {
                this.selectedIds.push(id);
            }
            this.selectedId = this.selectedIds.length > 0 ? this.selectedIds[this.selectedIds.length - 1] : null;
        } else {
            // Check if element belongs to a group, select whole group if so
            const group = this.groups.find(g => g.elementIds.includes(id));
            if (group) {
                this.selectedIds = [...group.elementIds];
                this.selectedId = id;
            } else {
                this.selectedId = id;
                this.selectedIds = [id];
            }
        }
        this.notify('selectionChanged', this.selectedId);
    }

    selectMultiple(ids) {
        this.selectedIds = Array.from(new Set(ids));
        this.selectedId = this.selectedIds.length > 0 ? this.selectedIds[0] : null;
        this.notify('selectionChanged', this.selectedId);
    }

    updateElement(id, changes) {
        const el = this.elements.find(item => item.id === id);
        if (el) {
            Object.assign(el, changes);
            this.notify('elementUpdated', el);
        }
    }

    groupSelectedElements() {
        if (this.selectedIds.length < 2) return null;

        const groupId = `grp_${this.groupCounter++}`;
        const newGroup = {
            id: groupId,
            name: `Grupo ${this.groupCounter}`,
            elementIds: [...this.selectedIds]
        };

        // Remove elements from any existing groups first
        this.groups.forEach(g => {
            g.elementIds = g.elementIds.filter(eId => !this.selectedIds.includes(eId));
        });
        this.groups = this.groups.filter(g => g.elementIds.length > 1);

        this.groups.push(newGroup);
        this.notify('groupCreated', newGroup);
        this.notify('selectionChanged', this.selectedId);
        return newGroup;
    }

    ungroupSelectedElements() {
        if (this.selectedIds.length === 0) return;

        const targetGroupIds = new Set();
        this.groups.forEach(g => {
            if (g.elementIds.some(id => this.selectedIds.includes(id))) {
                targetGroupIds.add(g.id);
            }
        });

        this.groups = this.groups.filter(g => !targetGroupIds.has(g.id));
        this.notify('groupDissolved', Array.from(targetGroupIds));
        this.notify('selectionChanged', this.selectedId);
    }

    saveSelectionAsPrefab(name = 'Nuevo Conjunto') {
        if (this.selectedIds.length === 0) return null;

        const selectedElements = this.elements.filter(el => this.selectedIds.includes(el.id));
        if (selectedElements.length === 0) return null;

        // Calculate bounding center of selected elements
        const minX = Math.min(...selectedElements.map(el => el.x));
        const minY = Math.min(...selectedElements.map(el => el.y));
        const maxX = Math.max(...selectedElements.map(el => el.x + el.w));
        const maxY = Math.max(...selectedElements.map(el => el.y + el.h));
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const items = selectedElements.map(el => ({
            type: el.type,
            brand: el.brand || 'andina',
            relX: el.x - centerX,
            relY: el.y - centerY,
            w: el.w,
            h: el.h,
            rot: el.rot || 0
        }));

        const prefab = {
            id: `prefab_${Date.now()}`,
            name,
            itemCount: items.length,
            items
        };

        this.prefabs.push(prefab);
        localStorage.setItem('andina_prefabs', JSON.stringify(this.prefabs));
        this.notify('prefabSaved', prefab);
        return prefab;
    }

    instantiatePrefab(prefabId, targetCenterX, targetCenterY) {
        const prefab = this.prefabs.find(p => p.id === prefabId);
        if (!prefab) return [];

        const spawnedIds = [];
        prefab.items.forEach(item => {
            const elData = {
                id: this.getNextId(),
                type: item.type,
                brand: item.brand || 'andina',
                x: targetCenterX + item.relX,
                y: targetCenterY + item.relY,
                w: item.w,
                h: item.h,
                rot: item.rot || 0
            };
            this.elements.push(elData);
            spawnedIds.push(elData.id);
            this.notify('elementAdded', elData);
        });

        // Automatically group spawned prefab items
        if (spawnedIds.length > 1) {
            this.selectedIds = [...spawnedIds];
            this.groupSelectedElements();
        } else if (spawnedIds.length === 1) {
            this.selectElement(spawnedIds[0]);
        }

        return spawnedIds;
    }

    clearAll() {
        this.elements = [];
        this.groups = [];
        this.selectedId = null;
        this.selectedIds = [];
        this.idCounter = 0;
        this.groupCounter = 0;
        this.notify('cleared');
    }

    setElements(elementsList, groupsList = []) {
        this.elements = elementsList;
        this.groups = groupsList;
        this.selectedId = null;
        this.selectedIds = [];
        
        let maxId = 0;
        elementsList.forEach(el => {
            const num = parseInt(el.id.replace('el_', ''), 10);
            if (!isNaN(num) && num >= maxId) maxId = num + 1;
        });
        this.idCounter = maxId;
        
        this.notify('elementsReset', this.elements);
    }

    getNextId() {
        return 'el_' + this.idCounter++;
    }
}
