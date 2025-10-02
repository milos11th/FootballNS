import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      logout();
      // UKLANJAMO showSuccess - samo redirect
      // await showSuccess('Uspešno ste se odjavili!');
      navigate("/login", { replace: true });
    };

    performLogout();
  }, [logout, navigate]);

  return <div>Odjava...</div>;
}
