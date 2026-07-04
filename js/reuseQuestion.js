// js/reuseQuestion.js

window.openReuseModal = function() {
    const activePaper = window.state.papers.find(p => p.id === window.state.activePaperId);
    if (!activePaper) {
        window.toast("⚠️ No active paper found");
        return;
    }

    const selectPaper = document.getElementById('reuseSourcePaperId');
    const selectDestSec = document.getElementById('reuseDestSectionId');
    if (!selectPaper || !selectDestSec) return;

    // Populate source papers
    let papersHtml = '';
    const otherPapers = window.state.papers.filter(p => p.id !== activePaper.id);
    
    if (otherPapers.length === 0) {
        papersHtml = '<option value="">(No other papers available)</option>';
    } else {
        otherPapers.forEach(p => {
            papersHtml += `<option value="${p.id}">${window.escHtml(p.name)}</option>`;
        });
    }
    selectPaper.innerHTML = papersHtml;

    // Populate destination sections
    let destSecsHtml = '';
    if (activePaper.sections.length === 0) {
        destSecsHtml = '<option value="">(Create a section first)</option>';
    } else {
        activePaper.sections.forEach(s => {
            destSecsHtml += `<option value="${s.id}">${window.escHtml(s.name)}</option>`;
        });
    }
    selectDestSec.innerHTML = destSecsHtml;

    // Trigger questions loading
    window.onReusePaperChanged();

    // Show modal
    document.getElementById('reuseQuestionModal').classList.remove('hidden');
};

window.closeReuseModal = function() {
    document.getElementById('reuseQuestionModal').classList.add('hidden');
};

window.onReusePaperChanged = function() {
    const selectPaper = document.getElementById('reuseSourcePaperId');
    const questionsContainer = document.getElementById('reuseQuestionsList');
    if (!selectPaper || !questionsContainer) return;

    const sourcePaperId = selectPaper.value;
    if (!sourcePaperId) {
        questionsContainer.innerHTML = '<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 12px;">No source paper selected.</div>';
        return;
    }

    const sourcePaper = window.state.papers.find(p => p.id === sourcePaperId);
    if (!sourcePaper) return;

    let html = '';
    let totalQ = 0;

    sourcePaper.sections.forEach(sec => {
        sec.questions.forEach(q => {
            totalQ++;
            const cleanText = q.text.replace(/<[^>]*>/g, '').trim() || `(Question ${totalQ} - Empty Text)`;
            html += `
                <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px; cursor: pointer; user-select: none;">
                    <input type="checkbox" name="reuse_q_checkbox" value="${sec.id}:${q.id}" style="margin-top: 2px;" />
                    <div>
                        <strong>Q.</strong> ${window.escHtml(cleanText)}
                        <span style="font-size: 10px; color: var(--text-muted); display: block; margin-top: 1px;">Type: ${q.type} | Marks: ${q.marks}</span>
                    </div>
                </label>
            `;
        });
    });

    if (totalQ === 0) {
        html = '<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 12px;">This paper is empty.</div>';
    }

    questionsContainer.innerHTML = html;
};

window.applyReuseQuestions = function() {
    const activePaper = window.state.papers.find(p => p.id === window.state.activePaperId);
    const selectPaper = document.getElementById('reuseSourcePaperId');
    const selectDestSec = document.getElementById('reuseDestSectionId');
    const checkboxes = document.querySelectorAll('input[name="reuse_q_checkbox"]:checked');

    if (!activePaper || !selectPaper || !selectDestSec) return;

    const sourcePaperId = selectPaper.value;
    const destSecId = selectDestSec.value;

    if (!sourcePaperId || !destSecId || checkboxes.length === 0) {
        window.toast("⚠️ Select source paper, questions, and destination section");
        return;
    }

    const sourcePaper = window.state.papers.find(p => p.id === sourcePaperId);
    const destSec = activePaper.sections.find(s => s.id === destSecId);

    if (!sourcePaper || !destSec) return;

    let importedCount = 0;

    checkboxes.forEach(cb => {
        const [srcSecId, qId] = cb.value.split(':');
        const srcSec = sourcePaper.sections.find(s => s.id === srcSecId);
        if (!srcSec) return;

        const origQ = srcSec.questions.find(q => q.id === qId);
        if (!origQ) return;

        // Deep copy the question and generate new IDs
        const copyQ = JSON.parse(JSON.stringify(origQ));
        copyQ.id = 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        if (copyQ.options) {
            copyQ.options.forEach(o => {
                o.id = 'opt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
            });
        }

        destSec.questions.push(copyQ);
        importedCount++;
    });

    if (importedCount > 0) {
        window.saveState();
        window.render();
        window.closeReuseModal();
        window.toast(`🔄 Successfully imported ${importedCount} question(s)!`);
    }
};
