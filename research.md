# Research notes

## Clipboard API: image format support

### What we found

The browser Clipboard API (`navigator.clipboard.write` / `ClipboardItem`) only mandates support for three MIME types: `text/plain`, `text/html`, and `image/png`. Other image formats (JPEG, WebP, etc.) are not reliably supported across browsers.

### Why only PNG?

The restriction is a deliberate security decision, not a technical one. Two main reasons from the W3C spec:

1. **Decompression bomb attacks** — PNG uses DEFLATE compression with potentially extreme ratios. The spec explicitly calls out "PNG decompression bomb attacks" as a threat browsers must guard against when reading clipboard data.

2. **Reduced attack surface** — Restricting to a small set of known formats limits how many decoders any receiving application needs to safely handle. The spec notes that "untrusted scripts can attempt to exploit security vulnerabilities in local software by placing data known to trigger those vulnerabilities on the clipboard."

PNG was the natural choice: lossless, well-understood, and widely supported. JPEG has a history of decoder vulnerabilities and adds lossy complexity.

### How this affects grabsizer

`resizeImage` preserves the original file type — for images under 1400px it returns the raw `File` object, and for resized images `pica.toBlob` is given `file.type`. Both paths can produce non-PNG blobs. Passing a JPEG blob to `ClipboardItem` throws, and without a `try/catch` the copy silently fails.

**Decision:** Keep `resizeImage` outputting the original format (preserving quality and file size). The "Copy as PNG" button handles conversion at copy time — it draws the blob to a canvas and calls `canvas.toBlob('image/png')` before writing to the clipboard. This keeps the resize output lean while making the clipboard constraint explicit in the UI label.

### Possible future work

The Clipboard API now supports **web custom formats** — MIME types prefixed with `"web "` (e.g. `"web image/jpeg"`) that bypass the format restriction. The catch: data written this way is only readable by other web apps, not native applications. Not useful for our case since users will paste into design tools or editors.

### References

- W3C Clipboard API spec: https://www.w3.org/TR/clipboard-apis/
- Chrome: "Web Custom Formats for the Async Clipboard API" (developer.chrome.com)
- "The Web's Clipboard" by Alex Harris (alexharri.com/blog/clipboard)
