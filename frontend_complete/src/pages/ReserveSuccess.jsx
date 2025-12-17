import { Link } from "react-router-dom";

export default function ReserveSuccess() {
  return (
    <section className="container-app py-16 text-center">
      <div className="card p-8 max-w-2xl mx-auto grid gap-3">
        <h2 className="text-3xl font-bold text-ok">Réservation validée ✅</h2>
        <p className="text-neutral-300">
          Tu vas recevoir un mail de confirmation si ton backend gère l’envoi.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-3">
          <Link to="/events" className="btn">Retour aux événements</Link>
          <Link to="/" className="btn-ghost">Accueil</Link>
        </div>
      </div>
    </section>
  );
}
