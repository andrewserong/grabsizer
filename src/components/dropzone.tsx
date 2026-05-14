import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type PropsWithChildren,
} from 'react';
import { File as FileIcon, Upload, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/format';
import { Button } from '@/components/ui/button';

type DropzoneFile = {
	file: File;
	name: string;
	size: number;
	type: string;
	preview: string;
	width?: number;
	height?: number;
	errors: { message: string }[];
};

type DropzoneContextType = {
	files: DropzoneFile[];
	setFiles: React.Dispatch<React.SetStateAction<DropzoneFile[]>>;
	isDragActive: boolean;
	isDragReject: boolean;
	maxFileSize: number;
	maxFiles: number;
	inputRef: React.RefObject<HTMLInputElement | null>;
	onClear?: () => void;
};

const DropzoneContext = createContext<DropzoneContextType | undefined>(
	undefined
);

type DropzoneProps = {
	className?: string;
	maxFiles?: number;
	maxFileSize?: number;
	accept?: string;
	onChange?: (files: File[]) => void;
	onClear?: () => void;
};

const Dropzone = ({
	className,
	children,
	maxFiles = 1,
	maxFileSize = Number.POSITIVE_INFINITY,
	accept = 'image/*',
	onChange,
	onClear,
}: PropsWithChildren<DropzoneProps>) => {
	const [files, setFiles] = useState<DropzoneFile[]>([]);
	const [isDragActive, setIsDragActive] = useState(false);
	const [isDragReject, setIsDragReject] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const dragCounter = useRef(0);

	const processFiles = useCallback(
		async (rawFiles: FileList | File[]) => {
			const incoming = Array.from(rawFiles).slice(0, maxFiles);
			const next: DropzoneFile[] = await Promise.all(
				incoming.map(async (file) => {
					const errors: { message: string }[] = [];
					if (
						maxFileSize !== Number.POSITIVE_INFINITY &&
						file.size > maxFileSize
					) {
						errors.push({
							message: `File is larger than ${formatBytes(maxFileSize)}`,
						});
					}

					let width: number | undefined;
					let height: number | undefined;
					if (file.type.startsWith('image/')) {
						const bitmap = await createImageBitmap(file);
						width = bitmap.width;
						height = bitmap.height;
						bitmap.close();
					}

					return {
						file,
						name: file.name,
						size: file.size,
						type: file.type,
						preview: file.type.startsWith('image/')
							? URL.createObjectURL(file)
							: '',
						width,
						height,
						errors,
					};
				})
			);
			setFiles(next);
			onChange?.(incoming);
		},
		[maxFileSize, maxFiles, onChange]
	);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			dragCounter.current = 0;
			setIsDragActive(false);
			setIsDragReject(false);
			if (e.dataTransfer.files.length > 0) {
				processFiles(e.dataTransfer.files);
			}
		},
		[processFiles]
	);

	const handleDragEnter = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			dragCounter.current++;
			setIsDragActive(true);
			const hasReject = Array.from(e.dataTransfer.items).some(
				(item) => !item.type.startsWith('image/')
			);
			setIsDragReject(hasReject);
		},
		[]
	);

	const handleDragLeave = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			dragCounter.current--;
			if (dragCounter.current === 0) {
				setIsDragActive(false);
				setIsDragReject(false);
			}
		},
		[]
	);

	useEffect(() => {
		const handlePaste = (e: ClipboardEvent) => {
			const files = Array.from(e.clipboardData?.items ?? [])
				.filter((item) => item.type.startsWith('image/'))
				.map((item) => item.getAsFile())
				.filter((f): f is File => f !== null);
			if (files.length > 0) {
				processFiles(files);
			}
		};
		document.addEventListener('paste', handlePaste);
		return () => document.removeEventListener('paste', handlePaste);
	}, [processFiles]);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files && e.target.files.length > 0) {
				processFiles(e.target.files);
			}
		},
		[processFiles]
	);

	const isInvalid =
		(isDragActive && isDragReject) ||
		files.some((f) => f.errors.length > 0);

	return (
		<DropzoneContext.Provider
			value={{
				files,
				setFiles,
				isDragActive,
				isDragReject,
				maxFileSize,
				maxFiles,
				inputRef,
				onClear,
			}}
		>
			<div
				className={cn(
					'cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/25 bg-card p-6 text-center text-foreground transition-colors duration-200',
					isDragActive &&
						!isDragReject &&
						'border-primary bg-primary/10',
					isInvalid && 'border-destructive bg-destructive/10',
					className
				)}
				onDrop={handleDrop}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={(e) => e.preventDefault()}
				onClick={() => inputRef.current?.click()}
			>
				<input
					ref={inputRef}
					type="file"
					accept={accept}
					multiple={maxFiles > 1}
					className="hidden"
					onChange={handleInputChange}
				/>
				{children}
			</div>
		</DropzoneContext.Provider>
	);
};

const DropzoneContent = ({ className }: { className?: string }) => {
	const { files, setFiles, onClear } = useDropzoneContext();

	const handleRemove = useCallback(
		(e: React.MouseEvent, name: string) => {
			e.stopPropagation();
			setFiles((prev) => {
				const next = prev.filter((f) => f.name !== name);
				if (next.length === 0) {
					onClear?.();
				}
				return next;
			});
		},
		[setFiles, onClear]
	);

	if (files.length === 0) {
		return null;
	}

	return (
		<div className={cn('flex flex-col', className)}>
			{files.map((file, idx) => (
				<div
					key={`${file.name}-${idx}`}
					className="flex items-center gap-x-4 first:mt-2 last:mb-2"
				>
					{file.type.startsWith('image/') ? (
						<div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
							<img
								src={file.preview}
								alt={file.name}
								className="object-cover"
							/>
						</div>
					) : (
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border bg-muted">
							<FileIcon size={18} />
						</div>
					)}

					<div className="flex min-w-0 grow flex-col items-start">
						<p
							title={file.name}
							className="max-w-full truncate text-sm"
						>
							{file.name}
						</p>
						{file.errors.length > 0 ? (
							<p className="text-xs text-destructive">
								{file.errors.map((e) => e.message).join(', ')}
							</p>
						) : (
							<p className="text-xs text-muted-foreground">
								{formatBytes(file.size, 2)}
								{file.width && file.height && (
									<>
										{' '}
										&middot; {file.width}px &times;{' '}
										{file.height}px
									</>
								)}
							</p>
						)}
					</div>

					<Button
						size="icon"
						variant="ghost"
						className="shrink-0 text-muted-foreground hover:text-foreground"
						aria-label={`Remove ${file.name}`}
						onClick={(e) => handleRemove(e, file.name)}
					>
						<X />
					</Button>
				</div>
			))}
		</div>
	);
};

const DropzoneEmptyState = ({ className }: { className?: string }) => {
	const { files, maxFiles, maxFileSize, inputRef } = useDropzoneContext();

	if (files.length > 0) {
		return null;
	}

	return (
		<div className={cn('flex flex-col items-center gap-y-2', className)}>
			<Upload size={20} className="text-muted-foreground" />
			<p className="text-sm">
				Drop {maxFiles === 1 ? 'an image' : `up to ${maxFiles} images`}{' '}
				here
			</p>
			<div className="flex flex-col items-center gap-y-1">
				<p className="text-xs text-muted-foreground">
					Drag and drop, paste, or{' '}
					<span
						onClick={(e) => {
							e.stopPropagation();
							inputRef.current?.click();
						}}
						className="cursor-pointer underline transition hover:text-foreground"
					>
						select {maxFiles === 1 ? 'a file' : 'files'}
					</span>{' '}
					to get started
				</p>
				{maxFileSize !== Number.POSITIVE_INFINITY && (
					<p className="text-xs text-muted-foreground">
						Maximum file size: {formatBytes(maxFileSize, 2)}
					</p>
				)}
			</div>
		</div>
	);
};

const useDropzoneContext = () => {
	const context = useContext(DropzoneContext);
	if (!context) {
		throw new Error('useDropzoneContext must be used within a Dropzone');
	}
	return context;
};

export { Dropzone, DropzoneContent, DropzoneEmptyState };
