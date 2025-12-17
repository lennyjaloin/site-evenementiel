import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="container-app py-20 text-center">
      <h2 className="text-4xl font-bold mb-2">404</h2>
      <p className="text-neutral-400">Page introuvable.</p>
      <Link to="/" className="btn mt-5">Retour accueil</Link>
    </section>
  );
}
