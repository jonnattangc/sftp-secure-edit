import * as vscode from "vscode";
import { ConfigStore } from "../utils/ConfigStore";
import { ConnectionManager } from "../utils/ConnectionManager";
import { ServerConfig } from "../model/ServerConfig";

/** Elemento del 'arbol que representa a un servidor configurado. */
export class ServerTreeItem extends vscode.TreeItem {
  constructor(
    public readonly config: ServerConfig,
    connected: boolean
  ) {
    super(config.label, vscode.TreeItemCollapsibleState.None);
    this.description = `${config.username}@${config.host}:${config.port}`;
    this.tooltip = connected ? "Conectado" : "Desconectado";
    // El contextValue controla que botones aparecen en el menu contextual.
    this.contextValue = connected ? "server-connected" : "server-disconnected";
    this.iconPath = new vscode.ThemeIcon(
      connected ? "vm-active" : "vm-outline"
    );
    this.id = config.id;
  }
}

/**
 * Proveedor de datos para la vista lateral con la lista de servidores SFTP.
 * Se refresca autom'aticamente cuando cambia el estado de las conexiones.
 */
export class ServerTreeProvider implements vscode.TreeDataProvider<ServerTreeItem> {
  private readonly onDidChange = new vscode.EventEmitter<void>();
  public readonly onDidChangeTreeData = this.onDidChange.event;

  constructor(
    private readonly store: ConfigStore,
    private readonly connections: ConnectionManager
  ) {
    // Al cambiar cualquier conexi'on, repintamos el 'arbol.
    this.connections.onDidChangeConnections(() => this.refresh());
  }

  /** Fuerza el repintado de la vista. */
  public refresh(): void {
    this.onDidChange.fire();
  }

  public getTreeItem(element: ServerTreeItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(): Promise<ServerTreeItem[]> {
    const servers = await this.store.getServers();
    return servers
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((config) => new ServerTreeItem(config, this.connections.isConnected(config.id)));
  }

  public dispose(): void {
    this.onDidChange.dispose();
  }
}
