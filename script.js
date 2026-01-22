// ===== Application State =====
const state = {
    isRTL: false,
    showPreview: true,
    darkTheme: false,
    content: '',
    isScrolling: false,
    scrollTimeout: null,
    updateTimeout: null
};

// ===== DOM Elements =====
const elements = {
    editor: document.getElementById('editor'),
    preview: document.getElementById('preview'),
    previewPanel: document.getElementById('previewPanel'),
    toggleTheme: document.getElementById('toggleTheme'),
    toggleRTL: document.getElementById('toggleRTL'),
    togglePreview: document.getElementById('togglePreview'),
    downloadBtn: document.getElementById('downloadBtn'),
    downloadMenu: document.getElementById('downloadMenu'),
    downloadMD: document.getElementById('downloadMD'),
    downloadPDF: document.getElementById('downloadPDF'),
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
    
    // Don't update if content hasn't changed
    if (markdown === state.content) return;
    
    state.content = markdown;
    
    // Debounce the update for better performance
    clearTimeout(state.updateTimeout);
    state.updateTimeout = setTimeout(() => {
        renderPreview(markdown);
    }, 50);
}

/**
 * Renders the markdown to HTML in the preview
 */
function renderPreview(markdown) {
    try {
        const html = marked.parse(markdown);
        
        // Only update if content has actually changed
        if (elements.preview.innerHTML !== html) {
            // Store current scroll position
            const scrollTop = elements.preview.scrollTop;
            
            // Update content
            if (html.trim()) {
                elements.preview.innerHTML = html;
            } else {
                elements.preview.innerHTML = '<p style="color: var(--text-tertiary);">Preview will appear here...</p>';
            }
            
            // Restore scroll position
            elements.preview.scrollTop = scrollTop;
            
            // Add data attributes for sync scrolling
            addLineNumbersToPreview();
            
            // Highlight current element after update
            setTimeout(highlightCurrentElement, 10);
        }
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
 * Adds line number data attributes to preview elements for sync scrolling
 */
function addLineNumbersToPreview() {
    const lines = elements.editor.value.split('\n');
    const previewElements = elements.preview.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, pre, table, hr');
    
    let currentLine = 0;
    let elementIndex = 0;
    
    for (let i = 0; i < lines.length && elementIndex < previewElements.length; i++) {
        const line = lines[i].trim();
        
        if (line.length > 0) {
            const element = previewElements[elementIndex];
            if (element && !element.hasAttribute('data-source-line')) {
                element.setAttribute('data-source-line', i);
                elementIndex++;
            }
        }
    }
}

/**
 * Syncs preview scroll with editor scroll
 */
function syncPreviewScroll() {
    if (state.isScrolling || !state.showPreview) return;
    
    state.isScrolling = true;
    
    const editorScrollPercent = elements.editor.scrollTop / (elements.editor.scrollHeight - elements.editor.clientHeight);
    const previewScrollTop = editorScrollPercent * (elements.preview.scrollHeight - elements.preview.clientHeight);
    
    elements.preview.scrollTop = previewScrollTop;
    
    clearTimeout(state.scrollTimeout);
    state.scrollTimeout = setTimeout(() => {
        state.isScrolling = false;
    }, 150);
}

/**
 * Syncs editor scroll with preview scroll (disabled - editor doesn't auto-scroll)
 */
function syncEditorScroll() {
    // Disabled: Editor should never auto-scroll
    // Only preview scrolls based on editor position
    return;
}

/**
 * Highlights the current element in preview based on cursor position
 */
function highlightCurrentElement() {
    if (!state.showPreview) return;
    
    const cursorPosition = elements.editor.selectionStart;
    const textBeforeCursor = elements.editor.value.substring(0, cursorPosition);
    const currentLine = textBeforeCursor.split('\n').length - 1;
    
    // Remove previous highlights
    const previousHighlights = elements.preview.querySelectorAll('.highlight');
    previousHighlights.forEach(el => el.classList.remove('highlight'));
    
    // Find and highlight the corresponding element
    const previewElements = elements.preview.querySelectorAll('[data-source-line]');
    let closestElement = null;
    let closestDistance = Infinity;
    
    previewElements.forEach(element => {
        const sourceLine = parseInt(element.getAttribute('data-source-line'), 10);
        const distance = Math.abs(sourceLine - currentLine);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestElement = element;
        }
    });
    
    if (closestElement) {
        closestElement.classList.add('highlight');
        
        // Smooth, natural scrolling - only scroll if element is approaching edges
        if (!state.isScrolling) {
            const elementTop = closestElement.offsetTop;
            const elementBottom = elementTop + closestElement.offsetHeight;
            const previewScrollTop = elements.preview.scrollTop;
            const previewHeight = elements.preview.clientHeight;
            const previewScrollBottom = previewScrollTop + previewHeight;
            
            // Define comfortable margins (20% from top and bottom)
            const topMargin = previewHeight * 0.2;
            const bottomMargin = previewHeight * 0.8;
            
            // Calculate target scroll position for natural following
            let targetScroll = null;
            
            // If element is above the comfortable zone, scroll up gently
            if (elementTop < previewScrollTop + topMargin) {
                targetScroll = elementTop - topMargin;
            }
            // If element is below the comfortable zone, scroll down gently
            else if (elementBottom > previewScrollTop + bottomMargin) {
                targetScroll = elementBottom - bottomMargin;
            }
            
            // Apply smooth, gradual scroll
            if (targetScroll !== null) {
                // Clamp to valid scroll range
                targetScroll = Math.max(0, Math.min(targetScroll, elements.preview.scrollHeight - previewHeight));
                
                // Use smooth scrolling for natural movement
                elements.preview.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            }
        }
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
        elements.mainContent.classList.add('rtl-mode');
    } else {
        elements.editor.classList.remove('rtl');
        elements.preview.classList.remove('rtl');
        elements.editor.setAttribute('dir', 'ltr');
        elements.mainContent.classList.remove('rtl-mode');
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
    
    // Close dropdown
    toggleDropdown(false);
}

/**
 * Downloads the rendered preview as a PDF file
 */
async function downloadPDF() {
    const content = elements.editor.value;
    
    if (!content.trim()) {
        alert('Nothing to download. Please write some content first.');
        return;
    }
    
    // Show loading state
    const originalText = elements.downloadPDF.innerHTML;
    elements.downloadPDF.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Generating PDF...';
    elements.downloadPDF.disabled = true;
    
    try {
        // Create a temporary container with the preview content
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
            width: 210mm;
            padding: 20mm;
            background: white;
            color: #1a1a1a;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
        `;
        
        // Clone preview content
        tempContainer.innerHTML = elements.preview.innerHTML;
        
        // Apply PDF-specific styles
        const style = document.createElement('style');
        style.textContent = `
            h1, h2, h3, h4, h5, h6 { 
                color: #1a1a1a; 
                margin-top: 1.5em; 
                margin-bottom: 0.5em;
                page-break-after: avoid;
            }
            h1 { font-size: 24pt; border-bottom: 1px solid #dee2e6; padding-bottom: 0.3em; }
            h2 { font-size: 18pt; border-bottom: 1px solid #dee2e6; padding-bottom: 0.3em; }
            h3 { font-size: 14pt; }
            h4 { font-size: 12pt; }
            h5, h6 { font-size: 11pt; }
            p { margin-bottom: 1em; }
            a { color: #2c3e50; text-decoration: none; border-bottom: 1px solid #2c3e50; }
            code { 
                background: #f1f3f5; 
                padding: 2px 6px; 
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 10pt;
            }
            pre { 
                background: #f1f3f5; 
                padding: 12px; 
                border-radius: 6px; 
                overflow-x: auto;
                page-break-inside: avoid;
            }
            pre code { 
                background: transparent; 
                padding: 0; 
            }
            blockquote {
                border-left: 3px solid #dee2e6;
                padding-left: 16px;
                margin: 16px 0;
                color: #6c757d;
                background: #f8f9fa;
                padding: 12px 16px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 16px 0;
                page-break-inside: avoid;
            }
            th, td {
                border: 1px solid #dee2e6;
                padding: 8px 12px;
                text-align: left;
            }
            th {
                background: #f8f9fa;
                font-weight: 600;
            }
            img {
                max-width: 100%;
                height: auto;
                page-break-inside: avoid;
            }
            ul, ol {
                margin-bottom: 1em;
                padding-left: 2em;
            }
            li {
                margin-bottom: 0.25em;
            }
        `;
        tempContainer.appendChild(style);
        
        // Configure PDF options
        const opt = {
            margin: [15, 15, 15, 15],
            filename: `document-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                letterRendering: true
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait',
                compress: true
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        // Generate and download PDF
        await html2pdf().set(opt).from(tempContainer).save();
        
        // Close dropdown
        toggleDropdown(false);
        
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Failed to generate PDF. Please try again.');
    } finally {
        // Restore button state
        elements.downloadPDF.innerHTML = originalText;
        elements.downloadPDF.disabled = false;
    }
}

/**
 * Toggles the download dropdown menu
 */
function toggleDropdown(show) {
    if (show === undefined) {
        elements.downloadMenu.classList.toggle('show');
    } else if (show) {
        elements.downloadMenu.classList.add('show');
    } else {
        elements.downloadMenu.classList.remove('show');
    }
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
    // Cmd/Ctrl + S to download markdown
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        downloadMarkdown();
    }
    
    // Cmd/Ctrl + P to download PDF
    if ((event.metaKey || event.ctrlKey) && event.key === 'p') {
        event.preventDefault();
        downloadPDF();
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

/**
 * Applies markdown formatting to selected text
 */
function applyFormat(format) {
    const editor = elements.editor;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    const beforeText = editor.value.substring(0, start);
    const afterText = editor.value.substring(end);
    
    let newText = '';
    let cursorOffset = 0;
    
    switch(format) {
        case 'bold':
            if (selectedText) {
                newText = `**${selectedText}**`;
                cursorOffset = selectedText.length + 4;
            } else {
                newText = '**bold text**';
                cursorOffset = 2;
            }
            break;
            
        case 'italic':
            if (selectedText) {
                newText = `*${selectedText}*`;
                cursorOffset = selectedText.length + 2;
            } else {
                newText = '*italic text*';
                cursorOffset = 1;
            }
            break;
            
        case 'strikethrough':
            if (selectedText) {
                newText = `~~${selectedText}~~`;
                cursorOffset = selectedText.length + 4;
            } else {
                newText = '~~strikethrough text~~';
                cursorOffset = 2;
            }
            break;
            
        case 'code':
            if (selectedText) {
                newText = `\`${selectedText}\``;
                cursorOffset = selectedText.length + 2;
            } else {
                newText = '`code`';
                cursorOffset = 1;
            }
            break;
            
        case 'codeblock':
            if (selectedText) {
                newText = `\`\`\`\n${selectedText}\n\`\`\``;
                cursorOffset = selectedText.length + 8;
            } else {
                newText = '```\ncode block\n```';
                cursorOffset = 4;
            }
            break;
            
        case 'link':
            if (selectedText) {
                newText = `[${selectedText}](url)`;
                cursorOffset = selectedText.length + 3;
            } else {
                newText = '[link text](url)';
                cursorOffset = 1;
            }
            break;
            
        case 'image':
            if (selectedText) {
                newText = `![${selectedText}](url)`;
                cursorOffset = selectedText.length + 4;
            } else {
                newText = '![alt text](url)';
                cursorOffset = 2;
            }
            break;
            
        case 'ul':
            const ulLines = selectedText ? selectedText.split('\n') : ['list item'];
            newText = ulLines.map(line => `- ${line}`).join('\n');
            cursorOffset = newText.length;
            break;
            
        case 'ol':
            const olLines = selectedText ? selectedText.split('\n') : ['list item'];
            newText = olLines.map((line, i) => `${i + 1}. ${line}`).join('\n');
            cursorOffset = newText.length;
            break;
            
        case 'quote':
            const quoteLines = selectedText ? selectedText.split('\n') : ['quote'];
            newText = quoteLines.map(line => `> ${line}`).join('\n');
            cursorOffset = newText.length;
            break;
            
        default:
            return;
    }
    
    // Update editor content
    editor.value = beforeText + newText + afterText;
    
    // Set cursor position
    const newCursorPos = start + cursorOffset;
    editor.setSelectionRange(newCursorPos, newCursorPos);
    
    // Update preview
    updatePreview();
    
    // Focus editor
    editor.focus();
}

/**
 * Handles formatting keyboard shortcuts
 */
function handleFormattingShortcuts(event) {
    const isMod = event.metaKey || event.ctrlKey;
    const isShift = event.shiftKey;
    
    if (!isMod) return;
    
    let format = null;
    
    // Bold: Cmd/Ctrl + B
    if (event.key === 'b' && !isShift) {
        format = 'bold';
    }
    // Italic: Cmd/Ctrl + I
    else if (event.key === 'i' && !isShift) {
        format = 'italic';
    }
    // Strikethrough: Cmd/Ctrl + Shift + X
    else if (event.key === 'x' && isShift) {
        format = 'strikethrough';
    }
    // Code: Cmd/Ctrl + K
    else if (event.key === 'k' && !isShift) {
        format = 'code';
    }
    // Code Block: Cmd/Ctrl + Shift + K
    else if (event.key === 'k' && isShift) {
        format = 'codeblock';
    }
    // Link: Cmd/Ctrl + L
    else if (event.key === 'l' && !isShift) {
        format = 'link';
    }
    // Image: Cmd/Ctrl + Shift + I
    else if (event.key === 'i' && isShift) {
        format = 'image';
    }
    // Unordered List: Cmd/Ctrl + Shift + U
    else if (event.key === 'u' && isShift) {
        format = 'ul';
    }
    // Ordered List: Cmd/Ctrl + Shift + O
    else if (event.key === 'o' && isShift) {
        format = 'ol';
    }
    // Quote: Cmd/Ctrl + Q
    else if (event.key === 'q' && !isShift) {
        format = 'quote';
    }
    
    if (format) {
        event.preventDefault();
        applyFormat(format);
    }
}

// ===== Event Listeners =====

// Editor input
elements.editor.addEventListener('input', () => {
    updatePreview();
    saveContent();
});

// Editor scroll sync
elements.editor.addEventListener('scroll', syncPreviewScroll);

// Preview scroll sync
elements.preview.addEventListener('scroll', syncEditorScroll);

// Editor cursor/selection change for highlighting
elements.editor.addEventListener('click', highlightCurrentElement);
elements.editor.addEventListener('keyup', highlightCurrentElement);
elements.editor.addEventListener('selectionchange', highlightCurrentElement);

// Editor tab handling
elements.editor.addEventListener('keydown', handleTab);

// Editor formatting shortcuts
elements.editor.addEventListener('keydown', handleFormattingShortcuts);

// Toolbar button clicks
document.querySelectorAll('.toolbar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const format = btn.getAttribute('data-format');
        if (format) {
            applyFormat(format);
        }
    });
});

// Button clicks
elements.toggleTheme.addEventListener('click', toggleTheme);
elements.toggleRTL.addEventListener('click', toggleRTL);
elements.togglePreview.addEventListener('click', togglePreview);
elements.downloadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
});
elements.downloadMD.addEventListener('click', downloadMarkdown);
elements.downloadPDF.addEventListener('click', downloadPDF);
elements.clearEditor.addEventListener('click', clearEditor);

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!elements.downloadBtn.contains(e.target) && !elements.downloadMenu.contains(e.target)) {
        toggleDropdown(false);
    }
});

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
        elements.editor.value = '';
        renderPreview('');
    }
    
    // Focus editor
    elements.editor.focus();
    
    console.log('MD Writer initialized successfully');
    console.log('Keyboard shortcuts:');
    console.log('  Cmd/Ctrl + S: Download as Markdown');
    console.log('  Cmd/Ctrl + P: Download as PDF');
    console.log('  Cmd/Ctrl + E: Toggle preview');
    console.log('  Cmd/Ctrl + D: Toggle RTL/LTR');
    console.log('  Cmd/Ctrl + T: Toggle dark/light theme');
    console.log('');
    console.log('Formatting shortcuts:');
    console.log('  Cmd/Ctrl + B: Bold');
    console.log('  Cmd/Ctrl + I: Italic');
    console.log('  Cmd/Ctrl + Shift + X: Strikethrough');
    console.log('  Cmd/Ctrl + K: Inline code');
    console.log('  Cmd/Ctrl + Shift + K: Code block');
    console.log('  Cmd/Ctrl + L: Link');
    console.log('  Cmd/Ctrl + Shift + I: Image');
    console.log('  Cmd/Ctrl + Shift + U: Unordered list');
    console.log('  Cmd/Ctrl + Shift + O: Ordered list');
    console.log('  Cmd/Ctrl + Q: Quote');
}

// Start the application
init();
