import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCurrentAuth } from "../services/api.js";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = getCurrentAuth();
  const [searchTerm, setSearchTerm] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const trimmedSearch = searchTerm.trim();
    navigate(trimmedSearch ? `/restaurants?search=${encodeURIComponent(trimmedSearch)}` : "/restaurants");
  }

  return (
    <section className="home-page">
      <div className="home-hero">
        <div className="home-copy">
          <p className="eyebrow">Real food. Real people. Real estimates.</p>
          <h1>Know the plate before you take the bite.</h1>
          <p>
            LocalBite helps you browse nearby restaurants, compare community calorie
            estimates, and add your own nutrition notes for menu items people actually order.
          </p>

          <form className="search-panel hero-search" onSubmit={handleSubmit}>
            <label>
              Search restaurants
              <input
                type="search"
                name="search"
                placeholder="Try a restaurant name"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <button type="submit">Search</button>
          </form>

          <div className="hero-actions">
            <Link className="button-link" to="/restaurants">
              Browse restaurants
            </Link>
            {!user && (
              <Link className="secondary-link" to="/login">
                Sign in to contribute
              </Link>
            )}
          </div>
        </div>

        <div className="home-flow-cards" aria-label="LocalBite workflows">
          <article>
            <p className="eyebrow">Browse</p>
            <p>Open restaurants and menu items to see estimates as a guest.</p>
          </article>
          <article>
            <p className="eyebrow">Contribute</p>
            <p>Submit calories, vote on helpful entries, and report suspicious estimates.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
