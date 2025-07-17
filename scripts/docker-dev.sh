#!/bin/bash
# Script de utilidad para desarrollo con Docker - VERSION ROBUSTA
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
    echo -e "  ${GREEN}fix${NC}       - Reparar servicios problemáticos"
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

# Función mejorada para esperar a que la DB esté lista
wait_for_db() {
    echo -e "${YELLOW}⏳ Esperando a que la base de datos esté lista...${NC}"
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker compose -p inventario-ti exec inventario-db mysqladmin ping -h localhost -u root -p"${MYSQL_ROOT_PASSWORD:-herwingx-dev}" --silent > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Base de datos lista!${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}   Intento $attempt/$max_attempts - Esperando...${NC}"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ Timeout esperando la base de datos${NC}"
    echo -e "${YELLOW}💡 Puedes intentar:${NC}"
    echo -e "   ${GREEN}1.${NC} Ver logs: ./scripts/docker-dev.sh logs-db"
    echo -e "   ${GREEN}2.${NC} Reiniciar: ./scripts/docker-dev.sh restart"
    return 1
}

# Función para verificar el estado de los contenedores
check_containers_health() {
    echo -e "${BLUE}🔍 Verificando estado de contenedores...${NC}"
    
    # Verificar MySQL
    if docker compose -p inventario-ti ps | grep -q "soporte-mysql-db.*Up.*healthy"; then
        echo -e "${GREEN}✅ MySQL: Saludable${NC}"
    else
        echo -e "${RED}❌ MySQL: Problemas detectados${NC}"
        return 1
    fi
    
    # Verificar App
    if docker compose -p inventario-ti ps | grep -q "soporte-nodejs-app.*Up"; then
        echo -e "${GREEN}✅ App: Funcionando${NC}"
    else
        echo -e "${RED}❌ App: Problemas detectados${NC}"
        return 1
    fi
    
    # Verificar Apache
    if docker compose -p inventario-ti ps | grep -q "soporte-apache-proxy.*Up"; then
        echo -e "${GREEN}✅ Apache: Funcionando${NC}"
    else
        echo -e "${RED}❌ Apache: Problemas detectados${NC}"
        return 1
    fi
    
    return 0
}

# Función para iniciar servicios de forma robusta
robust_start() {
    echo -e "${BLUE}🚀 Iniciando servicios de forma robusta...${NC}"
    
    # Paso 1: Iniciar solo MySQL primero
    echo -e "${YELLOW}🐬 Iniciando MySQL...${NC}"
    docker compose -p inventario-ti up -d inventario-db
    
    # Paso 2: Esperar a que MySQL esté listo
    if wait_for_db; then
        echo -e "${YELLOW}📱 Iniciando aplicación...${NC}"
        # Paso 3: Iniciar la aplicación
        docker compose -p inventario-ti up -d inventario-app
        
        # Paso 4: Esperar un poco y luego iniciar Apache
        sleep 10
        echo -e "${YELLOW}🌐 Iniciando Apache...${NC}"
        docker compose -p inventario-ti up -d apache-proxy
        
        # Paso 5: Verificar que todo esté funcionando
        sleep 5
        if check_containers_health; then
            echo -e "${GREEN}🎉 ¡Todos los servicios iniciados correctamente!${NC}"
            return 0
        else
            echo -e "${RED}❌ Algunos servicios tienen problemas${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ No se pudo iniciar MySQL${NC}"
        return 1
    fi
}

# Función para reiniciar servicios problemáticos
fix_unhealthy_services() {
    echo -e "${BLUE}🔧 Reparando servicios problemáticos...${NC}"
    
    # Detener todos los servicios
    docker compose -p inventario-ti down
    
    # Limpiar contenedores huérfanos
    docker compose -p inventario-ti down --remove-orphans
    
    # Esperar un poco
    sleep 3
    
    # Reiniciar de forma robusta
    robust_start
}

case "$1" in
    start)
        check_docker
        check_env
        robust_start
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
        fix_unhealthy_services
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
            docker compose -p inventario-ti exec inventario-app node scripts/seedAdmin.js
        fi
        ;;
    
    status)
        docker compose -p inventario-ti ps
        check_containers_health
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
        docker compose -p inventario-ti exec inventario-db mysqladmin ping -h localhost -u root -p"${MYSQL_ROOT_PASSWORD:-herwingx-dev}" --silent
        docker compose -p inventario-ti exec inventario-db mysqldump -u herwingxtech -p'herwingx-dev' inventario_soporte > "../backup_${timestamp}.sql"
        echo -e "${GREEN}✅ Backup creado: backup_${timestamp}.sql${NC}"
        ;;
    
    fix)
        echo -e "${BLUE}🔧 Reparando servicios problemáticos...${NC}"
        fix_unhealthy_services
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
