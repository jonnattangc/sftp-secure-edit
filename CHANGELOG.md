# Changelog

Todos los cambios notables de **SFTP Secure Edit** se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y el proyecto sigue el [Versionado Semántico](https://semver.org/lang/es/).

## [1.0.0] - 2026-07-07

Primera versión estable y pública en el Marketplace.

### Añadido
- **Gestión de múltiples servidores SFTP** desde una vista dedicada en la barra de actividad.
- **Árbol de servidores** con acciones de conectar, desconectar, añadir, eliminar y refrescar.
- **Edición remota segura** mediante un `FileSystemProvider` propio con el esquema `sftp://`, que permite abrir y guardar archivos remotos como si fueran locales.
- **Configuración persistente y editable** en `servers.json` (almacenamiento global de la extensión), accesible con el comando *SFTP: Editar configuración (JSON)*.
- **Protección de credenciales**: las contraseñas se guardan cifradas en `SecretStorage` y nunca en el archivo de configuración.
- **Clave maestra de sesión** que protege las operaciones sensibles (añadir, editar y eliminar servidores).
- Comandos contribuidos: `addServer`, `removeServer`, `connectServer`, `disconnectServer`, `refresh` y `openConfig`.
- Icono de la extensión con fondo transparente, optimizado para los temas claro y oscuro de VSCode.

### Notas
- Publicado bajo el *Publisher ID* `jonnatech`.
- Requiere VSCode `^1.90.0`.

[1.0.0]: https://github.com/jonnattangc/sftp-secure-edit/releases/tag/v1.0.0
