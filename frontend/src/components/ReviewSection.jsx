import React, { useState, useEffect } from "react";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import api from "../api";
import { showSuccess, showApiError } from "../utils/sweetAlert";

const ReviewSection = ({
  reviewableAppointments = [],
  onReviewAdded,
  hallId = null,
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [internalReviewableAppointments, setInternalReviewableAppointments] =
    useState([]);

  // Ako nisu prosleđeni reviewableAppointments, učitaj ih samostalno
  useEffect(() => {
    if (reviewableAppointments.length === 0) {
      fetchReviewableAppointments();
    }
  }, [reviewableAppointments, hallId]);

  const fetchReviewableAppointments = async () => {
    try {
      setLoading(true);
      let url = "/reviewable-appointments/";

      // Ako je prosleđen hallId, filtriraj samo za tu halu
      if (hallId) {
        url = `/reviewable-appointments/?hall=${hallId}`;
      }

      const response = await api.get(url);
      setInternalReviewableAppointments(response.data);
    } catch (err) {
      console.error("Error fetching reviewable appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  // Koristi prosleđene appointments ili interne
  const appointmentsToUse =
    reviewableAppointments.length > 0
      ? reviewableAppointments
      : internalReviewableAppointments;

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!selectedAppointment) {
      alert("Molimo odaberite rezervaciju za ocenjivanje");
      return;
    }

    setSubmitting(true);
    try {
      // Pronađi odabrani appointment da dobijemo hall_id
      const selectedApp = appointmentsToUse.find(
        (app) => app.id.toString() === selectedAppointment
      );

      if (!selectedApp) {
        throw new Error("Odabrana rezervacija nije pronađena");
      }

      const reviewData = {
        appointment: parseInt(selectedAppointment),
        hall: selectedApp.hall, // hall_id iz appointmenta
        rating: parseInt(rating),
        comment: comment.trim() || "",
      };

      console.log("📤 Šaljem recenziju:", reviewData);

      const response = await api.post("/reviews/create/", reviewData);

      console.log("✅ Odgovor od servera:", response.data);

      await showSuccess("Recenzija uspešno poslata!");

      // Reset forma
      setSelectedAppointment("");
      setRating(5);
      setComment("");

      // Obavesti parent komponentu da je dodata recenzija
      if (onReviewAdded) {
        onReviewAdded();
      } else {
        // Ako nema callback-a, osveži interne podatke
        fetchReviewableAppointments();
      }
    } catch (err) {
      console.error("❌ Error submitting review:", err);
      console.error("📊 Response data:", err.response?.data);

      // Prikaži specifičnu grešku korisniku
      if (err.response?.data) {
        const errorData = err.response.data;
        let errorMessage = "Došlo je do greške pri slanju recenzije";

        if (errorData.hall) {
          errorMessage = `Greška sa halom: ${errorData.hall.join(", ")}`;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors.join(", ");
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }

        alert(errorMessage);
      } else {
        showApiError(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAppDetails = appointmentsToUse.find(
    (app) => app.id.toString() === selectedAppointment
  );

  if (loading && appointmentsToUse.length === 0) {
    return (
      <Card className="mt-4">
        <Card.Body className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">
            Učitavanje rezervacija za ocenjivanje...
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <Card.Body>
        <h5 className="card-title">⭐ Ocenite Vaše Posete</h5>
        <p className="text-muted">
          Podelite svoje iskustvo sa drugim korisnicima
        </p>

        {appointmentsToUse.length === 0 ? (
          <Alert variant="info">
            <strong>ℹ️ Nema rezervacija za ocenjivanje</strong>
            <br />
            Možete oceniti samo termine na koje ste došli (check-in) i koje
            niste već ocenili.
          </Alert>
        ) : (
          <form onSubmit={handleSubmitReview}>
            <div className="mb-3">
              <Form.Label>
                <strong>Odaberite rezervaciju:</strong>
              </Form.Label>
              <Form.Select
                value={selectedAppointment}
                onChange={(e) => setSelectedAppointment(e.target.value)}
                required
              >
                <option value="">-- Izaberite termin --</option>
                {appointmentsToUse.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    🏟️ {appointment.hall_name} -{" "}
                    {new Date(appointment.start).toLocaleDateString("sr-RS")}{" "}
                    {new Date(appointment.start).toLocaleTimeString("sr-RS", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </option>
                ))}
              </Form.Select>
            </div>

            {selectedAppointment && selectedAppDetails && (
              <>
                {/* Prikaži detalje odabrane rezervacije */}
                <Alert variant="light" className="small">
                  <strong>Odabrana rezervacija:</strong>
                  <br />
                  Hala: <strong>{selectedAppDetails.hall_name}</strong>
                  <br />
                  Datum:{" "}
                  {new Date(selectedAppDetails.start).toLocaleDateString(
                    "sr-RS"
                  )}
                  <br />
                  Vreme:{" "}
                  {new Date(selectedAppDetails.start).toLocaleTimeString(
                    "sr-RS",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}{" "}
                  -{" "}
                  {new Date(selectedAppDetails.end).toLocaleTimeString(
                    "sr-RS",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </Alert>

                <div className="mb-3">
                  <Form.Label>
                    <strong>Ocena (1-5 zvezdica):</strong>
                  </Form.Label>
                  <div>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        variant={rating >= star ? "warning" : "outline-warning"}
                        onClick={() => setRating(star)}
                        type="button"
                        className="me-1"
                      >
                        {star} ⭐
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <Form.Label>
                    <strong>Komentar (opciono):</strong>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Podelite svoje iskustvo sa halom..."
                    maxLength={500}
                  />
                  <Form.Text className="text-muted">
                    {comment.length}/500 karaktera
                  </Form.Text>
                </div>

                <div className="d-grid">
                  <Button variant="success" type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Slanje...
                      </>
                    ) : (
                      "📝 Pošalji Recenziju"
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </Card.Body>
    </Card>
  );
};

export default ReviewSection;
