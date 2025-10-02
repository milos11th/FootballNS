import React, { useEffect, useState } from "react";
import api from "../api";
import { showSuccess, showApiError, showConfirm } from "../utils/sweetAlert";

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
      showApiError(err);
    }
  };

  const loadPending = async (hallId) => {
    setLoading(true);
    try {
      const res = await api.get(`/halls/${hallId}/pending/`);
      setAppointments((prev) => ({ ...prev, [hallId]: res.data }));
    } catch (err) {
      console.error(err);
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appointmentId, action, hallId) => {
    const actionText = action === "approve" ? "odobri" : "odbij";
    const result = await showConfirm(
      `${action === "approve" ? "Odobravanje" : "Odbijanje"} rezervacije`,
      `Da li ste sigurni da želite da ${actionText} ovu rezervaciju?`
    );

    if (!result.isConfirmed) return;

    try {
      await api.post(`/appointments/${appointmentId}/owner-action/`, {
        action,
      });
      await showSuccess(`Rezervacija uspešno ${actionText}ena!`);
      await loadPending(hallId); // refresh posle akcije
    } catch (err) {
      console.error(err);
      showApiError(err);
    }
  };

  return (
    <div>
      <h2>Rezervacije na čekanju</h2>
      {myHalls.length === 0 && <p>Nemaš nijednu halu.</p>}
      <ul>
        {myHalls.map((hall) => (
          <li key={hall.id} style={{ marginBottom: 20 }}>
            <strong>{hall.name}</strong>
            <div>
              <button onClick={() => loadPending(hall.id)}>
                Učitaj rezervacije na čekanju
              </button>
            </div>
            {loading && <p>Učitavanje...</p>}
            {appointments[hall.id] && appointments[hall.id].length === 0 && (
              <p>Nema rezervacija na čekanju.</p>
            )}
            {appointments[hall.id] &&
              appointments[hall.id].map((app) => (
                <div key={app.id} style={{ marginTop: 8 }}>
                  <p>
                    <strong>{app.user}</strong> —{" "}
                    {new Date(app.start).toLocaleString()} -{" "}
                    {new Date(app.end).toLocaleTimeString()}
                  </p>
                  <button
                    onClick={() => handleAction(app.id, "approve", hall.id)}
                    style={{ marginRight: 8 }}
                  >
                    Odobri
                  </button>
                  <button
                    onClick={() => handleAction(app.id, "reject", hall.id)}
                  >
                    Odbij
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
