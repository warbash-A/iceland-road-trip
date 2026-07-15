/**
 * Calculate bounding box around stops with buffer
 * @param {Array} stops - Array of {lat, lng} objects
 * @param {number} bufferKm - Buffer distance in kilometers
 * @returns {object} Bounding box {north, south, east, west}
 */
export function calculateBoundingBox(stops, bufferKm) {
  if (!stops || stops.length === 0) {
    throw new Error('No stops provided');
  }

  // Find min/max coordinates
  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;

  stops.forEach(stop => {
    if (stop.lat > north) north = stop.lat;
    if (stop.lat < south) south = stop.lat;
    if (stop.lng > east) east = stop.lng;
    if (stop.lng < west) west = stop.lng;
  });

  // Add buffer (approximate: 1° ≈ 111km at equator, ~110km at Iceland's latitude)
  const bufferDeg = bufferKm / 110;

  return {
    north: north + bufferDeg,
    south: south - bufferDeg,
    east: east + bufferDeg,
    west: west - bufferDeg
  };
}

/**
 * Convert lat/lng to tile coordinates for given zoom level
 * Standard Web Mercator projection (EPSG:3857)
 */
export function latLngToTile(lat, lng, zoom) {
  const n = 2 ** zoom;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

/**
 * Convert bounding box to tile range for given zoom level
 */
export function bboxToTileRange(bbox, zoom) {
  const nw = latLngToTile(bbox.north, bbox.west, zoom);
  const se = latLngToTile(bbox.south, bbox.east, zoom);

  return {
    minX: Math.min(nw.x, se.x),
    maxX: Math.max(nw.x, se.x),
    minY: Math.min(nw.y, se.y),
    maxY: Math.max(nw.y, se.y)
  };
}

/**
 * Generate list of all tiles in given range
 */
export function generateTileList(tileRange, zoom) {
  const tiles = [];
  for (let x = tileRange.minX; x <= tileRange.maxX; x++) {
    for (let y = tileRange.minY; y <= tileRange.maxY; y++) {
      tiles.push({ z: zoom, x, y });
    }
  }
  return tiles;
}

/**
 * Convert tile coordinates to OSM URL
 * Uses round-robin subdomains a, b, c
 */
export function tileToUrl(z, x, y) {
  const subdomains = ['a', 'b', 'c'];
  const subdomain = subdomains[(x + y) % 3];
  return `https://${subdomain}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

/**
 * Calculate all tiles needed for given stops and zoom levels
 */
export function calculateAllTiles(stops, bufferKm, zoomLevels) {
  const bbox = calculateBoundingBox(stops, bufferKm);
  const allTiles = [];

  for (const zoom of zoomLevels) {
    const tileRange = bboxToTileRange(bbox, zoom);
    const tiles = generateTileList(tileRange, zoom);
    allTiles.push(...tiles);
  }

  return allTiles;
}
