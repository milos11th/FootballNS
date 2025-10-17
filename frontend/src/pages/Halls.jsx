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
  Form,
} from "react-bootstrap";
import api from "../api";
import { showApiError } from "../utils/sweetAlert";
import "../styles/Halls.css";

const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_API_URL || "http://localhost:8000"}${path}`;
};
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius Zemlje u km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Udaljenost u km
};

// Funkcija za dobijanje korisnikove lokacije
const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolokacija nije podržana"));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        }
      );
    }
  });
};

export default function Halls() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [sortBy, setSortBy] = useState("name");
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    setLocationLoading(true);
    getUserLocation()
      .then((location) => {
        setUserLocation(location);
        console.log("📍 Korisnikova lokacija:", location);
      })
      .catch((error) => {
        console.log("❌ Nije moguće dobiti lokaciju:", error.message);
      })
      .finally(() => setLocationLoading(false));
  }, []);

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

  // Filter hala po ceni
  const filteredHalls = halls.filter(
    (hall) => hall.price >= priceRange[0] && hall.price <= priceRange[1]
  );

  // Sortiranje hala
  const sortedHalls = [...filteredHalls].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return a.price - b.price;
      case "price_desc":
        return b.price - a.price;
      case "name":
        return a.name.localeCompare(b.name);
      case "distance":
        if (!userLocation || !a.location || !b.location) return 0;
        const distA = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          a.location.lat,
          a.location.lng
        );
        const distB = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          b.location.lat,
          b.location.lng
        );
        return distA - distB;
      default:
        return 0;
    }
  });

  // Pronađi max cenu za slider
  const maxPrice =
    halls.length > 0 ? Math.max(...halls.map((hall) => hall.price)) : 5000;

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
          Ukupno hala: {sortedHalls.length}
        </Badge>
      </div>

      {/* FILTERI I SORTIRANJE */}
      <Card className="mb-4 filter-card">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={4}>
              <Form.Group>
                <Form.Label>
                  <strong>
                    💰 Cena: {priceRange[0]} - {priceRange[1]} RSD
                  </strong>
                </Form.Label>
                <Form.Range
                  min={0}
                  max={maxPrice}
                  step={100}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>
                  <strong>🔀 Sortiraj po:</strong>
                </Form.Label>
                <Form.Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Nazivu (A-Ž)</option>
                  <option value="price">Ceni (niža → viša)</option>
                  <option value="price_desc">Ceni (viša → niža)</option>
                  {userLocation && (
                    <option value="distance">
                      Udaljenosti (bliža → dalja)
                    </option>
                  )}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
              <div className="filter-info">
                <small className="text-muted">
                  Prikazano: <strong>{sortedHalls.length}</strong> od{" "}
                  <strong>{halls.length}</strong> hala
                </small>
                <br />
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setPriceRange([0, maxPrice]);
                    setSortBy("name");
                  }}
                >
                  🔄 Resetuj filtere
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {sortedHalls.length === 0 ? (
        <Card className="text-center py-5 empty-state">
          <Card.Body>
            <h4 className="text-muted">
              🔍 Nema hala koje odgovaraju filterima
            </h4>
            <p className="text-muted">Pokušajte da promenite opseg cene.</p>
            <Button
              variant="primary"
              onClick={() => setPriceRange([0, maxPrice])}
            >
              Poništi filtere
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {sortedHalls.map((hall) => {
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
                        {hall.location && (
                          <small className="text-muted d-block mt-1"></small>
                        )}
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
