# FocusMore

A Chrome extension to block distracting websites during focus time, helping you stay productive with motivational messages.

![FocusMore Icon](icons/icon128.png)

## Features

- **Block distracting sites** - Add websites to your block list via popup or settings page
- **Flexible scheduling** - Configure different time slots for each day of the week
- **Motivational messages** - See encouraging quotes when you try to visit blocked sites
- **Quick controls** - Pause blocking for 5 minutes when you need a break
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

1. Click the extension icon and select **Full Settings**
2. Enable **scheduled blocking**
3. Click on any day to expand and add time slots
4. Click **Save Schedule**

Example configuration:
- Monday-Friday: 09:00-12:00, 14:00-18:00
- Saturday: 10:00-14:00
- Sunday: No blocking

### Taking a break

When you visit a blocked site, you can:
- Click **Go Back** to return to your previous page
- Click **Take 5 min break** to temporarily disable blocking

## Project Structure

```
focusmore/
├── manifest.json      # Extension manifest (Manifest V3)
├── background.js      # Service worker for blocking logic
├── popup/             # Quick-access popup UI
├── options/           # Full settings page
├── blocked/           # Motivational block page
└── icons/             # Extension icons
```

## Permissions

- `storage` - Save your block list and schedule
- `tabs` - Detect current tab URL for "Block current site" feature
- `webNavigation` - Intercept navigation to blocked sites

## License

MIT License - see [LICENSE](LICENSE) for details.
