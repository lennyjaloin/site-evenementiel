import { createContext, useContext, useState, useEffect } from "react";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favs, setFavs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("favorites")) || []; }
    catch { return []; }
  });
  const [seenCount, setSeenCount] = useState(() => {
    const stored = Number(localStorage.getItem("favoritesSeenCount"));
    return Number.isFinite(stored) ? stored : 0;
  });

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favs));
  }, [favs]);

  useEffect(() => {
    localStorage.setItem("favoritesSeenCount", String(seenCount));
  }, [seenCount]);

  const isFav = (id) => favs.some(f => f.id === id);
  const toggle = (ev) => {
    setFavs(prev => isFav(ev.id) ? prev.filter(f => f.id !== ev.id) : [...prev, ev]);
  };

  const unseenCount = Math.max(0, favs.length - seenCount);
  const markFavoritesSeen = () => setSeenCount(favs.length);

  return (
    <FavoritesContext.Provider value={{ favs, isFav, toggle, unseenCount, markFavoritesSeen }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
