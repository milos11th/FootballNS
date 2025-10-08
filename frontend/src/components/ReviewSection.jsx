import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import api from '../api';
import ReviewForm from './ReviewForm';
import { showApiError } from '../utils/sweetAlert';

const ReviewSection = () => {
  const [reviewableAppointments, setReviewableAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviewableAppointments();
  }, []);

  const fetchReviewableAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reviewable-appointments/');
      setReviewableAppointments(res.data);
    } catch (err) {
      console.error('Error fetching reviewable appointments:', err);
      setError('Greška pri učitavanju podataka za ocenjivanje');
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewForm = (appointment) => {
    setSelectedAppointment(appointment);
    setShowReviewForm(true);
  };

  const handleReviewSubmitted = () => {
    fetchReviewableAppointments(); // Osveži listu nakon ocenjivanja
  };

  if (loading) {
    return (
      <Card className="mt-4">
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" className="me-2" />
          Učitavanje...
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="mt-4">
      {error && <Alert variant="danger">{error}</Alert>}

      {reviewableAppointments.length > 0 ? (
        <Card className="mb-4 border-warning">
          <Card.Header className="bg-warning text-dark">
            <h5 className="mb-0">⭐ Čeka se vaša ocena</h5>
          </Card.Header>
          <Card.Body>
            <p className="text-muted mb-3">
              Ocenite vaše iskustvo sa odobrenih rezervacija:
            </p>
            <Row>
              {reviewableAppointments.map((appointment) => (
                <Col md={6} key={appointment.id} className="mb-3">
                  <div className="border rounded p-3 d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{appointment.hall_name}</strong>
                      <div className="text-muted small">
                        {new Date(appointment.start).toLocaleDateString('sr-RS')} •{' '}
                        {new Date(appointment.start).toLocaleTimeString('sr-RS', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleOpenReviewForm(appointment)}
                    >
                      Oceni
                    </Button>
                  </div>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      ) : (
        <Card className="mb-4">
          <Card.Body className="text-center text-muted">
            <p>🎉 Nemate rezervacija koje čekaju ocenu!</p>
            <small>Sve vaše odobrene rezervacije su ocenjene.</small>
          </Card.Body>
        </Card>
      )}

      {/* Review Form Modal */}
      <ReviewForm
        show={showReviewForm}
        onHide={() => setShowReviewForm(false)}
        appointment={selectedAppointment}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
};

export default ReviewSection;