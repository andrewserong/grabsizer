import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

// jsdom doesn't implement these browser APIs that the app relies on.
// Tests can override per-test via vi.spyOn / vi.stubGlobal.

if (!URL.createObjectURL) {
	URL.createObjectURL = vi.fn(() => `blob:mock-${Math.random()}`);
}
if (!URL.revokeObjectURL) {
	URL.revokeObjectURL = vi.fn();
}

// createImageBitmap: return a minimal stub. Default size 4000x3000 simulates a
// typical screengrab that needs resizing; tests can override via vi.stubGlobal.
if (typeof globalThis.createImageBitmap === 'undefined') {
	globalThis.createImageBitmap = vi.fn(async () => ({
		width: 4000,
		height: 3000,
		close: () => {},
	})) as unknown as typeof createImageBitmap;
}

// HTMLCanvasElement.toBlob: jsdom's default returns null. Synthesise a tiny
// Blob whose type matches the requested mimeType so format-conversion code
// paths are exercised.
HTMLCanvasElement.prototype.toBlob = function (callback, type = 'image/png') {
	queueMicrotask(() => callback(new Blob(['x'], { type })));
};

// getContext stub — App.tsx calls drawImage on it; we just need a no-op.
HTMLCanvasElement.prototype.getContext = vi.fn(
	() =>
		({
			drawImage: vi.fn(),
		}) as unknown as CanvasRenderingContext2D
) as unknown as HTMLCanvasElement['getContext'];

// matchMedia: theme-provider reads system colour scheme on mount.
if (!window.matchMedia) {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}

// Clipboard API used by the copy button. Make it writable so individual tests
// can swap in their own write spy.
if (!navigator.clipboard) {
	Object.defineProperty(navigator, 'clipboard', {
		value: { write: vi.fn(async () => {}) },
		configurable: true,
		writable: true,
	});
}
if (typeof globalThis.ClipboardItem === 'undefined') {
	globalThis.ClipboardItem = class {
		items: Record<string, Blob>;
		constructor(items: Record<string, Blob>) {
			this.items = items;
		}
	} as unknown as typeof ClipboardItem;
}
