import { useEffect, useState } from "react";
import { getRole, getToken } from "../store/authStore";

export default function useAuth() {
  const [token, setToken] = useState(getToken());
  const [role, setRole] = useState(getRole());

  useEffect(() => {
    const sync = () => {
      setToken(getToken());
      setRole(getRole());
    };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return { token, role };
}