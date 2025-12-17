import { useEffect, useMemo, useState } from "react";
import AdminTable from "../components/AdminTable.jsx";
import { createEvent, deleteEvent, getEvents, getReservations, deleteReservation } from "../services/api.js";
import { motion } from "framer-motion";

export default function Admin() {
  const [tab, setTab] = useState("events"); // events | reservations
  const [reservations, setReservations] = useState([]);
  const [events, setEvents] = useState([]);
  const [filterEventId, setFilterEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [capacity, setCapacity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [formMsg, setFormMsg] = useState("");

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const [r, e] = await Promise.all([getReservations(), getEvents()]);
      setReservations(r);
      setEvents(e);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const filtered = filterEventId
      ? reservations.filter(r => String(r.event_id) === String(filterEventId))
      : reservations;

    return filtered.map(r => ({
      id: r.id,
      event: events.find(e => e.id === r.event_id)?.title || r.event_id,
      nom: r.nom,
      prenom: r.prenom,
      email: r.email,
      status: r.status,
      created_at: r.created_at
    }));
  }, [reservations, events, filterEventId]);

  const onDeleteReservation = async (id) => {
    if (!confirm("Supprimer cette réservation ?")) return;
    try {
      await deleteReservation(id);
      setReservations(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  const onDeleteEvent = async (id) => {
    if (!confirm("Supprimer cet événement ?")) return;
    try {
      await deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  const onCreateEvent = async (e) => {
    e.preventDefault(); setFormMsg(""); setErr("");
    try {
      const payload = {
        title,
        description,
        location,
        date_start: dateStart || null,
        date_end: dateEnd || null,
        capacity: capacity === "" ? null : Number(capacity),
        image_url: imageUrl || null,
        is_public: isPublic ? 1 : 0
      };
      const created = await createEvent(payload);
      setEvents(prev => [created, ...prev]);
      setTitle(""); setDescription(""); setLocation("");
      setDateStart(""); setDateEnd(""); setCapacity(""); setImageUrl("");
      setIsPublic(true);
      setFormMsg("Événement créé ✅");
      setTab("events");
    } catch (e2) {
      setErr(e2.message);
    }
  };

  return (
    <section className="container-app py-8">
      <motion.div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6"
        initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}>
        <div>
          <h2 className="text-3xl font-bold">Admin</h2>
          <p className="text-neutral-400 text-sm mt-1">
            Crée tes événements et gère les réservations.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setTab("events")} className={tab==="events"?"btn-primary":"btn-secondary"}>Événements</button>
          <button onClick={()=>setTab("reservations")} className={tab==="reservations"?"btn-primary":"btn-secondary"}>Réservations</button>
          <button onClick={load} className="btn-ghost">Rafraîchir</button>
        </div>
      </motion.div>

      {loading && <div className="text-neutral-400">Chargement...</div>}
      {err && <div className="text-danger mb-4">{err}</div>}

      {!loading && tab==="events" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-semibold text-lg mb-3">Créer un événement</h3>
            <form onSubmit={onCreateEvent} className="space-y-3">
              <div>
                <label className="label">Titre</label>
                <input className="input" value={title} onChange={e=>setTitle(e.target.value)} required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[120px]" value={description} onChange={e=>setDescription(e.target.value)} required />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Lieu</label>
                  <input className="input" value={location} onChange={e=>setLocation(e.target.value)} />
                </div>
                <div>
                  <label className="label">Capacité</label>
                  <input className="input" type="number" min="0" value={capacity} onChange={e=>setCapacity(e.target.value)} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Début</label>
                  <input className="input" type="datetime-local" value={dateStart} onChange={e=>setDateStart(e.target.value)} />
                </div>
                <div>
                  <label className="label">Fin</label>
                  <input className="input" type="datetime-local" value={dateEnd} onChange={e=>setDateEnd(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Image URL</label>
                <input className="input" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-200">
                <input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)} />
                Public
              </label>

              {formMsg && <p className="text-ok text-sm">{formMsg}</p>}

              <button className="btn-primary w-full">Créer</button>
            </form>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-lg mb-3">Liste des événements</h3>
            <div className="space-y-2 max-h-[520px] overflow-auto pr-2">
              {events.map(ev => (
                <div key={ev.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-bgSoft">
                  <div>
                    <div className="font-semibold">{ev.title}</div>
                    <div className="text-xs text-neutral-400">{ev.location || "—"} • {ev.date_start ? new Date(ev.date_start).toLocaleString() : "date libre"}</div>
                  </div>
                  <button onClick={()=>onDeleteEvent(ev.id)} className="btn-ghost text-danger">Suppr.</button>
                </div>
              ))}
              {events.length===0 && <p className="text-neutral-400 text-sm">Aucun événement.</p>}
            </div>
          </div>
        </div>
      )}

      {!loading && tab==="reservations" && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <select
              className="input text-sm max-w-xs"
              value={filterEventId}
              onChange={(e)=>setFilterEventId(e.target.value)}
            >
              <option value="">Tous les événements</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
          <AdminTable rows={rows} onDelete={onDeleteReservation} />
        </>
      )}
    </section>
  );
}
