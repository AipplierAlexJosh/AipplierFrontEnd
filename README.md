# Aipplier Frontend

Modern Next.js workspace UI inspired by collaborative documentation tools. This project acts as the design and layout scaffold for the upcoming Aipplier product.

## Tech Stack

- `Next.js 14` with the App Router
- `React 18`
- TypeScript, ESLint, PostCSS
- `lucide-react` icon set
- Global CSS with custom design tokens (no utility framework required)

## Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to explore the workspace layout.

## Deployment

1. Push this repository to GitHub.
2. Create a new Vercel project and import the repo.
3. Use `npm install` and `npm run build` as the default build setup (picked automatically by Vercel).
4. Set any required environment variables in Vercel once your APIs are ready.

## Design System Notes

- Warm accent palette using gradients in the orange/amber range (`#f97316`) to match the reference look.
- Soft neutral surfaces (`#f6f8fb` background, white panels) with generous shadows for depth.
- Modularity-first components: sidebar navigation, document reader, and comments tray are split into React components for easy reuse.
- Responsive layout automatically hides the comments tray under `1200px` width and collapses the sidebar below `900px`.

## Next Steps

- Wire the layout to live content and API routes.
- Replace placeholder data (tasks, comments, imagery) with real data sources.
- Extend the theme with dark-mode tokens if needed.