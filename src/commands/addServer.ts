import * as vscode from "vscode";
import { CommandDeps } from "./deps";
import { ServerConfig } from "../model/ServerConfig";

/** Caracteres permitidos en el identificador: debe ser v'alido como authority de URI. */
const ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

/** Propone un identificador a partir del nombre, que el usuario podr'a editar. */
function suggestId(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
}

/** Pide un dato obligatorio; devuelve undefined si el usuario cancela. */
async function ask(
  prompt: string,
  options: vscode.InputBoxOptions = {}
): Promise<string | undefined> {
  const value = await vscode.window.showInputBox({ prompt, ignoreFocusOut: true, ...options });
  return value === undefined ? undefined : value.trim();
}

/**
 * Registra el comando para a'nadir un servidor SFTP.
 * Solicita los datos de conexi'on y guarda la contrase'na de forma cifrada.
 */
export function registerAddServer(context: vscode.ExtensionContext, deps: CommandDeps): void {
  const command = vscode.commands.registerCommand("sftpSecureEdit.addServer", async () => {
    // Operaci'on sensible: exige la clave maestra antes de continuar.
    if (!(await deps.masterKey.ensureUnlocked())) {
      return;
    }
    const label = await ask("Nombre del servidor", { placeHolder: "Mi servidor de produccion" });
    if (!label) {
      return;
    }

    // El identificador lo define el usuario; debe ser 'unico y v'alido como URI.
    const existingIds = new Set((await deps.store.getServers()).map((s) => s.id));
    const id = await ask("Identificador unico del servidor", {
      value: suggestId(label),
      placeHolder: "mi-servidor",
      validateInput: (raw) => {
        const value = raw.trim().toLowerCase();
        if (!value) {
          return "El identificador no puede estar vacio.";
        }
        if (!ID_PATTERN.test(value)) {
          return "Usa solo minusculas, numeros y . _ - , empezando por letra o numero.";
        }
        if (existingIds.has(value)) {
          return "Ya existe un servidor con ese identificador.";
        }
        return undefined;
      },
    });
    if (!id) {
      return;
    }
    const normalizedId = id.toLowerCase();

    const host = await ask("Host o direccion IP", { placeHolder: "192.168.1.10" });
    if (!host) {
      return;
    }
    const portText = await ask("Puerto SFTP", { value: "22" });
    if (portText === undefined) {
      return;
    }
    const port = Number.parseInt(portText, 10);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      vscode.window.showErrorMessage("El puerto indicado no es valido.");
      return;
    }
    const username = await ask("Nombre de usuario", { placeHolder: "usuario" });
    if (!username) {
      return;
    }
    const password = await ask("Contrasena", { password: true });
    if (password === undefined) {
      return;
    }
    const remotePath = (await ask("Carpeta remota inicial", { value: "/" })) || "/";

    const config: ServerConfig = {
      id: normalizedId,
      label,
      host,
      port,
      username,
      remotePath,
    };

    await deps.store.upsertServer(config, password);
    deps.tree.refresh();
    vscode.window.showInformationMessage(`Servidor "${label}" añadido correctamente.`);
  });

  // Registramos la suscripci'on para liberar el comando al desactivar la extensi'on.
  context.subscriptions.push(command);
}
