import { Link } from "react-router-dom";

export default function EventCard({ ev }) {
  const date = ev.date_start || ev.date;
  return (
    <Link to={`/events/${ev.id}`} className="card p-4 hover:bg-white/5 transition block">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold">{ev.title}</h3>
        {ev.capacity != null && (
          <span className="badge">{ev.reservationsCount || 0}/{ev.capacity} places</span>
        )}
      </div>
      <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{ev.description}</p>
      <div className="mt-3 text-sm text-neutral-300 flex flex-wrap gap-2">
        {ev.location && <span className="badge">{ev.location}</span>}
        {date && <span className="badge">{new Date(date).toLocaleString()}</span>}
      </div>
    </Link>
  );
}
