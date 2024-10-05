import { useEffect, useState } from "react";
import { createDb } from "~/duck";

export const useDuckDb = () => {
  const [db, setDb] = useState<Awaited<ReturnType<typeof createDb>> | null>(
    null
  );

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

  return db;
};
