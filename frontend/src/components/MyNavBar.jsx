import React from "react";
import { Navbar, Nav, Container, Image } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function MyNavBar() {
  const { user } = useAuth();

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <Image
            src="/logo.png"
            alt="FootballTimes Logo"
            className="navbar-logo me-2"
          />
          FootballTimeNs
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/">
              Fudbalske Hale
            </Nav.Link>

            {!user && (
              <>
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  Register
                </Nav.Link>
              </>
            )}

            {user && (
              <>
                {/* Za regular usere - Moje Rezervacije */}
                {user.role === "player" && (
                  <Nav.Link as={Link} to="/my-appointments">
                    📋 Moje Rezervacije
                  </Nav.Link>
                )}

                {/* Za ownere - Kontrolna Tabla */}
                {user.role === "owner" && (
                  <Nav.Link as={Link} to="/owner">
                    Kontrolna Tabla
                  </Nav.Link>
                )}

                <Nav.Link as={Link} to="/logout">
                  Odjavi se
                </Nav.Link>

                <Nav.Item
                  style={{ color: "#fff", marginLeft: 12, alignSelf: "center" }}
                >
                  {user.username}
                </Nav.Item>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default MyNavBar;
