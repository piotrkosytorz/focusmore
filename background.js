// Default settings - weekdays 9-17
const DEFAULT_SETTINGS = {
  blockedSites: [],
  schedule: {
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
  }
};

// Initialize storage with defaults on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['blockedSites', 'schedule'], (result) => {
    if (!result.blockedSites) {
      chrome.storage.sync.set({ blockedSites: DEFAULT_SETTINGS.blockedSites });
    }
    if (!result.schedule) {
      chrome.storage.sync.set({ schedule: DEFAULT_SETTINGS.schedule });
    }
  });
});

// Check if current time is within scheduled block times
function isWithinSchedule(schedule) {
  if (!schedule || !schedule.enabled) return false;

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Get today's slots
  const todaySlots = schedule.days?.[currentDay] || [];

  for (const slot of todaySlots) {
    const [startHour, startMin] = slot.start.split(':').map(Number);
    const [endHour, endMin] = slot.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (currentTime >= startTime && currentTime < endTime) {
      return true;
    }
  }

  return false;
}

// Check if URL matches any blocked site
function isBlockedSite(url, blockedSites) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return blockedSites.some(site => {
      const blockedHost = site.replace(/^www\./, '');
      return hostname === blockedHost || hostname.endsWith('.' + blockedHost);
    });
  } catch {
    return false;
  }
}

// Handle navigation
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only check main frame navigations
  if (details.frameId !== 0) return;

  // Don't block our own pages
  if (details.url.startsWith(chrome.runtime.getURL(''))) return;

  try {
    const result = await chrome.storage.sync.get(['blockedSites', 'schedule', 'tempDisabled']);

    // Check if temporarily disabled
    if (result.tempDisabled) {
      const disabledUntil = new Date(result.tempDisabled);
      if (new Date() < disabledUntil) return;
      // Clear expired temp disable
      chrome.storage.sync.remove('tempDisabled');
    }

    const blockedSites = result.blockedSites || [];
    const schedule = result.schedule || DEFAULT_SETTINGS.schedule;

    if (isBlockedSite(details.url, blockedSites) && isWithinSchedule(schedule)) {
      const blockedUrl = encodeURIComponent(details.url);
      const redirectUrl = chrome.runtime.getURL(`blocked/blocked.html?url=${blockedUrl}`);

      chrome.tabs.update(details.tabId, { url: redirectUrl });
    }
  } catch (error) {
    console.error('FocusMore error:', error);
  }
});

// Listen for messages from popup/options
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStatus') {
    chrome.storage.sync.get(['schedule', 'tempDisabled'], (result) => {
      const schedule = result.schedule || DEFAULT_SETTINGS.schedule;
      const isActive = isWithinSchedule(schedule);

      let tempDisabled = false;
      if (result.tempDisabled && new Date() < new Date(result.tempDisabled)) {
        tempDisabled = true;
      }

      sendResponse({ isActive: isActive && !tempDisabled, tempDisabled });
    });
    return true; // Keep channel open for async response
  }
});
