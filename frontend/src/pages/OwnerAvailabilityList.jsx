import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Form,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import api from "../api";
import { showConfirm, showSuccess, showApiError } from "../utils/sweetAlert";

export default function OwnerAvailabilityList({ myHalls, refreshHalls }) {
  const [selectedHall, setSelectedHall] = useState("all");
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dohvati avalability za odabranu halu
  const fetchAvailabilities = async (hallId = "all") => {
    setLoading(true);
    setError(null);

    if (myHalls.length === 0) {
      setAvailabilities([]);
      setLoading(false);
      return;
    }

    try {
      let url = "/availabilities/";
      const res = await api.get(url);

      // FILTRIRANJE: Prikaži samo availability-je za ownerove hale
      let filteredAvailabilities = (res.data || []).filter((avail) =>
        myHalls.some((hall) => hall.id === avail.hall)
      );

      // Dodatno filtriranje po selektovanoj hali
      if (hallId && hallId !== "all") {
        filteredAvailabilities = filteredAvailabilities.filter(
          (avail) => avail.hall === parseInt(hallId)
        );
      }

      setAvailabilities(filteredAvailabilities);
    } catch (err) {
      console.error("Error fetching availabilities:", err);
      setError("Greška pri učitavanju dostupnosti");
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  };

  // Funkcija za preuzimanje dostupnosti za odabranu halu
  const handleHallChange = (e) => {
    const hallId = e.target.value;
    setSelectedHall(hallId);
    fetchAvailabilities(hallId);
  };

  // Funkcija za brisanje dostupnosti
  const handleDelete = async (availabilityId) => {
    const result = await showConfirm(
      "Brisanje dostupnosti",
      "Da li ste sigurni da želite da obrišete ovu dostupnost?"
    );

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/availabilities/${availabilityId}/`);
      await showSuccess("Dostupnost uspešno obrisana!");
      // Osvježi dostupnosti nakon brisanja
      fetchAvailabilities(selectedHall);
    } catch (err) {
      console.error("Error deleting availability:", err);
      showApiError(err);
    }
  };

  // Formatiraj datum za prikaz
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sr-RS", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Formatiraj vreme za prikaz
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("sr-RS", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  //  osveži kada se promene myHalls
  useEffect(() => {
    fetchAvailabilities("all");
  }, [myHalls]);

  return (
    <Card>
      <Card.Body>
        <div className="mb-4">
          <h4>Lista Dostupnosti</h4>
          <p className="text-muted mb-0">Pregled dostupnosti za vaše hale</p>
        </div>

        {/* Hall Selection - SAMO OWNEROVE HALE */}
        <Form.Group className="mb-4">
          <Form.Label>
            <strong>Odaberi halu:</strong>
          </Form.Label>
          <Form.Select value={selectedHall} onChange={handleHallChange}>
            <option value="all">-- Sve moje hale --</option>
            {myHalls.map((hall) => (
              <option key={hall.id} value={hall.id}>
                {hall.name}
              </option>
            ))}
          </Form.Select>
          <Form.Text className="text-muted">
            Prikazane su samo dostupnosti za vaše hale.
          </Form.Text>
        </Form.Group>

        {loading && (
          <div className="text-center">
            <Spinner animation="border" role="status" className="me-2" />
            Učitavanje...
          </div>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        {!loading && !error && availabilities.length === 0 && (
          <Alert variant="info">
            {selectedHall === "all"
              ? "Nema dostupnosti za vaše hale."
              : "Nema dostupnosti za izabranu halu."}
          </Alert>
        )}

        {/* Availability Table */}
        {!loading && availabilities.length > 0 && (
          <>
            <Table responsive striped hover className="align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Datum</th>
                  <th>Početak</th>
                  <th>Kraj</th>
                  <th>Hala</th>
                  <th>Akcije</th>
                </tr>
              </thead>
              <tbody>
                {availabilities.map((avail) => (
                  <tr key={avail.id}>
                    <td>
                      <strong className="text-primary">
                        {formatDate(avail.start)}
                      </strong>
                    </td>
                    <td>
                      <Badge bg="success" className="fs-6 p-2">
                        {formatTime(avail.start)}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg="danger" className="fs-6 p-2">
                        {formatTime(avail.end)}
                      </Badge>
                    </td>
                    <td>
                      <span className="fw-semibold text-secondary">
                        {avail.hall_name}
                      </span>
                    </td>
                    <td>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(avail.id)}
                        className="fw-bold"
                      >
                        Obriši
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="mt-3">
              <Badge bg="secondary" className="fs-6 p-2">
                Ukupno dostupnosti: {availabilities.length}
              </Badge>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}
