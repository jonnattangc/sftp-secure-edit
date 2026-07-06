import * as vscode from "vscode";

/**
 * Clave maestra temporal.
 * TODO: en el futuro se obtendr'a desde un servidor remoto en getMasterKey().
 */
const TEMP_MASTER_KEY = "_Clave2026";

/**
 * Controla el acceso a las operaciones sensibles (a'nadir, editar y eliminar servidores).
 * Exige una clave maestra y la recuerda durante la sesi'on una vez validada.
 */
export class MasterKeyService {
  /** Indica si el usuario ya se ha autenticado en esta sesi'on. */
  private unlocked = false;

  /**
   * Obtiene la clave maestra v'alida.
   * Por ahora devuelve una constante; m'as adelante consultar'a un servidor remoto.
   */
  private async getMasterKey(): Promise<string> {
    return TEMP_MASTER_KEY;
  }

  /**
   * Garantiza que el usuario ha introducido la clave maestra correcta.
   * Devuelve true si el acceso est'a concedido y false si se cancela o falla.
   */
  public async ensureUnlocked(): Promise<boolean> {
    if (this.unlocked) {
      return true;
    }

    const expected = await this.getMasterKey();
    const input = await vscode.window.showInputBox({
      prompt: "Introduce la clave maestra para gestionar los servidores SFTP",
      password: true,
      ignoreFocusOut: true,
    });

    if (input === undefined) {
      // El usuario cancel'o el di'alogo.
      return false;
    }
    if (input !== expected) {
      vscode.window.showErrorMessage("Clave maestra incorrecta.");
      return false;
    }

    this.unlocked = true;
    return true;
  }

  /** Olvida la autenticaci'on de la sesi'on (por ejemplo, para volver a bloquear). */
  public lock(): void {
    this.unlocked = false;
  }
}
