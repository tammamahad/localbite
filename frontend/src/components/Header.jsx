import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { clearAuthToken, getCurrentAuth } from "../services/api.js";

export default function Header() {
  const [auth, setAuth] = useState(getCurrentAuth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleAuthChanged() {
      setAuth(getCurrentAuth());
      setIsMenuOpen(false);
    }

    window.addEventListener("localbite-auth-changed", handleAuthChanged);
    window.addEventListener("storage", handleAuthChanged);
    return () => {
      window.removeEventListener("localbite-auth-changed", handleAuthChanged);
      window.removeEventListener("storage", handleAuthChanged);
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleLogout() {
    setIsMenuOpen(false);
    clearAuthToken();
    window.location.assign("/");
  }

  const user = auth.user;

  return (
    <header className="site-header">
      <div className="nav-left">
        <NavLink className="brand" to="/">
          <img src="/localbite-nav-logo.png" alt="LocalBite" />
        </NavLink>
        <nav className="nav-primary" aria-label="Primary navigation">
          <NavLink to="/restaurants">Restaurants</NavLink>
          {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
        </nav>
      </div>
      <nav className="nav-right" aria-label="Account navigation">
        {user ? (
          <div className="profile-menu" ref={menuRef}>
            <button className="nav-profile-button" type="button" onClick={() => setIsMenuOpen((current) => !current)}>
              Hi, {user.username} {isMenuOpen ? "▴" : "▾"}
            </button>
            {isMenuOpen && (
              <div className="profile-dropdown">
                <Link to="/profile" onClick={() => setIsMenuOpen(false)}>My Profile</Link>
                <button type="button" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
