import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../contexts/AuthContext";
import OwnerHalls from "./OwnerHalls";
import OwnerAvailability from "./OwnerAvailability";
import OwnerAppointments from "./OwnerAppointments";
import OwnerAvailabilityList from "./OwnerAvailabilityList";
import OwnerAppointmentHistory from "./OwnerAppointmentHistory"; // ← DODAJ OVO
import { Tabs, Tab, Container, Alert, Spinner } from "react-bootstrap";
import "../styles/OwnerDashboard.css";

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
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Fetch owner's halls
  const fetchMyHalls = async () => {
    setError(null);
    try {
      setLoadingHalls(true);
      const res = await api.get("/my-halls/");
      setMyHalls(res.data || []);
    } catch (err) {
      console.error("Greška prilikom dohvatanja mojih hala:", err);
      setError("Greška prilikom dohvatanja hala.");
      setMyHalls([]);
    } finally {
      setLoadingHalls(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchMyHalls();
  }, []);

  return (
    <Container className="mt-4">
      <div className="mb-4">
        <h1 className="text-dark fw-bold" style={{ color: "#2c3e50" }}>
          Kontrolna Tabla
        </h1>
        <p className="lead text-muted">
          Dobrodošao/la,{" "}
          <strong className="text-dark" style={{ color: "#34495e" }}>
            {user?.username}
          </strong>
        </p>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(tab) => setActiveTab(tab)}
        className="mb-4"
        justify
        variant="pills"
      >
        <Tab eventKey="halls" title="📋 Moje Hale" className="border-0">
          <div className="mt-3">
            {loadingHalls ? (
              <div className="text-center">
                <Spinner animation="border" role="status" className="me-2" />
                Učitavanje hala...
              </div>
            ) : error ? (
              <Alert variant="danger">{error}</Alert>
            ) : (
              <OwnerHalls
                myHalls={myHalls}
                loading={loadingHalls}
                refreshHalls={fetchMyHalls}
              />
            )}
          </div>
        </Tab>

        <Tab eventKey="availability" title="➕ Dostupnost" className="border-0">
          <div className="mt-3">
            <OwnerAvailability myHalls={myHalls} refreshHalls={fetchMyHalls} />
          </div>
        </Tab>

        <Tab
          eventKey="availability-list"
          title="📅 Lista Dostupnosti"
          className="border-0"
        >
          <div className="mt-3">
            <OwnerAvailabilityList
              myHalls={myHalls}
              refreshHalls={fetchMyHalls}
            />
          </div>
        </Tab>

        <Tab
          eventKey="appointments"
          title="⏳ Rezervacije"
          className="border-0"
        >
          <div className="mt-3">
            <OwnerAppointments myHalls={myHalls} refreshHalls={fetchMyHalls} />
          </div>
        </Tab>

        {/* NOVI TAB - Istorija Rezervacija */}
        <Tab eventKey="history" title="📊 Istorija" className="border-0">
          <div className="mt-3">
            <OwnerAppointmentHistory />
          </div>
        </Tab>
      </Tabs>
    </Container>
  );
}
