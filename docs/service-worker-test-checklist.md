# Service Worker Manual Test Checklist

## Prerequisites
- Build app: `npm run build`
- Serve locally with HTTPS: `npx serve -s dist -l 3000`
- Open DevTools → Application → Service Workers

## Tests

### Registration
- [ ] Service worker appears in DevTools
- [ ] Status shows "activated"
- [ ] No errors in Console

### Tile Interception
- [ ] Open Network tab, filter by "PNG"
- [ ] Load map, verify tile requests
- [ ] Check Service Worker logs for intercept messages

### Offline Behavior
- [ ] Check "Offline" in DevTools Application → Service Workers
- [ ] Reload page
- [ ] Map should still load if tiles are cached
- [ ] Gray placeholders for missing tiles

### Cleanup
- [ ] Unregister in DevTools
- [ ] Clear storage
- [ ] Verify service worker removed
