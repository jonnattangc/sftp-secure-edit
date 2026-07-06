# SFTP Secure Edit

![Version](https://img.shields.io/badge/version-0.1.2-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.90.0-007ACC?logo=visualstudiocode)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

Extensión para Visual Studio Code que permite **editar archivos remotos de forma segura por SFTP**, con soporte para **múltiples servidores** conectados a la vez.

Los archivos remotos se abren como pestañas nativas del editor: al pulsar **Guardar** se escriben directamente en el servidor mediante un `FileSystemProvider` propio bajo el esquema `sftp://`. No hay que descargar carpetas ni subir cambios a mano.

> El archivo mostrado en la ficha de la extensión dentro de VS Code es [`VSREADME.md`](./VSREADME.md) (orientado a producto). Este `README.md` es la documentación técnica del repositorio.

## Tabla de contenidos

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso](#uso)
- [Archivo de configuración](#archivo-de-configuración)
- [Clave maestra](#clave-maestra)
- [Comandos](#comandos)
- [Desarrollo](#desarrollo)
- [Arquitectura](#arquitectura)
- [Seguridad](#seguridad)
- [Hoja de ruta](#hoja-de-ruta)
- [Licencia](#licencia)

## Características

- 🌐 **Edición remota nativa.** Abre, edita y guarda archivos del servidor como si fueran locales, vía `FileSystemProvider` (`sftp://`).
- 🗂️ **Multiservidor.** Varias conexiones activas a la vez, cada una montada como una carpeta independiente en el explorador.
- 🔑 **Identificador único por servidor**, definido por el usuario y usado como `authority` del URI.
- 🔐 **Clave maestra** obligatoria para añadir, editar o eliminar servidores.
- 💾 **Configuración persistente** en un archivo JSON editable a mano.
- 🧭 **Panel dedicado** en la barra de actividad para gestionar las conexiones.

## Requisitos

- Visual Studio Code `^1.90.0`.
- Node.js 18+ y npm (solo para desarrollo/empaquetado).
- Un servidor accesible por SFTP con autenticación de usuario y contraseña.

## Instalación

Desde el archivo `.vsix` empaquetado:

```bash
code --install-extension sftp-secure-edit-0.1.2.vsix
```

O desde la interfaz: vista **Extensiones** → menú **⋯** → **Install from VSIX...**.

## Uso

1. Abre el panel **SFTP Secure Edit** en la barra de actividad.
2. Pulsa **➕** (`SFTP: Anadir servidor`) e introduce la clave maestra.
3. Define un **identificador único**, el nombre, host, puerto, usuario, contraseña y la carpeta remota inicial.
4. Pulsa el icono **🔌 Conectar** en el servidor; su carpeta remota aparecerá en el explorador.
5. Edita los archivos y guarda con `Ctrl/Cmd + S`: los cambios se envían al servidor.

## Archivo de configuración

La configuración se guarda en `servers.json`, dentro del almacenamiento global de la extensión, y **persiste entre sesiones**. Ábrelo con el comando `SFTP: Editar configuracion (JSON)` (protegido por la clave maestra). Al editarlo a mano, el panel de servidores se refresca automáticamente.

```json
{
  "servers": [
    {
      "id": "produccion",
      "label": "Produccion",
      "host": "192.168.1.10",
      "port": 22,
      "username": "usuario",
      "password": "secreto",
      "remotePath": "/var/www"
    }
  ]
}
```

| Campo | Descripción |
|-------|-------------|
| `id` | Identificador único (minúsculas, números y `. _ -`). Se usa como `authority` del URI `sftp://<id>/...`. |
| `label` | Nombre legible mostrado en el panel. |
| `host` | Host o dirección IP del servidor. |
| `port` | Puerto SFTP (por defecto `22`). |
| `username` | Usuario de autenticación. |
| `password` | Contraseña (ver [Seguridad](#seguridad)). |
| `remotePath` | Carpeta remota que se monta como raíz al conectar. |

> Tras cambiar las credenciales de un servidor conectado, desconéctalo y vuelve a conectar para aplicarlas.

## Clave maestra

Las operaciones que **modifican** servidores (añadir, editar y eliminar) exigen una clave maestra, que se recuerda durante la sesión una vez validada. Conectar, desconectar y editar archivos **no** la requieren.

Actualmente la clave es temporal y está definida en `src/utils/MasterKey.ts` (`_Clave2026`). El servicio expone un método `getMasterKey()` preparado para obtenerla desde un servidor remoto en el futuro (ver [Hoja de ruta](#hoja-de-ruta)).

## Comandos

| Comando | ID | Descripción |
|---------|----|-------------|
| SFTP: Anadir servidor | `sftpSecureEdit.addServer` | Añade un servidor (pide clave maestra). |
| SFTP: Conectar servidor | `sftpSecureEdit.connectServer` | Conecta y monta la carpeta remota. |
| SFTP: Desconectar servidor | `sftpSecureEdit.disconnectServer` | Cierra la conexión y desmonta la carpeta. |
| SFTP: Eliminar servidor | `sftpSecureEdit.removeServer` | Elimina un servidor (pide clave maestra). |
| SFTP: Editar configuracion (JSON) | `sftpSecureEdit.openConfig` | Abre `servers.json` (pide clave maestra). |
| SFTP: Refrescar servidores | `sftpSecureEdit.refresh` | Refresca el panel. |

## Desarrollo

```bash
npm install
npm run watch     # compila en segundo plano con esbuild
# Pulsa F5 en VS Code para abrir el Extension Development Host
```

Scripts disponibles:

| Script | Acción |
|--------|--------|
| `npm run watch` | Compilación incremental (esbuild). |
| `npm run compile` | Bundle de desarrollo. |
| `npm run package` | Bundle de producción minificado. |
| `npm run check-types` | Comprobación de tipos con `tsc`. |
| `npm run vsix` | Genera el `.vsix` instalable. |

## Arquitectura

Estructura modular que mantiene `extension.ts` libre de lógica de negocio.

| Ruta | Responsabilidad |
|------|-----------------|
| `src/extension.ts` | Ciclo de vida (`activate` / `deactivate`) y registro de proveedores. |
| `src/model/ServerConfig.ts` | Tipos de la configuración de servidor. |
| `src/providers/SftpFileSystemProvider.ts` | Sistema de archivos virtual `sftp://` (lectura/escritura remota). |
| `src/providers/ServerTreeProvider.ts` | Vista lateral con la lista de servidores. |
| `src/utils/ConnectionManager.ts` | Pool de conexiones SFTP (una por servidor). |
| `src/utils/ConfigStore.ts` | Persistencia de la configuración en `servers.json`. |
| `src/utils/MasterKey.ts` | Control de acceso por clave maestra. |
| `src/utils/mount.ts` | Montaje/desmontaje de la carpeta remota en el explorador. |
| `src/commands/` | Un archivo por comando registrado. |

Todos los recursos (proveedores, comandos, listeners) se registran en `context.subscriptions` para liberarlos al desactivar la extensión, que además cierra todas las conexiones abiertas.

## Seguridad

- Las contraseñas se almacenan **en texto plano** dentro de `servers.json`. Este archivo vive en el almacenamiento global de la extensión, en el equipo del usuario. **No lo compartas ni lo subas a ningún repositorio.**
- La clave maestra actual es un valor fijo temporal; no debe considerarse un mecanismo de seguridad fuerte por sí solo.
- Cifrar las contraseñas con la clave maestra (p. ej. AES-256-GCM) está previsto en la hoja de ruta.

## Hoja de ruta

- [ ] Obtener la clave maestra desde un servidor remoto.
- [ ] Cifrar las contraseñas del archivo de configuración con la clave maestra.
- [ ] Soporte de autenticación por clave privada (SSH keys).
- [ ] Comando de edición de servidor guiado (además de la edición por JSON).

## Licencia

MIT. Ver [LICENSE](./LICENSE).
