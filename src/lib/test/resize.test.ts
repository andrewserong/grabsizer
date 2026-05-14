import { describe, it, expect, vi, beforeEach } from 'vitest';

const { resizeMock, toBlobMock } = vi.hoisted(() => ({
	resizeMock: vi.fn(async () => {}),
	toBlobMock: vi.fn(
		async (_canvas: HTMLCanvasElement, type: string) =>
			new Blob(['x'], { type })
	),
}));

vi.mock('pica', () => ({
	default: function Pica() {
		return { resize: resizeMock, toBlob: toBlobMock };
	},
}));

import { resizeImage } from '../resize';

const makeFile = (name = 'shot.png', type = 'image/png') =>
	new File(['data'], name, { type });

const stubBitmap = (width: number, height: number) => {
	vi.stubGlobal(
		'createImageBitmap',
		vi.fn(async () => ({ width, height, close: () => {} }))
	);
};

describe('resizeImage', () => {
	beforeEach(() => {
		resizeMock.mockClear();
		toBlobMock.mockClear();
	});

	it('downscales to maxWidth and preserves aspect ratio', async () => {
		stubBitmap(4000, 3000);
		const result = await resizeImage(makeFile(), { maxWidth: 1200 });
		expect(result.width).toBe(1200);
		expect(result.height).toBe(900);
		expect(resizeMock).toHaveBeenCalledTimes(1);
		const dest = resizeMock.mock.calls[0]![1] as HTMLCanvasElement;
		expect(dest.width).toBe(1200);
		expect(dest.height).toBe(900);
	});

	it('never upscales — returns original blob when source is already smaller than maxWidth', async () => {
		stubBitmap(600, 400);
		const file = makeFile();
		const result = await resizeImage(file, { maxWidth: 1200 });
		expect(result.width).toBe(600);
		expect(result.height).toBe(400);
		expect(result.blob).toBe(file);
		expect(resizeMock).not.toHaveBeenCalled();
	});

	it('uses targetWidth when provided and derives height', async () => {
		stubBitmap(2000, 1000);
		const result = await resizeImage(makeFile(), { targetWidth: 500 });
		expect(result.width).toBe(500);
		expect(result.height).toBe(250);
	});

	it('uses targetHeight when provided and derives width', async () => {
		stubBitmap(2000, 1000);
		const result = await resizeImage(makeFile(), { targetHeight: 200 });
		expect(result.height).toBe(200);
		expect(result.width).toBe(400);
	});

	it('preserves the source mime type in the output blob', async () => {
		stubBitmap(4000, 3000);
		const result = await resizeImage(makeFile('shot.jpg', 'image/jpeg'), {
			maxWidth: 1200,
		});
		expect(result.blob.type).toBe('image/jpeg');
	});

	it('defaults to a 1400px max width when no options are passed', async () => {
		stubBitmap(2800, 1400);
		const result = await resizeImage(makeFile());
		expect(result.width).toBe(1400);
		expect(result.height).toBe(700);
	});
});
