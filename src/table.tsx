import React, { useMemo } from "react";

interface TableProps {
  data: Record<string, unknown>[];
}

export const Table: React.FC<TableProps> = ({ data }) => {
  const headers = useMemo(() => Object.keys(data[0]), [data]);

  if (data.length === 0) return null;

  return (
    <table>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {headers.map((header) => (
              <td key={`${rowIndex}-${header}`}>{String(row[header])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
