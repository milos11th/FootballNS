import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import api from "../api";
import { showSuccess, showApiError } from "../utils/sweetAlert";

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

// Komponenta za dodavanje markera klikom
function LocationMarker({ onLocationSet }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      onLocationSet({ lat, lng });
    },
  });

  return position === null ? null : <Marker position={position} />;
}

const MapModal = ({ show, onHide, hall, selectedLocation, onLocationSet }) => {
  const [tempLocation, setTempLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Centar mape - Novi Sad
  const center = [45.2671, 19.8335];

  React.useEffect(() => {
    setTempLocation(selectedLocation);
  }, [selectedLocation, show]);

  const handleLocationSet = (location) => {
    setTempLocation(location);
  };

  const saveLocation = async () => {
    if (!tempLocation) return;

    // Ako imamo hall ID, snimimo na backend
    if (hall?.id) {
      setLoading(true);
      try {
        const token = localStorage.getItem("access");
        console.log("🔐 Token:", token ? "Postoji" : "NEMA TOKENA");

        const response = await api.post(
          `/api/halls/${hall.id}/set-location/`,
          {
            lat: tempLocation.lat,
            lng: tempLocation.lng,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("✅ Backend odgovor:", response.data);
        await showSuccess("Lokacija uspešno postavljena!");
      } catch (error) {
        console.error(
          "❌ Greška pri postavljanju lokacije:",
          error.response?.data
        );

        // Ako je 401 Unauthorized, korisnik nije ulogovan
        if (error.response?.status === 401) {
          await showError("Morate biti ulogovani da postavite lokaciju!");
        } else {
          showApiError(error);
        }
      } finally {
        setLoading(false);
      }
    }

    // U svakom slučaju prosledi lokaciju parent komponenti
    onLocationSet(tempLocation);
  };

  const clearLocation = async () => {
    // Ako imamo hall ID, obriši sa backenda
    if (hall?.id) {
      setLoading(true);
      try {
        await api.delete(`/api/halls/${hall.id}/set-location/`);
        await showSuccess("Lokacija uspešno obrisana!");
      } catch (error) {
        console.error("Greška pri brisanju lokacije:", error);
        showApiError(error);
      } finally {
        setLoading(false);
      }
    }

    // U svakom slučaju obriši lokaciju
    setTempLocation(null);
    onLocationSet(null);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Postavi Lokaciju Hale</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted mb-3">
          Klikni na mapu ispod da postaviš tačnu lokaciju svoje hale.
        </p>

        {/* PRAVA LEAFLET MAPA */}
        <div
          style={{
            height: "400px",
            width: "100%",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Postojeći marker ako postoji */}
            {tempLocation && (
              <Marker position={[tempLocation.lat, tempLocation.lng]} />
            )}

            {/* Komponenta za dodavanje novog markera klikom */}
            <LocationMarker onLocationSet={handleLocationSet} />
          </MapContainer>
        </div>

        {/* Informacije o lokaciji */}
        <div className="mt-3 p-3 border rounded bg-light">
          {tempLocation ? (
            <div>
              <strong style={{ color: "#1976d2" }}>
                📍 Lokacija postavljena:
              </strong>
              <br />
              <strong>Adresa:</strong> {hall?.address || "Nije uneta adresa"}
              <br />
              <strong>Latitude:</strong> {tempLocation.lat.toFixed(6)}
              <br />
              <strong>Longitude:</strong> {tempLocation.lng.toFixed(6)}
            </div>
          ) : (
            <div>
              <strong>🎯 Klikni na mapu da postaviš lokaciju</strong>
              <br />
              <small className="text-muted">Centar mape: Novi Sad</small>
            </div>
          )}
        </div>

        <div className="mt-3">
          <small className="text-muted">
            💡 <strong>Savet:</strong> Zumiraj i pomeri mapu da pronađeš tačnu
            lokaciju svoje hale, onda klikni na tačno mesto da postaviš marker.
          </small>
        </div>
      </Modal.Body>
      <Modal.Footer>
        {tempLocation && (
          <Button
            variant="outline-danger"
            onClick={clearLocation}
            disabled={loading}
          >
            Obriši Lokaciju
          </Button>
        )}
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Otkaži
        </Button>
        <Button
          variant="primary"
          onClick={saveLocation}
          disabled={!tempLocation || loading}
        >
          {loading ? "Čuvanje..." : "Sačuvaj Lokaciju"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MapModal;
