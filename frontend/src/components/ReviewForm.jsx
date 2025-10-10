import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Row, Col, Alert } from "react-bootstrap";
import api from "../api";
import { showSuccess, showApiError } from "../utils/sweetAlert";

const ReviewForm = ({ show, onHide, appointment, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showComment, setShowComment] = useState(false);

  useEffect(() => {
    if (show) {
      setRating(5);
      setComment("");
      setError("");
      setShowComment(false);
    }
  }, [show, appointment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!appointment) return;

    setLoading(true);
    setError("");

    try {
      await api.post("/reviews/create/", {
        hall: appointment.hall,
        appointment: appointment.id,
        rating: rating,
        comment: comment,
      });

      await showSuccess("Hvala Vam! Vaša ocena je uspešno sačuvana.");
      onReviewSubmitted();
      onHide();
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(err.response?.data?.detail || "Greška pri slanju ocene");
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSubmit = async (quickRating) => {
    if (!appointment) return;

    setLoading(true);
    try {
      await api.post("/reviews/create/", {
        hall: appointment.hall,
        appointment: appointment.id,
        rating: quickRating,
        comment: "", // Bez komentara za brzo ocenjivanje
      });

      await showSuccess("Hvala Vam! Vaša ocena je uspešno sačuvana.");
      onReviewSubmitted();
      onHide();
    } catch (err) {
      console.error("Error submitting review:", err);
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header closeButton className="pb-2">
        <Modal.Title className="fs-6">Ocenite vaše iskustvo</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="pt-0">
          {error && (
            <Alert variant="danger" className="py-2">
              {error}
            </Alert>
          )}

          <div className="mb-3">
            <p className="mb-1 small">
              <strong>Hala:</strong> {appointment.hall_name}
            </p>
            <p className="mb-0 small text-muted">
              {new Date(appointment.start).toLocaleDateString("sr-RS")} •{" "}
              {new Date(appointment.start).toLocaleTimeString("sr-RS", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Ocena:</Form.Label>
            <div className="d-flex justify-content-between">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  type="button"
                  variant={rating >= star ? "warning" : "outline-warning"}
                  className="d-flex flex-column align-items-center"
                  onClick={() => setRating(star)}
                  style={{
                    width: "50px",
                    height: "50px",
                    fontSize: "0.8rem",
                    padding: "5px",
                  }}
                  disabled={loading}
                >
                  <span style={{ fontSize: "1.2rem" }}>{star}</span>
                  <span>⭐</span>
                </Button>
              ))}
            </div>
            <Form.Text className="small text-muted text-center d-block mt-1">
              {rating === 1 && "❌ Veoma loše"}
              {rating === 2 && "👎 Loše"}
              {rating === 3 && "😐 Prosečno"}
              {rating === 4 && "👍 Dobro"}
              {rating === 5 && "💯 Odlično"}
            </Form.Text>
          </Form.Group>

          {!showComment ? (
            <div className="text-center mb-2">
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowComment(true)}
                className="text-decoration-none"
              >
                💬 Dodaj komentar
              </Button>
            </div>
          ) : (
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">
                Komentar (opciono):
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Podelite vaše iskustvo..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={200}
                className="small"
              />
              <Form.Text className="small text-muted">
                {comment.length}/200 karaktera
              </Form.Text>
            </Form.Group>
          )}

          <div className="d-flex gap-2 justify-content-center mb-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => handleQuickSubmit(5)}
              disabled={loading}
              className="flex-fill"
            >
              👍 Odlično
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => handleQuickSubmit(3)}
              disabled={loading}
              className="flex-fill"
            >
              😐 Prosečno
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="pt-0">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onHide}
            disabled={loading}
          >
            Odustani
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={loading}>
            {loading ? "Slanje..." : "Pošalji"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ReviewForm;
