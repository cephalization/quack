import * as duckdb from "@duckdb/duckdb-wasm";

const production = import.meta.env.PROD;

const makeUrl = (path: string) =>
  `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm/dist/${path}`;

const MANUAL_BUNDLES:
  | duckdb.DuckDBBundles
  | (() => Promise<duckdb.DuckDBBundles>) = production
  ? {
      mvp: {
        mainModule: makeUrl("duckdb-mvp.wasm"),
        mainWorker: makeUrl("duckdb-browser-mvp.worker.js"),
      },
      eh: {
        mainModule: makeUrl("duckdb-eh.wasm"),
        mainWorker: makeUrl("duckdb-browser-eh.worker.js"),
      },
    }
  : async () => ({
      mvp: {
        mainModule: (
          await import("@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url")
        ).default,
        mainWorker: (
          await import(
            "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url"
          )
        ).default,
      },
      eh: {
        mainModule: (
          await import("@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url")
        ).default,
        mainWorker: (
          await import(
            "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url"
          )
        ).default,
      },
    });
// https://duckdb.org/docs/api/wasm/instantiation#vite
export const createDb = async () => {
  const bundles =
    typeof MANUAL_BUNDLES === "function"
      ? await MANUAL_BUNDLES()
      : MANUAL_BUNDLES;
  // Select a bundle based on browser checks
  const bundle = await duckdb.selectBundle(bundles);
  // Instantiate the asynchronus version of DuckDB-wasm
  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  return db;
};

export type DuckDB = typeof duckdb;
