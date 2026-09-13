/**
 * js/core/State.js
 * Central application state manager using the Observer Pattern.
 */
export class State {
    constructor() {
        this.elements = [];
        this.selectedId = null;
        this.scale = 1;
        this.pointX = 0;
        this.pointY = 0;
        this.mapWidth = 1920;
        this.mapHeight = 1080;
        this.idCounter = 0;
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
        if (!source) return;

        const newEl = {
            ...source,
            id: this.getNextId(),
            x: source.x + 20,
            y: source.y + 20
        };

        this.addElement(newEl);
    }

    removeElement(id) {
        this.elements = this.elements.filter(el => el.id !== id);
        if (this.selectedId === id) {
            this.selectElement(null);
        }
        this.notify('elementRemoved', id);
    }

    selectElement(id) {
        this.selectedId = id;
        this.notify('selectionChanged', id);
    }

    updateElement(id, changes) {
        const el = this.elements.find(item => item.id === id);
        if (el) {
            Object.assign(el, changes);
            this.notify('elementUpdated', el);
        }
    }

    clearAll() {
        this.elements = [];
        this.selectedId = null;
        this.idCounter = 0;
        this.notify('cleared');
    }

    setElements(elementsList) {
        this.elements = elementsList;
        this.selectedId = null;
        
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
