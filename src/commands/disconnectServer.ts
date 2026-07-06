import * as vscode from "vscode";
import { CommandDeps } from "./deps";
import { resolveTarget } from "./pick";
import { unmountServerFolder } from "../utils/mount";

/**
 * Registra el comando para desconectar un servidor.
 * Cierra la conexi'on SFTP y desmonta su carpeta del explorador.
 */
export function registerDisconnectServer(
  context: vscode.ExtensionContext,
  deps: CommandDeps
): void {
  const command = vscode.commands.registerCommand(
    "sftpSecureEdit.disconnectServer",
    async (arg: unknown) => {
      const config = await resolveTarget(deps.store, arg);
      if (!config) {
        return;
      }
      unmountServerFolder(config.id);
      await deps.connections.disconnect(config.id);
      deps.tree.refresh();
      vscode.window.showInformationMessage(`Desconectado de "${config.label}".`);
    }
  );

  context.subscriptions.push(command);
}
