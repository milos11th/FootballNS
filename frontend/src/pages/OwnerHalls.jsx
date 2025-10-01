import React, { useEffect, useState } from "react";
import api from "../api";

function OwnerHalls() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    price: "",
    description: ""
  });
  const [editingHall, setEditingHall] = useState(null);

  // Fetch hale ownera
  const fetchHalls = async () => {
    try {
      setLoading(true);
      const res = await api.get("/my-halls/"); // backend vraća samo hale koje pripadaju ulogovanom owneru
      setHalls(res.data);
    } catch (err) {
      console.error("Greška prilikom dohvatanja hala:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHalls();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingHall) {
        // Edit hall
        await api.put(`/halls/${editingHall.id}/`, formData);
        setEditingHall(null);
      } else {
        // Create new hall
        await api.post("/halls/create/", formData);
      }
      setFormData({ name: "", address: "", price: "", description: "" });
      fetchHalls();
    } catch (err) {
      console.error("Greška prilikom čuvanja hale:", err);
      alert("Greška prilikom čuvanja hale!");
    }
  };

  const handleEdit = (hall) => {
    setEditingHall(hall);
    setFormData({
      name: hall.name,
      address: hall.address,
      price: hall.price,
      description: hall.description || ""
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Da li ste sigurni da želite da obrišete halu?")) return;
    try {
      await api.delete(`/halls/${id}/`);
      fetchHalls();
    } catch (err) {
      console.error("Greška prilikom brisanja hale:", err);
      alert("Greška prilikom brisanja hale!");
    }
  };

  return (
    <div>
      <h2>My Halls</h2>

      {/* Form za Create/Edit */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="price"
          placeholder="Price per hour"
          value={formData.price}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
        />
        <button type="submit">{editingHall ? "Save Changes" : "Create Hall"}</button>
        {editingHall && (
          <button type="button" onClick={() => setEditingHall(null)}>Cancel</button>
        )}
      </form>

      {/* Lista hala */}
      {loading ? (
        <p>Loading...</p>
      ) : halls.length === 0 ? (
        <p>Nemate kreiranih hala.</p>
      ) : (
        <ul>
          {halls.map((hall) => (
            <li key={hall.id}>
              <strong>{hall.name}</strong> - {hall.address} ({hall.price} RSD/h)
              <button onClick={() => handleEdit(hall)}>Edit</button>
              <button onClick={() => handleDelete(hall.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default OwnerHalls;
