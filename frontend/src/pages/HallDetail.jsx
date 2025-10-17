import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../styles/HallDetail.css";
import { Carousel, Image, Badge, Card, Button, Modal } from "react-bootstrap";
import {
  showConfirm,
  showSuccess,
  showError,
  showApiError,
} from "../utils/sweetAlert";
import ReviewsSection from "../components/ReviewsSection";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Popravite ikone za Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_API_URL || "http://localhost:8000"}${path}`;
};

function HallDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hall, setHall] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [freeSlots, setFreeSlots] = useState([]);
  const [selectedSlotStart, setSelectedSlotStart] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [showMap, setShowMap] = useState(false);

  // fetch hall details
  useEffect(() => {
    let mounted = true;
    api
      .get(`/halls/${id}/`)
      .then((res) => {
        if (mounted) setHall(res.data);
      })
      .catch((err) => {
        console.error("Error fetching hall:", err);
        showApiError(err);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    setLoadingSlots(true);

    // Napravi lokalni YYYY-MM-DD umesto UTC iz toISOString()
    const localDate = new Date(selectedDate);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    api
      .get(`/halls/${id}/free/?date=${dateStr}`)
      .then((res) => {
        const slots = res.data?.hour_slots || [];
        const unique = Array.from(
          new Map(slots.map((s) => [s.start, s])).values()
        );
        setFreeSlots(unique);
        setSelectedSlotStart(null);
      })
      .catch((err) => {
        console.error("Error fetching slots:", err);
        setFreeSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, id]);

  const handleBook = async () => {
    if (!selectedSlotStart) {
      await showError("Molimo odaberite termin za rezervaciju!");
      return;
    }

    const selectedSlot = freeSlots.find((s) => s.start === selectedSlotStart);
    if (selectedSlot && new Date(selectedSlot.end) <= new Date()) {
      await showError("Ne možete rezervisati termine u prošlosti!");
      return;
    }

    const token = localStorage.getItem("access");
    if (!token) {
      const result = await showConfirm(
        "Potrebna prijava",
        "Morate biti ulogovani da rezervišete termin. Da li želite da se ulogujete?"
      );
      if (result.isConfirmed) {
        navigate("/login");
      }
      return;
    }

    const slot = freeSlots.find((s) => s.start === selectedSlotStart);
    if (!slot) {
      await showError("Izabrani termin više nije dostupan.");
      return;
    }

    try {
      await api.post(
        "/appointments/create/",
        {
          hall: id,
          start: slot.start,
          end: slot.end,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await showSuccess(
        "Rezervacija uspešno poslata! Čeka se odobrenje vlasnika."
      );
      setFreeSlots((prev) => prev.filter((s) => s.start !== slot.start));
      setSelectedSlotStart(null);
    } catch (err) {
      console.error(err);
      showApiError(err);
    }
  };

  // Funkcija za proveru da li je termin u prošlosti
  const isPastSlot = (slot) => {
    return new Date(slot.end) <= new Date();
  };

  // Funkcija za proveru da li je termin danas prošao
  const isTodayPastSlot = (slot) => {
    const now = new Date();
    const slotDate = new Date(slot.start);
    const isToday = slotDate.toDateString() === now.toDateString();
    return isToday && isPastSlot(slot);
  };

  if (!hall) return <div className="loading">Učitavanje hale...</div>;

  const rawImages =
    Array.isArray(hall.images) && hall.images.length > 0
      ? hall.images
      : hall.image
      ? [hall.image]
      : [];

  const fullImages = rawImages
    .map((i) => (typeof i === "string" ? i : i.image || ""))
    .map(getFullUrl)
    .filter(Boolean);

  return (
    <div className="hall-detail-container">
      <div className="hall-header">
        <h1 className="hall-title">{hall.name}</h1>
        <div className="hall-meta-info">
          <div className="hall-address">
            <span className="address-icon">📍</span>
            {hall.address}
            {hall.location && (
              <Button
                variant="outline-primary"
                size="sm"
                className="ms-2"
                onClick={() => setShowMap(true)}
                title="Prikaži lokaciju na mapi"
              >
                🗺️ Prikaži na mapi
              </Button>
            )}
          </div>
          <div className="hall-price-main">
            <span className="price-icon">💰</span>
            {hall.price} RSD/sat
          </div>
        </div>
      </div>

      {hall.description && (
        <div className="hall-description-block">
          <h5 className="description-title">📝 Opis</h5>
          <p className="hall-description">{hall.description}</p>
        </div>
      )}

      <div className="hall-detail-flex">
        <div className="hall-left">
          {fullImages.length === 0 ? (
            <div className="hall-placeholder">
              <div className="placeholder-content">
                <div className="placeholder-icon">📷</div>
                <p>Nema dostupnih slika</p>
              </div>
            </div>
          ) : fullImages.length === 1 ? (
            <div className="hall-main-image">
              <img src={fullImages[0]} alt={hall.name} />
            </div>
          ) : (
            <div className="hall-carousel">
              <Carousel
                activeIndex={currentImageIdx}
                onSelect={(selectedIndex) => setCurrentImageIdx(selectedIndex)}
                interval={null}
                variant="dark"
              >
                {fullImages.map((url, idx) => (
                  <Carousel.Item key={idx}>
                    <img
                      src={url}
                      alt={`${hall.name}-${idx}`}
                      className="carousel-image"
                    />
                  </Carousel.Item>
                ))}
              </Carousel>

              <div className="thumbnails-container">
                {fullImages.map((url, idx) => (
                  <Image
                    key={idx}
                    src={url}
                    thumbnail
                    onClick={() => setCurrentImageIdx(idx)}
                    className={`thumbnail-image ${
                      idx === currentImageIdx ? "thumbnail-active" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="hall-right">
          <Card className="booking-card">
            <Card.Body>
              <h4 className="calendar-title">📅 Odaberi datum</h4>
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                className="custom-calendar"
                minDate={new Date()} // Sprečava odabir prošlih datuma
              />

              <div className="slots-section">
                <h5 className="slots-title">🕒 Slobodni termini</h5>

                {loadingSlots ? (
                  <div className="loading-slots">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Učitavanje...</span>
                    </div>
                    <p className="loading-text">Učitavanje termina...</p>
                  </div>
                ) : freeSlots.length === 0 ? (
                  <div className="no-slots">
                    <p className="no-slots-text">
                      ❌ Nema slobodnih termina za ovaj datum
                    </p>
                  </div>
                ) : (
                  <div className="hall-slots">
                    {freeSlots.map((slot) => {
                      const isSelected = slot.start === selectedSlotStart;
                      const localTime = new Date(slot.start);
                      const isPast = isPastSlot(slot);
                      const isTodayPast = isTodayPastSlot(slot);

                      return (
                        <button
                          key={slot.start}
                          onClick={() => {
                            if (!isPast) {
                              setSelectedSlotStart(slot.start);
                            }
                          }}
                          className={`hall-slot-button ${
                            isSelected ? "selected" : ""
                          } ${isPast ? "past-slot" : ""}`}
                          disabled={isPast}
                          title={isPast ? "Termin je prošao" : ""}
                        >
                          {localTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {isPast && " ❌"}
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={handleBook}
                  className={`book-button ${
                    !selectedSlotStart ? "disabled" : ""
                  }`}
                  disabled={!selectedSlotStart}
                >
                  {!selectedSlotStart
                    ? "Izaberi termin"
                    : "✅ Rezerviši termin"}
                </button>

                {/* Informacija o prošlim terminima */}
                {freeSlots.some((slot) => isPastSlot(slot)) && (
                  <div className="past-slots-info">
                    <small className="text-muted">
                      ❌ Termini sa X su prošli i ne mogu se rezervisati
                    </small>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <div className="reviews-section-container">
        <ReviewsSection hallId={id} hallName={hall.name} />
      </div>

      {/* Map Modal - SAMO AKO POSTOJI LOKACIJA */}
      {hall.location && (
        <Modal show={showMap} onHide={() => setShowMap(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Lokacija Hale: {hall.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted mb-3">
              <strong>Adresa:</strong> {hall.address}
            </p>

            {/* Leaflet Mapa */}
            <div
              style={{
                height: "400px",
                width: "100%",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <MapContainer
                center={[hall.location.lat, hall.location.lng]}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker position={[hall.location.lat, hall.location.lng]}>
                  <Popup>
                    <strong>{hall.name}</strong>
                    <br />
                    {hall.address}
                    <br />
                    {hall.price} RSD/sat
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            <div className="mt-3 p-3 border rounded bg-light">
              <strong>📍 Koordinate lokacije:</strong>
              <br />
              <strong>Latitude:</strong> {hall.location.lat.toFixed(6)}
              <br />
              <strong>Longitude:</strong> {hall.location.lng.toFixed(6)}
            </div>

            <div className="mt-3">
              <small className="text-muted">
                💡 <strong>Savet:</strong> Koristite ovu mapu za navigaciju do
                hale.
              </small>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowMap(false)}>
              Zatvori
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hall.location.lat},${hall.location.lng}`;
                window.open(mapsUrl, "_blank");
              }}
            >
              🗺️ Navigacija (Google Maps)
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}

export default HallDetail;
