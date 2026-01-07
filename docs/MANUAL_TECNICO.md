# 📘 Manual Técnico - Inventario TI & Soporte LDS

Este manual está diseñado para el **Administrador del Sistema** o desarrollador encargado del mantenimiento de la aplicación. Describe los procesos operativos críticos para asegurar la continuidad del servicio.

---

## 🗄️ Mantenimiento de Base de Datos

El sistema utiliza MySQL. La integridad de los datos es prioritaria.

### 1. Copias de Seguridad (Backups)

Se recomienda realizar backups diarios automatizados.

**Comando Manual:**
```bash
# Formato: mysqldump -u [usuario] -p [nombre_db] > [archivo_salida]
mysqldump -u root -p inventario_soporte > backup_$(date +%Y%m%d).sql
```

**Restauración:**
```bash
# Formato: mysql -u [usuario] -p [nombre_db] < [archivo_entrada]
mysql -u root -p inventario_soporte < backup_20250101.sql
```

### 2. Verificación de Integridad

Si el sistema reporta errores de datos extraños, verificar la integridad de las tablas:

```sql
CHECK TABLE equipos;
CHECK TABLE asignaciones;
ANALYZE TABLE equipos;
```

---

## 🚀 Guía de Despliegue (Producción)

Para desplegar actualizaciones sin interrumpir el servicio (Zero Downtime con PM2).

### 1. Actualizar Código
```bash
cd /ruta/al/proyecto
git pull origin main
```

### 2. Backend (Node.js)
```bash
cd server
npm install --production # Solo si hubo cambios en package.json
pm2 reload inventario-api # Reinicio suave
```

### 3. Frontend (Vue.js)
```bash
cd client
npm install # Si cambiaron dependencias
npm run build
# No es necesario reiniciar Nginx si solo son archivos estáticos
```

### 4. Verificación Post-Despliegue
- Verificar logs del backend: `pm2 logs inventario-api`
- Verificar carga del frontend en navegador (Ctrl+F5 para limpiar caché).

---

## 🔧 Solución de Problemas Comunes (Troubleshooting)

### Error: "Network Error" / "No se puede conectar al servidor"
1. **Verificar si el backend corre:** `pm2 status`
2. **Verificar puertos:** Asegurarse que el puerto 3000 (o el configurado) no esté bloqueado por firewall.
3. **CORS:** Si el dominio del frontend cambió, actualizar la variable `CORS_ORIGIN` o la configuración en `server.js`.

### Error: "Token inválido" o Logout repentino
- Verificar si la fecha/hora del servidor es correcta (los tokens JWT dependen de la hora).
- Verificar si `JWT_SECRET` cambió en el archivo `.env`.

### Error: "Too many connections" (MySQL)
- El pool de conexiones está saturado. Reiniciar el servicio backend libera las conexiones: `pm2 restart inventario-api`.

---

## 🔑 Gestión de Credenciales

Las credenciales sensibles NUNCA deben estar en el código. Se gestionan en archivos `.env`:

| Archivo | Ubicación | Claves Críticas |
|:--------|:----------|:----------------|
| Backend | `server/.env` | `DB_PASSWORD`, `JWT_SECRET` |
| Frontend | `client/.env.production` | `VITE_API_URL` |

**Nota:** Si se pierde el `JWT_SECRET`, todos los usuarios tendrán que volver a iniciar sesión.

---

## 📅 Tareas Rutinarias Recomendadas

- **Semanal:** Revisar logs de PM2 por errores recurrentes (`pm2 logs --lines 100`).
- **Mensual:** Actualizar parches de seguridad de Node.js y paquetes (`npm audit`).
- **Trimestral:** Realizar prueba de restauración de backup en un entorno local.
