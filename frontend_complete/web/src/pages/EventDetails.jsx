import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEvent, deleteEvent } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import ReserveModal from "../components/ReserveModal.jsx";
import { motion } from "framer-motion";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getEvent(id);
        setEv(data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${ev.title}" ? Cette action est irréversible.`)) return;
    setDeleting(true);
    try {
      await deleteEvent(ev.id);
      navigate("/");
    } catch (e) {
      setErr(e.message);
      setDeleting(false);
    }
  };

  if (loading) return <div className="container-app py-8 text-neutral-400">Chargement...</div>;
  if (err) return <div className="container-app py-8 text-danger">{err}</div>;
  if (!ev) return null;

  const date = ev.date_start || ev.date;
  const isComplet = ev.capacity != null && ev.placesRestantes != null && ev.placesRestantes <= 0;
  const isAdmin = user?.role === "admin";

  return (
    <section className="container-app py-6 sm:py-8">
      <motion.div className="card overflow-hidden" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {/* Image */}
        {ev.image_url && (
          <div className="w-full h-48 sm:h-64 md:h-80 overflow-hidden">
            <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-5 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">{ev.title}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {ev.location && (
                  <span className="badge flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {ev.location}
                  </span>
                )}
                {date && (
                  <span className="badge flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
                    </svg>
                    {new Date(date).toLocaleString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                {ev.capacity != null && (
                  <span className={`badge ${isComplet ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                    {isComplet ? "Complet" : `${ev.reservationsCount || 0}/${ev.capacity} places`}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {isAdmin && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn-ghost text-red-400 hover:bg-red-500/10 border border-red-500/20"
                >
                  {deleting ? "Suppression..." : "Supprimer"}
                </button>
              )}
              {isComplet ? (
                <button disabled className="btn-secondary opacity-50 cursor-not-allowed">Complet</button>
              ) : (
                <button onClick={() => setOpen(true)} className="btn-primary">Réserver</button>
              )}
            </div>
          </div>

          <p className="text-neutral-200 mt-6 whitespace-pre-line text-sm sm:text-base leading-relaxed">{ev.description}</p>

          {ev.placesRestantes != null && !isComplet && (
            <p className="text-xs sm:text-sm text-emerald-400 mt-4">
              {ev.placesRestantes} place{ev.placesRestantes > 1 ? "s" : ""} restante{ev.placesRestantes > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </motion.div>

      <ReserveModal open={open} onClose={() => setOpen(false)} eventId={ev.id} />
    </section>
  );
}
