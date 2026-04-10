import { createRouter, createWebHistory } from 'vue-router'

/**
 * @fileoverview Configuración del Enrutador Principal.
 * Define la estructura de navegación, rutas públicas/privadas y lógica de guardias de navegación.
 */
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
        path: 'empresas',
        name: 'empresas',
        component: () => import('../views/EmpresasView.vue'),
        meta: { title: 'Gestión de Empresas' }
      },
      {
        path: 'empresas/nuevo',
        name: 'empresas-nuevo',
        component: () => import('../views/EmpresasFormView.vue'),
        meta: { title: 'Registrar Empresa' }
      },
      {
        path: 'empresas/editar/:id',
        name: 'empresas-editar',
        component: () => import('../views/EmpresasFormView.vue'),
        meta: { title: 'Editar Empresa' }
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
        path: 'sucursales',
        name: 'sucursales',
        component: () => import('../views/SucursalesView.vue'),
        meta: { title: 'Gestión de Sucursales' }
      },
      {
        path: 'sucursales/nuevo',
        name: 'sucursales-nuevo',
        component: () => import('../views/SucursalesFormView.vue'),
        meta: { title: 'Registrar Sucursal' }
      },
      {
        path: 'sucursales/editar/:id',
        name: 'sucursales-editar',
        component: () => import('../views/SucursalesFormView.vue'),
        meta: { title: 'Editar Sucursal' }
      },
      {
        path: 'sucursales/:id',
        name: 'sucursales-detalle',
        component: () => import('../views/SucursalesDetailView.vue'),
        meta: { title: 'Detalle de Sucursal' }
      },
      {
        path: 'mantenimientos',
        name: 'mantenimientos',
        component: () => import('../views/MantenimientosView.vue'),
        meta: { title: 'Mantenimientos' }
      },
      {
        path: 'mantenimientos/nuevo',
        name: 'mantenimientos-nuevo',
        component: () => import('../views/MantenimientosFormView.vue'),
        meta: { title: 'Nuevo Mantenimiento' }
      },
      {
        path: 'mantenimientos/:id/editar',
        name: 'mantenimientos-editar',
        component: () => import('../views/MantenimientosFormView.vue'),
        meta: { title: 'Editar Mantenimiento' }
      },
      // Notas
      {
        path: 'notas',
        name: 'notas',
        component: () => import('../views/NotasView.vue'),
        meta: { title: 'Gestión de Notas' }
      },
      {
        path: 'notas/nuevo',
        name: 'notas-nuevo',
        component: () => import('../views/NotasFormView.vue'),
        meta: { title: 'Nueva Nota' }
      },
      {
        path: 'notas/:id/editar',
        name: 'notas-editar',
        component: () => import('../views/NotasFormView.vue'),
        meta: { title: 'Editar Nota' }
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
      {
        path: 'asignaciones',
        name: 'asignaciones',
        component: () => import('../views/AsignacionesView.vue'),
        meta: { title: 'Asignaciones' }
      },
      {
        path: 'asignaciones/nuevo',
        name: 'asignaciones-nuevo',
        component: () => import('../views/AsignacionesFormView.vue'),
        meta: { title: 'Registrar Asignación' }
      },
      {
        path: 'asignaciones/:id',
        name: 'asignaciones-detalle',
        component: () => import('../views/AsignacionesDetailView.vue'),
        meta: { title: 'Detalle de Asignación' }
      },
      {
        path: 'asignaciones/editar/:id',
        name: 'asignaciones-editar',
        component: () => import('../views/AsignacionesFormView.vue'),
        meta: { title: 'Editar Asignación' }
      },
      {
        path: 'cuentas-email',
        name: 'correos', // Mantengo el name interno si quiero, o lo cambio. Cambiémoslo para consistencia.
        component: () => import('../views/CorreosView.vue'),
        meta: { title: 'Gestión de Correos' }
      },
      {
        path: 'cuentas-email/nuevo',
        name: 'correos-nuevo',
        component: () => import('../views/CorreosFormView.vue'),
        meta: { title: 'Registrar Cuenta de Correo' }
      },
      {
        path: 'cuentas-email/editar/:id',
        name: 'correos-editar',
        component: () => import('../views/CorreosFormView.vue'),
        meta: { title: 'Editar Cuenta de Correo' }
      },
      {
        path: 'cuentas-email/:id',
        name: 'correos-detalle',
        component: () => import('../views/CorreosDetailView.vue'),
        meta: { title: 'Detalle de Cuenta' }
      },
      // Perfil de usuario
      {
        path: 'perfil',
        name: 'perfil',
        component: () => import('../views/ProfileView.vue'),
        meta: { title: 'Mi Perfil' }
      },
      // Tickets de Soporte (Fase 2)
      {
        path: 'tickets',
        name: 'tickets',
        component: () => import('../views/TicketsView.vue'),
        meta: { title: 'Tickets Activos' }
      },
      {
        path: 'tickets/nuevo',
        name: 'tickets-nuevo',
        component: () => import('../views/TicketCreateView.vue'),
        meta: { title: 'Nuevo Ticket' }
      },
      {
        path: 'tickets/historial',
        name: 'tickets-historial',
        component: () => import('../views/TicketsHistoryView.vue'),
        meta: { title: 'Historial de Soporte' }
      },
      {
        path: 'tickets/:id',
        name: 'tickets-detalle',
        component: () => import('../views/TicketsDetailView.vue'),
        meta: { title: 'Detalle de Ticket' }
      },
    ]
  },
  // Rutas Públicas QR (Fase 2) - Sin MainLayout ni autenticación
  {
    path: '/q/:token',
    name: 'qr-landing',
    component: () => import('../views/QrLandingView.vue'),
    meta: { title: 'Reporte de Falla', public: true }
  },
  {
    path: '/q/ticket/:ticketToken',
    name: 'ticket-tracking',
    component: () => import('../views/TicketTrackingView.vue'),
    meta: { title: 'Seguimiento de Ticket', public: true }
  },
  {
    path: '/ayuda',
    name: 'soporte-manual',
    component: () => import('../views/TicketManualEntryView.vue'),
    meta: { title: 'Acceso a Soporte', public: true }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: 'Iniciar Sesión' }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { title: 'Crear cuenta' }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('../views/ForgotPasswordView.vue'),
    meta: { title: 'Recuperar Contraseña' }
  },
  {
    path: '/reset-password/:token',
    name: 'reset-password',
    component: () => import('../views/ResetPasswordView.vue'),
    meta: { title: 'Restablecer Contraseña' }
  }
]

const router = createRouter({
  history: createWebHistory('/soporte/'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Si hay una posición guardada (navegación con botones atrás/adelante), usarla
    if (savedPosition) {
      return savedPosition
    }
    // Si hay un hash en la URL, hacer scroll a ese elemento
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    // Por defecto, siempre hacer scroll al inicio de la página
    return { top: 0, behavior: 'smooth' }
  }
})

// Guard global
router.beforeEach((to, from, next) => {
  // Cambiar título
  document.title = `${to.meta.title || 'Soporte'} - Linea Digital`

  // Definir nombres de rutas públicas
  const publicNames = ['login', 'register', 'forgot-password', 'reset-password']

  // Validar si la ruta hacia la que vamos es pública
  const isPublic = publicNames.includes(to.name) || to.meta?.public
  const token = localStorage.getItem('token')

  if (!isPublic && !token) {
    return next('/login')
  }

  const userData = (() => {
    try {
      return JSON.parse(localStorage.getItem('userData') || 'null')
    } catch {
      return null
    }
  })()

  if (token && userData?.roleId === 2 && !isPublic) {
    const allowedNames = ['tickets', 'tickets-detalle', 'tickets-nuevo']
    if (!allowedNames.includes(to.name)) {
      return next('/tickets')
    }
  }

  // Si ya tiene token y quiere ir a login o registro, redirigir a su vista principal
  if ((to.path === '/login' || to.path === '/register') && token) {
    return next(userData?.roleId === 2 ? '/tickets' : '/home')
  }

  next()
})

export default router
