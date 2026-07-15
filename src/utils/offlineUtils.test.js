import { describe, it, expect } from 'vitest';
import {
  calculateBoundingBox,
  latLngToTile,
  bboxToTileRange,
  generateTileList,
  tileToUrl,
  calculateAllTiles
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
