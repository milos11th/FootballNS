import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Badge,
  Button,
  Row,
  Col,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import api from "../api";
import { showConfirm, showSuccess, showApiError } from "../utils/sweetAlert";

function UserDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyAppointments();
  }, []);

  const fetchMyAppointments = async () => {
    try {
      setLoading(true);

      const res = await api.get("/appointments/");

      const myAppointments = res.data.filter(
        (app) => app.user === user.username
      );

      setAppointments(myAppointments);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError("Greška pri učitavanju rezervacija");
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    const result = await showConfirm(
      "Otkazivanje rezervacije",
      "Da li ste sigurni da želite da otkažete ovu rezervaciju?"
    );

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/appointments/${appointmentId}/delete/`);
      await showSuccess("Rezervacija uspešno otkazana!");
      fetchMyAppointments();
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      showApiError(err);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "rejected":
        return "danger";
      case "cancelled":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Odobreno ✅";
      case "pending":
        return "Na čekanju ⏳";
      case "rejected":
        return "Odbijeno ❌";
      case "cancelled":
        return "Otkazano 🚫";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Učitavanje rezervacija...</p>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <div className="text-center mb-5">
        <h1 className="fw-bold">📋 Moje Rezervacije</h1>
        <p className="lead text-muted">Pregledajte status vaših rezervacija</p>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {appointments.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <h4 className="text-muted">📭 Nemate rezervacija</h4>
            <p className="text-muted">
              Još uvek niste napravili nijednu rezervaciju.
            </p>
            <Button variant="primary" href="/" className="mt-3">
              🏟️ Pronađi Halu
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} className="g-4">
          {appointments.map((appointment) => (
            <Col key={appointment.id}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="card-title mb-2">
                        🏟️ {appointment.hall_name}
                      </h5>
                      <p className="text-muted mb-1">
                        <strong>📅 Datum:</strong>{" "}
                        {new Date(appointment.start).toLocaleDateString(
                          "sr-RS"
                        )}
                      </p>
                      <p className="text-muted mb-1">
                        <strong>🕒 Vreme:</strong>{" "}
                        {new Date(appointment.start).toLocaleTimeString(
                          "sr-RS",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}{" "}
                        -{" "}
                        {new Date(appointment.end).toLocaleTimeString("sr-RS", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="text-end">
                      <Badge
                        bg={getStatusVariant(appointment.status)}
                        className="mb-2"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {getStatusText(appointment.status)}
                      </Badge>

                      {appointment.checked_in && (
                        <Badge bg="info" className="ms-1">
                          ✅ Check-in
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Kreirano:{" "}
                      {new Date(appointment.start).toLocaleString("sr-RS")}
                    </small>

                    {(appointment.status === "pending" ||
                      appointment.status === "approved") && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleCancel(appointment.id)}
                      >
                        🗑️ Otkaži
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default UserDashboard;
