#!/bin/bash

# Script de Inventario Automatizado - macOS
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
            echo "INVENTARIO AUTOMATIZADO - macOS"
            echo "==============================="
            echo ""
            echo "Uso: ./inventario_mac.sh [OPCIONES]"
            echo ""
            echo "OPCIONES:"
            echo "  --server      Enviar datos al servidor"
            echo "  --show-info   Mostrar información recopilada"
            echo "  --help        Mostrar esta ayuda"
            echo ""
            echo "CONFIGURACIÓN:"
            echo "  1. Editar el script y pegar el token en la variable TOKEN"
            echo "  2. Dar permisos de ejecución: chmod +x inventario_mac.sh"
            echo ""
            echo "EJEMPLOS:"
            echo "  ./inventario_mac.sh                # Solo generar JSON local"
            echo "  ./inventario_mac.sh --server       # Enviar al servidor"
            echo "  ./inventario_mac.sh --show-info    # Ver datos antes de enviar"
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
echo "  INVENTARIO AUTOMATIZADO - macOS"
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

echo "🔍 Recopilando información del sistema..."

# =========================================
# RECOPILACIÓN DE DATOS PARA INVENTARIO
# =========================================

# Obtener número de serie
NUMERO_SERIE=$(system_profiler SPHardwareDataType | grep "Serial Number" | awk -F': ' '{print $2}' | tr -d ' \n' | tr '[:lower:]' '[:upper:]')

# Si no hay número de serie, usar MAC como fallback
if [ -z "$NUMERO_SERIE" ]; then
    MAC_FALLBACK=$(ifconfig | awk '/ether/ {print $2}' | head -1 | tr -d ':' | tr '[:lower:]' '[:upper:]')
    if [ -n "$MAC_FALLBACK" ]; then
        NUMERO_SERIE="MAC-$MAC_FALLBACK"
    else
        NUMERO_SERIE="MAC-$(hostname | tr '[:lower:]' '[:upper:]')-$(date +%Y%m%d)"
    fi
fi

# Obtener marca y modelo (siempre Apple en macOS)
MARCA="APPLE"
MODELO=$(system_profiler SPHardwareDataType | grep "Model Name:" | awk -F': ' '{print $2}' | sed 's/^[[:space:]]*//' | tr '[:lower:]' '[:upper:]')
if [ -z "$MODELO" ]; then
    MODELO=$(system_profiler SPHardwareDataType | grep "Model Identifier:" | awk -F': ' '{print $2}' | sed 's/^[[:space:]]*//' | tr '[:lower:]' '[:upper:]')
fi

# Obtener procesador
PROCESADOR=$(system_profiler SPHardwareDataType | grep "Chip:" | awk -F': ' '{print $2}' | sed 's/^[[:space:]]*//' | tr '[:lower:]' '[:upper:]')
if [ -z "$PROCESADOR" ]; then
    PROCESADOR=$(system_profiler SPHardwareDataType | grep "Processor Name:" | awk -F': ' '{print $2}' | sed 's/^[[:space:]]*//' | tr '[:lower:]' '[:upper:]')
fi

# Obtener RAM total
RAM_TOTAL=$(system_profiler SPHardwareDataType | grep "Memory:" | awk '{print $2 " " $3}' | tr '[:lower:]' '[:upper:]')

# Obtener capacidad total de disco
DISCO_TOTAL=$(diskutil list | grep "(internal" | awk '{print $5}' | head -1 | tr '[:lower:]' '[:upper:]')
if [ -z "$DISCO_TOTAL" ]; then
    DISCO_TOTAL=$(system_profiler SPStorageDataType | grep "Capacity:" | head -1 | awk '{print $2 " " $3}' | tr '[:lower:]' '[:upper:]')
fi

# Obtener sistema operativo
OS_NAME=$(sw_vers -productName | tr '[:lower:]' '[:upper:]')
OS_VERSION=$(sw_vers -productVersion)
OS_BUILD=$(sw_vers -buildVersion | tr '[:lower:]' '[:upper:]')
SISTEMA_OPERATIVO="$OS_NAME $OS_VERSION (BUILD $OS_BUILD)"

# Obtener MAC Address principal
MAC_ADDRESS=$(ifconfig | awk '/ether/ {print $2}' | head -1 | tr '[:lower:]' '[:upper:]')

# Generar características adicionales
CARACTERISTICAS=""
CPU_CORES=$(system_profiler SPHardwareDataType | grep "Total Number of Cores:" | awk -F': ' '{print $2}' | sed 's/^[[:space:]]*//')
MODEL_ID=$(system_profiler SPHardwareDataType | grep "Model Identifier:" | awk -F': ' '{print $2}' | sed 's/^[[:space:]]*//' | tr '[:lower:]' '[:upper:]')

CARACTERISTICAS="ARQUITECTURA: $(uname -m | tr '[:lower:]' '[:upper:]')"
if [ -n "$CPU_CORES" ]; then
    CARACTERISTICAS="$CARACTERISTICAS; NÚCLEOS: $CPU_CORES"
fi
if [ -n "$MODEL_ID" ]; then
    CARACTERISTICAS="$CARACTERISTICAS; MODELO ID: $MODEL_ID"
fi

# Determinar tipo de dispositivo
if [[ "$MODELO" == *"MACBOOK"* ]]; then
    CARACTERISTICAS="$CARACTERISTICAS; TIPO: LAPTOP"
elif [[ "$MODELO" == *"IMAC"* ]]; then
    CARACTERISTICAS="$CARACTERISTICAS; TIPO: ALL-IN-ONE"
elif [[ "$MODELO" == *"MAC MINI"* ]]; then
    CARACTERISTICAS="$CARACTERISTICAS; TIPO: MINI DESKTOP"
elif [[ "$MODELO" == *"MAC PRO"* ]]; then
    CARACTERISTICAS="$CARACTERISTICAS; TIPO: WORKSTATION"
else
    CARACTERISTICAS="$CARACTERISTICAS; TIPO: DESKTOP"
fi

# Crear objeto JSON
JSON_DATA=$(cat <<EOF
{
  "numero_serie": "$NUMERO_SERIE",
  "nombre_equipo": "$(hostname -s | tr '[:lower:]' '[:upper:]')",
  "marca": "$MARCA",
  "modelo": "$MODELO",
  "id_tipo_equipo": 1,
  "id_sucursal_actual": 1,
  "procesador": "$PROCESADOR",
  "ram": "$RAM_TOTAL",
  "disco_duro": "$DISCO_TOTAL",
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
    echo "Nombre equipo: $(hostname -s)"
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
    # Guardar en archivo JSON local
    OUTPUT_FILE="equipo_$(hostname -s)_$(date +%Y%m%d_%H%M%S).json"
    echo "$JSON_DATA" > "$OUTPUT_FILE"
    echo "💾 Datos guardados en: $OUTPUT_FILE"
    echo "   Para enviar al servidor, ejecute: ./inventario_mac.sh --server"
fi

echo ""
echo "========================================="
echo "Proceso completado: $(date)"
echo "========================================="