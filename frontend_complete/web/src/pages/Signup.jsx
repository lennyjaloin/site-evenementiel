import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      setLoading(true);
      await signup(email, password);
      nav("/");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-app py-6 sm:py-10">
      <motion.div className="card p-5 sm:p-6 max-w-md mx-auto" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Inscription</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required />
          </div>
          {err && <p className="text-danger text-xs sm:text-sm">{err}</p>}
          <button disabled={loading} className="btn-primary w-full">{loading ? "Création..." : "Créer mon compte"}</button>
        </form>
        <p className="text-xs sm:text-sm text-neutral-400 mt-3">
          Déjà un compte ? <Link className="text-brand hover:underline" to="/login">Connecte-toi</Link>
        </p>
      </motion.div>
    </section>
  );
}
