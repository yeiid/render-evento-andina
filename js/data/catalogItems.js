/**
 * js/data/catalogItems.js
 * Catalog definitions with calibrated real-world map scale dimensions.
 */
export const CATALOG_CATEGORIES = [
    {
        id: 'tents',
        name: 'Carpas',
        sections: [
            {
                title: 'Carpas Piramidales',
                items: [
                    {
                        type: 'tent_3x3',
                        label: 'Carpa 3x3m',
                        brand: 'andina',
                        defaultWidth: 36,
                        defaultHeight: 36,
                        previewClass: 'preview-tent',
                        text: '3x3'
                    },
                    {
                        type: 'tent_4x4',
                        label: 'Carpa 4x4m',
                        brand: 'andina',
                        defaultWidth: 48,
                        defaultHeight: 48,
                        previewClass: 'preview-tent',
                        text: '4x4'
                    },
                    {
                        type: 'tent_4x6',
                        label: 'Carpa 4x6m',
                        brand: 'andina',
                        defaultWidth: 48,
                        defaultHeight: 72,
                        previewClass: 'preview-tent preview-tent-rect',
                        text: '4x6'
                    },
                    {
                        type: 'tent_4x8',
                        label: 'Carpa 4x8m',
                        brand: 'andina',
                        defaultWidth: 48,
                        defaultHeight: 96,
                        previewClass: 'preview-tent preview-tent-large',
                        text: '4x8'
                    }
                ]
            },
            {
                title: 'Carpas Pagoda',
                items: [
                    {
                        type: 'tent_pagoda',
                        label: 'Pagoda 4x4m',
                        brand: 'andina',
                        defaultWidth: 48,
                        defaultHeight: 48,
                        previewClass: 'preview-tent preview-pagoda',
                        text: 'PAGODA'
                    },
                    {
                        type: 'tent_pagoda_4x8',
                        label: 'Pagoda Doble 4x8m',
                        brand: 'andina',
                        defaultWidth: 48,
                        defaultHeight: 96,
                        previewClass: 'preview-tent preview-pagoda preview-tent-large',
                        text: 'PAGODA 4x8'
                    }
                ]
            }
        ]
    },
    {
        id: 'bars',
        name: 'Barras',
        sections: [
            {
                title: 'Barras por Marca',
                items: [
                    {
                        type: 'bar_andina',
                        label: 'Barra Andina',
                        brand: 'andina',
                        defaultWidth: 60,
                        defaultHeight: 25,
                        previewClass: 'preview-bar preview-bar-andina',
                        text: 'ANDINA'
                    },
                    {
                        type: 'bar_heineken',
                        label: 'Barra Heineken',
                        brand: 'heineken',
                        defaultWidth: 60,
                        defaultHeight: 25,
                        previewClass: 'preview-bar preview-bar-heineken',
                        text: 'HEINEKEN'
                    },
                    {
                        type: 'bar_tecate',
                        label: 'Barra Tecate',
                        brand: 'tecate',
                        defaultWidth: 60,
                        defaultHeight: 25,
                        previewClass: 'preview-bar preview-bar-tecate',
                        text: 'TECATE'
                    }
                ]
            }
        ]
    },
    {
        id: 'barriers',
        name: 'Vallas',
        sections: [
            {
                title: 'Vallas de Seguridad (2.5m)',
                items: [
                    {
                        type: 'barrier_andina',
                        label: 'Valla Andina',
                        brand: 'andina',
                        defaultWidth: 40,
                        defaultHeight: 10,
                        previewClass: 'preview-barrier preview-barrier-andina',
                        text: ''
                    },
                    {
                        type: 'barrier_heineken',
                        label: 'Valla Heineken',
                        brand: 'heineken',
                        defaultWidth: 40,
                        defaultHeight: 10,
                        previewClass: 'preview-barrier preview-barrier-heineken',
                        text: ''
                    },
                    {
                        type: 'barrier_tecate',
                        label: 'Valla Tecate',
                        brand: 'tecate',
                        defaultWidth: 40,
                        defaultHeight: 10,
                        previewClass: 'preview-barrier preview-barrier-tecate',
                        text: ''
                    }
                ]
            }
        ]
    },
    {
        id: 'people',
        name: 'Personas',
        sections: [
            {
                title: 'Personal & Público (Escala Humana)',
                items: [
                    {
                        type: 'person_staff',
                        label: 'Staff / Logística',
                        brand: 'andina',
                        defaultWidth: 20,
                        defaultHeight: 20,
                        previewClass: 'preview-person preview-person-staff',
                        text: '👤 STAFF'
                    },
                    {
                        type: 'person_guest',
                        label: 'Asistente / Público',
                        brand: 'tecate',
                        defaultWidth: 20,
                        defaultHeight: 20,
                        previewClass: 'preview-person preview-person-guest',
                        text: '👤 PÚBLICO'
                    },
                    {
                        type: 'person_vip',
                        label: 'VIP / Seguridad',
                        brand: 'heineken',
                        defaultWidth: 20,
                        defaultHeight: 20,
                        previewClass: 'preview-person preview-person-vip',
                        text: '👤 VIP'
                    }
                ]
            }
        ]
    }
];
