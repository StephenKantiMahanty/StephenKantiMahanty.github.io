# Engineering Portfolio - Stephen Kanti Mahanty

A stunning interactive circuit diagram portfolio website with smooth animations and a professional dark/green circuit board aesthetic.

## 🎨 Features

- **Interactive Circuit Components**: Navigation designed as circuit components (Resistor, Capacitor, Inductor)
- **Smooth Animations**: Circuit traces draw on load, components slide in with staggered timing
- **Professional Theme**: Dark background (#0a0e1a) with vibrant green (#00ff41) circuit aesthetics
- **Responsive Design**: Works beautifully on desktop and mobile
- **Keyboard Navigation**: Use arrow keys to navigate between sections
- **Visual Effects**: Glowing traces, voltage indicators, cursor trails, and more

## 📁 File Structure

```
your-github-pages-repo/
├── index.html              # Main landing page with circuit diagram
├── styles.css              # Main stylesheet
├── script.js               # Main JavaScript
├── projects/
│   ├── index.html         # Projects section page
│   ├── section-styles.css # Section-specific styles
│   └── section-script.js  # Section-specific scripts
├── about/
│   ├── index.html         # About section page
│   ├── section-styles.css
│   └── section-script.js
├── experience/
│   ├── index.html         # Experience section page
│   ├── section-styles.css
│   └── section-script.js
└── README.md
```

## 🚀 Setup Instructions

### Option 1: Replace Existing Files

1. Copy all files from this package to your GitHub Pages repository
2. Replace the placeholder content in each section's `index.html`:
   - Navigate to `projects/index.html`, `about/index.html`, and `experience/index.html`
   - Replace the content inside `<div class="content-wrapper">` with your actual content from your Quarto `.qmd` files

### Option 2: Integrate with Quarto

If you want to keep using Quarto to generate content:

1. Use the provided HTML files as **templates** for your Quarto output
2. In your `_quarto.yml`, configure custom templates
3. Or, manually copy the generated HTML from Quarto into the content sections

### Converting Quarto Content

For each section (projects, about, experience):

1. Render your Quarto `.qmd` file to HTML
2. Copy the generated HTML body content
3. Paste it inside the `<div class="content-wrapper">` in the corresponding section's `index.html`
4. Adjust styling as needed (the circuit theme will automatically apply)

## 🎯 Customization

### Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --bg-dark: #0a0e1a;        /* Main background */
    --circuit-green: #00ff41;   /* Primary green */
    --accent-green: #00cc33;    /* Accent green */
    --dim-green: #00661a;       /* Dimmed green */
}
```

### Component Labels

To change the component names/labels:

1. Edit `index.html`
2. Find the `.component-label` spans
3. Update the text (e.g., "PROJECTS" → "MY WORK")

### Adding More Sections

To add additional circuit components:

1. Duplicate one of the component sections in `index.html`
2. Create a new folder for the section
3. Update the SVG to represent a different component (e.g., Diode, Transistor)
4. Add connecting traces in the SVG

## 🎮 Interactive Features

- **Click Components**: Navigate to different sections
- **Hover Effects**: Components glow and scale up
- **Keyboard Shortcuts**:
  - Arrow keys: Navigate between components
  - Enter/Space: Select component
  - ESC: Go back to main page
- **Smooth Transitions**: All page transitions are animated

## 🔧 Technical Details

### Technologies Used
- Pure HTML5, CSS3, JavaScript (no frameworks required)
- SVG for circuit graphics
- CSS animations and transitions
- Responsive grid layout

### Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

### Performance
- Lightweight (no external dependencies)
- Smooth 60fps animations
- Optimized SVG rendering

## 📝 Content Guidelines

When adding your content to the section pages:

1. Keep the dark theme in mind - use appropriate text colors
2. The circuit aesthetic works best with technical/engineering content
3. Consider using monospace fonts for code snippets
4. Add `<br>` tags for spacing between paragraphs

## 🌟 Enhancement Ideas

- Add more circuit components for additional sections
- Implement a "live wire" effect when hovering
- Add sound effects for interactions
- Create sub-sections with nested circuit diagrams
- Add a loading screen with circuit assembly animation

## 📄 License

This design is free to use for your personal portfolio!

## 🙏 Credits

Circuit board aesthetic inspired by professional PCB design.
Created with attention to smooth animations and user experience.

---

**Enjoy your new circuit-themed portfolio!** ⚡
