class Note {
    constructor(id, content = '', timestamp = new Date().toISOString()) {
        this.id = id || Date.now().toString();
        this.content = content;
        this.timestamp = timestamp;
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

        // Event Listeners
        this.newNoteBtn.addEventListener('click', () => this.createNewNote());
        this.backBtn.addEventListener('click', () => this.showListView());
        this.modeToggleBtn.addEventListener('click', () => this.toggleEditMode());
        this.editor.addEventListener('input', () => this.saveNoteContent());

        // Initialize
        this.createWelcomeNoteIfEmpty();
        this.renderNotesList();
    }

    createWelcomeNoteIfEmpty() {
        if (this.notes.length === 0) {
            const welcomeContent = `
                <h1>Welcome to Notes!</h1>
                <br>
                <p>This is your first note. Some things you can do:</p>
                <br>
                <ul>
                    <li>Create new notes with the + button</li>
                    <li>Format text using the toolbar</li>
                    <li>Switch between view and edit modes</li>
                    <li>Your changes save automatically</li>
                </ul>
                <br>
                <p>Tap Edit to start writing!</p>
            `;
            const welcomeNote = new Note(Date.now().toString(), welcomeContent);
            this.notes.push(welcomeNote);
        }
    }

    showListView() {
        this.listView.classList.add('active');
        this.detailView.classList.remove('active');
        this.detailView.classList.add('inactive');
        this.isEditing = false;
        this.editor.setAttribute('contenteditable', 'false');
        this.modeToggleBtn.textContent = 'Edit';
        setTimeout(() => {
            this.activeNoteId = null;
        }, 300);
    }

    showDetailView() {
        this.detailView.classList.remove('inactive');
        this.detailView.classList.add('active');
        this.listView.classList.remove('active');
    }

    toggleEditMode() {
        this.isEditing = !this.isEditing;
        this.editor.setAttribute('contenteditable', this.isEditing);
        this.modeToggleBtn.textContent = this.isEditing ? 'Done' : 'Edit';
    }

    createNewNote() {
        const newNote = new Note();
        this.notes.unshift(newNote);
        this.renderNotesList();
        this.setActiveNote(newNote.id);
        this.showDetailView();
        this.toggleEditMode();
    }

    setActiveNote(noteId) {
        this.activeNoteId = noteId;
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            this.editor.innerHTML = note.content;
            this.showDetailView();
            this.isEditing = false;
            this.editor.setAttribute('contenteditable', 'false');
            this.modeToggleBtn.textContent = 'Edit';
        }
    }

    deleteNote(noteId, event) {
        event.stopPropagation();
        const noteIndex = this.notes.findIndex(n => n.id === noteId);
        if (noteIndex !== -1) {
            this.notes.splice(noteIndex, 1);
            if (this.activeNoteId === noteId) {
                this.showListView();
            }
            this.renderNotesList();
        }
    }

    getFirstLine(content) {
        const div = document.createElement('div');
        div.innerHTML = content;
        const text = div.textContent || div.innerText;
        const firstLine = text.split('\n')[0].trim();
        return firstLine || 'New Note';
    }

    getPreview(content) {
        const div = document.createElement('div');
        div.innerHTML = content;
        const text = div.textContent || div.innerText;
        return text.substring(0, 100) + (text.length > 100 ? '...' : '');
    }

    saveNoteContent() {
        if (!this.activeNoteId) return;
        const noteIndex = this.notes.findIndex(n => n.id === this.activeNoteId);
        if (noteIndex !== -1) {
            this.notes[noteIndex].content = this.editor.innerHTML;
            this.notes[noteIndex].timestamp = new Date().toISOString();
            this.renderNotesList();
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
                <div class="note-title">${this.getFirstLine(note.content)}</div>
                <div class="note-preview">${this.getPreview(note.content)}</div>
                <button class="delete-btn">×</button>
            `;
            noteElement.addEventListener('click', () => this.setActiveNote(note.id));
            noteElement.querySelector('.delete-btn').addEventListener('click', (e) => this.deleteNote(note.id, e));
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
}

function formatText(command) {
    document.execCommand(command, false, null);
}

function formatList(command) {
    document.execCommand(command, false, null);
}

// Initialize the app
const app = new NotesApp();