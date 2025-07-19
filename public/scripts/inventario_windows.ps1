param(
    [switch]$SendToServer,
    [switch]$ShowInfo,
    [switch]$Help
)

# ============================================
# CONFIGURACIÓN - CAMBIAR SOLO ESTA SECCIÓN
# ============================================
# ¡ATENCIÓN! Este token JWT expira el 17 de noviembre de 2025 (según tu token original).
# Asegúrate de renovarlo o generar uno nuevo si planeas usar este script después de esa fecha.
$TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoibGluZWEiLCJyb2xlSWQiOjEsImlhdCI6MTc1Mjk0NDIzNSwiZXhwIjoxNzU1NTM2MjM1fQ.Kn4t5Cw9ZdbOpr6vQdERXCFhaWwnMEw5QZESulS5R0U"
$SERVER_URL = "http://100.92.55.90/soporte/api/equipos"
# ============================================

# --- Manejo de la opción de ayuda ---
if ($Help) {
    Write-Host @"
INVENTARIO AUTOMATIZADO - WINDOWS
=================================

Uso: .\inventario_windows.ps1 [OPCIONES]

OPCIONES:
  -SendToServer   Enviar datos al servidor (por defecto, guarda localmente)
  -ShowInfo       Mostrar la información recopilada en consola
  -Help           Mostrar esta ayuda y salir
"@ -ForegroundColor Green
    exit 0
}

# --- Encabezado del script ---
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  INVENTARIO AUTOMATIZADO - WINDOWS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# --- Funciones Auxiliares ---

# Limpia y formatea una cadena de texto
function Clean-String {
    param([string]$InputString)
    if ([string]::IsNullOrWhiteSpace($InputString)) { return "" }
    return $InputString.Trim().ToUpper().Replace('"', '\"').Replace('\', '\\')
}

# Estandariza la cantidad de RAM a valores comunes
function Get-StandardRAM {
    param([double]$RamGB)
    if ($RamGB -le 2.5) { return "2GB" }
    elseif ($RamGB -le 3.5) { return "3GB" }
    elseif ($RamGB -le 4.5) { return "4GB" }
    elseif ($RamGB -le 6) { return "6GB" }
    elseif ($RamGB -le 8.5) { return "8GB" }
    elseif ($RamGB -le 12) { return "12GB" }
    elseif ($RamGB -le 16.5) { return "16GB" }
    elseif ($RamGB -le 24) { return "24GB" }
    elseif ($RamGB -le 32.5) { return "32GB" }
    elseif ($RamGB -le 48) { return "48GB" }
    elseif ($RamGB -le 64.5) { return "64GB" }
    elseif ($RamGB -le 96) { return "96GB" }
    elseif ($RamGB -le 128.5) { return "128GB" }
    else { return "$([math]::Round($RamGB))GB" }
}

# Valida y limpia el número de serie, filtrando valores genéricos
function Get-ValidSerialNumber {
    param([string]$SerialNumber)
    if ([string]::IsNullOrWhiteSpace($SerialNumber)) { return $null }
    $sn = $SerialNumber.Trim().ToUpper()

    # Lista de valores de número de serie no válidos o genéricos
    $invalidValues = @(
        "TO BE FILLED BY O.E.M.",
        "SYSTEM SERIAL NUMBER",
        "CHASSIS SERIAL NUMBER",
        "DEFAULT STRING",
        "NOT SPECIFIED",
        "NONE",
        "N/A",
        "00000000",
        "11111111",
        "12345678",
        "FFFFFFFF"
    )

    if ($invalidValues -contains $sn -or $sn.Length -lt 4 -or $sn -match "^[0]+$") {
        return $null
    }

    return $sn
}

# Normaliza la marca del equipo a un conjunto de valores conocidos
function Get-NormalizedMarca {
    param([string]$Marca)
    $ValidMarcas = @('DELL','HP','LENOVO','ASUS','ACER','APPLE','MSI','SAMSUNG','LG')
    $Marca = $Marca.Trim().ToUpper()
    foreach ($valid in $ValidMarcas) {
        # Usa comodín para coincidir con "Dell Inc.", "HP Development Company", etc.
        if ($Marca -like "$valid*") { return $valid }
    }
    return $Marca # Si no coincide con una marca conocida, devuelve la original
}

Write-Host "Recopilando informacion del sistema..." -ForegroundColor Yellow

# --- Inicialización del objeto de datos del equipo ---
$equipoData = @{
    numero_serie = ""
    nombre_equipo = $env:COMPUTERNAME.ToUpper()
    marca = ""
    modelo = ""
    id_tipo_equipo = 1         # ID por defecto, puede ser configurable
    id_sucursal_actual = 1     # ID por defecto, puede ser configurable
    procesador = ""
    ram = ""
    disco_duro = ""
    sistema_operativo = ""
    mac_address = ""
    otras_caracteristicas = ""
    id_status = 5              # ID de estado por defecto
}

# --- Bloque principal de recopilación de información (con manejo de errores) ---
try {
    # Obtener objetos WMI con manejo de errores silencioso para evitar detener el script
    $computer = Get-WmiObject -Class Win32_ComputerSystem -ErrorAction SilentlyContinue
    $os = Get-WmiObject -Class Win32_OperatingSystem -ErrorAction SilentlyContinue
    $bios = Get-WmiObject -Class Win32_BIOS -ErrorAction SilentlyContinue
    $cpu = Get-WmiObject -Class Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1
    $baseboard = Get-WmiObject -Class Win32_BaseBoard -ErrorAction SilentlyContinue
    $uuidObj = Get-WmiObject -Class Win32_ComputerSystemProduct -ErrorAction SilentlyContinue

    # --- Detección del número de serie (con prioridad y fallbacks) ---
    Write-Host "Detectando numero de serie..." -ForegroundColor Yellow

    # 1. Intentar BIOS SerialNumber
    if ($bios.SerialNumber) {
        $validSN = Get-ValidSerialNumber $bios.SerialNumber
        if ($validSN) {
            $equipoData.numero_serie = $validSN
            Write-Host "Numero de serie encontrado en BIOS: $validSN" -ForegroundColor Green
        }
    }

    # 2. Intentar BaseBoard SerialNumber si el BIOS no lo proporcionó
    if (-not $equipoData.numero_serie -and $baseboard.SerialNumber) {
        $validSN = Get-ValidSerialNumber $baseboard.SerialNumber
        if ($validSN) {
            $equipoData.numero_serie = $validSN
            Write-Host "Numero de serie encontrado en placa base: $validSN" -ForegroundColor Green
        }
    }

    # 3. Intentar UUID del sistema si los anteriores fallaron
    if (-not $equipoData.numero_serie -and $uuidObj.UUID -and $uuidObj.UUID -ne "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF") {
        # Formatear el UUID para un número de serie más corto y consistente
        $equipoData.numero_serie = "UUID-" + ($uuidObj.UUID -replace "-", "").Substring(0, [System.Math]::Min(12, ($uuidObj.UUID -replace "-", "").Length)).ToUpper()
        Write-Host "Numero de serie generado desde UUID: $($equipoData.numero_serie)" -ForegroundColor Green
    }

    # 4. Intentar MAC Address del primer adaptador Ethernet conectado si los anteriores fallaron
    if (-not $equipoData.numero_serie) {
        $adapter = Get-WmiObject -Class Win32_NetworkAdapter -ErrorAction SilentlyContinue |
                   Where-Object { $_.MACAddress -and $_.AdapterType -eq "Ethernet 802.3" -and $_.NetConnectionStatus -eq 2 } | # NetConnectionStatus = 2 (Connected)
                   Select-Object -First 1
        if ($adapter) {
            $equipoData.numero_serie = "MAC-" + $adapter.MACAddress.Replace(":", "").ToUpper()
            Write-Host "Numero de serie generado desde MAC: $($equipoData.numero_serie)" -ForegroundColor Green
        }
    }

    # 5. Último recurso: generar un número de serie único basado en el nombre del equipo y la fecha
    if (-not $equipoData.numero_serie) {
        $hash = [System.Security.Cryptography.MD5]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($env:COMPUTERNAME + (Get-Date).ToString("yyyyMMddHHmmss")))
        $equipoData.numero_serie = "GEN-" + [System.BitConverter]::ToString($hash).Replace("-", "").Substring(0, 8).ToUpper()
        Write-Host "Numero de serie generado automaticamente (fallback): $($equipoData.numero_serie)" -ForegroundColor Yellow
    }

    # --- Marca y Modelo ---
    if ($computer) {
        $equipoData.marca = Get-NormalizedMarca $computer.Manufacturer
        $equipoData.modelo = Clean-String $computer.Model
    }

    # --- Procesador ---
    if ($cpu) {
        $equipoData.procesador = Clean-String $cpu.Name
    }

    # --- RAM ---
    if ($computer.TotalPhysicalMemory) {
        $ramGB = [math]::Round($computer.TotalPhysicalMemory / 1GB, 2)
        $equipoData.ram = Get-StandardRAM $ramGB
        Write-Host "RAM detectada: $ramGB GB -> Estandarizada: $($equipoData.ram)" -ForegroundColor Green
    }

    # --- Disco principal (C:) - Lógica mejorada y robusta con depuración ---
    Write-Host "Detectando disco principal (C:)..." -ForegroundColor Yellow
    $equipoData.disco_duro = "Desconocido" # Valor por defecto si no se puede detectar

    try {
        Write-Host "Paso 1: Buscando unidad lógica C:..." -ForegroundColor DarkCyan
        # 1. Obtener el objeto LogicalDisk para la unidad C:
        # Usamos ErrorAction Stop para que cualquier fallo aquí sea capturado por el catch externo
        $logicalDiskC = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'" -ErrorAction Stop

        if ($logicalDiskC) {
            Write-Host "Paso 1 OK: Unidad lógica C: encontrada. DeviceID: $($logicalDiskC.DeviceID)" -ForegroundColor DarkGreen

            Write-Host "Paso 2: Buscando relación LogicalDiskToPartition para C:..." -ForegroundColor DarkCyan
            # 2. Encontrar la relación entre la unidad lógica C: y su partición
            # $_.Dependent contiene la referencia al LogicalDisk, por ejemplo: "Win32_LogicalDisk.DeviceID="C:""
            # Hacemos el filtro más flexible usando -like y un comodín
            $partitionToLogicalDisk = Get-WmiObject -Class Win32_LogicalDiskToPartition -ErrorAction Stop |
                                      Where-Object { $_.Dependent -like "*DeviceID=`"$($logicalDiskC.DeviceID)`"" }

            if ($partitionToLogicalDisk) {
                # Extraer el DeviceID de la partición (Antecedent)
                # Ejemplo de Antecedent: "Win32_DiskPartition.DeviceID="Disk #0, Partition #0""
                $partitionDeviceID = ($partitionToLogicalDisk.Antecedent -split 'DeviceID="')[1].TrimEnd('"')
                Write-Host "Paso 2 OK: Partición asociada a C: encontrada. Partition DeviceID: $partitionDeviceID" -ForegroundColor DarkGreen

                Write-Host "Paso 3: Buscando relación DiskDriveToDiskPartition para la partición: $partitionDeviceID..." -ForegroundColor DarkCyan
                # 3. Encontrar la relación entre la partición y el disco físico
                # $_.Dependent contiene la referencia a la partición
                $diskDriveToPartition = Get-WmiObject -Class Win32_DiskDriveToDiskPartition -ErrorAction Stop |
                                        Where-Object { $_.Dependent -like "*DeviceID=`"$partitionDeviceID`"" }

                if ($diskDriveToPartition) {
                    # Extraer el DeviceID del disco físico (Antecedent)
                    # Ejemplo de Antecedent: "Win32_DiskDrive.DeviceID="\\.\PHYSICALDRIVE0""
                    $physicalDiskDeviceID = ($diskDriveToPartition.Antecedent -split 'DeviceID="')[1].TrimEnd('"')
                    Write-Host "Paso 3 OK: Disco físico asociado a la partición encontrado. Physical Disk DeviceID: $physicalDiskDeviceID" -ForegroundColor DarkGreen

                    Write-Host "Paso 4: Obteniendo detalles del disco físico: $physicalDiskDeviceID..." -ForegroundColor DarkCyan
                    # 4. Obtener la información del disco físico
                    $physicalDisk = Get-WmiObject -Class Win32_DiskDrive -Filter "DeviceID='$physicalDiskDeviceID'" -ErrorAction Stop

                    if ($physicalDisk -and $physicalDisk.Size) {
                        $gb = [math]::Round($physicalDisk.Size / 1GB)

                        # Normalizar tamaños de disco (ajusta según tus necesidades)
                        if ($gb -le 128) { $equipoData.disco_duro = "120GB" }
                        elseif ($gb -le 250) { $equipoData.disco_duro = "240GB" }
                        elseif ($gb -le 280) { $equipoData.disco_duro = "256GB" }
                        elseif ($gb -le 500) { $equipoData.disco_duro = "480GB" }
                        elseif ($gb -le 550) { $equipoData.disco_duro = "512GB" }
                        elseif ($gb -le 680) { $equipoData.disco_duro = "640GB" }
                        elseif ($gb -le 1100) { $equipoData.disco_duro = "1TB" }
                        elseif ($gb -le 2200) { $equipoData.disco_duro = "2TB" }
                        else { $equipoData.disco_duro = "$gb GB" }

                        # Detectar tipo de disco (SSD/HDD) - Prioriza MediaType si está disponible
                        $diskType = "HDD"
                        if ($physicalDisk.MediaType -match "Solid State Drive" -or $physicalDisk.Model -match "SSD|Solid|NVMe|M\.2|NVME") {
                            $diskType = "SSD"
                        }
                        $equipoData.disco_duro += " $diskType"
                        Write-Host "Paso 4 OK: Disco C: detectado: $gb GB ($diskType) -> Estandarizado: $($equipoData.disco_duro)" -ForegroundColor Green
                    } else {
                        Write-Warning "Paso 4 FALLO: No se pudo obtener el tamaño o tipo del disco físico asociado a C:."
                    }
                } else {
                    Write-Warning "Paso 3 FALLO: No se encontró la relación entre la partición y el disco físico para C:."
                    Write-Host "Detalles para depuración (Dependent): $($diskDriveToPartition.Dependent)" -ForegroundColor Red
                    Write-Host "Detalles para depuración (Antecedent): $($diskDriveToPartition.Antecedent)" -ForegroundColor Red
                }
            } else {
                Write-Warning "Paso 2 FALLO: No se encontró la relación entre la unidad lógica C: y su partición."
                Write-Host "Detalles para depuración (Dependent): $($partitionToLogicalDisk.Dependent)" -ForegroundColor Red
                Write-Host "Detalles para depuración (Antecedent): $($partitionToLogicalDisk.Antecedent)" -ForegroundColor Red
            }
        } else {
            Write-Warning "Paso 1 FALLO: No se encontró la unidad lógica C:."
        }
    } catch {
        # Este catch capturará errores específicos de las llamadas WMI del disco que usan -ErrorAction Stop
        Write-Error "ERROR al recopilar información del disco C:: $($_.Exception.Message)" -ForegroundColor Red
        $equipoData.disco_duro = "Error de lectura o C: no encontrado"
    }

    # --- Sistema Operativo ---
    if ($os) {
        $equipoData.sistema_operativo = Clean-String "$($os.Caption) $($os.Version) Build $($os.BuildNumber)"
    }

    # --- MAC Address (Primer adaptador habilitado con IP) ---
    Write-Host "Detectando MAC Address..." -ForegroundColor Yellow
    # CORRECCIÓN: Usar $_.IPEnabled correctamente
    $netAdapter = Get-WmiObject -Class Win32_NetworkAdapterConfiguration -ErrorAction SilentlyContinue |
                  Where-Object { $_.IPEnabled -eq $true -and $_.MACAddress } |
                  Select-Object -First 1

    if ($netAdapter) {
        $equipoData.mac_address = $netAdapter.MACAddress.ToUpper()
        Write-Host "MAC Address detectada: $($equipoData.mac_address)" -ForegroundColor Green
    } else {
        Write-Warning "No se pudo detectar una MAC Address para un adaptador con IP habilitada."
    }

    # --- Otras Características ---
    $otros = @()
    if ($os.OSArchitecture) { $otros += "ARQUITECTURA: $($os.OSArchitecture)" }
    if ($cpu.NumberOfCores) { $otros += "NUCLEOS CPU: $($cpu.NumberOfCores)" }
    if ($cpu.NumberOfLogicalProcessors) { $otros += "NUCLEOS LOGICOS: $($cpu.NumberOfLogicalProcessors)" }
    if ($computer.SystemType) { $otros += "TIPO: $($computer.SystemType)" }

    if ($computer.PartOfDomain) {
        $otros += "DOMINIO: $($computer.Domain)"
    } else {
        $otros += "GRUPO_TRABAJO: $($computer.Workgroup)"
    }

    $equipoData.otras_caracteristicas = Clean-String ($otros -join "; ")

    Write-Host "Informacion recopilada exitosamente." -ForegroundColor Green

} catch {
    # Este catch capturará errores de las llamadas WMI principales que usan -ErrorAction Stop
    Write-Host "ERROR CRÍTICO al recopilar información del sistema: $($_.Exception.Message)" -ForegroundColor Red
}

# --- Convertir datos a JSON ---
# Depth 5 asegura que todas las propiedades de objetos complejos (como los de red, si se agregaran) se incluyan.
$jsonData = $equipoData | ConvertTo-Json -Depth 5

# --- Salida o Envío de datos ---
if ($ShowInfo) {
    Write-Host "`n========== DATOS RECOPILADOS ==========" -ForegroundColor Cyan
    # Muestra los datos recopilados en un formato legible
    $equipoData.GetEnumerator() | ForEach-Object { Write-Host "$($_.Key): $($_.Value)" }
    Write-Host "=======================================" -ForegroundColor Cyan
}

if ($SendToServer) {
    Write-Host "Enviando datos al servidor ($SERVER_URL)..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $TOKEN"
            "Content-Type"  = "application/json"
        }
        # Invoke-RestMethod para enviar la petición POST
        # -TimeoutSec 30: Espera hasta 30 segundos por una respuesta del servidor
        $response = Invoke-RestMethod -Uri $SERVER_URL -Method Post -Headers $headers -Body $jsonData -TimeoutSec 30
        Write-Host "¡Éxito! Equipo registrado." -ForegroundColor Green
        if ($response.id) {
            Write-Host "ID asignado: $($response.id)" -ForegroundColor Green
        } else {
            # Si el servidor no devuelve un 'id' pero la petición fue exitosa
            Write-Host "Respuesta del servidor (sin ID específico): $($response | Out-String)" -ForegroundColor Cyan
        }
    } catch {
        # Captura y muestra detalles del error de la petición HTTP
        Write-Host "ERROR al enviar datos al servidor: $($_.Exception.Message)" -ForegroundColor Red
        # Intenta obtener el cuerpo de la respuesta de error del servidor si está disponible
        if ($_.Exception.Response) {
            $errorResponseStream = $_.Exception.Response.GetResponseStream()
            $streamReader = New-Object System.IO.StreamReader($errorResponseStream)
            $responseBody = $streamReader.ReadToEnd()
            Write-Host "Cuerpo de la respuesta de error del servidor: $responseBody" -ForegroundColor Red
        }
    }
} else {
    # Si no se especifica -SendToServer, guarda los datos localmente en un archivo JSON
    $filename = "inventario_$(Clean-String $env:COMPUTERNAME)_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    $jsonData | Out-File -Encoding UTF8 -FilePath $filename
    Write-Host "Datos guardados localmente en: $filename" -ForegroundColor Cyan
}