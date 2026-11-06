<script setup>
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()
const menuOpen = ref(false)
const logoSrc = `${import.meta.env.BASE_URL}images/logo-gold.png`

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <div
    class="page-shell"
    :class="{ 'page-shell--wide': route.name === 'playground' }"
  >
    <header class="app-header mb-10 border-b border-fg/20 pb-5 sm:mb-14 sm:pb-6">
      <div class="flex items-end justify-between gap-4">
        <RouterLink
          to="/"
          class="group flex min-w-0 items-center gap-3 no-underline sm:gap-3.5"
          @click="closeMenu"
        >
          <img
            :src="logoSrc"
            alt=""
            class="h-10 w-10 shrink-0 sm:h-11 sm:w-11"
            width="44"
            height="44"
            decoding="async"
          />
          <span class="min-w-0">
            <p class="font-display text-[1.75rem] font-semibold leading-none tracking-tight text-gold transition duration-300 group-hover:text-hover sm:text-4xl">
              Coptic Synaxis
            </p>
            <p class="mt-2 text-sm text-fg-muted">
              Seasons, readings &amp; scripture
            </p>
          </span>
        </RouterLink>

        <nav
          class="hidden items-center gap-x-5 pb-1 md:flex"
          aria-label="Primary"
        >
          <a
            href="/"
            class="nav-link"
          >
            Home
          </a>
          <RouterLink
            to="/"
            class="nav-link"
          >
            Today
          </RouterLink>
          <RouterLink
            to="/bible"
            class="nav-link inline-flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="size-4"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
              />
            </svg>
            Read Bible
          </RouterLink>
        </nav>

        <button
          type="button"
          class="app-menu-toggle md:hidden"
          :aria-expanded="menuOpen"
          aria-controls="app-mobile-nav"
          aria-label="Toggle navigation menu"
          @click="toggleMenu"
        >
          <svg
            v-if="!menuOpen"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            class="size-6"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.75"
              d="M4 7h16M4 12h16M4 17h16"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            class="size-6"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.75"
              d="M6 6l12 12M18 6L6 18"
            />
          </svg>
        </button>
      </div>

      <nav
        id="app-mobile-nav"
        class="app-mobile-nav md:hidden"
        :class="{ 'is-open': menuOpen }"
        aria-label="Primary mobile"
      >
        <a
          href="/"
          class="app-mobile-link"
          @click="closeMenu"
        >
          Home
        </a>
        <RouterLink
          to="/"
          class="app-mobile-link"
          @click="closeMenu"
        >
          Today
        </RouterLink>
        <RouterLink
          to="/bible"
          class="app-mobile-link"
          @click="closeMenu"
        >
          Read Bible
        </RouterLink>
      </nav>
    </header>

    <main
      :key="route.fullPath"
      class="flex flex-1 flex-col"
    >
      <RouterView />
    </main>
  </div>
</template>
