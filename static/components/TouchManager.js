export class TouchManager {
    constructor(detailView, notesList, onSwipeBack, onDeleteNote) {
        this.detailView = detailView;
        this.notesList = notesList;
        this.onSwipeBack = onSwipeBack;
        this.onDeleteNote = onDeleteNote;
        
        this.swipeStartX = null;
        this.swipeStartY = null;
        this.currentSwipeItem = null;
        this.swipeThreshold = -80;

        this.setupEventListeners();
    }

    setupEventListeners() {
        if (!this.notesList) return;

        this.notesList.addEventListener('touchstart', (e) => this.handleNoteSwipeStart(e), { passive: true });
        this.notesList.addEventListener('touchmove', (e) => this.handleNoteSwipeMove(e));
        this.notesList.addEventListener('touchend', (e) => this.handleNoteSwipeEnd(e), { passive: true });

        // Add detail view swipe handling
        if (this.detailView) {
            this.detailView.addEventListener('touchstart', (e) => this.handleDetailSwipeStart(e), { passive: true });
            this.detailView.addEventListener('touchmove', (e) => this.handleDetailSwipeMove(e));
            this.detailView.addEventListener('touchend', (e) => this.handleDetailSwipeEnd(e), { passive: true });
        }
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

    handleDetailSwipeStart(e) {
        this.swipeStartX = e.touches[0].clientX;
        this.swipeStartY = e.touches[0].clientY;
    }

    handleDetailSwipeMove(e) {
        if (!this.swipeStartX) return;

        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = touchX - this.swipeStartX;
        const deltaY = Math.abs(touchY - this.swipeStartY);

        if (deltaY > Math.abs(deltaX)) {
            this.resetSwipe();
            return;
        }

        if (deltaX < 0) return;

        e.preventDefault();
        this.detailView.style.transform = `translateX(${deltaX}px)`;
    }

    handleDetailSwipeEnd(e) {
        if (!this.swipeStartX) return;

        const touchX = e.changedTouches[0].clientX;
        const deltaX = touchX - this.swipeStartX;

        if (deltaX > 100) {
            this.onSwipeBack();
        } else {
            this.detailView.style.transform = '';
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
