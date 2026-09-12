# Render Evento Andina - Three.js

Sistema de renderizado 3D para visualización de eventos con cámara interactiva.

## Estructura del Proyecto

```
render-evento/
├── index.html          # Página principal con UI
└── js/
    └── main.js         # Lógica de render Three.js
```

## Características

- **5 modos de cámara:**
  1. Orbita libre (control manual con mouse)
  2. Cinemático (movimiento orbital automático)
  3. Escenario (vista frontal del escenario)
  4. Aéreo (vista cenital)
  5. Cercano (vista detallada del escenario)

- **Elementos 3D:**
  - Escenario principal con podio y micrófonos
  - Bandas circulares de asientos con iluminación
  - Torres de luz decorativas en las esquinas
  - Spotlights con efecto de parpadeo
  - Reflectores giratorios
  - Líneas decorativas en el suelo

- **Controles:**
  - Mouse: rotar, zoom, pan (modo orbita)
  - Teclado: 1-5 para cambiar modo, R para resetear
  - Botones UI para cambiar vista

## Uso

Abrir `index.html` en un navegador moderno con soporte WebGL:

```bash
# Con servidor local (recomendado)
cd render-evento
python3 -m http.server 8000
# Abrir http://localhost:8000

# O directamente (puede haber issues con CORS)
open render-evento/index.html
```

## Atajos de Teclado

| Tecla | Acción |
|-------|--------|
| 1 | Modo Orbita libre |
| 2 | Modo Cinemático |
| 3 | Vista Escenario |
| 4 | Vista Aérea |
| 5 | Vista Cercana |
| R | Reiniciar cámara |

## Tecnologías

- Three.js r160 (via CDN)
- WebGL
- OrbitControls para navegación

## Personalización

El sistema se puede extender modificando `js/main.js`:

- `createStage()` - Personalizar escenario
- `createSeating()` - Modificar disposición de asientos
- `createDecorations()` - Añadir elementos decorativos
- `setupModes()` - Agregar nuevos modos de cámara
