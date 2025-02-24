export class Note {
    constructor(id, title, content = '', createdAt = new Date().toISOString(), modifiedAt = null, textSize = 'md') {
        this.id = id || Date.now().toString();
        this.title = title;
        this.content = content;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt || createdAt;
        this.textSize = textSize;
    }
}
