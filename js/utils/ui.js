/**
 * js/utils/ui.js
 * Helper utilities for UI notifications and interactions.
 */
export function showNotification(msg) {
    const noti = document.getElementById('notification');
    if (!noti) return;
    noti.innerText = msg;
    noti.classList.add('show');
    setTimeout(() => noti.classList.remove('show'), 3000);
}
