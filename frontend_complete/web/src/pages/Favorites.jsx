import { useFavorites } from "../context/FavoritesContext.jsx";
import EventCard from "../components/EventCard.jsx";
import { Link } from "react-router-dom";

export default function Favorites() {
  const { favs } = useFavorites();

  return (
    <div className="container-app py-6 sm:py-10">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">Mes favoris</h1>
      <p className="text-neutral-400 text-sm mb-6">
        {favs.length > 0 ? `${favs.length} événement${favs.length > 1 ? "s" : ""} sauvegardé${favs.length > 1 ? "s" : ""}` : "Aucun favori pour l'instant"}
      </p>

      {favs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🤍</div>
          <p className="text-neutral-400 mb-6">Clique sur le cœur d'un événement pour l'ajouter ici</p>
          <Link to="/" className="btn-primary">Parcourir les événements</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {favs.map(ev => <EventCard key={ev.id} ev={ev} />)}
        </div>
      )}
    </div>
  );
}
