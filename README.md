# Iceland Road Trip 2026 🇮🇸

A React-based companion app for a 9-day Iceland road trip itinerary, featuring an interactive map with route visualization.

## Features

- **Day-by-Day Itinerary**: View all 9 days with stops, drive times, and overnight campsites
- **Interactive Map**: Leaflet map showing routes, markers by stop type, and OSRM road routing
- **Detailed Information**: Notes, durations, and prices for each location
- **Mobile Responsive**: Works on desktop and mobile devices
- **Driving Stats**: Total drive time and activity time per day

## Tech Stack

- **React** + **Vite** - Fast, modern development
- **Leaflet.js** + **react-leaflet** - Interactive maps (OpenStreetMap)
- **OSRM API** - Real road-following route visualization
- **Pure CSS** - Clean, responsive styling

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to GitHub Pages

1. **Create a GitHub repository** named `iceland-road-trip`

2. **Update the homepage URL** in `package.json`:
   ```json
   "homepage": "https://{your-username}.github.io/iceland-road-trip"
   ```

3. **Update the base path** in `vite.config.js`:
   ```javascript
   base: '/iceland-road-trip/'
   ```

4. **Initialize git and push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Iceland Road Trip app"
   git branch -M main
   git remote add origin https://github.com/{your-username}/iceland-road-trip.git
   git push -u origin main
   ```

5. **Deploy to GitHub Pages**:
   ```bash
   npm run deploy
   ```

6. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` / `root`
   - Save

Your app will be live at `https://{your-username}.github.io/iceland-road-trip/`

## Data Structure

Trip data is stored in `src/data/trip.json` with the following structure:

- **Days**: 9 days of itinerary
- **Stops**: Each day has multiple stops with coordinates, type, duration, and notes
- **Overnight**: Campsite information with price and location
- **Drive Times**: Calculated distances between consecutive stops

## Map Features

- **Color-coded markers**:
  - 🔵 Blue: Sightseeing, waterfalls, hiking, glaciers, lava fields
  - 🟢 Green: Campsites
  - 🛒 Orange: Grocery stores
  - ✈️ Gray: Airports
  - 💜 Purple: Hot springs, geothermal areas

- **OSRM routing**: Real road paths between stops (not straight lines)
- **Popup details**: Click any marker for location notes

## License

MIT

---

**Enjoy your Iceland adventure!** 🏔️🌊🔥
