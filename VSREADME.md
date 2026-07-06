<h1 align="center">🔐 SFTP Secure Edit</h1>

<p align="center"><strong>Edita los archivos de tus servidores remotos como si estuvieran en tu equipo.</strong></p>

---

**SFTP Secure Edit** conecta Visual Studio Code con tus servidores por SFTP y te deja abrir, editar y guardar archivos remotos directamente desde el editor. Sin descargar carpetas, sin subir cambios a mano, sin salir de VS Code.

Ideal para administrar sitios web, servidores de aplicaciones o cualquier máquina a la que accedas por SSH/SFTP.

## ✨ Qué puedes hacer

- 🌐 **Editar en remoto, guardar en remoto.** Abre un archivo del servidor, edítalo y pulsa guardar: los cambios viajan al instante. Se siente igual que trabajar en local.
- 🗂️ **Varios servidores a la vez.** Conéctate a producción, pruebas y desarrollo simultáneamente. Cada servidor aparece como una carpeta independiente en el explorador.
- 🔐 **Protegido por clave maestra.** Añadir, editar o eliminar servidores requiere una clave maestra, para que nadie toque tus conexiones sin permiso.
- 💾 **Tu configuración, siempre contigo.** Los servidores se guardan en un archivo que persiste entre sesiones y puedes editar cuando quieras.
- 🧭 **Panel dedicado.** Gestiona todas tus conexiones desde un panel propio en la barra lateral.

## 🚀 Primeros pasos

1. Abre el panel **SFTP Secure Edit** en la barra de actividad (icono lateral).
2. Pulsa **➕ Anadir servidor** e introduce la clave maestra.
3. Elige un **identificador único** para el servidor y rellena los datos de conexión: nombre, host, puerto, usuario, contraseña y la carpeta remota inicial.
4. Pulsa el icono **🔌 Conectar** junto al servidor. Su carpeta aparecerá en el explorador.
5. Abre cualquier archivo, edítalo y guárdalo con `Ctrl/Cmd + S`. ¡Listo!

## 🔑 Clave maestra

Las operaciones que modifican tus servidores (añadir, editar o eliminar) están protegidas por una **clave maestra**. Basta con introducirla una vez por sesión.

> Conectarte y editar archivos **no** requiere la clave: solo la gestión de servidores está protegida.

## 🖥️ Gestión de servidores

Toda tu lista de servidores se guarda de forma persistente y puedes revisarla o ajustarla desde el propio editor con el comando **Editar configuración (JSON)**. Añade, quita o modifica servidores y el panel se actualiza automáticamente.

## 💡 Consejos

- Da a cada servidor un identificador claro y único (por ejemplo `produccion`, `staging`, `cliente-a`); así los distingues de un vistazo.
- ¿Cambiaste la contraseña de un servidor ya conectado? Desconéctalo y vuelve a conectar para aplicar las nuevas credenciales.
- Puedes tener tantos servidores como necesites; conéctate solo a los que estés usando para mantener todo ordenado.

## ✅ Requisitos

- Visual Studio Code **1.90** o superior.
- Un servidor accesible por **SFTP** con usuario y contraseña.

---

<p align="center"><sub>Hecho para quienes viven entre servidores. 🚀</sub></p>
