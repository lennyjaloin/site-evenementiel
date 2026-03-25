import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="container-app py-16 sm:py-20 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold mb-2">404</h2>
      <p className="text-sm sm:text-base text-neutral-400 mb-5">Page introuvable.</p>
      <Link to="/" className="btn-primary inline-flex">Retour accueil</Link>
    </section>
  );
}
