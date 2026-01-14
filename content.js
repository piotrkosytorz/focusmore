// Content script - shows warning banner when paused on blocked sites

let bannerElement = null;
let countdownInterval = null;

async function checkAndShowBanner() {
  try {
    const result = await chrome.storage.sync.get(['blockedSites', 'tempDisabled']);

    const blockedSites = result.blockedSites || [];
    const tempDisabled = result.tempDisabled;

    // Check if current site is in blocked list
    const hostname = window.location.hostname.replace(/^www\./, '');
    const isBlocked = blockedSites.some(site => {
      const blockedHost = site.replace(/^www\./, '');
      return hostname === blockedHost || hostname.endsWith('.' + blockedHost);
    });

    // Check if currently paused
    const isPaused = tempDisabled && new Date() < new Date(tempDisabled);

    if (isBlocked && isPaused) {
      showBanner(new Date(tempDisabled));
    } else {
      hideBanner();
    }
  } catch (error) {
    console.error('FocusMore: Error checking status', error);
  }
}

const BANNER_HEIGHT = 40;

function showBanner(pauseEndTime) {
  if (bannerElement) {
    updateCountdown(pauseEndTime);
    return;
  }

  // Create banner
  bannerElement = document.createElement('div');
  bannerElement.id = 'focusmore-warning-banner';
  bannerElement.innerHTML = `
    <span class="focusmore-warning-text">
      ⚠️ You blocked this site. FocusMore is paused – blocking resumes in <span id="focusmore-countdown"></span>
    </span>
    <button id="focusmore-resume-btn">Resume blocking now</button>
  `;

  // Apply styles
  const styles = `
    #focusmore-warning-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: white;
      padding: 10px 20px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 2147483647;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    #focusmore-countdown {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    #focusmore-resume-btn {
      margin-left: 12px;
      padding: 4px 10px;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 4px;
      color: white;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    }
    #focusmore-resume-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.id = 'focusmore-styles';
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);

  // Store original margin and add offset for banner
  document.body.dataset.focusmoreOriginalMargin = document.body.style.marginTop || '';
  document.body.style.setProperty('margin-top', `${BANNER_HEIGHT}px`, 'important');

  // Offset fixed/sticky elements at the top of the page
  offsetFixedElements();

  document.body.appendChild(bannerElement);

  // Resume blocking button handler
  document.getElementById('focusmore-resume-btn').addEventListener('click', () => {
    chrome.storage.sync.remove('tempDisabled', () => {
      window.location.reload();
    });
  });

  // Start countdown
  updateCountdown(pauseEndTime);
  countdownInterval = setInterval(() => updateCountdown(pauseEndTime), 1000);
}

function offsetFixedElements() {
  const allElements = document.querySelectorAll('*');

  allElements.forEach(el => {
    if (el.id === 'focusmore-warning-banner') return;

    const style = window.getComputedStyle(el);
    const position = style.position;

    if (position === 'fixed' || position === 'sticky') {
      const top = style.top;

      // Only offset elements that are positioned at or near the top
      if (top === '0px' || top === 'auto' || parseInt(top) <= 10) {
        const currentTop = parseInt(top) || 0;
        el.dataset.focusmoreOriginalTop = el.style.top || '';
        el.style.setProperty('top', `${currentTop + BANNER_HEIGHT}px`, 'important');
      }
    }
  });
}

function restoreFixedElements() {
  const allElements = document.querySelectorAll('[data-focusmore-original-top]');

  allElements.forEach(el => {
    el.style.top = el.dataset.focusmoreOriginalTop;
    delete el.dataset.focusmoreOriginalTop;
  });
}

function updateCountdown(pauseEndTime) {
  const now = new Date();
  const remaining = Math.max(0, pauseEndTime - now);

  if (remaining <= 0) {
    hideBanner();
    // Reload to trigger block
    window.location.reload();
    return;
  }

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  const countdownEl = document.getElementById('focusmore-countdown');
  if (countdownEl) {
    countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

function hideBanner() {
  if (bannerElement) {
    bannerElement.remove();
    bannerElement = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  // Restore original margin
  if (document.body.dataset.focusmoreOriginalMargin !== undefined) {
    document.body.style.marginTop = document.body.dataset.focusmoreOriginalMargin;
    delete document.body.dataset.focusmoreOriginalMargin;
  }
  // Restore fixed elements
  restoreFixedElements();
}

// Listen for storage changes (pause/resume)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.tempDisabled || changes.blockedSites)) {
    checkAndShowBanner();
  }
});

// Initial check
checkAndShowBanner();
