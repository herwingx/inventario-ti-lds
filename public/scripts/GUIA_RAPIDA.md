# 🚀 Guía Rápida - Inventario Automatizado

## 📥 1. Obtener Token (Solo una vez cada 30 días)

### Desde tu Mac:
```bash
# Descargar script
curl -O http://192.168.0.253/soporte/scripts/obtener_token_mac.sh

# Dar permisos y ejecutar
chmod +x obtener_token_mac.sh
./obtener_token_mac.sh
```

### Desde Windows:
```powershell
# Descargar y ejecutar
curl -O http://192.168.0.253/soporte/scripts/obtener_token.ps1
.\obtener_token.ps1
```

## 📋 2. Configurar Scripts

### Windows (Mayoría de equipos):
```powershell
# Descargar script
curl -O http://192.168.0.253/soporte/scripts/inventario_windows.ps1

# Editar script y pegar token
notepad inventario_windows.ps1
# Cambiar: TOKEN="PEGAR_TOKEN_AQUI"
# Por:     TOKEN="tu_token_de_30_dias"
```

### Linux (4 equipos):
```bash
# Descargar script
curl -O http://192.168.0.253/soporte/scripts/inventario_linux.sh

# Editar script y pegar token
nano inventario_linux.sh
# Cambiar: TOKEN="PEGAR_TOKEN_AQUI"
# Por:     TOKEN="tu_token_de_30_dias"

# Dar permisos
chmod +x inventario_linux.sh
```

### macOS (3 equipos):
```bash
# Descargar script
curl -O http://192.168.0.253/soporte/scripts/inventario_mac.sh

# Editar script y pegar token
nano inventario_mac.sh
# Cambiar: TOKEN="PEGAR_TOKEN_AQUI"
# Por:     TOKEN="tu_token_de_30_dias"

# Dar permisos
chmod +x inventario_mac.sh
```

## ⚡ 3. Ejecutar Inventario

```bash
# Windows (como administrador)
.\inventario_windows.ps1 -SendToServer

# Linux (con sudo)
sudo ./inventario_linux.sh --server

# macOS
./inventario_mac.sh --server
```

**Opciones adicionales:**
- Agregar `-ShowInfo` (Windows) o `--show-info` (Linux/Mac) para ver datos antes de enviar
- Omitir `-SendToServer` o `--server` para solo generar archivo JSON local

## 🎯 4. Características Especiales

### ✅ **Marcas Detectadas Automáticamente:**
- **Predeterminadas**: DELL, HP, LENOVO, ASUS, ACER, APPLE, MSI, SAMSUNG, LG
- **Otras marcas**: GHIA, GIGABYTE, etc. se guardan tal como se detectan

### ✅ **Token de 30 días:**
- Un solo token funciona para todos los equipos
- Se renueva automáticamente cada 30 días
- No necesitas solicitar token por cada equipo

### ✅ **Detección Inteligente:**
- Número de serie automático o generado
- Especificaciones completas de hardware
- Sistema operativo con versión exacta
- Información de red (MAC, IP)
- **Todos los datos se guardan en MAYÚSCULAS automáticamente**

## 📊 5. Resultados Esperados

Cada script detecta y envía (TODO EN MAYÚSCULAS):
- ✅ Número de serie único
- ✅ Marca (predeterminada o detectada): DELL, HP, GHIA, etc.
- ✅ Modelo exacto del equipo: OPTIPLEX 7090, MACBOOK PRO, etc.
- ✅ Procesador completo: INTEL CORE I7-10700, APPLE M1, etc.
- ✅ Memoria RAM total: 16 GB, 32 GB, etc.
- ✅ Capacidad de disco: 512 GB, 1 TB, etc.
- ✅ Sistema operativo: WINDOWS 11 PRO, UBUNTU 22.04 LTS, etc.
- ✅ Dirección MAC principal: AA:BB:CC:DD:EE:FF
- ✅ Características adicionales: ARQUITECTURA, NÚCLEOS, TIPO

## 🔧 6. Solución de Problemas

### Token Expirado:
```
❌ Token inválido o expirado
```
**Solución**: Ejecutar `obtener_token_mac.sh` o `obtener_token.ps1`

### Sin Permisos (Linux/Mac):
```
❌ Permission denied
```
**Solución**: `chmod +x script.sh` y ejecutar con `sudo`

### Error de Conexión:
```
❌ No se puede conectar al servidor
```
**Solución**: Verificar conectividad de red

---

## 🎯 **¡Listo para inventariar todos los equipos con un solo token!**

**Orden recomendado:**
1. Obtener token desde tu Mac (30 días)
2. Configurar scripts en cada tipo de equipo
3. Ejecutar inventario masivo en Windows
4. Ejecutar manualmente en Linux y Mac
5. Verificar resultados en la base de datos