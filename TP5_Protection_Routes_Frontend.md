# TP5 — Protection des Routes Frontend (PrivateRoute)

## Objectif
Empecher les utilisateurs non connectes ou non-admin d'acceder aux pages protegees (`/admin`, `/profile`). Actuellement, n'importe qui peut taper `/admin` dans la barre d'adresse et acceder au panneau d'administration.

## Prerequis
- TP1 a TP4 termines

## Duree estimee : 40 minutes

---

## Etape 1 — Comprendre le probleme

Ouvre `frontend_complete/src/App.jsx` et regarde les routes :

```jsx
<Route path="/admin" element={<Admin />} />
<Route path="/profile" element={<Profile />} />
```

### Probleme :
- `/admin` est accessible a **tout le monde**, meme sans etre connecte
- `/profile` est accessible sans etre connecte (il affiche juste "Tu n'es pas connecte")
- Le lien "Admin" est cache dans la navbar pour les non-admins... mais l'URL reste accessible directement

> **Important** : La protection cote frontend est un confort pour l'utilisateur, pas une securite. Le vrai verrou est cote backend (middleware `authMiddleware` + `requireRole`). Mais il faut quand meme proteger le frontend pour eviter de montrer des pages vides ou des erreurs.

---

## Etape 2 — Creer le composant PrivateRoute

Ce composant va verifier si l'utilisateur est connecte et a le bon role avant d'afficher la page.

### Action :
Cree le fichier `frontend_complete/src/components/PrivateRoute.jsx` :

```jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * PrivateRoute — Protege une route.
 *
 * Props :
 * - children : le contenu a afficher si autorise
 * - requiredRole : (optionnel) le role necessaire ("admin", "staff")
 *
 * Comportement :
 * - Si pas connecte -> redirige vers /login
 * - Si connecte mais mauvais role -> redirige vers /
 * - Sinon -> affiche le contenu
 */
export default function PrivateRoute({ children, requiredRole }) {
  const { isAuthed, user } = useAuth();

  // Pas connecte -> page de login
  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  // Connecte mais pas le bon role -> page d'accueil
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Tout est OK -> afficher la page
  return children;
}
```

### Explication :
- **`<Navigate to="/login" replace />`** : redirige vers la page de login. `replace` remplace l'entree dans l'historique du navigateur (le bouton "retour" ne ramenera pas sur la page protegee).
- **`requiredRole`** : si specifie, verifie que `user.role` correspond. Sinon, on verifie juste que l'utilisateur est connecte.

---

## Etape 3 — Appliquer PrivateRoute aux routes protegees

### Action :
Modifie `frontend_complete/src/App.jsx` :

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import Home from "./pages/Home.jsx";
import Events from "./pages/Events.jsx";
import EventDetails from "./pages/EventDetails.jsx";
import ReserveSuccess from "./pages/ReserveSuccess.jsx";
import Admin from "./pages/Admin.jsx";
import NotFound from "./pages/NotFound.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Routes publiques */}
            <Route index element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/reservation/success" element={<ReserveSuccess />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Route protegee : utilisateur connecte */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            {/* Route protegee : admin uniquement */}
            <Route
              path="/admin"
              element={
                <PrivateRoute requiredRole="admin">
                  <Admin />
                </PrivateRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### Ce qui a change :
- Import de `PrivateRoute`
- `/profile` est entoure de `<PrivateRoute>` — il faut etre connecte
- `/admin` est entoure de `<PrivateRoute requiredRole="admin">` — il faut etre admin

---

## Etape 4 — Rediriger vers la page demandee apres le login

Quand un utilisateur non connecte essaie d'acceder a `/admin`, il est redirige vers `/login`. Apres le login, il devrait etre redirige vers `/admin` (la page qu'il voulait voir), pas vers `/events`.

### 4.1 — Modifier PrivateRoute pour transmettre l'URL demandee

Modifie `frontend_complete/src/components/PrivateRoute.jsx` :

```jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function PrivateRoute({ children, requiredRole }) {
  const { isAuthed, user } = useAuth();
  const location = useLocation();

  if (!isAuthed) {
    // On sauvegarde l'URL demandee dans le state de la navigation
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
```

### 4.2 — Modifier Login.jsx pour utiliser la redirection

Modifie `frontend_complete/src/pages/Login.jsx` :

```jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Recuperer l'URL demandee avant la redirection (ou /events par defaut)
  const from = location.state?.from || "/events";

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      setLoading(true);
      await login(email, password);
      nav(from, { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-app py-10">
      <motion.div className="card p-6 max-w-md mx-auto" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
        <h1 className="text-2xl font-bold mb-4">Connexion</h1>

        {location.state?.from && (
          <p className="text-warn text-sm mb-3">
            Connecte-toi pour acceder a cette page.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          {err && <p className="text-danger text-sm">{err}</p>}
          <button disabled={loading} className="btn-primary w-full">{loading ? "Connexion..." : "Se connecter"}</button>
        </form>
        <p className="text-sm text-neutral-400 mt-3">
          Pas de compte ? <Link className="text-brand hover:underline" to="/signup">Inscris-toi</Link>
        </p>
      </motion.div>
    </section>
  );
}
```

### Ce qui a change :
- `useLocation()` recupere le `state.from` (l'URL demandee)
- `nav(from, { replace: true })` redirige vers cette URL apres le login
- Un message d'avertissement s'affiche si l'utilisateur a ete redirige

---

## Etape 5 — Empecher les utilisateurs connectes d'acceder a Login/Signup

Un utilisateur deja connecte n'a pas besoin de voir les pages de login ou d'inscription.

### Action :
Cree le composant `frontend_complete/src/components/GuestRoute.jsx` :

```jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * GuestRoute — Accessible uniquement aux utilisateurs NON connectes.
 * Si connecte, redirige vers /events.
 */
export default function GuestRoute({ children }) {
  const { isAuthed } = useAuth();

  if (isAuthed) {
    return <Navigate to="/events" replace />;
  }

  return children;
}
```

### Action :
Modifie `App.jsx` pour entourer Login et Signup :

```jsx
import GuestRoute from "./components/GuestRoute.jsx";

// ... dans les Routes :

<Route
  path="/login"
  element={
    <GuestRoute>
      <Login />
    </GuestRoute>
  }
/>
<Route
  path="/signup"
  element={
    <GuestRoute>
      <Signup />
    </GuestRoute>
  }
/>
```

Le fichier `App.jsx` complet final :

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import GuestRoute from "./components/GuestRoute.jsx";
import Home from "./pages/Home.jsx";
import Events from "./pages/Events.jsx";
import EventDetails from "./pages/EventDetails.jsx";
import ReserveSuccess from "./pages/ReserveSuccess.jsx";
import Admin from "./pages/Admin.jsx";
import NotFound from "./pages/NotFound.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Routes publiques */}
            <Route index element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/reservation/success" element={<ReserveSuccess />} />

            {/* Routes invites uniquement */}
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

            {/* Routes protegees : utilisateur connecte */}
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

            {/* Routes protegees : admin uniquement */}
            <Route path="/admin" element={<PrivateRoute requiredRole="admin"><Admin /></PrivateRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

---

## Etape 6 — Verification

### Test 1 : Acceder a /admin sans etre connecte
1. Deconnecte-toi (ou ouvre un navigateur en navigation privee)
2. Va sur `http://localhost:5173/admin`
3. **Resultat attendu** : tu es redirige vers `/login` avec le message "Connecte-toi pour acceder a cette page."

### Test 2 : Se connecter comme admin puis acceder a /admin
1. Connecte-toi avec un compte admin
2. Va sur `http://localhost:5173/admin`
3. **Resultat attendu** : la page admin s'affiche normalement

### Test 3 : Se connecter comme staff puis acceder a /admin
1. Connecte-toi avec un compte staff
2. Va sur `http://localhost:5173/admin`
3. **Resultat attendu** : tu es redirige vers la page d'accueil `/`

### Test 4 : Acceder a /login en etant connecte
1. Connecte-toi
2. Va sur `http://localhost:5173/login`
3. **Resultat attendu** : tu es redirige vers `/events`

### Test 5 : Redirection apres login
1. Deconnecte-toi
2. Va sur `http://localhost:5173/profile`
3. Tu es redirige vers `/login`
4. Connecte-toi
5. **Resultat attendu** : tu es redirige vers `/profile` (pas vers `/events`)

---

## Resume des fichiers

| Fichier | Action |
|---|---|
| `components/PrivateRoute.jsx` | **Cree** — protege les routes authentifiees |
| `components/GuestRoute.jsx` | **Cree** — protege les routes invites |
| `pages/Login.jsx` | **Modifie** — redirection apres login + message |
| `App.jsx` | **Modifie** — utilise PrivateRoute et GuestRoute |

---

## Ce qu'on a appris dans ce TP

- **La securite frontend est un confort, pas une protection** : le vrai verrou est le backend
- **PrivateRoute** : pattern React classique pour proteger les routes
- **GuestRoute** : empeche un utilisateur connecte de revoir les pages de login
- **`useLocation` + `state`** : permet de transmettre des informations entre pages lors d'une navigation
- **`replace`** dans `<Navigate>` : remplace l'entree dans l'historique au lieu de l'empiler
