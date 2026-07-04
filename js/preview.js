// js/preview.js

window.renderPrintPreview = function() {
    const paper = window.state.papers.find(p => p.id === window.state.activePaperId);
    if (!paper) return;

    const mode = document.getElementById('previewCopyMode').value; // 'question' | 'answer'
    const sheet = document.getElementById('printSheet');
    if (!sheet) return;

    const h = paper.header;

    // Build School Exam Header block
    let html = `
        <div class="paper-header-block">
            <div class="paper-school-name">${window.escHtml(h.schoolName)}</div>
            <div class="paper-exam-name">${window.escHtml(h.examName)}</div>
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
        html += `<div class="paper-section-title">${window.escHtml(sec.name)}</div>`;

        sec.questions.forEach(q => {
            html += `
                <div class="paper-q-row">
                    <div class="paper-q-body">
                        <strong>Q${absoluteQIndex}.</strong> ${q.text || '(empty question text)'}
            `;

            // Diagram image
            if (q.image) {
                html += `<img src="${q.image}" class="paper-q-img" />`;
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

            const showQMarks = (paper.header.showMarks !== false) && (parseFloat(q.marks) > 0);
            const marksHTML = showQMarks ? `<div class="paper-q-marks">[${q.marks}]</div>` : '';

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
