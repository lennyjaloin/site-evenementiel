import { createContext, useContext, useState, useEffect } from "react";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favs, setFavs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("favorites")) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favs));
  }, [favs]);

  const isFav = (id) => favs.some(f => f.id === id);
  const toggle = (ev) => {
    setFavs(prev => isFav(ev.id) ? prev.filter(f => f.id !== ev.id) : [...prev, ev]);
  };

  return (
    <FavoritesContext.Provider value={{ favs, isFav, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
