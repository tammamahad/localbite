import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import {
  deleteReportedSubmission,
  getCurrentAuth,
  getPendingReports,
  getReport,
  updateReportStatus,
} from "../services/api.js";

export default function AdminDashboardPage() {
  const { user } = getCurrentAuth();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeActionId, setActiveActionId] = useState(null);

  async function loadReports() {
    setIsLoading(true);
    setError("");

    try {
      const data = await getPendingReports();
      setReports(data);
      if (selectedReport && !data.some((report) => report.id === selectedReport.id)) {
        setSelectedReport(null);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      loadReports();
    } else {
      setIsLoading(false);
    }
  }, [user?.role]);

  async function handleViewDetails(reportId) {
    setMessage("");
    setError("");
    setIsLoadingDetails(true);

    try {
      const report = await getReport(reportId);
      setSelectedReport(report);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoadingDetails(false);
    }
  }

  async function handleMarkReviewed(reportId) {
    setMessage("");
    setError("");
    setActiveActionId(`review-${reportId}`);

    try {
      const updatedReport = await updateReportStatus(reportId, "reviewed");
      setSelectedReport(updatedReport);
      setMessage("Report marked as reviewed.");
      await loadReports();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActiveActionId(null);
    }
  }

  async function handleDeleteSubmission(submissionId) {
    setMessage("");
    setError("");
    setActiveActionId(`delete-${submissionId}`);

    try {
      await deleteReportedSubmission(submissionId);
      setSelectedReport(null);
      setMessage("Reported submission deleted.");
      await loadReports();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActiveActionId(null);
    }
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return (
      <section className="page-section">
        <p className="eyebrow">Moderation</p>
        <h1>Admin Dashboard</h1>
        <div className="empty-state">
          <p>Admin access is required for moderation.</p>
          <Link className="text-link" to="/">
            Back to home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <p className="eyebrow">Moderation</p>
      <h1>Admin Dashboard</h1>
      <p className="status-text">Review pending reports, inspect details, mark reports reviewed, or remove reported submissions.</p>

      {message && <p className="form-message success-message action-message">{message}</p>}
      {error && <p className="form-message error-message action-message">{error}</p>}

      <div className="admin-dashboard-grid">
        <div>
          <div className="section-heading">
            <h2>Pending Reports</h2>
            <button className="secondary-button" type="button" onClick={loadReports} disabled={isLoading}>
              Refresh
            </button>
          </div>

          {isLoading && <div className="empty-state"><p>Loading pending reports...</p></div>}

          {!isLoading && reports.length === 0 && (
            <div className="empty-state">
              <p>No pending reports. The moderation queue is clear.</p>
            </div>
          )}

          {!isLoading && reports.length > 0 && (
            <div className="item-list admin-list">
              {reports.map((report) => (
                <article className="submission-card" key={report.id}>
                  <div className="admin-card-header">
                    <span className="card-title">Report #{report.id}</span>
                    <span className="status-pill">{report.status}</span>
                  </div>
                  <p>{report.reason}</p>
                  <div className="vote-summary">
                    <span>Submission #{report.submission_id}</span>
                    <span>User #{report.user_id}</span>
                  </div>
                  <div className="form-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={isLoadingDetails}
                      onClick={() => handleViewDetails(report.id)}
                    >
                      View details
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={activeActionId === `review-${report.id}`}
                      onClick={() => handleMarkReviewed(report.id)}
                    >
                      Mark reviewed
                    </button>
                    <button
                      className="danger-button"
                      type="button"
                      disabled={activeActionId === `delete-${report.submission_id}`}
                      onClick={() => handleDeleteSubmission(report.submission_id)}
                    >
                      Delete submission
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="admin-detail-panel">
          <h2>Report Details</h2>
          {isLoadingDetails && <p className="status-text">Loading report details...</p>}
          {!isLoadingDetails && selectedReport ? (
            <div className="detail-list">
              <p><strong>Report ID:</strong> {selectedReport.id}</p>
              <p><strong>Status:</strong> {selectedReport.status}</p>
              <p><strong>Submission ID:</strong> {selectedReport.submission_id}</p>
              <p><strong>Reporter User ID:</strong> {selectedReport.user_id}</p>
              <p><strong>Reason:</strong> {selectedReport.reason}</p>
              <p><strong>Created:</strong> {new Date(selectedReport.created_at).toLocaleString()}</p>
              <div className="form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  disabled={activeActionId === `review-${selectedReport.id}`}
                  onClick={() => handleMarkReviewed(selectedReport.id)}
                >
                  Mark reviewed
                </button>
                <button
                  className="danger-button"
                  type="button"
                  disabled={activeActionId === `delete-${selectedReport.submission_id}`}
                  onClick={() => handleDeleteSubmission(selectedReport.submission_id)}
                >
                  Delete submission
                </button>
              </div>
            </div>
          ) : (
            !isLoadingDetails && <p className="status-text">Select a report to inspect its details.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
