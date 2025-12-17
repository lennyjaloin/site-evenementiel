import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Events() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const loadEvents = async () => {
    setLoading(true);
    setErr("");

    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (location) params.set("location", location);
      if (date) params.set("date", date);

      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur serveur");
      }

      setEvents(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(loadEvents, 300);
    return () => clearTimeout(t);
  }, [q, location, date]);

  return (
    <section className="container-app py-10">
      <h1 className="text-2xl font-bold mb-2">Trouver des événements</h1>
      <p className="text-neutral-400 mb-6">
        Recherche par nom, lieu ou date
      </p>

      <div className="card p-4 grid md:grid-cols-3 gap-3 mb-6">
        <input
          className="input"
          placeholder="Nom de l’événement"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="input"
          placeholder="Lieu"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {loading && <p>Chargement…</p>}
      {err && <p className="text-danger">{err}</p>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((ev) => (
          <div key={ev.id} className="card p-4">
            <h3 className="font-semibold">{ev.title}</h3>
            <p className="text-sm text-neutral-400 mt-1">
              {ev.description || "—"}
            </p>
            <div className="text-xs text-neutral-500 mt-2">
              <div>📍 {ev.location || "Non précisé"}</div>
              <div>📅 {ev.date ? new Date(ev.date).toLocaleString() : "—"}</div>
            </div>
            <Link to={`/events/${ev.id}`} className="btn-primary w-full mt-3">
              Voir
            </Link>
          </div>
        ))}
      </div>

      {!loading && events.length === 0 && (
        <p className="text-neutral-400 mt-6">
          Aucun événement trouvé.
        </p>
      )}
    </section>
  );
}
