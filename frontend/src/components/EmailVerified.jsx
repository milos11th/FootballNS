import React from "react";
import { Container, Card, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function EmailVerified() {
  return (
    <Container className="mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <Card className="shadow">
            <Card.Body className="text-center p-5">
              <div className="mb-4">
                <div style={{ fontSize: "4rem", color: "#28a745" }}>✅</div>
              </div>

              <h2 className="mb-3">Email Uspešno Verifikovan!</h2>

              <Alert variant="success" className="mb-4">
                <strong>Čestitamo!</strong> Vaš email je uspešno verifikovan.
                Sada možete da se prijavite na svoj nalog.
              </Alert>

              <div className="d-grid gap-2">
                <Link to="/login" className="btn btn-primary btn-lg">
                  🚀 Prijavi se
                </Link>
                <Link to="/" className="btn btn-outline-secondary">
                  🏠 Početna strana
                </Link>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
}
