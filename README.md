# MD Writer - Professional Markdown Editor

A clean, professional Markdown editor with Arabic/RTL support and real-time preview.

## Features

### Core Functionality
- ✨ **Real-time Preview** - See your markdown rendered as you type
- 🌐 **Arabic/RTL Support** - Full support for right-to-left languages
- 🌙 **Dark/Light Theme** - Toggle between professional dark and light modes
- 💾 **Auto-save** - Your work is automatically saved to browser storage
- 📥 **Export** - Download as Markdown (.md) or PDF (.pdf)
- 📊 **Word & Character Count** - Track your writing progress

### Design Philosophy
- **Professional & Clean** - Minimal color palette for focused work
- **Elegant UI** - Industry best practices for UX/UI design
- **Responsive** - Works seamlessly on desktop and tablet
- **Distraction-free** - No unnecessary visual noise

### Keyboard Shortcuts

**Application Controls:**
- `Cmd/Ctrl + F` - Open search
- `Cmd/Ctrl + H` - Open search & replace
- `Cmd/Ctrl + S` - Download as Markdown
- `Cmd/Ctrl + P` - Download as PDF
- `Cmd/Ctrl + E` - Toggle preview panel
- `Cmd/Ctrl + D` - Toggle RTL/LTR mode
- `Cmd/Ctrl + T` - Toggle dark/light theme
- `Tab` - Insert indentation (2 spaces)

**Search & Replace:**
- `Enter` - Next match
- `Shift + Enter` - Previous match
- `Esc` - Close search panel

**Formatting Shortcuts:**
- `Cmd/Ctrl + B` - **Bold**
- `Cmd/Ctrl + I` - *Italic*
- `Cmd/Ctrl + Shift + X` - ~~Strikethrough~~
- `Cmd/Ctrl + K` - `Inline code`
- `Cmd/Ctrl + Shift + K` - Code block
- `Cmd/Ctrl + L` - Insert link
- `Cmd/Ctrl + Shift + I` - Insert image
- `Cmd/Ctrl + Shift + U` - Unordered list
- `Cmd/Ctrl + Shift + O` - Ordered list
- `Cmd/Ctrl + Q` - Quote

## Technical Stack

- **Vanilla JavaScript** - No framework dependencies
- **Marked.js** - Fast markdown parsing
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Google Fonts** - Inter (Latin), Noto Sans Arabic, and JetBrains Mono

## Getting Started

1. Open `index.html` in your web browser
2. Start writing markdown in the editor panel
3. See the live preview on the right
4. Use the toolbar buttons for additional features

### For Arabic/RTL Content
- The editor automatically detects Arabic text
- Manually toggle RTL mode using the button or `Cmd/Ctrl + D`
- Both editor and preview support RTL rendering

## Markdown Support

Supports all standard markdown features:
- Headings (# H1 through ###### H6)
- **Bold** and *italic* text
- Lists (ordered and unordered)
- Links and images
- Code blocks and inline code
- Tables
- Blockquotes
- Horizontal rules

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Local Storage

The editor automatically saves your work to browser localStorage. Your content persists between sessions until you clear your browser data or use the "Clear" button.

## File Structure

```
md-writers/
├── index.html          # Main HTML structure
├── styles.css          # Professional styling
├── script.js           # Application logic
└── README.md          # Documentation
```

## Customization

### Colors
Edit CSS variables in `styles.css` to customize the color scheme:

```css
:root {
    --bg-primary: #ffffff;
    --text-primary: #1a1a1a;
    --accent-primary: #2c3e50;
    /* ... more variables */
}
```

### Fonts
Change font families in the `:root` CSS variables or modify the Google Fonts import in `index.html`.

## License

Free to use for personal and commercial projects.

## Credits

Built with best practices for professional markdown editing.
# md-writers
