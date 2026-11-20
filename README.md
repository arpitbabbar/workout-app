# Workout Tracker

A personal workout & activity tracker that runs in your browser. No account, no internet needed — data is saved on the device.

## Run it
- **Easiest:** double-click `start.command` (Mac). It opens the app at http://localhost:8000.
- **Or in Terminal:** `cd` into this folder, run `python3 -m http.server 8000`, open http://localhost:8000.

## On your phone (same Wi-Fi)
Open the "On your phone" address that `start.command` prints, then:
- iPhone (Safari): Share → *Add to Home Screen*
- Android (Chrome): ⋮ menu → *Add to Home screen*

Data saved on the phone stays on the phone. Use **Settings → Download backup** regularly.

## Files
- `index.html` – page skeleton · `styles.css` – look & feel · `app.js` – all the logic
- `sw.js`, `manifest.json`, `icon*` – make it installable / work offline
