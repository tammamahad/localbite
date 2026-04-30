import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginUser } from "../services/api.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username_or_email: "",
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

    if (!formData.username_or_email.trim() || !formData.password) {
      setError("Enter both your username or email and your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await loginUser({
        username_or_email: formData.username_or_email.trim(),
        password: formData.password,
      });
      setMessage("Login successful. Redirecting...");
      navigate("/");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <img src="/localbite-logo.png" alt="LocalBite" />
        <div className="login-card-intro">
          <p className="eyebrow">Welcome back</p>
          <p>Keep the estimates moving.</p>
        </div>
        <h1>Login</h1>
        {error && <p className="form-message error-message">{error}</p>}
        {message && <p className="form-message success-message">{message}</p>}
        <label>
          Username or email
          <input type="text" name="username_or_email" autoComplete="username" required value={formData.username_or_email} onChange={handleChange} />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="current-password" required value={formData.password} onChange={handleChange} />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
        <p className="auth-switch">
          New to LocalBite? <Link className="text-link" to="/register">Create a free account</Link>
        </p>
      </form>
    </section>
  );
}
