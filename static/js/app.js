// app.js (ES module)
import { populateMoleculeDropdown, loadMolecule } from './viewer.js';
import { initChart, switchPlot } from './charts.js';

// Dropdown menu UI (⋯)
const btn  = document.getElementById('plotTypeBtn');
const menu = document.getElementById('plotTypeMenu');
function toggleMenu() {
  const open = menu.classList.toggle('show');
  btn.setAttribute('aria-expanded', open);
}
btn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
document.addEventListener('click', () => { if(menu.classList.contains('show')) toggleMenu(); });
menu.addEventListener('click', (e) => {
  const li = e.target.closest('li'); if (!li) return;
  toggleMenu();
  const type = li.dataset.plot;
  switchPlot(type); // only 'scatter' and 'bar' implemented for now
});

// Initial boot
(async function boot() {
  // Populate molecule list and set change handler
  const firstId = await populateMoleculeDropdown('molecule-select');
  const selectEl = document.getElementById('molecule-select');
  selectEl.addEventListener('change', (e) => {
    loadMolecule('viewer-container', 'details-content', e.target.value);
  });

  // Load first molecule into viewer
  if (firstId) {
    selectEl.value = firstId;
    loadMolecule('viewer-container', 'details-content', firstId);
  }

  // Init chart (default scatter); clicking points will update the viewer & dropdown
  await initChart('moleculeChart', (moleculeId) => {
    selectEl.value = moleculeId;
    loadMolecule('viewer-container', 'details-content', moleculeId);
  });
})();
