import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Dropzone,
	DropzoneContent,
	DropzoneEmptyState,
} from '@/components/dropzone';
import { formatBytes } from '@/lib/format';
import { ImagePreview } from '@/components/image-preview';
import { resizeImage } from '@/lib/resize';
import { Input } from '@/components/ui/input';
import { SunMoon, Cog, Download, Copy, CircleHelp } from 'lucide-react';
import { useTheme } from './components/theme-provider';

type Output = {
	url: string;
	blob: Blob;
	fileName: string;
	width: number;
	height: number;
};

const SIZE_PRESETS = [
	{ label: 'Small', width: 800 },
	{ label: 'Medium', width: 1200 },
	{ label: 'Large', width: 1600 },
] as const;

const DEFAULT_MAX_WIDTH = 1200;

export function App() {
	const { theme, setTheme } = useTheme();
	const [originalFile, setOriginalFile] = useState<File | null>(null);
	const [maxWidth, setMaxWidth] = useState(DEFAULT_MAX_WIDTH);
	const [quality, setQuality] = useState(82);
	const [output, setOutput] = useState<Output | null>(null);
	const [pngBlob, setPngBlob] = useState<Blob | null>(null);
	const [jpgBlob, setJpgBlob] = useState<Blob | null>(null);
	const [webpBlob, setWebpBlob] = useState<Blob | null>(null);
	const [copied, setCopied] = useState(false);
	const prevUrlRef = useRef<string | null>(null);
	const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleFilesChange = useCallback((files: File[]) => {
		const file = files[0];
		if (!file) {
			return;
		}
		setOriginalFile(file);
	}, []);

	// Re-run resize when the file or max width changes
	useEffect(() => {
		if (!originalFile) {
			return;
		}
		let cancelled = false;
		resizeImage(originalFile, { maxWidth }).then((result) => {
			if (cancelled) {
				return;
			}
			const url = URL.createObjectURL(result.blob);
			if (prevUrlRef.current) {
				URL.revokeObjectURL(prevUrlRef.current);
			}
			prevUrlRef.current = url;
			setOutput({
				url,
				blob: result.blob,
				fileName: originalFile.name,
				width: result.width,
				height: result.height,
			});
		});
		return () => {
			cancelled = true;
		};
	}, [originalFile, maxWidth]);

	// Compute all format blobs whenever the resized output or quality changes.
	// PNG is lossless so we short-circuit it when the source is already PNG;
	// JPG and WebP always go through canvas so the quality setting is applied.
	useEffect(() => {
		if (!output) {
			return;
		}

		let cancelled = false;
		createImageBitmap(output.blob).then((bitmap) => {
			if (cancelled) {
				bitmap.close();
				return;
			}
			const canvas = document.createElement('canvas');
			canvas.width = bitmap.width;
			canvas.height = bitmap.height;
			canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
			bitmap.close();
			if (output.blob.type === 'image/png') {
				setPngBlob(output.blob);
			} else {
				canvas.toBlob((b) => {
					if (!cancelled && b) {
						setPngBlob(b);
					}
				}, 'image/png');
			}
			canvas.toBlob(
				(b) => {
					if (!cancelled && b) {
						setJpgBlob(b);
					}
				},
				'image/jpeg',
				quality / 100
			);
			canvas.toBlob(
				(b) => {
					if (!cancelled && b) {
						setWebpBlob(b);
					}
				},
				'image/webp',
				quality / 100
			);
		});
		return () => {
			cancelled = true;
		};
	}, [output, quality]);

	const handleClear = useCallback(() => {
		if (prevUrlRef.current) {
			URL.revokeObjectURL(prevUrlRef.current);
			prevUrlRef.current = null;
		}
		setOriginalFile(null);
		setOutput(null);
		setPngBlob(null);
		setJpgBlob(null);
		setWebpBlob(null);
		setCopied(false);
		if (copiedTimerRef.current) {
			clearTimeout(copiedTimerRef.current);
		}
	}, []);

	const makeDownloadHandler = useCallback(
		(blob: Blob | null, ext: string) => () => {
			if (!blob || !output) {
				return;
			}
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = output.fileName.replace(/\.[^.]+$/, `.${ext}`);
			a.click();
			URL.revokeObjectURL(url);
		},
		[output]
	);

	const handleCopy = useCallback(async () => {
		if (!pngBlob) {
			return;
		}
		try {
			await navigator.clipboard.write([
				new ClipboardItem({ 'image/png': pngBlob }),
			]);
			setCopied(true);
			if (copiedTimerRef.current) {
				clearTimeout(copiedTimerRef.current);
			}
			copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
		} catch (e) {
			console.error('Copy failed:', e);
		}
	}, [pngBlob]);

	useEffect(() => {
		return () => {
			if (prevUrlRef.current) {
				URL.revokeObjectURL(prevUrlRef.current);
			}
			if (copiedTimerRef.current) {
				clearTimeout(copiedTimerRef.current);
			}
		};
	}, []);

	return (
		<div className="flex min-h-svh flex-col">
			<header className="sticky top-0 z-50 w-full bg-background">
				<div className="m-auto flex max-w-3xl items-center justify-between p-2">
					<div className="flex flex-col gap-0 p-2">
						<h1 className="text-lg font-bold">Grabsizer</h1>
						<span className="text-xs text-muted-foreground">
							A <s className="italic">not very useful</s>{' '}
							<span className="font-bold">simple</span> image
							resizer
						</span>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="icon"
							className="rounded-full"
							aria-label="Toggle theme"
							onClick={() =>
								setTheme(theme === 'dark' ? 'light' : 'dark')
							}
						>
							<SunMoon />
						</Button>
						<Dialog>
							<DialogTrigger
								render={
									<Button
										variant="outline"
										size="icon"
										className="rounded-full"
										aria-label="Settings"
									>
										<Cog />
									</Button>
								}
							></DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>
										Grabsizer settings
									</DialogTitle>
									<DialogDescription>
										Configure output size and compression
										quality.
									</DialogDescription>
								</DialogHeader>
								<div className="flex flex-col gap-4 pt-2">
									<div className="flex flex-col gap-2">
										<p className="text-sm font-medium">
											Output size
										</p>
										<div className="flex gap-2">
											{SIZE_PRESETS.map((preset) => (
												<Button
													key={preset.width}
													variant={
														maxWidth ===
														preset.width
															? 'default'
															: 'outline'
													}
													size="sm"
													onClick={() =>
														setMaxWidth(
															preset.width
														)
													}
												>
													{preset.label}
													<span className="text-xs opacity-60">
														{preset.width}px
													</span>
												</Button>
											))}
										</div>
									</div>
									<div className="flex flex-col gap-2">
										<p className="text-sm font-medium">
											Quality
										</p>
										<div className="flex items-center gap-2">
											<Input
												type="number"
												min={1}
												max={100}
												defaultValue={quality}
												onBlur={(e) =>
													setQuality(
														Math.min(
															100,
															Math.max(
																1,
																Number(
																	e.target
																		.value
																) || quality
															)
														)
													)
												}
												onKeyDown={(e) =>
													e.key === 'Enter' &&
													e.currentTarget.blur()
												}
												className="w-20"
											/>
											<span className="text-sm text-muted-foreground">
												% — applies to JPG and WebP
											</span>
										</div>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				</div>
			</header>
			<main className="w-full grow">
				<div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
					<div className="mx-auto w-full max-w-sm">
						<Dropzone
							onChange={handleFilesChange}
							onClear={handleClear}
						>
							<DropzoneEmptyState />
							<DropzoneContent />
						</Dropzone>
					</div>
					{output && (
						<div
							key={output.url}
							className="flex animate-in flex-col gap-3 duration-500 fade-in-0"
						>
							<ImagePreview src={output.url} />
							<div className="flex flex-col gap-3">
								<div className="flex flex-wrap justify-center gap-2">
									{(['jpg', 'webp', 'png'] as const).map(
										(ext) => {
											const blob =
												ext === 'jpg'
													? jpgBlob
													: ext === 'webp'
														? webpBlob
														: pngBlob;
											return (
												<Button
													key={ext}
													variant="outline"
													size="sm"
													className="h-auto flex-col gap-0.5 rounded-lg py-1.5 font-normal"
													onClick={makeDownloadHandler(
														blob,
														ext
													)}
													disabled={!blob}
												>
													<span className="flex items-center gap-1.5">
														<Download className="size-3.5" />
														.{ext}
													</span>
													{blob && (
														<span className="text-xs text-muted-foreground">
															{formatBytes(
																blob.size
															)}
														</span>
													)}
												</Button>
											);
										}
									)}
									<Button
										variant="ghost"
										size="sm"
										className="h-auto flex-col gap-0.5 rounded-lg border border-border py-1.5 font-normal"
										onClick={handleCopy}
										disabled={!pngBlob}
									>
										<span className="flex items-center gap-1.5">
											<Copy className="size-3.5" />
											<span className="relative">
												<span className="invisible">
													Copy .png
												</span>
												<span className="absolute inset-0 flex items-center">
													{copied
														? 'Copied!'
														: 'Copy .png'}
												</span>
											</span>
										</span>
										{pngBlob && (
											<span className="text-xs text-muted-foreground">
												{formatBytes(pngBlob.size)}
											</span>
										)}
									</Button>
								</div>
								<p className="truncate text-center text-xs text-muted-foreground">
									{output.fileName} &middot; {output.width} ×{' '}
									{output.height}px
								</p>
							</div>
						</div>
					)}
				</div>
			</main>
			<footer className="sticky bottom-0 z-50 w-full">
				<div className="m-auto flex max-w-3xl justify-end p-2">
					<Dialog>
						<DialogTrigger
							render={
								<Button
									variant="ghost"
									size="icon"
									className="rounded-full border border-border bg-background hover:bg-muted dark:hover:bg-muted"
									aria-label="About Grabsizer"
								>
									<CircleHelp />
								</Button>
							}
						></DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>
									What is this nonsense?
								</DialogTitle>
								<DialogDescription>
									I'm always finding myself taking screengrabs
									for Github issues and PRs and they wind up
									being much too large. Sometimes I'll resize
									them in Photoshop or Affinity, but it seems
									a little too heavy handed for such a simple
									task. This little web app is here to make
									that task quicker. It's likely to be used
									just by me, but hey, if you're here, I hope
									you like it, too.
								</DialogDescription>
							</DialogHeader>
							<p className="text-sm text-muted-foreground">
								Source on{' '}
								<a
									href="https://github.com/andrewserong/grabsizer"
									target="_blank"
									rel="noreferrer"
									className="underline underline-offset-3 hover:text-foreground"
								>
									GitHub
								</a>
								.
							</p>
						</DialogContent>
					</Dialog>
				</div>
			</footer>
		</div>
	);
}

export default App;
