import { ConfigStore } from "../utils/ConfigStore";
import { ConnectionManager } from "../utils/ConnectionManager";
import { ServerTreeProvider } from "../providers/ServerTreeProvider";
import { MasterKeyService } from "../utils/MasterKey";

/** Dependencias compartidas que se inyectan a todos los comandos. */
export interface CommandDeps {
  store: ConfigStore;
  connections: ConnectionManager;
  tree: ServerTreeProvider;
  masterKey: MasterKeyService;
}
