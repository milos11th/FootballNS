
import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function MyNavBar() {
  const { user } = useAuth();

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          FootballTimeNs
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/">
              Halls
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
                <Nav.Link as={Link} to="/logout">Logout</Nav.Link>

                {/* If user is owner, show dashboard link */}
                {user.role === "owner" && (
                  <Nav.Link as={Link} to="/owner">Owner Dashboard</Nav.Link>
                )}

             
                <Nav.Item style={{ color: "#fff", marginLeft: 12, alignSelf: "center" }}>
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
