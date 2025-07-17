# Dockerfile para Apache Proxy
FROM httpd:2.4-alpine

# Información del mantenedor
LABEL maintainer="HerwingXTech"
LABEL description="Apache Proxy for Inventario Soporte Application"

# Instalar módulos necesarios y herramientas
RUN apk add --no-cache \
    apache2-proxy \
    apache2-utils \
    curl

# Habilitar módulos de Apache necesarios
RUN sed -i 's/#LoadModule rewrite_module/LoadModule rewrite_module/' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/#LoadModule proxy_module/LoadModule proxy_module/' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/#LoadModule proxy_http_module/LoadModule proxy_http_module/' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/#LoadModule headers_module/LoadModule headers_module/' /usr/local/apache2/conf/httpd.conf

# Crear directorio para archivos estáticos
RUN mkdir -p /usr/local/apache2/htdocs/inventario_soporte

# Copiar archivos estáticos (desde la raíz del proyecto)
COPY public /usr/local/apache2/htdocs/inventario_soporte/public

# Copiar configuración personalizada
COPY docker/apache/soporte.conf /usr/local/apache2/conf/extra/soporte.conf

# Incluir configuración personalizada en httpd.conf
RUN echo "Include conf/extra/soporte.conf" >> /usr/local/apache2/conf/httpd.conf

# Configurar permisos
RUN chown -R www-data:www-data /usr/local/apache2/htdocs/inventario_soporte || \
    chown -R daemon:daemon /usr/local/apache2/htdocs/inventario_soporte

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost/soporte/ || exit 1

# Exponer puerto
EXPOSE 80

# Comando por defecto
CMD ["httpd-foreground"]