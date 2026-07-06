import * as vscode from "vscode";
import { ConfigStore } from "./utils/ConfigStore";
import { ConnectionManager } from "./utils/ConnectionManager";
import { SftpFileSystemProvider, SFTP_SCHEME } from "./providers/SftpFileSystemProvider";
import { ServerTreeProvider } from "./providers/ServerTreeProvider";
import { MasterKeyService } from "./utils/MasterKey";
import { registerCommands } from "./commands";

/** Referencia al gestor de conexiones para poder cerrarlas al desactivar. */
let connections: ConnectionManager | undefined;

/**
 * Punto de entrada de la extensi'on.
 * Solo orquesta el ciclo de vida: instancia los servicios y registra proveedores y comandos.
 */
export function activate(context: vscode.ExtensionContext): void {
  const store = new ConfigStore(context);
  const masterKey = new MasterKeyService();
  connections = new ConnectionManager(store);

  // Garantiza que el archivo JSON persistente de configuraci'on existe.
  void store.ensureFile();

  // Proveedor del sistema de archivos remoto bajo el esquema sftp://
  const fileSystem = new SftpFileSystemProvider(connections);
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(SFTP_SCHEME, fileSystem, {
      isCaseSensitive: true,
    })
  );

  // Vista lateral con la lista de servidores.
  const tree = new ServerTreeProvider(store, connections);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("sftpSecureEdit.servers", tree)
  );

  // Refresca el 'arbol si el archivo JSON de configuraci'on cambia (edici'on manual).
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(context.globalStorageUri, "servers.json")
  );
  watcher.onDidCreate(() => tree.refresh());
  watcher.onDidChange(() => tree.refresh());
  watcher.onDidDelete(() => tree.refresh());

  // Todos los servicios que sostienen recursos se a'naden a las suscripciones.
  context.subscriptions.push(connections, fileSystem, tree, watcher);

  registerCommands(context, { store, connections, tree, masterKey });
}

/**
 * Se ejecuta al desactivar la extensi'on.
 * Cierra todas las conexiones SFTP abiertas para no dejar recursos colgando.
 */
export function deactivate(): Thenable<void> | void {
  if (connections) {
    return connections.disconnectAll();
  }
}
