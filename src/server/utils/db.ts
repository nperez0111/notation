/**
 * Lazy database singleton for Nitro server routes.
 * Uses the shared db module from src/db/.
 */

import { type DbState, createDbState } from "../../db";
import { join } from "path";

let _dbState: DbState | null = null;

/**
 * Get or create the database state singleton.
 * DB path is configurable via PHOENIX_DB_DIR env var, defaults to .data/ in project root.
 */
export function getDb(): DbState {
  if (_dbState) return _dbState;

  const dbDir = process.env.PHOENIX_DB_DIR ?? join(process.cwd(), ".data");
  _dbState = createDbState(dbDir);
  console.log(`[server] Database initialized at: ${_dbState.dbPath}`);
  return _dbState;
}
