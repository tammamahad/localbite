import { Outlet, useLocation } from "react-router-dom";

import Footer from "./components/Footer.jsx";
import Header from "./components/Header.jsx";

export default function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className="app-shell">
      {!isAuthPage && <Header />}
      <main className="page-content">
        <Outlet />
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}
