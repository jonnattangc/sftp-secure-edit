import * as vscode from "vscode";
import SftpClient = require("ssh2-sftp-client");
import { ConnectionManager } from "../utils/ConnectionManager";

/** Esquema de URI propio bajo el que se montan los sistemas de archivos remotos. */
export const SFTP_SCHEME = "sftp";

/**
 * Provee a VSCode un sistema de archivos virtual sobre SFTP.
 * El authority del URI (sftp://<authority>/ruta) identifica al servidor,
 * de modo que un mismo proveedor atiende a varios servidores a la vez.
 */
export class SftpFileSystemProvider implements vscode.FileSystemProvider {
  private readonly onDidChange = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  public readonly onDidChangeFile = this.onDidChange.event;

  /** Cola de operaciones por servidor para serializar el acceso a cada canal SFTP. */
  private readonly queues = new Map<string, Promise<unknown>>();

  constructor(private readonly connections: ConnectionManager) {}

  // --- Utilidades internas -------------------------------------------------

  /** Extrae el id de servidor y la ruta remota absoluta de un URI. */
  private parse(uri: vscode.Uri): { id: string; path: string } {
    return { id: uri.authority, path: uri.path || "/" };
  }

  /**
   * Ejecuta una operaci'on SFTP obteniendo el cliente conectado del servidor,
   * encolando la tarea para que no se solapen operaciones en el mismo canal.
   */
  private run<T>(id: string, task: (client: SftpClient) => Promise<T>): Promise<T> {
    const previous = this.queues.get(id) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(async () => {
        const client = await this.connections.getClient(id);
        return task(client);
      });
    // Guardamos la cadena "silenciada" para que un fallo no bloquee las siguientes.
    this.queues.set(id, next.catch(() => undefined));
    return next;
  }

  /** Traduce errores de SFTP a errores de sistema de archivos que VSCode entiende. */
  private toFsError(error: unknown, uri: vscode.Uri): vscode.FileSystemError {
    const message = error instanceof Error ? error.message : String(error);
    const code = (error as { code?: number | string })?.code;
    if (code === 2 || /no such file|not exist|enoent/i.test(message)) {
      return vscode.FileSystemError.FileNotFound(uri);
    }
    if (code === 4 || code === 3 || /permission denied|eacces/i.test(message)) {
      return vscode.FileSystemError.NoPermissions(uri);
    }
    if (/exists/i.test(message)) {
      return vscode.FileSystemError.FileExists(uri);
    }
    return new vscode.FileSystemError(message);
  }

  // --- API de FileSystemProvider ------------------------------------------

  /** El seguimiento de cambios remotos no se implementa: no-op seguro. */
  public watch(): vscode.Disposable {
    return new vscode.Disposable(() => undefined);
  }

  public async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    const { id, path } = this.parse(uri);
    try {
      return await this.run(id, async (client) => {
        const info = await client.stat(path);
        const type = info.isDirectory
          ? vscode.FileType.Directory
          : info.isFile
          ? vscode.FileType.File
          : vscode.FileType.Unknown;
        return {
          type,
          ctime: info.accessTime ?? 0,
          mtime: info.modifyTime ?? 0,
          size: info.size ?? 0,
        };
      });
    } catch (error) {
      throw this.toFsError(error, uri);
    }
  }

  public async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    const { id, path } = this.parse(uri);
    try {
      return await this.run(id, async (client) => {
        const entries = await client.list(path);
        return entries.map((entry): [string, vscode.FileType] => {
          const type =
            entry.type === "d"
              ? vscode.FileType.Directory
              : entry.type === "l"
              ? vscode.FileType.SymbolicLink
              : vscode.FileType.File;
          return [entry.name, type];
        });
      });
    } catch (error) {
      throw this.toFsError(error, uri);
    }
  }

  public async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    const { id, path } = this.parse(uri);
    try {
      return await this.run(id, async (client) => {
        const data = await client.get(path);
        // Con destino omitido, get() devuelve siempre un Buffer.
        return new Uint8Array(data as Buffer);
      });
    } catch (error) {
      throw this.toFsError(error, uri);
    }
  }

  public async writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean }
  ): Promise<void> {
    const { id, path } = this.parse(uri);
    try {
      await this.run(id, async (client) => {
        const exists = await client.exists(path);
        if (!exists && !options.create) {
          throw vscode.FileSystemError.FileNotFound(uri);
        }
        if (exists && options.create && !options.overwrite) {
          throw vscode.FileSystemError.FileExists(uri);
        }
        await client.put(Buffer.from(content), path);
      });
      this.onDidChange.fire([{ type: vscode.FileChangeType.Changed, uri }]);
    } catch (error) {
      throw error instanceof vscode.FileSystemError ? error : this.toFsError(error, uri);
    }
  }

  public async createDirectory(uri: vscode.Uri): Promise<void> {
    const { id, path } = this.parse(uri);
    try {
      await this.run(id, (client) => client.mkdir(path, false));
      this.onDidChange.fire([{ type: vscode.FileChangeType.Created, uri }]);
    } catch (error) {
      throw this.toFsError(error, uri);
    }
  }

  public async delete(uri: vscode.Uri, options: { recursive: boolean }): Promise<void> {
    const { id, path } = this.parse(uri);
    try {
      await this.run(id, async (client) => {
        const kind = await client.exists(path);
        if (kind === "d") {
          await client.rmdir(path, options.recursive);
        } else {
          await client.delete(path);
        }
      });
      this.onDidChange.fire([{ type: vscode.FileChangeType.Deleted, uri }]);
    } catch (error) {
      throw this.toFsError(error, uri);
    }
  }

  public async rename(
    oldUri: vscode.Uri,
    newUri: vscode.Uri,
    options: { overwrite: boolean }
  ): Promise<void> {
    const source = this.parse(oldUri);
    const target = this.parse(newUri);
    if (source.id !== target.id) {
      // Renombrar entre servidores distintos no es una operaci'on at'omica de SFTP.
      throw vscode.FileSystemError.Unavailable(
        "No se puede mover archivos entre servidores diferentes."
      );
    }
    try {
      await this.run(source.id, async (client) => {
        if (options.overwrite && (await client.exists(target.path))) {
          await client.delete(target.path).catch(() => undefined);
        }
        await client.rename(source.path, target.path);
      });
      this.onDidChange.fire([
        { type: vscode.FileChangeType.Deleted, uri: oldUri },
        { type: vscode.FileChangeType.Created, uri: newUri },
      ]);
    } catch (error) {
      throw this.toFsError(error, newUri);
    }
  }

  public dispose(): void {
    this.onDidChange.dispose();
  }
}
