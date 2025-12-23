import { initGalaxy } from './galaxy.js';

// Initialize the galaxy on load
initGalaxy();

// Handle panel close button
const closeBtn = document.getElementById('panel-close-btn');
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        const panel = document.getElementById('info-panel');
        const galaxyOverlay = document.querySelector('.galaxy-overlay');
        
        if (panel) {
            panel.classList.remove('open');
        }
        
        // Restore the galaxy title when panel closes
        if (galaxyOverlay) {
            galaxyOverlay.classList.remove('fade-out');
        }
    });
}

// Handle view resources button
const viewResourcesBtn = document.getElementById('view-resources-btn');
if (viewResourcesBtn) {
    viewResourcesBtn.addEventListener('click', (e) => {
        const nodeId = e.target.dataset.nodeId;
        if (nodeId) {
            window.location.href = `/pages/${nodeId.toLowerCase()}.html`;
        }
    });
}
