import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getReservations } from "../services/api.js";
import { Link } from "react-router-dom";

export default function MesReservations() {
  const { user, isAuthed } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isAuthed) return;
    (async () => {
      try {
        const data = await getReservations();
        const mine = data.filter(r => r.email === user?.email);
        setReservations(mine);
      } catch (e) { setErr(e.message); }
      finally { setLoading(false); }
    })();
  }, [isAuthed, user]);

  if (!isAuthed) return (
    <div className="container-app py-16 text-center">
      <p className="text-neutral-400 mb-4">Connecte-toi pour voir tes réservations</p>
      <Link to="/login" className="btn-primary">Se connecter</Link>
    </div>
  );

  return (
    <div className="container-app py-6 sm:py-10">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">Mes réservations</h1>
      <p className="text-neutral-400 text-sm mb-6">
        {reservations.length > 0 ? `${reservations.length} réservation${reservations.length > 1 ? "s" : ""}` : "Aucune réservation"}
      </p>

      {loading && <p className="text-neutral-400">Chargement...</p>}
      {err && <p className="text-danger">{err}</p>}

      {!loading && reservations.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎟️</div>
          <p className="text-neutral-400 mb-6">Tu n'as pas encore de réservation</p>
          <Link to="/" className="btn-primary">Trouver un événement</Link>
        </div>
      )}

      {!loading && reservations.length > 0 && (
        <div className="flex flex-col gap-3">
          {reservations.map(r => (
            <div key={r.id} className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold">{r.nom} {r.prenom}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{r.email}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Réservé le {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${r.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                  {r.status === "confirmed" ? "Confirmée" : "Annulée"}
                </span>
                <Link to={`/events/${r.event_id}`} className="btn-secondary text-xs">
                  Voir l'événement
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
