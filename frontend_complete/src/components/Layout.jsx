import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { motion } from "framer-motion";

const linkClass = ({ isActive }) =>
  "px-3 py-2 rounded-lg transition " +
  (isActive ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white");

export default function Layout() {
  const { user, isAuthed, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 backdrop-blur bg-bg/80 border-b border-white/5">
        <div className="container-app flex items-center justify-between py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-brand/20 grid place-items-center font-bold text-brand">E</div>
            <div>
              <div className="font-bold leading-none">Site Événementiel</div>
              <div className="text-xs text-neutral-400">Frontend BTS</div>
            </div>
          </NavLink>

          <nav className="flex items-center gap-1 text-sm">
            <NavLink to="/" className={linkClass}>Accueil</NavLink>
            <NavLink to="/events" className={linkClass}>Événements</NavLink>
            {isAuthed && <NavLink to="/profile" className={linkClass}>Profil</NavLink>}
            {user?.role === "admin" && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
          </nav>

          <div className="flex items-center gap-2 text-sm">
            {!isAuthed ? (
              <>
                <button onClick={()=>navigate("/signup")} className="btn-secondary">S’inscrire</button>
                <button onClick={()=>navigate("/login")} className="btn-primary">Se connecter</button>
              </>
            ) : (
              <>
                <span className="hidden sm:inline text-neutral-300">Salut, {user?.email}</span>
                <button onClick={logout} className="btn-ghost">Déconnexion</button>
              </>
            )}
          </div>
        </div>
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
            <div className="h-8 w-8 rounded-lg bg-brand/20 grid place-items-center font-bold text-brand">E</div>
            <span>© {new Date().getFullYear()} Site Événementiel</span>
          </div>
          <div className="opacity-70">React + Tailwind • Framer Motion • BTS SIO</div>
        </div>
      </footer>
    </div>
  );
}
