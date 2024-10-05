import { useCallback, useEffect, useState } from "react";
import { Table } from "./table";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useSearchParams } from "~/useSearchParams";
import { useDuckDb } from "~/useDuckDb";
import { useParquetTable } from "~/useParquetTable";

const DEFAULT_DATASET_URL =
  "https://huggingface.co/datasets/openai/openai_humaneval/resolve/main/openai_humaneval/test-00000-of-00001.parquet";

const usePersistedTextfield = (fieldName: string) => {
  const { searchParams, setSearchParams } = useSearchParams();
  const searchParamsObj = new URLSearchParams(searchParams);
  const textField = searchParamsObj.get(fieldName) || "";
  const setTextField = useCallback(
    (value: string) => {
      setSearchParams({ [fieldName]: value });
    },
    [fieldName, setSearchParams]
  );
  return [textField, setTextField] satisfies [string, (value: string) => void];
};

function App() {
  const [datasetUrl, setDatasetUrl] = usePersistedTextfield("datasetUrl");
  const [datasetQuery, setDatasetQuery] = usePersistedTextfield("datasetQuery");
  const [nextDatasetUrl, setNextDatasetUrl] = useState(() => datasetUrl);
  const [nextDatasetQuery, setNextDatasetQuery] = useState(() => datasetQuery);
  const db = useDuckDb();
  const onQueryChanged = useCallback(
    (query: string) => {
      console.log("Query changed", query);
      setNextDatasetQuery(query);
    },
    [setNextDatasetQuery]
  );
  useEffect(() => {
    setNextDatasetQuery(datasetQuery);
  }, [datasetQuery]);
  const { loading, dataset, error, clearDataset } = useParquetTable(db, {
    datasetUrl,
    datasetQuery,
    setDatasetQuery,
    onQueryChanged,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNextDatasetQuery("");
    setDatasetUrl(nextDatasetUrl);
    setDatasetQuery("");
  };

  return (
    <section className="flex flex-col gap-4 w-full pt-10 px-4 lg:pt-[15%] items-center min-h-screen">
      <h1 className="text-4xl font-bold">📣🦆 Quack</h1>
      <h2 className="text-2xl font-medium">View Parquet Datasets via URL</h2>
      <form
        onSubmit={handleSubmit}
        className="lg:w-1/2 w-full flex flex-col gap-2"
      >
        <Textarea
          rows={2}
          name="textField"
          onChange={(e) => setNextDatasetUrl(e.target.value)}
          value={nextDatasetUrl}
          className="w-full lg:w-full"
        />
        <div className="flex flex-row justify-between gap-2">
          <Button
            className="w-full"
            type="submit"
            disabled={
              !nextDatasetUrl ||
              (nextDatasetUrl === datasetUrl && !!dataset) ||
              loading
            }
          >
            Load
          </Button>
          <Button
            variant={"secondary"}
            type="button"
            onClick={() => {
              if (datasetUrl !== DEFAULT_DATASET_URL) {
                setDatasetQuery("");
                setNextDatasetQuery("");
              }
              setNextDatasetUrl(DEFAULT_DATASET_URL);
              setDatasetUrl(DEFAULT_DATASET_URL);
            }}
          >
            Load Example Dataset
          </Button>
          <Button
            type="button"
            variant={"destructive"}
            onClick={() => {
              setNextDatasetUrl("");
              clearDataset();
              setDatasetUrl("");
            }}
          >
            Clear
          </Button>
        </div>
      </form>
      {dataset && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDatasetQuery(nextDatasetQuery);
          }}
          className="flex gap-2 w-full items-center"
        >
          <Textarea
            rows={2}
            name="textField"
            onChange={(e) => setNextDatasetQuery(e.target.value)}
            value={nextDatasetQuery}
            className="w-full lg:w-full"
            placeholder="SELECT * FROM dataset LIMIT 10;"
          />
          <Button type="submit" className="h-full">
            Run Query
          </Button>
        </form>
      )}
      <div className="flex flex-col gap-2 w-full max-w-full overflow-x-auto bg-secondary rounded">
        {loading && (
          <p className="text-lg font-medium self-center">Loading...</p>
        )}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {dataset && (
          <div className="flex flex-col gap-2">
            <Table data={dataset} />
          </div>
        )}
      </div>
    </section>
  );
}

export default App;
