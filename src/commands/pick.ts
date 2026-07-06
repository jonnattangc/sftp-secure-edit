import * as vscode from "vscode";
import { ConfigStore } from "../utils/ConfigStore";
import { ServerTreeItem } from "../providers/ServerTreeProvider";
import { ServerConfig } from "../model/ServerConfig";

/**
 * Resuelve el servidor destino de un comando.
 * Si llega desde el menu contextual usa el elemento; si no, muestra un selector.
 */
export async function resolveTarget(
  store: ConfigStore,
  arg: unknown
): Promise<ServerConfig | undefined> {
  if (arg instanceof ServerTreeItem) {
    return arg.config;
  }

  const servers = await store.getServers();
  if (servers.length === 0) {
    vscode.window.showInformationMessage("No hay servidores configurados todavia.");
    return undefined;
  }

  const picked = await vscode.window.showQuickPick(
    servers.map((s) => ({ label: s.label, description: `${s.username}@${s.host}`, id: s.id })),
    { placeHolder: "Selecciona un servidor" }
  );
  return picked ? store.getServer(picked.id) : undefined;
}
