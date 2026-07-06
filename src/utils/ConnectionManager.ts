import * as vscode from "vscode";
import SftpClient = require("ssh2-sftp-client");
import { ConfigStore } from "./ConfigStore";

/**
 * Gestiona un pool de conexiones SFTP, una por servidor.
 * La conexi'on es perezosa: solo se abre cuando se necesita realmente.
 * Permite tener varios servidores conectados a la vez.
 */
export class ConnectionManager implements vscode.Disposable {
  /** Clientes SFTP activos indexados por id de servidor. */
  private readonly clients = new Map<string, SftpClient>();
  /** Promesas de conexi'on en curso para evitar conexiones duplicadas simult'aneas. */
  private readonly pending = new Map<string, Promise<SftpClient>>();

  private readonly onDidChange = new vscode.EventEmitter<void>();
  /** Se dispara cuando cambia el estado de conexi'on de algun servidor. */
  public readonly onDidChangeConnections = this.onDidChange.event;

  constructor(private readonly store: ConfigStore) {}

  /** Indica si un servidor tiene una conexi'on activa. */
  public isConnected(id: string): boolean {
    return this.clients.has(id);
  }

  /**
   * Devuelve un cliente SFTP conectado para el servidor indicado.
   * Si ya existe conexi'on la reutiliza; si no, la crea de forma segura.
   */
  public async getClient(id: string): Promise<SftpClient> {
    const existing = this.clients.get(id);
    if (existing) {
      return existing;
    }
    // Si ya hay una conexi'on en curso, la reutilizamos en lugar de abrir otra.
    const inFlight = this.pending.get(id);
    if (inFlight) {
      return inFlight;
    }

    const connectPromise = this.connect(id);
    this.pending.set(id, connectPromise);
    try {
      return await connectPromise;
    } finally {
      this.pending.delete(id);
    }
  }

  /** Abre una nueva conexi'on SFTP con las credenciales guardadas. */
  private async connect(id: string): Promise<SftpClient> {
    const config = await this.store.getServer(id);
    if (!config) {
      throw new Error(`No existe configuraci'on para el servidor "${id}".`);
    }
    const password = await this.store.getPassword(id);
    if (password === undefined) {
      throw new Error(`No hay contrase'na guardada para "${config.label}".`);
    }

    const client = new SftpClient(id);

    // Si la conexi'on se cae desde el servidor, limpiamos el estado local.
    const cleanup = () => {
      if (this.clients.get(id) === client) {
        this.clients.delete(id);
        this.onDidChange.fire();
      }
    };
    client.on("end", cleanup);
    client.on("close", cleanup);

    await client.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password,
      // Mantiene viva la conexi'on para sesiones de edici'on largas.
      keepaliveInterval: 20000,
    });

    this.clients.set(id, client);
    this.onDidChange.fire();
    return client;
  }

  /** Cierra la conexi'on de un servidor concreto. */
  public async disconnect(id: string): Promise<void> {
    const client = this.clients.get(id);
    if (!client) {
      return;
    }
    this.clients.delete(id);
    try {
      await client.end();
    } finally {
      this.onDidChange.fire();
    }
  }

  /** Cierra todas las conexiones abiertas (uso en deactivate). */
  public async disconnectAll(): Promise<void> {
    const ids = [...this.clients.keys()];
    await Promise.all(ids.map((id) => this.disconnect(id)));
  }

  /** Libera los recursos del gestor al desactivar la extensi'on. */
  public dispose(): void {
    void this.disconnectAll();
    this.onDidChange.dispose();
  }
}
