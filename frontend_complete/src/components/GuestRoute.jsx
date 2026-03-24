import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function GuestRoute({ children }) {
  const { isAuthed } = useAuth();

  if (isAuthed) {
    return <Navigate to="/events" replace />;
  }

  return children;
}
