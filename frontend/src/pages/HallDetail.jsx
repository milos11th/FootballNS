import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../styles/HallDetail.css";
import { Carousel, Image, Badge, Card } from "react-bootstrap";
import {
  showConfirm,
  showSuccess,
  showError,
  showApiError,
} from "../utils/sweetAlert";
import ReviewsSection from '../components/ReviewsSection';

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
      {/* Hall Header with basic info */}
      <div className="hall-header">
        <h1 className="hall-title">{hall.name}</h1>
        <div className="hall-meta-info">
          <div className="hall-address">
            <span className="address-icon">📍</span>
            {hall.address}
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
        {/* Left column - Images */}
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

              {/* thumbnails */}
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
                      return (
                        <button
                          key={slot.start}
                          onClick={() => setSelectedSlotStart(slot.start)}
                          className={`hall-slot-button ${
                            isSelected ? "selected" : ""
                          }`}
                        >
                          {localTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      
      <div className="reviews-section-container">
        <ReviewsSection hallId={id} hallName={hall.name} />
      </div>
    </div>
  );
}

export default HallDetail;