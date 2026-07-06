import * as vscode from "vscode";
import { CommandDeps } from "./deps";
import { registerAddServer } from "./addServer";
import { registerRemoveServer } from "./removeServer";
import { registerConnectServer } from "./connectServer";
import { registerDisconnectServer } from "./disconnectServer";
import { registerOpenConfig } from "./openConfig";

/**
 * Registra todos los comandos de la extensi'on delegando en cada m'odulo.
 * Mantiene extension.ts libre de l'ogica de comandos.
 */
export function registerCommands(context: vscode.ExtensionContext, deps: CommandDeps): void {
  registerAddServer(context, deps);
  registerRemoveServer(context, deps);
  registerConnectServer(context, deps);
  registerDisconnectServer(context, deps);
  registerOpenConfig(context, deps);

  // Comando trivial de refresco: se registra aqu'i por su sencillez.
  context.subscriptions.push(
    vscode.commands.registerCommand("sftpSecureEdit.refresh", () => deps.tree.refresh())
  );
}
