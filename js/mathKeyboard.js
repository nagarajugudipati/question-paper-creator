// js/mathKeyboard.js

window.SYMBOLS_POOL = [
    { label: '√□', latex: '\\sqrt{#?}', unicode: '√', keywords: ['root', 'square root', 'sqrt', 'radical'] },
    { label: '∛□', latex: '\\sqrt[3]{#?}', unicode: '∛', keywords: ['cube root', 'root', 'cbrt'] },
    { label: '□/□', latex: '\\frac{#?}{#?}', unicode: '÷', keywords: ['fraction', 'divide', 'frac', 'over', 'slash'] },
    { label: 'Mixed Fraction', latex: '{#?}\\frac{#?}{#?}', unicode: '½', keywords: ['fraction', 'mixed fraction', 'half'] },
    { label: '□²', latex: '{#?}^2', unicode: '²', keywords: ['power', 'square', 'exponent', 'superscript'] },
    { label: '□³', latex: '{#?}^3', unicode: '³', keywords: ['power', 'cube', 'exponent', 'superscript'] },
    { label: '□ⁿ', latex: '{#?}^{#?}', unicode: '^', keywords: ['power', 'exponent', 'superscript', 'pow'] },
    { label: '□ₙ', latex: '{#?}_{#?}', unicode: '_', keywords: ['subscript', 'sub', 'index'] },
    { label: 'π', latex: '\\pi', unicode: 'π', keywords: ['pi', 'greek', 'circle', 'constant'] },
    { label: 'θ', latex: '\\theta', unicode: 'θ', keywords: ['theta', 'angle', 'greek', 'trig'] },
    { label: 'α', latex: '\\alpha', unicode: 'α', keywords: ['alpha', 'greek'] },
    { label: 'β', latex: '\\beta', unicode: 'β', keywords: ['beta', 'greek'] },
    { label: '∠', latex: '\\angle', unicode: '∠', keywords: ['angle', 'geometry', 'corner'] },
    { label: '°', latex: '^{\\circ}', unicode: '°', keywords: ['degree', 'angle', 'deg', 'temperature'] },
    { label: '×', latex: '\\times', unicode: '×', keywords: ['multiply', 'times', 'star', 'cross'] },
    { label: '÷', latex: '\\div', unicode: '÷', keywords: ['divide', 'div', 'slash'] },
    { label: 'log(□)', latex: '\\log({#?})', unicode: 'log', keywords: ['log', 'logarithm'] },
    { label: 'ln(□)', latex: '\\ln({#?})', unicode: 'ln', keywords: ['ln', 'natural logarithm', 'log'] },
    { label: 'sin(□)', latex: '\\sin({#?})', unicode: 'sin', keywords: ['sin', 'sine', 'trigonometry', 'trig'] },
    { label: 'cos(□)', latex: '\\cos({#?})', unicode: 'cos', keywords: ['cos', 'cosine', 'trigonometry', 'trig'] },
    { label: 'tan(□)', latex: '\\tan({#?})', unicode: 'tan', keywords: ['tan', 'tangent', 'trigonometry', 'trig'] },
    { label: '△', latex: '\\triangle', unicode: '△', keywords: ['triangle', 'delta', 'geometry'] },
    { label: '○', latex: '\\bigcirc', unicode: '○', keywords: ['circle', 'ring', 'geometry'] },
    { label: '±', latex: '\\pm', unicode: '±', keywords: ['plus minus', 'pm'] },
    { label: '≠', latex: '\\neq', unicode: '≠', keywords: ['not equal', 'neq'] },
    { label: '≤', latex: '\\le', unicode: '≤', keywords: ['less equal', 'le'] },
    { label: '≥', latex: '\\ge', unicode: '≥', keywords: ['greater equal', 'ge'] },
    { label: 'Σ', latex: '\\sum_{#?}^{#?}', unicode: 'Σ', keywords: ['sum', 'sigma', 'summation'] },
    { label: '∞', latex: '\\infty', unicode: '∞', keywords: ['infinity', 'inf'] }
];

window.initializeSymbolSearch = function() {
    const input = document.getElementById('kbdSymbolSearch');
    if (input) {
        input.addEventListener('input', (e) => {
            window.renderSymbolSearchResults(e.target.value);
        });
    }
    window.renderSymbolSearchResults('');
};

window.renderSymbolSearchResults = function(query) {
    const panel = document.getElementById('symbolSearchPanel');
    if (!panel) return;

    const trimmed = query.trim().toLowerCase();
    let filtered = window.SYMBOLS_POOL;

    if (trimmed) {
        filtered = window.SYMBOLS_POOL.filter(s => {
            return s.label.toLowerCase().includes(trimmed) || 
                   s.keywords.some(k => k.toLowerCase().includes(trimmed));
        });
    }

    if (filtered.length === 0) {
        panel.innerHTML = `<span class="symbol-chip empty-msg">No symbols match "${window.escHtml(query)}"</span>`;
        return;
    }

    let html = '';
    filtered.forEach(s => {
        html += `
            <button class="symbol-chip" onmousedown="event.preventDefault(); window.insertSearchSymbol('${s.latex}', '${s.unicode}')">
                ${s.label}
            </button>
        `;
    });
    panel.innerHTML = html;
};

window.insertSearchSymbol = function(latex, unicode) {
    if (window.activeMathField) {
        // If a Mathfield is currently focused, insert the LaTeX representation directly
        window.activeMathField.insert(latex, { focus: true });
        window.activeMathField.focus();
        
        // Trigger save state
        const editor = window.activeMathField.closest('.contenteditable-editor');
        if (editor) {
            editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } else if (window.activeEditorElement) {
        // If editing standard contenteditable text, insert Unicode or complex Mathfield at selection
        const sel = window.getSelection();
        if (sel.rangeCount) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            
            // Check if latex contains complex layout parameters (like backslashes, scripts)
            if (latex.includes('\\') || latex.includes('^') || latex.includes('_')) {
                const mf = document.createElement('math-field');
                mf.setAttribute('contenteditable', 'false');
                mf.classList.add('inline-math');
                mf.value = latex;
                
                range.insertNode(mf);
                
                // Initialize mathfield listeners
                window.initializeMathFields(window.activeEditorElement);
                
                range.setStartAfter(mf);
                range.setEndAfter(mf);
                
                setTimeout(() => {
                    mf.focus();
                }, 100);
            } else {
                // For simple symbols, just insert the Unicode character
                const node = document.createTextNode(unicode);
                range.insertNode(node);
                range.setStartAfter(node);
                range.setEndAfter(node);
            }
            
            sel.removeAllRanges();
            sel.addRange(range);
            
            // Dispatch input to sync changes
            window.activeEditorElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } else {
        window.toast('⚠️ Click inside a text box or equation first');
    }
};

// Hook symbol search initializer and advanced keyboard toggles
document.addEventListener('DOMContentLoaded', () => {
    window.initializeSymbolSearch();
    window.renderAdvancedMathDropdown();
    
    // Toggle keyboard panel visibility depending on active mathfield focuses
    document.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'MATH-FIELD') {
            const panel = document.getElementById('math-calculator-panel');
            if (panel) panel.classList.remove('hidden');
        }
    });

    document.addEventListener('focusout', (e) => {
        // Delay action to ensure we don't hide keyboard if user clicked a calculator key
        setTimeout(() => {
            if (document.activeElement.tagName !== 'MATH-FIELD' && 
                !document.activeElement.closest('.math-calculator-panel')) {
                const panel = document.getElementById('math-calculator-panel');
                if (panel) panel.classList.add('hidden');
            }
        }, 120);
    });
});

window.insertCalcVal = function(val) {
    if (window.activeMathField) {
        window.activeMathField.insert(val, { focus: true });
        window.activeMathField.focus();
        
        // Trigger save state
        const editor = window.activeMathField.closest('.contenteditable-editor');
        if (editor) {
            editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } else {
        window.toast('⚠️ Click inside an equation box first');
    }
};

window.toggleAdvancedMathDropdown = function(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('math-advanced-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
        
        // Close dropdown when clicking outside
        const closeDropdown = (event) => {
            if (!dropdown.contains(event.target) && event.target !== e.target) {
                dropdown.classList.add('hidden');
                document.removeEventListener('click', closeDropdown);
            }
        };
        if (!dropdown.classList.contains('hidden')) {
            document.addEventListener('click', closeDropdown);
        }
    }
};

window.toggleSandboxDropdown = function(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('sandbox-advanced-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
        
        const closeDropdown = (event) => {
            if (!dropdown.contains(event.target) && event.target !== e.target) {
                dropdown.classList.add('hidden');
                document.removeEventListener('click', closeDropdown);
            }
        };
        if (!dropdown.classList.contains('hidden')) {
            document.addEventListener('click', closeDropdown);
        }
    }
};

window.renderAdvancedMathDropdown = function() {
    const ids = ['math-advanced-dropdown', 'sandbox-advanced-dropdown'];
    
    const data = [
        {
            name: 'Basic Math',
            items: [
                { label: 'Fraction', val: '\\frac{#?}{#?}', disp: '¹/₂' },
                { label: 'Square Root', val: '\\sqrt{#?}', disp: '√' },
                { label: 'nth Root', val: '\\sqrt[#?]{#?}', disp: 'ⁿ√' },
                { label: 'Absolute', val: '\\left| #? \\right|', disp: '|x|' },
                { label: 'Power', val: '{#?}^{#?}', disp: 'xⁿ' },
                { label: 'Exponent', val: 'e^{#?}', disp: 'eˣ' },
                { label: 'Log', val: '\\log_{#?}(#?)', disp: 'log' },
                { label: 'Natural Log', val: '\\ln(#?)', disp: 'ln' }
            ]
        },
        {
            name: 'Calculus',
            items: [
                { label: 'Derivative', val: '\\frac{d}{dx}(#?)', disp: 'd/dx' },
                { label: '2nd Deriv', val: '\\frac{d^2}{dx^2}(#?)', disp: 'd²/dx²' },
                { label: 'Integral', val: '\\int_{#?}^{#?} #? \\, dx', disp: '∫' },
                { label: 'Double Int', val: '\\iint_{#?}^{#?} #? \\, dx\\,dy', disp: '∬' },
                { label: 'Limit', val: '\\lim_{#? \\to #?} #?', disp: 'lim' },
                { label: 'Partial', val: '\\frac{\\partial}{\\partial x}(#?)', disp: '∂/∂x' }
            ]
        },
        {
            name: 'Algebra & Matrix',
            items: [
                { label: 'Sigma', val: '\\sum_{#?}^{#?}', disp: 'Σ' },
                { label: 'Product', val: '\\prod_{#?}^{#?}', disp: 'Π' },
                { label: '2x2 Matrix', val: '\\begin{pmatrix} 0 & 0 \\\\ 0 & 0 \\end{pmatrix}', disp: '2×2' },
                { label: '3x3 Matrix', val: '\\begin{pmatrix} 0 & 0 & 0 \\\\ 0 & 0 & 0 \\\\ 0 & 0 & 0 \\end{pmatrix}', disp: '3×3' },
                { label: 'Vector', val: '\\vec{#?}', disp: 'v⃗' },
                { label: 'Binomial', val: '\\binom{#?}{#?}', disp: '(ⁿₖ)' }
            ]
        },
        {
            name: 'Greek Symbols',
            items: [
                { label: 'alpha', val: '\\alpha', disp: 'α' },
                { label: 'beta', val: '\\beta', disp: 'β' },
                { label: 'gamma', val: '\\gamma', disp: 'γ' },
                { label: 'theta', val: '\\theta', disp: 'θ' },
                { label: 'lambda', val: '\\lambda', disp: 'λ' },
                { label: 'pi', val: '\\pi', disp: 'π' },
                { label: 'sigma', val: '\\sigma', disp: 'σ' },
                { label: 'Omega', val: '\\Omega', disp: 'Ω' }
            ]
        },
        {
            name: 'Set & Logic',
            items: [
                { label: 'Element of', val: '\\in', disp: '∈' },
                { label: 'Not in', val: '\\notin', disp: '∉' },
                { label: 'Subset', val: '\\subset', disp: '⊂' },
                { label: 'Union', val: '\\cup', disp: '∪' },
                { label: 'Intersect', val: '\\cap', disp: '∩' },
                { label: 'Empty Set', val: '\\empty', disp: '∅' },
                { label: 'For All', val: '\\forall', disp: '∀' },
                { label: 'Exists', val: '\\exists', disp: '∃' }
            ]
        },
        {
            name: 'Styles & Actions',
            items: [
                { label: 'Bold', val: '\\mathbf{#?}', disp: 'Bold' },
                { label: 'Italic', val: '\\mathit{#?}', disp: 'Ital' },
                { label: 'Size', val: '\\huge{#?}', disp: 'Huge' },
                { label: 'Red Highlight', val: '\\color{red}{#?}', disp: 'Red' }
            ]
        }
    ];

    ids.forEach(id => {
        const dropdown = document.getElementById(id);
        if (!dropdown) return;

        let html = '';
        data.forEach((cat, cIdx) => {
            const isExpanded = cIdx === 0 ? 'expanded' : '';
            const isBodyActive = cIdx === 0 ? 'active' : '';
            html += `
                <div class="dropdown-section">
                    <button class="section-hdr ${isExpanded}" onmousedown="event.preventDefault()" onclick="window.toggleMathSection(event, this)">
                        ${cat.name}
                    </button>
                    <div class="section-body ${isBodyActive}">
            `;
            cat.items.forEach(item => {
                html += `
                    <div class="dropdown-chip" data-latex="${window.escHtml(item.val)}" onmousedown="event.preventDefault()" onclick="window.insertDropdownSymbol(this)">
                        <span class="chip-latex">${item.disp}</span>
                        <span class="chip-lbl">${item.label}</span>
                    </div>
                `;
            });
            html += `
                    </div>
                </div>
            `;
        });
        dropdown.innerHTML = html;
    });
};

window.toggleMathSection = function(e, btn) {
    e.stopPropagation();
    btn.classList.toggle('expanded');
    const body = btn.nextElementSibling;
    if (body) {
        body.classList.toggle('active');
    }
};

window.insertDropdownSymbol = function(btn) {
    const latex = btn.getAttribute('data-latex');
    const isSandboxOpen = !document.getElementById('math-sandbox-modal').classList.contains('hidden');
    const sandboxField = document.getElementById('sandbox-mathfield');
    
    if (isSandboxOpen && sandboxField) {
        try {
            sandboxField.focus();
            if (typeof sandboxField.insert === 'function') {
                sandboxField.insert(latex, { focus: true });
            } else {
                sandboxField.value = sandboxField.value + latex;
            }
            sandboxField.dispatchEvent(new Event('input', { bubbles: true }));
        } catch (e) {
            sandboxField.value = sandboxField.value + latex;
            sandboxField.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } else {
        window.insertSearchSymbol(latex, '');
    }
};

/* ─── Math Editor Sandbox Modal Logic ─── */
window.activeSandboxField = null;
window.sandboxModernBuilt = false;
window.sandboxTarget = null;

window.captureSandboxTarget = function() {
    const target = {
        editor: window.activeEditorElement && document.contains(window.activeEditorElement) ? window.activeEditorElement : null,
        mathField: window.activeMathField && window.activeMathField.id !== 'sandbox-mathfield' && document.contains(window.activeMathField) ? window.activeMathField : null,
        range: null
    };

    const selection = window.getSelection();
    if (target.editor && selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const node = range.commonAncestorContainer;
        const owner = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        if (owner && target.editor.contains(owner)) {
            target.range = range.cloneRange();
        }
    }

    window.sandboxTarget = target;
};

window.buildModernSandboxUI = function() {
    if (window.sandboxModernBuilt) return;

    const shell = document.querySelector('#math-sandbox-modal .math-sandbox-content');
    if (!shell) return;

    shell.innerHTML = `
        <div class="sandbox-header">
            <div>
                <span class="sandbox-kicker">Equation studio</span>
                <h3>Math Sandbox</h3>
            </div>
            <div class="sandbox-header-actions">
                <button class="sandbox-icon-btn" type="button" onclick="window.clearSandboxMath()">Clear</button>
                <button class="close-sandbox-btn" type="button" onclick="window.closeMathSandbox()">x</button>
            </div>
        </div>

        <div class="sandbox-body">
            <div class="sandbox-main-grid">
                <section class="sandbox-compose-panel">
                    <div class="sandbox-field-toolbar">
                        <div class="sandbox-mode-tabs">
                            <button class="sandbox-mode-btn active" type="button">Visual</button>
                            <button class="sandbox-mode-btn" type="button" onclick="window.copySandboxLatex()">Copy LaTeX</button>
                        </div>
                        <div class="sandbox-field-actions">
                            <button type="button" onclick="window.insertSandboxLatex('\\\\frac{#?}{#?}')">Frac</button>
                            <button type="button" onclick="window.insertSandboxLatex('\\\\sqrt{#?}')">Root</button>
                            <button type="button" onclick="window.insertSandboxLatex('{#?}^{#?}')">Power</button>
                        </div>
                    </div>

                    <div class="sandbox-field-wrapper">
                        <math-field id="sandbox-mathfield" class="sandbox-math-field"></math-field>
                    </div>

                    <div class="sandbox-quick-row">
                        <button type="button" onmousedown="event.preventDefault()" onclick="window.insertSandboxLatex('\\\\frac{1}{2}')">1/2</button>
                        <button type="button" onmousedown="event.preventDefault()" onclick="window.insertSandboxLatex('x^2+y^2')">x^2 + y^2</button>
                        <button type="button" onmousedown="event.preventDefault()" onclick="window.insertSandboxLatex('\\\\sqrt{x}')">sqrt x</button>
                        <button type="button" onmousedown="event.preventDefault()" onclick="window.insertSandboxLatex('\\\\pi r^2')">pi r^2</button>
                        <button type="button" onmousedown="event.preventDefault()" onclick="window.insertSandboxLatex('\\\\int_{0}^{1} x \\\\, dx')">Integral</button>
                    </div>

                    <div class="sandbox-previews">
                        <div class="sandbox-preview-box">
                            <span class="preview-label">LaTeX</span>
                            <code id="sandbox-latex-output" class="font-mono"></code>
                        </div>
                        <div class="sandbox-preview-box">
                            <span class="preview-label">Value</span>
                            <span id="sandbox-eval-output" class="font-mono text-emerald-600"></span>
                        </div>
                    </div>
                </section>

                <aside class="sandbox-palette-panel">
                    <div class="sandbox-tab-list" role="tablist">
                        <button class="sandbox-tab active" type="button" data-tab="basics" onclick="window.setSandboxTab('basics')">Basic</button>
                        <button class="sandbox-tab" type="button" data-tab="advanced" onclick="window.setSandboxTab('advanced')">Advanced</button>
                        <button class="sandbox-tab" type="button" data-tab="keypad" onclick="window.setSandboxTab('keypad')">Keypad</button>
                    </div>

                    <div class="sandbox-tab-panel active" data-panel="basics">
                        <div class="sandbox-chip-grid">
                            <button class="sandbox-tool-chip" data-latex="+" onclick="window.insertSandboxSymbol(this)">+</button>
                            <button class="sandbox-tool-chip" data-latex="-" onclick="window.insertSandboxSymbol(this)">-</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\times" onclick="window.insertSandboxSymbol(this)">x</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\div" onclick="window.insertSandboxSymbol(this)">/</button>
                            <button class="sandbox-tool-chip" data-latex="=" onclick="window.insertSandboxSymbol(this)">=</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\neq" onclick="window.insertSandboxSymbol(this)">!=</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\le" onclick="window.insertSandboxSymbol(this)">&lt;=</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\ge" onclick="window.insertSandboxSymbol(this)">&gt;=</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\pi" onclick="window.insertSandboxSymbol(this)">pi</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\theta" onclick="window.insertSandboxSymbol(this)">theta</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\alpha" onclick="window.insertSandboxSymbol(this)">alpha</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\infty" onclick="window.insertSandboxSymbol(this)">inf</button>
                        </div>
                    </div>

                    <div class="sandbox-tab-panel" data-panel="advanced">
                        <div class="sandbox-chip-grid wide">
                            <button class="sandbox-tool-chip" data-latex="\\\\frac{#?}{#?}" onclick="window.insertSandboxSymbol(this)">Fraction</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\sqrt{#?}" onclick="window.insertSandboxSymbol(this)">Square root</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\sqrt[#?]{#?}" onclick="window.insertSandboxSymbol(this)">nth root</button>
                            <button class="sandbox-tool-chip" data-latex="{#?}^{#?}" onclick="window.insertSandboxSymbol(this)">Power</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\log_{#?}(#?)" onclick="window.insertSandboxSymbol(this)">Log</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\sin(#?)" onclick="window.insertSandboxSymbol(this)">sin</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\sum_{#?}^{#?}" onclick="window.insertSandboxSymbol(this)">Sum</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\int_{#?}^{#?} #? \\\\, dx" onclick="window.insertSandboxSymbol(this)">Integral</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\begin{pmatrix} 0 & 0 \\\\\\\\ 0 & 0 \\\\end{pmatrix}" onclick="window.insertSandboxSymbol(this)">2x2 Matrix</button>
                            <button class="sandbox-tool-chip" data-latex="\\\\vec{#?}" onclick="window.insertSandboxSymbol(this)">Vector</button>
                        </div>
                    </div>

                    <div class="sandbox-tab-panel" data-panel="keypad">
                        <div class="sandbox-calculator-grid">
                            <button class="calc-btn var-btn" onmousedown="event.preventDefault()" data-latex="x" onclick="window.insertSandboxSymbol(this)">x</button>
                            <button class="calc-btn var-btn" onmousedown="event.preventDefault()" data-latex="y" onclick="window.insertSandboxSymbol(this)">y</button>
                            <button class="calc-btn var-btn" onmousedown="event.preventDefault()" data-latex="n" onclick="window.insertSandboxSymbol(this)">n</button>
                            <button class="calc-btn var-btn" onmousedown="event.preventDefault()" data-latex="a" onclick="window.insertSandboxSymbol(this)">a</button>
                            <button class="calc-btn fn-btn" onmousedown="event.preventDefault()" data-latex="\\\\pi" onclick="window.insertSandboxSymbol(this)">pi</button>
                            <button class="calc-btn fn-btn" onmousedown="event.preventDefault()" data-latex="e" onclick="window.insertSandboxSymbol(this)">e</button>
                            <button class="calc-btn fn-btn" onmousedown="event.preventDefault()" data-latex="(" onclick="window.insertSandboxSymbol(this)">(</button>
                            <button class="calc-btn fn-btn" onmousedown="event.preventDefault()" data-latex=")" onclick="window.insertSandboxSymbol(this)">)</button>
                            <button class="calc-btn" onmousedown="event.preventDefault()" data-latex="7" onclick="window.insertSandboxSymbol(this)">7</button>
                            <button class="calc-btn" onmousedown="event.preventDefault()" data-latex="8" onclick="window.insertSandboxSymbol(this)">8</button>
                            <button class="calc-btn" onmousedown="event.preventDefault()" data-latex="9" onclick="window.insertSandboxSymbol(this)">9</button>
                            <button class="calc-btn op-btn" onmousedown="event.preventDefault()" data-latex="\\\\div" onclick="window.insertSandboxSymbol(this)">/</button>
                            <button class="calc-btn" onmousedown="event.preventDefault()" data-latex="4" onclick="window.insertSandboxSymbol(this)">4</button>
                            <button class="calc-btn" onmousedown="event.preventDefault()" data-latex="5" onclick="window.insertSandboxSymbol(this)">5</button>
                            <button class="calc-btn" onmousedown="event.preventDefault()" data-latex="6" onclick="window.insertSandboxSymbol(this)">6</button>
                            <button class="calc-btn op-btn" onmousedown="event.preventDefault()" data-latex="\\\\times" onclick="window.insertSandboxSymbol(this)">x</button>
                            <button class="calc-btn" onmousedown="event.preventDefault()" data-latex="1" onclick="window.insertSandboxSymbol(this)">1</button>
                            <button class="calc-btn" onmousedown="event.preventDefault()" data-latex="2" onclick="window.insertSandboxSymbol(this)">2</button>
                            <button class="calc-btn" onmousedown="event.preventDefault()" data-latex="3" onclick="window.insertSandboxSymbol(this)">3</button>
                            <button class="calc-btn op-btn" onmousedown="event.preventDefault()" data-latex="-" onclick="window.insertSandboxSymbol(this)">-</button>
                            <button class="calc-btn" onmousedown="event.preventDefault()" data-latex="0" onclick="window.insertSandboxSymbol(this)">0</button>
                            <button class="calc-btn" onmousedown="event.preventDefault()" data-latex="." onclick="window.insertSandboxSymbol(this)">.</button>
                            <button class="calc-btn" onmousedown="event.preventDefault()" data-latex="=" onclick="window.insertSandboxSymbol(this)">=</button>
                            <button class="calc-btn op-btn" onmousedown="event.preventDefault()" data-latex="+" onclick="window.insertSandboxSymbol(this)">+</button>
                        </div>
                    </div>

                    <div class="sandbox-utility-row">
                        <button type="button" onclick="window.backspaceSandboxMath()">Backspace</button>
                        <button type="button" onclick="window.clearSandboxMath()">Clear</button>
                    </div>
                </aside>
            </div>
        </div>

        <div class="sandbox-footer">
            <button class="btn-cancel" onclick="window.closeMathSandbox()">Cancel</button>
            <button class="btn-insert-math" onclick="window.commitSandboxMath()">Insert Equation</button>
        </div>
    `;

    window.sandboxModernBuilt = true;
};

window.openMathSandbox = function() {
    window.buildModernSandboxUI();

    const modal = document.getElementById('math-sandbox-modal');
    const mf = document.getElementById('sandbox-mathfield');
    if (modal && mf) {
        modal.classList.remove('hidden');
        window.activeSandboxField = mf;
        window.activeMathField = mf;
        
        // Manual virtual keyboard policy
        mf.mathVirtualKeyboardPolicy = 'manual';

        // Clear contents on launch
        if (typeof mf.setValue === 'function') {
            mf.setValue('');
        } else {
            mf.value = '';
        }
        document.getElementById('sandbox-latex-output').textContent = '';
        document.getElementById('sandbox-eval-output').textContent = '';
        window.setSandboxTab('basics');

        // Attach inputs listener
        if (!mf._sandboxInit) {
            mf._sandboxInit = true;
            mf.addEventListener('input', (e) => {
                const target = e.target;
                document.getElementById('sandbox-latex-output').textContent = target.value;
                window.evaluateSandboxMath(target.value);
            });
        }

        setTimeout(() => {
            mf.focus();
            if (window.mathVirtualKeyboard) {
                window.mathVirtualKeyboard.show();
            }
        }, 150);
    }
};

window.setSandboxTab = function(tabName) {
    document.querySelectorAll('#math-sandbox-modal .sandbox-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('#math-sandbox-modal .sandbox-tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.dataset.panel === tabName);
    });
};

window.updateSandboxOutputs = function() {
    const mf = document.getElementById('sandbox-mathfield');
    const latex = mf ? (mf.value || '') : '';
    const latexOutput = document.getElementById('sandbox-latex-output');
    if (latexOutput) latexOutput.textContent = latex;
    window.evaluateSandboxMath(latex);
};

window.insertSandboxLatex = function(latex) {
    const mf = document.getElementById('sandbox-mathfield');
    if (!mf || !latex) return;

    mf.focus();

    try {
        if (typeof mf.insert === 'function') {
            mf.insert(latex, { focus: true });
        } else {
            mf.value = `${mf.value || ''}${latex}`;
        }
    } catch (e) {
        mf.value = `${mf.value || ''}${latex}`;
    }

    window.updateSandboxOutputs();
    mf.dispatchEvent(new Event('input', { bubbles: true }));
};

window.clearSandboxMath = function() {
    const mf = document.getElementById('sandbox-mathfield');
    if (!mf) return;

    if (typeof mf.setValue === 'function') {
        mf.setValue('');
    } else {
        mf.value = '';
    }

    mf.focus();
    window.updateSandboxOutputs();
};

window.backspaceSandboxMath = function() {
    const mf = document.getElementById('sandbox-mathfield');
    if (!mf) return;

    mf.focus();

    try {
        if (typeof mf.executeCommand === 'function') {
            mf.executeCommand('deleteBackward');
        } else {
            mf.value = (mf.value || '').slice(0, -1);
        }
    } catch (e) {
        mf.value = (mf.value || '').slice(0, -1);
    }

    window.updateSandboxOutputs();
    mf.dispatchEvent(new Event('input', { bubbles: true }));
};

window.copySandboxLatex = function() {
    const mf = document.getElementById('sandbox-mathfield');
    const latex = mf ? (mf.value || '') : '';
    if (!latex) {
        window.toast('Nothing to copy yet');
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(latex).then(() => {
            window.toast('LaTeX copied');
        }).catch(() => {
            window.toast('Could not copy LaTeX');
        });
    } else {
        window.toast('Clipboard is unavailable');
    }
};

window.closeMathSandbox = function() {
    const modal = document.getElementById('math-sandbox-modal');
    if (modal) {
        modal.classList.add('hidden');
        window.activeSandboxField = null;
        if (window.activeMathField && window.activeMathField.id === 'sandbox-mathfield') {
            window.activeMathField = null;
        }
    }
};

// window.insertSandboxSymbol = function(btn) {
//     const latex = btn.getAttribute('data-latex');
//     console.log("Data: ", latex);
//     console.log(btn);
//     const mf = document.getElementById('sandbox-mathfield');
//     console.log(mf);
//     if (mf) {
//         try {
//             mf.focus();
//             if (typeof mf.insert === 'function') {
//                 mf.insert(latex, { focus: true });
//             } else {
//                 mf.value = mf.value + latex;
//             }
//             mf.dispatchEvent(new Event('input', { bubbles: true }));
//         } catch (e) {
//             mf.value = mf.value + latex;
//             mf.dispatchEvent(new Event('input', { bubbles: true }));
//         }
//     }
// };

window.insertSandboxSymbol = function(btn) {
    const latex = btn.getAttribute('data-latex');
    window.insertSandboxLatex(latex);
};

window.evaluateSandboxMath = function(latex) {
    try {
        let clean = latex
            .replace(/\\pi/g, Math.PI.toString())
            .replace(/e/g, Math.E.toString())
            .replace(/\\times/g, '*')
            .replace(/\\div/g, '/')
            .replace(/\\left\(/g, '(')
            .replace(/\\right\)/g, ')')
            .replace(/\\frac{([^}]+)}{([^}]+)}/g, '($1)/($2)')
            .replace(/{([^}]+)}\^{([^}]+)}/g, 'Math.pow($1, $2)')
            .replace(/\^2/g, '**2')
            .replace(/\^3/g, '**3');

        // Strip any alphabetical characters to prevent arbitrary script execution
        const executionSafe = clean.replace(/[a-zA-Z]/g, '');
        const result = new Function(`return ${executionSafe}`)();
        if (typeof result === 'number' && !isNaN(result)) {
            document.getElementById('sandbox-eval-output').textContent = result.toString();
        } else {
            document.getElementById('sandbox-eval-output').textContent = '';
        }
    } catch (e) {
        document.getElementById('sandbox-eval-output').textContent = '';
    }
};

window.commitSandboxMath = function() {
    const mf = document.getElementById('sandbox-mathfield');
    if (mf && mf.value) {
        const latex = mf.value;
        
        // Hide sandbox first to focus back on core editor fields
        window.closeMathSandbox();

        if (window.activeMathField) {
            window.activeMathField.insert(latex, { focus: true });
            window.activeMathField.focus();
            const editor = window.activeMathField.closest('.contenteditable-editor');
            if (editor) {
                editor.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } else if (window.activeEditorElement) {
            // Insert visual math block
            const sel = window.getSelection();
            if (sel.rangeCount) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                
                const element = document.createElement('math-field');
                element.setAttribute('contenteditable', 'false');
                element.classList.add('inline-math');
                element.value = latex;
                
                range.insertNode(element);
                window.initializeMathFields(window.activeEditorElement);
                
                range.setStartAfter(element);
                range.setEndAfter(element);
                sel.removeAllRanges();
                sel.addRange(range);
                
                window.activeEditorElement.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } else {
            window.toast('⚠️ Click inside a question box first, then open Sandbox');
        }
    } else {
        window.toast('⚠️ Type an equation in the field first');
    }
};
