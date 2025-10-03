import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      logout();

      navigate("/login", { replace: true });
    };

    performLogout();
  }, [logout, navigate]);

  return <div>Odjava...</div>;
}
