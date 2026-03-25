import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <section className="container-app py-8 sm:py-14">
      <motion.div
        className="card p-6 sm:p-8 md:p-12 relative overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

        <motion.h1
          className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Site Événementiel
        </motion.h1>
        <p className="text-neutral-300 text-sm sm:text-base md:text-lg mt-4 max-w-2xl">
          Trouve des événements, ou organise, publie et gère les tiens
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link to="/admin" className="btn-primary justify-center">Créer un événement</Link>
          <Link to="/events" className="btn-secondary justify-center">Trouver des événements</Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
        {[
          { title: "Réservation rapide", desc: "Réserve en 2 clics avec nom, prénom et email." },
          { title: "Admin simple", desc: "Crée tes événements et suis les réservations." },
          { title: "100% responsive", desc: "Parfait sur mobile, tablette et desktop." }
        ].map((f, i) => (
          <motion.div
            key={f.title}
            className="card p-4 sm:p-5"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 * i }}
          >
            <h3 className="font-semibold text-base sm:text-lg">{f.title}</h3>
            <p className="text-neutral-400 text-xs sm:text-sm mt-1">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
