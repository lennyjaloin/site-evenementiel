import { useEffect, useState } from "react";
import EventCard from "../components/EventCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { getEvents } from "../services/api.js";

export default function Events() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const loadEvents = async (targetPage = page) => {
    setLoading(true);
    setErr("");

    try {
      const result = await getEvents({ page: targetPage, limit: 12 });
      setEvents(result.data);
      setPagination(result.pagination);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents(page);
  }, [page]);

  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => loadEvents(1), 300);
    return () => clearTimeout(t);
  }, [q, location, date]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="container-app py-6 sm:py-10">
      <h1 className="text-xl sm:text-2xl font-bold mb-2">Trouver des evenements</h1>
      <p className="text-sm sm:text-base text-neutral-400 mb-6">
        Recherche par nom, lieu ou date
        {pagination.total > 0 && (
          <span className="text-neutral-500"> — {pagination.total} evenement{pagination.total > 1 ? 's' : ''}</span>
        )}
      </p>

      <div className="card p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <input
          className="input"
          placeholder="Nom de l'evenement"
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
          className="input col-span-1 sm:col-span-2 lg:col-span-1"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {loading && <p className="text-neutral-400">Chargement...</p>}
      {err && <p className="text-danger">{err}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {events.map((ev) => (
          <EventCard key={ev.id} ev={ev} />
        ))}
      </div>

      {!loading && events.length === 0 && (
        <p className="text-neutral-400 mt-6 text-sm">
          Aucun evenement trouve.
        </p>
      )}

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </section>
  );
}
