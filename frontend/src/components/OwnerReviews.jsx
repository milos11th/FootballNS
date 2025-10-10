import React, { useState, useEffect } from "react";
import { Card, Badge, Alert, Spinner, Button, Row, Col } from "react-bootstrap";
import api from "../api";

export default function OwnerReviews({ myHalls, onReviewsSeen }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get("/owner/reviews/");
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error("Greška pri učitavanju recenzija:", err);
      setError("Greška pri učitavanju recenzija");
    } finally {
      setLoading(false);
    }
  };

  // Pozovi onReviewsSeen kada se komponenta mount-uje
  useEffect(() => {
    if (onReviewsSeen) {
      onReviewsSeen();
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status" className="me-2" />
        Učitavanje recenzija...
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>⭐ Recenzije mojih hala</h4>
        <Button variant="outline-primary" onClick={fetchReviews}>
          Osveži
        </Button>
      </div>

      {reviews.length === 0 ? (
        <Alert variant="info">Trenutno nema recenzija za vaše hale</Alert>
      ) : (
        <Row>
          {reviews.map((review) => (
            <Col md={6} lg={4} key={review.id} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="mb-1">
                        <strong>{review.user_full_name}</strong>
                      </h6>
                      <Badge bg="warning" text="dark" className="mb-2">
                        {review.rating} ⭐
                      </Badge>
                    </div>
                    <small className="text-muted text-end">
                      {new Date(review.created_at).toLocaleDateString("sr-RS")}
                    </small>
                  </div>

                  <p className="mb-1">
                    <strong>Hala:</strong> {review.hall_name}
                  </p>

                  <div className="text-warning mb-2">
                    {renderStars(review.rating)}
                  </div>

                  {review.comment && (
                    <div className="p-2 bg-light rounded">
                      <p className="mb-0 small">"{review.comment}"</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
