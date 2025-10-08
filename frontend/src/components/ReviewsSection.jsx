import React, { useState, useEffect } from 'react';
import { Card, Badge, Row, Col, Spinner, Alert, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess, showApiError } from '../utils/sweetAlert';

const ReviewsSection = ({ hallId, hallName }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewableAppointments, setReviewableAppointments] = useState([]);

  useEffect(() => {
    fetchReviews();
    if (user) {
      fetchReviewableAppointments();
    }
  }, [hallId, user]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/halls/${hallId}/reviews/`);
      setReviews(res.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Greška pri učitavanju ocena');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewableAppointments = async () => {
    try {
      const res = await api.get('/reviewable-appointments/');
      // Filtriraj samo rezervacije za ovu halu
      const appointmentsForThisHall = res.data.filter(app => app.hall == hallId);
      setReviewableAppointments(appointmentsForThisHall);
    } catch (err) {
      console.error('Error fetching reviewable appointments:', err);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewableAppointments.length === 0) return;

    setSubmitting(true);
    try {
      // Koristimo prvu rezervaciju koja čeka ocenu
      const appointment = reviewableAppointments[0];
      await api.post('/reviews/create/', {
        hall: hallId,
        appointment: appointment.id,
        rating: rating,
        comment: comment
      });

      await showSuccess('Hvala Vam! Vaša ocena je uspešno sačuvana.');
      setComment('');
      setRating(5);
      // Osveži listu ocena
      fetchReviews();
      fetchReviewableAppointments();
    } catch (err) {
      console.error('Error submitting review:', err);
      showApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Izračunaj prosečnu ocenu
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <Card className="mt-4">
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" className="me-2" />
          <small>Učitavanje ocena...</small>
        </Card.Body>
      </Card>
    );
  }

  const canReview = user && reviewableAppointments.length > 0;

  return (
    <Card className="mt-4">
      <Card.Header className="d-flex justify-content-between align-items-center py-2">
        <div>
          <h6 className="mb-0">⭐ {hallName}</h6>
          <small className="text-muted">Ocene i utisci ({reviews.length})</small>
        </div>
        {reviews.length > 0 && (
          <div className="text-end">
            <div className="text-warning small">
              {renderStars(Math.round(averageRating))}
            </div>
            <small className="text-muted">
              Prosečno: {averageRating.toFixed(1)}/5
            </small>
          </div>
        )}
      </Card.Header>
      <Card.Body className="py-3">
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        
        {/* FORMA ZA OCENJIVANJE - prikazuje se samo ako korisnik može da oceni */}
        {canReview && (
          <div className="mb-4 p-3 border rounded bg-light">
            <h6 className="mb-3">Ostavite vašu ocenu</h6>
            <Form onSubmit={handleSubmitReview}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Ocena (1-5 zvezdica):</Form.Label>
                <div className="d-flex gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type="button"
                      variant={rating >= star ? 'warning' : 'outline-warning'}
                      className="flex-fill"
                      onClick={() => setRating(star)}
                      style={{ 
                        height: '45px',
                        fontSize: '1.1rem'
                      }}
                      disabled={submitting}
                    >
                      {star} ⭐
                    </Button>
                  ))}
                </div>
                <Form.Text className="text-muted">
                  {rating === 1 && '❌ Veoma loše'}
                  {rating === 2 && '👎 Loše'}
                  {rating === 3 && '😐 Prosečno'}
                  {rating === 4 && '👍 Dobro'}
                  {rating === 5 && '💯 Odlično'}
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Komentar (opciono):</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Podelite vaše iskustvo sa halom..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                />
                <Form.Text className="text-muted">
                  {comment.length}/500 karaktera
                </Form.Text>
              </Form.Group>

              <Button 
                variant="primary" 
                type="submit" 
                disabled={submitting}
                className="px-4"
              >
                {submitting ? 'Slanje...' : 'Pošalji ocenu'}
              </Button>
            </Form>
          </div>
        )}

        {!canReview && user && (
          <div className="mb-3 p-2 border rounded bg-light">
            <small className="text-muted">
              {reviewableAppointments.length === 0 
                ? "Nemate odobrenih rezervacija za ocenjivanje ove hale."
                : "Možete ostaviti ocenu nakon odobrene rezervacije."
              }
            </small>
          </div>
        )}
        
        {/* LISTA OCENA - jedan ispod drugog */}
        {reviews.length === 0 ? (
          <div className="text-center text-muted py-3">
            <p className="small mb-1">Ova hala još uvek nema ocena.</p>
            <small>Budite prvi koji će oceniti ovu halu!</small>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="border-bottom pb-3 mb-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-1">
                      <strong className="text-primary me-2">
                        {review.user_full_name || review.user}
                      </strong>
                      <div className="text-warning">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mb-0 mt-2" style={{ lineHeight: '1.4' }}>
                        "{review.comment}"
                      </p>
                    )}
                  </div>
                  <small className="text-muted text-nowrap ms-2">
                    {new Date(review.created_at).toLocaleDateString('sr-RS')}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Link ka svim ocenama ako ih ima puno */}
        {reviews.length > 5 && (
          <div className="text-center mt-3">
            <Button 
              as={Link} 
              to={`/halls/${hallId}#reviews`} 
              variant="outline-primary" 
              size="sm"
            >
              Pogledaj sve ocene ({reviews.length})
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ReviewsSection;