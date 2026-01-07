# 🌐 PLAN MAESTRO DE REESTRUCTURACIÓN DE RED

## Versión Final Detallada /20

| Campo | Valor |
|-------|-------|
| **Proyecto** | Segmentación Granular de Red Corporativa por Áreas |
| **Fecha de Implementación** | 22 de Diciembre de 2025 |
| **Elaborado por** | Departamento de TI e Infraestructura |
| **Estado** | ✅ VERSIÓN FINAL |

---

## 1. 🎯 OBJETIVO Y ESTRATEGIA

Para maximizar el control de tráfico y la administración de la red, migraremos a una arquitectura de **Supernetting /20** con segmentación granular. Esto nos permite separar cada sub-área operativa en su propio rango lógico de IPs, manteniendo una única infraestructura física y comunicación total entre segmentos.

---

## 2. ⚙️ PARÁMETROS TÉCNICOS GLOBALES

> ⚠️ **IMPORTANTE:** Esta configuración aplica para **TODOS** los dispositivos de la red (FortiGate, Servidores, Impresoras y PCs) sin excepción.

| Parámetro | Valor | Notas |
|-----------|-------|-------|
| **Puerta de Enlace (Gateway)** | `192.168.0.197` | IP de nuestro FortiGate actual (Inamovible) |
| **Máscara de Subred** | `255.255.240.0` | 🔴 **CRÍTICO:** Habilita comunicación del rango 0.x al 15.x |
| **CIDR** | `/20` | Notación abreviada de la máscara |
| **Rango Operativo Total** | `192.168.0.1` - `192.168.15.254` | Capacidad para ~4,000 dispositivos |

---

## 3. 📝 PROCEDIMIENTO DE CONFIGURACIÓN (PASO A PASO)

### PASO 1: Ajuste del Núcleo (FortiGate)

1. Ingresar al **FortiGate 40F**
2. Ir a `Network > Interfaces` y editar la interfaz **LAN/Internal**
3. Mantener la IP `192.168.0.197`
4. Cambiar la **Máscara de Subred (Netmask)** de `255.255.255.0` a `255.255.240.0`
5. En **DHCP Server**, actualizar el rango dinámico para invitados al nuevo segmento:
   - **Rango:** `192.168.13.10` - `192.168.13.250`
6. Guardar cambios

### PASO 2: Actualización del Site (Servidores e Impresoras)

1. Ingresar manualmente a cada equipo de infraestructura con IP estática
2. Cambiar la máscara de subred a `255.255.240.0` para garantizar la comunicación con los nuevos segmentos

### PASO 3: Asignación de Usuarios (Reservas DHCP)

1. Cargar en el FortiGate las reservas MAC según las tablas detalladas en la **sección 4**

---

## 4. 📋 TABLA DETALLADA DE ASIGNACIÓN DE IPs

---

### 🖥️ SEGMENTO 0: INFRAESTRUCTURA Y TI

> **Rango:** `192.168.0.x`
> 
> Uso exclusivo para Servidores, Routers, Switches, APs y personal de TI.

---

### 🏢 SEGMENTO 1: DIRECCIÓN GENERAL (TMT)

> **Rango Asignado:** `192.168.1.x`

| IP Asignada | Nombre del Usuario | Puesto |
|-------------|-------------------|--------|
| `192.168.1.10` | GUADALUPE MACIAS VELAZQUEZ | JEFE ADMINISTRATIVO |
| `192.168.1.11` | RAFAEL ABRAHAM RUIZ REYES | DIRECTOR GENERAL |
| `192.168.1.12` | RAFAEL OCTAVIO RUIZ LOPEZ | DIRECTOR GENERAL |
| `192.168.1.13` | ROCIO JIMENEZ ALEGRIA | ASISTENTE |
| `192.168.1.14` | SERGIO DE JESUS RUIZ LOPEZ | JEFE ADMINISTRATIVO |

---

### 💰 SEGMENTO 2: CONTABILIDAD (TMT)

> **Rango Asignado:** `192.168.2.x`

| IP Asignada | Nombre del Usuario | Puesto |
|-------------|-------------------|--------|
| `192.168.2.10` | ADALBERTO GONZALEZ LOPEZ | GERENTE DE CONTABILIDAD |
| `192.168.2.11` | AMIR MARTINEZ JIMENEZ | AUXILIAR DE AUDITORIA |
| `192.168.2.12` | CARLOS ALBERTO RODRIGUEZ JIMENEZ | AUXILIAR CONTABLE |
| `192.168.2.13` | CITLALLI GUADALUPE TOLEDO DE LEON | AUXILIAR CONTABLE |
| `192.168.2.14` | DANIEL ALEJANDRO TELLO SANTIAGO | CONTROL DE BANCOS |
| `192.168.2.15` | ISRAEL BELTRAN NATURI | AUXILIAR CONTABLE |
| `192.168.2.16` | JOSE ANGEL RODRIGUEZ MARTINEZ | CHOFER |
| `192.168.2.17` | JOSE MANUEL MORALES HERNANDEZ | RESPONSABLE DE NOMINA |
| `192.168.2.18` | LILIANA ELIZABETH ROQUE ESPINOSA | RECEPCION |
| `192.168.2.19` | SINDY JARET FONSECA AMBROCIO | RESPONSABLE DE CAJA |
| `192.168.2.20` | YADIRA MUÑOZ LEPE | AUXILIAR CONTABLE |

---

### 🛡️ SEGMENTO 3: OPERACIONES (Administrativo)

> **Rango Asignado:** `192.168.3.x`

| IP Asignada | Nombre del Usuario | Puesto |
|-------------|-------------------|--------|
| `192.168.3.10` | EDUARDO MARTIN CHANONA MAZA | SEGURIDAD |
| `192.168.3.11` | JULIO CESAR VAZQUEZ JUAREZ | ANALISTA |
| `192.168.3.12` | OSMAR YONATAN RUIZ MOLINA | EJECUTIVO OPERACIONES |

---

### 📦 SEGMENTO 4: ALMACÉN

> **Rango Asignado:** `192.168.4.x`

| IP Asignada | Nombre del Usuario | Puesto |
|-------------|-------------------|--------|
| `192.168.4.10` | ALEJANDRO GUTIERREZ HERNANDEZ | AUXILIAR ALMACEN |
| `192.168.4.11` | IVAN DE JESUS MORALES LOPEZ | AUXILIAR ALMACEN |
| `192.168.4.12` | JORGE IVAN REYES ALVARADO | AUXILIAR ALMACEN |
| `192.168.4.13` | JUAN DE JESUS COLMENARES LOPEZ | AUXILIAR ALMACEN |
| `192.168.4.14` | MAURICIO CHANDOMI QUINTERO | AUXILIAR ALMACEN |

---

### 📋 SEGMENTO 5: MESA DE CONTROL

> **Rango Asignado:** `192.168.5.x`

| IP Asignada | Nombre del Usuario | Puesto |
|-------------|-------------------|--------|
| `192.168.5.10` | GLORIA ALVAREZ VAZQUEZ | ANALISTA MESA |
| `192.168.5.11` | MARIANO GUSTAVO RINCON SANCHEZ | ANALISTA |

---

### 👥 SEGMENTO 6: RECURSOS HUMANOS (TMT)

> **Rango Asignado:** `192.168.6.x`

| IP Asignada | Nombre del Usuario | Puesto |
|-------------|-------------------|--------|
| `192.168.6.10` | ANDREA MERARI URBINA PEREZ | GERENTE RRHH |
| `192.168.6.11` | DULCE FATIMA ESPINOSA GOMEZ | AUXILIAR ADM. |

---

### 🛒 SEGMENTO 7: COMERCIAL - VENTAS / CADENAS

> **Rango Asignado:** `192.168.7.x`

| IP Asignada | Nombre del Usuario | Puesto |
|-------------|-------------------|--------|
| `192.168.7.10` | ALEXIS CAMAS ROBLES | SUPERVISOR VENTAS |
| `192.168.7.11` | BEATRIZ ARRIAGA RAMIREZ | JEFE MESA CONTROL |
| `192.168.7.12` | ROBERTO CUEVAS PEREZ | DIRECTOR COMERCIAL |

---

### 📱 SEGMENTO 8: COMERCIAL - TAE (Tiempo Aire)

> **Rango Asignado:** `192.168.8.x`

| IP Asignada | Nombre del Usuario | Puesto |
|-------------|-------------------|--------|
| `192.168.8.10` | BRENDA NORELY NUÑEZ GOMEZ | AUXILIAR ADM. (TAE) |
| `192.168.8.11` | MARIA DE LA CRUZ VELAZQUEZ | JEFE ADMIN (TAE) |

---

### 📊 SEGMENTO 9: COMERCIAL - TARIFARIOS Y RENOVACIONES

> **Rango Asignado:** `192.168.9.x`

| IP Asignada | Nombre del Usuario | Puesto |
|-------------|-------------------|--------|
| `192.168.9.10` | IRIS MARLIT HERNANDEZ LIEVANO | SUPERVISOR VENTAS |
| `192.168.9.11` | JOSE ALBERTO MEJIA AQUINO | VENDEDOR PLANES |
| `192.168.9.12` | LUIS MANUEL MORALES MANDUJANO | EJEC. RENOVACIONES |
| `192.168.9.13` | MARIA DEL ROSARIO ROSALES | EJEC. RENOVACIONES |

---

### 🎨 SEGMENTO 10: COMERCIAL - PUBLICIDAD Y DISEÑO

> **Rango Asignado:** `192.168.10.x`

| IP Asignada | Nombre del Usuario | Puesto |
|-------------|-------------------|--------|
| `192.168.10.10` | HAROLD ABRAHAM BONILLA ACOSTA | DISEÑADOR GRAFICO |
| `192.168.10.11` | SERGIO DEL ANGEL ZAMORA | DISEÑADOR GRAFICO |

---

### 💻 SEGMENTO 11: COMERCIAL - PLATAFORMAS

> **Rango Asignado:** `192.168.11.x`

| IP Asignada | Nombre del Usuario | Puesto |
|-------------|-------------------|--------|
| `192.168.11.10` | CARLOS ALBERTO ZAVALETA | COORDINADOR PLATAF. |
| `192.168.11.11` | DANIELA GOMEZ ALFARO | AUXILIAR MESA |

---

### 📞 SEGMENTO 12: ATENCIÓN Y DESARROLLO (AyD)

> **Rango Asignado:** `192.168.12.x`

| IP Asignada | Nombre del Usuario | Puesto |
|-------------|-------------------|--------|
| `192.168.12.10` | CRISTIAN ROMEO MACAL INFANZON | EJECUTIVO AYD |
| `192.168.12.11` | GABRIEL DOMINGUEZ ESPINOSA | ANALISTA |
| `192.168.12.12` | JOSE ALFREDO ALCALA CARDONA | GERENTE AYD |
| `192.168.12.13` | LUIS FELIPE VIDRIOS LOPEZ | SUPERVISOR |
| `192.168.12.14` | VICTOR HUGO SANTIAGO ALVAREZ | EJECUTIVO AYD |

---

### 📶 SEGMENTO 13: INVITADOS Y MÓVILES

> **Rango Asignado:** `192.168.13.x`
> 
> **DHCP Automático:** `192.168.13.10` a `192.168.13.250`

| Nota |
|------|
| ⚡ Cualquier dispositivo no registrado caerá aquí por defecto |

---

### 🏢 SEGMENTO 14: CORPORATIVO LIDIFON (RED UNIFICADA)

> **Rango Asignado:** `192.168.14.x`

| IP Asignada | Nombre del Usuario | Puesto |
|-------------|-------------------|--------|
| `192.168.14.10` | EZEQUIEL RUSTRIAN LOPEZ | JEFE DE ALMACEN |
| `192.168.14.11` | JOEL RINCON LOPEZ | ENCARGADO CONTROL |
| `192.168.14.12` | GABRIELA HERNANDEZ PEREZ | AUXILIAR CONTABLE |
| `192.168.14.13` | MARLONN MOLINA HERNANDEZ | GERENTE CONTAB. |
| `192.168.14.14` | GABRIELA HERNANDEZ ZOMA | GERENTE RRHH |
| `192.168.14.15` | DANIEL ROVELO ROJAS | GERENTE |
| `192.168.14.16` | OCTAVIO ANDRES RUIZ REYES | DIRECTOR GENERAL |
| `192.168.14.17` | JONATHAN RUIZ MARTINEZ | SUPERVISOR VENTAS |
| `192.168.14.18` | ROBERTO MARROQUIN OCHOA | JEFE DE VENTAS |
| `192.168.14.19` | ROBERTO PEREZ FLORES | SUPERVISOR VENTAS |
| `192.168.14.20` | WINFIELD ROQUE RUIZ | COORDINADOR |
| `192.168.14.21` | BRIAN GUTIERREZ OCAMPO | AUXILIAR ALMACEN |
| `192.168.14.22` | JOSE ANTONIO JIMENEZ CIPRIANO | CONTROL INTERNO |

---

## 📌 NOTAS FINALES

| Concepto | Descripción |
|----------|-------------|
| **Segmento 15** | `192.168.15.x` permanece libre para uso futuro |
| **Soporte** | Para cualquier anomalía de conexión después de la migración, reportar a **Soporte TI** |

---

*Documento generado por el Departamento de TI e Infraestructura - TMT/LIDIFON*
