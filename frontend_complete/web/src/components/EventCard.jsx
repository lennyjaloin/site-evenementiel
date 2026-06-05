import { Link } from "react-router-dom";
import { useFavorites } from "../context/FavoritesContext.jsx";

const COLORS = [
  "from-violet-500/30 to-purple-900/40",
  "from-blue-500/30 to-cyan-900/40",
  "from-emerald-500/30 to-teal-900/40",
  "from-orange-500/30 to-red-900/40",
  "from-pink-500/30 to-rose-900/40",
  "from-yellow-500/30 to-amber-900/40",
];

export default function EventCard({ ev }) {
  const { isFav, toggle } = useFavorites();
  const fav = isFav(ev.id);
  const date = ev.date_start || ev.date;
  const color = COLORS[ev.id % COLORS.length];
  const isComplet = ev.capacity != null && ev.placesRestantes != null && ev.placesRestantes <= 0;

  return (
    <div className="card overflow-hidden flex flex-col hover:ring-1 hover:ring-white/10 transition group">
      {/* Image placeholder colorée */}
      <div className={`relative h-36 bg-gradient-to-br ${color} flex-shrink-0`}>
        {ev.image_url ? (
          <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-30">🎉</span>
          </div>
        )}
        {/* Coeur */}
        <button
          onClick={(e) => { e.preventDefault(); toggle(ev); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:scale-110 transition"
          aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4"
            fill={fav ? "#ef4444" : "none"} stroke={fav ? "#ef4444" : "white"} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>
        {/* Badge complet */}
        {isComplet && (
          <span className="absolute top-2 left-2 bg-red-500/90 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
            Complet
          </span>
        )}
      </div>

      {/* Contenu */}
      <Link to={`/events/${ev.id}`} className="flex flex-col flex-1 p-3 gap-1">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-brand transition">
          {ev.title}
        </h3>
        <p className="text-xs text-neutral-400 line-clamp-2 mt-0.5">{ev.description}</p>
        <div className="mt-auto pt-2 flex flex-wrap gap-1.5 items-center">
          {ev.location && (
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {ev.location}
            </span>
          )}
          {date && (
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
              </svg>
              {new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          {ev.capacity != null && !isComplet && (
            <span className="ml-auto text-xs text-emerald-400">
              {ev.placesRestantes} place{ev.placesRestantes > 1 ? "s" : ""} dispo
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
