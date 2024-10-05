import { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { useCallback, useEffect, useRef, useState } from "react";

// https://duckdb.org/docs/api/wasm/query#arrow-table-to-json
// TODO: import the arrow lib and use the correct type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const arrowResultToJson = (arrowResult: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return arrowResult.toArray().map((row: any) => row.toJSON());
};

export const useParquetTable = (
  db: AsyncDuckDB | null,
  {
    datasetUrl,
    datasetQuery,
    setDatasetQuery: _setDatasetQuery,
    onQueryChanged,
  }: {
    datasetUrl: string;
    datasetQuery: string;
    setDatasetQuery: (query: string) => void;
    onQueryChanged?: (query: string) => void;
  }
) => {
  const [datasetLoaded, setDatasetLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [dataset, setDataset] = useState<null>(null);
  const [error, setError] = useState<string | null>(null);
  const onQueryChangedRef = useRef(onQueryChanged);
  useEffect(() => {
    onQueryChangedRef.current = onQueryChanged;
  }, [onQueryChanged]);
  const datasetQueryRef = useRef(datasetQuery);
  useEffect(() => {
    datasetQueryRef.current = datasetQuery;
  }, [datasetQuery]);
  const setDatasetQuery = useCallback(
    (query: string) => {
      _setDatasetQuery(query);
      onQueryChangedRef.current?.(query);
    },
    [_setDatasetQuery, onQueryChangedRef]
  );

  const clearDataset = useCallback(() => {
    setDataset(null);
    setError(null);
  }, []);

  const loadDataset = useCallback(() => {
    if (db && datasetUrl) {
      setLoading(true);
      setDataset(null);
      setError(null);
      setDatasetLoaded(false);
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
            `LOAD parquet;LOAD httpfs;DROP TABLE IF EXISTS dataset;CREATE TABLE dataset AS SELECT * FROM '${datasetUrl}';`
          )
          .then(() => {
            setDatasetLoaded(true);
            if (!datasetQueryRef.current) {
              console.log("Setting default query");
              setDatasetQuery(`SELECT * FROM dataset LIMIT 10;`);
            }
          })
          .catch((err) => {
            console.error(err);
            setError(err.message);
            setDataset(null);
            setDatasetLoaded(false);
            setDatasetQuery("");
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
      setDataset(null);
      setError(null);
      setDatasetLoaded(false);
      setDatasetQuery("");
      db.reset();
    }
  }, [db, datasetUrl, setDatasetQuery, datasetQueryRef]);

  const performQuery = useCallback(
    (query: string) => {
      if (db && datasetLoaded) {
        setQuerying(true);
        db.connect()
          .then((conn) => {
            conn
              .query(query)
              .then((result) => setDataset(arrowResultToJson(result)))
              .catch(setError);
          })
          .finally(() => setQuerying(false));
      }
    },
    [db, datasetLoaded]
  );

  useEffect(() => {
    if (datasetLoaded && datasetQuery) {
      performQuery(datasetQuery);
    }
  }, [datasetLoaded, datasetQuery, performQuery]);

  useEffect(() => {
    loadDataset();
  }, [loadDataset]);

  return {
    loading,
    dataset,
    error,
    clearDataset,
    loadDataset,
    querying,
    performQuery,
  };
};
