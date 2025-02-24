export class SearchManager {
    constructor(noteService, renderCallback) {
        this.noteService = noteService;
        this.renderCallback = renderCallback;
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search-btn');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
    }

    handleSearch() {
        const searchTerm = this.searchInput.value;
        this.clearSearchBtn.classList.toggle('visible', searchTerm.length > 0);
        
        if (!searchTerm) {
            this.renderCallback(this.noteService.notes);
            return;
        }

        const filteredNotes = this.noteService.searchNotes(searchTerm);
        this.renderCallback(filteredNotes);
    }

    clearSearch() {
        this.searchInput.value = '';
        this.clearSearchBtn.classList.remove('visible');
        this.renderCallback(this.noteService.notes);
        this.searchInput.focus();
    }
}
