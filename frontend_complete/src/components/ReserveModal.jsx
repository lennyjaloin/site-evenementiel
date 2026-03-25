import { useState } from "react";
import { reserveEvent } from "../services/api.js";
import { useNavigate } from "react-router-dom";

export default function ReserveModal({ open, onClose, eventId }) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!open) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      setLoading(true);
      await reserveEvent({ event_id: eventId, nom, prenom, email });
      onClose();
      navigate("/reservation/success");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-3 sm:p-4">
      <div className="card p-5 sm:p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-bold">Réserver</h3>
          <button onClick={onClose} className="btn-ghost">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">Nom</label>
            <input className="input" value={nom} onChange={e=>setNom(e.target.value)} required />
          </div>
          <div>
            <label className="label">Prénom</label>
            <input className="input" value={prenom} onChange={e=>setPrenom(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          {err && <p className="text-danger text-xs sm:text-sm">{err}</p>}

          <button disabled={loading} className="btn-primary w-full">
            {loading ? "Envoi..." : "Confirmer la réservation"}
          </button>
        </form>
      </div>
    </div>
  );
}
}
