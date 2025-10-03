import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import "../styles/Form.css";
import { useAuth } from "../contexts/AuthContext";
import { showError, showApiError, showLoginError } from "../utils/sweetAlert";

function Form({ route, method, onSuccess, onError }) {
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

    // Validacija za registraciju
    if (method === "register" && password !== password2) {
      await showError("Lozinke se ne poklapaju!");
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
        navigate("/login", { replace: true });
      }
    } catch (err) {
      console.error(err);

      if (method === "login") {
        await showLoginError(err);
      } else {
        await showApiError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>{method === "login" ? "Prijava" : "Registracija"}</h1>

      <input
        className="form-input"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Korisničko ime"
        required
      />
      <input
        className="form-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Lozinka"
        required
      />

      {method !== "login" && (
        <>
          <input
            className="form-input"
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="Potvrdi lozinku"
            required
          />
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (opciono)"
          />
          <input
            className="form-input"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ime (opciono)"
          />
          <input
            className="form-input"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Prezime (opciono)"
          />
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
