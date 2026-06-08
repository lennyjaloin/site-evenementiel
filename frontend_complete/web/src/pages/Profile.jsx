import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getMyConfirmedReservationsCount } from "../services/api.js";
import { motion } from "framer-motion";

export default function Profile() {
  const { user, isAuthed } = useAuth();
  const [reservationsCount, setReservationsCount] = useState(null);

  useEffect(() => {
    if (!isAuthed) return;
    (async () => {
      try {
        const count = await getMyConfirmedReservationsCount();
        setReservationsCount(count);
      } catch {
        setReservationsCount(null);
      }
    })();
  }, [isAuthed]);

  return (
    <section className="container-app py-6 sm:py-10">
      <motion.div className="card p-5 sm:p-6 max-w-xl mx-auto" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
        <h1 className="text-xl sm:text-2xl font-bold">Mon profil</h1>
        {!user ? (
          <p className="text-neutral-400 text-sm sm:text-base mt-2">Tu n'es pas connecté.</p>
        ) : (
          <div className="mt-4 space-y-3 text-neutral-200 text-sm sm:text-base">
            <div><span className="text-neutral-400">Email :</span> <span className="break-all">{user.email}</span></div>
            {user.username && <div><span className="text-neutral-400">Pseudo :</span> {user.username}</div>}
            {user.role && <div><span className="text-neutral-400">Rôle :</span> <span className="capitalize">{user.role}</span></div>}
            <div>
              <span className="text-neutral-400">Réservations confirmées :</span>{" "}
              {reservationsCount === null ? "—" : reservationsCount}
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
}
