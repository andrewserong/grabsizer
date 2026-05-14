import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const resizeImageMock = vi.fn();
vi.mock('@/lib/resize', () => ({
	resizeImage: (...args: unknown[]) => resizeImageMock(...args),
}));

import App from '../App';
import { ThemeProvider } from '@/components/theme-provider';

const renderApp = () =>
	render(
		<ThemeProvider>
			<App />
		</ThemeProvider>
	);

const uploadFile = async (file: File) => {
	const input = document.querySelector(
		'input[type="file"]'
	) as HTMLInputElement;
	const user = userEvent.setup();
	await user.upload(input, file);
};

const makePngFile = (name = 'screenshot.png') =>
	new File(['png-data'], name, { type: 'image/png' });

beforeEach(() => {
	resizeImageMock.mockReset();
	// Default: echo back a resized blob whose type matches the source file.
	resizeImageMock.mockImplementation(
		async (file: File, { maxWidth }: { maxWidth: number }) => ({
			blob: new Blob(['resized'], { type: file.type }),
			width: maxWidth,
			height: Math.round((maxWidth * 3) / 4),
		})
	);
});

describe('App', () => {
	it('renders the dropzone empty state and no preview initially', () => {
		renderApp();
		expect(screen.getByText(/drop an image here/i)).toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: /\.jpg/i })
		).not.toBeInTheDocument();
	});

	it('shows the preview and all format buttons after uploading a file', async () => {
		renderApp();
		await uploadFile(makePngFile());

		const preview = await screen.findByAltText('Image preview');
		expect(preview).toBeInTheDocument();

		// All three download buttons appear, eventually enabled with sizes.
		const jpg = await screen.findByRole('button', { name: /\.jpg/i });
		const webp = await screen.findByRole('button', { name: /\.webp/i });
		const png = await screen.findByRole('button', { name: /^\.png/i });
		const copy = await screen.findByRole('button', { name: /copy \.png/i });

		await waitFor(() => expect(jpg).toBeEnabled());
		await waitFor(() => expect(webp).toBeEnabled());
		await waitFor(() => expect(png).toBeEnabled());
		await waitFor(() => expect(copy).toBeEnabled());

		// The default preset is 1200px (Medium), so dimensions render under preview.
		expect(
			screen.getByText(/screenshot\.png.*1200 × 900px/)
		).toBeInTheDocument();
	});

	it('downloads each format with the correct file extension', async () => {
		const clickSpy = vi
			.spyOn(HTMLAnchorElement.prototype, 'click')
			.mockImplementation(function (this: HTMLAnchorElement) {
				// Capture the element by stashing it for assertions
				clickSpy.mock.contexts.push(this);
			});
		// mock.contexts isn't a standard array we can push to safely — track manually
		const clicked: HTMLAnchorElement[] = [];
		clickSpy.mockImplementation(function (this: HTMLAnchorElement) {
			clicked.push(this);
		});

		renderApp();
		await uploadFile(makePngFile('shot.png'));

		const user = userEvent.setup();

		const jpg = await screen.findByRole('button', { name: /\.jpg/i });
		await waitFor(() => expect(jpg).toBeEnabled());
		await user.click(jpg);
		expect(clicked.at(-1)?.download).toBe('shot.jpg');

		const webp = await screen.findByRole('button', { name: /\.webp/i });
		await user.click(webp);
		expect(clicked.at(-1)?.download).toBe('shot.webp');

		const png = await screen.findByRole('button', { name: /^\.png/i });
		await user.click(png);
		expect(clicked.at(-1)?.download).toBe('shot.png');
	});

	it('writes a PNG to the clipboard when copy is clicked', async () => {
		const writeMock = vi.fn(async () => {});
		(navigator.clipboard as unknown as { write: typeof writeMock }).write =
			writeMock;

		renderApp();
		await uploadFile(makePngFile());

		const copy = await screen.findByRole('button', { name: /copy \.png/i });
		await waitFor(() => expect(copy).toBeEnabled());

		const user = userEvent.setup();
		await user.click(copy);

		await waitFor(() => expect(writeMock).toHaveBeenCalledTimes(1));
		const items = writeMock.mock.calls[0]![0] as Array<{
			items: Record<string, Blob>;
		}>;
		expect(items[0]!.items['image/png']).toBeInstanceOf(Blob);

		expect(
			await screen.findByText(/copied!/i, undefined, { timeout: 1000 })
		).toBeInTheDocument();
	});

	it('clears the preview when the file is removed', async () => {
		renderApp();
		await uploadFile(makePngFile());
		await screen.findByAltText('Image preview');

		const user = userEvent.setup();
		const removeBtn = screen.getByRole('button', {
			name: /remove screenshot\.png/i,
		});
		await user.click(removeBtn);

		await waitFor(() =>
			expect(
				screen.queryByAltText('Image preview')
			).not.toBeInTheDocument()
		);
		expect(
			screen.queryByRole('button', { name: /\.jpg/i })
		).not.toBeInTheDocument();
	});

	it('re-resizes with the new maxWidth when a size preset is chosen', async () => {
		renderApp();
		await uploadFile(makePngFile());
		await screen.findByAltText('Image preview');

		// Initial call uses the default 1200.
		expect(resizeImageMock).toHaveBeenLastCalledWith(
			expect.any(File),
			expect.objectContaining({ maxWidth: 1200 })
		);

		const user = userEvent.setup();
		await user.click(screen.getByRole('button', { name: /settings/i }));

		const dialog = await screen.findByRole('dialog');
		const large = within(dialog).getByRole('button', { name: /large/i });
		await user.click(large);

		await waitFor(() =>
			expect(resizeImageMock).toHaveBeenLastCalledWith(
				expect.any(File),
				expect.objectContaining({ maxWidth: 1600 })
			)
		);
	});
});
