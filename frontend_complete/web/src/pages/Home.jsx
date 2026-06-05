import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EventCard from "../components/EventCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { getEvents } from "../services/api.js";

export default function Home() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const load = async (targetPage = 1, search = q, loc = location) => {
    setLoading(true); setErr("");
    try {
      const result = await getEvents({ page: targetPage, limit: 12 });
      let data = result.data || [];
      if (search) data = data.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase()));
      if (loc) data = data.filter(e => e.location?.toLowerCase().includes(loc.toLowerCase()));
      setEvents(data);
      setPagination(result.pagination);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(page, q, location); }, [page]);

  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => load(1, q, location), 300);
    return () => clearTimeout(t);
  }, [q, location]);

  return (
    <div>
      {/* Hero / barre de recherche */}
      <div className="bg-gradient-to-b from-brand/10 to-transparent border-b border-white/5 py-8 sm:py-12">
        <div className="container-app">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2">
            Trouve ton prochain événement
          </h1>
          <p className="text-neutral-400 text-sm mb-6">
            {pagination.total > 0 ? `${pagination.total} événement${pagination.total > 1 ? "s" : ""} disponible${pagination.total > 1 ? "s" : ""}` : "Parcours les événements près de chez toi"}
          </p>

          {/* Barre de recherche style leboncoin */}
          <div className="flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                className="input pl-9 w-full"
                placeholder="Concert, festival, conférence..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            <div className="relative sm:w-52">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <input
                className="input pl-9 w-full"
                placeholder="Ville, lieu..."
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
            <Link to="/admin" className="btn-primary flex items-center gap-2 whitespace-nowrap justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Publier
            </Link>
          </div>
        </div>
      </div>

      {/* Grille d'annonces */}
      <div className="container-app py-6">
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="h-36 bg-white/5" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {err && <p className="text-danger">{err}</p>}

        {!loading && events.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-400 text-lg mb-2">Aucun événement trouvé</p>
            <p className="text-neutral-500 text-sm mb-6">Sois le premier à en publier un !</p>
            <Link to="/admin" className="btn-primary">Publier un événement</Link>
          </div>
        )}

        {!loading && events.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {events.map(ev => <EventCard key={ev.id} ev={ev} />)}
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            />
          </>
        )}
      </div>
    </div>
  );
}
