// js/reuseQuestion.js

window.selectedBankQIndex = -1;

window.saveQuestionForReuse = function(paperId, secId, qId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const orig = sec.questions.find(q => q.id === qId);
    if (!orig) return;

    // Deep copy the question object to preserve all details independently
    const qCopy = JSON.parse(JSON.stringify(orig));

    if (!window.state.questionBank) {
        window.state.questionBank = [];
    }

    // Append to reusable question bank
    window.state.questionBank.push(qCopy);

    // Save and notify
    window.saveState();
    window.toast('✨ Question saved to Question Bank for future reuse.');
};

window.openReuseModal = function() {
    const activePaper = window.state.papers.find(p => p.id === window.state.activePaperId);
    if (!activePaper) {
        window.toast("⚠️ No active paper found");
        return;
    }

    const selectPaper = document.getElementById('reuseSourcePaperId');
    const selectDestSec = document.getElementById('reuseDestSectionId');
    if (!selectPaper || !selectDestSec) return;

    // Populate source papers (legacy tab)
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

    // Populate destination sections (legacy tab)
    let destSecsHtml = '';
    if (activePaper.sections.length === 0) {
        destSecsHtml = '<option value="">(Create a section first)</option>';
    } else {
        activePaper.sections.forEach(s => {
            destSecsHtml += `<option value="${s.id}">${window.escHtml(s.name)}</option>`;
        });
    }
    selectDestSec.innerHTML = destSecsHtml;

    // Show modal
    document.getElementById('reuseQuestionModal').classList.remove('hidden');

    // Default to the Question Bank tab on open
    window.switchReuseTab('bank');
};

window.closeReuseModal = function() {
    document.getElementById('reuseQuestionModal').classList.add('hidden');
};

window.switchReuseTab = function(tabName) {
    const tabBankBtn = document.getElementById('reuseTabBank');
    const tabPapersBtn = document.getElementById('reuseTabPapers');
    const contentBank = document.getElementById('reuseContentBank');
    const contentPapers = document.getElementById('reuseContentPapers');

    if (!tabBankBtn || !tabPapersBtn || !contentBank || !contentPapers) return;

    if (tabName === 'bank') {
        tabBankBtn.classList.add('active');
        tabBankBtn.style.borderBottom = '2px solid var(--primary-color)';
        tabBankBtn.style.fontWeight = 'bold';
        tabBankBtn.style.color = '';

        tabPapersBtn.classList.remove('active');
        tabPapersBtn.style.borderBottom = '2px solid transparent';
        tabPapersBtn.style.fontWeight = 'normal';
        tabPapersBtn.style.color = 'var(--text-muted)';

        contentBank.style.display = 'flex';
        contentPapers.style.display = 'none';

        window.renderBankQuestions();
    } else {
        tabPapersBtn.classList.add('active');
        tabPapersBtn.style.borderBottom = '2px solid var(--primary-color)';
        tabPapersBtn.style.fontWeight = 'bold';
        tabPapersBtn.style.color = '';

        tabBankBtn.classList.remove('active');
        tabBankBtn.style.borderBottom = '2px solid transparent';
        tabBankBtn.style.fontWeight = 'normal';
        tabBankBtn.style.color = 'var(--text-muted)';

        contentPapers.style.display = 'flex';
        contentBank.style.display = 'none';

        window.onReusePaperChanged();
    }
};

window.renderBankQuestions = function() {
    const listContainer = document.getElementById('bankQuestionsList');
    if (!listContainer) return;

    if (!window.state.questionBank) {
        window.state.questionBank = [];
    }

    const searchQuery = (document.getElementById('bankSearchInput')?.value || '').toLowerCase().trim();
    const typeFilter = document.getElementById('bankTypeFilter')?.value || '';

    // Filter list
    const filtered = window.state.questionBank.map((q, idx) => ({ q, originalIndex: idx })).filter(item => {
        const textMatch = item.q.text.toLowerCase().includes(searchQuery);
        const typeMatch = !typeFilter || item.q.type === typeFilter;
        return textMatch && typeMatch;
    });

    let html = '';
    if (filtered.length === 0) {
        html = '<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 12px;">No questions found.</div>';
        listContainer.innerHTML = html;
        window.renderBankPreview(-1);
        return;
    }

    filtered.forEach(item => {
        const qTextClean = item.q.text.replace(/<[^>]*>/g, '').trim() || '(Empty Text)';
        const activeBg = (window.selectedBankQIndex === item.originalIndex) ? 'background-color: #eff6ff; border-color: var(--primary-color);' : '';
        html += `
            <div onclick="window.selectBankQuestion(${item.originalIndex})" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; background: #fff; cursor: pointer; display: flex; flex-direction: column; gap: 4px; ${activeBg}">
                <div style="font-weight: 600; font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-dark);">
                    ${window.escHtml(qTextClean)}
                </div>
                <div style="font-size: 10px; color: var(--text-muted);">
                    Type: ${item.q.type} | Marks: ${item.q.marks} | Difficulty: ${item.q.difficulty}
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;

    // Check if the selected index is still valid in filtered list
    const stillValid = filtered.some(item => item.originalIndex === window.selectedBankQIndex);
    if (!stillValid && filtered.length > 0) {
        window.selectedBankQIndex = filtered[0].originalIndex;
    }
    window.renderBankPreview(window.selectedBankQIndex);
};

window.selectBankQuestion = function(idx) {
    window.selectedBankQIndex = idx;
    window.renderBankQuestions();
};

window.renderBankPreview = function(idx) {
    const previewContainer = document.getElementById('bankQuestionPreviewContainer');
    if (!previewContainer) return;

    if (idx === -1 || !window.state.questionBank || !window.state.questionBank[idx]) {
        previewContainer.innerHTML = '<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 24px;">Select a question from the list to preview it here.</div>';
        return;
    }

    const q = window.state.questionBank[idx];
    const activePaper = window.state.papers.find(p => p.id === window.state.activePaperId);

    // Build destination sections options
    let destSecsHtml = '';
    if (activePaper && activePaper.sections.length > 0) {
        activePaper.sections.forEach(s => {
            destSecsHtml += `<option value="${s.id}">${window.escHtml(s.name)}</option>`;
        });
    } else {
        destSecsHtml = '<option value="">(Create a section first)</option>';
    }

    // Build details for MCQ, True/False or Match
    let detailsHtml = '';
    if (q.type === 'MCQ' || q.type === 'True/False') {
        detailsHtml += '<div style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px; padding-left: 8px;">';
        const labels = ['A', 'B', 'C', 'D'];
        q.options.forEach((opt, oIdx) => {
            const labelStr = q.type === 'MCQ' ? `(${labels[oIdx]})` : '';
            const correctBadge = opt.isCorrect ? ' <span style="color:#10b981; font-weight:bold;">★ Correct</span>' : '';
            detailsHtml += `
                <div style="font-size: 11px; display: flex; align-items: center; gap: 6px;">
                    <strong>${labelStr}</strong> ${opt.text || ''}${correctBadge}
                </div>
            `;
        });
        detailsHtml += '</div>';
    } else if (q.type === 'Match') {
        detailsHtml += '<div style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px; padding-left: 8px;">';
        q.matches.forEach(m => {
            detailsHtml += `
                <div style="font-size: 11px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 2px;">
                    <span>${m.left || ''}</span>
                    <span style="color: var(--text-muted); font-size: 10px;">➔</span>
                    <span>${m.right || ''}</span>
                </div>
            `;
        });
        detailsHtml += '</div>';
    }

    // Render solution/rubric if exists
    let solHtml = '';
    if (q.solution) {
        solHtml = `
            <div style="margin-top: 10px; border-left: 3px solid #16a34a; background: #f0fdf4; padding: 8px; font-size: 11px; border-radius: 0 4px 4px 0;">
                <strong>Solution / Rubric:</strong> ${q.solution}
            </div>
        `;
    }

    let imgHtml = '';
    if (q.image) {
        imgHtml = `
            <div style="margin-top: 8px; text-align: center; border: 1px solid var(--border-color); border-radius: 4px; padding: 4px; background: #fafafa;">
                <img src="${q.image}" style="max-width: 100%; max-height: 120px; object-fit: contain;" />
            </div>
        `;
    }

    previewContainer.innerHTML = `
        <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 8px; overflow-y: auto;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
                <span style="font-size: 11px; font-weight: bold; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; color: var(--text-dark);">${q.type}</span>
                <span style="font-size: 11px; color: var(--text-muted);">Marks: ${q.marks} | Difficulty: ${q.difficulty}</span>
            </div>
            
            <div style="font-size: 12px; border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; background: #f8fafc; min-height: 60px; color: var(--text-dark); overflow-wrap: break-word;">
                ${q.text || '(No text)'}
            </div>

            ${imgHtml}
            ${detailsHtml}
            ${solHtml}
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 10px; display: flex; flex-direction: column; gap: 8px; margin-top: auto;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 11px; font-weight: bold; white-space: nowrap; color: var(--text-dark);">Add to Section:</label>
                <select id="bankDestSectionId" style="flex-grow: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 11px; font-family: inherit;">
                    ${destSecsHtml}
                </select>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button class="btn-danger-outline" onclick="window.deleteBankQuestion(${idx})" style="padding: 6px 10px; font-size: 11px; border-radius: 6px; cursor: pointer;">Delete from Bank</button>
                <button class="btn-primary" onclick="window.addBankQuestionToPaper(${idx})" style="padding: 6px 14px; font-size: 11px; border-radius: 6px; cursor: pointer;">Add to Current Paper</button>
            </div>
        </div>
    `;
};

window.deleteBankQuestion = function(idx) {
    if (confirm("Are you sure you want to delete this question from the Question Bank?")) {
        window.state.questionBank.splice(idx, 1);
        window.saveState();
        window.selectedBankQIndex = -1;
        window.renderBankQuestions();
        window.toast("🗑️ Question removed from Question Bank");
    }
};

window.addBankQuestionToPaper = function(idx) {
    const activePaper = window.state.papers.find(p => p.id === window.state.activePaperId);
    const destSecSelect = document.getElementById('bankDestSectionId');
    if (!activePaper || !destSecSelect) return;

    const destSecId = destSecSelect.value;
    if (!destSecId) {
        window.toast("⚠️ Please select or create a destination section first");
        return;
    }

    const destSec = activePaper.sections.find(s => s.id === destSecId);
    if (!destSec) return;

    const origQ = window.state.questionBank[idx];
    if (!origQ) return;

    // Deep copy and generate new unique IDs
    const copyQ = JSON.parse(JSON.stringify(origQ));
    copyQ.id = 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    if (copyQ.options) {
        copyQ.options.forEach(o => {
            o.id = 'opt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        });
    }

    destSec.questions.push(copyQ);
    window.saveState();
    window.render();
    window.toast("✨ Question successfully added to your paper!");
    
    if (window.renderPrintPreview) window.renderPrintPreview();
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
        if (window.renderPrintPreview) window.renderPrintPreview();
    }
};
