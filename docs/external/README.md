# Community Learning Hub

A modern, interactive learning platform featuring a 3D Knowledge Galaxy visualization and educational resources. Built with vanilla JavaScript, Three.js, and Vite.

## ✨ Features

- **3D Knowledge Galaxy**: Interactive force-directed graph visualization of learning topics
- **Resource Pages**: Curated learning resources for web development, AI, and design
- **Responsive Design**: Mobile-friendly layout with modern UI
- **Fast Development**: Vite-powered dev server with HMR
- **Modular Architecture**: Clean separation of concerns and ES6 modules

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

The site will automatically open at `http://localhost:3000`

3. **Build for production:**
```bash
npm run build
```

4. **Preview production build:**
```bash
npm run preview
```

## 📁 Project Structure

```
CLH/
├── src/
│   ├── index.html          # Main entry point
│   ├── css/
│   │   └── styles.css      # Global styles
│   ├── js/
│   │   ├── main.js         # Application entry
│   │   └── galaxy.js       # 3D visualization logic
│   ├── data/
│   │   └── knowledge-graph.js  # Graph data and configuration
│   └── pages/
│       ├── react.html      # Resource pages for each topic
│       ├── js.html
│       └── python.html
├── public/                 # Static assets
├── dist/                   # Production build output
├── package.json
├── vite.config.js
└── README.md
```

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Engine**: Three.js, 3d-force-graph, three-spritetext
- **Build Tool**: Vite
- **Fonts**: Google Fonts (Open Sans, Poppins)

## 🎨 Galaxy Features

- **Interactive Nodes**: Click any topic to focus and view details
- **Physics Simulation**: Force-directed graph with smooth animations
- **Starfield Background**: 2000 stars for immersive experience
- **Auto-rotating Camera**: Gentle rotation with manual override
- **Side Panel**: Information and navigation for each topic

## 📝 Adding New Topics

1. Add node data to `src/data/knowledge-graph.js`:
```javascript
{
    id: 'YourTopic',
    group: 1, // 1=Web, 2=AI, 3=Design, 4=Community
    val: 20,  // Size of the node
    name: 'Topic Name',
    desc: 'Short description',
    hasPage: true
}
```

2. Create a resource page at `src/pages/yourtopic.html`

3. Add connections in the `links` array

## 🚀 Deployment

### Netlify/Vercel
Both platforms auto-detect Vite projects. Simply:
1. Connect your Git repository
2. Build command: `npm run build`
3. Publish directory: `dist`

### Manual Deployment
```bash
npm run build
# Upload the 'dist' folder to your hosting provider
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new learning resources
- Improve the UI/UX
- Optimize performance
- Fix bugs

## 📄 License

MIT License - feel free to use this project for learning and building!

## 🎯 Roadmap

- [ ] Add more resource pages (HTML, CSS, TypeScript, etc.)
- [ ] Implement search functionality
- [ ] Add user accounts and progress tracking
- [ ] Create interactive coding challenges
- [ ] Mobile gesture controls for 3D navigation
- [ ] Dark/light theme toggle
- [ ] Accessibility enhancements (keyboard navigation)

## 💡 Notes

The previous `Community Learning Hub Blog Layout` folder contains the original prototype files. The new structure under `src/` is the production-ready version.
