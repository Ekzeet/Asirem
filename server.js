// Minimal, zero-dependency static server for the built SPA.
// Only needed if Hostinger deploys this as a "Node.js Web App" (which runs an entry
// file). For plain static hosting you don't need this — just serve the dist/ folder.
// Serves dist/, long-caches fingerprinted assets, and falls back unknown routes to
// index.html so React Router works on refresh/deep links.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = join(fileURLToPath(new URL('.', import.meta.url)), 'dist')
const PORT = process.env.PORT || 3000
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain',
}

createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    let filePath = join(DIST, normalize(urlPath))
    if (!filePath.startsWith(DIST)) { res.writeHead(403); return res.end('Forbidden') }

    let s = await stat(filePath).catch(() => null)
    if (s?.isDirectory()) { filePath = join(filePath, 'index.html'); s = await stat(filePath).catch(() => null) }

    if (!s) {
      // Missing asset file → 404; missing route (no extension) → SPA fallback.
      if (extname(urlPath)) { res.writeHead(404); return res.end('Not found') }
      filePath = join(DIST, 'index.html')
    }

    const body = await readFile(filePath)
    const type = TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream'
    const cache = filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable'
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': cache })
    res.end(body)
  } catch {
    res.writeHead(500); res.end('Server error')
  }
}).listen(PORT, () => console.log(`Asirem SPA served from dist/ on port ${PORT}`))
