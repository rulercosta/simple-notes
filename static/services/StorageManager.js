export class StorageManager {
    constructor() {
        this.NOTES_KEY = 'notes';
        this.DARK_MODE_KEY = 'darkMode';
    }

    getNotes() {
        try {
            const notes = localStorage.getItem(this.NOTES_KEY);
            return notes ? JSON.parse(notes) : [];
        } catch (error) {
            console.error('Error loading notes:', error);
            return [];
        }
    }

    saveNotes(notes) {
        try {
            localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    }

    getDarkMode() {
        return localStorage.getItem(this.DARK_MODE_KEY) === 'true';
    }

    setDarkMode(isDark) {
        localStorage.setItem(this.DARK_MODE_KEY, isDark.toString());
    }
}
