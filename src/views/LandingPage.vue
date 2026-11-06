<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  capitalize,
  dayMetaFrom,
  formatFeastName,
  formatYmd,
  liturgicalDay,
  SERVICE_ORDER,
} from '../lib/readings.js'
import {
  buildYearFeasts,
  statusAccentClass,
  tuneAccentClass,
} from '../lib/yearFeasts.js'

const today = new Date()
const year = today.getFullYear()

const selectedYmd = ref(formatYmd(today))
const pastExpanded = ref(false)

const day = computed(() => liturgicalDay(selectedYmd.value))
const meta = computed(() => dayMetaFrom(day.value))

const copticYear = computed(() => {
  const parts = meta.value?.copticDate?.split('/') ?? []
  return parts[2] ?? ''
})

const heroDate = computed(() => {
  if (!meta.value) return ''
  return `${meta.value.weekday} · ${meta.value.copticMonth} ${meta.value.copticDay}, ${copticYear.value}`
})

const feastLine = computed(() => {
  if (!meta.value) return ''
  return [
    formatFeastName(meta.value.feastName).toLowerCase(),
    `${meta.value.tune} tune`,
    meta.value.adamOrWatos,
  ].join(' · ')
})

const readingsByService = computed(() => {
  const readings = meta.value?.readings ?? []
  return SERVICE_ORDER.map((service) => ({
    service,
    items: readings.filter((item) => item.service === service),
  })).filter((group) => group.items.length)
})

const yearFeasts = computed(() => buildYearFeasts(year, today))

const pastFeasts = computed(() =>
  yearFeasts.value.filter((event) => event.status === 'past'),
)

const activeFeasts = computed(() =>
  yearFeasts.value.filter((event) => event.status !== 'past'),
)

const isViewingToday = computed(
  () => selectedYmd.value === formatYmd(today),
)

function selectFeast(event) {
  selectedYmd.value = event.startYmd
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetToday() {
  selectedYmd.value = formatYmd(today)
}

function viewerLink(item) {
  return {
    path: '/view',
    query: {
      day: selectedYmd.value,
      reading: item.key,
    },
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-16 sm:gap-20">
    <section class="reveal space-y-5 pt-2 text-center sm:pt-4 sm:text-start">
      <p class="eyebrow">Liturgical day</p>
      <h1 class="font-display text-3xl font-semibold leading-[1.15] tracking-tight text-gold sm:text-5xl sm:leading-[1.1]">
        {{ heroDate }}
      </h1>
      <p class="mx-auto max-w-xl text-base capitalize leading-relaxed text-fg-muted sm:mx-0 sm:text-lg">
        {{ feastLine }}
      </p>
      <p
        v-if="meta?.title"
        class="text-sm italic text-fg-subtle"
      >
        {{ meta.title }}
      </p>
      <button
        v-if="!isViewingToday"
        type="button"
        class="btn-ghost"
        @click="resetToday"
      >
        ← Return to today
      </button>
    </section>

    <section class="reveal reveal-delay-1">
      <div class="mb-6 flex items-end justify-between gap-4">
        <div>
          <p class="eyebrow">
            {{ isViewingToday ? "Today's readings" : 'Day readings' }}
          </p>
          <h2 class="mt-2 font-display text-2xl font-semibold text-fg sm:text-3xl">
            Scripture refs
          </h2>
        </div>
        <p class="pb-1 font-display text-sm text-fg-subtle">
          {{ selectedYmd }}
        </p>
      </div>

      <div
        v-if="readingsByService.length"
        class="space-y-10"
      >
        <div
          v-for="group in readingsByService"
          :key="group.service"
        >
          <p class="eyebrow mb-1">
            {{ capitalize(group.service) }}
          </p>
          <div>
            <RouterLink
              v-for="item in group.items"
              :key="item.key"
              :to="viewerLink(item)"
              class="reading-link group"
            >
              <span class="reading-role pt-0.5 text-xs font-semibold uppercase tracking-[0.16em]">
                {{ item.label }}
              </span>
              <span class="reading-cite font-display text-lg sm:text-xl">
                {{ item.displayCitation || item.citation }}
              </span>
            </RouterLink>
          </div>
        </div>
      </div>
      <p
        v-else
        class="py-6 text-fg-muted"
      >
        No katamaros references for this day.
      </p>
    </section>

    <div class="rule reveal reveal-delay-2" />

    <section class="reveal reveal-delay-2">
      <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="eyebrow">Calendar</p>
          <h2 class="mt-2 font-display text-2xl font-semibold text-fg sm:text-3xl">
            Seasons &amp; feasts · {{ year }}
          </h2>
        </div>
        <p class="text-xs tracking-wide text-fg-subtle">
          Past quieter · Gold is now · Bright is coming
        </p>
      </div>

      <div class="space-y-1">
        <div v-if="pastFeasts.length">
          <button
            type="button"
            class="feast-item status-past w-full"
            :aria-expanded="pastExpanded"
            @click="pastExpanded = !pastExpanded"
          >
            <span class="feast-dot" aria-hidden="true" />
            <span class="flex items-baseline justify-between gap-3">
              <span class="font-display text-lg">
                Past celebrations
                <span class="ms-2 font-reading text-sm text-fg-faint">{{ pastFeasts.length }}</span>
              </span>
              <span class="text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">
                {{ pastExpanded ? 'Hide' : 'Show' }}
              </span>
            </span>
          </button>

          <div v-if="pastExpanded">
            <button
              v-for="event in pastFeasts"
              :key="event.id"
              type="button"
              class="feast-item feast-item-nested w-full"
              :class="[statusAccentClass(event.status), tuneAccentClass(event.tune)]"
              @click="selectFeast(event)"
            >
              <span class="feast-dot" aria-hidden="true" />
              <span>
                <span class="flex flex-wrap items-baseline justify-between gap-2">
                  <span class="font-display text-lg capitalize">{{ event.label }}</span>
                  <span class="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-fg-faint">{{ event.tune }}</span>
                </span>
                <span class="mt-1 block text-sm text-fg-subtle">{{ event.gregLabel }}</span>
                <span class="mt-0.5 block text-sm text-fg-faint">{{ event.copticLabel }}</span>
              </span>
            </button>
          </div>
        </div>

        <button
          v-for="event in activeFeasts"
          :key="event.id"
          type="button"
          class="feast-item w-full"
          :class="[statusAccentClass(event.status), tuneAccentClass(event.tune)]"
          @click="selectFeast(event)"
        >
          <span class="feast-dot" aria-hidden="true" />
          <span>
            <span class="flex flex-wrap items-baseline justify-between gap-2">
              <span class="font-display text-lg capitalize sm:text-xl">{{ event.label }}</span>
              <span class="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-fg-subtle">
                {{ event.tune }} · {{ event.status }}
              </span>
            </span>
            <span class="mt-1 block text-sm text-fg-muted">{{ event.gregLabel }}</span>
            <span class="mt-0.5 block text-sm text-fg-subtle">{{ event.copticLabel }}</span>
          </span>
        </button>
      </div>
    </section>
  </div>
</template>
