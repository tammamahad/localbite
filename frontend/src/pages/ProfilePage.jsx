import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { getCurrentAuth, getCurrentUserSubmissions } from "../services/api.js";

export default function ProfilePage() {
  const { user } = getCurrentAuth();
  const userId = user?.id;
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadSubmissions() {
      if (!userId) {
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const data = await getCurrentUserSubmissions();
        if (isActive) {
          setSubmissions(data);
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadSubmissions();
    return () => {
      isActive = false;
    };
  }, [userId]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section className="page-section profile-page">
      <div className="page-intro">
        <p className="eyebrow">Profile</p>
        <h1>Hi, {user.username}</h1>
        <p>Member since {formatDate(user.created_at)}</p>
      </div>

      <div className="section-heading">
        <h2>My Submissions</h2>
      </div>

      {isLoading && <p className="status-text">Loading your submissions...</p>}
      {error && <p className="form-message error-message">{error}</p>}

      {!isLoading && !error && (
        submissions.length > 0 ? (
          <div className="profile-submission-list">
            {submissions.map((submission) => (
              <article className="submission-card profile-submission-card" key={submission.id}>
                <div>
                  <span className="card-title">{submission.menu_item_name}</span>
                  <p>{submission.restaurant_name}</p>
                </div>
                <div className="submission-stats">
                  <span>{submission.calories} cal</span>
                  <span>{formatDate(submission.created_at)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>You haven't submitted any estimates yet. Browse restaurants to get started.</p>
            <Link className="button-link" to="/restaurants">Browse restaurants</Link>
          </div>
        )
      )}
    </section>
  );
}

function formatDate(value) {
  if (!value) {
    return "recently";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
