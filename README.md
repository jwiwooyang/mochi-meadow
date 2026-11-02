# Mochi's Meadow

A cozy, illustrated task planner built with plain HTML, CSS and JavaScript (no build step, no dependencies).

## Features
- Add, edit, complete and delete tasks with categories, priority, due dates and repeats (daily or weekly)
- Calendar and month folders: tap a day or a month to see everything you did or will do
- Focus timer (Pomodoro-style) with minutes tracked per day
- Streaks, a weekly chart, a "Coming up" list and a category balance view
- A sky that follows Philippine time (dawn, day, dusk, night); tap the chip at the top right to preview the others
- Mochi, a small mascot that reacts to what you do
- Tasks save automatically in your browser (localStorage), with Export and Import backup buttons

## Run it
Open `index.html` in a browser. Fonts (Baloo 2 and Quicksand) load from Google Fonts, so they need internet.

## Publish with GitHub Pages
Settings → Pages → Deploy from a branch → `main` / root.

## Files
- `index.html` structure and SVG icon sprite
- `style.css` design tokens, the four sky palettes, layout
- `script.js` app logic, saving, sky and timer
