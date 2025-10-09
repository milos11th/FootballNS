import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Spinner,
  Alert,
  Table,
  Badge,
  ProgressBar,
} from "react-bootstrap";
import api from "../api";

export default function OwnerMonthlyReports() {
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [yearlyTotals, setYearlyTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const years = [2024, 2025, 2026];

  const fetchMonthlyStats = async (year) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/owner/monthly-stats/?year=${year}`);
      setMonthlyStats(response.data.monthly_stats);
      setYearlyTotals(response.data.yearly_totals);
    } catch (err) {
      console.error("Error fetching monthly stats:", err);
      setError("Greška pri učitavanju mesečnih izveštaja");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyStats(selectedYear);
  }, [selectedYear]);

  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  // FILTRIRAJ SAMO MESECE SA PODACIMA
  const getMonthsWithData = (data, dataKey) => {
    return data.filter((stat) => stat[dataKey] > 0);
  };

  const SimpleBarChart = ({ data, title, dataKey, color = "primary" }) => {
    // Koristi samo mesece sa podacima
    const filteredData = getMonthsWithData(data, dataKey);

    if (filteredData.length === 0) {
      return (
        <Card>
          <Card.Body className="text-center py-4">
            <h6 className="card-title">{title}</h6>
            <p className="text-muted mb-0">Nema podataka za prikaz</p>
          </Card.Body>
        </Card>
      );
    }

    return (
      <Card>
        <Card.Body>
          <h6 className="card-title">{title}</h6>
          <div className="simple-bars">
            {filteredData.map((stat, index) => {
              const maxValue =
                Math.max(...filteredData.map((s) => s[dataKey])) || 1;
              const percentage = (stat[dataKey] / maxValue) * 100;

              return (
                <div key={index} className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small className="fw-bold">{stat.month}</small>
                    <small className="text-muted">
                      {stat[dataKey].toLocaleString()}
                      {dataKey.includes("revenue") ? " RSD" : ""}
                    </small>
                  </div>
                  <ProgressBar
                    now={percentage}
                    variant={color}
                    style={{ height: "25px" }}
                    className="rounded"
                  />
                  <div className="d-flex justify-content-between mt-1">
                    <small className="text-muted">0</small>
                    <small className="text-muted">
                      {maxValue.toLocaleString()}
                      {dataKey.includes("revenue") ? " RSD" : ""}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>
    );
  };

  // FILTRIRAJ TABELU - samo meseci sa podacima
  const monthsWithData = monthlyStats.filter(
    (stat) =>
      stat.total_reservations > 0 ||
      stat.revenue > 0 ||
      stat.checked_in_reservations > 0
  );

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Učitavanje mesečnih izveštaja...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">📈 Mesečni Izveštaji</h4>
          <p className="text-muted mb-0">
            Analiza rezervacija i prihoda po mesecima
          </p>
        </div>
        <Form.Select
          style={{ width: "150px" }}
          value={selectedYear}
          onChange={(e) => handleYearChange(parseInt(e.target.value))}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}.
            </option>
          ))}
        </Form.Select>
      </div>

      {error && (
        <Alert variant="danger">
          <strong>Greška:</strong> {error}
        </Alert>
      )}

      {yearlyTotals && yearlyTotals.total_reservations > 0 && (
        <Row className="mb-4">
          <Col md={2}>
            <Card className="border-0 bg-primary bg-opacity-10">
              <Card.Body className="text-center py-3">
                <h5 className="text-primary mb-1">
                  {yearlyTotals.total_reservations}
                </h5>
                <small className="text-muted">Ukupno rezervacija</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 bg-success bg-opacity-10">
              <Card.Body className="text-center py-3">
                <h5 className="text-success mb-1">
                  {yearlyTotals.approved_reservations}
                </h5>
                <small className="text-muted">Odobrene</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 bg-info bg-opacity-10">
              <Card.Body className="text-center py-3">
                <h5 className="text-info mb-1">
                  {yearlyTotals.checked_in_reservations}
                </h5>
                <small className="text-muted">Check-in</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 bg-warning bg-opacity-10">
              <Card.Body className="text-center py-3">
                <h5 className="text-warning mb-1">
                  {Math.round(yearlyTotals.average_completion_rate || 0)}%
                </h5>
                <small className="text-muted">Uspešnost</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 bg-secondary bg-opacity-10">
              <Card.Body className="text-center py-3">
                <h5 className="text-secondary mb-1">
                  {Math.round(yearlyTotals.average_realization_rate || 0)}%
                </h5>
                <small className="text-muted">Realizacija</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 bg-dark bg-opacity-10">
              <Card.Body className="text-center py-3">
                <h5 className="text-dark mb-1">
                  {yearlyTotals.realized_revenue} RSD
                </h5>
                <small className="text-muted">Realizovano</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* GRAFIKONI - prikazuj samo ako ima podataka */}
      {monthsWithData.length > 0 ? (
        <Row className="mb-4">
          <Col md={4}>
            <SimpleBarChart
              data={monthlyStats}
              title="📊 Rezervacije po mesecima"
              dataKey="total_reservations"
              color="primary"
            />
          </Col>
          <Col md={4}>
            <SimpleBarChart
              data={monthlyStats}
              title="✅ Check-in po mesecima"
              dataKey="checked_in_reservations"
              color="info"
            />
          </Col>
          <Col md={4}>
            <SimpleBarChart
              data={monthlyStats}
              title="💰 Realizovani prihodi"
              dataKey="realized_revenue"
              color="success"
            />
          </Col>
        </Row>
      ) : (
        <Card className="mb-4">
          <Card.Body className="text-center py-5">
            <h5 className="text-muted">📊 Nema podataka za prikaz</h5>
            <p className="text-muted mb-0">
              Kada budete imali rezervacije, ovde će se pojaviti grafikoni.
            </p>
          </Card.Body>
        </Card>
      )}

      {/* TABELA - prikazuj samo ako ima podataka */}
      {monthsWithData.length > 0 ? (
        <Card>
          <Card.Body>
            <h6 className="card-title">📋 Detaljna mesečna statistika</h6>
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Mesec</th>
                    <th>Ukupno</th>
                    <th>Odobrene</th>
                    <th>Check-in</th>
                    <th>Prihodi</th>
                    <th>Realizovano</th>
                    <th>Uspešnost</th>
                    <th>Realizacija</th>
                    <th>Najpopularnija hala</th>
                  </tr>
                </thead>
                <tbody>
                  {monthsWithData.map((stat, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{stat.month}</strong>
                      </td>
                      <td>{stat.total_reservations}</td>
                      <td>
                        <Badge bg="success">{stat.approved_reservations}</Badge>
                      </td>
                      <td>
                        <Badge bg="info">{stat.checked_in_reservations}</Badge>
                      </td>
                      <td>
                        <strong>{stat.revenue.toLocaleString()} RSD</strong>
                      </td>
                      <td>
                        <strong className="text-success">
                          {stat.realized_revenue.toLocaleString()} RSD
                        </strong>
                      </td>
                      <td>
                        <Badge
                          bg={
                            stat.completion_rate > 70
                              ? "success"
                              : stat.completion_rate > 40
                              ? "warning"
                              : "danger"
                          }
                        >
                          {Math.round(stat.completion_rate)}%
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          bg={
                            stat.realization_rate > 80
                              ? "success"
                              : stat.realization_rate > 60
                              ? "warning"
                              : "danger"
                          }
                        >
                          {stat.realization_rate}%
                        </Badge>
                      </td>
                      <td>
                        <small className="text-muted">
                          {stat.most_popular_hall}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      ) : yearlyTotals && yearlyTotals.total_reservations === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <h5 className="text-muted">
              📭 Nema rezervacija za {selectedYear}. godinu
            </h5>
            <p className="text-muted mb-3">
              Kada budete imali rezervacije, ovde će se pojaviti statistika.
            </p>
            <div className="text-muted small">
              <strong>Savet:</strong> Dodajte availability za vaše hale kako bi
              korisnici mogli da rezervišu termine.
            </div>
          </Card.Body>
        </Card>
      ) : null}

      <div className="text-center mt-4">
        <button
          className="btn btn-outline-primary"
          onClick={() => fetchMonthlyStats(selectedYear)}
        >
          🔄 Osveži Izveštaje
        </button>
      </div>
    </div>
  );
}
