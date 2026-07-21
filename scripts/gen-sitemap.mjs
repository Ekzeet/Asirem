// Generates public/sitemap.xml from published courses + instructors.
// Runs at build time (prebuild). Non-fatal: if env/DB is unavailable it writes a
// minimal sitemap with the stable routes and exits 0, so builds never break.
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '..', 'public', 'sitemap.xml')
const SITE = (process.env.SITE_URL || 'https://asirem.example.com').replace(/\/$/, '')
const SUPA = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_ANON_KEY

function xml(urls) {
  const body = urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

async function rpc(name, args = {}) {
  const res = await fetch(`${SUPA}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  if (!res.ok) throw new Error(`${name} ${res.status}`)
  return res.json()
}

async function main() {
  const routes = new Set(['/', '/courses'])
  if (SUPA && KEY) {
    try {
      const courses = await rpc('list_public_courses')
      for (const c of courses ?? []) {
        if (c.slug) routes.add(`/courses/${c.slug}`)
      }
      console.log(`[sitemap] ${routes.size} routes from ${courses?.length ?? 0} courses`)
    } catch (e) {
      console.warn(`[sitemap] DB fetch failed (${e.message}); writing stable-routes sitemap`)
    }
  } else {
    console.warn('[sitemap] VITE_SUPABASE_URL/ANON_KEY not set; writing stable-routes sitemap')
  }
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, xml([...routes]))
}

main().catch((e) => { console.warn('[sitemap] skipped:', e.message); process.exit(0) })
