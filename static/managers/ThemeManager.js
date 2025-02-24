import { StorageManager } from '../services/StorageManager.js';

export class ThemeManager {
    constructor() {
        this.storage = new StorageManager();
        this.darkModeSwitch = document.getElementById('dark-mode-switch');
        this.init();
    }

    init() {
        const isDarkMode = this.storage.getDarkMode();
        if (isDarkMode) {
            this.enableDarkMode();
        }
    }

    toggle() {
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDarkMode) {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }
    }

    enableDarkMode() {
        document.documentElement.setAttribute('data-theme', 'dark');
        this.darkModeSwitch.classList.add('active');
        this.storage.setDarkMode(true);
    }

    disableDarkMode() {
        document.documentElement.removeAttribute('data-theme');
        this.darkModeSwitch.classList.remove('active');
        this.storage.setDarkMode(false);
    }
}
