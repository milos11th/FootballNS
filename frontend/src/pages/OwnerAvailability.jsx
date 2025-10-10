import React, { useState } from "react";
import api from "../api";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import { showSuccess, showApiError } from "../utils/sweetAlert";
import BulkCreateAvailability from "../components/BulkCreateAvailability";

function OwnerAvailability({ myHalls, refreshHalls }) {
  const [selectedHall, setSelectedHall] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showBulkForm, setShowBulkForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!selectedHall) {
      setMessage({ type: "danger", text: "Morate odabrati halu" });
      setLoading(false);
      return;
    }

    if (!date) {
      setMessage({ type: "danger", text: "Morate odabrati datum" });
      setLoading(false);
      return;
    }

    if (startTime >= endTime) {
      setMessage({
        type: "danger",
        text: "Krajnje vreme mora biti posle početnog vremena",
      });
      setLoading(false);
      return;
    }

    try {
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        setMessage({ type: "danger", text: "Neispravan datum ili vreme" });
        setLoading(false);
        return;
      }

      const payload = {
        hall: parseInt(selectedHall),
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
      };

      console.log("Sending availability:", payload);

      await api.post("/availabilities/create/", payload);
      await showSuccess("Dostupnost uspešno kreirana!");

      setSelectedHall("");
      setDate("");
      setStartTime("08:00");
      setEndTime("16:00");
      setMessage({ type: "success", text: "Dostupnost uspešno kreirana!" });

      if (refreshHalls) {
        refreshHalls();
      }
    } catch (err) {
      console.error("Error creating availability:", err);
      showApiError(err);
      setMessage({ type: "danger", text: "Greška pri kreiranju dostupnosti" });
    } finally {
      setLoading(false);
    }
  };

  const selectedHallObj = myHalls.find(
    (hall) => hall.id === parseInt(selectedHall)
  );

  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col md={10}>
          <div className="text-center mb-4">
            <Button
              variant={showBulkForm ? "outline-primary" : "primary"}
              onClick={() => setShowBulkForm(!showBulkForm)}
              size="lg"
            >
              {showBulkForm
                ? "↩️ Povratak na jedan dan"
                : "📅 Kreiraj za više dana"}
            </Button>
          </div>

          {showBulkForm ? (
            <BulkCreateAvailability
              hallId={selectedHall}
              hallName={selectedHallObj?.name || ""}
              onSuccess={refreshHalls}
            />
          ) : (
            <Card>
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">Kreiraj radno vreme za jedan dan</h4>
              </Card.Header>
              <Card.Body>
                {message.text && (
                  <Alert variant={message.type}>{message.text}</Alert>
                )}

                {myHalls.length === 0 ? (
                  <Alert variant="info">
                    Nemaš nijednu halu. Kreiraj prvo halu da bi mogao da dodaješ
                    dostupnost.
                  </Alert>
                ) : (
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <strong>Odaberi halu:</strong>
                      </Form.Label>
                      <Form.Select
                        value={selectedHall}
                        onChange={(e) => setSelectedHall(e.target.value)}
                        required
                        size="lg"
                      >
                        <option value="">-- Izaberi halu --</option>
                        {myHalls.map((hall) => (
                          <option key={hall.id} value={hall.id}>
                            {hall.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        <strong>Datum:</strong>
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        size="lg"
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <strong>Početno vreme:</strong>
                          </Form.Label>
                          <Form.Control
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                            size="lg"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <strong>Krajnje vreme:</strong>
                          </Form.Label>
                          <Form.Control
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                            size="lg"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-grid">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Kreiranje...
                          </>
                        ) : (
                          "✅ Kreiraj radno vreme za jedan dan"
                        )}
                      </Button>
                    </div>
                  </Form>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default OwnerAvailability;
