import { useEffect, useMemo, useState } from "react";
import AdminTable from "../components/AdminTable.jsx";
import { createEvent, deleteEvent, getEvents, getReservations, deleteReservation, uploadImage } from "../services/api.js";
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
  const [timeStartH, setTimeStartH] = useState("00");
  const [timeStartM, setTimeStartM] = useState("00");
  const [dateEnd, setDateEnd] = useState("");
  const [timeEndH, setTimeEndH] = useState("00");
  const [timeEndM, setTimeEndM] = useState("00");
  const [capacity, setCapacity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [formMsg, setFormMsg] = useState("");

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const [r, e] = await Promise.all([getReservations(), getEvents()]);
      setReservations(r);
      setEvents(e.data || []);
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
    if (!confirm("Supprimer cette reservation ?")) return;
    try {
      await deleteReservation(id);
      setReservations(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  const onDeleteEvent = async (id) => {
    if (!confirm("Supprimer cet evenement ?")) return;
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
        date_start: dateStart ? `${dateStart}T${timeStartH}:${timeStartM}` : null,
        date_end: dateEnd ? `${dateEnd}T${timeEndH}:${timeEndM}` : null,
        capacity: capacity === "" ? null : Number(capacity),
        image_url: imageUrl || null,
        is_public: isPublic ? 1 : 0
      };
      const created = await createEvent(payload);
      setEvents(prev => [created, ...prev]);
      setTitle(""); setDescription(""); setLocation("");
      setDateStart(""); setTimeStartH("00"); setTimeStartM("00");
      setDateEnd(""); setTimeEndH("00"); setTimeEndM("00");
      setCapacity(""); setImageUrl(""); setImagePreview(null);
      setIsPublic(true);
      setFormMsg("Evenement cree");
      setTab("events");
    } catch (e2) {
      setErr(e2.message);
    }
  };

  return (
    <section className="container-app py-6 sm:py-8">
      <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6"
        initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Admin</h2>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1">
            Cree tes evenements et gere les reservations.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>setTab("events")} className={`text-xs sm:text-sm ${tab==="events"?"btn-primary":"btn-secondary"}`}>Evenements</button>
          <button onClick={()=>setTab("reservations")} className={`text-xs sm:text-sm ${tab==="reservations"?"btn-primary":"btn-secondary"}`}>Reservations</button>
          <button onClick={load} className="btn-ghost text-xs sm:text-sm">Rafraichir</button>
        </div>
      </motion.div>

      {loading && <div className="text-neutral-400">Chargement...</div>}
      {err && <div className="text-danger mb-4">{err}</div>}

      {!loading && tab==="events" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-semibold text-lg mb-3">Creer un evenement</h3>
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
                  <label className="label">Capacite</label>
                  <input className="input" type="number" min="0" value={capacity} onChange={e=>setCapacity(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Début</label>
                <div className="flex gap-2">
                  <input className="input flex-1" type="date" value={dateStart} onChange={e=>setDateStart(e.target.value)} />
                  <select className="input w-20" value={timeStartH} onChange={e=>setTimeStartH(e.target.value)}>
                    {Array.from({length:24},(_,i)=>String(i).padStart(2,"0")).map(h=><option key={h}>{h}</option>)}
                  </select>
                  <select className="input w-20" value={timeStartM} onChange={e=>setTimeStartM(e.target.value)}>
                    {["00","15","30","45"].map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Fin</label>
                <div className="flex gap-2">
                  <input className="input flex-1" type="date" value={dateEnd} onChange={e=>setDateEnd(e.target.value)} />
                  <select className="input w-20" value={timeEndH} onChange={e=>setTimeEndH(e.target.value)}>
                    {Array.from({length:24},(_,i)=>String(i).padStart(2,"0")).map(h=><option key={h}>{h}</option>)}
                  </select>
                  <select className="input w-20" value={timeEndM} onChange={e=>setTimeEndM(e.target.value)}>
                    {["00","15","30","45"].map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Photo</label>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/10 rounded-xl p-4 cursor-pointer hover:border-white/20 transition">
                  {imagePreview ? (
                    <img src={imagePreview} alt="aperçu" className="w-full max-h-40 object-cover rounded-lg" />
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                      <span className="text-xs text-neutral-400">{uploading ? "Envoi en cours..." : "Clique pour choisir une photo"}</span>
                      <span className="text-xs text-neutral-500">JPG, PNG, WebP — max 25 Mo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setImagePreview(URL.createObjectURL(file));
                      setUploading(true);
                      try {
                        const url = await uploadImage(file);
                        setImageUrl(url);
                      } catch (err) {
                        setErr(err.message);
                        setImagePreview(null);
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                </label>
                {imagePreview && (
                  <button type="button" className="text-xs text-neutral-400 hover:text-white mt-1" onClick={() => { setImagePreview(null); setImageUrl(""); }}>
                    Supprimer la photo
                  </button>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-200">
                <input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)} />
                Public
              </label>

              {formMsg && <p className="text-ok text-sm">{formMsg}</p>}

              <button className="btn-primary w-full" disabled={uploading}>{uploading ? "Envoi photo..." : "Creer"}</button>
            </form>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-lg mb-3">Liste des evenements</h3>
            <div className="space-y-2 max-h-[520px] overflow-auto pr-2">
              {events.map(ev => (
                <div key={ev.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-bgSoft">
                  <div>
                    <div className="font-semibold">{ev.title}</div>
                    <div className="text-xs text-neutral-400">{ev.location || "-"} � {ev.date_start ? new Date(ev.date_start).toLocaleString() : "date libre"}</div>
                  </div>
                  <button onClick={()=>onDeleteEvent(ev.id)} className="btn-ghost text-danger">Suppr.</button>
                </div>
              ))}
              {events.length===0 && <p className="text-neutral-400 text-sm">Aucun evenement.</p>}
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
              <option value="">Tous les evenements</option>
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
