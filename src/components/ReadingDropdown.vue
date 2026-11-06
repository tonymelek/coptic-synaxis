<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { capitalize } from '../lib/readings.js'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const rootEl = ref(null)

const active = computed(
  () => props.items.find((item) => item.key === props.modelValue) ?? props.items[0],
)

const label = computed(() => {
  const item = active.value
  if (!item) return 'Choose a reading'
  return `${capitalize(item.service)} · ${item.label}`
})

const citation = computed(() => {
  const item = active.value
  if (!item) return ''
  return item.displayCitation || item.citation || ''
})

function toggle() {
  open.value = !open.value
}

function select(item) {
  emit('update:modelValue', item.key)
  open.value = false
}

function onDocPointer(event) {
  if (!open.value || !rootEl.value) return
  if (!rootEl.value.contains(event.target)) open.value = false
}

function onKeydown(event) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointer)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointer)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    ref="rootEl"
    class="reading-dd relative z-50 min-w-[16rem] max-w-[22rem]"
  >
    <span class="eyebrow">Other readings</span>
    <button
      type="button"
      class="reading-dd-trigger mt-2"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="min-w-0 flex-1 text-start">
        <span class="block truncate text-sm font-semibold text-fg">{{ label }}</span>
        <span
          v-if="citation"
          class="mt-0.5 block truncate text-xs text-fg-subtle"
        >
          {{ citation }}
        </span>
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="size-4 shrink-0 text-gold transition duration-200"
        :class="open ? 'rotate-180' : ''"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <ul
      v-show="open"
      class="reading-dd-menu"
      role="listbox"
      :aria-activedescendant="active?.key"
    >
      <li
        v-for="item in items"
        :id="item.key"
        :key="item.key"
        role="option"
        :aria-selected="item.key === modelValue"
      >
        <button
          type="button"
          class="reading-dd-option"
          :class="{ 'is-active': item.key === modelValue }"
          @click="select(item)"
        >
          <span class="block text-sm font-semibold">
            {{ capitalize(item.service) }} · {{ item.label }}
          </span>
          <span class="mt-0.5 block text-xs opacity-80">
            {{ item.displayCitation || item.citation }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
