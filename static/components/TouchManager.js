export class TouchManager {
    constructor(detailView, notesList, onSwipeBack, onDeleteNote) {
        this.detailView = detailView;
        this.notesList = notesList;
        this.onSwipeBack = onSwipeBack;
        this.onDeleteNote = onDeleteNote;
        
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchMoveX = 0;
        this.isSwiping = false;
        this.swipeStartX = null;
        this.swipeStartY = null;
        this.currentSwipeItem = null;
        this.swipeThreshold = -80;
        this.isAndroid = /Android/.test(navigator.userAgent);

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.detailView.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.detailView.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.detailView.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        this.notesList.addEventListener('touchstart', (e) => this.handleNoteSwipeStart(e));
        this.notesList.addEventListener('touchmove', (e) => this.handleNoteSwipeMove(e));
        this.notesList.addEventListener('touchend', (e) => this.handleNoteSwipeEnd(e));
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
        
        if (!this.isSwiping && Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
            this.isSwiping = true;
        }
        
        if (this.isSwiping) {
            e.preventDefault();
            this.touchMoveX = deltaX;
            
            if (this.isAndroid) {
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
            this.onSwipeBack();
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
