import fs from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const publicDir = resolve(rootDir, 'public')

const APP_BASE = process.env.DEPLOY_BASE || '/app/'
const appBasePath = APP_BASE.replace(/\/$/, '') || '/app'

const MARKETING_PAGES = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/packages', 'packages.html'],
  ['/packages.html', 'packages.html'],
  ['/about', 'about.html'],
  ['/about.html', 'about.html'],
  ['/story', 'story.html'],
  ['/story.html', 'story.html'],
  ['/contact', 'contact.html'],
  ['/contact.html', 'contact.html'],
  ['/support', 'support.html'],
  ['/support.html', 'support.html'],
])

const MARKETING_ASSETS = new Set([
  '/static_style.css',
  '/tailwind.cdn.js',
  '/site.js',
  '/packages.js',
  '/contact-form.js',
  '/favicon.ico',
  '/favicon-16.png',
  '/favicon-32.png',
])

function isAppPath(pathname) {
  return (
    pathname === appBasePath ||
    pathname === `${appBasePath}/` ||
    pathname.startsWith(`${appBasePath}/`)
  )
}

function hasFileExtension(pathname) {
  const lastSegment = pathname.split('/').pop() ?? ''
  return /\.[a-zA-Z0-9]+$/.test(lastSegment)
}

function sendPublicFile(pathname, res) {
  const relativePath = pathname.replace(/^\//, '')
  const filePath = resolve(publicDir, relativePath)

  if (
    !filePath.startsWith(publicDir) ||
    !fs.existsSync(filePath) ||
    fs.statSync(filePath).isDirectory()
  ) {
    return false
  }

  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  const types = {
    css: 'text/css; charset=utf-8',
    js: 'text/javascript; charset=utf-8',
    svg: 'image/svg+xml',
    html: 'text/html; charset=utf-8',
    png: 'image/png',
    ico: 'image/x-icon',
    webp: 'image/webp',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
  }

  res.statusCode = 200
  res.setHeader('Content-Type', types[ext] ?? 'application/octet-stream')
  res.end(fs.readFileSync(filePath))
  return true
}

function serveMarketingPage(pathname, res) {
  const page = MARKETING_PAGES.get(pathname)
  if (!page) return false
  return sendPublicFile(`/${page}`, res)
}

function siteRoutingMiddleware(req, res, next) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const pathname = url.pathname

  if (MARKETING_ASSETS.has(pathname) && sendPublicFile(pathname, res)) return
  if (
    (pathname.startsWith('/images/') || pathname.startsWith('/icons/')) &&
    sendPublicFile(pathname, res)
  ) {
    return
  }
  if (serveMarketingPage(pathname, res)) return

  if (isAppPath(pathname)) {
    const isViteInternal =
      pathname.startsWith(`${appBasePath}/@`) ||
      pathname.startsWith(`${appBasePath}/node_modules/`) ||
      pathname.startsWith(`${appBasePath}/src/`)
    const isBuiltAsset = pathname.startsWith(`${appBasePath}/assets/`)

    if (!isViteInternal && !isBuiltAsset && !hasFileExtension(pathname)) {
      req.url = `${appBasePath}/app.html${url.search}`
    }
  }

  next()
}

function siteRoutingPlugin() {
  return {
    name: 'site-routing',
    configureServer(server) {
      server.middlewares.use(siteRoutingMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(siteRoutingMiddleware)
    },
    closeBundle() {
      // app.html favicon hrefs are rewritten under /app/ — mirror assets there
      const distApp = resolve(rootDir, 'dist/app')
      const distIcons = resolve(distApp, 'icons')
      fs.mkdirSync(distIcons, { recursive: true })
      for (const file of [
        'favicon.ico',
        'favicon-16.png',
        'favicon-32.png',
      ]) {
        const src = resolve(publicDir, file)
        if (fs.existsSync(src)) fs.copyFileSync(src, resolve(distApp, file))
      }
      const apple = resolve(publicDir, 'icons/apple-touch-icon.png')
      if (fs.existsSync(apple)) {
        fs.copyFileSync(apple, resolve(distIcons, 'apple-touch-icon.png'))
      }
    },
  }
}

export default defineConfig({
  base: APP_BASE,
  plugins: [vue(), tailwindcss(), siteRoutingPlugin()],
  build: {
    rollupOptions: {
      input: resolve(rootDir, 'app.html'),
    },
  },
})
