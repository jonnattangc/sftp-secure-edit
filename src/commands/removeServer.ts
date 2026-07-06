import * as vscode from "vscode";
import { CommandDeps } from "./deps";
import { resolveTarget } from "./pick";
import { unmountServerFolder } from "../utils/mount";

/**
 * Registra el comando para eliminar un servidor.
 * Pide confirmaci'on, cierra la conexi'on y borra su configuraci'on y contrase'na.
 */
export function registerRemoveServer(
  context: vscode.ExtensionContext,
  deps: CommandDeps
): void {
  const command = vscode.commands.registerCommand(
    "sftpSecureEdit.removeServer",
    async (arg: unknown) => {
      // Operaci'on sensible: exige la clave maestra antes de continuar.
      if (!(await deps.masterKey.ensureUnlocked())) {
        return;
      }
      const config = await resolveTarget(deps.store, arg);
      if (!config) {
        return;
      }

      const confirm = await vscode.window.showWarningMessage(
        `¿Eliminar el servidor "${config.label}"? Esta accion no borra archivos remotos.`,
        { modal: true },
        "Eliminar"
      );
      if (confirm !== "Eliminar") {
        return;
      }

      unmountServerFolder(config.id);
      await deps.connections.disconnect(config.id);
      await deps.store.removeServer(config.id);
      deps.tree.refresh();
      vscode.window.showInformationMessage(`Servidor "${config.label}" eliminado.`);
    }
  );

  context.subscriptions.push(command);
}
