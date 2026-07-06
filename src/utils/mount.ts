import * as vscode from "vscode";
import { SFTP_SCHEME } from "../providers/SftpFileSystemProvider";
import { ServerConfig } from "../model/ServerConfig";

/** Construye el URI ra'iz sftp:// de un servidor a partir de su configuraci'on. */
export function serverRootUri(config: ServerConfig): vscode.Uri {
  // Normalizamos la ruta remota para que siempre empiece por "/".
  const path = config.remotePath.startsWith("/")
    ? config.remotePath
    : `/${config.remotePath}`;
  return vscode.Uri.from({ scheme: SFTP_SCHEME, authority: config.id, path });
}

/** Busca el 'indice de la carpeta de trabajo asociada a un servidor. */
function findFolderIndex(id: string): number {
  const folders = vscode.workspace.workspaceFolders ?? [];
  return folders.findIndex(
    (f) => f.uri.scheme === SFTP_SCHEME && f.uri.authority === id
  );
}

/** A'nade la carpeta remota del servidor al explorador si aun no est'a montada. */
export function mountServerFolder(config: ServerConfig): void {
  if (findFolderIndex(config.id) !== -1) {
    return;
  }
  const start = vscode.workspace.workspaceFolders?.length ?? 0;
  vscode.workspace.updateWorkspaceFolders(start, 0, {
    uri: serverRootUri(config),
    name: `SFTP: ${config.label}`,
  });
}

/** Quita la carpeta remota del servidor del explorador si estaba montada. */
export function unmountServerFolder(id: string): void {
  const index = findFolderIndex(id);
  if (index !== -1) {
    vscode.workspace.updateWorkspaceFolders(index, 1);
  }
}
