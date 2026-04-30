import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import App from "./App.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MenuItemDetailPage from "./pages/MenuItemDetailPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import RestaurantDetailPage from "./pages/RestaurantDetailPage.jsx";
import RestaurantListPage from "./pages/RestaurantListPage.jsx";
import SubmitEstimatePage from "./pages/SubmitEstimatePage.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="restaurants" element={<RestaurantListPage />} />
          <Route path="restaurants/:restaurantId" element={<RestaurantDetailPage />} />
          <Route path="menu-items/:menuItemId" element={<MenuItemDetailPage />} />
          <Route path="menu-items/:menuItemId/submit" element={<SubmitEstimatePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="admin" element={<AdminDashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
