// frontend/src/pages/Halls.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Halls() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/halls/") // backend endpoint
      .then((res) => setHalls(res.data))
      .catch((err) => console.error("Error fetching halls:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading halls...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "20px auto" }}>
      <h2>Available Halls</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {halls.map((hall) => (
          <li
            key={hall.id}
            style={{
              border: "1px solid #ddd",
              padding: 12,
              marginBottom: 12,
              borderRadius: 8,
            }}
          >
            <h3>{hall.name}</h3>
            {hall.image && (
              <img
                src={
                  hall.image
                    ? `http://127.0.0.1:8000${hall.image}`
                    : "/placeholder.jpg"
                }
                alt={hall.name}
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  borderRadius: "8px",
                }}
              />
            )}
            <p>{hall.address}</p>
            <p>{hall.description}</p>
            <p>Price: {hall.price}</p>
            <Link to={`/halls/${hall.id}`}>View & Book</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
