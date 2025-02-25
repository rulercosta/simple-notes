import { NoteService } from './services/NoteService.js';
import { ViewManager } from './managers/ViewManager.js';
import { ThemeManager } from './managers/ThemeManager.js';
import { SearchManager } from './managers/SearchManager.js';
import { EditorManager, formatText, toggleList, toggleAlignment } from './components/EditorManager.js';
import { TouchManager } from './components/TouchManager.js';
import { Note } from './components/Note.js';

class NotesApp {
    constructor() {
        this.noteService = new NoteService();
        this.viewManager = new ViewManager();
        
        this.initializeDOMElements();
        
        this.themeManager = new ThemeManager();
        
        this.textSizes = ['xs', 'sm', 'md', 'lg', 'xl'];
        
        this.editorManager = new EditorManager(this.editor);
        this.touchManager = new TouchManager(
            this.detailView,  
            this.notesList,   
            () => this.showListView(),  
            (noteId) => this.deleteNote(noteId)  
        );
        this.searchManager = new SearchManager(
            this.noteService,
            (notes) => this.renderNotesList(notes)
        );

        this.setupEventListeners();

        this.renderNotesList();

        this.toolbar = document.querySelector('.toolbar');
        this.toolbar.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;
            
            const action = button.dataset.action;
            switch (action) {
                case 'undo': this.undo(); break;
                case 'redo': this.redo(); break;
                case 'bold': formatText('bold'); break;
                case 'italic': formatText('italic'); break;
                case 'underline': formatText('underline'); break;
                case 'list': toggleList(); break;
                case 'align': toggleAlignment(); break;
                case 'decrease-size': this.decreaseTextSize(); break;
                case 'increase-size': this.increaseTextSize(); break;
            }
        });
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
        this.darkModeBtn = document.getElementById('dark-mode-btn');
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search-btn');
    }

    setupEventListeners() {
        this.newNoteBtn.addEventListener('click', () => this.createNewNote());
        this.backBtn.addEventListener('click', () => this.showListView());
        this.modeToggleBtn.addEventListener('click', () => this.toggleEditMode());
        this.editor.addEventListener('input', () => this.saveNoteContent());
        this.titleInput.addEventListener('input', () => this.saveNoteContent());
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        
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
                    const parentList = listItem.closest('ul, ol');
                    const grandparentListItem = parentList?.parentElement?.closest('li');
                    
                    if (parentList && (
                        grandparentListItem ||
                        parentList.parentElement === this.editor
                    )) {
                        document.execCommand('outdent');
                    }
                } else {
                    const previousSibling = listItem.previousElementSibling;
                    if (previousSibling && previousSibling.tagName === 'LI') {
                        document.execCommand('indent');
                    }
                }
            }
        }
    }

    createNewNote() {
        const composeBtn = document.getElementById('new-note-btn');
        composeBtn.classList.add('active');
        
        const newNote = this.noteService.createNote('', '');
        this.activeNoteId = newNote.id;
        this.showDetailView();
        this.toggleEditMode();
        this.titleInput.value = '';
        this.editor.innerHTML = '';
        this.titleInput.focus();
    }

    saveNoteContent() {
        if (!this.activeNoteId) return;

        const title = this.titleInput.value.trim();
        const content = this.editor.innerHTML;

        if (!title) {
            const note = this.noteService.getNote(this.activeNoteId);
            if (note) {
                note.content = content;
                this.renderNotesList();
            }
            return;
        }

        this.noteService.updateNote(this.activeNoteId, title, content);
        this.renderNotesList();
    }

    deleteNote(noteId, event) {
        if (event) {
            event.stopPropagation();
        }
        
        if (this.noteService.deleteNote(noteId)) {
            if (this.activeNoteId === noteId) {
                this.showListView();
            }
            this.renderNotesList();
        }
    }

    setActiveNote(noteId) {
        this.activeNoteId = noteId;
        const note = this.noteService.getNote(noteId);
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

    showListView() {
        this.listView.classList.add('active');
        this.detailView.classList.remove('active');
        this.detailView.classList.add('inactive');
        this.isEditing = false;
        this.editor.setAttribute('contenteditable', 'false');
        this.titleInput.readOnly = true;
        this.toolbar.classList.remove('visible');
        this.modeToggleBtn.innerHTML = '<span class="material-icons">edit</span>';
        
        const composeBtn = document.getElementById('new-note-btn');
        composeBtn.classList.remove('active');
        
        const currentNote = this.noteService.getNote(this.activeNoteId);
        if (currentNote && !currentNote.title.trim()) {
            this.noteService.deleteNote(this.activeNoteId);
            this.renderNotesList();
        }
        
        this.activeNoteId = null;
        this.editor.blur();
        this.titleInput.blur();
        
        this.detailView.style.transform = '';  
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
            this.editorManager.undoStack = [];
            this.editorManager.redoStack = [];
            this.editorManager.pushToUndoStack();
        }
    }

    renderNotesList() {
        const notes = this.noteService.notes;
        this.notesList.innerHTML = '';
        if (notes.length === 0) {
            this.renderEmptyState();
            return;
        }

        notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.dataset.noteId = note.id;
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
                <p>Tap the compose button to create a note.</p>
            </div>
        `;
    }

    renderFilteredNotes(filteredNotes) {
        this.notesList.innerHTML = '';
        if (filteredNotes.length === 0) {
            this.notesList.innerHTML = `
                <div class="empty-state">
                    <h2>No Results</h2>
                    <p>No notes match your search.</p>
                </div>
            `;
            return;
        }

        filteredNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.dataset.noteId = note.id;
            noteElement.innerHTML = `
                <div class="note-title">${note.title}</div>
                <div class="note-preview">${this.getPreview(note.content)}</div>
                <div class="note-meta">Modified ${this.formatDate(note.modifiedAt)}</div>
            `;
            noteElement.addEventListener('click', () => this.setActiveNote(note.id));
            this.notesList.appendChild(noteElement);
        });
    }

    applyTextSize(size) {
        
        if (!this.isEditing) return;
        
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        
        if (range.collapsed) return; 
        
        const span = document.createElement('span');
        span.classList.add(`text-${size}`);
        
        const fragment = range.extractContents();
        
        const elements = fragment.querySelectorAll('[class*="text-"]');
        elements.forEach(el => {
            const classes = Array.from(el.classList);
            classes.forEach(cls => {
                if (cls.startsWith('text-')) {
                    el.classList.remove(cls);
                }
            });
        });
        
        span.appendChild(fragment);
        
        range.insertNode(span);
        
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
        if (range.collapsed) return; 
        
        let currentSize = 'md'; 
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
        if (range.collapsed) return; 
        
        let currentSize = 'md'; 
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

    handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase();
        this.clearSearchBtn.classList.toggle('visible', searchTerm.length > 0);
        
        if (!searchTerm) {
            this.renderNotesList();
            return;
        }

        const filteredNotes = this.noteService.notes.filter(note => 
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
                    <h2>No Results</h2>
                    <p>No notes match your search.</p>
                </div>
            `;
            return;
        }

        filteredNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.dataset.noteId = note.id;  
            noteElement.innerHTML = `
                <div class="note-title">${note.title}</div>
                <div class="note-preview">${this.getPreview(note.content)}</div>
                <div class="note-meta">Modified ${this.formatDate(note.modifiedAt)}</div>
            `;
            noteElement.addEventListener('click', () => this.setActiveNote(note.id));
            this.notesList.appendChild(noteElement);
        });
    }

    undo() {
        if (this.editorManager) {
            this.editorManager.undo();
            this.saveNoteContent();
        }
    }

    redo() {
        if (this.editorManager) {
            this.editorManager.redo();
            this.saveNoteContent();
        }
    }
}

const app = new NotesApp();

window.app = app;
window.formatText = formatText;
window.toggleList = toggleList;
window.toggleAlignment = toggleAlignment;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const basePath = window.location.pathname.includes('simple-notes') 
            ? '/simple-notes'
            : '';
        
        navigator.serviceWorker.register(`${basePath}/sw.js`, {
            scope: `${basePath}/`
        })
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.error('ServiceWorker registration failed: ', err);
            });
    });
}