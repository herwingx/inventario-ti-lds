# Dockerfile para la aplicación Node.js
FROM node:18-alpine

# Información del mantenedor
LABEL maintainer="HerwingXTech"
LABEL description="Node.js Application for Inventario Soporte"

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero (para aprovechar cache de Docker)
COPY package*.json ./

# Instalar dependencias (incluyendo devDependencies para desarrollo) y curl para health check
RUN npm ci && \
    npm cache clean --force && \
    apk add --no-cache curl

# Copiar el código de la aplicación
COPY . .

# Cambiar ownership de los archivos a usuario nodejs
RUN chown -R nodejs:nodejs /app

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/db-test || exit 1

# Comando para iniciar la aplicación
# En desarrollo usa nodemon para reinicio automático
CMD ["npm", "run", "dev"]
