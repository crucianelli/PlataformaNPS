# Plataforma NPS Crucianelli — Documentación General

## ¿Qué es esta plataforma?

La Plataforma NPS Crucianelli es un sistema interno para gestionar las encuestas de satisfacción posventa que Crucianelli envía a sus clientes después de comprar una máquina. Reemplaza el proceso anterior basado en Google Forms y Google Sheets, centralizando todo en un solo lugar: el envío de links, el seguimiento de respuestas, los indicadores de calidad y la coordinación del envío de regalos.

Tiene dos tipos de usuarios:

- **Administradores**: acceso completo a todas las funciones del sistema.
- **Usuarios Rambla**: acceso exclusivo a la pantalla de gestión de regalos.

---

## El formulario de encuesta (lo que ve el cliente)

Cada cliente que compró una máquina recibe un link único y personal. Al ingresar a ese link, completa una encuesta dividida en secciones:

**Datos de contacto para el envío del regalo**
El cliente ingresa su nombre, dirección completa (calle, piso/depto, localidad, código postal, provincia), email y teléfono. Estos datos se usan para enviarle el presente por haber completado la encuesta.

**Datos de la experiencia**
El cliente indica en qué concesionario compró, qué modelo de máquina adquirió (sembradora o fertilizadora) y bajo qué nombre o firma salió facturada.

**Preguntas de satisfacción** (escala 1 a 10)
1. ¿Cómo fue el proceso de entrega y presentación de la unidad?
2. ¿Cómo fue el trato y la predisposición del técnico durante la entrega?
3. ¿Qué tan satisfecho está con la capacitación recibida sobre el uso y mantenimiento?
4. ¿Qué tan probable es que recomiende el **producto Crucianelli** a un colega o amigo?
5. ¿Qué tan probable es que recomiende al **concesionario** a un colega o amigo?
6. ¿Qué tan probable es que recomiende a **Crucianelli como empresa** a un colega o amigo?

Las preguntas 4, 5 y 6 incluyen un campo de comentario opcional para que el cliente pueda explicar su respuesta.

**Protecciones del formulario**
- Cada link funciona una sola vez. Si el cliente intenta responder nuevamente, ve un mensaje indicando que ya completó la encuesta.
- Si el link no es válido, se muestra una página de error personalizada.
- Una vez enviado, aparece una pantalla de agradecimiento.

---

## Panel de administración

Todo lo que sigue es visible para el equipo interno de Crucianelli al ingresar con sus credenciales.

---

### 1. Dashboard principal

La pantalla de inicio muestra un resumen general del estado de las encuestas:

- **Indicadores NPS** para producto, concesionario y empresa, calculados sobre todas las respuestas históricas.
- **Tasa de respuesta global**: qué porcentaje de los clientes que recibieron una encuesta efectivamente la respondieron.
- **Total de respuestas** recibidas y clientes pendientes de responder.
- **Últimas 10 respuestas** recibidas, con nombre del cliente, concesionario y puntajes.

---

### 2. Vista NPS (análisis detallado)

Una pantalla dedicada al análisis de los indicadores con filtros avanzados. Permite ver los datos segmentados por:

- **Concesionario** específico
- **Tipo de máquina**: sembradoras o fertilizadoras
- **Tecnología** de la máquina
- **Rango de fechas** (desde / hasta)

Con esos filtros activos, la pantalla muestra:

- **Indicadores NPS** de producto, concesionario y empresa para la selección aplicada.
- **Panel de calificaciones promedio**: entrega y presentación, trato del técnico, capacitación.
- **Comparativo por canal**: diferencia entre encuestas respondidas por mensaje (link enviado) vs. por llamado telefónico.
- **Distribución NPS**: cuántos promotores (9-10), neutros (7-8) y detractores (1-6) hay.
- **Ranking completo de concesionarios**: tabla con el NPS de cada uno, ordenada de mayor a menor.

---

### 3. Campañas

Una campaña es el agrupador principal del sistema. Cada campaña tiene un nombre, una fecha y una lista de clientes a encuestar.

**Listado de campañas**
Muestra todas las campañas con su estado actual: activa, completada o archivada.

**Crear nueva campaña**
El administrador crea la campaña con un nombre y puede cargar los clientes de a uno o importarlos masivamente desde un archivo CSV.

**Detalle de una campaña**
Al ingresar a una campaña se ve:

- **Métricas**: total de clientes, cuántos respondieron, cuántos están sin respuesta y la tasa de respuesta en porcentaje.
- **Estado de cada cliente**: si respondió, si está pendiente, si recibió un recordatorio o si fue clasificado como sin respuesta.
- **Gestión de recordatorios**: ver el estado de los recordatorios enviados (explicado más adelante).
- **Cambiar el estado** de la campaña (activa → completada → archivada).
- **Exportar pendientes**: genera un archivo CSV con los datos de los clientes que todavía no respondieron, listo para enviar el recordatorio.
- **Eliminar campaña** si se cometió un error.

---

### 4. Recordatorios

Los recordatorios son el mecanismo para volver a contactar a los clientes que no respondieron la encuesta. Cada campaña puede tener hasta 3 recordatorios.

**Cómo funciona**
1. El administrador entra a la sección de recordatorio de una campaña activa.
2. El sistema muestra cuántos clientes siguen pendientes de respuesta.
3. Se exporta la lista de pendientes (CSV) para enviarles el recordatorio por el canal que corresponda (WhatsApp, email, etc.). Ese envío externo lo hace el equipo manualmente.
4. Una vez enviado externamente, el administrador confirma el recordatorio en el sistema. Esto actualiza el estado de los clientes a "recordatorio enviado".
5. Si los clientes siguen sin responder, se puede crear el recordatorio 2 y luego el 3.
6. Al tercer recordatorio confirmado, no se pueden crear más y los clientes restantes avanzan al estado de "necesidad de llamado".

**Historial de recordatorios**
En el detalle de cada campaña hay una línea de tiempo que muestra cuándo fue creado y confirmado cada recordatorio.

---

### 5. Necesidad de llamado

Cuando un cliente no respondió a ninguno de los recordatorios, el sistema lo clasifica como "necesidad de llamado". Esta pantalla concentra todos esos casos.

Muestra el nombre del cliente, su orden de fabricación, el concesionario, hasta 3 números de teléfono y la campaña a la que pertenece.

Desde acá el operador puede:
- **Abrir la encuesta directamente** y completarla junto al cliente por teléfono.
- **Marcar como sin respuesta** si el cliente no pudo ser contactado o no quiso responder, ingresando un comentario explicativo.

---

### 6. Sin respuesta

Registro histórico de todas las encuestas que fueron cerradas definitivamente como sin respuesta. Muestra la fecha en que se cerró, el cliente, el concesionario, la campaña y el comentario que dejó el operador al momento de cerrarla.

---

### 7. Respuestas

Listado completo de todas las respuestas recibidas en el sistema, con filtros exhaustivos:

- **Búsqueda libre**: por nombre de cliente, email o nombre de campaña.
- **Concesionario**
- **Campaña**
- **Rango de fechas**
- **Tecnología** de la máquina
- **Estado NPS**: ver solo promotores, neutros o detractores.
- **Dimensión NPS**: filtrar por producto, concesionario o empresa.
- **Canal**: mensaje (link enviado) o llamado (completada por teléfono).

Los filtros son combinables. El resultado se puede **exportar como CSV** con exactamente los registros que muestra la pantalla.

---

### 8. Clientes

Base de datos de clientes del sistema.

- **Listado con búsqueda** por nombre o concesionario, con paginación.
- **Cargar cliente manualmente**: ingresando nombre, teléfonos, concesionario, orden de fabricación y tecnología.
- **Importar clientes desde CSV**: carga masiva desde un archivo con múltiples clientes a la vez.

---

### 9. Rambla (gestión de regalos)

Pantalla exclusiva para el equipo de Almacén Digital de Rambla, que se encarga de enviar el kit de regalo a cada cliente que completa la encuesta.

**Lo que ve el equipo de Rambla:**

- **Contador de regalos**: cuántos están pendientes de envío y cuántos ya fueron despachados.
- **Tabla de clientes**: cada fila es una persona que respondió la encuesta, con todos sus datos de envío (nombre, dirección, localidad, código postal, provincia, email, teléfono y el modelo de máquina que tiene).
- **Número de seguimiento**: campo editable por fila para ingresar el código de seguimiento del envío. Se guarda con la fecha exacta en que se cargó.
- **Estado del regalo**: cada registro muestra si el regalo está "Pendiente" o "Enviado". El operador puede cambiar el estado con un clic.
- **Exportar PDF**: genera un documento imprimible con toda la tabla, apto para imprimir y trabajar offline.

**Acceso restringido**: los usuarios con rol Rambla solo pueden ver esta pantalla. No tienen acceso a ninguna otra sección del sistema.

---

### 10. Notificaciones internas

El sistema tiene un centro de notificaciones en tiempo real visible desde el ícono de campana en la barra superior.

Los **administradores** reciben notificaciones cuando:
- Llega una nueva respuesta de encuesta.
- Se detecta un NPS crítico (cualquier puntaje por debajo de 6).

Los **usuarios de Rambla** reciben notificaciones cuando:
- Hay un nuevo regalo pendiente de despachar.

---

### 11. Alertas automáticas por email

El sistema envía emails automáticamente ante dos situaciones:

**Alerta NPS crítico**
Si alguno de los tres puntajes NPS (producto, concesionario o empresa) es menor a 6, el sistema envía de forma inmediata un email a los destinatarios configurados. El email incluye el nombre del cliente, el concesionario, los tres valores NPS (resaltando los críticos en rojo) y los comentarios que haya dejado el cliente.

**Notificación a Rambla**
Cada vez que un cliente completa la encuesta, el sistema envía automáticamente un email a los contactos de Rambla con todos los datos de envío del cliente y los productos del kit de regalo a despachar. El email incluye nombre, dirección completa, localidad, código postal, provincia, email y teléfono.

---

### 12. Configuración del sistema

Pantalla donde el administrador gestiona los parámetros globales de la plataforma:

- **Días para primer recordatorio**: cuántos días después del envío inicial el sistema habilita el primer recordatorio.
- **Días para pasar a necesidad de llamado**: cuántos días después del último recordatorio un cliente pasa a la lista de llamados.
- **Emails de notificación (NPS crítico)**: lista de direcciones que reciben la alerta cuando un puntaje es crítico. Se puede agregar o eliminar libremente.
- **Emails de Rambla**: lista de direcciones del equipo de Rambla que reciben el aviso de cada regalo nuevo. Se puede agregar o eliminar libremente.
- **Prueba de email SMTP**: permite enviar un email de prueba para verificar que la configuración de correo esté funcionando.
- **Prueba de email Rambla**: permite enviar un email de prueba con el formato exacto del aviso de regalo, con datos ficticios, para verificar cómo se ve antes de que llegue uno real.

---

### 13. Acceso y seguridad

- El acceso al panel requiere email y contraseña.
- Hay un flujo de **recuperación de contraseña** por email.
- Cada usuario tiene un **rol** que determina qué puede ver:
  - **Admin**: acceso total.
  - **Rambla**: solo puede ver y operar la pantalla de gestión de regalos.
- Las encuestas de los clientes se acceden por un **link con token único** y no requieren login. Ese token no expira y no puede ser reutilizado una vez que la encuesta fue respondida.

---

## Resumen de funcionalidades

| Funcionalidad | Descripción breve |
|---|---|
| Formulario de encuesta | Link único por cliente con 6 preguntas de satisfacción y datos de envío |
| Dashboard | Indicadores NPS generales y últimas respuestas |
| Vista NPS | Análisis detallado con filtros por concesionario, máquina, tecnología y fechas |
| Campañas | Creación, seguimiento y gestión del ciclo de vida de cada campaña |
| Recordatorios | Hasta 3 recordatorios por campaña con exportación de pendientes |
| Necesidad de llamado | Gestión de clientes que requieren contacto telefónico |
| Sin respuesta | Registro histórico de encuestas cerradas sin obtener respuesta |
| Respuestas | Listado completo con filtros avanzados y exportación CSV |
| Clientes | Base de datos con carga individual e importación masiva por CSV |
| Rambla | Gestión de envío de regalos con seguimiento y exportación PDF |
| Notificaciones internas | Alertas en tiempo real para admins y usuarios Rambla |
| Alerta NPS crítico | Email automático cuando cualquier NPS es menor a 6 |
| Notificación Rambla | Email automático con datos de envío al recibir cada encuesta |
| Configuración | Parámetros de días, listas de emails y pruebas de correo |
| Acceso por roles | Admin con acceso total, Rambla con acceso restringido |
