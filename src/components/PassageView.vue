<script setup>
import { computed } from 'vue'

const props = defineProps({
  passage: {
    type: Object,
    required: true,
  },
  showVerseNumbers: {
    type: Boolean,
    default: false,
  },
})

const isRtl = computed(() => props.passage.dir === 'rtl')

const hasVerses = computed(
  () => Array.isArray(props.passage.verses) && props.passage.verses.length > 0,
)
</script>

<template>
  <article
    class="min-w-0"
    :dir="passage.dir"
    :lang="passage.lang"
  >
    <header class="mb-8">
      <p
        class="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-burgundy-700"
        :class="isRtl ? 'font-arabic normal-case tracking-normal' : ''"
      >
        {{ passage.lang === 'ar' ? 'العربية' : 'English' }}
      </p>
      <h2
        class="mt-2 text-2xl text-ink sm:text-3xl"
        :class="isRtl ? 'font-arabic font-bold' : 'font-display font-medium'"
      >
        {{ passage.reference }}
      </h2>
      <div class="mt-4 h-px w-12 bg-burgundy-700/50" />
    </header>

    <p
      class="text-[1.2rem] leading-[1.9] text-ink sm:text-[1.25rem] sm:leading-[2]"
      :class="isRtl ? 'font-arabic text-[1.4rem] leading-[2.1] sm:text-[1.5rem]' : ''"
    >
      <template v-if="showVerseNumbers && hasVerses">
        <span
          v-for="(verse, index) in passage.verses"
          :key="`${verse.num}-${index}`"
          class="verse"
        >
          <sup
            class="me-1 inline-block translate-y-[-0.15em] text-[0.7em] font-semibold text-burgundy-700 select-none"
          >{{ verse.num }}</sup>{{ verse.text }}{{ ' ' }}
        </span>
      </template>
      <template v-else>
        {{ passage.text }}
      </template>
    </p>
  </article>
</template>
