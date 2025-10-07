import React, { useState } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import api from "../api";
import { showSuccess, showError } from "../utils/sweetAlert";
import "../styles/Form.css";

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    old_password: "",
    new_password: "",
    new_password2: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    console.log("🔄 Sending change password request...");
    console.log(
      "📧 Current user from localStorage:",
      localStorage.getItem("user")
    );
    console.log("🔑 Token exists:", !!localStorage.getItem("access_token"));

    try {
      const response = await api.post("/change-password/", formData);
      console.log("✅ Password change successful:", response.data);
      await showSuccess("Šifra je uspešno promenjena!");

      setFormData({
        old_password: "",
        new_password: "",
        new_password2: "",
      });
    } catch (error) {
      console.log("❌ Password change error:", error);
      console.log("🔍 Error response:", error.response);

      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        await showError("Došlo je do greške pri promeni šifre.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>🔐 Promena Šifre</h1>

      <input
        className="form-input"
        type="password"
        name="old_password"
        value={formData.old_password}
        onChange={handleChange}
        placeholder="Trenutna šifra"
        required
      />
      {errors.old_password && (
        <div className="error-message">{errors.old_password}</div>
      )}

      <input
        className="form-input"
        type="password"
        name="new_password"
        value={formData.new_password}
        onChange={handleChange}
        placeholder="Nova šifra (min 6 karaktera)"
        required
      />
      {errors.new_password && (
        <div className="error-message">{errors.new_password}</div>
      )}

      <input
        className="form-input"
        type="password"
        name="new_password2"
        value={formData.new_password2}
        onChange={handleChange}
        placeholder="Potvrdite novu šifru"
        required
      />

      <button className="form-button" type="submit" disabled={loading}>
        {loading ? "Promena šifre..." : "Promeni šifru"}
      </button>

      {errors.non_field_errors && (
        <div className="error-message">
          {errors.non_field_errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
    </form>
  );
}
