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
      {
        path: 'empleados',
        name: 'empleados',
        component: () => import('../views/EmpleadosView.vue'),
        meta: { title: 'Empleados' }
      },
      {
        path: 'empleados/nuevo',
        name: 'empleados-nuevo',
        component: () => import('../views/EmpleadosFormView.vue'),
        meta: { title: 'Registrar Empleado' }
      },
      {
        path: 'empleados/editar/:id',
        name: 'empleados-editar',
        component: () => import('../views/EmpleadosFormView.vue'),
        meta: { title: 'Editar Empleado' }
      },
      {
        path: 'empleados/:id',
        name: 'empleados-detalle',
        component: () => import('../views/EmpleadosDetailView.vue'),
        meta: { title: 'Detalle de Empleado' }
      },
      {
        path: 'areas',
        name: 'areas',
        component: () => import('../views/AreasView.vue'),
        meta: { title: 'Áreas' }
      },
      {
        path: 'areas/nuevo',
        name: 'areas-nuevo',
        component: () => import('../views/AreasFormView.vue'),
        meta: { title: 'Registrar Área' }
      },
      {
        path: 'areas/editar/:id',
        name: 'areas-editar',
        component: () => import('../views/AreasFormView.vue'),
        meta: { title: 'Editar Área' }
      },
      {
        path: 'areas/:id',
        name: 'areas-detalle',
        component: () => import('../views/AreasDetailView.vue'),
        meta: { title: 'Detalle de Área' }
      },
      {
        path: 'direcciones-ip',
        name: 'direcciones-ip',
        component: () => import('../views/DireccionesIpView.vue'),
        meta: { title: 'Gestión de Red' }
      },
      {
        path: 'direcciones-ip/nuevo',
        name: 'direcciones-ip-nuevo',
        component: () => import('../views/DireccionesIpFormView.vue'),
        meta: { title: 'Registrar Dirección IP' }
      },
      {
        path: 'direcciones-ip/editar/:id',
        name: 'direcciones-ip-editar',
        component: () => import('../views/DireccionesIpFormView.vue'),
        meta: { title: 'Editar Dirección IP' }
      },
      {
        path: 'direcciones-ip/:id',
        name: 'direcciones-ip-detalle',
        component: () => import('../views/DireccionesIpDetailView.vue'),
        meta: { title: 'Detalle de Dirección IP' }
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
