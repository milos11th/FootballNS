import React, { useEffect, useState } from "react";
import api from "../api";

function OwnerAvailability() {
  const [myHalls, setMyHalls] = useState([]);
  const [selectedHall, setSelectedHall] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    fetchMyHalls();
  }, []);

  const fetchMyHalls = async () => {
    try {
      const res = await api.get("/my-halls/");
      setMyHalls(res.data);
    } catch (err) {
      console.error("Greška kod dohvatanja mojih hala:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // timezone offset u ms
      const tzOffset = new Date().getTimezoneOffset() * 60000;

      const startUTC = new Date(`${date}T${startTime}:00`).getTime() - tzOffset;
      const endUTC = new Date(`${date}T${endTime}:00`).getTime() - tzOffset;

      await api.post("/availabilities/create/", {
        hall: selectedHall,
        start: new Date(startUTC).toISOString(),
        end: new Date(endUTC).toISOString(),
      });

      alert("Availability created!");
      setDate("");
      setStartTime("");
      setEndTime("");
    } catch (err) {
      console.error(err);
      alert("Greška pri kreiranju availability!");
    }
  };

  return (
    <div>
      <h2>Manage Availability</h2>
      {myHalls.length === 0 ? (
        <p>Nemaš nijednu halu.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            Choose Hall:
            <select
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
              required
            >
              <option value="">-- Select Hall --</option>
              {myHalls.map((hall) => (
                <option key={hall.id} value={hall.id}>
                  {hall.name}
                </option>
              ))}
            </select>
          </label>
          <br />
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
      )}
    </div>
  );
}

export default OwnerAvailability;
