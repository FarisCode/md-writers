// ===== Application State =====
const state = {
    isRTL: false,
    showPreview: true,
    darkTheme: false,
    content: ''
};

// ===== DOM Elements =====
const elements = {
    editor: document.getElementById('editor'),
    preview: document.getElementById('preview'),
    previewPanel: document.getElementById('previewPanel'),
    toggleTheme: document.getElementById('toggleTheme'),
    toggleRTL: document.getElementById('toggleRTL'),
    togglePreview: document.getElementById('togglePreview'),
    downloadMD: document.getElementById('downloadMD'),
    clearEditor: document.getElementById('clearEditor'),
    wordCount: document.getElementById('wordCount'),
    charCount: document.getElementById('charCount'),
    mainContent: document.querySelector('.main-content')
};

// ===== Markdown Configuration =====
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false,
    sanitize: false
});

// ===== Utility Functions =====

/**
 * Detects if text contains Arabic characters
 */
function containsArabic(text) {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicPattern.test(text);
}

/**
 * Counts words in text (supports both English and Arabic)
 */
function countWords(text) {
    if (!text.trim()) return 0;
    
    // Remove markdown syntax
    const cleanText = text
        .replace(/[#*`~\[\]()]/g, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .trim();
    
    if (!cleanText) return 0;
    
    // Split by whitespace and filter empty strings
    const words = cleanText.split(/\s+/).filter(word => word.length > 0);
    return words.length;
}

/**
 * Updates the word and character count display
 */
function updateCounts() {
    const text = elements.editor.value;
    const words = countWords(text);
    const chars = text.length;
    
    elements.wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
    elements.charCount.textContent = `${chars} char${chars !== 1 ? 's' : ''}`;
}

/**
 * Updates the preview with rendered markdown
 */
function updatePreview() {
    const markdown = elements.editor.value;
    state.content = markdown;
    
    try {
        const html = marked.parse(markdown);
        elements.preview.innerHTML = html || '<p style="color: var(--text-tertiary);">Preview will appear here...</p>';
    } catch (error) {
        console.error('Markdown parsing error:', error);
        elements.preview.innerHTML = '<p style="color: #e74c3c;">Error parsing markdown</p>';
    }
    
    updateCounts();
    
    // Auto-detect RTL if content contains Arabic
    if (containsArabic(markdown) && !state.isRTL) {
        toggleRTL();
    }
}

/**
 * Toggles RTL/LTR mode
 */
function toggleRTL() {
    state.isRTL = !state.isRTL;
    
    if (state.isRTL) {
        elements.editor.classList.add('rtl');
        elements.preview.classList.add('rtl');
        elements.editor.setAttribute('dir', 'rtl');
    } else {
        elements.editor.classList.remove('rtl');
        elements.preview.classList.remove('rtl');
        elements.editor.setAttribute('dir', 'ltr');
    }
}

/**
 * Toggles preview panel visibility
 */
function togglePreview() {
    state.showPreview = !state.showPreview;
    
    if (state.showPreview) {
        elements.mainContent.classList.remove('preview-hidden');
    } else {
        elements.mainContent.classList.add('preview-hidden');
    }
}

/**
 * Toggles dark/light theme
 */
function toggleTheme() {
    state.darkTheme = !state.darkTheme;
    
    if (state.darkTheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('md-writer-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('md-writer-theme', 'light');
    }
}

/**
 * Downloads the markdown content as a .md file
 */
function downloadMarkdown() {
    const content = elements.editor.value;
    
    if (!content.trim()) {
        alert('Nothing to download. Please write some content first.');
        return;
    }
    
    // Create blob
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    
    // Generate filename with timestamp
    const date = new Date();
    const timestamp = date.toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `markdown-${timestamp}.md`;
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(link.href);
}

/**
 * Clears the editor content
 */
function clearEditor() {
    if (elements.editor.value.trim() === '') return;
    
    if (confirm('Are you sure you want to clear all content?')) {
        elements.editor.value = '';
        updatePreview();
        elements.editor.focus();
    }
}

/**
 * Handles keyboard shortcuts
 */
function handleKeyboardShortcuts(event) {
    // Cmd/Ctrl + S to download
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        downloadMarkdown();
    }
    
    // Cmd/Ctrl + E to toggle preview
    if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
        event.preventDefault();
        togglePreview();
    }
    
    // Cmd/Ctrl + D to toggle RTL
    if ((event.metaKey || event.ctrlKey) && event.key === 'd') {
        event.preventDefault();
        toggleRTL();
    }
    
    // Cmd/Ctrl + T to toggle theme
    if ((event.metaKey || event.ctrlKey) && event.key === 't') {
        event.preventDefault();
        toggleTheme();
    }
}

/**
 * Loads content from localStorage
 */
function loadSavedContent() {
    try {
        const saved = localStorage.getItem('md-writer-content');
        if (saved) {
            elements.editor.value = saved;
            updatePreview();
        }
    } catch (error) {
        console.error('Error loading saved content:', error);
    }
}

/**
 * Loads theme preference from localStorage
 */
function loadThemePreference() {
    try {
        const savedTheme = localStorage.getItem('md-writer-theme');
        if (savedTheme === 'dark') {
            state.darkTheme = true;
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            state.darkTheme = false;
            document.documentElement.setAttribute('data-theme', 'light');
        }
    } catch (error) {
        console.error('Error loading theme preference:', error);
    }
}

/**
 * Saves content to localStorage
 */
function saveContent() {
    try {
        localStorage.setItem('md-writer-content', elements.editor.value);
    } catch (error) {
        console.error('Error saving content:', error);
    }
}

/**
 * Handles tab key in editor for indentation
 */
function handleTab(event) {
    if (event.key === 'Tab') {
        event.preventDefault();
        
        const start = this.selectionStart;
        const end = this.selectionEnd;
        const value = this.value;
        
        // Insert tab character
        this.value = value.substring(0, start) + '  ' + value.substring(end);
        
        // Move cursor
        this.selectionStart = this.selectionEnd = start + 2;
    }
}

// ===== Event Listeners =====

// Editor input
elements.editor.addEventListener('input', () => {
    updatePreview();
    saveContent();
});

// Editor tab handling
elements.editor.addEventListener('keydown', handleTab);

// Button clicks
elements.toggleTheme.addEventListener('click', toggleTheme);
elements.toggleRTL.addEventListener('click', toggleRTL);
elements.togglePreview.addEventListener('click', togglePreview);
elements.downloadMD.addEventListener('click', downloadMarkdown);
elements.clearEditor.addEventListener('click', clearEditor);

// Keyboard shortcuts
document.addEventListener('keydown', handleKeyboardShortcuts);

// Auto-save on page unload
window.addEventListener('beforeunload', saveContent);

// ===== Initialization =====

/**
 * Initialize the application
 */
function init() {
    // Load theme preference first
    loadThemePreference();
    
    // Load saved content
    loadSavedContent();
    
    // Initial preview update
    if (!elements.editor.value) {
        updatePreview();
    }
    
    // Focus editor
    elements.editor.focus();
    
    console.log('MD Writer initialized successfully');
    console.log('Keyboard shortcuts:');
    console.log('  Cmd/Ctrl + S: Download markdown');
    console.log('  Cmd/Ctrl + E: Toggle preview');
    console.log('  Cmd/Ctrl + D: Toggle RTL/LTR');
    console.log('  Cmd/Ctrl + T: Toggle dark/light theme');
}

// Start the application
init();
