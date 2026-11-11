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

const GREG_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** Long label e.g. `Thursday · 12 Nov 2026`. */
export function formatGregorianLong(date, weekday) {
  const y = date.getFullYear()
  const m = date.getMonth()
  const d = date.getDate()
  const wd = weekday ?? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]
  return `${wd} · ${d} ${GREG_MONTHS_SHORT[m]} ${y}`
}

/** Long Coptic label e.g. `Thursday · Hator 3, 1743`. */
export function formatCopticLong(day) {
  const parts = day.copticDate?.split('/') ?? []
  const year = parts[2] ?? ''
  return `${day.weekday} · ${day.copticMonth} ${day.copticDay}, ${year}`
}

/** Civil calendar day (wall clock), no liturgical evening spill. */
export function calendarDay(ymd) {
  const d = typeof ymd === 'string' ? parseYmd(ymd) : ymd
  if (!d) return null
  return new CopticReadings(d, {
    now: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10),
  })
}

/** Live liturgical day from clock (≥ 18:00 rolls to next Gregorian day). */
export function liveLiturgicalDay(now = new Date()) {
  return new CopticReadings(now)
}

/** Gregorian YYYY-MM-DD used for today's katamaros readings. */
export function liturgicalTodayYmd(now = new Date()) {
  return formatYmd(liveLiturgicalDay(now).effectiveLiturgicalDay)
}

/**
 * Wall-clock civil calendar vs effective liturgical readings date.
 * After 18:00 these diverge until midnight.
 */
export function calendarContext(now = new Date()) {
  const civilYmd = formatYmd(now)
  const civil = calendarDay(civilYmd)
  const live = liveLiturgicalDay(now)
  const liturgicalYmd = formatYmd(live.effectiveLiturgicalDay)

  return {
    civilYmd,
    civilGregorian: formatGregorianLong(civil.effectiveLiturgicalDay, civil.weekday),
    civilCoptic: formatCopticLong(civil),
    liturgicalYmd,
    liturgicalGregorian: formatGregorianLong(
      live.effectiveLiturgicalDay,
      live.weekday,
    ),
    liturgicalCoptic: formatCopticLong(live),
    eveningSpillActive: civilYmd !== liturgicalYmd,
  }
}

/** Gregorian + Coptic labels for a chosen readings day (`YYYY-MM-DD`). */
export function readingsDateLabels(ymd) {
  const day = liturgicalDay(ymd)
  if (!day) return null
  return {
    ymd,
    gregorian: formatGregorianLong(day.effectiveLiturgicalDay, day.weekday),
    coptic: formatCopticLong(day),
  }
}

/** Katamaros for a chosen day; 10:00 pin avoids spill on historical picks. */
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

/** Reading key for liturgy gospel on a day, if present. */
export function liturgyGospelReadingKey(day) {
  const ref = day?.readingReference?.ref
  if (!ref) return null
  return (
    collectDayReadings(ref).find(
      (item) => item.service === 'liturgy' && item.role === 'gospel',
    )?.key ?? null
  )
}

/** Keep `preferKey` when valid; otherwise liturgy gospel, else first reading. */
export function pickReadingKeyForDay(day, preferKey = '') {
  const ref = day?.readingReference?.ref
  if (!ref) return ''
  const items = collectDayReadings(ref)
  if (!items.length) return ''
  if (preferKey && items.some((item) => item.key === preferKey)) return preferKey
  return liturgyGospelReadingKey(day) ?? items[0].key
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
