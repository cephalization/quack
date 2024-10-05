import { useEffect, useState } from "react";
import "./App.css";
import { createDb } from "./duck";
import { Table } from "./table";
import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

const DEFAULT_DATASET_URL =
  "https://huggingface.co/datasets/openai/openai_humaneval/resolve/main/openai_humaneval/test-00000-of-00001.parquet";

// https://duckdb.org/docs/api/wasm/query#arrow-table-to-json
// TODO: import the arrow lib and use the correct type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const arrowResultToJson = (arrowResult: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return arrowResult.toArray().map((row: any) => row.toJSON());
};

function App() {
  const [loading, setLoading] = useState(false);
  const [datasetUrl, setDatasetUrl] = useState("");
  const [textField, setTextField] = useState("");
  const [db, setDb] = useState<Awaited<ReturnType<typeof createDb>> | null>(
    null
  );
  const [dataset, setDataset] = useState<null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const status = {
      killed: false,
    };
    const initDb = async () => {
      const db = await createDb();
      if (status.killed) {
        db.terminate();
        return;
      }
      setDb(db);
    };
    initDb();

    return () => {
      status.killed = true;
      setDb((db) => {
        if (db) {
          db.terminate();
        }
        return null;
      });
    };
  }, []);

  useEffect(() => {
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDatasetUrl(textField);
  };

  return (
    <>
      <h1>Quack</h1>
      <h2>Enter a hugging face dataset url</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="textField"
          onChange={(e) => setTextField(e.target.value)}
          value={textField}
        />
        <button type="submit" disabled={!textField || textField === datasetUrl}>
          Load
        </button>
        <button
          type="button"
          onClick={() => {
            setTextField(DEFAULT_DATASET_URL);
            setDatasetUrl(DEFAULT_DATASET_URL);
          }}
        >
          Load Default
        </button>
        <button
          type="button"
          onClick={() => {
            setTextField("");
            setDataset(null);
            setDatasetUrl("");
          }}
        >
          Clear
        </button>
      </form>
      <div>
        <h2>Dataset</h2>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {dataset && <Table data={dataset} />}
      </div>
    </>
  );
}

export default App;
