document.addEventListener('DOMContentLoaded', () => {
  const siteInput = document.getElementById('siteInput');
  const addBtn = document.getElementById('addBtn');
  const addCurrentBtn = document.getElementById('addCurrentBtn');
  const blockedList = document.getElementById('blockedList');
  const emptyMessage = document.getElementById('emptyMessage');
  const statusEl = document.getElementById('status');
  const pauseBtn = document.getElementById('pauseBtn');
  const optionsLink = document.getElementById('optionsLink');

  // Load and display blocked sites
  function loadBlockedSites() {
    chrome.storage.sync.get(['blockedSites'], (result) => {
      const sites = result.blockedSites || [];
      renderSiteList(sites);
    });
  }

  // Render the site list
  function renderSiteList(sites) {
    blockedList.innerHTML = '';

    if (sites.length === 0) {
      emptyMessage.style.display = 'block';
      return;
    }

    emptyMessage.style.display = 'none';

    sites.forEach((site, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="site-name">${site}</span>
        <button class="remove-btn" data-index="${index}">Remove</button>
      `;
      blockedList.appendChild(li);
    });

    // Add remove handlers
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        removeSite(index);
      });
    });
  }

  // Add a site to the block list
  function addSite(site) {
    site = site.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');

    if (!site) return;

    chrome.storage.sync.get(['blockedSites'], (result) => {
      const sites = result.blockedSites || [];

      if (sites.includes(site)) {
        alert('Site already blocked');
        return;
      }

      sites.push(site);
      chrome.storage.sync.set({ blockedSites: sites }, () => {
        siteInput.value = '';
        loadBlockedSites();
      });
    });
  }

  // Remove a site from the block list
  function removeSite(index) {
    chrome.storage.sync.get(['blockedSites'], (result) => {
      const sites = result.blockedSites || [];
      sites.splice(index, 1);
      chrome.storage.sync.set({ blockedSites: sites }, loadBlockedSites);
    });
  }

  // Update status display
  function updateStatus() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
      if (response.tempDisabled) {
        statusEl.textContent = 'Paused';
        statusEl.className = 'status paused';
        pauseBtn.textContent = 'Resume';
        pauseBtn.classList.add('resume');
      } else if (response.isActive) {
        statusEl.textContent = 'Active';
        statusEl.className = 'status active';
        pauseBtn.textContent = 'Pause for 5 min';
        pauseBtn.classList.remove('resume');
      } else {
        statusEl.textContent = 'Inactive';
        statusEl.className = 'status inactive';
        pauseBtn.textContent = 'Pause for 5 min';
        pauseBtn.classList.remove('resume');
      }
    });
  }

  // Toggle pause
  function togglePause() {
    chrome.storage.sync.get(['tempDisabled'], (result) => {
      if (result.tempDisabled && new Date() < new Date(result.tempDisabled)) {
        // Resume - clear the temp disable
        chrome.storage.sync.remove('tempDisabled', updateStatus);
      } else {
        // Pause for 5 minutes
        const pauseUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        chrome.storage.sync.set({ tempDisabled: pauseUntil }, updateStatus);
      }
    });
  }

  // Event listeners
  addBtn.addEventListener('click', () => addSite(siteInput.value));

  siteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSite(siteInput.value);
  });

  addCurrentBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          addSite(url.hostname);
        } catch {
          alert('Cannot block this page');
        }
      }
    });
  });

  pauseBtn.addEventListener('click', togglePause);

  optionsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Initial load
  loadBlockedSites();
  updateStatus();
});
