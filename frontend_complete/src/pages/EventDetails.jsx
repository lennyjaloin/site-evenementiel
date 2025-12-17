import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEvent } from "../services/api.js";
import ReserveModal from "../components/ReserveModal.jsx";
import { motion } from "framer-motion";

export default function EventDetails() {
  const { id } = useParams();
  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

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

  if (loading) return <div className="container-app py-8 text-neutral-400">Chargement...</div>;
  if (err) return <div className="container-app py-8 text-danger">{err}</div>;
  if (!ev) return null;

  const date = ev.date_start || ev.date;

  return (
    <section className="container-app py-8">
      <motion.div className="card p-6 md:p-8" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{ev.title}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {ev.location && <span className="badge">{ev.location}</span>}
              {date && <span className="badge">{new Date(date).toLocaleString()}</span>}
              {ev.capacity != null && <span className="badge">Capacité: {ev.capacity}</span>}
            </div>
          </div>
          <button onClick={()=>setOpen(true)} className="btn-primary self-start">
            Réserver
          </button>
        </div>

        <p className="text-neutral-200 mt-4 whitespace-pre-line">{ev.description}</p>
      </motion.div>

      <ReserveModal open={open} onClose={()=>setOpen(false)} eventId={ev.id} />
    </section>
  );
}
