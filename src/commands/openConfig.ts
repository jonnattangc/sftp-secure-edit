import * as vscode from "vscode";
import { CommandDeps } from "./deps";

/**
 * Registra el comando para abrir el archivo JSON de configuraci'on.
 * Al permitir editar servidores, exige la clave maestra antes de mostrarlo.
 */
export function registerOpenConfig(
  context: vscode.ExtensionContext,
  deps: CommandDeps
): void {
  const command = vscode.commands.registerCommand(
    "sftpSecureEdit.openConfig",
    async () => {
      // Operaci'on sensible: editar el JSON equivale a editar servidores.
      if (!(await deps.masterKey.ensureUnlocked())) {
        return;
      }
      await deps.store.ensureFile();
      const doc = await vscode.workspace.openTextDocument(deps.store.getConfigFileUri());
      await vscode.window.showTextDocument(doc);
    }
  );

  context.subscriptions.push(command);
}
