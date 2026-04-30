import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerUser } from "../services/api.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const username = formData.username.trim();
    const email = formData.email.trim();

    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Enter a valid email address.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser({
        username,
        email,
        password: formData.password,
      });
      setMessage("Account created successfully. Redirecting...");
      navigate("/");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="register-page">
      <form className="register-card" onSubmit={handleSubmit}>
        <img src="/localbite-logo.png" alt="LocalBite" />
        <div className="register-card-intro">
          <p className="eyebrow">Join the table</p>
          <p>Add your local food knowledge.</p>
        </div>
        <h1>Register</h1>
        {error && <p className="form-message error-message">{error}</p>}
        {message && <p className="form-message success-message">{message}</p>}
        <label>
          Username
          <input type="text" name="username" autoComplete="username" minLength="3" required value={formData.username} onChange={handleChange} />
        </label>
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required value={formData.email} onChange={handleChange} />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="new-password" minLength="8" required value={formData.password} onChange={handleChange} />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
        <p className="auth-switch">
          Already have an account? <Link className="text-link" to="/login">Login</Link>
        </p>
      </form>
    </section>
  );
}
