// js/fileManager.js

window.renderFolderTree = function() {
    const container = document.getElementById('papersList');
    if (!container) return;

    const searchInput = document.getElementById('paperSearch');
    const search = searchInput ? searchInput.value.toLowerCase() : '';
    const filteredPapers = window.state.papers.filter(p => p.name.toLowerCase().includes(search));

    let html = '';

    // Render Folders
    window.state.folders.forEach(fol => {
        const folderPapers = filteredPapers.filter(p => p.folderId === fol.id);
        const isExpanded = !!fol.expanded;

        html += `
            <div class="tree-folder-item" data-folder-id="${fol.id}">
                <div class="tree-folder-header" onclick="window.toggleFolder('${fol.id}')">
                    <span class="folder-toggle-icon">${isExpanded ? '▼' : '▶'}</span>
                    <span class="folder-icon">${isExpanded ? '📂' : '📁'}</span>
                    <span class="folder-name">${window.escHtml(fol.name)}</span>
                    <div class="folder-menu-wrapper" onclick="event.stopPropagation()">
                        <button class="btn-menu-trigger" onclick="window.toggleFolderMenu(event, '${fol.id}')">⋮</button>
                        <div class="tree-dropdown hidden" id="menu-folder-${fol.id}">
                            <button onclick="window.renameFolder('${fol.id}')">✏️ Rename Folder</button>
                            <button onclick="window.deleteFolder('${fol.id}')" style="color:var(--danger)">🗑️ Delete Folder</button>
                        </div>
                    </div>
                </div>
                <div class="tree-folder-children ${isExpanded ? '' : 'hidden'}">
        `;

        if (folderPapers.length === 0) {
            html += `<div class="tree-empty-message">Empty Folder</div>`;
        } else {
            folderPapers.forEach(p => {
                html += window.renderPaperTreeItemHTML(p);
            });
        }

        html += `
                </div>
            </div>
        `;
    });

    // Render root papers
    const rootPapers = filteredPapers.filter(p => !p.folderId);
    if (rootPapers.length > 0 || window.state.folders.length > 0) {
        rootPapers.forEach(p => {
            html += window.renderPaperTreeItemHTML(p);
        });
    } else {
        if (window.state.folders.length === 0) {
            html = `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:12px;">No papers or folders. Click "+ Folder" or "+ Paper" above.</div>`;
        }
    }

    container.innerHTML = html;
};

window.renderPaperTreeItemHTML = function(p) {
    const active = p.id === window.state.activePaperId ? 'active' : '';
    
    // Calculate stats
    const numSections = p.sections.length;
    let numQuestions = 0;
    p.sections.forEach(s => {
        numQuestions += s.questions.length;
    });

    return `
        <div class="tree-paper-item ${active}" onclick="window.selectPaper('${p.id}')">
            <span class="paper-icon">📄</span>
            <div class="paper-details-col">
                <span class="paper-name">${window.escHtml(p.name)}</span>
                <span class="paper-meta-subtitle">${numSections} sec • ${numQuestions} Q</span>
            </div>
            <div class="paper-menu-wrapper" onclick="event.stopPropagation()">
                <button class="btn-menu-trigger" onclick="window.togglePaperMenu(event, '${p.id}')">⋮</button>
                <div class="tree-dropdown hidden" id="menu-paper-${p.id}">
                    <button onclick="window.renamePaperGlobal('${p.id}')">✏️ Rename</button>
                    <button onclick="window.duplicatePaperGlobal('${p.id}')">📋 Duplicate</button>
                    <button onclick="window.openMoveModal('${p.id}')">📁 Move to Folder</button>
                    <button onclick="window.deletePaper('${p.id}')" style="color:var(--danger)">🗑️ Delete</button>
                </div>
            </div>
        </div>
    `;
};

// ─── Folder Operations ───
window.createNewFolder = function() {
    const name = prompt('Enter new folder name:');
    if (!name) return;
    window.state.folders.push({
        id: 'fol_' + Date.now(),
        name: name,
        expanded: true
    });
    window.saveState();
    window.render();
    window.toast('📁 Folder created');
};

window.renameFolder = function(folderId) {
    const folder = window.state.folders.find(f => f.id === folderId);
    if (!folder) return;
    const name = prompt('Rename folder:', folder.name);
    if (!name) return;
    folder.name = name;
    window.saveState();
    window.render();
    window.toast('📁 Folder renamed');
};

window.deleteFolder = function(folderId) {
    if (!confirm('Are you sure you want to delete this folder? Papers inside will be moved to root.')) return;
    window.state.papers.forEach(p => {
        if (p.folderId === folderId) p.folderId = null;
    });
    window.state.folders = window.state.folders.filter(f => f.id !== folderId);
    window.saveState();
    window.render();
    window.toast('🗑️ Folder deleted');
};

window.toggleFolder = function(folderId) {
    const folder = window.state.folders.find(f => f.id === folderId);
    if (folder) {
        folder.expanded = !folder.expanded;
        window.saveState();
        window.renderFolderTree();
    }
};

// ─── Paper Operations ───
window.renamePaperGlobal = function(paperId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    const name = prompt('Rename exam paper:', paper.name);
    if (name) {
        paper.name = name;
        window.saveState();
        window.render();
        window.toast('✏️ Paper renamed');
    }
};

window.duplicatePaperGlobal = function(paperId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;
    
    const copy = JSON.parse(JSON.stringify(paper));
    copy.id = 'paper_' + Date.now();
    copy.name = paper.name + ' (Copy)';

    window.state.papers.push(copy);
    window.state.activePaperId = copy.id;
    window.saveState();
    window.render();
    window.toast('📋 Paper duplicated');
};

// ─── Move Paper Modal overlay handlers ───
window.openMoveModal = function(paperId) {
    const paper = window.state.papers.find(p => p.id === paperId);
    if (!paper) return;

    document.getElementById('movePaperId').value = paperId;
    const select = document.getElementById('moveDestFolderId');

    let html = '<option value="root">(Root / No Folder)</option>';
    window.state.folders.forEach(f => {
        const selected = paper.folderId === f.id ? 'selected' : '';
        html += `<option value="${f.id}" ${selected}>${f.name}</option>`;
    });
    select.innerHTML = html;

    document.getElementById('movePaperModal').classList.remove('hidden');
};

window.closeMoveModal = function() {
    document.getElementById('movePaperModal').classList.add('hidden');
};

window.applyMovePaper = function() {
    const paperId = document.getElementById('movePaperId').value;
    const destFolderId = document.getElementById('moveDestFolderId').value;

    const paper = window.state.papers.find(p => p.id === paperId);
    if (paper) {
        paper.folderId = destFolderId === 'root' ? null : destFolderId;
        window.saveState();
        window.closeMoveModal();
        window.render();
        window.toast('📁 Paper moved inside tree');
    }
};

// ─── Context menu dropdown toggles ───
window.toggleFolderMenu = function(e, id) {
    e.stopPropagation();
    window.closeAllMenusExcept(`menu-folder-${id}`);
    const menu = document.getElementById(`menu-folder-${id}`);
    if (menu) menu.classList.toggle('hidden');
};

window.togglePaperMenu = function(e, id) {
    e.stopPropagation();
    window.closeAllMenusExcept(`menu-paper-${id}`);
    const menu = document.getElementById(`menu-paper-${id}`);
    if (menu) menu.classList.toggle('hidden');
};

window.closeAllMenusExcept = function(exceptId = null) {
    document.querySelectorAll('.tree-dropdown').forEach(d => {
        if (d.id !== exceptId) d.classList.add('hidden');
    });
};

window.createNewPaper = function() {
    const name = prompt('Enter new exam paper title:');
    if (!name) return;
    const paper = {
        id: 'paper_' + Date.now(),
        name: name,
        folderId: null,
        header: window.createDefaultHeader(name),
        sections: []
    };
    window.state.papers.push(paper);
    window.state.activePaperId = paper.id;
    window.saveState();
    window.render();
    window.toast('📄 Exam paper template created');
};

window.selectPaper = function(paperId) {
    window.state.activePaperId = paperId;
    window.saveState();
    window.render(true);
};

window.deletePaper = function(paperId) {
    if (!confirm('Are you sure you want to delete this paper?')) return;
    window.state.papers = window.state.papers.filter(p => p.id !== paperId);
    if (window.state.activePaperId === paperId) {
        window.state.activePaperId = window.state.papers.length > 0 ? window.state.papers[0].id : null;
    }
    window.saveState();
    window.render();
    window.toast('🗑️ Paper deleted');
};

document.addEventListener('click', () => {
    window.closeAllMenusExcept();
});
