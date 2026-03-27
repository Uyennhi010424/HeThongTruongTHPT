export default function DataTable({ columns = [], data = [] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>
              {col.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {columns.map((col) => (
              <td key={col.key} style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                {row[col.dataIndex]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}