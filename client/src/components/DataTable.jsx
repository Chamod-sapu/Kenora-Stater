export default function DataTable({ columns, rows, empty = 'No data' }) {
  if (!rows.length) return <p>{empty}</p>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>{columns.map((c) => <th key={c.key} style={{ textAlign: 'left' }}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id || r._id}>
            {columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}