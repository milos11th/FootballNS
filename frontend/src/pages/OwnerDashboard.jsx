import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../contexts/AuthContext";
import OwnerHalls from "./OwnerHalls";
import OwnerAvailability from "./OwnerAvailability";
import OwnerAppointments from "./OwnerAppointments";
import OwnerAvailabilityList from "./OwnerAvailabilityList";
import OwnerAppointmentHistory from "./OwnerAppointmentHistory";
import { Tabs, Tab, Container, Alert, Spinner, Badge } from "react-bootstrap";
import "../styles/OwnerDashboard.css";
import OwnerMonthlyReports from "../components/OwnerMonthlyReports";
import OwnerReviews from "../components/OwnerReviews";

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("halls");
  const [myHalls, setMyHalls] = useState([]);
  const [loadingHalls, setLoadingHalls] = useState(false);
  const [error, setError] = useState(null);
  const [newReviewsCount, setNewReviewsCount] = useState(0);
  const [hasMarkedAsSeen, setHasMarkedAsSeen] = useState(false);

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

  const checkNewReviews = async () => {
    try {
      const res = await api.get("/owner/reviews/");
      setNewReviewsCount(res.data.unseen_count || 0);
    } catch (err) {
      console.error("Greška pri proveri novih recenzija:", err);
    }
  };

  const handleReviewsSeen = async () => {
    if (newReviewsCount > 0 && !hasMarkedAsSeen) {
      try {
        await api.post("/owner/reviews/");
        setNewReviewsCount(0);
        setHasMarkedAsSeen(true);
      } catch (err) {
        console.error("Greška pri označavanju recenzija:", err);
      }
    }
  };

  const handleTabSelect = (tab) => {
    setActiveTab(tab);

    // Ako se selektuje tab Recenzije, označi kao pročitano
    if (tab === "reviews") {
      handleReviewsSeen();
    }
  };

  useEffect(() => {
    fetchMyHalls();
  }, []);

  useEffect(() => {
    if (user && user.role === "owner") {
      checkNewReviews();
      // Proveri na svakih 5 minuta
      const interval = setInterval(checkNewReviews, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Resetuj hasMarkedAsSeen kada se promeni broj novih recenzija
  useEffect(() => {
    if (newReviewsCount > 0) {
      setHasMarkedAsSeen(false);
    }
  }, [newReviewsCount]);

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
        onSelect={handleTabSelect}
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

        <Tab
          eventKey="availability"
          title="➕ Radno vreme hala"
          className="border-0"
        >
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

        <Tab
          eventKey="reviews"
          title={
            <>
              ⭐ Recenzije
              {newReviewsCount > 0 && (
                <Badge bg="danger" className="ms-1">
                  {newReviewsCount}
                </Badge>
              )}
            </>
          }
          className="border-0"
        >
          <div className="mt-3">
            <OwnerReviews myHalls={myHalls} onReviewsSeen={handleReviewsSeen} />
          </div>
        </Tab>

        <Tab eventKey="history" title="📊 Istorija" className="border-0">
          <div className="mt-3">
            <OwnerAppointmentHistory />
          </div>
        </Tab>

        <Tab eventKey="reports" title="📈 Izveštaji" className="border-0">
          <div className="mt-3">
            <OwnerMonthlyReports />
          </div>
        </Tab>
      </Tabs>
    </Container>
  );
}
