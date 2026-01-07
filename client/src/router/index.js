import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/home'
      },
      {
        path: 'home',
        name: 'home',
        component: () => import('../views/HomeView.vue'),
        meta: { title: 'Inicio' }
      },
      {
        path: 'equipos',
        name: 'equipos',
        component: () => import('../views/EquiposView.vue'),
        meta: { title: 'Equipos' }
      },
      {
        path: 'equipos/nuevo',
        name: 'equipos-nuevo',
        component: () => import('../views/EquiposFormView.vue'),
        meta: { title: 'Registrar Equipo' }
      },
      {
        path: 'equipos/editar/:id',
        name: 'equipos-editar',
        component: () => import('../views/EquiposFormView.vue'),
        meta: { title: 'Editar Equipo' }
      },
      {
        path: 'equipos/:id',
        name: 'equipos-detalle',
        component: () => import('../views/EquiposDetailView.vue'),
        meta: { title: 'Detalle de Equipo' }
      },
      // TODO: Agregar más rutas según se migren las vistas
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: 'Iniciar Sesión' }
  }
]

const router = createRouter({
  history: createWebHistory('/soporte/'),
  routes
})

// Guard global
router.beforeEach((to, from, next) => {
  // Cambiar título
  document.title = `${to.meta.title || 'Soporte'} - Linea Digital`

  const publicPages = ['/login']
  const authRequired = !publicPages.includes(to.path)
  const token = localStorage.getItem('token')

  if (authRequired && !token) {
    return next('/login')
  }

  // Si ya tiene token y quiere ir a login, redirigir a home
  if (to.path === '/login' && token) {
    return next('/home')
  }

  next()
})

export default router
