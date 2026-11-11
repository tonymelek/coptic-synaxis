import { calculateOrthodoxEaster } from 'coptic-readings'
import { formatFeastName, formatYmd, liturgicalDay } from './readings.js'

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / 86400000)
}

function copticLabel(date) {
  const day = liturgicalDay(date)
  if (!day) return ''
  return `${day.copticMonth} ${day.copticDay}`
}

function statusForRange(start, end, today) {
  const t = startOfDay(today).getTime()
  const s = startOfDay(start).getTime()
  const e = startOfDay(end).getTime()
  if (t < s) return 'upcoming'
  if (t > e) return 'past'
  return 'current'
}

function formatDisplayGreg(date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function intersectsYear(start, end, year) {
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31)
  return end >= yearStart && start <= yearEnd
}

/**
 * Build feast/season rows for a Gregorian year from coptic-readings
 * (`all` + day feast names + Easter anchors). No feast-specific overrides.
 */
export function buildYearFeasts(year, today = new Date()) {
  const midYear = new Date(year, 5, 15)
  const catalog = liturgicalDay(midYear)?.all ?? {}
  const easter = calculateOrthodoxEaster(year)

  /** @type {{ name: string, start: Date, end: Date, tune: string, calendar: string }[]} */
  const segments = []

  for (const [name, def] of Object.entries(catalog)) {
    if (def.calendar !== 'greg') continue
    const start = startOfDay(new Date(year, def.startMonth - 1, def.startDay))
    let end = startOfDay(new Date(year, def.endMonth - 1, def.endDay))
    if (end < start) end = startOfDay(new Date(year + 1, def.endMonth - 1, def.endDay))
    segments.push({
      name,
      start,
      end,
      tune: def.tune,
      calendar: 'greg',
    })
  }

  /** @type {Map<string, { name: string, start: Date, end: Date, tune: string, calendar: string }>} */
  const openRuns = new Map()
  const scanStart = new Date(year - 1, 11, 1)
  const scanEnd = new Date(year + 1, 0, 15)

  for (let cursor = scanStart; cursor <= scanEnd; cursor = addDays(cursor, 1)) {
    const day = liturgicalDay(cursor)
    if (!day) continue
    const name = day.feast.name
    const def = name ? catalog[name] : null
    const isCopticFeast = Boolean(def && def.calendar === 'coptic')

    for (const [runName, run] of [...openRuns.entries()]) {
      if (!isCopticFeast || runName !== name) {
        segments.push(run)
        openRuns.delete(runName)
      }
    }

    if (!isCopticFeast || !name) continue

    const existing = openRuns.get(name)
    if (!existing) {
      openRuns.set(name, {
        name,
        start: startOfDay(cursor),
        end: startOfDay(cursor),
        tune: def.tune ?? day.feast.tune,
        calendar: 'coptic',
      })
    } else if (daysBetween(existing.end, cursor) <= 1) {
      existing.end = startOfDay(cursor)
    } else {
      segments.push(existing)
      openRuns.set(name, {
        name,
        start: startOfDay(cursor),
        end: startOfDay(cursor),
        tune: def.tune ?? day.feast.tune,
        calendar: 'coptic',
      })
    }
  }
  for (const run of openRuns.values()) segments.push(run)

  const apostlesFeast = segments.find((s) => s.name === 'apostles')
  const seasonAnchors = [
    {
      name: 'jonah_fast',
      start: easter.startfJonahFast,
      end: easter.endfJonahFast,
      tune: 'fasting',
    },
    {
      name: 'jonah_feast',
      start: easter.jonahFeast,
      end: easter.jonahFeast,
      tune: 'annual',
    },
    {
      name: 'great_lent',
      start: easter.startOfGreatLent,
      end: easter.endOfGreatLent,
      tune: 'fasting',
    },
    {
      name: 'hosanna',
      start: easter.hosannaDate,
      end: easter.hosannaDate,
      tune: 'hosanna',
    },
    {
      name: 'resurrection',
      start: easter.easterDate,
      end: easter.pentecosteDate,
      tune: 'joy',
    },
    {
      name: 'pentecost',
      start: easter.pentecosteDate,
      end: easter.pentecosteDate,
      tune: 'joy',
    },
    {
      name: 'apostles_fast',
      start: easter.apostolesFastStartDate,
      end: apostlesFeast
        ? addDays(apostlesFeast.start, -1)
        : easter.apostolesFastStartDate,
      tune: 'annual',
    },
  ]

  const overridden = new Set(seasonAnchors.map((a) => a.name))
  const merged = segments.filter((s) => !overridden.has(s.name))

  for (const anchor of seasonAnchors) {
    const start = startOfDay(anchor.start)
    const end = startOfDay(anchor.end)
    merged.push({
      name: anchor.name,
      start,
      end: end < start ? start : end,
      tune: anchor.tune,
      calendar: 'greg',
    })
  }

  return merged
    .filter((event) => intersectsYear(event.start, event.end, year))
    .map((event) => {
      const status = statusForRange(event.start, event.end, today)
      const sameDay = formatYmd(event.start) === formatYmd(event.end)
      return {
        id: `${event.name}-${formatYmd(event.start)}`,
        name: event.name,
        label: formatFeastName(event.name),
        tune: event.tune,
        calendar: event.calendar,
        status,
        start: event.start,
        end: event.end,
        startYmd: formatYmd(event.start),
        endYmd: formatYmd(event.end),
        sameDay,
        gregLabel: sameDay
          ? formatDisplayGreg(event.start)
          : `${formatDisplayGreg(event.start)} – ${formatDisplayGreg(event.end)}`,
        copticLabel: sameDay
          ? copticLabel(event.start)
          : `${copticLabel(event.start)} – ${copticLabel(event.end)}`,
      }
    })
    .sort((a, b) => a.start - b.start || a.label.localeCompare(b.label))
}

export function tuneAccentClass(tune) {
  switch (tune) {
    case 'joy':
      return 'tune-joy'
    case 'fasting':
      return 'tune-fasting'
    case 'hosanna':
      return 'tune-hosanna'
    case 'kiahk':
      return 'tune-kiahk'
    default:
      return 'tune-annual'
  }
}

export function statusAccentClass(status) {
  switch (status) {
    case 'past':
      return 'status-past'
    case 'current':
      return 'status-current'
    default:
      return 'status-upcoming'
  }
}
