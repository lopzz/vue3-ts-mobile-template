import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('../views/home/index.vue'),
    },
    {
      path: '/testTable',
      name: 'testTable',
      component: () => import('../views/testTable/index.vue'),
    },
    {
      path: '/todo',
      name: 'todo',
      component: () => import('../views/todo/index.vue'),
    },
    {
      path: '/auditTools',
      name: 'auditTools',
      component: () => import('../views/auditTools/index.vue'),
    },
    {
      path: '/auditResources',
      name: 'auditResources',
      component: () => import('../views/auditResources/index.vue'),
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue'),
    // },
  ],
});

export default router;
