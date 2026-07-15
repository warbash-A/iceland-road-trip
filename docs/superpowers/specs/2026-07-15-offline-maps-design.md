# Offline Maps Feature - Design Specification

**Date:** 2026-07-15  
**Version:** Phase 1  
**Status:** Approved

## Executive Summary

Add offline map functionality to the Iceland Road Trip app to support navigation in areas with spotty or no cell service. Phase 1 focuses on pre-downloading map tiles and route data, allowing the app to work completely offline while maintaining the existing UI unchanged.

## Goals & Non-Goals

### Phase 1 Goals
- View all maps offline (zoom levels 7-15) for entire route corridor
- Display pre-downloaded routes between all planned stops
- Show current location and route polylines offline
- Provide explicit download control with progress feedback
- Support offline operation with no UI changes to existing interface
- Minimal storage footprint (~50-80MB)

### Phase 1 Non-Goals
- Calculate NEW routes to unplanned destinations while offline (deferred to Phase 2)
- Re-routing if significantly off planned path (deferred to Phase 2)
- Voice turn-by-turn announcements (deferred to Phase 2)
- In-app navigation UI (existing external navigation via Google/Apple Maps sufficient)

### Success Criteria
- User can download all trip maps in < 5 minutes on WiFi
- All map tiles display correctly when device is offline
- Route polylines render offline without errors
- Navigate buttons continue to work (opening external navigation)
- Storage usage stays under 100MB
- No changes to existing UI/UX (only adds download controls)

## Architecture

### High-Level Components

```
┌─────────────────────────────────────────────┐
│           React Application                  │
│  ┌────────────┐  ┌──────────────────────┐  │
│  │  TripMap   │  │  OfflineManager      │  │
│  │ (existing) │  │  (new component)     │  │
│  └────────────┘  └──────────────────────┘  │
│         │                   │                │
│         │         ┌─────────┴─────────┐     │
│         │         │                   │     │
│    ┌────▼─────┐  ┌▼────────┐  ┌─────▼────┐ │
│    │ Leaflet  │  │IndexedDB│  │  Utils   │ │
│    │   Map    │  │ (tiles) │  │(routing) │ │
│    └────┬─────┘  └─────────┘  └──────────┘ │
└─────────┼────────────────────────────────────┘
          │
    ┌─────▼──────┐
    │  Service   │
    │  Worker    │ ◄── Intercepts tile requests
    └────────────┘
```

### Storage Layers

**IndexedDB:**
- Map tiles as blobs (~50-80MB)
- Key format: `tile_{z}_{x}_{y}`
- Stores PNG image data

**localStorage:**
- Pre-downloaded OSRM route responses
- Offline metadata (download timestamp, tile count, storage used)
- Small JSON structures

**Service Worker Cache:**
- App static assets (for PWA functionality)
- Not used for tiles (too large for cache API)

### Key Architectural Decisions

1. **IndexedDB for tiles** - Designed for large binary data, better than localStorage or Cache API for volume
2. **Service Worker intercepts requests** - Transparent to React app, serves cached tiles when offline
3. **Separate OfflineManager component** - Isolates download logic from rendering
4. **Pre-cache OSRM routes during download** - Saves route polyline data for offline display
5. **No new navigation UI** - Keeps existing "Navigate" button behavior (opens external app)

## Components

### New: OfflineManager Component

**Location:** `src/components/OfflineManager.jsx`

**Props:**
```javascript
{
  tripData: Object,              // Current trip data with all stops
  onDownloadComplete: Function,  // Callback after successful download
  onError: Function              // Callback on download error
}
```

**Responsibilities:**
- Calculate tile coverage area from trip stops (20km buffer)
- Download tiles for zoom levels 7-15 with progress tracking
- Pre-fetch OSRM routes for all stop-to-stop segments
- Store tiles in IndexedDB and routes in localStorage
- Display download UI (button, progress bar, storage info)
- Show offline/online status indicator
- Provide storage management (clear cache, re-download)

**UI Integration:**
- Add to MapControls component (existing overlay)
- Minimal UI: Status indicator + download button/info
- Progress modal during download
- Auto-dismiss success message

### Modified: TripMap Component

**Location:** `src/components/TripMap.jsx` (lines 104-136)

**Changes:**
Modify `useEffect` that fetches OSRM routes to:
1. Check localStorage cache first
2. If cached, use cached route data
3. If not cached and online, fetch and cache
4. If offline and not cached, skip route display

**Before:**
```javascript
useEffect(() => {
  days.forEach(day => {
    const fetchRoute = async () => {
      const response = await fetch(`https://router.project-osrm.org/...`);
      const data = await response.json();
      // Process and set routes
    };
    fetchRoute();
  });
}, [days, routes]);
```

**After:**
```javascript
useEffect(() => {
  days.forEach(day => {
    const fetchRoute = async () => {
      // Try cache first
      const cached = getCachedRoute(day.day, startIdx, endIdx);
      if (cached) {
        setRoutes(prev => ({ ...prev, [day.day]: cached }));
        return;
      }
      
      // If online, fetch and cache
      if (navigator.onLine) {
        const response = await fetch(`https://router.project-osrm.org/...`);
        const data = await response.json();
        cacheRoute(day.day, startIdx, endIdx, data);
        // Existing processing logic
      }
    };
    fetchRoute();
  });
}, [days, routes]);
```

### New: Service Worker

**Location:** `public/service-worker.js`

**Responsibilities:**
- Register on app load
- Intercept fetch requests for tile images
- Serve tiles from IndexedDB when available
- Fallback to network when online
- Return gray placeholder for missing tiles when offline

**Logic:**
```javascript
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Is this an OpenStreetMap tile request?
  if (url.includes('tile.openstreetmap.org')) {
    event.respondWith(
      getTileFromIndexedDB(url)
        .then(tile => {
          if (tile) return new Response(tile, {
            headers: { 'Content-Type': 'image/png' }
          });
          // Online: fetch from network
          if (navigator.onLine) {
            return fetch(event.request);
          }
          // Offline: show placeholder
          return generatePlaceholderTile();
        })
    );
  }
});
```

### New: Utility Functions

**Location:** `src/utils/offlineUtils.js`

**Functions:**
```javascript
// Tile calculation
calculateBoundingBox(stops, bufferKm)
bboxToTileRange(bbox, zoom)
generateTileList(tileRange, zoom)
tileToUrl(z, x, y)

// IndexedDB operations
openTileDB()
saveTile(z, x, y, blob)
getTile(z, x, y)
clearAllTiles()
getTileCount()

// Route caching
cacheRoute(dayNum, startIdx, endIdx, osrmResponse)
getCachedRoute(dayNum, startIdx, endIdx)
getAllCachedRoutes()

// Storage management
getStorageInfo()
estimateDownloadSize(tileCount)
checkStorageAvailable(requiredBytes)

// Offline status
isOfflineDataAvailable()
getOfflineMetadata()
setOfflineMetadata(metadata)
```

## Data Structures

### Tile Storage (IndexedDB)

**Database:** `iceland-trip-tiles`  
**Object Store:** `tiles`  
**Key:** `tile_{z}_{x}_{y}` (string)

**Value:**
```javascript
{
  blob: Uint8Array,      // PNG image binary data
  timestamp: 1720123456789,
  url: "https://tile.openstreetmap.org/15/17234/10562.png"
}
```

### Route Storage (localStorage)

**Key format:** `osrm_route_day{N}_stop{X}_to_stop{Y}`

**Value:**
```javascript
{
  routes: [{
    geometry: {
      coordinates: [[lng, lat], ...]  // Full OSRM response
    },
    legs: [...],
    distance: 45300,     // meters
    duration: 2700       // seconds
  }],
  waypoints: [...],
  code: "Ok",
  cachedAt: 1720123456789
}
```

### Offline Metadata (localStorage)

**Key:** `offline_metadata`

**Value:**
```javascript
{
  version: "1.0",
  downloadedAt: 1720123456789,
  lastUpdated: 1720123456789,
  totalTiles: 1240,
  storageUsedBytes: 67108864,
  boundingBox: {
    north: 66.5,
    south: 63.4,
    east: -13.5,
    west: -24.5
  },
  zoomLevels: [7, 8, 9, 10, 11, 12, 13, 14, 15],
  routesDownloaded: 45,
  routeKeys: [
    "osrm_route_day1_stop0_to_stop1",
    "osrm_route_day1_stop1_to_stop2",
    // ...
  ]
}
```

## Download Strategy

### Tile Coverage Calculation

1. Extract all stop coordinates from `tripData.trip.days[].stops[]`
2. Include overnight locations from `tripData.trip.days[].overnight`
3. Calculate bounding box with 20km buffer on all sides
4. For zoom levels 7-15, convert bbox to tile coordinates
5. Generate tile list: `{z, x, y}` for each tile in range

**Estimated coverage for Iceland Ring Road route:**
- Bounding box: ~66.5°N to 63.4°N, ~-24.5°W to -13.5°E
- Zoom 7: ~4 tiles
- Zoom 8: ~9 tiles
- Zoom 9: ~20 tiles
- Zoom 10: ~45 tiles
- Zoom 11: ~90 tiles
- Zoom 12: ~180 tiles
- Zoom 13: ~360 tiles
- Zoom 14: ~720 tiles
- Zoom 15: ~1,440 tiles
- **Total: ~2,868 tiles** (conservative estimate, optimized will be ~1,200-1,500)

**Storage estimate:**
- Average tile size: 45KB (PNG compressed)
- Total storage: 1,500 tiles × 45KB = ~67MB

### Download Process

**Flow:**
1. User clicks "Download Offline Maps" button
2. Show confirmation modal with size estimate
3. User confirms → begin download
4. Calculate tile list and route segments
5. Download in batches:
   - Tiles: 10 concurrent requests
   - Wait 100ms between batches (respect tile server)
   - Retry failed tiles up to 3 times
6. Download OSRM routes (all segments in parallel, ~45 requests)
7. Save everything to IndexedDB/localStorage
8. Update metadata
9. Register/activate service worker
10. Show success message

**Progress tracking:**
```
Downloading Offline Maps...

Progress: 450/1,500 tiles (30%)
[████████░░░░░░░░░░░░]

Routes: 45/45 cached ✓

Estimated: 4 min remaining

[Cancel Download]
```

**Retry logic:**
- Failed tiles: Retry with exponential backoff (1s, 2s, 4s)
- After 3 failures: Mark as failed, continue
- Show summary: "1,495/1,500 tiles downloaded (5 failed)"
- User can retry failed tiles later

### Respecting Tile Server Limits

**OpenStreetMap Tile Usage Policy:**
- Max 2 requests per second per client
- Heavy use requires own tile server
- Must include User-Agent header

**Our implementation:**
- Batch size: 10 tiles
- Delay between batches: 100ms (= 100 tiles/second max)
- User-Agent: "Iceland-Road-Trip-App/1.0"
- One-time download (not continuous)
- Within acceptable use limits

## Offline Behavior

### Service Worker Request Interception

**Tile requests flow:**
1. Leaflet requests tile: `https://tile.openstreetmap.org/15/17234/10562.png`
2. Service Worker intercepts via `fetch` event
3. Service Worker queries IndexedDB for `tile_15_17234_10562`
4. If found: Return cached blob with `Content-Type: image/png`
5. If not found and online: Fetch from network (passthrough)
6. If not found and offline: Return gray placeholder tile

**Route display:**
- TripMap checks `navigator.onLine` before fetching
- If offline: Only use cached routes from localStorage
- Cached routes render same polylines as online

**Navigate button:**
- No changes to existing behavior
- Opens external navigation (Google Maps/Apple Maps)
- Passes lat/lng coordinates
- External app requires internet (expected behavior)

### Offline Indicator

**States:**
- **Online + Downloaded:** 🟢 Green dot, "Offline ready (65MB)"
- **Online + Not downloaded:** 🟡 Yellow dot, "Download offline maps"
- **Offline + Downloaded:** 🔴 Red dot, "Offline mode (maps available)"
- **Offline + Not downloaded:** 🔴 Red dot + warning, "No offline maps available"

**Visual placement:**
- Small status indicator in MapControls component
- Bottom of existing day selection list
- Clicking opens storage management menu

## Error Handling

### Download Errors

**Network failures:**
- Retry failed tiles up to 3 times with exponential backoff
- Continue download even if some tiles fail
- Show final summary: "X/Y tiles downloaded (Z failed)"
- Provide "Retry failed tiles" button

**Insufficient storage:**
- Check `navigator.storage.estimate()` before download
- If available space < 100MB: Show error modal
- Error message: "Need 65MB, only 32MB available. Free up space."
- User can clear space and retry

**Download interrupted:**
- Save progress to metadata in localStorage
- On next attempt: Check existing tiles, resume from last position
- Show: "Resuming download... 450/1,500 tiles"

**Rate limiting (HTTP 429):**
- Pause download for 5 seconds
- Retry with same exponential backoff logic
- If persistent: Show warning, continue with delay

### Offline Scenarios

**Partial download completed:**
- Some tiles available, some missing
- Available tiles render normally
- Missing tiles show gray placeholder
- Banner: "⚠️ Partial offline maps (1,200/1,500 tiles)"

**No download, goes offline:**
- Warning banner: "⚠️ No offline maps available"
- Map shows whatever browser-cached tiles exist
- Most tiles fail → gray placeholders
- Route polylines don't display (no cached OSRM data)

**Corrupted cache:**
- Detect: Check tile blob format on load
- If corrupt: Log error, clear corrupted entries
- Show warning: "Some offline data corrupted. Re-download recommended."

### Storage Management

**Quota exceeded during download:**
- Stop download gracefully at quota limit
- Show error: "Storage quota exceeded at 1,100/1,500 tiles"
- Partial maps remain usable
- Provide "Clear offline maps" option to free space

**User clears cache:**
- "Clear offline maps" button in storage menu
- Confirmation: "Delete 65MB of offline maps?"
- On confirm: Clear IndexedDB tiles, localStorage routes/metadata
- Update UI to show "Download offline maps" again

**Storage estimation:**
- Use `navigator.storage.estimate()` to show available space
- Display in download confirmation: "Will use 65MB of 2.4GB available"

### Service Worker Issues

**Registration fails:**
- Log error to console
- Fallback to online-only mode
- Show warning: "Offline mode unavailable"
- App continues to work online normally

**Cache read errors:**
- If IndexedDB read fails: Fallback to network request
- Log error for debugging
- User experience: Slightly slower (network fetch), but still works

**Update service worker:**
- Check for new service worker version on load
- If update available: Install new version
- Prompt user: "New app version available. Refresh to update."

## Testing Strategy

### Manual Testing Checklist

**Download flow:**
- [ ] Download completes successfully on WiFi
- [ ] Progress bar updates accurately (verify at 0%, 25%, 50%, 75%, 100%)
- [ ] Can cancel download mid-way
- [ ] Resume download after interruption
- [ ] Storage info displays correct size after download
- [ ] Success message appears and auto-dismisses

**Offline map viewing:**
- [ ] Toggle airplane mode → maps still visible
- [ ] All zoom levels 7-15 load offline
- [ ] Pan to all planned stops → tiles display correctly
- [ ] Pan outside downloaded area → gray placeholders
- [ ] Route polylines display correctly offline
- [ ] Markers and popups work offline
- [ ] Day selection zoom works offline
- [ ] "All Days" view works offline

**Navigate functionality:**
- [ ] Navigate button opens external app when offline
- [ ] Correct coordinates passed to external navigation
- [ ] Works for all stop types (regular stops, overnight locations)

**Online/offline transitions:**
- [ ] Go offline → map continues working seamlessly
- [ ] Go online → can fetch new tiles outside cached area
- [ ] Status indicator updates immediately on transition
- [ ] No console errors on network state change

**Storage management:**
- [ ] "Clear offline maps" removes all cached data
- [ ] Storage goes from 65MB → ~0MB after clear
- [ ] Re-download after clear works correctly
- [ ] Storage info updates accurately

**Error scenarios:**
- [ ] Insufficient storage → shows error before download
- [ ] Network error during download → retries, shows summary
- [ ] Partial download → works with available tiles
- [ ] Browser doesn't support IndexedDB → graceful fallback

### Simulating Offline Mode

**Testing methods:**
1. **Chrome DevTools:** 
   - Application tab → Service Workers → Check "Offline"
   - Network tab → Throttling → "Offline"

2. **Real device testing:**
   - Enable airplane mode on phone/tablet
   - Disable WiFi on desktop
   - Most realistic test

3. **Network conditions:**
   - Throttle to slow 3G during download
   - Test timeout handling

### Browser Compatibility

**Minimum versions:**
- Chrome/Edge: 90+
- Safari iOS: 14+
- Firefox: 90+

**Feature detection:**
```javascript
const hasIndexedDB = 'indexedDB' in window;
const hasServiceWorker = 'serviceWorker' in navigator;
const hasStorage = 'storage' in navigator;

if (!hasIndexedDB || !hasServiceWorker) {
  // Show warning: "Offline maps require a modern browser"
  // Fallback to online-only mode
}
```

**Graceful degradation:**
- Unsupported browsers: Hide download UI, show info message
- App continues working online normally
- No breaking errors

### Performance Metrics

**Target metrics:**
- Download time: < 5 minutes on typical home WiFi (10 Mbps)
- Tile serve time from IndexedDB: < 50ms per tile
- Initial app load time increase: < 500ms (service worker registration)
- Memory usage during download: < 150MB
- Memory usage during normal use: < 100MB

**Monitoring:**
- Log download duration and tile count
- Measure IndexedDB query time
- Check for memory leaks during long sessions
- Verify smooth panning/zooming with cached tiles

### Data Verification

**Post-download checks:**
- IndexedDB tile count matches expected
- All OSRM routes stored in localStorage
- Metadata accurate (bbox, timestamp, storage)
- Visual spot-check: Zoom to each day, verify tiles

**Automated verification:**
```javascript
async function verifyDownload() {
  const metadata = getOfflineMetadata();
  const tileCount = await getTileCount();
  const routes = getAllCachedRoutes();
  
  console.log({
    expectedTiles: metadata.totalTiles,
    actualTiles: tileCount,
    expectedRoutes: metadata.routesDownloaded,
    actualRoutes: routes.length,
    storageUsed: metadata.storageUsedBytes
  });
  
  return tileCount >= metadata.totalTiles * 0.95; // 95% threshold
}
```

## Implementation Phases

### Phase 1 (This Spec) - 12-15 hours

**Deliverables:**
- Service Worker for tile caching
- OfflineManager component with download UI
- IndexedDB tile storage implementation
- OSRM route caching in TripMap
- Offline status indicator
- Basic storage management

**Not included:**
- Calculating new routes offline
- Advanced re-routing
- Voice navigation
- Detailed turn-by-turn UI

### Phase 2 (Future) - 8-12 hours

**Scope:**
- Offline routing algorithm (A* pathfinding)
- Iceland road network graph (pre-processed)
- Calculate routes to arbitrary destinations offline
- Re-routing when off planned path
- Enhanced navigation UI (optional)

**Phase 2 Requirements:**
- Download Iceland road network (~10-15MB additional)
- Implement graph-based routing algorithm
- Handle route calculation failures gracefully

## File Structure

```
iceland-road-trip/
├── public/
│   ├── service-worker.js          # NEW: Tile request interceptor
│   └── sw-register.js              # NEW: Service worker registration
├── src/
│   ├── components/
│   │   ├── OfflineManager.jsx     # NEW: Download & storage UI
│   │   ├── OfflineManager.css     # NEW: Styles
│   │   ├── TripMap.jsx            # MODIFIED: Add route caching
│   │   └── MapControls.jsx        # MODIFIED: Add offline status
│   ├── utils/
│   │   └── offlineUtils.js        # NEW: Tile & storage utilities
│   └── App.jsx                    # MODIFIED: Include OfflineManager
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-07-15-offline-maps-design.md  # This document
└── package.json                   # MODIFIED: Add idb dependency
```

## Dependencies

### New Dependencies

**idb (IndexedDB wrapper):**
```json
{
  "dependencies": {
    "idb": "^8.0.0"
  }
}
```

**Why idb:**
- Promises-based API (easier than raw IndexedDB)
- Lightweight (4KB gzipped)
- Better error handling
- Industry standard

### Existing Dependencies (No Changes)
- react: ^19.2.7
- leaflet: ^1.9.4
- react-leaflet: ^5.0.0

## Security Considerations

**Tile server requests:**
- Use HTTPS for all tile requests (OpenStreetMap provides HTTPS)
- Respect CORS policies
- No authentication required for OSM tiles

**Service Worker:**
- Only serves tiles from trusted domain (tile.openstreetmap.org)
- Doesn't intercept other requests (API calls, assets)
- Properly scoped to avoid conflicts

**Data storage:**
- IndexedDB isolated by origin (GitHub Pages domain)
- No sensitive user data stored
- Trip data already in JSON (public repo)

**Storage quota:**
- Respects browser storage limits
- Graceful handling of quota exceeded
- User can clear cache anytime

## Deployment

**GitHub Pages compatibility:**
- Service Worker requires HTTPS ✓ (GitHub Pages uses HTTPS)
- IndexedDB available in all modern browsers ✓
- No server-side code needed ✓

**Build process:**
- Copy service-worker.js to dist/ during build
- Register service worker in index.html or App.jsx
- No additional build steps required

**Deployment checklist:**
- [ ] Build app: `npm run build`
- [ ] Verify service-worker.js in dist/
- [ ] Deploy to GitHub Pages: `npm run deploy`
- [ ] Test on actual device with airplane mode
- [ ] Verify storage persists across sessions

## Success Metrics

**Technical metrics:**
- Download completion rate: > 95%
- Average download time: < 5 minutes
- Offline tile load success: > 98%
- Service Worker registration success: > 99%

**User experience metrics:**
- Storage usage: < 80MB
- App remains responsive during download
- No visible lag when switching online/offline
- Clear feedback at each step

**Reliability metrics:**
- Download resume success rate: > 90%
- Cache hit rate when offline: > 98%
- Zero crashes due to offline features

## Future Enhancements (Beyond Phase 2)

**Potential additions:**
- Selective zoom level download (user chooses 7-12 vs 7-15)
- Incremental updates (only download changed tiles)
- Multiple trip support (download different route sets)
- Background sync (update tiles when online)
- Compression (WebP tiles if browser supports)
- Offline search (geocoding cached POIs)

## Appendix

### Tile Calculation Example

For Iceland Ring Road bounding box:
- North: 66.5°N
- South: 63.4°N  
- East: -13.5°W
- West: -24.5°W

At zoom level 10:
```javascript
const bbox = { north: 66.5, south: 63.4, east: -13.5, west: -24.5 };
const zoom = 10;

// Convert lat/lng to tile coordinates
const nwTile = latLngToTile(bbox.north, bbox.west, zoom);
// Result: { x: 480, y: 240 }

const seTile = latLngToTile(bbox.south, bbox.east, zoom);
// Result: { x: 495, y: 255 }

// Tile range
const tilesX = seTile.x - nwTile.x + 1; // 16 tiles
const tilesY = seTile.y - nwTile.y + 1; // 16 tiles
const totalTiles = tilesX * tilesY;     // 256 tiles at zoom 10
```

### Storage Quota API

```javascript
async function checkStorage() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const { usage, quota } = await navigator.storage.estimate();
    console.log(`Using ${usage} of ${quota} bytes`);
    return { usage, quota, available: quota - usage };
  }
  return null;
}
```

### IndexedDB Schema

```javascript
const DB_NAME = 'iceland-trip-tiles';
const DB_VERSION = 1;
const STORE_NAME = 'tiles';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
```

## References

- [OpenStreetMap Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Storage API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
- [OSRM API Documentation](http://project-osrm.org/docs/v5.24.0/api/)
- [Leaflet Documentation](https://leafletjs.com/reference.html)

---

**Document Status:** Ready for implementation planning  
**Next Step:** Create implementation plan using writing-plans skill
