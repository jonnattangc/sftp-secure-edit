/**
 * Configuraci'on no sensible de un servidor SFTP.
 * La contrase'na NUNCA se guarda aqu'i: se almacena cifrada en SecretStorage.
 */
export interface ServerConfig {
  /**
   * Identificador 'unico definido por el usuario (se usa como authority del URI).
   * Debe estar en minusculas y solo contener letras, numeros y . _ -
   */
  readonly id: string;
  /** Nombre legible que se muestra en el 'arbol de servidores. */
  label: string;
  /** Host o direcci'on IP del servidor remoto. */
  host: string;
  /** Puerto SFTP (por defecto 22). */
  port: number;
  /** Nombre de usuario para la autenticaci'on. */
  username: string;
  /** Carpeta remota que se abre como ra'iz al conectar. */
  remotePath: string;
}
