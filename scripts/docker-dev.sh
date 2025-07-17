#!/bin/bash
# Script de utilidad para desarrollo con Docker
# Uso: ./scripts/docker-dev.sh [comando]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Cambiar al directorio docker para ejecutar docker-compose
DOCKER_DIR="$(dirname "$0")/../docker"
cd "$DOCKER_DIR"

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}🐳 Inventario Soporte - Script de Desarrollo${NC}"
    echo ""
    echo "Comandos disponibles:"
    echo -e "  ${GREEN}start${NC}     - Iniciar todos los servicios"
    echo -e "  ${GREEN}dev${NC}       - Modo desarrollo (con recarga automática)"
    echo -e "  ${GREEN}stop${NC}      - Detener todos los servicios"
    echo -e "  ${GREEN}restart${NC}   - Reiniciar todos los servicios"
    echo -e "  ${GREEN}rebuild${NC}   - Reconstruir e iniciar servicios"
    echo -e "  ${GREEN}logs${NC}      - Ver logs de todos los servicios"
    echo -e "  ${GREEN}logs-app${NC}  - Ver logs solo de la aplicación"
    echo -e "  ${GREEN}logs-db${NC}   - Ver logs solo de la base de datos"
    echo -e "  ${GREEN}seed${NC}      - Crear usuario administrador"
    echo -e "  ${GREEN}status${NC}    - Ver estado de los contenedores"
    echo -e "  ${GREEN}clean${NC}     - Limpiar todo (¡BORRA DATOS!)"
    echo -e "  ${GREEN}shell-app${NC} - Entrar al contenedor de la app"
    echo -e "  ${GREEN}shell-db${NC}  - Entrar al contenedor de MySQL"
    echo -e "  ${GREEN}backup${NC}    - Hacer backup de la base de datos"
    echo -e "  ${GREEN}help${NC}      - Mostrar esta ayuda"
}

# Función para verificar si Docker está corriendo
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker no está corriendo. Por favor inicia Docker primero.${NC}"
        exit 1
    fi
}

# Función para verificar si existe el archivo .env
check_env() {
    if [ ! -f ".env" ]; then
        echo -e "${RED}❌ No se encontró el archivo .env${NC}"
        echo ""
        echo -e "${YELLOW}📋 Para configurar el proyecto por primera vez:${NC}"
        echo -e "   ${GREEN}1.${NC} Copia el archivo de ejemplo:"
        echo -e "      ${BLUE}cp .env.example .env${NC}"
        echo ""
        echo -e "   ${GREEN}2.${NC} Edita el archivo .env con tus configuraciones:"
        echo -e "      ${BLUE}nano .env${NC} ${YELLOW}# o tu editor preferido${NC}"
        echo ""
        echo -e "   ${GREEN}3.${NC} Asegúrate de configurar:"
        echo -e "      • ${YELLOW}APP_URL${NC} y ${YELLOW}API_URL${NC} con tu IP local"
        echo -e "      • ${YELLOW}JWT_SECRET${NC} (genera uno nuevo)"
        echo ""
        echo -e "${BLUE}💡 Tip: Genera JWT_SECRET con:${NC}"
        echo -e "   ${GREEN}node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"${NC}"
        echo ""
        exit 1
    fi
}

# Función para esperar a que la DB esté lista
wait_for_db() {
    echo -e "${YELLOW}⏳ Esperando a que la base de datos esté lista...${NC}"
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker compose -p inventario-ti exec inventario-db mysqladmin ping -h localhost -u root -p"${MYSQL_ROOT_PASSWORD:-herwingx-dev}" --silent > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Base de datos lista!${NC}"
            return 0
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    echo -e "${RED}❌ Timeout esperando la base de datos${NC}"
    return 1
}

case "$1" in
    start)
        check_docker
        check_env
        echo -e "${BLUE}🚀 Iniciando servicios...${NC}"
        docker compose -p inventario-ti up -d
        echo -e "${GREEN}✅ Servicios iniciados!${NC}"
        echo -e "${YELLOW}💡 Usa './scripts/docker-dev.sh seed' para crear el usuario admin${NC}"
        ;;
    
    dev)
        check_docker
        check_env
        echo -e "${BLUE}🚀 Iniciando servicios en modo desarrollo...${NC}"
        echo -e "${YELLOW}📝 Los cambios en el código se reflejarán automáticamente${NC}"
        docker compose -p inventario-ti up
        ;;
    
    stop)
        echo -e "${BLUE}🛑 Deteniendo servicios...${NC}"
        docker compose -p inventario-ti down
        echo -e "${GREEN}✅ Servicios detenidos!${NC}"
        ;;
    
    restart)
        check_env
        echo -e "${BLUE}🔄 Reiniciando servicios...${NC}"
        docker compose -p inventario-ti down
        docker compose -p inventario-ti up -d
        echo -e "${GREEN}✅ Servicios reiniciados!${NC}"
        ;;
    
    rebuild)
        check_docker
        check_env
        echo -e "${BLUE}🔨 Reconstruyendo servicios...${NC}"
        docker compose -p inventario-ti down
        docker compose -p inventario-ti up -d --build
        echo -e "${GREEN}✅ Servicios reconstruidos!${NC}"
        ;;
    
    logs)
        docker compose -p inventario-ti logs -f
        ;;
    
    logs-app)
        docker compose -p inventario-ti logs -f inventario-app
        ;;
    
    logs-db)
        docker compose -p inventario-ti logs -f inventario-db
        ;;
    
    seed)
        check_docker
        if wait_for_db; then
            echo -e "${BLUE}👤 Creando usuario administrador...${NC}"
            docker compose -p inventario-ti exec inventario-app node seedAdmin.js
        fi
        ;;
    
    status)
        docker compose -p inventario-ti ps
        ;;
    
    clean)
        echo -e "${RED}⚠️  ADVERTENCIA: Esto eliminará TODOS los datos!${NC}"
        read -p "¿Estás seguro? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}🧹 Limpiando todo...${NC}"
            docker compose -p inventario-ti down -v
            docker system prune -f
            echo -e "${GREEN}✅ Limpieza completada!${NC}"
        else
            echo -e "${YELLOW}❌ Operación cancelada${NC}"
        fi
        ;;
    
    shell-app)
        docker compose -p inventario-ti exec inventario-app sh
        ;;
    
    shell-db)
        docker compose -p inventario-ti exec inventario-db bash
        ;;
    
    backup)
        echo -e "${BLUE}💾 Creando backup de la base de datos...${NC}"
        timestamp=$(date +%Y%m%d_%H%M%S)
        # Crear backup en el directorio raíz del proyecto
        docker compose -p inventario-ti exec inventario-db mysqladmin ping -h localhost -u root -p"${MYSQL_ROOT_PASSWORD:-herwingx-dev}" --silent
        docker compose -p inventario-ti exec inventario-db mysqldump -u herwingxtech -p'herwingx-dev' inventario_soporte > "../backup_${timestamp}.sql"
        echo -e "${GREEN}✅ Backup creado: backup_${timestamp}.sql${NC}"
        ;;
    
    help|--help|-h|"")
        show_help
        ;;
    
    *)
        echo -e "${RED}❌ Comando desconocido: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac