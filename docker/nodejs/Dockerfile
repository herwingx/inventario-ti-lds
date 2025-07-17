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

# Instalar dependencias como root
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar el código de la aplicación
COPY . .

# Cambiar ownership de los archivos a usuario nodejs
RUN chown -R nodejs:nodejs /app

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/db-test', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Comando para iniciar la aplicación
CMD ["node", "server.js"]