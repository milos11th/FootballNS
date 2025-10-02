import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Image,
} from "react-bootstrap";
import api from "../api";
import { showApiError } from "../utils/sweetAlert";
import "../styles/Halls.css";

const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_API_URL || "http://localhost:8000"}${path}`;
};

export default function Halls() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/halls/")
      .then((res) => setHalls(res.data))
      .catch((err) => {
        console.error("Error fetching halls:", err);
        setError("Greška pri učitavanju hala");
        showApiError(err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Učitavanje hala...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="text-center py-5">
        <div className="alert alert-danger">
          <h4>Greška</h4>
          <p>{error}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-4 halls-container">
      <div className="text-center mb-5">
        <h1 className="halls-title">🏟️ Fudbalske Hale</h1>
        <p className="halls-subtitle">
          Pronađite savršenu halu za vašu sledeću utakmicu
        </p>
        <Badge bg="secondary" className="total-badge">
          Ukupno hala: {halls.length}
        </Badge>
      </div>

      {halls.length === 0 ? (
        <Card className="text-center py-5 empty-state">
          <Card.Body>
            <h4 className="text-muted">🏃‍♂️ Trenutno nema dostupnih hala</h4>
            <p className="text-muted">Proverite ponovo kasnije.</p>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {halls.map((hall) => {
            const imgUrl =
              hall.images && hall.images.length > 0
                ? hall.images[0].image || hall.images[0]
                : hall.image;
            const src = getFullUrl(imgUrl);

            return (
              <Col key={hall.id}>
                <Card className="h-100 hall-card">
                  {/* Slika */}
                  <div className="hall-image-container">
                    {src ? (
                      <Image src={src} alt={hall.name} className="hall-image" />
                    ) : (
                      <div className="hall-placeholder">
                        <div className="text-center">
                          <div className="placeholder-icon">🏟️</div>
                          <small>Nema slike</small>
                        </div>
                      </div>
                    )}
                  </div>

                  <Card.Body className="card-body-content">
                    {/* Naslov i adresa */}
                    <div className="hall-header">
                      <Card.Title className="hall-name">{hall.name}</Card.Title>
                      <Card.Text className="hall-address">
                        📍 {hall.address}
                      </Card.Text>
                    </div>

                    {/* Opis */}
                    <Card.Text className="hall-description">
                      {hall.description || "Nema opisa..."}
                    </Card.Text>

                    {/* Cena i dugme */}
                    <div className="hall-footer">
                      <div className="price-container">
                        <Badge className="price-badge">
                          💰 {hall.price} RSD/sat
                        </Badge>
                      </div>

                      <div className="d-grid">
                        <Button
                          as={Link}
                          to={`/halls/${hall.id}`}
                          className="view-button"
                        >
                          👁️ Pregledaj & Rezerviši
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
}
