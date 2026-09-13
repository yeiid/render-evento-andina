/**
 * js/components/CatalogPanel.js
 * Controls the structured catalog sidebar with category tabs (Carpas, Barras, Vallas)
 * and sub-sections for items.
 */
import { CATALOG_CATEGORIES } from '../data/catalogItems.js';
import { showNotification } from '../utils/ui.js';

export class CatalogPanel {
    constructor(state, workspaceComponent) {
        this.state = state;
        this.workspaceComponent = workspaceComponent;
        this.sidebarHeader = document.querySelector('.sidebar-header');
        this.itemListContainer = document.querySelector('.item-list');
        this.activeCategory = 'tents';

        this.init();
    }

    init() {
        if (!this.itemListContainer || !this.sidebarHeader) return;

        let tabsNav = document.querySelector('.catalog-tabs-nav');
        if (!tabsNav) {
            tabsNav = document.createElement('nav');
            tabsNav.className = 'catalog-tabs-nav';
            this.sidebarHeader.after(tabsNav);
        }
        tabsNav.innerHTML = '';

        CATALOG_CATEGORIES.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `btn-tab ${cat.id === this.activeCategory ? 'active' : ''}`;
            btn.innerText = cat.name;
            btn.addEventListener('click', () => {
                this.activeCategory = cat.id;
                document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderCategoryItems();
            });
            tabsNav.appendChild(btn);
        });

        this.renderCategoryItems();
    }

    renderCategoryItems() {
        this.itemListContainer.innerHTML = '';
        const currentCategory = CATALOG_CATEGORIES.find(c => c.id === this.activeCategory);
        if (!currentCategory) return;

        currentCategory.sections.forEach(section => {
            // Render section header
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'catalog-section-title';
            sectionHeader.innerText = section.title;
            this.itemListContainer.appendChild(sectionHeader);

            const gridContainer = document.createElement('div');
            gridContainer.className = 'catalog-section-grid';

            section.items.forEach(item => {
                const card = document.createElement('div');
                card.className = `catalog-item brand-${item.brand || 'andina'}`;
                card.setAttribute('data-type', item.type);

                const preview = document.createElement('div');
                preview.className = item.previewClass;
                if (item.text) preview.innerText = item.text;

                const span = document.createElement('span');
                span.innerText = item.label;

                card.appendChild(preview);
                card.appendChild(span);

                card.addEventListener('click', () => {
                    const center = this.workspaceComponent.getViewportCenterCoordinates();
                    
                    const elData = {
                        id: this.state.getNextId(),
                        type: item.type,
                        brand: item.brand || 'andina',
                        x: center.x - item.defaultWidth / 2,
                        y: center.y - item.defaultHeight / 2,
                        w: item.defaultWidth,
                        h: item.defaultHeight,
                        rot: 0
                    };

                    this.state.addElement(elData);
                    showNotification(`Añadido: ${item.label}`);
                });

                gridContainer.appendChild(card);
            });

            this.itemListContainer.appendChild(gridContainer);
        });
    }
}
