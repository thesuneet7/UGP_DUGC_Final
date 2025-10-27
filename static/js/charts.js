// charts.js
let chart = null;
let molecules = [];
let ctx = null;
let onSelectCallback = null;

export async function initChart(canvasId, onSelect) {
  ctx = document.getElementById(canvasId).getContext('2d');
  onSelectCallback = onSelect;
  const resp = await fetch('/api/molecules/chart');
  molecules = await resp.json();
  renderScatter();
}

export function switchPlot(type) {
  if (!molecules.length) return;
  if (chart) chart.destroy();
  if (type === 'bar') {
    renderBar();
  } else {
    renderScatter();
  }
}

function renderScatter() {
  chart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Molecules',
        data: molecules.map(m => ({ x: m.molecule_id, y: m.free_energy, name: m.molecule_name, formula: m.molecular_formula })),
        backgroundColor: 'rgba(59, 130, 246, 0.7)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Molecule ID' }, ticks: { autoSkip: false } },
        y: { title: { display: true, text: 'Free Energy (kcal/mol)' } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const d = ctx.raw;
              const energy = (typeof d.y === 'number') ? d.y.toFixed(6) : d.y;
              return `ID ${d.x} • ΔG: ${energy} • ${d.formula} — ${d.name}`;
            }
          }
        },
        zoom: {
          pan: { enabled: true, mode: 'xy' },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' }
        }
      },
      onClick: (e) => {
        const pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
        if (pts.length && onSelectCallback) {
          const d = chart.data.datasets[0].data[pts[0].index];
          onSelectCallback(d.x); // molecule_id
        }
      }
    }
  });
}

function renderBar() {
  const labels = molecules.map(m => `ID ${m.molecule_id}`);
  const values = molecules.map(m => m.free_energy);
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Free Energy (kcal/mol)',
        data: values,
        backgroundColor: 'rgba(59, 130, 246, 0.7)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Molecule' } },
        y: { title: { display: true, text: 'Free Energy (kcal/mol)' } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const i = ctx.dataIndex;
              const m = molecules[i];
              return `ΔG: ${ctx.parsed.y.toFixed(6)} • ${m.molecular_formula} — ${m.molecule_name}`;
            }
          }
        },
        zoom: {
          pan: { enabled: true, mode: 'y' },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'y' }
        }
      },
      onClick: (e) => {
        const els = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
        if (els.length && onSelectCallback) {
          const idx = els[0].index;
          const m = molecules[idx];
          onSelectCallback(m.molecule_id);
        }
      }
    }
  });
}
