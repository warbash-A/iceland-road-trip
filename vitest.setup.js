import 'fake-indexeddb/auto';

// Create a proper localStorage mock that works with jsdom
class StorageMock {
  constructor() {
    this.data = {};
  }

  getItem(key) {
    return this.data[key] || null;
  }

  setItem(key, value) {
    this.data[key] = String(value);
  }

  removeItem(key) {
    delete this.data[key];
  }

  clear() {
    this.data = {};
  }

  key(index) {
    const keys = Object.keys(this.data);
    return keys[index] || null;
  }

  get length() {
    return Object.keys(this.data).length;
  }
}

// Override global.localStorage
Object.defineProperty(global, 'localStorage', {
  value: new StorageMock(),
  writable: true,
  configurable: true
});

// Also set on globalThis if it exists (for jsdom)
if (typeof globalThis !== 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new StorageMock(),
    writable: true,
    configurable: true
  });
}
