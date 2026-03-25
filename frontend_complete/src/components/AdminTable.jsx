export default function AdminTable({ rows, onDelete }) {
  return (
    <>
      {/* Vue table pour desktop */}
      <div className="card overflow-x-auto hidden sm:block">
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
                <td className="p-3 truncate">{r.email}</td>
                <td className="p-3 text-xs">{r.createdAt ?? "-"}</td>
                <td className="p-3 text-right">
                  <button onClick={() => onDelete?.(r.id)} className="btn-ghost text-danger">Supprimer</button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan="6" className="p-6 text-center text-neutral-400">Aucune réservation pour l'instant.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Vue cards pour mobile */}
      <div className="sm:hidden space-y-3">
        {rows.length === 0 ? (
          <div className="card p-6 text-center text-neutral-400">
            Aucune réservation pour l'instant.
          </div>
        ) : (
          rows.map(r => (
            <div key={r.id} className="card p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{r.eventTitle ?? r.eventId}</h4>
                  <p className="text-xs text-neutral-400 mt-1">{r.nom} {r.prenom}</p>
                </div>
                <button
                  onClick={() => onDelete?.(r.id)}
                  className="btn-ghost text-danger text-xs ml-2"
                >
                  Supprimer
                </button>
              </div>
              <div className="space-y-1 text-xs text-neutral-300">
                <p><span className="text-neutral-400">Email:</span> {r.email}</p>
                <p><span className="text-neutral-400">Date:</span> {r.createdAt ?? "-"}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
