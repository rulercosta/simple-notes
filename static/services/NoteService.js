import { Note } from '../components/Note.js';
import { StorageManager } from './StorageManager.js';

export class NoteService {
    constructor() {
        this.storage = new StorageManager();
        this.notes = this.loadNotes();
    }

    loadNotes() {
        return this.storage.getNotes().map(note => new Note(
            note.id,
            note.title,
            note.content,
            note.createdAt,
            note.modifiedAt,
            note.textSize
        ));
    }

    createNote(title, content = '') {
        const newNote = new Note(
            Date.now().toString(),
            title,
            content
        );
        this.notes.unshift(newNote);
        if (title.trim()) {  // Only save if title is not empty
            this.saveNotes();
        }
        return newNote;
    }

    updateNote(id, title, content) {
        const noteIndex = this.notes.findIndex(n => n.id === id);
        if (noteIndex !== -1) {
            this.notes[noteIndex].title = title;
            this.notes[noteIndex].content = content;
            this.notes[noteIndex].modifiedAt = new Date().toISOString();
            this.saveNotes();
            return this.notes[noteIndex];
        }
        return null;
    }

    deleteNote(id) {
        const noteIndex = this.notes.findIndex(n => n.id === id);
        if (noteIndex !== -1) {
            this.notes.splice(noteIndex, 1);
            this.saveNotes();
            return true;
        }
        return false;
    }

    getNote(id) {
        return this.notes.find(n => n.id === id);
    }

    saveNotes() {
        // Filter out notes with empty titles before saving
        const validNotes = this.notes.filter(note => note.title.trim());
        this.storage.saveNotes(validNotes);
    }

    searchNotes(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.notes.filter(note => 
            note.title.toLowerCase().includes(term) ||
            note.content.toLowerCase().includes(term)
        );
    }
}
