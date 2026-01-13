document.addEventListener('DOMContentLoaded', () => {
  const siteInput = document.getElementById('siteInput');
  const addBtn = document.getElementById('addBtn');
  const blockedList = document.getElementById('blockedList');
  const emptyMessage = document.getElementById('emptyMessage');
  const scheduleEnabled = document.getElementById('scheduleEnabled');
  const scheduleSettings = document.getElementById('scheduleSettings');
  const daySchedules = document.getElementById('daySchedules');
  const saveScheduleBtn = document.getElementById('saveSchedule');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const toast = document.getElementById('toast');

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Default schedule - weekdays 9-17
  const DEFAULT_SCHEDULE = {
    enabled: true,
    days: {
      0: [],
      1: [{ start: '09:00', end: '17:00' }],
      2: [{ start: '09:00', end: '17:00' }],
      3: [{ start: '09:00', end: '17:00' }],
      4: [{ start: '09:00', end: '17:00' }],
      5: [{ start: '09:00', end: '17:00' }],
      6: []
    }
  };

  // Current schedule in memory
  let schedule = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));

  // Show toast notification
  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
      toast.className = 'toast';
    }, 3000);
  }

  // Load blocked sites
  function loadBlockedSites() {
    chrome.storage.sync.get(['blockedSites'], (result) => {
      const sites = result.blockedSites || [];
      renderSiteList(sites);
    });
  }

  // Render site list
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

    document.querySelectorAll('#blockedList .remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        removeSite(index);
      });
    });
  }

  // Add site
  function addSite(site) {
    site = site.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');

    if (!site) return;

    chrome.storage.sync.get(['blockedSites'], (result) => {
      const sites = result.blockedSites || [];

      if (sites.includes(site)) {
        showToast('Site already blocked', 'error');
        return;
      }

      sites.push(site);
      chrome.storage.sync.set({ blockedSites: sites }, () => {
        siteInput.value = '';
        loadBlockedSites();
        showToast(`${site} added to block list`);
      });
    });
  }

  // Remove site
  function removeSite(index) {
    chrome.storage.sync.get(['blockedSites'], (result) => {
      const sites = result.blockedSites || [];
      const removed = sites.splice(index, 1)[0];
      chrome.storage.sync.set({ blockedSites: sites }, () => {
        loadBlockedSites();
        showToast(`${removed} removed`);
      });
    });
  }

  // Get summary text for a day's slots
  function getDaySummary(slots) {
    if (!slots || slots.length === 0) {
      return 'No blocking';
    }
    if (slots.length === 1) {
      return `${slots[0].start} - ${slots[0].end}`;
    }
    return `${slots.length} time slots`;
  }

  // Create a time slot element
  function createSlotElement(dayIndex, slotIndex, slot) {
    const div = document.createElement('div');
    div.className = 'time-slot';
    div.innerHTML = `
      <input type="time" class="slot-start" value="${slot.start}" data-day="${dayIndex}" data-slot="${slotIndex}">
      <span class="slot-separator">to</span>
      <input type="time" class="slot-end" value="${slot.end}" data-day="${dayIndex}" data-slot="${slotIndex}">
      <button class="remove-slot-btn" data-day="${dayIndex}" data-slot="${slotIndex}">Remove</button>
    `;
    return div;
  }

  // Render the schedule UI
  function renderSchedule() {
    daySchedules.innerHTML = '';

    DAY_NAMES.forEach((dayName, dayIndex) => {
      const slots = schedule.days[dayIndex] || [];
      const dayDiv = document.createElement('div');
      dayDiv.className = 'day-schedule';
      dayDiv.dataset.day = dayIndex;

      dayDiv.innerHTML = `
        <div class="day-header">
          <div>
            <span class="day-name">${dayName}</span>
            <span class="day-summary">${getDaySummary(slots)}</span>
          </div>
          <span class="expand-icon">▼</span>
        </div>
        <div class="day-slots" data-day="${dayIndex}">
          <div class="slots-container"></div>
          <button class="add-slot-btn" data-day="${dayIndex}">+ Add Time Slot</button>
        </div>
      `;

      const slotsContainer = dayDiv.querySelector('.slots-container');

      if (slots.length === 0) {
        slotsContainer.innerHTML = '<p class="no-slots">No time slots configured</p>';
      } else {
        slots.forEach((slot, slotIndex) => {
          slotsContainer.appendChild(createSlotElement(dayIndex, slotIndex, slot));
        });
      }

      daySchedules.appendChild(dayDiv);
    });

    // Add event listeners
    attachScheduleEventListeners();
  }

  // Attach event listeners for schedule UI
  function attachScheduleEventListeners() {
    // Toggle day expansion
    document.querySelectorAll('.day-header').forEach(header => {
      header.addEventListener('click', (e) => {
        const dayDiv = header.closest('.day-schedule');
        const slotsDiv = dayDiv.querySelector('.day-slots');
        slotsDiv.classList.toggle('expanded');
        const icon = header.querySelector('.expand-icon');
        icon.textContent = slotsDiv.classList.contains('expanded') ? '▲' : '▼';
      });
    });

    // Add slot buttons
    document.querySelectorAll('.add-slot-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dayIndex = parseInt(btn.dataset.day);
        addSlot(dayIndex);
      });
    });

    // Remove slot buttons
    document.querySelectorAll('.remove-slot-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dayIndex = parseInt(btn.dataset.day);
        const slotIndex = parseInt(btn.dataset.slot);
        removeSlot(dayIndex, slotIndex);
      });
    });

    // Time input changes
    document.querySelectorAll('.slot-start, .slot-end').forEach(input => {
      input.addEventListener('change', (e) => {
        const dayIndex = parseInt(input.dataset.day);
        const slotIndex = parseInt(input.dataset.slot);
        const isStart = input.classList.contains('slot-start');
        updateSlotTime(dayIndex, slotIndex, isStart, input.value);
      });
    });
  }

  // Add a new slot to a day
  function addSlot(dayIndex) {
    if (!schedule.days[dayIndex]) {
      schedule.days[dayIndex] = [];
    }
    schedule.days[dayIndex].push({ start: '09:00', end: '17:00' });
    renderSchedule();
    // Keep the day expanded
    const dayDiv = document.querySelector(`.day-schedule[data-day="${dayIndex}"]`);
    dayDiv.querySelector('.day-slots').classList.add('expanded');
    dayDiv.querySelector('.expand-icon').textContent = '▲';
  }

  // Remove a slot from a day
  function removeSlot(dayIndex, slotIndex) {
    schedule.days[dayIndex].splice(slotIndex, 1);
    renderSchedule();
    // Keep the day expanded
    const dayDiv = document.querySelector(`.day-schedule[data-day="${dayIndex}"]`);
    dayDiv.querySelector('.day-slots').classList.add('expanded');
    dayDiv.querySelector('.expand-icon').textContent = '▲';
  }

  // Update a slot's start or end time
  function updateSlotTime(dayIndex, slotIndex, isStart, value) {
    if (isStart) {
      schedule.days[dayIndex][slotIndex].start = value;
    } else {
      schedule.days[dayIndex][slotIndex].end = value;
    }
    // Update summary
    const dayDiv = document.querySelector(`.day-schedule[data-day="${dayIndex}"]`);
    const summary = dayDiv.querySelector('.day-summary');
    summary.textContent = getDaySummary(schedule.days[dayIndex]);
  }

  // Load schedule from storage
  function loadSchedule() {
    chrome.storage.sync.get(['schedule'], (result) => {
      if (result.schedule) {
        schedule = result.schedule;

        // Ensure days object exists
        if (!schedule.days) {
          schedule.days = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE.days));
        }
        // Ensure all days exist
        for (let i = 0; i < 7; i++) {
          if (!schedule.days[i]) {
            schedule.days[i] = [];
          }
        }
      }

      scheduleEnabled.checked = schedule.enabled;
      scheduleSettings.style.display = schedule.enabled ? 'block' : 'none';
      renderSchedule();
    });
  }

  // Save schedule to storage
  function saveSchedule() {
    schedule.enabled = scheduleEnabled.checked;

    chrome.storage.sync.set({ schedule }, () => {
      showToast('Schedule saved');
    });
  }

  // Export settings
  function exportSettings() {
    chrome.storage.sync.get(['blockedSites', 'schedule'], (result) => {
      const data = JSON.stringify(result, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'focusmore-settings.json';
      a.click();

      URL.revokeObjectURL(url);
      showToast('Settings exported');
    });
  }

  // Import settings
  function importSettings(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (data.blockedSites || data.schedule) {
          chrome.storage.sync.set(data, () => {
            loadBlockedSites();
            loadSchedule();
            showToast('Settings imported');
          });
        } else {
          showToast('Invalid settings file', 'error');
        }
      } catch {
        showToast('Failed to parse file', 'error');
      }
    };
    reader.readAsText(file);
  }

  // Event listeners
  addBtn.addEventListener('click', () => addSite(siteInput.value));

  siteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSite(siteInput.value);
  });

  scheduleEnabled.addEventListener('change', () => {
    scheduleSettings.style.display = scheduleEnabled.checked ? 'block' : 'none';
  });

  saveScheduleBtn.addEventListener('click', saveSchedule);

  exportBtn.addEventListener('click', exportSettings);

  importBtn.addEventListener('click', () => importFile.click());

  importFile.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      importSettings(e.target.files[0]);
    }
  });

  // Initial load
  loadBlockedSites();
  loadSchedule();
});
