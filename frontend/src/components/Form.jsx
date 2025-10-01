// src/components/Form.jsx
import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import "../styles/Form.css";
import { useAuth } from "../contexts/AuthContext";

function Form({ route, method }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const name = method === "login" ? "Login" : "Register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors(null);

    try {
      let payload;
      if (method === "login") {
        payload = { username, password };
      } else {
        payload = {
          username,
          password,
          password2,
          email,
          first_name: firstName,
          last_name: lastName,
        };
      }

      const res = await api.post(route, payload);

      if (method === "login") {
        // backend returns { access, refresh }
        const u = await login({ access: res.data.access, refresh: res.data.refresh });

        // redirect according to role (if loadMe succeeded)
        if (u && u.role === "owner") {
          navigate("/owner", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        alert("Registration successful. Please log in.");
        navigate("/login", { replace: true });
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ non_field_errors: ["Server error or network error"] });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderErrors = () => {
    if (!errors) return null;
    return (
      <div className="form-errors">
        {Object.entries(errors).map(([key, val]) => (
          <div key={key}>
            <strong>{key}:</strong> {Array.isArray(val) ? val.join(" ") : String(val)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>{name}</h1>
      {renderErrors()}

      <input className="form-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
      <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />

      {method !== "login" && (
        <>
          <input className="form-input" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="Confirm password" required />
          <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" />
          <input className="form-input" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name (optional)" />
          <input className="form-input" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name (optional)" />
        </>
      )}

      <button className="form-button" type="submit" disabled={loading}>{loading ? "Loading..." : name}</button>
    </form>
  );
}

export default Form;
