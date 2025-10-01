import React, { useEffect, useState } from "react";
import api from "../api";

function OwnerAppointments() {
  const [myHalls, setMyHalls] = useState([]);
  const [appointments, setAppointments] = useState({});
  const [loading, setLoading] = useState(false);

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

  const loadPending = async (hallId) => {
    setLoading(true);
    try {
      const res = await api.get(`/halls/${hallId}/pending/`);
      setAppointments((prev) => ({ ...prev, [hallId]: res.data }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appointmentId, action, hallId) => {
    try {
      await api.post(`/appointments/${appointmentId}/owner-action/`, { action });
      await loadPending(hallId); // refresh posle akcije
      alert(`Appointment ${action}ed`);
    } catch (err) {
      console.error(err);
      alert("Greška kod obrade zahteva.");
    }
  };

  return (
    <div>
      <h2>Pending Appointments</h2>
      {myHalls.length === 0 && <p>Nemaš nijednu halu.</p>}
      <ul>
        {myHalls.map((hall) => (
          <li key={hall.id} style={{ marginBottom: 20 }}>
            <strong>{hall.name}</strong>
            <div>
              <button onClick={() => loadPending(hall.id)}>Load pending</button>
            </div>
            {loading && <p>Učitavanje...</p>}
            {appointments[hall.id] && appointments[hall.id].length === 0 && (
              <p>Nema pending zahteva.</p>
            )}
            {appointments[hall.id] &&
              appointments[hall.id].map((app) => (
                <div key={app.id} style={{ marginTop: 8 }}>
                  <p>
                    <strong>{app.user}</strong> — {new Date(app.start).toLocaleString()} -{" "}
                    {new Date(app.end).toLocaleTimeString()}
                  </p>
                  <button
                    onClick={() => handleAction(app.id, "approve", hall.id)}
                    style={{ marginRight: 8 }}
                  >
                    Approve
                  </button>
                  <button onClick={() => handleAction(app.id, "reject", hall.id)}>
                    Reject
                  </button>
                </div>
              ))}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OwnerAppointments;
