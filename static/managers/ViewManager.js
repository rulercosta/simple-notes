export class ViewManager {
    constructor() {
        this.listView = document.querySelector('.list-view');
        this.detailView = document.querySelector('.detail-view');
        this.toolbar = document.querySelector('.toolbar');
        this.isEditing = false;
    }

    showListView() {
        this.listView.classList.add('active');
        this.detailView.classList.remove('active');
        this.detailView.classList.add('inactive');
        this.isEditing = false;
        return new Promise(resolve => setTimeout(resolve, 300));
    }

    showDetailView() {
        this.detailView.classList.remove('inactive');
        this.detailView.classList.add('active');
        this.listView.classList.remove('active');
    }

    toggleEditMode(editor, titleInput, modeToggleBtn) {
        this.isEditing = !this.isEditing;
        editor.setAttribute('contenteditable', this.isEditing);
        titleInput.readOnly = !this.isEditing;
        modeToggleBtn.innerHTML = this.isEditing ? 
            '<span class="material-icons">done</span>' : 
            '<span class="material-icons">edit</span>';
        this.toolbar.classList.toggle('visible', this.isEditing);
        return this.isEditing;
    }
}
