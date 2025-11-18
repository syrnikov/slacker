# Shift Time Bakery

A cozy faux-desktop app that helps you coast through the rest of your shift with countdowns, self-care reminders, weather vibes, and a slacking schedule. Originally prototyped as a single HTML file, the project now uses a more conventional structure for easier collaboration.

## Project structure

```
slacker/
├── index.html      # Layout & semantic markup
├── styles.css      # All global styles, variables, and responsive tweaks
├── script.js       # App logic, timers, widgets, and Open-Meteo integration
└── backgrounds/    # Static art assets for the faux desktop
```

## Local development

1. Clone the repository.
2. Serve the files however you like (any static file server works). For example:
   ```bash
   python3 -m http.server 8000
   ```
3. Visit `http://localhost:8000` in your browser. All UI state is stored in `localStorage` so you can refresh without losing your schedule.

## Features

- Shift countdown with progress bar, live timeline visualization, and "next stop" logic that prefers your next slacking break over the end of the shift.
- "Today in the bakery" dashboard with supportive reminders, rotating summaries, and a weather widget powered by the Open-Meteo API.
- Slacking schedule widget with emoji pickers, universal time inputs, add/remove/shuffle controls, and entries that stay in one tidy line.
- Slide-in micro notifications that nudge you to hydrate, blink, stretch, change posture, and celebrate milestones like halfway or the final hour.
- Cooked mode toggle that lets you drop into (or exit) low-power mode without losing your place, plus pointer/selection tweaks and a pixel-art frame for that cozy fake-app vibe.

## Environment variables / configuration

The weather widget uses the Open-Meteo public API and does not require an API key. To change the default location, edit `DEFAULT_LOCATION` inside `script.js`.

## Contributing

Feel free to open issues or submit pull requests with improvements. Please keep the tone gentle, the UI playful, and resist the urge to turn this into a serious productivity tracker.
