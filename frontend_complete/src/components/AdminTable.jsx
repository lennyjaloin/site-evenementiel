export default function AdminTable({ rows, onDelete }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-black/20 text-neutral-300">
          <tr>
            <th className="text-left p-3">Événement</th>
            <th className="text-left p-3">Nom</th>
            <th className="text-left p-3">Prénom</th>
            <th className="text-left p-3">Email</th>
            <th className="text-left p-3">Date</th>
            <th className="text-right p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-t border-white/5 hover:bg-white/5">
              <td className="p-3">{r.eventTitle ?? r.eventId}</td>
              <td className="p-3">{r.nom}</td>
              <td className="p-3">{r.prenom}</td>
              <td className="p-3">{r.email}</td>
              <td className="p-3">{r.createdAt ?? "-"}</td>
              <td className="p-3 text-right">
                <button onClick={() => onDelete?.(r.id)} className="btn-ghost text-danger">Supprimer</button>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan="6" className="p-6 text-center text-neutral-400">Aucune réservation pour l’instant.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
