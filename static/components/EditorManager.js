export class EditorManager {
    constructor(editor) {
        this.editor = editor;
        this.textSizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
        this.undoStack = [];
        this.redoStack = [];
        this.isComposing = false;
        this.setupUndoRedoTracking();

        // Bind methods
        this.undo = this.undo.bind(this);
        this.redo = this.redo.bind(this);
        this.pushToUndoStack = this.pushToUndoStack.bind(this);
    }

    setupUndoRedoTracking() {
        this.editor.addEventListener('input', (e) => {
            if (!this.isComposing) {
                this.pushToUndoStack();
            }
        });

        this.editor.addEventListener('compositionstart', () => {
            this.isComposing = true;
        });

        this.editor.addEventListener('compositionend', () => {
            this.isComposing = false;
            this.pushToUndoStack();
        });

        this.editor.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && 
                ['b', 'i', 'u', 'z', 'y'].includes(e.key)) {
                e.preventDefault();
                
                if (e.key === 'z') {
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    return;
                }
                
                if (e.key === 'y') {
                    this.redo();
                    return;
                }

                this.pushToUndoStack();
                
                switch (e.key) {
                    case 'b': document.execCommand('bold'); break;
                    case 'i': document.execCommand('italic'); break;
                    case 'u': document.execCommand('underline'); break;
                }
            }
        });
    }

    pushToUndoStack() {
        const currentState = {
            content: this.editor.innerHTML,
            selection: this.saveSelection(),
            timestamp: Date.now()
        };
        
        // Don't push if content hasn't changed
        const lastState = this.undoStack[this.undoStack.length - 1];
        if (lastState && lastState.content === currentState.content) {
            return;
        }
        
        this.undoStack.push(currentState);
        this.redoStack = []; // Clear redo stack when new changes are made
        
        if (this.undoStack.length > 1000) {
            this.undoStack.shift();
        }

        this.updateToolbarState();
    }

    saveSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            return {
                startContainer: this.getNodePath(range.startContainer),
                startOffset: range.startOffset,
                endContainer: this.getNodePath(range.endContainer),
                endOffset: range.endOffset
            };
        }
        return null;
    }

    getNodePath(node) {
        const path = [];
        while (node !== this.editor) {
            if (node.parentNode) {
                path.unshift(Array.from(node.parentNode.childNodes).indexOf(node));
                node = node.parentNode;
            } else {
                break;
            }
        }
        return path;
    }

    restoreSelection(savedSelection) {
        if (!savedSelection) return;

        const getNodeFromPath = (path) => {
            let node = this.editor;
            for (const index of path) {
                node = node.childNodes[index];
                if (!node) return null;
            }
            return node;
        };

        const startNode = getNodeFromPath(savedSelection.startContainer);
        const endNode = getNodeFromPath(savedSelection.endContainer);

        if (startNode && endNode) {
            const range = document.createRange();
            range.setStart(startNode, savedSelection.startOffset);
            range.setEnd(endNode, savedSelection.endOffset);

            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    undo() {
        if (this.undoStack.length <= 1) return;

        const currentState = this.undoStack.pop();
        if (currentState) {
            this.redoStack.push(currentState);
            
            const previousState = this.undoStack[this.undoStack.length - 1];
            if (previousState) {
                this.editor.innerHTML = previousState.content;
                this.restoreSelection(previousState.selection);
                
                // Trigger input event to save changes
                this.editor.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }

        this.updateToolbarState();
    }

    redo() {
        if (this.redoStack.length === 0) return;

        const nextState = this.redoStack.pop();
        if (nextState) {
            this.undoStack.push(nextState);
            this.editor.innerHTML = nextState.content;
            this.restoreSelection(nextState.selection);
            
            // Trigger input event to save changes
            this.editor.dispatchEvent(new Event('input', { bubbles: true }));
        }

        this.updateToolbarState();
    }

    updateToolbarState() {
        requestAnimationFrame(() => {
            // Cache button references to avoid repeated DOM queries
            if (!this._undoBtn || !this._redoBtn) {
                const toolbarButtons = document.querySelectorAll('.toolbar-btn');
                for (const btn of toolbarButtons) {
                    const icon = btn.querySelector('.material-icons');
                    if (icon) {
                        if (icon.textContent === 'undo') this._undoBtn = btn;
                        if (icon.textContent === 'redo') this._redoBtn = btn;
                    }
                }
            }
            
            if (this._undoBtn) {
                this._undoBtn.disabled = this.undoStack.length <= 1;
            }
            
            if (this._redoBtn) {
                this._redoBtn.disabled = this.redoStack.length === 0;
            }
        });
    }
}

let currentAlignment = 'left';
let currentListType = 'none';

export function formatText(command) {
    document.execCommand(command, false, null);
}

export function toggleList() {
    const button = document.getElementById('list-toggle-btn');
    
    switch (currentListType) {
        case 'none':
            document.execCommand('insertUnorderedList', false, null);
            button.textContent = '•';
            currentListType = 'bullet';
            break;
        
        case 'bullet':
            document.execCommand('insertOrderedList', false, null);
            button.textContent = '1.';
            currentListType = 'number';
            break;
            
        case 'number':
            document.execCommand('insertOrderedList', false, null);
            button.textContent = '¶';
            currentListType = 'none';
            break;
    }
}

export function toggleAlignment() {
    const button = document.getElementById('align-toggle-btn');
    const icon = button.querySelector('.material-icons');
    
    switch (currentAlignment) {
        case 'left':
            document.execCommand('justifyCenter');
            icon.textContent = 'format_align_center';
            currentAlignment = 'center';
            break;
        
        case 'center':
            document.execCommand('justifyRight');
            icon.textContent = 'format_align_right';
            currentAlignment = 'right';
            break;
            
        case 'right':
            document.execCommand('justifyLeft');
            icon.textContent = 'format_align_left';
            currentAlignment = 'left';
            break;
    }
}
