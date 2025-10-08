import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

const UserReviews = () => {
  const { user } = useAuth();
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const fetchMyReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/my-reviews/');
      setMyReviews(res.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Greška pri učitavanju ocena');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Učitavanje ocena...</p>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <div className="text-center mb-4">
        <h1 className="fw-bold h4">📝 Moje Ocene</h1>
        <p className="text-muted small">Pregledajte ocene koje ste ostavili</p>
        <Badge bg="primary" className="total-badge">
          Ukupno: {myReviews.length}
        </Badge>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4 py-2 small">
          {error}
        </Alert>
      )}

      {myReviews.length === 0 ? (
        <Card className="text-center py-4">
          <Card.Body>
            <h5 className="text-muted">📭 Nemate ocena</h5>
            <p className="text-muted small">
              Još uvek niste ocenili nijednu halu.
            </p>
            <Button as={Link} to="/" variant="primary" size="sm" className="mt-2">
              🏟️ Pronađi Halu
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} className="g-3">
          {myReviews.map((review) => (
            <Col key={review.id}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="card-title mb-1">
                          🏟️ {review.hall_name || `Hala #${review.hall}`}
                        </h6>
                        <Badge bg="secondary" className="ms-2">
                          {new Date(review.created_at).toLocaleDateString('sr-RS')}
                        </Badge>
                      </div>
                      
                      <div className="text-warning h5 mb-2">
                        {renderStars(review.rating)}
                      </div>
                      
                      {review.comment && (
                        <div className="mb-2 p-2 bg-light rounded">
                          <p className="mb-0 small fst-italic">
                            "{review.comment}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Ostavljena: {new Date(review.created_at).toLocaleString('sr-RS')}
                    </small>
                    <Button 
                      as={Link} 
                      to={`/halls/${review.hall}`} 
                      variant="outline-primary" 
                      size="sm"
                    >
                      👁️ Pogledaj
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default UserReviews;