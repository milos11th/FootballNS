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
  Table,
} from "react-bootstrap";
import api from "../api";
import { showApiError } from "../utils/sweetAlert";

function OwnerAppointmentHistory() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showCancellationStats, setShowCancellationStats] = useState(false);

  useEffect(() => {
    fetchAllAppointments();
  }, []);

  const fetchAllAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/owner/appointments/");
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

  // NOVO: Statistika otkazivanja po korisnicima
  const getCancellationStats = () => {
    const userCancellations = {};

    appointments.forEach((appointment) => {
      if (appointment.status === "cancelled") {
        const username = appointment.user;
        if (!userCancellations[username]) {
          userCancellations[username] = {
            count: 0,
            lastCancellation: appointment.start,
          };
        }
        userCancellations[username].count++;

        // Ažuriraj poslednje otkazivanje ako je novije
        if (
          new Date(appointment.start) >
          new Date(userCancellations[username].lastCancellation)
        ) {
          userCancellations[username].lastCancellation = appointment.start;
        }
      }
    });

    // Sortiraj po broju otkazivanja (opadajuće)
    return Object.entries(userCancellations)
      .map(([username, data]) => ({
        username,
        count: data.count,
        lastCancellation: data.lastCancellation,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 korisnika
  };

  const cancellationStats = getCancellationStats();

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await api.get("/owner/export-pdf/", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `rezervacije_${new Date().toISOString().split("T")[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Greška pri izvozu PDF-a");
    } finally {
      setExporting(false);
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    if (filter !== "all" && app.status !== filter) {
      return false;
    }
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
    const checkedIn = appointments.filter((a) => a.checked_in).length;

    return { total, approved, pending, rejected, cancelled, checkedIn };
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
        <div className="d-flex align-items-center gap-2">
          <Badge bg="primary" className="fs-6">
            Ukupno: {stats.total}
          </Badge>

          <Button
            variant="success"
            onClick={handleExportPDF}
            disabled={exporting || appointments.length === 0}
            className="d-flex align-items-center"
          >
            {exporting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Izvoz...
              </>
            ) : (
              <>📄 Izvezi PDF</>
            )}
          </Button>
        </div>
      </div>

      {/* NOVO: Statistika otkazivanja */}
      {cancellationStats.length > 0 && (
        <Card className="mb-4 border-warning">
          <Card.Header className="bg-warning bg-opacity-10 d-flex justify-content-between align-items-center">
            <h5 className="mb-0">⚠️ Statistika Otkazivanja</h5>
            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => setShowCancellationStats(!showCancellationStats)}
            >
              {showCancellationStats ? "👇 Sakrij" : "👆 Prikaži"}
            </Button>
          </Card.Header>

          {showCancellationStats && (
            <Card.Body>
              <p className="text-muted mb-3">
                Korisnici sa najviše otkazanih rezervacija:
              </p>

              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Korisnik</th>
                    <th>Broj otkazivanja</th>
                    <th>Poslednje otkazivanje</th>
                  </tr>
                </thead>
                <tbody>
                  {cancellationStats.map((user, index) => (
                    <tr key={user.username}>
                      <td>
                        <Badge
                          bg={
                            index === 0
                              ? "danger"
                              : index === 1
                              ? "warning"
                              : index === 2
                              ? "info"
                              : "secondary"
                          }
                        >
                          {index + 1}
                        </Badge>
                      </td>
                      <td>
                        <strong>{user.username}</strong>
                        {index === 0 && user.count >= 3 && (
                          <Badge
                            bg="danger"
                            className="ms-1"
                            title="Često otkazuje"
                          >
                            ⚠️
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg="secondary">{user.count}</Badge>
                      </td>
                      <td>
                        {new Date(user.lastCancellation).toLocaleDateString(
                          "sr-RS"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="mt-3">
                <small className="text-muted">
                  💡 <strong>Savet:</strong> Korisnici sa 3+ otkazivanja mogu
                  biti neozbiljni.
                </small>
              </div>
            </Card.Body>
          )}
        </Card>
      )}

      <Row className="mb-4">
        <Col md={2} sm={4}>
          <Card className="border-0 bg-primary bg-opacity-10">
            <Card.Body className="text-center py-3">
              <h5 className="text-primary mb-1">{stats.total}</h5>
              <small className="text-muted">Ukupno</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={4}>
          <Card className="border-0 bg-success bg-opacity-10">
            <Card.Body className="text-center py-3">
              <h5 className="text-success mb-1">{stats.approved}</h5>
              <small className="text-muted">Odobrene</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={4}>
          <Card className="border-0 bg-info bg-opacity-10">
            <Card.Body className="text-center py-3">
              <h5 className="text-info mb-1">{stats.checkedIn}</h5>
              <small className="text-muted">Check-in</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={4}>
          <Card className="border-0 bg-warning bg-opacity-10">
            <Card.Body className="text-center py-3">
              <h5 className="text-warning mb-1">{stats.pending}</h5>
              <small className="text-muted">Na čekanju</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={4}>
          <Card className="border-0 bg-danger bg-opacity-10">
            <Card.Body className="text-center py-3">
              <h5 className="text-danger mb-1">{stats.rejected}</h5>
              <small className="text-muted">Odbijene</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={4}>
          <Card className="border-0 bg-secondary bg-opacity-10">
            <Card.Body className="text-center py-3">
              <h5 className="text-secondary mb-1">{stats.cancelled}</h5>
              <small className="text-muted">Otkazane</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
                              ✅ Check-in-ovano
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

      <div className="text-center mt-4">
        <Button variant="outline-primary" onClick={fetchAllAppointments}>
          🔄 Osveži Istoriju
        </Button>
      </div>
    </div>
  );
}

export default OwnerAppointmentHistory;
