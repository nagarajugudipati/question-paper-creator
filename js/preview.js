// js/preview.js

window.renderPrintPreview = function() {
    const paper = window.state.papers.find(p => String(p.id) === String(window.state.activePaperId));
    if (!paper) return;

    // Safety checks / Schema normalization
    if (!paper.header) {
        paper.header = window.createDefaultHeader ? window.createDefaultHeader(paper.name) : {};
    }
    if (!paper.sections) paper.sections = [];
    paper.sections.forEach(sec => {
        if (!sec.questions) sec.questions = [];
    });

    const mode = document.getElementById('previewCopyMode').value; // 'question' | 'answer'
    const sheet = document.getElementById('printSheet');
    if (!sheet) return;

    const h = paper.header;

    // Build School Exam Header block
    const logoAlign = h.logoAlignment || 'left';
    const logoW = h.logoWidth || 80;
    const logoH = h.logoHeight || 80;

    let logoHtml = '';
    if (h.logo) {
        logoHtml = `
            <div class="logo-preview-wrapper" style="position: relative; display: inline-block; width: ${logoW}px; height: ${logoH}px; max-width: 100%; border: 1px solid transparent; flex-shrink: 0;" id="logo-box">
                <img src="${h.logo}" style="width: 100%; height: 100%; object-fit: contain; display: block; cursor: pointer;" id="logo-el" onclick="window.selectLogo(event)" />
                
                <!-- Logo Resize Handles (only when selected) -->
                ${window.logoSelected ? `
                    <div class="logo-resize-handle-border" style="position: absolute; inset: 0; border: 2px solid var(--primary-color); pointer-events: none;"></div>
                    <div class="logo-resize-handle top-left" onmousedown="window.startLogoResize(event, '${paper.id}', 'top-left')" style="position: absolute; width: 8px; height: 8px; background: var(--primary-color); border: 1px solid #fff; top: -4px; left: -4px; cursor: nwse-resize; z-index: 10;"></div>
                    <div class="logo-resize-handle top-right" onmousedown="window.startLogoResize(event, '${paper.id}', 'top-right')" style="position: absolute; width: 8px; height: 8px; background: var(--primary-color); border: 1px solid #fff; top: -4px; right: -4px; cursor: nesw-resize; z-index: 10;"></div>
                    <div class="logo-resize-handle bottom-left" onmousedown="window.startLogoResize(event, '${paper.id}', 'bottom-left')" style="position: absolute; width: 8px; height: 8px; background: var(--primary-color); border: 1px solid #fff; bottom: -4px; left: -4px; cursor: nesw-resize; z-index: 10;"></div>
                    <div class="logo-resize-handle bottom-right" onmousedown="window.startLogoResize(event, '${paper.id}', 'bottom-right')" style="position: absolute; width: 8px; height: 8px; background: var(--primary-color); border: 1px solid #fff; bottom: -4px; right: -4px; cursor: nwse-resize; z-index: 10;"></div>
                    
                    <div id="logo-size-badge" style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-bottom: 4px; white-space: nowrap; z-index: 10;">
                        ${logoW} x ${logoH} px
                    </div>
                ` : ''}
            </div>
        `;
    }

    let headerContentHtml = '';
    if (h.logo) {
        if (logoAlign === 'left') {
            headerContentHtml = `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%;">
                    ${logoHtml}
                    <div style="flex-grow: 1; text-align: center;">
                        <div class="paper-school-name" style="font-size: 20px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">${window.escHtml(h.schoolName)}</div>
                        <div class="paper-exam-name" style="font-size: 15px; font-weight: bold; margin-bottom: 12px;">${window.escHtml(h.examName)}</div>
                    </div>
                    <div class="logo-spacer" style="width: ${logoW}px; flex-shrink: 0;"></div>
                </div>
            `;
        } else if (logoAlign === 'right') {
            headerContentHtml = `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%;">
                    <div class="logo-spacer" style="width: ${logoW}px; flex-shrink: 0;"></div>
                    <div style="flex-grow: 1; text-align: center;">
                        <div class="paper-school-name" style="font-size: 20px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">${window.escHtml(h.schoolName)}</div>
                        <div class="paper-exam-name" style="font-size: 15px; font-weight: bold; margin-bottom: 12px;">${window.escHtml(h.examName)}</div>
                    </div>
                    ${logoHtml}
                </div>
            `;
        } else { // Center
            headerContentHtml = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; width: 100%; text-align: center;">
                    ${logoHtml}
                    <div>
                        <div class="paper-school-name" style="font-size: 20px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">${window.escHtml(h.schoolName)}</div>
                        <div class="paper-exam-name" style="font-size: 15px; font-weight: bold; margin-bottom: 12px;">${window.escHtml(h.examName)}</div>
                    </div>
                </div>
            `;
        }
    } else {
        headerContentHtml = `
            <div style="text-align: center; width: 100%;">
                <div class="paper-school-name" style="font-size: 20px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">${window.escHtml(h.schoolName)}</div>
                <div class="paper-exam-name" style="font-size: 15px; font-weight: bold; margin-bottom: 12px;">${window.escHtml(h.examName)}</div>
            </div>
        `;
    }

    let html = `
        <div class="paper-header-block" data-logo-align="${logoAlign}" data-logo-w="${logoW}" data-logo-h="${logoH}" style="margin-bottom: 20px;">
            ${headerContentHtml}
        </div>

        <div class="paper-meta-grid">
            <div><strong>Grade/Class:</strong> ${window.escHtml(h.grade)}</div>
            <div><strong>Subject:</strong> ${window.escHtml(h.subject)}</div>
            <div><strong>Time Allowed:</strong> ${window.escHtml(h.timeAllowed)}</div>
            <div><strong>Maximum Marks:</strong> ${window.escHtml(h.maxMarks)}</div>
        </div>
    `;

    // Candidate details block
    if (h.showStudentDetails) {
        html += `
            <div class="paper-student-details">
                <div><strong>Candidate Name:</strong> _________________________________________</div>
                <div><strong>Roll No:</strong> ______________________</div>
                <div><strong>Grade/Class & Section:</strong> ___________________________________</div>
                <div><strong>Date:</strong> _________________________</div>
            </div>
        `;
    }

    // General Instructions
    if (h.instructions && h.instructions.filter(i => i.trim()).length > 0) {
        html += `
            <div class="paper-instructions">
                <h5>General Instructions:</h5>
                <ol>
                    ${h.instructions.filter(i => i.trim()).map(ins => `<li>${window.escHtml(ins)}</li>`).join('')}
                </ol>
            </div>
        `;
    }

    let absoluteQIndex = 1;
    let answerMatrix = [];

    paper.sections.forEach(sec => {
        if (sec.questions.length === 0) return;
        html += `
            <div class="paper-section-title" style="display: flex; justify-content: space-between; align-items: center;">
                <span>${window.escHtml(sec.name)}</span>
                <span class="paper-section-marks-badge" style="font-weight: bold; font-size: 13px;">[${sec.sectionMarks || 0} Marks]</span>
            </div>
        `;

        sec.questions.forEach(q => {
            html += `
                <div class="paper-q-row" data-q-id="${q.id}">
                    <div class="paper-q-body">
                        <strong>Q${absoluteQIndex}.</strong> ${q.text || '(empty question text)'}
            `;

            // Diagram image
            if (q.image) {
                const align = q.imageAlignment || 'left';
                const w = q.imageWidth ? `${q.imageWidth}px` : 'auto';
                const h = q.imageHeight ? `${q.imageHeight}px` : 'auto';
                html += `
                    <div class="paper-q-img-wrapper" style="text-align: ${align}; margin: 8px 0; max-width: 100%;">
                        <img src="${q.image}" class="paper-q-img" style="width: ${w}; height: ${h}; max-width: 100%; object-fit: contain;" />
                    </div>
                `;
            }

            // Options block (using CSS grid and flex for perfect alignments)
            if (q.type === 'MCQ' || q.type === 'True/False') {
                html += `<div class="paper-options-grid ${q.layout}">`;
                const labels = Array.from({ length: q.options.length }, (_, i) => String.fromCharCode(65 + i));
                let correctOptLabel = '-';

                q.options.forEach((opt, oIdx) => {
                    const isCorrect = !!opt.isCorrect;
                    if (isCorrect) correctOptLabel = labels[oIdx];

                    const hlClass = (mode === 'answer' && isCorrect) ? 'correct-highlight' : '';
                    const correctPrefix = (mode === 'answer' && isCorrect) ? '★ ' : '';

                    html += `
                        <div class="paper-opt ${hlClass}">
                            <span class="paper-opt-letter">(${labels[oIdx]})</span>
                            <span class="paper-opt-text">${correctPrefix}${opt.text || ''}</span>
                        </div>
                    `;
                });

                answerMatrix.push({ num: absoluteQIndex, ans: correctOptLabel });
                html += `</div>`;

            } else if (q.type === 'Match') {
                html += `<div class="paper-match-grid">`;
                const shuffledRight = window.getShuffledRightColumn(q.matches, q.id);
                
                q.matches.forEach((pair, idx) => {
                    const leftLabel = idx + 1;
                    const rightLabel = String.fromCharCode(97 + idx); // a, b, c...
                    const rightItem = shuffledRight[idx];

                    html += `
                        <div class="paper-match-row">
                            <span>${leftLabel}. ${pair.left}</span>
                            <span>(${rightLabel}) ${rightItem.right}</span>
                        </div>
                    `;
                });
                html += `</div>`;

                let correctMap = q.matches.map((orig, oIdx) => {
                    const shuffledIdx = shuffledRight.findIndex(sr => sr.origIdx === oIdx);
                    const shuffledLetter = String.fromCharCode(97 + shuffledIdx);
                    return `${oIdx + 1}-${shuffledLetter}`;
                }).join(', ');

                answerMatrix.push({ num: absoluteQIndex, ans: correctMap });

            } else if (q.type === 'Fill in the Blank') {
                if (mode === 'answer' && q.explanation) {
                    html += `
                        <div style="margin-top: 4px; font-weight: bold; text-decoration: underline; color: #16a34a;">
                            [Answer: ${window.escHtml(q.explanation)}]
                        </div>
                    `;
                    answerMatrix.push({ num: absoluteQIndex, ans: q.explanation });
                } else {
                    answerMatrix.push({ num: absoluteQIndex, ans: '______' });
                }

            } else if (q.type === 'Short Answer' || q.type === 'Long Answer') {
                if (mode === 'answer' && q.explanation) {
                    html += `
                        <div style="margin-top: 6px; font-style: italic; color: #16a34a; background: #f0fdf4; border-left: 2px solid #16a34a; padding: 4px 8px; font-size: 11px;">
                            <strong>Solution Rubric:</strong> ${window.escHtml(q.explanation)}
                        </div>
                    `;
                }
                answerMatrix.push({ num: absoluteQIndex, ans: 'Rubric / Short Answer' });
            }

            const marksHTML = '';

            html += `
                    </div>
                    ${marksHTML}
                </div>
            `;
            absoluteQIndex++;
        });
    });

    // Score sheet Answer Key table
    if (mode === 'answer' && answerMatrix.length > 0) {
        html += `
            <div class="paper-answer-matrix">
                <h4>🔑 Exam Paper Answer Key Matrix</h4>
                <div class="paper-matrix-grid">
                    ${answerMatrix.map(cell => `
                        <div class="paper-matrix-cell">
                            <strong>Q${cell.num}:</strong> ${cell.ans}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    sheet.innerHTML = html;

    // Convert preview equations to read-only static text
    sheet.querySelectorAll('math-field').forEach(mf => {
        mf.setAttribute('read-only', 'true');
    });

    window.applyZoom();
};

window.zoomPreview = function(direction) {
    window.previewScale += direction * 0.1;
    window.previewScale = Math.min(2.0, Math.max(0.5, window.previewScale));
    window.applyZoom();
};

window.applyZoom = function() {
    const sheet = document.getElementById('printSheet');
    if (sheet) {
        sheet.style.zoom = window.previewScale;
    }
};

window.getShuffledRightColumn = function(matches, questionId) {
    let seed = 0;
    for (let i = 0; i < questionId.length; i++) seed += questionId.charCodeAt(i);
    
    let list = matches.map((m, idx) => ({ right: m.right, origIdx: idx }));
    
    for (let i = list.length - 1; i > 0; i--) {
        const j = (seed + i) % (i + 1);
        const temp = list[i];
        list[i] = list[j];
        list[j] = temp;
    }
    return list;
};
