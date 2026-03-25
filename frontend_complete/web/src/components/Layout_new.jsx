import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { motion } from "framer-motion";
import { useState } from "react";

const linkClass = ({ isActive }) =>
  "px-3 py-2 rounded-lg transition " +
  (isActive ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white");

export default function Layout() {
  const { user, isAuthed, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 backdrop-blur bg-bg/80 border-b border-white/5">
        <div className="container-app flex items-center justify-between py-3">
          <NavLink to="/" className="flex items-center gap-2 min-w-fit">
            <div className="h-9 w-9 rounded-xl bg-brand/20 grid place-items-center font-bold text-brand text-sm">E</div>
            <div className="hidden sm:block">
              <div className="font-bold leading-none text-sm">Site Événementiel</div>
              <div className="text-xs text-neutral-400">Frontend BTS</div>
            </div>
          </NavLink>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <NavLink to="/" className={linkClass}>Accueil</NavLink>
            <NavLink to="/events" className={linkClass}>Événements</NavLink>
            {isAuthed && <NavLink to="/profile" className={linkClass}>Profil</NavLink>}
            {user?.role === "admin" && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
          </nav>

          {/* Boutons Desktop */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            {!isAuthed ? (
              <>
                <button onClick={()=>navigate("/signup")} className="btn-secondary">S'inscrire</button>
                <button onClick={()=>navigate("/login")} className="btn-primary">Se connecter</button>
              </>
            ) : (
              <>
                <span className="text-neutral-300 truncate">Salut, {user?.email?.split("@")[0]}</span>
                <button onClick={logout} className="btn-ghost">Déconnexion</button>
              </>
            )}
          </div>

          {/* Bouton Hamburger Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-white/5 rounded-lg transition"
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden border-t border-white/5 bg-bg/95 backdrop-blur"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="container-app py-4 flex flex-col gap-3">
              <NavLink
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  "px-3 py-2 rounded-lg transition block " +
                  (isActive ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white")
                }
              >
                Accueil
              </NavLink>
              <NavLink
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  "px-3 py-2 rounded-lg transition block " +
                  (isActive ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white")
                }
              >
                Événements
              </NavLink>
              {isAuthed && (
                <NavLink
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    "px-3 py-2 rounded-lg transition block " +
                    (isActive ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white")
                  }
                >
                  Profil
                </NavLink>
              )}
              {user?.role === "admin" && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    "px-3 py-2 rounded-lg transition block " +
                    (isActive ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white")
                  }
                >
                  Admin
                </NavLink>
              )}
              <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
                {!isAuthed ? (
                  <>
                    <button
                      onClick={() => handleNavClick("/signup")}
                      className="btn-secondary w-full justify-center"
                    >
                      S'inscrire
                    </button>
                    <button
                      onClick={() => handleNavClick("/login")}
                      className="btn-primary w-full justify-center"
                    >
                      Se connecter
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-neutral-300 px-3 py-2 break-all">{user?.email}</span>
                    <button onClick={logout} className="btn-ghost w-full justify-start">
                      Déconnexion
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </header>

      <motion.main
        className="flex-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Outlet />
      </motion.main>

      <footer className="border-t border-white/5">
        <div className="container-app py-8 text-sm text-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand/20 grid place-items-center font-bold text-brand text-xs">E</div>
            <span>© {new Date().getFullYear()} Site Événementiel</span>
          </div>
          <div className="opacity-70 text-xs sm:text-sm">React + Tailwind • Framer Motion • BTS SIO</div>
        </div>
      </footer>
    </div>
  );
}
