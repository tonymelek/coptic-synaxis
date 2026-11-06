<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import {
  DEMOS,
  FORMATS,
  getSnippet,
  runPlayground,
} from '../lib/playground.js'

const demoId = ref('readings')
const formatId = ref('mjs')
const code = ref(getSnippet('readings', 'mjs'))
const output = ref('Press Run to execute against the real packages.')
const ok = ref(true)
const running = ref(false)
const dirty = ref(false)
const editorEl = ref(null)

const activeDemo = computed(
  () => DEMOS.find((d) => d.id === demoId.value) ?? DEMOS[0],
)

const fileLabel = computed(() => {
  const ext = FORMATS.find((f) => f.id === formatId.value)?.ext ?? 'mjs'
  return `playground.${ext}`
})

watch([demoId, formatId], () => {
  if (!dirty.value) {
    code.value = getSnippet(demoId.value, formatId.value)
  }
})

function selectDemo(id) {
  dirty.value = false
  demoId.value = id
  code.value = getSnippet(id, formatId.value)
}

function selectFormat(id) {
  dirty.value = false
  formatId.value = id
  code.value = getSnippet(demoId.value, id)
}

function onEdit() {
  dirty.value = true
}

function reset() {
  dirty.value = false
  code.value = getSnippet(demoId.value, formatId.value)
  output.value = 'Press Run to execute against the real packages.'
  ok.value = true
}

async function run() {
  running.value = true
  output.value = 'Running…'
  ok.value = true
  await nextTick()
  const result = await runPlayground(code.value)
  ok.value = result.ok
  output.value = result.output
  running.value = false
}
</script>

<template>
  <div class="playground">
    <div class="mb-8 max-w-2xl">
      <p class="eyebrow">Packages</p>
      <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        Playground
      </h1>
      <p class="mt-3 text-fg-muted leading-relaxed">
        Edit real snippets for
        <span class="text-gold">coptic-readings</span>
        and
        <span class="text-gold">bible-citation-text</span>,
        then Run — output comes from the installed packages, not mocks.
        Switch between <code class="text-hover">.mjs</code> and <code class="text-hover">.cjs</code>
        (packages also ship TypeScript types for your own projects).
      </p>
    </div>

    <div
      class="mb-4 flex flex-wrap gap-2"
      role="tablist"
      aria-label="Demo"
    >
      <button
        v-for="demo in DEMOS"
        :key="demo.id"
        type="button"
        role="tab"
        class="playground-chip"
        :class="{ 'is-active': demoId === demo.id }"
        :aria-selected="demoId === demo.id"
        @click="selectDemo(demo.id)"
      >
        {{ demo.label }}
      </button>
    </div>
    <p class="mb-6 text-sm text-fg-subtle">
      {{ activeDemo.blurb }}
    </p>

    <div class="playground-stage">
      <div class="playground-pane">
        <div class="playground-toolbar">
          <div
            class="flex flex-wrap gap-1"
            role="tablist"
            aria-label="Module format"
          >
            <button
              v-for="fmt in FORMATS"
              :key="fmt.id"
              type="button"
              role="tab"
              class="playground-tab"
              :class="{ 'is-active': formatId === fmt.id }"
              :aria-selected="formatId === fmt.id"
              @click="selectFormat(fmt.id)"
            >
              {{ fmt.label }}
            </button>
          </div>
          <span class="playground-file">{{ fileLabel }}</span>
        </div>

        <label class="sr-only" for="playground-code">Code editor</label>
        <textarea
          id="playground-code"
          ref="editorEl"
          v-model="code"
          class="playground-editor"
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          rows="16"
          @input="onEdit"
        />

        <div class="playground-actions">
          <button
            type="button"
            class="btn-run"
            :disabled="running"
            @click="run"
          >
            {{ running ? 'Running…' : 'Run' }}
          </button>
          <button
            type="button"
            class="btn-ghost"
            :disabled="running"
            @click="reset"
          >
            Reset
          </button>
          <a
            href="/packages.html"
            class="ms-auto text-sm text-fg-muted no-underline transition hover:text-hover"
          >
            Install snippets →
          </a>
        </div>
      </div>

      <div class="playground-pane playground-pane--out">
        <div class="playground-toolbar">
          <span class="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
            Output
          </span>
          <span
            class="text-xs"
            :class="ok ? 'text-fg-subtle' : 'text-red-300'"
          >
            {{ ok ? 'console' : 'error' }}
          </span>
        </div>
        <pre
          class="playground-output"
          :class="{ 'is-error': !ok }"
          aria-live="polite"
        >{{ output }}</pre>
      </div>
    </div>

    <p class="mt-6 text-sm text-fg-subtle">
      Tip: change the date or citation string, then Run again.
      Imports are provided for you in this sandbox.
    </p>
  </div>
</template>
