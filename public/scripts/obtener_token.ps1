# Script para obtener token de autenticación JWT
# Facilita la obtención de tokens para usar con los scripts de inventario

param(
    [string]$ServerUrl = "http://192.168.0.253/soporte/api/auth/login",
    [string]$Username = "",
    [string]$Password = "",
    [switch]$Help
)

if ($Help) {
    Write-Host @"
OBTENER TOKEN DE AUTENTICACIÓN
==============================

Uso: .\obtener_token.ps1 [OPCIONES]

OPCIONES:
  -ServerUrl <url>      URL del servidor de autenticación
  -Username <usuario>   Nombre de usuario (opcional, se solicitará si no se proporciona)
  -Password <password>  Contraseña (opcional, se solicitará si no se proporciona)
  -Help                 Mostrar esta ayuda

EJEMPLOS:
  # Solicitar credenciales interactivamente
  .\obtener_token.ps1

  # Proporcionar usuario, solicitar contraseña
  .\obtener_token.ps1 -Username "admin"

  # Proporcionar ambos (no recomendado por seguridad)
  .\obtener_token.ps1 -Username "admin" -Password "password"

NOTA:
  El token obtenido (30 días) debe configurarse en los scripts:
  - inventario_windows.ps1
  - inventario_linux.sh  
  - inventario_mac.sh

"@ -ForegroundColor Green
    exit 0
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  OBTENER TOKEN DE AUTENTICACIÓN" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Solicitar credenciales si no se proporcionaron
if ([string]::IsNullOrWhiteSpace($Username)) {
    $Username = Read-Host "Ingrese su nombre de usuario"
}

if ([string]::IsNullOrWhiteSpace($Password)) {
    $SecurePassword = Read-Host "Ingrese su contraseña" -AsSecureString
    $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword))
}

# Validar que se proporcionaron las credenciales
if ([string]::IsNullOrWhiteSpace($Username) -or [string]::IsNullOrWhiteSpace($Password)) {
    Write-Host "❌ Error: Usuario y contraseña son requeridos" -ForegroundColor Red
    exit 1
}

Write-Host "🔐 Autenticando con el servidor..." -ForegroundColor Yellow
Write-Host "   Usuario: $Username" -ForegroundColor White
Write-Host "   Servidor: $ServerUrl" -ForegroundColor White
Write-Host ""

try {
    # Preparar datos de login
    $loginData = @{
        username = $Username
        password = $Password
    } | ConvertTo-Json
    
    Write-Host "🔐 Solicitando token (30 días)..." -ForegroundColor Cyan

    # Realizar petición de login
    $headers = @{ 'Content-Type' = 'application/json' }
    $response = Invoke-RestMethod -Uri $ServerUrl -Method POST -Body $loginData -Headers $headers -TimeoutSec 30

    if ($response.token) {
        Write-Host "✅ Autenticación exitosa!" -ForegroundColor Green
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host "TOKEN OBTENIDO (30 días):" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host $response.token -ForegroundColor Yellow
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host "CÓMO CONFIGURAR EL TOKEN:" -ForegroundColor Cyan
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host "Edite los scripts y pegue el token:" -ForegroundColor White
        Write-Host ""
        Write-Host "# Windows - inventario_windows.ps1:" -ForegroundColor Gray
        Write-Host "TOKEN=`"$($response.token)`"" -ForegroundColor Green
        Write-Host ""
        Write-Host "# Linux - inventario_linux.sh:" -ForegroundColor Gray
        Write-Host "TOKEN=`"$($response.token)`"" -ForegroundColor Green
        Write-Host ""
        Write-Host "# macOS - inventario_mac.sh:" -ForegroundColor Gray
        Write-Host "TOKEN=`"$($response.token)`"" -ForegroundColor Green
        Write-Host ""
        
        # Guardar token en archivo para referencia
        $tokenFile = "token_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
        $response.token | Out-File -FilePath $tokenFile -Encoding UTF8
        Write-Host "💾 Token guardado en: $tokenFile" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
        Write-Host "   - Mantenga el token seguro y no lo comparta" -ForegroundColor Yellow
        Write-Host "   - El token tiene una duración limitada" -ForegroundColor Yellow
        Write-Host "   - Si expira, ejecute este script nuevamente" -ForegroundColor Yellow
        
    } else {
        Write-Host "❌ Error: Respuesta del servidor no contiene token" -ForegroundColor Red
        Write-Host "Respuesta: $($response | ConvertTo-Json)" -ForegroundColor Gray
    }

} catch {
    Write-Host "❌ Error de autenticación:" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        switch ($statusCode) {
            401 { 
                Write-Host "   Credenciales incorrectas. Verifique usuario y contraseña." -ForegroundColor Red 
            }
            404 { 
                Write-Host "   Servidor no encontrado. Verifique la URL: $ServerUrl" -ForegroundColor Red 
            }
            500 { 
                Write-Host "   Error interno del servidor. Contacte al administrador." -ForegroundColor Red 
            }
            default { 
                Write-Host "   Error HTTP $statusCode" -ForegroundColor Red 
            }
        }
    } else {
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "💡 Sugerencias:" -ForegroundColor Yellow
    Write-Host "   - Verifique que el servidor esté funcionando" -ForegroundColor White
    Write-Host "   - Confirme que tiene credenciales válidas" -ForegroundColor White
    Write-Host "   - Contacte al administrador del sistema" -ForegroundColor White
    
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Proceso completado: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan