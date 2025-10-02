import React, { useEffect, useState } from "react";
import { Button, Card, Row, Col, Image, Spinner, Badge } from "react-bootstrap";
import api from "../api";
import HallEditModal from "../components/HallEditModal";
import { useAuth } from "../contexts/AuthContext";
import {
  showConfirm,
  showError,
  showSuccess,
  showApiError,
} from "../utils/sweetAlert";

export default function OwnerHalls({ myHalls, loading, refreshHalls }) {
  const { user } = useAuth();
  const [editingHall, setEditingHall] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  const handleOpenEdit = (hall = null) => {
    setEditingHall(hall);
    setShowEdit(true);
  };

  const handleCloseEdit = () => {
    setEditingHall(null);
    setShowEdit(false);
  };

  const handleSaved = () => {
    handleCloseEdit();
    refreshHalls();
  };

  const handleDelete = async (hallId) => {
    const result = await showConfirm(
      "Brisanje hale",
      "Da li ste sigurni da želite da obrišete ovu halu? Ova akcija se ne može poništiti."
    );

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/halls/${hallId}/`);
      await showSuccess("Hala uspešno obrisana!");
      refreshHalls();
    } catch (err) {
      console.error("Greška pri brisanju hale:", err);
      showApiError(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Učitavanje hala...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1 fw-bold" style={{ color: "#2c3e50" }}>
            Moje Sportske Hale
          </h4>
          <p className="text-muted mb-0">
            Ukupno hala:{" "}
            <Badge
              bg="light"
              text="dark"
              style={{ backgroundColor: "#ecf0f1", color: "#2c3e50" }}
            >
              {myHalls.length}
            </Badge>
          </p>
        </div>
        <Button
          variant="success"
          onClick={() => handleOpenEdit(null)}
          style={{ backgroundColor: "#27ae60", borderColor: "#27ae60" }}
        >
          ➕ Kreiraj Halu
        </Button>
      </div>

      {myHalls.length === 0 ? (
        <Card className="text-center py-5 border-light">
          <Card.Body>
            <h5 className="text-muted mb-3">🎯 Nemate kreiranih hala</h5>
            <p className="text-muted mb-3">
              Kreirajte svoju prvu halu da biste mogli da dodajete dostupnost i
              primalite rezervacije.
            </p>
            <Button
              variant="success"
              style={{ backgroundColor: "#27ae60", borderColor: "#27ae60" }}
              onClick={() => handleOpenEdit(null)}
            >
              Kreiraj Prvu Halu
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} className="g-4">
          {myHalls.map((hall) => {
            const images = hall.images || [];
            const mainUrl =
              (images.length > 0 ? images[0].image : hall.image) || null;

            return (
              <Col key={hall.id}>
                <Card className="h-100 shadow-sm border-light">
                  <Card.Body className="d-flex p-4">
                    {/* Slika */}
                    <div className="flex-shrink-0 me-4" style={{ width: 200 }}>
                      {mainUrl ? (
                        <Image
                          src={
                            mainUrl.startsWith("http")
                              ? mainUrl
                              : `${
                                  import.meta.env.VITE_API_URL ||
                                  "http://localhost:8000"
                                }${mainUrl}`
                          }
                          thumbnail
                          style={{
                            width: "100%",
                            height: 140,
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />
                      ) : (
                        <div
                          className="d-flex align-items-center justify-content-center bg-light rounded"
                          style={{
                            width: "100%",
                            height: 140,
                            color: "#95a5a6",
                            backgroundColor: "#f8f9fa",
                          }}
                        >
                          📷 Nema slike
                        </div>
                      )}
                    </div>

                    {/* Detalji */}
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h5
                            className="mb-2 fw-bold cursor-pointer"
                            style={{
                              cursor: "pointer",
                              color: "#2980b9",
                              fontSize: "1.25rem",
                            }}
                            onClick={() => handleOpenEdit(hall)}
                          >
                            {hall.name}
                          </h5>
                          <div className="text-muted mb-2">
                            <small className="d-block mb-1">
                              <span style={{ color: "#7f8c8d" }}>📍</span>{" "}
                              {hall.address}
                            </small>
                            <strong
                              style={{ color: "#27ae60", fontSize: "1.1rem" }}
                            >
                              {hall.price} RSD
                            </strong>
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() =>
                              window.open(`/halls/${hall.id}`, "_blank")
                            }
                            style={{ borderColor: "#3498db", color: "#3498db" }}
                          >
                            👁️ Pregled
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleOpenEdit(hall)}
                            style={{ borderColor: "#95a5a6", color: "#7f8c8d" }}
                          >
                            ✏️ Izmeni
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(hall.id)}
                            style={{ borderColor: "#e74c3c", color: "#e74c3c" }}
                          >
                            🗑️ Obriši
                          </Button>
                        </div>
                      </div>

                      {/* Opis */}
                      <p
                        className="text-muted mb-3"
                        style={{
                          lineHeight: "1.5",
                          color: "#5d6d7e",
                          fontSize: "0.95rem",
                        }}
                      >
                        {hall.description || "Nema opisa..."}
                      </p>

                      {/* Dodatne slike */}
                      {images.length > 0 && (
                        <div className="d-flex gap-2 flex-wrap align-items-center">
                          <small className="text-muted me-2">Slike:</small>
                          {images.slice(0, 4).map((img, idx) => (
                            <Image
                              key={img.id}
                              src={
                                img.image.startsWith("http")
                                  ? img.image
                                  : `${
                                      import.meta.env.VITE_API_URL ||
                                      "http://localhost:8000"
                                    }${img.image}`
                              }
                              thumbnail
                              style={{
                                width: 50,
                                height: 40,
                                objectFit: "cover",
                                cursor: "pointer",
                                border: "1px solid #ddd",
                              }}
                              onClick={() => handleOpenEdit(hall)}
                            />
                          ))}
                          {images.length > 4 && (
                            <Badge
                              bg="light"
                              text="dark"
                              style={{
                                backgroundColor: "#ecf0f1",
                                color: "#7f8c8d",
                                fontSize: "0.75rem",
                              }}
                            >
                              +{images.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <HallEditModal
        show={showEdit}
        onHide={handleCloseEdit}
        hall={editingHall}
        onSaved={handleSaved}
      />
    </div>
  );
}
