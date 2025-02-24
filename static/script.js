import { Note } from './components/Note.js';
import { EditorManager, formatText, toggleList, toggleAlignment } from './components/EditorManager.js';
import { TouchManager } from './components/TouchManager.js';

class NotesApp {
    constructor() {
        this.notes = [];
        this.activeNoteId = null;
        this.isEditing = false;
        this.textSizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

        // Initialize DOM elements
        this.initializeDOMElements();
        
        // Initialize managers
        this.editorManager = new EditorManager(this.editor);
        this.touchManager = new TouchManager(
            this.detailView,
            this.notesList,
            () => this.showListView(),
            (noteId) => this.deleteNote(noteId)
        );

        // Set up event listeners
        this.setupEventListeners();

        // Bind methods that need 'this' context
        this.saveNotes = this.saveNotes.bind(this);
        this.setActiveNote = this.setActiveNote.bind(this);
        this.saveNoteContent = this.saveNoteContent.bind(this);
        this.applyTextSize = this.applyTextSize.bind(this);
        this.increaseTextSize = this.increaseTextSize.bind(this);
        this.decreaseTextSize = this.decreaseTextSize.bind(this);

        // Bind the undo/redo methods from editorManager to the app instance
        this.undo = this.editorManager.undo.bind(this.editorManager);
        this.redo = this.editorManager.redo.bind(this.editorManager);

        // Initialize app state
        this.loadNotes();
        this.initializeDarkMode();
    }

    initializeDOMElements() {
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
    }

    setupEventListeners() {
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

    // Core note operations
    createNewNote() {
        this.activeNoteId = 'temp-' + Date.now().toString();
        this.showDetailView();
        this.toggleEditMode();
        this.titleInput.value = '';
        this.editor.innerHTML = '';
        this.applyTextSize('md');  // Set default size to medium
        this.titleInput.focus();
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

    deleteNote(noteId, event) {
        // Remove the Event instance check and make event optional
        if (event) {
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

    saveNotes() {
        try {
            localStorage.setItem('notes', JSON.stringify(this.notes));
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    }

    setActiveNote(noteId) {
        this.activeNoteId = noteId;
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            this.titleInput.value = note.title;
            this.editor.innerHTML = note.content;
            this.showDetailView();
            this.isEditing = false;
            this.editor.setAttribute('contenteditable', 'false');
            this.titleInput.readOnly = true;
            this.modeToggleBtn.innerHTML = '<span class="material-icons">edit</span>';
            this.toolbar.classList.remove('visible');
        }
    }

    // View management
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
        if (this.isEditing) {
            // Use editorManager's methods instead
            this.editorManager.undoStack = [];
            this.editorManager.redoStack = [];
            this.editorManager.pushToUndoStack();
        }
    }

    // UI rendering
    renderNotesList() {
        this.notesList.innerHTML = '';
        if (this.notes.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.dataset.noteId = note.id;  // Add this line
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
            noteElement.dataset.noteId = note.id;  // Add this line
            noteElement.innerHTML = `
                <div class="note-title">${note.title}</div>
                <div class="note-preview">${this.getPreview(note.content)}</div>
                <div class="note-meta">Modified ${this.formatDate(note.modifiedAt)}</div>
            `;
            noteElement.addEventListener('click', () => this.setActiveNote(note.id));
            this.notesList.appendChild(noteElement);
        });
    }

    // Text formatting
    applyTextSize(size) {
        // Remove the line that removes classes from editor
        // Instead, wrap selected text in a span with the appropriate class
        
        if (!this.isEditing) return;
        
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        
        if (range.collapsed) return; // No text selected
        
        // Create span with the new size class
        const span = document.createElement('span');
        span.classList.add(`text-${size}`);
        
        // Extract the selected content
        const fragment = range.extractContents();
        
        // Remove any existing text-* classes from child elements
        const elements = fragment.querySelectorAll('[class*="text-"]');
        elements.forEach(el => {
            const classes = Array.from(el.classList);
            classes.forEach(cls => {
                if (cls.startsWith('text-')) {
                    el.classList.remove(cls);
                }
            });
        });
        
        // Add the content to the span
        span.appendChild(fragment);
        
        // Insert the span
        range.insertNode(span);
        
        // Restore selection
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
        
        this.saveNoteContent();
    }

    increaseTextSize() {
        if (!this.activeNoteId || !this.isEditing) return;
        
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        if (range.collapsed) return; // No text selected
        
        // Find the current size of the selection
        let currentSize = 'md'; // default size
        const node = range.commonAncestorContainer;
        const sizeSpan = node.nodeType === 1 ? node : node.parentElement;
        
        if (sizeSpan) {
            const sizeClass = Array.from(sizeSpan.classList || [])
                .find(cls => cls.startsWith('text-'));
            if (sizeClass) {
                currentSize = sizeClass.replace('text-', '');
            }
        }
        
        const currentIndex = this.textSizes.indexOf(currentSize);
        if (currentIndex < this.textSizes.length - 1) {
            const newSize = this.textSizes[currentIndex + 1];
            this.applyTextSize(newSize);
        }
    }

    decreaseTextSize() {
        if (!this.activeNoteId || !this.isEditing) return;
        
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        if (range.collapsed) return; // No text selected
        
        // Find the current size of the selection
        let currentSize = 'md'; // default size
        const node = range.commonAncestorContainer;
        const sizeSpan = node.nodeType === 1 ? node : node.parentElement;
        
        if (sizeSpan) {
            const sizeClass = Array.from(sizeSpan.classList || [])
                .find(cls => cls.startsWith('text-'));
            if (sizeClass) {
                currentSize = sizeClass.replace('text-', '');
            }
        }
        
        const currentIndex = this.textSizes.indexOf(currentSize);
        if (currentIndex > 0) {
            const newSize = this.textSizes[currentIndex - 1];
            this.applyTextSize(newSize);
        }
    }

    // Utility methods
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

    // Dark mode
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

    // Search functionality
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
            noteElement.dataset.noteId = note.id;  // Add this line
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

// Initialize the app
const app = new NotesApp();

// Export for global access
window.formatText = formatText;
window.toggleList = toggleList;
window.toggleAlignment = toggleAlignment;
window.app = app; // Export app instance for toolbar buttons