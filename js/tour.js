// js/tour.js

window.tourSteps = [
    {
        title: "📁 Exam Explorer Tree",
        text: "This sidebar is your file directory. Here you can create custom folders (e.g. for different subjects) and manage multiple question papers. You can rename, duplicate, move, or delete papers here.",
        target: "sidebarPanel",
        arrow: "arrow-left"
    },
    {
        title: "⚙️ General Exam Header Settings",
        text: "Use this collapsible settings card to define school/college headers, grades, subjects, timing, maximum marks, instructions, and student details template blanks. This will automatically update your printable exam sheet.",
        target: "headerCollapseBody",
        arrow: "arrow-top",
        action: () => {
            // Expand settings panel if collapsed
            if (window.isHeaderCollapsed) {
                window.toggleHeaderCollapse();
            }
        }
    },
    {
        title: "📝 Create & Arrange Questions",
        text: "Click '+ Add Question' or '+ Add New Paper Section' to expand your test content. Select from multiple question styles (MCQs, True/False, Blanks, Matching, Short and Long Answers) and assign custom marks or difficulty levels.",
        target: "editorArea",
        arrow: "arrow-top"
    },
    {
        title: "➕ Mathematical typesetting & Rich Formatting",
        text: "Format text as Bold/Italic/Underline, add bullet lists, or search for math symbols. Highlight a text area and click '➕ Equation' to insert a dynamic LaTeX math formula using the MathLive visual editor.",
        target: "paneEditor .global-editor-toolbar",
        arrow: "arrow-top"
    },
    {
        title: "👁️ Preview A4 Paper Layout",
        text: "Switch to preview mode to examine your final layout in an A4 sheet. You can instantly toggle between a clean 'Student Question Paper' and a marked 'Teacher Answer Key' containing all solutions and answers.",
        target: "paneEditor .global-editor-toolbar .btn-success",
        arrow: "arrow-top"
    },
    {
        title: "🖨️ Print & Exporting Options",
        text: "When you are done, export your exam paper to a Microsoft Word document (DOCX), backup your templates, or click 'Print / Save PDF' to print the exam paper directly for your school class lab!",
        target: "panePreview .preview-toolbar",
        arrow: "arrow-top",
        action: () => {
            // Switch to preview mode to show the print toolbar
            window.switchViewMode('preview');
        }
    }
];

window.currentTourStep = 0;
window.tourOverlayEl = null;
window.tourTooltipEl = null;

window.startTour = function() {
    window.currentTourStep = 0;
    window.createTourUI();
    window.renderTourStep();
    window.toast("🚀 Training Tour Started");
};

window.createTourUI = function() {
    // Remove existing
    window.closeTour();

    // Create overlay mask
    window.tourOverlayEl = document.createElement("div");
    window.tourOverlayEl.className = "tour-overlay";
    window.tourOverlayEl.onclick = window.closeTour;
    document.body.appendChild(window.tourOverlayEl);

    // Create tooltip panel
    window.tourTooltipEl = document.createElement("div");
    window.tourTooltipEl.className = "tour-tooltip";
    document.body.appendChild(window.tourTooltipEl);
};

window.renderTourStep = function() {
    if (!window.tourTooltipEl) return;

    const step = window.tourSteps[window.currentTourStep];
    if (!step) return;

    // Run action if defined (e.g. expanding panels or switching views)
    if (step.action) {
        try {
            step.action();
        } catch (e) {
            console.error("Tour action failed", e);
        }
    }

    // Clean previous highlights
    document.querySelectorAll(".tour-highlight").forEach(el => {
        el.classList.remove("tour-highlight");
    });

    // Locate target element
    let targetEl = null;
    if (step.target.includes(" ")) {
        targetEl = document.querySelector(`.${step.target.split(" ")[0]} .${step.target.split(" ").slice(1).join(" .")}`);
        if (!targetEl) {
            targetEl = document.querySelector(`.${step.target.split(" ")[0]} ${step.target.split(" ").slice(1).join(" ")}`);
        }
    } else {
        targetEl = document.getElementById(step.target);
    }

    // Position tooltip
    let top = "50%";
    let left = "50%";
    let transform = "translate(-50%, -50%)";

    if (targetEl) {
        targetEl.classList.add("tour-highlight");
        const rect = targetEl.getBoundingClientRect();
        
        // Calculate appropriate positioning
        if (step.arrow === "arrow-left") {
            top = `${rect.top + rect.height / 2 - 100}px`;
            left = `${rect.right + 20}px`;
            transform = "none";
        } else if (step.arrow === "arrow-top") {
            top = `${rect.bottom + 20}px`;
            left = `${rect.left + rect.width / 2 - 160}px`;
            transform = "none";
        } else {
            // center fallback
            top = `${rect.top + rect.height / 2 - 100}px`;
            left = `${rect.left + rect.width / 2 - 160}px`;
            transform = "none";
        }
    }

    window.tourTooltipEl.style.top = top;
    window.tourTooltipEl.style.left = left;
    window.tourTooltipEl.style.transform = transform;
    window.tourTooltipEl.className = `tour-tooltip ${step.arrow || ''}`;

    // Render HTML
    const isFirst = window.currentTourStep === 0;
    const isLast = window.currentTourStep === window.tourSteps.length - 1;

    window.tourTooltipEl.innerHTML = `
        <h4>🎓 ${step.title}</h4>
        <p>${step.text}</p>
        <div class="tour-buttons">
            <span class="tour-step-indicator">Step ${window.currentTourStep + 1} of ${window.tourSteps.length}</span>
            <div style="display:flex; gap:6px;">
                ${!isFirst ? `<button class="tour-nav-btn btn-sec" onclick="window.prevTourStep()">Prev</button>` : ''}
                <button class="tour-nav-btn" onclick="${isLast ? 'window.closeTour()' : 'window.nextTourStep()'}">
                    ${isLast ? 'Finish' : 'Next'}
                </button>
            </div>
        </div>
    `;
};

window.nextTourStep = function() {
    if (window.currentTourStep < window.tourSteps.length - 1) {
        window.currentTourStep++;
        window.renderTourStep();
    }
};

window.prevTourStep = function() {
    if (window.currentTourStep > 0) {
        window.currentTourStep--;
        window.renderTourStep();
    }
};

window.closeTour = function() {
    if (window.tourOverlayEl) {
        document.body.removeChild(window.tourOverlayEl);
        window.tourOverlayEl = null;
    }
    if (window.tourTooltipEl) {
        document.body.removeChild(window.tourTooltipEl);
        window.tourTooltipEl = null;
    }
    document.querySelectorAll(".tour-highlight").forEach(el => {
        el.classList.remove("tour-highlight");
    });
    // Return back to editor mode after tour completes
    window.switchViewMode('edit');
};
