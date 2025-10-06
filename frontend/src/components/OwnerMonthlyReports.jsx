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

  const SimpleBarChart = ({ data, title, dataKey, color = "primary" }) => (
    <Card>
      <Card.Body>
        <h6 className="card-title">{title}</h6>
        <div className="simple-bars">
          {data.map((stat, index) => {
            const maxValue = Math.max(...data.map((s) => s[dataKey])) || 1;
            const percentage = (stat[dataKey] / maxValue) * 100;

            return (
              <div key={index} className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="fw-bold">{stat.month}</small>
                  <small className="text-muted">
                    {stat[dataKey]}
                    {dataKey === "revenue" ? " RSD" : ""}
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
                    {maxValue}
                    {dataKey === "revenue" ? " RSD" : ""}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      </Card.Body>
    </Card>
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
          <div className="mt-2">
            <small>Proverite CORS settings u Django aplikaciji.</small>
          </div>
        </Alert>
      )}

      {yearlyTotals && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-0 bg-primary bg-opacity-10">
              <Card.Body className="text-center py-3">
                <h5 className="text-primary mb-1">
                  {yearlyTotals.total_reservations}
                </h5>
                <small className="text-muted">Ukupno rezervacija</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 bg-success bg-opacity-10">
              <Card.Body className="text-center py-3">
                <h5 className="text-success mb-1">
                  {yearlyTotals.approved_reservations}
                </h5>
                <small className="text-muted">Odobrene</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 bg-warning bg-opacity-10">
              <Card.Body className="text-center py-3">
                <h5 className="text-warning mb-1">
                  {Math.round(yearlyTotals.average_completion_rate)}%
                </h5>
                <small className="text-muted">Prosečna uspešnost</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 bg-info bg-opacity-10">
              <Card.Body className="text-center py-3">
                <h5 className="text-info mb-1">
                  {yearlyTotals.total_revenue} RSD
                </h5>
                <small className="text-muted">Ukupni prihodi</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {monthlyStats.length > 0 && (
        <Row className="mb-4">
          <Col md={6}>
            <SimpleBarChart
              data={monthlyStats}
              title="📊 Rezervacije po mesecima"
              dataKey="total_reservations"
              color="primary"
            />
          </Col>
          <Col md={6}>
            <SimpleBarChart
              data={monthlyStats}
              title="💰 Prihodi po mesecima"
              dataKey="revenue"
              color="success"
            />
          </Col>
        </Row>
      )}

      <Card>
        <Card.Body>
          <h6 className="card-title">📋 Detaljna mesečna statistika</h6>
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th>Mesec</th>
                  <th>Ukupno rezervacija</th>
                  <th>Odobrene</th>
                  <th>Na čekanju</th>
                  <th>Prihodi</th>
                  <th>Uspešnost</th>
                  <th>Najpopularnija hala</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map((stat, index) => (
                  <tr key={index}>
                    <td>
                      <strong>{stat.month}</strong>
                    </td>
                    <td>{stat.total_reservations}</td>
                    <td>
                      <Badge bg="success">{stat.approved_reservations}</Badge>
                    </td>
                    <td>
                      <Badge bg="warning">{stat.pending_reservations}</Badge>
                    </td>
                    <td>
                      <strong>{stat.revenue} RSD</strong>
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
