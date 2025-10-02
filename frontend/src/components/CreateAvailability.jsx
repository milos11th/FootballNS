import React, { useState } from "react";
import axios from "axios";
import { showSuccess, showApiError } from "../utils/sweetAlert";

export default function CreateAvailability({ hallId }) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);

    const payload = {
      hall: hallId,
      start: start.toISOString(),
      end: end.toISOString(),
    };

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:8000/availabilities/create/",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await showSuccess("Dostupnost uspešno kreirana!");
      console.log(res.data);

      // Reset form
      setDate("");
      setStartTime("");
      setEndTime("");
    } catch (err) {
      console.error(err.response ? err.response.data : err);
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Kreiraj Dostupnost</h2>
      <label>
        Datum:
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>
      <br />
      <label>
        Vreme početka:
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
      </label>
      <br />
      <label>
        Vreme završetka:
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
      </label>
      <br />
      <button type="submit" disabled={loading}>
        {loading ? "Kreiranje..." : "Kreiraj Dostupnost"}
      </button>
    </form>
  );
}
