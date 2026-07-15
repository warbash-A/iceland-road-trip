import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateBoundingBox,
  latLngToTile,
  bboxToTileRange,
  generateTileList,
  tileToUrl,
  calculateAllTiles,
  openTileDB,
  saveTile,
  getTile,
  clearAllTiles,
  getTileCount,
  cacheRoute,
  getCachedRoute,
  getAllCachedRoutes,
  clearAllRoutes,
  getStorageInfo,
  estimateDownloadSize,
  checkStorageAvailable,
  getOfflineMetadata,
  setOfflineMetadata,
  isOfflineDataAvailable
} from './offlineUtils';

describe('calculateBoundingBox', () => {
  it('should calculate bounding box with buffer', () => {
    const stops = [
      { lat: 64.0, lng: -20.0 },
      { lat: 65.0, lng: -18.0 }
    ];
    const bbox = calculateBoundingBox(stops, 20);

    // 20km ≈ 0.18° at this latitude
    expect(bbox.north).toBeGreaterThan(65.0);
    expect(bbox.south).toBeLessThan(64.0);
    expect(bbox.east).toBeGreaterThan(-18.0);
    expect(bbox.west).toBeLessThan(-20.0);
  });
});

describe('latLngToTile', () => {
  it('should convert lat/lng to tile coordinates', () => {
    const tile = latLngToTile(64.1466, -21.9426, 10); // Reykjavik
    expect(tile.x).toBe(449);
    expect(tile.y).toBe(272);
  });
});

describe('bboxToTileRange', () => {
  it('should convert bbox to tile range', () => {
    const bbox = { north: 65.0, south: 64.0, east: -18.0, west: -20.0 };
    const range = bboxToTileRange(bbox, 10);

    expect(range.minX).toBeLessThan(range.maxX);
    expect(range.minY).toBeLessThan(range.maxY);
    expect(range.maxX - range.minX).toBeGreaterThan(0);
  });
});

describe('generateTileList', () => {
  it('should generate tile list from range', () => {
    const range = { minX: 488, maxX: 490, minY: 335, maxY: 337 };
    const tiles = generateTileList(range, 10);

    expect(tiles.length).toBe(9); // 3x3 grid
    expect(tiles[0]).toEqual({ z: 10, x: 488, y: 335 });
  });
});

describe('tileToUrl', () => {
  it('should generate OSM tile URL', () => {
    const url = tileToUrl(10, 488, 335);
    expect(url).toBe('https://b.tile.openstreetmap.org/10/488/335.png');
  });
});

describe('calculateAllTiles', () => {
  it('should calculate all tiles for multiple zoom levels', () => {
    const stops = [
      { lat: 64.0, lng: -20.0 },
      { lat: 64.1, lng: -19.9 }
    ];
    const tiles = calculateAllTiles(stops, 20, [10, 11]);

    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles[0]).toHaveProperty('z');
    expect(tiles[0]).toHaveProperty('x');
    expect(tiles[0]).toHaveProperty('y');
  });
});

describe('openTileDB', () => {
  it('should open IndexedDB database', async () => {
    const db = await openTileDB();
    expect(db.name).toBe('iceland-trip-tiles');
    expect(db.objectStoreNames.contains('tiles')).toBe(true);
    db.close();
  });
});

describe('saveTile and getTile', () => {
  it('should save and retrieve tile', async () => {
    const blob = new Uint8Array([137, 80, 78, 71]); // PNG header
    await saveTile(10, 488, 335, blob);

    const tile = await getTile(10, 488, 335);
    expect(tile).not.toBeNull();
    expect(Array.from(tile.blob)).toEqual(Array.from(blob));
    expect(tile.timestamp).toBeGreaterThan(0);
    expect(tile.url).toContain('10/488/335');
  });

  it('should return null for non-existent tile', async () => {
    const tile = await getTile(99, 999, 999);
    expect(tile).toBeNull();
  });
});

describe('clearAllTiles', () => {
  it('should clear all tiles from database', async () => {
    await saveTile(10, 488, 335, new Uint8Array([1, 2, 3]));
    await saveTile(10, 489, 335, new Uint8Array([4, 5, 6]));

    let count = await getTileCount();
    expect(count).toBeGreaterThan(0);

    await clearAllTiles();

    count = await getTileCount();
    expect(count).toBe(0);
  });
});

describe('getTileCount', () => {
  it('should return tile count', async () => {
    await clearAllTiles();
    await saveTile(10, 488, 335, new Uint8Array([1]));

    const count = await getTileCount();
    expect(count).toBe(1);
  });
});

describe('cacheRoute and getCachedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should cache and retrieve route', () => {
    const osrmResponse = {
      routes: [{
        geometry: { coordinates: [[1, 2], [3, 4]] },
        distance: 1000,
        duration: 60
      }],
      code: 'Ok'
    };

    cacheRoute(1, 0, 1, osrmResponse);

    const cached = getCachedRoute(1, 0, 1);
    expect(cached).not.toBeNull();
    expect(cached.routes[0].distance).toBe(1000);
    expect(cached.cachedAt).toBeGreaterThan(0);
  });

  it('should return null for non-existent route', () => {
    const cached = getCachedRoute(99, 99, 99);
    expect(cached).toBeNull();
  });
});

describe('getAllCachedRoutes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return all cached routes', () => {
    const osrm1 = { routes: [{ distance: 1000 }], code: 'Ok' };
    const osrm2 = { routes: [{ distance: 2000 }], code: 'Ok' };

    cacheRoute(1, 0, 1, osrm1);
    cacheRoute(1, 1, 2, osrm2);

    const routes = getAllCachedRoutes();
    expect(routes.length).toBe(2);
  });
});

describe('clearAllRoutes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should clear all cached routes', () => {
    cacheRoute(1, 0, 1, { routes: [], code: 'Ok' });
    cacheRoute(1, 1, 2, { routes: [], code: 'Ok' });

    let routes = getAllCachedRoutes();
    expect(routes.length).toBe(2);

    clearAllRoutes();

    routes = getAllCachedRoutes();
    expect(routes.length).toBe(0);
  });
});

describe('getStorageInfo', () => {
  it('should return storage info', async () => {
    const info = await getStorageInfo();
    if (info) {
      expect(info).toHaveProperty('usage');
      expect(info).toHaveProperty('quota');
      expect(info).toHaveProperty('available');
      expect(info.available).toBeGreaterThanOrEqual(0);
    } else {
      // Browser doesn't support storage API
      expect(info).toBeNull();
    }
  });
});

describe('estimateDownloadSize', () => {
  it('should estimate download size', () => {
    const size = estimateDownloadSize(1000);
    expect(size).toBe(45000000); // 1000 * 45KB = 45MB
  });
});

describe('checkStorageAvailable', () => {
  it('should check if storage is available', async () => {
    const available = await checkStorageAvailable(1000000); // 1MB
    expect(typeof available).toBe('boolean');
  });
});

describe('getOfflineMetadata and setOfflineMetadata', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should set and get offline metadata', () => {
    const metadata = {
      version: '1.0',
      downloadedAt: Date.now(),
      totalTiles: 1500,
      storageUsedBytes: 67000000,
      boundingBox: { north: 66.5, south: 63.4, east: -13.5, west: -24.5 },
      zoomLevels: [7, 8, 9, 10, 11, 12, 13, 14, 15],
      routesDownloaded: 45
    };

    setOfflineMetadata(metadata);

    const retrieved = getOfflineMetadata();
    expect(retrieved).toEqual(metadata);
  });

  it('should return null if no metadata exists', () => {
    const metadata = getOfflineMetadata();
    expect(metadata).toBeNull();
  });
});

describe('isOfflineDataAvailable', () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearAllTiles();
  });

  it('should return false when no data', async () => {
    const available = await isOfflineDataAvailable();
    expect(available).toBe(false);
  });

  it('should return true when data exists', async () => {
    await saveTile(10, 488, 335, new Uint8Array([1]));
    cacheRoute(1, 0, 1, { routes: [], code: 'Ok' });
    setOfflineMetadata({ version: '1.0', totalTiles: 1 });

    const available = await isOfflineDataAvailable();
    expect(available).toBe(true);
  });
});
