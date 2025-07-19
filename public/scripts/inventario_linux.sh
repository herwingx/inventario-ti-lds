#!/bin/bash

# Script de Inventario Automatizado - Linux
# Versión simplificada para uso fácil

# ============================================
# CONFIGURACIÓN - CAMBIAR SOLO ESTA SECCIÓN
# ============================================
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoibGluZWEiLCJyb2xlSWQiOjEsImlhdCI6MTc1Mjk0NDIzNSwiZXhwIjoxNzU1NTM2MjM1fQ.Kn4t5Cw9ZdbOpr6vQdERXCFhaWwnMEw5QZESulS5R0U"
SERVER_URL="http://192.168.0.253/soporte/api/equipos"
# ============================================

SEND_TO_SERVER=false
SHOW_INFO=false

# Procesar parámetros
while [[ $# -gt 0 ]]; do
    case $1 in
        --server)
            SEND_TO_SERVER=true
            shift
            ;;
        --show-info)
            SHOW_INFO=true
            shift
            ;;
        --help)
            echo "INVENTARIO AUTOMATIZADO - LINUX"
            echo "==============================="
            echo ""
            echo "Uso: ./inventario_linux.sh [OPCIONES]"
            echo ""
            echo "OPCIONES:"
            echo "  --server      Enviar datos al servidor"
            echo "  --show-info   Mostrar información recopilada"
            echo "  --help        Mostrar esta ayuda"
            echo ""
            echo "CONFIGURACIÓN:"
            echo "  1. Editar el script y pegar el token en la variable TOKEN"
            echo "  2. Ejecutar con sudo para información completa"
            echo ""
            echo "EJEMPLOS:"
            echo "  ./inventario_linux.sh                # Solo generar JSON local"
            echo "  ./inventario_linux.sh --server       # Enviar al servidor"
            echo "  ./inventario_linux.sh --show-info    # Ver datos antes de enviar"
            echo ""
            exit 0
            ;;
        *)
            echo "Parámetro desconocido: $1"
            shift
            ;;
    esac
done

echo "========================================="
echo "  INVENTARIO AUTOMATIZADO - LINUX"
echo "========================================="
echo ""

# Verificar configuración
if [ "$SEND_TO_SERVER" = true ] && [ -z "$TOKEN" ]; then
    echo "❌ ERROR: Token no configurado"
    echo "   Edite el script y configure la variable TOKEN"
    echo "   Use: obtener_token.ps1 para obtener un token"
    exit 1
fi

# Función para convertir texto a mayúsculas
to_upper() {
    echo "$1" | tr '[:lower:]' '[:upper:]'
}

# Función para normalizar marcas (mantener originales si no están en la lista)
normalize_marca() {
    local marca="$1"
    
    if [ -z "$marca" ]; then
        echo ""
        return
    fi
    
    marca=$(to_upper "$marca")
    
    # Lista de marcas predeterminadas
    local valid_marcas="DELL HP LENOVO ASUS ACER APPLE MSI SAMSUNG LG"
    
    # Buscar coincidencia exacta
    for valid in $valid_marcas; do
        if [ "$marca" = "$valid" ]; then
            echo "$valid"
            return
        fi
    done
    
    # Buscar coincidencia parcial
    for valid in $valid_marcas; do
        if echo "$marca" | grep -q "$valid"; then
            echo "$valid"
            return
        fi
    done
    
    # Si no coincide, devolver la marca original en mayúsculas
    echo "$marca"
}

echo "🔍 Recopilando información del sistema..."

# =========================================
# RECOPILACIÓN DE DATOS PARA INVENTARIO
# =========================================

# Obtener número de serie
NUMERO_SERIE=""
if [ -f /sys/class/dmi/id/product_serial ]; then
    NUMERO_SERIE=$(cat /sys/class/dmi/id/product_serial 2>/dev/null | tr -d '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
fi

# Si no hay número de serie válido o es genérico, usar MAC como fallback
if [ -z "$NUMERO_SERIE" ] || [ "$NUMERO_SERIE" = "To Be Filled By O.E.M." ] || [ "$NUMERO_SERIE" = "Not Specified" ]; then
    if command -v ip >/dev/null 2>&1; then
        MAC_FALLBACK=$(ip link show | grep -E "link/ether" | head -1 | awk '{print $2}' | tr -d ':' | tr '[:lower:]' '[:upper:]')
        if [ -n "$MAC_FALLBACK" ]; then
            NUMERO_SERIE="MAC-$MAC_FALLBACK"
        fi
    fi
fi

# Si aún no hay número de serie, generar uno
if [ -z "$NUMERO_SERIE" ]; then
    NUMERO_SERIE="LINUX-$(hostname | tr '[:lower:]' '[:upper:]')-$(date +%Y%m%d)"
fi

# Convertir número de serie a mayúsculas
NUMERO_SERIE=$(to_upper "$NUMERO_SERIE")

# Obtener marca y modelo (mantener marca original)
MARCA=""
MODELO=""
if [ -f /sys/class/dmi/id/sys_vendor ]; then
    RAW_MARCA=$(cat /sys/class/dmi/id/sys_vendor 2>/dev/null | tr -d '\n')
    MARCA=$(normalize_marca "$RAW_MARCA")
fi
if [ -f /sys/class/dmi/id/product_name ]; then
    MODELO=$(cat /sys/class/dmi/id/product_name 2>/dev/null | tr -d '\n' | tr '[:lower:]' '[:upper:]')
fi

# Obtener procesador
PROCESADOR=""
if [ -f /proc/cpuinfo ]; then
    PROCESADOR=$(grep "model name" /proc/cpuinfo | head -1 | cut -d':' -f2 | sed 's/^ *//' | tr -d '\n' | tr '[:lower:]' '[:upper:]')
fi

# Obtener RAM total
RAM_TOTAL=""
if [ -f /proc/meminfo ]; then
    RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    RAM_GB=$(echo "scale=2; $RAM_KB/1024/1024" | bc 2>/dev/null || echo "$(($RAM_KB/1024/1024))")
    RAM_TOTAL="${RAM_GB} GB"
fi

# Obtener capacidad total de disco
DISCO_TOTAL=""
if command -v lsblk >/dev/null 2>&1; then
    TOTAL_BYTES=$(lsblk -d -b -o SIZE,TYPE | awk '/disk/ {sum += $1} END {print sum}')
    if [ -n "$TOTAL_BYTES" ] && [ "$TOTAL_BYTES" -gt 0 ]; then
        DISCO_GB=$(echo "scale=2; $TOTAL_BYTES/1024/1024/1024" | bc 2>/dev/null || echo "$(($TOTAL_BYTES/1024/1024/1024))")
        DISCO_TOTAL="${DISCO_GB} GB"
    fi
fi

# Obtener sistema operativo
SISTEMA_OPERATIVO=""
if [ -f /etc/os-release ]; then
    OS_NAME=$(grep ^NAME= /etc/os-release | cut -d= -f2 | tr -d '"')
    OS_VERSION=$(grep ^VERSION= /etc/os-release | cut -d= -f2 | tr -d '"')
    KERNEL_VERSION=$(uname -r)
    SISTEMA_OPERATIVO="$OS_NAME $OS_VERSION (KERNEL $KERNEL_VERSION)"
elif [ -f /etc/redhat-release ]; then
    SISTEMA_OPERATIVO=$(cat /etc/redhat-release)
else
    SISTEMA_OPERATIVO="$(uname -s) $(uname -r)"
fi
SISTEMA_OPERATIVO=$(to_upper "$SISTEMA_OPERATIVO")

# Obtener MAC Address principal
MAC_ADDRESS=""
if command -v ip >/dev/null 2>&1; then
    MAC_ADDRESS=$(ip link show | grep -E "link/ether" | head -1 | awk '{print $2}' | tr '[:lower:]' '[:upper:]')
else
    MAC_ADDRESS=$(ifconfig 2>/dev/null | grep -E "ether|HWaddr" | head -1 | awk '{print $2}' | head -1 | tr '[:lower:]' '[:upper:]')
fi

# Generar características adicionales
CARACTERISTICAS=""
ARCHITECTURE=$(uname -m | tr '[:lower:]' '[:upper:]')
CARACTERISTICAS="ARQUITECTURA: $ARCHITECTURE"

if [ -f /proc/cpuinfo ]; then
    CPU_CORES=$(grep "cpu cores" /proc/cpuinfo | head -1 | cut -d':' -f2 | sed 's/^ *//')
    CPU_THREADS=$(grep "processor" /proc/cpuinfo | wc -l)
    if [ -n "$CPU_CORES" ]; then
        CARACTERISTICAS="$CARACTERISTICAS; NÚCLEOS: $CPU_CORES"
    fi
    if [ -n "$CPU_THREADS" ]; then
        CARACTERISTICAS="$CARACTERISTICAS; HILOS: $CPU_THREADS"
    fi
fi

# Crear objeto JSON
JSON_DATA=$(cat <<EOF
{
  "numero_serie": "$NUMERO_SERIE",
  "nombre_equipo": "$(hostname | tr '[:lower:]' '[:upper:]')",
  "marca": "$MARCA",
  "modelo": "$MODELO",
  "id_tipo_equipo": 1,
  "id_sucursal_actual": 1,
  "procesador": "$PROCESADOR",
  "ram": "$(to_upper "$RAM_TOTAL")",
  "disco_duro": "$(to_upper "$DISCO_TOTAL")",
  "sistema_operativo": "$SISTEMA_OPERATIVO",
  "mac_address": "$MAC_ADDRESS",
  "otras_caracteristicas": "$CARACTERISTICAS",
  "id_status": 5
}
EOF
)

if [ "$SHOW_INFO" = true ]; then
    echo "========================================="
    echo "DATOS RECOPILADOS:"
    echo "========================================="
    echo "Número de serie: $NUMERO_SERIE"
    echo "Nombre equipo: $(hostname)"
    echo "Marca: $MARCA"
    echo "Modelo: $MODELO"
    echo "Procesador: $PROCESADOR"
    echo "RAM: $RAM_TOTAL"
    echo "Disco: $DISCO_TOTAL"
    echo "SO: $SISTEMA_OPERATIVO"
    echo "MAC: $MAC_ADDRESS"
    echo ""
fi

echo "✅ Información recopilada exitosamente"

# Enviar al servidor o guardar localmente
if [ "$SEND_TO_SERVER" = true ]; then
    echo "📡 Enviando datos al servidor..."
    
    if command -v curl >/dev/null 2>&1; then
        RESPONSE=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$JSON_DATA" \
            "$SERVER_URL" 2>&1)
        
        if [ $? -eq 0 ]; then
            echo "✅ Equipo registrado exitosamente!"
            echo "Respuesta del servidor: $RESPONSE"
        else
            echo "❌ Error al enviar datos al servidor:"
            if echo "$RESPONSE" | grep -q "401"; then
                echo "   Token inválido o expirado. Obtenga un nuevo token."
            else
                echo "$RESPONSE"
            fi
            
            # Guardar como fallback
            FALLBACK_FILE="equipo_data_$(date +%Y%m%d_%H%M%S).json"
            echo "$JSON_DATA" > "$FALLBACK_FILE"
            echo "💾 Datos guardados localmente en: $FALLBACK_FILE"
        fi
    else
        echo "❌ curl no está disponible. Guardando datos localmente."
        OUTPUT_FILE="equipo_$(hostname)_$(date +%Y%m%d_%H%M%S).json"
        echo "$JSON_DATA" > "$OUTPUT_FILE"
        echo "💾 Datos guardados en: $OUTPUT_FILE"
    fi
else
    # Guardar en archivo JSON local
    OUTPUT_FILE="equipo_$(hostname)_$(date +%Y%m%d_%H%M%S).json"
    echo "$JSON_DATA" > "$OUTPUT_FILE"
    echo "💾 Datos guardados en: $OUTPUT_FILE"
    echo "   Para enviar al servidor, ejecute: ./inventario_linux.sh --server"
fi

echo ""
echo "========================================="
echo "Proceso completado: $(date)"
echo "========================================="