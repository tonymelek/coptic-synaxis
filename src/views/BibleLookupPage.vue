<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BookTypeahead from '../components/BookTypeahead.vue'
import { getChapterLastVerse } from '../lib/chapterMeta.js'
import { buildCitation } from '../lib/readings.js'

const router = useRouter()

const book = ref('')
const startChapter = ref(1)
const startVerse = ref(1)
const endChapter = ref(1)
const endVerse = ref(1)
const error = ref('')
const resolvingEnd = ref(false)

let resolveId = 0

const preview = computed(() =>
  buildCitation({
    book: book.value,
    startChapter: startChapter.value,
    startVerse: startVerse.value,
    endChapter: endChapter.value,
    endVerse: endVerse.value,
  }),
)

async function applyChapterDefaults({ syncEndChapter = true } = {}) {
  const id = ++resolveId
  startVerse.value = 1
  if (syncEndChapter) endChapter.value = startChapter.value

  if (!book.value.trim()) {
    endVerse.value = 1
    return
  }

  resolvingEnd.value = true
  try {
    const last = await getChapterLastVerse(book.value, endChapter.value)
    if (id !== resolveId) return
    endVerse.value = last ?? 1
  } finally {
    if (id === resolveId) resolvingEnd.value = false
  }
}

watch(book, () => {
  applyChapterDefaults({ syncEndChapter: true })
})

watch(startChapter, () => {
  applyChapterDefaults({ syncEndChapter: true })
})

watch(endChapter, async (chapter, previous) => {
  if (chapter === previous) return
  // Keep from-verse as-is when only the end chapter changes; refresh last verse.
  const id = ++resolveId
  if (!book.value.trim()) {
    endVerse.value = 1
    return
  }
  resolvingEnd.value = true
  try {
    const last = await getChapterLastVerse(book.value, chapter)
    if (id !== resolveId) return
    endVerse.value = last ?? 1
  } finally {
    if (id === resolveId) resolvingEnd.value = false
  }
})

function submit() {
  const citation = preview.value.trim()
  if (!book.value.trim()) {
    error.value = 'Choose a book from the suggestions.'
    return
  }
  if (!citation) {
    error.value = 'Enter a chapter and verse range.'
    return
  }
  error.value = ''
  router.push({ path: '/view', query: { ref: citation } })
}
</script>

<template>
  <div class="reveal mx-auto flex w-full max-w-xl flex-1 flex-col">
    <p class="eyebrow">Lookup</p>
    <h1 class="mt-3 font-display text-4xl font-semibold tracking-tight text-gold sm:text-5xl">
      Read Bible
    </h1>
    <p class="mt-4 text-base leading-relaxed text-fg-muted">
      Choose a book and chapter — verses default to 1 through the last verse.
    </p>

    <form
      class="mt-12 space-y-10"
      @submit.prevent="submit"
    >
      <BookTypeahead v-model="book" />

      <div class="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
        <label class="block">
          <span class="eyebrow">From ch.</span>
          <input
            v-model.number="startChapter"
            type="number"
            min="1"
            class="field-input"
          />
        </label>
        <label class="block">
          <span class="eyebrow">From v.</span>
          <input
            v-model.number="startVerse"
            type="number"
            min="1"
            class="field-input"
          />
        </label>
        <label class="block">
          <span class="eyebrow">To ch.</span>
          <input
            v-model.number="endChapter"
            type="number"
            min="1"
            class="field-input"
          />
        </label>
        <label class="block">
          <span class="eyebrow">To v.</span>
          <input
            v-model.number="endVerse"
            type="number"
            min="1"
            class="field-input"
            :disabled="resolvingEnd"
          />
        </label>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-4 border-t border-fg/20 pt-8">
        <p class="font-display text-lg text-fg-muted">
          {{ preview || '—' }}
          <span
            v-if="resolvingEnd"
            class="ms-2 text-sm font-reading text-fg-subtle"
          >…</span>
        </p>
        <button
          type="submit"
          class="btn-primary"
          :disabled="resolvingEnd"
        >
          Open passage
        </button>
      </div>

      <p
        v-if="error"
        class="text-sm text-gold"
        role="alert"
      >
        {{ error }}
      </p>
    </form>
  </div>
</template>
