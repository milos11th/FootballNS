import React, { useEffect, useState } from "react";
import {
  Card,
  Badge,
  Button,
  Row,
  Col,
  Spinner,
  Alert,
  Form,
} from "react-bootstrap";
import api from "../api";
import { showApiError } from "../utils/sweetAlert";

function OwnerAppointmentHistory() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, approved, pending, rejected, cancelled
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    fetchAllAppointments();
  }, []);

  const fetchAllAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/owner/appointments/");

      // Sortiraj po datumu - najnovije prvo
      const sortedAppointments = res.data.sort(
        (a, b) => new Date(b.start) - new Date(a.start)
      );

      setAppointments(sortedAppointments);
    } catch (err) {
      console.error("Error fetching appointment history:", err);
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    // Filter po statusu
    if (filter !== "all" && app.status !== filter) {
      return false;
    }

    // Filter po datumu
    if (dateFilter) {
      const appointmentDate = new Date(app.start).toISOString().split("T")[0];
      return appointmentDate === dateFilter;
    }

    return true;
  });

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

  const getStats = () => {
    const total = appointments.length;
    const approved = appointments.filter((a) => a.status === "approved").length;
    const pending = appointments.filter((a) => a.status === "pending").length;
    const rejected = appointments.filter((a) => a.status === "rejected").length;
    const cancelled = appointments.filter(
      (a) => a.status === "cancelled"
    ).length;

    return { total, approved, pending, rejected, cancelled };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Učitavanje istorije rezervacija...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">📊 Istorija Rezervacija</h4>
          <p className="text-muted mb-0">
            Pregled svih rezervacija za vaše hale
          </p>
        </div>
        <Badge bg="primary" className="fs-6">
          Ukupno: {stats.total}
        </Badge>
      </div>

      {/* Statistika */}
      <Row className="mb-4">
        <Col md={3} sm={6}>
          <Card className="border-0 bg-success bg-opacity-10">
            <Card.Body className="text-center py-3">
              <h5 className="text-success mb-1">{stats.approved}</h5>
              <small className="text-muted">Odobrene</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 bg-warning bg-opacity-10">
            <Card.Body className="text-center py-3">
              <h5 className="text-warning mb-1">{stats.pending}</h5>
              <small className="text-muted">Na čekanju</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 bg-danger bg-opacity-10">
            <Card.Body className="text-center py-3">
              <h5 className="text-danger mb-1">{stats.rejected}</h5>
              <small className="text-muted">Odbijene</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 bg-secondary bg-opacity-10">
            <Card.Body className="text-center py-3">
              <h5 className="text-secondary mb-1">{stats.cancelled}</h5>
              <small className="text-muted">Otkazane</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filteri */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Filter po statusu:</Form.Label>
              <Form.Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Sve rezervacije</option>
                <option value="approved">Odobrene</option>
                <option value="pending">Na čekanju</option>
                <option value="rejected">Odbijene</option>
                <option value="cancelled">Otkazane</option>
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Filter po datumu:</Form.Label>
              <Form.Control
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </Col>
          </Row>
          {(filter !== "all" || dateFilter) && (
            <div className="mt-3">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setFilter("all");
                  setDateFilter("");
                }}
              >
                🗑️ Očisti filtere
              </Button>
              <small className="text-muted ms-2">
                Prikazano: {filteredAppointments.length} od{" "}
                {appointments.length}
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Lista rezervacija */}
      {filteredAppointments.length === 0 ? (
        <Alert variant="info">
          📭 Nema rezervacija za prikaz sa trenutnim filterima.
        </Alert>
      ) : (
        <Row xs={1} className="g-3">
          {filteredAppointments.map((appointment) => (
            <Col key={appointment.id}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-1">🏟️ {appointment.hall_name}</h6>
                          <p className="text-muted mb-1">
                            <strong>👤 Korisnik:</strong> {appointment.user}
                          </p>
                          <p className="text-muted mb-1">
                            <strong>📅 Datum:</strong>{" "}
                            {new Date(appointment.start).toLocaleDateString(
                              "sr-RS"
                            )}
                          </p>
                          <p className="text-muted mb-0">
                            <strong>🕒 Vreme:</strong>{" "}
                            {new Date(appointment.start).toLocaleTimeString(
                              "sr-RS",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}{" "}
                            -{" "}
                            {new Date(appointment.end).toLocaleTimeString(
                              "sr-RS",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
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

                      <small className="text-muted">
                        Kreirano:{" "}
                        {new Date(appointment.start).toLocaleString("sr-RS")}
                      </small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Refresh dugme */}
      <div className="text-center mt-4">
        <Button variant="outline-primary" onClick={fetchAllAppointments}>
          🔄 Osveži Istoriju
        </Button>
      </div>
    </div>
  );
}

export default OwnerAppointmentHistory;
