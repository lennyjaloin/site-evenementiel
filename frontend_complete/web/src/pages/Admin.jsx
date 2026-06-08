import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminTable from "../components/AdminTable.jsx";
import { createEvent, updateEvent, deleteEvent, getEvents, getReservations, deleteReservation, uploadImage } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { motion } from "framer-motion";

export default function Admin() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab =
    requestedTab === "all" && user?.role === 'admin' ? "all" :
    requestedTab === "mine" ? "mine" :
    "events";
  const [tab, setTab] = useState(initialTab); // events | mine | all | reservations
  const [editingId, setEditingId] = useState(null);
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
      const [r, e] = await Promise.all([getReservations(), getEvents({ limit: 100 })]);
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
      ? reservations.filter(r => String(r.eventId) === String(filterEventId))
      : reservations;

    return filtered.map(r => ({
      id: r.id,
      event: r.eventTitle || events.find(e => e.id === r.eventId)?.title || r.eventId,
      nom: r.nom,
      prenom: r.prenom,
      email: r.email,
      status: r.status,
      created_at: r.createdAt
    }));
  }, [reservations, events, filterEventId]);

  const stats = useMemo(() => {
    const withCapacity = events.filter(ev => ev.capacity != null && ev.capacity > 0);
    const avgFillRate = withCapacity.length
      ? (withCapacity.reduce((sum, ev) => sum + (ev.reservationsCount || 0) / ev.capacity, 0) / withCapacity.length) * 100
      : 0;
    return { total: events.length, avgFillRate };
  }, [events]);

  const myEvents = useMemo(
    () => events.filter(ev => ev.created_by === user?.id),
    [events, user]
  );

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

  const resetForm = () => {
    setEditingId(null);
    setTitle(""); setDescription(""); setLocation("");
    setDateStart(""); setTimeStartH("00"); setTimeStartM("00");
    setDateEnd(""); setTimeEndH("00"); setTimeEndM("00");
    setCapacity(""); setImageUrl(""); setImagePreview(null);
    setIsPublic(true);
  };

  const splitDateTime = (value) => {
    if (!value) return { date: "", h: "00", m: "00" };
    const d = new Date(value);
    if (isNaN(d.getTime())) return { date: "", h: "00", m: "00" };
    const pad = (n) => String(n).padStart(2, "0");
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      h: pad(d.getHours()),
      m: pad(Math.floor(d.getMinutes() / 15) * 15)
    };
  };

  const onEditEvent = (ev) => {
    setEditingId(ev.id);
    setTitle(ev.title || "");
    setDescription(ev.description || "");
    setLocation(ev.location || "");
    setCapacity(ev.capacity != null ? String(ev.capacity) : "");
    setImageUrl(ev.image_url || "");
    setImagePreview(ev.image_url || null);
    setIsPublic(!!ev.is_public);

    const start = splitDateTime(ev.date_start);
    setDateStart(start.date); setTimeStartH(start.h); setTimeStartM(start.m);
    const end = splitDateTime(ev.date_end);
    setDateEnd(end.date); setTimeEndH(end.h); setTimeEndM(end.m);

    setFormMsg("");
    setTab("events");
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

      if (editingId) {
        const updated = await updateEvent(editingId, payload);
        setEvents(prev => prev.map(e2 => e2.id === editingId ? { ...e2, ...updated } : e2));
        setFormMsg("Evenement modifie");
      } else {
        const created = await createEvent(payload);
        setEvents(prev => [created, ...prev]);
        setFormMsg("Evenement cree");
      }
      resetForm();
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
          <h2 className="text-2xl sm:text-3xl font-bold">
            {user?.role === 'admin' ? 'Admin' : `Cree ton evenement, ${user?.username || ''}`}
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1">
            Cree tes evenements et gere les reservations.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tab === "mine" || tab === "all" ? (
            <button onClick={()=>setTab("events")} className="btn-ghost text-xs sm:text-sm">&larr; Retour</button>
          ) : (
            <>
              <button onClick={()=>setTab("events")} className={`text-xs sm:text-sm ${tab==="events"?"btn-primary":"btn-secondary"}`}>Evenements</button>
              <button onClick={()=>setTab("mine")} className={`text-xs sm:text-sm ${tab==="mine"?"btn-primary":"btn-secondary"}`}>Mes evenements</button>
              {user?.role === 'admin' && (
                <button onClick={()=>setTab("all")} className={`text-xs sm:text-sm ${tab==="all"?"btn-primary":"btn-secondary"}`}>Tous les evenements</button>
              )}
              <button onClick={()=>setTab("reservations")} className={`text-xs sm:text-sm ${tab==="reservations"?"btn-primary":"btn-secondary"}`}>Reservations</button>
            </>
          )}
          <button onClick={load} className="btn-ghost text-xs sm:text-sm">Rafraichir</button>
        </div>
      </motion.div>

      {!loading && (
        <div className="grid grid-cols-2 gap-3 mb-6 max-w-md">
          <div className="card p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-neutral-400">Evenements crees</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold">{stats.avgFillRate.toFixed(1)}%</div>
            <div className="text-xs text-neutral-400">Taux de remplissage moyen</div>
          </div>
        </div>
      )}

      {loading && <div className="text-neutral-400">Chargement...</div>}
      {err && <div className="text-danger mb-4">{err}</div>}

      {!loading && tab==="events" && (
        <div className="grid gap-4 max-w-2xl">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{editingId ? "Modifier l'evenement" : "Creer un evenement"}</h3>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn-ghost text-xs">Annuler la modification</button>
              )}
            </div>
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

              <button className="btn-primary w-full" disabled={uploading}>
                {uploading ? "Envoi photo..." : (editingId ? "Enregistrer les modifications" : "Creer")}
              </button>
            </form>
          </div>
        </div>
      )}

      {!loading && tab==="all" && user?.role === 'admin' && (
        <div className="card p-5">
          <h3 className="font-semibold text-lg mb-3">Tous les evenements</h3>
          <div className="space-y-2 max-h-[520px] overflow-auto pr-2">
            {events.map(ev => (
              <div key={ev.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-bgSoft">
                <div>
                  <div className="font-semibold">{ev.title}</div>
                  <div className="text-xs text-neutral-400">{ev.location || "-"} · {ev.date_start ? new Date(ev.date_start).toLocaleString() : "date libre"}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={()=>onEditEvent(ev)} className="btn-ghost text-xs sm:text-sm">Modifier</button>
                  <button onClick={()=>onDeleteEvent(ev.id)} className="btn-ghost text-danger">Suppr.</button>
                </div>
              </div>
            ))}
            {events.length===0 && <p className="text-neutral-400 text-sm">Aucun evenement.</p>}
          </div>
        </div>
      )}

      {!loading && tab==="mine" && (
        <div className="card p-5">
          <h3 className="font-semibold text-lg mb-3">Mes evenements</h3>
          <div className="space-y-2">
            {myEvents.map(ev => (
              <div key={ev.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-bgSoft">
                <div>
                  <div className="font-semibold">{ev.title}</div>
                  <div className="text-xs text-neutral-400">{ev.location || "-"} · {ev.date_start ? new Date(ev.date_start).toLocaleString() : "date libre"}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={()=>onEditEvent(ev)} className="btn-ghost text-xs sm:text-sm">Modifier</button>
                  <button onClick={()=>onDeleteEvent(ev.id)} className="btn-ghost text-danger">Suppr.</button>
                </div>
              </div>
            ))}
            {myEvents.length===0 && <p className="text-neutral-400 text-sm">Tu n'as encore cree aucun evenement.</p>}
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
