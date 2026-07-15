# Offline Maps User Guide

## Overview

The Iceland Road Trip app now supports offline map viewing, allowing you to navigate without an internet connection during your trip.

## Before Your Trip

### Download Offline Maps

1. **Connect to WiFi** - The download is approximately 65MB
2. **Open the app** in your browser
3. **Click "Download offline maps"** in the map controls panel
4. **Confirm the download** when prompted
5. **Wait 3-5 minutes** for the download to complete
6. **Look for "✓ Offline Maps Ready!"** message

### What Gets Downloaded

- Map tiles for zoom levels 7-15
- 20km buffer around all planned stops
- Routes between all stops in your itinerary
- Approximately 1,500 map tiles (~65MB total)

## During Your Trip

### Using Maps Offline

1. **No internet required** - Maps work completely offline
2. **Pan and zoom** - All cached tiles display instantly
3. **View routes** - Pre-downloaded routes display as polylines
4. **Navigate** - Click any stop's "Navigate" button to open external navigation

### What Works Offline

- ✅ View map with all zoom levels
- ✅ See your current location (GPS works without internet)
- ✅ View all stops and markers
- ✅ View route polylines
- ✅ Click markers for details
- ✅ Switch between days

### What Requires Internet

- ❌ Calculating new routes to unplanned destinations
- ❌ Turn-by-turn navigation (use external app like Google Maps)
- ❌ Updating to new trip data

## Managing Storage

### Clear Offline Maps

If you need to free up storage space:

1. Click the **"Offline ready"** button
2. Confirm deletion
3. 65MB will be freed from your browser storage

You can re-download anytime by clicking "Download offline maps" again.

### Storage Requirements

- **Minimum:** 100MB free space
- **Used:** ~65MB for maps
- **Location:** Browser storage (IndexedDB + localStorage)

## Troubleshooting

### Download Failed

- **Check WiFi connection** - Ensure stable internet
- **Check storage space** - Need 100MB+ free
- **Try again** - Click download button again to resume

### Maps Not Displaying Offline

- **Verify download completed** - Look for "Offline ready" status
- **Check airplane mode** - Ensure device is truly offline for testing
- **Clear and re-download** - If corrupted, clear and download again

### Gray Placeholder Tiles

- These appear for tiles that failed to download
- Usually at edges of coverage area
- Re-download to fill in gaps

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Safari iOS 14+
- ✅ Firefox 90+

Older browsers may not support offline functionality.

## Technical Details

- **Storage:** IndexedDB (tiles) + localStorage (routes)
- **Service Worker:** Intercepts tile requests
- **Tile Server:** OpenStreetMap
- **Route Data:** OSRM (Open Source Routing Machine)

## Privacy

- All data stored **locally** in your browser
- No data sent to external servers (except tile/route downloads)
- Clear cache to remove all stored data

## Support

For issues or questions:
- GitHub Issues: [repository URL]
- Email: [support email]
