import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // object from /api/me/
  const [loading, setLoading] = useState(true);

  // ucitaj usera ako je token ispravan
  const loadMe = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const res = await api.get("/api/me/");
      setUser(res.data);
      setLoading(false);
      return res.data;
    } catch (err) {
      // token nije validan ili je server nedostupan
      console.warn("loadMe failed", err);
      setUser(null);
      setLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  // login: posalji token i loaduj usera
  const login = async ({ access, refresh }) => {
    localStorage.setItem(ACCESS_TOKEN, access);
    localStorage.setItem(REFRESH_TOKEN, refresh);
    const u = await loadMe();
    return u;
  };

  // logout: obrisi token i izbaci usera
  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setUser(null);
  };

  // refresh: loaduj usera
  const refresh = loadMe;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
