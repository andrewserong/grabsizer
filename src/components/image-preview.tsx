import { cn } from "@/lib/utils";

type ImagePreviewProps = {
	src: string;
	alt?: string;
	className?: string;
};

export function ImagePreview({
	src,
	alt = "Image preview",
	className,
}: ImagePreviewProps) {
	return (
		<figure
			className={cn(
				"overflow-hidden rounded-xl shadow-md ring-1 ring-foreground/8",
				className
			)}
		>
			<img src={src} alt={alt} className="block w-full object-contain" />
		</figure>
	);
}
