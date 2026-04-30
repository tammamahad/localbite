import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { createSubmission, getCurrentAuth } from "../services/api.js";

const initialForm = {
  calories: "",
  protein_g: "",
  carbs_g: "",
  fat_g: "",
  justification: "",
};

export default function SubmitEstimatePage() {
  const { menuItemId } = useParams();
  const navigate = useNavigate();
  const { user } = getCurrentAuth();
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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

    const payload = {
      calories: Number(formData.calories),
      protein_g: Number(formData.protein_g),
      carbs_g: Number(formData.carbs_g),
      fat_g: Number(formData.fat_g),
      justification: formData.justification.trim(),
    };

    if (!user) {
      setError("Log in or register before submitting an estimate.");
      return;
    }

    if (
      formData.calories === "" ||
      formData.protein_g === "" ||
      formData.carbs_g === "" ||
      formData.fat_g === ""
    ) {
      setError("Enter calories, protein, carbs, and fat before submitting.");
      return;
    }

    if (
      !Number.isFinite(payload.calories) ||
      !Number.isFinite(payload.protein_g) ||
      !Number.isFinite(payload.carbs_g) ||
      !Number.isFinite(payload.fat_g)
    ) {
      setError("Calories and macros must be valid numbers.");
      return;
    }

    if (payload.calories < 0 || payload.protein_g < 0 || payload.carbs_g < 0 || payload.fat_g < 0) {
      setError("Calories and macros cannot be negative.");
      return;
    }

    if (!payload.justification) {
      setError("Add a short justification for your estimate.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createSubmission(menuItemId, payload);
      setFormData(initialForm);
      setMessage("Estimate submitted.");
      navigate(`/menu-items/${menuItemId}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-section">
      <p className="eyebrow">Community estimate</p>
      <h1>Submit Estimate</h1>
      {!user && (
        <p className="status-text">
          <Link className="text-link" to="/login">Log in</Link> or{" "}
          <Link className="text-link" to="/register">register</Link> before submitting an estimate.
        </p>
      )}
      <form className="form-panel" onSubmit={handleSubmit}>
        {error && <p className="form-message error-message">{error}</p>}
        {message && <p className="form-message success-message">{message}</p>}
        <label>
          Calories
          <input type="number" name="calories" min="0" required value={formData.calories} onChange={handleChange} />
        </label>
        <div className="form-grid">
          <label>
            Protein
            <input type="number" name="protein_g" min="0" step="0.1" required value={formData.protein_g} onChange={handleChange} />
          </label>
          <label>
            Carbs
            <input type="number" name="carbs_g" min="0" step="0.1" required value={formData.carbs_g} onChange={handleChange} />
          </label>
          <label>
            Fat
            <input type="number" name="fat_g" min="0" step="0.1" required value={formData.fat_g} onChange={handleChange} />
          </label>
        </div>
        <label>
          Justification
          <textarea name="justification" rows="4" required value={formData.justification} onChange={handleChange} />
        </label>
        <div className="form-actions">
          <button type="submit" disabled={isSubmitting || !user}>
            {isSubmitting ? "Submitting..." : "Submit estimate"}
          </button>
          <Link className="text-link" to={`/menu-items/${menuItemId}`}>
            Back to menu item
          </Link>
        </div>
      </form>
    </section>
  );
}
