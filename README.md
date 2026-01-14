# FocusMore

A Chrome extension to block distracting websites during focus time, helping you stay productive with motivational messages.

![FocusMore Icon](icons/icon128.png)

## Features

- **Block distracting sites** - Add websites to your block list via popup or settings page
- **Flexible scheduling** - Configure different time slots for each day of the week (defaults to weekdays 9-17)
- **Motivational block page** - See encouraging quotes when you try to visit blocked sites
- **Pause with intention** - Type a random word to confirm pausing (prevents mindless unblocking)
- **Warning banner** - When paused, a banner appears on blocked sites with countdown and "Resume blocking now" button
- **Statistics dashboard** - Track your blocked attempts with bar charts, heatmaps, and summary stats
- **Import/Export** - Backup and restore your settings

## Installation

### From source (Developer mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/focusmore.git
   ```

2. Open Chrome and navigate to `chrome://extensions`

3. Enable **Developer mode** (toggle in top-right corner)

4. Click **Load unpacked** and select the `focusmore` folder

## Usage

### Adding sites to block

- Click the extension icon and type a domain (e.g., `facebook.com`)
- Or click **+ Current** to block the site you're currently viewing

### Configuring schedule

1. Click the extension icon and select **Settings**
2. Enable **scheduled blocking**
3. Click on any day to expand and add time slots
4. Click **Save Schedule**

### Pausing blocking

1. Click the extension icon
2. Click **Pause for 5 min**
3. Type the displayed word to confirm

While paused, a red warning banner appears on blocked sites showing the remaining time. You can click **Resume blocking now** to end the pause early.

### Statistics

Click **Statistics** in the popup to view:
- **Weekly bar chart** - Blocked attempts per day, color-coded by site
- **Heatmap** - Activity patterns by day of week and hour
- **Summary** - Total blocks, most blocked site, peak distraction hour

## Project Structure

```
focusmore/
├── manifest.json      # Extension manifest (Manifest V3)
├── background.js      # Service worker for blocking logic
├── content.js         # Warning banner on blocked sites when paused
├── popup/             # Quick-access popup UI
├── options/           # Full settings page
├── blocked/           # Motivational block page
├── stats/             # Statistics dashboard
└── icons/             # Extension icons
```

## Permissions

- `storage` - Save your block list, schedule, and statistics
- `tabs` - Detect current tab URL for "Block current site" feature
- `webNavigation` - Intercept navigation to blocked sites

## License

MIT License - see [LICENSE](LICENSE) for details.
