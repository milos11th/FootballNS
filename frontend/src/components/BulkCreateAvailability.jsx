import React, { useState } from "react";
import { Form, Button, Card, Row, Col, Alert, Badge } from "react-bootstrap";
import api from "../api";
import { showSuccess, showApiError } from "../utils/sweetAlert";

export default function BulkCreateAvailability({
  hallId,
  hallName,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    start_time: "08:00",
    end_time: "22:00",
    days_of_week: [1, 2, 3, 4, 5],
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const daysOfWeek = [
    { id: 0, name: "Nedelja", short: "N", type: "vikend" },
    { id: 1, name: "Ponedeljak", short: "P", type: "radni" },
    { id: 2, name: "Utorak", short: "U", type: "radni" },
    { id: 3, name: "Sreda", short: "S", type: "radni" },
    { id: 4, name: "Četvrtak", short: "Č", type: "radni" },
    { id: 5, name: "Petak", short: "P", type: "radni" },
    { id: 6, name: "Subota", short: "S", type: "vikend" },
  ];

  const convertDaysToBackend = (jsDays) => {
    const mapping = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
    return jsDays.map((jsDay) => mapping[jsDay]);
  };

  const handleDayToggle = (dayId) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(dayId)
        ? prev.days_of_week.filter((d) => d !== dayId)
        : [...prev.days_of_week, dayId],
    }));
  };

  const calculateTotalDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return diffDays;
  };

  const calculateDaysToCreate = () => {
    if (!formData.start_date || !formData.end_date) return 0;

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    let daysToCreate = 0;

    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      if (formData.days_of_week.includes(dayOfWeek)) {
        daysToCreate++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return daysToCreate;
  };

  const getDaysToCreateList = () => {
    if (!formData.start_date || !formData.end_date) return [];

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const daysList = [];

    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayOfWeek = currentDate.getDay();
      const dayName = daysOfWeek.find((d) => d.id === dayOfWeek)?.name;
      const willCreate = formData.days_of_week.includes(dayOfWeek);

      daysList.push({
        date: dateStr,
        dayName,
        dayOfWeek,
        willCreate,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return daysList;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    if (!hallId) {
      showApiError(new Error("Morate odabrati halu prvo"));
      setLoading(false);
      return;
    }

    const backendDays = convertDaysToBackend(formData.days_of_week);

    const payload = {
      hall: parseInt(hallId),
      start_date: formData.start_date,
      end_date: formData.end_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      days_of_week: backendDays,
    };

    try {
      const response = await api.post("/availabilities/bulk-create/", payload);
      console.log("Bulk create response:", response.data);

      if (response.data.total_created > 0) {
        await showSuccess(
          `Uspešno kreirano ${response.data.total_created} termina!`
        );
      }

      setResult(response.data);

      if (onSuccess && response.data.total_created > 0) {
        onSuccess();
      }

      if (response.data.errors && response.data.errors.length === 0) {
        setFormData({
          start_date: "",
          end_date: "",
          start_time: "08:00",
          end_time: "22:00",
          days_of_week: [1, 2, 3, 4, 5],
        });
      }
    } catch (err) {
      console.error("Bulk create error:", err);
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const totalDays = calculateTotalDays();
  const daysToCreate = calculateDaysToCreate();
  const daysList = getDaysToCreateList();

  if (!hallId) {
    return (
      <Card className="mt-4">
        <Card.Body className="text-center">
          <Alert variant="warning">
            <strong>⚠️ Odaberite halu prvo</strong>
            <br />
            Molimo vas da odaberete halu iz padajuće liste iznad pre nego što
            kreirate dostupnost.
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <Card.Header className="bg-success text-white">
        <h5 className="mb-0">📅 Kreiranje radnog vremena za više dana</h5>
        <small>
          Hala: <strong>{hallName}</strong>
        </small>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Početni datum *</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Završni datum *</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      end_date: e.target.value,
                    }))
                  }
                  required
                  min={formData.start_date}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Vreme početka *</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      start_time: e.target.value,
                    }))
                  }
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Vreme završetka *</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      end_time: e.target.value,
                    }))
                  }
                  required
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Label>
                <strong>Dani u nedelji *</strong>
              </Form.Label>

              <div className="d-flex flex-wrap gap-2 mb-2">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day.id}
                    variant={
                      formData.days_of_week.includes(day.id)
                        ? "primary"
                        : "outline-primary"
                    }
                    size="sm"
                    type="button"
                    onClick={() => handleDayToggle(day.id)}
                    style={{ minWidth: "100px" }}
                    className={day.type === "vikend" ? "border-warning" : ""}
                  >
                    {day.name}
                  </Button>
                ))}
              </div>

              <div className="d-flex flex-wrap gap-2 mt-2">
                <Button
                  variant={
                    formData.days_of_week.length === 5 &&
                    formData.days_of_week.every((d) =>
                      [1, 2, 3, 4, 5].includes(d)
                    )
                      ? "primary"
                      : "outline-primary"
                  }
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      days_of_week: [1, 2, 3, 4, 5],
                    }))
                  }
                >
                  Samo radni dani
                </Button>
                <Button
                  variant={
                    formData.days_of_week.length === 2 &&
                    formData.days_of_week.every((d) => [0, 6].includes(d))
                      ? "primary"
                      : "outline-primary"
                  }
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, days_of_week: [0, 6] }))
                  }
                >
                  Samo vikendi
                </Button>
                <Button
                  variant={
                    formData.days_of_week.length === 7
                      ? "primary"
                      : "outline-primary"
                  }
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      days_of_week: [0, 1, 2, 3, 4, 5, 6],
                    }))
                  }
                >
                  Svi dani
                </Button>
              </div>

              <Form.Text className="text-muted">
                Trenutno izabrano:{" "}
                <strong>{formData.days_of_week.length}</strong> dana •
                {formData.days_of_week
                  .map((dayId) => {
                    const day = daysOfWeek.find((d) => d.id === dayId);
                    return ` ${day?.name}`;
                  })
                  .join(", ")}
              </Form.Text>
            </Col>
          </Row>

          {formData.start_date && formData.end_date && (
            <Alert variant="info" className="mt-3">
              <strong>📊 Detaljan Pregled Kreiranja:</strong>
              <br />
              <span>
                • Period: <strong>{formData.start_date}</strong> do{" "}
                <strong>{formData.end_date}</strong>
              </span>
              <br />
              <span>
                • Ukupno dana u periodu: <strong>{totalDays}</strong>
              </span>
              <br />
              <span>
                • Prema filteru: <strong>{daysToCreate} dana</strong> će biti
                kreirano
              </span>
              <br />
              <span>
                • Vreme:{" "}
                <strong>
                  {formData.start_time} - {formData.end_time}
                </strong>
              </span>

              <div className="mt-2">
                <strong>Dani koji će biti kreirani:</strong>
                <div className="small mt-1">
                  {daysList.map((day) => (
                    <div
                      key={day.date}
                      className={day.willCreate ? "text-success" : "text-muted"}
                    >
                      {day.willCreate ? "✅" : "❌"} {day.date} ({day.dayName} -
                      {day.dayOfWeek})
                    </div>
                  ))}
                </div>
              </div>
            </Alert>
          )}

          <div className="d-grid gap-2 mt-3">
            <Button
              variant="success"
              type="submit"
              disabled={
                loading ||
                !formData.start_date ||
                !formData.end_date ||
                formData.days_of_week.length === 0
              }
              size="lg"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Kreiranje {daysToCreate} termina...
                </>
              ) : (
                ` Kreiraj radno vreme za vise dana(${daysToCreate} termina)`
              )}
            </Button>
          </div>
        </Form>

        {result && (
          <Alert
            variant={result.total_created > 0 ? "success" : "warning"}
            className="mt-3"
          >
            <strong>📋 Rezultat:</strong>
            <br />
            <span>
              • Uspešno kreirano:{" "}
              <Badge bg="success">{result.total_created}</Badge> termina
            </span>
            <br />
            {result.total_days_in_range && (
              <span>
                • Dana u periodu:{" "}
                <Badge bg="info">{result.total_days_in_range}</Badge>
              </span>
            )}
            {result.selected_days_count && (
              <span>
                • Odabranih dana:{" "}
                <Badge bg="info">{result.selected_days_count}</Badge>
              </span>
            )}
            {result.errors && result.errors.length > 0 && (
              <>
                <span>
                  • Greške: <Badge bg="danger">{result.errors.length}</Badge>
                </span>
                <ul className="mt-2 mb-0 small">
                  {result.errors.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>... i još {result.errors.length - 5} grešaka</li>
                  )}
                </ul>
              </>
            )}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
}
