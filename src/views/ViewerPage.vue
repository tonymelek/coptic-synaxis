<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getBibleText } from 'bible-citation-text'
import PassageView from '../components/PassageView.vue'
import ReadingDropdown from '../components/ReadingDropdown.vue'
import { pairVersesWithNumbers } from '../lib/chapterMeta.js'
import {
  capitalize,
  dayMetaFrom,
  LANGS,
  liturgicalDay,
  pickReadingKeyForDay,
  readingsDateLabels,
  resolveReading,
} from '../lib/readings.js'

const route = useRoute()
const router = useRouter()

const VERSE_NUMBERS_KEY = 'coptic-synaxis:verse-numbers'
const LEGACY_VERSE_NUMBERS_KEY = 'bible-viewer:verse-numbers'

function readVerseNumbersPref() {
  if (typeof localStorage === 'undefined') return false
  try {
    const current = localStorage.getItem(VERSE_NUMBERS_KEY)
    if (current !== null) return current === '1'
    const legacy = localStorage.getItem(LEGACY_VERSE_NUMBERS_KEY)
    if (legacy !== null) {
      localStorage.setItem(VERSE_NUMBERS_KEY, legacy)
      localStorage.removeItem(LEGACY_VERSE_NUMBERS_KEY)
      return legacy === '1'
    }
  } catch {
    // ignore storage failures
  }
  return false
}

const selectedLangs = ref(['en', 'ar'])
const showVerseNumbers = ref(readVerseNumbersPref())
const passages = ref([])
const error = ref('')
const loading = ref(false)
const activeCitation = ref('')

let requestId = 0

const dayYmd = computed(() =>
  typeof route.query.day === 'string' ? route.query.day : '',
)

const dayDateLabels = computed(() =>
  dayYmd.value ? readingsDateLabels(dayYmd.value) : null,
)

const readingQuery = computed(() =>
  typeof route.query.reading === 'string' ? route.query.reading : '',
)

const freeRef = computed(() =>
  typeof route.query.ref === 'string' ? route.query.ref : '',
)

const day = computed(() =>
  dayYmd.value ? liturgicalDay(dayYmd.value) : null,
)

const meta = computed(() => dayMetaFrom(day.value))

const dayReadings = computed(() => meta.value?.readings ?? [])

const activeReading = computed(() => {
  if (!day.value) return null
  return resolveReading(day.value.readingReference.ref, readingQuery.value)
})

const citation = computed(() => {
  if (freeRef.value) return freeRef.value.trim()
  return activeReading.value?.citation ?? ''
})

/** Shown in UI (Coptic Psalm numbering when present). */
const displayCitation = computed(() => {
  if (freeRef.value) return freeRef.value.trim()
  return (
    activeReading.value?.displayCitation ||
    activeReading.value?.citation ||
    ''
  )
})

function viewQueryForDay(ymd, readingKey) {
  const query = { day: ymd }
  if (readingKey) query.reading = readingKey
  return { path: '/view', query }
}

const readingKeyModel = computed({
  get: () => activeReading.value?.key ?? '',
  set: (key) => {
    if (!key || !dayYmd.value) return
    router.replace(viewQueryForDay(dayYmd.value, key))
  },
})

function onDayPick(event) {
  const ymd = event.target.value
  if (!ymd || ymd === dayYmd.value) return
  const nextDay = liturgicalDay(ymd)
  if (!nextDay) return
  const reading = pickReadingKeyForDay(nextDay, readingQuery.value)
  router.push(viewQueryForDay(ymd, reading))
}

function toggleLang(langId) {
  const next = new Set(selectedLangs.value)
  if (next.has(langId)) {
    if (next.size === 1) return
    next.delete(langId)
  } else {
    next.add(langId)
  }
  selectedLangs.value = LANGS.map((l) => l.id).filter((id) => next.has(id))
}

function toggleVerseNumbers() {
  showVerseNumbers.value = !showVerseNumbers.value
  try {
    localStorage.setItem(
      VERSE_NUMBERS_KEY,
      showVerseNumbers.value ? '1' : '0',
    )
  } catch {
    // ignore storage failures
  }
}

async function loadPassage(raw) {
  const textRef = (raw ?? '').trim()
  if (!textRef) {
    error.value = 'No citation to load.'
    passages.value = []
    return
  }
  if (!selectedLangs.value.length) {
    error.value = 'Select at least one language.'
    return
  }

  const id = ++requestId
  const langs = [...selectedLangs.value]
  activeCitation.value = textRef
  error.value = ''
  loading.value = true

  try {
    const text = await getBibleText(textRef, { langs, cache: true })
    if (id !== requestId) return

    const enVerses = await pairVersesWithNumbers(textRef, text.versesEn)
    const arVerses = await pairVersesWithNumbers(textRef, text.versesAr)
    if (id !== requestId) return

    const shown =
      !freeRef.value && activeReading.value?.displayCitation
        ? activeReading.value.displayCitation
        : textRef

    const next = []
    for (const lang of langs) {
      const body = lang === 'ar' ? text.ar : text.en
      if (!body) continue
      next.push({
        lang,
        dir: lang === 'ar' ? 'rtl' : 'ltr',
        reference: shown,
        text: body,
        verses: lang === 'ar' ? arVerses : enVerses,
      })
    }

    if (!next.length) {
      error.value = 'No verses found for that citation.'
      passages.value = []
      return
    }
    passages.value = next
  } catch (e) {
    if (id !== requestId) return
    error.value = e instanceof Error ? e.message : 'Failed to load passage.'
    passages.value = []
  } finally {
    if (id === requestId) loading.value = false
  }
}

watch(
  [citation, selectedLangs],
  ([next]) => {
    loadPassage(next)
  },
  { immediate: true, deep: true },
)
</script>

<template>
  <div class="flex flex-1 flex-col gap-10">
    <div class="reveal relative z-40 flex flex-wrap items-start justify-between gap-6">
      <div class="min-w-0">
        <RouterLink
          :to="dayYmd ? '/' : '/bible'"
          class="btn-ghost"
        >
          ← {{ dayYmd ? 'Readings' : 'Lookup' }}
        </RouterLink>
        <h1 class="mt-4 font-display text-2xl font-semibold tracking-tight text-gold sm:text-4xl">
          {{ displayCitation || activeCitation || 'Passage' }}
        </h1>
        <p
          v-if="activeReading"
          class="mt-2 text-sm capitalize tracking-wide text-fg-muted"
        >
          {{ capitalize(activeReading.service) }} · {{ activeReading.label }}
        </p>
        <div
          v-if="dayYmd && !freeRef"
          class="mt-4 max-w-xs"
        >
          <label class="block">
            <span class="eyebrow">Change date</span>
            <input
              type="date"
              class="field-input field-input--date mt-1"
              :value="dayYmd"
              @change="onDayPick"
            >
          </label>
          <p
            v-if="dayDateLabels"
            class="mt-1.5 text-xs text-fg-subtle"
          >
            {{ dayDateLabels.gregorian }}
            <span class="text-fg-faint"> · {{ dayDateLabels.coptic }}</span>
          </p>
        </div>
      </div>

      <div class="flex flex-col items-stretch gap-5 sm:items-end">
        <ReadingDropdown
          v-if="dayReadings.length"
          v-model="readingKeyModel"
          :items="dayReadings"
        />

        <div
          class="flex flex-wrap items-center justify-end gap-2"
          role="group"
          aria-label="Display options"
        >
          <button
            type="button"
            class="opt-pill"
            :class="{ 'is-on': showVerseNumbers }"
            :aria-pressed="showVerseNumbers"
            @click="toggleVerseNumbers"
          >
            Verse numbers
          </button>
          <button
            v-for="lang in LANGS"
            :key="lang.id"
            type="button"
            class="opt-pill"
            :class="{ 'is-on': selectedLangs.includes(lang.id) }"
            :aria-pressed="selectedLangs.includes(lang.id)"
            @click="toggleLang(lang.id)"
          >
            {{ lang.label }}
          </button>
        </div>
      </div>
    </div>

    <p
      v-if="error"
      class="reveal text-sm font-medium text-gold"
      role="alert"
    >
      {{ error }}
    </p>

    <p
      v-else-if="loading && !passages.length"
      class="reveal text-sm text-fg-muted"
      aria-live="polite"
    >
      Loading {{ displayCitation || activeCitation }}…
    </p>

    <div
      v-if="passages.length"
      class="reveal reveal-delay-1 parchment relative z-0 grid flex-1 gap-12 px-6 py-10 sm:px-10 sm:py-14"
      :class="[
        passages.length > 1 ? 'lg:grid-cols-2 lg:gap-16' : '',
        loading ? 'opacity-70' : '',
      ]"
    >
      <PassageView
        v-for="passage in passages"
        :key="passage.lang"
        :passage="passage"
        :show-verse-numbers="showVerseNumbers"
      />
    </div>
  </div>
</template>
