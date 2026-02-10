# 🚀 Guía de Despliegue (DevOps)

> **Producción:** Procedimientos para el despliegue estable del sistema.

---

## 🏗️ Infraestructura Recomendada
- **SO:** Ubuntu 22.04 LTS o superior.
- **Runtime:** Node.js 18+ LTS.
- **Gestor de Procesos:** PM2.
- **Proxy Inverso:** Nginx o Apache.

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

---

## 🔄 Actualizaciones (CI/CD Manual)

```bash
git pull origin main
npm run setup
cd client && npm run build
pm2 reload inventario-api
```

---

## 📈 Monitoreo y Logs
- Ver estado: `pm2 status`
- Ver logs en tiempo real: `pm2 logs inventario-api`
- Monitoreo de recursos: `pm2 monit`