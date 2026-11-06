import { CopticReadings } from 'coptic-readings'

export const SERVICE_ORDER = ['vespers', 'matins', 'liturgy', 'evening']

/** Role order within each service block (liturgy uses the full list). */
export const ROLE_ORDER = [
  'prophecies',
  'pauline',
  'catholic',
  'acts',
  'psalm',
  'gospel',
]

export const ROLE_LABELS = {
  prophecies: 'Prophecy',
  pauline: 'Pauline',
  catholic: 'Catholic',
  acts: 'Acts',
  psalm: 'Psalm',
  gospel: 'Gospel',
}

export const LANGS = [
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'Arabic' },
]

export function formatYmd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseYmd(value) {
  if (!value || typeof value !== 'string') return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function formatFeastName(name) {
  if (!name) return 'Annual'
  return name.replaceAll('_', ' ')
}

export function capitalize(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Liturgical day pinned at 10:00 so evening spill does not shift the date. */
export function liturgicalDay(date) {
  const d = date instanceof Date ? date : parseYmd(date)
  if (!d) return null
  return new CopticReadings(d, {
    now: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10),
  })
}

export function collectDayReadings(dayRef) {
  if (!dayRef) return []

  const items = []
  let prophecyIndex = 0

  for (const service of SERVICE_ORDER) {
    const block = dayRef[service]
    if (!block) continue

    for (const role of ROLE_ORDER) {
      if (!(role in block)) continue

      const value = block[role]
      const citations = Array.isArray(value) ? value : [value]
      const displayRaw = role === 'psalm' ? block.psalm_coptic_ref : null
      const displayList = Array.isArray(displayRaw)
        ? displayRaw
        : typeof displayRaw === 'string' && displayRaw
          ? [displayRaw]
          : null

      citations.forEach((citation, index) => {
        if (typeof citation !== 'string' || !citation) return
        const base = ROLE_LABELS[role] ?? role
        const keyRole =
          role === 'prophecies' ? `prophecies.${prophecyIndex++}` : role
        const displayCitation =
          typeof displayList?.[index] === 'string' && displayList[index]
            ? displayList[index]
            : citation
        items.push({
          id: `${service}.${keyRole}`,
          key: `${service}.${keyRole}`,
          service,
          role,
          label: citations.length > 1 ? `${base} ${index + 1}` : base,
          /** Hebrew / asset ref — use for getBibleText */
          citation,
          /** Coptic numbering for Psalms when present — UI only */
          displayCitation,
        })
      })
    }
  }

  return items
}

export function readingKey(item) {
  return item?.key ?? item?.id ?? ''
}

export function resolveReading(dayRef, readingQuery) {
  const items = collectDayReadings(dayRef)
  if (!items.length) return null
  if (!readingQuery) return items[0]
  return items.find((item) => item.key === readingQuery) ?? items[0]
}

export function dayMetaFrom(day) {
  if (!day) return null
  const ref = day.readingReference.ref
  return {
    title: ref?.title ?? null,
    copticDate: day.copticDate,
    copticMonth: day.copticMonth,
    copticDay: day.copticDay,
    weekday: day.weekday,
    feastName: day.feast.name,
    tune: day.feast.tune,
    katamaros: day.feast.katamaros,
    adamOrWatos: day.adamOrWatos,
    readings: collectDayReadings(ref),
  }
}

export function buildCitation({
  book,
  startChapter,
  startVerse,
  endChapter,
  endVerse,
}) {
  if (!book || !startChapter || !startVerse || !endVerse) return ''
  const sc = Number(startChapter)
  const sv = Number(startVerse)
  const ec = Number(endChapter || startChapter)
  const ev = Number(endVerse)

  if (sc === ec && sv === ev) return `${book} ${sc}:${sv}`
  if (sc === ec) return `${book} ${sc}:${sv}-${ev}`
  return `${book} ${sc}:${sv}-${ec}:${ev}`
}
