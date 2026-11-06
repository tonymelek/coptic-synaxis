import { DEFAULT_BIBLE_BASE_URL, parseCitation, resolveBookName } from 'bible-citation-text'

const chapterLastVerseCache = new Map()

function chapterUrl(book, chapter) {
  const resolved = resolveBookName(book) ?? book
  const padded = String(chapter).padStart(2, '0')
  const root = DEFAULT_BIBLE_BASE_URL.replace(/\/$/, '')
  return `${root}/en/${encodeURIComponent(resolved)}/${padded}.json`
}

/**
 * Last verse number in a chapter (from public Bible assets).
 * Returns null when the chapter cannot be loaded.
 */
export async function getChapterLastVerse(book, chapter) {
  const resolved = resolveBookName(book)
  if (!resolved || !chapter) return null

  const key = `${resolved}:${Number(chapter)}`
  if (chapterLastVerseCache.has(key)) {
    return chapterLastVerseCache.get(key)
  }

  const pending = (async () => {
    const res = await fetch(chapterUrl(resolved, chapter))
    if (!res.ok) return null
    const verses = await res.json()
    if (!Array.isArray(verses) || verses.length < 2) return null
    // Arrays are 1-indexed with empty slot at 0
    return verses.length - 1
  })().catch(() => null)

  chapterLastVerseCache.set(key, pending)
  const last = await pending
  if (last == null) chapterLastVerseCache.delete(key)
  return last
}

/**
 * Pair verse texts with display verse numbers from a citation.
 */
export async function pairVersesWithNumbers(citation, verseTexts) {
  const texts = Array.isArray(verseTexts) ? verseTexts : []
  if (!texts.length) return []

  const markers = []
  const parts = String(citation ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)

  for (const part of parts) {
    const parsed = parseCitation(part)
    if (!parsed) continue
    for (const range of parsed.ranges) {
      let to = range.to
      if (to == null) {
        to = await getChapterLastVerse(parsed.book, range.chapter)
      }
      if (to == null || to < range.from) continue
      for (let verse = range.from; verse <= to; verse += 1) {
        markers.push({ chapter: range.chapter, verse })
      }
    }
  }

  return texts.map((text, index) => {
    const marker = markers[index]
    return {
      num: marker ? String(marker.verse) : String(index + 1),
      text,
    }
  })
}
