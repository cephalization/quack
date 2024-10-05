import React, { useMemo } from "react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

interface TableProps {
  data: Record<string, unknown>[];
}

export const Table: React.FC<TableProps> = ({ data }) => {
  const headers = useMemo(
    () =>
      data.length > 0 && typeof data[0] === "object"
        ? Object.keys(data[0])
        : [],
    [data]
  );

  if (data.length === 0)
    return <div className="text-center p-8 font-mono">no data for query</div>;

  return (
    <table className="text-xs">
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {headers.map((header) => (
              <TableCell key={`${rowIndex}-${header}`}>
                {String(row[header])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </table>
  );
};
