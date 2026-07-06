import * as vscode from "vscode";
import { CommandDeps } from "./deps";
import { resolveTarget } from "./pick";
import { mountServerFolder } from "../utils/mount";

/**
 * Registra el comando para conectar con un servidor.
 * Abre la conexi'on (mostrando progreso) y monta su carpeta remota en el explorador.
 */
export function registerConnectServer(
  context: vscode.ExtensionContext,
  deps: CommandDeps
): void {
  const command = vscode.commands.registerCommand(
    "sftpSecureEdit.connectServer",
    async (arg: unknown) => {
      const config = await resolveTarget(deps.store, arg);
      if (!config) {
        return;
      }

      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Conectando con "${config.label}"...`,
          },
          // Forzamos la conexi'on aqu'i para detectar errores de credenciales cuanto antes.
          () => deps.connections.getClient(config.id)
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`No se pudo conectar con "${config.label}": ${message}`);
        return;
      }

      mountServerFolder(config);
      deps.tree.refresh();
      vscode.window.showInformationMessage(`Conectado a "${config.label}".`);
    }
  );

  context.subscriptions.push(command);
}
