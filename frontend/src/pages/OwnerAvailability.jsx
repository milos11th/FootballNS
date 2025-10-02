import React, { useEffect, useState } from "react";
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

function OwnerAvailability() {
  const [myHalls, setMyHalls] = useState([]);
  const [selectedHall, setSelectedHall] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchMyHalls();
  }, []);

  const fetchMyHalls = async () => {
    try {
      const res = await api.get("/my-halls/");
      setMyHalls(res.data);
    } catch (err) {
      console.error("Greška kod dohvatanja mojih hala:", err);
      setMessage({ type: "danger", text: "Greška pri učitavanju hala" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!selectedHall) {
      setMessage({ type: "warning", text: "Odaberi halu!" });
      return;
    }

    setLoading(true);
    try {
      const start = new Date(`${date}T${startTime}:00`);
      const end = new Date(`${date}T${endTime}:00`);

      const payload = {
        hall: parseInt(selectedHall),
        start: start.toISOString(),
        end: end.toISOString(),
      };

      console.log("Kreiranje dostupnosti:", payload);

      await api.post("/availabilities/create/", payload);

      await showSuccess("Dostupnost uspešno kreirana!");
      setDate("");
      setStartTime("");
      setEndTime("");
      setSelectedHall("");
    } catch (err) {
      console.error("Greška:", err.response?.data);
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Upravljanje Dostupnošću</h4>
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
                        "Kreiraj Dostupnost"
                      )}
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default OwnerAvailability;
