# discraft-docs

This is a Next.js application generated with
[Create Fumadocs](https://github.com/fuma-nama/fumadocs).

Run development server:

```bash
bun run dev
```

Open http://localhost:3000 with your browser to see the result.

Set `NEXT_PUBLIC_SITE_URL` (e.g. `https://discraft.example.com`) when deploying so
OG images and other absolute URLs resolve correctly. On Vercel it falls back to
the production domain automatically.

## Explore

In the project, you can see:

- `lib/source.ts`: Code for content source adapter, [`loader()`](https://fumadocs.dev/docs/headless/source-api) provides the interface to access your content.
- `lib/layout.shared.tsx`: Shared options for layouts, optional but preferred to keep.

| Route                     | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `app/(home)`              | The route group for your landing page and other pages. |
| `app/docs`                | The documentation layout and pages.                    |
| `app/api/search/route.ts` | The Route Handler for search.                          |

### Fumadocs MDX

Collections are defined with the [Macro API](https://fumadocs.dev/docs/mdx/macro) in `lib/source.ts`.

Read the [Introduction](https://fumadocs.dev/docs/mdx) for further details.

### Next.js config

`next.config.ts` follows the Next.js 16.4 `create-next-app` defaults:

- Tailwind CSS v4 is loaded through the `@tailwindcss/turbopack` loader (no PostCSS).
- `cacheComponents` and `partialPrefetching` are enabled, so route handlers are
  prerendered by default and don't need `export const revalidate`.

## Learn More

To learn more about Next.js and Fumadocs, take a look at the following
resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Fumadocs](https://fumadocs.dev) - learn about Fumadocs
