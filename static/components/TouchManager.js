export class TouchManager {
    constructor(detailView, notesList, onSwipeBack, onDeleteNote) {
        this.notesList = notesList;
        this.onDeleteNote = onDeleteNote;
        
        this.swipeStartX = null;
        this.swipeStartY = null;
        this.currentSwipeItem = null;
        this.swipeThreshold = -80;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.notesList.addEventListener('touchstart', (e) => this.handleNoteSwipeStart(e));
        this.notesList.addEventListener('touchmove', (e) => this.handleNoteSwipeMove(e));
        this.notesList.addEventListener('touchend', (e) => this.handleNoteSwipeEnd(e));
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

        if (deltaY > Math.abs(deltaX)) {
            this.resetSwipe();
            return;
        }

        if (deltaX > 0) {
            this.currentSwipeItem.style.transform = 'translateX(0)';
            return;
        }

        e.preventDefault();
        this.currentSwipeItem.style.transform = `translateX(${deltaX}px)`;
    }

    handleNoteSwipeEnd() {
        if (!this.currentSwipeItem) return;

        const noteItem = this.currentSwipeItem;
        const transform = getComputedStyle(noteItem).transform;
        const matrix = new DOMMatrix(transform);
        const translateX = matrix.m41;

        if (translateX <= this.swipeThreshold) {
            noteItem.classList.add('deleting');
            const noteId = noteItem.dataset.noteId;
            setTimeout(() => this.onDeleteNote(noteId), 200);
        } else {
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
}
