// frontend/src/pages/Halls.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_API_URL || "http://localhost:8000"}${path}`;
};

export default function Halls() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/halls/")
      .then((res) => setHalls(res.data))
      .catch((err) => console.error("Error fetching halls:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading halls...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "20px auto" }}>
      <h2>Available Halls</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {halls.map((hall) => {
          // prefer images[0], fallback to image
          const imgUrl = hall.images && hall.images.length > 0 ? hall.images[0].image || hall.images[0] : hall.image;
          const src = getFullUrl(imgUrl);
          return (
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
              {src ? (
                <img
                  src={src}
                  alt={hall.name}
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    borderRadius: "8px",
                  }}
                />
              ) : null}
              <p>{hall.address}</p>
              <p>{hall.description}</p>
              <p>Price: {hall.price}</p>
              <Link to={`/halls/${hall.id}`} target="_blank">View & Book</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
