# Community Learning Hub - Blog Layout & Knowledge Galaxy

A modern, interactive frontend for the Community Learning Hub. This project combines a clean, responsive blog layout with a high-fidelity **3D Knowledge Galaxy** visualization.

## 🌟 New Feature: Knowledge Galaxy
The landing page now features a 3D interactive "Hero" section powered by `Three.js` and `3d-force-graph`.
- **Interactive Nodes:** Click on topics like "React", "AI Agents", or "Figma" to focus the camera.
- **Info Panel:** Selecting a topic opens a side panel with details (Prototype).
- **Physics Engine:** Nodes float and react to cursor movement in a simulated gravity field.

## 📂 Project Structure

- **`index.html`** - The main entry point. Combines the Blog Layout with the Galaxy Hero.
- **`styles.css`** - Global styles, responsive definitions, and UI themes.
- **`galaxy-logic.js`** - Contains the 3D engine logic, data visualization settings, and interaction handlers.
- **`galaxy.html`** - A standalone "Lab" file for testing the 3D engine in isolation.

## 🚀 How to Run (Important!)

Because this project uses modern **ES Modules** (importing 3D libraries from the web), you **cannot** simply double-click `index.html` to open it. Browsers block module requests from the file system (`file://`) for security.

**You must use a local web server.**

### Option A: VS Code (Recommended)
1.  Install the **"Live Server"** extension.
2.  Right-click `index.html` and select **"Open with Live Server"**.

### Option B: Node.js
If you have Node.js installed, run:
```bash
npx serve .
```
Then open the local URL shown (usually `http://localhost:3000`).

### Option C: Python
If you have Python installed, run:
```bash
python -m http.server
```
Then open `http://localhost:8000`.

## 🛠 Tech Stack
- **Core:** HTML5, Semantic Markup
- **Styling:** CSS3, Flexbox/Grid, CSS Variables
- **3D Engine:** Three.js, 3d-force-graph, UnrealBloomPass
- **Typography:** Google Fonts (Open Sans & Poppins)

## 📝 Design Notes
- The "Galaxy" uses a force-directed graph algorithm to organize topics.
- Colors follow a defined palette: Web (Blue), AI (Pink), Design (Purple), Community (White).
