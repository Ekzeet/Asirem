# Marketing images

Drop your own photos here using these **exact filenames**. They appear automatically on
the marketing front (Home / About / Blog). Until a file exists, the page shows a labelled
placeholder instead of a broken image — so it's safe to add them one at a time.

Every photo is cropped to fill its frame (`object-fit: cover`) and tinted with the brand
blue (the "duotone" effect), so exact dimensions aren't critical — just match the shape
roughly and use a high-enough resolution.

| File | Where it appears | Shape / aspect | Suggested size |
|------|------------------|----------------|----------------|
| `hero.jpg`   | Home hero (right of the headline) | Portrait, ~4:5 | 900 × 1125 |
| `about.jpg`  | About page hero | Portrait, ~5:6 | 840 × 1010 |
| `blog.jpg`   | Blog featured article | Landscape, ~10:7 | 1000 × 700 |
| `team-1.jpg` | About → team (Jean Rollin Deshommes) | Square, 1:1 | 400 × 400 |
| `team-2.jpg` | About → team (Nadège Étienne) | Square, 1:1 | 400 × 400 |
| `team-3.jpg` | About → team (Marc-Antoine Louis) | Square, 1:1 | 400 × 400 |

Notes
- Formats: `.jpg`, `.png`, or `.webp` all work — but keep the filename above (e.g. a WebP
  hero must still be named `hero.jpg`), OR update the paths in `src/pages/marketing/images.ts`.
- Keep files reasonably small (ideally < 400 KB each) so pages load fast.
- These are served statically by Vite from `public/`, so no code change is needed — add the
  file, refresh, done.
