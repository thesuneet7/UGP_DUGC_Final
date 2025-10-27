// viewer.js
export const JSMOL_INFO = {
  width: "100%",
  height: "100%",
  color: "#111827",
  use: "HTML5",
  j2sPath: "https://chemapps.stolaf.edu/jmol/jsmol/j2s",
  serverURL: "https://chemapps.stolaf.edu/jmol/jsmol/php/jsmol.php",
  disableJ2SLoadMonitor: true,
  disableInitialConsole: true,
  readyFunction: null
};

let jmolApplet = null;

export async function loadMolecule(containerId, detailsContainerId, moleculeId) {
  const viewerContainer = document.getElementById(containerId);
  const detailsContent  = document.getElementById(detailsContainerId);
  if (!viewerContainer || !detailsContent || !moleculeId) return;

  if (jmolApplet === null) {
    viewerContainer.innerHTML = "";
    // Jmol is provided globally by the CDN script
    jmolApplet = Jmol.getApplet("jmolApplet0", JSMOL_INFO);
    viewerContainer.innerHTML = Jmol.getAppletHtml(jmolApplet);
  }

  try {
    const res = await fetch(`/api/molecule/${moleculeId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xyz = await res.text();
    Jmol.script(jmolApplet, `load inline "${xyz}"`);
    await loadMoleculeDetails(detailsContainerId, moleculeId);
  } catch (err) {
    console.error('Viewer load error:', err);
    viewerContainer.innerHTML = `<p class="text-red-400 text-center p-8">Failed to load molecule.</p>`;
  }
}

export async function loadMoleculeDetails(detailsContainerId, moleculeId) {
  const el = document.getElementById(detailsContainerId);
  if (!el) return;
  try {
    const res = await fetch(`/api/molecule/${moleculeId}/details`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    el.innerHTML = `
      <div class="space-y-2">
        <div class="flex justify-between"><span class="font-medium text-gray-700">Name:</span><span class="text-gray-900">${d.molecule_name}</span></div>
        <div class="flex justify-between"><span class="font-medium text-gray-700">Formula:</span><span class="text-gray-900 font-mono">${d.molecular_formula || 'N/A'}</span></div>
        <div class="flex justify-between"><span class="font-medium text-gray-700">Molecular Weight:</span><span class="text-gray-900">${d.molecular_weight ? d.molecular_weight.toFixed(3) + ' g/mol' : 'N/A'}</span></div>
        <div class="flex justify-between"><span class="font-medium text-gray-700">Free Energy:</span><span class="text-gray-900">${d.free_energy ? d.free_energy.toFixed(6) + ' kcal/mol' : 'N/A'}</span></div>
        <div class="flex justify-between"><span class="font-medium text-gray-700">PubChem CID:</span><span class="text-gray-900">${d.pubchem_cid || 'N/A'}</span></div>
      </div>
    `;
  } catch (err) {
    console.error('Details load error:', err);
    el.innerHTML = `<p class="text-red-500 text-sm">Failed to load molecule details</p>`;
  }
}

/** Populate the <select> with molecules; returns the first molecule_id (or null) */
export async function populateMoleculeDropdown(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return null;
  try {
    const res = await fetch('/api/molecules');
    const list = await res.json();
    sel.innerHTML = '';
    list.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.molecule_id;
      opt.textContent = m.molecule_name;
      sel.appendChild(opt);
    });
    return list.length ? list[0].molecule_id : null;
  } catch (e) {
    console.error('Dropdown load error:', e);
    sel.innerHTML = '<option>Failed to load list</option>';
    return null;
  }
}
