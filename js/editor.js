window.renderEditor = function(paper) {
    const area = document.getElementById('editorArea');
    if (!area) return;

    if (!paper) {
        area.innerHTML = `
            <div style="text-align:center;padding:40px;color:var(--text-muted); font-size:13px;">
                <h3>No active paper</h3>
                <p style="font-size:13px;margin-top:8px;">Create a folder or paper in the tree on the left to start.</p>
            </div>
        `;
        return;
    }

    // Safety checks / Schema normalization on load
    if (!paper.header) {
        paper.header = window.createDefaultHeader ? window.createDefaultHeader(paper.name) : {
            schoolName: 'Public Examination High School',
            examName: 'Summative Examination - I 2026',
            subject: paper.name || 'General Subject',
            grade: 'Class VIII',
            timeAllowed: '2 Hours',
            maxMarks: '50',
            instructions: [
                'Answer all the questions.',
                'Check details block before attempting.',
                'Right side numbers represent question marks.'
            ],
            showStudentDetails: true,
            showMarks: true
        };
    }
    if (!paper.sections) paper.sections = [];
    
    // Normalize nested sections and questions
    paper.sections.forEach(sec => {
        if (!sec.questions) sec.questions = [];
        sec.questions.forEach(q => {
            if (!q.options) q.options = [];
            if (!q.matches) q.matches = [];
            if (q.marks === undefined) q.marks = 1;
            if (!q.difficulty) q.difficulty = 'Medium';
            if (!q.type) q.type = 'MCQ';
        });
    });

    let html = `
        <!-- Title input row -->
        <div class="editor-paper-title-row">
            <input type="text" value="${window.escHtml(paper.name)}" 
                   class="paper-title-input"
                   onchange="window.renamePaper('${paper.id}', this.value)" 
                   placeholder="Sample Paper - IX IIT" />
            
            <div class="paper-actions-toolbar">
                <button class="toolbar-action-btn btn-primary-outline" onclick="window.addSection('${paper.id}')">+ Section</button>
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
                <!-- School Logo settings group -->
                <div class="setting-group" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 8px; width: 100%;">
                    <label style="font-weight: 700; font-size: 12px; color: var(--text-dark); display: block; margin-bottom: 4px;">School Logo</label>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 6px;">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div id="logoPreviewContainer" style="width: 80px; height: 80px; border: 1px dashed var(--border-color); border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #f8fafc; overflow: hidden; flex-shrink: 0;">
                                ${paper.header.logo ? `<img src="${paper.header.logo}" style="width: 100%; height: 100%; object-fit: contain;" />` : `<span style="font-size: 20px; color: var(--text-muted);">🏫</span>`}
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <input type="file" id="logoFileInput" accept="image/png, image/jpeg, image/jpg, image/webp" style="display: none;" onchange="window.handleLogoUpload('${paper.id}', event)" />
                                <div style="display: flex; gap: 8px;">
                                    <button class="btn-primary" style="padding: 4px 10px; font-size: 11.5px; border-radius: 4px; cursor: pointer; border: none; font-family: inherit;" onclick="document.getElementById('logoFileInput').click()">
                                        ${paper.header.logo ? 'Replace Logo' : 'Upload School Logo'}
                                    </button>
                                    ${paper.header.logo ? `<button class="btn-danger-outline" style="padding: 4px 10px; font-size: 11.5px; border-radius: 4px; cursor: pointer; font-family: inherit;" onclick="window.removeLogo('${paper.id}')">Remove Logo</button>` : ''}
                                </div>
                                <span style="font-size: 10px; color: var(--text-muted);">Supports PNG, JPG, JPEG, WebP.</span>
                            </div>
                        </div>
                        
                        ${paper.header.logo ? `
                            <div style="display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border-color); padding: 8px; border-radius: 6px; background: #f8fafc; font-size: 11px; width: 100%;">
                                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                    <div style="display: flex; align-items: center; gap: 4px;">
                                        <strong>W:</strong>
                                        <input type="number" id="logo-ctrl-w" value="${paper.header.logoWidth || 80}" style="width: 55px; padding: 2px 4px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 11px;" onchange="window.setLogoWidth('${paper.id}', this.value)" />
                                        <strong>H:</strong>
                                        <input type="number" id="logo-ctrl-h" value="${paper.header.logoHeight || 80}" style="width: 55px; padding: 2px 4px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 11px;" onchange="window.setLogoHeight('${paper.id}', this.value)" />
                                        <label style="display: flex; align-items: center; gap: 2px; cursor: pointer; user-select: none; font-weight: bold;">
                                            <input type="checkbox" id="logo-ctrl-lock" ${paper.header.logoLockAspect !== false ? 'checked' : ''} onchange="window.setLogoLockAspect('${paper.id}', this.checked)" /> Lock
                                        </label>
                                    </div>
                                    <div style="width: 1px; height: 14px; background: #cbd5e1;"></div>
                                    <div style="display: flex; gap: 4px;">
                                        <button class="btn-secondary" style="padding: 2px 6px; font-size: 10px; ${paper.header.logoAlignment === 'left' || !paper.header.logoAlignment ? 'background: var(--primary-color); color:#fff;' : ''}" onclick="window.setLogoAlign('${paper.id}', 'left')">Left</button>
                                        <button class="btn-secondary" style="padding: 2px 6px; font-size: 10px; ${paper.header.logoAlignment === 'center' ? 'background: var(--primary-color); color:#fff;' : ''}" onclick="window.setLogoAlign('${paper.id}', 'center')">Center</button>
                                        <button class="btn-secondary" style="padding: 2px 6px; font-size: 10px; ${paper.header.logoAlignment === 'right' ? 'background: var(--primary-color); color:#fff;' : ''}" onclick="window.setLogoAlign('${paper.id}', 'right')">Right</button>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                                    <button class="btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="window.setLogoSizePreset('${paper.id}', 60)">Small</button>
                                    <button class="btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="window.setLogoSizePreset('${paper.id}', 100)">Medium</button>
                                    <button class="btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="window.setLogoSizePreset('${paper.id}', 150)">Large</button>
                                    <button class="btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="window.setLogoReset('${paper.id}')">Reset Size</button>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
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
                No sections yet. Click + Add Section to start creating your question paper.
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
                        
                        <div class="section-marks-control" style="display: flex; align-items: center; gap: 4px; margin-left: 12px; margin-right: 12px;">
                            <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); white-space: nowrap;">Section Marks:</span>
                            <input type="number" value="${sec.sectionMarks !== undefined ? sec.sectionMarks : 0}" style="width: 45px; padding: 2px 4px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 12px; font-weight: 600;" onchange="window.setSectionMarks('${paper.id}', '${sec.id}', this.value)" min="0" />
                        </div>
                        
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
                    ${diffDropdown}
                </div>
                <div class="editor-q-actions">
                    <button class="section-add-q-btn" onclick="window.addQuestion('${paper.id}', '${sec.id}', '${q.id}')">+ Add Question</button>
                    <button class="icon-action-btn" onclick="window.saveQuestionForReuse('${paper.id}', '${sec.id}', '${q.id}')" title="Save for Reuse">💾</button>
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
                        <div class="q-image-editor-section" style="text-align: ${q.imageAlignment || 'left'}; margin: 10px 0;">
                            <div class="q-image-resizable-box" style="position: relative; display: inline-block; width: ${q.imageWidth ? q.imageWidth + 'px' : 'auto'}; height: ${q.imageHeight ? q.imageHeight + 'px' : 'auto'}; max-width: 100%; border: 1px solid ${window.selectedImageId === q.id ? 'var(--primary-color)' : 'transparent'}; border-radius: 4px; padding: 2px;" id="img-box-${q.id}">
                                <img src="${q.image}" style="max-width: 100%; max-height: 400px; display: block; width: 100%; height: 100%; object-fit: contain; cursor: pointer;" id="img-el-${q.id}" onclick="window.selectQuestionImage('${paper.id}', '${sec.id}', '${q.id}')" />
                                
                                <!-- Resize Handles (Only show when selected) -->
                                ${window.selectedImageId === q.id ? `
                                    <div class="resize-handle top-left" onmousedown="window.startImageResize(event, '${paper.id}', '${sec.id}', '${q.id}', 'top-left')" style="position: absolute; width: 8px; height: 8px; background: var(--primary-color); border: 1px solid #fff; top: -4px; left: -4px; cursor: nwse-resize; z-index: 10;"></div>
                                    <div class="resize-handle top-right" onmousedown="window.startImageResize(event, '${paper.id}', '${sec.id}', '${q.id}', 'top-right')" style="position: absolute; width: 8px; height: 8px; background: var(--primary-color); border: 1px solid #fff; top: -4px; right: -4px; cursor: nesw-resize; z-index: 10;"></div>
                                    <div class="resize-handle bottom-left" onmousedown="window.startImageResize(event, '${paper.id}', '${sec.id}', '${q.id}', 'bottom-left')" style="position: absolute; width: 8px; height: 8px; background: var(--primary-color); border: 1px solid #fff; bottom: -4px; left: -4px; cursor: nesw-resize; z-index: 10;"></div>
                                    <div class="resize-handle bottom-right" onmousedown="window.startImageResize(event, '${paper.id}', '${sec.id}', '${q.id}', 'bottom-right')" style="position: absolute; width: 8px; height: 8px; background: var(--primary-color); border: 1px solid #fff; bottom: -4px; right: -4px; cursor: nwse-resize; z-index: 10;"></div>
                                    
                                    <!-- Tooltip showing size -->
                                    <div id="img-size-badge-${q.id}" style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-bottom: 4px; white-space: nowrap; z-index: 10;">
                                        ${q.imageWidth || 'Auto'} x ${q.imageHeight || 'Auto'} px
                                    </div>
                                ` : ''}
                            </div>
                            
                            <!-- Control Toolbar -->
                            ${window.selectedImageId === q.id ? `
                                <div class="q-image-controls-bar" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 6px; padding: 6px; border: 1px solid var(--border-color); border-radius: 6px; background: #f8fafc; font-size: 11px; width: fit-content; max-width: 100%;">
                                    <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                                        <strong>W:</strong>
                                        <input type="number" id="img-ctrl-w-${q.id}" value="${q.imageWidth || ''}" placeholder="Auto" style="width: 55px; padding: 2px 4px; font-size: 11px; border: 1px solid var(--border-color); border-radius: 4px;" onchange="window.setQuestionImageWidth('${paper.id}', '${sec.id}', '${q.id}', this.value)" />
                                        <strong>H:</strong>
                                        <input type="number" id="img-ctrl-h-${q.id}" value="${q.imageHeight || ''}" placeholder="Auto" style="width: 55px; padding: 2px 4px; font-size: 11px; border: 1px solid var(--border-color); border-radius: 4px;" onchange="window.setQuestionImageHeight('${paper.id}', '${sec.id}', '${q.id}', this.value)" />
                                        <label style="display: flex; align-items: center; gap: 2px; cursor: pointer; user-select: none; font-weight: bold;">
                                            <input type="checkbox" id="img-ctrl-lock-${q.id}" ${q.imageLockAspect !== false ? 'checked' : ''} onchange="window.setQuestionImageLockAspect('${paper.id}', '${sec.id}', '${q.id}', this.checked)" /> Lock
                                        </label>
                                    </div>
                                    <div style="width: 1px; height: 14px; background: #cbd5e1;"></div>
                                    <div style="display: flex; gap: 4px;">
                                        <button class="btn-secondary" style="padding: 2px 6px; font-size: 10px; ${q.imageAlignment === 'left' || !q.imageAlignment ? 'background: var(--primary-color); color:#fff;' : ''}" onclick="window.setQuestionImageAlign('${paper.id}', '${sec.id}', '${q.id}', 'left')">Left</button>
                                        <button class="btn-secondary" style="padding: 2px 6px; font-size: 10px; ${q.imageAlignment === 'center' ? 'background: var(--primary-color); color:#fff;' : ''}" onclick="window.setQuestionImageAlign('${paper.id}', '${sec.id}', '${q.id}', 'center')">Center</button>
                                        <button class="btn-secondary" style="padding: 2px 6px; font-size: 10px; ${q.imageAlignment === 'right' ? 'background: var(--primary-color); color:#fff;' : ''}" onclick="window.setQuestionImageAlign('${paper.id}', '${sec.id}', '${q.id}', 'right')">Right</button>
                                    </div>
                                    <div style="width: 1px; height: 14px; background: #cbd5e1;"></div>
                                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                                        <button class="btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="window.setQuestionImageSizePreset('${paper.id}', '${sec.id}', '${q.id}', 150)">Small</button>
                                        <button class="btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="window.setQuestionImageSizePreset('${paper.id}', '${sec.id}', '${q.id}', 300)">Medium</button>
                                        <button class="btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="window.setQuestionImageSizePreset('${paper.id}', '${sec.id}', '${q.id}', 500)">Large</button>
                                        <button class="btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="window.setQuestionImageSizePreset('${paper.id}', '${sec.id}', '${q.id}', 'fit')">Fit</button>
                                        <button class="btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="window.setQuestionImageReset('${paper.id}', '${sec.id}', '${q.id}')">Reset</button>
                                    </div>
                                    <div style="width: 1px; height: 14px; background: #cbd5e1;"></div>
                                    <button class="btn-danger-outline" style="padding: 2px 6px; font-size: 10px;" onclick="window.removeQuestionImage('${paper.id}', '${sec.id}', '${q.id}')">Remove</button>
                                </div>
                            ` : ''}
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
                     ondragover="window.onDragOver(event)"
                     ondrop="window.onDropOption(event, '${q.id}', ${oIdx})">
                    <span class="opt-drag-handle" 
                          draggable="true" 
                          ondragstart="window.onDragStartOption(event, '${paper.id}', '${sec.id}', '${q.id}', ${oIdx})">⋮⋮</span>
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
        questions: [],
        sectionMarks: 10
    };
    paper.sections.push(sec);
    
    // Recalculate Maximum Marks
    const total = paper.sections.reduce((sum, s) => sum + (parseFloat(s.sectionMarks) || 0), 0);
    paper.header.maxMarks = String(total);
    
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
    
    // Recalculate Maximum Marks
    const total = paper.sections.reduce((sum, s) => sum + (parseFloat(s.sectionMarks) || 0), 0);
    paper.header.maxMarks = String(total);
    
    window.render();
    window.toast('🗑️ Section deleted');
};

window.setSectionMarks = function(paperId, secId, val) {
    const paper = window.state.papers.find(p => String(p.id) === String(paperId));
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (sec) {
        const numericVal = parseFloat(val);
        sec.sectionMarks = isNaN(numericVal) ? 0 : numericVal;
        
        // Recalculate Maximum Marks
        const total = paper.sections.reduce((sum, s) => sum + (parseFloat(s.sectionMarks) || 0), 0);
        paper.header.maxMarks = String(total);
        
        window.triggerAutosave();
        window.render(true);
    }
};

// ─── Questions mutations ───
window.addQuestion = function(paperId, secId, insertAfterQuestionId = null) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;

    const q = {
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        type: 'MCQ',
        text: '',
        difficulty: 'Medium',
        layout: 'row',
        options: [
            { id: 'opt_' + Date.now() + '_0', text: '', isCorrect: false },
            { id: 'opt_' + Date.now() + '_1', text: '', isCorrect: false },
            { id: 'opt_' + Date.now() + '_2', text: '', isCorrect: false },
            { id: 'opt_' + Date.now() + '_3', text: '', isCorrect: false }
        ]
    };

    if (insertAfterQuestionId) {
        const idx = sec.questions.findIndex(item => item.id === insertAfterQuestionId);
        if (idx !== -1) {
            sec.questions.splice(idx + 1, 0, q);
        } else {
            sec.questions.push(q);
        }
    } else {
        sec.questions.push(q);
    }
    
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

        const imgObj = new Image();
        imgObj.onload = function() {
            const paper = window.state.papers.find(p => p.id === paperId);
            if (!paper) return;
            const sec = paper.sections.find(s => s.id === secId);
            if (!sec) return;
            const q = sec.questions.find(q => q.id === qId);
            if (q) {
                q.image = base64;
                q.imageWidth = imgObj.width || 300;
                q.imageHeight = imgObj.height || 200;
                q.imageAlignment = 'left';
                q.imageLockAspect = true;
                window.saveState();
                window.render();
            }
        };
        imgObj.src = base64;
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
                        
                        const imgObj = new Image();
                        imgObj.onload = function() {
                            const paper = window.state.papers.find(p => p.id === paperId);
                            if (paper) {
                                const sec = paper.sections.find(s => s.id === secId);
                                if (sec) {
                                    const q = sec.questions.find(q => q.id === qId);
                                    if (q) {
                                        q.image = base64;
                                        q.imageWidth = imgObj.width || 300;
                                        q.imageHeight = imgObj.height || 200;
                                        q.imageAlignment = 'left';
                                        q.imageLockAspect = true;
                                        window.saveState();
                                        window.render();
                                        window.toast('📷 Diagram pasted from clipboard!');
                                    }
                                }
                            }
                        };
                        imgObj.src = base64;
                    }
                };
                reader.readAsDataURL(blob);
                break;
            }
        }
    }
});

window.handleLogoUpload = function(paperId, event) {
    const file = event.target.files[0];
    if (!file) return;

    const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
        window.toast("⚠️ Error: Unsupported file format. Please upload PNG, JPG, JPEG, or WebP.");
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;
        const imgObj = new Image();
        imgObj.onload = function() {
            const paper = window.state.papers.find(p => p.id === paperId);
            if (paper) {
                if (!paper.header) paper.header = {};
                paper.header.logo = base64Data;
                paper.header.logoWidth = imgObj.width || 80;
                paper.header.logoHeight = imgObj.height || 80;
                paper.header.logoAlignment = paper.header.logoAlignment || 'left';
                paper.header.logoLockAspect = true;
                window.saveState();
                window.render();
                if (window.renderPrintPreview) window.renderPrintPreview();
                window.toast("🏫 School logo uploaded successfully!");
            }
        };
        imgObj.src = base64Data;
    };
    reader.onerror = function() {
        window.toast("⚠️ Error: Failed to read image file.");
    };
    reader.readAsDataURL(file);
};

window.removeLogo = function(paperId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (paper) {
        if (paper.header) {
            delete paper.header.logo;
            delete paper.header.logoWidth;
            delete paper.header.logoHeight;
            delete paper.header.logoAlignment;
        }
        window.saveState();
        window.render();
        if (window.renderPrintPreview) window.renderPrintPreview();
        window.toast("🗑️ School logo removed.");
    }
};

// ─── Image Resizing and Alignment Helpers ───
window.selectedImageId = null;
window.activeResizeState = null;

window.selectQuestionImage = function(paperId, secId, qId) {
    if (window.selectedImageId !== qId) {
        window.selectedImageId = qId;
        // Deselect logo if selected
        window.logoSelected = false;
        window.render();
        if (window.renderPrintPreview) window.renderPrintPreview();
    }
};

// Handle deselection on click outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.q-image-resizable-box') && !e.target.closest('.q-image-controls-bar')) {
        if (window.selectedImageId !== null) {
            window.selectedImageId = null;
            window.render();
        }
    }
});

window.startImageResize = function(e, paperId, secId, qId, handleName) {
    e.preventDefault();
    e.stopPropagation();

    const box = document.getElementById(`img-box-${qId}`);
    if (!box) return;

    const startWidth = box.offsetWidth;
    const startHeight = box.offsetHeight;
    const startX = e.clientX;
    const startY = e.clientY;
    const aspectRatio = startWidth / startHeight;

    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === secId);
    if (!sec) return;
    const q = sec.questions.find(q => q.id === qId);
    if (!q) return;

    const onMouseMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;

        if (handleName === 'bottom-right') {
            newWidth = startWidth + deltaX;
            newHeight = startHeight + deltaY;
        } else if (handleName === 'bottom-left') {
            newWidth = startWidth - deltaX;
            newHeight = startHeight + deltaY;
        } else if (handleName === 'top-right') {
            newWidth = startWidth + deltaX;
            newHeight = startHeight - deltaY;
        } else if (handleName === 'top-left') {
            newWidth = startWidth - deltaX;
            newHeight = startHeight - deltaY;
        }

        const lockAspect = q.imageLockAspect !== false;
        if (lockAspect) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                newHeight = newWidth / aspectRatio;
            } else {
                newWidth = newHeight * aspectRatio;
            }
        }

        if (newWidth < 40) newWidth = 40;
        if (newHeight < 40) newHeight = 40;

        const maxWidth = 650;
        if (newWidth > maxWidth) {
            newWidth = maxWidth;
            if (lockAspect) {
                newHeight = newWidth / aspectRatio;
            }
        }

        newWidth = Math.round(newWidth);
        newHeight = Math.round(newHeight);

        box.style.width = newWidth + 'px';
        box.style.height = newHeight + 'px';

        const tooltip = document.getElementById(`img-size-badge-${qId}`);
        if (tooltip) {
            tooltip.textContent = `${newWidth} x ${newHeight} px`;
        }

        const inputW = document.getElementById(`img-ctrl-w-${qId}`);
        const inputH = document.getElementById(`img-ctrl-h-${qId}`);
        if (inputW) inputW.value = newWidth;
        if (inputH) inputH.value = newHeight;

        window.activeResizeState = { width: newWidth, height: newHeight };
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        if (window.activeResizeState) {
            q.imageWidth = window.activeResizeState.width;
            q.imageHeight = window.activeResizeState.height;
            window.activeResizeState = null;
            window.saveState();
            if (window.renderPrintPreview) window.renderPrintPreview();
        }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
};

window.setQuestionImageWidth = function(paperId, secId, qId, val) {
    const paper = window.state.papers.find(p => p.id === paperId);
    const sec = paper ? paper.sections.find(s => s.id === secId) : null;
    const q = sec ? sec.questions.find(q => q.id === qId) : null;
    if (!q) return;

    const w = parseInt(val);
    if (!isNaN(w) && w > 0) {
        if (q.imageLockAspect !== false && q.imageWidth && q.imageHeight) {
            const aspect = q.imageWidth / q.imageHeight;
            q.imageHeight = Math.round(w / aspect);
        }
        q.imageWidth = w;
        window.saveState();
        window.render();
        if (window.renderPrintPreview) window.renderPrintPreview();
    }
};

window.setQuestionImageHeight = function(paperId, secId, qId, val) {
    const paper = window.state.papers.find(p => p.id === paperId);
    const sec = paper ? paper.sections.find(s => s.id === secId) : null;
    const q = sec ? sec.questions.find(q => q.id === qId) : null;
    if (!q) return;

    const h = parseInt(val);
    if (!isNaN(h) && h > 0) {
        if (q.imageLockAspect !== false && q.imageWidth && q.imageHeight) {
            const aspect = q.imageWidth / q.imageHeight;
            q.imageWidth = Math.round(h * aspect);
        }
        q.imageHeight = h;
        window.saveState();
        window.render();
        if (window.renderPrintPreview) window.renderPrintPreview();
    }
};

window.setQuestionImageLockAspect = function(paperId, secId, qId, val) {
    const paper = window.state.papers.find(p => p.id === paperId);
    const sec = paper ? paper.sections.find(s => s.id === secId) : null;
    const q = sec ? sec.questions.find(q => q.id === qId) : null;
    if (!q) return;

    q.imageLockAspect = val;
    window.saveState();
};

window.setQuestionImageAlign = function(paperId, secId, qId, align) {
    const paper = window.state.papers.find(p => p.id === paperId);
    const sec = paper ? paper.sections.find(s => s.id === secId) : null;
    const q = sec ? sec.questions.find(q => q.id === qId) : null;
    if (!q) return;

    q.imageAlignment = align;
    window.saveState();
    window.render();
    if (window.renderPrintPreview) window.renderPrintPreview();
};

window.setQuestionImageSizePreset = function(paperId, secId, qId, size) {
    const paper = window.state.papers.find(p => p.id === paperId);
    const sec = paper ? paper.sections.find(s => s.id === secId) : null;
    const q = sec ? sec.questions.find(q => q.id === qId) : null;
    if (!q) return;

    const img = document.getElementById(`img-el-${qId}`);
    const originalAspect = img ? (img.naturalWidth / img.naturalHeight || 1.33) : 1.33;

    if (size === 'fit') {
        q.imageWidth = 650;
        q.imageHeight = Math.round(650 / originalAspect);
    } else {
        q.imageWidth = size;
        q.imageHeight = Math.round(size / originalAspect);
    }

    window.saveState();
    window.render();
    if (window.renderPrintPreview) window.renderPrintPreview();
};

window.setQuestionImageReset = function(paperId, secId, qId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    const sec = paper ? paper.sections.find(s => s.id === secId) : null;
    const q = sec ? sec.questions.find(q => q.id === qId) : null;
    if (!q) return;

    const img = document.getElementById(`img-el-${qId}`);
    if (img) {
        q.imageWidth = img.naturalWidth || 300;
        q.imageHeight = img.naturalHeight || 200;
        window.saveState();
        window.render();
        if (window.renderPrintPreview) window.renderPrintPreview();
    }
};

// ─── School Logo Resizing and Alignment Helpers ───
window.logoSelected = false;
window.activeLogoResizeState = null;

window.selectLogo = function(e) {
    if (e) {
        e.stopPropagation();
    }
    if (!window.logoSelected) {
        window.logoSelected = true;
        // Deselect question image if selected
        window.selectedImageId = null;
        window.render();
        if (window.renderPrintPreview) window.renderPrintPreview();
    }
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('#logo-box') && !e.target.closest('#logo-ctrl-w') && !e.target.closest('#logo-ctrl-h') && !e.target.closest('#logo-ctrl-lock')) {
        if (window.logoSelected) {
            window.logoSelected = false;
            window.renderPrintPreview();
        }
    }
});

window.startLogoResize = function(e, paperId, handleName) {
    e.preventDefault();
    e.stopPropagation();

    const box = document.getElementById('logo-box');
    if (!box) return;

    const startWidth = box.offsetWidth;
    const startHeight = box.offsetHeight;
    const startX = e.clientX;
    const startY = e.clientY;
    const aspectRatio = startWidth / startHeight;

    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;

    const onMouseMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;

        if (handleName === 'bottom-right') {
            newWidth = startWidth + deltaX;
            newHeight = startHeight + deltaY;
        } else if (handleName === 'bottom-left') {
            newWidth = startWidth - deltaX;
            newHeight = startHeight + deltaY;
        } else if (handleName === 'top-right') {
            newWidth = startWidth + deltaX;
            newHeight = startHeight - deltaY;
        } else if (handleName === 'top-left') {
            newWidth = startWidth - deltaX;
            newHeight = startHeight - deltaY;
        }

        const lockAspect = paper.header.logoLockAspect !== false;
        if (lockAspect) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                newHeight = newWidth / aspectRatio;
            } else {
                newWidth = newHeight * aspectRatio;
            }
        }

        if (newWidth < 20) newWidth = 20;
        if (newHeight < 20) newHeight = 20;

        const maxWidth = 200;
        if (newWidth > maxWidth) {
            newWidth = maxWidth;
            if (lockAspect) {
                newHeight = newWidth / aspectRatio;
            }
        }

        newWidth = Math.round(newWidth);
        newHeight = Math.round(newHeight);

        box.style.width = newWidth + 'px';
        box.style.height = newHeight + 'px';

        const tooltip = document.getElementById('logo-size-badge');
        if (tooltip) {
            tooltip.textContent = `${newWidth} x ${newHeight} px`;
        }

        const inputW = document.getElementById('logo-ctrl-w');
        const inputH = document.getElementById('logo-ctrl-h');
        if (inputW) inputW.value = newWidth;
        if (inputH) inputH.value = newHeight;

        window.activeLogoResizeState = { width: newWidth, height: newHeight };
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        if (window.activeLogoResizeState) {
            paper.header.logoWidth = window.activeLogoResizeState.width;
            paper.header.logoHeight = window.activeLogoResizeState.height;
            window.activeLogoResizeState = null;
            window.saveState();
            window.render();
            if (window.renderPrintPreview) window.renderPrintPreview();
        }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
};

window.setLogoWidth = function(paperId, val) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;

    const w = parseInt(val);
    if (!isNaN(w) && w > 0) {
        if (paper.header.logoLockAspect !== false && paper.header.logoWidth && paper.header.logoHeight) {
            const aspect = paper.header.logoWidth / paper.header.logoHeight;
            paper.header.logoHeight = Math.round(w / aspect);
        }
        paper.header.logoWidth = w;
        window.saveState();
        window.render();
        if (window.renderPrintPreview) window.renderPrintPreview();
    }
};

window.setLogoHeight = function(paperId, val) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;

    const h = parseInt(val);
    if (!isNaN(h) && h > 0) {
        if (paper.header.logoLockAspect !== false && paper.header.logoWidth && paper.header.logoHeight) {
            const aspect = paper.header.logoWidth / paper.header.logoHeight;
            paper.header.logoWidth = Math.round(h * aspect);
        }
        paper.header.logoHeight = h;
        window.saveState();
        window.render();
        if (window.renderPrintPreview) window.renderPrintPreview();
    }
};

window.setLogoLockAspect = function(paperId, val) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;

    paper.header.logoLockAspect = val;
    window.saveState();
};

window.setLogoAlign = function(paperId, align) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;

    paper.header.logoAlignment = align;
    window.saveState();
    window.render();
    if (window.renderPrintPreview) window.renderPrintPreview();
};

window.setLogoSizePreset = function(paperId, size) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;

    const img = document.getElementById('logo-el');
    const aspect = img ? (img.naturalWidth / img.naturalHeight || 1.0) : 1.0;

    paper.header.logoWidth = size;
    paper.header.logoHeight = Math.round(size / aspect);

    window.saveState();
    window.render();
    if (window.renderPrintPreview) window.renderPrintPreview();
};

window.setLogoReset = function(paperId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;

    const img = document.getElementById('logo-el');
    if (img) {
        paper.header.logoWidth = img.naturalWidth || 80;
        paper.header.logoHeight = img.naturalHeight || 80;
        window.saveState();
        window.render();
        if (window.renderPrintPreview) window.renderPrintPreview();
    }
};
