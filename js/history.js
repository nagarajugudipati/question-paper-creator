// js/history.js

window.historyStack = [];
window.historyIndex = -1;

window.saveHistoryState = function() {
    const paper = window.state.papers.find(p => p.id === window.state.activePaperId);
    if (!paper) return;

    // Prune redo states if we were in the middle of undoing
    if (window.historyIndex < window.historyStack.length - 1) {
        window.historyStack = window.historyStack.slice(0, window.historyIndex + 1);
    }

    const stateStr = JSON.stringify(paper);
    
    // Prevent pushing duplicate consecutive states (e.g. on blur after type)
    if (window.historyStack.length > 0 && window.historyStack[window.historyIndex] === stateStr) {
        return;
    }

    window.historyStack.push(stateStr);
    if (window.historyStack.length > 50) {
        window.historyStack.shift();
    }
    window.historyIndex = window.historyStack.length - 1;
    window.updateHistoryButtons();
};

window.undo = function() {
    if (window.historyIndex > 0) {
        window.historyIndex--;
        window.restoreHistoryState();
    } else {
        window.toast('⚠️ Nothing to Undo');
    }
};

window.redo = function() {
    if (window.historyIndex < window.historyStack.length - 1) {
        window.historyIndex++;
        window.restoreHistoryState();
    } else {
        window.toast('⚠️ Nothing to Redo');
    }
};

window.restoreHistoryState = function() {
    const raw = window.historyStack[window.historyIndex];
    if (!raw) return;
    const paper = JSON.parse(raw);

    const idx = window.state.papers.findIndex(p => p.id === window.state.activePaperId);
    if (idx !== -1) {
        window.state.papers[idx] = paper;
    }
    
    // Render using skipHistory = true to prevent infinite loop
    window.render(true);
    window.updateHistoryButtons();
};

window.updateHistoryButtons = function() {
    const btnUndo = document.getElementById('btnUndo');
    const btnRedo = document.getElementById('btnRedo');
    if (btnUndo) btnUndo.disabled = (window.historyIndex <= 0);
    if (btnRedo) btnRedo.disabled = (window.historyIndex >= window.historyStack.length - 1);
};

// Hook shortcuts globally
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        window.undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        window.redo();
    }
});
