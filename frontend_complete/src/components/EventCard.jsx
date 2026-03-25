import { Link } from "react-router-dom";

export default function EventCard({ ev }) {
  const date = ev.date_start || ev.date;
  return (
    <Link to={`/events/${ev.id}`} className="card p-4 hover:bg-white/5 transition block h-full">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold line-clamp-2">{ev.title}</h3>
        {ev.capacity != null && (
          <span className="badge text-xs flex-shrink-0">{ev.reservationsCount || 0}/{ev.capacity}</span>
        )}
      </div>
      <p className="text-xs sm:text-sm text-neutral-400 mt-2 line-clamp-2">{ev.description}</p>
      <div className="mt-3 text-xs sm:text-sm text-neutral-300 flex flex-wrap gap-2">
        {ev.location && <span className="badge">{ev.location}</span>}
        {date && <span className="badge text-xs">{new Date(date).toLocaleDateString()}</span>}
      </div>
    </Link>
  );
}
