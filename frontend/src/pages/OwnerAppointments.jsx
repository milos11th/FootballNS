import React, { useEffect, useState } from "react";
import { Card, Badge, Button, Row, Col, Spinner, Alert } from "react-bootstrap";
import api from "../api";
import { showSuccess, showApiError, showConfirm } from "../utils/sweetAlert";

function OwnerAppointments({ myHalls, refreshHalls }) {
  const [appointments, setAppointments] = useState({});
  const [loading, setLoading] = useState({});
  const [expandedHalls, setExpandedHalls] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);

  // Automatski učitaj sve rezervacije pri mount-u
  useEffect(() => {
    if (myHalls.length > 0) {
      loadAllPendingAppointments();
    } else {
      setInitialLoading(false);
    }
  }, [myHalls]);

  const loadAllPendingAppointments = async () => {
    setInitialLoading(true);
    const loadingStates = {};
    const appointmentsData = {};

    try {
      // Učitaj rezervacije za sve hale paralelno
      const promises = myHalls.map(async (hall) => {
        loadingStates[hall.id] = true;
        try {
          const res = await api.get(`/halls/${hall.id}/pending/`);
          appointmentsData[hall.id] = res.data;
        } catch (err) {
          console.error(`Error loading appointments for hall ${hall.id}:`, err);
          appointmentsData[hall.id] = [];
        } finally {
          loadingStates[hall.id] = false;
        }
      });

      await Promise.all(promises);
      setAppointments(appointmentsData);
      setLoading(loadingStates);
    } catch (err) {
      console.error("Error loading all appointments:", err);
      showApiError(err);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadPending = async (hallId) => {
    setLoading((prev) => ({ ...prev, [hallId]: true }));
    try {
      const res = await api.get(`/halls/${hallId}/pending/`);
      setAppointments((prev) => ({ ...prev, [hallId]: res.data }));
    } catch (err) {
      console.error(err);
      showApiError(err);
    } finally {
      setLoading((prev) => ({ ...prev, [hallId]: false }));
    }
  };

  const toggleHall = (hallId) => {
    setExpandedHalls((prev) => ({
      ...prev,
      [hallId]: !prev[hallId],
    }));
  };

  const handleAction = async (appointmentId, action, hallId) => {
    const actionText = action === "approve" ? "odobr" : "odbij";
    const result = await showConfirm(
      `${action === "approve" ? "Odobravanje" : "Odbijanje"} rezervacije`,
      `Da li ste sigurni da želite da ${actionText}te ovu rezervaciju?`
    );

    if (!result.isConfirmed) return;

    try {
      await api.post(`/appointments/${appointmentId}/owner-action/`, {
        action,
      });
      await showSuccess(`Rezervacija uspešno ${actionText}ena!`);
      // Refresh samo rezervacije za tu halu
      await loadPending(hallId);
    } catch (err) {
      console.error(err);
      showApiError(err);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
    };
    return variants[status] || "secondary";
  };

  const getTotalPendingCount = () => {
    return Object.values(appointments).reduce((total, hallApps) => {
      return total + (hallApps?.length || 0);
    }, 0);
  };

  if (initialLoading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Učitavanje rezervacija...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">📅 Rezervacije na Čekanju</h4>
        <Badge bg="primary" className="fs-6">
          Ukupno: {getTotalPendingCount()}
        </Badge>
      </div>

      {myHalls.length === 0 ? (
        <Alert variant="info">
          🏠 Nemate nijednu halu. Kreirajte halu da biste primali rezervacije.
        </Alert>
      ) : getTotalPendingCount() === 0 ? (
        <Alert variant="success">
          ✅ Trenutno nema rezervacija na čekanju za vaše hale.
        </Alert>
      ) : (
        <Row xs={1} className="g-3">
          {myHalls.map((hall) => {
            const hallAppointments = appointments[hall.id] || [];
            const hasPending = hallAppointments.length > 0;

            return (
              <Col key={hall.id}>
                <Card className="border-0 shadow-sm">
                  <Card.Header
                    className={`cursor-pointer ${
                      hasPending ? "bg-warning text-dark" : "bg-light"
                    }`}
                    onClick={() => toggleHall(hall.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">
                        🏟️ {hall.name}
                        {hasPending && " ⚠️"}
                      </h6>
                      <Badge
                        bg={hasPending ? "warning" : "secondary"}
                        text={hasPending ? "dark" : "light"}
                      >
                        {hallAppointments.length} na čekanju
                      </Badge>
                    </div>
                  </Card.Header>

                  {expandedHalls[hall.id] && hasPending && (
                    <Card.Body>
                      {loading[hall.id] ? (
                        <div className="text-center py-3">
                          <Spinner animation="border" size="sm" />
                          <p className="mt-2 text-muted">Učitavanje...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {hallAppointments.map((app) => (
                            <Card key={app.id} className="border">
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <h6 className="mb-1">👤 {app.user}</h6>
                                    <p className="text-muted mb-1">
                                      📅{" "}
                                      {new Date(app.start).toLocaleDateString(
                                        "sr-RS"
                                      )}
                                    </p>
                                    <p className="text-muted mb-0">
                                      🕒{" "}
                                      {new Date(app.start).toLocaleTimeString(
                                        "sr-RS",
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }
                                      )}{" "}
                                      -{" "}
                                      {new Date(app.end).toLocaleTimeString(
                                        "sr-RS",
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }
                                      )}
                                    </p>
                                  </div>
                                  <Badge bg={getStatusBadge(app.status)}>
                                    {app.status === "pending"
                                      ? "⏳ Čeka"
                                      : app.status}
                                  </Badge>
                                </div>

                                <div className="d-flex gap-2 mt-3">
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() =>
                                      handleAction(app.id, "approve", hall.id)
                                    } // ← hall.id se prosleđuje
                                  >
                                    ✅ Odobri
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() =>
                                      handleAction(app.id, "reject", hall.id)
                                    } // ← hall.id se prosleđuje
                                  >
                                    ❌ Odbij
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          ))}
                        </div>
                      )}
                    </Card.Body>
                  )}

                  {expandedHalls[hall.id] && !hasPending && (
                    <Card.Body>
                      <Alert variant="success" className="mb-0">
                        ✅ Nema rezervacija na čekanju za ovu halu
                      </Alert>
                    </Card.Body>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <div className="text-center mt-4">
        <Button
          variant="outline-primary"
          onClick={loadAllPendingAppointments}
          disabled={initialLoading}
        >
          🔄 Osveži Rezervacije
        </Button>
      </div>
    </div>
  );
}

export default OwnerAppointments;
