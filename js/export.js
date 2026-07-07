// js/export.js

window.exportDOCX = function(paperId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) { window.toast('⚠️ Paper not found'); return; }
    const html = window.buildExportHTML(paper);
    const blob = new Blob([html], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${paper.name.replace(/\s+/g,'_')}.doc`;
    link.click();
    URL.revokeObjectURL(link.href);
    window.toast('💾 Downloaded Word document');
};

window.exportJSON = function(paperId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) { window.toast('⚠️ Paper not found'); return; }
    const blob = new Blob([JSON.stringify(paper, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${paper.name.replace(/\s+/g,'_')}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    window.toast('💾 Downloaded JSON paper template');
};
window.exportCSV = function(paperId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) { window.toast('⚠️ Paper not found'); return; }
    
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    let rows = [['Section', 'Question Type', 'Question Text', 'Marks', 'Options / Matches / Explanations', 'Correct Answer']];
    
    paper.sections.forEach(sec => {
        sec.questions.forEach(q => {
            const qText = q.text.replace(/<[^>]*>/g, '').replace(/,/g, ';').replace(/\n/g, ' ').trim();
            
            if (q.type === 'MCQ' || q.type === 'True/False') {
                let optsText = [];
                let correctOpt = '';
                q.options.forEach((o, oi) => {
                    const cleanOpt = o.text.replace(/<[^>]*>/g, '').replace(/,/g, ';').replace(/\n/g, ' ').trim();
                    const label = labels[oi] || `O${oi + 1}`;
                    optsText.push(`${label}. ${cleanOpt}`);
                    if (o.isCorrect) correctOpt = label;
                });
                rows.push([
                    sec.name.replace(/,/g, ';'),
                    q.type,
                    qText,
                    q.marks,
                    optsText.join(' | '),
                    correctOpt
                ]);
            } else if (q.type === 'Match') {
                let matchesText = [];
                q.matches.forEach((m, mi) => {
                    const cleanL = m.left.replace(/<[^>]*>/g, '').replace(/,/g, ';').replace(/\n/g, ' ').trim();
                    const cleanR = m.right.replace(/<[^>]*>/g, '').replace(/,/g, ';').replace(/\n/g, ' ').trim();
                    matchesText.push(`${mi + 1}. ${cleanL} = ${cleanR}`);
                });
                rows.push([
                    sec.name.replace(/,/g, ';'),
                    q.type,
                    qText,
                    q.marks,
                    matchesText.join(' | '),
                    'See Matches'
                ]);
            } else {
                const explanation = (q.explanation || '').replace(/,/g, ';').replace(/\n/g, ' ').trim();
                rows.push([
                    sec.name.replace(/,/g, ';'),
                    q.type,
                    qText,
                    q.marks,
                    'Explanation / Key',
                    explanation
                ]);
            }
        });
    });
    
    let csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${paper.name.replace(/\s+/g, '_')}_questions.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    window.toast('💾 Downloaded CSV question sheet');
};

window.exportAllJSON = function() {
    const blob = new Blob([JSON.stringify(window.state.papers, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `all_exam_papers_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    window.toast('💾 Backup downloaded');
};

window.clearAllData = function() {
    if (!confirm('⚠️ This deletes ALL papers and folders permanently! Are you sure?')) return;
    window.state.papers = [];
    window.state.folders = [];
    window.state.activePaperId = null;
    window.saveState();
    window.render();
    window.toast('🗑️ All data cleared');
};

window.getCleanHTMLText = function(html) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('math-field').forEach(mf => {
        let mathML = '';
        if (typeof mf.getValue === 'function') {
            mathML = mf.getValue('mathML');
        }
        if (!mathML && typeof window.MathfieldElement?.latexToMathMl === 'function') {
            mathML = window.MathfieldElement.latexToMathMl(mf.value || '');
        }
        if (!mathML) {
            // Simple fallback
            mathML = `<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>${mf.value || ''}</mi></math>`;
        }
        // Wrap in a span to keep it inline and preserve style
        const span = document.createElement('span');
        span.className = 'docx-math-wrapper';
        span.style.display = 'inline-block';
        span.innerHTML = mathML;
        mf.replaceWith(span);
    });
    return div.innerHTML;
};

window.buildExportHTML = function(paper) {
    const h = paper.header;
    let html = `
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${window.escHtml(paper.name)}</title>
            <style>
                body { font-family: 'Times New Roman', serif; padding: 40px; color: #000; line-height: 1.5; }
                .ex-header { text-align: center; margin-bottom: 20px; }
                .ex-school { font-size: 20px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
                .ex-title { font-size: 15px; font-weight: bold; margin-bottom: 12px; }
                .ex-meta { display: grid; grid-template-columns: 1fr 1fr; font-size: 12px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 0; margin-bottom: 16px; gap: 4px; }
                .ex-student { border: 1px solid #000; padding: 10px; font-size: 12px; margin-bottom: 16px; display: grid; grid-template-columns: 2fr 1fr; gap: 8px 16px; }
                .ex-instr { font-size: 11px; margin-bottom: 20px; }
                .ex-instr ol { padding-left: 20px; }
                .ex-sec { font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1.5px solid #000; margin: 20px 0 10px; padding-bottom: 2px; }
                .ex-q-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
                .ex-q-body { flex-grow: 1; padding-right: 24px; font-size: 12px; }
                .ex-q-marks { font-weight: bold; font-size: 11px; }
                .ex-opts { display: grid; gap: 4px 16px; margin-top: 6px; padding-left: 18px; }
                .ex-opts.row { grid-template-columns: 1fr 1fr 1fr 1fr; }
                .ex-opts.grid2 { grid-template-columns: 1fr 1fr; }
                .ex-opts.column { grid-template-columns: 1fr; }
                .ex-opt { font-size: 11px; }
                .ex-match-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; margin-top: 6px; padding-left: 18px; }
                .ex-match-row { display: flex; justify-content: space-between; font-size: 11px; }
                .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #777; border-top: 1px dashed #ccc; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="ex-header">
                <div class="ex-school">${window.escHtml(h.schoolName)}</div>
                <div class="ex-title">${window.escHtml(h.examName)}</div>
            </div>
            <div class="ex-meta">
                <div><strong>Grade/Class:</strong> ${window.escHtml(h.grade)}</div>
                <div><strong>Subject:</strong> ${window.escHtml(h.subject)}</div>
                <div><strong>Time Allowed:</strong> ${window.escHtml(h.timeAllowed)}</div>
                <div><strong>Maximum Marks:</strong> ${window.escHtml(h.maxMarks)}</div>
            </div>
    `;

    if (h.showStudentDetails) {
        html += `
            <div class="ex-student">
                <div><strong>Candidate Name:</strong> _________________________________________</div>
                <div><strong>Roll No:</strong> ______________________</div>
                <div><strong>Grade/Class & Section:</strong> ___________________________________</div>
                <div><strong>Date:</strong> _________________________</div>
            </div>
        `;
    }

    if (h.instructions && h.instructions.filter(i => i.trim()).length > 0) {
        html += `
            <div class="ex-instr">
                <strong>General Instructions:</strong>
                <ol>
                    ${h.instructions.filter(i => i.trim()).map(ins => `<li>${window.escHtml(ins)}</li>`).join('')}
                </ol>
            </div>
        `;
    }

    let absoluteIndex = 1;
    paper.sections.forEach(sec => {
        if (sec.questions.length === 0) return;
        html += `<div class="ex-sec">${window.escHtml(sec.name)}</div>`;
        
        sec.questions.forEach(q => {
            const cleanQText = window.getCleanHTMLText(q.text);
            html += `
                <div class="ex-q-row">
                    <div class="ex-q-body">
                        <strong>Q${absoluteIndex}.</strong> ${cleanQText}
            `;
            
            if (q.image) {
                html += `<img src="${q.image}" style="max-width:250px;max-height:140px;display:block;margin:6px 0;" />`;
            }

            if (q.type === 'MCQ' || q.type === 'True/False') {
                const labels = Array.from({ length: q.options.length }, (_, i) => String.fromCharCode(65 + i));
                
                if (q.layout === 'row') {
                    // 1x4 horizontal row using tables for Word alignment
                    html += `<table class="ex-opts row" style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 6px;"><tr>`;
                    q.options.forEach((opt, oIdx) => {
                        const cleanOptText = window.getCleanHTMLText(opt.text);
                        const isCorrect = !!opt.isCorrect;
                        const hlStyle = isCorrect ? 'font-weight: bold; text-decoration: underline; color: #16a34a;' : '';
                        const correctPrefix = isCorrect ? '★ ' : '';
                        html += `<td class="ex-opt" style="width: 25%; font-size: 11px; padding: 2px; ${hlStyle}">(${labels[oIdx]}) ${correctPrefix}${cleanOptText}</td>`;
                    });
                    html += `</tr></table>`;
                } else if (q.layout === 'grid2') {
                    // 2x2 grid using tables for Word alignment
                    html += `<table class="ex-opts grid2" style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 6px;">`;
                    for (let rowIdx = 0; rowIdx < 2; rowIdx++) {
                        html += `<tr>`;
                        for (let colIdx = 0; colIdx < 2; colIdx++) {
                            const oIdx = rowIdx * 2 + colIdx;
                            if (q.options[oIdx]) {
                                const opt = q.options[oIdx];
                                const cleanOptText = window.getCleanHTMLText(opt.text);
                                const isCorrect = !!opt.isCorrect;
                                const hlStyle = isCorrect ? 'font-weight: bold; text-decoration: underline; color: #16a34a;' : '';
                                const correctPrefix = isCorrect ? '★ ' : '';
                                html += `<td class="ex-opt" style="width: 50%; font-size: 11px; padding: 2px; ${hlStyle}">(${labels[oIdx]}) ${correctPrefix}${cleanOptText}</td>`;
                            } else {
                                html += `<td style="width: 50%; padding: 2px;"></td>`;
                            }
                        }
                        html += `</tr>`;
                    }
                    html += `</table>`;
                } else {
                    // 4x1 vertical column
                    html += `<table class="ex-opts column" style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 6px;">`;
                    q.options.forEach((opt, oIdx) => {
                        const cleanOptText = window.getCleanHTMLText(opt.text);
                        const isCorrect = !!opt.isCorrect;
                        const hlStyle = isCorrect ? 'font-weight: bold; text-decoration: underline; color: #16a34a;' : '';
                        const correctPrefix = isCorrect ? '★ ' : '';
                        html += `<tr><td class="ex-opt" style="width: 100%; font-size: 11px; padding: 2px; ${hlStyle}">(${labels[oIdx]}) ${correctPrefix}${cleanOptText}</td></tr>`;
                    });
                    html += `</table>`;
                }

            } else if (q.type === 'Match') {
                html += `<table class="ex-match-grid" style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 6px;">`;
                const shuffledRight = window.getShuffledRightColumn(q.matches, q.id);
                q.matches.forEach((pair, idx) => {
                    const leftLabel = idx + 1;
                    const rightLabel = String.fromCharCode(97 + idx);
                    const cleanLeftText = window.getCleanHTMLText(pair.left);
                    const cleanRightText = window.getCleanHTMLText(shuffledRight[idx].right);

                    html += `
                        <tr class="ex-match-row">
                            <td style="width: 50%; font-size: 11px; padding: 2px;">${leftLabel}. ${cleanLeftText}</td>
                            <td style="width: 50%; font-size: 11px; padding: 2px;">(${rightLabel}) ${cleanRightText}</td>
                        </tr>
                    `;
                });
                html += `</table>`;
            }

            const showQMarks = (paper.header.showMarks !== false) && (parseFloat(q.marks) > 0);
            const marksHTML = showQMarks ? `<div class="ex-q-marks">[${q.marks}]</div>` : '';

            html += `
                    </div>
                    ${marksHTML}
                </div>
            `;
            absoluteIndex++;
        });
    });

    // Embed paper state base64 JSON at the end for flawless import, hidden from Word display
    try {
        const base64State = btoa(unescape(encodeURIComponent(JSON.stringify(paper))));
        html += `<div id="paper-state-json" style="display:none !important; mso-hide: all; visibility: hidden; height: 0; width: 0; overflow: hidden;">${base64State}</div>`;
    } catch(e) {
        console.error("Failed to embed paper state JSON", e);
    }

    html += `<div class="footer">Generated by School Paper Builder • ${new Date().toLocaleDateString()}</div>`;
    html += `</body></html>`;
    return html;
};

// ─── Import Document & State Logic ───

window.triggerPaperImport = function() {
    const input = document.getElementById('paperImportInput');
    if (input) input.click();
};

window.loadMammoth = function(callback) {
    if (window.mammoth) {
        callback();
        return;
    }
    window.toast("⏳ Loading Word parser library...");
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
    script.onload = () => {
        window.toast("✅ Word parser loaded successfully");
        callback();
    };
    script.onerror = () => {
        window.toast("❌ Failed to load Mammoth.js library");
    };
    document.head.appendChild(script);
};

window.handlePaperImport = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
        reader.onload = function(evt) {
            window.importJSONContent(evt.target.result);
            e.target.value = '';
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.docx')) {
        // Parse raw binary docx
        window.loadMammoth(() => {
            reader.onload = function(evt) {
                const arrayBuffer = evt.target.result;
                window.mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                    .then(function(result) {
                        window.importHTMLContent(result.value);
                    })
                    .catch(function(err) {
                        window.toast("⚠️ Failed to parse binary DOCX: " + err.message);
                    });
                e.target.value = '';
            };
            reader.readAsArrayBuffer(file);
        });
    } else {
        // .doc file (HTML format)
        reader.onload = function(evt) {
            window.importHTMLContent(evt.target.result);
            e.target.value = '';
        };
        reader.readAsText(file);
    }
};

window.importJSONContent = function(jsonStr) {
    try {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
            window.state.papers = parsed;
            if (parsed.length > 0) window.state.activePaperId = parsed[0].id;
            window.toast("📥 Restored all papers from backup!");
        } else if (parsed && parsed.id) {
            const idExists = window.state.papers.some(p => p.id === parsed.id);
            if (idExists) {
                parsed.id = 'paper_' + Date.now();
                parsed.name = parsed.name + " (Imported)";
            }
            window.state.papers.push(parsed);
            window.state.activePaperId = parsed.id;
            window.toast(`📥 Imported paper: ${parsed.name}`);
        } else {
            throw new Error("Invalid structure");
        }
        window.saveState();
        window.render();
    } catch(e) {
        window.toast("⚠️ Invalid paper JSON format: " + e.message);
    }
};

window.importHTMLContent = function(htmlText) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        // 1. Try to find the embedded JSON div
        const stateDiv = doc.getElementById('paper-state-json');
        if (stateDiv) {
            const base64State = stateDiv.textContent.trim();
            const jsonStr = decodeURIComponent(escape(atob(base64State)));
            const paper = JSON.parse(jsonStr);

            paper.id = 'paper_' + Date.now();
            paper.name = paper.name + " (Imported)";

            window.state.papers.push(paper);
            window.state.activePaperId = paper.id;
            window.saveState();
            window.render();
            window.toast(`📥 Imported paper: ${paper.name}`);
            return;
        }

        // 2. Fallback: Parse the document DOM structure
        const schoolName = doc.querySelector('.ex-school')?.textContent?.trim() || 'Imported School';
        const examName = doc.querySelector('.ex-title')?.textContent?.trim() || 'Imported Examination';

        let subject = 'General';
        let grade = 'Class VIII';
        let timeAllowed = '2 Hours';
        let maxMarks = '50';

        doc.querySelectorAll('.ex-meta div').forEach(div => {
            const text = div.textContent;
            if (text.includes('Subject:')) subject = text.replace('Subject:', '').trim();
            if (text.includes('Grade/Class:')) grade = text.replace('Grade/Class:', '').trim();
            if (text.includes('Time Allowed:')) timeAllowed = text.replace('Time Allowed:', '').trim();
            if (text.includes('Maximum Marks:')) maxMarks = text.replace('Maximum Marks:', '').trim();
        });

        const instructions = [];
        doc.querySelectorAll('.ex-instr li').forEach(li => {
            instructions.push(li.textContent.trim());
        });

        const paper = {
            id: 'paper_' + Date.now(),
            name: examName + ' - ' + subject,
            folderId: null,
            header: {
                schoolName,
                examName,
                subject,
                grade,
                timeAllowed,
                maxMarks,
                instructions,
                showStudentDetails: doc.querySelector('.ex-student') !== null
            },
            sections: []
        };

        let currentSection = null;
        const bodyChildren = doc.body.children;
        for (let i = 0; i < bodyChildren.length; i++) {
            const el = bodyChildren[i];

            if (el.classList.contains('ex-sec')) {
                currentSection = {
                    id: 'sec_' + Date.now() + '_' + paper.sections.length,
                    name: el.textContent.trim(),
                    questions: []
                };
                paper.sections.push(currentSection);
            } else if (el.classList.contains('ex-q-row')) {
                if (!currentSection) {
                    currentSection = {
                        id: 'sec_' + Date.now() + '_0',
                        name: 'Questions',
                        questions: []
                    };
                    paper.sections.push(currentSection);
                }

                const qBodyEl = el.querySelector('.ex-q-body');
                const qMarksEl = el.querySelector('.ex-q-marks');

                let marks = 1;
                if (qMarksEl) {
                    const mMatch = qMarksEl.textContent.match(/\[([0-9.]+)\]/);
                    if (mMatch) marks = parseFloat(mMatch[1]);
                }

                let qHtml = qBodyEl ? qBodyEl.innerHTML : '';
                const qStrong = qBodyEl ? qBodyEl.querySelector('strong') : null;
                if (qStrong) {
                    qHtml = qHtml.replace(qStrong.outerHTML, '').trim();
                }

                let image = null;
                const imgEl = el.querySelector('img');
                if (imgEl) {
                    image = imgEl.getAttribute('src');
                    qHtml = qHtml.replace(imgEl.outerHTML, '').trim();
                }

                let type = 'Short Answer';
                let options = [];
                let matches = [];

                const exOptsEl = el.querySelector('.ex-opts');
                const exMatchEl = el.querySelector('.ex-match-grid');

                if (exOptsEl) {
                    type = 'MCQ';
                    qHtml = qHtml.replace(exOptsEl.outerHTML, '').trim();
                    
                    let layout = 'row';
                    if (exOptsEl.classList.contains('grid2')) layout = 'grid2';
                    if (exOptsEl.classList.contains('column')) layout = 'column';

                    exOptsEl.querySelectorAll('.ex-opt').forEach((optEl, oIdx) => {
                        let optText = optEl.innerHTML;
                        const letterMatch = optText.match(/^\s*\([A-F]\)\s*/);
                        if (letterMatch) {
                            optText = optText.replace(letterMatch[0], '');
                        }

                        let isCorrect = false;
                        if (optText.startsWith('★ ')) {
                            optText = optText.replace('★ ', '');
                            isCorrect = true;
                        }

                        optText = window.restoreMathMLInHTML(optText);

                        options.push({
                            id: 'opt_' + Date.now() + '_' + oIdx,
                            text: optText,
                            isCorrect
                        });
                    });
                } else if (exMatchEl) {
                    type = 'Match';
                    qHtml = qHtml.replace(exMatchEl.outerHTML, '').trim();

                    exMatchEl.querySelectorAll('.ex-match-row').forEach((rowEl, rIdx) => {
                        const cols = rowEl.querySelectorAll('td, span');
                        if (cols.length >= 2) {
                            let left = cols[0].innerHTML;
                            let right = cols[1].innerHTML;

                            left = left.replace(/^\s*\d+\.\s*/, '');
                            right = right.replace(/^\s*\([a-z]\)\s*/, '');

                            left = window.restoreMathMLInHTML(left);
                            right = window.restoreMathMLInHTML(right);

                            matches.push({
                                id: 'match_' + Date.now() + '_' + rIdx,
                                left,
                                right
                            });
                        }
                    });
                }

                qHtml = window.restoreMathMLInHTML(qHtml);

                const q = {
                    id: 'q_' + Date.now() + '_' + currentSection.questions.length,
                    type,
                    text: qHtml,
                    marks,
                    difficulty: 'Medium',
                    layout: 'row',
                    options,
                    matches,
                    image
                };

                currentSection.questions.push(q);
            }
        }

        window.state.papers.push(paper);
        window.state.activePaperId = paper.id;
        window.saveState();
        window.render();
        window.toast(`📥 Parsed and imported HTML/Word document: ${paper.name}`);

    } catch(e) {
        window.toast("⚠️ Failed to parse Word file: " + e.message);
        console.error(e);
    }
};

window.restoreMathMLInHTML = function(html) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;

    div.querySelectorAll('math').forEach(mathEl => {
        const annotation = mathEl.querySelector('annotation[encoding="application/x-tex"]');
        const latex = annotation ? annotation.textContent : '';

        const mf = document.createElement('math-field');
        mf.setAttribute('contenteditable', 'false');
        mf.classList.add('inline-math');
        mf.value = latex;
        mf.setAttribute('value', latex);

        const wrapper = mathEl.closest('.docx-math-wrapper');
        if (wrapper) {
            wrapper.replaceWith(mf);
        } else {
            mathEl.replaceWith(mf);
        }
    });

    return div.innerHTML;
};

