import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from './views/LandingPage.vue'
import BibleLookupPage from './views/BibleLookupPage.vue'
import ViewerPage from './views/ViewerPage.vue'
import PlaygroundPage from './views/PlaygroundPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'landing', component: LandingPage },
    { path: '/bible', name: 'bible', component: BibleLookupPage },
    { path: '/view', name: 'view', component: ViewerPage },
    { path: '/playground', name: 'playground', component: PlaygroundPage },
    { path: '/try', redirect: { name: 'playground' } },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
