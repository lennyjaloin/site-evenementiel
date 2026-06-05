import { Link } from "react-router-dom";

export default function ReserveSuccess() {
  return (
    <section className="container-app py-12 sm:py-16 text-center">
      <div className="card p-6 sm:p-8 max-w-2xl mx-auto flex flex-col gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-ok">Réservation validée ✅</h2>
        <p className="text-sm sm:text-base text-neutral-300">
          Tu vas recevoir un mail de confirmation si ton backend gère l'envoi.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-3">
          <Link to="/events" className="btn-primary justify-center">Retour aux événements</Link>
          <Link to="/" className="btn-secondary justify-center">Accueil</Link>
        </div>
      </div>
    </section>
  );
}
