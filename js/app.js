// js/app.js
window.state = {
    folders: [],
    papers: [],
    activePaperId: null,
    viewMode: 'edit'
};

const STORAGE_KEY = 'school_exam_creator_folder_data_v5.5';

window.loadState = function() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            window.state.folders = parsed.folders || [];
            window.state.papers = parsed.papers || [];
            window.state.activePaperId = parsed.activePaperId || null;
            
            // Sync schemas
            window.state.papers.forEach(p => {
                if (!p.header) p.header = window.createDefaultHeader(p.name);
                if (!p.folderId) p.folderId = null;
                p.sections.forEach(s => {
                    s.questions.forEach(q => {
                        if (!q.options) q.options = [];
                        if (!q.matches) q.matches = [];
                        if (!q.layout) q.layout = 'row';
                        if (!q.difficulty) q.difficulty = 'Medium';
                        if (q.marks === undefined) q.marks = 1;
                    });
                });
            });
        } catch(e) {
            window.state.folders = [];
            window.state.papers = [];
        }
    }

    // Force seed "Sample Paper - IX IIT" (minimum 20 questions) for the user demo
    const sampleIndex = window.state.papers.findIndex(p => p.id === 'paper_sample_ix_iit');
    let shouldSeed = (sampleIndex === -1);
    if (sampleIndex !== -1) {
        const paper = window.state.papers[sampleIndex];
        let totalQ = 0;
        paper.sections.forEach(s => totalQ += s.questions.length);
        if (totalQ < 20) {
            shouldSeed = true;
            window.state.papers.splice(sampleIndex, 1);
        }
    }

    if (shouldSeed) {
        // Ensure folder 'fol_1' exists
        if (!window.state.folders.some(f => f.id === 'fol_1')) {
            window.state.folders.unshift({ id: 'fol_1', name: 'Mathematics', expanded: true });
        }
        const samplePaper = window.createSamplePaper();
        window.state.papers.unshift(samplePaper);
        window.state.activePaperId = samplePaper.id;
        window.saveState();
    }

    if (window.state.papers.length > 0 && !window.state.activePaperId) {
        window.state.activePaperId = window.state.papers[0].id;
    }
};

window.saveState = function() {
    const data = {
        folders: window.state.folders,
        papers: window.state.papers,
        activePaperId: window.state.activePaperId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

window.render = function(skipHistory = false) {
    if (window.renderFolderTree) window.renderFolderTree();
    
    const paper = window.state.papers.find(p => p.id === window.state.activePaperId);
    
    if (paper && !skipHistory && window.saveHistoryState) {
        window.saveHistoryState();
    }

    // Sync views
    if (window.state.viewMode === 'edit') {
        document.getElementById('sidebarPanel').classList.remove('hidden');
        document.getElementById('paneEditor').classList.add('active');
        document.getElementById('panePreview').classList.remove('active');
        
        if (paper) {
            if (window.renderEditor) window.renderEditor(paper);
        } else {
            document.getElementById('editorArea').innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--text-muted); font-size:13px;">
                    <h3>No active paper</h3>
                    <p style="font-size:13px;margin-top:8px;">Create a folder or paper in the tree on the left to start.</p>
                </div>
            `;
        }
    } else {
        document.getElementById('sidebarPanel').classList.add('hidden');
        document.getElementById('paneEditor').classList.remove('active');
        document.getElementById('panePreview').classList.add('active');
        
        if (window.renderPrintPreview) window.renderPrintPreview();
    }

    if (window.triggerAutosave) window.triggerAutosave();
};

window.switchViewMode = function(mode) {
    window.state.viewMode = mode;
    window.render(true);
};

window.createDefaultHeader = function(name) {
    return {
        schoolName: 'Public Examination High School',
        examName: 'Summative Examination - I 2026',
        subject: name || 'General Subject',
        grade: 'Class VIII',
        timeAllowed: '2 Hours',
        maxMarks: '50',
        instructions: [
            'Answer all the questions.',
            'Check details block before attempting.',
            'Right side numbers represent question marks.'
        ],
        showStudentDetails: true
    };
};

window.createSamplePaper = function() {
    return {
        id: 'paper_sample_ix_iit',
        name: 'Sample Paper - IX IIT',
        folderId: 'fol_1',
        header: {
            schoolName: 'Public Examination High School',
            examName: 'Summative Examination - I 2026',
            subject: 'Mathematics',
            grade: 'Class IX',
            timeAllowed: '2 Hours',
            maxMarks: '50',
            instructions: [
                'Choose the correct alternative from the options.',
                'LaTeX symbols or code structures are visually typeset.',
                'Calculators or computing devices are prohibited.'
            ],
            showStudentDetails: true
        },
        sections: [{
            id: 'sec_1',
            name: 'Mathematics',
            questions: [
                {
                    id: 'q_geom_1',
                    type: 'MCQ',
                    text: 'Two circles having same \\\\\\\\ are called concentric circles',
                    marks: 1,
                    difficulty: 'Medium',
                    layout: 'row',
                    options: [
                        { id: 'opt_g1_1', text: 'Center', isCorrect: true },
                        { id: 'opt_g1_2', text: 'radius', isCorrect: false },
                        { id: 'opt_g1_3', text: 'arc', isCorrect: false },
                        { id: 'opt_g1_4', text: 'segment', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_2',
                    type: 'MCQ',
                    text: 'Degree measure of a circle is \\\\\\\\ degrees',
                    marks: 1,
                    difficulty: 'Medium',
                    layout: 'row',
                    options: [
                        { id: 'opt_g2_1', text: '90', isCorrect: false },
                        { id: 'opt_g2_2', text: '180', isCorrect: false },
                        { id: 'opt_g2_3', text: '270', isCorrect: false },
                        { id: 'opt_g2_4', text: '360', isCorrect: true }
                    ]
                },
                {
                    id: 'q_geom_3',
                    type: 'MCQ',
                    text: 'If a line intersect a circle in two distinct points, then it is called',
                    marks: 1,
                    difficulty: 'Medium',
                    layout: 'row',
                    options: [
                        { id: 'opt_g3_1', text: 'secant', isCorrect: true },
                        { id: 'opt_g3_2', text: 'tangent', isCorrect: false },
                        { id: 'opt_g3_3', text: 'chord', isCorrect: false },
                        { id: 'opt_g3_4', text: 'segment', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_4',
                    type: 'MCQ',
                    text: 'The longest chord of a circle is its',
                    marks: 1,
                    difficulty: 'Easy',
                    layout: 'row',
                    options: [
                        { id: 'opt_g4_1', text: 'Radius', isCorrect: false },
                        { id: 'opt_g4_2', text: 'Diameter', isCorrect: true },
                        { id: 'opt_g4_3', text: 'Secant', isCorrect: false },
                        { id: 'opt_g4_4', text: 'Tangent', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_5',
                    type: 'MCQ',
                    text: 'The region bounded by a chord and an arc of a circle is called',
                    marks: 1,
                    difficulty: 'Medium',
                    layout: 'row',
                    options: [
                        { id: 'opt_g5_1', text: 'Segment', isCorrect: true },
                        { id: 'opt_g5_2', text: 'Sector', isCorrect: false },
                        { id: 'opt_g5_3', text: 'Quadrant', isCorrect: false },
                        { id: 'opt_g5_4', text: 'Circle', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_6',
                    type: 'MCQ',
                    text: 'The perpendicular from the center of a circle to a chord \\\\\\\\ the chord',
                    marks: 1,
                    difficulty: 'Easy',
                    layout: 'row',
                    options: [
                        { id: 'opt_g6_1', text: 'Tri-sects', isCorrect: false },
                        { id: 'opt_g6_2', text: 'Bisects', isCorrect: true },
                        { id: 'opt_g6_3', text: 'Doubles', isCorrect: false },
                        { id: 'opt_g6_4', text: 'None of these', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_7',
                    type: 'MCQ',
                    text: 'Angle subtended by a diameter at any point on the circle is',
                    marks: 1,
                    difficulty: 'Medium',
                    layout: 'row',
                    options: [
                        { id: 'opt_g7_1', text: '45°', isCorrect: false },
                        { id: 'opt_g7_2', text: '60°', isCorrect: false },
                        { id: 'opt_g7_3', text: '90°', isCorrect: true },
                        { id: 'opt_g7_4', text: '180°', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_8',
                    type: 'MCQ',
                    text: 'Equal chords of a circle subtend \\\\\\\\ angles at the center',
                    marks: 1,
                    difficulty: 'Easy',
                    layout: 'row',
                    options: [
                        { id: 'opt_g8_1', text: 'Equal', isCorrect: true },
                        { id: 'opt_g8_2', text: 'Unequal', isCorrect: false },
                        { id: 'opt_g8_3', text: 'Supplementary', isCorrect: false },
                        { id: 'opt_g8_4', text: 'Complementary', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_9',
                    type: 'MCQ',
                    text: 'A line that touches a circle at exactly one point is called a',
                    marks: 1,
                    difficulty: 'Easy',
                    layout: 'row',
                    options: [
                        { id: 'opt_g9_1', text: 'Secant', isCorrect: false },
                        { id: 'opt_g9_2', text: 'Chord', isCorrect: false },
                        { id: 'opt_g9_3', text: 'Tangent', isCorrect: true },
                        { id: 'opt_g9_4', text: 'Segment', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_10',
                    type: 'MCQ',
                    text: 'The length of the complete boundary of a circle is called its',
                    marks: 1,
                    difficulty: 'Easy',
                    layout: 'row',
                    options: [
                        { id: 'opt_g10_1', text: 'Area', isCorrect: false },
                        { id: 'opt_g10_2', text: 'Diameter', isCorrect: false },
                        { id: 'opt_g10_3', text: 'Circumference', isCorrect: true },
                        { id: 'opt_g10_4', text: 'Sector', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_11',
                    type: 'MCQ',
                    text: 'The sector of a circle is the region between an arc and two \\\\\\\\',
                    marks: 1,
                    difficulty: 'Medium',
                    layout: 'row',
                    options: [
                        { id: 'opt_g11_1', text: 'Chords', isCorrect: false },
                        { id: 'opt_g11_2', text: 'Radii', isCorrect: true },
                        { id: 'opt_g11_3', text: 'Tangents', isCorrect: false },
                        { id: 'opt_g11_4', text: 'Secants', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_12',
                    type: 'MCQ',
                    text: 'A circle divides the plane, on which it lies, into \\\\\\\\ parts',
                    marks: 1,
                    difficulty: 'Medium',
                    layout: 'row',
                    options: [
                        { id: 'opt_g12_1', text: 'Two', isCorrect: false },
                        { id: 'opt_g12_2', text: 'Three', isCorrect: true },
                        { id: 'opt_g12_3', text: 'Four', isCorrect: false },
                        { id: 'opt_g12_4', text: 'Five', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_13',
                    type: 'MCQ',
                    text: 'If two arcs of a circle are congruent, then their corresponding chords are',
                    marks: 1,
                    difficulty: 'Medium',
                    layout: 'row',
                    options: [
                        { id: 'opt_g13_1', text: 'Parallel', isCorrect: false },
                        { id: 'opt_g13_2', text: 'Equal', isCorrect: true },
                        { id: 'opt_g13_3', text: 'Perpendicular', isCorrect: false },
                        { id: 'opt_g13_4', text: 'Coincident', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_14',
                    type: 'MCQ',
                    text: 'The center of the circle lies in the \\\\\\\\ of the circle',
                    marks: 1,
                    difficulty: 'Easy',
                    layout: 'row',
                    options: [
                        { id: 'opt_g14_1', text: 'Exterior', isCorrect: false },
                        { id: 'opt_g14_2', text: 'Interior', isCorrect: true },
                        { id: 'opt_g14_3', text: 'Boundary', isCorrect: false },
                        { id: 'opt_g14_4', text: 'None of these', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_15',
                    type: 'MCQ',
                    text: 'A point whose distance from the center of a circle is greater than its radius lies in the',
                    marks: 1,
                    difficulty: 'Medium',
                    layout: 'row',
                    options: [
                        { id: 'opt_g15_1', text: 'Interior', isCorrect: false },
                        { id: 'opt_g15_2', text: 'Exterior', isCorrect: true },
                        { id: 'opt_g15_3', text: 'Boundary', isCorrect: false },
                        { id: 'opt_g15_4', text: 'Semicircle', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_16',
                    type: 'MCQ',
                    text: 'Chords equidistant from the center of a circle are \\\\\\\\ in length',
                    marks: 1,
                    difficulty: 'Easy',
                    layout: 'row',
                    options: [
                        { id: 'opt_g16_1', text: 'Unequal', isCorrect: false },
                        { id: 'opt_g16_2', text: 'Double', isCorrect: false },
                        { id: 'opt_g16_3', text: 'Equal', isCorrect: true },
                        { id: 'opt_g16_4', text: 'Half', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_17',
                    type: 'MCQ',
                    text: 'The angle subtended by an arc at the center is \\\\\\\\ the angle subtended by it at any point on the remaining part of the circle',
                    marks: 1,
                    difficulty: 'Hard',
                    layout: 'row',
                    options: [
                        { id: 'opt_g17_1', text: 'Half', isCorrect: false },
                        { id: 'opt_g17_2', text: 'Double', isCorrect: true },
                        { id: 'opt_g17_3', text: 'Equal', isCorrect: false },
                        { id: 'opt_g17_4', text: 'Triple', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_18',
                    type: 'MCQ',
                    text: 'Angles in the same segment of a circle are',
                    marks: 1,
                    difficulty: 'Medium',
                    layout: 'row',
                    options: [
                        { id: 'opt_g18_1', text: 'Equal', isCorrect: true },
                        { id: 'opt_g18_2', text: 'Complementary', isCorrect: false },
                        { id: 'opt_g18_3', text: 'Supplementary', isCorrect: false },
                        { id: 'opt_g18_4', text: 'Unequal', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_19',
                    type: 'MCQ',
                    text: 'The sum of either pair of opposite angles of a cyclic quadrilateral is',
                    marks: 1,
                    difficulty: 'Medium',
                    layout: 'row',
                    options: [
                        { id: 'opt_g19_1', text: '90°', isCorrect: false },
                        { id: 'opt_g19_2', text: '180°', isCorrect: true },
                        { id: 'opt_g19_3', text: '270°', isCorrect: false },
                        { id: 'opt_g19_4', text: '360°', isCorrect: false }
                    ]
                },
                {
                    id: 'q_geom_20',
                    type: 'MCQ',
                    text: 'If the sum of a pair of opposite angles of a quadrilateral is 180°, the quadrilateral is',
                    marks: 1,
                    difficulty: 'Medium',
                    layout: 'row',
                    options: [
                        { id: 'opt_g20_1', text: 'Trapezium', isCorrect: false },
                        { id: 'opt_g20_2', text: 'Cyclic', isCorrect: true },
                        { id: 'opt_g20_3', text: 'Parallelogram', isCorrect: false },
                        { id: 'opt_g20_4', text: 'Rhombus', isCorrect: false }
                    ]
                }
            ]
        }]
    };
};

window.escHtml = function(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

window.toast = function(msg) {
    const el = document.getElementById('toast');
    if (el) {
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(el._timeout);
        el._timeout = setTimeout(() => el.classList.remove('show'), 2500);
    }
};

// Start application
document.addEventListener('DOMContentLoaded', () => {
    window.loadState();
    window.render();
});
