import * as vscode from "vscode";
import { ServerConfig } from "../model/ServerConfig";

/** Nombre del archivo JSON persistente con la configuraci'on de servidores. */
const CONFIG_FILE = "servers.json";

/** Registro tal cual se guarda en disco: incluye la contrase'na. */
interface StoredServer extends ServerConfig {
  password: string;
}

/** Estructura ra'iz del archivo de configuraci'on. */
interface ConfigFile {
  servers: StoredServer[];
}

/**
 * Persiste la configuraci'on de los servidores en un archivo JSON editable.
 * El archivo vive en el almacenamiento global de la extensi'on, de modo que
 * sobrevive entre sesiones y el usuario puede editarlo a mano.
 */
export class ConfigStore {
  private readonly fileUri: vscode.Uri;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.fileUri = vscode.Uri.joinPath(context.globalStorageUri, CONFIG_FILE);
  }

  /** Ruta del archivo de configuraci'on (para abrirlo desde un comando). */
  public getConfigFileUri(): vscode.Uri {
    return this.fileUri;
  }

  /** Crea la carpeta de almacenamiento y el archivo vac'io si aun no existen. */
  public async ensureFile(): Promise<void> {
    try {
      await vscode.workspace.fs.stat(this.fileUri);
    } catch {
      await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);
      await this.writeAll([]);
    }
  }

  /** Lee y parsea todos los registros del archivo JSON. */
  private async readAll(): Promise<StoredServer[]> {
    try {
      const bytes = await vscode.workspace.fs.readFile(this.fileUri);
      const parsed = JSON.parse(Buffer.from(bytes).toString("utf8")) as ConfigFile;
      return Array.isArray(parsed.servers) ? parsed.servers : [];
    } catch {
      // Archivo inexistente o JSON inv'alido: tratamos como lista vac'ia.
      return [];
    }
  }

  /** Serializa y escribe todos los registros en el archivo JSON. */
  private async writeAll(servers: StoredServer[]): Promise<void> {
    const content: ConfigFile = { servers };
    const data = Buffer.from(JSON.stringify(content, null, 2), "utf8");
    await vscode.workspace.fs.writeFile(this.fileUri, data);
  }

  /** Quita la contrase'na de un registro antes de exponerlo al resto de la app. */
  private strip(server: StoredServer): ServerConfig {
    const { password: _password, ...config } = server;
    return config;
  }

  /** Devuelve la lista de servidores configurados (sin contrase'nas). */
  public async getServers(): Promise<ServerConfig[]> {
    return (await this.readAll()).map((s) => this.strip(s));
  }

  /** Busca un servidor por su identificador (sin contrase'na). */
  public async getServer(id: string): Promise<ServerConfig | undefined> {
    const found = (await this.readAll()).find((s) => s.id === id);
    return found ? this.strip(found) : undefined;
  }

  /** Recupera la contrase'na de un servidor desde el archivo. */
  public async getPassword(id: string): Promise<string | undefined> {
    return (await this.readAll()).find((s) => s.id === id)?.password;
  }

  /**
   * A'nade o actualiza un servidor.
   * Si no se pasa contrase'na, se conserva la que ya tuviera.
   */
  public async upsertServer(config: ServerConfig, password?: string): Promise<void> {
    const servers = await this.readAll();
    const existing = servers.find((s) => s.id === config.id);
    const nextPassword = password ?? existing?.password ?? "";
    const filtered = servers.filter((s) => s.id !== config.id);
    filtered.push({ ...config, password: nextPassword });
    await this.writeAll(filtered);
  }

  /** Elimina un servidor del archivo de configuraci'on. */
  public async removeServer(id: string): Promise<void> {
    const servers = (await this.readAll()).filter((s) => s.id !== id);
    await this.writeAll(servers);
  }
}
