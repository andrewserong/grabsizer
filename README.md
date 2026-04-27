# Grabsizer

A local, client-side image resizing tool. Drop in an image, resize it, download the result — no uploads to any server.

## Built with

- [Vite](https://vite.dev) + [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [shadcn/ui](https://ui.shadcn.com) — component scaffolding and UI primitives
- [Base UI](https://base-ui.com) — headless primitives (used for Dialog)
- [Tailwind CSS](https://tailwindcss.com)
- [lucide-react](https://lucide.dev) — icons
- [pica](https://github.com/nodeca/pica) — high-quality client-side image resizing using a Lanczos kernel

## Acknowledgements

The `Dropzone` component (`src/components/dropzone.tsx`) was adapted from the [Supabase UI dropzone block](https://supabase.com/ui/docs/nextjs/dropzone). The server upload logic and Supabase Storage integration have been removed in favour of local-only file handling, but the component structure and visual design originated there.
