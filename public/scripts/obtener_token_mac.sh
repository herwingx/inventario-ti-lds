#!/bin/bash

# Script para obtener token de autenticación desde macOS
# Versión simplificada para uso fácil

SERVER_URL="http://192.168.0.253/soporte/api/auth/login"

echo "========================================="
echo "  OBTENER TOKEN DE AUTENTICACIÓN"
echo "========================================="
echo ""

# Solicitar credenciales
read -p "Ingrese su nombre de usuario: " USERNAME
read -s -p "Ingrese su contraseña: " PASSWORD
echo ""
echo ""

# Validar que se proporcionaron las credenciales
if [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
    echo "❌ Error: Usuario y contraseña son requeridos"
    exit 1
fi

echo "🔐 Autenticando con el servidor..."
echo "   Usuario: $USERNAME"
echo "   Servidor: $SERVER_URL"
echo ""

# Preparar datos de login
LOGIN_DATA=$(cat <<EOF
{
  "username": "$USERNAME",
  "password": "$PASSWORD"
}
EOF
)

# Realizar petición de login
RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA" \
    "$SERVER_URL" 2>&1)

if [ $? -eq 0 ]; then
    # Extraer token de la respuesta JSON
    TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
        echo "✅ Autenticación exitosa!"
        echo ""
        echo "========================================="
        echo "TOKEN OBTENIDO (30 días de duración):"
        echo "========================================="
        echo "$TOKEN"
        echo ""
        echo "========================================="
        echo "CÓMO USAR EL TOKEN:"
        echo "========================================="
        echo "1. Copie el token de arriba"
        echo "2. Edite los scripts de inventario:"
        echo ""
        echo "   # Windows:"
        echo "   # Editar inventario_windows.ps1"
        echo "   # Cambiar: TOKEN=\"PEGAR_TOKEN_AQUI\""
        echo "   # Por:     TOKEN=\"$TOKEN\""
        echo ""
        echo "   # Linux:"
        echo "   # Editar inventario_linux.sh"
        echo "   # Cambiar: TOKEN=\"PEGAR_TOKEN_AQUI\""
        echo "   # Por:     TOKEN=\"$TOKEN\""
        echo ""
        echo "   # macOS:"
        echo "   # Editar inventario_mac.sh"
        echo "   # Cambiar: TOKEN=\"PEGAR_TOKEN_AQUI\""
        echo "   # Por:     TOKEN=\"$TOKEN\""
        echo ""
        
        # Guardar token en archivo para referencia
        TOKEN_FILE="token_$(date +%Y%m%d_%H%M%S).txt"
        echo "$TOKEN" > "$TOKEN_FILE"
        echo "💾 Token guardado en: $TOKEN_FILE"
        echo ""
        echo "⚠️  IMPORTANTE:"
        echo "   - Mantenga el token seguro y no lo comparta"
        echo "   - El token dura 30 días"
        echo "   - Si expira, ejecute este script nuevamente"
        echo ""
        
    else
        echo "❌ Error: Respuesta del servidor no contiene token"
        echo "Respuesta completa: $RESPONSE"
    fi
else
    echo "❌ Error de autenticación:"
    
    if echo "$RESPONSE" | grep -q "401"; then
        echo "   Credenciales incorrectas. Verifique usuario y contraseña."
    elif echo "$RESPONSE" | grep -q "404"; then
        echo "   Servidor no encontrado. Verifique la URL: $SERVER_URL"
    else
        echo "   $RESPONSE"
    fi
    
    echo ""
    echo "💡 Sugerencias:"
    echo "   - Verifique que el servidor esté funcionando"
    echo "   - Confirme que tiene credenciales válidas"
    echo "   - Contacte al administrador del sistema"
    
    exit 1
fi

echo "========================================="
echo "Proceso completado: $(date)"
echo "========================================="