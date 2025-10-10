import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import "../styles/Form.css";
import { useAuth } from "../contexts/AuthContext";
import {
  showError,
  showApiError,
  showLoginError,
  showSuccess,
} from "../utils/sweetAlert";

function Form({ route, method, onSuccess, onError }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login } = useAuth();

  const name = method === "login" ? "Login" : "Register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (method === "register" && password !== password2) {
      setErrors({ password: ["Lozinke se ne poklapaju!"] });
      setLoading(false);
      return;
    }

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
        const u = await login({
          access: res.data.access,
          refresh: res.data.refresh,
        });

        if (u && u.role === "owner") {
          navigate("/owner", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        await showSuccess(
          "Prvi korak registracije je uspesan! 📧",
          "Proverite svoj email da biste verifikovali nalog. Link za verifikaciju je poslat na vašu email adresu.",
          6000
        );
        navigate("/login", { replace: true });
      }
    } catch (err) {
      console.error(err);

      if (method === "login") {
        await showLoginError(err);
      } else {
        if (err.response?.data) {
          setErrors(err.response.data);
          const globalErrors = err.response.data.non_field_errors;
          if (globalErrors && globalErrors.length > 0) {
            await showError(globalErrors.join("\n"));
          }
        } else {
          await showApiError(err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Funkcija za prikaz grešaka za određeno polje
  const renderFieldError = (fieldName) => {
    if (errors[fieldName]) {
      return (
        <div className="error-message">
          {Array.isArray(errors[fieldName])
            ? errors[fieldName].join(", ")
            : errors[fieldName]}
        </div>
      );
    }
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>{method === "login" ? "Prijava" : "Registracija"}</h1>

      <div className="input-group">
        <input
          className={`form-input ${errors.username ? "error" : ""}`}
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Korisničko ime"
          required
        />
        {renderFieldError("username")}
      </div>

      <div className="input-group">
        <input
          className={`form-input ${errors.password ? "error" : ""}`}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Lozinka"
          required
        />
        {renderFieldError("password")}
      </div>

      {method !== "login" && (
        <>
          <div className="input-group">
            <input
              className={`form-input ${errors.password2 ? "error" : ""}`}
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="Potvrdi lozinku"
              required
            />
            {renderFieldError("password2")}
          </div>

          <div className="input-group">
            <input
              className={`form-input ${errors.email ? "error" : ""}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            {renderFieldError("email")}
          </div>

          <div className="input-group">
            <input
              className={`form-input ${errors.first_name ? "error" : ""}`}
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ime"
              required
            />
            {renderFieldError("first_name")}
          </div>

          <div className="input-group">
            <input
              className={`form-input ${errors.last_name ? "error" : ""}`}
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Prezime"
              required
            />
            {renderFieldError("last_name")}
          </div>
        </>
      )}

      <button className="form-button" type="submit" disabled={loading}>
        {loading
          ? "Učitavanje..."
          : method === "login"
          ? "Prijavi se"
          : "Registruj se"}
      </button>
    </form>
  );
}

export default Form;
