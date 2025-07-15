# Inventario Soporte - Guía de Despliegue con Docker

Este documento explica cómo configurar, desplegar y solucionar problemas del sistema de inventario de soporte utilizando Docker y Docker Compose.

## 🚀 Inicio Rápido

Sigue estos pasos para levantar el proyecto en un entorno de desarrollo o producción.

1.  **Clonar el Repositorio (si es necesario)**
    ```bash
    git clone <url-del-repositorio>
    cd inventario_soporte
    ```

2.  **Configurar el Entorno**

    Crea un archivo llamado `.env` a partir del ejemplo proporcionado. Este archivo es **crucial** para configurar la aplicación.
    ```bash
    cp .env.example .env
    ```
    Abre el archivo `.env` y **modifica la variable `APP_URL`** para que use la dirección IP de la máquina donde se ejecuta Docker. Esto es **esencial** para que la aplicación sea accesible desde otros dispositivos en la misma red.

    **Ejemplo de `.env` para acceso en red local:**
    ```env
    # Reemplaza 192.168.0.253 con la IP de tu máquina
    APP_URL=http://192.168.0.253/soporte
    API_URL=http://192.168.0.253/soporte/api

    # El resto de las variables pueden mantener sus valores por defecto
    # ...
    ```

3.  **Levantar los Servicios**

    Usa Docker Compose para construir las imágenes y levantar los contenedores en segundo plano.
    ```bash
    docker compose up -d --build
    ```

4.  **Verificar el Estado**

    Asegúrate de que todos los contenedores estén en funcionamiento.
    ```bash
    docker compose ps
    ```
    Deberías ver tres contenedores (`inventario-mysql-db`, `inventario-nodejs-app`, `inventario-apache-proxy`) con el estado `running` o `up`.

5.  **Acceder a la Aplicación**

    Abre tu navegador y ve a la URL que configuraste:
    `http://<TU_IP_LOCAL>/soporte` (ej. `http://192.168.0.253/soporte`)

---

## 🔧 Configuración Detallada

### El Archivo `.env`

El archivo `.env` es la forma centralizada de gestionar la configuración de la aplicación sin tener que modificar el código o los archivos de Docker. Docker Compose lo lee automáticamente al iniciar los servicios.

#### Variables Clave de Entorno

*   **`APP_URL` y `API_URL` (¡Muy Importantes!)**
    *   **Propósito**: Estas variables le dicen al frontend (y al backend) cuál es la URL base para hacer peticiones y cargar recursos (como archivos CSS, JS e imágenes).
    *   **Problema que resuelven**: Si se deja como `localhost`, la aplicación solo funcionará en la máquina donde corre Docker. Al acceder desde otro dispositivo, el navegador intentará conectarse a `localhost` (a sí mismo) y fallará.
    *   **Configuración Correcta**: Debes usar la dirección IP de la máquina anfitriona de Docker que sea visible en tu red local (ej. `192.168.0.253`).

*   **`DB_HOST`**:
    *   **`inventario-db`**: Valor por defecto para usar el contenedor de MySQL gestionado por Docker Compose.
    *   **`<IP_REMOTA>`**: Si quieres conectarte a una base de datos externa.

*   **`MYSQL_ROOT_PASSWORD`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`**:
    *   Credenciales para la creación y acceso a la base de datos en el contenedor de MySQL. Deben coincidir con las variables `DB_USER`, `DB_PASSWORD`, etc.

### Arquitectura de Contenedores

El sistema se compone de tres servicios principales orquestados por `docker-compose.yml`:

1.  **`inventario-mysql-db`**:
    *   **Imagen**: `mysql:8.0`
    *   **Propósito**: Contenedor de la base de datos. Persiste los datos en un volumen de Docker (`mysql_data`) para que no se pierdan al reiniciar.

2.  **`inventario-nodejs-app`**:
    *   **Imagen**: Construida desde `Dockerfile.nodejs`.
    *   **Propósito**: Contiene la lógica de negocio de la aplicación (API y backend). No está expuesta directamente al exterior, solo es accesible a través del proxy de Apache.

3.  **`apache-proxy`**:
    *   **Imagen**: Construida desde `Dockerfile.apache`.
    *   **Propósito**: Actúa como un **proxy inverso**. Es el único punto de entrada a la aplicación.
    *   **Funciones**:
        *   Recibe todo el tráfico en el **puerto 80**.
        *   Sirve los **archivos estáticos** (CSS, JS, imágenes) directamente desde la carpeta `public`.
        *   Redirige las peticiones a la API (ej. `/soporte/api/...`) al contenedor de Node.js.

## ⚙️ Comandos Útiles de Docker

*   **Detener todos los servicios:**
    ```bash
    docker compose down
    ```

*   **Ver logs en tiempo real:**
    ```bash
    docker compose logs -f
    ```

*   **Ver logs de un servicio específico:**
    ```bash
    docker compose logs -f inventario-nodejs-app
    ```

*   **Forzar la reconstrucción de las imágenes:**
    *   Útil si has hecho cambios en un `Dockerfile` o en el código fuente.
    *   `--no-cache` asegura que todo se reconstruya desde cero.
    ```bash
    docker compose up -d --build --no-cache
    ```

*   **Limpiar caché de construcción de Docker (si hay errores extraños):**
    ```bash
    docker builder prune -a -f
    ```

## 🚨 Solución de Problemas Comunes

*   **No puedo acceder desde otro equipo en la red:**
    1.  **Verifica `APP_URL`**: Asegúrate de que `APP_URL` en tu archivo `.env` contiene la IP correcta de la máquina anfitriona, no `localhost`.
    2.  **Firewall**: Comprueba que el firewall de tu sistema operativo (en la máquina con Docker) no esté bloqueando las conexiones entrantes en el puerto 80.
    3.  **Conectividad de Red**: Asegúrate de que ambos dispositivos estén en la misma red y que puedan hacerse `ping` entre ellos.

*   **El contenedor `inventario-nodejs-app` se reinicia en bucle:**
    *   **Causa probable**: Error de conexión a la base de datos o un error en el código de `server.js`.
    *   **Solución**: Revisa los logs para ver el mensaje de error específico.
        ```bash
        docker compose logs inventario-nodejs-app
        ```
    *   Verifica que las credenciales de la base de datos en `.env` sean correctas.

*   **Error de "snapshot" o caché durante la construcción:**
    *   **Causa**: La caché de Docker puede corromperse.
    *   **Solución**: Limpia la caché de construcción y vuelve a intentarlo.
        ```bash
        docker builder prune -a -f
        docker compose up -d --build
        ```