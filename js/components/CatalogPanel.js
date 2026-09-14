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
        this.state.subscribe((event) => {
            if (event === 'prefabSaved') {
                this.renderTabs();
                if (this.activeCategory === 'prefabs') this.renderCategoryItems();
            }
        });

        this.renderTabs();
    }

    renderTabs() {
        let tabsNav = document.querySelector('.catalog-tabs-nav');
        if (!tabsNav) {
            tabsNav = document.createElement('nav');
            tabsNav.className = 'catalog-tabs-nav';
            this.sidebarHeader.after(tabsNav);
        }
        tabsNav.innerHTML = '';

        const allCategories = [...CATALOG_CATEGORIES, { id: 'prefabs', name: 'Conjuntos ⭐' }];

        allCategories.forEach(cat => {
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

        if (this.activeCategory === 'prefabs') {
            this.renderPrefabsCategory();
            return;
        }

        const currentCategory = CATALOG_CATEGORIES.find(c => c.id === this.activeCategory);
        if (!currentCategory) return;

        currentCategory.sections.forEach(section => {
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

    renderPrefabsCategory() {
        const defaultPrefabs = [
            {
                id: 'prefab_default_bar_andina',
                name: 'Módulo Bar + Vallas',
                itemCount: 3,
                items: [
                    { type: 'bar_andina', brand: 'andina', relX: 0, relY: 0, w: 60, h: 25, rot: 0 },
                    { type: 'barrier_andina', brand: 'andina', relX: -45, relY: 0, w: 40, h: 10, rot: 0 },
                    { type: 'barrier_andina', brand: 'andina', relX: 45, relY: 0, w: 40, h: 10, rot: 0 }
                ]
            },
            {
                id: 'prefab_default_pagoda_island',
                name: 'Isla Pagoda Doble VIP',
                itemCount: 3,
                items: [
                    { type: 'tent_pagoda_4x8', brand: 'andina', relX: 0, relY: 0, w: 48, h: 96, rot: 0 },
                    { type: 'person_vip', brand: 'heineken', relX: -35, relY: 20, w: 20, h: 20, rot: 0 },
                    { type: 'person_staff', brand: 'andina', relX: 35, relY: 20, w: 20, h: 20, rot: 0 }
                ]
            },
            {
                id: 'prefab_default_barriers_line',
                name: 'Filtro de Vallas (Línea)',
                itemCount: 3,
                items: [
                    { type: 'barrier_andina', brand: 'andina', relX: -42, relY: 0, w: 40, h: 10, rot: 0 },
                    { type: 'barrier_andina', brand: 'andina', relX: 0, relY: 0, w: 40, h: 10, rot: 0 },
                    { type: 'barrier_andina', brand: 'andina', relX: 42, relY: 0, w: 40, h: 10, rot: 0 }
                ]
            }
        ];

        const userPrefabs = this.state.prefabs || [];
        const allPrefabs = [...defaultPrefabs, ...userPrefabs];

        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'catalog-section-title';
        sectionHeader.innerText = 'Conjuntos Premontados & Guardados';
        this.itemListContainer.appendChild(sectionHeader);

        const gridContainer = document.createElement('div');
        gridContainer.className = 'catalog-section-grid';

        allPrefabs.forEach(prefab => {
            const card = document.createElement('div');
            card.className = 'catalog-item brand-andina prefab-card';

            const preview = document.createElement('div');
            preview.className = 'preview-tent preview-pagoda';
            preview.innerText = '📦';

            const span = document.createElement('span');
            span.innerText = `${prefab.name} (${prefab.itemCount} items)`;

            card.appendChild(preview);
            card.appendChild(span);

            card.addEventListener('click', () => {
                const center = this.workspaceComponent.getViewportCenterCoordinates();
                
                if (prefab.id.startsWith('prefab_default_')) {
                    // Instantiate default prefab directly
                    const spawned = [];
                    prefab.items.forEach(item => {
                        const elData = {
                            id: this.state.getNextId(),
                            type: item.type,
                            brand: item.brand || 'andina',
                            x: center.x + item.relX,
                            y: center.y + item.relY,
                            w: item.w,
                            h: item.h,
                            rot: item.rot || 0
                        };
                        this.state.elements.push(elData);
                        spawned.push(elData.id);
                        this.state.notify('elementAdded', elData);
                    });
                    if (spawned.length > 1) {
                        this.state.selectedIds = [...spawned];
                        this.state.groupSelectedElements();
                    }
                } else {
                    this.state.instantiatePrefab(prefab.id, center.x, center.y);
                }
                showNotification(`Insertado: ${prefab.name}`);
            });

            gridContainer.appendChild(card);
        });

        this.itemListContainer.appendChild(gridContainer);
    }
}
