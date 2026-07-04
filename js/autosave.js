// js/autosave.js

window.autosaveTimeout = null;

window.triggerAutosave = function() {
    const badge = document.getElementById('autosaveStatus');
    if (badge) {
        badge.textContent = 'Saving...';
        badge.style.color = '#64748b'; // Slate-500
    }

    clearTimeout(window.autosaveTimeout);
    window.autosaveTimeout = setTimeout(() => {
        window.saveState();
        if (badge) {
            badge.textContent = 'Saved';
            badge.style.color = '#10b981'; // Emerald-500
        }
    }, 1200);
};
