import { describe, it, expect } from 'vitest';
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
  getTileCount
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
