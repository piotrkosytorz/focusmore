const QUOTES = [
  "Your future self will thank you for staying focused today.",
  "Great things are built one focused moment at a time.",
  "The secret of getting ahead is getting started.",
  "Focus on being productive instead of busy.",
  "Small daily improvements lead to stunning results.",
  "Don't watch the clock; do what it does. Keep going.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The only way to do great work is to love what you do.",
  "Discipline is choosing between what you want now and what you want most.",
  "Your focus determines your reality.",
  "What you focus on expands.",
  "Energy flows where attention goes.",
  "The successful warrior is the average person with laser-like focus.",
  "It's not about having time, it's about making time.",
  "Action is the foundational key to all success.",
  "Winners focus on winning. Losers focus on winners.",
  "Concentrate all your thoughts upon the work at hand.",
  "You don't have to be great to start, but you have to start to be great.",
  "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
  "One of the secrets of life is to make stepping stones out of stumbling blocks."
];

document.addEventListener('DOMContentLoaded', () => {
  const quoteEl = document.getElementById('quote');
  const blockedUrlEl = document.getElementById('blockedUrl');
  const scheduleTextEl = document.getElementById('scheduleText');

  // Display random quote
  const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  quoteEl.textContent = `"${randomQuote}"`;

  // Get blocked URL from query params
  const params = new URLSearchParams(window.location.search);
  const blockedUrl = params.get('url');

  try {
    const url = new URL(decodeURIComponent(blockedUrl));
    blockedUrlEl.textContent = url.hostname;
  } catch {
    blockedUrlEl.textContent = 'Unknown site';
  }

  // Show schedule info for today
  chrome.storage.sync.get(['schedule'], (result) => {
    const schedule = result.schedule;
    if (schedule && schedule.days) {
      const today = new Date().getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todaySlots = schedule.days[today] || [];

      if (todaySlots.length > 0) {
        const slotsText = todaySlots.map(s => `${s.start}-${s.end}`).join(', ');
        scheduleTextEl.textContent = `${dayNames[today]}'s focus time: ${slotsText}`;
      } else {
        scheduleTextEl.textContent = 'No scheduled focus time today';
      }
    }
  });

});
