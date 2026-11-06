<script setup>
import { computed, ref } from 'vue'
import { BIBLE_BOOKS } from 'bible-citation-text'

const model = defineModel({ type: String, default: '' })

const open = ref(false)
const activeIndex = ref(0)

const suggestions = computed(() => {
  const q = model.value.trim().toLowerCase()
  if (!q) return [...BIBLE_BOOKS].slice(0, 12)
  return BIBLE_BOOKS.filter((book) =>
    book.toLowerCase().includes(q),
  ).slice(0, 12)
})

function selectBook(book) {
  model.value = book
  open.value = false
}

function onFocus() {
  open.value = true
}

function onBlur() {
  window.setTimeout(() => {
    open.value = false
  }, 120)
}

function onKeydown(event) {
  if (!open.value && (event.key === 'ArrowDown' || event.key === 'Enter')) {
    open.value = true
    return
  }
  if (!suggestions.value.length) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % suggestions.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value =
      (activeIndex.value - 1 + suggestions.value.length) %
      suggestions.value.length
  } else if (event.key === 'Enter' && open.value) {
    event.preventDefault()
    selectBook(suggestions.value[activeIndex.value])
  } else if (event.key === 'Escape') {
    open.value = false
  }
}

function onInput() {
  open.value = true
  activeIndex.value = 0
}
</script>

<template>
  <div class="relative">
    <label class="block">
      <span class="eyebrow">Book</span>
      <input
        v-model="model"
        type="text"
        autocomplete="off"
        spellcheck="false"
        placeholder="Start typing a book…"
        class="field-input mt-1"
        role="combobox"
        :aria-expanded="open"
        aria-autocomplete="list"
        aria-controls="book-suggestions"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
        @input="onInput"
      />
    </label>

    <ul
      v-if="open && suggestions.length"
      id="book-suggestions"
      role="listbox"
      class="absolute z-20 mt-2 max-h-64 w-full overflow-auto border border-fg/25 bg-[#3a1520] py-2"
    >
      <li
        v-for="(book, index) in suggestions"
        :key="book"
        role="option"
        :aria-selected="index === activeIndex"
        class="cursor-pointer px-4 py-2.5 font-display text-fg transition"
        :class="
          index === activeIndex
            ? 'bg-gold/25 text-gold'
            : 'hover:bg-fg/10 hover:text-hover'
        "
        @mousedown.prevent="selectBook(book)"
        @mouseenter="activeIndex = index"
      >
        {{ book }}
      </li>
    </ul>
  </div>
</template>
