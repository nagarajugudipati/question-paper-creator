// js/editor.js

window.renderEditor = function(paper) {
    const area = document.getElementById('editorArea');
    if (!area) return;

    let html = `
        <!-- Title input row -->
        <div class="editor-paper-title-row">
            <input type="text" value="${window.escHtml(paper.name)}" 
                   class="paper-title-input"
                   onchange="window.renamePaper('${paper.id}', this.value)" 
                   placeholder="Sample Paper - IX IIT" />
            
            <div class="paper-actions-toolbar">
                <button class="toolbar-action-btn btn-primary-outline" onclick="window.addSection('${paper.id}')">+ Section</button>
                <button class="toolbar-action-btn btn-primary-outline" onclick="window.openReuseModal()">🔄 Reuse Q</button>
                <button class="toolbar-action-btn" onclick="window.exportDOCX('${paper.id}')">📝 DOCX</button>
                <button class="toolbar-action-btn" onclick="window.switchViewMode('preview')">🖨️ PDF</button>
                <button class="toolbar-action-btn" onclick="window.exportJSON('${paper.id}')">📂 JSON</button>
                <button class="toolbar-action-btn" onclick="window.exportCSV('${paper.id}')">📊 CSV</button>
            </div>
        </div>

        <!-- Paper settings Collapsible Card -->
        <div class="collapsible-card">
            <div class="collapsible-header" onclick="window.toggleHeaderCollapse()">
                <span>⚙️ General Exam Header Settings</span>
                <span id="headerCollapseArrow">${window.isHeaderCollapsed ? '▲' : '▼'}</span>
            </div>
            <div class="collapsible-body" id="headerCollapseBody" style="${window.isHeaderCollapsed ? 'display:none;' : 'display:flex;'}">
                <div class="setting-group">
                    <label>School / College Name</label>
                    <input type="text" id="cfgSchoolName" value="${window.escHtml(paper.header.schoolName)}" oninput="window.updateHeaderField('schoolName', this.value)" />
                </div>
                <div class="setting-group">
                    <label>Examination Title</label>
                    <input type="text" id="cfgExamName" value="${window.escHtml(paper.header.examName)}" oninput="window.updateHeaderField('examName', this.value)" />
                </div>
                <div class="form-grid-2">
                    <div class="setting-group">
                        <label>Subject</label>
                        <input type="text" id="cfgSubject" value="${window.escHtml(paper.header.subject)}" oninput="window.updateHeaderField('subject', this.value)" />
                    </div>
                    <div class="setting-group">
                        <label>Class / Grade</label>
                        <input type="text" id="cfgGrade" value="${window.escHtml(paper.header.grade)}" oninput="window.updateHeaderField('grade', this.value)" />
                    </div>
                </div>
                <div class="form-grid-2">
                    <div class="setting-group">
                        <label>Time Allowed</label>
                        <input type="text" id="cfgTime" value="${window.escHtml(paper.header.timeAllowed)}" oninput="window.updateHeaderField('timeAllowed', this.value)" />
                    </div>
                    <div class="setting-group">
                        <label>Max Marks</label>
                        <input type="text" id="cfgMarks" value="${window.escHtml(paper.header.maxMarks)}" oninput="window.updateHeaderField('maxMarks', this.value)" />
                    </div>
                </div>
                <div class="setting-group" style="flex-direction: row; gap: 16px; align-items: center; margin: 4px 0; flex-wrap: wrap;">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <input type="checkbox" id="cfgStudentDetails" ${paper.header.showStudentDetails ? 'checked' : ''} onchange="window.updateHeaderField('showStudentDetails', this.checked)" />
                        <label for="cfgStudentDetails" style="font-size:12px;font-weight:600;cursor:pointer;">Show Student Name & Roll No Blanks</label>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <input type="checkbox" id="cfgShowMarks" ${paper.header.showMarks !== false ? 'checked' : ''} onchange="window.updateHeaderField('showMarks', this.checked)" />
                        <label for="cfgShowMarks" style="font-size:12px;font-weight:600;cursor:pointer;">Show Marks in Question Paper</label>
                    </div>
                </div>
                <div class="setting-group">
                    <label>General Instructions (one per line)</label>
                    <textarea id="cfgInstructions" rows="3" oninput="window.updateHeaderInstructions(this.value)">${(paper.header.instructions || []).join('\n')}</textarea>
                </div>
            </div>
        </div>
    `;

    html += `<div id="editorSectionsList" style="margin-top:20px;">`;
    
    if (paper.sections.length === 0) {
        html += `
            <div style="text-align:center;padding:30px;border:1.5px dashed var(--border-color);border-radius:8px;color:var(--text-muted);font-size:13px;margin-top:16px;">
                No sections. Click "+ Add Section" below to create paper segments.
            </div>
        `;
    } else {
        paper.sections.forEach((sec, sIdx) => {
            html += `
                <div class="editor-section-card" data-sec-id="${sec.id}" ondragover="window.onDragOver(event)" ondrop="window.onDropSection(event, ${sIdx})">
                    <div class="editor-section-header">
                        <span class="section-drag-handle" draggable="true" ondragstart="window.onDragStartSection(event, '${paper.id}', '${sec.id}', ${sIdx})">⋮⋮</span>
                        <span class="section-folder-icon">📂</span>
                        <input type="text" value="${window.escHtml(sec.name)}" 
                               class="section-title-input"
                               onchange="window.renameSection('${paper.id}', '${sec.id}', this.value)" 
                               placeholder="Section A - Mathematics" />
                        <span class="section-question-count">(${sec.questions.length} Q)</span>
                        <div class="section-actions">
                            <button class="section-add-q-btn" onclick="window.addQuestion('${paper.id}', '${sec.id}')">+ Question</button>
                            <button class="section-del-btn" onclick="window.deleteSection('${paper.id}', '${sec.id}')" title="Delete Section">✕</button>
                        </div>
                    </div>
                    <div class="editor-section-body" id="section-body-${sec.id}">
            `;

            if (sec.questions.length === 0) {
                html += `
                    <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;border:1px dashed var(--border-light);border-radius:6px;">
                        Section is empty. Click "+ Add Question" above.
                    </div>
                `;
            } else {
                sec.questions.forEach((q, qIdx) => {
                    html += window.renderEditorQuestionCard(paper, sec, q, qIdx);
                });
            }

            html += `
                    </div>
                </div>
            `;
        });
    }

    html += `
        </div>
        <button class="btn-add-section-dashed" onclick="window.addSection('${paper.id}')" style="background:none; border:2px dashed var(--border-color); color:var(--text-muted); padding:12px; border-radius:8px; font-weight:600; width:100%; cursor:pointer; margin-top:8px;">
            + Add New Paper Section
        </button>
    `;

    area.innerHTML = html;

    if (window.initializeMathFields) window.initializeMathFields(area);
};

window.renderEditorQuestionCard = function(paper, sec, q, qIdx) {
    const qNum = qIdx + 1;
    
    const types = ['MCQ', 'True/False', 'Fill in the Blank', 'Match', 'Short Answer', 'Long Answer'];
    let typeDropdown = `<select onchange="window.setQuestionType('${paper.id}', '${sec.id}', '${q.id}', this.value)">`;
    types.forEach(t => {
        const selected = q.type === t ? 'selected' : '';
        typeDropdown += `<option value="${t}" ${selected}>${t}</option>`;
    });
    typeDropdown += `</select>`;

    const diffs = ['Easy', 'Medium', 'Hard'];
    let diffDropdown = `<select onchange="window.setQuestionDifficulty('${paper.id}', '${sec.id}', '${q.id}', this.value)">`;
    diffs.forEach(d => {
        const selected = q.difficulty === d ? 'selected' : '';
        diffDropdown += `<option value="${d}" ${selected}>${d}</option>`;
    });
    diffDropdown += `</select>`;

    return `
        <div class="editor-q-card" data-q-id="${q.id}" data-sec-id="${sec.id}" ondragover="window.onDragOver(event)" ondrop="window.onDropQuestion(event, '${sec.id}', ${qIdx})">
            <div class="editor-q-header">
                <div class="q-meta-inputs">
                    <span class="q-drag-handle" draggable="true" ondragstart="window.onDragStartQuestion(event, '${paper.id}', '${sec.id}', '${q.id}', ${qIdx})">⋮⋮</span>
                    ${typeDropdown}
                    <input type="number" value="${q.marks}" style="width:45px;" onchange="window.setQuestionMarks('${paper.id}', '${sec.id}', '${q.id}', this.value)" min="0" />
                    <span style="font-size:11px;font-weight:700;color:var(--text-muted);">Marks</span>
                    ${diffDropdown}
                </div>
                <div class="editor-q-actions">
                    <button class="icon-action-btn" onclick="window.duplicateQuestion('${paper.id}', '${sec.id}', '${q.id}')" title="Duplicate Question">📋</button>
                    <button class="icon-action-btn btn-danger-hover" onclick="window.deleteQuestion('${paper.id}', '${sec.id}', '${q.id}')" title="Remove Question">✕</button>
                </div>
            </div>

            <div class="editor-q-body-row">
                <div class="q-number-col">${qNum}.</div>
                <div class="q-editor-col">
                    <div class="contenteditable-editor" contenteditable="true" placeholder="Type your question here..." oninput="window.updateQuestionText('${paper.id}','${sec.id}','${q.id}',this.innerHTML)" onblur="window.saveHistoryState()">${q.text || ''}</div>
                    
                    <button class="paste-image-hint-btn" onclick="window.triggerImageUpload('${paper.id}', '${sec.id}', '${q.id}')">
                        📷 Paste image (Ctrl+V) into question
                    </button>

                    ${q.image ? `
                        <div class="q-image-editor-section">
                            <div class="q-image-preview-block">
                                <img src="${q.image}" />
                                <button onclick="window.removeQuestionImage('${paper.id}', '${sec.id}', '${q.id}')">✕</button>
                            </div>
                        </div>
                    ` : ''}

                    ${window.renderTypeSpecificEditors(paper, sec, q)}
                </div>
            </div>
        </div>
    `;
};

window.renderTypeSpecificEditors = function(paper, sec, q) {
    let html = '';

    if (q.type === 'MCQ' || q.type === 'True/False') {
        html += `<div class="options-list-editor ${q.layout || 'row'}">`;
        const labels = Array.from({ length: q.options.length }, (_, i) => String.fromCharCode(65 + i)); // A, B, C...
        
        q.options.forEach((opt, oIdx) => {
            html += `
                <div class="option-editor-row" 
                     draggable="true" 
                     ondragstart="window.onDragStartOption(event, '${paper.id}', '${sec.id}', '${q.id}', ${oIdx})"
                     ondragover="window.onDragOver(event)"
                     ondrop="window.onDropOption(event, '${q.id}', ${oIdx})">
                    <span class="opt-drag-handle">⋮⋮</span>
                    <span class="option-label-indicator">${labels[oIdx]}.</span>
                    
                    <div class="contenteditable-editor" 
                         contenteditable="true" 
                         placeholder="Enter Option ${labels[oIdx]}..."
                         oninput="window.updateOptionText('${paper.id}','${sec.id}','${q.id}',${oIdx},this.innerHTML)"
                         onblur="window.saveHistoryState()">${opt.text || ''}</div>

                    <input type="radio" name="correct_radio_${q.id}" 
                           ${opt.isCorrect ? 'checked' : ''} 
                           onchange="window.setOptionCorrectness('${paper.id}','${sec.id}','${q.id}',${oIdx})"
                           title="Mark option as correct answer" />

                    ${q.type === 'MCQ' ? `
                        <button class="btn-opt-del" onclick="window.deleteOption('${paper.id}','${sec.id}','${q.id}',${oIdx})" title="Delete Option">✕</button>
                    ` : ''}
                </div>
            `;
        });

        if (q.type === 'MCQ') {
            html += `
                <div class="options-editor-footer-row">
                    <button class="opt-add-btn" onclick="window.addOption('${paper.id}','${sec.id}','${q.id}')">+ Add Option Choice</button>
                    
                    <div class="layout-toggle-radios">
                        <label class="layout-radio-lbl">
                            <input type="radio" name="layout_radio_${q.id}" value="row" ${q.layout === 'row' ? 'checked' : ''} onchange="window.setQuestionLayout('${paper.id}', '${sec.id}', '${q.id}', 'row')" /> 1×4
                        </label>
                        <label class="layout-radio-lbl">
                            <input type="radio" name="layout_radio_${q.id}" value="grid2" ${q.layout === 'grid2' ? 'checked' : ''} onchange="window.setQuestionLayout('${paper.id}', '${sec.id}', '${q.id}', 'grid2')" /> 2×2
                        </label>
                        <label class="layout-radio-lbl">
                            <input type="radio" name="layout_radio_${q.id}" value="column" ${q.layout === 'column' ? 'checked' : ''} onchange="window.setQuestionLayout('${paper.id}', '${sec.id}', '${q.id}', 'column')" /> 4×1
                        </label>
                    </div>
                </div>
            `;
        }
        html += `</div>`;

    } else if (q.type === 'Match') {
        html += `<div class="match-list-editor">`;
        q.matches.forEach((pair, mIdx) => {
            html += `
                <div class="match-pair-row">
                    <span style="min-width: 14px;">${mIdx + 1}.</span>
                    <div class="contenteditable-editor" 
                         contenteditable="true" 
                         placeholder="Left Column Item..."
                         oninput="window.updateMatchField('${paper.id}','${sec.id}','${q.id}',${mIdx},'left',this.innerHTML)"
                         onblur="window.saveHistoryState()">${pair.left || ''}</div>
                    <span>matches</span>
                    <div class="contenteditable-editor" 
                         contenteditable="true" 
                         placeholder="Right Matching Key..."
                         oninput="window.updateMatchField('${paper.id}','${sec.id}','${q.id}',${mIdx},'right',this.innerHTML)"
                         onblur="window.saveHistoryState()">${pair.right || ''}</div>
                    <button class="btn-opt-del" onclick="window.deleteMatchPair('${paper.id}','${sec.id}','${q.id}',${mIdx})" title="Delete Row">✕</button>
                </div>
            `;
        });
        html += `
            <div style="margin-top: 6px;">
                <button class="opt-add-btn" onclick="window.addMatchPair('${paper.id}','${sec.id}','${q.id}')">+ Add Matching Pair</button>
            </div>
        `;
        html += `</div>`;

    } else if (q.type === 'Fill in the Blank' || q.type === 'Short Answer' || q.type === 'Long Answer') {
        const labelText = q.type === 'Fill in the Blank' ? 'Correct Blank Answer:' : 'Sample Solution / Answer Key Explanation:';
        html += `
            <div style="margin-top: 12px; padding-left: 20px;">
                <label style="font-size:11px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:4px;">${labelText}</label>
                <textarea class="contenteditable-editor" rows="2" style="font-family:inherit;font-size:12px;resize:vertical;"
                          placeholder="Type the solution key here (printed only on Answer Key copies)..."
                          oninput="window.updateQuestionExplanation('${paper.id}','${sec.id}','${q.id}',this.value)"
                          onblur="window.saveHistoryState()">${q.explanation || ''}</textarea>
            </div>
        `;
    }

    return html;
};

// ─── Document Header Bindings ───
window.renamePaper = function(paperId, newName) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (paper) {
        paper.name = newName || 'Untitled Paper';
        window.saveState();
        if (window.renderFolderTree) window.renderFolderTree();
    }
};

window.toggleHeaderCollapse = function() {
    window.isHeaderCollapsed = !window.isHeaderCollapsed;
    const body = document.getElementById('headerCollapseBody');
    const arrow = document.getElementById('headerCollapseArrow');
    if (body && arrow) {
        if (window.isHeaderCollapsed) {
            body.style.display = 'none';
            arrow.textContent = '▲';
        } else {
            body.style.display = 'flex';
            arrow.textContent = '▼';
        }
    }
};

window.updateHeaderField = function(field, value) {
    const paper = window.state.papers.find(p => p.id === window.state.activePaperId);
    if (paper && paper.header) {
        paper.header[field] = value;
        window.triggerAutosave();
    }
};

window.updateHeaderInstructions = function(text) {
    const paper = window.state.papers.find(p => p.id === window.state.activePaperId);
    if (paper && paper.header) {
        paper.header.instructions = text.split('\n');
        window.triggerAutosave();
    }
};

// ─── Sections mutations ───
window.addSection = function(paperId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = {
        id: 'sec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: 'Section ' + String.fromCharCode(65 + paper.sections.length) + ': New Section',
        questions: []
    };
    paper.sections.push(sec);
    window.render();
    window.toast('📂 Created section');
};

window.renameSection = function(paperId, secId, newName) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (sec) {
        sec.name = newName || 'Untitled Section';
        window.triggerAutosave();
    }
};

window.deleteSection = function(paperId, secId) {
    if (!confirm('This will delete the section and all questions inside. Confirm?')) return;
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    paper.sections = paper.sections.filter(s => s.id !== secId);
    window.render();
    window.toast('🗑️ Section deleted');
};

// ─── Questions mutations ───
window.addQuestion = function(paperId, secId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;

    const q = {
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        type: 'MCQ',
        text: '',
        marks: 1,
        difficulty: 'Medium',
        layout: 'row',
        options: [
            { id: 'opt_' + Date.now() + '_0', text: '', isCorrect: false },
            { id: 'opt_' + Date.now() + '_1', text: '', isCorrect: false },
            { id: 'opt_' + Date.now() + '_2', text: '', isCorrect: false },
            { id: 'opt_' + Date.now() + '_3', text: '', isCorrect: false }
        ]
    };
    sec.questions.push(q);
    window.render();
    
    setTimeout(() => {
        const el = document.querySelector(`.editor-q-card[data-q-id="${q.id}"] .contenteditable-editor`);
        if (el) el.focus();
    }, 100);
    window.toast('✏️ Question added');
};

window.deleteQuestion = function(paperId, secId, qId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    
    sec.questions = sec.questions.filter(q => q.id !== qId);
    window.render();
    window.toast('🗑️ Question removed');
};

window.duplicateQuestion = function(paperId, secId, qId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    
    const orig = sec.questions.find(q => q.id === qId);
    if (!orig) return;

    const copy = JSON.parse(JSON.stringify(orig));
    copy.id = 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    if (copy.options) {
        copy.options.forEach(o => o.id = 'opt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
    }
    
    sec.questions.splice(sec.questions.indexOf(orig) + 1, 0, copy);
    window.render();
    window.toast('📋 Duplicated question');
};

window.updateQuestionText = function(paperId, secId, qId, html) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === qId);
    if (q) {
        q.text = html;
        window.triggerAutosave();
    }
};

window.setQuestionType = function(paperId, secId, qId, type) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === qId);
    if (!q) return;

    q.type = type;

    if (type === 'MCQ') {
        q.options = [
            { id: 'opt_' + Date.now() + '_0', text: '', isCorrect: false },
            { id: 'opt_' + Date.now() + '_1', text: '', isCorrect: false },
            { id: 'opt_' + Date.now() + '_2', text: '', isCorrect: false },
            { id: 'opt_' + Date.now() + '_3', text: '', isCorrect: false }
        ];
    } else if (type === 'True/False') {
        q.options = [
            { id: 'opt_' + Date.now() + '_0', text: 'True', isCorrect: false },
            { id: 'opt_' + Date.now() + '_1', text: 'False', isCorrect: false }
        ];
    } else if (type === 'Match') {
        q.matches = [
            { left: '', right: '' },
            { left: '', right: '' },
            { left: '', right: '' }
        ];
    }

    window.render();
};

window.setQuestionMarks = function(paperId, secId, qId, marks) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === qId);
    if (q) {
        q.marks = parseFloat(marks) || 0;
        window.triggerAutosave();
    }
};

window.setQuestionDifficulty = function(paperId, secId, qId, diff) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === qId);
    if (q) {
        q.difficulty = diff;
        window.triggerAutosave();
    }
};

window.setQuestionLayout = function(paperId, secId, qId, layout) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === qId);
    if (q) {
        q.layout = layout;
        window.render();
        window.toast('📐 Option layout updated');
    }
};

window.updateQuestionExplanation = function(paperId, secId, qId, exp) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === qId);
    if (q) {
        q.explanation = exp;
        window.triggerAutosave();
    }
};

// ─── Option Choices ───
window.addOption = function(paperId, secId, qId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === qId);
    if (!q) return;

    q.options.push({
        id: 'opt_' + Date.now() + '_' + q.options.length,
        text: '',
        isCorrect: false
    });
    window.render();
    window.toast('➕ Option added');
};

window.deleteOption = function(paperId, secId, qId, idx) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === qId);
    if (!q) return;

    if (q.options.length <= 2) {
        window.toast('⚠️ MCQ requires a minimum of 2 choices');
        return;
    }

    q.options.splice(idx, 1);
    window.render();
    window.toast('🗑️ Option deleted');
};

window.updateOptionText = function(paperId, secId, qId, idx, html) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === qId);
    if (q && q.options[idx]) {
        q.options[idx].text = html;
        window.triggerAutosave();
    }
};

window.setOptionCorrectness = function(paperId, secId, qId, idx) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === qId);
    if (q) {
        q.options.forEach((o, i) => o.isCorrect = (i === idx));
        window.triggerAutosave();
    }
};

// ─── Matching Pairs ───
window.addMatchPair = function(paperId, secId, qId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === qId);
    if (!q) return;

    q.matches.push({ left: '', right: '' });
    window.render();
};

window.deleteMatchPair = function(paperId, secId, qId, idx) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === qId);
    if (!q) return;

    if (q.matches.length <= 1) {
        window.toast('⚠️ Matches require a minimum of 1 pairing row');
        return;
    }

    q.matches.splice(idx, 1);
    window.render();
};

window.updateMatchField = function(paperId, secId, qId, idx, side, html) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === qId);
    if (q && q.matches[idx]) {
        q.matches[idx][side] = html;
        window.triggerAutosave();
    }
};

// ─── Diagrams / Images upload triggers ───
let activeImageTarget = null;
window.triggerImageUpload = function(paperId, secId, qId) {
    activeImageTarget = { paperId, secId, qId };
    const input = document.getElementById('globalImageInput');
    if (input) input.click();
};

window.handleGlobalImageSelect = function(e) {
    const file = e.target.files[0];
    if (!file || !activeImageTarget) return;

    const reader = new FileReader();
    reader.onload = function(ev) {
        const base64 = ev.target.result;
        const { paperId, secId, qId } = activeImageTarget;

        const paper = window.state.papers.find(p => p.id === paperId);
        if (!paper) return;
        const sec = paper.sections.find(s => s.id === secId);
        if (!sec) return;
        const q = sec.questions.find(q => q.id === qId);
        if (q) {
            q.image = base64;
            window.render();
        }
    };
    reader.readAsDataURL(file);
};

window.removeQuestionImage = function(paperId, secId, qId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === qId);
    if (q) {
        q.image = null;
        window.render();
    }
};

// ─── DRAG AND DROP NATIVE HANDLERS ───
let dragSource = null;

window.onDragStartSection = function(e, paperId, secId, idx) {
    dragSource = { type: 'section', paperId, secId, index: idx };
    e.dataTransfer.effectAllowed = 'move';
};

window.onDragStartQuestion = function(e, paperId, secId, qId, idx) {
    dragSource = { type: 'question', paperId, secId, qId, index: idx };
    e.dataTransfer.effectAllowed = 'move';
};

window.onDragStartOption = function(e, paperId, secId, qId, oIdx) {
    dragSource = { type: 'option', paperId, secId, qId, index: oIdx };
    e.dataTransfer.effectAllowed = 'move';
};

window.onDragOver = function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};

window.onDropSection = function(e, targetIdx) {
    e.preventDefault();
    if (!dragSource || dragSource.type !== 'section') return;

    const paper = window.state.papers.find(p => p.id === dragSource.paperId);
    if (!paper) return;

    const srcIdx = dragSource.index;
    if (srcIdx === targetIdx) return;

    const [moved] = paper.sections.splice(srcIdx, 1);
    paper.sections.splice(targetIdx, 0, moved);

    dragSource = null;
    window.render();
    window.toast('📂 Sections reordered');
};

window.onDropQuestion = function(e, targetSecId, targetIdx) {
    e.preventDefault();
    if (!dragSource || dragSource.type !== 'question') return;

    const paper = window.state.papers.find(p => p.id === dragSource.paperId);
    if (!paper) return;

    const srcSec = paper.sections.find(s => s.id === dragSource.secId);
    const targetSec = paper.sections.find(s => s.id === targetSecId);
    if (!srcSec || !targetSec) return;

    const srcIdx = dragSource.index;

    if (srcSec.id === targetSec.id) {
        if (srcIdx === targetIdx) return;
        const [moved] = srcSec.questions.splice(srcIdx, 1);
        srcSec.questions.splice(targetIdx, 0, moved);
    } else {
        const [moved] = srcSec.questions.splice(srcIdx, 1);
        targetSec.questions.splice(targetIdx, 0, moved);
    }

    dragSource = null;
    window.render();
    window.toast('✏️ Questions reordered');
};

window.onDropOption = function(e, targetQId, targetIdx) {
    e.preventDefault();
    if (!dragSource || dragSource.type !== 'option') return;

    const paper = window.state.papers.find(p => p.id === dragSource.paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === dragSource.secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === dragSource.qId);
    if (!q || q.id !== targetQId) return;

    const srcIdx = dragSource.index;
    if (srcIdx === targetIdx) return;

    const [moved] = q.options.splice(srcIdx, 1);
    q.options.splice(targetIdx, 0, moved);

    dragSource = null;
    window.render();
    window.toast('➕ Option order updated');
};

// Clipboard paste listener to insert diagrams directly in question editor cards
document.addEventListener('paste', (e) => {
    const activeEl = document.activeElement;
    if (activeEl && activeEl.classList.contains('contenteditable-editor')) {
        const items = (e.clipboardData || e.originalEvent.clipboardData || {}).items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') === 0) {
                e.preventDefault();
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                reader.onload = function(event) {
                    const base64 = event.target.result;
                    const qCard = activeEl.closest('.editor-q-card');
                    if (qCard) {
                        const qId = qCard.dataset.qId;
                        const secId = qCard.dataset.secId;
                        const paperId = window.state.activePaperId;
                        
                        const paper = window.state.papers.find(p => p.id === paperId);
                        if (paper) {
                            const sec = paper.sections.find(s => s.id === secId);
                            if (sec) {
                                const q = sec.questions.find(q => q.id === qId);
                                if (q) {
                                    q.image = base64;
                                    window.render();
                                    window.toast('📷 Diagram pasted from clipboard!');
                                }
                            }
                        }
                    }
                };
                reader.readAsDataURL(blob);
                break;
            }
        }
    }
});
