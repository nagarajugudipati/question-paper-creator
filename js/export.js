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

window.importJSON = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (Array.isArray(data)) {
                    window.state.papers = data;
                } else if (data.id && data.sections) {
                    window.state.papers.push(data);
                } else {
                    window.toast('⚠️ Invalid JSON paper layout');
                    return;
                }
                if (window.state.papers.length > 0) {
                    window.state.activePaperId = window.state.papers[window.state.papers.length - 1].id;
                }
                window.saveState();
                window.render();
                window.toast('📂 Paper imported');
            } catch(err) {
                window.toast('⚠️ Error reading file: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
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
        mf.outerHTML = `\\( ${mf.value} \\)`;
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
                html += `<div class="ex-opts ${q.layout}">`;
                const labels = Array.from({ length: q.options.length }, (_, i) => String.fromCharCode(65 + i));
                q.options.forEach((opt, oIdx) => {
                    const cleanOptText = window.getCleanHTMLText(opt.text);
                    html += `
                        <div class="ex-opt">
                            <span>(${labels[oIdx]}) ${cleanOptText}</span>
                        </div>
                    `;
                });
                html += `</div>`;

            } else if (q.type === 'Match') {
                html += `<div class="ex-match-grid">`;
                const shuffledRight = window.getShuffledRightColumn(q.matches, q.id);
                q.matches.forEach((pair, idx) => {
                    const leftLabel = idx + 1;
                    const rightLabel = String.fromCharCode(97 + idx);
                    const cleanLeftText = window.getCleanHTMLText(pair.left);
                    const cleanRightText = window.getCleanHTMLText(shuffledRight[idx].right);

                    html += `
                        <div class="ex-match-row">
                            <span>${leftLabel}. ${cleanLeftText}</span>
                            <span>(${rightLabel}) ${cleanRightText}</span>
                        </div>
                    `;
                });
                html += `</div>`;
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

    html += `<div class="footer">Generated by School Paper Builder • ${new Date().toLocaleDateString()}</div>`;
    html += `</body></html>`;
    return html;
};
