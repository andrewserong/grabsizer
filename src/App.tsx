import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Dropzone,
	DropzoneContent,
	DropzoneEmptyState,
	formatBytes,
} from "@/components/dropzone";
import { ImagePreview } from "@/components/image-preview";
import { resizeImage } from "@/lib/resize";
import { SunMoon, Cog } from "lucide-react";
import { useTheme } from "./components/theme-provider";

type Output = {
	url: string;
	blob: Blob;
	fileName: string;
	width: number;
	height: number;
};

export function App() {
	const { theme, setTheme } = useTheme();
	const [output, setOutput] = useState<Output | null>(null);
	const [copied, setCopied] = useState(false);
	const prevUrlRef = useRef<string | null>(null);
	const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleFilesChange = useCallback(async (files: File[]) => {
		const file = files[0];
		if (!file) return;

		const result = await resizeImage(file);
		const url = URL.createObjectURL(result.blob);
		if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
		prevUrlRef.current = url;
		setOutput({ url, blob: result.blob, fileName: file.name, width: result.width, height: result.height });
	}, []);

	const handleCopy = useCallback(async () => {
		if (!output) return;
		await navigator.clipboard.write([
			new ClipboardItem({ [output.blob.type]: output.blob }),
		]);
		setCopied(true);
		if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
		copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
	}, [output]);

	useEffect(() => {
		return () => {
			if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
			if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
		};
	}, []);

	return (
		<>
			<header className="sticky top-0 z-50 w-full bg-background">
				<div className="m-auto flex max-w-3xl items-center justify-between p-2">
					<span className="text-sm leading-none">Grabsizer</span>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="icon"
							className="rounded-full"
							onClick={() =>
								setTheme(theme === "dark" ? "light" : "dark")
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
										Adjust settings for resizing your
										images.
									</DialogDescription>
								</DialogHeader>
							</DialogContent>
						</Dialog>
					</div>
				</div>
			</header>
			<main className="w-full">
				<div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
					<div className="mx-auto w-full max-w-sm">
						<Dropzone onChange={handleFilesChange}>
							<DropzoneEmptyState />
							<DropzoneContent />
						</Dropzone>
					</div>
					{output && (
						<div key={output.url} className="animate-in fade-in-0 duration-500 flex flex-col gap-3">
							<ImagePreview src={output.url} />
							<div className="flex items-center rounded-lg border border-border bg-card p-4">
								<div className="flex min-w-0 grow flex-col">
									<p className="truncate text-sm">
										{output.fileName}
									</p>
									<p className="text-xs text-muted-foreground">
										{formatBytes(output.blob.size)} &middot; {output.width}px × {output.height}px
									</p>
								</div>
								<Button
									variant="outline"
									size="sm"
									className="font-normal"
									onClick={handleCopy}
								>
									{copied ? "Copied" : "Copy"}
								</Button>
							</div>
						</div>
					)}
				</div>
			</main>
		</>
	);
}

export default App;
