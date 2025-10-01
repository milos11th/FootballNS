import React, { useState } from "react";
import axios from "axios";

export default function CreateAvailability({ hallId }) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);

    const payload = {
      hall: hallId,
      start: start.toISOString(),
      end: end.toISOString(),
    };

    try {
      const token = localStorage.getItem("token"); // pretpostavljamo da je owner ulogovan
      const res = await axios.post(
        "http://localhost:8000/availabilities/create/",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Availability created!");
      console.log(res.data);
    } catch (err) {
  console.error(err.response ? err.response.data : err);
  alert("Error creating availability. Pogledaj konzolu.");
}

  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Create Availability</h2>
      <label>
        Date:
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>
      <br />
      <label>
        Start Time:
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
      </label>
      <br />
      <label>
        End Time:
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
      </label>
      <br />
      <button type="submit">Create Availability</button>
    </form>
  );
}
