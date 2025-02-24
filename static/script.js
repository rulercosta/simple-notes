class Note {
    constructor(id, title, content = '', createdAt = new Date().toISOString(), modifiedAt = null, textSize = 'md') {
        this.id = id || Date.now().toString();
        this.title = title;
        this.content = content;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt || createdAt;
        this.textSize = textSize;
    }
}

class NotesApp {
    constructor() {
        this.notes = [];
        this.activeNoteId = null;
        this.isEditing = false;

        // DOM Elements
        this.listView = document.querySelector('.list-view');
        this.detailView = document.querySelector('.detail-view');
        this.notesList = document.getElementById('notes-list');
        this.editor = document.getElementById('editor');
        this.newNoteBtn = document.getElementById('new-note-btn');
        this.backBtn = document.getElementById('back-btn');
        this.modeToggleBtn = document.getElementById('mode-toggle-btn');
        this.toolbar = document.querySelector('.toolbar');
        this.titleInput = document.getElementById('note-title');
        this.darkModeSwitch = document.getElementById('dark-mode-switch');
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search-btn');

        // Event Listeners
        this.newNoteBtn.addEventListener('click', () => this.createNewNote());
        this.backBtn.addEventListener('click', () => this.showListView());
        this.modeToggleBtn.addEventListener('click', () => this.toggleEditMode());
        this.editor.addEventListener('input', () => this.saveNoteContent());
        this.titleInput.addEventListener('input', () => this.saveNoteContent());
        this.darkModeSwitch.addEventListener('click', () => this.toggleDarkMode());
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        
        // Add new event listener for editor keydown
        this.editor.addEventListener('keydown', (e) => this.handleEditorKeydown(e));

        // Add touch handling properties
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchMoveX = 0;
        this.isSwiping = false;
        
        // Add touch event listeners
        this.detailView.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.detailView.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.detailView.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Add Android-specific properties
        this.isAndroid = /Android/.test(navigator.userAgent);
        
        // Add these new properties
        this.swipeStartX = null;
        this.swipeStartY = null;
        this.currentSwipeItem = null;
        this.swipeThreshold = -80; // Amount of pixels to trigger delete
        
        // Add touch event listeners for notes list
        this.notesList.addEventListener('touchstart', (e) => this.handleNoteSwipeStart(e));
        this.notesList.addEventListener('touchmove', (e) => this.handleNoteSwipeMove(e));
        this.notesList.addEventListener('touchend', (e) => this.handleNoteSwipeEnd(e));

        // Add this to existing properties in constructor
        this.textSizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

        // Initialize
        this.loadNotes(); // Replace this.renderNotesList()
        this.initializeDarkMode();
    }

    handleEditorKeydown(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            let element = range.commonAncestorContainer;
            
            if (element.nodeType === 3) {
                element = element.parentElement;
            }
            
            const listItem = element.closest('li');
            
            if (listItem) {
                if (e.shiftKey) {
                    // Only outdent if there's a parent list
                    const parentList = listItem.closest('ul, ol');
                    const grandparentListItem = parentList?.parentElement?.closest('li');
                    
                    if (parentList && (
                        // Allow outdent if we're in a nested list
                        grandparentListItem ||
                        // Or if we're in the root list
                        parentList.parentElement === this.editor
                    )) {
                        document.execCommand('outdent');
                    }
                } else {
                    // For indentation, only allow if there's a previous sibling
                    const previousSibling = listItem.previousElementSibling;
                    if (previousSibling && previousSibling.tagName === 'LI') {
                        document.execCommand('indent');
                    }
                }
            }
        }
    }

    handleTouchStart(e) {
        if (e.target.closest('.editor-container')) return;
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchMoveX = 0;
        this.isSwiping = false;
    }

    handleTouchMove(e) {
        if (!this.touchStartX || e.target.closest('.editor-container')) return;
        
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = touchX - this.touchStartX;
        const deltaY = Math.abs(touchY - this.touchStartY);
        
        // Check if horizontal swipe
        if (!this.isSwiping && Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
            this.isSwiping = true;
        }
        
        if (this.isSwiping) {
            e.preventDefault();
            this.touchMoveX = deltaX;
            
            // Add different swipe behavior for Android
            if (this.isAndroid) {
                // Use opacity for visual feedback on Android
                const opacity = Math.max(0, 1 - (deltaX / 200));
                this.detailView.style.transform = `translateX(${Math.max(deltaX, 0)}px)`;
                this.detailView.style.opacity = opacity;
            } else {
                this.detailView.style.transform = `translateX(${Math.max(deltaX, 0)}px)`;
            }
        }
    }

    handleTouchEnd(e) {
        if (!this.isSwiping) return;
        
        if (this.touchMoveX > 100) {
            this.showListView();
        } else {
            this.detailView.style.transform = '';
            if (this.isAndroid) {
                this.detailView.style.opacity = '';
            }
        }
        
        this.touchStartX = 0;
        this.touchMoveX = 0;
        this.isSwiping = false;
    }

    handleNoteSwipeStart(e) {
        const noteItem = e.target.closest('.note-item');
        if (!noteItem) return;

        this.swipeStartX = e.touches[0].clientX;
        this.swipeStartY = e.touches[0].clientY;
        this.currentSwipeItem = noteItem;
        this.currentSwipeItem.classList.add('swiping');
    }

    handleNoteSwipeMove(e) {
        if (!this.currentSwipeItem || !this.swipeStartX) return;

        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = touchX - this.swipeStartX;
        const deltaY = Math.abs(touchY - this.swipeStartY);

        // If vertical scrolling, cancel swipe
        if (deltaY > Math.abs(deltaX)) {
            this.resetSwipe();
            return;
        }

        // Only allow left swipe
        if (deltaX > 0) {
            this.currentSwipeItem.style.transform = 'translateX(0)';
            return;
        }

        e.preventDefault();
        this.currentSwipeItem.style.transform = `translateX(${deltaX}px)`;
    }

    handleNoteSwipeEnd(e) {
        if (!this.currentSwipeItem) return;

        const noteItem = this.currentSwipeItem;
        const transform = getComputedStyle(noteItem).transform;
        const matrix = new DOMMatrix(transform);
        const translateX = matrix.m41;

        if (translateX <= this.swipeThreshold) {
            // Delete the note
            noteItem.classList.add('deleting');
            const noteId = this.notes[Array.from(this.notesList.children).indexOf(noteItem)].id;
            setTimeout(() => this.deleteNote(noteId, new Event('swipe')), 200);
        } else {
            // Reset position
            noteItem.style.transform = '';
        }

        this.resetSwipe();
    }

    resetSwipe() {
        if (this.currentSwipeItem) {
            this.currentSwipeItem.classList.remove('swiping');
            this.currentSwipeItem.style.transform = '';
        }
        this.swipeStartX = null;
        this.swipeStartY = null;
        this.currentSwipeItem = null;
    }

    loadNotes() {
        try {
            const savedNotes = localStorage.getItem('notes');
            if (savedNotes) {
                this.notes = JSON.parse(savedNotes).map(note => new Note(
                    note.id,
                    note.title,
                    note.content,
                    note.createdAt,
                    note.modifiedAt,
                    note.textSize
                ));
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = [];
        }
        this.renderNotesList();
    }

    saveNotes() {
        try {
            localStorage.setItem('notes', JSON.stringify(this.notes));
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    }

    showListView() {
        this.listView.classList.add('active');
        this.detailView.classList.remove('active');
        this.detailView.classList.add('inactive');
        this.isEditing = false;
        this.editor.setAttribute('contenteditable', 'false');
        this.modeToggleBtn.innerHTML = '<span class="material-icons">edit</span>';
        setTimeout(() => {
            this.activeNoteId = null;
        }, 300);
        this.detailView.style.transform = '';  // Reset transform
        if (this.isAndroid) {
            this.detailView.style.opacity = '';
        }
    }

    showDetailView() {
        this.detailView.classList.remove('inactive');
        this.detailView.classList.add('active');
        this.listView.classList.remove('active');
    }

    toggleEditMode() {
        this.isEditing = !this.isEditing;
        this.editor.setAttribute('contenteditable', this.isEditing);
        this.titleInput.readOnly = !this.isEditing;
        this.modeToggleBtn.innerHTML = this.isEditing ? 
            '<span class="material-icons">done</span>' : 
            '<span class="material-icons">edit</span>';
        this.toolbar.classList.toggle('visible', this.isEditing);
    }

    createNewNote() {
        this.activeNoteId = 'temp-' + Date.now().toString();
        this.showDetailView();
        this.toggleEditMode();
        this.titleInput.value = '';
        this.editor.innerHTML = '';
        this.applyTextSize('md');  // Set default size to medium
        this.titleInput.focus();
    }

    setActiveNote(noteId) {
        this.activeNoteId = noteId;
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            this.titleInput.value = note.title;
            this.editor.innerHTML = note.content;
            this.applyTextSize(note.textSize);
            this.showDetailView();
            this.isEditing = false;
            this.editor.setAttribute('contenteditable', 'false');
            this.titleInput.readOnly = true;
            this.modeToggleBtn.innerHTML = '<span class="material-icons">edit</span>';
            this.toolbar.classList.remove('visible');
        }
    }

    deleteNote(noteId, event) {
        if (!(event instanceof Event)) {
            event.stopPropagation();
        }
        const noteIndex = this.notes.findIndex(n => n.id === noteId);
        if (noteIndex !== -1) {
            this.notes.splice(noteIndex, 1);
            this.saveNotes();
            if (this.activeNoteId === noteId) {
                this.showListView();
            }
            this.renderNotesList();
        }
    }

    getPreview(content) {
        const div = document.createElement('div');
        div.innerHTML = content;
        const text = div.textContent || div.innerText;
        return text.substring(0, 100) + (text.length > 100 ? '...' : '');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    saveNoteContent() {
        if (!this.activeNoteId) return;

        const title = this.titleInput.value.trim();
        if (!title) return; // Don't save if there's no title

        if (this.activeNoteId.startsWith('temp-')) {
            // This is a new note that hasn't been saved yet
            const newNote = new Note(
                Date.now().toString(),
                title,
                this.editor.innerHTML,
                undefined,
                undefined,
                'normal'
            );
            this.notes.unshift(newNote);
            this.activeNoteId = newNote.id;
        } else {
            // Existing note
            const noteIndex = this.notes.findIndex(n => n.id === this.activeNoteId);
            if (noteIndex !== -1) {
                this.notes[noteIndex].title = title;
                this.notes[noteIndex].content = this.editor.innerHTML;
                this.notes[noteIndex].modifiedAt = new Date().toISOString();
            }
        }
        
        this.saveNotes();
        this.renderNotesList();
    }

    applyTextSize(size) {
        const sizeClasses = ['text-xs', 'text-sm', 'text-md', 'text-lg', 'text-xl', 'text-2xl'];
        this.editor.classList.remove(...sizeClasses);
        if (size) {
            this.editor.classList.add(`text-${size}`);
        }
        
        // Update toolbar button states
        const buttons = document.querySelectorAll('.toolbar-size-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick').includes(size)) {
                btn.classList.add('active');
            }
        });
    }

    increaseTextSize() {
        if (!this.activeNoteId || !this.isEditing) return;
        
        const noteIndex = this.notes.findIndex(n => n.id === this.activeNoteId);
        if (noteIndex === -1) return;

        const currentSize = this.notes[noteIndex].textSize;
        const currentIndex = this.textSizes.indexOf(currentSize);
        if (currentIndex < this.textSizes.length - 1) {
            const newSize = this.textSizes[currentIndex + 1];
            this.notes[noteIndex].textSize = newSize;
            this.applyTextSize(newSize);
            this.saveNotes();
        }
    }

    decreaseTextSize() {
        if (!this.activeNoteId || !this.isEditing) return;
        
        const noteIndex = this.notes.findIndex(n => n.id === this.activeNoteId);
        if (noteIndex === -1) return;

        const currentSize = this.notes[noteIndex].textSize;
        const currentIndex = this.textSizes.indexOf(currentSize);
        if (currentIndex > 0) {
            const newSize = this.textSizes[currentIndex - 1];
            this.notes[noteIndex].textSize = newSize;
            this.applyTextSize(newSize);
            this.saveNotes();
        }
    }

    renderNotesList() {
        this.notesList.innerHTML = '';
        if (this.notes.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.innerHTML = `
                <div class="note-title">${note.title}</div>
                <div class="note-preview">${this.getPreview(note.content)}</div>
                <div class="note-meta">Modified ${this.formatDate(note.modifiedAt)}</div>
            `;
            noteElement.addEventListener('click', () => this.setActiveNote(note.id));
            this.notesList.appendChild(noteElement);
        });
    }

    renderEmptyState() {
        this.notesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h2>No Notes</h2>
                <p>Tap + to create your first note</p>
            </div>
        `;
    }

    initializeDarkMode() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.darkModeSwitch.classList.add('active');
        }
    }

    toggleDarkMode() {
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDarkMode) {
            document.documentElement.removeAttribute('data-theme');
            this.darkModeSwitch.classList.remove('active');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.darkModeSwitch.classList.add('active');
        }
        localStorage.setItem('darkMode', (!isDarkMode).toString());
    }

    handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase();
        this.clearSearchBtn.classList.toggle('visible', searchTerm.length > 0);
        
        if (!searchTerm) {
            this.renderNotesList();
            return;
        }

        const filteredNotes = this.notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm) ||
            this.getPreview(note.content).toLowerCase().includes(searchTerm)
        );

        this.renderFilteredNotes(filteredNotes);
    }

    clearSearch() {
        this.searchInput.value = '';
        this.clearSearchBtn.classList.remove('visible');
        this.renderNotesList();
        this.searchInput.focus();
    }

    renderFilteredNotes(filteredNotes) {
        this.notesList.innerHTML = '';
        if (filteredNotes.length === 0) {
            this.notesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <h2>No Results</h2>
                    <p>No notes match your search</p>
                </div>
            `;
            return;
        }

        filteredNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.innerHTML = `
                <div class="note-title">${note.title}</div>
                <div class="note-preview">${this.getPreview(note.content)}</div>
                <div class="note-meta">Modified ${this.formatDate(note.modifiedAt)}</div>
            `;
            noteElement.addEventListener('click', () => this.setActiveNote(note.id));
            this.notesList.appendChild(noteElement);
        });
    }
}

function formatText(command) {
    document.execCommand(command, false, null);
}

function formatList(command) {
    document.execCommand(command, false, null);
}

// Initialize the app
const app = new NotesApp();