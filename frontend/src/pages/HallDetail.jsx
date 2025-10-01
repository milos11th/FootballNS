import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../styles/HallDetail.css";

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
      .catch((err) => console.error("Error fetching hall:", err));
    return () => {
      mounted = false;
    };
  }, [id]);

  // fetch free slots for selected date
  useEffect(() => {
    setLoadingSlots(true);
    const dateStr = selectedDate.toISOString().split("T")[0];
    api
      .get(`/halls/${id}/free/?date=${dateStr}`)
      .then((res) => {
        const slots = res.data?.hour_slots || [];
        const unique = Array.from(new Map(slots.map((s) => [s.start, s])).values());
        setFreeSlots(unique);
        setSelectedSlotStart(null);
      })
      .catch((err) => {
        console.error("Error fetching slots:", err);
        setFreeSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, id]);

  const handleBook = () => {
    if (!selectedSlotStart) return alert("Odaberi termin!");
    const token =
      localStorage.getItem("access")
    if (!token) {
      if (
        window.confirm(
          "Morate biti ulogovani da rezervišete termin. Da li želite da se ulogujete?"
        )
      ) {
        navigate("/login");
      }
      return;
    }

    const slot = freeSlots.find((s) => s.start === selectedSlotStart);
    if (!slot) return alert("Izabrani termin više nije dostupan.");

    api
      .post(
        "/appointments/create/",
        {
          hall: id,
          start: slot.start,
          end: slot.end,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(() => {
        alert("Rezervacija poslana!");
        // odmah ažuriramo listu termina bez reload
        setFreeSlots((prev) => prev.filter((s) => s.start !== slot.start));
        setSelectedSlotStart(null);
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.error || "Greška pri rezervaciji");
      });
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

  const showPrev = () =>
    setCurrentImageIdx((prev) =>
      prev === 0 ? fullImages.length - 1 : prev - 1
    );
  const showNext = () =>
    setCurrentImageIdx((prev) =>
      prev === fullImages.length - 1 ? 0 : prev + 1
    );

  return (
    <div className="hall-detail-container">
      <h1 className="hall-title">{hall.name}</h1>

      <div className="hall-detail-flex">
        {/* Left column */}
        <div className="hall-left">
          {fullImages.length === 0 ? (
            <div className="hall-placeholder">Nema slike</div>
          ) : fullImages.length === 1 ? (
            <div className="hall-main-image">
              <img src={fullImages[0]} alt={hall.name} />
            </div>
          ) : (
            <div className="hall-carousel">
              <button className="carousel-btn prev" onClick={showPrev}>
                ‹
              </button>
              <img
                src={fullImages[currentImageIdx]}
                alt={`${hall.name} ${currentImageIdx}`}
              />
              <button className="carousel-btn next" onClick={showNext}>
                ›
              </button>
            </div>
          )}

          <p className="hall-price">
            <strong>Cena:</strong> {hall.price} RSD
          </p>
          <p className="hall-description">{hall.description}</p>
        </div>

        {/* Right column */}
        <div className="hall-right">
          <h3>Odaberi datum</h3>
          <Calendar onChange={setSelectedDate} value={selectedDate} />

          <h3 style={{ marginTop: "20px" }}>Slobodni termini</h3>

          {loadingSlots ? (
            <p>Učitavanje termina...</p>
          ) : freeSlots.length === 0 ? (
            <p>Nema slobodnih termina za ovaj datum</p>
          ) : (
            <div className="hall-slots">
              {freeSlots.map((slot) => {
                const isSelected = slot.start === selectedSlotStart;
                return (
                  <button
                    key={slot.start}
                    onClick={() => setSelectedSlotStart(slot.start)}
                    className={`hall-slot-button ${
                      isSelected ? "selected" : ""
                    }`}
                  >
                    {new Date(slot.start).toLocaleTimeString([], {
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
            className="book-button"
            disabled={!selectedSlotStart}
          >
            Rezerviši termin
          </button>
        </div>
      </div>
    </div>
  );
}

export default HallDetail;
