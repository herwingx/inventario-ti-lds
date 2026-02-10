# 🚀 Guía de Despliegue (DevOps)

> **Producción:** Procedimientos para el despliegue estable del sistema.

---

## 🏗️ Infraestructura Recomendada
- **SO:** Ubuntu 22.04 LTS o superior.
- **Runtime:** Node.js 18+ LTS.
- **Gestor de Procesos:** PM2.
- **Proxy Inverso:** Nginx o Apache.

## ⚙️ Configuración de Red y Base URL

El sistema está arquitecturado para funcionar bajo el sub-directorio `/soporte/`. Esto es crítico para la resolución de rutas en el frontend y la API.

### Requerimientos de Dominio
- **Base URL:** `/soporte/` (Definido en `vite.config.js` y `router/index.js`).
- **Proxy Inverso:** El servidor (Nginx/Apache) debe redirigir el tráfico de `erp.linea-digital.com/soporte` hacia el puerto interno de la API (ej. 3000).

### Ejemplo de Configuración Nginx (Snippet):
```nginx
location /soporte/ {
    proxy_pass http://localhost:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Prefix /soporte;
}
```

---

## 🛠️ Pasos de Despliegue (Fresh Install)

1.  **Preparar Entorno:**
    ```bash
    git clone https://github.com/herwingx/inventario-ti-lds.git
    npm run setup
    ```

2.  **Configuración (.env):**
    Asegúrate de que `NODE_ENV=production` y que las credenciales de BD y `JWT_SECRET` sean seguras.

3.  **Build del Frontend:**
    ```bash
    cd client && npm run build
    ```

4.  **Lanzamiento del Backend:**
    ```bash
    cd server
    pm2 start server.js --name "inventario-api"
    ```

5.  **Permisos de Directorios:**
    El sistema requiere permisos de escritura para el almacenamiento dinámico:
    - `server/public/uploads` (Evidencias de tickets/mantenimiento)
    - `server/storage` (Vault privado de firmas y PDFs)

---

## 🔄 Actualizaciones (CI/CD Manual)

```bash
git pull origin main
npm run setup
cd client && npm run build
pm2 reload inventario-api
```

---

## 📈 Monitoreo y Mantenimiento
- **Estado:** `pm2 status`
- **Logs:** `pm2 logs inventario-api`
- **Backups:** Es imperativo respaldar la carpeta `server/storage/` diariamente junto con la base de datos MySQL para garantizar la integridad de los documentos firmados.