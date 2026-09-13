/**
 * js/app.js
 * Main entry point for S.W.A.T. x Andina Light Mobile Editor & 3D Real-time Visualizer.
 * Instantiates application state and binds UI components.
 */
import { State } from './core/State.js';
import { CanvasWorkspace } from './components/CanvasWorkspace.js';
import { ElementManager } from './components/ElementManager.js';
import { PropertyPanel } from './components/PropertyPanel.js';
import { CatalogPanel } from './components/CatalogPanel.js';
import { StorageManager } from './components/StorageManager.js';
import { AuthManager } from './components/AuthManager.js';
import { ThreeSceneViewer } from './components/ThreeSceneViewer.js';

document.addEventListener('DOMContentLoaded', () => {
    // Instantiate central state
    const state = new State();

    // Instantiate UI components
    const workspace = new CanvasWorkspace(state);
    const elementManager = new ElementManager(state, workspace);
    const propertyPanel = new PropertyPanel(state);
    const catalogPanel = new CatalogPanel(state, workspace);
    const storageManager = new StorageManager(state, workspace);
    const authManager = new AuthManager(state);
    const threeViewer = new ThreeSceneViewer(state);

    console.log('S.W.A.T. x Andina Light - Editor de Escenarios 2D y Visualizador 3D inicializado correctamente.');
});
