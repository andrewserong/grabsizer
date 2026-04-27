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
} from "@/components/dropzone";
import { ImagePreview } from "@/components/image-preview";
import { resizeImage } from "@/lib/resize";
import { SunMoon, Cog } from "lucide-react";
import { useTheme } from "./components/theme-provider";

export function App() {
	const { theme, setTheme } = useTheme();
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [resizing, setResizing] = useState(false);
	const prevUrlRef = useRef<string | null>(null);

	const handleFilesChange = useCallback(async (files: File[]) => {
		const file = files[0];
		if (!file) return;

		setResizing(true);
		try {
			const result = await resizeImage(file);
			const url = URL.createObjectURL(result.blob);
			if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
			prevUrlRef.current = url;
			setPreviewUrl(url);
		} finally {
			setResizing(false);
		}
	}, []);

	useEffect(() => {
		return () => {
			if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
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
					{resizing && (
						<p className="text-sm text-muted-foreground">
							Resizing…
						</p>
					)}
					{previewUrl && !resizing && (
						<ImagePreview src={previewUrl} />
					)}
				</div>
			</main>
		</>
	);
}

export default App;
