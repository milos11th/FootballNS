// src/components/MyFooter.jsx
import React from "react";
import { Container, Row, Col } from "react-bootstrap";

function MyFooter() {
  return (
    <footer className="bg-dark text-light py-3 mt-auto">
      <Container>
        <Row>
          <Col className="text-center">
            &copy; {new Date().getFullYear()} FootballTimeNS. All rights reserved.
          </Col>
        </Row>
        <Row>
          <Col className="text-center">
            <small>
              Developed by Miloš Stanković
            </small>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default MyFooter;
