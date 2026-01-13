// Color palette for sites
const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

document.addEventListener('DOMContentLoaded', () => {
  loadStats();

  document.getElementById('clearData').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all statistics data?')) {
      chrome.storage.local.remove('incidents', () => {
        loadStats();
      });
    }
  });
});

async function loadStats() {
  const result = await chrome.storage.local.get(['incidents']);
  const incidents = result.incidents || [];

  // Filter to last 7 days
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const weekIncidents = incidents.filter(i => i.timestamp > oneWeekAgo);

  if (weekIncidents.length === 0) {
    showEmptyState();
    return;
  }

  renderBarChart(weekIncidents);
  renderHeatmap(weekIncidents);
  renderSummary(weekIncidents);
}

function showEmptyState() {
  document.getElementById('barChart').innerHTML = `
    <div class="empty-state">
      <p>No blocked attempts this week</p>
      <p>Keep up the good work!</p>
    </div>
  `;
  document.getElementById('legend').innerHTML = '';
  document.getElementById('heatmap').innerHTML = `
    <div class="empty-state">
      <p>No data to display</p>
    </div>
  `;
  document.getElementById('totalBlocks').textContent = '0';
  document.getElementById('topSite').textContent = '-';
  document.getElementById('peakHour').textContent = '-';
}

function renderBarChart(incidents) {
  const container = document.getElementById('barChart');
  const legendContainer = document.getElementById('legend');

  // Group by day and site
  const dayData = {};
  const sites = new Set();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dayKey = date.toDateString();
    dayData[dayKey] = {};
  }

  incidents.forEach(incident => {
    const date = new Date(incident.timestamp);
    const dayKey = date.toDateString();
    if (dayData[dayKey]) {
      sites.add(incident.site);
      dayData[dayKey][incident.site] = (dayData[dayKey][incident.site] || 0) + 1;
    }
  });

  // Assign colors to sites
  const siteColors = {};
  Array.from(sites).forEach((site, index) => {
    siteColors[site] = COLORS[index % COLORS.length];
  });

  // Find max for scaling
  let maxCount = 0;
  Object.values(dayData).forEach(daySites => {
    const total = Object.values(daySites).reduce((a, b) => a + b, 0);
    maxCount = Math.max(maxCount, total);
  });

  // Render bars
  container.innerHTML = '';
  Object.entries(dayData).forEach(([dayKey, daySites]) => {
    const date = new Date(dayKey);
    const dayName = DAY_NAMES[date.getDay()];

    const barGroup = document.createElement('div');
    barGroup.className = 'bar-group';

    const barStack = document.createElement('div');
    barStack.className = 'bar-stack';
    barStack.style.height = '160px';

    Object.entries(daySites).forEach(([site, count]) => {
      const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.height = `${height}%`;
      bar.style.backgroundColor = siteColors[site];
      bar.title = `${site}: ${count}`;
      barStack.appendChild(bar);
    });

    const label = document.createElement('span');
    label.className = 'bar-label';
    label.textContent = dayName;

    barGroup.appendChild(barStack);
    barGroup.appendChild(label);
    container.appendChild(barGroup);
  });

  // Render legend
  legendContainer.innerHTML = '';
  Object.entries(siteColors).forEach(([site, color]) => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <span class="legend-color" style="background: ${color}"></span>
      <span>${site}</span>
    `;
    legendContainer.appendChild(item);
  });
}

function renderHeatmap(incidents) {
  const container = document.getElementById('heatmap');

  // Build heatmap data: [day][hour] = count
  const heatmapData = {};
  for (let d = 0; d < 7; d++) {
    heatmapData[d] = {};
    for (let h = 0; h < 24; h++) {
      heatmapData[d][h] = 0;
    }
  }

  incidents.forEach(incident => {
    const date = new Date(incident.timestamp);
    const day = date.getDay();
    const hour = date.getHours();
    heatmapData[day][hour]++;
  });

  // Find max for intensity scaling
  let maxCount = 0;
  Object.values(heatmapData).forEach(hours => {
    Object.values(hours).forEach(count => {
      maxCount = Math.max(maxCount, count);
    });
  });

  // Render heatmap
  const heatmap = document.createElement('div');
  heatmap.className = 'heatmap';

  // Header row
  heatmap.innerHTML = '<div class="heatmap-header"></div>';
  for (let h = 0; h < 24; h++) {
    const header = document.createElement('div');
    header.className = 'heatmap-header';
    header.textContent = h.toString().padStart(2, '0');
    heatmap.appendChild(header);
  }

  // Data rows (Monday first)
  const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun
  dayOrder.forEach(day => {
    const rowLabel = document.createElement('div');
    rowLabel.className = 'heatmap-row-label';
    rowLabel.textContent = DAY_NAMES[day];
    heatmap.appendChild(rowLabel);

    for (let h = 0; h < 24; h++) {
      const count = heatmapData[day][h];
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      cell.dataset.count = count;

      // Calculate intensity level (1-5)
      if (count > 0 && maxCount > 0) {
        const level = Math.min(5, Math.ceil((count / maxCount) * 5));
        cell.dataset.level = level;
      }

      cell.title = `${DAY_NAMES[day]} ${h}:00 - ${count} block${count !== 1 ? 's' : ''}`;
      heatmap.appendChild(cell);
    }
  });

  container.innerHTML = '';
  container.appendChild(heatmap);
}

function renderSummary(incidents) {
  // Total blocks
  document.getElementById('totalBlocks').textContent = incidents.length;

  // Most blocked site
  const siteCounts = {};
  incidents.forEach(i => {
    siteCounts[i.site] = (siteCounts[i.site] || 0) + 1;
  });

  const topSite = Object.entries(siteCounts)
    .sort((a, b) => b[1] - a[1])[0];

  if (topSite) {
    document.getElementById('topSite').textContent = topSite[0];
  }

  // Peak hour
  const hourCounts = {};
  incidents.forEach(i => {
    const hour = new Date(i.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const peakHour = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])[0];

  if (peakHour) {
    const h = parseInt(peakHour[0]);
    document.getElementById('peakHour').textContent = `${h}:00`;
  }
}
