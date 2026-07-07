// js/export.js

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

// ─── MathLive to SVG to PNG Canvas Renderer ───

window.latexToPNG = function(latex) {
    return new Promise((resolve) => {
        window.loadMathJax(() => {
            try {
                const wrapper = window.MathJax.tex2svg(latex);
                const svgEl = wrapper.querySelector('svg');
                if (!svgEl) {
                    resolve(null);
                    return;
                }
                
                const widthAttr = svgEl.getAttribute('width');
                const heightAttr = svgEl.getAttribute('height');
                const styleAttr = svgEl.getAttribute('style') || '';
                
                // Ex to Pixels (1ex = 8.5px is base size at 12pt Times New Roman)
                const wEx = parseFloat(widthAttr) || 3;
                const hEx = parseFloat(heightAttr) || 1.5;
                
                const targetW = Math.round(wEx * 8.5);
                const targetH = Math.round(hEx * 8.5);
                
                // Render at 4x resolution for crispness inside Word document
                const renderScale = 4;
                const canvasW = targetW * renderScale;
                const canvasH = targetH * renderScale;
                
                const svgString = svgEl.outerHTML;
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    canvas.width = canvasW;
                    canvas.height = canvasH;
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvasW, canvasH);
                    ctx.drawImage(img, 0, 0, canvasW, canvasH);
                    
                    const pngUrl = canvas.toDataURL('image/png');
                    const base64 = pngUrl.replace(/^data:image\/png;base64,/, '');
                    
                    URL.revokeObjectURL(url);
                    
                    resolve({
                        base64: base64,
                        width: targetW,
                        height: targetH
                    });
                };
                img.onerror = function() {
                    URL.revokeObjectURL(url);
                    resolve(null);
                };
                img.src = url;
            } catch(e) {
                console.error("Mathfield SVG canvas render failed:", e);
                resolve(null);
            }
        });
    });
};

// ─── DOM to docx.js Runs Compiler ───

window.parseHtmlToRuns = async function(node, parentStyles = { bold: false, italic: false, underline: false }) {
    const docxLib = window.docx;
    if (!docxLib) {
        console.warn("docx library is not loaded yet");
        return [];
    }
    const { TextRun, ImageRun } = docxLib;
    
    let runs = [];
    const children = node.childNodes;
    
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        
        if (child.nodeType === Node.TEXT_NODE) {
            let text = child.textContent;
            if (text) {
                // Collapse whitespaces and remove source code newlines
                text = text.replace(/\s+/g, ' ');
                if (text && text !== ' ') {
                    runs.push(new TextRun({
                        text: text,
                        bold: parentStyles.bold,
                        italic: parentStyles.italic,
                        underline: parentStyles.underline ? {} : undefined,
                        font: "Times New Roman",
                        size: 22 // 11pt in docx
                    }));
                } else if (text === ' ') {
                    runs.push(new TextRun({
                        text: ' ',
                        font: "Times New Roman",
                        size: 22
                    }));
                }
            }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            const tagName = child.tagName.toUpperCase();
            
            // Skip block elements that are handled separately in the layout
            if (child.classList.contains('paper-q-img') || 
                child.classList.contains('paper-options-grid') || 
                child.classList.contains('paper-match-grid') ||
                child.classList.contains('paper-opt') ||
                child.classList.contains('paper-match-row')) {
                continue;
            }
            
            // Skip solution blocks in question text
            const styleColor = child.style.color;
            if (styleColor === 'rgb(22, 163, 74)' || 
                styleColor === '#16a34a' || 
                child.textContent.includes('Answer:') || 
                child.textContent.includes('Solution Rubric:')) {
                continue;
            }
            
            if (tagName === 'STRONG' || tagName === 'B') {
                const childRuns = await window.parseHtmlToRuns(child, { ...parentStyles, bold: true });
                runs.push(...childRuns);
            } else if (tagName === 'EM' || tagName === 'I') {
                const childRuns = await window.parseHtmlToRuns(child, { ...parentStyles, italic: true });
                runs.push(...childRuns);
            } else if (tagName === 'U') {
                const childRuns = await window.parseHtmlToRuns(child, { ...parentStyles, underline: true });
                runs.push(...childRuns);
            } else if (tagName === 'MATH-FIELD' || tagName === 'MATH' || tagName === 'SVG' || (tagName === 'IMG' && child.hasAttribute('data-latex'))) {
                let latex = '';
                if (tagName === 'MATH-FIELD') {
                    latex = child.value || child.getAttribute('value') || '';
                } else if (tagName === 'MATH') {
                    const ann = child.querySelector('annotation[encoding="application/x-tex"]');
                    latex = ann ? ann.textContent : '';
                } else {
                    latex = child.getAttribute('data-latex') || '';
                }
                
                if (latex) {
                    const imgData = await window.latexToPNG(latex);
                    if (imgData) {
                        runs.push(new ImageRun({
                            data: imgData.base64,
                            transformation: {
                                width: imgData.width,
                                height: imgData.height
                            }
                        }));
                    }
                }
            } else if (tagName === 'IMG') {
                const src = child.getAttribute('src') || '';
                if (src.startsWith('data:image')) {
                    const base64 = src.split(',')[1];
                    const w = parseInt(child.getAttribute('width') || child.style.width) || 200;
                    const h = parseInt(child.getAttribute('height') || child.style.height) || 100;
                    
                    runs.push(new ImageRun({
                        data: base64,
                        transformation: {
                            width: w,
                            height: h
                        }
                    }));
                }
            } else if (tagName === 'SPAN' && child.classList.contains('docx-math-wrapper')) {
                const childRuns = await window.parseHtmlToRuns(child, parentStyles);
                runs.push(...childRuns);
            } else {
                const childRuns = await window.parseHtmlToRuns(child, parentStyles);
                runs.push(...childRuns);
            }
        }
    }
    return runs;
};

// ─── Native docx.js Exporter Pipeline ───

window.exportDOCX = async function(paperId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) { window.toast('⚠️ Paper not found'); return; }
    
    const docxLib = window.docx;
    if (!docxLib) {
        window.toast("⚠️ Word export library (docx) is not loaded yet. Please wait a moment.");
        return;
    }
    
    // Safely destructure required classes
    const Document = docxLib.Document;
    const Paragraph = docxLib.Paragraph;
    const TextRun = docxLib.TextRun;
    const ImageRun = docxLib.ImageRun;
    const Table = docxLib.Table;
    const TableRow = docxLib.TableRow;
    const TableCell = docxLib.TableCell;
    const Header = docxLib.Header;
    const Footer = docxLib.Footer;
    const Packer = docxLib.Packer;
    
    // Safely resolve enums with default fallbacks
    const AlignmentType = docxLib.AlignmentType || { CENTER: "center", RIGHT: "right", LEFT: "left" };
    const WidthType = docxLib.WidthType || { PERCENTAGE: "pct" };
    const BorderStyle = docxLib.BorderStyle || { SINGLE: "single", NONE: "none" };
    const ShadingType = docxLib.ShadingType || { CLEAR: "clear" };
    const TextAlignment = docxLib.TextAlignment || { CENTER: "center", BASELINE: "baseline", TOP: "top" };
    const PageNumber = docxLib.PageNumber || { CURRENT: "current" };
    const TableBorders = docxLib.TableBorders || { NONE: { top: { style: "none", size: 0, color: "auto" }, bottom: { style: "none", size: 0, color: "auto" }, left: { style: "none", size: 0, color: "auto" }, right: { style: "none", size: 0, color: "auto" } } };
    const TableAlignment = docxLib.TableAlignment || { LEFT: "left", CENTER: "center", RIGHT: "right" };
    
    window.toast('⏳ Compiling document preview...');
    
    // Compile and render the document inside the preview DOM area
    window.renderPrintPreview();
    const sheet = document.getElementById('printSheet');
    if (!sheet) {
        window.toast('⚠️ Print preview element not found in DOM');
        return;
    }
    
    // Ensure MathJax is loaded
    await new Promise((resolve) => {
        window.loadMathJax(() => resolve());
    });
    
    try {
        const docxElements = [];
        
        // Loop sequentially through DOM elements of the print preview
        for (let i = 0; i < sheet.children.length; i++) {
            const el = sheet.children[i];
            
            if (el.classList.contains('paper-header-block')) {
                const schoolName = el.querySelector('.paper-school-name')?.textContent?.trim() || '';
                const examName = el.querySelector('.paper-exam-name')?.textContent?.trim() || '';
                
                docxElements.push(new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 60 },
                    children: [
                        new TextRun({
                            text: schoolName,
                            bold: true,
                            size: 32,
                            font: "Times New Roman"
                        })
                    ]
                }));
                docxElements.push(new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 60, after: 200 },
                    children: [
                        new TextRun({
                            text: examName,
                            bold: true,
                            size: 24,
                            font: "Times New Roman"
                        })
                    ]
                }));
                
            } else if (el.classList.contains('paper-meta-grid')) {
                const divs = Array.from(el.querySelectorAll('div'));
                const row1Cells = [];
                const row2Cells = [];
                
                for (let idx = 0; idx < divs.length; idx++) {
                    const text = divs[idx].textContent.trim();
                    const parts = text.split(':');
                    const label = parts[0] + ':';
                    const val = parts.slice(1).join(':');
                    
                    const cell = new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                            new Paragraph({
                                spacing: { before: 80, after: 80 },
                                children: [
                                    new TextRun({ text: label, bold: true, font: "Times New Roman", size: 22 }),
                                    new TextRun({ text: val, font: "Times New Roman", size: 22 })
                                ]
                            })
                        ]
                    });
                    
                    if (idx < 2) row1Cells.push(cell);
                    else row2Cells.push(cell);
                }
                
                while (row1Cells.length < 2) row1Cells.push(new TableCell({ children: [] }));
                while (row2Cells.length < 2) row2Cells.push(new TableCell({ children: [] }));
                
                const borderStyleSpec = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
                const table = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    alignment: TableAlignment.LEFT,
                    borders: {
                        top: borderStyleSpec,
                        bottom: borderStyleSpec,
                        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
                        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    },
                    rows: [
                        new TableRow({ children: row1Cells }),
                        new TableRow({ children: row2Cells })
                    ]
                });
                docxElements.push(table);
                docxElements.push(new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }));
                
            } else if (el.classList.contains('paper-student-details')) {
                const divs = Array.from(el.querySelectorAll('div'));
                const row1Cells = [];
                const row2Cells = [];
                
                for (let idx = 0; idx < divs.length; idx++) {
                    const text = divs[idx].textContent.trim();
                    const parts = text.split(':');
                    const label = parts[0] + ':';
                    const val = parts.slice(1).join(':');
                    
                    const cell = new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                            new Paragraph({
                                spacing: { before: 80, after: 80 },
                                children: [
                                    new TextRun({ text: label, bold: true, font: "Times New Roman", size: 20 }),
                                    new TextRun({ text: val, font: "Times New Roman", size: 20 })
                                ]
                            })
                        ]
                    });
                    
                    if (idx < 2) row1Cells.push(cell);
                    else row2Cells.push(cell);
                }
                
                while (row1Cells.length < 2) row1Cells.push(new TableCell({ children: [] }));
                while (row2Cells.length < 2) row2Cells.push(new TableCell({ children: [] }));
                
                const borderStyleSpec = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
                const table = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    alignment: TableAlignment.LEFT,
                    borders: {
                        top: borderStyleSpec,
                        bottom: borderStyleSpec,
                        left: borderStyleSpec,
                        right: borderStyleSpec,
                        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
                        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    },
                    rows: [
                        new TableRow({ children: row1Cells }),
                        new TableRow({ children: row2Cells })
                    ]
                });
                docxElements.push(table);
                docxElements.push(new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }));
                
            } else if (el.classList.contains('paper-instructions')) {
                docxElements.push(new Paragraph({
                    spacing: { before: 120, after: 60 },
                    children: [
                        new TextRun({ text: "General Instructions:", bold: true, font: "Times New Roman", size: 22 })
                    ]
                }));
                
                el.querySelectorAll('li').forEach(li => {
                    docxElements.push(new Paragraph({
                        bullet: { level: 0 },
                        spacing: { before: 40, after: 40 },
                        children: [
                            new TextRun({ text: li.textContent.trim(), font: "Times New Roman", size: 22 })
                        ]
                    }));
                });
                docxElements.push(new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }));
                
            } else if (el.classList.contains('paper-section-title')) {
                docxElements.push(new Paragraph({
                    spacing: { before: 240, after: 120 },
                    children: [
                        new TextRun({
                            text: el.textContent.trim(),
                            bold: true,
                            size: 26,
                            font: "Times New Roman"
                        })
                    ]
                }));
                
            } else if (el.classList.contains('paper-q-row')) {
                const qBody = el.querySelector('.paper-q-body');
                const qMarks = el.querySelector('.paper-q-marks');
                
                if (qBody) {
                    const mainQRuns = await window.parseHtmlToRuns(qBody);
                    
                    const bodyCellChildren = [];
                    bodyCellChildren.push(new Paragraph({
                        spacing: { before: 100, after: 100 },
                        textAlignment: TextAlignment.TOP, // Align vertically to top so Q1 aligns with the first row of matrices
                        children: mainQRuns
                    }));
                    
                    const origBlockImg = qBody.querySelector('.paper-q-img');
                    if (origBlockImg) {
                        const src = origBlockImg.getAttribute('src');
                        if (src && src.startsWith('data:image')) {
                            const base64 = src.split(',')[1];
                            
                            // Try to parse dimensions
                            const widthAttr = origBlockImg.getAttribute('width') || origBlockImg.style.width || '250';
                            const heightAttr = origBlockImg.getAttribute('height') || origBlockImg.style.height || '140';
                            const wVal = parseInt(widthAttr) || 250;
                            const hVal = parseInt(heightAttr) || 140;
                            
                            bodyCellChildren.push(new Paragraph({
                                spacing: { before: 120, after: 120 },
                                children: [
                                    new ImageRun({
                                        data: base64,
                                        transformation: {
                                            width: wVal,
                                            height: hVal
                                        }
                                    })
                                ]
                            }));
                        }
                    }
                    
                    const origOptsGrid = qBody.querySelector('.paper-options-grid');
                    if (origOptsGrid) {
                        let layout = 'row';
                        if (origOptsGrid.classList.contains('grid2')) layout = 'grid2';
                        if (origOptsGrid.classList.contains('column')) layout = 'column';
                        
                        const optElements = Array.from(origOptsGrid.querySelectorAll('.paper-opt'));
                        const rows = [];
                        
                        if (layout === 'row') {
                            const cells = [];
                            for (let idx = 0; idx < optElements.length; idx++) {
                                const optEl = optElements[idx];
                                const isHighlighted = optEl.classList.contains('correct-highlight');
                                const letterEl = optEl.querySelector('.paper-opt-letter');
                                const textEl = optEl.querySelector('.paper-opt-text');
                                
                                const cellRuns = [];
                                if (letterEl) {
                                    cellRuns.push(new TextRun({ text: letterEl.textContent.trim() + ' ', font: "Times New Roman", size: 22, bold: isHighlighted }));
                                }
                                if (textEl) {
                                    const textRuns = await window.parseHtmlToRuns(textEl, { bold: isHighlighted });
                                    cellRuns.push(...textRuns);
                                }
                                
                                cells.push(new TableCell({
                                    width: { size: 25, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({
                                            spacing: { before: 60, after: 60 },
                                            textAlignment: TextAlignment.TOP, // Align vertically to top
                                            children: cellRuns
                                        })
                                    ]
                                }));
                            }
                            while (cells.length < 4) cells.push(new TableCell({ children: [] }));
                            rows.push(new TableRow({ children: cells }));
                            
                        } else if (layout === 'grid2') {
                            for (let r = 0; r < 2; r++) {
                                const cells = [];
                                for (let c = 0; c < 2; c++) {
                                    const idx = r * 2 + c;
                                    if (optElements[idx]) {
                                        const optEl = optElements[idx];
                                        const isHighlighted = optEl.classList.contains('correct-highlight');
                                        const letterEl = optEl.querySelector('.paper-opt-letter');
                                        const textEl = optEl.querySelector('.paper-opt-text');
                                        
                                        const cellRuns = [];
                                        if (letterEl) {
                                            cellRuns.push(new TextRun({ text: letterEl.textContent.trim() + ' ', font: "Times New Roman", size: 22, bold: isHighlighted }));
                                        }
                                        if (textEl) {
                                            const textRuns = await window.parseHtmlToRuns(textEl, { bold: isHighlighted });
                                            cellRuns.push(...textRuns);
                                        }
                                        
                                        cells.push(new TableCell({
                                            width: { size: 50, type: WidthType.PERCENTAGE },
                                            children: [
                                                new Paragraph({
                                                    spacing: { before: 60, after: 60 },
                                                    textAlignment: TextAlignment.TOP, // Align vertically to top
                                                    children: cellRuns
                                                })
                                            ]
                                        }));
                                    } else {
                                        cells.push(new TableCell({ children: [] }));
                                    }
                                }
                                rows.push(new TableRow({ children: cells }));
                            }
                        } else {
                            for (let idx = 0; idx < optElements.length; idx++) {
                                const optEl = optElements[idx];
                                const isHighlighted = optEl.classList.contains('correct-highlight');
                                const letterEl = optEl.querySelector('.paper-opt-letter');
                                const textEl = optEl.querySelector('.paper-opt-text');
                                
                                const cellRuns = [];
                                if (letterEl) {
                                    cellRuns.push(new TextRun({ text: letterEl.textContent.trim() + ' ', font: "Times New Roman", size: 22, bold: isHighlighted }));
                                }
                                if (textEl) {
                                    const textRuns = await window.parseHtmlToRuns(textEl, { bold: isHighlighted });
                                    cellRuns.push(...textRuns);
                                }
                                
                                rows.push(new TableRow({
                                    children: [
                                        new TableCell({
                                            width: { size: 100, type: WidthType.PERCENTAGE },
                                            children: [
                                                new Paragraph({
                                                    spacing: { before: 60, after: 60 },
                                                    textAlignment: TextAlignment.TOP, // Align vertically to top
                                                    children: cellRuns
                                                })
                                            ]
                                        })
                                    ]
                                }));
                            }
                        }
                        
                        bodyCellChildren.push(new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            alignment: TableAlignment.LEFT,
                            borders: TableBorders.NONE,
                            rows: rows
                        }));
                    }
                    
                    const origMatchGrid = qBody.querySelector('.paper-match-grid');
                    if (origMatchGrid) {
                        const matchRows = Array.from(origMatchGrid.querySelectorAll('.paper-match-row'));
                        const rows = [];
                        
                        for (let idx = 0; idx < matchRows.length; idx++) {
                            const rowEl = matchRows[idx];
                            const spans = Array.from(rowEl.querySelectorAll('span'));
                            
                            if (spans.length >= 2) {
                                const leftRuns = await window.parseHtmlToRuns(spans[0]);
                                const rightRuns = await window.parseHtmlToRuns(spans[1]);
                                
                                rows.push(new TableRow({
                                    children: [
                                        new TableCell({
                                            width: { size: 50, type: WidthType.PERCENTAGE },
                                            children: [
                                                new Paragraph({
                                                    spacing: { before: 60, after: 60 },
                                                    textAlignment: TextAlignment.TOP, // Align vertically to top
                                                    children: leftRuns
                                                })
                                            ]
                                        }),
                                        new TableCell({
                                            width: { size: 50, type: WidthType.PERCENTAGE },
                                            children: [
                                                new Paragraph({
                                                    spacing: { before: 60, after: 60 },
                                                    textAlignment: TextAlignment.TOP, // Align vertically to top
                                                    children: rightRuns
                                                })
                                            ]
                                        })
                                    ]
                                }));
                            }
                        }
                        
                        bodyCellChildren.push(new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            alignment: TableAlignment.LEFT,
                            borders: TableBorders.NONE,
                            rows: rows
                        }));
                    }
                    
                    const solEl = Array.from(qBody.children).find(child => {
                        const text = child.textContent;
                        return child.tagName === 'DIV' && (text.includes('Answer:') || text.includes('Solution Rubric:'));
                    });
                    
                    if (solEl) {
                        const solRuns = await window.parseHtmlToRuns(solEl);
                        bodyCellChildren.push(new Paragraph({
                            spacing: { before: 120, after: 120 },
                            textAlignment: TextAlignment.TOP, // Align vertically to top
                            shading: {
                                fill: "F0FDF4",
                                val: ShadingType.CLEAR,
                                color: "auto"
                            },
                            border: {
                                left: {
                                    color: "16A34A",
                                    size: 24,
                                    style: BorderStyle.SINGLE
                                }
                            },
                            children: solRuns
                        }));
                    }
                    
                    const marksCellChildren = [];
                    if (qMarks && qMarks.textContent.trim()) {
                        marksCellChildren.push(new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 100, after: 100 },
                            children: [
                                new TextRun({
                                    text: qMarks.textContent.trim(),
                                    bold: true,
                                    font: "Times New Roman",
                                    size: 22
                                })
                            ]
                        }));
                    } else {
                        marksCellChildren.push(new Paragraph({ children: [] }));
                    }
                    
                    const qTable = new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        alignment: TableAlignment.LEFT,
                        borders: TableBorders.NONE,
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 90, type: WidthType.PERCENTAGE },
                                        children: bodyCellChildren
                                    }),
                                    new TableCell({
                                        width: { size: 10, type: WidthType.PERCENTAGE },
                                        children: marksCellChildren
                                    })
                                ]
                            })
                        ]
                    });
                    docxElements.push(qTable);
                    docxElements.push(new Paragraph({ spacing: { before: 100, after: 100 }, children: [] }));
                }
                
            } else if (el.classList.contains('paper-answer-matrix')) {
                docxElements.push(new Paragraph({
                    spacing: { before: 300, after: 150 },
                    children: [
                        new TextRun({ text: "🔑 Exam Paper Answer Key Matrix", bold: true, font: "Times New Roman", size: 24 })
                    ]
                }));
                
                const cells = Array.from(el.querySelectorAll('.paper-matrix-cell'));
                const rows = [];
                
                for (let rIdx = 0; rIdx < cells.length; rIdx += 4) {
                    const rowCells = [];
                    for (let cIdx = 0; cIdx < 4; cIdx++) {
                        const cellEl = cells[rIdx + cIdx];
                        if (cellEl) {
                            const text = cellEl.textContent.trim();
                            const parts = text.split(':');
                            const label = parts[0] + ':';
                            const ans = parts.slice(1).join(':');
                            
                            rowCells.push(new TableCell({
                                width: { size: 25, type: WidthType.PERCENTAGE },
                                children: [
                                    new Paragraph({
                                        spacing: { before: 60, after: 60 },
                                        children: [
                                            new TextRun({ text: label + ' ', bold: true, font: "Times New Roman", size: 22 }),
                                            new TextRun({ text: ans, font: "Times New Roman", size: 22 })
                                        ]
                                    })
                                ]
                            }));
                        } else {
                            rowCells.push(new TableCell({ children: [] }));
                        }
                    }
                    rows.push(new TableRow({ children: rowCells }));
                }
                
                const table = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    alignment: TableAlignment.LEFT,
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
                        bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
                        left: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
                        right: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
                        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
                        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
                    },
                    rows: rows
                });
                docxElements.push(table);
            }
        }
        
        // Append paper state JSON as invisible white text run at the end of docx Elements list
        try {
            const base64State = btoa(unescape(encodeURIComponent(JSON.stringify(paper))));
            docxElements.push(new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                    new TextRun({
                        text: `PAPER_STATE_JSON_START_${base64State}_PAPER_STATE_JSON_END`,
                        color: "FFFFFF",
                        size: 1,
                        font: "Times New Roman"
                    })
                ]
            }));
        } catch(e) {
            console.error("Failed to embed state JSON in docx", e);
        }
        
        // Construct the Document
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440,
                            bottom: 1440,
                            left: 1440,
                            right: 1440
                        }
                    }
                },
                headers: {
                    default: new Header({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [
                                    new TextRun({
                                        text: paper.name,
                                        font: "Times New Roman",
                                        size: 18,
                                        color: "777777"
                                    })
                                ]
                            })
                        ]
                    })
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: `Generated by School Paper Builder • Page `,
                                        font: "Times New Roman",
                                        size: 18,
                                        color: "777777"
                                    }),
                                    new TextRun({
                                        children: [PageNumber.CURRENT || ""],
                                        font: "Times New Roman",
                                        size: 18,
                                        color: "777777"
                                    })
                                ]
                            })
                        ]
                    })
                },
                children: docxElements
            }]
        });
        
        Packer.toBlob(doc).then(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${paper.name.replace(/\s+/g,'_')}.docx`;
            link.click();
            URL.revokeObjectURL(link.href);
            window.toast('💾 Downloaded Word document (.docx)');
        });
        
    } catch(e) {
        window.toast("⚠️ DOCX generation failed: " + e.message);
        console.error(e);
    }
};

// ─── Legacy clean export helpers (retained for backward compatibility) ───

window.getCleanHTMLText = function(html) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('math-field').forEach(mf => {
        let latex = mf.value || '';
        let replacementHTML = '';
        
        if (window.MathJax && window.MathJax.tex2svg) {
            try {
                const wrapper = window.MathJax.tex2svg(latex);
                const svgEl = wrapper.querySelector('svg');
                if (svgEl) {
                    svgEl.setAttribute('data-latex', latex);
                    const width = svgEl.getAttribute('width');
                    const height = svgEl.getAttribute('height');
                    const styleAttr = svgEl.getAttribute('style') || '';
                    let verticalAlign = '';
                    const vaMatch = styleAttr.match(/vertical-align:\s*([^;]+)/);
                    if (vaMatch) {
                        verticalAlign = vaMatch[1];
                    }
                    const svgString = svgEl.outerHTML;
                    const base64SVG = btoa(unescape(encodeURIComponent(svgString)));
                    replacementHTML = `<img src="data:image/svg+xml;base64,${base64SVG}" data-latex="${window.escHtml(latex)}" style="vertical-align: ${verticalAlign || 'middle'}; width: ${width}; height: ${height}; display: inline; margin: 0 2px;" />`;
                }
            } catch(e) {
                console.error("MathJax conversion error:", e);
            }
        }
        
        if (!replacementHTML) {
            replacementHTML = `\\( ${latex} \\)`;
        }
        
        const tempSpan = document.createElement('span');
        tempSpan.className = 'docx-math-wrapper';
        tempSpan.style.display = 'inline-block';
        tempSpan.innerHTML = replacementHTML;
        mf.replaceWith(tempSpan);
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
        // 1. Try to find the embedded JSON signature (clearing HTML tags first for safety)
        const cleanText = htmlText.replace(/<[^>]*>/g, '');
        const regex = /PAPER_STATE_JSON_START_([A-Za-z0-9+\/=]+)_PAPER_STATE_JSON_END/;
        const match = cleanText.match(regex);
        
        let base64State = '';
        if (match) {
            base64State = match[1];
        } else {
            // Fallback: check if the legacy DOM element exists (for older exports)
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const stateDiv = doc.getElementById('paper-state-json');
            if (stateDiv) {
                base64State = stateDiv.textContent.trim();
            }
        }
        
        if (base64State) {
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
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
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

                        optText = window.restoreEquationsInHTML(optText);

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

                            left = window.restoreEquationsInHTML(left);
                            right = window.restoreEquationsInHTML(right);

                            matches.push({
                                id: 'match_' + Date.now() + '_' + rIdx,
                                left,
                                right
                            });
                        }
                    });
                }

                qHtml = window.restoreEquationsInHTML(qHtml);

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

window.restoreEquationsInHTML = function(html) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;

    // 1. Restore legacy MathML
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

    // 2. Restore SVG inline equations
    div.querySelectorAll('svg').forEach(svgEl => {
        const latex = svgEl.getAttribute('data-latex') || '';
        if (latex) {
            const mf = document.createElement('math-field');
            mf.setAttribute('contenteditable', 'false');
            mf.classList.add('inline-math');
            mf.value = latex;
            mf.setAttribute('value', latex);

            const wrapper = svgEl.closest('.docx-math-wrapper');
            if (wrapper) {
                wrapper.replaceWith(mf);
            } else {
                svgEl.replaceWith(mf);
            }
        }
    });

    // 3. Restore fallback images with data-latex
    div.querySelectorAll('img').forEach(imgEl => {
        const latex = imgEl.getAttribute('data-latex') || '';
        if (latex) {
            const mf = document.createElement('math-field');
            mf.setAttribute('contenteditable', 'false');
            mf.classList.add('inline-math');
            mf.value = latex;
            mf.setAttribute('value', latex);

            const wrapper = imgEl.closest('.docx-math-wrapper');
            if (wrapper) {
                wrapper.replaceWith(mf);
            } else {
                imgEl.replaceWith(mf);
            }
        }
    });

    return div.innerHTML;
};

window.loadMathJax = function(callback) {
    if (window.MathJax && window.MathJax.tex2svg) {
        callback();
        return;
    }
    
    // Configure MathJax for self-contained inline SVGs without global cache dependencies
    window.MathJax = {
        tex: {
            inlineMath: [['\\(', '\\)']],
            displayMath: [['\\[', '\\]']]
        },
        svg: {
            fontCache: 'none'
        },
        startup: {
            ready: () => {
                MathJax.startup.defaultReady();
                callback();
            }
        }
    };
    
    window.toast("⏳ Loading MathJax formula renderer...");
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";
    script.async = true;
    document.head.appendChild(script);
};
