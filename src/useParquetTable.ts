import { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { useCallback, useEffect, useState } from "react";

// https://duckdb.org/docs/api/wasm/query#arrow-table-to-json
// TODO: import the arrow lib and use the correct type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const arrowResultToJson = (arrowResult: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return arrowResult.toArray().map((row: any) => row.toJSON());
};

export const useParquetTable = (db: AsyncDuckDB | null, datasetUrl: string) => {
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState<null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearDataset = useCallback(() => {
    setDataset(null);
    setError(null);
  }, []);

  const loadDataset = useCallback(() => {
    if (db && datasetUrl) {
      setLoading(true);
      setDataset(null);
      setError(null);
      console.log("Loading", datasetUrl);
      const status: { conn: AsyncDuckDBConnection | null; killed: boolean } = {
        conn: null,
        killed: false,
      };
      db.connect().then((conn) => {
        if (status.killed) {
          conn.close();
          return;
        }
        status.conn = conn;
        conn
          // we get httpfs for free with cors restrictions
          // we get parquet downloaded as we load it
          // https://duckdb.org/docs/api/wasm/extensions
          // https://duckdb.org/docs/api/wasm/data_ingestion#parquet
          .query(
            `LOAD parquet;LOAD httpfs;SELECT * FROM '${datasetUrl}' LIMIT 10`
          )
          .then((result) => setDataset(arrowResultToJson(result)))
          .catch((err) => {
            console.error(err);
            setError(err.message);
            setDataset(null);
          })
          .finally(() => {
            conn.close();
            setLoading(false);
          });
      });

      return () => {
        status.killed = true;
        if (status.conn) {
          console.log("Closing connection");
          status.conn.close();
        }
      };
    } else if (db) {
      console.log("Resetting db");
      db.reset();
    }
  }, [db, datasetUrl]);

  useEffect(() => {
    loadDataset();
  }, [loadDataset]);

  return { loading, dataset, error, clearDataset, loadDataset };
};
