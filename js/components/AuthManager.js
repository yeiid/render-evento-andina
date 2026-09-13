/**
 * js/components/AuthManager.js
 * Handles frontend user authentication, Login/Register modal, and session token storage.
 */
import { showNotification } from '../utils/ui.js';

export class AuthManager {
    constructor(state) {
        this.state = state;
        this.user = JSON.parse(localStorage.getItem('andina_user') || 'null');
        this.token = localStorage.getItem('andina_token') || null;

        this.authModal = document.getElementById('authModal');
        this.btnOpenLogin = document.getElementById('btnOpenLogin');
        this.btnCloseAuth = document.getElementById('btnCloseAuth');
        this.authForm = document.getElementById('authForm');
        this.inpUsername = document.getElementById('inpUsername');
        this.inpPassword = document.getElementById('inpPassword');
        this.userBadge = document.getElementById('userBadge');
        this.btnCloudSave = document.getElementById('btnCloudSave');

        this.init();
    }

    init() {
        this.updateUserUI();

        if (this.btnOpenLogin) {
            this.btnOpenLogin.addEventListener('click', () => this.openModal());
        }

        if (this.btnCloseAuth) {
            this.btnCloseAuth.addEventListener('click', () => this.closeModal());
        }

        if (this.authForm) {
            this.authForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (this.btnCloudSave) {
            this.btnCloudSave.addEventListener('click', () => this.saveToCloud());
        }
    }

    openModal() {
        if (this.authModal) this.authModal.classList.add('active');
    }

    closeModal() {
        if (this.authModal) this.authModal.classList.remove('active');
    }

    updateUserUI() {
        if (this.userBadge) {
            if (this.user) {
                this.userBadge.innerText = `👤 ${this.user.name || this.user.username}`;
                this.userBadge.classList.add('logged-in');
            } else {
                this.userBadge.innerText = '🔑 Iniciar Sesión';
                this.userBadge.classList.remove('logged-in');
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = this.inpUsername.value.trim();
        const password = this.inpPassword.value;

        if (!username || !password) {
            showNotification('Ingresa usuario y contraseña');
            return;
        }

        const API_BASE = window.location.port === '5173' ? 'http://localhost:3001' : '';

        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok && data.token) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('andina_token', this.token);
                localStorage.setItem('andina_user', JSON.stringify(this.user));
                this.updateUserUI();
                this.closeModal();
                showNotification(`¡Bienvenido, ${this.user.name || this.user.username}!`);
            } else {
                showNotification(data.error || 'Error al iniciar sesión');
            }
        } catch {
            showNotification('No se pudo conectar con el servidor backend (Modo Local)');
        }
    }

    async saveToCloud() {
        if (!this.token) {
            this.openModal();
            showNotification('Inicia sesión para guardar en la nube');
            return;
        }

        const mapImage = document.getElementById('mapImage');
        const payload = {
            name: `Escenario Andina ${new Date().toLocaleTimeString()}`,
            mapImageSrc: mapImage.src.startsWith('data:') ? mapImage.src : 'imagen1.png',
            elements: this.state.elements
        };

        const API_BASE = window.location.port === '5173' ? 'http://localhost:3001' : '';

        try {
            const res = await fetch(`${API_BASE}/api/scenes`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showNotification('☁️ Escenario guardado en la nube');
            } else {
                showNotification('Error al guardar en la nube');
            }
        } catch {
            showNotification('Backend no disponible. Guardando localmente...');
        }
    }
}
