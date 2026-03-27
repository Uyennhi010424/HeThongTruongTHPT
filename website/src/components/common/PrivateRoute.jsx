import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function PrivateRoute({ roles, children }) {
  const { token, role } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}