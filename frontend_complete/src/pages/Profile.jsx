import { useAuth } from "../context/AuthContext.jsx";
import { motion } from "framer-motion";

export default function Profile() {
  const { user } = useAuth();

  return (
    <section className="container-app py-10">
      <motion.div className="card p-6 max-w-xl mx-auto" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
        <h1 className="text-2xl font-bold">Mon profil</h1>
        {!user ? (
          <p className="text-neutral-400 mt-2">Tu n'es pas connecté.</p>
        ) : (
          <div className="mt-4 space-y-2 text-neutral-200">
            <div><span className="text-neutral-400">Email :</span> {user.email}</div>
            {user.username && <div><span className="text-neutral-400">Pseudo :</span> {user.username}</div>}
            {user.role && <div><span className="text-neutral-400">Rôle :</span> {user.role}</div>}
          </div>
        )}
      </motion.div>
    </section>
  );
}
