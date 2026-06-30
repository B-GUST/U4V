# Política de Privacidad — Unidos por Venezuela (U4V)
Última actualización: 29 de junio de 2026

## 1. Responsable del Tratamiento
La iniciativa de voluntariado de datos **Unidos por Venezuela (U4V)** es responsable del tratamiento y resguardo de la información recopilada en esta plataforma. Contacto de soporte y consultas: `admin@u4v.org`.

## 2. Datos Recopilados y Propósito
Bajo el principio de **minimización de datos**, recopilamos únicamente la información técnica y de contacto estrictamente indispensable para orquestar la asistencia civil:
* **Datos del Perfil**: Nombre de la organización, nombre del coordinador responsable, número de teléfono (SMS), enlace de WhatsApp e Instagram corporativo.
* **Estructura Geográfica**: Estado, ciudad, municipio, parroquia, calle/casa y punto de referencia para ordenar geográficamente los centros más cercanos y programar los despachos logísticos.
* **Capacidades Operativas**: Capacidad de alojamiento (refugios), camas de emergencia (hospitales) y raciones diarias de comida (acopios/ONGs). No recopilamos datos clínicos detallados de pacientes.
* **Datos de Navegación**: Dirección IP de conexión y logs del sistema para auditorías internas de seguridad e integridad de la red.

## 3. Seguridad y Verificación (Arquitectura Zero Trust)
Para proteger la base de datos contra accesos no autorizados y manipulación de información:
* **Verificación Estricta**: Cada transacción, API Route y consulta de página se valida del lado del servidor utilizando `supabase.auth.getUser()`. Nunca se confía en el estado del cliente.
* **Cifrado de Datos**: Toda la comunicación se realiza bajo canales HTTPS seguros. Las credenciales de acceso se almacenan cifradas en los servidores de autenticación.
* **Acceso de Super Admin**: Únicamente los superadministradores validados tienen acceso al CRUD de control de usuarios para dar de baja o revocar accesos en caso de comportamiento irregular.

## 4. Proveedores y Subprocesadores de Datos
La información recogida es procesada a través de las siguientes plataformas de terceros que actúan como subprocesadores:
1. **Supabase Inc.** (Alojamiento de Base de Datos y Autenticación de Usuarios).
2. **Vercel Inc.** (Alojamiento del Servidor de Aplicación Next.js).
3. **Twilio / Meta (WhatsApp Business API)** (Envío automatizado de recordatorios del Data Staleness Index y validación de despachos).

No vendemos, alquilamos ni cedemos sus datos a terceros con fines comerciales o de marketing.

## 5. Derechos de los Usuarios (Acceso y Supresión)
Usted tiene derecho a acceder, corregir, actualizar o solicitar la eliminación total de sus datos de la red. Puede realizar actualizaciones directamente desde la pestaña **"Mi Perfil Operativo"** en el Dashboard, o solicitar la baja completa de la cuenta escribiendo a soporte. El borrado de una cuenta se efectúa de manera definitiva en cascada (tanto en autenticación como en registros de perfil).
