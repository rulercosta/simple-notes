import { StorageManager } from '../services/StorageManager.js';

export class ThemeManager {
    constructor() {
        this.storage = new StorageManager();
        this.darkModeBtn = document.getElementById('dark-mode-btn');
        this.darkModeIcon = this.darkModeBtn?.querySelector('.material-icons');
        this.init();
    }

    static initializeTheme() {
        const storage = new StorageManager();
        const isDarkMode = storage.getDarkMode();
        if (isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        document.body.classList.remove('theme-pending');
    }

    init() {
        const isDarkMode = this.storage.getDarkMode();
        if (isDarkMode) {
            this.enableDarkMode();
        }

        // Update icon based on current theme
        this.updateIcon(isDarkMode);

        if (this.darkModeBtn) {
            this.darkModeBtn.addEventListener('click', () => this.toggle());
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
        if (this.darkModeIcon) {
            this.darkModeIcon.textContent = 'dark_mode';
        }
        this.storage.setDarkMode(true);
    }

    disableDarkMode() {
        document.documentElement.removeAttribute('data-theme');
        if (this.darkModeIcon) {
            this.darkModeIcon.textContent = 'light_mode';
        }
        this.storage.setDarkMode(false);
    }

    updateIcon(isDarkMode) {
        if (this.darkModeIcon) {
            this.darkModeIcon.textContent = isDarkMode ? 'dark_mode' : 'light_mode';
        }
    }
}
