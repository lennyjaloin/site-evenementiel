import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useFavorites } from "../context/FavoritesContext.jsx";
import { motion } from "framer-motion";
import { useState } from "react";

const linkClass = ({ isActive }) =>
  "px-3 py-2 rounded-lg transition text-sm " +
  (isActive ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white");

export default function Layout() {
  const { user, isAuthed, logout } = useAuth();
  const { favs } = useFavorites();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const close = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 backdrop-blur bg-bg/80 border-b border-white/5">
        <div className="container-app flex items-center justify-between py-3">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 min-w-fit">
            <div className="h-9 w-9 rounded-xl bg-brand/20 grid place-items-center font-bold text-brand text-sm">E</div>
            <div className="hidden sm:block">
              <div className="font-bold leading-none text-sm">Site Événementiel</div>
            </div>
          </NavLink>

          {/* Nav Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>Accueil</NavLink>
            <NavLink to="/mes-reservations" className={linkClass}>Mes réservations</NavLink>
            <NavLink to="/favoris" className={({ isActive }) =>
              "px-3 py-2 rounded-lg transition text-sm flex items-center gap-1.5 " +
              (isActive ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white")
            }>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4"
                fill={favs.length > 0 ? "#ef4444" : "none"} stroke={favs.length > 0 ? "#ef4444" : "currentColor"} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              Favoris
              {favs.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {favs.length}
                </span>
              )}
            </NavLink>
            {isAuthed && <NavLink to="/admin" className={linkClass}>Mes événements</NavLink>}
          </nav>

          {/* Auth Desktop */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            {!isAuthed ? (
              <>
                <button onClick={() => navigate("/signup")} className="btn-secondary">S'inscrire</button>
                <button onClick={() => navigate("/login")} className="btn-primary">Se connecter</button>
              </>
            ) : (
              <>
                <span className="text-neutral-300 text-xs truncate max-w-[120px]">{user?.email?.split("@")[0]}</span>
                <button onClick={logout} className="btn-ghost">Déconnexion</button>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-white/5 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden border-t border-white/5 bg-bg/95 backdrop-blur"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <div className="container-app py-4 flex flex-col gap-2">
              {[
                { to: "/", label: "Accueil", end: true },
                { to: "/mes-reservations", label: "Mes réservations" },
                { to: "/favoris", label: `Favoris${favs.length > 0 ? ` (${favs.length})` : ""}` },
                ...(isAuthed ? [{ to: "/admin", label: "Mes événements" }] : []),
              ].map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end} onClick={close}
                  className={({ isActive }) =>
                    "px-3 py-2 rounded-lg transition block text-sm " +
                    (isActive ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white")
                  }
                >
                  {label}
                </NavLink>
              ))}
              <div className="border-t border-white/5 pt-3 flex flex-col gap-2 mt-1">
                {!isAuthed ? (
                  <>
                    <button onClick={() => { navigate("/signup"); close(); }} className="btn-secondary w-full justify-center">S'inscrire</button>
                    <button onClick={() => { navigate("/login"); close(); }} className="btn-primary w-full justify-center">Se connecter</button>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-neutral-400 px-3">{user?.email}</span>
                    <button onClick={() => { logout(); close(); }} className="btn-ghost w-full justify-start">Déconnexion</button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </header>

      <motion.main className="flex-1" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Outlet />
      </motion.main>

      <footer className="border-t border-white/5">
        <div className="container-app py-6 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Site Événementiel</span>
          <span>React + Tailwind • Framer Motion</span>
        </div>
      </footer>
    </div>
  );
}
