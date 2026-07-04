// js/mathEditor.js

window.activeMathField = null;
window.activeEditorElement = null;

window.insertEquationAtCursor = function() {
    const sel = window.getSelection();
    if (!sel.rangeCount || !window.activeEditorElement) {
        window.toast('⚠️ Click inside a question or option text box first');
        return;
    }

    const mf = document.createElement('math-field');
    mf.setAttribute('contenteditable', 'false');
    mf.classList.add('inline-math');
    mf.value = 'x';

    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(mf);

    // Relocate cursor right after visual element
    range.setStartAfter(mf);
    range.setEndAfter(mf);
    sel.removeAllRanges();
    sel.addRange(range);

    // Initialize mathfield listeners
    window.initializeMathFields(window.activeEditorElement);

    // Bubble input events to save to state
    window.activeEditorElement.dispatchEvent(new Event('input', { bubbles: true }));

    // Focus math-field and display built-in keyboard
    setTimeout(() => {
        mf.focus();
    }, 100);
};

window.initializeMathFields = function(container = document) {
    container.querySelectorAll('math-field').forEach(mf => {
        // Set keyboard policy to manual to let us display it on focus in desktop too
        mf.mathVirtualKeyboardPolicy = 'manual';

        if (!mf._initialized) {
            mf._initialized = true;

            // Forward shadow DOM input changes back to contenteditable wrapper
            mf.addEventListener('input', () => {
                const editor = mf.closest('.contenteditable-editor');
                if (editor) {
                    editor.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });

            // Focus triggers
            mf.addEventListener('focusin', (e) => {
                e.stopPropagation();
                window.activeMathField = mf;
                if (window.mathVirtualKeyboard) {
                    window.mathVirtualKeyboard.show();
                }
            });

            mf.addEventListener('focusout', (e) => {
                e.stopPropagation();
                setTimeout(() => {
                    if (document.activeElement.tagName !== 'MATH-FIELD') {
                        if (window.mathVirtualKeyboard) {
                            window.mathVirtualKeyboard.hide();
                        }
                    }
                }, 100);
            });
        }
    });
};

window.formatText = function(command) {
    document.execCommand(command, false, null);
};

// Hook global focus management
document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'MATH-FIELD') {
        window.activeMathField = e.target;
    } else {
        if (!e.target.closest('.symbol-search-wrapper') && !e.target.closest('.symbol-results-panel')) {
            window.activeMathField = null;
        }
    }

    if (e.target.classList && e.target.classList.contains('contenteditable-editor')) {
        window.activeEditorElement = e.target;
    }
});

// Clean browser residual empty tags (like <br>) on blur to restore CSS :empty placeholders
document.addEventListener('focusout', (e) => {
    if (e.target.classList && e.target.classList.contains('contenteditable-editor')) {
        const text = e.target.textContent.trim();
        const hasMath = e.target.querySelector('math-field') !== null;
        const hasImage = e.target.querySelector('img') !== null;
        if (!text && !hasMath && !hasImage) {
            e.target.innerHTML = '';
        }
    }
});

// Configure MathLive keyboard global options
document.addEventListener('DOMContentLoaded', () => {
    if (window.mathVirtualKeyboard) {
        window.mathVirtualKeyboard.layouts = ["numeric", "symbols", "alphabetic", "greek"];
    }
});
