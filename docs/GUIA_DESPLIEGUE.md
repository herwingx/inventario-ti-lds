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

### ¿Desde dónde se sirve el frontend?
- El backend Express publica archivos estáticos desde `client/dist` cuando ese directorio existe.
- Si `client/dist` no existe, usa `server/public` como fallback de compatibilidad.
- Por eso, en despliegue siempre debes compilar el frontend antes de iniciar el servidor:
    ```bash
    cd client && npm run build
    ```

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

### Arranque recomendado con PM2 desde la raíz del monorepo
Si quieres automatizar build + arranque en puerto 3000:

```bash
cd /ruta/inventario-ti-lds
npm run build:prod
pm2 start npm --name "inventario-3000" -- run start:3000
pm2 save
pm2 startup
```

Comandos útiles de operación:

```bash
pm2 status
pm2 logs inventario-3000
pm2 restart inventario-3000
pm2 delete inventario-3000
```

### ¿Siempre se verá :3000 en la URL?
- **Sí**, si accedes directo al servicio Node (ej. `http://IP:3000/soporte/`).
- **No**, si usas proxy inverso (Nginx/Apache) en 80/443 y reenvías internamente a 3000.
- Ejemplo típico sin mostrar puerto: `https://erp.linea-digital.com/soporte/`.

5.  **Permisos de Directorios:**
    El sistema requiere permisos de escritura para el almacenamiento dinámico:
    - `server/storage` (Evidencias, firmas, tickets y PDFs)

---

## 🔄 Actualizaciones (CI/CD Manual)

Cuando traigas cambios desde GitHub, usa este flujo para que se reflejen en pantalla (especialmente cambios del frontend):

```bash
cd /ruta/inventario-ti-lds
git pull origin main
npm run setup
npm run build:prod
pm2 restart inventario-3000
```

Notas importantes:
- Si no ejecutas `npm run build:prod`, el backend seguirá sirviendo el build anterior de `client/dist`.
- Si cambiaste dependencias, `npm run setup` vuelve a instalar en `server/` y `client/`.
- Si actualizaste variables `.env`, reinicia el proceso con PM2 para que las tome.

### Ruta correcta para ejecutar PM2 en este monorepo

- Recomendado: ejecutar PM2 desde la **raíz del proyecto** `/ruta/inventario-ti-lds` usando scripts de `package.json` raíz.
- Comando recomendado:

```bash
cd /ruta/inventario-ti-lds
pm2 start npm --name "inventario-3000" -- run start:3000
```

- Alternativa válida (modo server directo): desde `/ruta/inventario-ti-lds/server` con:

```bash
pm2 start server.js --name "inventario-api"
```

- Si usas un nombre distinto en PM2, reemplázalo en `pm2 restart <nombre>` y `pm2 logs <nombre>`.

---

## 📈 Monitoreo y Mantenimiento
- **Estado:** `pm2 status`
- **Logs:** `pm2 logs inventario-api`
- **Backups:** Es imperativo respaldar la carpeta `server/storage/` diariamente junto con la base de datos MySQL para garantizar la integridad de los documentos firmados.