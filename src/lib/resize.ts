import Pica from 'pica';

const pica = new Pica();

type ResizeOptions = {
	targetWidth?: number;
	targetHeight?: number;
	maxWidth?: number;
};

export type ResizeResult = {
	blob: Blob;
	width: number;
	height: number;
};

export async function resizeImage(
	file: File,
	options: ResizeOptions = {}
): Promise<ResizeResult> {
	const { targetWidth, targetHeight, maxWidth = 1400 } = options;

	const bitmap = await createImageBitmap(file);
	const origWidth = bitmap.width;
	const origHeight = bitmap.height;

	let newWidth: number;
	let newHeight: number;

	if (targetWidth !== undefined) {
		newWidth = targetWidth;
		newHeight = Math.round(origHeight * (targetWidth / origWidth));
	} else if (targetHeight !== undefined) {
		newHeight = targetHeight;
		newWidth = Math.round(origWidth * (targetHeight / origHeight));
	} else {
		// Default: cap at maxWidth, never upscale
		if (origWidth <= maxWidth) {
			bitmap.close();
			return { blob: file, width: origWidth, height: origHeight };
		}
		newWidth = maxWidth;
		newHeight = Math.round(origHeight * (maxWidth / origWidth));
	}

	// Draw the source bitmap onto an offscreen canvas so pica can read it
	const source = document.createElement('canvas');
	source.width = origWidth;
	source.height = origHeight;
	const sourceCtx = source.getContext('2d');
	if (!sourceCtx) throw new Error('Could not get 2d canvas context');
	sourceCtx.drawImage(bitmap, 0, 0);
	bitmap.close();

	const dest = document.createElement('canvas');
	dest.width = newWidth;
	dest.height = newHeight;

	await pica.resize(source, dest);

	const blob = await pica.toBlob(dest, file.type, 0.92);
	return { blob, width: newWidth, height: newHeight };
}
