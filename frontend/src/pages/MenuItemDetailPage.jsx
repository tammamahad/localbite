import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  createSubmission,
  getCurrentAuth,
  getMenuItem,
  getMenuItemBestEstimate,
  getMenuItemSubmissions,
  getRestaurant,
  reportSubmission,
  voteOnSubmission,
} from "../services/api.js";

const initialEstimateForm = {
  calories: "",
  protein_g: "",
  carbs_g: "",
  fat_g: "",
  justification: "",
};

export default function MenuItemDetailPage() {
  const { menuItemId } = useParams();
  const { user } = getCurrentAuth();
  const [menuItem, setMenuItem] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [bestEstimate, setBestEstimate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [bestEstimateMessage, setBestEstimateMessage] = useState("");
  const [estimateForm, setEstimateForm] = useState(initialEstimateForm);
  const [estimateMessage, setEstimateMessage] = useState("");
  const [estimateError, setEstimateError] = useState("");
  const [isSubmittingEstimate, setIsSubmittingEstimate] = useState(false);
  const [isEstimateFormOpen, setIsEstimateFormOpen] = useState(false);
  const [openReportForms, setOpenReportForms] = useState({});
  const [reportReasons, setReportReasons] = useState({});
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeActionId, setActiveActionId] = useState(null);

  async function loadMenuItemDetail({ showLoading = false } = {}) {
    if (showLoading) {
      setIsLoading(true);
    }
    setError("");
    setBestEstimateMessage("");

    try {
      const [menuItemData, submissionsData, bestEstimateData] = await Promise.all([
        getMenuItem(menuItemId),
        getMenuItemSubmissions(menuItemId),
        getMenuItemBestEstimate(menuItemId).catch((requestError) => {
          setBestEstimateMessage(requestError.message);
          return null;
        }),
      ]);
      const restaurantData = await getRestaurant(menuItemData.restaurant_id);
      setMenuItem(menuItemData);
      setRestaurant(restaurantData);
      setSubmissions(submissionsData);
      setBestEstimate(bestEstimateData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMenuItemDetail({ showLoading: true });
  }, [menuItemId]);

  function handleEstimateChange(event) {
    const { name, value } = event.target;
    setEstimateForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleEstimateSubmit(event) {
    event.preventDefault();
    setEstimateError("");
    setEstimateMessage("");

    const payload = {
      calories: Number(estimateForm.calories),
      protein_g: Number(estimateForm.protein_g),
      carbs_g: Number(estimateForm.carbs_g),
      fat_g: Number(estimateForm.fat_g),
      justification: estimateForm.justification.trim(),
    };

    if (
      estimateForm.calories === "" ||
      estimateForm.protein_g === "" ||
      estimateForm.carbs_g === "" ||
      estimateForm.fat_g === ""
    ) {
      setEstimateError("Enter calories, protein, carbs, and fat before submitting.");
      return;
    }

    if (
      !Number.isFinite(payload.calories) ||
      !Number.isFinite(payload.protein_g) ||
      !Number.isFinite(payload.carbs_g) ||
      !Number.isFinite(payload.fat_g)
    ) {
      setEstimateError("Calories and macros must be valid numbers.");
      return;
    }

    if (payload.calories < 0 || payload.protein_g < 0 || payload.carbs_g < 0 || payload.fat_g < 0) {
      setEstimateError("Calories and macros cannot be negative.");
      return;
    }

    if (!payload.justification) {
      setEstimateError("Add a short justification for your estimate.");
      return;
    }

    setIsSubmittingEstimate(true);
    try {
      await createSubmission(menuItemId, payload);
      setEstimateForm(initialEstimateForm);
      setEstimateMessage("Estimate submitted.");
      setIsEstimateFormOpen(false);
      await loadMenuItemDetail();
    } catch (requestError) {
      setEstimateError(requestError.message);
    } finally {
      setIsSubmittingEstimate(false);
    }
  }

  async function handleVote(submissionId, voteType) {
    setActionError("");
    setActionMessage("");
    setActiveActionId(`${submissionId}-${voteType}`);

    try {
      await voteOnSubmission(submissionId, voteType);
      setActionMessage("Vote saved.");
      await loadMenuItemDetail();
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setActiveActionId(null);
    }
  }

  async function handleReportSubmit(event, submissionId) {
    event.preventDefault();
    setActionError("");
    setActionMessage("");

    const reason = (reportReasons[submissionId] || "").trim();
    if (reason.length < 5) {
      setActionError("Enter a brief reason before reporting.");
      return;
    }

    setActiveActionId(`${submissionId}-report`);
    try {
      await reportSubmission(submissionId, reason);
      setReportReasons((currentReasons) => ({
        ...currentReasons,
        [submissionId]: "",
      }));
      setOpenReportForms((currentForms) => ({
        ...currentForms,
        [submissionId]: false,
      }));
      setActionMessage("Report submitted.");
      await loadMenuItemDetail();
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setActiveActionId(null);
    }
  }

  function handleReportReasonChange(submissionId, value) {
    setReportReasons((currentReasons) => ({
      ...currentReasons,
      [submissionId]: value,
    }));
  }

  function toggleReportForm(submissionId) {
    setOpenReportForms((currentForms) => ({
      ...currentForms,
      [submissionId]: !currentForms[submissionId],
    }));
  }

  function renderLoggedOutMessage() {
    return (
      <p className="status-text">
        <Link className="text-link" to="/login">Log in</Link> or{" "}
        <Link className="text-link" to="/register">register</Link> to submit estimates, vote, or report submissions.
      </p>
    );
  }

  return (
    <section className="page-section menu-item-page">
      {menuItem && (
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/restaurants">Restaurants</Link>
          <span>&gt;</span>
          {restaurant ? (
            <Link to={`/restaurants/${restaurant.id}`}>{restaurant.name}</Link>
          ) : (
            <span>Restaurant</span>
          )}
          <span>&gt;</span>
          <span>{menuItem.name}</span>
        </nav>
      )}
      <p className="eyebrow">Menu item</p>
      <h1>{menuItem?.name || "Menu Item Details"}</h1>

      {isLoading && <div className="empty-state"><p>Loading menu item...</p></div>}
      {error && <div className="empty-state"><p>{error}</p></div>}

      {!isLoading && !error && menuItem && (
        <>
          <div className="menu-description">
            <p>{menuItem.description}</p>
          </div>

          <div className="section-heading">
            <h2>Best Estimate</h2>
          </div>

          {bestEstimate ? (
            <div className="stat-grid">
              <div className="stat-card">
                <span>Calories</span>
                <strong>{bestEstimate.calories}</strong>
              </div>
              <div className="stat-card">
                <span>Protein</span>
                <strong>{bestEstimate.protein_g}g</strong>
              </div>
              <div className="stat-card">
                <span>Carbs</span>
                <strong>{bestEstimate.carbs_g}g</strong>
              </div>
              <div className="stat-card">
                <span>Fat</span>
                <strong>{bestEstimate.fat_g}g</strong>
              </div>
              <p className="estimate-note">
                Based on {bestEstimate.included_submission_count} of {bestEstimate.submission_count} submissions.
              </p>
            </div>
          ) : (
            <div className="empty-state community-empty-state">
              <p>No community estimates yet — be the first to contribute!</p>
            </div>
          )}

          <div className="section-heading">
            <h2>Submit Estimate</h2>
          </div>

          {user ? (
            <div className="estimate-submit-section">
              <button className="estimate-toggle-button" type="button" onClick={() => setIsEstimateFormOpen((current) => !current)}>
                {isEstimateFormOpen ? "Cancel" : "Submit an Estimate"}
              </button>
              {estimateError && <p className="form-message error-message">{estimateError}</p>}
              {estimateMessage && <p className="form-message success-message">{estimateMessage}</p>}
              {isEstimateFormOpen && (
                <form className="form-panel compact-form estimate-form" onSubmit={handleEstimateSubmit}>
                  <div className="estimate-number-grid">
                    <label>
                      Calories
                      <input type="number" name="calories" min="0" required value={estimateForm.calories} onChange={handleEstimateChange} />
                    </label>
                    <label>
                      Protein
                      <input type="number" name="protein_g" min="0" step="0.1" required value={estimateForm.protein_g} onChange={handleEstimateChange} />
                    </label>
                    <label>
                      Carbs
                      <input type="number" name="carbs_g" min="0" step="0.1" required value={estimateForm.carbs_g} onChange={handleEstimateChange} />
                    </label>
                    <label>
                      Fat
                      <input type="number" name="fat_g" min="0" step="0.1" required value={estimateForm.fat_g} onChange={handleEstimateChange} />
                    </label>
                  </div>
                  <label>
                    Justification
                    <textarea name="justification" rows="3" required value={estimateForm.justification} onChange={handleEstimateChange} />
                  </label>
                  <button type="submit" disabled={isSubmittingEstimate}>
                    {isSubmittingEstimate ? "Submitting..." : "Submit estimate"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            renderLoggedOutMessage()
          )}

          <h2 className="community-submissions-heading">Community Submissions</h2>
          {actionError && <p className="form-message error-message action-message">{actionError}</p>}
          {actionMessage && <p className="form-message success-message action-message">{actionMessage}</p>}
          <div className="item-list">
            {submissions.length > 0 ? (
              submissions.map((submission) => (
                <article className="submission-card" key={submission.id}>
                  <div className="submission-stats">
                    <span>{submission.calories} cal</span>
                    <span>{submission.protein_g}g protein</span>
                    <span>{submission.carbs_g}g carbs</span>
                    <span>{submission.fat_g}g fat</span>
                  </div>
                  <p className="submission-author">Submitted by {submission.username || `User #${submission.user_id}`}</p>
                  <p>{submission.justification}</p>
                  <div className="vote-summary">
                    <span>{submission.helpful_count} helpful</span>
                    <span>{submission.not_helpful_count} not helpful</span>
                  </div>
                  {user ? (
                    <div className="submission-actions">
                      <div className="vote-actions">
                        <button className="secondary-button" type="button" disabled={activeActionId === `${submission.id}-helpful`} onClick={() => handleVote(submission.id, "helpful")}>
                          Helpful
                        </button>
                        <button className="secondary-button" type="button" disabled={activeActionId === `${submission.id}-not_helpful`} onClick={() => handleVote(submission.id, "not_helpful")}>
                          Not helpful
                        </button>
                        <button className="secondary-button" type="button" onClick={() => toggleReportForm(submission.id)}>
                          {openReportForms[submission.id] ? "Cancel Report" : "Report Estimate"}
                        </button>
                      </div>
                      {openReportForms[submission.id] && (
                        <form className="report-form" onSubmit={(event) => handleReportSubmit(event, submission.id)}>
                          <label>
                            Report reason
                            <input type="text" required value={reportReasons[submission.id] || ""} onChange={(event) => handleReportReasonChange(submission.id, event.target.value)} />
                          </label>
                          <button className="secondary-button" type="submit" disabled={activeActionId === `${submission.id}-report`}>
                            Report
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    renderLoggedOutMessage()
                  )}
                </article>
              ))
            ) : (
              <div className="empty-state community-empty-state">
                <p>No community estimates yet — be the first to contribute!</p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
