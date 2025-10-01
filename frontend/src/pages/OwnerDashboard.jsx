// src/pages/OwnerDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../contexts/AuthContext";
import OwnerHalls from "./OwnerHalls";
import OwnerAvailability from "./OwnerAvailability";
import OwnerAppointments from "./OwnerAppointments";

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("halls");
  const [myHalls, setMyHalls] = useState([]);
  const [loadingHalls, setLoadingHalls] = useState(false);
  const [error, setError] = useState(null);

  // redirect / protect route
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (user.role !== "owner") {
      // ako nije owner, ne sme ovde biti
      navigate("/", { replace: true });
    }
    // eslint-disable-next-line
  }, [user, authLoading]);

  // Fetch owner's halls
  const fetchMyHalls = async () => {
    setError(null);
    try {
      setLoadingHalls(true);
      const res = await api.get("/my-halls/");
      setMyHalls(res.data || []);
    } catch (err) {
      console.error("Greška prilikom dohvatanja mojih hala:", err);
      setError("Greška prilikom dohvatanja hala. Pogledaj konzolu.");
      setMyHalls([]);
    } finally {
      setLoadingHalls(false);
    }
  };

  // initial load + when switching to halls tab
  useEffect(() => {
    fetchMyHalls();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (activeTab === "halls") fetchMyHalls();
    // eslint-disable-next-line
  }, [activeTab]);

  // Small helper: render tab buttons with active style
  const TabButton = ({ id, children }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        marginRight: 8,
        padding: "8px 12px",
        cursor: "pointer",
        background: activeTab === id ? "#0d6efd" : "transparent",
        color: activeTab === id ? "#fff" : "#000",
        border: "1px solid #0d6efd",
        borderRadius: 6,
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: 12 }}>
      <h1>Owner Dashboard</h1>
      <p>
        Dobrodošao, <strong>{user?.username}</strong>
      </p>

      <div style={{ marginBottom: 18 }}>
        <TabButton id="halls">My Halls</TabButton>
        <TabButton id="availability">Availability</TabButton>
        <TabButton id="appointments">Appointments</TabButton>
      </div>

      <div style={{ padding: 12, border: "1px solid #e6e6e6", borderRadius: 8 }}>
        {activeTab === "halls" && (
          <div>
            <h2>My Halls</h2>
            {loadingHalls ? (
              <p>Loading your halls...</p>
            ) : error ? (
              <p style={{ color: "red" }}>{error}</p>
            ) : myHalls.length === 0 ? (
              <div>
                <p>Nemate kreiranih hala.</p>
                <p>
                  Možete ih dodati ovde ili preko Django admin panela. Kliknite
                  na "Create Hall" ispod da dodate novu.
                </p>
                {/* Pozovi OwnerHalls i prosledi props — komponenta može koristiti ove props ako želi */}
                <OwnerHalls myHalls={myHalls} loading={loadingHalls} refreshHalls={fetchMyHalls} />
              </div>
            ) : (
              <div>
                {/* render OwnerHalls i prosledi podatke + refresh callback */}
                <OwnerHalls myHalls={myHalls} loading={loadingHalls} refreshHalls={fetchMyHalls} />
              </div>
            )}
          </div>
        )}

        {activeTab === "availability" && (
          <div>
            <h2>Availability</h2>
            <OwnerAvailability myHalls={myHalls} refreshHalls={fetchMyHalls} />
          </div>
        )}

        {activeTab === "appointments" && (
          <div>
            <h2>Appointments</h2>
            <OwnerAppointments myHalls={myHalls} refreshHalls={fetchMyHalls} />
          </div>
        )}
      </div>
    </div>
  );
}
